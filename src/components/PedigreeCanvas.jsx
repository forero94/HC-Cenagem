import React from 'react';
import Legend from './Legend';
import NodeShape from './NodeShape';

/**
 * Espera:
 *  - layout: { coupleLines[], childLines[], nodes[], nodeR, pos, width, height }
 *  - membersById: Map(id -> member)
 *  - proband: member | null
 *  - selectedId, onSelect
 *  - vp: useViewport() { containerRef, svgRef, viewBox, onMouseDown, onMouseMove, onMouseUp }
 */
function CoupleLines({ layout, membersById }) {
  return (
    <g>
      {layout.coupleLines.map((c, i) => {
        const A = membersById.get(c.a);
        const B = membersById.get(c.b);
        const broken = !!(A?.vinculoRoto || B?.vinculoRoto);
        return (
          <g key={`c${i}`}>
            <line
              x1={c.x1}
              y1={c.y}
              x2={c.x2}
              y2={c.y}
              stroke="#0ea5b7"
              strokeWidth="3"
              strokeDasharray={broken ? '6 4' : undefined}
            />
            <rect
              x={c.midX - 6}
              y={c.midY - 6}
              width={12}
              height={12}
              rx={2}
              ry={2}
              fill="#ffffff"
              stroke="#0ea5b7"
            />
            {broken && (
              <line
                x1={c.midX - 8}
                y1={c.midY - 8}
                x2={c.midX + 8}
                y2={c.midY + 8}
                stroke="#ef4444"
                strokeWidth="2"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

function ChildLines({ layout }) {
  return (
    <g>
      {layout.childLines.map((ln, i) => {
        if (ln.type === 'down') {
          return <line key={`d${i}`} x1={ln.x} y1={ln.y1} x2={ln.x} y2={ln.y2} stroke="#0ea5b7" strokeWidth="2" />;
        }
        if (ln.type === 'toChild') {
          return <line key={`t${i}`} x1={ln.x1} y1={ln.y1} x2={ln.x2} y2={ln.y2} stroke="#0ea5b7" strokeWidth="2" />;
        }
        if (ln.type === 'stub') {
          return <line key={`p${i}`} x1={ln.x1} y1={ln.y1} x2={ln.x2} y2={ln.y2} stroke="#0ea5b7" strokeWidth="2" />;
        }
        return null;
      })}
    </g>
  );
}

function Nodes({ layout, membersById, proband, selectedId, onSelect }) {
  const yearsSince = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const n = new Date();
    let y = n.getFullYear() - d.getFullYear();
    const m = n.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && n.getDate() < d.getDate())) y--;
    return `${y}a`;
  };

  const ageLabelForMember = (member) => {
    if (typeof member?.edadCalculada === 'number') return `${member.edadCalculada}a`;
    if (member?.edadTexto) return member.edadTexto;
    return yearsSince(member?.nacimiento);
  };
  const sexShape = (s) => (s === 'M' ? 'square' : s === 'F' ? 'circle' : 'diamond');

  return (
    <g>
      {layout.nodes.map((n) => {
        const m = membersById.get(n.id);
        if (!m) return null;
        const shape = m.simbolo && m.simbolo !== 'auto' ? m.simbolo : sexShape(m.sexo);
        const labelTop = (m.filiatorios?.iniciales || m.rol || '') || null;
        const bottomParts = [m.nombre || '—'];
        const ageLabel = ageLabelForMember(m);
        if (ageLabel) bottomParts.push(ageLabel);
        const bottom = bottomParts.join(' · ') + (m.estado === 'fallecido' ? ' · †' : '');
        const isProband = proband && proband.id === m.id;
        return (
          <NodeShape
            key={m.id}
            shape={shape}
            x={n.x}
            y={n.y}
            r={n.r}
            isProband={!!isProband}
            labelTop={labelTop || undefined}
            labelBottom={bottom}
            selected={selectedId === m.id}
            onClick={() => onSelect(m.id)}
            dead={m.estado === 'fallecido'}
          />
        );
      })}
    </g>
  );
}

export default function PedigreeCanvas({ vp, layout, membersById, proband, selectedId, onSelect }) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
        <div className="text-sm font-semibold">Árbol / Pedigrí</div>
        <Legend />
      </div>

      <div
        ref={vp.containerRef}
        className="w-full h-[640px] bg-white cursor-grab active:cursor-grabbing"
        onMouseMove={vp.onMouseMove}
        onMouseUp={vp.onMouseUp}
        onMouseLeave={vp.onMouseUp}
      >
        <svg ref={vp.svgRef} width="100%" height="100%" viewBox={vp.viewBox} onMouseDown={vp.onMouseDown}>
          <rect x={-10000} y={-10000} width={20000} height={20000} fill="#ffffff" />
          <CoupleLines layout={layout} membersById={membersById} />
          <ChildLines layout={layout} />
          <Nodes
            layout={layout}
            membersById={membersById}
            proband={proband}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </svg>
      </div>
    </>
  );
}
