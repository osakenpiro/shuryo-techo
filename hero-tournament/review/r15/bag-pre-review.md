# 勇者トーナメント r15 カバン境界: 実装前の独立レビュー

判定: **下記の最小案で進めてよい。実装前のブロッカー 0 件**。実装/試遊/改善効果の確認は未実施。ゲームソースの変更は行っていない。

対象は r14 exact runtime `/workspace/work/hero-r14-verified-stage/HeroTournament-Windows-r14/game` と、指定された実画像 2 枚。r14 source は `4e12c91bac2b770d4322d36d51253cb8b136bd36`、配布 ZIP SHA-256 は `978f14fe78f9bff797804c2aa8a60f72134d988c55e2754b899b7b92e1cf42bd`。

## 今回の狙いと画像から確認したこと

遊び手が「見る → 荷物ごとの形と空きを考える → 選んで動かす」を行えるよう、**何も選択していなくても、隣り合う複数品の占有境界を読める**状態を目指す。全体絵・採用アート・既存の shape ルール・配置/回転操作を維持する。色の見分けと hover は補助に留める。

- 本編実画像 `hero-r14-native/HeroTournament-Windows-r14/playtest-evidence/20261104-105318-0538/bag-before-rearrange.png`: 大剣・小刀・ローブの全体絵が見える。各セルの枠は強いが、「同じ品の内側の線」と「品同士の境界」の差が弱い。対応 checkpoint は 6×5、GREAT_SWORD=(0,0,r0)、KNIFE=(2,0,r0)、MAGE_ROBE=(3,0,r0)、pocket=null。
- 固定原本 `hero-tournament/review/r13/assets/03-bag.png`: room のカバン内で全体絵と向きは維持されている。斧・パン・横長の道具などが密に隣接し、塗られたマスだけでは品ごとの区切りが読み取りにくい。
- 本編画像の盤面下部は固定 footer より下にある。これだけで盤面欠落とは断定しない。境界の検収用画像は workspace をスクロールして盤面全体が見える位置でも撮る。

`game-creation-flow` の今回の適用は「狙いを境界の読みやすさに限定し、同条件の前後を比較し、静止画から手触りや初見理解まで確認済みとしない」ことである。新しい役割・担当・公開権限は作っていない。

## 基準仕様と描画位置

| 対象 | 正本/処理 | 今回守ること |
| --- | --- | --- |
| 道具の形 | `build-core.js:6` BASE_ITEM_DEFS、および同ファイル ITEM_DEFS で合成する item-variants.js | 長方形への置換、画像アルファからの当たり判定生成をしない |
| 本編/room 共通 shape | `material-core.js:50` shape、同ファイル occupants / fit / adjacency | shape は 0..3 回転と原点正規化済み。配置・共有マス・隣接はこのセル集合による |
| 本編の盤面 | `material-ui.js:94` board、同ファイル 99..103 の objects と markup | `.grid-cells` / `.bag-objects` / `.bag-object` / `.cell-hit` / `.packed-illustration` |
| 本編の操作 | `material-ui.js:72` select、81..93 の preview/解除/回転、233 付近の click、257 以降の pointer/keyboard | 現行の data-item/data-hit/data-cell とイベント処理をそのまま使う |
| 本編の再利用 | 同 board は pack/event 内、`native-frame.js` のバッグ dialog でも利用 | pack だけ直し、読み取り用バッグを取り残さない |
| room の全体絵 | `room-ui.js:48` packedObject、52 以降の packing | `.room-cell` が占有と hit、`.room-bag-objects` / `.room-packed-object` が絵。ghost は配置候補 |
| room の操作 | `room-ui.js:77` ROTATE/CLEAR、82 付近 click、83 pointerover | PLACE、UNPACK、AUTO_PACK、MERGE/USE、選択、回転を変更しない |
| CSS | material-ui.css、supplies-ui.css、preparation-flow.css、native-frame.css、room.css | main は複数 stylesheet の cascade がある。room は room.css が native-frame.css より後 |

main の `.bag-objects` は `inset:3px`、room の `.room-bag-objects` は `inset:0`。同じ数式でも基準箱を取り違えると境界がずれる。main `.cell-hit` は shape の実セルにだけ存在し、L字の欠けは hit しない。room の実ボタンは全セルにあり、占有の判定は C.occupants。これらを装飾の都合で変えない。

## 推奨する最小案

**配置済み各品について、C.shape から同じ品の外周線だけを生成し、盤面の独立した SVG 装飾レイヤーに常時描く。** 全体絵や既存 grid を置き換えず、線を追加する。

