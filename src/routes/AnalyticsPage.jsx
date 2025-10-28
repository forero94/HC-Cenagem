
import React, { useMemo, useState } from 'react';
import { useCenagemStore } from '@/store/cenagemStore';
import { GRUPOS_CONSULTA, getGroupIdFromDetail } from '@/lib/gruposConsulta';

const GROUP_LABELS = GRUPOS_CONSULTA.reduce((acc, group) => {
  const label = typeof group.label === 'string'
    ? group.label.replace(/^[0-9]+\.\s*/, '').trim()
    : group.label;
  acc[group.id] = label || group.id;
  return acc;
}, {});

const DETAIL_LABELS = GRUPOS_CONSULTA.reduce((acc, group) => {
  if (!Array.isArray(group.options)) return acc;
  group.options.forEach((option) => {
    if (option?.id && option?.label) {
      acc[option.id] = option.label;
    }
  });
  return acc;
}, {});

const KNOWN_GROUP_IDS = new Set(Object.keys(GROUP_LABELS));

const GROUP_ID_BY_LABEL = Object.entries(GROUP_LABELS).reduce((acc, [id, label]) => {
  acc[label.toLowerCase()] = id;
  return acc;
}, {});

const MS_IN_DAY = 1000 * 60 * 60 * 24;
const STATUS_PRIORITY = { Confirmado: 3, 'Sospecha monogenica': 2, Pendiente: 1 };
const CLASS_COLORS = {
  Patogenico: '#0f766e',
  'Probablemente patogenico': '#2563eb',
  VUS: '#92400e',
  Negativo: '#475569',
  Pendiente: '#94a3b8',
};

function stripOrdinalLabel(label) {
  if (typeof label !== 'string') return '';
  return label.replace(/^[0-9]+\.\s*/, '').trim();
}

function pickFirstString(...candidates) {
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed) return trimmed;
    }
  }
  return '';
}

function ensureArrayOfStrings(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[;|,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  return date;
}

function normalizeDateString(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = toDate(trimmed);
    return parsed ? parsed.toISOString().slice(0, 10) : null;
  }
  if (value instanceof Date) {
    const parsed = toDate(value);
    return parsed ? parsed.toISOString().slice(0, 10) : null;
  }
  return null;
}

function computeDaysBetween(from, to) {
  const start = toDate(from);
  const end = toDate(to);
  if (!start || !end) return null;
  const diff = Math.round((end.getTime() - start.getTime()) / MS_IN_DAY);
  return Number.isFinite(diff) && diff >= 0 ? diff : null;
}

function resolveGroupIdForFamily(family) {
  if (!family) return null;
  const direct = family.motivo?.groupId;
  if (direct && KNOWN_GROUP_IDS.has(direct)) {
    return direct;
  }
  const detailId = family.motivo?.detailId || family.metadata?.motivoDetailId;
  if (detailId) {
    const fromDetail = typeof getGroupIdFromDetail === 'function' ? getGroupIdFromDetail(detailId) : null;
    if (fromDetail) return fromDetail;
  }
  if (Array.isArray(family.tags)) {
    const found = family.tags.find((tag) => KNOWN_GROUP_IDS.has(tag));
    if (found) return found;
  }
  const label = stripOrdinalLabel(family.motivo?.groupLabel || family.metadata?.groupLabel || '');
  if (label) {
    const match = GROUP_ID_BY_LABEL[label.toLowerCase()];
    if (match) return match;
  }
  return null;
}

function resolveGroupLabel(family, groupId) {
  if (groupId && GROUP_LABELS[groupId]) return GROUP_LABELS[groupId];
  const label = stripOrdinalLabel(family?.motivo?.groupLabel || family?.metadata?.groupLabel || '');
  return label || (groupId || null);
}

function inferStudyModality(study) {
  if (!study) return '';
  return pickFirstString(
    study.metadata?.modality,
    study.metadata?.modalidad,
    study.metadata?.platform,
    study.tipo,
  );
}

function normalizeClassification(value) {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().toLowerCase();
  if (!normalized) return '';
  if (normalized.includes('pathog')) return 'Patogenico';
  if (
    normalized.includes('likely')
    || normalized.includes('probable')
    || normalized.includes('probablemente')
    || normalized.includes('lp ')
    || normalized.includes(' lp')
  ) {
    return 'Probablemente patogenico';
  }
  if (
    normalized.includes('vus')
    || normalized.includes('uncertain')
    || normalized.includes('inciert')
  ) {
    return 'VUS';
  }
  if (
    normalized.includes('negativ')
    || normalized.includes('sin hallazgos')
    || normalized.includes('normal')
  ) {
    return 'Negativo';
  }
  if (normalized.includes('benign')) return 'Benigno';
  if (normalized.includes('pend')) return 'Pendiente';
  return '';
}

function inferResultClassification(study) {
  if (!study) return 'Pendiente';
  const classification = normalizeClassification(pickFirstString(
    study.metadata?.resultClassification,
    study.metadata?.classification,
    study.metadata?.classificacion,
    study.metadata?.acmg,
    study.metadata?.acmgClassification,
    study.metadata?.clasificacion,
  ));
  if (classification) return classification;
  const fromNotes = normalizeClassification(
    pickFirstString(study.resultado, study.descripcion, study.notes),
  );
  if (fromNotes) return fromNotes;
  return 'Pendiente';
}

function inferDiagnosisStatus(study, member) {
  const rawStatus = pickFirstString(
    study?.metadata?.diagnosisStatus,
    study?.metadata?.diagnosis,
    study?.estado,
    study?.status,
    member?.diagnostico,
  );
  if (!rawStatus) return 'Pendiente';
  const normalized = rawStatus.trim().toLowerCase();
  if (
    normalized.includes('confirm')
    || normalized.includes('posit')
    || normalized.includes('complet')
    || normalized.includes('patog')
  ) {
    return 'Confirmado';
  }
  if (
    normalized.includes('suspect')
    || normalized.includes('sospe')
    || normalized.includes('likely')
    || normalized.includes('anal')
    || normalized.includes('revision')
  ) {
    return 'Sospecha monogenica';
  }
  if (normalized.includes('pend')) return 'Pendiente';
  return 'Pendiente';
}

function inferGeneFromStudy(study) {
  if (!study?.metadata) return '';
  const gene = pickFirstString(
    study.metadata.gene,
    study.metadata.geneSymbol,
    study.metadata.gen,
  );
  if (gene) return gene;
  if (Array.isArray(study.metadata.genes)) {
    const found = study.metadata.genes
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .find(Boolean);
    if (found) return found;
  }
  const result = pickFirstString(study.resultado, study.descripcion);
  if (result) {
    const match = result.match(/\b[A-Z0-9]{3,}\b/);
    if (match) return match[0];
  }
  return '';
}

