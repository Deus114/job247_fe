import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Banner } from '@/mocks/banners';
import { mockBanners } from '@/mocks/banners';

interface BannerState {
  items: Banner[];
}

const initialState: BannerState = {
  items: mockBanners,
};

const bannerSlice = createSlice({
  name: 'banners',
  initialState,
  reducers: {
    setBanners(state, action: PayloadAction<Banner[]>) {
      state.items = action.payload;
    },
    addBanner(state, action: PayloadAction<Banner>) {
      state.items.unshift(action.payload);
    },
    updateBanner(state, action: PayloadAction<Banner>) {
      const index = state.items.findIndex((b) => b.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteBanner(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((b) => b.id === action.payload);
      if (index !== -1) {
        state.items[index].deletedAt = new Date().toISOString();
      }
    },
    restoreBanner(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((b) => b.id === action.payload);
      if (index !== -1) {
        state.items[index].deletedAt = undefined;
      }
    },
    permanentDeleteBanner(state, action: PayloadAction<string>) {
      state.items = state.items.filter((b) => b.id !== action.payload);
    },
    toggleBannerStatus(state, action: PayloadAction<string>) {
      const index = state.items.findIndex((b) => b.id === action.payload);
      if (index !== -1) {
        state.items[index].status = state.items[index].status === 'active' ? 'inactive' : 'active';
      }
    },
  },
});

export const {
  setBanners,
  addBanner,
  updateBanner,
  deleteBanner,
  restoreBanner,
  permanentDeleteBanner,
  toggleBannerStatus,
} = bannerSlice.actions;
export default bannerSlice.reducer;