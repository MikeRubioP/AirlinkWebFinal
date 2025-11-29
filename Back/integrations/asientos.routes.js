// integrations/asientos.routes.js
import express from "express";

const router = express.Router();

/**
 * GET /api/asientos/:idViaje
 * Obtiene los asientos disponibles para un viaje
 */
router.get("/:idViaje", async (req, res) => {
  const db = req.app.get("db");
  const { idViaje } = req.params;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🪑 OBTENIENDO ASIENTOS');
  console.log('ID Viaje:', idViaje);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Si el ID es "mock-" es un viaje de prueba, generar asientos mock
    if (String(idViaje).startsWith('mock-')) {
      console.log('✅ Generando asientos MOCK');
      const asientosMock = generarAsientosMock();
      return res.json({
        success: true,
        asientos: asientosMock,
      });
    }

    // Obtener asientos reales de la base de datos con información completa
    const [asientos] = await db.query(
      `SELECT 
        a.idAsiento,
        a.numero,
        a.disponible,
        cc.nombreCabinaClase as clase,
        cc.idCabinaClase
      FROM asiento a
      JOIN cabina_clase cc ON a.idCabinaClase = cc.idCabinaClase
      WHERE a.idViaje = ?
      ORDER BY a.numero`,
      [idViaje]
    );

    if (asientos.length === 0) {
      console.log('⚠️ No hay asientos para este viaje, generando...');
      // Si no hay asientos, generarlos automáticamente
      await generarAsientosParaViaje(db, idViaje);
      
      // Volver a consultar
      const [nuevosAsientos] = await db.query(
        `SELECT 
          a.idAsiento,
          a.numero,
          a.disponible,
          cc.nombreCabinaClase as clase,
          cc.idCabinaClase
        FROM asiento a
        JOIN cabina_clase cc ON a.idCabinaClase = cc.idCabinaClase
        WHERE a.idViaje = ?
        ORDER BY a.numero`,
        [idViaje]
      );
      
      console.log(`✅ ${nuevosAsientos.length} asientos generados`);
      
      // Transformar asientos con tipo, precio y características
      const asientosConInfo = transformarAsientos(nuevosAsientos);
      
      return res.json({
        success: true,
        asientos: asientosConInfo,
      });
    }

    console.log(`✅ ${asientos.length} asientos encontrados`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Transformar asientos con tipo, precio y características
    const asientosConInfo = transformarAsientos(asientos);

    res.json({
      success: true,
      asientos: asientosConInfo,
    });

  } catch (error) {
    console.error('❌ Error al obtener asientos:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener asientos",
      error: error.message,
    });
  }
});

/**
 * POST /api/asientos/reservar
 * Reserva asientos para un pasajero
 */
