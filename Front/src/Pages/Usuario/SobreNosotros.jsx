import React from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import Footer from "../../Components/Footer";

const heroImg = new URL("../../assets/airlinkLogo2.png", import.meta.url).href;

export default function SobreNosotros() {
  const handleSubscribe = async (e) => {
    e.preventDefault();
    const emailInput = e.target.querySelector("input");
    const email = emailInput.value.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire({
        icon: "error",
        title: "Correo inválido ❌",
        text: "Por favor ingresa un correo electrónico válido.",
        confirmButtonColor: "#450d82",
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "¿Confirmas tu suscripción? 💌",
      text: `Suscribiremos el correo: ${email}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, suscribirme",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#450d82",
      cancelButtonColor: "#d33",
    });

    if (confirm.isConfirmed) {
      await new Promise((r) => setTimeout(r, 800));
      Swal.fire({
        icon: "success",
        title: "¡Suscripción exitosa! ✈️",
        text: "Gracias por unirte a nuestras novedades y ofertas de viaje.",
        confirmButtonColor: "#450d82",
      });
      emailInput.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-[#242424] overflow-hidden">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#450d82]/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#450d82]/20 blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="animate-fade-in">
            <p className="inline-flex items-center gap-2 text-sm text-[#450d82] font-semibold bg-[#450d82]/10 px-3 py-1 rounded-full">
              ✈️ Sobre nosotros
            </p>
            <h1 className="mt-4 text-3xl md:text-4xl font-extrabold leading-tight text-[#1c1c1f]">
              Conectamos personas y destinos de forma simple, rápida y segura
            </h1>
            <p className="mt-4 text-lg text-[#5c5c66]">
              En <span className="font-semibold text-[#450d82]">AirLink</span> creemos que viajar debe ser
              una experiencia fluida y transparente. Desarrollamos soluciones digitales que simplifican el proceso de reserva y gestión de vuelos.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/ofertas"
                className="rounded-xl px-5 py-3 text-white font-medium shadow-md hover:shadow-lg transition"
                style={{ background: "#450d82" }}
              >
                Ver ofertas
              </Link>
              <Link
                to="/contacto"
                className="rounded-xl px-5 py-3 border border-[#E7E7ED] bg-white hover:bg-[#fafafe] transition"
              >
                Contáctanos
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl bg-white shadow-lg border border-[#E7E7ED] overflow-hidden grid place-items-center">
              <img
                src={heroImg}
                alt="AirLink"
                className="w-2/3 opacity-95 transform hover:scale-105 transition duration-500 rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* MISIÓN / VALORES */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Card title="Nuestra misión" icon="🌍">
            Democratizar los viajes ofreciendo una experiencia intuitiva, accesible y moderna,
            con soporte humano cuando lo necesites.
          </Card>
          <Card title="Transparencia" icon="💬">
            Mostramos precios claros y procesos simples. Tu tiempo vale, y queremos que viajar vuelva a ser un placer.
          </Card>
          <Card title="Innovación útil" icon="💡">
            Aplicamos diseño, datos e ingeniería para crear herramientas que realmente mejoren tu experiencia.
          </Card>
        </div>
      </section>

      {/* HISTORIA */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-6 text-[#450d82]">Nuestra historia</h2>
        <ol className="relative border-s border-[#E7E7ED] pl-6 space-y-8">
          <TimelineItem year="2023" title="Inicio del proyecto">
            Nace AirLink como una iniciativa universitaria enfocada en digitalizar el proceso de reserva de vuelos.
          </TimelineItem>
          <TimelineItem year="2024" title="Desarrollo del sistema">
            Se construye la arquitectura, el front-end y las conexiones de base de datos.
          </TimelineItem>
          <TimelineItem year="2025" title="Versión actual">
            Integración completa con paneles, reservas y administración web y de escritorio.
          </TimelineItem>
        </ol>
      </section>

      {/* EQUIPO */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-10 text-center text-[#450d82]">
          Conoce al equipo
        </h2>

        {/* Galería con animación */}
        <div className="flex flex-wrap justify-center gap-6">
          <Member name="Juan Paillán" role="Jefe de Proyecto" />
          <Member name="Felipe Lorca" role="Front-End & QA" />
          <Member name="Sebastián Muñoz" role="Arquitecto de Software" />
          <Member name="Michael Rubio" role="Backend Developer" />
          <Member name="Almendra Pavez" role="Front-End & Desktop Developer" />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="rounded-3xl border border-[#E7E7ED] bg-white p-10 md:p-12 text-center shadow-md">
          <h3 className="text-2xl font-bold text-[#450d82]">
            ¿Te unes a nuestro próximo destino?
          </h3>
          <p className="mt-2 text-[#5c5c66]">
            Recibe novedades, descuentos y tips de viaje una vez al mes.
          </p>
          <form
            onSubmit={handleSubscribe}
            className="mt-6 flex flex-col sm:flex-row gap-3 justify-center"
          >
            <input
              className="rounded-xl w-full sm:w-96 border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-[#450d82] outline-none"
              placeholder="tu@email.com"
            />
            <button
              className="rounded-xl px-6 py-3 text-white font-semibold shadow-md hover:shadow-lg transition"
              style={{ background: "#450d82" }}
              type="submit"
            >
              Suscribirme
            </button>
          </form>
        </div>
      </section>


    </div>
  );
}

/* ---------- Subcomponentes ---------- */

function Card({ title, icon, children }) {
  return (
    <div className="p-6 rounded-2xl border border-[#E7E7ED] bg-white shadow-sm hover:shadow-md transition">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-xl font-bold text-[#450d82]">{title}</h3>
      <p className="mt-2 text-[#5c5c66]">{children}</p>
    </div>
  );
}

function TimelineItem({ year, title, children }) {
  return (
    <li className="ms-4">
      <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#450d82]" />
      <div className="rounded-2xl border border-[#E7E7ED] bg-white p-5 shadow-sm hover:shadow-md transition">
        <div className="flex items-center gap-3">
          <span className="inline-flex text-xs font-semibold text-[#450d82] bg-[#450d82]/10 rounded-full px-2 py-0.5">
            {year}
          </span>
          <h3 className="font-semibold">{title}</h3>
        </div>
        <p className="mt-2 text-[#5c5c66]">{children}</p>
      </div>
    </li>
  );
}

function Member({ name, role }) {
  const avatar = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(
    name
  )}&backgroundType=gradientLinear&fontFamily=Inter&fontWeight=700&backgroundColor=b8a3f0,ede9fe`;

  return (
    <div className="rounded-3xl border border-[#E7E7ED] bg-white p-6 text-center shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">
      <img
        src={avatar}
        alt={name}
        className="w-24 h-24 rounded-full mx-auto object-cover shadow-md"
      />
      <h4 className="mt-4 font-semibold text-[#450d82]">{name}</h4>
      <p className="text-sm text-[#5c5c66]">{role}</p>
    </div>
  );
}