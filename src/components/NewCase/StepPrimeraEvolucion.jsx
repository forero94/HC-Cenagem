import React, { useCallback } from 'react';

export default function StepPrimeraEvolucion({ value = {}, onChange }) {
  const currentValue = value.primeraEvolucion ?? value.resumenPrimeraConsulta ?? '';

  const handleChange = useCallback(
    (event) => {
      const nextValue = event.target.value;
      onChange?.('primeraEvolucion', nextValue);
      onChange?.('resumenPrimeraConsulta', nextValue);
    },
    [onChange],
  );

  return (
    <section className="grid gap-4">
      <div className="grid gap-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Primera evolución</h2>
        <p className="text-xs text-slate-500">
          Registrá la síntesis clínica inicial, impresiones diagnósticas y acuerdos con el equipo o la familia.
        </p>
        <textarea
          className="min-h-[160px] rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          placeholder="Anota los hallazgos relevantes, estudios solicitados y el plan acordado en esta primera consulta."
          value={currentValue}
          onChange={handleChange}
        />
      </div>
    </section>
  );
}
