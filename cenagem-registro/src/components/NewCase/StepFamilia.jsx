import React from 'react';

const CONSANGUINIDAD_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'posible', label: 'Posible' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'desconocido', label: 'No refiere / Desconoce' },
];

export default function StepFamilia({
  value = {},
  secciones = [],
  onChange,
}) {
  const v = value;

  const set = (field) => (e) => {
    onChange?.(field, e.target.value);
  };

  const hasConfig = Array.isArray(secciones) && secciones.length > 0;
  const allowSection = (section) => !hasConfig || secciones.includes(section);
  const hasFamilia = allowSection('familia');
  const hasConsanguinidad = allowSection('consanguinidad') || hasFamilia;
  const hasAbuelos = allowSection('abuelos') || hasFamilia;

  return (
    <div className="grid gap-5">
      {hasFamilia && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-4">
          <header className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              Carga hereditaria principal
            </h2>
            <span className="text-[11px] text-slate-400">
              Describí hallazgos relevantes en la familia
            </span>
          </header>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">
              Malformaciones, discapacidad intelectual, TEA, epilepsia
            </span>
            <textarea
              className="rounded-xl border border-slate-300 px-3 py-2 min-h-[90px]"
              value={v.familiaAntecedentesNeuro || ''}
              onChange={set('familiaAntecedentesNeuro')}
              placeholder="Detallar familiares afectados, generación, diagnósticos previos, estudios realizados."
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">
                Abortos espontáneos, infertilidad o muerte fetal
              </span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                value={v.familiaAbortosInfertilidad || ''}
                onChange={set('familiaAbortosInfertilidad')}
                placeholder="Número de eventos, parentesco, causas identificadas o tratamientos."
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">
                Muertes neonatales o perinatales
              </span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                value={v.familiaMuertesNeonatales || ''}
                onChange={set('familiaMuertesNeonatales')}
                placeholder="Relatar edad gestacional, causa referida y relación parental."
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Otros datos heredofamiliares</span>
            <textarea
              className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
              value={v.familiaHistoriaGenetica || ''}
              onChange={set('familiaHistoriaGenetica')}
              placeholder="Enfermedades hereditarias conocidas, diagnósticos moleculares previos, portadores identificados."
            />
          </label>
        </section>
      )}

      {hasConsanguinidad && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-3">
          <h2 className="text-sm font-semibold text-slate-700">Consanguinidad</h2>

          <label className="flex flex-col gap-1 md:max-w-sm">
            <span className="text-xs text-slate-500">¿Existe consanguinidad entre los padres?</span>
            <select
              className="rounded-xl border border-slate-300 px-3 py-2"
              value={v.consanguinidad || 'no'}
              onChange={set('consanguinidad')}
            >
              {CONSANGUINIDAD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Detalle adicional</span>
            <textarea
              className="rounded-xl border border-slate-300 px-3 py-2 min-h-[70px]"
              value={v.consanguinidadDetalle || ''}
              onChange={set('consanguinidadDetalle')}
              placeholder="Describí parentesco, antepasados comunes, endogamia o comunidades cerradas."
            />
          </label>
        </section>
      )}

      {hasAbuelos && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm grid gap-4">
          <h2 className="text-sm font-semibold text-slate-700">Abuelos (D, E, F, G)</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Abuelos paternos</h3>
              <div className="grid gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Apellido D (abuelo)</span>
                  <input
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    value={v.abueloPaternoApellido || ''}
                    onChange={set('abueloPaternoApellido')}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Procedencia D</span>
                  <input
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    value={v.abueloPaternoProcedencia || ''}
                    onChange={set('abueloPaternoProcedencia')}
                    placeholder="Ciudad / país"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Apellido E (abuela)</span>
                  <input
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    value={v.abuelaPaternaApellido || ''}
                    onChange={set('abuelaPaternaApellido')}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Procedencia E</span>
                  <input
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    value={v.abuelaPaternaProcedencia || ''}
                    onChange={set('abuelaPaternaProcedencia')}
                    placeholder="Ciudad / país"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Abuelos maternos</h3>
              <div className="grid gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Apellido F (abuelo)</span>
                  <input
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    value={v.abueloMaternoApellido || ''}
                    onChange={set('abueloMaternoApellido')}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Procedencia F</span>
                  <input
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    value={v.abueloMaternoProcedencia || ''}
                    onChange={set('abueloMaternoProcedencia')}
                    placeholder="Ciudad / país"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Apellido G (abuela)</span>
                  <input
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    value={v.abuelaMaternaApellido || ''}
                    onChange={set('abuelaMaternaApellido')}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Procedencia G</span>
                  <input
                    className="rounded-xl border border-slate-300 px-3 py-2"
                    value={v.abuelaMaternaProcedencia || ''}
                    onChange={set('abuelaMaternaProcedencia')}
                    placeholder="Ciudad / país"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
