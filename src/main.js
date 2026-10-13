import "codemirror/lib/codemirror.css";
import "./styles/theme.css";
import "./styles/layout.css";
import "./styles/editor.css";
import "./styles/common.css";
import "./styles/tokens.css";
import "./styles/ast.css";
import "./styles/bytecode.css";

import { h } from "./util.js";
import { EXAMPLES } from "./examples.js";
import { cm } from "./editor.js";
import { panes, makePane, render, syncFromCursor } from "./panes.js";
import { initResize } from "./resize.js";
import { startPython } from "./analysis.js";

cm.on("cursorActivity", () => syncFromCursor(true));

// ---------- examples ----------
const exSel = document.getElementById("examples");
for (const name of Object.keys(EXAMPLES)) exSel.append(h("option", { value: name }, name));
// Show the example the editor currently holds; "—" once it's been edited.
const syncExample = () => {
  const src = cm.getValue();
  exSel.value = Object.keys(EXAMPLES).find(k => EXAMPLES[k] === src) ?? "";
};
exSel.addEventListener("change", () => {
  if (!exSel.value) return;
  cm.setValue(EXAMPLES[exSel.value]); cm.focus();
});
cm.on("changes", syncExample);
syncExample();

initResize(document.getElementById("main"));

// ---------- boot ----------
makePane("paneA", "tokens");
makePane("paneB", "ast");
panes.forEach(render);
startPython();
