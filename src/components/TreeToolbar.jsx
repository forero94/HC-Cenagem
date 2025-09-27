import React from 'react';

export default function TreeToolbar({ vp }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200">
      <button
        className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-50"
        onClick={() => vp.setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)))}
      >
        -
      </button>
      <div className="text-xs text-slate-600 w-14 text-center">
        {(vp.zoom * 100).toFixed(0)}%
      </div>
      <button
        className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-50"
        onClick={() => vp.setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
      >
        +
      </button>
      <button
        className="ml-2 px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-50"
        onClick={vp.fit}
      >
        Fit
      </button>
      <div className="flex-1" />
      <button
        className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-50"
        onClick={() => vp.downloadSVG()}
      >
        Export SVG
      </button>
      <button
        className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-50"
        onClick={() => vp.downloadPNG()}
      >
        Export PNG
      </button>
    </div>
  );
}
