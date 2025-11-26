// Components/TarifaSelector.jsx
import { useEffect, useState } from "react";
import { fmtCLP } from "@/utils/currency";

export default function TarifaSelector({ idViaje, open, onClose, onChoose }) {
  const [tarifas, setTarifas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !idViaje) return;
    setLoading(true);
    fetch(`/api/vuelos/viajes/${idViaje}/tarifas`)
      .then(r => r.json())
      .then(setTarifas)
      .finally(() => setLoading(false));
  }, [open, idViaje]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-5xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Tarifas disponibles</h3>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>

        {loading ? (
          <div className="p-8 text-center">Cargando tarifas…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {tarifas.map(t => (
              <article key={t.idTarifa} className="border rounded-2xl p-5 flex flex-col">
                <h4 className="font-semibold text-lg">{t.nombreTarifa}</h4>

                {/* Aquí puedes renderizar bullets fijos por idTarifa/nombre */}
                <ul className="mt-3 text-sm text-gray-600 space-y-1">
                  {t.nombreTarifa === "Light" && (
                    <>
                      <li>Bolso o mochila</li>
                      <li>Maleta pequeña 12 kg</li>
                      <li>Cambio con cargo + diferencia</li>
                    </>
                  )}
                  {t.nombreTarifa === "Standard" && (
                    <>
                      <li>Bolso o mochila</li>
                      <li>Maleta pequeña 12 kg</li>
                      <li>1 equipaje bodega 23 kg</li>
                    </>
                  )}
                  {t.nombreTarifa === "Full" && (
                    <>
                      <li>Bolso o mochila</li>
                      <li>Maleta pequeña 12 kg</li>
                      <li>1 equipaje bodega 23 kg</li>
                      <li>Selección asiento estándar</li>
                    </>
                  )}
                  {t.nombreTarifa?.includes("Premium") && (
                    <>
                      <li>2 equipajes de bodega 23 kg</li>
                      <li>Asiento cama</li>
                      <li>Embarque prioritario</li>
                    </>
                  )}
                </ul>

                <div className="mt-4 text-2xl font-bold">{fmtCLP(t.precio)}</div>
                <button
                  className="mt-4 w-full rounded-xl bg-purple-600 text-white py-2"
                  onClick={() => onChoose(t)}  // devuelve la tarifa seleccionada
                >
                  {t.nombreTarifa === "Light" ? "Continuar con Light" : "Elegir"}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
