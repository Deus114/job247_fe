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
import bannerReducer from "./slices/bannerSlice";
import projectUserReducer from "./slices/projectUserSlice";
import businessConfigReducer from "./slices/businessConfigSlice";

const localStorageMiddleware =
  (_store: any) => (next: any) => (action: any) => {
    const result = next(action);
    const state = _store.getState();
    try {
      localStorage.setItem("redux_theme", JSON.stringify(state.theme));
      localStorage.setItem("redux_auth", JSON.stringify(state.auth));
      localStorage.setItem("redux_jobs", JSON.stringify(state.jobs));
      localStorage.setItem("redux_companies", JSON.stringify(state.companies));
      localStorage.setItem("redux_savedJobs", JSON.stringify(state.savedJobs));
      localStorage.setItem(
        "redux_applications",
        JSON.stringify(state.applications),
      );
      localStorage.setItem(
        "redux_adminUsers",
        JSON.stringify(state.adminUsers),
      );
      localStorage.setItem("redux_roles", JSON.stringify(state.roles));
      localStorage.setItem("redux_banners", JSON.stringify(state.banners));
      localStorage.setItem(
        "redux_projectUsers",
        JSON.stringify(state.projectUsers),
      );
      localStorage.setItem(
        "redux_businessConfig",
        JSON.stringify(state.businessConfig),
      );
    } catch (_) {
      // localStorage not available
    }
    return result;
  };

const STORE_VERSION = "v1";
const STORE_VER_KEY = "redux_store_version";
if (
  typeof window !== "undefined" &&
  localStorage.getItem(STORE_VER_KEY) !== STORE_VERSION
) {
  [
    "redux_theme",
    "redux_auth",
    "redux_jobs",
    "redux_companies",
    "redux_savedJobs",
    "redux_applications",
    "redux_adminUsers",
    "redux_roles",
    "redux_banners",
    "redux_projectUsers",
    "redux_businessConfig",
  ].forEach((k) => localStorage.removeItem(k));
  localStorage.setItem(STORE_VER_KEY, STORE_VERSION);
}

const validateAdminUsers = (parsed: any) => {
  if (!parsed || !Array.isArray(parsed.items)) return undefined;
  const valid = parsed.items.filter((u: any) => u && Array.isArray(u.roleIds));
  if (valid.length === 0) return undefined;
  return { ...parsed, items: valid };
};

const loadFromStorage = () => {
  try {
    const theme = localStorage.getItem("redux_theme");
    const auth = localStorage.getItem("redux_auth");
    const jobs = localStorage.getItem("redux_jobs");
    const companies = localStorage.getItem("redux_companies");
    const savedJobs = localStorage.getItem("redux_savedJobs");
    const applications = localStorage.getItem("redux_applications");
    const adminUsers = localStorage.getItem("redux_adminUsers");
    const roles = localStorage.getItem("redux_roles");
    const banners = localStorage.getItem("redux_banners");
    const projectUsers = localStorage.getItem("redux_projectUsers");
    const businessConfig = localStorage.getItem("redux_businessConfig");
    return {
      theme: theme ? JSON.parse(theme) : undefined,
      auth: auth ? JSON.parse(auth) : undefined,
      jobs: jobs ? JSON.parse(jobs) : undefined,
      companies: companies ? JSON.parse(companies) : undefined,
      savedJobs: savedJobs ? JSON.parse(savedJobs) : undefined,
      applications: applications
        ? (() => {
            const parsed = JSON.parse(applications);
            if (parsed && Array.isArray(parsed.items)) {
              const seen = new Set<string>();
              parsed.items = parsed.items.filter((app: any) => {
                if (!app || seen.has(app.id)) return false;
                seen.add(app.id);
                return true;
              });
            }
            return parsed;
          })()
        : undefined,
      adminUsers: adminUsers
        ? validateAdminUsers(JSON.parse(adminUsers))
        : undefined,
      roles: roles ? JSON.parse(roles) : undefined,
      banners: banners ? JSON.parse(banners) : undefined,
      projectUsers: projectUsers ? JSON.parse(projectUsers) : undefined,
      businessConfig: businessConfig ? JSON.parse(businessConfig) : undefined,
    };
  } catch (_) {
    return {};
  }
};

const preloadedState = loadFromStorage();

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
    banners: bannerReducer,
    projectUsers: projectUserReducer,
    businessConfig: businessConfigReducer,
  },
  preloadedState:
    Object.keys(preloadedState).length > 0 ? preloadedState : undefined,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(localStorageMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
