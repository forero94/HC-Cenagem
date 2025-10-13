// src/components/NewCase/StepResumen.jsx
import React, { useMemo } from 'react';

const CONSANGUINIDAD_LABELS = {
  no: 'No',
  posible: 'Posible',
  confirmada: 'Confirmada',
  desconocido: 'No refiere / Desconoce',
};

const CLASIFICACION_LABELS = {
  leve: 'Leve',
  moderado: 'Moderado',
  grave: 'Grave',
  profundo: 'Profundo',
};

const SINDROMICO_LABELS = {
  sindromico: 'Sindrómico',
  no_sindromico: 'No sindrómico',
  indeterminado: 'Indeterminado',
};

const YES_NO_LABELS = {
  si: 'Sí',
  no: 'No',
};

const asText = (value) => {
  if (value == null) return '—';
  if (typeof value === 'string' && value.trim() === '') return '—';
  return value;
};

const GROUP_SUMMARY_CONFIG = {
  di_rm: {
    extraBlocks: (v) => [
      {
        id: 'di_rm_detalle',
        title: 'Evaluación neurológica complementaria',
        rows: [
          ['EEG', v.ndEEG],
          ['RMN / neuroimágenes', v.ndRMN],
          ['Otros estudios neurológicos', v.ndEstudiosOtros],
          ['Interconsultas / evaluaciones', v.ndInterconsultas],
          ['Apoyos y tratamientos en curso', v.ndApoyos],
        ],
      },
    ],
  },
  talla: {
    extraBlocks: (v) => [
      {
        id: 'talla_detalle',
        title: 'Detalle de crecimiento y talla',
        rows: [
          ['Edad de inicio / detección', v.tallaEdadInicio],
          ['Historia familiar de talla', v.tallaFamiliaAdultos],
          ['Estudios complementarios', v.tallaEstudiosPrevios],
          ['Tratamientos / intervenciones', v.tallaTratamientos],
        ],
      },
    ],
  },
  dismorfias: {
    extraBlocks: (v) => [
      {
        id: 'dismorfias_detalle',
        title: 'Resumen de dismorfias y estudios',
        rows: [
          ['Descripción clínica resumida', v.dismorfiasDescripcion],
          ['Órganos / sistemas afectados', v.dismorfiasSistemasAfectados],
          ['Imágenes / screening', v.dismorfiasImagenes],
          ['Estudios genéticos previos', v.dismorfiasEstudiosGeneticos],
        ],
      },
    ],
  },
  prenatal: {
    omit: ['desarrollo', 'comportamiento', 'examen', 'estudios', 'sintesis', 'plan', 'antecedentes_personales'],
    titleOverrides: {
      prenatal: 'Resumen prenatal y perinatal',
    },
    extraBlocks: (v) => [
      {
        id: 'prenatal_detalle',
        title: 'Hallazgos prenatales',
        rows: [
          ['Motivo prenatal', v.identificacionMotivoConsulta],
          ['Edad gestacional actual', v.identificacionEdadGestacional],
          ['Método de cálculo', v.identificacionMetodoCalculo],
          ['FUM', v.identificacionFum],
          ['Semanas del hallazgo', v.prenatalSemanas],
          ['Hallazgos ecográficos', v.prenatalEcografia],
          ['Cribados alterados', v.prenatalCribado],
          ['RCIU / otros hallazgos', v.prenatalRciu],
        ],
      },
      {
        id: 'prenatal_plan',
        title: 'Evaluación y plan prenatal',
        rows: [
          ['Procedimientos realizados', v.prenatalProcedimientos],
          ['Estudios invasivos', v.prenatalInvasivos],
          ['Genética fetal / molecular', v.prenatalGeneticaFetal],
          ['Consejería brindada', v.prenatalConsejeria],
          ['Notas adicionales', v.prenatalNotas],
        ],
      },
    ],
  },
  fertilidad: {
    omit: ['desarrollo', 'comportamiento', 'examen'],
    titleOverrides: {
      plan: 'Plan reproductivo y seguimiento',
    },
    extraBlocks: (v) => [
      {
        id: 'fertilidad_resumen',
        title: 'Resumen reproductivo',
        rows: [
          ['Tiempo de búsqueda / historia reproductiva', v.reproTiempoBusqueda],
          ['Diagnósticos o hallazgos clave', v.reproDiagnosticos],
          ['Tratamientos intentados', v.reproTratamientos],
          ['Estudios genéticos / complementarios', v.reproEstudiosPrevios],
          ['Plan actual', v.reproPlan],
          ['Pérdidas gestacionales', v.reproPerdidasGestacionales],
          ['Datos femeninos relevantes', v.reproFemeninoDatos],
          ['Datos masculinos relevantes', v.reproMasculinoDatos],
        ],
      },
    ],
  },
  onco: {
    omit: ['desarrollo', 'comportamiento'],
    titleOverrides: {
      estudios: 'Estudios genéticos y oncológicos',
      plan: 'Plan de seguimiento oncológico',
    },
    extraBlocks: (v) => [
      {
        id: 'onco_diagnostico',
        title: 'Diagnósticos y tratamientos oncológicos',
        rows: [
          ['Tipos de tumor', v.oncoTiposTumor],
          ['Edad al diagnóstico', v.oncoEdadDiagnostico],
          ['Tratamientos previos', v.oncoTratamientos],
          ['Estudios previos', v.oncoEstudiosPrevios],
        ],
      },
      {
        id: 'onco_contexto',
        title: 'Contexto genético familiar',
        rows: [
          ['Historia familiar detallada', v.oncoArbolFamiliar],
          ['Modelos de riesgo / criterios', v.oncoRiesgoModelos],
          ['Estudios genéticos disponibles', v.oncoEstudiosDisponibles],
          ['Plan de seguimiento / recomendaciones', v.oncoPlanSeguimiento],
        ],
      },
    ],
  },
  monogenica: {
    titleOverrides: {
      estudios: 'Estudios complementarios / moleculares',
    },
    extraBlocks: (v) => [
      {
        id: 'monogenica_resumen',
        title: 'Resumen de sospecha monogénica',
        rows: [
          ['Fenotipo / rasgos cardinales', v.monoFenotipo],
          ['Biomarcadores / bioquímica', v.monoBioquimica],
          ['Órgano / sistema predominante', v.monoOrganoSistema],
          ['Estudios genéticos previos', v.monoEstudiosPrevios],
          ['Tratamientos / respuesta', v.monoTratamiento],
          ['Plan de estudios propuesto', v.monoPlanEstudios],
          ['Notas adicionales', v.monoNotas],
        ],
      },
    ],
  },
  otros: {
    extraBlocks: (v) => [
      {
        id: 'otros_detalle',
        title: 'Detalle del motivo específico',
        rows: [
          ['Descripción del caso', v.otrosMotivo],
          ['Estudios realizados', v.otrosEstudios],
          ['Plan / próximos pasos', v.otrosPlan],
        ],
      },
    ],
  },
};

