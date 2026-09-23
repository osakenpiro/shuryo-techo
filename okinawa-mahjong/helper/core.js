/* Okinawa Mahjong Helper v0.1 | four-player scoring only; no hand/yaku recognition. */
(function (root) {
  'use strict';
  const FU = Object.freeze([20,25,30,40,50,60,70,80,90,100,110]);
  function integer(n, min, max, label) {
    if (!Number.isSafeInteger(n) || n < min || n > max) throw new Error(`${label}は${min}〜${max}の整数にしてください。`);
  }
  function score(input) {
    const {dealer=false, win='ron', han, fu, hasYaku=false, yakuman=0, honba=0, sticks=0,
      kiriage=false, kazoe=true} = input;
    if (typeof dealer !== 'boolean' || !['ron','tsumo'].includes(win)) throw new Error('親・子／ロン・ツモを確認してください。');
    if ([hasYaku,kiriage,kazoe].some(v => typeof v !== 'boolean')) throw new Error('役・ルール設定を確認してください。');
    integer(honba,0,99,'本場'); integer(sticks,0,99,'供託'); integer(yakuman,0,6,'役満倍率');
    let base, limit='';
    if (yakuman) { base=8000*yakuman; limit=yakuman===1?'役満':`${yakuman}倍役満`; }
    else {
      integer(han,1,99,'翻');
      if (!hasYaku) throw new Error('ドラだけではあがれません。ドラ以外の役があるか確認してください。');
      if (han >= 13) { base=kazoe?8000:6000; limit=kazoe?'数え役満':'三倍満（数えなし）'; }
      else if (han >= 11) { base=6000; limit='三倍満'; }
      else if (han >= 8) { base=4000; limit='倍満'; }
      else if (han >= 6) { base=3000; limit='跳満'; }
      else if (han >= 5) { base=2000; limit='満貫'; }
      else {
        if (!FU.includes(fu)) throw new Error('符を選んでください。わからなければ「符を調べる」へ。');
        if (fu===20 && (win!=='tsumo' || han<2)) throw new Error('20符は平和ツモ用です。ツモ・2翻以上を確認してください。');
        if (fu===25 && (han<2 || (win==='tsumo' && han<3))) throw new Error('七対子はロン2翻以上、ツモ3翻以上です。');
        if (fu===110 && han===1 && win==='tsumo') throw new Error('1翻110符ツモは通常成立しません。翻・符を再確認してください。');
        base=Math.min(fu*2**(han+2),2000);
        if (kiriage && base===1920) base=2000;
        if (base===2000) limit='満貫';
      }
    }
    const ceil100=n=>Math.ceil(n/100)*100;
    let payments;
    if (win==='ron') payments=[{payer:'放銃した人',count:1,points:ceil100(base*(dealer?6:4))+honba*300}];
    else if (dealer) payments=[{payer:'子 3人',count:3,points:ceil100(base*2)+honba*100}];
    else payments=[{payer:'親',count:1,points:ceil100(base*2)+honba*100},{payer:'子 2人',count:2,points:ceil100(base)+honba*100}];
    const paid=payments.reduce((sum,p)=>sum+p.points*p.count,0);
    return {base,limit,payments,paid,deposit:sticks*1000,total:paid+sticks*1000,honbaBonus:honba*300};
  }
  // A ron-completed triplet is open for fu only. It does NOT make the hand open.
  const GROUPS=Object.freeze({seq:[0,false],pon2:[2,true],pon19:[4,true],anko2:[4,false],anko19:[8,false],
    kan2:[8,true],kan19:[16,true],ankan2:[16,false],ankan19:[32,false],ron2:[2,false],ron19:[4,false]});
  function countFu({shape='standard',closed=true,win='ron',pair=0,wait='ryanmen',groups=['seq','seq','seq','seq']}) {
    if (typeof closed!=='boolean'||!['ron','tsumo'].includes(win)) throw new Error('鳴き・あがり方を確認してください。');
    if (!['standard','pinfu','chiitoi'].includes(shape)) throw new Error('手の形を選んでください。');
    if (shape==='chiitoi') {
      if (!closed) throw new Error('七対子は鳴くと成立しません。');
      return {fu:25,raw:25,reason:'七対子は25符固定',minHan:win==='tsumo'?3:2};
    }
    if (shape==='pinfu') {
      if (!closed) throw new Error('平和は門前のみです。鳴いた形は「そのほか」で計算してください。');
      return {fu:win==='tsumo'?20:30,raw:win==='tsumo'?20:30,reason:win==='tsumo'?'平和ツモは20符固定':'平和ロンは20＋門前ロン10＝30符',minHan:win==='tsumo'?2:1};
    }
    if (![0,2,4].includes(pair)||!['ryanmen','kanchan','penchan','tanki','shanpon'].includes(wait)) throw new Error('雀頭・待ちを確認してください。');
    if (!Array.isArray(groups)||groups.length!==4||groups.some(g=>!Object.hasOwn(GROUPS,g))) throw new Error('4組すべての形を選んでください。');
    const opens=groups.some(g=>GROUPS[g][1]);
    if (closed&&opens) throw new Error('ポン・チー・明カンした手は「鳴いた」を選んでください。');
    // An open sequence cannot be distinguished here; explicit closed=false covers chii.
    const ronGroups=groups.filter(g=>g.startsWith('ron')).length;
    if (ronGroups>1 || (ronGroups && (win!=='ron'||wait!=='shanpon'))) throw new Error('「ロンで完成した3枚」は、ロン・シャンポン待ちの1組だけです。');
    if (win==='ron'&&wait==='shanpon'&&ronGroups!==1) throw new Error('あがり牌で完成した組を「ロンで完成した3枚」にしてください。');
    if (groups.every(g=>g==='seq')&&wait==='shanpon') throw new Error('シャンポン待ちは3枚組ができます。組の形を確認してください。');
    const pinfu=closed&&groups.every(g=>g==='seq')&&pair===0&&wait==='ryanmen';
    if (pinfu) return countFu({shape:'pinfu',closed,win});
    const parts=[['基本',20]];
    if (closed&&win==='ron') parts.push(['門前ロン',10]);
    if (win==='tsumo') parts.push(['ツモ',2]);
    if (pair) parts.push(['雀頭',pair]);
    if (['kanchan','penchan','tanki'].includes(wait)) parts.push(['待ち',2]);
    groups.forEach((g,i)=>{if(GROUPS[g][0]) parts.push([`${i+1}組目`,GROUPS[g][0]]);});
    const raw=parts.reduce((s,p)=>s+p[1],0);
    const fu=Math.max(30,Math.ceil(raw/10)*10);
    return {fu,raw,reason:parts.map(p=>`${p[0]}${p[1]}`).join(' ＋ ')+` → ${fu}符`,minHan:1};
  }
  const api=Object.freeze({FU,score,countFu});
  if (typeof module==='object'&&module.exports) module.exports=api; else root.MJ=api;
})(globalThis);
