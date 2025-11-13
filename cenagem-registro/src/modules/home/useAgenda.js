// ===============================
// src/modules/home/useAgenda.js — Hook para administrar la agenda clínica (API)
// ===============================
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cenagemApi } from '@/lib/apiClient';
import { STATUS_TO_API, STATUS_FROM_API } from '@/store/cenagemStore';
import {
  collectNextAvailableSlots,
  formatISODateLocal,
  getMaxDailyCapacity,
  getMotivoGroupLabel,
  normalizeMotivoGroupId,
  normalizePrimeraConsultaInfo,
  validateServiceDateConstraints,
} from './agenda';

const DEFAULT_SERVICE = 'clinica';

const mapAppointmentFromApi = (appointment) => {
  if (!appointment) return null;
  const scheduled = appointment.scheduledFor
    ? new Date(appointment.scheduledFor)
    : null;
  const metadata =
    appointment.metadata && typeof appointment.metadata === 'object' && !Array.isArray(appointment.metadata)
      ? appointment.metadata
      : {};
  const metadataPrimeraInfo = normalizePrimeraConsultaInfo(metadata.primeraConsultaInfo);
  const derivedFamilyId = appointment.familyId
    || metadata?.ingreso?.familyId
    || metadata?.familia?.id
    || null;
  const primeraConsultaFlag =
    typeof appointment.primeraConsulta === 'boolean'
      ? appointment.primeraConsulta
      : Boolean(metadata.primeraConsulta || metadataPrimeraInfo);
  const sobreturnoFlag =
    typeof appointment.sobreturno === 'boolean'
      ? appointment.sobreturno
      : Boolean(metadata.sobreturno);
  const normalizedAppointmentId = appointment?.id != null ? String(appointment.id) : undefined;
  const normalizedFamilyId = derivedFamilyId != null ? String(derivedFamilyId) : null;
  const normalizedMemberId = appointment?.memberId != null ? String(appointment.memberId) : null;
  const service =
    (typeof metadata.service === 'string' && metadata.service.trim()) ||
    (typeof metadata.servicio === 'string' && metadata.servicio.trim()) ||
    DEFAULT_SERVICE;
  const serviceDetails =
    metadata && typeof metadata.serviceDetails === 'object' && metadata.serviceDetails !== null
      ? metadata.serviceDetails
      : null;
  const serviceDetailsData =
    serviceDetails && typeof serviceDetails.data === 'object' && serviceDetails.data !== null
      ? serviceDetails.data
      : null;
  const storedMotivoGroupRaw =
    metadata.primeraMotivoGroup
    || serviceDetailsData?.primeraMotivoGroup
    || metadataPrimeraInfo?.motivoGroup
    || metadataPrimeraInfo?.motivoGroupLabel
    || null;
  const normalizedMotivoGroup = normalizeMotivoGroupId(storedMotivoGroupRaw);
  const storedMotivoGroupLabel =
    metadata.primeraMotivoGroupLabel
    || serviceDetailsData?.primeraMotivoGroupLabel
    || metadataPrimeraInfo?.motivoGroupLabel
    || (normalizedMotivoGroup ? getMotivoGroupLabel(normalizedMotivoGroup) : '');

  return {
    id: normalizedAppointmentId || appointment.id,
    familyId: normalizedFamilyId,
    memberId: normalizedMemberId,
    date: scheduled ? formatISODateLocal(scheduled) : appointment.date,
    time: scheduled
      ? `${String(scheduled.getHours()).padStart(2, '0')}:${String(
          scheduled.getMinutes(),
        ).padStart(2, '0')}`
      : appointment.time,
    seat: appointment.seatNumber || appointment.seat || null,
    motivo: appointment.motive || appointment.motivo || '',
    notas: appointment.notes || appointment.notas || '',
    estado:
      STATUS_FROM_API[appointment.status] ||
      appointment.estado ||
      'Pendiente',
    metadata,
    primeraConsulta: primeraConsultaFlag,
    primeraConsultaInfo: metadataPrimeraInfo,
    primeraMotivoGroup: normalizedMotivoGroup,
    primeraMotivoGroupLabel: storedMotivoGroupLabel,
    sobreturno: sobreturnoFlag,
    service,
    serviceDetails,
  };
};

const toIsoDateTime = (date, time = '08:00') => {
  const base = date || formatISODateLocal(new Date());
  return new Date(`${base}T${time}:00`).toISOString();
};

const normalizeServiceValue = (service) => {
  if (typeof service === 'string') {
    const trimmed = service.trim().toLowerCase();
    if (trimmed) return trimmed;
  }
  return DEFAULT_SERVICE;
};

