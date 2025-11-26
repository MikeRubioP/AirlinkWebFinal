// index.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";

// Rutas
import { router as authRoutes } from "./integrations/auth.routes.js";
import { router as destinosRoutes } from "./integrations/destinos.routes.js";
import { router as dpaRoutes } from "./integrations/dpa.routes.js";
import { router as busesRoutes } from "./integrations/buses.routes.js";
import { router as vuelosRoutes } from "./integrations/vuelos.routes.js";
import { router as uploadRoutes } from "./integrations/upload.routes.js";
import { router as pagosRoutes } from "./integrations/pagos.routes.js";
import { countriesRoutes } from "./integrations/countries.routes.js";
import { geocodingRoutes } from "./integrations/geocoding.routes.js";
import { router as contactoRoutes } from "./integrations/contacto.routes.js";
import { router as airportsRoutes } from "./integrations/airports.routes.js"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? Number(process.env.PORT) : 5174;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const startServer = async () => {
  try {
    // Pool de BD
    const db = await mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "airlink",
      password: process.env.DB_PASS || "airlink",
      database: process.env.DB_NAME || "Airlink",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Probar conexión
    await db.query("SELECT 1");
    console.log("✅ Conexión a la base de datos establecida");

    const app = express();

    // ---------------------------
    // Seguridad + CORS global
    // ---------------------------
    app.use(
      cors({
        origin: ALLOWED_ORIGINS,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    // Helmet (evita bloquear recursos embebidos; CORP lo seteamos en /uploads)
    app.use(
      helmet({
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: { policy: "same-origin" },
      })
    );

    // Parsers
    app.use(express.json({ limit: "1mb" }));
    app.use(express.urlencoded({ extended: true }));

    // ---------------------------
    // Archivos estáticos /uploads
    // ---------------------------
    app.use(
      "/uploads",
      cors({ origin: ALLOWED_ORIGINS, credentials: true }),
      (req, res, next) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        next();
      },
      express.static(path.join(__dirname, "uploads"))
    );

    // Inyectar DB en app
    app.set("db", db);

    // ---------------------------
    // Rutas
    // ---------------------------
    app.use("/auth", authRoutes);
    app.use("/upload", uploadRoutes);
    app.use("/destinos", destinosRoutes);
    app.use("/dpa", dpaRoutes);
    app.use("/buses", busesRoutes);
    app.use("/vuelos", vuelosRoutes);
    app.use("/pagos", pagosRoutes);

    // APIs bajo /api/*
    app.use("/api/countries", countriesRoutes);
    app.use("/api/geocoding", geocodingRoutes);
    app.use("/airports", airportsRoutes); 

    // Contacto (si tu router ya incluye prefijo interno, déjalo así como lo tenías)
    app.use("/contacto", contactoRoutes);

    // Rutas de diagnóstico
    app.get("/api/test", (req, res) => {
      res.json({
        message: "API de AirLink funcionando correctamente ✈️",
        timestamp: new Date().toISOString(),
      });
    });

    app.get("/health", async (req, res) => {
      try {
        await db.query("SELECT 1");
        res.json({
          status: "ok",
          database: "connected",
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          status: "error",
          database: "disconnected",
          error: error.message,
        });
      }
    });

    // 404
    app.use((req, res) => {
      console.log("⚠️ Ruta no encontrada:", req.method, req.path);
      res.status(404).json({
        error: "Ruta no encontrada",
        ruta: req.path,
        metodo: req.method,
      });
    });

    // Error handler
    app.use((err, req, res, next) => {
      console.error("❌ Error:", err);
      res.status(err.status || 500).json({
        error: err.message || "Error interno del servidor",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      });
    });

    // Arrancar
    app.listen(PORT, () => {
      console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
      console.log(`🌍 http://localhost:${PORT}`);
      console.log("\n📍 Rutas principales:");
      console.log("   - POST   /auth/login");
      console.log("   - POST   /auth/register");
      console.log("   - POST   /upload");
      console.log("   - GET    /destinos");
      console.log("   - GET    /dpa");
      console.log("   - GET    /buses");
      console.log("   - GET    /vuelos/buscar");
      console.log("   - GET    /vuelos/destinos");
      console.log("   - GET    /vuelos/:idViaje");       
    });

    // Cierre graceful
    const shutdown = async (signal) => {
      console.log(`📴 ${signal} recibido, cerrando servidor...`);
      try {
        await db.end();
      } finally {
        process.exit(0);
      }
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

startServer();
