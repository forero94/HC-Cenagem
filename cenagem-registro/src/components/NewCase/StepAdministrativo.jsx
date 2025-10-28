import React, { useMemo } from 'react';

const calculateAgeYears = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let y = now.getFullYear() - d.getFullYear();
  const md = now.getMonth() - d.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < d.getDate())) y -= 1;
  return y >= 0 ? y : 0;
};

const YES_NO_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'si', label: 'Sí' },
];

const CONSANGUINIDAD_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'posible', label: 'Posible' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'desconocido', label: 'No refiere / Desconoce' },
];

export default function StepAdministrativo({ grupos, value, onChange }) {
  const v = value || {};
  const set = (field) => (e) => onChange?.(field, e.target.value);
  const setUpper = (field) => (e) => onChange?.(field, e.target.value.toUpperCase());
  const handleGroup = (value) => {
    onChange?.('motivoGroup', value);
    onChange?.('motivoDetail', '');
  };
  const groups = Array.isArray(grupos) ? grupos : [];
  const edad = useMemo(() => calculateAgeYears(v.pacienteNacimiento), [v.pacienteNacimiento]);
  const currentGroup = useMemo(() => groups.find((g) => g.id === v.motivoGroup), [groups, v.motivoGroup]);
  const isOtherGroup = currentGroup?.id === 'otros';

  return (
    <section className="grid gap-6 text-slate-800">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-sky-700">Nº HC / AG</span>
          <input className="rounded-xl border border-sky-200 bg-white px-3 py-2 uppercase text-sky-900 placeholder:text-sky-400 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" value={v.agNumber || ''} onChange={setUpper('agNumber')} placeholder="AG-0001" />
        </label>

        <label className="required flex flex-col gap-1">
          <span className="text-xs font-medium text-sky-700">Nombre</span>
          <input required className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sky-900 placeholder:text-sky-400 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" value={v.pacienteNombre || ''} onChange={set('pacienteNombre')} placeholder="Nombre(s)" />
        </label>
        <label className="required flex flex-col gap-1">
          <span className="text-xs font-medium text-sky-700">Apellido</span>
          <input required className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sky-900 placeholder:text-sky-400 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" value={v.pacienteApellido || ''} onChange={set('pacienteApellido')} placeholder="Apellido(s)" />
        </label>
        <label className="required flex flex-col gap-1">
          <span className="text-xs font-medium text-sky-700">DNI</span>
          <input required className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sky-900 placeholder:text-sky-400 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" value={v.pacienteDni || ''} onChange={set('pacienteDni')} placeholder="Documento" />
        </label>
        <label className="required flex flex-col gap-1">
          <span className="text-xs font-medium text-sky-700">Fecha de nacimiento</span>
          <input required type="date" className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sky-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" value={v.pacienteNacimiento || ''} onChange={set('pacienteNacimiento')} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-sky-700">Edad (auto)</span>
          <input className="rounded-xl border border-sky-200 bg-sky-100/80 px-3 py-2 text-sky-900 shadow-sm" value={Number.isFinite(edad) ? String(edad) : ''} placeholder="Calculada" readOnly />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-sky-700">Sexo</span>
          <select className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sky-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" value={v.pacienteSexo || ''} onChange={set('pacienteSexo')}>
            <option value="">Seleccionar…</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="X">No binario / Intersex / Prefiere no decir</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-sky-700">Provincia de residencia</span>
          <input className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sky-900 placeholder:text-sky-400 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" value={v.provincia || ''} onChange={set('provincia')} placeholder="Provincia / región" />
        </label>
        <label className="required flex flex-col gap-1">
          <span className="text-xs font-medium text-sky-700">Motivo de consulta</span>
          <select required className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sky-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100" value={v.motivoGroup || ''} onChange={(e) => handleGroup(e.target.value)}>
            <option value="">Seleccionar…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </label>
        {isOtherGroup && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-sky-700">Detalle del motivo</span>
            <input
              className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-sky-900 placeholder:text-sky-400 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              value={v.motivoDetail || ''}
              onChange={set('motivoDetail')}
              placeholder="Describí el motivo puntual"
            />
          </label>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <p className="text-xs text-emerald-700 md:col-span-2">
          Los datos de contacto, acompañantes y referentes se completan ahora en la pestaña «Datos identificatorios».
        </p>
      </div>

      <div className="grid gap-4 rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-rose-800">Padres, tutores y procedencia familiar</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-3 rounded-2xl border border-rose-200 bg-white p-4">
            <span className="text-xs font-semibold text-rose-600 uppercase">Padre / tutor</span>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-rose-500">Nombre</span>
              <input className="rounded-xl border border-rose-200 px-3 py-2" value={v.tutorPadreNombre || ''} onChange={set('tutorPadreNombre')} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-rose-500">Apellido</span>
              <input className="rounded-xl border border-rose-200 px-3 py-2" value={v.tutorPadreApellido || ''} onChange={set('tutorPadreApellido')} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-rose-500">Procedencia</span>
              <input className="rounded-xl border border-rose-200 px-3 py-2" value={v.tutorPadreProcedencia || ''} onChange={set('tutorPadreProcedencia')} placeholder="Ciudad / país" />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-rose-500">Teléfono</span>
                <input className="rounded-xl border border-rose-200 px-3 py-2" value={v.contactoTelefono1 || ''} onChange={set('contactoTelefono1')} placeholder="(+54)" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-rose-500">Consanguinidad referida</span>
                <select className="rounded-xl border border-rose-200 px-3 py-2 text-sm" value={v.tutorPadreConsanguinidad || ''} onChange={set('tutorPadreConsanguinidad')}>
                  <option value="">Seleccionar…</option>
                  {CONSANGUINIDAD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-rose-500">Apellido del padre (abuelo)</span>
                <input className="rounded-xl border border-rose-200 px-3 py-2" value={v.tutorPadrePadreApellido || ''} onChange={set('tutorPadrePadreApellido')} placeholder="Apellido paterno" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-rose-500">Procedencia del padre (abuelo)</span>
                <input className="rounded-xl border border-rose-200 px-3 py-2" value={v.tutorPadrePadreProcedencia || ''} onChange={set('tutorPadrePadreProcedencia')} placeholder="Ciudad / país" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-rose-500">Apellido de la madre (abuela)</span>
                <input className="rounded-xl border border-rose-200 px-3 py-2" value={v.tutorPadreMadreApellido || ''} onChange={set('tutorPadreMadreApellido')} placeholder="Apellido materno" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-rose-500">Procedencia de la madre (abuela)</span>
                <input className="rounded-xl border border-rose-200 px-3 py-2" value={v.tutorPadreMadreProcedencia || ''} onChange={set('tutorPadreMadreProcedencia')} placeholder="Ciudad / país" />
              </label>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-rose-200 bg-white p-4">
            <span className="text-xs font-semibold text-rose-600 uppercase">Madre / tutora</span>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-rose-500">Nombre</span>
              <input className="rounded-xl border border-rose-200 px-3 py-2" value={v.tutorMadreNombre || ''} onChange={set('tutorMadreNombre')} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-rose-500">Apellido</span>
              <input className="rounded-xl border border-rose-200 px-3 py-2" value={v.tutorMadreApellido || ''} onChange={set('tutorMadreApellido')} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-rose-500">Procedencia</span>
              <input className="rounded-xl border border-rose-200 px-3 py-2" value={v.tutorMadreProcedencia || ''} onChange={set('tutorMadreProcedencia')} placeholder="Ciudad / país" />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-rose-500">Teléfono</span>
                <input className="rounded-xl border border-rose-200 px-3 py-2" value={v.contactoTelefono2 || ''} onChange={set('contactoTelefono2')} placeholder="(+54)" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-rose-500">Consanguinidad referida</span>
                <select className="rounded-xl border border-rose-200 px-3 py-2 text-sm" value={v.tutorMadreConsanguinidad || ''} onChange={set('tutorMadreConsanguinidad')}>
                  <option value="">Seleccionar…</option>
                  {CONSANGUINIDAD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-rose-500">Apellido del padre (abuelo)</span>
                <input className="rounded-xl border border-rose-200 px-3 py-2" value={v.tutorMadrePadreApellido || ''} onChange={set('tutorMadrePadreApellido')} placeholder="Apellido paterno" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-rose-500">Procedencia del padre (abuelo)</span>
                <input className="rounded-xl border border-rose-200 px-3 py-2" value={v.tutorMadrePadreProcedencia || ''} onChange={set('tutorMadrePadreProcedencia')} placeholder="Ciudad / país" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-rose-500">Apellido de la madre (abuela)</span>
                <input className="rounded-xl border border-rose-200 px-3 py-2" value={v.tutorMadreMadreApellido || ''} onChange={set('tutorMadreMadreApellido')} placeholder="Apellido materno" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] text-rose-500">Procedencia de la madre (abuela)</span>
                <input className="rounded-xl border border-rose-200 px-3 py-2" value={v.tutorMadreMadreProcedencia || ''} onChange={set('tutorMadreMadreProcedencia')} placeholder="Ciudad / país" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
        <label className="required flex flex-col gap-1">
          <span className="text-xs font-medium text-violet-700">Obra social / cobertura</span>
          <input required className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-violet-900 placeholder:text-violet-400 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" value={v.pacienteObraSocial || ''} onChange={set('pacienteObraSocial')} placeholder="Nombre de la cobertura" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-violet-700">Nº de afiliado</span>
          <input className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-violet-900 placeholder:text-violet-400 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" value={v.pacienteObraSocialNumero || ''} onChange={set('pacienteObraSocialNumero')} placeholder="Número / credencial" />
        </label>
      </div>

    </section>
  );
}
