import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { saveJob, removeSavedJob } from '@/store/slices/savedJobsSlice';
import LoadingSpinner from '@/components/base/LoadingSpinner';
import JobCard from '../components/JobCard';
import ApplyModal from './components/ApplyModal';

function buildFilterUrl(job: { category: string; location: string; educationLevel: string; type: string }): string {
  const params = new URLSearchParams();
  if (job.category) params.set('categories', job.category);
  if (job.location) params.set('locations', job.location);
  if (job.educationLevel) params.set('educations', job.educationLevel.split(', ')[0] || job.educationLevel);
  if (job.type) params.set('types', job.type.split(', ')[0] || job.type);
  return `/jobs?${params.toString()}`;
}

export default function JobDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((state) => state.jobs.items);
  const loading = useAppSelector((state) => state.jobs.loading);
  const savedItems = useAppSelector((state) => state.savedJobs.items);
  const { user } = useAppSelector((state) => state.auth);
  const isEmployer = user?.role === 'employer';
  const isSaved = savedItems.some((s) => s.jobId === id);
  const [applyOpen, setApplyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'requirements' | 'benefits'>('description');

  const job = useMemo(() => jobs.find((j) => j.id === id && j.status === 'approved' && !j.deletedAt && j.isActive !== false), [jobs, id]);

  const relatedJobs = useMemo(() => {
    if (!job) return [];
    const approvedJobs = jobs.filter((j) => j.status === 'approved' && !j.deletedAt && j.isActive !== false && j.id !== job.id);
    const sameCategory = approvedJobs.filter((j) => j.category === job.category);
    const sameLocation = approvedJobs.filter(
      (j) => j.location === job.location && j.category !== job.category
    );
    const combined = [...sameCategory, ...sameLocation];
    return combined.slice(0, 6);
  }, [jobs, job]);

  const toggleSave = () => {
    if (!job) return;
    if (isSaved) {
      dispatch(removeSavedJob(job.id));
    } else {
      dispatch(saveJob(job.id));
    }
  };

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
          <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">Không tìm thấy công việc</h3>
          <p className="text-sm text-foreground-500 mb-6">Công việc này có thể đã hết hạn hoặc không tồn tại</p>
          <button onClick={() => navigate('/jobs')} className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
            <i className="ri-arrow-left-line mr-1.5"></i>{t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'description' as const, label: t('job.jobDescription'), icon: 'ri-file-text-line' },
    { key: 'requirements' as const, label: t('job.requirements'), icon: 'ri-list-check-2' },
    { key: 'benefits' as const, label: t('job.benefits'), icon: 'ri-gift-line' },
  ];

  return (
    <div className="min-h-screen pt-[70px]">
      {/* Top banner area */}
      <div className="bg-background-100 border-b border-background-200/70">
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-4 md:py-5">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-foreground-600 hover:text-primary-500 transition-colors cursor-pointer mb-4 whitespace-nowrap">
            <i className="ri-arrow-left-line"></i> {t('common.back')}
          </button>

          <div className="flex flex-col lg:flex-row lg:items-start gap-5">
            {/* Left: Job info */}
            <div className="flex-1">
              <div className="flex items-start gap-4 md:gap-5">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-background-50 border border-background-200/70 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src={job.companyLogo} alt={job.company} className="w-12 h-12 md:w-14 md:h-14 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h1 className="text-lg md:text-xl font-heading font-bold text-foreground-950">{job.title}</h1>
                    {job.featured && (
                      <span className="flex-shrink-0 px-2.5 py-0.5 text-[11px] font-semibold bg-accent-500 text-background-50 dark:text-foreground-950 rounded-full whitespace-nowrap">
                        Hot
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground-600">{job.company}</p>

                  <div className="flex flex-wrap gap-2 md:gap-3 mt-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full whitespace-nowrap">
                      <i className="ri-price-tag-3-line"></i> {job.category}
                    </span>
                    {job.educationLevel.split(', ').map((level, i) => (
                    <span key={`edu-${i}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-100 text-accent-700 text-xs font-medium rounded-full whitespace-nowrap">
                      <i className="ri-graduation-cap-line"></i> {level}
                    </span>
                  ))}
                    {job.type.split(', ').map((tp, i) => (
                    <span key={`type-${i}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary-100 text-secondary-700 text-xs font-medium rounded-full whitespace-nowrap">
                      <i className="ri-briefcase-line"></i> {tp}
                    </span>
                  ))}
                    {job.experience && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap bg-yellow-50 text-yellow-700 border border-yellow-200/50">
                      <i className="ri-award-line"></i> {job.experience}
                    </span>
                  )}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-foreground-500 whitespace-nowrap">
                      <i className="ri-money-dollar-circle-line"></i> {job.salary}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-foreground-500 whitespace-nowrap">
                      <i className="ri-map-pin-line"></i> {job.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-foreground-500 whitespace-nowrap">
                      <i className="ri-calendar-check-line"></i> Hạn nộp: {job.deadline}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-5 md:py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            {/* Tabs */}
            <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
              <div className="flex border-b border-background-200/70">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'text-primary-500 border-b-2 border-primary-500 bg-primary-50/50'
                        : 'text-foreground-600 hover:bg-background-100'
                    }`}
                  >
                    <i className={tab.icon}></i> {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5 md:p-6">
                {activeTab === 'description' && (
                  <div>
                    <p className="text-sm text-foreground-700 leading-relaxed whitespace-pre-line">{job.description}</p>
                  </div>
                )}

                {activeTab === 'requirements' && (
                  <ul className="space-y-3">
                    {job.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-foreground-700">
                        <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="ri-check-line text-[10px] text-accent-600"></i>
                        </div>
                        {req}
                      </li>
                    ))}
                  </ul>
                )}

                {activeTab === 'benefits' && (
                  <ul className="space-y-3">
                    {job.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-foreground-700">
                        <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i className="ri-star-fill text-[10px] text-primary-500"></i>
                        </div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Related jobs - using JobCard for consistency */}
            {relatedJobs.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl md:text-2xl font-heading font-bold text-foreground-950">{t('job.relatedJobs')}</h3>
                  <Link
                    to={buildFilterUrl(job)}
                    className="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Xem tất cả <i className="ri-arrow-right-line"></i>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-product-shop="">
                  {relatedJobs.map((rj) => (
                    <JobCard key={rj.id} job={rj} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar - Action card + Company info */}
          <div className="hidden lg:block lg:w-[300px] flex-shrink-0 space-y-5">
            {!isEmployer && (
            <div className="bg-background-50 border border-background-200/70 rounded-xl p-5 sticky top-[90px]">
              <button
                onClick={() => setApplyOpen(true)}
                className="w-full py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 shadow-lg shadow-primary-500/15"
              >
                <i className="ri-send-plane-fill"></i> {t('job.applyNow')}
              </button>
              <button
                onClick={toggleSave}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 border mt-3 ${isSaved ? 'bg-primary-50 border-primary-300 text-primary-600' : 'border-background-200/70 text-foreground-600 hover:bg-background-100'}`}
              >
                <i className={`${isSaved ? 'ri-bookmark-fill' : 'ri-bookmark-line'}`}></i>
                {isSaved ? 'Đã lưu' : t('job.saveJob')}
              </button>
            </div>
            )}

            <div className="bg-background-50 border border-background-200/70 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl bg-background-100 flex items-center justify-center overflow-hidden">
                  <img src={job.companyLogo} alt={job.company} className="w-12 h-12 object-contain" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground-950">{job.company}</p>
                  <p className="text-xs text-foreground-500">{job.category}</p>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-xs text-foreground-600">
                  <i className="ri-building-line text-primary-400"></i>
                  <span>Lĩnh vực {job.category}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground-600">
                  <i className="ri-map-pin-line text-accent-400"></i>
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground-600">
                  <i className="ri-time-line text-secondary-400"></i>
                  <span>{job.type}</span>
                </div>
              </div>

              <p className="text-xs text-foreground-600 leading-relaxed mb-5">
                {job.company} là một trong những công ty hàng đầu trong lĩnh vực {job.category.toLowerCase()}, với môi trường làm việc chuyên nghiệp và cơ hội phát triển sự nghiệp.
              </p>

              <Link
                to={`/companies/${job.companyId}`}
                className="block w-full py-2.5 text-center text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200/50 rounded-xl hover:bg-primary-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-building-4-line mr-1.5"></i>
                Xem trang công ty
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ApplyModal
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.company}
        companyLogo={job.companyLogo}
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
      />
    </div>
  );
}