const KEY='3s.preview.functional.v03';

export function load(){
  try{
    const s=JSON.parse(localStorage.getItem(KEY)||'null');
    return s&&s.version===1?s:{version:1,objects:[],activeId:null};
  }catch{return {version:1,objects:[],activeId:null};}
}
export function save(s){localStorage.setItem(KEY,JSON.stringify(s));return s;}
export function reset(){localStorage.removeItem(KEY);}

function now(){return new Date().toISOString();}
function id(){return 'SO-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);}

export function createObject(){
  const s=load();
  const o={
    id:id(), title:'まだ名前のないStatus', state:'DRAFT', audience:'PRIVATE',
    createdAt:now(), updatedAt:now(), source:'SELF', fragments:[], history:[]
  };
  s.objects.unshift(o); s.activeId=o.id; save(s); return o;
}

export function getObject(objectId){
  return load().objects.find(x=>x.id===objectId)||null;
}
export function activeObject(){
  const s=load(); return s.objects.find(x=>x.id===s.activeId)||s.objects[0]||null;
}
export function listObjects(){return load().objects;}

export function addFragment(objectId,fragment){
  const s=load(); const o=s.objects.find(x=>x.id===objectId); if(!o)return null;
  const prev=JSON.parse(JSON.stringify(o));
  o.fragments.push({
    id:'F-'+(o.fragments.length+1), createdAt:now(), source:'SELF',
    ...fragment
  });
  o.updatedAt=now();
  o.history.push({at:now(),type:'FRAGMENT_ADDED',before:prev.fragments.length,after:o.fragments.length});
  if(o.fragments.length>=3)o.state='OWNED';
  deriveTitle(o); save(s); return o;
}

function deriveTitle(o){
  const a=o.fragments.find(f=>f.key==='immersion');
  const b=o.fragments.find(f=>f.key==='style');
  if(a?.value){
    const core=String(a.value).replace(/[。！？!?]/g,'').slice(0,18);
    o.title=b?.value?core+' / '+b.value:core;
  }
}

export function reviseFragment(objectId,fragmentId,value){
  const s=load(); const o=s.objects.find(x=>x.id===objectId); if(!o)return null;
  const f=o.fragments.find(x=>x.id===fragmentId); if(!f)return null;
  const before=f.value; f.value=value; f.correctedAt=now(); o.updatedAt=now();
  o.history.push({at:now(),type:'OWNER_CORRECTION',fragmentId,before,after:value});
  deriveTitle(o); save(s); return o;
}

export function setAudience(objectId,audience){
  if(!['PRIVATE','FRIEND','PUBLIC'].includes(audience))return null;
  const s=load(); const o=s.objects.find(x=>x.id===objectId); if(!o)return null;
  const before=o.audience; o.audience=audience; o.updatedAt=now();
  o.history.push({at:now(),type:'PROJECTION_CHANGED',before,after:audience});
  save(s); return o;
}

export function setActive(objectId){
  const s=load(); if(s.objects.some(x=>x.id===objectId)){s.activeId=objectId;save(s);return true;} return false;
}

export function projectedSummary(o){
  if(!o||o.audience==='PRIVATE')return null;
  return {
    id:o.id,title:o.title,audience:o.audience,state:o.state,
    fragments:o.fragments
      .filter(f=>!f.privateOnly)
      .map(f=>({label:f.label,value:f.value,kind:f.kind}))
  };
}
