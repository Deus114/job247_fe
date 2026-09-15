import { useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth';
import { useJobs } from '@/features/jobs';
import { useCompanies, companySizes } from '@/features/companies';
import CustomSelect from '@/components/ui/CustomSelect';
import type { Company } from '@/types/company';

export default function CreateCompanyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categories: rawCategories } = useJobs();
  const { addCompany } = useCompanies();
  
  const categories = (rawCategories || []).map((c: { name: string }) => c.name);

  const [formData, setFormData] = useState({
    name: '', nameEn: '', industry: '', size: '', location: '',
    address: '', website: '', contactEmail: '', contactPhone: '',
    taxCode: '', description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Ensure errors is always an object
  const safeErrors = errors || {};

  if (!user || user.role === 'user') {
    return (
      <div className="min-h-screen pt-[70px] flex items-center justify-center bg-background-100">
        <div className="text-center p-10 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-background-200 flex items-center justify-center mb-5">
            <i className="ri-building-line text-3xl text-foreground-400"></i>
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground-950 mb-2">{t('common.accessDenied')}</h2>
          <p className="text-sm text-foreground-600 mb-6">{t('company.employerOnlyDesc', 'Chỉ nhà tuyển dụng mới có thể tạo công ty.')}</p>
          <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
            {t('auth.loginButton')}
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t('company.validation.nameRequired');
    if (!formData.industry) newErrors.industry = t('validation.selectOption');
    if (!formData.size) newErrors.size = t('validation.selectOption');
    if (!formData.location.trim()) newErrors.location = t('validation.required');
    if (!formData.address.trim()) newErrors.address = t('company.validation.addressRequired');
    if (!formData.contactEmail.trim()) newErrors.contactEmail = t('validation.required');
    if (!formData.contactPhone.trim()) newErrors.contactPhone = t('validation.required');
    if (!formData.taxCode.trim()) newErrors.taxCode = t('validation.required');
    if (!formData.description.trim()) newErrors.description = t('company.validation.descRequired');
    if (formData.description.length > 500) newErrors.description = t('validation.maxLength', { max: 500 });
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) newErrors.website = t('validation.urlInvalid');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    const newCompany: Company = {
      id: `c${Date.now()}`,
      name: formData.name.trim(),
      nameEn: formData.nameEn.trim() || formData.name.trim(),
      logo: 'https://readdy.ai/api/search-image?query=Modern%20minimalist%20company%20logo%20with%20clean%20geometric%20design%2C%20warm%20orange%20and%20white%20palette%2C%20flat%20style%2C%20simple%20icon%20mark&width=120&height=120&seq=new-company-logo&orientation=squarish',
      banner: 'https://readdy.ai/api/search-image?query=Modern%20professional%20office%20workspace%20with%20warm%20natural%20lighting%2C%20collaborative%20environment%2C%20clean%20aesthetic%20architecture%2C%20corporate%20atmosphere&width=1200&height=400&seq=new-company-banner&orientation=landscape',
      description: formData.description.trim(),
      industry: formData.industry,
      size: formData.size,
      location: formData.location.trim(),
      address: formData.address.trim(),
      website: formData.website.trim(),
      contactEmail: formData.contactEmail.trim(),
      contactPhone: formData.contactPhone.trim(),
      taxCode: formData.taxCode.trim(),
      status: 'pending',
      createdBy: user.id,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    addCompany(newCompany);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-[70px] flex items-center justify-center bg-background-100">
        <div className="text-center p-10 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-accent-100 flex items-center justify-center mb-5">
            <i className="ri-check-line text-4xl text-accent-500"></i>
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground-950 mb-3">{t('company.submitSuccess', 'Đã gửi yêu cầu!')}</h2>
          <p className="text-sm text-foreground-600 mb-2">{t('company.submitSuccessDesc', 'Hồ sơ công ty')} <strong>{formData.name}</strong> {t('company.submitted', 'đã được gửi đi')}.</p>
          <p className="text-sm text-foreground-500 mb-8">{t('company.reviewNotice', 'Admin sẽ xem xét và phê duyệt trong vòng 24h. Bạn sẽ nhận được thông báo khi công ty được duyệt.')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/companies/manage')} className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
              {t('company.myCompanies')}
            </button>
            <button onClick={() => { setSubmitted(false); setFormData({ name: '', nameEn: '', industry: '', size: '', location: '', address: '', website: '', contactEmail: '', contactPhone: '', taxCode: '', description: '' }); }} className="px-6 py-2.5 border border-background-300 text-foreground-700 rounded-full text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">
              {t('company.createAnother', 'Tạo công ty khác')}
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
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950">{t('company.create')}</h1>
            <p className="text-sm text-foreground-600 mt-1">{t('company.createDesc', 'Điền thông tin công ty để được xét duyệt. Sau khi được duyệt, bạn có thể đăng tin tuyển dụng.')}</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-base font-heading font-semibold text-foreground-950 mb-4 flex items-center gap-2">
                <i className="ri-information-line text-primary-500"></i> {t('company.basicInfo', 'Thông tin cơ bản')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('company.name')} (Tiếng Việt) *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.name ? 'border-red-400' : 'border-background-200/70'}`}
                    placeholder={t('company.namePlaceholder', 'VD: Công ty Cổ phần ABC')} />
                  {safeErrors.name && <p className="text-xs text-red-500 mt-1">{safeErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('company.name')} (Tiếng Anh)</label>
                  <input type="text" name="nameEn" value={formData.nameEn} onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                    placeholder={t('company.nameEnPlaceholder', 'VD: ABC Corporation')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('company.industry')} *</label>
                  <CustomSelect
                    value={formData.industry}
                    onChange={(v) => handleSelectChange('industry', v)}
                    options={[
                      { value: '', label: t('common.select') + ' ' + t('company.industry').toLowerCase() },
                      ...categories.map((cat) => ({ value: cat, label: cat })),
                    ]}
                    placeholder={t('common.select') + ' ' + t('company.industry').toLowerCase()}
                    className={safeErrors.industry ? '[&>button]:border-red-400' : ''}
                  />
                  {safeErrors.industry && <p className="text-xs text-red-500 mt-1">{safeErrors.industry}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('company.size')} *</label>
                  <CustomSelect
                    value={formData.size}
                    onChange={(v) => handleSelectChange('size', v)}
                    options={[
                      { value: '', label: t('common.select') + ' ' + t('company.size').toLowerCase() },
                      ...companySizes.map((s) => ({ value: s, label: `${s} ${t('common.employees')}` })),
                    ]}
                    placeholder={t('common.select') + ' ' + t('company.size').toLowerCase()}
                    className={safeErrors.size ? '[&>button]:border-red-400' : ''}
                  />
                  {safeErrors.size && <p className="text-xs text-red-500 mt-1">{safeErrors.size}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('job.location')} (Tỉnh/Thành phố) *</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.location ? 'border-red-400' : 'border-background-200/70'}`}
                    placeholder={t('company.locationPlaceholder', 'VD: Hồ Chí Minh')} />
                  {safeErrors.location && <p className="text-xs text-red-500 mt-1">{safeErrors.location}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('company.address')} *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.address ? 'border-red-400' : 'border-background-200/70'}`}
                    placeholder={t('company.addressPlaceholder', 'VD: Tầng 5, Tòa nhà ABC, 123 Đường XYZ, Quận 1, TP. HCM')} />
                  {safeErrors.address && <p className="text-xs text-red-500 mt-1">{safeErrors.address}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-heading font-semibold text-foreground-950 mb-4 flex items-center gap-2">
                <i className="ri-contacts-line text-primary-500"></i> {t('company.contactInfo', 'Thông tin liên hệ')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('contact.email')} *</label>
                  <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.contactEmail ? 'border-red-400' : 'border-background-200/70'}`}
                    placeholder={t('company.emailPlaceholder', 'VD: hr@congty.com')} />
                  {safeErrors.contactEmail && <p className="text-xs text-red-500 mt-1">{safeErrors.contactEmail}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('contact.phone')} *</label>
                  <input type="text" name="contactPhone" value={formData.contactPhone} onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.contactPhone ? 'border-red-400' : 'border-background-200/70'}`}
                    placeholder={t('company.phonePlaceholder', 'VD: 028 3838 1234')} />
                  {safeErrors.contactPhone && <p className="text-xs text-red-500 mt-1">{safeErrors.contactPhone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('company.website')}</label>
                  <input type="text" name="website" value={formData.website} onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.website ? 'border-red-400' : 'border-background-200/70'}`}
                    placeholder={t('company.websitePlaceholder', 'VD: https://www.congty.com')} />
                  {safeErrors.website && <p className="text-xs text-red-500 mt-1">{safeErrors.website}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('company.taxCode', 'Mã số thuế')} *</label>
                  <input type="text" name="taxCode" value={formData.taxCode} onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.taxCode ? 'border-red-400' : 'border-background-200/70'}`}
                    placeholder={t('company.taxCodePlaceholder', 'VD: 0101248150')} />
                  {safeErrors.taxCode && <p className="text-xs text-red-500 mt-1">{safeErrors.taxCode}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-heading font-semibold text-foreground-950 mb-4 flex items-center gap-2">
                <i className="ri-file-text-line text-primary-500"></i> {t('company.description')} *
              </h3>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={5}
                className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors resize-none ${safeErrors.description ? 'border-red-400' : 'border-background-200/70'}`}
                placeholder={t('company.descPlaceholder', 'Mô tả về công ty, lĩnh vực hoạt động, văn hóa, thành tựu...')} maxLength={500}></textarea>
              <div className="flex items-center justify-between mt-1">
                {safeErrors.description && <p className="text-xs text-red-500">{safeErrors.description}</p>}
                <p className="text-xs text-foreground-400 ml-auto">{formData.description.length}/500</p>
              </div>
            </div>

            <div className="bg-background-100/80 border border-background-200/60 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <i className="ri-information-line text-accent-500 mt-0.5"></i>
                <div>
                  <p className="text-sm font-medium text-foreground-800 mb-1">{t('company.importantNote', 'Lưu ý quan trọng')}</p>
                  <ul className="text-xs text-foreground-600 space-y-1">
                    <li>• {t('company.note1', 'Hồ sơ công ty sẽ được admin xét duyệt trong vòng 24h làm việc')}</li>
                    <li>• {t('company.note2', 'Chỉ công ty đã được duyệt mới có thể đăng tin tuyển dụng')}</li>
                    <li>• {t('company.note3', 'Vui lòng điền thông tin chính xác và đầy đủ để tăng khả năng được duyệt')}</li>
                    <li>• {t('company.note4', 'Nếu bị từ chối, bạn có thể chỉnh sửa và gửi lại')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button type="submit" className="flex-1 py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
                <i className="ri-send-plane-line mr-1.5"></i> {t('company.submit')}
              </button>
              <button type="button" onClick={() => navigate('/companies/manage')} className="px-6 py-3 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}