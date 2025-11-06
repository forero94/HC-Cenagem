import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { GRUPOS_CONSULTA, postprocessSecciones, getGroupIdFromDetail } from '@/lib/gruposConsulta';
import StepAdministrativo from './StepAdministrativo';
import StepMotivo from './StepMotivo';
import StepPaciente from './StepPaciente';
import StepFamilia from './StepFamilia';
import { getPacienteStepAvailability } from './pacienteStepLayout';
import StepExamen from './StepExamen';
import StepGrupoEspecifico from './StepGrupoEspecifico';
import StepEstudiosComplementarios from './StepEstudiosComplementarios';
import StepPrimeraEvolucion from './StepPrimeraEvolucion';
import { useCaseWizardState } from './useCaseWizardState';
import clinicalStepsConfig from './clinicalStepsConfig.json';

const calculateAgeYears = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let y = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) y -= 1;
  return y < 0 ? 0 : y;
};

const getAutosaveMessage = (state) => {
  if (!state) return null;
  if (state.status === 'saving') return 'Guardando cambios…';
  if (state.status === 'error') return 'No se pudo guardar automáticamente';
  if (state.status === 'saved' && state.lastSavedAt) {
    const time = new Date(state.lastSavedAt);
    return `Guardado automático ${time.toLocaleTimeString()}`;
  }
  return null;
};

const getTodayDateValue = () => {
  const now = new Date();
  const offsetMinutes = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offsetMinutes * 60000);
  return local.toISOString().slice(0, 10);
};

const ADMINISTRATIVE_STEP = {
  id: 'administrativo',
  label: 'Administrativo',
  telemetryEvent: 'clinical_step_administrativo',
};

const mapClinicalStep = (stepConfig, availability, groupId) => {
  const { availabilityKey, disableWhenFalse, telemetryEvent, ...rest } = stepConfig;
  if (!availabilityKey) {
    return {
      ...rest,
      id: stepConfig.id,
      label: stepConfig.label,
      telemetryEvent,
      availabilityKey: null,
      disableWhenFalse: Boolean(disableWhenFalse),
      groupId,
      enabled: true,
    };
  }

  const availabilityValue = availability?.[availabilityKey];
  const enabled = disableWhenFalse ? availabilityValue !== false : Boolean(availabilityValue);

  return {
    ...rest,
    id: stepConfig.id,
    label: stepConfig.label,
    telemetryEvent,
    availabilityKey,
    disableWhenFalse: Boolean(disableWhenFalse),
    groupId,
    enabled,
  };
};

const buildClinicalSteps = (availability, groupId) =>
  clinicalStepsConfig.map((stepConfig) => mapClinicalStep(stepConfig, availability, groupId));

const SECTION_STYLES = {
  administrativo: 'border-sky-300 bg-white',
  motivo: 'border-indigo-300 bg-white',
  antecedentes: 'border-amber-300 bg-white',
  historia: 'border-emerald-300 bg-white',
  preguntas: 'border-purple-300 bg-white',
  examen: 'border-rose-300 bg-white',
  estudios: 'border-blue-300 bg-white',
  primera: 'border-slate-300 bg-white',
  identificacion: 'border-teal-300 bg-white',
};

const BUTTON_BASE =
  'inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const BUTTON_PRIMARY = `${BUTTON_BASE} border-slate-900 bg-slate-900 text-white focus-visible:outline-slate-500 hover:bg-slate-800`;
const BUTTON_SECONDARY = `${BUTTON_BASE} border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-400`;
const BUTTON_PILL_BASE =
  'inline-flex h-9 items-center justify-center rounded-full border px-4 text-xs font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const BUTTON_PILL_ACTIVE = `${BUTTON_PILL_BASE} border-slate-900 bg-slate-900 text-white focus-visible:outline-slate-500`;
const BUTTON_PILL_INACTIVE = `${BUTTON_PILL_BASE} border-slate-300 bg-white text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-400`;

