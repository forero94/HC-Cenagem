// ===============================
// src/routes/FamilyStudiesPage.jsx — Estudios Complementarios (sin react-router)
// - Soporta modo embebido: <FamilyStudiesPage familyId="..." inline />
// - Panel derecho con "Miembros" (A1/B1/...) mostrando nombre, edad y OS
// - Selección de miembro en el panel derecho = único filtro (sin opción "Familia")
// - "Screening básico" por miembro alineado a la izquierda junto a la lista
// - Botón "Agregar estudios" abre panel con formulario y adjunto opcional
// ===============================
import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";

const STORAGE_KEY = "cenagem-demo-v1";
const seedNow = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

// ---- Carga inicial desde localStorage
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { families: [], members: [], evolutions: [], studies: [], memberScreenings: {} };
}

// ---- Reducer con soporte de estudios + screenings por miembro
function reducer(state, action) {
  switch (action.type) {
    case "CREATE_STUDY": {
      const s = { id: uid(), createdAt: seedNow(), ...action.payload };
      return { ...state, studies: [s, ...(state.studies || [])] };
    }
    case "DELETE_STUDY": {
      const { id } = action.payload;
      return { ...state, studies: (state.studies || []).filter(s => s.id !== id) };
    }
    case "UPSERT_MEMBER_SCREENING": {
      const { memberId, key, patch } = action.payload;
      const currentMem = (state.memberScreenings?.[memberId]) || {};
      const currentItem = currentMem[key] || { ordered: false, done: false, result: "" };
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
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* ignore */ }
  }, [state]);

  const listMembers = (familyId) => (state.members || []).filter(m => m.familyId === familyId);
  const listStudiesByFamily = (familyId) => (state.studies || []).filter(s => s.familyId === familyId);

  const createStudy = (payload) => dispatch({ type: "CREATE_STUDY", payload });
  const deleteStudy = (id) => dispatch({ type: "DELETE_STUDY", payload: { id } });

  const getMemberScreening = (memberId) => (state.memberScreenings?.[memberId]) || {};
  const upsertMemberScreening = (memberId, key, patch) => dispatch({ type: "UPSERT_MEMBER_SCREENING", payload: { memberId, key, patch } });

  return { state, listMembers, listStudiesByFamily, createStudy, deleteStudy, getMemberScreening, upsertMemberScreening };
}

// ---- Utils UI
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString();
};

const toDate = (s) => { try { return new Date(s); } catch { return null; } };
const yearsSince = (isoDate) => {
  const d = toDate(isoDate);
  if (!d) return "—";
  const now = new Date();
  let y = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) y--;
  return `${y}a`;
};

const ageLabel = (member) => {
  if (typeof member?.edadCalculada === 'number') return `${member.edadCalculada}a`;
  if (member?.edadTexto) return member.edadTexto;
  return yearsSince(member?.nacimiento);
};

// Config de screenings estándar
const SCREENING_DEFS = [
  { key: "ecografiaAbdominoRenal", label: "Ecografía abdomino-renal" },
  { key: "ecocardiograma", label: "Ecocardiograma" },
  { key: "rmnEncefalo", label: "RMN de encéfalo" },
  { key: "audiometria", label: "Audiometría" }
];

function ScreeningRow({ label, value, onToggleOrdered, onToggleDone, onResultChange }) {
  const { ordered = false, done = false, result = "" } = value || {};
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
        <span className={`text-sm ${!ordered ? "text-slate-400" : ""}`}>Realizado</span>
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

function AgregarEstudioUpload({ disabled, onCreate }) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState("");
  const [resultado, setResultado] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const baseId = React.useId();
  const tipoId = `${baseId}-tipo`;
  const resultadoId = `${baseId}-resultado`;
  const archivoId = `${baseId}-archivo`;

  const resetForm = () => {
    setTipo("");
    setResultado("");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (disabled) {
      setOpen(false);
      resetForm();
    }
  }, [disabled]);

  const handleFileChange = (e) => {
    const nextFile = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFile(nextFile);
  };

  const handleToggle = () => {
    if (disabled) return;
    setOpen(prev => {
      const next = !prev;
      if (!next) resetForm();
      return next;
    });
  };

  const handleCancel = () => {
    resetForm();
    setOpen(false);
  };

  const handleSubmit = () => {
    const cleanTipo = tipo.trim();
    if (!cleanTipo) return;
    const cleanResultado = resultado.trim();
    const result = onCreate ? onCreate({ tipo: cleanTipo, resultado: cleanResultado, file }) : true;
    if (result && typeof result.then === "function") {
      result.then((ok) => {
        if (ok !== false) {
          resetForm();
          setOpen(false);
        }
      });
      return;
    }
    if (result !== false) {
      resetForm();
      setOpen(false);
    }
  };

  const canSubmit = tipo.trim().length > 0;

  return (
    <div className="grid w-full gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-xl border ${disabled ? "border-slate-200 text-slate-400 cursor-not-allowed" : "border-slate-300 hover:bg-slate-50"}`}
      >
        ➕ Agregar estudios
      </button>
      {open && (
        <div className="grid w-full gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-1">
            <label htmlFor={tipoId} className="text-xs font-medium text-slate-600">Tipo de estudio</label>
            <input
              id={tipoId}
              type="text"
              value={tipo}
              onChange={(e)=> setTipo(e.target.value)}
              placeholder="Ej: Resonancia magnética"
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor={resultadoId} className="text-xs font-medium text-slate-600">Resultado</label>
            <input
              id={resultadoId}
              type="text"
              value={resultado}
              onChange={(e)=> setResultado(e.target.value)}
              placeholder="Texto libre"
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor={archivoId} className="text-xs font-medium text-slate-600">Adjuntar archivo (opcional)</label>
            <input
              id={archivoId}
              type="file"
              accept="image/*,.pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="w-full text-sm"
            />
            {file && (
              <div className="max-w-full truncate text-[11px] text-slate-500">{file.name}</div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`px-3 py-1.5 rounded-xl text-sm ${canSubmit ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-500 cursor-not-allowed"}`}
            >
              Guardar
            </button>
          </div>
        </div>
      )}
      <div className="text-[11px] text-slate-500">Se registra para el miembro activo. Adjuntar es opcional.</div>
    </div>
  );
}

