// Vuelos/context/VueloContext.jsx
import { createContext, useContext, useState } from "react";

const VueloCtx = createContext();
export const useVuelo = () => useContext(VueloCtx);

export function VueloProvider({ children }) {
  const [form, setForm] = useState({
    origen: "",
    destino: "",
    fechaIda: "",
    fechaVuelta: "",
    clase: "",
    pasajeros: 1,             // <-- por si necesitas multiplicar precio
    tarifaSeleccionada: null, // "Light" | "Standard" | "Full" | etc
    precioTarifa: 0,          // número en CLP
  });

  return (
    <VueloCtx.Provider value={{ form, setForm }}>
      {children}
    </VueloCtx.Provider>
  );
}
