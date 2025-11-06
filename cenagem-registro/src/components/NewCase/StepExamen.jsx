import React, { useState } from 'react';

const HELP_SECTIONS = [
  {
    title: 'Cabeza y cráneo',
    items: [
      'Microcefalia / Macrocefalia',
      'Braquicefalia / Dolicocefalia / Trigonocefalia',
      'Asimetría craneal',
      'Prominencia frontal / Frente baja',
      'Fontanelas amplias / cerradas precozmente',
      'Suturas palpables o deprimidas',
    ],
  },
  {
    title: 'Frente y cejas',
    items: [
      'Frente alta / retrógrada',
      'Protuberancia frontal',
      'Cejas pobladas / finas / ralas',
      'Sinofris (ceja continua)',
      'Cejas arqueadas / rectas',
      'Implantación baja de cabello frontal',
    ],
  },
  {
    title: 'Ojos y órbitas',
    items: [
      'Hipertelorismo / Hipotelorismo',
      'Fisuras palpebrales hacia arriba / abajo',
      'Fisuras cortas / largas',
      'Epicanto presente / ausente',
      'Ptosis palpebral',
      'Estrabismo',
      'Coloboma',
      'Asimetría ocular',
    ],
  },
  {
    title: 'Nariz',
    items: [
      'Raíz nasal ancha / estrecha',
      'Puente nasal plano / elevado',
      'Punta nasal bulbosa / afilada',
      'Narinas antevertidas / horizontales',
      'Nariz corta / larga',
      'Septum desviado',
    ],
  },
  {
    title: 'Boca y labios',
    items: [
      'Filtro largo / corto / ausente',
      'Labio superior fino / grueso',
      'Comisuras hacia arriba / abajo',
      'Boca pequeña / grande',
      'Paladar ojival / hendido / plano',
      'Micrognatia / Prognatismo',
      'Asimetría facial',
    ],
  },
  {
    title: 'Orejas',
    items: [
      'Pequeñas / grandes',
      'Implantación baja',
      'Rotadas hacia atrás / adelante',
      'Hélix plegado / prominente / arrugado',
      'Ausencia o hipoplasia de lóbulo',
      'Mamelones o apéndices preauriculares',
      'Hoyuelos preauriculares',
    ],
  },
  {
    title: 'Cuello',
    items: [
      'Cuello corto / largo',
      'Pterigium colli',
      'Pliegues cervicales',
      'Implantación baja del cabello',
      'Asimetría lateral',
    ],
  },
  {
    title: 'Tórax y tronco',
    items: [
      'Pectus excavatum / carinatum',
      'Asimetría torácica',
      'Mamilas supernumerarias',
      'Hipoplasia o hipertrofia mamilar',
      'Discrepancia de longitud de tronco',
    ],
  },
  {
    title: 'Extremidades superiores',
    items: [
      'Braquimetacarpia / Aracnodactilia',
      'Clinodactilia (curvatura de dedo)',
      'Pliegue palmar único',
      'Sindactilia / Polidactilia',
      'Pulgar implantado proximal / hipoplásico',
      'Camptodactilia (flexión fija)',
      'Limitación articular',
      'Asimetría entre brazos o manos',
    ],
  },
  {
    title: 'Extremidades inferiores',
    items: [
      'Pie plano / cavo / varo / equino',
      'Polidactilia / Sindactilia',
      'Hallux valgo / ensanchado',
      'Dedos superpuestos',
      'Tibias arqueadas',
      'Acortamiento o alargamiento segmentario',
      'Asimetría de miembros inferiores',
    ],
  },
  {
    title: 'Piel y faneras',
    items: [
      'Manchas hiperpigmentadas / hipopigmentadas',
      'Manchas café con leche',
      'Nevos / hemangiomas',
      'Cutis laxa / hiperelástico / atrófico',
      'Estrías',
      'Pelo escaso / quebradizo / rizado / liso',
      'Uñas hipoplásicas / displásicas',
    ],
  },
  {
    title: 'Genitales',
    items: [
      'Criptorquidia / hipospadias',
      'Ambigüedad genital',
      'Hipogenitalismo / macrogenitalismo',
      'Asimetría escrotal o labioscrotal',
      'Implantación baja del pene o clítoris',
      'Anomalías en labios mayores / menores',
    ],
  },
  {
    title: 'Neuromuscular y conducta observada',
    items: [
      'Hipotonía / hipertonía',
      'Hiperlaxitud articular',
      'Tics / estereotipias',
      'Movimientos coreicos / atetósicos',
      'Marcha inestable / rígida',
      'Hipermimia / hipomimia',
      'Conducta social atípica',
    ],
  },
];

export default function StepExamen({ value = {}, onChange }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [openSections, setOpenSections] = useState(() => HELP_SECTIONS.map(() => false));
  const resumen = value.pacienteExamenObservaciones || '';

  const toggleSection = (index) => {
    setOpenSections((prev) => prev.map((value, idx) => (idx === index ? !value : value)));
  };

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="text-sm font-semibold text-slate-700">Examen físico</h2>
            <p className="text-xs text-slate-500">
              Resumí los hallazgos clínicos más relevantes de la exploración.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-500"
            onClick={() => setHelpOpen((prev) => !prev)}
          >
            {helpOpen ? 'Ocultar guía' : 'Ver guía'}
          </button>
        </header>

        {helpOpen && (
          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <p className="font-semibold text-slate-700">Guía de hallazgos posibles</p>
            <div className="mt-3 grid gap-2">
              {HELP_SECTIONS.map((section, index) => {
                const isOpen = openSections[index];
                return (
                  <div
                    key={section.title}
                    className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-500"
                      onClick={() => toggleSection(index)}
                    >
                      <span>{section.title}</span>
                      <span className="text-base leading-none text-slate-500">
                        {isOpen ? '-' : '+'}
                      </span>
                    </button>
                    {isOpen && (
                      <ul className="border-t border-slate-200 px-5 py-3 text-[11px] text-slate-600 space-y-1 pl-4">
                        {section.items.map((item) => (
                          <li key={item} className="list-disc">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Peso</span>
            <input
              className="rounded-xl border border-slate-300 px-3 py-2"
              value={value.pacienteExamenPeso || ''}
              onChange={(e) => onChange?.('pacienteExamenPeso', e.target.value)}
              placeholder="Ej. 12.4 kg"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Talla</span>
            <input
              className="rounded-xl border border-slate-300 px-3 py-2"
              value={value.pacienteExamenTalla || ''}
              onChange={(e) => onChange?.('pacienteExamenTalla', e.target.value)}
              placeholder="Ej. 96 cm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Perímetro cefálico</span>
            <input
              className="rounded-xl border border-slate-300 px-3 py-2"
              value={value.pacienteExamenPc || ''}
              onChange={(e) => onChange?.('pacienteExamenPc', e.target.value)}
              placeholder="Ej. 48.5 cm"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Resumen del examen físico</span>
          <textarea
            className="min-h-[160px] rounded-xl border border-slate-300 px-3 py-2"
            value={resumen}
            onChange={(e) => onChange?.('pacienteExamenObservaciones', e.target.value)}
            placeholder="Detallá medidas, hallazgos positivos/negativos relevantes y particularidades a seguir."
          />
        </label>
      </section>
    </div>
  );
}
