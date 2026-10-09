import { useState } from "react";

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
  const [active, setActive] = useState<number | null>(null);
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const barWidth = data.length > 0 ? Math.min(48, 600 / data.length) : 48;
  const gap = 12;
  const chartWidth = data.length * (barWidth + gap);
  const padding = { top: 20, right: 10, bottom: 40, left: 10 };
  const svgWidth = Math.max(chartWidth + padding.left + padding.right, 300);
  const svgHeight = height + padding.top + padding.bottom;
  const hovered = active != null ? data[active] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full"
        style={{ height: `${svgHeight}px` }}
      >
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
            <g
              key={`${item.label}-${index}`}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
            >
              <title>{item.label}</title>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 0)}
                rx={4}
                fill={fillColor}
                opacity={0.85}
                className="cursor-pointer"
              />
              {showValues && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
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
      {hovered && active != null && (
        <div
          className="pointer-events-none absolute z-10 max-w-[16rem] -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-lg bg-foreground-950 px-2.5 py-1.5 text-xs leading-snug text-background-50 shadow-lg"
          style={{
            left: `${((padding.left + active * (barWidth + gap) + gap / 2 + barWidth / 2) / svgWidth) * 100}%`,
            top: `${((padding.top + height - (hovered.value / max) * height) / svgHeight) * 100}%`,
          }}
        >
          {hovered.label}
        </div>
      )}
    </div>
  );
}
