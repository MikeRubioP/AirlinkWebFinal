// AirLink-Frontend/src/Components/AirportAutocomplete.jsx
import { useEffect, useRef, useState } from "react";
import { searchAirports } from "../services/airports";

export default function AirportAutocomplete({
  label = "Aeropuerto",
  value,              // string que se mostrará en el input (ej: "Santiago (SCL)")
  code,               // el IATA actual (ej: "SCL")
  onChange,           // (obj) => void  { iata, name, city, country, icao, lat, lon }
  placeholder = "Busca por IATA, ciudad o nombre…",
}) {
  const [q, setQ] = useState(value || "");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const tRef = useRef(null);

  // sincroniza input cuando cambian props externas
  useEffect(() => {
    if (!value && code) setQ(code);
    else if (value) setQ(value);
  }, [value, code]);

  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    clearTimeout(tRef.current);
    tRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await searchAirports(q, 12);
        setItems(data);
        setOpen(true);
      } catch {
        setItems([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 250); // debounce
    return () => clearTimeout(tRef.current);
  }, [q]);

  return (
    <div className="relative">
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => items.length && setOpen(true)}
        placeholder={placeholder}
        className="h-12 w-full bg-white border border-gray-300 rounded-xl px-3 text-sm text-gray-700 focus:ring-2 focus:ring-purple-400 outline-none"
        autoComplete="off"
      />
      {open && (
        <ul
          className="absolute z-30 mt-1 w-full bg-white border rounded-xl shadow max-h-64 overflow-auto"
          onMouseLeave={() => setOpen(false)}
        >
          {loading && <li className="px-3 py-2 text-sm text-gray-500">Cargando…</li>}
          {!loading && items.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">Sin resultados</li>
          )}
          {items.map((a) => (
            <li
              key={a.id}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
              onMouseDown={() => {
                const label = `${a.city ? a.city + " " : ""}(${a.iata})`;
                setQ(label);
                setOpen(false);
                onChange?.(a);
              }}
            >
              <div className="text-sm">
                <strong>{a.iata}</strong> — {a.name}
              </div>
              <div className="text-xs text-gray-500">
                {a.city}{a.city && a.country ? ", " : ""}{a.country} · {a.icao}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
