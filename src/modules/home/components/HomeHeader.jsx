// ===============================
// src/modules/home/components/HomeHeader.jsx — Encabezado principal
// ===============================
import React from 'react';

export default function HomeHeader({ title, user, onLogout, onReset }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-xs text-slate-500">Sesión: {user?.email}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
        >
          Restablecer demo
        </button>
        <button
          onClick={onLogout}
          className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50"
        >
          Salir
        </button>
      </div>
    </div>
  );
}
