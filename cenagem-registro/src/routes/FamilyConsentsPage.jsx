import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCenagemStore } from '@/store/cenagemStore';

const CONSENT_TAGS = ['consent', 'consentimiento', 'consentimientos'];

const isPlainObject = (value) =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const formatDateTime = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toLowerCaseArray = (input) => {
  if (!Array.isArray(input)) return [];
  return input
    .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
    .filter(Boolean);
};

const isConsentAttachment = (attachment) => {
  if (!attachment) return false;
  const tags = toLowerCaseArray(attachment.tags);
  if (tags.some((tag) => CONSENT_TAGS.includes(tag))) return true;

  const metadata = isPlainObject(attachment.metadata) ? attachment.metadata : {};
  const metadataHints = [
    metadata.kind,
    metadata.type,
    metadata.category,
    metadata.tag,
  ]
    .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
    .filter(Boolean);
  if (metadataHints.some((hint) => CONSENT_TAGS.includes(hint))) return true;

  const text = `${attachment.description || ''} ${attachment.fileName || ''}`.toLowerCase();
  return CONSENT_TAGS.some((hint) => text.includes(hint));
};

const memberLabel = (member) => {
  if (!member) return 'Alcance familiar';
  const parts = [];
  if (member.filiatorios?.iniciales) parts.push(member.filiatorios.iniciales);
  if (member.nombre) parts.push(member.nombre);
  if (!parts.length && member.rol) parts.push(member.rol);
  return parts.join(' · ') || 'Integrante';
};

