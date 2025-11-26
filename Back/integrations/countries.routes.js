import { Router } from "express";

export const countriesRoutes = Router();

const BASE = "https://restcountries.com/v3.1";

/** Helper para pedir y validar */
async function fetchJson(url) {
  const resp = await fetch(url, { redirect: "follow" });
  if (!resp.ok) {
    // lee el cuerpo para saber por qué
    const detail = await resp.text().catch(() => "");
    const err = new Error(`HTTP ${resp.status}`);
    err.status = resp.status;
    err.detail = detail;
    throw err;
  }
  return resp.json();
}

/** Mapea al formato que quieres exponer */
function mapCountry(c) {
  return {
    code2: c.cca2 ?? null,
    code3: c.cca3 ?? null,
    name: c.name?.common ?? null,
    officialName: c.name?.official ?? null,
    region: c.region ?? null,
    subregion: c.subregion ?? null,
    capital: Array.isArray(c.capital) ? c.capital[0] : c.capital ?? null,
    flag: c.flags?.svg ?? c.flags?.png ?? null,
    population: c.population ?? null,
  };
}

/**
 * GET /api/countries
 * Lista de países (subset de campos)
 */
countriesRoutes.get("/", async (req, res) => {
  try {
    // OJO: en v3.1 el campo se llama "cca2/cca3", no "alpha2Code".
    const url = `${BASE}/all?fields=name,cca2,cca3,region,subregion,capital,flags,population`;
    const data = await fetchJson(url);
    res.json(data.map(mapCountry));
  } catch (e) {
    console.error("[countries] / error:", e);
    res.status(e.status || 500).json({
      error: "Countries fetch error",
      detail: e.detail || e.message || String(e),
    });
  }
});

/**
 * GET /api/countries/region/:region
 * Ej: Americas, Europe, Asia, Africa, Oceania, Antarctic
 */
countriesRoutes.get("/region/:region", async (req, res) => {
  try {
    const region = req.params.region; // Usa valores válidos: "Americas", "Europe", etc.
    const url = `${BASE}/region/${encodeURIComponent(region)}?fields=name,cca2,cca3,region,subregion,capital,flags,population`;
    const data = await fetchJson(url);
    res.json(data.map(mapCountry));
  } catch (e) {
    console.error("[countries] /region error:", e);
    res.status(e.status || 500).json({
      error: "Countries by region error",
      detail: e.detail || e.message || String(e),
    });
  }
});

/**
 * GET /api/countries/code/:code
 * code puede ser CCA2 o CCA3 (CL, USA, etc.)
 */
countriesRoutes.get("/code/:code", async (req, res) => {
  try {
    const code = req.params.code;
    const url = `${BASE}/alpha/${encodeURIComponent(code)}?fields=name,cca2,cca3,region,subregion,capital,flags,population`;
    const data = await fetchJson(url); // devuelve array o objeto según código
    const country = Array.isArray(data) ? data[0] : data;
    if (!country) return res.status(404).json({ error: "Not found" });
    res.json(mapCountry(country));
  } catch (e) {
    console.error("[countries] /code error:", e);
    res.status(e.status || 500).json({
      error: "Country by code error",
      detail: e.detail || e.message || String(e),
    });
  }
});
