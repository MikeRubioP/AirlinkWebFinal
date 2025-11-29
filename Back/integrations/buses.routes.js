import express from "express";

export const router = express.Router();

// ============================================================================
// DATOS ESTÁTICOS - RUTAS DE BUSES INTERREGIONALES DE CHILE
// ============================================================================

const COLOR_HEX_MAP = {
  green: "#16a34a",
  blue: "#1e40af",
  violet: "#7c3aed",
  yellow: "#eab308",
  red: "#dc2626",
  orange: "#ea580c",
  purple: "#9333ea",
  gray: "#4b5563",
};

const EMPRESAS_BUS = {
  TURBUS: {
    nombre: "Turbus",
    logo: "https://www.turbus.cl/images/logo.png",
    color: "green",
    colorHex: COLOR_HEX_MAP.green,
  },
  PULLMAN: {
    nombre: "Pullman Bus",
    logo: "https://www.pullman.cl/images/logo.png",
    color: "blue",
    colorHex: COLOR_HEX_MAP.blue,
  },
  CONDOR: {
    nombre: "Condor Bus",
    logo: "https://www.condorbus.cl/images/logo.png",
    color: "violet",
    colorHex: COLOR_HEX_MAP.violet,
  },
  CRUZ_DEL_SUR: {
    nombre: "Cruz del Sur",
    logo: "https://www.cruzdelsur.cl/images/logo.png",
    color: "yellow",
    colorHex: COLOR_HEX_MAP.yellow,
  },
  JAC: {
    nombre: "JAC",
    logo: "https://www.jac.cl/images/logo.png",
    color: "green",
    colorHex: COLOR_HEX_MAP.green,
  },
  ROMANI: {
    nombre: "Romani",
    logo: "https://www.romani.cl/images/logo.png",
    color: "orange",
    colorHex: COLOR_HEX_MAP.orange,
  },
};

