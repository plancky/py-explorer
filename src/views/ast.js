// ---- AST ----
import { h, fmtPos } from "../util.js";
import { addItem, toggle } from "./common.js";

export function renderAst(pane, r) {
  if (!r.ast) { pane.body.append(h("div", { class: "empty" }, "No AST: the source doesn't parse. The token stream may still be partly available.")); return; }
  const all = open => () => pane.body.querySelectorAll("details").forEach(d => d.open = open);
  pane.tools.append(
    h("button", { class: "btn", onclick: all(true) }, "expand all"),
    h("button", { class: "btn", onclick: all(false) }, "collapse all"),
    toggle("positions", "hide-pos", pane.body, true),
    toggle("hide ctx", "hide-ctx", pane.body),
  );

  const lbl = l => l == null ? null : h("span", { class: "lbl" }, `${l}: `);
  function node(n, label, fieldName) {
    const fcls = fieldName ? ` f-${fieldName}` : "";
    if (n.v !== undefined)
      return h("div", { class: "field" + fcls }, lbl(label), h("span", { class: "k-" + n.k }, n.v));
    if (n.list) {
      if (!n.list.length) return h("div", { class: "field" + fcls }, lbl(label), h("span", { class: "lbl" }, "[]"));
      return h("details", { open: true, class: fcls.trim() || null },
        h("summary", {}, lbl(label), h("span", { class: "lbl" }, `[${n.list.length}]`)),
        h("div", { class: "kids" }, n.list.map((c, i) => node(c, i))));
    }
    if (!n.f.length && !n.range)  // Load, Store, Add, …
      return h("div", { class: "field" + fcls }, lbl(label), h("span", { class: "leaf" }, n.t));
    const summary = h("summary", {}, lbl(label), h("span", { class: "t" }, n.t), n.range ? h("span", { class: "pos" }, fmtPos(n.range)) : null);
    if (n.range) addItem(pane, summary, n.range);
    return h("details", { open: true, class: fcls.trim() || null }, summary,
      h("div", { class: "kids" }, n.f.map(([name, v]) => node(v, name, name))));
  }
  pane.body.append(h("div", { class: "ast" }, node(r.ast)));
}
