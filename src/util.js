// ---------- small helpers ----------
export const store = {
  get(k, d) { try { const v = localStorage.getItem("pyx:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("pyx:" + k, JSON.stringify(v)); } catch {} },
};
export function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k.startsWith("data-")) e.setAttribute(k, v);
    else e[k] = v;
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k instanceof Node ? k : String(k));
  return e;
}
export const fmtPos = r => r ? (r[1] == null ? `L${r[0]}` : `${r[0]}:${r[1]}–${r[2]}:${r[3]}`) : "";
export const showText = s => JSON.stringify(s);
