import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const BRAND = "#7C4DFF";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

const CLP = (n) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(Number(n || 0));

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
        console.log('🔍 Cargando detalle de reserva:', id);
        
        const res = await fetch(`${API_URL}/api/reservas/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        console.log('✅ Detalle obtenido:', data);
        
        if (alive) setReserva(data);
      } catch (e) {
        console.error('❌ Error al cargar detalle:', e);
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
    return (
      <div className="max-w-5xl mx-auto py-12 px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-[#5c5c66]">Cargando detalle de la reserva...</p>
        </div>
      </div>
    );
  }

  if (!reserva) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
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
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
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
          <Badge color={esPasado ? "gray" : "green"}>
            {esPasado ? "Finalizado" : "Próximo"}
          </Badge>
          {reserva.equipaje && <Badge>{reserva.equipaje}</Badge>}
          {reserva.tarifa && <Badge>{reserva.tarifa}</Badge>}
          {reserva.estado && (
            <Badge color={reserva.estado === 'confirmada' ? 'green' : 'yellow'}>
              {reserva.estado === 'confirmada' ? 'Confirmado' : 'Pendiente'}
            </Badge>
          )}
        </div>
      </section>

      {/* Pasajero y código */}
      <section className="rounded-2xl border border-[#E7E7ED] bg-white p-6 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="font-semibold mb-1">Pasajero</h3>
          <p className="text-[#5c5c66]">{reserva.pasajero}</p>
          {reserva.documento && (
            <p className="text-sm text-[#5c5c66] mt-1">
              Documento: {reserva.documento}
            </p>
          )}
        </div>
        <div>
          <h3 className="font-semibold mb-1">Código de reserva</h3>
          <p className="font-mono">{reserva.codigo}</p>
        </div>
      </section>

      {/* ✅ DESGLOSE DE PRECIO (NUEVO) */}
      {reserva.desglose && reserva.desglose.length > 0 && (
        <section className="rounded-2xl border border-[#E7E7ED] bg-white p-6">
          <h3 className="font-semibold text-lg mb-4">Desglose de precio</h3>
          
          <div className="space-y-3">
            {reserva.desglose.map((item, index) => (
              <div key={index} className="flex justify-between items-start py-2 border-b border-[#E7E7ED] last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.descripcion}</p>
                  {item.tipo && (
                    <p className="text-sm text-[#5c5c66] mt-0.5">
                      {item.tipo === 'vuelo_ida' && '✈️ Vuelo de ida'}
                      {item.tipo === 'vuelo_vuelta' && '✈️ Vuelo de vuelta'}
                      {item.tipo === 'asientos' && '💺 Asientos seleccionados'}
                      {item.tipo === 'bus' && '🚌 Transporte terrestre'}
                      {item.tipo === 'descuento' && '🎟️ Cupón de descuento'}
                    </p>
                  )}
                </div>
                <p className={`text-lg font-bold ml-4 ${item.monto < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {CLP(item.monto)}
                </p>
              </div>
            ))}
            
            {/* Total */}
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300">
              <p className="text-xl font-bold">Total</p>
              <p className="text-2xl font-bold" style={{ color: BRAND }}>
                {CLP(reserva.montoTotal)}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Total si no hay desglose */}
      {(!reserva.desglose || reserva.desglose.length === 0) && reserva.montoTotal && (
        <section className="rounded-2xl border border-[#E7E7ED] bg-white p-6">
          <div className="flex justify-between items-center">
            <p className="text-xl font-bold">Total pagado</p>
            <p className="text-3xl font-bold" style={{ color: BRAND }}>
              {CLP(reserva.montoTotal)}
            </p>
          </div>
        </section>
      )}

      {/* ✅ ASIENTOS (si existen) */}
      {reserva.asientos && reserva.asientos.length > 0 && (
        <section className="rounded-2xl border border-[#E7E7ED] bg-white p-6">
          <h3 className="font-semibold text-lg mb-3">Asientos seleccionados</h3>
          <div className="flex flex-wrap gap-2">
            {reserva.asientos.map((asiento, i) => (
              <div key={i} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-mono font-semibold">
                {asiento.numero || asiento}
                {asiento.precio && asiento.precio > 0 && (
                  <span className="ml-2 text-xs">({CLP(asiento.precio)})</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ✅ CUPÓN (si existe) */}
      {reserva.cupon && (
        <section className="rounded-2xl border border-[#E7E7ED] bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🎟️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Cupón aplicado</h3>
              <p className="text-[#5c5c66] mt-1">
                Código: <span className="font-mono font-semibold">{reserva.cupon.codigo}</span>
              </p>
              <p className="text-green-600 font-bold mt-1">
                Descuento: {CLP(reserva.cupon.descuento)}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Acciones */}
      <section className="flex flex-wrap gap-3">
        {!esPasado && reserva.permiteCheckin && (
          <button
            onClick={() => navigate(`/check-in/${reserva.codigo}`)}
            className="px-5 py-3 rounded-xl text-white font-semibold"
            style={{ background: BRAND }}
          >
            Hacer check-in
          </button>
        )}
        
        <button
          onClick={() => window.print()}
          className="px-5 py-3 rounded-xl border border-[#E7E7ED] bg-white hover:bg-[#fafafe] font-semibold"
        >
          Imprimir
        </button>
        
        {reserva.paseUrl ? (
          <a
            href={reserva.paseUrl}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-3 rounded-xl border border-[#E7E7ED] bg-white hover:bg-[#fafafe] font-semibold"
          >
            Descargar pase de abordar
          </a>
        ) : (
          <button
            onClick={() => alert('La descarga de pase de abordar estará disponible próximamente')}
            className="px-5 py-3 rounded-xl border border-[#E7E7ED] bg-white hover:bg-[#fafafe] font-semibold"
          >
            Descargar pase de abordar
          </button>
        )}
      </section>

      {/* Información adicional */}
      <section className="rounded-2xl border border-[#E7E7ED] bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="text-xl">ℹ️</div>
          <div className="text-sm text-[#5c5c66]">
            <p className="font-semibold text-gray-900 mb-1">Información importante</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Llega al aeropuerto con 2 horas de anticipación para vuelos nacionales</li>
              <li>Ten tu documento de identidad a mano</li>
              <li>Realiza el check-in online para ahorrar tiempo</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

/* Utilidades */
function Badge({ children, color = "purple" }) {
  const colors = {
    purple: "text-[#7C4DFF] bg-[#7C4DFF]/10",
    green: "text-green-700 bg-green-100",
    yellow: "text-yellow-700 bg-yellow-100",
    gray: "text-gray-700 bg-gray-100",
  };

  return (
    <span className={`inline-flex text-xs font-semibold rounded-full px-2 py-0.5 ${colors[color] || colors.purple}`}>
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

/* Mock local – mismo formato que MisViajes */
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
    montoTotal: 89990,
    estado: "confirmada",
    desglose: [
      {
        tipo: "vuelo_ida",
        descripcion: "Vuelo (ida) – SCL → LIM · Standard",
        monto: 89990
      }
    ]
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
    montoTotal: 124990,
    estado: "confirmada",
    desglose: [
      {
        tipo: "vuelo_ida",
        descripcion: "Vuelo (ida) – LIM → UIO · Flex",
        monto: 99990
      },
      {
        tipo: "asientos",
        descripcion: "Asientos seleccionados: 12A (premium)",
        monto: 25000
      }
    ],
    asientos: [
      { numero: "12A", precio: 25000 }
    ]
  },
];

function addDaysISO(delta) {
  const d = new Date();
  d.setDate(d.getDate() + delta);
  return d.toISOString();
}