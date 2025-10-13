import React, { useMemo } from 'react';

function calculateAgeYears(iso) {

  if (!iso) return null;

  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) return null;

  const now = new Date();

  let y = now.getFullYear() - d.getFullYear();

  const md = now.getMonth() - d.getMonth();

  if (md < 0 || (md === 0 && now.getDate() < d.getDate())) y -= 1;

  return y >= 0 ? y : 0;

}

const CONSANGUINIDAD_OPTIONS = [

  { value: 'no', label: 'No' },

  { value: 'posible', label: 'Posible' },

  { value: 'confirmada', label: 'Confirmada' },

  { value: 'desconocido', label: 'No refiere / Desconoce' },

];

const YES_NO_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'si', label: 'Sí' },
];

export default function StepPaciente({ value = {}, secciones = [], grupos = [], edad: edadDesdePadre, onChange }) {

  const v = value;

  const set = (k) => (e) => onChange?.(k, e.target.value);

  const edadCalculada = useMemo(() => calculateAgeYears(v.pacienteNacimiento), [v.pacienteNacimiento]);

  const edad = edadDesdePadre ?? edadCalculada ?? null;

  const esMenor = Number.isFinite(edad) ? edad < 18 : false;

  const sectionSet = useMemo(() => {

    const base = new Set(secciones && secciones.length ? secciones : ['id', 'paciente']);

    base.delete('motivo');

    return base;

  }, [secciones]);

  const show = (key) => sectionSet.has(key);

  const motivoSeleccionado = useMemo(() => {
    if (!Array.isArray(grupos) || grupos.length === 0) return '';
    const group = grupos.find((g) => g.id === v.motivoGroup);
    if (!group) return '';
    const detail = group.options?.find((o) => o.id === v.motivoDetail);
    return [group.label, detail?.label].filter(Boolean).join(' · ');
  }, [grupos, v.motivoGroup, v.motivoDetail]);

  const showPadres = esMenor || Boolean([
    v.tutorPadreNombre,
    v.tutorPadreApellido,
    v.tutorPadreProcedencia,
    v.tutorPadreConsanguinidad,
    v.tutorPadrePadreApellido,
    v.tutorPadrePadreProcedencia,
    v.tutorPadreMadreApellido,
    v.tutorPadreMadreProcedencia,
    v.contactoTelefono1,
    v.tutorMadreNombre,
    v.tutorMadreApellido,
    v.tutorMadreProcedencia,
    v.tutorMadreConsanguinidad,
    v.tutorMadrePadreApellido,
    v.tutorMadrePadreProcedencia,
    v.tutorMadreMadreApellido,
    v.tutorMadreMadreProcedencia,
    v.contactoTelefono2,
  ].some(Boolean));

  return (

    <div className="grid gap-6">

      {show('id') && (

        <section className="grid gap-4">

          <h2 className="text-sm font-semibold text-slate-700">Datos de identificación</h2>

          <div className="grid gap-3 md:grid-cols-3">

            <label className="required flex flex-col gap-1">

              <span className="text-xs text-slate-500">Nº HC / AG</span>

              <input required className="rounded-xl border border-slate-300 px-3 py-2 uppercase" value={v.agNumber || ''} onChange={(e) => onChange?.('agNumber', e.target.value.toUpperCase())} placeholder="AG-0001" />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-4">

            <label className="required flex flex-col gap-1">

              <span className="text-xs text-slate-500">Nombre</span>

              <input required className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteNombre || ''} onChange={set('pacienteNombre')} placeholder="Nombre(s)" />

            </label>

            <label className="required flex flex-col gap-1">

              <span className="text-xs text-slate-500">Apellido</span>

              <input required className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteApellido || ''} onChange={set('pacienteApellido')} placeholder="Apellido(s)" />

            </label>

            <label className="required flex flex-col gap-1">

              <span className="text-xs text-slate-500">Fecha de nacimiento</span>

              <input required type="date" className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteNacimiento || ''} onChange={set('pacienteNacimiento')} />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Edad cronológica</span>

              <input className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2" value={edad != null ? String(edad) : ''} placeholder="Automática" readOnly />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-4">

            <label className="required flex flex-col gap-1">

              <span className="text-xs text-slate-500">Sexo</span>

              <select required className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteSexo || ''} onChange={set('pacienteSexo')}>

                <option value="">Seleccionar…</option>

                <option value="F">Femenino</option>

                <option value="M">Masculino</option>

                <option value="X">No binario / Intersex / Prefiere no decir</option>

              </select>

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Fecha de consulta</span>

              <input type="date" className="rounded-xl border border-slate-300 px-3 py-2" value={v.consultaFecha || ''} onChange={set('consultaFecha')} />

            </label>

            <label className="flex flex-col gap-1 md:col-span-2">

              <span className="text-xs text-slate-500">Motivo de consulta (CENAGEM)</span>
              {motivoSeleccionado && (
                <span className="text-[11px] text-slate-400">Seleccionado en Motivo: {motivoSeleccionado}</span>
              )}

              <textarea
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 min-h-[70px]"
                value={v.motivoPaciente || ''}
                placeholder="Retraso madurativo, dificultades de aprendizaje, regresión, sospecha sindrómica…"
                readOnly
              />
              <span className="text-[11px] text-slate-400">Para modificarlo regresá al paso Motivo.</span>

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-3">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Escolaridad actual</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteEscolaridad || ''} onChange={set('pacienteEscolaridad')} placeholder="Nivel, institución" />

            </label>

            <label className="flex flex-col gap-1 md:col-span-2">

              <span className="text-xs text-slate-500">Rendimiento escolar</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.pacienteEscolaridadRendimiento || ''} onChange={set('pacienteEscolaridadRendimiento')} placeholder="Fortalezas, dificultades, adaptaciones" />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Acompañante (parentesco)</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteAcompananteParentesco || ''} onChange={set('pacienteAcompananteParentesco')} placeholder="Madre, padre, tutor/a…" />

            </label>

           

          </div>

          

        </section>

      )}

      {show('paciente') && (

        <section className="grid gap-4">

          <h2 className="text-sm font-semibold text-slate-700">Evaluación del comportamiento y adaptación</h2>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Interacción social y emocional</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.comportamientoInteraccion || ''} onChange={set('comportamientoInteraccion')} placeholder="Relaciones familiares, regulación emocional, participación social" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Habilidades adaptativas</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.comportamientoAdaptativas || ''} onChange={set('comportamientoAdaptativas')} placeholder="Higiene, alimentación, vestimenta, seguridad, manejo de dinero" />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Escalas aplicadas</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.comportamientoEscalas || ''} onChange={set('comportamientoEscalas')} placeholder="Vineland, WISC, Bayley, Stanford-Binet, otros resultados" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Nivel de apoyo requerido</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.comportamientoApoyo || ''} onChange={set('comportamientoApoyo')} placeholder="Apoyo leve/moderado/intenso, recursos disponibles" />

            </label>

          </div>

        </section>

      )}

      {show('paciente') && (

        <section className="grid gap-4">

          <h2 className="text-sm font-semibold text-slate-700">Contexto actual y antecedentes personales</h2>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Profesión / actividad</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteProfesion || ''} onChange={set('pacienteProfesion')} placeholder="Actividad habitual del paciente" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Dirección</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteDireccion || ''} onChange={set('pacienteDireccion')} placeholder="Calle, número, localidad" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Correo electrónico</span>

              <input type="email" className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteEmail || ''} onChange={set('pacienteEmail')} placeholder="email@ejemplo.com" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Teléfono de contacto</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteTelefono || ''} onChange={set('pacienteTelefono')} placeholder="(+54)" />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Obra social / cobertura</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteObraSocial || ''} onChange={set('pacienteObraSocial')} placeholder="Nombre de la cobertura" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Nº de afiliado</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteObraSocialNumero || ''} onChange={set('pacienteObraSocialNumero')} placeholder="Número / credencial" />

            </label>

          </div>

          <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wide">Antecedentes personales patológicos</h3>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Neurológicos</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.antecedentesNeurologicos || ''} onChange={set('antecedentesNeurologicos')} placeholder="Convulsiones, crisis febriles, trauma, infecciones SNC, regresión…" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Endocrino-metabólicos</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.antecedentesMetabolicos || ''} onChange={set('antecedentesMetabolicos')} placeholder="Hipotiroidismo, hipoglucemias, errores innatos del metabolismo…" />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Sensoriales</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.antecedentesSensoriales || ''} onChange={set('antecedentesSensoriales')} placeholder="Hipoacusia, déficit visual, cataratas, retinitis…" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Psicosociales</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.antecedentesPsicosociales || ''} onChange={set('antecedentesPsicosociales')} placeholder="Negligencia, abuso, institucionalización, falta de estimulación…" />

            </label>

          </div>

        </section>

      )}

      {show('perinatal') && (

        <section className="grid gap-4">

          <h2 className="text-sm font-semibold text-slate-700">Antecedentes prenatales y perinatales</h2>

          <div className="grid gap-3 md:grid-cols-4">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Edad materna (concepción)</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.edadMaternaConcepcion || ''} onChange={set('edadMaternaConcepcion')} placeholder="Ej. 29 años" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Edad paterna (concepción)</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.edadPaternaConcepcion || ''} onChange={set('edadPaternaConcepcion')} placeholder="Ej. 31 años" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Control prenatal</span>

              <select className="rounded-xl border border-slate-300 px-3 py-2" value={v.controlPrenatal || ''} onChange={set('controlPrenatal')}>

                <option value="">Seleccionar…</option>

                <option value="adecuado">Adecuado</option>

                <option value="insuficiente">Insuficiente</option>

                <option value="no_realizado">Sin controles</option>

              </select>

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Detalle control prenatal</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.controlPrenatalDetalle || ''} onChange={set('controlPrenatalDetalle')} placeholder="Cantidad de controles, lugar, profesional" />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Complicaciones del embarazo</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.embarazoComplicaciones || ''} onChange={set('embarazoComplicaciones')} placeholder="Infecciones (TORCH, Zika, COVID), fiebre, diabetes gestacional…" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Exposición a sustancias / radiaciones</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.embarazoExposiciones || ''} onChange={set('embarazoExposiciones')} placeholder="Alcohol, drogas, fármacos, radiaciones, otros agentes" />

            </label>

          </div>

          <label className="flex flex-col gap-1">

            <span className="text-xs text-slate-500">Hallazgos en ecografía fetal / crecimiento</span>

            <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.prenatalEcoAlteraciones || ''} onChange={set('prenatalEcoAlteraciones')} placeholder="Alteraciones estructurales, RCIU, otros hallazgos" />

          </label>

          <div className="grid gap-3 md:grid-cols-4">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Tipo de parto</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.perinatalTipoParto || ''} onChange={set('perinatalTipoParto')} placeholder="Vaginal, cesárea, instrumentado…" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Edad gestacional (semanas)</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.perinatalEdadGestacional || ''} onChange={set('perinatalEdadGestacional')} placeholder="Ej. 39" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Peso al nacer (g)</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.perinatalPesoNacimiento || ''} onChange={set('perinatalPesoNacimiento')} placeholder="Ej. 3200" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Talla al nacer (cm)</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.perinatalTallaNacimiento || ''} onChange={set('perinatalTallaNacimiento')} placeholder="Ej. 50" />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-3">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Apgar 1'</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.perinatalApgar1 || ''} onChange={set('perinatalApgar1')} placeholder="Ej. 8" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Apgar 5'</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.perinatalApgar5 || ''} onChange={set('perinatalApgar5')} placeholder="Ej. 9" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Internación neonatal</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.perinatalInternacionNeonatal || ''} onChange={set('perinatalInternacionNeonatal')} placeholder="Duración, motivo, UCIN/UCIN" />

            </label>

          </div>

          <label className="flex flex-col gap-1">

            <span className="text-xs text-slate-500">Eventos neonatales relevantes</span>

            <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.perinatalComplicaciones || ''} onChange={set('perinatalComplicaciones')} placeholder="Ictericia, hipoxia, convulsiones, sepsis, otros" />

          </label>

        </section>

      )}

      {showPadres && (

        <div className="grid gap-3 md:grid-cols-2">

          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4">

            <span className="text-xs font-semibold text-slate-600 uppercase">Padre / tutor</span>

            <label className="flex flex-col gap-1">

              <span className="text-[11px] text-slate-500">Nombre</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.tutorPadreNombre || ''} onChange={set('tutorPadreNombre')} />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-[11px] text-slate-500">Apellido</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.tutorPadreApellido || ''} onChange={set('tutorPadreApellido')} />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-[11px] text-slate-500">Procedencia</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.tutorPadreProcedencia || ''} onChange={set('tutorPadreProcedencia')} placeholder="Ciudad / país" />

            </label>

            <div className="grid gap-2 sm:grid-cols-2">

              <label className="flex flex-col gap-1">

                <span className="text-[11px] text-slate-500">Teléfono</span>

                <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.contactoTelefono1 || ''} onChange={set('contactoTelefono1')} placeholder="(+54)" />

              </label>

              <label className="flex flex-col gap-1">

                <span className="text-[11px] text-slate-500">Consanguinidad referida</span>

                <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={v.tutorPadreConsanguinidad || ''} onChange={set('tutorPadreConsanguinidad')}>

                  <option value="">Seleccionar…</option>

                  {YES_NO_OPTIONS.map((option) => (

                    <option key={option.value} value={option.value}>{option.label}</option>

                  ))}

                </select>

              </label>

            </div>

            <div className="grid gap-2">

              <span className="text-[11px] font-semibold text-slate-600 uppercase">Ascendencia</span>

              <div className="grid gap-2 sm:grid-cols-2">

                <label className="flex flex-col gap-1">

                  <span className="text-[11px] text-slate-500">Apellido del padre (abuelo)</span>

                  <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.tutorPadrePadreApellido || ''} onChange={set('tutorPadrePadreApellido')} placeholder="Apellido paterno" />

                </label>

                <label className="flex flex-col gap-1">

                  <span className="text-[11px] text-slate-500">Procedencia del padre (abuelo)</span>

                  <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.tutorPadrePadreProcedencia || ''} onChange={set('tutorPadrePadreProcedencia')} placeholder="Ciudad / país" />

                </label>

                <label className="flex flex-col gap-1">

                  <span className="text-[11px] text-slate-500">Apellido de la madre (abuela)</span>

                  <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.tutorPadreMadreApellido || ''} onChange={set('tutorPadreMadreApellido')} placeholder="Apellido materno" />

                </label>

                <label className="flex flex-col gap-1">

                  <span className="text-[11px] text-slate-500">Procedencia de la madre (abuela)</span>

                  <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.tutorPadreMadreProcedencia || ''} onChange={set('tutorPadreMadreProcedencia')} placeholder="Ciudad / país" />

                </label>

              </div>

            </div>

          </div>

          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4">

            <span className="text-xs font-semibold text-slate-600 uppercase">Madre / tutora</span>

            <label className="flex flex-col gap-1">

              <span className="text-[11px] text-slate-500">Nombre</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.tutorMadreNombre || ''} onChange={set('tutorMadreNombre')} />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-[11px] text-slate-500">Apellido</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.tutorMadreApellido || ''} onChange={set('tutorMadreApellido')} />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-[11px] text-slate-500">Procedencia</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.tutorMadreProcedencia || ''} onChange={set('tutorMadreProcedencia')} placeholder="Ciudad / país" />

            </label>

            <div className="grid gap-2 sm:grid-cols-2">

              <label className="flex flex-col gap-1">

                <span className="text-[11px] text-slate-500">Teléfono</span>

                <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.contactoTelefono2 || ''} onChange={set('contactoTelefono2')} placeholder="(+54)" />

              </label>

              <label className="flex flex-col gap-1">

                <span className="text-[11px] text-slate-500">Consanguinidad referida</span>

                <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={v.tutorMadreConsanguinidad || ''} onChange={set('tutorMadreConsanguinidad')}>

                  <option value="">Seleccionar…</option>

                  {YES_NO_OPTIONS.map((option) => (

                    <option key={option.value} value={option.value}>{option.label}</option>

                  ))}

                </select>

              </label>

            </div>

            <div className="grid gap-2">

              <span className="text-[11px] font-semibold text-slate-600 uppercase">Ascendencia</span>

              <div className="grid gap-2 sm:grid-cols-2">

                <label className="flex flex-col gap-1">

                  <span className="text-[11px] text-slate-500">Apellido del padre (abuelo)</span>

                  <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.tutorMadrePadreApellido || ''} onChange={set('tutorMadrePadreApellido')} placeholder="Apellido paterno" />

                </label>

                <label className="flex flex-col gap-1">

                  <span className="text-[11px] text-slate-500">Procedencia del padre (abuelo)</span>

                  <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.tutorMadrePadreProcedencia || ''} onChange={set('tutorMadrePadreProcedencia')} placeholder="Ciudad / país" />

                </label>

                <label className="flex flex-col gap-1">

                  <span className="text-[11px] text-slate-500">Apellido de la madre (abuela)</span>

                  <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.tutorMadreMadreApellido || ''} onChange={set('tutorMadreMadreApellido')} placeholder="Apellido materno" />

                </label>

                <label className="flex flex-col gap-1">

                  <span className="text-[11px] text-slate-500">Procedencia de la madre (abuela)</span>

                  <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.tutorMadreMadreProcedencia || ''} onChange={set('tutorMadreMadreProcedencia')} placeholder="Ciudad / país" />

                </label>

              </div>

            </div>

          </div>

        </div>

      )}

      {show('antropometria') && (

        <section className="grid gap-4">

          <h2 className="text-sm font-semibold text-slate-700">Antropometría y proporciones corporales</h2>

          <div className="grid gap-3 md:grid-cols-3">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Peso (kg)</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteExamenPeso || ''} onChange={set('pacienteExamenPeso')} placeholder="Ej. 12.4" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Percentilo peso</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteExamenPesoPercentil || ''} onChange={set('pacienteExamenPesoPercentil')} placeholder="Ej. P25" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Talla (cm)</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteExamenTalla || ''} onChange={set('pacienteExamenTalla')} placeholder="Ej. 90" />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-3">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Percentilo talla</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteExamenTallaPercentil || ''} onChange={set('pacienteExamenTallaPercentil')} placeholder="Ej. P10" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Perímetro cefálico (cm)</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteExamenPc || ''} onChange={set('pacienteExamenPc')} placeholder="Ej. 48" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Percentilo perímetro cefálico</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteExamenPcPercentil || ''} onChange={set('pacienteExamenPcPercentil')} placeholder="Ej. P50" />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Edad para percentilar</span>

              <input className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2" value={edad != null ? String(edad) : ''} placeholder="Automática" readOnly />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Proporciones corporales</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.pacienteExamenProporciones || ''} onChange={set('pacienteExamenProporciones')} placeholder="Segmentos corporales, disarmonías, extremidades, perímetros adicionales" />

            </label>

          </div>

        </section>

      )}

      {show('examenGenetico') && (

        <section className="grid gap-4">

          <h2 className="text-sm font-semibold text-slate-700">Examen físico integral</h2>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Dismorfias craneofaciales</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.pacienteExamenDismorfias || ''} onChange={set('pacienteExamenDismorfias')} placeholder="Micro/macrocefalia, telecanto, pabellones anómalos, labio/paladar…" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Malformaciones cardiacas, genitourinarias o esqueléticas</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.pacienteExamenMalformaciones || ''} onChange={set('pacienteExamenMalformaciones')} placeholder="Soplos, cardiopatías, anomalías renales, genitales ambiguos, deformidades óseas" />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Piel y faneras</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.pacienteExamenPiel || ''} onChange={set('pacienteExamenPiel')} placeholder="Manchas café con leche, hipopigmentaciones, angiofibromas, estrías…" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Examen neurológico</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.pacienteExamenNeurologico || ''} onChange={set('pacienteExamenNeurologico')} placeholder="Tono, reflejos, coordinación, marcha, movimientos involuntarios" />

            </label>

          </div>

          <label className="flex flex-col gap-1">

            <span className="text-xs text-slate-500">Observaciones adicionales</span>

            <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.pacienteExamenOtras || ''} onChange={set('pacienteExamenOtras')} placeholder="Hallazgos adicionales relevantes para la evaluación genética" />

          </label>

        </section>

      )}

      {show('monogenicas') && (

        <section className="grid gap-3">

          <h2 className="text-sm font-semibold text-slate-700">Resumen monogenicas sospechadas</h2>

          <p className="text-xs text-slate-500">Detalla el fenotipo clave y hallazgos que orientan la sospecha. En el siguiente paso podes completar plan de estudios.</p>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Fenotipo / rasgos cardinales</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.monoFenotipo || ''} onChange={set('monoFenotipo')} placeholder="Inicio, curso, rasgos caracteristicos" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Biomarcadores / bioquimica</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.monoBioquimica || ''} onChange={set('monoBioquimica')} placeholder="CK, metabolitos, enzimas, perfiles" />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Organo / sistema predominante</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.monoOrganoSistema || ''} onChange={set('monoOrganoSistema')} placeholder="Neuromuscular, hepatico, renal, etc." />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Estudios geneticos previos</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.monoEstudiosPrevios || ''} onChange={set('monoEstudiosPrevios')} placeholder="Panel, exoma, cariotipo, MLPA, VUS" />

            </label>

          </div>

          <label className="flex flex-col gap-1">

            <span className="text-xs text-slate-500">Tratamientos / respuesta</span>

            <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.monoTratamiento || ''} onChange={set('monoTratamiento')} placeholder="Dietas, suplementos, terapias especificas" />

          </label>

        </section>

      )}

      {show('neurodesarrollo') && (

        <section className="grid gap-4">

          <h2 className="text-sm font-semibold text-slate-700">Historia del desarrollo</h2>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Hitos motores</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.ndHitosMotores || ''} onChange={set('ndHitosMotores')} placeholder="Edad de sostén cefálico, sedestación, marcha independiente, coordinación fina…" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Lenguaje y comunicación</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.ndLenguaje || ''} onChange={set('ndLenguaje')} placeholder="Primeras palabras y frases, comprensión, ecolalia, regresiones…" />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Área social y conductual</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.ndConducta || ''} onChange={set('ndConducta')} placeholder="Juego simbólico, contacto ocular, respuesta al nombre, intereses sociales…" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Área cognitiva</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.ndAreaCognitiva || ''} onChange={set('ndAreaCognitiva')} placeholder="Resolución de problemas, atención, memoria, aprendizaje" />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Regresión del desarrollo</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.ndRegresion || ''} onChange={set('ndRegresion')} placeholder="Habilidades perdidas, edad de inicio, gatillantes" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Escolaridad y apoyos</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.ndEscolaridadDetalle || ''} onChange={set('ndEscolaridadDetalle')} placeholder="Rendimiento académico, adaptaciones, tipo de institución" />

            </label>

          </div>

        </section>

      )}

      {show('metabolismo') && (

        <section className="grid gap-3">

          <h2 className="text-sm font-semibold text-slate-700">Errores congenitos del metabolismo</h2>

          <div className="grid gap-3 md:grid-cols-3">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Sintomas agudos / crisis</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.metaSintomasAgudos || ''} onChange={set('metaSintomasAgudos')} placeholder="Hipotonia, convulsiones, vomitos, hipoglucemias..." />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Cribado neonatal / tamizajes</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.metaCribadoNeonatal || ''} onChange={set('metaCribadoNeonatal')} placeholder="Resultados y confirmacion" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Perfil bioquimico</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.metaBioquimica || ''} onChange={set('metaBioquimica')} placeholder="Amonio, lactato, aminoacidos, acilcarnitinas..." />

            </label>

          </div>

        </section>

      )}

      {show('prenatal') && (

        <section className="grid gap-3">

          <h2 className="text-sm font-semibold text-slate-700">Hallazgos prenatales</h2>

          <div className="grid gap-3 md:grid-cols-4">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Semana gestacional</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.prenatalSemanas || ''} onChange={set('prenatalSemanas')} placeholder="Ej. 22" />

            </label>

            <label className="md:col-span-3 flex flex-col gap-1">

              <span className="text-xs text-slate-500">Hallazgos ecográficos</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.prenatalEcografia || ''} onChange={set('prenatalEcografia')} placeholder="Detalle malformaciones / biometrías" />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Cribados / tamizajes</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.prenatalCribado || ''} onChange={set('prenatalCribado')} placeholder="Bioquímico, ADN libre, otros" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">RCIU / Doppler</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.prenatalRciu || ''} onChange={set('prenatalRciu')} placeholder="Curvas de crecimiento, dopplers" />

            </label>

          </div>

        </section>

      )}

      {show('obstetricos') && (

        <section className="grid gap-3">

          <h2 className="text-sm font-semibold text-slate-700">Antecedentes obstétricos</h2>

          <label className="flex flex-col gap-1">

            <span className="text-xs text-slate-500">Detalle libre</span>

            <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.obstetricosDescripcion || ''} onChange={set('obstetricosDescripcion')} placeholder="Gestaciones previas, partos, complicaciones…" />

          </label>

        </section>

      )}

      {show('reproductivo') && (

        <section className="grid gap-3">

          <h2 className="text-sm font-semibold text-slate-700">Resumen reproductivo</h2>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Tiempo de búsqueda / infertilidad</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.reproTiempoBusqueda || ''} onChange={set('reproTiempoBusqueda')} />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Pérdidas gestacionales / abortos</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.reproPerdidasGestacionales || ''} onChange={set('reproPerdidasGestacionales')} />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Evaluación femenina</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.reproFemeninoDatos || ''} onChange={set('reproFemeninoDatos')} placeholder="AMH, FSH, eco ginecológica, estudios hormonal" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Evaluación masculina</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.reproMasculinoDatos || ''} onChange={set('reproMasculinoDatos')} placeholder="Espermograma, antecedentes andrológicos" />

            </label>

          </div>

        </section>

      )}

      {show('oncologia') && (

        <section className="grid gap-3">

          <h2 className="text-sm font-semibold text-slate-700">Historia oncológica</h2>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Tumores / diagnósticos</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.oncoTiposTumor || ''} onChange={set('oncoTiposTumor')} placeholder="Tipo, lateralidad, estadio" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Edad al diagnóstico</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.oncoEdadDiagnostico || ''} onChange={set('oncoEdadDiagnostico')} placeholder="Cronología principal" />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Tratamientos</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.oncoTratamientos || ''} onChange={set('oncoTratamientos')} placeholder="Cirugías, quimio, hormonoterapia…" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Estudios genéticos previos</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.oncoEstudiosPrevios || ''} onChange={set('oncoEstudiosPrevios')} placeholder="Paneles, BRCA, MSI, IHQ" />

            </label>

          </div>

        </section>

      )}

      {show('incidental') && (

        <section className="grid gap-3">

          <h2 className="text-sm font-semibold text-slate-700">Hallazgo incidental</h2>

          <div className="grid gap-3 md:grid-cols-3">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Tipo de estudio</span>

              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.incTipoEstudio || ''} onChange={set('incTipoEstudio')} placeholder="RM, ecografia, cariotipo, laboratorio..." />

            </label>

            <label className="md:col-span-2 flex flex-col gap-1">

              <span className="text-xs text-slate-500">Hallazgo descripto</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.incHallazgo || ''} onChange={set('incHallazgo')} placeholder="Descripcion e interpretacion" />

            </label>

          </div>

          <label className="flex flex-col gap-1">

            <span className="text-xs text-slate-500">Accion / recomendacion</span>

            <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.incAccionRequerida || ''} onChange={set('incAccionRequerida')} placeholder="Seguimiento, estudios confirmatorios, derivaciones" />

          </label>

        </section>

      )}

      {show('consanguinidad') && (

        <section className="grid gap-3">

          <h2 className="text-sm font-semibold text-slate-700">Consanguinidad</h2>

          <div className="grid gap-3 md:grid-cols-3">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Relación</span>

              <select className="rounded-xl border border-slate-300 px-3 py-2" value={v.consanguinidad || 'no'} onChange={set('consanguinidad')}>

                {CONSANGUINIDAD_OPTIONS.map((opt) => (

                  <option key={opt.value} value={opt.value}>{opt.label}</option>

                ))}

              </select>

            </label>

            <label className="md:col-span-2 flex flex-col gap-1">

              <span className="text-xs text-slate-500">Detalle</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.consanguinidadDetalle || ''} onChange={set('consanguinidadDetalle')} placeholder="Describí parentesco, antepasados comunes, endogamia" />

            </label>

          </div>

        </section>

      )}

      {show('familia') && (

        <section className="grid gap-4">

          <h2 className="text-sm font-semibold text-slate-700">Antecedentes familiares</h2>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Discapacidad intelectual, TEA, epilepsia o malformaciones en la familia</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.familiaAntecedentesNeuro || ''} onChange={set('familiaAntecedentesNeuro')} placeholder="Detallar familiares afectados, generación, diagnósticos previos" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Abortos repetidos, muerte fetal o infertilidad</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.familiaAbortosInfertilidad || ''} onChange={set('familiaAbortosInfertilidad')} placeholder="Número de eventos, parentesco, causa conocida" />

            </label>

          </div>

          <div className="grid gap-3 md:grid-cols-2">

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Edad y desarrollo de hermanos/as</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.familiaDesarrolloHermanos || ''} onChange={set('familiaDesarrolloHermanos')} placeholder="Nombres, edades, desempeño escolar, diagnósticos" />

            </label>

            <label className="flex flex-col gap-1">

              <span className="text-xs text-slate-500">Diagnósticos genéticos previos en la familia</span>

              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]" value={v.familiaDiagnosticosGeneticos || ''} onChange={set('familiaDiagnosticosGeneticos')} placeholder="Microdeleciones, X frágil, otros estudios moleculares" />

            </label>

          </div>

        </section>

      )}

      {show('abuelos') && (

        <section className="grid gap-3">

          <h2 className="text-sm font-semibold text-slate-700">Abuelos (D, E, F, G)</h2>

          <div className="grid gap-3 md:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 p-4">

              <h3 className="text-sm font-semibold text-slate-700 mb-3">Abuelos paternos</h3>

              <div className="grid gap-3">

                <label className="flex flex-col gap-1">

                  <span className="text-xs text-slate-500">Apellido D (abuelo)</span>

                  <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.abueloPaternoApellido || ''} onChange={set('abueloPaternoApellido')} />

                </label>

                <label className="flex flex-col gap-1">

                  <span className="text-xs text-slate-500">Procedencia D</span>

                  <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.abueloPaternoProcedencia || ''} onChange={set('abueloPaternoProcedencia')} placeholder="Ciudad / pais" />

                </label>

                <label className="flex flex-col gap-1">

                  <span className="text-xs text-slate-500">Apellido E (abuela)</span>

                  <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.abuelaPaternaApellido || ''} onChange={set('abuelaPaternaApellido')} />

                </label>

                <label className="flex flex-col gap-1">

                  <span className="text-xs text-slate-500">Procedencia E</span>

                  <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.abuelaPaternaProcedencia || ''} onChange={set('abuelaPaternaProcedencia')} placeholder="Ciudad / pais" />

                </label>

              </div>

            </div>

            <div className="rounded-2xl border border-slate-200 p-4">

              <h3 className="text-sm font-semibold text-slate-700 mb-3">Abuelos maternos</h3>

              <div className="grid gap-3">

                <label className="flex flex-col gap-1">

                  <span className="text-xs text-slate-500">Apellido F (abuelo)</span>

                  <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.abueloMaternoApellido || ''} onChange={set('abueloMaternoApellido')} />

                </label>

                <label className="flex flex-col gap-1">

                  <span className="text-xs text-slate-500">Procedencia F</span>

                  <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.abueloMaternoProcedencia || ''} onChange={set('abueloMaternoProcedencia')} placeholder="Ciudad / pais" />

                </label>

                <label className="flex flex-col gap-1">

                  <span className="text-xs text-slate-500">Apellido G (abuela)</span>

                  <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.abuelaMaternaApellido || ''} onChange={set('abuelaMaternaApellido')} />

                </label>

                <label className="flex flex-col gap-1">

                  <span className="text-xs text-slate-500">Procedencia G</span>

                  <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.abuelaMaternaProcedencia || ''} onChange={set('abuelaMaternaProcedencia')} placeholder="Ciudad / pais" />

                </label>

              </div>

            </div>

          </div>

        </section>

      )}

      <section className="grid gap-2">

        <h2 className="text-sm font-semibold text-slate-700">Resumen de primera consulta</h2>

        <label className="flex flex-col gap-1">

          <span className="text-xs text-slate-500">Registrar síntesis clínica inicial</span>

          <textarea

            className="rounded-xl border border-slate-300 px-3 py-2 min-h-[120px]"

            value={v.resumenPrimeraConsulta || ''}

            onChange={set('resumenPrimeraConsulta')}

            placeholder="Anota aquí los hallazgos principales, impresiones diagnósticas iniciales y plan acordado en la primera consulta."

          />

        </label>

        <p className="text-[11px] text-slate-400">

          Este resumen se mostrará en la revisión final y se imprimirá como primera evolución del paciente.

        </p>

      </section>

    </div>

  );

}
