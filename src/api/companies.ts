import axios from "@/api/axios.customize";
import { withApiFallback } from "@/api/withApiFallback";
import { mockCompanies } from "@/mocks/companies";
import type { Company } from "@/types/company";

export async function fetchCompanies(): Promise<Company[]> {
  return withApiFallback(
    () => axios.get<Company[], Company[]>("/api/companies"),
    () => mockCompanies,
  );
}
