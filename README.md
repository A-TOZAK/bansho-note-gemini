# Geminiで板書計画とノート

授業の計画をGeminiに渡すと、次の3枚ができます。

- 板書計画（A4よこ）
- 配るノート（B4よこ。B5ノートの見開き。5mm方眼で、題名・めあて・見出しだけが刷ってあります）
- ノートの記入例（配るノートに、子どもの答えを青で入れたもの）

使うページは https://a-tozak.github.io/bansho-note-gemini/ です。

## 使い方

1. [prompt.md](prompt.md) をコピーし、いちばん下の「授業の計画」の欄を書きかえます。
2. Geminiに貼ります。Geminiが紙の設計図（JSON）を1つ返します。
3. [組み立てページ](https://a-tozak.github.io/bansho-note-gemini/build/)に貼ります。3枚の紙ができ、点検もします。直すところが出たら、ボタンでコピーしてGeminiに貼りなおします。

横書きの教科（算数・理科・社会・総合）に使えます。国語の縦書きには、まだ使えません。

## ファイル

| ファイル | 中身 |
|---|---|
| `prompt.md` | Geminiに貼るプロンプトです |
| `build/` | 組み立てページです。紙は [マス目プリントメーカー](https://a-tozak.github.io/School_Stock/tools/masume-print/) の描き方で作ります |
| `build/sample.json` | 見本です（4年理科「とじこめた空気と水」第2時） |

## 利用について

© School Stock（作成：外﨑顯博）。[School Stock の利用規約](https://a-tozak.github.io/School_Stock/about/terms.html)にしたがってお使いください。
