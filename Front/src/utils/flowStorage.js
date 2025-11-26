// Guarda/lee JSON con expiración (TTL) para tu flujo de compra

const now = () => Date.now();

const WRAP = (value, ttlMs) => ({
  v: value,
  // expire = 0 => no expira
  e: ttlMs && ttlMs > 0 ? now() + ttlMs : 0,
});

export function setJsonLS(key, value, ttlMs = 2 * 60 * 60 * 1000) { // 2h por defecto
  try {
    localStorage.setItem(key, JSON.stringify(WRAP(value, ttlMs)));
  } catch {}
}

export function getJsonLS(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === "null" || raw === "undefined") return null;
    const obj = JSON.parse(raw);
    // si no hay envoltura previa, devuélvelo tal cual
    if (obj && typeof obj === "object" && ("v" in obj || "e" in obj)) {
      if (obj.e && obj.e > 0 && obj.e < now()) {
        // expirado → borrar y retornar null
        localStorage.removeItem(key);
        return null;
      }
      return obj.v;
    }
    return obj;
  } catch {
    return null;
  }
}

export function removeLS(key) {
  try { localStorage.removeItem(key); } catch {}
}

export function clearFlowState() {
  // Borra SOLO las claves del flujo (ajusta los nombres si usas otros)
  removeLS("searchState");
  removeLS("vueloSeleccionado");
  removeLS("asientosSeleccionados");
  removeLS("pagoOk");
  removeLS("ordenPago");
}

// Helpers cómodos para tu flujo:
export const flow = {
  saveSearch: (s, ttlMs) => setJsonLS("searchState", s, ttlMs),
  readSearch: () => getJsonLS("searchState"),
  saveSelection: (sel, ttlMs) => setJsonLS("vueloSeleccionado", sel, ttlMs),
  readSelection: () => getJsonLS("vueloSeleccionado"),
  saveSeats: (seats, ttlMs) => setJsonLS("asientosSeleccionados", seats, ttlMs),
  readSeats: () => getJsonLS("asientosSeleccionados"),
  savePaymentOK: (p, ttlMs) => setJsonLS("pagoOk", p, ttlMs),
  readPaymentOK: () => getJsonLS("pagoOk"),
};
