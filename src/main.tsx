import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import i18n, { i18nReady } from './i18n'
import { normalizeLanguage } from './i18n/langStorage'
import './index.css'
import App from './App.tsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Avoid stale chunk mismatches in local development.
    if (import.meta.env.DEV) {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => void reg.unregister());
      });
      if ('caches' in window) {
        void caches.keys().then((keys) => {
          keys.forEach((key) => void caches.delete(key));
        });
      }
      return;
    }

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(
      (registration) => {
        console.log('SW registered:', registration.scope);
      },
      (err) => {
        console.log('SW registration failed:', err);
      },
    );
  });
}

void i18nReady.then(() => {
  document.documentElement.lang = normalizeLanguage(i18n.language);

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
