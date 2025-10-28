// ===============================
// src/modules/home/components/MetricsBoard.jsx — Tarjetas de métricas
// ===============================
import React from 'react';

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-1">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint && <div className="text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}

export default function MetricsBoard({ metrics }) {
  if (!Array.isArray(metrics) || !metrics.length) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} label={metric.label} value={metric.value} hint={metric.hint} />
      ))}
    </div>
  );
}
