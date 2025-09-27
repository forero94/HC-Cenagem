// ===============================
// src/routes/HomePage.jsx — Pantalla de inicio
// ===============================
import React, { useEffect, useMemo, useState } from 'react';
import { useCenagemStore } from '@/store/cenagemStore';

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-1">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint && <div className="text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}

function FamilyCard({ item, members, onOpen }) {
  const total = members.length;
  const updated = new Date(item.updatedAt).toLocaleString();
  const proband = members.find(m => m.rol === 'Proband');
  const diagnostico = proband?.diagnostico || proband?.notas?.[0]?.texto || 'Sin diagnóstico cargado';

  return (
    <button onClick={onOpen} className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3 hover:bg-slate-50">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-slate-900 font-semibold">HC {item.code}</div>
          <div className="text-xs text-slate-500">{item.provincia}</div>
        </div>
        <div className="text-xs text-slate-500">Miembros: {total}</div>
      </div>
      <div className="text-sm text-slate-700">Dx A1: <b>{diagnostico}</b></div>
      <div className="text-[11px] text-slate-500">Última actualización: {updated}</div>
    </button>
  );
}

function FamiliesHome({ items, membersByFamily, onOpen, onNew, onSearch, onFilter, onSort, query, filter, sort }) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input id="global-search" value={query} onChange={(e)=>onSearch(e.target.value)} placeholder="Buscar (código, provincia, tag)" className="px-3 py-2 rounded-xl border border-slate-300 w-[300px]" />
          <select value={filter} onChange={(e)=>onFilter(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300 text-sm">
            <option value="all">Todas las provincias</option>
            {[...new Set(items.map(i=>i.provincia))].map(p=> <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={sort} onChange={(e)=>onSort(e.target.value)} className="px-2 py-2 rounded-xl border border-slate-300 text-sm">
            <option value="updatedAt:desc">Recientes</option>
            <option value="code:asc">HC ↑</option>
            <option value="code:desc">HC ↓</option>
            <option value="members:desc">Más miembros</option>
          </select>
        </div>
        <button onClick={onNew} className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50">+ Nueva familia</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-16">
        {items.map(f => (
          <FamilyCard key={f.id} item={f} members={membersByFamily[f.id] || []} onOpen={() => onOpen(f)} />
        ))}
      </div>
    </div>
  );
}

function RecentActivity({ evolutions, members }) {
  const byMember = (id) => members.find(m=>m.id===id);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold mb-2">Actividad reciente</div>
      <div className="flex flex-col gap-3 max-h-[360px] overflow-auto pr-2">
        {evolutions.slice(0,12).map(e => {
          const m = byMember(e.memberId);
          return (
            <div key={e.id} className="text-sm">
              <div className="text-slate-900">{m?.filiatorios?.iniciales || m?.rol} · <span className="text-xs text-slate-500">{new Date(e.at).toLocaleString()}</span></div>
              <div className="text-slate-700 text-sm">{e.texto}</div>
              <div className="text-[11px] text-slate-500">{e.author}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Header({ title, user, onLogout, onReset }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-xs text-slate-500">Sesión: {user?.email}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onReset} className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50">Restablecer demo</button>
        <button onClick={onLogout} className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50">Salir</button>
      </div>
    </div>
  );
}

function FooterBar({ onAnalytics }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-20 bg-white/90 backdrop-blur border-t border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-center">
        <button onClick={onAnalytics} className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 shadow-sm">📊 Análisis de datos</button>
      </div>
    </div>
  );
}

export default function HomePage({ user, onLogout }) {
  const { state, listFamilies, STORAGE_KEY } = useCenagemStore();
  const { families, members, evolutions } = state;

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('updatedAt:desc');

  const familiesFiltered = useMemo(() => {
    let arr = [...listFamilies()];
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter(f => (
        (f.code || '').toLowerCase().includes(q) ||
        (f.provincia || '').toLowerCase().includes(q) ||
        (f.tags || []).some(t => t.toLowerCase().includes(q))
      ));
    }
    if (filter !== 'all') arr = arr.filter(f => f.provincia === filter);
    const byMembersCount = (id) => members.filter(m=>m.familyId===id).length;
    const [field, dir] = sort.split(':');
    arr.sort((a,b) => {
      let av, bv;
      if (field === 'members') { av = byMembersCount(a.id); bv = byMembersCount(b.id); }
      else if (field === 'code') { av = a.code; bv = b.code; }
      else { av = a.updatedAt; bv = b.updatedAt; }
      if (field === 'code') return dir==='asc' ? (a.code||'').localeCompare(b.code||'') : (b.code||'').localeCompare(a.code||'');
      if (av < bv) return dir==='asc' ? -1 : 1;
      if (av > bv) return dir==='asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [listFamilies, query, filter, sort, members]);

  const membersByFamily = useMemo(() => {
    const m = {};
    for (const mem of members) { m[mem.familyId] ||= []; m[mem.familyId].push(mem); }
    return m;
  }, [members]);

  const metrics = useMemo(() => {
    const totalFamilies = families.length;
    const totalMembers = members.length;
    const last7 = evolutions.filter(e => Date.now() - new Date(e.at).getTime() < 7*24*60*60*1000).length;
    return { totalFamilies, totalMembers, last7 };
  }, [families, members, evolutions]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('global-search')?.focus(); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); window.location.hash = 'analytics'; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="p-6 grid gap-4">
      <Header
        onLogout={onLogout}
        user={user}
        title="CENAGEM · HC Familiar"
        onReset={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MetricCard label="Familias" value={metrics.totalFamilies} hint="Total en la base" />
        <MetricCard label="Miembros" value={metrics.totalMembers} hint="Suma de individuos" />
        <MetricCard label="Evoluciones (7 días)" value={metrics.last7} hint="Notas recientes" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 grid gap-4">
          <FamiliesHome
            items={familiesFiltered}
            membersByFamily={membersByFamily}
            onOpen={(f) => { window.location.hash = `#/family/${f.id}`; }}
            onNew={() => {}}
            onSearch={(v)=>setQuery(v)}
            onFilter={(v)=>setFilter(v)}
            onSort={(v)=>setSort(v)}
            query={query}
            filter={filter}
            sort={sort}
          />
        </div>
        <RecentActivity evolutions={evolutions} members={members} />
      </div>

      <FooterBar onAnalytics={() => { window.location.hash = 'analytics'; }} />
    </div>
  );
}
