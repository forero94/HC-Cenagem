import React, { useCallback, useMemo } from 'react';

const DEFAULT_CONFIG = {
  show: true,
  mode: 'text',
  primerLabel: 'Primer nivel',
  primerPlaceholder: 'Hemograma, función tiroidea (TSH/T4L), CK, perfil hepático/renal, audiometría, fondo de ojo, EEG, neuroimágenes…',
  segundoLabel: 'Segundo nivel',
  segundoPlaceholder: 'Cariotipo, array-CGH, estudio de X frágil, paneles génicos…',
  terceroLabel: 'Tercer nivel / dirigidos',
  terceroPlaceholder: 'Exoma clínico, metabolómica, estudios mitocondriales o epigenéticos según sospecha',
  notasLabel: 'Interpretación y notas',
  notasPlaceholder: 'Hallazgos positivos/negativos, estudios pendientes, coordinación con otros servicios',
};

const CONFIG_OVERRIDES = {
  talla: {
    mode: 'checklist',
    checklist: {
      title: '4. Complementarios generales',
      description: 'Marcá los estudios solicitados o realizados para talla baja.',
      field: 'tallaComplementariosGenerales',
      optionsWrapperClass: 'grid gap-2 sm:grid-cols-2',
      options: [
        { value: 'tsh-t4l', label: 'TSH / T4 libre' },
        { value: 'igf1-gh', label: 'IGF-1 / GH basal' },
        { value: 'anti-ttg-iga', label: 'Anticuerpos anti-TTG / IgA total' },
        { value: 'funcion-renal-hepatica', label: 'Función renal y hepática' },
        { value: 'hemograma', label: 'Hemograma' },
        { value: 'rx-edad-osea', label: 'Radiografía mano-muñeca (edad ósea)' },
      ],
    },
  },
  prenatal: {
    show: false,
  },
  fertilidad: {
    primerPlaceholder: 'Perfil hormonal basal (FSH/LH/PRL), espermograma, ecografía transvaginal, AMH…',
    segundoPlaceholder: 'Cariotipo, X frágil, microdeleciones del cromosoma Y, paneles de portadores, trombofilias hereditarias…',
    terceroPlaceholder: 'PGT-M/PGT-A, secuenciación expandida, estudios metabólicos específicos…',
    notasPlaceholder: 'Resumen de hallazgos, estudios pendientes, coordinación con centros de reproducción asistida',
  },
  onco: {
    primerLabel: 'Historia clínica / estudios de base',
    primerPlaceholder: 'Diagnósticos oncológicos previos, anatomía patológica, inmunohistoquímica, imágenes iniciales…',
    segundoLabel: 'Estudios genéticos realizados',
    segundoPlaceholder: 'Paneles multigén, BRCA1/2, genes MMR, TP53, CHEK2, análisis de predisposición hereditaria…',
    terceroLabel: 'Estudios dirigidos / tumorales',
    terceroPlaceholder: 'Secuenciación tumoral, LOH, NGS somático, RNA, pruebas funcionales complementarias…',
    notasPlaceholder: 'Interpretación de variantes, coordinación con protocolos, estudios pendientes en familiares',
  },
};

const baseInputClass = 'rounded-xl border border-slate-300 px-3 py-2 text-sm';
const baseTextareaClass = `${baseInputClass} min-h-[80px]`;
const baseCheckboxClass = 'h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500';

const normalizeValue = (value) => (value == null ? '' : value);

const FieldControl = ({ field, value, onValueChange }) => {
  const fieldValue = normalizeValue(value[field.name]);
  const handleChange = useCallback(
    (event) => {
      onValueChange(field.name, event.target.value);
    },
    [field.name, onValueChange],
  );

  const className = `${baseTextareaClass} ${field.className || ''}`.trim();

  return (
    <textarea
      className={className}
      value={fieldValue}
      placeholder={field.placeholder}
      onChange={handleChange}
    />
  );
};

