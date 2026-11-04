# r13からのレイアウト修正候補

外部の独立SESがレビューする基準版は公開r13のまま固定します。この候補は、既知の手札の見切れと報酬・成長の比較しづらさを、先に修正して比較するためのものです。Windows配布ZIP・LPダウンロード先・r13レビュー画像は変更しません。

変更はHTMLへのCSS読込2箇所と新規CSS2ファイルだけです。紙のアート、カードの情報、選択肢、計算、保存形式、効果音のコードを変更しません。対戦の上部案内・余白、報酬と成長の比較領域を調整します。いずれも900px以上のデスクトップ幅へ限定しています。

## 再現

公開r13 ZIP（SHA256 `2d6c41c5535e18077e845cf197014cd4c68b3bf4247073ec7a1ad9253e4b45cb`）を用意し、新しい出力ディレクトリを指定します。

```sh
python prepare-preview.py /path/to/hero-tournament-windows-r13.zip /path/to/new-preview
node /path/to/new-preview/desktop-host.mjs 18807 layout-preview local-preview
```

検査環境はNode.js 24.19.0です。`http://127.0.0.1:18807/desktop.html` を開きます。出力はHTTP表示確認用で、EXEとWindowsランタイムは含めません。通常Windowsビルドへの統合・native確認は別工程です。

## 判定

1028×719と1280×870で、同一状態のCSS適用前後を比較します。手札5枚の情報が固定フッターより上に収まり、報酬と成長の全3候補の名称・効果・数値・選択操作が初期領域で読めることを確認します。CSS切替でゲーム状態と選択中の作戦が変わらず、元の選択・封印・解決が動くことも検査します。

初期の比較はLinux Chromiumです。Windows native、独立SESの所見との照合、人間の理解と遊び心地の採否は、この候補の局所検査だけで完了とは扱いません。

## 比較テスト

PythonのPlaywrightとChromiumを用意し、HTTPプレビューのディレクトリと比較画像の出力先を渡します。

```sh
python check-layout.py /path/to/new-preview /path/to/comparison-output
```

対戦のチュートリアルは通常ボタン操作で手札を選んで確認します。報酬と成長は、r13のWindows checkpointから保存状態だけを取り出したfixtureを、独立したブラウザ保存へ復元して比較します。後者は通しプレイとは区別しています。
