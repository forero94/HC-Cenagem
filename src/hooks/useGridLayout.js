import { useMemo } from 'react';

export default function useGridLayout({ members = [], generations = new Map(), sideMap = new Map(), couples = [] }) {
  const cellW = 140, cellH = 120, nodeR = 24, padding = 80, gutterSplit = 160, centerX = 0;

  const byGen = new Map();
  members.forEach(m => {
    const g = generations.get(m.id) ?? 0;
    if (!byGen.has(g)) byGen.set(g, []);
    byGen.get(g).push(m);
  });
  const genKeys = Array.from(byGen.keys()).sort((a, b) => a - b);
  const minGen = genKeys.length ? genKeys[0] : 0;

  const pos = new Map(); const nodes = []; const childLines = []; const coupleLines = [];

  const placeSide = (arr, startFrom, dir) => {
    arr.forEach((m, i) => {
      const x = startFrom + dir * (i + 1) * cellW;
      const y = 0;
      pos.set(m.id, { x, y });
    });
  };

  genKeys.forEach(g => {
    const row = byGen.get(g) || [];
    const y = padding + (g - minGen) * cellH;
    const L = [], C = [], R = [];
    row.forEach(m => {
      const s = sideMap.get(m.id) || 'C';
      if (s === 'L') L.push(m); else if (s === 'R') R.push(m); else C.push(m);
    });

    const leftInner = centerX - gutterSplit / 2;
    const rightInner = centerX + gutterSplit / 2;
    placeSide(L, leftInner, -1);
    placeSide(R, rightInner, +1);

    if (C.length > 0) {
      const midOffset = (C.length - 1) / 2;
      C.forEach((m, i) => pos.set(m.id, { x: centerX + (i - midOffset) * cellW, y }));
    }
    [...L, ...R].forEach(m => { const p = pos.get(m.id); if (p) p.y = y; });
    row.forEach(m => { const p = pos.get(m.id); if (p) nodes.push({ id: m.id, x: p.x, y: p.y, r: nodeR }); });
  });

  couples.forEach(({ a, b }) => {
    const pa = pos.get(a), pb = pos.get(b);
    if (!pa || !pb) return;
    const y = (pa.y + pb.y) / 2, x1 = Math.min(pa.x, pb.x), x2 = Math.max(pa.x, pb.x);
    const midX = (pa.x + pb.x) / 2, midY = y;
    coupleLines.push({ x1, x2, y, midX, midY, a, b });
  });

  const xs = nodes.map(n => n.x);
  const minX = (xs.length ? Math.min(...xs) : 0) - padding - nodeR;
  const maxX = (xs.length ? Math.max(...xs) : 0) + padding + nodeR;
  const height = (genKeys.length ? genKeys[genKeys.length - 1] - minGen : 0) * cellH + padding * 2;
  const width = maxX - minX + padding;

  return { nodes, coupleLines, childLines, pos, width, height, nodeR };
}
