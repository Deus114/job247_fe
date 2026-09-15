import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth';
import type { Job } from '@/types/job';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const { t } = useTranslation();
  const { isEmployer } = useAuth();

  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group bg-background-50 border border-background-200/70 rounded-xl p-5 hover:border-primary-300 transition-all duration-200 cursor-pointer flex flex-col"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img src={job.companyLogo} alt={job.company} className="w-10 h-10 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-base font-semibold text-foreground-950 group-hover:text-primary-500 transition-colors truncate">
            {job.title}
          </h3>
          <p className="text-sm text-foreground-600 mt-0.5 truncate">{job.company}</p>
        </div>
        {job.featured && (
          <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-medium bg-accent-500 text-background-50 dark:text-foreground-950 rounded-full whitespace-nowrap">
            Hot
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-xs text-foreground-500">
        <span className="flex items-center gap-1">
          <i className="ri-map-pin-line text-primary-400"></i> {job.location}
        </span>
        <span className="flex items-center gap-1">
          <i className="ri-money-dollar-circle-line text-accent-400"></i> {job.salary}
        </span>
        <span className="flex items-center gap-1">
          <i className="ri-time-line text-secondary-400"></i> {job.type}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <span className="px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full whitespace-nowrap">
          {job.category}
        </span>
        <span className="px-2.5 py-1 bg-accent-100 text-accent-700 text-xs font-medium rounded-full whitespace-nowrap">
          {job.educationLevel}
        </span>
        {job.experience && (
          <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full whitespace-nowrap border border-yellow-200/50">
            {job.experience}
          </span>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-background-200/70 flex items-center justify-between">
        <span className="text-xs text-foreground-500">
          <i className="ri-calendar-line mr-1"></i>{job.deadline}
        </span>
        {!isEmployer && (
          <span className="text-xs font-medium text-primary-500 group-hover:underline whitespace-nowrap">
            {t('job.applyNow')} →
          </span>
        )}
      </div>
    </Link>
  );
}