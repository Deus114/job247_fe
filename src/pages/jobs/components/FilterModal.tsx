import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface FilterState {
  categories: string[];
  locations: string[];
  educations: string[];
  types: string[];
  companies: string[];
  salaryMin: string;
  salaryMax: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  locations: string[];
  educationLevels: string[];
  types: string[];
  companies: string[];
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
}

const salaryPresets = [
  { min: '', max: '10', label: 'Dưới 10 triệu' },
  { min: '10', max: '20', label: '10 - 20 triệu' },
  { min: '20', max: '35', label: '20 - 35 triệu' },
  { min: '35', max: '50', label: '35 - 50 triệu' },
  { min: '50', max: '', label: 'Trên 50 triệu' },
];

function CheckboxGroup({
  title,
  icon,
  items,
  selected,
  onToggle,
}: {
  title: string;
  icon: string;
  items: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
          <i className={`${icon} text-sm text-primary-600`}></i>
        </div>
        <h4 className="text-sm font-semibold text-foreground-950">{title}</h4>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((item) => {
          const isSelected = selected.includes(item);
          return (
            <button
              key={item}
              onClick={() => onToggle(item)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer border text-left ${
                isSelected
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'bg-background-50 border-background-200/70 text-foreground-600 hover:border-background-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected ? 'bg-primary-500' : 'border border-background-300'
                }`}
              >
                {isSelected && <i className="ri-check-line text-[10px] text-white"></i>}
              </div>
              <span className="truncate">{item}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FilterModal({
  isOpen,
  onClose,
  categories,
  locations,
  educationLevels,
  types,
  companies,
  filters,
  onApply,
  onClear,
}: FilterModalProps) {
  const { t } = useTranslation();

  const [local, setLocal] = useState<FilterState>(filters);

  // Sync local state when parent filters change (e.g. clear from outside)
  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  const activeCount = useMemo(() => {
    let count = 0;
    count += local.categories.length;
    count += local.locations.length;
    count += local.educations.length;
    count += local.types.length;
    count += local.companies.length;
    if (local.salaryMin || local.salaryMax) count += 1;
    return count;
  }, [local]);

  const toggle = (key: keyof FilterState, val: string) => {
    setLocal((prev) => {
      const arr = prev[key] as string[];
      if (arr.includes(val)) {
        return { ...prev, [key]: arr.filter((v) => v !== val) };
      }
      return { ...prev, [key]: [...arr, val] };
    });
  };

  const applySalaryPreset = (min: string, max: string) => {
    setLocal((prev) => ({ ...prev, salaryMin: min, salaryMax: max }));
  };

  const isPresetActive = (min: string, max: string) =>
    local.salaryMin === min && local.salaryMax === max;

  const handleClear = () => {
    setLocal({ categories: [], locations: [], educations: [], types: [], companies: [], salaryMin: '', salaryMax: '' });
  };

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-background-50 rounded-2xl border border-background-200/70 shadow-2xl w-full max-w-[720px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-background-200/70 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
              <i className="ri-equalizer-line text-primary-600"></i>
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-foreground-950">{t('job.filter') || 'Bộ lọc'}</h3>
              <p className="text-xs text-foreground-500">Chọn nhiều điều kiện để tìm việc phù hợp</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button
                onClick={handleClear}
                className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-refresh-line mr-1"></i>Xóa bộ lọc
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-background-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-lg text-foreground-500"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-7">
          {/* Categories */}
          {categories.length > 0 && (
            <CheckboxGroup
              title="Ngành nghề"
              icon="ri-briefcase-line"
              items={categories}
              selected={local.categories}
              onToggle={(v) => toggle('categories', v)}
            />
          )}

          {/* Companies */}
          {companies.length > 0 && (
            <CheckboxGroup
              title="Công ty"
              icon="ri-building-line"
              items={companies}
              selected={local.companies}
              onToggle={(v) => toggle('companies', v)}
            />
          )}

          {/* Locations */}
          {locations.length > 0 && (
            <CheckboxGroup
              title="Địa điểm"
              icon="ri-map-pin-line"
              items={locations}
              selected={local.locations}
              onToggle={(v) => toggle('locations', v)}
            />
          )}

          {/* Education */}
          {educationLevels.length > 0 && (
            <CheckboxGroup
              title="Trình độ"
              icon="ri-graduation-cap-line"
              items={educationLevels}
              selected={local.educations}
              onToggle={(v) => toggle('educations', v)}
            />
          )}

          {/* Job Types */}
          {types.length > 0 && (
            <CheckboxGroup
              title="Loại công việc"
              icon="ri-time-line"
              items={types}
              selected={local.types}
              onToggle={(v) => toggle('types', v)}
            />
          )}

          {/* Salary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-accent-100 flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-sm text-accent-600"></i>
              </div>
              <h4 className="text-sm font-semibold text-foreground-950">Mức lương (triệu VND)</h4>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              {salaryPresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applySalaryPreset(preset.min, preset.max)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border whitespace-nowrap ${
                    isPresetActive(preset.min, preset.max)
                      ? 'bg-accent-50 border-accent-300 text-accent-700'
                      : 'bg-background-50 border-background-200/70 text-foreground-600 hover:border-background-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom range */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[11px] text-foreground-500 mb-1 block">Từ</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={local.salaryMin}
                    onChange={(e) => setLocal((prev) => ({ ...prev, salaryMin: e.target.value }))}
                    className="w-full pl-3 pr-8 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground-400">tr</span>
                </div>
              </div>
              <span className="text-foreground-400 mt-5">—</span>
              <div className="flex-1">
                <label className="text-[11px] text-foreground-500 mb-1 block">Đến</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={local.salaryMax}
                    onChange={(e) => setLocal((prev) => ({ ...prev, salaryMax: e.target.value }))}
                    className="w-full pl-3 pr-8 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all"
                    placeholder="∞"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground-400">tr</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-background-200/70 flex-shrink-0">
          <span className="text-xs text-foreground-500">
            {activeCount > 0 ? `Đã chọn ${activeCount} điều kiện lọc` : 'Chưa chọn điều kiện nào'}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap border border-background-200/70"
            >
              Hủy
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary-500 text-white hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap shadow-lg shadow-primary-500/15"
            >
              Áp dụng {activeCount > 0 && `(${activeCount})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}