// ---------- panes ----------
import { h, store } from "./util.js";
import { cm, highlight, clearHighlight, selectRange } from "./editor.js";
import { renderTokens } from "./views/tokens.js";
import { renderAst } from "./views/ast.js";
import { renderBytecode } from "./views/bytecode.js";

const VIEWS = { tokens: "Tokens", ast: "AST", bytecode: "Bytecode" };
const RENDERERS = { tokens: renderTokens, ast: renderAst, bytecode: renderBytecode };

export const state = { result: null };
export const panes = [];

export function makePane(id, defaultView) {
  const root = document.getElementById(id);
  const pane = { id, root, view: store.get("view:" + id, defaultView), items: [] };
  pane.select = h("select", {}, Object.entries(VIEWS).map(([k, v]) => h("option", { value: k }, v)));
  pane.select.value = pane.view;
  pane.tools = h("span", { class: "tools" });
  pane.body = h("div", { class: "pane-body" });
  root.append(h("div", { class: "pane-head" }, pane.select, pane.tools), pane.body);

  pane.select.addEventListener("change", () => {
    pane.view = pane.select.value; store.set("view:" + id, pane.view); render(pane); syncFromCursor(false);
  });
  pane.body.addEventListener("mouseover", e => {
    const el = e.target.closest("[data-i]");
    if (el && pane.body.contains(el)) highlight(pane.items[+el.dataset.i]?.range);
  });
  pane.body.addEventListener("mouseleave", clearHighlight);
  pane.body.addEventListener("click", e => {
    if (e.target.closest("button, input, label")) return;
    const el = e.target.closest("[data-i]");
    const r = el && pane.items[+el.dataset.i]?.range;
    if (r) selectRange(r);
  });
  panes.push(pane);
  return pane;
}

export function render(pane) {
  pane.items = [];
  pane.body.replaceChildren();
  pane.tools.replaceChildren();
  pane.body.className = "pane-body";
  const r = state.result;
  if (!r) { pane.body.append(h("div", { class: "empty" }, "Waiting for Python…")); return; }
  RENDERERS[pane.view](pane, r);
}

// ---------- cursor → panes ----------
function contains(r, line, ch, strict) {
  if (!r) return false;
  const [sl, sc, el, ec] = r;
  if (line < sl || line > el) return false;
  if (sc == null) return true;
  if (line === sl && ch < sc) return false;
  if (line === el && (strict ? ch >= ec : ch > ec)) return false;
  return true;
}
const size = r => r[1] == null ? (r[2] - r[0] + 1) * 1e6 : (r[2] - r[0]) * 1e4 + (r[3] - r[1]);
export function syncFromCursor(scroll = true) {
  const p = cm.getCursor(), line = p.line + 1, ch = p.ch;
  for (const pane of panes) {
    pane.body.querySelectorAll(".active, .active-weak").forEach(e => e.classList.remove("active", "active-weak"));
    let hits = pane.items.filter(it => contains(it.range, line, ch, true) && size(it.range) > 0);
    if (!hits.length) hits = pane.items.filter(it => contains(it.range, line, ch, false));
    if (!hits.length) continue;
    const min = Math.min(...hits.map(it => size(it.range)));
    let first = null;
    for (const it of hits) {
      const strong = size(it.range) === min;
      it.el.classList.add(strong ? "active" : "active-weak");
      if (strong && !first) first = it.el;
    }
    if (scroll && first) {
      for (let d = first.parentElement; d && d !== pane.body; d = d.parentElement) if (d.tagName === "DETAILS") d.open = true;
      first.scrollIntoView({ block: "nearest" });
    }
  }
}
