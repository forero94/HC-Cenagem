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
  { key: 'Cariotipo', label: 'Cariotipo' },
  { key: 'arrayCGH', label: 'array-CGH' },
  { key: 'panelNGS', label: 'Panel NGS' },
  { key: 'exoma', label: 'Exoma clínico' },
  { key: 'genoma', label: 'Genoma completo' },
  { key: 'mlpa', label: 'MLPA / Del-Dup' },
  { key: 'brcaHrr', label: 'BRCA / HRR' },
  { key: 'fragileX', label: 'X Frágil (FMR1)' },
];

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

function GeneticRow({ label, value, onTogglePedido, onToggleRealizado, onResultChange }) {
  const { pedido = false, realizado = false, resultado = '' } = value || {};
  return (
    <div className="grid items-center gap-2 md:grid-cols-12">
      <label className="md:col-span-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(pedido)}
          onChange={(event) => onTogglePedido(event.target.checked)}
        />
        <span className="text-sm">{label}</span>
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

  const handleUploadFiles = useCallback(
    async (files) => {
      if (!activeMember || !family) return;
      const fileList = Array.from(files || []);
      for (const file of fileList) {
        try {
          const today = new Date().toISOString().slice(0, 10);
          const study = await createStudy({
            memberId: activeMember.id,
            tipo: 'Genético',
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
    <div className={inline ? '' : 'p-6 grid gap-4'}>
      {!inline && (
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
          >
            ← Volver
          </button>
          <h2 className="text-lg font-semibold">HC {family.code} · Estudios genéticos</h2>
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
                {GENETIC_DEFS.map((def) => (
                  <GeneticRow
                    key={def.key}
                    label={def.label}
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
                ))}
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
                return (
                  <div
                    key={study.id}
                    className="flex items-start justify-between rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <div className="text-sm">
                      <div>
                        <b>{study.tipo}</b> · {study.nombre || '—'}
                      </div>
                      <div className="text-slate-600">
                        {fmtDate(study.fecha)} · {member?.filiatorios?.iniciales || member?.rol || 'familia'}
                        {study.resultado ? ` · ${study.resultado}` : ''}
                      </div>
                      {relatedAttachments.length > 0 && (
                        <div className="mt-2 grid gap-1 text-xs text-slate-600">
                          {relatedAttachments.map((attachment) => (
                            <button
                              key={attachment.id}
                              type="button"
                              onClick={() => void handleDownloadAttachment(attachment)}
                              className="text-left text-blue-600 underline"
                            >
                              Descargar {attachment.fileName || attachment.description || 'adjunto'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteStudy(study.id)}
                      className="rounded-xl border border-slate-300 px-3 py-1.5 hover:bg-red-50"
                      title="Eliminar estudio"
                    >
                      🗑
                    </button>
                  </div>
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
