// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';

// ==================== GUARDS ====================
import {
  RequireAuth,
  RequireSearch,
  RequireFlightOut,
  RequireReturnIfRoundTrip,
  RequireCheckoutReady,
  RequirePaymentDone,
} from './Components/Guards';

// ==================== PÁGINAS PÚBLICAS ====================
import Home from './Pages/Usuario/Home';
import Vuelos from './Pages/Usuario/Vuelos';
import Contacto from './Pages/Usuario/Contacto';
import SobreNosotros from './Pages/Usuario/SobreNosotros';
import Cupones from './Pages/Usuario/Cupones';

// ==================== PÁGINAS DE VUELOS ====================
import BuscarVuelos from './Pages/Vuelos/BuscarVuelos';
import DetalleViaje from './Pages/Vuelos/DetalleViaje';
import SeleccionAsientos from './Pages/Vuelos/SeleccionAsientos';
import SeleccionVueloVuelta from './Pages/Vuelos/SeleccionVueloVuelta';

// ==================== PÁGINAS DE PAGO ====================
import Pago from './Pages/Pago/Pago';
import PagoExitoso from './Pages/Pago/PagoExitoso';

// ==================== PÁGINAS DE CLIENTE ====================
import MisViajes from './Pages/Cliente/MisViajes';
import DetalleVuelo from './Pages/Cliente/DetalleVuelo';
import Cuenta from './Pages/Cliente/Cuenta';
import CheckIn from './Pages/Cliente/CheckIn';

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

            {/* ==================== RUTAS DE BÚSQUEDA DE VUELOS ==================== */}
            {/* Búsqueda de vuelos - Limpia estados zombis si no hay búsqueda previa */}
            <Route 
              path="/vuelos/buscar" 
              element={
                <RequireSearch>
                  <BuscarVuelos />
                </RequireSearch>
              } 
            />
            <Route 
              path="/buscar-vuelos" 
              element={
                <RequireSearch>
                  <BuscarVuelos />
                </RequireSearch>
              } 
            />

            {/* ==================== SELECCIÓN DE VUELO DE VUELTA ==================== */}
            {/* Requiere: vuelo de ida seleccionado */}
            <Route 
              path="/vuelos/vuelta" 
              element={
                <RequireFlightOut redirectTo="/">
                  <SeleccionVueloVuelta />
                </RequireFlightOut>
              } 
            />

            {/* ==================== SELECCIÓN DE ASIENTOS ==================== */}
            {/* Requiere: vuelo de ida seleccionado */}
            <Route 
              path="/vuelos/asientos" 
              element={
                <RequireFlightOut redirectTo="/">
                  <SeleccionAsientos />
                </RequireFlightOut>
              } 
            />
            <Route 
              path="/vuelos/seleccion-asiento" 
              element={
                <RequireFlightOut redirectTo="/">
                  <SeleccionAsientos />
                </RequireFlightOut>
              } 
            />
            <Route 
              path="/vuelos/seleccion-asientos" 
              element={
                <RequireFlightOut redirectTo="/">
                  <SeleccionAsientos />
                </RequireFlightOut>
              } 
            />

            {/* ==================== DETALLE DEL VIAJE ==================== */}
            {/* Requiere: vuelo de ida + (si es RT) vuelo de vuelta */}
            <Route 
              path="/vuelos/detalle" 
              element={
                <RequireFlightOut redirectTo="/">
                  <RequireReturnIfRoundTrip redirectTo="/">
                    <DetalleViaje />
                  </RequireReturnIfRoundTrip>
                </RequireFlightOut>
              } 
            />
            <Route 
              path="/vuelos/detalleviaje" 
              element={
                <RequireFlightOut redirectTo="/">
                  <RequireReturnIfRoundTrip redirectTo="/">
                    <DetalleViaje />
                  </RequireReturnIfRoundTrip>
                </RequireFlightOut>
              } 
            />

            {/* ==================== PROCESO DE PAGO ==================== */}
            {/* 🔐 NUEVO: Requiere autenticación + vuelo de ida + (si es RT) vuelo de vuelta + asientos seleccionados */}
            <Route 
              path="/pago" 
              element={
                <RequireAuth redirectTo="/">
                  <RequireFlightOut redirectTo="/">
                    <RequireReturnIfRoundTrip redirectTo="/">
                      <RequireCheckoutReady redirectTo="/">
                        <Pago />
                      </RequireCheckoutReady>
                    </RequireReturnIfRoundTrip>
                  </RequireFlightOut>
                </RequireAuth>
              } 
            />

            {/* ==================== CONFIRMACIÓN DE PAGO ==================== */}
            {/* 🔐 NUEVO: Requiere autenticación + todo el flujo anterior + pago completado */}
            <Route 
              path="/pago-exitoso" 
              element={
                <RequireAuth redirectTo="/">
                  <RequireFlightOut redirectTo="/">
                    <RequireReturnIfRoundTrip redirectTo="/">
                      <RequirePaymentDone redirectTo="/">
                        <PagoExitoso />
                      </RequirePaymentDone>
                    </RequireReturnIfRoundTrip>
                  </RequireFlightOut>
                </RequireAuth>
              } 
            />

            {/* ==================== RUTAS DE CLIENTE ==================== */}
            {/* 🔐 NUEVO: Requiere autenticación para acceder */}
            <Route 
              path="/mis-viajes" 
              element={
                <RequireAuth redirectTo="/">
                  <MisViajes />
                </RequireAuth>
              } 
            />
            <Route 
              path="/mis-viajes/:id" 
              element={
                <RequireAuth redirectTo="/">
                  <DetalleVuelo />
                </RequireAuth>
              } 
            />
            <Route 
              path="/cuenta" 
              element={
                <RequireAuth redirectTo="/">
                  <Cuenta />
                </RequireAuth>
              } 
            />
            <Route path="/check-in" element={<CheckIn />} />
            <Route path="/check-in/:codigo" element={<CheckIn />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/checkin/:codigo" element={<CheckIn />} />

            {/* ==================== RUTA 404 ==================== */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  );
}

// ==================== COMPONENTE 404 ====================
function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border p-8 text-center">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Página no encontrada</h2>
        <p className="text-gray-600 mb-6">
          La página que buscas no existe o fue movida.
        </p>
        
          href="/"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        
          Volver al inicio
        
      </div>
    </div>
  );
}

export default App;