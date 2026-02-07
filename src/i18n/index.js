import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import es from './locales/es.json';
import en from './locales/en.json';

const STORAGE_KEY = 'mypaws_lang';
const SUPPORTED_LANGS = ['en', 'es'];
const FALLBACK_LANG = 'en';

function normalizeLang(lang) {
  if (!lang) return FALLBACK_LANG;
  const short = lang.toLowerCase().split('-')[0];
  return SUPPORTED_LANGS.includes(short) ? short : FALLBACK_LANG;
}

function getInitialLang() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED_LANGS.includes(saved)) return saved;

  return normalizeLang(navigator.language);
}

export function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  localStorage.setItem(STORAGE_KEY, lang);
  i18n.changeLanguage(lang);
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: getInitialLang(),
  fallbackLng: FALLBACK_LANG,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
