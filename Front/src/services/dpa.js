const BASE = "http://localhost:5174/dpa"; 

async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Error ${r.status} al consultar ${url}`);
  return r.json();
}

let _cacheComunas = null;
export const DPA = {
  comunas: async () => {
    if (_cacheComunas) return _cacheComunas;
    const data = await get(`${BASE}/comunas`);
    _cacheComunas = data.sort((a,b)=>a.nombre.localeCompare(b.nombre));
    return _cacheComunas;
  },
  regiones: () => get(`${BASE}/regiones`),
  provinciasPorRegion: (cod) => get(`${BASE}/regiones/${cod}/provincias`),
  comunasPorProvincia: (cod) => get(`${BASE}/provincias/${cod}/comunas`),
};