export default function NewCaseWizard({
  currentUser,
  busy = false,
  onSubmit,
  onCancel,
  initialData = {},
  initialStep = 1,
  showAdministrativeStep = true,
}) {
  const autosaveKey = useMemo(
    () => (currentUser?.id ? `cenagem:newcase:${currentUser.id}` : 'cenagem:newcase'),
    [currentUser?.id],
  );

  const {
    flat,
    updateField,
    updateMany,
    autosaveState,
    clearAutosave,
    validateStep,
  } = useCaseWizardState({ initialData, storageKey: autosaveKey });

const totalSteps = showAdministrativeStep ? 9 : 8;
  const normalizeInitialStep = showAdministrativeStep ? initialStep : Math.max(1, initialStep - 1);
const startStep = Math.max(1, Math.min(totalSteps, normalizeInitialStep));
const [step, setStep] = useState(startStep);
const [stepErrors, setStepErrors] = useState({});
  const sectionRefs = useRef({});
  const refCallbacks = useRef(new Map());

  const getSectionRef = useCallback((id) => {
    if (!refCallbacks.current.has(id)) {
      refCallbacks.current.set(id, (node) => {
        if (node) {
          sectionRefs.current[id] = node;
        } else {
          delete sectionRefs.current[id];
        }
      });
    }
    return refCallbacks.current.get(id);
  }, []);

useEffect(() => {
  setStep(startStep);
}, [startStep]);

useEffect(() => {
  const fallbackMedico =
    (typeof currentUser?.name === 'string' && currentUser.name.trim()) ||
    (typeof currentUser?.email === 'string' && currentUser.email.trim()) ||
    '';
  if (fallbackMedico && !flat.medicoAsignado) {
    updateField('medicoAsignado', fallbackMedico);
  }
}, [currentUser?.name, currentUser?.email, flat.medicoAsignado, updateField]);

useEffect(() => {
  if (!flat.consultaFecha) {
    updateField('consultaFecha', getTodayDateValue());
  }
}, [flat.consultaFecha, updateField]);

  const edad = useMemo(() => calculateAgeYears(flat.pacienteNacimiento), [flat.pacienteNacimiento]);

  const resolvedGroupId = useMemo(() => {
    if (flat.motivoDetail) {
      const fromDetail = getGroupIdFromDetail(flat.motivoDetail);
      if (fromDetail) return fromDetail;
    }
    return flat.motivoGroup;
  }, [flat.motivoDetail, flat.motivoGroup]);

  useEffect(() => {
    if (!resolvedGroupId) return;
    if (resolvedGroupId === flat.motivoGroup) return;
    updateField('motivoGroup', resolvedGroupId);
  }, [resolvedGroupId, flat.motivoGroup, updateField]);

  const secciones = useMemo(() => {
    if (!resolvedGroupId) return ['id', 'motivo', 'paciente'];
    return postprocessSecciones({ groupId: resolvedGroupId, edad });
  }, [resolvedGroupId, edad]);

  const pacienteAvailability = useMemo(
    () => getPacienteStepAvailability(Array.isArray(secciones) ? secciones : []),
    [secciones],
  );

  const context = useMemo(
    () => ({ showAdministrativeStep, groupId: resolvedGroupId }),
    [showAdministrativeStep, resolvedGroupId],
  );

  const clinicalSteps = useMemo(
    () => buildClinicalSteps(pacienteAvailability, resolvedGroupId),
    [resolvedGroupId, pacienteAvailability],
  );

  const steps = useMemo(
    () => (showAdministrativeStep
      ? [
        {
          ...ADMINISTRATIVE_STEP,
          groupId: resolvedGroupId,
          enabled: true,
        },
        ...clinicalSteps,
      ]
      : clinicalSteps),
    [showAdministrativeStep, clinicalSteps, resolvedGroupId],
  );

  const scrollToStepIndex = useCallback(
    (target) => {
      const definition = steps[target - 1];
      if (!definition) return;
      const node = sectionRefs.current[definition.id];
      if (node?.scrollIntoView) {
        node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [steps],
  );

  const maxStep = steps.length;
  const minStep = 1;
  const stepIndexById = useMemo(() => {
    const map = new Map();
    steps.forEach((definition, index) => {
      map.set(definition.id, index + 1);
    });
    return map;
  }, [steps]);
  const validationMap = useMemo(() => ({
      administrativo: 1,
      motivo: 2,
      historia: 3,
      preguntas: 4,
      identificacion: 5,
    }), []);
  const validationStepIndexes = useMemo(
    () => steps
      .map((stepDef, index) => ({ index: index + 1, validator: validationMap[stepDef.id] || null }))
      .filter((entry) => entry.validator)
      .map((entry) => entry.index),
    [steps, validationMap],
  );

  useEffect(() => {
    setStep((prev) => {
      if (prev < 1) return 1;
      if (prev > steps.length) return steps.length;
      return prev;
    });
  }, [steps.length]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute('data-step-id');
          if (!id) return;
          const index = stepIndexById.get(id);
          if (!index) return;
          setStep((prev) => (prev === index ? prev : index));
        });
      },
      {
        root: null,
        rootMargin: '-45% 0px -45% 0px',
        threshold: 0.3,
      },
    );

    const nodes = steps
      .map((definition) => sectionRefs.current[definition.id])
      .filter(Boolean);

    nodes.forEach((node) => observer.observe(node));

    return () => {
      nodes.forEach((node) => observer.unobserve(node));
      observer.disconnect();
    };
  }, [steps, stepIndexById]);

  const getValidationStepNumber = useCallback((stepIndex) => {
    const stepDef = steps[stepIndex - 1];
    if (!stepDef) return null;
    return validationMap[stepDef.id] || null;
  }, [steps, validationMap]);

  useEffect(() => {
    if (!stepErrors[step]) return;
    const validatorNumber = getValidationStepNumber(step);
    if (!validatorNumber) {
      return;
    }
    const validation = validateStep(validatorNumber, context);
    if (validation.valid) {
      setStepErrors((prev) => {
        if (!prev[step]) return prev;
        const next = { ...prev };
        delete next[step];
        return next;
      });
    }
  }, [flat, step, validateStep, context, stepErrors, getValidationStepNumber]);

    const ensureStepValid = useCallback(
      (targetStep) => {
        const validatorNumber = getValidationStepNumber(targetStep);
        if (!validatorNumber) {
          setStepErrors((prev) => {
          if (!prev[targetStep]) return prev;
          const next = { ...prev };
          delete next[targetStep];
          return next;
        });
        return true;
        }
        const validation = validateStep(validatorNumber, context);
        if (!validation.valid) {
          setStepErrors((prev) => ({ ...prev, [targetStep]: validation.errors }));
          if (import.meta?.env?.DEV && typeof console !== 'undefined') {
            console.warn(
              `[new-case] Paso ${targetStep} inválido`,
              Object.assign({}, validation.errors),
            );
          }
          return false;
        }
        setStepErrors((prev) => {
          if (!prev[targetStep]) return prev;
          const next = { ...prev };
        delete next[targetStep];
        return next;
      });
      return true;
    },
    [validateStep, context, getValidationStepNumber],
  );

  const handleFieldChange = useCallback((field, value) => {
    updateField(field, value);
  }, [updateField]);

  const handleMotivoChange = useCallback((patch) => {
    updateMany(patch);
  }, [updateMany]);

  const handleAdvance = useCallback(() => {
    if (!ensureStepValid(step)) return;
    const next = Math.min(maxStep, step + 1);
    setStep(next);
    scrollToStepIndex(next);
  }, [ensureStepValid, step, maxStep, scrollToStepIndex]);

  const handleFinalSubmit = useCallback(() => {
    for (const target of validationStepIndexes) {
      if (!ensureStepValid(target)) {
        setStep(target);
        scrollToStepIndex(target);
        return;
      }
    }
    const payload = { ...flat, motivoGroup: resolvedGroupId, pacienteEdad: edad };
    onSubmit?.(payload);
  }, [ensureStepValid, validationStepIndexes, flat, resolvedGroupId, edad, onSubmit]);

  const handlePrimaryAction = useCallback(() => {
    if (step === maxStep) {
      handleFinalSubmit();
    } else {
      handleAdvance();
    }
  }, [step, maxStep, handleAdvance, handleFinalSubmit]);

  const handleBack = useCallback(() => {
    const previous = Math.max(minStep, step - 1);
    setStep(previous);
    scrollToStepIndex(previous);
  }, [minStep, step, scrollToStepIndex]);

  const goToStep = useCallback(
    (target) => {
      const bounded = Math.max(minStep, Math.min(maxStep, target));
      setStep(bounded);
      scrollToStepIndex(bounded);
    },
    [minStep, maxStep, scrollToStepIndex],
  );

  const handleCancelClick = useCallback(() => {
    clearAutosave();
    if (typeof onCancel === 'function') {
      onCancel(flat);
    }
  }, [clearAutosave, onCancel, flat]);

  const renderStepContent = useCallback(
    (definition, index) => {
      const stepIndex = index + 1;
      const errorsForStep = stepErrors[stepIndex] || {};
      switch (definition.id) {
        case 'administrativo':
          return (
            <StepAdministrativo
              grupos={GRUPOS_CONSULTA}
              value={flat}
              onChange={handleFieldChange}
              errors={errorsForStep}
            />
          );
        case 'motivo':
          return (
            <StepMotivo
              grupos={GRUPOS_CONSULTA}
              value={{
                motivoGroup: flat.motivoGroup,
                motivoDetail: flat.motivoDetail,
                motivoPaciente: flat.motivoPaciente,
                motivoDerivacion: flat.motivoDerivacion,
                motivoFuenteDerivacion: flat.motivoFuenteDerivacion,
              }}
              onChange={handleMotivoChange}
              errors={errorsForStep}
            />
          );
        case 'antecedentes':
          return (
            <StepPaciente
              secciones={secciones}
              grupos={GRUPOS_CONSULTA}
              value={flat}
              edad={edad}
              onChange={handleFieldChange}
              mode="antecedentes"
              errors={errorsForStep}
            />
          );
        case 'familia':
          return (
            <StepFamilia
              value={flat}
              secciones={secciones}
              onChange={handleFieldChange}
            />
          );
        case 'historia':
          return (
            <StepPaciente
              secciones={secciones}
              grupos={GRUPOS_CONSULTA}
              value={flat}
              edad={edad}
              onChange={handleFieldChange}
              mode="historia"
              errors={errorsForStep}
            />
          );
        case 'preguntas':
          return (
            <StepGrupoEspecifico
              groupId={resolvedGroupId}
              value={flat}
              onChange={handleFieldChange}
            />
          );
          case 'examen':
            return (
              <StepExamen
                value={flat}
                onChange={handleFieldChange}
              />
            );
        case 'estudios':
          return (
            <StepEstudiosComplementarios
              groupId={resolvedGroupId}
              value={flat}
              onChange={handleFieldChange}
            />
          );
        case 'primera':
          return <StepPrimeraEvolucion value={flat} onChange={handleFieldChange} />;
        case 'identificacion':
          return (
            <StepPaciente
              secciones={secciones}
              grupos={GRUPOS_CONSULTA}
              value={flat}
              edad={edad}
              onChange={handleFieldChange}
              mode="identificacion"
              errors={errorsForStep}
            />
          );
        default:
          return null;
      }
    },
    [
      stepErrors,
      flat,
      handleFieldChange,
      handleMotivoChange,
      secciones,
      edad,
      resolvedGroupId,
    ],
  );

  const stepShortcuts = useMemo(
    () => steps
      .map((definition, index) => ({
        number: index + 1,
        label: definition.label,
        id: definition.id,
        enabled: definition.enabled !== false,
      }))
      .filter((entry) => entry.id !== 'administrativo'),
    [steps],
  );

  const currentStepErrors = stepErrors[step] || {};
  const errorMessages = Object.values(currentStepErrors);
  const autosaveMessage = useMemo(() => getAutosaveMessage(autosaveState), [autosaveState]);
  const primaryButtonDisabled = busy;
  const backDisabled = step <= minStep || busy;
  const nextButtonLabel = step === maxStep ? (busy ? 'Creando…' : 'Crear HC') : 'Ir a la siguiente sección';

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Nueva HC familiar</h1>
            <span className="text-xs text-slate-500">Profesional: {flat.medicoAsignado || currentUser?.name || currentUser?.email || '—'}</span>
          </div>
          <button
            type="button"
            onClick={handleCancelClick}
            className={BUTTON_SECONDARY}
          >
            Cancelar
          </button>
        </div>
        <nav
          className="mx-auto max-w-6xl px-4 pb-3 flex flex-wrap items-center gap-2 text-xs text-slate-600"
          aria-label="Navegación del caso"
        >
          {steps.map((definition, index) => {
            if (!showAdministrativeStep && definition.id === 'administrativo') return null;
            const number = index + 1;
            const isActive = step === number;
            const isEnabled = definition.enabled !== false;
            const disabled = busy;
            const display = `${number}. ${definition.label}`;
            const spacingClass = (definition.id === 'preguntas' || definition.id === 'identificacion') ? 'ml-4' : '';
            const className = isActive
              ? BUTTON_PILL_ACTIVE
              : isEnabled
                ? BUTTON_PILL_INACTIVE
                : `${BUTTON_PILL_INACTIVE} opacity-60`;
            return (
              <button
                key={definition.id}
                type="button"
                onClick={() => goToStep(number)}
                disabled={disabled}
                aria-current={isActive ? 'page' : undefined}
                className={`${spacingClass} ${className}`}
              >
                {display}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 grid gap-6">
        {errorMessages.length > 0 && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
          >
            <p className="font-semibold">Revisá los campos antes de continuar:</p>
            <ul className="mt-1 list-disc pl-4 space-y-1">
              {errorMessages.map((message, index) => (
                <li key={`${message}-${index}`}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {steps.map((definition, index) => {
          const content = renderStepContent(definition, index);
          if (!content) return null;
          const isActive = step === index + 1;
          const styleClasses = SECTION_STYLES[definition.id] || 'border-slate-200 bg-white';
          return (
            <section
              key={definition.id}
              id={`step-${definition.id}`}
              data-step-id={definition.id}
              ref={getSectionRef(definition.id)}
              className={`scroll-mt-36 overflow-hidden rounded-3xl border ${styleClasses} ${
                isActive ? 'shadow-xl ring-2 ring-slate-300' : 'shadow-sm'
              } transition-shadow`}
            >
              <div className="border-b border-slate-200 bg-white/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {index + 1}. {definition.label}
                </p>
              </div>
              <div className="px-4 pb-5 pt-4">{content}</div>
            </section>
          );
        })}
      </main>

      <nav
        className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur"
        aria-label="Acciones de navegación"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={backDisabled}
            className={BUTTON_SECONDARY}
          >
            Atrás
          </button>

          <div className="hidden flex-1 items-center justify-center gap-2 text-xs text-slate-600 sm:flex" aria-label="Accesos rápidos a los pasos clínicos">
            <span className="font-semibold text-slate-500">Ir a:</span>
            {stepShortcuts.map(({ number, label, enabled }) => {
              const isActive = step === number;
              const disabled = busy;
              const displayLabel = `${number}. ${label}`;
              const className = isActive
                ? BUTTON_PILL_ACTIVE
                : enabled
                  ? BUTTON_PILL_INACTIVE
                  : `${BUTTON_PILL_INACTIVE} opacity-60`;
              return (
                <button
                  key={number}
                  type="button"
                  onClick={() => goToStep(number)}
                  disabled={disabled}
                  aria-current={isActive ? 'step' : undefined}
                  className={className}
                >
                  {displayLabel}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col items-end gap-1">
            {autosaveMessage && (
              <span className="text-[11px] text-slate-400" aria-live="polite">{autosaveMessage}</span>
            )}
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={primaryButtonDisabled}
              className={BUTTON_PRIMARY}
            >
              {nextButtonLabel}
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
