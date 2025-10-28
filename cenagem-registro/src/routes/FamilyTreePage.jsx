// ===============================
// src/routes/FamilyTreePage.jsx — Editor visual de pedigrí NSGC 2008
// Orquesta: motor (core), layout y componentes de UI.
// ===============================
import React, { useEffect, useMemo, useState } from 'react';

import usePedigreeWorkspace from '../hooks/usePedigreeWorkspace';
import useInitialSelection from '../hooks/useInitialSelection';
import useMembersForLayout from '../hooks/useMembersForLayout';
import usePedigree from '../hooks/usePedigree';
import useCouples from '../hooks/useCouples';
import useSides from '../hooks/useSides';
import useChildLines from '../hooks/useChildLines';
import useGridLayout from '../hooks/useGridLayout';
import useViewport from '../hooks/useViewport';

import TreeTopbar from '../components/TreeTopbar';
import TreeToolbar from '../components/TreeToolbar';
import PedigreeCanvas from '../components/PedigreeCanvas';
import MemberSidebar from '../components/MemberSidebar';
import PedigreePalette from '../components/PedigreePalette';
import ValidationPanel from '../components/ValidationPanel';

export default function FamilyTreePage({ familyId, inline = false }) {
  const {
    fam,
    engine,
    engineState,
    legendUsage,
    individualsById,
    validationSummary,
    actions,
  } = usePedigreeWorkspace(familyId);

  // Estado local de selección y modo de vista (foco / todo)
  const [selectedId, setSelectedId] = useState('');
  const [viewMode, setViewMode] = useState('todo');
  const [showValidation, setShowValidation] = useState(false);
  const [relationMenu, setRelationMenu] = useState(null);

  const metadata = engineState.metadata || {};
  const displayById = useMemo(
    () => buildDisplayById(engineState.individuals || [], metadata),
    [engineState.individuals, metadata],
  );

  const membersForHooks = useMemo(
    () => buildMembersForHooks(displayById),
    [displayById],
  );

  // Selección inicial (proband o primer miembro)
  useInitialSelection(membersForHooks, selectedId, setSelectedId);

  // Mapas de parentesco para layout
  const pedigreeMap = useMemo(
    () => relationshipsToPedigreeMap(engineState.relationships || []),
    [engineState.relationships],
  );

  const {
    proband,
    parentsMap: parentsMapFull,
    generations,
  } = usePedigree(membersForHooks, pedigreeMap);

  const couples = useCouples(pedigreeMap, membersForHooks, engineState.relationships);
  const sideMap = useSides({ proband, parentsMap: parentsMapFull });

  const membersForLayout = useMembersForLayout({
    viewMode,
    proband,
    parentsMap: parentsMapFull,
    mergedMembers: membersForHooks,
    mergedPedigree: pedigreeMap,
    maxDepth: 6,
  });

  const partnerMap = useMemo(
    () => buildPartnerMap(engineState.relationships, engineState.individuals),
    [engineState.relationships, engineState.individuals],
  );

  const parentsMapForLayout = useMemo(() => {
    if (!membersForLayout.length) return {};
    const allowed = new Set(membersForLayout.map((member) => member.id));
    const map = {};
    Object.entries(parentsMapFull || {}).forEach(([childId, links]) => {
      if (!allowed.has(childId)) return;
      let padreId = links.padreId && allowed.has(links.padreId) ? links.padreId : '';
      let madreId = links.madreId && allowed.has(links.madreId) ? links.madreId : '';

      if ((padreId && !madreId) || (madreId && !padreId)) {
        const knownParentId = padreId || madreId;
        const candidates = Array.from(partnerMap.get(knownParentId) || []).filter(
          (partnerId) => allowed.has(partnerId),
        );
        if (candidates.length === 1) {
          const partnerId = candidates[0];
          const hasDirectRelationship = (engineState.relationships || []).some(
            (rel) =>
              rel?.type === 'parentChild' &&
              rel.child === childId &&
              (rel.father === partnerId || rel.mother === partnerId),
          );
          if (hasDirectRelationship) {
            const partnerSex = (individualsById.get(partnerId)?.sex || '').toUpperCase();
            if (!padreId && partnerId !== madreId) {
              if (partnerSex === 'M' || partnerSex === 'U' || partnerSex === '') {
                padreId = partnerId;
              } else if (!madreId) {
                padreId = partnerId;
              }
            }
            if (!madreId && partnerId !== padreId) {
              if (partnerSex === 'F' || partnerSex === 'U' || partnerSex === '') {
                madreId = partnerId;
              } else if (!padreId) {
                madreId = partnerId;
              }
            }
          }
        }
      }

      if (padreId || madreId) {
        map[childId] = {
          padreId,
          madreId,
          biological: links.biological,
          adoptive: links.adoptive,
        };
      }
    });
    return map;
  }, [membersForLayout, parentsMapFull, partnerMap, individualsById, engineState.relationships]);

  const couplesForLayout = useMemo(() => {
    if (!couples?.length) return [];
    const allowed = new Set(membersForLayout.map((member) => member.id));
    return couples.filter((couple) => allowed.has(couple.a) && allowed.has(couple.b));
  }, [couples, membersForLayout]);

  const relationshipMeta = useMemo(() => {
    const meta = {};
    (engineState.relationships || []).forEach((rel) => {
      if (rel.type !== 'parentChild') return;
      meta[rel.child] = {
        biological: rel.biological !== false,
        adoptive: rel.adoptive === true,
      };
    });
    return meta;
  }, [engineState.relationships]);

  const layoutBase = useGridLayout({
    members: membersForLayout,
    generations,
    couples: couplesForLayout,
    sideMap,
    parentsMap: parentsMapForLayout,
  });

  const childLines = useChildLines({
    parentsMap: parentsMapForLayout,
    pos: layoutBase.pos,
    nodeR: layoutBase.nodeR,
    relationshipMeta,
  });

  const layout = useMemo(
    () => ({ ...layoutBase, childLines }),
    [layoutBase, childLines],
  );

  const findNearestNodeId = useMemo(() => {
    const entries = Array.from(layout.pos.entries());
    return (point, threshold = 60) => {
      let bestId = null;
      let minDist = Infinity;
      entries.forEach(([id, coords]) => {
        const dx = coords.x - point.x;
        const dy = coords.y - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          bestId = id;
        }
      });
      return minDist <= threshold ? bestId : null;
    };
  }, [layout.pos]);

  const handleToolSelect = (tool) => {
    if (!tool) return;
    if (tool.type === 'individual') {
      const newId = actions.createIndividual({ sex: tool.sex || 'U' });
      setSelectedId(newId);
      return;
    }
    if (!selectedId) {
      window.alert?.('Seleccioná un miembro para usar esta acción.');
      return;
    }
    const selectedIndividual = individualsById.get(selectedId);
    if (tool.type === 'add-parents') {
      const existingParents = parentsMapFull[selectedId] || {};
      if (existingParents.padreId || existingParents.madreId) {
        window.alert?.('Este miembro ya tiene padres registrados.');
        return;
      }
      actions.createParentsForChild(selectedId, { biological: true });
      return;
    }
    if (tool.type === 'link-partner') {
      const partnerSex =
        selectedIndividual?.sex === 'M' ? 'F' : selectedIndividual?.sex === 'F' ? 'M' : 'U';
      const partnerId = actions.createIndividual({ sex: partnerSex });
      actions.linkPartner(selectedId, partnerId);
      setSelectedId(partnerId);
      return;
    }
    if (tool.type === 'link-child') {
      const childId = actions.createIndividual({});
      const partnerCandidates = Array.from(partnerMap.get(selectedId) || []);
      const chosenPartnerId = partnerCandidates[0] || null;
      const { fatherId, motherId } = resolveParentIds(individualsById, selectedId, chosenPartnerId);
      const payload = {
        child: childId,
        biological: true,
        father: fatherId || null,
        mother: motherId || null,
      };
      if (!payload.father && !payload.mother) {
        payload.father = selectedId;
      }
      actions.linkParentChild(payload);
      setSelectedId(childId);
      return;
    }
    if (tool.type === 'link-sibling') {
      const parents = parentsMapFull[selectedId] || {};
      if (!parents.padreId && !parents.madreId) {
        window.alert?.('Asigná padres para poder agregar hermanos/as.');
        return;
      }
      const siblingId = actions.createIndividual({});
      actions.linkParentChild({
        father: parents.padreId || null,
        mother: parents.madreId || null,
        child: siblingId,
        biological: true,
      });
      setSelectedId(siblingId);
    }
  };

  const handleDropTool = (tool, point) => {
    if (!tool) return;
    if (tool.type === 'individual') {
      const newId = actions.createIndividual({ sex: tool.sex || 'U' });
      setSelectedId(newId);
      return;
    }
    const targetId = findNearestNodeId(point);
    if (!targetId) return;
    const targetDisplay = displayById.get(targetId);
    const existingParents = parentsMapFull[targetId] || {};

    if (tool.type === 'link-partner') {
      const partnerSex = targetDisplay?.shape === 'square' ? 'F' : targetDisplay?.shape === 'circle' ? 'M' : 'U';
      const partnerId = actions.createIndividual({ sex: partnerSex });
      actions.linkPartner(targetId, partnerId);
      setSelectedId(partnerId);
      return;
    }
    if (tool.type === 'add-parents') {
      if (existingParents.padreId || existingParents.madreId) {
        window.alert?.('Este miembro ya tiene padres registrados.');
        return;
      }
      actions.createParentsForChild(targetId, { biological: true });
      return;
    }
    if (tool.type === 'link-child') {
      const childId = actions.createIndividual({});
      const partnerCandidates = Array.from(partnerMap.get(targetId) || []);
      const chosenPartnerId = partnerCandidates[0] || null;
      const { fatherId, motherId } = resolveParentIds(individualsById, targetId, chosenPartnerId);
      const payload = {
        child: childId,
        biological: true,
        father: fatherId || null,
        mother: motherId || null,
      };
      if (!payload.father && !payload.mother) {
        payload.father = targetId;
      }
      actions.linkParentChild(payload);
      setSelectedId(childId);
      return;
    }
    if (tool.type === 'link-sibling') {
      if (!existingParents.padreId && !existingParents.madreId) return;
      const siblingId = actions.createIndividual({});
      actions.linkParentChild({
        father: existingParents.padreId || null,
        mother: existingParents.madreId || null,
        child: siblingId,
        biological: true,
      });
      setSelectedId(siblingId);
    }
  };

  const handlePartnerLineClick = ({ a, b, anchor }) => {
    const relation =
      engineState.relationships.find(
        (rel) =>
          rel.type === 'partner' &&
          ((rel.a === a && rel.b === b) || (rel.a === b && rel.b === a)),
      ) || { status: 'current', consanguinity: false };
    setRelationMenu({
      a,
      b,
      anchor,
      status: relation.status || 'current',
      consanguinity: !!relation.consanguinity,
    });
  };

  const handleRelationMenuClose = () => setRelationMenu(null);

  const handleRelationMenuChange = (patch) => {
    setRelationMenu((prev) => (prev ? { ...prev, ...patch } : prev));
    const current = relationMenu;
    if (!current) return;
    actions.updatePartnerRelationship(current.a, current.b, patch);
  };

  const handleExportJSON = () => {
    const payload = engine?.toClinicalJSON ? engine.toClinicalJSON() : engineState;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fam?.code || 'pedigree'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const svgEl = vp.svgRef.current;
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgMarkup = serializer.serializeToString(svgEl);
    const legendMap = engineState.legend || {};
    const legendList = legendUsage
      .map((key) => `<li>${legendLabelFor(key, legendMap)}</li>`)
      .join('');
    const html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Pedigrí ${fam?.code || ''}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #1e293b; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 14px; margin-top: 24px; }
          ul { margin: 0; padding-left: 20px; font-size: 12px; }
          .meta { font-size: 12px; margin-bottom: 16px; color: #475569; }
          .svg-wrapper { border: 1px solid #cbd5f5; padding: 12px; border-radius: 12px; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <h1>Pedigrí ${fam?.code || ''}</h1>
        <div class="meta">
          Motivo: ${metadata?.reason || '—'} · Registrado por: ${metadata?.recorder || '—'} · Historian: ${metadata?.historian || '—'}
        </div>
        <div class="svg-wrapper">${svgMarkup}</div>
        <h2>Leyenda</h2>
        <ul>${legendList}</ul>
        <h2>Privacidad</h2>
        <div class="meta">Nombres: ${metadata?.privacy?.names || 'initials'} · Fechas: ${metadata?.privacy?.dates || 'year-only'}</div>
      </body>
      </html>`;
    const printWindow = window.open('', '_blank', 'noopener');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const handleShowValidation = () => setShowValidation(true);

  // Limpiar selección si el individuo ya no existe
  useEffect(() => {
    if (selectedId && !displayById.has(selectedId)) {
      setSelectedId('');
    }
  }, [selectedId, displayById]);

  const vp = useViewport({
    width: Math.max(900, layout.width),
    height: Math.max(520, layout.height),
  });

  if (!fam) {
    return inline ? null : (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          No se encontró la familia.
        </div>
      </div>
    );
  }

  return (
    <div className={inline ? '' : 'p-6'}>
      {!inline && (
        <TreeTopbar
          fam={fam}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onBack={() => (window.location.hash = `#/family/${fam.id}`)}
          onFullscreen={vp.toggleFullscreen}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4 min-h-[calc(100vh-7rem)]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <TreeToolbar
            vp={vp}
            validationSummary={validationSummary}
            onShowValidation={handleShowValidation}
            onExportJSON={handleExportJSON}
            onExportPDF={handleExportPDF}
          />
          <PedigreePalette onToolSelect={handleToolSelect} />

          <PedigreeCanvas
            vp={vp}
            layout={layout}
            displayById={displayById}
            legend={engineState.legend}
            legendUsage={legendUsage}
            metadata={metadata}
            relationships={engineState.relationships}
            selectedId={selectedId}
            onSelect={setSelectedId}
            probandId={proband?.id || null}
            onDropTool={handleDropTool}
          />

          <div className="px-4 py-2 text-[11px] text-slate-500 border-t border-slate-200">
            Drag para desplazar, rueda para zoom. Atajos: <kbd>+</kbd>/<kbd>-</kbd>,{' '}
            <kbd>F</kbd> fullscreen, <kbd>R</kbd> reset. Split centra ramas materna/paterna.
          </div>
        </div>

        <MemberSidebar
          selectedId={selectedId}
          individualsById={individualsById}
          relationships={engineState.relationships}
          parentsMap={parentsMapFull}
          actions={actions}
          metadata={metadata}
          onSelect={setSelectedId}
        />
      </div>
      <ValidationPanel
        open={showValidation}
        items={validationSummary}
        onClose={() => setShowValidation(false)}
      />
      {relationMenu && (
        <RelationMenu
          relation={relationMenu}
          onClose={handleRelationMenuClose}
          onChange={handleRelationMenuChange}
        />
      )}
    </div>
  );
}

function buildDisplayById(individuals, metadata) {
  const privacy = metadata?.privacy || { names: 'initials', dates: 'year-only' };
  const map = new Map();
  (individuals || []).forEach((individual) => {
    if (!individual?.id) return;
    const shape = sexToShape(individual.sex);
    const shading = computeShading(individual);
    const name = formatName(individual, privacy.names);
    const infoLines = buildInfoLines(individual, privacy.dates);
    map.set(individual.id, {
      id: individual.id,
      shape,
      shading,
      name,
      role: individual.rol || '',
      infoLines,
      affected: individual.affected || { value: false, dx: [] },
      carrier: individual.carrier || { type: 'none', evidence: 'unknown' },
      evaluations: individual.evaluations || [],
      dead: !!individual.dead,
      deadInfo: individual.deadInfo || { year: null, note: null },
      bornYear: individual.bornYear,
      notes: individual.notes || '',
    });
  });
  return map;
}

function buildMembersForHooks(displayById) {
  const arr = [];
  displayById.forEach((entry, id) => {
    arr.push({
      id,
      sexo: shapeToSexo(entry.shape),
      nombre: entry.name,
      rol: entry.role,
      filiatorios: { iniciales: entry.name },
      simbolo: entry.shape,
      estado: entry.dead ? 'fallecido' : 'vivo',
      edadTexto: entry.infoLines.find((line) => line.startsWith('edad:'))?.replace('edad:', '') || '',
    });
  });
  return arr;
}

function relationshipsToPedigreeMap(relationships = []) {
  const map = {};
  relationships.forEach((relationship) => {
    if (relationship.type !== 'parentChild') return;
    const childId = relationship.child;
    if (!childId) return;
    const current = map[childId] || {
      padreId: '',
      madreId: '',
      biological: true,
      adoptive: false,
    };
    const padreId = relationship.father || current.padreId || '';
    const madreId = relationship.mother || current.madreId || '';
    map[childId] = {
      padreId,
      madreId,
      biological: current.biological && relationship.biological !== false,
      adoptive: current.adoptive || !!relationship.adoptive,
    };
  });
  return map;
}

function buildInfoLines(individual) {
  const lines = [];
  if (typeof individual.age === 'number') {
    lines.push(`edad:${individual.age}a`);
  }
  if (individual.bornYear) {
    lines.push(`b. ${individual.bornYear}`);
  }
  if (individual.dead) {
    lines.push(formatDeath(individual.deadInfo));
  }
  const evalLine = formatEvaluations(individual.evaluations);
  if (evalLine) lines.push(evalLine);
  const dxList = ensureArray(individual.affected?.dx);
  if (dxList.length) lines.push(`dx: ${dxList.join(', ')}`);
  return lines;
}

function formatEvaluations(evaluations = []) {
  if (!evaluations.length) return '';
  const parts = evaluations.map((evaluation) => {
    const code = evaluation.code || '';
    const result = evaluation.result || '';
    if (!code) return '';
    if (!result) return code;
    return `${code}${result.startsWith('+') || result.startsWith('-') ? result : ` (${result})`}`;
  }).filter(Boolean);
  return parts.length ? parts.join(' · ') : '';
}

function formatDeath(deadInfo) {
  if (!deadInfo) return 'd.';
  if (deadInfo.note) return deadInfo.note;
  if (deadInfo.year) return `d. ${deadInfo.year}`;
  return 'd.';
}

function formatName(individual, namesPrivacy) {
  if (namesPrivacy === 'full' && individual.nombre) return individual.nombre;
  const initials = individual?.filiatorios?.iniciales;
  if (initials) return initials;
  if (individual.nombre) {
    return individual.nombre
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0]?.toUpperCase() || '')
      .join('');
  }
  if (individual.label) return individual.label;
  return individual.id;
}

