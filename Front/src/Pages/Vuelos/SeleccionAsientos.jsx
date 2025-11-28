// src/Pages/Vuelos/SeleccionAsientos.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* ---------- helpers ---------- */
const lsGet = (k) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};
const lsSet = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

// Constantes de precios
const PRECIOS_ASIENTOS = {
  premium: 25000,        // Primera clase / Premium
  confort: 15000,        // Asientos confort+
  salidaEmergencia: 12000, // Salida de emergencia
  primeraFila: 10000,    // Primera fila
  estandar: 8000,        // Selección manual estándar
  aleatorio: 0           // Asignación aleatoria (gratis)
};

export default function SeleccionAsientos() {
  const location = useLocation();
  const navigate = useNavigate();

  const inicial = useMemo(
    () => location.state ?? lsGet("airlink_datos_viaje"),
    [location.state]
  );

  const [datosViaje, setDatosViaje] = useState(inicial);
  const [vueloActual, setVueloActual] = useState("ida");
  const [asientosIda, setAsientosIda] = useState([]);
  const [asientosVuelta, setAsientosVuelta] = useState([]);
  const [asientosSeleccionadosIda, setAsientosSeleccionadosIda] = useState([]);
  const [asientosSeleccionadosVuelta, setAsientosSeleccionadosVuelta] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Nuevo estado para modo de selección
  const [modoSeleccion, setModoSeleccion] = useState("manual"); // "manual" o "aleatorio"

  useEffect(() => {
    if (!datosViaje || !datosViaje?.vueloIda?.idViaje) {
      navigate("/", { replace: true });
      return;
    }
    lsSet("airlink_datos_viaje", datosViaje);
  }, [datosViaje, navigate]);

  useEffect(() => {
    const cargarAsientos = async () => {
      if (!datosViaje?.vueloIda?.idViaje) return;
      try {
        setLoading(true);

        // IDA
        let dataIda = null;
        try {
          const rIda = await fetch(
            `http://localhost:5174/api/asientos/${datosViaje.vueloIda.idViaje}`
          );
          dataIda = await rIda.json();
        } catch {}
        setAsientosIda(dataIda?.asientos || generarAsientosMock());

        // VUELTA
        if (datosViaje?.vueloVuelta?.idViaje) {
          let dataVuelta = null;
          try {
            const rV = await fetch(
              `http://localhost:5174/api/asientos/${datosViaje.vueloVuelta.idViaje}`
            );
            dataVuelta = await rV.json();
          } catch {}
          setAsientosVuelta(dataVuelta?.asientos || generarAsientosMock());
        }
      } finally {
        setLoading(false);
      }
    };

    cargarAsientos();
  }, [datosViaje]);

  const generarAsientosMock = () => {
    const asientos = [];
    const letras = ["A", "B", "C", "D", "E", "F"];
    
    for (let fila = 1; fila <= 30; fila++) {
      for (const letra of letras) {
        let tipo = "estandar";
        let caracteristicas = [];
        let precio = PRECIOS_ASIENTOS.estandar;

        // Primera clase (filas 1-3)
        if (fila <= 3) {
          tipo = "premium";
          precio = PRECIOS_ASIENTOS.premium;
          caracteristicas.push("Primera Clase", "Espacio Extra", "Servicio Premium");
        }
        // Confort+ (filas 4-7)
        else if (fila <= 7) {
          tipo = "confort";
          precio = PRECIOS_ASIENTOS.confort;
          caracteristicas.push("Confort+", "Más Espacio");
        }
        // Salida de emergencia (filas 10 y 20)
        else if (fila === 10 || fila === 20) {
          tipo = "salidaEmergencia";
          precio = PRECIOS_ASIENTOS.salidaEmergencia;
          caracteristicas.push("Salida de Emergencia", "Espacio Extra para Piernas");
        }
        // Primera fila de económica (fila 8)
        else if (fila === 8) {
          tipo = "primeraFila";
          precio = PRECIOS_ASIENTOS.primeraFila;
          caracteristicas.push("Primera Fila", "Sin asiento adelante");
        }

        // Características adicionales por letra
        if (letra === "A" || letra === "F") {
          caracteristicas.push("Ventana");
        } else if (letra === "C" || letra === "D") {
          caracteristicas.push("Pasillo");
        } else {
          caracteristicas.push("Centro");
        }

        asientos.push({
          numero: `${fila}${letra}`,
          disponible: Math.random() > 0.3,
          tipo,
          precio,
          caracteristicas,
          fila,
          letra
        });
      }
    }
    return asientos;
  };

  const asientosActuales = vueloActual === "ida" ? asientosIda : asientosVuelta;
  const seleccionados =
    vueloActual === "ida"
      ? asientosSeleccionadosIda
      : asientosSeleccionadosVuelta;
  const setSeleccionados =
    vueloActual === "ida"
      ? setAsientosSeleccionadosIda
      : setAsientosSeleccionadosVuelta;

  const pasajeros = Number(datosViaje?.pasajeros || 1);

  const handleSeleccionAsiento = (asiento) => {
    if (!asiento?.disponible) return;
    if (modoSeleccion === "aleatorio") return; // No permitir selección manual en modo aleatorio
    
    const ya = seleccionados.find((a) => a.numero === asiento.numero);
    if (ya) {
      setSeleccionados(seleccionados.filter((a) => a.numero !== asiento.numero));
    } else if (seleccionados.length < pasajeros) {
      setSeleccionados([...seleccionados, asiento]);
    }
  };

  const asignarAsientosAleatorios = () => {
    const disponibles = asientosActuales.filter(a => a.disponible && a.tipo === "estandar");
    const aleatorios = [];
    
    for (let i = 0; i < pasajeros && disponibles.length > 0; i++) {
      const idx = Math.floor(Math.random() * disponibles.length);
      const asiento = disponibles.splice(idx, 1)[0];
      aleatorios.push({
        ...asiento,
        precio: 0 // Sin cargo para asientos aleatorios
      });
    }
    
    setSeleccionados(aleatorios);
  };

  const calcularCostoAsientos = () => {
    if (modoSeleccion === "aleatorio") return 0;
    return seleccionados.reduce((total, asiento) => total + (asiento.precio || 0), 0);
  };

  const continuarSiguienteVuelo = () => {
    if (modoSeleccion === "manual" && asientosSeleccionadosIda.length !== pasajeros) {
      alert(`Debes seleccionar ${pasajeros} asiento(s)`);
      return;
    }
    
    if (modoSeleccion === "aleatorio" && asientosSeleccionadosIda.length === 0) {
      asignarAsientosAleatorios();
    }
    
    if (datosViaje?.vueloVuelta) {
      setVueloActual("vuelta");
      setModoSeleccion("manual"); // Reset para vuelta
    } else {
      continuarAPago();
    }
  };

  const continuarAPago = () => {
    // Asignar aleatorios si es necesario
    if (modoSeleccion === "aleatorio") {
      if (vueloActual === "ida" && asientosSeleccionadosIda.length === 0) {
        asignarAsientosAleatorios();
      } else if (vueloActual === "vuelta" && asientosSeleccionadosVuelta.length === 0) {
        asignarAsientosAleatorios();
      }
    }
    
    if (
      datosViaje?.vueloVuelta &&
      asientosSeleccionadosVuelta.length !== pasajeros
    ) {
      alert(`Debes seleccionar ${pasajeros} asiento(s) para la vuelta`);
      return;
    }

    const costoTotalAsientos = 
      asientosSeleccionadosIda.reduce((sum, a) => sum + (a.precio || 0), 0) +
      asientosSeleccionadosVuelta.reduce((sum, a) => sum + (a.precio || 0), 0);

    const payload = {
      ...datosViaje,
      asientosIda: asientosSeleccionadosIda,
      asientosVuelta: asientosSeleccionadosVuelta,
      costoAsientos: costoTotalAsientos,
    };

    localStorage.setItem("checkout_ready", "true");

    try {
      const vs = JSON.parse(localStorage.getItem("vueloSeleccionado") || "{}");
      localStorage.setItem(
        "vueloSeleccionado",
        JSON.stringify({
          ...vs,
          asientosIda: asientosSeleccionadosIda,
          asientosVuelta: asientosSeleccionadosVuelta,
          costoAsientos: costoTotalAsientos,
        })
      );
    } catch (e) {
      console.warn("No se pudo actualizar vueloSeleccionado:", e);
    }

    lsSet("airlink_checkout_asientos", payload);
    navigate("/pago", { state: payload, replace: true });
  };

  if (!datosViaje?.vueloIda?.idViaje) return null;
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  const vueloInfo =
    vueloActual === "ida" ? datosViaje.vueloIda : datosViaje.vueloVuelta;
  const costoActual = calcularCostoAsientos();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-purple-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">
            Selección de Asientos — {vueloActual === "ida" ? "Ida" : "Vuelta"}
          </h1>
          <p className="text-purple-100 mt-2">
            {vueloInfo?.origenCodigo} → {vueloInfo?.destinoCodigo} · Selecciona{" "}
            {pasajeros} asiento(s)
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Selector de modo */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">¿Cómo deseas elegir tus asientos?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setModoSeleccion("aleatorio");
                setSeleccionados([]);
              }}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                modoSeleccion === "aleatorio"
                  ? "border-purple-600 bg-purple-50"
                  : "border-gray-200 hover:border-purple-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-2xl">🎲</div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  modoSeleccion === "aleatorio" 
                    ? "bg-green-100 text-green-700" 
                    : "bg-gray-100 text-gray-600"
                }`}>
                  GRATIS
                </div>
              </div>
              <h4 className="font-bold text-lg mb-1">Asignación Aleatoria</h4>
              <p className="text-sm text-gray-600">
                Te asignaremos asientos automáticamente sin costo adicional
              </p>
            </button>

            <button
              onClick={() => {
                setModoSeleccion("manual");
                setSeleccionados([]);
              }}
              className={`p-6 border-2 rounded-lg text-left transition-all ${
                modoSeleccion === "manual"
                  ? "border-purple-600 bg-purple-50"
                  : "border-gray-200 hover:border-purple-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-2xl">🎯</div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  modoSeleccion === "manual" 
                    ? "bg-purple-100 text-purple-700" 
                    : "bg-gray-100 text-gray-600"
                }`}>
                  Desde ${PRECIOS_ASIENTOS.estandar.toLocaleString()}
                </div>
              </div>
              <h4 className="font-bold text-lg mb-1">Elegir Mis Asientos</h4>
              <p className="text-sm text-gray-600">
                Selecciona tus asientos preferidos (ventana, pasillo, premium, etc.)
              </p>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">
                    Asientos: {seleccionados.length}/{pasajeros}
                  </span>
                  {modoSeleccion === "manual" && (
                    <span className="text-sm text-gray-500">
                      {seleccionados.map((a) => a.numero).join(", ")}
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(seleccionados.length / pasajeros) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {modoSeleccion === "manual" ? (
                <>
                  <MapaAsientos
                    asientos={asientosActuales}
                    seleccionados={seleccionados}
                    onSelect={handleSeleccionAsiento}
                  />

                  <LeyendaAsientos />
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✈️</div>
                  <h3 className="text-xl font-bold mb-2">Asignación Automática</h3>
                  <p className="text-gray-600 mb-4">
                    Tus asientos serán asignados automáticamente al continuar
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-green-800 font-semibold">
                      🎉 Sin costo adicional
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="text-xl font-bold mb-4">Resumen</h3>

              <div className="space-y-3 mb-6">
                {seleccionados.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    {modoSeleccion === "aleatorio" 
                      ? "Asientos se asignarán automáticamente" 
                      : "Selecciona asientos"}
                  </p>
                ) : (
                  seleccionados.map((asiento, i) => (
                    <div
                      key={asiento.numero}
                      className="p-3 bg-purple-50 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <div className="font-semibold">Pasajero {i + 1}</div>
                          <div className="text-sm text-gray-600">
                            Asiento {asiento.numero}
                          </div>
                        </div>
                        {modoSeleccion === "manual" && (
                          <button
                            onClick={() => handleSeleccionAsiento(asiento)}
                            className="text-red-500 text-xl"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      {asiento.caracteristicas && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {asiento.caracteristicas.slice(0, 2).map((car, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
                            >
                              {car}
                            </span>
                          ))}
                        </div>
                      )}
                      {modoSeleccion === "manual" && asiento.precio > 0 && (
                        <div className="text-right text-sm font-semibold text-purple-600 mt-2">
                          +${asiento.precio.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Costo total */}
              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Costo asientos:</span>
                  <span className="text-xl font-bold text-purple-600">
                    {modoSeleccion === "aleatorio" || costoActual === 0
                      ? "GRATIS"
                      : `$${costoActual.toLocaleString()}`}
                  </span>
                </div>
              </div>

              {datosViaje?.vueloVuelta && (
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <div className="text-sm font-medium mb-2">
                    {vueloActual === "ida" ? "1/2 · Ida" : "2/2 · Vuelta"}
                  </div>
                  <div className="flex gap-2">
                    <div
                      className={`flex-1 h-2 rounded ${
                        vueloActual === "ida"
                          ? "bg-purple-600"
                          : "bg-purple-300"
                      }`}
                    />
                    <div
                      className={`flex-1 h-2 rounded ${
                        vueloActual === "vuelta"
                          ? "bg-purple-600"
                          : "bg-gray-200"
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {vueloActual === "ida" ? (
                  datosViaje?.vueloVuelta ? (
                    <button
                      onClick={continuarSiguienteVuelo}
                      disabled={modoSeleccion === "manual" && seleccionados.length !== pasajeros}
                      className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-all"
                    >
                      Continuar a vuelo de vuelta →
                    </button>
                  ) : (
                    <button
                      onClick={continuarAPago}
                      disabled={modoSeleccion === "manual" && seleccionados.length !== pasajeros}
                      className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-all"
                    >
                      Continuar al pago →
                    </button>
                  )
                ) : (
                  <>
                    <button
                      onClick={continuarAPago}
                      disabled={modoSeleccion === "manual" && seleccionados.length !== pasajeros}
                      className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-all"
                    >
                      Continuar al pago →
                    </button>
                    <button
                      onClick={() => {
                        setVueloActual("ida");
                        setModoSeleccion("manual");
                      }}
                      className="w-full bg-gray-100 py-3 rounded-lg hover:bg-gray-200 transition-all"
                    >
                      ← Volver a ida
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Subcomponentes ---------- */
function MapaAsientos({ asientos, seleccionados, onSelect }) {
  const LEFT = ["A", "B", "C"];
  const RIGHT = ["D", "E", "F"];

  const getAsiento = (fila, letra) => {
    const codigo = `${fila}${letra}`;
    return (
      asientos.find((a) => a.numero === codigo) || {
        numero: codigo,
        disponible: false,
        tipo: "estandar",
        precio: 0
      }
    );
  };

  const isSelected = (numero) => seleccionados.some((a) => a.numero === numero);

  const getAsientoColor = (asiento, selected) => {
    if (!asiento.disponible) return "bg-gray-300 cursor-not-allowed";
    if (selected) return "bg-purple-600 text-white scale-110 shadow-lg";
    
    switch (asiento.tipo) {
      case "premium":
        return "bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-400 hover:border-amber-500";
      case "confort":
        return "bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-400 hover:border-blue-500";
      case "salidaEmergencia":
        return "bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-400 hover:border-green-500";
      case "primeraFila":
        return "bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-400 hover:border-purple-500";
      default:
        return "bg-white border-2 border-gray-300 hover:border-purple-400";
    }
  };

  const getAsientoIcon = (tipo) => {
    switch (tipo) {
      case "premium":
        return "⭐";
      case "confort":
        return "💺";
      case "salidaEmergencia":
        return "🚪";
      case "primeraFila":
        return "1️⃣";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Cabecera de columnas */}
      <div className="flex gap-2 text-xs text-gray-500 mb-2 font-semibold">
        {LEFT.map((l) => (
          <span key={l} className="w-10 text-center">
            {l}
          </span>
        ))}
        <span className="w-8" />
        {RIGHT.map((l) => (
          <span key={l} className="w-10 text-center">
            {l}
          </span>
        ))}
      </div>

      {/* Filas de asientos */}
      {Array.from({ length: 30 }, (_, i) => i + 1).map((fila) => {
        const esPremium = fila <= 3;
        const esConfort = fila > 3 && fila <= 7;
        const esSalidaEmergencia = fila === 10 || fila === 20;
        
        return (
          <div key={fila} className="w-full">
            {/* Separador visual para secciones */}
            {(fila === 4 || fila === 8) && (
              <div className="h-4 flex items-center justify-center">
                <div className="w-full border-t-2 border-dashed border-gray-300" />
              </div>
            )}
            
            <div className="flex items-center gap-2 justify-center">
              <span className="text-xs text-gray-400 w-6 text-right font-medium">
                {fila}
              </span>

              {/* Asientos izquierda */}
              <div className="flex gap-2">
                {LEFT.map((letra) => {
                  const asiento = getAsiento(fila, letra);
                  const selected = isSelected(asiento.numero);
                  return (
                    <button
                      key={`${fila}${letra}`}
                      onClick={() => onSelect(asiento)}
                      disabled={!asiento.disponible}
                      className={`w-10 h-10 rounded text-xs font-semibold transition-all relative group ${getAsientoColor(
                        asiento,
                        selected
                      )}`}
                      title={asiento.caracteristicas?.join(", ")}
                    >
                      <div className="flex flex-col items-center justify-center">
                        {getAsientoIcon(asiento.tipo) && (
                          <span className="text-xs">{getAsientoIcon(asiento.tipo)}</span>
                        )}
                        <span className={selected ? "text-white" : "text-gray-700"}>
                          {letra}
                        </span>
                      </div>
                      
                      {/* Tooltip */}
                      {asiento.disponible && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                            <div className="font-bold">{asiento.numero}</div>
                            {asiento.caracteristicas?.map((c, i) => (
                              <div key={i}>{c}</div>
                            ))}
                            {asiento.precio > 0 && (
                              <div className="text-yellow-300 font-bold mt-1">
                                +${asiento.precio.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Pasillo */}
              <div className="w-8 flex justify-center">
                <div className="w-1 h-8 bg-gray-200 rounded" />
              </div>

              {/* Asientos derecha */}
              <div className="flex gap-2">
                {RIGHT.map((letra) => {
                  const asiento = getAsiento(fila, letra);
                  const selected = isSelected(asiento.numero);
                  return (
                    <button
                      key={`${fila}${letra}`}
                      onClick={() => onSelect(asiento)}
                      disabled={!asiento.disponible}
                      className={`w-10 h-10 rounded text-xs font-semibold transition-all relative group ${getAsientoColor(
                        asiento,
                        selected
                      )}`}
                      title={asiento.caracteristicas?.join(", ")}
                    >
                      <div className="flex flex-col items-center justify-center">
                        {getAsientoIcon(asiento.tipo) && (
                          <span className="text-xs">{getAsientoIcon(asiento.tipo)}</span>
                        )}
                        <span className={selected ? "text-white" : "text-gray-700"}>
                          {letra}
                        </span>
                      </div>
                      
                      {/* Tooltip */}
                      {asiento.disponible && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                            <div className="font-bold">{asiento.numero}</div>
                            {asiento.caracteristicas?.map((c, i) => (
                              <div key={i}>{c}</div>
                            ))}
                            {asiento.precio > 0 && (
                              <div className="text-yellow-300 font-bold mt-1">
                                +${asiento.precio.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <span className="text-xs text-gray-400 w-6 text-left font-medium">
                {fila}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeyendaAsientos() {
  return (
    <div className="mt-8 pt-6 border-t">
      <h4 className="font-semibold mb-4 text-center">Leyenda de Asientos</h4>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-white border-2 border-gray-300" />
          <div>
            <div className="font-semibold">Estándar</div>
            <div className="text-gray-600">$8.000</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-400 flex items-center justify-center">
            ⭐
          </div>
          <div>
            <div className="font-semibold">Premium</div>
            <div className="text-gray-600">$25.000</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-400 flex items-center justify-center">
            💺
          </div>
          <div>
            <div className="font-semibold">Confort+</div>
            <div className="text-gray-600">$15.000</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-400 flex items-center justify-center">
            🚪
          </div>
          <div>
            <div className="font-semibold">Salida Emerg.</div>
            <div className="text-gray-600">$12.000</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-400 flex items-center justify-center">
            1️⃣
          </div>
          <div>
            <div className="font-semibold">Primera Fila</div>
            <div className="text-gray-600">$10.000</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gray-300" />
          <div>
            <div className="font-semibold">Ocupado</div>
            <div className="text-gray-600">No disponible</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-purple-600" />
          <div>
            <div className="font-semibold">Seleccionado</div>
            <div className="text-gray-600">Tu elección</div>
          </div>
        </div>
      </div>
    </div>
  );
}