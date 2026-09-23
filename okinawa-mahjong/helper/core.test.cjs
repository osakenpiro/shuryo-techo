'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {score,countFu,FU}=require('./core.js');
const yaku=require('./yaku.js');
const base={dealer:false,win:'ron',han:1,fu:30,hasYaku:true};
// Independently transcribed payment fixtures. Kiriage OFF. Values are points, not base points.
// WRC 2025 p.53 table cross-check (its kiriage cells are tested separately).
const ron={
  25:[[0,1600,3200,6400],[0,2400,4800,9600]],
  30:[[1000,2000,3900,7700],[1500,2900,5800,11600]],
  40:[[1300,2600,5200,8000],[2000,3900,7700,12000]],
  50:[[1600,3200,6400,8000],[2400,4800,9600,12000]],
  60:[[2000,3900,7700,8000],[2900,5800,11600,12000]],
  70:[[2300,4500,8000,8000],[3400,6800,12000,12000]],
  80:[[2600,5200,8000,8000],[3900,7700,12000,12000]],
  90:[[2900,5800,8000,8000],[4400,8700,12000,12000]],
  100:[[3200,6400,8000,8000],[4800,9600,12000,12000]],
  110:[[3600,7100,8000,8000],[5300,10600,12000,12000]]
};
for(const [fu,sides] of Object.entries(ron)) for(const [i,values] of sides.entries())
  values.forEach((points,j)=>{if(points)test(`ron ${i?'dealer':'child'} ${j+1}han ${fu}fu`,()=>assert.equal(score({...base,dealer:!!i,han:j+1,fu:+fu}).paid,points));});
