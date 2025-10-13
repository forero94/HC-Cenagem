import React from 'react';

export default function Grupo_Dismorfias({ value, onChange }) {
  const v = value || {};
  const set = (k) => (e) => onChange?.(k, e.target.value);

  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-semibold text-slate-700">Malformaciones congénitas y dismorfias</h2>
      <p className="text-xs text-slate-500">Describí los hallazgos principales y los estudios ya realizados.</p>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Descripción clínica resumida</span>
        <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.dismorfiasDescripcion || ''} onChange={set('dismorfiasDescripcion')} placeholder="Fenotipo general, malformaciones mayores y menores" />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Órganos / sistemas afectados</span>
          <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.dismorfiasSistemasAfectados || ''} onChange={set('dismorfiasSistemasAfectados')} placeholder="Cardiovascular, SNC, genitourinario, esquelético…" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Imágenes / screening</span>
          <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.dismorfiasImagenes || ''} onChange={set('dismorfiasImagenes')} placeholder="Eco, RMN, RX, estudios funcionales" />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">Estudios genéticos previos</span>
        <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.dismorfiasEstudiosGeneticos || ''} onChange={set('dismorfiasEstudiosGeneticos')} placeholder="Cariotipo, array-CGH, MLPA, paneles, FISH" />
      </label>
    </section>
  );
}
