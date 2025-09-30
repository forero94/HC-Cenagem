import { useMemo } from 'react';

export default function useChildLines({ parentsMap = {}, pos = new Map(), nodeR = 24 }) {
  return useMemo(() => {
    const lines = [];
    const coupleMid = (a, b) => {
      const pa = pos.get(a), pb = pos.get(b);
      if (!pa || !pb) return null;
      return { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
    };
    Object.entries(parentsMap).forEach(([childId, { padreId, madreId }]) => {
      const childP = pos.get(childId);
      if (!childP) return;
      const topY = childP.y - (nodeR + 10);
      if (padreId && madreId) {
        const mid = coupleMid(padreId, madreId);
        if (!mid) return;
        lines.push({ type: 'down', x: mid.x, y1: mid.y + 10, y2: topY });
        if (childP.x !== mid.x) {
          lines.push({ type: 'toChild', x1: mid.x, y1: topY, x2: childP.x, y2: topY });
        }
        lines.push({ type: 'stub', x1: childP.x, y1: topY, x2: childP.x, y2: childP.y - (nodeR - 4) });
      } else {
        const pid = padreId || madreId;
        const pp = pos.get(pid);
        if (!pp) return;
        lines.push({ type: 'down', x: pp.x, y1: pp.y + 10, y2: topY });
        if (pp.x !== childP.x) {
          lines.push({ type: 'toChild', x1: pp.x, y1: topY, x2: childP.x, y2: topY });
        }
        lines.push({ type: 'stub', x1: childP.x, y1: topY, x2: childP.x, y2: childP.y - (nodeR - 4) });
      }
    });
    return lines;
  }, [parentsMap, pos, nodeR]);
}
