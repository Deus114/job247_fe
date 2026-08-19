import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { removeSavedJob } from '@/store/slices/savedJobsSlice';
import JobCard from '@/pages/jobs/components/JobCard';

export default function SavedJobsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const savedItems = useAppSelector((state) => state.savedJobs.items);
  const allJobs = useAppSelector((state) => state.jobs.items);

  const savedJobs = useMemo(() => {
    const map = new Map(allJobs.map((j) => [j.id, j]));
    return savedItems
      .map((s) => map.get(s.jobId))
      .filter(Boolean);
  }, [savedItems, allJobs]);

  if (user?.role === 'employer') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen pt-[70px]">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950 mb-2">
            Việc làm đã lưu
          </h1>
          <p className="text-sm text-foreground-600">
            Danh sách các công việc bạn đã lưu để xem lại sau
          </p>
        </div>

        {savedJobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-5">
              <i className="ri-bookmark-line text-3xl text-foreground-400"></i>
            </div>
            <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
              Chưa có việc làm nào được lưu
            </h3>
            <p className="text-sm text-foreground-500 mb-6">
              Khám phá và lưu các công việc phù hợp với bạn
            </p>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-search-line"></i> Tìm việc làm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-product-shop="">
            {savedJobs.map((job) => (
              <div key={job.id} className="relative group">
                <JobCard job={job} />
                <button
                  onClick={() => dispatch(removeSavedJob(job.id))}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background-50 border border-background-200 flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-10"
                  title="Bỏ lưu"
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