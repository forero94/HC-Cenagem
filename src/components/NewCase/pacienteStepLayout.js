const IDENTIFICATION_SECTIONS = ['id'];

const ANTECEDENTES_SECTIONS = [
  'paciente',
  'perinatal',
  'neurodesarrollo',
  'monogenicas',
  'metabolismo',
  'prenatal',
  'obstetricos',
  'reproductivo',
  'oncologia',
  'incidental',
  'consanguinidad',
  'familia',
  'abuelos',
];

const EXAM_SECTIONS = ['antropometria', 'examenGenetico'];

export function getPacienteStepAvailability(secciones = []) {
  const set = new Set(secciones);
  return {
    antecedentes: ANTECEDENTES_SECTIONS.some((key) => set.has(key)),
    historia: true,
    examen: EXAM_SECTIONS.some((key) => set.has(key)),
    identificacion: IDENTIFICATION_SECTIONS.some((key) => set.has(key)),
  };
}

export { IDENTIFICATION_SECTIONS, ANTECEDENTES_SECTIONS, EXAM_SECTIONS };
