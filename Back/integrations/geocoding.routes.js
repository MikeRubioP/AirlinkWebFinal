// integrations/geocoding.routes.js
import { Router } from "express";

export const geocodingRoutes = Router();

/**
 * GET /api/geocoding/search?q=San&count=5&language=es
 * Proxy hacia Open-Meteo Geocoding API (sin API key).
 */
geocodingRoutes.get("/search", async (req, res) => {
  try {
    const {
      q = "",                // texto a buscar
      count = 10,            // cantidad de resultados
      language = "es"        // idioma de nombres
    } = req.query;

    if (!q.trim()) {
      return res.json({ data: [] });
    }

    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", q);
    url.searchParams.set("count", count);
    url.searchParams.set("language", language);

    const r = await fetch(url);
    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: "geocoding error", detail: txt });
    }

    const json = await r.json();

    // Normalizamos el formato para tu frontend
    const data = (json.results || []).map((c) => ({
      id: c.id,                               // id interno open-meteo
      name: c.name,                           // nombre de ciudad
      country: c.country,                     // país
      admin1: c.admin1,                       // región/estado
      latitude: c.latitude,
      longitude: c.longitude,
      timezone: c.timezone,
      population: c.population ?? null,
      label: [c.name, c.admin1, c.country].filter(Boolean).join(", ")
    }));

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "geocoding error", detail: String(err) });
  }
});