export default function StepResumen({ value, edad, grupos, onEditStep }) {
  const group = grupos.find((g) => g.id === value.motivoGroup);
  const detail = group?.options.find((o) => o.id === value.motivoDetail);
  const groupId = group?.id || value.motivoGroup || '';
  const motivo = [group?.label, detail?.label].filter(Boolean).join(' · ');
  const edadTexto = Number.isFinite(edad) ? `${edad} años` : '—';

  const blocks = useMemo(() => {
    const nombrePaciente = `${value.pacienteNombre || ''} ${value.pacienteApellido || ''}`.trim() || '—';
    const consanguinidadTexto = value.consanguinidad
      ? `${CONSANGUINIDAD_LABELS[value.consanguinidad] || value.consanguinidad}${value.consanguinidadDetalle ? ` · ${value.consanguinidadDetalle}` : ''}`
      : value.consanguinidadDetalle;
    const clasificacion = value.sintesisClasificacion
      ? CLASIFICACION_LABELS[value.sintesisClasificacion] || value.sintesisClasificacion
      : '';
    const caracterizacion = value.sintesisSindromico
      ? SINDROMICO_LABELS[value.sintesisSindromico] || value.sintesisSindromico
      : '';
    const acompanante = value.pacienteAcompanante
      ? `${value.pacienteAcompanante} (${value.pacienteAcompananteParentesco || 'sin parentesco'})`
      : value.pacienteAcompananteParentesco;
    const resumenPrimera = (value.resumenPrimeraConsulta || '').trim() || 'Sin registrar';

    const formatPersona = (nombre, apellido, procedencia) => {
      const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ').trim();
      if (nombreCompleto && procedencia) return `${nombreCompleto} · ${procedencia}`;
      if (procedencia) return procedencia;
      return nombreCompleto;
    };

    const formatAscendencia = (apellido, procedencia) => {
      if (!apellido && !procedencia) return '';
      if (apellido && procedencia) return `${apellido} · ${procedencia}`;
      return apellido || procedencia;
    };

    const padreTutor = formatPersona(value.tutorPadreNombre, value.tutorPadreApellido, value.tutorPadreProcedencia);
    const madreTutora = formatPersona(value.tutorMadreNombre, value.tutorMadreApellido, value.tutorMadreProcedencia);
    const padreConsanguinidad = value.tutorPadreConsanguinidad
      ? YES_NO_LABELS[value.tutorPadreConsanguinidad] || value.tutorPadreConsanguinidad
      : '';
    const madreConsanguinidad = value.tutorMadreConsanguinidad
      ? YES_NO_LABELS[value.tutorMadreConsanguinidad] || value.tutorMadreConsanguinidad
      : '';
    const abueloPaternoPadre = formatAscendencia(value.tutorPadrePadreApellido, value.tutorPadrePadreProcedencia);
    const abuelaPaternaPadre = formatAscendencia(value.tutorPadreMadreApellido, value.tutorPadreMadreProcedencia);
    const abueloMaternoMadre = formatAscendencia(value.tutorMadrePadreApellido, value.tutorMadrePadreProcedencia);
    const abuelaMaternaMadre = formatAscendencia(value.tutorMadreMadreApellido, value.tutorMadreMadreProcedencia);

    const baseBlocks = [
      {
        id: 'identificacion',
        title: 'Datos de identificación',
        rows: [
          ['Historia clínica', value.agNumber],
          ['Nombre', nombrePaciente],
          ['Sexo', value.pacienteSexo],
          ['Fecha de nacimiento', value.pacienteNacimiento],
          ['Edad cronológica', edadTexto],
          ['Fecha de consulta', value.consultaFecha],
          ['Motivo de consulta', motivo || value.motivoPaciente],
          ['Derivación', value.motivoDerivacion],
          ['Escolaridad actual', value.pacienteEscolaridad],
          ['Rendimiento escolar', value.pacienteEscolaridadRendimiento],
          ['Acompañante y parentesco', acompanante],
        ],
      },
      {
        id: 'familia',
        title: 'Antecedentes familiares patológicos',
        rows: [
          ['Consanguinidad', consanguinidadTexto],
          ['Antecedentes neurológicos / dismórficos', value.familiaAntecedentesNeuro],
          ['Abortos repetidos / infertilidad', value.familiaAbortosInfertilidad],
          ['Desarrollo de hermanos/as', value.familiaDesarrolloHermanos],
          ['Diagnósticos genéticos previos', value.familiaDiagnosticosGeneticos],
        ],
      },
      {
        id: 'padres',
        title: 'Padres / tutores',
        rows: [
          ['Padre / tutor', padreTutor],
          ['Teléfono padre / tutor', value.contactoTelefono1],
          ['Consanguinidad referida (padre)', padreConsanguinidad],
          ['Padre del padre (abuelo)', abueloPaternoPadre],
          ['Madre del padre (abuela)', abuelaPaternaPadre],
          ['Madre / tutora', madreTutora],
          ['Teléfono madre / tutora', value.contactoTelefono2],
          ['Consanguinidad referida (madre)', madreConsanguinidad],
          ['Padre de la madre (abuelo)', abueloMaternoMadre],
          ['Madre de la madre (abuela)', abuelaMaternaMadre],
        ],
      },
      {
        id: 'resumen_inicial',
        title: 'Resumen de primera consulta',
        rows: [
          ['Síntesis clínica inicial', resumenPrimera],
        ],
      },
      {
        id: 'prenatal',
        title: 'Antecedentes prenatales y perinatales',
        rows: [
          ['Edad materna / paterna', (value.edadMaternaConcepcion || value.edadPaternaConcepcion) ? `${value.edadMaternaConcepcion || '—'} / ${value.edadPaternaConcepcion || '—'}` : null],
          ['Control prenatal', value.controlPrenatal ? `${value.controlPrenatal} ${value.controlPrenatalDetalle || ''}`.trim() : value.controlPrenatalDetalle],
          ['Complicaciones del embarazo', value.embarazoComplicaciones],
          ['Exposición a sustancias', value.embarazoExposiciones],
          ['Hallazgos ecofetal', value.prenatalEcoAlteraciones],
          ['Tipo de parto', value.perinatalTipoParto],
          ['Edad gestacional', value.perinatalEdadGestacional],
          ['Peso / talla nacimiento', (value.perinatalPesoNacimiento || value.perinatalTallaNacimiento) ? `${value.perinatalPesoNacimiento || '—'} g · ${value.perinatalTallaNacimiento || '—'} cm` : null],
          ['Apgar 1´ / 5´', (value.perinatalApgar1 || value.perinatalApgar5) ? `${value.perinatalApgar1 || '—'} / ${value.perinatalApgar5 || '—'}` : null],
          ['Internación neonatal', value.perinatalInternacionNeonatal],
          ['Eventos neonatales', value.perinatalComplicaciones],
        ],
      },
      {
        id: 'desarrollo',
        title: 'Historia del desarrollo',
        rows: [
          ['Hitos motores', value.ndHitosMotores],
          ['Lenguaje / comunicación', value.ndLenguaje],
          ['Área social y conductual', value.ndConducta],
          ['Área cognitiva', value.ndAreaCognitiva],
          ['Regresión', value.ndRegresion],
          ['Escolaridad y apoyos', value.ndEscolaridadDetalle],
        ],
      },
      {
        id: 'antecedentes_personales',
        title: 'Antecedentes personales patológicos',
        rows: [
          ['Neurológicos', value.antecedentesNeurologicos],
          ['Endocrino-metabólicos', value.antecedentesMetabolicos],
          ['Sensoriales', value.antecedentesSensoriales],
          ['Psicosociales', value.antecedentesPsicosociales],
        ],
      },
      {
        id: 'comportamiento',
        title: 'Evaluación del comportamiento y adaptación',
        rows: [
          ['Interacción social y emocional', value.comportamientoInteraccion],
          ['Habilidades adaptativas', value.comportamientoAdaptativas],
          ['Escalas aplicadas', value.comportamientoEscalas],
          ['Nivel de apoyo requerido', value.comportamientoApoyo],
        ],
      },
      {
        id: 'examen',
        title: 'Examen físico',
        rows: [
          [
            'Antropometría',
            (value.pacienteExamenPeso || value.pacienteExamenTalla || value.pacienteExamenPc)
              ? `Peso ${value.pacienteExamenPeso || '—'} kg (${value.pacienteExamenPesoPercentil || '—'}), ` +
                `Talla ${value.pacienteExamenTalla || '—'} cm (${value.pacienteExamenTallaPercentil || '—'}), ` +
                `PC ${value.pacienteExamenPc || '—'} cm (${value.pacienteExamenPcPercentil || '—'})`
              : null,
          ],
          ['Proporciones corporales', value.pacienteExamenProporciones],
          ['Dismorfias craneofaciales', value.pacienteExamenDismorfias],
          ['Malformaciones sistémicas', value.pacienteExamenMalformaciones],
          ['Piel y faneras', value.pacienteExamenPiel],
          ['Examen neurológico', value.pacienteExamenNeurologico],
          ['Observaciones adicionales', value.pacienteExamenOtras],
        ],
      },
      {
        id: 'estudios',
        title: 'Estudios complementarios',
        rows: [
          ['Primer nivel', value.estudiosPrimerNivel],
          ['Segundo nivel', value.estudiosSegundoNivel],
          ['Tercer nivel / dirigidos', value.estudiosTercerNivel],
          ['Notas e interpretación', value.estudiosComplementariosNotas],
        ],
      },
      {
        id: 'sintesis',
        title: 'Síntesis diagnóstica',
        rows: [
          ['Clasificación funcional', clasificacion],
          ['Caracterización', caracterizacion],
          ['Etiología probable', value.sintesisEtiologia],
          ['Reversibilidad parcial', value.sintesisReversibilidad],
        ],
      },
      {
        id: 'plan',
        title: 'Plan y seguimiento',
        rows: [
          ['Derivaciones', value.planDerivaciones],
          ['Consejería genética', value.planConsejeriaGenetica],
          ['Controles y seguimiento', value.planControles],
          ['Registro fenotípico / HPO', value.planRegistroHpo],
        ],
      },
    ];

    const config = GROUP_SUMMARY_CONFIG[groupId] || {};
    const omitSet = new Set(config.omit || []);
    const titleOverrides = config.titleOverrides || {};

    const mappedBase = baseBlocks
      .filter((block) => !omitSet.has(block.id))
      .map((block) => (
        titleOverrides[block.id]
          ? { ...block, title: titleOverrides[block.id] }
          : block
      ));

    const extraBlocks = typeof config.extraBlocks === 'function'
      ? config.extraBlocks(value) || []
      : config.extraBlocks || [];

    return [...mappedBase, ...extraBlocks];
  }, [value, motivo, edadTexto, groupId]);

  const visibleBlocks = blocks
    .map((block) => ({
      ...block,
      rows: block.rows.filter(([_, val]) => asText(val) !== '—'),
    }))
    .filter((block) => block.rows.length > 0);

  return (
    <section className="grid gap-4">
      <h2 className="text-sm font-semibold text-slate-700">Revisión final</h2>
      <div className="grid gap-4">
        {visibleBlocks.map(({ id, title, rows }) => (
          <div key={id || title} className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{title}</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rows.map(([label, rawValue]) => (
                <div key={label}>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
                  <dd className="text-sm text-slate-800 whitespace-pre-wrap">{asText(rawValue)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onEditStep(3)}
          className="text-xs px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-50"
        >
          Editar datos del paciente
        </button>
        <button
          onClick={() => onEditStep(4)}
          className="text-xs px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-50"
        >
          Editar estudios y plan
        </button>
      </div>
      <div className="mt-4 flex justify-end print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="text-xs px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100"
        >
          Imprimir resumen
        </button>
      </div>
    </section>
  );
}
