import { useEffect } from 'react';

export default function useInitialSelection(members, selectedId, setSelectedId) {
  useEffect(() => {
    if (!members?.length) return;
    if (!selectedId) {
      setSelectedId(members[0].id);
    } else if (!members.some(m => m.id === selectedId)) {
      setSelectedId(members[0].id);
    }
  }, [members, selectedId, setSelectedId]);
}
