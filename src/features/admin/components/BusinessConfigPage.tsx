import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateBusinessConfig, resetBusinessConfig } from '@/store/slices/businessConfigSlice';
import { mockBusinessConfig } from '@/mocks/businessConfig';

type SectionKey = 'basic' | 'brand' | 'footer' | 'social' | 'seo';

const inputClass = 'w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all';
const labelClass = 'block text-sm font-medium text-foreground-700 mb-1.5';

function ImageUploadField({ label, value, onChange, aspectW, aspectH, placeholder }: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspectW?: number;
  aspectH?: number;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState(value);
  const [urlInput, setUrlInput] = useState(value);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        onChange(dataUrl);
        setUrlInput(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    setPreview(url);
    onChange(url);
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {preview ? (
        <div className="relative mb-3">
          <img
            src={preview}
            alt="Preview"
            className={`w-full rounded-xl object-cover border border-background-200/70 ${aspectW && aspectH ? `h-[${Math.round(200 * aspectH / aspectW)}px]` : 'h-44'}`}
            style={aspectW && aspectH ? { aspectRatio: `${aspectW}/${aspectH}` } : undefined}
          />
          <button
            onClick={() => { setPreview(''); setUrlInput(''); onChange(''); }}
            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
          >
            <div className="w-5 h-5 flex items-center justify-center"><i className="ri-close-line text-xs"></i></div>
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-background-200/70 rounded-xl cursor-pointer hover:border-primary-300 hover:bg-background-100 transition-colors mb-2">
          <div className="w-8 h-8 flex items-center justify-center"><i className="ri-image-add-line text-2xl text-foreground-400 mb-1"></i></div>
          <span className="text-sm text-foreground-500">{placeholder || t('adminUi.businessConfig.uploadImage')}</span>
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
      )}
      <input
        type="text"
        value={urlInput}
        onChange={(e) => handleUrlChange(e.target.value)}
        className={inputClass}
        placeholder={t('adminUi.businessConfig.orEnterUrl')}
      />
    </div>
  );
}

