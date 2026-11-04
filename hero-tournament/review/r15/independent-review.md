# 勇者トーナメント r15 候補 / pipeline 独立レビュー

**判定: ソース採用・Windows候補ビルドへ進める。ブロッカー 0 件。** 途中で見つけた検査器のゼロ寸法受理は修正され、再検査で解消した。実 r15 Windows EXE・native画像・最終ZIP・公開手順の採否は次工程。本レビューはソース変更、push、公開、担当変更を行っていない。

- 最終確認 commit: `bef9b9e7f3d78e908b76dacc1612c6b7bd5e205e`。23 file、作業ツリー clean。
- ソース: `/workspace/work/hero-r15/hero-tournament/build-r15` と `.github/workflows/hero-tournament-r15.yml`。
- 正式ローカル stage: `/workspace/work/hero-r15-freeze/HeroTournament-Windows-r15`。旧 `hero-r15-local` はQA途中のため最終判定に使用していない。
- r14 baseline: 164587348 bytes、SHA-256 `978f14fe78f9bff797804c2aa8a60f72134d988c55e2754b899b7b92e1cf42bd`。

## 変更範囲と不変条件

runtime は UI6（既存 HTML2 + JS2、新 CSS/JS2）と QA3（既存 driver2、新 readout1）の計9 file。prepare の ALLOWED はこの集合のみ、ADDED は bag-occupancy.css / bag-occupancy.js / native-bag-proof.js の3件だけ。新規ファイルは baseline hash null + 既存path衝突なし、既存ファイルは baseline SHA、全候補は candidate SHA を検査する。

差分は厳密再構成して確認した。

- HTML2 は bag-occupancy.css の link 各1本の追加だけ。
- material-ui.js は helper import + footprintMarkup(c) の挿入各1箇所だけ。
- room-ui.js は helper import + ghost以外へのfootprintMarkup(cells) の挿入各1箇所だけ。
- windows-playtest.js は checkpoint2箇所、room-test-driver.js は checkpoint1箇所に captureBag() の読取結果を追加しただけ。これを除去すると baseline と完全一致する。操作・勝敗・state setter の追加はない。
- native-bag-proof.js は snapshot/C.shape/DOMRect/computed style/SVG属性の読取だけ。ゲームstateやDOMを変更しない。

共通 helper は C.shape が既に回転したセルを受け取り、同じ品内で隣接セルのない辺を生成する。回転を再適用せず、別品の共有境界は消さない。全体絵は従来のまま1個表示し、長方形への形の置換や画像ピクセルによる当たり判定は導入しない。

main は既存object内へ装飾SVGを挿入するが、overlapped root のscale(.84)は装飾SVGだけに同じbottom-right原点の逆scale(1/.84)を適用して相殺する。art/hit自体の既存挙動は変えない。room ghostへ通常収納輪郭を追加しない。SVGはpointer-events:none / aria-hidden / focusable=false。CSSはgridを弱めて外周を強め、選択時の輪郭、neighbor-preview、just-placed、just-merged、room preview/invalidの表示を維持する。

静的なcell-hit rarity/linked枠は通常輪郭へ置き換わる。rarity badge等、既存adjacency-links/neighbor-previewは残る。密集時の見え方と操作についてはrootがBrowserQA16比較と画像確認済みと報告している。本レビューはその実Browser操作を自分で実施した扱いにはしない。

## SHA と stage 照合

| file | Candidate SHA-256 |
| --- | --- |
| game/bag-occupancy.css | `f47d59188afed882a106fa6e506abfc86a813f6da3c3d7801f97f5d32c934c87` |
| game/bag-occupancy.js | `7917a19fc7c3146d20bb2fa0f0e2b293855b1b14fcc7f0ff0b1c9c5b6745bf1d` |
| game/index.html | `1ed471f6338375bf343a332711ff8a4c7afdccfc272461869dbee21dbea7c6ec` |
| game/material-ui.js | `bc05cdec39d750581f42b08fa8ff46e303eabfc656e0d58be94efa7109d3454b` |
| game/native-bag-proof.js | `0f4a8d71e9f8f7c6464e403b0831452f27c13469111406ac9885b1cd96ec319d` |
| game/room-test-driver.js | `872c607c6b6b92910a3096f37738492f1e604dacbe5c05af5ca07eb3ce37ff50` |
| game/room-ui.js | `f8253fa2b429c963d5bcaaa34dae924d6954686e09b5fee20a0af1a0139f3613` |
| game/room.html | `c7aece095f2e411c146028d578217321f9b1ac630947da6aece17166e096b501` |
| game/windows-playtest.js | `ee8f3b089874174fae4ae01f832c2732e54fa269b1eb9ab9801655962cefee98` |

