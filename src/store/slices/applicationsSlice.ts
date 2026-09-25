import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { readJson } from "@/lib/storage";
import { env } from "@/config/env";
import { mockApplications } from "@/mocks/applications";
import type { Application } from "@/types/application";

export type { Application } from "@/types/application";

interface ApplicationsState {
  items: Application[];
}

function loadInitialApplications(): Application[] {
  const stored = readJson<ApplicationsState>("redux_applications");
  if (Array.isArray(stored?.items) && stored.items.length > 0) {
    const seen = new Set<string>();
    return stored.items.filter((app) => {
      if (!app?.id || seen.has(app.id)) return false;
      seen.add(app.id);
      return true;
    });
  }
  return env.useMock ? mockApplications : [];
}

const initialState: ApplicationsState = {
  items: loadInitialApplications(),
};

const applicationsSlice = createSlice({
  name: "applications",
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
      action: PayloadAction<{ id: string; status: Application["status"] }>,
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

export const {
  setApplications,
  addApplication,
  removeApplication,
  updateApplicationStatus,
  updateApplication,
  clearApplications,
} = applicationsSlice.actions;
export default applicationsSlice.reducer;
