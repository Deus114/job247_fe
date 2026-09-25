import axios from "@/api/axios.customize";
import { withApiFallback } from "@/api/withApiFallback";
import {
  mockJobs,
  mockCategories,
  mockEducationLevels,
  mockLocations,
} from "@/mocks/jobs";
import type { Job, JobsCatalog } from "@/types/job";

function mockCatalog(): JobsCatalog {
  return {
    jobs: mockJobs,
    categories: mockCategories,
    educationLevels: mockEducationLevels,
    locations: mockLocations,
  };
}

export async function fetchJobsCatalog(): Promise<JobsCatalog> {
  return withApiFallback(
    () => axios.get<JobsCatalog, JobsCatalog>("/api/jobs/catalog"),
    mockCatalog,
  );
}

export async function fetchJobById(id: string): Promise<Job | null> {
  return withApiFallback(
    () => axios.get<Job, Job>(`/api/jobs/${id}`),
    () => mockJobs.find((job) => job.id === id) ?? null,
    100,
  );
}
