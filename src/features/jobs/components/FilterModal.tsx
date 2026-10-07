import MultiSelect from "@/components/ui/MultiSelect";
import type {
  PublicEducationLevel,
  PublicIndustryGroup,
} from "@/types/catalog";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface FilterState {
  /** Selected industry ids (stringified). Group vs partial resolved on apply. */
  industryIds: string[];
  locations: string[];
  /** Selected education level ids (stringified). */
  educationIds: string[];
  types: string[];
  salaryMin: string;
  salaryMax: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  industryGroups: PublicIndustryGroup[];
  locations: string[];
  educationLevels: PublicEducationLevel[];
  types: string[];
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
        <i className={`${icon} text-sm text-primary-600`}></i>
      </div>
      <h4 className="text-sm font-semibold text-foreground-950">{title}</h4>
    </div>
  );
}

export default function FilterModal({
  isOpen,
  onClose,
  industryGroups,
  locations,
  educationLevels,
  types,
  filters,
  onApply,
  onClear,
}: FilterModalProps) {
  const { t } = useTranslation();
  const [local, setLocal] = useState<FilterState>(filters);

  const salaryPresets = useMemo(
    () => [
      { min: "", max: "10", label: t("job.salaryUnder10") },
      { min: "10", max: "20", label: t("job.salary10to20") },
      { min: "20", max: "35", label: t("job.salary20to35") },
      { min: "35", max: "50", label: t("job.salary35to50") },
      { min: "50", max: "", label: t("job.salaryOver50") },
    ],
    [t],
  );

  const industrySelectGroups = useMemo(
    () =>
      industryGroups.map((group) => ({
        label: group.name,
        options: group.industries.map((ind) => ({
          value: String(ind.id),
          label: ind.name,
        })),
      })),
    [industryGroups],
  );

  const locationOptions = useMemo(
    () => locations.map((name) => ({ value: name, label: name })),
    [locations],
  );

  const educationOptions = useMemo(
    () =>
      [...educationLevels]
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((item) => ({
          value: String(item.id),
          label: item.name,
        })),
    [educationLevels],
  );

  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  const activeCount = useMemo(() => {
    let count = 0;
    count += local.industryIds.length;
    count += local.locations.length;
    count += local.educationIds.length;
    count += local.types.length;
    if (local.salaryMin || local.salaryMax) count += 1;
    return count;
  }, [local]);

  const toggleType = (val: string) => {
    setLocal((prev) => {
      if (prev.types.includes(val)) {
        return { ...prev, types: prev.types.filter((v) => v !== val) };
      }
      return { ...prev, types: [...prev.types, val] };
    });
  };

  const applySalaryPreset = (min: string, max: string) => {
    setLocal((prev) => ({ ...prev, salaryMin: min, salaryMax: max }));
  };

  const isPresetActive = (min: string, max: string) =>
    local.salaryMin === min && local.salaryMax === max;

  const handleClear = () => {
    const empty: FilterState = {
      industryIds: [],
      locations: [],
      educationIds: [],
      types: [],
      salaryMin: "",
      salaryMax: "",
    };
    setLocal(empty);
    onClear();
  };

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-background-50 rounded-2xl border border-background-200/70 shadow-2xl w-full max-w-[560px] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-background-200/70 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
              <i className="ri-equalizer-line text-primary-600"></i>
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-foreground-950">
                {t("job.filter")}
              </h3>
              <p className="text-xs text-foreground-500">
                {t("job.filterDesc")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-refresh-line mr-1"></i>
                {t("job.clearFilter")}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-background-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-lg text-foreground-500"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {industrySelectGroups.length > 0 && (
            <div>
              <SectionTitle
                icon="ri-briefcase-line"
                title={t("postJob.category")}
              />
              <MultiSelect
                values={local.industryIds}
                onChange={(values) =>
                  setLocal((prev) => ({ ...prev, industryIds: values }))
                }
                groups={industrySelectGroups}
                placeholder={t("company.industryFilter")}
                className="w-full"
                outlined
              />
            </div>
          )}

          {locationOptions.length > 0 && (
            <div>
              <SectionTitle icon="ri-map-pin-line" title={t("job.location")} />
              <MultiSelect
                values={local.locations}
                onChange={(values) =>
                  setLocal((prev) => ({ ...prev, locations: values }))
                }
                options={locationOptions}
                placeholder={t("job.location")}
                className="w-full"
                outlined
              />
            </div>
          )}

          {educationOptions.length > 0 && (
            <div>
              <SectionTitle
                icon="ri-graduation-cap-line"
                title={t("job.educationLevel")}
              />
              <MultiSelect
                values={local.educationIds}
                onChange={(values) =>
                  setLocal((prev) => ({ ...prev, educationIds: values }))
                }
                options={educationOptions}
                placeholder={t("job.educationLevel")}
                className="w-full"
                outlined
              />
            </div>
          )}

          {types.length > 0 && (
            <div>
              <SectionTitle icon="ri-time-line" title={t("job.jobType")} />
              <div className="grid grid-cols-2 gap-2">
                {types.map((item) => {
                  const isSelected = local.types.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleType(item)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer border text-left min-h-[44px] ${
                        isSelected
                          ? "bg-primary-50 border-primary-300 text-primary-700"
                          : "bg-background-50 border-background-200/70 text-foreground-600 hover:border-background-300"
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
                      <span className="truncate">{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-accent-100 flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-sm text-accent-600"></i>
              </div>
              <h4 className="text-sm font-semibold text-foreground-950">
                {t("job.salaryMillionVnd")}
              </h4>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {salaryPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applySalaryPreset(preset.min, preset.max)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border cursor-pointer min-h-[44px] ${
                    isPresetActive(preset.min, preset.max)
                      ? "bg-primary-50 border-primary-300 text-primary-700"
                      : "bg-background-50 border-background-200/70 text-foreground-600"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={local.salaryMin}
                onChange={(e) =>
                  setLocal((prev) => ({ ...prev, salaryMin: e.target.value }))
                }
                placeholder={t("job.from")}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-background-200/70 bg-background-50 outline-none focus:border-primary-300 min-h-[44px]"
              />
              <input
                type="number"
                value={local.salaryMax}
                onChange={(e) =>
                  setLocal((prev) => ({ ...prev, salaryMax: e.target.value }))
                }
                placeholder={t("job.to")}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-background-200/70 bg-background-50 outline-none focus:border-primary-300 min-h-[44px]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-background-200/70 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium rounded-xl border border-background-200 text-foreground-700 hover:bg-background-100 cursor-pointer min-h-[44px]"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-primary-500 text-background-50 dark:text-foreground-950 hover:bg-primary-600 cursor-pointer min-h-[44px]"
          >
            {t("job.applyFilters")}
            {activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
