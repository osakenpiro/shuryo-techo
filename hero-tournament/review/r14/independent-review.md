# 勇者トーナメント r14 独立レビュー

- 対象コミット: `4e12c91bac2b770d4322d36d51253cb8b136bd36`。作業ツリー clean を確認。
- 対象: `hero-tournament/build-r14/`、`.github/workflows/hero-tournament-r14.yml`、ローカル作成済み stage と r13 baseline の照合。
- 結論: **ソース採用を止める指摘 0 件**。Windows CI 実行前の判定であり、実 r14 EXE、native checkpoint、スクリーンショット、最終 ZIP の承認は未実施。公開済み r13 の変更や r14 の公開は本レビューで行っていない。

## 変更範囲と固定値

r13 baseline ZIP は 164584657 bytes、SHA-256 `2d6c41c5535e18077e845cf197014cd4c68b3bf4247073ec7a1ad9253e4b45cb`。prepare は取得物のサイズ・SHA・ZIP CRC、既存 manifest 全エントリを検証する。overlay は厳密に 5 ファイルに限定される。既存 3 ファイルは baseline SHA を照合し、新規 2 CSS は baselineSHA=null かつ baseline 側に存在しないことを要件とする。

以下の candidate SHA を実ファイルと照合した。ローカル stage の同 5 ファイルも一致する。

| ファイル | Candidate SHA-256 |
| --- | --- |
| game/index.html | `8050fcc7c91910d22e61f1ebad62f0d6c99c1a665e28609f6a9fba7c7c51b66d` |
| game/room.html | `5fda50c388bb20ade835b8ce3a29e463567890a24b389875b179467e53cb7234` |
| game/native-layout-review.css | `853ce427a0f53ca378d726ab11e803e22ee33bdcbc3e01b800eabace171dce82` |
| game/room-layout-review.css | `1cfc4f227957e0632aa20e6e669d1bd8369a566f392cf82b20e0f9e9fa321da9` |
| game/windows-playtest.js | `a518c97dbfd369b18dc6e1b554cea5970c193cd12dcd1c63f06e89ae37f7b3c9` |

UI 4 ファイルは既存の採用 layout-candidate と byte 単位で一致する。HTML は stylesheet link 各 1 本の追加だけで、除去すると改行正規化後に baseline と一致する。QA の windows-playtest.js は初期/続きの 2 箇所で geometry selector を拡張しただけで、baseline への厳密置換で candidate を再構成できた。報酬 3×4、成長 3×4 の計 24 selector を DOMRect 読取に追加し、ゲーム状態を変更する処理の追加はない。

ルールに関係する adventure-core.js、ordered-combat.js、room-combat.js、material-core.js、resource-rules.js、および battle-feedback.js / CSS、Launcher.cs は baseline と byte 一致を確認した。CSS の適用範囲は幅 900 px 以上の対象画面で、報酬/成長比較と arena 内の配置・余白・アート寸法を調整する。必要な名前・効果・数値・CTA の非表示化はない。

## Manifest と EXE pin

ローカル manifest は重複なし、全収録ファイルの bytes/SHA 一致、新規 2 CSS の収録を確認した。manifest 自身・EXE・build-receipt は manifest file list から除外され、循環参照がない。生成 BuildStamp.cs にローカル manifest の SHA が埋め込まれている。

build.ps1 は元 Launcher.cs と新 BuildStamp をコンパイルし、verify-only の成功、resource-rules.js 改竄時の exit 2、復元後の成功を要求する。smoke、learning、room、solo journey の終了コード・時間切れを確認し、3 系列の native playtest は complete/PASS、画像数も検査する。実 EXE の改竄拒否については、今後作成される Windows artifact で証跡の照合が必要。

## Geometry 検査と負の検査

native-layout-check.py は実 WebView2 checkpoint の geometry を入力として使い、次を検査する。

