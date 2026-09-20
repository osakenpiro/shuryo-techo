import {test,before,beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import * as f from 'firebase/firestore';
import {saveRevision,blankBook,HUNTERS} from './core.mjs';
let env;const clients=new Map();
const token={email_verified:true,firebase:{sign_in_provider:'google.com'}};
function db(h){if(!clients.has(h))clients.set(h,env.authenticatedContext('test-'+h,token).firestore());return clients.get(h);}
const book=(d,h)=>f.doc(d,'mhRooms','mh4','hunters',h);
const route=d=>f.doc(d,'mhRooms','mh4','plans','today');
const envelope=(h,revision=1,content='{}')=>({schema:1,revision,content,updatedBy:'test-'+h,updatedAt:f.serverTimestamp()});
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-mh-wishlist',firestore:{host:'127.0.0.1',port:8180,rules:readFileSync(new URL('./firestore.rules',import.meta.url),'utf8')}});});
beforeEach(async()=>{clients.clear();await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{const d=c.firestore();for(const h of HUNTERS)await f.setDoc(f.doc(d,'mhRooms','mh4','members','test-'+h),{hunterId:h,active:true});});});
after(async()=>{await env?.cleanup();});
test('owner creates own book and all four members can read it',async()=>{const a=db('osakenpiro');await saveRevision(f,a,book(a,'osakenpiro'),0,blankBook('osakenpiro'),'test-osakenpiro');for(const h of HUNTERS)await assertSucceeds(f.getDoc(book(db(h),'osakenpiro')));});
test('anonymous, outsider and unverified accounts cannot read',async()=>{
  await assertFails(f.getDoc(book(env.unauthenticatedContext().firestore(),'osakenpiro')));
  await assertFails(f.getDoc(book(db('outsider'),'osakenpiro')));
  await assertFails(f.getDoc(book(env.authenticatedContext('test-osakenpiro',{...token,email_verified:false}).firestore(),'osakenpiro')));
});
test('friend cannot create/update another hunter or forge a membership',async()=>{
  const s=db('serket');await assertFails(f.setDoc(book(s,'osakenpiro'),envelope('serket')));
  const a=db('osakenpiro');await assertSucceeds(f.setDoc(book(a,'osakenpiro'),envelope('osakenpiro')));
  await assertFails(f.setDoc(book(s,'osakenpiro'),envelope('serket',2)));
  await assertFails(f.setDoc(f.doc(s,'mhRooms','mh4','members','test-serket'),{hunterId:'osakenpiro',active:true}));
  await assertFails(f.setDoc(f.doc(s,'mhRooms','mh4','members','test-outsider'),{hunterId:'osakenpiro',active:true}));
});
test('outsider cannot self-register or read the list of memberships',async()=>{const d=db('outsider');await assertFails(f.setDoc(f.doc(d,'mhRooms','mh4','members','test-outsider'),{hunterId:'osakenpiro',active:true}));await assertFails(f.getDocs(f.collection(db('serket'),'mhRooms','mh4','members')));});
test('membership in one room is not permission for another',async()=>await assertFails(f.getDoc(f.doc(db('serket'),'mhRooms','other','plans','today'))));
test('all four can change the shared plan',async()=>{let rev=0;for(const h of HUNTERS){const d=db(h);rev=await saveRevision(f,d,route(d),rev,[{id:'p',title:h,note:'',done:false}], 'test-'+h);}assert.equal(rev,4);});
test('spoofed author, wrong schema, extra field, oversized content and wrong revision reject',async()=>{
  const d=db('osakenpiro'),r=book(d,'osakenpiro');
  await assertFails(f.setDoc(r,{...envelope('osakenpiro'),updatedBy:'test-serket'}));await assertFails(f.setDoc(r,{...envelope('osakenpiro'),schema:2}));await assertFails(f.setDoc(r,{...envelope('osakenpiro'),admin:true}));await assertFails(f.setDoc(r,envelope('osakenpiro',1,'x'.repeat(180001))));await assertFails(f.setDoc(r,envelope('osakenpiro',2)));
  await assertSucceeds(f.setDoc(r,envelope('osakenpiro')));await assertFails(f.setDoc(r,envelope('osakenpiro',1)));await assertFails(f.setDoc(r,envelope('osakenpiro',3)));await assertFails(f.deleteDoc(r));
});
test('two-client listener receives another client update',async()=>{
  const a=db('osakenpiro'),b=db('keuita');let off;
  const received=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{off?.();reject(Error('listener timeout'));},12000);off=f.onSnapshot(book(b,'osakenpiro'),s=>{if(s.exists()&&s.data().revision===1){clearTimeout(timer);off();resolve(s.data());}},error=>{clearTimeout(timer);reject(error);});});
  const h=blankBook('osakenpiro');h.stock['砕竜の撃滅拳']=3;await saveRevision(f,a,book(a,'osakenpiro'),0,h,'test-osakenpiro');const got=await received;assert.equal(JSON.parse(got.content).stock['砕竜の撃滅拳'],3);
});
test('two-device competing edits have one winner and one explicit conflict',async()=>{
  const a=db('osakenpiro'),b=env.authenticatedContext('test-osakenpiro',token).firestore();await saveRevision(f,a,book(a,'osakenpiro'),0,blankBook('osakenpiro'),'test-osakenpiro');
  const left=blankBook('osakenpiro'),right=blankBook('osakenpiro');left.stock.gold=5;right.stock.gold=8;
  const result=await Promise.allSettled([saveRevision(f,a,book(a,'osakenpiro'),1,left,'test-osakenpiro'),saveRevision(f,b,book(b,'osakenpiro'),1,right,'test-osakenpiro')]);
  assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.equal(result.filter(r=>r.status==='rejected'&&r.reason.name==='ConflictError').length,1);assert.equal((await f.getDoc(book(a,'osakenpiro'))).data().revision,2);
});
test('duplicate migration cannot overwrite shared edits',async()=>{const a=db('osakenpiro'),h=blankBook('osakenpiro');h.stock.kept=17;await saveRevision(f,a,book(a,h.id),0,h,'test-osakenpiro');await assert.rejects(()=>saveRevision(f,a,book(a,h.id),0,blankBook(h.id),'test-osakenpiro'),{name:'ConflictError'});assert.equal(JSON.parse((await f.getDoc(book(a,h.id))).data().content).stock.kept,17);});
test('revoked member cannot read or write even if token is still valid',async()=>{await env.withSecurityRulesDisabled(c=>f.updateDoc(f.doc(c.firestore(),'mhRooms','mh4','members','test-serket'),{active:false}));await assertFails(f.getDoc(book(db('serket'),'osakenpiro')));await assertFails(f.setDoc(route(db('serket')),envelope('serket')));});
