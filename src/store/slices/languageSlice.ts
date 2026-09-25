import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import i18n from "@/i18n";
import {
  getInitialLanguage,
  persistLanguage,
  type AppLanguage,
} from "@/i18n/langStorage";

interface LanguageState {
  lang: AppLanguage;
}

const initialState: LanguageState = {
  lang: getInitialLanguage(),
};

export const changeAppLanguage = createAsyncThunk(
  "language/changeAppLanguage",
  async (lang: AppLanguage) => {
    persistLanguage(lang);
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
    await i18n.changeLanguage(lang);
    return lang;
  },
);

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<AppLanguage>) {
      state.lang = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(changeAppLanguage.fulfilled, (state, action) => {
      state.lang = action.payload;
    });
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
