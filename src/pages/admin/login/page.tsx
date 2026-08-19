import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { adminLogin } from '@/store/slices/adminAuthSlice';

const adminCredentials = [
  { id: 'admin-001', email: 'superadmin@jobs247.vn', password: 'Admin@2025', fullName: 'Nguyễn Quản Trị', roleIds: ['role-super-admin'], avatar: 'https://readdy.ai/api/search-image?query=Professional%20headshot%20portrait%20of%20a%20confident%20Vietnamese%20male%20manager%20in%20business%20attire%2C%20neutral%20warm%20background%2C%20soft%20studio%20lighting%2C%20clean%20corporate%20style&width=200&height=200&seq=avatar-admin-001&orientation=squarish', status: 'active' as const, phone: '0901234567', createdAt: '2025-01-10', lastLogin: '2026-08-02' },
];

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.adminAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from || '/admin';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Vui l\u00f2ng nh\u1eadp \u0111\u1ea7y \u0111\u1ee7 email v\u00e0 m\u1eadt kh\u1ea9u');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const found = adminCredentials.find((a) => a.email === email && a.password === password);
      if (found) {
        dispatch(adminLogin({ id: found.id, email: found.email, fullName: found.fullName, roleIds: found.roleIds, password: found.password, status: found.status, phone: found.phone, createdAt: found.createdAt, lastLogin: found.lastLogin }));
        navigate(from, { replace: true });
      } else {
        setError('Email ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng ch\u00ednh x\u00e1c. Vui l\u00f2ng ki\u1ec3m tra l\u1ea1i.');
        setLoading(false);
      }
    }, 600);
  };

  const quickLogin = () => {
    const acc = adminCredentials[0];
    dispatch(adminLogin({ id: acc.id, email: acc.email, fullName: acc.fullName, roleIds: acc.roleIds, password: acc.password, status: acc.status, phone: acc.phone, createdAt: acc.createdAt, lastLogin: acc.lastLogin }));
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background-50 flex">
      {/* Left sidebar - Branding */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] relative overflow-hidden">
        {/* Warm gradient - lighter, matching project palette */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-800/90 via-primary-700/85 to-primary-600/80"></div>

        {/* Background image with warm overlay */}
        <img
          src="https://readdy.ai/api/search-image?query=Abstract%20warm%20geometric%20shapes%20with%20soft%20orange%20amber%20gradient%20lighting%2C%20minimalist%20clean%20design%2C%20subtle%20grid%20pattern%20overlay%2C%20professional%20corporate%20atmosphere%2C%20cream%20and%20peach%20tones&width=800&height=1000&seq=admin-login-bg&orientation=portrait"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
        />

        {/* Subtle floating shapes */}
        <div className="absolute top-[-8%] right-[-8%] w-[300px] h-[300px] rounded-full bg-primary-500/12 blur-[90px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[280px] h-[280px] rounded-full bg-accent-500/8 blur-[80px]"></div>
        <div className="absolute top-[45%] right-[10%] w-[180px] h-[180px] rounded-full bg-white/5 blur-[60px]"></div>

        {/* Very subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, oklch(var(--background-50)) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}></div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-12 xl:px-16">
          {/* Centered branding */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/10 shadow-lg shadow-primary-900/20">
              <i className="ri-shield-check-line text-3xl text-white"></i>
            </div>
            <h1 className="text-3xl xl:text-4xl font-heading font-bold text-white mb-3 leading-tight tracking-tight">
              Jobs<span className="text-primary-200">247</span>
            </h1>
            <p className="text-white/55 text-sm leading-relaxed max-w-[260px]">
              Cổng quản trị hệ thống dành cho quản trị viên
            </p>
          </div>

          {/* Stats at absolute bottom */}
          <div className="absolute bottom-10 left-8 right-8 xl:left-12 xl:right-12">
            <div className="flex items-center justify-center gap-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center border border-white/5">
                  <i className="ri-building-line text-xs text-primary-200"></i>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">8+</p>
                  <p className="text-white/35 text-[10px]">Công ty</p>
                </div>
              </div>
              <div className="w-px h-6 bg-white/10"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center border border-white/5">
                  <i className="ri-briefcase-line text-xs text-accent-200"></i>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">20+</p>
                  <p className="text-white/35 text-[10px]">Tin tuyển dụng</p>
                </div>
              </div>
              <div className="w-px h-6 bg-white/10"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center border border-white/5">
                  <i className="ri-user-line text-xs text-secondary-200"></i>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">200+</p>
                  <p className="text-white/35 text-[10px]">Người dùng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-5 py-10 lg:px-10 xl:px-16 bg-background-50">
        <div className="w-full max-w-[420px]">
          {/* Mobile header */}
          <div className="lg:hidden mb-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-500/20">
              <i className="ri-shield-check-line text-2xl text-white"></i>
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground-950">
              Jobs<span className="text-primary-500">247</span> Admin
            </h1>
            <p className="text-sm text-foreground-500 mt-2">Cổng quản trị hệ thống</p>
          </div>

          {/* Card */}
          <div className="bg-background-50 border border-background-200/70 rounded-2xl p-7 md:p-8 shadow-xl shadow-background-200/20">
            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
                <i className="ri-shield-user-line text-xl text-primary-600"></i>
              </div>
              <h2 className="text-xl font-heading font-bold text-foreground-950">Đăng nhập quản trị</h2>
              <p className="text-sm text-foreground-500 mt-1">Chỉ dành cho quản trị viên hệ thống</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 flex items-start gap-2.5">
                <i className="ri-error-warning-line text-base flex-shrink-0 mt-px"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Email</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-mail-line text-sm"></i>
                    </div>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    required
                    className="w-full pl-10 pr-4 py-3 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    placeholder="admin@jobs247.vn"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-lock-line text-sm"></i>
                    </div>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    required
                    className="w-full pl-10 pr-10 py-3 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className={showPassword ? 'ri-eye-off-line text-sm' : 'ri-eye-line text-sm'}></i>
                    </div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-500/15 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    <i className="ri-login-box-line"></i> Đăng nhập
                  </>
                )}
              </button>
            </form>

            {/* Quick login */}
            <div className="mt-5 pt-5 border-t border-background-200/70">
              <p className="text-[11px] text-foreground-400 text-center mb-3 uppercase tracking-wider font-medium">
                Đăng nhập nhanh
              </p>
              <button
                onClick={quickLogin}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-background-200/70 hover:border-primary-300 hover:bg-primary-50/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-600 transition-colors shadow-md shadow-primary-500/15">
                    <i className="ri-shield-user-line text-sm text-white"></i>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground-950">Admin Jobs247</p>
                    <p className="text-xs text-foreground-500">admin@jobs247.vn</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-background-100 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                  <i className="ri-arrow-right-line text-sm text-foreground-400 group-hover:text-primary-500 transition-colors"></i>
                </div>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 space-y-3">
            <p className="text-center text-xs text-foreground-400 flex items-center justify-center gap-1.5">
              <i className="ri-shield-check-line text-accent-500"></i>
              Khu vực quản trị được bảo vệ · Truy cập trái phép bị nghiêm cấm
            </p>
            <div className="text-center">
              <a href="/" className="text-xs text-foreground-500 hover:text-primary-500 transition-colors inline-flex items-center gap-1 cursor-pointer">
                <i className="ri-arrow-left-line text-xs"></i> Quay lại trang chủ
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}