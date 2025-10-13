// ===============================
// src/routes/HomePage.jsx — Pantalla de inicio
// ===============================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCenagemStore } from '@/store/cenagemStore';
import NewCaseCreate from '@/components/NewCaseCreate.jsx';
import NewCaseWizard from '@/components/NewCase/NewCaseWizard.jsx';
import { MOTIVO_CONSULTA_GROUPS } from '@/lib/motivosConsulta.js';

const uidLocal = () => Math.random().toString(36).slice(2, 10);
const AGENDA_STORAGE_KEY = 'cenagem-agenda-v1';
const DEFAULT_DAY_SLOTS = ['08:30', '09:30', '11:00', '13:00', '15:00'];
const APPOINTMENT_STATUS_COLORS = {
  Pendiente: 'bg-amber-100 text-amber-700',
  'En sala': 'bg-blue-100 text-blue-700',
  Atendido: 'bg-emerald-100 text-emerald-700',
  Ausente: 'bg-rose-100 text-rose-700',
};

function getStatusBadgeColor(status) {
  return APPOINTMENT_STATUS_COLORS[status] || 'bg-slate-200 text-slate-600';
}

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-1">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint && <div className="text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}

function Header({ title, user, onLogout, onReset }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-xs text-slate-500">Sesión: {user?.email}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onReset} className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50">Restablecer demo</button>
        <button onClick={onLogout} className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50">Salir</button>
      </div>
    </div>
  );
}

function formatFriendlyDate(isoDate) {
  if (!isoDate) return '';
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return isoDate;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatISODateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfWeekMonday(baseDate) {
  const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function addDays(baseDate, amount) {
  const date = new Date(baseDate.getTime());
  date.setDate(date.getDate() + amount);
  return date;
}

function buildWeeklyAgendaData(agenda = [], slots = DEFAULT_DAY_SLOTS, weeksCount = 6) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = formatISODateLocal(today);
  const baseMonday = startOfWeekMonday(today);

  const timesFromAgenda = agenda.map((item) => item.time).filter(Boolean);
  const slotSet = new Set([...slots, ...timesFromAgenda]);
  const sortedSlots = Array.from(slotSet).sort((a, b) => a.localeCompare(b));

  const weeks = [];

  for (let index = 0; index < weeksCount; index += 1) {
    const weekStart = addDays(baseMonday, index * 7);
    const weekEnd = addDays(weekStart, 6);
    const days = [];
    let availableCount = 0;

    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      const dayDate = addDays(weekStart, dayOffset);
      const isoDate = formatISODateLocal(dayDate);
      const appointments = agenda
        .filter((item) => item.date === isoDate)
        .map((item) => ({ ...item }))
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

      const usedSlots = new Set(appointments.map((item) => item.time).filter(Boolean));
      const availableSlots = sortedSlots.filter((slot) => !usedSlots.has(slot));
      const isPast = dayDate.getTime() < today.getTime();
      const futureSlots = isPast ? [] : availableSlots;
      availableCount += futureSlots.length;

      days.push({
        isoDate,
        date: dayDate,
        label: dayDate.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }),
        appointments,
        availableSlots,
        futureSlots,
        isPast,
        isToday: isoDate === todayIso,
      });
    }

    weeks.push({
      startDate: weekStart,
      endDate: weekEnd,
      startLabel: weekStart.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
      endLabel: weekEnd.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
      days,
      availableCount,
    });
  }

  return weeks;
}

function getMemberDisplayName(member) {
  if (!member) return 'Paciente sin nombre';
  return (
    member.filiatorios?.nombreCompleto ||
    member.nombre ||
    member.filiatorios?.iniciales ||
    member.rol ||
    'Paciente'
  );
}

function seedAgendaFromMembers(members = []) {
  const todayIso = formatISODateLocal(new Date());
  const slots = DEFAULT_DAY_SLOTS;
  return members
    .filter((m) => m.rol === 'Proband')
    .slice(0, slots.length)
    .map((member, index) => ({
      id: `seed-${member.id}-${index}`,
      memberId: member.id,
      familyId: member.familyId,
      date: todayIso,
      time: slots[index] || slots[slots.length - 1] || '15:00',
      motivo: member.diagnostico || 'Consulta de seguimiento',
      profesional: index % 2 === 0 ? 'Dra. López' : 'Dr. Sánchez',
      notas: '',
      estado: 'Pendiente'
    }));
}

