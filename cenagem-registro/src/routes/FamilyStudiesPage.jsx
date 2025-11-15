// ===============================
// src/routes/FamilyStudiesPage.jsx — Estudios Complementarios (sin react-router)
// - Soporta modo embebido: <FamilyStudiesPage familyId="..." inline />
// - Panel derecho con "Miembros" (A1/B1/...) mostrando nombre, edad y OS
// - Selección de miembro en el panel derecho = único filtro (sin opción "Familia")
// - "Screening básico" por miembro alineado a la izquierda junto a la lista
// - Botón "Agregar estudios" abre panel con formulario y adjunto opcional
// ===============================
import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useCenagemStore as useFamiliesStore } from "@/store/cenagemStore";

const SCREENING_STORAGE_KEY = "cenagem-screenings-v1";

function loadScreeningsState() {
  try {
    const raw = localStorage.getItem(SCREENING_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { memberScreenings: {} };
}

function screeningsReducer(state, action) {
  switch (action.type) {
    case "UPSERT_MEMBER_SCREENING": {
      const { memberId, key, patch } = action.payload;
      const currentMem = state.memberScreenings?.[memberId] || {};
      const currentItem = currentMem[key] || { ordered: false, done: false, result: "" };
      const nextItem = { ...currentItem, ...patch };
      return {
        memberScreenings: {
          ...(state.memberScreenings || {}),
          [memberId]: { ...currentMem, [key]: nextItem },
        },
      };
    }
    default:
      return state;
  }
}

function useFamilyStudiesStore(familyId) {
  const {
    state: familiesState,
    ensureFamilyDetail,
    createStudy: createStudyApi,
    deleteStudy: deleteStudyApi,
    createAttachment: createAttachmentApi,
    deleteAttachment: deleteAttachmentApi,
    downloadAttachment,
  } = useFamiliesStore();

  const [screeningState, dispatch] = useReducer(screeningsReducer, null, loadScreeningsState);

  useEffect(() => {
    try {
      localStorage.setItem(SCREENING_STORAGE_KEY, JSON.stringify(screeningState));
    } catch {
      // ignore
    }
  }, [screeningState]);

  useEffect(() => {
    if (!familyId) return;
    void ensureFamilyDetail(familyId, true);
  }, [familyId, ensureFamilyDetail]);

  const family = useMemo(
    () => familiesState.families.find((item) => item.id === familyId) || null,
    [familiesState.families, familyId],
  );

  const members = useMemo(
    () => familiesState.members.filter((member) => member.familyId === familyId),
    [familiesState.members, familyId],
  );

  const studies = useMemo(
    () => familiesState.studies.filter((study) => study.familyId === familyId),
    [familiesState.studies, familyId],
  );

  const attachments = useMemo(
    () => familiesState.attachments.filter((attachment) => attachment.familyId === familyId),
    [familiesState.attachments, familyId],
  );

  const getMemberScreening = (memberId) =>
    screeningState.memberScreenings?.[memberId] || {};

  const upsertMemberScreening = (memberId, key, patch) =>
    dispatch({ type: "UPSERT_MEMBER_SCREENING", payload: { memberId, key, patch } });

  return {
    family,
    members,
    studies,
    attachments,
    createStudy: (payload) => createStudyApi(familyId, payload),
    deleteStudy: (studyId) => deleteStudyApi(familyId, studyId),
    createAttachment: (payload) => createAttachmentApi(familyId, payload),
    deleteAttachment: (attachmentId) => deleteAttachmentApi(familyId, attachmentId),
    downloadAttachment,
    getMemberScreening,
    upsertMemberScreening,
  };
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

// Paleta para tarjetas de estudios; se asigna determinísticamente por tipo
const STUDY_CARD_THEMES = [
  {
    accentBar: "bg-sky-500",
    accentSoft: "bg-sky-50",
    border: "border-sky-200",
    badgeBg: "bg-sky-100",
    badgeText: "text-sky-700",
    chipBorder: "border-sky-200",
    chipText: "text-sky-700",
  },
  {
    accentBar: "bg-emerald-500",
    accentSoft: "bg-emerald-50",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    chipBorder: "border-emerald-200",
    chipText: "text-emerald-700",
  },
  {
    accentBar: "bg-amber-500",
    accentSoft: "bg-amber-50",
    border: "border-amber-200",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    chipBorder: "border-amber-200",
    chipText: "text-amber-700",
  },
  {
    accentBar: "bg-violet-500",
    accentSoft: "bg-violet-50",
    border: "border-violet-200",
    badgeBg: "bg-violet-100",
    badgeText: "text-violet-700",
    chipBorder: "border-violet-200",
    chipText: "text-violet-700",
  },
  {
    accentBar: "bg-rose-500",
    accentSoft: "bg-rose-50",
    border: "border-rose-200",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-700",
    chipBorder: "border-rose-200",
    chipText: "text-rose-700",
  },
  {
    accentBar: "bg-indigo-500",
    accentSoft: "bg-indigo-50",
    border: "border-indigo-200",
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-700",
    chipBorder: "border-indigo-200",
    chipText: "text-indigo-700",
  },
];

const themeForStudyType = (tipo) => {
  const normalized = (tipo || "otros").toString().toLowerCase();
  const sum = Array.from(normalized).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return STUDY_CARD_THEMES[sum % STUDY_CARD_THEMES.length];
};

// Config de screenings estándar
const SCREENING_DEFS = [
  { key: "ecografiaAbdominoRenal", label: "Ecografía abdomino-renal" },
  { key: "ecocardiograma", label: "Ecocardiograma" },
  { key: "rmnEncefalo", label: "RMN de encéfalo" },
  { key: "audiometria", label: "Audiometría" }
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "con-resultado", label: "Con resultado" },
  { value: "sin-resultado", label: "Pendientes" },
  { value: "con-adjuntos", label: "Con adjuntos" },
];

const STUDY_STATUS_STYLES = {
  REQUESTED: {
    label: "Pendiente",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  IN_PROGRESS: {
    label: "En proceso",
    badge: "bg-sky-50 text-sky-700 border border-sky-200",
  },
  COMPLETED: {
    label: "Con resultado",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  DONE: {
    label: "Con resultado",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  RESULT_READY: {
    label: "Con resultado",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  CANCELLED: {
    label: "Cancelado",
    badge: "bg-rose-50 text-rose-700 border border-rose-200",
  },
};

const DEFAULT_STATUS_STYLE = {
  label: "Sin estado",
  badge: "bg-slate-100 text-slate-600 border border-slate-200",
};

const normalizeStatus = (status) => (status || "").toString().trim().toUpperCase().replace(/\s+/g, "_");

const getStudyStatusStyle = (status) => {
  const normalized = normalizeStatus(status);
  return STUDY_STATUS_STYLES[normalized] || DEFAULT_STATUS_STYLE;
};

const pickStudyDate = (study) => {
  const dateStr = study.resultadoFecha || study.fecha || study.createdAt;
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatShortDate = (date) => {
  if (!date) return "—";
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

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
        <input
          value={showResultInput ? result : ''}
          onChange={(e)=> onResultChange(e.target.value)}
          placeholder={showResultInput ? "Normal" : "—"}
          disabled={!showResultInput}
          className={`w-full px-3 py-2 rounded-xl border ${showResultInput ? "border-slate-300" : "border-slate-200 bg-slate-50 text-slate-500"}`}
        />
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
  const {
    family: fam,
    members,
    studies,
    attachments,
    createStudy,
    deleteStudy,
    createAttachment,
    deleteAttachment,
    downloadAttachment,
    getMemberScreening,
    upsertMemberScreening,
  } = useFamilyStudiesStore(familyId);

  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    if (!selectedMemberId && members.length > 0) {
      setSelectedMemberId(members[0].id);
      return;
    }
    if (selectedMemberId && !members.some(m => m.id === selectedMemberId)) {
      setSelectedMemberId(members[0]?.id || "");
    }
  }, [members, selectedMemberId]);

  useEffect(() => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
  }, [selectedMemberId]);

  const studyCountByMember = useMemo(() => {
    const map = new Map();
    for (const s of studies) {
      if (s.memberId) map.set(s.memberId, (map.get(s.memberId) || 0) + 1);
    }
    return map;
  }, [studies]);

  const attachmentsByStudy = useMemo(() => {
    const map = new Map();
    attachments.forEach((attachment) => {
      if (!attachment.studyId) return;
      const list = map.get(attachment.studyId) || [];
      list.push(attachment);
      map.set(attachment.studyId, list);
    });
    return map;
  }, [attachments]);

  const memberStudies = useMemo(() => {
    if (!selectedMemberId) return [];
    return studies.filter((study) => study.memberId === selectedMemberId);
  }, [studies, selectedMemberId]);

  const typeOptions = useMemo(() => {
    const set = new Set();
    memberStudies.forEach((study) => {
      if (study.tipo) set.add(study.tipo);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [memberStudies]);

  const filteredStudies = useMemo(() => {
    const text = searchTerm.trim().toLowerCase();
    return memberStudies.filter((study) => {
      if (text) {
        const haystack = `${study.tipo || ""} ${study.nombre || ""} ${study.descripcion || ""} ${study.resultado || ""}`.toLowerCase();
        if (!haystack.includes(text)) return false;
      }
      if (statusFilter === "con-resultado" && !study.resultado?.trim()) return false;
      if (statusFilter === "sin-resultado" && study.resultado?.trim()) return false;
      if (statusFilter === "con-adjuntos") {
        const studyAttachments = attachmentsByStudy.get(study.id) || [];
        if (!studyAttachments.length) return false;
      }
      if (typeFilter !== "all" && (study.tipo || "") !== typeFilter) return false;
      return true;
    });
  }, [memberStudies, searchTerm, statusFilter, typeFilter, attachmentsByStudy]);

  const sortedStudies = useMemo(
    () =>
      [...filteredStudies].sort((a, b) => {
        const dateA = pickStudyDate(a)?.getTime() || 0;
        const dateB = pickStudyDate(b)?.getTime() || 0;
        return dateB - dateA;
      }),
    [filteredStudies],
  );

  const summaryStats = useMemo(() => {
    let withResult = 0;
    let withAttachment = 0;
    let latest = null;
    memberStudies.forEach((study) => {
      if (study.resultado?.trim()) withResult++;
      if ((attachmentsByStudy.get(study.id) || []).length) withAttachment++;
      const date = pickStudyDate(study);
      if (date && (!latest || date > latest)) {
        latest = date;
      }
    });
    return {
      total: memberStudies.length,
      withResult,
      pending: Math.max(memberStudies.length - withResult, 0),
      withAttachment,
      lastUpdate: latest,
    };
  }, [memberStudies, attachmentsByStudy]);

  const highlightStudies = useMemo(
    () =>
      [...memberStudies]
        .sort((a, b) => {
          const dateA = pickStudyDate(a)?.getTime() || 0;
          const dateB = pickStudyDate(b)?.getTime() || 0;
          return dateB - dateA;
        })
        .slice(0, 3),
    [memberStudies],
  );

  const activeMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return members.find(m => m.id === selectedMemberId) || null;
  }, [selectedMemberId, members]);

  const hasActiveFilters = searchTerm.trim().length > 0 || statusFilter !== "all" || typeFilter !== "all";
  const resultsPercent = summaryStats.total ? Math.round((summaryStats.withResult / summaryStats.total) * 100) : 0;

  const screening = activeMember ? getMemberScreening(activeMember.id) : {};
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

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const handleCreateStudy = async ({ tipo, resultado, file }) => {
    if (!fam || !selectedMemberId) return false;
    const label = (tipo || "").trim();
    if (!label) return false;
    const today = new Date().toISOString().slice(0, 10);
    const studyPayload = {
      memberId: selectedMemberId,
      tipo: "COMPLEMENTARY",
      nombre: label,
      fecha: today,
      resultado,
    };
    try {
      const study = await createStudy(studyPayload);
      if (file && study?.id) {
        await createAttachment({
          memberId: selectedMemberId,
          studyId: study.id,
          category: 'STUDY_RESULT',
          description: resultado || label,
          file,
        });
      }
      return true;
    } catch (error) {
      console.error("No se pudo registrar el estudio", error);
      return false;
    }
  };

  const handleDeleteStudy = async (studyId) => {
    const relatedAttachments = attachments.filter((attachment) => attachment.studyId === studyId);
    try {
      await deleteStudy(studyId);
      await Promise.all(
        relatedAttachments.map((attachment) => deleteAttachment(attachment.id)),
      );
    } catch (error) {
      console.error("No se pudo eliminar el estudio", error);
    }
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      const blob = await downloadAttachment(attachment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.fileName || attachment.description || 'adjunto';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 0);
    } catch (error) {
      console.error("No se pudo descargar el adjunto", error);
    }
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
    <div className={inline ? "" : "app-shell p-6 grid gap-4"}>
      {!inline && (
        <div className="mb-2 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { window.location.hash = `#/family/${fam.id}`; }}
              className="px-3 py-2 rounded-xl border border-white/40 text-white hover:bg-white/10 transition"
            >
              ↩ Volver a HC
            </button>
            <h2 className="text-lg font-semibold text-white">Estudios complementarios</h2>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-[minmax(0,1fr)_280px] gap-3">
        <div className="grid gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-4">
            <div>
              <div className="text-sm font-semibold">Resumen y filtros</div>
              <div className="text-xs text-slate-500">Explorá el avance de los estudios del miembro activo.</div>
            </div>
            {activeMember ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <div>
                    {activeMember.filiatorios?.iniciales || activeMember.rol} · {activeMember.nombre || "—"}
                  </div>
                  <div>
                    {summaryStats.total} estudio{summaryStats.total === 1 ? "" : "s"} registrados
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">Estudios</div>
                    <div className="text-2xl font-semibold text-slate-900">{summaryStats.total}</div>
                    <div className="text-[11px] text-slate-500">Registrados</div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">Resultados</div>
                    <div className="text-2xl font-semibold text-slate-900">{summaryStats.withResult}</div>
                    <div className="text-[11px] text-slate-500">
                      {summaryStats.total ? `${resultsPercent}% con resultado` : "Sin datos"} · Pendientes: {summaryStats.pending}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">Adjuntos</div>
                    <div className="text-2xl font-semibold text-slate-900">{summaryStats.withAttachment}</div>
                    <div className="text-[11px] text-slate-500">Estudios con soportes</div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-slate-500">Última actualización</div>
                    <div className="text-xl font-semibold text-slate-900">
                      {summaryStats.lastUpdate ? formatShortDate(summaryStats.lastUpdate) : "—"}
                    </div>
                    <div className="text-[11px] text-slate-500">Fecha más reciente</div>
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                  <div className="grid gap-3">
                    <div className="grid gap-1">
                      <label className="text-xs font-medium text-slate-600" htmlFor="studies-search">
                        Buscar estudios
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <input
                          id="studies-search"
                          type="search"
                          value={searchTerm}
                          onChange={(e)=> setSearchTerm(e.target.value)}
                          placeholder="Tipo, resultado u observaciones"
                          className="w-full flex-1 rounded-xl border border-slate-300 px-3 py-2"
                        />
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="whitespace-nowrap rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-1">
                      <span className="text-xs font-medium text-slate-600">Estado</span>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_FILTER_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setStatusFilter(option.value)}
                            className={`rounded-full border px-3 py-1.5 text-xs ${statusFilter === option.value ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {typeOptions.length > 1 && (
                      <div className="grid gap-1">
                        <span className="text-xs font-medium text-slate-600">Tipo de estudio</span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setTypeFilter("all")}
                            className={`rounded-full border px-3 py-1.5 text-xs ${typeFilter === "all" ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                          >
                            Todos
                          </button>
                          {typeOptions.map((tipo) => (
                            <button
                              key={tipo}
                              type="button"
                              onClick={() => setTypeFilter(tipo)}
                              className={`rounded-full border px-3 py-1.5 text-xs ${typeFilter === tipo ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                            >
                              {tipo}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="text-xs font-semibold text-slate-600">Últimos movimientos</div>
                    {highlightStudies.length === 0 ? (
                      <div className="mt-2 text-xs text-slate-500">
                        Registrá estudios para ver la línea de tiempo reciente.
                      </div>
                    ) : (
                      <div className="mt-3 grid gap-3">
                        {highlightStudies.map((study) => {
                          const statusStyle = getStudyStatusStyle(study.estado);
                          const dateLabel = formatShortDate(pickStudyDate(study));
                          const resultPreview = study.resultado?.trim();
                          const title = study.nombre || study.descripcion || study.tipo || "Estudio";
                          return (
                            <div key={study.id} className="relative pl-4">
                              <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />
                              <div className="text-sm font-semibold text-slate-900">{title}</div>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${statusStyle.badge}`}>
                                  {statusStyle.label}
                                </span>
                                <span>{dateLabel}</span>
                              </div>
                              {resultPreview && (
                                <div className="text-xs text-slate-600">
                                  {resultPreview.length > 120 ? `${resultPreview.slice(0, 117)}…` : resultPreview}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500">
                Agregá integrantes para comenzar a registrar y filtrar estudios.
              </div>
            )}
          </div>

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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold">
                Estudios cargados {selectedMemberId ? `· ${members.find(m=>m.id===selectedMemberId)?.filiatorios?.iniciales || "Miembro"}` : ""}
              </div>
              {memberStudies.length > 0 && (
                <div className="text-xs text-slate-500">
                  {sortedStudies.length} de {memberStudies.length} visibles
                </div>
              )}
            </div>
            <div className="grid gap-2">
              {memberStudies.length === 0 && (
                <div className="text-sm text-slate-500">No hay estudios registrados para este miembro.</div>
              )}
              {memberStudies.length > 0 && sortedStudies.length === 0 && (
                <div className="text-sm text-slate-500">
                  No hay estudios que coincidan con los filtros aplicados.
                </div>
              )}
              {sortedStudies.map((study) => {
                const member = study.memberId ? members.find((item) => item.id === study.memberId) : null;
                const studyAttachments = attachmentsByStudy.get(study.id) || [];
                const memberLabel = member
                  ? `${member.filiatorios?.iniciales || member.rol} · ${member.nombre || "—"}`
                  : "Familia";
                const theme = themeForStudyType(study.tipo);
                const statusStyle = getStudyStatusStyle(study.estado);
                return (
                  <article
                    key={study.id}
                    className={`relative overflow-hidden rounded-2xl border ${theme.border} bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 ${theme.accentBar}`} aria-hidden="true" />
                    <div className="px-4 py-3 grid gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${theme.badgeBg} ${theme.badgeText}`}
                            >
                              {study.tipo || "Estudio"}
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${statusStyle.badge}`}>
                              {statusStyle.label}
                            </span>
                          </div>
                          <div className="text-base font-semibold text-slate-900">
                            {study.nombre || study.descripcion || "—"}
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                            <span>Pedido: {fmtDate(study.fecha)}</span>
                            {study.resultadoFecha && <span>Resultado: {fmtDate(study.resultadoFecha)}</span>}
                            <span>Paciente: {memberLabel}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudy(study.id)}
                          className="rounded-full border border-transparent p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          title="Eliminar"
                          aria-label="Eliminar estudio"
                        >
                          <span aria-hidden="true">🗑</span>
                        </button>
                      </div>

                      {study.resultado && (
                        <div
                          className={`text-sm leading-relaxed text-slate-700 px-3 py-2 rounded-xl ${theme.accentSoft}`}
                        >
                          {study.resultado}
                        </div>
                      )}

                      {Boolean(studyAttachments.length) && (
                        <div className="flex flex-wrap gap-2">
                          {studyAttachments.map((attachment) => (
                            <button
                              key={attachment.id}
                              type="button"
                              onClick={() => handleDownloadAttachment(attachment)}
                              className={`inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1.5 text-xs font-medium transition hover:bg-slate-50 ${theme.chipBorder} ${theme.chipText}`}
                            >
                              {attachment.fileName || attachment.description || "Adjunto"}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
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
