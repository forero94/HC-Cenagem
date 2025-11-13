import React, { useState } from 'react';
import Button from '@/modules/shared/ui/Button';
import TextInput from '@/modules/shared/ui/TextInput';
import { login } from './useAuth';
import Lottie from 'lottie-react';
import dnaHelixAnimationData from '@/assets/dna-helix-lottie.json';
import CENAGEMLogo from '@/assets/CENAGEM logo.png';
import MalbranLogo from '@/assets/Malbran logo.png';
import CENAGEMSolo from '@/assets/CENAGEM solo.png';



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
      onLogin?.(user);
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
    <main className="min-h-dvh grid md:grid-cols-2 place-items-center p-6 relative overflow-hidden" style={{ backgroundColor: '#232d4f' }}>
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-4 z-20">
        <img src={CENAGEMLogo} alt="CENAGEM Logo" className="h-28" />
        <img src={MalbranLogo} alt="Malbran Logo" className="h-28" />
      </div>

      <div className="hidden md:flex items-center justify-center w-full h-full">
        <Lottie
          animationData={dnaHelixAnimationData}
          loop={true}
          autoplay={true}
          style={{ width: 10400, height: 400 }}
        />
      </div>
      <div className="w-[min(960px,100%)] flex items-center justify-center relative z-10">
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm w-full max-w-md">
          <div className="flex items-center gap-3 mb-3">
            <img src={CENAGEMSolo} alt="CenagemSolo" className="h-12" />
            <div>
              <h1 className="text-lg font-semibold">CENAGEM · Historia Clinica Electronica</h1>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-1">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <TextInput
              label="Usuario"
              type="text"
              value={email}
              onChange={setEmail}
              placeholder="usuario@cenagem.gob.ar"
              autoComplete="email"
              autoFocus
            />

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

        </section>
      </div>
    </main>
  );
}



