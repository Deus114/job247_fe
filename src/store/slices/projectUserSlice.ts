import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { mockProjectUsers } from '@/mocks/projectUsers';
import type { ProjectUser } from '@/types/projectUser';

interface ProjectUsersState {
  items: ProjectUser[];
  loading: boolean;
  error: string | null;
}

const initialState: ProjectUsersState = {
  items: mockProjectUsers,
  loading: false,
  error: null,
};

const projectUserSlice = createSlice({
  name: 'projectUsers',
  initialState,
  reducers: {
    setProjectUsers(state, action: PayloadAction<ProjectUser[]>) {
      state.items = action.payload;
      state.loading = false;
    },
    addProjectUser(state, action: PayloadAction<ProjectUser>) {
      state.items.unshift(action.payload);
    },
    updateProjectUser(state, action: PayloadAction<Partial<ProjectUser> & { id: string }>) {
      const index = state.items.findIndex((u) => u.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
    },
    deleteProjectUser(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((u) => u.id === action.payload);
      if (index !== -1) {
        state.items[index].deletedAt = new Date().toISOString();
      }
    },
    restoreProjectUser(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((u) => u.id === action.payload);
      if (index !== -1) {
        state.items[index].deletedAt = undefined;
      }
    },
    permanentDeleteProjectUser(state, action: PayloadAction<string>) {
      state.items = state.items.filter((u) => u.id !== action.payload);
    },
    toggleProjectUserStatus(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((u) => u.id === action.payload);
      if (index !== -1) {
        state.items[index].status = state.items[index].status === 'active' ? 'inactive' : 'active';
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setProjectUsers, addProjectUser, updateProjectUser, deleteProjectUser,
  restoreProjectUser, permanentDeleteProjectUser,
  toggleProjectUserStatus, setLoading, setError,
} = projectUserSlice.actions;
export default projectUserSlice.reducer;