import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';

export default function CompaniesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const companies = useAppSelector((state) => state.companies.items);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'needs_revision'>('all');

  const myCompanies = companies.filter((c) => c.createdBy === user?.id);
  const filteredCompanies = filter === 'all'
    ? myCompanies
    : myCompanies.filter((c) => c.status === filter);

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700', icon: 'ri-time-line' },
    approved: { label: 'Đã duyệt', color: 'bg-accent-100 text-accent-600', icon: 'ri-check-double-line' },
    rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-600', icon: 'ri-close-circle-line' },
    needs_revision: { label: 'Cần chỉnh sửa', color: 'bg-orange-100 text-orange-700', icon: 'ri-edit-line' },
  };

  if (!user || user.role === 'user') {
    return (
      <div className="min-h-screen pt-[70px] flex items-center justify-center bg-background-100">
        <div className="text-center p-10 max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-background-200 flex items-center justify-center mb-5">
            <i className="ri-building-line text-3xl text-foreground-400"></i>
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground-950 mb-2">Truy cập bị từ chối</h2>
          <p className="text-sm text-foreground-600 mb-6">Chỉ nhà tuyển dụng mới có thể quản lý công ty. Vui lòng đăng nhập với tài khoản Nhà tuyển dụng.</p>
          <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[70px] bg-background-100">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950">Công ty của tôi</h1>
            <p className="text-sm text-foreground-600 mt-1">Quản lý hồ sơ công ty và trạng thái xét duyệt</p>
          </div>
          <Link
            to="/companies/create"
            className="px-5 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
          >
            <i className="ri-add-line"></i> Tạo công ty mới
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {(['all', 'pending', 'approved', 'rejected', 'needs_revision'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filter === f
                  ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                  : 'bg-background-50 border border-background-200 text-foreground-600 hover:bg-background-100'
              }`}
            >
              {f === 'all' ? 'Tất cả' : statusConfig[f].label}
              {f === 'all' && <span className="ml-1 opacity-70">({myCompanies.length})</span>}
            </button>
          ))}
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="bg-background-50 border border-background-200/70 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-4">
              <i className="ri-building-4-line text-2xl text-foreground-400"></i>
            </div>
            <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
              {myCompanies.length === 0 ? 'Bạn chưa có công ty nào' : 'Không có công ty nào ở trạng thái này'}
            </h3>
            <p className="text-sm text-foreground-500 mb-6">
              {myCompanies.length === 0
                ? 'Tạo hồ sơ công ty để bắt đầu đăng tin tuyển dụng. Công ty của bạn sẽ được admin xét duyệt trước khi hiển thị.'
                : 'Thử chọn bộ lọc khác để xem các công ty.'}
            </p>
            {myCompanies.length === 0 && (
              <Link to="/companies/create" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap">
                <i className="ri-add-line"></i> Tạo công ty đầu tiên
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCompanies.map((company) => (
              <div key={company.id} className="bg-background-50 border border-background-200/70 rounded-2xl p-6 hover:border-primary-200 transition-all group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-background-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-background-200/50">
                    <img src={company.logo} alt={company.name} className="w-10 h-10 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-base font-semibold text-foreground-950 truncate">{company.name}</h3>
                    <p className="text-xs text-foreground-500 mt-0.5">{company.industry}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-foreground-500">
                      <i className="ri-map-pin-line"></i>
                      <span>{company.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-background-200/40">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[company.status].color}`}>
                    <i className={statusConfig[company.status].icon}></i>
                    {statusConfig[company.status].label}
                  </span>
                  <div className="flex items-center gap-2">
                    {company.status === 'approved' && (
                      <Link
                        to={`/post-job?companyId=${company.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-xs font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-add-line text-xs"></i> Đăng tin
                      </Link>
                    )}
                    <Link
                      to={`/companies/edit/${company.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 border border-background-200 text-foreground-600 rounded-full text-xs font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-edit-line text-xs"></i> Sửa
                    </Link>
                    <Link
                      to={`/companies/${company.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 border border-background-200 text-foreground-600 rounded-full text-xs font-medium hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <i className="ri-eye-line text-xs"></i> Xem
                    </Link>
                  </div>
                </div>

                {company.adminNote && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <i className="ri-error-warning-line text-orange-500 text-sm mt-0.5"></i>
                      <div>
                        <p className="text-xs font-medium text-orange-800 mb-0.5">Ghi chú từ Admin:</p>
                        <p className="text-xs text-orange-700">{company.adminNote}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}