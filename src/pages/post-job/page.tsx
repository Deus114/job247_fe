import {
  AdminAuthError,
  createEmployerJob,
  fetchEmployerCompanies,
  fetchEmployerJobById,
  fetchPublicEducationLevels,
  fetchPublicIndustryGroups,
  fetchPublicProvinces,
  resolveAdminAuthErrorMessage,
  updateEmployerJob,
} from "@/api";
import CustomSelect from "@/components/ui/CustomSelect";
import HtmlContentEditor from "@/components/ui/HtmlContentEditor";
import MultiSelect from "@/components/ui/MultiSelect";
import {
  EMPLOYMENT_TYPE_VALUES,
  EXPERIENCE_LEVEL_VALUES,
  employmentTypeLabelKey,
  experienceLevelLabelKey,
} from "@/constants/employerJob";
import { useAuth } from "@/features/auth";
import { usePageShell } from "@/layouts/usePageShell";
import { formatNumber, formatNumberInput, parseNumberInput } from "@/lib/formatNumber";
import { toast } from "@/lib/toast";
import type {
  PublicEducationLevel,
  PublicIndustryGroup,
  PublicProvince,
} from "@/types/catalog";
import type { EmployerCompany } from "@/types/company";
import type { EmployerJobWritePayload } from "@/types/job";
import { useEffect, useMemo, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

const emptyForm = {
  companyId: "",
  title: "",
  industryIds: [] as string[],
  educationLevelIds: [] as string[],
  provinceIds: [] as string[],
  employmentTypes: ["FULL_TIME"] as string[],
  experienceLevels: [] as string[],
  experienceYears: "",
  salaryMin: "",
  salaryMax: "",
  salaryNegotiable: false,
  deadline: "",
  workLocation: "",
  workingTime: "",
  description: "",
  requirements: "",
  benefits: "",
  applicantQuestion: "",
};

function hasHtmlText(html: string): boolean {
  return (
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .trim().length > 0
  );
}

export default function PostJobPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: editIdParam } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const preselectCompanyId = searchParams.get("companyId");
  const editJobId = Number(editIdParam);
  const isEdit = Number.isFinite(editJobId) && editJobId > 0;
  const { user } = useAuth();
  const { cms, className: shell } = usePageShell();

  const [companies, setCompanies] = useState<EmployerCompany[]>([]);
  const [industryGroups, setIndustryGroups] = useState<PublicIndustryGroup[]>(
    [],
  );
  const [provinces, setProvinces] = useState<PublicProvince[]>([]);
  const [educationLevels, setEducationLevels] = useState<
    PublicEducationLevel[]
  >([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [jobLoading, setJobLoading] = useState(isEdit);
  const [lockedCompanyName, setLockedCompanyName] = useState("");
  const [formData, setFormData] = useState(() => ({
    ...emptyForm,
    companyId: preselectCompanyId || "",
  }));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (preselectCompanyId) {
      setFormData((prev) =>
        prev.companyId ? prev : { ...prev, companyId: preselectCompanyId },
      );
    }
  }, [preselectCompanyId]);

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    void Promise.all([
      fetchEmployerCompanies({
        mine: true,
        status: "APPROVED",
        page: 1,
        size: 100,
        sort: "createdAt,desc",
      }),
      fetchPublicIndustryGroups({ page: 1, size: 200 }),
      fetchPublicProvinces({ page: 1, size: 200 }),
      fetchPublicEducationLevels({ page: 1, size: 200 }),
    ])
      .then(([companiesRes, groupsRes, provincesRes, educationRes]) => {
        if (cancelled) return;
        setCompanies(companiesRes.data);
        setIndustryGroups(groupsRes.data);
        setProvinces(provincesRes.data);
        setEducationLevels(educationRes.data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        toast.error(
          error instanceof AdminAuthError
            ? resolveAdminAuthErrorMessage(error, t)
            : t("apiErrors.employerJobLoadFailed"),
        );
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!isEdit) {
      setJobLoading(false);
      return;
    }
    if (catalogLoading) return;

    let cancelled = false;
    setJobLoading(true);
    void fetchEmployerJobById(editJobId)
      .then((job) => {
        if (cancelled) return;
        setLockedCompanyName(job.companyName);
        setFormData({
          companyId: String(job.companyId || ""),
          title: job.title,
          industryIds: job.industries.map((item) => String(item.id)),
          educationLevelIds: job.educationLevels.map((item) => String(item.id)),
          provinceIds: job.provinces.map((item) => String(item.id)),
          employmentTypes: job.employmentTypes.length
            ? job.employmentTypes
            : ["FULL_TIME"],
          experienceLevels: job.experienceLevels,
          experienceYears:
            job.experienceYears != null ? String(job.experienceYears) : "",
          salaryMin:
            job.salaryMin > 0 ? formatNumber(job.salaryMin, "") : "",
          salaryMax:
            job.salaryMax > 0 ? formatNumber(job.salaryMax, "") : "",
          salaryNegotiable: job.salaryNegotiable,
          deadline: job.deadline.slice(0, 10),
          workLocation: job.workLocation,
          workingTime: job.workingTime,
          description: job.description,
          requirements: job.requirements,
          benefits: job.benefits,
          applicantQuestion: job.applicantQuestion,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        toast.error(
          error instanceof AdminAuthError
            ? resolveAdminAuthErrorMessage(error, t)
            : t("apiErrors.employerJobLoadFailed"),
        );
        navigate("/employer/jobs", { replace: true });
      })
      .finally(() => {
        if (!cancelled) setJobLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, editJobId, catalogLoading, navigate, t]);

  const myApprovedCompanies = useMemo(() => {
    const membership = new Set(
      (user?.companies ?? [])
        .filter(
          (item) =>
            item.companyStatus === "APPROVED" &&
            (item.role === "OWNER" || item.role === "ADMIN"),
        )
        .map((item) => item.companyId),
    );
    return companies.filter(
      (company) =>
        company.status === "APPROVED" &&
        (membership.size === 0 || membership.has(company.id)),
    );
  }, [companies, user?.companies]);

  const industryOptions = useMemo(
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
    () =>
      provinces.map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    [provinces],
  );

  const educationOptions = useMemo(
    () =>
      educationLevels.map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
    [educationLevels],
  );

  const employmentOptions = useMemo(
    () =>
      EMPLOYMENT_TYPE_VALUES.map((value) => ({
        value,
        label: t(employmentTypeLabelKey(value)),
      })),
    [t],
  );

  const experienceOptions = useMemo(
    () =>
      EXPERIENCE_LEVEL_VALUES.map((value) => ({
        value,
        label: t(experienceLevelLabelKey(value)),
      })),
    [t],
  );

  const selectedCompany = myApprovedCompanies.find(
    (company) => String(company.id) === formData.companyId,
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      const { name, checked } = target;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    const { name, value } = target;
    if (name === "salaryMin" || name === "salaryMax") {
      setFormData((prev) => ({ ...prev, [name]: formatNumberInput(value) }));
      return;
    }
    if (name === "experienceYears") {
      const digits = value.replace(/\D/g, "");
      if (!digits) {
        setFormData((prev) => ({ ...prev, experienceYears: "" }));
        return;
      }
      const years = Math.min(50, Number(digits));
      setFormData((prev) => ({
        ...prev,
        experienceYears: Number.isFinite(years) ? String(years) : "",
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const parseIdList = (values: string[]): number[] =>
    values.map(Number).filter((id) => Number.isFinite(id) && id > 0);

  const buildWritePayload = (): EmployerJobWritePayload | null => {
    const industryIds = parseIdList(formData.industryIds);
    const educationLevelIds = parseIdList(formData.educationLevelIds);
    const provinceIds = parseIdList(formData.provinceIds);
    if (
      !formData.title.trim() ||
      industryIds.length === 0 ||
      provinceIds.length === 0 ||
      formData.employmentTypes.length === 0 ||
      !formData.deadline ||
      !hasHtmlText(formData.workLocation) ||
      !hasHtmlText(formData.workingTime) ||
      !hasHtmlText(formData.description)
    ) {
      return null;
    }

    const salaryMin = parseNumberInput(formData.salaryMin) ?? 0;
    const salaryMax = parseNumberInput(formData.salaryMax) ?? 0;
    const experienceYearsRaw = formData.experienceYears.trim();
    const experienceYears =
      experienceYearsRaw === ""
        ? undefined
        : Math.min(50, Math.max(0, Number(experienceYearsRaw)));

    return {
      title: formData.title.trim(),
      industryIds,
      educationLevelIds,
      provinceIds,
      employmentTypes: formData.employmentTypes,
      experienceLevels: formData.experienceLevels,
      experienceYears:
        experienceYears != null && Number.isFinite(experienceYears)
          ? experienceYears
          : undefined,
      salaryMin,
      salaryMax,
      salaryNegotiable: formData.salaryNegotiable,
      deadline: formData.deadline,
      workLocation: formData.workLocation.trim(),
      workingTime: formData.workingTime.trim(),
      description: formData.description.trim(),
      requirements: hasHtmlText(formData.requirements)
        ? formData.requirements.trim()
        : "",
      benefits: hasHtmlText(formData.benefits)
        ? formData.benefits.trim()
        : "",
      applicantQuestion: hasHtmlText(formData.applicantQuestion)
        ? formData.applicantQuestion.trim()
        : undefined,
    };
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError("");

    if (!isEdit) {
      const companyId = Number(formData.companyId);
      if (!Number.isFinite(companyId) || companyId <= 0) {
        setSubmitError(t("validation.required"));
        return;
      }
    }

    const payload = buildWritePayload();
    if (!payload) {
      setSubmitError(t("validation.required"));
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateEmployerJob(editJobId, payload);
        toast.success(t("postJob.updateSuccess"));
      } else {
        await createEmployerJob({
          companyId: Number(formData.companyId),
          ...payload,
        });
        toast.success(t("postJob.success"));
      }
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : isEdit
            ? t("apiErrors.employerJobUpdateFailed")
            : t("apiErrors.employerJobCreateFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (jobLoading || (isEdit && catalogLoading)) {
    return (
      <div className={`${shell} flex items-center justify-center`}>
        <div className="text-sm text-foreground-500">
          <i className="ri-loader-4-line animate-spin mr-2"></i>
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={`${shell} flex items-center justify-center`}>
        <div className="text-center p-10 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-accent-100 flex items-center justify-center mb-5">
            <i className="ri-check-line text-4xl text-accent-500"></i>
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground-950 mb-3">
            {isEdit ? t("postJob.updateSuccess") : t("postJob.success")}
          </h2>
          <p className="text-sm text-foreground-600 mb-8">
            {isEdit
              ? t("postJob.updateSuccessDesc")
              : t("postJob.pendingApprovalDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate("/employer/jobs")}
              className="min-h-[44px] px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t("postJob.goToDashboard")}
            </button>
            {!isEdit && (
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    ...emptyForm,
                    companyId: preselectCompanyId || "",
                  });
                }}
                className="min-h-[44px] px-6 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                {t("postJob.postAnother")}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!catalogLoading && !isEdit && myApprovedCompanies.length === 0) {
    return (
      <div className={`${shell} flex items-center justify-center`}>
        <div className="text-center p-10 max-w-lg">
          <div className="w-20 h-20 mx-auto rounded-full bg-yellow-100 flex items-center justify-center mb-5">
            <i className="ri-building-4-line text-3xl text-yellow-600"></i>
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground-950 mb-2">
            {t("postJob.noApprovedCompany")}
          </h2>
          <p className="text-sm text-foreground-600 mb-6">
            {t("postJob.noApprovedCompanyDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => navigate("/employer/companies/new")}
              className="min-h-[44px] px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-medium hover:bg-primary-600 cursor-pointer"
            >
              <i className="ri-add-line mr-1.5"></i>
              {t("postJob.createCompanyFirst")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/employer/companies")}
              className="min-h-[44px] px-6 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 cursor-pointer"
            >
              {t("postJob.viewMyCompanies")}
            </button>
          </div>
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
            <h1 className="text-xl font-heading font-bold text-foreground-950">
              {isEdit ? t("postJob.editTitle") : t("postJob.title")}
            </h1>
            <p className="text-sm text-foreground-600 mt-1">
              {isEdit ? t("postJob.editSubtitle") : t("postJob.subtitle")}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8 space-y-6"
          >
            {submitError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                {submitError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                {t("postJob.selectCompanyLabel")} *
              </label>
              {isEdit ? (
                <div className="flex items-center gap-3 p-3 bg-background-100/80 rounded-lg border border-background-200/70">
                  <span className="w-8 h-8 rounded bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                    {(lockedCompanyName || selectedCompany?.name || "?").charAt(
                      0,
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground-800">
                      {lockedCompanyName ||
                        selectedCompany?.name ||
                        t("postJob.company")}
                    </p>
                    <p className="text-xs text-foreground-500">
                      {t("postJob.companyLockedHint")}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <CustomSelect
                    value={formData.companyId}
                    onChange={(v) => handleSelectChange("companyId", v)}
                    options={[
                      {
                        value: "",
                        label: t("postJob.selectCompanyPlaceholder"),
                      },
                      ...myApprovedCompanies.map((c) => ({
                        value: String(c.id),
                        label: c.name,
                      })),
                    ]}
                    placeholder={t("postJob.selectCompanyPlaceholder")}
                    required
                  />
                  {selectedCompany && (
                    <div className="flex items-center gap-3 mt-3 p-3 bg-background-100/80 rounded-lg">
                      {selectedCompany.logo ? (
                        <img
                          src={selectedCompany.logo}
                          alt=""
                          className="w-8 h-8 rounded object-contain"
                        />
                      ) : (
                        <span className="w-8 h-8 rounded bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                          {selectedCompany.name.charAt(0)}
                        </span>
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground-800">
                          {selectedCompany.name}
                        </p>
                        <p className="text-xs text-foreground-500">
                          {selectedCompany.provinceName ||
                            selectedCompany.address ||
                            "—"}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("postJob.jobTitle")} *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-lg outline-none focus:border-primary-300"
                  placeholder={t("postJob.titlePlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("postJob.category")} *
                </label>
                <MultiSelect
                  values={formData.industryIds}
                  onChange={(values) =>
                    setFormData((prev) => ({ ...prev, industryIds: values }))
                  }
                  groups={industryOptions}
                  placeholder={t("postJob.selectCategory")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("postJob.location")} *
                </label>
                <MultiSelect
                  values={formData.provinceIds}
                  onChange={(values) =>
                    setFormData((prev) => ({ ...prev, provinceIds: values }))
                  }
                  options={provinceOptions}
                  placeholder={t("postJob.selectLocation")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("postJob.education")}
                </label>
                <MultiSelect
                  values={formData.educationLevelIds}
                  onChange={(values) =>
                    setFormData((prev) => ({
                      ...prev,
                      educationLevelIds: values,
                    }))
                  }
                  options={educationOptions}
                  placeholder={t("postJob.selectEducation")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("postJob.workType")} *
                </label>
                <MultiSelect
                  values={formData.employmentTypes}
                  onChange={(values) =>
                    setFormData((prev) => ({
                      ...prev,
                      employmentTypes: values,
                    }))
                  }
                  options={employmentOptions}
                  placeholder={t("postJob.selectWorkType")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("postJob.experience")}
                </label>
                <MultiSelect
                  values={formData.experienceLevels}
                  onChange={(values) =>
                    setFormData((prev) => ({
                      ...prev,
                      experienceLevels: values,
                    }))
                  }
                  options={experienceOptions}
                  placeholder={t("postJob.selectExperience")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("postJob.experienceYears")}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  placeholder={t("postJob.experienceYearsPlaceholder")}
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-lg outline-none focus:border-primary-300"
                />
                <p className="mt-1 text-[11px] text-foreground-400">
                  {t("postJob.experienceYearsHint")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("postJob.deadline")} *
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-lg outline-none focus:border-primary-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("postJob.salaryMin")}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="salaryMin"
                  value={formData.salaryMin}
                  onChange={handleChange}
                  disabled={formData.salaryNegotiable}
                  placeholder="0"
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-lg outline-none focus:border-primary-300 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("postJob.salaryMax")}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="salaryMax"
                  value={formData.salaryMax}
                  onChange={handleChange}
                  disabled={formData.salaryNegotiable}
                  placeholder="0"
                  className="w-full px-4 py-2.5 text-sm border border-background-200/70 rounded-lg outline-none focus:border-primary-300 disabled:opacity-60"
                />
              </div>

              <label className="md:col-span-2 flex items-center gap-2 text-sm text-foreground-700 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  name="salaryNegotiable"
                  checked={formData.salaryNegotiable}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-background-300 text-primary-500"
                />
                {t("postJob.salaryNegotiable")}
              </label>
            </div>

            <div>
              <HtmlContentEditor
                label={`${t("postJob.description")} *`}
                value={formData.description}
                onChange={(html) =>
                  setFormData((prev) => ({ ...prev, description: html }))
                }
                hint={t("postJob.descPlaceholder")}
              />
            </div>

            <div>
              <HtmlContentEditor
                label={t("postJob.requirements")}
                value={formData.requirements}
                onChange={(html) =>
                  setFormData((prev) => ({ ...prev, requirements: html }))
                }
                hint={t("postJob.reqPlaceholder")}
              />
            </div>

            <div>
              <HtmlContentEditor
                label={t("postJob.benefits")}
                value={formData.benefits}
                onChange={(html) =>
                  setFormData((prev) => ({ ...prev, benefits: html }))
                }
                hint={t("postJob.benefitPlaceholder")}
              />
            </div>

            <div>
              <HtmlContentEditor
                label={`${t("postJob.workLocation")} *`}
                value={formData.workLocation}
                onChange={(html) =>
                  setFormData((prev) => ({ ...prev, workLocation: html }))
                }
                hint={t("postJob.workLocationHint")}
              />
            </div>

            <div>
              <HtmlContentEditor
                label={`${t("postJob.workingTime")} *`}
                value={formData.workingTime}
                onChange={(html) =>
                  setFormData((prev) => ({ ...prev, workingTime: html }))
                }
                hint={t("postJob.workingTimeHint")}
              />
            </div>

            <div>
              <HtmlContentEditor
                label={t("postJob.applicantQuestion")}
                value={formData.applicantQuestion}
                onChange={(html) =>
                  setFormData((prev) => ({
                    ...prev,
                    applicantQuestion: html,
                  }))
                }
                hint={t("postJob.applicantQuestionPlaceholder")}
                compact
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || catalogLoading || jobLoading}
                className="min-h-[44px] px-8 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 cursor-pointer disabled:opacity-60"
              >
                {submitting
                  ? isEdit
                    ? t("postJob.updating")
                    : t("postJob.saving")
                  : isEdit
                    ? t("postJob.updateSubmit")
                    : t("postJob.submit")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/employer/jobs")}
                className="min-h-[44px] px-6 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 cursor-pointer"
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
