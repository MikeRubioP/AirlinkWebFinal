// src/Pages/Pago/Pago.jsx
import React, { useState, useEffect, useMemo } from "react";
import { CreditCard, Building2, Wallet, AlertCircle, Clock, MapPin, Info } from "lucide-react";
import axios from "axios";

/* =========================
   Helpers
========================= */
const CLP = (n) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(Number(n || 0));

const safeParse = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k));
  } catch {
    return null;
  }
};

const pickFirst = (...vals) => vals.find(Boolean) || null;

// 🎭 DETECTOR DE DATOS MOCK (solo para IDs que empiezan con "mock-")
const detectarMock = (vuelo) => {
  if (!vuelo) return false;
  const id = String(vuelo.idViaje || vuelo.id || '');
  return id.startsWith('mock-');
};

// 🎭 GENERADOR DE BUSES MOCK
const generarBusesMock = (origen, fecha, horaLlegada) => {
  const empresas = [
    { nombre: 'Turbus', color: 'bg-blue-600' },
    { nombre: 'Pullman Bus', color: 'bg-green-600' },
    { nombre: 'Buses JAC', color: 'bg-red-600' },
    { nombre: 'Condor Bus', color: 'bg-yellow-600' },
  ];

  const destinos = ['Santiago', 'Valparaíso', 'Viña del Mar', 'Concepción', 'La Serena'];
  const numBuses = Math.floor(Math.random() * 3) + 2;
  const buses = [];

  const [horaVuelo, minVuelo] = (horaLlegada || '14:00').split(':').map(Number);
  const minutosLlegada = horaVuelo * 60 + minVuelo;

  for (let i = 0; i < numBuses; i++) {
    const empresa = empresas[i % empresas.length];
    const destino = destinos[i % destinos.length];
    
    const minutosEspera = 90 + Math.floor(Math.random() * 150);
    const minutosSalida = minutosLlegada + minutosEspera;
    const horaSalida = `${String(Math.floor(minutosSalida / 60) % 24).padStart(2, '0')}:${String(minutosSalida % 60).padStart(2, '0')}`;
    
    const duracionMin = 180 + Math.floor(Math.random() * 120);
    const minutosLlegadaBus = minutosSalida + duracionMin;
    const horaLlegadaBus = `${String(Math.floor(minutosLlegadaBus / 60) % 24).padStart(2, '0')}:${String(minutosLlegadaBus % 60).padStart(2, '0')}`;

    const precioBase = 8000 + Math.floor(Math.random() * 12000);

    buses.push({
      idViaje: `mock-bus-${i}-${Date.now()}`,
      empresa: empresa.nombre,
      color: empresa.color,
      ciudadOrigen: origen,
      ciudadDestino: destino,
      origen: origen,
      destino: destino,
      fechaSalida: fecha,
      horaSalida: horaSalida,
      horaLlegada: horaLlegadaBus,
      duracion: `${Math.floor(duracionMin / 60)}h ${duracionMin % 60}min`,
      precioAdulto: precioBase,
      cupos: Math.floor(Math.random() * 30) + 10,
      tiempoEspera: `${Math.floor(minutosEspera / 60)}h ${minutosEspera % 60}min después`,
      __mock: true
    });
  }

  return buses.sort((a, b) => a.horaSalida.localeCompare(b.horaSalida));
};

