import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mockJobs } from '@/mocks/jobs';

export default function FeaturedJobs() {
  const { t } = useTranslation();
  const featuredJobs = mockJobs.filter((j) => j.featured).slice(0, 6);

  return (
    <section className="py-16 md:py-20 bg-background-50">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950">{t('home.featuredJobs')}</h2>
            <p className="text-sm text-foreground-600 mt-2">{t('home.featuredJobsDesc')}</p>
          </div>
          <Link to="/jobs" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors whitespace-nowrap cursor-pointer">
            {t('home.viewAll')} <i className="ri-arrow-right-line"></i>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-product-shop="">
          {featuredJobs.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="group bg-background-50 border border-background-200/70 rounded-xl p-5 hover:border-primary-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
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
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-foreground-500">
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

              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                  {job.category}
                </span>
                <span className="px-2.5 py-1 bg-accent-100 text-accent-700 text-xs font-medium rounded-full">
                  {job.educationLevel}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-background-200/70 flex items-center justify-between">
                <span className="text-xs text-foreground-500">{job.deadline}</span>
                <span className="text-xs font-medium text-primary-500 group-hover:underline whitespace-nowrap">
                  {t('job.applyNow')} →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <Link to="/jobs" className="sm:hidden flex items-center justify-center gap-1.5 mt-8 text-sm font-medium text-primary-500 cursor-pointer">
          {t('home.viewAll')} <i className="ri-arrow-right-line"></i>
        </Link>
      </div>
    </section>
  );
}