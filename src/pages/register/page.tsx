import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'user' | 'employer',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    dispatch(login({
      id: Date.now().toString(),
      email: formData.email,
      fullName: formData.fullName,
      role: formData.role,
    }));
    navigate('/');
  };

  return (
    <div className="min-h-screen pt-[70px] bg-background-100 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-[1000px] bg-background-50 rounded-2xl border border-background-200/70 overflow-hidden flex flex-col lg:flex-row">
        <div className="flex-1 p-8 md:p-12 order-2 lg:order-1">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950">{t('auth.registerTitle')}</h1>
            <p className="text-sm text-foreground-600 mt-2">
              {t('auth.hasAccount')} <Link to="/login" className="text-primary-500 hover:underline font-medium cursor-pointer">{t('auth.loginLink')}</Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2">
              <i className="ri-error-warning-line"></i> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('auth.fullName')} *</label>
              <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('auth.email')} *</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                placeholder="email@example.com" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('auth.password')} *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required className="w-full px-4 py-2.5 pr-10 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 cursor-pointer">
                    <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('auth.confirmPassword')} *</label>
                <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required className="w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors"
                  placeholder="••••••••" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">{t('auth.youAre')}</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${formData.role === 'user' ? 'border-primary-300 bg-primary-50' : 'border-background-200/70 hover:bg-background-100'}`}>
                  <input type="radio" name="role" value="user" checked={formData.role === 'user'} onChange={() => setFormData({ ...formData, role: 'user' })} className="sr-only" />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.role === 'user' ? 'border-primary-500' : 'border-background-300'}`}>
                    {formData.role === 'user' && <div className="w-2.5 h-2.5 rounded-full bg-primary-500"></div>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground-950">{t('auth.jobSeeker')}</p>
                    <p className="text-xs text-foreground-500">{t('auth.jobSeekerDesc')}</p>
                  </div>
                </label>
                <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${formData.role === 'employer' ? 'border-accent-300 bg-accent-50' : 'border-background-200/70 hover:bg-background-100'}`}>
                  <input type="radio" name="role" value="employer" checked={formData.role === 'employer'} onChange={() => setFormData({ ...formData, role: 'employer' })} className="sr-only" />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.role === 'employer' ? 'border-accent-500' : 'border-background-300'}`}>
                    {formData.role === 'employer' && <div className="w-2.5 h-2.5 rounded-full bg-accent-500"></div>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground-950">{t('auth.employer')}</p>
                    <p className="text-xs text-foreground-500">{t('auth.employerDesc')}</p>
                  </div>
                </label>
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" required className="w-4 h-4 mt-0.5 rounded border-background-300 text-primary-500 focus:ring-primary-400 cursor-pointer" />
              <span className="text-xs text-foreground-600">{t('auth.agreeTermsPrefix')} <a href="#" className="text-primary-500 hover:underline">{t('auth.terms')}</a> {t('common.and')} <a href="#" className="text-primary-500 hover:underline">{t('auth.privacy')}</a></span>
            </label>

            <button type="submit" className="w-full py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
              {t('auth.registerButton')}
            </button>
          </form>
        </div>

        <div className="lg:w-1/2 relative hidden lg:block order-1 lg:order-2">
          <img
            src="https://readdy.ai/api/search-image?query=Modern%20collaborative%20office%20environment%20with%20diverse%20professional%20team%20working%20together%2C%20warm%20natural%20lighting%2C%20green%20plants%2C%20creative%20workspace%20with%20sticky%20notes%2C%20glass%20walls%2C%20soft%20beige%20and%20warm%20tones%2C%20editorial%20photography&width=800&height=900&seq=auth-register-bg&orientation=portrait"
            alt="Register"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-accent-500/80 to-accent-500/20 flex flex-col justify-end p-10">
            <h2 className="text-3xl font-heading font-bold text-white mb-3">{t('auth.welcomeRegister')}</h2>
            <p className="text-white/80 text-sm leading-relaxed">{t('auth.welcomeRegisterDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}