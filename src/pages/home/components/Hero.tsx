import { fetchPublicProvinces } from "@/api";
import CustomSelect from "@/components/ui/CustomSelect";
import { useAppSelector } from "@/store/hooks";
import { useEffect, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { homeBannerUrl, tagline, name } = useAppSelector(
    (state) => state.businessConfig.config,
  );
  const storeLocations = useAppSelector((state) => state.jobs.locations);
  const [keyword, setKeyword] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [provinceOptions, setProvinceOptions] = useState<
    Array<{ value: string; label: string }>
  >([{ value: "", label: t("hero.locationPlaceholder") }]);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicProvinces({ page: 1, size: 100 })
      .then((res) => {
        if (cancelled) return;
        setProvinceOptions([
          { value: "", label: t("hero.locationPlaceholder") },
          ...res.data.map((item) => ({
            value: String(item.id),
            label: item.name,
          })),
        ]);
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback to bootstrap locations (names only — use as keyword locations).
        setProvinceOptions([
          { value: "", label: t("hero.locationPlaceholder") },
          ...storeLocations.map((loc) => ({ value: loc, label: loc })),
        ]);
      });
    return () => {
      cancelled = true;
    };
  }, [t, storeLocations]);

  const handleSearch = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (provinceId) {
      if (/^\d+$/.test(provinceId)) {
        params.set("provinceIds", provinceId);
      } else {
        params.set("locations", provinceId);
      }
    }
    navigate(`/jobs?${params.toString()}`);
  };

  const subtitle = tagline.trim() || t("hero.subtitle");

  return (
    <section className="relative min-h-[42vh] md:min-h-[48vh] lg:min-h-[50vh] flex items-center">
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-secondary-600">
        {homeBannerUrl ? (
          <img
            src={homeBannerUrl}
            alt={name.trim() || "Jobs247"}
            className="w-full h-full object-cover object-center"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>
      </div>

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 md:px-8 pt-[100px] pb-10 md:pt-[110px] md:pb-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-[44px] font-heading font-bold text-white leading-tight mb-3 md:mb-4">
            {t("hero.title")}
          </h1>
          <p className="text-sm md:text-base text-white/85 max-w-xl mb-6 leading-relaxed">
            {subtitle}
          </p>

          <form
            onSubmit={handleSearch}
            className="bg-background-50 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-2xl relative z-20"
          >
            <div className="flex-[2] relative min-w-0">
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground-400 text-lg pointer-events-none"></i>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t("hero.searchPlaceholder")}
                className="w-full pl-10 pr-4 py-3 text-sm text-foreground-900 bg-background-100/60 border border-transparent focus:bg-background-50 focus:border-primary-300 rounded-xl placeholder:text-foreground-400 transition-all outline-none"
              />
            </div>
            <div className="hidden sm:block w-px bg-background-200 self-stretch my-1.5 flex-shrink-0"></div>
            <CustomSelect
              value={provinceId}
              options={provinceOptions}
              onChange={setProvinceId}
              className="w-full sm:w-auto sm:min-w-[170px]"
            />
            <button
              type="submit"
              className="px-5 md:px-6 py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 justify-center flex-shrink-0"
            >
              <i className="ri-search-line"></i>
              <span className="hidden md:inline">{t("hero.searchButton")}</span>
              <span className="md:hidden">{t("common.search")}</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-6 md:gap-10 mt-6">
            <div>
              <p className="text-xl md:text-2xl font-heading font-bold text-white">
                12,500+
              </p>
              <p className="text-xs md:text-sm text-white/70">
                {t("hero.statsJobs")}
              </p>
            </div>
            <div>
              <p className="text-xl md:text-2xl font-heading font-bold text-white">
                3,200+
              </p>
              <p className="text-xs md:text-sm text-white/70">
                {t("hero.statsCompanies")}
              </p>
            </div>
            <div>
              <p className="text-xl md:text-2xl font-heading font-bold text-white">
                8,900+
              </p>
              <p className="text-xs md:text-sm text-white/70">
                {t("hero.statsCandidates")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
