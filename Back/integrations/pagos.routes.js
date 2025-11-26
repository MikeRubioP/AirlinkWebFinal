// integrations/pagos.routes.js - VERSIÓN MEJORADA
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
// CREAR RESERVA EN LA BASE DE DATOS (MEJORADO)
// ========================================
router.post("/crear-reserva", async (req, res) => {
  const db = req.app.get("db");
  
  // ✅ CAMBIO: Acepta vuelo, vueloIda/vueloVuelta, o vuelos[]
  const { 
    pasajero, 
    vuelo = null,           // Formato antiguo
    vueloIda = null,        // Formato nuevo
    vueloVuelta = null,     // Formato nuevo
    vuelos = [],            // Formato array
    buses = [], 
    total, 
    metodoPago 
  } = req.body;

  let connection;

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 PAYLOAD RECIBIDO EN BACKEND:');
    console.log('Pasajero:', pasajero?.nombre, pasajero?.apellido);
    console.log('Vuelo (singular):', vuelo?.idViaje);
    console.log('Vuelo Ida:', vueloIda?.idViaje);
    console.log('Vuelo Vuelta:', vueloVuelta?.idViaje);
    console.log('Vuelos (array):', vuelos.length);
    console.log('Buses:', buses.length);
    console.log('Total:', total);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Validaciones mínimas
    if (!pasajero || !total) {
      return res.status(400).json({
        error: "Datos incompletos",
        required: ["pasajero", "total"],
      });
    }

    // ✅ CAMBIO: Construir array de vuelos desde cualquier formato
    let vuelosArray = [];
    
    if (vuelos && vuelos.length > 0) {
      // Formato: vuelos[]
      vuelosArray = vuelos;
      console.log('✅ Usando formato vuelos[] con', vuelos.length, 'vuelos');
    } else if (vueloIda) {
      // Formato: vueloIda/vueloVuelta
      vuelosArray.push(vueloIda);
      if (vueloVuelta) {
        vuelosArray.push(vueloVuelta);
      }
      console.log('✅ Usando formato vueloIda/vueloVuelta con', vuelosArray.length, 'vuelos');
    } else if (vuelo) {
      // Formato antiguo: vuelo singular
      vuelosArray.push(vuelo);
      console.log('✅ Usando formato vuelo singular');
    }

    // Validar que haya al menos un item
    if (vuelosArray.length === 0 && (!buses || buses.length === 0)) {
      return res.status(400).json({ 
        error: "No hay items de reserva.",
        debug: {
          vuelosRecibidos: vuelosArray.length,
          busesRecibidos: buses.length,
          formatosDisponibles: {
            vuelo: !!vuelo,
            vueloIda: !!vueloIda,
            vuelos: vuelos.length
          }
        }
      });
    }

    // Determinar idViaje principal (primer vuelo o primer bus)
    const primerViajeId =
      (vuelosArray[0] && vuelosArray[0].idViaje) ||
      (Array.isArray(buses) && buses[0]?.id) ||
      (Array.isArray(buses) && buses[0]?.idViaje) ||
      null;

    if (!primerViajeId) {
      return res.status(400).json({ 
        error: "Falta id de viaje (vuelo o bus).",
        debug: {
          primerVuelo: vuelosArray[0],
          primerBus: buses[0]
        }
      });
    }

    console.log('✅ ID de viaje principal:', primerViajeId);

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
    console.log(`✅ Pasajero creado con ID: ${pasajeroResult.insertId}`);

    // ===== INSERTAR DETALLES DE VUELOS (OPCIONAL) =====
    // Si tienes una tabla para detalles de vuelos, inserta aquí
    for (const vueloItem of vuelosArray) {
      console.log(`📝 Procesando vuelo:`, vueloItem.idViaje, `(${vueloItem.origen} → ${vueloItem.destino})`);
      
      // Ejemplo: Si tienes tabla reserva_detalle o similar
      // await connection.query(
      //   `INSERT INTO reserva_detalle (idReserva, idViaje, tipo, precio) VALUES (?, ?, ?, ?)`,
      //   [reservaId, vueloItem.idViaje, vueloItem.tipo || 'vuelo', vueloItem.precio]
      // );
    }

    // ===== INSERTAR DETALLES DE BUSES (OPCIONAL) =====
    for (const bus of buses) {
      console.log(`📝 Procesando bus:`, bus.idViaje || bus.id, `(${bus.empresa})`);
      
      // Ejemplo: Si tienes tabla reserva_detalle o similar
      // await connection.query(
      //   `INSERT INTO reserva_detalle (idReserva, idViaje, tipo, precio) VALUES (?, ?, ?, ?)`,
      //   [reservaId, bus.idViaje || bus.id, 'bus', bus.precioAdulto]
      // );
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
      pasajeroId: pasajeroResult.insertId,
      usuarioId: idUsuario,
      message: "Reserva creada exitosamente",
      debug: {
        vuelosProcesados: vuelosArray.length,
        busesProcesados: buses.length,
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
// STRIPE - CREAR SESIÓN DE PAGO (MEJORADO)
// ========================================
router.post("/stripe/create-session", async (req, res) => {
  const { 
    reservaId, 
    pasajero, 
    vuelo = null,
    vueloIda = null,
    vueloVuelta = null,
    vuelos = [],
    buses = [] 
  } = req.body;

  try {
    const line_items = [];

    // ✅ CAMBIO: Construir array de vuelos
    let vuelosArray = [];
    if (vuelos && vuelos.length > 0) {
      vuelosArray = vuelos;
    } else if (vueloIda) {
      vuelosArray.push(vueloIda);
      if (vueloVuelta) vuelosArray.push(vueloVuelta);
    } else if (vuelo) {
      vuelosArray.push(vuelo);
    }

    // Agregar todos los vuelos
    for (const vueloItem of vuelosArray) {
      if (Number(vueloItem.precio) > 0) {
        line_items.push({
          price_data: {
            currency: "clp",
            product_data: {
              name: `Vuelo ${vueloItem.origen} → ${vueloItem.destino} · ${vueloItem.tarifaNombre || 'Standard'}`,
            },
            unit_amount: toUnitAmountCLP(vueloItem.precio),
          },
          quantity: 1,
        });
      }
    }

    // Agregar buses
    for (const b of buses || []) {
      const amount = toUnitAmountCLP(b.precioAdulto);
      if (amount <= 0) continue;
      line_items.push({
        price_data: {
          currency: "clp",
          product_data: {
            name: `${b.empresa} – ${b.origen} → ${b.destino}`,
            description:
              b.horaSalida && b.horaLlegada
                ? `Salida: ${b.horaSalida} - Llegada: ${b.horaLlegada}`
                : undefined,
          },
          unit_amount: amount,
        },
        quantity: 1,
      });
    }

    if (line_items.length === 0) {
      return res.status(400).json({ error: "No hay items para cobrar." });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      customer_email: pasajero?.correo,
      success_url: `http://localhost:5173/pago-exitoso?reservaId=${encodeURIComponent(
        reservaId
      )}&status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/pago?status=cancel&reservaId=${encodeURIComponent(
        reservaId
      )}`,
      metadata: {
        reservaId: String(reservaId || ""),
        pasajeroNombre: pasajero
          ? `${pasajero.nombre || ""} ${pasajero.apellido || ""}`.trim()
          : "",
      },
    });

    res
      .status(200)
      .json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error en Stripe:", error);
    res
      .status(500)
      .json({
        error: "Error al crear sesión de Stripe",
        details: error.message,
      });
  }
});

// ========================================
// MERCADO PAGO - CREAR PREFERENCIA (MEJORADO)
// ========================================
router.post("/mercadopago/create-preference", async (req, res) => {
  try {
    const { 
      vuelo = null,
      vueloIda = null,
      vueloVuelta = null,
      vuelos = [],
      buses = [], 
      reservaId, 
      pasajero 
    } = req.body;

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
    if (!reservaId)
      return res.status(400).json({ error: "reservaId es requerido" });
    if (!pasajero || !pasajero.nombre || !pasajero.correo) {
      return res.status(400).json({ error: "Datos de pasajero incompletos" });
    }

    const preference = new Preference(mpClient);
    const items = [];

    // Agregar todos los vuelos
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

    // Agregar buses
    for (const b of buses || []) {
      items.push({
        title: `${b.empresa} – ${b.origen} → ${b.destino}`,
        quantity: 1,
        currency_id: "CLP",
        unit_price: Number(b.precioAdulto || 0),
      });
    }

    const preferenceData = {
      items,
      back_urls: {
        success: `http://localhost:5173/pago-exitoso?reservaId=${reservaId}&status=success`,
        failure: `http://localhost:5173/pago-exitoso?reservaId=${reservaId}&status=failure`,
        pending: `http://localhost:5173/pago-exitoso?reservaId=${reservaId}&status=pending`,
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
    console.error("❌ Error completo de MercadoPago:", error);
    res.status(500).json({
      error: "Error al crear preferencia de Mercado Pago",
      message: error.message,
      details: error.response?.data || error.toString(),
    });
  }
});

// ========================================
// PAYPAL - CREAR ORDEN (MEJORADO)
// ========================================
router.post("/paypal/create-order", async (req, res) => {
  const { 
    vuelo = null,
    vueloIda = null,
    vueloVuelta = null,
    vuelos = [],
    buses = [], 
    reservaId, 
    pasajero 
  } = req.body;

  try {
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

    const conversionRate = 900; // CLP → USD (demo)
    
    const items = [];
    let totalCLP = 0;

    // Agregar todos los vuelos
    for (const vueloItem of vuelosArray) {
      if (Number(vueloItem.precio) > 0) {
        totalCLP += Number(vueloItem.precio);
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

    // Agregar buses
    for (const b of buses || []) {
      totalCLP += Number(b.precioAdulto || 0);
      items.push({
        name: `${b.empresa} – ${b.origen} → ${b.destino}`,
        description:
          b.horaSalida && b.horaLlegada
            ? `${b.horaSalida} - ${b.horaLlegada}`
            : undefined,
        unit_amount: {
          currency_code: "USD",
          value: (Number(b.precioAdulto || 0) / conversionRate).toFixed(2),
        },
        quantity: "1",
      });
    }

    const totalUSD = (totalCLP / conversionRate).toFixed(2);

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
        return_url: `http://localhost:5173/pago-exitoso?reservaId=${reservaId}&status=success`,
        cancel_url: `http://localhost:5173/pago?status=cancel&reservaId=${reservaId}`,
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
    res
      .status(500)
      .json({
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
    res
      .status(500)
      .json({
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