// Terminales y ciudades principales de Chile
const TERMINALES_CHILE = {
  // Región Metropolitana
  Santiago: {
    codigo: "SCL-BUS",
    nombreTerminal: "Terminal de Buses Santiago",
    ciudad: "Santiago",
    direccion: "Av. Libertador Bernardo O'Higgins 3850",
    lat: -33.4569,
    lon: -70.6826,
    tipoTerminal: "principal",
  },

  // Región de Valparaíso
  Valparaíso: {
    codigo: "VLP-BUS",
    nombreTerminal: "Terminal Rodoviario Valparaíso",
    ciudad: "Valparaíso",
    direccion: "Av. Pedro Montt 2800",
    lat: -33.0458,
    lon: -71.6197,
    tipoTerminal: "principal",
  },
  "Viña del Mar": {
    codigo: "VDM-BUS",
    nombreTerminal: "Terminal Buses Viña del Mar",
    ciudad: "Viña del Mar",
    direccion: "Av. Valparaíso 1055",
    lat: -33.0239,
    lon: -71.5519,
    tipoTerminal: "principal",
  },

  // Región de Coquimbo
  "La Serena": {
    codigo: "LSC-BUS",
    nombreTerminal: "Terminal La Serena",
    ciudad: "La Serena",
    direccion: "Av. Amunátegui 980",
    lat: -29.9027,
    lon: -71.2519,
    tipoTerminal: "principal",
  },
  Coquimbo: {
    codigo: "COQ-BUS",
    nombreTerminal: "Terminal Buses Coquimbo",
    ciudad: "Coquimbo",
    direccion: "Av. Costanera",
    lat: -29.9533,
    lon: -71.3436,
    tipoTerminal: "principal",
  },

  // Región del Biobío
  Concepción: {
    codigo: "CCP-BUS",
    nombreTerminal: "Terminal Collao",
    ciudad: "Concepción",
    direccion: "Tegualda 860",
    lat: -36.827,
    lon: -73.0503,
    tipoTerminal: "principal",
  },
  Chillán: {
    codigo: "YAI-BUS",
    nombreTerminal: "Terminal Chillán",
    ciudad: "Chillán",
    direccion: "Av. O'Higgins 010",
    lat: -36.6063,
    lon: -72.1034,
    tipoTerminal: "principal",
  },

  // Región de La Araucanía
  Temuco: {
    codigo: "TMC-BUS",
    nombreTerminal: "Terminal Buses Temuco",
    ciudad: "Temuco",
    direccion: "Vicente Pérez Rosales 1609",
    lat: -38.7359,
    lon: -72.5904,
    tipoTerminal: "principal",
  },

  // Región de Los Lagos
  "Puerto Montt": {
    codigo: "PMC-BUS",
    nombreTerminal: "Terminal Buses Puerto Montt",
    ciudad: "Puerto Montt",
    direccion: "Av. Diego Portales 1001",
    lat: -41.4693,
    lon: -72.9424,
    tipoTerminal: "principal",
  },
  Osorno: {
    codigo: "ZOS-BUS",
    nombreTerminal: "Terminal Buses Osorno",
    ciudad: "Osorno",
    direccion: "Av. Errázuriz 1400",
    lat: -40.5736,
    lon: -73.1326,
    tipoTerminal: "principal",
  },

  // Región de Antofagasta
  Antofagasta: {
    codigo: "ANF-BUS",
    nombreTerminal: "Terminal Buses Antofagasta",
    ciudad: "Antofagasta",
    direccion: "Latorre 2751",
    lat: -23.6509,
    lon: -70.3975,
    tipoTerminal: "principal",
  },
  Calama: {
    codigo: "CJC-BUS",
    nombreTerminal: "Terminal Buses Calama",
    ciudad: "Calama",
    direccion: "Av. Granaderos 3068",
    lat: -22.4667,
    lon: -68.9333,
    tipoTerminal: "principal",
  },

  // Región de Tarapacá
  Iquique: {
    codigo: "IQQ-BUS",
    nombreTerminal: "Terminal Buses Iquique",
    ciudad: "Iquique",
    direccion: "Patricio Lynch 730",
    lat: -20.2141,
    lon: -70.1522,
    tipoTerminal: "principal",
  },

  // Región de Magallanes
  "Punta Arenas": {
    codigo: "PUQ-BUS",
    nombreTerminal: "Terminal Buses Punta Arenas",
    ciudad: "Punta Arenas",
    direccion: "Av. Colón 900",
    lat: -53.1638,
    lon: -70.9171,
    tipoTerminal: "principal",
  },

  // Ciudades intermedias sin terminal grande (paraderos)
  "Los Andes": {
    codigo: "LAN-BUS",
    nombreTerminal: "Paradero Los Andes",
    ciudad: "Los Andes",
    direccion: "Av. Argentina",
    lat: -32.8341,
    lon: -70.5986,
    tipoTerminal: "paradero",
  },
  "San Fernando": {
    codigo: "SFN-BUS",
    nombreTerminal: "Terminal San Fernando",
    ciudad: "San Fernando",
    direccion: "Av. Manso de Velasco",
    lat: -34.5833,
    lon: -70.9833,
    tipoTerminal: "intermedio",
  },
  Talca: {
    codigo: "TLC-BUS",
    nombreTerminal: "Terminal Talca",
    ciudad: "Talca",
    direccion: "2 Sur 2220",
    lat: -35.4264,
    lon: -71.6554,
    tipoTerminal: "principal",
  },
  Rancagua: {
    codigo: "RCG-BUS",
    nombreTerminal: "Terminal Rancagua",
    ciudad: "Rancagua",
    direccion: "Av. Libertador Bernardo O'Higgins",
    lat: -34.1701,
    lon: -70.7404,
    tipoTerminal: "principal",
  },
  "Los Ángeles": {
    codigo: "LAG-BUS",
    nombreTerminal: "Terminal Los Ángeles",
    ciudad: "Los Ángeles",
    direccion: "Av. Sor Vicenta",
    lat: -37.4698,
    lon: -72.354,
    tipoTerminal: "intermedio",
  },
  Valdivia: {
    codigo: "ZAL-BUS",
    nombreTerminal: "Terminal Buses Valdivia",
    ciudad: "Valdivia",
    direccion: "Av. Ramón Picarte 2100",
    lat: -39.8142,
    lon: -73.2459,
    tipoTerminal: "principal",
  },
};

