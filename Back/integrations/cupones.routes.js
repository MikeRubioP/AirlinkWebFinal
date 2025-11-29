// integrations/cupones.routes.js
// ADAPTADO para usar la tabla cupon_descuento EXISTENTE
import express from "express";

const router = express.Router();

/**
 * POST /api/cupones/validar
 * Valida un cupón y devuelve el descuento si es válido
 * 
 * IMPORTANTE: El descuento se aplica al TOTAL GLOBAL
 * (vuelos + asientos + buses)
 */
router.post("/validar", async (req, res) => {
  const db = req.app.get("db");
  const { codigo, email, totalCompra } = req.body;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎫 VALIDANDO CUPÓN');
  console.log('Código:', codigo);
  console.log('Email:', email);
  console.log('Total Compra:', totalCompra);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Validaciones básicas
    if (!codigo || !email || !totalCompra) {
      return res.status(400).json({
        valido: false,
        mensaje: "Faltan datos requeridos (código, email, totalCompra)",
      });
    }

    // 1. Buscar el cupón (usando solo los campos que existen en tu tabla)
    const [cupones] = await db.query(
      `SELECT 
        cd.idCuponDescuento,
        cd.codigo,
        cd.valor,
        cd.uso_maximo,
        cd.uso_actual,
        cd.fecha_inicio,
        cd.fecha_fin,
        cd.activo,
        tc.nombreTipoCupon
      FROM cupon_descuento cd
      JOIN tipo_cupon tc ON cd.idTipoCupon = tc.idTipoCupon
      WHERE cd.codigo = ?`,
      [codigo.trim().toUpperCase()]
    );

    if (cupones.length === 0) {
      console.log('❌ Cupón no encontrado');
      return res.status(404).json({
        valido: false,
        mensaje: "Código de cupón no válido",
      });
    }

    const cupon = cupones[0];
    console.log('✅ Cupón encontrado:', cupon.codigo);

    // 2. Verificar si está activo
    if (!cupon.activo) {
      console.log('❌ Cupón inactivo');
      return res.status(400).json({
        valido: false,
        mensaje: "Este cupón ya no está disponible",
      });
    }

    // 3. Verificar fechas de vigencia
    const ahora = new Date();
    const fechaInicio = new Date(cupon.fecha_inicio);
    const fechaFin = new Date(cupon.fecha_fin);

    if (ahora < fechaInicio) {
      console.log('❌ Cupón aún no válido');
      return res.status(400).json({
        valido: false,
        mensaje: `Este cupón será válido a partir del ${fechaInicio.toLocaleDateString('es-CL')}`,
      });
    }

    if (ahora > fechaFin) {
      console.log('❌ Cupón expirado');
      return res.status(400).json({
        valido: false,
        mensaje: `Este cupón expiró el ${fechaFin.toLocaleDateString('es-CL')}`,
      });
    }

    // 4. Verificar si tiene usos disponibles (si uso_maximo no es NULL)
    if (cupon.uso_maximo !== null && cupon.uso_actual >= cupon.uso_maximo) {
      console.log('❌ Cupón agotado');
      return res.status(400).json({
        valido: false,
        mensaje: "Este cupón ya no tiene usos disponibles",
      });
    }

    // 5. Verificar si el usuario ya lo usó (máximo 1 vez por usuario)
    const [usosUsuario] = await db.query(
      `SELECT COUNT(*) as usos 
       FROM cupon_usuario 
       WHERE idCuponDescuento = ? AND email = ?`,
      [cupon.idCuponDescuento, email.toLowerCase()]
    );

    if (usosUsuario[0].usos >= 1) {
      console.log('❌ Usuario ya usó el cupón');
      return res.status(400).json({
        valido: false,
        mensaje: "Ya has usado este cupón anteriormente",
      });
    }

    // 6. Calcular el descuento (SIEMPRE es descuento fijo en tu caso)
    // El descuento se aplica al TOTAL GLOBAL (vuelos + asientos + buses)
    let descuento = Number(cupon.valor);

    // No permitir que el descuento sea mayor que el total
    if (descuento > Number(totalCompra)) {
      descuento = Number(totalCompra);
    }

    const totalFinal = Number(totalCompra) - descuento;

    console.log('✅ Cupón válido');
    console.log('Descuento:', descuento);
    console.log('Total Original:', totalCompra);
    console.log('Total Final:', totalFinal);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 7. Devolver respuesta exitosa
    res.json({
      valido: true,
      mensaje: `Cupón ${cupon.codigo} aplicado correctamente`,
      cupon: {
        idCuponDescuento: cupon.idCuponDescuento,
        codigo: cupon.codigo,
        tipo: cupon.nombreTipoCupon,
        valorOriginal: Number(cupon.valor),
      },
      descuento: descuento,
      totalOriginal: Number(totalCompra),
      totalFinal: totalFinal,
      ahorro: descuento,
    });

  } catch (error) {
    console.error('❌ Error al validar cupón:', error);
    res.status(500).json({
      valido: false,
      mensaje: "Error al validar el cupón",
      error: error.message,
    });
  }
});

