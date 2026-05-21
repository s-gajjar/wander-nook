"use client";

type DataPoint = {
  date: string;
  amount: number;
};

export default function RevenueChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) return null;

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
                stroke="#F3F4F6"
                strokeWidth="1"
              />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[10px]" fill="#9CA3AF" fontSize="10">
                ₹{tick.toLocaleString("en-IN")}
              </text>
            </g>
          );
        })}

        {/* Area */}
        <path d={areaPath} fill="url(#revenueGradient)" opacity="0.15" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots on non-zero points */}
        {points
          .filter((p) => p.amount > 0)
          .map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#4F46E5" stroke="white" strokeWidth="1.5" />
          ))}

        {/* X labels */}
        {xLabelIndices.map((idx) => {
          const p = points[idx];
          if (!p) return null;
          const dateLabel = new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          return (
            <text key={idx} x={p.x} y={height - 5} textAnchor="middle" fill="#9CA3AF" fontSize="10">
              {dateLabel}
            </text>
          );
        })}

        {/* Gradient def */}
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
