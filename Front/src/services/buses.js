const API = "http://localhost:5174";

export const BusesAPI = {
  buscar: (payload) =>
    fetch(`${API}/buses/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(r => { if(!r.ok) throw new Error(r.status); return r.json(); }),
};
