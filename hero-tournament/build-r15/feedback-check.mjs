// Deterministic presentation classification; this is not native gameplay or human fun evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const [stage,output]=process.argv.slice(2);
const {FEEL,beatCue,finalCue}=await import(pathToFileURL(path.resolve(stage,'game/battle-feedback.js')));
let checks=0;const check=(test)=>{test();checks++;};
check(()=>assert.deepEqual([FEEL.secondBeatMs,FEEL.completeMs],[650,1350]));
check(()=>assert.equal(beatCue({}).kind,'quiet'));
check(()=>assert.equal(beatCue({dealt:3,taken:0}).kind,'hit'));
check(()=>assert.equal(beatCue({dealt:0,taken:3}).kind,'hit'));
check(()=>assert.equal(beatCue({guarded:true,taken:2}).kind,'guard'));
check(()=>assert.equal(beatCue({foeGuarded:true,dealt:2}).kind,'guard'));
check(()=>assert.equal(beatCue({counterSpent:4,dealt:0}).counter,false));
check(()=>assert.equal(beatCue({counterSpent:4,dealt:1}).counter,true));
check(()=>assert.equal(beatCue({foeCounterSpent:4,taken:0}).foeCounter,false));
check(()=>assert.equal(beatCue({foeCounterSpent:4,taken:1}).foeCounter,true));
check(()=>assert.equal(beatCue({guarded:true,counterSpent:4,dealt:5}).kind,'counter'));
check(()=>assert.equal(beatCue({counterSpent:4,dealt:0,taken:0}).kind,'quiet'));
for(const [hp,foeHp,expected] of [[7,0,'win'],[0,8,'loss'],[0,0,'double'],[1,1,null]]){
 check(()=>assert.equal(finalCue({resources:{after:{hp,foeHp}}}),expected));
}
for(const bad of [undefined,{}, {resources:{}},{resources:{after:{hp:NaN,foeHp:0}}},{resources:{after:{hp:0,foeHp:Infinity}}}])check(()=>assert.equal(finalCue(bad),null));
const simultaneous={beats:[{ownHpBefore:10,ownHpAfter:5,foeHpBefore:4,foeHpAfter:0,dealt:4},{ownHpBefore:5,ownHpAfter:0,foeHpBefore:0,foeHpAfter:0,taken:5}],resources:{after:{hp:0,foeHp:0,mp:4,coin:2},wear:{sword:{before:4,after:3}}}};
check(()=>assert.equal(finalCue(simultaneous),'double')); // First-beat KO must not override final simultaneous result.
const before=structuredClone(simultaneous);
for(let n=0;n<10;n++){for(const b of simultaneous.beats)beatCue(b);finalCue(simultaneous);}
check(()=>assert.deepEqual(simultaneous,before));
check(()=>assert(Object.isFrozen(FEEL)));
const result={kind:'pure feedback classification and immutable resolved inputs; not native playback',checks,pass:true};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(result);
