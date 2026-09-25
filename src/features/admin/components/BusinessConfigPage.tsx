import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  fetchAdminBusinessConfig,
  updateAdminBusinessConfig,
  AdminAuthError,
  resolveAdminAuthErrorMessage,
} from "@/api";
import type { BusinessConfig } from "@/types/businessConfig";
import {
  createEmptyBusinessConfig,
  hasBusinessConfigImageFileChanges,
  type BusinessConfigImageFiles,
  type BusinessConfigImageFormKey,
} from "@/types/businessConfig";
import { useAppDispatch } from "@/store/hooks";
import { setBusinessConfig } from "@/store/slices/businessConfigSlice";
import HtmlContentEditor from "@/components/ui/HtmlContentEditor";
import LatLngMapPicker from "@/components/ui/LatLngMapPicker";
import ImageUploadField from "@/components/ui/ImageUploadField";
import { toast } from "@/lib/toast";

type SectionKey = "basic" | "banners" | "footer" | "social" | "seo" | "smtp";

const inputClass =
  "w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all";
const labelClass = "block text-sm font-medium text-foreground-700 mb-1.5";

export default function BusinessConfigPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const sectionTabs: { key: SectionKey; label: string; icon: string }[] = [
    {
      key: "basic",
      label: t("adminUi.businessConfig.sections.basic"),
      icon: "ri-building-line",
    },
    {
      key: "banners",
      label: t("adminUi.businessConfig.sections.banners"),
      icon: "ri-image-line",
    },
    {
      key: "footer",
      label: t("adminUi.businessConfig.sections.footer"),
      icon: "ri-layout-bottom-line",
    },
    {
      key: "social",
      label: t("adminUi.businessConfig.sections.social"),
      icon: "ri-share-line",
    },
    {
      key: "seo",
      label: t("adminUi.businessConfig.sections.seo"),
      icon: "ri-search-line",
    },
    {
      key: "smtp",
      label: t("adminUi.businessConfig.sections.smtp"),
      icon: "ri-mail-settings-line",
    },
  ];
  const [activeSection, setActiveSection] = useState<SectionKey>("basic");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [baseline, setBaseline] = useState<BusinessConfig>(
    createEmptyBusinessConfig,
  );
  const [form, setForm] = useState<BusinessConfig>(createEmptyBusinessConfig);
  const [imageFiles, setImageFiles] = useState<BusinessConfigImageFiles>({});

  const loadConfig = async () => {
    setLoading(true);
    setLoadError("");
    setSaveError("");
    try {
      const data = await fetchAdminBusinessConfig();
      setBaseline(data);
      setForm(data);
      setImageFiles({});
      dispatch(setBusinessConfig(data));
    } catch (error) {
      const message =
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("adminUi.businessConfig.loadError");
      setLoadError(message);
      const empty = createEmptyBusinessConfig();
      setBaseline(empty);
      setForm(empty);
      setImageFiles({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasChanges =
    (Object.keys(form) as (keyof BusinessConfig)[]).some(
      (key) => form[key] !== baseline[key],
    ) || hasBusinessConfigImageFileChanges(imageFiles);

  const handleChange = <K extends keyof BusinessConfig>(
    field: K,
    value: BusinessConfig[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (
    field: BusinessConfigImageFormKey,
    next: { url: string; file: File | null },
  ) => {
    setForm((prev) => ({ ...prev, [field]: next.url }));
    setImageFiles((prev) => ({ ...prev, [field]: next.file }));
  };

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const updated = await updateAdminBusinessConfig({
        form,
        baseline,
        imageFiles,
      });
      setBaseline(updated);
      setForm(updated);
      setImageFiles({});
      dispatch(setBusinessConfig(updated));
      setSaved(true);
      toast.success(t("adminUi.businessConfig.saved"));
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      const message =
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("adminUi.businessConfig.saveError");
      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleReload = () => {
    void loadConfig();
  };

  const handleDiscard = () => {
    setForm({ ...baseline });
    setImageFiles({});
    setSaveError("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-foreground-500 gap-2">
        <i className="ri-loader-4-line animate-spin text-lg"></i>
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">
              {t("adminUi.pageTitles.businessConfig")}
            </h2>
            <p className="text-sm text-foreground-500 mt-1">
              {t("adminUi.businessConfig.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {saved && (
              <span className="text-xs text-accent-600 bg-accent-50 px-3 py-1.5 rounded-full flex items-center gap-1">
                <i className="ri-check-line text-xs"></i>{" "}
                {t("adminUi.businessConfig.saved")}
              </span>
            )}
            <button
              type="button"
              onClick={handleReload}
              disabled={saving}
              className="px-4 py-2 text-sm text-foreground-600 border border-background-200/70 rounded-xl hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2 disabled:opacity-60"
            >
              <i className="ri-refresh-line"></i>{" "}
              {t("adminUi.businessConfig.reloadFromApi")}
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!hasChanges || saving}
              className={`px-5 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                hasChanges && !saving
                  ? "bg-accent-500 text-white hover:bg-accent-600 shadow-sm"
                  : "bg-background-200 text-foreground-400 cursor-not-allowed"
              }`}
            >
              {saving ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  {t("common.loading")}
                </>
              ) : (
                <>
                  <i className="ri-save-line"></i>
                  {t("adminUi.jobs.saveChanges")}
                </>
              )}
            </button>
          </div>
        </div>

        {loadError ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
            <span className="flex-1 flex items-start gap-2">
              <i className="ri-error-warning-line mt-0.5"></i>
              {loadError}
            </span>
            <button
              type="button"
              onClick={handleReload}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-100 cursor-pointer whitespace-nowrap"
            >
              {t("adminUi.businessConfig.retryLoad")}
            </button>
          </div>
        ) : null}

        {saveError ? (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
            <i className="ri-error-warning-line mt-0.5"></i>
            {saveError}
          </div>
        ) : null}

        <div className="flex items-center gap-1 bg-background-100 rounded-xl p-1 overflow-x-auto">
          {sectionTabs.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeSection === s.key
                  ? "bg-background-50 text-foreground-950 shadow-sm"
                  : "text-foreground-500 hover:text-foreground-700"
              }`}
            >
              <i className={`${s.icon} text-sm`}></i>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8">
        {activeSection === "basic" && (
          <div>
            <h3 className="text-base font-heading font-semibold text-foreground-950 mb-5 flex items-center gap-2">
              <i className="ri-building-line text-primary-500"></i>
              {t("adminUi.businessConfig.basicTitle")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>
                  {t("adminUi.businessConfig.businessName")}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t("adminUi.businessConfig.tagline")}
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => handleChange("tagline", e.target.value)}
                  className={inputClass}
                  placeholder={t("adminUi.businessConfig.taglinePlaceholder")}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t("adminUi.businessConfig.businessEmail")}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t("adminUi.businessConfig.businessPhone")}
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>
                  {t("adminUi.businessConfig.businessAddress")}
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t("adminUi.businessConfig.latitude")}
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.latitude || ""}
                  onChange={(e) =>
                    handleChange(
                      "latitude",
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                  className={inputClass}
                  placeholder="10.775529"
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t("adminUi.businessConfig.longitude")}
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.longitude || ""}
                  onChange={(e) =>
                    handleChange(
                      "longitude",
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                  className={inputClass}
                  placeholder="106.701698"
                />
              </div>
              <div className="md:col-span-2">
                <LatLngMapPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t("adminUi.columns.taxCode")}
                </label>
                <input
                  type="text"
                  value={form.taxCode}
                  onChange={(e) => handleChange("taxCode", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === "banners" && (
          <div>
            <h3 className="text-base font-heading font-semibold text-foreground-950 mb-2 flex items-center gap-2">
              <i className="ri-image-line text-primary-500"></i>
              {t("adminUi.businessConfig.bannersTitle")}
            </h3>
            <p className="text-sm text-foreground-500 mb-5">
              {t("adminUi.businessConfig.bannersHint")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploadField
                label={t("adminUi.businessConfig.homeBannerLabel")}
                value={form.homeBannerUrl}
                file={imageFiles.homeBannerUrl ?? null}
                onChange={(next) => handleImageChange("homeBannerUrl", next)}
                aspectW={16}
                aspectH={6}
                placeholder={t("adminUi.businessConfig.homeBannerUpload")}
                hint={t("adminUi.businessConfig.homeBannerHint")}
              />
              <ImageUploadField
                label={t("adminUi.businessConfig.loginBgLabel")}
                value={form.loginBgUrl}
                file={imageFiles.loginBgUrl ?? null}
                onChange={(next) => handleImageChange("loginBgUrl", next)}
                aspectW={4}
                aspectH={5}
                placeholder={t("adminUi.businessConfig.loginBgUploadHint")}
                hint={t("adminUi.businessConfig.loginBgDisplayHint")}
              />
              <ImageUploadField
                label={t("adminUi.businessConfig.adminLoginBgLabel")}
                value={form.adminLoginBgUrl}
                file={imageFiles.adminLoginBgUrl ?? null}
                onChange={(next) => handleImageChange("adminLoginBgUrl", next)}
                aspectW={4}
                aspectH={5}
                placeholder={t("adminUi.businessConfig.adminLoginBgUploadHint")}
                hint={t("adminUi.businessConfig.adminLoginBgDisplayHint")}
              />
              <ImageUploadField
                label={t("adminUi.businessConfig.registerBgLabel")}
                value={form.registerBgUrl}
                file={imageFiles.registerBgUrl ?? null}
                onChange={(next) => handleImageChange("registerBgUrl", next)}
                aspectW={4}
                aspectH={5}
                placeholder={t("adminUi.businessConfig.registerBgUploadHint")}
                hint={t("adminUi.businessConfig.registerBgDisplayHint")}
              />
              <ImageUploadField
                label={t("adminUi.businessConfig.logoLabel")}
                value={form.logoUrl}
                file={imageFiles.logoUrl ?? null}
                onChange={(next) => handleImageChange("logoUrl", next)}
                aspectW={4}
                aspectH={1}
                placeholder={t("adminUi.businessConfig.logoUploadHint")}
                hint={t("adminUi.businessConfig.logoDisplayHint")}
              />
            </div>
          </div>
        )}

        {activeSection === "footer" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-base font-heading font-semibold text-foreground-950 mb-5 flex items-center gap-2">
                <i className="ri-layout-bottom-line text-primary-500"></i>
                {t("adminUi.businessConfig.footerTitle")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    {t("adminUi.businessConfig.footerAbout")}
                  </label>
                  <textarea
                    value={form.footerAboutDesc}
                    onChange={(e) =>
                      handleChange("footerAboutDesc", e.target.value)
                    }
                    className={`${inputClass} h-24 resize-none`}
                    placeholder={t(
                      "adminUi.businessConfig.footerAboutPlaceholder",
                    )}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    {t("adminUi.businessConfig.copyright")}
                  </label>
                  <input
                    type="text"
                    value={form.footerCopyright}
                    onChange={(e) =>
                      handleChange("footerCopyright", e.target.value)
                    }
                    className={inputClass}
                    placeholder={t(
                      "adminUi.businessConfig.copyrightPlaceholder",
                    )}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {t("adminUi.businessConfig.footerAddress")}
                  </label>
                  <input
                    type="text"
                    value={form.footerAddress}
                    onChange={(e) =>
                      handleChange("footerAddress", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {t("adminUi.businessConfig.footerPhone")}
                  </label>
                  <input
                    type="text"
                    value={form.footerPhone}
                    onChange={(e) =>
                      handleChange("footerPhone", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {t("adminUi.businessConfig.footerEmail")}
                  </label>
                  <input
                    type="text"
                    value={form.footerEmail}
                    onChange={(e) =>
                      handleChange("footerEmail", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-2 border-t border-background-200/70">
              <h3 className="text-base font-heading font-semibold text-foreground-950 flex items-center gap-2">
                <i className="ri-file-text-line text-primary-500"></i>
                {t("adminUi.businessConfig.legalTitle")}
              </h3>
              <HtmlContentEditor
                label={t("adminUi.businessConfig.privacyContent")}
                hint={t("adminUi.businessConfig.legalEditorHint")}
                value={form.privacyPolicyHtml}
                onChange={(html) => handleChange("privacyPolicyHtml", html)}
              />
              <HtmlContentEditor
                label={t("adminUi.businessConfig.termsContent")}
                hint={t("adminUi.businessConfig.legalEditorHint")}
                value={form.termsOfServiceHtml}
                onChange={(html) => handleChange("termsOfServiceHtml", html)}
              />
            </div>
          </div>
        )}

        {activeSection === "social" && (
          <div>
            <h3 className="text-base font-heading font-semibold text-foreground-950 mb-5 flex items-center gap-2">
              <i className="ri-share-line text-primary-500"></i>
              {t("adminUi.businessConfig.socialTitle")}
            </h3>
            <p className="text-sm text-foreground-500 mb-5">
              {t("adminUi.businessConfig.socialHint")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {(
                [
                  ["socialFacebook", "Facebook", "ri-facebook-fill"],
                  ["socialLinkedin", "LinkedIn", "ri-linkedin-fill"],
                  ["socialTwitter", "X (Twitter)", "ri-twitter-x-fill"],
                  ["socialYoutube", "YouTube", "ri-youtube-fill"],
                ] as const
              ).map(([field, label, icon]) => (
                <div key={field}>
                  <label className={labelClass}>
                    <i className={`${icon} mr-1.5`}></i>
                    {label}
                  </label>
                  <input
                    type="text"
                    value={form[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "seo" && (
          <div>
            <h3 className="text-base font-heading font-semibold text-foreground-950 mb-5 flex items-center gap-2">
              <i className="ri-search-line text-primary-500"></i>
              {t("adminUi.businessConfig.seoTitle")}
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className={labelClass}>
                  {t("adminUi.businessConfig.metaTitle")}
                </label>
                <input
                  type="text"
                  value={form.metaTitle}
                  onChange={(e) => handleChange("metaTitle", e.target.value)}
                  className={inputClass}
                />
                <p className="text-[11px] text-foreground-400 mt-1">
                  {t("adminUi.businessConfig.metaTitleHint")}
                </p>
              </div>
              <div>
                <label className={labelClass}>
                  {t("adminUi.businessConfig.metaDescription")}
                </label>
                <textarea
                  value={form.metaDescription}
                  onChange={(e) =>
                    handleChange("metaDescription", e.target.value)
                  }
                  className={`${inputClass} h-20 resize-none`}
                  placeholder={t(
                    "adminUi.businessConfig.metaDescriptionPlaceholder",
                  )}
                />
                <p className="text-[11px] text-foreground-400 mt-1">
                  {t("adminUi.businessConfig.metaDescriptionHint")}
                </p>
              </div>
              <div>
                <label className={labelClass}>
                  {t("adminUi.businessConfig.metaKeywords")}
                </label>
                <input
                  type="text"
                  value={form.metaKeywords}
                  onChange={(e) => handleChange("metaKeywords", e.target.value)}
                  className={inputClass}
                  placeholder={t(
                    "adminUi.businessConfig.metaKeywordsPlaceholder",
                  )}
                />
                <p className="text-[11px] text-foreground-400 mt-1">
                  {t("adminUi.businessConfig.metaKeywordsHint")}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === "smtp" && (
          <div>
            <h3 className="text-base font-heading font-semibold text-foreground-950 mb-2 flex items-center gap-2">
              <i className="ri-mail-settings-line text-primary-500"></i>
              {t("adminUi.businessConfig.smtpTitle")}
            </h3>
            <p className="text-sm text-foreground-500 mb-5">
              {t("adminUi.businessConfig.smtpHint")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>
                  {t("adminUi.businessConfig.smtpHost")}
                </label>
                <input
                  type="text"
                  value={form.smtpHost}
                  onChange={(e) => handleChange("smtpHost", e.target.value)}
                  className={inputClass}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t("adminUi.businessConfig.smtpPort")}
                </label>
                <input
                  type="number"
                  value={form.smtpPort || ""}
                  onChange={(e) =>
                    handleChange(
                      "smtpPort",
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                  className={inputClass}
                  placeholder="587"
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t("adminUi.businessConfig.smtpUsername")}
                </label>
                <input
                  type="text"
                  value={form.smtpUsername}
                  onChange={(e) => handleChange("smtpUsername", e.target.value)}
                  className={inputClass}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t("adminUi.businessConfig.smtpPassword")}
                </label>
                <input
                  type="password"
                  value={form.smtpPassword}
                  onChange={(e) => handleChange("smtpPassword", e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t("adminUi.businessConfig.smtpFromEmail")}
                </label>
                <input
                  type="email"
                  value={form.smtpFromEmail}
                  onChange={(e) =>
                    handleChange("smtpFromEmail", e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t("adminUi.businessConfig.smtpFromName")}
                </label>
                <input
                  type="text"
                  value={form.smtpFromName}
                  onChange={(e) => handleChange("smtpFromName", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.smtpAuth}
                    onChange={(e) => handleChange("smtpAuth", e.target.checked)}
                    className="w-4 h-4 rounded border-background-300 text-primary-500 focus:ring-primary-200"
                  />
                  <span className="text-sm text-foreground-700">
                    {t("adminUi.businessConfig.smtpAuth")}
                  </span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer ml-6">
                  <input
                    type="checkbox"
                    checked={form.smtpStartTls}
                    onChange={(e) =>
                      handleChange("smtpStartTls", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-background-300 text-primary-500 focus:ring-primary-200"
                  />
                  <span className="text-sm text-foreground-700">
                    {t("adminUi.businessConfig.smtpStartTls")}
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {hasChanges && (
        <div className="mt-4 flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200/70">
          <p className="text-sm text-amber-800">
            {t("adminUi.businessConfig.unsavedChanges")}
          </p>
          <button
            type="button"
            onClick={handleDiscard}
            className="text-sm font-medium text-amber-700 hover:text-amber-900 cursor-pointer"
          >
            {t("adminUi.businessConfig.discardChanges")}
          </button>
        </div>
      )}
    </div>
  );
}
