import {
  resolveAdminAuthErrorMessage,
  type AdminAuthError,
} from "@/api/adminAuth";
import { useApplications } from "@/features/applications";
import { useAuth } from "@/features/auth";
import { toast } from "@/lib/toast";
import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { useTranslation } from "react-i18next";

interface ApplyModalProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  /** Rich-text candidate questions from the job (shown below cover letter). */
  applicantQuestion?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function hasVisibleHtml(html: string | undefined): boolean {
  if (!html?.trim()) return false;
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length > 0;
}

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export default function ApplyModal({
  jobId,
  jobTitle,
  companyName,
  applicantQuestion,
  isOpen,
  onClose,
  onSuccess,
}: ApplyModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { applyToJob } = useApplications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    coverLetter: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const showQuestion = hasVisibleHtml(applicantQuestion);

  useEffect(() => {
    if (!isOpen) return;
    setSubmitted(false);
    setSubmitting(false);
    setCvFile(null);
    setFormData({
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: "",
      coverLetter: "",
    });
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("job.applyModal.fileTooLarge"));
        return;
      }
      setCvFile(file);
    }
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) return;
    if (!cvFile) {
      toast.error(t("job.applyModal.cvRequired"));
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      await applyToJob(jobId, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        coverLetter: formData.coverLetter,
        cvFile,
      });
      setSubmitted(true);
      onSuccess?.();
    } catch (error) {
      toast.error(
        resolveAdminAuthErrorMessage(error as AdminAuthError, t),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-background-50 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px]"
        >
          <i className="ri-close-line text-xl text-foreground-600"></i>
        </button>

        {submitted ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto rounded-full bg-accent-100 flex items-center justify-center mb-4">
              <i className="ri-check-line text-3xl text-accent-500"></i>
            </div>
            <h3 className="text-xl font-heading font-bold text-foreground-950 mb-2">
              {t("job.applySuccess")}
            </h3>
            <p className="text-sm text-foreground-600 mb-6">
              {t("job.applyModal.successDesc", { company: companyName })}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
            >
              {t("common.close")}
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-heading font-bold text-foreground-950 mb-1">
              {t("job.applyModal.title")}
            </h3>
            <p className="text-sm text-foreground-600 mb-6">
              {jobTitle} - {companyName}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("job.applyModal.fullName")} *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("job.applyModal.email")} *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("job.applyModal.phone")}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                  placeholder="0912 345 678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("job.applyModal.cv")} *
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm border border-dashed border-background-300 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-colors cursor-pointer min-h-[44px]"
                >
                  <i className="ri-upload-cloud-2-line text-lg text-primary-500"></i>
                  <span className="text-foreground-600">
                    {cvFile ? cvFile.name : t("job.applyModal.uploadHint")}
                  </span>
                </button>
                {cvFile && (
                  <p className="text-xs text-foreground-400 mt-1">
                    {cvFile.name} ({(cvFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("job.applyModal.coverLetter")}
                </label>
                <textarea
                  value={formData.coverLetter}
                  onChange={(e) =>
                    setFormData({ ...formData, coverLetter: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors resize-none"
                  placeholder={t("job.applyModal.coverLetterPlaceholder")}
                  maxLength={500}
                ></textarea>
                <p className="text-xs text-foreground-400 mt-1 text-right">
                  {formData.coverLetter.length}/500
                </p>
              </div>

              {showQuestion && applicantQuestion ? (
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("job.applyModal.applicantQuestion")}
                  </label>
                  <div className="px-4 py-3 text-sm text-foreground-800 bg-background-100/70 border border-background-200/70 rounded-lg leading-relaxed">
                    {looksLikeHtml(applicantQuestion) ? (
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: applicantQuestion }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{applicantQuestion}</p>
                    )}
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 min-h-[44px]"
              >
                <i
                  className={`${submitting ? "ri-loader-4-line animate-spin" : "ri-send-plane-fill"} mr-2`}
                ></i>
                {submitting
                  ? t("job.applyModal.submitting")
                  : t("job.applyModal.submit")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
