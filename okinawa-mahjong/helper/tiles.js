/* Original schematic tile faces. No font-dependent mahjong Unicode glyphs. */
(function(root){'use strict';
const digits=['一','二','三','四','五','六','七','八','九'];
const sounds=['イー','リャン','サン','スー','ウー','ロー','チー','パー','キュー'];
const families=[{id:'m',name:'萬子',reading:'マンズ',hint:'漢字の数字と「萬」。ワンズとも呼びます。',suffix:'萬',sound:'ワン'},
{id:'p',name:'筒子',reading:'ピンズ',hint:'丸い模様の数が、1〜9。',suffix:'筒',sound:'ピン'},
{id:'s',name:'索子',reading:'ソーズ',hint:'竹の本数が、2〜9。1だけは鳥の絵。',suffix:'索',sound:'ソー'},
{id:'z',name:'字牌',reading:'ジハイ',hint:'東・南・西・北の風牌と、白・發・中の三元牌。'}];
const all=families.slice(0,3).flatMap(f=>digits.map((d,i)=>({id:(i+1)+f.id,family:f.id,n:i+1,name:d+f.suffix,reading:sounds[i]+f.sound,note:f.id==='m'?sounds[i]+'マンとも読みます。':f.id==='s'&&i===0?'1索だけは、竹ではなく鳥の絵です。':f.id==='s'&&i===6?'チャッソーとも読みます。':''})));
['東','南','西','北','白','發','中'].forEach((name,i)=>all.push({id:(i+1)+'z',family:'z',n:i+1,name,reading:['トン','ナン','シャー','ペイ','ハク','ハツ','チュン'][i],note:i<4?'風牌（フォンパイ）。場風・自風なら3枚で役になります。':i===4?'白い無地の牌。3枚そろうと役牌の1翻。':'3枚そろうと役牌の1翻。'}));
const positions={1:[[28,37]],2:[[28,20],[28,53]],3:[[15,17],[28,37],[41,57]],4:[[15,21],[41,21],[15,53],[41,53]],5:[[15,18],[41,18],[28,37],[15,56],[41,56]],6:[[15,17],[41,17],[15,37],[41,37],[15,57],[41,57]],7:[[13,15],[28,15],[43,15],[17,37],[39,37],[17,58],[39,58]],8:[[15,12],[41,12],[15,29],[41,29],[15,46],[41,46],[15,63],[41,63]],9:[[13,15],[28,15],[43,15],[13,37],[28,37],[43,37],[13,59],[28,59],[43,59]]};
function face(id){
const t=all.find(t=>t.id===id);if(!t)return '';
let drawing='';
if(t.family==='m')drawing=`<text x="28" y="33" font-size="29" fill="#183d34">${digits[t.n-1]}</text><text x="28" y="64" font-size="28" fill="#a54132">萬</text>`;
if(t.family==='p')drawing=positions[t.n].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${t.n===1?17:5.7}" fill="none" stroke="${t.n===1||t.n===5&&i===2?'#a54132':'#194d66'}" stroke-width="2.5"/><circle cx="${x}" cy="${y}" r="${t.n===1?10:1.8}" fill="none" stroke="#366652" stroke-width="1.5"/>`).join('');
if(t.family==='s')drawing=t.n===1?'<path d="M30 13q12 2 9 12l8 5-11 3q4 16-8 24L15 64l7-15q-10-5-7-15l7-8q-2-12 8-13Z" fill="#176247"/><path d="m23 34 9 7-9 9m4-33 4 2" fill="none" stroke="#f9f4e8" stroke-width="2"/><circle cx="33" cy="21" r="1.6" fill="#a54132"/>':positions[t.n].map(([x,y],i)=>`<g stroke="${t.n===5&&i===2||t.n===7&&i<3?'#a54132':'#176247'}" stroke-width="3" stroke-linecap="round"><path d="M${x} ${y-5}v10"/><path d="m${x-3} ${y-3}h6m-6 6h6" stroke-width="1.4"/></g>`).join('');
if(t.family==='z'&&t.n!==5)drawing=`<text x="28" y="53" font-size="40" fill="${t.n===7?'#a54132':t.n===6?'#176247':'#183d34'}">${t.name}</text>`;
return `<svg class="pai-face" viewBox="0 0 56 78" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="1" y="4" width="54" height="73" rx="6" fill="#9eb4a0"/><rect x="1" y="1" width="54" height="71" rx="6" fill="#fffdf4" stroke="#bdc6b7"/><g text-anchor="middle" font-family="'Hiragino Mincho ProN','Yu Mincho',serif" font-weight="700">${drawing}</g></svg>`;
}
const api={all,families,face};if(typeof module==='object'&&module.exports)module.exports=api;else root.MJ_TILES=api;
})(globalThis);
