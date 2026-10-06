import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import PageLoader from "@/components/ui/PageLoader";
import ToastHost from "@/components/ui/ToastHost";
import { env } from "@/config/env";
import { usePublicAuthBootstrap } from "@/features/auth/hooks/usePublicAuthBootstrap";
import { useBusinessConfigBootstrap } from "@/features/catalog";
import { store } from "@/store";
import { useAppSelector } from "@/store/hooks";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import i18n from "./i18n";
import { AppRoutes } from "./router";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useAppSelector((state) => state.theme.mode);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [mode]);

  return <>{children}</>;
}

function AppContent() {
  useBusinessConfigBootstrap();
  const authReady = usePublicAuthBootstrap();

  return (
    <ThemeProvider>
      {!authReady ? (
        <PageLoader />
      ) : (
        <ErrorBoundary>
          <BrowserRouter basename={env.basePath || __BASE_PATH__}>
            <ScrollToTop />
            <AppRoutes />
            <ToastHost />
          </BrowserRouter>
        </ErrorBoundary>
      )}
    </ThemeProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <AppContent />
      </I18nextProvider>
    </Provider>
  );
}

export default App;
