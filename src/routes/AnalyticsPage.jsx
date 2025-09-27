// ===============================
// src/routes/AnalyticsPage.jsx — Vista de análisis
// ===============================
import React, { useMemo, useState } from 'react';
import { useCenagemStore } from '@/store/cenagemStore';

function AppToolbar({ title, onBack }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {onBack && (<button onClick={onBack} className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50">← Volver</button>)}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
    </div>
  );
}

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-1">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint && <div className="text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}

const year = (dateStr) => { try { return new Date(dateStr).getFullYear(); } catch { return undefined; } };

function aggregate({ families, members, evolutions }, mode) {
  const result = new Map();
  const ensure = (k) => { if (!result.has(k)) result.set(k, { grupo: k, familias: new Set(), miembros: 0, evoluciones: 0 }); return result.get(k); };
  const familyById = new Map(families.map(f => [f.id, f]));
  const membersByFamily = new Map();
  for (const m of members) { if (!membersByFamily.has(m.familyId)) membersByFamily.set(m.familyId, []); membersByFamily.get(m.familyId).push(m); }
  const pushFamily = (k, familyId) => ensure(k).familias.add(familyId);
  const pushMember = (k, familyId) => { const row = ensure(k); row.familias.add(familyId); row.miembros += 1; };
  const pushEvolution = (k, familyId) => { const row = ensure(k); row.familias.add(familyId); row.evoluciones += 1; };

  switch (mode) {
    case 'provincia':
      for (const f of families) pushFamily(f.provincia || '—', f.id);
      for (const m of members) pushMember(familyById.get(m.familyId)?.provincia || '—', m.familyId);
      for (const e of evolutions) pushEvolution(familyById.get(members.find(x=>x.id===e.memberId)?.familyId)?.provincia || '—', members.find(x=>x.id===e.memberId)?.familyId);
      break;
    case 'tag':
      for (const f of families) {
        const tags = f.tags?.length ? f.tags : ['—'];
        for (const t of tags) pushFamily(t, f.id);
        const ms = membersByFamily.get(f.id) || [];
        for (const m of ms) pushMember(tags[0], f.id);
      }
      for (const e of evolutions) {
        const famId = members.find(x=>x.id===e.memberId)?.familyId; const fam = familyById.get(famId);
        const tag = fam?.tags?.[0] || '—'; pushEvolution(tag, famId);
      }
      break;
    case 'rol':
      for (const m of members) pushMember(m.rol || '—', m.familyId);
      for (const e of evolutions) { const mem = members.find(x=>x.id===e.memberId); pushEvolution(mem?.rol || '—', mem?.familyId); }
      break;
    case 'anio':
      for (const m of members) pushMember(year(m.nacimiento) || '—', m.familyId);
      for (const e of evolutions) { const mem = members.find(x=>x.id===e.memberId); pushEvolution(year(mem?.nacimiento) || '—', mem?.familyId); }
      break;
    case 'dxA1':
      for (const [famId, ms] of membersByFamily.entries()) {
        const a1 = ms.find(m => m.rol === 'Proband');
        const k = (a1?.diagnostico || '—');
        pushFamily(k, famId);
        for (const m of ms) pushMember(k, famId);
      }
      for (const e of evolutions) {
        const famId = members.find(x=>x.id===e.memberId)?.familyId;
        const a1 = (membersByFamily.get(famId) || []).find(m => m.rol === 'Proband');
        const k = (a1?.diagnostico || '—');
        pushEvolution(k, famId);
      }
      break;
    default:
      return [];
  }
  const rows = [...result.values()].map(r => ({ grupo: r.grupo, familias: r.familias.size, miembros: r.miembros, evoluciones: r.evoluciones }));
  rows.sort((a,b) => (b.miembros - a.miembros) || (b.familias - a.familias));
  return rows;
}

export default function AnalyticsPage({ onBack }) {
  const { state } = useCenagemStore();
  const { families, members, evolutions } = state;

  const [mode, setMode] = useState('provincia');
  const rows = useMemo(() => aggregate(state, mode), [state, mode]);
  const metrics = useMemo(() => ({ familias: families.length, miembros: members.length, evol: evolutions.length }), [families, members, evolutions]);

  return (
    <div className="p-6 grid gap-4">
      <AppToolbar title="Exploración de datos" onBack={onBack} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MetricCard label="Familias" value={metrics.familias} hint="Total" />
        <MetricCard label="Miembros" value={metrics.miembros} hint="Total" />
        <MetricCard label="Evoluciones" value={metrics.evol} hint="Total" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Agrupar por:</span>
          <select value={mode} onChange={(e)=>setMode(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-300 text-sm">
            <option value="provincia">Provincia</option>
            <option value="tag">Tag (primario)</option>
            <option value="rol">Rol</option>
            <option value="anio">Año de nacimiento</option>
            <option value="dxA1">Diagnóstico A1</option>
          </select>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600 border-b">
                <th className="py-2 pr-4">Grupo</th>
                <th className="py-2 pr-4">Familias</th>
                <th className="py-2 pr-4">Miembros</th>
                <th className="py-2 pr-4">Evoluciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.grupo} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium text-slate-800">{r.grupo}</td>
                  <td className="py-2 pr-4">{r.familias}</td>
                  <td className="py-2 pr-4">{r.miembros}</td>
                  <td className="py-2 pr-4">{r.evoluciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-xs text-slate-500">* Vista básica. Luego sumamos CSV y gráficos.</div>
    </div>
  );
}
