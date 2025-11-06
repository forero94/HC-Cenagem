// src/lib/gruposConsulta.js
export const GRUPOS_CONSULTA = [
  {
    id: 'di_rm',
    label: '1. Déficit intelectual / retraso madurativo',
    options: [
      { id: 'retraso_motores', label: 'Retraso en hitos motores' },
      { id: 'retraso_lenguaje', label: 'Retraso del lenguaje' },
      { id: 'di_no_aclarada', label: 'DI de causa no aclarada' },
      { id: 'tea', label: 'TEA u otros TND' },
    ],
  },
  {
    id: 'talla',
    label: '2. Alteraciones de la talla',
    options: [
      { id: 'baja_estatura', label: 'Baja estatura' },
      { id: 'alta_estatura', label: 'Alta estatura' },
      { id: 'desproporcionada', label: 'Talla desproporcionada' },
      { id: 'displasia_esqueletica', label: 'Sospecha de displasia esquelética' },
    ],
  },
  {
    id: 'dismorfias',
    label: '3. Malformaciones congénitas y dismorfias',
    options: [
      { id: 'multiples', label: 'Malformaciones múltiples' },
      { id: 'faciales_corporales', label: 'Dismorfias faciales/corporales sindrómicas' },
      { id: 'cromosomopatia', label: 'Sospecha de cromosomopatía' },
    ],
  },
  {
    id: 'prenatal',
    label: '4. Hallazgos prenatales',
    options: [
      { id: 'eco_malformaciones', label: 'Malformaciones en ecografía' },
      { id: 'marcadores_aneuploide', label: 'Marcadores de aneuploidía' },
      { id: 'rciu', label: 'RCIU sin causa clara' },
      { id: 'cribado_anormal', label: 'Cribado (bioquímico/ADN libre) anormal' },
    ],
  },
  {
    id: 'fertilidad',
    label: '5. Problemas de fertilidad / Asesoría preconcepcional',
    options: [
      { id: 'infertilidad', label: 'Infertilidad/azoospermia/amenorrea' },
      { id: 'abortos_recurrentes', label: 'Abortos recurrentes (≥2)' },
      { id: 'balanceadas', label: 'Alteraciones cromosómicas balanceadas' },
      { id: 'portadores', label: 'Screening de portadores preconcepcional' },
    ],
  },
  {
    id: 'onco',
    label: '6. Cáncer familiar o predisposición oncológica',
    options: [
      { id: 'mama_ovario', label: 'Mama/Ovario (BRCA1/2)' },
      { id: 'colon_endometrio', label: 'Colon/Endometrio (Lynch)' },
      { id: 'li_fraumeni', label: 'Li-Fraumeni' },
      { id: 'otros', label: 'Otros síndromes de predisposición' },
    ],
  },
  {
    id: 'otros',
    label: '7. Otros',
    options: [
      { id: 'sensoriales', label: 'Sordera/Ceguera/Retinitis/Epilepsias genéticas' },
      { id: 'dermato_inmuno', label: 'Dermatosis/ Inmunodeficiencias' },
      { id: 'hallazgo_incidental', label: 'Hallazgo incidental en estudios' },
    ],
  },
  {
    id: 'monogenica',
    label: '8. Sospecha de enfermedad monogénica',
    options: [
      { id: 'fenotipo_especifico', label: 'Fenotipo clínico característico' },
      { id: 'hallazgos_bioquimicos', label: 'Hallazgos bioquímicos sugerentes' },
      { id: 'entidad_concreta', label: 'Entidad concreta sospechada (p. ej., FQ, distrofia, hemocromatosis)' },
      { id: 'organo_sistema', label: 'Afectación predominante de órgano/sistema' },
    ],
  },
];

// Campos visibles por grupo (base). El Paso 3 añade sus propios campos específicos.
export const BASE_SECCIONES_VISIBLES = {
  di_rm:      ['id', 'motivo', 'paciente', 'perinatal', 'neurodesarrollo', 'antropometria', 'examenGenetico', 'consanguinidad', 'familia', 'abuelos'],
  talla:      ['id', 'motivo', 'paciente', 'antropometria', 'consanguinidad', 'familia', 'abuelos'],
  dismorfias: ['id', 'motivo', 'paciente', 'antropometria', 'examenGenetico', 'consanguinidad', 'familia', 'abuelos'],
  prenatal:   ['id', 'motivo', 'paciente', 'prenatal', 'obstetricos', 'consanguinidad', 'familia', 'abuelos'],
  fertilidad: ['id', 'motivo', 'paciente', 'reproductivo', 'consanguinidad', 'familia', 'abuelos'],
  onco:       ['id', 'motivo', 'paciente', 'oncologia', 'consanguinidad', 'familia', 'abuelos'],
  otros:      ['id', 'motivo', 'paciente', 'examenGenetico', 'consanguinidad', 'familia', 'abuelos'],
  monogenica: ['id', 'motivo', 'paciente', 'antropometria', 'examenGenetico', 'consanguinidad', 'familia', 'abuelos'],
};

// Reglas extra por edad (ejemplo)
export function postprocessSecciones({ groupId, edad }) {
  const set = new Set(BASE_SECCIONES_VISIBLES[groupId] || ['id','motivo','paciente']);
  const isAdult = Number.isFinite(edad) && edad >= 18;
  if (groupId === 'onco' && isAdult) {
    set.delete('antropometria');
    set.delete('neurodesarrollo');
  }
  if (groupId === 'prenatal') {
    set.delete('examenGenetico'); // foco en feto
    set.delete('antropometria');
  }
  return Array.from(set);
}

const DETAIL_TO_GROUP = GRUPOS_CONSULTA.reduce((acc, group) => {
  if (!group?.options) return acc;
  group.options.forEach((option) => {
    if (option?.id && !acc[option.id]) {
      acc[option.id] = group.id;
    }
  });
  return acc;
}, {});

export function getGroupIdFromDetail(detailId) {
  if (!detailId) return undefined;
  return DETAIL_TO_GROUP[detailId];
}
