// ===============================
// src/routes/HomePage.jsx — Pantalla de inicio
// ===============================
import React, { useEffect, useMemo, useState } from 'react';
import { useCenagemStore } from '@/store/cenagemStore';
import NewCaseModal from '@/components/NewCaseModal.jsx';
import { MOTIVO_CONSULTA_GROUPS } from '@/lib/motivosConsulta.js';

const uidLocal = () => Math.random().toString(36).slice(2, 10);
const AGENDA_STORAGE_KEY = 'cenagem-agenda-v1';

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
  const todayIso = new Date().toISOString().slice(0, 10);
  const slots = ['08:30', '09:30', '11:00', '13:00'];
  return members
    .filter((m) => m.rol === 'Proband')
    .slice(0, slots.length)
    .map((member, index) => ({
      id: `seed-${member.id}-${index}`,
      memberId: member.id,
      familyId: member.familyId,
      date: todayIso,
      time: slots[index] || '15:00',
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
  const [time, setTime] = useState('09:00');
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

    setTime('09:00');
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
        const statusColor =
          item.estado === 'Atendido'
            ? 'bg-emerald-100 text-emerald-700'
            : item.estado === 'Ausente'
              ? 'bg-rose-100 text-rose-700'
              : item.estado === 'En sala'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-amber-100 text-amber-700';

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

function FollowUpPanel({ items, membersById, familiesById, onOpenFamily }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">Seguimiento pendiente</div>
        <div className="text-[11px] text-slate-500">Pacientes pendientes de evolucionar de la ultima semana</div>
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-slate-500">No hay alertas en este momento.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const member = membersById[item.memberId];
            const family = familiesById[item.familyId];
            if (!member || !family) return null;
            const name = getMemberDisplayName(member);
            const lastLabel = item.lastEvolution
              ? new Date(item.lastEvolution).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
              : 'Sin registro';
            const daysLabel = Number.isFinite(item.daysSince) ? `${item.daysSince} días` : 'Sin registros';
            return (
              <div key={item.memberId} className="border border-amber-200 bg-amber-50/80 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{name}</div>
                    <div className="text-[11px] text-slate-500">HC {family.code} · {family.provincia || 'Provincia sin cargar'}</div>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-amber-200 text-amber-800">Revisión</span>
                </div>
                <div className="text-xs text-slate-600">Última evolución: {lastLabel}</div>
                <div className="text-xs text-slate-600">Pendiente hace: {daysLabel}</div>
                <div>
                  <button onClick={() => onOpenFamily(item.familyId)} className="text-xs px-3 py-1 rounded-lg border border-amber-300 hover:bg-amber-100">
                    Abrir HC
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
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
  const { state, STORAGE_KEY, createFamily, createMember, addEvolution } = useCenagemStore();
  const { families, members, evolutions } = state;

  const [showNewCase, setShowNewCase] = useState(false);
  const [creatingCase, setCreatingCase] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(agenda));
    } catch (error) {
      console.warn('No se pudo persistir la agenda en localStorage', error);
    }
  }, [agenda]);

  const membersById = useMemo(() => {
    const map = {};
    members.forEach((member) => {
      map[member.id] = member;
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
    window.location.hash = '#/family/' + familyId;
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
      const code = normalizeAgCode(payload.agNumber) || generateNextCode(families);
      const motivo = buildMotivoMetadata(payload.motivoGroup, payload.motivoDetail);
      const tags = Array.from(new Set([
        motivo.groupId,
        motivo.detailId,
        motivo.groupLabel?.toLowerCase(),
        motivo.detailLabel?.toLowerCase()
      ].filter(Boolean)));
      const medicoAsignado = (payload.medicoAsignado || '').trim();
      const family = createFamily({
        code,
        provincia: payload.provincia,
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
          estado: payload.consanguinidad,
          detalle: payload.consanguinidadDetalle
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
          createdAt: new Date().toISOString(),
          examen: {
            peso: payload.pacienteExamenPeso,
            talla: payload.pacienteExamenTalla,
            perimetroCefalico: payload.pacienteExamenPc,
            edadReferencia: payload.pacienteEdad
          }
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

      const examenFisico = {
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
        otras: payload.pacienteExamenOtras
      };
      Object.keys(examenFisico).forEach((key) => { if (!examenFisico[key]) delete examenFisico[key]; });

      const proband = createMember(family.id, {
        rol: 'Proband',
        filiatorios: { iniciales: 'A1', nombreCompleto: pacienteNombreCompleto || pacienteNombre || 'Paciente sin nombre' },
        nombre: pacienteNombreCompleto || pacienteNombre || 'Paciente sin nombre',
        contacto: { email: payload.pacienteEmail, telefono: payload.pacienteTelefono },
        direccion: payload.pacienteDireccion,
        diagnostico: motivoDiagnostico,
        sexo: payload.pacienteSexo || undefined,
        nacimiento: payload.pacienteNacimiento || undefined,
        profesion: payload.pacienteProfesion || undefined,
        obraSocial: payload.pacienteObraSocial || undefined,
        antecedentesPersonales: payload.pacienteAntecedentes || undefined,
        examenFisico: Object.keys(examenFisico).length ? examenFisico : undefined,
        notas
      });

      const b1Nombre = (payload.b1Nombre || '').trim();
      const b1Apellido = (payload.b1Apellido || '').trim();
      const b1NombreCompleto = [b1Nombre, b1Apellido].filter(Boolean).join(' ');
      if (b1NombreCompleto) {
        createMember(family.id, {
          rol: 'B1',
          filiatorios: { iniciales: 'B1', nombreCompleto: b1NombreCompleto },
          nombre: b1NombreCompleto,
          nacimiento: payload.b1Nacimiento || undefined,
          contacto: { email: payload.b1Email || undefined },
          profesion: payload.b1Profesion || undefined,
          obraSocial: payload.b1ObraSocial || undefined,
          antecedentesPersonales: payload.b1Antecedentes || undefined
        });
      }

      const c1Nombre = (payload.c1Nombre || '').trim();
      const c1Apellido = (payload.c1Apellido || '').trim();
      const c1NombreCompleto = [c1Nombre, c1Apellido].filter(Boolean).join(' ');
      if (c1NombreCompleto) {
        createMember(family.id, {
          rol: 'C1',
          filiatorios: { iniciales: 'C1', nombreCompleto: c1NombreCompleto },
          nombre: c1NombreCompleto,
          nacimiento: payload.c1Nacimiento || undefined,
          contacto: { email: payload.c1Email || undefined },
          profesion: payload.c1Profesion || undefined,
          obraSocial: payload.c1ObraSocial || undefined,
          antecedentesPersonales: payload.c1Antecedentes || undefined,
          obstetricos: {
            gestas: payload.c1Gestas,
            partos: payload.c1Partos,
            abortos: payload.c1Abortos,
            cesareas: payload.c1Cesareas
          }
        });
      }

      const resumen = [
        `Motivo: ${motivoDiagnostico}`,
        payload.motivoPaciente ? `Paciente: ${payload.motivoPaciente}` : '',
        payload.motivoDerivacion ? `Derivación: ${payload.motivoDerivacion}` : '',
        medicoAsignado ? `Profesional: ${medicoAsignado}` : '',
        payload.pacienteExamenPeso ? `Peso: ${payload.pacienteExamenPeso} kg` : '',
        payload.pacienteExamenTalla ? `Talla: ${payload.pacienteExamenTalla} cm` : '',
        payload.pacienteExamenPc ? `PC: ${payload.pacienteExamenPc} cm` : ''
      ].filter(Boolean).join(' | ');

      addEvolution(proband.id, resumen, user?.email || 'registro');

      setShowNewCase(false);
      window.location.hash = `#/family/${family.id}`;
    } catch (error) {
      console.error('Error creando la HC', error);
      alert('No se pudo crear la HC. Revisá los datos e intentá nuevamente.');
    } finally {
      setCreatingCase(false);
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
          <button onClick={() => setShowNewCase(true)} className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm font-medium">
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

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 pb-16">
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
        <FollowUpPanel
          items={followUps.slice(0, 5)}
          membersById={membersById}
          familiesById={familiesById}
          onOpenFamily={handleOpenFamily}
        />
      </div>

      <NewCaseModal
        open={showNewCase}
        busy={creatingCase}
        onClose={() => setShowNewCase(false)}
        onSubmit={handleCreateCase}
      />
      <FooterBar onAnalytics={() => { window.location.hash = 'analytics'; }} />
    </div>
  );
}










