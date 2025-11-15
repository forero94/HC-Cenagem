// ===============================
// src/routes/GeneticsPage.jsx — Estudios Genéticos (API)
// ===============================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCenagemStore } from '@/store/cenagemStore';

const fmtDate = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

const yearsSince = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) years -= 1;
  return `${years}a`;
};

const GENETIC_DEFS = [
  { key: 'fragilidadCromosomaX', label: 'Fragilidad del cromosoma X' },
  { key: 'hiperplasiaSuprarrenal', label: 'Hiperplasia suprarrenal congénita' },
  { key: 'distrofiaSteinert', label: 'Distrofia miotónica de Steinert' },
  { key: 'ataxiaFriedreich', label: 'Ataxia de Friedreich' },
  { key: 'mlpaSubtelomericas', label: 'MLPA regiones subteloméricas', group: 'mlpa' },
  { key: 'mlpaCentromericas', label: 'MLPA regiones centroméricas', group: 'mlpa' },
  {
    key: 'mlpaTrastornosRecurrentes',
    label: 'MLPA trastornos genómicos recurrentes',
    group: 'mlpa',
    description:
      'Incluye deleción 1p36, microdeleciones 2p16, 2q33/MBD5, 2q33/SATB2, 3q29, 9q22.3, 15q24, 17q21, 22q13/Phelan-McDermid, Cri du Chat (5p15), DiGeorge/duplicación 22q11, región 10p15, Langer-Giedion 8q, Miller-Dieker 17p, NF1, Prader-Willi/Angelman, MECP2 duplicación Xq28, Rubinstein-Taybi, Smith-Magenis, Sotos 5q35.3, Williams y Wolf-Hirschhorn 4p16.3.',
  },
  { key: 'mlpaLigadasX', label: 'MLPA ligadas al X', group: 'mlpa' },
  { key: 'mlpaSmeDiGeorge', label: 'MLPA SME DiGeorge', group: 'mlpa' },
  { key: 'mlpaEpilepsias', label: 'MLPA epilepsias', group: 'mlpa' },
  { key: 'mlpaSexuales', label: 'MLPA sexuales', group: 'mlpa' },
  { key: 'mlpaSilverRussell', label: 'MLPA Silver Russell/Beckwith Wiedemann', group: 'mlpa' },
  { key: 'mlpaPraderWilli', label: 'MLPA Prader Willi/Angelman', group: 'mlpa' },
  { key: 'mlpaWilliams', label: 'MLPA Williams', group: 'mlpa' },
  { key: 'sry', label: 'SRY' },
  { key: 'microdelecionesY', label: 'Microdeleciones del cromosoma Y' },
  { key: 'brca', label: 'BRCA1 / BRCA2' },
  { key: 'carcinomaRet', label: 'Carcinoma medular de tiroides (gen RET)' },
  { key: 'arrayCgh', label: 'Array-CGH' },
  {
    key: 'fibrosisQuistica',
    label: 'Fibrosis quística y principales enfermedades respiratorias de causa genética',
  },
];

const GENETIC_GROUP_META = {
  mlpa: {
    label: 'Paneles MLPA',
    description: 'Desplegá para registrar las distintas variantes MLPA.',
  },
};

const GENETIC_DEFS_BY_KEY = GENETIC_DEFS.reduce((acc, def) => {
  acc[def.key] = def;
  return acc;
}, {});

const GENETIC_GROUP_ITEMS = GENETIC_DEFS.reduce((acc, def) => {
  if (def.group) {
    if (!acc[def.group]) acc[def.group] = [];
    acc[def.group].push(def);
  }
  return acc;
}, {});

const GENETIC_BLOCKS = (() => {
  const seenGroups = new Set();
  return GENETIC_DEFS.reduce((blocks, def) => {
    if (def.group) {
      if (!seenGroups.has(def.group)) {
        seenGroups.add(def.group);
        blocks.push({ type: 'group', key: def.group });
      }
      return blocks;
    }
    blocks.push({ type: 'single', key: def.key });
    return blocks;
  }, []);
})();

