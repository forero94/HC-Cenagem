import React, { useMemo, useState, useEffect } from 'react';
import { GRUPOS_CONSULTA, postprocessSecciones, getGroupIdFromDetail } from '@/lib/gruposConsulta';
import StepAdministrativo from './StepAdministrativo';
import StepMotivo from './StepMotivo';
import StepPaciente from './StepPaciente';
import StepGrupoEspecifico from './StepGrupoEspecifico';
import StepResumen from './StepResumen';

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

const emptyForm = {
  pacienteNombre: '', pacienteApellido: '', pacienteDni: '',
  pacienteNacimiento: '', pacienteDireccion: '',
  motivoGroup: '', motivoDetail: '', motivoPaciente: '', motivoDerivacion: '',
  consultaFecha: '',
  pacienteEscolaridad: '', pacienteEscolaridadRendimiento: '',
  pacienteAcompanante: '', pacienteAcompananteParentesco: '',
  contactoTelefono1: '',
  contactoTelefono2: '',
  pacienteObraSocial: '', pacienteObraSocialNumero: '',
  tutorPadreNombre: '', tutorPadreApellido: '', tutorPadreProcedencia: '', tutorPadreConsanguinidad: '',
  tutorPadrePadreApellido: '', tutorPadrePadreProcedencia: '', tutorPadreMadreApellido: '', tutorPadreMadreProcedencia: '',
  tutorMadreNombre: '', tutorMadreApellido: '', tutorMadreProcedencia: '', tutorMadreConsanguinidad: '',
  tutorMadrePadreApellido: '', tutorMadrePadreProcedencia: '', tutorMadreMadreApellido: '', tutorMadreMadreProcedencia: '',
  agNumber: '', provincia: '', medicoAsignado: '',
  pacienteSexo: '', pacienteEmail: '', pacienteTelefono: '',
  pacienteProfesion: '', pacienteAntecedentes: '',
  antecedentesNeurologicos: '', antecedentesMetabolicos: '', antecedentesSensoriales: '', antecedentesPsicosociales: '',
  pacienteExamenPeso: '', pacienteExamenTalla: '', pacienteExamenPc: '',
  pacienteExamenPesoPercentil: '', pacienteExamenTallaPercentil: '', pacienteExamenPcPercentil: '',
  pacienteExamenProporciones: '',
  pacienteExamenObservaciones: '', pacienteExamenDismorfias: '', pacienteExamenOjos: '',
  pacienteExamenNariz: '', pacienteExamenFiltrum: '', pacienteExamenBoca: '',
  pacienteExamenOrejas: '', pacienteExamenCuello: '', pacienteExamenTorax: '',
  pacienteExamenColumna: '', pacienteExamenAbdomen: '', pacienteExamenGenitales: '',
  pacienteExamenMalformaciones: '', pacienteExamenPiel: '', pacienteExamenNeurologico: '', pacienteExamenOtras: '',
  edadMaternaConcepcion: '', edadPaternaConcepcion: '',
  controlPrenatal: '', controlPrenatalDetalle: '',
  embarazoComplicaciones: '', embarazoExposiciones: '',
  prenatalEcoAlteraciones: '',
  perinatalTipoParto: '', perinatalEdadGestacional: '', perinatalPesoNacimiento: '',
  perinatalTallaNacimiento: '', perinatalApgar1: '', perinatalApgar5: '', perinatalInternacionNeonatal: '', perinatalComplicaciones: '',
  prenatalSemanas: '', prenatalEcografia: '', prenatalCribado: '', prenatalRciu: '',
  prenatalInvasivos: '', prenatalGeneticaFetal: '', prenatalConsejeria: '', prenatalNotas: '',
  prenatalProcedimientos: '',
  ndHitosMotores: '', ndLenguaje: '', ndConducta: '', ndRegresion: '',
  ndAreaCognitiva: '', ndEscolaridadDetalle: '',
  ndEEG: '', ndRMN: '', ndEstudiosOtros: '', ndInterconsultas: '', ndApoyos: '',
  comportamientoInteraccion: '', comportamientoAdaptativas: '', comportamientoEscalas: '', comportamientoApoyo: '',
  reproTiempoBusqueda: '', reproFemeninoDatos: '', reproMasculinoDatos: '', reproPerdidasGestacionales: '',
  reproDiagnosticos: '', reproTratamientos: '', reproEstudiosPrevios: '', reproPlan: '',
  oncoTiposTumor: '', oncoEdadDiagnostico: '', oncoTratamientos: '', oncoEstudiosPrevios: '',
  oncoArbolFamiliar: '', oncoRiesgoModelos: '', oncoEstudiosDisponibles: '', oncoPlanSeguimiento: '',
  metaSintomasAgudos: '', metaCribadoNeonatal: '', metaBioquimica: '',
  consanguinidad: 'no', consanguinidadDetalle: '',
  familiaAntecedentesNeuro: '', familiaAbortosInfertilidad: '', familiaDesarrolloHermanos: '', familiaDiagnosticosGeneticos: '',
  obstetricosDescripcion: '',
  tallaEdadInicio: '', tallaFamiliaAdultos: '', tallaEstudiosPrevios: '', tallaTratamientos: '',
  dismorfiasDescripcion: '', dismorfiasSistemasAfectados: '', dismorfiasImagenes: '', dismorfiasEstudiosGeneticos: '',
  incTipoEstudio: '', incHallazgo: '', incAccionRequerida: '',
  otrosMotivo: '', otrosEstudios: '', otrosPlan: '',
  monoFenotipo: '', monoBioquimica: '', monoOrganoSistema: '', monoEstudiosPrevios: '', monoTratamiento: '',
  monoPlanEstudios: '', monoNotas: '',
  estudiosPrimerNivel: '', estudiosSegundoNivel: '', estudiosTercerNivel: '', estudiosComplementariosNotas: '',
  sintesisClasificacion: '', sintesisSindromico: '', sintesisReversibilidad: '', sintesisEtiologia: '',
  planDerivaciones: '', planConsejeriaGenetica: '', planControles: '', planRegistroHpo: '',
  resumenPrimeraConsulta: '',
  b1Nombre: '', b1Apellido: '', b1Nacimiento: '', b1Email: '', b1Profesion: '', b1ObraSocial: '', b1Antecedentes: '',
  c1Nombre: '', c1Apellido: '', c1Nacimiento: '', c1Email: '', c1Profesion: '', c1ObraSocial: '', c1Antecedentes: '',
  c1Gestas: '', c1Partos: '', c1Abortos: '', c1Cesareas: '',
  abueloPaternoApellido: '', abueloPaternoProcedencia: '',
  abuelaPaternaApellido: '', abuelaPaternaProcedencia: '',
  abueloMaternoApellido: '', abueloMaternoProcedencia: '',
  abuelaMaternaApellido: '', abuelaMaternaProcedencia: '',
};

