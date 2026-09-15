import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleTheme } from '@/store/slices/themeSlice';
import { changeAppLanguage } from '@/store/slices/languageSlice';
import { useAuth } from '@/features/auth';

export default function Navbar() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const mode = useAppSelector((state) => state.theme.mode);
  const lang = useAppSelector((state) => state.language.lang);
  const { isAuthenticated, user, logout: logoutUser } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleLangChange = (l: 'vi' | 'en') => {
    void dispatch(changeAppLanguage(l));
    setLangOpen(false);
  };

  const handleLogout = () => {
    logoutUser();
    setUserMenuOpen(false);
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/jobs', label: t('nav.jobs') },
    { to: '/companies', label: t('nav.companies') },
    { to: '/post-job', label: t('nav.postJob') },
    { to: '/contact', label: t('nav.contact') },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background-50/95 backdrop-blur-md border-b border-background-200/70'
          : 'bg-transparent'
      }`}
    >
      <div className="w-full px-4 lg:px-8">
        <div className="flex items-center justify-between h-[70px]">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
              <i className="ri-briefcase-line text-background-50 text-lg"></i>
            </div>
            <span className="font-heading text-xl font-bold text-foreground-950 whitespace-nowrap">
              Jobs<span className="text-primary-500">247</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-foreground-700 hover:text-primary-500 transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 px-3 py-1.5 border border-background-300 rounded-full text-sm text-foreground-700 hover:border-primary-400 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-global-line text-base"></i>
                <span className="hidden xl:inline">{t(lang === 'vi' ? 'settings.vietnamese' : 'settings.english')}</span>
                <span className="xl:hidden">{lang === 'vi' ? 'VI' : 'EN'}</span>
                <i className={`ri-arrow-down-s-line text-xs transition-transform ${langOpen ? 'rotate-180' : ''}`}></i>
              </button>
              {langOpen && (
                <div className="absolute top-full mt-2 right-0 bg-background-50 border border-background-200 rounded-lg shadow-lg py-1 min-w-[140px] z-50">
                  <button
                    onClick={() => handleLangChange('vi')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer ${lang === 'vi' ? 'text-primary-500 font-medium' : 'text-foreground-700'}`}
                  >
                    🇻🇳 {t('settings.vietnamese')}
                  </button>
                  <button
                    onClick={() => handleLangChange('en')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer ${lang === 'en' ? 'text-primary-500 font-medium' : 'text-foreground-700'}`}
                  >
                    🇬🇧 {t('settings.english')}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleThemeToggle}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-background-300 text-foreground-600 hover:text-primary-500 hover:border-primary-400 transition-colors cursor-pointer"
              title={mode === 'light' ? t('settings.dark') : t('settings.light')}
            >
              <i className={`text-lg ${mode === 'light' ? 'ri-moon-line' : 'ri-sun-line'}`}></i>
            </button>

            {isAuthenticated ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background-100 hover:bg-background-200 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-background-50">
                      {user?.fullName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-sm text-foreground-700 whitespace-nowrap max-w-[100px] truncate hidden xl:inline">{user?.fullName}</span>
                  <i className={`ri-arrow-down-s-line text-xs text-foreground-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}></i>
                </button>
                {userMenuOpen && (
                  <div className="absolute top-full mt-2 right-0 bg-background-50 border border-background-200 rounded-lg shadow-lg py-1 min-w-[200px] z-50">
                    <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer">
                      <i className="ri-settings-3-line"></i> {t('nav.settings')}
                    </Link>
                    {user?.role !== 'employer' && (
                      <>
                        <Link to="/saved-jobs" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer">
                          <i className="ri-bookmark-line"></i> {t('nav.savedJobs')}
                        </Link>
                        <Link to="/my-applications" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer">
                          <i className="ri-send-plane-line"></i> {t('nav.myApplications')}
                        </Link>
                      </>
                    )}
                    {user?.role === 'employer' && (
                      <>
                        <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer">
                          <i className="ri-dashboard-line"></i> {t('nav.dashboard')}
                        </Link>
                        <Link to="/companies/manage" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer">
                          <i className="ri-building-line"></i> {t('nav.myCompanies')}
                        </Link>
                      </>
                    )}
                    <hr className="my-1 border-background-200" />
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors whitespace-nowrap cursor-pointer">
                      <i className="ri-logout-box-line"></i> {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-foreground-700 hover:text-primary-500 transition-colors whitespace-nowrap px-2">{t('nav.login')}</Link>
                <Link to="/register" className="text-sm font-medium px-4 py-2 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer">{t('nav.register')}</Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-background-300 text-foreground-700 hover:bg-background-100/50 transition-colors cursor-pointer"
          >
            <i className={`text-xl ${mobileOpen ? 'ri-close-line' : 'ri-menu-line'}`}></i>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-background-50 border-t border-background-200 px-4 py-4 flex flex-col gap-2 max-h-[calc(100vh-70px)] overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-foreground-700 hover:text-primary-500 transition-colors py-2.5 px-2 rounded-lg hover:bg-background-100"
            >
              {link.label}
            </Link>
          ))}
          <hr className="border-background-200 my-1" />
          <div className="flex items-center justify-between py-2 px-2">
            <span className="text-sm text-foreground-600">{t('settings.theme')}</span>
            <button onClick={handleThemeToggle} className="w-9 h-9 flex items-center justify-center rounded-full border border-background-300 text-foreground-600 cursor-pointer">
              <i className={`text-lg ${mode === 'light' ? 'ri-moon-line' : 'ri-sun-line'}`}></i>
            </button>
          </div>
          <div className="flex items-center justify-between py-2 px-2">
            <span className="text-sm text-foreground-600">{t('settings.language')}</span>
            <div className="flex gap-1">
              <button onClick={() => handleLangChange('vi')} className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${lang === 'vi' ? 'bg-primary-500 text-background-50 dark:text-foreground-950' : 'bg-background-100 text-foreground-600'}`}>VI</button>
              <button onClick={() => handleLangChange('en')} className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${lang === 'en' ? 'bg-primary-500 text-background-50 dark:text-foreground-950' : 'bg-background-100 text-foreground-600'}`}>EN</button>
            </div>
          </div>
          {!isAuthenticated ? (
            <div className="flex gap-3 pt-2 px-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm font-medium px-4 py-2.5 border border-background-300 text-foreground-700 rounded-full hover:bg-background-100 transition-colors cursor-pointer">{t('nav.login')}</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm font-medium px-4 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full hover:bg-primary-600 transition-colors cursor-pointer">{t('nav.register')}</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2 px-2">
              <Link to="/settings" onClick={() => setMobileOpen(false)} className="text-center text-sm font-medium px-4 py-2.5 border border-background-300 text-foreground-700 rounded-full hover:bg-background-100 transition-colors cursor-pointer">{t('nav.settings')}</Link>
              {user?.role !== 'employer' && (
                <>
                  <Link to="/saved-jobs" onClick={() => setMobileOpen(false)} className="text-center text-sm font-medium px-4 py-2.5 border border-background-300 text-foreground-700 rounded-full hover:bg-background-100 transition-colors cursor-pointer">{t('nav.savedJobs')}</Link>
                  <Link to="/my-applications" onClick={() => setMobileOpen(false)} className="text-center text-sm font-medium px-4 py-2.5 border border-background-300 text-foreground-700 rounded-full hover:bg-background-100 transition-colors cursor-pointer">{t('nav.myApplications')}</Link>
                </>
              )}
              {user?.role === 'employer' && (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-center text-sm font-medium px-4 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full hover:bg-primary-600 transition-colors cursor-pointer">{t('nav.dashboard')}</Link>
                  <Link to="/companies/manage" onClick={() => setMobileOpen(false)} className="text-center text-sm font-medium px-4 py-2.5 border border-background-300 text-foreground-700 rounded-full hover:bg-background-100 transition-colors cursor-pointer">{t('nav.myCompanies')}</Link>
                </>
              )}
              <button onClick={handleLogout} className="text-sm font-medium px-4 py-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap">{t('nav.logout')}</button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}