const buildAppointmentMetadata = (appointment = {}, fallbackService = DEFAULT_SERVICE) => {
  const baseMetadata =
    appointment.metadata && typeof appointment.metadata === 'object' && !Array.isArray(appointment.metadata)
      ? { ...appointment.metadata }
      : {};
  baseMetadata.primeraConsulta = Boolean(appointment.primeraConsulta);
  baseMetadata.sobreturno = Boolean(appointment.sobreturno);

  if (appointment.serviceDetails) {
    baseMetadata.serviceDetails = appointment.serviceDetails;
  } else if (!baseMetadata.serviceDetails && appointment.metadata?.serviceDetails) {
    baseMetadata.serviceDetails = appointment.metadata.serviceDetails;
  }

  const serviceKey = normalizeServiceValue(appointment.service || baseMetadata.service || fallbackService);
  baseMetadata.service = serviceKey;
  baseMetadata.servicio = serviceKey;

  let normalizedInfo = null;
  if (baseMetadata.primeraConsulta && appointment.primeraConsultaInfo) {
    normalizedInfo = normalizePrimeraConsultaInfo({
      ...appointment.primeraConsultaInfo,
      motivoGroupLabel:
        appointment.primeraConsultaInfo.motivoGroupLabel
        || getMotivoGroupLabel(appointment.primeraConsultaInfo.motivoGroup || ''),
    });
    if (normalizedInfo) {
      baseMetadata.primeraConsultaInfo = {
        nombre: normalizedInfo.nombre,
        apellido: normalizedInfo.apellido,
        edad: normalizedInfo.edad,
        motivoGroup: normalizedInfo.motivoGroup,
        motivoGroupLabel: normalizedInfo.motivoGroupLabel,
      };
    }
  }

  const resolvedMotivoGroup = normalizeMotivoGroupId(
    appointment.primeraMotivoGroup
      || normalizedInfo?.motivoGroup
      || appointment.serviceDetails?.data?.primeraMotivoGroup
      || baseMetadata.serviceDetails?.data?.primeraMotivoGroup
      || baseMetadata.primeraMotivoGroup
      || appointment.primeraMotivoGroupLabel
      || normalizedInfo?.motivoGroupLabel
      || baseMetadata.primeraMotivoGroupLabel
      || '',
  );
  const resolvedMotivoGroupLabel =
    appointment.primeraMotivoGroupLabel
    || appointment.serviceDetails?.data?.primeraMotivoGroupLabel
    || normalizedInfo?.motivoGroupLabel
    || baseMetadata.primeraMotivoGroupLabel
    || (resolvedMotivoGroup ? getMotivoGroupLabel(resolvedMotivoGroup) : '');

  if (resolvedMotivoGroup) {
    baseMetadata.primeraMotivoGroup = resolvedMotivoGroup;
    baseMetadata.primeraMotivoGroupLabel = resolvedMotivoGroupLabel;
  }

  return baseMetadata;
};

const buildAppointmentPayload = (appointment, fallbackService = DEFAULT_SERVICE) => {
  const metadata = buildAppointmentMetadata(appointment, fallbackService);
  return {
    memberId: appointment.memberId || null,
    scheduledFor: toIsoDateTime(appointment.date, appointment.time),
    seatNumber: appointment.seat || null,
    motive: appointment.motivo || '',
    notes: appointment.notas || '',
    status: STATUS_TO_API[appointment.estado || 'Pendiente'] || 'SCHEDULED',
    metadata,
  };
};

