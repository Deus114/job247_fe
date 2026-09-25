import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCompanies } from "@/features/companies";
import { useJobs } from "@/features/jobs";
import type { Company } from "@/types/company";
import CustomSelect from "@/components/ui/CustomSelect";
import SortHeader from "@/components/ui/SortHeader";
import ColumnVisibilityDropdown from "@/components/ui/ColumnVisibilityDropdown";
import Pagination from "@/components/ui/Pagination";
import {
  useTableActionMenu,
  TableActionMenu,
} from "@/components/ui/TableActionMenu";

type SortField = "name" | "industry" | "size" | "createdAt";

export default function CompaniesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    companies: allCompanies,
    updateCompany,
    deleteCompany,
    restoreCompany,
    permanentDeleteCompany,
    approveCompany,
    rejectCompany,
    setRevisionNeeded,
    toggleCompanyActive,
  } = useCompanies();
  const { jobs } = useJobs();
  const { openId, pos, menuRef, toggle, close } = useTableActionMenu<string>();
  const [viewMode, setViewMode] = useState<"active" | "trash">("active");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Company["status"]>(
    "all",
  );
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] = useState<string | null>(
    null,
  );
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<
    string | null
  >(null);
  const [revisionModal, setRevisionModal] = useState<{
    open: boolean;
    companyId: string;
    companyName: string;
  }>({ open: false, companyId: "", companyName: "" });
  const [revisionNote, setRevisionNote] = useState("");
  const [detailCompany, setDetailCompany] = useState<Company | null>(null);

  const [form, setForm] = useState<Partial<Company>>();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "name",
    "industry",
    "size",
    "jobs",
    "status",
    "active",
    "createdAt",
    "actions",
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const handleSort = (field: string) => {
    if (sortField === field)
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortField(field as SortField);
      setSortOrder("asc");
    }
  };

  const visibleCompanies = useMemo(() => {
    return viewMode === "active"
      ? allCompanies.filter((c) => !c.deletedAt)
      : allCompanies.filter((c) => !!c.deletedAt);
  }, [allCompanies, viewMode]);

  const allIndustries = useMemo(
    () => [
      ...new Set(
        allCompanies
          .filter((c) => !c.deletedAt)
          .map((c) => c.industry)
          .filter(Boolean),
      ),
    ],
    [allCompanies],
  );
  const allSizes = useMemo(
    () => [
      ...new Set(
        allCompanies
          .filter((c) => !c.deletedAt)
          .map((c) => c.size)
          .filter(Boolean),
      ),
    ],
    [allCompanies],
  );
  const allLocations = useMemo(
    () => [
      ...new Set(
        allCompanies
          .filter((c) => !c.deletedAt)
          .map((c) => c.location)
          .filter(Boolean),
      ),
    ],
    [allCompanies],
  );

  const filtered = useMemo(() => {
    let list = visibleCompanies.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.contactEmail?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchIndustry =
        industryFilter === "all" || c.industry === industryFilter;
      const matchSize = sizeFilter === "all" || c.size === sizeFilter;
      const matchLocation =
        locationFilter === "all" || c.location === locationFilter;
      const matchFrom = !dateFrom || c.createdAt >= dateFrom;
      const matchTo = !dateTo || c.createdAt <= dateTo;
      return (
        matchSearch &&
        matchStatus &&
        matchIndustry &&
        matchSize &&
        matchLocation &&
        matchFrom &&
        matchTo
      );
    });
    list = [...list].sort((a, b) => {
      const aVal = (a[sortField] ?? "") as string;
      const bVal = (b[sortField] ?? "") as string;
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
    return list;
  }, [
    visibleCompanies,
    search,
    statusFilter,
    industryFilter,
    sizeFilter,
    locationFilter,
    dateFrom,
    dateTo,
    sortField,
    sortOrder,
  ]);

  const paginatedCompanies = useMemo(() => {
    return filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filtered, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    industryFilter,
    sizeFilter,
    locationFilter,
    dateFrom,
    dateTo,
    viewMode,
    pageSize,
  ]);

  const statusConfig: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    pending: {
      label: t("adminUi.status.pending"),
      color: "text-yellow-700",
      bg: "bg-yellow-100",
    },
    approved: {
      label: t("adminUi.status.approved"),
      color: "text-accent-600",
      bg: "bg-accent-100",
    },
    rejected: {
      label: t("adminUi.status.rejected"),
      color: "text-red-600",
      bg: "bg-red-100",
    },
    needs_revision: {
      label: t("adminUi.status.needs_revision"),
      color: "text-orange-700",
      bg: "bg-orange-100",
    },
  };

  const statusOptions = [
    { value: "all", label: t("adminUi.filters.allStatuses") },
    { value: "pending", label: t("adminUi.status.pending") },
    { value: "approved", label: t("adminUi.status.approved") },
    { value: "rejected", label: t("adminUi.status.rejected") },
    { value: "needs_revision", label: t("adminUi.status.needs_revision") },
  ];

  const industryOptions = [
    { value: "all", label: t("adminUi.filters.allCategories") },
    ...allIndustries.map((ind) => ({ value: ind, label: ind })),
  ];

  const sizeOptions = [
    { value: "all", label: t("adminUi.companies.allSizes") },
    ...allSizes.map((s) => ({
      value: s,
      label: `${s} ${t("adminUi.companies.employeesShort")}`,
    })),
  ];

  const locationOptions = [
    { value: "all", label: t("adminUi.filters.allLocations") },
    ...allLocations.map((loc) => ({ value: loc, label: loc })),
  ];

  const openEdit = (company: Company) => {
    setEditingCompany(company);
    setForm({ ...company });
    setModalOpen(true);
    close();
  };

  const handleSave = () => {
    if (editingCompany && form.name?.trim()) {
      updateCompany({ id: editingCompany.id, ...form } as Company);
      setModalOpen(false);
    }
  };

  const handleRevision = () => {
    if (!revisionNote.trim()) return;
    setRevisionNeeded({
      id: revisionModal.companyId,
      note: revisionNote.trim(),
    });
    setRevisionModal({ open: false, companyId: "", companyName: "" });
    setRevisionNote("");
  };

  const hasActiveFilters =
    search ||
    statusFilter !== "all" ||
    industryFilter !== "all" ||
    sizeFilter !== "all" ||
    locationFilter !== "all" ||
    dateFrom ||
    dateTo;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setIndustryFilter("all");
    setSizeFilter("all");
    setLocationFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const activeCount = allCompanies.filter((c) => !c.deletedAt).length;
  const trashCount = allCompanies.filter((c) => !!c.deletedAt).length;
  const activeItem = paginatedCompanies.find((x) => x.id === openId);

  const allColumns = [
    { key: "name", label: t("adminUi.columns.name") },
    { key: "industry", label: t("adminUi.companies.industry") },
    { key: "size", label: t("adminUi.columns.size") },
    { key: "jobs", label: t("adminUi.columns.applications") },
    { key: "status", label: t("adminUi.columns.status") },
    { key: "createdAt", label: t("adminUi.columns.createdAt") },
    ...(viewMode === "trash"
      ? [{ key: "deletedAt", label: t("adminUi.columns.deletedAt") }]
      : []),
    { key: "active", label: t("adminUi.columns.active") },
    { key: "actions", label: t("adminUi.columns.actions") },
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground-950">
              {t("adminUi.pageTitles.companies")}
            </h2>
            <p className="text-sm text-foreground-500 mt-1">
              {viewMode === "active"
                ? `${filtered.length} / ${activeCount} ${t("adminUi.companies.companies")}`
                : `${filtered.length} / ${trashCount} ${t("adminUi.companies.deleted")}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ColumnVisibilityDropdown
              columns={allColumns}
              visibleKeys={visibleColumns}
              onChange={setVisibleColumns}
            />
            <button
              onClick={() => {
                setViewMode("active");
                clearFilters();
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === "active"
                  ? "bg-primary-100 text-primary-700"
                  : "text-foreground-500 hover:bg-background-100"
              }`}
            >
              <i className="ri-building-line mr-1"></i>{" "}
              {t("adminUi.actions.active")}
            </button>
            <button
              onClick={() => {
                setViewMode("trash");
                clearFilters();
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                viewMode === "trash"
                  ? "bg-red-100 text-red-600"
                  : "text-foreground-500 hover:bg-background-100"
              }`}
            >
              <i className="ri-delete-bin-line mr-1"></i>{" "}
              {t("adminUi.actions.trash")}{" "}
              {trashCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px]">
                  {trashCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <div className="relative flex-1 w-full sm:max-w-[200px]">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("adminUi.companies.searchPlaceholder")}
                className="w-full pl-9 pr-4 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 transition-colors"
              />
            </div>
            <CustomSelect
              value={statusFilter}
              options={statusOptions}
              onChange={(v) => setStatusFilter(v as typeof statusFilter)}
              compact
              className="w-full sm:w-[160px]"
            />
            <CustomSelect
              value={industryFilter}
              options={industryOptions}
              onChange={setIndustryFilter}
              compact
              className="w-full sm:w-[160px]"
            />
            <CustomSelect
              value={sizeFilter}
              options={sizeOptions}
              onChange={setSizeFilter}
              compact
              className="w-full sm:w-[160px]"
            />
            <CustomSelect
              value={locationFilter}
              options={locationOptions}
              onChange={setLocationFilter}
              compact
              className="w-full sm:w-[160px]"
            />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300"
                title={t("adminUi.jobs.dateFrom")}
              />
              <span className="text-xs text-foreground-400">
                {t("adminUi.jobs.to")}
              </span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300"
                title={t("adminUi.jobs.dateTo")}
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-foreground-500 hover:text-foreground-700 hover:bg-background-100 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <i className="ri-filter-off-line"></i>{" "}
                {t("adminUi.actions.clearFilters")}
              </button>
            )}
          </div>
        </div>
      </div>

      {viewMode === "trash" && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-700">
            <i className="ri-information-line mr-1"></i>
            {t("adminUi.companies.trashInfo")}
          </p>
        </div>
      )}

      <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-background-200/70">
                <SortHeader
                  label={t("adminUi.columns.name").toUpperCase()}
                  field="name"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortHeader
                  label={t("adminUi.companies.industry").toUpperCase()}
                  field="industry"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortHeader
                  label={t("adminUi.columns.size").toUpperCase()}
                  field="size"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                  {t("adminUi.columns.applications").toUpperCase()}
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                  {t("adminUi.columns.status").toUpperCase()}
                </th>
                <SortHeader
                  label={t("adminUi.columns.createdAt").toUpperCase()}
                  field="createdAt"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                  {t("adminUi.columns.active").toUpperCase()}
                </th>
                {viewMode === "trash" && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                    {t("adminUi.columns.deletedAt").toUpperCase()}
                  </th>
                )}
                <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500">
                  {t("adminUi.columns.actions").toUpperCase()}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedCompanies.map((company) => {
                const companyJobs = jobs.filter(
                  (j) => j.companyId === company.id && !j.deletedAt,
                );
                return (
                  <tr
                    key={company.id}
                    className="border-b border-background-100 hover:bg-background-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-background-200/50">
                          <img
                            src={company.logo}
                            alt={company.name}
                            className="w-7 h-7 object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => setDetailCompany(company)}
                            className="text-foreground-900 font-medium text-sm truncate hover:text-primary-500 transition-colors cursor-pointer text-left"
                          >
                            {company.name}
                          </button>
                          <p className="text-xs text-foreground-500">
                            {company.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">
                      {company.industry}
                    </td>
                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">
                      {company.size} {t("adminUi.companies.employeesShort")}
                    </td>
                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">
                      {companyJobs.length}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[company.status].bg} ${statusConfig[company.status].color}`}
                      >
                        {statusConfig[company.status].label}
                      </span>
                      {company.adminNote && (
                        <p className="text-[10px] text-orange-500 mt-1 max-w-[150px] truncate">
                          {company.adminNote}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                      {company.createdAt}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {viewMode === "active" ? (
                        <button
                          onClick={() => toggleCompanyActive(company.id)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${company.isActive !== false ? "bg-accent-100 text-accent-600 hover:bg-accent-200" : "bg-red-100 text-red-600 hover:bg-red-200"}`}
                        >
                          {company.isActive !== false
                            ? t("adminUi.jobs.on")
                            : t("adminUi.jobs.off")}
                        </button>
                      ) : (
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${company.isActive !== false ? "bg-accent-100 text-accent-600" : "bg-red-100 text-red-600"}`}
                        >
                          {company.isActive !== false
                            ? t("adminUi.jobs.on")
                            : t("adminUi.jobs.off")}
                        </span>
                      )}
                    </td>
                    {viewMode === "trash" && (
                      <td className="px-5 py-3 text-foreground-500 whitespace-nowrap text-xs">
                        {company.deletedAt
                          ? new Date(company.deletedAt).toLocaleDateString(
                              "vi-VN",
                            )
                          : ""}
                      </td>
                    )}
                    <td className="px-5 py-3 text-right whitespace-nowrap relative">
                      {confirmSoftDelete === company.id &&
                      viewMode === "active" ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => {
                              deleteCompany(company.id);
                              setConfirmSoftDelete(null);
                            }}
                            className="px-2.5 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 cursor-pointer"
                          >
                            {t("adminUi.jobs.confirmDelete")}
                          </button>
                          <button
                            onClick={() => setConfirmSoftDelete(null)}
                            className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer"
                          >
                            {t("adminUi.actions.cancel")}
                          </button>
                        </div>
                      ) : confirmPermanentDelete === company.id &&
                        viewMode === "trash" ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => {
                              permanentDeleteCompany(company.id);
                              setConfirmPermanentDelete(null);
                            }}
                            className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 cursor-pointer"
                          >
                            {t("adminUi.jobs.deletePermanent")}
                          </button>
                          <button
                            onClick={() => setConfirmPermanentDelete(null)}
                            className="px-2.5 py-1 border border-background-300 rounded-lg text-xs text-foreground-600 hover:bg-background-100 cursor-pointer"
                          >
                            {t("adminUi.actions.cancel")}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => toggle(company.id, e)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 transition-colors cursor-pointer"
                        >
                          <i className="ri-more-2-fill text-foreground-500"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
              <i className="ri-building-4-line text-2xl text-foreground-400"></i>
            </div>
            <p className="text-sm text-foreground-500">
              {viewMode === "active"
                ? hasActiveFilters
                  ? t("adminUi.companies.noCompaniesFiltered")
                  : t("adminUi.companies.noCompaniesFound")
                : t("adminUi.companies.trashEmpty")}
            </p>
          </div>
        )}
        {filtered.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* Detail Modal */}
      {detailCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDetailCompany(null)}
          ></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">
                {t("adminUi.companies.companyDetail")}
              </h3>
              <button
                onClick={() => setDetailCompany(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-background-100">
              <div className="w-16 h-16 rounded-xl bg-background-100 flex items-center justify-center overflow-hidden border border-background-200/50 flex-shrink-0">
                <img
                  src={detailCompany.logo}
                  alt={detailCompany.name}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div>
                <h4 className="text-xl font-semibold text-foreground-950">
                  {detailCompany.name}
                </h4>
                <p className="text-sm text-foreground-500">
                  {detailCompany.nameEn}
                </p>
                <span
                  className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full mt-1 ${statusConfig[detailCompany.status].bg} ${statusConfig[detailCompany.status].color}`}
                >
                  {statusConfig[detailCompany.status].label}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between py-2 border-b border-background-100 sm:col-span-2">
                <span className="text-sm text-foreground-500">
                  {t("adminUi.columns.description")}
                </span>
                <span className="text-sm text-foreground-800 text-right max-w-[60%]">
                  {detailCompany.description}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">
                  {t("adminUi.companies.industry")}
                </span>
                <span className="text-sm font-medium text-foreground-800">
                  {detailCompany.industry}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">
                  {t("adminUi.columns.size")}
                </span>
                <span className="text-sm font-medium text-foreground-800">
                  {detailCompany.size} {t("adminUi.companies.employees")}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">
                  {t("adminUi.columns.location")}
                </span>
                <span className="text-sm font-medium text-foreground-800">
                  {detailCompany.location}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">
                  {t("adminUi.companies.address")}
                </span>
                <span className="text-sm font-medium text-foreground-800 text-right max-w-[55%]">
                  {detailCompany.address}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">
                  {t("adminUi.columns.website")}
                </span>
                <a
                  href={detailCompany.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary-500 hover:underline"
                >
                  {detailCompany.website}
                </a>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">
                  {t("adminUi.companies.email")}
                </span>
                <span className="text-sm font-medium text-foreground-800">
                  {detailCompany.contactEmail}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">
                  {t("adminUi.companies.phone")}
                </span>
                <span className="text-sm font-medium text-foreground-800">
                  {detailCompany.contactPhone}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">
                  {t("adminUi.companies.taxCode")}
                </span>
                <span className="text-sm font-medium text-foreground-800">
                  {detailCompany.taxCode}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">
                  {t("adminUi.columns.createdAt")}
                </span>
                <span className="text-sm font-medium text-foreground-800">
                  {detailCompany.createdAt}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-background-100">
                <span className="text-sm text-foreground-500">
                  {t("adminUi.companies.lastUpdated")}
                </span>
                <span className="text-sm font-medium text-foreground-800">
                  {detailCompany.updatedAt}
                </span>
              </div>
            </div>
            {detailCompany.adminNote && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-xs font-medium text-orange-600 mb-1">
                  {t("adminUi.companies.adminNoteFrom")}
                </p>
                <p className="text-sm text-orange-700">
                  {detailCompany.adminNote}
                </p>
              </div>
            )}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setDetailCompany(null)}
                className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                {t("adminUi.jobs.close")}
              </button>
              {viewMode === "active" && (
                <button
                  onClick={() => {
                    setDetailCompany(null);
                    openEdit(detailCompany);
                  }}
                  className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {t("adminUi.jobs.edit")}
                </button>
              )}
              {viewMode === "trash" && (
                <button
                  onClick={() => {
                    restoreCompany(detailCompany.id);
                    setDetailCompany(null);
                  }}
                  className="flex-1 py-2.5 bg-accent-500 text-white rounded-xl text-sm font-semibold hover:bg-accent-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {t("adminUi.jobs.restore")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modalOpen && editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setModalOpen(false)}
          ></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold text-foreground-950">
                {t("adminUi.companies.editCompany")}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-background-100 transition-colors cursor-pointer"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("adminUi.columns.company")}
                </label>
                <input
                  type="text"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("adminUi.companies.industry")}
                </label>
                <input
                  type="text"
                  value={form.industry || ""}
                  onChange={(e) =>
                    setForm({ ...form, industry: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("adminUi.columns.size")}
                </label>
                <input
                  type="text"
                  value={form.size || ""}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("adminUi.columns.location")}
                </label>
                <input
                  type="text"
                  value={form.location || ""}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("adminUi.columns.email")}
                </label>
                <input
                  type="email"
                  value={form.contactEmail || ""}
                  onChange={(e) =>
                    setForm({ ...form, contactEmail: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("adminUi.companies.phone")}
                </label>
                <input
                  type="tel"
                  value={form.contactPhone || ""}
                  onChange={(e) =>
                    setForm({ ...form, contactPhone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground-700 mb-1.5">
                  {t("adminUi.columns.description")}
                </label>
                <textarea
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                {t("adminUi.actions.cancel")}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                {t("adminUi.jobs.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {revisionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() =>
              setRevisionModal({ open: false, companyId: "", companyName: "" })
            }
          ></div>
          <div className="relative bg-background-50 border border-background-200 rounded-2xl p-6 w-full max-w-md mx-4 shadow-lg">
            <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-1">
              {t("adminUi.companies.requestRevision")}
            </h3>
            <p className="text-sm text-foreground-600 mb-4">
              {t("adminUi.companies.revisionNoteFor")}{" "}
              <strong>{revisionModal.companyName}</strong>
            </p>
            <textarea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder={t("adminUi.companies.revisionPlaceholder")}
              rows={4}
              maxLength={500}
              className="w-full px-4 py-2.5 text-sm bg-background-50 border border-background-200/70 rounded-xl focus:outline-none focus:border-primary-300 resize-none"
            ></textarea>
            <p className="text-xs text-foreground-400 mt-1 text-right">
              {revisionNote.length}/500
            </p>
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() =>
                  setRevisionModal({
                    open: false,
                    companyId: "",
                    companyName: "",
                  })
                }
                className="flex-1 py-2.5 border border-background-300 text-foreground-700 rounded-xl text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                {t("adminUi.actions.cancel")}
              </button>
              <button
                onClick={handleRevision}
                disabled={!revisionNote.trim()}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${revisionNote.trim() ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-background-200 text-foreground-400 cursor-not-allowed"}`}
              >
                {t("adminUi.companies.sendRequest")}
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
                setDetailCompany(activeItem);
                close();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"
            >
              <i className="ri-eye-line text-primary-500"></i>{" "}
              {t("adminUi.jobs.viewDetails")}
            </button>
            <button
              type="button"
              onClick={() => {
                navigate(`/companies/${activeItem.id}`);
                close();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"
            >
              <i className="ri-external-link-line text-accent-500"></i>{" "}
              {t("adminUi.companies.companyPage")}
            </button>
            <button
              type="button"
              onClick={() => openEdit(activeItem)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"
            >
              <i className="ri-edit-line text-secondary-500"></i>{" "}
              {t("adminUi.jobs.edit")}
            </button>
            {activeItem.status === "pending" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    approveCompany(activeItem.id);
                    close();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer"
                >
                  <i className="ri-check-line"></i>{" "}
                  {t("adminUi.companies.approve")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRevisionModal({
                      open: true,
                      companyId: activeItem.id,
                      companyName: activeItem.name,
                    });
                    setRevisionNote("");
                    close();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                >
                  <i className="ri-edit-line"></i>{" "}
                  {t("adminUi.companies.needsRevision")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    rejectCompany(activeItem.id);
                    close();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <i className="ri-close-line"></i>{" "}
                  {t("adminUi.companies.reject")}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                setConfirmSoftDelete(activeItem.id);
                close();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <i className="ri-delete-bin-line"></i> {t("adminUi.jobs.delete")}
            </button>
          </>
        ) : activeItem ? (
          <>
            <button
              type="button"
              onClick={() => {
                restoreCompany(activeItem.id);
                close();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-go-back-line"></i>{" "}
              {t("adminUi.jobs.restore")}
            </button>
            <button
              type="button"
              onClick={() => {
                setDetailCompany(activeItem);
                close();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-100 transition-colors cursor-pointer"
            >
              <i className="ri-eye-line text-primary-500"></i>{" "}
              {t("adminUi.jobs.viewDetails")}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmPermanentDelete(activeItem.id);
                close();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <i className="ri-delete-bin-6-line"></i>{" "}
              {t("adminUi.jobs.deletePermanent")}
            </button>
          </>
        ) : null}
      </TableActionMenu>
    </div>
  );
}