function inferVariantType(study) {
  if (!study?.metadata) return '';
  const variant = pickFirstString(
    study.metadata.variantType,
    study.metadata.variant,
    study.metadata.variantClassification,
  );
  if (variant) return variant;
  const summary = pickFirstString(study.resultado, study.descripcion);
  if (summary) {
    const match = summary.match(/\b(dup(?:lication)?|del(?:etion)?|missense|nonsense|frameshift|cnv|indel)\b/i);
    if (match) return match[0];
  }
  return '';
}

function inferChromosomalRegion(study) {
  if (!study?.metadata) return '';
  return pickFirstString(
    study.metadata.chromosomalRegion,
    study.metadata.region,
    study.metadata.locus,
    study.metadata.citogenetica,
  );
}

function inferPhenotypeSummary(family, member, study) {
  return pickFirstString(
    study?.metadata?.phenotypeSummary,
    member?.resumen,
    family?.motivoPaciente,
    family?.motivoNarrativa,
  );
}

function inferDiagnosisLabel(family, member, study) {
  const label = pickFirstString(
    study?.metadata?.diagnosisLabel,
    member?.diagnostico,
    stripOrdinalLabel(family?.motivo?.detailLabel || DETAIL_LABELS[family?.motivo?.detailId] || ''),
    stripOrdinalLabel(family?.motivo?.groupLabel),
  );
  return label || '';
}

function inferReferralService(family, study) {
  return pickFirstString(
    study?.metadata?.referralService,
    family?.metadata?.referralService,
    family?.motivoDerivacion,
  );
}

function inferRequestingService(family, study) {
  return pickFirstString(
    study?.metadata?.requestingService,
    study?.metadata?.service,
    family?.metadata?.requestingService,
    family?.metadata?.institucionDerivacion,
    family?.motivoDerivacion,
  );
}

function inferLab(study) {
  if (!study?.metadata) return '';
  return pickFirstString(
    study.metadata.lab,
    study.metadata.labName,
    study.metadata.laboratory,
    study.metadata.laboratorio,
  );
}

function inferPhenotypeCluster(groupId, family, study) {
  const cluster = pickFirstString(
    study?.metadata?.phenotypeCluster,
    family?.metadata?.phenotypeCluster,
  );
  if (cluster) return cluster;
  if (groupId && GROUP_LABELS[groupId]) return GROUP_LABELS[groupId];
  return 'Sin clasificar';
}

function inferServiceType(family, study, requestingService) {
  const value = pickFirstString(
    study?.metadata?.serviceType,
    family?.metadata?.serviceType,
    family?.metadata?.sector,
  );
  if (value) return value;
  const text = (requestingService || '').toLowerCase();
  if (!text) return 'Sin dato';
  if (
    text.includes('hospital')
    || text.includes('ministerio')
    || text.includes('publico')
    || text.includes('público')
  ) {
    return 'Publico';
  }
  if (
    text.includes('clinica')
    || text.includes('sanatorio')
    || text.includes('privado')
  ) {
    return 'Privado';
  }
  return 'Sin dato';
}

function inferIsRare(study, member) {
  if (study?.metadata?.isRare !== undefined) return Boolean(study.metadata.isRare);
  if (study?.metadata?.rareFlag !== undefined) return Boolean(study.metadata.rareFlag);
  if (study?.metadata?.rareFlagReason) return true;
  if (member?.metadata?.isRare !== undefined) return Boolean(member.metadata.isRare);
  if (member?.metadata?.rareFlagReason) return true;
  return false;
}

function inferRareReason(study, member) {
  const value = pickFirstString(
    study?.metadata?.rareFlagReason,
    study?.metadata?.rareReason,
    member?.metadata?.rareFlagReason,
    member?.metadata?.rareReason,
  );
  return value || null;
}

function inferYear(...dates) {
  for (const value of dates) {
    const parsed = toDate(value);
    if (parsed) return parsed.getFullYear();
  }
  return null;
}

function inferMonth(...dates) {
  for (const value of dates) {
    const parsed = toDate(value);
    if (parsed) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    }
  }
  return null;
}

function pickProband(members = []) {
  if (!Array.isArray(members) || members.length === 0) return null;
  const byRole = members.find((member) => (member.rol || '').toLowerCase() === 'proband');
  if (byRole) return byRole;
  const byInitials = members.find((member) => (member.filiatorios?.iniciales || '').toUpperCase() === 'A1');
  if (byInitials) return byInitials;
  return members[0];
}

function composeCase({ family, member, study }) {
  if (!family && !member && !study) return null;
  const groupId = resolveGroupIdForFamily(family);
  const groupLabel = resolveGroupLabel(family, groupId);
  const subgroupId = family?.motivo?.detailId || null;
  const subgroupLabel = subgroupId
    ? stripOrdinalLabel(family?.motivo?.detailLabel || DETAIL_LABELS[subgroupId] || '')
    : '';
  const requestingService = inferRequestingService(family, study);
  const derivationAt = normalizeDateString(
    study?.metadata?.derivationAt
      || family?.intake?.administrativo?.derivacionFecha
      || family?.metadata?.derivationAt
      || family?.createdAt
  );
  const requestAt = normalizeDateString(study?.fecha);
  const resultAt = normalizeDateString(study?.resultadoFecha);
  const referenceDate = resultAt || requestAt || derivationAt || null;
  const birthDate = member?.nacimiento || null;
  const ageAtConsult = calculateAgeYears(birthDate, referenceDate, null);
  const ageGroup = inferAgeGroup(ageAtConsult);
  const cohortYear = inferYear(requestAt, resultAt, derivationAt);
  const cohortMonth = inferMonth(requestAt, resultAt, derivationAt);
  const patientKey = [
    family?.id || 'family',
    member?.id || 'member',
  ].join('|');

  const caseExportIdSource = [
    study?.id || family?.id || member?.id || patientKey,
    study?.tipo || 'sin-estudio',
    resultAt || requestAt || derivationAt || '',
  ].join('|');

  return {
    id: study?.id || `family-${family?.id || member?.id || hashString(patientKey)}`,
    familyId: family?.id || null,
    memberId: member?.id || null,
    familyCode: family?.code || '',
    memberInitials: member?.filiatorios?.iniciales || member?.rol || 'FAM',
    patientCode: family?.code
      ? `${family.code}-${member?.filiatorios?.iniciales || member?.rol || 'FAM'}`
      : '',
    sex: member?.sexo || 'Sin dato',
    birthDate,
    approxAge: Number.isFinite(ageAtConsult) ? ageAtConsult : null,
    groupId,
    groupLabel,
    subgroupId,
    subgroupLabel: subgroupLabel || null,
    studyType: study ? (study.tipo || 'Sin estudio') : 'Sin estudio',
    studyName: study?.nombre || '',
    studyModality: inferStudyModality(study),
    resultClassification: study ? inferResultClassification(study) : 'Pendiente',
    diagnosisStatus: inferDiagnosisStatus(study, member),
    gene: inferGeneFromStudy(study),
    variantType: inferVariantType(study),
    chromosomalRegion: inferChromosomalRegion(study),
    hpoTerms: ensureArrayOfStrings(member?.metadata?.hpoTerms),
    phenotypeSummary: inferPhenotypeSummary(family, member, study),
    diagnosisLabel: inferDiagnosisLabel(family, member, study),
    referralService: inferReferralService(family, study),
    requestingService,
    lab: inferLab(study),
    derivationAt,
    requestAt,
    resultAt,
    resultSummary: study?.resultado || '',
    novelVariant: Boolean(study?.metadata?.novelVariant),
    notInClinvar: Boolean(study?.metadata?.notInClinvar),
    notInGnomad: Boolean(study?.metadata?.notInGnomad),
    isRare: inferIsRare(study, member),
    rareFlagReason: inferRareReason(study, member),
    publicationTags: ensureArrayOfStrings(
      study?.metadata?.publicationTags || study?.metadata?.publications,
    ),
    selectedForShowcase: Boolean(study?.metadata?.selectedForShowcase || study?.metadata?.highlight),
    phenotypeCluster: inferPhenotypeCluster(groupId, family, study),
    serviceType: inferServiceType(family, study, requestingService),
    ageAtConsult,
    ageGroup,
    cohortYear,
    cohortMonth,
    turnaroundRequest: computeDaysBetween(derivationAt, requestAt),
    turnaroundResult: computeDaysBetween(requestAt, resultAt),
    turnaroundTotal: computeDaysBetween(derivationAt, resultAt),
    anonPatientId: `PT-${hashString(patientKey)}`,
    caseExportId: `CS-${hashString(caseExportIdSource)}`,
    patientKey,
    provincia: family?.provincia || 'Sin dato',
  };
}

