import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Province } from '@/types/catalog';
import { mockProvinces } from '@/mocks/catalog';

interface CatalogState {
  provinces: Province[];
  deletedProvinces: Province[];
}

const initialState: CatalogState = {
  provinces: mockProvinces.map((p) => ({ ...p, isActive: p.isActive !== false })),
  deletedProvinces: [],
};

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    addProvince(
      state,
      action: PayloadAction<{
        name: string;
        code?: string;
        region?: string;
      }>,
    ) {
      const name = action.payload.name.trim();
      if (!name) return;
      if (
        state.provinces.some((p) => p.name === name) ||
        state.deletedProvinces.some((p) => p.name === name)
      ) {
        return;
      }
      state.provinces.push({
        id: nextId('pv'),
        name,
        code: action.payload.code?.trim() || '',
        region: action.payload.region || '',
        isActive: true,
        createdAt: new Date().toISOString().slice(0, 10),
      });
    },
    updateProvince(
      state,
      action: PayloadAction<{
        id: string;
        name: string;
        code?: string;
        region?: string;
      }>,
    ) {
      const item = state.provinces.find((p) => p.id === action.payload.id);
      if (!item) return;
      const name = action.payload.name.trim();
      if (!name) return;
      if (state.provinces.some((p) => p.id !== item.id && p.name === name)) return;
      item.name = name;
      item.code = action.payload.code?.trim() || '';
      item.region = action.payload.region || '';
    },
    softDeleteProvince(state, action: PayloadAction<string>) {
      const idx = state.provinces.findIndex((p) => p.id === action.payload);
      if (idx < 0) return;
      const [removed] = state.provinces.splice(idx, 1);
      removed.deletedAt = new Date().toISOString();
      state.deletedProvinces.push(removed);
    },
    restoreProvince(state, action: PayloadAction<string>) {
      const idx = state.deletedProvinces.findIndex((p) => p.id === action.payload);
      if (idx < 0) return;
      const [removed] = state.deletedProvinces.splice(idx, 1);
      delete removed.deletedAt;
      state.provinces.push(removed);
    },
    permanentDeleteProvince(state, action: PayloadAction<string>) {
      state.deletedProvinces = state.deletedProvinces.filter(
        (p) => p.id !== action.payload,
      );
    },
    toggleProvinceActive(state, action: PayloadAction<string>) {
      const item = state.provinces.find((p) => p.id === action.payload);
      if (item) item.isActive = item.isActive === false ? true : false;
    },
  },
});

export const {
  addProvince,
  updateProvince,
  softDeleteProvince,
  restoreProvince,
  permanentDeleteProvince,
  toggleProvinceActive,
} = catalogSlice.actions;

export default catalogSlice.reducer;
