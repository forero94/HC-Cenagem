import React from 'react';

export default function Grupo_Talla({ value, onChange }) {
  const v = value || {};
  const set = (k) => (e) => onChange?.(k, e.target.value);

  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-semibold text-slate-700">Alteraciones de la talla</h2>
      <p className="text-xs text-slate-500">Registrá el patrón de crecimiento y los estudios orientados a talla.</p>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Edad de inicio / detección</span>
          <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.tallaEdadInicio || ''} onChange={set('tallaEdadInicio')} placeholder="Ej. control de los 6 años" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Historia familiar de talla</span>
          <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.tallaFamiliaAdultos || ''} onChange={set('tallaFamiliaAdultos')} placeholder="Tallas parentales, antecedentes de displasias" />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Estudios complementarios</span>
          <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.tallaEstudiosPrevios || ''} onChange={set('tallaEstudiosPrevios')} placeholder="Edad ósea, hormonas de crecimiento, perfil tiroideo, imágenes" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Tratamientos / intervenciones</span>
          <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.tallaTratamientos || ''} onChange={set('tallaTratamientos')} placeholder="Hormona de crecimiento, suplementos, traumatología" />
        </label>
      </div>
    </section>
  );
}
