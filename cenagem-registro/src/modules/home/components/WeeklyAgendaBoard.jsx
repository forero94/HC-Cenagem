// ===============================
// src/modules/home/components/WeeklyAgendaBoard.jsx — Visor semanal de agenda
// ===============================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildWeeklyAgendaData,
  getMemberDisplayName,
  getStatusBadgeColor,
  normalizePrimeraConsultaInfo,
} from '@/modules/home/agenda';

export default function WeeklyAgendaBoard({ agenda, membersById, familiesById, selectedDate, onSelectDate }) {
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
              Próximo turno disponible: {nextAvailableSlot.label} · {nextAvailableSlot.slotLabel}
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
            const member = item.memberId ? membersById[item.memberId] : null;
            const family = item.familyId ? familiesById[item.familyId] : null;
            const primeraInfo = normalizePrimeraConsultaInfo(
              item.primeraConsultaInfo
                || (item.metadata && typeof item.metadata === 'object' ? item.metadata.primeraConsultaInfo : null),
            );
            const primeraNombre = primeraInfo
              ? `${primeraInfo.nombre || ''} ${primeraInfo.apellido || ''}`.trim()
              : '';
            const patientName = item.primeraConsulta
              ? ['Primera consulta', primeraNombre].filter(Boolean).join(' · ')
              : getMemberDisplayName(member);
            return {
              ...item,
              patientName,
              familyCode: family?.code || null,
              familyDisplay: family
                ? `HC ${family.code}`
                : item.primeraConsulta
                ? 'Sin HC asignada'
                : 'HC sin datos',
              primeraConsultaInfo: primeraInfo,
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
                        <div className="text-[10px] text-slate-500">{item.familyDisplay}</div>
                        {item.primeraConsulta && item.primeraConsultaInfo && (
                          <div className="text-[10px] text-slate-500 flex flex-col gap-0.5">
                            <span>
                              Paciente:{' '}
                              {item.primeraConsultaInfo.nombre || item.primeraConsultaInfo.apellido
                                ? `${item.primeraConsultaInfo.nombre || ''} ${item.primeraConsultaInfo.apellido || ''}`.trim()
                                : 'Sin datos'}
                              {item.primeraConsultaInfo.edad ? ` · ${item.primeraConsultaInfo.edad} años` : ''}
                            </span>
                            {item.primeraConsultaInfo.motivoGroupLabel && (
                              <span className="text-sky-700">Motivo: {item.primeraConsultaInfo.motivoGroupLabel}</span>
                            )}
                          </div>
                        )}
                        {(item.primeraConsulta || item.sobreturno) && (
                          <div className="flex flex-wrap gap-1">
                            {item.primeraConsulta && (
                              <span className="text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                                Primera consulta
                              </span>
                            )}
                            {item.sobreturno && (
                              <span className="text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                Sobreturno
                              </span>
                            )}
                          </div>
                        )}
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
