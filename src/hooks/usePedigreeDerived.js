// hooks/usePedigreeDerived.js
import usePedigree from './usePedigree';
import useCouples from './useCouples';
import useSides from './useSides';
import useGridLayout from './useGridLayout';
import { useMemo } from 'react';

export default function usePedigreeDerived(mergedMembers, mergedPedigree){
  const { membersById, parentsMap, proband, generations } =
    usePedigree(mergedMembers, mergedPedigree);
  const couples = useCouples(parentsMap, mergedMembers);
  const sideMap = useSides({ proband, parentsMap });

  const layout = useMemo(() => {
    const l = useGridLayout({ members: mergedMembers, generations, sideMap, parentsMap });
    const childLines = [];
    const pos = l.pos; const r = l.nodeR;
    const coupleMid = (a,b) => {
      const pa = pos.get(a), pb = pos.get(b);
      if (!pa || !pb) return null;
      return { x: (pa.x + pb.x)/2, y: pa.y };
    };
    Object.entries(parentsMap).forEach(([childId, {padreId, madreId}]) => {
      const childP = pos.get(childId); if (!childP) return;
      if (padreId && madreId){
        const mid = coupleMid(padreId, madreId); if (!mid) return;
        childLines.push({type:'down', x:mid.x, y1:mid.y+10, y2:childP.y-(r+10)});
        childLines.push({type:'toChild', x1:mid.x, y1:childP.y-(r+10), x2:childP.x, y2:childP.y-(r+10)});
        childLines.push({type:'stub', x1:childP.x, y1:childP.y-(r+10), x2:childP.x, y2:childP.y-(r-4)});
      } else {
        const pid = padreId || madreId;
        const pp = pos.get(pid);
        if (pp) childLines.push({type:'single', x1:pp.x, y1:pp.y+10, x2:childP.x, y2:childP.y-10});
      }
    });
    return { ...l, childLines };
  }, [mergedMembers, generations, sideMap, parentsMap]);

  return { proband, membersById, generations, parentsMap, couples, sideMap, layout };
}
