// src/modules/pedigree-engine/normalize.js
// Normaliza el estado clínico del pedigrí asegurando defaults consistentes.

const DEFAULT_METADATA = (overrides = {}) => ({
  familyId: '',
  createdAt: null,
  updatedAt: null,
  recorder: '',
  historian: '',
  reason: '',
  privacy: {
    names: 'initials', // initials | full
    dates: 'year-only', // year-only | full
    ...overrides.privacy,
  },
  ...overrides,
});

const DEFAULT_LEGEND = (overrides = {}) => ({
  filled: 'Afectado clínicamente',
  halfFilled: 'Portador AR',
  dot: 'Portador ligado al X',
  triangle: 'Embarazo no a término',
  diamond: 'Sexo no especificado',
  ...overrides,
});

const DEFAULT_INDIVIDUAL = () => ({
  id: '',
  label: '',
  nombre: '',
  rol: '',
  sex: 'U', // M | F | U
  bornYear: null,
  age: null,
  dead: false,
  deadInfo: { year: null, note: null },
  affected: { value: false, dx: [] },
  carrier: { type: 'none', evidence: 'unknown' },
  evaluations: [],
  notes: '',
  ancestry: { maternal: null, paternal: null },
  filiatorios: {},
});

const DEFAULT_RELATIONSHIP = () => ({
  type: 'partner', // partner | parentChild
  a: null,
  b: null,
  status: 'current',
});

const DEFAULT_PREGNANCY = () => ({
  id: '',
  mother: null,
  father: null,
  gestationalAgeWks: null,
  outcome: null,
  karyotype: null,
  affected: false,
});

const DEFAULT_ART = () => ({
  id: '',
  role: 'D', // D (donante) | S (gestante)
  relatedTo: null,
  notes: '',
});

const DEFAULT_LAYOUT = () => ({
  nodes: [],
  edges: [],
});

export function normalizeIndividual(raw = {}) {
  const base = DEFAULT_INDIVIDUAL();
  const affected = raw.affected && typeof raw.affected === 'object' ? raw.affected : {};
  const carrier = raw.carrier && typeof raw.carrier === 'object' ? raw.carrier : {};
  const ancestry = raw.ancestry && typeof raw.ancestry === 'object' ? raw.ancestry : {};
  const filiatorios = raw.filiatorios && typeof raw.filiatorios === 'object' ? raw.filiatorios : {};
  return {
    ...base,
    ...raw,
    sex: ['M', 'F', 'U'].includes(raw.sex) ? raw.sex : base.sex,
    label: typeof raw.label === 'string' ? raw.label : base.label,
    nombre: typeof raw.nombre === 'string' ? raw.nombre : base.nombre,
    rol: typeof raw.rol === 'string' ? raw.rol : base.rol,
    deadInfo: {
      year: raw.deadInfo?.year ?? base.deadInfo.year,
      note: raw.deadInfo?.note ?? base.deadInfo.note,
    },
    affected: {
      value: !!affected.value,
      dx: Array.isArray(affected.dx) ? affected.dx.filter(Boolean) : [],
    },
    carrier: {
      type: ['none', 'AR', 'X'].includes(carrier.type) ? carrier.type : 'none',
      evidence: ['lab', 'family', 'unknown'].includes(carrier.evidence)
        ? carrier.evidence
        : 'unknown',
    },
    evaluations: Array.isArray(raw.evaluations)
      ? raw.evaluations
          .filter((ev) => ev && typeof ev === 'object')
          .map((ev) => ({
            code: `${ev.code || ''}`.trim(),
            desc: ev.desc || '',
            result: ev.result || '',
          }))
      : [],
    ancestry: {
      maternal: ancestry.maternal || null,
      paternal: ancestry.paternal || null,
    },
    filiatorios: { ...filiatorios },
  };
}

