import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import ar from './ar.json';
import fr from './fr.json';

// UI language is independent from lesson content language.
// Detection order: manual choice (localStorage) first, then device language.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { ar: { translation: ar }, fr: { translation: fr } },
    supportedLngs: ['ar', 'fr'],
    fallbackLng: 'ar',
    nonExplicitSupportedLngs: true,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'fl_ui_lang',
    },
    interpolation: { escapeValue: false },
  });

export function applyDocumentDirection(lang: string) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

applyDocumentDirection(i18n.resolvedLanguage ?? 'ar');
i18n.on('languageChanged', applyDocumentDirection);

export default i18n;