- 各 three-picks checkpoint は手札 5 枚、footer 1 個を要求。全カードの高さが正で、画面上端以降かつ footer 上端以内。badge overlap が false、横にはみ出さないことも要求。
- reward/growth の全 3 選択肢について、各 4 field の geometry が存在し、正の寸法を持ち、workspace 内に収まることを要求。
- 手札、reward、growth の正規サンプルがそれぞれ最低 1 個必要。失敗時は結果 JSON を作らず非ゼロで終了。
- build.ps1 がこの検査を finalize より先に実行し、非ゼロなら停止する。

独立実行した負の検査:

1. 実 r13 native evidence を新 checker に渡すと、既知の手札下端 762.1875 の見切れで拒否した。
2. checker 分岐の合成 fixture で positive 1 ケース成功、negative 8 ケースをすべて拒否した。内訳は growth 欠落、reward field 欠落、reward 縦見切れ、growth 横はみ出し、カード見切れ、badge overlap、カード不足、document 横はみ出し。negative では出力 JSON が作られないことも確認した。これは検査器の制御確認であり、実 native の代用ではない。

検査は箱の境界を評価するため、文字の可読性・実描画の重なり・気持ちよさの最終判定にはスクリーンショット/試遊が必要。必須 native 画像の確認前にその最終判定をした扱いにはしない。

## 回帰と公開の境界

ローカル結果ファイルは legal plans 436 / illegal rejected 44 / room resources 436 が一致、deadhand 38 PASS、feedback classification 24 PASS。Python AST / workflow YAML parse / windows-playtest.js の node --check は成功した。

workflow は対象 release branch/path の候補ビルド、read-only contents 権限、固定 SHA の checkout/upload-artifact を使う。release 作成・既存配布物置換・ダウンロード導線更新は含まない。finalize は manifest の全ファイル再照合、EXE の基本形式とサイズ、native PASS を要件とし、runtime のみの ZIP を作る。プロフィールと native evidence は配布 ZIP に入れない。

非ブロッキングの証跡改善余地として、finalize 単体は native-layout-verification.json の確認/receipt への SHA 収録を行わない。標準 build.ps1 では直前に必須検査されるため、今回の workflow を通った同一 artifact について欠落したゲートはない。公開時は「成功した当該 run の SHA が一致する ZIP」を選ぶ必要がある。

## 次の確認

実 Windows run 成功後に、その source SHA、準備・回帰・native-layout 結果、EXE pin の正負証跡、手札/報酬/成長の実画像、配布 ZIP の manifest/内容/CRC/ハッシュを照合する。その結果をもって配布成果物の採否を判断する。人の初見理解、実スピーカーでの音、別 PC/別ネットワーク対戦はこのソースレビューでは確認していない。

## 追記: 実 Windows artifact 検収

上記の「Windows artifact 未確認」は以下の成果物について解消した。**artifact 検収のブロッカー 0 件、検査済み ZIP を配布候補として採用可**。本レビューは公開操作を行っていない。

- Actions run: https://github.com/osakenpiro/shuryo-techo/actions/runs/41816989143
- Job `126530119187` / `build-and-native-check`: GitHub 接続から completed/success、全 step 成功を独立に取得。取得した job log は checkout source `4e12c91bac2b770d4322d36d51253cb8b136bd36`、native 各系列成功、`Native visible-layout PASS: 17 hands, 7 reward/growth`、以下 ZIP hash の出力を示す。
- Artifact ID `13315795480`、outer artifact digest `eb340b00ef92ca2d5e28c9bb5305af67fcf5fffd9f1e42d56c0a3a7854687ef0` は job log の upload 記録。下記の配布 ZIP とは別の archive。
- 配布 ZIP: 164587348 bytes / SHA-256 `978f14fe78f9bff797804c2aa8a60f72134d988c55e2754b899b7b92e1cf42bd` を実ファイルから再計算し一致。
- manifest SHA-256 `ab8033de4e3ddfd12956dabceeaa80a71108d5c7a43ad7f5cbeba88b477fda12`。
- EXE: 30208 bytes / SHA-256 `b0b326b4739f6780a01913801deaa195c7af46157de6a9aa10eadf133ca36902`。MZ と正確な manifest SHA の UTF-16 埋込みも確認。

