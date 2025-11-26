// src/Pages/Pago/PagoExitoso.jsx
import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { clearFlowState } from '../../utils/flowStorage';

export default function PagoExitoso() {
  const [searchParams] = useSearchParams();
  const reservaId = searchParams.get('reservaId');

  useEffect(() => {
    // 1) Limpia TODO el estado del flujo (búsqueda, selección, asientos, pago, etc.)
    clearFlowState();

    // 2) (Opcional) Notificar al backend que la reserva quedó pagada
    // if (reservaId) {
    //   fetch(`/api/reservas/${reservaId}/confirmar`, { method: 'POST' })
    //     .catch(() => {/* manejar error si quieres mostrar toast */});
    // }
  }, [reservaId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <h1 className="text-2xl font-bold text-green-600 mb-2">
          ¡Pago exitoso!
        </h1>

        <p className="text-gray-700 mb-6">
          {reservaId
            ? <>Tu reserva <span className="font-semibold">#{reservaId}</span> fue confirmada.</>
            : <>Tu pago fue confirmado. (No se recibió <code>reservaId</code> en la URL)</>
          }
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            to="/mis-viajes"
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Ver mis viajes
          </Link>
          <Link
            to="/vuelos"
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Buscar otro vuelo
          </Link>
        </div>
      </div>
    </div>
  );
}
