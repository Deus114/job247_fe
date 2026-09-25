import { useEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useAdminAuth } from "@/features/auth";
import {
  fetchAdminMe,
  updateAdminMe,
  AdminAuthError,
  resolveAdminAuthErrorMessage,
} from "@/api";
import { changeAppLanguage } from "@/store/slices/languageSlice";
import { toggleTheme } from "@/store/slices/themeSlice";
import { formatDateTime } from "@/lib/formatDate";
import { isStrongPassword } from "@/lib/password";
import { toast } from "@/lib/toast";
import CustomSelect from "@/components/ui/CustomSelect";

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { admin, setSessionUser } = useAdminAuth();
  const currentLanguage = useAppSelector((state) => state.language.lang);
  const currentTheme = useAppSelector((state) => state.theme.mode);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [imagePreview, setImagePreview] = useState(admin?.avatar || "");

  const loadMe = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const user = await fetchAdminMe();
      setSessionUser(user);
      setImagePreview(user.avatar || "");
    } catch (error) {
      const message =
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("adminUi.profile.loadError");
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setImagePreview(admin?.avatar || "");
  }, [admin?.avatar]);

  const hasFullAccess = Boolean(admin?.role?.fullAccess);
  const sessionPermissions = (admin?.role?.permissions || []).filter(
    (p) => p.active,
  );
  const moduleAccessPerms = sessionPermissions.filter(
    (p) => String(p.type).toUpperCase() === "MODULE",
  );
  const actionPerms = sessionPermissions.filter(
    (p) => String(p.type).toUpperCase() === "ACTION",
  );

  const permissionsByModule: Record<string, typeof actionPerms> = {};
  actionPerms.forEach((p) => {
    const key = p.module || t("adminUi.profile.other");
    if (!permissionsByModule[key]) permissionsByModule[key] = [];
    permissionsByModule[key].push(p);
  });

  const avatarSrc = imagePreview.trim();

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || avatarSaving) return;

    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setAvatarSaving(true);
    try {
      const user = await updateAdminMe({ avatarFile: file });
      setSessionUser(user);
      setImagePreview(user.avatar || "");
      toast.success(t("adminUi.profile.avatarUpdated"));
    } catch (error) {
      setImagePreview(admin?.avatar || "");
      const message =
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.adminMeUpdateFailed");
      toast.error(message);
    } finally {
      setAvatarSaving(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordMsg(null);
    if (
      !passwordForm.current ||
      !passwordForm.newPass ||
      !passwordForm.confirm
    ) {
      setPasswordMsg({
        type: "error",
        text: t("adminUi.profile.fillAllFields"),
      });
      return;
    }
    if (!isStrongPassword(passwordForm.newPass)) {
      setPasswordMsg({
        type: "error",
        text: t("validation.passwordStrong"),
      });
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordMsg({
        type: "error",
        text: t("adminUi.profile.passwordMismatch"),
      });
      return;
    }

    setPasswordSaving(true);
    try {
      const user = await updateAdminMe({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.newPass,
      });
      setSessionUser(user);
      setPasswordForm({ current: "", newPass: "", confirm: "" });
      setPasswordMsg({
        type: "success",
        text: t("adminUi.profile.passwordChanged"),
      });
      toast.success(t("adminUi.profile.passwordChanged"));
    } catch (error) {
      const message =
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.adminMeUpdateFailed");
      setPasswordMsg({ type: "error", text: message });
    } finally {
      setPasswordSaving(false);
    }
  };

  const languageOptions = [
    { value: "vi", label: t("adminUi.profile.languageVi") },
    { value: "en", label: t("adminUi.profile.languageEn") },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-foreground-500 gap-2">
        <i className="ri-loader-4-line animate-spin text-lg"></i>
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-heading font-bold text-foreground-950 mb-6">
        {t("adminUi.profile.myAccount")}
      </h2>

      {loadError ? (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          <span className="flex-1 flex items-start gap-2">
            <i className="ri-error-warning-line mt-0.5"></i>
            {loadError}
          </span>
          <button
            type="button"
            onClick={() => void loadMe()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-100 cursor-pointer whitespace-nowrap"
          >
            {t("adminUi.profile.retryLoad")}
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-background-50 border border-background-200/70 rounded-xl p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={admin?.name || admin?.username || "Admin"}
                    className="w-24 h-24 rounded-full object-cover"
                    onError={() => setImagePreview("")}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
                    <i className="ri-shield-user-line text-3xl text-primary-600"></i>
                  </div>
                )}
                <label
                  className={`absolute bottom-0 right-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors ${
                    avatarSaving ? "opacity-60 pointer-events-none" : ""
                  }`}
                >
                  {avatarSaving ? (
                    <i className="ri-loader-4-line text-sm animate-spin"></i>
                  ) : (
                    <i className="ri-camera-line text-sm"></i>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handleAvatarChange(e)}
                    className="hidden"
                    disabled={avatarSaving}
                  />
                </label>
              </div>
              <h3 className="text-lg font-semibold text-foreground-950">
                {admin?.name || "Admin"}
              </h3>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-background-100 gap-3">
                <span className="text-sm text-foreground-500 shrink-0">
                  {t("adminLogin.username")}
                </span>
                <span className="text-sm font-medium text-foreground-900 truncate">
                  {admin?.username || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100 gap-3">
                <span className="text-sm text-foreground-500 shrink-0">
                  {t("adminUi.columns.role")}
                </span>
                {admin?.role?.name ? (
                  <span className="px-2.5 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-medium">
                    {admin.role.name}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-foreground-900">
                    —
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100 gap-3">
                <span className="text-sm text-foreground-500 shrink-0">
                  {hasFullAccess
                    ? t("adminUi.profile.fullAccessLabel")
                    : t("adminUi.profile.permissionCount")}
                </span>
                <span className="text-sm font-medium text-foreground-900">
                  {hasFullAccess
                    ? t("adminUi.profile.fullAccessValue")
                    : actionPerms.length}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100 gap-3">
                <span className="text-sm text-foreground-500 shrink-0">
                  {t("adminUi.profile.lastUpdated")}
                </span>
                <span className="text-sm font-medium text-foreground-900">
                  {formatDateTime(
                    admin?.updatedAt,
                    i18n.language,
                    t("adminUi.common.notAvailable"),
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-background-50 border border-background-200/70 rounded-xl p-6">
            <h3 className="font-heading text-sm font-semibold text-foreground-950 mb-4">
              {t("adminUi.profile.settings")}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                {t("adminUi.profile.language")}
              </label>
              <CustomSelect
                value={currentLanguage}
                options={languageOptions}
                onChange={(v) =>
                  void dispatch(changeAppLanguage(v as "vi" | "en"))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                {t("adminUi.profile.theme")}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    currentTheme !== "light" && dispatch(toggleTheme())
                  }
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                    currentTheme === "light"
                      ? "bg-primary-100 text-primary-700 border-2 border-primary-300"
                      : "border border-background-200 text-foreground-500 hover:bg-background-100"
                  }`}
                >
                  <i className="ri-sun-line"></i> {t("adminUi.profile.light")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    currentTheme !== "dark" && dispatch(toggleTheme())
                  }
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                    currentTheme === "dark"
                      ? "bg-primary-100 text-primary-700 border-2 border-primary-300"
                      : "border border-background-200 text-foreground-500 hover:bg-background-100"
                  }`}
                >
                  <i className="ri-moon-line"></i> {t("adminUi.profile.dark")}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-background-50 border border-background-200/70 rounded-xl p-6">
            <h3 className="font-heading text-sm font-semibold text-foreground-950 mb-4">
              {t("adminUi.profile.changePassword")}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground-700 mb-1">
                  {t("adminUi.profile.currentPassword")}
                </label>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      current: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors"
                  placeholder={t("adminUi.profile.currentPasswordPlaceholder")}
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground-700 mb-1">
                  {t("adminUi.profile.newPassword")}
                </label>
                <input
                  type="password"
                  value={passwordForm.newPass}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPass: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors"
                  placeholder={t("adminUi.profile.newPasswordPlaceholder")}
                  autoComplete="new-password"
                />
                <p className="mt-1.5 text-xs text-foreground-500">
                  {t("validation.passwordHint")}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground-700 mb-1">
                  {t("adminUi.profile.confirmPassword")}
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirm: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors"
                  placeholder={t("adminUi.profile.confirmPasswordPlaceholder")}
                  autoComplete="new-password"
                />
              </div>
              {passwordMsg && (
                <p
                  className={`text-xs ${
                    passwordMsg.type === "success"
                      ? "text-accent-600"
                      : "text-red-500"
                  }`}
                >
                  {passwordMsg.text}
                </p>
              )}
              <button
                type="button"
                onClick={() => void handlePasswordChange()}
                disabled={passwordSaving}
                className="w-full py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {passwordSaving ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    {t("common.loading")}
                  </>
                ) : (
                  t("adminUi.profile.updatePassword")
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          {hasFullAccess ? (
            <div className="bg-background-50 border border-background-200/70 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0">
                  <i className="ri-shield-check-line text-lg text-accent-600"></i>
                </div>
                <div>
                  <h3 className="font-heading text-sm font-semibold text-foreground-950 mb-1">
                    {t("adminUi.profile.fullAccessYes")}
                  </h3>
                  <p className="text-sm text-foreground-500">
                    {t("adminUi.profile.fullAccessHint")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-background-50 border border-background-200/70 rounded-xl p-6">
                <h3 className="font-heading text-sm font-semibold text-foreground-950 mb-1">
                  {t("adminUi.profile.moduleAccess")}
                </h3>
                <p className="text-xs text-foreground-500 mb-4">
                  {t("adminUi.profile.moduleAccessHint")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {moduleAccessPerms.length > 0 ? (
                    moduleAccessPerms.map((p) => (
                      <span
                        key={p.id}
                        className="px-3 py-1.5 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium flex items-center gap-1.5"
                      >
                        <i className="ri-folder-line text-[10px]"></i> {p.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-foreground-400">
                      {t("adminUi.profile.noModuleAccess")}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-background-50 border border-background-200/70 rounded-xl p-6">
                <h3 className="font-heading text-sm font-semibold text-foreground-950 mb-1">
                  {t("adminUi.profile.actionPermissions")}
                </h3>
                <p className="text-xs text-foreground-500 mb-4">
                  {t("adminUi.profile.actionPermissionsHint", {
                    count: actionPerms.length,
                  })}
                </p>

                <div className="space-y-5">
                  {Object.entries(permissionsByModule).map(
                    ([module, perms]) => (
                      <div key={module}>
                        <h4 className="text-xs font-semibold text-foreground-400 uppercase tracking-wider mb-2">
                          {module}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-start gap-2.5 p-3 rounded-lg bg-background-100/50 border border-background-200/50"
                            >
                              <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i className="ri-check-line text-xs text-accent-600"></i>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground-800">
                                  {p.name}
                                </p>
                                {(p.method || p.path) && (
                                  <code className="text-[10px] font-mono text-foreground-400 bg-background-100 px-1 py-0.5 rounded">
                                    {[p.method, p.path]
                                      .filter(Boolean)
                                      .join(" ")}
                                  </code>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                  {Object.keys(permissionsByModule).length === 0 && (
                    <p className="text-sm text-foreground-400">
                      {t("adminUi.profile.noActionPermissions")}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