1. 各 instance の `C.shape(i.defId, i.placement.rotation)` を取得する。同じ instance のセル集合の上下左右にセルがない辺だけを外周 segment とする。
2. segment を placement.x/y で盤面座標へ平行移動する。全品の union は取らない。隣り合う別品の共有辺は両品の境界として残す。
3. 盤面全体に合わせた SVG viewBox を使い、main は既存 objects 同等の inset 3px、room は inset 0。各品のまとまった外周として描き、欠けや穴を `fill="none"` のまま残す。
4. 線は細い暗色の下敷き＋明るい輪郭など、背景と絵の両方で読めるものにする。同じ品内部の細い grid と外周を線幅/明度で区別する。色ごとの item 識別を必須にしない。既存の選択強調はこの通常輪郭より目立つまま残す。
5. SVG は `aria-hidden="true"`、`pointer-events:none`、focus 対象外とする。既存 button や data-item/data-select/data-cell/data-hit を追加装飾へ複製しない。通常の選択、タップ配置、drag、Rキー/回すボタンは既存処理を通す。
6. 共通の小さな描画 helper を main/room の 2 箇所から使えば、shape の辺抽出と表示の差を限定できる。ゲームルール/保存形式/ネットワーク payload の変更は不要。

この案では全体絵は 1 個のまま、outline は占有セルの説明として独立する。`.bag-object` の bounding rectangle に一周の outline を付けるだけの案や、絵のピクセルを占有と扱う案は採らない。

## 実装時の落とし穴

- **main の共有セル:** `.bag-object.overlapped` は root ごと `scale(.84)` される。新しい輪郭をその子に入れると、実際の占有セルより縮む。装飾輪郭はこの transform の外で盤面座標に固定する。今回既存 transform/hit 自体をまとめて作り直す必要はない。
- **二重回転:** C.shape は回転済み。輪郭へさらに `.packed-illustration` の `--turn` や CSS rotate を適用しない。90/270 度で幅高さを入れ替えるのは既存の絵だけ。
- **L/T字と空き:** 外周を bounding box、convex hull、全品の union にすると欠けや隣接品の区切りを失う。MAGE_BOOTS は L字3セル、MAGE_HAT は T字4セル。欠けのセルに別品を置けることが必要。
- **hover/選択:** renderer は `selected=null` でも全配置品の輪郭を出す。room の hover で出す ghost は通常の収納品と数えない。main の updatePlacement が作る valid/invalid/merge preview より輪郭が強くならないようにする。
- **古い輪郭:** move/unpack/auto-pack/merge/use の後と選択解除後は、実 state の配置品から再生成する。保持した SVG を手動で継ぎ足す方式は避ける。
- **線の層:** art に完全に隠れない描画順とし、選択表示/隣接リンク/preview/共有数・Lvバッジは残す。線だけで同一セルに完全重複する複数品を区別できるとは主張しない。妖精ポケットの既存共有数表示を維持して確認する。
- **盤面端とサイズ:** SVG の stroke が viewBox 端で半分切れないよう、overflow と線幅を確認する。バッグ拡張後は state.height を使い、5段の固定値で作らない。main の cell gap/padding を今回変更すると hit/preview まで影響するため、既存 overlay 箱に合わせる。

## 有限の検収案

| 観点 | 具体的な確認 | 合格条件 |
| --- | --- | --- |
| 通常表示 | 本編3品・room複数品。selected=null、マウスを外す、hoverなし/タッチ相当で撮る | 各品の外周と隣の品との区切りを常時読める |
| 非長方形 | L字3セル、T字4セル、棒、長方形をそれぞれ0/90/180/270度 | 輪郭が C.shape と一致。回転前後で外周辺数不変。L=8辺、T=10辺。欠けに線や面をかぶせない |
| 隣接と空き | 2品が辺で接する、角で接する、L/Tの欠けに別品、同定義の品が隣接 | 同じ品内部の辺は外周にしない。別品の共有辺は消えない。空きセルの hit/配置判定が従来と一致 |
| 操作維持 | 選択→タップ配置、drag移動、R/回す、解除、外へ、AUTO_PACK、merge/use | 入力対象・結果state・保存がr14と一致し、線が入力を遮らない。ghost を収納品として誤表示しない |
| 特殊/端 | 妖精ポケット共有、盤面四辺、バッグ拡張後 | 論理セルから縮まない/ずれない、共有数が読める、外周が切れず古い線が残らない |
| アート維持 | 同じstate/向きでr14と比較 | 採用絵は1個の全体絵のまま。アートasset/--turn/size の意図しない変更なし |
| 実 runtime | 本編とroomを実Windowsで撮影。盤面全体が見える位置も残す | ネイティブ表示で両描画系が成立。変更前後のviewport/設定を記録 |

辺抽出の確認は手書きの小形状と回転・隣接 instance を中心にし、同じ描画 helper で作った期待値をそのまま正解にしない。実装後は既存の engine/resource/deadhand/feedback 回帰を一度通し、runtime 差分が装飾と読取検証の範囲に留まるか照合する。

技術的成立はソース読解から見込みあり、作品らしさは全体絵維持という採用条件に整合。実装後の視認性・人の初見理解・試遊での効果・配布可否は現時点で未確認である。次の成果は、この一案を実装した同条件の前後画像と上記の最小操作確認。
