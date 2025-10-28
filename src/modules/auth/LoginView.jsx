// src/modules/auth/LoginView.jsx
import React, { useState } from 'react';
import Button from '@/modules/shared/ui/Button';
import TextInput from '@/modules/shared/ui/TextInput';
import { login } from './useAuth';

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      onLogin(user);
    } catch (err) {
      const message =
        err?.message && typeof err.message === 'string'
          ? err.message
          : 'Credenciales inválidas';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-gradient-to-br from-slate-50 to-slate-100 grid place-items-center p-6">
      <div className="w-[min(960px,100%)] grid md:grid-cols-2 gap-6 items-stretch">
        {/* Panel de login */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {/* Header compacto */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white grid place-items-center font-semibold">
              CG
            </div>
            <div>
              <h1 className="text-lg font-semibold">CENAGEM · Registro</h1>
              <p className="text-xs text-slate-500">Demo interna · No ingresar datos reales</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-1">Iniciar sesión</h2>
          <p className="text-sm text-slate-500 mb-4">Autenticación local de demostración.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Email: TextInput entrega el valor (string) */}
            <TextInput
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="usuario@cenagem.ar"
              autoComplete="username"
              autoFocus
            />

            {/* Password con toggle de visibilidad */}
            <label className="flex flex-col gap-1">
              <span className="text-sm text-slate-700">Contraseña</span>
              <div className="flex gap-2">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="btn btn-outline text-sm"
                  aria-pressed={show}
                >
                  {show ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </label>

            {error && <div className="text-sm text-rose-600">{error}</div>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Ingresando…' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-4 text-xs text-slate-500">
            <p>
              Demo:
              <span className="ml-2 font-mono">admin@cenagem.ar / CENAGEM2025!</span>
            </p>
          </div>
        </section>

        {/* Panel informativo */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Acerca del MVP</h3>
          <ul className="text-sm text-slate-600 space-y-2">
            <li>• Login local (demo), sesión en localStorage.</li>
            <li>• HC familiar y módulo de pacientes en construcción.</li>
            <li>• Fácil de migrar a backend real (reemplazando el adapter).</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
