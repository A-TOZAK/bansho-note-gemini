# ノートの見本（Geminiで作る）

授業の計画をGeminiに渡すと、次の3枚ができます。

- 板書計画（A4よこ）
- 配るノート（B4よこ。B5ノートの見開き。題名・めあて・見出しだけが刷ってあります）
- ノートの記入例（配るノートに、子どもの答えを青で入れたもの）

ノートは5mm方眼（1行16マス）のほか、マス目の大きいノート（1行14・12・10・8マス）にも合わせられます。算数・理科・社会・総合の横書きと、国語の縦書きに使えます。

使うページは https://a-tozak.github.io/bansho-note-gemini/ です。

## 使い方

1. [skill/bansho-note.zip](skill/bansho-note.zip) をダウンロードし、Geminiのスキルとして取りこみます（はじめの1回だけ）。
2. Geminiの入力欄で「@bansho-note」を選び、本時の計画を貼って送ります。Geminiが紙の設計図（JSON）を1つ返します。
3. [組み立てページ](https://a-tozak.github.io/bansho-note-gemini/build/)に貼ります。3枚の紙ができ、点検もします。直すところが出たら、ボタンでコピーしてGeminiに貼りなおします。

スキルが使えないときは、[prompt.md](prompt.md) をコピーして貼り、`knowledge/` の4つのファイルを添付して送ります。

## ファイル

| ファイル | 中身 |
|---|---|
| `skill/bansho-note/` | Geminiのスキルです（SKILL.md と、約束・学年別漢字配当表・見本2つ） |
| `skill/bansho-note.zip` | 上のフォルダをまとめたものです |
| `skill/build.py` | `prompt.md` と `knowledge/` からスキルを組み立てなおします（`python3 skill/build.py`） |
| `prompt.md` | Geminiに貼るプロンプトです。スキルの本文のもとです |
| `knowledge/` | スキルが使えないときに添付するファイルです |
| `build/` | 組み立てページです。紙は [マス目プリントメーカー](https://a-tozak.github.io/School_Stock/tools/masume-print/) の描き方で作ります |
| `build/sample.json` | 見本です（4年理科「とじこめた空気と水」第2時） |

`prompt.md` か `knowledge/` を直したら、`python3 skill/build.py` を回してから公開します。

## 利用について

© School Stock（作成：外﨑顯博）。[School Stock の利用規約](https://a-tozak.github.io/School_Stock/about/terms.html)にしたがってお使いください。
