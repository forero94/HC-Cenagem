import React from 'react';
import HomeHeader from '@/modules/home/components/HomeHeader.jsx';

const InfoCard = ({ label, value }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
    <div className="text-xs font-semibold uppercase tracking-wide text-white/70">{label}</div>
    <div className="mt-1 text-base text-white">{value || '—'}</div>
  </div>
);

export default function ProfilePage({ user, onLogout, onBack = () => { window.location.hash = ''; } }) {
  const displayName =
    user?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.email ||
    'Usuario';
  const primaryRole = user?.primaryRole ||
    (Array.isArray(user?.roles) && user.roles.length ? user.roles[0] : null);
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const documentLabel =
    (typeof user?.documentNumber === 'string' && user.documentNumber.trim()) ||
    '—';
  const licenseLabel =
    (typeof user?.licenseNumber === 'string' && user.licenseNumber.trim()) ||
    (typeof user?.matricula === 'string' && user.matricula.trim()) ||
    '—';

  return (
    <div className="app-shell grid gap-6 p-6 text-white">
      <HomeHeader title="Mi perfil" user={user} onLogout={onLogout} />

      <section className="grid gap-4 rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-lg backdrop-blur-sm md:grid-cols-2">
        <InfoCard label="Nombre completo" value={displayName} />
        <InfoCard label="Correo electrónico" value={user?.email || '—'} />
        <InfoCard label="Rol principal" value={primaryRole || '—'} />
        <InfoCard label="DNI" value={documentLabel} />
        <InfoCard label="Matrícula / Licencia" value={licenseLabel} />
      </section>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow">
        <div>
          <h2 className="text-base font-semibold text-white">Roles asignados</h2>
          <p className="text-sm text-white/70">Controlá qué permisos tenés dentro de CENAGEM.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {roles.length ? (
            roles.map((role) => (
              <span
                key={role}
                className="rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
              >
                {role}
              </span>
            ))
          ) : (
            <p className="text-sm text-white/70">No hay roles asignados.</p>
          )}
        </div>
        <div className="grid gap-2">
          <h3 className="text-sm font-semibold text-white">Permisos</h3>
          {permissions.length ? (
            <ul className="list-disc pl-6 text-sm text-white/90">
              {permissions.map((permission) => (
                <li key={permission}>{permission}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/70">Sin permisos adicionales.</p>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-white/80 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
        >
          ← Volver al inicio
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl border border-rose-300 bg-rose-500/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500/30"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
