import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BusinessConfig } from '@/types/businessConfig';
import { mockBusinessConfig } from '@/mocks/businessConfig';

interface BusinessConfigState {
  config: BusinessConfig;
}

const initialState: BusinessConfigState = {
  config: mockBusinessConfig,
};

const businessConfigSlice = createSlice({
  name: 'businessConfig',
  initialState,
  reducers: {
    updateBusinessConfig(state, action: PayloadAction<Partial<BusinessConfig>>) {
      state.config = {
        ...state.config,
        ...action.payload,
        updatedAt: new Date().toISOString().split('T')[0],
      };
    },
    resetBusinessConfig(state) {
      state.config = { ...mockBusinessConfig };
    },
  },
});

export const { updateBusinessConfig, resetBusinessConfig } = businessConfigSlice.actions;
export default businessConfigSlice.reducer;