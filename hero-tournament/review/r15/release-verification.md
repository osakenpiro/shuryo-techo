# 勇者トーナメント r15 カバン外周の改善

2026年11月4日。独立レビューのP1「未選択・複数品の占有識別」を採用。道具の全体絵と向きはそのまま、実際に使うマスの外周を常時示す。L字の空きや、そこに入った別品も区別できる。本編とひとり/部屋対戦に同じ描画を適用した。

- [修正前後と実Windows画面](https://osakenpiro.github.io/shuryo-techo/hero-tournament/review/r15/)
- [ダウンロード・遊び方](https://osakenpiro.github.io/shuryo-techo/hero-tournament/#first)
- [統合PR #10](https://github.com/osakenpiro/shuryo-techo/pull/10)
- [開発Task #513](https://github.com/osakenpiro/claude-shared/issues/513)

## 保持した仕様

形と配置判定は既存のC.shape。全体絵、回転、選択、クリック/ドラッグ、L字の空きへの別品配置、妖精マスの重ね置き、合成、隣接効果を維持。新SVGは入力透過で、既存の入力先を変えない。ルール・資源・保存・音・採用アート・launcherソースはr14とbyte同一。UIは6ファイル、QAは読取専用3ファイルの差分だけ。r14の手札/報酬/成長の表示も保持した。

## 検証

- 全23定義×4回転=92形状、704露出辺を独立の辺打消し計算と照合。入力shape不変。
- Linux Chromiumでr14/r15×本編/room×通常/妖精マス×2画面サイズの16比較。検査用同一配置と通常のランダム支給によるCPU大会は区別して記録。選択、全方向回転、L字の空き、別品、再配置、不正予告、状態不変を確認。妖精マスの輪郭座標差は0.013px以下。
- 実Windowsで起動、チュートリアル/ひとりでお試し、2WebViewの部屋対戦、冒険が成功。カバン37checkpoint（本編7・room30）で形・露出辺・面・実座標・表示・入力透過を照合。既存表示検査も手札16件・報酬/成長9件PASS、資源予告と実処理16組一致。
- engine合法436/不合法拒否44/room資源436、deadhand38、feedback24 PASS。
- 検査器で見つかったゼロ寸法の見逃しを修正し、負16件を拒否。実装と検査器、実Windows成果物、公開workflowは別エージェントも検収。

[Browser記録](browser-verification.json) · [独立レビュー](independent-review.md) · [実カバン検査](native-bag-verification.json) · [既存表示検査](native-layout-verification.json)

## 成果物の固定

- [Windows成功run 41837396724](https://github.com/osakenpiro/shuryo-techo/actions/runs/41837396724)
- ソース: `256d518a9d4266e3af108eda2a898a501531d26b`
- ZIP: `hero-tournament-windows-r15.zip` / 164590305 bytes
- SHA-256: `66a9dfaebd05d42fb6c52bffbc552936e20a47049f3709c3a409805bffda8e20`
- manifest SHA-256: `29c3e9ad599233c890753f59d9751a4e1c5a1699e3866f626b04c1bb9ad3e000`
- EXE SHA-256: `5b89a04a760475e5b48da648ff549ea61aa7165d95e8d41f192bb6d78f161db8`

ZIP全CRC・manifest226ファイル・EXEへのmanifest pin・3native結果と2表示結果のreceipt SHAを照合。公開は成功した同一ZIPだけを新r15タグへ出す。旧版ZIPとr13の固定15原画像・独立初見原文は保持する。

## 初回失敗と残る確認

[初回run 41836634581](https://github.com/osakenpiro/shuryo-techo/actions/runs/41836634581)は起動のsmoke-testがexit4で停止し、通し試遊へ未到達。起動の詳細ログが保存対象外だったため、原因は未特定。対象buildのログ保存だけを追加し、runtime/UI/launcherと検査条件は同じまま再実行した。成功runでは起動と通し試遊が通り、全起動のログも保持している。初回失敗を削除したり、製品コードで原因を修正したとは扱わない。

今回の修正はカバンの外周。共有箱の初期比較、算出ダメージと実HP減少の表記、探索の予感の対象・割合の意味、場面別の案内と一覧性は次順。人間の初見理解・面白さ・聴感、別PC/別回線対戦は引き続き未確認。

## 公開後の照合

[公開run 41838622463](https://github.com/osakenpiro/shuryo-techo/actions/runs/41838622463)が成功し、新r15テスト版として公開。公開URLからZIPを再取得し、164590305 bytes・SHA256 `66a9dfaebd05d42fb6c52bffbc552936e20a47049f3709c3a409805bffda8e20`・CRCが一致した。公開Release本文にも初回起動検査の失敗と再実行の範囲を明記した。

LPの3ダウンロード先と版・release.jsonをr15に更新。比較ページには検査用Linux画像4枚と実Windows画像2枚を区別して収録し、1280/390/320pxで切替・画像6枚・横はみ出しを検査した。
