import React, { useMemo } from 'react';
import Legend from './Legend';
import NodeShape from './NodeShape';

function partnerKey(a, b) {
  return [a, b].sort().join('|');
}

function CoupleLines({ layout, relationships, onPartnerClick }) {
  const partnerInfo = useMemo(() => {
    const map = new Map();
    (relationships || []).forEach((rel) => {
      if (rel.type !== 'partner') return;
      if (!rel.a || !rel.b) return;
      map.set(partnerKey(rel.a, rel.b), {
        status: rel.status || 'current',
        consanguinity: !!rel.consanguinity,
      });
    });
    return map;
  }, [relationships]);

  return (
    <g>
      {layout.coupleLines.map((line, index) => {
        const info = partnerInfo.get(partnerKey(line.a, line.b)) || {
          status: 'current',
          consanguinity: false,
        };
        const status = info.status || 'current';
        const consanguineous = info.consanguinity;
        const isEnded = status === 'ended';
        const stroke = isEnded ? '#f97316' : '#0ea5b7';
        const strokeDash = isEnded ? '8 6' : undefined;
        const renderLine = (offset = 0) => (
          <line
            x1={line.x1}
            y1={line.y + offset}
            x2={line.x2}
            y2={line.y + offset}
            stroke={stroke}
            strokeWidth="3"
            strokeDasharray={strokeDash}
          />
        );
        const handleClick = (event) => {
          event.stopPropagation();
          onPartnerClick?.({
            a: line.a,
            b: line.b,
            status,
            consanguinity: consanguineous,
            anchor: { x: event.clientX, y: event.clientY },
          });
        };
        return (
          <g key={`c-${index}`} onClick={handleClick} style={{ cursor: 'pointer' }}>
            {consanguineous ? (
              <>
                {renderLine(-3)}
                {renderLine(3)}
              </>
            ) : (
              renderLine(0)
            )}
            <rect
              x={line.midX - 6}
              y={line.midY - 6}
              width={12}
              height={12}
              rx={2}
              ry={2}
              fill="#ffffff"
              stroke={stroke}
            />
            {isEnded && (
              <line
                x1={line.midX - 8}
                y1={line.midY - 8}
                x2={line.midX + 8}
                y2={line.midY + 8}
                stroke="#f97316"
                strokeWidth="2.5"
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
      {layout.childLines.map((line, index) => {
        const dash = line.dashed ? '6 4' : undefined;
        return (
          <line
            key={`child-${index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#0ea5b7"
            strokeWidth={line.type === 'stub' ? 2 : 3}
            strokeDasharray={dash}
          />
        );
      })}
    </g>
  );
}

function Nodes({ layout, displayById, probandId, selectedId, onSelect }) {
  return (
    <g>
      {layout.nodes.map((node) => {
        const display = displayById.get(node.id);
        if (!display) return null;
        const labelTop = display.role ? `${display.name} · ${display.role}` : display.name;
        const infoLines = display.infoLines.filter((line) => !line.startsWith('edad:'));
        const ageLine = display.infoLines.find((line) => line.startsWith('edad:'));
        const bottomLines = [];
        if (ageLine) bottomLines.push(ageLine.replace('edad:', 'edad '));
        bottomLines.push(...infoLines);

        return (
          <NodeShape
            key={display.id}
            id={display.id}
            shape={display.shape}
            shading={display.shading}
            x={node.x}
            y={node.y}
            r={node.r}
            isProband={probandId === display.id}
            labelTop={labelTop}
            labelBottomLines={bottomLines}
            selected={selectedId === display.id}
            dead={display.dead}
            onClick={() => onSelect(display.id)}
          />
        );
      })}
    </g>
  );
}

export default function PedigreeCanvas({
  vp,
  layout,
  displayById,
  legend,
  legendUsage,
  metadata,
  relationships = [],
  selectedId,
  onSelect,
  probandId,
  onDropTool,
  onPartnerClick,
}) {
  const activeLegendUsage = useMemo(
    () => legendUsage?.length ? legendUsage : [],
    [legendUsage],
  );

  const metadataReason = useMemo(() => {
    const value = metadata?.reason;
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      return value.detailLabel || value.groupLabel || value.label || JSON.stringify(value);
    }
    return '—';
  }, [metadata?.reason]);

  const privacyNames = typeof metadata?.privacy?.names === 'string'
    ? metadata.privacy.names
    : 'initials';
  const privacyDates = typeof metadata?.privacy?.dates === 'string'
    ? metadata.privacy.dates
    : 'year-only';

  const handleDrop = (event) => {
    if (!onDropTool) return;
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/pedigree-tool');
    if (!raw) return;
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const [vx, vy, vw, vh] = (vp.viewBox || '0 0 100 100').split(/\s+/).map(Number);
    const x = vx + (px / rect.width) * vw;
    const y = vy + (py / rect.height) * vh;
    onDropTool(payload, { x, y });
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
        <div>
          <div className="text-sm font-semibold">Árbol / Pedigrí</div>
          <div className="text-[11px] text-slate-500">
            Motivo: {metadataReason || '—'} · Privacidad: {privacyNames}/{privacyDates}
          </div>
        </div>
        <Legend legend={legend} usage={activeLegendUsage} />
      </div>

      <div
        ref={vp.containerRef}
        className="w-full h-[640px] bg-white cursor-grab active:cursor-grabbing"
        onMouseMove={vp.onMouseMove}
        onMouseUp={vp.onMouseUp}
        onMouseLeave={vp.onMouseUp}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <svg
          ref={vp.svgRef}
          width="100%"
          height="100%"
          viewBox={vp.viewBox}
          onMouseDown={vp.onMouseDown}
        >
          <rect x={-10000} y={-10000} width={20000} height={20000} fill="#ffffff" />
          <CoupleLines
            layout={layout}
            relationships={relationships}
            onPartnerClick={onPartnerClick}
          />
         <ChildLines layout={layout} />
         <Nodes
           layout={layout}
           displayById={displayById}
           probandId={probandId}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </svg>
      </div>
    </>
  );
}