/* =========================
   Componente
========================= */
export default function Pago() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Paso 1: datos de pasajero
  const [passengerData, setPassengerData] = useState({
    nombre: "",
    apellido: "",
    fechaNacimiento: "",
    genero: "",
    tipoDocumento: "DNI",
    numeroDocumento: "",
    correo: "",
    telefono: "",
  });

  // --------- Lecturas base del flujo ----------
  const searchState = useMemo(() => safeParse("searchState") || {}, []);
  const isRT = searchState?.tipoViaje === "RT";

  // Fuente de verdad para vuelo + tarifa (IDA) con fallbacks
  const vueloSeleccionado = useMemo(
    () =>
      pickFirst(
        safeParse("airlink_checkout_asientos")?.vueloIda,
        safeParse("vueloSeleccionado")?.vueloIda,
        safeParse("airlink_viaje"),
        safeParse("selectedFlight"),
        safeParse("flight")
      ),
    []
  );

  const tarifaSeleccionada = useMemo(
    () =>
      pickFirst(
        safeParse("airlink_checkout_asientos")?.tarifaIda,
        safeParse("vueloSeleccionado")?.tarifaIda,
        safeParse("airlink_tarifa"),
        safeParse("selectedFare"),
        safeParse("tarifaSeleccionada"),
        safeParse("fare")
      ),
    []
  );

  // --------- Lecturas para VUELTA (solo RT) ----------
  const vueloSeleccionadoVuelta = useMemo(
    () =>
      pickFirst(
        safeParse("airlink_checkout_asientos")?.vueloVuelta,
        safeParse("vueloSeleccionado")?.vueloVuelta
      ),
    []
  );

  const tarifaSeleccionadaVuelta = useMemo(
    () =>
      pickFirst(
        safeParse("airlink_checkout_asientos")?.tarifaVuelta,
        safeParse("vueloSeleccionado")?.tarifaVuelta,
        safeParse("airlink_tarifa_vuelta"),
        safeParse("selectedFareReturn")
      ),
    []
  );

  // --------- Normalización IDA ----------
  const vueloNorm = useMemo(() => {
    const v = vueloSeleccionado;
    if (!v) return null;
    return {
      idViaje: v.idViaje ?? v.id ?? null,
      empresa: v.empresa ?? v.airline ?? "—",
      origen: v.origenCodigo ?? v.origen ?? v.from ?? "—",
      destino: v.destinoCodigo ?? v.destino ?? v.to ?? "—",
      horaSalida: v.horaSalida || "",
      horaLlegada: v.horaLlegada || "",
      fechaSalida: v.fechaSalida || v.salida?.split(" ")[0] || "",
      duracion: v.duracion || "",
    };
  }, [vueloSeleccionado]);

  const tarifaNorm = useMemo(() => {
    const t = tarifaSeleccionada;
    if (!t) return null;
    return {
      nombreTarifa: t.nombreTarifa ?? t.nombre ?? "Tarifa",
      precio: Number(t.precio || 0),
      moneda: t.moneda || "CLP",
      cupos: t.cupos ?? null,
    };
  }, [tarifaSeleccionada]);

  // --------- Normalización VUELTA ----------
  const vueloNormVuelta = useMemo(() => {
    const v = vueloSeleccionadoVuelta;
    if (!v) return null;
    return {
      idViaje: v.idViaje ?? v.id ?? null,
      empresa: v.empresa ?? v.airline ?? "—",
      origen: v.origenCodigo ?? v.origen ?? v.from ?? "—",
      destino: v.destinoCodigo ?? v.destino ?? v.to ?? "—",
      horaSalida: v.horaSalida || "",
      horaLlegada: v.horaLlegada || "",
      fechaSalida: v.fechaSalida || v.salida?.split(" ")[0] || "",
      duracion: v.duracion || "",
    };
  }, [vueloSeleccionadoVuelta]);

  const tarifaNormVuelta = useMemo(() => {
    const t = tarifaSeleccionadaVuelta;
    if (!t) return null;
    return {
      nombreTarifa: t.nombreTarifa ?? t.nombre ?? "Tarifa",
      precio: Number(t.precio || 0),
      moneda: t.moneda || "CLP",
      cupos: t.cupos ?? null,
    };
  }, [tarifaSeleccionadaVuelta]);

  // Total del/los vuelo(s)
  const totalVuelo =
    Number(tarifaNorm?.precio || 0) +
    (isRT ? Number(tarifaNormVuelta?.precio || 0) : 0);

  // Paso 2: buses - NUEVO: Estado para detalles del bus
  const [selectedBuses, setSelectedBuses] = useState([]);
  const [availableBuses, setAvailableBuses] = useState([]);
  const [skipBus, setSkipBus] = useState(Boolean(safeParse("airlink_skip_bus")));
  const [busDetalleSeleccionado, setBusDetalleSeleccionado] = useState(null);
  const [loadingBusDetalle, setLoadingBusDetalle] = useState(false);
  const [mostrarDetalleModal, setMostrarDetalleModal] = useState(false);

  useEffect(() => {
    if (currentStep === 2 && vueloNorm) {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        origenCodigo: vueloNorm.destino,
        fecha: vueloNorm.fechaSalida,
      });
      if (vueloNorm.horaLlegada) params.append("horaLlegadaVuelo", vueloNorm.horaLlegada);

      axios
        .get(`http://localhost:5174/buses/disponibles?${params}`)
        .then((res) => {
          setAvailableBuses(res.data || []);
          if (!res.data || res.data.length === 0) {
            setError(
              `No hay buses programados desde ${vueloNorm.destino} después de tu llegada. ` +
              `Puedes continuar sin seleccionar bus.`
            );
          }
        })
        .catch((err) => {
          console.error("Error al cargar buses, usando alternativas:", err);
          // Fallback a buses mock solo si falla la API
          const busesMock = generarBusesMock(
            vueloNorm.destino,
            vueloNorm.fechaSalida,
            vueloNorm.horaLlegada
          );
          setAvailableBuses(busesMock);
          setError("Mostrando opciones de transporte disponibles.");
        })
        .finally(() => setLoading(false));
    }
  }, [currentStep, vueloNorm]);

  // NUEVO: Función para cargar detalles completos de un bus
  const cargarDetalleBus = async (idViaje) => {
    try {
      setLoadingBusDetalle(true);
      console.log('🔍 Cargando detalles del bus:', idViaje);
      const response = await axios.get(`http://localhost:5174/buses/detalle/${idViaje}`);
      setBusDetalleSeleccionado(response.data);
      setMostrarDetalleModal(true);
      console.log('✅ Detalles del bus cargados:', response.data);
      return response.data;
    } catch (err) {
      console.error('❌ Error al cargar detalles del bus:', err);
      setError('No se pudieron cargar los detalles del bus');
      return null;
    } finally {
      setLoadingBusDetalle(false);
    }
  };

  const toggleSkipBus = () => {
    setSkipBus((prev) => {
      const next = !prev;
      localStorage.setItem("airlink_skip_bus", JSON.stringify(next));
      if (next) setSelectedBuses([]);
      return next;
    });
  };

  const handleBusSelection = (bus) => {
    if (skipBus) return;
    setSelectedBuses((prev) => {
      const exists = prev.find((b) => b.idViaje === bus.idViaje);
      if (exists) {
        const n = prev.filter((b) => b.idViaje !== bus.idViaje);
        localStorage.setItem("airlink_buses", JSON.stringify(n));
        return n;
      }
      const n = [...prev, bus];
      localStorage.setItem("airlink_buses", JSON.stringify(n));
      return n;
    });
  };

  const totalBuses = useMemo(
    () => selectedBuses.reduce((s, b) => s + Number(b.precioAdulto || 0), 0),
    [selectedBuses]
  );

  // Paso 3: método de pago
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("stripe");

  const paymentMethods = [
    { id: "stripe", name: "Stripe", description: "Pago seguro con tarjeta", icon: <CreditCard className="w-6 h-6" />, color: "bg-purple-600" },
    { id: "mercadopago", name: "Mercado Pago", description: "Múltiples opciones de pago", icon: <Wallet className="w-6 h-6" />, color: "bg-blue-400" },
    { id: "paypal", name: "PayPal", description: "Pago internacional seguro", icon: <Building2 className="w-6 h-6" />, color: "bg-sky-400" },
  ];

  /* =========================
     Validaciones & flujo
  ========================= */
  const handlePassengerInputChange = (e) => {
    const { name, value } = e.target;
    setPassengerData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validatePassengerForm = () => {
    const required = ["nombre", "apellido", "fechaNacimiento", "genero", "numeroDocumento", "correo", "telefono"];
    const empty = required.filter((f) => !String(passengerData[f] || "").trim());
    if (empty.length > 0) {
      setError(`Por favor completa: ${empty.join(", ")}`);
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(passengerData.correo)) {
      setError("Correo electrónico no válido");
      return false;
    }
    if (!vueloNorm || !tarifaNorm) {
      setError("No se encontró la selección de vuelo de ida. Vuelve a Detalle y elige una tarifa.");
      return false;
    }
    if (isRT && (!vueloNormVuelta || !tarifaNormVuelta)) {
      setError("Seleccionaste ida y vuelta, pero falta la información de la vuelta.");
      return false;
    }
    return true;
  };

  const handleContinueFromPassenger = () => {
    if (!validatePassengerForm()) return;
    setCurrentStep(2);
  };

  const handleContinueFromBuses = () => {
    if (!skipBus && selectedBuses.length === 0) {
      setError("Selecciona un bus o marca 'No necesito transporte terrestre'.");
      return;
    }
    setCurrentStep(3);
    setError("");
  };

  /* =========================
     Resumen (ida + vuelta + buses)
  ========================= */
  const total = useMemo(() => totalVuelo + (skipBus ? 0 : totalBuses), [totalVuelo, totalBuses, skipBus]);

  const resumen = useMemo(() => {
    return {
      vueloIda: vueloNorm
        ? {
            idViaje: vueloNorm.idViaje,
            empresa: vueloNorm.empresa,
            origen: vueloNorm.origen,
            destino: vueloNorm.destino,
            horaSalida: vueloNorm.horaSalida,
            horaLlegada: vueloNorm.horaLlegada,
            tarifaNombre: tarifaNorm?.nombreTarifa || "Tarifa",
            precio: Number(tarifaNorm?.precio || 0),
          }
        : null,
      vueloVuelta:
        isRT && vueloNormVuelta
          ? {
              idViaje: vueloNormVuelta.idViaje,
              empresa: vueloNormVuelta.empresa,
              origen: vueloNormVuelta.origen,
              destino: vueloNormVuelta.destino,
              horaSalida: vueloNormVuelta.horaSalida,
              horaLlegada: vueloNormVuelta.horaLlegada,
              tarifaNombre: tarifaNormVuelta?.nombreTarifa || "Tarifa",
              precio: Number(tarifaNormVuelta?.precio || 0),
            }
          : null,
      buses: skipBus ? [] : selectedBuses,
      total: totalVuelo + (skipBus ? 0 : totalBuses),
      pasajero: passengerData,
      isRT,
    };
  }, [
    vueloNorm,
    tarifaNorm,
    vueloNormVuelta,
    tarifaNormVuelta,
    totalVuelo,
    selectedBuses,
    skipBus,
    totalBuses,
    passengerData,
    isRT,
  ]);

  /* =========================
     Guard visual si no hay vuelo
  ========================= */
  if (!vueloNorm) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border rounded-2xl p-6 text-center">
          <h2 className="text-lg font-bold mb-2">No hay selección de vuelo</h2>
          <p className="text-sm text-gray-600 mb-4">
            Vuelve al detalle para elegir la tarifa y continuar con el pago.
          </p>
          <a href="/vuelos/detalleviaje" className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg">
            Ir a Detalle del Viaje
          </a>
        </div>
      </div>
    );
  }

  /* =========================
     Pago - Envía vueloIda y vueloVuelta por separado
  ========================= */
  const handlePayment = async () => {
    try {
      if (!resumen.vueloIda) {
        setError("No se encontró la información del vuelo de ida. Vuelve a la selección de tarifa.");
        return;
      }
      if (resumen.isRT && !resumen.vueloVuelta) {
        setError("Falta la información del vuelo de vuelta.");
        return;
      }

      setLoading(true);
      setError("");

      // Preparar vuelo de ida
      const vueloIdaData = {
        idViaje: resumen.vueloIda.idViaje || resumen.vueloIda.id,
        empresa: resumen.vueloIda.empresa || "Aerolínea",
        origen: resumen.vueloIda.origen,
        destino: resumen.vueloIda.destino,
        horaSalida: resumen.vueloIda.horaSalida || "00:00",
        horaLlegada: resumen.vueloIda.horaLlegada || "00:00",
        tarifaNombre: resumen.vueloIda.tarifaNombre || "Standard",
        precio: Number(resumen.vueloIda.precio) || 0,
        tipo: 'ida',
      };

      // Preparar vuelo de vuelta (si existe)
      let vueloVueltaData = null;
      if (resumen.isRT && resumen.vueloVuelta) {
        vueloVueltaData = {
          idViaje: resumen.vueloVuelta.idViaje || resumen.vueloVuelta.id,
          empresa: resumen.vueloVuelta.empresa || "Aerolínea",
          origen: resumen.vueloVuelta.origen,
          destino: resumen.vueloVuelta.destino,
          horaSalida: resumen.vueloVuelta.horaSalida || "00:00",
          horaLlegada: resumen.vueloVuelta.horaLlegada || "00:00",
          tarifaNombre: resumen.vueloVuelta.tarifaNombre || "Standard",
          precio: Number(resumen.vueloVuelta.precio) || 0,
          tipo: 'vuelta',
        };
      }

      // Preparar buses
      const busesData = (resumen.buses || []).map(bus => ({
        id: bus.idViaje || bus.id,
        idViaje: bus.idViaje || bus.id,
        empresa: bus.empresa || "Bus",
        origen: bus.ciudadOrigen || bus.origen,
        destino: bus.ciudadDestino || bus.destino,
        horaSalida: bus.horaSalida || "00:00",
        horaLlegada: bus.horaLlegada || "00:00",
        precioAdulto: Number(bus.precioAdulto) || 0,
      }));

      // Construir payload con vueloIda y vueloVuelta separados
      const payload = {
        pasajero: {
          nombre: resumen.pasajero.nombre,
          apellido: resumen.pasajero.apellido,
          correo: resumen.pasajero.correo,
          telefono: resumen.pasajero.telefono || "",
          fechaNacimiento: resumen.pasajero.fechaNacimiento || null,
          genero: resumen.pasajero.genero || "Otro",
          tipoDocumento: resumen.pasajero.tipoDocumento || "DNI",
          numeroDocumento: resumen.pasajero.numeroDocumento,
        },
        vueloIda: vueloIdaData,
        vueloVuelta: vueloVueltaData,  // null si no hay vuelta
        buses: busesData,
        total: Number(resumen.total) || 0,
        metodoPago: selectedPaymentMethod,
      };

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 Enviando payload al backend:');
      console.log('Pasajero:', payload.pasajero.nombre, payload.pasajero.apellido);
      console.log('Vuelo Ida:', payload.vueloIda?.idViaje, `(${payload.vueloIda?.origen} → ${payload.vueloIda?.destino})`);
      console.log('Vuelo Vuelta:', payload.vueloVuelta?.idViaje || 'N/A', payload.vueloVuelta ? `(${payload.vueloVuelta?.origen} → ${payload.vueloVuelta?.destino})` : '');
      console.log('Buses:', payload.buses.length);
      console.log('Total:', payload.total);
      console.log('Método de pago:', payload.metodoPago);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Crear reserva
      const reservaResp = await axios.post(
        "http://localhost:5174/pagos/crear-reserva", 
        payload
      );

      console.log('✅ Respuesta del backend:', reservaResp.data);

      const { reservaId } = reservaResp.data;

      // 2) Gateway de pago según método seleccionado
      const paymentPayload = {
        reservaId,
        pasajero: payload.pasajero,
        vueloIda: payload.vueloIda,
        vueloVuelta: payload.vueloVuelta,
        buses: payload.buses,
      };

      console.log('💳 Payload para gateway de pago:', paymentPayload);

      if (selectedPaymentMethod === "stripe") {
        const r = await axios.post(
          "http://localhost:5174/pagos/stripe/create-session", 
          paymentPayload
        );
        if (r.data?.url) {
          console.log('🔗 Redirigiendo a Stripe:', r.data.url);
          window.location.href = r.data.url;
          return;
        }
        throw new Error("Stripe no devolvió URL de checkout.");
      }

      if (selectedPaymentMethod === "mercadopago") {
        const r = await axios.post(
          "http://localhost:5174/pagos/mercadopago/create-preference", 
          paymentPayload
        );
        if (r.data?.init_point) {
          console.log('🔗 Redirigiendo a MercadoPago:', r.data.init_point);
          window.location.href = r.data.init_point;
          return;
        }
        throw new Error("MercadoPago no devolvió init_point.");
      }

      if (selectedPaymentMethod === "paypal") {
        const r = await axios.post(
          "http://localhost:5174/pagos/paypal/create-order", 
          paymentPayload
        );
        if (r.data?.approveUrl) {
          console.log('🔗 Redirigiendo a PayPal:', r.data.approveUrl);
          window.location.href = r.data.approveUrl;
          return;
        }
        throw new Error("PayPal no devolvió approveUrl.");
      }
    } catch (e) {
      console.error('❌ Error completo:', e);
      console.error('📋 Respuesta del servidor:', e.response?.data);
      console.error('📊 Status:', e.response?.status);
      console.error('📝 Headers:', e.response?.headers);
      
      const errorMsg = e.response?.data?.error || 
                       e.response?.data?.message || 
                       e.response?.data?.msg ||
                       e.message || 
                       "Error al procesar el pago";
      
      setError(`${errorMsg} (Status: ${e.response?.status || 'desconocido'})`);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Modal de detalles del bus */}
        {mostrarDetalleModal && busDetalleSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Detalles del Bus</h3>
                <button
                  onClick={() => setMostrarDetalleModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Empresa */}
                <div className={`${busDetalleSeleccionado.color} text-white px-4 py-2 rounded-lg inline-block font-bold`}>
                  {busDetalleSeleccionado.empresa}
                </div>

                {/* Ruta */}
                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Origen</p>
                    <p className="font-bold text-gray-900">{busDetalleSeleccionado.ciudadOrigen}</p>
                    <p className="text-sm text-gray-600">{busDetalleSeleccionado.origen}</p>
                    <p className="text-xs text-gray-500 mt-1">{busDetalleSeleccionado.direccionOrigen}</p>
                    <p className="text-lg font-bold text-blue-600 mt-2">{busDetalleSeleccionado.horaSalida}</p>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="text-gray-400">→</div>
                    <div className="text-sm text-gray-600">{busDetalleSeleccionado.duracion}</div>
                    <div className="text-xs text-gray-500">{busDetalleSeleccionado.distanciaKm} km</div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Destino</p>
                    <p className="font-bold text-gray-900">{busDetalleSeleccionado.ciudadDestino}</p>
                    <p className="text-sm text-gray-600">{busDetalleSeleccionado.destino}</p>
                    <p className="text-xs text-gray-500 mt-1">{busDetalleSeleccionado.direccionDestino}</p>
                    <p className="text-lg font-bold text-blue-600 mt-2">{busDetalleSeleccionado.horaLlegada}</p>
                  </div>
                </div>

                {/* Fecha y tipo de bus */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Fecha de salida</p>
                    <p className="font-semibold text-gray-900">{busDetalleSeleccionado.fechaSalida}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tipo de bus</p>
                    <p className="font-semibold text-gray-900">{busDetalleSeleccionado.tipoBus || 'Semi Cama'}</p>
                  </div>
                </div>

                {/* Servicios */}
                {busDetalleSeleccionado.servicios && busDetalleSeleccionado.servicios.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Servicios incluidos:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {busDetalleSeleccionado.servicios.map((servicio, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 px-3 py-2 rounded">
                          <span className="text-green-600">✓</span>
                          <span>{servicio}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Precio y cupos */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Precio por adulto</p>
                      <p className="text-2xl font-bold text-purple-600">{CLP(busDetalleSeleccionado.precioAdulto)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Cupos disponibles</p>
                      <p className="text-xl font-bold text-gray-900">{busDetalleSeleccionado.cupos}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setMostrarDetalleModal(false)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 1: Pasajero */}
        <div
          className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 ${
            currentStep === 1 ? "border-purple-600" : "border-gray-200"
          }`}
        >
          <button
            onClick={() => currentStep > 1 && setCurrentStep(1)}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                currentStep >= 1 ? "bg-purple-600 text-white" : "bg-gray-300"
              }`}
            >
              1
            </div>
            <h2 className="text-lg font-bold text-gray-900">Pasajero</h2>
          </button>

          {currentStep === 1 && (
            <div className="px-4 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  name="nombre"
                  placeholder="Nombre"
                  value={passengerData.nombre}
                  onChange={handlePassengerInputChange}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 text-sm"
                />
                <input
                  type="text"
                  name="apellido"
                  placeholder="Apellido"
                  value={passengerData.apellido}
                  onChange={handlePassengerInputChange}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 text-sm"
                />
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={passengerData.fechaNacimiento}
                  onChange={handlePassengerInputChange}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 text-sm"
                />
                <select
                  name="genero"
                  value={passengerData.genero}
                  onChange={handlePassengerInputChange}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 text-sm text-gray-700"
                >
                  <option value="">Género</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
                <input
                  type="text"
                  name="numeroDocumento"
                  placeholder="Número de documento"
                  value={passengerData.numeroDocumento}
                  onChange={handlePassengerInputChange}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 text-sm"
                />
                <input
                  type="email"
                  name="correo"
                  placeholder="Correo"
                  value={passengerData.correo}
                  onChange={handlePassengerInputChange}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 text-sm"
                />
                <input
                  type="tel"
                  name="telefono"
                  placeholder="Teléfono"
                  value={passengerData.telefono}
                  onChange={handlePassengerInputChange}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 text-sm"
                />
              </div>
              <button
                onClick={handleContinueFromPassenger}
                className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg"
              >
                CONTINUAR CON BUSES
              </button>
            </div>
          )}
        </div>

        {/* PASO 2: Buses */}
        <div
          className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 ${
            currentStep === 2 ? "border-purple-600" : "border-gray-200"
          }`}
        >
          <button
            onClick={() => currentStep > 2 && setCurrentStep(2)}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                currentStep >= 2 ? "bg-purple-600 text-white" : "bg-gray-300"
              }`}
            >
              2
            </div>
            <h2 className="text-lg font-bold text-gray-900">Conexiones de Bus</h2>
          </button>

          {currentStep === 2 && (
            <div className="px-4 pb-6">
              {vueloNorm && (
                <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        Tu vuelo llega a {vueloNorm.destino} a las {vueloNorm.horaLlegada}
                      </p>
                      <p className="text-xs text-blue-700">
                        Te mostramos buses que salen al menos 90 minutos después de tu llegada
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={skipBus}
                  onChange={toggleSkipBus}
                  className="w-4 h-4 accent-purple-600"
                />
                <span className="text-sm text-gray-700">No necesito transporte terrestre</span>
              </label>

              {!skipBus && (
                <>
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                    </div>
                  ) : availableBuses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-2">No hay buses disponibles para esta conexión</p>
                      <p className="text-xs text-gray-400">Puedes continuar sin seleccionar bus</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableBuses.map((bus) => {
                        const selected = !!selectedBuses.find((b) => b.idViaje === bus.idViaje);
                        return (
                          <div
                            key={bus.idViaje}
                            className={`border rounded-xl p-4 transition-all ${
                              selected ? "border-purple-600 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className={`${bus.color || "bg-purple-600"} text-white px-3 py-1 rounded font-bold text-xs`}>
                                    {bus.empresa}
                                  </div>
                                  {bus.tiempoEspera && (
                                    <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                      <Clock className="w-3 h-3" />
                                      {bus.tiempoEspera}
                                    </div>
                                  )}
                                  {/* NUEVO: Botón de ver detalles */}
                                  <button
                                    onClick={() => cargarDetalleBus(bus.idViaje)}
                                    disabled={loadingBusDetalle}
                                    className="text-purple-600 hover:text-purple-700 text-xs flex items-center gap-1"
                                  >
                                    <Info className="w-3 h-3" />
                                    {loadingBusDetalle ? 'Cargando...' : 'Ver detalles'}
                                  </button>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">📅 {bus.fechaSalida}</div>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{bus.horaSalida}</div>
                                    <div className="font-semibold text-gray-900">{bus.horaLlegada}</div>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{bus.ciudadOrigen}</div>
                                    <div className="font-semibold text-gray-900">{bus.ciudadDestino}</div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <span>🕐</span>
                                    <span>{bus.duracion}</span>
                                  </span>
                                  <span className="text-gray-400">{bus.cupos} asientos disponibles</span>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-xl font-bold text-gray-900 mb-3">
                                  {CLP(bus.precioAdulto)}
                                </div>
                                <button
                                  onClick={() => handleBusSelection(bus)}
                                  className={`w-full px-6 py-2 font-semibold rounded-lg text-sm transition-colors ${
                                    selected
                                      ? "bg-gray-300 text-gray-700"
                                      : "bg-purple-600 text-white hover:bg-purple-700"
                                  }`}
                                >
                                  {selected ? "Seleccionado ✓" : "Seleccionar"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg text-sm"
                >
                  VOLVER
                </button>
                <button
                  onClick={handleContinueFromBuses}
                  disabled={!skipBus && selectedBuses.length === 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CONTINUAR A PAGO
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PASO 3: Pago */}
        <div
          className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 ${
            currentStep === 3 ? "border-purple-600" : "border-gray-200"
          }`}
        >
          <button className="w-full flex items-center gap-3 p-4 text-left">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                currentStep >= 3 ? "bg-purple-600 text-white" : "bg-gray-300"
              }`}
            >
              3
            </div>
            <h2 className="text-lg font-bold text-gray-900">Pago</h2>
          </button>

          {currentStep === 3 && (
            <div className="px-4 pb-6 space-y-4">
              {/* Card Vuelo (ida y, si corresponde, vuelta) */}
              <div className="border-2 border-purple-600 rounded-2xl p-4 flex flex-col gap-3">
                {resumen.vueloIda && (
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-gray-900">
                        {resumen.vueloIda.empresa} · {resumen.vueloIda.origen} → {resumen.vueloIda.destino}
                      </div>
                      <div className="text-xs text-gray-600">
                        {resumen.vueloIda.horaSalida} — {resumen.vueloIda.horaLlegada} · Tarifa: {resumen.vueloIda.tarifaNombre}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Vuelo (ida)</div>
                      <div className="text-lg font-bold text-gray-900">{CLP(resumen.vueloIda.precio)}</div>
                    </div>
                  </div>
                )}

                {resumen.isRT && resumen.vueloVuelta && (
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-gray-900">
                        {resumen.vueloVuelta.empresa} · {resumen.vueloVuelta.origen} → {resumen.vueloVuelta.destino}
                      </div>
                      <div className="text-xs text-gray-600">
                        {resumen.vueloVuelta.horaSalida} — {resumen.vueloVuelta.horaLlegada} · Tarifa: {resumen.vueloVuelta.tarifaNombre}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Vuelo (vuelta)</div>
                      <div className="text-lg font-bold text-gray-900">{CLP(resumen.vueloVuelta.precio)}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Métodos de pago */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      selectedPaymentMethod === method.id
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`${method.color} text-white rounded-lg p-2.5 inline-flex mb-2`}>
                      {method.icon}
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">{method.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{method.description}</div>
                    {selectedPaymentMethod === method.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Resumen total */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-3">Resumen de tu reserva</h3>
                <div className="space-y-2 text-sm">
                  {resumen.vueloIda && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Vuelo (ida) – {resumen.vueloIda.origen} → {resumen.vueloIda.destino} · {resumen.vueloIda.tarifaNombre}
                      </span>
                      <span className="font-semibold">{CLP(resumen.vueloIda.precio)}</span>
                    </div>
                  )}

                  {resumen.isRT && resumen.vueloVuelta && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Vuelo (vuelta) – {resumen.vueloVuelta.origen} → {resumen.vueloVuelta.destino} · {resumen.vueloVuelta.tarifaNombre}
                      </span>
                      <span className="font-semibold">{CLP(resumen.vueloVuelta.precio)}</span>
                    </div>
                  )}

                  {!skipBus &&
                    resumen.buses.map((b, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-600">
                          {b.empresa} – {b.ciudadOrigen || b.origen} → {b.ciudadDestino || b.destino}
                        </span>
                        <span className="font-semibold">{CLP(b.precioAdulto)}</span>
                      </div>
                    ))}

                  <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-purple-600">{CLP(resumen.total)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading || !resumen.vueloIda}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Procesando…</span>
                  </>
                ) : (
                  <span>PAGAR {CLP(resumen.total)}</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}