// Rutas principales entre ciudades (matriz de conexiones)
const RUTAS_PRINCIPALES = [
  // Desde Santiago
  {
    origen: "Santiago",
    destino: "Valparaíso",
    duracionMin: 120,
    distanciaKm: 120,
    empresas: ["TURBUS", "PULLMAN", "CONDOR"],
  },
  {
    origen: "Santiago",
    destino: "Viña del Mar",
    duracionMin: 130,
    distanciaKm: 120,
    empresas: ["TURBUS", "PULLMAN", "CONDOR"],
  },
  {
    origen: "Santiago",
    destino: "La Serena",
    duracionMin: 360,
    distanciaKm: 470,
    empresas: ["TURBUS", "PULLMAN"],
  },
  {
    origen: "Santiago",
    destino: "Concepción",
    duracionMin: 480,
    distanciaKm: 500,
    empresas: ["TURBUS", "PULLMAN", "CRUZ_DEL_SUR"],
  },
  {
    origen: "Santiago",
    destino: "Temuco",
    duracionMin: 600,
    distanciaKm: 680,
    empresas: ["TURBUS", "JAC", "CRUZ_DEL_SUR"],
  },
  {
    origen: "Santiago",
    destino: "Puerto Montt",
    duracionMin: 720,
    distanciaKm: 1020,
    empresas: ["TURBUS", "CRUZ_DEL_SUR"],
  },
  {
    origen: "Santiago",
    destino: "Rancagua",
    duracionMin: 90,
    distanciaKm: 87,
    empresas: ["TURBUS", "PULLMAN"],
  },
  {
    origen: "Santiago",
    destino: "Talca",
    duracionMin: 240,
    distanciaKm: 255,
    empresas: ["TURBUS", "PULLMAN", "ROMANI"],
  },
  {
    origen: "Santiago",
    destino: "Chillán",
    duracionMin: 360,
    distanciaKm: 400,
    empresas: ["TURBUS", "PULLMAN"],
  },
  {
    origen: "Santiago",
    destino: "Los Ángeles",
    duracionMin: 420,
    distanciaKm: 490,
    empresas: ["TURBUS", "JAC"],
  },
  {
    origen: "Santiago",
    destino: "Antofagasta",
    duracionMin: 1320,
    distanciaKm: 1370,
    empresas: ["TURBUS", "PULLMAN"],
  },
  {
    origen: "Santiago",
    destino: "Iquique",
    duracionMin: 1680,
    distanciaKm: 1850,
    empresas: ["TURBUS"],
  },

  // Desde Valparaíso/Viña
  {
    origen: "Valparaíso",
    destino: "Santiago",
    duracionMin: 120,
    distanciaKm: 120,
    empresas: ["TURBUS", "PULLMAN", "CONDOR"],
  },
  {
    origen: "Valparaíso",
    destino: "La Serena",
    duracionMin: 300,
    distanciaKm: 400,
    empresas: ["TURBUS", "PULLMAN"],
  },
  {
    origen: "Viña del Mar",
    destino: "Santiago",
    duracionMin: 130,
    distanciaKm: 120,
    empresas: ["TURBUS", "PULLMAN", "CONDOR"],
  },
  {
    origen: "Viña del Mar",
    destino: "La Serena",
    duracionMin: 290,
    distanciaKm: 400,
    empresas: ["TURBUS", "PULLMAN"],
  },

  // Desde La Serena
  {
    origen: "La Serena",
    destino: "Santiago",
    duracionMin: 360,
    distanciaKm: 470,
    empresas: ["TURBUS", "PULLMAN"],
  },
  {
    origen: "La Serena",
    destino: "Antofagasta",
    duracionMin: 780,
    distanciaKm: 900,
    empresas: ["TURBUS"],
  },
  {
    origen: "La Serena",
    destino: "Coquimbo",
    duracionMin: 20,
    distanciaKm: 15,
    empresas: ["TURBUS", "PULLMAN"],
  },

  // Desde Concepción
  {
    origen: "Concepción",
    destino: "Santiago",
    duracionMin: 480,
    distanciaKm: 500,
    empresas: ["TURBUS", "PULLMAN", "CRUZ_DEL_SUR"],
  },
  {
    origen: "Concepción",
    destino: "Temuco",
    duracionMin: 180,
    distanciaKm: 240,
    empresas: ["TURBUS", "JAC"],
  },
  {
    origen: "Concepción",
    destino: "Valdivia",
    duracionMin: 240,
    distanciaKm: 330,
    empresas: ["TURBUS", "JAC"],
  },
  {
    origen: "Concepción",
    destino: "Los Ángeles",
    duracionMin: 60,
    distanciaKm: 110,
    empresas: ["TURBUS", "JAC"],
  },

  // Desde Temuco
  {
    origen: "Temuco",
    destino: "Santiago",
    duracionMin: 600,
    distanciaKm: 680,
    empresas: ["TURBUS", "JAC", "CRUZ_DEL_SUR"],
  },
  {
    origen: "Temuco",
    destino: "Puerto Montt",
    duracionMin: 300,
    distanciaKm: 350,
    empresas: ["TURBUS", "CRUZ_DEL_SUR"],
  },
  {
    origen: "Temuco",
    destino: "Valdivia",
    duracionMin: 120,
    distanciaKm: 166,
    empresas: ["TURBUS", "JAC"],
  },
  {
    origen: "Temuco",
    destino: "Concepción",
    duracionMin: 180,
    distanciaKm: 240,
    empresas: ["TURBUS", "JAC"],
  },

  // Desde Puerto Montt
  {
    origen: "Puerto Montt",
    destino: "Santiago",
    duracionMin: 720,
    distanciaKm: 1020,
    empresas: ["TURBUS", "CRUZ_DEL_SUR"],
  },
  {
    origen: "Puerto Montt",
    destino: "Temuco",
    duracionMin: 300,
    distanciaKm: 350,
    empresas: ["TURBUS", "CRUZ_DEL_SUR"],
  },
  {
    origen: "Puerto Montt",
    destino: "Osorno",
    duracionMin: 120,
    distanciaKm: 110,
    empresas: ["TURBUS", "JAC"],
  },
  {
    origen: "Puerto Montt",
    destino: "Punta Arenas",
    duracionMin: 1800,
    distanciaKm: 1900,
    empresas: ["TURBUS"],
  },

  // Desde Antofagasta
  {
    origen: "Antofagasta",
    destino: "Santiago",
    duracionMin: 1320,
    distanciaKm: 1370,
    empresas: ["TURBUS", "PULLMAN"],
  },
  {
    origen: "Antofagasta",
    destino: "Iquique",
    duracionMin: 360,
    distanciaKm: 400,
    empresas: ["TURBUS"],
  },
  {
    origen: "Antofagasta",
    destino: "Calama",
    duracionMin: 120,
    distanciaKm: 215,
    empresas: ["TURBUS"],
  },

  // Rutas intermedias
  {
    origen: "Rancagua",
    destino: "Santiago",
    duracionMin: 90,
    distanciaKm: 87,
    empresas: ["TURBUS", "PULLMAN"],
  },
  {
    origen: "Talca",
    destino: "Santiago",
    duracionMin: 240,
    distanciaKm: 255,
    empresas: ["TURBUS", "PULLMAN", "ROMANI"],
  },
  {
    origen: "Chillán",
    destino: "Concepción",
    duracionMin: 60,
    distanciaKm: 100,
    empresas: ["TURBUS", "PULLMAN"],
  },
  {
    origen: "Osorno",
    destino: "Valdivia",
    duracionMin: 120,
    distanciaKm: 110,
    empresas: ["TURBUS", "JAC"],
  },
];

