import { useTranslation } from "react-i18next";
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type UIEvent,
} from "react";
import {
  fetchRoles,
  fetchRoleById,
  createRole,
  updateRole,
  softDeleteRole,
  restoreRole,
  permanentDeleteRole,
  fetchPermissions,
  AdminAuthError,
  resolveAdminAuthErrorMessage,
} from "@/api";
import type { AdminPermission, AdminRole } from "@/types/adminAuth";
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

type SortField = "name" | "createdAt";

type FormState = {
  name: string;
  description: string;
  fullAccess: boolean;
  active: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  fullAccess: false,
  active: true,
});

const PERM_PAGE_SIZE = 20;

function isModulePermission(permission: AdminPermission) {
  return String(permission.type).toUpperCase() === "MODULE";
}

function methodBadgeClass(method: string) {
  switch (method.toUpperCase()) {
    case "GET":
      return "bg-sky-100 text-sky-700";
    case "POST":
      return "bg-emerald-100 text-emerald-700";
    case "PUT":
      return "bg-amber-100 text-amber-800";
    case "PATCH":
      return "bg-teal-100 text-teal-700";
    case "DELETE":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-background-100 text-foreground-600";
  }
}

function groupByModule(items: AdminPermission[]) {
  const order: string[] = [];
  const map = new Map<string, AdminPermission[]>();
  items.forEach((item) => {
    const key = item.module.trim();
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)?.push(item);
  });
  return order.map((module) => ({
    module,
    items: map.get(module) ?? [],
  }));
}