export default function FamilyConsentsPage({ familyId, inline = false }) {
  const {
    state,
    ensureFamilyDetail,
    listAttachmentsByFamily,
    createAttachment,
    deleteAttachment,
    downloadAttachment,
  } = useCenagemStore();

  const [filterMemberId, setFilterMemberId] = useState('all');
  const [uploadMemberId, setUploadMemberId] = useState('family');
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (familyId) {
      void ensureFamilyDetail(familyId, true);
    }
  }, [familyId, ensureFamilyDetail]);

  useEffect(() => {
    if (!familyId) return;
    void listAttachmentsByFamily(familyId);
  }, [familyId, listAttachmentsByFamily]);

  const members = useMemo(
    () => state.members.filter((member) => member.familyId === familyId),
    [state.members, familyId],
  );
  const memberById = useMemo(() => {
    const map = new Map();
    members.forEach((member) => map.set(member.id, member));
    return map;
  }, [members]);

  const attachments = useMemo(
    () => state.attachments.filter((attachment) => attachment.familyId === familyId),
    [state.attachments, familyId],
  );

  const consentAttachments = useMemo(
    () => attachments.filter((attachment) => isConsentAttachment(attachment)),
    [attachments],
  );

  const visibleConsents = useMemo(() => {
    const filtered = consentAttachments.filter((attachment) => {
      if (filterMemberId === 'all') return true;
      if (filterMemberId === 'family') return !attachment.memberId;
      return attachment.memberId === filterMemberId;
    });
    return filtered.sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [consentAttachments, filterMemberId]);

  const resetFeedbackLater = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.setTimeout(() => setFeedback(null), 2500);
  }, []);

  const handleUpload = useCallback(
    async (event) => {
      const files = Array.from(event.target.files || []);
      event.target.value = '';
      if (!files.length || !familyId) return;
      setUploading(true);
      setFeedback(null);
      try {
        for (const file of files) {
          await createAttachment(familyId, {
            memberId: uploadMemberId === 'family' ? undefined : uploadMemberId,
            category: 'DOCUMENT',
            description: file.name,
            tags: [CONSENT_TAGS[0]],
            metadata: { kind: 'consent', source: 'family-consents' },
            file,
          });
        }
        setFeedback({
          type: 'success',
          message: files.length === 1
            ? 'Consentimiento cargado correctamente.'
            : `${files.length} consentimientos cargados correctamente.`,
        });
        resetFeedbackLater();
        await listAttachmentsByFamily(familyId);
      } catch (error) {
        console.error('No se pudo subir el consentimiento', error);
        setFeedback({
          type: 'error',
          message: 'No se pudieron subir algunos archivos. Intentá nuevamente.',
        });
      } finally {
        setUploading(false);
      }
    },
    [createAttachment, familyId, uploadMemberId, listAttachmentsByFamily, resetFeedbackLater],
  );

  const handleDownload = useCallback(
    async (attachment) => {
      try {
        const blob = await downloadAttachment(attachment.id);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.fileName || attachment.description || 'consentimiento';
        document.body.appendChild(link);
        link.click();
        window.setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(link);
        }, 0);
      } catch (error) {
        console.error('No se pudo descargar el consentimiento', error);
        setFeedback({
          type: 'error',
          message: 'No se pudo descargar el archivo.',
        });
        resetFeedbackLater();
      }
    },
    [downloadAttachment, resetFeedbackLater],
  );

  const handleDelete = useCallback(
    async (attachment) => {
      if (!familyId) return;
      const confirmed =
        typeof window === 'undefined'
          ? true
          : window.confirm('¿Eliminar este consentimiento definitivamente?');
      if (!confirmed) return;
      try {
        await deleteAttachment(familyId, attachment.id);
      } catch (error) {
        console.error('No se pudo eliminar el consentimiento', error);
        setFeedback({
          type: 'error',
          message: 'No se pudo eliminar el archivo.',
        });
        resetFeedbackLater();
      }
    },
    [deleteAttachment, familyId, resetFeedbackLater],
  );

  const containerClass = inline ? 'space-y-4' : 'p-6 space-y-4';

  return (
    <div className={containerClass}>
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Consentimientos informados</div>
            <p className="text-xs text-slate-500">
              Adjuntá los consentimientos firmados o descargá los que ya están cargados en la HC.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex flex-col text-xs text-slate-500 gap-1">
              Asignar a
              <select
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
                value={uploadMemberId}
                onChange={(event) => setUploadMemberId(event.target.value)}
              >
                <option value="family">Toda la familia</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {memberLabel(member)}
                  </option>
                ))}
              </select>
            </label>
            <label
              className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold ${
                uploading
                  ? 'cursor-not-allowed border border-slate-300 bg-slate-200 text-slate-500'
                  : 'cursor-pointer border border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {uploading ? 'Subiendo…' : 'Adjuntar archivos'}
              <input
                type="file"
                className="hidden"
                accept=".pdf,image/*"
                multiple
                disabled={uploading || !familyId}
                onChange={handleUpload}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-xs text-slate-500">
            Mostrar
            <select
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700"
              value={filterMemberId}
              onChange={(event) => setFilterMemberId(event.target.value)}
            >
              <option value="all">Todos los registros</option>
              <option value="family">Solo consentimientos familiares</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {memberLabel(member)}
                </option>
              ))}
            </select>
          </label>
          {feedback && (
            <div
              className={`text-xs font-medium ${
                feedback.type === 'error' ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {feedback.message}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50">
          {visibleConsents.length ? (
            <ul className="divide-y divide-slate-200">
              {visibleConsents.map((attachment) => {
                const member = attachment.memberId ? memberById.get(attachment.memberId) : null;
                const scopeLabel = member ? memberLabel(member) : 'Toda la familia';
                return (
                  <li
                    key={attachment.id}
                    className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900">
                        {attachment.description || attachment.fileName || 'Consentimiento'}
                      </div>
                      <div className="text-xs text-slate-500 leading-snug">
                        {scopeLabel} · Subido {formatDateTime(attachment.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownload(attachment)}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white"
                      >
                        Descargar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(attachment)}
                        className="inline-flex items-center justify-center rounded-xl border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-6 text-sm text-slate-500">
              No hay consentimientos cargados todavía. Podés adjuntar los formularios firmados para
              dejarlos disponibles en la HC de la familia.
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

