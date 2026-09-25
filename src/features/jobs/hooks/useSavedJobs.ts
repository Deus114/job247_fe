import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  saveJob,
  removeSavedJob,
  clearSavedJobs,
} from "@/store/slices/savedJobsSlice";

/** Domain hook for saved jobs. */
export function useSavedJobs() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.savedJobs.items);

  return {
    savedItems: items,
    isSaved: (jobId: string) => items.some((s) => s.jobId === jobId),
    saveJob: (jobId: string) => {
      dispatch(saveJob(jobId));
    },
    removeSavedJob: (jobId: string) => {
      dispatch(removeSavedJob(jobId));
    },
    clearSavedJobs: () => {
      dispatch(clearSavedJobs());
    },
  };
}
