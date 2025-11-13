// ===============================
// src/modules/home/components/TodayAgenda.jsx — Agenda diaria
// ===============================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import {
  buildOverbookSlotsForDate,
  formatFriendlyDate,
  formatISODateLocal,
  getMemberDisplayName,
  getMotivoGroupLabel,
  getStatusBadgeColor,
  getScheduleForWeekday,
  validateServiceDateConstraints,
  normalizeFamilyCodeInput,
  normalizeMotivoGroupId,
  normalizePrimeraConsultaInfo,
} from '@/modules/home/agenda';
import { MOTIVO_CONSULTA_GROUPS } from '@/lib/motivosConsulta.js';

const SERVICE_OPTIONS = [
  { value: 'clinica', label: 'Clínica' },
  { value: 'psicologia', label: 'Psicología' },
  { value: 'test-del-sudor', label: 'Test del Sudor' },
  { value: 'ecografia', label: 'Ecografía' },
  { value: 'prenatal', label: 'Prenatal (PUNCIÓN EMBARAZADAS)' },
  {
    value: 'laboratorio',
    label: 'Extracción de sangre o recepción de muestras de Laboratorio',
  },
];

const MEDICO_ATENDIO_OPTIONS = [
  { value: '', label: 'Seleccionar' },
  { value: 'VL', label: 'VL' },
  { value: 'CM', label: 'CM' },
  { value: 'AS', label: 'AS' },
  { value: 'otros', label: 'Otros' },
];

const CONFIRMACION_ASISTENCIA_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'no-confirmada', label: 'No asistirá' },
];

const PESQUISA_NEONATAL_OPTIONS = [
  { value: 'negativa', label: 'Negativa' },
  { value: 'positiva', label: 'Positiva' },
  { value: 'sin-datos', label: 'Sin datos' },
];

const ECOGRAFIA_ESTUDIO_OPTIONS = [
  { value: '', label: 'Seleccionar' },
  { value: 'feto-malformado', label: 'FETO MALFORMADO' },
  { value: 'riesgo-aumentado', label: 'RIESGO AUMENTADO' },
  { value: 'ppt-combinada', label: 'PPT COMBINADA' },
];

const PRENATAL_MUESTRA_OPTIONS = [
  { value: '', label: 'Seleccionar' },
  { value: 'liquido-amniotico', label: 'Líquido amniótico' },
  { value: 'vellosidad-corionica', label: 'Vellosidad coriónica' },
];

const LABORATORIO_MODALIDAD_OPTIONS = [
  { value: 'extraccion', label: 'Extracción de muestra' },
  { value: 'recepcion', label: 'Recepción de muestra' },
];

const createBaseClinicData = () => ({
  pacienteNombre: '',
  pacienteApellido: '',
  pacienteDni: '',
  pacienteMail: '',
  pacienteTelefono: '',
  pacienteObraSocial: '',
  pacienteEdad: '',
  pacienteAg: '',
  diagnosticoMotivo: '',
  derivacion: '',
  medicoDerivante: '',
  confirmacionAsistencia: 'pendiente',
  medicoAtendio: '',
  medicoAtendioOtro: '',
  embarazada: false,
  embarazadaEstudio: '',
});

const createTestDelSudorData = () => ({
  ...createBaseClinicData(),
  pesquisaNeonatal: '',
  resultadoCloruro: '',
  condicionTest: '',
  otrosEstudiosCngm: '',
  otrosEstudiosExternos: '',
});

const createEcografiaData = () => ({
  ...createBaseClinicData(),
  estudio: '',
});

const createPrenatalData = () => ({
  pacienteNombre: '',
  pacienteApellido: '',
  pacienteDni: '',
  pacienteObraSocial: '',
  pacienteAg: '',
  edadMaterna: '',
  edadPaterna: '',
  tipoMuestra: '',
  edadGestacional: '',
  motivoPuncion: '',
  medicoDerivante: '',
  confirmacionAsistencia: 'pendiente',
  medicoAtendio: '',
  medicoAtendioOtro: '',
  observaciones: '',
});

const createLaboratorioData = () => ({
  pacienteNombre: '',
  pacienteApellido: '',
  pacienteDni: '',
  pacienteAg: '',
  pacienteEdad: '',
  pacienteObraSocial: '',
  procedencia: '',
  medico: '',
  telefono: '',
  indicacion1: '',
  indicacion2: '',
  urgente: false,
  modalidad: '',
  tiposSeleccionados: {
    citogenetica: false,
    adn: false,
    molecular: false,
    experimental: false,
    oncohemato: false,
  },
  citogenetica: {
    cariotipo: false,
  },
  molecular: {
    frax: false,
    hsc: false,
    steinert: false,
    mlst: false,
    mlcen: false,
    veintidosQ: false,
    exoma: false,
    otro: false,
    otroDetalle: '',
  },
  experimental: {
    fq: false,
    panelCancer: false,
    azf: false,
    otro: false,
    otroDetalle: '',
  },
  otrosEstudios: '',
  cultivoAnteriorNumero: '',
  confirmacionAsistencia: 'pendiente',
  observaciones: '',
});

const createInitialServiceForms = () => ({
  clinica: createBaseClinicData(),
  psicologia: createBaseClinicData(),
  'test-del-sudor': createTestDelSudorData(),
  ecografia: createEcografiaData(),
  prenatal: createPrenatalData(),
  laboratorio: createLaboratorioData(),
});

function getAppointmentBackgroundColor(item, primeraInfo) {
  const isPrimeraConsulta = Boolean(item.primeraConsulta);
  const motivoGroup = primeraInfo?.motivoGroup;
  const motivo = (item.motivo || '').toLowerCase();

  let motiveId = '';
  if (isPrimeraConsulta && motivoGroup) {
    motiveId = motivoGroup;
  } else if (motivo) {
    if (motivo.includes('prenatal')) motiveId = 'hallazgos-prenatales';
    else if (motivo.includes('malformaci')) motiveId = 'malformaciones';
    else if (motivo.includes('retraso')) motiveId = 'retraso-desarrollo';
    else if (motivo.includes('cáncer') || motivo.includes('oncol')) motiveId = 'cancer-familiar';
    else if (motivo.includes('reproductivo')) motiveId = 'problemas-reproductivos';
    else if (motivo.includes('antecedentes')) motiveId = 'antecedentes-familiares';
  }

  switch (motiveId) {
    case 'hallazgos-prenatales':
      return 'bg-pink-200';
    case 'malformaciones':
      return 'bg-sky-200';
    case 'retraso-desarrollo':
      return 'bg-amber-200';
    case 'cancer-familiar':
      return 'bg-purple-200';
    case 'problemas-reproductivos':
      return 'bg-indigo-200';
    case 'antecedentes-familiares':
      return 'bg-green-200';
    default:
      return 'bg-white';
  }
}

function FieldError({ message }) {
  if (!message) return null;
  return <span className="text-[11px] text-rose-600">{message}</span>;
}

