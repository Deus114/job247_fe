import { useTranslation } from "react-i18next";
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ChangeEvent,
} from "react";
import {
  fetchAdminUsers,
  fetchAdminUserById,
  createAdminUser,
  updateAdminUser,
  softDeleteAdminUser,
  restoreAdminUser,
  permanentDeleteAdminUser,
  fetchRoles,
  AdminAuthError,
  resolveAdminAuthErrorMessage,
} from "@/api";
import type { AdminRole, AdminSessionUser } from "@/types/adminAuth";
import { AdminAvatar } from "@/features/admin";
import SortHeader from "@/components/ui/SortHeader";
import ColumnVisibilityDropdown from "@/components/ui/ColumnVisibilityDropdown";
import Pagination from "@/components/ui/Pagination";
import CustomSelect from "@/components/ui/CustomSelect";
import {
  useTableActionMenu,
  TableActionMenu,
} from "@/components/ui/TableActionMenu";
import { toast } from "@/lib/toast";
import { formatDateTime } from "@/lib/formatDate";
import { isStrongPassword } from "@/lib/password";

type SortField = "username" | "name" | "createdAt";

type FormState = {
  username: string;
  password: string;
  currentPassword: string;
  newPassword: string;
  name: string;
  roleId: string;
  active: boolean;
};

const emptyForm = (): FormState => ({
  username: "",
  password: "",
  currentPassword: "",
  newPassword: "",
  name: "",
  roleId: "",
  active: true,
});

