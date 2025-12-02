import React, { useMemo, useState } from "react";

const BRAND = "#7C4DFF";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function CheckIn() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // Estado del formulario de búsqueda
    const [search, setSearch] = useState({ code: "", lastName: "" });

    // Reserva encontrada (desde BD)
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

    /* ---------- servicios reales con BD ---------- */
    async function findBooking(code, lastName) {
        console.log('🔍 Buscando reserva:', code, lastName);
        
        const response = await fetch(`${API_URL}/api/reservas/buscar-checkin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                codigo: code,
                apellido: lastName
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Manejar errores específicos del servidor
            throw new Error(data.mensaje || 'No encontramos una reserva con esos datos.');
        }

        console.log('✅ Reserva encontrada:', data);

        // Transformar respuesta de la BD al formato que usa el componente
        return {
            id: data.id,
            code: data.codigo,
            route: {
                from: data.origen,
                to: data.destino,
                fromName: data.origenNombre,
                toName: data.destinoNombre,
                date: data.fechaSalida,
                dep: data.hSalida,
                arr: data.hLlegada
            },
            flight: data.vuelo,
            passengers: [
                {
                    id: data.pasajero.id,
                    name: data.pasajero.nombreCompleto,
                    doc: data.pasajero.documento
                }
            ],
            // Los asientos ya seleccionados
            selectedSeats: data.asientos.map(a => a.numero),
            // Asientos disponibles (mock - deberías obtenerlos del backend)
            seatsAvailable: data.asientos.map(a => a.numero).concat([
                "3A", "3B", "3C", "4A", "4B", "4C", "5A", "5B", "6C", "7A", "7C", "8B"
            ]),
            baseFareCLP: data.montoTotal || 79990,
            estado: data.estado,
            puedeHacerCheckin: data.puedeHacerCheckin,
            horasRestantes: data.horasRestantes
        };
    }

    async function confirmCheckin(payload) {
        console.log('✅ Confirmando check-in:', payload);
        
        const response = await fetch(`${API_URL}/api/checkin/confirmar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idReserva: booking.id,
                pasajeros: payload.choices
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.mensaje || 'Error al confirmar check-in');
        }
        
        return data;
    }
    

    async function sendBoardingPass() {
        try {
            setLoading(true);
            setErr("");
            
            console.log('📧 Enviando pase de abordar...');
            
            const response = await fetch(`${API_URL}/api/checkin/send-boarding-pass`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idReserva: booking.id })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // ✅ Mensaje simple - email REAL enviado
                alert(`✅ Pase de abordar enviado exitosamente a:\n${data.email}\n\nRevisa tu bandeja de entrada (y spam si no lo ves).`);
            } else {
                throw new Error(data.mensaje || 'Error al enviar email');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            
            let mensaje = error.message;
            
            if (error.message === 'Failed to fetch') {
                mensaje = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
            }
            
            alert(`❌ Error al enviar email:\n${mensaje}`);
            setErr(mensaje);
        } finally {
            setLoading(false);
        }
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
            
            console.log('📊 Datos recibidos:', {
                estado: res.estado,
                puedeHacerCheckin: res.puedeHacerCheckin,
                horasRestantes: res.horasRestantes
            });
            
            // ⚠️ IMPORTANTE: Comentar esta validación temporalmente para debugging
            // if (!res.puedeHacerCheckin) {
            //     throw new Error('Esta reserva no está disponible para check-in. Verifica el estado de tu reserva.');
            // }
            
            // Mostrar advertencia en lugar de error
            if (!res.puedeHacerCheckin) {
                console.warn('⚠️ puedeHacerCheckin es false, pero continuando...');
                setErr(`Advertencia: Estado de reserva "${res.estado}". Horas restantes: ${res.horasRestantes}h`);
            }
            
            setBooking(res);
            
            // Inicializar choices con los asientos ya seleccionados
            const init = {};
            res.passengers.forEach((p, index) => {
                init[p.id] = {
                    seat: res.selectedSeats[index] || "",
                    extraBag: false,
                    docsAccepted: false
                };
            });
            setChoices(init);
            setStep(2);
            
        } catch (e2) {
            console.error('❌ Error al buscar:', e2);
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
                                            placeholder="RES-7 o RES241129MPZR"
                                            className="input w-full rounded-xl border px-4 py-2 bg-white uppercase tracking-wider"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Acepta: RES-7, RES241129MPZR, o solo el número
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Apellido</label>
                                        <input
                                            value={search.lastName}
                                            onChange={(e) => setSearch({ ...search, lastName: e.target.value })}
                                            placeholder="Lorca"
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

                            {/* Mostrar advertencia si no puede hacer check-in */}
                            {!booking.puedeHacerCheckin && (
                                <Alert type="warning" msg={`Nota: Esta reserva está en estado "${booking.estado}". Asegúrate de que esté confirmada antes del vuelo.`} />
                            )}

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

                            <div className="mt-8 flex justify-center gap-3 flex-wrap">
                                <a
                                    href={`${API_URL}/api/checkin/boarding-pass/${booking.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-xl px-6 py-3 text-white"
                                    style={{ background: BRAND }}
                                >
                                    📄 Descargar pases (PDF)
                                </a>
                                <button
                                    onClick={sendBoardingPass}
                                    disabled={loading}
                                    className="rounded-xl px-6 py-3 text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                >
                                    {loading ? '📧 Enviando...' : '📧 Enviar por email'}
                                </button>
                                <button
                                    onClick={() => {
                                        setStep(1);
                                        setBooking(null);
                                        setChoices({});
                                        setSearch({ code: "", lastName: "" });
                                    }}
                                    className="rounded-xl border border-[#E7E7ED] px-5 py-3 bg-white hover:bg-[#fafafe]"
                                >
                                    Nuevo check-in
                                </button>
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
            <div className="flex gap-2 flex-wrap">
                <Badge color={booking.estado === 'confirmada' ? 'green' : 'yellow'}>
                    Estado: {booking.estado}
                </Badge>
                {booking.horasRestantes !== undefined && (
                    <Badge color="purple">{booking.horasRestantes}h hasta el vuelo</Badge>
                )}
            </div>
        </div>
    );
}

function Badge({ children, color = 'purple' }) {
    const colors = {
        purple: 'text-[#7C4DFF] bg-[#7C4DFF]/10',
        green: 'text-green-600 bg-green-100',
        yellow: 'text-yellow-600 bg-yellow-100'
    };
    
    return (
        <span className={`inline-flex text-xs font-semibold rounded-full px-2 py-0.5 ${colors[color]}`}>
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
    const palettes = {
        error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
        warning: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
        info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" }
    };
    
    const palette = palettes[type] || palettes.info;
    
    return (
        <div className={`mb-4 rounded-xl ${palette.bg} ${palette.border} border px-4 py-3 ${palette.text}`}>
            {msg}
        </div>
    );
}

/* ---------- utils ---------- */
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }