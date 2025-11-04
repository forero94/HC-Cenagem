import {
  useReducer,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  useState,
} from 'react';
import type { Reducer } from 'react';
import { z, type ZodIssue } from 'zod';
import {
  CASE_WIZARD_FIELD_SECTION,
  CASE_WIZARD_FLAT_DEFAULTS,
  CASE_WIZARD_SECTION_IDS,
  CASE_WIZARD_SECTIONS,
  type CaseWizardFieldKey,
  type CaseWizardFlat,
  type CaseWizardSectionId,
} from './caseWizard.generated';
import {
  CASE_WIZARD_MESSAGES,
  type CaseWizardMessageKey,
} from './caseWizard.messages';

type SectionFieldMap = typeof CASE_WIZARD_SECTIONS;
type SectionFieldKey<S extends CaseWizardSectionId> = SectionFieldMap[S][number];
type CaseWizardSectionState<S extends CaseWizardSectionId> = Pick<
CaseWizardFlat,
SectionFieldKey<S>
>;

type CaseWizardSectionsState = {
  [S in CaseWizardSectionId]: CaseWizardSectionState<S>;
};

type CaseWizardFlatPartial = Partial<CaseWizardFlat>;

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutosaveState {
  status: AutosaveStatus;
  lastSavedAt: number | null;
}

interface StorageSnapshot {
  version: number;
  flat: CaseWizardFlatPartial;
  timestamp: number | null;
}

interface StepValidationContext {
  showAdministrativeStep?: boolean;
  groupId?: string | null;
}

type StepValidationErrors = Partial<Record<CaseWizardFieldKey, string>>;

interface ValidateStepOptions {
  data?: CaseWizardFlat;
}

interface ValidationResult {
  valid: boolean;
  errors: StepValidationErrors;
}

const SECTION_FIELDS = CASE_WIZARD_SECTIONS;
const FIELD_SECTION = CASE_WIZARD_FIELD_SECTION;
const FLAT_DEFAULTS: CaseWizardFlat = CASE_WIZARD_FLAT_DEFAULTS;

const buildSectionDefaults = <S extends CaseWizardSectionId>(
  section: S,
): CaseWizardSectionState<S> => {
  const fields = SECTION_FIELDS[section] as readonly SectionFieldKey<S>[];
  return fields.reduce((acc, field) => {
    acc[field] = FLAT_DEFAULTS[field];
    return acc;
  }, {} as CaseWizardSectionState<S>);
};

const SECTION_DEFAULTS: CaseWizardSectionsState = CASE_WIZARD_SECTION_IDS.reduce(
  (acc, section) => {
    acc[section] = buildSectionDefaults(section);
    return acc;
  },
  {} as CaseWizardSectionsState,
);

const requiredMessage = (key: CaseWizardMessageKey, min = 1) =>
  z.string().trim().min(min, CASE_WIZARD_MESSAGES[key]);

const STEP1_SCHEMA = z.object({
  agNumber: requiredMessage('agNumber'),
  pacienteNombre: requiredMessage('pacienteNombre'),
  pacienteDni: requiredMessage('pacienteDni'),
});

const STEP2_SCHEMA = z.object({
  motivoGroup: requiredMessage('motivoGroup'),
  motivoDetail: requiredMessage('motivoDetail'),
  motivoPaciente: requiredMessage('motivoPaciente', 10),
});

const STEP3_SCHEMA = z.object({
  enfInicioContexto: requiredMessage('enfInicioContexto', 10),
  enfEvolucionActual: requiredMessage('enfEvolucionActual', 10),
  enfManifestacionesClaves: requiredMessage('enfManifestacionesClaves', 10),
});

const STEP_IDENT_SCHEMA = z.object({
  agNumber: requiredMessage('agNumber'),
  pacienteNombre: requiredMessage('pacienteNombre'),
  pacienteDni: requiredMessage('pacienteDni'),
  consultaFecha: requiredMessage('consultaFecha'),
});

const formatIssues = (issues: ZodIssue[] | undefined): StepValidationErrors => {
  if (!issues) return {};
  return issues.reduce<StepValidationErrors>((acc, issue) => {
    const key = issue.path?.[0];
    if (typeof key === 'string' && !acc[key as CaseWizardFieldKey]) {
      acc[key as CaseWizardFieldKey] = issue.message;
    }
    return acc;
  }, {});
};

const runSchema = (
  schema: z.ZodTypeAny,
  data: CaseWizardFlat,
): StepValidationErrors => {
  const parsed = schema.safeParse(data);
  if (parsed.success) return {};
  return formatIssues(parsed.error?.issues);
};

