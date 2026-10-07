import {
  resolveAdminAuthErrorMessage,
  type AdminAuthError,
} from "@/api/adminAuth";
import {
  applyToJobRequest,
  fetchJobSeekerApplicationById,
  fetchJobSeekerApplications,
} from "@/api/applications";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addApplication,
  clearApplications,
  removeApplication,
  setApplications,
  updateApplication,
  updateApplicationStatus,
} from "@/store/slices/applicationsSlice";
import type {
  Application,
  ApplyToJobPayload,
  JobSeekerApplicationListParams,
} from "@/types/application";
import type { PaginatedList } from "@/types/catalog";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/** Domain hook for job-seeker applications. */
export function useApplications() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((state) => state.applications);

  const resolveError = useCallback(
    (error: unknown) =>
      resolveAdminAuthErrorMessage(error as AdminAuthError, t),
    [t],
  );

  const loadApplications = useCallback(
    async (
      params: JobSeekerApplicationListParams = {},
    ): Promise<PaginatedList<Application>> => {
      const result = await fetchJobSeekerApplications(params);
      dispatch(setApplications(result.data));
      return result;
    },
    [dispatch],
  );

  const loadApplicationById = useCallback(async (id: string) => {
    return fetchJobSeekerApplicationById(id);
  }, []);

  const applyToJob = useCallback(
    async (jobId: string, payload: ApplyToJobPayload) => {
      const app = await applyToJobRequest(jobId, payload);
      dispatch(addApplication(app));
      return app;
    },
    [dispatch],
  );

  return {
    applications: items,
    loadApplications,
    loadApplicationById,
    applyToJob,
    addApplication: (app: Application) => {
      dispatch(addApplication(app));
    },
    updateApplication: (app: Application) => {
      dispatch(updateApplication(app));
    },
    removeApplication: (id: string) => {
      dispatch(removeApplication(id));
    },
    updateApplicationStatus: (id: string, status: Application["status"]) => {
      dispatch(updateApplicationStatus({ id, status }));
    },
    clearApplications: () => {
      dispatch(clearApplications());
    },
    resolveError,
  };
}
