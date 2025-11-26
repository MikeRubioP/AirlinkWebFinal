// AirLink-Backend/dpa.routes.js
import { Router } from "express";
import axios from "axios";

export const router = Router();

const BASE = "https://rest-sit.mop.gob.cl/arcgis/rest/services/INTEROP/SERVICIO_DPA/MapServer";
const http = axios.create({ timeout: 10000, headers: { Accept: "application/json" } });

// helper
const q = async (layer, params) => {
  const { data } = await http.get(`${BASE}/${layer}/query`, {
    params: { f: "json", returnGeometry: false, ...params },
  });
  return (data.features || []).map(f => f.attributes);
};

// Cache simple (24h)
const C = new Map(), TTL = 86400000;
const getC = k => { const v = C.get(k); return v && Date.now()<v.t ? v.d : null; };
const setC = (k,d) => C.set(k, { d, t: Date.now()+TTL });

// Regiones
router.get("/regiones", async (_req, res) => {
  const K = "regiones"; const hit = getC(K); if (hit) return res.json(hit);
  const rows = await q(3, { where: "1=1", outFields: "CUT_REG,REGION", orderByFields: "CUT_REG" });
  const out = rows.map(r => ({ codigo: String(r.CUT_REG), nombre: r.REGION }));
  setC(K, out); res.json(out);
});

// Provincias por región
router.get("/regiones/:codigo/provincias", async (req, res) => {
  const { codigo } = req.params; const K = `prov:${codigo}`; const hit = getC(K); if (hit) return res.json(hit);
  const rows = await q(2, { where: `CUT_REG='${codigo}'`, outFields: "CUT_PROV,PROVINCIA,CUT_REG", orderByFields: "PROVINCIA" });
  const out = rows.map(p => ({ codigo: String(p.CUT_PROV), nombre: p.PROVINCIA, codigo_region: String(p.CUT_REG) }));
  setC(K, out); res.json(out);
});

// Comunas por provincia
router.get("/provincias/:codigo/comunas", async (req, res) => {
  const { codigo } = req.params; const K = `com:${codigo}`; const hit = getC(K); if (hit) return res.json(hit);
  const rows = await q(1, { where: `CUT_PROV='${codigo}'`, outFields: "CUT_COM,COMUNA,CUT_PROV,CUT_REG", orderByFields: "COMUNA" });
  const out = rows.map(c => ({
    codigo: String(c.CUT_COM),
    nombre: c.COMUNA,
    codigo_provincia: String(c.CUT_PROV),
    codigo_region: String(c.CUT_REG),
  }));
  setC(K, out); res.json(out);
});

// (útil para tu barra) TODAS las comunas
router.get("/comunas", async (_req, res) => {
  const K = "comunas:all"; const hit = getC(K); if (hit) return res.json(hit);
  const rows = await q(1, { where: "1=1", outFields: "CUT_COM,COMUNA,CUT_PROV,CUT_REG", orderByFields: "COMUNA" });
  const out = rows.map(c => ({
    codigo: String(c.CUT_COM),
    nombre: c.COMUNA,
    codigo_provincia: String(c.CUT_PROV),
    codigo_region: String(c.CUT_REG),
  }));
  setC(K, out); res.json(out);
});