export function normalizeRelationship(raw = {}) {
  const base = DEFAULT_RELATIONSHIP();
  if (raw.type === 'parentChild') {
    return {
      type: 'parentChild',
      father: raw.father || null,
      mother: raw.mother || null,
      child: raw.child || null,
      biological: raw.biological !== false,
      gestational: raw.gestational === true,
      adoptive: raw.biological === false || raw.adoptive === true,
    };
  }
  return {
    ...base,
    ...raw,
    type: 'partner',
    a: raw.a || null,
    b: raw.b || null,
    status: raw.status === 'ended' ? 'ended' : 'current',
    consanguinity: raw.consanguinity === true,
  };
}

export function normalizePregnancy(raw = {}) {
  const base = DEFAULT_PREGNANCY();
  return {
    ...base,
    ...raw,
    outcome: raw.outcome || null,
    gestationalAgeWks: Number.isFinite(raw.gestationalAgeWks)
      ? raw.gestationalAgeWks
      : null,
    affected: !!raw.affected,
  };
}

export function normalizeArt(raw = {}) {
  const base = DEFAULT_ART();
  return {
    ...base,
    ...raw,
    role: raw.role === 'S' ? 'S' : 'D',
  };
}

export function normalizeLayout(raw = {}) {
  const nodes = Array.isArray(raw.nodes)
    ? raw.nodes
        .filter((node) => node && node.id)
        .map((node) => ({
          id: node.id,
          x: Number.isFinite(node.x) ? node.x : 0,
          y: Number.isFinite(node.y) ? node.y : 0,
        }))
    : [];
  const edges = Array.isArray(raw.edges)
    ? raw.edges
        .filter((edge) => edge && edge.from && edge.to && edge.kind)
        .map((edge) => ({
          from: edge.from,
          to: edge.to,
          kind: edge.kind,
        }))
    : [];
  return { nodes, edges };
}

export function normalizeMetadata(raw = {}) {
  const meta = DEFAULT_METADATA(raw);
  meta.privacy = {
    ...DEFAULT_METADATA().privacy,
    ...(raw.privacy || {}),
  };
  if (!['initials', 'full'].includes(meta.privacy.names)) meta.privacy.names = 'initials';
  if (!['year-only', 'full'].includes(meta.privacy.dates)) meta.privacy.dates = 'year-only';
  return meta;
}

export function normalizeLegend(raw = {}) {
  const legend = DEFAULT_LEGEND(raw);
  return {
    filled: legend.filled || DEFAULT_LEGEND().filled,
    halfFilled: legend.halfFilled || DEFAULT_LEGEND().halfFilled,
    dot: legend.dot || DEFAULT_LEGEND().dot,
    triangle: legend.triangle || DEFAULT_LEGEND().triangle,
    diamond: legend.diamond || DEFAULT_LEGEND().diamond,
  };
}

export function normalizeState(raw = {}) {
  const individuals = Array.isArray(raw.individuals)
    ? raw.individuals
        .filter((ind) => ind && ind.id)
        .map((ind) => normalizeIndividual(ind))
    : [];

  const relationships = Array.isArray(raw.relationships)
    ? raw.relationships.map((rel) => normalizeRelationship(rel)).filter(Boolean)
    : [];

  const pregnancies = Array.isArray(raw.pregnancies)
    ? raw.pregnancies
        .filter((preg) => preg && preg.id)
        .map((preg) => normalizePregnancy(preg))
    : [];

  const art = Array.isArray(raw.art)
    ? raw.art.filter((item) => item && item.id).map((item) => normalizeArt(item))
    : [];

  const layout = normalizeLayout(raw.layout || {});

  const metadata = normalizeMetadata(raw.metadata || {});
  const legend = normalizeLegend(raw.legend || {});

  return {
    metadata,
    legend,
    individuals,
    relationships,
    pregnancies,
    art,
    layout,
  };
}

export function createEmptyState(overrides = {}) {
  return normalizeState({
    metadata: DEFAULT_METADATA(overrides.metadata || {}),
    legend: DEFAULT_LEGEND(overrides.legend || {}),
    individuals: overrides.individuals || [],
    relationships: overrides.relationships || [],
    pregnancies: overrides.pregnancies || [],
    art: overrides.art || [],
    layout: overrides.layout || {},
  });
}
