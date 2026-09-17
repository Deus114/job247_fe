import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./slices/themeSlice";
import languageReducer from "./slices/languageSlice";
import authReducer from "./slices/authSlice";
import adminAuthReducer from "./slices/adminAuthSlice";
import jobReducer from "./slices/jobSlice";
import companyReducer from "./slices/companySlice";
import savedJobsReducer from "./slices/savedJobsSlice";
import applicationsReducer from "./slices/applicationsSlice";
import adminUserReducer from "./slices/adminUserSlice";
import roleReducer from "./slices/roleSlice";
import projectUserReducer from "./slices/projectUserSlice";
import businessConfigReducer from "./slices/businessConfigSlice";
import catalogReducer from "./slices/catalogSlice";
import { writeJson, removeKeys } from "@/lib/storage";

const STORE_VERSION = "v2-admin-api-auth";
const STORE_VER_KEY = "redux_store_version";

const LEGACY_KEYS = [
  "redux_theme",
  "redux_auth",
  "redux_adminAuth",
  "redux_jobs",
  "redux_companies",
  "redux_savedJobs",
  "redux_applications",
  "redux_adminUsers",
  "redux_roles",
  "redux_banners",
  "redux_projectUsers",
  "redux_businessConfig",
];

export const PERSIST_KEYS = {
  theme: "redux_theme",
  auth: "redux_auth",
  adminAuth: "redux_adminAuth",
  savedJobs: "redux_savedJobs",
  applications: "redux_applications",
} as const;

if (
  typeof window !== "undefined" &&
  localStorage.getItem(STORE_VER_KEY) !== STORE_VERSION
) {
  removeKeys(LEGACY_KEYS);
  localStorage.setItem(STORE_VER_KEY, STORE_VERSION);
}

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    language: languageReducer,
    auth: authReducer,
    adminAuth: adminAuthReducer,
    jobs: jobReducer,
    companies: companyReducer,
    savedJobs: savedJobsReducer,
    applications: applicationsReducer,
    adminUsers: adminUserReducer,
    roles: roleReducer,
    projectUsers: projectUserReducer,
    businessConfig: businessConfigReducer,
    catalog: catalogReducer,
  },
});

store.subscribe(() => {
  const state = store.getState();
  writeJson(PERSIST_KEYS.theme, state.theme);
  writeJson(PERSIST_KEYS.auth, state.auth);
  writeJson(PERSIST_KEYS.adminAuth, state.adminAuth);
  writeJson(PERSIST_KEYS.savedJobs, state.savedJobs);
  writeJson(PERSIST_KEYS.applications, state.applications);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
