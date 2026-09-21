/* MHW:Iceborne — pre-Fatalis preparation, 2026-09-21. Display-only: no state writes. */
(()=>{'use strict';
if(document.getElementById('fatalis-prep'))return;
const box=document.createElement('details');box.id='fatalis-prep';box.className='fatalis-brief';
box.innerHTML=`
<summary><span class="eyebrow">黒龍の前に / PRE-FATALIS</span><strong>ミラ用の支度。生産と回復を分ける。</strong><small>スロット2の珠・金策・必要な導きの地帯を、ここで確認。</small></summary>
<div class="fb-body">
<p class="fb-lead"><b>武器・防具を作る段階で、全地帯をLv7にする必要はない。</b><br>いまの氷装備はアルバ用として残す。ミラ用は物理火力・生存・頭破壊へ組み替える案。回復カスタムは、その後の別工程。</p>
<p class="fb-note">所持装備・珠・MRは未確認。下は制作／試着案で、完成済みや討伐可能の認定ではありません。ほかのメンバーの装備・現在地・既存のチェックは変更しません。</p>
<nav class="fb-links" aria-label="ミラ準備の項目"><a href="#fb-jewels">スロ2の珠</a><a href="#fb-money">金策</a><a href="#fb-build">武器と防具</a><a href="#fb-guiding">導きは必要？</a></nav>
<section id="fb-jewels"><h2>① スロット2：昂揚珠と痛撃珠。</h2>
<div class="fb-table"><table><thead><tr><th>装飾品</th><th>役割</th><th>画像の氷構成での必要数</th></tr></thead><tbody>
<tr><td><b>昂揚珠【2】</b></td><td>強化持続＋1</td><td><b>1個</b>。頭・脚の計2に足してLv3。</td></tr>
<tr><td><b>痛撃珠【2】</b></td><td>弱点特効＋1</td><td><b>2個</b>。カイザー腕の1に足してLv3。</td></tr>
<tr><td>跳躍珠【2】</td><td>回避距離UP＋1</td><td>画像の頭でLv2があるので、この構成では追加不要。</td></tr>
</tbody></table></div><p class="fb-note">【2】は必要な穴のサイズで、1個でスキルLv2になる意味ではない。整備珠・地学珠は【1】。大きな穴にも小さい珠を入れられるが、ここでは完成スキルを優先。<a href="https://gamewith.jp/mhw/92395" target="_blank" rel="noopener noreferrer">装飾品の効果・サイズ ↗</a></p>
</section>
<section id="fb-money"><h2>② 金策：ジンオウガよさらば。</h2><p>v0.6には「ゼニーも必要」という記述だけで、金策専用の周回先は未掲載でした。今回ここへ追加。</p>
<div class="fb-quests">
<article><span class="eyebrow">金策＋蒸気燃料 / MR24以上</span><h3>ジンオウガよさらば</h3><p>ダウン中の背中へ<b>捕獲用ネット</b>を投げ、金・銀のたまごを回収して売却。龍脈炭は蒸気機関の燃料にする。普段の雷光虫採取とは、このクエストの採取内容が違う。</p><p class="fb-note">先にBOXの換金アイテムを売れるか確認。必要な武器素材まで一括売却しない。毎周の固定収入は保証しない。<a href="https://gamewith.jp/mhw/232788" target="_blank" rel="noopener noreferrer">クエストとネット採取 ↗</a></p></article>
<article><span class="eyebrow">鎧玉 / MR24以上</span><h3>黒轟竜は傷つかない</h3><p>鎧玉が足りないとき。集めたら加工屋で実際に強化して区切る。火武器を固定しない。</p><a href="https://game8.jp/mhw/355462" target="_blank" rel="noopener noreferrer">クエスト ↗</a></article>
<article><span class="eyebrow">装飾品 / MR24以上</span><h3>鳴神上狼、荒事を成す</h3><p>足りない珠を狙う枠。先に手持ち・マカ錬金を確認。欲しい珠そのものが確定するわけではない。</p><a href="https://game8.jp/mhw/322627" target="_blank" rel="noopener noreferrer">クエスト ↗</a></article>
</div><p class="fb-warning"><b>同じジンオウガでも別クエスト。</b>「よさらば」＝金策・燃料。「鳴神」＝珠。どちらも、地学珠でクリア報酬が2倍にはならない。</p></section>
<section id="fb-build"><h2>③ ミラ用の武器・防具：今の5部位を活かす案。</h2>
<p><b>アルバ用の氷マイセットは保存したまま。</b>ミラには属性抑制の仕組みがないので、氷属性強化6をそのまま制作目標にしない。頭破壊と生存、物理火力へ配分する。以下はまず試着する再利用案で、最終火力装備や安全保証ではありません。<a href="https://game8.jp/mhw/352309" target="_blank" rel="noopener noreferrer">ミラ対策の考え方 ↗</a></p>
<div class="fb-weapon"><h3>武器候補：砕光の剣斧</h3><p>臨界ブラキ（猛り爆ぜるブラキディオス）から生産。強撃ビン、スロット④③。高い物理火力と装飾品枠を使う案で、爆破属性強化を積むための選択ではない。ムフェト抽選待ちを必須にしない。</p><p><b>砕竜の撃滅拳×3／砕竜の弾頭殻×1／不壊の黒曜甲×4／不滅の炉心殻×1</b></p><p class="fb-note">特別任務「砕破極臨」の通常の狩猟素材で作る。導きの地帯Lv7は生産条件ではない。すでに同等の物理武器や十分に強化した覚醒武器があれば作り直し不要。<a href="https://gamewith.jp/mhw/192299" target="_blank" rel="noopener noreferrer">武器性能・素材 ↗</a></p></div>
<details class="fb-sub"><summary>防具5部位を共用する、ミラ用の珠配置を見る</summary><p class="fb-note">砕光の剣斧＋重撃の護石Ⅱを前提。既存氷構成とは珠の置き場所が違うため、別マイセットへ保存。装衣スロットは使わない。</p>
<div class="fb-table"><table><thead><tr><th>部位</th><th>装備</th><th>スロットに入れる珠</th></tr></thead><tbody>
<tr><td>武器</td><td>砕光の剣斧</td><td>④痛撃珠【2】／③超心珠【2】</td></tr>
<tr><td>頭</td><td>EXベリオヘルムα</td><td>①体力珠／①体力珠</td></tr>
<tr><td>胴</td><td>EXキリンベストα</td><td>③痛撃珠【2】／②昂揚珠【2】</td></tr>
<tr><td>腕</td><td>EXカイザーアームβ</td><td>④超心珠【2】／③超心珠【2】</td></tr>
<tr><td>腰</td><td>EXキリンフープβ</td><td>④重撃珠【2】／①整備珠／①体力珠</td></tr>
<tr><td>脚</td><td>EXデスガロングリーヴα</td><td>①加護珠／①加護珠</td></tr>
<tr><td>護石</td><td>重撃の護石Ⅱ</td><td>破壊王2。重撃珠1個と合わせてLv3。</td></tr>
</tbody></table></div>
<p class="fb-skills"><b>強化持続3／回避距離UP2／整備3／体力増強3</b><br>弱点特効3／超会心3／破壊王3／見切り3／精霊の加護3<br><small>防具由来の属性やられ耐性2・熱ダメージ無効1も残る。</small></p>
<p>必要な珠：<b>体力×3・痛撃×2・昂揚×1・整備×1・超心×3・重撃×1・加護×2</b>。超心珠3個がなければ、空き枠へ回避珠・耐火珠など手持ちを入れて試着し、発動スキルを再確認。未所持の珠を揃うまで延々待つ必須条件にはしない。</p>
<p class="fb-note">重撃の護石はⅡまででこの配置が成立。Ⅲの導き素材を先に要求しない。<a href="https://gamewith.jp/mhw/92564" target="_blank" rel="noopener noreferrer">護石の段階・材料 ↗</a>／<a href="./osakenpiro.html?v=3#build">元の5部位と火氷の比較へ</a></p>
</details>
<p class="fb-warning">この案には精霊の加護5・整備5や回避性能は入らない。被弾が多ければ火力との配分を見直す。兵器担当の砲撃手2、頭破壊、回復・煙玉・研ぎ方も別途相談。不動＋回復カスタムでも被弾し続けてよいわけではない。</p>
<p class="fb-note">ここで扱うのは<b>ミラを倒しに行くための装備</b>。ミラ素材で作る真・黒龍剣斧やEXドラゴンを、初挑戦装備の前提にしない。</p>
</section>
<section id="fb-guiding"><h2>④ 導きは、回復カスタムの材料を取りに行く場所。</h2>
<div class="fb-table"><table><thead><tr><th>したいこと</th><th>導きのレベル上げ</th></tr></thead><tbody>
<tr><td>画像の5部位・氷刃武器・砕光の剣斧を生産</td><td><b>高レベル化は不要。</b>通常クエストの素材で製作。</td></tr>
<tr><td>ミラの任務を開く</td><td><b>全地帯Lv7・MR100は受注の必須条件ではない。</b>前提の特別任務を進める。</td></tr>
<tr><td>砕光や覚醒武器（R12）に回復能力付与Ⅰ</td><td><b>MR100＋陸珊瑚Lv7の歴戦ネロ素材が必要。</b>ここがレベル上げとの接点。</td></tr>
<tr><td>R12防具の上限解放用に大霊脈玉を集める</td><td><b>MR100のイベント経由もある。</b>大霊脈玉だけなら自前地帯Lv7を要求しない。その他の必要素材は別。</td></tr>
</tbody></table></div>
<div class="fb-gates"><div><b>MR50</b><span>R10アンジャナフ火<br>瘴気Lv5 → 歴戦オドガロン等</span></div><div><b>MR70</b><span>R11氷刃ベリオ氷<br>森林Lv6 → 傷ついたガルルガ等</span></div><div><b>MR100</b><span>R12砕光・覚醒武器<br>陸珊瑚Lv7 → 歴戦ネロ等</span></div></div>
<p class="fb-note">MR49・69・99の上限解放任務も必要。「武器を作れるMR」と「回復カスタムができるMR」は別です。<a href="https://game8.jp/mhw/292922" target="_blank" rel="noopener noreferrer">レア度別の材料</a>／<a href="https://gamewith.jp/mhw/165214" target="_blank" rel="noopener noreferrer">地帯レベルと上限</a></p>
<p><b>全地帯を上げず、必要な地帯だけ。</b>自分のMR・参加条件を満たせば、仲間の高レベルの導きで素材を集める方法もある。たとえば自分もMR100になったら、陸珊瑚Lv7を持つ人に歴戦ネロを相談できる。低MRのまま連れて行ってもらって条件を飛ばせるわけではない。仲間のMR・地帯Lvは未確認。</p>
<p class="fb-note"><a href="https://steamcommunity.com/app/582010/discussions/0/4738295219688352754/" target="_blank" rel="noopener noreferrer">参加条件・地帯分担のプレイヤー報告</a>。自前で育てるなら、目標地帯のモンスターの狩猟・部位破壊・罠などで進める。地帯固定中は設定を確認。地質学は素材回収の補助で、地帯レベル上昇を倍化する効果ではない。</p>
<p class="fb-warning"><b>回復カスタムを使うゼロ距離中心の運用が目標なら、導きは有力な準備。</b>「ミラの参加条件ではない」から「回復の準備も不要」にはしない。R12回復を目指す場合はMR100と陸珊瑚の素材を中目標にする。</p>
<details class="fb-sub"><summary>R12回復Ⅰの4素材と、防具の大霊脈玉クエスト</summary><p><b>歴戦の幻惑皮×7</b>（導き・歴戦ネロミェール）<br><b>みなぎる雷電殻×5</b>（導き・通常ジンオウガ）<br><b>霊脈の古龍骨×3</b>（導き・歴戦古龍）<br><b>導きの龍骨【陸珊瑚】×1</b>（陸珊瑚の骨塚）</p><p class="fb-note">通常フィールドの歴戦ネロの素材では代用しない。骨塚の採集ゲージはモンスター出現の地帯レベルとは別。</p><p>防具用の大霊脈玉は<b>「殲滅の主はまた鐘を鳴らす」／MR100以上</b>でも入手可能。このイベントで歴戦の幻惑皮が取れるわけではない。<a href="https://game8.jp/mhw/323240" target="_blank" rel="noopener noreferrer">大霊脈玉クエスト ↗</a></p></details>
</section>
<section><h2>いまの順番は、これだけ。</h2><p class="fb-route"><b>不足する5部位・昂揚／痛撃を確認</b><span>↓</span><b>金策・鎧玉・珠を並行して、防具を強化</b><span>↓</span><b>アルバ用の氷を保存 → ミラ用の物理武器・珠へ分岐</b><span>↓</span><b>回復を使いたい武器のレア度から、必要MRと地帯を選ぶ</b></p><p class="fb-note">一番先に確認したい数値は現在のMR。<a href="./osakenpiro.html?v=3#defense">既存のMR・防御記録欄</a>で確認する。ここを開いても、所持や工程完了は自動で変わりません。</p></section>
<p class="fb-note">調査：2026-09-21／制作案と実際の所持は別。出典は各項目に配置。既存の氷・火比較、現在地共有、メンバー報告を維持。この説明追加では新しい装備を採用済みにしていません。</p>
</div>`;
const style=document.createElement('style');style.textContent=`
.fatalis-brief{margin:12px 0 20px;border:1px solid #c5a87970;background:#0d2420}.fatalis-brief>summary{cursor:pointer;padding:15px 20px;list-style:none}.fatalis-brief>summary::-webkit-details-marker{display:none}.fatalis-brief>summary strong{display:block;font:600 23px/1.6 var(--serif,serif);color:#eddec0}.fatalis-brief>summary small{display:block;color:#b5c6b7;font-size:11px}.fatalis-brief>summary:after{content:'開く ＋';float:right;color:#cbb889;font-size:12px}.fatalis-brief[open]>summary:after{content:'閉じる −'}.fb-body{padding:8px 24px 22px}.fb-lead{font-size:15px;color:#e1dcc5;line-height:1.9}.fb-note{font-size:11px;line-height:1.9;color:#b8c4b3;margin:10px 0}.fb-body section{padding:23px 0;border-top:1px solid #819c7755;scroll-margin-top:20px}.fb-body h2{font:600 23px/1.6 var(--serif,serif);margin-bottom:12px}.fb-body h3{font:600 20px/1.5 var(--serif,serif);margin:8px 0}.fb-body p{line-height:1.95}.fb-links{padding:12px 0;gap:18px;flex-wrap:wrap}.fb-table{overflow:auto}.fb-table table{width:100%;min-width:560px;border-collapse:collapse;font-size:12px}.fb-table th{text-align:left;color:#d9c48d;font-weight:500}.fb-table td,.fb-table th{padding:10px 9px;border-bottom:1px solid #83957a44;vertical-align:top}.fb-quests{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:20px;margin:15px 0}.fb-quests article{border-left:2px solid #b6a579;padding:0 0 0 16px}.fb-quests p{font-size:12px}.fb-quests a{font-size:11px}.fb-warning{padding:12px 16px;border-left:3px solid #c5956b;background:#d5ad8010;font-size:12px;margin:16px 0}.fb-weapon{padding:15px 20px;background:#76956d13;border:1px solid #9cb08a55;margin:16px 0}.fb-sub{padding:14px 0;border-block:1px solid #9bad7744;margin:16px 0}.fb-sub summary{cursor:pointer;color:#ddc492;font-size:14px}.fb-sub p{margin-top:12px}.fb-skills{color:#dec898}.fb-gates{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:18px 0}.fb-gates>div{border-bottom:2px solid #9fae84;padding:10px 6px}.fb-gates b{display:block;font:24px var(--serif,serif);color:#d6c294}.fb-gates span{display:block;font-size:12px;margin-top:10px}.fb-route{font-size:14px;padding:18px 20px;border-left:2px solid #cbb47e;background:#80987612}.fb-route span{display:block;color:#b9ac7d;padding:7px 0}.fb-body a{color:#cad6b8}.fb-body a:hover{color:#ffe4a5}@media(max-width:740px){.fb-quests{grid-template-columns:1fr}.fb-body{padding:8px 16px 16px}.fb-body h2{font-size:21px}.fb-gates{grid-template-columns:1fr;gap:8px}.fb-gates>div{display:flex;gap:17px;align-items:center}.fb-gates span{margin:0}.fatalis-brief>summary{padding:13px 15px}.fatalis-brief>summary strong{font-size:21px}.fb-weapon{padding:13px 15px}.fb-lead{font-size:14px}}
`;document.head.append(style);
const header=document.querySelector('.shell>header');if(header)header.after(box);else document.body.prepend(box);
const nav=document.querySelector('.hunt-nav');if(nav){const a=document.createElement('a');a.href='#fatalis-prep';a.textContent='ミラ準備・金策';nav.prepend(a);}
const hashes=new Set(['#fatalis-prep','#fb-jewels','#fb-money','#fb-build','#fb-guiding']);
function reveal(hash){if(!hashes.has(hash))return;box.open=true;requestAnimationFrame(()=>document.querySelector(hash)?.scrollIntoView({block:'start'}));}
document.addEventListener('click',e=>{const link=e.target.closest('a');if(link&&link.origin===location.origin&&link.pathname===location.pathname&&hashes.has(link.hash)){e.preventDefault();history.replaceState(null,'',link.hash);reveal(link.hash);}});
window.addEventListener('hashchange',()=>reveal(location.hash));reveal(location.hash);
})();
