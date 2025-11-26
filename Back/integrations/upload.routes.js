import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configuración de almacenamiento - TODO en /uploads sin subcarpetas
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");

    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp-random-nombreoriginal
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, gif, webp)"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter,
});

// Ruta para subir una imagen
router.post("/imagen", upload.single("imagen"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se ha enviado ninguna imagen" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      mensaje: "Imagen subida exitosamente",
      url: imageUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Error al subir imagen:", error);
    res.status(500).json({ error: "Error al subir la imagen" });
  }
});

// Ruta para subir múltiples imágenes
router.post("/imagenes", upload.array("imagenes", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No se han enviado imágenes" });
    }

    const imageUrls = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
    }));

    res.status(200).json({
      mensaje: "Imágenes subidas exitosamente",
      imagenes: imageUrls,
    });
  } catch (error) {
    console.error("Error al subir imágenes:", error);
    res.status(500).json({ error: "Error al subir las imágenes" });
  }
});

// Ruta para eliminar una imagen
router.delete("/imagen", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "Se requiere la URL de la imagen" });
    }

    // Construir la ruta completa del archivo
    const filePath = path.join(__dirname, "..", url);

    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Imagen no encontrada" });
    }

    // Eliminar el archivo
    fs.unlinkSync(filePath);

    res.status(200).json({ mensaje: "Imagen eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar imagen:", error);
    res.status(500).json({ error: "Error al eliminar la imagen" });
  }
});

// Ruta para actualizar avatar de usuario
router.post(
  "/usuario/:id/avatar",
  upload.single("avatar"),
  async (req, res) => {
    try {
      const db = req.app.get("db");
      const { id } = req.params;

      if (!req.file) {
        return res
          .status(400)
          .json({ error: "No se ha enviado ninguna imagen" });
      }

      const avatarUrl = `/uploads/${req.file.filename}`;

      // Obtener el avatar anterior para eliminarlo
      const [user] = await db.query(
        "SELECT avatar FROM usuario WHERE idUsuario = ?",
        [id]
      );

      // Actualizar en la base de datos
      await db.query("UPDATE usuario SET avatar = ? WHERE idUsuario = ?", [
        avatarUrl,
        id,
      ]);

      // Eliminar avatar anterior si no es el default
      if (user[0]?.avatar && !user[0].avatar.includes("default-avatar.png")) {
        const oldAvatarPath = path.join(__dirname, "..", user[0].avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      res.status(200).json({
        mensaje: "Avatar actualizado exitosamente",
        avatar: avatarUrl,
      });
    } catch (error) {
      console.error("Error al actualizar avatar:", error);
      res.status(500).json({ error: "Error al actualizar el avatar" });
    }
  }
);

// Ruta para actualizar logo de empresa
router.post("/empresa/:id/logo", upload.single("logo"), async (req, res) => {
  try {
    const db = req.app.get("db");
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No se ha enviado ninguna imagen" });
    }

    const logoUrl = `/uploads/${req.file.filename}`;

    // Obtener el logo anterior
    const [empresa] = await db.query(
      "SELECT logo FROM empresa WHERE idEmpresa = ?",
      [id]
    );

    // Actualizar en la base de datos
    await db.query("UPDATE empresa SET logo = ? WHERE idEmpresa = ?", [
      logoUrl,
      id,
    ]);

    // Eliminar logo anterior si existe
    if (empresa[0]?.logo) {
      const oldLogoPath = path.join(__dirname, "..", empresa[0].logo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    res.status(200).json({
      mensaje: "Logo actualizado exitosamente",
      logo: logoUrl,
    });
  } catch (error) {
    console.error("Error al actualizar logo:", error);
    res.status(500).json({ error: "Error al actualizar el logo" });
  }
});

// Ruta para actualizar imagen de destino
router.post(
  "/destino/:id/imagen",
  upload.single("imagen"),
  async (req, res) => {
    try {
      const db = req.app.get("db");
      const { id } = req.params;

      if (!req.file) {
        return res
          .status(400)
          .json({ error: "No se ha enviado ninguna imagen" });
      }

      const imagenUrl = `/uploads/${req.file.filename}`;

      // Obtener la imagen anterior
      const [destino] = await db.query(
        "SELECT imagen FROM destino WHERE idDestino = ?",
        [id]
      );

      // Actualizar en la base de datos
      await db.query("UPDATE destino SET imagen = ? WHERE idDestino = ?", [
        imagenUrl,
        id,
      ]);

      // Eliminar imagen anterior si existe
      if (destino[0]?.imagen) {
        const oldImagePath = path.join(__dirname, "..", destino[0].imagen);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      res.status(200).json({
        mensaje: "Imagen de destino actualizada exitosamente",
        imagen: imagenUrl,
      });
    } catch (error) {
      console.error("Error al actualizar imagen de destino:", error);
      res.status(500).json({ error: "Error al actualizar la imagen" });
    }
  }
);

export { router };
