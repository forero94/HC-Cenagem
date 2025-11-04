import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { GRUPOS_CONSULTA, postprocessSecciones, getGroupIdFromDetail } from '@/lib/gruposConsulta';
import StepAdministrativo from './StepAdministrativo';
import StepMotivo from './StepMotivo';
import StepPaciente from './StepPaciente';
import { getPacienteStepAvailability } from './pacienteStepLayout';
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

  const maxStep = steps.length;
  const minStep = 1;
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

  const getValidationStepNumber = useCallback((stepIndex) => {
    const stepDef = steps[stepIndex - 1];
    if (!stepDef) return null;
    return validationMap[stepDef.id] || null;
  }, [steps, validationMap]);

  const currentValidation = useMemo(() => {
    const validatorNumber = getValidationStepNumber(step);
    if (!validatorNumber) {
      return { valid: true, errors: {} };
    }
    return validateStep(validatorNumber, context);
  }, [validateStep, context, getValidationStepNumber, step]);

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
    if (ensureStepValid(step)) {
      setStep((prev) => Math.min(maxStep, prev + 1));
    }
  }, [ensureStepValid, step, maxStep]);

  const handleFinalSubmit = useCallback(() => {
    for (const target of validationStepIndexes) {
      if (!ensureStepValid(target)) {
        setStep(target);
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
    setStep((prev) => Math.max(minStep, prev - 1));
  }, [minStep]);

  const goToStep = useCallback((target) => {
    setStep(Math.max(minStep, Math.min(maxStep, target)));
  }, [minStep, maxStep]);

  const handleCancelClick = useCallback(() => {
    clearAutosave();
    if (typeof onCancel === 'function') {
      onCancel(flat);
    }
  }, [clearAutosave, onCancel, flat]);

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
  const currentStepDefinition = steps[step - 1] || steps[0];
  const currentStepId = currentStepDefinition?.id;

  const primaryButtonDisabled = busy;
  const backDisabled = step <= minStep || busy;
  const nextButtonLabel = step === maxStep ? (busy ? 'Creando…' : 'Crear HC') : 'Siguiente';

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
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
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
            const disabled = (!isEnabled && !isActive) || busy;
            const display = `${number}. ${definition.label}`;
            const spacingClass = (definition.id === 'preguntas' || definition.id === 'identificacion') ? 'ml-4' : '';
            return (
              <button
                key={definition.id}
                type="button"
                onClick={() => goToStep(number)}
                disabled={disabled}
                aria-current={isActive ? 'page' : undefined}
                className={`${spacingClass} ${isActive
                  ? 'px-3 py-2 rounded-xl border border-slate-900 bg-slate-900 text-white font-semibold shadow-sm'
                  : 'px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-60'
                }`}
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
            <p className="font-semibold">Revisá los campos obligatorios antes de continuar:</p>
            <ul className="mt-1 list-disc pl-4 space-y-1">
              {errorMessages.map((message, index) => (
                <li key={`${message}-${index}`}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {currentStepId === 'administrativo' && (
          <StepAdministrativo
            grupos={GRUPOS_CONSULTA}
            value={flat}
            onChange={handleFieldChange}
            errors={currentStepErrors}
          />
        )}

        {currentStepId === 'motivo' && (
          <StepMotivo
            grupos={GRUPOS_CONSULTA}
            value={{
              motivoGroup: flat.motivoGroup,
              motivoDetail: flat.motivoDetail,
              motivoPaciente: flat.motivoPaciente,
              motivoDerivacion: flat.motivoDerivacion,
            }}
            onChange={handleMotivoChange}
            errors={currentStepErrors}
          />
        )}

        {currentStepId === 'antecedentes' && (
          <StepPaciente
            secciones={secciones}
            grupos={GRUPOS_CONSULTA}
            value={flat}
            edad={edad}
            onChange={handleFieldChange}
            mode="antecedentes"
            errors={currentStepErrors}
          />
        )}

        {currentStepId === 'historia' && (
          <StepPaciente
            secciones={secciones}
            grupos={GRUPOS_CONSULTA}
            value={flat}
            edad={edad}
            onChange={handleFieldChange}
            mode="historia"
            errors={currentStepErrors}
          />
        )}

        {currentStepId === 'preguntas' && (
          <StepGrupoEspecifico
            groupId={resolvedGroupId}
            value={flat}
            onChange={handleFieldChange}
          />
        )}

        {currentStepId === 'examen' && (
          <StepPaciente
            secciones={secciones}
            grupos={GRUPOS_CONSULTA}
            value={flat}
            edad={edad}
            onChange={handleFieldChange}
            mode="examen"
            errors={currentStepErrors}
          />
        )}

        {currentStepId === 'estudios' && (
          <StepEstudiosComplementarios
            groupId={resolvedGroupId}
            value={flat}
            onChange={handleFieldChange}
          />
        )}

        {currentStepId === 'primera' && (
          <StepPrimeraEvolucion
            value={flat}
            onChange={handleFieldChange}
          />
        )}

        {currentStepId === 'identificacion' && (
          <StepPaciente
            secciones={secciones}
            grupos={GRUPOS_CONSULTA}
            value={flat}
            edad={edad}
            onChange={handleFieldChange}
            mode="identificacion"
            errors={currentStepErrors}
          />
        )}
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
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            Atrás
          </button>

          <div className="hidden flex-1 items-center justify-center gap-2 text-xs text-slate-600 sm:flex" aria-label="Accesos rápidos a los pasos clínicos">
            <span className="font-semibold text-slate-500">Ir a:</span>
            {stepShortcuts.map(({ number, label, enabled }) => {
              const isActive = step === number;
              const disabled = isActive || busy || !enabled;
              const displayLabel = `${number}. ${label}`;
              return (
                <button
                  key={number}
                  type="button"
                  onClick={() => goToStep(number)}
                  disabled={disabled}
                  aria-current={isActive ? 'step' : undefined}
                  className={
                    isActive
                      ? 'px-3 py-2 rounded-xl border border-slate-900 bg-slate-900 text-white font-semibold'
                      : 'px-3 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-50'
                  }
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
              className="px-4 py-2 rounded-xl border border-slate-900 bg-slate-900 text-white disabled:opacity-50"
            >
              {nextButtonLabel}
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
