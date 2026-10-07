import { fetchJobById, fetchRelatedJobs } from "@/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/features/auth";
import { ApplyModal, JobCard, JobSalary, useSavedJobs } from "@/features/jobs";
import { formatDate } from "@/lib/formatDate";
import { companyPath, jobPath } from "@/lib/paths";
import { toast } from "@/lib/toast";
import type { Job } from "@/types/job";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";

function buildFilterUrl(job: {
  category: string;
  location: string;
  educationLevel: string;
  type: string;
}): string {
  const params = new URLSearchParams();
  if (job.category) params.set("categories", job.category);
  if (job.location) params.set("locations", job.location);
  if (job.educationLevel)
    params.set(
      "educations",
      job.educationLevel.split(", ")[0] || job.educationLevel,
    );
  if (job.type) params.set("types", job.type.split(", ")[0] || job.type);
  return `/jobs?${params.toString()}`;
}

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

/** Remove a duplicated leading label when rich text already contains the same title. */
function stripLeadingLabel(text: string, label: string): string {
  const trimmed = text.trim();
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    trimmed
      .replace(new RegExp(`^${escaped}\\s*[:\\-–]?\\s*`, "i"), "")
      .trim() || trimmed
  );
}

export default function JobDetailPage() {
  const { t } = useTranslation();
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isEmployer } = useAuth();
  const { saveJob, removeSavedJob, resolveError } = useSavedJobs();
  const [applyOpen, setApplyOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "description" | "requirements" | "benefits"
  >("description");
  const [job, setJob] = useState<Job | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setJob(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void Promise.all([fetchJobById(id, slug), fetchRelatedJobs(id, slug)])
      .then(([detail, related]) => {
        if (cancelled) return;
        setJob(detail);
        setRelatedJobs(related);
        // Canonicalize URL when API returns the real slug.
        if (detail?.slug && slug && detail.slug !== slug && detail.id === id) {
          navigate(jobPath(detail), { replace: true });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, slug, isAuthenticated, navigate]);

  const isSaved = job?.saved === true;

  const requireAuth = (next: () => void) => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: id ? jobPath({ id, slug, title: "" }) : "/jobs" },
      });
      return;
    }
    next();
  };

  const toggleSave = () => {
    if (!job || saving) return;
    requireAuth(() => {
      void (async () => {
        setSaving(true);
        const nextSaved = !isSaved;
        try {
          if (isSaved) {
            await removeSavedJob(job.id);
          } else {
            await saveJob(job.id);
          }
          setJob((prev) => (prev ? { ...prev, saved: nextSaved } : prev));
        } catch (error) {
          toast.error(resolveError(error));
        } finally {
          setSaving(false);
        }
      })();
    });
  };

  const openApply = () => {
    if (job?.applied) return;
    requireAuth(() => setApplyOpen(true));
  };

  const tabs = useMemo(
    () => [
      {
        key: "description" as const,
        label: t("job.jobDescription"),
        icon: "ri-file-text-line",
      },
      {
        key: "requirements" as const,
        label: t("job.requirements"),
        icon: "ri-list-check-2",
      },
      {
        key: "benefits" as const,
        label: t("job.benefits"),
        icon: "ri-gift-line",
      },
    ],
    [t],
  );

  if (loading) {
    return (
      <div className="min-h-screen pt-[70px] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen pt-[70px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-5">
            <i className="ri-file-unknow-line text-3xl text-foreground-400"></i>
          </div>
          <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
            {t("job.notFound")}
          </h3>
          <p className="text-sm text-foreground-500 mb-6">
            {t("job.notFoundDesc")}
          </p>
          <button
            type="button"
            onClick={() => navigate("/jobs")}
            className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-arrow-left-line mr-1.5"></i>
            {t("common.back")}
          </button>
        </div>
      </div>
    );
  }

  const requirementsHtml = (job.requirements || []).join("");
  const benefitsHtml = (job.benefits || []).join("");
  const workLocationText = (job.workLocation || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const workingTimeText = (job.workingTime || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const locationDisplay =
    job.location && job.location !== "—"
      ? job.location
      : workLocationText || "—";

  return (
    <div className="min-h-screen pt-[70px] bg-background-100/60">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-5 md:py-7">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-foreground-600 hover:text-primary-500 transition-colors cursor-pointer mb-4 whitespace-nowrap min-h-[44px]"
        >
          <i className="ri-arrow-left-line"></i> {t("common.back")}
        </button>

        <div className="bg-background-50 border border-background-200 rounded-xl p-5 md:p-6 mb-6 md:mb-8">
          <div className="flex items-start gap-4 md:gap-5">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-background-50 border border-background-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt={job.company}
                  className="w-full h-full object-contain p-1.5"
                />
              ) : (
                <i className="ri-building-line text-xl text-foreground-400"></i>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-lg md:text-xl font-heading font-bold text-foreground-950">
                  {job.title}
                </h1>
                {job.featured && (
                  <span className="flex-shrink-0 px-2.5 py-0.5 text-[11px] font-semibold bg-accent-500 text-background-50 dark:text-foreground-950 rounded-full whitespace-nowrap">
                    Hot
                  </span>
                )}
                {job.applied && (
                  <span className="flex-shrink-0 px-2.5 py-0.5 text-[11px] font-medium bg-primary-100 text-primary-700 rounded-full whitespace-nowrap">
                    {t("job.applied")}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground-600">
                <Link
                  to={companyPath({
                    id: job.companyId,
                    slug: job.companySlug,
                    name: job.company,
                  })}
                  className="hover:text-primary-500 font-medium"
                >
                  {job.company || "—"}
                </Link>
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-foreground-600">
                <span className="inline-flex items-center gap-1.5">
                  <i className="ri-map-pin-line text-primary-500"></i>
                  {locationDisplay}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="ri-money-dollar-circle-line text-accent-500"></i>
                  <JobSalary salary={job.salary} loginFrom={jobPath(job)} />
                </span>
                {job.type ? (
                  <span className="inline-flex items-center gap-1.5">
                    <i className="ri-time-line text-secondary-500"></i>
                    {job.type}
                  </span>
                ) : null}
                {workingTimeText ? (
                  <span className="inline-flex items-center gap-1.5">
                    <i className="ri-calendar-schedule-line text-foreground-400"></i>
                    {workingTimeText}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <i className="ri-calendar-check-line text-foreground-400"></i>
                  {t("job.deadlineWithDate", {
                    date: formatDate(job.deadline),
                  })}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {job.category && job.category !== "—" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full whitespace-nowrap">
                    <i className="ri-price-tag-3-line"></i> {job.category}
                  </span>
                ) : null}
                {(job.educationLevel || "")
                  .split(", ")
                  .filter(Boolean)
                  .map((level, i) => (
                    <span
                      key={`edu-${i}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-100 text-accent-700 text-xs font-medium rounded-full whitespace-nowrap"
                    >
                      <i className="ri-graduation-cap-line"></i> {level}
                    </span>
                  ))}
                {job.experience
                  ? job.experience
                      .split(", ")
                      .filter(Boolean)
                      .map((exp, i) => (
                        <span
                          key={`exp-${i}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap bg-yellow-50 text-yellow-700 border border-yellow-200/50"
                        >
                          <i className="ri-award-line"></i> {exp}
                        </span>
                      ))
                  : null}
                {job.experienceYears != null &&
                Number.isFinite(job.experienceYears) ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap bg-secondary-100 text-secondary-700">
                    <i className="ri-hourglass-line"></i>{" "}
                    {t("postJob.experienceYearsValue", {
                      count: job.experienceYears,
                    })}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          <div className="flex-1 min-w-0">
            <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
              <div className="flex border-b border-background-200/70 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 md:px-5 py-3.5 text-sm font-medium whitespace-nowrap cursor-pointer border-b-2 transition-colors min-h-[44px] ${
                      activeTab === tab.key
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-foreground-500 hover:text-foreground-800"
                    }`}
                  >
                    <i className={tab.icon}></i>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5 md:p-6">
                {activeTab === "description" &&
                  (looksLikeHtml(job.description) ? (
                    <div
                      className="text-sm text-foreground-700 leading-relaxed prose prose-sm max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5"
                      dangerouslySetInnerHTML={{ __html: job.description }}
                    />
                  ) : (
                    <p className="text-sm text-foreground-700 leading-relaxed whitespace-pre-line">
                      {job.description}
                    </p>
                  ))}

                {activeTab === "requirements" &&
                  (looksLikeHtml(requirementsHtml) ? (
                    <div
                      className="text-sm text-foreground-700 prose prose-sm max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5"
                      dangerouslySetInnerHTML={{ __html: requirementsHtml }}
                    />
                  ) : (
                    <ul className="space-y-3">
                      {(job.requirements || []).map((req, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-foreground-700"
                        >
                          <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="ri-check-line text-[10px] text-accent-600"></i>
                          </div>
                          {req}
                        </li>
                      ))}
                    </ul>
                  ))}

                {activeTab === "benefits" &&
                  (looksLikeHtml(benefitsHtml) ? (
                    <div
                      className="text-sm text-foreground-700 prose prose-sm max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5"
                      dangerouslySetInnerHTML={{ __html: benefitsHtml }}
                    />
                  ) : (
                    <ul className="space-y-3">
                      {(job.benefits || []).map((benefit, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-foreground-700"
                        >
                          <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className="ri-star-fill text-[10px] text-primary-500"></i>
                          </div>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  ))}
              </div>
            </div>

            {(workLocationText || workingTimeText) && (
              <div className="mt-5 bg-background-50 border border-background-200/70 rounded-xl p-4 md:p-5 flex flex-col gap-5">
                {workLocationText ? (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <i className="ri-map-pin-2-line text-primary-600"></i>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground-950 mb-1">
                        {t("job.workLocation")}
                      </p>
                      <p className="text-sm text-foreground-700 whitespace-pre-line">
                        {stripLeadingLabel(
                          workLocationText,
                          t("job.workLocation"),
                        )}
                      </p>
                    </div>
                  </div>
                ) : null}
                {workingTimeText ? (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0">
                      <i className="ri-time-line text-accent-600"></i>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground-950 mb-1">
                        {t("job.workingTime")}
                      </p>
                      <p className="text-sm text-foreground-700 whitespace-pre-line">
                        {stripLeadingLabel(
                          workingTimeText,
                          t("job.workingTime"),
                        )}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {relatedJobs.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl md:text-2xl font-heading font-bold text-foreground-950">
                    {t("job.relatedJobs")}
                  </h3>
                  <Link
                    to={buildFilterUrl(job)}
                    className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {t("home.viewAll")} <i className="ri-arrow-right-line"></i>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {relatedJobs.map((rj) => (
                    <JobCard key={rj.id} job={rj} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-4 order-first lg:order-last">
            {!isEmployer && (
              <div className="bg-background-50 border border-background-200 rounded-xl p-5 lg:sticky lg:top-[90px]">
                <button
                  type="button"
                  onClick={openApply}
                  disabled={job.applied === true}
                  className="w-full py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 shadow-lg shadow-primary-500/15 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-primary-500 min-h-[44px]"
                >
                  <i
                    className={
                      job.applied
                        ? "ri-check-double-line"
                        : "ri-send-plane-fill"
                    }
                  ></i>
                  {job.applied ? t("job.alreadyApplied") : t("job.applyNow")}
                </button>
                <button
                  type="button"
                  onClick={toggleSave}
                  disabled={saving}
                  className="w-full mt-3 py-3 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-60"
                >
                  <i
                    className={
                      saving
                        ? "ri-loader-4-line animate-spin"
                        : isSaved
                          ? "ri-heart-fill text-red-500"
                          : "ri-heart-line"
                    }
                  ></i>
                  {isSaved ? t("job.saved") : t("job.saveJob")}
                </button>
              </div>
            )}

            <div className="bg-background-50 border border-background-200 rounded-xl p-5 md:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-500 mb-4">
                {t("job.companyInfo")}
              </p>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-background-50 border border-background-200 flex items-center justify-center overflow-hidden shrink-0">
                  {job.companyLogo ? (
                    <img
                      src={job.companyLogo}
                      alt={job.company}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <i className="ri-building-line text-foreground-400"></i>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground-950 truncate">
                    {job.company || "—"}
                  </p>
                  {job.category && job.category !== "—" ? (
                    <p className="text-xs text-foreground-500 truncate">
                      {job.category}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2.5 mb-4">
                {job.category && job.category !== "—" ? (
                  <div className="flex items-center gap-2 text-xs text-foreground-600">
                    <i className="ri-building-line text-primary-400 shrink-0"></i>
                    <span>
                      {t("job.fieldWithCategory", { category: job.category })}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2 text-xs text-foreground-600">
                  <i className="ri-map-pin-line text-accent-400 shrink-0"></i>
                  <span>{locationDisplay}</span>
                </div>
              </div>

              <Link
                to={companyPath({
                  id: job.companyId,
                  slug: job.companySlug,
                  name: job.company,
                })}
                className="block w-full py-2.5 text-center text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200/50 rounded-xl hover:bg-primary-100 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
              >
                <i className="ri-building-4-line mr-1.5"></i>
                {t("job.viewCompanyPage")}
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {applyOpen && job && (
        <ApplyModal
          jobId={job.id}
          jobTitle={job.title}
          companyName={job.company}
          companyLogo={job.companyLogo}
          applicantQuestion={job.applicantQuestion}
          isOpen={applyOpen}
          onClose={() => setApplyOpen(false)}
          onSuccess={() =>
            setJob((prev) => (prev ? { ...prev, applied: true } : prev))
          }
        />
      )}
    </div>
  );
}
