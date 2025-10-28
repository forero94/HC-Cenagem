import { useMemo } from 'react';

export default function useChildLines({
  parentsMap = {},
  pos = new Map(),
  nodeR = 24,
  relationshipMeta = {},
}) {
  return useMemo(() => {
    const lines = [];
    const coupleMid = (a, b) => {
      const pa = pos.get(a);
      const pb = pos.get(b);
      if (!pa || !pb) return null;
      return { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 };
    };
    Object.entries(parentsMap).forEach(([childId, { padreId, madreId }]) => {
      const childPos = pos.get(childId);
      if (!childPos) return;
      const relationship = relationshipMeta[childId] || {};
      const dashed = relationship.biological === false || relationship.adoptive === true;
      const topY = childPos.y - (nodeR + 10);
      if (padreId && madreId) {
        const mid = coupleMid(padreId, madreId);
        if (!mid) return;
        lines.push({
          type: 'down',
          x1: mid.x,
          y1: mid.y + 10,
          x2: mid.x,
          y2: topY,
          dashed,
        });
        if (childPos.x !== mid.x) {
          lines.push({
            type: 'toChild',
            x1: mid.x,
            y1: topY,
            x2: childPos.x,
            y2: topY,
            dashed,
          });
        }
        lines.push({
          type: 'stub',
          x1: childPos.x,
          y1: topY,
          x2: childPos.x,
          y2: childPos.y - (nodeR - 4),
          dashed,
        });
      } else {
        const pid = padreId || madreId;
        const parentPos = pos.get(pid);
        if (!parentPos) return;
        lines.push({
          type: 'down',
          x1: parentPos.x,
          y1: parentPos.y + 10,
          x2: parentPos.x,
          y2: topY,
          dashed,
        });
        if (parentPos.x !== childPos.x) {
          lines.push({
            type: 'toChild',
            x1: parentPos.x,
            y1: topY,
            x2: childPos.x,
            y2: topY,
            dashed,
          });
        }
        lines.push({
          type: 'stub',
          x1: childPos.x,
          y1: topY,
          x2: childPos.x,
          y2: childPos.y - (nodeR - 4),
          dashed,
        });
      }
    });
    return lines;
  }, [parentsMap, pos, nodeR, relationshipMeta]);
}
