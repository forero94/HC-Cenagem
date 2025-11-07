import React, { useMemo } from 'react';
import { getEnfermedadActualLayout } from './enfermedadActualGuides';
import { IDENTIFICATION_SECTIONS, ANTECEDENTES_SECTIONS, EXAM_SECTIONS } from './pacienteStepLayout';

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

export default function StepPaciente({
  value = {},
  secciones = [],
  grupos = [],
  edad: edadDesdePadre,
  onChange,
  mode = 'historia',
  errors = {},
}) {

  const normalizedMode = ['historia', 'antecedentes', 'examen', 'identificacion'].includes(mode) ? mode : 'historia';

  const v = value;
  const fieldErrors = errors || {};
  const errorFor = (field) => (typeof fieldErrors[field] === 'string' ? fieldErrors[field] : '');
  const controlClass = (field, base) => (errorFor(field)
    ? `${base} border-rose-500 focus:border-rose-500 focus:ring-rose-200`
    : base);

  const set = (key) => (e) => {
    const value = e.target.value;
    onChange?.(key, value);
    if (key === 'pacienteTelefono') {
      onChange?.('contactoTelefono1', value);
    }
  };

  const edadCalculada = useMemo(() => calculateAgeYears(v.pacienteNacimiento), [v.pacienteNacimiento]);

  const edad = edadDesdePadre ?? edadCalculada ?? null;

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

  const enfermedadLayout = useMemo(
    () => getEnfermedadActualLayout(v.motivoGroup, v.motivoDetail),
    [v.motivoGroup, v.motivoDetail],
  );

  const hasIdentification = IDENTIFICATION_SECTIONS.some((key) => sectionSet.has(key));
  const showHistoria = normalizedMode === 'historia';
  const showAntecedentes = normalizedMode === 'antecedentes';
  const showIdentificacion = normalizedMode === 'identificacion';
  const showExamen = normalizedMode === 'examen';
  const hasAntecedentesContent = ANTECEDENTES_SECTIONS.some((key) => sectionSet.has(key));
  const hasIdentificacionContent = hasIdentification;
  const hasExamenContent = EXAM_SECTIONS.some((key) => sectionSet.has(key));

  return (

    <div className="grid gap-6">

      {normalizedMode === 'antecedentes' && !hasAntecedentesContent && (
        <section className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          No hay antecedentes adicionales requeridos para este motivo. Podés continuar al siguiente paso.
        </section>
      )}

      {normalizedMode === 'identificacion' && !hasIdentificacionContent && (
        <section className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          No hay campos de identificación configurados para este motivo.
        </section>
      )}

      {normalizedMode === 'examen' && !hasExamenContent && (
        <section className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          No hay campos de examen físico configurados para este motivo. Podés continuar al siguiente paso.
        </section>
      )}

      {showHistoria && (

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <header className="grid gap-1">

          <div className="flex flex-wrap items-center justify-between gap-2">

            <h2 className="text-sm font-semibold text-slate-700">{enfermedadLayout.title}</h2>

            {motivoSeleccionado ? (

              <span className="rounded-full bg-slate-900/5 px-3 py-[3px] text-[11px] font-medium text-slate-600">{motivoSeleccionado}</span>

            ) : null}

          </div>

          <p className="text-xs text-slate-500">{enfermedadLayout.description}</p>

        </header>

        {enfermedadLayout.focus ? (

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">{enfermedadLayout.focus}</div>

        ) : null}

        {enfermedadLayout.tips && enfermedadLayout.tips.length > 0 ? (

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">

            <span className="text-[11px] font-semibold text-slate-500">Recordá incluir:</span>

            <ul className="mt-1 list-disc pl-4 text-[11px] text-slate-500">

              {enfermedadLayout.tips.map((tip) => (

                <li key={tip}>{tip}</li>

              ))}

            </ul>

          </div>

        ) : null}

        <div className="grid gap-3 md:grid-cols-2">

          {enfermedadLayout.fields.map((field) => (

            <label key={field.name} className={`flex flex-col gap-1 ${field.colSpan || ''}`}>

              <span className="text-xs text-slate-500">{field.label}</span>

              <textarea

                className={controlClass(field.name, 'rounded-xl border border-slate-300 px-3 py-2 min-h-[88px] text-sm')}

                value={v[field.name] || ''}

                onChange={set(field.name)}

                placeholder={field.placeholder}

                aria-invalid={errorFor(field.name) ? 'true' : undefined}

              />

              {field.helper ? (

                <span className="text-[11px] text-slate-400">{field.helper}</span>

              ) : null}

              {errorFor(field.name) ? (

                <span className="text-[11px] text-rose-600">{errorFor(field.name)}</span>

              ) : null}

            </label>

          ))}

        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">

          <div className="grid gap-2">

            <span className="font-semibold text-slate-600">Referencia del paso Motivo</span>

            {v.motivoPaciente ? (

              <p className="text-sm text-slate-600">{v.motivoPaciente}</p>

            ) : (

              <p>Completá el relato principal en el paso Motivo para tenerlo disponible acá.</p>

            )}

            {v.motivoDerivacion ? (

              <p className="text-[11px] text-slate-500"><span className="font-semibold text-slate-600">Motivo de derivación:</span> {v.motivoDerivacion}</p>

            ) : null}

          </div>

        </div>

      </section>
      )}

      {show('id') && normalizedMode === 'identificacion' && (
        <section className="grid gap-4">
          <h2 className="text-sm font-semibold text-slate-700">Datos de identificación</h2>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Nombre</span>
                <input
                  className={controlClass('pacienteNombre', 'rounded-xl border border-slate-300 px-3 py-2')}
                  value={v.pacienteNombre || ''}
                  onChange={set('pacienteNombre')}
                  placeholder="Nombre(s)"
                  aria-invalid={errorFor('pacienteNombre') ? 'true' : undefined}
                />
                {errorFor('pacienteNombre') ? (
                  <span className="text-[11px] text-rose-600">{errorFor('pacienteNombre')}</span>
                ) : null}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Apellido</span>
                <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteApellido || ''} onChange={set('pacienteApellido')} placeholder="Apellido(s)" />
              </label>

            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">DNI</span>
                <input
                  className={controlClass('pacienteDni', 'rounded-xl border border-slate-300 px-3 py-2')}
                  value={v.pacienteDni || ''}
                  onChange={set('pacienteDni')}
                  placeholder="Documento"
                  aria-invalid={errorFor('pacienteDni') ? 'true' : undefined}
                />
                {errorFor('pacienteDni') ? (
                  <span className="text-[11px] text-rose-600">{errorFor('pacienteDni')}</span>
                ) : null}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Fecha de nacimiento</span>
                <input type="date" className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteNacimiento || ''} onChange={set('pacienteNacimiento')} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Sexo / Identidad</span>
                <select className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteSexo || ''} onChange={set('pacienteSexo')}>
                  <option value="">Seleccionar…</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
                <option value="X">No binario / Intersex / Prefiere no decir</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Fecha de consulta</span>
              <input
                type="date"
                className={controlClass('consultaFecha', 'rounded-xl border border-slate-300 px-3 py-2')}
                value={v.consultaFecha || ''}
                onChange={set('consultaFecha')}
                aria-invalid={errorFor('consultaFecha') ? 'true' : undefined}
              />
              {errorFor('consultaFecha') ? (
                <span className="text-[11px] text-rose-600">{errorFor('consultaFecha')}</span>
              ) : null}
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Escolaridad actual</span>
              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteEscolaridad || ''} onChange={set('pacienteEscolaridad')} placeholder="Nivel, institución" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Rendimiento escolar</span>
              <textarea className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]" value={v.pacienteEscolaridadRendimiento || ''} onChange={set('pacienteEscolaridadRendimiento')} placeholder="Fortalezas, dificultades, adaptaciones" />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Dirección</span>
              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteDireccion || ''} onChange={set('pacienteDireccion')} placeholder="Calle, número, localidad" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Correo electrónico</span>
              <input type="email" className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteEmail || ''} onChange={set('pacienteEmail')} placeholder="email@ejemplo.com" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Teléfono del paciente</span>
              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteTelefono || ''} onChange={set('pacienteTelefono')} placeholder="(+54)" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Obra social / cobertura</span>
              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteObraSocial || ''} onChange={set('pacienteObraSocial')} placeholder="Nombre de la cobertura" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Nº de afiliado</span>
              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteObraSocialNumero || ''} onChange={set('pacienteObraSocialNumero')} placeholder="Número / credencial" />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Quién acompaña a la consulta</span>
              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteAcompanante || ''} onChange={set('pacienteAcompanante')} placeholder="Nombre de la persona acompañante" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Parentesco del acompañante</span>
              <input className="rounded-xl border border-slate-300 px-3 py-2" value={v.pacienteAcompananteParentesco || ''} onChange={set('pacienteAcompananteParentesco')} placeholder="Madre, padre, tutor/a…" />
            </label>
          </div>

        </section>
      )}

                  {showAntecedentes && show('paciente') && (

        <section className="grid gap-5">

          <h2 className="text-sm font-semibold text-slate-700">Antecedentes personales</h2>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-3">
            <header className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-slate-700">1. Embarazo y parto</h3>
              <span className="text-[11px] text-slate-400">Registrar los datos perinatales principales</span>
            </header>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Duración gestacional (semanas)</span>
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2"
                  value={v.perinatalEdadGestacional || ''}
                  onChange={set('perinatalEdadGestacional')}
                  placeholder="Ej.: 39"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Peso al nacer (g)</span>
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2"
                  value={v.perinatalPesoNacimiento || ''}
                  onChange={set('perinatalPesoNacimiento')}
                  placeholder="Ej.: 3200"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Talla al nacer (cm)</span>
                <input
                  className="rounded-xl border border-slate-300 px-3 py-2"
                  value={v.perinatalTallaNacimiento || ''}
                  onChange={set('perinatalTallaNacimiento')}
                  placeholder="Ej.: 50"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Exposición a fármacos / sustancias</span>
                <textarea
                  className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                  value={v.embarazoExposiciones || ''}
                  onChange={set('embarazoExposiciones')}
                  placeholder="Fármacos, alcohol, tabaco, radiaciones u otras exposiciones relevantes."
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Infecciones durante el embarazo</span>
                <textarea
                  className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                  value={v.embarazoInfecciones || ''}
                  onChange={set('embarazoInfecciones')}
                  placeholder="Ej.: TORCH, Zika, COVID-19, otras infecciones y tratamientos recibidos."
                />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Hipoxia / complicaciones perinatales</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                value={v.perinatalComplicaciones || ''}
                onChange={set('perinatalComplicaciones')}
                placeholder="Asfixia, reanimación, ingreso a UTI, complicaciones respiratorias u otras."
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-3">
            <header className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-slate-700">2. Desarrollo psicomotor</h3>
              <span className="text-[11px] text-slate-400">Describir hitos, regresiones y conducta</span>
            </header>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Logros motores y del lenguaje</span>
                <textarea
                  className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                  value={v.ndHitosMotores || ''}
                  onChange={set('ndHitosMotores')}
                  placeholder="Sostén cefálico, sedestación, marcha, primeras palabras, comunicación."
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Regresión o estancamientos</span>
                <textarea
                  className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                  value={v.ndRegresion || ''}
                  onChange={set('ndRegresion')}
                  placeholder="Pérdida de habilidades, momentos de retroceso o estancamiento."
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Conducta y comportamiento</span>
                <textarea
                  className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                  value={v.ndConducta || ''}
                  onChange={set('ndConducta')}
                  placeholder="Atención, hiperactividad, intereses restringidos, interacciones sociales."
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Aprendizaje y desempeño escolar</span>
                <textarea
                  className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                  value={v.ndAreaCognitiva || ''}
                  onChange={set('ndAreaCognitiva')}
                  placeholder="Lectoescritura, matemática, comprensión, apoyos escolares necesarios."
                />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Observaciones adicionales</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]"
                value={v.ndEscolaridadDetalle || ''}
                onChange={set('ndEscolaridadDetalle')}
                placeholder="Programas de apoyo, escolaridad especial, adaptaciones curriculares."
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-3">
            <header className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-slate-700">3. Antecedentes médicos</h3>
              <span className="text-[11px] text-slate-400">Registrar sucesos clínicos relevantes</span>
            </header>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Hospitalizaciones relevantes</span>
                <textarea
                  className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                  value={v.antecedentesHospitalizaciones || ''}
                  onChange={set('antecedentesHospitalizaciones')}
                  placeholder="Motivos, fechas aproximadas, estudios realizados."
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">Intervenciones y procedimientos</span>
                <textarea
                  className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                  value={v.antecedentesIntervenciones || ''}
                  onChange={set('antecedentesIntervenciones')}
                  placeholder="Cirugías, estudios invasivos, tratamientos especializados."
                />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Patologías endocrinas / metabólicas</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                value={v.antecedentesMetabolicos || ''}
                onChange={set('antecedentesMetabolicos')}
                placeholder="Hipotiroidismo, diabetes, errores innatos del metabolismo, otras alteraciones."
              />
            </label>
          </div>

        </section>

      )}

{showAntecedentes && show('monogenicas') && (

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

      {showAntecedentes && show('metabolismo') && (

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

      {showAntecedentes && show('reproductivo') && (

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

      {showAntecedentes && show('oncologia') && (

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

      {showAntecedentes && show('incidental') && (

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


      
    </div>

  );

}
