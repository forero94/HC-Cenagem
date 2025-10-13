import React from 'react';

export default function Grupo_Otros({ value, onChange }) {
  const v = value || {};
  const set = (k) => (e) => onChange?.(k, e.target.value);

  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-semibold text-slate-700">Otros motivos</h2>
      <p className="text-xs text-slate-500">Usá este espacio para registrar motivos no contemplados en los grupos principales.</p>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Descripción del caso</span>
        <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[90px]" value={v.otrosMotivo || ''} onChange={set('otrosMotivo')} placeholder="Resumen clínico y hallazgos clave" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Estudios realizados</span>
        <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.otrosEstudios || ''} onChange={set('otrosEstudios')} placeholder="Laboratorio, imágenes, genética, otras especialidades" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Plan / próximos pasos</span>
        <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.otrosPlan || ''} onChange={set('otrosPlan')} placeholder="Derivaciones, seguimiento, consultas pendientes" />
      </label>
    </section>
  );
}
