/* v0.5: source-reviewed routes, not inferred player progression. */
(()=>{'use strict';const D=window.HUNTING_DICTIONARY;if(!D?.entries)throw Error('Missing dictionary data');
const src={
 g_money:['GameWith｜金策の実践例','https://gamewith.jp/mhw/86420'],
 g_dodo:['Kiranico｜ドドド三兄弟のクエストデータ','https://mhworld.kiranico.com/en/quests/rGDa9/triple-threat-throwdown'],
 g_coal:['Kiranico｜ジンオウガよさらばの報酬データ','https://mhworld.kiranico.com/en/quests/n4qm9/adeus-ao-zinogre'],
 g_coal_play:['GameWith｜ジンオウガよさらば・燃料集め','https://gamewith.jp/mhw/232788'],
 g_flora:['Kiranico｜その艶姿、凍傷に注意','https://mhworld.kiranico.com/en/quests/reRa2/flora-frostbite'],
 g_thunder:['Kiranico｜鳴神上狼、荒事を成す・更新後の報酬','https://mhworld.kiranico.com/en/quests/n9ZDN/the-wrath-of-thunder-descends'],
 g_ruin:['Kiranico｜滅日のクエストデータ','https://mhworld.kiranico.com/en/quests/6YXvB/day-of-ruin'],
 g_ruin_play:['ふぐおん｜滅日と危険度3調査の報酬比較','https://mhw.fuguai-online.com/2024/02/08/metujitu-5waku/'],
 g_lava:['Kiranico｜我が名はヴォルガノス','https://mhworld.kiranico.com/en/quests/6WkOJ/the-names-lavasioth'],
 g_jagras:['Kiranico｜窮賊、ハンターを噛む！','https://mhworld.kiranico.com/en/quests/6Px9m/the-greatest-jagras'],
 g_botany:['ふぐおん｜植生研究所の拡張記録','https://mhw.fuguai-online.com/2018/02/02/sai-bai-jo/'],
 g_botany_steps:['ゲームれぼりゅー速報｜栽培・肥料・依頼人','https://blog.rebosoku.com/archives/mhw_vegetation.html'],
 g_botany_all:['Game8｜植生研究所の拡張一覧','https://game8.jp/mhw/183976'],
 g_botany_start:['Game8｜不穏の沼影','https://game8.jp/mhw/199625'],
 g_botany_three:['Game8｜涼爪と惨爪が交わる場所','https://game8.jp/mhw/205195'],
 g_box1:['Game8｜冷たい場所からこんにちは','https://game8.jp/mhw/290135'],
 g_box2:['Game8｜太古の輝きを求めて','https://game8.jp/mhw/290170'],
 g_fourth:['Game8｜捕獲：粘菌に秘訣あり！？','https://game8.jp/mhw/290198'],
 g_soil:['攻略レシピ｜優しい土は古代樹の寝床','https://mhwg.org/ida/229645.html'],
 g_base:['皆で一緒にモンハンライフ｜World装具の入手記録','https://a-to-monhan.com/2018/01/31/mhw-soui-entou/'],
 g_plus:['ゲーム攻略ブログ｜装具強化の進行記録','https://xn--zck9awe6d820vk6qg9be46k.com/monsterhunter-world-iceborne/81806/'],
 g_rock_base:['ウマロのゲームブログ｜不動の装衣の入手','https://umaroidblog.com/mhw_hudou'],
 g_rock:['Game8｜黒炯々の前提条件','https://game8.jp/mhw/290225'],
 g_thunderproof:['Game8｜捕獲：雷の顎を捕まえろ！','https://game8.jp/mhw/290224'],
 g_iceproof:['Game8｜舞踏家たちのドゥエート','https://game8.jp/mhw/290214'],
 g_ice_base:['アルテマ｜耐寒の装衣の納品条件','https://altema.jp/mhw/taikan'],
 g_glider:['Game8｜切り札は赤と黒','https://game8.jp/mhw/290185'],
 g_challenger:['Game8｜暴走、爆転、大競争！','https://game8.jp/mhw/290194'],
 g_fireproof:['Game8｜爆発粉砕フェスティバル！','https://game8.jp/mhw/290199'],
 g_bandit:['Game8｜凄惨の刻、来たる','https://game8.jp/mhw/290201'],
 g_evasion:['Game8｜孤高の白騎士','https://game8.jp/mhw/290200'],
 g_waterproof:['Game8｜飲みすぎ注意報！','https://game8.jp/mhw/290171'],
 g_water_base:['モンハン攻略・初心者講座｜耐水の納品依頼','https://bassy-mh.info/mhw-sougu.html'],
 g_dragon:['Game8｜耐龍の装衣・納品素材','https://game8.jp/mhw/209012'],
 g_temporal:['Game8｜転身の装衣の入手手順','https://game8.jp/mhw/221037'],
 g_temporal_plus:['Game8｜神時の台地','https://game8.jp/mhw/291293'],
 g_impact_plus:['Game8｜陰陽讃歌','https://game8.jp/mhw/291294'],
 g_immune:['GameWith｜免疫の装衣・改','https://gamewith.jp/mhw/92102'],
 g_apothecary:['Game8｜恐暴の宴','https://game8.jp/mhw/292809'],
 g_retired:['ふぐおん｜コラボ配信終了の公式告知を引用','https://mhw.fuguai-online.com/2021/11/06/ice-corabo-owari/']
};
for(const [id,[label,url]] of Object.entries(src))D.sources[id]={label,url,evidence:label.startsWith('Kiranico')?'ゲームデータ資料':'攻略・プレイ記録',note:id==='g_retired'?'告知の引用先を確認。現在の配信再開は確認されていません。':undefined};
const added=[];const part=(title,...steps)=>({title,steps});
function add(id,title,topic,quick,scope,guide,caution,sources,related=[],extra={}){added.push({id,title,topic,kind:'手順',discovery:true,first:false,addedIn:'0.5',edition:'iceborne',weapons:[],reading:'',aliases:[],quick,scope,guide,cue:title,action:'',caution,category:{money:'金策',decorations:'装飾品集め',botany:'植生研究所',mantles:'装衣の解放'}[topic],sources,related,reviewed:'2026-09-20',...extra});}
const eventNote='イベント欄で受注。ネット接続・配信状況はゲーム内で確認。この辞書は配信サーバーをリアルタイム監視していません。';
add('money-route','金策：まず換金、足りなければ周回','money','狩りに出る前に、換金専用アイテムを確認。','World / IB',[
part('先にやる','アイテムBOXの売却画面で、換金専用アイテムを確認。','専用の一括売却を使う。通常素材までまとめて売らない。'),
part('まだ足りない','上位なら「ドドド三兄弟」＋追い剥ぎ。','MR24以降は「ジンオウガよさらば」で蒸気機関の燃料も補充。')], '報酬金・落とし物・蒸気機関の副産物は別。一定額を必ず稼げるとは限らない。',['g_money','g_coal'],['money-dododo','money-coal'],{first:true,edition:'world',aliases:['金欠','お金','ゼニー','換金','金のたまご']});
add('money-dododo','金策：ドドド三兄弟＋追い剥ぎ','money','3頭を攻撃して、換金用の落とし物も回収。','上位★6イベント／HR13以上',[
part('周回手順','追い剥ぎの装衣を持ち込む。改でなくてもよい。','「ドドド三兄弟」を受注。3頭を狩猟し、換金用の落とし物を拾う。','帰還後に換金。装飾品も副産物として集まる。')],'報酬金14,040zは基礎値。マルチ人数や失敗条件、売却品で手取りは変わる。',['g_dodo','g_money'],['mantle-bandit','money-route'],{edition:'world',availability:'event',note:eventNote,aliases:['ドドド','金策クエスト','追い剥ぎ金策']});
add('money-coal','燃料周回：ジンオウガよさらば','money','石炭を集め、蒸気機関の補給につなげる。','M★6イベント／MR24以上',[
part('使い分け','闘技場の「ジンオウガよさらば」を狩猟。','入手した龍脈炭などを、蒸気機関の燃料へ。','蒸気機関で得た換金専用アイテムは売却する。')],'装飾品狙いの「鳴神上狼、荒事を成す」とは別クエスト。祭り限定の錬金チケットを常時報酬とは扱わない。',['g_coal','g_coal_play'],['deco-zinogre','money-route'],{availability:'event',note:eventNote,aliases:['石炭','龍脈炭','燃料','蒸気','ジンオウガさよなら']});
add('decorations-route','装飾品集め：HR／MRで行き先を分ける','decorations','基本の珠を埋めるか、希少な4スロ珠を狙うか。','World / IB／ランク別の入口',[
part('上位の珠','HR13以上：ドドド三兄弟。','HR50以上：我が名はヴォルガノス／窮賊、ハンターを噛む！'),
part('アイスボーンの珠','MR3以上：その艶姿、凍傷に注意。採集で太古の珠を集める。','MR24以上：鳴神上狼、荒事を成す。','MR100以上：滅日。安定して倒せる周回先を選ぶ。')],'珠の種類ごとに鑑定候補が違う。すべてのクエストから全装飾品が出るわけではない。',['g_dodo','g_lava','g_flora','g_thunder','g_ruin'],['deco-flora','deco-zinogre','deco-teostra','deco-lavasioth','deco-jagras'],{first:true,edition:'world',aliases:['珠集め','装飾品クエスト','珠ガチャ','4スロ','封じられた珠']});
add('deco-flora','採集で珠：その艶姿、凍傷に注意','decorations','戦闘なしで、太古の珠を集める入口。','M★1イベント／MR3以上',[
part('周回手順','「その艶姿、凍傷に注意」を受注。','渡りの凍て地で、氷瑞花を10個納品。','太古の珠を鑑定する。採集装備なら戦闘用セットと分けて保存。')],'攻撃珠IIなど最高レア帯の狙い撃ち用ではない。MR1からではなくMR3が受注条件。',['g_flora'],['decorations-route','deco-zinogre'],{availability:'event',note:eventNote,aliases:['氷瑞花','氷の花','凍傷','太古の珠','採取珠']});
add('deco-zinogre','MR24から：鳴神上狼、荒事を成す','decorations','更新後は、封じられた珠2個が確定枠。','M★6イベント／MR24以上',[
part('周回手順','古代樹の森の「鳴神上狼、荒事を成す」を受注。','歴戦ジンオウガを狩猟。','封じられた珠・刻まれた珠を鑑定する。')],'特定の装飾品が2個確定する意味ではない。古い報酬表と、燃料クエストを混同しない。',['g_thunder'],['deco-teostra','money-coal'],{availability:'event',note:eventNote,aliases:['鳴神','なるかみ','ジンオウガ装飾品','封じ珠','MR24珠']});
add('deco-teostra','MR100から：滅日','decorations','兵器置き場で、歴戦テオから封じられた珠を。','M★6イベント／MR100以上',[
part('周回手順','「滅日」を受注。兵器置き場で歴戦テオ・テスカトルを討伐。','封じられた珠3個の確定枠＋抽選枠を鑑定。','安定しなければ鳴神、または得意な危険度3の調査も比較する。')],'MR99以下では受注不可。3個確定は鑑定前の珠であり、欲しいスキルの確定ではない。',['g_ruin','g_ruin_play'],['deco-zinogre','mantle-fireproof'],{availability:'event',note:eventNote,aliases:['滅日','めつじつ','テオ珠','MR100装飾品','攻撃珠II','達人珠II']});
add('deco-lavasioth','上位の珠：我が名はヴォルガノス','decorations','風化した珠2個の確定枠がある上位イベント。','上位★9イベント／HR50以上',[
part('周回手順','「我が名はヴォルガノス」を受注。','歴戦ヴォルガノスを狩猟し、報酬を鑑定。')],'MRの4スロ希少珠を狙うクエストではない。上位の不足分を埋める用途。',['g_lava'],['deco-jagras','decorations-route'],{edition:'world',availability:'event',note:eventNote,aliases:['ヴォルガノス珠','風化した珠','装飾品上位']});
add('deco-jagras','上位の珠：窮賊、ハンターを噛む！','decorations','大きなドスジャグラスで、上位の珠を補充。','上位★9イベント／HR50以上',[
part('周回手順','「窮賊、ハンターを噛む！」を受注。','落とし物を回収し、ドスジャグラスを狩猟。','古びた珠などの報酬を鑑定する。')],'通常のドスジャグラスのクエストとは別。アイスボーン最高レア珠の周回先とは分ける。',['g_jagras'],['deco-lavasioth','decorations-route'],{edition:'world',availability:'event',note:eventNote,aliases:['窮賊','きゅうぞく','ドスジャグラス珠']});
add('botany-route','植生研究所：何を解放したい？','botany','種類・栽培枠・収穫BOX・肥料は、別の解放。','World / IB',[
part('施設そのもの','任務★3「不穏の沼影」まで進め、アステラの植生研究所へ。'),
part('目的を選ぶ','育てたい物がない → 栽培できる種類を追加。','同時に育てたい → 栽培枠を増やす。','すぐ満杯 → 収穫BOXを拡張。','量と手間を改善 → 肥料・やわらかい土を解放。')],'MRに進んでも、下位・上位の依頼を飛ばした分は自動で埋まらない。',['g_botany_start','g_botany_steps','g_botany_all'],['botany-kinds','botany-slots','botany-box','botany-fertilizer','botany-fourth'],{first:true,edition:'world',aliases:['植生','植生解放','植物研究所','栽培','農場','増やせない']});
add('botany-kinds','マンドラゴラ・雷光虫を栽培したい','botany','キノコと虫の追加は、リオレイアの依頼。','World／種類の追加',[
part('草・実を増やす','植生研究所の依頼を受け、フリー★3「そろそろ仙人掌の季節です」。','小玉サボテン20個を納品。'),
part('キノコ・虫を増やす','フリー★4「女王は荒地にて燃ゆる」でリオレイアを狩猟。','植生研究所で依頼可能なアイテムを確認。')],'種類を増やすクエスト。栽培枠や肥料そのものは別の依頼。',['g_botany','g_botany_steps'],['botany-slots','botany-fertilizer'],{edition:'world',aliases:['マンドラゴラ','雷光蟲','不死虫','光蟲','クモの巣','栽培できない']});
add('botany-slots','栽培枠を2枠・3枠に増やす','botany','カンタロス → 上位レイギエナ＆オドガロン。','World／2枠目HR8、3枠目HR13以上',[
part('2枠目','アステラの植生研究所の依頼を受ける。','フリー★4「怒涛のカンタロス祭り」でカンタロス14匹を討伐。'),
part('3枠目','2枠目を解放し、龍結晶の地の初回探索を進める。','上位レイギエナ・上位オドガロンを発見し、植生研究所の所長へ。','フリー★7「涼爪と惨爪が交わる場所」で2頭を狩猟。')],'下位で会っただけでは、上位の発見条件を満たしたことにはならない。',['g_botany','g_botany_three'],['botany-fourth','botany-route'],{edition:'world',aliases:['植生2枠','植生3枠','枠拡張','カンタロス祭り','涼爪','所長依頼']});
add('botany-box','収穫BOXを20・30枠にする','botany','クエストではなく、素材の納品依頼。','World／収穫BOX',[
part('20枠へ','HR6以降、植生研究所で「収納を笑うものは収納に泣く」を受ける。','下位ジュラトドスの水袋を用意し、調査資源管理所で納品。'),
part('30枠へ','HR12以降、「たかが収納、されど収納」を受ける。','上位ジュラトドスの大水袋を用意し、納品を完了する。')],'必要数と研究ポイントは依頼画面で確認。素材を持っているだけでは達成にならない。',['g_botany_steps','g_botany_all'],['botany-mr-box','botany-fourth'],{edition:'world',aliases:['収穫BOX','収納','水袋','大水袋','すぐ満杯']});
add('botany-mr-box','収穫BOXを40・50枠へ広げる','botany','セリエナの船乗りの依頼を、順番に。','IB／40枠目MR3、50枠目MR4以上',[
part('40枠へ','任務M★1「力仕事はバフバロにお任せ」をクリアし、船乗りと会話。','フリーM★1「冷たい場所からこんにちは」で特産ふきのとう20個を納品。'),
part('50枠へ','前段を終え、任務M★2「氷土の番人トビカガチ亜種」をクリア。','船乗りと会話し、フリーM★2「太古の輝きを求めて」。','コハクのかたまりから、大地のコハク20個を集めて納品。')],'「太古」の探索可能エリアはクエスト依存。通常探索の採集ルートをそのまま当てはめない。',['g_box1','g_box2'],['botany-box','botany-fourth'],{aliases:['特産ふきのとう','大地のコハク','太古の輝き','船乗り','収穫50']});
add('botany-fourth','4枠目が出ない：粘菌に秘訣あり！？','botany','ブラキを捕獲する前に、植生の旧依頼も確認。','IB／M★3フリー・MR10以上',[
part('出現まで','World側の植生クエスト・納品依頼を完了する。','M★2「太古の輝きを求めて」を完了する。','任務M★3「粉砕のクロスカウンター」をクリア。','セリエナの船乗りと会話する。'),
part('最後の依頼','フリーM★3「捕獲：粘菌に秘訣あり！？」を受注。','ブラキディオスを捕獲し、栽培4枠目を解放。')],'狩猟ではなく捕獲。出現しないときは、船乗りと旧拠点の未完了依頼へ戻る。',['g_fourth','g_botany_all'],['botany-slots','botany-mr-box','botany-soft-soil'],{first:true,aliases:['4枠','四枠','粘菌','ブラキ捕獲','植生最大','出ない']});
add('botany-fertilizer','肥料の依頼：話す相手も違う','botany','研究所だけでなく、アステラの団員にも依頼がある。','World／肥料の追加',[
part('活性剤','任務★4「飛べ、パオウルムー！」後、「萌えよ古代樹」。サンゴの紅骨を納品。'),
part('上位の4依頼','上位ドスジャグラス狩猟 → 物腰柔らかな5期団 →「草木達よ、健やかに育て」。','上位ボルボロス狩猟 → 姉妹肌の4期団 →「キノコ、山盛り！」。','上位ツィツィヤック狩猟 → 熱血漢の4期団 →「虫寄せ名樹計画」。','上位リオレイア狩猟 → マイペースな5期団 →「古代樹萌ゆるは天井知らず」。'),
part('受注後','調査資源管理所の納品依頼を開き、指定素材と研究ポイントを納める。')],'依頼の出現に使う相手と、納品素材の相手が違うものもある。キノコ菌床は掻鳥素材、いにしえの活性剤は痺賊竜素材。',['g_botany_steps','g_botany'],['botany-soft-soil','botany-fourth'],{edition:'world',aliases:['肥料','活性剤','キノコ菌床','ゼリー','肥料出ない','古代樹萌ゆる']});
add('botany-soft-soil','やわらかい土：肥料を切らさない','botany','肥料の依頼を終えてから、最後の納品。','World／肥料延長',[
part('解放','先に肥料追加の5依頼をすべて完了。','おっとりした植物学者から「優しい土は古代樹の寝床」。','いにしえの龍骨3個と研究ポイント1000を、調査資源管理所へ納品。'),
part('運用','必要な肥料の効果を先に付ける。','残り回数が切れる前に、やわらかい土で延長する。')],'土だけで、切れている肥料の効果を新しく付けることはできない。',['g_soil','g_botany_steps'],['botany-fertilizer','botany-fourth'],{edition:'world',aliases:['柔らかい土','やわらかい土','肥料延長','肥料切れ','いにしえの龍骨']});
add('mantles-route','装衣の解放：持っていない／改にできない','mantles','初入手はWorld側。改への強化はIB側。','World / IB／16種＋配信終了1種',[
part('まだ持っていない','下位・上位・特別任務の条件を確認する。','アステラの武具屋や、指定された依頼人へ報告。'),
part('改にしたい','元の装衣を所持しているか確認。','MR条件だけでなく、前提フリーや研究レベルも確認。','セリエナの武具屋の依頼、または指定された納品・MRクエストを完了。')],'装衣と重ね着防具は別。改にすることと、装衣の効果時間・耐性の理解も別に扱う。',['g_base','g_plus'],['mantle-rocksteady','mantle-temporal','mantle-bandit','mantle-evasion','mantle-thunderproof','mantle-assassin'],{first:true,edition:'world',aliases:['装衣装','装衣解放','装具','装衣改','強化できない','武具屋','装衣一覧']});
add('mantle-rocksteady','不動の装衣：入手と「黒炯々」','mantles','改が出ないなら、耐寒・耐雷の強化を先に。','初入手HR50以上／改MR17以上',[
part('初入手','上位の危険度3の歴戦モンスターを、異なる3種類討伐。','アステラの武具屋 → フリー★9「奈落にて君を喚ぶ」。','歴戦ヴァルハザクとオドガロンを狩猟し、武具屋へ。'),
part('改への強化','不動を所持し、M★4「舞踏家たちのドゥエート」と「捕獲：雷の顎を捕まえろ！」をクリア。','MR17以上でセリエナの武具屋へ。','M★4「黒炯々」でディアブロス亜種を狩猟。')],'同じ歴戦を3回ではなく3種類。不動の被弾を減らす仕組みは、無敵とは違う。',['g_rock_base','g_rock'],['mantle-iceproof','mantle-thunderproof','rocksteady-multihit'],{first:true,aliases:['不動','ふどう','黒炯々','くろけいけい','奈落','不動出ない']});
add('mantle-temporal','転身の装衣：特別任務を3つ辿る','mantles','「平伏するより他に無し」は、途中から突然は出ない。','初入手は上位特別任務／改MR150以上',[
part('初入手','HR16以上でソードマスターの依頼を確認。','特別任務「烈日」→ 関係者へ報告。','「パンドラの闘技場」→ ソードマスター・加工屋に会話。','「平伏するより他に無し」→ 加工屋へ報告。'),
part('改への強化','転身を所持し、MR150へ。','M★6「神時の台地」で歴戦キリンと歴戦ネロミェールを討伐。')],'初入手はフリーやイベントではなく特別任務。改の条件を、通常版の入手条件に混ぜない。',['g_temporal','g_temporal_plus'],['mantles-route','mantle-thunderproof'],{first:true,aliases:['転身','てんしん','ナナ','烈日','パンドラ','平伏','神時']});
add('mantle-bandit','追い剥ぎの装衣：金策は通常版から','mantles','改にしなくても、換金用の落とし物を集められる。','初入手★5／改MR12以上',[
part('初入手','フリー★5「最強・最恐・最高夫婦！」をクリア。','アステラの武具屋と会話。'),
part('改への強化','滑空・挑発・耐熱の強化クエストを3つ完了。','追い剥ぎを所持し、MR12以上でセリエナの武具屋へ。','M★3「凄惨の刻、来たる」でオドガロンを狩猟。')],'前提は「切り札は赤と黒」「暴走、爆転、大競争！」「爆発粉砕フェスティバル！」。',['g_base','g_bandit'],['mantle-glider','mantle-challenger','mantle-fireproof','money-dododo'],{aliases:['追い剥ぎ','おいはぎ','追剥','凄惨','金策装衣']});
add('mantle-evasion','回避の装衣：7種類と3つの前提','mantles','通常版は歴戦の種類数。改は別の装衣クエスト。','初入手は上位歴戦／改MR12以上',[
part('初入手','危険度2の上位歴戦モンスターを異なる7種類狩猟。','アステラの武具屋から、★9「新大陸の空と花」。','クエストをクリアして武具屋へ。'),
part('改への強化','滑空・挑発・耐熱の強化クエストを完了。','回避を所持し、MR12以上でセリエナの武具屋へ。','M★3「孤高の白騎士」でベリオロスを狩猟。')],'同じ相手7回ではない。前提3クエストは追い剥ぎ・改とも共通。',['g_base','g_evasion'],['mantle-glider','mantle-challenger','mantle-fireproof'],{aliases:['回避装衣','回避の装衣','孤高','白騎士','新大陸の空と花']});
add('mantle-glider','滑空の装衣：改への入口','mantles','改の依頼は、後続の装衣強化にもつながる。','初入手は陸珊瑚探索／改MR11以上',[
part('初入手','陸珊瑚の台地への初回探索を進める。'),
part('改への強化','MR11以上でセリエナの武具屋と会話。','M★3「切り札は赤と黒」でリオレウスとナルガクルガを狩猟。')],'このクエストは回避・追い剥ぎの強化依頼の前提。',['g_base','g_glider'],['mantle-evasion','mantle-bandit'],{aliases:['滑空','かっくう','切り札は赤と黒']});
add('mantle-challenger','挑発の装衣：蒼紅乱麻から','mantles','改のクエストは、回避・追い剥ぎの前提。','初入手★7／改MR11以上',[
part('初入手','龍結晶の地を探索し、上位レイギエナ・オドガロンの狩猟を進める。','上位リオレウス・リオレウス亜種の発見後、アステラの武具屋へ。','★7「蒼紅乱麻」をクリアし、武具屋へ報告。'),
part('改への強化','挑発を所持し、MR11以上でセリエナの武具屋へ。','M★3「暴走、爆転、大競争！」をクリア。')],'改はティガレックスとラドバルキンの狩猟。上位の依頼と混同しない。',['g_base','g_challenger'],['mantle-evasion','mantle-bandit'],{aliases:['挑発','蒼紅乱麻','暴走爆転']});
add('mantle-fireproof','耐熱の装衣：火と火 → 爆発粉砕','mantles','通常版を入手してから、MRの2頭クエストへ。','初入手★7／改MR11以上',[
part('初入手','龍結晶の地でヴォルガノス・ウラガンキンを発見。','上位リオレイア・ドドガマルの狩猟後、アステラの武具屋へ。','★7「火と火に交わる者達」をクリアし報告。'),
part('改への強化','耐熱を所持し、MR11以上でセリエナの武具屋へ。','M★3「爆発粉砕フェスティバル！」でブラキディオスとウラガンキンを狩猟。')],'この強化クエストも、回避・追い剥ぎの前提。',['g_base','g_fireproof'],['mantle-evasion','mantle-bandit','deco-teostra'],{aliases:['耐熱','火と火','爆発粉砕','テオ対策']});
add('mantle-thunderproof','耐雷の装衣：捕獲依頼を順に','mantles','キリンの前に、生態調査の連続依頼。','World捕獲依頼／改MR14以上',[
part('初入手','知的な生物学者の捕獲依頼を進める。','★2「捕獲：掻鳥の生態調査」→ ★3「捕獲：土砂竜の生態調査」。','★4「捕獲：浮空竜の生態調査」。','任務「谷の底にて待ち受けたるは」後、★5「捕獲：惨爪竜の生態調査」。','各回の報告後、★5「蒼白き蹄の調べ」でキリンを討伐。'),
part('改への強化','耐雷を所持し、任務M★4「暴れん坊大将狩猟大作戦！」をクリア。','セリエナの武具屋 → M★4「捕獲：雷の顎を捕まえろ！」。','アンジャナフ亜種を捕獲する。')],'連続依頼は捕獲必須。キリンは古龍なので討伐。改の達成は不動の強化前提。',['g_base','g_thunderproof'],['mantle-rocksteady','capture'],{aliases:['耐雷','キリン解放','蒼白き','捕獲依頼','雷の顎']});
add('mantle-iceproof','耐寒の装衣：再びの納品依頼','mantles','改はレイギエナ2種。終えると不動へ進める。','World納品依頼／改MR16以上',[
part('初入手','上位の任務進行後、アステラの武具屋から「武具屋の特殊装具開発・再び」。','依頼の素材とポイントを調査資源管理所へ納品し、武具屋へ。'),
part('改への強化','耐寒を所持し、MR16以上でセリエナの武具屋へ。','M★4「舞踏家たちのドゥエート」でレイギエナ・凍て刺すレイギエナを狩猟。')],'納品依頼の「再び」を取り違えない。不動・改が出ないなら、このクエストの完了を確認。',['g_ice_base','g_iceproof'],['mantle-rocksteady','mantle-waterproof'],{aliases:['耐寒','舞踏家','ドゥエート','特殊装具開発再び']});
add('mantle-waterproof','耐水の装衣：納品と、2つの煙筒依頼','mantles','改への前提は、解除・癒しの煙筒の強化。','初入手は上位／改MR6以上',[
part('初入手','★6解放後、アステラの武具屋から「武具屋の特殊装具開発」。','泥魚竜の上鱗3、上ヒレ1、研究ポイント1500を納品し、武具屋へ。'),
part('改への強化','耐水を所持し、M★2「捕獲：毒と麻痺の番」と「華やかなりしクイーンズ」をクリア。','MR6以上でセリエナの武具屋へ。','M★2「飲みすぎ注意報！」でプケプケ亜種を狩猟。')],'MRだけ上げても前提のフリーが未完了なら出ない。煙筒を未所持なら、関連項目から先に解放。',['g_water_base','g_waterproof'],['booster-cleanser','booster-health','mantle-iceproof'],{aliases:['耐水','飲みすぎ','特殊装具開発','プケプケ亜種']});
add('mantle-ghillie','隠れ身の装衣：初入手と改','mantles','任務の入手を確認して、ブラントドス捕獲へ。','初入手は任務★3／改MR2以上',[
part('初入手','任務★3「不穏の沼影」をクリアし、拠点で受領。'),
part('改への強化','隠れ身を所持し、MR2以上でセリエナの武具屋へ。','M★1「捕獲：雪の下にも三年」でブラントドスを捕獲。')],'捕獲依頼を討伐で終えない。',['g_botany_start','g_plus'],['capture','mantles-route'],{aliases:['隠れ身','かくれみ','雪の下にも三年']});
add('mantle-vitality','体力の装衣：火の竜からビッグホーンへ','mantles','通常版を受け取り、MRの依頼で強化。','初入手★5／改はM★1',[
part('初入手','任務★5「火の竜は森の頂」をクリア。アステラの武具屋と会話。'),
part('改への強化','体力を所持し、バフバロの任務を進めてセリエナの武具屋へ。','M★1「ビッグホーン・クラッシャー！」でバフバロを狩猟。')],'体力の装衣を未所持のまま改の依頼だけを探さない。',['g_base','g_plus'],['mantles-route'],{aliases:['体力装衣','ビッグホーン','体力の装衣']});
add('mantle-impact','強打の装衣：通常版とMR125の強化','mantles','通常版は危険度1の歴戦を5種類。','上位歴戦／改MR125以上',[
part('初入手','上位の危険度1の歴戦モンスターを異なる5種類狩猟。','アステラの武具屋 → ★9「泥土と骨鎚の激突合戦」。','ボルボロスとラドバルキンを狩猟し、武具屋へ。'),
part('改への強化','強打を所持し、MR125へ。','M★6「陰陽讃歌」でリオレイア希少種・リオレウス希少種を狩猟。')],'種類数の条件を、合計狩猟回数と混同しない。',['g_base','g_impact_plus'],['mantles-route'],{aliases:['強打','きょうだ','陰陽讃歌','泥土と骨鎚']});
add('mantle-apothecary','化合の装衣：研究レベルも条件','mantles','改は怒り喰らうイビルジョーの研究Lv4。','World研究条件／改M★5・MR21以上',[
part('初入手','大型モンスター10種のWorld側研究レベルを最大まで進め、生態研究所に報告。','任務「鋼鉄のクシャルダオラ」を終え、アステラの武具屋へ。','★8「胸をよぎる荒天の予感」をクリアして報告。'),
part('改への強化','化合を所持し、怒り喰らうイビルジョーの研究Lv4を生態研究所で確認。','セリエナの武具屋 → M★5「恐暴の宴」をクリア。')],'導虫の追跡レベルと、生態研究所の研究レベルは別。通常イビルジョーの研究だけではない。',['g_base','g_apothecary'],['mantle-immunity','mantle-dragonproof'],{aliases:['化合','かごう','恐暴の宴','研究4','胸をよぎる']});
add('mantle-immunity','免疫の装衣：死を纏うハザクを調べる','mantles','改は「生を食みて黄泉に還らず」。','World研究条件／改M★5',[
part('初入手','大型モンスター15種のWorld側研究レベルを最大まで進め、生態研究所に報告。','任務「爆炎のテオ・テスカトル」を終え、アステラの武具屋へ。','★8「熱砂の陽炎」をクリアして報告。'),
part('改への強化','免疫を所持し、死を纏うヴァルハザクの任務を完了。','その研究Lv4を生態研究所で確認し、セリエナの武具屋へ。','M★5「生を食みて黄泉に還らず」をクリア。')],'通常ヴァルハザクの研究とは別。痕跡を集めた後は生態研究所への報告も忘れずに。',['g_base','g_immune'],['mantle-apothecary'],{aliases:['免疫','めんえき','熱砂の陽炎','生を食みて','死を纏う']});
add('mantle-dragonproof','耐龍の装衣：イベントではなく特別任務','mantles','改はクエスト報酬ではなく「技術者の性」の納品。','上位特別任務／改M★5任務後',[
part('初入手','任務★7「不思議の国の女王」をクリアし、上位イビルジョーを調査。','明朗な学者との会話と痕跡集めを進める。','特別任務「食物連鎖の波に乗れ！」をクリアし、学者へ報告。'),
part('改への強化','耐龍を所持し、任務M★5「大災難、大再来」をクリア。','納品依頼「技術者の性」を受ける。','炎龍の剛翼1・鋼龍の剛翼1・研究ポイント2000を納品。')],'「食物連鎖」はイベント配信を待つものではない。',['g_dragon'],['mantles-route'],{aliases:['耐龍','耐竜','食物連鎖','技術者の性','龍装衣']});
add('mantle-assassin','アサシンの装衣：現在の新規入手は対象外','mantles','取得用・強化用のコラボクエストは配信終了。','公式配信終了：2021年12月3日9時（日本時間）',[
part('通常の取得ルートとして案内しない','入手用「軽やかで恐ろしく、そして熱く」は配信終了。','強化用「暗殺者」も同日終了。','すでに持っている装衣と、これから入手できるかは区別する。')],'再配信を確認できていないため、現行の解放チェックリストの必須項目にはしない。',['g_retired'],['mantles-route'],{availability:'retired',aliases:['アサシン','暗殺者','コラボ終了','取れない']});
add('booster-health','癒しの煙筒：耐水・改の前提','mantles','MRではリオレイアと亜種の依頼へ。','煙筒／装衣とは別',[
part('通常版','物語でゾラ・マグダラオスの任務を進め、癒しの煙筒を受領。'),
part('改への強化','MRのリオレイア・リオレイア亜種を発見し、それぞれのフリークエストを完了。','セリエナの武具屋から、M★2「華やかなりしクイーンズ」。','2頭を狩猟する。')],'装衣ではないが、耐水・改の依頼を出す前提なのでここに収録。',['g_base','g_plus'],['mantle-waterproof'],{aliases:['癒しの煙筒','癒し改','華やかなりしクイーンズ']});
add('booster-cleanser','解除の煙筒：耐水・改のもう一つの前提','mantles','MRのトビカガチ亜種を捕獲する。','煙筒／改の受注目安MR6以上',[
part('通常版','任務★4「飛べ、パオウルムー！」のクリア後、拠点で受領。'),
part('改への強化','解除の煙筒を所持し、MR6以上でセリエナの武具屋へ。','M★2「捕獲：毒と麻痺の番」でトビカガチ亜種を捕獲。')],'討伐ではなく捕獲。達成したら耐水・改のもう一つの前提も確認。',['g_base','g_plus'],['booster-health','mantle-waterproof'],{aliases:['解除の煙筒','毒と麻痺の番','煙筒改']});
const seen=new Set(D.entries.map(e=>e.id));for(const e of added){if(seen.has(e.id))throw Error('Duplicate '+e.id);seen.add(e.id);}
D.entries=[...added,...D.entries];D.version='0.5.0';D.latestEntryIds=added.map(e=>e.id);
D.guideTopics={money:{label:'金策',root:'money-route'},decorations:{label:'装飾品',root:'decorations-route'},botany:{label:'植生研究所',root:'botany-route'},mantles:{label:'装衣の解放',root:'mantles-route'}};
})();
