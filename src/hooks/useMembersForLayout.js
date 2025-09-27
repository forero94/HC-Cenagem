import { useMemo } from 'react';

export default function useMembersForLayout({
  viewMode, proband, parentsMap, mergedMembers, mergedPedigree, maxDepth = 5,
}) {
  const visibleIdSet = useMemo(() => {
    if (viewMode !== 'foco' || !proband) {
      return new Set(mergedMembers.map(m => m.id));
    }
    const included = new Set();
    const visit = (id, d) => {
      if (!id || d > maxDepth) return;
      included.add(id);
      const p = parentsMap[id] || {};
      const f = p.padreId || '';
      const m = p.madreId || '';
      if (f) { included.add(f); visit(f, d + 1); }
      if (m) { included.add(m); visit(m, d + 1); }
      mergedMembers.forEach(mm => {
        if (mm.id === id) return;
        const node = mergedPedigree[mm.id] || {};
        if ((f && node.padreId === f) || (m && node.madreId === m)) included.add(mm.id);
      });
    };
    visit(proband.id, 0);
    return included;
  }, [viewMode, proband, parentsMap, mergedMembers, mergedPedigree, maxDepth]);

  return useMemo(
    () => mergedMembers.filter(m => visibleIdSet.has(m.id)),
    [mergedMembers, visibleIdSet]
  );
}