export function useAgenda({ initialDate, preload = true, initialService = DEFAULT_SERVICE } = {}) {
  const [selectedDate, setSelectedDate] = useState(() => {
    if (initialDate) return initialDate;
    return formatISODateLocal(new Date());
  });

  const normalizedInitialService =
    (typeof initialService === 'string' && initialService.trim().toLowerCase()) ||
    DEFAULT_SERVICE;
  const [service, setService] = useState(normalizedInitialService);
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(preload);
  const [error, setError] = useState(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cenagemApi.listAppointments({ limit: 200 });
      const collection = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      const mapped = collection.map(mapAppointmentFromApi);
      const validAppointments = [];
      const invalidAppointments = [];

      mapped.forEach((item) => {
        const validationError = validateServiceDateConstraints({
          service: item.service || DEFAULT_SERVICE,
          date: item.date,
          time: item.time,
          serviceData: item.serviceDetails?.data,
          serviceDetails: item.serviceDetails,
          sobreturno: item.sobreturno,
        });
        if (validationError) {
          invalidAppointments.push({ appointment: item, reason: validationError });
        } else {
          validAppointments.push(item);
        }
      });

      const acceptedAppointments = [...validAppointments];
      if (invalidAppointments.length) {
        console.warn('[agenda] Turnos fuera de las reglas de agenda detectados', {
          count: invalidAppointments.length,
          details: invalidAppointments.map(({ appointment, reason }) => ({
            id: appointment?.id,
            service: appointment?.service,
            reason,
          })),
        });
        invalidAppointments.forEach(({ appointment, reason }) => {
          if (!appointment) return;
          acceptedAppointments.push({
            ...appointment,
            validationWarning: reason,
          });
        });
      }

      const filtered = service
        ? acceptedAppointments.filter(
            (item) =>
              (item.service || DEFAULT_SERVICE).toLowerCase() === service.toLowerCase(),
          )
        : acceptedAppointments;

      setAgenda(filtered);
    } catch (err) {
      console.error('No se pudo cargar la agenda', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    if (preload) {
      void loadAppointments();
    }
  }, [loadAppointments, preload]);

  const agendaForSelectedDate = useMemo(() => {
    return agenda
      .filter((item) => item.date === selectedDate)
      .slice()
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [agenda, selectedDate]);

  const suggestionLimit = useMemo(() => {
    const capacity = getMaxDailyCapacity(service) || 0;
    return Math.max(capacity, 12);
  }, [service]);

  const nextAvailableSlots = useMemo(
    () => collectNextAvailableSlots(agenda, { fromDate: selectedDate, limit: suggestionLimit, service }),
    [agenda, selectedDate, service, suggestionLimit],
  );

  const addAppointment = useCallback(
    async (appointment) => {
      const payload = buildAppointmentPayload(appointment, service);

      const created = appointment.familyId
        ? await cenagemApi.createFamilyAppointment(appointment.familyId, payload)
        : await cenagemApi.createAppointment({
            ...payload,
            familyId: appointment.familyId ?? undefined,
          });
      const mapped = mapAppointmentFromApi(created);
      setAgenda((prev) => [...prev, mapped]);
      return mapped;
    },
    [service],
  );

  const updateAppointmentDetails = useCallback(
    async (appointment) => {
      if (!appointment?.id) {
        throw new Error('No se puede actualizar un turno sin ID');
      }
      const payload = buildAppointmentPayload(appointment, service);
      const updated = await cenagemApi.updateAppointment(appointment.id, payload);
      if (updated) {
        const mapped = mapAppointmentFromApi(updated);
        setAgenda((prev) =>
          prev.map((item) =>
            item.id === mapped.id
              ? mapped
              : item,
          ),
        );
        return mapped;
      }
      setAgenda((prev) =>
        prev.map((item) => {
          if (item.id !== appointment.id) return item;
          return {
            ...item,
            ...appointment,
            metadata: payload.metadata,
          };
        }),
      );
      return null;
    },
    [service],
  );

  const updateAppointmentStatus = useCallback(
    async (id, status) => {
      const apiStatus = STATUS_TO_API[status] || STATUS_TO_API.Pendiente || 'SCHEDULED';
      await cenagemApi.updateAppointment(id, { status: apiStatus });
      setAgenda((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, estado: status } : item,
        ),
      );
    },
    [],
  );

  const removeAppointment = useCallback(
    async (id) => {
      await cenagemApi.deleteAppointment(id);
      setAgenda((prev) => prev.filter((item) => item.id !== id));
    },
    [],
  );

  const markFamilyAppointmentsAsAttended = useCallback(
    async (familyId, date) => {
      const toUpdate = agenda.filter(
        (item) =>
          item.familyId === familyId &&
          item.date === date &&
          item.estado !== STATUS_FROM_API.COMPLETED,
      );
      await Promise.all(
        toUpdate.map((item) =>
          cenagemApi.updateAppointment(item.id, {
            status: 'COMPLETED',
          }),
        ),
      );
      setAgenda((prev) =>
        prev.map((item) => {
          if (item.familyId === familyId && item.date === date) {
            return { ...item, estado: 'Atendido' };
          }
          return item;
        }),
      );
      return toUpdate.length > 0;
    },
    [agenda],
  );

  const syncAgenda = useCallback(async () => {
    await loadAppointments();
  }, [loadAppointments]);

  const updateService = useCallback((value) => {
    if (typeof value === 'function') {
      setService((prev) => {
        const next = value(prev);
        return (typeof next === 'string' && next.trim().toLowerCase()) || DEFAULT_SERVICE;
      });
      return;
    }
    const normalized =
      (typeof value === 'string' && value.trim().toLowerCase()) || DEFAULT_SERVICE;
    setService(normalized);
  }, []);

  return {
    agenda,
    selectedDate,
    agendaForSelectedDate,
    nextAvailableSlots,
    service,
    loading,
    error,
    setSelectedDate,
    setAgenda,
    setService: updateService,
    addAppointment,
    updateAppointment: updateAppointmentDetails,
    updateAppointmentStatus,
    removeAppointment,
    markFamilyAppointmentsAsAttended,
    syncAgenda,
  };
}
