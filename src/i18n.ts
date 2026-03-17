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
        accountManagement: 'จัดการบัญชีผู้ใช้',
        workflowDesigner: 'ออกแบบเวิร์กโฟลว์',
        staffOperations: 'งานเจ้าหน้าที่',
        bulkManagement: 'จัดการแบบกลุ่ม',
        displayBoard: 'จอแสดงผล',
        kioskMode: 'โหมดคีออส',
        manageProfiles: 'ผูกโปรไฟล์'
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
        english: 'อังกฤษ',
        search: 'ค้นหา',
        add: 'เพิ่ม',
        edit: 'แก้ไข',
        delete: 'ลบ',
        save: 'บันทึก',
        cancel: 'ยกเลิก',
        status: 'สถานะ',
        role: 'ระดับสิทธิ์',
        lastLogin: 'เข้าใช้ครั้งล่าสุด',
        active: 'ใช้งาน',
        inactive: 'ไม่ใช้งาน',
        deleted: 'ลบ',
        all: 'ทั้งหมด',
        admin: 'ผู้ดูแลระบบ',
        staff: 'เจ้าหน้าที่',
        kiosk: 'คีออส',
        resetPin: 'รีเซ็ต PIN',
        userCode: 'รหัสพนักงาน',
        userName: 'ชื่อพนักงาน',
        success: 'ความสำเร็จ',
        error: 'เกิดข้อผิดพลาด',
        assignProfile: 'ผูกโปรไฟล์',
        showing: 'แสดง',
        to: 'ถึง',
        of: 'จากทั้งหมด',
        results: 'รายการ',
        previous: 'ก่อนหน้า',
        next: 'ถัดไป',
        itemsPerPage: 'รายการต่อหน้า'
      },
      messages: {
        createSuccess: 'สร้างบัญชีผู้ใช้สำเร็จ',
        updateSuccess: 'อัปเดตข้อมูลสำเร็จ',
        deleteSuccess: 'ลบบัญชีผู้ใช้สำเร็จ',
        userCodeExists: 'รหัสพนักงานนี้มีในระบบแล้ว',
        errorOccurred: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
        profileAssigned: 'ผูกโปรไฟล์สำเร็จ'
      },
      errors: {
        accountSuspended: 'บัญชีของท่านถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ'
      }
    }
  },
  en: {
    translation: {
      brand: 'AdaQueue',
      menu: {
        dashboard: 'Dashboard',
        performanceReport: 'Performance Report',
        accountManagement: 'Account Management',
        workflowDesigner: 'Workflow Designer',
        staffOperations: 'Staff Operations',
        bulkManagement: 'Bulk Management',
        displayBoard: 'Display Board',
        kioskMode: 'Kiosk Mode',
        manageProfiles: 'Manage Profiles'
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
        english: 'English',
        search: 'Search',
        add: 'Add',
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        cancel: 'Cancel',
        status: 'Status',
        role: 'Role',
        lastLogin: 'Last Login',
        active: 'Active',
        inactive: 'Inactive',
        deleted: 'Deleted',
        all: 'All',
        admin: 'Admin',
        staff: 'Staff',
        kiosk: 'Kiosk',
        resetPin: 'Reset PIN',
        userCode: 'User Code',
        userName: 'User Name',
        success: 'Success',
        error: 'Error',
        assignProfile: 'Assign Profile',
        showing: 'Showing',
        to: 'to',
        of: 'of',
        results: 'results',
        previous: 'Previous',
        next: 'Next',
        itemsPerPage: 'Items per page'
      },
      messages: {
        createSuccess: 'Account created successfully',
        updateSuccess: 'Information updated successfully',
        deleteSuccess: 'Account deleted successfully',
        userCodeExists: 'User Code already exists',
        errorOccurred: 'An error occurred. Please try again.',
        profileAssigned: 'Profile assigned successfully'
      },
      errors: {
        accountSuspended: 'Your account has been suspended. Please contact admin.'
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
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'adaqueue_lang',
      caches: ['localStorage']
    }
  });

export default i18n;
