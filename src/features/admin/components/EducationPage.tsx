import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchEducationLevels,
  createEducationLevel,
  updateEducationLevel,
  softDeleteEducationLevel,
  restoreEducationLevel,
  permanentDeleteEducationLevel,
  AdminAuthError,
  resolveAdminAuthErrorMessage,
} from "@/api";
import type { EducationLevel } from "@/types/catalog";
import { educationLevelDisplayName } from "@/types/catalog";
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

type SortField = "sortOrder" | "nameVi" | "nameEn" | "createdAt" | "updatedAt";

type FormState = {
  nameVi: string;
  nameEn: string;
  sortOrder: string;
  active: boolean;
};

const emptyForm = (): FormState => ({
  nameVi: "",
  nameEn: "",
  sortOrder: "0",
  active: true,
});

export default function EducationPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [viewMode, setViewMode] = useState<"active" | "trash">("active");
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [items, setItems] = useState<EducationLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [trashCount, setTrashCount] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EducationLevel | null>(null);
  const [detail, setDetail] = useState<EducationLevel | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<number | null>(
    null,
  );
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<
    number | null
  >(null);
  const { openId, pos, menuRef, toggle, close } = useTableActionMenu<number>();
  const [form, setForm] = useState<FormState>(emptyForm());

  const [sortField, setSortField] = useState<SortField>("sortOrder");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [visibleColumns, setVisibleColumns] = useState([
    "name",
    "sortOrder",
    "active",
    "createdAt",
    "updatedAt",
    "actions",
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (field: string) => {
    if (sortField === field)
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortField(field as SortField);
      setSortOrder("asc");
    }
  };

  const loadList = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetchEducationLevels({
        keyword: keyword || undefined,
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
          : t("apiErrors.educationLoadFailed");
      setLoadError(message);
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    keyword,
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
      const res = await fetchEducationLevels({
        deleted: true,
        page: 1,
        size: 1,
      });
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
  }, [keyword, activeFilter, viewMode, pageSize, sortField, sortOrder]);

  const activeItem = useMemo(
    () => items.find((item) => item.id === openId) ?? null,
    [items, openId],
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

  const openEdit = (item: EducationLevel) => {
    setEditing(item);
    setForm({
      nameVi: item.nameVi,
      nameEn: item.nameEn,
      sortOrder: String(item.sortOrder ?? 0),
      active: item.active,
    });
    setModalOpen(true);
    close();
  };

  const handleSave = async () => {
    if (!form.nameVi.trim() || !form.nameEn.trim() || saving) return;
    setSaving(true);
    try {
      const payload = {
        nameVi: form.nameVi,
        nameEn: form.nameEn,
        sortOrder: Number(form.sortOrder) || 0,
        active: form.active,
      };
      if (editing) {
        await updateEducationLevel(editing.id, payload);
        toast.success(t("adminUi.education.saved"));
      } else {
        await createEducationLevel(payload);
        toast.success(t("adminUi.education.created"));
      }
      setModalOpen(false);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      const message =
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.educationSaveFailed");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const runSoftDelete = async (id: number) => {
    try {
      await softDeleteEducationLevel(id);
      toast.success(t("adminUi.education.deleted"));
      setConfirmSoftDelete(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.educationDeleteFailed"),
      );
    }
  };

  const runRestore = async (id: number) => {
    try {
      await restoreEducationLevel(id);
      toast.success(t("adminUi.education.restored"));
      close();
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.educationRestoreFailed"),
      );
    }
  };

  const runPermanentDelete = async (id: number) => {
    try {
      await permanentDeleteEducationLevel(id);
      toast.success(t("adminUi.education.deletedPermanent"));
      setConfirmPermanentDelete(null);
      await loadList();
      await loadTrashCount();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.educationDeleteFailed"),
      );
    }
  };

  const toggleActiveOnEdit = async (item: EducationLevel) => {
    const nextActive = !item.active;
    try {
      await updateEducationLevel(item.id, {
        nameVi: item.nameVi,
        nameEn: item.nameEn,
        sortOrder: item.sortOrder,
        active: nextActive,
      });
      toast.success(
        nextActive
          ? t("adminUi.education.activated")
          : t("adminUi.education.deactivated"),
      );
      await loadList();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.educationSaveFailed"),
      );
    }
  };

  const canSave = Boolean(form.nameVi.trim() && form.nameEn.trim()) && !saving;

  const hasFilters = Boolean(keyword || search || activeFilter);

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">
              {t("adminUi.pageTitles.education")}
            </h2>
            <p className="text-sm text-foreground-500 mt-1">
              {viewMode === "active"
                ? `${totalItems} ${t("adminUi.education.levels")}`
                : `${totalItems} ${t("adminUi.jobs.deleted")}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ColumnVisibilityDropdown
              columns={[
                { key: "name", label: t("adminUi.columns.name") },
                { key: "sortOrder", label: t("adminUi.columns.order") },
                { key: "active", label: t("adminUi.columns.active") },
                { key: "createdAt", label: t("adminUi.columns.createdAt") },
                { key: "updatedAt", label: t("adminUi.columns.updatedAt") },
                { key: "actions", label: t("adminUi.columns.actions") },
              ]}
              visibleKeys={visibleColumns}
              onChange={setVisibleColumns}
            />
            {viewMode === "active" && (
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border border-primary-500 bg-primary-500 text-white hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line"></i>{" "}
                {t("adminUi.education.addLevel")}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setViewMode("active");
                setSearch("");
                setKeyword("");
              }}
              className={`inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === "active"
                  ? "border-primary-200 bg-primary-100 text-primary-700"
                  : "border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100"
              }`}
            >
              <i className="ri-graduation-cap-line"></i>
              {t("adminUi.actions.active")}
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("trash");
                setSearch("");
                setKeyword("");
              }}
              className={`inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === "trash"
                  ? "border-red-200 bg-red-100 text-red-600"
                  : "border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100"
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap">
          <div className="relative flex-1 w-full sm:max-w-[280px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm pointer-events-none"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setKeyword(search.trim());
              }}
              placeholder={t("adminUi.education.searchPlaceholder")}
              className="w-full h-10 pl-9 pr-4 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors"
            />
          </div>
          <div className="w-full sm:w-[160px]">
            <CustomSelect
              value={activeFilter}
              options={activeFilterOptions}
              onChange={setActiveFilter}
              placeholder={t("adminUi.filters.allStatuses")}
              outlined
            />
          </div>
          <button
            type="button"
            onClick={() => setKeyword(search.trim())}
            className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-xl border border-primary-500 bg-primary-500 text-white hover:bg-primary-600 cursor-pointer whitespace-nowrap"
          >
            {t("common.search")}
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setKeyword("");
                setActiveFilter("");
              }}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm rounded-xl border border-background-200/70 bg-background-50 text-foreground-600 hover:bg-background-100 cursor-pointer whitespace-nowrap"
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
            {t("adminUi.education.trashInfo")}
          </p>
        </div>
      )}

      {loadError ? (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          <span className="flex-1 flex items-start gap-2">
            <i className="ri-error-warning-line mt-0.5"></i>
            {loadError}
          </span>
          <button
            type="button"
            onClick={() => void loadList()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-100 cursor-pointer"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : null}

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-background-200/70">
                {visibleColumns.includes("name") && (
                  <SortHeader
                    label={t("adminUi.columns.name").toUpperCase()}
                    field={
                      lang.toLowerCase().startsWith("en") ? "nameEn" : "nameVi"
                    }
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                )}
                {visibleColumns.includes("sortOrder") && (
                  <SortHeader
                    label={t("adminUi.columns.order").toUpperCase()}
                    field="sortOrder"
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
                {visibleColumns.includes("updatedAt") && (
                  <SortHeader
                    label={t("adminUi.columns.updatedAt").toUpperCase()}
                    field="updatedAt"
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
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-foreground-500"
                  >
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    {t("common.loading")}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-background-100 hover:bg-background-50 transition-colors"
                  >
                    {visibleColumns.includes("name") && (
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => setDetail(item)}
                          className="font-medium text-foreground-900 hover:text-primary-500 cursor-pointer text-left"
                        >
                          {educationLevelDisplayName(item, lang)}
                        </button>
                        <p className="text-[11px] text-foreground-400 mt-0.5 truncate max-w-[220px]">
                          {lang.toLowerCase().startsWith("en")
                            ? item.nameVi
                            : item.nameEn}
                        </p>
                      </td>
                    )}
                    {visibleColumns.includes("sortOrder") && (
                      <td className="px-5 py-3 text-foreground-600 whitespace-nowrap text-xs">
                        {item.sortOrder}
                      </td>
                    )}
                    {visibleColumns.includes("active") && (
                      <td className="px-5 py-3 whitespace-nowrap">
                        {viewMode === "active" ? (
                          <button
                            type="button"
                            onClick={() => void toggleActiveOnEdit(item)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                              item.active
                                ? "bg-accent-100 text-accent-600 hover:bg-accent-200"
                                : "bg-red-100 text-red-600 hover:bg-red-200"
                            }`}
                          >
                            {item.active
                              ? t("adminUi.jobs.on")
                              : t("adminUi.jobs.off")}
                          </button>
                        ) : (
                          <span
                            className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                              item.active
                                ? "bg-accent-100 text-accent-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {item.active
                              ? t("adminUi.jobs.on")
                              : t("adminUi.jobs.off")}
                          </span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("createdAt") && (
                      <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                        {formatDateTime(item.createdAt, lang)}
                      </td>
                    )}
                    {visibleColumns.includes("updatedAt") && (
                      <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                        {formatDateTime(item.updatedAt, lang)}
                      </td>
                    )}
                    {visibleColumns.includes("actions") && (
                      <td className="px-5 py-3 text-right whitespace-nowrap relative">
                        {confirmSoftDelete === item.id &&
                        viewMode === "active" ? (
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
                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background-100 cursor-pointer"
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
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
              <i className="ri-graduation-cap-line text-2xl text-foreground-400"></i>
            </div>
            <p className="text-sm text-foreground-500">
              {viewMode === "active"
                ? hasFilters
                  ? t("adminUi.education.noLevelsFiltered")
                  : t("adminUi.education.noLevelsFound")
                : t("adminUi.education.trashEmpty")}
            </p>
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
            <div className="flex items-start justify-between mb-5 gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-heading font-semibold text-foreground-950 break-words">
                  {educationLevelDisplayName(detail, lang)}
                </h3>
                <p className="text-xs text-foreground-500 mt-1">
                  {t("adminUi.education.levelDetail")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-background-100 cursor-pointer flex-shrink-0"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-background-100 rounded-xl">
                  <p className="text-xs text-foreground-500 mb-1">
                    {t("adminUi.industryGroups.nameVi")}
                  </p>
                  <p className="font-medium text-foreground-900">
                    {detail.nameVi || "—"}
                  </p>
                </div>
                <div className="p-3 bg-background-100 rounded-xl">
                  <p className="text-xs text-foreground-500 mb-1">
                    {t("adminUi.industryGroups.nameEn")}
                  </p>
                  <p className="font-medium text-foreground-900">
                    {detail.nameEn || "—"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-background-100 rounded-xl">
                  <p className="text-xs text-foreground-500">
                    {t("adminUi.columns.order")}
                  </p>
                  <p className="text-xl font-bold text-foreground-900">
                    {detail.sortOrder}
                  </p>
                </div>
                <div className="p-3 bg-background-100 rounded-xl">
                  <p className="text-xs text-foreground-500">
                    {t("adminUi.columns.active")}
                  </p>
                  <p className="text-sm font-medium text-foreground-900 mt-1">
                    {detail.active
                      ? t("adminUi.jobs.on")
                      : t("adminUi.jobs.off")}
                  </p>
                </div>
                <div className="p-3 bg-background-100 rounded-xl">
                  <p className="text-xs text-foreground-500">
                    {t("adminUi.columns.createdAt")}
                  </p>
                  <p className="text-sm font-medium text-foreground-900 mt-1">
                    {formatDateTime(detail.createdAt, lang)}
                  </p>
                </div>
                <div className="p-3 bg-background-100 rounded-xl">
                  <p className="text-xs text-foreground-500">
                    {t("adminUi.columns.updatedAt")}
                  </p>
                  <p className="text-sm font-medium text-foreground-900 mt-1">
                    {formatDateTime(detail.updatedAt, lang)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
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
                  ? t("adminUi.education.editLevel")
                  : t("adminUi.education.addLevel")}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("adminUi.industryGroups.nameVi")} *
                  </label>
                  <input
                    type="text"
                    value={form.nameVi}
                    onChange={(e) =>
                      setForm({ ...form, nameVi: e.target.value })
                    }
                    className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 min-h-[44px]"
                    placeholder={t("adminUi.education.namePlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("adminUi.industryGroups.nameEn")} *
                  </label>
                  <input
                    type="text"
                    value={form.nameEn}
                    onChange={(e) =>
                      setForm({ ...form, nameEn: e.target.value })
                    }
                    className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 min-h-[44px]"
                    placeholder={t("adminUi.education.namePlaceholder")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                    {t("adminUi.columns.order")}
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: e.target.value })
                    }
                    className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 min-h-[44px]"
                  />
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
                  />
                </div>
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
                disabled={!canSave}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer min-h-[44px] flex items-center justify-center gap-2 ${
                  canSave
                    ? "bg-primary-500 text-white hover:bg-primary-600"
                    : "bg-background-200 text-foreground-400 cursor-not-allowed"
                }`}
              >
                {saving && <i className="ri-loader-4-line animate-spin"></i>}
                {editing
                  ? t("adminUi.jobs.saveChanges")
                  : t("adminUi.education.addLevel")}
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
              onClick={() => {
                openEdit(activeItem);
                close();
              }}
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
              onClick={() => {
                void runRestore(activeItem.id);
                close();
              }}
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
