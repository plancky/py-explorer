import { h, store } from "../util.js";

export function addItem(pane, el, range) {
  el.dataset.i = pane.items.length;
  pane.items.push({ el, range });
  return el;
}

// Checkbox that toggles a class on `target`; with `invert`, checked means the class is off.
export function toggle(label, cls, target, invert = false) {
  const key = "opt:" + cls;
  const on = store.get(key, false);
  target.classList.toggle(cls, on);
  const input = h("input", { type: "checkbox", checked: invert ? !on : on });
  input.addEventListener("change", () => {
    const v = invert ? !input.checked : input.checked;
    target.classList.toggle(cls, v); store.set(key, v);
  });
  return h("label", { class: "chk" }, input, label);
}
