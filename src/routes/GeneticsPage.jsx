// ===============================
// src/routes/GeneticsPage.jsx — Página de Estudios Genéticos (sin react-router)
// - Soporta modo embebido: <GeneticsPage familyId="..." inline />
// - Panel derecho: selección de miembro (único filtro)
// - Órdenes genéticas por miembro: Pedido / Realizado / Resultado (visible si Realizado)
// - Upload de archivos/fotos como estudios del miembro activo
// - Lista de estudios genéticos del miembro seleccionado
// ===============================
import React, { useEffect, useMemo, useReducer, useState } from 'react';

const STORAGE_KEY = 'cenagem-demo-v1';
const seedNow = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

// ---- Carga inicial desde localStorage
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { families: [], members: [], evolutions: [], studies: [], memberScreenings: {}, memberGenetics: {}, memberHPO: {} };
}

// ---- Reducer con soporte de estudios + órdenes genéticas por miembro
function reducer(state, action) {
  switch (action.type) {
    case 'CREATE_STUDY': {
      const s = { id: uid(), createdAt: seedNow(), ...action.payload };
      return { ...state, studies: [s, ...(state.studies || [])] };
    }
    case 'DELETE_STUDY': {
      const { id } = action.payload;
      return { ...state, studies: (state.studies || []).filter(s => s.id !== id) };
    }
    case 'UPSERT_MEMBER_GENETIC': {
      const { memberId, key, patch } = action.payload;
      const currentMem = (state.memberGenetics?.[memberId]) || {};
      const currentItem = currentMem[key] || { pedido: false, realizado: false, resultado: '' };
      const nextItem = { ...currentItem, ...patch };
      return {
        ...state,
        memberGenetics: {
          ...(state.memberGenetics || {}),
          [memberId]: { ...currentMem, [key]: nextItem }
        }
      };
    }
    case 'SET_MEMBER_HPO': {
      const { memberId, terms } = action.payload;
      return { ...state, memberHPO: { ...(state.memberHPO || {}), [memberId]: terms } };
    }
    default:
      return state;
  }
}

function useCenagemStore() {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const listMembers = (familyId) => (state.members || []).filter(m => m.familyId === familyId);
  const listStudiesByFamily = (familyId) => (state.studies || []).filter(s => s.familyId === familyId);

  const createStudy = (payload) => dispatch({ type: 'CREATE_STUDY', payload });
  const deleteStudy = (id) => dispatch({ type: 'DELETE_STUDY', payload: { id } });

  const getMemberGenetic = (memberId) => (state.memberGenetics?.[memberId]) || {};
  const upsertMemberGenetic = (memberId, key, patch) => dispatch({ type: 'UPSERT_MEMBER_GENETIC', payload: { memberId, key, patch } });

  const getMemberHPO = (memberId) => (state.memberHPO?.[memberId]) || [];
  const setMemberHPO = (memberId, terms) => dispatch({ type: 'SET_MEMBER_HPO', payload: { memberId, terms } });

  return { state, listMembers, listStudiesByFamily, createStudy, deleteStudy, getMemberGenetic, upsertMemberGenetic, getMemberHPO, setMemberHPO };
}

// ---- Utils UI
const fmtDate = (iso) => { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString(); };
const toDate = (s) => { try { return new Date(s); } catch { return null; } };
const yearsSince = (isoDate) => {
  const d = toDate(isoDate); if (!d) return '—';
  const now = new Date();
  let y = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) y--;
  return `${y}a`;
};

// Definición de estudios genéticos estándar
const GENETIC_DEFS = [
  { key: 'Cariotipo', label: 'Cariotipo' },
  { key: 'arrayCGH', label: 'array-CGH' },
  { key: 'panelNGS', label: 'Panel NGS' },
  { key: 'exoma', label: 'Exoma clínico' },
  { key: 'genoma', label: 'Genoma completo' },
  { key: 'mlpa', label: 'MLPA / Del-Dup' },
  { key: 'brcaHrr', label: 'BRCA / HRR' },
  { key: 'fragileX', label: 'X Frágil (FMR1)' }
];

