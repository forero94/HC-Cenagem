import React from 'react';

export default function Grupo_Onco({ value, onChange }) {
  const v = value || {};
  const set = (k) => (e) => onChange?.(k, e.target.value);

  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-semibold text-slate-700">Predisposición oncológica</h2>
      <p className="text-xs text-slate-500">Profundizá en el árbol familiar y los estudios disponibles.</p>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Historia familiar detallada</span>
        <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[90px]" value={v.oncoArbolFamiliar || ''} onChange={set('oncoArbolFamiliar')} placeholder="Ginealograma, edades al diagnóstico, parentescos" />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Modelos de riesgo / criterios</span>
          <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.oncoRiesgoModelos || ''} onChange={set('oncoRiesgoModelos')} placeholder="BOADICEA, NCCN, Amsterdam, PREMM, otros" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Estudios genéticos disponibles</span>
          <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.oncoEstudiosDisponibles || ''} onChange={set('oncoEstudiosDisponibles')} placeholder="Paneles multigén, BRCA1/2, MMR, TP53, etc." />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Plan de seguimiento / recomendaciones</span>
        <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.oncoPlanSeguimiento || ''} onChange={set('oncoPlanSeguimiento')} placeholder="Tamizajes, derivaciones, indicaciones para familiares" />
      </label>
    </section>
  );
}
