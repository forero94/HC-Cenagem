import { useMemo } from 'react';

export default function useSides({ proband, parentsMap }) {
  return useMemo(() => {
    const side = new Map();
    if (!proband) return side;
    const p = parentsMap?.[proband.id] || {};
    const father = p.padreId || null, mother = p.madreId || null;

    const markUp = (root, label) => {
      if (!root) return;
      const q = [root], seen = new Set();
      while (q.length) {
        const id = q.shift();
        if (seen.has(id)) continue;
        seen.add(id);
        side.set(id, label);
        const pp = parentsMap[id];
        if (pp) {
          if (pp.padreId) q.push(pp.padreId);
          if (pp.madreId) q.push(pp.madreId);
        }
      }
    };
    markUp(mother, 'L');
    markUp(father, 'R');
    side.set(proband.id, 'C');
    return side;
  }, [proband, parentsMap]);
}