// Horarios típicos de salida (se generan dinámicamente por ruta)
const HORARIOS_TIPO = {
  "Santiago-Valparaíso": [
    "07:00",
    "08:30",
    "10:00",
    "12:00",
    "14:30",
    "16:00",
    "18:00",
    "20:00",
  ],
  "Santiago-Viña del Mar": [
    "07:30",
    "09:00",
    "11:00",
    "13:00",
    "15:30",
    "17:00",
    "19:00",
    "20:30",
  ],
  "Santiago-La Serena": ["08:00", "10:00", "13:00", "16:00", "20:00", "22:00"],
  "Santiago-Concepción": [
    "07:00",
    "09:00",
    "11:00",
    "14:00",
    "17:00",
    "20:00",
    "22:30",
  ],
  "Santiago-Temuco": ["08:00", "11:00", "14:00", "18:00", "21:00", "23:00"],
  "Santiago-Puerto Montt": ["09:00", "13:00", "18:00", "21:00"],
  default: ["08:00", "12:00", "16:00", "20:00"],
};

// Precios base por kilómetro (en pesos chilenos)
const PRECIO_BASE_POR_KM = {
  corta: 80, // < 150 km
  media: 70, // 150-500 km
  larga: 60, // > 500 km
};

// ============================================================================
// FUNCIONES AUXILIARES PARA DATOS ESTÁTICOS
// ============================================================================

function calcularPrecioEstimado(distanciaKm) {
  if (distanciaKm < 150) {
    return Math.round(distanciaKm * PRECIO_BASE_POR_KM.corta);
  } else if (distanciaKm <= 500) {
    return Math.round(distanciaKm * PRECIO_BASE_POR_KM.media);
  } else {
    return Math.round(distanciaKm * PRECIO_BASE_POR_KM.larga);
  }
}

function obtenerHorariosRuta(origen, destino) {
  const rutaKey = `${origen}-${destino}`;
  return HORARIOS_TIPO[rutaKey] || HORARIOS_TIPO.default;
}

