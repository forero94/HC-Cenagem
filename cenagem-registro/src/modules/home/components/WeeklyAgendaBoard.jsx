// ===============================
// src/modules/home/components/WeeklyAgendaBoard.jsx — Visor semanal de agenda
// ===============================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildWeeklyAgendaData,
  getMemberDisplayName,
  normalizePrimeraConsultaInfo,
  getScheduleForWeekday,
  WEEKDAYS,
  getWeekOfYear,
  formatISODateLocal,
} from '@/modules/home/agenda';

export default function WeeklyAgendaBoard({
  agenda,
  membersById,
  familiesById,
  selectedDate,
  onSelectDate,
  service = 'clinica',
}) {
  const normalizedService = (typeof service === 'string' && service.trim().toLowerCase()) || 'clinica';
  const weeks = useMemo(() => buildWeeklyAgendaData(agenda, 52, normalizedService), [agenda, normalizedService]);
  const firstAvailableIndex = useMemo(
    () => weeks.findIndex((week) => week.availableCount > 0),
    [weeks],
  );
  const [weekIndex, setWeekIndex] = useState(() => (firstAvailableIndex >= 0 ? firstAvailableIndex : 0));
  const [managementMode, setManagementMode] = useState(false);
  const [blockedDays, setBlockedDays] = useState([]);
  const [showEmptyDays, setShowEmptyDays] = useState(false);
  const autoSnapRef = useRef(false);

  const handleBlockDay = (isoDate) => {
    setBlockedDays(prev => {
      if (prev.includes(isoDate)) {
        return prev.filter(d => d !== isoDate);
      }
      return [...prev, isoDate];
    });
  };

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

  const nextAvailableSlot = useMemo(() => {
    for (const weekItem of weeks) {
      for (const day of weekItem.days) {
        if (day.futureSlots.length > 0) {
          const nextDateLabel = day.date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });
          const slot = day.futureSlots[0];
          return {
            date: day.isoDate,
            slotTime: slot.time,
            slotLabel: slot.shortLabel,
            label: nextDateLabel,
          };
        }
      }
    }
    return null;
  }, [weeks]);

  if (!weeks.length) {
    return null;
  }

  const week = weeks[Math.min(weekIndex, weeks.length - 1)];

  const filteredDays = useMemo(() => {
    if (showEmptyDays) {
      return week.days;
    }
    return week.days.filter(day => {
      const weekday = day.date.getDay();
      if (weekday === WEEKDAYS.SATURDAY || weekday === WEEKDAYS.SUNDAY) {
        return day.appointments.length > 0;
      }
      const schedule = getScheduleForWeekday(day.date.getDay(), normalizedService);
      if (schedule.length === 0) {
        return day.appointments.length > 0;
      }
      return true;
    });
  }, [week, showEmptyDays, normalizedService]);

  const handlePrevWeek = () => setWeekIndex((prev) => Math.max(prev - 1, 0));
  const handleNextWeek = () => setWeekIndex((prev) => Math.min(prev + 1, weeks.length - 1));

  const handleGoToToday = () => {
    const today = new Date();
    const todayIso = formatISODateLocal(today);
    const todayWeekIndex = weeks.findIndex(week => week.days.some(day => day.isoDate === todayIso));
    if (todayWeekIndex >= 0) {
      setWeekIndex(todayWeekIndex);
    }
  };

  const isTodayInView = useMemo(() => {
    const today = new Date();
    const todayIso = formatISODateLocal(today);
    return week.days.some(day => day.isoDate === todayIso);
  }, [week]);

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
              Próximo turno disponible: {nextAvailableSlot.label} · {nextAvailableSlot.slotLabel}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setManagementMode(prev => !prev)}
            className={`px-3 py-2 rounded-xl border text-xs font-medium ${managementMode ? 'bg-sky-100 border-sky-300 text-sky-700' : 'border-slate-300 hover:bg-slate-50'}`}
          >
            {managementMode ? 'Finalizar gestión' : 'Gestionar disponibilidad'}
          </button>
          <button
            type="button"
            onClick={() => setShowEmptyDays(prev => !prev)}
            className={`px-3 py-2 rounded-xl border text-xs font-medium ${showEmptyDays ? 'bg-sky-100 border-sky-300 text-sky-700' : 'border-slate-300 hover:bg-slate-50'}`}
          >
            {showEmptyDays ? 'Ocultar días vacíos' : 'Mostrar días vacíos'}
          </button>
          <button
            type="button"
            onClick={handleGoToToday}
            className={`px-3 py-2 rounded-xl border text-sm font-medium ${isTodayInView ? 'bg-sky-100 border-sky-300 text-sky-700' : 'border-slate-300 hover:bg-slate-50'}`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={handlePrevWeek}
            disabled={weekIndex === 0}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium hover:bg-slate-50 disabled:opacity-40"
          >
            Semana anterior
          </button>
          <span className="text-xs text-slate-500">
            Semana {getWeekOfYear(week.start)} / 52
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
        {filteredDays.map((day) => {
          const enrichedAppointments = day.appointments.map((item) => {
            const member = item.memberId ? membersById[item.memberId] : null;
            const primeraInfo = normalizePrimeraConsultaInfo(
              item.primeraConsultaInfo
                || (item.metadata && typeof item.metadata === 'object' ? item.metadata.primeraConsultaInfo : null),
            );
            const primeraNombre = primeraInfo
              ? `${primeraInfo.nombre || ''} ${primeraInfo.apellido || ''}`.trim()
              : '';
            const patientNameRaw = item.primeraConsulta
              ? primeraNombre || 'Paciente sin datos'
              : getMemberDisplayName(member);
            const patientName = patientNameRaw || 'Paciente sin datos';
            const primeraMotivo = primeraInfo?.motivoGroupLabel || item.motivo || '';
            const followUpDetail = item.motivo || '';
            return {
              id: item.id,
              patientName,
              primeraConsulta: Boolean(item.primeraConsulta),
              sobreturno: Boolean(item.sobreturno),
              motivoLabel: Boolean(item.primeraConsulta) ? primeraMotivo : followUpDetail,
            };
          });
          const isSelected = selectedDate === day.isoDate;
          const isBlocked = blockedDays.includes(day.isoDate);
          const firstTimeAppointments = enrichedAppointments.filter((item) => Boolean(item.primeraConsulta));
          const followUpAppointments = enrichedAppointments.filter((item) => !item.primeraConsulta);
          const showGroupedSections = firstTimeAppointments.length > 0 && followUpAppointments.length > 0;

          const renderAppointmentsList = (items) => {
            if (!items.length) {
              return null;
            }
            return (
              <div className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {items.map((appointment) => (
                  <div key={appointment.id} className="px-3 py-2 text-sm text-slate-900">
                    <div className="truncate font-medium">{appointment.patientName}</div>
                    {appointment.motivoLabel && (
                      <div className="text-[11px] text-slate-500 truncate">
                        {appointment.motivoLabel}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          };

          const availableSlotsCount = day.futureSlots.length;
          let availabilityClass = 'bg-slate-50/60 border-slate-200';
          if (isBlocked) {
            availabilityClass = 'bg-gray-200 border-gray-400';
          } else if (!day.isPast) {
            if (availableSlotsCount === 0) {
              availabilityClass = 'bg-rose-50 border-rose-300';
            } else if (availableSlotsCount <= 3) {
              availabilityClass = 'bg-amber-50 border-amber-300';
            } else {
              availabilityClass = 'bg-emerald-50 border-emerald-300';
            }
          }

          return (
            <div
              key={day.isoDate}
              className={`rounded-2xl border ${availabilityClass} p-3 flex flex-col gap-2 ${isSelected ? 'border-slate-900 ring-2 ring-slate-900/20 bg-white' : ''}`}
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
                ) : isBlocked ? (
                  <span className="text-[10px] uppercase tracking-wide text-gray-500">Bloqueado</span>
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
                  <div className="flex flex-col gap-2">
                    {firstTimeAppointments.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {showGroupedSections && (
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Consultas de primera vez
                          </div>
                        )}
                        {renderAppointmentsList(firstTimeAppointments)}
                      </div>
                    )}
                    {showGroupedSections && <div className="border-t border-dashed border-slate-200" />}
                    {followUpAppointments.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {showGroupedSections && (
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Consultas programadas
                          </div>
                        )}
                        {renderAppointmentsList(followUpAppointments)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">Sin turnos agendados</div>
                )}
              </div>

              {!day.isPast && day.futureSlots.length > 0 && !isBlocked && (
                <div className="flex flex-wrap gap-1">
                  {day.futureSlots.map((slot) => (
                    <span
                      key={slot.id}
                      className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide"
                    >
                      {slot.shortLabel}
                    </span>
                  ))}
                </div>
              )}

              {onSelectDate && (
                <button
                  type="button"
                  onClick={() => onSelectDate(day.isoDate)}
                  className="text-xs px-3 py-1 rounded-lg border border-slate-300 hover:bg-white transition"
                  disabled={isBlocked}
                >
                  Ver día
                </button>
              )}

              {managementMode && !day.isPast && (
                <div className="mt-auto pt-2">
                  <button
                    type="button"
                    onClick={() => handleBlockDay(day.isoDate)}
                    className={`w-full text-xs px-3 py-2 rounded-lg border ${isBlocked ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : 'border-rose-300 text-rose-700 hover:bg-rose-50'}`}
                  >
                    {isBlocked ? 'Desbloquear día' : 'Bloquear día'}
                  </button>
                </div>
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
