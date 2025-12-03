// integrations/pagos.routes.js - CON SOPORTE PARA CUPONES
import express from "express";
import Stripe from "stripe";
import paypal from "@paypal/checkout-server-sdk";
import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// ========================================
// CONFIGURACIÓN DE STRIPE
// ========================================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// CLP es moneda sin decimales en Stripe
const toUnitAmountCLP = (v) => Math.round(Number(v || 0));

// ========================================
// CONFIGURACIÓN DE PAYPAL
// ========================================
const clientId =
  "AV1mix21GYzSkc8ogOlxj0IOSpGAKzHRiXYdCHGHh4eKHLKEluulPdS2tmGiJ6TUo3OrLvUQTr4bjScm";
const clientSecret =
  "EFj4o3c2J33gvRT-UmyCa_BQW2mmCdjBt2rxajVP-bcPTT2plD1lNNDAmcWuMm_NkYoqxLGPItfk5eTS";
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const paypalClient = new paypal.core.PayPalHttpClient(environment);

// ========================================
// CONFIGURACIÓN DE MERCADO PAGO
// ========================================
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// ========================================
// FUNCIÓN AUXILIAR: Generar código de reserva único
// ========================================
function generarCodigoReserva() {
  const fecha = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RES${fecha}${random}`;
}

// ========================================
// CREAR RESERVA EN LA BASE DE DATOS (CON CUPONES)
// ========================================
router.post("/crear-reserva", async (req, res) => {
  const db = req.app.get("db");
  
  const { 
    pasajero, 
    vuelo = null,
    vueloIda = null,
    vueloVuelta = null,
    vuelos = [],
    buses = [],
    asientos = null,
    cupon = null, // ✅ Recibir cupón
    subtotal = null, // ✅ Recibir subtotal
    descuento = 0, // ✅ Recibir descuento
    total, 
    metodoPago 
  } = req.body;

  let connection;

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 PAYLOAD RECIBIDO EN BACKEND:');
    console.log('Pasajero:', pasajero?.nombre, pasajero?.apellido);
    console.log('Subtotal:', subtotal);
    console.log('Cupón:', cupon?.codigo || 'Sin cupón');
    console.log('Descuento:', descuento);
    console.log('Total Final:', total);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Validaciones mínimas
    if (!pasajero || !total) {
      return res.status(400).json({
        error: "Datos incompletos",
        required: ["pasajero", "total"],
      });
    }

    // Construir array de vuelos desde cualquier formato
    let vuelosArray = [];
    
    if (vuelos && vuelos.length > 0) {
      vuelosArray = vuelos;
    } else if (vueloIda) {
      vuelosArray.push(vueloIda);
      if (vueloVuelta) {
        vuelosArray.push(vueloVuelta);
      }
    } else if (vuelo) {
      vuelosArray.push(vuelo);
    }

    // Validar que haya al menos un item
    if (vuelosArray.length === 0 && (!buses || buses.length === 0)) {
      return res.status(400).json({ 
        error: "No hay items de reserva.",
      });
    }

    // Determinar idViaje principal
    const primerViajeId =
      (vuelosArray[0] && vuelosArray[0].idViaje) ||
      (Array.isArray(buses) && buses[0]?.id) ||
      (Array.isArray(buses) && buses[0]?.idViaje) ||
      null;

    if (!primerViajeId) {
      return res.status(400).json({ 
        error: "Falta id de viaje (vuelo o bus).",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // ===== BUSCAR O CREAR USUARIO =====
    let idUsuario;

    const [existingUser] = await connection.query(
      "SELECT idUsuario FROM usuario WHERE email = ?",
      [pasajero.correo]
    );

    if (existingUser.length > 0) {
      idUsuario = existingUser[0].idUsuario;
      console.log(`✅ Usuario encontrado: ${idUsuario}`);
    } else {
      console.log(`📝 Creando nuevo usuario para: ${pasajero.correo}`);
      const [userResult] = await connection.query(
        `INSERT INTO usuario 
          (nombreUsuario, email, contrasena, idRol, verificado) 
          VALUES (?, ?, ?, 1, 0)`,
        [
          `${pasajero.nombre} ${pasajero.apellido}`.trim(),
          pasajero.correo,
          "temp_password_" + Date.now(),
        ]
      );
      idUsuario = userResult.insertId;
      console.log(`✅ Usuario creado con ID: ${idUsuario}`);
    }

    // Mapear método de pago a ID
    const metodoPagoMap = { stripe: 1, mercadopago: 2, paypal: 4 };
    const idMetodoPago = metodoPagoMap[metodoPago] || 1;

    const codigoReserva = generarCodigoReserva();

    // ===== INSERTAR RESERVA PRINCIPAL =====
    const [reservaResult] = await connection.query(
      `INSERT INTO reserva 
        (codigo_reserva, idUsuario, idViaje, fecha_reserva, idTipoCategoria, estado, monto_total, moneda)
        VALUES (?, ?, ?, NOW(), ?, 'pendiente', ?, 'CLP')`,
      [codigoReserva, idUsuario, primerViajeId, 1, total]
    );

    const reservaId = reservaResult.insertId;
    console.log(`✅ Reserva creada con ID: ${reservaId}`);

    // ===== INSERTAR PASAJERO =====
    const [pasajeroResult] = await connection.query(
      `INSERT INTO pasajero 
        (idReserva, nombrePasajero, apellidoPasajero, documento, tipo_documento, fecha_nacimiento, nacionalidad)
        VALUES (?, ?, ?, ?, ?, ?, 'CL')`,
      [
        reservaId,
        pasajero.nombre,
        pasajero.apellido,
        pasajero.numeroDocumento,
        pasajero.tipoDocumento || "DNI",
        pasajero.fechaNacimiento || null,
      ]
    );
    const idPasajero = pasajeroResult.insertId;
    console.log(`✅ Pasajero creado con ID: ${idPasajero}`);

    // ===== INSERTAR DETALLES EN reserva_detalle =====
    console.log('💾 Guardando desglose en reserva_detalle...');
    const detalles = [];

    // 1. Vuelo de ida
    if (vuelosArray.length > 0) {
      const vueloIda = vuelosArray[0];
      const descripcionIda = `Vuelo (ida) – ${vueloIda.origen || 'N/A'} → ${vueloIda.destino || 'N/A'} · ${vueloIda.tarifaNombre || 'Tarifa'}`;
      const montoIda = Number(vueloIda.precio || 0);
      
      detalles.push([
        reservaId,
        'vuelo_ida',
        descripcionIda,
        montoIda,
        JSON.stringify({
          idViaje: vueloIda.idViaje,
          empresa: vueloIda.empresa,
          horaSalida: vueloIda.horaSalida,
          horaLlegada: vueloIda.horaLlegada
        })
      ]);
      
      console.log(`  ✓ Vuelo ida: ${descripcionIda} - $${montoIda}`);
    }

    // 2. Vuelo de vuelta
    if (vuelosArray.length > 1) {
      const vueloVuelta = vuelosArray[1];
      const descripcionVuelta = `Vuelo (vuelta) – ${vueloVuelta.origen || 'N/A'} → ${vueloVuelta.destino || 'N/A'} · ${vueloVuelta.tarifaNombre || 'Tarifa'}`;
      const montoVuelta = Number(vueloVuelta.precio || 0);
      
      detalles.push([
        reservaId,
        'vuelo_vuelta',
        descripcionVuelta,
        montoVuelta,
        JSON.stringify({
          idViaje: vueloVuelta.idViaje,
          empresa: vueloVuelta.empresa,
          horaSalida: vueloVuelta.horaSalida,
          horaLlegada: vueloVuelta.horaLlegada
        })
      ]);
      
      console.log(`  ✓ Vuelo vuelta: ${descripcionVuelta} - $${montoVuelta}`);
    }

    // 3. Asientos
    if (asientos && asientos.costoTotalAsientos > 0) {
      const asientosIda = asientos.asientosIda || [];
      const asientosVuelta = asientos.asientosVuelta || [];
      const todosAsientos = [...asientosIda, ...asientosVuelta];
      
      if (todosAsientos.length > 0) {
        const numerosAsientos = todosAsientos.map(a => a.numero).join(', ');
        const tiposAsientos = [...new Set(todosAsientos.map(a => a.tipo))].join(', ');
        const descripcionAsientos = `Asientos: ${numerosAsientos} (${tiposAsientos})`;
        const montoAsientos = Number(asientos.costoTotalAsientos || 0);
        
        detalles.push([
          reservaId,
          'asientos',
          descripcionAsientos,
          montoAsientos,
          JSON.stringify({
            asientosIda: asientosIda.map(a => ({ numero: a.numero, tipo: a.tipo, precio: a.precio })),
            asientosVuelta: asientosVuelta.map(a => ({ numero: a.numero, tipo: a.tipo, precio: a.precio }))
          })
        ]);
        
        console.log(`  ✓ Asientos: ${descripcionAsientos} - $${montoAsientos}`);
      }
    }

    // 4. Buses
    if (buses && buses.length > 0) {
      for (const bus of buses) {
        const descripcionBus = `${bus.empresa || 'Bus'} – ${bus.origen || bus.ciudadOrigen || 'N/A'} → ${bus.destino || bus.ciudadDestino || 'N/A'}`;
        const montoBus = Number(bus.precioAdulto || 0);
        
        detalles.push([
          reservaId,
          'bus',
          descripcionBus,
          montoBus,
          JSON.stringify({
            idViaje: bus.idViaje || bus.id,
            empresa: bus.empresa,
            horaSalida: bus.horaSalida,
            horaLlegada: bus.horaLlegada
          })
        ]);
        
        console.log(`  ✓ Bus: ${descripcionBus} - $${montoBus}`);
      }
    }

    // 5. ✅ CUPÓN DE DESCUENTO
    if (cupon && descuento > 0) {
      const descripcionCupon = `Cupón de descuento: ${cupon.codigo}`;
      const montoCupon = -Number(descuento); // Negativo porque es descuento
      
      detalles.push([
        reservaId,
        'descuento',
        descripcionCupon,
        montoCupon,
        JSON.stringify({
          codigo: cupon.codigo,
          descuentoAplicado: descuento,
          subtotal: subtotal,
          totalFinal: total
        })
      ]);
      
      console.log(`  ✓ Cupón: ${descripcionCupon} - -$${descuento}`);

      // ✅ REGISTRAR USO DEL CUPÓN EN reserva_cupon
      try {
        // Buscar el ID del cupón en tu tabla
        const [cuponData] = await connection.query(
          `SELECT idCuponDescuento FROM cupon_descuento WHERE codigo = ? AND activo = 1`,
          [cupon.codigo]
        );

        if (cuponData.length > 0) {
          const idCuponDescuento = cuponData[0].idCuponDescuento;
          
          await connection.query(
            `INSERT INTO reserva_cupon 
              (idReserva, idCuponDescuento, montoAplicado)
              VALUES (?, ?, ?)`,
            [reservaId, idCuponDescuento, descuento]
          );
          
          console.log(`  ✓ Cupón ${cupon.codigo} registrado en reserva_cupon`);

          // ✅ INCREMENTAR contador de usos del cupón (uso_actual en tu tabla)
          await connection.query(
            `UPDATE cupon_descuento 
             SET uso_actual = uso_actual + 1 
             WHERE idCuponDescuento = ?`,
            [idCuponDescuento]
          );
          
          console.log(`  ✓ Contador de usos actualizado para cupón ${cupon.codigo}`);
        } else {
          console.log(`  ⚠️ Cupón ${cupon.codigo} no encontrado en BD, solo se guardará en reserva_detalle`);
        }
      } catch (cuponError) {
        console.error('❌ Error al registrar cupón:', cuponError);
        // No fallar toda la transacción por esto
      }
    }

    // Insertar todos los detalles
    if (detalles.length > 0) {
      await connection.query(
        `INSERT INTO reserva_detalle 
          (idReserva, tipo, descripcion, monto, metadata) 
        VALUES ?`,
        [detalles]
      );
      
      console.log(`✅ ${detalles.length} detalles guardados en reserva_detalle`);
    }

    // ===== INSERTAR ASIENTOS EN pasajero_asiento =====
    if (asientos) {
      const asientosIda = asientos.asientosIda || [];
      const asientosVuelta = asientos.asientosVuelta || [];
      const todosAsientos = [...asientosIda, ...asientosVuelta];

      for (const asiento of todosAsientos) {
        const [asientoEnBD] = await connection.query(
          `SELECT idAsiento FROM asiento 
           WHERE numero = ? AND idViaje = ? LIMIT 1`,
          [asiento.numero, asiento.idViaje || primerViajeId]
        );

        if (asientoEnBD.length > 0) {
          await connection.query(
            `INSERT INTO pasajero_asiento 
              (idPasajero, idAsiento, cargo_extra, fecha_seleccion)
              VALUES (?, ?, ?, NOW())`,
            [idPasajero, asientoEnBD[0].idAsiento, asiento.precio || 0]
          );
          console.log(`  ✅ Asiento ${asiento.numero} vinculado`);
        }
      }
    }

    // ===== REGISTRO DE PAGO PENDIENTE =====
    await connection.query(
      `INSERT INTO pago 
        (idReserva, idMetodoPago, idEstadoPago, monto, moneda, created_at)
        VALUES (?, ?, 1, ?, 'CLP', NOW())`,
      [reservaId, idMetodoPago, total]
    );

    await connection.commit();

    console.log('✅ Reserva completada exitosamente');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.status(201).json({
      success: true,
      reservaId,
      codigoReserva,
      pasajeroId: idPasajero,
      usuarioId: idUsuario,
      message: "Reserva creada exitosamente",
      debug: {
        vuelosProcesados: vuelosArray.length,
        busesProcesados: buses.length,
        asientosProcesados: (asientos?.asientosIda?.length || 0) + (asientos?.asientosVuelta?.length || 0),
        cuponAplicado: cupon?.codigo || null,
        descuento: descuento,
        detallesGuardados: detalles.length,
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("❌ Error al crear reserva:", error);
    res.status(500).json({
      error: "Error al crear la reserva",
      details: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
});

// ========================================
// STRIPE - CREAR SESIÓN DE PAGO (CON CUPONES)
// ========================================
router.post("/stripe/create-session", async (req, res) => {
  const { 
    reservaId, 
    pasajero, 
    vuelo = null,
    vueloIda = null,
    vueloVuelta = null,
    vuelos = [],
    buses = [],
    asientos = null,
    cupon = null, // ✅ Recibir cupón
    subtotal = null, // ✅ Recibir subtotal
    descuento = 0, // ✅ Recibir descuento
    total = null
  } = req.body;

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💳 STRIPE - Payload recibido:');
    console.log('Subtotal:', subtotal);
    console.log('Cupón:', cupon?.codigo || 'Sin cupón');
    console.log('Descuento:', descuento);
    console.log('Total:', total);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let line_items = [];

    // Construir array de vuelos
    let vuelosArray = [];
    if (vuelos && vuelos.length > 0) {
      vuelosArray = vuelos;
    } else if (vueloIda) {
      vuelosArray.push(vueloIda);
      if (vueloVuelta) vuelosArray.push(vueloVuelta);
    } else if (vuelo) {
      vuelosArray.push(vuelo);
    }

    // ===== AGREGAR VUELOS =====
    for (const vueloItem of vuelosArray) {
      if (Number(vueloItem.precio) > 0) {
        line_items.push({
          price_data: {
            currency: "clp",
            product_data: {
              name: `Vuelo ${vueloItem.origen} → ${vueloItem.destino}`,
              description: `${vueloItem.empresa} · ${vueloItem.tarifaNombre || 'Standard'}`,
            },
            unit_amount: toUnitAmountCLP(vueloItem.precio),
          },
          quantity: 1,
        });
        console.log(`✅ Vuelo agregado: ${vueloItem.origen} → ${vueloItem.destino}`);
      }
    }

    // ===== AGREGAR ASIENTOS =====
    if (asientos && asientos.costoTotalAsientos > 0) {
      const asientosIda = asientos.asientosIda || [];
      const asientosVuelta = asientos.asientosVuelta || [];
      const todosLosAsientos = [...asientosIda, ...asientosVuelta];
      
      if (todosLosAsientos.length > 0) {
        const numerosAsientos = todosLosAsientos.map(a => a.numero).join(', ');
        
        line_items.push({
          price_data: {
            currency: "clp",
            product_data: {
              name: `Selección de Asientos`,
              description: `Asientos: ${numerosAsientos}`,
            },
            unit_amount: toUnitAmountCLP(asientos.costoTotalAsientos),
          },
          quantity: 1,
        });
        console.log(`✅ Asientos agregados`);
      }
    }

    // ===== AGREGAR BUSES =====
    for (const b of buses || []) {
      const amount = toUnitAmountCLP(b.precioAdulto);
      if (amount <= 0) continue;
      line_items.push({
        price_data: {
          currency: "clp",
          product_data: {
            name: `${b.empresa} – ${b.origen} → ${b.destino}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      });
      console.log(`✅ Bus agregado`);
    }

    // ===== CALCULAR TOTAL FINAL =====
    const totalFinal = total || 0;
    
    // Si hay descuento, ajustar el primer item para reflejar el total correcto
    if (cupon && descuento > 0 && line_items.length > 0) {
      console.log(`🎫 Aplicando descuento de $${descuento}`);
      console.log(`📊 Subtotal sin descuento: $${total + descuento}`);
      console.log(`✅ Total con descuento: $${totalFinal}`);
      
      // Calcular la proporción del descuento
      const subtotalSinDescuento = total + descuento;
      const factorDescuento = totalFinal / subtotalSinDescuento;
      
      // Ajustar todos los precios proporcionalmente
      line_items = line_items.map(item => ({
        ...item,
        price_data: {
          ...item.price_data,
          unit_amount: Math.round(item.price_data.unit_amount * factorDescuento)
        }
      }));
      
      console.log(`✅ Precios ajustados con descuento del ${((1 - factorDescuento) * 100).toFixed(1)}%`);
    }

    if (line_items.length === 0) {
      return res.status(400).json({ error: "No hay items para cobrar." });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      customer_email: pasajero?.correo,
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pago-exitoso?reservaId=${encodeURIComponent(
        reservaId
      )}&status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pago?status=cancel&reservaId=${encodeURIComponent(
        reservaId
      )}`,
      metadata: {
        reservaId: String(reservaId || ""),
        cuponCodigo: cupon?.codigo || "",
        descuento: String(descuento || 0),
      },
    });

    console.log('✅ Sesión de Stripe creada exitosamente');

    res.status(200).json({ 
      success: true, 
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error) {
    console.error("❌ Error en Stripe:", error);
    res.status(500).json({
      error: "Error al crear sesión de Stripe",
      details: error.message,
    });
  }
});

// ========================================
// MERCADO PAGO - CREAR PREFERENCIA (CON CUPONES)
// ========================================
router.post("/mercadopago/create-preference", async (req, res) => {
  try {
    const { 
      vuelo = null,
      vueloIda = null,
      vueloVuelta = null,
      vuelos = [],
      buses = [],
      asientos = null,
      cupon = null,
      descuento = 0,
      reservaId, 
      pasajero 
    } = req.body;

    console.log('💳 MERCADOPAGO - Cupón:', cupon?.codigo || 'Sin cupón', 'Descuento:', descuento);

    // Construir array de vuelos
    let vuelosArray = [];
    if (vuelos && vuelos.length > 0) {
      vuelosArray = vuelos;
    } else if (vueloIda) {
      vuelosArray.push(vueloIda);
      if (vueloVuelta) vuelosArray.push(vueloVuelta);
    } else if (vuelo) {
      vuelosArray.push(vuelo);
    }

    if (vuelosArray.length === 0 && (!buses || buses.length === 0)) {
      return res.status(400).json({ error: "No hay items para cobrar." });
    }

    const preference = new Preference(mpClient);
    const items = [];

    // Agregar vuelos
    for (const vueloItem of vuelosArray) {
      if (Number(vueloItem.precio) > 0) {
        items.push({
          title: `Vuelo ${vueloItem.origen} → ${vueloItem.destino} · ${vueloItem.tarifaNombre || 'Standard'}`,
          quantity: 1,
          currency_id: "CLP",
          unit_price: Number(vueloItem.precio),
        });
      }
    }

    // Agregar asientos
    if (asientos && asientos.costoTotalAsientos > 0) {
      const asientosIda = asientos.asientosIda || [];
      const asientosVuelta = asientos.asientosVuelta || [];
      const todosLosAsientos = [...asientosIda, ...asientosVuelta];
      
      if (todosLosAsientos.length > 0) {
        const numerosAsientos = todosLosAsientos.map(a => a.numero).join(', ');
        
        items.push({
          title: `Selección de Asientos`,
          description: `Asientos: ${numerosAsientos}`,
          quantity: 1,
          currency_id: "CLP",
          unit_price: Number(asientos.costoTotalAsientos),
        });
      }
    }

    // Agregar buses
    for (const b of buses || []) {
      items.push({
        title: `${b.empresa} – ${b.origen} → ${b.destino}`,
        quantity: 1,
        currency_id: "CLP",
        unit_price: Number(b.precioAdulto || 0),
      });
    }

    // ✅ Agregar descuento como item negativo
    if (cupon && descuento > 0) {
      items.push({
        title: `Descuento (${cupon.codigo})`,
        description: 'Cupón aplicado',
        quantity: 1,
        currency_id: "CLP",
        unit_price: -Number(descuento), // ✅ Negativo
      });
      console.log(`✅ MP - Descuento agregado: -$${descuento}`);
    }

    const preferenceData = {
      items,
      back_urls: {
        success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pago-exitoso?reservaId=${reservaId}&status=success`,
        failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pago-exitoso?reservaId=${reservaId}&status=failure`,
        pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pago-exitoso?reservaId=${reservaId}&status=pending`,
      },
      external_reference: String(reservaId),
      statement_descriptor: "AIRLINK",
      payer: {
        name: pasajero.nombre,
        surname: pasajero.apellido || "",
        email: pasajero.correo,
      },
    };

    const response = await preference.create({ body: preferenceData });
    res.json({
      success: true,
      init_point: response.init_point,
      id: response.id,
    });
  } catch (error) {
    console.error("❌ Error de MercadoPago:", error);
    res.status(500).json({
      error: "Error al crear preferencia de Mercado Pago",
      message: error.message,
    });
  }
});

