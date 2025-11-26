import { NavLink, useLocation } from "react-router-dom";

const STEPS = [
  { path: "/vuelos/buscar", label: "Buscar" },
  { path: "/vuelos/seleccionar-ida", label: "Ida" },
  { path: "/vuelos/seleccionar-vuelta", label: "Vuelta" },
  { path: "/vuelos/resumen", label: "Resumen" },
];

export default function Steps() {
  const { pathname } = useLocation();
  const current = Math.max(0, STEPS.findIndex(s => pathname.startsWith(s.path)));

  return (
    <ol className="flex items-center flex-wrap gap-4">
      {STEPS.map((s, i) => (
        <li key={s.path} className="flex items-center gap-2">
          <span className={[
            "w-7 h-7 rounded-full flex items-center justify-center border text-sm",
            i <= current ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-300"
          ].join(" ")}>
            {i + 1}
          </span>
          <NavLink to={s.path} className="text-sm hover:underline">{s.label}</NavLink>
          {i < STEPS.length - 1 && <span className="w-8 h-px bg-gray-300 mx-2" />}
        </li>
      ))}
    </ol>
  );
}
