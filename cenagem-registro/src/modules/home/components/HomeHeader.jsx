// ===============================
// src/modules/home/components/HomeHeader.jsx — Encabezado principal
// ===============================
import React from 'react';

export default function HomeHeader({ title, user, onLogout, onProfileClick }) {
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
  const documentLabel =
    (typeof user?.documentNumber === 'string' && user.documentNumber.trim()) ||
    '—';

  const canUseWindow = typeof window !== 'undefined';
  const isProfileClickable = typeof onProfileClick === 'function' || canUseWindow;
  const handleProfileClick = () => {
    if (typeof onProfileClick === 'function') {
      onProfileClick();
      return;
    }
    if (canUseWindow) {
      window.location.hash = '#/profile';
    }
  };

  return (
    <div className="flex flex-col gap-4 text-white md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <p className="text-xs text-white/70">Sesión: {user?.email}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          aria-label={isProfileClickable ? 'Abrir perfil personal' : undefined}
          onClick={isProfileClickable ? handleProfileClick : undefined}
          className={`rounded-2xl border px-4 py-3 text-left text-sm shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 ${
            isProfileClickable
              ? 'cursor-pointer border-white/60 bg-white/15 hover:-translate-y-0.5 hover:border-white/80 hover:bg-white/25 active:translate-y-0'
              : 'cursor-default border-white/20 bg-white/10 opacity-90'
          }`}
        >
          <div className="font-semibold text-white">{displayName}</div>
          <dl className="mt-2 space-y-1 text-xs text-white/90">
            <div className="flex gap-2">
              <dt className="text-white/80">Rol:</dt>
              <dd className="uppercase tracking-wide text-white">{roleLabel || '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-white/80">Matrícula:</dt>
              <dd className="text-white">{licenseLabel || '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-white/80">DNI:</dt>
              <dd className="text-white">{documentLabel}</dd>
            </div>
          </dl>
        </button>
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