const SectionRenderer = ({ section, value, onValueChange }) => (
  <section className="grid gap-4">
    <h2 className="text-sm font-semibold text-slate-700">{section.title}</h2>
    <p className="text-xs text-slate-500">{section.description}</p>
    <div className="grid gap-3 md:grid-cols-2">
      {section.fields.map((field) => (
        <label
          key={field.name}
          className={`flex flex-col gap-1 ${field.colSpan ? field.colSpan : ''}`}
        >
          <span className="text-xs text-slate-500">{field.label}</span>
          <FieldControl field={field} value={value} onValueChange={onValueChange} />
        </label>
      ))}
    </div>
  </section>
);

const buildSection = (cfg) => ({
  title: 'Estudios complementarios',
  description: 'Registrá los estudios solicitados o realizados para orientar el abordaje diagnóstico.',
  fields: [
    {
      name: 'estudiosPrimerNivel',
      label: cfg.primerLabel,
      placeholder: cfg.primerPlaceholder,
      colSpan: 'md:col-span-1',
    },
    {
      name: 'estudiosSegundoNivel',
      label: cfg.segundoLabel,
      placeholder: cfg.segundoPlaceholder,
      colSpan: 'md:col-span-1',
    },
    {
      name: 'estudiosTercerNivel',
      label: cfg.terceroLabel,
      placeholder: cfg.terceroPlaceholder,
      colSpan: 'md:col-span-1',
    },
    {
      name: 'estudiosComplementariosNotas',
      label: cfg.notasLabel,
      placeholder: cfg.notasPlaceholder,
      colSpan: 'md:col-span-1',
    },
  ],
});

const getArrayValue = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const ChecklistRenderer = ({ checklist, value, onValueChange }) => {
  const selected = getArrayValue(value[checklist.field]);
  const toggleOption = useCallback((optionValue) => {
    const current = getArrayValue(value[checklist.field]);
    const exists = current.includes(optionValue);
    const next = exists
      ? current.filter((item) => item !== optionValue)
      : [...current, optionValue];
    onValueChange(checklist.field, next);
  }, [checklist.field, onValueChange, value]);

  const optionsWrapperClass = checklist.optionsWrapperClass || 'grid gap-2';
  const itemClass = checklist.optionClassName
    || 'flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700';

  return (
    <section className="grid gap-4">
      {checklist.title ? <h2 className="text-sm font-semibold text-slate-700">{checklist.title}</h2> : null}
      {checklist.description ? <p className="text-xs text-slate-500">{checklist.description}</p> : null}
      <div className={optionsWrapperClass}>
        {(checklist.options || []).map((option) => (
          <label key={option.value} className={itemClass}>
            <input
              type="checkbox"
              className={baseCheckboxClass}
              value={option.value}
              checked={selected.includes(option.value)}
              onChange={() => toggleOption(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
};

export default function StepEstudiosComplementarios({ groupId, value = {}, onChange }) {
  const config = useMemo(() => {
    const override = CONFIG_OVERRIDES[groupId] || {};
    return { ...DEFAULT_CONFIG, ...override };
  }, [groupId]);

  const handleValueChange = useCallback(
    (field, newValue) => {
      onChange?.(field, newValue);
    },
    [onChange],
  );

  const fallbackField = 'estudiosComplementariosNotas';
  const fallbackValue = normalizeValue(value[fallbackField]);
  const fallbackTextareaClass = `${baseTextareaClass} min-h-[140px] w-full`;
  const renderFallbackTextarea = () => (
    <textarea
      className={fallbackTextareaClass}
      value={fallbackValue}
      placeholder="Escribí en texto libre los estudios que aporta el paciente (ej.: ecografías, laboratorios, biopsias)."
      onChange={(event) => handleValueChange(fallbackField, event.target.value)}
    />
  );

  if (config.show === false) {
    return renderFallbackTextarea();
  }

  if (config.mode === 'checklist' && config.checklist) {
    return (
      <div className="grid gap-6">
        <ChecklistRenderer checklist={config.checklist} value={value} onValueChange={handleValueChange} />
        {renderFallbackTextarea()}
      </div>
    );
  }

  const section = buildSection(config);

  return (
    <div className="grid gap-6">
      <SectionRenderer
        section={section}
        value={value}
        onValueChange={handleValueChange}
      />
    </div>
  );
}