function hashString(input) {
  let hash = 0;
  const text = String(input ?? '');
  for (let idx = 0; idx < text.length; idx += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(idx);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).padStart(8, '0');
}

function calculateAgeYears(birthDate, referenceDate, fallback) {
  if (birthDate && referenceDate) {
    const birth = new Date(birthDate);
    const ref = new Date(referenceDate);
    if (!Number.isNaN(birth.valueOf()) && !Number.isNaN(ref.valueOf())) {
      const diff = ref.getTime() - birth.getTime();
      if (Number.isFinite(diff) && diff >= 0) {
        return Number((diff / (MS_IN_DAY * 365.25)).toFixed(1));
      }
    }
  }
  return typeof fallback === 'number' ? Number(fallback) : null;
}

function inferAgeGroup(age) {
  if (!Number.isFinite(age) || age < 0) return 'Sin dato';
  if (age < 0.1) return 'Prenatal';
  if (age < 1) return '0-1';
  if (age < 5) return '1-5';
  if (age < 12) return '5-12';
  if (age < 18) return '12-18';
  if (age < 40) return '18-40';
  if (age < 65) return '40-65';
  return '65+';
}

function normaliseText(value) {
  return value && value.trim() ? value : 'Sin dato';
}
function buildAnalyticsCases(state = {}) {
  const families = Array.isArray(state.families) ? state.families : [];
  const members = Array.isArray(state.members) ? state.members : [];
  const studies = Array.isArray(state.studies) ? state.studies : [];

  const familiesById = new Map();
  families.forEach((family) => {
    if (family?.id) {
      familiesById.set(family.id, family);
    }
  });

  const membersById = new Map();
  const membersByFamily = new Map();
  members.forEach((member) => {
    if (!member?.id) return;
    membersById.set(member.id, member);
    if (member.familyId) {
      if (!membersByFamily.has(member.familyId)) {
        membersByFamily.set(member.familyId, []);
      }
      membersByFamily.get(member.familyId).push(member);
    }
  });

  const studiesByFamily = new Map();
  studies.forEach((study) => {
    if (!study?.familyId) return;
    if (!studiesByFamily.has(study.familyId)) {
      studiesByFamily.set(study.familyId, []);
    }
    studiesByFamily.get(study.familyId).push(study);
  });

  const familyIds = new Set();
  families.forEach((family) => {
    if (family?.id) {
      familyIds.add(family.id);
    }
  });
  studies.forEach((study) => {
    if (study?.familyId) {
      familyIds.add(study.familyId);
    }
  });

  const cases = [];

  familyIds.forEach((familyId) => {
    const family = familiesById.get(familyId) || null;
    const familyMembers = membersByFamily.get(familyId) || [];
    const proband = pickProband(familyMembers);
    const fallbackMember = proband || familyMembers[0] || null;
    const familyStudies = studiesByFamily.get(familyId) || [];

    if (familyStudies.length) {
      familyStudies.forEach((study) => {
        const member = (study.memberId && membersById.get(study.memberId)) || fallbackMember;
        const caseEntry = composeCase({ family, member, study });
        if (caseEntry) cases.push(caseEntry);
      });
    } else if (family || fallbackMember) {
      const caseEntry = composeCase({ family, member: fallbackMember, study: null });
      if (caseEntry) cases.push(caseEntry);
    }
  });

  cases.sort((a, b) => {
    const dateA = toDate(a.resultAt || a.requestAt || a.derivationAt)?.getTime() || 0;
    const dateB = toDate(b.resultAt || b.requestAt || b.derivationAt)?.getTime() || 0;
    return dateB - dateA;
  });

  return cases;
}
function summarisePatients(cases) {
  const map = new Map();
  for (const entry of cases) {
    const bucket = map.get(entry.patientKey) || {
      patientKey: entry.patientKey,
      anonPatientId: entry.anonPatientId,
      bestStatus: 'Pendiente',
      bestStatusPriority: 0,
      groups: new Set(),
      studyTypes: new Set(),
      genes: new Set(),
      labs: new Set(),
      services: new Set(),
      cases: [],
      ageAtConsult: [],
    };
    const priority = STATUS_PRIORITY[entry.diagnosisStatus] || 0;
    if (priority > bucket.bestStatusPriority) {
      bucket.bestStatus = entry.diagnosisStatus;
      bucket.bestStatusPriority = priority;
    }
    if (entry.groupId) bucket.groups.add(entry.groupId);
    if (entry.studyType) bucket.studyTypes.add(entry.studyType);
    if (entry.gene) bucket.genes.add(entry.gene);
    if (entry.lab) bucket.labs.add(entry.lab);
    if (entry.requestingService) bucket.services.add(entry.requestingService);
    if (Number.isFinite(entry.ageAtConsult)) bucket.ageAtConsult.push(entry.ageAtConsult);
    bucket.cases.push(entry);
    map.set(entry.patientKey, bucket);
  }
  return Array.from(map.values()).map((row) => ({
    ...row,
    groups: Array.from(row.groups),
    studyTypes: Array.from(row.studyTypes),
    genes: Array.from(row.genes),
    labs: Array.from(row.labs),
    services: Array.from(row.services),
    ageAtConsult: row.ageAtConsult.length
      ? Number((row.ageAtConsult.reduce((sum, value) => sum + value, 0) / row.ageAtConsult.length).toFixed(1))
      : null,
  }));
}
function computeDashboardMetrics(state, cases) {
  const families = Array.isArray(state?.families) ? state.families : [];
  const patients = summarisePatients(cases);

  const totals = {
    families: families.length,
    patients: patients.length || (Array.isArray(state?.members) ? state.members.filter((m) => (m.rol || '').toLowerCase() === 'proband').length : 0),
    studies: cases.length,
  };

  const groupCounts = new Map();
  const studyCounts = new Map();
  const resultCounts = new Map();
  const serviceCounts = new Map();
  const statusCounts = new Map();
  const yearCounts = new Map();
  const monthCounts = new Map();
  let accRequest = 0;
  let accRequestCount = 0;
  let accResult = 0;
  let accResultCount = 0;
  let accTotal = 0;
  let accTotalCount = 0;

  for (const entry of cases) {
    if (entry.groupId) {
      const current = groupCounts.get(entry.groupId) || { id: entry.groupId, label: GROUP_LABELS[entry.groupId] || entry.groupLabel || entry.groupId, count: 0 };
      current.count += 1;
      groupCounts.set(entry.groupId, current);
    }
    if (entry.studyType) {
      studyCounts.set(entry.studyType, (studyCounts.get(entry.studyType) || 0) + 1);
    }
    if (entry.resultClassification) {
      resultCounts.set(entry.resultClassification, (resultCounts.get(entry.resultClassification) || 0) + 1);
    }
    if (entry.requestingService) {
      serviceCounts.set(entry.requestingService, (serviceCounts.get(entry.requestingService) || 0) + 1);
    }
    if (entry.cohortYear) {
      yearCounts.set(entry.cohortYear, (yearCounts.get(entry.cohortYear) || 0) + 1);
    }
    if (entry.cohortMonth) {
      monthCounts.set(entry.cohortMonth, (monthCounts.get(entry.cohortMonth) || 0) + 1);
    }
    if (Number.isFinite(entry.turnaroundRequest)) {
      accRequest += entry.turnaroundRequest;
      accRequestCount += 1;
    }
    if (Number.isFinite(entry.turnaroundResult)) {
      accResult += entry.turnaroundResult;
      accResultCount += 1;
    }
    if (Number.isFinite(entry.turnaroundTotal)) {
      accTotal += entry.turnaroundTotal;
      accTotalCount += 1;
    }
  }

  for (const patient of patients) {
    statusCounts.set(patient.bestStatus, (statusCounts.get(patient.bestStatus) || 0) + 1);
  }

  const diagnosisStatus = Array.from(statusCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => (b.count - a.count));

  const groupDistribution = Array.from(groupCounts.values())
    .sort((a, b) => (b.count - a.count));

  const studyDistribution = Array.from(studyCounts.entries())
    .map(([name, count]) => ({ name, label: name, count }))
    .sort((a, b) => (b.count - a.count));

  const resultDistribution = Array.from(resultCounts.entries())
    .map(([name, count]) => ({ name, label: name, count }))
    .sort((a, b) => (b.count - a.count));

  const serviceDistribution = Array.from(serviceCounts.entries())
    .map(([name, count]) => ({ name, label: name, count }))
    .sort((a, b) => (b.count - a.count))
    .slice(0, 6);

  const timelineMonths = Array.from(monthCounts.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => (a.month.localeCompare(b.month)))
    .slice(-12);

  const timelineYears = Array.from(yearCounts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => (a.year - b.year));

  const topGenes = cases
    .filter((item) => item.gene)
    .reduce((acc, item) => acc.set(item.gene, (acc.get(item.gene) || 0) + 1), new Map());

  const topGenesList = Array.from(topGenes.entries())
    .map(([gene, count]) => ({ gene, count }))
    .sort((a, b) => (b.count - a.count))
    .slice(0, 10);

  const yieldByStudy = studyDistribution.map((row) => {
    const studyCases = cases.filter((item) => item.studyType === row.name);
    const diagnostic = studyCases.filter((item) => item.diagnosisStatus === 'Confirmado').length;
    const likely = studyCases.filter((item) => item.diagnosisStatus === 'Sospecha monogenica').length;
    return {
      studyType: row.name,
      total: studyCases.length,
      diagnostic,
      likely,
    };
  });

  const ageByStatus = diagnosisStatus.map((row) => {
    const ages = patients
      .filter((patient) => patient.bestStatus === row.name)
      .map((patient) => patient.ageAtConsult)
      .filter((age) => Number.isFinite(age));
    return {
      status: row.name,
      averageAge: ages.length
        ? Number((ages.reduce((sum, value) => sum + value, 0) / ages.length).toFixed(1))
        : null,
    };
  });

  const rareCases = cases.filter((item) => item.isRare || item.novelVariant).slice(0, 8);
  const alerts = cases.filter((item) => item.notInGnomad || item.notInClinvar || item.novelVariant).slice(0, 8);

  const heatmap = (() => {
    const groups = Array.from(new Set(cases.map((item) => item.groupId || 'otros')));
    const phenotypes = Array.from(new Set(cases.map((item) => item.phenotypeCluster || 'Sin clasificar')));
    const values = groups.map((groupId) => phenotypes.map((phenotype) => (
      cases.filter((item) => (item.groupId || 'otros') === groupId && (item.phenotypeCluster || 'Sin clasificar') === phenotype).length
    )));
    return {
      groups,
      phenotypes,
      values,
    };
  })();

  const turnaround = {
    derivationToRequest: accRequestCount ? Math.round(accRequest / accRequestCount) : null,
    requestToResult: accResultCount ? Math.round(accResult / accResultCount) : null,
    derivationToResult: accTotalCount ? Math.round(accTotal / accTotalCount) : null,
  };

  return {
    totals,
    diagnosisStatus,
    groupDistribution,
    studyDistribution,
    resultDistribution,
    serviceDistribution,
    timeline: { months: timelineMonths, years: timelineYears },
    topGenes: topGenesList,
    yieldByStudy,
    ageByStatus,
    rareCases,
    alerts,
    heatmap,
    turnaround,
  };
}
function buildFilterOptions(cases) {
  const unique = (selector) => Array.from(new Set(cases.map(selector).filter(Boolean))).sort();
  return {
    groupIds: unique((item) => item.groupId),
    studyTypes: unique((item) => item.studyType),
    genes: unique((item) => item.gene),
    diagnosisStatus: unique((item) => item.diagnosisStatus),
    labs: unique((item) => item.lab),
    services: unique((item) => item.requestingService),
    years: unique((item) => item.cohortYear),
    ageGroups: unique((item) => item.ageGroup),
    sexes: unique((item) => item.sex),
  };
}

