export const MOTIVO_CONSULTA_GROUPS = [
  {
    id: 'malformaciones',
    label: 'Malformaciones congénitas y dismorfias',
    options: [
      { id: 'malformaciones-multiples', label: 'Recién nacidos o niños con malformaciones múltiples.' },
      { id: 'dismorfismos', label: 'Dismorfismos faciales o corporales sugestivos de un síndrome genético.' },
      { id: 'cromosomopatias', label: 'Sospecha de cromosomopatía (ej: fenotipo tipo Down, Turner, Edwards).' }
    ]
  },
  {
    id: 'retraso-desarrollo',
    label: 'Retraso global del desarrollo y discapacidad intelectual',
    options: [
      { id: 'retraso-hitos', label: 'Niños con retraso en hitos motores o del lenguaje.' },
      { id: 'discapacidad-intelectual', label: 'Discapacidad intelectual de causa no aclarada.' },
      { id: 'tea', label: 'Trastornos del espectro autista (TEA) y otros trastornos del neurodesarrollo.' }
    ]
  },
  {
    id: 'antecedentes-familiares',
    label: 'Antecedentes familiares sugestivos',
    options: [
      { id: 'agregacion-familiar', label: 'Agregación familiar de una misma enfermedad.' },
      { id: 'muertes-tempranas', label: 'Muertes tempranas o múltiples abortos espontáneos.' },
      { id: 'patrones-mendelianos', label: 'Patrones mendelianos claros (dominante, recesivo, ligado al X).' }
    ]
  },
  {
    id: 'enfermedades-monogenicas',
    label: 'Enfermedades monogénicas sospechadas',
    options: [
      { id: 'fibrosis-quistica', label: 'Fibrosis quística, distrofias musculares, hemocromatosis, etc.' },
      { id: 'fenotipo-caracteristico', label: 'Sospecha clínica por fenotipo característico o hallazgos bioquímicos.' }
    ]
  },
  {
    id: 'cancer-familiar',
    label: 'Cáncer familiar y predisposición oncológica',
    options: [
      { id: 'cancer-mama-ovario', label: 'Historia personal y familiar de cáncer de mama, ovario, colon, endometrio, etc.' },
      { id: 'tumores-tempranos', label: 'Tumores en edades tempranas o en combinaciones inusuales.' },
      { id: 'sindromes-predisposicion', label: 'Sospecha de síndromes como Lynch, BRCA1/2, Li-Fraumeni.' }
    ]
  },
  {
    id: 'errores-metabolismo',
    label: 'Errores congénitos del metabolismo',
    options: [
      { id: 'neonatos-hipotonia', label: 'Neonatos con hipotonía, convulsiones, vómitos, hipoglucemias, acidosis.' },
      { id: 'cribado-anormal', label: 'Alteraciones en cribado neonatal o perfiles metabólicos anormales.' }
    ]
  },
  {
    id: 'problemas-reproductivos',
    label: 'Problemas reproductivos',
    options: [
      { id: 'infertilidad', label: 'Infertilidad, azoospermia, amenorrea primaria.' },
      { id: 'abortos-recurrentes', label: 'Abortos recurrentes (≥2).' },
      { id: 'alteraciones-cromosomicas', label: 'Alteraciones cromosómicas balanceadas en padres.' }
    ]
  },
  {
    id: 'hallazgos-prenatales',
    label: 'Hallazgos prenatales',
    options: [
      { id: 'malformaciones-eco', label: 'Malformaciones detectadas por ecografía.' },
      { id: 'marcadores-aneuploidia', label: 'Marcadores de aneuploidía.' },
      { id: 'restriccion-crecimiento', label: 'Restricción de crecimiento intrauterino sin causa clara.' },
      { id: 'cribado-prenatal-anormal', label: 'Resultados anormales de cribado prenatal (bioquímico o ADN libre).' }
    ]
  },
  {
    id: 'hallazgos-incidentales',
    label: 'Hallazgos incidentales en estudios',
    options: [
      { id: 'alteraciones-cariotipo', label: 'Alteraciones citogenéticas en cariotipo solicitado por otra causa.' },
      { id: 'hallazgos-imagen', label: 'Hallazgos inesperados en resonancia, ecografía o laboratorios.' }
    ]
  },
  {
    id: 'otros-motivos',
    label: 'Otros motivos frecuentes',
    options: [
      { id: 'tallas-extremas', label: 'Tallas extremas (baja o alta estatura desproporcionada).' },
      { id: 'displasias-esqueleticas', label: 'Displasias esqueléticas.' },
      { id: 'alteraciones-sensoriales', label: 'Sordera, ceguera, retinitis pigmentaria, epilepsias genéticas.' },
      { id: 'dermatosis-inmunodeficiencias', label: 'Dermatosis o inmunodeficiencias de sospecha genética.' }
    ]
  }
];
