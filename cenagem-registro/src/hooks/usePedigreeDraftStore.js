import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_NS = 'pedigree-sandbox/v1';

const uid = () => Math.random().toString(36).slice(2, 10);

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

function mergeMembers(base = [], drafts = []) {
  const map = new Map();
  base.forEach((member) => {
    if (!member || !member.id) return;
    map.set(member.id, { ...member });
  });
  drafts.forEach((draft) => {
    if (!draft || !draft.id) return;
    if (draft._deleted) {
      map.delete(draft.id);
      return;
    }
    const prev = map.get(draft.id);
    map.set(draft.id, prev ? { ...prev, ...draft } : { ...draft });
  });
  return Array.from(map.values());
}

function mergePedigree(base = {}, drafts = {}) {
  return { ...(base || {}), ...(drafts || {}) };
}

export default function usePedigreeDraftStore(familyId, basePedigree, membersFromHC) {
  const safeFamilyId = familyId || 'no-family';

  const initialSandbox = useMemo(() => readSandbox(safeFamilyId), [safeFamilyId]);
  const [draftMembers, setDraftMembers] = useState(() =>
    Array.isArray(initialSandbox.draftMembers) ? initialSandbox.draftMembers : []
  );
  const [draftPedigree, setDraftPedigree] = useState(() =>
    initialSandbox.draftPedigree && typeof initialSandbox.draftPedigree === 'object'
      ? initialSandbox.draftPedigree
      : {}
  );
  const [hydrated, setHydrated] = useState(false);
  const [loadedFamilyId, setLoadedFamilyId] = useState('');
  const draftReady = useMemo(
    () => hydrated && loadedFamilyId === safeFamilyId,
    [hydrated, loadedFamilyId, safeFamilyId]
  );

  // cargar sandbox al montar o cuando cambia la familia
  useEffect(() => {
    setHydrated(false);
    const { draftMembers, draftPedigree } = readSandbox(safeFamilyId);
    setDraftMembers(Array.isArray(draftMembers) ? draftMembers : []);
    setDraftPedigree(draftPedigree && typeof draftPedigree === 'object' ? draftPedigree : {});
    setLoadedFamilyId(safeFamilyId);
    setHydrated(true);
  }, [safeFamilyId]);

  // persistir en storage
  useEffect(() => {
    if (!draftReady) return;
    writeSandbox(safeFamilyId, { draftMembers, draftPedigree });
  }, [safeFamilyId, draftMembers, draftPedigree, draftReady]);

  const mergedMembers = useMemo(
    () => mergeMembers(membersFromHC, draftMembers),
    [membersFromHC, draftMembers]
  );

  const mergedPedigree = useMemo(
    () => mergePedigree(basePedigree, draftPedigree),
    [basePedigree, draftPedigree]
  );

  const setParentDraft = useCallback((childId, parentType, parentId) => {
    setDraftPedigree((prev) => {
      const node = { ...(prev[childId] || {}) };
      node[parentType] = parentId || '';
      return { ...prev, [childId]: node };
    });
  }, []);

  const newMember = useCallback((overrides = {}) => ({
    id: uid(),
    familyId: safeFamilyId,
    nombre: overrides.nombre ?? '',
    sexo: overrides.sexo ?? '',
    simbolo: overrides.simbolo ?? 'auto',
    edadTexto: overrides.edadTexto ?? '',
    nacimiento: overrides.nacimiento ?? '',
    rol: overrides.rol ?? '',
    filiatorios: overrides.filiatorios ?? {},
    estado: overrides.estado ?? 'vivo',
    notas: [],
    ...overrides,
  }), [safeFamilyId]);

  const ensureParentsFor = useCallback((targetId) => {
    const current = mergedPedigree?.[targetId] || {};
    let padreId = current.padreId || '';
    let madreId = current.madreId || '';

    const ops = [];

    if (!padreId) {
      const padre = newMember({ nombre: '', sexo: 'M', nacimiento: '' });
      ops.push((prev) => [...prev, padre]);
      padreId = padre.id;
    }
    if (!madreId) {
      const madre = newMember({ nombre: '', sexo: 'F', nacimiento: '' });
      ops.push((prev) => [...prev, madre]);
      madreId = madre.id;
    }

    if (ops.length) {
      setDraftMembers((prev) => ops.reduce((acc, fn) => fn(acc), prev));
    }

    setParentDraft(targetId, 'padreId', padreId);
    setParentDraft(targetId, 'madreId', madreId);

    return { padreId, madreId };
  }, [mergedPedigree, newMember, setParentDraft]);

  const addParentsBoth = useCallback((targetId) => ensureParentsFor(targetId), [ensureParentsFor]);

  const addSibling = useCallback((targetId) => {
    const { padreId, madreId } = ensureParentsFor(targetId);
    const sib = newMember({ nombre: '', edadTexto: '', nacimiento: '' });
    setDraftMembers((prev) => [...prev, sib]);
    if (padreId) setParentDraft(sib.id, 'padreId', padreId);
    if (madreId) setParentDraft(sib.id, 'madreId', madreId);
    return sib.id;
  }, [ensureParentsFor, newMember, setParentDraft]);

  const findPartnerId = useCallback((targetId) => {
    if (!targetId) return '';
    const target = mergedMembers.find((m) => m.id === targetId);
    if (!target) return '';
    const explicit = mergedMembers.find(
      (m) => m.id !== targetId && (m.parejaDe === targetId || target.parejaDe === m.id)
    );
    if (explicit) return explicit.id;
    for (const node of Object.values(mergedPedigree || {})) {
      if (!node) continue;
      if (node.padreId === targetId && node.madreId) return node.madreId;
      if (node.madreId === targetId && node.padreId) return node.padreId;
    }
    return '';
  }, [mergedMembers, mergedPedigree]);

  const addChild = useCallback((targetId, opts = {}) => {
    const target = mergedMembers.find((m) => m.id === targetId);
    if (!target) return null;

    const child = newMember({ nombre: '', edadTexto: '', nacimiento: '' });
    setDraftMembers((prev) => [...prev, child]);

    let role = null;
    if (opts.forceRole === 'padre' || opts.forceRole === 'madre') {
      role = opts.forceRole;
    } else if (target.sexo === 'M') {
      role = 'padre';
    } else if (target.sexo === 'F') {
      role = 'madre';
    } else {
      role = 'madre';
    }

    const partnerId = findPartnerId(target.id);

    if (role === 'padre') {
      setParentDraft(child.id, 'padreId', target.id);
      if (partnerId) setParentDraft(child.id, 'madreId', partnerId);
    } else if (role === 'madre') {
      setParentDraft(child.id, 'madreId', target.id);
      if (partnerId) setParentDraft(child.id, 'padreId', partnerId);
    }

    return child.id;
  }, [mergedMembers, newMember, setParentDraft, findPartnerId]);

  const addPartner = useCallback((targetId) => {
    if (!targetId) return null;
    const target = mergedMembers.find((m) => m.id === targetId);
    const guessSex = target?.sexo === 'M' ? 'F' : target?.sexo === 'F' ? 'M' : '';
    const partner = newMember({ nombre: '', sexo: guessSex, parejaDe: targetId });
    setDraftMembers((prev) => {
      const next = [...prev, partner];
      const idx = next.findIndex((m) => m.id === targetId);
      if (idx >= 0) {
        next[idx] = { ...next[idx], parejaDe: partner.id };
      } else {
        next.push({ id: targetId, parejaDe: partner.id });
      }
      return next;
    });
    return partner.id;
  }, [mergedMembers, newMember]);

  const updateMemberDraft = useCallback((memberId, patch = {}) => {
    if (!memberId) return;
    setDraftMembers((prev) => {
      const idx = prev.findIndex((m) => m.id === memberId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...patch };
        return next;
      }
      return [...prev, { id: memberId, ...patch }];
    });
  }, []);

  const removeMemberDraft = useCallback((memberId) => {
    if (!memberId) return;
    const impactedIds = mergedMembers
      .filter((m) => m.id !== memberId && m.parejaDe === memberId)
      .map((m) => m.id);

    setDraftMembers((prev) => {
      const next = [];
      prev.forEach((m) => {
        if (m.id === memberId) return;
        if (m.parejaDe === memberId) {
          next.push({ ...m, parejaDe: '' });
        } else {
          next.push(m);
        }
      });
      impactedIds.forEach((id) => {
        const idx = next.findIndex((m) => m.id === id);
        if (idx >= 0) {
          next[idx] = { ...next[idx], parejaDe: '' };
        } else {
          next.push({ id, parejaDe: '' });
        }
      });
      const existsInBase = (membersFromHC || []).some((m) => m.id === memberId);
      if (existsInBase && !next.some((m) => m.id === memberId && m._deleted)) {
        next.push({ id: memberId, _deleted: true });
      }
      return next;
    });

    setDraftPedigree((prev) => {
      const next = { ...prev };
      delete next[memberId];
      Object.keys(next).forEach((childId) => {
        const node = next[childId];
        if (!node) return;
        let changed = false;
        const updated = { ...node };
        if (updated.padreId === memberId) {
          updated.padreId = '';
          changed = true;
        }
        if (updated.madreId === memberId) {
          updated.madreId = '';
          changed = true;
        }
        if (!changed) return;
        if (!updated.padreId && !updated.madreId) {
          delete next[childId];
        } else {
          next[childId] = updated;
        }
      });
      return next;
    });
  }, [membersFromHC, mergedMembers]);

  const cloneFromBase = useCallback(() => {
    setDraftPedigree((prev) => ({ ...prev, ...(basePedigree || {}) }));
  }, [basePedigree]);

  const resetDraft = useCallback(() => {
    setDraftMembers([]);
    setDraftPedigree({});
  }, []);

  return {
    mergedMembers,
    mergedPedigree,
    draftReady,
    setParentDraft,
    ensureParentsFor,
    addParentsBoth,
    addSibling,
    addChild,
    addPartner,
    updateMemberDraft,
    removeMemberDraft,
    cloneFromBase,
    resetDraft,
  };
}
