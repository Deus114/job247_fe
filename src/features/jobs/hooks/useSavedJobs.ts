import {
  resolveAdminAuthErrorMessage,
  type AdminAuthError,
} from "@/api/adminAuth";
import {
  fetchSavedJobs,
  saveJobRequest,
  unsaveJobRequest,
} from "@/api/savedJobs";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearSavedJobs,
  mergeSavedJobs,
  removeSavedJob,
  saveJob,
} from "@/store/slices/savedJobsSlice";
import type { SavedJobItem, SavedJobListParams } from "@/types/application";
import type { PaginatedList } from "@/types/catalog";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/** Domain hook for saved jobs (job-seeker API). */
export function useSavedJobs() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.savedJobs.items);

  const resolveError = useCallback(
    (error: unknown) =>
      resolveAdminAuthErrorMessage(error as AdminAuthError, t),
    [t],
  );

  const loadSavedJobs = useCallback(
    async (
      params: SavedJobListParams = {},
    ): Promise<PaginatedList<SavedJobItem>> => {
      const result = await fetchSavedJobs(params);
      dispatch(
        mergeSavedJobs(
          result.data.map((job) => ({
            jobId: String(job.jobId),
            savedAt: job.savedAt || new Date().toISOString(),
          })),
        ),
      );
      return result;
    },
    [dispatch],
  );

  const saveJobById = useCallback(
    async (jobId: string) => {
      await saveJobRequest(jobId);
      dispatch(saveJob(jobId));
    },
    [dispatch],
  );

  const removeSavedJobById = useCallback(
    async (jobId: string) => {
      await unsaveJobRequest(jobId);
      dispatch(removeSavedJob(jobId));
    },
    [dispatch],
  );

  return {
    savedItems: items,
    isSaved: (jobId: string) => items.some((s) => s.jobId === jobId),
    saveJob: saveJobById,
    removeSavedJob: removeSavedJobById,
    loadSavedJobs,
    clearSavedJobs: () => {
      dispatch(clearSavedJobs());
    },
    resolveError,
  };
}