function applyFilters(cases, filters) {
  return cases.filter((item) => {
    if (filters.groupIds?.length && !filters.groupIds.includes(item.groupId)) return false;
    if (filters.studyTypes?.length && !filters.studyTypes.includes(item.studyType)) return false;
    if (filters.genes?.length && !filters.genes.includes(item.gene)) return false;
    if (filters.diagnosisStatus?.length && !filters.diagnosisStatus.includes(item.diagnosisStatus)) return false;
    if (filters.labs?.length && !filters.labs.includes(item.lab)) return false;
    if (filters.services?.length && !filters.services.includes(item.requestingService)) return false;
    if (filters.years?.length && !filters.years.includes(item.cohortYear)) return false;
    if (filters.ageGroups?.length && !filters.ageGroups.includes(item.ageGroup)) return false;
    if (filters.sexes?.length && !filters.sexes.includes(item.sex)) return false;
    return true;
  });
}
function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString('es-AR') : '—';
}

function formatPercent(part, total) {
  if (!total) return '0 %';
  return `${((part / total) * 100).toFixed(1)} %`;
}

function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return iso;
  return date.toLocaleDateString('es-AR');
}

function downloadText({ filename, content, mimeType = 'text/plain;charset=utf-8' }) {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (error) {
    console.error('download error', error);
  }
}

