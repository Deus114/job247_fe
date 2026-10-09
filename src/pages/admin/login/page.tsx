import { useState, useEffect, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAdminAuth } from "@/features/auth";
import {
  adminLoginRequest,
  AdminAuthError,
  ensureAdminSession,
  resolveAdminAuthErrorMessage,
} from "@/api";
import { toast } from "@/lib/toast";
import { useAppSelector } from "@/store/hooks";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

interface FormError {
  message: string;
}

const TEST_ACCOUNTS = [
  {
    userName: "admin",
    password: "admin",
  },
] as const;

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, login: adminLoginUser } = useAdminAuth();
  const adminLoginBgUrl = useAppSelector(
    (state) => state.businessConfig.config.adminLoginBgUrl,
  );
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<FormError | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const fillTestAccount = (acc: (typeof TEST_ACCOUNTS)[number]) => {
    setUserName(acc.userName);
    setPassword(acc.password);
    setError(null);
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    let cancelled = false;
    void ensureAdminSession().then((result) => {
      if (cancelled || !result.ok) return;
      adminLoginUser({ user: result.user });
      navigate("/admin/dashboard", { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [adminLoginUser, navigate]);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!userName.trim() || !password) {
      setError({ message: t("validation.required") });
      return;
    }

    setLoading(true);
    try {
      const result = await adminLoginRequest({
        userName: userName.trim(),
        password,
      });

      adminLoginUser({
        user: result.user,
      });
      toast.success(result.message.trim() || t("adminLogin.welcome"));
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof AdminAuthError) {
        setError({
          message: resolveAdminAuthErrorMessage(err, t),
        });
      } else {
        setError({ message: t("adminLogin.invalidCredentials") });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-50 flex relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-800/90 via-primary-700/85 to-primary-600/80"></div>
        <img
          src={adminLoginBgUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute top-[-8%] right-[-8%] w-[300px] h-[300px] rounded-full bg-primary-500/12 blur-[90px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[280px] h-[280px] rounded-full bg-accent-500/8 blur-[80px]"></div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-12 xl:px-16">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/10 shadow-lg shadow-primary-900/20">
              <i className="ri-shield-check-line text-3xl text-white"></i>
            </div>
            <h1 className="text-3xl xl:text-4xl font-heading font-bold text-white mb-3 leading-tight tracking-tight">
              Jobs<span className="text-primary-200">247</span>
            </h1>
            <p className="text-white/55 text-sm leading-relaxed max-w-[260px]">
              {t("adminLogin.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-10 lg:px-12 xl:px-20 bg-background-50">
        <div className="w-full max-w-[520px]">
          <div className="lg:hidden mb-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-500/20">
              <i className="ri-shield-check-line text-2xl text-white"></i>
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground-950">
              Jobs<span className="text-primary-500">247</span> Admin
            </h1>
            <p className="text-sm text-foreground-500 mt-2">
              {t("adminLogin.subtitle")}
            </p>
          </div>

          <div className="bg-background-50 border border-background-200/70 rounded-2xl p-8 md:p-10 shadow-xl shadow-background-200/20">
            <div className="mb-7">
              <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center mb-5">
                <i className="ri-shield-user-line text-2xl text-primary-600"></i>
              </div>
              <h2 className="text-2xl font-heading font-bold text-foreground-950">
                {t("adminLogin.title")}
              </h2>
              <p className="text-sm text-foreground-500 mt-1.5">
                {t("adminLogin.welcomeDesc")}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 flex items-start gap-2.5">
                <i className="ri-error-warning-line text-base flex-shrink-0 mt-px"></i>
                <p>{error.message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("adminLogin.username")}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-user-line text-base"></i>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                      setError(null);
                    }}
                    required
                    className="w-full pl-11 pr-4 py-3.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all min-h-[48px]"
                    placeholder={t("adminLogin.usernamePlaceholder")}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("adminLogin.password")}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-lock-line text-base"></i>
                    </div>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    required
                    className="w-full pl-11 pr-11 py-3.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all min-h-[48px]"
                    placeholder={t("adminLogin.passwordPlaceholder")}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <i
                      className={
                        showPassword
                          ? "ri-eye-off-line text-base"
                          : "ri-eye-line text-base"
                      }
                    ></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-500/15 mt-1 min-h-[48px]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    <i className="ri-login-box-line"></i>{" "}
                    {t("adminLogin.loginButton")}
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-background-200/70">
              <p className="text-xs text-foreground-500 mb-2.5">
                {t("adminLogin.demoQuickLogin")}
              </p>
              <div className="flex flex-col gap-2">
                {TEST_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.userName}
                    type="button"
                    disabled={loading}
                    onClick={() => fillTestAccount(acc)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 min-h-[44px] rounded-lg border border-background-200/70 hover:bg-background-100 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-foreground-950 truncate">
                        {acc.userName}
                      </p>
                      <p className="text-xs text-foreground-500">
                        {t("adminLogin.password")}: {acc.password}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 bg-primary-100 text-primary-700">
                      {t("adminLogin.demoRole")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <p className="text-center text-xs text-foreground-400 flex items-center justify-center gap-1.5">
              <i className="ri-shield-check-line text-accent-500"></i>
              {t("adminLogin.protectedArea")}
            </p>
            <div className="text-center">
              <a
                href="/"
                className="text-xs text-foreground-500 hover:text-primary-500 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <i className="ri-arrow-left-line text-xs"></i>{" "}
                {t("adminLogin.backToHome")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
