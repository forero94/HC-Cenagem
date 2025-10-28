// ===============================
// src/modules/home/agenda.js — Utilidades y constantes de agenda
// ===============================

import { MOTIVO_CONSULTA_GROUPS } from '@/lib/motivosConsulta.js';

export const AGENDA_STORAGE_KEY = 'cenagem-agenda-v1';
export const SLOT_CAPACITY = 2;

export const WEEKLY_SCHEDULE = {
  1: ['08:00', '09:00', '10:00', '11:00'], // Lunes (sin cupo a las 12)
  2: ['08:00', '09:00', '10:00', '11:00', '12:00'],
  4: ['08:00', '09:00', '10:00', '11:00', '12:00'],
  5: ['08:00', '09:00', '10:00', '11:00', '12:00'],
};

export const ALL_SCHEDULED_TIMES = Array.from(new Set(Object.values(WEEKLY_SCHEDULE).flat())).sort((a, b) =>
  a.localeCompare(b),
);

export const OVERBOOK_FALLBACK_TIME = '13:00';

export const APPOINTMENT_STATUS_COLORS = {
  Pendiente: 'bg-amber-100 text-amber-700',
  'En sala': 'bg-blue-100 text-blue-700',
  Atendido: 'bg-emerald-100 text-emerald-700',
  Ausente: 'bg-rose-100 text-rose-700',
};

export function getStatusBadgeColor(status) {
  return APPOINTMENT_STATUS_COLORS[status] || 'bg-slate-200 text-slate-600';
}

export function getScheduleForWeekday(weekday) {
  const times = WEEKLY_SCHEDULE[weekday] || [];
  return times.map((time) => ({ time, capacity: SLOT_CAPACITY }));
}

function capitalizeFirst(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildSeatOption(dateObj, isoDate, time, seatIndex, capacity) {
  const seat = seatIndex + 1;
  const seatSuffix = capacity > 1 ? ` · Cupo ${seat}` : '';
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

export function buildOverbookSlotsForDate(dateObj, appointments = []) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return [];
  const isoDate = formatISODateLocal(dateObj);
  const slots = [];
  const schedule = getScheduleForWeekday(dateObj.getDay());

  for (const { time, capacity } of schedule) {
    const usedCount = appointments.filter((item) => item.time === time).length;
    if (usedCount >= capacity) {
      const seatOption = buildSeatOption(dateObj, isoDate, time, usedCount, capacity + 1);
      slots.push({
        ...seatOption,
        label: `${seatOption.label} · Sobreturno`,
        shortLabel: `${seatOption.time} hs · Sobreturno`,
        overbook: true,
      });
    }
  }

  if (OVERBOOK_FALLBACK_TIME) {
    const fallbackCount = appointments.filter((item) => item.time === OVERBOOK_FALLBACK_TIME).length;
    const fallbackSeat = buildSeatOption(dateObj, isoDate, OVERBOOK_FALLBACK_TIME, fallbackCount, 1);
    slots.push({
      ...fallbackSeat,
      label: `${fallbackSeat.label} · Fin del día`,
      shortLabel: `${fallbackSeat.time} hs · Fin del día`,
      overbook: true,
    });
  }

  return slots;
}

export function addDays(baseDate, amount) {
  const copy = new Date(baseDate);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

export function collectNextAvailableSlots(agenda = [], { fromDate, limit = 12 } = {}) {
  const slots = [];
  let cursor = fromDate ? new Date(fromDate) : new Date();
  if (Number.isNaN(cursor.getTime())) cursor = new Date();
  const seenIds = new Set(agenda.map((item) => item.id));

  let safety = 0;
  while (slots.length < limit && safety < 365) {
    const isoDate = formatISODateLocal(cursor);
    const schedule = getScheduleForWeekday(cursor.getDay());
    const appointmentsForDay = agenda.filter((item) => item.date === isoDate);
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
          if (slots.length >= limit) break;
        }
      }
    }

    cursor = addDays(cursor, 1);
    safety += 1;
  }

  return slots;
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

export function seedAgendaFromMembers(members = []) {
  const today = new Date();
  const todayIso = formatISODateLocal(today);
  let schedule = getScheduleForWeekday(today.getDay());
  if (!schedule.length) {
    schedule = getScheduleForWeekday(2); // Martes como fallback
  }

  let slots = schedule.flatMap(({ time, capacity }) => Array.from({ length: capacity }, () => time));

  if (!slots.length) {
    slots = ALL_SCHEDULED_TIMES.flatMap((time) => Array.from({ length: SLOT_CAPACITY }, () => time));
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

export function buildWeeklyAgendaData(agenda = [], weeksCount = 6) {
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
      const dayAppointments = agenda
        .filter((item) => item.date === isoDate)
        .slice()
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

      const futureSlots = collectNextAvailableSlots(
        agenda,
        { fromDate: isoDate, limit: SLOT_CAPACITY * (WEEKLY_SCHEDULE[dayDate.getDay()] || []).length || SLOT_CAPACITY },
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

export function getMotivoGroupLabel(groupId) {
  if (!groupId) return '';
  const group = MOTIVO_CONSULTA_GROUPS.find((item) => item.id === groupId);
  return group?.label || '';
}

export function normalizePrimeraConsultaInfo(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const nombre = (raw.nombre || '').toString().trim();
  const apellido = (raw.apellido || '').toString().trim();
  const motivoGroup = (raw.motivoGroup || '').toString().trim();
  const edadNumber = Number(raw.edad);
  const edad = Number.isFinite(edadNumber) && edadNumber > 0 ? Math.round(edadNumber) : null;
  const motivoGroupLabelRaw = (raw.motivoGroupLabel || '').toString().trim();
  const motivoGroupLabel = motivoGroupLabelRaw || getMotivoGroupLabel(motivoGroup);
  return {
    nombre,
    apellido,
    edad,
    motivoGroup,
    motivoGroupLabel,
  };
}
