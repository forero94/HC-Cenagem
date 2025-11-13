// ===============================
// src/modules/home/agenda.js — Utilidades y constantes de agenda
// ===============================

import { MOTIVO_CONSULTA_GROUPS } from '@/lib/motivosConsulta.js';

export const AGENDA_STORAGE_KEY = 'cenagem-agenda-v1';
export const DEFAULT_SERVICE = 'clinica';

export const WEEKDAYS = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export const SERVICE_CONFIG = {
  clinica: {
    defaultCapacity: 3,
    overbookFallbackTime: '13:00',
    weeklySchedule: {
      [WEEKDAYS.MONDAY]: [
        { time: '08:00', capacity: 3, optional: true },
        { time: '09:00', capacity: 3 },
        { time: '10:00', capacity: 3 },
        { time: '11:00', capacity: 3 },
        { time: '12:00', capacity: 3, note: 'Entrega de resultados' },
      ],
      [WEEKDAYS.TUESDAY]: [
        { time: '08:00', capacity: 3, optional: true },
        { time: '09:00', capacity: 3 },
        { time: '10:00', capacity: 3 },
        { time: '11:00', capacity: 3 },
        { time: '12:00', capacity: 3, note: 'Entrega de resultados' },
      ],
      [WEEKDAYS.THURSDAY]: [
        { time: '08:00', capacity: 3, optional: true },
        { time: '09:00', capacity: 3 },
        { time: '10:00', capacity: 3 },
        { time: '11:00', capacity: 3 },
        { time: '12:00', capacity: 3, note: 'Entrega de resultados' },
      ],
      [WEEKDAYS.FRIDAY]: [
        { time: '08:00', capacity: 3, optional: true },
        { time: '09:00', capacity: 3 },
        { time: '10:00', capacity: 3 },
        { time: '11:00', capacity: 3 },
        { time: '12:00', capacity: 3, note: 'Entrega de resultados' },
      ],
    },
  },
  psicologia: {
    defaultCapacity: 1,
    weeklySchedule: {
      [WEEKDAYS.MONDAY]: [
        { time: '09:00', optional: true },
        { time: '10:00' },
        { time: '10:30' },
        { time: '11:00' },
        { time: '11:30' },
      ],
      [WEEKDAYS.WEDNESDAY]: [
        { time: '09:00', optional: true },
        { time: '10:00' },
        { time: '10:30' },
        { time: '11:00' },
        { time: '11:30' },
      ],
      [WEEKDAYS.FRIDAY]: [
        { time: '09:00', optional: true },
        { time: '10:00' },
        { time: '10:30' },
        { time: '11:00' },
        { time: '11:30' },
      ],
    },
  },
  'test-del-sudor': {
    defaultCapacity: 1,
    overbookFallbackTime: '12:00',
    maxDailyOverbook: 3,
    weeklySchedule: {
      [WEEKDAYS.TUESDAY]: [
        { time: '09:00' },
        { time: '09:30' },
        { time: '10:00' },
        { time: '10:30' },
        { time: '11:00' },
      ],
      [WEEKDAYS.WEDNESDAY]: [
        { time: '09:00' },
        { time: '09:30' },
        { time: '10:00' },
        { time: '10:30' },
        { time: '11:00' },
      ],
      [WEEKDAYS.THURSDAY]: [
        { time: '09:00' },
        { time: '09:30' },
        { time: '10:00' },
        { time: '10:30' },
        { time: '11:00' },
      ],
    },
  },
  ecografia: {
    defaultCapacity: 1,
    weeklySchedule: {
      [WEEKDAYS.MONDAY]: [
        { time: '09:30' },
        { time: '10:30' },
        { time: '11:30' },
      ],
      [WEEKDAYS.THURSDAY]: [
        { time: '09:30' },
        { time: '10:30' },
        { time: '11:30' },
      ],
    },
  },
  prenatal: {
    defaultCapacity: 1,
    weeklySchedule: {
      [WEEKDAYS.TUESDAY]: [
        { time: '09:30' },
        { time: '10:00' },
        { time: '11:30' },
      ],
    },
  },
  laboratorio: {
    defaultCapacity: 15,
    weeklySchedule: {
      [WEEKDAYS.MONDAY]: [
        { time: '09:00' },
        { time: '09:30' },
        { time: '10:00' },
        { time: '10:30' },
        { time: '11:00' },
        { time: '11:30' },
        { time: '12:00' },
      ],
      [WEEKDAYS.WEDNESDAY]: [
        { time: '09:00' },
        { time: '09:30' },
        { time: '10:00' },
        { time: '10:30' },
        { time: '11:00' },
        { time: '11:30' },
        { time: '12:00' },
      ],
      [WEEKDAYS.FRIDAY]: [
        { time: '09:00' },
        { time: '09:30' },
        { time: '10:00' },
        { time: '10:30' },
        { time: '11:00' },
        { time: '11:30' },
        { time: '12:00' },
      ],
    },
  },
};

