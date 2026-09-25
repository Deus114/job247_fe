import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

export interface ColumnDef {
  key: string;
  label: string;
}

interface ColumnVisibilityDropdownProps {
  columns: ColumnDef[];
  visibleKeys: string[];
  onChange: (visibleKeys: string[]) => void;
}

export default function ColumnVisibilityDropdown({
  columns,
  visibleKeys,
  onChange,
}: ColumnVisibilityDropdownProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(visibleKeys || []);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(visibleKeys || []);
  }, [visibleKeys, open]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggle = (key: string) => {
    setDraft((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const selectAll = () => setDraft(columns.map((c) => c.key));

  const confirm = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 h-10 px-3 border border-background-200/70 rounded-xl text-sm text-foreground-600 bg-background-50 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
        title={t("admin.selectColumns", "Chọn cột hiển thị")}
      >
        <i className="ri-layout-grid-line"></i>
        <span className="hidden sm:inline">{t("admin.columns", "Cột")}</span>
        <i
          className={`ri-arrow-down-s-line text-xs transition-transform ${open ? "rotate-180" : ""}`}
        ></i>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-background-50 border border-background-200/70 rounded-xl shadow-lg z-30 p-4">
          <p className="text-sm font-semibold text-foreground-800 mb-3">
            {t("admin.selectColumns", "Chọn cột hiển thị")}
          </p>
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {columns.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-2.5 cursor-pointer hover:bg-background-100 rounded-lg p-1.5 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={(draft || []).includes(col.key)}
                  onChange={() => toggle(col.key)}
                  className="w-4 h-4 rounded border-background-300 text-primary-500 focus:ring-primary-200 cursor-pointer flex-shrink-0"
                />
                <span className="text-sm text-foreground-700">{col.label}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-background-200/70">
            <button
              onClick={selectAll}
              className="flex-1 py-2 border border-background-300 rounded-xl text-sm text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              Tất cả
            </button>
            <button
              onClick={confirm}
              className="flex-1 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              Xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
