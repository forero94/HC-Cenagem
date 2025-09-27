import React from 'react';

export default function TreeTopbar({ fam, viewMode, setViewMode, onBack, onFullscreen }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <button
        onClick={onBack}
        className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
      >
        ← Volver
      </button>

      <h2 className="text-lg font-semibold">HC {fam.code} · Árbol familiar</h2>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <label className="inline-flex items-center gap-1">
            <input
              type="radio"
              name={`vm-${fam.id}`}
              checked={viewMode === 'foco'}
              onChange={() => setViewMode('foco')}
            /> Foco
          </label>
          <label className="inline-flex items-center gap-1 ml-2">
            <input
              type="radio"
              name={`vm-${fam.id}`}
              checked={viewMode === 'todo'}
              onChange={() => setViewMode('todo')}
            /> Todo
          </label>
        </div>

        <button
          onClick={onFullscreen}
          className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
          title="Pantalla completa (F)"
        >
          ⛶
        </button>
      </div>
    </div>
  );
}
