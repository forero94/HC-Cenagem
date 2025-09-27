// ===============================
// src/routes/FamilyTreePage.jsx — Árbol familiar / Pedigrí (modular)
// Orquesta: datos + selección + foco/todo + viewport + UI presentacional
// NO conoce detalles de stores internos; delega en hooks/components.
// ===============================
import React, { useState, useCallback } from 'react';

// ---- Hooks de orquestación (modulares) ----
import useFamilyData from '../hooks/useFamilyData';
import useInitialSelection from '../hooks/useInitialSelection';
import useAutoBootstrapParents from '../hooks/useAutoBootstrapParents';
import useMembersForLayout from '../hooks/useMembersForLayout';
import usePedigreeDerived from '../hooks/usePedigreeDerived';
import useViewport from '../hooks/useViewport';

// ---- Componentes presentacionales ----
import TreeTopbar from '../components/TreeTopbar';
import TreeToolbar from '../components/TreeToolbar';
import PedigreeCanvas from '../components/PedigreeCanvas';
import MemberSidebar from '../components/MemberSidebar';

export default function FamilyTreePage({ familyId, inline = false }) {
  // 1) Datos base + sandbox (fachada única)
  const {
    fam,
    basePedigree,
    mergedMembers,
    mergedPedigree,
    // acciones sandbox
    cloneFromBase,
    addParentsBoth,
    addSibling,
    addChild,
    addPartner,
    setParentDraft,
    resetDraft,
  } = useFamilyData(familyId);

  // Redirección si entran por hash sin prop
  React.useEffect(() => {
    if (!familyId) {
      const h = (window.location.hash || '').replace(/^#\/?/, '');
      const [, id] = h.split('/');
      if (id && !fam) window.location.hash = `#/family/${id}/tree`;
    }
  }, [familyId, fam]);

  // 2) Selección + modo de vista
  const [selectedId, setSelectedId] = useState('');
  const [viewMode, setViewMode] = useState('todo'); // 'todo' | 'foco'
  useInitialSelection(mergedMembers, selectedId, setSelectedId);

  // 3) Resolver qué miembros entran al layout (foco o todo)
  //    Nota: este hook necesita conocer el proband/parentsMap; los obtiene
  //    internamente del mergedPedigree y mergedMembers completos.
  const membersForLayout = useMembersForLayout({
    viewMode,
    // estos dos se resolverán dentro usando merged* completos:
    proband: undefined,
    parentsMap: undefined,
    mergedMembers,
    mergedPedigree,
    maxDepth: 5,
  });

  // 4) Derivados de pedigrí + layout completo (ya incluye childLines/couples/sides)
  const { proband, membersById, parentsMap, layout } = usePedigreeDerived(
    membersForLayout,
    mergedPedigree
  );

  // 5) Bootstrap automático: si el proband no tiene padres, clona base o crea ambos
  useAutoBootstrapParents({
    familyKey: fam?.id,
    proband,
    parentsMap,
    basePedigree,
    mergedMembers,
    setParentDraft,
    cloneFromBase,
    addParentsBoth,
    setSelectedMemberId: setSelectedId,
  });


  // 6) Viewport (zoom/pan/fit/export)
  const vp = useViewport({
    width: Math.max(800, layout.width),
    height: Math.max(480, layout.height),
  });

  // 7) Asignación de padre/madre para el panel lateral (sandbox-only)
  const onAssignParent = useCallback(
    (childId, parentType, newParentId) => {
      if (!childId) return;
      if (newParentId === childId) return;
      // evita duplicar mismo progenitor como padre y madre
      const otherType = parentType === 'padreId' ? 'madreId' : 'padreId';
      const existingOther = mergedPedigree?.[childId]?.[otherType];
      if (existingOther && existingOther === newParentId) return;
      setParentDraft(childId, parentType, newParentId || '');
    },
    [mergedPedigree, setParentDraft]
  );

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
      {/* Topbar (volver, título, foco/todo, fullscreen) */}
      {!inline && (
        <TreeTopbar
          fam={fam}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onBack={() => (window.location.hash = `#/family/${fam.id}`)}
          onFullscreen={vp.toggleFullscreen}
        />
      )}

      {/* MAIN GRID: Canvas izquierda + Sidebar derecha */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 min-h-[calc(100vh-6rem)]">
        {/* Lienzo del árbol */}
        <div className="rounded-2xl border border-slate-200 bg-white p-0 shadow-sm overflow-hidden">
          {/* Toolbar (zoom/fit/export) */}
          <TreeToolbar vp={vp} />

          {/* SVG Canvas por capas (líneas de pareja, líneas a hijos, nodos) */}
          <PedigreeCanvas
            vp={vp}
            layout={layout}
            membersById={membersById}
            proband={proband}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          <div className="px-4 py-2 text-[11px] text-slate-500 border-t border-slate-200">
            Drag para desplazar, rueda para zoom. Atajos: <kbd>+</kbd>/<kbd>-</kbd>,{' '}
            <kbd>F</kbd> fullscreen, <kbd>R</kbd> reset. El split centra ramas
            materna/paterna respecto al Proband.
          </div>
        </div>

        {/* Panel lateral: datos (solo lectura) + sandbox de vínculos */}
        <MemberSidebar
          activeId={selectedId}
          mergedMembers={mergedMembers}
          mergedPedigree={mergedPedigree}
          onAssignParent={onAssignParent}
          actions={{
            cloneFromBase,
            resetDraft,
            addParentsBoth: (id) => {
              addParentsBoth(id);
              setSelectedId(id);
            },
            addSibling: (id) => {
              const sibId = addSibling(id);
              if (sibId) setSelectedId(sibId);
            },
            addPartner: (id) => {
              const partnerId = addPartner(id);
              if (partnerId) setSelectedId(partnerId);
            },
            addChild: (id, sexo) => addChild(id, sexo),
            setSelectedId,
          }}
        />
      </div>

      {/* Footer de retorno (solo vista no-embed) */}
      {!inline && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-white/90 backdrop-blur border-t border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                window.location.hash = `#/family/${fam.id}`;
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 shadow-sm"
            >
              ↩ Volver a HC
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
