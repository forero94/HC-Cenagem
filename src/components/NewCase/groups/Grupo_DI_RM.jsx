// src/components/NewCase/groups/Grupo_DI_RM.jsx
import React from 'react';

export default function Grupo_DI_RM({ value, onChange }) {
  const v = value || {};
  const set = (k) => (e) => onChange?.(k, e.target.value);

  return (
    <div className="grid gap-4">
      <h2 className="text-sm font-semibold text-slate-700">Detalles específicos — Déficit intelectual / retraso madurativo</h2>
      <p className="text-xs text-slate-500">
        Complementá con estudios neurológicos y apoyos terapéuticos relevantes para el abordaje integral del paciente.
      </p>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">EEG</span>
          <textarea
            className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]"
            value={v.ndEEG || ''}
            onChange={set('ndEEG')}
            placeholder="Fecha, motivo, hallazgos relevantes"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">RMN / neuroimágenes</span>
          <textarea
            className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]"
            value={v.ndRMN || ''}
            onChange={set('ndRMN')}
            placeholder="Malformaciones, lesiones estructurales, seguimiento"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Otros estudios neurológicos</span>
          <textarea
            className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]"
            value={v.ndEstudiosOtros || ''}
            onChange={set('ndEstudiosOtros')}
            placeholder="Potenciales evocados, metabolismo cerebral, estudios genéticos dirigidos"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Interconsultas / evaluaciones</span>
          <textarea
            className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
            value={v.ndInterconsultas || ''}
            onChange={set('ndInterconsultas')}
            placeholder="Neurología, psicopedagogía, fonoaudiología, terapia ocupacional…"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Apoyos y tratamientos en curso</span>
          <textarea
            className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
            value={v.ndApoyos || ''}
            onChange={set('ndApoyos')}
            placeholder="Medicaciones, terapias, acompañamiento escolar, apoyos comunitarios"
          />
        </label>
      </div>
    </div>
  );
}
