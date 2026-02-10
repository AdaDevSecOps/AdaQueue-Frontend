import React from 'react';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';

const OLanguageSwitcher: React.FC = () => {
  const { t } = useTranslation();

  const changeLang = (lng: 'th' | 'en') => {
    i18n.changeLanguage(lng);
    try {
      localStorage.setItem('adaqueue_lang', lng);
    } catch {}
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">{t('common.language')}</span>
      <button
        onClick={() => changeLang('th')}
        className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Thai"
      >{t('common.thai')}</button>
      <button
        onClick={() => changeLang('en')}
        className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="English"
      >{t('common.english')}</button>
    </div>
  );
};

export default OLanguageSwitcher;
