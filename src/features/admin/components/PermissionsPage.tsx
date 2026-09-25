import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchPermissions,
  createPermission,
  updatePermission,
  softDeletePermission,
  restorePermission,
  permanentDeletePermission,
  AdminAuthError,
  resolveAdminAuthErrorMessage,
} from "@/api";
import type { AdminPermission } from "@/types/adminAuth";
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

type SortField = "name" | "module" | "method" | "type" | "createdAt";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
const TYPES = ["ACTION", "MODULE"] as const;

type FormState = {
  name: string;
  description: string;
  module: string;
  path: string;
  method: string;
  type: string;
  active: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  module: "",
  path: "",
  method: "GET",
  type: "ACTION",
  active: true,
});

function typeLabel(
  type: string,
  t: (key: string) => string,
): string {
  if (type === "ACTION") return t("adminUi.permissions.action");
  if (type === "MODULE") return t("adminUi.permissions.moduleAccess");
  return type || "—";
}

export default function PermissionsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [viewMode, setViewMode] = useState<"active" | "trash">("active");
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [moduleQuery, setModuleQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [items, setItems] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [trashCount, setTrashCount] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPermission | null>(null);
  const [detail, setDetail] = useState<AdminPermission | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<number | null>(
    null,
  );
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<
    number | null
  >(null);
  const { openId, pos, menuRef, toggle, close } = useTableActionMenu<number>();
  const [form, setForm] = useState<FormState>(emptyForm());

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [visibleColumns, setVisibleColumns] = useState([
    "name",
    "module",
    "method",
    "path",
    "type",
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
      const res = await fetchPermissions({
        keyword: keyword || undefined,
        module: moduleQuery || undefined,
        method: methodFilter || undefined,
        type: typeFilter || undefined,
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
          : t("apiErrors.permissionLoadFailed");
      setLoadError(message);
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    keyword,
    moduleQuery,
    methodFilter,
    typeFilter,
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
      const res = await fetchPermissions({ deleted: true, page: 1, size: 1 });
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
    moduleQuery,
    methodFilter,
    typeFilter,
    activeFilter,
    viewMode,
    pageSize,
    sortField,
    sortOrder,
  ]);

  const activeItem = useMemo(
    () => items.find((item) => item.id === openId) ?? null,
    [items, openId],
  );

  const methodOptions = useMemo(
    () => [
      { value: "", label: t("adminUi.permissions.allMethods") },
      ...METHODS.map((m) => ({ value: m, label: m })),
    ],
    [t],
  );

  const typeOptions = useMemo(
    () => [
      { value: "", label: t("adminUi.permissions.allTypes") },
      ...TYPES.map((type) => ({ value: type, label: typeLabel(type, t) })),
    ],
    [t],
  );

  const formMethodOptions = useMemo(
    () => METHODS.map((m) => ({ value: m, label: m })),
    [],
  );

  const formTypeOptions = useMemo(
    () => TYPES.map((type) => ({ value: type, label: typeLabel(type, t) })),
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

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (item: AdminPermission) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description,
      module: item.module,
      path: item.path,
      method: item.method || "GET",
      type: item.type || "ACTION",
      active: item.active,
    });
    setModalOpen(true);
    close();
  };

  const handleSave = async () => {
    if (
      !form.name.trim() ||
      !form.module.trim() ||
      !form.path.trim() ||
      !form.method ||
      !form.type ||
      saving
    ) {
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        module: form.module,
        path: form.path,
        method: form.method,
        type: form.type,
        active: form.active,
      };
      if (editing) {
        await updatePermission(editing.id, payload);
        toast.success(t("adminUi.permissions.saved"));
      } else {
        await createPermission(payload);
        toast.success(t("adminUi.permissions.created"));
      }
      setModalOpen(false);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.permissionSaveFailed"),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: AdminPermission) => {
    try {
      await updatePermission(item.id, {
        name: item.name,
        description: item.description,
        module: item.module,
        path: item.path,
        method: item.method,
        type: item.type,
        active: !item.active,
      });
      toast.success(
        item.active
          ? t("adminUi.permissions.deactivated")
          : t("adminUi.permissions.activated"),
      );
      await loadList();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.permissionSaveFailed"),
      );
    }
  };

  const runSoftDelete = async (id: number) => {
    try {
      await softDeletePermission(id);
      toast.success(t("adminUi.permissions.deleted"));
      setConfirmSoftDelete(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.permissionDeleteFailed"),
      );
    }
  };

  const runRestore = async (id: number) => {
    try {
      await restorePermission(id);
      toast.success(t("adminUi.permissions.restored"));
      close();
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.permissionRestoreFailed"),
      );
    }
  };

  const runPermanentDelete = async (id: number) => {
    try {
      await permanentDeletePermission(id);
      toast.success(t("adminUi.permissions.deletedPermanent"));
      setConfirmPermanentDelete(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.permissionDeleteFailed"),
      );
    }
  };

  const canSave = Boolean(
    form.name.trim() &&
      form.module.trim() &&
      form.path.trim() &&
      form.method &&
      form.type,
  );
  const hasFilters = Boolean(
    keyword ||
      search ||
      moduleFilter ||
      moduleQuery ||
      methodFilter ||
      typeFilter ||
      activeFilter,
  );

  const inputClass =
    "w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 min-h-[44px]";

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">
              {t("adminUi.pageTitles.permissions")}
            </h2>
            <p className="text-sm text-foreground-500 mt-1">
              {viewMode === "active"
                ? `${totalItems} ${t("adminUi.permissions.permissions")}`
                : `${totalItems} ${t("adminUi.jobs.deleted")}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ColumnVisibilityDropdown
              columns={[
                { key: "name", label: t("adminUi.columns.perm") },
                { key: "module", label: t("adminUi.columns.module") },
                { key: "method", label: t("adminUi.columns.method") },
                { key: "path", label: t("adminUi.columns.path") },
                { key: "type", label: t("adminUi.columns.type") },
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
                {t("adminUi.permissions.addPermission")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewMode("active")}
              className={`inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border cursor-pointer ${
                viewMode === "active"
                  ? "border-primary-200 bg-primary-100 text-primary-700"
                  : "border-background-200/70 bg-background-50 text-foreground-600"
              }`}
            >
              <i className="ri-key-2-line"></i>
              {t("adminUi.actions.active")}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("trash")}
              className={`inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border cursor-pointer ${
                viewMode === "trash"
                  ? "border-red-200 bg-red-100 text-red-600"
                  : "border-background-200/70 bg-background-50 text-foreground-600"
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

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
          <div className="relative flex-1 min-w-[180px] sm:max-w-[240px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm pointer-events-none"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setKeyword(search.trim());
                  setModuleQuery(moduleFilter.trim());
                }
              }}
              placeholder={t("adminUi.permissions.searchPlaceholder")}
              className="w-full h-10 pl-9 pr-4 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300"
            />
          </div>
          <input
            type="text"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setModuleQuery(moduleFilter.trim());
            }}
            placeholder={t("adminUi.columns.module")}
            className="h-10 px-3 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 w-full sm:w-[160px]"
          />
          <div className="w-full sm:w-[140px]">
            <CustomSelect
              value={methodFilter}
              options={methodOptions}
              onChange={setMethodFilter}
              outlined
            />
          </div>
          <div className="w-full sm:w-[160px]">
            <CustomSelect
              value={typeFilter}
              options={typeOptions}
              onChange={setTypeFilter}
              outlined
            />
          </div>
          <div className="w-full sm:w-[150px]">
            <CustomSelect
              value={activeFilter}
              options={activeFilterOptions}
              onChange={setActiveFilter}
              outlined
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setKeyword(search.trim());
              setModuleQuery(moduleFilter.trim());
            }}
            className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-xl bg-primary-500 text-white hover:bg-primary-600 cursor-pointer"
          >
            {t("common.search")}
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setKeyword("");
                setModuleFilter("");
                setModuleQuery("");
                setMethodFilter("");
                setTypeFilter("");
                setActiveFilter("");
              }}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm rounded-xl border border-background-200/70 bg-background-50 text-foreground-600 cursor-pointer"
            >
              <i className="ri-filter-off-line"></i>
              {t("adminUi.actions.clearFilters")}
            </button>
          )}
        </div>
      </div>

      {viewMode === "trash" && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-700">
            <i className="ri-information-line mr-1"></i>
            {t("adminUi.permissions.trashInfo")}
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
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-background-200/70">
                {visibleColumns.includes("name") && (
                  <SortHeader
                    label={t("adminUi.columns.perm").toUpperCase()}
                    field="name"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes("module") && (
                  <SortHeader
                    label={t("adminUi.columns.module").toUpperCase()}
                    field="module"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes("method") && (
                  <SortHeader
                    label={t("adminUi.columns.method").toUpperCase()}
                    field="method"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes("path") && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                    {t("adminUi.columns.path").toUpperCase()}
                  </th>
                )}
                {visibleColumns.includes("type") && (
                  <SortHeader
                    label={t("adminUi.columns.type").toUpperCase()}
                    field="type"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes("active") && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
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
                  />
                )}
                {visibleColumns.includes("actions") && (
                  <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500 w-[80px]">
                    {t("adminUi.columns.actions").toUpperCase()}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-foreground-500">
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    {t("common.loading")}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-background-100 hover:bg-background-50"
                  >
                    {visibleColumns.includes("name") && (
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => setDetail(item)}
                          className="font-medium text-foreground-900 hover:text-primary-500 cursor-pointer text-left"
                        >
                          {item.name}
                        </button>
                        {item.description && (
                          <p className="text-xs text-foreground-500 mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("module") && (
                      <td className="px-5 py-3 text-foreground-700 whitespace-nowrap">
                        {item.module || "—"}
                      </td>
                    )}
                    {visibleColumns.includes("method") && (
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-background-100 text-xs font-semibold text-foreground-700">
                          {item.method || "—"}
                        </span>
                      </td>
                    )}
                    {visibleColumns.includes("path") && (
                      <td className="px-5 py-3 text-foreground-600 text-xs max-w-[240px] truncate">
                        {item.path || "—"}
                      </td>
                    )}
                    {visibleColumns.includes("type") && (
                      <td className="px-5 py-3 whitespace-nowrap text-foreground-700">
                        {typeLabel(item.type, t)}
                      </td>
                    )}
                    {visibleColumns.includes("active") && (
                      <td className="px-5 py-3 whitespace-nowrap">
                        {viewMode === "active" ? (
                          <button
                            type="button"
                            onClick={() => void toggleActive(item)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer ${
                              item.active
                                ? "bg-accent-100 text-accent-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {item.active
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
                        {formatDateTime(item.createdAt, lang)}
                      </td>
                    )}
                    {visibleColumns.includes("actions") && (
                      <td className="px-5 py-3 text-right">
                        {confirmSoftDelete === item.id && viewMode === "active" ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => void runSoftDelete(item.id)}
                              className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium cursor-pointer"
                            >
                              {t("adminUi.jobs.confirmDelete")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmSoftDelete(null)}
                              className="px-2.5 py-1 border border-background-300 rounded-lg text-xs cursor-pointer"
                            >
                              {t("adminUi.actions.cancel")}
                            </button>
                          </div>
                        ) : confirmPermanentDelete === item.id &&
                          viewMode === "trash" ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => void runPermanentDelete(item.id)}
                              className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium cursor-pointer"
                            >
                              {t("adminUi.jobs.deletePermanent")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmPermanentDelete(null)}
                              className="px-2.5 py-1 border border-background-300 rounded-lg text-xs cursor-pointer"
                            >
                              {t("adminUi.actions.cancel")}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => toggle(item.id, e)}
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
              ? t("adminUi.permissions.trashEmpty")
              : hasFilters
                ? t("adminUi.permissions.noPermissionsFiltered")
                : t("adminUi.permissions.noPermissionsFound")}
          </div>
        )}
        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDetail(null)}
          ></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-lg shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
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
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-500">{t("adminUi.columns.description")}</dt>
                <dd className="text-foreground-800 text-right">{detail.description || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-500">{t("adminUi.columns.module")}</dt>
                <dd className="text-foreground-800">{detail.module || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-500">{t("adminUi.columns.method")}</dt>
                <dd className="text-foreground-800">{detail.method || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-500">{t("adminUi.columns.path")}</dt>
                <dd className="text-foreground-800 text-right break-all">{detail.path || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-500">{t("adminUi.columns.type")}</dt>
                <dd className="text-foreground-800">{typeLabel(detail.type, t)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-foreground-500">{t("adminUi.columns.active")}</dt>
                <dd className="text-foreground-800">
                  {detail.active ? t("adminUi.jobs.on") : t("adminUi.jobs.off")}
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
                    openEdit(detail);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !saving && setModalOpen(false)}
          ></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">
                {editing
                  ? t("adminUi.permissions.editPermission")
                  : t("adminUi.permissions.addPermission")}
              </h3>
              <button
                type="button"
                onClick={() => !saving && setModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-100 cursor-pointer"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("adminUi.permissions.permissionName")} *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  placeholder={t("adminUi.permissions.permissionNamePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("adminUi.columns.description")}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className={`${inputClass} min-h-[88px] resize-y`}
                  placeholder={t("adminUi.permissions.permissionDescPlaceholder")}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("adminUi.columns.module")} *
                  </label>
                  <input
                    type="text"
                    value={form.module}
                    onChange={(e) => setForm({ ...form, module: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("adminUi.permissions.permissionType")} *
                  </label>
                  <CustomSelect
                    value={form.type}
                    options={formTypeOptions}
                    onChange={(v) => setForm({ ...form, type: v })}
                    outlined
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("adminUi.columns.method")} *
                  </label>
                  <CustomSelect
                    value={form.method}
                    options={formMethodOptions}
                    onChange={(v) => setForm({ ...form, method: v })}
                    outlined
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("adminUi.columns.path")} *
                  </label>
                  <input
                    type="text"
                    value={form.path}
                    onChange={(e) => setForm({ ...form, path: e.target.value })}
                    className={inputClass}
                    placeholder="/admin/permissions"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("adminUi.columns.active")}
                </label>
                <CustomSelect
                  value={form.active ? "true" : "false"}
                  options={[
                    { value: "true", label: t("adminUi.jobs.on") },
                    { value: "false", label: t("adminUi.jobs.off") },
                  ]}
                  onChange={(v) => setForm({ ...form, active: v === "true" })}
                  outlined
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="flex-1 py-2.5 border border-background-300 rounded-xl text-sm font-medium cursor-pointer min-h-[44px]"
              >
                {t("adminUi.actions.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!canSave || saving}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer min-h-[44px] flex items-center justify-center gap-2 ${
                  canSave && !saving
                    ? "bg-primary-500 text-white hover:bg-primary-600"
                    : "bg-background-200 text-foreground-400 cursor-not-allowed"
                }`}
              >
                {saving && <i className="ri-loader-4-line animate-spin"></i>}
                {editing
                  ? t("adminUi.jobs.saveChanges")
                  : t("adminUi.permissions.addPermission")}
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
                setDetail(activeItem);
                close();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-background-100 cursor-pointer"
            >
              <i className="ri-eye-line text-primary-500"></i>
              {t("adminUi.jobs.viewDetails")}
            </button>
            <button
              type="button"
              onClick={() => openEdit(activeItem)}
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
