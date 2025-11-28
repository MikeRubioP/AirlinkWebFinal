import React, { useMemo, useState } from "react";
import Swal from "sweetalert2";
import Footer from "../../Components/Footer";

export default function Cupones() {
  const [copied, setCopied] = useState("");

  const couponCategories = useMemo(
    () => [
      {
        id: 1,
        name: "Viajero",
        description: "Ideal para tu primer compra o viajes ocasionales",
        discount: "Ahorra $30.000",
        code: "VIAJERO30",
        features: [
          "1 cupón por pedido",
          "Válido en rutas nacionales e internacionales",
          "Disponible por tiempo limitado",
          "Cancelación sin previo sin comisión",
        ],
        benefits: [
          "Ahorra $30.000 en tu viaje",
          "Válido en vuelos y buses",
          "Descuentos exclusivos en check-in",
        ],
      },
      {
        id: 2,
        name: "Explorador",
        description:
          "Descuento especial para viajes continuados y experiencias únicas",
        discount: "Ahorra $100.000",
        code: "EXPLORADOR100",
        features: [
          "Rescate 5 cupón en vuelos y 1 en bus",
          "Sin límite de fechas de vigencia hasta agotar promoción",
          "Acumulables con puntos AirMiles",
          "Cancelación sin previos de comisión",
        ],
        benefits: [
          "Ahorra $100.000 en tu viaje",
          "Válido en vuelos + bus combinados",
          "Acceso prioritario check-in",
          "Transferible a pasajeros del mismo pedido",
          "Soporte prioritario 24/7",
        ],
      },
      {
        id: 3,
        name: "Premium",
        description: "Perfecto para viajes grandes o grupos familiares",
        discount: "Ahorra $250.000",
        code: "PREMIUM250",
        features: [
          "Válido en modalidades vuelo y bus",
          "Aplica grupos grandes o familiares",
          "Sin límite de uso anual",
          "Reembolso por cambios de itinerario",
        ],
        benefits: [
          "Ahorra $250.000 en tu viaje",
          "Advanced asistente priority",
          "Upgrades gratis en disponibilidad",
          "Beneficios integrantes",
          "Zona integradas",
        ],
      },
    ],
    []
  );

  // ✅ Función actualizada con mensaje mejorado
  const copy = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(txt);

      Swal.fire({
        title: "¡Código copiado!",
        text: `El cupón ${txt} se ha copiado. Úsalo al momento de pagar 🎉`,
        icon: "success",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#7C3AED",
        timer: 2500,
        timerProgressBar: true,
      });

      setTimeout(() => setCopied(""), 1200);
    } catch {
      Swal.fire({
        title: "Error",
        text: "No se pudo copiar el cupón 😞",
        icon: "error",
        confirmButtonText: "Intentar nuevamente",
        confirmButtonColor: "#7C3AED",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Banner superior */}
      <img
        src="src/assets/Banners.png"
        alt="Banner Cupones"
        className="w-full h-48 md:h-64 rounded-2xl shadow-sm object-cover"
      />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          Elige el cupón que se ajuste a tus necesidades
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Selecciona el plan que mejor se adapte a tu forma de viajar y comienza
          a ahorrar en tus próximas aventuras
        </p>
      </section>

      {/* Coupon Cards Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-20 flex-grow">
        <div className="grid md:grid-cols-3 gap-6">
          {couponCategories.map((category) => (
            <CouponCategoryCard
              key={category.id}
              category={category}
              onCopy={() => copy(category.code)}
              copied={copied === category.code}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function CouponCategoryCard({ category, onCopy, copied }) {
  return (
    <div className="rounded-3xl border-2 border-gray-200 bg-gray-50 p-8 flex flex-col transition-all hover:shadow-lg hover:border-purple-300">
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{category.name}</h3>
      <p className="text-sm text-gray-600 mb-4 min-h-[40px]">
        {category.description}
      </p>

      <div className="mb-6">
        <div className="text-3xl font-black text-gray-900">
          {category.discount}
        </div>
      </div>

      {/* ✅ CAMBIO: Texto del botón actualizado */}
      <button
        onClick={onCopy}
        className="w-full py-3 bg-violet-600 text-white rounded-full hover:bg-violet-700 transition font-semibold mb-6"
      >
        {copied ? "¡Código copiado!" : "Copiar código"}
      </button>

      <div className="mb-6">
        <ul className="space-y-2">
          {category.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-violet-600 mt-0.5">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-300 pt-6 mt-auto">
        <h4 className="font-bold text-gray-900 mb-3">Beneficios</h4>
        <ul className="space-y-2">
          {category.benefits.map((benefit, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 p-3 bg-violet-100 rounded-xl text-center">
        <p className="text-xs text-gray-600 mb-1">Código del cupón</p>
        <p className="font-bold text-violet-700 text-lg">{category.code}</p>
      </div>
    </div>
  );
}