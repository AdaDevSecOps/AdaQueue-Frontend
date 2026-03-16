import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { apiPath } from '../../config/api';

interface Profile {
  code: string;
  name: string;
  dataJson?: string;
  agnCode?: string;
  businessType?: string;
}

interface OUserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCode?: string;
}

const OUserProfileModal: React.FC<OUserProfileModalProps> = ({ isOpen, onClose, userCode }) => {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileCodes, setSelectedProfileCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && userCode) {
      loadData(userCode);
    } else {
      setProfiles([]);
      setSelectedProfileCodes([]);
    }
  }, [isOpen, userCode]);

  const loadData = async (code: string) => {
    setIsLoading(true);
    try {
      const [profilesRes, assignedRes] = await Promise.all([
        axios.get(apiPath('/api/profiles')),
        axios.get(apiPath(`/api/users/${code}/profiles`))
      ]);
      setProfiles(profilesRes.data);
      setSelectedProfileCodes(assignedRes.data.profileCodes || []);
    } catch (error) {
      console.error('Failed to load profile data:', error);
      toast.error(t('messages.errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProfileSelection = (code: string) => {
    setSelectedProfileCodes(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSave = async () => {
    if (!userCode) return;
    setIsSaving(true);
    try {
      await axios.post(apiPath(`/api/users/${userCode}/profiles`), {
        profileCodes: selectedProfileCodes
      });
      toast.success(t('messages.profileAssigned') || 'Profiles assigned successfully');
      onClose();
    } catch (error) {
      console.error('Failed to save profiles:', error);
      toast.error(t('messages.errorOccurred'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-700 transition-all">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span role="img" aria-label="profiles">🏷️</span> {t('menu.manageProfiles') || 'Manage Profiles'} ({userCode})
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {isLoading ? (
          <div className="py-10 flex justify-center items-center h-48">
            <div className="text-gray-500 animate-pulse text-sm">Loading profiles...</div>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {profiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No profiles found in the system.</div>
            ) : (
              profiles.map(profile => (
                <label 
                  key={profile.code} 
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedProfileCodes.includes(profile.code) 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500' 
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      checked={selectedProfileCodes.includes(profile.code)}
                      onChange={() => toggleProfileSelection(profile.code)}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">{profile.name || profile.code}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{profile.code}</div>
                  </div>
                </label>
              ))
            )}
          </div>
        )}

        <div className="flex gap-3 pt-6 mt-2 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex-[2] px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 font-bold transition-all disabled:opacity-50"
          >
            {isSaving ? '...' : (t('common.assignProfile') || 'Assign Profiles')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OUserProfileModal;