export default function BusinessConfigPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const config = useAppSelector((state) => state.businessConfig.config);
  const sectionTabs: { key: SectionKey; label: string; icon: string }[] = [
    { key: 'basic', label: t('adminUi.businessConfig.sections.basic'), icon: 'ri-building-line' },
    { key: 'brand', label: t('adminUi.businessConfig.sections.brand'), icon: 'ri-image-line' },
    { key: 'footer', label: t('adminUi.businessConfig.sections.footer'), icon: 'ri-layout-bottom-line' },
    { key: 'social', label: t('adminUi.businessConfig.sections.social'), icon: 'ri-share-line' },
    { key: 'seo', label: t('adminUi.businessConfig.sections.seo'), icon: 'ri-search-line' },
  ];
  const [activeSection, setActiveSection] = useState<SectionKey>('basic');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ ...config });

  // Determine if there are unsaved changes
  const hasChanges = Object.keys(form).some((key) => {
    const k = key as keyof typeof form;
    return form[k] !== config[k];
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Build a partial object of only changed fields
    const changes: Record<string, string> = {};
    Object.keys(form).forEach((key) => {
      const k = key as keyof typeof form;
      if (form[k] !== config[k]) {
        changes[k] = form[k] as string;
      }
    });
    if (Object.keys(changes).length > 0) {
      dispatch(updateBusinessConfig(changes));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleReset = () => {
    dispatch(resetBusinessConfig());
    setForm({ ...mockBusinessConfig });
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">{t('adminUi.pageTitles.businessConfig')}</h2>
            <p className="text-sm text-foreground-500 mt-1">{t('adminUi.businessConfig.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-xs text-accent-600 bg-accent-50 px-3 py-1.5 rounded-full flex items-center gap-1">
                <div className="w-3.5 h-3.5 flex items-center justify-center"><i className="ri-check-line text-xs"></i></div> {t('adminUi.businessConfig.saved')}
              </span>
            )}
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-foreground-600 border border-background-200/70 rounded-xl hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
            >
              <div className="w-4 h-4 flex items-center justify-center"><i className="ri-refresh-line"></i></div> {t('adminUi.businessConfig.resetDefault')}
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-5 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                hasChanges
                  ? 'bg-accent-500 text-white hover:bg-accent-600 shadow-sm'
                  : 'bg-background-200 text-foreground-400 cursor-not-allowed'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center"><i className="ri-save-line"></i></div>{t('adminUi.jobs.saveChanges')}</button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex items-center gap-1 bg-background-100 rounded-xl p-1 overflow-x-auto">
          {sectionTabs.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeSection === s.key
                  ? 'bg-background-50 text-foreground-950 shadow-sm'
                  : 'text-foreground-500 hover:text-foreground-700'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center"><i className={`${s.icon} text-sm`}></i></div>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8">

        {/* Section: Basic Info */}
        {activeSection === 'basic' && (
          <div>
            <h3 className="text-base font-heading font-semibold text-foreground-950 mb-5 flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center"><i className="ri-building-line text-primary-500"></i></div>
              {t('adminUi.businessConfig.basicTitle')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>{t('adminUi.businessConfig.businessName')}</label>
                <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={inputClass} placeholder="Jobs247" />
              </div>
              <div>
                <label className={labelClass}>{t('adminUi.businessConfig.tagline')}</label>
                <input type="text" value={form.tagline} onChange={(e) => handleChange('tagline', e.target.value)} className={inputClass} placeholder={t('adminUi.businessConfig.taglinePlaceholder')} />
              </div>
              <div>
                <label className={labelClass}>{t('adminUi.businessConfig.businessEmail')}</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400">
                    <div className="w-4 h-4 flex items-center justify-center"><i className="ri-mail-line text-sm"></i></div>
                  </div>
                  <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all" placeholder="info@jobs247.vn" />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('adminUi.businessConfig.businessPhone')}</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400">
                    <div className="w-4 h-4 flex items-center justify-center"><i className="ri-phone-line text-sm"></i></div>
                  </div>
                  <input type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all" placeholder="+84 28 1234 5678" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{t('adminUi.businessConfig.businessAddress')}</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-foreground-400">
                    <div className="w-4 h-4 flex items-center justify-center"><i className="ri-map-pin-line text-sm"></i></div>
                  </div>
                  <input type="text" value={form.address} onChange={(e) => handleChange('address', e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all" placeholder="123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh" />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('adminUi.columns.taxCode')}</label>
                <input type="text" value={form.taxCode} onChange={(e) => handleChange('taxCode', e.target.value)} className={inputClass} placeholder="0312345678" />
              </div>
            </div>
          </div>
        )}

        {/* Section: Brand Assets */}
        {activeSection === 'brand' && (
          <div>
            <h3 className="text-base font-heading font-semibold text-foreground-950 mb-5 flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center"><i className="ri-image-line text-primary-500"></i></div>
              {t('adminUi.businessConfig.brandTitle')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ImageUploadField
                  label={t('adminUi.businessConfig.logoLabel')}
                  value={form.logoUrl}
                  onChange={(v) => handleChange('logoUrl', v)}
                  aspectW={4}
                  aspectH={1}
                  placeholder={t('adminUi.businessConfig.logoUploadHint')}
                />
                <p className="text-[11px] text-foreground-400 mt-1.5">{t('adminUi.businessConfig.logoDisplayHint')}</p>
              </div>
              <div className="hidden md:block" />
              <div>
                <ImageUploadField
                  label={t('adminUi.businessConfig.loginBgLabel')}
                  value={form.loginBgUrl}
                  onChange={(v) => handleChange('loginBgUrl', v)}
                  aspectW={4}
                  aspectH={5}
                  placeholder={t('adminUi.businessConfig.loginBgUploadHint')}
                />
                <p className="text-[11px] text-foreground-400 mt-1.5">{t('adminUi.businessConfig.loginBgDisplayHint')}</p>
              </div>
              <div>
                <ImageUploadField
                  label={t('adminUi.businessConfig.adminLoginBgLabel')}
                  value={form.adminLoginBgUrl}
                  onChange={(v) => handleChange('adminLoginBgUrl', v)}
                  aspectW={4}
                  aspectH={5}
                  placeholder={t('adminUi.businessConfig.adminLoginBgUploadHint')}
                />
                <p className="text-[11px] text-foreground-400 mt-1.5">{t('adminUi.businessConfig.adminLoginBgDisplayHint')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Section: Footer */}
        {activeSection === 'footer' && (
          <div>
            <h3 className="text-base font-heading font-semibold text-foreground-950 mb-5 flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center"><i className="ri-layout-bottom-line text-primary-500"></i></div>
              {t('adminUi.businessConfig.footerTitle')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={labelClass}>{t('adminUi.businessConfig.footerAbout')}</label>
                <textarea
                  value={form.footerAboutDesc}
                  onChange={(e) => handleChange('footerAboutDesc', e.target.value)}
                  className={`${inputClass} h-24 resize-none`}
                  placeholder={t('adminUi.businessConfig.footerAboutPlaceholder')}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>{t('adminUi.businessConfig.copyright')}</label>
                <input type="text" value={form.footerCopyright} onChange={(e) => handleChange('footerCopyright', e.target.value)} className={inputClass} placeholder={t('adminUi.businessConfig.copyrightPlaceholder')} />
              </div>
              <div>
                <label className={labelClass}>{t('adminUi.businessConfig.footerAddress')}</label>
                <input type="text" value={form.footerAddress} onChange={(e) => handleChange('footerAddress', e.target.value)} className={inputClass} placeholder="123 Nguyễn Huệ, Quận 1, TP. HCM" />
              </div>
              <div>
                <label className={labelClass}>{t('adminUi.businessConfig.footerPhone')}</label>
                <input type="text" value={form.footerPhone} onChange={(e) => handleChange('footerPhone', e.target.value)} className={inputClass} placeholder="+84 28 1234 5678" />
              </div>
              <div>
                <label className={labelClass}>{t('adminUi.businessConfig.footerEmail')}</label>
                <input type="text" value={form.footerEmail} onChange={(e) => handleChange('footerEmail', e.target.value)} className={inputClass} placeholder="info@jobs247.vn" />
              </div>
              <div>
                <label className={labelClass}>{t('adminUi.businessConfig.privacyLink')}</label>
                <input type="text" value={form.privacyPolicyUrl} onChange={(e) => handleChange('privacyPolicyUrl', e.target.value)} className={inputClass} placeholder="/privacy-policy hoặc #" />
              </div>
              <div>
                <label className={labelClass}>{t('adminUi.businessConfig.termsLink')}</label>
                <input type="text" value={form.termsOfServiceUrl} onChange={(e) => handleChange('termsOfServiceUrl', e.target.value)} className={inputClass} placeholder="/terms-of-service hoặc #" />
              </div>
            </div>
          </div>
        )}

        {/* Section: Social Links */}
        {activeSection === 'social' && (
          <div>
            <h3 className="text-base font-heading font-semibold text-foreground-950 mb-5 flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center"><i className="ri-share-line text-primary-500"></i></div>
              {t('adminUi.businessConfig.socialTitle')}
            </h3>
            <p className="text-sm text-foreground-500 mb-5">{t('adminUi.businessConfig.socialHint')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>
                  <div className="w-5 h-5 flex items-center justify-center inline mr-1.5"><i className="ri-facebook-fill text-[#1877F2]"></i></div>
                  Facebook
                </label>
                <input type="text" value={form.socialFacebook} onChange={(e) => handleChange('socialFacebook', e.target.value)} className={inputClass} placeholder="https://facebook.com/jobs247" />
              </div>
              <div>
                <label className={labelClass}>
                  <div className="w-5 h-5 flex items-center justify-center inline mr-1.5"><i className="ri-linkedin-fill text-[#0A66C2]"></i></div>
                  LinkedIn
                </label>
                <input type="text" value={form.socialLinkedin} onChange={(e) => handleChange('socialLinkedin', e.target.value)} className={inputClass} placeholder="https://linkedin.com/company/jobs247" />
              </div>
              <div>
                <label className={labelClass}>
                  <div className="w-5 h-5 flex items-center justify-center inline mr-1.5"><i className="ri-twitter-x-fill text-foreground-950"></i></div>
                  X (Twitter)
                </label>
                <input type="text" value={form.socialTwitter} onChange={(e) => handleChange('socialTwitter', e.target.value)} className={inputClass} placeholder="https://twitter.com/jobs247" />
              </div>
              <div>
                <label className={labelClass}>
                  <div className="w-5 h-5 flex items-center justify-center inline mr-1.5"><i className="ri-youtube-fill text-[#FF0000]"></i></div>
                  YouTube
                </label>
                <input type="text" value={form.socialYoutube} onChange={(e) => handleChange('socialYoutube', e.target.value)} className={inputClass} placeholder="https://youtube.com/@jobs247" />
              </div>
            </div>
          </div>
        )}

        {/* Section: SEO & Meta */}
        {activeSection === 'seo' && (
          <div>
            <h3 className="text-base font-heading font-semibold text-foreground-950 mb-5 flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center"><i className="ri-search-line text-primary-500"></i></div>
              {t('adminUi.businessConfig.seoTitle')}
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className={labelClass}>{t('adminUi.businessConfig.metaTitle')}</label>
                <input type="text" value={form.metaTitle} onChange={(e) => handleChange('metaTitle', e.target.value)} className={inputClass} placeholder="Jobs247 - Tìm việc làm nhanh, tuyển dụng hiệu quả" />
                <p className="text-[11px] text-foreground-400 mt-1">{t('adminUi.businessConfig.metaTitleHint')}</p>
              </div>
              <div>
                <label className={labelClass}>{t('adminUi.businessConfig.metaDescription')}</label>
                <textarea
                  value={form.metaDescription}
                  onChange={(e) => handleChange('metaDescription', e.target.value)}
                  className={`${inputClass} h-20 resize-none`}
                  placeholder={t('adminUi.businessConfig.metaDescriptionPlaceholder')}
                />
                <p className="text-[11px] text-foreground-400 mt-1">{t('adminUi.businessConfig.metaDescriptionHint')}</p>
              </div>
              <div>
                <label className={labelClass}>{t('adminUi.businessConfig.metaKeywords')}</label>
                <input type="text" value={form.metaKeywords} onChange={(e) => handleChange('metaKeywords', e.target.value)} className={inputClass} placeholder={t('adminUi.businessConfig.metaKeywordsPlaceholder')} />
                <p className="text-[11px] text-foreground-400 mt-1">{t('adminUi.businessConfig.metaKeywordsHint')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Preview card */}
        <div className="mt-8 p-4 bg-background-100 rounded-xl border border-background-200/70">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 flex items-center justify-center"><i className="ri-eye-line text-sm text-foreground-500"></i></div>
            <span className="text-xs font-semibold text-foreground-500 uppercase tracking-wider">{t('adminUi.businessConfig.quickPreview')}</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo preview" className="h-8 object-contain" />
            ) : (
              <span className="text-sm font-heading font-bold text-foreground-600">{form.name || 'Jobs247'}</span>
            )}
            <span className="text-sm text-foreground-400">{form.tagline}</span>
          </div>
        </div>
      </div>

      {/* Sticky save bar at bottom when there are unsaved changes */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-[260px] bg-background-50 border-t border-background-200/70 px-6 py-3 z-40 flex items-center justify-between shadow-sm">
          <p className="text-sm text-foreground-600">
            <div className="w-4 h-4 flex items-center justify-center inline mr-1"><i className="ri-error-warning-line text-amber-500"></i></div>
            {t('adminUi.businessConfig.unsavedChanges')}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setForm({ ...config }); }}
              className="px-4 py-2 text-sm text-foreground-600 border border-background-200/70 rounded-xl hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t('adminUi.businessConfig.discardChanges')}
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-medium bg-accent-500 text-white rounded-xl hover:bg-accent-600 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
            >
              <div className="w-4 h-4 flex items-center justify-center"><i className="ri-save-line"></i></div>{t('adminUi.jobs.saveChanges')}</button>
          </div>
        </div>
      )}
    </div>
  );
}