/**
 * POST /api/cupones/aplicar
 * Registra el uso de un cupón (se llama al confirmar el pago)
 */
router.post("/aplicar", async (req, res) => {
  const db = req.app.get("db");
  const { 
    codigo, 
    email, 
    idReserva, 
    montoDescuento, 
    montoOriginal, 
    montoFinal 
  } = req.body;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💾 APLICANDO CUPÓN');
  console.log('Código:', codigo);
  console.log('Reserva:', idReserva);
  console.log('Descuento:', montoDescuento);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let connection;

  try {
    // Validaciones
    if (!codigo || !email || !montoDescuento || !montoOriginal || !montoFinal) {
      return res.status(400).json({
        success: false,
        mensaje: "Faltan datos requeridos",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Obtener el cupón
    const [cupones] = await connection.query(
      `SELECT idCuponDescuento, uso_actual 
       FROM cupon_descuento 
       WHERE codigo = ? AND activo = 1`,
      [codigo.trim().toUpperCase()]
    );

    if (cupones.length === 0) {
      throw new Error('Cupón no encontrado o inactivo');
    }

    const cupon = cupones[0];

    // 2. Registrar el uso en cupon_usuario
    await connection.query(
      `INSERT INTO cupon_usuario (
        idCuponDescuento,
        email,
        idReserva,
        monto_descuento_aplicado,
        monto_compra_original,
        monto_compra_final
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        cupon.idCuponDescuento,
        email.toLowerCase(),
        idReserva || null,
        montoDescuento,
        montoOriginal,
        montoFinal
      ]
    );

    // 3. Incrementar uso_actual del cupón
    await connection.query(
      `UPDATE cupon_descuento 
       SET uso_actual = uso_actual + 1 
       WHERE idCuponDescuento = ?`,
      [cupon.idCuponDescuento]
    );

    // 4. Si hay idReserva, registrar en reserva_cupon (si esa tabla existe)
    if (idReserva) {
      try {
        await connection.query(
          `INSERT INTO reserva_cupon (
            idReserva,
            idCuponDescuento,
            montoAplicado
          ) VALUES (?, ?, ?)`,
          [idReserva, cupon.idCuponDescuento, montoDescuento]
        );
      } catch (e) {
        // Si la tabla no existe, continuar sin error
        console.log('⚠️ Tabla reserva_cupon no existe o error:', e.message);
      }
    }

    await connection.commit();

    console.log('✅ Cupón aplicado correctamente');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    res.json({
      success: true,
      mensaje: 'Cupón aplicado correctamente',
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('❌ Error al aplicar cupón:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al aplicar el cupón',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/cupones/activos
 * Obtiene todos los cupones activos y vigentes
 */
router.get("/activos", async (req, res) => {
  const db = req.app.get("db");

  try {
    const [cupones] = await db.query(
      `SELECT 
        cd.codigo,
        cd.valor,
        cd.fecha_fin,
        cd.uso_maximo,
        cd.uso_actual,
        tc.nombreTipoCupon
      FROM cupon_descuento cd
      JOIN tipo_cupon tc ON cd.idTipoCupon = tc.idTipoCupon
      WHERE cd.activo = 1 
      AND cd.fecha_fin >= CURDATE()
      ORDER BY cd.valor DESC`
    );

    res.json({
      success: true,
      cupones: cupones.map(c => ({
        codigo: c.codigo,
        descuento: Number(c.valor),
        tipo: c.nombreTipoCupon,
        fechaVencimiento: c.fecha_fin,
        usosDisponibles: c.uso_maximo ? (c.uso_maximo - c.uso_actual) : null,
      })),
    });
  } catch (error) {
    console.error('Error al obtener cupones activos:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener cupones',
      error: error.message,
    });
  }
});

export { router };