import React from 'react';

export default function AppFooter() {
  return (
    <footer className="bg-slate-100 p-4 text-slate-600 text-sm flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-slate-200">
      <div className="flex flex-col items-center">
        <span className="text-xs uppercase tracking-wide text-slate-500">Consultas hoy</span>
        <span className="font-semibold">0</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-xs uppercase tracking-wide text-slate-500">Pendientes</span>
        <span className="font-semibold">0</span>
        <span className="text-[11px] text-slate-500">Turnos sin marcar como atendidos</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-xs uppercase tracking-wide text-slate-500">Familias activas</span>
        <span className="font-semibold">14</span>
        <span className="text-[11px] text-slate-500">Historias familiares cargadas</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-xs uppercase tracking-wide text-slate-500">Seguimiento >60 días</span>
        <span className="font-semibold">0</span>
        <span className="text-[11px] text-slate-500">Probands a revisar</span>
      </div>
    </footer>
  );
}
