import React, { useMemo } from 'react';

/**
 * Props:
 *  - activeId
 *  - mergedMembers: []
 *  - mergedPedigree: { [childId]: { padreId, madreId } }
 *  - onAssignParent(childId, 'padreId'|'madreId', newId)
 *  - actions: {
 *      cloneFromBase, resetDraft, addParentsBoth, addSibling, addPartner, addChild, setSelectedId
 *    }
 */
export default function MemberSidebar({
  activeId,
  mergedMembers,
  mergedPedigree,
  onAssignParent,
  actions,
}) {
  const active = useMemo(() => mergedMembers.find((m) => m.id === activeId) || null, [mergedMembers, activeId]);

  const yearsSince = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const n = new Date();
    let y = n.getFullYear() - d.getFullYear();
    const m = n.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && n.getDate() < d.getDate())) y--;
    return `${y}`;
  };

  if (!activeId || !active) {
    return (
      <aside className="w-full md:w-80 md:justify-self-end">
        <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-auto border-l border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Seleccioná un miembro para ver detalle.</div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full md:w-80 md:justify-self-end">
      <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-auto border-l border-slate-200 bg-white p-4">
        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Análisis de miembro</div>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
              sandbox · no persiste
            </span>
          </div>

          {/* Datos demográficos (solo lectura) */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Nombre</label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50"
              value={active.nombre || ''}
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Edad (años)</label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50"
                value={yearsSince(active.nacimiento) || ''}
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Estado</label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50"
                value={active.estado || 'vivo'}
                disabled
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Sexo</label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50"
                value={active.sexo || '—'}
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Símbolo</label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50"
                value={active.simbolo || 'auto'}
                disabled
              />
            </div>
          </div>

          <div className="h-px bg-slate-200 my-1" />

          {/* Vínculos sandbox */}
          <div className="text-xs text-slate-600">Vínculos (sandbox — no persiste)</div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Padre</label>
              <div className="flex items-center gap-2">
                <select
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  value={mergedPedigree?.[active.id]?.padreId || ''}
                  onChange={(e) => onAssignParent(active.id, 'padreId', e.target.value || '')}
                >
                  <option value="">—</option>
                  {mergedMembers
                    .filter((x) => x.sexo === 'M' && x.id !== active.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre || p.filiatorios?.iniciales || p.id.slice(0, 6)}
                      </option>
                    ))}
                </select>
                <button
                  className="px-2 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
                  title="Limpiar padre"
                  onClick={() => onAssignParent(active.id, 'padreId', '')}
                >
                  ✕
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">Madre</label>
              <div className="flex items-center gap-2">
                <select
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  value={mergedPedigree?.[active.id]?.madreId || ''}
                  onChange={(e) => onAssignParent(active.id, 'madreId', e.target.value || '')}
                >
                  <option value="">—</option>
                  {mergedMembers
                    .filter((x) => x.sexo === 'F' && x.id !== active.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre || m.filiatorios?.iniciales || m.id.slice(0, 6)}
                      </option>
                    ))}
                </select>
                <button
                  className="px-2 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
                  title="Limpiar madre"
                  onClick={() => onAssignParent(active.id, 'madreId', '')}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Resumen rápido */}
          <div className="text-[11px] text-slate-500 mt-1">
            {(() => {
              const pid = mergedPedigree?.[active.id]?.padreId || '';
              const mid = mergedPedigree?.[active.id]?.madreId || '';
              const pN = pid ? mergedMembers.find((x) => x.id === pid)?.nombre || pid.slice(0, 6) : '—';
              const mN = mid ? mergedMembers.find((x) => x.id === mid)?.nombre || mid.slice(0, 6) : '—';
              return `Padre: ${pN} · Madre: ${mN}`;
            })()}
          </div>

          <div className="h-px bg-slate-200 my-1" />

          {/* Acciones sandbox */}
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
              onClick={actions.cloneFromBase}
            >
              Clonar desde base
            </button>
            <button
              className="px-3 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900"
              onClick={actions.resetDraft}
            >
              Descartar sandbox
            </button>
          </div>

          <div className="h-px bg-slate-200 my-2" />

          <div className="text-xs text-slate-600">Agregar vínculo (sandbox)</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="px-3 py-2 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 col-span-2"
              onClick={() => actions.addParentsBoth(active.id)}
            >
              + Padres (ambos)
            </button>

            <button
              className="px-3 py-2 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900"
              onClick={() => {
                const id = actions.addSibling(active.id);
                if (id) actions.setSelectedId(id);
              }}
            >
              + Hermano/a
            </button>

            <button
              className="px-3 py-2 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900"
              onClick={() => {
                const id = actions.addPartner(active.id);
                if (id) actions.setSelectedId(id);
              }}
            >
              + Pareja
            </button>

            <button
              className="px-3 py-2 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 col-span-2"
              onClick={() => actions.addChild(active.id, active.sexo)}
            >
              Hijo/a
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            Este panel modifica solo el pedigrí del Árbol (local por familia). La HC real no se toca.
          </div>
        </div>
      </div>
    </aside>
  );
}
