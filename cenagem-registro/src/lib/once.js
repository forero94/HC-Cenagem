import { useRef } from 'react';

export function useEnsureOnce(key) {
  const ref = useRef(new Set());
  return (label) => {
    const k = `${key}:${label}`;
    if (ref.current.has(k)) return false;
    ref.current.add(k);
    return true;
  };
}
