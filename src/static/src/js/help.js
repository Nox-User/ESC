// ========================= HELPERS ========================= //

// --------- Seletores DOM ---------
export const $ = (sel, ctx=document) => ctx.querySelector(sel);
export const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

// --------- Math Utils ---------
export const map = (value, sMin, sMax, dMin, dMax) =>
  dMin + ((value - sMin) / (sMax - sMin)) * (dMax - dMin);

// --------- Animações ---------
export function animateValue({ from=0, to=1, duration=800, onUpdate, easing=(t)=>t, onComplete }) {
  const start = performance.now();
  function frame(now) {
    const p = Math.min(1, (now - start) / duration);
    const v = from + (to - from) * easing(p);
    onUpdate && onUpdate(v);
    if (p < 1) {
      requestAnimationFrame(frame);
    } else {
      onComplete && onComplete();
    }
  }
  requestAnimationFrame(frame);
}

// --------- Datas ---------
export const now = new Date();
export const month = now.toLocaleString("default", { month: "long" }).toUpperCase();
export const monthnumber = now.getMonth() + 1;
export const year = now.getFullYear();

// --------- Processos ---------
export const PROCESSOS = [
  { id: "USINAGEM", label: "Usinagem" },
  { id: "DOBRA",    label: "Dobra" },
  { id: "CHANFRO",  label: "Chanfro" },
  { id: "SOLDA",    label: "Solda" },
];

// --------- Status Utils ---------
export function normalizarStatus(status) {
  return (status || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function mapearStatus(status) {
  const s = normalizarStatus(status);
  if (s === "NAO INICIADO") return "NÃO INICIADO";
  if (
    s === "EM DESENVOLVIMENTO" ||
    s === "PROCESSO DE DOBRA" ||
    s === "PROCESSO DE CHANFRO" ||
    s === "PROCESSO DE SOLDA" ||
    s === "PROCESSO DE USINAGEM"
  ) return "EM ANDAMENTO";
  if (s === "FINALIZADO") return "FINALIZADO";
  return null;
}
