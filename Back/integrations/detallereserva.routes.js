import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

const CLP = (n) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(Number(n || 0));

export default function DetalleReserva() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth?.() || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reserva, setReserva] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        console.log("🔍 Cargando detalle de reserva:", id);

        const res = await fetch(`${API_URL}/api/reservas/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        console.log("✅ Detalle obtenido:", data);
        setReserva(data);
      } catch (e) {
        console.error("❌ Error al cargar detalle:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </div>
          </div>
          <p className="text-gray-700 font-medium text-lg">
            Cargando tu reserva...
          </p>
          <p className="text-gray-500 text-sm mt-1">Un momento por favor</p>
        </div>
      </div>
    );
  }

  if (error || !reserva) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-red-100 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Oops, algo salió mal
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "No se pudo cargar la información de la reserva"}
          </p>
          <button
            onClick={() => navigate("/mis-viajes")}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Volver a Mis Viajes
          </button>
        </div>
      </div>
    );
  }

  const salida = new Date(reserva.salidaIso);
  const llegada = new Date(reserva.llegadaIso || reserva.salidaIso);
  const isPasado = salida < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header con gradiente */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/mis-viajes")}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-6 transition-colors duration-200 group"
          >
            <svg
              className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">Volver a Mis Viajes</span>
          </button>

          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl shadow-2xl p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  <h1 className="text-3xl md:text-4xl font-bold">Tu Viaje</h1>
                </div>
                <p className="text-purple-100 text-sm md:text-base">
                  Código de reserva:{" "}
                  <span className="font-mono font-semibold">
                    {reserva.codigo}
                  </span>
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold shadow-lg ${
                  isPasado
                    ? "bg-white/20 text-white backdrop-blur-sm"
                    : reserva.estado === "confirmada"
                    ? "bg-green-500 text-white"
                    : "bg-yellow-400 text-gray-900"
                }`}
              >
                {isPasado ? (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Finalizado
                  </>
                ) : reserva.estado === "confirmada" ? (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Confirmado
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Pendiente
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Información del Vuelo - Diseño mejorado */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-5 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </div>
              Información del Vuelo
            </h2>
          </div>

          <div className="p-8">
            {/* Ruta visual mejorada */}
            <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    Origen
                  </p>
                  <p className="text-4xl font-bold text-purple-600">
                    {reserva.origen}
                  </p>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Salida</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {salida.toLocaleDateString("es-CL", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {reserva.hSalida ||
                        salida.toLocaleTimeString("es-CL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 mx-8">
                  <div className="relative">
                    <svg
                      className="w-16 h-16 text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex-1 text-center">
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    Destino
                  </p>
                  <p className="text-4xl font-bold text-blue-600">
                    {reserva.destino}
                  </p>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Llegada</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {llegada.toLocaleDateString("es-CL", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {reserva.hLlegada ||
                        llegada.toLocaleTimeString("es-CL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-5">
                <p className="text-sm font-medium text-gray-500 mb-2">
                  Número de Vuelo
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {reserva.vuelo || "AL " + reserva.id}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <p className="text-sm font-medium text-gray-500 mb-2">
                  Fecha Completa de Salida
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {salida.toLocaleDateString("es-CL", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Pasajero */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-5 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              Información del Pasajero
            </h2>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {reserva.pasajero.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Nombre completo
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {reserva.pasajero}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desglose de Precio */}
        {reserva.desglose && reserva.desglose.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-5 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                Desglose de Precio
              </h2>
            </div>

            <div className="p-8">
              <div className="space-y-4">
                {reserva.desglose.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                          item.tipo === "descuento"
                            ? "bg-green-100"
                            : "bg-purple-100"
                        }`}
                      >
                        {item.tipo === "vuelo_ida" && "✈️"}
                        {item.tipo === "vuelo_vuelta" && "✈️"}
                        {item.tipo === "asientos" && "💺"}
                        {item.tipo === "bus" && "🚌"}
                        {item.tipo === "descuento" && "🎟️"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.descripcion}
                        </p>
                        {item.metadata && (
                          <p className="text-sm text-gray-500">
                            {item.tipo === "vuelo_ida" && "Vuelo de ida"}
                            {item.tipo === "vuelo_vuelta" && "Vuelo de vuelta"}
                            {item.tipo === "asientos" &&
                              "Asientos seleccionados"}
                            {item.tipo === "bus" && "Transporte terrestre"}
                            {item.tipo === "descuento" &&
                              "Cupón de descuento aplicado"}
                          </p>
                        )}
                      </div>
                    </div>
                    <p
                      className={`text-xl font-bold ${
                        item.monto < 0 ? "text-green-600" : "text-gray-900"
                      }`}
                    >
                      {item.monto < 0 ? "-" : ""}
                      {CLP(Math.abs(item.monto))}
                    </p>
                  </div>
                ))}

                <div className="border-t-2 border-gray-200 pt-5 mt-5">
                  <div className="flex justify-between items-center bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                    <p className="text-2xl font-bold text-gray-900">Total</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {CLP(reserva.montoTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Total si no hay desglose */}
        {(!reserva.desglose || reserva.desglose.length === 0) &&
          reserva.montoTotal && (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-6">
              <div className="flex justify-between items-center bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                <p className="text-2xl font-bold text-gray-900">Total Pagado</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {CLP(reserva.montoTotal)}
                </p>
              </div>
            </div>
          )}

        {/* Acciones - Mejoradas */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate(`/check-in/${reserva.codigo}`)}
              disabled={isPasado || reserva.estado !== "confirmada"}
              className="group relative bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Hacer Check-in
            </button>

            <button
              onClick={() => window.print()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Imprimir
            </button>

            <button
              onClick={() => {
                alert("Funcionalidad de descarga en desarrollo");
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Descargar Pase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
