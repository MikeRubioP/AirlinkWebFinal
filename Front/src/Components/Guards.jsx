// src/Components/Guards.jsx
import { Navigate, useLocation } from "react-router-dom";
import { getJsonLS, clearFlowState } from "../utils/flowStorage";

// ==================== HELPERS ====================
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

// ==================== GUARDS ====================

/**
 * RequireSearch
 * Verifica que exista un estado de búsqueda.
 * Si no existe, limpia estados zombis.
 */
export function RequireSearch({ children }) {
  const s = getJsonLS("searchState");
  if (!s) clearFlowState();
  return children;
}

/**
 * RequireFlightOut
 * Requiere que haya un vuelo de ida seleccionado con tarifa.
 * Si no cumple, limpia el flujo y redirige.
 */
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

/**
 * RequireReturnIfRoundTrip
 * Si el viaje es redondo (RT), requiere que haya vuelo de vuelta con tarifa.
 * Si no es RT, permite el acceso.
 */
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

/**
 * RequireCheckoutReady
 * Verifica que estén seleccionados los asientos antes de ir a pago.
 * Revisa múltiples fuentes: bandera en localStorage, asientos sueltos, o dentro de vueloSeleccionado.
 */
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

/**
 * RequirePaymentDone
 * Verifica que el pago se haya completado exitosamente.
 * Solo permite acceso a /pago-exitoso si payment_ok está en true.
 */
export function RequirePaymentDone({ children, redirectTo = "/" }) {
  const loc = useLocation();
  const ok = localStorage.getItem("payment_ok") === "true";
  
  if (!ok) {
    return <Navigate to={redirectTo} state={{ from: loc }} replace />;
  }
  return children;
}