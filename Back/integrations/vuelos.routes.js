// AirLink-Backend/integrations/vuelos.routes.js
import express from "express";

export const router = express.Router();

const like = (s) => `%${s}%`;

// Util opcional para TZ (si guardas v.salida en UTC y comparas por fecha local)
const dateCol = (tz) =>
  tz ? `DATE(CONVERT_TZ(v.salida,'UTC','${tz}'))` : `DATE(v.salida)`;
const timeCol = (col, tz) =>
  tz ? `TIME_FORMAT(CONVERT_TZ(${col},'UTC','${tz}'), '%H:%i')` : `TIME_FORMAT(${col}, '%H:%i')`;

/* ===========================
   BUSCAR VUELOS
   GET /vuelos/buscar?origen=SCL&destino=PMC&fecha=2025-11-03&clase=eco[&tz=America/Santiago]
=========================== */
router.get("/buscar", async (req, res) => {
  try {
    const db = req.app.get("db");
    const { origen = "SCL", destino, fecha, clase, tz } = req.query;

    if (!destino || !fecha) {
      return res
        .status(400)
        .json({ error: "Faltan parámetros requeridos", message: "Se requiere destino y fecha" });
    }

    // Si viene ciudad en lugar de código IATA (3 letras), convertir
    let destinoCodigo = destino;
    if (destino && destino.length > 3) {
      const [terminalResult] = await db.query(
        `SELECT codigo FROM terminal WHERE ciudad LIKE ? LIMIT 1`,
        [like(destino)]
      );
      if (terminalResult.length > 0) destinoCodigo = terminalResult[0].codigo;
    }

    const [vuelos] = await db.query(
      `
      SELECT
        v.idViaje,
        ${dateCol(tz)}                              AS fecha,
        ${timeCol("v.salida", tz)}                 AS horaSalida,
        ${timeCol("v.llegada", tz)}                AS horaLlegada,
        TIMESTAMPDIFF(MINUTE, v.salida, v.llegada) AS duracion,

        t1.codigo          AS origenCodigo,
        t1.ciudad          AS origenCiudad,
        t1.nombreTerminal  AS origenNombre,

        t2.codigo          AS destinoCodigo,
        t2.ciudad          AS destinoCiudad,
        t2.nombreTerminal  AS destinoNombre,

        e.nombreEmpresa    AS empresa,
        e.logo             AS empresaLogo,

        eq.modelo,
        eq.matricula,

        MIN(vt.precio)                      AS precio,
        COUNT(DISTINCT vt.idTarifa)         AS tarifasDisponibles,
        SUM(vt.cupos)                       AS asientosDisponibles,
        v.estado
      FROM viaje v
      JOIN ruta            r   ON v.idRuta           = r.idRuta
      JOIN terminal        t1  ON r.idTerminalOrigen = t1.idTerminal
      JOIN terminal        t2  ON r.idTerminalDestino= t2.idTerminal
      JOIN empresa_equipo  eq  ON v.idEquipo         = eq.idEquipo
      JOIN empresa         e   ON eq.idEmpresa       = e.idEmpresa
      LEFT JOIN viaje_tarifa vt ON v.idViaje         = vt.idViaje
      WHERE t1.codigo = ? 
        AND t2.codigo = ? 
        AND ${dateCol(tz)} = ?
        AND v.estado = 'programado'
        AND (vt.cupos IS NULL OR vt.cupos > 0)      -- más tolerante si no hay tarifas/cupos aún
      GROUP BY v.idViaje, v.salida, v.llegada,
               t1.codigo, t1.ciudad, t1.nombreTerminal,
               t2.codigo, t2.ciudad, t2.nombreTerminal,
               e.nombreEmpresa, e.logo, eq.modelo, eq.matricula, v.estado
      ORDER BY MIN(vt.precio) ASC
      `,
      [origen, destinoCodigo, fecha]
    );

    res.json(vuelos);
  } catch (error) {
    console.error("❌ Error buscando vuelos:", error);
    res.status(500).json({ error: "Error al buscar vuelos", message: error.message });
  }
});