const normalizeServiceKey = (service) => {
  if (typeof service === 'string') {
    const trimmed = service.trim().toLowerCase();
    if (trimmed) return trimmed;
  }
  return DEFAULT_SERVICE;
};

export function getServiceConfig(service = DEFAULT_SERVICE) {
  const key = normalizeServiceKey(service);
  return SERVICE_CONFIG[key] || SERVICE_CONFIG[DEFAULT_SERVICE];
}

export function getAllScheduledTimes(service = DEFAULT_SERVICE) {
  const config = getServiceConfig(service);
  const times = new Set();
  const weeklySchedule = config.weeklySchedule || {};
  Object.values(weeklySchedule).forEach((entries) => {
    entries.forEach((entry) => {
      const time = typeof entry === 'string' ? entry : entry?.time;
      if (time) times.add(time);
    });
  });
  return Array.from(times).sort((a, b) => a.localeCompare(b));
}

export function getScheduleForWeekday(weekday, service = DEFAULT_SERVICE) {
  const config = getServiceConfig(service);
  const normalizedWeekday = Number.isFinite(weekday) ? weekday : Number(weekday);
  const entries = config.weeklySchedule?.[normalizedWeekday] || [];
  return entries
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === 'string') {
        return { time: entry, capacity: config.defaultCapacity ?? 1 };
      }
      if (!entry.time) return null;
      const capacity = Number.isFinite(entry.capacity) ? entry.capacity : config.defaultCapacity ?? 1;
      const { time, capacity: _ignored, ...rest } = entry;
      return { time, capacity, ...rest };
    })
    .filter(Boolean);
}

export function getDailyCapacityForWeekday(weekday, service = DEFAULT_SERVICE) {
  return getScheduleForWeekday(weekday, service).reduce(
    (sum, item) => sum + (Number.isFinite(item?.capacity) ? item.capacity : 0),
    0,
  );
}

export function getMaxDailyCapacity(service = DEFAULT_SERVICE) {
  const config = getServiceConfig(service);
  const weeklySchedule = config.weeklySchedule || {};
  return Object.keys(weeklySchedule).reduce((max, key) => {
    const weekday = Number(key);
    const capacity = getDailyCapacityForWeekday(weekday, service);
    return capacity > max ? capacity : max;
  }, 0);
}

export function getOverbookFallbackTime(service = DEFAULT_SERVICE) {
  const fallback = getServiceConfig(service).overbookFallbackTime;
  return typeof fallback === 'string' && fallback.trim() ? fallback.trim() : null;
}

export function getMaxDailyOverbook(service = DEFAULT_SERVICE) {
  const value = getServiceConfig(service).maxDailyOverbook;
  return Number.isFinite(value) && value > 0 ? value : null;
}

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    return ['true', '1', 'si', 'sí', 'yes', 'y'].includes(normalized);
  }
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
};

export const APPOINTMENT_STATUS_COLORS = {
  Pendiente: 'bg-amber-100 text-amber-700',
  'En sala': 'bg-blue-100 text-blue-700',
  Atendido: 'bg-emerald-100 text-emerald-700',
  Ausente: 'bg-rose-100 text-rose-700',
};

export function getStatusBadgeColor(status) {
  return APPOINTMENT_STATUS_COLORS[status] || 'bg-slate-200 text-slate-600';
}

