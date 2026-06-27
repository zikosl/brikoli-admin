import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { languageMeta, translations, type Language, type TranslationKey } from '../i18n/translations';

type TranslationValues = Record<string, string | number>;

interface LanguageContextValue {
  language: Language;
  direction: 'ltr' | 'rtl';
  locale: string;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
}

const storageKey = 'brikoli-admin-language';

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const storedLanguage = window.localStorage.getItem(storageKey);
  return storedLanguage === 'ar' || storedLanguage === 'en' ? storedLanguage : 'en';
};

const interpolate = (text: string, values?: TranslationValues) => {
  if (!values) {
    return text;
  }

  return Object.entries(values).reduce(
    (current, [key, value]) => current.split(`{${key}}`).join(String(value)),
    text,
  );
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const direction = languageMeta[language].dir;
  const locale = languageMeta[language].locale;

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    window.localStorage.setItem(storageKey, language);
  }, [direction, language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => (current === 'en' ? 'ar' : 'en'));
  }, []);

  const t = useCallback(
    (key: TranslationKey, values?: TranslationValues) => interpolate(translations[language][key], values),
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      direction,
      locale,
      setLanguage,
      toggleLanguage,
      t,
    }),
    [direction, language, locale, setLanguage, t, toggleLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider.');
  }

  return context;
}
