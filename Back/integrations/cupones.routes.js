// integrations/cupones.routes.js
import express from "express";
const router = express.Router();

// ========================================
// VALIDAR CUPÓN
// ========================================
router.post("/validar", async (req, res) => {
  const db = req.app.get("db");
  const { codigo, monto } = req.body;

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎫 VALIDACIÓN DE CUPÓN');
    console.log('Código:', codigo);
    console.log('Monto de la compra:', monto);

    if (!codigo || !monto) {
      return res.status(400).json({
        mensaje: 'Código y monto son requeridos'
      });
    }

    // Buscar el cupón en la base de datos
    const [cupones] = await db.query(
      `SELECT 
        idCuponDescuento,
        codigo,
        idTipoCupon,
        valor,
        uso_maximo,
        uso_actual,
        fecha_inicio,
        fecha_fin,
        activo
      FROM cupon_descuento
      WHERE codigo = ? AND activo = 1`,
      [codigo.toUpperCase()]
    );

    if (cupones.length === 0) {
      console.log('❌ Cupón no encontrado o inactivo');
      return res.status(404).json({
        mensaje: 'Cupón inválido o no existe'
      });
    }

    const cupon = cupones[0];
    const ahora = new Date();

    // Validar fecha de inicio
    if (cupon.fecha_inicio && new Date(cupon.fecha_inicio) > ahora) {
      console.log('❌ Cupón aún no está vigente');
      return res.status(400).json({
        mensaje: 'Este cupón aún no está disponible'
      });
    }

    // Validar fecha de expiración
    if (cupon.fecha_fin && new Date(cupon.fecha_fin) < ahora) {
      console.log('❌ Cupón expirado');
      return res.status(400).json({
        mensaje: 'Este cupón ha expirado'
      });
    }

    // Validar usos máximos
    if (cupon.uso_maximo && cupon.uso_actual >= cupon.uso_maximo) {
      console.log('❌ Cupón alcanzó uso máximo');
      return res.status(400).json({
        mensaje: 'Este cupón ya no está disponible'
      });
    }

    // Determinar tipo de cupón basado en idTipoCupon
    // idTipoCupon = 1 → Porcentaje
    // idTipoCupon = 2 → Monto Fijo
    let tipoCuponNombre = 'porcentaje';
    let descripcion = '';
    
    if (cupon.idTipoCupon === 1) {
      tipoCuponNombre = 'porcentaje';
      descripcion = `${cupon.valor}% de descuento`;
    } else if (cupon.idTipoCupon === 2) {
      tipoCuponNombre = 'monto_fijo';
      descripcion = `$${cupon.valor} de descuento`;
    }

    // Calcular el descuento
    let descuentoCalculado = 0;
    if (tipoCuponNombre === 'porcentaje') {
      descuentoCalculado = Math.round((Number(monto) * Number(cupon.valor)) / 100);
    } else if (tipoCuponNombre === 'monto_fijo') {
      descuentoCalculado = Number(cupon.valor);
    }

    // VALIDACIÓN: El descuento no puede dejar el total en negativo o muy bajo
    const MONTO_MINIMO_DESPUES_DESCUENTO = 10000; // Mínimo $10,000 después del descuento
    const montoMaximoDescuento = Number(monto) - MONTO_MINIMO_DESPUES_DESCUENTO;
    
    if (descuentoCalculado > montoMaximoDescuento) {
      console.log('❌ Descuento excede el máximo permitido');
      console.log(`   Monto compra: $${monto}`);
      console.log(`   Descuento solicitado: $${descuentoCalculado}`);
      console.log(`   Descuento máximo: $${montoMaximoDescuento}`);
      console.log(`   Total resultaría: $${Number(monto) - descuentoCalculado}`);
      
      const montoMinimoRequerido = descuentoCalculado + MONTO_MINIMO_DESPUES_DESCUENTO;
      
      return res.status(400).json({
        mensaje: `Este cupón requiere un monto mínimo de compra de $${montoMinimoRequerido.toLocaleString('es-CL')}. Tu compra actual es de $${Number(monto).toLocaleString('es-CL')}`
      });
    }

    // No permitir que el descuento sea mayor al monto total
    if (descuentoCalculado > Number(monto)) {
      descuentoCalculado = Number(monto);
    }

    console.log('✅ Cupón válido');
    console.log('ID Tipo:', cupon.idTipoCupon);
    console.log('Tipo:', tipoCuponNombre);
    console.log('Valor:', cupon.valor);
    console.log('Descuento calculado:', descuentoCalculado);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.json({
      idCuponDescuento: cupon.idCuponDescuento,
      codigo: cupon.codigo,
      descripcion: descripcion,
      tipoCupon: tipoCuponNombre,
      valorDescuento: Number(cupon.valor),
      descuentoCalculado: descuentoCalculado
    });

  } catch (error) {
    console.error('❌ Error al validar cupón:', error);
    res.status(500).json({
      mensaje: 'Error al validar el cupón',
      error: error.message
    });
  }
});

// ========================================
// LISTAR CUPONES ACTIVOS
// ========================================
router.get("/activos", async (req, res) => {
  const db = req.app.get("db");

  try {
    const [cupones] = await db.query(
      `SELECT 
        idCuponDescuento,
        codigo,
        idTipoCupon,
        valor,
        fecha_inicio,
        fecha_fin,
        uso_maximo,
        uso_actual,
        activo
      FROM cupon_descuento
      WHERE activo = 1
      AND (fecha_fin IS NULL OR fecha_fin >= NOW())
      ORDER BY fecha_inicio DESC`
    );

    res.json({
      success: true,
      cupones: cupones
    });

  } catch (error) {
    console.error('❌ Error al listar cupones:', error);
    res.status(500).json({
      mensaje: 'Error al obtener cupones',
      error: error.message
    });
  }
});

export { router };