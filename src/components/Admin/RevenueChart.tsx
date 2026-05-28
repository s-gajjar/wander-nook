"use client";

import { useTheme } from "./ThemeProvider";

type DataPoint = {
  date: string;
  amount: number;
};

export default function RevenueChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) return null;

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const gridColor = isDark ? "#374151" : "#F3F4F6";
  const labelColor = isDark ? "#6B7280" : "#9CA3AF";
  const lineColor = isDark ? "#818CF8" : "#4F46E5";
  const dotStroke = isDark ? "#1F2937" : "white";

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const width = 800;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Points
  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - (d.amount / maxAmount) * chartH,
    ...d,
  }));

  // SVG path for the line
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  // Area fill path
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${padding.top + chartH} L ${points[0].x.toFixed(1)} ${padding.top + chartH} Z`;

  // Y-axis labels
  const yTicks = [0, Math.round(maxAmount / 2), Math.round(maxAmount)];

  // X-axis labels (show ~5 dates)
  const xLabelIndices = [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor((3 * data.length) / 4), data.length - 1];

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yTicks.map((tick) => {
          const y = padding.top + chartH - (tick / maxAmount) * chartH;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke={gridColor}
                strokeWidth="1"
              />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fill={labelColor} fontSize="10">
                ₹{tick.toLocaleString("en-IN")}
              </text>
            </g>
          );
        })}

        {/* Area */}
        <path d={areaPath} fill="url(#revenueGradient)" opacity={isDark ? "0.25" : "0.15"} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots on non-zero points */}
        {points
          .filter((p) => p.amount > 0)
          .map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill={lineColor} stroke={dotStroke} strokeWidth="1.5" />
          ))}

        {/* X labels */}
        {xLabelIndices.map((idx) => {
          const p = points[idx];
          if (!p) return null;
          const dateLabel = new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          return (
            <text key={idx} x={p.x} y={height - 5} textAnchor="middle" fill={labelColor} fontSize="10">
              {dateLabel}
            </text>
          );
        })}

        {/* Gradient def */}
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
