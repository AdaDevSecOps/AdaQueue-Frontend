import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface OUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: any) => Promise<void>;
  user?: any;
}

const OUserModal: React.FC<OUserModalProps> = ({ isOpen, onClose, onSave, user }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    role: 'STAFF',
    pin: '',
    status: '1'
  });
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        code: user.code,
        name: user.name || '',
        role: user.role,
        pin: '',
        status: user.status
      });
      setIsResettingPin(false);
    } else {
      setFormData({
        code: '',
        name: '',
        role: 'STAFF',
        pin: '',
        status: '1'
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isResettingPin) {
        // Handle specific PIN reset separate from main edit if needed
        // But for simplicity, we can just pass the new pin in update
        await onSave({ ...formData });
      } else {
        await onSave(formData);
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      if (error.response?.status === 409) {
        toast.error(t('messages.userCodeExists'));
      } else {
        toast.error(t('messages.errorOccurred'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-700 transition-all">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {user ? (isResettingPin ? t('common.resetPin') : t('common.edit')) : t('common.add')} {t('menu.accountManagement')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isResettingPin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.userCode')}</label>
                <input
                  type="text"
                  required
                  disabled={!!user}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white disabled:opacity-50"
                  placeholder="e.g. 001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.userName')}</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.role')}</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                >
                  <option value="ADMIN">{t('common.admin')}</option>
                  <option value="STAFF">{t('common.staff')}</option>
                  <option value="KIOSK">{t('common.kiosk')}</option>
                </select>
              </div>

              {user ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.status')}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  >
                    <option value="1">{t('common.active')}</option>
                    <option value="2">{t('common.inactive')}</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PIN</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                    placeholder="4 digits"
                  />
                </div>
              )}
            </>
          )}

          {isResettingPin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New PIN</label>
              <input
                type="password"
                required
                maxLength={4}
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                placeholder="4 digits"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {user && !isResettingPin && (
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, pin: '' });
                  setIsResettingPin(true);
                }}
                className="flex-1 px-2 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-xl hover:bg-yellow-200 dark:hover:bg-yellow-900/50 font-medium transition-colors"
              >
                {t('common.resetPin')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-2 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (isResettingPin ? formData.pin.length !== 4 : (!user ? (!formData.code || !formData.name || formData.pin.length !== 4) : (!formData.code || !formData.name)))}
              className="flex-[2] px-2 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 font-bold transition-all disabled:opacity-50"
            >
              {isSubmitting ? '...' : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OUserModal;
