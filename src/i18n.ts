import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  th: {
    translation: {
      brand: 'AdaQueue',
      menu: {
        dashboard: 'แดชบอร์ด',
        performanceReport: 'รายงานประสิทธิภาพ',
        workflowDesigner: 'ออกแบบเวิร์กโฟลว์',
        staffOperations: 'งานเจ้าหน้าที่',
        bulkManagement: 'จัดการแบบกลุ่ม',
        displayBoard: 'จอแสดงผล',
        kioskMode: 'โหมดคีออส'
      },
      theme: {
        dark: 'โหมดมืด',
        light: 'โหมดสว่าง',
        switchToDark: 'สลับเป็นโหมดมืด',
        switchToLight: 'สลับเป็นโหมดสว่าง'
      },
      common: {
        language: 'ภาษา',
        thai: 'ไทย',
        english: 'อังกฤษ'
      }
    }
  },
  en: {
    translation: {
      brand: 'AdaQueue',
      menu: {
        dashboard: 'Dashboard',
        performanceReport: 'Performance Report',
        workflowDesigner: 'Workflow Designer',
        staffOperations: 'Staff Operations',
        bulkManagement: 'Bulk Management',
        displayBoard: 'Display Board',
        kioskMode: 'Kiosk Mode'
      },
      theme: {
        dark: 'Dark Mode',
        light: 'Light Mode',
        switchToDark: 'Switch to Dark Mode',
        switchToLight: 'Switch to Light Mode'
      },
      common: {
        language: 'Language',
        thai: 'Thai',
        english: 'English'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'th',
    interpolation: { escapeValue: false }
  });

export default i18n;
