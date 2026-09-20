/* v0.4: 16 source-reviewed discoveries. No generated artwork or measured-game claims. */
(()=>{'use strict';
const D=window.HUNTING_DICTIONARY;if(!D?.entries)throw Error('Dictionary data missing');
Object.assign(D.sources,{
 c_slinger:{label:'CAPCOM公式FAQ｜スリンガーの弾の交換',url:'https://www.capcom.co.jp/support/faq/platform_pc_monsterhunter_world_0141878.html',evidence:'公式FAQ'},
 c_return:{label:'CAPCOM公式FAQ｜帰還とクエストリセット',url:'https://www.capcom.co.jp/support/faq/platform_pc_monsterhunter_world_0141868.html',evidence:'公式FAQ'},
 c_aim:{label:'CAPCOM公式FAQ｜弾が右に逸れる理由（比較GIFあり）',url:'https://www.capcom.co.jp/support/faq/platform_ps4_monsterhunter_world_0141144.html',evidence:'公式FAQ'},
 c_forge:{label:'CAPCOM公式FAQ｜装備強化画面の比較操作',url:'https://www.capcom.co.jp/support/faq/platform_pc_monsterhunter_world_0141889.html',evidence:'公式FAQ'},
 c_join:{label:'CAPCOM公式FAQ｜途中参加とクリア扱い',url:'https://www.capcom.co.jp/support/faq/platform_pc_monsterhunter_world_0141935.html',evidence:'公式FAQ'},
 c_guiding:{label:'公式発表の転載記録｜導きの地の調整（電撃オンライン）',url:'https://dengekionline.com/articles/14682/',evidence:'公式発表の転載記録',note:'2019年10月9日の公式投稿本文を転載先で確認。元の投稿画面は未確認。PS4で先行した更新の説明で、現在のIB向けに収録。'},
 c_v14:{label:'CAPCOM発表｜導きの錬金術・ライドコールの並び順',url:'https://prtimes.jp/main/html/rd/p/000001592.000013450.html',evidence:'CAPCOM発表',note:'2020年7月の機能追加を参照。掲載当時のイベント開催期間は採用しない。'},
 c_awake:{label:'CAPCOM発表｜覚醒値と覚醒能力の仕組み',url:'https://prtimes.jp/main/html/rd/p/000001415.000013450.html',evidence:'CAPCOM発表',note:'2020年3月のSteam版説明。過去の配信日程を現在の開催予定として扱わない。'},
 f_lure:{label:'ふぐおん｜導きの地・著者作成の出現表と注記',url:'https://mhw.fuguai-online.com/2019/12/27/mitibiki-mons-zenzu/',evidence:'プレイヤー調査',note:'2023年12月更新の本文注記を確認。表画像の転載はせず、個別の地帯・レベルは原表への参照で補う。'}
});
const added=[];
function add(id,title,quick,action,caution,scope,category,source,aliases,related,compare,extra={}){
 added.push({id,title,reading:'',kind:'Tips',discovery:true,first:false,addedIn:'0.4',edition:scope.startsWith('World')?'world':'iceborne',weapons:[],quick,cue:title,action,caution,scope,category,sources:[source],aliases,related,compare,reviewed:'2026-09-20',...extra});
}
add('guiding-fixed-label','「固定調査」を選んでも、Lvは固定されない','募集の目標と、実際の固定設定は別。','クエストボードの「導きの地」で、地帯Lvを固定する設定を確認。','探索目的の名前を変えるだけでは、Lvの変動は止まらない。','IB／導きの地・固定設定追加後','設定の奥','c_guiding',['固定調査','レベル固定','地帯レベル','固定したのに','導き固定'],['guiding-fixed-personal','guiding-goal'],[['探索目的','募集の看板'],['地帯Lvの固定','変動を止める']],{route:'クエストボード → 導きの地 → 地帯Lvの固定設定',first:true});
add('slinger-restore-ammo','閃光を外せば、さっきの石ころに戻る','持込弾は、拾った弾を捨てずに重ねて装填。','閃光弾などのアイテムを外し、拾った弾を再び使う。','別の「拾う弾」へ交換した場合は、前の弾を地面に落とす。','World共通／スリンガーの弾の交換','マルチ・準備','c_slinger',['閃光外す','石ころ消えた','弾戻す','ネット外す','スリンガー交換','壁ドン弾'],['slinger-ammo-retain','flash-resistance-mr'],[['持込弾に切替','拾った弾は保持'],['別の拾う弾へ','前の弾を落とす']],{first:true});
add('quest-return-reset','素材を持ち帰るなら「帰還」','「リセット」は、拾った素材も取り消す。','回収した物を残すなら帰還。練習前のアイテム状態へ戻すならリセット。','帰還はクエストクリアではない。帰還で消費品が元に戻るわけでもない。','World共通／クエストの中断','マルチ・準備','c_return',['帰還','リセット','素材消えた','持ち帰る','消費取り戻す','練習'],['radial-loadout'],[['帰還','入手品を保持'],['リセット','開始前の状態へ']],{route:'メニュー → クエスト → 帰還／クエストリセット',first:true});
add('aim-foreground','狙った弾が、右へ逸れるのはなぜ？','手前の草や環境生物にも、照準が合う。','射線の手前を確認し、位置をずらして狙い直す。','近距離ではカメラと発射位置のズレも大きい。すべての外れ方が同じ原因ではない。','World共通／弓・ボウガン・スリンガー','効かない理由','c_aim',['右に逸れる','矢が曲がる','照準ずれる','弾道','回復ツユクサ','射線'],['bow-distance','brightmoss-air'],[['見ているもの','奥のモンスター'],['照準が拾うもの','手前のギミック']],{mediaSource:'c_aim',mediaLabel:'公式の比較GIFで確認 ↗'});
add('forge-compare','加工屋で、画面を戻さず比較できる','強化画面の比較操作は、左スティック押込み／Ctrl。','選択した装備の比較表示を使い、強化前後を確認する。','PC公式FAQの標準操作。キー変更・入力機器で表記は異なる。','World共通／加工屋・装備強化','設定の奥','c_forge',['装備比較','強化前後','Ctrl','L3','左スティック','防御力比較'],['hitzone'],[['コントローラー','左スティック押込み'],['キーボード標準','Ctrl']],{route:'加工屋 → 装備強化 → 比較表示'});
add('late-join-clear','倒したのに、自分のクリアにならない？','遅い途中参加は、報酬水準の表示を確認。','自身のクリアが目的なら、参加前に報酬の水準を確認する。','一定時間後に参加し、報酬水準が低い場合は原則クリア扱いにならない。','World共通／クエスト途中参加','マルチ・準備','c_join',['救難クリア','途中参加','未クリア','報酬水準','達成にならない'],['quest-return-reset'],[['参加できる','共闘は可能'],['自分の達成扱い','参加条件を確認']]);
add('guiding-fixed-personal','フレンドの導きでも、自分のLvを守れる','Lvの固定は、参加者それぞれの設定。','参加側でも、自分の固定設定を確認してから出発。','ホストの設定が、自分の設定の代わりになるわけではない。','IB／導きの地・固定設定追加後','導き・探索','c_guiding',['参加者固定','フレンド導き','ホスト固定','自分のレベル下がる'],['guiding-fixed-label'],[['ホスト','自分の設定'],['参加者','各自の設定']]);
add('guiding-tail-traces','切った尻尾も、おびき出しの手掛かりに','導きでは、切断部位の剥ぎ取りも特殊痕跡の入口。','本体剥ぎ取り・切断部位剥ぎ取り・捕獲達成を活用。','未解析の特殊痕跡の話。拾う落とし物すべてを指すものではない。','IB／導きの地・特殊痕跡の入手調整後','導き・探索','c_guiding',['尻尾','特殊痕跡','剥ぎ取り','未解析','捕獲痕跡'],['guiding-lure-melding','guiding-geologist'],[['落とし物','素材回収'],['剥ぎ取り・捕獲','特殊痕跡の入手機会']]);
add('guiding-discovery-level','見つけただけで、地帯Lvは動かない','発見だけで変動する旧挙動は調整済み。','別の相手を見つけること自体は、Lv変動と区別して考える。','狩猟や痕跡集めまで無影響、という意味ではない。','IB／導きの地・発見時変動の修正後','導き・探索','c_guiding',['発見で下がる','レベル変動','導き古い攻略','見つけただけ'],['guiding-fixed-label'],[['発見だけ','変動しない'],['他の調査行動','別の判定']]);
add('guiding-lure-melding','おびき出し用の痕跡は、錬金でも作れる','「導きの錬金術」で、解析済みの特殊痕跡を作る。','マカ錬金の候補から必要な痕跡を選ぶ。自然出現を待つ以外の選択肢。','作成候補と必要素材を確認。すべての相手を無条件で呼べるわけではない。','IB／導きの錬金術が利用可能な進行度','導き・探索','c_v14',['おびき出し','誘き出し','痕跡錬金','特殊痕跡錬金','出てこない','導きの錬金術'],['guiding-tail-traces','guiding-lure-level'],[['自然出現','相手を待つ'],['痕跡を錬金','候補から用意']],{route:'マカ錬金 → 導きの錬金術',first:true});
add('raider-order-hub','ライドコールの並び順は、拠点でも直せる','出発してから、アイテム欄を並べ直さなくていい。','アイテムウィンドウの並び順変更で、指笛を使いやすい位置へ。','ライド解放とは別の設定。ショートカットの配置とも別。','IB／Ver.14系で追加された拠点内表示','設定の奥','c_v14',['ライドコール順番','指笛並び順','アイテム順番','ライド探す'],['raider-ride-items','radial-loadout'],[['並び順の変更','拠点で準備'],['ライドの使用','解放済みの地域で']],{route:'アイテムウィンドウ → アイテムの並び順変更'});
add('awakened-potential','欲しい覚醒能力がないなら、取らなくていい','「蓄積」で、次の候補に望みをつなぐ。','能力を付与せず覚醒値を蓄積する選択がある。','良い能力が少し出やすくなるだけ。次回の当たりを保証しない。','IB／覚醒武器の強化が解放された後','クラッチ・武器','c_awake',['覚醒ガチャ','蓄積','能力いらない','龍光石','ムフェト強化'],['awakened-overwrite','awakened-field-progress'],[['付与','今の能力を採用'],['蓄積','次の候補へ']],{route:'加工屋 → 覚醒武器の強化'});
add('awakened-overwrite','覚醒能力は、後から入れ替えられる','一度選んだ能力も、新しい能力で上書きできる。','能力構成を変更したいときは、既存枠への上書きを使う。','最大5枠。一部の能力や特別なレア度は重複不可。','IB／覚醒武器の強化','クラッチ・武器','c_awake',['覚醒能力変更','覚醒上書き','覚醒失敗','5枠','ムフェト武器'],['awakened-potential'],[['今の能力','永久固定ではない'],['新しい能力','既存枠へ上書き']]);
add('awakened-field-progress','覚醒値は、狩りの中でもためられる','該当の緊急任務で、装備中の覚醒武器にも成長機会。','覚醒武器を装備して部位破壊などを達成し、リザルトを確認。','通常のクエストを何でも回れば育つ、という仕様ではない。','IB／覚醒武器・対応する緊急任務中','クラッチ・武器','c_awake',['覚醒値','部位破壊覚醒','龍光石以外','覚醒武器育成'],['awakened-potential'],[['加工屋','覚醒素材を投入'],['対応する緊急任務','部位破壊など']]);
add('guiding-lure-level','呼んだ相手の通常／歴戦は、地帯も確認','おびき出し先の地帯とLvが、個体の出方に関わる。','必要な素材に合わせ、出現表で相手・地帯・Lvを照合。','全種共通の「Lvいくつなら歴戦」ではない。低い地帯へ呼ぶと通常になる場合がある。','IB／導きの地・おびき出し','導き・探索','f_lure',['歴戦呼べない','通常素材','歴戦素材','おびき出しレベル','普通の個体'],['guiding-ruiner-ice','guiding-lure-melding'],[['欲しい素材','通常／歴戦を確認'],['呼ぶ場所','地帯とLvを確認']],{mediaSource:'f_lure',mediaLabel:'著者の地帯別出現表を見る ↗'});
add('guiding-ruiner-ice','歴戦の悉ネギを狙うなら、氷雪Lv7','氷雪Lv7は歴戦。ほかのLv7では通常も出る。','歴戦素材が目的なら、氷雪Lv7でのおびき出しを選択肢に。','「悉くを殲ぼすネルギガンテ」の個別条件。ほかの相手に一般化しない。','IB／導きの地・氷雪Lv7利用時','導き・探索','f_lure',['悉ネギ','ことネギ','悉くを殲ぼすネルギガンテ','歴戦ネルギガンテ','氷雪7','氷雪地帯'],['guiding-lure-level'],[['氷雪Lv7','歴戦'],['ほかの地帯Lv7','通常／歴戦がランダム']]);
const ids=new Set(D.entries.map(e=>e.id));
for(const e of added){if(ids.has(e.id))throw Error('Duplicate entry: '+e.id);ids.add(e.id);}
D.entries=[...added,...D.entries];D.version='0.4.0';D.latestEntryIds=added.map(e=>e.id);
})();