配布 ZIP の CRC、重複なし 227 entry、期待したファイル集合、展開済みファイルとの全 byte 一致を再確認。manifest の 223 file 全 bytes/SHA、sourceCommit、準備結果、receipt、release-candidate の相互一致、採用 override 全 5 SHA も一致した。配布 ZIP に playtest-evidence/Profile は入っていない。

r13 の全 manifest 収録ファイルとの byte 比較では、新規は CSS 2 件、変更は HTML 2 件・windows-playtest.js・README.md、削除は 0 件。他の既存 runtime/dependency/art/audio は byte 一致する。launcher は manifest pin 更新のため新しくコンパイルされた EXE である。

receipt の native result 3 件について、artifact 内 result.json の SHA と complete/PASS を独立に検証。必須改竄拒否/復元確認はレビュー済み build.ps1 の失敗時停止処理と、その同一 source で成功した Windows job、および receipt の記録により照合した。Linux 上で EXE 自体を再実行したものではない。

native-layout-check.py を当該 artifact の全 checkpoint へ独立に再実行し、手札 17 件・reward/growth 7 件 PASS。再生成結果と CI 保存結果は、列挙順を checkpoint file 名で正規化すると全 field/座標が一致した。native-preview-check.json は実 checkpoint に対する消耗予告照合 17 pair の結果を収録する。engine 436/44/436、deadhand 38、feedback 24 の artifact 記録も再確認した。

実画像の目視確認:

- `20261104-105225-0231/one-semi-round-1-three-picks.png`: 5 手札の絵・効果・耐久/消耗表示と選択バッジが footer より上で読める。3 枠の作戦と消耗予告、相手情報、主 CTA も読める。通知は右上にあり、手札やプレイヤー表示を覆っていない。
- `20261104-105318-0538/reward-choice.png`: 3 候補の絵、名前、効果、必要マス、選択 CTA が一画面に同時表示される。
- `20261104-105318-0538/growth-mid-2.png`: 命/魔力/可能性の 3 候補で、絵、名称、前後の数値、具体的な効果、選択 CTA が一画面に同時表示される。

以上で対象 P1 2 件の実装と実 Windows 表示の確認は済んだ。実際の楽しさ・スピーカー音・別 PC/別ネットワーク対戦については、引き続きこの技術検収の確認範囲外である。

## 追記: 公開 workflow 最終レビュー

未 commit の `.github/workflows/hero-tournament-r14-publish.yml` を確認。レビュー時 SHA-256 は `0baa78cf0b7882fd3b6bfb042c53b372f97cd20c809cff2b45f0862f0d2a2679`。**公開手順のブロッカー 0 件**。

- push 対象は r14 専用 branch と当該 workflow path のみ。並行公開を直列化し、checkout は固定 action SHA・persist-credentials=false。
- 対象 repository は `osakenpiro/shuryo-techo`。run `41816989143` の conclusion=success と head SHA=`4e12c91bac2b770d4322d36d51253cb8b136bd36` を取得し、不一致なら停止。
- 同 run の `hero-tournament-r14-candidate` を取得し、配布 ZIP の 164587348 bytes / SHA `978f14fe78f9bff797804c2aa8a60f72134d988c55e2754b899b7b92e1cf42bd` と metadata source SHA・CRC を検証してから公開する。検査済み ZIP の再ビルドはしない。
- release/tag `hero-tournament-r14`、target source=`4e12c91bac2b770d4322d36d51253cb8b136bd36`、`--prerelease --latest=false` を指定。upload する asset は検査済み ZIP 1 本。既存 release asset の上書き/削除処理はない。
- GitHub 接続で r14 tag ref と r14 release を GET し、レビュー時点で両方 404 を確認。対象 source に新規 tag を作る前提と整合する。
- release-notes.md は凍結 source から差分なし。build-r14 と元 build workflow も source commit から差分なし。ローカル変更はこの公開 workflow の新規追加のみ。
- YAML parse、実 run block の bash -n、埋込 Python 2 本の AST parse は成功した。

公開後の asset GET による bytes/SHA 再照合と、公開用導線更新の確認は実行担当へ返す。本レビュー自身は commit/push/release/LP 更新を行っていない。