// Each entry is [other child, dealer] per payer. Dealer wins use the second amount x 3.
const tsumo={
  20:[null,[400,700],[700,1300],[1300,2600]],
  25:[null,null,[800,1600],[1600,3200]],
  30:[[300,500],[500,1000],[1000,2000],[2000,3900]],
  40:[[400,700],[700,1300],[1300,2600],[2000,4000]],
  50:[[400,800],[800,1600],[1600,3200],[2000,4000]],
  60:[[500,1000],[1000,2000],[2000,3900],[2000,4000]],
  70:[[600,1200],[1200,2300],[2000,4000],[2000,4000]],
  80:[[700,1300],[1300,2600],[2000,4000],[2000,4000]],
  90:[[800,1500],[1500,2900],[2000,4000],[2000,4000]],
  100:[[800,1600],[1600,3200],[2000,4000],[2000,4000]],
  110:[null,[1800,3600],[2000,4000],[2000,4000]]
};
for(const [fu,values] of Object.entries(tsumo)) values.forEach((p,i)=>{if(p)for(const dealer of [false,true])test(`tsumo ${dealer?'dealer':'child'} ${i+1}han ${fu}fu`,()=>{
  const r=score({...base,dealer,win:'tsumo',han:i+1,fu:+fu});
  assert.deepEqual(r.payments.map(x=>[x.count,x.points]),dealer?[[3,p[1]]]:[[1,p[1]],[2,p[0]]]);
  assert.equal(r.paid,dealer?p[1]*3:p[1]+2*p[0]);
});});
for(const [han,child,dealer] of [[5,8000,12000],[6,12000,18000],[7,12000,18000],[8,16000,24000],[10,16000,24000],[11,24000,36000],[12,24000,36000],[13,32000,48000],[26,32000,48000],[99,32000,48000]])test(`limit ${han} han`,()=>{
  assert.equal(score({...base,han,fu:null}).paid,child);
  assert.equal(score({...base,han,fu:null,dealer:true}).paid,dealer);
});
for(let m=1;m<=6;m++)test(`explicit ${m}x yakuman`,()=>{
  for(const dealer of [false,true])for(const win of ['ron','tsumo']){
    const r=score({dealer,win,yakuman:m});assert.equal(r.paid,m*(dealer?48000:32000));
  }
});
test('kiriage modifies exactly 4/30 and 3/60 non-limit cells',()=>{
  for(const [han,fu] of [[4,30],[3,60]]){
    assert.equal(score({...base,han,fu}).paid,7700);
    assert.equal(score({...base,han,fu,kiriage:true}).paid,8000);
    assert.equal(score({...base,han,fu,dealer:true,kiriage:true}).paid,12000);
    assert.deepEqual(score({...base,han,fu,win:'tsumo',kiriage:true}).payments.map(p=>p.points),[4000,2000]);
  }
  assert.equal(score({...base,han:3,fu:40,kiriage:true}).paid,5200);
});
test('kazoe off caps at sanbaiman, explicit yakuman unaffected',()=>{
  assert.equal(score({...base,han:13,kazoe:false}).paid,24000);
  assert.equal(score({...base,han:26,kazoe:false,dealer:true}).paid,36000);
  assert.equal(score({...base,yakuman:2,kazoe:false}).paid,64000);
});
test('independent honba and deposits example',()=>{
  const r=score({...base,han:2,fu:20,win:'tsumo',honba:2,sticks:3});
  assert.deepEqual(r.payments.map(p=>[p.count,p.points]),[[1,900],[2,600]]);
  assert.equal(r.paid,2100);assert.equal(r.deposit,3000);assert.equal(r.total,5100);
});
test('conservation/rounding properties across legal manual domain',()=>{
  let count=0;
  for(const dealer of [false,true])for(const win of ['ron','tsumo'])for(let han=1;han<=14;han++)for(const fu of FU){
    let r;try{r=score({...base,dealer,win,han,fu});}catch{continue;}
    const extra=score({...base,dealer,win,han,fu,honba:7,sticks:9});
    assert.equal(r.total,r.payments.reduce((s,p)=>s+p.points*p.count,0));
    assert.ok(r.payments.every(p=>p.points%100===0&&p.points>0));
    assert.equal(extra.paid-r.paid,2100);assert.equal(extra.total-r.total,11100);
    assert.equal(extra.payments.length,r.payments.length);count++;
  }
  assert.equal(count,598);
});
const invalid=[
  {han:0},{han:-1},{han:1.2},{han:NaN},{han:Infinity},{han:'2'},{han:100},
  {fu:0},{fu:35},{fu:'30'},{fu:20},{fu:25},{win:'tsumo',fu:20},{win:'tsumo',fu:25,han:2},
  {win:'tsumo',fu:110,han:1},{hasYaku:false},{hasYaku:'yes'},{dealer:1},{win:'draw'},
  {honba:-1},{honba:1.1},{honba:NaN},{honba:100},{sticks:-1},{sticks:100},{sticks:'1'},
  {yakuman:7},{yakuman:1.5},{kiriage:1},{kazoe:'on'}
];
invalid.forEach((v,i)=>test(`reject invalid score ${i+1}: ${JSON.stringify(v)}`,()=>assert.throws(()=>score({...base,...v}))));
test('input objects are not mutated',()=>{const input={...base};score(input);assert.deepEqual(input,base);});
const f=(v={})=>countFu({shape:'standard',closed:false,win:'ron',pair:0,wait:'ryanmen',groups:['seq','seq','seq','seq'],...v});
for(const [shape,win,fu] of [['pinfu','ron',30],['pinfu','tsumo',20],['chiitoi','ron',25],['chiitoi','tsumo',25]])test(`${shape} ${win} fixed fu`,()=>{
  assert.equal(countFu({shape,win}).fu,fu);assert.throws(()=>countFu({shape,win,closed:false}));
});
test('all sequences automatic pinfu vs open 30 floor',()=>{
  assert.equal(f().fu,30);assert.equal(f({win:'tsumo'}).fu,30);
  assert.equal(f({closed:true,win:'tsumo'}).fu,20);assert.equal(f({closed:true}).fu,30);
});
const groups={pon2:2,pon19:4,anko2:4,anko19:8,kan2:8,kan19:16,ankan2:16,ankan19:32};
for(const [g,value] of Object.entries(groups))test(`fu group ${g}`,()=>{
  const r=f({groups:[g,'seq','seq','seq']});assert.equal(r.raw,20+value);assert.equal(r.fu,Math.max(30,Math.ceil((20+value)/10)*10));
});
test('closed ron 10 fu and ron-completed triplet counted open',()=>{
  const r=f({closed:true,wait:'shanpon',groups:['ron19','seq','seq','seq']});
  assert.equal(r.raw,34);assert.equal(r.fu,40);
  const t=f({closed:true,win:'tsumo',wait:'shanpon',groups:['anko19','seq','seq','seq']});
  assert.equal(t.raw,30);assert.equal(t.fu,30);
});
test('double-wind pair 2/4 can change rounded result',()=>{
  assert.equal(f({groups:['anko19','seq','seq','seq'],pair:2}).fu,30);
  assert.equal(f({groups:['anko19','seq','seq','seq'],pair:4}).fu,40);
});
for(const wait of ['kanchan','penchan','tanki'])test(`${wait} adds 2 fu`,()=>assert.equal(f({wait}).raw,22));
test('closed ron without pinfu rounds 32 up to 40',()=>assert.equal(f({closed:true,wait:'kanchan'}).fu,40));
const fuInvalid=[
 {shape:'bad'},{closed:1},{win:'draw'},{pair:3},{wait:'bad'},{groups:[]},
 {groups:['bad','seq','seq','seq']},{closed:true,groups:['pon2','seq','seq','seq']},
 {wait:'shanpon'}, {groups:['ron2','seq','seq','seq']},
 {win:'tsumo',wait:'shanpon',groups:['ron2','seq','seq','seq']},
 {wait:'shanpon',groups:['ron2','ron19','seq','seq']}
];
fuInvalid.forEach((v,i)=>test(`reject inconsistent fu ${i+1}`,()=>assert.throws(()=>f(v))));
test('role catalog schema and original tile fragments',()=>{
  assert.equal(yaku.length,39);assert.equal(new Set(yaku.map(y=>y.id)).size,39);
  assert.equal(yaku.filter(y=>y.common).length,8);assert.equal(yaku.filter(y=>y.han===0).length,12);
  for(const y of yaku){
    assert.ok(y.name&&y.reading&&y.summary&&y.note);const counts={};
    for(const group of y.tiles.split(' ').filter(Boolean)){
      assert.match(group,/^(?:[1-9]+[mps]|[1-7]+z)$/);
      for(const d of group.slice(0,-1)){const key=d+group.slice(-1);counts[key]=(counts[key]||0)+1;assert.ok(counts[key]<=4);}
    }
  }
  assert.equal(yaku.find(y=>y.id==='chinitsu').open,5);
  assert.equal(yaku.find(y=>y.id==='pinfu').open,-1);
});
