// integrations/destinos.routes.js
import express from "express";

export const router = express.Router();

/**
 * GET /destinos
 * Query params:
 *  - q: string (busca en nombre/ciudad/pais)
 *  - destacado: "1"|"true" para solo destacados
 *  - activo: "0"|"false" para inactivos, por defecto 1
 *  - page: número (>=1)  default 1
 *  - pageSize: número (1..50) default 12
 *  - sort: "created_at" | "precio" | "nombre"  (default: created_at)
 *  - dir: "asc" | "desc"  (default: desc)
 */
router.get("/", async (req, res) => {
  try {
    const db = req.app.get("db");

    const q = (req.query.q || "").trim();
    const destacadoFlag =
      req.query.destacado === "1" || req.query.destacado === "true";
    const activoFlag =
      req.query.activo === "0" || req.query.activo === "false" ? 0 : 1;

    const page = Math.max(1, parseInt(req.query.page ?? "1", 10) || 1);
    const pageSize = Math.max(
      1,
      Math.min(50, parseInt(req.query.pageSize ?? "12", 10) || 12)
    );
    const offset = (page - 1) * pageSize;

    const allowedSort = new Set(["created_at", "precio", "nombre"]);
    const sort = allowedSort.has(String(req.query.sort))
      ? String(req.query.sort)
      : "created_at";
    const dir = String(req.query.dir).toLowerCase() === "asc" ? "ASC" : "DESC";

    const where = ["activo = ?"];
    const params = [activoFlag];

    if (destacadoFlag) where.push("destacado = 1");
    if (q) {
      where.push("(nombre LIKE ? OR ciudad LIKE ? OR pais LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Total
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM destino ${whereSql}`,
      params
    );
    const total = countRows?.[0]?.total ?? 0;

    // Lista (IMPORTANTE: LIMIT/OFFSET como literales numéricos ya validados)
    const listSql = `
      SELECT idDestino, nombre, precio, ciudad, pais, imagen, descripcion,
             destacado, activo, created_at
      FROM destino
      ${whereSql}
      ORDER BY ${sort} ${dir}
      LIMIT ${pageSize} OFFSET ${offset}
    `;
    const [rows] = await db.query(listSql, params);

    res.json({ total, page, pageSize, items: rows });
  } catch (err) {
    console.error("GET /destinos error:", err);
    res.status(500).json({ error: "Error al obtener destinos" });
  }
});

/**
 * GET /destinos/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const db = req.app.get("db");
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT idDestino, nombre, precio, ciudad, pais, imagen, descripcion,
              destacado, activo, created_at
       FROM destino
       WHERE idDestino = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Destino no encontrado" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("GET /destinos/:id error:", err);
    res.status(500).json({ error: "Error al obtener destino" });
  }
});

/**
 * POST /destinos
 * Body: { nombre, precio, ciudad, pais, imagen, descripcion?, destacado? }
 * (activo se crea por defecto en 1)
 */
router.post("/", async (req, res) => {
  try {
    const db = req.app.get("db");
    const { nombre, precio, ciudad, pais, imagen, descripcion, destacado } =
      req.body || {};

    if (!nombre || precio == null || !ciudad || !pais || !imagen) {
      return res.status(400).json({
        error:
          "Faltan campos requeridos: nombre, precio, ciudad, pais, imagen",
      });
    }

    const [result] = await db.query(
      `INSERT INTO destino
         (nombre, precio, ciudad, pais, imagen, descripcion, destacado, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        nombre,
        precio,
        ciudad,
        pais,
        imagen,
        descripcion ?? null,
        destacado ? 1 : 0,
      ]
    );

    res.status(201).json({
      mensaje: "Destino creado exitosamente",
      idDestino: result.insertId,
    });
  } catch (err) {
    console.error("POST /destinos error:", err);
    res.status(500).json({ error: "Error al crear destino" });
  }
});

/**
 * PUT /destinos/:id
 * Body permite actualizar cualquier campo: nombre, precio, ciudad, pais,
 * imagen, descripcion, destacado, activo
 */
router.put("/:id", async (req, res) => {
  try {
    const db = req.app.get("db");
    const { id } = req.params;

    const {
      nombre,
      precio,
      ciudad,
      pais,
      imagen,
      descripcion,
      destacado,
      activo,
    } = req.body || {};

    // Existe?
    const [exists] = await db.query(
      "SELECT idDestino FROM destino WHERE idDestino = ?",
      [id]
    );
    if (!exists.length) {
      return res.status(404).json({ error: "Destino no encontrado" });
    }

    const updates = [];
    const values = [];

    if (nombre !== undefined) {
      updates.push("nombre = ?");
      values.push(nombre);
    }
    if (precio !== undefined) {
      updates.push("precio = ?");
      values.push(precio);
    }
    if (ciudad !== undefined) {
      updates.push("ciudad = ?");
      values.push(ciudad);
    }
    if (pais !== undefined) {
      updates.push("pais = ?");
      values.push(pais);
    }
    if (imagen !== undefined) {
      updates.push("imagen = ?");
      values.push(imagen);
    }
    if (descripcion !== undefined) {
      updates.push("descripcion = ?");
      values.push(descripcion);
    }
    if (destacado !== undefined) {
      updates.push("destacado = ?");
      values.push(destacado ? 1 : 0);
    }
    if (activo !== undefined) {
      updates.push("activo = ?");
      values.push(activo ? 1 : 0);
    }

    if (!updates.length) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    values.push(id);

    await db.query(
      `UPDATE destino SET ${updates.join(", ")} WHERE idDestino = ?`,
      values
    );

    res.json({ mensaje: "Destino actualizado exitosamente" });
  } catch (err) {
    console.error("PUT /destinos/:id error:", err);
    res.status(500).json({ error: "Error al actualizar destino" });
  }
});

/**
 * DELETE /destinos/:id  (soft delete → activo = 0)
 */
router.delete("/:id", async (req, res) => {
  try {
    const db = req.app.get("db");
    const { id } = req.params;

    const [r] = await db.query(
      "UPDATE destino SET activo = 0 WHERE idDestino = ?",
      [id]
    );

    if (r.affectedRows === 0) {
      return res.status(404).json({ error: "Destino no encontrado" });
    }
    res.json({ mensaje: "Destino desactivado exitosamente" });
  } catch (err) {
    console.error("DELETE /destinos/:id error:", err);
    res.status(500).json({ error: "Error al eliminar destino" });
  }
});

/**
 * PATCH /destinos/:id/activar    → activo = 1
 */
router.patch("/:id/activar", async (req, res) => {
  try {
    const db = req.app.get("db");
    const { id } = req.params;

    const [r] = await db.query(
      "UPDATE destino SET activo = 1 WHERE idDestino = ?",
      [id]
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: "Destino no encontrado" });
    }
    res.json({ mensaje: "Destino activado" });
  } catch (err) {
    console.error("PATCH /destinos/:id/activar error:", err);
    res.status(500).json({ error: "Error al activar destino" });
  }
});

/**
 * PATCH /destinos/:id/destacado
 * Body: { value: boolean }
 */
router.patch("/:id/destacado", async (req, res) => {
  try {
    const db = req.app.get("db");
    const { id } = req.params;
    const value =
      req.body?.value === true || req.body?.value === 1 || req.body?.value === "1"
        ? 1
        : 0;

    const [r] = await db.query(
      "UPDATE destino SET destacado = ? WHERE idDestino = ?",
      [value, id]
    );
    if (r.affectedRows === 0) {
      return res.status(404).json({ error: "Destino no encontrado" });
    }
    res.json({ mensaje: "Destino actualizado", destacado: !!value });
  } catch (err) {
    console.error("PATCH /destinos/:id/destacado error:", err);
    res.status(500).json({ error: "Error al actualizar destacado" });
  }
});
