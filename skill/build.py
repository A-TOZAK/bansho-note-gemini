"""Geminiのスキル「bansho-note」を、prompt.md と knowledge/ から組み立てる。

  python3 skill/build.py

prompt.md の「授業の計画（ここから下…）」より上を SKILL.md の本文にし、knowledge/ の4つのファイルを添える。
最後に bansho-note.zip を作りなおす（ページのダウンロードはこの zip と、フォルダの中の5つのファイル）。
"""
import pathlib
import shutil
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "skill" / "bansho-note"

FRONT = """---
name: bansho-note
description: 小学校の授業の板書計画とノート（配るノートと記入例）の設計図をJSONで作る。先生が1時間分の授業の計画を貼り「板書計画とノートを作って」と頼んだときに使う。横書きの教科（算数・理科・社会・総合）と国語の縦書きに対応し、マス目の大きいノート（1行12マスなど）にも合わせる。できたJSONは組み立てページ https://a-tozak.github.io/bansho-note-gemini/build/ に貼って3枚の紙にする。
---

"""

TAIL = """
## このスキルのファイル

JSONを作る前に、次のファイルを読みます。

| ファイル | 中身 |
|---|---|
| `yakusoku.md` | 板書とノートの約束。行の数え方、マスの数ごとの行の数、縦書きの数え方、試して分かったまちがいの例 |
| `kanji.md` | 学年別漢字配当表（1026字）。その学年までの字だけを使う |
| `mihon-sansu4-hissan.md` | 点検を通った横書きの見本（4年算数、筆算のある時間） |
| `mihon-kokugo4-gon.md` | 点検を通った縦書きの見本（4年国語） |

## 先生が貼るもの

先生は、1時間分の授業の計画だけを貼ります。次の項目が書いてあれば使い、なければ計画から読み取ります。聞き返さずに、JSONを返します。

- 学年と教科、単元と時（全何時間）、日付と教科書のページ（なければ空ける）
- 前の時間の結果（記入例で使う数値）
- ノートのマス（1行のマスの数。書いていなければ16。国語は縦書きなので書かない）
- 授業の計画（めあて・学習の流れ・まとめ・予想される反応など）

組み立てページの点検で見つかったことを貼られたら、それを直してJSONを全部出しなおします。
"""

# knowledge/ のファイル名 → スキルの中のファイル名
FILES = [("yakusoku.md", "yakusoku.md"), ("kanji.md", "kanji.md"),
         ("mihon_sansu4_hissan.md", "mihon-sansu4-hissan.md"), ("mihon_kokugo4_gon.md", "mihon-kokugo4-gon.md")]


def main():
    t = (ROOT / "prompt.md").read_text()
    body = t[:t.index("## 授業の計画（ここから下")]
    body = body.replace("# 板書計画とノートを作るプロンプト\n", "# 板書計画とノート\n", 1)
    old = next(l for l in body.splitlines() if l.startswith("- 「板書とノートの約束」"))
    body = body.replace(old, "- このスキルのフォルダにある4つのファイルを、JSONを作る前に読みます（下の「このスキルのファイル」）。"
                             "とくに、JSONを出す前に、左右のページごとに使う行の数を足し算します。")
    body = body.replace("知識のファイル「見本の設計図_4年国語_ごんぎつね」", "このスキルのファイル `mihon-kokugo4-gon.md`")
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "SKILL.md").write_text(FRONT + body.rstrip() + "\n" + TAIL)
    for a, b in FILES:
        shutil.copy(ROOT / "knowledge" / a, OUT / b)
    with zipfile.ZipFile(ROOT / "skill" / "bansho-note.zip", "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(OUT.iterdir()):
            z.write(f, "bansho-note/" + f.name)
    print("SKILL.md と", len(FILES), "つのファイル、bansho-note.zip を作りました")


if __name__ == "__main__":
    main()