上記全SHAをsource / overrides.json / fresh stageと照合し一致。r14既存ファイルのbaseline SHAも一致。fresh manifestは226 entry重複なし、全bytes/SHA一致、新規3件収録、EXE/manifest/receipt自己除外を確認した。manifest SHA `01042a54d2b8fbbd12d05ee4dc43c55204d1a032a77c08854a0893769d460336` がBuildStamp.csに含まれる。

ローカルstageのsourceCommitは `local-uncommitted` という準備時ラベルのまま。実CIは GITHUB_SHA から同じソースに対するmanifest/BuildStampを再生成するため、実Windows成果物ではCI commitの一致を改めて検査する。

baseline全manifest fileとのbyte比較では、9 override対象とREADME.md以外の既存ファイルは一致する。ルール・資源・保存コード・採用アート・音・依存runtime/SDK・Launcher.csは変更されていない。

## 独立した形状検査

C.DEFS全23種×4回転＝92形、704外周辺を実行して照合した。描画helperの「隣接セルの不存在」とは別に、各セル4辺を数え、重複する内部辺を除去する方式で期待値を作った。全辺集合一致、重複なし、入力セル不変、SVG2枚の出力を確認。L字3セル=8辺、T字4セル=10辺が全4回転で成立する。

Python AST / workflow YAML parse / 全候補JSのnode --checkも成功。ローカル回帰結果はr14基準で legal436 / illegal44 / room resources436、deadhand38、feedback24 PASS。native-layout/deadhand/feedback checkerはr14の同ソースとbyte一致し、engine-checkは基準ラベル/変更file一覧の更新だけ。

## 新 native bag gate: 発見・修正・負の検査

旧checker `fdcf06fa678d14109f628ecaa2a2e2c3e7c56413cd5514db57f53ada0a527547` は、main/room各2品を保持したままlayerと全SVG寸法を0にするとPASSすることを独立に再現した。期待座標も0になるためである。rootへ返却し、次の修正が入った。

- layerおよびcontour/fill rectの全座標がfinite、幅高さが正であることを必須化。
- proofが各SVGから祖先までdisplay/visibility/opacityを確認するpaintVisibleを記録し、checkerはtrueを必須化。欠落も拒否。

最終checker SHAは `6c79065f2fc548db7d7f40bfd56e7c9b44f0595d07496cb92c6856b5d4d6cdd7`。最終proof SHAは上表どおり。検査前後でSHAは不変だった。

修正版に対して正常fixture1件がPASSし、負16件がすべて拒否された。内訳はroom欠落、複数品不足、contour欠落、ID重複、外周辺誤り、fillセル誤り、viewBox誤り、座標誤り、pointerEvents=auto、layerゼロ寸法、SVGゼロ寸法、contour非表示、fill非表示、paintVisible欠落、NaN layer、Infinity SVG。負の検査時は出力JSONが作られないことも確認した。

proof自体もmock DOMで正常1件/非表示6件を実行し、SVG自身または祖先の非表示をpaintVisible=falseとして記録した。これは検査器の制御を確かめる合成確認で、実Windows表示の代用ではない。

実gateはcheckpointのライブengine C.shapeセル、全item ID集合、contour全露出辺、fill全セル、viewBox、論理board座標、可視性基本条件、入力透過を確認し、main/room両方と両方の複数品例を要求する。画像の実描画や初見理解まで自動的に証明するものではない。

## 配布前pipeline

prepareはr14 ZIPのsize/SHA/CRC・全baseline manifestを確認し、9件allowlist/新3件/全candidateSHAを強制する。新manifestをpinした元LauncherをWindowsでコンパイルし、verify-only成功、改竄runtimeのexit2、復元後成功、smoke、learning/room/solo各native通しを要求する。nativeのtimeout/null exit/非0/新evidence欠落/result非PASS/画像不足は停止する。

native-layout gateと新native-bag gateの両方がfinalize前に必須。さらにfinalizeは両verification.jsonのpass:trueを要求し、receipt.nativeDisplayEvidenceに各SHAを収録する。これはr14レビュー時の非blockingな証跡改善点も解消する。manifest全file/EXE形式/3 native resultを再確認し、配布ZIPにはruntime+sanitized receiptのみを収める。

