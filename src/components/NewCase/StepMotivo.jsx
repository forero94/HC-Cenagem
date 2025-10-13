// src/components/NewCase/StepMotivo.jsx
import React, { useMemo } from 'react';

export default function StepMotivo({ grupos, value, onChange }) {
  const current = useMemo(
    () => grupos.find((g) => g.id === value.motivoGroup),
    [grupos, value.motivoGroup],
  );
  const details = current?.options ?? [];

  return (
    <section className="grid gap-4">
      <header className="grid gap-2">
        <h2 className="text-sm font-semibold text-slate-700">Motivo de consulta</h2>
        <p className="text-xs text-slate-500 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <strong className="font-semibold text-slate-600">Paso 2 de 4:</strong> elegí primero el grupo general y luego
          el motivo puntual. Si no estás seguro, seleccioná lo que más se aproxime; podés ajustarlo más adelante.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="required flex flex-col gap-1">
          <span className="text-xs text-slate-500">Grupo</span>
          <select
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            aria-label="Grupo principal del motivo de consulta"
            value={value.motivoGroup}
            onChange={(e) => onChange({ motivoGroup: e.target.value, motivoDetail: '' })}
            required
          >
            <option value="">Seleccioná el grupo</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label className={`${current ? 'required ' : ''}md:col-span-2 flex flex-col gap-1`}>
          <span className="text-xs text-slate-500">Detalle</span>
          <select
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
            aria-label="Motivo puntual de la consulta"
            value={value.motivoDetail}
            onChange={(e) => onChange({ motivoDetail: e.target.value })}
            disabled={!current}
            required={Boolean(current)}
          >
            <option value="">
              {current ? 'Elegí el motivo puntual dentro del grupo' : 'Primero seleccioná el grupo'}
            </option>
            {details.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!current && (
        <p className="text-xs text-amber-600 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          Seleccioná un grupo para ver las opciones disponibles. Este paso ayuda a personalizar el resto del formulario.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Relato del paciente</span>
          <textarea
            className="rounded-xl border border-slate-300 px-3 py-2 min-h-[88px] text-sm"
            placeholder="Ej.: Consulta por retraso madurativo con dificultades en el lenguaje desde los 3 años."
            value={value.motivoPaciente || ''}
            onChange={(e) => onChange({ motivoPaciente: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Motivo de derivación</span>
          <textarea
            className="rounded-xl border border-slate-300 px-3 py-2 min-h-[88px] text-sm"
            placeholder="Ej.: Derivado por pediatría para evaluación genética."
            value={value.motivoDerivacion || ''}
            onChange={(e) => onChange({ motivoDerivacion: e.target.value })}
          />
        </label>
      </div>

      <footer className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Podés volver a este paso en cualquier momento usando los botones inferiores de navegación rápida.
      </footer>
    </section>
  );
}
