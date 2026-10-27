/* 板書とノートのキット（unit-kit）のブラウザ版。kit.py と同じ紙面を、Python なしで作る。
 * Gemini が書いた「1時間分の紙面ファイル（.json）」を読んで、配るノート・記入例・板書の3つにする。
 * 2026-10-27 作成。© School Stock
 *
 * kit.py とのちがい（Gemini が行の番号を数えまちがえないように足したもの）
 *   ・put / table / box の line を省くと、そのページで最後に使った行の次の行から置く（gap で空ける行の数）
 *   ・字は "見出し:①予想" "答え:…" のように、頭に種類を書く（kit.py の H() A() のかわり）
 */
(function (root) {
  "use strict";
  var INK = "#1b1b1b", RED = "#d12a1e", BLUE = "#2b5bb8", GRAY = "#8a8f96";
  var CELL = 10, TOP = 22, PAGE_X = { R: 193, L: 11 };
  var COLORS = { red: RED, blue: BLUE, gray: GRAY, black: INK, "赤": RED, "青": BLUE, "灰": GRAY, "黒": INK };

  function color(c, d) { return !c ? d : COLORS[c] || (/^#[0-9a-f]{6}$/i.test(c) ? c : d); }
  function T(s, kind, col, bold) { return { s: String(s), kind: kind || "K", color: col || INK, bold: !!bold }; }

  // 字の種類。"見出し:①予想" のように頭に書く。何も書かなければ「刷る」
  var KINDS = { "見出し": ["K", INK, true], "刷る": ["K", INK, false], "赤": ["K", RED, true], "青": ["K", BLUE, true], "答え": ["A", BLUE, false] };
  function piece(x, dflt) {
    if (x && typeof x === "object") return x;
    var s = String(x == null ? "" : x), m = s.match(/^(見出し|刷る|赤|青|答え)[:：]/);
    if (!m) return dflt ? dflt(s) : T(s);
    var k = KINDS[m[1]];
    return T(s.slice(m[0].length), k[0], k[1], k[2]);
  }
  function pieces(x) { return (Array.isArray(x) ? x : [x]).map(function (p) { return piece(p); }); }

  /** 字を「1マスに入るまとまり」に分ける（kit.py の units と同じ数え方）。 */
  function units(str, vertical) {
    var s = Array.from(str), out = [], i = 0, re = /[0-9a-z.,]/;
    while (i < s.length) {
      if (re.test(s[i])) {
        var j = i;
        while (j < s.length && re.test(s[j])) j++;
        var run = s.slice(i, j).join("");
        if (!vertical) for (var k = 0; k < run.length; k += 2) out.push(run.slice(k, k + 2));
        else if (run.length === 2 && /^\d+$/.test(run)) out.push(run);
        else out.push.apply(out, run.split(""));
        i = j;
      } else { out.push(s[i]); i++; }
    }
    return out;
  }
  function width(s, v) { return units(s, v).length; }

  var GRADE = {};   // 漢字 → 学年
  function setKanji(grades) {
    GRADE = {};
    Object.keys(grades).forEach(function (g) {
      var v = grades[g];
      (Array.isArray(v) ? v.join("") : v).split("").forEach(function (ch) { if (!GRADE[ch] || GRADE[ch] > +g) GRADE[ch] = +g; });
    });
  }

  // ---------- 見開き ----------
  function Spread(vertical, grade, names) {
    this.v = vertical;
    this.nlines = vertical ? 16 : 23;
    this.ncell = vertical ? 23 : 16;
    this.grid = {};
    for (var p of ["R", "L"]) this.grid[p] = Array.from({ length: this.nlines }, function () { return new Array(this.ncell).fill(null); }, this);
    this.marks = []; this.extra = []; this.errs = [];
    this.grade = grade; this.names = new Set(Array.from(names || ""));
    this.next = { R: 1, L: 1 };   // line を省いたときに置く行
    this.where = "";              // 点検の知らせに付ける「何番めの指示か」
  }
  var S = Spread.prototype;
  S.err = function (m) { this.errs.push((this.where ? this.where + "：" : "") + m); };
  S.used = function (page, line) { if (line + 1 > this.next[page]) this.next[page] = line + 1; };
  S.xy = function (page, line, pos) {
    return this.v ? [PAGE_X[page] + (16 - line) * CELL, TOP + (pos - 1) * CELL] : [PAGE_X[page] + (pos - 1) * CELL, TOP + (line - 1) * CELL];
  };
  S.rect = function (page, l1, l2, p1, p2) {
    var xs = [], ys = [];
    for (var l of [l1, l2]) for (var p of [p1, p2]) { var q = this.xy(page, l, p); xs.push(q[0], q[0] + CELL); ys.push(q[1], q[1] + CELL); }
    return [Math.min.apply(0, xs), Math.min.apply(0, ys), Math.max.apply(0, xs), Math.max.apply(0, ys)];
  };
  S.put = function (page, line, pos, texts) {
    var start = pos;
    for (var t of texts) {
      for (var u of units(t.s, this.v)) {
        if (pos > this.ncell) {
          line += 1; pos = start;
          if ("、。，．」』）〕！？ー".indexOf(u[0]) >= 0) this.err(page + line + "行の頭に「" + u + "」が来た（" + t.s + "）。文を短くするか、折る所を変える");
        }
        if (line > this.nlines) { this.err(page + "ページからあふれた：" + t.s); return [line, pos]; }
        var cur = this.grid[page][line - 1][pos - 1];
        if (cur && cur[0] !== "　" && u !== "　") this.err(page + line + "行" + pos + "マスに重ねて書いた：「" + cur[0] + "」の上に「" + u + "」（" + t.s + "）");
        this.grid[page][line - 1][pos - 1] = [u, t];
        this.checkKanji(u, t);
        pos += 1;
      }
    }
    this.used(page, line);
    return [line, pos];
  };
  S.checkKanji = function (u, t) {
    for (var ch of Array.from(u)) {
      if (!(ch >= "一" && ch <= "鿿") || this.names.has(ch)) continue;
      var g = GRADE[ch] || 9;
      if (g > this.grade) this.err(g + "年の漢字「" + ch + "」（" + t.s + "）");
    }
  };
  S.line = function (x1, y1, x2, y2, col, w, only, dash) {
    this.marks.push([{ type: "line", x1: x1, y1: y1, x2: x2, y2: y2, color: col || INK, width: w || 0.6, dash: dash || "solid" }, only || null]);
  };
  S.box = function (page, l1, l2, p1, p2, col, w, only) {
    var r = this.rect(page, l1, l2, p1, p2), self = this;
    [[r[0], r[1], r[2], r[1]], [r[0], r[3], r[2], r[3]], [r[0], r[1], r[0], r[3]], [r[2], r[1], r[2], r[3]]].forEach(function (a) {
      self.line(a[0], a[1], a[2], a[3], col, w, only);
    });
    this.used(page, Math.max(l1, l2));
  };
  S.circle = function (page, line, p1, p2, col) {
    var r = this.rect(page, line, line, p1, p2);
    this.marks.push([{ type: "rect", x: r[0] + 0.8, y: r[1] + 0.6, w: r[2] - r[0] - 1.6, h: r[3] - r[1] - 1.2, shape: "ellipse",
      color: col || BLUE, width: 0.6, dash: "solid", fill: "none" }, "A"]);
  };
  S.table = function (page, line, pos, widths, rows, heights, head, col) {
    heights = heights || rows.map(function () { return 1; });
    head = head !== false;
    var l = line, self = this;
    rows.forEach(function (r, j) {
      var h = heights[j] || 1, p = pos;
      r.forEach(function (cell, k) {
        var wk = widths[k];
        if (cell !== "" && cell != null && !(Array.isArray(cell) && !cell.length)) {
          var cs = (Array.isArray(cell) ? cell : [cell]).map(function (c) {
            return piece(c, head && j === 0 ? function (s) { return T(s, "K", INK, true); } : null);
          });
          var n = cs.reduce(function (a, c) { return a + width(c.s, self.v); }, 0);
          if (wk == null) self.err("表の" + (j + 1) + "段めのらんが、widths の数より多い");
          else if (n > wk * h) self.err("表のらん「" + cs.map(function (c) { return c.s; }).join("") + "」が " + wk + "マス×" + h + "行 をこえる");
          var ll = l, pp = p;
          cs.forEach(function (c) {
            units(c.s, self.v).forEach(function (u) {
              if (pp >= p + wk) { ll += 1; pp = p; }
              self.put(page, ll, pp, [T(u, c.kind, c.color, c.bold)]);
              pp += 1;
            });
          });
        }
        p += wk || 0;
      });
      l += h;
    });
    var last = l - 1, total = widths.reduce(function (a, b) { return a + b; }, 0);
    this.box(page, line, last, pos, pos + total - 1, col);
    l = line;
    heights.slice(0, -1).forEach(function (h) {
      l += h;
      var q = self.rect(page, l, l, pos, pos + total - 1);
      if (self.v) self.line(q[2], q[1], q[2], q[3], col); else self.line(q[0], q[1], q[2], q[1], col);
    });
    var p = pos;
    widths.slice(0, -1).forEach(function (wd) {
      p += wd;
      var q = self.rect(page, line, last, p, p);
      if (self.v) self.line(q[0], q[1], q[2], q[1], col); else self.line(q[0], q[1], q[0], q[3], col);
    });
    this.used(page, last);
  };
  S.poly = function (page, pts, col, w, only) {
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = pts[(i + 1) % pts.length];
      this.line(PAGE_X[page] + (a[0] - 1) * CELL, TOP + (a[1] - 1) * CELL, PAGE_X[page] + (b[0] - 1) * CELL, TOP + (b[1] - 1) * CELL, col || INK, w || 0.9, only);
    }
  };
  S.seg = function (page, a, b, c, d, col, w, dash) {
    this.line(PAGE_X[page] + (a - 1) * CELL, TOP + (b - 1) * CELL, PAGE_X[page] + (c - 1) * CELL, TOP + (d - 1) * CELL, col || BLUE, w || 0.7, "A", dash);
  };
  S.hissan = function (page, line, pos, expr, answer) {
    var q = this.xy(page, line, pos);
    var b = { type: "hissan", x: q[0], y: q[1], expr: expr, cell: CELL, grid: "none", ansColor: BLUE, zeroStep: "skip", spare: 0 };
    this.extra.push([Object.assign({}, b, { mode: "problem" }), "K"]);
    if (answer !== false) this.extra.push([Object.assign({}, b, { mode: "answer" }), "A"]);
  };

  S.masu = function (page, example) {
    var lines = [], styles = [];
    this.grid[page].forEach(function (row) {
      var last = -1;
      row.forEach(function (c, i) { if (c && (example || c[1].kind !== "A") && c[0] !== "　") last = i; });
      var s = [], st = [];
      for (var i = 0; i <= last; i++) {
        var c = row[i];
        if (!c || (c[1].kind === "A" && !example)) { s.push("　"); st.push(null); continue; }
        var t = c[1];
        Array.from(c[0]).forEach(function (ch) {
          s.push(ch);
          var d = {};
          if (t.color !== INK) d.color = t.color;
          if (t.bold) d.bold = true;
          st.push(Object.keys(d).length ? d : null);
        });
      }
      lines.push(s); styles.push(st);
    });
    var text = [], sty = [];
    lines.forEach(function (s, i) {
      text = text.concat(s); sty = sty.concat(styles[i]);
      if (i < lines.length - 1) { text.push("\n"); sty.push(null); }
    });
    return { type: "masu", x: PAGE_X[page], y: TOP, dir: this.v ? "v" : "h", cell: CELL, perLine: this.v ? 23 : 16, lines: this.v ? 16 : 23,
      gap: 0, leader: true, frame: true, lineStyle: "solid", gridColor: "green", text: text.join(""), styles: sty,
      fontScale: 0.68, font: "kyokasho", color: INK, autoGrow: false, locked: true,
      rules: { kutenKagi: false, gyotou: "off", kaiwaSage: false, danrakuSage: false, hankaku2: true } };
  };
  S.blocks = function (example, nameText) {
    var head = [
      { type: "text", x: 11, y: 11, w: 100, h: 9, dir: "h", html: nameText, size: 10.5, font: "kyokasho", pad: 1 },
      { type: "line", x1: 182, y1: 8, x2: 182, y2: 254, color: GRAY, width: 0.3, dash: "dash" }
    ];
    if (this.v) head.unshift({ type: "text", x: 283, y: 11, w: 70, h: 9, dir: "h", html: "　　月　　日（　　）", size: 10.5, font: "kyokasho", pad: 1, align: "end" });
    var out = head.concat([this.masu("R", example), this.masu("L", example)]);
    this.extra.forEach(function (e) { if ((e[1] === "A") === example) out.push(e[0]); });
    this.marks.forEach(function (m) { if (!(m[1] === "A" && !example)) out.push(m[0]); });
    return out;
  };

  /** 題名とめあて（kit.py の head と同じ置き方）。 */
  function head(n, title, meate, date, box, label) {
    box = box || RED; label = label || "めあて";
    var l, l2;
    if (n.v) {
      n.put("R", 1, 3, [T(title, "K", INK, true)]);
      l = 3;
      meate.forEach(function (s, i) {
        if (i === 0) n.put("R", l, 1, [T(label, "K", box, true), T("　")]);
        l2 = n.put("R", l, Array.from(label).length + 2, [T(s)])[0];
        if (l2 > l) n.err("めあての行「" + s + "」が1行に入らず折り返した。めあてを行で分ける");
        l = l2 + 1;
      });
      n.box("R", 3, l - 1, 1, 23, box, 0.8);
      return l - 1;
    }
    if (date) n.put("L", 1, 1, [T(date)]);
    n.put("L", 2, 1, [T(title, "K", INK, true)]);
    l = 3;
    meate.forEach(function (s, i) {
      if (i === 0) n.put("L", l, 1, [T(label, "K", box, true)]);
      l2 = n.put("L", l, Array.from(label).length + 1, [T(s)])[0];
      if (l2 > l) n.err("めあての行「" + s + "」が1行に入らず折り返した。めあてを行で分ける");
      l = l2 + 1;
    });
    n.box("L", 3, l - 1, 1, 16, box, 0.8);
    return l - 1;
  }

  // ---------- 紙面ファイル（Gemini が書くもの）を読む ----------
  var NEED = { head: ["title", "meate"], put: ["page", "text"], table: ["page", "widths", "rows"], box: ["page", "cell"],
    circle: ["page", "line", "cell"], poly: ["page", "points"], seg: ["page", "from", "to"], hissan: ["page", "expr"] };

  function runNote(n, ops) {
    ops.forEach(function (op, i) {
      n.where = "ノート" + (i + 1) + "番め（" + (op && op.do) + "）";
      if (!op || !NEED[op.do]) { n.err("do は head / put / table / box / circle / poly / seg / hissan のどれか"); return; }
      var miss = NEED[op.do].filter(function (k) { return op[k] == null; });
      if (miss.length) { n.err(miss.join("・") + " がない"); return; }
      if (op.page && op.page !== "L" && op.page !== "R") { n.err("page は \"L\"（左ページ）か \"R\"（右ページ）"); return; }
      var pg = op.page, gap = op.gap || 0;
      var at = function () { return op.line != null ? op.line : n.next[pg] + gap; };
      switch (op.do) {
        case "head": head(n, op.title, op.meate, op.date, color(op.color, RED), op.label); n.used(n.v ? "R" : "L", 2 + op.meate.length); break;
        case "put": n.put(pg, at(), op.cell || 1, pieces(op.text)); break;
        case "table": n.table(pg, at(), op.cell || 1, op.widths, op.rows, op.heights, op.head, color(op.color, INK)); break;
        case "box": {
          var l1 = Array.isArray(op.line) ? op.line[0] : at(), l2 = Array.isArray(op.line) ? op.line[1] : l1 + (op.lines || 1) - 1;
          n.box(pg, l1, l2, op.cell[0], op.cell[1], color(op.color, GRAY), op.width || (color(op.color, GRAY) === GRAY ? 0.4 : 0.8));
          break;
        }
        case "circle": n.circle(pg, op.line, op.cell[0], op.cell[1]); break;
        case "poly": n.poly(pg, op.points, color(op.color, INK), op.width, op.example ? "A" : null); break;
        case "seg": n.seg(pg, op.from[0], op.from[1], op.to[0], op.to[1], color(op.color, BLUE), op.width, op.dash); break;
        case "hissan": n.hissan(pg, at(), op.cell || 1, op.expr, op.answer); n.used(pg, at() + hissanRows(op.expr) - 1); break;
      }
      var lim = n.v ? 23 : 16;
      [].concat(op.cell || []).forEach(function (c) { if (c < 1 || c > lim) n.err("cell は 1〜" + lim); });
    });
    n.where = "";
  }

  /** 筆算が縦に何行使うか。わり算は商の行とわられる数の行に、0でない商の数字ごとに2行（ひく数と、その差）。 */
  function hissanRows(expr) {
    var m = String(expr).replace(/\s/g, "").match(/^(\d+)([÷×+\-−＋])(\d+)$/);
    if (!m) return 4;
    if (m[2] === "÷") {
      var q = String(Math.floor(+m[1] / +m[3])), steps = 0;
      for (var i = 0; i < q.length; i++) if (q[i] !== "0") steps++;
      return 2 + 2 * Math.max(steps, 1);
    }
    if (m[2] === "×") return m[3].length > 1 ? m[3].length + 3 : 3;
    return 3;
  }

  /** 板書の型を、マス目プリントメーカーの App.buildKata に渡せる形にする（board.mjs と同じ下ごしらえ）。 */
  function boardSpec(B, name) {
    var K = JSON.parse(JSON.stringify(B));
    K.name = K.name || name;
    (K.items || []).forEach(function (it) {
      if (it.bx != null) { it.c = (273 - it.bx - it.bw) / 7.6; it.cols = it.bw / 7.6; delete it.bx; delete it.bw; }
      if (K.dir !== "v" && it.k !== "line" && it.k !== "arrow" && it.k !== "rect") it.o = Object.assign({ lineHeight: 1.2 }, it.o || {});
    });
    return K;
  }

  function doc(title, blocks, paper, orient, meta) {
    return { version: 1, title: title, paper: paper || "B4", orient: orient || "landscape", margin: 8, snap: 0.5, meta: meta || {}, pages: [{ blocks: blocks }] };
  }

  /** 紙面ファイル → { note, example, board(型), errs } */
  function build(F) {
    var U = F.unit || {}, v = U.dir === "v", grade = +U.grade || 4, errs = [];
    if (!U.title) errs.push("unit.title（単元名）がない");
    if (!Array.isArray(F.note)) errs.push("note（ノートの指示の並び）がない");
    var name = (U.title || "") + "　第" + (F.ji || "?") + "時";
    var n = new Spread(v, grade, U.names || "");
    if (Array.isArray(F.note)) runNote(n, F.note);
    errs = errs.concat(n.errs.map(function (e) { return "ノート：" + e; }));
    var meta = { subject: U.subject || "", grade: grade + "年", name: name };
    var nameText = U.name_text || grade + "年　　組　名前（　　　　　　　　　）";
    var out = { name: name, errs: errs,
      note: doc(name + "　ノート", n.blocks(false, nameText), "B4", "landscape", meta),
      example: doc(name + "　ノート記入例", n.blocks(true, nameText), "B4", "landscape", meta) };
    if (F.board) {
      var chk = new Spread(v, grade, U.names || "");
      (F.board.items || []).forEach(function (it) {
        var txt = String(it.t || "").replace(/<[^>]+>/g, "");
        Array.from(txt).forEach(function (ch) { chk.checkKanji(ch, T(txt)); });
      });
      Array.from(new Set(chk.errs)).forEach(function (e) { errs.push("板書：" + e); });
      out.board = boardSpec(F.board, name);
    }
    return out;
  }

  /** Gemini の返事から JSON を取り出す（```json のかこみや、前後の説明文があってもよい）。 */
  function parse(text) {
    var s = String(text).trim(), m = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) s = m[1];
    var a = s.indexOf("{"), b = s.lastIndexOf("}");
    if (a < 0 || b < a) throw new Error("JSON の { } が見つかりません");
    return JSON.parse(s.slice(a, b + 1));
  }

  root.UnitKit = { build: build, parse: parse, setKanji: setKanji, units: units };
})(typeof window !== "undefined" ? window : globalThis);
