import React, { useMemo, useCallback } from 'react';
import { GROUP_GUIDES } from './groupGuides';

const baseInputClass = 'rounded-xl border border-slate-300 px-3 py-2 text-sm';
const baseTextareaClass = `${baseInputClass} min-h-[80px]`;
const baseSelectClass = baseInputClass;
const baseCheckboxClass = 'h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500';

const getCheckboxValues = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const FieldControl = ({ field, value, onValueChange }) => {
  const rawValue = value[field.name];
  const handleTextChange = useCallback(
    (event) => {
      onValueChange(field.name, event.target.value);
    },
    [field.name, onValueChange],
  );

  if (field.component === 'checkbox-group') {
    const selectedValues = getCheckboxValues(rawValue);
    const toggleOption = useCallback(
      (optionValue) => {
        const current = getCheckboxValues(value[field.name]);
        const exists = current.includes(optionValue);
        const nextValue = exists
          ? current.filter((item) => item !== optionValue)
          : [...current, optionValue];
        onValueChange(field.name, nextValue);
      },
      [field.name, onValueChange, value],
    );
    const wrapperClass = field.optionsWrapperClass
      ? field.optionsWrapperClass
      : 'grid gap-2';
    const itemClass = field.optionClassName
      ? field.optionClassName
      : 'flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700';
    return (
      <div className={wrapperClass}>
        {(field.options || []).map((option) => (
          <label key={option.value} className={itemClass}>
            <input
              type="checkbox"
              className={baseCheckboxClass}
              value={option.value}
              checked={selectedValues.includes(option.value)}
              onChange={() => toggleOption(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (field.component === 'radio-group') {
    const currentValue = typeof rawValue === 'string' ? rawValue : '';
    const itemClass = field.optionClassName
      ? field.optionClassName
      : 'flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700';
    const handleSelect = useCallback(
      (optionValue) => {
        onValueChange(field.name, optionValue);
      },
      [field.name, onValueChange],
    );
    return (
      <div className={field.optionsWrapperClass || 'grid gap-2'}>
        {(field.options || []).map((option) => (
          <label key={option.value} className={itemClass}>
            <input
              type="radio"
              className={baseCheckboxClass}
              name={field.name}
              value={option.value}
              checked={currentValue === option.value}
              onChange={() => handleSelect(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (field.component === 'checkbox') {
    const checked = Boolean(rawValue);
    return (
      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className={baseCheckboxClass}
          checked={checked}
          onChange={(event) => onValueChange(field.name, event.target.checked)}
        />
        <span>{field.optionLabel || field.label}</span>
      </label>
    );
  }

  const baseClass = field.component === 'textarea'
    ? baseTextareaClass
    : field.component === 'select'
      ? baseSelectClass
      : baseInputClass;
  const className = field.className ? `${baseClass} ${field.className}` : baseClass;
  const fieldValue = rawValue ?? '';

  if (field.component === 'textarea') {
    return (
      <textarea
        className={className}
        value={fieldValue}
        placeholder={field.placeholder}
        onChange={handleTextChange}
      />
    );
  }
  if (field.component === 'select') {
    return (
      <select className={className} value={fieldValue} onChange={handleTextChange}>
        {(field.options || []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      type={field.inputType || 'text'}
      className={className}
      value={fieldValue}
      placeholder={field.placeholder}
      onChange={handleTextChange}
    />
  );
};

const GroupRenderer = ({ sectionId, group, value, onValueChange }) => {
  const gridClass = group.columns ? `grid gap-3 md:grid-cols-${group.columns}` : 'grid gap-3';
  const groupKey = group.id || group.heading || `${sectionId}-group-${group.fields?.[0]?.name || 'group'}`;

  return (
    <div key={groupKey} className="grid gap-3">
      {group.heading ? (
        <span className="text-xs font-semibold text-slate-600">{group.heading}</span>
      ) : null}
      <div className={gridClass}>
        {(group.fields || []).map((field) => (
          <label
            key={`${groupKey}-${field.name}`}
            className={`flex flex-col gap-1 ${field.colSpan ? field.colSpan : ''}`}
          >
            {field.label ? <span className="text-xs text-slate-500">{field.label}</span> : null}
            <FieldControl field={field} value={value} onValueChange={onValueChange} />
            {field.helper ? <span className="text-[11px] text-slate-400">{field.helper}</span> : null}
          </label>
        ))}
      </div>
    </div>
  );
};

const SectionRenderer = ({ section, value, onValueChange }) => {
  const Wrapper = ({ children }) => (
    section.wrapper ? <div className={section.wrapper}>{children}</div> : <section className="grid gap-4">{children}</section>
  );
  const sectionKey = section.id || section.title || `section-${section.groups?.length || 0}`;

  return (
    <Wrapper>
      {section.title ? <h2 className="text-sm font-semibold text-slate-700">{section.title}</h2> : null}
      {section.description ? (
        <p className="text-xs text-slate-500">{section.description}</p>
      ) : null}
      {(section.groups || []).map((group) => (
        <GroupRenderer
          key={group.id || group.heading || `${sectionKey}-${group.fields?.[0]?.name || 'group'}`}
          sectionId={sectionKey}
          group={group}
          value={value}
          onValueChange={onValueChange}
        />
      ))}
      {Array.isArray(section.fields) && section.fields.length > 0 ? (
        <GroupRenderer
          sectionId={sectionKey}
          group={{ id: `${sectionKey}-fields`, fields: section.fields }}
          value={value}
          onValueChange={onValueChange}
        />
      ) : null}
    </Wrapper>
  );
};

export default function StepGrupoEspecifico({ groupId, value = {}, onChange }) {
  const sections = useMemo(
    () => (groupId ? (GROUP_GUIDES[groupId]?.sections || []) : []),
    [groupId],
  );

  const handleValueChange = useCallback(
    (field, newValue) => {
      onChange?.(field, newValue);
    },
    [onChange],
  );

  if (!groupId) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
        Seleccioná un motivo específico para ver las preguntas dirigidas a ese motivo.
      </section>
    );
  }

  if (sections.length === 0) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-700">
        No hay preguntas específicas registradas para este motivo. Podés continuar al siguiente paso.
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      {sections.map((section) => (
        <SectionRenderer
          key={section.id || section.title}
          section={section}
          value={value}
          onValueChange={handleValueChange}
        />
      ))}
    </div>
  );
}
