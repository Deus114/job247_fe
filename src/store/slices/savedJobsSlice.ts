import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SavedJob {
  jobId: string;
  savedAt: string;
}

interface SavedJobsState {
  items: SavedJob[];
}

const initialState: SavedJobsState = {
  items: [],
};

const savedJobsSlice = createSlice({
  name: 'savedJobs',
  initialState,
  reducers: {
    saveJob(state, action: PayloadAction<string>) {
      const exists = state.items.find((i) => i.jobId === action.payload);
      if (!exists) {
        state.items.unshift({ jobId: action.payload, savedAt: new Date().toISOString() });
      }
    },
    removeSavedJob(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.jobId !== action.payload);
    },
    clearSavedJobs(state) {
      state.items = [];
    },
  },
});

export const { saveJob, removeSavedJob, clearSavedJobs } = savedJobsSlice.actions;
export default savedJobsSlice.reducer;