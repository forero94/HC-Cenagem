import React from 'react';

export default function Grupo_Monogenica({ value, onChange }) {
  const v = value || {};
  const set = (k) => (e) => onChange?.(k, e.target.value);

  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-semibold text-slate-700">Plan para sospecha monogénica</h2>
      <p className="text-xs text-slate-500">Revisá la información clínica cargada en el paso previo y definí el abordaje complementario.</p>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Tratamiento / respuesta observada</span>
        <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.monoTratamiento || ''} onChange={set('monoTratamiento')} placeholder="Dietas, suplementos, terapias específicas, respuesta clínica" />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Plan de estudios propuesto</span>
          <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.monoPlanEstudios || ''} onChange={set('monoPlanEstudios')} placeholder="Secuenciación, validaciones, estudios familiares" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Notas adicionales</span>
          <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.monoNotas || ''} onChange={set('monoNotas')} placeholder="Documentación pendiente, derivaciones, alertas" />
        </label>
      </div>
    </section>
  );
}
