/* Original explanatory vector illustrations; no game screenshots or official icons. */
(()=>{'use strict';
const ink='#263e38',gold='#b88336',red='#a75239',paper='#f4f0e4',blue='#487879';
const path=(d,fill=ink,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const line=(d,c=ink,w=3,extra='')=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const circle=(x,y,r,c=gold,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" ${extra}/>`;
const text=(x,y,t,size=12,c=ink,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${c}" font-size="${size}" font-family="sans-serif">${t}</text>`;
const group=(s,x=0,y=0,scale=1,extra='')=>`<g transform="translate(${x} ${y}) scale(${scale})" ${extra}>${s}</g>`;
const arrow=(x,y,n=45,c=gold)=>line(`M${x} ${y}h${n}m-8-7 8 7-8 7`,c,3);
const burst=(x,y)=>group(path('M0-19 4-5 16-13 8 0 23 5 8 8 15 22 2 12-7 23-8 8-24 10-13-1-22-12-5-8Z',gold),x,y);
const drool=(x,y)=>group(path('M0-9C-2-4-7 1-6 5C-5 13 6 13 6 5C6 1 2-4 0-9Z',blue),x,y);
const star=(x,y,s=1)=>group(path('M0-12 3-3 12 0 3 3 0 12-3 3-12 0-3-3Z',gold),x,y,s);
const monster=(state='normal')=>{
 let pose=state==='down'?'rotate(13 140 120)':state==='tired'?'rotate(7 140 120)':'';
 return `<g transform="${pose}">`+
 path('M8 120Q25 93 57 91L62 71 77 78 80 55 96 68 107 45 120 65Q150 55 180 76L197 61 222 64 240 88 231 97 208 94 207 108 224 110 216 124 193 121 182 108 171 111 165 135 177 140 171 146 151 143 151 125 138 112 114 117 102 137 113 142 105 148 85 144 88 124 78 112Q42 104 8 120Z')+
 path('M88 86 97 39 142 13 174 50 155 45 176 81 145 67 126 94Z',ink)+
 line('M95 80 143 22 139 56 169 78M141 26 165 48M139 56 125 89',paper,2)+
 path('M205 65 219 47 219 66 232 63 239 85 224 76',gold)+
 line('M91 103q33-15 67-5M100 108l-4 18M115 104l-6 9M164 111l-4 14',paper,2)+
 path('M211 83 222 81 216 87Z',paper)+
 path('M212 96 215 103 219 96M220 96 223 102 226 96',paper)+
 (state==='rage'?line('M197 66l8-12 9 3 3-15',red,4)+burst(238,47):'')+
 (state==='clutch'?drool(225,136)+star(242,114,.55)+star(239,138,.35)+line('M26 76h22M32 61h14',gold,2):'')+
 (state==='tired'?drool(225,138)+drool(232,150)+text(175,33,'…',24,blue):'')+
 (state==='down'?star(191,53,.7)+star(225,49,.5):'')+'</g>';
};
const hunter=(pose='ready')=>{
 if(pose==='roll')return circle(15,-17,10,ink)+line('M13-19l7 4',paper,2)+path('M1-27-20-24-34-9-25 11-2 25 12 21-12 0 8-6Z')+path('M-20-24-35-31-39-2-29-9Z',gold)+line('M-9 13 11 26 27 15M-21 3l5 18 11 7',ink,8)+line('M-3-18 17-3 7 5',ink,7);
 if(pose==='tackle')return circle(-8,-37,10,ink)+line('M-15-38h12',paper,2)+path('M-21-28 6-24 18-5 3 9-17-2-29-16Z')+path('M5-24 27 7 12 0Z',gold)+path('M-26-29-36-18-25-9-13-18Z',ink)+line('M-27-22l8 2',paper,2)+line('M-16-14-27-2-15 4M-6 4l-14 22-15 7M5 5l23 12 3 19',ink,8);
 if(pose==='dive')return circle(30,-15,10,ink)+line('M27-20l7 5',paper,2)+path('M15-23 26-5 5 9-14-3-11-15Z')+path('M-9-18-39-29-22-6Z',gold)+line('M15-16 37-29 62-27M18-1 42-5 62-15M-12-7-31-21-51-13M1 7-25 18-47 7',ink,7)+line('M-3-12l9 15',paper,2);

 const base=circle(0,-37,10,ink)+path('M-10-43 0-49 11-41 10-32-9-32Z')+line('M-6-37h12',paper,2)+path('M-12-24 4-27 17-17 9 4-8 8-17-5Z')+path('M-15-22-28 15-5 4Z',gold)+line('M-8-15 11-12M-7-8 8-5',paper,2);
 if(pose==='dive')return group(base+line('M-8 4l-24 10-13-3M8 3l20-4 17 6',ink,7)+line('M9-20l22-4 19-10',ink,7),0,0,1,'transform-origin="0 0"');
 return base+line('M-6 5l-6 19-9 13M7 3l13 18-1 15',ink,8)+
 (pose==='grapple'?line('M7-20l17-17 9-7',ink,7)+line('M-13-16l-7-18 12-12',ink,6):pose==='guard'?line('M7-20l18 1 4 12',ink,7)+group(shield(),22,-21,.55):pose==='attack'?line('M8-20l21-15 15 5',ink,7)+group(sword(),37,-64,.6):line('M8-20l21 6 8-14',ink,7)+line('M-12-18l-9 13',ink,6));
};
const sword=()=>path('M-6-63 7-76 12-63 8 5 18 10 17 17 5 16 4 42-5 42-6 16-17 16-18 10-8 6Z')+line('M3-64 0 2',paper,2)+line('M-3 23h6M-3 31h6',paper,2);
const axe=()=>path('M-3-70 4-73 8 39-4 39Z')+path('M-5-63-34-49-35-20-12-33 9-34 34-16 44-28 40-59 12-64Z')+line('M-29-45-13-49M19-49l16 9',paper,2);
function shield(){return path('M0-17 28-6 24 23 0 43-24 23-28-6Z')+path('M0-7 18 0 15 19 0 31-15 19-18 0Z',paper)+path('M0-2 11 3 8 15 0 23-8 15-11 3Z',gold);}
const bow=()=>line('M-16-59Q49 0-16 59',ink,8)+line('M-16-59 6 0-16 59',gold,2)+line('M-37 0h93m-10-6 10 6-10 6',ink,3)+line('M-32-5l7 5-7 5',gold,2);
const trap=()=>path('M-39 2-28-12 28-12 40 2 18 24-18 24Z')+line('M-34 2h69M-20-9l4 29M0-10v32M20-9l-4 29',paper,2)+path('M-39-2-45-22-32-11M37-2 43-22 30-11',gold);
const bottle=()=>path('M-9-30 9-30 9-16 19-7 20 22 15 29-15 29-20 22-19-7-9-16Z')+path('M-14 1 14 1 14 21 9 24-9 24-14 21Z',blue)+line('M-8-22h16',paper,2)+star(0,11,.65);
const gauge=(w=120,v=.6,c=gold)=>`<rect width="${w}" height="13" rx="2" fill="none" stroke="${ink}" stroke-width="2"/><rect x="3" y="3" width="${(w-6)*v}" height="7" fill="${c}"/>`;
const clock=()=>circle(0,0,28,'none',`stroke="${ink}" stroke-width="3"`)+line('M0-19v19l14 8',ink,3)+line('M-9-37h18M0-35v7',ink,4);
const ground=()=>line('M13 163H247','#c6c9b7',1)+line('M42 168h38m75 0h49','#c6c9b7',1);
const creature=(s='normal',x=5,y=22,scale=.95)=>group(monster(s),x,y,scale);
const man=(pose='ready',x=125,y=115,scale=1)=>group(hunter(pose),x,y,scale);
const wpn=(what,x=130,y=110,scale=1)=>group(what==='axe'?axe():what==='bow'?bow():what==='shield'?shield():sword(),x,y,scale);
const minimon=(state='normal')=>creature(state,15,35,.87);
const phials=(n=5)=>Array.from({length:5},(_,i)=>group(path('M0 0h12v27l-6 6-6-6Z',i<n?gold:'#d0d3c6'),i*24,0)).join('');
const map={};
const add=(id,short,warning,scenes)=>map[id]={short,warning,scenes};
add('clutch-flinch','しがみつくだけで、攻撃の隙が延びる。','疲労のよだれとは別。すぐ降りてもOK。',[
 ['大きくよろける',minimon('clutch')],['クラッチ',minimon('clutch')+man('grapple',179,90,.54)+line('M166 53Q121 28 95 62',gold,2,'stroke-dasharray="5 5"')],['隙が延びる',text(32,56,'通常',11,ink,'start')+line('M34 70h91',ink,10)+text(32,110,'クラッチ後',11,ink,'start')+line('M34 127h91',ink,10)+line('M130 127h90',gold,10)+path('M215 117 236 127 215 137Z',gold)+line('M135 83v21m-6-6 6 6 6-6',gold,2)]]);
add('exhaustion','よだれと鈍い動き。疲れた合図。','クラッチ怯みとは、動きとよだれが違う。',[
 ['スタミナが減る',minimon()+group(gauge(120,.17),72,17)],['動きが鈍る',minimon('tired')],['隙に攻撃',minimon('tired')+man('attack',210,115,.65)]]);
add('enrage','いつもの反撃が、間に合わないことも。','連続攻撃の終わりを見てから反撃。',[
 ['通常',minimon()],['怒り',minimon('rage')],['動きを見直す',minimon('rage')+man('guard',54,128,.6)+line('M125 158h50m-10-7 10 7-10 7',red,3)]]);
add('flinch','同じ部位を攻めて、動きを止める。','怯み＝必ずダウン、ではない。',[
 ['部位を狙う',minimon()+circle(173,134,23,'none',`stroke="${gold}" stroke-width="3"`)],['蓄積',minimon()+burst(173,132)+group(gauge(120,.85),68,10)],['怯み・転倒',minimon('down')]]);
add('hitzone','同じ攻撃でも、当たる場所で変わる。','切断・打撃・弾・属性で、通りやすさは別。',[
 ['部位ごとに',minimon()+circle(213,108,23,'none',`stroke="${gold}" stroke-width="3"`)+circle(121,129,22,'none',`stroke="${blue}" stroke-width="2"`)],['攻撃の種類',wpn('sword',74,104,.8)+wpn('bow',169,100,.7)],['通る部位を選ぶ',minimon()+burst(214,105)+arrow(249,80,-27)]]);
add('motion-value','技ごとに、一撃の重さが違う。','高い威力より「その隙に当てられるか」。',[
 ['同じ武器',wpn('sword',132,107,1.05)],['違う技',man('ready',73,103,.85)+man('attack',183,103,.85)],['隙に合わせる',group(clock(),75,99)+arrow(110,99,40)+man('attack',203,113,.85)]]);
add('sharpness','色が落ちたら、安全な隙に研ぐ。','弾かれない攻撃も、斬れ味の影響は別。',[
 ['斬れ味',wpn('sword',130,107,1)+group(gauge(98,.95,blue),17,143)],['消耗',wpn('sword',130,107,1)+group(gauge(98,.3,gold),17,143)+burst(146,56)],['研ぐ',group(sword(),133,83,.75,'style="transform-box:fill-box"')+path('M57 134 102 113 142 126 98 150Z',gold)+star(110,111,.7)]]);
add('affinity','会心率は「出る確率」。一発の倍率とは別。','マイナスの会心では、弱い一撃が発生。',[
 ['通常の一撃',wpn('sword',107,104,.8)+circle(168,71,14,ink)],['会心の一撃',wpn('sword',107,104,.8)+burst(168,71)],['発生する確率',Array.from({length:5},(_,i)=>circle(45+i*42,96,12,i===1||i===4?gold:ink)).join('')+text(130,138,'確率のイメージ',11)]]);
add('capture','弱らせる → 罠 ＋ 捕獲用の麻酔。','古龍は捕獲できない。罠にも相手ごとの条件あり。',[
 ['弱らせる',minimon('tired')],['罠にかける',minimon()+group(trap(),150,148,.8)+line('M109 158 133 68M172 158 198 71',gold,2)],['捕獲用の麻酔',group(bottle(),90,104,1.1)+group(trap(),171,115)+text(130,103,'＋',24)+text(168,58,'Z z',25,blue)]]);
add('emergency-dive','納刀して逃げる向きに走り、飛び込む。','抜刀中や歩きからは、同じ動作にならない。',[
 ['納刀',man('ready',131,102,1.04)+group(sword(),107,102,.56)],['相手から離れて走る',creature('normal',-80,53,.57)+man('ready',156,112,.88)+arrow(196,112,36)],['飛び込む',group(hunter('dive'),130,116,1.05)+arrow(40,77,100)]]);
add('iframe','回避の短い無敵時間を、攻撃に合わせる。','回避中ずっと無敵、ではない。',[
 ['攻撃が来る',man('ready',128,110)+arrow(24,96,60,red)],['一瞬を合わせる',circle(132,104,43,'none',`stroke="${gold}" stroke-width="4"`)+man('roll',131,110,1.05)+arrow(22,101,52,red)],['抜ける',man('ready',190,110)+line('M51 70q60 24 22 66',gold,4)+arrow(108,100,39)]]);
add('evade-skills','性能は「無敵時間」。距離は「移動の長さ」。','伸ばしたいのは時間か、距離か。',[
 ['回避性能',group(clock(),130,91,1.5)+line('M130 49A42 42 0 0 1 170 103',gold,8)],['回避距離UP',man('ready',62,115,.7)+man('ready',207,115,.7)+arrow(85,119,93)],['役割が違う',group(clock(),68,94)+text(129,104,'≠',29)+arrow(171,94,61)]]);
add('stamina','逃げる分まで、使い切らない。','走る・回避・武器の動作で消費する。',[
 ['行動で消費',man('ready',131,107)+group(gauge(156,.6),48,149)],['空にしない',group(gauge(174,.02,red),44,96)+text(130,147,'×',32,red)],['回避の余力',group(gauge(174,.35),44,96)+man('guard',134,53,.55)+text(130,147,'残す',14)]]);
add('sa-gauges','剣を使う残量と、覚醒までの蓄積は別。','リロードだけでは、高出力にならない。',[
 ['斧で回復',wpn('axe',131,98,1)+group(gauge(128,.75),66,150)],['剣の残量',wpn('sword',131,100,1)+group(gauge(128,.3),66,150)],['剣を当てて覚醒',wpn('sword',113,104,.9)+burst(152,48)+group(gauge(128,1),66,150)]]);
add('sa-amped','剣を当ててためると、高出力状態へ。','チャアクの「高出力属性解放斬り」とは別。',[
 ['剣攻撃',man('attack',115,112,1)+burst(167,48)],['覚醒ゲージを満たす',wpn('sword',130,102,.8)+group(gauge(180,1),40,151)+star(230,150,.65)],['高出力',wpn('sword',128,108,1.1)+line('M104 16 88 46 100 80M151 18l18 35-18 46',gold,4)+star(192,50,.9)]]);
add('sa-zsd','高出力から、取りついて解放する。','相手の次の攻撃に注意。IBクラッチ派生は詳説未収録。',[
 ['高出力にする',wpn('sword',130,106,1)+star(164,40)+group(gauge(150,1),54,151)],['突きで取りつく',minimon()+man('grapple',189,104,.6)+group(sword(),172,103,.45)],['解放',minimon()+man('grapple',189,104,.6)+burst(201,99)+star(231,58)+star(158,62,.7)]]);
add('bow-cs','位置を変えながら、溜め段階を上げる。','ステップの連発でスタミナを空にしない。',[
 ['照準',wpn('bow',108,100,.83)+circle(215,100,18,'none',`stroke="${gold}" stroke-width="2"`)],['ステップ',man('ready',64,117,.7)+man('ready',196,117,.7)+arrow(89,132,72)],['溜めて射る',wpn('bow',110,100,.98)+arrow(158,100,74)+star(225,99,.9)]]);
add('bow-distance','近すぎても遠すぎても、外れる適正距離。','ビンを替えたら、距離も合わせ直す。',[
 ['遠すぎる',wpn('bow',48,103,.7)+creature('normal',183,83,.38)+line('M104 103h89',blue,2,'stroke-dasharray="4 6"')],['適正距離',wpn('bow',72,103,.7)+creature('normal',139,73,.48)+arrow(118,103,61)+circle(216,111,22,'none',`stroke="${gold}" stroke-width="3"`)],['照準を確認',circle(130,98,42,'none',`stroke="${ink}" stroke-width="3"`)+circle(130,98,26,'none',`stroke="${gold}" stroke-width="4"`)+line('M130 43v28m0 55v27M75 98h27m57 0h27',ink,2)]]);
add('bow-coatings','接撃ビンは、近くで撃つためのビン。','付けっぱなしで遠距離射撃しない。',[
 ['接撃ビン',group(bottle(),130,98,1.7)+text(204,117,'∞',29,gold)],['近くで撃つ',wpn('bow',76,101,.75)+creature('normal',126,72,.53)+arrow(123,101,39)],['射程が短くなる',wpn('bow',58,101,.65)+line('M97 101h54',gold,4)+line('M156 101h70',blue,2,'stroke-dasharray="4 5"')+text(204,84,'×',22,red)]]);
add('cb-gp','動作の途中にも、ガードできる瞬間がある。','動作中ずっとガード、ではない。',[
 ['変形などの動作',wpn('sword',74,102,.75)+arrow(118,88,28)+wpn('axe',199,102,.7)],['盾が前に出る瞬間',man('guard',119,116,1.1)+arrow(241,101,-59,red)],['受け止める',man('guard',119,116,1.1)+burst(166,104)+line('M177 61q38 32 0 0 1 0 71',gold,3)]]);
add('cb-shield','ビンを盾へ。赤盾で性能を強化。','ビンを装填するだけでは、盾強化にならない。',[
 ['ビンをためる',group(phials(),76,78)],['盾へ移す',group(phials(3),17,87,.6)+arrow(109,100,38)+wpn('shield',202,86,1.3)],['赤盾',wpn('shield',130,79,1.75)+line('M80 57 78 113 130 152 182 113 180 57',red,5)+star(203,53,.9)]]);
add('cb-charge','剣のエネルギーを、チャージでビンへ。','ためすぎるとオーバーヒートして弾かれる。',[
 ['剣でためる',wpn('sword',131,104)+group(gauge(145,.9),57,148)],['チャージ',wpn('sword',64,106,.78)+arrow(113,98,31)+group(phials(),166,87,.57)],['ビンに装填',group(phials(),76,77)+star(210,53,.8)]]);
add('gs-tackle','攻撃を受け止め、次の溜めにつなぐ。','無敵になる技ではない。何でも受けない。',[
 ['溜め中',man('attack',130,113,1.1)],['肩で受ける',man('tackle',132,113,1.1)+arrow(33,101,49,red)+burst(114,92)],['次の攻撃へ',man('attack',131,117,1.15)+line('M188 38q59 29 30 91',gold,4)+burst(211,128)]]);
add('gs-overcharge','最大の合図で離す。溜めすぎると威力が落ちる。','隙が短いときは、最大を待たずに当てる。',[
 ['溜める',man('attack',117,116,1)+group(gauge(152,.58),53,155)],['最大で離す',man('attack',117,116,1)+group(gauge(152,1),53,155)+star(179,37,1)],['溜めすぎに注意',line('M35 145h184M35 145V48',ink,2)+line('M43 133 141 49 212 88',gold,5)+circle(141,49,7,gold)+text(216,114,'↓',25,red)]]);
function svg(body,label,cls=''){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 190" class="${cls}" role="img" aria-label="${label}">${ground()}${body}</svg>`;}
const iconScene={'exhaustion':1,'enrage':1,'flinch':2,'motion-value':1,'affinity':1,'capture':1,'emergency-dive':2,'iframe':1,'sa-amped':2,'sa-zsd':2,'cb-gp':2,'cb-shield':2,'cb-charge':1,'gs-tackle':1,'gs-overcharge':2};
window.MH_VISUALS={map,svg,icon:id=>{const e=map[id];return e?svg(e.scenes[iconScene[id]??0][1],e.scenes[iconScene[id]??0][0],'thumb'):'';},panels:id=>{const e=map[id];return e?e.scenes.map((s,i)=>`<div class="scene"><div class="scene-art">${svg(s[1],s[0])}</div><div class="scene-label"><span>${i+1}</span>${s[0]}</div></div>`).join(''):'';}};
})();
