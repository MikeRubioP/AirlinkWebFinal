// src/Pages/Usuario/Contacto.jsx
import React, { useState } from "react";
import Swal from "sweetalert2";
import ValidatedInput from "../../Components/ValidatedInput.jsx";
import { validateEmail, validateFullName, sanitizeInput } from "../../utils/validators.js"; // Ajusta la ruta

// Validación personalizada para asunto
const validateAsunto = (asunto) => {
  const errors = [];
  const trimmed = asunto.trim();

  if (!trimmed) {
    errors.push("El asunto es obligatorio");
    return { isValid: false, errors, sanitized: "" };
  }

  if (trimmed.length < 3) {
    errors.push("El asunto debe tener al menos 3 caracteres");
  }

  if (trimmed.length > 120) {
    errors.push("El asunto no puede exceder 120 caracteres");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmed,
  };
};

// Validación personalizada para mensaje
const validateMensaje = (mensaje) => {
  const errors = [];
  const trimmed = mensaje.trim();

  if (!trimmed) {
    errors.push("El mensaje es obligatorio");
    return { isValid: false, errors, sanitized: "" };
  }

  if (trimmed.length < 10) {
    errors.push("El mensaje debe tener al menos 10 caracteres");
  }

  if (trimmed.length > 4000) {
    errors.push("El mensaje no puede exceder 4000 caracteres");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: trimmed,
  };
};