workflowはr15専用branch/path、contents:read、固定SHAのcheckout/upload-artifact、persist-credentials=false。全native画像とbag/layout結果を別artifactに収録し、release作成/既存asset置換/LP更新は行わない。.gitignoreはpycache等の除外で、runtime変更ではない。

## 残る確認

Windows runのsource SHA、actual EXE pin/改竄拒否証跡、3系列complete/PASS、layout/bagの実checkpoint再検算、未選択の本編/roomカバン画像、最終ZIPのmanifest/CRC/bytes/SHAを照合する。技術的成立と作品らしさは今回のソース条件に適合。実Windows表示・人の初見理解/遊び心地・公開物の採否はそれぞれ証拠が揃ってから判定する。

## 追記: smoke失敗後の限定した診断ログ保存

実Windows run `41836634581` はsmoke-test exit4で停止し、native通し開始前に失敗したと実行担当から返却された。compile / engine436-44-436 / deadhand38 / feedback24 / verify-only / 改竄拒否・復元はPASS。既存保存対象にLauncherログがなかったため、現時点で原因は未確定。UI/QAの不具合、server identity、WebView起動等のいずれかに推測で決めていない。

この失敗を残したまま行う診断追加を独立レビューした。**ブロッカー0件、診断を得るための再実行1回へ進める。** レビュー対象workflow SHA-256 は `fbe73dda8b71569f584c010e31be50c7592d7f8afcb3b2e2f8141c3982345e1f`。

変更は `.github/workflows/hero-tournament-r15.yml` の always診断step1個とartifact保存path1行だけ。

- 読む範囲は `$LOCALAPPDATA/HeroTournament/Windows/ht-windows-20261104-r15` 直下の `*.log` に限定。非recursiveで、他build・EmbeddedProfile・他アプリ・親ディレクトリは対象に含まない。
- 元ログは読取のみ。コピー/出力先は `$RUNNER_TEMP/hero-r15/launch-diagnostics` で、配布ZIPに追加する処理はない。
- 環境変数やcredentialを列挙せず、LOCALAPPDATAとRUNNER_TEMPの既知pathだけを参照。GH権限はcontents:readのまま、checkout/upload actionのpinも不変。
- Launcher/desktop-hostの既存ログ経路も確認。nonceを含むREADY原文はCheckReadyへ送られ、通常Logへ流さない。既知ログは起動pid/build、READYのpid/port/build、WebView runtime、エラー、所有プロセス停止、native checkpoint等。secret読取を追加するコードはない。
- parsed YAML比較で元build step、timeout35分、検査gate、artifact actionは不変。alwaysで失敗後も診断を確保する追加であり、失敗を成功へ変換する処理はない。

最初のfailure artifactを保持し、今回の診断追加を新source commitとして1回実行する。同じ失敗なら得られたログで原因を解析してから次の判断を行う。単なる反復再試行は推奨しない。本追記は原因特定や実r15 native検収の成功を意味しない。

## 追記: 成功した実 Windows artifact の独立検収

**実artifactのブロッカー0件、検収済みZIPを配布候補として採用可。** この節により、前節の「実Windows artifact未確認」は以下の1成果物について解消した。

- 成功run: https://github.com/osakenpiro/shuryo-techo/actions/runs/41837396724
- Source: `256d518a9d4266e3af108eda2a898a501531d26b`。
- Job `126599749018` / build-and-native-check: GitHub接続からcompleted/success、全step成功を独立取得。公式ログでsource checkout、verify-only/restoration、smoke、learning、room、solo成功、layout16/9、bag37、および配布ZIPメタデータを照合した。
- Artifact `13326831999`: 263476618 bytes、公式outer digest `caa912aeb35268d16a28979a052ac0c35fab2ba4aadd4dff4ad0f6aa8e8a2e97`。これはevidenceを含むouter artifactであり、配布ZIPと別物。
- 配布ZIP: **164590305 bytes / SHA-256 `66a9dfaebd05d42fb6c52bffbc552936e20a47049f3709c3a409805bffda8e20`**。実ファイルから再計算した。
- Manifest SHA-256 `29c3e9ad599233c890753f59d9751a4e1c5a1699e3866f626b04c1bb9ad3e000`。
- EXE: 30208 bytes / SHA-256 `5b89a04a760475e5b48da648ff549ea61aa7165d95e8d41f192bb6d78f161db8`。MZと、上記manifest SHAの正確なUTF-16埋込みを確認した。

