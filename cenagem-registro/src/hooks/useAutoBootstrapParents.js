import { useEffect } from 'react';
import { useEnsureOnce } from '../lib/once';

// util: años (entero) entre fechas ISO
const yearsSince = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const n = new Date();
  let y = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) y--;
  return y;
};

// Heurística simple para madre/padre: mayores que el proband, sexo correcto,
// puntaje por edad plausible y por "rol" (M1/P1/B1/C1) si existe.
function pickParentCandidates({ proband, members }) {
  if (!proband) return { motherId: null, fatherId: null };

  const childAge = yearsSince(proband.nacimiento);
  const isOlderThanChild = (m) => {
    const a = yearsSince(m.nacimiento);
    return a == null || childAge == null ? true : a > childAge;
  };

  const score = (m, target) => {
    let s = 0;
    // 1) mayor que el hijo
    if (isOlderThanChild(m)) s += 2;

    // 2) edad plausible: diferencia 16–50 aprox
    if (m.nacimiento && proband.nacimiento) {
      const diff = yearsSince(proband.nacimiento) - yearsSince(m.nacimiento); // negativo si m es mayor
      const gap = Math.abs(diff);
      if (gap >= 16 && gap <= 50) s += 2;
      else if (gap >= 12 && gap <= 60) s += 1;
    }

    // 3) hints por rol (opcional)
    const r = (m.rol || '').toLowerCase();
    if (target === 'mother' && (r === 'm1' || r === 'b1' || r === 'm' || r.includes('madre'))) s += 3;
    if (target === 'father' && (r === 'p1' || r === 'c1' || r === 'p' || r.includes('padre'))) s += 3;

    // 4) fallback por nombre/iniciales si traes algo tipo "M1" / "P1" / "B1" / "C1"
    const lab = (m.nombre || m.filiatorios?.iniciales || '').toLowerCase();
    if (target === 'mother' && /^(m1|b1)$/.test(lab)) s += 2;
    if (target === 'father' && /^(p1|c1)$/.test(lab)) s += 2;

    return s;
  };

  const normalizeSex = (value) => (value || '').toString().trim().toUpperCase();
  const isFemale = (value) => {
    const s = normalizeSex(value);
    return s === 'F' || s === 'FEMENINO' || s === 'FEMALE';
  };
  const isMale = (value) => {
    const s = normalizeSex(value);
    return s === 'M' || s === 'MASCULINO' || s === 'MALE';
  };

  const females = members.filter((x) => x.id !== proband.id && isFemale(x.sexo));
  const males = members.filter((x) => x.id !== proband.id && isMale(x.sexo));

  females.sort((a, b) => score(b, 'mother') - score(a, 'mother'));
  males.sort((a, b) => score(b, 'father') - score(a, 'father'));

  const motherId = females[0]?.id || null;
  const fatherId = males[0]?.id || null;

  // si ninguno puntúa, devolvemos nulls y dejaremos que se creen
  return { motherId, fatherId };
}

export default function useAutoBootstrapParents({
  familyKey,
  proband,
  parentsMap,
  basePedigree,
  mergedMembers,       // <-- necesitamos ver a M1/P1/B1/C1
  setParentDraft,      // <-- para vincular si reutilizamos
  cloneFromBase,
  addParentsBoth,
  setSelectedMemberId,
  draftReady,
}) {
  const once = useEnsureOnce(familyKey || 'no-family');

  useEffect(() => {
    if (!proband) return;
    if (!draftReady) return;
    if (!once('bootstrap-parents')) return;

    const p = parentsMap?.[proband.id] || {};
    const needsFather = !p.padreId;
    const needsMother = !p.madreId;
    if (!needsFather && !needsMother) return;

    const baseNode = basePedigree?.[proband.id];
    if (baseNode && (baseNode.padreId || baseNode.madreId)) {
      cloneFromBase();
      setSelectedMemberId(proband.id);
      return;
    }

    const { motherId, fatherId } = pickParentCandidates({
      proband,
      members: mergedMembers || [],
    });

    const assignedFromExisting = (needsMother && motherId) || (needsFather && fatherId);
    if (assignedFromExisting) {
      if (needsMother && motherId) setParentDraft(proband.id, 'madreId', motherId);
      if (needsFather && fatherId) setParentDraft(proband.id, 'padreId', fatherId);
      setSelectedMemberId(proband.id);
      return;
    }

    addParentsBoth(proband.id);
    setSelectedMemberId(proband.id);
  }, [
    proband,
    parentsMap,
    basePedigree,
    mergedMembers,
    setParentDraft,
    cloneFromBase,
    addParentsBoth,
    setSelectedMemberId,
    draftReady,
    once,
  ]);
}
