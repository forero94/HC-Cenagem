import React from 'react';

const LEVEL_CLASS = {
  error: 'border-amber-500 bg-amber-50 text-amber-800',
  warning: 'border-amber-300 bg-amber-50 text-amber-700',
  suggestion: 'border-slate-300 bg-slate-50 text-slate-600',
};

export default function ValidationPanel({ open, onClose, items = [] }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <div className="text-sm font-semibold text-slate-800">Validación NSGC</div>
            <div className="text-xs text-slate-500">{items.length} hallazgos</div>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-sm"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        <div className="max-h-[480px] overflow-auto p-5 space-y-3 text-sm">
          {items.length === 0 && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              Sin observaciones. Cumple con NSGC 2008.
            </div>
          )}
          {items.map((item, index) => (
            <div
              key={`${item.code || 'issue'}-${index}`}
              className={`rounded-xl border px-4 py-3 ${LEVEL_CLASS[item.level] || LEVEL_CLASS.suggestion}`}
            >
              <div className="text-xs uppercase tracking-wide mb-1">
                {item.level === 'error' && 'Error obligatorio'}
                {item.level === 'warning' && 'Advertencia'}
                {item.level === 'suggestion' && 'Sugerencia'}
              </div>
              <div className="text-sm font-medium">{item.message}</div>
              {item.path && (
                <div className="text-xs mt-1 opacity-70">Ruta: {Array.isArray(item.path) ? item.path.join(' › ') : item.path}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

