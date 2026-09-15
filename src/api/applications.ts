import axios from '@/api/axios.customize';
import { withApiFallback } from '@/api/withApiFallback';
import { mockApplications } from '@/mocks/applications';
import type { Application } from '@/types/application';

export async function fetchApplications(): Promise<Application[]> {
  return withApiFallback(
    () => axios.get<Application[], Application[]>('/api/applications'),
    () => mockApplications,
    100,
  );
}
