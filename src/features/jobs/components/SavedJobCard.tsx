import { useAuth } from "@/features/auth";
import {
  employmentTypeLabelKey,
  experienceLevelLabelKey,
} from "@/constants/employerJob";
import { formatDate } from "@/lib/formatDate";
import { formatMoneyRange } from "@/lib/formatNumber";
import { jobPath } from "@/lib/paths";
import type { SavedJobItem } from "@/types/application";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import JobSalary from "./JobSalary";

interface SavedJobCardProps {
  item: SavedJobItem;
}

export default function SavedJobCard({ item }: SavedJobCardProps) {
  const { t } = useTranslation();
  const { isEmployer } = useAuth();

  const path = jobPath({
    id: item.jobId,
    slug: item.jobSlug,
    title: item.jobTitle,
  });
  const location = item.provinces.map((p) => p.name).filter(Boolean).join(", ");
  const employmentLabel = item.employmentTypes
    .map((value) => t(employmentTypeLabelKey(value)))
    .filter(Boolean)
    .join(", ");
  const experienceLabel = item.experienceLevels
    .map((value) => t(experienceLevelLabelKey(value)))
    .filter(Boolean)
    .join(", ");
  const salary = item.salaryNegotiable
    ? t("postJob.negotiable")
    : formatMoneyRange(item.salaryMin, item.salaryMax) || "—";

  return (
    <Link
      to={path}
      className="group bg-background-50 border border-background-200/70 rounded-xl p-5 hover:border-primary-300 transition-all duration-200 cursor-pointer flex flex-col"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {item.companyLogo ? (
            <img
              src={item.companyLogo}
              alt={item.companyName}
              className="w-10 h-10 object-contain"
            />
          ) : (
            <i className="ri-building-line text-foreground-400 text-lg"></i>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-base font-semibold text-foreground-950 group-hover:text-primary-500 transition-colors truncate">
            {item.jobTitle}
          </h3>
          <p className="text-sm text-foreground-600 mt-0.5 truncate">
            {item.companyName}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {item.hot ? (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-accent-500 text-background-50 dark:text-foreground-950 rounded-full whitespace-nowrap">
              Hot
            </span>
          ) : null}
          {item.applied ? (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-primary-100 text-primary-700 rounded-full whitespace-nowrap">
              {t("job.applied")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-xs text-foreground-500">
        {location ? (
          <span className="flex items-center gap-1 min-w-0">
            <i className="ri-map-pin-line text-primary-400 flex-shrink-0"></i>
            <span className="truncate">{location}</span>
          </span>
        ) : null}
        <span className="flex items-center gap-1">
          <i className="ri-money-dollar-circle-line text-accent-400"></i>
          <JobSalary salary={salary} loginFrom={path} />
        </span>
        {employmentLabel ? (
          <span className="flex items-center gap-1">
            <i className="ri-time-line text-secondary-400"></i> {employmentLabel}
          </span>
        ) : null}
      </div>

      {(experienceLabel ||
        (item.experienceYears != null &&
          Number.isFinite(item.experienceYears))) && (
        <div className="flex flex-wrap gap-2 mt-3 mb-4">
          {experienceLabel ? (
            <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full whitespace-nowrap border border-yellow-200/50">
              {experienceLabel}
            </span>
          ) : null}
          {item.experienceYears != null &&
          Number.isFinite(item.experienceYears) ? (
            <span className="px-2.5 py-1 bg-secondary-100 text-secondary-700 text-xs font-medium rounded-full whitespace-nowrap">
              {t("postJob.experienceYearsValue", {
                count: item.experienceYears,
              })}
            </span>
          ) : null}
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-background-200/70 flex items-center justify-between gap-2">
        <span className="text-xs text-foreground-500">
          <i className="ri-calendar-line mr-1"></i>
          {formatDate(item.deadline)}
        </span>
        {!isEmployer ? (
          <span
            className={`text-xs font-medium whitespace-nowrap ${
              item.applied
                ? "text-accent-600"
                : "text-primary-500 group-hover:underline"
            }`}
          >
            {item.applied ? t("job.applied") : `${t("job.applyNow")} →`}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