const runStepValidators = ({
  step,
  data,
  context,
}: {
  step: number;
  data: CaseWizardFlat;
  context?: StepValidationContext;
}): StepValidationErrors => {
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
    const errors: StepValidationErrors = {};
    const groupId = context?.groupId ?? undefined;
    if (groupId === 'prenatal') {
      if (!data.embarazoControlPrenatal?.trim()) {
        errors.embarazoControlPrenatal =
          'Registrá la semana del diagnóstico y tipo de control realizado';
      }
      const hasPrenatalHallazgos =
        data.estudiosEcoPrimerTrimestre?.trim()
        || data.estudiosEcoSegundoTrimestre?.trim()
        || data.estudiosEcoDoppler?.trim()
        || data.estudiosScreening?.trim()
        || data.estudiosScreeningResultados?.trim()
        || data.estudiosInvasivos?.trim()
        || data.estudiosInvasivosHallazgos?.trim();
      if (!hasPrenatalHallazgos) {
        errors.estudiosEcoSegundoTrimestre =
          'Detallá hallazgos ecográficos, cribados o estudios invasivos relevantes';
      }
    }
    if (groupId === 'fertilidad') {
      if (!data.reproDiagnosticos?.trim()) {
        errors.reproDiagnosticos =
          'Ingresá el diagnóstico o hallazgo reproductivo principal';
      }
      const hasReproContext =
        data.reproTratamientos?.trim()
        || data.reproEstudiosPrevios?.trim()
        || data.reproPlan?.trim();
      if (!hasReproContext) {
        errors.reproTratamientos =
          'Detallá tratamientos realizados, estudios previos o plan propuesto';
      }
    }
    if (groupId === 'onco') {
      if (!data.oncoArbolFamiliar?.trim()) {
        errors.oncoArbolFamiliar =
          'Describí la historia familiar oncológica relevante';
      }
      const hasOncoAnalisis =
        data.oncoRiesgoModelos?.trim()
        || data.oncoEstudiosDisponibles?.trim()
        || data.oncoPlanSeguimiento?.trim();
      if (!hasOncoAnalisis) {
        errors.oncoRiesgoModelos =
          'Documentá modelos de riesgo, estudios disponibles o plan de seguimiento';
      }
    }
    return errors;
  }
  if (step === 5) {
    return runSchema(STEP_IDENT_SCHEMA, data);
  }
  return {};
};

const flattenState = (state: CaseWizardSectionsState): CaseWizardFlat =>
  CASE_WIZARD_SECTION_IDS.reduce<CaseWizardFlat>((acc, section) => {
    Object.assign(acc, state[section]);
    return acc;
  }, {} as CaseWizardFlat);

const splitIntoSections = (
  flat: CaseWizardFlatPartial | null | undefined,
): CaseWizardSectionsState => {
  const base = {} as CaseWizardSectionsState;
  CASE_WIZARD_SECTION_IDS.forEach((section) => {
    base[section] = { ...SECTION_DEFAULTS[section] };
  });
  if (!flat) return base;

  (
    Object.entries(flat) as Array<
      [CaseWizardFieldKey, CaseWizardFlat[CaseWizardFieldKey]]
    >
  ).forEach(([field, value]) => {
    const section = FIELD_SECTION[field];
    if (!section) return;
    base[section][field] =
      value ?? (FLAT_DEFAULTS[field] as CaseWizardFlat[typeof field]);
  });
  return base;
};

const readStorageSnapshot = (
  storageKey?: string,
): StorageSnapshot | null => {
  if (!storageKey || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const snapshot = parsed as {
      version?: number;
      flat?: Record<string, unknown>;
      timestamp?: number | null;
    };

    const flat =
      snapshot.flat && typeof snapshot.flat === 'object'
        ? (snapshot.flat as CaseWizardFlatPartial)
        : {};

    return {
      version: snapshot.version ?? 1,
      flat,
      timestamp:
        typeof snapshot.timestamp === 'number' ? snapshot.timestamp : null,
    };
  } catch (error) {
    if (import.meta?.env?.DEV && typeof console !== 'undefined') {
      console.warn('[useCaseWizardState] No se pudo leer el autosave', error);
    }
    return null;
  }
};

type ReducerState = CaseWizardSectionsState;

type ReducerAction =
  | {
      type: 'update';
      payload: {
        section: CaseWizardSectionId;
        field: CaseWizardFieldKey;
        value: CaseWizardFlat[CaseWizardFieldKey];
      };
    }
  | { type: 'updateMany'; payload: CaseWizardFlatPartial }
  | { type: 'reset'; payload: CaseWizardFlatPartial };

type ReducerInitArg = {
  initialData?: CaseWizardFlatPartial;
  snapshot: StorageSnapshot | null;
};

