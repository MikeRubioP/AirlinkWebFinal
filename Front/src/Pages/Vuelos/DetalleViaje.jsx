import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function DetalleViaje() {
  const location = useLocation();
  const navigate = useNavigate();

  // Preferimos lo que venga por state; si no, lo que esté guardado
  const datosViaje = useMemo(() => {
    return location.state || JSON.parse(localStorage.getItem("vueloSeleccionado"));
  }, [location.state]);

  // Persistimos si vino por state
  useEffect(() => {
    if (location.state) {
      localStorage.setItem("vueloSeleccionado", JSON.stringify(location.state));
    }
  }, [location.state]);

  // Si no hay datos, regresamos
  if (!datosViaje?.vueloIda) {
    navigate("/vuelos/buscar");
    return null;
  }

  // -------- helpers de formato --------
  const fmtCLP = (v) =>
    Number.isFinite(Number(v))
      ? Number(v).toLocaleString("es-CL", { maximumFractionDigits: 0 })
      : "0";

  const getLogoUrl = (logo) => {
    if (!logo) return null;
    if (logo.startsWith("http")) return logo;
    return `http://localhost:5174${logo}`;
  };

  const formatearDuracion = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}min`;
  };

  // -------- precios efectivos según tarifa seleccionada --------
  const precioIda = Number(
    datosViaje?.tarifaIda?.precio ?? datosViaje?.vueloIda?.precio ?? 0
  );
  const nombreTarifaIda = datosViaje?.tarifaIda?.nombre || null;

  const precioVuelta = Number(
    datosViaje?.vueloVuelta
      ? datosViaje?.tarifaVuelta?.precio ?? datosViaje?.vueloVuelta?.precio ?? 0
      : 0
  );
  const nombreTarifaVuelta =
    datosViaje?.tarifaVuelta?.nombre || (datosViaje?.vueloVuelta ? null : null);

  const pasajeros = Number(datosViaje?.pasajeros ?? 1);

  const calcularTotal = () => (precioIda + precioVuelta) * pasajeros;

  // -------- normalizadores para Pago --------
  const buildVueloPayload = (v) => ({
    idViaje: v.idViaje ?? v.id ?? null,
    empresa: v.empresa,
    origenCodigo: v.origenCodigo,
    destinoCodigo: v.destinoCodigo,
    horaSalida: v.horaSalida,
    horaLlegada: v.horaLlegada,
    // si quieres mostrarlo, puedes guardar minutos como texto:
    duracion: typeof v.duracion === "number" ? `${v.duracion} min` : (v.duracion || ""),
  });

  const buildTarifaPayload = (nombre, precio) => ({
    nombreTarifa: nombre || "Tarifa",
    precio: Number(precio || 0),
  });

  const continuarAAsientos = () => {
    // Guardar SIEMPRE la ida para el pago
    const vueloIdaPayload = buildVueloPayload(datosViaje.vueloIda);
    const tarifaIdaPayload = buildTarifaPayload(nombreTarifaIda, precioIda);
    localStorage.setItem("airlink_viaje", JSON.stringify(vueloIdaPayload));
    localStorage.setItem("airlink_tarifa", JSON.stringify(tarifaIdaPayload));

    // (Opcional) Si hay vuelta, también la dejo guardada por si la quieres usar después.
    if (datosViaje.vueloVuelta) {
      const vueloVtaPayload = buildVueloPayload(datosViaje.vueloVuelta);
      const tarifaVtaPayload = buildTarifaPayload(nombreTarifaVuelta, precioVuelta);
      localStorage.setItem("airlink_viaje_vuelta", JSON.stringify(vueloVtaPayload));
      localStorage.setItem("airlink_tarifa_vuelta", JSON.stringify(tarifaVtaPayload));
    } else {
      localStorage.removeItem("airlink_viaje_vuelta");
      localStorage.removeItem("airlink_tarifa_vuelta");
    }

    // Continúas tu flujo tal cual
    navigate("/vuelos/seleccion-asiento", { state: datosViaje });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Resumen de tu viaje</h1>
          <p className="text-purple-100 mt-2">
            Revisa los detalles antes de continuar con la selección de asientos
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Detalles */}
          <div className="lg:col-span-2 space-y-6">
            {/* IDA */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Vuelo de Ida</h2>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Directo
                </span>
              </div>

              <div className="border-b pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-800">
                      {datosViaje.vueloIda.horaSalida}
                    </div>
                    <div className="text-gray-600 mt-1">
                      {datosViaje.vueloIda.origenCodigo}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(datosViaje.fechaIda).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  <div className="flex-1 px-8">
                    <div className="text-center text-sm text-gray-500 mb-2">
                      {formatearDuracion(datosViaje.vueloIda.duracion)}
                    </div>
                    <div className="relative">
                      <div className="h-1 bg-gray-300 rounded"></div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-600 rounded-full"></div>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-600 rounded-full"></div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-800">
                      {datosViaje.vueloIda.horaLlegada}
                    </div>
                    <div className="text-gray-600 mt-1">
                      {datosViaje.vueloIda.destinoCodigo}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {datosViaje.vueloIda.empresaLogo && (
                  <img
                    src={getLogoUrl(datosViaje.vueloIda.empresaLogo)}
                    alt={datosViaje.vueloIda.empresa}
                    className="h-10 w-auto"
                  />
                )}
                <div>
                  <div className="font-semibold text-gray-800">
                    {datosViaje.vueloIda.empresa}
                  </div>
                  <div className="text-sm text-gray-600">{datosViaje.vueloIda.modelo}</div>
                </div>
              </div>

              {/* Tarifa de IDA (si existe) */}
              {nombreTarifaIda && (
                <div className="mt-4 text-sm">
                  <span className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                    Tarifa seleccionada: <b>{nombreTarifaIda}</b> — ${fmtCLP(precioIda)}
                  </span>
                </div>
              )}
            </div>

            {/* VUELTA (opcional) */}
            {datosViaje.vueloVuelta && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Vuelo de Vuelta</h2>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Directo
                  </span>
                </div>

                <div className="border-b pb-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-800">
                        {datosViaje.vueloVuelta.horaSalida}
                      </div>
                      <div className="text-gray-600 mt-1">
                        {datosViaje.vueloVuelta.origenCodigo}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(datosViaje.fechaVuelta).toLocaleDateString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>

                    <div className="flex-1 px-8">
                      <div className="text-center text-sm text-gray-500 mb-2">
                        {formatearDuracion(datosViaje.vueloVuelta.duracion)}
                      </div>
                      <div className="relative">
                        <div className="h-1 bg-gray-300 rounded"></div>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-600 rounded-full"></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-600 rounded-full"></div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-800">
                        {datosViaje.vueloVuelta.horaLlegada}
                      </div>
                      <div className="text-gray-600 mt-1">
                        {datosViaje.vueloVuelta.destinoCodigo}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {datosViaje.vueloVuelta.empresaLogo && (
                    <img
                      src={getLogoUrl(datosViaje.vueloVuelta.empresaLogo)}
                      alt={datosViaje.vueloVuelta.empresa}
                      className="h-10 w-auto"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-gray-800">
                      {datosViaje.vueloVuelta.empresa}
                    </div>
                    <div className="text-sm text-gray-600">{datosViaje.vueloVuelta.modelo}</div>
                  </div>
                </div>

                {/* Tarifa de VUELTA (si existe) */}
                {datosViaje?.tarifaVuelta?.nombre && (
                  <div className="mt-4 text-sm">
                    <span className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                      Tarifa seleccionada: <b>{datosViaje.tarifaVuelta.nombre}</b> — $
                      {fmtCLP(precioVuelta)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Información importante */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span className="text-xl">ℹ️</span>
                Información importante
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>
                    Llega al aeropuerto con al menos 2 horas de anticipación para vuelos
                    internacionales
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Verifica los documentos requeridos para viajar a tu destino</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>El equipaje de mano no debe exceder 10kg y 55x40x20cm</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>Podrás seleccionar tus asientos en el siguiente paso</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Columna derecha: Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Resumen de compra</h3>

              <div className="space-y-3 mb-4 pb-4 border-b">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Vuelo de ida {nombreTarifaIda ? `(${nombreTarifaIda})` : ""}
                  </span>
                  <span className="font-semibold">${fmtCLP(precioIda)}</span>
                </div>

                {datosViaje.vueloVuelta && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Vuelo de vuelta {datosViaje?.tarifaVuelta?.nombre ? `(${datosViaje.tarifaVuelta.nombre})` : ""}
                    </span>
                    <span className="font-semibold">${fmtCLP(precioVuelta)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pasajeros</span>
                  <span className="font-semibold">{pasajeros}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Clase</span>
                  <span className="font-semibold capitalize">{datosViaje.clase}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-gray-800">Total</span>
                <span className="text-2xl font-bold text-purple-600">
                  ${fmtCLP(calcularTotal())}
                </span>
              </div>

              <button
                onClick={continuarAAsientos}
                className="w-full bg-purple-600 text-white py-4 rounded-lg hover:bg-purple-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                Continuar a selección de asientos
              </button>

              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate(-2)}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  ← Volver a buscar vuelos
                </button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <span>🔒</span>
                  <span>
                    Tus datos están protegidos. El precio final incluye todos los impuestos y
                    tasas.
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* fin resumen */}
        </div>
      </div>
    </div>
  );
}
