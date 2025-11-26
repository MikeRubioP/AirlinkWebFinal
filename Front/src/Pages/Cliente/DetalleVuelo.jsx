import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const BRAND = "#7C4DFF";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

/** DETALLE DE RESERVA (PROTEGIDO) */
export default function DetalleVuelo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth?.() || {};
  const [loading, setLoading] = useState(true);
  const [reserva, setReserva] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/reservas/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (alive) setReserva(data);
      } catch (e) {
        // fallback a mock local si no hay API
        if (alive) {
          const mock = MOCK_RESERVAS.find((r) => String(r.id) === String(id));
          setReserva(mock || null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, token]);

  if (loading) {
    return <div className="text-[#5c5c66]">Cargando detalle…</div>;
  }

  if (!reserva) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl border p-6 bg-white">
          <h2 className="text-xl font-bold mb-2">Reserva no encontrada</h2>
          <p className="text-[#5c5c66]">
            No pudimos encontrar la reserva solicitada.
          </p>
          <button
            onClick={() => navigate("/mis-viajes")}
            className="mt-4 px-4 py-2 rounded-xl text-white"
            style={{ background: BRAND }}
          >
            Volver a Mis viajes
          </button>
        </div>
      </div>
    );
  }

  const esPasado = new Date(reserva.salidaIso) <= new Date();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold">
            Detalle del vuelo
          </h1>
          <p className="text-[#5c5c66]">
            Reserva <span className="font-mono">{reserva.codigo}</span>
          </p>
        </div>
        <button
          onClick={() => navigate("/mis-viajes")}
          className="px-4 py-2 rounded-xl border border-[#E7E7ED] bg-white hover:bg-[#fafafe]"
        >
          ← Volver
        </button>
      </header>

      {/* Ruta y horario */}
      <section className="rounded-2xl border border-[#E7E7ED] bg-white p-6">
        <div className="text-sm text-[#5c5c66]">Vuelo {reserva.vuelo}</div>
        <div className="text-2xl font-bold mt-1">
          {reserva.origen} → {reserva.destino}
        </div>
        <div className="text-sm text-[#5c5c66] mt-1">
          {fmtFecha(reserva.salidaIso)} · {reserva.hSalida} — {reserva.hLlegada}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>{esPasado ? "Finalizado" : "Próximo"}</Badge>
          {reserva.equipaje && <Badge>Equipaje: {reserva.equipaje}</Badge>}
          {reserva.tarifa && <Badge>{reserva.tarifa}</Badge>}
        </div>
      </section>

      {/* Pasajero y código */}
      <section className="rounded-2xl border border-[#E7E7ED] bg-white p-6 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="font-semibold mb-1">Pasajero</h3>
          <p className="text-[#5c5c66]">{reserva.pasajero}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Código de reserva</h3>
          <p className="font-mono">{reserva.codigo}</p>
        </div>
      </section>

      {/* Acciones */}
      <section className="flex flex-wrap gap-3">
        {!esPasado && reserva.permiteCheckin && (
          <button
            onClick={() => navigate("/checkin")}
            className="px-5 py-3 rounded-xl text-white"
            style={{ background: BRAND }}
          >
            Hacer check-in
          </button>
        )}
        {reserva.paseUrl && (
          <a
            href={reserva.paseUrl}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-3 rounded-xl border border-[#E7E7ED] bg-white hover:bg-[#fafafe]"
          >
            Descargar pase de abordar
          </a>
        )}
      </section>
    </div>
  );
}

/* utilidades */
function Badge({ children }) {
  return (
    <span className="inline-flex text-xs font-semibold text-[#7C4DFF] bg-[#7C4DFF]/10 rounded-full px-2 py-0.5">
      {children}
    </span>
  );
}
function fmtFecha(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-CL", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/* mock local – mismo formato que MisViajes */
const MOCK_RESERVAS = [
  {
    id: 1,
    codigo: "ABCD12",
    pasajero: "Juan Pérez",
    vuelo: "AL 348",
    origen: "SCL",
    destino: "LIM",
    salidaIso: addDaysISO(3),
    hSalida: "08:30",
    hLlegada: "10:40",
    permiteCheckin: true,
    equipaje: "1× mano",
    tarifa: "Standard",
    paseUrl: null,
  },
  {
    id: 2,
    codigo: "ZX98QW",
    pasajero: "Juan Pérez",
    vuelo: "AL 912",
    origen: "LIM",
    destino: "UIO",
    salidaIso: addDaysISO(-15),
    hSalida: "12:10",
    hLlegada: "14:25",
    permiteCheckin: false,
    equipaje: "1× mano, 1× bodega",
    tarifa: "Flex",
    paseUrl: "#",
  },
];
function addDaysISO(delta) {
  const d = new Date();
  d.setDate(d.getDate() + delta);
  return d.toISOString();
}
