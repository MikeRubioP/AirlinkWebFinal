import React, { useMemo, useState } from "react";

/**
 * Flujo:
 * 1) Buscar reserva (código + apellido)
 * 2) Seleccionar asientos / equipaje / aceptar términos
 * 3) Resumen y confirmación
 *
 * Nota: está mockeado. Cuando tengas backend, reemplaza findBooking() y confirmCheckin().
 */

const BRAND = "#7C4DFF";

export default function CheckIn() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // Estado del formulario de búsqueda
    const [search, setSearch] = useState({ code: "", lastName: "" });

    // “Reserva” encontrada (mock)
    const [booking, setBooking] = useState(null);

    // Selecciones por pasajero
    const [choices, setChoices] = useState({}); // { paxId: { seat, extraBag, docsAccepted } }

    const canNext = useMemo(() => {
        if (step === 1) return !!booking;
        if (step === 2 && booking) {
            // todos con asiento y términos aceptados
            return booking.passengers.every(
                (p) =>
                    choices[p.id]?.seat &&
                    choices[p.id]?.docsAccepted === true
            );
        }
        return true;
    }, [step, booking, choices]);

    /* ---------- mock services ---------- */
    async function findBooking(code, last) {
        // Simula llamada a API
        await sleep(500);
        if (code.toUpperCase() !== "ABCD12" || last.trim().toLowerCase() !== "perez") {
            throw new Error("No encontramos una reserva con esos datos.");
        }
        // Devuelve una reserva de ejemplo
        return {
            code: "ABCD12",
            route: { from: "SCL", to: "LIM", date: "2025-11-18", dep: "08:30", arr: "10:40" },
            flight: "AL 348",
            passengers: [
                { id: "p1", name: "Juan Pérez", doc: "CHL 12.345.678-9" },
                { id: "p2", name: "Ana Pérez", doc: "CHL 21.654.987-0" },
            ],
            seatsAvailable: [
                "3A", "3B", "3C", "4A", "4B", "4C", "5A", "5B", "6C", "7A", "7C", "8B"
            ],
            baseFareCLP: 79990
        };
    }

    async function confirmCheckin(payload) {
        await sleep(600);
        return { ok: true, boardingPassUrl: "#" };
    }

    /* ---------- handlers ---------- */
    const onSearch = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);
        setBooking(null);
        setChoices({});
        try {
            const res = await findBooking(search.code, search.lastName);
            setBooking(res);
            // set default choices (sin asiento)
            const init = {};
            res.passengers.forEach((p) => {
                init[p.id] = { seat: "", extraBag: false, docsAccepted: false };
            });
            setChoices(init);
            setStep(2);
        } catch (e2) {
            setErr(e2.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleBag = (paxId) =>
        setChoices((c) => ({ ...c, [paxId]: { ...c[paxId], extraBag: !c[paxId].extraBag } }));

    const setSeat = (paxId, seat) =>
        setChoices((c) => ({ ...c, [paxId]: { ...c[paxId], seat } }));

    const acceptDocs = (paxId, v) =>
        setChoices((c) => ({ ...c, [paxId]: { ...c[paxId], docsAccepted: v } }));

    const onConfirm = async () => {
        setLoading(true);
        setErr("");
        try {
            const payload = { code: booking.code, choices };
            const res = await confirmCheckin(payload);
            if (!res.ok) throw new Error("No pudimos completar el check-in.");
            setStep(3);
        } catch (e2) {
            setErr(e2.message);
        } finally {
            setLoading(false);
        }
    };

    /* ---------- UI ---------- */
    return (
        <div className="min-h-screen bg-[#F7F7FB]">
            {/* Encabezado con progreso */}
            <header className="max-w-7xl mx-auto px-6 pt-10 pb-6">
                <h1 className="text-2xl md:text-3xl font-extrabold">Check-in</h1>
                <Progress step={step} />
            </header>

            <main className="max-w-7xl mx-auto px-6 pb-16">
                {/* Paso 1: Buscar */}
                {step === 1 && (
                    <section className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 rounded-3xl border border-[#E7E7ED] bg-white p-6 md:p-8">
                            <h2 className="text-xl font-bold mb-2">Busca tu reserva</h2>
                            <p className="text-[#5c5c66] mb-6">Ingresa el código de reserva (PNR) y el apellido del titular.</p>

                            {err && <Alert type="error" msg={err} />}

                            <form onSubmit={onSearch} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Código de reserva</label>
                                        <input
                                            value={search.code}
                                            onChange={(e) => setSearch({ ...search, code: e.target.value })}
                                            placeholder="ABCD12"
                                            className="input w-full rounded-xl border px-4 py-2 bg-white uppercase tracking-wider"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Apellido</label>
                                        <input
                                            value={search.lastName}
                                            onChange={(e) => setSearch({ ...search, lastName: e.target.value })}
                                            placeholder="Pérez"
                                            className="input w-full rounded-xl border px-4 py-2 bg-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-[#8A8A8E]">¿Problemas? Revisa el correo de confirmación.</p>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="rounded-xl px-6 py-3 text-white"
                                        style={{ background: BRAND, opacity: loading ? 0.7 : 1 }}
                                    >
                                        {loading ? "Buscando..." : "Buscar reserva"}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Tips */}
                        <aside className="space-y-4">
                            <Tip title="Documentos">
                                Ten a mano tu documento de identidad o pasaporte vigente.
                            </Tip>
                            <Tip title="Equipaje">
                                Puedes añadir 1 bulto adicional por pasajero durante el check-in.
                            </Tip>
                            <Tip title="Horario">
                                El check-in cierra 60 min antes de la salida del vuelo.
                            </Tip>
                        </aside>
                    </section>
                )}

                {/* Paso 2: Selecciones */}
                {step === 2 && booking && (
                    <section className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <FlightCard booking={booking} />

                            {booking.passengers.map((p) => (
                                <div key={p.id} className="rounded-3xl border border-[#E7E7ED] bg-white p-6">
                                    <h3 className="font-semibold">{p.name}</h3>
                                    <p className="text-sm text-[#5c5c66] mb-4">{p.doc}</p>

                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Asiento</label>
                                            <select
                                                value={choices[p.id]?.seat || ""}
                                                onChange={(e) => setSeat(p.id, e.target.value)}
                                                className="input w-full rounded-xl border px-4 py-2 bg-white"
                                                required
                                            >
                                                <option value="">Selecciona…</option>
                                                {booking.seatsAvailable.map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-1">Equipaje adicional</label>
                                            <div className="flex items-center gap-3 border rounded-xl px-4 py-2">
                                                <input
                                                    id={`bag-${p.id}`}
                                                    type="checkbox"
                                                    checked={choices[p.id]?.extraBag || false}
                                                    onChange={() => toggleBag(p.id)}
                                                    className="h-4 w-4"
                                                />
                                                <label htmlFor={`bag-${p.id}`} className="text-sm">
                                                    Añadir 1 bulto (+$12.000 CLP)
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2">
                                        <input
                                            id={`docs-${p.id}`}
                                            type="checkbox"
                                            checked={choices[p.id]?.docsAccepted || false}
                                            onChange={(e) => acceptDocs(p.id, e.target.checked)}
                                            className="h-4 w-4"
                                            required
                                        />
                                        <label htmlFor={`docs-${p.id}`} className="text-sm text-[#5c5c66]">
                                            Declaro que mis datos son correctos y acepto las políticas de viaje.
                                        </label>
                                    </div>
                                </div>
                            ))}

                            {err && <Alert type="error" msg={err} />}
                            <div className="flex justify-between">
                                <button
                                    className="rounded-xl border border-[#E7E7ED] px-5 py-3 bg-white hover:bg-[#fafafe]"
                                    onClick={() => setStep(1)}
                                >
                                    Volver
                                </button>
                                <button
                                    className="rounded-xl px-6 py-3 text-white disabled:opacity-60"
                                    style={{ background: BRAND }}
                                    onClick={onConfirm}
                                    disabled={!canNext || loading}
                                >
                                    {loading ? "Confirmando..." : "Confirmar check-in"}
                                </button>
                            </div>
                        </div>

                        {/* Resumen de costos */}
                        <aside className="rounded-3xl border border-[#E7E7ED] bg-white p-6 h-fit">
                            <h4 className="font-semibold mb-3">Resumen</h4>
                            <PriceBreakdown booking={booking} choices={choices} />
                        </aside>
                    </section>
                )}

                {/* Paso 3: Confirmado */}
                {step === 3 && booking && (
                    <section className="max-w-3xl mx-auto">
                        <div className="rounded-3xl border border-[#E7E7ED] bg-white p-8 text-center">
                            <div className="mx-auto h-12 w-12 rounded-full grid place-items-center text-white mb-3"
                                style={{ background: BRAND }}>
                                ✓
                            </div>
                            <h2 className="text-2xl font-bold">¡Check-in completado!</h2>
                            <p className="mt-2 text-[#5c5c66]">
                                Tu check-in para el vuelo {booking.flight} fue confirmado. Los pases de abordar se han enviado a tu correo.
                            </p>

                            <div className="mt-6 grid md:grid-cols-2 gap-4 text-left">
                                {booking.passengers.map((p) => (
                                    <div key={p.id} className="rounded-2xl border border-[#E7E7ED] p-4">
                                        <div className="font-semibold">{p.name}</div>
                                        <div className="text-sm text-[#5c5c66]">
                                            Asiento: {choices[p.id].seat} · {choices[p.id].extraBag ? "Con equipaje extra" : "Sin equipaje extra"}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex justify-center">
                                <a
                                    href="#"
                                    className="rounded-xl px-6 py-3 text-white"
                                    style={{ background: BRAND }}
                                >
                                    Descargar pases (PDF)
                                </a>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

/* ---------- Subcomponentes ---------- */

function Progress({ step }) {
    const items = ["Buscar", "Seleccionar", "Confirmar"];
    return (
        <div className="mt-3 flex items-center gap-3">
            {items.map((label, i) => {
                const n = i + 1;
                const active = step >= n;
                return (
                    <div key={label} className="flex items-center gap-3">
                        <div
                            className={`h-7 w-7 rounded-full grid place-items-center text-xs font-bold
               ${active ? "text-white" : "text-[#5c5c66] border border-[#E7E7ED]"}`}
                            style={{ background: active ? "#7C4DFF" : "white" }}
                        >
                            {n}
                        </div>
                        <span className={`text-sm ${active ? "font-semibold" : "text-[#5c5c66]"}`}>{label}</span>
                        {n < items.length && <div className="w-10 h-px bg-[#E7E7ED]" />}
                    </div>
                );
            })}
        </div>
    );
}

function Tip({ title, children }) {
    return (
        <div className="rounded-2xl border border-[#E7E7ED] bg-white p-5">
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm text-[#5c5c66] mt-1">{children}</p>
        </div>
    );
}

function FlightCard({ booking }) {
    return (
        <div className="rounded-3xl border border-[#E7E7ED] bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <div className="text-sm text-[#5c5c66]">Vuelo {booking.flight}</div>
                <div className="text-xl font-bold">{booking.route.from} → {booking.route.to}</div>
                <div className="text-sm text-[#5c5c66]">{booking.route.date} · {booking.route.dep}–{booking.route.arr}</div>
            </div>
            <div className="flex gap-2">
                <Badge>Tarifa Standard</Badge>
                <Badge>1× Equipaje de mano</Badge>
            </div>
        </div>
    );
}

function Badge({ children }) {
    return (
        <span className="inline-flex text-xs font-semibold text-[#7C4DFF] bg-[#7C4DFF]/10 rounded-full px-2 py-0.5">
            {children}
        </span>
    );
}

function PriceBreakdown({ booking, choices }) {
    const base = booking.baseFareCLP;
    const bags = Object.values(choices).filter((c) => c.extraBag).length;
    const bagTotal = bags * 12000;
    const total = base + bagTotal;

    return (
        <div className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span>Tarifa base</span>
                <span>${base.toLocaleString("es-CL")}</span>
            </div>
            <div className="flex justify-between">
                <span>Equipaje adicional ({bags})</span>
                <span>${bagTotal.toLocaleString("es-CL")}</span>
            </div>
            <div className="h-px bg-[#E7E7ED] my-2" />
            <div className="flex justify-between font-extrabold text-lg">
                <span>Total</span>
                <span>${total.toLocaleString("es-CL")}</span>
            </div>
        </div>
    );
}

function Alert({ type = "info", msg }) {
    const palette =
        type === "error"
            ? { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" }
            : { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" };
    return (
        <div className={`mb-4 rounded-xl ${palette.bg} ${palette.border} border px-4 py-3 ${palette.text}`}>
            {msg}
        </div>
    );
}

/* ---------- utils ---------- */
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }