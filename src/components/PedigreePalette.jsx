import React from 'react';

const TOOLS = [
  {
    id: 'individual-m',
    label: 'Nuevo varón',
    hint: 'Agregar individuo masculino',
    payload: { type: 'individual', sex: 'M' },
    glyph: '□',
  },
  {
    id: 'individual-f',
    label: 'Nueva mujer',
    hint: 'Agregar individuo femenino',
    payload: { type: 'individual', sex: 'F' },
    glyph: '○',
  },
  {
    id: 'add-partner',
    label: 'Agregar pareja',
    hint: 'Arrastrar sobre un miembro',
    payload: { type: 'link-partner' },
    glyph: '⚭',
  },
  {
    id: 'add-parents',
    label: 'Agregar padres',
    hint: 'Crear padre y madre para el miembro (usá drag sobre un nodo o clic con selección)',
    payload: { type: 'add-parents' },
    glyph: '⚥',
  },
  {
    id: 'add-child',
    label: 'Agregar hijo/a',
    hint: 'Arrastrar sobre madre o padre',
    payload: { type: 'link-child' },
    glyph: '↴',
  },
  {
    id: 'add-sibling',
    label: 'Agregar hermano/a',
    hint: 'Arrastrar sobre un miembro',
    payload: { type: 'link-sibling' },
    glyph: '⇄',
  },
];

export default function PedigreePalette({ onToolSelect }) {
  const handleDragStart = (event, payload) => {
    event.dataTransfer.setData('application/pedigree-tool', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleKeyActivate = (payload) => {
    onToolSelect?.(payload, null);
  };

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          draggable
          onDragStart={(event) => handleDragStart(event, tool.payload)}
          onClick={() => handleKeyActivate(tool.payload)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-sky-300 hover:text-slate-800"
          title={tool.hint}
        >
          <span className="text-base">{tool.glyph}</span>
          <span>{tool.label}</span>
        </button>
      ))}
    </div>
  );
}
