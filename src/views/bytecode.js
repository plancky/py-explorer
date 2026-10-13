// ---- bytecode ----
import { h } from "../util.js";
import { addItem } from "./common.js";

function opFamily(op) {
  if (op.startsWith("LOAD_") || op === "PUSH_NULL" || op === "COPY") return "load";
  if (op.startsWith("STORE_") || op.startsWith("DELETE_")) return "store";
  if (op.startsWith("CALL")) return "call";
  if (op.includes("JUMP") || op === "FOR_ITER" || op === "SEND" || op === "END_FOR") return "jump";
  if (op.startsWith("RETURN") || op.startsWith("RAISE") || op === "RERAISE" || op.startsWith("YIELD")) return "ret";
  return "";
}
export function renderBytecode(pane, r) {
  if (!r.bytecode) { pane.body.append(h("div", { class: "empty" }, "No bytecode: the source doesn't compile.")); return; }
  const n = r.bytecode.reduce((s, c) => s + c.instrs.length, 0);
  pane.tools.append(h("span", { class: "count" }, `${n} instructions · ${r.bytecode.length} code object${r.bytecode.length > 1 ? "s" : ""}`));
  for (const co of r.bytecode) {
    const meta = h("div", { class: "meta" });
    const row = (k, v) => v.length && meta.append(h("b", {}, k), h("span", {}, v.join(", ")));
    if (co.name !== "<module>") meta.append(h("b", {}, "argcount"), h("span", {}, co.argcount));
    row("locals", co.varnames); row("cells", co.cellvars); row("free", co.freevars);
    row("names", co.names); row("consts", co.consts);
    const tbody = h("tbody");
    let prevLine = null;
    for (const ins of co.instrs) {
      const tr = h("tr", { class: `op-${opFamily(ins.op)}${ins.range ? "" : " no-range"}${ins.line !== prevLine && prevLine !== null ? " line-start" : ""}` },
        h("td", { class: "num" }, ins.line !== prevLine && ins.line > 0 ? ins.line : ""),
        h("td", { class: "label" }, ins.label != null ? `L${ins.label}:` : ""),
        h("td", { class: "num" }, ins.offset),
        h("td", { class: "op" }, ins.op),
        h("td", { class: "num" }, ins.arg ?? ""),
        h("td", { class: "argrepr" }, ins.argrepr ? `(${ins.argrepr})` : ""));
      prevLine = ins.line;
      addItem(pane, tr, ins.range);
      tbody.append(tr);
    }
    pane.body.append(h("section", { class: "code-obj" },
      h("h3", {}, co.name, h("span", {}, `line ${co.firstline}`)), meta,
      h("table", {}, h("thead", {}, h("tr", {}, ["line", "", "offset", "opname", "arg", ""].map(s => h("th", {}, s)))), tbody)));
  }
}
