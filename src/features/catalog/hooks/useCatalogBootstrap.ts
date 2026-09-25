import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setJobs,
  setCategories,
  setEducationLevels,
  setLocations,
  setLoading as setJobLoading,
} from "@/store/slices/jobSlice";
import {
  setCompanies,
  setLoading as setCompanyLoading,
} from "@/store/slices/companySlice";
import { setApplications } from "@/store/slices/applicationsSlice";
import { fetchJobsCatalog, fetchCompanies, fetchApplications } from "@/api";
import { env } from "@/config/env";

/**
 * Loads jobs / companies / applications into Redux.
 * Mock mode relies on slice seeds for jobs/companies; still fills applications if empty.
 * API mode fetches when slices are empty; withApiFallback still returns mock data if API fails.
 */
export function useCatalogBootstrap() {
  const dispatch = useAppDispatch();
  const jobsCount = useAppSelector((state) => state.jobs.items.length);
  const companiesCount = useAppSelector(
    (state) => state.companies.items.length,
  );
  const applicationsCount = useAppSelector(
    (state) => state.applications.items.length,
  );

  useEffect(() => {
    if (env.useMock) {
      if (applicationsCount === 0) {
        let cancelled = false;
        void fetchApplications().then((applications) => {
          if (!cancelled) dispatch(setApplications(applications));
        });
        return () => {
          cancelled = true;
        };
      }
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      const needJobs = jobsCount === 0;
      const needCompanies = companiesCount === 0;
      const needApplications = applicationsCount === 0;

      if (!needJobs && !needCompanies && !needApplications) return;

      if (needJobs) dispatch(setJobLoading(true));
      if (needCompanies) dispatch(setCompanyLoading(true));

      try {
        const [catalog, companies, applications] = await Promise.all([
          needJobs ? fetchJobsCatalog() : Promise.resolve(null),
          needCompanies ? fetchCompanies() : Promise.resolve(null),
          needApplications ? fetchApplications() : Promise.resolve(null),
        ]);

        if (cancelled) return;

        if (catalog) {
          dispatch(setJobs(catalog.jobs));
          dispatch(setCategories(catalog.categories));
          dispatch(setEducationLevels(catalog.educationLevels));
          dispatch(setLocations(catalog.locations));
        }

        if (companies) {
          dispatch(setCompanies(companies));
        }

        if (applications) {
          dispatch(setApplications(applications));
        }
      } catch {
        // keep UI usable; loading flags cleared in finally
      } finally {
        if (!cancelled) {
          dispatch(setJobLoading(false));
          dispatch(setCompanyLoading(false));
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [dispatch, jobsCount, companiesCount, applicationsCount]);
}
