// Components/FlightCard.jsx
import { fmtCLP } from "@/utils/currency";

export default function FlightCard({ data, selected, onChoose, onOpenTarifas }) {
  const { salida, llegada, duracion, escala = "Directo", precioDesde } = data;

  return (
    <article className={`rounded-2xl border p-4 md:p-5 bg-white transition
      ${selected ? "border-purple-500 ring-2 ring-purple-200" : "border-gray-200 hover:border-gray-300"}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <div className="text-xs text-gray-500">Salida — Llegada</div>
          <div className="text-lg font-bold">{salida} — {llegada}</div>
          <div className="text-sm text-gray-600">{duracion} · {escala}</div>
        </div>

        {/* Precio desde tarifas */}
        <div className="text-right">
          <div className="text-xs text-gray-500">Desde</div>
          <div className="text-xl font-bold">{fmtCLP(precioDesde)}</div>
          <button
            className="mt-2 px-4 py-2 rounded-xl bg-purple-600 text-white"
            onClick={() => onOpenTarifas(data)}  // abre el modal de tarifas
          >
            Ver tarifas
          </button>
        </div>
      </div>
    </article>
  );
}
