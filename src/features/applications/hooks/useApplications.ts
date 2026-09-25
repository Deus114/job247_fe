import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addApplication,
  updateApplication,
  removeApplication,
  updateApplicationStatus,
} from "@/store/slices/applicationsSlice";
import type { Application } from "@/types/application";

/** Domain hook for job applications. */
export function useApplications() {
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((state) => state.applications);

  return {
    applications: items,
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
  };
}
