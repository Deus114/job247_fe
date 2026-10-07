import { fetchPublicJobs } from "@/api";
import { useAuth } from "@/features/auth";
import { formatDate } from "@/lib/formatDate";
import { jobPath } from "@/lib/paths";
import type { Job } from "@/types/job";
import JobSalary from "./JobSalary";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function LatestJobs() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchPublicJobs({
      page: 1,
      size: 6,
      sort: "createdAt,DESC",
    })
      .then((res) => {
        if (cancelled) return;
        setJobs(res.data);
      })
      .catch(() => {
        if (!cancelled) setJobs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <section className="py-10 md:py-12 bg-background-50">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950">
              {t("home.latestJobs")}
            </h2>
            <p className="text-sm text-foreground-600 mt-2">
              {t("home.latestJobsDesc")}
            </p>
          </div>
          <Link
            to="/jobs?sort=newest"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors whitespace-nowrap cursor-pointer"
          >
            {t("home.viewAll")} <i className="ri-arrow-right-line"></i>
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-sm text-foreground-500 py-10">
            {t("common.loading")}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to={jobPath(job)}
                className="group bg-background-50 border border-background-200/70 rounded-xl p-5 hover:border-primary-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img
                      src={job.companyLogo}
                      alt={job.company}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-base font-semibold text-foreground-950 group-hover:text-primary-500 transition-colors truncate">
                      {job.title}
                    </h3>
                    <p className="text-sm text-foreground-600 mt-0.5 truncate">
                      {job.company}
                    </p>
                  </div>
                  {job.applied ? (
                    <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-medium bg-primary-100 text-primary-700 rounded-full whitespace-nowrap">
                      {t("job.applied")}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-foreground-500">
                  <span className="flex items-center gap-1">
                    <i className="ri-map-pin-line text-primary-400"></i>{" "}
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="ri-money-dollar-circle-line text-accent-400"></i>{" "}
                    <JobSalary salary={job.salary} loginFrom={jobPath(job)} />
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="ri-time-line text-secondary-400"></i>{" "}
                    {job.type}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 mb-4">
                  <span className="px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                    {job.category}
                  </span>
                  <span className="px-2.5 py-1 bg-accent-100 text-accent-700 text-xs font-medium rounded-full">
                    {job.educationLevel}
                  </span>
                  {job.experienceYears != null &&
                  Number.isFinite(job.experienceYears) ? (
                    <span className="px-2.5 py-1 bg-secondary-100 text-secondary-700 text-xs font-medium rounded-full whitespace-nowrap">
                      {t("postJob.experienceYearsValue", {
                        count: job.experienceYears,
                      })}
                    </span>
                  ) : null}
                </div>

                <div className="pt-4 border-t border-background-200/70 flex items-center justify-between">
                  <span className="text-xs text-foreground-500">
                    {formatDate(job.deadline)}
                  </span>
                  <span
                    className={`text-xs font-medium whitespace-nowrap ${
                      job.applied
                        ? "text-accent-600"
                        : "text-primary-500 group-hover:underline"
                    }`}
                  >
                    {job.applied ? t("job.applied") : `${t("job.applyNow")} →`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <p className="text-center text-sm text-foreground-500 py-10">
            {t("common.noData")}
          </p>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/jobs?sort=newest"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500"
          >
            {t("home.viewAll")} <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
      </div>
    </section>
  );
}
