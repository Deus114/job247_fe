import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  registerRequest,
  sendOtpRequest,
  verifyOtpRequest,
  AdminAuthError,
  resolveAdminAuthErrorMessage,
} from "@/api";
import type { PublicAccountType } from "@/types";
import { env } from "@/config/env";
import { isStrongPassword } from "@/lib/password";
import { useAppSelector } from "@/store/hooks";

type Step = "account" | "otp" | "profile";

const OTP_LENGTH = 6;

function formatCooldown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const registerBgUrl = useAppSelector(
    (state) => state.businessConfig.config.registerBgUrl,
  );

  const [step, setStep] = useState<Step>("account");
  const [accountType, setAccountType] =
    useState<PublicAccountType>("JOB_SEEKER");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const [verificationToken, setVerificationToken] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(
      () => setCooldown((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const errorText = (err: unknown, fallbackKey: string) =>
    err instanceof AdminAuthError
      ? resolveAdminAuthErrorMessage(err, t)
      : t(fallbackKey);

  const startCooldown = () => setCooldown(env.otpResendCooldown);

  const sendCode = async () => {
    setError("");
    setLoading(true);
    try {
      await sendOtpRequest(email);
      setDigits(Array.from({ length: OTP_LENGTH }, () => ""));
      setVerificationToken("");
      startCooldown();
      setStep("otp");
    } catch (err) {
      setError(errorText(err, "apiErrors.otpSendFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendCode();
  };

  const handleVerify = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = digits.join("");
    if (code.length !== OTP_LENGTH) {
      setError(t("auth.otpHint"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const token = await verifyOtpRequest(email, code);
      setVerificationToken(token);
      setStep("profile");
    } catch (err) {
      setError(errorText(err, "apiErrors.otpVerifyFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(t("validation.passwordMismatch"));
      return;
    }
    if (!isStrongPassword(password)) {
      setError(t("validation.passwordStrong"));
      return;
    }
    if (!acceptTerms || !verificationToken) return;

    setLoading(true);
    try {
      await registerRequest({
        name,
        password,
        confirmPassword,
        type: accountType,
        verificationToken,
        acceptTerms: true,
      });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(errorText(err, "apiErrors.registerFailed"));
    } finally {
      setLoading(false);
    }
  };

  const updateDigit = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
    if (char && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const onOtpKeyDown = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const onOtpPaste = (text: string) => {
    const chars = text.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
    if (chars.length === 0) return;
    setDigits(
      Array.from({ length: OTP_LENGTH }, (_, index) => chars[index] ?? ""),
    );
    otpRefs.current[Math.min(chars.length, OTP_LENGTH) - 1]?.focus();
  };

  const steps: { id: Step; label: string }[] = [
    { id: "account", label: t("auth.stepRole") },
    { id: "otp", label: t("auth.stepOtp") },
    { id: "profile", label: t("auth.stepInfo") },
  ];
  const stepIndex = steps.findIndex((item) => item.id === step);
  const inputClass =
    "w-full px-4 py-2.5 text-sm text-foreground-900 bg-background-50 border border-background-200/70 rounded-lg focus:outline-none focus:border-primary-300 transition-colors min-h-[44px]";

  return (
    <div className="min-h-screen pt-[70px] bg-background-100 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-[1000px] bg-background-50 rounded-2xl border border-background-200/70 overflow-hidden flex flex-col lg:flex-row">
        <div className="flex-1 p-6 sm:p-8 md:p-12 order-2 lg:order-1">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950">
              {t("auth.registerTitle")}
            </h1>
            <p className="text-sm text-foreground-600 mt-2">
              {t("auth.hasAccount")}{" "}
              <Link
                to="/login"
                className="text-primary-500 hover:underline font-medium cursor-pointer"
              >
                {t("auth.loginLink")}
              </Link>
            </p>
          </div>

          <ol className="flex items-center gap-2 mb-6">
            {steps.map((item, index) => (
              <li key={item.id} className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-7 h-7 rounded-full text-xs font-semibold inline-flex items-center justify-center flex-shrink-0 ${
                    index <= stepIndex
                      ? "bg-primary-500 text-white"
                      : "bg-background-200 text-foreground-500"
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className={`text-xs sm:text-sm truncate ${
                    index === stepIndex
                      ? "font-semibold text-foreground-950"
                      : "text-foreground-500"
                  }`}
                >
                  {item.label}
                </span>
                {index < steps.length - 1 && (
                  <span className="hidden sm:block w-6 h-px bg-background-300"></span>
                )}
              </li>
            ))}
          </ol>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2">
              <i className="ri-error-warning-line"></i> {error}
            </div>
          )}

          {step === "account" && (
            <form
              onSubmit={(event) => void handleSend(event)}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("auth.youAre")}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <RoleOption
                    selected={accountType === "JOB_SEEKER"}
                    title={t("auth.jobSeeker")}
                    description={t("auth.jobSeekerDesc")}
                    accent="primary"
                    onSelect={() => setAccountType("JOB_SEEKER")}
                  />
                  <RoleOption
                    selected={accountType === "EMPLOYER"}
                    title={t("auth.employer")}
                    description={t("auth.employerDesc")}
                    accent="accent"
                    onSelect={() => setAccountType("EMPLOYER")}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("auth.email")} *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className={inputClass}
                  placeholder="email@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-60 min-h-[44px]"
              >
                {loading ? t("common.loading") : t("auth.sendOtp")}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form
              onSubmit={(event) => void handleVerify(event)}
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-heading font-semibold text-foreground-950">
                  {t("auth.otpTitle")}
                </h2>
                <p className="text-sm text-foreground-600 mt-1">
                  {t("auth.otpSent", { email })}
                </p>
                <p className="text-sm text-foreground-500 mt-2">
                  {t("auth.otpSpamHint")}
                </p>
              </div>
              <div
                className="flex justify-between gap-2"
                onPaste={(event) => {
                  event.preventDefault();
                  onOtpPaste(event.clipboardData.getData("text"));
                }}
              >
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      otpRefs.current[index] = node;
                    }}
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={digit}
                    onChange={(event) => updateDigit(index, event.target.value)}
                    onKeyDown={(event) => onOtpKeyDown(index, event.key)}
                    className="w-full max-w-12 h-12 text-center text-lg font-semibold rounded-lg border border-background-200/70 bg-background-50 focus:outline-none focus:border-primary-300"
                    aria-label={`${t("auth.stepOtp")} ${index + 1}`}
                  />
                ))}
              </div>
              <p className="text-xs text-foreground-500">{t("auth.otpHint")}</p>
              <button
                type="submit"
                disabled={loading || digits.join("").length !== OTP_LENGTH}
                className="w-full py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-60 min-h-[44px]"
              >
                {loading ? t("common.loading") : t("auth.verifyOtp")}
              </button>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={loading || cooldown > 0}
                  onClick={() => void sendCode()}
                  className="text-sm font-medium text-primary-500 disabled:text-foreground-400 cursor-pointer disabled:cursor-not-allowed min-h-[44px] text-left"
                >
                  {cooldown > 0
                    ? t("auth.resendIn", { time: formatCooldown(cooldown) })
                    : t("auth.resendOtp")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setVerificationToken("");
                    setStep("account");
                  }}
                  className="text-sm text-foreground-600 hover:text-foreground-900 cursor-pointer min-h-[44px] text-left"
                >
                  {t("auth.changeEmail")}
                </button>
              </div>
            </form>
          )}

          {step === "profile" && (
            <form
              onSubmit={(event) => void handleRegister(event)}
              className="space-y-5"
            >
              <div className="rounded-xl bg-background-100 px-4 py-3 text-sm text-foreground-700">
                <p>{email}</p>
                <p className="text-xs text-foreground-500 mt-1">
                  {accountType === "EMPLOYER"
                    ? t("auth.employer")
                    : t("auth.jobSeeker")}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("auth.fullName")} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className={inputClass}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("auth.password")} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      className={`${inputClass} pr-10`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 cursor-pointer w-8 h-8"
                      aria-label={
                        showPassword
                          ? t("auth.hidePassword")
                          : t("auth.showPassword")
                      }
                    >
                      <i
                        className={
                          showPassword ? "ri-eye-off-line" : "ri-eye-line"
                        }
                      ></i>
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-foreground-500">
                    {t("validation.passwordHint")}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("auth.confirmPassword")} *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      required
                      className={`${inputClass} pr-10`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 cursor-pointer w-8 h-8"
                      aria-label={
                        showConfirmPassword
                          ? t("auth.hidePassword")
                          : t("auth.showPassword")
                      }
                    >
                      <i
                        className={
                          showConfirmPassword
                            ? "ri-eye-off-line"
                            : "ri-eye-line"
                        }
                      ></i>
                    </button>
                  </div>
                </div>
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(event) => setAcceptTerms(event.target.checked)}
                  required
                  className="w-4 h-4 mt-0.5 rounded border-background-300 text-primary-500 focus:ring-primary-400 cursor-pointer"
                />
                <span className="text-xs text-foreground-600">
                  {t("auth.agreeTermsPrefix")}{" "}
                  <Link
                    to="/terms"
                    className="text-primary-500 hover:underline"
                  >
                    {t("auth.terms")}
                  </Link>{" "}
                  {t("common.and")}{" "}
                  <Link
                    to="/privacy"
                    className="text-primary-500 hover:underline"
                  >
                    {t("auth.privacy")}
                  </Link>
                </span>
              </label>
              <button
                type="submit"
                disabled={loading || !acceptTerms}
                className="w-full py-3 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-60 min-h-[44px]"
              >
                {loading ? t("common.loading") : t("auth.registerButton")}
              </button>
            </form>
          )}
        </div>

        <div className="lg:w-1/2 relative hidden lg:block order-1 lg:order-2 bg-gradient-to-br from-accent-700 to-accent-500 min-h-[280px]">
          {registerBgUrl ? (
            <img
              src={registerBgUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-accent-500/80 to-accent-500/20 flex flex-col justify-end p-10">
            <h2 className="text-3xl font-heading font-bold text-white mb-3">
              {t("auth.welcomeRegister")}
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              {t("auth.welcomeRegisterDesc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleOption({
  selected,
  title,
  description,
  accent,
  onSelect,
}: {
  selected: boolean;
  title: string;
  description: string;
  accent: "primary" | "accent";
  onSelect: () => void;
}) {
  const selectedClass =
    accent === "primary"
      ? "border-primary-300 bg-primary-50"
      : "border-accent-300 bg-accent-50";
  const ringClass =
    accent === "primary" ? "border-primary-500" : "border-accent-500";
  const dotClass = accent === "primary" ? "bg-primary-500" : "bg-accent-500";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-left min-h-[44px] ${
        selected
          ? selectedClass
          : "border-background-200/70 hover:bg-background-100"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? ringClass : "border-background-300"
        }`}
      >
        {selected && (
          <div className={`w-2.5 h-2.5 rounded-full ${dotClass}`}></div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground-950">{title}</p>
        <p className="text-xs text-foreground-500">{description}</p>
      </div>
    </button>
  );
}
