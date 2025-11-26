// src/Pages/Vuelos/components/StepsBar.jsx
import React from "react";

export default function StepsBar({ currentStep, roundTrip = true }) {
  // currentStep: 1 = Buscar, 2 = Ida, 3 = Vuelta, 4 = Resumen
  // roundTrip:   true = ida/vuelta, false = solo ida (entonces "Vuelta" va deshabilitada visualmente)

  const steps = [
    { num: 1, label: "Buscar" },
    { num: 2, label: "Ida" },
    { num: 3, label: "Vuelta", disabledIfOneWay: true },
    { num: 4, label: "Resumen" },
  ];

  return (
    <div className="w-full bg-gray-50 border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col items-center">
        {/* fila de pasos */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-gray-700">
          {steps.map((step, idx) => {
            const isActive = step.num === currentStep;
            const isPast = step.num < currentStep;
            const isFuture = step.num > currentStep;
            const isDisabledStep3 =
              step.num === 3 && step.disabledIfOneWay && !roundTrip;

            // estilos del circulito con el número
            let circleClass =
              "w-9 h-9 flex items-center justify-center rounded-full border text-sm font-semibold";
            let textClass = "";

            if (isDisabledStep3) {
                // paso 3 deshabilitado si es solo ida
                circleClass += " bg-gray-100 border-gray-300 text-gray-400";
                textClass = "text-gray-400";
            } else if (isActive) {
                // paso actual
                circleClass +=
                  " bg-purple-600 border-purple-600 text-white shadow";
                textClass = "text-gray-900";
            } else if (isPast) {
                // pasos anteriores (completados)
                circleClass +=
                  " bg-white border-purple-600 text-purple-600";
                textClass = "text-gray-900";
            } else if (isFuture) {
                // pasos que vienen después
                circleClass +=
                  " bg-gray-100 border-gray-300 text-gray-400";
                textClass = "text-gray-400";
            }

            return (
              <React.Fragment key={step.num}>
                <div className="flex items-center gap-2">
                  <div className={circleClass}>{step.num}</div>
                  <span className={textClass}>{step.label}</span>
                </div>

                {/* rayita separadora entre pasos, menos después del último */}
                {idx < steps.length - 1 && (
                  <div className="w-10 h-px bg-gray-300 hidden sm:block" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* título debajo de la barra de pasos lo renderiza cada página,
            así que acá NO ponemos el título */}
      </div>
    </div>
  );
}
