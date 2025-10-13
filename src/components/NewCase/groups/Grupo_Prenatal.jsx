import React from 'react';

export default function Grupo_Prenatal({ value, onChange }) {
  const v = value || {};
  const set = (k) => (e) => onChange?.(k, e.target.value);
  const inputProps = (k) => ({
    value: v[k] || '',
    onChange: set(k),
  });

  return (
    <section className="grid gap-4">
      <div className="grid gap-1">
        <h2 className="text-sm font-semibold text-slate-700">Evaluación prenatal</h2>
        <p className="text-xs text-slate-500">
          Registrá de forma estructurada la entrevista prenatal y los estudios realizados.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            1. Datos de identificación
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Nombre completo</span>
              <input
                type="text"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Nombre y apellido"
                {...inputProps('identificacionNombre')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Edad</span>
              <input
                type="text"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Años cumplidos"
                {...inputProps('identificacionEdad')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Documento / DNI</span>
              <input
                type="text"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Número de documento"
                {...inputProps('identificacionDni')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Cobertura</span>
              <input
                type="text"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Obra social, prepaga, sin cobertura"
                {...inputProps('identificacionCobertura')}
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs text-slate-500">Domicilio</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[60px]"
                placeholder="Calle, número, localidad"
                {...inputProps('identificacionDomicilio')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Fecha de consulta</span>
              <input
                type="date"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                {...inputProps('identificacionFechaConsulta')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">FUM (fecha de última menstruación)</span>
              <input
                type="date"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                {...inputProps('identificacionFum')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Edad gestacional actual</span>
              <input
                type="text"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Semanas + días"
                {...inputProps('identificacionEdadGestacional')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Método de cálculo</span>
              <input
                type="text"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="FUM, ecografía, FIV, etc."
                {...inputProps('identificacionMetodoCalculo')}
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs text-slate-500">Motivo de consulta</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                placeholder="Control rutinario, antecedentes familiares, cribado positivo, ecografía alterada, etc."
                {...inputProps('identificacionMotivoConsulta')}
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            2. Antecedentes personales de la gestante
          </h3>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <span className="text-xs font-semibold text-slate-600">a. Médicos generales</span>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Enfermedades crónicas</span>
                  <textarea
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                    placeholder="Diabetes, hipertensión, epilepsia, asma, autoinmunes"
                    {...inputProps('antecedentesMedicosCronicos')}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Cirugías / transfusiones / hospitalizaciones</span>
                  <textarea
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                    placeholder="Detalle procedimientos previos relevantes"
                    {...inputProps('antecedentesCirugias')}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Medicación actual y durante el embarazo</span>
                  <textarea
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                    placeholder="Nombre, dosis y trimestre de uso"
                    {...inputProps('antecedentesMedicaciones')}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Consumo de tabaco, alcohol o drogas</span>
                  <textarea
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                    placeholder="Frecuencia, tipo de sustancia, exposición laboral o tóxicos"
                    {...inputProps('antecedentesConsumo')}
                  />
                </label>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-xs text-slate-500">Vacunas aplicadas</span>
                  <textarea
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                    placeholder="Rubéola, hepatitis, COVID, gripe, otras"
                    {...inputProps('antecedentesVacunas')}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-3">
              <span className="text-xs font-semibold text-slate-600">b. Gineco-obstétricos</span>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Edad de menarca y ciclos</span>
                  <input
                    type="text"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Menarca, regularidad menstrual"
                    {...inputProps('antecedentesMenarca')}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Métodos anticonceptivos previos</span>
                  <textarea
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[60px]"
                    placeholder="Tipos usados y tiempo hasta concepción"
                    {...inputProps('antecedentesMetodoAnticonceptivo')}
                  />
                </label>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-xs text-slate-500">Historia obstétrica (G P A C)</span>
                  <textarea
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                    placeholder="Detalle de gestas, partos, abortos, cesáreas"
                    {...inputProps('antecedentesHistoriaObstetrica')}
                  />
                </label>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-xs text-slate-500">Complicaciones obstétricas previas</span>
                  <textarea
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                    placeholder="Preeclampsia, parto pretérmino, óbito, RCIU, malformaciones"
                    {...inputProps('antecedentesComplicacionesPrevias')}
                  />
                </label>
                <label className="flex flex-col gap-1 md:col-span-2">
                  <span className="text-xs text-slate-500">Abortos espontáneos o inducidos</span>
                  <textarea
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                    placeholder="Cantidad, edad gestacional y estudios realizados"
                    {...inputProps('antecedentesAbortos')}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-3">
              <span className="text-xs font-semibold text-slate-600">c. Familiares personales relevantes</span>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Consanguinidad con la pareja</span>
                  <input
                    type="text"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Parentesco y origen común"
                    {...inputProps('antecedentesConsanguinidad')}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">Etnia u origen geográfico</span>
                  <input
                    type="text"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Riesgos específicos según origen"
                    {...inputProps('antecedentesEtnia')}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            3. Antecedentes familiares
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs text-slate-500">Historia genética y hereditaria</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
                placeholder="Malformaciones, discapacidad intelectual, autismo, metabolopatías, cardiopatías, muertes neonatales"
                {...inputProps('familiaHistoriaGenetica')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Abortos recurrentes en la familia</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                placeholder="Líneas afectadas y relación con la paciente"
                {...inputProps('familiaAbortosRecurrentes')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Portadores conocidos</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                placeholder="Translocaciones, aneuploidías, síndromes genéticos, enfermedades monogénicas"
                {...inputProps('familiaPortadores')}
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs text-slate-500">Cáncer familiar</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                placeholder="Cáncer temprano o agrupado por tipo, relación con la familia"
                {...inputProps('familiaCancer')}
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs text-slate-500">Árbol genealógico</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
                placeholder="Pedigrí de tres generaciones, incluir abortos, fallecidos y consanguinidad"
                {...inputProps('familiaArbolGenealogico')}
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            4. Antecedentes del padre / pareja
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Edad</span>
              <input
                type="text"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Años cumplidos"
                {...inputProps('parejaEdad')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Ocupación y exposiciones</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[60px]"
                placeholder="Exposición laboral a tóxicos o radiaciones"
                {...inputProps('parejaOcupacion')}
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs text-slate-500">Antecedentes médicos relevantes</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                placeholder="Genéticos, hematológicos, neurológicos, psiquiátricos"
                {...inputProps('parejaAntecedentesMedicos')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Consumo de tabaco, alcohol o drogas</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[60px]"
                placeholder="Frecuencia y tipo de sustancia"
                {...inputProps('parejaConsumo')}
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs text-slate-500">Historia familiar del padre / pareja</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                placeholder="Antecedentes genéticos o enfermedades relevantes en su familia"
                {...inputProps('parejaHistoriaFamiliar')}
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            5. Evolución del embarazo actual
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Semana de diagnóstico y tipo de control</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[60px]"
                placeholder="Semana de confirmación, controles realizados"
                {...inputProps('embarazoControlPrenatal')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Suplementación</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[60px]"
                placeholder="Ácido fólico, yodo, vitaminas u otros"
                {...inputProps('embarazoSuplementacion')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Infecciones o enfermedades intercurrentes</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                placeholder="TORCH, ITS, COVID, gripe u otras"
                {...inputProps('embarazoInfecciones')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Eventos durante el embarazo</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                placeholder="Sangrados, fiebre, exposición a fármacos o radiaciones"
                {...inputProps('embarazoEventos')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Peso materno y tensión arterial</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[60px]"
                placeholder="Peso inicial y actual, TA en controles"
                {...inputProps('embarazoPesoTension')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Movimientos fetales y contracciones</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[60px]"
                placeholder="Percepción de movimientos, dinámica uterina"
                {...inputProps('embarazoMovimientos')}
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs text-slate-500">Resultados de laboratorios y serologías</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                placeholder="Glucemia, VDRL, VIH, HBsAg, grupo y factor, otros"
                {...inputProps('embarazoLaboratorios')}
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            6. Estudios prenatales realizados
          </h3>
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs text-slate-500">Ecografía 1º trimestre</span>
                <textarea
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                  placeholder="Traslucencia nucal, CRL, hueso nasal"
                  {...inputProps('estudiosEcoPrimerTrimestre')}
                />
              </label>
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs text-slate-500">Ecografía 2º trimestre / morfológica</span>
                <textarea
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                  placeholder="Hallazgos estructurales y marcadores blandos"
                  {...inputProps('estudiosEcoSegundoTrimestre')}
                />
              </label>
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs text-slate-500">Doppler o ecografía de crecimiento</span>
                <textarea
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[60px]"
                  placeholder="Estimación de peso, flujos uterinos y umbilicales"
                  {...inputProps('estudiosEcoDoppler')}
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs text-slate-500">Screening genético / bioquímico</span>
                <textarea
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                  placeholder="Test combinado, cuádruple marcador, NIPT (DNA fetal libre)"
                  {...inputProps('estudiosScreening')}
                />
              </label>
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs text-slate-500">Resultados y seguimiento</span>
                <textarea
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                  placeholder="Riesgo estimado, recomendaciones y controles posteriores"
                  {...inputProps('estudiosScreeningResultados')}
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs text-slate-500">Estudios invasivos</span>
                <textarea
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
                  placeholder="CVS, amniocentesis, cordocentesis: indicación, semana y resultados"
                  {...inputProps('estudiosInvasivos')}
                />
              </label>
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-xs text-slate-500">Hallazgos diagnósticos</span>
                <textarea
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                  placeholder="Aneuploidías, deleciones, microarrays, secuenciación, etc."
                  {...inputProps('estudiosInvasivosHallazgos')}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            7. Contexto psicosocial
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Nivel educativo y comprensión</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                placeholder="Capacidad de comprensión de los estudios y la consejería"
                {...inputProps('psicosocialEducacion')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Apoyo familiar y de la pareja</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                placeholder="Red de apoyo disponible"
                {...inputProps('psicosocialApoyo')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Deseo reproductivo y decisiones</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                placeholder="Actitud frente a resultados anormales, preferencias de manejo"
                {...inputProps('psicosocialDeseo')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Situación económica y habitacional</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                placeholder="Recursos disponibles, condiciones del hogar"
                {...inputProps('psicosocialSituacion')}
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs text-slate-500">Antecedentes de violencia o estrés significativo</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                placeholder="Situaciones de violencia, estrés laboral o social"
                {...inputProps('psicosocialViolencia')}
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            8. Síntesis y plan
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs text-slate-500">Resumen de riesgos maternos, fetales y genéticos</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
                placeholder="Síntesis de hallazgos relevantes"
                {...inputProps('sintesisResumen')}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Clasificación de riesgo</span>
              <select
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                {...inputProps('sintesisClasificacion')}
              >
                <option value="">Seleccionar</option>
                <option value="bajo">Bajo</option>
                <option value="intermedio">Intermedio</option>
                <option value="alto">Alto</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs text-slate-500">Plan de acción</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[80px]"
                placeholder="Estudios pendientes, interconsultas, derivaciones, seguimiento"
                {...inputProps('sintesisPlanAccion')}
              />
            </label>
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs text-slate-500">Registro y consentimiento informado</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm min-h-[70px]"
                placeholder="Detalle de registros en historia clínica y consentimientos obtenidos"
                {...inputProps('sintesisRegistro')}
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
