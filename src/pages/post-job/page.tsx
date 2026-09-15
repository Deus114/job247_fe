import { useState, useEffect, useMemo, type SubmitEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth';
import { useJobs } from '@/features/jobs';
import { useCompanies } from '@/features/companies';
import CustomSelect from '@/components/ui/CustomSelect';
import MultiSelect from '@/components/ui/MultiSelect';
import type { Job } from '@/types/job';

export default function PostJobPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectCompanyId = searchParams.get('companyId');

  const { user } = useAuth();
  const { categories: rawCategories, educationLevels: rawEducationLevels, locations, addJob } = useJobs();
  const { companies } = useCompanies();
  
  const categories = (rawCategories || []).map((c: { name: string }) => c.name);
  const educationLevels = (rawEducationLevels || []).map((e: { name: string }) => e.name);

  const myApprovedCompanies = companies.filter(
    (c) => c.createdBy === user?.id && c.status === 'approved'
  );

  const experienceOptions = useMemo(
    () => [
      { value: 'Không yêu cầu', label: t('postJob.expOptions.none') },
      { value: 'Intern', label: t('postJob.expOptions.intern') },
      { value: 'Junior (dưới 1 năm)', label: t('postJob.expOptions.junior0') },
      { value: 'Junior (1-2 năm)', label: t('postJob.expOptions.junior1') },
      { value: 'Middle (2-3 năm)', label: t('postJob.expOptions.middle2') },
      { value: 'Middle (3-5 năm)', label: t('postJob.expOptions.middle3') },
      { value: 'Senior (5+ năm)', label: t('postJob.expOptions.senior') },
      { value: 'Lead/Manager', label: t('postJob.expOptions.lead') },
    ],
    [t],
  );

  const workTypeOptions = useMemo(
    () => [
      { value: 'Toàn thời gian', label: t('postJob.workTypeOptions.fulltime') },
      { value: 'Bán thời gian', label: t('postJob.workTypeOptions.parttime') },
      { value: 'Freelance', label: t('postJob.workTypeOptions.freelance') },
      { value: 'Thực tập', label: t('postJob.workTypeOptions.internship') },
      { value: 'Remote', label: t('postJob.workTypeOptions.remote') },
    ],
    [t],
  );

  const [formData, setFormData] = useState({
    companyId: preselectCompanyId || '',
    title: '', category: '', location: '', salary: '',
    educationLevel: [] as string[], type: [] as string[], experience: '',
    description: '', requirements: '', benefits: '', deadline: '',
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (preselectCompanyId) {
      setFormData((prev) =>
        prev.companyId ? prev : { ...prev, companyId: preselectCompanyId },
      );
    }
  }, [preselectCompanyId]);

  const selectedCompany = companies.find((c) => c.id === formData.companyId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string | string[]) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.title || !formData.companyId || !formData.category) return;

    const company = companies.find((c) => c.id === formData.companyId);
    if (!company) return;

    const newJob: Job = {
      id: Date.now().toString(),
      title: formData.title,
      company: company.name,
      companyId: company.id,
      companyLogo: company.logo,
      location: formData.location || company.location,
      salary: formData.salary || 'Thỏa thuận',
      category: formData.category,
      educationLevel: formData.educationLevel.length > 0 ? formData.educationLevel.join(', ') : 'Không yêu cầu',
      type: formData.type.length > 0 ? formData.type.join(', ') : 'Toàn thời gian',
      experience: formData.experience || 'Không yêu cầu',
      description: formData.description,
      requirements: formData.requirements.split('\n').filter(Boolean),
      benefits: formData.benefits.split('\n').filter(Boolean),
      deadline: formData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      featured: false,
      status: 'pending',
    };

    addJob(newJob);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-[70px] flex items-center justify-center bg-background-100">
        <div className="text-center p-10 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-accent-100 flex items-center justify-center mb-5">
            <i className="ri-check-line text-4xl text-accent-500"></i>
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground-950 mb-3">{t('postJob.success')}</h2>
          <p className="text-sm text-foreground-600 mb-8">{t('postJob.pendingApprovalDesc')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
              {t('postJob.goToDashboard')}
            </button>
            <button onClick={() => { setSubmitted(false); setFormData({ companyId: '', title: '', category: '', location: '', salary: '', educationLevel: [], type: [], experience: '', description: '', requirements: '', benefits: '', deadline: '' }); }} className="px-6 py-2.5 border border-background-300 text-foreground-700 rounded-full text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">
              {t('postJob.postAnother')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (myApprovedCompanies.length === 0) {
    return (
      <div className="min-h-screen pt-[70px] flex items-center justify-center bg-background-100">
        <div className="text-center p-10 max-w-lg">
          <div className="w-20 h-20 mx-auto rounded-full bg-yellow-100 flex items-center justify-center mb-5">
            <i className="ri-building-4-line text-3xl text-yellow-600"></i>
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground-950 mb-2">{t('postJob.noApprovedCompany')}</h2>
          <p className="text-sm text-foreground-600 mb-4">
            {t('postJob.noApprovedCompanyDesc')}
          </p>
          <div className="bg-background-50 border border-background-200/70 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-medium text-foreground-800 mb-2">{t('postJob.stepsTitle')}</p>
            <ol className="text-xs text-foreground-600 space-y-2 list-decimal list-inside">
              <li>{t('postJob.step1')}</li>
              <li>{t('postJob.step2')}</li>
              <li>{t('postJob.step3')}</li>
            </ol>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/companies/create')} className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-add-line mr-1.5"></i> {t('postJob.createCompanyFirst')}
            </button>
            <button onClick={() => navigate('/companies/manage')} className="px-6 py-2.5 border border-background-300 text-foreground-700 rounded-full text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-building-line mr-1.5"></i> {t('postJob.viewMyCompanies')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[70px] bg-background-100">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950">{t('postJob.title')}</h1>
            <p className="text-sm text-foreground-600 mt-1">{t('postJob.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('postJob.selectCompanyLabel')} *</label>
              <CustomSelect
                value={formData.companyId}
                onChange={(v) => handleSelectChange('companyId', v)}
                options={[
                  { value: '', label: t('postJob.selectCompanyPlaceholder') },
                  ...myApprovedCompanies.map((c) => ({ value: c.id, label: c.name })),
                ]}
                placeholder={t('postJob.selectCompanyPlaceholder')}
                required
              />
              {selectedCompany && (
                <div className="flex items-center gap-3 mt-3 p-3 bg-background-100/80 rounded-lg">
                  <img src={selectedCompany.logo} alt={selectedCompany.name} className="w-8 h-8 rounded object-contain" />
                  <div>
                    <p className="text-sm font-medium text-foreground-800">{selectedCompany.name}</p>
                    <p className="text-xs text-foreground-500">{selectedCompany.industry} · {selectedCompany.location} · {selectedCompany.size} {t('common.employees')}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('postJob.jobTitle')} *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required
                  className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                  placeholder={t('postJob.titlePlaceholder')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('postJob.category')} *</label>
                <CustomSelect
                  value={formData.category}
                  onChange={(v) => handleSelectChange('category', v)}
                  options={[
                    { value: '', label: t('postJob.selectCategory') },
                    ...categories.map((cat) => ({ value: cat, label: cat })),
                  ]}
                  placeholder={t('postJob.selectCategory')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('postJob.location')}</label>
                <CustomSelect
                  value={formData.location}
                  onChange={(v) => handleSelectChange('location', v)}
                  options={[
                    { value: '', label: t('postJob.selectLocation') },
                    ...locations.map((loc) => ({ value: loc, label: loc })),
                  ]}
                  placeholder={t('postJob.selectLocation')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('postJob.salary')}</label>
                <input type="text" name="salary" value={formData.salary} onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                  placeholder={t('postJob.salaryPlaceholder')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('postJob.education')}</label>
                <MultiSelect
                  values={formData.educationLevel}
                  onChange={(v) => handleSelectChange('educationLevel', v)}
                  options={educationLevels.map((lvl) => ({ value: lvl, label: lvl }))}
                  placeholder={t('postJob.selectEducation')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('postJob.workType')}</label>
                <MultiSelect
                  values={formData.type}
                  onChange={(v) => handleSelectChange('type', v)}
                  options={workTypeOptions}
                  placeholder={t('postJob.selectWorkType')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('postJob.experience')}</label>
                <CustomSelect
                  value={formData.experience}
                  onChange={(v) => handleSelectChange('experience', v)}
                  options={[
                    { value: '', label: t('postJob.selectExperience') },
                    ...experienceOptions,
                  ]}
                  placeholder={t('postJob.selectExperience')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('postJob.deadline')}</label>
                <input type="date" name="deadline" value={formData.deadline} onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors cursor-pointer" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('postJob.description')} *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required rows={5}
                className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors resize-none"
                placeholder={t('postJob.descPlaceholder')} maxLength={500}></textarea>
              <p className="text-xs text-foreground-400 mt-1 text-right">{formData.description.length}/500</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('postJob.requirements')}</label>
              <textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={4}
                className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors resize-none"
                placeholder={t('postJob.reqPlaceholder')}></textarea>
              <p className="text-xs text-foreground-400 mt-1">{t('postJob.onePerLineReq')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('postJob.benefits')}</label>
              <textarea name="benefits" value={formData.benefits} onChange={handleChange} rows={4}
                className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors resize-none"
                placeholder={t('postJob.benefitPlaceholder')}></textarea>
              <p className="text-xs text-foreground-400 mt-1">{t('postJob.onePerLineBenefit')}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button type="submit" className="flex-1 py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
                <i className="ri-add-line mr-1.5"></i> {t('postJob.submit')}
              </button>
              <button type="button" onClick={() => navigate('/')} className="px-6 py-3 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
