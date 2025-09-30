import React, { useEffect, useMemo, useState } from 'react';
import { MOTIVO_CONSULTA_GROUPS } from '@/lib/motivosConsulta.js';

const CONSANGUINIDAD_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'posible', label: 'Posible' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'desconocido', label: 'No sabe / No refiere' }
];

const MEDICAL_TEAM = [
  'Dra. López',
  'Dr. Sánchez',
  'Dra. Martínez',
  'Equipo interdisciplinario',
  'otro'
];

const calculateAgeYears = (iso) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    years -= 1;
  }
  return years >= 0 ? years : 0;
};

const initialFormState = {
  agNumber: '',
  provincia: '',
  motivoGroup: '',
  motivoDetail: '',
  motivoPaciente: '',
  motivoDerivacion: '',
  medicoAsignado: '',
  medicoAsignadoOtro: '',
  pacienteNombre: '',
  pacienteApellido: '',
  pacienteNacimiento: '',
  pacienteSexo: '',
  pacienteDireccion: '',
  pacienteEmail: '',
  pacienteTelefono: '',
  pacienteProfesion: '',
  pacienteObraSocial: '',
  pacienteAntecedentes: '',
  pacienteExamenPeso: '',
  pacienteExamenTalla: '',
  pacienteExamenPc: '',
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
  pacienteExamenOtras: '',
  consanguinidad: 'no',
  consanguinidadDetalle: '',
  obstetricosDescripcion: '',
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
  abuelaMaternaProcedencia: ''
};
export default function NewCaseModal({ open, onClose, onSubmit, busy = false }) {
  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (open) {
      setForm(initialFormState);
    }
  }, [open]);

  const currentGroup = useMemo(
    () => MOTIVO_CONSULTA_GROUPS.find((group) => group.id === form.motivoGroup) || null,
    [form.motivoGroup]
  );

  const detailOptions = useMemo(() => currentGroup?.options ?? [], [currentGroup]);
  const medicoSeleccionado = form.medicoAsignado === 'otro' ? form.medicoAsignadoOtro.trim() : form.medicoAsignado;
  const showConsanguinidadDetalle = form.consanguinidad && form.consanguinidad !== 'no';
  const pacienteEdad = useMemo(() => calculateAgeYears(form.pacienteNacimiento), [form.pacienteNacimiento]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const valid = Boolean(
    form.agNumber &&
      form.motivoGroup &&
      form.motivoDetail &&
      form.pacienteNombre &&
      form.pacienteApellido &&
      form.provincia &&
      medicoSeleccionado &&
      form.pacienteNacimiento &&
      form.pacienteSexo
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!valid || busy) return;

    const agNumber = form.agNumber.trim().toUpperCase();
    const payload = {
      ...form,
      agNumber,
      medicoAsignado: medicoSeleccionado,
      pacienteEdad,
    };

    onSubmit(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white shadow-2xl">
        <form onSubmit={handleSubmit} className="grid gap-6 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Nueva HC familiar</h2>
              <p className="text-sm text-slate-600">Completá la información clínica inicial para crear la historia familiar AG.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>

          <section className="grid gap-3">
            <h3 className="text-sm font-semibold text-slate-700">Identificación</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Nº AG</label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 uppercase"
                  value={form.agNumber}
                  onChange={(e) => handleChange('agNumber', e.target.value.toUpperCase())}
                  placeholder="AG-0001"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Profesional tratante</label>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <select
                    className="w-full md:w-auto flex-1 rounded-xl border border-slate-300 px-3 py-2"
                    value={form.medicoAsignado}
                    onChange={(e) => handleChange('medicoAsignado', e.target.value)}
                  >
                    <option value="">Seleccioná un profesional</option>
                    {MEDICAL_TEAM.map((medico) => (
                      <option key={medico} value={medico}>
                        {medico === 'otro' ? 'Otro (especificar)' : medico}
                      </option>
                    ))}
                  </select>
                  {form.medicoAsignado === 'otro' && (
                    <input
                      className="w-full md:w-auto flex-1 rounded-xl border border-slate-300 px-3 py-2"
                      value={form.medicoAsignadoOtro}
                      onChange={(e) => handleChange('medicoAsignadoOtro', e.target.value)}
                      placeholder="Nombre del profesional"
                    />
                  )}
                </div>
              </div>
            </div>
          </section>
          <section className="grid gap-3">
            <h3 className="text-sm font-semibold text-slate-700">Motivo de consulta</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-1">
                <label className="block text-xs text-slate-500 mb-1">Grupo</label>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={form.motivoGroup}
                  onChange={(e) => {
                    handleChange('motivoGroup', e.target.value);
                    handleChange('motivoDetail', '');
                  }}
                >
                  <option value="">Seleccionar…</option>
                  {MOTIVO_CONSULTA_GROUPS.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Detalle específico</label>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={form.motivoDetail}
                  onChange={(e) => handleChange('motivoDetail', e.target.value)}
                  disabled={!currentGroup}
                >
                  <option value="">Elegí el motivo puntual</option>
                  {detailOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">Seleccioná la opción que mejor describa la consulta. Evitá las categorías genéricas.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Relato del paciente (palabras propias)</label>
                <textarea
                  className="w-full min-h-[80px] rounded-xl border border-slate-300 px-3 py-2"
                  value={form.motivoPaciente}
                  onChange={(e) => handleChange('motivoPaciente', e.target.value)}
                  placeholder="¿Qué refiere el paciente?"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Motivo de derivación (profesional)</label>
                <textarea
                  className="w-full min-h-[80px] rounded-xl border border-slate-300 px-3 py-2"
                  value={form.motivoDerivacion}
                  onChange={(e) => handleChange('motivoDerivacion', e.target.value)}
                  placeholder="Resumen del profesional derivante"
                />
              </div>
            </div>
          </section>
          <section className="grid gap-3">
            <h3 className="text-sm font-semibold text-slate-700">Paciente que consulta (A1)</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Nombre</label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={form.pacienteNombre}
                  onChange={(e) => handleChange('pacienteNombre', e.target.value)}
                  placeholder="Nombre(s)"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Apellido</label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={form.pacienteApellido}
                  onChange={(e) => handleChange('pacienteApellido', e.target.value)}
                  placeholder="Apellido(s)"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Fecha de nacimiento</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={form.pacienteNacimiento}
                  onChange={(e) => handleChange('pacienteNacimiento', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Sexo</label>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={form.pacienteSexo}
                  onChange={(e) => handleChange('pacienteSexo', e.target.value)}
                  required
                >
                  <option value="">Seleccionar…</option>
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                  <option value="X">No binario / Intersex / Prefiere no decir</option>
                </select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Provincia</label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={form.provincia}
                  onChange={(e) => handleChange('provincia', e.target.value)}
                  placeholder="Provincia de residencia"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Edad actual</label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2"
                  value={pacienteEdad != null ? `${pacienteEdad}` : ''}
                  placeholder="Calculada automáticamente"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Profesión / actividad</label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={form.pacienteProfesion}
                  onChange={(e) => handleChange('pacienteProfesion', e.target.value)}
                  placeholder="Profesión u ocupación"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Obra social / cobertura</label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={form.pacienteObraSocial}
                  onChange={(e) => handleChange('pacienteObraSocial', e.target.value)}
                  placeholder="Cobertura"
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Dirección</label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={form.pacienteDireccion}
                  onChange={(e) => handleChange('pacienteDireccion', e.target.value)}
                  placeholder="Calle, número, localidad"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={form.pacienteEmail}
                  onChange={(e) => handleChange('pacienteEmail', e.target.value)}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Teléfono</label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={form.pacienteTelefono}
                  onChange={(e) => handleChange('pacienteTelefono', e.target.value)}
                  placeholder="(+54)"
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Antecedentes personales relevantes</label>
                <textarea
                  className="w-full min-h-[80px] rounded-xl border border-slate-300 px-3 py-2"
                  value={form.pacienteAntecedentes}
                  onChange={(e) => handleChange('pacienteAntecedentes', e.target.value)}
                  placeholder="Patologías previas, tratamientos, antecedentes perinatales, etc."
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Observaciones generales / notas clínicas</label>
                <textarea
                  className="w-full min-h-[80px] rounded-xl border border-slate-300 px-3 py-2"
                  value={form.pacienteExamenObservaciones}
                  onChange={(e) => handleChange('pacienteExamenObservaciones', e.target.value)}
                  placeholder="Resumen general del examen o hallazgos adicionales"
                />
              </div>
            </div>
          </section>
          <section className="grid gap-3">
            <h3 className="text-sm font-semibold text-slate-700">Examen físico orientado a genética</h3>
            <p className="text-xs text-slate-500">Registrá medidas antropométricas y hallazgos destacados. Los percentiles podrán calcularse luego con herramientas específicas.</p>
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Peso (kg)</label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={form.pacienteExamenPeso}
                  onChange={(e) => handleChange('pacienteExamenPeso', e.target.value)}
                  placeholder="Ej. 12.4"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Talla (cm)</label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={form.pacienteExamenTalla}
                  onChange={(e) => handleChange('pacienteExamenTalla', e.target.value)}
                  placeholder="Ej. 90"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Perímetro cefálico (cm)</label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={form.pacienteExamenPc}
                  onChange={(e) => handleChange('pacienteExamenPc', e.target.value)}
                  placeholder="Ej. 48"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Edad (para percentilar)</label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2"
                  value={pacienteEdad != null ? `${pacienteEdad}` : ''}
                  placeholder="Calculada automáticamente"
                  readOnly
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['pacienteExamenDismorfias', 'Dismorfias faciales'],
                ['pacienteExamenOjos', 'Ojos'],
                ['pacienteExamenNariz', 'Nariz'],
                ['pacienteExamenFiltrum', 'Filtrum'],
                ['pacienteExamenBoca', 'Boca'],
                ['pacienteExamenOrejas', 'Orejas'],
                ['pacienteExamenCuello', 'Cuello'],
                ['pacienteExamenTorax', 'Tórax'],
                ['pacienteExamenColumna', 'Columna'],
                ['pacienteExamenAbdomen', 'Abdomen'],
                ['pacienteExamenGenitales', 'Genitales'],
                ['pacienteExamenOtras', 'Otros hallazgos']
              ].map(([field, label]) => (
                <div key={field}>
                  <label className="block text-xs text-slate-500 mb-1">{label}</label>
                  <textarea
                    className="w-full min-h-[70px] rounded-xl border border-slate-300 px-3 py-2"
                    value={form[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>
          <section className="grid gap-3">
            <h3 className="text-sm font-semibold text-slate-700">Consanguinidad</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Situación</label>
                <select
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={form.consanguinidad}
                  onChange={(e) => handleChange('consanguinidad', e.target.value)}
                >
                  {CONSANGUINIDAD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {showConsanguinidadDetalle && (
                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Detalle</label>
                  <textarea
                    className="w-full min-h-[60px] rounded-xl border border-slate-300 px-3 py-2"
                    value={form.consanguinidadDetalle}
                    onChange={(e) => handleChange('consanguinidadDetalle', e.target.value)}
                    placeholder="Ej. Primos segundos; abuelos paternos consanguíneos"
                  />
                </div>
              )}
            </div>
          </section>
          <section className="grid gap-4">
            <h3 className="text-sm font-semibold text-slate-700">Vínculos familiares B1 / C1</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">B1</h4>
                <div className="grid gap-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Nombre</label>
                      <input
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={form.b1Nombre}
                        onChange={(e) => handleChange('b1Nombre', e.target.value)}
                        placeholder="Nombre(s)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Apellido</label>
                      <input
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={form.b1Apellido}
                        onChange={(e) => handleChange('b1Apellido', e.target.value)}
                        placeholder="Apellido(s)"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Fecha de nacimiento</label>
                      <input
                        type="date"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={form.b1Nacimiento}
                        onChange={(e) => handleChange('b1Nacimiento', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Correo electrónico</label>
                      <input
                        type="email"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={form.b1Email}
                        onChange={(e) => handleChange('b1Email', e.target.value)}
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Profesión / actividad</label>
                      <input
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={form.b1Profesion}
                        onChange={(e) => handleChange('b1Profesion', e.target.value)}
                        placeholder="Profesión"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Obra social / cobertura</label>
                      <input
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={form.b1ObraSocial}
                        onChange={(e) => handleChange('b1ObraSocial', e.target.value)}
                        placeholder="Cobertura"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Antecedentes personales relevantes</label>
                    <textarea
                      className="w-full min-h-[70px] rounded-xl border border-slate-300 px-3 py-2"
                      value={form.b1Antecedentes}
                      onChange={(e) => handleChange('b1Antecedentes', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">C1 (madre)</h4>
                <div className="grid gap-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Nombre</label>
                      <input
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={form.c1Nombre}
                        onChange={(e) => handleChange('c1Nombre', e.target.value)}
                        placeholder="Nombre(s)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Apellido</label>
                      <input
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={form.c1Apellido}
                        onChange={(e) => handleChange('c1Apellido', e.target.value)}
                        placeholder="Apellido(s)"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Fecha de nacimiento</label>
                      <input
                        type="date"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={form.c1Nacimiento}
                        onChange={(e) => handleChange('c1Nacimiento', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Correo electrónico</label>
                      <input
                        type="email"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={form.c1Email}
                        onChange={(e) => handleChange('c1Email', e.target.value)}
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Profesión / actividad</label>
                      <input
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={form.c1Profesion}
                        onChange={(e) => handleChange('c1Profesion', e.target.value)}
                        placeholder="Profesión"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Obra social / cobertura</label>
                      <input
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={form.c1ObraSocial}
                        onChange={(e) => handleChange('c1ObraSocial', e.target.value)}
                        placeholder="Cobertura"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Gestas</label>
                      <input
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={form.c1Gestas}
                        onChange={(e) => handleChange('c1Gestas', e.target.value)}
                        placeholder="Nº"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Partos</label>
                      <input
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={form.c1Partos}
                        onChange={(e) => handleChange('c1Partos', e.target.value)}
                        placeholder="Nº"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Abortos</label>
                      <input
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={form.c1Abortos}
                        onChange={(e) => handleChange('c1Abortos', e.target.value)}
                        placeholder="Nº"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Cesáreas</label>
                      <input
                        className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        value={form.c1Cesareas}
                        onChange={(e) => handleChange('c1Cesareas', e.target.value)}
                        placeholder="Nº"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Antecedentes personales relevantes</label>
                    <textarea
                      className="w-full min-h-[70px] rounded-xl border border-slate-300 px-3 py-2"
                      value={form.c1Antecedentes}
                      onChange={(e) => handleChange('c1Antecedentes', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="grid gap-3">
            <h3 className="text-sm font-semibold text-slate-700">Antecedentes obstétricos / familiares</h3>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Antecedentes obstétricos (detalle libre)</label>
              <textarea
                className="w-full min-h-[80px] rounded-xl border border-slate-300 px-3 py-2"
                value={form.obstetricosDescripcion}
                onChange={(e) => handleChange('obstetricosDescripcion', e.target.value)}
                placeholder="Embarazos previos, complicaciones, partos, puerperio, etc."
              />
            </div>
          </section>

          <section className="grid gap-3">
            <h3 className="text-sm font-semibold text-slate-700">Abuelos (D, E, F, G)</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Abuelos paternos</h4>
                <div className="grid gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Apellido D (abuelo paterno)</label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={form.abueloPaternoApellido}
                      onChange={(e) => handleChange('abueloPaternoApellido', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Procedencia D</label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={form.abueloPaternoProcedencia}
                      onChange={(e) => handleChange('abueloPaternoProcedencia', e.target.value)}
                      placeholder="Ciudad / país"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Apellido E (abuela paterna)</label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={form.abuelaPaternaApellido}
                      onChange={(e) => handleChange('abuelaPaternaApellido', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Procedencia E</label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={form.abuelaPaternaProcedencia}
                      onChange={(e) => handleChange('abuelaPaternaProcedencia', e.target.value)}
                      placeholder="Ciudad / país"
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Abuelos maternos</h4>
                <div className="grid gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Apellido F (abuelo materno)</label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={form.abueloMaternoApellido}
                      onChange={(e) => handleChange('abueloMaternoApellido', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Procedencia F</label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={form.abueloMaternoProcedencia}
                      onChange={(e) => handleChange('abueloMaternoProcedencia', e.target.value)}
                      placeholder="Ciudad / país"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Apellido G (abuela materna)</label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={form.abuelaMaternaApellido}
                      onChange={(e) => handleChange('abuelaMaternaApellido', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Procedencia G</label>
                    <input
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                      value={form.abuelaMaternaProcedencia}
                      onChange={(e) => handleChange('abuelaMaternaProcedencia', e.target.value)}
                      placeholder="Ciudad / país"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl border border-slate-900 bg-slate-900 text-white hover:bg-slate-800 disabled:border-slate-300 disabled:bg-slate-200"
              disabled={!valid || busy}
            >
              {busy ? 'Creando…' : 'Crear HC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
