import { useAuth } from "@/features/auth";
import { formatDate } from "@/lib/formatDate";
import { companyPath, jobPath } from "@/lib/paths";
import type { Job } from "@/types/job";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import JobSalary from "./JobSalary";

interface JobPreviewPanelProps {
  job: Job;
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export default function JobPreviewPanel({ job }: JobPreviewPanelProps) {
  const { t } = useTranslation();
  const { isEmployer } = useAuth();
  const path = jobPath(job);

  const tags = [
    { value: job.category, style: "bg-primary-100 text-primary-700" },
    { value: job.educationLevel, style: "bg-accent-100 text-accent-700" },
    {
      value: job.experience,
      style: "bg-yellow-50 text-yellow-700 border border-yellow-200/50",
    },
    {
      value:
        job.experienceYears != null && Number.isFinite(job.experienceYears)
          ? t("postJob.experienceYearsValue", { count: job.experienceYears })
          : "",
      style: "bg-secondary-100 text-secondary-700",
    },
  ].filter((x) => x.value && x.value !== "—");

  const descriptionPlain = stripHtml(job.description || "");
  const descriptionPreview =
    descriptionPlain.length > 480
      ? `${descriptionPlain.slice(0, 480)}…`
      : descriptionPlain;

  return (
    <div className="hidden lg:flex flex-col bg-background-50 border border-background-200 rounded-xl overflow-hidden h-full min-h-[420px] max-h-[calc(100vh-200px)] sticky top-[90px]">
      <div className="p-5 md:p-6 border-b border-background-200/70 shrink-0">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-background-50 border border-background-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
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
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-heading font-bold text-foreground-950 line-clamp-2">
                {job.title}
              </h2>
              {job.featured ? (
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-red-500 text-white rounded whitespace-nowrap">
                  Hot
                </span>
              ) : null}
            </div>
            <Link
              to={companyPath({
                id: job.companyId,
                slug: job.companySlug,
                name: job.company,
              })}
              className="text-sm text-foreground-600 hover:text-primary-500 transition-colors"
            >
              {job.company}
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm text-foreground-600">
          <span className="inline-flex items-center gap-1.5">
            <i className="ri-map-pin-line text-primary-500"></i>
            {job.location || "—"}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-accent-600">
            <i className="ri-money-dollar-circle-line"></i>
            <JobSalary salary={job.salary} loginFrom={path} />
          </span>
          {job.type ? (
            <span className="inline-flex items-center gap-1.5">
              <i className="ri-time-line text-secondary-500"></i>
              {job.type}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <i className="ri-calendar-check-line text-foreground-400"></i>
            {t("job.deadlineWithDate", { date: formatDate(job.deadline) })}
          </span>
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag) => (
              <span
                key={tag.value}
                className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${tag.style}`}
              >
                {tag.value}
              </span>
            ))}
          </div>
        ) : null}

        {!isEmployer ? (
          <div className="mt-5">
            <Link
              to={path}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors min-h-[44px] whitespace-nowrap"
            >
              {job.applied ? t("job.applied") : t("job.applyNow")}
              {!job.applied ? <i className="ri-arrow-right-line"></i> : null}
            </Link>
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-6">
        <h3 className="text-sm font-heading font-semibold text-foreground-950 mb-3">
          {t("job.jobDescription")}
        </h3>
        {descriptionPreview ? (
          <p className="text-sm text-foreground-700 leading-relaxed whitespace-pre-line">
            {descriptionPreview}
          </p>
        ) : (
          <p className="text-sm text-foreground-500">—</p>
        )}

        {(job.requirements?.length ?? 0) > 0 ? (
          <div className="mt-6">
            <h3 className="text-sm font-heading font-semibold text-foreground-950 mb-3">
              {t("job.requirements")}
            </h3>
            {(() => {
              const requirementsHtml = job.requirements.join("");
              if (looksLikeHtml(requirementsHtml)) {
                return (
                  <div
                    className="text-sm text-foreground-700 leading-relaxed prose prose-sm max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5"
                    dangerouslySetInnerHTML={{ __html: requirementsHtml }}
                  />
                );
              }
              return (
                <ul className="space-y-2">
                  {job.requirements.map((req, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-foreground-700"
                    >
                      <i className="ri-check-line text-accent-600 mt-0.5 shrink-0"></i>
                      <span className="whitespace-pre-line">
                        {stripHtml(req)}
                      </span>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
        ) : null}
      </div>
    </div>
  );
}
