// ===============================
// src/store/cenagemStore.js — Bridge entre frontend y API oficial
// ===============================
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cenagemApi } from '@/lib/apiClient';

export const STORAGE_KEY = 'cenagem-api-v1';

const EMPTY_STATE = {
  families: [],
  members: [],
  evolutions: [],
  studies: [],
  attachments: [],
  genetics: [],
  photos: [],
};

export const STATUS_FROM_API = {
  SCHEDULED: 'Pendiente',
  IN_ROOM: 'En sala',
  COMPLETED: 'Atendido',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Ausente',
};

export const STATUS_TO_API = {
  Pendiente: 'SCHEDULED',
  'En sala': 'IN_ROOM',
  Atendido: 'COMPLETED',
  Cancelado: 'CANCELLED',
  Ausente: 'NO_SHOW',
};

const SEX_FROM_API = {
  FEMALE: 'F',
  F: 'F',
  MALE: 'M',
  M: 'M',
  NON_BINARY: 'X',
  NONBINARY: 'X',
  NB: 'X',
  X: 'X',
  UNSPECIFIED: 'U',
  UNKNOWN: 'U',
  U: 'U',
};

const SEX_TO_API = {
  F: 'FEMALE',
  FEMALE: 'FEMALE',
  M: 'MALE',
  MALE: 'MALE',
  X: 'NON_BINARY',
  NB: 'NON_BINARY',
  NON_BINARY: 'NON_BINARY',
  NONBINARY: 'NON_BINARY',
  U: 'UNSPECIFIED',
  UNSPECIFIED: 'UNSPECIFIED',
};

const normalizeSexKey = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().toUpperCase().replace(/[\s-]+/g, '_');
};

const mapSexFromApi = (value) => {
  const normalized = normalizeSexKey(value);
  if (!normalized) return '';
  return SEX_FROM_API[normalized] || normalized;
};

const mapSexToApi = (value) => {
  if (value == null) return undefined;
  const normalized = normalizeSexKey(String(value));
  if (!normalized) return undefined;
  return SEX_TO_API[normalized] || undefined;
};

