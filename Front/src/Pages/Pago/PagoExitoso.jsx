import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, AlertCircle, Plane, Home } from 'lucide-react';

export default function PagoExitoso() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const reservaId = searchParams.get('reservaId');
  const status = searchParams.get('status') || 'success';
  const sessionId = searchParams.get('session_id');

  const [loading, setLoading] = useState(true);
  const [reservaData, setReservaData] = useState(null);

  useEffect(() => {
    // Limpiar el localStorage del flujo de reserva
    const clearFlowState = () => {
      try {
        // Limpiar todos los datos del flujo de reserva
        const keysToRemove = [
          'searchState',
          'vueloSeleccionado',
          'selectedFlight',
          'flight',
          'airlink_viaje',
          'airlink_tarifa',
          'airlink_tarifa_vuelta',
          'selectedFare',
          'selectedFareReturn',
          'tarifaSeleccionada',
          'fare',
          'airlink_datos_viaje',
          'airlink_checkout_asientos',
          'airlink_buses',
          'airlink_skip_bus',
          'checkout_ready',
        ];

        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });

        console.log('✅ Estado del flujo limpiado correctamente');
      } catch (error) {
        console.error('Error al limpiar el estado:', error);
      }
    };

    // Ejecutar limpieza
    clearFlowState();

    // Simular carga de datos de la reserva (opcional)
    const loadReservaData = async () => {
      if (reservaId && status === 'success') {
        try {
          // Aquí podrías llamar a tu API para obtener los detalles de la reserva
          // const response = await fetch(`http://localhost:5174/api/reservas/${reservaId}`);
          // const data = await response.json();
          // setReservaData(data);

          // Por ahora, simulamos datos
          setReservaData({
            codigo: `RES-${reservaId}`,
            pasajero: 'Usuario',
          });
        } catch (error) {
          console.error('Error al cargar datos de la reserva:', error);
        }
      }
      setLoading(false);
    };

    loadReservaData();
  }, [reservaId, status]);

  // Función para copiar código de reserva
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Aquí podrías agregar un toast o notificación
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  // Configuración según el estado del pago
  const statusConfig = {
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      title: '¡Pago Exitoso!',
      message: 'Tu reserva ha sido confirmada correctamente.',
      showReservaInfo: true,
    },
    pending: {
      icon: Clock,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      title: 'Pago Pendiente',
      message: 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.',
      showReservaInfo: true,
    },
    failure: {
      icon: XCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      title: 'Pago Rechazado',
      message: 'No se pudo procesar tu pago. Por favor, intenta nuevamente.',
      showReservaInfo: false,
    },
    cancel: {
      icon: AlertCircle,
      iconColor: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      title: 'Pago Cancelado',
      message: 'Has cancelado el proceso de pago. Tu reserva no fue confirmada.',
      showReservaInfo: false,
    },
  };

  const config = statusConfig[status] || statusConfig.success;
  const Icon = config.icon;

  return (
    <div className={`min-h-screen flex items-center justify-center ${config.bgColor} p-4`}>
      <div className="max-w-2xl w-full">
        {/* Card principal */}
        <div className={`bg-white rounded-2xl shadow-lg border-2 ${config.borderColor} overflow-hidden`}>
          {/* Header con ícono */}
          <div className={`${config.bgColor} border-b ${config.borderColor} p-8 text-center`}>
            <div className="flex justify-center mb-4">
              <div className={`w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg`}>
                <Icon className={`w-12 h-12 ${config.iconColor}`} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {config.title}
            </h1>
            <p className="text-gray-600 text-lg">
              {config.message}
            </p>
          </div>

          {/* Información de la reserva */}
          {config.showReservaInfo && reservaId && (
            <div className="p-8 space-y-6">
              {/* Código de reserva */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
                <div className="text-center">
                  <p className="text-sm text-purple-600 font-semibold mb-2">
                    CÓDIGO DE RESERVA
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-3xl font-bold text-purple-900 tracking-wide">
                      {reservaData?.codigo || `#${reservaId}`}
                    </p>
                    <button
                      onClick={() => copyToClipboard(reservaData?.codigo || reservaId)}
                      className="p-2 hover:bg-purple-200 rounded-lg transition-colors"
                      title="Copiar código"
                    >
                      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-purple-600 mt-2">
                    Guarda este código para consultar tu reserva
                  </p>
                </div>
              </div>

              {/* Información adicional */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">¿Qué sigue?</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>✓ Recibirás un email de confirmación en los próximos minutos</li>
                      <li>✓ Revisa los detalles de tu viaje en "Mis Viajes"</li>
                      <li>✓ Recuerda llegar al aeropuerto con 2 horas de anticipación</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Datos de la sesión (solo para debug) */}
              {sessionId && (
                <div className="text-xs text-gray-400 text-center">
                  Session ID: {sessionId.substring(0, 20)}...
                </div>
              )}
            </div>
          )}

          {/* Mensaje para pagos fallidos/cancelados */}
          {!config.showReservaInfo && (
            <div className="p-8">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-gray-600 mb-4">
                  {status === 'cancel'
                    ? 'No se realizó ningún cargo a tu tarjeta.'
                    : 'Por favor, verifica tus datos de pago e intenta nuevamente.'
                  }
                </p>
                {status === 'failure' && (
                  <button
                    onClick={() => navigate('/pago')}
                    className="text-purple-600 font-semibold hover:text-purple-700"
                  >
                    ← Volver a intentar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {config.showReservaInfo ? (
                <>
                  <Link
                    to="/mis-viajes"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
                  >
                    <Plane className="w-5 h-5" />
                    Ver mis viajes
                  </Link>
                  <Link
                    to="/"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <Home className="w-5 h-5" />
                    Volver al inicio
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/vuelos"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
                  >
                    <Plane className="w-5 h-5" />
                    Buscar vuelos
                  </Link>
                  <Link
                    to="/"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <Home className="w-5 h-5" />
                    Volver al inicio
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer informativo */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>¿Necesitas ayuda? Contacta a nuestro equipo de soporte</p>
          <p className="mt-1">
            <a href="mailto:soporte@airlink.com" className="text-purple-600 hover:text-purple-700 font-semibold">
              soporte@airlink.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}