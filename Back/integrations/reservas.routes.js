// integrations/reservas.routes.js
import express from "express";

const router = express.Router();

/**
 * POST /api/reservas/buscar-checkin
 * Busca una reserva por código y apellido del pasajero
 */
router.post("/buscar-checkin", async (req, res) => {
  const db = req.app.get("db");
  const { codigo, apellido } = req.body;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 BUSCANDO RESERVA PARA CHECK-IN');
  console.log('Código:', codigo);
  console.log('Apellido:', apellido);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Validaciones
    if (!codigo || !apellido) {
      return res.status(400).json({
        error: "Datos incompletos",
        mensaje: "El código de reserva y el apellido son requeridos"
      });
    }

    console.log('🔍 Formatos de búsqueda aceptados:');
    console.log('  - Código completo: RES241129MPZR');
    console.log('  - Código simplificado: RES-6 o RES6');
    console.log('  - Solo número: 6');

    // Extraer el ID numérico si viene en formato simplificado (RES-6, RES6, o solo 6)
    let idReserva = null;
    const codigoLimpio = codigo.toUpperCase().trim();
    
    // Si viene como "RES-6" o "RES6" o "#6"
    const matchSimplificado = codigoLimpio.match(/(?:RES-?|#)?(\d+)$/);
    if (matchSimplificado) {
      idReserva = parseInt(matchSimplificado[1]);
      console.log(`  ✓ Detectado formato simplificado: ID ${idReserva}`);
    }

    // Buscar reserva por código completo O por ID
    const [reservas] = await db.query(
      `SELECT 
        r.idReserva as id,
        r.codigo_reserva as codigo,
        r.estado,
        r.monto_total as montoTotal,
        
        v.idViaje,
        v.salida as salidaIso,
        v.llegada as llegadaIso,
        
        to_origen.codigo as origen,
        to_origen.nombreTerminal as origenNombre,
        to_destino.codigo as destino,
        to_destino.nombreTerminal as destinoNombre,
        
        p.idPasajero,
        p.nombrePasajero,
        p.apellidoPasajero,
        p.documento,
        
        e.nombreEmpresa as empresa
        
      FROM reserva r
      INNER JOIN viaje v ON r.idViaje = v.idViaje
      INNER JOIN ruta ru ON v.idRuta = ru.idRuta
      INNER JOIN terminal to_origen ON ru.idTerminalOrigen = to_origen.idTerminal
      INNER JOIN terminal to_destino ON ru.idTerminalDestino = to_destino.idTerminal
      INNER JOIN pasajero p ON r.idReserva = p.idReserva
      LEFT JOIN empresa_equipo eq ON v.idEquipo = eq.idEquipo
      LEFT JOIN empresa e ON eq.idEmpresa = e.idEmpresa
      
      WHERE (
        UPPER(r.codigo_reserva) = ? 
        OR (? IS NOT NULL AND r.idReserva = ?)
      )
      AND LOWER(p.apellidoPasajero) = LOWER(?)
      
      LIMIT 1`,
      [codigoLimpio, idReserva, idReserva, apellido]
    );

    if (reservas.length === 0) {
      console.log('⚠️ No se encontró reserva');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      return res.status(404).json({
        error: "Reserva no encontrada",
        mensaje: "No encontramos una reserva con ese código y apellido"
      });
    }

    const reserva = reservas[0];

    // Verificar fechas
    const fechaSalida = new Date(reserva.salidaIso);
    const ahora = new Date();
    const horasAntesDeSalida = (fechaSalida - ahora) / (1000 * 60 * 60);

    if (fechaSalida < ahora) {
      return res.status(400).json({
        error: "Check-in no disponible",
        mensaje: "Este vuelo ya ha partido"
      });
    }

    if (horasAntesDeSalida > 24) {
      return res.status(400).json({
        error: "Check-in no disponible",
        mensaje: "El check-in estará disponible 24 horas antes del vuelo"
      });
    }

    // Obtener asientos
    let asientos = [];
    try {
      const [asientosResult] = await db.query(
        `SELECT a.numero, pa.cargo_extra as precio
        FROM pasajero_asiento pa
        INNER JOIN asiento a ON pa.idAsiento = a.idAsiento
        INNER JOIN pasajero p ON pa.idPasajero = p.idPasajero
        WHERE p.idReserva = ?`,
        [reserva.id]
      );
      asientos = asientosResult;
    } catch (error) {
      asientos = [];
    }

    const salida = new Date(reserva.salidaIso);
    const llegada = new Date(reserva.llegadaIso);

    const resultado = {
      id: reserva.id,
      codigo: reserva.codigo,
      estado: reserva.estado,
      vuelo: `AL ${reserva.idViaje}`,
      origen: reserva.origen,
      destino: reserva.destino,
      origenNombre: reserva.origenNombre,
      destinoNombre: reserva.destinoNombre,
      empresa: reserva.empresa || 'AirLink',
      salidaIso: reserva.salidaIso,
      hSalida: salida.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      hLlegada: llegada.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      fechaSalida: salida.toLocaleDateString('es-CL', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      pasajero: {
        id: reserva.idPasajero,
        nombre: reserva.nombrePasajero,
        apellido: reserva.apellidoPasajero,
        nombreCompleto: `${reserva.nombrePasajero} ${reserva.apellidoPasajero}`,
        documento: reserva.documento
      },
      asientos: asientos.map(a => ({ numero: a.numero, precio: Number(a.precio) })),
      puedeHacerCheckin: reserva.estado === 'confirmada',
      horasRestantes: Math.floor(horasAntesDeSalida)
    };

    console.log('✅ Reserva encontrada:', reserva.codigo);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    res.json(resultado);

  } catch (error) {
    console.error('❌ Error al buscar reserva:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    res.status(500).json({
      error: "Error al buscar reserva",
      mensaje: error.message
    });
  }
});

/**
 * GET /api/reservas/mias
 * Obtiene todas las reservas del usuario (por email o por token)
 */
router.get("/mias", async (req, res) => {
  const db = req.app.get("db");
  
  // Obtener email del query o del token
  const email = req.query.email || req.user?.email;
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 OBTENIENDO RESERVAS');
  console.log('Email:', email);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    if (!email) {
      return res.status(400).json({
        error: "Email requerido",
        mensaje: "Debes proporcionar un email o estar autenticado"
      });
    }

    // ✅ Query adaptado a la estructura REAL de la BD
    const [reservas] = await db.query(
      `SELECT 
        r.idReserva as id,
        r.codigo_reserva as codigo,
        r.fecha_reserva as fechaReserva,
        r.estado,
        r.monto_total as montoTotal,
        r.moneda,
        
        -- Datos del viaje
        v.idViaje,
        v.salida as salidaIso,
        v.llegada as llegadaIso,
        
        -- Datos del pasajero
        p.nombrePasajero,
        p.apellidoPasajero,
        p.documento,
        
        -- IDs de terminales para obtener después
        ru.idTerminalOrigen,
        ru.idTerminalDestino
        
      FROM reserva r
      INNER JOIN usuario u ON r.idUsuario = u.idUsuario
      LEFT JOIN viaje v ON r.idViaje = v.idViaje
      LEFT JOIN ruta ru ON v.idRuta = ru.idRuta
      LEFT JOIN pasajero p ON r.idReserva = p.idReserva
      
      WHERE u.email = ?
      
      ORDER BY r.fecha_reserva DESC
      LIMIT 100`,
      [email]
    );

    if (reservas.length === 0) {
      console.log('⚠️ No se encontraron reservas para:', email);
      return res.json([]);
    }

    console.log(`📋 ${reservas.length} reservas encontradas para ${email}`);

    // Obtener información de terminales para cada reserva
    const reservasConTerminales = await Promise.all(reservas.map(async (r) => {
      let origenCodigo = 'N/A';
      let origenNombre = 'N/A';
      let origenCiudad = 'N/A';
      let destinoCodigo = 'N/A';
      let destinoNombre = 'N/A';
      let destinoCiudad = 'N/A';

      // Terminal de origen
      if (r.idTerminalOrigen) {
        const [terminales] = await db.query(
          `SELECT codigo, nombreTerminal, ciudad FROM terminal WHERE idTerminal = ?`,
          [r.idTerminalOrigen]
        );
        if (terminales.length > 0) {
          origenCodigo = terminales[0].codigo || 'N/A';
          origenNombre = terminales[0].nombreTerminal || 'N/A';
          origenCiudad = terminales[0].ciudad || 'N/A';
        }
      }

      // Terminal de destino
      if (r.idTerminalDestino) {
        const [terminales] = await db.query(
          `SELECT codigo, nombreTerminal, ciudad FROM terminal WHERE idTerminal = ?`,
          [r.idTerminalDestino]
        );
        if (terminales.length > 0) {
          destinoCodigo = terminales[0].codigo || 'N/A';
          destinoNombre = terminales[0].nombreTerminal || 'N/A';
          destinoCiudad = terminales[0].ciudad || 'N/A';
        }
      }

      return { 
        ...r, 
        origenCodigo, 
        origenNombre,
        origenCiudad,
        destinoCodigo, 
        destinoNombre,
        destinoCiudad
      };
    }));

    // Transformar al formato esperado por el frontend
    const reservasFormateadas = reservasConTerminales.map(r => {
      const salida = r.salidaIso ? new Date(r.salidaIso) : new Date();
      const llegada = r.llegadaIso ? new Date(r.llegadaIso) : new Date();
      
      return {
        id: r.id,
        codigo: r.codigo,
        pasajero: `${r.nombrePasajero || ''} ${r.apellidoPasajero || ''}`.trim() || 'Pasajero',
        vuelo: `AL ${r.idViaje || 'N/A'}`,
        origen: r.origenCodigo,
        destino: r.destinoCodigo,
        salidaIso: r.salidaIso || new Date().toISOString(),
        hSalida: salida.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        hLlegada: llegada.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
        permiteCheckin: r.estado === 'confirmada' && salida > new Date(),
        equipaje: null, // TODO: obtener de tabla equipaje
        tarifa: null, // TODO: obtener de tabla viaje_tarifa
        paseUrl: null, // TODO: obtener de tabla ticket
        estado: r.estado,
        montoTotal: r.montoTotal,
      };
    });

    console.log(`✅ ${reservasFormateadas.length} reservas formateadas correctamente`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    res.json(reservasFormateadas);

  } catch (error) {
    console.error('❌ Error al obtener reservas:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    res.status(500).json({
      error: "Error al obtener reservas",
      mensaje: error.message,
    });
  }
});

