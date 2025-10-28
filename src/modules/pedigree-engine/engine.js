// src/modules/pedigree-engine/engine.js
import {
  normalizeState,
  normalizeIndividual,
  normalizeRelationship,
  normalizePregnancy,
  normalizeArt,
  normalizeLayout,
  normalizeLegend,
  normalizeMetadata,
  createEmptyState,
} from './normalize';
import { validateState } from './validators';

const UID = (prefix = '') =>
  `${prefix}${Math.random().toString(36).slice(2, 6)}${Date.now().toString(36).slice(-4)}`;
const clone = (value) =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

export class PedigreeEngine {
  constructor(initial = {}) {
    this._state = normalizeState(initial);
    this._history = [];
    this._future = [];
  }

  getState() {
    return this._state;
  }

  setState(next) {
    this._pushHistory();
    this._state = normalizeState(next);
    this._future = [];
    return this._state;
  }

  reset() {
    this._pushHistory();
    this._state = createEmptyState({ metadata: { ...this._state.metadata } });
    this._future = [];
    return this._state;
  }

  _pushHistory() {
    this._history.push(clone(this._state));
    if (this._history.length > 50) this._history.shift();
  }

  undo() {
    if (!this._history.length) return this._state;
    const prev = this._history.pop();
    this._future.push(this._state);
    this._state = prev;
    return this._state;
  }

  redo() {
    if (!this._future.length) return this._state;
    const next = this._future.pop();
    this._history.push(this._state);
    this._state = next;
    return this._state;
  }

  upsertIndividual(payload = {}) {
    const individual = normalizeIndividual(payload);
    if (!individual.id) individual.id = UID('I-');
    const exists = this._state.individuals.some((ind) => ind.id === individual.id);
    this._pushHistory();
    this._state = {
      ...this._state,
      individuals: exists
        ? this._state.individuals.map((ind) => (ind.id === individual.id ? { ...ind, ...individual } : ind))
        : [...this._state.individuals, individual],
      layout: this._ensureLayoutNode(individual.id, payload.pos || {}),
    };
    this._future = [];
    return individual.id;
  }

  removeIndividual(individualId) {
    if (!individualId) return;
    const exists = this._state.individuals.some((ind) => ind.id === individualId);
    if (!exists) return;
    this._pushHistory();
    this._state = {
      ...this._state,
      individuals: this._state.individuals.filter((ind) => ind.id !== individualId),
      relationships: this._state.relationships.filter((rel) => !usesIndividual(rel, individualId)),
      pregnancies: this._state.pregnancies.filter(
        (preg) => preg.mother !== individualId && preg.father !== individualId,
      ),
      layout: {
        nodes: this._state.layout.nodes.filter((node) => node.id !== individualId),
        edges: this._state.layout.edges.filter(
          (edge) => edge.from !== individualId && edge.to !== individualId,
        ),
      },
    };
    this._future = [];
  }

  upsertRelationship(payload = {}) {
    const relationship = normalizeRelationship(payload);
    this._pushHistory();
    const idx = this._state.relationships.findIndex((rel) => compareRelationship(rel, relationship));
    if (idx >= 0) {
      const nextRelationships = [...this._state.relationships];
      nextRelationships[idx] = { ...nextRelationships[idx], ...relationship };
      this._state = { ...this._state, relationships: nextRelationships };
    } else {
      this._state = { ...this._state, relationships: [...this._state.relationships, relationship] };
    }
    this._future = [];
  }

  removeRelationship(predicate) {
    if (!predicate) return;
    const fn = typeof predicate === 'function'
      ? predicate
      : (rel) => compareRelationship(rel, normalizeRelationship(predicate));
    this._pushHistory();
    this._state = {
      ...this._state,
      relationships: this._state.relationships.filter((rel) => !fn(rel)),
    };
    this._future = [];
  }

  upsertPregnancy(payload = {}) {
    const pregnancy = normalizePregnancy(payload);
    if (!pregnancy.id) pregnancy.id = UID('P-');
    this._pushHistory();
    const idx = this._state.pregnancies.findIndex((preg) => preg.id === pregnancy.id);
    const pregnancies = idx >= 0
      ? this._state.pregnancies.map((preg) => (preg.id === pregnancy.id ? { ...preg, ...pregnancy } : preg))
      : [...this._state.pregnancies, pregnancy];
    this._state = { ...this._state, pregnancies };
    this._future = [];
    return pregnancy.id;
  }

  removePregnancy(pregnancyId) {
    if (!pregnancyId) return;
    this._pushHistory();
    this._state = {
      ...this._state,
      pregnancies: this._state.pregnancies.filter((preg) => preg.id !== pregnancyId),
      art: this._state.art.filter((entry) => entry.relatedTo !== pregnancyId),
    };
    this._future = [];
  }

  upsertArt(payload = {}) {
    const artEntry = normalizeArt(payload);
    if (!artEntry.id) artEntry.id = UID('ART-');
    this._pushHistory();
    const idx = this._state.art.findIndex((item) => item.id === artEntry.id);
    const art = idx >= 0
      ? this._state.art.map((item) => (item.id === artEntry.id ? { ...item, ...artEntry } : item))
      : [...this._state.art, artEntry];
    this._state = { ...this._state, art };
    this._future = [];
    return artEntry.id;
  }

