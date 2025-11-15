import cenagemLogo from '@/assets/CENAGEM logo.png';
import malbranLogo from '@/assets/Malbran logo.png';

const BRAND_NAVY = '#232d4f';

export const escapeHtml = (value) => {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export const buildBrandedPrintDocument = ({
  documentTitle = '',
  heading = '',
  subtitle = '',
  contentHtml = '',
  extraStyles = '',
}) => {
  const titleText = escapeHtml(documentTitle);
  const headingHtml = heading
    ? `<h1 class="print-heading">${escapeHtml(heading)}</h1>`
    : '';
  const subtitleHtml = subtitle
    ? `<p class="print-subtitle">${escapeHtml(subtitle)}</p>`
    : '';

  return `<!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>${titleText}</title>
      <style>
        @page {
          margin: 0;
        }
        :root {
          color-scheme: light;
        }
        html, body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
          background: #ffffff;
          color: #0f172a;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .print-page {
          min-height: 100vh;
          background: #ffffff;
          display: flex;
          flex-direction: column;
        }
        .print-header {
          background: ${BRAND_NAVY};
          color: #f8fafc;
          padding: 18px 48px;
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .print-header__entity {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .print-header__entity img {
          max-height: 56px;
          width: auto;
        }
        .print-header__titles {
          display: flex;
          flex-direction: column;
          font-size: 13px;
          line-height: 1.35;
        }
        .print-header__titles strong {
          font-size: 15px;
          letter-spacing: 0.04em;
        }
        .print-header__divider {
          flex: 1;
        }
        .print-body {
          flex: 1;
          padding: 36px 48px 48px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .print-heading {
          margin: 0;
          font-size: 22px;
          color: #0f172a;
        }
        .print-subtitle {
          margin: 0;
          font-size: 14px;
          color: #475569;
        }
        .print-content {
          flex: 1;
        }
        .print-footer {
          background: ${BRAND_NAVY};
          height: 48px;
        }
        ${extraStyles}
      </style>
    </head>
    <body>
      <div class="print-page">
        <header class="print-header">
          <div class="print-header__entity">
            <img src="${cenagemLogo}" alt="Centro Nacional de Genética Médica" />
            <div class="print-header__titles">
              <strong>Centro Nacional de Genética Médica</strong>
              <span>"Dr. Eduardo E. Castilla"</span>
            </div>
          </div>
          <div class="print-header__divider"></div>
          <div class="print-header__entity">
            <img src="${malbranLogo}" alt="ANLIS Malbrán" />
            <div class="print-header__titles">
              <strong>ANLIS MALBRÁN</strong>
              <span>Administración Nacional de Laboratorios e Institutos de Salud</span>
              <span>"Dr. Carlos G. Malbrán"</span>
            </div>
          </div>
        </header>
        <main class="print-body">
          ${headingHtml}
          ${subtitleHtml}
          <div class="print-content">
            ${contentHtml}
          </div>
        </main>
        <div class="print-footer"></div>
      </div>
    </body>
  </html>`;
};

export const printHtmlDocument = (html) => {
  if (typeof document === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      const cleanup = () => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      };
      iframe.onload = () => {
        try {
          const iframeWindow = iframe.contentWindow;
          iframeWindow?.focus();
          iframeWindow?.print();
          setTimeout(() => {
            cleanup();
            resolve(true);
          }, 100);
        } catch (error) {
          console.error('Fallo al imprimir el documento', error);
          cleanup();
          resolve(false);
        }
      };
      iframe.onerror = () => {
        cleanup();
        resolve(false);
      };
      iframe.srcdoc = html;
      document.body.appendChild(iframe);
    } catch (error) {
      console.error('No se pudo preparar la vista de impresión', error);
      resolve(false);
    }
  });
};
