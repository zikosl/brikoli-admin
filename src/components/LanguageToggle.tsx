import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle() {
  const { language, toggleLanguage, t } = useLanguage();
  const nextLabel = language === 'en' ? t('language.arabic') : t('language.english');
  const title = language === 'en' ? t('language.switchToArabic') : t('language.switchToEnglish');

  return (
    <button type="button" className="btn-secondary h-10 px-3" onClick={toggleLanguage} title={title}>
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">{nextLabel}</span>
    </button>
  );
}
