// src/Pages/Vuelos/components/FlightResultCard.jsx
// Este componente dibuja UNA opción de vuelo con:
// - hora de salida / llegada / duración / precio
// - "Operado por AirLink", "Directo"
// - si está expandido => muestra las tarifas (Standard / Full)
// Recibe props desde SeleccionIda / SeleccionVuelta

export default function FlightResultCard({ vuelo, expanded, onExpand, onChooseFare }) {
  // vuelo: objeto con info del vuelo (horario, precio, fares...)
  // expanded: booleano -> ¿estamos desplegando las tarifas?
  // onExpand: () => void  (para abrir/cerrar)
  // onChooseFare: (fare) => void (cuando el usuario elige una tarifa)

  return (
    <article
      className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden"
    >
      {/* Encabezado del vuelo */}
      <button
        className="w-full text-left p-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
        onClick={onExpand}
      >
        {/* Izquierda: salida, etiquetas, operador */}
        <div className="flex-1 min-w-0">
          {/* Horario y aeropuerto origen */}
          <div className="text-lg font-semibold text-gray-900 leading-tight flex gap-2 items-baseline">
            <span>{vuelo.salidaHora}</span>
            <span className="text-sm font-normal text-gray-600">{vuelo.origenCodigo}</span>
          </div>

          {/* Etiquetas (tipo de tarifa base / vuelo directo / operador) */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            {/* tipo tarifa base, ej Standard/Flex */}
            <span className="inline-block bg-purple-100 text-purple-700 text-xs font-medium px-2 py-1 rounded">
              {vuelo.tarifaBase || "Standard"}
            </span>

            <span className="text-purple-600 font-medium hover:underline cursor-pointer">
              {vuelo.tipo || "Directo"}
            </span>

            <span className="text-gray-600">
              Operado por{" "}
              <span className="text-purple-700 font-medium hover:underline cursor-pointer">
                {vuelo.operador || "AirLink"}
              </span>
            </span>
          </div>
        </div>

        {/* Centro: duración y flechita */}
        <div className="hidden md:flex flex-col items-center flex-none w-48 text-sm text-gray-500">
          <div className="text-center">
            <div className="font-medium text-gray-700">Duración {vuelo.duracion}</div>
            <div className="text-xs text-gray-400 mt-1 flex flex-col items-center">
              {/* Línea + icono avión estilizado */}
              <span className="relative w-full flex items-center justify-center">
                <span className="block w-full border-t border-gray-300"></span>
                <span className="absolute -top-2 text-gray-400 text-xs">✈</span>
              </span>
            </div>
          </div>
        </div>

        {/* Derecha: llegada y precio */}
        <div className="flex-none text-right">
          <div className="text-lg font-semibold text-gray-900 leading-tight flex flex-col items-end">
            <span>{vuelo.llegadaHora}</span>
            <span className="text-sm font-normal text-gray-600">{vuelo.destinoCodigo}</span>
          </div>

          <div className="text-right mt-3 text-sm">
            <div className="text-gray-500 leading-tight">Por persona</div>
            <div className="text-purple-700 font-semibold">
              {vuelo.moneda || "CLP"} {vuelo.precioBase || "$0"}
            </div>
          </div>
        </div>
      </button>

      {/* Línea separadora */}
      {expanded && <div className="border-t border-gray-200" />}

      {/* Tarifas (solo cuando está expandido) */}
      {expanded && (
        <div className="p-4 grid md:grid-cols-2 gap-4">
          {vuelo.fares && vuelo.fares.length > 0 ? (
            vuelo.fares.map((fare) => (
              <div
                key={fare.id}
                className="rounded-lg border border-gray-300 shadow-sm relative flex flex-col"
              >
                {/* Cabecera de la tarjeta de tarifa */}
                <div className="flex items-start gap-2 p-3">
                  {/* Badge con color según la tarifa */}
                  <span
                    className={`inline-block text-xs font-semibold px-2 py-1 rounded text-white ${
                      fare.colorClass || "bg-purple-600"
                    }`}
                  >
                    {fare.nombre}
                  </span>
                </div>

                {/* Lista de beneficios */}
                <ul className="px-4 pb-3 text-sm text-gray-700 space-y-2">
                  {fare.beneficios.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 text-base leading-none">●</span>
                      <span className="leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>

                {/* Precio + botón Elegir */}
                <div className="flex flex-col-reverse md:flex-row md:items-end md:justify-between border-t border-gray-200 p-4 gap-4">
                  <div className="text-sm text-gray-700 leading-tight">
                    <div className="font-semibold text-gray-900">
                      {vuelo.moneda || "CLP"} {vuelo.precioBase || "$0"}
                      {fare.extra && (
                        <>
                          <br />
                          <span className="text-purple-700 font-semibold">
                            + {fare.extra}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Por pasajero
                      <br />
                      Incluye tasas e impuestos
                    </div>
                  </div>

                  <button
                    onClick={() => onChooseFare(fare)}
                    className="flex-none bg-white text-purple-700 border border-gray-300 rounded-xl px-5 py-2 text-sm font-medium shadow-sm hover:bg-purple-50 hover:border-purple-400 hover:text-purple-800 transition"
                  >
                    Elegir
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 text-sm col-span-2">
              No hay tarifas disponibles para este vuelo.
            </div>
          )}
        </div>
      )}
    </article>
  );
}
