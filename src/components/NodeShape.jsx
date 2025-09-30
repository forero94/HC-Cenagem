import React, { memo } from "react";

function NodeShape({ shape, x, y, r, isProband, labelTop, labelBottom, selected, dead, onClick }) {
  const stroke = selected ? "#2563eb" : "#0f172a";
  const fill = "#ffffff";
  const textStyle = { fontSize: 11, fill: "#334155" };
  const handleClick = (event) => {
    event.stopPropagation();
    if (onClick) onClick(event);
  };

  return (
    <g onClick={handleClick} role="button" style={{ cursor: "pointer" }}>
      {shape === "square" && (
        <rect
          x={x - r}
          y={y - r}
          width={2 * r}
          height={2 * r}
          rx="4"
          ry="4"
          fill={fill}
          stroke={stroke}
          strokeWidth={selected ? 3 : 1}
        />
      )}
      {shape === "circle" && (
        <circle
          cx={x}
          cy={y}
          r={r}
          fill={fill}
          stroke={stroke}
          strokeWidth={selected ? 3 : 1}
        />
      )}
      {shape === "diamond" && (
        <rect
          x={x - r}
          y={y - r}
          width={2 * r}
          height={2 * r}
          transform={`rotate(45 ${x} ${y})`}
          fill={fill}
          stroke={stroke}
          strokeWidth={selected ? 3 : 1}
        />
      )}
      {isProband && <circle cx={x} cy={y} r={4} fill="#0f172a" />}
      {dead && (
        <line x1={x - r - 6} y1={y - r - 6} x2={x + r + 6} y2={y + r + 6} stroke="#ef4444" strokeWidth="2" />
      )}
      {labelTop && (
        <text x={x} y={y - r - 10} textAnchor="middle" style={textStyle}>
          {labelTop}
        </text>
      )}
      {labelBottom && (
        <text x={x} y={y + r + 14} textAnchor="middle" style={textStyle}>
          {labelBottom}
        </text>
      )}
    </g>
  );
}

export default memo(NodeShape);
