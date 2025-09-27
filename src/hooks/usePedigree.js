import { useMemo } from 'react';

export default function usePedigree(members = [], pedigree = {}) {
  const idSet = useMemo(() => new Set(members.map(m => m.id)), [members]);
  const membersById = useMemo(() => {
    const map = new Map(); members.forEach(m => map.set(m.id, m)); return map;
  }, [members]);

  const parentsMap = useMemo(() => {
    const p = {};
    members.forEach(m => {
      const node = pedigree?.[m.id] || {};
      const padreId = node.padreId && idSet.has(node.padreId) ? node.padreId : '';
      const madreId = node.madreId && idSet.has(node.madreId) ? node.madreId : '';
      if (padreId || madreId) p[m.id] = { padreId, madreId };
    });
    return p;
  }, [members, pedigree, idSet]);

  const childrenMap = useMemo(() => {
    const map = new Map();
    Object.entries(parentsMap).forEach(([cid, { padreId, madreId }]) => {
      [padreId, madreId].forEach(pid => {
        if (!pid) return;
        if (!map.has(pid)) map.set(pid, new Set());
        map.get(pid).add(cid);
      });
    });
    return map;
  }, [parentsMap]);

  const proband = useMemo(
    () => members.find(m => (m.rol || '').toLowerCase() === 'proband') || members[0] || null,
    [members]
  );

  const generations = useMemo(() => {
    const gen = new Map(); if (!proband) return gen;
    gen.set(proband.id, 0);
    const q = [proband.id];
    while (q.length) {
      const cur = q.shift(), cg = gen.get(cur);
      const p = parentsMap[cur];
      if (p) {
        ['padreId', 'madreId'].forEach(k => {
          const pid = p[k];
          if (pid && !gen.has(pid)) { gen.set(pid, cg - 1); q.push(pid); }
        });
      }
      const kids = childrenMap.get(cur);
      if (kids) kids.forEach(cid => { if (!gen.has(cid)) { gen.set(cid, cg + 1); q.push(cid); } });
    }
    members.forEach(m => { if (!gen.has(m.id)) gen.set(m.id, 0); });
    return gen;
  }, [members, proband, parentsMap, childrenMap]);

  return { membersById, parentsMap, childrenMap, proband, generations };
}
