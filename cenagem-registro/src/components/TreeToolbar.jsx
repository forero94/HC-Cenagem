import React from 'react';

export default function TreeToolbar({
  vp,
  validationSummary = [],
  onShowValidation,
  onExportJSON,
  onExportPDF,
}) {
  const errorCount = validationSummary.filter((item) => item.level === 'error').length;
  const warningCount = validationSummary.filter((item) => item.level === 'warning').length;
  const suggestionCount = validationSummary.filter((item) => item.level === 'suggestion').length;
  const hasIssues = errorCount + warningCount + suggestionCount > 0;

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
        className={`hidden md:flex items-center gap-2 text-[11px] rounded-full border px-3 py-1 ${
          hasIssues
            ? 'border-amber-300 bg-amber-50 text-amber-700'
            : 'border-emerald-300 bg-emerald-50 text-emerald-700'
        }`}
        title="Validación NSGC en vivo"
        onClick={onShowValidation}
      >
        <span>NSGC</span>
        <span className="font-semibold">{errorCount}</span>
        <span className="text-amber-700/80">err</span>
        <span className="font-semibold">{warningCount}</span>
        <span className="text-amber-700/60">warn</span>
        <span className="font-semibold">{suggestionCount}</span>
        <span className="text-amber-700/40">hint</span>
      </button>
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
      <button
        className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-50"
        onClick={onExportJSON}
      >
        Export JSON
      </button>
      <button
        className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-50"
        onClick={onExportPDF}
      >
        Export PDF
      </button>
    </div>
  );
}
