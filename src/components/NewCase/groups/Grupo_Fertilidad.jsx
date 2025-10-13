import React from 'react';

export default function Grupo_Fertilidad({ value, onChange }) {
  const v = value || {};
  const set = (k) => (e) => onChange?.(k, e.target.value);

  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-semibold text-slate-700">Fertilidad / asesoría preconcepcional</h2>
      <p className="text-xs text-slate-500">Documentá diagnósticos previos y enfoque reproductivo.</p>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Diagnósticos o hallazgos clave</span>
          <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.reproDiagnosticos || ''} onChange={set('reproDiagnosticos')} placeholder="Amenorrea, azoospermia, fallas implantatorias, alteraciones cromosómicas" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Tratamientos intentados</span>
          <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.reproTratamientos || ''} onChange={set('reproTratamientos')} placeholder="Estimulación ovárica, FIV, inseminaciones, medicamentos" />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Estudios genéticos / de portadores</span>
          <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.reproEstudiosPrevios || ''} onChange={set('reproEstudiosPrevios')} placeholder="Cariotipo, paneles, CFTR, X frágil, Y microdeleciones" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Plan o próximas acciones</span>
          <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.reproPlan || ''} onChange={set('reproPlan')} placeholder="Nuevos estudios, derivaciones, recomendación reproductiva" />
        </label>
      </div>
    </section>
  );
}
