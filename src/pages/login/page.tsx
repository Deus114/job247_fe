import { useState, type SubmitEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth';
import { loginRequest, mockDemoAccounts } from '@/api';
import { env } from '@/config/env';
import { useAppSelector } from '@/store/hooks';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login: loginUser } = useAuth();
  const loginBgUrl = useAppSelector((state) => state.businessConfig.config.loginBgUrl);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from || '/';

  const handleLoginSuccess = (user: { id: string; email: string; fullName: string; role: 'user' | 'employer' | 'admin' }) => {
    loginUser(user);
    navigate(from !== '/login' && from !== '/register' ? from : '/');
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (/admin@jobs247\.vn/i.test(email.trim())) {
      setError(t('auth.adminAccountBlocked'));
      return;
    }

    setLoading(true);
    try {
      const user = await loginRequest({ email, password });
      handleLoginSuccess(user);
    } catch {
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (acc: (typeof mockDemoAccounts)[number]) => {
    setLoading(true);
    setError('');
    try {
      const user = await loginRequest({ email: acc.email, password: acc.password });
      handleLoginSuccess(user);
    } catch {
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-[70px] bg-background-100 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-[1000px] bg-background-50 rounded-2xl border border-background-200/70 overflow-hidden flex flex-col lg:flex-row">
        <div className="lg:w-1/2 relative hidden lg:block">
          <img
            src={loginBgUrl}
            alt="Login"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-500/80 to-primary-500/20 flex flex-col justify-end p-10">
            <h2 className="text-3xl font-heading font-bold text-white mb-3">{t('auth.welcomeBack')}</h2>
            <p className="text-white/80 text-sm leading-relaxed">{t('auth.welcomeBackDesc')}</p>
          </div>
        </div>

        <div className="flex-1 p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950">{t('auth.loginTitle')}</h1>
            <p className="text-sm text-foreground-600 mt-2">
              {t('auth.noAccount')} <Link to="/register" className="text-primary-500 hover:underline font-medium cursor-pointer">{t('auth.registerLink')}</Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2">
              <i className="ri-error-warning-line"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('auth.email')}</label>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required className="w-full px-4 py-2.5 pr-10 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 cursor-pointer">
                  <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-background-300 text-primary-500 focus:ring-primary-400 cursor-pointer" />
                <span className="text-xs text-foreground-600">{t('auth.rememberMe')}</span>
              </label>
              <a href="#" className="text-xs text-primary-500 hover:underline cursor-pointer">{t('auth.forgotPassword')}</a>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60">
              {loading ? t('common.loading') : t('auth.loginButton')}
            </button>
          </form>

          {env.useMock && (
            <div className="mt-8 pt-6 border-t border-background-200/70">
              <p className="text-xs text-foreground-500 text-center mb-4">{t('auth.demoQuickLogin')}</p>
              <div className="flex flex-col gap-2">
                {mockDemoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={loading}
                    onClick={() => void quickLogin(acc)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-background-200/70 hover:bg-background-100 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-600">{acc.fullName.charAt(0)}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground-950">{acc.fullName}</p>
                        <p className="text-xs text-foreground-500">{acc.email}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${acc.role === 'employer' ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-700'}`}>
                      {acc.role === 'employer' ? t('auth.roleEmployer') : t('auth.roleUser')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
