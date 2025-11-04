// ===============================
// src/modules/home/components/HomeHeader.jsx — Encabezado principal
// ===============================
import React from 'react';

export default function HomeHeader({ title, user, onLogout }) {
  const displayName =
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.email ||
    'Usuario';
  const primaryRole = user?.primaryRole ||
    (Array.isArray(user?.roles) && user.roles.length ? user.roles[0] : null);
  const roleLabel = primaryRole || '—';
  const licenseLabel =
    (typeof user?.licenseNumber === 'string' && user.licenseNumber.trim()) ||
    (typeof user?.matricula === 'string' && user.matricula.trim()) ||
    '—';

  return (
    <div className="flex flex-col gap-4 text-white md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <p className="text-xs text-white/70">Sesión: {user?.email}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm shadow-sm">
          <div className="font-semibold">{displayName}</div>
          <dl className="mt-1 space-y-1 text-xs text-white/80">
            <div className="flex gap-2">
              <dt className="text-white/60">Rol:</dt>
              <dd className="uppercase tracking-wide">{roleLabel || '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-white/60">Matrícula:</dt>
              <dd>{licenseLabel || '—'}</dd>
            </div>
          </dl>
        </div>
        <button
          onClick={onLogout}
          className="px-3 py-2 rounded-xl border border-white/40 !text-white hover:bg-white/10 transition"
        >
          Salir
        </button>
      </div>
    </div>
  );
}
