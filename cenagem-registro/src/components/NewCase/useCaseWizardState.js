import { useReducer, useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { z } from 'zod';

const FLAT_DEFAULTS = {
  pacienteNombre: '',
  pacienteApellido: '',
  pacienteDni: '',
  pacienteNacimiento: '',
  pacienteDireccion: '',
  motivoGroup: '',
  motivoDetail: '',
  motivoPaciente: '',
  motivoDerivacion: '',
  enfInicioContexto: '',
  enfEvolucionActual: '',
  enfManifestacionesClaves: '',
  enfEvaluacionesPrevias: '',
  enfImpactoPlan: '',
  consultaFecha: '',
  pacienteEscolaridad: '',
  pacienteEscolaridadRendimiento: '',
  pacienteAcompanante: '',
  pacienteAcompananteParentesco: '',
  contactoTelefono1: '',
  contactoTelefono2: '',
  pacienteHabitos: '',
  pacienteApoyosPsicosociales: '',
  pacienteObraSocial: '',
  pacienteObraSocialNumero: '',
  tutorPadreNombre: '',
  tutorPadreApellido: '',
  tutorPadreProcedencia: '',
  tutorPadreConsanguinidad: '',
  tutorPadrePadreApellido: '',
  tutorPadrePadreProcedencia: '',
  tutorPadreMadreApellido: '',
  tutorPadreMadreProcedencia: '',
  tutorMadreNombre: '',
  tutorMadreApellido: '',
  tutorMadreProcedencia: '',
  tutorMadreConsanguinidad: '',
  tutorMadrePadreApellido: '',
  tutorMadrePadreProcedencia: '',
  tutorMadreMadreApellido: '',
  tutorMadreMadreProcedencia: '',
  agNumber: '',
  provincia: '',
  medicoAsignado: '',
  pacienteSexo: '',
  pacienteEmail: '',
  pacienteTelefono: '',
  pacienteProfesion: '',
  pacienteAntecedentes: '',
  antecedentesNeurologicos: '',
  antecedentesMetabolicos: '',
  antecedentesSensoriales: '',
  antecedentesPsicosociales: '',
  pacienteExamenPeso: '',
  pacienteExamenTalla: '',
  pacienteExamenPc: '',
  pacienteExamenPesoPercentil: '',
  pacienteExamenTallaPercentil: '',
  pacienteExamenPcPercentil: '',
  pacienteExamenProporciones: '',
  pacienteExamenObservaciones: '',
  pacienteExamenDismorfias: '',
  pacienteExamenOjos: '',
  pacienteExamenNariz: '',
  pacienteExamenFiltrum: '',
  pacienteExamenBoca: '',
  pacienteExamenOrejas: '',
  pacienteExamenCuello: '',
  pacienteExamenTorax: '',
  pacienteExamenColumna: '',
  pacienteExamenAbdomen: '',
  pacienteExamenGenitales: '',
  pacienteExamenMalformaciones: '',
  pacienteExamenPiel: '',
  pacienteExamenNeurologico: '',
  pacienteExamenOtras: '',
  edadMaternaConcepcion: '',
  edadPaternaConcepcion: '',
  controlPrenatal: '',
  controlPrenatalDetalle: '',
  embarazoComplicaciones: '',
  embarazoExposiciones: '',
  prenatalEcoAlteraciones: '',
  perinatalTipoParto: '',
  perinatalEdadGestacional: '',
  perinatalPesoNacimiento: '',
  perinatalTallaNacimiento: '',
  perinatalApgar1: '',
  perinatalApgar5: '',
  perinatalInternacionNeonatal: '',
  perinatalComplicaciones: '',
  prenatalSemanas: '',
  prenatalEcografia: '',
  prenatalCribado: '',
  prenatalRciu: '',
  prenatalInvasivos: '',
  prenatalGeneticaFetal: '',
  prenatalConsejeria: '',
  prenatalNotas: '',
  prenatalProcedimientos: '',
  ndHitosMotores: '',
  ndLenguaje: '',
  ndConducta: '',
  ndRegresion: '',
  ndAreaCognitiva: '',
  ndEscolaridadDetalle: '',
  ndEEG: '',
  ndRMN: '',
  ndEstudiosOtros: '',
  ndInterconsultas: '',
  ndApoyos: '',
  comportamientoInteraccion: '',
  comportamientoAdaptativas: '',
  comportamientoEscalas: '',
  comportamientoApoyo: '',
  reproTiempoBusqueda: '',
  reproFemeninoDatos: '',
  reproMasculinoDatos: '',
  reproPerdidasGestacionales: '',
  reproDiagnosticos: '',
  reproTratamientos: '',
  reproEstudiosPrevios: '',
  reproPlan: '',
  oncoTiposTumor: '',
  oncoEdadDiagnostico: '',
  oncoTratamientos: '',
  oncoEstudiosPrevios: '',
  oncoArbolFamiliar: '',
  oncoRiesgoModelos: '',
  oncoEstudiosDisponibles: '',
  oncoPlanSeguimiento: '',
  metaSintomasAgudos: '',
  metaCribadoNeonatal: '',
  metaBioquimica: '',
  consanguinidad: 'no',
  consanguinidadDetalle: '',
  familiaAntecedentesNeuro: '',
  familiaAbortosInfertilidad: '',
  familiaDesarrolloHermanos: '',
  familiaDiagnosticosGeneticos: '',
  obstetricosDescripcion: '',
  tallaEdadInicio: '',
  tallaFamiliaAdultos: '',
  tallaEstudiosPrevios: '',
  tallaTratamientos: '',
  tallaMotivoConsulta: [],
  tallaTallaCm: '',
  tallaTallaDE: '',
  tallaPesoKg: '',
  tallaImc: '',
  tallaVelocidadCrecimiento: '',
  tallaTallaDiana: '',
  tallaEdadOsea: '',
  tallaDiscrepanciaEdadOsea: '',
  tallaAntecedentes: [],
  tallaExamenFisico: [],
  tallaClasificacionMorfologica: '',
  tallaComplementariosGenerales: [],
  dismorfiasDescripcion: '',
  dismorfiasSistemasAfectados: '',
  dismorfiasImagenes: '',
  dismorfiasEstudiosGeneticos: '',
  incTipoEstudio: '',
  incHallazgo: '',
  incAccionRequerida: '',
  otrosMotivo: '',
  otrosEstudios: '',
  otrosPlan: '',
  monoFenotipo: '',
  monoBioquimica: '',
  monoOrganoSistema: '',
  monoEstudiosPrevios: '',
  monoTratamiento: '',
  monoPlanEstudios: '',
  monoNotas: '',
  estudiosPrimerNivel: '',
  estudiosSegundoNivel: '',
  estudiosTercerNivel: '',
  estudiosComplementariosNotas: '',
  sintesisClasificacion: '',
  sintesisSindromico: '',
  sintesisReversibilidad: '',
  sintesisEtiologia: '',
  planDerivaciones: '',
  planConsejeriaGenetica: '',
  planControles: '',
  planRegistroHpo: '',
  primeraEvolucion: '',
  resumenPrimeraConsulta: '',
  b1Nombre: '',
  b1Apellido: '',
  b1Nacimiento: '',
  b1Email: '',
  b1Profesion: '',
  b1ObraSocial: '',
  b1Antecedentes: '',
  c1Nombre: '',
  c1Apellido: '',
  c1Nacimiento: '',
  c1Email: '',
  c1Profesion: '',
  c1ObraSocial: '',
  c1Antecedentes: '',
  c1Gestas: '',
  c1Partos: '',
  c1Abortos: '',
  c1Cesareas: '',
  abueloPaternoApellido: '',
  abueloPaternoProcedencia: '',
  abuelaPaternaApellido: '',
  abuelaPaternaProcedencia: '',
  abueloMaternoApellido: '',
  abueloMaternoProcedencia: '',
  abuelaMaternaApellido: '',
  abuelaMaternaProcedencia: '',
};

const PRENATAL_GUIDE_DEFAULTS = {
  identificacionNombre: '',
  identificacionEdad: '',
  identificacionDni: '',
  identificacionCobertura: '',
  identificacionDomicilio: '',
  identificacionFechaConsulta: '',
  identificacionFum: '',
  identificacionEdadGestacional: '',
  identificacionMetodoCalculo: '',
  identificacionMotivoConsulta: '',
  antecedentesMedicosCronicos: '',
  antecedentesCirugias: '',
  antecedentesMedicaciones: '',
  antecedentesConsumo: '',
  antecedentesVacunas: '',
  antecedentesMenarca: '',
  antecedentesMetodoAnticonceptivo: '',
  antecedentesHistoriaObstetrica: '',
  antecedentesComplicacionesPrevias: '',
  antecedentesAbortos: '',
  antecedentesConsanguinidad: '',
  antecedentesEtnia: '',
  familiaHistoriaGenetica: '',
  familiaAbortosRecurrentes: '',
  familiaPortadores: '',
  familiaCancer: '',
  familiaArbolGenealogico: '',
  parejaEdad: '',
  parejaOcupacion: '',
  parejaAntecedentesMedicos: '',
  parejaConsumo: '',
  parejaHistoriaFamiliar: '',
  embarazoControlPrenatal: '',
  embarazoSuplementacion: '',
  embarazoInfecciones: '',
  embarazoEventos: '',
  embarazoPesoTension: '',
  embarazoMovimientos: '',
  embarazoLaboratorios: '',
  estudiosEcoPrimerTrimestre: '',
  estudiosEcoSegundoTrimestre: '',
  estudiosEcoDoppler: '',
  estudiosScreening: '',
  estudiosScreeningResultados: '',
  estudiosInvasivos: '',
  estudiosInvasivosHallazgos: '',
  psicosocialEducacion: '',
  psicosocialApoyo: '',
  psicosocialDeseo: '',
  psicosocialSituacion: '',
  psicosocialViolencia: '',
  sintesisResumen: '',
  sintesisClasificacion: '',
  sintesisPlanAccion: '',
  sintesisRegistro: '',
};

Object.assign(FLAT_DEFAULTS, PRENATAL_GUIDE_DEFAULTS);

const ADMINISTRATIVE_FIELDS = [
  'agNumber',
  'pacienteNombre',
  'pacienteApellido',
  'pacienteDni',
  'pacienteNacimiento',
  'pacienteSexo',
  'provincia',
  'pacienteDireccion',
  'pacienteTelefono',
  'pacienteEmail',
  'pacienteAcompanante',
  'pacienteAcompananteParentesco',
  'contactoTelefono1',
  'contactoTelefono2',
  'pacienteObraSocial',
  'pacienteObraSocialNumero',
  'tutorPadreNombre',
  'tutorPadreApellido',
  'tutorPadreProcedencia',
  'tutorPadreConsanguinidad',
  'tutorPadrePadreApellido',
  'tutorPadrePadreProcedencia',
  'tutorPadreMadreApellido',
  'tutorPadreMadreProcedencia',
  'tutorMadreNombre',
  'tutorMadreApellido',
  'tutorMadreProcedencia',
  'tutorMadreConsanguinidad',
  'tutorMadrePadreApellido',
  'tutorMadrePadreProcedencia',
  'tutorMadreMadreApellido',
  'tutorMadreMadreProcedencia',
  'medicoAsignado',
];

const MOTIVO_FIELDS = ['motivoGroup', 'motivoDetail', 'motivoPaciente', 'motivoDerivacion'];

const PLAN_FIELDS = [
  'ndEEG',
  'ndRMN',
  'ndEstudiosOtros',
  'ndInterconsultas',
  'ndApoyos',
  'reproDiagnosticos',
  'reproTratamientos',
  'reproEstudiosPrevios',
  'reproPlan',
  'oncoArbolFamiliar',
  'oncoRiesgoModelos',
  'oncoEstudiosDisponibles',
  'oncoPlanSeguimiento',
  'tallaEdadInicio',
  'tallaFamiliaAdultos',
  'tallaEstudiosPrevios',
  'tallaTratamientos',
  'dismorfiasDescripcion',
  'dismorfiasSistemasAfectados',
  'dismorfiasImagenes',
  'dismorfiasEstudiosGeneticos',
  'incTipoEstudio',
  'incHallazgo',
  'incAccionRequerida',
  'otrosMotivo',
  'otrosEstudios',
  'otrosPlan',
  'monoTratamiento',
  'monoPlanEstudios',
  'monoNotas',
  'estudiosPrimerNivel',
  'estudiosSegundoNivel',
  'estudiosTercerNivel',
  'estudiosComplementariosNotas',
  'sintesisClasificacion',
  'sintesisSindromico',
  'sintesisReversibilidad',
  'sintesisEtiologia',
  'planDerivaciones',
  'planConsejeriaGenetica',
  'planControles',
  'planRegistroHpo',
  'primeraEvolucion',
  'identificacionNombre',
  'identificacionEdad',
  'identificacionDni',
  'identificacionCobertura',
  'identificacionDomicilio',
  'identificacionFechaConsulta',
  'identificacionFum',
  'identificacionEdadGestacional',
  'identificacionMetodoCalculo',
  'identificacionMotivoConsulta',
  'antecedentesMedicosCronicos',
  'antecedentesCirugias',
  'antecedentesMedicaciones',
  'antecedentesConsumo',
  'antecedentesVacunas',
  'antecedentesMenarca',
  'antecedentesMetodoAnticonceptivo',
  'antecedentesHistoriaObstetrica',
  'antecedentesComplicacionesPrevias',
  'antecedentesAbortos',
  'antecedentesConsanguinidad',
  'antecedentesEtnia',
  'familiaHistoriaGenetica',
  'familiaAbortosRecurrentes',
  'familiaPortadores',
  'familiaCancer',
  'familiaArbolGenealogico',
  'parejaEdad',
  'parejaOcupacion',
  'parejaAntecedentesMedicos',
  'parejaConsumo',
  'parejaHistoriaFamiliar',
  'embarazoControlPrenatal',
  'embarazoSuplementacion',
  'embarazoInfecciones',
  'embarazoEventos',
  'embarazoPesoTension',
  'embarazoMovimientos',
  'embarazoLaboratorios',
  'estudiosEcoPrimerTrimestre',
  'estudiosEcoSegundoTrimestre',
  'estudiosEcoDoppler',
  'estudiosScreening',
  'estudiosScreeningResultados',
  'estudiosInvasivos',
  'estudiosInvasivosHallazgos',
  'psicosocialEducacion',
  'psicosocialApoyo',
  'psicosocialDeseo',
  'psicosocialSituacion',
  'psicosocialViolencia',
  'sintesisResumen',
  'sintesisPlanAccion',
  'sintesisRegistro',
];

const PLAN_FIELDS_SET = new Set(PLAN_FIELDS);

const CLINICAL_FIELDS = Object.keys(FLAT_DEFAULTS).filter(
  (key) => !ADMINISTRATIVE_FIELDS.includes(key)
    && !MOTIVO_FIELDS.includes(key)
    && !PLAN_FIELDS_SET.has(key),
);

const SECTION_FIELDS = {
  administrativo: ADMINISTRATIVE_FIELDS,
  motivo: MOTIVO_FIELDS,
  clinico: CLINICAL_FIELDS,
  plan: PLAN_FIELDS,
};

const FIELD_SECTION = Object.entries(SECTION_FIELDS).reduce((acc, [section, fields]) => {
  fields.forEach((field) => {
    acc[field] = section;
  });
  return acc;
}, {});

const SECTION_DEFAULTS = Object.fromEntries(
  Object.entries(SECTION_FIELDS).map(([section, fields]) => [
    section,
    fields.reduce((acc, field) => {
      acc[field] = FLAT_DEFAULTS[field] ?? '';
      return acc;
    }, {}),
  ]),
);

const REQUIRED_STRING = (message) => z.string().trim().min(1, message);

const STEP1_SCHEMA = z.object({
  pacienteNombre: REQUIRED_STRING('Ingresá el nombre del paciente'),
  pacienteApellido: REQUIRED_STRING('Ingresá el apellido del paciente'),
  pacienteDni: REQUIRED_STRING('Completá el DNI'),
  pacienteNacimiento: REQUIRED_STRING('Indicá la fecha de nacimiento'),
  motivoGroup: REQUIRED_STRING('Seleccioná un grupo principal'),
});

const STEP2_SCHEMA = z.object({
  motivoGroup: REQUIRED_STRING('Seleccioná un grupo principal'),
  motivoDetail: REQUIRED_STRING('Seleccioná el motivo específico'),
});

const STEP3_SCHEMA = z.object({
  agNumber: REQUIRED_STRING('Asigná un número de HC/AG'),
  pacienteNombre: REQUIRED_STRING('Ingresá el nombre del paciente'),
  pacienteApellido: REQUIRED_STRING('Ingresá el apellido del paciente'),
  pacienteNacimiento: REQUIRED_STRING('Indicá la fecha de nacimiento'),
  pacienteSexo: REQUIRED_STRING('Seleccioná sexo/identidad de referencia'),
  medicoAsignado: REQUIRED_STRING('Asigná el profesional responsable'),
});

const STEP_IDENT_SCHEMA = z.object({
  pacienteDireccion: REQUIRED_STRING('Ingresá un domicilio de referencia'),
  pacienteObraSocial: REQUIRED_STRING('Indicá la cobertura/obra social'),
  contactoTelefono1: REQUIRED_STRING('Agregá al menos un teléfono de contacto'),
});

const formatIssues = (issues) => {
  if (!issues) return {};
  return issues.reduce((acc, issue) => {
    const key = issue.path?.[0];
    if (typeof key === 'string' && !acc[key]) {
      acc[key] = issue.message;
    }
    return acc;
  }, {});
};

const runSchema = (schema, data) => {
  const parsed = schema.safeParse(data);
  if (parsed.success) return {};
  return formatIssues(parsed.error?.issues);
};

const runStepValidators = ({ step, data, context }) => {
  if (step === 1) {
    if (context?.showAdministrativeStep === false) return {};
    return runSchema(STEP1_SCHEMA, data);
  }
  if (step === 2) {
    return runSchema(STEP2_SCHEMA, data);
  }
  if (step === 3) {
    return runSchema(STEP3_SCHEMA, data);
  }
  if (step === 4) {
    const errors = {};
    const groupId = context?.groupId;
    if (groupId === 'prenatal') {
      if (!data.prenatalSemanas?.trim()) {
        errors.prenatalSemanas = 'Registrá la semana del hallazgo principal';
      }
      if (!data.prenatalEcografia?.trim() && !data.prenatalCribado?.trim()) {
        errors.prenatalEcografia = 'Detallá hallazgos ecográficos o cribados alterados';
      }
    }
    if (groupId === 'fertilidad') {
      if (!data.reproTiempoBusqueda?.trim() && !data.reproPerdidasGestacionales?.trim()) {
        errors.reproTiempoBusqueda = 'Indicá tiempo de búsqueda o pérdidas registradas';
      }
    }
    if (groupId === 'onco') {
      if (!data.oncoTiposTumor?.trim() && !data.oncoEstudiosPrevios?.trim()) {
        errors.oncoTiposTumor = 'Completá tipos de tumor o estudios genéticos previos';
      }
    }
    return errors;
  }
  if (step === 5) {
    return runSchema(STEP_IDENT_SCHEMA, data);
  }
  return {};
};

const flattenState = (state) => ({
  ...state.administrativo,
  ...state.motivo,
  ...state.clinico,
  ...state.plan,
});

const splitIntoSections = (flat) => {
  const base = {
    administrativo: { ...SECTION_DEFAULTS.administrativo },
    motivo: { ...SECTION_DEFAULTS.motivo },
    clinico: { ...SECTION_DEFAULTS.clinico },
    plan: { ...SECTION_DEFAULTS.plan },
  };
  Object.entries(flat || {}).forEach(([field, value]) => {
    const section = FIELD_SECTION[field];
    if (section) {
      base[section][field] = value ?? '';
    }
  });
  return base;
};

const readStorageSnapshot = (storageKey) => {
  if (!storageKey || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      version: parsed.version || 1,
      flat: typeof parsed.flat === 'object' && parsed.flat ? parsed.flat : {},
      timestamp: parsed.timestamp || null,
    };
  } catch (error) {
    if (import.meta?.env?.DEV && typeof console !== 'undefined') {
      console.warn('[useCaseWizardState] No se pudo leer el autosave', error);
    }
    return null;
  }
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'update': {
      const { section, field, value } = action.payload;
      if (!section || !field) return state;
      if (!state[section] || state[section][field] === value) return state;
      return {
        ...state,
        [section]: { ...state[section], [field]: value },
      };
    }
    case 'updateMany': {
      const updates = action.payload;
      if (!updates || typeof updates !== 'object') return state;
      const next = { ...state };
      const touched = new Set();
      Object.entries(updates).forEach(([field, value]) => {
        const section = FIELD_SECTION[field];
        if (!section) return;
        if (!touched.has(section)) {
          next[section] = { ...next[section] };
          touched.add(section);
        }
        next[section][field] = value ?? '';
      });
      return next;
    }
    case 'reset': {
      return splitIntoSections(action.payload);
    }
    default:
      return state;
  }
};

