import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  fullName: string;
  email: string;
  phone: string;
  coverLetter: string;
  cvFileName: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  appliedAt: string;
}

interface ApplicationsState {
  items: Application[];
}

const initialState: ApplicationsState = {
  items: [],
};

const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    setApplications(state, action: PayloadAction<Application[]>) {
      const seen = new Set<string>();
      state.items = action.payload.filter((app) => {
        if (seen.has(app.id)) return false;
        seen.add(app.id);
        return true;
      });
    },
    addApplication(state, action: PayloadAction<Application>) {
      if (!state.items.find((i) => i.id === action.payload.id)) {
        state.items.unshift(action.payload);
      }
    },
    removeApplication(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    updateApplicationStatus(
      state,
      action: PayloadAction<{ id: string; status: Application['status'] }>
    ) {
      const app = state.items.find((i) => i.id === action.payload.id);
      if (app) {
        app.status = action.payload.status;
      }
    },
    updateApplication(state, action: PayloadAction<Application>) {
      const idx = state.items.findIndex((i) => i.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    },
    clearApplications(state) {
      state.items = [];
    },
  },
});

export const { setApplications, addApplication, removeApplication, updateApplicationStatus, updateApplication, clearApplications } =
  applicationsSlice.actions;
export default applicationsSlice.reducer;