import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="relative mb-8">
          <p className="text-[7rem] md:text-[9rem] font-heading font-black leading-none text-background-100 select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center">
              <i className="ri-file-unknow-line text-3xl text-primary-600"></i>
            </div>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950 mb-2">
          {t('notFound.title')}
        </h1>
        <p className="text-sm md:text-base text-foreground-500 mb-2">
          {t('notFound.description')}
        </p>
        <p className="text-xs font-mono text-foreground-400 mb-8 break-all">
          {location.pathname}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            <i className="ri-home-line"></i>
            {t('notFound.backHome')}
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-background-200 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-line"></i>
            {t('common.back')}
          </button>
        </div>
      </div>
    </div>
  );
}
