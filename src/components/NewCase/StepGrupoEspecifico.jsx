import React from 'react';
import Grupo_DI_RM from './groups/Grupo_DI_RM';
import Grupo_Talla from './groups/Grupo_Talla';
import Grupo_Dismorfias from './groups/Grupo_Dismorfias';
import Grupo_Prenatal from './groups/Grupo_Prenatal';
import Grupo_Fertilidad from './groups/Grupo_Fertilidad';
import Grupo_Onco from './groups/Grupo_Onco';
import Grupo_Monogenica from './groups/Grupo_Monogenica';
import Grupo_Otros from './groups/Grupo_Otros';

const MAP = {
  di_rm: Grupo_DI_RM,
  talla: Grupo_Talla,
  dismorfias: Grupo_Dismorfias,
  prenatal: Grupo_Prenatal,
  fertilidad: Grupo_Fertilidad,
  onco: Grupo_Onco,
  monogenica: Grupo_Monogenica,
  otros: Grupo_Otros,
};

const DEFAULT_CONFIG = {
  estudios: {
    show: true,
    primerLabel: 'Primer nivel',
    primerPlaceholder: 'Hemograma, función tiroidea (TSH/T4L), CK, perfil hepático/renal, audiometría, fondo de ojo, EEG, neuroimágenes…',
    segundoLabel: 'Segundo nivel',
    segundoPlaceholder: 'Cariotipo, array-CGH, estudio de X frágil, paneles génicos…',
    terceroLabel: 'Tercer nivel / dirigidos',
    terceroPlaceholder: 'Exoma clínico, metabolómica, estudios mitocondriales o epigenéticos según sospecha',
    notasLabel: 'Interpretación y notas',
    notasPlaceholder: 'Hallazgos positivos/negativos, estudios pendientes, coordinación con otros servicios',
  },
  sintesis: {
    show: true,
    title: 'Síntesis diagnóstica',
    clasificacionLabel: 'Clasificación funcional',
    sindromicoLabel: 'Caracterización',
    reversibilidadLabel: 'Reversibilidad parcial',
    etiologiaLabel: 'Etiología probable',
  },
  plan: {
    show: true,
    title: 'Plan y seguimiento',
    derivacionesLabel: 'Derivaciones propuestas',
    derivacionesPlaceholder: 'Genética, neurología, fonoaudiología, estimulación temprana, psicopedagogía…',
    consejeriaLabel: 'Consejería genética familiar',
    consejeriaPlaceholder: 'Riesgos de recurrencia, recomendaciones para la familia',
    controlesLabel: 'Controles y seguimiento',
    controlesPlaceholder: 'Periodicidad, monitoreo de crecimiento, conducta, aprendizaje',
    registroLabel: 'Registro fenotípico / HPO',
    registroPlaceholder: 'Datos ingresados en RENAC/ECLAM/CENAGEM, términos HPO relevantes',
  },
};

const CONFIG_OVERRIDES = {
  prenatal: {
    estudios: { show: false },
    sintesis: { show: false },
    plan: { show: false },
  },
  fertilidad: {
    estudios: {
      primerPlaceholder: 'Perfil hormonal basal (FSH/LH/PRL), espermograma, ecografía transvaginal, AMH…',
      segundoPlaceholder: 'Cariotipo, X frágil, microdeleciones del cromosoma Y, paneles de portadores, trombofilias hereditarias…',
      terceroPlaceholder: 'PGT-M/PGT-A, secuenciación expandida, estudios metabólicos específicos…',
      notasPlaceholder: 'Resumen de hallazgos, estudios pendientes, coordinación con centros de reproducción asistida',
    },
    sintesis: { show: false },
    plan: {
      derivacionesPlaceholder: 'Endocrinología reproductiva, reproducción asistida, psicología, andrología…',
      consejeriaPlaceholder: 'Riesgos de recurrencia, alternativas reproductivas, preservación de fertilidad',
      controlesPlaceholder: 'Seguimiento con centros de fertilidad, monitoreo hormonal, reevaluaciones periódicas',
      registroPlaceholder: 'Consentimientos, registros compartidos con centros de fertilidad, documentación clínica',
    },
  },
  onco: {
    estudios: {
      primerLabel: 'Historia clínica / estudios de base',
      primerPlaceholder: 'Diagnósticos oncológicos previos, anatomía patológica, inmunohistoquímica, imágenes iniciales…',
      segundoLabel: 'Estudios genéticos realizados',
      segundoPlaceholder: 'Paneles multigén, BRCA1/2, genes MMR, TP53, CHEK2, análisis de predisposición hereditaria…',
      terceroLabel: 'Estudios dirigidos / tumorales',
      terceroPlaceholder: 'Secuenciación tumoral, LOH, NGS somático, RNA, pruebas funcionales complementarias…',
      notasPlaceholder: 'Interpretación de variantes, coordinación con protocolos, estudios pendientes en familiares',
    },
    sintesis: { show: false },
    plan: {
      derivacionesPlaceholder: 'Oncología clínica, mastología, gastroenterología, consejería genética, psicooncología…',
      consejeriaPlaceholder: 'Riesgo individual y familiar, testing en cascada, decisiones terapéuticas compartidas',
      controlesPlaceholder: 'Tamizajes recomendados, cronogramas de vigilancia, seguimientos interdisciplinarios',
      registroPlaceholder: 'Registro de variantes, probandos familiares, bases oncológicas institucionales',
    },
  },
};

