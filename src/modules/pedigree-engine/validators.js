// src/modules/pedigree-engine/validators.js
// Reglas clínicas NSGC 2008 (operational summary). Devuelve errores y sugerencias.

const PREGNANCY_OUTCOMES = ['SAB', 'TOP', 'ECT', 'SB', 'Live'];

export function validateState(state) {
  const errors = [];
  const warnings = [];
  const suggestions = [];

  const individuals = state.individuals || [];
  const relationships = state.relationships || [];
  const pregnancies = state.pregnancies || [];
  const art = state.art || [];

  const idSet = new Set();
  individuals.forEach((ind) => {
    if (!ind.id) {
      errors.push({
        code: 'INDI_NO_ID',
        level: 'error',
        message: 'Cada individuo necesita un identificador único.',
      });
      return;
    }
    if (idSet.has(ind.id)) {
      errors.push({
        code: 'INDI_DUP_ID',
        level: 'error',
        message: `El identificador ${ind.id} está repetido.`,
        path: ['individuals', ind.id],
      });
    } else {
      idSet.add(ind.id);
    }
    if (!['M', 'F', 'U'].includes(ind.sex)) {
      errors.push({
        code: 'INDI_SEX_INVALID',
        level: 'error',
        message: `El sexo de ${ind.id} debe ser M, F o U (rombo).`,
        path: ['individuals', ind.id, 'sex'],
      });
    }
    if (ind.dead && ind.deadInfo) {
      const hasYear = Number.isFinite(ind.deadInfo.year);
      const note = (ind.deadInfo.note || '').trim();
      if (!hasYear && !note) {
        warnings.push({
          code: 'INDI_DEAD_INFO',
          level: 'warning',
          message: `Agregar año o nota de fallecimiento para ${labelFor(ind)} (usar formato "d. 2007" o "d. 60s").`,
          path: ['individuals', ind.id, 'deadInfo'],
        });
      } else if (note && !note.toLowerCase().startsWith('d.')) {
        suggestions.push({
          code: 'INDI_DEAD_NOTE',
          level: 'suggestion',
          message: `Usar prefijo "d." en la nota de fallecimiento de ${labelFor(ind)}.`,
          path: ['individuals', ind.id, 'deadInfo', 'note'],
          fix: { note: `d. ${note}` },
        });
      }
    }
    if (ind.affected?.value && (!ind.affected.dx || ind.affected.dx.length === 0)) {
      warnings.push({
        code: 'INDI_AFFECTED_NO_DX',
        level: 'warning',
        message: `Registrar diagnóstico para ${labelFor(ind)} (está marcado/a como afectado/a).`,
        path: ['individuals', ind.id, 'affected'],
      });
    }
    if (!ind.affected?.value && ind.carrier?.type === 'none' && ind.evaluations?.some((ev) => /^E\d+/i.test(ev.code))) {
      suggestions.push({
        code: 'INDI_EVAL_SUMMARY',
        level: 'suggestion',
        message: `Considera marcar resultado (E±) para ${labelFor(ind)} según evaluaciones registradas.`,
        path: ['individuals', ind.id, 'evaluations'],
      });
    }
  });

  const ensureIndividual = (id, context) => {
    if (!idSet.has(id)) {
      errors.push({
        code: 'REF_MISSING',
        level: 'error',
        message: `El miembro ${id} usado en ${context} no existe.`,
      });
      return false;
    }
    return true;
  };

  relationships.forEach((rel, idx) => {
    if (rel.type === 'partner') {
      if (!rel.a || !rel.b) {
        errors.push({
          code: 'REL_PARTNER_INCOMPLETE',
          level: 'error',
          message: `Relación de pareja #${idx + 1} necesita dos integrantes.`,
        });
        return;
      }
      ensureIndividual(rel.a, 'relación de pareja');
      ensureIndividual(rel.b, 'relación de pareja');
    } else if (rel.type === 'parentChild') {
      if (!rel.child) {
        errors.push({
          code: 'REL_CHILD_NO_CHILD',
          level: 'error',
          message: `Relación padre/madre-hijo #${idx + 1} requiere hijo/a.`,
        });
      } else {
        ensureIndividual(rel.child, 'relación ascendencia');
      }
      if (rel.father) ensureIndividual(rel.father, 'relación ascendencia (padre)');
      if (rel.mother) ensureIndividual(rel.mother, 'relación ascendencia (madre)');
      if (!rel.father && !rel.mother) {
        warnings.push({
          code: 'REL_CHILD_NO_PARENTS',
          level: 'warning',
          message: `Completar al menos un progenitor para ${rel.child}.`,
        });
      }
      if (rel.biological === false && !rel.adoptive) {
        suggestions.push({
          code: 'REL_ADOPTION_NOTE',
          level: 'suggestion',
          message: `Marcar adopción / vínculo no biológico para ${rel.child}.`,
        });
      }
    }
  });

  pregnancies.forEach((preg) => {
    if (!preg.id) return;
    if (!PREGNANCY_OUTCOMES.includes(preg.outcome)) {
      errors.push({
        code: 'PREG_OUTCOME_INVALID',
        level: 'error',
        message: `El embarazo ${preg.id} tiene outcome inválido (${preg.outcome}).`,
        path: ['pregnancies', preg.id, 'outcome'],
      });
    }
    if (preg.mother) ensureIndividual(preg.mother, `embarazo ${preg.id} (madre)`);
    if (preg.father) ensureIndividual(preg.father, `embarazo ${preg.id} (padre)`);
    if (preg.outcome !== 'Live' && !preg.karyotype && !preg.affected) {
      suggestions.push({
        code: 'PREG_NOTE_SUGGEST',
        level: 'suggestion',
        message: `Agregar nota de hallazgo (karyotipo o afectación) para embarazo no a término ${preg.id}.`,
      });
    }
  });

  art.forEach((entry) => {
    if (!entry.relatedTo) {
      warnings.push({
        code: 'ART_NO_PREG',
        level: 'warning',
        message: `El registro ART ${entry.id} debe vincular un embarazo.`,
      });
    } else if (!pregnancies.some((preg) => preg.id === entry.relatedTo)) {
      errors.push({
        code: 'ART_PREG_MISSING',
        level: 'error',
        message: `El registro ART ${entry.id} apunta a un embarazo inexistente (${entry.relatedTo}).`,
      });
    }
  });

  if (!state.metadata?.reason) {
    warnings.push({
      code: 'META_REASON_EMPTY',
      level: 'warning',
      message: 'Agregar motivo de consulta en metadatos del pedigrí.',
      path: ['metadata', 'reason'],
    });
  }

  return { errors, warnings, suggestions };
}

function labelFor(individual) {
  const parts = [];
  if (individual?.id) parts.push(individual.id);
  if (individual?.notes) {
    const nickname = typeof individual.notes === 'string' ? individual.notes : '';
    if (nickname) parts.push(`(${nickname})`);
  }
  return parts.join(' ');
}

export function summarizeValidation(report) {
  return [
    ...(report.errors || []),
    ...(report.warnings || []),
    ...(report.suggestions || []),
  ];
}

