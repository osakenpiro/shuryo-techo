/* Shared beginner glossary for Okinawa Mahjong Club. Keep definitions short and reusable across helper/learn/practice. */
(function(root){'use strict';
const rows=[
['call','鳴き','なき','ポン・チー・明カンで、ほかの人の牌を使って組を作ること。','鳴くと門前ではなくなり、リーチできない。役によっては翻が下がる。'],
['menzen','門前','メンゼン','ポン・チー・明カンをしていない状態。','暗カンだけなら門前のまま。門前限定の役がある。'],
['tenpai','聴牌','テンパイ','あと1枚でアガリ形が完成する状態。','待ちが1種類でも複数でも聴牌。リーチは門前で聴牌していることが基本条件。'],
['furiten','フリテン','ふりてん','待ち牌をロンできない状態。','自分の捨て牌に待ち牌がある場合など。ツモあがりはできる。'],
['ron','ロン','ろん','ほかの人の捨て牌でアガること。','チーと違い、上家だけでなく誰の捨て牌からでもロンできる。フリテン中は不可。'],
['tsumo','ツモ','つも','自分で引いた牌でアガること。','支払い方はロンと違う。門前なら「門前ツモ」が1翻つく。'],
['riichi','リーチ','りーち','門前で聴牌したときに宣言できる1翻役。','1000点棒を出して宣言する。宣言後は原則として手牌を入れ替えない。']
];
const data=rows.map(r=>Object.freeze({id:r[0],name:r[1],reading:r[2],summary:r[3],note:r[4]}));
if(typeof module==='object'&&module.exports)module.exports=data;else root.MJ_GLOSSARY=data;
})(globalThis);