const buildConfig = (groupId) => {
  const override = CONFIG_OVERRIDES[groupId] || {};
  return {
    estudios: { ...DEFAULT_CONFIG.estudios, ...override.estudios },
    sintesis: { ...DEFAULT_CONFIG.sintesis, ...override.sintesis },
    plan: { ...DEFAULT_CONFIG.plan, ...override.plan },
  };
};

export default function StepGrupoEspecifico({ groupId, value = {}, onChange }) {
  const Comp = MAP[groupId] || null;
  const config = buildConfig(groupId);
  const set = (field) => (e) => onChange?.(field, e.target.value);

  return (
    <div className="grid gap-6">
      {config.estudios.show && (
        <section className="grid gap-4">
          <h2 className="text-sm font-semibold text-slate-700">Estudios complementarios</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">{config.estudios.primerLabel}</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                value={value.estudiosPrimerNivel || ''}
                onChange={set('estudiosPrimerNivel')}
                placeholder={config.estudios.primerPlaceholder}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">{config.estudios.segundoLabel}</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                value={value.estudiosSegundoNivel || ''}
                onChange={set('estudiosSegundoNivel')}
                placeholder={config.estudios.segundoPlaceholder}
              />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">{config.estudios.terceroLabel}</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                value={value.estudiosTercerNivel || ''}
                onChange={set('estudiosTercerNivel')}
                placeholder={config.estudios.terceroPlaceholder}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">{config.estudios.notasLabel}</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                value={value.estudiosComplementariosNotas || ''}
                onChange={set('estudiosComplementariosNotas')}
                placeholder={config.estudios.notasPlaceholder}
              />
            </label>
          </div>
        </section>
      )}

      {config.sintesis.show && (
        <section className="grid gap-4">
          <h2 className="text-sm font-semibold text-slate-700">{config.sintesis.title}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">{config.sintesis.clasificacionLabel}</span>
              <select
                className="rounded-xl border border-slate-300 px-3 py-2"
                value={value.sintesisClasificacion || ''}
                onChange={set('sintesisClasificacion')}
              >
                <option value="">Seleccionar…</option>
                <option value="leve">Leve</option>
                <option value="moderado">Moderado</option>
                <option value="grave">Grave</option>
                <option value="profundo">Profundo</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">{config.sintesis.sindromicoLabel}</span>
              <select
                className="rounded-xl border border-slate-300 px-3 py-2"
                value={value.sintesisSindromico || ''}
                onChange={set('sintesisSindromico')}
              >
                <option value="">Seleccionar…</option>
                <option value="sindromico">Sindrómico</option>
                <option value="no_sindromico">No sindrómico</option>
                <option value="indeterminado">Indeterminado</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">{config.sintesis.reversibilidadLabel}</span>
              <input
                className="rounded-xl border border-slate-300 px-3 py-2"
                value={value.sintesisReversibilidad || ''}
                onChange={set('sintesisReversibilidad')}
                placeholder="Déficits sensoriales, hipotiroidismo, intervenciones posibles"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">{config.sintesis.etiologiaLabel}</span>
            <textarea
              className="rounded-xl border border-slate-300 px-3 py-2 min-h-[90px]"
              value={value.sintesisEtiologia || ''}
              onChange={set('sintesisEtiologia')}
              placeholder="Genética, metabólica, estructural, ambiental o mixta. Describir razonamiento clínico."
            />
          </label>
        </section>
      )}

      {config.plan.show && (
        <section className="grid gap-4">
          <h2 className="text-sm font-semibold text-slate-700">{config.plan.title}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">{config.plan.derivacionesLabel}</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                value={value.planDerivaciones || ''}
                onChange={set('planDerivaciones')}
                placeholder={config.plan.derivacionesPlaceholder}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">{config.plan.consejeriaLabel}</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                value={value.planConsejeriaGenetica || ''}
                onChange={set('planConsejeriaGenetica')}
                placeholder={config.plan.consejeriaPlaceholder}
              />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">{config.plan.controlesLabel}</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                value={value.planControles || ''}
                onChange={set('planControles')}
                placeholder={config.plan.controlesPlaceholder}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">{config.plan.registroLabel}</span>
              <textarea
                className="rounded-xl border border-slate-300 px-3 py-2 min-h-[80px]"
                value={value.planRegistroHpo || ''}
                onChange={set('planRegistroHpo')}
                placeholder={config.plan.registroPlaceholder}
              />
            </label>
          </div>
        </section>
      )}

      {Comp ? (
        <section className="grid gap-4">
          <Comp value={value} onChange={onChange} />
        </section>
      ) : null}
    </div>
  );
}
