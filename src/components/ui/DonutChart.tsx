interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
}

export default function DonutChart({
  data,
  size = 180,
  strokeWidth = 28,
  showLegend = true,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="flex-shrink-0"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="oklch(var(--background-200))"
          strokeWidth={strokeWidth}
        />
        {data.map((item) => {
          const itemCircumference = (item.value / total) * circumference;
          const dashArray = `${itemCircumference} ${circumference - itemCircumference}`;
          const currentOffset = offset;
          offset -= itemCircumference;

          return (
            <circle
              key={item.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={currentOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />
          );
        })}
        {/* Center text */}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          className="text-sm font-bold"
          fill="oklch(var(--foreground-950))"
          fontSize="18"
          fontWeight="700"
        >
          {total}
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          className="text-xs"
          fill="oklch(var(--foreground-500))"
          fontSize="10"
        >
          Tổng
        </text>
      </svg>

      {showLegend && (
        <div className="flex flex-col gap-2">
          {data.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              ></span>
              <span className="text-xs text-foreground-600">{item.label}</span>
              <span className="text-xs font-semibold text-foreground-900 ml-auto">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
