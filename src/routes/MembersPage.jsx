// ===============================
// src/routes/FamilyTreePage.jsx — Administración de miembros (sin árbol)
// Mantiene STORAGE_KEY = 'cenagem-demo-v1'
// ===============================
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';

const STORAGE_KEY = 'cenagem-demo-v1';
const seedNow = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

// -------- Estado base / store
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const f1 = { id: uid(), code: 'FAM-000X', provincia: 'CABA', createdAt: seedNow(), updatedAt: seedNow(), tags: ['demo'] };
  const m1 = {
    id: uid(),
    familyId: f1.id,
    rol: 'proband',
    filiatorios: { iniciales: 'A1' },
    nombre: 'Paciente A1',
    sexo: 'F',
    nacimiento: '2020-01-01',
    os: '—',
    estado: 'vivo',
    notas: [],
  };
  const seed = { families: [f1], members: [m1], evolutions: [], studies: [], pedigree: {} };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); } catch {}
  return seed;
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PARENT': {
      const { memberId, parentType, parentId } = action.payload;
      const prev = state.pedigree || {};
      const node = { ...(prev[memberId] || {}), [parentType]: parentId || '' };
      return { ...state, pedigree: { ...prev, [memberId]: node } };
    }
    case 'ADD_MEMBER': {
      const m = action.payload;
      return { ...state, members: [...state.members, m] };
    }
    case 'UPDATE_MEMBER': {
      const { id, patch } = action.payload;
      return {
        ...state,
        members: state.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      };
    }
    case 'DELETE_MEMBER': {
      const id = action.payload;
      // quitar del listado y limpiar referencias de pedigrí
      const members = state.members.filter((m) => m.id !== id);
      const pedigree = Object.fromEntries(
        Object.entries(state.pedigree || {}).map(([cid, node]) => [
          cid,
          {
            padreId: node.padreId === id ? '' : node.padreId || '',
            madreId: node.madreId === id ? '' : node.madreId || '',
          },
        ])
      );
      return { ...state, members, pedigree };
    }
    case 'REWRITE_STATE':
      return action.payload;
    default:
      return state;
  }
}

function useDebouncedSave(value, delay = 200) {
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {}
    }, delay);
    return () => clearTimeout(t);
  }, [value, delay]);
}

function useCenagemStore() {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  useDebouncedSave(state);
  const listMembers = useCallback((fid) => (state.members || []).filter((m) => m.familyId === fid), [state.members]);
  const setParent = useCallback((id, t, p) => dispatch({ type: 'SET_PARENT', payload: { memberId: id, parentType: t, parentId: p } }), []);
  const addMember = useCallback((m) => dispatch({ type: 'ADD_MEMBER', payload: m }), []);
  const updateMember = useCallback((id, patch) => dispatch({ type: 'UPDATE_MEMBER', payload: { id, patch } }), []);
  const deleteMember = useCallback((id) => dispatch({ type: 'DELETE_MEMBER', payload: id }), []);
  const reloadFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: 'REWRITE_STATE', payload: JSON.parse(raw) });
    } catch {}
  }, []);
  return { state, listMembers, setParent, addMember, updateMember, deleteMember, reloadFromStorage };
}

// -------- Utils
const yearsSince = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const n = new Date();
  let y = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) y--;
  return `${y}a`;
};

