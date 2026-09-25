interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
  height?: number;
  barColor?: string;
  showValues?: boolean;
}

export default function BarChart({
  data,
  maxValue,
  height = 200,
  barColor = "var(--primary-500)",
  showValues = true,
}: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const barWidth = data.length > 0 ? Math.min(48, 600 / data.length) : 48;
  const gap = 12;
  const chartWidth = data.length * (barWidth + gap);
  const padding = { top: 20, right: 10, bottom: 40, left: 10 };

  return (
    <svg
      viewBox={`0 0 ${Math.max(chartWidth + padding.left + padding.right, 300)} ${height + padding.top + padding.bottom}`}
      className="w-full"
      style={{ height: `${height + padding.top + padding.bottom}px` }}
    >
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
        <line
          key={ratio}
          x1={padding.left}
          y1={padding.top + height * (1 - ratio)}
          x2={padding.left + chartWidth}
          y2={padding.top + height * (1 - ratio)}
          stroke="oklch(var(--background-300))"
          strokeWidth="1"
          strokeDasharray={ratio === 0 ? "0" : "4 4"}
        />
      ))}

      {data.map((item, index) => {
        const x = padding.left + index * (barWidth + gap) + gap / 2;
        const barHeight = (item.value / max) * height;
        const y = padding.top + height - barHeight;
        const fillColor = item.color ? item.color : barColor;

        return (
          <g key={item.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={fillColor}
              opacity={0.85}
            />
            {showValues && (
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="text-xs"
                fill="oklch(var(--foreground-700))"
                fontSize="11"
                fontWeight="600"
              >
                {item.value}
              </text>
            )}
            <text
              x={x + barWidth / 2}
              y={padding.top + height + 18}
              textAnchor="middle"
              className="text-xs"
              fill="oklch(var(--foreground-500))"
              fontSize="11"
            >
              {item.label.length > 10
                ? `${item.label.slice(0, 10)}...`
                : item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
