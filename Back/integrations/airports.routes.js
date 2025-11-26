// integrations/airports.routes.js
import express from "express";
import Papa from "papaparse";

export const router = express.Router();

const OURAIRPORTS_URL =
  "https://davidmegginson.github.io/ourairports-data/airports.csv";

let AIRPORTS = [];
let LAST_LOAD = 0;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 h

async function loadAirports(force = false) {
  const now = Date.now();
  if (!force && AIRPORTS.length && now - LAST_LOAD < TTL_MS) return;

  try {
    const res = await fetch(OURAIRPORTS_URL);
    const csvText = await res.text();
    const parsed = Papa.parse(csvText, { header: true });

    // Solo aeropuertos grandes/medios con código IATA
    AIRPORTS = (parsed.data || [])
      .filter((r) => {
        const isAirport =
          r.type === "large_airport" || r.type === "medium_airport";
        const hasIATA = r.iata_code && r.iata_code.length === 3;
        return isAirport && hasIATA;
      })
      .map((r) => ({
        id: r.ident,
        iata: r.iata_code,
        icao: r.gps_code || r.local_code || "",
        name: r.name,
        city: r.municipality || "",
        country: r.iso_country || "", // <- código de país de 2 letras (AR, CL, etc.)
        type: r.type,
        lat: r.latitude_deg ? Number(r.latitude_deg) : null,
        lon: r.longitude_deg ? Number(r.longitude_deg) : null,
      }));

    LAST_LOAD = now;
    console.log(
      `✅ [airports] Cargados ${AIRPORTS.length} aeropuertos (large/medium) con IATA`
    );
  } catch (err) {
    console.error("❌ Error cargando aeropuertos:", err);
  }
}

function simpleSearch(q, limit = 10) {
  const term = q.trim().toLowerCase();
  const out = [];
  for (const a of AIRPORTS) {
    if (
      a.iata.toLowerCase().includes(term) ||
      a.name.toLowerCase().includes(term) ||
      a.city.toLowerCase().includes(term) ||
      a.country.toLowerCase().includes(term)
    ) {
      out.push(a);
      if (out.length >= limit) break;
    }
  }
  return out;
}

router.get("/search", async (req, res) => {
  try {
    await loadAirports();
    const { q = "", limit = "10" } = req.query;
    if (!q || String(q).trim().length === 0) return res.json({ data: [] });

    const n = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 25);
    const data = simpleSearch(String(q), n);
    res.json({ data });
  } catch (err) {
    console.error("❌ Error en /search:", err);
    res.status(500).json({ error: "airport_search_failed" });
  }
});

router.get("/:iata", async (req, res) => {
  try {
    await loadAirports();
    const code = String(req.params.iata || "").toUpperCase();
    const a = AIRPORTS.find((x) => x.iata === code);
    if (!a) return res.status(404).json({ error: "not_found" });
    res.json({ data: a });
  } catch (err) {
    console.error("❌ Error en /:iata:", err);
    res.status(500).json({ error: "airport_lookup_failed" });
  }
});
