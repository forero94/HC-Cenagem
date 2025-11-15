import { buildBrandedPrintDocument, escapeHtml } from '@/lib/printTemplate.js';

const toDisplayString = (value) => {
  if (value == null) return '—';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : '—';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '—';
  }
  if (value instanceof Date) {
    const safe = Number.isNaN(value.getTime()) ? null : value;
    return safe ? safe.toLocaleString('es-AR') : '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }
  return String(value);
};

const formatMultilineValue = (value) => {
  const normalized = toDisplayString(value);
  if (normalized === '—') return normalized;
  return escapeHtml(normalized).replace(/\n/g, '<br />');
};

const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    const value = new Date(iso);
    if (Number.isNaN(value.getTime())) return '—';
    return value.toLocaleString('es-AR');
  } catch {
    return '—';
  }
};

const renderSectionsHtml = (sections = []) => {
  if (!Array.isArray(sections) || sections.length === 0) {
    return '<p class="family-print__empty">No hay información cargada en el asistente.</p>';
  }
  const sectionsMarkup = sections
    .map((section) => {
      const entriesHtml = (section.entries || [])
        .map(
          (entry) => `
            <div class="family-print__entry">
              <dt>${escapeHtml(entry.label || 'Dato')}</dt>
              <dd>${formatMultilineValue(entry.value)}</dd>
            </div>`,
        )
        .join('');
      return `
        <section class="family-print__section">
          <h2>${escapeHtml(section.title || 'Sección')}</h2>
          <dl>
            ${entriesHtml}
          </dl>
        </section>`;
    })
    .join('');
  return `<div class="family-print__sections-grid">${sectionsMarkup}</div>`;
};

const renderEvolutionHtml = (evolution) => {
  if (!evolution) {
    return '<p class="family-print__empty">No hay evoluciones registradas.</p>';
  }
  return `
    <article class="family-print__evolution">
      <header>
        <div class="family-print__evolution-member">${escapeHtml(evolution.memberLabel || 'Miembro sin identificar')}</div>
        <div class="family-print__evolution-meta">
          <span>${formatDateTime(evolution.at)}</span>
          <span>${escapeHtml(evolution.author || 'Autor desconocido')}</span>
        </div>
      </header>
      <p>${formatMultilineValue(evolution.texto)}</p>
    </article>
  `;
};

const renderEvolutionsListHtml = (evolutions = []) => {
  if (!Array.isArray(evolutions) || evolutions.length === 0) {
    return '<p class="family-print__empty">No hay evoluciones nuevas para mostrar.</p>';
  }
  return evolutions.map((evolution) => renderEvolutionHtml(evolution)).join('');
};

const baseStyles = `
  .print-body {
    padding: 26px 34px 32px;
    gap: 12px;
  }
  .family-print__meta {
    display: grid;
    gap: 2px;
    font-size: 12px;
    color: #475569;
  }
  .family-print__meta strong {
    color: #111827;
  }
  .family-print__sections-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
  }
  .family-print__section {
    margin: 0;
    padding: 12px 14px;
    border: 1px solid #d7e3f5;
    border-radius: 14px;
    page-break-inside: avoid;
  }
  .family-print__section h2 {
    margin: 0 0 6px 0;
    font-size: 13px;
    color: #0f172a;
  }
  .family-print__section dl {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    column-gap: 10px;
    row-gap: 6px;
  }
  .family-print__entry {
    display: grid;
    gap: 1px;
    min-height: 0;
  }
  .family-print__entry dt {
    font-size: 9px;
    text-transform: uppercase;
    color: #61708f;
    letter-spacing: 0.05em;
  }
  .family-print__entry dd {
    margin: 0;
    font-size: 12px;
    color: #0f172a;
    line-height: 1.32;
  }
  .family-print__empty {
    margin: 12px 0;
    padding: 12px;
    border-radius: 14px;
    border: 1px dashed #cbd5f5;
    font-size: 12px;
    color: #475569;
    background: #f8fafc;
    text-align: center;
  }
  .family-print__tree {
    margin-top: 14px;
    padding: 12px;
    border: 1px solid #d7e3f5;
    border-radius: 14px;
    page-break-inside: avoid;
  }
  .family-print__tree img {
    width: 100%;
    max-height: 520px;
    object-fit: contain;
    border-radius: 10px;
    border: 1px solid #cbd5f5;
    background: #0f172a;
  }
  .family-print__tree figcaption {
    margin-top: 6px;
    font-size: 11px;
    color: #475569;
  }
  .family-print__evolution {
    border: 1px solid #d7e3f5;
    border-radius: 14px;
    padding: 12px;
    margin-top: 12px;
    page-break-inside: avoid;
  }
  .family-print__evolution header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 6px;
  }
  .family-print__evolution-member {
    font-weight: 600;
    color: #0f172a;
  }
  .family-print__evolution-meta {
    font-size: 10px;
    color: #475569;
    display: flex;
    gap: 8px;
  }
  .family-print__evolution p {
    margin: 0;
    font-size: 12px;
    color: #0f172a;
    white-space: pre-wrap;
  }
`;

