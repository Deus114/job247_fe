import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  icon?: string;
  compact?: boolean;
  /** Visible border + fixed height for toolbar/filter rows */
  outlined?: boolean;
  required?: boolean;
}

export default function CustomSelect({
  value,
  options,
  placeholder,
  onChange,
  className = '',
  icon,
  compact = false,
  outlined = false,
  required = false,
}: CustomSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label || placeholder || t('common.select');

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
    },
    [onChange]
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const btnPadding = outlined || compact ? 'px-3' : 'px-4 py-3.5';
  const optPadding = compact || outlined ? 'px-3 py-2' : 'px-4 py-2.5';
  const heightClass = outlined ? 'h-10' : compact ? '' : '';

  return (
    <div ref={ref} className={`relative ${className}`}>
      {required && (
        <input
          tabIndex={-1}
          required
          value={value}
          onChange={() => undefined}
          className="sr-only"
          aria-hidden="true"
        />
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 ${btnPadding} ${heightClass} text-sm rounded-xl border transition-all cursor-pointer text-left whitespace-nowrap ${
          outlined
            ? open
              ? 'bg-background-50 border-primary-300 ring-2 ring-primary-100'
              : 'bg-background-50 border-background-200/70 hover:border-primary-300'
            : open
              ? 'bg-background-50 border-primary-300 ring-2 ring-primary-100'
              : 'bg-background-100/60 border-transparent hover:bg-background-50 hover:border-background-200'
        } ${value ? 'text-foreground-900' : 'text-foreground-500'}`}
      >
        {icon && <i className={`${icon} text-foreground-400 flex-shrink-0`}></i>}
        <span className="flex-1 truncate">{selectedLabel}</span>
        <i
          className={`ri-arrow-down-s-line text-foreground-400 flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        ></i>
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-background-50 border border-background-200/70 rounded-xl shadow-xl shadow-background-950/10 overflow-hidden max-h-[280px] overflow-y-auto">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center gap-3 ${optPadding} text-sm text-left transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-foreground-700 hover:bg-background-100'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-primary-500' : 'border border-background-300'
                  }`}
                >
                  {isSelected && <i className="ri-check-line text-[10px] text-white"></i>}
                </div>
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}