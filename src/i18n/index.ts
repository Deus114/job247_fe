import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import messages from './local/index';
import { getInitialLanguage, persistLanguage } from './langStorage';

const initialLng = getInitialLanguage();
persistLanguage(initialLng);

export const i18nReady = i18n.use(initReactI18next).init({
  lng: initialLng,
  fallbackLng: initialLng,
  supportedLngs: ['vi', 'en'],
  ns: ['translation'],
  defaultNS: 'translation',
  resources: messages,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
  load: 'currentOnly',
  initAsync: false,
});

export default i18n;