export const buildFamilyFullPrintHtml = ({
  family,
  sections,
  treeImage,
  treeCaption,
  firstEvolution,
  generatedAt,
}) => {
  const code = family?.code ? `HC ${family.code}` : 'Historia clínica';
  const generatedLabel = generatedAt
    ? formatDateTime(generatedAt)
    : formatDateTime(new Date().toISOString());

  const sectionsHtml = renderSectionsHtml(sections);
  const treeHtml = treeImage
    ? `<figure class="family-print__tree">
        <img src="${treeImage}" alt="Árbol familiar" />
        ${treeCaption ? `<figcaption>${escapeHtml(treeCaption)}</figcaption>` : ''}
      </figure>`
    : '<p class="family-print__empty">No hay fotografías del árbol familiar cargadas en la HC.</p>';

  const evolutionHtml = renderEvolutionHtml(firstEvolution);

  const contentHtml = `
    <section class="family-print__meta">
      <div><strong>${escapeHtml(code)}</strong></div>
      <div>Generado: ${generatedLabel}</div>
    </section>
    ${sectionsHtml}
    <section class="family-print__section">
      <h2>Árbol familiar</h2>
      ${treeHtml}
    </section>
    <section class="family-print__section">
      <h2>Primera evolución registrada</h2>
      ${evolutionHtml}
    </section>
  `;

  return buildBrandedPrintDocument({
    documentTitle: `${code} - Historia completa`,
    heading: code,
    subtitle: 'Impresión del asistente de carga',
    contentHtml,
    extraStyles: baseStyles,
  });
};

export const buildFamilyNewEvolutionsPrintHtml = ({
  family,
  evolutions,
  sinceDate,
  generatedAt,
}) => {
  const code = family?.code ? `HC ${family.code}` : 'Historia clínica';
  const generatedLabel = generatedAt
    ? formatDateTime(generatedAt)
    : formatDateTime(new Date().toISOString());
  const sinceLabel = sinceDate ? formatDateTime(sinceDate) : 'Sin registro previo';

  const evolutionsHtml = renderEvolutionsListHtml(evolutions);

  const contentHtml = `
    <section class="family-print__meta">
      <div><strong>${escapeHtml(code)}</strong></div>
      <div>Generado: ${generatedLabel}</div>
      <div>Última impresión registrada: ${sinceLabel}</div>
    </section>
    <section class="family-print__section">
      <h2>Evoluciones nuevas</h2>
      ${evolutionsHtml}
    </section>
  `;

  return buildBrandedPrintDocument({
    documentTitle: `${code} - Evoluciones nuevas`,
    heading: code,
    subtitle: 'Evoluciones registradas desde la última impresión',
    contentHtml,
    extraStyles: baseStyles,
  });
};

export const buildFamilySingleEvolutionPrintHtml = ({
  family,
  evolution,
  generatedAt,
}) => {
  const code = family?.code ? `HC ${family.code}` : 'Historia clínica';
  const generatedLabel = generatedAt
    ? formatDateTime(generatedAt)
    : formatDateTime(new Date().toISOString());

  const evolutionHtml = renderEvolutionHtml(evolution);

  const contentHtml = `
    <section class="family-print__meta">
      <div><strong>${escapeHtml(code)}</strong></div>
      <div>Generado: ${generatedLabel}</div>
      <div>Evolución seleccionada: ${formatDateTime(evolution?.at)}</div>
    </section>
    <section class="family-print__section">
      <h2>Evolución</h2>
      ${evolutionHtml}
    </section>
  `;

  return buildBrandedPrintDocument({
    documentTitle: `${code} - Evolución`,
    heading: code,
    subtitle: 'Detalle de evolución seleccionada',
    contentHtml,
    extraStyles: baseStyles,
  });
};
