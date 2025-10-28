// ===============================
// src/modules/home/components/TodayAgenda.jsx — Agenda diaria
// ===============================
import React, { useEffect, useMemo, useState } from 'react';
import {
  buildOverbookSlotsForDate,
  formatFriendlyDate,
  formatISODateLocal,
  getMemberDisplayName,
  getMotivoGroupLabel,
  getStatusBadgeColor,
  normalizeFamilyCodeInput,
  normalizePrimeraConsultaInfo,
} from '@/modules/home/agenda';
import { MOTIVO_CONSULTA_GROUPS } from '@/lib/motivosConsulta.js';

function AgendaForm({
  membersOptions,
  familiesById,
  defaultDate,
  onSubmit,
  onCancel,
  availableSlots = [],
  overbook = false,
}) {
  const [memberId, setMemberId] = useState(membersOptions[0]?.id || '');
  const [date, setDate] = useState(defaultDate || '');
  const [time, setTime] = useState('');
  const [motivo, setMotivo] = useState(membersOptions[0]?.diagnostico || 'Consulta de seguimiento');
  const [motivoPersonalizado, setMotivoPersonalizado] = useState(false);
  const [notas, setNotas] = useState('');
  const [familyCodeInput, setFamilyCodeInput] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [isPrimeraConsulta, setIsPrimeraConsulta] = useState(false);
  const [primeraNombre, setPrimeraNombre] = useState('');
  const [primeraApellido, setPrimeraApellido] = useState('');
  const [primeraEdad, setPrimeraEdad] = useState('');
  const [primeraMotivoGroup, setPrimeraMotivoGroup] = useState('');
  const [primeraErrors, setPrimeraErrors] = useState({});

  const normalizedFamilyCode = useMemo(
    () => normalizeFamilyCodeInput(familyCodeInput),
    [familyCodeInput],
  );

  const matchedFamily = useMemo(() => {
    if (!normalizedFamilyCode) return null;
    const targetCode = normalizedFamilyCode.toLowerCase();
    return (
      Object.values(familiesById).find((family) => (family.code || '').toLowerCase() === targetCode) || null
    );
  }, [familiesById, normalizedFamilyCode]);

  const filteredMemberOptions = useMemo(() => {
    if (matchedFamily) {
      const items = membersOptions.filter((opt) => opt.familyId === matchedFamily.id);
      if (items.length) {
        return items;
      }
    }
    return membersOptions;
  }, [matchedFamily, membersOptions]);

  useEffect(() => {
    if (isPrimeraConsulta) {
      setFamilyCodeInput('');
      setMemberId('');
      setMotivo('Primera consulta');
      setMotivoPersonalizado(true);
      setPrimeraErrors({});
      return;
    }

    const exists = filteredMemberOptions.some((opt) => opt.id === memberId);
    if (!exists) {
      const nextId = filteredMemberOptions[0]?.id || '';
      if (nextId !== memberId) {
        setMemberId(nextId);
        setMotivoPersonalizado(false);
      }
    }
  }, [filteredMemberOptions, memberId, isPrimeraConsulta]);

  useEffect(() => {
    if (isPrimeraConsulta) return;
    if (!motivoPersonalizado) {
      const selected = filteredMemberOptions.find((opt) => opt.id === memberId);
      setMotivo(selected?.diagnostico || 'Consulta de seguimiento');
    }
  }, [memberId, filteredMemberOptions, motivoPersonalizado, isPrimeraConsulta]);

  useEffect(() => {
    if (!isPrimeraConsulta) {
      setPrimeraNombre('');
      setPrimeraApellido('');
      setPrimeraEdad('');
      setPrimeraMotivoGroup('');
      setPrimeraErrors({});
    }
  }, [isPrimeraConsulta]);

  useEffect(() => {
    if (selectedSlotId && !availableSlots.some((slot) => slot.id === selectedSlotId)) {
      setSelectedSlotId('');
      setDate(defaultDate || '');
      setTime('');
    }
  }, [availableSlots, selectedSlotId, defaultDate]);

  const handleMotivoChange = (value) => {
    if (isPrimeraConsulta) return;
    setMotivo(value);
    setMotivoPersonalizado(true);
  };

  const handleFamilyCodeInput = (value) => {
    setFamilyCodeInput(value.toUpperCase());
  };

  const handleSlotSelect = (value) => {
    setSelectedSlotId(value);
    if (!value) {
      setDate(defaultDate || '');
      setTime('');
      return;
    }
    const slot = availableSlots.find((item) => item.id === value);
    if (slot) {
      setDate(slot.date);
      setTime(slot.time);
    }
  };

  useEffect(() => {
    if (!selectedSlotId && availableSlots.length) {
      const first = availableSlots[0];
      setSelectedSlotId(first.id);
      setDate(first.date);
      setTime(first.time);
      return;
    }
    if (!availableSlots.length) {
      setDate(defaultDate || '');
      setTime('');
    }
  }, [availableSlots, selectedSlotId, defaultDate]);

  const togglePrimeraConsulta = () => {
    setIsPrimeraConsulta((prev) => !prev);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!date || !time) return;
    if (!isPrimeraConsulta && !memberId) return;

    let primeraConsultaInfo = null;
    if (isPrimeraConsulta) {
      const nextErrors = {};
      const nombre = primeraNombre.trim();
      const apellido = primeraApellido.trim();
      const edadRaw = primeraEdad.trim();
      const edadNumber = Number(edadRaw);
      if (!nombre) {
        nextErrors.primeraNombre = 'Ingresá el nombre del paciente';
      }
      if (!apellido) {
        nextErrors.primeraApellido = 'Ingresá el apellido del paciente';
      }
      if (!edadRaw) {
        nextErrors.primeraEdad = 'Indicá la edad en años';
      } else if (!Number.isFinite(edadNumber) || edadNumber <= 0) {
        nextErrors.primeraEdad = 'Ingresá una edad válida';
      }
      if (!primeraMotivoGroup) {
        nextErrors.primeraMotivoGroup = 'Seleccioná un grupo principal';
      }
      if (Object.keys(nextErrors).length > 0) {
        setPrimeraErrors(nextErrors);
        return;
      }
      setPrimeraErrors({});
      primeraConsultaInfo = {
        nombre,
        apellido,
        edad: Math.round(edadNumber),
        motivoGroup: primeraMotivoGroup,
        motivoGroupLabel: getMotivoGroupLabel(primeraMotivoGroup),
      };
    }

    onSubmit({
      memberId: isPrimeraConsulta ? null : memberId,
      date,
      time,
      motivo: (isPrimeraConsulta ? 'Primera consulta' : motivo).trim(),
      notas: notas.trim(),
      primeraConsulta: isPrimeraConsulta,
      sobreturno: overbook,
      primeraConsultaInfo,
    });

    setDate(defaultDate || '');
    setTime('');
    setNotas('');
    setMotivoPersonalizado(false);
    setSelectedSlotId('');
    setIsPrimeraConsulta(false);
  };

  const hasMembers = filteredMemberOptions.length > 0;
  const primeraConsultaReady = !isPrimeraConsulta
    || (primeraNombre.trim() && primeraApellido.trim() && primeraEdad.trim() && primeraMotivoGroup);
  const canSubmit = Boolean(
    selectedSlotId
      && date
      && time
      && (isPrimeraConsulta || hasMembers)
      && primeraConsultaReady,
  );
  const familyFeedback =
    normalizedFamilyCode && !matchedFamily
      ? 'No se encontró una HC con ese número'
      : matchedFamily
      ? `HC ${matchedFamily.code} · ${matchedFamily.provincia || 'Provincia sin cargar'}`
      : '';

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-slate-500">Tipo de turno</span>
          <span className="text-[11px] text-slate-500">
            {isPrimeraConsulta ? 'No se requiere HC ni datos del paciente.' : 'Seleccioná si es una primera consulta.'}
          </span>
        </div>
        <button
          type="button"
          onClick={togglePrimeraConsulta}
          className={`px-3 py-2 rounded-xl border text-xs font-medium transition ${
            isPrimeraConsulta
              ? 'border-sky-400 bg-sky-600 text-white'
              : 'border-slate-300 text-slate-600 hover:bg-slate-100'
          }`}
        >
          {isPrimeraConsulta ? 'Primera consulta · activo' : 'Marcar como primera consulta'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {!isPrimeraConsulta && (
          <>
            <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
              Número de HC (AG)
              <input
                type="text"
                value={familyCodeInput}
                onChange={(e) => handleFamilyCodeInput(e.target.value)}
                placeholder="AG-0001"
                className="px-3 py-2 rounded-xl border border-slate-300 text-sm uppercase"
                autoComplete="off"
              />
              {familyFeedback ? (
                <span className={`text-[11px] ${matchedFamily ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {familyFeedback}
                </span>
              ) : (
                normalizedFamilyCode && <span className="text-[11px] text-slate-500">Formato sugerido: AG-0000</span>
              )}
            </label>
            <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
              Nombre del paciente
              <span className="text-[11px] text-slate-500">Seleccioná la persona asociada a la HC</span>
              <select
                value={memberId}
                onChange={(e) => {
                  setMemberId(e.target.value);
                  setMotivoPersonalizado(false);
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                disabled={!hasMembers}
              >
                {!hasMembers && <option value="">Sin pacientes disponibles</option>}
                {filteredMemberOptions.map((opt) => {
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
          </>
        )}
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1 md:col-span-2">
          Próximos turnos disponibles
          <span className="text-[11px] text-slate-500">
            {overbook ? 'Sobreturno activo: elegí un horario extra disponible.' : 'Elegí un horario disponible.'}
          </span>
          <select
            value={selectedSlotId}
            onChange={(e) => handleSlotSelect(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            disabled={!availableSlots.length}
            required
          >
            <option value="">
              {availableSlots.length ? 'Seleccionar turno sugerido…' : 'Sin turnos sugeridos disponibles'}
            </option>
            {availableSlots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {isPrimeraConsulta && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="required text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
            Nombre del paciente
            <span className="text-[11px] text-slate-500">Ingresá el nombre que figura en el documento</span>
            <input
              type="text"
              value={primeraNombre}
              onChange={(e) => setPrimeraNombre(e.target.value)}
              placeholder="Ej. Carolina"
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
              autoComplete="off"
            />
            {primeraErrors.primeraNombre && (
              <span className="text-[11px] text-rose-600">{primeraErrors.primeraNombre}</span>
            )}
          </label>
          <label className="required text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
            Apellido del paciente
            <span className="text-[11px] text-slate-500">Para identificar a la familia en la recepción</span>
            <input
              type="text"
              value={primeraApellido}
              onChange={(e) => setPrimeraApellido(e.target.value)}
              placeholder="Ej. Martínez"
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
              autoComplete="off"
            />
            {primeraErrors.primeraApellido && (
              <span className="text-[11px] text-rose-600">{primeraErrors.primeraApellido}</span>
            )}
          </label>
          <label className="required text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
            Edad
            <span className="text-[11px] text-slate-500">Edad aproximada en años de la persona que consulta</span>
            <input
              type="number"
              min="0"
              step="1"
              value={primeraEdad}
              onChange={(e) => setPrimeraEdad(e.target.value)}
              placeholder="Ej. 8"
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
            {primeraErrors.primeraEdad && (
              <span className="text-[11px] text-rose-600">{primeraErrors.primeraEdad}</span>
            )}
          </label>
          <label className="required text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
            Motivo principal (grupo)
            <span className="text-[11px] text-slate-500">Elegí el grupo que mejor describe el motivo de derivación</span>
            <select
              value={primeraMotivoGroup}
              onChange={(e) => setPrimeraMotivoGroup(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            >
              <option value="">Seleccionar grupo principal…</option>
              {MOTIVO_CONSULTA_GROUPS.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </select>
            {primeraErrors.primeraMotivoGroup && (
              <span className="text-[11px] text-rose-600">{primeraErrors.primeraMotivoGroup}</span>
            )}
          </label>
        </div>
      )}
      <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
        Motivo de la consulta
        <span className="text-[11px] text-slate-500">Describí brevemente el motivo principal del turno</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleMotivoChange('Primera consulta')}
            className="px-2 py-1 rounded-lg border border-slate-300 text-[11px] font-medium uppercase tracking-wide text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            disabled={isPrimeraConsulta}
          >
            Primera consulta
          </button>
        </div>
        <input
          type="text"
          value={motivo}
          onChange={(e) => handleMotivoChange(e.target.value)}
          placeholder="Ej. Control de seguimiento"
          className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          readOnly={isPrimeraConsulta}
        />
      </label>
      <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
        Notas internas
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Recordatorios para el equipo (opcional)"
          className="px-3 py-2 rounded-xl border border-slate-300 text-sm min-h-[60px]"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="px-4 py-2 rounded-xl border border-slate-300 bg-slate-900 text-white text-sm font-medium disabled:opacity-60"
          disabled={!canSubmit}
        >
          Guardar turno
        </button>
        <button
          type="button"
          onClick={() => {
            setIsPrimeraConsulta(false);
            onCancel?.();
          }}
          className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function AgendaList({
  items,
  membersById,
  familiesById,
  onStatusChange,
  onRemove,
  onOpenFamily,
  onCreateFamilyCase,
}) {
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
        const member = item.memberId ? membersById[item.memberId] : null;
        const family = item.familyId ? familiesById[item.familyId] : null;
        const isPrimeraConsulta = Boolean(item.primeraConsulta);
        const isSobreturno = Boolean(item.sobreturno);
        const wizardPending = Boolean(family?.intake?.wizardPending);
        const primeraInfo = normalizePrimeraConsultaInfo(
          item.primeraConsultaInfo
            || (item.metadata && typeof item.metadata === 'object' ? item.metadata.primeraConsultaInfo : null),
        );
        const primeraMotivoLabel = primeraInfo?.motivoGroupLabel || '';
        const primeraPacienteNombre = primeraInfo
          ? `${primeraInfo.nombre || ''} ${primeraInfo.apellido || ''}`.trim()
          : '';
        const name = isPrimeraConsulta ? 'Primera consulta' : getMemberDisplayName(member);
        const familyLabel = family
          ? `HC ${family.code} · ${family.provincia || 'Provincia sin cargar'}`
          : isPrimeraConsulta
          ? 'Sin HC asignada'
          : 'HC sin datos';
        const statusColor = getStatusBadgeColor(item.estado);

        return (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500">{item.time || 'Sin horario'} hs</div>
                <div className="text-base font-semibold text-slate-900">{name}</div>
                <div className="text-[11px] text-slate-500">{familyLabel}</div>
                {isPrimeraConsulta && (
                  <>
                    <div className="text-[11px] text-slate-600">
                      Paciente:{' '}
                      {primeraPacienteNombre || 'Sin datos'}{' '}
                      {primeraInfo?.edad ? `· ${primeraInfo.edad} años` : ''}
                    </div>
                    {primeraMotivoLabel && (
                      <div className="text-[11px] text-sky-700">Motivo: {primeraMotivoLabel}</div>
                    )}
                  </>
                )}
                {(isPrimeraConsulta || isSobreturno) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {isPrimeraConsulta && (
                      <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-sky-100 text-sky-700">
                        Primera consulta
                      </span>
                    )}
                    {isSobreturno && (
                      <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                        Sobreturno
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-medium px-2 py-1 rounded-full ${statusColor}`}>{item.estado}</span>
                <select
                  value={item.estado}
                  onChange={(e) => onStatusChange(item.id, e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {item.motivo && <div className="text-sm text-slate-700">{item.motivo}</div>}
            {item.notas && (
              <div className="text-xs text-slate-500 border-t border-dashed border-slate-200 pt-2">{item.notas}</div>
            )}
            <div className="flex flex-wrap gap-2">
              {family && (!isPrimeraConsulta || !wizardPending) && (
                <button
                  onClick={() => onOpenFamily(item.familyId)}
                  className="text-xs px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-50"
                >
                  Abrir HC
                </button>
              )}
              {isPrimeraConsulta && family && wizardPending && (
                <button
                  onClick={() => onOpenFamily(item.familyId)}
                  className="text-xs px-3 py-1 rounded-lg border border-sky-400 bg-sky-50 text-sky-700 hover:bg-sky-100 font-medium"
                >
                  Ingresar 1ra consulta
                </button>
              )}
              {isPrimeraConsulta && !family && onCreateFamilyCase && (
                <button
                  onClick={() => onCreateFamilyCase(item)}
                  className="text-xs px-3 py-1 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 font-medium"
                >
                  + Nueva HC familiar
                </button>
              )}
              <button
                onClick={() => onRemove(item.id)}
                className="text-xs px-3 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                Eliminar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TodayAgenda({
  selectedDate,
  onDateChange,
  appointments,
  membersOptions,
  membersById,
  familiesById,
  onCreateAppointment,
  onStatusChange,
  onRemoveAppointment,
  onOpenFamily,
  onCreateFamilyCase,
  availableSlots,
}) {
  const [adding, setAdding] = useState(false);
  const [overbookMode, setOverbookMode] = useState(false);
  const todayIso = useMemo(() => formatISODateLocal(new Date()), []);
  const isTodaySelected = selectedDate === todayIso;

  useEffect(() => {
    if (!adding) return;
    const handler = (event) => {
      if (event.key === 'Escape') setAdding(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [adding]);

  useEffect(() => {
    if (!adding) {
      setOverbookMode(false);
    }
  }, [adding]);

  const overbookSlots = useMemo(() => {
    if (!overbookMode) return [];
    const dateObj = new Date(selectedDate);
    if (Number.isNaN(dateObj.getTime())) return [];
    return buildOverbookSlotsForDate(dateObj, appointments);
  }, [overbookMode, selectedDate, appointments]);

  const slotsForForm = useMemo(() => {
    if (!overbookMode) return availableSlots;
    const combined = [...overbookSlots, ...availableSlots];
    const seen = new Set();
    return combined.filter((slot) => {
      if (seen.has(slot.id)) return false;
      seen.add(slot.id);
      return true;
    });
  }, [availableSlots, overbookMode, overbookSlots]);

  const friendlyDate = formatFriendlyDate(selectedDate);
  const handleOpenStandardForm = () => {
    if (adding && !overbookMode) {
      setAdding(false);
      return;
    }
    setOverbookMode(false);
    setAdding(true);
  };

  const handleOpenOverbookForm = () => {
    if (!isTodaySelected) {
      onDateChange(todayIso);
    }
    if (adding && overbookMode) {
      setAdding(false);
      return;
    }
    setOverbookMode(true);
    setAdding(true);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Agenda del día</div>
          <div className="text-[11px] text-slate-500">
            Consultas programadas para {friendlyDate || 'la fecha seleccionada'}.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <button
            onClick={handleOpenStandardForm}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm font-medium"
          >
            {adding ? 'Cerrar formulario' : '+ Nuevo turno'}
          </button>
          <button
            onClick={handleOpenOverbookForm}
            className="px-3 py-2 rounded-xl border border-amber-400 bg-amber-50 text-sm font-medium text-amber-700 hover:bg-amber-100"
          >
            {adding && overbookMode ? 'Cerrar sobreturno' : '+ Agregar sobreturno'}
          </button>
        </div>
      </div>
      {adding && (
        <AgendaForm
          membersOptions={membersOptions}
          familiesById={familiesById}
          defaultDate={selectedDate}
          availableSlots={slotsForForm}
          overbook={overbookMode}
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
        onCreateFamilyCase={onCreateFamilyCase}
      />
    </div>
  );
}