  removeArt(artId) {
    if (!artId) return;
    this._pushHistory();
    this._state = { ...this._state, art: this._state.art.filter((item) => item.id !== artId) };
    this._future = [];
  }

  updateMetadata(patch = {}) {
    this._pushHistory();
    this._state = { ...this._state, metadata: normalizeMetadata({ ...this._state.metadata, ...patch }) };
    this._future = [];
  }

  updateLegend(patch = {}) {
    this._pushHistory();
    this._state = { ...this._state, legend: normalizeLegend({ ...this._state.legend, ...patch }) };
    this._future = [];
  }

  updateLayout(patch = {}) {
    this._pushHistory();
    const layout = normalizeLayout({
      ...this._state.layout,
      nodes: mergeLayoutNodes(this._state.layout.nodes, patch.nodes),
      edges: mergeLayoutEdges(this._state.layout.edges, patch.edges),
    });
    this._state = { ...this._state, layout };
    this._future = [];
  }

  setNodePosition(id, pos) {
    if (!id) return;
    this._pushHistory();
    const nodes = mergeLayoutNodes(this._state.layout.nodes, [{ id, ...pos }]);
    this._state = { ...this._state, layout: { ...this._state.layout, nodes } };
    this._future = [];
  }

  validate() {
    return validateState(this._state);
  }

  toJSON() {
    return this._state;
  }

  toClinicalJSON() {
    const state = this._state;
    return JSON.parse(JSON.stringify(state));
  }

  computeLegendUsage() {
    const usage = new Set();
    stateIndividualsForLegend(this._state.individuals, usage);
    statePregnanciesForLegend(this._state.pregnancies, usage);
    return usage;
  }

  computePrivacyLabel(individual) {
    const privacy = this._state.metadata?.privacy || { names: 'initials', dates: 'year-only' };
    let name = '';
    if (privacy.names === 'initials') {
      const initials =
        individual?.filiatorios?.iniciales ||
        (individual?.notes || '')
          .split(/\s+/)
          .map((w) => (w ? w[0].toUpperCase() : ''))
          .join('');
      name = initials || individual?.id || '';
    } else {
      name = individual?.notes || individual?.id || '';
    }
    return name;
  }

  _ensureLayoutNode(id, pos) {
    if (!id) return this._state.layout;
    const exists = this._state.layout.nodes.some((node) => node.id === id);
    if (exists && !pos) return this._state.layout;
    const nodes = exists
      ? this._state.layout.nodes.map((node) => (node.id === id ? { ...node, ...pos } : node))
      : [...this._state.layout.nodes, { id, x: pos?.x ?? 0, y: pos?.y ?? 0 }];
    return { ...this._state.layout, nodes };
  }
}

function mergeLayoutNodes(current = [], updates = []) {
  if (!Array.isArray(updates) || !updates.length) return current;
  const map = new Map(current.map((node) => [node.id, { ...node }]));
  updates.forEach((node) => {
    if (!node || !node.id) return;
    map.set(node.id, {
      ...(map.get(node.id) || {}),
      x: Number.isFinite(node.x) ? node.x : (map.get(node.id)?.x ?? 0),
      y: Number.isFinite(node.y) ? node.y : (map.get(node.id)?.y ?? 0),
    });
  });
  return Array.from(map.values());
}

function mergeLayoutEdges(current = [], updates = []) {
  if (!Array.isArray(updates) || !updates.length) return current;
  const set = new Map(current.map((edge) => [edgeKey(edge), edge]));
  updates.forEach((edge) => {
    if (!edge || !edge.from || !edge.to || !edge.kind) return;
    set.set(edgeKey(edge), { ...edge });
  });
  return Array.from(set.values());
}

function edgeKey(edge) {
  return `${edge.kind}:${edge.from}->${edge.to}`;
}

function usesIndividual(rel, id) {
  if (rel.type === 'partner') return rel.a === id || rel.b === id;
  if (rel.type === 'parentChild') {
    return rel.father === id || rel.mother === id || rel.child === id;
  }
  return false;
}

function compareRelationship(a, b) {
  if (!a || !b || a.type !== b.type) return false;
  if (a.type === 'partner') {
    const setA = new Set([a.a, a.b]);
    return setA.has(b.a) && setA.has(b.b);
  }
  if (a.type === 'parentChild') {
    return a.child === b.child && a.mother === b.mother && a.father === b.father;
  }
  return false;
}

function stateIndividualsForLegend(individuals, usage) {
  (individuals || []).forEach((ind) => {
    if (ind.affected?.value) usage.add('filled');
    if (!ind.affected?.value && ind.carrier?.type === 'AR') usage.add('halfFilled');
    if (!ind.affected?.value && ind.carrier?.type === 'X') usage.add('dot');
    if (ind.sex === 'U') usage.add('diamond');
  });
}

function statePregnanciesForLegend(pregnancies, usage) {
  (pregnancies || []).forEach((preg) => {
    if (preg.outcome && preg.outcome !== 'Live') usage.add('triangle');
  });
}

export function createPedigreeEngine(initial) {
  return new PedigreeEngine(initial);
}
