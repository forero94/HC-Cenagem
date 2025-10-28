import React, { useMemo } from 'react';

export default function Legend({ legend = {}, usage = [] }) {
  const entries = useMemo(() => {
    const base = [
      {
        key: 'male',
        label: 'Masculino',
        render: () => <span className="inline-block w-4 h-4 border border-slate-700 rounded-sm" />,
      },
      {
        key: 'female',
        label: 'Femenino',
        render: () => <span className="inline-block w-4 h-4 border border-slate-700 rounded-full" />,
      },
      {
        key: 'unspecified',
        label: legend.diamond || 'Sexo no especificado',
        render: () => (
          <span className="inline-block w-4 h-4 border border-slate-700 rotate-45" />
        ),
      },
    ];

    const dynamic = [];
    if (usage.includes('filled')) {
      dynamic.push({
        key: 'filled',
        label: legend.filled || 'Afectado clínicamente',
        render: () => (
          <span className="inline-block w-4 h-4 border border-slate-700 bg-slate-700 rounded-sm" />
        ),
      });
    }
    if (usage.includes('halfFilled')) {
      dynamic.push({
        key: 'halfFilled',
        label: legend.halfFilled || 'Portador AR',
        render: () => (
          <span className="relative inline-block w-4 h-4 border border-slate-700 rounded-sm overflow-hidden">
            <span className="absolute inset-0 bg-slate-700 origin-left scale-x-50" />
          </span>
        ),
      });
    }
    if (usage.includes('dot')) {
      dynamic.push({
        key: 'dot',
        label: legend.dot || 'Portador ligado al X',
        render: () => (
          <span className="inline-flex items-center justify-center w-4 h-4 border border-slate-700 rounded-full">
            <span className="w-2 h-2 bg-slate-700 rounded-full" />
          </span>
        ),
      });
    }
    if (usage.includes('triangle')) {
      dynamic.push({
        key: 'triangle',
        label: legend.triangle || 'Embarazo no a término',
        render: () => (
          <span className="inline-block w-0 h-0 border-l-[7px] border-r-[7px] border-b-[12px] border-l-transparent border-r-transparent border-b-slate-700" />
        ),
      });
    }

    return [...base, ...dynamic];
  }, [legend, usage]);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
      {entries.map((entry) => (
        <div key={entry.key} className="flex items-center gap-1">
          {entry.render()}
          <span>{entry.label}</span>
        </div>
      ))}
    </div>
  );
}
