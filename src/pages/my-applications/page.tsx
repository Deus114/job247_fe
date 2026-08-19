import { useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { removeApplication } from '@/store/slices/applicationsSlice';
import ViewApplicationModal from './components/ViewApplicationModal';
import EditApplicationModal from './components/EditApplicationModal';
import ConfirmCancelModal from './components/ConfirmCancelModal';
import type { Application } from '@/store/slices/applicationsSlice';

const statusLabel: Record<string, string> = {
  pending: 'Đang chờ',
  reviewing: 'Đang xem xét',
  accepted: 'Được chấp nhận',
  rejected: 'Từ chối',
};

const statusColor: Record<string, string> = {
  pending: 'bg-secondary-100 text-secondary-700',
  reviewing: 'bg-accent-100 text-accent-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function MyApplicationsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const applications = useAppSelector((state) => state.applications.items);
  const allJobs = useAppSelector((state) => state.jobs.items);

  const [viewApp, setViewApp] = useState<Application | null>(null);
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [cancelApp, setCancelApp] = useState<Application | null>(null);

  const jobsMap = useMemo(() => new Map(allJobs.map((j) => [j.id, j])), [allJobs]);

  if (user?.role === 'employer') {
    return <Navigate to="/" replace />;
  }

  const handleCancelConfirm = () => {
    if (cancelApp) {
      dispatch(removeApplication(cancelApp.id));
      setCancelApp(null);
    }
  };

  return (
    <div className="min-h-screen pt-[70px]">
      <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground-950 mb-2">
            Việc làm đã ứng tuyển
          </h1>
          <p className="text-sm text-foreground-600">
            Theo dõi trạng thái, xem và chỉnh sửa các đơn ứng tuyển của bạn
          </p>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto rounded-full bg-background-100 flex items-center justify-center mb-5">
              <i className="ri-send-plane-line text-3xl text-foreground-400"></i>
            </div>
            <h3 className="text-lg font-heading font-semibold text-foreground-950 mb-2">
              Chưa có đơn ứng tuyển nào
            </h3>
            <p className="text-sm text-foreground-500 mb-6">
              Tìm việc và gửi đơn ứng tuyển để theo dõi tại đây
            </p>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-background-50 dark:text-foreground-950 rounded-full text-sm font-medium hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-search-line"></i> Tìm việc làm
            </Link>
          </div>
        ) : (
          <div className="bg-background-50 border border-background-200/70 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-background-200/70 bg-background-100/50">
                    <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">
                      Công việc
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider hidden md:table-cell">
                      Ngày ứng tuyển
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-foreground-600 uppercase tracking-wider text-right">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-background-200/70">
                  {applications.map((app) => {
                    const job = jobsMap.get(app.jobId);
                    return (
                      <tr key={app.id} className="hover:bg-background-100/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-background-100 border border-background-200/70 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {app.companyLogo ? (
                                <img
                                  src={app.companyLogo}
                                  alt={app.companyName}
                                  className="w-8 h-8 object-contain"
                                />
                              ) : (
                                <i className="ri-building-line text-foreground-400"></i>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground-900">
                                {app.jobTitle}
                              </p>
                              <p className="text-xs text-foreground-500">{app.companyName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <span className="text-sm text-foreground-600">
                            {new Date(app.appliedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusColor[app.status] || 'bg-background-100 text-foreground-600'}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${app.status === 'pending' ? 'bg-secondary-500' : app.status === 'reviewing' ? 'bg-accent-500' : app.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'}`}
                            ></span>
                            {statusLabel[app.status] || app.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewApp(app)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 text-foreground-500 hover:text-primary-500 transition-colors cursor-pointer"
                              title="Xem chi tiết CV"
                            >
                              <i className="ri-eye-line text-lg"></i>
                            </button>
                            <button
                              onClick={() => setEditApp(app)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-100 text-foreground-500 hover:text-accent-500 transition-colors cursor-pointer"
                              title="Sửa đơn ứng tuyển"
                            >
                              <i className="ri-edit-line text-lg"></i>
                            </button>
                            <button
                              onClick={() => setCancelApp(app)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-foreground-500 hover:text-red-500 transition-colors cursor-pointer"
                              title="Hủy ứng tuyển"
                            >
                              <i className="ri-close-circle-line text-lg"></i>
                            </button>
                            {job && (
                              <Link
                                to={`/jobs/${job.id}`}
                                className="w-8 h-8 hidden md:flex items-center justify-center rounded-lg hover:bg-background-100 text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
                                title="Xem tin tuyển dụng"
                              >
                                <i className="ri-external-link-line text-base"></i>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ViewApplicationModal
        application={viewApp!}
        isOpen={viewApp !== null}
        onClose={() => setViewApp(null)}
      />

      <EditApplicationModal
        application={editApp!}
        isOpen={editApp !== null}
        onClose={() => setEditApp(null)}
      />

      <ConfirmCancelModal
        jobTitle={cancelApp?.jobTitle || ''}
        companyName={cancelApp?.companyName || ''}
        isOpen={cancelApp !== null}
        onClose={() => setCancelApp(null)}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}