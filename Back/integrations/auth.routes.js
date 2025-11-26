// auth.routes.js
import express from "express";
import bcrypt from "bcrypt"; // ok usar bcrypt o bcryptjs
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_only_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "airlink.noreply@gmail.com",
    pass: "hpku sgmv cktw yrea",
  },
});

const verificationCodes = new Map(); // key: email, value: { code, expiresAt, nombreUsuario, contrasenaHash }

// Helpers
const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
const normalizeEmail = (s = "") => s.trim().toLowerCase();

const signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    // issuer: "airlink",
    // audience: "airlink-web",
  });

// Middleware de auth por Bearer
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No autorizado" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.idUsuario;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

// ======== Registro (envía código) ========
router.post("/register", async (req, res) => {
  const db = req.app.get("db");
  let { nombreUsuario = "", email = "", contrasena = "" } = req.body;

  // Validación mínima (mejor usar zod/express-validator si lo tienes instalado)
  nombreUsuario = nombreUsuario.trim();
  email = normalizeEmail(email);
  if (
    !nombreUsuario ||
    !email ||
    typeof contrasena !== "string" ||
    contrasena.length < 6
  ) {
    return res.status(400).json({ message: "Datos inválidos" });
  }

  try {
    // ¿correo ya existe?
    const [rows] = await db.execute(
      "SELECT idUsuario FROM usuario WHERE email = ? LIMIT 1",
      [email]
    );
    if (rows.length)
      return res.status(409).json({ message: "El correo ya está registrado" });

    const code = generateCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min
    const contrasenaHash = await bcrypt.hash(contrasena, 12);

    verificationCodes.set(email, {
      code,
      expiresAt,
      nombreUsuario,
      contrasena: contrasenaHash,
    });

    // Email
    const mailOptions = {
      from: `"AirLink ✈️" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Verifica tu cuenta de AirLink",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <div style="background:#7c3aed;color:#fff;padding:24px 16px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="margin:0">AirLink</h1><p style="margin:8px 0 0">Verificación de cuenta</p>
          </div>
          <div style="border:1px solid #eee;border-top:0;padding:24px;border-radius:0 0 12px 12px">
            <p>Hola <strong>${nombreUsuario}</strong>, usa este código para completar tu registro:</p>
            <div style="border:2px dashed #7c3aed;padding:16px;text-align:center;border-radius:8px;font-size:28px;font-weight:700;letter-spacing:6px;color:#7c3aed">
              ${code}
            </div>
            <p style="color:#555">Caduca en <strong>10 minutos</strong>.</p>
          </div>
        </div>`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Código de verificación enviado", email });
  } catch (error) {
    console.error("Error en /register:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// ======== Verificar código y crear usuario ========
router.post("/verify-code", async (req, res) => {
  const db = req.app.get("db");
  const email = normalizeEmail(req.body.email);
  const code = String(req.body.code || "");

  if (!email || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: "Datos inválidos" });
  }

  try {
    const stored = verificationCodes.get(email);
    if (!stored)
      return res
        .status(400)
        .json({ message: "Código no encontrado o expirado" });
    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ message: "El código ha expirado" });
    }
    if (stored.code !== code)
      return res.status(400).json({ message: "Código incorrecto" });

    const [result] = await db.execute(
      "INSERT INTO usuario (nombreUsuario, email, contrasena, idRol, verificado, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [stored.nombreUsuario, email, stored.contrasena, 1, true]
    );

    verificationCodes.delete(email);

    const token = signToken({ idUsuario: result.insertId, email });
    const [rows] = await db.execute(
      "SELECT idUsuario, nombreUsuario, email, idRol, verificado FROM usuario WHERE idUsuario = ?",
      [result.insertId]
    );

    res.json({ message: "Cuenta verificada", token, usuario: rows[0] });
  } catch (error) {
    console.error("Error en /verify-code:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// ======== Reenviar código ========
router.post("/resend-code", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) return res.status(400).json({ message: "Email inválido" });

  try {
    const stored = verificationCodes.get(email);
    if (!stored)
      return res
        .status(400)
        .json({ message: "No hay registro pendiente para este email" });

    const code = generateCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    verificationCodes.set(email, { ...stored, code, expiresAt });

    await transporter.sendMail({
      from: `"AirLink ✈️" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Nuevo código de verificación",
      html: `<p>Tu nuevo código es:</p><h2 style="letter-spacing:6px">${code}</h2><p>Vence en 10 minutos.</p>`,
    });

    res.json({ message: "Nuevo código enviado" });
  } catch (error) {
    console.error("Error en /resend-code:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// ======== Login (respuesta genérica para no enumerar) ========
router.post("/login", async (req, res) => {
  const db = req.app.get("db");
  const email = normalizeEmail(req.body.email);
  const contrasena = String(req.body.contrasena || "");

  if (!email || !contrasena)
    return res.status(400).json({ message: "Datos inválidos" });

  try {
    const [rows] = await db.execute(
      "SELECT * FROM usuario WHERE email = ? LIMIT 1",
      [email]
    );
    if (!rows.length)
      return res.status(401).json({ message: "Credenciales inválidas" });

    const user = rows[0];
    const ok = await bcrypt.compare(contrasena, user.contrasena);
    if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

    const token = signToken({ idUsuario: user.idUsuario, email: user.email });
    const { contrasena: _omit, ...usuarioSinPassword } = user;
    res.json({ message: "Login exitoso", token, usuario: usuarioSinPassword });
  } catch (error) {
    console.error("Error en /login:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// ======== Login con Google ========
router.post("/google", async (req, res) => {
  const db = req.app.get("db");
  const { googleId = "", nombreUsuario = "" } = req.body;
  const email = normalizeEmail(req.body.email);

  if (!googleId || !email)
    return res.status(400).json({ message: "Datos inválidos" });

  try {
    // Buscar por email primero y actualizar googleId si no estaba
    let [rows] = await db.execute(
      "SELECT * FROM usuario WHERE email = ? LIMIT 1",
      [email]
    );

    if (!rows.length) {
      await db.execute(
        "INSERT INTO usuario (nombreUsuario, email, googleId, idRol, verificado, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
        [nombreUsuario || email.split("@")[0], email, googleId, 1, true]
      );
      [rows] = await db.execute(
        "SELECT * FROM usuario WHERE email = ? LIMIT 1",
        [email]
      );
    } else if (!rows[0].googleId) {
      await db.execute(
        "UPDATE usuario SET googleId = ?, verificado = ? WHERE idUsuario = ?",
        [googleId, true, rows[0].idUsuario]
      );
      [rows] = await db.execute(
        "SELECT * FROM usuario WHERE email = ? LIMIT 1",
        [email]
      );
    }

    const user = rows[0];
    const token = signToken({ idUsuario: user.idUsuario, email: user.email });
    const { contrasena: _omit, ...usuarioSinPassword } = user;
    res.json({
      message: "Login con Google exitoso",
      token,
      usuario: usuarioSinPassword,
    });
  } catch (error) {
    console.error("Error en /google:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// ======== Perfil ========
router.get("/me", verifyToken, async (req, res) => {
  const db = req.app.get("db");
  try {
    const [rows] = await db.execute(
      "SELECT idUsuario, nombreUsuario, email, idRol, googleId, verificado FROM usuario WHERE idUsuario = ? LIMIT 1",
      [req.userId]
    );
    if (!rows.length)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ usuario: rows[0] });
  } catch (error) {
    console.error("Error en /me:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
