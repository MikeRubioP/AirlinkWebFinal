const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5174";

export async function searchAirports(q, limit = 10) {
  const res = await fetch(`${API_BASE}/api/airports/search?q=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) throw new Error("airport_search_failed");
  return (await res.json()).data || [];
}

export async function getAirport(iata) {
  const res = await fetch(`${API_BASE}/api/airports/${encodeURIComponent(iata)}`);
  if (!res.ok) throw new Error("airport_lookup_failed");
  return (await res.json()).data;
}
