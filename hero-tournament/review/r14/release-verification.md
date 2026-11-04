# 勇者トーナメント r14 採用・公開記録

2026年11月4日。外部独立レビューを開発側で受領し、優先課題と事前の修正候補を照合した。報酬・成長の比較情報と、案内を残した戦闘手札の同時表示をr14へ採用した。外部レビュアーが候補そのものを評価・承認したという扱いにはしていない。

- [独立SESのRETURN](https://github.com/osakenpiro/claude-shared/issues/513#issuecomment-6627838108)
- [開発側の受領・採用ACK](https://github.com/osakenpiro/claude-shared/issues/513#issuecomment-6628678780)
- [Windows r14を入手](https://osakenpiro.github.io/shuryo-techo/hero-tournament/#first)
- [r14実Windows画面3枚](https://osakenpiro.github.io/shuryo-techo/hero-tournament/review/r14/)
- [同一状態のLinux Chromium前後比較](https://osakenpiro.github.io/shuryo-techo/hero-tournament/review/layout-candidate/)
- [固定したr13全体レビュー15画面](https://osakenpiro.github.io/shuryo-techo/hero-tournament/review/r13/)
- [統合PR #9](https://github.com/osakenpiro/shuryo-techo/pull/9)

## 変更と検証

UIはHTML2ファイルへのCSS追加とCSS2ファイル。採用候補の4ファイルとbyte一致する。QAドライバー1ファイルは2箇所の読取専用geometry selectorを増やしただけ。既存ルール・資源・保存形式・採用アート・カバン全体絵と回転・効果音のソースはr13と同じ。

Windowsのチュートリアルとひとりでお試し、2WebViewの部屋対戦、冒険の通し試遊がcomplete/PASS。実checkpointの表示検査は手札17件・報酬/成長7件PASS。5手札がフッターより上に収まり、報酬/成長は3候補それぞれの名前・効果/増加量・マス/補足・選択ボタンがworkspace内にあることを検査した。代表3画像も目視した。旧r13の実見切れを検査器が拒否する負の確認も実施。

資源の予告と実処理17組一致。engine合法436・不合法拒否44・部屋資源436、deadhand38、feedback24がPASS。ソース、実artifact、公開workflowを別エージェントも確認し、公開を止める指摘は0件。

- [実Windows成功run](https://github.com/osakenpiro/shuryo-techo/actions/runs/41816989143)
- ビルドソース: `4e12c91bac2b770d4322d36d51253cb8b136bd36`
- [同じZIPだけを公開したrun](https://github.com/osakenpiro/shuryo-techo/actions/runs/41818325999)
- [r14テスト版リリース](https://github.com/osakenpiro/shuryo-techo/releases/tag/hero-tournament-r14)
- ZIP: `hero-tournament-windows-r14.zip` / 164587348 bytes
- SHA-256: `978f14fe78f9bff797804c2aa8a60f72134d988c55e2754b899b7b92e1cf42bd`
- manifest SHA-256: `ab8033de4e3ddfd12956dabceeaa80a71108d5c7a43ad7f5cbeba88b477fda12`
- EXE SHA-256: `b0b326b4739f6780a01913801deaa195c7af46157de6a9aa10eadf133ca36902`

公開URLからZIPを再取得してサイズ・SHA-256・CRCを照合し、LPの3つのダウンロードリンクとrelease.jsonを同じ版へ更新した。r13のZIP・15枚の原画像・外部初見原文は保持している。

## 残す課題と判断

1. P1: 未選択・複数品のカバン占有境界。選択時の範囲表示・回転・詰め直しは既存機能として確認済み。全体絵を保持して未選択時の読みやすさを検討する。共有箱の初期比較も今回の戦闘用CSSの対象外。
2. P2: 大きな「体力−X」は実HP減少ではなく、防御/軽減後・HP下限で切り詰める前の算出ダメージを使っている。実r13記録のHP0.2→0に対する27.8、1手目KO後の2手目0→0に対する算出値の保持を照合した。計算バグと判定せず、各手・浮き数字・合計の意味を合わせる表示課題として残す。整数化や2手目の取消はしない。旧保存のHP前後がない場合も扱う必要がある。
3. P2: 探索の予感は選択route、遠視、進む先が一致する。3道それぞれで対象のみ既知になること、MP2と再遠視無料をコード/DOM投影で確認した。対象道名と「70%」の意味が画面から伝わるかは別の表示課題として残す。確率分布・MPコストの変更は根拠がない。
4. P2: 入口の位置づけ、案内なしでの修理発見、戦闘以外の通知、結果から次の行動、村と旅の記録の一覧性。修理・強化自体や、スクロールで情報を読めることを未実装扱いにしない。
5. P3: 結末の旅を一行で振り返る案は任意。紙芝居の余韻を残す。

今回の技術検収は人間の初見理解や面白さ、実スピーカーでの聴感、別PC・別回線の対戦の完了を意味しない。試遊タスクは未完了のまま保持する。