function capitalizeFirst(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildSeatOption(dateObj, isoDate, time, seatIndex, capacity) {
  const seat = seatIndex + 1;
  const seatSuffix = capacity > 1 ? ` · Consultorio ${seat}` : '';
  const longLabel = `${capitalizeFirst(
    dateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' }),
  )} · ${time} hs${seatSuffix}`;
  const shortLabel = `${time} hs${seatSuffix}`;
  return {
    id: `${isoDate}@${time}#${seat}`,
    date: isoDate,
    time,
    seat,
    capacity,
    label: longLabel,
    shortLabel,
  };
}

export function formatISODateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatFriendlyDate(isoDate) {
  if (!isoDate) return '';
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return isoDate;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function buildOverbookSlotsForDate(dateObj, appointments = [], service = DEFAULT_SERVICE) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return [];
  const isoDate = formatISODateLocal(dateObj);
  const slots = [];
  const fallbackTime = getOverbookFallbackTime(service);
  const maxDailyOverbook = getMaxDailyOverbook(service);
  const existingOverbooks = appointments.filter((item) => item.sobreturno).length;
  const hasLimit = Number.isFinite(maxDailyOverbook);
  let remainingOverbooks = hasLimit ? Math.max(maxDailyOverbook - existingOverbooks, 0) : Number.POSITIVE_INFINITY;

  if (fallbackTime) {
    while (remainingOverbooks > 0) {
      const fallbackCount = appointments.filter((item) => item.time === fallbackTime).length + (slots.length);
      const fallbackSeat = buildSeatOption(dateObj, isoDate, fallbackTime, fallbackCount, 1);
      slots.push({
        ...fallbackSeat,
        label: `${fallbackSeat.label} · Sobreturno`,
        shortLabel: `${fallbackSeat.time} hs · Sobreturno`,
        overbook: true,
      });
      remainingOverbooks--;
    }
  }

  return slots;
}

export function addDays(baseDate, amount) {
  const copy = new Date(baseDate);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

export function collectNextAvailableSlots(agenda = [], { fromDate, limit, service = DEFAULT_SERVICE } = {}) {
  const normalizedService = normalizeServiceKey(service);
  const slots = [];
  let cursor = fromDate ? new Date(fromDate) : new Date();
  if (Number.isNaN(cursor.getTime())) cursor = new Date();
  const seenIds = new Set(
    (Array.isArray(agenda) ? agenda : [])
      .filter((item) => normalizeServiceKey(item?.service || DEFAULT_SERVICE) === normalizedService)
      .map((item) => item.id),
  );
  const maxDailyCapacity = getMaxDailyCapacity(normalizedService) || 0;
  const fallbackLimit = Math.max(maxDailyCapacity, 12);
  const parsedLimit = Number(limit);
  const effectiveLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : fallbackLimit;

  let safety = 0;
  while (slots.length < effectiveLimit && safety < 365) {
    const isoDate = formatISODateLocal(cursor);
    const schedule = getScheduleForWeekday(cursor.getDay(), normalizedService);
    const appointmentsForDay = (Array.isArray(agenda) ? agenda : []).filter(
      (item) => item.date === isoDate && normalizeServiceKey(item?.service || DEFAULT_SERVICE) === normalizedService,
    );
    const countsByTime = appointmentsForDay.reduce((acc, item) => {
      acc[item.time] = (acc[item.time] || 0) + 1;
      return acc;
    }, {});

    for (const { time, capacity } of schedule) {
      const used = countsByTime[time] || 0;
      if (used < capacity) {
        const slot = buildSeatOption(cursor, isoDate, time, used, capacity);
        if (!seenIds.has(slot.id)) {
          slots.push(slot);
          if (slots.length >= effectiveLimit) break;
        }
      }
    }

    cursor = addDays(cursor, 1);
    safety += 1;
  }

  return slots;
}

const ensureDate = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== 'string') return null;

  const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})/;
  const match = value.match(isoDateRegex);

  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const extractServiceData = (serviceData, serviceDetails) => {
  if (serviceData && typeof serviceData === 'object') return serviceData;
  if (serviceDetails && typeof serviceDetails === 'object') {
    if (serviceDetails.data && typeof serviceDetails.data === 'object') {
      return serviceDetails.data;
    }
    return serviceDetails;
  }
  return {};
};

const isWeekday = (weekday) =>
  weekday === WEEKDAYS.MONDAY
  || weekday === WEEKDAYS.TUESDAY
  || weekday === WEEKDAYS.WEDNESDAY
  || weekday === WEEKDAYS.THURSDAY
  || weekday === WEEKDAYS.FRIDAY;

