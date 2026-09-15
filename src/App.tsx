import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { useEffect } from 'react';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { AppRoutes } from './router';
import ErrorBoundary from '@/components/ErrorBoundary';
import ToastHost from '@/components/ui/ToastHost';
import { env } from '@/config/env';
import i18n from './i18n';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useAppSelector((state) => state.theme.mode);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode]);

  return <>{children}</>;
}

function AppContent() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <BrowserRouter basename={env.basePath || __BASE_PATH__}>
          <AppRoutes />
          <ToastHost />
        </BrowserRouter>
      </ErrorBoundary>
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