function ClinicPatientFields({
  data,
  errors,
  onChange,
  serviceLabel,
  showEmbarazada = true,
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="text-xs uppercase tracking-wide text-slate-500">
          Datos del paciente · {serviceLabel}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
            Nombre *
            <input
              type="text"
              value={data.pacienteNombre || ''}
              onChange={(e) => onChange({ pacienteNombre: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <FieldError message={errors.pacienteNombre} />
          </label>
          <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
            Apellido *
            <input
              type="text"
              value={data.pacienteApellido || ''}
              onChange={(e) => onChange({ pacienteApellido: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <FieldError message={errors.pacienteApellido} />
          </label>
          <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
            DNI *
            <input
              type="text"
              value={data.pacienteDni || ''}
              onChange={(e) => onChange({ pacienteDni: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <FieldError message={errors.pacienteDni} />
          </label>
          <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
            Teléfono *
            <input
              type="tel"
              value={data.pacienteTelefono || ''}
              onChange={(e) => onChange({ pacienteTelefono: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <FieldError message={errors.pacienteTelefono} />
          </label>
          <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
            Mail
            <input
              type="email"
              value={data.pacienteMail || ''}
              onChange={(e) => onChange({ pacienteMail: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
              placeholder="paciente@correo.com"
            />
          </label>
          <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
            Obra social / Prepaga
            <input
              type="text"
              value={data.pacienteObraSocial || ''}
              onChange={(e) => onChange({ pacienteObraSocial: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </label>
          <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
            Edad
            <input
              type="number"
              min="0"
              value={data.pacienteEdad || ''}
              onChange={(e) => onChange({ pacienteEdad: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </label>
        </div>
      </div>
      <div className="grid gap-2">
        <div className="text-xs uppercase tracking-wide text-slate-500">Derivación y asistencia</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
            Derivación
            <input
              type="text"
              value={data.derivacion || ''}
              onChange={(e) => onChange({ derivacion: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
              placeholder="Hospital / Servicio"
            />
          </label>
          <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
            Médico derivante
            <input
              type="text"
              value={data.medicoDerivante || ''}
              onChange={(e) => onChange({ medicoDerivante: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </label>
          <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
            Confirmación de asistencia
            <select
              value={data.confirmacionAsistencia || 'pendiente'}
              onChange={(e) => onChange({ confirmacionAsistencia: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            >
              {CONFIRMACION_ASISTENCIA_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.confirmacionAsistencia} />
          </label>
        </div>
        {showEmbarazada && (
          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(data.embarazada)}
                onChange={(e) => onChange({ embarazada: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
              />
              <span>Embarazada</span>
            </label>
            {data.embarazada && (
              <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
                Estudio sugerido para ecografía
                <select
                  value={data.embarazadaEstudio || ''}
                  onChange={(e) => onChange({ embarazadaEstudio: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                >
                  {ECOGRAFIA_ESTUDIO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.embarazadaEstudio} />
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
function AgendaForm({
  membersOptions,
  familiesById,
  defaultDate,
  onSubmit,
  onCancel,
  availableSlots = [],
  overbook = false,
  service = 'clinica',
  onEnsureFamilyDetail,
  editingAppointment = null,
}) {
  const slotsForSelectedDate = useMemo(() => {
    if (!defaultDate) return availableSlots;
    return availableSlots.filter((slot) => slot.date === defaultDate);
  }, [availableSlots, defaultDate]);
  const isEditing = Boolean(editingAppointment);
  const editingSummary = useMemo(() => {
    if (!editingAppointment) return '';
    const friendly = editingAppointment.date ? formatFriendlyDate(editingAppointment.date) : '';
    const timeLabel = editingAppointment.time ? `${editingAppointment.time} hs` : '';
    return [friendly, timeLabel].filter(Boolean).join(' · ');
  }, [editingAppointment]);
  const editingPatientLabel = useMemo(() => {
    if (!editingAppointment) return '';
    if (editingAppointment.primeraConsulta) {
      const info = normalizePrimeraConsultaInfo(
        editingAppointment.primeraConsultaInfo
          || (editingAppointment.metadata && editingAppointment.metadata.primeraConsultaInfo)
          || null,
      );
      return [info?.nombre, info?.apellido].filter(Boolean).join(' ').trim();
    }
    const member = membersOptions.find((opt) => opt.id === editingAppointment.memberId);
    return getMemberDisplayName(member) || '';
  }, [editingAppointment, membersOptions]);
  const [memberId, setMemberId] = useState(membersOptions[0]?.id || '');
  const [date, setDate] = useState(defaultDate || '');
  const [time, setTime] = useState('');
  const [motivo, setMotivo] = useState(membersOptions[0]?.diagnostico || 'Consulta de seguimiento');
  const [motivoPersonalizado, setMotivoPersonalizado] = useState(false);
  const [notas, setNotas] = useState('');
  const [familyCodeInput, setFamilyCodeInput] = useState('');
  const [familyCodeLookup, setFamilyCodeLookup] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [isPrimeraConsulta, setIsPrimeraConsulta] = useState(false);
  const [primeraMotivoGroup, setPrimeraMotivoGroup] = useState('');
  const [primeraErrors, setPrimeraErrors] = useState({});
  const [formError, setFormError] = useState('');
  const normalizedService =
    (typeof service === 'string' && service.trim().toLowerCase()) || 'clinica';
  const prevIsPrimeraConsultaRef = useRef(isPrimeraConsulta);
  const [serviceForms, setServiceForms] = useState(() => createInitialServiceForms());
  const [serviceErrors, setServiceErrors] = useState({});
  const lastLinkedMemberIdRef = useRef('');
  const lastLinkedFamilyIdRef = useRef('');
  const requestedFamilyDetailRef = useRef(new Set());
  const updateServiceData = useCallback(
    (patch) => {
      setServiceForms((prev) => {
        const current = prev[normalizedService] || {};
        const next =
          typeof patch === 'function' ? patch(current) : { ...current, ...patch };
        if (next === current) return prev;
        return {
          ...prev,
          [normalizedService]: next,
        };
      });
      setServiceErrors({});
    },
    [normalizedService],
  );

  const normalizeStringValue = useCallback((value) => {
    if (value == null) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return '';
  }, []);
  const getOptionFamilyId = useCallback((opt) => {
    if (!opt) return '';
    if (opt.familyId != null) return String(opt.familyId).trim();
    if (opt.family?.id != null) return String(opt.family.id).trim();
    if (opt.metadata?.familyId != null) return String(opt.metadata.familyId).trim();
    return '';
  }, []);

  const firstNonEmpty = useCallback(
    (...values) => {
      for (const value of values) {
        const normalized = normalizeStringValue(value);
        if (normalized) return normalized;
      }
      return '';
    },
    [normalizeStringValue],
  );

  const computeAgeFromBirth = useCallback(
    (isoDate) => {
      const normalized = normalizeStringValue(isoDate);
      if (!normalized) return '';
      const birth = new Date(normalized);
      if (Number.isNaN(birth.getTime())) return '';
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age -= 1;
      }
      if (!Number.isFinite(age) || age < 0) return '';
      return String(age);
    },
    [normalizeStringValue],
  );

  const asObject = useCallback(
    (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {}),
    [],
  );

  const serviceLabel = useMemo(() => {
    const match = SERVICE_OPTIONS.find((opt) => opt.value === normalizedService);
    return match ? match.label : 'Servicio';
  }, [normalizedService]);

  const serviceData = useMemo(
    () => serviceForms[normalizedService] || {},
    [serviceForms, normalizedService],
  );

  const normalizedFamilyCode = useMemo(
    () => normalizeFamilyCodeInput(familyCodeLookup),
    [familyCodeLookup],
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
      const matchedId =
        matchedFamily.id != null ? String(matchedFamily.id).trim() : '';
      const items = membersOptions.filter((opt) => {
        const optionFamilyId = getOptionFamilyId(opt);
        return matchedId && optionFamilyId && optionFamilyId === matchedId;
      });
      if (items.length) {
        return items;
      }
    }
    return membersOptions;
  }, [getOptionFamilyId, matchedFamily, membersOptions]);

  useEffect(() => {
    if (!matchedFamily?.id) return;
    if (typeof onEnsureFamilyDetail !== 'function') return;
    const matchedId = String(matchedFamily.id).trim();
    if (!matchedId) return;
    const hasOptions = membersOptions.some((opt) => getOptionFamilyId(opt) === matchedId);
    if (hasOptions) return;
    const requested = requestedFamilyDetailRef.current;
    if (requested.has(matchedId)) return;
    requested.add(matchedId);
    Promise.resolve(onEnsureFamilyDetail(matchedFamily.id)).catch(() => {
      requested.delete(matchedId);
    });
  }, [getOptionFamilyId, matchedFamily, membersOptions, onEnsureFamilyDetail]);

  useEffect(() => {
    if (!editingAppointment) return;
    setFormError('');
    setSelectedSlotId('');
    const nextDate = editingAppointment.date || defaultDate || '';
    setDate(nextDate);
    setTime(editingAppointment.time || '');
    setNotas(editingAppointment.notas || '');
    setMotivo(
      editingAppointment.primeraConsulta ? 'Primera consulta' : editingAppointment.motivo || 'Consulta de seguimiento',
    );
    setMotivoPersonalizado(true);
    setIsPrimeraConsulta(Boolean(editingAppointment.primeraConsulta));
    setPrimeraErrors({});
    if (editingAppointment.primeraConsulta) {
      const primeraInfo = normalizePrimeraConsultaInfo(
        editingAppointment.primeraConsultaInfo
          || (editingAppointment.metadata && editingAppointment.metadata.primeraConsultaInfo)
          || null,
      );
      const storedMotivoGroup =
        editingAppointment.primeraMotivoGroup
        || editingAppointment.serviceDetails?.data?.primeraMotivoGroup
        || editingAppointment.metadata?.primeraMotivoGroup
        || '';
      const storedMotivoGroupLabel =
        primeraInfo?.motivoGroupLabel
        || editingAppointment.primeraMotivoGroupLabel
        || editingAppointment.serviceDetails?.data?.primeraMotivoGroupLabel
        || editingAppointment.metadata?.primeraMotivoGroupLabel
        || '';
      const resolvedMotivoGroupId = normalizeMotivoGroupId(
        primeraInfo?.motivoGroup || storedMotivoGroup || storedMotivoGroupLabel,
      );
      setPrimeraMotivoGroup(resolvedMotivoGroupId);
      setFamilyCodeInput('');
      setFamilyCodeLookup('');
    } else {
      const familyCode =
        editingAppointment.familyId && familiesById[editingAppointment.familyId]
          ? familiesById[editingAppointment.familyId].code
          : '';
      if (familyCode) {
        const upper = familyCode.toUpperCase();
        setFamilyCodeInput(upper);
        setFamilyCodeLookup(upper);
      } else {
        setFamilyCodeInput('');
        setFamilyCodeLookup('');
      }
      if (editingAppointment.memberId) {
        setMemberId(editingAppointment.memberId);
      }
    }
    const serviceDataFromAppointment =
      (editingAppointment.serviceDetails && editingAppointment.serviceDetails.data)
      || editingAppointment.serviceDetails
      || (editingAppointment.metadata && editingAppointment.metadata.serviceDetails)
      || null;
    if (serviceDataFromAppointment) {
      setServiceForms((prev) => ({
        ...prev,
        [normalizedService]: {
          ...(createInitialServiceForms()[normalizedService] || {}),
          ...serviceDataFromAppointment,
        },
      }));
    }
    setServiceErrors({});
  }, [editingAppointment, familiesById, normalizedService, defaultDate]);

  const selectedMember = useMemo(() => {
    if (!memberId) return null;
    return filteredMemberOptions.find((opt) => opt.id === memberId) || null;
  }, [filteredMemberOptions, memberId]);

  const familyFromMember = useMemo(() => {
    if (!selectedMember?.familyId) return null;
    return familiesById[selectedMember.familyId] || null;
  }, [selectedMember, familiesById]);

  const activeFamily = useMemo(
    () => matchedFamily || familyFromMember || null,
    [matchedFamily, familyFromMember],
  );

  const displayPatientName = useMemo(() => {
    const dataName = [normalizeStringValue(serviceData.pacienteNombre), normalizeStringValue(serviceData.pacienteApellido)]
      .filter(Boolean)
      .join(' ');
    const memberFull = normalizeStringValue(selectedMember?.filiatorios?.nombreCompleto);
    const memberCombined = [normalizeStringValue(selectedMember?.nombre), normalizeStringValue(selectedMember?.apellido)]
      .filter(Boolean)
      .join(' ');
    return firstNonEmpty(dataName, memberFull, memberCombined);
  }, [firstNonEmpty, normalizeStringValue, selectedMember, serviceData]);

  const displayPatientDni = useMemo(
    () =>
      firstNonEmpty(
        serviceData.pacienteDni,
        selectedMember?.documentNumber,
        selectedMember?.documento,
        selectedMember?.dni,
      ),
    [firstNonEmpty, selectedMember, serviceData],
  );

  const displayPatientAg = useMemo(
    () => firstNonEmpty(serviceData.pacienteAg, normalizedFamilyCode, activeFamily?.code),
    [activeFamily, firstNonEmpty, normalizedFamilyCode, serviceData],
  );

  useEffect(() => {
    setServiceForms((prev) => {
      if (prev[normalizedService]) return prev;
      const defaults = createInitialServiceForms();
      return {
        ...prev,
        [normalizedService]: defaults[normalizedService] || {},
      };
    });
  }, [normalizedService]);

  useEffect(() => {
    setServiceErrors({});
    setFormError('');
  }, [normalizedService]);

  useEffect(() => {
    const agValue = normalizedFamilyCode || familyCodeInput || '';
    setServiceForms((prev) => {
      const current = prev[normalizedService] || {};
      if (current.pacienteAg === agValue) return prev;
      return {
        ...prev,
        [normalizedService]: {
          ...current,
          pacienteAg: agValue,
        },
      };
    });
  }, [normalizedService, normalizedFamilyCode, familyCodeInput]);

  useEffect(() => {
    if (isPrimeraConsulta) {
      lastLinkedMemberIdRef.current = '';
      lastLinkedFamilyIdRef.current = '';
      return;
    }
    if (!selectedMember && !activeFamily) {
      lastLinkedMemberIdRef.current = '';
      lastLinkedFamilyIdRef.current = '';
      return;
    }

    const currentData = serviceData || {};
    const currentMemberId = normalizeStringValue(selectedMember?.id);
    const currentFamilyId = normalizeStringValue(activeFamily?.id);
    const previousMemberId = lastLinkedMemberIdRef.current || '';
    const previousFamilyId = lastLinkedFamilyIdRef.current || '';
    const memberChanged = Boolean(currentMemberId && currentMemberId !== previousMemberId);
    const familyChanged = Boolean(currentFamilyId && currentFamilyId !== previousFamilyId);
    const memberCleared = !currentMemberId && !!previousMemberId;
    const familyCleared = !currentFamilyId && !!previousFamilyId;
    const allowOverwrite =
      memberChanged || familyChanged || memberCleared || familyCleared || (!previousMemberId && !previousFamilyId);

    const family = activeFamily;
    const intake = asObject(family?.intake);
    const administrativo = asObject(intake.administrativo);
    const wizardPayload = asObject(intake.wizardPayload);
    const contactInfo = asObject(family?.filiatoriosContacto);
    const memberContact = asObject(selectedMember?.contacto);
    const memberMetadata = asObject(selectedMember?.metadata);

    const fullName = normalizeStringValue(selectedMember?.filiatorios?.nombreCompleto);
    let fallbackFirstName = '';
    let fallbackLastName = '';
    if (fullName) {
      const parts = fullName.split(/\s+/).filter(Boolean);
      fallbackFirstName = parts[0] || '';
      fallbackLastName = parts.slice(1).join(' ');
    }

    const resetKeys = new Set();
    const patch = {};
    const markForReset = (key) => {
      if (!allowOverwrite) return;
      const existing = normalizeStringValue(currentData[key]);
      if (!existing) return;
      resetKeys.add(key);
    };
    const ensureAssign = (key, candidate) => {
      const normalizedCandidate = normalizeStringValue(candidate);
      if (!normalizedCandidate) {
        markForReset(key);
        return;
      }
      const existing = normalizeStringValue(currentData[key]);
      if (existing === normalizedCandidate) return;
      if (existing && !allowOverwrite) return;
      patch[key] = normalizedCandidate;
    };

    ensureAssign(
      'pacienteNombre',
      firstNonEmpty(
        selectedMember?.nombre,
        administrativo.pacienteNombre,
        wizardPayload.pacienteNombre,
        fallbackFirstName,
      ),
    );

    ensureAssign(
      'pacienteApellido',
      firstNonEmpty(
        selectedMember?.apellido,
        administrativo.pacienteApellido,
        wizardPayload.pacienteApellido,
        fallbackLastName || (fullName && !fallbackFirstName ? fullName : ''),
      ),
    );

    ensureAssign(
      'pacienteDni',
      firstNonEmpty(
        selectedMember?.documentNumber,
        selectedMember?.dni,
        selectedMember?.documento,
        memberMetadata.documento,
        memberMetadata.dni,
        administrativo.pacienteDni,
        wizardPayload.pacienteDni,
      ),
    );

    ensureAssign(
      'pacienteTelefono',
      firstNonEmpty(
        memberContact.telefono,
        memberContact.telefono1,
        memberContact.telefono2,
        memberContact.movil,
        memberContact.celular,
        memberContact.phone,
        memberMetadata.telefono,
        memberMetadata.telefono1,
        memberMetadata.telefonoContacto,
        administrativo.pacienteTelefono,
        administrativo.contactoTelefono1,
        administrativo.contactoTelefono2,
        wizardPayload.pacienteTelefono,
        wizardPayload.contactoTelefono1,
        wizardPayload.contactoTelefono2,
        contactInfo.telefono,
        contactInfo.telefonoAlternativo,
      ),
    );

    ensureAssign(
      'pacienteMail',
      firstNonEmpty(
        memberContact.email,
        memberMetadata.email,
        administrativo.pacienteEmail,
        wizardPayload.pacienteEmail,
        contactInfo.email,
      ),
    );

    ensureAssign(
      'pacienteObraSocial',
      firstNonEmpty(
        selectedMember?.os,
        memberMetadata.obraSocial,
        administrativo.pacienteObraSocial,
        wizardPayload.pacienteObraSocial,
      ),
    );

    ensureAssign(
      'pacienteEdad',
      firstNonEmpty(
        administrativo.pacienteEdad,
        wizardPayload.pacienteEdad,
        computeAgeFromBirth(selectedMember?.nacimiento),
      ),
    );

    ensureAssign(
      'pacienteAg',
      firstNonEmpty(
        normalizedFamilyCode,
        administrativo.agNumber,
        wizardPayload.agNumber,
        family?.code,
      ),
    );

    ensureAssign(
      'diagnosticoMotivo',
      firstNonEmpty(
        selectedMember?.diagnostico,
        memberMetadata.diagnostico,
        administrativo.diagnostico,
        administrativo.motivoConsulta,
        wizardPayload.diagnostico,
        wizardPayload.motivoConsulta,
        family?.motivo?.detailLabel,
        family?.motivo?.groupLabel,
      ),
    );

    ensureAssign(
      'confirmacionAsistencia',
      firstNonEmpty(
        administrativo.confirmacionAsistencia,
        wizardPayload.confirmacionAsistencia,
        'pendiente',
      ),
    );

    if (normalizedService === 'prenatal') {
      ensureAssign(
        'medicoDerivante',
        firstNonEmpty(administrativo.medicoDerivante, wizardPayload.medicoDerivante),
      );
      ensureAssign(
        'edadGestacional',
        firstNonEmpty(administrativo.edadGestacional, wizardPayload.edadGestacional),
      );
      ensureAssign('edadMaterna', firstNonEmpty(administrativo.edadMaterna, wizardPayload.edadMaterna));
      ensureAssign('edadPaterna', firstNonEmpty(administrativo.edadPaterna, wizardPayload.edadPaterna));
      ensureAssign('tipoMuestra', firstNonEmpty(administrativo.tipoMuestra, wizardPayload.tipoMuestra));
      ensureAssign('motivoPuncion', firstNonEmpty(administrativo.motivoPuncion, wizardPayload.motivoPuncion));
    }

    if (normalizedService === 'laboratorio') {
      ensureAssign(
        'procedencia',
        firstNonEmpty(administrativo.pacienteProcedencia, wizardPayload.pacienteProcedencia),
      );
      ensureAssign('medico', firstNonEmpty(administrativo.medicoDerivante, wizardPayload.medicoDerivante));
      ensureAssign('indicacion1', firstNonEmpty(administrativo.indicacion1, wizardPayload.indicacion1));
      ensureAssign('indicacion2', firstNonEmpty(administrativo.indicacion2, wizardPayload.indicacion2));
    }

    const hasResets = resetKeys.size > 0;
    const patchEntries = Object.entries(patch);

    if (hasResets || patchEntries.length > 0) {
      updateServiceData((current) => {
        const next = { ...current };
        let changed = false;

        if (hasResets) {
          resetKeys.forEach((key) => {
            if (key in next) {
              delete next[key];
              changed = true;
            }
          });
        }

        patchEntries.forEach(([key, value]) => {
          const existing = normalizeStringValue(next[key]);
          if (existing === value) return;
          next[key] = value;
          changed = true;
        });

        return changed ? next : current;
      });
    }

    lastLinkedMemberIdRef.current = currentMemberId;
    lastLinkedFamilyIdRef.current = currentFamilyId;
  }, [
    activeFamily,
    asObject,
    computeAgeFromBirth,
    firstNonEmpty,
    isPrimeraConsulta,
    normalizedFamilyCode,
    normalizedService,
    normalizeStringValue,
    selectedMember,
    serviceData,
    updateServiceData,
  ]);

  useEffect(() => {
    if (isPrimeraConsulta) {
      setFamilyCodeInput('');
      setMemberId('');
      setMotivo('Primera consulta');
      setMotivoPersonalizado(true);
      setPrimeraErrors({});
      return;
    }

    if (!filteredMemberOptions.length) {
      if (memberId) setMemberId('');
      setMotivoPersonalizado(false);
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
    if (!isPrimeraConsulta && prevIsPrimeraConsultaRef.current) {
      setPrimeraMotivoGroup('');
      setPrimeraErrors({});
    }
    prevIsPrimeraConsultaRef.current = isPrimeraConsulta;
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

  const handleFamilyCodeInput = useCallback((value) => {
    const upperValue = value.toUpperCase();
    setFamilyCodeInput(upperValue);
    setFamilyCodeLookup((prev) => (prev && prev !== upperValue ? '' : prev));
  }, []);

  const handleFamilyCodeConfirm = useCallback(() => {
    const trimmed = familyCodeInput.trim().toUpperCase();
    setFamilyCodeLookup(trimmed);
  }, [familyCodeInput]);

  const handleFamilyCodeKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleFamilyCodeConfirm();
      }
    },
    [handleFamilyCodeConfirm],
  );

  const handleSlotSelect = (value) => {
    setFormError('');
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
      setFormError('');
      setSelectedSlotId(first.id);
      setDate(first.date);
      setTime(first.time);
      return;
    }
    if (!availableSlots.length) {
      setFormError('');
      setDate(defaultDate || '');
      setTime('');
    }
  }, [availableSlots, selectedSlotId, defaultDate]);

  const togglePrimeraConsulta = () => {
    setIsPrimeraConsulta((prev) => {
      const next = !prev;
      if (!next) {
        setServiceErrors({});
      }
      return next;
    });
  };

  useEffect(() => {
    setFormError('');
  }, [overbook]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError('');
    if (!date || !time) return;
    if (!isPrimeraConsulta && !memberId) return;

    let latestServiceErrors = {};
    if (isPrimeraConsulta) {
      latestServiceErrors = validateServiceData(normalizedService, serviceData);
      const nombre = primeraPacienteNombre;
      const apellido = primeraPacienteApellido;
      const edadRaw = primeraPacienteEdad;
      const edadNumber = Number(edadRaw);
      if (!nombre) {
        latestServiceErrors.pacienteNombre = 'Ingresá el nombre del paciente';
      }
      if (!apellido) {
        latestServiceErrors.pacienteApellido = 'Ingresá el apellido del paciente';
      }
      if (!edadRaw) {
        latestServiceErrors[primeraEdadFieldKey] = 'Indicá la edad en años';
      } else if (!Number.isFinite(edadNumber) || edadNumber <= 0) {
        latestServiceErrors[primeraEdadFieldKey] = 'Ingresá una edad válida';
      }
      if (Object.keys(latestServiceErrors).length > 0) {
        setServiceErrors(latestServiceErrors);
        return;
      }
    } else {
      setServiceErrors({});
    }

    const constraintError = validateServiceDateConstraints({
      service: normalizedService,
      date,
      time,
      serviceData,
      sobreturno: overbook,
    });
    if (constraintError) {
      setFormError(constraintError);
      return;
    }

    let primeraConsultaInfo = null;
    let primeraMotivoGroupLabelValue = '';
    if (isPrimeraConsulta) {
      const nextErrors = {};
      if (!primeraMotivoGroup) {
        nextErrors.primeraMotivoGroup = 'Seleccioná un grupo principal';
      }
      if (Object.keys(nextErrors).length > 0) {
        setPrimeraErrors(nextErrors);
        return;
      }
      setPrimeraErrors({});
      const edadNumber = Number(primeraPacienteEdad);
      primeraMotivoGroupLabelValue = getMotivoGroupLabel(primeraMotivoGroup);
      primeraConsultaInfo = {
        nombre: primeraPacienteNombre,
        apellido: primeraPacienteApellido,
        edad: Number.isFinite(edadNumber) ? Math.round(edadNumber) : null,
        motivoGroup: primeraMotivoGroup,
        motivoGroupLabel: primeraMotivoGroupLabelValue,
      };
    }

    const finalMotivo = (isPrimeraConsulta ? 'Primera consulta' : motivo).trim();
    const observaciones = notas.trim();
    const servicePayload = {
      ...serviceData,
      diagnosticoMotivo: finalMotivo,
      observaciones,
    };
    if (isPrimeraConsulta) {
      servicePayload.primeraMotivoGroup = primeraMotivoGroup;
      servicePayload.primeraMotivoGroupLabel = getMotivoGroupLabel(primeraMotivoGroup);
    }
    if (!trimValue(servicePayload.pacienteAg)) {
      const agSource = normalizedFamilyCode || familyCodeInput || '';
      if (agSource) {
        servicePayload.pacienteAg = agSource;
      }
    } else if (typeof servicePayload.pacienteAg === 'string') {
      servicePayload.pacienteAg = servicePayload.pacienteAg.trim().toUpperCase();
    }

    onSubmit({
      memberId: isPrimeraConsulta ? null : memberId,
      date,
      time,
      motivo: finalMotivo,
      notas: observaciones,
      primeraConsulta: isPrimeraConsulta,
      sobreturno: overbook,
      primeraConsultaInfo,
      primeraMotivoGroup: isPrimeraConsulta ? primeraMotivoGroup : null,
      primeraMotivoGroupLabel: isPrimeraConsulta ? primeraMotivoGroupLabelValue : '',
      serviceDetails: {
        service: normalizedService,
        serviceLabel,
        data: servicePayload,
      },
      appointmentId: editingAppointment?.id,
    });

    setDate(defaultDate || '');
    setTime('');
    setNotas('');
    setMotivoPersonalizado(false);
    setSelectedSlotId('');
    setIsPrimeraConsulta(false);
    setServiceForms((prev) => ({
      ...prev,
      [normalizedService]: createInitialServiceForms()[normalizedService] || {},
    }));
    setServiceErrors({});
    setFormError('');
  };

  const hasMembers = filteredMemberOptions.length > 0;
  const hasPacienteEdadField = Object.prototype.hasOwnProperty.call(
    serviceData,
    'pacienteEdad',
  );
  const hasEdadMaternaField = Object.prototype.hasOwnProperty.call(
    serviceData,
    'edadMaterna',
  );
  const primeraEdadFieldKey = hasPacienteEdadField ? 'pacienteEdad' : hasEdadMaternaField ? 'edadMaterna' : 'pacienteEdad';
  const primeraEdadSourceValue = hasPacienteEdadField
    ? serviceData.pacienteEdad
    : hasEdadMaternaField
      ? serviceData.edadMaterna
      : serviceData.pacienteEdad;
  const primeraPacienteNombre = normalizeStringValue(serviceData.pacienteNombre);
  const primeraPacienteApellido = normalizeStringValue(serviceData.pacienteApellido);
  const primeraPacienteEdad = normalizeStringValue(primeraEdadSourceValue);

  const primeraConsultaReady = !isPrimeraConsulta
    || (primeraPacienteNombre && primeraPacienteApellido && primeraPacienteEdad && primeraMotivoGroup);
  const canSubmit = Boolean(
    selectedSlotId
      && date
      && time
      && (isPrimeraConsulta || hasMembers)
      && primeraConsultaReady,
  );
  const submitLabel = isEditing ? 'Guardar cambios' : 'Guardar turno';
  const cancelLabel = isEditing ? 'Cancelar reprogramación' : 'Cancelar';
  const trimmedFamilyCodeInput = familyCodeInput.trim();
  const trimmedFamilyCodeLookup = familyCodeLookup.trim();
  const hasPendingFamilyCode =
    Boolean(trimmedFamilyCodeInput) && trimmedFamilyCodeInput !== trimmedFamilyCodeLookup;

  const familyFeedback = hasPendingFamilyCode
    ? { message: 'Presioná Enter para buscar esta HC', tone: 'info' }
    : normalizedFamilyCode && !matchedFamily
    ? { message: 'No se encontró una HC con ese número', tone: 'error' }
    : matchedFamily
    ? {
        message: `HC ${matchedFamily.code} · ${matchedFamily.provincia || 'Provincia sin cargar'}`,
        tone: 'success',
      }
    : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-6"
    >
      {formError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </div>
      )}
      {isEditing && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 flex flex-col gap-1">
          <div className="text-sm font-semibold text-amber-900">Reprogramación en curso</div>
          <p>
            {editingPatientLabel ? `${editingPatientLabel} · ` : ''}
            {editingSummary ? `Turno original: ${editingSummary}. ` : 'Revisá los datos existentes. '}
            Elegí un nuevo horario y guardá los cambios para actualizar la agenda.
          </p>
        </div>
      )}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">Tipo de turno</span>
          <span className="text-xs text-slate-500">
            {isPrimeraConsulta ? 'No se requiere HC ni datos del paciente.' : 'Seleccioná si es una primera consulta.'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePrimeraConsulta}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 ${
              isPrimeraConsulta
                ? 'bg-sky-600 text-white shadow-sm focus:ring-sky-200'
                : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus:ring-slate-200'
            }`}
          >
            {isPrimeraConsulta ? 'Primera consulta activada' : 'Marcar como primera consulta'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {!isPrimeraConsulta && (
          <>
            <label className="flex flex-col gap-2 text-xs uppercase tracking-wide text-slate-500">
              Número de HC (AG)
              <span className="text-[11px] text-slate-500">Ingresá el código exacto para asociar la familia</span>
              <input
                type="text"
                value={familyCodeInput}
                onChange={(e) => handleFamilyCodeInput(e.target.value)}
                onKeyDown={handleFamilyCodeKeyDown}
                placeholder="AG-0001"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm uppercase text-slate-900 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                autoComplete="off"
              />
              {familyFeedback ? (
                <span
                  className={`text-[11px] ${
                    familyFeedback.tone === 'success'
                      ? 'text-emerald-600'
                      : familyFeedback.tone === 'error'
                      ? 'text-rose-600'
                      : 'text-slate-500'
                  }`}
                >
                  {familyFeedback.message}
                </span>
              ) : (
                normalizedFamilyCode && <span className="text-[11px] text-slate-500">Formato sugerido: AG-0000</span>
              )}
            </label>
            <label className="flex flex-col gap-2 text-xs uppercase tracking-wide text-slate-500">
              Nombre del paciente
              <span className="text-[11px] text-slate-500">Seleccioná la persona asociada a la HC</span>
              <select
                value={memberId}
                onChange={(e) => {
                  setMemberId(e.target.value);
                  setMotivoPersonalizado(false);
                }}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
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
        {!isPrimeraConsulta && (
          <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 md:col-span-2">
            {displayPatientName ? (
              <div className="flex flex-col gap-1">
                <div className="font-semibold text-slate-900">Paciente · {displayPatientName}</div>
                {displayPatientDni && (
                  <div className="text-[11px] text-slate-500">DNI: {displayPatientDni}</div>
                )}
                {displayPatientAg && (
                  <div className="text-[11px] text-slate-500">HC: {displayPatientAg}</div>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500">
                Seleccioná una HC para confirmar los datos del paciente.
              </div>
            )}
          </div>
        )}
        <label className="flex flex-col gap-2 text-xs uppercase tracking-wide text-slate-500 md:col-span-2">
          Próximos turnos disponibles
          <span className="text-[11px] text-slate-500">
            {overbook ? 'Sobreturno activo: elegí un horario extra disponible.' : 'Elegí un horario disponible.'}
          </span>
          <select
            value={selectedSlotId}
            onChange={(e) => handleSlotSelect(e.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            disabled={!slotsForSelectedDate.length}
            required
          >
            <option value="">
              {slotsForSelectedDate.length ? 'Seleccionar turno sugerido…' : 'Sin turnos sugeridos disponibles'}
            </option>
            {slotsForSelectedDate.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.shortLabel}
              </option>
            ))}
          </select>
        </label>
      </div>
      {isPrimeraConsulta && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
            Datos adicionales · Primera consulta
          </div>
          <p className="text-[12px] text-slate-600">
            Completá nombre, apellido, edad y datos de contacto en la sección <strong>Datos del paciente</strong>. Esa
            información se usará para registrar la primera consulta.
          </p>
          <label className="required flex flex-col gap-2 text-xs uppercase tracking-wide text-slate-500">
            Motivo principal (grupo)
            <span className="text-[11px] text-slate-500">Elegí el grupo que mejor describe el motivo de derivación</span>
            <select
              value={primeraMotivoGroup}
              onChange={(e) => setPrimeraMotivoGroup(e.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
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
      {isPrimeraConsulta &&
        (normalizedService === 'prenatal' ? (
          <PrenatalFields data={serviceData} errors={serviceErrors} onChange={updateServiceData} />
        ) : normalizedService === 'laboratorio' ? (
          <LaboratorioFields data={serviceData} errors={serviceErrors} onChange={updateServiceData} />
        ) : (
          <>
            <ClinicPatientFields
              data={serviceData}
              errors={serviceErrors}
              onChange={updateServiceData}
              serviceLabel={serviceLabel}
              showEmbarazada={normalizedService !== 'ecografia'}
            />
            {normalizedService === 'test-del-sudor' && (
              <TestDelSudorExtraFields data={serviceData} errors={serviceErrors} onChange={updateServiceData} />
            )}
            {normalizedService === 'ecografia' && (
              <EcografiaExtraFields data={serviceData} errors={serviceErrors} onChange={updateServiceData} />
            )}
          </>
        ))}
      <label className="flex flex-col gap-2 text-xs uppercase tracking-wide text-slate-500">
        Diagnóstico / Motivo de la consulta *
        <span className="text-[11px] text-slate-500">Describí brevemente el motivo principal del turno</span>
        <input
          type="text"
          value={motivo}
          onChange={(e) => handleMotivoChange(e.target.value)}
          placeholder="Ej. Control de seguimiento"
          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
          readOnly={isPrimeraConsulta}
        />
      </label>
      <label className="flex flex-col gap-2 text-xs uppercase tracking-wide text-slate-500">
        Observaciones
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Observaciones para el equipo (opcional)"
          className="min-h-[96px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
        />
      </label>
      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="submit"
          className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canSubmit}
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsPrimeraConsulta(false);
            setServiceForms((prev) => ({
              ...prev,
              [normalizedService]: createInitialServiceForms()[normalizedService] || {},
            }));
            setServiceErrors({});
            onCancel?.();
          }}
          className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          {cancelLabel}
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
  onRescheduleAppointment,
}) {
  const [confirmingAction, setConfirmingAction] = useState(null);

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        No hay turnos para esta fecha. Agendá el próximo paciente para empezar el día.
      </div>
    );
  }

  const statusOptions = ['Pendiente', 'En sala', 'Atendido', 'Ausente'];
  const firstTimeItems = items.filter((item) => Boolean(item.primeraConsulta));
  const followUpItems = items.filter((item) => !item.primeraConsulta);
  const showGroupedSections = firstTimeItems.length > 0 && followUpItems.length > 0;

  const renderItem = (item) => {
    const member = item.memberId ? membersById[item.memberId] : null;
    const family = item.familyId ? familiesById[item.familyId] : null;
    const isPrimeraConsulta = Boolean(item.primeraConsulta);
    const isSobreturno = Boolean(item.sobreturno);
    const wizardPending = Boolean(family?.intake?.wizardPending);
    const primeraInfo = normalizePrimeraConsultaInfo(
      item.primeraConsultaInfo
        || (item.metadata && typeof item.metadata === 'object' ? item.metadata.primeraConsultaInfo : null),
    );

    const nameParts = isPrimeraConsulta
      ? [primeraInfo?.apellido, primeraInfo?.nombre].filter(Boolean)
      : [member?.apellido, member?.nombre].filter(Boolean);
    let displayName = nameParts.join(' ').trim();
    if (!displayName) {
      if (isPrimeraConsulta) {
        displayName = primeraInfo
          ? `${primeraInfo.nombre || ''} ${primeraInfo.apellido || ''}`.trim()
          : 'Primera consulta sin datos';
      } else {
        displayName = getMemberDisplayName(member);
      }
    }

    let motivoLabel = isPrimeraConsulta
      ? primeraInfo?.motivoGroupLabel || item.motivo || ''
      : item.motivo || '';
    if (!motivoLabel) motivoLabel = 'Motivo sin datos';

    let codeLabel = family?.code ? `HC ${family.code}` : '';
    if (!codeLabel) {
      codeLabel = isPrimeraConsulta ? 'AG pendiente' : 'AG sin datos';
    }

    const summaryText = [codeLabel, displayName, motivoLabel].filter(Boolean).join(' · ');
    const statusColor = getStatusBadgeColor(item.estado);

    const backgroundColorClass = getAppointmentBackgroundColor(item, primeraInfo);

    const actionButtons = [];
    if (family && (!isPrimeraConsulta || !wizardPending)) {
      actionButtons.push(
        <button
          key="open"
          type="button"
          onClick={() => onOpenFamily(item.familyId)}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          Abrir HC
        </button>,
      );
    }
    if (isPrimeraConsulta && family && wizardPending) {
      actionButtons.push(
        <button
          key="wizard"
          type="button"
          onClick={() => onOpenFamily(item.familyId)}
          className="text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors"
        >
          Ingresar 1ra consulta
        </button>,
      );
    }
    if (isPrimeraConsulta && !family && onCreateFamilyCase) {
      actionButtons.push(
        <button
          key="new-family"
          type="button"
          onClick={() => onCreateFamilyCase(item)}
          className="text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors"
        >
          + Nueva HC familiar
        </button>,
      );
    }
    actionButtons.push(
      <button
        key="remove"
        type="button"
        onClick={() =>
          setConfirmingAction({
            item,
            summaryText,
          })
        }
        className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
      >
        Cancelar
      </button>,
    );

    const badgeElements = [];
    if (isPrimeraConsulta) {
      badgeElements.push(
        <span key="primera" className="rounded-full bg-sky-100 px-2 py-[2px] text-[11px] uppercase tracking-wide text-sky-700">
          Primera consulta
        </span>,
      );
    }
    if (isSobreturno) {
      badgeElements.push(
        <span key="sobreturno" className="rounded-full bg-amber-100 px-2 py-[2px] text-[11px] uppercase tracking-wide text-amber-700">
          Sobreturno
        </span>,
      );
    }
    if (item.service) {
      const serviceMatch = SERVICE_OPTIONS.find(
        (option) => option.value === String(item.service).toLowerCase(),
      );
      const serviceBadgeLabel =
        item.serviceDetails?.serviceLabel || serviceMatch?.label || item.service;
      badgeElements.push(
        <span
          key="service"
          className="rounded-full bg-slate-100 px-2 py-[2px] text-[11px] uppercase tracking-wide text-slate-600"
        >
          {serviceBadgeLabel}
        </span>,
      );
    }

    return (
      <div key={item.id} className={`px-4 py-3 text-sm ${backgroundColorClass}`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-semibold text-slate-500">
            {item.time ? `${item.time} hs` : 'Sin horario'}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="font-semibold text-slate-900">{summaryText || 'Turno sin datos'}</div>
          </div>
          {badgeElements.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {badgeElements}
            </div>
          )}
          {actionButtons.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
              {actionButtons}
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
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
        {item.notas && <div className="mt-2 text-xs text-slate-500">Nota: {item.notas}</div>}
      </div>
    );
  };

  const handleCloseConfirmation = () => setConfirmingAction(null);
  const hasRescheduleHandler = typeof onRescheduleAppointment === 'function';

  const handleConfirmCancel = () => {
    if (!confirmingAction?.item) return;
    const result = onRemove(confirmingAction.item.id);
    if (result && typeof result.then === 'function') {
      result.finally(() => setConfirmingAction(null));
    } else {
      setConfirmingAction(null);
    }
  };

  const handleReschedule = () => {
    if (!confirmingAction?.item) return;
    if (hasRescheduleHandler) {
      const result = onRescheduleAppointment(confirmingAction.item);
      if (result && typeof result.then === 'function') {
        result.finally(() => setConfirmingAction(null));
        return;
      }
    }
    setConfirmingAction(null);
  };

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {firstTimeItems.length > 0 && (
          <div>
            {showGroupedSections && (
              <div className="bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Consultas de primera vez
              </div>
            )}
            <div className="divide-y divide-slate-100">
              {firstTimeItems.map((item) => renderItem(item))}
            </div>
          </div>
        )}
        {showGroupedSections && <div className="border-t border-dashed border-slate-200" />}
        {followUpItems.length > 0 && (
          <div>
            {showGroupedSections && (
              <div className="bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Consultas programadas
              </div>
            )}
            <div className="divide-y divide-slate-100">
              {followUpItems.map((item) => renderItem(item))}
            </div>
          </div>
        )}
      </div>
      {confirmingAction && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4 py-8">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Confirmar acción
              </div>
              <div className="text-base font-semibold text-slate-900">
                {confirmingAction.summaryText || 'Turno sin datos'}
              </div>
              <p className="text-sm text-slate-600">
                Elegí qué querés hacer con este turno.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="w-full rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
              >
                Cancelar turno
              </button>
              <button
                type="button"
                onClick={handleReschedule}
                className={`w-full rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${hasRescheduleHandler ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                disabled={!hasRescheduleHandler}
              >
                Reprogramar
              </button>
              <button
                type="button"
                onClick={handleCloseConfirmation}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Volver
              </button>
            </div>
            {!hasRescheduleHandler && (
              <p className="text-[11px] text-center text-slate-400">
                La acción de reprogramar todavía no está disponible en este entorno.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function TestDelSudorExtraFields({ data, errors, onChange }) {
  return (
    <div className="grid gap-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">Datos específicos · Test del sudor</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Pesquisa neonatal *
          <select
            value={data.pesquisaNeonatal || ''}
            onChange={(e) => onChange({ pesquisaNeonatal: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          >
            <option value="">Seleccionar</option>
            {PESQUISA_NEONATAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.pesquisaNeonatal} />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Resultado (mg: mEqCl)
          <input
            type="text"
            value={data.resultadoCloruro || ''}
            onChange={(e) => onChange({ resultadoCloruro: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </label>
      </div>
      <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
        Condición del test del sudor
        <textarea
          value={data.condicionTest || ''}
          onChange={(e) => onChange({ condicionTest: e.target.value })}
          className="px-3 py-2 rounded-xl border border-slate-300 text-sm min-h-[60px]"
        />
      </label>
      <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
        Otros estudios CNGM
        <textarea
          value={data.otrosEstudiosCngm || ''}
          onChange={(e) => onChange({ otrosEstudiosCngm: e.target.value })}
          className="px-3 py-2 rounded-xl border border-slate-300 text-sm min-h-[60px]"
        />
      </label>
      <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
        Otros estudios externos
        <textarea
          value={data.otrosEstudiosExternos || ''}
          onChange={(e) => onChange({ otrosEstudiosExternos: e.target.value })}
          className="px-3 py-2 rounded-xl border border-slate-300 text-sm min-h-[60px]"
        />
      </label>
    </div>
  );
}

function EcografiaExtraFields({ data, errors, onChange }) {
  return (
    <div className="grid gap-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">Datos específicos · Ecografía</div>
      <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
        Estudio *
        <select
          value={data.estudio || ''}
          onChange={(e) => onChange({ estudio: e.target.value })}
          className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
        >
          {ECOGRAFIA_ESTUDIO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError message={errors.estudio} />
      </label>
    </div>
  );
}

function PrenatalFields({ data, errors, onChange }) {
  return (
    <div className="grid gap-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">Datos del paciente · Prenatal</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Nombre *
          <input
            type="text"
            value={data.pacienteNombre || ''}
            onChange={(e) => onChange({ pacienteNombre: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <FieldError message={errors.pacienteNombre} />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Apellido *
          <input
            type="text"
            value={data.pacienteApellido || ''}
            onChange={(e) => onChange({ pacienteApellido: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <FieldError message={errors.pacienteApellido} />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          DNI *
          <input
            type="text"
            value={data.pacienteDni || ''}
            onChange={(e) => onChange({ pacienteDni: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <FieldError message={errors.pacienteDni} />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Obra social / Prepaga
          <input
            type="text"
            value={data.pacienteObraSocial || ''}
            onChange={(e) => onChange({ pacienteObraSocial: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          AG (Historia clínica) *
          <input
            type="text"
            value={data.pacienteAg || ''}
            onChange={(e) => onChange({ pacienteAg: e.target.value.toUpperCase() })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm uppercase"
            placeholder="AG-0000"
          />
          <FieldError message={errors.pacienteAg} />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Edad materna *
          <input
            type="number"
            min="0"
            value={data.edadMaterna || ''}
            onChange={(e) => onChange({ edadMaterna: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <FieldError message={errors.edadMaterna} />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Edad paterna *
          <input
            type="number"
            min="0"
            value={data.edadPaterna || ''}
            onChange={(e) => onChange({ edadPaterna: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <FieldError message={errors.edadPaterna} />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Tipo de muestra *
          <select
            value={data.tipoMuestra || ''}
            onChange={(e) => onChange({ tipoMuestra: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          >
            {PRENATAL_MUESTRA_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.tipoMuestra} />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Edad gestacional *
          <input
            type="text"
            value={data.edadGestacional || ''}
            onChange={(e) => onChange({ edadGestacional: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
            placeholder="Semanas + días"
          />
          <FieldError message={errors.edadGestacional} />
        </label>
      </div>
      <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
        Motivo de punción *
        <textarea
          value={data.motivoPuncion || ''}
          onChange={(e) => onChange({ motivoPuncion: e.target.value })}
          className="px-3 py-2 rounded-xl border border-slate-300 text-sm min-h-[60px]"
        />
        <FieldError message={errors.motivoPuncion} />
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Médico derivante *
          <input
            type="text"
            value={data.medicoDerivante || ''}
            onChange={(e) => onChange({ medicoDerivante: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <FieldError message={errors.medicoDerivante} />
        </label>
                  <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
                    Confirmación de asistencia *
                    <select
                      value={data.confirmacionAsistencia || 'pendiente'}
                      onChange={(e) => onChange({ confirmacionAsistencia: e.target.value })}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    >
                      {CONFIRMACION_ASISTENCIA_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FieldError message={errors.confirmacionAsistencia} />
                  </label>      </div>
    </div>
  );
}

function LaboratorioFields({ data, errors, onChange }) {
  const toggleTipo = (tipo) => {
    onChange((current) => {
      const tipos = { ...(current.tiposSeleccionados || {}) };
      tipos[tipo] = !tipos[tipo];
      return {
        ...current,
        tiposSeleccionados: tipos,
      };
    });
  };

  const toggleNested = (section, field) => {
    onChange((current) => {
      const sectionData = { ...(current[section] || {}) };
      sectionData[field] = !sectionData[field];
      return {
        ...current,
        [section]: sectionData,
      };
    });
  };

  return (
    <div className="grid gap-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">Datos del paciente · Laboratorio</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Nombre *
          <input
            type="text"
            value={data.pacienteNombre || ''}
            onChange={(e) => onChange({ pacienteNombre: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <FieldError message={errors.pacienteNombre} />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Apellido *
          <input
            type="text"
            value={data.pacienteApellido || ''}
            onChange={(e) => onChange({ pacienteApellido: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <FieldError message={errors.pacienteApellido} />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          DNI *
          <input
            type="text"
            value={data.pacienteDni || ''}
            onChange={(e) => onChange({ pacienteDni: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
          <FieldError message={errors.pacienteDni} />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          AG (Historia clínica) *
          <input
            type="text"
            value={data.pacienteAg || ''}
            onChange={(e) => onChange({ pacienteAg: e.target.value.toUpperCase() })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm uppercase"
            placeholder="AG-0000"
          />
          <FieldError message={errors.pacienteAg} />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Edad
          <input
            type="number"
            min="0"
            value={data.pacienteEdad || ''}
            onChange={(e) => onChange({ pacienteEdad: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Obra social / Prepaga
          <input
            type="text"
            value={data.pacienteObraSocial || ''}
            onChange={(e) => onChange({ pacienteObraSocial: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Procedencia
          <input
            type="text"
            value={data.procedencia || ''}
            onChange={(e) => onChange({ procedencia: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Médico
          <input
            type="text"
            value={data.medico || ''}
            onChange={(e) => onChange({ medico: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Teléfono
          <input
            type="tel"
            value={data.telefono || ''}
            onChange={(e) => onChange({ telefono: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Indicación 1
          <input
            type="text"
            value={data.indicacion1 || ''}
            onChange={(e) => onChange({ indicacion1: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
          Indicación 2
          <input
            type="text"
            value={data.indicacion2 || ''}
            onChange={(e) => onChange({ indicacion2: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </label>
        <div className="flex items-center gap-2 pt-6">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(data.urgente)}
              onChange={(e) => onChange({ urgente: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
            />
            Urgente
          </label>
        </div>
      </div>
      <div className="grid gap-2">
        <div className="text-xs uppercase tracking-wide text-slate-500">Modalidad *</div>
        <div className="flex flex-wrap gap-3 text-sm text-slate-700">
          {LABORATORIO_MODALIDAD_OPTIONS.map((option) => (
            <label key={option.value} className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="laboratorio-modalidad"
                value={option.value}
                checked={data.modalidad === option.value}
                onChange={(e) => onChange({ modalidad: e.target.value })}
                className="h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-200"
              />
              {option.label}
            </label>
          ))}
        </div>
        <FieldError message={errors.modalidad} />
      </div>
      <div className="grid gap-2">
        <div className="text-xs uppercase tracking-wide text-slate-500">Tipo de estudio *</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-700">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(data.tiposSeleccionados?.citogenetica)}
              onChange={() => toggleTipo('citogenetica')}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
            />
            Citogenética
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(data.tiposSeleccionados?.adn)}
              onChange={() => toggleTipo('adn')}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
            />
            ADN
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(data.tiposSeleccionados?.molecular)}
              onChange={() => toggleTipo('molecular')}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
            />
            Molecular
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(data.tiposSeleccionados?.experimental)}
              onChange={() => toggleTipo('experimental')}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
            />
            Experimental
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(data.tiposSeleccionados?.oncohemato)}
              onChange={() => toggleTipo('oncohemato')}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
            />
            Oncohemato (punción de médula)
          </label>
        </div>
        <FieldError message={errors.tiposSeleccionados} />
      </div>
      {data.tiposSeleccionados?.citogenetica && (
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Citogenética</div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(data.citogenetica?.cariotipo)}
              onChange={() => toggleNested('citogenetica', 'cariotipo')}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
            />
            Cariotipo
          </label>
        </div>
      )}
      {data.tiposSeleccionados?.molecular && (
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Molecular</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
            {['frax', 'hsc', 'steinert', 'mlst', 'mlcen', 'veintidosQ', 'exoma'].map((field) => (
              <label key={field} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(data.molecular?.[field])}
                  onChange={() => toggleNested('molecular', field)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
                />
                {field === 'veintidosQ' ? '22q' : field.toUpperCase()}
              </label>
            ))}
            <label className="col-span-full inline-flex flex-col gap-1 text-slate-700">
              <span className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(data.molecular?.otro)}
                  onChange={() => toggleNested('molecular', 'otro')}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
                />
                Otro
              </span>
              {data.molecular?.otro && (
                <input
                  type="text"
                  value={data.molecular?.otroDetalle || ''}
                  onChange={(e) =>
                    onChange((current) => ({
                      ...current,
                      molecular: { ...(current.molecular || {}), otroDetalle: e.target.value },
                    }))
                  }
                  className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  placeholder="Detalle del estudio"
                />
              )}
              <FieldError message={errors['molecular.otroDetalle']} />
            </label>
          </div>
        </div>
      )}
      {data.tiposSeleccionados?.experimental && (
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Experimental</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
            {['fq', 'panelCancer', 'azf'].map((field) => (
              <label key={field} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(data.experimental?.[field])}
                  onChange={() => toggleNested('experimental', field)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
                />
                {field === 'panelCancer' ? 'Panel cáncer' : field.toUpperCase()}
              </label>
            ))}
            <label className="col-span-full inline-flex flex-col gap-1 text-slate-700">
              <span className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(data.experimental?.otro)}
                  onChange={() => toggleNested('experimental', 'otro')}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
                />
                Otro
              </span>
              {data.experimental?.otro && (
                <input
                  type="text"
                  value={data.experimental?.otroDetalle || ''}
                  onChange={(e) =>
                    onChange((current) => ({
                      ...current,
                      experimental: { ...(current.experimental || {}), otroDetalle: e.target.value },
                    }))
                  }
                  className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  placeholder="Detalle del estudio"
                />
              )}
              <FieldError message={errors['experimental.otroDetalle']} />
            </label>
          </div>
        </div>
      )}
      <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
        Otros estudios
        <textarea
          value={data.otrosEstudios || ''}
          onChange={(e) => onChange({ otrosEstudios: e.target.value })}
          className="px-3 py-2 rounded-xl border border-slate-300 text-sm min-h-[60px]"
        />
      </label>
      <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
        Cultivo anterior (n°)
        <input
          type="text"
          value={data.cultivoAnteriorNumero || ''}
          onChange={(e) => onChange({ cultivoAnteriorNumero: e.target.value })}
          className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
        />
      </label>
      <label className="text-xs uppercase tracking-wide text-slate-500 flex flex-col gap-1">
        Confirmación de asistencia *
        <select
          value={data.confirmacionAsistencia || 'pendiente'}
          onChange={(e) => onChange({ confirmacionAsistencia: e.target.value })}
          className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
        >
          {CONFIRMACION_ASISTENCIA_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FieldError message={errors.confirmacionAsistencia} />
      </label>
    </div>
  );
}

const trimValue = (value) => (typeof value === 'string' ? value.trim() : '');

function validateServiceData(serviceKey, data) {
  const errors = {};
  const requireText = (key, message) => {
    if (!trimValue(data[key])) {
      errors[key] = message;
    }
  };

  if (['clinica', 'psicologia', 'test-del-sudor', 'ecografia'].includes(serviceKey)) {
    requireText('pacienteNombre', 'Ingresá el nombre del paciente');
    requireText('pacienteApellido', 'Ingresá el apellido del paciente');
    requireText('pacienteDni', 'Ingresá el DNI del paciente');
    requireText('pacienteTelefono', 'Ingresá un teléfono de contacto');
    if (data.embarazada && !trimValue(data.embarazadaEstudio)) {
      errors.embarazadaEstudio = 'Seleccioná un estudio sugerido';
    }
  }

  if (serviceKey === 'test-del-sudor') {
    requireText('pesquisaNeonatal', 'Seleccioná el resultado de la pesquisa');
  }

  if (serviceKey === 'ecografia') {
    requireText('estudio', 'Seleccioná el tipo de estudio');
  }

  if (serviceKey === 'prenatal') {
    requireText('pacienteNombre', 'Ingresá el nombre de la paciente');
    requireText('pacienteApellido', 'Ingresá el apellido de la paciente');
    requireText('pacienteDni', 'Ingresá el DNI');
    requireText('pacienteAg', 'Indicá la HC (AG)');
    requireText('edadMaterna', 'Ingresá la edad materna');
    requireText('edadPaterna', 'Ingresá la edad paterna');
    requireText('tipoMuestra', 'Seleccioná el tipo de muestra');
    requireText('edadGestacional', 'Ingresá la edad gestacional');
    requireText('motivoPuncion', 'Describí el motivo de la punción');
    requireText('medicoDerivante', 'Ingresá el médico derivante');
    requireText('confirmacionAsistencia', 'Seleccioná la confirmación de asistencia');
    requireText('medicoAtendio', 'Seleccioná quién atiende');
    if (data.medicoAtendio === 'otros' && !trimValue(data.medicoAtendioOtro)) {
      errors.medicoAtendio = 'Indicá el profesional que atenderá';
    }
  }

  if (serviceKey === 'laboratorio') {
    requireText('pacienteNombre', 'Ingresá el nombre del paciente');
    requireText('pacienteApellido', 'Ingresá el apellido del paciente');
    requireText('pacienteDni', 'Ingresá el DNI del paciente');
    requireText('pacienteAg', 'Indicá la HC (AG)');
    requireText('modalidad', 'Indicá si es extracción o recepción');
    const tiposSeleccionados = data.tiposSeleccionados || {};
    const hasTipo = Object.values(tiposSeleccionados).some(Boolean);
    if (!hasTipo) {
      errors.tiposSeleccionados = 'Seleccioná al menos un tipo de estudio';
    }
    requireText('confirmacionAsistencia', 'Seleccioná la confirmación de asistencia');
    if (data.molecular?.otro && !trimValue(data.molecular?.otroDetalle)) {
      errors['molecular.otroDetalle'] = 'Detallá el estudio molecular';
    }
    if (data.experimental?.otro && !trimValue(data.experimental?.otroDetalle)) {
      errors['experimental.otroDetalle'] = 'Detallá el estudio experimental';
    }
  }

  return errors;
}
export default function TodayAgenda({
  selectedDate,
  onDateChange,
  service = 'clinica',
  onServiceChange,
  appointments,
  allAppointments = [],
  membersOptions,
  membersById,
  familiesById,
  onCreateAppointment,
  onStatusChange,
  onRemoveAppointment,
  onUpdateAppointment,
  onOpenFamily,
  onCreateFamilyCase,
  availableSlots = [],
  onEnsureFamilyDetail,
  blockedDays = [],
}) {
  const [adding, setAdding] = useState(false);
  const [overbookMode, setOverbookMode] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const isSelectedDateBlocked = useMemo(() => {
    return blockedDays.includes(selectedDate);
  }, [blockedDays, selectedDate]);
  const datePickerRef = useRef(null);
  const selectedService =
    (typeof service === 'string' && service.trim().toLowerCase()) || 'clinica';
  const handleReprogramAppointment = useCallback(
    (appointment) => {
      if (!appointment) return;
      if (
        appointment.date
        && appointment.date !== selectedDate
        && typeof onDateChange === 'function'
      ) {
        onDateChange(appointment.date);
      }
      setEditingAppointment(appointment);
      setOverbookMode(Boolean(appointment.sobreturno));
      setAdding(true);
    },
    [onDateChange, selectedDate],
  );

  const handleServiceSelect = useCallback(
    (event) => {
      if (typeof onServiceChange === 'function') {
        onServiceChange(event.target.value);
      }
    },
    [onServiceChange],
  );
  const serviceSelectId = 'today-agenda-service';

  const selectedDateObj = useMemo(() => {
    if (!selectedDate) return undefined;
    const parts = selectedDate.split('-').map(Number);
    if (parts.length !== 3) return undefined;
    const [year, month, day] = parts;
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return undefined;
    return new Date(year, month - 1, day);
  }, [selectedDate]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDateObj) return 'Seleccionar fecha';
    return selectedDateObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }, [selectedDateObj]);

  const bookedCountsByDate = useMemo(() => {
    const counts = new Map();
    (Array.isArray(allAppointments) ? allAppointments : [])
      .filter((item) => (item.service || 'clinica').toLowerCase() === selectedService.toLowerCase())
      .forEach((item) => {
        if (!item || !item.date) return;
        if (item.sobreturno) return;
        const iso = item.date;
        counts.set(iso, (counts.get(iso) || 0) + 1);
      });
    return counts;
  }, [allAppointments, selectedService]);

  const getAvailabilityStatus = useCallback(
    (dateObj) => {
      if (!(dateObj instanceof Date)) return null;
      if (Number.isNaN(dateObj.getTime())) return null;
      const schedule = getScheduleForWeekday(dateObj.getDay(), selectedService);
      if (!Array.isArray(schedule) || schedule.length === 0) return null;
      const totalCapacity = schedule.reduce(
        (sum, item) => sum + (Number.isFinite(item?.capacity) ? item.capacity : 0),
        0,
      );
      if (totalCapacity === 0) return null;
      const iso = formatISODateLocal(dateObj);
      const booked = bookedCountsByDate.get(iso) || 0;
      const available = Math.max(totalCapacity - booked, 0);
      if (available === 0) return 'unavailable';
      if (available <= 3) return 'availableFew';
      return 'availableMany';
    },
    [bookedCountsByDate, selectedService],
  );

  const dayPickerModifiers = useMemo(
    () => ({
      availableMany: (day) => getAvailabilityStatus(day) === 'availableMany',
      availableFew: (day) => getAvailabilityStatus(day) === 'availableFew',
      unavailable: (day) => getAvailabilityStatus(day) === 'unavailable',
    }),
    [getAvailabilityStatus],
  );

  const dayPickerModifiersStyles = useMemo(
    () => ({
      availableMany: {
        backgroundColor: '#16a34a',
        color: '#fff',
        fontWeight: 700,
        borderRadius: '8px',
        boxShadow: 'inset 0 0 0 1px #15803d',
      },
      availableFew: {
        backgroundColor: '#facc15',
        color: '#422006',
        fontWeight: 700,
        borderRadius: '8px',
        boxShadow: 'inset 0 0 0 1px #d97706',
      },
      unavailable: {
        backgroundColor: '#dc2626',
        color: '#fff',
        fontWeight: 700,
        borderRadius: '8px',
        boxShadow: 'inset 0 0 0 1px #991b1b',
      },
    }),
    [],
  );

  const dayPickerStyles = useMemo(
    () => ({
      day: { borderRadius: '8px', color: '#0f172a', fontWeight: 600 },
      day_selected: { backgroundColor: '#0f172a', color: '#fff' },
      day_today: { backgroundColor: '#f0f9ff', border: '1px solid #0ea5e9' },
      head_cell: { textTransform: 'uppercase', fontSize: '11px', fontWeight: 600, color: '#64748b' },
      caption_label: { textTransform: 'capitalize' },
    }),
    [],
  );

  useEffect(() => {
    if (!showCalendar) return;
    const handleClickOutside = (event) => {
      if (!datePickerRef.current) return;
      if (!datePickerRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  useEffect(() => {
    if (!showCalendar) return;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowCalendar(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showCalendar]);

  const handleSelectDay = useCallback(
    (day) => {
      if (!day) return;
      const iso = formatISODateLocal(day);
      onDateChange(iso);
      setShowCalendar(false);
    },
    [onDateChange],
  );
  const todayIso = useMemo(() => formatISODateLocal(new Date()), []);
  const isTodaySelected = selectedDate === todayIso;

  const handleGoToToday = () => {
    onDateChange(todayIso);
  };

  const handleCloseForm = useCallback(() => {
    setAdding(false);
    setEditingAppointment(null);
  }, []);

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
      setEditingAppointment(null);
    }
  }, [adding]);

  const overbookSlots = useMemo(() => {
    if (!overbookMode) return [];
    const dateObj = new Date(selectedDate);
    if (Number.isNaN(dateObj.getTime())) return [];
    return buildOverbookSlotsForDate(dateObj, appointments, selectedService);
  }, [appointments, overbookMode, selectedDate, selectedService]);

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
    setEditingAppointment(null);
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
    setEditingAppointment(null);
    setOverbookMode(true);
    setAdding(true);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Turnos del día</div>
            <div className="text-[11px] text-slate-500">
              Consultas programadas para {friendlyDate || 'la fecha seleccionada'}.
            </div>
          </div>
          <div className="flex min-w-[200px] flex-col gap-1">
            <label
              htmlFor={serviceSelectId}
              className="text-[11px] font-medium uppercase tracking-wide text-slate-500"
            >
              Servicio
            </label>
            <select
              id={serviceSelectId}
              value={selectedService}
              onChange={handleServiceSelect}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {SERVICE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={datePickerRef}>
            <button
              type="button"
              onClick={() => setShowCalendar((prev) => !prev)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {selectedDateLabel}
            </button>
            {showCalendar && (
              <div
                className="absolute right-0 z-20 mt-2 rounded-2xl border border-slate-200 bg-white shadow-xl"
                style={{ transform: 'scale(1.5)', transformOrigin: 'top right' }}
              >
                <DayPicker
                  mode="single"
                  selected={selectedDateObj}
                  defaultMonth={selectedDateObj || new Date()}
                  onSelect={handleSelectDay}
                  disabled={(day) =>
                    getAvailabilityStatus(day) === 'unavailable' || getAvailabilityStatus(day) === null
                  }
                  modifiers={dayPickerModifiers}
                  modifiersStyles={dayPickerModifiersStyles}
                  styles={dayPickerStyles}
                  className="p-2"
                  locale={es}
                  weekStartsOn={1}
                  showOutsideDays
                />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleGoToToday}
            className={`px-3 py-2 rounded-xl border text-sm font-medium ${isTodaySelected ? 'bg-sky-100 border-sky-300 text-sky-700' : 'border-slate-300 hover:bg-slate-50'}`}
          >
            Hoy
          </button>
          <button
            onClick={handleOpenStandardForm}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm font-medium"
            disabled={isSelectedDateBlocked}
          >
            {adding ? 'Cerrar formulario' : '+ Nuevo turno'}
          </button>
          <button
            onClick={handleOpenOverbookForm}
            className="px-3 py-2 rounded-xl border border-amber-400 bg-amber-50 text-sm font-medium text-amber-700 hover:bg-amber-100"
            disabled={isSelectedDateBlocked}
          >
            {adding && overbookMode ? 'Cerrar sobreturno' : '+ Agregar sobreturno'}
          </button>
        </div>
      </div>
      {isSelectedDateBlocked && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Este día está bloqueado y no se pueden agregar nuevos turnos.
        </div>
      )}
      {adding && !isSelectedDateBlocked && (
      <AgendaForm
        membersOptions={membersOptions}
        familiesById={familiesById}
        defaultDate={selectedDate}
        availableSlots={slotsForForm}
        overbook={overbookMode}
        service={selectedService}
        onEnsureFamilyDetail={onEnsureFamilyDetail}
        editingAppointment={editingAppointment}
        onSubmit={(values) => {
          const payload = { ...values, service: selectedService };
          if (editingAppointment && typeof onUpdateAppointment === 'function') {
            onUpdateAppointment({
              ...editingAppointment,
              ...payload,
              metadata: editingAppointment.metadata,
              id: editingAppointment.id,
              estado: editingAppointment.estado || 'Pendiente',
            });
          } else if (typeof onCreateAppointment === 'function') {
            onCreateAppointment(payload);
          }
          handleCloseForm();
        }}
        onCancel={handleCloseForm}
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
        onRescheduleAppointment={handleReprogramAppointment}
      />
    </div>
  );
}