/**
 * GET /api/reservas/:idReserva
 * Obtiene el detalle de una reserva específica
 */
router.get("/:idReserva", async (req, res) => {
  const db = req.app.get("db");
  const { idReserva } = req.params;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📄 OBTENIENDO DETALLE DE RESERVA');
  console.log('ID Reserva:', idReserva);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Consultar reserva completa
    const [reservas] = await db.query(
      `SELECT 
        r.idReserva as id,
        r.codigo_reserva as codigo,
        r.fecha_reserva as fechaReserva,
        r.estado,
        r.monto_total as montoTotal,
        r.moneda,
        
        -- Datos del viaje
        v.idViaje,
        v.salida as salidaIso,
        v.llegada as llegadaIso,
        
        -- Datos de origen/destino
        to_origen.codigo as origen,
        to_origen.nombreTerminal as origenNombre,
        to_destino.codigo as destino,
        to_destino.nombreTerminal as destinoNombre,
        
        -- Datos del pasajero
        p.nombrePasajero,
        p.apellidoPasajero,
        p.documento,
        
        -- Datos de la empresa
        e.nombreEmpresa as empresa
        
      FROM reserva r
      INNER JOIN viaje v ON r.idViaje = v.idViaje
      INNER JOIN ruta ru ON v.idRuta = ru.idRuta
      INNER JOIN terminal to_origen ON ru.idTerminalOrigen = to_origen.idTerminal
      INNER JOIN terminal to_destino ON ru.idTerminalDestino = to_destino.idTerminal
      LEFT JOIN pasajero p ON r.idReserva = p.idReserva
      LEFT JOIN empresa_equipo eq ON v.idEquipo = eq.idEquipo
      LEFT JOIN empresa e ON eq.idEmpresa = e.idEmpresa
      
      WHERE r.idReserva = ?
      LIMIT 1`,
      [idReserva]
    );

    if (reservas.length === 0) {
      return res.status(404).json({
        error: "Reserva no encontrada",
      });
    }

    const reserva = reservas[0];

    // Formatear fechas
    const salida = new Date(reserva.salidaIso);
    const llegada = new Date(reserva.llegadaIso);

    // ✅ Obtener desglose de reserva_detalle (con manejo de errores)
    let desglose = [];
    try {
      const [desgloseResult] = await db.query(
        `SELECT 
          tipo,
          descripcion,
          monto,
          metadata
        FROM reserva_detalle
        WHERE idReserva = ?
        ORDER BY idReservaDetalle`,
        [idReserva]
      );
      desglose = desgloseResult;
      console.log(`✅ ${desglose.length} items en el desglose`);
    } catch (error) {
      console.log('⚠️ Tabla reserva_detalle no existe o error:', error.message);
      desglose = [];
    }

    // Obtener asientos de la reserva (con manejo de errores)
    let asientos = [];
    try {
      const [asientosResult] = await db.query(
        `SELECT 
          a.numero,
          pa.cargo_extra as precio
        FROM pasajero_asiento pa
        INNER JOIN asiento a ON pa.idAsiento = a.idAsiento
        INNER JOIN pasajero p ON pa.idPasajero = p.idPasajero
        WHERE p.idReserva = ?`,
        [idReserva]
      );
      asientos = asientosResult;
    } catch (error) {
      console.log('⚠️ Error al obtener asientos:', error.message);
      asientos = [];
    }

    // Obtener cupón usado (si hay) - USANDO reserva_cupon
    let cupones = [];
    try {
      const [cuponesResult] = await db.query(
        `SELECT 
          cd.codigo,
          rc.montoAplicado as descuento
        FROM reserva_cupon rc
        INNER JOIN cupon_descuento cd ON rc.idCuponDescuento = cd.idCuponDescuento
        WHERE rc.idReserva = ?
        LIMIT 1`,
        [idReserva]
      );
      cupones = cuponesResult;
    } catch (error) {
      console.log('⚠️ Tabla reserva_cupon no existe o error:', error.message);
      cupones = [];
    }

    const detalle = {
      id: reserva.id,
      codigo: reserva.codigo,
      estado: reserva.estado,
      montoTotal: reserva.montoTotal,
      
      // Vuelo
      vuelo: `AL ${reserva.idViaje}`,
      origen: reserva.origen,
      destino: reserva.destino,
      origenNombre: reserva.origenNombre,
      destinoNombre: reserva.destinoNombre,
      empresa: reserva.empresa || 'AirLink',
      
      // Fechas
      salidaIso: reserva.salidaIso,
      llegadaIso: reserva.llegadaIso,
      hSalida: salida.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      hLlegada: llegada.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      
      // Pasajero
      pasajero: `${reserva.nombrePasajero || ''} ${reserva.apellidoPasajero || ''}`.trim(),
      documento: reserva.documento,
      
      // Desglose (desde reserva_detalle)
      desglose: desglose.map(d => {
        let metadata = null;
        try {
          metadata = d.metadata ? JSON.parse(d.metadata) : null;
        } catch (error) {
          console.log('⚠️ Error al parsear metadata:', error.message);
          metadata = null;
        }
        
        return {
          tipo: d.tipo,
          descripcion: d.descripcion,
          monto: Number(d.monto),
          metadata: metadata
        };
      }),
      
      // Asientos
      asientos: asientos.map(a => ({
        numero: a.numero,
        precio: Number(a.precio)
      })),
      
      // Cupón
      cupon: cupones.length > 0 ? {
        codigo: cupones[0].codigo,
        descuento: Number(cupones[0].descuento)
      } : null,
    };

    console.log('✅ Detalle de reserva obtenido');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    res.json(detalle);

  } catch (error) {
    console.error('❌ Error al obtener detalle:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    res.status(500).json({
      error: "Error al obtener detalle de reserva",
      mensaje: error.message,
    });
  }
});

export { router };