const timeToClock = (iso) => {
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatISODate = (iso) => {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const mapFamily = (detail) => ({
  id: detail.id,
  code: detail.code,
  status: detail.status,
  displayName: detail.displayName || '',
  provincia: detail.province || '',
  ciudad: detail.city || '',
  address: detail.address || '',
  tags: detail.tags || [],
  motivo: detail.motive || null,
  motivoNotas: detail.motive?.notes || '',
  motivoPaciente: detail.motivePatient || '',
  motivoDerivacion: detail.motiveDerivation || '',
  motivoNarrativa: detail.motiveNarrative || '',
  filiatoriosContacto: detail.contactInfo || {},
  consanguinidad: detail.consanguinity || {},
  antecedentesObstetricos: detail.obstetricHistory || null,
  abuelos: detail.grandparents || {},
  intake: detail.intake || {},
  metadata: detail.metadata || {},
  createdAt: detail.createdAt,
  updatedAt: detail.updatedAt,
  membersPreview: Array.isArray(detail.membersPreview)
    ? detail.membersPreview.map((member) => ({
        id: member.id,
        rol: member.role || '',
        initials: member.initials || '',
        nombreCompleto: member.displayName || '',
        documento: member.documentNumber || '',
      }))
    : [],
  medicoAsignado:
    detail.metadata?.medicoAsignado ||
    detail.intake?.administrativo?.medicoAsignado ||
    '',
});

const mapMember = (member) => {
  const nombreCompleto = [member.givenName, member.middleName, member.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  const rawNotes = member.notes;
  const notesArray =
    Array.isArray(rawNotes)
      ? rawNotes
      : Array.isArray(rawNotes?.items)
        ? rawNotes.items
        : Array.isArray(rawNotes?.list)
          ? rawNotes.list
          : [];

  return {
    id: member.id,
    familyId: member.familyId,
    rol: member.role || member.relationship || '',
    relationship: member.relationship || '',
    filiatorios: {
      iniciales: member.initials || '',
      nombreCompleto: nombreCompleto || undefined,
    },
    nombre: member.givenName || '',
    apellido: member.lastName || '',
    sexo: mapSexFromApi(member.sex),
    nacimiento: member.birthDate ? formatISODate(member.birthDate) : '',
    diagnostico: member.diagnosis || '',
    resumen: member.summary || '',
    contacto: member.contacto || {},
    antecedentes: member.antecedentes || {},
    metadata: member.metadata || {},
    notas: notesArray,
    os: member.metadata?.os || member.os || '',
    estado: member.metadata?.estado || '',
  };
};

const mapEvolution = (evolution) => ({
  id: evolution.id,
  familyId: evolution.familyId,
  memberId: evolution.memberId,
  texto: evolution.note,
  author: evolution.authorName || evolution.authorEmail || 'sin autor',
  at: evolution.recordedAt,
});

const mapStudy = (study) => ({
  id: study.id,
  familyId: study.familyId,
  memberId: study.memberId,
  tipo: study.type || 'OTRO',
  estado: study.status || 'REQUESTED',
  nombre: study.name || '',
  descripcion: study.description || '',
  fecha: study.requestedAt ? formatISODate(study.requestedAt) : null,
  resultadoFecha: study.resultAt ? formatISODate(study.resultAt) : null,
  resultado: study.notes || '',
  metadata: study.metadata || {},
  createdAt: study.createdAt,
});

const mapAttachment = (attachment) => ({
  id: attachment.id,
  familyId: attachment.familyId,
  memberId: attachment.memberId,
  studyId: attachment.studyId,
  fileName: attachment.fileName,
  contentType: attachment.contentType,
  size: attachment.size,
  category: attachment.category,
  description: attachment.description || '',
  tags: attachment.tags || [],
  base64Data: attachment.base64Data || null,
  metadata: attachment.metadata || {},
  createdAt: attachment.createdAt,
});

const mapAppointment = (appointment) => ({
  id: appointment.id,
  familyId: appointment.familyId,
  memberId: appointment.memberId,
  date: formatISODate(appointment.scheduledFor),
  time: timeToClock(appointment.scheduledFor),
  seat: appointment.seatNumber || null,
  motivo: appointment.motive || '',
  notas: appointment.notes || '',
  estado: STATUS_FROM_API[appointment.status] || 'Pendiente',
  metadata: appointment.metadata || {},
});

const upsertFamily = (families, family) => {
  const exists = families.some((item) => item.id === family.id);
  if (exists) {
    return families.map((item) => (item.id === family.id ? family : item));
  }
  return [family, ...families];
};

const replaceForFamily = (collection, familyId, nextItems) => {
  const filtered = collection.filter((item) => item.familyId !== familyId);
  return [...filtered, ...nextItems];
};

const toFamilyPayload = (data) => ({
  code: data.code,
  displayName: data.displayName || data.nombreVisible || undefined,
  status: data.status,
  province: data.provincia,
  city: data.ciudad,
  address: data.address || data.direccion,
  tags: data.tags,
  motive:
    data.motivo && (data.motivo.groupId || data.motivo.detailId || data.motivo.groupLabel)
      ? {
          groupId: data.motivo.groupId,
          groupLabel: data.motivo.groupLabel,
          detailId: data.motivo.detailId,
          detailLabel: data.motivo.detailLabel,
          motiveNotes: data.motivoNotas || data.motivo?.notes,
        }
      : undefined,
  motiveNarrative: data.motivoNarrativa,
  motivePatient: data.motivoPaciente,
  motiveDerivation: data.motivoDerivacion,
  contactInfo: data.filiatoriosContacto,
  consanguinity: data.consanguinidad,
  obstetricHistory: data.antecedentesObstetricos,
  grandparents: data.abuelos,
  intake: data.intake,
  metadata: {
    ...(data.metadata || {}),
    medicoAsignado: data.medicoAsignado,
    createdBy: data.createdBy,
  },
});

const toMemberPayload = (member, patchOnly = false) => {
  const notesSource = member.notas ?? member.notes;
  const sex = mapSexToApi(member.sexo ?? member.sex);

  const payload = {
    role: member.rol ?? member.role,
    relationship: member.relationship,
    initials: member.filiatorios?.iniciales || member.initials,
    givenName: member.nombre ?? member.givenName,
    middleName: member.segundoNombre || member.middleName,
    lastName: member.apellido ?? member.lastName,
    birthDate: member.nacimiento || member.birthDate || null,
    sex,
    diagnosis: member.diagnostico ?? member.diagnosis,
    summary: member.resumen ?? member.summary,
    contacto: member.contacto,
    filiatorios: member.filiatorios,
    antecedentes: member.antecedentes,
    metadata: {
      ...(member.metadata || {}),
      os: member.os,
      estado: member.estado,
    },
  };

  if (Array.isArray(notesSource)) {
    payload.notes = { items: notesSource };
  } else if (notesSource && typeof notesSource === 'object') {
    payload.notes = notesSource;
  }

  if (patchOnly) {
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
  }

  return payload;
};

const toStudyPayload = (study) => ({
  memberId: study.memberId,
  type: study.tipo || study.type || 'OTHER',
  status: study.estado || study.status || 'REQUESTED',
  name: study.nombre || study.name || '',
  description: study.descripcion || '',
  requestedAt: study.fecha ? new Date(`${study.fecha}T12:00:00.000Z`).toISOString() : null,
  resultAt: study.resultadoFecha
    ? new Date(`${study.resultadoFecha}T12:00:00.000Z`).toISOString()
    : null,
  notes: study.resultado || '',
  metadata: study.metadata || {},
});

const toAttachmentPayload = async (attachment) => {
  if (attachment.base64Data) {
    return attachment;
  }
  if (!attachment.file) {
    return attachment;
  }
  const base64Data = await fileToBase64(attachment.file);
  return {
    ...attachment,
    fileName: attachment.file.name,
    contentType: attachment.file.type,
    size: attachment.file.size,
    base64Data,
  };
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64 = result.split(',').pop() || '';
        resolve(base64);
      } else {
        resolve('');
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

export function useCenagemStore() {
  const [state, setState] = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const applyFamilyDetail = useCallback((detail) => {
    const family = mapFamily(detail);
    const members = (detail.members || []).map(mapMember);
    const evolutions = (detail.evolutions || []).map(mapEvolution);
    const studies = (detail.studies || []).map(mapStudy);
    const attachments = (detail.attachments || []).map(mapAttachment);

    setState((prev) => ({
      ...prev,
      families: upsertFamily(prev.families, family),
      members: replaceForFamily(prev.members, family.id, members),
      evolutions: replaceForFamily(prev.evolutions, family.id, evolutions),
      studies: replaceForFamily(prev.studies, family.id, studies),
      attachments: replaceForFamily(prev.attachments, family.id, attachments),
    }));
  }, []);

  const refreshFamilies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cenagemApi.listFamilies({ limit: 100 });
      const collection = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      if (!collection.length) {
        setState(EMPTY_STATE);
        setLoading(false);
        return;
      }
      const details = await Promise.all(
        collection.map(async (family) => cenagemApi.getFamily(family.id)),
      );
      details.forEach(applyFamilyDetail);
    } catch (err) {
      console.error('Error al sincronizar familias', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [applyFamilyDetail]);

  const ensureFamilyDetail = useCallback(
    async (familyId, force = false) => {
      if (!familyId) return null;
      if (!force) {
        const exists = state.families.some((family) => family.id === familyId);
        if (exists) return state.families.find((family) => family.id === familyId) || null;
      }
      const detail = await cenagemApi.getFamily(familyId);
      applyFamilyDetail(detail);
      return detail;
    },
    [applyFamilyDetail, state.families],
  );

  useEffect(() => {
    void refreshFamilies();
  }, [refreshFamilies]);

  const createFamily = useCallback(
    async (data) => {
      const payload = toFamilyPayload(data);
      const created = await cenagemApi.createFamily(payload);
      applyFamilyDetail(created);
      return mapFamily(created);
    },
    [applyFamilyDetail],
  );

  const updateFamily = useCallback(
    async (familyId, patch) => {
      const payload = toFamilyPayload({ ...patch, code: patch.code });
      const updated = await cenagemApi.updateFamily(familyId, payload);
      applyFamilyDetail(updated);
      return mapFamily(updated);
    },
    [applyFamilyDetail],
  );

  const createMember = useCallback(
    async (familyId, input) => {
      const payload = toMemberPayload({ ...input, familyId });
      await cenagemApi.createFamilyMember(familyId, payload);
      const detail = await cenagemApi.getFamily(familyId);
      applyFamilyDetail(detail);
      return detail.members.map(mapMember).find((member) => member.familyId === familyId);
    },
    [applyFamilyDetail],
  );

  const updateMember = useCallback(
    async (memberId, patch) => {
      const member = state.members.find((item) => item.id === memberId);
      if (!member) return null;
      const payload = toMemberPayload({ ...member, ...patch }, true);
      await cenagemApi.updateFamilyMember(member.familyId, memberId, payload);
      const detail = await cenagemApi.getFamily(member.familyId);
      applyFamilyDetail(detail);
      return detail.members.map(mapMember).find((item) => item.id === memberId) || null;
    },
    [applyFamilyDetail, state.members],
  );

  const deleteMember = useCallback(
    async (memberId) => {
      const member = state.members.find((item) => item.id === memberId);
      if (!member) return;
      await cenagemApi.deleteFamilyMember(member.familyId, memberId);
      setState((prev) => ({
        ...prev,
        members: prev.members.filter((item) => item.id !== memberId),
        evolutions: prev.evolutions.filter((item) => item.memberId !== memberId),
        studies: prev.studies.filter((item) => item.memberId !== memberId),
        attachments: prev.attachments.filter((item) => item.memberId !== memberId),
      }));
      await ensureFamilyDetail(member.familyId, true);
    },
    [state.members, ensureFamilyDetail],
  );

  const addEvolution = useCallback(
    async (memberId, note, author) => {
      const member = state.members.find((item) => item.id === memberId);
      if (!member) return null;
      await cenagemApi.createEvolution(member.familyId, memberId, {
        note,
        authorName: author,
      });
      const detail = await cenagemApi.getFamily(member.familyId);
      applyFamilyDetail(detail);
      const evolutions = (detail.evolutions || []).map(mapEvolution);
      return evolutions.find((item) => item.memberId === memberId) || null;
    },
    [applyFamilyDetail, state.members],
  );
  const listMembers = useCallback(
    (familyId) => state.members.filter((member) => member.familyId === familyId),
    [state.members],
  );

  const listEvolutions = useCallback(
    (familyId) => state.evolutions.filter((item) => item.familyId === familyId),
    [state.evolutions],
  );

  const listStudiesByFamily = useCallback(
    async (familyId) => {
      await ensureFamilyDetail(familyId, true);
      return state.studies.filter((study) => study.familyId === familyId);
    },
    [ensureFamilyDetail, state.studies],
  );

  const createStudy = useCallback(async (familyId, input) => {
    const payload = toStudyPayload({ ...input, familyId });
    const created = await cenagemApi.createFamilyStudy(familyId, payload);
    const mapped = mapStudy(created);
    setState((prev) => ({
      ...prev,
      studies: [mapped, ...prev.studies.filter((study) => study.id !== mapped.id)],
    }));
    return mapped;
  }, []);

  const deleteStudy = useCallback(
    async (familyId, studyId) => {
      await cenagemApi.deleteStudy(studyId);
      setState((prev) => ({
        ...prev,
        studies: prev.studies.filter((study) => study.id !== studyId),
      }));
      await ensureFamilyDetail(familyId, true);
    },
    [ensureFamilyDetail],
  );

  const listAttachmentsByFamily = useCallback(
    async (familyId) => {
      const response = await cenagemApi.listFamilyAttachments(familyId);
      const collection = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      const mapped = collection.map(mapAttachment);
      setState((prev) => ({
        ...prev,
        attachments: replaceForFamily(prev.attachments, familyId, mapped),
      }));
      return mapped;
    },
    [],
  );

  const createAttachment = useCallback(
    async (familyId, input) => {
      const prepared = await toAttachmentPayload(input);
      const payload = {
        memberId: prepared.memberId,
        category: prepared.category || 'PHOTO',
        fileName: prepared.fileName,
        contentType: prepared.contentType,
        base64Data: prepared.base64Data,
        description: prepared.description,
        tags: prepared.tags,
        metadata: prepared.metadata,
      };
      const created = await cenagemApi.createFamilyAttachment(familyId, payload);
      const mapped = mapAttachment(created);
      setState((prev) => ({
        ...prev,
        attachments: replaceForFamily(prev.attachments, familyId, [
          mapped,
          ...prev.attachments.filter(
            (item) => item.familyId === familyId && item.id !== mapped.id,
          ),
        ]),
      }));
      return mapped;
    },
    [],
  );

  const deleteAttachment = useCallback(
    async (familyId, attachmentId) => {
      await cenagemApi.deleteAttachment(attachmentId);
      setState((prev) => ({
        ...prev,
        attachments: prev.attachments.filter((item) => item.id !== attachmentId),
      }));
      await ensureFamilyDetail(familyId, true);
    },
    [ensureFamilyDetail],
  );

  const downloadAttachment = useCallback((attachmentId) => {
    return cenagemApi.downloadAttachment(attachmentId);
  }, []);

  const storeState = useMemo(
    () => ({
      ...state,
      loading,
      error,
    }),
    [state, loading, error],
  );

  return {
    state: storeState,
    loading,
    error,
    families: state.families,
    members: state.members,
    evolutions: state.evolutions,
    studies: state.studies,
    attachments: state.attachments,
    refreshFamilies,
    ensureFamilyDetail,
    listMembers,
    listEvolutions,
    createFamily,
    updateFamily,
    createMember,
    updateMember,
    addEvolution,
    listStudiesByFamily,
    createStudy,
    deleteStudy,
    listAttachmentsByFamily,
    createAttachment,
    deleteAttachment,
    downloadAttachment,
    STATUS_FROM_API,
    STATUS_TO_API,
    mapAppointment,
    STORAGE_KEY,
  };
}
