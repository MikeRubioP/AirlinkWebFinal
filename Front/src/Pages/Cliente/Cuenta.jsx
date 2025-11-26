// src/Pages/Cliente/Cuenta.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext"; // si no existe, ignora: el componente cae a mock

const BRAND = "#7C4DFF";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function Cuenta() {
  const auth = (typeof useAuth === "function" ? useAuth() : {}) || {};
  const { user, token, logout } = auth;

  // Estado de perfil
  const [perfil, setPerfil] = useState({
    nombre: "",
    apellido: "",
    email: "",
    documento: "",
    telefono: "",
    nivel: "Explorer",
    avatarUrl: "",
  });

  // Preferencias
  const [prefs, setPrefs] = useState({
    asiento: "pasillo",
    comida: "estandar",
    notificaciones: true,
  });

  // Seguridad
  const [pwd, setPwd] = useState({ actual: "", nueva: "", repetir: "" });

  // Métodos de pago (mock)
  const [cards, setCards] = useState([
    { id: 1, brand: "Visa", last4: "4242", exp: "12/28", predeterminada: true },
    { id: 2, brand: "Mastercard", last4: "0028", exp: "08/27", predeterminada: false },
  ]);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Carga de datos (mock si falla)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/usuarios/me`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error("No autorizado o endpoint no disponible");
        const data = await res.json();
        if (!alive) return;

        setPerfil({
          nombre: data.nombre || "",
          apellido: data.apellido || "",
          email: data.email || "",
          documento: data.documento || "",
          telefono: data.telefono || "",
          nivel: data.nivel || "Explorer",
          avatarUrl: data.avatarUrl || "",
        });
        setPrefs({
          asiento: data.prefs?.asiento || "pasillo",
          comida: data.prefs?.comida || "estandar",
          notificaciones: data.prefs?.notificaciones ?? true,
        });
      } catch {
        if (!alive) return;
        // Mock con datos del contexto si existen
        setPerfil((p) => ({
          ...p,
          nombre: user?.name?.split(" ")?.[0] || "Felipe",
          apellido: user?.name?.split(" ")?.slice(1).join(" ") || "González",
          email: user?.email || "felipe@example.com",
          documento: "12.345.678-9",
          telefono: "+56 9 5555 5555",
          nivel: "Explorer",
          avatarUrl: "",
        }));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, user]);

  // Guardar perfil + preferencias
  const onGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje("");
    try {
      const res = await fetch(`${API_URL}/api/usuarios/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...perfil, prefs }),
      });
      if (!res.ok) throw new Error("No se pudo guardar");
      setMensaje("✅ Cambios guardados");
    } catch (err) {
      setMensaje("⚠️ No se pudieron guardar los cambios");
    } finally {
      setGuardando(false);
      setTimeout(() => setMensaje(""), 3000);
    }
  };

  const onCambiarPwd = async (e) => {
    e.preventDefault();
    if (!pwd.nueva || pwd.nueva !== pwd.repetir) {
      setMensaje("⚠️ La nueva contraseña no coincide");
      setTimeout(() => setMensaje(""), 2500);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/usuarios/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(pwd),
      });
      if (!res.ok) throw new Error("No se pudo actualizar la contraseña");
      setMensaje("✅ Contraseña actualizada");
      setPwd({ actual: "", nueva: "", repetir: "" });
    } catch {
      setMensaje("⚠️ No se pudo actualizar la contraseña");
    } finally {
      setTimeout(() => setMensaje(""), 2500);
    }
  };

  const setPredeterminada = (id) => {
    setCards((prev) =>
      prev.map((c) => ({ ...c, predeterminada: c.id === id }))
    );
  };

  const eliminarTarjeta = (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const agregarTarjeta = () => {
    const id = Math.max(...cards.map((c) => c.id)) + 1;
    setCards((prev) => [
      ...prev,
      { id, brand: "Visa", last4: "1111", exp: "01/30", predeterminada: false },
    ]);
  };

  const cerrarSesion = () => {
    if (typeof logout === "function") logout();
    // redirige si quieres: window.location.href = "/";
  };

  const eliminarCuenta = async () => {
    const ok = confirm(
      "¿Seguro que deseas eliminar tu cuenta? Esta acción es irreversible."
    );
    if (!ok) return;
    try {
      await fetch(`${API_URL}/api/usuarios/me`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      setMensaje("✅ Cuenta eliminada");
      setTimeout(() => {
        if (typeof logout === "function") logout();
      }, 1200);
    } catch {
      setMensaje("⚠️ No se pudo eliminar la cuenta");
      setTimeout(() => setMensaje(""), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7FB]">
      <header className="max-w-5xl mx-auto px-6 pt-8 pb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold">Mi cuenta</h1>
        <p className="text-[#5c5c66] mt-1">Gestiona tus datos, preferencias y seguridad.</p>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-16 grid gap-6">
        {/* Mensajes */}
        {!!mensaje && (
          <div className="rounded-xl px-4 py-3 bg-white border border-[#E7E7ED]">
            {mensaje}
          </div>
        )}

        {/* Perfil Header */}
        <section className="rounded-2xl bg-white border border-[#E7E7ED] p-5 md:p-6 flex items-center gap-4">
          <Avatar name={`${perfil.nombre} ${perfil.apellido}`} url={perfil.avatarUrl} />
          <div className="flex-1">
            <div className="text-xl font-bold">{perfil.nombre} {perfil.apellido}</div>
            <div className="text-[#5c5c66] text-sm">{perfil.email}</div>
          </div>
          <span className="text-xs font-semibold text-[#7C4DFF] bg-[#7C4DFF]/10 rounded-full px-3 py-1">
            {perfil.nivel}
          </span>
        </section>

        {/* Datos + Preferencias */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* Datos personales */}
          <form onSubmit={onGuardar} className="rounded-2xl bg-white border border-[#E7E7ED] p-5 md:p-6">
            <h2 className="font-bold text-lg mb-4">Datos personales</h2>
            {loading ? (
              <div className="text-[#5c5c66]">Cargando…</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Nombre">
                    <input
                      className="input"
                      value={perfil.nombre}
                      onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
                    />
                  </Field>
                  <Field label="Apellido">
                    <input
                      className="input"
                      value={perfil.apellido}
                      onChange={(e) => setPerfil({ ...perfil, apellido: e.target.value })}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      className="input"
                      type="email"
                      value={perfil.email}
                      onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                    />
                  </Field>
                  <Field label="Documento">
                    <input
                      className="input"
                      value={perfil.documento}
                      onChange={(e) => setPerfil({ ...perfil, documento: e.target.value })}
                    />
                  </Field>
                  <Field label="Teléfono" full>
                    <input
                      className="input"
                      value={perfil.telefono}
                      onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="submit"
                    disabled={guardando}
                    className="px-5 py-2 rounded-xl text-white"
                    style={{ background: BRAND, opacity: guardando ? 0.7 : 1 }}
                  >
                    {guardando ? "Guardando…" : "Guardar cambios"}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Preferencias */}
          <div className="rounded-2xl bg-white border border-[#E7E7ED] p-5 md:p-6">
            <h2 className="font-bold text-lg mb-4">Preferencias de viaje</h2>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Asiento preferido">
                <select
                  className="input"
                  value={prefs.asiento}
                  onChange={(e) => setPrefs({ ...prefs, asiento: e.target.value })}
                >
                  <option value="pasillo">Pasillo</option>
                  <option value="ventana">Ventana</option>
                  <option value="centro">Centro</option>
                </select>
              </Field>
              <Field label="Tipo de comida">
                <select
                  className="input"
                  value={prefs.comida}
                  onChange={(e) => setPrefs({ ...prefs, comida: e.target.value })}
                >
                  <option value="estandar">Estándar</option>
                  <option value="vegetariana">Vegetariana</option>
                  <option value="vegana">Vegana</option>
                  <option value="sin-gluten">Sin gluten</option>
                </select>
              </Field>
              <label className="flex items-center gap-3 mt-1">
                <input
                  type="checkbox"
                  checked={prefs.notificaciones}
                  onChange={(e) => setPrefs({ ...prefs, notificaciones: e.target.checked })}
                />
                <span className="text-sm">Recibir notificaciones y alertas de vuelo</span>
              </label>
            </div>
          </div>
        </section>

        {/* Seguridad + Pagos */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* Seguridad */}
          <form onSubmit={onCambiarPwd} className="rounded-2xl bg-white border border-[#E7E7ED] p-5 md:p-6">
            <h2 className="font-bold text-lg mb-4">Seguridad</h2>
            <div className="grid gap-3">
              <Field label="Contraseña actual">
                <input
                  className="input"
                  type="password"
                  value={pwd.actual}
                  onChange={(e) => setPwd({ ...pwd, actual: e.target.value })}
                />
              </Field>
              <Field label="Nueva contraseña">
                <input
                  className="input"
                  type="password"
                  value={pwd.nueva}
                  onChange={(e) => setPwd({ ...pwd, nueva: e.target.value })}
                />
              </Field>
              <Field label="Repetir nueva contraseña">
                <input
                  className="input"
                  type="password"
                  value={pwd.repetir}
                  onChange={(e) => setPwd({ ...pwd, repetir: e.target.value })}
                />
              </Field>
              <div className="mt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white"
                  style={{ background: BRAND }}
                >
                  Actualizar contraseña
                </button>
              </div>
            </div>
          </form>

          {/* Métodos de pago */}
          <div className="rounded-2xl bg-white border border-[#E7E7ED] p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Métodos de pago</h2>
              <button onClick={agregarTarjeta} className="text-sm px-3 py-1.5 rounded-lg border">
                Agregar
              </button>
            </div>
            <div className="grid gap-3">
              {cards.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border p-3 flex items-center justify-between"
                >
                  <div className="text-sm">
                    <div className="font-semibold">{c.brand} •••• {c.last4}</div>
                    <div className="text-[#5c5c66]">Vence {c.exp}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.predeterminada ? (
                      <span className="text-xs font-semibold text-[#7C4DFF] bg-[#7C4DFF]/10 rounded-full px-2 py-0.5">
                        Predeterminada
                      </span>
                    ) : (
                      <button
                        className="text-xs px-2 py-1 rounded border"
                        onClick={() => setPredeterminada(c.id)}
                      >
                        Hacer predeterminada
                      </button>
                    )}
                    <button
                      className="text-xs px-2 py-1 rounded border"
                      onClick={() => eliminarTarjeta(c.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {cards.length === 0 && (
                <div className="text-sm text-[#5c5c66]">No tienes tarjetas guardadas.</div>
              )}
            </div>
          </div>
        </section>

        {/* Sesión */}
        <section className="rounded-2xl bg-white border border-[#E7E7ED] p-5 md:p-6 flex flex-wrap gap-3 justify-between items-center">
          <div>
            <h2 className="font-bold text-lg">Sesión</h2>
            <p className="text-[#5c5c66] text-sm">Cierra tu sesión o elimina tu cuenta.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={cerrarSesion} className="px-5 py-2 rounded-xl border">
              Cerrar sesión
            </button>
            <button
              onClick={eliminarCuenta}
              className="px-5 py-2 rounded-xl text-white"
              style={{ background: "#EF4444" }}
            >
              Eliminar cuenta
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function Field({ label, children, full }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "md:col-span-2" : ""}`}>
      <span className="text-sm text-[#5c5c66]">{label}</span>
      {children}
    </label>
  );
}

function Avatar({ name = "", url = "" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return url ? (
    <img src={url} alt={name} className="w-14 h-14 rounded-full object-cover" />
  ) : (
    <div
      className="w-14 h-14 rounded-full grid place-items-center text-white text-lg font-bold"
      style={{ background: BRAND }}
    >
      {initials || "U"}
    </div>
  );
}

/* Tailwind input util */
const inputBase =
  "w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#7C4DFF]/40";
if (typeof document !== "undefined") {
  // inyecta una clase 'input' simple (opcional)
  const style = document.createElement("style");
  style.innerHTML = `.input{${toCss({
    border: "1px solid #E7E7ED",
    borderRadius: "0.75rem",
    padding: "0.5rem 0.75rem",
    outline: "none",
  })}} .input:focus{box-shadow:0 0 0 3px rgba(124,77,255,.25)}`;
  document.head.appendChild(style);
}
function toCss(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