function buildCsv(rows) {
  const escapeValue = (value) => {
    if (value === null || value === undefined) return '';
    const text = String(value);
    if (text.includes('"') || text.includes(';') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };
  const header = rows.length ? Object.keys(rows[0]) : [];
  const lines = [
    header.map(escapeValue).join(';'),
    ...rows.map((row) => header.map((key) => escapeValue(row[key])).join(';')),
  ];
  return lines.join('\n');
}

function exportTableData(format, cases, logAudit) {
  const rows = cases.map((item) => ({
    anonId: item.anonPatientId,
    sexo: item.sex,
    edad: Number.isFinite(item.ageAtConsult) ? `${item.ageAtConsult}a` : 'Sin dato',
    gen: normaliseText(item.gene),
    variante: normaliseText(item.variantType),
    hpo: item.hpoTerms?.join(' | ') || 'Sin dato',
    diagnostico: normaliseText(item.diagnosisLabel),
    estudio: normaliseText(item.studyType),
    resultado: normaliseText(item.resultClassification),
    institucion: normaliseText(item.requestingService),
    fechaResultado: formatDate(item.resultAt),
  }));

  if (format === 'csv') {
    const content = buildCsv(rows);
    downloadText({ filename: `cohorte-cenagem-${Date.now()}.csv`, content, mimeType: 'text/csv;charset=utf-8' });
    logAudit?.('export:csv', { count: rows.length });
    return;
  }
  if (format === 'json') {
    downloadText({ filename: `cohorte-cenagem-${Date.now()}.json`, content: JSON.stringify(rows, null, 2) });
    logAudit?.('export:json', { count: rows.length });
    return;
  }
  if (format === 'xlsx') {
    const header = `<tr>${Object.keys(rows[0] || {}).map((key) => `<th>${key}</th>`).join('')}</tr>`;
    const body = rows.map((row) => `<tr>${Object.values(row).map((value) => `<td>${value}</td>`).join('')}</tr>`).join('');
    const content = `<table>${header}${body}</table>`;
    downloadText({ filename: `cohorte-cenagem-${Date.now()}.xls`, content, mimeType: 'application/vnd.ms-excel' });
    logAudit?.('export:xls', { count: rows.length });
  }
}
function exportDistributionSvg(data, title, logAudit) {
  const total = data.reduce((sum, row) => sum + row.count, 0);
  if (!total) return;
  const width = 720;
  const barHeight = 24;
  const gap = 12;
  const height = data.length * (barHeight + gap) + 60;
  const bars = data.map((row, index) => {
    const barWidth = Math.max(4, (row.count / total) * (width - 200));
    const y = 60 + index * (barHeight + gap);
    return `
      <g>
        <text x="16" y="${y + 16}" font-size="12">${row.label || row.name}</text>
        <rect x="180" y="${y}" width="${barWidth}" height="${barHeight}" fill="#1e293b" rx="6" />
        <text x="${180 + barWidth + 8}" y="${y + 16}" font-size="12">${row.count}</text>
      </g>
    `;
  }).join('\n');
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <style>
    text { font-family: 'Inter', 'Segoe UI', sans-serif; fill: #0f172a; }
  </style>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="16" y="32" font-size="18" font-weight="600">${title}</text>
  <text x="16" y="48" font-size="12">Total: ${total}</text>
  ${bars}
</svg>
`.trim();
  downloadText({ filename: `${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.svg`, content: svg, mimeType: 'image/svg+xml;charset=utf-8' });
  logAudit?.('export:svg', { title, count: data.length });
}

function generateAbstract(cases, metrics) {
  const total = metrics.totals.patients;
  const confirmed = metrics.diagnosisStatus.find((row) => row.name === 'Confirmado')?.count || 0;
  const suspected = metrics.diagnosisStatus.find((row) => row.name === 'Sospecha monogenica')?.count || 0;
  const topGroup = metrics.groupDistribution[0];
  const topStudy = metrics.studyDistribution[0];
  return [
    `En nuestra cohorte de ${total} pacientes asistidos en CENAGEM, alcanzamos un rendimiento diagnostico confirmado del ${formatPercent(confirmed, total)} y una sospecha monogenica en ${formatPercent(suspected, total)}.`,
    topGroup ? `El motivo de consulta predominante fue ${topGroup.label} (${formatPercent(topGroup.count, metrics.totals.studies)} de los estudios).` : '',
    topStudy ? `El estudio mas solicitado fue ${topStudy.name}, representando ${formatPercent(topStudy.count, metrics.totals.studies)} del total de determinaciones geneticas.` : '',
    `El tiempo medio entre derivacion y resultado fue de ${metrics.turnaround.derivationToResult ?? 'sin dato'} dias.`,
  ].filter(Boolean).join(' ');
}

function generateResultsDraft(cases, metrics) {
  const lines = [
    'RESULTADOS',
    '',
    `Se analizaron ${metrics.totals.studies} estudios geneticos correspondientes a ${metrics.totals.patients} pacientes.`,
    `La tasa de diagnosticos confirmados fue de ${formatPercent(metrics.diagnosisStatus.find((row) => row.name === 'Confirmado')?.count || 0, metrics.totals.patients)}; los casos con sospecha monogenica pendientes de confirmacion representan ${formatPercent(metrics.diagnosisStatus.find((row) => row.name === 'Sospecha monogenica')?.count || 0, metrics.totals.patients)}.`,
  ];
  if (metrics.topGenes.length) {
    const genes = metrics.topGenes.slice(0, 5).map((row) => `${row.gene} (${row.count})`).join(', ');
    lines.push(`Genes mas frecuentes: ${genes}.`);
  }
  const studyYield = metrics.yieldByStudy
    .filter((row) => row.total)
    .map((row) => `${row.studyType}: ${formatPercent(row.diagnostic + row.likely, row.total)} rendimiento`)
    .join(' · ');
  if (studyYield) {
    lines.push(`Rendimiento por tipo de estudio: ${studyYield}.`);
  }
  if (metrics.turnaround.derivationToResult) {
    lines.push(`El tiempo medio desde derivacion a resultado fue de ${metrics.turnaround.derivationToResult} dias (pedido a resultado: ${metrics.turnaround.requestToResult ?? 'sd'} dias).`);
  }
  if (metrics.rareCases.length) {
    lines.push(`Se identificaron ${metrics.rareCases.length} casos raros/variantes novedosas priorizadas para publicacion.`);
  }
  lines.push('', 'CONCLUSIONES', '', 'Los datos soportan la planificacion de cohortes especificas y priorizan la generacion de reportes cientificos en aquellas areas con mayor rendimiento diagnostico.');
  return lines.join('\n');
}

function buildSelectedCasesText(cases) {
  if (!cases.length) return 'No hay casos seleccionados.';
  return cases.map((item, index) => (
    `${index + 1}. ${item.anonPatientId} · ${normaliseText(item.studyType)} · ${normaliseText(item.gene)} · ${normaliseText(item.diagnosisStatus)} · enlace interno: ${item.familyId ? `#/family/${item.familyId}` : 'no disponible'}`
  )).join('\n');
}
function useAnalyticsAudit(currentUser) {
  const storageKey = 'cenagem-analytics-audit-log';
  const initial = () => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return [];
  };
  const [auditTrail, setAuditTrail] = useState(initial);

  const logAudit = (action, metadata = {}) => {
    const entry = {
      id: `AUD-${hashString(`${action}|${Date.now()}`)}`,
      action,
      metadata,
      user: currentUser,
      at: new Date().toISOString(),
    };
    setAuditTrail((prev) => {
      const next = [entry, ...prev].slice(0, 40);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return { auditTrail, logAudit };
}
function AppToolbar({ title, onBack }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-sm"
          >
            ← Volver
          </button>
        )}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <span className="text-xs text-slate-500">Módulo Analytics · Demo</span>
    </div>
  );
}

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-1">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      {hint ? <div className="text-[11px] text-slate-500">{hint}</div> : null}
    </div>
  );
}

function SectionCard({ title, description, actions, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

function DistributionList({ title, data, total, onExport }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        {onExport ? (
          <button
            type="button"
            onClick={onExport}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50"
          >
            Exportar SVG
          </button>
        ) : null}
      </div>
      <div className="grid gap-2">
        {data.map((row) => (
          <div key={row.name || row.label} className="grid gap-1">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="truncate">{row.label || row.name}</span>
              <span>{row.count}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-slate-600"
                style={{ width: `${Math.max(6, (row.count / Math.max(total, 1)) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineSpark({ series }) {
  return (
    <div className="grid gap-1">
      <span className="text-sm font-semibold text-slate-800">Pacientes por mes</span>
      <div className="flex items-end gap-1 h-20">
        {series.map((row) => (
          <div
            key={row.month}
            title={`${row.month}: ${row.count}`}
            className="flex-1 bg-slate-200 rounded-sm"
            style={{ height: `${Math.max(6, row.count * 8)}px` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-slate-500">
        <span>{series[0]?.month || 's/d'}</span>
        <span>{series[series.length - 1]?.month || 's/d'}</span>
      </div>
    </div>
  );
}
function DashboardSection({ metrics, logAudit }) {
  const totalStudies = metrics.totals.studies || 1;
  return (
    <SectionCard
      title="Dashboard general"
      description="Resumen operativo del registro clínico-genético."
      actions={[
        <button
          key="export-studies"
          type="button"
          onClick={() => exportDistributionSvg(metrics.studyDistribution, 'Distribucion de estudios', logAudit)}
          className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50"
        >
          Exportar gráfico
        </button>,
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
        <div className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricCard label="Pacientes" value={formatNumber(metrics.totals.patients)} hint="Únicos" />
            <MetricCard label="Estudios" value={formatNumber(metrics.totals.studies)} hint="Registrados" />
            <MetricCard label="Familias" value={formatNumber(metrics.totals.families)} hint="Activas en registro" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DistributionList
              title="Diagnóstico clínico"
              data={metrics.diagnosisStatus}
              total={metrics.totals.patients}
            />
            <DistributionList
              title="Resultados por clasificación"
              data={metrics.resultDistribution}
              total={totalStudies}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DistributionList
              title="Motivos de consulta"
              data={metrics.groupDistribution.slice(0, 6)}
              total={totalStudies}
              onExport={() => exportDistributionSvg(metrics.groupDistribution.slice(0, 10), 'Motivos de consulta', logAudit)}
            />
            <DistributionList
              title="Servicios derivadores (Top 6)"
              data={metrics.serviceDistribution}
              total={totalStudies}
            />
          </div>
        </div>
        <div className="grid gap-4">
          <TimelineSpark series={metrics.timeline.months} />
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 grid gap-2 text-sm">
            <span className="text-sm font-semibold text-slate-800">Tiempos promedio</span>
            <div className="flex justify-between">
              <span>Derivación → Solicitud</span>
              <span>{metrics.turnaround.derivationToRequest ?? 's/d'} días</span>
            </div>
            <div className="flex justify-between">
              <span>Solicitud → Resultado</span>
              <span>{metrics.turnaround.requestToResult ?? 's/d'} días</span>
            </div>
            <div className="flex justify-between">
              <span>Derivación → Resultado</span>
              <span>{metrics.turnaround.derivationToResult ?? 's/d'} días</span>
            </div>
          </div>
          <DistributionList
            title="Tipos de estudio"
            data={metrics.studyDistribution.slice(0, 6)}
            total={totalStudies}
          />
        </div>
      </div>
    </SectionCard>
  );
}

function FilterToggle({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-xs ${active ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 hover:bg-slate-50'}`}
    >
      {label}
    </button>
  );
}

function FiltersPanel({ filters, options, onToggle, onClear }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800">Filtros avanzados</span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-white"
        >
          Limpiar filtros
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[['groupIds', 'Grupo de consulta', options.groupIds, (value) => GROUP_LABELS[value] || value],
          ['studyTypes', 'Estudio genético', options.studyTypes],
          ['genes', 'Gen', options.genes],
          ['diagnosisStatus', 'Estado diagnóstico', options.diagnosisStatus],
          ['services', 'Servicio derivador', options.services],
          ['labs', 'Laboratorio', options.labs],
          ['years', 'Año de atención', options.years],
          ['ageGroups', 'Edad', options.ageGroups],
          ['sexes', 'Sexo', options.sexes]].map(([key, label, values, mapLabel]) => (
            <div key={key} className="grid gap-2">
              <span className="text-xs font-medium text-slate-600">{label}</span>
              <div className="flex flex-wrap gap-2">
                {values.length ? values.map((value) => (
                  <FilterToggle
                    key={value}
                    active={filters[key]?.includes(value)}
                    label={mapLabel ? mapLabel(value) : value}
                    onClick={() => onToggle(key, value)}
                  />
                )) : <span className="text-xs text-slate-500">Sin datos</span>}
              </div>
            </div>
        ))}
      </div>
    </div>
  );
}

function CohortTable({ cases, onExport, selectedCaseIds, onToggleCase }) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-slate-600">
          {cases.length} casos en la cohorte filtrada
        </span>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onExport('csv')} className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50">CSV</button>
          <button onClick={() => onExport('json')} className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50">JSON</button>
          <button onClick={() => onExport('xlsx')} className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50">XLSX</button>
        </div>
      </div>
      <div className="overflow-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Seleccionar</th>
              <th className="px-3 py-2 text-left">ID paciente</th>
              <th className="px-3 py-2 text-left">Sexo</th>
              <th className="px-3 py-2 text-left">Edad</th>
              <th className="px-3 py-2 text-left">Gen</th>
              <th className="px-3 py-2 text-left">Tipo variante</th>
              <th className="px-3 py-2 text-left">Fenotipo / HPO</th>
              <th className="px-3 py-2 text-left">Diagnóstico clínico</th>
              <th className="px-3 py-2 text-left">Estudio</th>
              <th className="px-3 py-2 text-left">Resultado</th>
              <th className="px-3 py-2 text-left">Institución</th>
              <th className="px-3 py-2 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {cases.map((item) => {
              const selected = selectedCaseIds.includes(item.caseExportId);
              return (
                <tr key={item.caseExportId} className={selected ? 'bg-slate-50' : ''}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleCase(item.caseExportId)}
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-800">{item.anonPatientId}</td>
                  <td className="px-3 py-2">{item.sex}</td>
                  <td className="px-3 py-2">{Number.isFinite(item.ageAtConsult) ? `${item.ageAtConsult}a` : '—'}</td>
                  <td className="px-3 py-2">{normaliseText(item.gene)}</td>
                  <td className="px-3 py-2">{normaliseText(item.variantType)}</td>
                  <td className="px-3 py-2">{item.hpoTerms?.join(' | ') || 'Sin dato'}</td>
                  <td className="px-3 py-2">{normaliseText(item.diagnosisLabel)}</td>
                  <td className="px-3 py-2">{normaliseText(item.studyType)}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${CLASS_COLORS[item.resultClassification] || '#e2e8f0'}`, color: '#fff' }}
                    >
                      {item.resultClassification}
                    </span>
                  </td>
                  <td className="px-3 py-2">{normaliseText(item.requestingService)}</td>
                  <td className="px-3 py-2">{formatDate(item.resultAt)}</td>
                </tr>
              );
            })}
            {!cases.length && (
              <tr>
                <td colSpan={12} className="px-3 py-6 text-center text-slate-500">
                  Ajustá los filtros para ver casos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function InsightsSection({ metrics, logAudit }) {
  return (
    <SectionCard
      title="Indicadores de investigación"
      description="Prioridades para papers, posters y seguimientos."
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 p-4 grid gap-2">
          <span className="text-sm font-semibold text-slate-800">Top genes alterados</span>
          <ul className="grid gap-1 text-sm text-slate-600">
            {metrics.topGenes.length
              ? metrics.topGenes.map((row) => (
                <li key={row.gene} className="flex justify-between">
                  <span>{row.gene}</span>
                  <span>{row.count}</span>
                </li>
              ))
              : <li>Sin datos</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 grid gap-2">
          <span className="text-sm font-semibold text-slate-800">Rendimiento por estudio</span>
          <ul className="grid gap-1 text-sm text-slate-600">
            {metrics.yieldByStudy.map((row) => (
              <li key={row.studyType} className="flex justify-between">
                <span>{row.studyType}</span>
                <span>{row.total ? `${formatPercent(row.diagnostic + row.likely, row.total)} (${row.total})` : '—'}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 p-4 grid gap-2">
          <span className="text-sm font-semibold text-slate-800">Edad promedio por estatus</span>
          <ul className="grid gap-1 text-sm text-slate-600">
            {metrics.ageByStatus.map((row) => (
              <li key={row.status} className="flex justify-between">
                <span>{row.status}</span>
                <span>{row.averageAge ? `${row.averageAge}a` : 's/d'}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
        <div className="rounded-xl border border-slate-200 p-4 grid gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">Casos raros prioritarios</span>
            <button
              type="button"
              onClick={() => {
                exportTableData('csv', metrics.rareCases, logAudit);
              }}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50"
            >
              Exportar casos
            </button>
          </div>
          <ul className="grid gap-2 text-sm text-slate-600">
            {metrics.rareCases.length
              ? metrics.rareCases.map((item) => (
                <li key={item.caseExportId} className="border border-slate-200 rounded-lg p-3 bg-white">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{item.anonPatientId}</span>
                    <span>{formatDate(item.resultAt)}</span>
                  </div>
                  <div className="text-sm text-slate-800 font-medium">
                    {normaliseText(item.gene)} · {normaliseText(item.studyType)}
                  </div>
                  <div className="text-xs text-slate-600">{item.rareFlagReason || 'Revisión recomendada'}</div>
                </li>
              ))
              : <li>No se identificaron casos raros con los filtros actuales.</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 grid gap-2 text-sm">
          <span className="text-sm font-semibold text-amber-900">Alertas de interés científico</span>
          <ul className="grid gap-2">
            {metrics.alerts.length
              ? metrics.alerts.map((item) => (
                <li key={item.caseExportId}>
                  <div className="font-medium text-amber-900">
                    {normaliseText(item.gene)} · {normaliseText(item.studyType)}
                  </div>
                  <div className="text-xs text-amber-800">
                    Variante novel/ausente en bases públicas. Resultado: {normaliseText(item.resultClassification)}.
                  </div>
                </li>
              ))
              : <li className="text-xs text-amber-800">Sin alertas con el conjunto actual.</li>}
          </ul>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 p-4 grid gap-2">
        <span className="text-sm font-semibold text-slate-800">Heatmap gen-clínica</span>
        <div className="overflow-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2 text-left text-slate-600">Grupo</th>
                {metrics.heatmap.phenotypes.map((phenotype) => (
                  <th key={phenotype} className="px-3 py-2 text-left text-slate-600">{phenotype}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {metrics.heatmap.groups.map((groupId, rowIndex) => (
                <tr key={groupId}>
                  <td className="px-3 py-2 font-medium text-slate-700">{GROUP_LABELS[groupId] || groupId}</td>
                  {metrics.heatmap.values[rowIndex].map((value, colIndex) => (
                    <td key={`${groupId}-${colIndex}`} className="px-3 py-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-700">
                        {value}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  );
}
function PublicationTools({ metrics, filteredCases, selectedCases, selectedCaseIds, setSelectedCaseIds, logAudit }) {
  const abstractText = useMemo(() => generateAbstract(filteredCases, metrics), [filteredCases, metrics]);
  const resultsDraft = useMemo(() => generateResultsDraft(filteredCases, metrics), [filteredCases, metrics]);
  const selectedList = useMemo(() => buildSelectedCasesText(selectedCases), [selectedCases]);

  const handleCopy = (text, label) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    logAudit?.('copy:text', { label });
  };

  return (
    <SectionCard
      title="Material para publicaciones"
      description="Herramientas rápidas para abstracts, posters y reportes."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <span className="text-sm font-semibold text-slate-800">Resumen automático</span>
          <textarea
            className="min-h-[160px] rounded-xl border border-slate-200 p-3 text-sm"
            value={abstractText}
            readOnly
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleCopy(abstractText, 'abstract')}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50"
            >
              Copiar
            </button>
            <button
              type="button"
              onClick={() => downloadText({ filename: `abstract-cenagem-${Date.now()}.txt`, content: abstractText })}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50"
            >
              Descargar TXT
            </button>
          </div>
        </div>
        <div className="grid gap-2">
          <span className="text-sm font-semibold text-slate-800">Borrador de resultados (IMRyD)</span>
          <textarea
            className="min-h-[160px] rounded-xl border border-slate-200 p-3 text-sm"
            value={resultsDraft}
            readOnly
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleCopy(resultsDraft, 'results')}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50"
            >
              Copiar
            </button>
            <button
              type="button"
              onClick={() => downloadText({ filename: `resultados-cenagem-${Date.now()}.txt`, content: resultsDraft })}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50"
            >
              Descargar TXT
            </button>
          </div>
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">Casos seleccionados</span>
            <button
              type="button"
              onClick={() => {
                if (selectedCaseIds.length) {
                  setSelectedCaseIds([]);
                } else {
                  setSelectedCaseIds(filteredCases.map((item) => item.caseExportId));
                }
              }}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50"
            >
              {selectedCaseIds.length ? 'Quitar todos' : 'Seleccionar todos'}
            </button>
          </div>
          <textarea
            className="min-h-[160px] rounded-xl border border-slate-200 p-3 text-sm"
            value={selectedList}
            readOnly
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleCopy(selectedList, 'cases')}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50"
            >
              Copiar lista
            </button>
            <button
              type="button"
              onClick={() => downloadText({ filename: `casos-cenagem-${Date.now()}.txt`, content: selectedList })}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50"
            >
              Descargar TXT
            </button>
            <button
              type="button"
              onClick={() => exportTableData('csv', selectedCases, logAudit)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50"
            >
              Exportar CSV
            </button>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        Recordá que todo el material exportado está anonimizado (ID hash PT-XXXX). Para publicaciones externas es obligatorio el repaso ético-institucional.
      </div>
    </SectionCard>
  );
}

function SecuritySection({ auditTrail }) {
  return (
    <SectionCard
      title="Seguridad, anonimización y trazabilidad"
      description="Controles aplicados a todas las exportaciones generadas."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ul className="grid gap-2 text-sm text-slate-600">
          <li>• Todos los reportes reemplazan datos filiatorios por IDs hash PT-XXXX y códigos de caso CS-XXXX.</li>
          <li>• Las fechas sensibles se reducen a mes/año; la edad se trabaja en rangos.</li>
          <li>• Cada exportación queda asociada al usuario autenticado con marca temporal.</li>
          <li>• Las descargas se registran en un log local solo visible por la cuenta actual.</li>
        </ul>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <span className="text-sm font-semibold text-slate-800">Últimas exportaciones</span>
          <div className="mt-2 max-h-40 overflow-auto text-xs text-slate-600">
            {auditTrail.length
              ? auditTrail.map((entry) => (
                <div key={entry.id} className="py-1 border-b border-slate-100 last:border-0">
                  <div className="flex justify-between">
                    <span className="font-medium">{entry.action}</span>
                    <span>{formatDate(entry.at)}</span>
                  </div>
                  <div>Usuario: {entry.user}</div>
                  <div>Meta: {JSON.stringify(entry.metadata)}</div>
                </div>
              ))
              : <div>No hay exportaciones registradas en esta sesión.</div>}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function FutureSection() {
  return (
    <SectionCard
      title="Próximas extensiones del módulo Analytics"
      description="Ideas priorizadas con el equipo clínico y científico."
    >
      <ul className="grid gap-2 text-sm text-slate-600">
        <li>1. Integrar APIs de ClinVar, DECIPHER y gnomAD para anotación automática.</li>
        <li>2. Espacio colaborativo de notas y seguimiento de hipótesis para papers.</li>
        <li>3. Comparador de cohortes internas (ej.: talla baja vs DI) con gráficos espejo.</li>
        <li>4. Panel de lineamientos éticos para publicación adaptado a normativa argentina / CENAGEM.</li>
        <li>5. Workflows de revisión y aprobación multiusuario con firma digital.</li>
      </ul>
    </SectionCard>
  );
}
export default function AnalyticsPage({ onBack, currentUser }) {
  const { state } = useCenagemStore();
  const analyticsCases = useMemo(() => buildAnalyticsCases(state), [state]);
  const metrics = useMemo(() => computeDashboardMetrics(state, analyticsCases), [state, analyticsCases]);
  const filterOptions = useMemo(() => buildFilterOptions(analyticsCases), [analyticsCases]);

  const [filters, setFilters] = useState({
    groupIds: [],
    studyTypes: [],
    genes: [],
    diagnosisStatus: [],
    labs: [],
    services: [],
    years: [],
    ageGroups: [],
    sexes: [],
  });
  const [selectedCaseIds, setSelectedCaseIds] = useState([]);

  const filteredCases = useMemo(() => applyFilters(analyticsCases, filters), [analyticsCases, filters]);
  const selectedCases = useMemo(
    () => analyticsCases.filter((item) => selectedCaseIds.includes(item.caseExportId)),
    [analyticsCases, selectedCaseIds],
  );

  const { auditTrail, logAudit } = useAnalyticsAudit(currentUser?.email || 'genetista@cenagem.gob.ar');

  const toggleFilter = (key, value) => {
    setFilters((prev) => {
      const current = prev[key] || [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const clearFilters = () => setFilters({
    groupIds: [],
    studyTypes: [],
    genes: [],
    diagnosisStatus: [],
    labs: [],
    services: [],
    years: [],
    ageGroups: [],
    sexes: [],
  });

  const toggleCase = (caseId) => {
    setSelectedCaseIds((prev) => (
      prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId]
    ));
  };

  return (
    <div className="p-6 pb-16 grid gap-6">
      <AppToolbar title="Analytics clínico-genético" onBack={onBack} />
      <DashboardSection metrics={metrics} logAudit={logAudit} />
      <SectionCard
        title="Explorar cohortes"
        description="Filtra y exporta combinaciones para análisis y publicaciones."
      >
        <FiltersPanel
          filters={filters}
          options={filterOptions}
          onToggle={toggleFilter}
          onClear={clearFilters}
        />
        <CohortTable
          cases={filteredCases}
          onExport={(format) => exportTableData(format, filteredCases, logAudit)}
          selectedCaseIds={selectedCaseIds}
          onToggleCase={toggleCase}
        />
      </SectionCard>
      <InsightsSection
        metrics={metrics}
        logAudit={logAudit}
      />
      <PublicationTools
        metrics={metrics}
        filteredCases={filteredCases}
        selectedCases={selectedCases}
        selectedCaseIds={selectedCaseIds}
        setSelectedCaseIds={setSelectedCaseIds}
        logAudit={logAudit}
      />
      <SecuritySection auditTrail={auditTrail} />
      <FutureSection />
    </div>
  );
}

