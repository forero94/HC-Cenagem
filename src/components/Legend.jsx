import React from 'react';

export default function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-slate-600">
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-4 border border-slate-700 rounded-sm" />
        <span>Masculino</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-4 border border-slate-700 rounded-full" />
        <span>Femenino</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-4 border border-slate-700 rotate-45" />
        <span>Sexo no registrado</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-2 h-2 bg-slate-900 rounded-full" />
        <span>Proband</span>
      </div>
    </div>
  );
}
