import { fetchPublicCompanyById, fetchPublicCompanyJobs } from "@/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { companySizeLabelKey } from "@/constants/company";
import { useAuth } from "@/features/auth";
import { useCompanies } from "@/features/companies";
import { JobSalary } from "@/features/jobs";
import { companyPath, jobPath } from "@/lib/paths";
import type { Company } from "@/types/company";
import type { Job } from "@/types/job";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export default function CompanyDetailPage() {
  const { t } = useTranslation();
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { companies } = useCompanies();

  const [company, setCompany] = useState<Company | null>(null);
  const [companyJobs, setCompanyJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setCompany(null);
      setCompanyJobs([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const [detail, jobsRes] = await Promise.all([
          fetchPublicCompanyById(id, slug),
          fetchPublicCompanyJobs(id, {
            page: 1,
            size: 50,
            sort: "createdAt,DESC",
            slug,
          }).catch(() => null),
        ]);

        if (cancelled) return;

        if (detail) {
          setCompany(detail);
          setCompanyJobs(jobsRes?.data ?? []);
          if (detail.slug && slug && detail.slug !== slug) {
            navigate(companyPath(detail), { replace: true });
          }
          return;
        }

        const fromStore = companies.find((c) => {
          if (c.id !== id || c.isActive === false) return false;
          const isOwner = user?.id === c.createdBy;
          const isAdmin = user?.role === "admin";
          if (isOwner || isAdmin) return true;
          return c.status === "approved";
        });
        setCompany(fromStore ?? null);
        setCompanyJobs([]);
      } catch {
        if (!cancelled) {
          setCompany(null);
          setCompanyJobs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, slug, companies, user?.id, user?.role, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen pt-[70px] flex items-center justify-center bg-background-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen pt-[70px] flex items-center justify-center bg-background-100">
        <div className="text-center p-10">
          <div className="w-20 h-20 mx-auto rounded-full bg-background-200 flex items-center justify-center mb-5">
            <i className="ri-building-line text-3xl text-foreground-400"></i>
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground-950 mb-2">
            {t("company.notFound")}
          </h2>
          <p className="text-sm text-foreground-600 mb-6">
            {t("company.notFoundDesc")}
          </p>
          <button
            onClick={() => navigate("/companies")}
            className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
            type="button"
          >
            {t("company.backToList")}
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === company.createdBy;
  const isAdmin = user?.role === "admin";
  const showStatusBadge =
    (isOwner || isAdmin) && company.status !== "approved";

  const statusConfig: Record<
    string,
    { label: string; color: string; icon: string }
  > = {
    pending: {
      label: t("company.statuses.pending"),
      color: "bg-yellow-100 text-yellow-700",
      icon: "ri-time-line",
    },
    rejected: {
      label: t("company.statuses.rejected"),
      color: "bg-red-100 text-red-600",
      icon: "ri-close-circle-line",
    },
    needs_revision: {
      label: t("company.statuses.needs_revision"),
      color: "bg-orange-100 text-orange-700",
      icon: "ri-edit-line",
    },
  };

  const sizeLabel = (() => {
    if (!company.size) return "";
    const key = companySizeLabelKey(company.size);
    const label = t(key);
    return label === key ? company.size : label;
  })();

  const description = (company.description || "").trim();

  return (
    <div className="min-h-screen pt-[70px] bg-background-100">
      <div className="relative h-[280px] md:h-[350px] overflow-hidden">
        {company.banner ? (
          <img
            src={company.banner}
            alt={company.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-700 to-secondary-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/50"></div>
        {showStatusBadge && statusConfig[company.status] ? (
          <div
            className={`absolute top-4 right-4 md:top-6 md:right-6 px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig[company.status].color}`}
          >
            <i className={`${statusConfig[company.status].icon} mr-1`}></i>
            {statusConfig[company.status].label}
          </div>
        ) : null}
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 -mt-20 relative z-10 pb-10">
        <div className="bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-background-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-background-200 shadow-sm">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <i className="ri-building-line text-3xl text-foreground-400"></i>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground-950">
                  {company.name}
                </h1>
                {company.nameEn && company.nameEn !== company.name && (
                  <span className="text-sm text-foreground-500">
                    ({company.nameEn})
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-600">
                {company.industry ? (
                  <span className="flex items-center gap-1">
                    <i className="ri-price-tag-3-line"></i> {company.industry}
                  </span>
                ) : null}
                {sizeLabel ? (
                  <span className="flex items-center gap-1">
                    <i className="ri-group-line"></i> {sizeLabel}
                  </span>
                ) : null}
                {company.location ? (
                  <span className="flex items-center gap-1">
                    <i className="ri-map-pin-line"></i> {company.location}
                  </span>
                ) : null}
                {company.address ? (
                  <span className="flex items-center gap-1 min-w-0">
                    <i className="ri-map-pin-2-line shrink-0"></i>
                    <span className="truncate">{company.address}</span>
                  </span>
                ) : null}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary-500 hover:text-primary-600 transition-colors"
                  >
                    <i className="ri-link"></i> {t("company.website")}
                  </a>
                )}
              </div>
            </div>
          </div>

          {(isOwner || isAdmin) && company.status === "approved" && (
            <div className="mt-6 pt-6 border-t border-background-200/40 flex flex-col sm:flex-row gap-3">
              <Link
                to={`/employer/jobs/new?companyId=${company.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
              >
                <i className="ri-add-line"></i> {t("company.postJobForCompany")}
              </Link>
              {isOwner && (
                <Link
                  to={`/companies/edit/${company.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-background-300 text-foreground-700 rounded-full text-sm font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
                >
                  <i className="ri-edit-line"></i> {t("company.editInfo")}
                </Link>
              )}
            </div>
          )}

          {isOwner &&
            (company.status === "pending" ||
              company.status === "rejected" ||
              company.status === "needs_revision") && (
              <div className="mt-6 pt-6 border-t border-background-200/40">
                <Link
                  to={`/companies/edit/${company.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
                >
                  <i className="ri-edit-line"></i> {t("company.editInfo")}
                </Link>
              </div>
            )}

          {company.adminNote && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <i className="ri-error-warning-line text-orange-600"></i>
                </div>
                <div>
                  <p className="text-sm font-semibold text-orange-800 mb-1">
                    {t("company.adminNote")}
                  </p>
                  <p className="text-sm text-orange-700">{company.adminNote}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {description ? (
          <div className="mt-6 bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-heading font-bold text-foreground-950 mb-4">
              {t("company.about")}
            </h2>
            {looksLikeHtml(description) ? (
              <div
                className="text-sm text-foreground-700 leading-relaxed prose prose-sm max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            ) : (
              <p className="text-sm text-foreground-700 leading-relaxed whitespace-pre-line">
                {description}
              </p>
            )}
          </div>
        ) : null}

        {companyJobs.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-heading font-bold text-foreground-950 mb-4">
              {t("company.activeJobs")} ({companyJobs.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companyJobs.map((job) => (
                <Link
                  key={job.id}
                  to={jobPath(job)}
                  className="bg-background-50 border border-background-200/70 rounded-xl p-5 hover:border-primary-200 transition-colors group"
                >
                  <h3 className="font-heading text-sm font-semibold text-foreground-950 mb-2 group-hover:text-primary-500 transition-colors line-clamp-2">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-500">
                    <span className="flex items-center gap-1">
                      <i className="ri-map-pin-line"></i> {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="ri-money-dollar-circle-line"></i>{" "}
                      <JobSalary salary={job.salary} loginFrom={jobPath(job)} />
                    </span>
                    {job.type ? (
                      <span className="px-2 py-0.5 bg-background-100 text-foreground-600 rounded-full text-xs">
                        {job.type}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${new Date(job.deadline) < new Date() ? "bg-red-100 text-red-600" : "bg-accent-100 text-accent-600"}`}
                    >
                      {new Date(job.deadline) < new Date()
                        ? t("dashboard.statuses.expired")
                        : t("dashboard.statuses.active")}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-primary-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {t("company.viewDetails")}{" "}
                      <i className="ri-arrow-right-line"></i>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {company.contactEmail || company.contactPhone || company.taxCode ? (
          <div className="mt-8 bg-background-50 border border-background-200/70 rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-heading font-bold text-foreground-950 mb-4">
              {t("company.contactInfo")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {company.contactEmail ? (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0">
                    <i className="ri-mail-line text-foreground-500"></i>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-500 mb-0.5">
                      {t("auth.email")}
                    </p>
                    <p className="text-sm text-foreground-800">
                      {company.contactEmail}
                    </p>
                  </div>
                </div>
              ) : null}
              {company.contactPhone ? (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0">
                    <i className="ri-phone-line text-foreground-500"></i>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-500 mb-0.5">
                      {t("contact.phone")}
                    </p>
                    <p className="text-sm text-foreground-800">
                      {company.contactPhone}
                    </p>
                  </div>
                </div>
              ) : null}
              {company.taxCode ? (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-background-100 flex items-center justify-center flex-shrink-0">
                    <i className="ri-file-text-line text-foreground-500"></i>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-500 mb-0.5">
                      {t("company.taxCode")}
                    </p>
                    <p className="text-sm text-foreground-800">
                      {company.taxCode}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
