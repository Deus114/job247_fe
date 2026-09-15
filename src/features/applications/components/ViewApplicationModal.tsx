import { useTranslation } from 'react-i18next';
import type { Application } from '@/types/application';

interface ViewApplicationModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
}

const statusColor: Record<string, string> = {
  pending: 'bg-secondary-100 text-secondary-700',
  reviewing: 'bg-accent-100 text-accent-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function ViewApplicationModal({ application, isOpen, onClose }: ViewApplicationModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

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

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-background-100 border border-background-200/70 flex items-center justify-center overflow-hidden flex-shrink-0">
            {application.companyLogo ? (
              <img src={application.companyLogo} alt={application.companyName} className="w-10 h-10 object-contain" />
            ) : (
              <i className="ri-building-line text-foreground-400 text-lg"></i>
            )}
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-foreground-950">{application.jobTitle}</h3>
            <p className="text-sm text-foreground-600">{application.companyName}</p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap mb-6 ${statusColor[application.status] || 'bg-background-100 text-foreground-600'}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${application.status === 'pending' ? 'bg-secondary-500' : application.status === 'reviewing' ? 'bg-accent-500' : application.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'}`}
          ></span>
          {t(`applications.statuses.${application.status}`, application.status)}
        </span>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-background-100/70">
              <p className="text-xs text-foreground-500 mb-0.5">{t('applications.viewModal.fullName')}</p>
              <p className="text-sm font-medium text-foreground-900">{application.fullName}</p>
            </div>
            <div className="p-3 rounded-lg bg-background-100/70">
              <p className="text-xs text-foreground-500 mb-0.5">{t('applications.appliedDate')}</p>
              <p className="text-sm font-medium text-foreground-900">
                {new Date(application.appliedAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-background-100/70">
            <p className="text-xs text-foreground-500 mb-0.5">{t('applications.viewModal.email')}</p>
            <p className="text-sm font-medium text-foreground-900">{application.email}</p>
          </div>

          {application.phone && (
            <div className="p-3 rounded-lg bg-background-100/70">
              <p className="text-xs text-foreground-500 mb-0.5">{t('applications.viewModal.phone')}</p>
              <p className="text-sm font-medium text-foreground-900">{application.phone}</p>
            </div>
          )}

          <div className="p-3 rounded-lg bg-background-100/70">
            <p className="text-xs text-foreground-500 mb-0.5">{t('applications.viewModal.cv')}</p>
            {application.cvFileName ? (
              <div className="flex items-center gap-2">
                <i className="ri-file-text-line text-primary-500"></i>
                <span className="text-sm font-medium text-foreground-900">{application.cvFileName}</span>
              </div>
            ) : (
              <p className="text-sm text-foreground-400 italic">{t('applications.noCv', 'Không có CV đính kèm')}</p>
            )}
          </div>

          <div className="p-3 rounded-lg bg-background-100/70">
            <p className="text-xs text-foreground-500 mb-1.5">{t('applications.viewModal.coverLetter')}</p>
            {application.coverLetter ? (
              <p className="text-sm text-foreground-800 leading-relaxed whitespace-pre-wrap">{application.coverLetter}</p>
            ) : (
              <p className="text-sm text-foreground-400 italic">{t('applications.noCoverLetter', 'Không có thư giới thiệu')}</p>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 bg-background-100 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-200/70 transition-colors cursor-pointer whitespace-nowrap"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}