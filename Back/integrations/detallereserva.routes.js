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
  const { id } = useParams(); // ID de la reserva desde la URL
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

        console.log('🔍 Cargando detalle de reserva:', id);

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
        console.log('✅ Detalle obtenido:', data);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Cargando detalle de la reserva...</p>
        </div>
      </div>
    );
  }

  if (error || !reserva) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || "No se pudo cargar la reserva"}</p>
          <button
            onClick={() => navigate('/mis-viajes')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/mis-viajes')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Mis Viajes
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detalle de Reserva</h1>
              <p className="text-gray-600 mt-1">Código: {reserva.codigo}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                isPasado
                  ? "bg-gray-100 text-gray-700"
                  : reserva.estado === 'confirmada'
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {isPasado ? "Finalizado" : reserva.estado === 'confirmada' ? 'Confirmado' : 'Pendiente'}
            </span>
          </div>
        </div>

        {/* Información del Vuelo */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Información del Vuelo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vuelo */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Vuelo</p>
              <p className="text-lg font-bold text-gray-900">{reserva.vuelo || 'AL ' + reserva.id}</p>
            </div>

            {/* Ruta */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Ruta</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-gray-900">{reserva.origen}</p>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <p className="text-lg font-bold text-gray-900">{reserva.destino}</p>
              </div>
            </div>

            {/* Fecha y Hora de Salida */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Salida</p>
              <p className="text-lg font-semibold text-gray-900">
                {salida.toLocaleDateString("es-CL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-purple-600 font-bold">{reserva.hSalida || salida.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            {/* Fecha y Hora de Llegada */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Llegada</p>
              <p className="text-lg font-semibold text-gray-900">
                {llegada.toLocaleDateString("es-CL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-purple-600 font-bold">{reserva.hLlegada || llegada.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>

        {/* Información del Pasajero */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Información del Pasajero</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nombre completo</p>
              <p className="text-lg font-semibold text-gray-900">{reserva.pasajero}</p>
            </div>
          </div>
        </div>

        {/* Desglose de Precio */}
        {reserva.desglose && reserva.desglose.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Desglose de Precio</h2>
            
            <div className="space-y-3">
              {reserva.desglose.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{item.descripcion}</p>
                    {item.metadata && (
                      <p className="text-sm text-gray-500">
                        {item.tipo === 'vuelo_ida' && '✈️ Vuelo de ida'}
                        {item.tipo === 'vuelo_vuelta' && '✈️ Vuelo de vuelta'}
                        {item.tipo === 'asientos' && '💺 Asientos seleccionados'}
                        {item.tipo === 'bus' && '🚌 Transporte terrestre'}
                        {item.tipo === 'descuento' && '🎟️ Cupón de descuento'}
                      </p>
                    )}
                  </div>
                  <p className={`text-lg font-bold ${item.monto < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {CLP(item.monto)}
                  </p>
                </div>
              ))}
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <p className="text-xl font-bold text-gray-900">Total</p>
                  <p className="text-2xl font-bold text-purple-600">{CLP(reserva.montoTotal)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Total si no hay desglose */}
        {(!reserva.desglose || reserva.desglose.length === 0) && reserva.montoTotal && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <div className="flex justify-between items-center">
              <p className="text-xl font-bold text-gray-900">Total Pagado</p>
              <p className="text-3xl font-bold text-purple-600">{CLP(reserva.montoTotal)}</p>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate(`/check-in/${reserva.codigo}`)}
              disabled={isPasado || reserva.estado !== 'confirmada'}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold"
            >
              Hacer Check-in
            </button>
            
            <button
              onClick={() => window.print()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold"
            >
              Imprimir
            </button>
            
            <button
              onClick={() => {
                // Generar PDF o descargar pase de abordar
                alert('Funcionalidad de descarga en desarrollo');
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold"
            >
              Descargar Pase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}