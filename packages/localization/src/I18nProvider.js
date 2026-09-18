import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import translations from './translations';
import { LanguageCode, LANGUAGE_LABELS } from './types';

const I18nContext = createContext(null);

export const I18nProvider = ({ children, defaultLanguage = LanguageCode.ENGLISH, language: controlledLanguage }) => {
  const [internalLanguage, setInternalLanguage] = useState(defaultLanguage);
  const language = controlledLanguage || internalLanguage;
  const setLanguage = useCallback((code) => {
    if (controlledLanguage !== undefined) {
      // In controlled mode, the parent manages language
      // The I18nProvider's setLanguage becomes a no-op; use PreferencesProvider.setLanguage instead
      console.warn('[I18nProvider] In controlled mode, use PreferencesProvider.setLanguage to change language');
    } else {
      setInternalLanguage(code);
    }
  }, [controlledLanguage]);

  /**
   * Translate a key into the current language.
   * Falls back to English if the key is missing in the current language.
   */
  const t = useCallback(
    (key, params = {}) => {
      const langStrings = translations[language] || translations[LanguageCode.ENGLISH];
      const fallbackStrings = translations[LanguageCode.ENGLISH];
      let str = langStrings[key] || fallbackStrings[key] || key;

      // Interpolate parameters: {{name}} → value
      Object.entries(params).forEach(([param, value]) => {
        str = str.replace(new RegExp(`\\{\\{${param}\\}\\}`, 'g'), value);
      });

      return str;
    },
    [language],
  );

  /**
   * Get the display label for the current language.
   */
  const languageLabel = LANGUAGE_LABELS[language] || language;

  /**
   * Get all available languages.
   */
  const availableLanguages = useMemo(
    () =>
      Object.entries(LANGUAGE_LABELS).map(([code, label]) => ({
        code,
        label,
      })),
    [],
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      languageLabel,
      availableLanguages,
    }),
    [language, t, languageLabel, availableLanguages],
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

export default I18nProvider;
