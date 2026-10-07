import {
  AdminAuthError,
  fetchEmployerCompanyById,
  fetchPublicIndustryGroups,
  fetchPublicProvinces,
  resolveAdminAuthErrorMessage,
  updateEmployerCompany,
} from "@/api";
import CustomSelect from "@/components/ui/CustomSelect";
import HtmlContentEditor from "@/components/ui/HtmlContentEditor";
import ImageUploadField from "@/components/ui/ImageUploadField";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import MultiSelect from "@/components/ui/MultiSelect";
import { useAuth } from "@/features/auth";
import { companySizeValues } from "@/features/companies";
import { usePageShell } from "@/layouts/usePageShell";
import { toast } from "@/lib/toast";
import type { PublicIndustryGroup, PublicProvince } from "@/types/catalog";
import type { EmployerCompany } from "@/types/company";
import { useEffect, useMemo, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

function hasHtmlText(html: string): boolean {
  return (
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .trim().length > 0
  );
}

const emptyForm = {
  name: "",
  industryIds: [] as string[],
  size: "",
  provinceId: "",
  address: "",
  website: "",
  email: "",
  phone: "",
  taxCode: "",
  description: "",
};

function remoteImageUrl(value: string): string | undefined {
  const url = value.trim();
  if (!url || url.startsWith("blob:") || url.startsWith("data:")) {
    return undefined;
  }
  return url;
}

export default function EditCompanyPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cms, className: shell } = usePageShell();
  const companyId = Number(id);

  const [company, setCompany] = useState<EmployerCompany | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [formData, setFormData] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [industryGroups, setIndustryGroups] = useState<PublicIndustryGroup[]>(
    [],
  );
  const [provinces, setProvinces] = useState<PublicProvince[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const safeErrors = errors || {};
  const membership = useMemo(
    () =>
      user?.companies?.find((item) => item.companyId === companyId) ?? null,
    [user?.companies, companyId],
  );
  const canEdit =
    membership?.role === "OWNER" || membership?.role === "ADMIN";

  const industryGroupsOptions = useMemo(
    () =>
      industryGroups.map((group) => ({
        label: group.name,
        options: group.industries.map((item) => ({
          value: String(item.id),
          label: item.name,
        })),
      })),
    [industryGroups],
  );

  const provinceOptions = useMemo(
    () => [
      {
        value: "",
        label: `${t("common.select")} ${t("job.location").toLowerCase()}`,
      },
      ...provinces.map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    ],
    [provinces, t],
  );

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetchPublicIndustryGroups({ page: 1, size: 200 }),
      fetchPublicProvinces({ page: 1, size: 200 }),
    ])
      .then(([groupsRes, provincesRes]) => {
        if (cancelled) return;
        setIndustryGroups(groupsRes.data);
        setProvinces(provincesRes.data);
        setCatalogError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setCatalogError(
          error instanceof AdminAuthError
            ? resolveAdminAuthErrorMessage(error, t)
            : t("company.catalogLoadFailed"),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!Number.isFinite(companyId) || companyId <= 0) {
      setCompany(null);
      setLoadingCompany(false);
      return;
    }

    let cancelled = false;
    setLoadingCompany(true);
    void fetchEmployerCompanyById(companyId)
      .then((data) => {
        if (cancelled) return;
        setCompany(data);
        setFormData({
          name: data.name,
          industryIds: data.industries.map((item) => String(item.id)),
          size: data.size,
          provinceId: data.provinceId ? String(data.provinceId) : "",
          address: data.address,
          website: data.website || "",
          email: data.email,
          phone: data.phone,
          taxCode: data.taxCode,
          description: data.description,
        });
        setLogoUrl(data.logo || "");
        setBannerUrl(data.backgroundImage || "");
        setLogoFile(null);
        setBannerFile(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setCompany(null);
        toast.error(
          error instanceof AdminAuthError
            ? resolveAdminAuthErrorMessage(error, t)
            : t("apiErrors.employerCompanyLoadFailed"),
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingCompany(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, t]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
    setSubmitError("");
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
    setSubmitError("");
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = t("company.validation.nameRequired");
    }
    if (formData.industryIds.length === 0) {
      newErrors.industryIds = t("validation.selectOption");
    }
    if (!formData.size) newErrors.size = t("validation.selectOption");
    if (!formData.provinceId) {
      newErrors.provinceId = t("validation.selectOption");
    }
    if (!formData.address.trim()) {
      newErrors.address = t("company.validation.addressRequired");
    }
    if (!formData.email.trim()) newErrors.email = t("validation.required");
    if (!formData.phone.trim()) newErrors.phone = t("validation.required");
    if (!formData.taxCode.trim()) newErrors.taxCode = t("validation.required");
    if (!hasHtmlText(formData.description)) {
      newErrors.description = t("company.validation.descRequired");
    }
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = t("validation.urlInvalid");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!company || !validate()) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await updateEmployerCompany(company.id, {
        name: formData.name.trim(),
        industryIds: formData.industryIds.map(Number).filter(Number.isFinite),
        size: formData.size,
        provinceId: Number(formData.provinceId),
        address: formData.address.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        taxCode: formData.taxCode.trim(),
        description: formData.description.trim(),
        website: formData.website.trim() || undefined,
        logoFile,
        logo: logoFile ? undefined : remoteImageUrl(logoUrl),
        backgroundImageFile: bannerFile,
        backgroundImage: bannerFile ? undefined : remoteImageUrl(bannerUrl),
      });
      toast.success(result.message || t("company.updateSuccess"));
      navigate(`/employer/companies/${company.id}`, { replace: true });
    } catch (error) {
      setSubmitError(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.employerCompanyUpdateFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCompany) {
    return (
      <div className={`${shell} flex items-center justify-center`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!company) {
    return (
      <div className={`${shell} flex items-center justify-center`}>
        <div className="text-center p-10 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-background-200 flex items-center justify-center mb-5">
            <i className="ri-building-line text-3xl text-foreground-400"></i>
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground-950 mb-2">
            {t("company.notFound")}
          </h2>
          <p className="text-sm text-foreground-600 mb-6">
            {t("company.notFoundDesc")}
          </p>
          <button
            type="button"
            onClick={() => navigate("/employer/companies")}
            className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            {t("common.back")}
          </button>
        </div>
      </div>
    );
  }

  if (!user || !canEdit) {
    return (
      <div className={`${shell} flex items-center justify-center`}>
        <div className="text-center p-10 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-5">
            <i className="ri-forbid-line text-3xl text-red-500"></i>
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground-950 mb-2">
            {t("common.accessDenied")}
          </h2>
          <p className="text-sm text-foreground-600 mb-6">
            {t(
              "company.noEditPermission",
              "Bạn không có quyền chỉnh sửa công ty này.",
            )}
          </p>
          <button
            type="button"
            onClick={() => navigate("/employer/companies")}
            className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            {t("common.back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={shell || undefined}>
      <div
        className={
          cms ? "" : "w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12"
        }
      >
        <div className={cms ? "" : "max-w-3xl mx-auto"}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <button
                type="button"
                onClick={() => navigate(`/employer/companies/${company.id}`)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-background-200 text-foreground-500 hover:bg-background-50 transition-colors cursor-pointer"
              >
                <i className="ri-arrow-left-line"></i>
              </button>
              <h1 className="text-xl font-heading font-bold text-foreground-950">
                {t("company.edit")}
              </h1>
            </div>
            <p className="text-sm text-foreground-600 mt-1 ml-13">
              {t("company.updateInfo", "Cập nhật thông tin công ty")}{" "}
              <strong>{company.name}</strong>
            </p>
          </div>

          {catalogError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {catalogError}
            </div>
          )}
          {submitError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {submitError}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8 space-y-6"
          >
            <div>
              <h3 className="text-base font-heading font-semibold text-foreground-950 mb-4 flex items-center gap-2">
                <i className="ri-information-line text-primary-500"></i>{" "}
                {t("company.basicInfo", "Thông tin cơ bản")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("company.name")} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.name ? "border-red-400" : "border-background-200/70"}`}
                  />
                  {safeErrors.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {safeErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("company.industry")} *
                  </label>
                  <MultiSelect
                    values={formData.industryIds}
                    onChange={(values) => {
                      setFormData({ ...formData, industryIds: values });
                      if (errors.industryIds) {
                        setErrors({ ...errors, industryIds: "" });
                      }
                    }}
                    groups={industryGroupsOptions}
                    placeholder={`${t("common.select")} ${t("company.industry").toLowerCase()}`}
                    className={
                      safeErrors.industryIds ? "[&>button]:border-red-400" : ""
                    }
                  />
                  {safeErrors.industryIds && (
                    <p className="text-xs text-red-500 mt-1">
                      {safeErrors.industryIds}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("company.size")} *
                  </label>
                  <CustomSelect
                    value={formData.size}
                    onChange={(v) => handleSelectChange("size", v)}
                    options={[
                      {
                        value: "",
                        label: `${t("common.select")} ${t("company.size").toLowerCase()}`,
                      },
                      ...companySizeValues.map((s) => ({
                        value: s,
                        label: t(`company.sizeOptions.${s}`, s),
                      })),
                    ]}
                    className={
                      safeErrors.size ? "[&>button]:border-red-400" : ""
                    }
                  />
                  {safeErrors.size && (
                    <p className="text-xs text-red-500 mt-1">
                      {safeErrors.size}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("job.location")} *
                  </label>
                  <CustomSelect
                    value={formData.provinceId}
                    onChange={(v) => handleSelectChange("provinceId", v)}
                    options={provinceOptions}
                    className={
                      safeErrors.provinceId ? "[&>button]:border-red-400" : ""
                    }
                  />
                  {safeErrors.provinceId && (
                    <p className="text-xs text-red-500 mt-1">
                      {safeErrors.provinceId}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("company.taxCode")} *
                  </label>
                  <input
                    type="text"
                    name="taxCode"
                    value={formData.taxCode}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.taxCode ? "border-red-400" : "border-background-200/70"}`}
                  />
                  {safeErrors.taxCode && (
                    <p className="text-xs text-red-500 mt-1">
                      {safeErrors.taxCode}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("company.address")} *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.address ? "border-red-400" : "border-background-200/70"}`}
                  />
                  {safeErrors.address && (
                    <p className="text-xs text-red-500 mt-1">
                      {safeErrors.address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-heading font-semibold text-foreground-950 mb-4 flex items-center gap-2">
                <i className="ri-contacts-line text-primary-500"></i>{" "}
                {t("company.contactInfo")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("contact.email")} *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.email ? "border-red-400" : "border-background-200/70"}`}
                  />
                  {safeErrors.email && (
                    <p className="text-xs text-red-500 mt-1">
                      {safeErrors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("contact.phone")} *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.phone ? "border-red-400" : "border-background-200/70"}`}
                  />
                  {safeErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">
                      {safeErrors.phone}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("company.website")}
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.website ? "border-red-400" : "border-background-200/70"}`}
                    placeholder="https://"
                  />
                  {safeErrors.website && (
                    <p className="text-xs text-red-500 mt-1">
                      {safeErrors.website}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-heading font-semibold text-foreground-950 mb-4 flex items-center gap-2">
                <i className="ri-image-line text-primary-500"></i>{" "}
                {t("company.logo")} / {t("company.coverImage")}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <ImageUploadField
                  label={t("company.logo")}
                  value={logoUrl}
                  file={logoFile}
                  onChange={(next) => {
                    setLogoFile(next.file);
                    setLogoUrl(next.url);
                  }}
                  previewClassName="w-full h-40 rounded-xl object-contain border border-background-200/70 bg-background-100"
                  placeholder={t("company.chooseLogo")}
                  hint={t("company.logoOrLinkHint")}
                />
                <ImageUploadField
                  label={t("company.coverImage")}
                  value={bannerUrl}
                  file={bannerFile}
                  onChange={(next) => {
                    setBannerFile(next.file);
                    setBannerUrl(next.url);
                  }}
                  aspectW={16}
                  aspectH={6}
                  previewClassName="w-full h-40 rounded-xl object-cover border border-background-200/70 bg-background-100"
                  placeholder={t("company.chooseBanner")}
                  hint={t("company.logoOrLinkHint")}
                />
              </div>
            </div>

            <div>
              <HtmlContentEditor
                label={`${t("company.description")} *`}
                value={formData.description}
                onChange={(html) =>
                  setFormData((prev) => ({ ...prev, description: html }))
                }
                hint={t("company.descPlaceholder")}
              />
              {safeErrors.description ? (
                <p className="text-xs text-red-500 mt-1">
                  {safeErrors.description}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || Boolean(catalogError)}
                className="sm:w-auto min-h-[44px] px-6 py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                {submitting ? t("common.loading") : t("common.save")}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/employer/companies/${company.id}`)}
                className="sm:w-auto min-h-[44px] px-6 py-3 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
