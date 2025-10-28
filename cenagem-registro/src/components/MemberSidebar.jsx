import React, { useMemo, useState } from 'react';

function toStringValue(value) {
  if (value === null || value === undefined) return '';
  return `${value}`;
}

const normalizeReason = (reason) => {
  if (!reason) return '—';
  if (typeof reason === 'string') return reason;
  if (typeof reason === 'object') {
    return reason.detailLabel || reason.groupLabel || reason.label || JSON.stringify(reason);
  }
  return '—';
};

const normalizePrivacy = (privacy, key, fallback) => {
  if (!privacy || typeof privacy !== 'object') return fallback;
  const value = privacy[key];
  return typeof value === 'string' ? value : fallback;
};

export default function MemberSidebar({
  selectedId,
  individualsById,
  relationships = [],
  parentsMap = {},
  actions,
  metadata,
  onSelect,
}) {
  const individual = selectedId ? individualsById.get(selectedId) : null;
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [evaluationDraft, setEvaluationDraft] = useState({ code: '', desc: '', result: '' });

  const siblingParents = parentsMap[selectedId] || {};

  const children = useMemo(
    () =>
      relationships
        .filter((rel) => rel.type === 'parentChild' && rel.child && (rel.father === selectedId || rel.mother === selectedId))
        .map((rel) => individualsById.get(rel.child))
        .filter(Boolean),
    [relationships, selectedId, individualsById],
  );

  const partners = useMemo(() => {
    const list = [];
    const seen = new Set();
    (relationships || []).forEach((rel) => {
      if (rel.type !== 'partner') return;
      if (rel.a !== selectedId && rel.b !== selectedId) return;
      const partnerId = rel.a === selectedId ? rel.b : rel.a;
      if (!partnerId || seen.has(partnerId)) return;
      seen.add(partnerId);
      list.push({ id: partnerId, data: individualsById.get(partnerId) || null });
    });
    const fallbackId = individual?.parejaDe;
    if (fallbackId && !seen.has(fallbackId)) {
      seen.add(fallbackId);
      list.push({ id: fallbackId, data: individualsById.get(fallbackId) || null });
    }
    return list;
  }, [relationships, selectedId, individualsById, individual?.parejaDe]);

  const affectedDx = individual?.affected?.dx || [];
  const evaluations = individual?.evaluations || [];

  const updateIndividual = (patch) => {
    if (!selectedId) return;
    actions.updateIndividual(selectedId, patch);
  };

  const appendDiagnosis = () => {
    const value = diagnosisInput.trim();
    if (!value) return;
    updateIndividual({
      affected: {
        ...(individual?.affected || { value: false, dx: [] }),
        dx: [...affectedDx, value],
      },
    });
    setDiagnosisInput('');
  };

  const removeDiagnosis = (value) => {
    updateIndividual({
      affected: {
        ...(individual?.affected || { value: false, dx: [] }),
        dx: affectedDx.filter((item) => item !== value),
      },
    });
  };

  const upsertEvaluation = (index, patch) => {
    const next = evaluations.map((item, idx) =>
      idx === index ? { ...item, ...patch } : item,
    );
    updateIndividual({ evaluations: next });
  };

  const addEvaluation = () => {
    if (!evaluationDraft.code.trim()) return;
    updateIndividual({
      evaluations: [
        ...evaluations,
        {
          code: evaluationDraft.code.trim(),
          desc: evaluationDraft.desc.trim(),
          result: evaluationDraft.result.trim(),
        },
      ],
    });
    setEvaluationDraft({ code: '', desc: '', result: '' });
  };

  const removeEvaluation = (index) => {
    updateIndividual({
      evaluations: evaluations.filter((_, idx) => idx !== index),
    });
  };

  const handleAddParents = () => {
    if (!selectedId) return;
    if (siblingParents.padreId || siblingParents.madreId) {
      window.alert?.('Este miembro ya tiene padres registrados.');
      return;
    }
    actions.createParentsForChild(selectedId, { biological: true });
  };

  const handleAddSibling = () => {
    if (!selectedId) return;
    const parents = parentsMap[selectedId] || {};
    if (!parents.padreId && !parents.madreId) return;
    const siblingId = actions.createIndividual({});
    actions.linkParentChild({
      father: parents.padreId || null,
      mother: parents.madreId || null,
      child: siblingId,
      biological: true,
    });
    onSelect?.(siblingId);
  };

  const handleAddPartner = () => {
    if (!selectedId) return;
    const current = individualsById.get(selectedId);
    const partnerSex = current?.sex === 'M' ? 'F' : current?.sex === 'F' ? 'M' : 'U';
    const partnerId = actions.createIndividual({ sex: partnerSex });
    actions.linkPartner(selectedId, partnerId);
    onSelect?.(partnerId);
  };

  const handleAddChild = () => {
    if (!selectedId) return;
    const current = individualsById.get(selectedId);
    const childId = actions.createIndividual({});
    const partnerId = partners[0]?.id || null;
    const { fatherId, motherId } = resolveParentIdsLocal(individualsById, selectedId, partnerId);
    const payload = {
      child: childId,
      biological: true,
      father: fatherId || null,
      mother: motherId || null,
    };
    if (!payload.father && !payload.mother) {
      if (current?.sex === 'F') payload.mother = selectedId;
      else payload.father = selectedId;
    }
    actions.linkParentChild(payload);
    onSelect?.(childId);
  };

  const handleRemove = () => {
    if (!selectedId) return;
    const label = individual?.nombre || individual?.label || selectedId;
    const proceed = window.confirm(`Eliminar ${label} del pedigrí?`);
    if (!proceed) return;
    actions.removeIndividual(selectedId);
    onSelect?.('');
  };

  if (!selectedId || !individual) {
    return (
      <aside className="w-full lg:w-90">
        <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-auto border-l border-slate-200 bg-white p-4 text-sm text-slate-600">
          Seleccioná un miembro del pedigrí para editar su ficha clínica.
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-90">
      <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-auto border-l border-slate-200 bg-white px-4 py-5 text-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Miembro seleccionado</div>
            <div className="text-lg font-semibold text-slate-800">{individual.nombre || individual.label || individual.id}</div>
            <div className="text-xs text-slate-500">ID: {individual.id}</div>
          </div>
          <button
            type="button"
            className="px-3 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700"
            onClick={handleRemove}
          >
            Eliminar
          </button>
        </div>

        <section className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nombre (uso interno)</label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
              value={toStringValue(individual.nombre)}
              onChange={(event) => updateIndividual({ nombre: event.target.value })}
              placeholder="Iniciales o primer nombre"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Rol</label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
              value={toStringValue(individual.rol)}
              onChange={(event) => updateIndividual({ rol: event.target.value })}
              placeholder="Proband, Madre, Padre…"
            />
          </div>
          <div>
            <span className="block text-xs text-slate-500 mb-1">Sexo (NSGC)</span>
            <div className="flex gap-2">
              {[
                { value: 'M', label: 'Masculino' },
                { value: 'F', label: 'Femenino' },
                { value: 'U', label: 'No especificado' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-1 text-xs text-slate-600">
                  <input
                    type="radio"
                    name={`sex-${individual.id}`}
                    checked={individual.sex === option.value}
                    onChange={() => updateIndividual({ sex: option.value })}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 space-y-3">
          <h3 className="text-xs uppercase tracking-wide text-slate-500">Edad y vitalidad</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Edad (años)</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                value={toStringValue(individual.age)}
                onChange={(event) =>
                  updateIndividual({ age: event.target.value ? Number(event.target.value) : null })
                }
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Año de nacimiento</label>
              <input
                type="number"
                min="1800"
                max="2100"
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                value={toStringValue(individual.bornYear)}
                onChange={(event) =>
                  updateIndividual({
                    bornYear: event.target.value ? Number(event.target.value) : null,
                  })
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={!!individual.dead}
              onChange={(event) =>
                updateIndividual({
                  dead: event.target.checked,
                  deadInfo: { ...(individual.deadInfo || {}), note: individual.deadInfo?.note || '' },
                })
              }
            />
            Fallecido/a
          </label>
          {individual.dead && (
            <div className="grid grid-cols-2 gap-2">
              <input
                className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                placeholder="Año fallecimiento"
                value={toStringValue(individual.deadInfo?.year)}
                onChange={(event) =>
                  updateIndividual({
                    deadInfo: {
                      ...(individual.deadInfo || {}),
                      year: event.target.value ? Number(event.target.value) : null,
                    },
                  })
                }
              />
              <input
                className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                placeholder='Nota (ej: "d. 60s")'
                value={toStringValue(individual.deadInfo?.note)}
                onChange={(event) =>
                  updateIndividual({
                    deadInfo: {
                      ...(individual.deadInfo || {}),
                      note: event.target.value,
                    },
                  })
                }
              />
            </div>
          )}
        </section>

        <section className="mt-6 space-y-3">
          <h3 className="text-xs uppercase tracking-wide text-slate-500">Estado clínico</h3>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={!!individual.affected?.value}
              onChange={(event) =>
                updateIndividual({
                  affected: {
                    ...(individual.affected || { dx: [] }),
                    value: event.target.checked,
                  },
                })
              }
            />
            Afectado/a clínicamente
          </label>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Diagnósticos (dx)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {affectedDx.map((dx) => (
                <span
                  key={dx}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-700"
                >
                  {dx}
                  <button type="button" onClick={() => removeDiagnosis(dx)} className="text-slate-500 hover:text-slate-800">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300"
                value={diagnosisInput}
                onChange={(event) => setDiagnosisInput(event.target.value)}
                placeholder="Añadir dx…"
              />
              <button
                type="button"
                className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100"
                onClick={appendDiagnosis}
              >
                + dx
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Condición de portador</label>
            <select
              className="w-full px-3 py-2 rounded-xl border border-slate-300"
              value={individual.carrier?.type || 'none'}
              onChange={(event) =>
                updateIndividual({
                  carrier: {
                    ...(individual.carrier || { evidence: 'unknown' }),
                    type: event.target.value,
                  },
                })
              }
            >
              <option value="none">Sin datos</option>
              <option value="AR">Portador autosómico recesivo</option>
              <option value="X">Portador ligado al X</option>
            </select>
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <h3 className="text-xs uppercase tracking-wide text-slate-500">Evaluaciones (E1, E2…)</h3>
          <div className="space-y-2">
            {evaluations.map((evaluation, index) => (
              <div key={`${evaluation.code}-${index}`} className="rounded-xl border border-slate-200 p-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    className="w-20 px-2 py-1 rounded-lg border border-slate-300 text-xs"
                    value={toStringValue(evaluation.code)}
                    onChange={(event) => upsertEvaluation(index, { code: event.target.value })}
                    placeholder="E1"
                  />
                  <input
                    className="flex-1 px-2 py-1 rounded-lg border border-slate-300 text-xs"
                    value={toStringValue(evaluation.desc)}
                    onChange={(event) => upsertEvaluation(index, { desc: event.target.value })}
                    placeholder="Descripción"
                  />
                  <input
                    className="w-20 px-2 py-1 rounded-lg border border-slate-300 text-xs"
                    value={toStringValue(evaluation.result)}
                    onChange={(event) => upsertEvaluation(index, { result: event.target.value })}
                    placeholder="+/-"
                  />
                  <button
                    type="button"
                    className="text-xs text-rose-600 hover:text-rose-800"
                    onClick={() => removeEvaluation(index)}
                  >
                    eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[80px_1fr_80px_auto] gap-2">
            <input
              className="px-2 py-1 rounded-lg border border-slate-300 text-xs"
              placeholder="E3"
              value={evaluationDraft.code}
              onChange={(event) => setEvaluationDraft((prev) => ({ ...prev, code: event.target.value }))}
            />
            <input
              className="px-2 py-1 rounded-lg border border-slate-300 text-xs"
              placeholder="Estudio"
              value={evaluationDraft.desc}
              onChange={(event) => setEvaluationDraft((prev) => ({ ...prev, desc: event.target.value }))}
            />
            <input
              className="px-2 py-1 rounded-lg border border-slate-300 text-xs"
              placeholder="+/-"
              value={evaluationDraft.result}
              onChange={(event) => setEvaluationDraft((prev) => ({ ...prev, result: event.target.value }))}
            />
            <button
              type="button"
              className="px-3 py-1 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs"
              onClick={addEvaluation}
            >
              + E
            </button>
          </div>
        </section>

        <section className="mt-6 space-y-3">
          <h3 className="text-xs uppercase tracking-wide text-slate-500">Relaciones</h3>
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <button
              type="button"
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
              disabled={siblingParents.padreId || siblingParents.madreId}
              onClick={handleAddParents}
            >
              + Padres
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100"
              onClick={handleAddSibling}
            >
              + Hermano/a
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100"
              onClick={handleAddPartner}
            >
              + Pareja
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100"
              onClick={handleAddChild}
            >
              + Hijo/a
            </button>
        </div>
        <div className="text-xs text-slate-500">
            Partners: {partners.length
              ? partners
                  .map(({ id, data }) => data?.nombre || data?.label || id)
                  .join(', ')
              : '—'}
          </div>
          <div className="text-xs text-slate-500">
            Hijos/as: {children.length ? children.map((c) => c?.nombre || c?.label || c?.id).join(', ') : '—'}
          </div>
        </section>

        <section className="mt-6 space-y-1 text-xs text-slate-500">
          <div>
            Privacidad: {normalizePrivacy(metadata?.privacy, 'names', 'initials')} nombres ·{' '}
            {normalizePrivacy(metadata?.privacy, 'dates', 'year-only')} fechas.
          </div>
          <div>Motivo: {normalizeReason(metadata?.reason)}.</div>
        </section>
      </div>
    </aside>
  );
}

function resolveParentIdsLocal(individualsById, primaryId, partnerId) {
  const result = { fatherId: null, motherId: null };
  const assign = (personId) => {
    if (!personId) return;
    const person = individualsById.get(personId);
    const sex = (person?.sex || '').toUpperCase();
    if (sex === 'M' && !result.fatherId) {
      result.fatherId = personId;
      return;
    }
    if (sex === 'F' && !result.motherId) {
      result.motherId = personId;
      return;
    }
    if (!result.fatherId) {
      result.fatherId = personId;
    } else if (!result.motherId && personId !== result.fatherId) {
      result.motherId = personId;
    }
  };
  assign(primaryId);
  assign(partnerId);
  return result;
}
