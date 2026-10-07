import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { readJson } from "@/lib/storage";

export interface SavedJob {
  jobId: string;
  savedAt: string;
}

interface SavedJobsState {
  items: SavedJob[];
}

const stored = readJson<SavedJobsState>("redux_savedJobs");

const initialState: SavedJobsState = {
  items: Array.isArray(stored?.items) ? stored.items : [],
};

const savedJobsSlice = createSlice({
  name: "savedJobs",
  initialState,
  reducers: {
    setSavedJobs(state, action: PayloadAction<SavedJob[]>) {
      const seen = new Set<string>();
      state.items = action.payload.filter((item) => {
        if (!item?.jobId || seen.has(item.jobId)) return false;
        seen.add(item.jobId);
        return true;
      });
    },
    saveJob(state, action: PayloadAction<string>) {
      const exists = state.items.find((i) => i.jobId === action.payload);
      if (!exists) {
        state.items.unshift({
          jobId: action.payload,
          savedAt: new Date().toISOString(),
        });
      }
    },
    /** Upsert IDs from a page without wiping other pages. */
    mergeSavedJobs(state, action: PayloadAction<SavedJob[]>) {
      const byId = new Map(state.items.map((item) => [item.jobId, item]));
      for (const item of action.payload) {
        if (!item?.jobId) continue;
        byId.set(item.jobId, item);
      }
      state.items = Array.from(byId.values());
    },
    removeSavedJob(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.jobId !== action.payload);
    },
    clearSavedJobs(state) {
      state.items = [];
    },
  },
});

export const {
  setSavedJobs,
  mergeSavedJobs,
  saveJob,
  removeSavedJob,
  clearSavedJobs,
} = savedJobsSlice.actions;
export default savedJobsSlice.reducer;
