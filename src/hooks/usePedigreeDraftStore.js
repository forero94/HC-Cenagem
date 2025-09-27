// src/hooks/usePedigreeDraftStore.js
import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_NS = 'pedigree-sandbox/v1';

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);

function readSandbox(familyId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_NS}/${familyId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { draftMembers: [], draftPedigree: {} };
}

function writeSandbox(familyId, payload) {
  try {
    localStorage.setItem(`${STORAGE_NS}/${familyId}`, JSON.stringify(payload));
  } catch {}
}

export default function usePedigreeDraftStore(familyId, basePedigree, membersFromHC) {
  const safeFamilyId = familyId || 'no-family';
  const [draftMembers, setDraftMembers] = useState([]);
  const [draftPedigree, setDraftPedigree] = useState({});

  // cargar sandbox al montar o cuando cambia la familia
  useEffect(() => {
    const { draftMembers, draftPedigree } = readSandbox(safeFamilyId);
    setDraftMembers(Array.isArray(draftMembers) ? draftMembers : []);
    setDraftPedigree(draftPedigree && typeof draftPedigree === 'object' ? draftPedigree : {});
  }, [safeFamilyId]);

  // persistir en storage
  useEffect(() => {
    writeSandbox(safeFamilyId, { draftMembers, draftPedigree });
  }, [safeFamilyId, draftMembers, draftPedigree]);

  const mergedMembers = useMemo(
    () => [...(membersFromHC || []), ...(draftMembers || [])],
    [membersFromHC, draftMembers]
  );

  const mergedPedigree = useMemo(() => {
    return { ...(basePedigree || {}), ...(draftPedigree || {}) };
  }, [basePedigree, draftPedigree]);

  const setParentDraft = useCallback((childId, parentType, parentId) => {
    setDraftPedigree(prev => {
      const node = { ...(prev[childId] || {}) };
      node[parentType] = parentId || '';
      return { ...prev, [childId]: node };
    });
  }, []);

  // crea un miembro placeholder
  const newMember = useCallback((overrides = {}) => {
    return {
      id: uid(),
      familyId: safeFamilyId,
      nombre: overrides.nombre ?? '—',
      sexo: overrides.sexo ?? '',
      simbolo: overrides.simbolo ?? 'auto',
      nacimiento: overrides.nacimiento ?? '',
      rol: overrides.rol ?? '',
      filiatorios: overrides.filiatorios ?? {},
      estado: overrides.estado ?? 'vivo',
      notas: [],
      ...overrides,
    };
  }, [safeFamilyId]);

  // garantiza que el target tenga ambos padres; si faltan, los crea
  const ensureParentsFor = useCallback((targetId) => {
    const current = mergedPedigree?.[targetId] || {};
    let padreId = current.padreId || '';
    let madreId = current.madreId || '';

    const ops = [];

    if (!padreId) {
      const padre = newMember({ nombre: 'Padre ?', sexo: 'M', nacimiento: '1970-01-01' });
      ops.push(prev => [...prev, padre]);
      padreId = padre.id;
    }
    if (!madreId) {
      const madre = newMember({ nombre: 'Madre ?', sexo: 'F', nacimiento: '1970-01-01' });
      ops.push(prev => [...prev, madre]);
      madreId = madre.id;
    }

    if (ops.length) {
      setDraftMembers(prev => ops.reduce((acc, fn) => fn(acc), prev));
    }

    setParentDraft(targetId, 'padreId', padreId);
    setParentDraft(targetId, 'madreId', madreId);

    return { padreId, madreId };
  }, [mergedPedigree, newMember, setParentDraft]);

  const addParentsBoth = useCallback((targetId) => {
    return ensureParentsFor(targetId);
  }, [ensureParentsFor]);

  const addSibling = useCallback((targetId) => {
    // si el target no tiene alguno de los padres, los creamos y también quedan asignados al target
    const { padreId, madreId } = ensureParentsFor(targetId);

    // ahora sí, el hermano comparte esos dos padres
    const sib = newMember({ nombre: 'Hermano/a ?', nacimiento: todayISO() });
    setDraftMembers(prev => [...prev, sib]);
    if (padreId) setParentDraft(sib.id, 'padreId', padreId);
    if (madreId) setParentDraft(sib.id, 'madreId', madreId);
    return sib.id;
  }, [ensureParentsFor, newMember, setParentDraft]);

  const addChild = useCallback((targetId, opts = {}) => {
    // opts: { forceRole: 'padre' | 'madre' } si el sexo del target es desconocido
    const target = mergedMembers.find(m => m.id === targetId);
    if (!target) return null;

    const child = newMember({ nombre: 'Hijo/a ?', nacimiento: todayISO() });
    setDraftMembers(prev => [...prev, child]);

    let role = null;
    if (opts.forceRole === 'padre' || opts.forceRole === 'madre') {
      role = opts.forceRole;
    } else if (target.sexo === 'M') {
      role = 'padre';
    } else if (target.sexo === 'F') {
      role = 'madre';
    } else {
      // default razonable si no hay sexo: madre
      role = 'madre';
    }

    if (role === 'padre') setParentDraft(child.id, 'padreId', target.id);
    if (role === 'madre') setParentDraft(child.id, 'madreId', target.id);

    return child.id;
  }, [mergedMembers, newMember, setParentDraft]);

  const addPartner = useCallback((targetId) => {
    // Sólo crea la persona "Pareja ?". No habrá línea de pareja
    // hasta que exista un hijo con ambos padres asignados.
    const target = mergedMembers.find(m => m.id === targetId);
    const guessSex = target?.sexo === 'M' ? 'F' : target?.sexo === 'F' ? 'M' : '';
    const partner = newMember({ nombre: 'Pareja ?', sexo: guessSex });
    setDraftMembers(prev => [...prev, partner]);
    return partner.id;
  }, [mergedMembers, newMember]);

  const cloneFromBase = useCallback(() => {
    setDraftPedigree(prev => ({ ...prev, ...(basePedigree || {}) }));
  }, [basePedigree]);

  const resetDraft = useCallback(() => {
    setDraftMembers([]);
    setDraftPedigree({});
  }, []);

  return {
    mergedMembers,
    mergedPedigree,
    setParentDraft,
    ensureParentsFor,
    addParentsBoth,
    addSibling,
    addChild,
    addPartner,
    cloneFromBase,
    resetDraft,
  };
}