export default function Contacto() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    asunto: "",
    mensaje: "",
    hp: "", // honeypot: debe quedar vacío
  });

  const [touched, setTouched] = useState({
    nombre: false,
    email: false,
    asunto: false,
    mensaje: false,
  });

  const [validationErrors, setValidationErrors] = useState({
    nombre: [],
    email: [],
    asunto: [],
    mensaje: [],
  });

  const [sending, setSending] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));

    // Validar en tiempo real si el campo ya fue tocado
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const validateField = (fieldName, value) => {
    let validation;

    switch (fieldName) {
      case "nombre":
        validation = validateFullName(value);
        break;
      case "email":
        validation = validateEmail(value);
        break;
      case "asunto":
        validation = validateAsunto(value);
        break;
      case "mensaje":
        validation = validateMensaje(value);
        break;
      default:
        return true;
    }

    setValidationErrors((prev) => ({
      ...prev,
      [fieldName]: validation.errors,
    }));

    return validation.isValid;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    validateField(name, value);
  };

  const validateAllFields = () => {
    // Honeypot check (anti-bot)
    if (form.hp) {
      return false;
    }

    const nombreValidation = validateFullName(form.nombre);
    const emailValidation = validateEmail(form.email);
    const asuntoValidation = validateAsunto(form.asunto);
    const mensajeValidation = validateMensaje(form.mensaje);

    setValidationErrors({
      nombre: nombreValidation.errors,
      email: emailValidation.errors,
      asunto: asuntoValidation.errors,
      mensaje: mensajeValidation.errors,
    });

    setTouched({
      nombre: true,
      email: true,
      asunto: true,
      mensaje: true,
    });

    return (
      nombreValidation.isValid &&
      emailValidation.isValid &&
      asuntoValidation.isValid &&
      mensajeValidation.isValid
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validateAllFields()) {
      Swal.fire({
        icon: "warning",
        title: "Formulario incompleto",
        text: "Por favor corrige los errores antes de enviar.",
        confirmButtonColor: "#450d82",
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "¿Deseas enviar el mensaje? 💌",
      text: "Verifica que tus datos sean correctos.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, enviar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#450d82",
      cancelButtonColor: "#aaa",
    });

    if (!confirm.isConfirmed) return;

    setSending(true);

    try {
      // Sanitizar todos los datos antes de enviar
      const payload = {
        nombre: sanitizeInput(form.nombre),
        email: validateEmail(form.email).sanitized,
        asunto: sanitizeInput(form.asunto),
        mensaje: sanitizeInput(form.mensaje),
        meta: {
          ua: navigator.userAgent,
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };

      const res = await fetch("http://localhost:5174/contacto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || "No se pudo enviar el mensaje");
      }

      await Swal.fire({
        icon: "success",
        title: "¡Mensaje enviado! ✈️",
        text: "Gracias por contactarnos. Te responderemos pronto.",
        confirmButtonColor: "#450d82",
      });

      // Resetear formulario
      setForm({ nombre: "", email: "", asunto: "", mensaje: "", hp: "" });
      setTouched({ nombre: false, email: false, asunto: false, mensaje: false });
      setValidationErrors({ nombre: [], email: [], asunto: [], mensaje: [] });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al enviar",
        text: error.message || "Ocurrió un problema. Intenta nuevamente.",
        confirmButtonColor: "#450d82",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-[#242424]">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#450d82]/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#450d82]/15 blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 py-20 text-center relative z-10">
          <p className="inline-flex items-center gap-2 text-sm text-[#450d82] font-semibold bg-[#450d82]/10 px-3 py-1 rounded-full">
            📮 Contáctanos
          </p>
          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold leading-tight">
            ¿En qué podemos ayudarte?
          </h1>
          <p className="mt-3 text-[#5c5c66] max-w-2xl mx-auto">
            Nuestro equipo está disponible para resolver dudas sobre reservas,
            pagos, cambios o cualquier consulta relacionada con tus vuelos.
          </p>
        </div>
      </section>

      {/* GRID */}
      <section className="max-w-7xl mx-auto px-6 pb-16 grid lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-2 rounded-3xl border border-[#E7E7ED] bg-white p-6 md:p-8 shadow-sm hover:shadow-md transition">
          <h2 className="text-2xl font-bold text-[#450d82]">Envíanos un mensaje</h2>
          <p className="text-[#5c5c66] mb-6">
            Respondemos habitualmente en menos de 24 horas hábiles.
          </p>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {/* Honeypot (oculto) */}
            <input
              type="text"
              name="hp"
              value={form.hp}
              onChange={onChange}
              autoComplete="off"
              tabIndex={-1}
              className="hidden"
              aria-hidden="true"
            />

            <div className="grid md:grid-cols-2 gap-4">
              <ValidatedInput
                label="Nombre"
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                onBlur={handleBlur}
                placeholder="Tu nombre"
                errors={validationErrors.nombre}
                touched={touched.nombre}
                required
                maxLength={50}
                autoComplete="name"
              />

              <ValidatedInput
                label="Correo electrónico"
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                onBlur={handleBlur}
                placeholder="tucorreo@ejemplo.com"
                errors={validationErrors.email}
                touched={touched.email}
                required
                maxLength={100}
                autoComplete="email"
              />
            </div>

            <ValidatedInput
              label="Asunto"
              type="text"
              name="asunto"
              value={form.asunto}
              onChange={onChange}
              onBlur={handleBlur}
              placeholder="Consulta, cambio de vuelo, reembolso…"
              errors={validationErrors.asunto}
              touched={touched.asunto}
              required
              maxLength={120}
            />

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <textarea
                  name="mensaje"
                  value={form.mensaje}
                  onChange={onChange}
                  onBlur={handleBlur}
                  required
                  rows={6}
                  maxLength={4000}
                  className={`
                    w-full px-4 py-3 border rounded-lg 
                    focus:ring-2 focus:border-transparent outline-none
                    transition-colors duration-200 resize-y
                    ${touched.mensaje && validationErrors.mensaje.length > 0
                      ? "border-red-500 focus:ring-red-500"
                      : touched.mensaje && form.mensaje
                        ? "border-green-500 focus:ring-green-500"
                        : "border-gray-300 focus:ring-purple-600"
                    }
                  `}
                  placeholder="Cuéntanos tu caso con el mayor detalle posible."
                />
              </div>

              {/* Mensajes de error */}
              {touched.mensaje && validationErrors.mensaje.length > 0 && (
                <div className="mt-2 space-y-1">
                  {validationErrors.mensaje.map((error, index) => (
                    <p key={index} className="text-xs text-red-600 flex items-start">
                      <span className="mr-1">•</span>
                      <span>{error}</span>
                    </p>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-1">
                {form.mensaje.length} / 4000 caracteres. No adjuntes datos sensibles.
              </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <p className="text-xs text-[#8A8A8E]">
                Al enviar aceptas nuestra política de privacidad.
              </p>
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-3 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition disabled:opacity-60"
                style={{ background: "#450d82" }}
              >
                {sending ? "Enviando..." : "Enviar mensaje"}
              </button>
            </div>
          </form>
        </div>

        {/* Tarjetas de contacto */}
        <aside className="space-y-4">
          <ContactCard
            icon="📞"
            title="Soporte telefónico"
            lines={["+56 2 2345 6789", "Lun–Vie · 09:00–18:00"]}
          />
          <ContactCard
            icon="✉️"
            title="Correo de atención"
            lines={["soporte@airlink.com", "Respondemos < 24h hábiles"]}
          />
          <ContactCard
            icon="💬"
            title="WhatsApp"
            lines={["+56 9 8765 4321", "Respuestas rápidas"]}
          />
          <ContactCard
            icon="📍"
            title="Oficina central"
            lines={["Av. Ejemplo 123, Santiago", "Chile"]}
          />
        </aside>
      </section>

      {/* Mapa */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="rounded-3xl overflow-hidden border border-[#E7E7ED] bg-white shadow-sm hover:shadow-md transition">
          <iframe
            title="AirLink HQ"
            src="https://maps.google.com/maps?q=Santiago%20Chile&t=&z=12&ie=UTF8&iwloc=&output=embed"
            className="w-full h-[380px]"
            loading="lazy"
          />
        </div>
      </section>
    </div>
  );
}

/* -------- Subcomponentes -------- */
function ContactCard({ icon, title, lines = [] }) {
  return (
    <div className="rounded-2xl border border-[#E7E7ED] bg-white p-5 shadow-sm hover:shadow-md transition transform hover:-translate-y-1">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl grid place-items-center bg-[#450d82]/10 text-[#450d82] text-xl">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-[#450d82]">{title}</h3>
          {lines.map((l, i) => (
            <p key={i} className="text-sm text-[#5c5c66]">
              {l}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}