/* ===========================
   DISPONIBILIDAD POR DÍA (tira semanal)
   GET /vuelos/disponibilidad?origen=SCL&destino=PMC&desde=2025-11-03&dias=7[&tz=America/Santiago]
   Devuelve [{fecha, vuelos, minPrecio}]
=========================== */
router.get("/disponibilidad", async (req, res) => {
  try {
    const db = req.app.get("db");
    const { origen = "SCL", destino, desde, dias = 7, tz } = req.query;

    if (!destino || !desde) {
      return res.status(400).json({
        error: "Parámetros requeridos: destino, desde (YYYY-MM-DD)",
      });
    }

    // Si viene ciudad en vez de código IATA
    let destinoCodigo = destino;
    if (destino && destino.length > 3) {
      const [terminalResult] = await db.query(
        `SELECT codigo FROM terminal WHERE ciudad LIKE ? LIMIT 1`,
        [like(destino)]
      );
      if (terminalResult.length > 0) destinoCodigo = terminalResult[0].codigo;
    }

    const q = `
      SELECT
        ${dateCol(tz)} AS fecha,
        COUNT(DISTINCT v.idViaje) AS vuelos,
        MIN(vt.precio) AS minPrecio
      FROM viaje v
      JOIN ruta r               ON v.idRuta = r.idRuta
      JOIN terminal t1          ON r.idTerminalOrigen  = t1.idTerminal
      JOIN terminal t2          ON r.idTerminalDestino = t2.idTerminal
      LEFT JOIN viaje_tarifa vt ON vt.idViaje = v.idViaje
      WHERE t1.codigo = ? AND t2.codigo = ?
        AND ${dateCol(tz)} BETWEEN ? AND DATE_ADD(?, INTERVAL ? DAY)
        AND v.estado = 'programado'
        AND (vt.cupos IS NULL OR vt.cupos > 0)
      GROUP BY ${dateCol(tz)}
      ORDER BY fecha ASC
    `;
    const [rows] = await db.query(q, [origen, destinoCodigo, desde, desde, Number(dias) - 1]);

    res.json(rows); // [{fecha:'2025-11-03', vuelos:2, minPrecio:87990}, ...]
  } catch (error) {
    console.error("❌ Error en disponibilidad:", error);
    res.status(500).json({ error: "Error al obtener disponibilidad", message: error.message });
  }
});

/* ===========================
   OBTENER CÓDIGO DE TERMINAL DESDE CIUDAD
   GET /vuelos/destinos/:ciudad/codigo
=========================== */
router.get("/destinos/:ciudad/codigo", async (req, res) => {
  try {
    const db = req.app.get("db");
    const { ciudad } = req.params;

    const [result] = await db.query(
      `SELECT codigo, ciudad, nombreTerminal FROM terminal WHERE ciudad LIKE ? LIMIT 1`,
      [like(ciudad)]
    );

    if (result.length > 0) return res.json(result[0]);
    return res.status(404).json({ error: "Ciudad no encontrada", ciudad });
  } catch (error) {
    console.error("❌ Error obteniendo código de ciudad:", error);
    res.status(500).json({ error: "Error del servidor", message: error.message });
  }
});

/* ===========================
   LISTAR DESTINOS
   GET /vuelos/destinos
=========================== */
router.get("/destinos", async (req, res) => {
  try {
    const db = req.app.get("db");
    const [destinos] = await db.query(`
      SELECT DISTINCT
        t.idTerminal, t.codigo, t.ciudad, t.nombreTerminal, t.imagen,
        tt.nombreTipoTerminal AS tipo
      FROM terminal t
      JOIN tipo_terminal tt ON t.idTipoTerminal = tt.idTipoTerminal
      WHERE t.activo = 1
      ORDER BY t.ciudad
    `);
    res.json(destinos);
  } catch (error) {
    console.error("❌ Error obteniendo destinos:", error);
    res.status(500).json({ error: "Error al obtener destinos", message: error.message });
  }
});