export function validateServiceDateConstraints({
  service = DEFAULT_SERVICE,
  date,
  time,
  serviceData,
  serviceDetails,
  sobreturno = false,
} = {}) {
  const normalizedService = normalizeServiceKey(service);
  const dateObj = ensureDate(date);
  if (!dateObj) return null;
  const weekday = dateObj.getDay();
  const data = extractServiceData(serviceData, serviceDetails);
  const scheduleForDay = getScheduleForWeekday(weekday, normalizedService);
  const fallbackTime = getOverbookFallbackTime(normalizedService);
  const normalizedTime = typeof time === 'string' ? time.slice(0, 5) : null;
  const skipGeneralValidation =
    normalizedService === 'laboratorio' && (toBoolean(data?.urgente) || sobreturno);

  if (!skipGeneralValidation) {
    if (!scheduleForDay.length) {
      return 'No hay turnos disponibles para este servicio en la fecha seleccionada.';
    }
    if (
      normalizedTime
      && !scheduleForDay.some((slot) => slot.time === normalizedTime)
      && normalizedTime !== fallbackTime
    ) {
      return 'El horario seleccionado no forma parte de la agenda para este servicio.';
    }
  }

  if (normalizedService === 'clinica') {
    const isPregnant = toBoolean(data?.embarazada);
    if (isPregnant && ![WEEKDAYS.MONDAY, WEEKDAYS.THURSDAY].includes(weekday)) {
      return 'Las consultas de pacientes embarazadas se agendan los días lunes o jueves (programá el turno desde Ecografía).';
    }
  }

  if (normalizedService === 'laboratorio') {
    if (!isWeekday(weekday)) {
      return 'Los turnos de laboratorio se gestionan de lunes a viernes.';
    }
    const tiposSeleccionados =
      data?.tiposSeleccionados && typeof data.tiposSeleccionados === 'object' ? data.tiposSeleccionados : {};
    const modalidadRaw = typeof data?.modalidad === 'string' ? data.modalidad.toLowerCase().trim() : '';
    const modalidad = modalidadRaw || 'extraccion';
    const urgente = toBoolean(data?.urgente);

    if (urgente || sobreturno) {
      return null;
    }

    if (toBoolean(tiposSeleccionados.oncohemato)) {
      return null;
    }

    const requiereMolecular =
      toBoolean(tiposSeleccionados.molecular)
      || toBoolean(tiposSeleccionados.experimental)
      || toBoolean(tiposSeleccionados.adn);

    if (modalidad === 'recepcion') {
      if (requiereMolecular && weekday !== WEEKDAYS.WEDNESDAY) {
        return 'Las muestras moleculares, de cáncer o fibrosis quística se reciben únicamente los miércoles.';
      }
      if (toBoolean(tiposSeleccionados.citogenetica) && ![WEEKDAYS.MONDAY, WEEKDAYS.FRIDAY].includes(weekday)) {
        return 'Las muestras citogenéticas se reciben los días lunes y viernes.';
      }
      if (
        !requiereMolecular
        && !toBoolean(tiposSeleccionados.citogenetica)
        && !toBoolean(tiposSeleccionados.oncohemato)
        && ![WEEKDAYS.MONDAY, WEEKDAYS.WEDNESDAY, WEEKDAYS.FRIDAY].includes(weekday)
      ) {
        return 'La recepción de muestras se realiza los días lunes, miércoles y viernes.';
      }
    } else if (![WEEKDAYS.MONDAY, WEEKDAYS.WEDNESDAY, WEEKDAYS.FRIDAY].includes(weekday)) {
      return 'Las extracciones de laboratorio se realizan los días lunes, miércoles y viernes.';
    }
  }

  return null;
}

export function getMemberDisplayName(member) {
  if (!member) return 'Paciente sin nombre';
  return (
    member.filiatorios?.nombreCompleto ||
    member.nombre ||
    member.filiatorios?.iniciales ||
    member.rol ||
    'Paciente'
  );
}

export function seedAgendaFromMembers(members = [], service = DEFAULT_SERVICE) {
  const normalizedService = normalizeServiceKey(service);
  const today = new Date();
  const todayIso = formatISODateLocal(today);
  let schedule = getScheduleForWeekday(today.getDay(), normalizedService);
  if (!schedule.length) {
    for (let offset = 1; offset <= 7 && !schedule.length; offset += 1) {
      const candidate = addDays(today, offset);
      schedule = getScheduleForWeekday(candidate.getDay(), normalizedService);
    }
  }

  let slots = schedule.flatMap(({ time, capacity }) => {
    const safeCapacity = Number.isFinite(capacity) && capacity > 0 ? capacity : 1;
    return Array.from({ length: safeCapacity }, () => time);
  });

  if (!slots.length) {
    const allTimes = getAllScheduledTimes(normalizedService);
    const defaultCapacity = getServiceConfig(normalizedService).defaultCapacity || 1;
    slots = allTimes.flatMap((time) => Array.from({ length: defaultCapacity }, () => time));
  }

  if (!slots.length) {
    slots = ['08:00'];
  }

  return members
    .filter((m) => m.rol === 'Proband')
    .slice(0, slots.length)
    .map((member, index) => ({
      id: `seed-${member.id}-${index}`,
      memberId: member.id,
      familyId: member.familyId,
      date: todayIso,
      time: slots[index] || slots[slots.length - 1] || '08:00',
      motivo: member.diagnostico || 'Consulta de seguimiento',
      notas: '',
      estado: 'Pendiente',
    }));
}

