import { useState, useEffect, type SubmitEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth';
import { useJobs } from '@/features/jobs';
import { useCompanies, companySizes } from '@/features/companies';
import CustomSelect from '@/components/ui/CustomSelect';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function EditCompanyPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { companies, loading, updateCompany } = useCompanies();
  const { categories: rawCategories } = useJobs();
  
  const categories = (rawCategories || []).map((c: { name: string }) => c.name);
  const company = companies.find((c) => c.id === id);

  const [formData, setFormData] = useState({
    name: '', nameEn: '', industry: '', size: '', location: '',
    address: '', website: '', contactEmail: '', contactPhone: '',
    taxCode: '', description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // Ensure errors is always an object
  const safeErrors = errors || {};

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        nameEn: company.nameEn || '',
        industry: company.industry,
        size: company.size,
        location: company.location,
        address: company.address,
        website: company.website || '',
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        taxCode: company.taxCode,
        description: company.description,
      });
    }
  }, [company]);

  if (loading) {
    return (
      <div className="min-h-screen pt-[70px] flex items-center justify-center bg-background-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen pt-[70px] flex items-center justify-center bg-background-100">
        <div className="text-center p-10 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-background-200 flex items-center justify-center mb-5">
            <i className="ri-building-line text-3xl text-foreground-400"></i>
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground-950 mb-2">{t('company.notFound', 'Không tìm thấy công ty')}</h2>
          <p className="text-sm text-foreground-600 mb-6">{t('company.notFoundDesc', 'Công ty này không tồn tại hoặc đã bị xóa.')}</p>
          <button onClick={() => navigate('/companies/manage')} className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  if (!user || user.id !== company.createdBy) {
    return (
      <div className="min-h-screen pt-[70px] flex items-center justify-center bg-background-100">
        <div className="text-center p-10 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-5">
            <i className="ri-forbid-line text-3xl text-red-500"></i>
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground-950 mb-2">{t('common.accessDenied')}</h2>
          <p className="text-sm text-foreground-600 mb-6">{t('company.noEditPermission', 'Bạn không có quyền chỉnh sửa công ty này.')}</p>
          <button onClick={() => navigate('/companies/manage')} className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
            {t('common.back')}
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

    updateCompany({
      ...company,
      name: formData.name.trim(),
      nameEn: formData.nameEn.trim() || formData.name.trim(),
      description: formData.description.trim(),
      industry: formData.industry,
      size: formData.size,
      location: formData.location.trim(),
      address: formData.address.trim(),
      website: formData.website.trim(),
      contactEmail: formData.contactEmail.trim(),
      contactPhone: formData.contactPhone.trim(),
      taxCode: formData.taxCode.trim(),
      status: company.status === 'needs_revision' ? 'pending' : company.status,
      adminNote: undefined,
      updatedAt: new Date().toISOString().split('T')[0],
    });
    setSaved(true);
  };

  if (saved) {
    return (
      <div className="min-h-screen pt-[70px] flex items-center justify-center bg-background-100">
        <div className="text-center p-10 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-accent-100 flex items-center justify-center mb-5">
            <i className="ri-check-line text-4xl text-accent-500"></i>
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground-950 mb-3">{t('company.updateSuccess', 'Đã cập nhật!')}</h2>
          <p className="text-sm text-foreground-600 mb-2">{t('company.updated', 'Thông tin công ty')} <strong>{formData.name}</strong> {t('company.wasUpdated', 'đã được cập nhật')}.</p>
          {company.status === 'needs_revision' && (
            <p className="text-xs text-yellow-600 bg-yellow-50 rounded-lg px-4 py-2 mb-6">{t('company.resubmitted', 'Hồ sơ đã được gửi lại để admin xét duyệt.')}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate(`/companies/${company.id}`)} className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
              {t('company.viewProfile', 'Xem hồ sơ')}
            </button>
            <button onClick={() => navigate('/companies/manage')} className="px-6 py-2.5 border border-background-300 text-foreground-700 rounded-full text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">
              {t('company.myCompanies')}
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
            <div className="flex items-center gap-3 mb-1">
              <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full border border-background-200 text-foreground-500 hover:bg-background-50 transition-colors cursor-pointer">
                <i className="ri-arrow-left-line"></i>
              </button>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950">{t('company.edit')}</h1>
            </div>
            <p className="text-sm text-foreground-600 mt-1 ml-12">{t('company.updateInfo', 'Cập nhật thông tin công ty')} <strong>{company.name}</strong></p>
          </div>

          {company.adminNote && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <i className="ri-error-warning-line text-yellow-600"></i>
                </div>
                <div>
                  <p className="text-sm font-semibold text-yellow-800 mb-1">{t('company.revisionRequest', 'Yêu cầu chỉnh sửa từ Admin')}</p>
                  <p className="text-sm text-yellow-700">{company.adminNote}</p>
                  <p className="text-xs text-yellow-600 mt-2">{t('company.revisionInstr', 'Vui lòng cập nhật thông tin theo góp ý trên và gửi lại để được xét duyệt.')}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-base font-heading font-semibold text-foreground-950 mb-4 flex items-center gap-2">
                <i className="ri-information-line text-primary-500"></i> {t('company.basicInfo', 'Thông tin cơ bản')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Tên công ty (Tiếng Việt) *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.name ? 'border-red-400' : 'border-background-200/70'}`}
                    placeholder="VD: Công ty Cổ phần ABC" />
                  {safeErrors.name && <p className="text-xs text-red-500 mt-1">{safeErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Tên công ty (Tiếng Anh)</label>
                  <input type="text" name="nameEn" value={formData.nameEn} onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                    placeholder="VD: ABC Corporation" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Ngành nghề *</label>
                  <CustomSelect
                    value={formData.industry}
                    onChange={(v) => handleSelectChange('industry', v)}
                    options={[
                      { value: '', label: 'Chọn ngành nghề' },
                      ...categories.map((cat) => ({ value: cat, label: cat })),
                    ]}
                    placeholder="Chọn ngành nghề"
                    className={safeErrors.industry ? '[&>button]:border-red-400' : ''}
                  />
                  {safeErrors.industry && <p className="text-xs text-red-500 mt-1">{safeErrors.industry}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Quy mô *</label>
                  <CustomSelect
                    value={formData.size}
                    onChange={(v) => handleSelectChange('size', v)}
                    options={[
                      { value: '', label: 'Chọn quy mô' },
                      ...companySizes.map((s) => ({ value: s, label: `${s} nhân viên` })),
                    ]}
                    placeholder="Chọn quy mô"
                    className={safeErrors.size ? '[&>button]:border-red-400' : ''}
                  />
                  {safeErrors.size && <p className="text-xs text-red-500 mt-1">{safeErrors.size}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Địa điểm (Tỉnh/Thành phố) *</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.location ? 'border-red-400' : 'border-background-200/70'}`}
                    placeholder="VD: Hồ Chí Minh" />
                  {safeErrors.location && <p className="text-xs text-red-500 mt-1">{safeErrors.location}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Địa chỉ trụ sở *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.address ? 'border-red-400' : 'border-background-200/70'}`}
                    placeholder="VD: Tầng 5, Tòa nhà ABC, 123 Đường XYZ, Quận 1, TP. HCM" />
                  {safeErrors.address && <p className="text-xs text-red-500 mt-1">{safeErrors.address}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-heading font-semibold text-foreground-950 mb-4 flex items-center gap-2">
                <i className="ri-contacts-line text-primary-500"></i> Thông tin liên hệ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Email liên hệ *</label>
                  <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.contactEmail ? 'border-red-400' : 'border-background-200/70'}`}
                    placeholder="VD: hr@congty.com" />
                  {safeErrors.contactEmail && <p className="text-xs text-red-500 mt-1">{safeErrors.contactEmail}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Số điện thoại *</label>
                  <input type="text" name="contactPhone" value={formData.contactPhone} onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.contactPhone ? 'border-red-400' : 'border-background-200/70'}`}
                    placeholder="VD: 028 3838 1234" />
                  {safeErrors.contactPhone && <p className="text-xs text-red-500 mt-1">{safeErrors.contactPhone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Website</label>
                  <input type="text" name="website" value={formData.website} onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.website ? 'border-red-400' : 'border-background-200/70'}`}
                    placeholder="VD: https://www.congty.com" />
                  {safeErrors.website && <p className="text-xs text-red-500 mt-1">{safeErrors.website}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">Mã số thuế *</label>
                  <input type="text" name="taxCode" value={formData.taxCode} onChange={handleChange}
                    className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors ${safeErrors.taxCode ? 'border-red-400' : 'border-background-200/70'}`}
                    placeholder="VD: 0101248150" />
                  {safeErrors.taxCode && <p className="text-xs text-red-500 mt-1">{safeErrors.taxCode}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-heading font-semibold text-foreground-950 mb-4 flex items-center gap-2">
                <i className="ri-file-text-line text-primary-500"></i> Mô tả công ty *
              </h3>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={5}
                className={`w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border rounded-lg focus:outline-none focus:border-primary-300 transition-colors resize-none ${safeErrors.description ? 'border-red-400' : 'border-background-200/70'}`}
                placeholder="Mô tả về công ty, lĩnh vực hoạt động, văn hóa, thành tựu..." maxLength={500}></textarea>
              <div className="flex items-center justify-between mt-1">
                {safeErrors.description && <p className="text-xs text-red-500">{safeErrors.description}</p>}
                <p className="text-xs text-foreground-400 ml-auto">{formData.description.length}/500</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button type="submit" className="flex-1 py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
                <i className="ri-save-line mr-1.5"></i> {t('common.save')}
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