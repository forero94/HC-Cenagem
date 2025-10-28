import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useCenagemStore } from '../store/cenagemStore';
import usePedigreeEngineState from './usePedigreeEngineState';
import { membersToIndividuals, pedigreeToRelationships } from '../modules/pedigree-engine/adapters';

const ensureArray = (value) => (Array.isArray(value) ? value : []);

export default function usePedigreeWorkspace(familyId) {
  const { state, listMembers } = useCenagemStore();
  const fam = useMemo(
    () => state.families.find((f) => f.id === familyId) || null,
    [state.families, familyId],
  );
  const hcMembers = useMemo(
    () => (fam ? listMembers(fam.id) : []),
    [fam, listMembers],
  );
  const basePedigree = state.pedigree || {};

  const familyKey = fam?.id || familyId || 'no-family';
  const engineHook = usePedigreeEngineState(familyKey, { sync: true });
  const { engine, state: engineState, commit, replace, validationReport, validationSummary } = engineHook;

  // bootstrap inicial desde la HC si no hay datos en storage
  const bootstrappedRef = useRef(false);
  useEffect(() => {
    if (bootstrappedRef.current) return;
    if (!hcMembers.length) return;
    if (engineState.individuals.length > 0) {
      bootstrappedRef.current = true;
      return;
    }
    commit((eng) => {
      const seed = {
        ...eng.getState(),
        metadata: {
          ...eng.getState().metadata,
          familyId: familyKey,
          reason: eng.getState().metadata.reason || '',
          historian: hcMembers.find((m) => (m.rol || '').toLowerCase() === 'proband')?.nombre || '',
        },
        individuals: membersToIndividuals(hcMembers),
        relationships: pedigreeToRelationships(basePedigree),
      };
      eng.setState(seed);
      return seed;
    });
    bootstrappedRef.current = true;
  }, [commit, hcMembers, basePedigree, engineState.individuals.length, familyKey]);

  // Mantener metadatos básicos al día (motivo, privacidad por defecto)
  useEffect(() => {
    if (!fam) return;
    const reasonText =
      typeof fam.motivo === 'string'
        ? fam.motivo
        : fam.motivo?.detailLabel || fam.motivo?.groupLabel || '';
    commit((eng) => {
      const current = eng.getState().metadata || {};
      const next = {
        ...current,
        familyId: familyKey,
        reason: current.reason || reasonText || '',
        recorder: current.recorder || 'CENAGEM',
      };
      eng.updateMetadata(next);
      return eng.getState();
    });
  }, [fam, familyKey, commit]);

  const ensureIndividual = useCallback(
    (id, patch) => {
      if (!id) return null;
      let targetId = id;
      commit((eng) => {
        const existing = eng.getState().individuals.find((ind) => ind.id === id);
        if (!existing) {
          targetId = eng.upsertIndividual({ id, ...patch });
        } else {
          eng.upsertIndividual({ ...existing, ...patch, id });
        }
        return eng.getState();
      });
      return targetId;
    },
    [commit],
  );

  const createIndividual = useCallback(
    (payload = {}) => {
      let newId = null;
      commit((eng) => {
        newId = eng.upsertIndividual(payload);
        return eng.getState();
      });
      return newId;
    },
    [commit],
  );

  const updateIndividual = useCallback(
    (id, patch = {}) => {
      if (!id) return;
      commit((eng) => {
        const existing = eng.getState().individuals.find((ind) => ind.id === id) || {};
        eng.upsertIndividual({ ...existing, id, ...patch });
        return eng.getState();
      });
    },
    [commit],
  );

  const removeIndividual = useCallback(
    (id) => {
      if (!id) return;
      commit((eng) => {
        eng.removeIndividual(id);
        return eng.getState();
      });
    },
    [commit],
  );

  const linkPartner = useCallback(
    (a, b, { status = 'current' } = {}) => {
      if (!a || !b) return;
      commit((eng) => {
        eng.upsertRelationship({ type: 'partner', a, b, status });
        return eng.getState();
      });
    },
    [commit],
  );

  const updatePartnerRelationship = useCallback(
    (a, b, patch = {}) => {
      if (!a || !b) return;
      const [idA, idB] = a < b ? [a, b] : [b, a];
      commit((eng) => {
        const existing =
          eng
            .getState()
            .relationships.find(
              (rel) =>
                rel.type === 'partner' &&
                ((rel.a === idA && rel.b === idB) || (rel.a === idB && rel.b === idA)),
            ) || {};
        eng.upsertRelationship({
          type: 'partner',
          a: idA,
          b: idB,
          status: existing.status || 'current',
          consanguinity: existing.consanguinity || false,
          ...patch,
        });
        return eng.getState();
      });
    },
    [commit],
  );

  const unlinkPartner = useCallback(
    (a, b) => {
      commit((eng) => {
        eng.removeRelationship({ type: 'partner', a, b });
        return eng.getState();
      });
    },
    [commit],
  );

  const linkParentChild = useCallback(
    ({ father, mother, child, biological = true, gestational = false, adoptive = false }) => {
      if (!child || (!father && !mother)) return;
      commit((eng) => {
        eng.upsertRelationship({
          type: 'parentChild',
          father: father || null,
          mother: mother || null,
          child,
          biological,
          gestational,
          adoptive,
        });
        return eng.getState();
      });
    },
    [commit],
  );

  const createParentsForChild = useCallback(
    (childId, { fatherSex = 'M', motherSex = 'F', biological = true } = {}) => {
      if (!childId) return { fatherId: null, motherId: null };
      let fatherId = null;
      let motherId = null;
      commit((eng) => {
        const state = eng.getState();
        const existing = state.relationships.find(
          (rel) =>
            rel.type === 'parentChild' &&
            rel.child === childId &&
            (rel.father || rel.mother),
        );
        if (existing && existing.father && existing.mother) {
          fatherId = existing.father;
          motherId = existing.mother;
          return state;
        }

        if (existing?.father && !existing.mother) fatherId = existing.father;
        if (existing?.mother && !existing.father) motherId = existing.mother;

        if (!fatherId) fatherId = eng.upsertIndividual({ sex: fatherSex });
        if (!motherId) motherId = eng.upsertIndividual({ sex: motherSex });

        eng.upsertRelationship({
          type: 'partner',
          a: fatherId,
          b: motherId,
          status: 'current',
        });

        eng.upsertRelationship({
          type: 'parentChild',
          father: fatherId || null,
          mother: motherId || null,
          child: childId,
          biological,
        });

        if (existing && (!existing.father || !existing.mother)) {
          eng.removeRelationship({
            type: 'parentChild',
            father: existing.father || null,
            mother: existing.mother || null,
            child: childId,
          });
        }

        return eng.getState();
      });
      return { fatherId, motherId };
    },
    [commit],
  );

  const unlinkParentChild = useCallback(
    ({ child, father, mother }) => {
      commit((eng) => {
        eng.removeRelationship({
          type: 'parentChild',
          father: father || null,
          mother: mother || null,
          child,
        });
        return eng.getState();
      });
    },
    [commit],
  );

  const upsertPregnancy = useCallback(
    (payload) => {
      let newId = payload?.id || null;
      commit((eng) => {
        newId = eng.upsertPregnancy(payload);
        return eng.getState();
      });
      return newId;
    },
    [commit],
  );

  const removePregnancy = useCallback(
    (id) => {
      if (!id) return;
      commit((eng) => {
        eng.removePregnancy(id);
        return eng.getState();
      });
    },
    [commit],
  );

  const upsertArt = useCallback(
    (payload) => {
      let newId = payload?.id || null;
      commit((eng) => {
        newId = eng.upsertArt(payload);
        return eng.getState();
      });
      return newId;
    },
    [commit],
  );

  const removeArt = useCallback(
    (id) => {
      if (!id) return;
      commit((eng) => {
        eng.removeArt(id);
        return eng.getState();
      });
    },
    [commit],
  );

  const setNodePosition = useCallback(
    (id, pos) => {
      if (!id || !pos) return;
      commit((eng) => {
        eng.setNodePosition(id, pos);
        return eng.getState();
      });
    },
    [commit],
  );

  const setLegend = useCallback(
    (patch) => {
      commit((eng) => {
        eng.updateLegend(patch);
        return eng.getState();
      });
    },
    [commit],
  );

  const setMetadata = useCallback(
    (patch) => {
      commit((eng) => {
        eng.updateMetadata(patch);
        return eng.getState();
      });
    },
    [commit],
  );

  const legendUsage = useMemo(
    () => Array.from(engine.computeLegendUsage ? engine.computeLegendUsage() : []),
    [engineState.individuals, engineState.pregnancies],
  );

  const individualsById = useMemo(() => {
    const map = new Map();
    ensureArray(engineState.individuals).forEach((ind) => map.set(ind.id, ind));
    return map;
  }, [engineState.individuals]);

  return {
    fam,
    engineState,
    engine,
    validationReport,
    validationSummary,
    legendUsage,
    individualsById,
    actions: {
      replace,
      createIndividual,
      updateIndividual,
      removeIndividual,
      linkPartner,
      unlinkPartner,
      linkParentChild,
      unlinkParentChild,
      upsertPregnancy,
      removePregnancy,
      upsertArt,
      removeArt,
      createParentsForChild,
      setLegend,
      setMetadata,
      ensureIndividual,
      setNodePosition,
      updatePartnerRelationship,
    },
  };
}