/* ===========================
   TARIFAS POR VIAJE (modal de tarifas)
   GET /vuelos/viajes/:idViaje/tarifas
=========================== */
router.get("/viajes/:idViaje/tarifas", async (req, res) => {
  const db = req.app.get("db");
  const { idViaje } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT
        vt.idViajeTarifa,
        vt.idTarifa,
        t.codigoTarifa,
        t.nombreTarifa,
        vt.precio,
        vt.moneda,
        vt.cupos,
        t.equipaje_incl_kg,
        t.cambios,
        t.reembolsable,
        t.condiciones,
        cc.nombreCabinaClase,
        cc.descripcion AS descripcionCabina
      FROM viaje_tarifa vt
      JOIN tarifa       t  ON t.idTarifa       = vt.idTarifa
      JOIN cabina_clase cc ON cc.idCabinaClase = t.idCabinaClase
      WHERE vt.idViaje = ?
      ORDER BY vt.idTarifa ASC
      `,
      [idViaje]
    );

    return res.json(rows);
  } catch (err) {
    console.error("❌ Error obteniendo tarifas:", err);
    res.status(500).json({ error: "Error obteniendo tarifas", message: err.message });
  }
});

/* ===========================
   DETALLE DE UN VIAJE
   GET /vuelos/:idViaje
=========================== */
router.get("/:idViaje", async (req, res) => {
  try {
    const db = req.app.get("db");
    const { idViaje } = req.params;

    const [vuelo] = await db.query(
      `
      SELECT 
        v.idViaje, v.salida, v.llegada, v.estado,
        t1.codigo         AS origenCodigo,
        t1.ciudad         AS origenCiudad,
        t1.nombreTerminal AS origenNombre,
        t2.codigo         AS destinoCodigo,
        t2.ciudad         AS destinoCiudad,
        t2.nombreTerminal AS destinoNombre,
        e.nombreEmpresa   AS empresa,
        e.logo            AS empresaLogo,
        eq.modelo,
        eq.capacidad,
        r.distanciaKm,
        r.duracionEstimadaMin
      FROM viaje v
      JOIN ruta            r   ON v.idRuta            = r.idRuta
      JOIN terminal        t1  ON r.idTerminalOrigen  = t1.idTerminal
      JOIN terminal        t2  ON r.idTerminalDestino = t2.idTerminal
      JOIN empresa_equipo  eq  ON v.idEquipo          = eq.idEquipo
      JOIN empresa         e   ON eq.idEmpresa        = e.idEmpresa
      WHERE v.idViaje = ?
      LIMIT 1
      `,
      [idViaje]
    );

    if (vuelo.length === 0) {
      return res.status(404).json({ error: "Vuelo no encontrado" });
    }

    const [tarifas] = await db.query(
      `
      SELECT 
        vt.idViajeTarifa, vt.idTarifa, vt.precio, vt.moneda, vt.cupos,
        t.codigoTarifa, t.nombreTarifa, t.equipaje_incl_kg, t.cambios, t.reembolsable, t.condiciones,
        cc.nombreCabinaClase, cc.descripcion AS descripcionCabina
      FROM viaje_tarifa vt
      JOIN tarifa       t  ON t.idTarifa       = vt.idTarifa
      JOIN cabina_clase cc ON cc.idCabinaClase = t.idCabinaClase
      WHERE vt.idViaje = ? AND t.activo = 1
      ORDER BY vt.precio ASC
      `,
      [idViaje]
    );

    res.json({ vuelo: vuelo[0], tarifas });
  } catch (error) {
    console.error("❌ Error obteniendo detalles del vuelo:", error);
    res.status(500).json({ error: "Error al obtener detalles del vuelo", message: error.message });
  }
});
