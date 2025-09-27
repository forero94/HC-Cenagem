// ===============================
// src/routes/FamilyStudiesPage.jsx — Estudios Complementarios (sin react-router)
// - Soporta modo embebido: <FamilyStudiesPage familyId="..." inline />
// - Panel derecho con "Miembros" (A1/B1/...) mostrando nombre, edad y OS
// - Selección de miembro en el panel derecho = único filtro (sin opción "Familia")
// - "Screening básico" por miembro alineado a la izquierda junto a la lista
// - Botón "Agregar estudios" en el panel de miembros (sube archivo/foto al miembro activo)
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
  return { families: [], members: [], evolutions: [], studies: [], memberScreenings: {} };
}

// ---- Reducer con soporte de estudios + screenings por miembro
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
    case 'UPSERT_MEMBER_SCREENING': {
      const { memberId, key, patch } = action.payload;
      const currentMem = (state.memberScreenings?.[memberId]) || {};
      const currentItem = currentMem[key] || { ordered: false, done: false, result: '' };
      const nextItem = { ...currentItem, ...patch };
      return {
        ...state,
        memberScreenings: {
          ...(state.memberScreenings || {}),
          [memberId]: { ...currentMem, [key]: nextItem }
        }
      };
    }
    default:
      return state;
  }
}

function useCenagemStore() {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }, [state]);

  const listMembers = (familyId) => (state.members || []).filter(m => m.familyId === familyId);
  const listStudiesByFamily = (familyId) => (state.studies || []).filter(s => s.familyId === familyId);

  const createStudy = (payload) => dispatch({ type: 'CREATE_STUDY', payload });
  const deleteStudy = (id) => dispatch({ type: 'DELETE_STUDY', payload: { id } });

  const getMemberScreening = (memberId) => (state.memberScreenings?.[memberId]) || {};
  const upsertMemberScreening = (memberId, key, patch) => dispatch({ type: 'UPSERT_MEMBER_SCREENING', payload: { memberId, key, patch } });

  return { state, listMembers, listStudiesByFamily, createStudy, deleteStudy, getMemberScreening, upsertMemberScreening };
}

// ---- Utils UI
const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString();
};

const toDate = (s) => { try { return new Date(s); } catch { return null; } };
const yearsSince = (isoDate) => {
  const d = toDate(isoDate); if (!d) return '—';
  const now = new Date();
  let y = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) y--;
  return `${y}a`;
};

// Config de screenings estándar
const SCREENING_DEFS = [
  { key: 'ecografiaAbdominoRenal', label: 'Ecografía abdomino-renal' },
  { key: 'ecocardiograma', label: 'Ecocardiograma' },
  { key: 'rmnEncefalo', label: 'RMN de encéfalo' },
  { key: 'audiometria', label: 'Audiometría' }
];

function ScreeningRow({ label, value, onToggleOrdered, onToggleDone, onResultChange }) {
  const { ordered = false, done = false, result = '' } = value || {};
  const showResultInput = !!done;
  return (
    <div className="grid md:grid-cols-12 gap-2 items-center">
      <div className="md:col-span-5 flex items-center gap-2">
        <span className="text-sm">{label}</span>
      </div>
      <div className="md:col-span-2 flex items-center gap-2">
        <input type="checkbox" checked={!!ordered} onChange={(e)=> onToggleOrdered(e.target.checked)} />
        <span className="text-sm">Pedido</span>
      </div>
      <div className="md:col-span-2 flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!done}
          onChange={(e)=> onToggleDone(e.target.checked)}
          disabled={!ordered}
        />
        <span className={`text-sm ${!ordered ? 'text-slate-400' : ''}`}>Realizado</span>
      </div>
      <div className="md:col-span-3">
        {showResultInput ? (
          <input
            value={result}
            onChange={(e)=> onResultChange(e.target.value)}
            placeholder="Normal"
            className="w-full px-3 py-2 rounded-xl border border-slate-300"
          />
        ) : (
          <input disabled placeholder="—" className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50" />
        )}
      </div>
    </div>
  );
}

function AgregarEstudioUpload({ disabled, onFiles }) {
  const inputId = React.useId();
  return (
    <div className="grid gap-1">
      <label htmlFor={inputId} className={`px-3 py-2 rounded-xl border ${disabled ? 'border-slate-200 text-slate-400' : 'border-slate-300 hover:bg-slate-50 cursor-pointer'} flex items-center justify-center gap-2`}>
        <span>➕ Agregar estudios (archivo/foto)</span>
      </label>
      <input id={inputId} type="file" multiple accept="image/*,.pdf" className="hidden" disabled={disabled} onChange={(e)=> onFiles && onFiles(e.target.files)} />
      <div className="text-[11px] text-slate-500">Se adjuntan al miembro activo. Se guardan como adjuntos locales.</div>
    </div>
  );
}

