import React from 'react';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';

interface Props {
  compact?: boolean;
}

const OLanguageSwitcher: React.FC<Props> = ({ compact = false }) => {
  const { t } = useTranslation();

  const changeLang = (lng: 'th' | 'en') => {
    i18n.changeLanguage(lng);
    try {
      localStorage.setItem('adaqueue_lang', lng);
    } catch {}
  };

  return (
    <div className={`${compact ? 'flex flex-col items-center gap-1' : 'flex items-center gap-2'}`}>
      {!compact && (
        <span className="text-sm text-gray-500 dark:text-gray-400">{t('common.language')}</span>
      )}
      <button
        onClick={() => changeLang('th')}
        className={`${compact
            ? 'w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 text-[10px] font-bold bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            : 'px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        aria-label={t('common.thai')}
      >{compact ? 'TH' : t('common.thai')}</button>
      <button
        onClick={() => changeLang('en')}
        className={`${compact
            ? 'w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 text-[10px] font-bold bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            : 'px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        aria-label={t('common.english')}
      >{compact ? 'EN' : t('common.english')}</button>
    </div>
  );
};

export default OLanguageSwitcher;
