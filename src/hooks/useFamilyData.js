import { useMemo } from 'react';
import { useCenagemStore } from '../store/cenagemStore';
import usePedigreeDraftStore from './usePedigreeDraftStore';

const calculateAgeYears = (iso) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    years -= 1;
  }
  return years >= 0 ? years : 0;
};

const mapMembersWithAge = (members = []) =>
  members.map((member) => {
    const age = calculateAgeYears(member?.nacimiento);
    return {
      ...member,
      edadCalculada: age,
      edadTexto: (member?.edadTexto != null && String(member.edadTexto).trim() !== '' ? String(member.edadTexto) : (age != null ? `${age}a` : '')),
    };
  });

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
  const members = useMemo(() => {
    void state.members; // asegura recomputo cuando cambia la lista base
    return fam ? listMembers(fam.id) : [];
  }, [fam, listMembers, state.members]);

  const membersWithAge = useMemo(() => mapMembersWithAge(members), [members]);

  // pedigrí base (HC real, solo lectura desde esta página)
  const basePedigree = state.pedigree || {};

  // sandbox/draft del pedigrí para esta familia
  const draft = usePedigreeDraftStore(fam?.id, basePedigree, members);
  const mergedMembersWithAge = useMemo(
    () => mapMembersWithAge(draft.mergedMembers || []),
    [draft.mergedMembers]
  );

  return {
    fam,
    members: membersWithAge,
    basePedigree,

    // datos fusionados para render
    mergedMembers: mergedMembersWithAge,
    mergedPedigree: draft.mergedPedigree,
    draftReady: draft.draftReady,

    // acciones del sandbox
    cloneFromBase: draft.cloneFromBase,
    addParentsBoth: draft.addParentsBoth,
    addSibling: draft.addSibling,
    addChild: draft.addChild,
    addPartner: draft.addPartner,
    updateMemberDraft: draft.updateMemberDraft,
    removeMemberDraft: draft.removeMemberDraft,
    setParentDraft: draft.setParentDraft,
    resetDraft: draft.resetDraft,
  };
}