export function normalizeFamilyCodeInput(value) {
  if (!value) return '';
  let cleaned = value.trim().toUpperCase();
  if (!cleaned) return '';
  cleaned = cleaned.replace(/^HC\s*/i, '');
  if (cleaned.startsWith('AG-')) {
    const digits = cleaned.slice(3).replace(/\D/g, '');
    return digits ? `AG-${digits.padStart(4, '0')}` : '';
  }
  if (cleaned.startsWith('FAM-')) {
    const digits = cleaned.slice(4).replace(/\D/g, '');
    return digits ? `FAM-${digits.padStart(4, '0')}` : '';
  }
  const digits = cleaned.replace(/\D/g, '');
  if (!digits) return '';
  return `AG-${digits.padStart(4, '0')}`;
}

export function buildWeeklyAgendaData(agenda = [], weeksCount = 52, service = DEFAULT_SERVICE) {
  const normalizedService = normalizeServiceKey(service);
  const today = new Date();
  const startOfWeek = (date) => {
    const copy = new Date(date);
    const day = copy.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    copy.setDate(copy.getDate() + diff);
    return copy;
  };

  const weeks = [];
  let cursor = startOfWeek(today);

  for (let i = 0; i < weeksCount; i += 1) {
    const start = addDays(cursor, 7 * i);
    const end = addDays(start, 6);
    const days = [];
    for (let d = 0; d < 7; d += 1) {
      const dayDate = addDays(start, d);
      const isoDate = formatISODateLocal(dayDate);
      const dayAppointments = (Array.isArray(agenda) ? agenda : [])
        .filter(
          (item) =>
            item.date === isoDate
            && normalizeServiceKey(item?.service || DEFAULT_SERVICE) === normalizedService,
        )
        .slice()
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

      const scheduleForDay = getScheduleForWeekday(dayDate.getDay(), normalizedService);
      const dailyCapacity = scheduleForDay.reduce(
        (total, slot) => total + (Number.isFinite(slot.capacity) ? slot.capacity : 0),
        0,
      );
      const futureSlots = collectNextAvailableSlots(
        agenda,
        {
          fromDate: isoDate,
          limit: dailyCapacity || getMaxDailyCapacity(normalizedService) || 12,
          service: normalizedService,
        },
      ).filter((slot) => slot.date === isoDate);

      days.push({
        date: dayDate,
        isoDate,
        label: dayDate.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }),
        isToday: formatISODateLocal(today) === isoDate,
        isPast: dayDate < today && formatISODateLocal(dayDate) !== formatISODateLocal(today),
        appointments: dayAppointments,
        futureSlots,
      });
    }

    const availableCount = days.reduce((acc, day) => acc + day.futureSlots.length, 0);

    weeks.push({
      start,
      end,
      startLabel: start.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
      endLabel: end.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
      availableCount,
      days,
    });
  }

  return weeks;
}

const toCleanString = (value) => {
  if (value == null) return '';
  return String(value).trim();
};

const stripDiacritics = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizeComparable = (value) => stripDiacritics(value).toLowerCase();

export function normalizeMotivoGroupId(value) {
  const candidate = toCleanString(value);
  if (!candidate) return '';
  const directMatch = MOTIVO_CONSULTA_GROUPS.find((group) => group.id === candidate);
  if (directMatch) return directMatch.id;
  const comparable = normalizeComparable(candidate);
  const labelMatch = MOTIVO_CONSULTA_GROUPS.find(
    (group) => normalizeComparable(group.label) === comparable,
  );
  if (labelMatch) return labelMatch.id;
  return '';
}

export function getMotivoGroupLabel(groupId) {
  const resolvedId = normalizeMotivoGroupId(groupId);
  if (!resolvedId) return '';
  const group = MOTIVO_CONSULTA_GROUPS.find((item) => item.id === resolvedId);
  return group?.label || '';
}

export function normalizePrimeraConsultaInfo(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const nombre = toCleanString(raw.nombre);
  const apellido = toCleanString(raw.apellido);
  const motivoGroupCandidate = toCleanString(raw.motivoGroup) || toCleanString(raw.motivoGroupLabel);
  const motivoGroup = normalizeMotivoGroupId(motivoGroupCandidate);
  const edadNumber = Number(raw.edad);
  const edad = Number.isFinite(edadNumber) && edadNumber > 0 ? Math.round(edadNumber) : null;
  const motivoGroupLabelRaw = toCleanString(raw.motivoGroupLabel);
  const motivoGroupLabel = motivoGroupLabelRaw || getMotivoGroupLabel(motivoGroup);
  return {
    nombre,
    apellido,
    edad,
    motivoGroup,
    motivoGroupLabel,
  };
}

export function getWeekOfYear(date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000);
}
