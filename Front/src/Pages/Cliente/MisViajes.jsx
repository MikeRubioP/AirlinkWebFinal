import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import QrButton from "../../Components/QrButton";

const BRAND = "#7C4DFF";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

/** LISTA DE VIAJES (PROTEGIDA - USA TABLA USUARIO) */
export default function MisViajes() {
  const { user, token } = useAuth?.() || {};
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [reservas, setReservas] = useState([]);

  // UI
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("todos"); // todos | proximos | pasados

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔍 MIS VIAJES - Intentando obtener reservas');
        console.log('Usuario:', user);
        console.log('Token:', token ? 'Sí' : 'No');
        console.log('Email del usuario:', user?.email);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // ✅ PRIORIDAD 1: Usar usuario autenticado (desde AuthContext)
        if (user?.email) {
          console.log('✅ Usuario autenticado encontrado:', user.email);
          
          const res = await fetch(
            `${API_URL}/api/reservas/mias?email=${encodeURIComponent(user.email)}`,
            {
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            }
          );

          if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
          }

          const data = await res.json();
          
          if (alive) {
            setReservas(Array.isArray(data) ? data : []);
            console.log(`✅ ${data.length} reservas obtenidas desde BD`);
          }
          
          return; // Salir si se usó usuario autenticado
        }

        // ✅ PRIORIDAD 2: Si NO hay usuario autenticado, redirigir a login
        console.log('❌ No hay usuario autenticado');
        setErr("Debes iniciar sesión para ver tus viajes.");
        setReservas([]);
        
        // Redirigir a login después de 2 segundos
        setTimeout(() => {
          navigate('/login');
        }, 2000);

      } catch (e) {
        if (alive) {
          console.error("❌ Error al obtener reservas:", e);
          setErr(`Error al cargar tus viajes: ${e.message}`);
          setReservas([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user, token, navigate]);

  // Filtrar reservas
  const reservasFiltradas = useMemo(() => {
    if (!reservas || reservas.length === 0) return [];

    let filtered = reservas;

    // Por query
    if (q.trim()) {
      const lower = q.toLowerCase();
      filtered = filtered.filter((r) => {
        const txt = [
          r.codigo || "",
          r.pasajero || "",
          r.origen || "",
          r.destino || "",
        ]
          .join(" ")
          .toLowerCase();
        return txt.includes(lower);
      });
    }

    // Por estado (próximos/pasados)
    if (estado !== "todos") {
      const ahora = new Date();
      filtered = filtered.filter((r) => {
        const salida = new Date(r.salidaIso);
        if (estado === "proximos") {
          return salida >= ahora;
        } else {
          return salida < ahora;
        }
      });
    }

    return filtered;
  }, [reservas, q, estado]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Cargando tus viajes...</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{err}</p>
          {!user && (
            <button
              onClick={() => navigate('/login')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Ir a Iniciar Sesión
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis viajes</h1>
          <p className="text-gray-600">
            Consulta tus reservas, realiza check-in y descarga pases de abordar.
          </p>
          {user && (
            <p className="text-sm text-purple-600 mt-2">
              Sesión iniciada como: <strong>{user.email}</strong>
            </p>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setEstado("todos")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  estado === "todos"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setEstado("proximos")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  estado === "proximos"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Próximos
              </button>
              <button
                onClick={() => setEstado("pasados")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  estado === "pasados"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pasados
              </button>
            </div>

            {/* Buscador */}
            <div className="flex-1">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por código, ciudad o pasajero..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Lista de reservas */}
        {reservasFiltradas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {q.trim() || estado !== "todos" ? "No se encontraron viajes" : "Aún no tienes viajes"}
            </h3>
            <p className="text-gray-600 mb-6">
              {q.trim() || estado !== "todos"
                ? "Prueba con otros criterios de búsqueda"
                : "Cuando reserves, aparecerán aquí para que gestiones tu experiencia."}
            </p>
            {!q.trim() && estado === "todos" && (
              <button
                onClick={() => navigate("/vuelos")}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Explorar destinos
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {reservasFiltradas.map((r) => {
              const salida = new Date(r.salidaIso);
              const ahora = new Date();
              const isPasado = salida < ahora;

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{r.vuelo}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isPasado
                                ? "bg-gray-100 text-gray-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {isPasado ? "Finalizado" : "Próximo"}
                          </span>
                          {r.tarifa && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {r.tarifa}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <span className="font-semibold text-gray-900">{r.origen}</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <span className="font-semibold text-gray-900">{r.destino}</span>
                        </div>

                        <p className="text-sm text-gray-600">
                          {salida.toLocaleDateString("es-CL", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          · {r.hSalida}
                        </p>

                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            Código: <span className="font-mono font-semibold text-gray-900">{r.codigo}</span>
                          </span>
                          <span className="text-gray-600">
                            Pasajero: <span className="font-semibold text-gray-900">{r.pasajero}</span>
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        {r.montoTotal && (
                          <p className="text-2xl font-bold text-purple-600">
                            {new Intl.NumberFormat("es-CL", {
                              style: "currency",
                              currency: "CLP",
                              minimumFractionDigits: 0,
                            }).format(r.montoTotal)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 pt-4 border-t">
                      <button
                        onClick={() => navigate(`/mis-viajes/${r.id}`)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                      >
                        Ver detalle
                      </button>

                      <QrButton codigo={r.codigo} />

                      {r.permiteCheckin && !isPasado && (
                        <button
                          onClick={() => navigate(`/check-in/${r.codigo}`)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                          Check-in
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}