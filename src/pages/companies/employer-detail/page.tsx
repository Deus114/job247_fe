import {
  AdminAuthError,
  fetchCompanyJoinRequests,
  fetchEmployerCompanyById,
  resolveAdminAuthErrorMessage,
  updateCompanyJoinRequest,
} from "@/api";
import CustomSelect from "@/components/ui/CustomSelect";
import { companySizeLabelKey } from "@/constants/company";
import { useAuth } from "@/features/auth";
import { formatDateTime } from "@/lib/formatDate";
import { toast } from "@/lib/toast";
import type {
  AdminCompanyStatus,
  CompanyJoinRequest,
  CompanyJoinRequestStatus,
  EmployerCompany,
} from "@/types/company";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";

function statusClass(
  status: AdminCompanyStatus | CompanyJoinRequestStatus,
): string {
  if (status === "APPROVED") return "bg-accent-100 text-accent-600";
  if (status === "REJECTED") return "bg-red-100 text-red-600";
  return "bg-yellow-100 text-yellow-700";
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-background-100 rounded-xl min-w-0">
      <p className="text-xs text-foreground-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-foreground-900 break-words">
        {value || "—"}
      </p>
    </div>
  );
}

export default function EmployerCompanyDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = Number(id);

  const [company, setCompany] = useState<EmployerCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<CompanyJoinRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<
    "" | CompanyJoinRequestStatus
  >("");
  const [actingId, setActingId] = useState<number | null>(null);

  const membership = useMemo(
    () => user?.companies?.find((item) => item.companyId === companyId) ?? null,
    [user?.companies, companyId],
  );
  const isOwner = membership?.role === "OWNER";

  const loadCompany = useCallback(async () => {
    if (!Number.isFinite(companyId) || companyId <= 0) {
      setCompany(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchEmployerCompanyById(companyId);
      setCompany(data);
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.employerCompanyLoadFailed"),
      );
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, [companyId, t]);

  const loadRequests = useCallback(async () => {
    if (!isOwner || !Number.isFinite(companyId) || companyId <= 0) {
      setRequests([]);
      return;
    }
    setRequestsLoading(true);
    try {
      const res = await fetchCompanyJoinRequests({
        companyId,
        status: requestStatus || undefined,
        page: 1,
        size: 50,
        sort: "createdAt,desc",
      });
      setRequests(res.data);
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.companyJoinRequestLoadFailed"),
      );
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, [isOwner, companyId, requestStatus, t]);

  useEffect(() => {
    void loadCompany();
  }, [loadCompany]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const sizeLabel = (size: string) => {
    const key = companySizeLabelKey(size);
    const translated = t(key);
    return translated === key ? size || "—" : translated;
  };

  const handleDecide = async (
    request: CompanyJoinRequest,
    status: "APPROVED" | "REJECTED",
  ) => {
    if (actingId != null) return;
    setActingId(request.id);
    try {
      await updateCompanyJoinRequest(request.id, { status });
      toast.success(
        status === "APPROVED"
          ? t("company.joinApproved")
          : t("company.joinRejected"),
      );
      await loadRequests();
    } catch (error) {
      toast.error(
        error instanceof AdminAuthError
          ? resolveAdminAuthErrorMessage(error, t)
          : t("apiErrors.companyJoinRequestUpdateFailed"),
      );
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-foreground-500">
        <i className="ri-loader-4-line animate-spin mr-2"></i>
        {t("common.loading")}
      </div>
    );
  }

  if (!company) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
          {t("company.notFound")}
        </h2>
        <button
          type="button"
          onClick={() => navigate("/employer/companies")}
          className="mt-4 px-5 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium cursor-pointer"
        >
          {t("company.myCompanies")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={() => navigate("/employer/companies")}
          className="inline-flex items-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border border-background-200/70 bg-background-50 text-foreground-700 hover:bg-background-100 cursor-pointer self-start"
        >
          <i className="ri-arrow-left-line"></i>
          {t("company.backToList")}
        </button>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/employer/companies/${company.id}/edit`}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl border border-background-200/70 bg-background-50 hover:bg-background-100 cursor-pointer"
          >
            <i className="ri-edit-line"></i> {t("company.editInfo")}
          </Link>
          {company.status === "APPROVED" && (
            <Link
              to={`/employer/jobs/new?companyId=${company.id}`}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-3 text-sm font-medium rounded-xl bg-primary-500 text-white hover:bg-primary-600 cursor-pointer"
            >
              <i className="ri-add-line"></i> {t("company.postJobForCompany")}
            </Link>
          )}
        </div>
      </div>

      <div className="relative h-[180px] md:h-[240px] rounded-2xl overflow-hidden border border-background-200/70 mb-0">
        {company.backgroundImage ? (
          <img
            src={company.backgroundImage}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 via-background-100 to-background-200 flex items-center justify-center">
            <i className="ri-image-line text-4xl text-foreground-300"></i>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40"></div>
      </div>

      <div className="relative z-10 -mt-12 md:-mt-14 px-3 sm:px-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 min-w-0">
          <span className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-background-50 border border-background-200 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
            {company.logo ? (
              <img
                src={company.logo}
                alt=""
                className="w-14 h-14 md:w-16 md:h-16 object-contain"
              />
            ) : (
              <i className="ri-building-line text-3xl text-foreground-400"></i>
            )}
          </span>
          <div className="min-w-0 pb-1">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground-950 break-words">
              {company.name}
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusClass(company.status)}`}
              >
                {t(`adminUi.status.${company.status}`)}
              </span>
              {membership && (
                <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                  {t(`company.memberRoles.${membership.role}`)}
                </span>
              )}
            </div>
            {company.status === "REJECTED" && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 max-w-xl">
                <p className="text-xs text-red-500 mb-1">
                  {t("company.rejectionReason")}
                </p>
                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {company.rejectionReason.trim() ||
                    t("company.rejectionReasonEmpty")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <InfoCell
          label={t("company.industry")}
          value={company.industries
            .map((item) => item.name)
            .filter(Boolean)
            .join(", ")}
        />
        <InfoCell label={t("company.size")} value={sizeLabel(company.size)} />
        <InfoCell
          label={t("dashboard.jobsTable.location")}
          value={company.provinceName}
        />
        <InfoCell label={t("company.address")} value={company.address} />
        <InfoCell label={t("company.contactInfo")} value={company.email} />
        <InfoCell label={t("adminUi.companies.phone")} value={company.phone} />
        <InfoCell label={t("company.taxCode")} value={company.taxCode} />
        <InfoCell label={t("company.website")} value={company.website} />
        <InfoCell
          label={t("company.createdDate")}
          value={formatDateTime(company.createdAt, i18n.language)}
        />
      </div>

      {company.description && (
        <div className="mb-6 p-4 bg-background-50 border border-background-200/70 rounded-xl">
          <p className="text-xs text-foreground-500 mb-1">
            {t("company.description")}
          </p>
          <p className="text-sm text-foreground-800 whitespace-pre-wrap">
            {company.description}
          </p>
        </div>
      )}

      {company.members.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground-900 mb-3">
            {t("company.members")} ({company.members.length})
          </h3>
          <div className="space-y-2">
            {company.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-background-200 bg-background-50"
              >
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-white">
                      {member.name?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground-900 truncate">
                      {member.name || "—"}
                    </p>
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary-100 text-primary-700">
                      {t(`company.memberRoles.${member.role}`)}
                    </span>
                  </div>
                  <p className="text-xs text-foreground-500 truncate">
                    {member.email || "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOwner && (
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-heading font-semibold text-foreground-950">
                {t("company.incomingJoinRequests")}
              </h3>
              <p className="text-sm text-foreground-500 mt-1">
                {t("company.incomingJoinRequestsDesc")}
              </p>
            </div>
            <CustomSelect
              value={requestStatus}
              onChange={(value) =>
                setRequestStatus(value as "" | CompanyJoinRequestStatus)
              }
              options={[
                { value: "", label: t("common.all") },
                {
                  value: "PENDING",
                  label: t("adminUi.status.PENDING"),
                },
                {
                  value: "APPROVED",
                  label: t("adminUi.status.APPROVED"),
                },
                {
                  value: "REJECTED",
                  label: t("adminUi.status.REJECTED"),
                },
              ]}
              className="w-full sm:w-[180px]"
              outlined
            />
          </div>

          <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-background-200/70">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                      {t("adminUi.columns.name").toUpperCase()}
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                      {t("company.joinMessage").toUpperCase()}
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-500">
                      {t("company.status").toUpperCase()}
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-500">
                      {t("dashboard.jobsTable.actions").toUpperCase()}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requestsLoading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-10 text-center text-foreground-500"
                      >
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        {t("common.loading")}
                      </td>
                    </tr>
                  ) : (
                    requests.map((request) => (
                      <tr
                        key={request.id}
                        className="border-b border-background-100"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {request.userAvatar ? (
                                <img
                                  src={request.userAvatar}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-white">
                                  {request.userName?.charAt(0) || "U"}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground-900 truncate">
                                {request.userName}
                              </p>
                              <p className="text-xs text-foreground-500 truncate">
                                {request.userEmail}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-foreground-600 max-w-[240px]">
                          <span className="line-clamp-2">
                            {request.message || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusClass(request.status)}`}
                          >
                            {t(`adminUi.status.${request.status}`)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          {request.status === "PENDING" ? (
                            <div className="inline-flex gap-2">
                              <button
                                type="button"
                                disabled={actingId === request.id}
                                onClick={() =>
                                  void handleDecide(request, "APPROVED")
                                }
                                className="px-3 py-1.5 rounded-lg bg-accent-500 text-white text-xs font-medium cursor-pointer disabled:opacity-60 min-h-[36px]"
                              >
                                {t("company.approve")}
                              </button>
                              <button
                                type="button"
                                disabled={actingId === request.id}
                                onClick={() =>
                                  void handleDecide(request, "REJECTED")
                                }
                                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium cursor-pointer disabled:opacity-60 min-h-[36px]"
                              >
                                {t("company.reject")}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-foreground-400">
                              {formatDateTime(request.updatedAt, i18n.language)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!requestsLoading && requests.length === 0 && (
              <div className="p-10 text-center text-sm text-foreground-500">
                {t("company.noJoinRequests")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
