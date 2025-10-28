// src/lib/pedigreeStorage.js
import { createEmptyState, normalizeState } from '../modules/pedigree-engine';

const KEY = (familyId) => `cenagem-tree:v2:${familyId}`;

export function loadTree(familyId) {
  if (!familyId) return { engineState: createEmptyState() };
  try {
    const raw = localStorage.getItem(KEY(familyId));
    if (!raw) return { engineState: createEmptyState() };
    const data = JSON.parse(raw);
    if (data && data.engineState) {
      return { engineState: normalizeState(data.engineState) };
    }
    // backward compatibility con formato antiguo
    return { engineState: legacyToEngine(data) };
  } catch {
    return { engineState: createEmptyState() };
  }
}

export function saveTree(familyId, data) {
  if (!familyId) return;
  try {
    const state = normalizeState(data?.engineState || data);
    const safe = { engineState: state };
    localStorage.setItem(KEY(familyId), JSON.stringify(safe));
  } catch {}
}

export function listenTree(familyId, onChange) {
  const handler = (e) => {
    if (e.key === KEY(familyId)) {
      try {
        const parsed = e.newValue ? JSON.parse(e.newValue) : null;
        onChange(parsed?.engineState ? normalizeState(parsed.engineState) : createEmptyState());
      } catch {}
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

function legacyToEngine(data = {}) {
  if (!data || typeof data !== 'object') return createEmptyState();
  const members = Array.isArray(data.members) ? data.members : [];
  const pedigree = data.pedigree || {};
  const individuals = members.map((member, index) => ({
    id: member.id || `I-${index + 1}`,
    sex: member.sexo === 'M' ? 'M' : member.sexo === 'F' ? 'F' : 'U',
    bornYear: member.nacimiento ? new Date(member.nacimiento).getFullYear() : null,
    age: member.edadCalculada ?? null,
    dead: member.estado === 'fallecido',
    deadInfo: { year: member.fallecido?.year ?? null, note: null },
    affected: { value: !!member.afectado, dx: member.diagnostico ? [member.diagnostico] : [] },
    carrier: { type: member.portador || 'none', evidence: 'unknown' },
    evaluations: [],
    notes: member.notas || '',
    ancestry: { maternal: null, paternal: null },
  }));
  const relationships = Object.entries(pedigree).map(([childId, links]) => ({
    type: 'parentChild',
    father: links.padreId || null,
    mother: links.madreId || null,
    child: childId,
    biological: true,
    adoptive: false,
  }));
  return normalizeState({
    individuals,
    relationships,
  });
}
