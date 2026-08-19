import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useAppDispatch } from '@/store/hooks';
import { setJobs, setCategories, setEducationLevels, setLocations, setLoading as setJobLoading } from '@/store/slices/jobSlice';
import { setCompanies, setLoading as setCompanyLoading } from '@/store/slices/companySlice';
import { setApplications, addApplication } from '@/store/slices/applicationsSlice';
import { mockJobs, mockCategories, mockEducationLevels, mockLocations } from '@/mocks/jobs';
import { mockCompanies } from '@/mocks/companies';
import { mockApplications } from '@/mocks/applications';

function isStoreEmpty(stored: string | null, key: string): boolean {
  if (!stored) return true;
  try {
    const p = JSON.parse(stored);
    return !p[key] || !p[key].items || p[key].items.length === 0;
  } catch {
    return true;
  }
}

export default function Layout() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let jobsLoaded = false;
    let companiesLoaded = false;

    const storedJobs = localStorage.getItem('redux_jobs');
    if (isStoreEmpty(storedJobs, 'jobs')) {
      dispatch(setJobLoading(true));
      dispatch(setJobs(mockJobs));
      dispatch(setCategories(mockCategories));
      dispatch(setEducationLevels(mockEducationLevels));
      dispatch(setLocations(mockLocations));
      jobsLoaded = true;
    } else {
      dispatch(setJobLoading(false));
      jobsLoaded = true;
    }

    const storedCompanies = localStorage.getItem('redux_companies');
    if (isStoreEmpty(storedCompanies, 'companies')) {
      dispatch(setCompanyLoading(true));
      dispatch(setCompanies(mockCompanies));
      companiesLoaded = true;
    } else {
      dispatch(setCompanyLoading(false));
      companiesLoaded = true;
    }

    // Simulate brief loading for first visit without stored data
    if (jobsLoaded && companiesLoaded && (!storedJobs || !storedCompanies)) {
      const timer = setTimeout(() => {
        dispatch(setJobLoading(false));
        dispatch(setCompanyLoading(false));
      }, 300);
      return () => clearTimeout(timer);
    }

    // Seed mock applications if none exist
    const storedApps = localStorage.getItem('redux_applications');
    if (isStoreEmpty(storedApps, 'applications')) {
      dispatch(setApplications(mockApplications));
    }
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}