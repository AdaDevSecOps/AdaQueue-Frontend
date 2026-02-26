import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Common
import thCommon from './locales/th/common.json';
import enCommon from './locales/en/common.json';

// Kiosk
import thKiosk from './locales/th/kiosk.json';
import enKiosk from './locales/en/kiosk.json';

// Customer
import thCustomer from './locales/th/customer.json';
import enCustomer from './locales/en/customer.json';

// Staff
import thStaff from './locales/th/staff.json';
import enStaff from './locales/en/staff.json';

// Admin
import thAdmin from './locales/th/admin.json';
import enAdmin from './locales/en/admin.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      th: {
        common: thCommon,
        kiosk: thKiosk,
        customer: thCustomer,
        staff: thStaff,
        admin: thAdmin,
      },
      en: {
        common: enCommon,
        kiosk: enKiosk,
        customer: enCustomer,
        staff: enStaff,
        admin: enAdmin,
      },
    },
    ns: ['common', 'kiosk', 'customer', 'staff', 'admin'],
    defaultNS: 'common',
    fallbackLng: 'th',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'adaqueue_lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