export default function UsersPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [viewMode, setViewMode] = useState<"active" | "trash">("active");
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [items, setItems] = useState<AdminSessionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [trashCount, setTrashCount] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminSessionUser | null>(null);
  const [detail, setDetail] = useState<AdminSessionUser | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<number | null>(
    null,
  );
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<
    number | null
  >(null);
  const { openId, pos, menuRef, toggle, close } = useTableActionMenu<number>();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [visibleColumns, setVisibleColumns] = useState([
    "account",
    "role",
    "active",
    "createdAt",
    "actions",
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (field: string) => {
    if (sortField === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortField(field as SortField);
      setSortOrder("asc");
    }
  };

  const loadRoles = useCallback(async () => {
    try {
      const res = await fetchRoles({
        active: true,
        deleted: false,
        page: 1,
        size: 100,
        sort: "name,asc",
      });
      setRoles(res.data);
    } catch {
      setRoles([]);
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const roleId = Number(roleFilter);
      const res = await fetchAdminUsers({
        keyword: keyword || undefined,
        roleId: Number.isFinite(roleId) && roleId > 0 ? roleId : undefined,
        active:
          activeFilter === "true"
            ? true
            : activeFilter === "false"
              ? false
              : undefined,
        deleted: viewMode === "trash",
        page: currentPage,
        size: pageSize,
        sort: `${sortField},${sortOrder}`,
      });
      setItems(res.data);
      setTotalItems(res.pagination.total);
      setTotalPages(Math.max(1, res.pagination.last_page));
    } catch (error) {
      const message =
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.adminUserLoadFailed");
      setLoadError(message);
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    keyword,
    roleFilter,
    activeFilter,
    viewMode,
    currentPage,
    pageSize,
    sortField,
    sortOrder,
    t,
  ]);

  const loadTrashCount = useCallback(async () => {
    try {
      const res = await fetchAdminUsers({ deleted: true, page: 1, size: 1 });
      setTrashCount(res.pagination.total);
    } catch {
      setTrashCount(0);
    }
  }, []);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    void loadTrashCount();
  }, [loadTrashCount, viewMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, roleFilter, activeFilter, viewMode, pageSize, sortField, sortOrder]);

  const activeItem = useMemo(
    () => items.find((item) => item.id === openId) ?? null,
    [items, openId],
  );

  const roleOptions = useMemo(() => {
    const options = roles.map((role) => ({
      value: String(role.id),
      label: role.name,
    }));
    if (
      editing?.role?.id &&
      !options.some((option) => option.value === String(editing.role.id))
    ) {
      options.unshift({
        value: String(editing.role.id),
        label: editing.role.name,
      });
    }
    return options;
  }, [roles, editing]);

  const roleFilterOptions = useMemo(
    () => [
      { value: "", label: t("adminUi.filters.allRoles") },
      ...roles.map((role) => ({ value: String(role.id), label: role.name })),
    ],
    [roles, t],
  );

  const activeFilterOptions = useMemo(
    () => [
      { value: "", label: t("adminUi.filters.allStatuses") },
      { value: "true", label: t("adminUi.jobs.on") },
      { value: "false", label: t("adminUi.jobs.off") },
    ],
    [t],
  );

  const resetAvatar = (preview = "") => {
    setAvatarFile(null);
    setAvatarPreview(preview);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    resetAvatar();
    setModalOpen(true);
  };

  const openEdit = async (user: AdminSessionUser) => {
    close();
    try {
      const fresh = await fetchAdminUserById(user.id);
      setEditing(fresh);
      setForm({
        username: fresh.username,
        password: "",
        currentPassword: "",
        newPassword: "",
        name: fresh.name,
        roleId: fresh.role?.id ? String(fresh.role.id) : "",
        active: fresh.active,
      });
      resetAvatar(fresh.avatar || "");
    } catch {
      setEditing(user);
      setForm({
        username: user.username,
        password: "",
        currentPassword: "",
        newPassword: "",
        name: user.name,
        roleId: user.role?.id ? String(user.role.id) : "",
        active: user.active,
      });
      resetAvatar(user.avatar || "");
    }
    setModalOpen(true);
  };

  const openDetail = async (user: AdminSessionUser) => {
    setDetail(user);
    try {
      const fresh = await fetchAdminUserById(user.id);
      setDetail((current) => (current?.id === user.id ? fresh : current));
    } catch {
      /* keep the list row */
    }
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const passwordChangeStarted = Boolean(
    form.currentPassword.trim() || form.newPassword.trim(),
  );
  const passwordChangeValid =
    !passwordChangeStarted ||
    (Boolean(form.currentPassword.trim() && form.newPassword.trim()) &&
      isStrongPassword(form.newPassword));

  const canSave = Boolean(
    form.username.trim() &&
      form.name.trim() &&
      form.roleId &&
      (editing ? passwordChangeValid : isStrongPassword(form.password)),
  );

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      if (editing) {
        await updateAdminUser(editing.id, {
          username: form.username,
          name: form.name,
          roleId: Number(form.roleId),
          active: form.active,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          avatarFile,
        });
        toast.success(t("adminUi.users.saved"));
      } else {
        await createAdminUser({
          username: form.username,
          password: form.password,
          name: form.name,
          roleId: Number(form.roleId),
          active: form.active,
          avatarFile,
        });
        toast.success(t("adminUi.users.created"));
      }
      setModalOpen(false);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.adminUserSaveFailed"),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: AdminSessionUser) => {
    try {
      const fresh = await fetchAdminUserById(user.id);
      await updateAdminUser(user.id, {
        username: fresh.username,
        name: fresh.name,
        roleId: fresh.role.id,
        active: !fresh.active,
      });
      toast.success(
        fresh.active
          ? t("adminUi.users.deactivated")
          : t("adminUi.users.activated"),
      );
      await loadList();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.adminUserSaveFailed"),
      );
    }
  };

  const runSoftDelete = async (id: number) => {
    try {
      await softDeleteAdminUser(id);
      toast.success(t("adminUi.users.deleted"));
      setConfirmSoftDelete(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.adminUserDeleteFailed"),
      );
    }
  };

  const runRestore = async (id: number) => {
    try {
      await restoreAdminUser(id);
      toast.success(t("adminUi.users.restored"));
      close();
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.adminUserRestoreFailed"),
      );
    }
  };

  const runPermanentDelete = async (id: number) => {
    try {
      await permanentDeleteAdminUser(id);
      toast.success(t("adminUi.users.deletedPermanent"));
      setConfirmPermanentDelete(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.adminUserDeleteFailed"),
      );
    }
  };

  const hasFilters = Boolean(keyword || search || roleFilter || activeFilter);
  const inputClass =
    "w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 min-h-[44px]";

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">
              {t("adminUi.pageTitles.users")}
            </h2>
            <p className="text-sm text-foreground-500 mt-1">
              {viewMode === "active"
                ? `${totalItems} ${t("adminUi.users.accounts")}`
                : `${totalItems} ${t("adminUi.jobs.deleted")}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ColumnVisibilityDropdown
              columns={[
                { key: "account", label: t("adminUi.columns.name") },
                { key: "role", label: t("adminUi.columns.role") },
                { key: "active", label: t("adminUi.columns.active") },
                { key: "createdAt", label: t("adminUi.columns.createdAt") },
                { key: "actions", label: t("adminUi.columns.actions") },
              ]}
              visibleKeys={visibleColumns}
              onChange={setVisibleColumns}
            />
            {viewMode === "active" && (
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 cursor-pointer"
              >
                <i className="ri-add-line"></i>
                {t("adminUi.users.addAccount")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewMode("active")}
              className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer min-h-[40px] ${
                viewMode === "active"
                  ? "bg-primary-100 text-primary-700"
                  : "text-foreground-500 hover:bg-background-100"
              }`}
            >
              {t("adminUi.actions.active")}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("trash")}
              className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer min-h-[40px] inline-flex items-center gap-1 ${
                viewMode === "trash"
                  ? "bg-red-100 text-red-600"
                  : "text-foreground-500 hover:bg-background-100"
              }`}
            >
              <i className="ri-delete-bin-line"></i>
              {t("adminUi.actions.trash")}
              {trashCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">
                  {trashCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setKeyword(search.trim());
              }}
              placeholder={t("adminUi.users.searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 min-h-[44px]"
            />
          </div>
          <CustomSelect
            outlined
            value={roleFilter}
            onChange={setRoleFilter}
            options={roleFilterOptions}
            className="w-full sm:w-48"
          />
          <CustomSelect
            outlined
            value={activeFilter}
            onChange={setActiveFilter}
            options={activeFilterOptions}
            className="w-full sm:w-40"
          />
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setKeyword("");
                setRoleFilter("");
                setActiveFilter("");
              }}
              className="px-3 py-2 text-sm text-foreground-500 hover:bg-background-100 rounded-xl cursor-pointer min-h-[44px]"
            >
              <i className="ri-filter-off-line mr-1"></i>
              {t("adminUi.actions.clearFilters")}
            </button>
          )}
        </div>
      </div>

      {viewMode === "trash" && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-700">
            <i className="ri-information-line mr-1"></i>
            {t("adminUi.users.trashInfo")}
          </p>
        </div>
      )}

      {loadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {loadError}
        </div>
      )}

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-background-200/70">
                {visibleColumns.includes("account") && (
                  <SortHeader
                    label={t("adminUi.columns.name").toUpperCase()}
                    field="name"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                    className="whitespace-nowrap"
                  />
                )}
                {visibleColumns.includes("role") && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">
                    {t("adminUi.columns.role").toUpperCase()}
                  </th>
                )}
                {visibleColumns.includes("active") && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">
                    {t("adminUi.columns.active").toUpperCase()}
                  </th>
                )}
                {visibleColumns.includes("createdAt") && (
                  <SortHeader
                    label={t("adminUi.columns.createdAt").toUpperCase()}
                    field="createdAt"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                    className="whitespace-nowrap"
                  />
                )}
                {visibleColumns.includes("actions") && (
                  <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">
                    {t("adminUi.columns.actions").toUpperCase()}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length}
                    className="px-5 py-12 text-center text-foreground-500"
                  >
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    {t("common.loading")}
                  </td>
                </tr>
              ) : (
                items.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-background-100 hover:bg-background-50"
                  >
                    {visibleColumns.includes("account") && (
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => void openDetail(user)}
                          className="flex items-center gap-3 text-left cursor-pointer"
                        >
                          <AdminAvatar src={user.avatar} name={user.name} />
                          <span className="min-w-0">
                            <span className="block font-medium text-foreground-900 truncate">
                              {user.name}
                            </span>
                            <span className="block text-xs text-foreground-500 truncate">
                              {user.username}
                            </span>
                          </span>
                        </button>
                      </td>
                    )}
                    {visibleColumns.includes("role") && (
                      <td className="px-5 py-3 whitespace-nowrap text-foreground-700">
                        {user.role?.name || "—"}
                      </td>
                    )}
                    {visibleColumns.includes("active") && (
                      <td className="px-5 py-3 whitespace-nowrap">
                        {viewMode === "active" ? (
                          <button
                            type="button"
                            onClick={() => void toggleActive(user)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer min-h-[32px] ${
                              user.active
                                ? "bg-accent-100 text-accent-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {user.active
                              ? t("adminUi.jobs.on")
                              : t("adminUi.jobs.off")}
                          </button>
                        ) : (
                          <span className="text-xs text-foreground-400">—</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("createdAt") && (
                      <td className="px-5 py-3 text-foreground-600 whitespace-nowrap text-xs">
                        {formatDateTime(user.createdAt, lang)}
                      </td>
                    )}
                    {visibleColumns.includes("actions") && (
                      <td className="px-5 py-3 text-right">
                        {confirmSoftDelete === user.id && viewMode === "active" ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => void runSoftDelete(user.id)}
                              className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium cursor-pointer min-h-[36px]"
                            >
                              {t("adminUi.jobs.confirmDelete")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmSoftDelete(null)}
                              className="px-2.5 py-1 border border-background-300 rounded-lg text-xs cursor-pointer min-h-[36px]"
                            >
                              {t("adminUi.actions.cancel")}
                            </button>
                          </div>
                        ) : confirmPermanentDelete === user.id &&
                          viewMode === "trash" ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => void runPermanentDelete(user.id)}
                              className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium cursor-pointer min-h-[36px]"
                            >
                              {t("adminUi.jobs.deletePermanent")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmPermanentDelete(null)}
                              className="px-2.5 py-1 border border-background-300 rounded-lg text-xs cursor-pointer min-h-[36px]"
                            >
                              {t("adminUi.actions.cancel")}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => toggle(user.id, e)}
                            className="w-10 h-10 inline-flex items-center justify-center rounded-lg hover:bg-background-100 cursor-pointer"
                          >
                            <i className="ri-more-2-fill text-foreground-500"></i>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && items.length === 0 && !loadError && (
          <div className="p-12 text-center text-sm text-foreground-500">
            {viewMode === "trash"
              ? t("adminUi.users.trashEmpty")
              : hasFilters
                ? t("adminUi.users.noAccountsFiltered")
                : t("adminUi.users.noAccountsFound")}
          </div>
        )}
        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDetail(null)}
          ></div>
          <div className="relative bg-background-50 border border-background-200 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <AdminAvatar src={detail.avatar} name={detail.name} />
                <div className="min-w-0">
                  <h3 className="text-lg font-heading font-semibold text-foreground-950 truncate">
                    {detail.name}
                  </h3>
                  <p className="text-xs text-foreground-500 truncate">
                    {detail.username}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-100 cursor-pointer"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-500">{t("adminUi.columns.role")}</dt>
                <dd className="text-foreground-800 text-right">
                  {detail.role?.name || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-500">{t("adminUi.roles.fullAccess")}</dt>
                <dd className="text-foreground-800">
                  {detail.role?.fullAccess
                    ? t("adminUi.roles.fullAccess")
                    : t("adminUi.roles.limited")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-500">{t("adminUi.columns.active")}</dt>
                <dd className="text-foreground-800">
                  {detail.active ? t("adminUi.jobs.on") : t("adminUi.jobs.off")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-500">{t("adminUi.columns.createdAt")}</dt>
                <dd className="text-foreground-800">
                  {formatDateTime(detail.createdAt, lang)}
                </dd>
              </div>
            </dl>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="flex-1 py-2.5 border border-background-300 rounded-xl text-sm font-medium cursor-pointer min-h-[44px]"
              >
                {t("adminUi.jobs.close")}
              </button>
              {viewMode === "active" && (
                <button
                  type="button"
                  onClick={() => {
                    setDetail(null);
                    void openEdit(detail);
                  }}
                  className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold cursor-pointer min-h-[44px]"
                >
                  {t("adminUi.jobs.edit")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !saving && setModalOpen(false)}
          ></div>
          <div className="relative bg-background-50 border border-background-200 rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-lg max-h-[92vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">
                {editing
                  ? t("adminUi.users.editAccount")
                  : t("adminUi.users.addAccount")}
              </h3>
              <button
                type="button"
                onClick={() => !saving && setModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-100 cursor-pointer"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <AdminAvatar
                  src={avatarPreview}
                  name={form.name || form.username || "A"}
                  sizeClass="w-16 h-16"
                />
                <label className="inline-flex items-center justify-center px-4 min-h-[44px] rounded-xl border border-background-300 text-sm font-medium cursor-pointer hover:bg-background-100">
                  {t("adminUi.users.uploadAvatar")}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-foreground-700">
                  {t("adminUi.users.username")}
                </span>
                <input
                  value={form.username}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                  autoComplete="off"
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-foreground-700">
                  {t("adminUi.columns.name")}
                </span>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              {editing ? (
                <>
                  <label className="block">
                    <span className="text-sm font-medium text-foreground-700">
                      {t("adminUi.users.currentPassword")}
                    </span>
                    <input
                      type="password"
                      value={form.currentPassword}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      autoComplete="current-password"
                      placeholder={t("adminUi.users.passwordChangeHint")}
                      className={`${inputClass} mt-1.5`}
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-foreground-700">
                      {t("adminUi.users.newPassword")}
                    </span>
                    <input
                      type="password"
                      value={form.newPassword}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      autoComplete="new-password"
                      placeholder={t("adminUi.users.passwordChangeHint")}
                      className={`${inputClass} mt-1.5`}
                    />
                    <p className="mt-1.5 text-xs text-foreground-500">
                      {t("validation.passwordHint")}
                    </p>
                  </label>
                </>
              ) : (
                <label className="block">
                  <span className="text-sm font-medium text-foreground-700">
                    {t("adminUi.users.password")}
                  </span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    autoComplete="new-password"
                    placeholder={t("adminUi.users.passwordPlaceholder")}
                    className={`${inputClass} mt-1.5`}
                  />
                  <p className="mt-1.5 text-xs text-foreground-500">
                    {t("validation.passwordHint")}
                  </p>
                </label>
              )}
              <div>
                <span className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("adminUi.columns.role")}
                </span>
                <CustomSelect
                  outlined
                  value={form.roleId}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, roleId: value }))
                  }
                  options={roleOptions}
                  placeholder={t("common.select")}
                  className="w-full"
                />
              </div>
              <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, active: e.target.checked }))
                  }
                  className="h-4 w-4 accent-primary-500"
                />
                <span className="text-sm font-medium text-foreground-800">
                  {t("adminUi.columns.active")}
                </span>
              </label>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => !saving && setModalOpen(false)}
                className="flex-1 py-2.5 border border-background-300 rounded-xl text-sm font-medium cursor-pointer min-h-[44px]"
              >
                {t("adminUi.actions.cancel")}
              </button>
              <button
                type="button"
                disabled={!canSave || saving}
                onClick={() => void handleSave()}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold min-h-[44px] flex items-center justify-center gap-2 ${
                  canSave && !saving
                    ? "bg-primary-500 text-white hover:bg-primary-600 cursor-pointer"
                    : "bg-background-200 text-foreground-400 cursor-not-allowed"
                }`}
              >
                {saving && <i className="ri-loader-4-line animate-spin"></i>}
                {editing
                  ? t("adminUi.jobs.saveChanges")
                  : t("adminUi.users.addAccount")}
              </button>
            </div>
          </div>
        </div>
      )}

      <TableActionMenu
        open={openId != null && !!activeItem}
        pos={pos}
        menuRef={menuRef}
      >
        {activeItem && viewMode === "active" ? (
          <>
            <button
              type="button"
              onClick={() => {
                void openDetail(activeItem);
                close();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-background-100 cursor-pointer"
            >
              <i className="ri-eye-line text-primary-500"></i>
              {t("adminUi.jobs.viewDetails")}
            </button>
            <button
              type="button"
              onClick={() => void openEdit(activeItem)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-background-100 cursor-pointer"
            >
              <i className="ri-edit-line text-accent-500"></i>
              {t("adminUi.jobs.edit")}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmSoftDelete(activeItem.id);
                close();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer"
            >
              <i className="ri-delete-bin-line"></i>
              {t("adminUi.jobs.confirmDelete")}
            </button>
          </>
        ) : activeItem ? (
          <>
            <button
              type="button"
              onClick={() => void runRestore(activeItem.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 cursor-pointer"
            >
              <i className="ri-arrow-go-back-line"></i>
              {t("adminUi.jobs.restore")}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmPermanentDelete(activeItem.id);
                close();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer"
            >
              <i className="ri-delete-bin-6-line"></i>
              {t("adminUi.jobs.deletePermanent")}
            </button>
          </>
        ) : null}
      </TableActionMenu>
    </div>
  );
}
