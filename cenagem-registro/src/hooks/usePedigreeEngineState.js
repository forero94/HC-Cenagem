import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createPedigreeEngine,
  normalizeState,
  summarizeValidation,
} from '../modules/pedigree-engine';
import { loadTree, saveTree, listenTree } from '../lib/pedigreeStorage';

/**
 * Hook centralizado para manipular el motor de pedigrí NSGC.
 * Maneja persistencia local (localStorage) y emite validaciones reactivas.
 */
export default function usePedigreeEngineState(familyId, { sync = true } = {}) {
  const initial = useMemo(() => loadTree(familyId).engineState, [familyId]);
  const [engineState, setEngineState] = useState(initial);
  const engineRef = useRef(createPedigreeEngine(initial));

  useEffect(() => {
    engineRef.current.setState(engineState);
  }, [engineState]);

  useEffect(() => {
    if (!familyId || !sync) return undefined;
    const stop = listenTree(familyId, (nextState) => {
      setEngineState(nextState);
    });
    return stop;
  }, [familyId, sync]);

  const persist = useCallback(
    (next) => {
      if (familyId) {
        saveTree(familyId, { engineState: next });
      }
    },
    [familyId],
  );

  const commit = useCallback(
    (mutator) => {
      setEngineState((prev) => {
        engineRef.current.setState(prev);
        const maybeResult = mutator(engineRef.current);
        const nextState = normalizeState(maybeResult || engineRef.current.getState());
        persist(nextState);
        return nextState;
      });
    },
    [persist],
  );

  const replace = useCallback(
    (next) => {
      const normalized = normalizeState(next);
      persist(normalized);
      setEngineState(normalized);
    },
    [persist],
  );

  const validationReport = useMemo(() => engineRef.current.validate(), [engineState]);
  const validationSummary = useMemo(
    () => summarizeValidation(validationReport),
    [validationReport],
  );

  return {
    engine: engineRef.current,
    state: engineState,
    commit,
    replace,
    validationReport,
    validationSummary,
  };
}