function sexToShape(sex) {
  if (sex === 'M') return 'square';
  if (sex === 'F') return 'circle';
  return 'diamond';
}

function shapeToSexo(shape) {
  if (shape === 'square') return 'M';
  if (shape === 'circle') return 'F';
  return '';
}

function computeShading(individual) {
  if (individual.affected?.value) return 'filled';
  if (individual.carrier?.type === 'AR') return 'half';
  if (individual.carrier?.type === 'X') return 'dot';
  return 'none';
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function legendLabelFor(key, legend = {}) {
  const map = {
    filled: legend.filled || 'Afectado clínicamente',
    halfFilled: legend.halfFilled || 'Portador AR',
    dot: legend.dot || 'Portador ligado al X',
    triangle: legend.triangle || 'Embarazo no a término',
    diamond: legend.diamond || 'Sexo no especificado',
  };
  return map[key] || key;
}

function RelationMenu({ relation, onClose, onChange }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handler = (event) => {
      if (!ref.current) return;
      if (!ref.current.contains(event.target)) onClose?.();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [onClose]);

  const { anchor } = relation;
  const isCurrent = relation.status !== 'ended';

  return (
    <div
      className="fixed z-50"
      style={{ left: anchor.x, top: anchor.y, transform: 'translate(-50%, -12px)' }}
    >
      <div
        ref={ref}
        className="rounded-2xl border border-slate-300 bg-white shadow-lg min-w-[200px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-4 py-2 text-xs font-semibold text-slate-700 border-b border-slate-200 uppercase tracking-wide">
          Editar vínculo
        </div>
        <div className="px-4 py-3 grid gap-3 text-xs text-slate-600">
          <label className="flex items-center justify-between gap-3">
            <span>Consanguinidad</span>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={relation.consanguinity}
              onChange={(event) =>
                onChange?.({ consanguinity: event.target.checked, status: relation.status })
              }
            />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>Relación vigente</span>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={isCurrent}
              onChange={(event) =>
                onChange?.({ status: event.target.checked ? 'current' : 'ended' })
              }
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function buildPartnerMap(relationships = [], individuals = []) {
  const map = new Map();
  const register = (a, b) => {
    if (!a || !b) return;
    if (!map.has(a)) map.set(a, new Set());
    if (!map.has(b)) map.set(b, new Set());
    map.get(a).add(b);
    map.get(b).add(a);
  };
  (relationships || []).forEach((rel) => {
    if (!rel || rel.type !== 'partner') return;
    register(rel.a, rel.b);
  });
  (individuals || []).forEach((ind) => {
    if (!ind?.id || !ind?.parejaDe) return;
    register(ind.id, ind.parejaDe);
  });
  return map;
}

function resolveParentIds(individualsById, primaryId, partnerId) {
  const result = { fatherId: null, motherId: null };
  const assign = (personId) => {
    if (!personId) return;
    const person = individualsById.get(personId);
    const sex = (person?.sex || '').toUpperCase();
    if (sex === 'M' && !result.fatherId) {
      result.fatherId = personId;
      return;
    }
    if (sex === 'F' && !result.motherId) {
      result.motherId = personId;
      return;
    }
    if (!result.fatherId) {
      result.fatherId = personId;
    } else if (!result.motherId && personId !== result.fatherId) {
      result.motherId = personId;
    }
  };
  assign(primaryId);
  assign(partnerId);
  return result;
}