function generarViajesEstaticos(origen, destino, fecha) {
  // Buscar ruta en datos estáticos
  const ruta = RUTAS_PRINCIPALES.find(
    (r) => r.origen === origen && r.destino === destino
  );

  if (!ruta) return [];

  const horarios = obtenerHorariosRuta(origen, destino);
  const viajes = [];

  // Generar viajes para cada empresa y horario
  ruta.empresas.forEach((empresaKey) => {
    const empresa = EMPRESAS_BUS[empresaKey];
    const terminalOrigen = TERMINALES_CHILE[origen];
    const terminalDestino = TERMINALES_CHILE[destino];

    horarios.forEach((hora, index) => {
      const [horaNum, minNum] = hora.split(":").map(Number);
      const salida = new Date(fecha);
      salida.setHours(horaNum, minNum, 0);

      const llegada = new Date(salida);
      llegada.setMinutes(llegada.getMinutes() + ruta.duracionMin);

      viajes.push({
        idViaje: `STATIC-${empresaKey}-${origen}-${destino}-${index}`,
        empresa: empresa.nombre,
        logo: empresa.logo,
        origenCodigo: terminalOrigen.codigo,
        origen: terminalOrigen.nombreTerminal,
        ciudadOrigen: origen,
        destinoCodigo: terminalDestino.codigo,
        destino: terminalDestino.nombreTerminal,
        ciudadDestino: destino,
        fechaSalida: salida.toLocaleDateString("es-CL", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        }),
        fechaCompleta: fecha,
        horaSalida: hora,
        horaLlegada: `${String(llegada.getHours()).padStart(2, "0")}:${String(
          llegada.getMinutes()
        ).padStart(2, "0")}`,
        salidaCompleta: salida.toISOString(),
        duracionMin: ruta.duracionMin,
        precioAdulto: calcularPrecioEstimado(ruta.distanciaKm),
        cupos: Math.floor(Math.random() * 30) + 10, // 10-40 cupos disponibles
        distanciaKm: ruta.distanciaKm,
        color: empresa.color,
        esEstatico: true,
      });
    });
  });

  return viajes;
}

// ============================================================================
// API OPENSTREETMAP / NOMINATIM - GEOCODIFICACIÓN
// ============================================================================

async function geocodificarCiudad(nombreCiudad) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
      nombreCiudad
    )}&country=Chile&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "BusBookingApp/1.0", // Requerido por Nominatim
      },
    });

    if (!response.ok) {
      console.warn(
        `⚠️ Error geocodificando ${nombreCiudad}: ${response.status}`
      );
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        nombre: data[0].display_name,
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error(
      `❌ Error en geocodificación de ${nombreCiudad}:`,
      error.message
    );
    return null;
  }
}

