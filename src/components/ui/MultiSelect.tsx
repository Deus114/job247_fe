import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface MultiSelectProps {
  values: string[];
  options?: SelectOption[];
  /** When set, options are shown under group labels. Clicking a group toggles all. */
  groups?: SelectGroup[];
  placeholder?: string;
  onChange: (values: string[]) => void;
  className?: string;
  outlined?: boolean;
  /** Hide selected chips under the trigger (useful in tight filter bars). */
  hideChips?: boolean;
}

export default function MultiSelect({
  values,
  options = [],
  groups,
  placeholder,
  onChange,
  className = "",
  outlined = false,
  hideChips = false,
}: MultiSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const flatOptions = useMemo(() => {
    if (groups?.length) {
      return groups.flatMap((group) => group.options);
    }
    return options;
  }, [groups, options]);

  const selectedLabels = values
    .map((v) => flatOptions.find((o) => o.value === v)?.label)
    .filter(Boolean) as string[];

  const toggleOption = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const toggleGroup = (group: SelectGroup) => {
    const ids = group.options.map((o) => o.value);
    if (ids.length === 0) return;
    const allSelected = ids.every((id) => values.includes(id));
    if (allSelected) {
      onChange(values.filter((v) => !ids.includes(v)));
    } else {
      onChange(Array.from(new Set([...values, ...ids])));
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

  const renderOption = (option: SelectOption) => {
    const isSelected = values.includes(option.value);
    return (
      <button
        key={option.value}
        type="button"
        onClick={() => toggleOption(option.value)}
        className={`w-full flex items-start gap-3 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer min-h-[44px] ${
          isSelected
            ? "bg-primary-50 text-primary-700 font-medium"
            : "text-foreground-700 hover:bg-background-100"
        }`}
      >
        <div
          className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
            isSelected ? "bg-primary-500" : "border border-background-300"
          }`}
        >
          {isSelected && (
            <i className="ri-check-line text-[10px] text-white"></i>
          )}
        </div>
        <span className="flex-1 min-w-0 whitespace-normal break-words leading-snug">
          {option.label}
        </span>
      </button>
    );
  };

  const triggerClass = outlined
    ? open
      ? "bg-background-50 border-primary-300 ring-2 ring-primary-100 h-10 px-3"
      : "bg-background-50 border-background-200/70 hover:border-primary-300 h-10 px-3"
    : open
      ? "bg-background-50 border-primary-300 ring-2 ring-primary-100 px-4 py-3.5"
      : "bg-background-100/60 border-transparent hover:bg-background-50 hover:border-background-200 px-4 py-3.5";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 text-sm rounded-xl border transition-all cursor-pointer text-left ${triggerClass}`}
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
        <div className="absolute z-50 left-0 right-0 mt-2 bg-background-50 border border-background-200/70 rounded-xl shadow-xl shadow-background-950/10 overflow-hidden max-h-[320px] overflow-y-auto">
          {groups?.length
            ? groups.map((group) => {
                const ids = group.options.map((o) => o.value);
                const selectedCount = ids.filter((id) =>
                  values.includes(id),
                ).length;
                const allSelected =
                  ids.length > 0 && selectedCount === ids.length;
                const partial = selectedCount > 0 && !allSelected;
                return (
                  <div key={group.label}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-foreground-600 bg-background-100/80 sticky top-0 hover:bg-background-100 cursor-pointer min-h-[40px]"
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 ${
                          allSelected
                            ? "bg-primary-500"
                            : partial
                              ? "border border-primary-400 bg-primary-100"
                              : "border border-background-300"
                        }`}
                      >
                        {allSelected ? (
                          <i className="ri-check-line text-[9px] text-white"></i>
                        ) : partial ? (
                          <i className="ri-subtract-line text-[9px] text-primary-600"></i>
                        ) : null}
                      </div>
                      <span className="truncate">{group.label}</span>
                    </button>
                    {group.options.length > 0 ? (
                      group.options.map(renderOption)
                    ) : (
                      <p className="px-4 py-2 text-xs text-foreground-400">
                        {t("common.noData")}
                      </p>
                    )}
                  </div>
                );
              })
            : options.map(renderOption)}
        </div>
      )}

      {!hideChips && values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {values.map((val) => {
            const label = flatOptions.find((o) => o.value === val)?.label || val;
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
