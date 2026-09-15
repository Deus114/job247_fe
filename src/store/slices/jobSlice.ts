import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { env } from '@/config/env';
import {
  mockJobs,
  mockCategories,
  mockEducationLevels,
  mockLocations,
} from '@/mocks/jobs';
import type { Job, CategoryItem, EducationLevelItem } from '@/types/job';

export type { Job, CategoryItem, EducationLevelItem } from '@/types/job';

interface JobsState {
  items: Job[];
  categories: CategoryItem[];
  educationLevels: EducationLevelItem[];
  locations: string[];
  deletedCategories: CategoryItem[];
  deletedEducationLevels: EducationLevelItem[];
  loading: boolean;
  error: string | null;
}

const initialState: JobsState = env.useMock
  ? {
      items: mockJobs,
      categories: mockCategories,
      educationLevels: mockEducationLevels,
      locations: mockLocations,
      deletedCategories: [],
      deletedEducationLevels: [],
      loading: false,
      error: null,
    }
  : {
      items: [],
      categories: [],
      educationLevels: [],
      locations: [],
      deletedCategories: [],
      deletedEducationLevels: [],
      loading: true,
      error: null,
    };

const jobSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobs(state, action: PayloadAction<Job[]>) {
      state.items = action.payload;
      state.loading = false;
    },
    addJob(state, action: PayloadAction<Job>) {
      state.items.unshift(action.payload);
    },
    updateJob(state, action: PayloadAction<Job>) {
      const index = state.items.findIndex((j) => j.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteJob(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((j) => j.id === action.payload);
      if (index !== -1) {
        state.items[index].deletedAt = new Date().toISOString();
      }
    },
    restoreJob(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((j) => j.id === action.payload);
      if (index !== -1) {
        state.items[index].deletedAt = undefined;
      }
    },
    permanentDeleteJob(state, action: PayloadAction<string>) {
      state.items = state.items.filter((j) => j.id !== action.payload);
    },
    // Category reducers
    setCategories(state, action: PayloadAction<CategoryItem[]>) {
      state.categories = action.payload;
    },
    addCategory(state, action: PayloadAction<CategoryItem>) {
      if (!state.categories.some((c) => c.name === action.payload.name)) {
        state.categories.push(action.payload);
      }
    },
    updateCategory(state, action: PayloadAction<{ oldName: string; newName: string; image?: string }>) {
      const { oldName, newName } = action.payload;
      const idx = state.categories.findIndex((c) => c.name === oldName);
      if (idx !== -1) {
        state.categories[idx].name = newName.trim();
        if (action.payload.image !== undefined) {
          state.categories[idx].image = action.payload.image;
        }
      }
      state.items.forEach((job) => {
        if (job.category === oldName) {
          job.category = newName.trim();
        }
      });
    },
    softDeleteCategory(state, action: PayloadAction<string>) {
      const name = action.payload;
      const idx = state.categories.findIndex((c) => c.name === name);
      if (idx !== -1) {
        const [removed] = state.categories.splice(idx, 1);
        state.deletedCategories.push({ ...removed, deletedAt: new Date().toISOString() });
      }
    },
    restoreCategory(state, action: PayloadAction<string>) {
      const name = action.payload;
      const idx = state.deletedCategories.findIndex((c) => c.name === name);
      if (idx !== -1) {
        const [removed] = state.deletedCategories.splice(idx, 1);
        state.categories.push(removed);
      }
    },
    permanentDeleteCategory(state, action: PayloadAction<string>) {
      state.deletedCategories = state.deletedCategories.filter((c) => c.name !== action.payload);
    },
    // Education reducers
    setEducationLevels(state, action: PayloadAction<EducationLevelItem[]>) {
      state.educationLevels = action.payload;
    },
    addEducationLevel(state, action: PayloadAction<string>) {
      if (!state.educationLevels.some((l) => l.name === action.payload)) {
        state.educationLevels.push({ name: action.payload });
      }
    },
    updateEducationLevel(state, action: PayloadAction<{ oldName: string; newName: string }>) {
      const { oldName, newName } = action.payload;
      const idx = state.educationLevels.findIndex((l) => l.name === oldName);
      if (idx !== -1) {
        state.educationLevels[idx].name = newName.trim();
      }
      state.items.forEach((job) => {
        if (job.educationLevel === oldName) {
          job.educationLevel = newName.trim();
        }
      });
    },
    softDeleteEducationLevel(state, action: PayloadAction<string>) {
      const name = action.payload;
      const idx = state.educationLevels.findIndex((l) => l.name === name);
      if (idx !== -1) {
        const [removed] = state.educationLevels.splice(idx, 1);
        state.deletedEducationLevels.push({ ...removed, deletedAt: new Date().toISOString() });
      }
    },
    restoreEducationLevel(state, action: PayloadAction<string>) {
      const name = action.payload;
      const idx = state.deletedEducationLevels.findIndex((l) => l.name === name);
      if (idx !== -1) {
        const [removed] = state.deletedEducationLevels.splice(idx, 1);
        state.educationLevels.push(removed);
      }
    },
    permanentDeleteEducationLevel(state, action: PayloadAction<string>) {
      state.deletedEducationLevels = state.deletedEducationLevels.filter((l) => l.name !== action.payload);
    },
    setLocations(state, action: PayloadAction<string[]>) {
      state.locations = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    // isActive toggles
    toggleJobActive(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((j) => j.id === action.payload);
      if (index !== -1) {
        state.items[index].isActive = state.items[index].isActive === false ? true : false;
      }
    },
    toggleCategoryActive(state, action: PayloadAction<string>) {
      const name = action.payload;
      const idx = state.categories.findIndex((c) => c.name === name);
      if (idx !== -1) {
        state.categories[idx].isActive = state.categories[idx].isActive === false ? true : false;
      }
    },
    toggleEducationLevelActive(state, action: PayloadAction<string>) {
      const name = action.payload;
      const idx = state.educationLevels.findIndex((l) => l.name === name);
      if (idx !== -1) {
        state.educationLevels[idx].isActive = state.educationLevels[idx].isActive === false ? true : false;
      }
    },
  },
});

export const {
  setJobs, addJob, updateJob, deleteJob, restoreJob, permanentDeleteJob,
  setCategories, addCategory, updateCategory, softDeleteCategory, restoreCategory, permanentDeleteCategory,
  setEducationLevels, addEducationLevel, updateEducationLevel, softDeleteEducationLevel, restoreEducationLevel, permanentDeleteEducationLevel,
  setLocations, setLoading, setError,
  toggleJobActive, toggleCategoryActive, toggleEducationLevelActive,
} = jobSlice.actions;
export default jobSlice.reducer;