// -------- Page (Administración de miembros)
export default function FamilyTreePage({ familyId, inline = false }) {
  const { state, listMembers, addMember, updateMember, deleteMember, reloadFromStorage } = useCenagemStore();

  const fam = state.families.find((f) => f.id === familyId);
  useEffect(() => {
    if (!familyId) {
      const h = (window.location.hash || '').replace(/^#\/?/, '');
      const [, id] = h.split('/');
      if (id && !fam) window.location.hash = `#/family/${id}/tree`;
    }
  }, [familyId, fam]);

  const members = useMemo(() => (fam ? listMembers(fam.id) : []), [fam, state.members, listMembers]);

  // selección + búsqueda
  const [selectedId, setSelectedId] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    if (!selectedId && members.length > 0) setSelectedId(members[0].id);
    else if (selectedId && members.length && !members.some((m) => m.id === selectedId)) setSelectedId(members[0]?.id || '');
  }, [members, selectedId]);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return members;
    return members.filter((m) => {
      const hay = [
        m.nombre,
        m.filiatorios?.iniciales,
        m.rol,
        m.sexo,
        m.os,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(k);
    });
  }, [q, members]);

  const active = members.find((m) => m.id === selectedId) || null;

  // helpers
  const createMember = () => {
    const m = {
      id: uid(),
      familyId: fam.id,
      nombre: '',
      filiatorios: { iniciales: `M${String(members.length + 1).padStart(2, '0')}` },
      rol: '',
      sexo: 'U',
      nacimiento: '',
      estado: 'vivo',
      os: '—',
      notas: [],
    };
    addMember(m);
    setSelectedId(m.id);
  };

  const markRole = (id, role) => updateMember(id, { rol: role });
  const markSex = (id, sex) => updateMember(id, { sexo: sex });

  if (!fam) {
    return inline ? null : (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">No se encontró la familia.</div>
      </div>
    );
  }

  return (
    <div className={inline ? '' : 'p-6'}>
      {/* Header */}
      {!inline && (
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={() => { window.location.hash = `#/family/${fam.id}`; }}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
          >
            ← Volver
          </button>
          <h2 className="text-lg font-semibold">HC {fam.code} · Miembros (administración)</h2>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
              onClick={reloadFromStorage}
              title="Recargar desde storage"
            >
              ↻ Recargar
            </button>
          </div>
        </div>
      )}

      {/* MAIN GRID: Lista + Editor */}
      <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-4 min-h-[calc(100vh-6rem)]">
        {/* Lista */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Miembros</div>
            <button
              className="px-3 py-2 rounded-xl border border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-900"
              onClick={createMember}
            >
              + Nuevo
            </button>
          </div>

          <input
            className="w-full mb-3 px-3 py-2 rounded-xl border border-slate-300"
            placeholder="Buscar por nombre, iniciales, rol, sexo, OS…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div className="grid gap-2">
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`text-left px-3 py-2 rounded-xl border ${
                  selectedId === m.id ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <b>{m.filiatorios?.iniciales || '—'}</b> · {m.nombre || '—'}
                  </div>
                  <span className="text-[11px] opacity-80">{m.rol || '—'}</span>
                </div>
                <div className="text-xs text-slate-600">
                  {m.sexo || 'U'} · {yearsSince(m.nacimiento)} · OS: {m.os || '—'}
                </div>
              </button>
            ))}
            {filtered.length === 0 && <div className="text-xs text-slate-500">Sin resultados.</div>}
          </div>
        </aside>

        {/* Editor */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {!active ? (
            <div className="text-sm text-slate-500">Seleccioná un miembro para editar.</div>
          ) : (
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Editor de miembro</div>
                <button
                  className="px-3 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900"
                  onClick={() => {
                    const ok = confirm('Eliminar este miembro? Esta acción no se puede deshacer.');
                    if (ok) deleteMember(active.id);
                  }}
                >
                  Eliminar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Iniciales</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    value={active.filiatorios?.iniciales || ''}
                    onChange={(e) =>
                      updateMember(active.id, { filiatorios: { ...(active.filiatorios || {}), iniciales: e.target.value } })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Nombre</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    value={active.nombre || ''}
                    onChange={(e) => updateMember(active.id, { nombre: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Sexo</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    value={active.sexo || 'U'}
                    onChange={(e) => markSex(active.id, e.target.value)}
                  >
                    <option value="U">—</option>
                    <option value="F">F</option>
                    <option value="M">M</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Rol</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    value={active.rol || ''}
                    onChange={(e) => markRole(active.id, e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Estado</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    value={active.estado || 'vivo'}
                    onChange={(e) => updateMember(active.id, { estado: e.target.value })}
                  >
                    <option value="vivo">vivo</option>
                    <option value="fallecido">fallecido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Nacimiento (ISO)</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    value={active.nacimiento ? active.nacimiento.slice(0, 10) : ''}
                    onChange={(e) => updateMember(active.id, { nacimiento: e.target.value || '' })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-600 mb-1">Obra social</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    value={active.os || ''}
                    onChange={(e) => updateMember(active.id, { os: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Notas (JSON simple)</label>
                <textarea
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  rows={4}
                  value={JSON.stringify(active.notas || [], null, 2)}
                  onChange={(e) => {
                    try {
                      const val = JSON.parse(e.target.value || '[]');
                      updateMember(active.id, { notas: Array.isArray(val) ? val : [] });
                    } catch {
                      // ignora parse errors para no romper UX
                    }
                  }}
                />
              </div>

              <div className="h-px bg-slate-200" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  className="px-3 py-2 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900"
                  onClick={() => markRole(active.id, 'proband')}
                >
                  Marcar Proband
                </button>
                <button
                  className="px-3 py-2 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900"
                  onClick={() => markRole(active.id, 'M1')}
                >
                  Marcar Madre (M1)
                </button>
                <button
                  className="px-3 py-2 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900"
                  onClick={() => markRole(active.id, 'P1')}
                >
                  Marcar Padre (P1)
                </button>
                <button
                  className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
                  onClick={() => setSelectedId('')}
                >
                  Limpiar selección
                </button>
              </div>

              <div className="text-[11px] text-slate-500">
                Esta página administra <b>miembros</b> (identidad, demografía, rol). Los vínculos de pedigrí se editan en la vista de árbol.
              </div>
            </div>
          )}
        </section>
      </div>

      {!inline && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-white/90 backdrop-blur border-t border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-center gap-2">
            <button
              onClick={() => { window.location.hash = `#/family/${fam.id}`; }}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 shadow-sm"
            >
              ↩ Volver a HC
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
