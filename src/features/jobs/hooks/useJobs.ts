import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addJob,
  updateJob,
  deleteJob,
  restoreJob,
  permanentDeleteJob,
  toggleJobActive,
} from "@/store/slices/jobSlice";
import type { Job } from "@/types/job";

/** Domain hook for jobs catalog + mutations. */
export function useJobs() {
  const dispatch = useAppDispatch();
  const { items, categories, educationLevels, locations, loading } =
    useAppSelector((state) => state.jobs);

  return {
    jobs: items,
    categories,
    educationLevels,
    locations,
    loading,
    addJob: (job: Job) => {
      dispatch(addJob(job));
    },
    updateJob: (job: Job) => {
      dispatch(updateJob(job));
    },
    deleteJob: (id: string) => {
      dispatch(deleteJob(id));
    },
    restoreJob: (id: string) => {
      dispatch(restoreJob(id));
    },
    permanentDeleteJob: (id: string) => {
      dispatch(permanentDeleteJob(id));
    },
    toggleJobActive: (id: string) => {
      dispatch(toggleJobActive(id));
    },
  };
}
