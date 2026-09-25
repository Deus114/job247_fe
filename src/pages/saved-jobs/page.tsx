import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth";
import { useJobs, useSavedJobs, JobCard } from "@/features/jobs";

export default function SavedJobsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { jobs: allJobs } = useJobs();
  const { savedItems, removeSavedJob } = useSavedJobs();

  const savedJobs = useMemo(() => {
    const map = new Map(allJobs.map((j) => [j.id, j]));
    return savedItems
      .map((s) => map.get(s.jobId))
      .filter((job): job is NonNullable<typeof job> =>
        Boolean(
          job &&
          job.status === "approved" &&
          !job.deletedAt &&
          job.isActive !== false,
        ),
      );
  }, [savedItems, allJobs]);

  if (user?.role === "employer") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen pt-[70px]">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950 mb-2">
            {t("savedJobs.title")}
          </h1>
          <p className="text-sm text-foreground-600">
            {t("savedJobs.emptyDesc")}
          </p>
        </div>

        {savedJobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-5">
              <i className="ri-bookmark-line text-3xl text-foreground-400"></i>
            </div>
            <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
              {t("savedJobs.empty")}
            </h3>
            <p className="text-sm text-foreground-500 mb-6">
              {t("savedJobs.emptyDesc")}
            </p>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-search-line"></i> {t("applications.browseJobs")}
            </Link>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            data-product-shop=""
          >
            {savedJobs.map((job) => (
              <div key={job.id} className="relative group">
                <JobCard job={job} />
                <button
                  onClick={() => removeSavedJob(job.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background-50 border border-background-200 flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-10"
                  title={t("savedJobs.unsave")}
                >
                  <i className="ri-delete-bin-line text-sm"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