// Paleta cromática para tarjetas de estudios genéticos
const STUDY_CARD_THEMES = [
  {
    accentBar: 'bg-cyan-500',
    accentSoft: 'bg-cyan-50',
    border: 'border-cyan-200',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-700',
    chipBorder: 'border-cyan-200',
    chipText: 'text-cyan-700',
  },
  {
    accentBar: 'bg-lime-500',
    accentSoft: 'bg-lime-50',
    border: 'border-lime-200',
    badgeBg: 'bg-lime-100',
    badgeText: 'text-lime-700',
    chipBorder: 'border-lime-200',
    chipText: 'text-lime-700',
  },
  {
    accentBar: 'bg-orange-500',
    accentSoft: 'bg-orange-50',
    border: 'border-orange-200',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
    chipBorder: 'border-orange-200',
    chipText: 'text-orange-700',
  },
  {
    accentBar: 'bg-purple-500',
    accentSoft: 'bg-purple-50',
    border: 'border-purple-200',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    chipBorder: 'border-purple-200',
    chipText: 'text-purple-700',
  },
  {
    accentBar: 'bg-rose-500',
    accentSoft: 'bg-rose-50',
    border: 'border-rose-200',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-700',
    chipBorder: 'border-rose-200',
    chipText: 'text-rose-700',
  },
  {
    accentBar: 'bg-indigo-500',
    accentSoft: 'bg-indigo-50',
    border: 'border-indigo-200',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
    chipBorder: 'border-indigo-200',
    chipText: 'text-indigo-700',
  },
];

const themeForStudyType = (tipo) => {
  const normalized = (tipo || 'otros').toString().toLowerCase();
  const sum = Array.from(normalized).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return STUDY_CARD_THEMES[sum % STUDY_CARD_THEMES.length];
};

function useFamilyGenetics(familyId) {
  const {
    state,
    loading,
    ensureFamilyDetail,
    createStudy: createStudyInStore,
    deleteStudy: deleteStudyInStore,
    createAttachment: createAttachmentInStore,
    deleteAttachment: deleteAttachmentInStore,
    downloadAttachment,
    updateMember,
  } = useCenagemStore();

  useEffect(() => {
    if (familyId) {
      void ensureFamilyDetail(familyId, true);
    }
  }, [familyId, ensureFamilyDetail]);

  const family = useMemo(
    () => state.families.find((item) => item.id === familyId) || null,
    [state.families, familyId],
  );

  const members = useMemo(
    () => state.members.filter((member) => member.familyId === familyId),
    [state.members, familyId],
  );

  const studies = useMemo(
    () => state.studies.filter((study) => study.familyId === familyId),
    [state.studies, familyId],
  );

  const attachments = useMemo(
    () => state.attachments.filter((attachment) => attachment.familyId === familyId),
    [state.attachments, familyId],
  );

  const membersById = useMemo(() => {
    const map = new Map();
    members.forEach((member) => map.set(member.id, member));
    return map;
  }, [members]);

  const upsertMemberGenetic = useCallback(
    async (memberId, studyKey, patch) => {
      const member = membersById.get(memberId);
      if (!member) return;
      const genetics = {
        ...(member.metadata?.genetics || {}),
        [studyKey]: {
          ...(member.metadata?.genetics?.[studyKey] || { pedido: false, realizado: false, resultado: '' }),
          ...patch,
        },
      };
      await updateMember(memberId, {
        metadata: {
          ...(member.metadata || {}),
          genetics,
        },
      });
    },
    [membersById, updateMember],
  );

  const setMemberHPO = useCallback(
    async (memberId, terms) => {
      const member = membersById.get(memberId);
      if (!member) return;
      await updateMember(memberId, {
        metadata: {
          ...(member.metadata || {}),
          hpoTerms: terms,
        },
      });
    },
    [membersById, updateMember],
  );

  const getMemberGenetic = useCallback(
    (memberId) => membersById.get(memberId)?.metadata?.genetics || {},
    [membersById],
  );

  const getMemberHPO = useCallback(
    (memberId) => membersById.get(memberId)?.metadata?.hpoTerms || [],
    [membersById],
  );

  const createStudy = useCallback(
    (input) => {
      if (!familyId) return Promise.resolve(null);
      return createStudyInStore(familyId, input);
    },
    [createStudyInStore, familyId],
  );

  const deleteStudy = useCallback(
    (studyId) => {
      if (!familyId) return Promise.resolve();
      return deleteStudyInStore(familyId, studyId);
    },
    [deleteStudyInStore, familyId],
  );

  const createAttachment = useCallback(
    (input) => {
      if (!familyId) return Promise.resolve(null);
      return createAttachmentInStore(familyId, input);
    },
    [createAttachmentInStore, familyId],
  );

  const deleteAttachment = useCallback(
    (attachmentId) => {
      if (!familyId) return Promise.resolve();
      return deleteAttachmentInStore(familyId, attachmentId);
    },
    [deleteAttachmentInStore, familyId],
  );

  return {
    family,
    loading,
    members,
    studies,
    attachments,
    createStudy,
    deleteStudy,
    createAttachment,
    deleteAttachment,
    downloadAttachment,
    getMemberGenetic,
    upsertMemberGenetic,
    getMemberHPO,
    setMemberHPO,
  };
}

