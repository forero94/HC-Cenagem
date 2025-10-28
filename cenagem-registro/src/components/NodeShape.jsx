import React, { memo, useId } from 'react';

function NodeShape({
  id,
  shape,
  shading = 'none',
  x,
  y,
  r,
  isProband,
  labelTop,
  labelBottomLines = [],
  selected,
  dead,
  onClick,
}) {
  const uid = useId();
  const stroke = selected ? '#2563eb' : '#0f172a';
  const baseFill = shading === 'filled' ? '#0f172a' : '#ffffff';
  const textStyle = { fontSize: 11, fill: '#334155' };

  const handleClick = (event) => {
    event.stopPropagation();
    onClick?.(event);
  };

  const circleClipId = `${uid}-circle`;
  const diamondClipId = `${uid}-diamond`;

  return (
    <g onClick={handleClick} role="button" aria-label={labelTop} style={{ cursor: 'pointer' }}>
      {shape === 'circle' && (
        <>
          <defs>
            <clipPath id={circleClipId}>
              <circle cx={x} cy={y} r={r} />
            </clipPath>
          </defs>
          <circle cx={x} cy={y} r={r} fill={baseFill} stroke={stroke} strokeWidth={selected ? 3 : 1.8} />
          {shading === 'half' && (
            <rect
              x={x - r}
              y={y - r}
              width={r}
              height={2 * r}
              fill="#0f172a"
              clipPath={`url(#${circleClipId})`}
            />
          )}
          {shading === 'dot' && <circle cx={x} cy={y} r={r * 0.22} fill="#0f172a" />}
        </>
      )}

      {shape === 'square' && (
        <>
          <rect
            x={x - r}
            y={y - r}
            width={2 * r}
            height={2 * r}
            rx="4"
            ry="4"
            fill={baseFill}
            stroke={stroke}
            strokeWidth={selected ? 3 : 1.8}
          />
          {shading === 'half' && (
            <rect x={x - r} y={y - r} width={r} height={2 * r} fill="#0f172a" rx="4" ry="4" />
          )}
          {shading === 'dot' && <circle cx={x} cy={y} r={r * 0.22} fill="#0f172a" />}
        </>
      )}

      {shape === 'diamond' && (
        <>
          <defs>
            <clipPath id={diamondClipId}>
              <rect
                x={x - r}
                y={y - r}
                width={2 * r}
                height={2 * r}
                transform={`rotate(45 ${x} ${y})`}
              />
            </clipPath>
          </defs>
          <rect
            x={x - r}
            y={y - r}
            width={2 * r}
            height={2 * r}
            transform={`rotate(45 ${x} ${y})`}
            fill={baseFill}
            stroke={stroke}
            strokeWidth={selected ? 3 : 1.8}
          />
          {shading === 'half' && (
            <rect
              x={x - r}
              y={y - r}
              width={r}
              height={2 * r}
              fill="#0f172a"
              clipPath={`url(#${diamondClipId})`}
            />
          )}
          {shading === 'dot' && <circle cx={x} cy={y} r={r * 0.22} fill="#0f172a" />}
        </>
      )}

      {isProband && (
        <circle
          cx={x}
          cy={y}
          r={r + 4}
          stroke="#0f172a"
          strokeWidth="1.4"
          fill="none"
          strokeDasharray="4 2"
        />
      )}

      {labelTop && (
        <text x={x} y={y - r - 12} textAnchor="middle" style={textStyle}>
          {labelTop}
        </text>
      )}

      {labelBottomLines.length > 0 && (
        <text x={x} y={y + r + 14} textAnchor="middle" style={textStyle}>
          {labelBottomLines.map((line, index) => (
            <tspan
              key={`${id}-line-${index}`}
              x={x}
              dy={index === 0 ? 0 : 14}
            >
              {line}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
}

export default memo(NodeShape);