export default function NewCaseWizard({
  currentUser,
  busy = false,
  onSubmit,
  onCancel,
  initialData = {},
  initialStep = 1,
  showAdministrativeStep = true,
}) {
  const mergedInitial = useMemo(() => ({ ...emptyForm, ...initialData }), [initialData]);
  const startStep = showAdministrativeStep ? initialStep : Math.max(2, initialStep);
  const [form, setForm] = useState(mergedInitial);
  const [step, setStep] = useState(startStep); // 1..5

  useEffect(() => {
    setForm(mergedInitial);
    setStep(startStep);
  }, [mergedInitial, startStep]);

  useEffect(() => {
    if (currentUser?.name) {
      setForm((prev) => ({ ...prev, medicoAsignado: prev.medicoAsignado || currentUser.name }));
    }
  }, [currentUser]);

  const edad = useMemo(() => calculateAgeYears(form.pacienteNacimiento), [form.pacienteNacimiento]);

  const resolvedGroupId = useMemo(() => {
    if (form.motivoDetail) {
      const fromDetail = getGroupIdFromDetail(form.motivoDetail);
      if (fromDetail) return fromDetail;
    }
    return form.motivoGroup;
  }, [form.motivoDetail, form.motivoGroup]);

  useEffect(() => {
    if (!resolvedGroupId) return;
    if (resolvedGroupId === form.motivoGroup) return;
    setForm((prev) => {
      if (prev.motivoGroup === resolvedGroupId) return prev;
      return { ...prev, motivoGroup: resolvedGroupId };
    });
  }, [resolvedGroupId, form.motivoGroup]);

  const secciones = useMemo(() => {
    if (!resolvedGroupId) return ['id', 'motivo', 'paciente'];
    return postprocessSecciones({ groupId: resolvedGroupId, edad });
  }, [resolvedGroupId, edad]);

  const canNextFromStep1 = Boolean(
    form.pacienteNombre && form.pacienteApellido && form.pacienteDni &&
    form.pacienteNacimiento && form.motivoGroup &&
    form.contactoTelefono1 &&
    form.pacienteDireccion && form.pacienteObraSocial
  );
  const canNextFromStep2 = Boolean(form.motivoGroup && form.motivoDetail);
  const canNextFromStep3 = Boolean(
    form.agNumber && form.provincia &&
    form.pacienteNombre && form.pacienteApellido &&
    form.pacienteNacimiento && form.pacienteSexo && form.medicoAsignado
  );

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleFinalSubmit = () => {
    if (form.motivoGroup === 'prenatal') {
      if (!form.prenatalSemanas || (!form.prenatalEcografia && !form.prenatalCribado)) return;
    }
    if (form.motivoGroup === 'fertilidad') {
      if (!form.reproTiempoBusqueda && !form.reproPerdidasGestacionales) return;
    }
    if (form.motivoGroup === 'onco') {
      if (!form.oncoTiposTumor && !form.oncoEstudiosPrevios) return;
    }
    const payload = { ...form, motivoGroup: resolvedGroupId, pacienteEdad: edad };
    onSubmit?.(payload);
  };

  const minStep = showAdministrativeStep ? 1 : 2;
  const maxStep = 5;

  const goToStep = (next) => {
    const clamped = Math.min(maxStep, Math.max(minStep, next));
    setStep(clamped);
  };

  const stepShortcuts = useMemo(
    () => ([
      { number: 2, label: 'Motivo' },
      { number: 3, label: 'Paciente' },
      { number: 4, label: 'Específico' },
      { number: 5, label: 'Revisión' },
    ]),
    [],
  );

  const visibleSteps = useMemo(() => {
    const labels = ['Administrativo', 'Motivo', 'Paciente', 'Específico', 'Revisión'];
    return labels
      .map((label, index) => ({ label, number: index + 1 }))
      .filter((entry) => showAdministrativeStep || entry.number !== 1);
  }, [showAdministrativeStep]);

  const nextDisabled = (
    (step === 1 && showAdministrativeStep && !canNextFromStep1) ||
    (step === 2 && !canNextFromStep2) ||
    (step === 3 && !canNextFromStep3)
  );

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Nueva HC familiar</h1>
            <span className="text-xs text-slate-500">Profesional: {form.medicoAsignado || '—'}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof onCancel === 'function') {
                onCancel(form);
              }
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center gap-2 text-xs text-slate-600">
          {visibleSteps.map(({ label, number }) => {
            const active = step === number;
            return (
              <div key={label} className={`px-2 py-1 rounded-lg border ${active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200'}`}>
                {showAdministrativeStep ? `${number}. ${label}` : label}
              </div>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 grid gap-6">
        {showAdministrativeStep && step === 1 && (
          <StepAdministrativo
            grupos={GRUPOS_CONSULTA}
            value={form}
            onChange={handleChange}
          />
        )}

        {step === 2 && (
          <StepMotivo
            grupos={GRUPOS_CONSULTA}
            value={{ motivoGroup: form.motivoGroup, motivoDetail: form.motivoDetail, motivoPaciente: form.motivoPaciente, motivoDerivacion: form.motivoDerivacion }}
            onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
          />
        )}

        {step === 3 && (
          <StepPaciente
            secciones={secciones}
            grupos={GRUPOS_CONSULTA}
            value={form}
            edad={edad}
            onChange={handleChange}
          />
        )}

        {step === 4 && (
          <StepGrupoEspecifico
            groupId={resolvedGroupId}
            value={form}
            edad={edad}
            onChange={handleChange}
          />
        )}

        {step === 5 && (
          <StepResumen
            value={form}
            edad={edad}
            grupos={GRUPOS_CONSULTA}
            onEditStep={goToStep}
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
            onClick={() => goToStep(step - 1)}
            disabled={step <= minStep || busy}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            Atrás
          </button>

          {step >= 2 ? (
            <div
              className="hidden flex-1 items-center justify-center gap-2 text-xs text-slate-600 sm:flex"
              aria-label="Accesos rápidos a los pasos clínicos"
            >
              <span className="font-semibold text-slate-500">Ir a:</span>
              {stepShortcuts.map(({ number, label }) => {
                const isActive = step === number;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => goToStep(number)}
                    disabled={isActive || busy}
                    aria-current={isActive ? 'step' : undefined}
                    className={
                      isActive
                        ? 'px-3 py-2 rounded-xl border border-slate-900 bg-slate-900 text-white font-semibold'
                        : 'px-3 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 disabled:opacity-50'
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="hidden flex-1 text-center text-xs text-slate-500 sm:block">
              Completá los datos y usá “Siguiente” para avanzar.
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              if (step === maxStep) {
                handleFinalSubmit();
              } else {
                goToStep(step + 1);
              }
            }}
            disabled={(step < maxStep && nextDisabled) || (step === maxStep && busy)}
            className="px-4 py-2 rounded-xl border border-slate-900 bg-slate-900 text-white disabled:opacity-50"
          >
            {step === maxStep ? (busy ? 'Creando…' : 'Crear HC') : 'Siguiente'}
          </button>
        </div>
      </nav>
    </div>
  );
}
