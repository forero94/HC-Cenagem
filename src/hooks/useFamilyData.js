import { useMemo } from 'react';
import { useCenagemStore } from '../store/cenagemStore';
import usePedigreeDraftStore from './usePedigreeDraftStore';

/**
 * Fachada única de datos de familia + sandbox de pedigrí.
 * Devuelve fam, members/basePedigree y el draft (merged + actions).
 */
export default function useFamilyData(familyId) {
  const { state, listMembers } = useCenagemStore();

  // familia actual (puede ser null si no existe)
  const fam = useMemo(
    () => state.families.find((f) => f.id === familyId) || null,
    [state.families, familyId]
  );

  // miembros reales de HC (solo lectura)
  const members = useMemo(
    () => (fam ? listMembers(fam.id) : []),
    [fam, state.members, listMembers]
  );

  // pedigrí base (HC real, solo lectura desde esta página)
  const basePedigree = state.pedigree || {};

  // sandbox/draft del pedigrí para esta familia
  const draft = usePedigreeDraftStore(fam?.id, basePedigree, members);

  return {
    fam,
    members,
    basePedigree,

    // datos fusionados para render
    mergedMembers: draft.mergedMembers,
    mergedPedigree: draft.mergedPedigree,

    // acciones del sandbox
    cloneFromBase: draft.cloneFromBase,
    addParentsBoth: draft.addParentsBoth,
    addSibling: draft.addSibling,
    addChild: draft.addChild,
    addPartner: draft.addPartner,
    setParentDraft: draft.setParentDraft,
    resetDraft: draft.resetDraft,
  };
}