export function useCaseWizardState({
  initialData = {},
  storageKey,
} = {}) {
  const storageSnapshot = useMemo(() => readStorageSnapshot(storageKey), [storageKey]);
  const [state, dispatch] = useReducer(
    reducer,
    { initialData, snapshot: storageSnapshot },
    ({ initialData: flatData, snapshot }) => {
      const baseFlat = { ...FLAT_DEFAULTS, ...(flatData || {}) };
      const mergedFlat = snapshot?.flat ? { ...baseFlat, ...snapshot.flat } : baseFlat;
      return splitIntoSections(mergedFlat);
    },
  );

  const [autosaveState, setAutosaveState] = useState(() => ({
    status: storageSnapshot ? 'saved' : 'idle',
    lastSavedAt: storageSnapshot?.timestamp || null,
  }));

  const skipNextSaveRef = useRef(true);

  const flat = useMemo(() => flattenState(state), [state]);

  const updateField = useCallback((field, value) => {
    const section = FIELD_SECTION[field];
    if (!section) {
      if (import.meta?.env?.DEV && typeof console !== 'undefined') {
        console.warn(`[useCaseWizardState] Campo desconocido: ${field}`);
      }
      return;
    }
    dispatch({ type: 'update', payload: { section, field, value } });
  }, []);

  const updateMany = useCallback((patch) => {
    if (!patch || typeof patch !== 'object') return;
    dispatch({ type: 'updateMany', payload: patch });
  }, []);

  const resetTo = useCallback((flatData) => {
    skipNextSaveRef.current = true;
    const nextFlat = { ...FLAT_DEFAULTS, ...(flatData || {}) };
    dispatch({ type: 'reset', payload: nextFlat });
  }, []);

  useEffect(() => {
    if (!initialData || Object.keys(initialData).length === 0) return;
    skipNextSaveRef.current = true;
    const nextFlat = { ...FLAT_DEFAULTS, ...initialData };
    dispatch({ type: 'reset', payload: nextFlat });
  }, [initialData]);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return undefined;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return undefined;
    }
    setAutosaveState((prev) => (prev.status === 'saving'
      ? prev
      : { ...prev, status: 'saving' }));
    const timeoutId = window.setTimeout(() => {
      try {
        const payload = JSON.stringify({
          version: 1,
          timestamp: Date.now(),
          flat,
        });
        window.localStorage.setItem(storageKey, payload);
        setAutosaveState({ status: 'saved', lastSavedAt: Date.now() });
      } catch (error) {
        if (import.meta?.env?.DEV && typeof console !== 'undefined') {
          console.warn('[useCaseWizardState] Error al guardar autosave', error);
        }
        setAutosaveState((prev) => ({ ...prev, status: 'error' }));
      }
    }, 600);
    return () => window.clearTimeout(timeoutId);
  }, [flat, storageKey]);

  const clearAutosave = useCallback(() => {
    if (!storageKey || typeof window === 'undefined') return;
    window.localStorage.removeItem(storageKey);
    setAutosaveState({ status: 'idle', lastSavedAt: null });
  }, [storageKey]);

  const validateStep = useCallback(
    (step, context = {}, options = {}) => {
      const data = options.data || flat;
      const errors = runStepValidators({ step, data, context });
      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
    [flat],
  );

  const validateAll = useCallback(
    (context = {}) => {
      const data = flat;
      const results = [1, 2, 3, 4].map((step) => runStepValidators({ step, data, context }));
      const mergedErrors = results.reduce((acc, errors) => ({ ...acc, ...errors }), {});
      return {
        valid: Object.keys(mergedErrors).length === 0,
        errors: mergedErrors,
      };
    },
    [flat],
  );

  return {
    state,
    flat,
    updateField,
    updateMany,
    resetTo,
    autosaveState,
    clearAutosave,
    validateStep,
    validateAll,
    fieldSection: FIELD_SECTION,
  };
}

export const wizardSections = SECTION_FIELDS;
