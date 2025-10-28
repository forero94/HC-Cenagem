// src/components/NewCase/enfermedadActualGuides.js
const FIELD_ORDER = [
  'enfInicioContexto',
  'enfEvolucionActual',
  'enfManifestacionesClaves',
  'enfEvaluacionesPrevias',
  'enfImpactoPlan',
];

const BASE_FIELDS = {
  enfInicioContexto: {
    label: 'Inicio y contexto',
    placeholder: 'Cuándo comenzó el cuadro, circunstancias del inicio y signos que motivaron la consulta.',
    helper: '',
  },
  enfEvolucionActual: {
    label: 'Evolución reciente',
    placeholder: 'Descripción cronológica de cómo evolucionó el cuadro desde el inicio hasta la actualidad.',
    helper: '',
  },
  enfManifestacionesClaves: {
    label: 'Manifestaciones actuales',
    placeholder: 'Sintomatología principal, hallazgos clínicos y áreas afectadas.',
    helper: '',
    colSpan: 'md:col-span-2',
  },
  enfEvaluacionesPrevias: {
    label: 'Evaluaciones y estudios previos',
    placeholder: 'Interconsultas, estudios complementarios y resultados relevantes.',
    helper: '',
  },
  enfImpactoPlan: {
    label: 'Impacto actual y plan',
    placeholder: 'Cómo afecta a la vida diaria, apoyos en curso y objetivos de la consulta.',
    helper: '',
  },
};

const BASE_LAYOUT = {
  title: 'Historia de enfermedad actual',
  description: 'Vinculá la descripción con el motivo seleccionado para orientar la evaluación genética.',
  focus: '',
  tips: [
    'Registrá una cronología clara del cuadro.',
    'Detallá síntomas o hallazgos que motivan la consulta.',
    'Incluí estudios previos que aporten a la hipótesis diagnóstica.',
  ],
  fields: BASE_FIELDS,
};

