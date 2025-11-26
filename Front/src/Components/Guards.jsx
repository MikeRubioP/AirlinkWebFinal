// src/Components/Guards.jsx
import { Navigate, useLocation } from "react-router-dom";
import { getJsonLS, clearFlowState } from "../utils/flowStorage";

// Helpers locales
const tarifaOk = (obj) => Boolean(obj?.tarifaIda || obj?.precioIda || obj?.fareIda);
const tarifaOkVta = (obj) => Boolean(obj?.tarifaVuelta || obj?.precioVuelta || obj?.fareVuelta);

const hasSeats = (d) => {
  if (!d) return false;
  // soporta ambas variantes: array suelto o dentro de vueloSeleccionado
  if (Array.isArray(d)) return d.length > 0;
  if (Array.isArray(d.asientosIda) && d.asientosIda.length > 0) return true;
  if (Array.isArray(d.asientosVuelta) && d.asientosVuelta.length > 0) return true;
  return false;
};

export function RequireSearch({ children }) {
  // no-op, pero si expiró, limpiamos para evitar estados zombis
  const s = getJsonLS("searchState");
  if (!s) clearFlowState();
  return children;
}

export function RequireFlightOut({ children, redirectTo = "/" }) {
  const loc = useLocation();
  const d = getJsonLS("vueloSeleccionado") || {};
  const ok = Boolean(d?.vueloIda) && tarifaOk(d);
  if (!ok) {
    clearFlowState();
    return <Navigate to={redirectTo} state={{ from: loc }} replace />;
  }
  return children;
}

export function RequireReturnIfRoundTrip({ children, redirectTo = "/" }) {
  const loc = useLocation();
  const s = getJsonLS("searchState") || {};
  const d = getJsonLS("vueloSeleccionado") || {};

  const isRT = s?.tipoViaje === "RT" || Boolean(d?.fechaVuelta);
  const ok = !isRT || (Boolean(d?.vueloVuelta) && tarifaOkVta(d));

  if (!ok) {
    clearFlowState();
    return <Navigate to={redirectTo} state={{ from: loc }} replace />;
  }
  return children;
}

export function RequireCheckoutReady({ children, redirectTo = "/" }) {
  const loc = useLocation();

  // a) bandera clásica
  const flag = localStorage.getItem("checkout_ready") === "true";

  // b) asientos guardados sueltos
  const seatsLS = getJsonLS("asientosSeleccionados");

  // c) asientos dentro de vueloSeleccionado
  const d = getJsonLS("vueloSeleccionado");

  const ok = flag || hasSeats(seatsLS) || hasSeats(d);

  if (!ok) {
    clearFlowState();
    return <Navigate to={redirectTo} state={{ from: loc }} replace />;
  }
  return children;
}

export function RequirePaymentDone({ children, redirectTo = "/" }) {
  const loc = useLocation();
  const ok = localStorage.getItem("payment_ok") === "true";
  return ok ? children : <Navigate to={redirectTo} state={{ from: loc }} replace />;
}