router.post("/reservar", async (req, res) => {
  const db = req.app.get("db");
  const { idPasajero, asientos } = req.body;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🪑 RESERVANDO ASIENTOS');
  console.log('ID Pasajero:', idPasajero);
  console.log('Asientos:', asientos);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    for (const asiento of asientos) {
      // Marcar asiento como no disponible
      await connection.query(
        `UPDATE asiento 
         SET disponible = 0 
         WHERE idAsiento = ?`,
        [asiento.idAsiento]
      );

      // Crear relación pasajero-asiento
      await connection.query(
        `INSERT INTO pasajero_asiento (
          idPasajero,
          idAsiento,
          cargo_extra
        ) VALUES (?, ?, ?)`,
        [idPasajero, asiento.idAsiento, asiento.precio || 0]
      );
    }

    await connection.commit();

    console.log('✅ Asientos reservados correctamente');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    res.json({
      success: true,
      mensaje: 'Asientos reservados correctamente',
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error al reservar asientos:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    res.status(500).json({
      success: false,
      mensaje: 'Error al reservar asientos',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Transforma asientos de BD al formato esperado por el frontend
 */
function transformarAsientos(asientos) {
  const PRECIOS_ASIENTOS = {
    premium: 25000,
    confort: 15000,
    salidaEmergencia: 12000,
    primeraFila: 10000,
    estandar: 8000,
  };

  return asientos.map(asiento => {
    const numero = asiento.numero;
    const fila = parseInt(numero.match(/\d+/)[0]);
    const letra = numero.match(/[A-F]/)[0];
    
    let tipo = 'estandar';
    let precio = PRECIOS_ASIENTOS.estandar;
    let caracteristicas = [];

    // Determinar tipo según fila
    if (fila <= 3) {
      tipo = 'premium';
      precio = PRECIOS_ASIENTOS.premium;
      caracteristicas.push('Primera Clase', 'Espacio Extra', 'Servicio Premium');
    } else if (fila <= 7) {
      tipo = 'confort';
      precio = PRECIOS_ASIENTOS.confort;
      caracteristicas.push('Confort+', 'Más Espacio');
    } else if (fila === 10 || fila === 20) {
      tipo = 'salidaEmergencia';
      precio = PRECIOS_ASIENTOS.salidaEmergencia;
      caracteristicas.push('Salida de Emergencia', 'Espacio Extra para Piernas');
    } else if (fila === 8) {
      tipo = 'primeraFila';
      precio = PRECIOS_ASIENTOS.primeraFila;
      caracteristicas.push('Primera Fila', 'Sin asiento adelante');
    }

    // Características adicionales por letra
    if (letra === 'A' || letra === 'F') {
      caracteristicas.push('Ventana');
    } else if (letra === 'C' || letra === 'D') {
      caracteristicas.push('Pasillo');
    } else {
      caracteristicas.push('Centro');
    }

    return {
      idAsiento: asiento.idAsiento,
      numero: asiento.numero,
      disponible: asiento.disponible ? 1 : 0,
      tipo,
      precio,
      caracteristicas,
      fila,
      letra,
      clase: asiento.clase,
      idCabinaClase: asiento.idCabinaClase,
    };
  });
}

/**
 * Genera asientos mock para viajes de prueba
 */
function generarAsientosMock() {
  const asientos = [];
  const filas = 30;
  const letras = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  for (let fila = 1; fila <= filas; fila++) {
    for (const letra of letras) {
      const numero = `${fila}${letra}`;
      const disponible = Math.random() > 0.3; // 70% disponibles
      
      asientos.push({
        idAsiento: `mock-${numero}`,
        numero: numero,
        disponible: disponible ? 1 : 0,
        clase: fila <= 3 ? 'Premium' : 'Economy',
        idCabinaClase: fila <= 3 ? 1 : 2,
      });
    }
  }
  
  return asientos;
}

/**
 * Genera asientos automáticamente para un viaje
 */
async function generarAsientosParaViaje(db, idViaje) {
  const filas = 30;
  const letras = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  // Precios según tipo de asiento
  const PRECIOS_ASIENTOS = {
    premium: 25000,
    confort: 15000,
    salidaEmergencia: 12000,
    primeraFila: 10000,
    estandar: 8000,
  };
  
  // Obtener ID de clases de cabina (asumiendo que existen)
  const [clases] = await db.query(
    `SELECT idCabinaClase, nombreCabinaClase 
     FROM cabina_clase 
     LIMIT 2`
  );
  
  if (clases.length === 0) {
    // Si no hay clases, crearlas
    await db.query(
      `INSERT INTO cabina_clase (nombreCabinaClase, prioridad, descripcion) 
       VALUES 
       ('Premium', 1, 'Clase Premium con espacio extra'),
       ('Economy', 2, 'Clase económica estándar')`
    );
    
    const [nuevasClases] = await db.query(
      `SELECT idCabinaClase, nombreCabinaClase 
       FROM cabina_clase 
       ORDER BY prioridad`
    );
    
    clases.push(...nuevasClases);
  }
  
  const idPremium = clases[0].idCabinaClase;
  const idEconomy = clases.length > 1 ? clases[1].idCabinaClase : clases[0].idCabinaClase;
  
  // Generar asientos con tipos y precios
  for (let fila = 1; fila <= filas; fila++) {
    for (const letra of letras) {
      const numero = `${fila}${letra}`;
      let idCabina = idEconomy;
      let tipo = 'estandar';
      let precio = PRECIOS_ASIENTOS.estandar;
      let caracteristicas = [];
      
      // Determinar tipo de asiento según fila
      if (fila <= 3) {
        // Primera clase (filas 1-3)
        tipo = 'premium';
        precio = PRECIOS_ASIENTOS.premium;
        idCabina = idPremium;
        caracteristicas.push('Primera Clase', 'Espacio Extra', 'Servicio Premium');
      } else if (fila <= 7) {
        // Confort+ (filas 4-7)
        tipo = 'confort';
        precio = PRECIOS_ASIENTOS.confort;
        caracteristicas.push('Confort+', 'Más Espacio');
      } else if (fila === 10 || fila === 20) {
        // Salida de emergencia (filas 10 y 20)
        tipo = 'salidaEmergencia';
        precio = PRECIOS_ASIENTOS.salidaEmergencia;
        caracteristicas.push('Salida de Emergencia', 'Espacio Extra para Piernas');
      } else if (fila === 8) {
        // Primera fila de económica
        tipo = 'primeraFila';
        precio = PRECIOS_ASIENTOS.primeraFila;
        caracteristicas.push('Primera Fila', 'Sin asiento adelante');
      }
      
      // Características adicionales por letra
      if (letra === 'A' || letra === 'F') {
        caracteristicas.push('Ventana');
      } else if (letra === 'C' || letra === 'D') {
        caracteristicas.push('Pasillo');
      } else {
        caracteristicas.push('Centro');
      }
      
      await db.query(
        `INSERT INTO asiento (
          idViaje, 
          numero, 
          idCabinaClase, 
          disponible
        ) VALUES (?, ?, ?, 1)`,
        [idViaje, numero, idCabina]
      );
    }
  }
}

export { router };