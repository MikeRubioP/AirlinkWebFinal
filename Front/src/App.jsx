// src/App.jsx
import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";

/* Páginas públicas (carpeta Usuario) */
import Home from "./Pages/Usuario/Home";
import Vuelos from "./Pages/Usuario/Vuelos";
import Cupones from "./Pages/Usuario/Cupones";
import Contacto from "./Pages/Usuario/Contacto";
import SobreNosotros from "./Pages/Usuario/SobreNosotros";

/* Flujo de cliente */
import MisViajes from "./Pages/Cliente/MisViajes";
import CheckIn from "./Pages/Cliente/CheckIn";
import MiCuenta from "./Pages/Cliente/Cuenta";

/* Flujo de vuelos */
import { VueloProvider } from "./Pages/Vuelos/context/VueloContext";
import BuscarVuelos from "./Pages/Vuelos/BuscarVuelos";
import SeleccionVueloVuelta from "./Pages/Vuelos/SeleccionVueloVuelta";
import SeleccionAsientos from "./Pages/Vuelos/SeleccionAsientos";
import DetalleViaje from "./Pages/Vuelos/DetalleViaje";

/* Pago */
import Pago from "./Pages/Pago/Pago";
import PagoExitoso from "./Pages/Pago/PagoExitoso";

/* Guards */
import {
  RequireSearch,
  RequireFlightOut,
  RequireReturnIfRoundTrip,
  RequireCheckoutReady,
  // RequirePaymentDone ya no se usa - se eliminó de /pago-exitoso
} from "./Components/Guards";

export default function App() {
  return (
    <AuthProvider>
      <VueloProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />

          <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
            <Suspense fallback={<div>Cargando...</div>}>
              <Routes>
                {/* ===== Público (carpeta Usuario) ===== */}
                <Route path="/" element={<Home />} />
                <Route path="/vuelos" element={<Vuelos />} />
                <Route path="/cupones" element={<Cupones />} />
                <Route path="/contacto" element={<Contacto />} />
                <Route path="/sobre-nosotros" element={<SobreNosotros />} />

                {/* ===== Búsqueda de vuelos ===== */}
                <Route
                  path="/vuelos/buscar"
                  element={
                    <RequireSearch redirectTo="/">
                      <BuscarVuelos />
                    </RequireSearch>
                  }
                />

                {/* No permitir seleccionar asiento sin haber elegido un vuelo de ida (y tarifa) */}
                <Route
                  path="/vuelos/seleccion-asiento"
                  element={
                    <RequireFlightOut redirectTo="/">
                      <SeleccionAsientos />
                    </RequireFlightOut>
                  }
                />

                {/* No permitir ir a seleccionar vuelta sin haber elegido ida primero */}
                <Route
                  path="/vuelos/vuelta"
                  element={
                    <RequireFlightOut redirectTo="/">
                      <SeleccionVueloVuelta />
                    </RequireFlightOut>
                  }
                />

                {/* Detalle: requiere ida (y, si es RT, también vuelta/ tarifa de vuelta) */}
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

                {/* Pago: asegura que todo el flujo previo esté listo */}
                <Route
                  path="/pago"
                  element={
                    <RequireFlightOut redirectTo="/">
                      <RequireReturnIfRoundTrip redirectTo="/">
                        <RequireCheckoutReady redirectTo="/">
                          <Pago />
                        </RequireCheckoutReady>
                      </RequireReturnIfRoundTrip>
                    </RequireFlightOut>
                  }
                />

                <Route path="/pago-exitoso" element={<PagoExitoso />} />

                {/* Cliente autenticado */}
                <Route path="/mis-viajes" element={<MisViajes />} />
                <Route path="/checkin" element={<CheckIn />} />
                <Route path="/mi-cuenta" element={<MiCuenta />} />
              </Routes>
            </Suspense>
          </main>

          <Footer />
        </div>
      </VueloProvider>
    </AuthProvider>
  );
}