function GeneticRow({
  label,
  description,
  value,
  onTogglePedido,
  onToggleRealizado,
  onResultChange,
}) {
  const { pedido = false, realizado = false, resultado = '' } = value || {};
  return (
    <div className="grid items-center gap-2 md:grid-cols-12">
      <label className="md:col-span-4 flex items-start gap-2">
        <input
          type="checkbox"
          checked={Boolean(pedido)}
          className="mt-1"
          onChange={(event) => onTogglePedido(event.target.checked)}
        />
        <div className="flex flex-col text-sm">
          <span className="flex items-center gap-1">
            {label}
            {description ? (
              <span className="relative inline-flex">
                <span
                  tabIndex={0}
                  role="img"
                  aria-label={`Información adicional sobre ${label}`}
                  className="group inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-400 text-[11px] font-semibold text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  ⓘ
                  <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden w-64 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-normal text-white shadow-lg group-hover:block group-focus-visible:block">
                    {description}
                  </span>
                </span>
              </span>
            ) : null}
          </span>
        </div>
      </label>
      <div className="md:col-span-3 flex items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(realizado)}
          disabled={!pedido}
          onChange={(event) => onToggleRealizado(event.target.checked)}
        />
        <span className={`text-sm ${pedido ? '' : 'text-slate-400'}`}>Realizado</span>
      </div>
      <div className="md:col-span-5">
        <input
          className="w-full rounded-xl border border-slate-300 px-3 py-2"
          value={resultado}
          onChange={(event) => onResultChange(event.target.value)}
          placeholder="Resultado (opcional)"
          disabled={!realizado}
        />
      </div>
    </div>
  );
}

function HPOEditor({ terms, onChange }) {
  const [value, setValue] = useState(() => terms.join(', '));
  useEffect(() => {
    setValue(terms.join(', '));
  }, [terms]);
  return (
    <textarea
      className="w-full rounded-xl border border-slate-300 px-3 py-2"
      rows={3}
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        const parsed = event.target.value
          .split(',')
          .map((term) => term.trim())
          .filter(Boolean);
        onChange(parsed);
      }}
      placeholder="Ej. HPO:0001252, HPO:0000518"
    />
  );
}