async function calcularDistanciaRuta(
  origenLat,
  origenLon,
  destinoLat,
  destinoLon
) {
  try {
    // Fórmula de Haversine para calcular distancia entre dos puntos
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((destinoLat - origenLat) * Math.PI) / 180;
    const dLon = ((destinoLon - origenLon) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((origenLat * Math.PI) / 180) *
        Math.cos((destinoLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;

    return Math.round(distancia);
  } catch (error) {
    console.error("❌ Error calculando distancia:", error);
    return null;
  }
}

// ============================================================================
// ENDPOINTS DE LA API
// ============================================================================

router.get("/disponibles", async (req, res) => {
  try {
    const db = req.app.get("db");
    const { origenCodigo, destinoCodigo, fecha, horaLlegadaVuelo } = req.query;

    if (!origenCodigo) {
      return res.status(400).json({
        error: "Se requiere origenCodigo",
      });
    }

    console.log("🔍 Buscando buses:", {
      origenCodigo,
      destinoCodigo,
      fecha,
      horaLlegadaVuelo,
    });

    // MAPEO CRUCIAL: Aeropuerto → Terminal de bus de la ciudad
    const aeropuertoATerminalBus = {
      // Chile
      SCL: "SCL-BUS",
      PMC: "PMC-BUS",
      IQQ: "IQQ-BUS",
      LSC: "COQ-BUS", // Aeropuerto La Serena → Terminal Coquimbo
      ANF: "ANF-BUS",
      PUQ: "PUQ-BUS",
      VLP: "VLP-BUS",
      CCP: "CCP-BUS",
      TMC: "TMC-BUS",
      // Internacional
      CUZ: "CUZ",
      EZE: "EZE",
      MEX: "MEX",
      BOG: "BOG",
      LIM: "LIM",
      GIG: "GIG",
    };

    // Obtener ciudad del terminal de bus
    const terminalBusCodigo =
      aeropuertoATerminalBus[origenCodigo] || origenCodigo;

    let ciudadOrigen = null;
    let busesBaseDatos = [];

    // Intentar obtener desde la base de datos primero
    if (db) {
      const [terminalInfo] = await db.query(
        "SELECT ciudad FROM terminal WHERE codigo = ? LIMIT 1",
        [terminalBusCodigo]
      );

      if (terminalInfo.length > 0) {
        ciudadOrigen = terminalInfo[0].ciudad;
        console.log(`📍 Ciudad origen (BD): ${ciudadOrigen}`);

        // CRÍTICO: Construir datetime completo de llegada del vuelo
        let fechaHoraMinima = null;
        if (fecha && horaLlegadaVuelo) {
          fechaHoraMinima = `${fecha} ${horaLlegadaVuelo}:00`;
          console.log(
            `⏰ Hora mínima de salida del bus: ${fechaHoraMinima} + 90 minutos`
          );
        }

        // Query mejorada con filtro de hora CORRECTO
        const query = `
          SELECT 
            v.idViaje,
            e.nombreEmpresa as empresa,
            e.logo,
            tOrigen.codigo as origenCodigo,
            tOrigen.nombreTerminal as origen,
            tOrigen.ciudad as ciudadOrigen,
            tDestino.codigo as destinoCodigo,
            tDestino.nombreTerminal as destino,
            tDestino.ciudad as ciudadDestino,
            DATE_FORMAT(v.salida, '%a, %d/%m') as fechaSalida,
            DATE_FORMAT(v.salida, '%Y-%m-%d') as fechaCompleta,
            TIME_FORMAT(v.salida, '%H:%i') as horaSalida,
            TIME_FORMAT(v.llegada, '%H:%i') as horaLlegada,
            v.salida as salidaCompleta,
            TIMESTAMPDIFF(MINUTE, v.salida, v.llegada) as duracionMin,
            vt.precio as precioAdulto,
            vt.cupos,
            r.distanciaKm,
            ${
              fechaHoraMinima
                ? `
              TIMESTAMPDIFF(MINUTE, 
                DATE_ADD('${fechaHoraMinima}', INTERVAL 90 MINUTE),
                v.salida
              ) as minutosDesdeVuelo
            `
                : "NULL as minutosDesdeVuelo"
            }
          FROM viaje v
          INNER JOIN ruta r ON v.idRuta = r.idRuta
          INNER JOIN terminal tOrigen ON r.idTerminalOrigen = tOrigen.idTerminal
          INNER JOIN terminal tDestino ON r.idTerminalDestino = tDestino.idTerminal
          INNER JOIN empresa_equipo eq ON v.idEquipo = eq.idEquipo
          INNER JOIN empresa e ON eq.idEmpresa = e.idEmpresa
          INNER JOIN viaje_tarifa vt ON v.idViaje = vt.idViaje
          WHERE e.tipoEmpresa = 'bus'
            AND e.activo = 1
            AND v.estado = 'programado'
            AND tOrigen.ciudad = ?
            ${
              destinoCodigo
                ? `
              AND (
                tDestino.ciudad = ? 
                OR tDestino.codigo = ?
                OR tDestino.ciudad LIKE ?
              )
            `
                : ""
            }
            ${
              fechaHoraMinima
                ? `
              AND v.salida >= DATE_ADD('${fechaHoraMinima}', INTERVAL 90 MINUTE)
              AND DATE(v.salida) IN (DATE('${fecha}'), DATE_ADD(DATE('${fecha}'), INTERVAL 1 DAY))
            `
                : `
              ${
                fecha
                  ? "AND DATE(v.salida) >= DATE(?)"
                  : "AND v.salida >= NOW()"
              }
            `
            }
            AND vt.cupos > 0
          ORDER BY v.salida ASC, r.distanciaKm ASC
          LIMIT 50
        `;

        const params = [ciudadOrigen];

        if (destinoCodigo) {
          params.push(destinoCodigo, destinoCodigo, `%${destinoCodigo}%`);
        }

        if (fecha && !fechaHoraMinima) {
          params.push(fecha);
        }

        [busesBaseDatos] = await db.query(query, params);
        console.log(`✅ Encontrados ${busesBaseDatos.length} buses en BD`);
      }
    }

    // Si no hay buses en BD, usar datos estáticos
    let busesEstaticos = [];
    if (busesBaseDatos.length === 0) {
      console.log("📦 Usando datos estáticos...");

      // Buscar ciudad origen en datos estáticos
      const terminalEstatico = Object.values(TERMINALES_CHILE).find(
        (t) => t.codigo === terminalBusCodigo
      );

      if (terminalEstatico) {
        ciudadOrigen = terminalEstatico.ciudad;

        // Si hay destino especificado, buscar ciudad destino
        let ciudadDestino = null;
        if (destinoCodigo) {
          const terminalDestino = Object.values(TERMINALES_CHILE).find(
            (t) => t.codigo === destinoCodigo || t.ciudad === destinoCodigo
          );
          if (terminalDestino) {
            ciudadDestino = terminalDestino.ciudad;
          }
        }

        // Si hay origen y destino, generar viajes
        if (ciudadOrigen && ciudadDestino) {
          const fechaObj = fecha ? new Date(fecha) : new Date();
          busesEstaticos = generarViajesEstaticos(
            ciudadOrigen,
            ciudadDestino,
            fechaObj
          );

          // Filtrar por hora si se especifica horaLlegadaVuelo
          if (horaLlegadaVuelo) {
            const fechaHoraMinima = new Date(`${fecha} ${horaLlegadaVuelo}:00`);
            fechaHoraMinima.setMinutes(fechaHoraMinima.getMinutes() + 90);

            busesEstaticos = busesEstaticos.filter((bus) => {
              const salidaBus = new Date(bus.salidaCompleta);
              return salidaBus >= fechaHoraMinima;
            });
          }
        }
      }

      console.log(`📦 Generados ${busesEstaticos.length} buses estáticos`);
    }

    // Combinar buses de BD y estáticos
    const buses = [...busesBaseDatos, ...busesEstaticos];

    if (buses.length > 0) {
      const destinos = [...new Set(buses.map((b) => b.ciudadDestino))];
      console.log(`🗺️ Destinos disponibles: ${destinos.join(", ")}`);
    } else {
      console.log(`❌ No hay buses disponibles`);
    }

    // Formatear buses
    const busesFormateados = buses.map((bus) => {
      const fechaHoraMinima =
        fecha && horaLlegadaVuelo ? `${fecha} ${horaLlegadaVuelo}:00` : null;

      const tiempoEspera = calcularTiempoEspera(
        fechaHoraMinima,
        bus.salidaCompleta
      );

      return {
        ...bus,
        duracion: `${Math.floor(bus.duracionMin / 60)}h ${
          bus.duracionMin % 60
        }min`,
        color: bus.color || getColorEmpresa(bus.empresa),
        tiempoEspera: tiempoEspera,
        _debug: {
          horaLlegadaVuelo: horaLlegadaVuelo,
          horaSalidaBus: bus.horaSalida,
          minutosDesdeVuelo: bus.minutosDesdeVuelo,
          fuente: bus.esEstatico ? "estático" : "base de datos",
        },
      };
    });

    res.json(busesFormateados);
  } catch (error) {
    console.error("❌ Error al buscar buses:", error);
    res.status(500).json({
      error: "Error al buscar buses disponibles",
      detalle: error.message,
    });
  }
});

function calcularTiempoEspera(fechaHoraLlegada, salidaBus) {
  if (!fechaHoraLlegada) return null;

  try {
    // Sumar 90 minutos a la llegada del vuelo
    const llegada = new Date(fechaHoraLlegada);
    llegada.setMinutes(llegada.getMinutes() + 90);

    const salida = new Date(salidaBus);
    const diff = Math.floor((salida - llegada) / 60000); // minutos

    if (diff < 0) return null; // Bus sale antes (no debería pasar)
    if (diff === 0) return "Sale justo después";
    if (diff < 60) return `${diff} min de espera`;

    const horas = Math.floor(diff / 60);
    const mins = diff % 60;
    return mins > 0 ? `${horas}h ${mins}min de espera` : `${horas}h de espera`;
  } catch (e) {
    console.error("Error calculando tiempo de espera:", e);
    return null;
  }
}

function getColorEmpresa(nombreEmpresa) {
  const empresaLower = nombreEmpresa?.toLowerCase() || "";

  const colores = {
    flixbus: { color: "green", hex: COLOR_HEX_MAP.green },
    pullman: { color: "purple", hex: COLOR_HEX_MAP.purple },
    turbus: { color: "red", hex: COLOR_HEX_MAP.red },
    condor: { color: "yellow", hex: COLOR_HEX_MAP.yellow },
    "tur bus": { color: "red", hex: COLOR_HEX_MAP.red },
    "cruz del sur": { color: "blue", hex: COLOR_HEX_MAP.blue },
    jac: { color: "green", hex: COLOR_HEX_MAP.green },
    romani: { color: "orange", hex: COLOR_HEX_MAP.orange },
    default: { color: "gray", hex: COLOR_HEX_MAP.gray },
  };

  for (const [key, value] of Object.entries(colores)) {
    if (empresaLower.includes(key)) {
      return value;
    }
  }

  return colores.default;
}

router.get("/conexiones/:ciudad", async (req, res) => {
  try {
    const db = req.app.get("db");
    const { ciudad } = req.params;

    console.log(`🗺️ Buscando conexiones desde: ${ciudad}`);

    let conexiones = [];

    // Intentar desde BD primero
    if (db) {
      [conexiones] = await db.query(
        `
        SELECT DISTINCT
          tDestino.ciudad as destino,
          tDestino.codigo,
          tDestino.nombreTerminal,
          COUNT(v.idViaje) as viajes_disponibles,
          MIN(vt.precio) as precioMinimo,
          MIN(r.distanciaKm) as distanciaKm
        FROM viaje v
        INNER JOIN ruta r ON v.idRuta = r.idRuta
        INNER JOIN terminal tOrigen ON r.idTerminalOrigen = tOrigen.idTerminal
        INNER JOIN terminal tDestino ON r.idTerminalDestino = tDestino.idTerminal
        INNER JOIN empresa_equipo eq ON v.idEquipo = eq.idEquipo
        INNER JOIN empresa e ON eq.idEmpresa = e.idEmpresa
        INNER JOIN viaje_tarifa vt ON v.idViaje = vt.idViaje
        WHERE e.tipoEmpresa = 'bus'
          AND v.estado = 'programado'
          AND v.salida >= NOW()
          AND vt.cupos > 0
          AND tOrigen.ciudad = ?
        GROUP BY tDestino.ciudad, tDestino.codigo, tDestino.nombreTerminal
        ORDER BY viajes_disponibles DESC, distanciaKm ASC
      `,
        [ciudad]
      );
    }

    // Si no hay conexiones en BD, usar datos estáticos
    if (conexiones.length === 0) {
      console.log("📦 Usando conexiones estáticas...");

      const rutasDesdeOrigen = RUTAS_PRINCIPALES.filter(
        (r) => r.origen === ciudad
      );

      conexiones = rutasDesdeOrigen.map((ruta) => {
        const terminalDestino = TERMINALES_CHILE[ruta.destino];
        return {
          destino: ruta.destino,
          codigo: terminalDestino.codigo,
          nombreTerminal: terminalDestino.nombreTerminal,
          viajes_disponibles: ruta.empresas.length * 4, // Aproximado
          precioMinimo: calcularPrecioEstimado(ruta.distanciaKm),
          distanciaKm: ruta.distanciaKm,
        };
      });
    }

    console.log(
      `✅ Encontradas ${conexiones.length} conexiones desde ${ciudad}`
    );

    res.json(conexiones);
  } catch (error) {
    console.error("❌ Error al obtener conexiones:", error);
    res.status(500).json({
      error: "Error al obtener conexiones",
      detalle: error.message,
    });
  }
});

// Endpoint para geocodificar ciudad usando OpenStreetMap
router.get("/geocode/:ciudad", async (req, res) => {
  try {
    const { ciudad } = req.params;

    console.log(`🌍 Geocodificando: ${ciudad}`);

    const resultado = await geocodificarCiudad(ciudad);

    if (!resultado) {
      return res.status(404).json({
        error: "Ciudad no encontrada",
        ciudad: ciudad,
      });
    }

    res.json(resultado);
  } catch (error) {
    console.error("❌ Error en geocodificación:", error);
    res.status(500).json({
      error: "Error al geocodificar ciudad",
      detalle: error.message,
    });
  }
});

// Endpoint para obtener información de terminales
router.get("/terminales", async (req, res) => {
  try {
    const { tipo } = req.query;

    let terminales = Object.values(TERMINALES_CHILE);

    if (tipo) {
      terminales = terminales.filter((t) => t.tipoTerminal === tipo);
    }

    res.json(terminales);
  } catch (error) {
    console.error("❌ Error al obtener terminales:", error);
    res.status(500).json({
      error: "Error al obtener terminales",
      detalle: error.message,
    });
  }
});

// Endpoint para calcular distancia entre dos ciudades
router.get("/distancia/:origen/:destino", async (req, res) => {
  try {
    const { origen, destino } = req.params;

    const terminalOrigen = TERMINALES_CHILE[origen];
    const terminalDestino = TERMINALES_CHILE[destino];

    if (!terminalOrigen || !terminalDestino) {
      return res.status(404).json({
        error: "Ciudad no encontrada en terminales",
      });
    }

    const distancia = await calcularDistanciaRuta(
      terminalOrigen.lat,
      terminalOrigen.lon,
      terminalDestino.lat,
      terminalDestino.lon
    );

    res.json({
      origen: origen,
      destino: destino,
      distanciaKm: distancia,
      coordenadasOrigen: { lat: terminalOrigen.lat, lon: terminalOrigen.lon },
      coordenadasDestino: {
        lat: terminalDestino.lat,
        lon: terminalDestino.lon,
      },
    });
  } catch (error) {
    console.error("❌ Error al calcular distancia:", error);
    res.status(500).json({
      error: "Error al calcular distancia",
      detalle: error.message,
    });
  }
});

export default router;
