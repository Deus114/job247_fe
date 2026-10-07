import { useAuth } from "@/features/auth";
import { formatDate } from "@/lib/formatDate";
import { jobPath } from "@/lib/paths";
import type { Job } from "@/types/job";
import type { KeyboardEvent, MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import JobSalary from "./JobSalary";

interface JobCardProps {
  job: Job;
  /** Highlight as selected in master-detail list */
  selected?: boolean;
  /** Click card body to select (preview). Title / CTA still link to detail. */
  onSelect?: () => void;
  /** Compact list variant for split layout */
  compact?: boolean;
}

const TAG_STYLES = [
  "bg-primary-100 text-primary-700",
  "bg-accent-100 text-accent-700",
  "bg-yellow-50 text-yellow-700 border border-yellow-200/50",
  "bg-secondary-100 text-secondary-700",
] as const;

export default function JobCard({
  job,
  selected = false,
  onSelect,
  compact = false,
}: JobCardProps) {
  const { t } = useTranslation();
  const { isEmployer } = useAuth();
  const path = jobPath(job);
  const interactive = Boolean(onSelect);

  const tags = [
    job.category,
    job.educationLevel,
    job.experience,
    job.experienceYears != null && Number.isFinite(job.experienceYears)
      ? t("postJob.experienceYearsValue", { count: job.experienceYears })
      : "",
  ].filter((v) => v && v !== "—");

  const handleCardClick = () => {
    onSelect?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  const stopNav = (e: MouseEvent) => {
    e.stopPropagation();
  };

  const shellClass = `group flex flex-col bg-background-50 border rounded-xl transition-all duration-200 cursor-pointer ${
    compact ? "p-3.5 md:p-4" : "p-4 md:p-5"
  } ${
    selected
      ? "border-primary-500 shadow-md shadow-primary-500/15 ring-1 ring-primary-400"
      : "border-background-200 hover:border-primary-400 hover:shadow-md hover:shadow-primary-500/10"
  }`;

  const body = (
    <>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-background-50 border border-background-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {job.companyLogo ? (
            <img
              src={job.companyLogo}
              alt={job.company}
              className="w-full h-full object-contain p-1.5"
            />
          ) : (
            <i className="ri-building-line text-foreground-400"></i>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {interactive ? (
            <Link
              to={path}
              onClick={stopNav}
              className="font-heading text-[15px] font-semibold text-primary-600 hover:text-primary-500 transition-colors line-clamp-2 leading-snug"
            >
              {job.title}
            </Link>
          ) : (
            <h3 className="font-heading text-[15px] font-semibold text-primary-600 group-hover:text-primary-500 transition-colors line-clamp-2 leading-snug">
              {job.title}
            </h3>
          )}
          <p className="text-sm text-foreground-600 mt-1 truncate">
            {job.company}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {job.featured ? (
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-red-500 text-white rounded whitespace-nowrap">
              Hot
            </span>
          ) : null}
          {job.applied ? (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-primary-100 text-primary-700 rounded whitespace-nowrap">
              {t("job.applied")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-xs text-foreground-600">
        <span className="inline-flex items-center gap-1 min-w-0">
          <i className="ri-map-pin-line text-primary-500 shrink-0"></i>
          <span className="truncate">{job.location || "—"}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-accent-600 font-medium">
          <i className="ri-money-dollar-circle-line shrink-0"></i>
          <span onClick={stopNav}>
            <JobSalary salary={job.salary} loginFrom={path} />
          </span>
        </span>
        {job.type ? (
          <span className="inline-flex items-center gap-1">
            <i className="ri-time-line text-secondary-500 shrink-0"></i>
            {job.type}
          </span>
        ) : null}
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className={`px-2.5 py-0.5 text-[11px] font-medium rounded-full whitespace-nowrap ${TAG_STYLES[i % TAG_STYLES.length]}`}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto">
        <div className="mt-3.5 pt-3.5 flex items-center justify-between gap-2 border-t border-background-200/60">
          <span className="text-xs text-foreground-400">
            {t("job.deadline")}: {formatDate(job.deadline)}
          </span>
          {!isEmployer ? (
            interactive ? (
              <Link
                to={path}
                onClick={stopNav}
                className={`text-xs font-semibold whitespace-nowrap ${
                  job.applied
                    ? "text-accent-600"
                    : "text-primary-500 hover:underline"
                }`}
              >
                {job.applied ? t("job.applied") : `${t("job.applyNow")} →`}
              </Link>
            ) : (
              <span
                className={`text-xs font-semibold whitespace-nowrap ${
                  job.applied
                    ? "text-accent-600"
                    : "text-primary-500 group-hover:underline"
                }`}
              >
                {job.applied ? t("job.applied") : `${t("job.applyNow")} →`}
              </span>
            )
          ) : null}
        </div>
      </div>
    </>
  );

  if (interactive) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        aria-pressed={selected}
        className={shellClass}
      >
        {body}
      </div>
    );
  }

  return (
    <Link to={path} className={shellClass}>
      {body}
    </Link>
  );
}
