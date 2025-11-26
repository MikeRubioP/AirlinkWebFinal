import { Router } from "express";
import { z } from "zod";
import nodemailer from "nodemailer";

// Validación con Zod
const contactoSchema = z.object({
  nombre: z.string().min(2, "Nombre muy corto").max(80, "Nombre muy largo"),
  email: z.string().email("Email inválido").max(120, "Email muy largo"),
  asunto: z.string().min(3, "Asunto muy corto").max(120, "Asunto muy largo"),
  mensaje: z
    .string()
    .min(10, "Mensaje muy corto")
    .max(4000, "Mensaje muy largo"),
  meta: z
    .object({
      ua: z.string().optional(),
      tz: z.string().optional(),
    })
    .optional(),
});

// Configurar Nodemailer (mismo patrón que en auth.routes.js)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "airlink.noreply@gmail.com",
    pass: process.env.EMAIL_PASS || "hpku sgmv cktw yrea",
  },
});

const EMPRESA_EMAIL = process.env.EMPRESA_EMAIL || "airlink.noreply@gmail.com";

const router = Router();

router.post("/", async (req, res) => {
  try {
    // ✅ Obtener el pool desde req.app
    const pool = req.app.get("db");

    // Validar datos con Zod
    const data = contactoSchema.parse(req.body);

    // 1. Guardar en base de datos
    const sql = `
      INSERT INTO contacto (nombre, email, asunto, mensaje, user_agent, timezone, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await pool.execute(sql, [
      data.nombre,
      data.email,
      data.asunto,
      data.mensaje,
      data.meta?.ua || null,
      data.meta?.tz || null,
    ]);

    // 2. Enviar email a la empresa
    const mailToEmpresa = {
      from: `"AirLink Contacto 📮" <${
        process.env.EMAIL_USER || "airlink.noreply@gmail.com"
      }>`,
      to: EMPRESA_EMAIL,
      replyTo: data.email, // Para que puedan responder directamente
      subject: `📩 Nuevo mensaje de contacto: ${data.asunto}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">
          <!-- Header -->
          <div style="background:linear-gradient(135deg, #450d82 0%, #7c3aed 100%);color:#fff;padding:24px;text-align:center">
            <h1 style="margin:0;font-size:24px">✈️ AirLink</h1>
            <p style="margin:8px 0 0;font-size:14px;opacity:0.9">Nuevo mensaje de contacto</p>
          </div>

          <!-- Contenido -->
          <div style="padding:32px 24px;background:#fff">
            <!-- Info del remitente -->
            <div style="background:#f9fafb;border-left:4px solid #450d82;padding:16px;margin-bottom:24px;border-radius:8px">
              <h3 style="margin:0 0 12px 0;color:#450d82;font-size:16px">📋 Información del contacto</h3>
              <table style="width:100%;border-collapse:collapse">
                <tr>
                  <td style="padding:6px 0;color:#666;font-weight:600;width:100px">Nombre:</td>
                  <td style="padding:6px 0;color:#242424">${data.nombre}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#666;font-weight:600">Email:</td>
                  <td style="padding:6px 0">
                    <a href="mailto:${
                      data.email
                    }" style="color:#450d82;text-decoration:none">${
        data.email
      }</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#666;font-weight:600">Asunto:</td>
                  <td style="padding:6px 0;color:#242424;font-weight:600">${
                    data.asunto
                  }</td>
                </tr>
                ${
                  data.meta?.tz
                    ? `
                <tr>
                  <td style="padding:6px 0;color:#666;font-weight:600">Zona horaria:</td>
                  <td style="padding:6px 0;color:#666;font-size:12px">${data.meta.tz}</td>
                </tr>`
                    : ""
                }
              </table>
            </div>

            <!-- Mensaje -->
            <div style="margin-bottom:24px">
              <h3 style="margin:0 0 12px 0;color:#450d82;font-size:16px">💬 Mensaje</h3>
              <div style="background:#f9fafb;padding:20px;border-radius:8px;border:1px solid #e0e0e0">
                <p style="margin:0;color:#242424;line-height:1.6;white-space:pre-wrap">${
                  data.mensaje
                }</p>
              </div>
            </div>

            <!-- Botón de acción -->
            <div style="text-align:center;margin-top:32px">
              <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(
        data.asunto
      )}" 
                 style="display:inline-block;background:#450d82;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
                📧 Responder al cliente
              </a>
            </div>

            <!-- Metadata -->
            ${
              data.meta?.ua
                ? `
            <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e0e0e0">
              <p style="color:#999;font-size:11px;margin:0">
                <strong>User Agent:</strong><br/>
                ${data.meta.ua}
              </p>
            </div>`
                : ""
            }
          </div>

          <!-- Footer -->
          <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e0e0e0">
            <p style="margin:0;color:#666;font-size:12px">
              Este mensaje fue enviado desde el formulario de contacto de AirLink<br/>
              ID de registro: #${result.insertId} • ${new Date().toLocaleString(
        "es-CL",
        { timeZone: "America/Santiago" }
      )}
            </p>
          </div>
        </div>
      `,
    };

    // 3. Enviar email de confirmación al usuario
    const mailToUsuario = {
      from: `"AirLink Soporte ✈️" <${
        process.env.EMAIL_USER || "airlink.noreply@gmail.com"
      }>`,
      to: data.email,
      subject: "✅ Hemos recibido tu mensaje - AirLink",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <!-- Header -->
          <div style="background:linear-gradient(135deg, #450d82 0%, #7c3aed 100%);color:#fff;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="margin:0">✈️ AirLink</h1>
            <p style="margin:8px 0 0">Mensaje recibido</p>
          </div>

          <!-- Contenido -->
          <div style="border:1px solid #eee;border-top:0;padding:24px;border-radius:0 0 12px 12px">
            <p style="margin:0 0 16px 0;color:#242424">
              Hola <strong>${data.nombre}</strong>,
            </p>
            
            <p style="color:#555;margin:0 0 16px 0">
              Gracias por contactarnos. Hemos recibido tu mensaje sobre: 
              <strong style="color:#450d82">${data.asunto}</strong>
            </p>

            <div style="background:#f9fafb;border-left:4px solid #450d82;padding:16px;margin:16px 0;border-radius:4px">
              <p style="margin:0;color:#666;font-size:14px">
                📩 <strong>Tu mensaje:</strong><br/>
                <span style="color:#242424;white-space:pre-wrap">${data.mensaje.substring(
                  0,
                  200
                )}${data.mensaje.length > 200 ? "..." : ""}</span>
              </p>
            </div>

            <p style="color:#555;margin:16px 0">
              Nuestro equipo revisará tu consulta y te responderemos en un plazo de <strong>24 horas hábiles</strong>.
            </p>

            <div style="background:#fef3c7;border:1px solid #fbbf24;padding:12px;border-radius:8px;margin:20px 0">
              <p style="margin:0;color:#92400e;font-size:13px">
                <strong>⚠️ Importante:</strong> Si no recibes respuesta en 2 días hábiles, revisa tu carpeta de spam o escríbenos directamente a 
                <a href="mailto:${EMPRESA_EMAIL}" style="color:#450d82">${EMPRESA_EMAIL}</a>
              </p>
            </div>

            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>

            <p style="color:#999;font-size:12px;margin:0">
              <strong>Número de seguimiento:</strong> #${result.insertId}<br/>
              <strong>Fecha:</strong> ${new Date().toLocaleString("es-CL", {
                timeZone: "America/Santiago",
              })}
            </p>
          </div>
        </div>
      `,
    };

    // Enviar ambos emails en paralelo
    await Promise.all([
      transporter.sendMail(mailToEmpresa),
      transporter.sendMail(mailToUsuario),
    ]);

    // Respuesta exitosa
    res.status(201).json({
      ok: true,
      message: "Mensaje enviado correctamente",
      id: result.insertId,
    });
  } catch (err) {
    console.error("❌ Error en /contacto:", err);

    // Error de validación Zod
    if (err?.issues) {
      return res.status(400).json({
        error: "Datos inválidos",
        details: err.issues.map((i) => i.message),
      });
    }

    // Error de envío de email (pero guardado en BD)
    if (err.code === "EAUTH" || err.responseCode) {
      return res.status(500).json({
        error: "Mensaje guardado pero no se pudo enviar el email",
        message: "Contacta directamente al soporte",
      });
    }

    // Error general
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.get("/test-email", async (req, res) => {
  try {
    // ✅ Verificar conexión a BD también
    const pool = req.app.get("db");
    await pool.query("SELECT 1");

    // Verificar email
    await transporter.verify();

    res.json({
      ok: true,
      message: "Configuración de email y BD correcta",
      from: process.env.EMAIL_USER,
      to: EMPRESA_EMAIL,
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error en configuración",
      details: error.message,
    });
  }
});

export { router };