function AgregarEstudioUpload({ disabled, onUpload }) {
  const inputId = React.useId();
  return (
    <div className="grid gap-1">
      <label
        htmlFor={inputId}
        className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 ${
          disabled
            ? 'cursor-not-allowed border-slate-200 text-slate-400'
            : 'cursor-pointer border-slate-300 hover:bg-slate-50'
        }`}
      >
        <span>➕ Adjuntar resultado</span>
      </label>
      <input
        id={inputId}
        type="file"
        accept="application/pdf,image/*"
        multiple
        disabled={disabled}
        className="hidden"
        onChange={(event) => {
          onUpload?.(event.target.files);
          event.target.value = '';
        }}
      />
      <div className="text-[11px] text-slate-500">
        Los archivos se almacenan como adjuntos del miembro activo.
      </div>
    </div>
  );
}

export default function GeneticsPage({ familyId, inline = false }) {
  const {
    family,
    loading,
    members,
    studies,
    attachments,
    createStudy,
    deleteStudy,
    createAttachment,
    deleteAttachment,
    downloadAttachment,
    getMemberGenetic,
    upsertMemberGenetic,
    getMemberHPO,
    setMemberHPO,
  } = useFamilyGenetics(familyId);

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    if (!members.length) {
      setSelectedMemberId('');
      return;
    }
    if (!selectedMemberId) {
      setSelectedMemberId(members[0].id);
      return;
    }
    if (!members.some((member) => member.id === selectedMemberId)) {
      setSelectedMemberId(members[0]?.id || '');
    }
  }, [members, selectedMemberId]);

  const toggleGroup = useCallback((groupKey) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }, []);

  const activeMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) || null,
    [members, selectedMemberId],
  );

  const filteredStudies = useMemo(() => {
    if (!selectedMemberId) return [];
    return studies.filter((study) => study.memberId === selectedMemberId);
  }, [studies, selectedMemberId]);

  const attachmentsByStudy = useMemo(() => {
    const map = new Map();
    attachments.forEach((attachment) => {
      if (!attachment.studyId) return;
      if (!map.has(attachment.studyId)) map.set(attachment.studyId, []);
      map.get(attachment.studyId).push(attachment);
    });
    return map;
  }, [attachments]);

  const activeGenetics = useMemo(
    () => (activeMember ? getMemberGenetic(activeMember.id) || {} : {}),
    [activeMember, getMemberGenetic],
  );

  const hpoTerms = useMemo(
    () => (activeMember ? getMemberHPO(activeMember.id) || [] : []),
    [activeMember, getMemberHPO],
  );

  const renderGeneticRow = (def) => {
    if (!def || !activeMember) return null;
    return (
      <GeneticRow
        key={def.key}
        label={def.label}
        description={def.description}
        value={activeGenetics[def.key]}
        onTogglePedido={(checked) => {
          void upsertMemberGenetic(activeMember.id, def.key, checked ? { pedido: true } : {
            pedido: false,
            realizado: false,
            resultado: '',
          });
        }}
        onToggleRealizado={(checked) => {
          const base = activeGenetics[def.key] || {};
          void upsertMemberGenetic(activeMember.id, def.key, {
            realizado: checked,
            pedido: checked ? true : base.pedido || false,
            resultado: checked ? (base.resultado || 'Normal') : '',
          });
        }}
        onResultChange={(text) => {
          void upsertMemberGenetic(activeMember.id, def.key, { resultado: text });
        }}
      />
    );
  };

  const handleUploadFiles = useCallback(
    async (files) => {
      if (!activeMember || !family) return;
      const fileList = Array.from(files || []);
      for (const file of fileList) {
        try {
          const today = new Date().toISOString().slice(0, 10);
          const study = await createStudy({
            memberId: activeMember.id,
            tipo: 'GENETIC',
            nombre: file.name,
            fecha: today,
            resultado: '',
          });
          if (study?.id) {
            await createAttachment({
              memberId: activeMember.id,
              studyId: study.id,
              category: 'STUDY_RESULT',
              description: file.name,
              file,
            });
          }
        } catch (error) {
          console.error('No se pudo adjuntar el resultado genético', error);
        }
      }
    },
    [activeMember, family, createStudy, createAttachment],
  );

  const handleDeleteStudy = useCallback(
    async (studyId) => {
      const related = attachments.filter((attachment) => attachment.studyId === studyId);
      try {
        await deleteStudy(studyId);
        await Promise.all(related.map((attachment) => deleteAttachment(attachment.id)));
      } catch (error) {
        console.error('No se pudo eliminar el estudio genético', error);
      }
    },
    [attachments, deleteStudy, deleteAttachment],
  );

  const handleDownloadAttachment = useCallback(
    async (attachment) => {
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
        console.error('No se pudo descargar el adjunto', error);
      }
    },
    [downloadAttachment],
  );

  if (!family) {
    if (loading) {
      return inline
        ? null
        : (
          <div className="p-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">Cargando familia...</div>
          </div>
        );
    }
    return inline
      ? null
      : (
        <div className="p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">No se encontró la familia solicitada.</div>
        </div>
      );
  }

  const goBack = () => {
    if (family?.id) {
      window.location.hash = `#/family/${family.id}`;
    } else {
      window.location.hash = '#/family/';
    }
  };

  const studiesHeaderMember = selectedMemberId
    ? ` · ${(activeMember?.filiatorios?.iniciales || activeMember?.rol || 'Miembro')}`
    : '';

  return (
    <div className={inline ? '' : 'app-shell p-6 grid gap-4'}>
      {!inline && (
        <div className="mb-3 flex items-center justify-between text-white">
          <button
            type="button"
            onClick={goBack}
            className="px-3 py-2 rounded-xl border border-white/40 text-white hover:bg-white/10 transition"
          >
            ← Volver
          </button>
          <h2 className="text-lg font-semibold text-white">HC {family.code} · Estudios genéticos</h2>
          <div />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 grid gap-4">
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold">Órdenes genéticas</div>
            {!activeMember ? (
              <div className="text-sm text-slate-500">Seleccioná un integrante en el panel lateral.</div>
            ) : (
              <div className="grid gap-2">
                {GENETIC_BLOCKS.map((block) => {
                  if (block.type === 'group') {
                    const defs = GENETIC_GROUP_ITEMS[block.key] || [];
                    const meta = GENETIC_GROUP_META[block.key];
                    const open = Boolean(expandedGroups[block.key]);
                    const requestedCount = defs.reduce(
                      (acc, def) => acc + (activeGenetics[def.key]?.pedido ? 1 : 0),
                      0,
                    );
                    const helperText = meta?.description || `${defs.length} estudios disponibles`;
                    const summaryText = requestedCount
                      ? `${requestedCount}/${defs.length} seleccionados`
                      : '';
                    return (
                      <div key={block.key} className="rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => toggleGroup(block.key)}
                          aria-expanded={open}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900">
                              {meta?.label || block.key}
                            </span>
                            <span className="text-xs text-slate-500">{helperText}</span>
                            {summaryText ? (
                              <span className="text-[11px] text-slate-500">{summaryText}</span>
                            ) : null}
                          </div>
                          <span
                            aria-hidden="true"
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-500 transition-transform duration-150 ${
                              open ? 'rotate-90' : ''
                            }`}
                          >
                            ▸
                          </span>
                        </button>
                        {open && (
                          <div className="border-t border-slate-100 bg-slate-50 p-3 md:px-4">
                            <div className="grid gap-2">
                              {defs.map((def) => renderGeneticRow(def))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  const def = GENETIC_DEFS_BY_KEY[block.key];
                  return renderGeneticRow(def);
                })}
              </div>
            )}
          </div>

          {(activeGenetics.exoma?.pedido || activeGenetics.genoma?.pedido) && activeMember && (
            <div className="grid gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
              <div className="text-sm font-semibold">Términos HPO (requeridos para exoma/genoma)</div>
              <HPOEditor terms={hpoTerms} onChange={(terms) => void setMemberHPO(activeMember.id, terms)} />
            </div>
          )}

          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold">
              Estudios genéticos cargados{studiesHeaderMember}
            </div>
            <div className="grid gap-2">
              {filteredStudies.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500">
                  No hay estudios genéticos registrados para este miembro.
                </div>
              )}
              {filteredStudies.map((study) => {
                const member = members.find((item) => item.id === study.memberId) || null;
                const relatedAttachments = attachmentsByStudy.get(study.id) || [];
                const memberLabel = member
                  ? `${member.filiatorios?.iniciales || member.rol || '—'} · ${member.nombre || '—'}`
                  : 'Familia';
                const theme = themeForStudyType(study.tipo);
                return (
                  <article
                    key={study.id}
                    className={`relative overflow-hidden rounded-2xl border ${theme.border} bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 ${theme.accentBar}`} aria-hidden="true" />
                    <div className="grid gap-3 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid gap-1 text-sm">
                          <span
                            className={`inline-flex items-center gap-1 self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${theme.badgeBg} ${theme.badgeText}`}
                          >
                            {study.tipo || 'Estudio'}
                          </span>
                          <div className="text-base font-semibold text-slate-900">
                            {study.nombre || '—'}
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                            <span>Fecha: {fmtDate(study.fecha)}</span>
                            <span>Paciente: {memberLabel}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDeleteStudy(study.id)}
                          className="rounded-full border border-transparent p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                          title="Eliminar estudio"
                          aria-label="Eliminar estudio"
                        >
                          <span aria-hidden="true">🗑</span>
                        </button>
                      </div>

                      {study.resultado && (
                        <div
                          className={`rounded-xl px-3 py-2 text-sm leading-relaxed text-slate-700 ${theme.accentSoft}`}
                        >
                          {study.resultado}
                        </div>
                      )}

                      {relatedAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {relatedAttachments.map((attachment) => (
                            <button
                              key={attachment.id}
                              type="button"
                              onClick={() => void handleDownloadAttachment(attachment)}
                              className={`inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1.5 text-xs font-medium transition hover:bg-slate-50 ${theme.chipBorder} ${theme.chipText}`}
                            >
                              {attachment.fileName || attachment.description || 'Adjunto'}
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

        <aside className="grid h-fit gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold">Miembros</div>
          <div className="grid gap-2">
            {members.map((member) => {
              const isActive = selectedMemberId === member.id;
              const buttonClass = [
                'text-left px-3 py-2 rounded-xl border transition-colors',
                isActive ? 'border-slate-900 bg-slate-900/10' : 'border-slate-300 hover:bg-slate-50',
              ].join(' ');
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedMemberId(member.id)}
                  className={buttonClass}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <b>{member.filiatorios?.iniciales || member.rol || '—'}</b> · {member.nombre || '—'}
                    </div>
                    <span className="text-xs opacity-80">{yearsSince(member.nacimiento)}</span>
                  </div>
                  <div className="text-xs text-slate-600">OS: {member.os || '—'}</div>
                </button>
              );
            })}
            {members.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500">
                No hay miembros registrados para esta familia.
              </div>
            )}
          </div>

          <AgregarEstudioUpload disabled={!selectedMemberId} onUpload={handleUploadFiles} />
        </aside>
      </div>

      {!inline && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2">
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50 shadow-sm"
            >
              ↩ Volver a HC
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