export default function FamilyStudiesPage({ familyId, inline = false }) {
  const { state, createStudy, deleteStudy, upsertMemberScreening } = useCenagemStore();

  const fam = state.families.find(f => f.id === familyId) || null;

  const [selectedMemberId, setSelectedMemberId] = useState("");

  const members = useMemo(() => {
    if (!fam) return [];
    return (state.members || []).filter(m => m.familyId === fam.id);
  }, [fam, state.members]);

  const studies = useMemo(() => {
    if (!fam) return [];
    return (state.studies || []).filter(s => s.familyId === fam.id);
  }, [fam, state.studies]);

  useEffect(() => {
    if (!selectedMemberId && members.length > 0) {
      setSelectedMemberId(members[0].id);
      return;
    }
    if (selectedMemberId && !members.some(m => m.id === selectedMemberId)) {
      setSelectedMemberId(members[0]?.id || "");
    }
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

  const activeMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return members.find(m => m.id === selectedMemberId) || null;
  }, [selectedMemberId, members]);

  const screening = activeMember ? (state.memberScreenings?.[activeMember.id] || {}) : {};
  const valueFor = (key) => screening[key] || { ordered: false, done: false, result: "" };

  const handleOrdered = (key, checked) => {
    if (!activeMember) return;
    if (checked) {
      upsertMemberScreening(activeMember.id, key, { ordered: true });
    } else {
      upsertMemberScreening(activeMember.id, key, { ordered: false, done: false, result: "" });
    }
  };

  const handleDone = (key, checked) => {
    if (!activeMember) return;
    if (checked) {
      const v = valueFor(key);
      upsertMemberScreening(activeMember.id, key, {
        done: true,
        ordered: true,
        result: v.result?.trim() ? v.result : "Normal"
      });
    } else {
      upsertMemberScreening(activeMember.id, key, { done: false, result: "" });
    }
  };

  const handleResult = (key, text) => {
    if (!activeMember) return;
    upsertMemberScreening(activeMember.id, key, { result: text });
  };

  const handleCreateStudy = ({ tipo, resultado, file }) => {
    if (!fam || !selectedMemberId) return false;
    const today = new Date().toISOString().slice(0, 10);
    const payload = {
      familyId: fam.id,
      memberId: selectedMemberId,
      tipo,
      nombre: file ? file.name : "",
      fecha: today,
      resultado
    };
    if (file) {
      payload.archivoUrl = URL.createObjectURL(file);
    }
    createStudy(payload);
    return true;
  };

  if (!fam) {
    if (inline) return null;
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">No se encontró la familia.</div>
      </div>
    );
  }

  return (
    <div className={inline ? "" : "p-6 grid gap-4"}>
      {!inline && (
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={()=>{ window.location.hash = `#/family/${fam.id}`; }}
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
            >
              ↩ Volver a HC
            </button>
            <h2 className="text-lg font-semibold">Estudios complementarios</h2>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-[minmax(0,1fr)_280px] gap-3">
        <div className="grid gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">Screening básico</div>
                <div className="text-xs text-slate-500">Marcá pedido, realización y resultados por miembro.</div>
              </div>
              {activeMember && (
                <div className="text-xs text-slate-600">
                  {activeMember.filiatorios?.iniciales || activeMember.rol} · {activeMember.nombre || "—"}
                </div>
              )}
            </div>
            {!activeMember ? (
              <div className="mt-3 text-sm text-slate-500">Seleccioná un integrante en el panel lateral para registrar screenings.</div>
            ) : (
              <div className="grid gap-2 mt-3">
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
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-2">
            <div className="text-sm font-semibold">
              Estudios cargados {selectedMemberId ? `· ${members.find(m=>m.id===selectedMemberId)?.filiatorios?.iniciales || "Miembro"}` : ""}
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
                      <div><b>{s.tipo}</b> · {s.nombre || "—"}</div>
                      <div className="text-slate-600">
                        {fmtDate(s.fecha)} · {(m?.filiatorios?.iniciales || (m ? m.rol : "familia"))}
                        {s.resultado ? ` · ${s.resultado}` : ""}
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
              className={`text-left px-3 py-2 rounded-xl border ${selectedMemberId===m.id ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 hover:bg-slate-50"}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <b>{m.filiatorios?.iniciales || m.rol}</b> · {m.nombre || "—"}
                </div>
                <span className="text-xs opacity-80">{studyCountByMember.get(m.id) || 0}</span>
              </div>
              <div className="text-xs text-slate-600">{ageLabel(m)} · OS: {m.os || "—"}</div>
            </button>
          ))}

          <AgregarEstudioUpload
            disabled={!selectedMemberId}
            onCreate={handleCreateStudy}
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