export default function FamilyStudiesPage({ familyId, inline = false }) {
  const { state, listMembers, listStudiesByFamily, createStudy, deleteStudy, getMemberScreening, upsertMemberScreening } = useCenagemStore();

  // No redirigimos: si no viene familyId por props, FamilyPage/Router se encarga del hash externo
  useEffect(() => {}, [familyId]);

  const fam = state.families.find(f => f.id === familyId);
  if (!fam) {
    if (inline) return null;
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">No se encontró la familia.</div>
      </div>
    );
  }

  const members = useMemo(() => listMembers(fam.id), [fam.id, state.members]);
  const studies = useMemo(() => listStudiesByFamily(fam.id), [fam.id, state.studies]);

  const [selectedMemberId, setSelectedMemberId] = useState('');
  useEffect(() => {
    if (!selectedMemberId && members.length > 0) setSelectedMemberId(members[0].id);
  }, [members, selectedMemberId]);

  const studyCountByMember = useMemo(() => {
    const map = new Map();
    for (const s of studies) {
      if (s.memberId) map.set(s.memberId, (map.get(s.memberId) || 0) + 1);
    }
    return map;
  }, [studies]);

  const filteredStudies = useMemo(() => {
    if (!selectedMemberId) return [];
    return studies.filter(s => s.memberId === selectedMemberId);
  }, [studies, selectedMemberId]);

  const activeMember = useMemo(() => (selectedMemberId) ? members.find(m=>m.id===selectedMemberId) : null, [selectedMemberId, members]);
  const screening = useMemo(() => activeMember ? getMemberScreening(activeMember.id) : {}, [activeMember, state.memberScreenings]);
  const valueFor = (key) => screening?.[key] || { ordered: false, done: false, result: '' };

  const handleOrdered = (key, checked) => {
    if (!activeMember) return;
    if (checked) {
      upsertMemberScreening(activeMember.id, key, { ordered: true });
    } else {
      upsertMemberScreening(activeMember.id, key, { ordered: false, done: false, result: '' });
    }
  };

  const handleDone = (key, checked) => {
    if (!activeMember) return;
    if (checked) {
      const v = valueFor(key);
      upsertMemberScreening(activeMember.id, key, {
        done: true,
        ordered: true,
        result: v.result?.trim() ? v.result : 'Normal'
      });
    } else {
      upsertMemberScreening(activeMember.id, key, { done: false, result: '' });
    }
  };

  const handleResult = (key, text) => {
    if (!activeMember) return;
    upsertMemberScreening(activeMember.id, key, { result: text });
  };

  return (
    <div className={inline ? "" : "p-6 grid gap-4"}>
      {!inline && (
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={()=>{ window.location.hash = `#/family/${fam.id}`; }}
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
            >
              ← Volver
            </button>
            <h2 className="text-lg font-semibold">HC {fam.code} · Estudios complementarios</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={()=>{ window.location.hash = `#/family/${fam.id}`; }}
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
              title="Ir al Resumen"
            >
              Resumen
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 grid gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-3">
            <div className="text-sm font-semibold">Screening básico por miembro</div>
            {!activeMember ? (
              <div className="text-sm text-slate-600">Seleccioná un miembro en el panel derecho para cargar/ver el screening estándar.</div>
            ) : (
              <>
                <div className="text-xs text-slate-500">
                  Miembro activo: <b>{activeMember.filiatorios?.iniciales || activeMember.rol}</b> · {activeMember.nombre || '—'}
                </div>
                <div className="grid gap-2 mt-1">
                  <div className="hidden md:grid md:grid-cols-12 text-xs text-slate-500 px-1">
                    <div className="md:col-span-5">Estudio</div>
                    <div className="md:col-span-2">Pedido</div>
                    <div className="md:col-span-2">Realizado</div>
                    <div className="md:col-span-3">Resultado</div>
                  </div>
                  {SCREENING_DEFS.map(def => (
                    <ScreeningRow
                      key={def.key}
                      label={def.label}
                      value={valueFor(def.key)}
                      onToggleOrdered={(checked)=>handleOrdered(def.key, checked)}
                      onToggleDone={(checked)=>handleDone(def.key, checked)}
                      onResultChange={(txt)=>handleResult(def.key, txt)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-2">
            <div className="text-sm font-semibold">
              Estudios cargados {selectedMemberId ? `· ${members.find(m=>m.id===selectedMemberId)?.filiatorios?.iniciales || 'Miembro'}` : ''}
            </div>
            <div className="grid gap-2">
              {filteredStudies.length === 0 && (
                <div className="text-sm text-slate-500">No hay estudios registrados para este miembro.</div>
              )}
              {filteredStudies.map(s => {
                const m = s.memberId ? members.find(x=>x.id === s.memberId) : null;
                return (
                  <div key={s.id} className="flex items-start justify-between px-3 py-2 rounded-xl border border-slate-200">
                    <div className="text-sm">
                      <div><b>{s.tipo}</b> · {s.nombre || '—'}</div>
                      <div className="text-slate-600">
                        {fmtDate(s.fecha)} · {(m?.filiatorios?.iniciales || (m ? m.rol : 'familia'))}
                        {s.resultado ? ` · ${s.resultado}` : ''}
                      </div>
                      {s.archivoUrl && (
                        <div className="text-xs">
                          Archivo/URL: <a className="text-blue-600 underline" href={s.archivoUrl} target="_blank" rel="noreferrer">{s.archivoUrl}</a>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={()=>deleteStudy(s.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-red-50"
                      title="Eliminar"
                    >
                      🗑
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-3 h-fit">
          <div className="text-sm font-semibold">Miembros</div>
          {members.map(m => (
            <button
              key={m.id}
              onClick={()=>{ setSelectedMemberId(m.id); }}
              className={`text-left px-3 py-2 rounded-xl border ${selectedMemberId===m.id ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <b>{m.filiatorios?.iniciales || m.rol}</b> · {m.nombre || '—'}
                </div>
                <span className="text-xs opacity-80">{studyCountByMember.get(m.id) || 0}</span>
              </div>
              <div className="text-xs text-slate-600">{yearsSince(m.nacimiento)} · OS: {m.os || '—'}</div>
            </button>
          ))}

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
                  tipo: 'Adjunto',
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

      {!inline && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-white/90 backdrop-blur border-t border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-center gap-2">
            <button onClick={()=>{ window.location.hash = `#/family/${fam.id}`; }} className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 shadow-sm">
              ↩ Volver a HC
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
