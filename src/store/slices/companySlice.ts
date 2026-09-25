import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { env } from "@/config/env";
import { mockCompanies } from "@/mocks/companies";
import type { Company } from "@/types/company";

export type { Company } from "@/types/company";

interface CompaniesState {
  items: Company[];
  loading: boolean;
  error: string | null;
}

const initialState: CompaniesState = env.useMock
  ? {
      items: mockCompanies,
      loading: false,
      error: null,
    }
  : {
      items: [],
      loading: true,
      error: null,
    };

const companySlice = createSlice({
  name: "companies",
  initialState,
  reducers: {
    setCompanies(state, action: PayloadAction<Company[]>) {
      state.items = action.payload;
      state.loading = false;
    },
    addCompany(state, action: PayloadAction<Company>) {
      state.items.unshift(action.payload);
    },
    updateCompany(
      state,
      action: PayloadAction<Partial<Company> & { id: string }>,
    ) {
      const index = state.items.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload,
          updatedAt: new Date().toISOString().split("T")[0],
        };
      }
    },
    deleteCompany(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((c) => c.id === action.payload);
      if (index !== -1) {
        state.items[index].deletedAt = new Date().toISOString();
      }
    },
    restoreCompany(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((c) => c.id === action.payload);
      if (index !== -1) {
        state.items[index].deletedAt = undefined;
      }
    },
    permanentDeleteCompany(state, action: PayloadAction<string>) {
      state.items = state.items.filter((c) => c.id !== action.payload);
    },
    approveCompany(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((c) => c.id === action.payload);
      if (index !== -1) {
        state.items[index].status = "approved";
        state.items[index].adminNote = undefined;
        state.items[index].updatedAt = new Date().toISOString().split("T")[0];
      }
    },
    rejectCompany(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((c) => c.id === action.payload);
      if (index !== -1) {
        state.items[index].status = "rejected";
        state.items[index].updatedAt = new Date().toISOString().split("T")[0];
      }
    },
    setRevisionNeeded(
      state,
      action: PayloadAction<{ id: string; note: string }>,
    ) {
      const index = state.items.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index].status = "needs_revision";
        state.items[index].adminNote = action.payload.note;
        state.items[index].updatedAt = new Date().toISOString().split("T")[0];
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    toggleCompanyActive(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((c) => c.id === action.payload);
      if (index !== -1) {
        state.items[index].isActive =
          state.items[index].isActive === false ? true : false;
      }
    },
  },
});

export const {
  setCompanies,
  addCompany,
  updateCompany,
  deleteCompany,
  restoreCompany,
  permanentDeleteCompany,
  approveCompany,
  rejectCompany,
  setRevisionNeeded,
  setLoading,
  setError,
  toggleCompanyActive,
} = companySlice.actions;
export default companySlice.reducer;