export default function RolesPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [viewMode, setViewMode] = useState<"active" | "trash">("active");
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [fullAccessFilter, setFullAccessFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [items, setItems] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [trashCount, setTrashCount] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRole | null>(null);
  const [detail, setDetail] = useState<AdminRole | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<number | null>(
    null,
  );
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<
    number | null
  >(null);
  const { openId, pos, menuRef, toggle, close } = useTableActionMenu<number>();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [permItems, setPermItems] = useState<AdminPermission[]>([]);
  const [permPage, setPermPage] = useState(0);
  const [permTotal, setPermTotal] = useState(0);
  const [permLoading, setPermLoading] = useState(false);
  const [permLoadingMore, setPermLoadingMore] = useState(false);
  const [permSearch, setPermSearch] = useState("");
  const [permKeyword, setPermKeyword] = useState("");
  const permListRef = useRef<HTMLDivElement>(null);
  const permItemsRef = useRef<AdminPermission[]>([]);
  const permRequestRef = useRef(0);

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [visibleColumns, setVisibleColumns] = useState([
    "name",
    "description",
    "fullAccess",
    "permissions",
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

  const loadList = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetchRoles({
        keyword: keyword || undefined,
        fullAccess:
          fullAccessFilter === "true"
            ? true
            : fullAccessFilter === "false"
              ? false
              : undefined,
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
          : t("apiErrors.roleLoadFailed");
      setLoadError(message);
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    keyword,
    fullAccessFilter,
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
      const res = await fetchRoles({ deleted: true, page: 1, size: 1 });
      setTrashCount(res.pagination.total);
    } catch {
      setTrashCount(0);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    void loadTrashCount();
  }, [loadTrashCount, viewMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    keyword,
    fullAccessFilter,
    activeFilter,
    viewMode,
    pageSize,
    sortField,
    sortOrder,
  ]);

  useEffect(() => {
    if (!modalOpen) return;
    const timer = window.setTimeout(
      () => setPermKeyword(permSearch.trim()),
      400,
    );
    return () => window.clearTimeout(timer);
  }, [permSearch, modalOpen]);

  const loadPermissionPage = useCallback(
    async (page: number, replace: boolean) => {
      const requestId = permRequestRef.current + 1;
      permRequestRef.current = requestId;
      if (replace) setPermLoading(true);
      else setPermLoadingMore(true);
      try {
        const res = await fetchPermissions({
          keyword: permKeyword || undefined,
          active: true,
          deleted: false,
          page,
          size: PERM_PAGE_SIZE,
          sort: "module,asc",
        });
        if (permRequestRef.current !== requestId) return;
        const prev = replace ? [] : permItemsRef.current;
        const seen = new Set(prev.map((item) => item.id));
        const extra = res.data.filter((item) => !seen.has(item.id));
        const next = replace ? res.data : [...prev, ...extra];
        permItemsRef.current = next;
        setPermItems(next);
        setPermPage(res.pagination.current_page || page);
        setPermTotal(
          !replace && extra.length === 0 ? next.length : res.pagination.total,
        );
      } catch (error) {
        if (permRequestRef.current !== requestId) return;
        if (replace) {
          setPermItems([]);
          setPermTotal(0);
          toast.error(
            error instanceof AdminAuthError
              ? resolveAdminAuthErrorMessage(error, t)
              : t("apiErrors.permissionLoadFailed"),
          );
        }
      } finally {
        if (permRequestRef.current === requestId) {
          setPermLoading(false);
          setPermLoadingMore(false);
        }
      }
    },
    [permKeyword, t],
  );

  useEffect(() => {
    if (!modalOpen || form.fullAccess) return;
    void loadPermissionPage(1, true);
  }, [modalOpen, form.fullAccess, loadPermissionPage]);

  const hasMorePermissions = permItems.length < permTotal;

  const loadMorePermissions = useCallback(() => {
    if (permLoading || permLoadingMore || !hasMorePermissions) return;
    void loadPermissionPage(permPage + 1, false);
  }, [
    permLoading,
    permLoadingMore,
    hasMorePermissions,
    permPage,
    loadPermissionPage,
  ]);

  useEffect(() => {
    const el = permListRef.current;
    if (!el || !modalOpen || form.fullAccess) return;
    if (permLoading || permLoadingMore || !hasMorePermissions) return;
    if (el.scrollHeight <= el.clientHeight + 8) {
      void loadPermissionPage(permPage + 1, false);
    }
  }, [
    modalOpen,
    form.fullAccess,
    permItems,
    permLoading,
    permLoadingMore,
    hasMorePermissions,
    permPage,
    loadPermissionPage,
  ]);

  const permissionGroups = useMemo(
    () => groupByModule(permItems),
    [permItems],
  );
  const detailGroups = useMemo(
    () => groupByModule(detail?.permissions ?? []),
    [detail],
  );

  const activeItem = useMemo(
    () => items.find((item) => item.id === openId) ?? null,
    [items, openId],
  );

  const fullAccessOptions = useMemo(
    () => [
      { value: "", label: t("adminUi.roles.allAccess") },
      { value: "true", label: t("adminUi.roles.fullAccess") },
      { value: "false", label: t("adminUi.roles.limited") },
    ],
    [t],
  );

  const activeFilterOptions = useMemo(
    () => [
      { value: "", label: t("adminUi.filters.allStatuses") },
      { value: "true", label: t("adminUi.jobs.on") },
      { value: "false", label: t("adminUi.jobs.off") },
    ],
    [t],
  );

  const resetPermissionPicker = () => {
    setPermSearch("");
    setPermKeyword("");
    setPermItems([]);
    permItemsRef.current = [];
    setPermPage(0);
    setPermTotal(0);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setSelectedIds([]);
    resetPermissionPicker();
    setModalOpen(true);
  };

  const openEdit = async (role: AdminRole) => {
    close();
    resetPermissionPicker();
    try {
      const fresh = await fetchRoleById(role.id);
      setEditing(fresh);
      setForm({
        name: fresh.name,
        description: fresh.description,
        fullAccess: fresh.fullAccess,
        active: fresh.active,
      });
      setSelectedIds(fresh.permissions.map((permission) => permission.id));
    } catch {
      setEditing(role);
      setForm({
        name: role.name,
        description: role.description,
        fullAccess: role.fullAccess,
        active: role.active,
      });
      setSelectedIds(role.permissions.map((permission) => permission.id));
    }
    setModalOpen(true);
  };

  const openDetail = async (role: AdminRole) => {
    setDetail(role);
    try {
      const fresh = await fetchRoleById(role.id);
      setDetail((current) => (current?.id === role.id ? fresh : current));
    } catch {
      /* keep the list row */
    }
  };

  const toPayload = () => ({
    name: form.name,
    description: form.description,
    fullAccess: form.fullAccess,
    active: form.active,
    permissionIds: form.fullAccess ? [] : selectedIds,
  });

  const handleSave = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    try {
      if (editing) {
        await updateRole(editing.id, toPayload());
        toast.success(t("adminUi.roles.saved"));
      } else {
        await createRole(toPayload());
        toast.success(t("adminUi.roles.created"));
      }
      setModalOpen(false);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.roleSaveFailed"),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (role: AdminRole) => {
    try {
      const fresh = await fetchRoleById(role.id);
      await updateRole(role.id, {
        name: fresh.name,
        description: fresh.description,
        fullAccess: fresh.fullAccess,
        active: !fresh.active,
        permissionIds: fresh.permissions.map((permission) => permission.id),
      });
      toast.success(
        fresh.active
          ? t("adminUi.roles.deactivated")
          : t("adminUi.roles.activated"),
      );
      await loadList();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.roleSaveFailed"),
      );
    }
  };

  const runSoftDelete = async (id: number) => {
    try {
      await softDeleteRole(id);
      toast.success(t("adminUi.roles.deleted"));
      setConfirmSoftDelete(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.roleDeleteFailed"),
      );
    }
  };

  const runRestore = async (id: number) => {
    try {
      await restoreRole(id);
      toast.success(t("adminUi.roles.restored"));
      close();
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.roleRestoreFailed"),
      );
    }
  };

  const runPermanentDelete = async (id: number) => {
    try {
      await permanentDeleteRole(id);
      toast.success(t("adminUi.roles.deletedPermanent"));
      setConfirmPermanentDelete(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.roleDeleteFailed"),
      );
    }
  };

  const togglePermission = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleGroup = (ids: number[]) => {
    setSelectedIds((prev) => {
      const allOn = ids.every((id) => prev.includes(id));
      if (allOn) return prev.filter((id) => !ids.includes(id));
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return [...next];
    });
  };

  const onPermissionScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 64) {
      loadMorePermissions();
    }
  };

  const canSave = Boolean(form.name.trim());
  const hasFilters = Boolean(keyword || search || fullAccessFilter || activeFilter);
  const inputClass =
    "w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 min-h-[44px]";

  const moduleTitle = (module: string) =>
    module || t("adminUi.roles.otherModule");

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">
              {t("adminUi.pageTitles.roles")}
            </h2>
            <p className="text-sm text-foreground-500 mt-1">
              {viewMode === "active"
                ? `${totalItems} ${t("adminUi.roles.roles")}`
                : `${totalItems} ${t("adminUi.jobs.deleted")}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ColumnVisibilityDropdown
              columns={[
                { key: "name", label: t("adminUi.columns.role") },
                { key: "description", label: t("adminUi.columns.description") },
                { key: "fullAccess", label: t("adminUi.roles.fullAccess") },
                { key: "permissions", label: t("adminUi.columns.permCount") },
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
                {t("adminUi.roles.addRole")}
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
              placeholder={t("adminUi.roles.searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 min-h-[44px]"
            />
          </div>
          <CustomSelect
            outlined
            value={fullAccessFilter}
            onChange={setFullAccessFilter}
            options={fullAccessOptions}
            className="w-full sm:w-44"
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
                setFullAccessFilter("");
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
            {t("adminUi.roles.trashInfo")}
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
                {visibleColumns.includes("name") && (
                  <SortHeader
                    label={t("adminUi.columns.role").toUpperCase()}
                    field="name"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                    className="whitespace-nowrap"
                  />
                )}
                {visibleColumns.includes("description") && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">
                    {t("adminUi.columns.description").toUpperCase()}
                  </th>
                )}
                {visibleColumns.includes("fullAccess") && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">
                    {t("adminUi.roles.fullAccess").toUpperCase()}
                  </th>
                )}
                {visibleColumns.includes("permissions") && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">
                    {t("adminUi.columns.permCount").toUpperCase()}
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
                items.map((role) => (
                  <tr
                    key={role.id}
                    className="border-b border-background-100 hover:bg-background-50"
                  >
                    {visibleColumns.includes("name") && (
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => void openDetail(role)}
                          className="font-medium text-foreground-900 hover:text-primary-500 cursor-pointer text-left"
                        >
                          {role.name}
                        </button>
                      </td>
                    )}
                    {visibleColumns.includes("description") && (
                      <td className="px-5 py-3 text-foreground-600 max-w-[280px]">
                        <p className="line-clamp-2">{role.description || "—"}</p>
                      </td>
                    )}
                    {visibleColumns.includes("fullAccess") && (
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            role.fullAccess
                              ? "bg-primary-100 text-primary-700"
                              : "bg-background-100 text-foreground-600"
                          }`}
                        >
                          {role.fullAccess
                            ? t("adminUi.roles.fullAccess")
                            : t("adminUi.roles.limited")}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes("permissions") && (
                      <td className="px-5 py-3 whitespace-nowrap text-foreground-700">
                        {t("adminUi.roles.permissionsCount", {
                          count: role.permissions.length,
                        })}
                      </td>
                    )}
                    {visibleColumns.includes("active") && (
                      <td className="px-5 py-3 whitespace-nowrap">
                        {viewMode === "active" ? (
                          <button
                            type="button"
                            onClick={() => void toggleActive(role)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer min-h-[32px] ${
                              role.active
                                ? "bg-accent-100 text-accent-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {role.active
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
                        {formatDateTime(role.createdAt, lang)}
                      </td>
                    )}
                    {visibleColumns.includes("actions") && (
                      <td className="px-5 py-3 text-right">
                        {confirmSoftDelete === role.id && viewMode === "active" ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => void runSoftDelete(role.id)}
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
                        ) : confirmPermanentDelete === role.id &&
                          viewMode === "trash" ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => void runPermanentDelete(role.id)}
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
                            onClick={(e) => toggle(role.id, e)}
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
              ? t("adminUi.roles.trashEmpty")
              : hasFilters
                ? t("adminUi.roles.noRolesFiltered")
                : t("adminUi.roles.noRolesFound")}
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
              <h3 className="text-lg font-heading font-semibold text-foreground-950">
                {detail.name}
              </h3>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-100 cursor-pointer"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <dl className="space-y-3 text-sm mb-5">
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-500">
                  {t("adminUi.columns.description")}
                </dt>
                <dd className="text-foreground-800 text-right">
                  {detail.description || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-500">
                  {t("adminUi.roles.fullAccess")}
                </dt>
                <dd className="text-foreground-800">
                  {detail.fullAccess
                    ? t("adminUi.roles.fullAccess")
                    : t("adminUi.roles.limited")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-500">
                  {t("adminUi.columns.permCount")}
                </dt>
                <dd className="text-foreground-800">
                  {detail.permissions.length}
                </dd>
              </div>
            </dl>
            {detailGroups.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground-800">
                  {t("adminUi.roles.assignedPermissions")}
                </h4>
                {detailGroups.map((group) => (
                  <div key={group.module || "other"}>
                    <p className="text-xs font-semibold uppercase text-foreground-500 mb-1.5">
                      {moduleTitle(group.module)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((permission) => {
                        const moduleAccess = isModulePermission(permission);
                        return (
                          <span
                            key={permission.id}
                            className={`px-2.5 py-1 rounded-full text-xs ${
                              moduleAccess
                                ? "bg-primary-100 text-primary-700"
                                : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            {moduleAccess
                              ? t("adminUi.permissions.moduleAccessShort")
                              : permission.method}{" "}
                            {permission.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
          <div className="relative bg-background-50 border border-background-200 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl shadow-lg max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">
                {editing ? t("adminUi.roles.editRole") : t("adminUi.roles.addRole")}
              </h3>
              <button
                type="button"
                onClick={() => !saving && setModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-100 cursor-pointer"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div className="px-5 pb-5 overflow-y-auto">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-foreground-700">
                    {t("adminUi.roles.roleName")}
                  </span>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className={`${inputClass} mt-1.5`}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-foreground-700">
                    {t("adminUi.columns.description")}
                  </span>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder={t("adminUi.roles.roleDescriptionPlaceholder")}
                    className={`${inputClass} mt-1.5 resize-y`}
                  />
                </label>
                <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.fullAccess}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        fullAccess: e.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 accent-primary-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground-800">
                      {t("adminUi.roles.fullAccess")}
                    </span>
                    <span className="block text-xs text-foreground-500">
                      {t("adminUi.roles.fullAccessHint")}
                    </span>
                  </span>
                </label>
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

              {!form.fullAccess && (
                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground-800">
                        {t("adminUi.roles.pickPermissions")}
                      </h4>
                      <p className="text-xs text-foreground-500">
                        {t("adminUi.roles.pickPermissionsHint")}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-primary-700 whitespace-nowrap">
                      {t("adminUi.roles.selectedCount", {
                        count: selectedIds.length,
                      })}
                    </span>
                  </div>
                  <div className="relative mb-2">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                    <input
                      value={permSearch}
                      onChange={(e) => setPermSearch(e.target.value)}
                      placeholder={t("adminUi.roles.permissionSearch")}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 min-h-[44px]"
                    />
                  </div>
                  <div
                    ref={permListRef}
                    onScroll={onPermissionScroll}
                    className="max-h-[280px] sm:max-h-[340px] overflow-y-auto rounded-xl border border-background-200/70"
                  >
                    {permLoading && permItems.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-foreground-500">
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        {t("common.loading")}
                      </p>
                    ) : permissionGroups.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-foreground-500">
                        {t("adminUi.permissions.noPermissionsFound")}
                      </p>
                    ) : (
                      permissionGroups.map((group) => {
                        const ids = group.items.map((item) => item.id);
                        const allOn = ids.every((id) => selectedIds.includes(id));
                        const modulePerms = group.items.filter(isModulePermission);
                        const actionPerms = group.items.filter(
                          (item) => !isModulePermission(item),
                        );
                        const renderPermission = (permission: AdminPermission) => {
                          const moduleAccess = isModulePermission(permission);
                          return (
                            <label
                              key={permission.id}
                              className={`flex items-start gap-3 px-3 py-2.5 border-b border-background-100 cursor-pointer min-h-[44px] border-l-[3px] ${
                                moduleAccess
                                  ? "bg-primary-50/80 hover:bg-primary-50 border-l-primary-400"
                                  : "hover:bg-background-50 border-l-amber-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(permission.id)}
                                onChange={() => togglePermission(permission.id)}
                                className="mt-1 h-4 w-4 accent-primary-500"
                              />
                              <span className="min-w-0">
                                <span className="flex flex-wrap items-center gap-2">
                                  {moduleAccess ? (
                                    <span className="px-1.5 py-0.5 rounded bg-primary-100 text-[10px] font-semibold text-primary-700">
                                      {t("adminUi.permissions.moduleAccess")}
                                    </span>
                                  ) : (
                                    <>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${methodBadgeClass(permission.method)}`}
                                      >
                                        {permission.method || "GET"}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-[10px] font-semibold text-amber-800">
                                        {t("adminUi.permissions.action")}
                                      </span>
                                    </>
                                  )}
                                  <span className="text-sm text-foreground-900">
                                    {permission.name}
                                  </span>
                                </span>
                                <span className="block text-xs text-foreground-500 break-all">
                                  {permission.path}
                                </span>
                              </span>
                            </label>
                          );
                        };
                        return (
                          <div key={group.module || "other"}>
                            <label className="sticky top-0 z-10 flex items-center gap-3 px-3 py-2.5 bg-background-100 border-b border-background-200/70 cursor-pointer min-h-[44px]">
                              <input
                                type="checkbox"
                                checked={allOn}
                                onChange={() => toggleGroup(ids)}
                                className="h-4 w-4 accent-primary-500"
                              />
                              <span className="text-xs font-semibold uppercase tracking-wide text-foreground-700">
                                {moduleTitle(group.module)}
                              </span>
                            </label>
                            {modulePerms.length > 0 && (
                              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-primary-700">
                                <i className="ri-layout-grid-line mr-1"></i>
                                {t("adminUi.permissions.moduleAccess")}
                              </p>
                            )}
                            {modulePerms.map(renderPermission)}
                            {actionPerms.length > 0 && (
                              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-amber-800">
                                <i className="ri-flashlight-line mr-1"></i>
                                {t("adminUi.permissions.action")}
                              </p>
                            )}
                            {actionPerms.map(renderPermission)}
                          </div>
                        );
                      })
                    )}
                    {permLoadingMore && (
                      <p className="px-4 py-3 text-center text-xs text-foreground-500">
                        <i className="ri-loader-4-line animate-spin mr-1"></i>
                        {t("adminUi.roles.loadingMore")}
                      </p>
                    )}
                  </div>
                </div>
              )}

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
                    : t("adminUi.roles.addRole")}
                </button>
              </div>
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
