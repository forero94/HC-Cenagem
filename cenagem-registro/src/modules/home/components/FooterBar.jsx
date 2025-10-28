// ===============================
// src/modules/home/components/FooterBar.jsx — Acceso rápido a analíticas
// ===============================
import React from 'react';

export default function FooterBar({ onAnalytics }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-20 bg-white/90 backdrop-blur border-t border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-center">
        <button
          onClick={onAnalytics}
          className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 shadow-sm"
        >
          📊 Análisis de datos
        </button>
      </div>
    </div>
  );
}
