// ---- tokens ----
import { h, showText } from "../util.js";
import { addItem, toggle } from "./common.js";

const STRUCT = new Set(["NEWLINE", "NL", "INDENT", "DEDENT", "ENDMARKER"]);
function tokenCat(t) {
  if (t.kw) return t.kw;
  if (t.type === "NAME") return "name";
  if (t.type === "OP") return "op";
  if (t.type === "NUMBER") return "num";
  if (t.type === "STRING" || t.type.startsWith("FSTRING") || t.type.startsWith("TSTRING")) return "str";
  if (t.type === "COMMENT") return "comment";
  if (STRUCT.has(t.type)) return "struct";
  if (t.type === "ERRORTOKEN") return "err";
  return "name";
}
export function renderTokens(pane, r) {
  pane.tools.append(
    h("span", { class: "count" }, `${r.tokens.length} tokens`),
    toggle("hide NL / COMMENT", "hide-trivia", pane.body),
  );
  const tbody = h("tbody");
  let prevLine = 0;
  r.tokens.forEach((t, i) => {
    const cat = tokenCat(t);
    const trivia = t.type === "NL" || t.type === "COMMENT";
    const tag = t.type === "OP" ? h("span", { class: "tag" }, "OP ", h("small", {}, t.exact))
      : h("span", { class: "tag" }, t.type, t.kw ? h("small", {}, t.kw === "kw" ? " keyword" : " soft kw") : null);
    const tr = h("tr", { class: `cat-${cat}${trivia ? " cat-trivia" : ""}${t.range[0] !== prevLine && i ? " line-start" : ""}` },
      h("td", { class: "num" }, i), h("td", {}, tag), h("td", { class: "text" }, showText(t.text)),
      h("td", { class: "pos" }, `${t.range[0]}:${t.range[1]}`), h("td", { class: "pos" }, `${t.range[2]}:${t.range[3]}`));
    prevLine = t.range[0];
    addItem(pane, tr, t.range);
    tbody.append(tr);
  });
  pane.body.append(h("table", {},
    h("thead", {}, h("tr", {}, ["#", "type", "text", "start", "end"].map(s => h("th", {}, s)))), tbody));
  if (r.tokenError) pane.body.append(h("div", { class: "tok-err" }, `tokenize stopped: ${r.tokenError}`));
}
