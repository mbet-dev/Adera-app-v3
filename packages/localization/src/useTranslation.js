import { useContext } from 'react';
import { I18nContext } from './I18nProvider';

/**
 * Hook to access translation functions and language state.
 *
 * Usage:
 *   const { t, language, setLanguage } = useTranslation();
 *   <Text>{t('auth.login')}</Text>
 */
export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

export default useTranslation;
