import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';

// Páginas Públicas (están en Pages/Usuario/)
import Home from './Pages/Usuario/Home';
import Vuelos from './Pages/Usuario/Vuelos';
import Contacto from './Pages/Usuario/Contacto';
import SobreNosotros from './Pages/Usuario/SobreNosotros';
import Cupones from './Pages/Usuario/Cupones';

// Páginas de Vuelos (están en Pages/Vuelos/)
import BuscarVuelos from './Pages/Vuelos/BuscarVuelos';
import DetalleViaje from './Pages/Vuelos/DetalleViaje';
import SeleccionAsientos from './Pages/Vuelos/SeleccionAsientos';
import SeleccionVueloVuelta from './Pages/Vuelos/SeleccionVueloVuelta';

// Páginas de Pago (están en Pages/Pago/)
import Pago from './Pages/Pago/Pago';
import PagoExitoso from './Pages/Pago/PagoExitoso';

// Páginas de Cliente (están en Pages/Cliente/)
import MisViajes from './Pages/Cliente/MisViajes';
import DetalleVuelo from './Pages/Cliente/DetalleVuelo';
import Cuenta from './Pages/Cliente/Cuenta';
import CheckIn from './Pages/Cliente/CheckIn'; // ✅ TU NOMBRE EXACTO

function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        
        <main className="flex-grow">
          <Routes>
            {/* ==================== RUTAS PÚBLICAS ==================== */}
            <Route path="/" element={<Home />} />
            <Route path="/vuelos" element={<Vuelos />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/sobre-nosotros" element={<SobreNosotros />} />
            <Route path="/cupones" element={<Cupones />} />

            {/* ==================== RUTAS DE VUELOS ==================== */}
            <Route path="/vuelos/buscar" element={<BuscarVuelos />} />
            <Route path="/buscar-vuelos" element={<BuscarVuelos />} />
            <Route path="/vuelos/detalle" element={<DetalleViaje />} />
            <Route path="/vuelos/detalleviaje" element={<DetalleViaje />} />
            <Route path="/vuelos/asientos" element={<SeleccionAsientos />} />
            <Route path="/vuelos/seleccion-asiento" element={<SeleccionAsientos />} /> {/* ✅ AGREGADA */}
            <Route path="/vuelos/seleccion-asientos" element={<SeleccionAsientos />} /> {/* ✅ AGREGADA */}
            <Route path="/vuelos/vuelta" element={<SeleccionVueloVuelta />} />

            {/* ==================== RUTAS DE PAGO ==================== */}
            <Route path="/pago" element={<Pago />} />
            <Route path="/pago-exitoso" element={<PagoExitoso />} />

            {/* ==================== RUTAS DE CLIENTE ==================== */}
            <Route path="/mis-viajes" element={<MisViajes />} />
            <Route path="/mis-viajes/:id" element={<DetalleVuelo />} /> {/* ✅ DETALLE */}
            <Route path="/cuenta" element={<Cuenta />} />
            <Route path="/check-in" element={<CheckIn />} />
            <Route path="/check-in/:codigo" element={<CheckIn />} />
            <Route path="/checkin" element={<CheckIn />} /> {/* ✅ Sin guion */}
            <Route path="/checkin/:codigo" element={<CheckIn />} /> {/* ✅ Sin guion */}

            {/* ==================== RUTA 404 ==================== */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  );
}

// Componente 404
function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border p-8 text-center">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Página no encontrada</h2>
        <p className="text-gray-600 mb-6">
          La página que buscas no existe o fue movida.
        </p>
        <a
          href="/"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}

export default App;