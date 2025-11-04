// ===============================
// src/store/cenagemStore.js — Bridge entre frontend y API oficial
// ===============================
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cenagemApi } from '@/lib/apiClient';

export const STORAGE_KEY = 'cenagem-api-v1';

const FAMILY_DETAIL_KEY = 'family-detail';

const queryKeys = {
  families: () => ['families'],
  familyDetail: (familyId) => [FAMILY_DETAIL_KEY, familyId],
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
  createdAt: evolution.createdAt,
  updatedAt: evolution.updatedAt,
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

const normalizeApiCollection = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const mapFamilyDetailFromApi = (detail) => ({
  family: mapFamily(detail),
  members: (detail.members || []).map(mapMember),
  evolutions: (detail.evolutions || []).map(mapEvolution),
  studies: (detail.studies || []).map(mapStudy),
  attachments: (detail.attachments || []).map(mapAttachment),
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
  const queryClient = useQueryClient();
  const [globalError, setGlobalError] = useState(null);
  const [cacheVersion, bumpCacheVersion] = useReducer((count) => count + 1, 0);

  

  const fetchFamilies = useCallback(async () => {
    const response = await cenagemApi.listFamilies({ limit: 100 });
    const collection = normalizeApiCollection(response);
    return collection.map(mapFamily);
  }, []);

  const {
    data: families = [],
    refetch: refetchFamilies,
    isFetching: isFetchingFamilies,
    isLoading: isLoadingFamilies,
    error: familiesError,
  } = useQuery({
    queryKey: queryKeys.families(),
    queryFn: fetchFamilies,
    staleTime: 60_000,
  });

  const detailEntries = useMemo(() => {
    if (cacheVersion < 0) {
      return [];
    }
    return queryClient
      .getQueriesData({ queryKey: [FAMILY_DETAIL_KEY] })
      .map(([, value]) => value)
      .filter(Boolean);
  }, [queryClient, cacheVersion]);

  const members = useMemo(
    () => detailEntries.flatMap((detail) => detail.members || []),
    [detailEntries],
  );
  const evolutions = useMemo(
    () => detailEntries.flatMap((detail) => detail.evolutions || []),
    [detailEntries],
  );
  const studies = useMemo(
    () => detailEntries.flatMap((detail) => detail.studies || []),
    [detailEntries],
  );
  const attachments = useMemo(
    () => detailEntries.flatMap((detail) => detail.attachments || []),
    [detailEntries],
  );

  const loading = isLoadingFamilies || isFetchingFamilies;
  const error = globalError || familiesError || null;

  const applyFamilyDetail = useCallback(
    (detail) => {
      const mapped = mapFamilyDetailFromApi(detail);
      queryClient.setQueryData(queryKeys.familyDetail(mapped.family.id), mapped);
      queryClient.setQueryData(queryKeys.families(), (prev = []) => upsertFamily(prev, mapped.family));
      return mapped;
    },
    [queryClient],
  );

  const refreshFamilies = useCallback(async () => {
    setGlobalError(null);
    const { data } = await refetchFamilies({ throwOnError: true });
    return data ?? [];
  }, [refetchFamilies]);

  const ensureFamilyDetail = useCallback(
    async (familyId, force = false) => {
      if (!familyId) return null;
      setGlobalError(null);
      if (!force) {
        const cached = queryClient.getQueryData(queryKeys.familyDetail(familyId));
        if (cached) return cached;
      }
      try {
        const detail = await cenagemApi.getFamily(familyId);
        return applyFamilyDetail(detail);
      } catch (err) {
        setGlobalError(err);
        throw err;
      }
    },
    [applyFamilyDetail, queryClient],
  );

  const createFamily = useCallback(
    async (data) => {
      setGlobalError(null);
      const payload = toFamilyPayload(data);
      try {
        const created = await cenagemApi.createFamily(payload);
        const mapped = applyFamilyDetail(created);
        return mapped.family;
      } catch (err) {
        setGlobalError(err);
        throw err;
      }
    },
    [applyFamilyDetail],
  );

  const updateFamily = useCallback(
    async (familyId, patch) => {
      setGlobalError(null);
      const payload = toFamilyPayload({ ...patch, code: patch.code });
      try {
        await cenagemApi.updateFamily(familyId, payload);
        const detail = await cenagemApi.getFamily(familyId);
        const mapped = applyFamilyDetail(detail);
        return mapped.family;
      } catch (err) {
        setGlobalError(err);
        throw err;
      }
    },
    [applyFamilyDetail],
  );

  const createMember = useCallback(
    async (familyId, input) => {
      setGlobalError(null);
      const payload = toMemberPayload({ ...input, familyId });
      try {
        const created = await cenagemApi.createFamilyMember(familyId, payload);
        const detail = await cenagemApi.getFamily(familyId);
        const mapped = applyFamilyDetail(detail);
        return mapped.members.find((member) => member.id === created.id) || mapMember(created);
      } catch (err) {
        setGlobalError(err);
        throw err;
      }
    },
    [applyFamilyDetail],
  );

  const updateMember = useCallback(
    async (memberId, patch) => {
      const existing = members.find((item) => item.id === memberId);
      if (!existing) return null;
      setGlobalError(null);
      const payload = toMemberPayload({ ...existing, ...patch }, true);
      try {
        await cenagemApi.updateFamilyMember(existing.familyId, memberId, payload);
        const detail = await cenagemApi.getFamily(existing.familyId);
        const mapped = applyFamilyDetail(detail);
        return mapped.members.find((item) => item.id === memberId) || null;
      } catch (err) {
        setGlobalError(err);
        throw err;
      }
    },
    [applyFamilyDetail, members],
  );

  const deleteMember = useCallback(
    async (memberId) => {
      const existing = members.find((item) => item.id === memberId);
      if (!existing) return;
      setGlobalError(null);
      try {
        await cenagemApi.deleteFamilyMember(existing.familyId, memberId);
        const detail = await cenagemApi.getFamily(existing.familyId);
        applyFamilyDetail(detail);
      } catch (err) {
        setGlobalError(err);
        throw err;
      }
    },
    [applyFamilyDetail, members],
  );

  const addEvolution = useCallback(
    async (memberId, note, author) => {
      const existing = members.find((item) => item.id === memberId);
      if (!existing) return null;
      setGlobalError(null);
      try {
        await cenagemApi.createEvolution(existing.familyId, memberId, {
          note,
          authorName: author,
        });
        const detail = await cenagemApi.getFamily(existing.familyId);
        const mapped = applyFamilyDetail(detail);
        return mapped.evolutions.find((item) => item.memberId === memberId) || null;
      } catch (err) {
        setGlobalError(err);
        throw err;
      }
    },
    [applyFamilyDetail, members],
  );

  const listMembers = useCallback(
    (familyId) => {
      const detail = queryClient.getQueryData(queryKeys.familyDetail(familyId));
      return detail?.members || [];
    },
    [queryClient],
  );

  const listEvolutions = useCallback(
    (familyId) => {
      const detail = queryClient.getQueryData(queryKeys.familyDetail(familyId));
      return detail?.evolutions || [];
    },
    [queryClient],
  );

  const listStudiesByFamily = useCallback(
    async (familyId) => {
      const detail = await ensureFamilyDetail(familyId, true);
      return detail?.studies || [];
    },
    [ensureFamilyDetail],
  );

  const createStudy = useCallback(
    async (familyId, input) => {
      setGlobalError(null);
      const payload = toStudyPayload({ ...input, familyId });
      try {
        const created = await cenagemApi.createFamilyStudy(familyId, payload);
        const detail = await cenagemApi.getFamily(familyId);
        const mapped = applyFamilyDetail(detail);
        return mapped.studies.find((item) => item.id === created.id) || mapStudy(created);
      } catch (err) {
        setGlobalError(err);
        throw err;
      }
    },
    [applyFamilyDetail],
  );

  const deleteStudy = useCallback(
    async (familyId, studyId) => {
      setGlobalError(null);
      try {
        await cenagemApi.deleteStudy(studyId);
        const detail = await cenagemApi.getFamily(familyId);
        applyFamilyDetail(detail);
      } catch (err) {
        setGlobalError(err);
        throw err;
      }
    },
    [applyFamilyDetail],
  );

  const listAttachmentsByFamily = useCallback(
    async (familyId) => {
      setGlobalError(null);
      try {
        const response = await cenagemApi.listFamilyAttachments(familyId);
        const mapped = normalizeApiCollection(response).map(mapAttachment);
        const detail = await ensureFamilyDetail(familyId);
        if (detail) {
          queryClient.setQueryData(queryKeys.familyDetail(familyId), {
            ...detail,
            attachments: mapped,
          });
        }
        return mapped;
      } catch (err) {
        setGlobalError(err);
        throw err;
      }
    },
    [ensureFamilyDetail, queryClient],
  );

  const createAttachment = useCallback(
    async (familyId, input) => {
      setGlobalError(null);
      try {
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
        const detail = await cenagemApi.getFamily(familyId);
        const mapped = applyFamilyDetail(detail);
        return mapped.attachments.find((item) => item.id === created.id) || mapAttachment(created);
      } catch (err) {
        setGlobalError(err);
        throw err;
      }
    },
    [applyFamilyDetail],
  );

  const deleteAttachment = useCallback(
    async (familyId, attachmentId) => {
      setGlobalError(null);
      try {
        await cenagemApi.deleteAttachment(attachmentId);
        const detail = await cenagemApi.getFamily(familyId);
        applyFamilyDetail(detail);
      } catch (err) {
        setGlobalError(err);
        throw err;
      }
    },
    [applyFamilyDetail],
  );

  const downloadAttachment = useCallback(
    (attachmentId) => cenagemApi.downloadAttachment(attachmentId),
    [],
  );

  const storeState = useMemo(
    () => ({
      families,
      members,
      evolutions,
      studies,
      attachments,
      loading,
      error,
    }),
    [families, members, evolutions, studies, attachments, loading, error],
  );

  return {
    state: storeState,
    loading,
    error,
    families,
    members,
    evolutions,
    studies,
    attachments,
    refreshFamilies,
    ensureFamilyDetail,
    listMembers,
    listEvolutions,
    createFamily,
    updateFamily,
    createMember,
    updateMember,
    deleteMember,
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