検収入力は `/workspace/work/hero-r15-native/`。配布ZIPのCRC、重複なし230 entry、期待file集合、manifest全226fileのbytes/SHA、新規3file、EXE/manifest/receiptの自己除外を再検証した。sourceCommitはmanifest/preparation/receipt/release-candidateで成功sourceに一致する。配布内receiptとartifact側receiptも一致。sourceの9override SHAとZIP内fileがすべて一致し、r14の既存fileは対象6fileとREADME.md以外すべてbyte一致する。配布ZIPにplaytest-evidence/Profile/launch-diagnosticsは入っていない。

receiptのnative結果3件について、artifact内result.jsonのSHAとcomplete/PASSを確認した。nativeDisplayEvidenceの2件はlayout/bag両verification.jsonのSHAとpass:trueに一致する。

### 実checkpointの再計算と画像

最終sourceのcheckerをactual artifactへ独立に再実行した。

- layout: 手札16 checkpoint / reward・growth9 checkpoint PASS。CI保存結果と、file順を正規化した全数値・fieldが一致。
- bag: 37 checkpoint（main7 / room30）PASS。CI保存結果と、Windows/Linuxのpath separatorとfile順を正規化すると一致。単なる記録読取でなく、全actual engine-shape/SVG/rect/input条件を再検査した。
- engine 436/44/436、deadhand38、feedback24のartifact結果も再確認した。

実画像を目視確認した。

- `20261104-132322-9843/bag-after-rearrange.png`: 盤面全体が見える位置で6品を表示。全体絵、未選択品の外周、空きマス、凹形の欠け、隣接リンク、Lv表示、主CTAを確認した。対応snapshotのselected=null。線を表示するための選択を要求していない。
- 同 `bag-before-rearrange.png`: selected=nullの6品でも輪郭が常時表示され、スクロール前の上側でも境界が見える。
- `20261104-132248-7601/one-packed-semi.png`: roomの複数小刀・修理道具・回復品・大剣等が隣接した状態で、未選択品同士の外周と空きが分かれる。選択中の品の強調、全体絵、主CTAも残る。
- `20261104-132228-0530/one-semi-round-1-three-picks.png`: 5手札の効果/魔力/耐久、選択badge、作戦3枠、主CTAが読める。r14のlayout CSS2と関連既存表示コードのbyte不変、およびactual layout gateの16/9 PASSと合わせ、r14の手札・報酬・成長の表示条件が維持されたことを確認した。

画像による境界/表示の検収と、人の初見理解や遊び心地の判定は区別する。今回、人間の新しい初見試遊や別PC/別回線対戦を完了したという証拠は追加していない。

### 最初の失敗の扱い

run `41836634581` のsmoke exit4は引き続き原因未特定として保持する。成功sourceとの差分は診断保存workflowだけで、ゲーム/UI/QA payloadおよびLauncher sourceはbyte不変。manifest/sourceラベルとEXE pinはCI sourceに応じて再生成される。成功したことだけで最初の起動失敗の原因を修正・特定したとは扱わない。成功runのbuild専用launch logs4件がartifactへ保存されたことも確認した。

## 追記: r15公開workflow 最終レビュー

**公開手順のブロッカー0件。** 未commitの `.github/workflows/hero-tournament-r15-publish.yml` を読取り確認した。レビューbyte SHA-256は `d29d4aae3f7f521012052e0e8ae2ddf709dc81343f162e62eec356f036d2ce74`。

- 専用branch/path、直列化、contents:write/actions:read、固定checkout action、persist-credentials:false。
- 成功run `41837396724` のconclusion=success / headSHA=`256d518a9d4266e3af108eda2a898a501531d26b`を確認してから同runのcandidateを取得。
- 配布ZIPの164590305 bytes / SHA `66a9dfaebd05d42fb6c52bffbc552936e20a47049f3709c3a409805bffda8e20`、metadata source、CRCを強制。検査済みZIPの再ビルドはしない。
- tag/release `hero-tournament-r15`、target source=`256d518a9d4266e3af108eda2a898a501531d26b`、`--prerelease --latest=false`。uploadは検収済みZIP1本、既存assetの上書き・削除処理はない。
- GitHub公式GETで、レビュー時点のr15 tag refとreleaseはいずれも404。新規targetの前提と一致。
- YAML/bash -n/埋込Python2本AST検査はPASS。build-r15/元buildworkflow/release notesは成功sourceから差分なし。

以上により、当該workflowだけをcommit/pushし、公開後のasset GETで同一bytes/SHAを再照合する工程へ進める。本レビュー自身はcommit/push/release/LP更新を行っていない。