const reducer: Reducer<ReducerState, ReducerAction> = (state, action) => {
  switch (action.type) {
    case 'update': {
      const { section, field, value } = action.payload;
      if (!state[section] || state[section][field] === value) return state;
      return {
        ...state,
        [section]: {
          ...state[section],
          [field]: value,
        },
      };
    }
    case 'updateMany': {
      const updates = action.payload;
      if (!updates || typeof updates !== 'object') return state;
      const next: ReducerState = { ...state };
      const touched = new Set<CaseWizardSectionId>();

      (
        Object.entries(updates) as Array<
          [CaseWizardFieldKey, CaseWizardFlat[CaseWizardFieldKey]]
        >
      ).forEach(([field, value]) => {
        const section = FIELD_SECTION[field];
        if (!section) return;
        if (!touched.has(section)) {
          next[section] = { ...next[section] };
          touched.add(section);
        }
        next[section][field] =
          value ?? (FLAT_DEFAULTS[field] as CaseWizardFlat[typeof field]);
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

interface UseCaseWizardStateOptions {
  initialData?: CaseWizardFlatPartial;
  storageKey?: string;
}

interface UseCaseWizardStateValue {
  state: CaseWizardSectionsState;
  flat: CaseWizardFlat;
  updateField: (
    field: CaseWizardFieldKey,
    value: CaseWizardFlat[CaseWizardFieldKey],
  ) => void;
  updateMany: (patch: CaseWizardFlatPartial) => void;
  resetTo: (flatData?: CaseWizardFlatPartial) => void;
  autosaveState: AutosaveState;
  clearAutosave: () => void;
  validateStep: (
    step: number,
    context?: StepValidationContext,
    options?: ValidateStepOptions,
  ) => ValidationResult;
  validateAll: (context?: StepValidationContext) => ValidationResult;
  fieldSection: typeof FIELD_SECTION;
}

export function useCaseWizardState({
  initialData = {},
  storageKey,
}: UseCaseWizardStateOptions = {}): UseCaseWizardStateValue {
  const storageSnapshot = useMemo(
    () => readStorageSnapshot(storageKey),
    [storageKey],
  );

  const [state, dispatch] = useReducer<
    ReducerState,
    ReducerAction,
    ReducerInitArg
  >(
    reducer,
    { initialData, snapshot: storageSnapshot },
    ({ initialData: flatData, snapshot }) => {
      const baseFlat: CaseWizardFlatPartial = {
        ...FLAT_DEFAULTS,
        ...(flatData ?? {}),
      };
      const mergedFlat = snapshot?.flat
        ? { ...baseFlat, ...snapshot.flat }
        : baseFlat;
      return splitIntoSections(mergedFlat);
    },
  );

  const [autosaveState, setAutosaveState] = useState<AutosaveState>(() => ({
    status: storageSnapshot ? 'saved' : 'idle',
    lastSavedAt: storageSnapshot?.timestamp ?? null,
  }));

  const skipNextSaveRef = useRef(true);

  const flat = useMemo(() => flattenState(state), [state]);

  const updateField = useCallback(
    (
      field: CaseWizardFieldKey,
      value: CaseWizardFlat[CaseWizardFieldKey],
    ) => {
      const section = FIELD_SECTION[field];
      if (!section) {
        if (import.meta?.env?.DEV && typeof console !== 'undefined') {
          console.warn(`[useCaseWizardState] Campo desconocido: ${field}`);
        }
        return;
      }
      dispatch({ type: 'update', payload: { section, field, value } });
    },
    [],
  );

  const updateMany = useCallback((patch: CaseWizardFlatPartial) => {
    if (!patch || typeof patch !== 'object') return;
    dispatch({ type: 'updateMany', payload: patch });
  }, []);

  const resetTo = useCallback((flatData?: CaseWizardFlatPartial) => {
    skipNextSaveRef.current = true;
    const nextFlat = { ...FLAT_DEFAULTS, ...(flatData ?? {}) };
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
    setAutosaveState((prev) =>
      prev.status === 'saving'
        ? prev
        : {
            ...prev,
            status: 'saving',
          },
    );
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
    (
      step: number,
      context: StepValidationContext = {},
      options: ValidateStepOptions = {},
    ): ValidationResult => {
      const data = options.data ?? flat;
      const errors = runStepValidators({ step, data, context });
      return {
        valid: Object.keys(errors).length === 0,
        errors,
      };
    },
    [flat],
  );

  const validateAll = useCallback(
    (context: StepValidationContext = {}): ValidationResult => {
      const data = flat;
      const results = [1, 2, 3, 4].map((step) =>
        runStepValidators({ step, data, context }),
      );
      const mergedErrors = results.reduce<StepValidationErrors>(
        (acc, errors) => ({ ...acc, ...errors }),
        {},
      );
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
