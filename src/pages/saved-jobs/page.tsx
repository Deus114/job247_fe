import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import { useAuth } from "@/features/auth";
import { SavedJobCard, useSavedJobs } from "@/features/jobs";
import { toast } from "@/lib/toast";
import type { SavedJobItem } from "@/types/application";
import type { ApiPagination } from "@/types/catalog";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";

const emptyPagination: ApiPagination = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
  from: 0,
  to: 0,
};

export default function SavedJobsPage() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { loadSavedJobs, removeSavedJob, resolveError } = useSavedJobs();
  const [jobs, setJobs] = useState<SavedJobItem[]>([]);
  const [pagination, setPagination] = useState<ApiPagination>(emptyPagination);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setJobs([]);
      setPagination(emptyPagination);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void loadSavedJobs({ page, size: pageSize })
      .then((result) => {
        if (cancelled) return;
        setJobs(result.data);
        setPagination(result.pagination);
        // If current page is past last page after delete, clamp.
        if (
          result.pagination.last_page > 0 &&
          page > result.pagination.last_page
        ) {
          setPage(result.pagination.last_page);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setJobs([]);
          setPagination(emptyPagination);
          toast.error(resolveError(error));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loadSavedJobs, page, pageSize, resolveError]);

  if (user?.role === "employer") {
    return <Navigate to="/" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: "/saved-jobs" }} replace />;
  }

  const handleUnsave = async (jobId: number) => {
    const id = String(jobId);
    if (removingId) return;
    setRemovingId(id);
    try {
      await removeSavedJob(id);
      toast.success(t("savedJobs.unsaveSuccess"));
      const nextLen = jobs.length - 1;
      if (nextLen <= 0 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      } else {
        // Refetch current page to keep pagination totals accurate.
        const result = await loadSavedJobs({ page, size: pageSize });
        setJobs(result.data);
        setPagination(result.pagination);
        if (
          result.pagination.last_page > 0 &&
          page > result.pagination.last_page
        ) {
          setPage(result.pagination.last_page);
        }
      }
    } catch (error) {
      toast.error(resolveError(error));
    } finally {
      setRemovingId(null);
    }
  };

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

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : jobs.length === 0 ? (
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
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
            >
              <i className="ri-search-line"></i> {t("applications.browseJobs")}
            </Link>
          </div>
        ) : (
          <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-4 md:p-5"
              data-product-shop=""
            >
              {jobs.map((job) => (
                <div key={`${job.id}-${job.jobId}`} className="relative group">
                  <SavedJobCard item={job} />
                  <button
                    type="button"
                    onClick={() => void handleUnsave(job.jobId)}
                    disabled={removingId === String(job.jobId)}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-background-50 border border-background-200 flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 z-10 disabled:opacity-50"
                    title={t("savedJobs.unsave")}
                  >
                    <i
                      className={`${removingId === String(job.jobId) ? "ri-loader-4-line animate-spin" : "ri-delete-bin-line"} text-sm`}
                    ></i>
                  </button>
                </div>
              ))}
            </div>

            {pagination.total > 0 ? (
              <Pagination
                currentPage={pagination.current_page || page}
                totalPages={Math.max(1, pagination.last_page)}
                pageSize={pageSize}
                totalItems={pagination.total}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
