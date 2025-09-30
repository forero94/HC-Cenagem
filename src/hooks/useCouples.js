import { useMemo } from 'react';

export default function useCouples(parentsMap, members = []) {
  return useMemo(() => {
    const set = new Map();
    Object.values(parentsMap || {}).forEach(({ padreId, madreId }) => {
      if (padreId && madreId) {
        const a = padreId < madreId ? padreId : madreId;
        const b = padreId < madreId ? madreId : padreId;
        set.set(`${a}|${b}`, { a, b });
      }
    });
    (members || []).forEach((member) => {
      const partnerId = member?.parejaDe;
      if (!member?.id || !partnerId) return;
      const a = member.id < partnerId ? member.id : partnerId;
      const b = member.id < partnerId ? partnerId : member.id;
      set.set(`${a}|${b}`, { a, b });
    });
    return Array.from(set.values());
  }, [parentsMap, members]);
}
