import { useMemo } from 'react';

export default function useGridLayout({
  members = [],
  generations = new Map(),
  couples = [],
  sideMap = new Map(),
  parentsMap = {},
  cellW = 140,
  cellH = 120,
  nodeR = 24,
  padding = 80,
  gutterSplit = 160,
}) {
  return useMemo(() => {
    const byGen = new Map();
    members.forEach((m) => {
      const g = generations.get(m.id) ?? 0;
      if (!byGen.has(g)) byGen.set(g, []);
      byGen.get(g).push(m);
    });
    const genKeys = Array.from(byGen.keys()).sort((a, b) => a - b);
    const minGen = genKeys.length ? genKeys[0] : 0;

    const pos = new Map();
    const nodes = [];
    const coupleLines = [];
    const centerX = 0;

    const setNode = (member, x, y) => {
      pos.set(member.id, { x, y });
      nodes.push({ id: member.id, x, y, r: nodeR });
    };

    const updateNodeX = (memberId, x) => {
      const prev = pos.get(memberId);
      if (!prev) return;
      pos.set(memberId, { ...prev, x });
      const node = nodes.find((n) => n.id === memberId);
      if (node) node.x = x;
    };

    const anchorFor = (memberId) => {
      const parents = parentsMap?.[memberId];
      if (!parents) return null;
      const xs = [];
      if (parents.padreId) {
        const p = pos.get(parents.padreId);
        if (p) xs.push(p.x);
      }
      if (parents.madreId) {
        const p = pos.get(parents.madreId);
        if (p) xs.push(p.x);
      }
      if (!xs.length) return null;
      return xs.reduce((acc, val) => acc + val, 0) / xs.length;
    };

    const familyKeyFor = (memberId) => {
      const parents = parentsMap?.[memberId];
      if (!parents) return null;
      const parts = [];
      if (parents.padreId) parts.push(`p:${parents.padreId}`);
      if (parents.madreId) parts.push(`m:${parents.madreId}`);
      if (!parts.length) return null;
      return parts.sort().join('|');
    };

    const sortByAnchor = (arr, direction = 1) =>
      arr.sort((a, b) => {
        const ax = anchorFor(a.id);
        const bx = anchorFor(b.id);
        const axValid = Number.isFinite(ax);
        const bxValid = Number.isFinite(bx);
        if (axValid && bxValid && ax !== bx) return direction * (ax - bx);
        if (axValid && !bxValid) return -1;
        if (!axValid && bxValid) return 1;
        const an = `${a.nombre || a.filiatorios?.iniciales || a.id || ''}`;
        const bn = `${b.nombre || b.filiatorios?.iniciales || b.id || ''}`;
        return an.localeCompare(bn);
      });

    const placeSide = (arr, startFrom, dir, y) => {
      arr.forEach((member, index) => {
        const x = startFrom + dir * (index + 1) * cellW;
        setNode(member, x, y);
      });
    };

    genKeys.forEach((g) => {
      const row = byGen.get(g) || [];
      const y = padding + (g - minGen) * cellH;
      const left = [];
      const center = [];
      const right = [];

      row.forEach((m) => {
        const side = sideMap.get(m.id) || 'C';
        if (side === 'L') left.push(m);
        else if (side === 'R') right.push(m);
        else center.push(m);
      });

      const leftInner = centerX - gutterSplit / 2;
      const rightInner = centerX + gutterSplit / 2;

      sortByAnchor(left, -1);
      sortByAnchor(right, +1);
      sortByAnchor(center, +1);

      placeSide(left, leftInner, -1, y);
      placeSide(right, rightInner, +1, y);

      if (center.length > 0) {
        const midOffset = (center.length - 1) / 2;
        center.forEach((member, index) => {
          const fallbackX = centerX + (index - midOffset) * cellW;
          const anchor = anchorFor(member.id);
          const x = Number.isFinite(anchor) ? anchor : fallbackX;
          setNode(member, x, y);
        });
      }

      const groups = new Map();
      row.forEach((member) => {
        const key = familyKeyFor(member.id);
        const anchor = anchorFor(member.id);
        if (!key || !Number.isFinite(anchor)) return;
        if (!groups.has(key)) groups.set(key, { anchor, members: [] });
        groups.get(key).members.push(member);
      });

      groups.forEach(({ anchor, members }) => {
        if (!members.length) return;
        const mid = (members.length - 1) / 2;
        members.forEach((member, index) => {
          const x = anchor + (index - mid) * cellW;
          updateNodeX(member.id, x);
        });
      });

      couples.forEach(({ a, b }) => {
        const pa = pos.get(a);
        const pb = pos.get(b);
        if (!pa || !pb) return;
        const ymid = (pa.y + pb.y) / 2;
        const x1 = Math.min(pa.x, pb.x);
        const x2 = Math.max(pa.x, pb.x);
        const midX = (pa.x + pb.x) / 2;
        coupleLines.push({ x1, x2, y: ymid, midX, midY: ymid, a, b });
      });
    });

    const xs = nodes.map((n) => n.x);
    const minX = (xs.length ? Math.min(...xs) : 0) - padding - nodeR;
    const maxX = (xs.length ? Math.max(...xs) : 0) + padding + nodeR;
    const height = (genKeys.length ? genKeys[genKeys.length - 1] - minGen : 0) * cellH + padding * 2;
    const width = maxX - minX + padding;

    return { nodes, coupleLines, pos, width, height, nodeR };
  }, [members, generations, couples, sideMap, parentsMap, cellW, cellH, nodeR, padding, gutterSplit]);
}