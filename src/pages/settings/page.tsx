import { useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleTheme } from '@/store/slices/themeSlice';
import { changeAppLanguage } from '@/store/slices/languageSlice';
import { useAuth } from '@/features/auth';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '@/hooks/useNotification';

export default function SettingsPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const mode = useAppSelector((state) => state.theme.mode);
  const lang = useAppSelector((state) => state.language.lang);
  const { user, updateProfile, logout: logoutUser } = useAuth();
  const { isSupported, isSubscribed, requestPermission, sendTestNotification } = useNotification();

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
  });
  const [saved, setSaved] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [notiTestSent, setNotiTestSent] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'appearance' | 'notifications'>('profile');

  const handleProfileSave = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateProfile({ fullName: profileForm.fullName });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordChange = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordMsg(t('settings.validation.passwordMismatch'));
      return;
    }
    if (passwordForm.newPass.length < 6) {
      setPasswordMsg(t('settings.validation.passwordTooShort'));
      return;
    }
    setPasswordMsg('success');
    setPasswordForm({ current: '', newPass: '', confirm: '' });
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  const handleLanguageChange = (l: 'vi' | 'en') => {
    void dispatch(changeAppLanguage(l));
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  const handleTestNotification = async () => {
    const ok = await sendTestNotification('Jobs247', t('settings.testBody'));
    if (ok) {
      setNotiTestSent(true);
      setTimeout(() => setNotiTestSent(false), 3000);
    }
  };

  const sections = [
    { key: 'profile' as const, label: t('settings.profile'), icon: 'ri-user-line' },
    { key: 'password' as const, label: t('settings.changePassword'), icon: 'ri-lock-line' },
    { key: 'appearance' as const, label: t('settings.appearanceAndLanguage'), icon: 'ri-palette-line' },
    { key: 'notifications' as const, label: t('settings.notifications'), icon: 'ri-notification-3-line' },
  ];

  return (
    <div className="min-h-screen pt-[70px] bg-background-100">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950 mb-8">{t('settings.title')}</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-[240px] flex-shrink-0">
            <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
              {sections.map((sec) => (
                <button
                  key={sec.key}
                  onClick={() => setActiveSection(sec.key)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    activeSection === sec.key
                      ? 'bg-primary-50 text-primary-600 border-l-2 border-primary-500'
                      : 'text-foreground-600 hover:bg-background-100 border-l-2 border-transparent'
                  }`}
                >
                  <i className={`${sec.icon} text-base`}></i> {sec.label}
                </button>
              ))}
              <hr className="border-background-200/70" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-logout-box-line text-base"></i> {t('nav.logout')}
              </button>
            </div>
          </div>

          <div className="flex-1">
            {activeSection === 'profile' && (
              <div className="bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8">
                <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-6">{t('settings.profile')}</h3>
                {saved && (
                  <div className="mb-6 p-3 rounded-lg bg-accent-50 border border-accent-200 text-sm text-accent-600 flex items-center gap-2">
                    <i className="ri-check-line"></i> {t('settings.savedChanges')}
                  </div>
                )}
                <form onSubmit={handleProfileSave} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('auth.fullName')}</label>
                    <input type="text" value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('auth.email')}</label>
                    <input type="email" value={profileForm.email} disabled
                      className="w-full px-4 py-2.5 text-sm text-foreground-500 bg-background-100 border border-background-200/70 rounded-lg cursor-not-allowed" />
                    <p className="text-xs text-foreground-400 mt-1">{t('settings.emailCannotChange')}</p>
                  </div>
                  <button type="submit" className="px-8 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
                    {t('settings.save')}
                  </button>
                </form>
              </div>
            )}

            {activeSection === 'password' && (
              <div className="bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8">
                <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-6">{t('settings.changePassword')}</h3>
                {passwordMsg === 'success' && (
                  <div className="mb-6 p-3 rounded-lg bg-accent-50 border border-accent-200 text-sm text-accent-600 flex items-center gap-2">
                    <i className="ri-check-line"></i> {t('settings.password.updateSuccess')}
                  </div>
                )}
                {passwordMsg && passwordMsg !== 'success' && (
                  <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{passwordMsg}</div>
                )}
                <form onSubmit={handlePasswordChange} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('settings.password.currentPassword')}</label>
                    <input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      required className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('settings.password.newPassword')}</label>
                    <input type="password" value={passwordForm.newPass} onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                      required className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('settings.password.confirmNewPassword')}</label>
                    <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      required className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors" />
                  </div>
                  <button type="submit" className="px-8 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
                    {t('settings.save')}
                  </button>
                </form>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <div className="bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8">
                  <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-6">{t('settings.theme')}</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => { if (mode === 'dark') dispatch(toggleTheme()); }}
                      className={`flex-1 p-5 rounded-xl border-2 transition-all cursor-pointer ${mode === 'light' ? 'border-primary-500 bg-primary-50' : 'border-background-200/70 hover:bg-background-100'}`}
                    >
                      <div className="w-full h-24 rounded-lg bg-white border border-background-200 mb-3 flex items-end p-2">
                        <div className="w-full h-4 bg-background-200 rounded"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="ri-sun-line text-primary-500"></i>
                        <span className="text-sm font-medium text-foreground-950">{t('settings.light')}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => { if (mode === 'light') dispatch(toggleTheme()); }}
                      className={`flex-1 p-5 rounded-xl border-2 transition-all cursor-pointer ${mode === 'dark' ? 'border-primary-500 bg-primary-50' : 'border-background-200/70 hover:bg-background-100'}`}
                    >
                      <div className="w-full h-24 rounded-lg bg-background-800 border border-background-700 mb-3 flex items-end p-2">
                        <div className="w-full h-4 bg-background-600 rounded"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="ri-moon-line text-primary-500"></i>
                        <span className="text-sm font-medium text-foreground-950">{t('settings.dark')}</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8">
                  <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-6">{t('settings.language')}</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => handleLanguageChange('vi')}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all cursor-pointer ${lang === 'vi' ? 'border-primary-500 bg-primary-50' : 'border-background-200/70 hover:bg-background-100'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🇻🇳</span>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground-950">{t('settings.vietnamese')}</p>
                          <p className="text-xs text-foreground-500">Tiếng Việt</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all cursor-pointer ${lang === 'en' ? 'border-accent-500 bg-accent-50' : 'border-background-200/70 hover:bg-background-100'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🇬🇧</span>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground-950">{t('settings.english')}</p>
                          <p className="text-xs text-foreground-500">English</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8">
                <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-6">{t('settings.notificationSettings')}</h3>

                {!isSupported ? (
                  <div className="p-5 rounded-xl bg-background-100 border border-background-200/70 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-background-200/50 flex items-center justify-center mb-3">
                      <i className="ri-notification-off-line text-2xl text-foreground-400"></i>
                    </div>
                    <p className="text-sm text-foreground-600 mb-1">{t('settings.notSupported')}</p>
                    <p className="text-xs text-foreground-400">{t('settings.notSupportedDesc')}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl bg-background-100 border border-background-200/70">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <i className="ri-notification-3-line text-lg text-primary-600"></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground-950">{t('settings.pushNotifications')}</p>
                          <p className="text-xs text-foreground-500 mt-0.5">{t('settings.pushDesc')}</p>
                        </div>
                      </div>
                      {isSubscribed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-100 text-accent-700 text-xs font-medium rounded-full whitespace-nowrap">
                          <i className="ri-check-line"></i> {t('settings.enabled')}
                        </span>
                      ) : (
                        <button
                          onClick={handleEnableNotifications}
                          className="px-4 py-2 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-xs font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {t('settings.enableNotifications')}
                        </button>
                      )}
                    </div>

                    {isSubscribed && (
                      <>
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-foreground-700">{t('settings.notificationTypes')}</p>
                          <label className="flex items-center justify-between p-4 rounded-xl bg-background-100 border border-background-200/70 cursor-pointer">
                            <div>
                              <p className="text-sm text-foreground-950">{t('settings.matchingJobs')}</p>
                              <p className="text-xs text-foreground-500 mt-0.5">{t('settings.matchingJobsDesc')}</p>
                            </div>
                            <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-background-300 text-primary-500 focus:ring-primary-400 cursor-pointer" />
                          </label>
                          <label className="flex items-center justify-between p-4 rounded-xl bg-background-100 border border-background-200/70 cursor-pointer">
                            <div>
                              <p className="text-sm text-foreground-950">{t('settings.employerUpdates')}</p>
                              <p className="text-xs text-foreground-500 mt-0.5">{t('settings.employerUpdatesDesc')}</p>
                            </div>
                            <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-background-300 text-primary-500 focus:ring-primary-400 cursor-pointer" />
                          </label>
                          <label className="flex items-center justify-between p-4 rounded-xl bg-background-100 border border-background-200/70 cursor-pointer">
                            <div>
                              <p className="text-sm text-foreground-950">{t('settings.careerNews')}</p>
                              <p className="text-xs text-foreground-500 mt-0.5">{t('settings.careerNewsDesc')}</p>
                            </div>
                            <input type="checkbox" className="w-5 h-5 rounded border-background-300 text-primary-500 focus:ring-primary-400 cursor-pointer" />
                          </label>
                        </div>

                        <div className="pt-4 border-t border-background-200/70">
                          {notiTestSent ? (
                            <div className="p-3 rounded-lg bg-accent-50 border border-accent-200 text-sm text-accent-600 flex items-center gap-2">
                              <i className="ri-check-line"></i> {t('settings.testSent')}
                            </div>
                          ) : (
                            <button
                              onClick={handleTestNotification}
                              className="flex items-center gap-2 px-5 py-2.5 border border-background-200/70 text-sm text-foreground-600 rounded-xl hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <i className="ri-send-plane-line"></i> {t('settings.sendTest')}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
