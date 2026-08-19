interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  showValues?: boolean;
}

export default function LineChart({
  data,
  height = 200,
  strokeColor = 'var(--primary-500)',
  fillColor = 'var(--primary-100)',
  showValues = true,
}: LineChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const padding = { top: 24, right: 16, bottom: 40, left: 16 };
  const chartWidth = 600;
  const stepX = data.length > 1 ? (chartWidth - padding.left - padding.right) / (data.length - 1) : 0;

  const getX = (index: number) => padding.left + index * stepX;
  const getY = (value: number) => padding.top + height - (value / maxValue) * height;

  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const areaPoints = `${getX(0)},${padding.top + height} ${points} ${getX(data.length - 1)},${padding.top + height}`;

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${height + padding.top + padding.bottom}`}
      className="w-full"
      style={{ height: `${height + padding.top + padding.bottom}px` }}
    >
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
        <line
          key={ratio}
          x1={padding.left}
          y1={padding.top + height * (1 - ratio)}
          x2={chartWidth - padding.right}
          y2={padding.top + height * (1 - ratio)}
          stroke="oklch(var(--background-300))"
          strokeWidth="1"
          strokeDasharray={ratio === 0 ? '0' : '4 4'}
        />
      ))}

      {/* Area fill */}
      <polygon
        points={areaPoints}
        fill={fillColor}
        opacity={0.3}
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points */}
      {data.map((d, i) => (
        <g key={d.label}>
          <circle
            cx={getX(i)}
            cy={getY(d.value)}
            r="4"
            fill="oklch(var(--background-50))"
            stroke={strokeColor}
            strokeWidth="2"
          />
          {showValues && (
            <text
              x={getX(i)}
              y={getY(d.value) - 12}
              textAnchor="middle"
              fill="oklch(var(--foreground-700))"
              fontSize="11"
              fontWeight="600"
            >
              {d.value}
            </text>
          )}
          <text
            x={getX(i)}
            y={padding.top + height + 18}
            textAnchor="middle"
            fill="oklch(var(--foreground-500))"
            fontSize="11"
          >
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  );
}