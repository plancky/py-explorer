// ---------- editor ----------
import CodeMirror from "codemirror";
import "codemirror/mode/python/python.js";
import { store } from "./util.js";
import { EXAMPLES } from "./examples.js";

export const cm = CodeMirror(document.getElementById("editor"), {
  value: store.get("src", EXAMPLES["Function + closure"]),
  mode: { name: "python", version: 3 },
  lineNumbers: true, indentUnit: 4, tabSize: 4, indentWithTabs: false,
  extraKeys: {
    Tab: c => c.somethingSelected() ? c.indentSelection("add") : c.replaceSelection("    ", "end"),
    "Shift-Tab": c => c.indentSelection("subtract"),
  },
});

let hlMarks = [];
export function markRange(r, cls, lineCls, bucket) {
  if (!r) return;
  const [sl, sc, el, ec] = r;
  const last = cm.lineCount();
  if (sc == null || ec == null || (sl === el && sc === ec)) {
    for (let l = sl; l <= el && l <= last; l++) {
      const handle = cm.addLineClass(l - 1, "background", lineCls);
      bucket.push({ clear: () => cm.removeLineClass(handle, "background", lineCls) });
    }
  } else {
    bucket.push(cm.markText({ line: sl - 1, ch: sc }, { line: el - 1, ch: ec }, { className: cls }));
  }
}
export function highlight(r) {
  clearHighlight();
  if (!r) return;
  markRange(r, "hl", "hl-line", hlMarks);
  cm.scrollIntoView({ line: r[0] - 1, ch: r[1] ?? 0 }, 40);
}
export function clearHighlight() { hlMarks.forEach(m => m.clear()); hlMarks = []; }

// Select the source span of `r` in the editor.
export function selectRange(r) {
  if (r[1] == null) cm.setSelection({ line: r[0] - 1, ch: 0 }, { line: r[2] - 1, ch: cm.getLine(r[2] - 1)?.length ?? 0 });
  else cm.setSelection({ line: r[0] - 1, ch: r[1] }, { line: r[2] - 1, ch: r[3] });
}
