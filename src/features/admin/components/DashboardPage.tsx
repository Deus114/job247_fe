import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import { useJobs } from '@/features/jobs';
import { useCompanies } from '@/features/companies';
import BarChart from '@/components/ui/BarChart';
import LineChart from '@/components/ui/LineChart';
import DonutChart from '@/components/ui/DonutChart';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { jobs, categories } = useJobs();
  const { companies: allCompanies } = useCompanies();
  const users = useAppSelector((state) => state.adminUsers.items);

  const activeJobs = useMemo(() => jobs.filter((j) => !j.deletedAt), [jobs]);
  const activeCompanies = useMemo(() => allCompanies.filter((c) => !c.deletedAt), [allCompanies]);
  const activeUsers = useMemo(() => users.filter((u) => !u.deletedAt && Array.isArray(u.roleIds)), [users]);

  const stats = useMemo(() => ({
    totalJobs: activeJobs.length,
    activeListedJobs: activeJobs.filter((j) => new Date(j.deadline) >= new Date()).length,
    expiredJobs: activeJobs.filter((j) => new Date(j.deadline) < new Date()).length,
    totalCompanies: activeCompanies.length,
    pendingCompanies: activeCompanies.filter((c) => c.status === 'pending').length,
    approvedCompanies: activeCompanies.filter((c) => c.status === 'approved').length,
    needsRevisionCompanies: activeCompanies.filter((c) => c.status === 'needs_revision').length,
    totalUsers: activeUsers.length,
    activeUsersCount: activeUsers.filter((u) => u.status === 'active').length,
    totalCategories: categories.length,
  }), [activeJobs, activeCompanies, activeUsers, categories]);

  const jobsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => { counts[cat.name] = 0; });
    activeJobs.forEach((j) => { counts[j.category] = (counts[j.category] || 0) + 1; });
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [activeJobs, categories]);

  const jobsOverTime = useMemo(() => {
    const months = [
      t('adminUi.dashboard.month1'),
      t('adminUi.dashboard.month2'),
      t('adminUi.dashboard.month3'),
      t('adminUi.dashboard.month4'),
      t('adminUi.dashboard.month5'),
      t('adminUi.dashboard.month6'),
      t('adminUi.dashboard.month7'),
    ];
    const counts = [12, 18, 15, 22, 28, 35, activeJobs.length];
    return months.map((label, i) => ({ label, value: counts[i] || 0 }));
  }, [activeJobs.length, t]);

  const companyStatusData = useMemo(() => [
    { label: t('adminUi.status.approved'), value: stats.approvedCompanies, color: 'oklch(var(--accent-500))' },
    { label: t('adminUi.status.pending'), value: stats.pendingCompanies, color: 'oklch(var(--yellow-500))' },
    { label: t('adminUi.status.needs_revision'), value: stats.needsRevisionCompanies, color: 'oklch(var(--orange-500))' },
    { label: t('adminUi.status.rejected'), value: activeCompanies.filter((c) => c.status === 'rejected').length, color: 'oklch(var(--red-500))' },
  ], [stats, activeCompanies, t]);

  const recentJobs = useMemo(() =>
    [...activeJobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8),
  [activeJobs]);

  const recentUsers = useMemo(() =>
    [...activeUsers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  [activeUsers]);

  return (
    <div>
      <h2 className="text-xl font-heading font-bold text-foreground-950 mb-6">{t('adminUi.pageTitles.dashboard')}</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t('adminUi.dashboard.totalJobs'), value: stats.totalJobs, icon: 'ri-briefcase-line', color: 'text-primary-500', bg: 'bg-primary-100', trend: '+12%' },
          { label: t('adminUi.dashboard.approvedCompanies'), value: stats.approvedCompanies, icon: 'ri-building-line', color: 'text-accent-500', bg: 'bg-accent-100', trend: '+5%' },
          { label: t('adminUi.dashboard.totalUsers'), value: stats.totalUsers, icon: 'ri-team-line', color: 'text-secondary-500', bg: 'bg-secondary-100', trend: '+18%' },
          { label: t('adminUi.dashboard.pendingCompanies'), value: stats.pendingCompanies, icon: 'ri-time-line', color: 'text-yellow-600', bg: 'bg-yellow-100', trend: t('adminUi.dashboard.newCount') },
        ].map((stat) => (
          <div key={stat.label} className="bg-background-50 border border-background-200/70 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <i className={`${stat.icon} ${stat.color}`}></i>
              </div>
              <span className="text-xs font-medium text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full">{stat.trend}</span>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground-950">{stat.value}</p>
            <p className="text-xs text-foreground-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-background-50 border border-background-200/70 rounded-xl p-5">
          <h3 className="font-heading text-sm font-semibold text-foreground-950 mb-1">{t('adminUi.dashboard.jobsByCategory')}</h3>
          <p className="text-xs text-foreground-500 mb-4">{t('adminUi.dashboard.jobsDistribution')}</p>
          <BarChart data={jobsByCategory} height={180} />
        </div>

        {/* Donut chart */}
        <div className="bg-background-50 border border-background-200/70 rounded-xl p-5">
          <h3 className="font-heading text-sm font-semibold text-foreground-950 mb-1">{t('adminUi.dashboard.companyStatus')}</h3>
          <p className="text-xs text-foreground-500 mb-4">{t('adminUi.dashboard.companyApprovalRate')}</p>
          <DonutChart data={companyStatusData} size={160} />
        </div>
      </div>

      {/* Line chart */}
      <div className="bg-background-50 border border-background-200/70 rounded-xl p-5 mb-6">
        <h3 className="font-heading text-sm font-semibold text-foreground-950 mb-1">{t('adminUi.dashboard.jobsOverTime')}</h3>
        <p className="text-xs text-foreground-500 mb-4">{t('adminUi.dashboard.jobsTrend')}</p>
        <LineChart data={jobsOverTime} height={160} />
      </div>

      {/* Bottom row: Recent jobs + Recent users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-background-200/70">
            <h3 className="font-heading text-sm font-semibold text-foreground-950">{t('adminUi.dashboard.recentJobs')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-background-200/70">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-foreground-500">{t('adminUi.columns.title')}</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-foreground-500">{t('adminUi.columns.company')}</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-foreground-500">{t('adminUi.columns.postedDate')}</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id} className="border-b border-background-100 hover:bg-background-50 transition-colors">
                    <td className="px-5 py-2.5 text-foreground-900 font-medium max-w-[200px] truncate">{job.title}</td>
                    <td className="px-5 py-2.5 text-foreground-600 whitespace-nowrap">{job.company}</td>
                    <td className="px-5 py-2.5 text-foreground-500 whitespace-nowrap text-xs">{job.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-background-200/70">
            <h3 className="font-heading text-sm font-semibold text-foreground-950">{t('adminUi.dashboard.newUsers')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-background-200/70">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-foreground-500">{t('adminUi.columns.fullName')}</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-foreground-500">{t('adminUi.columns.role')}</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-foreground-500">{t('adminUi.columns.createdAt')}</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="border-b border-background-100 hover:bg-background-50 transition-colors">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-background-200 flex items-center justify-center flex-shrink-0">
                            <i className="ri-user-line text-xs text-foreground-400"></i>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-foreground-900 font-medium text-sm truncate">{u.fullName}</p>
                          <p className="text-xs text-foreground-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 whitespace-nowrap">
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary-100 text-secondary-700">
                    {((u.roleIds || []).length > 0) ? (u.roleIds || []).length + ' ' + t('adminUi.dashboard.roles') : t('adminUi.dashboard.noRoles')}
                  </span>
                </td>
                    <td className="px-5 py-2.5 text-foreground-500 whitespace-nowrap text-xs">{u.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}