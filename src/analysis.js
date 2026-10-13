// ---------- analysis ----------
import { loadPyodide, version as PYODIDE_VERSION } from "pyodide";
import analyzeSrc from "./analyze.py?raw";
import { h, store } from "./util.js";
import { cm, markRange } from "./editor.js";
import { state, panes, render, syncFromCursor } from "./panes.js";

const msgbar = document.getElementById("msgbar");
let analyzeFn = null, timer = null, errMarks = [];

function runAnalysis() {
  if (!analyzeFn) return;
  const src = cm.getValue();
  store.set("src", src);
  let r;
  try { r = JSON.parse(analyzeFn(src)); }
  catch (e) { r = { tokens: [], warnings: [], error: { kind: "InternalError", msg: String(e), range: null } }; }
  state.result = r;

  errMarks.forEach(m => m.clear()); errMarks = [];
  msgbar.replaceChildren();
  if (r.error) {
    const where = r.error.range ? ` (line ${r.error.range[0]}, col ${r.error.range[1] + 1})` : "";
    msgbar.append(h("div", { class: "msg err" }, `${r.error.kind}: ${r.error.msg}${where}`));
    if (r.error.range) {
      markRange(r.error.range, "err-mark", "err-line", errMarks);
      markRange([r.error.range[0], null, r.error.range[0], null], "", "err-line", errMarks);
    }
  }
  for (const w of r.warnings || []) msgbar.append(h("div", { class: "msg warn" }, `warning · ${w}`));
  panes.forEach(render);
  syncFromCursor(false);
}

export async function startPython() {
  cm.on("changes", () => { clearTimeout(timer); timer = setTimeout(runAnalysis, 300); });
  const status = document.getElementById("status");
  try {
    const py = await loadPyodide({ indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/` });
    py.runPython(analyzeSrc);
    analyzeFn = py.globals.get("analyze");
    status.className = "";
    status.textContent = `CPython ${py.runPython("VERSION")} · Pyodide ${PYODIDE_VERSION}`;
    runAnalysis();
  } catch (e) {
    status.className = "";
    status.textContent = "Failed to load Python";
    msgbar.replaceChildren(h("div", { class: "msg err" }, `Could not start Pyodide: ${e}. Check your connection; the runtime loads from the jsDelivr CDN.`));
  }
}