// ========================================
// PAYPAL - CREAR ORDEN (CON CUPONES)
// ========================================
router.post("/paypal/create-order", async (req, res) => {
  const { 
    vuelo = null,
    vueloIda = null,
    vueloVuelta = null,
    vuelos = [],
    buses = [],
    asientos = null,
    cupon = null,
    descuento = 0,
    total = null,
    reservaId, 
    pasajero 
  } = req.body;

  try {
    console.log('💳 PAYPAL - Cupón:', cupon?.codigo || 'Sin cupón', 'Descuento:', descuento);

    // Construir array de vuelos
    let vuelosArray = [];
    if (vuelos && vuelos.length > 0) {
      vuelosArray = vuelos;
    } else if (vueloIda) {
      vuelosArray.push(vueloIda);
      if (vueloVuelta) vuelosArray.push(vueloVuelta);
    } else if (vuelo) {
      vuelosArray.push(vuelo);
    }

    if (vuelosArray.length === 0 && (!buses || buses.length === 0)) {
      return res.status(400).json({ error: "No hay items para cobrar." });
    }

    const conversionRate = 900; // CLP → USD
    const items = [];

    // Agregar vuelos
    for (const vueloItem of vuelosArray) {
      if (Number(vueloItem.precio) > 0) {
        items.push({
          name: `Vuelo ${vueloItem.origen} → ${vueloItem.destino} · ${vueloItem.tarifaNombre || 'Standard'}`,
          unit_amount: {
            currency_code: "USD",
            value: (Number(vueloItem.precio) / conversionRate).toFixed(2),
          },
          quantity: "1",
        });
      }
    }

    // Agregar asientos
    if (asientos && asientos.costoTotalAsientos > 0) {
      const asientosIda = asientos.asientosIda || [];
      const asientosVuelta = asientos.asientosVuelta || [];
      const todosLosAsientos = [...asientosIda, ...asientosVuelta];
      
      if (todosLosAsientos.length > 0) {
        const numerosAsientos = todosLosAsientos.map(a => a.numero).join(', ');
        
        items.push({
          name: `Selección de Asientos`,
          description: `Asientos: ${numerosAsientos}`,
          unit_amount: {
            currency_code: "USD",
            value: (Number(asientos.costoTotalAsientos) / conversionRate).toFixed(2),
          },
          quantity: "1",
        });
      }
    }

    // Agregar buses
    for (const b of buses || []) {
      items.push({
        name: `${b.empresa} – ${b.origen} → ${b.destino}`,
        unit_amount: {
          currency_code: "USD",
          value: (Number(b.precioAdulto || 0) / conversionRate).toFixed(2),
        },
        quantity: "1",
      });
    }

    // ✅ Agregar descuento
    if (cupon && descuento > 0) {
      items.push({
        name: `Descuento (${cupon.codigo})`,
        description: 'Cupón aplicado',
        unit_amount: {
          currency_code: "USD",
          value: (-Number(descuento) / conversionRate).toFixed(2), // ✅ Negativo
        },
        quantity: "1",
      });
      console.log(`✅ PayPal - Descuento agregado: -$${descuento}`);
    }

    const totalUSD = (Number(total) / conversionRate).toFixed(2);

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: totalUSD,
            breakdown: {
              item_total: { currency_code: "USD", value: totalUSD },
            },
          },
          items,
          description: `Reserva #${reservaId}`,
        },
      ],
      application_context: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pago-exitoso?reservaId=${reservaId}&status=success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pago?status=cancel&reservaId=${reservaId}`,
        brand_name: "AirLink",
        user_action: "PAY_NOW",
      },
    });

    const order = await paypalClient.execute(request);
    res.status(201).json({
      success: true,
      id: order.result.id,
      approveUrl: order.result.links.find((l) => l.rel === "approve").href,
    });
  } catch (error) {
    console.error("Error en PayPal:", error);
    res.status(500).json({
      error: "Error al crear orden de PayPal",
      details: error.message,
    });
  }
});

// ========================================
// ACTUALIZAR ESTADO DE RESERVA
// ========================================
router.put("/actualizar-estado/:reservaId", async (req, res) => {
  const db = req.app.get("db");
  const { reservaId } = req.params;
  const { estado } = req.body;

  try {
    await db.query("UPDATE reserva SET estado = ? WHERE idReserva = ?", [
      estado,
      reservaId,
    ]);

    const estadoPagoMap = { confirmada: 2, cancelada: 3, pendiente: 1 };
    await db.query("UPDATE pago SET idEstadoPago = ? WHERE idReserva = ?", [
      estadoPagoMap[estado] || 1,
      reservaId,
    ]);

    res.json({ success: true, message: "Estado de reserva actualizado" });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({
      error: "Error al actualizar estado de reserva",
      details: error.message,
    });
  }
});

// ========================================
// WEBHOOK MERCADOPAGO
// ========================================
router.post("/mercadopago/webhook", async (req, res) => {
  try {
    const payment = req.query;
    console.log("🔔 Webhook MercadoPago:", payment);

    if (payment.type === "payment") {
      const db = req.app.get("db");
      const reservaId = payment.external_reference;

      if (payment.status === "approved") {
        await db.query(
          "UPDATE reserva SET estado = 'confirmada' WHERE idReserva = ?",
          [reservaId]
        );
        await db.query("UPDATE pago SET idEstadoPago = 2 WHERE idReserva = ?", [
          reservaId,
        ]);
      } else if (payment.status === "rejected") {
        await db.query(
          "UPDATE reserva SET estado = 'cancelada' WHERE idReserva = ?",
          [reservaId]
        );
        await db.query("UPDATE pago SET idEstadoPago = 3 WHERE idReserva = ?", [
          reservaId,
        ]);
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error en webhook MercadoPago:", error);
    res.status(500).send("Error");
  }
});

// ========================================
// WEBHOOK STRIPE
// ========================================
router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = "whsec_tu_webhook_secret";

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const reservaId = session.metadata?.reservaId;

      const db = req.app.get("db");
      await db.query(
        "UPDATE reserva SET estado = 'confirmada' WHERE idReserva = ?",
        [reservaId]
      );
      await db.query("UPDATE pago SET idEstadoPago = 2 WHERE idReserva = ?", [
        reservaId,
      ]);
    }

    res.json({ received: true });
  }
);

export { router };