function normalizeFamilyCodeInput(value) {
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

function AgendaForm({ membersOptions, familiesById, defaultDate, onSubmit, onCancel }) {
  const [memberId, setMemberId] = useState(membersOptions[0]?.id || '');
  const [date, setDate] = useState(defaultDate);
  const defaultTime = DEFAULT_DAY_SLOTS[0] || '09:00';
  const [time, setTime] = useState(defaultTime);
  const [profesional, setProfesional] = useState('');
  const [motivo, setMotivo] = useState(membersOptions[0]?.diagnostico || 'Consulta de seguimiento');
  const [motivoPersonalizado, setMotivoPersonalizado] = useState(false);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (!membersOptions.find((opt) => opt.id === memberId)) {
      setMemberId(membersOptions[0]?.id || '');
    }
  }, [membersOptions, memberId]);

  useEffect(() => {
    const selected = membersOptions.find((opt) => opt.id === memberId);
    if (!motivoPersonalizado) {
      setMotivo(selected?.diagnostico || 'Consulta de seguimiento');
    }
  }, [memberId, membersOptions, motivoPersonalizado]);

  const handleMotivoChange = (value) => {
    setMotivo(value);
    setMotivoPersonalizado(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!memberId) return;

    onSubmit({
      memberId,
      date,
      time,
      profesional: profesional.trim(),
      motivo: motivo.trim(),
      notas: notas.trim()
    });

    setTime(defaultTime);
    setProfesional('');
    setNotas('');
    setMotivoPersonalizado(false);
  };

  const hasMembers = membersOptions.length > 0;

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Paciente
          <select
            value={memberId}
            onChange={(e) => { setMemberId(e.target.value); setMotivoPersonalizado(false); }}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            disabled={!hasMembers}
          >
            {!hasMembers && <option value="">Sin pacientes disponibles</option>}
            {membersOptions.map((opt) => {
              const family = familiesById[opt.familyId];
              const familyLabel = family ? `HC ${family.code}` : 'HC sin código';
              return (
                <option key={opt.id} value={opt.id}>
                  {getMemberDisplayName(opt)} · {familyLabel}
                </option>
              );
            })}
          </select>
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Fecha
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Hora
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Profesional
          <input
            type="text"
            value={profesional}
            onChange={(e) => setProfesional(e.target.value)}
            placeholder="Ej. Dra. González"
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </label>
      </div>
      <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
        Motivo de la consulta
        <input
          type="text"
          value={motivo}
          onChange={(e) => handleMotivoChange(e.target.value)}
          placeholder="Motivo principal"
          className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
        />
      </label>
      <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
        Notas internas
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Recordatorios para el equipo (opcional)"
          className="px-3 py-2 rounded-xl border border-slate-300 text-sm min-h-[80px]"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="px-4 py-2 rounded-xl border border-slate-300 bg-slate-900 text-white text-sm font-medium disabled:opacity-60" disabled={!hasMembers}>
          Guardar turno
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function AgendaList({ items, membersById, familiesById, onStatusChange, onRemove, onOpenFamily }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        No hay turnos para esta fecha. Agendá el próximo paciente para empezar el día.
      </div>
    );
  }

  const statusOptions = ['Pendiente', 'En sala', 'Atendido', 'Ausente'];

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const member = membersById[item.memberId];
        const family = familiesById[item.familyId];
        if (!member || !family) return null;

        const name = getMemberDisplayName(member);
        const statusColor = getStatusBadgeColor(item.estado);

        return (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">{item.time || 'Sin horario'} hs</div>
                <div className="text-base font-semibold text-slate-900">{name}</div>
                <div className="text-[11px] text-slate-500">HC {family.code} · {family.provincia || 'Provincia sin cargar'}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-medium px-2 py-1 rounded-full ${statusColor}`}>{item.estado}</span>
                <select
                  value={item.estado}
                  onChange={(e) => onStatusChange(item.id, e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            {item.motivo && <div className="text-sm text-slate-700">{item.motivo}</div>}
            <div className="text-xs text-slate-500">Profesional: {item.profesional || 'Sin asignar'}</div>
            {item.notas && <div className="text-xs text-slate-500 border-t border-dashed border-slate-200 pt-2">{item.notas}</div>}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => onOpenFamily(item.familyId)} className="text-xs px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-50">
                Abrir HC
              </button>
              <button onClick={() => onRemove(item.id)} className="text-xs px-3 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50">
                Eliminar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TodayAgenda({
  selectedDate,
  onDateChange,
  appointments,
  membersOptions,
  membersById,
  familiesById,
  onCreateAppointment,
  onStatusChange,
  onRemoveAppointment,
  onOpenFamily
}) {
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!adding) return;
    const handler = (event) => {
      if (event.key === 'Escape') setAdding(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [adding]);

  const friendlyDate = formatFriendlyDate(selectedDate);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Agenda del día</div>
          <div className="text-[11px] text-slate-500">Consultas programadas para {friendlyDate || 'la fecha seleccionada'}.</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <button
            onClick={() => setAdding((prev) => !prev)}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm font-medium"
          >
            {adding ? 'Cerrar formulario' : '+ Nuevo turno'}
          </button>
        </div>
      </div>
      {adding && (
        <AgendaForm
          membersOptions={membersOptions}
          familiesById={familiesById}
          defaultDate={selectedDate}
          onSubmit={(values) => {
            onCreateAppointment(values);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}
      <AgendaList
        items={appointments}
        membersById={membersById}
        familiesById={familiesById}
        onStatusChange={onStatusChange}
        onRemove={onRemoveAppointment}
        onOpenFamily={onOpenFamily}
      />
    </div>
  );
}

function WeeklyAgendaBoard({ agenda, membersById, familiesById, selectedDate, onSelectDate }) {
  const weeks = useMemo(() => buildWeeklyAgendaData(agenda), [agenda]);
  const firstAvailableIndex = useMemo(
    () => weeks.findIndex((week) => week.availableCount > 0),
    [weeks],
  );
  const [weekIndex, setWeekIndex] = useState(() => (firstAvailableIndex >= 0 ? firstAvailableIndex : 0));
  const autoSnapRef = useRef(false);

  useEffect(() => {
    if (!autoSnapRef.current && firstAvailableIndex >= 0) {
      setWeekIndex(firstAvailableIndex);
      autoSnapRef.current = true;
    }
  }, [firstAvailableIndex]);

  useEffect(() => {
    const weeksLength = weeks.length;
    if (weeksLength === 0) {
      setWeekIndex(0);
      return;
    }
    if (weekIndex >= weeksLength) {
      setWeekIndex(Math.max(0, weeksLength - 1));
    }
  }, [weeks.length, weekIndex]);

  if (!weeks.length) {
    return null;
  }

  const week = weeks[Math.min(weekIndex, weeks.length - 1)];

  const nextAvailableSlot = useMemo(() => {
    for (const weekItem of weeks) {
      for (const day of weekItem.days) {
        if (day.futureSlots.length > 0) {
          const nextDateLabel = day.date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });
          return {
            date: day.isoDate,
            slot: day.futureSlots[0],
            label: nextDateLabel,
          };
        }
      }
    }
    return null;
  }, [weeks]);

  const handlePrevWeek = () => setWeekIndex((prev) => Math.max(prev - 1, 0));
  const handleNextWeek = () => setWeekIndex((prev) => Math.min(prev + 1, weeks.length - 1));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-semibold text-slate-900">Turnos por semana</div>
          <div className="text-[11px] text-slate-500">
            Semana del {week.startLabel} al {week.endLabel}.{' '}
            {week.availableCount > 0
              ? `${week.availableCount} turnos libres.`
              : 'Sin disponibilidad futura en esta semana.'}
          </div>
          {nextAvailableSlot && (
            <div className="text-[11px] text-emerald-700">
              Próximo turno disponible: {nextAvailableSlot.label} · {nextAvailableSlot.slot} hs
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevWeek}
            disabled={weekIndex === 0}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium hover:bg-slate-50 disabled:opacity-40"
          >
            Semana anterior
          </button>
          <span className="text-xs text-slate-500">
            Semana {weekIndex + 1} / {weeks.length}
          </span>
          <button
            type="button"
            onClick={handleNextWeek}
            disabled={weekIndex >= weeks.length - 1}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium hover:bg-slate-50 disabled:opacity-40"
          >
            Semana siguiente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-3">
        {week.days.map((day) => {
          const enrichedAppointments = day.appointments.map((item) => {
            const member = membersById[item.memberId];
            const family = familiesById[item.familyId];
            return {
              ...item,
              patientName: getMemberDisplayName(member),
              familyCode: family?.code || '—',
            };
          });
          const isSelected = selectedDate === day.isoDate;
          return (
            <div
              key={day.isoDate}
              className={`rounded-2xl border border-slate-200 bg-slate-50/60 p-3 flex flex-col gap-2 ${isSelected ? 'border-slate-900 ring-2 ring-slate-900/20 bg-white' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 capitalize">
                    {day.label}
                  </span>
                  {day.isToday && (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-slate-900 text-white uppercase tracking-wide">
                      Hoy
                    </span>
                  )}
                </div>
                {day.isPast ? (
                  <span className="text-[10px] uppercase tracking-wide text-slate-400">Pasado</span>
                ) : day.futureSlots.length > 0 ? (
                  <span className="text-[10px] uppercase tracking-wide text-emerald-700">
                    {day.futureSlots.length} libres
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wide text-rose-600">Completo</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {enrichedAppointments.length ? (
                  enrichedAppointments.map((item) => {
                    const statusColor = getStatusBadgeColor(item.estado);
                    return (
                      <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-2 flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-900">{item.time || 'Sin hora'}</span>
                          <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full ${statusColor}`}>
                            {item.estado}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700">{item.patientName}</div>
                        <div className="text-[10px] text-slate-500">HC {item.familyCode}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-slate-500">Sin turnos agendados</div>
                )}
              </div>

              {!day.isPast && day.futureSlots.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {day.futureSlots.map((slot) => (
                    <span
                      key={slot}
                      className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              )}

              {onSelectDate && (
                <button
                  type="button"
                  onClick={() => onSelectDate(day.isoDate)}
                  className="text-xs px-3 py-1 rounded-lg border border-slate-300 hover:bg-white transition"
                >
                  Ver día
                </button>
              )}
            </div>
          );
        })}
      </div>

      {firstAvailableIndex >= 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setWeekIndex(firstAvailableIndex)}
            className="text-xs px-3 py-1 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            Ir al próximo disponible
          </button>
        </div>
      )}
    </section>
  );
}

function normalizeAgCode(value) {
  if (!value) return '';
  let cleaned = value.trim().toUpperCase();
  if (!cleaned) return '';
  if (cleaned.startsWith('AG-')) {
    const digits = cleaned.slice(3).replace(/\D/g, '');
    return digits ? `AG-${digits.padStart(4, '0')}` : '';
  }
  cleaned = cleaned.replace(/^AG\s*/i, '');
  const digits = cleaned.replace(/\D/g, '');
  if (!digits) return '';
  return `AG-${digits.padStart(4, '0')}`;
}

function generateNextCode(families = []) {
  const patternAg = /^AG-(\d{4})$/;
  let maxAg = 0;
  families.forEach((fam) => {
    const matchAg = patternAg.exec(fam.code || '');
    if (matchAg) {
      const num = parseInt(matchAg[1], 10);
      if (Number.isFinite(num)) maxAg = Math.max(maxAg, num);
    }
  });
  const next = String((maxAg || 0) + 1).padStart(4, '0');
  return `AG-${next}`;
}

function buildMotivoMetadata(groupId, detailId) {
  const group = MOTIVO_CONSULTA_GROUPS.find((item) => item.id === groupId) || null;
  const detail = group?.options.find((opt) => opt.id === detailId) || null;
  return {
    groupId,
    groupLabel: group?.label || '',
    detailId,
    detailLabel: detail?.label || ''
  };
}
function buildExamenFisicoFromPayload(payload = {}) {
  const examen = {
    peso: payload.pacienteExamenPeso,
    talla: payload.pacienteExamenTalla,
    perimetroCefalico: payload.pacienteExamenPc,
    edadReferencia: payload.pacienteEdad,
    observaciones: payload.pacienteExamenObservaciones,
    dismorfias: payload.pacienteExamenDismorfias,
    ojos: payload.pacienteExamenOjos,
    nariz: payload.pacienteExamenNariz,
    filtrum: payload.pacienteExamenFiltrum,
    boca: payload.pacienteExamenBoca,
    orejas: payload.pacienteExamenOrejas,
    cuello: payload.pacienteExamenCuello,
    torax: payload.pacienteExamenTorax,
    columna: payload.pacienteExamenColumna,
    abdomen: payload.pacienteExamenAbdomen,
    genitales: payload.pacienteExamenGenitales,
    otras: payload.pacienteExamenOtras,
  };
  Object.keys(examen).forEach((key) => {
    const value = examen[key];
    if (value == null || value === '') {
      delete examen[key];
    }
  });
  return examen;
}

function buildWizardInitialData(family, members = []) {
  if (!family) return null;
  const admin = { ...(family.intake?.administrativo || {}) };
  const base = { ...admin };
  const findMember = (predicate) => members.find(predicate) || null;
  const proband = findMember((member) => member.rol === 'Proband' || member.filiatorios?.iniciales === 'A1');

  const ensure = (field, value) => {
    if (base[field] == null || base[field] === '') {
      if (value != null && value !== '') {
        base[field] = value;
      }
    }
  };

  ensure('agNumber', family.code);
  ensure('motivoGroup', family.motivo?.groupId);
  ensure('motivoDetail', family.motivo?.detailId);
  ensure('motivoPaciente', family.motivoPaciente);
  ensure('motivoDerivacion', family.motivoDerivacion);
  ensure('provincia', family.provincia);
  ensure('medicoAsignado', family.medicoAsignado);
  ensure('pacienteDireccion', family.filiatoriosContacto?.direccion);
  ensure('pacienteEmail', family.filiatoriosContacto?.email || proband?.contacto?.email);
  ensure('pacienteTelefono', family.filiatoriosContacto?.telefono || proband?.contacto?.telefono);
  ensure('pacienteNacimiento', proband?.nacimiento);
  ensure('pacienteSexo', proband?.sexo);
  ensure('pacienteProfesion', proband?.profesion);
  ensure('pacienteAntecedentes', proband?.antecedentesPersonales);
  ensure('pacienteObraSocial', proband?.obraSocial);

  base.consanguinidad = base.consanguinidad || family.consanguinidad?.estado || 'no';
  base.consanguinidadDetalle = base.consanguinidadDetalle || family.consanguinidad?.detalle || '';
  base.obstetricosDescripcion = base.obstetricosDescripcion || family.antecedentesObstetricos || '';

  const abuelos = family.abuelos || {};
  ensure('abueloPaternoApellido', abuelos.paternos?.abuelo?.apellido);
  ensure('abueloPaternoProcedencia', abuelos.paternos?.abuelo?.procedencia);
  ensure('abuelaPaternaApellido', abuelos.paternos?.abuela?.apellido);
  ensure('abuelaPaternaProcedencia', abuelos.paternos?.abuela?.procedencia);
  ensure('abueloMaternoApellido', abuelos.maternos?.abuelo?.apellido);
  ensure('abueloMaternoProcedencia', abuelos.maternos?.abuelo?.procedencia);
  ensure('abuelaMaternaApellido', abuelos.maternos?.abuela?.apellido);
  ensure('abuelaMaternaProcedencia', abuelos.maternos?.abuela?.procedencia);

  return base;
}



function FooterBar({ onAnalytics }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-20 bg-white/90 backdrop-blur border-t border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-center">
        <button onClick={onAnalytics} className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 shadow-sm">📊 Análisis de datos</button>
      </div>
    </div>
  );
}

export default function HomePage({ user, onLogout }) {
  const { state, STORAGE_KEY, createFamily, createMember, addEvolution, updateFamily, updateMember } = useCenagemStore();
  const { families, members, evolutions } = state;

  const [showNewCase, setShowNewCase] = useState(false);
  const [creatingCase, setCreatingCase] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => formatISODateLocal(new Date()));
  const [agenda, setAgenda] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem(AGENDA_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.warn('No se pudo leer la agenda desde localStorage', error);
    }
    const seed = seedAgendaFromMembers(members);
    try {
      window.localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(seed));
    } catch (error) {
      console.warn('No se pudo inicializar la agenda en localStorage', error);
    }
    return seed;
  });
  const [familyCodeInput, setFamilyCodeInput] = useState('');
  const [familyCodeFeedback, setFamilyCodeFeedback] = useState(null);
  const [wizardFamilyId, setWizardFamilyId] = useState(null);
  const [wizardBusy, setWizardBusy] = useState(false);
  const [wizardActive, setWizardActive] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(agenda));
    } catch (error) {
      console.warn('No se pudo persistir la agenda en localStorage', error);
    }
  }, [agenda]);

  useEffect(() => {
    setWizardBusy(false);
    setWizardActive(false);
  }, [wizardFamilyId]);

  const membersById = useMemo(() => {
    const map = {};
    members.forEach((member) => {
      map[member.id] = member;
    });
    return map;
  }, [members]);

  const membersByFamilyId = useMemo(() => {
    const map = {};
    members.forEach((member) => {
      if (!member.familyId) return;
      if (!map[member.familyId]) map[member.familyId] = [];
      map[member.familyId].push(member);
    });
    return map;
  }, [members]);

  const familiesById = useMemo(() => {
    const map = {};
    families.forEach((family) => {
      map[family.id] = family;
    });
    return map;
  }, [families]);

  const familyByCode = useMemo(() => {
    const map = {};
    families.forEach((family) => {
      if (family.code) {
        map[family.code.toLowerCase()] = family;
      }
    });
    return map;
  }, [families]);

  const wizardFamily = wizardFamilyId ? familiesById[wizardFamilyId] : null;

  const wizardFamilyMembers = useMemo(() => {
    if (!wizardFamilyId) return [];
    return membersByFamilyId[wizardFamilyId] || [];
  }, [wizardFamilyId, membersByFamilyId]);

  const wizardInitialData = useMemo(() => {
    if (!wizardFamily) return null;
    return buildWizardInitialData(wizardFamily, wizardFamilyMembers);
  }, [wizardFamily, wizardFamilyMembers]);

  const wizardReady = Boolean(wizardInitialData && wizardFamilyId);
  const wizardPatientName = useMemo(() => {
    if (!wizardInitialData) return '';
    const name = [wizardInitialData.pacienteNombre, wizardInitialData.pacienteApellido]
      .filter(Boolean)
      .join(' ')
      .trim();
    return name;
  }, [wizardInitialData]);

  const agendaForSelectedDate = useMemo(() => {
    return agenda
      .filter((item) => item.date === selectedDate)
      .slice()
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [agenda, selectedDate]);

  const probands = useMemo(() => members.filter((member) => member.rol === 'Proband'), [members]);
  const consultasHoy = agendaForSelectedDate.length;
  const pendientesHoy = agendaForSelectedDate.filter((item) => item.estado !== 'Atendido').length;

  const followUps = useMemo(() => {
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    const thresholdDays = 60;
    const byMember = {};
    evolutions.forEach((evo) => {
      if (!byMember[evo.memberId]) byMember[evo.memberId] = [];
      byMember[evo.memberId].push(evo);
    });

    return members
      .filter((member) => member.rol === 'Proband')
      .map((member) => {
        const memberEvolutions = byMember[member.id] || [];
        const lastTimestamp = memberEvolutions.reduce((latest, evo) => {
          const time = new Date(evo.at).getTime();
          return time > latest ? time : latest;
        }, 0);
        const daysSince = lastTimestamp ? Math.floor((now - lastTimestamp) / msPerDay) : Number.POSITIVE_INFINITY;
        return {
          memberId: member.id,
          familyId: member.familyId,
          daysSince,
          lastEvolution: lastTimestamp ? new Date(lastTimestamp).toISOString() : null
        };
      })
      .filter((item) => !Number.isFinite(item.daysSince) || item.daysSince >= thresholdDays)
      .sort((a, b) => {
        const normalize = (value) => (Number.isFinite(value) ? value : 9999);
        return normalize(b.daysSince) - normalize(a.daysSince);
      });
  }, [members, evolutions]);

  const selectedDateLabel = formatFriendlyDate(selectedDate);

  const metrics = [
    { label: 'Consultas hoy', value: consultasHoy, hint: selectedDateLabel || '' },
    { label: 'Pendientes', value: pendientesHoy, hint: 'Turnos sin marcar como atendidos' },
    { label: 'Familias activas', value: families.length, hint: 'Historias familiares cargadas' },
    { label: 'Seguimiento >60 días', value: followUps.length, hint: 'Probands a revisar' }
  ];

  const agendaMembersOptions = useMemo(() => {
    return probands.length ? probands : members;
  }, [probands, members]);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        window.location.hash = 'analytics';
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setShowNewCase(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleCreateAppointment = ({ memberId, date, time, profesional, motivo, notas }) => {
    const member = membersById[memberId];
    if (!member) return;
    const appointment = {
      id: uidLocal(),
      memberId,
      familyId: member.familyId,
      date: date || selectedDate,
      time: time || '08:00',
      motivo: motivo || member.diagnostico || 'Consulta genética',
      profesional,
      notas,
      estado: 'Pendiente'
    };
    setAgenda((prev) => [...prev, appointment]);
  };

  const handleStatusChange = (id, status) => {
    setAgenda((prev) => prev.map((item) => (item.id === id ? { ...item, estado: status } : item)));
  };

  const handleRemoveAppointment = (id) => {
    setAgenda((prev) => prev.filter((item) => item.id !== id));
  };

  const handleOpenFamily = (familyId) => {
    const family = familiesById[familyId];
    if (family?.intake?.wizardPending) {
      setWizardBusy(false);
      setWizardFamilyId(familyId);
      setWizardActive(false);
      return;
    }
    let changed = false;
    const updated = agenda.map((item) => {
      if (item.familyId === familyId && item.date === selectedDate && item.estado !== 'Atendido') {
        changed = true;
        return { ...item, estado: 'Atendido' };
      }
      return item;
    });
    if (changed) {
      setAgenda(updated);
    }
    window.location.hash = '#/family/' + familyId;
  };

  const startWizardForFamily = () => {
    if (!wizardReady) return;
    setWizardActive(true);
  };

  const handleCancelWizard = () => {
    setWizardBusy(false);
    setWizardActive(false);
    setWizardFamilyId(null);
  };

  const handleGoToFamilyByCode = () => {
    const normalized = normalizeFamilyCodeInput(familyCodeInput);
    if (!normalized) {
      setFamilyCodeFeedback('Ingresá un número de HC.');
      return;
    }
    const family = familyByCode[normalized.toLowerCase()];
    if (!family) {
      setFamilyCodeFeedback('No encontramos una HC con ese número.');
      return;
    }
    setFamilyCodeFeedback(null);
    setFamilyCodeInput('');
    handleOpenFamily(family.id);
  };

  const handleCreateCase = async (payload) => {
    setCreatingCase(true);
    try {
      const normalizedCode = normalizeAgCode(payload.agNumber);
      const code = normalizedCode || generateNextCode(families);
      const motivo = buildMotivoMetadata(payload.motivoGroup, payload.motivoDetail);
      const tags = Array.from(new Set([
        motivo.groupId,
        motivo.detailId,
        motivo.groupLabel?.toLowerCase(),
        motivo.detailLabel?.toLowerCase()
      ].filter(Boolean)));
      const medicoAsignado = (payload.medicoAsignado || '').trim();
      const nowIso = new Date().toISOString();

      const family = createFamily({
        code,
        provincia: payload.provincia || '',
        tags,
        motivo,
        motivoNotes: payload.motivoDerivacion,
        motivoPaciente: payload.motivoPaciente,
        motivoDerivacion: payload.motivoDerivacion,
        medicoAsignado,
        filiatoriosContacto: {
          direccion: payload.pacienteDireccion,
          email: payload.pacienteEmail,
          telefono: payload.pacienteTelefono
        },
        consanguinidad: {
          estado: payload.consanguinidad || 'no',
          detalle: payload.consanguinidadDetalle || ''
        },
        antecedentesObstetricos: payload.obstetricosDescripcion,
        abuelos: {
          paternos: {
            abuelo: { apellido: payload.abueloPaternoApellido, procedencia: payload.abueloPaternoProcedencia },
            abuela: { apellido: payload.abuelaPaternaApellido, procedencia: payload.abuelaPaternaProcedencia }
          },
          maternos: {
            abuelo: { apellido: payload.abueloMaternoApellido, procedencia: payload.abueloMaternoProcedencia },
            abuela: { apellido: payload.abuelaMaternaApellido, procedencia: payload.abuelaMaternaProcedencia }
          }
        },
        intake: {
          createdAt: nowIso,
          wizardPending: true,
          administrativo: payload
        },
        createdBy: user?.email || 'sistema'
      });

      const motivoDiagnostico = motivo.detailLabel || motivo.groupLabel || 'Motivo de consulta';
      const notas = [];
      if (payload.motivoPaciente) {
        notas.push({ id: uidLocal(), texto: `Paciente refiere: ${payload.motivoPaciente}`, autor: user?.email || 'registro' });
      }
      if (payload.motivoDerivacion) {
        notas.push({ id: uidLocal(), texto: `Derivación: ${payload.motivoDerivacion}`, autor: user?.email || 'registro' });
      }

      const pacienteNombre = (payload.pacienteNombre || '').trim();
      const pacienteApellido = (payload.pacienteApellido || '').trim();
      const pacienteNombreCompleto = [pacienteNombre, pacienteApellido].filter(Boolean).join(' ');

      const proband = createMember(family.id, {
        rol: 'Proband',
        filiatorios: { iniciales: 'A1', nombreCompleto: pacienteNombreCompleto || 'Paciente sin nombre' },
        nombre: pacienteNombreCompleto || 'Paciente sin nombre',
        contacto: { email: payload.pacienteEmail, telefono: payload.pacienteTelefono },
        direccion: payload.pacienteDireccion,
        diagnostico: motivoDiagnostico,
        sexo: payload.pacienteSexo || undefined,
        nacimiento: payload.pacienteNacimiento || undefined,
        profesion: payload.pacienteProfesion || undefined,
        obraSocial: payload.pacienteObraSocial || undefined,
        antecedentesPersonales: payload.pacienteAntecedentes || undefined,
        notas
      });

      const resumen = [
        `Motivo: ${motivoDiagnostico}`,
        payload.motivoPaciente ? `Paciente: ${payload.motivoPaciente}` : '',
        payload.motivoDerivacion ? `Derivación: ${payload.motivoDerivacion}` : '',
        medicoAsignado ? `Profesional: ${medicoAsignado}` : ''
      ].filter(Boolean).join(' | ');

      if (proband?.id) {
        addEvolution(proband.id, resumen || 'Alta administrativa creada', user?.email || 'registro');
      }

      setShowNewCase(false);
      alert(`HC creada correctamente. Código asignado: ${code}`);
    } catch (error) {
      console.error('Error creando la HC', error);
      alert('No se pudo crear la HC. Revisá los datos e intentá nuevamente.');
    } finally {
      setCreatingCase(false);
    }
  };

  const handleCompleteWizard = async (familyId, payload) => {
    if (!familyId) return;
    const family = familiesById[familyId];
    if (!family) return;
    setWizardBusy(true);
    try {
      const motivo = buildMotivoMetadata(payload.motivoGroup, payload.motivoDetail);
      const tags = Array.from(new Set([
        ...(Array.isArray(family.tags) ? family.tags : []),
        motivo.groupId,
        motivo.detailId,
        motivo.groupLabel?.toLowerCase(),
        motivo.detailLabel?.toLowerCase()
      ].filter(Boolean)));
      const medicoAsignado = (payload.medicoAsignado || family.medicoAsignado || '').trim();
      const examenFisico = buildExamenFisicoFromPayload(payload);
      const contactos = {
        direccion: payload.pacienteDireccion || family.filiatoriosContacto?.direccion || '',
        email: payload.pacienteEmail || family.filiatoriosContacto?.email || '',
        telefono: payload.pacienteTelefono || family.filiatoriosContacto?.telefono || ''
      };
      const nowIso = new Date().toISOString();

      const intakePrev = family.intake || {};
      const intake = {
        ...intakePrev,
        administrativo: { ...(intakePrev.administrativo || {}), ...payload },
        wizardPending: false,
        wizardCompletedAt: nowIso,
        wizardPayload: payload,
        examen: Object.keys(examenFisico).length ? { ...examenFisico, edadReferencia: payload.pacienteEdad } : intakePrev.examen
      };

      const familyPatch = {
        code: normalizeAgCode(payload.agNumber) || family.code,
        provincia: payload.provincia || family.provincia || '',
        tags,
        motivo,
        motivoNotes: payload.motivoDerivacion || family.motivoNotes,
        motivoPaciente: payload.motivoPaciente || family.motivoPaciente,
        motivoDerivacion: payload.motivoDerivacion || family.motivoDerivacion,
        medicoAsignado,
        filiatoriosContacto: contactos,
        consanguinidad: {
          estado: payload.consanguinidad || family.consanguinidad?.estado || 'no',
          detalle: payload.consanguinidadDetalle || family.consanguinidad?.detalle || ''
        },
        antecedentesObstetricos: payload.obstetricosDescripcion || family.antecedentesObstetricos,
        abuelos: {
          paternos: {
            abuelo: {
              apellido: payload.abueloPaternoApellido || family.abuelos?.paternos?.abuelo?.apellido || '',
              procedencia: payload.abueloPaternoProcedencia || family.abuelos?.paternos?.abuelo?.procedencia || ''
            },
            abuela: {
              apellido: payload.abuelaPaternaApellido || family.abuelos?.paternos?.abuela?.apellido || '',
              procedencia: payload.abuelaPaternaProcedencia || family.abuelos?.paternos?.abuela?.procedencia || ''
            }
          },
          maternos: {
            abuelo: {
              apellido: payload.abueloMaternoApellido || family.abuelos?.maternos?.abuelo?.apellido || '',
              procedencia: payload.abueloMaternoProcedencia || family.abuelos?.maternos?.abuelo?.procedencia || ''
            },
            abuela: {
              apellido: payload.abuelaMaternaApellido || family.abuelos?.maternos?.abuela?.apellido || '',
              procedencia: payload.abuelaMaternaProcedencia || family.abuelos?.maternos?.abuela?.procedencia || ''
            }
          }
        },
        intake
      };

      updateFamily(familyId, familyPatch);

      const familyMembers = membersByFamilyId[familyId] || [];
      const proband = familyMembers.find((member) => member.rol === 'Proband' || member.filiatorios?.iniciales === 'A1') || null;
      const pacienteNombre = (payload.pacienteNombre || '').trim();
      const pacienteApellido = (payload.pacienteApellido || '').trim();
      const pacienteNombreCompleto = [pacienteNombre, pacienteApellido].filter(Boolean).join(' ') || proband?.nombre || 'Paciente sin nombre';

      if (proband) {
        const contacto = { ...(proband.contacto || {}) };
        if (payload.pacienteEmail) contacto.email = payload.pacienteEmail;
        if (payload.pacienteTelefono) contacto.telefono = payload.pacienteTelefono;
        const probandPatch = {
          filiatorios: { ...(proband.filiatorios || {}), nombreCompleto: pacienteNombreCompleto },
          nombre: pacienteNombreCompleto,
          contacto: Object.keys(contacto).length ? contacto : proband.contacto,
          direccion: contactos.direccion || proband.direccion,
          diagnostico: motivo.detailLabel || motivo.groupLabel || proband.diagnostico,
          sexo: payload.pacienteSexo || proband.sexo || undefined,
          nacimiento: payload.pacienteNacimiento || proband.nacimiento || undefined,
          profesion: payload.pacienteProfesion || proband.profesion || undefined,
          obraSocial: payload.pacienteObraSocial || proband.obraSocial || undefined,
          antecedentesPersonales: payload.pacienteAntecedentes || proband.antecedentesPersonales || undefined,
          examenFisico: Object.keys(examenFisico).length ? examenFisico : proband.examenFisico
        };
        updateMember(proband.id, probandPatch);
      }

      const upsertRelative = (role, initials, data, extra = {}) => {
        const nombre = (data.nombre || '').trim();
        const apellido = (data.apellido || '').trim();
        const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ');
        if (!nombreCompleto) return;
        const existing = familyMembers.find((member) => member.rol === role || member.filiatorios?.iniciales === initials) || null;
        let contacto = existing?.contacto ? { ...existing.contacto } : {};
        if (data.email) contacto.email = data.email;
        if (data.telefono) contacto.telefono = data.telefono;
        if (!Object.keys(contacto).length) contacto = existing?.contacto && Object.keys(existing.contacto).length ? existing.contacto : undefined;
        const patch = {
          rol: role,
          filiatorios: { ...(existing?.filiatorios || {}), iniciales: initials, nombreCompleto },
          nombre: nombreCompleto,
          nacimiento: data.nacimiento || existing?.nacimiento || undefined,
          profesion: data.profesion || existing?.profesion || undefined,
          obraSocial: data.obraSocial || existing?.obraSocial || undefined,
          antecedentesPersonales: data.antecedentes || existing?.antecedentesPersonales || undefined,
        };
        if (contacto) patch.contacto = contacto;
        if (extra.obstetricos) {
          const prev = existing?.obstetricos || {};
          patch.obstetricos = {
            gestas: extra.obstetricos.gestas ?? prev.gestas,
            partos: extra.obstetricos.partos ?? prev.partos,
            abortos: extra.obstetricos.abortos ?? prev.abortos,
            cesareas: extra.obstetricos.cesareas ?? prev.cesareas,
          };
        }
        if (existing) {
          updateMember(existing.id, patch);
        } else {
          createMember(familyId, { ...patch, notas: [] });
        }
      };

      upsertRelative('B1', 'B1', {
        nombre: payload.b1Nombre,
        apellido: payload.b1Apellido,
        nacimiento: payload.b1Nacimiento,
        email: payload.b1Email,
        profesion: payload.b1Profesion,
        obraSocial: payload.b1ObraSocial,
        antecedentes: payload.b1Antecedentes,
      });

      upsertRelative('C1', 'C1', {
        nombre: payload.c1Nombre,
        apellido: payload.c1Apellido,
        nacimiento: payload.c1Nacimiento,
        email: payload.c1Email,
        profesion: payload.c1Profesion,
        obraSocial: payload.c1ObraSocial,
        antecedentes: payload.c1Antecedentes,
      }, {
        obstetricos: {
          gestas: payload.c1Gestas,
          partos: payload.c1Partos,
          abortos: payload.c1Abortos,
          cesareas: payload.c1Cesareas,
        },
      });

      const resumenPrimera = (payload.resumenPrimeraConsulta || '').trim();
      const resumen = resumenPrimera || [
        `Motivo: ${motivo.detailLabel || motivo.groupLabel || 'Motivo de consulta'}`,
        payload.motivoPaciente ? `Paciente: ${payload.motivoPaciente}` : '',
        payload.motivoDerivacion ? `Derivación: ${payload.motivoDerivacion}` : '',
        medicoAsignado ? `Profesional: ${medicoAsignado}` : '',
        payload.pacienteExamenPeso ? `Peso: ${payload.pacienteExamenPeso} kg` : '',
        payload.pacienteExamenTalla ? `Talla: ${payload.pacienteExamenTalla} cm` : '',
        payload.pacienteExamenPc ? `PC: ${payload.pacienteExamenPc} cm` : ''
      ].filter(Boolean).join(' | ');

      if (proband?.id) {
        addEvolution(proband.id, resumen || 'Historia clínica inicial completada', user?.email || 'registro');
      }

      setWizardActive(false);
      setWizardFamilyId(null);
      window.location.hash = '#/family/' + familyId;
    } catch (error) {
      console.error('Error completando la HC', error);
      alert('No se pudo guardar la información clínica. Intentá nuevamente.');
    } finally {
      setWizardBusy(false);
    }
  };
  return (
    <div className="p-6 grid gap-4">
      
      <Header
        onLogout={onLogout}
        user={user}
        title="CENAGEM · HC Familiar"
        onReset={() => { window.localStorage.removeItem(STORAGE_KEY); window.location.reload(); }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} hint={metric.hint} />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <button
  onClick={() => setShowNewCase(true)}

  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm font-medium"
>
  + Nueva HC familiar
</button>

          <button onClick={() => { window.location.hash = 'analytics'; }} className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm">
            Ver tableros
          </button>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); handleGoToFamilyByCode(); }} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={familyCodeInput}
            onChange={(event) => {
              setFamilyCodeInput(event.target.value.toUpperCase());
              if (familyCodeFeedback) setFamilyCodeFeedback(null);
            }}
            placeholder="Ingresar nro de HC (ej. AG-0001)"
            className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-slate-300 text-sm uppercase"
            autoComplete="off"
            aria-label="Ingresar número de HC"
          />
          <button type="submit" className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm font-medium">
            Ingresar
          </button>
        </form>
        {familyCodeFeedback && (
          <p className="text-xs text-rose-600" role="alert">{familyCodeFeedback}</p>
        )}
      </div>

      <TodayAgenda
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        appointments={agendaForSelectedDate}
        membersOptions={agendaMembersOptions}
        membersById={membersById}
        familiesById={familiesById}
        onCreateAppointment={handleCreateAppointment}
        onStatusChange={handleStatusChange}
        onRemoveAppointment={handleRemoveAppointment}
        onOpenFamily={handleOpenFamily}
      />
      <WeeklyAgendaBoard
        agenda={agenda}
        membersById={membersById}
        familiesById={familiesById}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

{showNewCase && (
  <div className="fixed inset-0 z-40 overflow-auto bg-white">
    <NewCaseCreate
      currentUser={{ name: user?.displayName || user?.email }}
      onCreate={handleCreateCase}
      onCancel={() => setShowNewCase(false)}
      busy={creatingCase}
    />
  </div>
)}

{wizardFamily && (
  <div className="fixed inset-0 z-50 overflow-auto bg-white">
    {wizardActive ? (
      <NewCaseWizard
        key={`wizard-${wizardFamilyId}`}
        currentUser={{ name: user?.displayName || user?.email }}
        busy={wizardBusy}
        onSubmit={(payload) => handleCompleteWizard(wizardFamilyId, payload)}
        onCancel={handleCancelWizard}
        initialData={wizardInitialData || {}}
        initialStep={2}
        showAdministrativeStep={false}
      />
    ) : (
      <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-xl grid gap-4 text-center">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-slate-900">Ingresar a HC por primera vez</h2>
            <p className="text-sm text-slate-600">Esta historia clínica solo tiene los datos administrativos. Completá el asistente clínico para finalizar el ingreso.</p>
          </div>
          {wizardPatientName && (
            <div className="text-sm font-medium text-slate-700">Paciente: {wizardPatientName}</div>
          )}
          {!wizardReady && (
            <div className="text-xs text-slate-500">Preparando datos administrativos...</div>
          )}
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={handleCancelWizard}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={startWizardForFamily}
              disabled={!wizardReady}
              className="px-4 py-2 rounded-xl border border-slate-900 bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
            >
              Ingresar a HC por primera vez
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
)}

      <FooterBar onAnalytics={() => { window.location.hash = 'analytics'; }} />
    </div>
  );
}




























