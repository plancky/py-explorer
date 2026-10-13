// ---------- resizable columns ----------
import { store } from "./util.js";
import { cm } from "./editor.js";

export function initResize(main) {
  let widths = store.get("widths", [34, 33]);
  const applyWidths = () => { main.style.setProperty("--w1", widths[0] + "%"); main.style.setProperty("--w2", widths[1] + "%"); };
  applyWidths();
  main.querySelectorAll(".gutter").forEach(g => {
    g.addEventListener("pointerdown", e => {
      e.preventDefault(); g.setPointerCapture(e.pointerId); g.classList.add("drag");
      const rect = main.getBoundingClientRect();
      const move = ev => {
        const pct = (ev.clientX - rect.left) / rect.width * 100, MIN = 15;
        if (g.dataset.g === "1") {
          const total = widths[0] + widths[1];
          widths[0] = Math.max(MIN, Math.min(total - MIN, pct)); widths[1] = total - widths[0];
        } else {
          widths[1] = Math.max(MIN, Math.min(100 - widths[0] - MIN, pct - widths[0]));
        }
        applyWidths(); cm.refresh();
      };
      const up = () => { g.removeEventListener("pointermove", move); g.classList.remove("drag"); store.set("widths", widths); };
      g.addEventListener("pointermove", move);
      g.addEventListener("pointerup", up, { once: true });
    });
  });
}
