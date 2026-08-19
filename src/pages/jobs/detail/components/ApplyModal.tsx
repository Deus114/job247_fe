import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/store/hooks';
import { addApplication } from '@/store/slices/applicationsSlice';

interface ApplyModalProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ApplyModal({ jobId, jobTitle, companyName, companyLogo, isOpen, onClose }: ApplyModalProps) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', coverLetter: '' });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File không được vượt quá 5MB');
        return;
      }
      setCvFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) return;

    dispatch(
      addApplication({
        id: crypto.randomUUID(),
        jobId,
        jobTitle,
        companyName,
        companyLogo,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        coverLetter: formData.coverLetter,
        cvFileName: cvFile ? cvFile.name : '',
        status: 'pending',
        appliedAt: new Date().toISOString(),
      })
    );

    setSubmitted(true);
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-background-50 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer">
          <i className="ri-close-line text-xl text-foreground-600"></i>
        </button>

        {submitted ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto rounded-full bg-accent-100 flex items-center justify-center mb-4">
              <i className="ri-check-line text-3xl text-accent-500"></i>
            </div>
            <h3 className="text-xl font-heading font-bold text-foreground-950 mb-2">Ứng tuyển thành công!</h3>
            <p className="text-sm text-foreground-600 mb-6">Hồ sơ của bạn đã được gửi đến {companyName}. Họ sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
              Đóng
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-heading font-bold text-foreground-950 mb-1">Ứng tuyển</h3>
            <p className="text-sm text-foreground-600 mb-6">{jobTitle} - {companyName}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('contact.name')} *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('contact.email')} *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Số điện thoại</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                  placeholder="0912 345 678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">CV của bạn</label>
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm border border-dashed border-background-300 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-colors cursor-pointer"
                >
                  <i className="ri-upload-cloud-2-line text-lg text-primary-500"></i>
                  <span className="text-foreground-600">
                    {cvFile ? cvFile.name : 'Nhấn để tải lên CV (PDF, DOC, DOCX)'}
                  </span>
                </button>
                {cvFile && (
                  <p className="text-xs text-foreground-400 mt-1">{cvFile.name} ({(cvFile.size / 1024).toFixed(1)} KB)</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Thư giới thiệu</label>
                <textarea
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors resize-none"
                  placeholder="Giới thiệu ngắn về bản thân và lý do bạn phù hợp với vị trí này..."
                  maxLength={500}
                ></textarea>
                <p className="text-xs text-foreground-400 mt-1 text-right">{formData.coverLetter.length}/500</p>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-send-plane-fill mr-2"></i>Nộp hồ sơ ứng tuyển
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}