import { useMemo } from 'react';

export default function useCouples(parentsMap) {
  return useMemo(() => {
    const set = new Map();
    Object.values(parentsMap || {}).forEach(({ padreId, madreId }) => {
      if (padreId && madreId) {
        const a = padreId < madreId ? padreId : madreId;
        const b = padreId < madreId ? madreId : padreId;
        set.set(`${a}|${b}`, { a, b });
      }
    });
    return Array.from(set.values());
  }, [parentsMap]);
}
