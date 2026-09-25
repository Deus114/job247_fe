import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { readJson } from "@/lib/storage";

interface ThemeState {
  mode: "light" | "dark";
}

const stored = readJson<ThemeState>("redux_theme");

const initialState: ThemeState = {
  mode: stored?.mode === "dark" ? "dark" : "light",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<"light" | "dark">) {
      state.mode = action.payload;
    },
    toggleTheme(state) {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
