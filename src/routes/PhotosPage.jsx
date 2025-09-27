// ===============================
// src/routes/PhotosPage.jsx — Galería de fotos por familia/miembro (sin react-router)
// Lee/escribe STORAGE_KEY = 'cenagem-demo-v1'
// Modo inline opcional: si inline === true, no renderiza header/footer de navegación
// ===============================
import React, { useEffect, useMemo, useReducer, useState } from 'react';

const STORAGE_KEY = 'cenagem-demo-v1';
const seedNow = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

// ---- Estado básico: reusamos "studies" como adjuntos generales y además guardamos "photos"
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { families: [], members: [], studies: [], photos: [] };
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_PHOTO': {
      const p = { id: uid(), createdAt: seedNow(), ...action.payload };
      return { ...state, photos: [p, ...(state.photos || [])] };
    }
    case 'DELETE_PHOTO': {
      const { id } = action.payload;
      return { ...state, photos: (state.photos || []).filter(x => x.id !== id) };
    }
    default:
      return state;
  }
}

function usePhotoStore() {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }, [state]);

  const listMembers = (familyId) => (state.members || []).filter(m => m.familyId === familyId);

  const addPhoto = (payload) => dispatch({ type: 'ADD_PHOTO', payload });
  const deletePhoto = (id) => dispatch({ type: 'DELETE_PHOTO', payload: { id } });

  return { state, listMembers, addPhoto, deletePhoto };
}

const yearsSince = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  let y = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) y--;
  return `${y}a`;
};

function UploadPhotos({ disabled, onFiles }) {
  const inputId = React.useId();
  return (
    <div className="grid gap-1">
      <label
        htmlFor={inputId}
        className={`px-3 py-2 rounded-xl border ${
          disabled ? 'border-slate-200 text-slate-400' : 'border-slate-300 hover:bg-slate-50 cursor-pointer'
        } flex items-center justify-center gap-2`}
      >
        <span>➕ Agregar fotos</span>
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => onFiles && onFiles(e.target.files)}
      />
      <div className="text-[11px] text-slate-500">Se adjuntan al miembro activo. Se guardan como adjuntos locales.</div>
    </div>
  );
}

export default function PhotosPage({ familyId, inline = false }) {
  const { state, listMembers, addPhoto, deletePhoto } = usePhotoStore();
  const fam = state.families.find(f => f.id === familyId);
  const members = useMemo(() => fam ? listMembers(fam.id) : [], [fam, state.members]);

  // Solo mostramos fotos de esta familia
  const familyPhotos = useMemo(() => (state.photos || []).filter(p => p.familyId === familyId), [state.photos, familyId]);

  // Filtro único por miembro (panel derecho)
  const [selectedMemberId, setSelectedMemberId] = useState(() => members[0]?.id || '');
  useEffect(() => {
    if (!selectedMemberId && members.length > 0) setSelectedMemberId(members[0].id);
  }, [members, selectedMemberId]);

  const filtered = useMemo(() => {
    if (!selectedMemberId) return [];
    return familyPhotos.filter(p => p.memberId === selectedMemberId);
  }, [familyPhotos, selectedMemberId]);

  if (!fam) {
    return inline ? null : (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">No se encontró la familia.</div>
      </div>
    );
  }

  return (
    <div className={inline ? '' : 'p-6 grid gap-4'}>
      {!inline && (
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={()=>{ window.location.hash = `#/family/${fam.id}`; }}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
          >
            ← Volver
          </button>
          <h2 className="text-lg font-semibold">HC {fam.code} · Fotos</h2>
          <div />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 grid gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-3">
            <div className="text-sm font-semibold">Galería</div>

            {filtered.length === 0 && (
              <div className="text-sm text-slate-500">No hay fotos registradas para este miembro.</div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map(p => {
                const m = members.find(mm => mm.id === p.memberId);
                return (
                  <div key={p.id} className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="aspect-square bg-slate-50">
                      {/* Si es blob/local URL */}
                      <img src={p.url} alt={p.caption || 'Foto'} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2 text-xs text-slate-600 flex items-center justify-between">
                      <div className="truncate">
                        {(m?.filiatorios?.iniciales || m?.rol || '—')}
                        {p.caption ? ` · ${p.caption}` : ''}
                      </div>
                      <button
                        onClick={()=>deletePhoto(p.id)}
                        className="px-2 py-1 rounded-lg border border-slate-300 hover:bg-red-50"
                        title="Eliminar"
                      >
                        🗑
                      </button>
                    </div>
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
              onClick={()=> setSelectedMemberId(m.id)}
              className={`text-left px-3 py-2 rounded-xl border ${selectedMemberId===m.id ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="text-sm"><b>{m.filiatorios?.iniciales || m.rol}</b> · {m.nombre || '—'}</div>
              <div className="text-xs text-slate-600">{yearsSince(m.nacimiento)} · OS: {m.os || '—'}</div>
            </button>
          ))}

          <UploadPhotos
            disabled={!selectedMemberId}
            onFiles={(files)=>{
              if (!selectedMemberId) return;
              [...files].forEach(file => {
                const url = URL.createObjectURL(file);
                addPhoto({
                  familyId,
                  memberId: selectedMemberId,
                  url,
                  caption: file.name
                });
              });
            }}
          />
        </aside>
      </div>

      {!inline && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-white/90 backdrop-blur border-t border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-center gap-2">
            <button
              onClick={()=>{ window.location.hash = `#/family/${fam.id}`; }}
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