const GROUP_OVERRIDES = {
  di_rm: {
    title: 'Historia del desarrollo y evolución actual',
    description: 'Resumí hitos, regresiones y apoyos terapéuticos vinculados al neurodesarrollo.',
    focus: 'Destacá logros, retrocesos y apoyos vigentes.',
    tips: [
      'Edad exacta en la que se identificaron los retrasos o regresiones.',
      'Cambios en conducta, lenguaje o habilidades adaptativas.',
      'Terapias, apoyos escolares o dispositivos en curso.',
    ],
    fields: {
      enfInicioContexto: {
        label: 'Primeras señales y edad de detección',
        placeholder: 'Controles de niño sano, informes escolares, hitos que no alcanzó o regresiones.',
      },
      enfEvolucionActual: {
        label: 'Evolución del neurodesarrollo',
        placeholder: 'Progresos, retrocesos, ganancia de nuevas habilidades o aparición de crisis.',
      },
      enfManifestacionesClaves: {
        label: 'Manifestaciones actuales',
        placeholder: 'Lenguaje, socialización, conducta, convulsiones u otras manifestaciones neurológicas.',
      },
      enfEvaluacionesPrevias: {
        placeholder: 'Neurología, psicopedagogía, EEG, RMN, paneles genéticos u otros estudios realizados.',
      },
      enfImpactoPlan: {
        placeholder: 'Impacto en la escolaridad, actividades diarias y objetivos del acompañamiento actual.',
      },
    },
  },
  talla: {
    title: 'Seguimiento de crecimiento y talla',
    description: 'Relacioná la evolución del crecimiento con antecedentes familiares y estudios previos.',
    focus: 'Apoyate en percentilos, curvas de crecimiento y antecedentes familiares.',
    tips: [
      'Edad y contexto en que se detectó la alteración de la talla.',
      'Variaciones en peso, talla o proporciones corporales.',
      'Resultados de estudios hormonales, metabólicos o genéticos previos.',
    ],
    fields: {
      enfInicioContexto: {
        label: 'Detección de la alteración de talla',
        placeholder: 'Control pediátrico en que se detectó, percentilos previos, antecedentes familiares.',
      },
      enfEvolucionActual: {
        label: 'Evolución del crecimiento',
        placeholder: 'Trayectoria en curvas, cambios en velocidad de crecimiento o proporciones.',
      },
      enfManifestacionesClaves: {
        placeholder: 'Acompañamiento de otros síntomas: dismorfias, endocrinológicos, ortopédicos.',
      },
      enfEvaluacionesPrevias: {
        placeholder: 'Laboratorios hormonales, edad ósea, imágenes, estudios genéticos específicos.',
      },
      enfImpactoPlan: {
        placeholder: 'Intervenciones en curso, expectativas familiares y próximos pasos.',
      },
    },
  },
  dismorfias: {
    title: 'Descripción de malformaciones y dismorfias',
    description: 'Apuntá las características fenotípicas que orientan la sospecha sindrómica.',
    focus: 'Resaltá malformaciones mayores, menores y progresión fenotípica.',
    tips: [
      'Cronología de hallazgos fenotípicos observados.',
      'Órganos o sistemas comprometidos y su evolución.',
      'Estudios de imágenes o genéticos ya realizados.',
    ],
    fields: {
      enfInicioContexto: {
        label: 'Detección y contexto',
        placeholder: 'Hallazgos prenatales, neonatales o durante controles posteriores.',
      },
      enfEvolucionActual: {
        label: 'Evolución de hallazgos fenotípicos',
        placeholder: 'Cambios en rasgos faciales, aparición de nuevas malformaciones o complicaciones.',
      },
      enfManifestacionesClaves: {
        placeholder: 'Descripción fenotípica resumida por sistemas afectados.',
      },
      enfEvaluacionesPrevias: {
        placeholder: 'Ecocardiograma, neuroimágenes, paneles genéticos, microarrays, cariotipo.',
      },
      enfImpactoPlan: {
        placeholder: 'Complicaciones clínicas, internaciones y plan de seguimiento interdisciplinario.',
      },
    },
  },
  prenatal: {
    title: 'Hallazgos prenatales y evolución del embarazo',
    description: 'Detallá las semanas gestacionales clave, estudios realizados y decisiones tomadas.',
    focus: 'Ordená la información por cronología gestacional.',
    tips: [
      'Semana gestacional del hallazgo principal.',
      'Estudios efectuados y sus resultados.',
      'Consejería brindada y decisiones tomadas hasta el momento.',
    ],
    fields: {
      enfInicioContexto: {
        label: 'Hallazgo prenatal y semana gestacional',
        placeholder: 'Control o estudio donde se identificó el hallazgo, indicación principal.',
      },
      enfEvolucionActual: {
        label: 'Evolución del embarazo',
        placeholder: 'Controles subsiguientes, cambios en biometrías o aparición de nuevos hallazgos.',
      },
      enfManifestacionesClaves: {
        placeholder: 'Descripción de marcadores, malformaciones o riesgos detectados.',
      },
      enfEvaluacionesPrevias: {
        placeholder: 'Ecografías, cribados, estudios invasivos, resultados moleculares disponibles.',
      },
      enfImpactoPlan: {
        placeholder: 'Consejería realizada, derivaciones y plan de seguimiento obstétrico-genético.',
      },
    },
  },
  fertilidad: {
    title: 'Contexto reproductivo actual',
    description: 'Relacioná las manifestaciones con antecedentes reproductivos y estudios realizados.',
    focus: 'Incluí cronología de búsqueda de embarazo y hallazgos ginecológicos/andrológicos.',
    tips: [
      'Tiempo de búsqueda gestacional y antecedentes obstétricos.',
      'Hallazgos en andrología, ginecología o endocrinología reproductiva.',
      'Estudios genéticos solicitados previamente y resultados.',
    ],
    fields: {
      enfInicioContexto: {
        label: 'Historia reproductiva',
        placeholder: 'Tiempo de búsqueda, abortos previos, procedimientos realizados.',
      },
      enfEvolucionActual: {
        label: 'Evolución y tratamientos intentados',
        placeholder: 'Estimulación ovárica, tratamientos de fertilidad, resultados obtenidos.',
      },
      enfManifestacionesClaves: {
        placeholder: 'Hallazgos clínicos: amenorrea, azoospermia, alteraciones hormonales, etc.',
      },
      enfEvaluacionesPrevias: {
        placeholder: 'Estudios hormonales, seminogramas, histerosalpingografía, cariotipos, paneles.',
      },
      enfImpactoPlan: {
        placeholder: 'Objetivos reproductivos actuales y consejería brindada.',
      },
    },
  },
  onco: {
    title: 'Historia oncológica y familiar',
    description: 'Relacioná cronología tumoral con antecedentes familiares y estudios realizados.',
    focus: 'Destacá edad de diagnóstico, tratamientos y agregación familiar.',
    tips: [
      'Tipo de tumor y edad al diagnóstico.',
      'Intervenciones oncológicas, tratamientos y respuesta.',
      'Integración con antecedentes familiares y estudios genéticos.',
    ],
    fields: {
      enfInicioContexto: {
        label: 'Tumor índice',
        placeholder: 'Tipo de tumor, edad al diagnóstico, contexto clínico.',
      },
      enfEvolucionActual: {
        label: 'Evolución oncológica',
        placeholder: 'Tratamientos recibidos, recurrencias, estado actual.',
      },
      enfManifestacionesClaves: {
        placeholder: 'Otros tumores personales o signos de predisposición hereditaria.',
      },
      enfEvaluacionesPrevias: {
        placeholder: 'Paneles germinales, estudios somáticos, modelos de riesgo utilizados.',
      },
      enfImpactoPlan: {
        placeholder: 'Consejería realizada, seguimiento recomendado, familiares en estudio.',
      },
    },
  },
  otros: {
    title: 'Historia clínica actual',
    description: 'Organizá la información principal del cuadro para orientar el análisis genético.',
    focus: '',
    tips: [
      'Cronología de síntomas principales.',
      'Compromiso de órganos o sistemas.',
      'Estudios previos que aporten a la hipótesis diagnóstica.',
    ],
  },
  monogenica: {
    title: 'Sospecha de enfermedad monogénica',
    description: 'Describí fenotipo, hallazgos orientadores y estudios previos que sustentan la sospecha.',
    focus: 'Alineá el relato clínico con la entidad sospechada.',
    tips: [
      'Fenotipo o hallazgos bioquímicos que sustentan la sospecha.',
      'Evolución del cuadro y órganos comprometidos.',
      'Estudios moleculares o funcionales previos.',
    ],
    fields: {
      enfInicioContexto: {
        label: 'Contexto de sospecha',
        placeholder: 'Edad de inicio, antecedentes familiares, detección en screening o hallazgos clínicos específicos.',
      },
      enfEvolucionActual: {
        label: 'Trayectoria de la enfermedad',
        placeholder: 'Progresión, exacerbaciones, respuesta a tratamientos.',
      },
      enfManifestacionesClaves: {
        placeholder: 'Manifestaciones cardinales, órganos afectados, signos patognomónicos.',
      },
      enfEvaluacionesPrevias: {
        placeholder: 'Paneles dirigidos, secuenciaciones, metabolitos, imágenes u otros estudios.',
      },
      enfImpactoPlan: {
        placeholder: 'Tratamientos en curso, monitoreo y objetivo de la consulta actual.',
      },
    },
  },
};

const dedupeList = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item) return false;
    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

const mergeField = (name, baseField, groupField = {}, detailField = {}) => ({
  name,
  label: detailField.label || groupField.label || baseField.label,
  placeholder: detailField.placeholder || groupField.placeholder || baseField.placeholder,
  helper: detailField.helper || groupField.helper || baseField.helper || '',
  colSpan: detailField.colSpan || groupField.colSpan || baseField.colSpan || '',
});

export function getEnfermedadActualLayout(groupId, detailId) {
  const base = BASE_LAYOUT;
  const group = GROUP_OVERRIDES[groupId] || {};
  const detail = group.details?.[detailId] || {};

  const fields = FIELD_ORDER.map((fieldName) => mergeField(
    fieldName,
    base.fields[fieldName],
    group.fields?.[fieldName],
    detail.fields?.[fieldName],
  ));

  return {
    title: detail.title || group.title || base.title,
    description: detail.description || group.description || base.description,
    focus: detail.focus || group.focus || base.focus || '',
    tips: dedupeList([
      ...(base.tips || []),
      ...(group.tips || []),
      ...(detail.tips || []),
    ]),
    fields,
  };
}