function GeneticRow({ label, value, onTogglePedido, onToggleRealizado, onResultChange }) {
  const { pedido = false, realizado = false, resultado = '' } = value || {};
  return (
    <div className="grid md:grid-cols-12 gap-2 items-center">
      <label className="md:col-span-4 flex items-center gap-2">
        <input type="checkbox" checked={!!pedido} onChange={(e)=> onTogglePedido(e.target.checked)} />
        <span className="text-sm">{label}</span>
      </label>
      <div className="md:col-span-3 flex items-center gap-2">
        <input type="checkbox" checked={!!realizado} disabled={!pedido} onChange={(e)=> onToggleRealizado(e.target.checked)} />
        <span className="text-sm">Realizado</span>
      </div>
      <div className="md:col-span-5">
        {realizado ? (
          <input value={resultado} onChange={(e)=> onResultChange(e.target.value)} placeholder="Normal" className="w-full px-3 py-2 rounded-xl border border-slate-300" />
        ) : null}
      </div>
    </div>
  );
}

function HPOEditor({ terms, onChange }) {
  const [text, setText] = React.useState(Array.isArray(terms) ? terms.join(', ') : '');
  useEffect(() => { setText(Array.isArray(terms) ? terms.join(', ') : ''); }, [terms]);

  const handleBlur = () => {
    const parsed = (text || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    onChange && onChange(parsed);
  };

  return (
    <input
      value={text}
      onChange={(e)=>setText(e.target.value)}
      onBlur={handleBlur}
      placeholder="HPO:0001252, epilepsia, dismorfias faciales"
      className="w-full px-3 py-2 rounded-xl border border-amber-300"
    />
  );
}

function AgregarEstudioUpload({ disabled, onFiles }) {
  const inputId = React.useId();
  return (
    <div className="grid gap-1">
      <label htmlFor={inputId} className={`px-3 py-2 rounded-xl border ${disabled ? 'border-slate-200 text-slate-400' : 'border-slate-300 hover:bg-slate-50 cursor-pointer'} flex items-center justify-center gap-2`}>
        <span>➕ Agregar estudios genéticos (archivo/foto)</span>
      </label>
      <input id={inputId} type="file" multiple accept="image/*,.pdf" className="hidden" disabled={disabled} onChange={(e)=> onFiles && onFiles(e.target.files)} />
      <div className="text-[11px] text-slate-500">Se adjuntan al miembro activo. Se guardan como adjuntos locales.</div>
    </div>
  );
}

export default function GeneticsPage({ familyId, inline = false }) {
  // Hooks siempre arriba (nunca después de un return)
  const { state, listMembers, listStudiesByFamily, createStudy, deleteStudy, getMemberGenetic, upsertMemberGenetic, getMemberHPO, setMemberHPO } = useCenagemStore();

  // Soporte de entrada directa por hash (solo si no te pasan prop)
  useEffect(() => {
    if (!familyId) {
      const h = (window.location.hash || '').replace(/^#\/?/, '');
      const [, id] = h.split('/');
      // no navegamos a otra página; solo dejamos familyId implícito si existiera
      // (tu router/familypage se encarga del hash; acá no redirigimos)
    }
  }, [familyId]);

  const fam = state.families.find(f => f.id === familyId);
  if (!fam) {
    // Si está embebido, no muestres header de error
    if (inline) return null;
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">No se encontró la familia.</div>
      </div>
    );
  }

  const members = useMemo(() => listMembers(fam.id), [fam.id, state.members]);
  const studies = useMemo(() => listStudiesByFamily(fam.id), [fam.id, state.studies]);

  // Filtro por miembro (único filtro)
  const [selectedMemberId, setSelectedMemberId] = useState('');
  useEffect(() => { if (!selectedMemberId && members.length > 0) setSelectedMemberId(members[0].id); }, [members, selectedMemberId]);

  // Conteo por miembro (solo estudios tipo Genético)
  const studyCountByMember = useMemo(() => {
    const map = new Map();
    for (const s of studies) {
      if (s.memberId && (s.tipo === 'Genético' || s.tipo === 'Genetico')) {
        map.set(s.memberId, (map.get(s.memberId) || 0) + 1);
      }
    }
    return map;
  }, [studies]);

  const filteredStudies = useMemo(() => {
    if (!selectedMemberId) return [];
    return studies.filter(s => s.memberId === selectedMemberId && (s.tipo === 'Genético' || s.tipo === 'Genetico'));
  }, [studies, selectedMemberId]);

  // Órdenes genéticas por miembro
  const activeMember = useMemo(() => (selectedMemberId) ? members.find(m=>m.id===selectedMemberId) : null, [selectedMemberId, members]);
  const genetic = useMemo(() => activeMember ? getMemberGenetic(activeMember.id) : {}, [activeMember, state.memberGenetics]);
  const valueFor = (key) => genetic?.[key] || { pedido: false, realizado: false, resultado: '' };
  const hpoTerms = useMemo(() => activeMember ? getMemberHPO(activeMember.id) : [], [activeMember, state.memberHPO]);

  const handlePedido = (key, checked) => {
    if (!activeMember) return;
    if ((key === 'exoma' || key === 'genoma') && checked && (!hpoTerms || hpoTerms.length === 0)) {
      alert('Para Exoma/Genoma, primero cargá los términos HPO del paciente.');
      return;
    }
    upsertMemberGenetic(activeMember.id, key, { pedido: checked });
  };
  const handleRealizado = (key, checked) => {
    if (!activeMember) return;
    const patch = { realizado: checked };
    if (!checked) patch.resultado = '';
    upsertMemberGenetic(activeMember.id, key, patch);

    // Autorregistro: crear estudio en la lista cuando queda realizado
    if (checked) {
      const v = valueFor(key);
      const today = new Date().toISOString().slice(0,10);
      createStudy({
        familyId: fam.id,
        memberId: activeMember.id,
        tipo: 'Genético',
        nombre: GENETIC_DEFS.find(d=>d.key===key)?.label || key,
        fecha: today,
        resultado: v.resultado?.trim() ? v.resultado : 'Normal',
        archivoUrl: ''
      });
    }
  };
  const handleResult = (key, text) => { if (activeMember) upsertMemberGenetic(activeMember.id, key, { resultado: text }); };

  // ---- Render
  return (
    <div className={inline ? "" : "p-6 grid gap-4"}>
      {/* Toolbar / Footer SOLO si no es inline */}
      {!inline && (
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={()=>{ window.location.hash = `#/family/${fam.id}`; }} className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50">← Volver</button>
            <h2 className="text-lg font-semibold">HC {fam.code} · Estudios genéticos</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>{ window.location.hash = `#/family/${fam.id}`; }} className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50" title="Ir al Resumen">Resumen</button>
          </div>
        </div>
      )}

      {/* Layout principal: órdenes + lista (izquierda, 2/3) | panel de miembros (derecha, 1/3) */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Columna izquierda (2/3) */}
        <div className="md:col-span-2 grid gap-4">
          {/* Órdenes genéticas por miembro */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-3">
            <div className="text-sm font-semibold">Solicitudes genéticas por miembro</div>
            {!activeMember ? (
              <div className="text-sm text-slate-600">Seleccioná un miembro en el panel derecho para gestionar las órdenes genéticas.</div>
            ) : (
              <>
                <div className="text-xs text-slate-500">Miembro activo: <b>{activeMember.filiatorios?.iniciales || activeMember.rol}</b> · {activeMember.nombre || '—'}</div>
                <div className="grid gap-2 mt-1">
                  {GENETIC_DEFS.map(def => (
                    <GeneticRow
                      key={def.key}
                      label={def.label}
                      value={valueFor(def.key)}
                      onTogglePedido={(chk)=>handlePedido(def.key, chk)}
                      onToggleRealizado={(chk)=>handleRealizado(def.key, chk)}
                      onResultChange={(txt)=>handleResult(def.key, txt)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Editor de HPO visible solo si Exoma o Genoma tienen pedido */}
          {(valueFor('exoma')?.pedido || valueFor('genoma')?.pedido) && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm grid gap-2">
              <div className="text-sm font-semibold">Términos HPO del miembro</div>
              <div className="text-xs text-amber-800">
                Ingresá códigos (p. ej., HPO:0001252) o descripciones separadas por coma. Requerido para Exoma/Genoma.
              </div>
              <HPOEditor terms={hpoTerms} onChange={(terms)=> activeMember && setMemberHPO(activeMember.id, terms)} />
            </div>
          )}

          {/* Lista de estudios genéticos (filtrada por miembro) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-2">
            <div className="text-sm font-semibold">Estudios genéticos cargados {selectedMemberId ? `· ${members.find(m=>m.id===selectedMemberId)?.filiatorios?.iniciales || 'Miembro'}` : ''}</div>
            <div className="grid gap-2">
              {filteredStudies.length === 0 && (
                <div className="text-sm text-slate-500">No hay estudios genéticos registrados para este miembro.</div>
              )}
              {filteredStudies.map(s => {
                const m = s.memberId ? members.find(x=>x.id===s.memberId) : null;
                return (
                  <div key={s.id} className="flex items-start justify-between px-3 py-2 rounded-xl border border-slate-200">
                    <div className="text-sm">
                      <div><b>{s.tipo}</b> · {s.nombre || '—'}</div>
                      <div className="text-slate-600">{fmtDate(s.fecha)} · {(m?.filiatorios?.iniciales || (m? m.rol : 'familia'))}{s.resultado ? ` · ${s.resultado}` : ''}</div>
                      {s.archivoUrl && (
                        <div className="text-xs">Archivo/URL: <a className="text-blue-600 underline" href={s.archivoUrl} target="_blank" rel="noreferrer">{s.archivoUrl}</a></div>
                      )}
                    </div>
                    <button onClick={()=>deleteStudy(s.id)} className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-red-50" title="Eliminar">🗑</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna derecha (1/3): Panel Miembros */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-3 h-fit">
          <div className="text-sm font-semibold">Miembros</div>
          {members.map(m => (
            <button
              key={m.id}
              onClick={()=>{ setSelectedMemberId(m.id); }}
              className={`text-left px-3 py-2 rounded-xl border ${selectedMemberId===m.id ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm"><b>{m.filiatorios?.iniciales || m.rol}</b> · {m.nombre || '—'}</div>
                <span className="text-xs opacity-80">{studyCountByMember.get(m.id) || 0}</span>
              </div>
              <div className="text-xs text-slate-600">{yearsSince(m.nacimiento)} · OS: {m.os || '—'}</div>
            </button>
          ))}

          {/* Agregar estudios genéticos (archivo/foto) para el miembro activo */}
          <AgregarEstudioUpload
            disabled={!selectedMemberId}
            onFiles={(files)=>{
              if (!selectedMemberId) return;
              const today = new Date().toISOString().slice(0,10);
              [...files].forEach(file => {
                const url = URL.createObjectURL(file);
                createStudy({
                  familyId: fam.id,
                  memberId: selectedMemberId,
                  tipo: 'Genético',
                  nombre: file.name,
                  fecha: today,
                  resultado: '',
                  archivoUrl: url,
                });
              });
            }}
          />
        </aside>
      </div>

      {/* Footer fijo solo cuando no es inline */}
      {!inline && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-white/90 backdrop-blur border-t border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-center gap-2">
            <button onClick={()=>{ window.location.hash = `#/family/${fam.id}`; }} className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 shadow-sm">↩ Volver a HC</button>
          </div>
        </div>
      )}
    </div>
  );
}
