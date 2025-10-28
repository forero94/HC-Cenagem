import React, { useEffect, useMemo, useState } from 'react';
import StepAdministrativo from '@/components/NewCase/StepAdministrativo';
import { GRUPOS_CONSULTA } from '@/lib/gruposConsulta';

const ADMIN_INITIAL_FORM = {
  pacienteNombre: '',
  pacienteApellido: '',
  pacienteDni: '',
  pacienteNacimiento: '',
  pacienteDireccion: '',
  pacienteObraSocial: '',
  pacienteObraSocialNumero: '',
  motivoGroup: '',
  contactoTelefono1: '',
  contactoTelefono2: '',
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
  medicoAsignado: '',
};

const WIZARD_STEPS_LABELS = ['Administrativo', 'Motivo', 'Paciente', 'Específico', 'Resumen'];

export default function NewCaseCreate({
  currentUser,
  onCreate,
  onCancel,
  busy = false,
  errorMessage = '',
  onDismissError = () => {},
}) {
  const [form, setForm] = useState(ADMIN_INITIAL_FORM);

  useEffect(() => {
    if (currentUser?.name) {
      setForm((prev) => (prev.medicoAsignado ? prev : { ...prev, medicoAsignado: currentUser.name }));
    }
  }, [currentUser]);

  const canCreate = useMemo(() => {
    const nombre = (form.pacienteNombre || '').trim();
    const apellido = (form.pacienteApellido || '').trim();
    const dni = (form.pacienteDni || '').trim();
    const nacimiento = (form.pacienteNacimiento || '').trim();
    const grupo = (form.motivoGroup || '').trim();
    const cobertura = (form.pacienteObraSocial || '').trim();
    return Boolean(nombre && apellido && dni && nacimiento && grupo && cobertura);
  }, [
    form.pacienteNombre,
    form.pacienteApellido,
    form.pacienteDni,
    form.pacienteNacimiento,
    form.motivoGroup,
    form.pacienteObraSocial,
  ]);

  const handleAdminChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = () => {
    if (!canCreate || busy) return;
    onDismissError?.();
    onCreate?.(form);
  };

  const handleCancel = () => {
    setForm(ADMIN_INITIAL_FORM);
    onDismissError?.();
    onCancel?.();
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-900">Nueva HC familiar</h1>
            <span className="text-xs text-slate-500">
              Profesional: {form.medicoAsignado || currentUser?.name || currentUser?.email || '—'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!canCreate || busy}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-900 bg-slate-900 text-white disabled:opacity-50"
            >
              {busy ? 'Creando…' : 'Crear HC'}
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 pb-3 text-xs text-slate-600">
          {WIZARD_STEPS_LABELS.map((label, index) => (
            <div
              key={label}
              className={`px-2 py-1 rounded-lg border ${index === 0 ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-400'}`}
            >
              {index + 1}. {label}
            </div>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 grid gap-6">
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <div className="pt-1 font-semibold text-rose-600">Atención</div>
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
            <button
              type="button"
              onClick={() => onDismissError?.()}
              className="ml-4 text-xs font-medium text-rose-600 hover:text-rose-700"
            >
              Cerrar
            </button>
          </div>
        )}
        <p className="text-sm text-slate-600">
          Completá los datos administrativos para generar la nueva historia clínica. Luego, cuando el equipo ingrese a la HC por primera vez, podrá completar la información clínica con el asistente.
        </p>
        <StepAdministrativo
          grupos={GRUPOS_CONSULTA}
          value={form}
          onChange={handleAdminChange}
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate || busy}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-900 bg-slate-900 text-white disabled:opacity-50"
          >
            {busy ? 'Creando…' : 'Crear HC'}
          </button>
        </div>
      </main>
    </div>
  );
}
