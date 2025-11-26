// Genera 4 opciones ficticias por ruta/fecha con el shape del mockup
export function mockFlights({ origen, destino, fecha }) {
  const airline = "AirLink";

  // Horarios base para el día (puedes ajustar o randomizar si quieres)
  const base = [
    { salidaHora: "08:30", llegadaHora: "10:40", tarifa: "Standard" },
    { salidaHora: "11:00", llegadaHora: "13:10", tarifa: "Flex" },
    { salidaHora: "15:45", llegadaHora: "17:50", tarifa: "Standard" },
    { salidaHora: "20:15", llegadaHora: "22:30", tarifa: "Plus" },
  ];

  // Precios base por tipo de tarifa
  const basePrice = {
    Standard: 59900,
    Flex: 74900,
    Plus: 82900,
  };

  return base.map((b, i) => {
    const duracion = calcDuracion(b.salidaHora, b.llegadaHora); // "2 h 10 min"
    const precio = basePrice[b.tarifa] + randomOffset(0, 4000); // pequeño ruido

    return {
      id: `${fecha || "hoy"}-${origen}-${destino}-${i + 1}`,
      salidaHora: b.salidaHora,
      llegadaHora: b.llegadaHora,
      origen,
      destino,
      duracion,
      directo: true,          // cambia a false si quieres simular escalas
      operadoPor: airline,
      precio,
      tarifa: b.tarifa,
      // compat con tu FlightCard anterior (por si aún lo usas en algún lado):
      salida: `${b.salidaHora} ${origen}`,
      llegada: `${b.llegadaHora} ${destino}`,
      escala: "Directo",
    };
  });
}

/* Utils ------------------------------------------------------- */
function calcDuracion(horaSalida, horaLlegada) {
  // Soporta cruces de medianoche (llegada < salida)
  const [sh, sm] = horaSalida.split(":").map(Number);
  const [eh, em] = horaLlegada.split(":").map(Number);

  const salidaMin = sh * 60 + sm;
  let llegadaMin = eh * 60 + em;
  if (llegadaMin < salidaMin) llegadaMin += 24 * 60;

  const diff = llegadaMin - salidaMin;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h} h ${m.toString().padStart(2, "0")} min`;
}

function randomOffset(min = 0, max = 3000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
