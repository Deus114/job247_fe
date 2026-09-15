import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addCompany,
  updateCompany,
  deleteCompany,
  restoreCompany,
  permanentDeleteCompany,
  approveCompany,
  rejectCompany,
  setRevisionNeeded,
  toggleCompanyActive,
} from '@/store/slices/companySlice';
import type { Company } from '@/types/company';

/** Domain hook for companies catalog + mutations. */
export function useCompanies() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.companies);

  return {
    companies: items,
    loading,
    addCompany: (company: Company) => {
      dispatch(addCompany(company));
    },
    updateCompany: (company: Company) => {
      dispatch(updateCompany(company));
    },
    deleteCompany: (id: string) => {
      dispatch(deleteCompany(id));
    },
    restoreCompany: (id: string) => {
      dispatch(restoreCompany(id));
    },
    permanentDeleteCompany: (id: string) => {
      dispatch(permanentDeleteCompany(id));
    },
    approveCompany: (id: string) => {
      dispatch(approveCompany(id));
    },
    rejectCompany: (id: string) => {
      dispatch(rejectCompany(id));
    },
    setRevisionNeeded: (payload: { id: string; note: string }) => {
      dispatch(setRevisionNeeded(payload));
    },
    toggleCompanyActive: (id: string) => {
      dispatch(toggleCompanyActive(id));
    },
  };
}
