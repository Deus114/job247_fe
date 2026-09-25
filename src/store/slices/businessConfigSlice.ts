import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { BusinessConfig } from "@/types/businessConfig";
import { createEmptyBusinessConfig } from "@/types/businessConfig";

interface BusinessConfigState {
  config: BusinessConfig;
  /** true after a successful public (or admin sync) load */
  loaded: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: BusinessConfigState = {
  config: createEmptyBusinessConfig(),
  loaded: false,
  status: "idle",
};

const businessConfigSlice = createSlice({
  name: "businessConfig",
  initialState,
  reducers: {
    setBusinessConfigLoading(state) {
      state.status = "loading";
    },
    setBusinessConfig(state, action: PayloadAction<BusinessConfig>) {
      state.config = action.payload;
      state.loaded = true;
      state.status = "succeeded";
    },
    setBusinessConfigFailed(state) {
      state.status = "failed";
    },
    updateBusinessConfig(
      state,
      action: PayloadAction<Partial<BusinessConfig>>,
    ) {
      state.config = {
        ...state.config,
        ...action.payload,
        updatedAt: new Date().toISOString().split("T")[0],
      };
    },
    resetBusinessConfig(state) {
      state.config = createEmptyBusinessConfig();
      state.loaded = false;
      state.status = "idle";
    },
  },
});

export const {
  setBusinessConfigLoading,
  setBusinessConfig,
  setBusinessConfigFailed,
  updateBusinessConfig,
  resetBusinessConfig,
} = businessConfigSlice.actions;
export default businessConfigSlice.reducer;
