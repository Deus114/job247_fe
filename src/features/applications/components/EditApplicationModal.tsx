import { useState, useRef, useEffect, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useApplications } from '@/features/applications';
import type { Application } from '@/types/application';

interface EditApplicationModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditApplicationModal({ application, isOpen, onClose }: EditApplicationModalProps) {
  const { t } = useTranslation();
  const { updateApplication } = useApplications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverLetter: '',
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: application.fullName,
        email: application.email,
        phone: application.phone,
        coverLetter: application.coverLetter,
      });
      setCvFile(null);
      setSubmitted(false);
    }
  }, [isOpen, application]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(t('job.applyModal.fileTooLarge'));
        return;
      }
      setCvFile(file);
    }
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) return;

    updateApplication({
      ...application,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      coverLetter: formData.coverLetter,
      cvFileName: cvFile ? cvFile.name : application.cvFileName,
    });

    setSubmitted(true);
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const displayCvName = cvFile ? cvFile.name : application.cvFileName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-background-50 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer"
        >
          <i className="ri-close-line text-xl text-foreground-600"></i>
        </button>

        {submitted ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto rounded-full bg-accent-100 flex items-center justify-center mb-4">
              <i className="ri-check-line text-3xl text-accent-500"></i>
            </div>
            <h3 className="text-xl font-heading font-bold text-foreground-950 mb-2">
              {t('applications.editModal.updateSuccess')}
            </h3>
            <p className="text-sm text-foreground-600 mb-6">
              {t('applications.editModal.updateSuccessDesc')}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-heading font-bold text-foreground-950 mb-1">
              {t('applications.editModal.title')}
            </h3>
            <p className="text-sm text-foreground-600 mb-6">
              {application.jobTitle} - {application.companyName}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t('applications.viewModal.fullName')} *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t('applications.viewModal.email')} *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t('applications.viewModal.phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t('applications.viewModal.cv')}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm border border-dashed border-background-300 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-colors cursor-pointer"
                >
                  <span className="text-foreground-600">
                    {displayCvName || t('applications.editModal.uploadHint')}
                  </span>
                  <i className="ri-upload-cloud-2-line text-lg text-primary-500"></i>
                </button>
                {cvFile && (
                  <p className="text-xs text-foreground-400 mt-1">
                    {t('applications.editModal.newFile')}: {cvFile.name} (
                    {(cvFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t('applications.viewModal.coverLetter')}
                </label>
                <textarea
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors resize-none"
                  maxLength={500}
                ></textarea>
                <p className="text-xs text-foreground-400 mt-1 text-right">
                  {formData.coverLetter.length}/500
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-background-100 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-200/70 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-save-line mr-1.5"></i>
                  {t('settings.save')}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
