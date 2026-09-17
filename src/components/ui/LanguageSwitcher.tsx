import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { changeAppLanguage } from '@/store/slices/languageSlice';
import type { AppLanguage } from '@/i18n/langStorage';

type LanguageSwitcherProps = {
  /** Compact pill for light headers; ghost for dark panels */
  variant?: 'default' | 'ghost';
  className?: string;
};

export default function LanguageSwitcher({
  variant = 'default',
  className = '',
}: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const lang = useAppSelector((state) => state.language.lang);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (next: AppLanguage) => {
    void dispatch(changeAppLanguage(next));
    setOpen(false);
  };

  const triggerClass =
    variant === 'ghost'
      ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-white/80 hover:text-white hover:bg-white/10 border border-white/15 transition-colors cursor-pointer whitespace-nowrap'
      : 'flex items-center gap-1.5 px-3 py-1.5 border border-background-300 rounded-full text-sm text-foreground-700 hover:border-primary-400 transition-colors cursor-pointer whitespace-nowrap';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen(!open)} className={triggerClass}>
        <i className="ri-global-line text-base"></i>
        <span>{lang === 'vi' ? 'VI' : 'EN'}</span>
        <i className={`ri-arrow-down-s-line text-xs transition-transform ${open ? 'rotate-180' : ''}`}></i>
      </button>
      {open && (
        <div className="absolute top-full mt-2 right-0 bg-background-50 border border-background-200 rounded-lg shadow-lg py-1 min-w-[140px] z-50">
          <button
            type="button"
            onClick={() => handleChange('vi')}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer ${
              lang === 'vi' ? 'text-primary-500 font-medium' : 'text-foreground-700'
            }`}
          >
            {t('settings.vietnamese')}
          </button>
          <button
            type="button"
            onClick={() => handleChange('en')}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer ${
              lang === 'en' ? 'text-primary-500 font-medium' : 'text-foreground-700'
            }`}
          >
            {t('settings.english')}
          </button>
        </div>
      )}
    </div>
  );
}
