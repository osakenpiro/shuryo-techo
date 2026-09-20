// No network or storage side effects. Shared payloads stay separate from local books.
export const HUNTERS = Object.freeze(['osakenpiro', 'keuita', 'serket', 'zushi']);
export const LOCAL_KEY = 'mhwi-equipment-requests-v1';
export const MAX_BYTES = 180000;
export const clone = value => JSON.parse(JSON.stringify(value));
export function check(condition, message) { if (!condition) throw new Error(message); }
export function encode(value) {
  const text = JSON.stringify(value);
  check(new TextEncoder().encode(text).length <= MAX_BYTES, '帳面が大きすぎます。180 KB以下にしてください。');
  return text;
}
const text = (v, n) => typeof v === 'string' && v.length <= n;
const count = v => v === null || (Number.isSafeInteger(v) && v >= 0 && v <= 1e9);
export function validateBook(input, hunterId) {
  check(HUNTERS.includes(hunterId) && input?.id === hunterId, 'ログインした本人の帳面だけ移せます。');
  check(Array.isArray(input.requests) && input.requests.length <= 150, '依頼は150件までです。');
  check(input.stock && typeof input.stock === 'object' && !Array.isArray(input.stock), '素材在庫の形式を確認してください。');
  check(Object.keys(input.stock).length <= 1000, '素材在庫が多すぎます。');
  for (const [k, v] of Object.entries(input.stock)) {
    check(text(k,100) && !['__proto__','prototype','constructor'].includes(k) && count(v), '素材名・所持数を確認してください。');
  }
  const ids = new Set();
  for (const r of input.requests) {
    check(r && text(r.id,150) && r.id && !ids.has(r.id), '依頼IDがないか重複しています。'); ids.add(r.id);
    check([1,2,3].includes(r.priority) && typeof r.done === 'boolean' && text(r.memo ?? '', 10000), '依頼の優先度・メモ・完成状態を確認してください。');
    check(r.custom || text(r.itemId,150), '装備の参照がありません。');
    if (r.custom) {
      const c=r.custom;
      check(text(c.name,100) && c.name && Array.isArray(c.mats) && c.mats.length<=30, '自由依頼の形式を確認してください。');
      check(count(c.price ?? null), '費用を確認してください。');
      for (const m of c.mats) check(Array.isArray(m) && text(m[0],100) && m[0] && Number.isSafeInteger(m[1]) && m[1]>0 && m[1]<=1e9 && text(m[2]??'',150), '自由依頼の素材を確認してください。');
    }
  }
  const result=clone(input);result.name=hunterId;
  encode(result);return result;
}
export function validatePlan(input) {
  check(Array.isArray(input) && input.length<=100, '段取りは100件までです。');
  const ids=new Set();
  for(const p of input) {
    check(p && text(p.id,150) && p.id && !ids.has(p.id) && text(p.title,150) && p.title && text(p.note??'',2000) && typeof p.done==='boolean', '段取りの形式を確認してください。');ids.add(p.id);
  }
  encode(input);return clone(input);
}
export function migrationFromLocal(raw, hunterId) {
  const s=typeof raw==='string'?JSON.parse(raw):raw;
  check(s?.version===1 && Array.isArray(s.hunters), 'この形式の帳面は移行できません。');
  const candidates=s.hunters.filter(h=>h.id===hunterId);
  check(candidates.length===1, '本人の帳面が見つからないか重複しています。');
  // Never include other hunters or mixed/shared plans in personal migration.
  return validateBook(candidates[0],hunterId);
}
export function blankBook(hunterId) { check(HUNTERS.includes(hunterId),'未登録のハンターです。');return {id:hunterId,name:hunterId,stamp:'未記入',stock:{},requests:[]}; }
export function initialBook(hunterId, items) {
  const h=blankBook(hunterId);if(hunterId!=='osakenpiro')return h;
  h.stamp='2026/09/20 スクショ時点の初期記録';
  h.stock={'砕竜の撃滅拳':2,'砕竜の弾頭殻':3,'不壊の黒曜甲':4,'不滅の炉心殻':0,'ゼニー':20218};
  h.requests=items.map(i=>({id:(i.id==='fatalis-sa-set'?'osakenpiro-':'osada-')+i.id,itemId:i.id,memo:i.note??'',priority:i.id==='fatalis-sa-set'?1:2,done:false,baseReady:null}));
  return validateBook(h,hunterId);
}
export class ConflictError extends Error {constructor(){super('別の端末で更新されました。あなたの下書きは保持しています。共有側を確認してから編集し直してください。');this.name='ConflictError';}}
export function revisionNext(current, expectedRevision) {
  const revision=current?.revision??0;
  if(revision!==expectedRevision)throw new ConflictError();
  return revision+1;
}
// Used by the actual browser and emulator tests, not a separate mock algorithm.
export async function saveRevision(api, db, ref, expectedRevision, payload, uid) {
  const content=encode(payload);
  return api.runTransaction(db,async tx=>{
    const snap=await tx.get(ref);const old=snap.exists()?snap.data():null;
    const revision=revisionNext(old,expectedRevision);
    tx.set(ref,{schema:1,revision,content,updatedBy:uid,updatedAt:api.serverTimestamp()});
    return revision;
  });
}
