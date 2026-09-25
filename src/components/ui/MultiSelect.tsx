import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface SelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  values: string[];
  options: SelectOption[];
  placeholder?: string;
  onChange: (values: string[]) => void;
  className?: string;
}

export default function MultiSelect({
  values,
  options,
  placeholder,
  onChange,
  className = "",
}: MultiSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabels = values
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean) as string[];

  const toggleOption = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-4 py-3.5 text-sm rounded-xl border transition-all cursor-pointer text-left ${
          open
            ? "bg-background-50 border-primary-300 ring-2 ring-primary-100"
            : "bg-background-100/60 border-transparent hover:bg-background-50 hover:border-background-200"
        }`}
      >
        <span
          className={`flex-1 truncate ${values.length > 0 ? "text-foreground-900" : "text-foreground-500"}`}
        >
          {values.length > 0
            ? selectedLabels.join(", ")
            : placeholder || t("common.select")}
        </span>
        <i
          className={`ri-arrow-down-s-line text-foreground-400 flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        ></i>
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-background-50 border border-background-200/70 rounded-xl shadow-xl shadow-background-950/10 overflow-hidden max-h-[280px] overflow-y-auto">
          {options.map((option) => {
            const isSelected = values.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleOption(option.value)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-foreground-700 hover:bg-background-100"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? "bg-primary-500"
                      : "border border-background-300"
                  }`}
                >
                  {isSelected && (
                    <i className="ri-check-line text-[10px] text-white"></i>
                  )}
                </div>
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {values.map((val) => {
            const label = options.find((o) => o.value === val)?.label || val;
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full whitespace-nowrap"
              >
                {label}
                <button
                  type="button"
                  onClick={() => toggleOption(val)}
                  className="cursor-pointer hover:text-primary-900 w-3.5 h-3.5 flex items-center justify-center"
                >
                  <i className="ri-close-line"></i>
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
