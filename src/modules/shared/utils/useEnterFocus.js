import { useRef, useCallback } from 'react';

export function useEnterFocus(order = [], onLast) {
  const nodes = useRef(new Map());

  const register = useCallback((name) => (el) => {
    if (el) nodes.current.set(name, el);
    else nodes.current.delete(name);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const name = e.currentTarget.dataset.nav;
    const idx = order.indexOf(name);
    const next = order[idx + 1];
    if (next && nodes.current.get(next)) {
      nodes.current.get(next).focus();
    } else if (onLast) {
      onLast();
    }
  }, [order, onLast]);

  return { register, handleKeyDown };
}
