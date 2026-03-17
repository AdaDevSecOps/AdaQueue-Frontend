import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { apiPath } from '../../config/api';
import OUserModal from '../../components/admin/OUserModal';
import OUserProfileModal from '../../components/admin/OUserProfileModal';

interface User {
  code: string;
  name: string;
  role: string;
  status: string;
  lastLogin: string | null;
}

const OAccountManagement: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('1'); // Default to Active (1)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState('10'); // Default to 10


  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(apiPath('/api/users'));
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;
    if (searchTerm) {
      result = result.filter(u =>
        u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (roleFilter !== 'ALL') {
      result = result.filter(u => u.role === roleFilter);
    }
    if (statusFilter !== 'ALL') {
      result = result.filter(u => u.status === statusFilter);
    }
    setFilteredUsers(result);
    setCurrentPage(1); // Reset to first page when filtering
  }, [users, searchTerm, roleFilter, statusFilter]);

  const totalPages = itemsPerPage === 'ALL' ? 1 : Math.ceil(filteredUsers.length / parseInt(itemsPerPage));
  const paginatedUsers = itemsPerPage === 'ALL'
    ? filteredUsers
    : filteredUsers.slice((currentPage - 1) * parseInt(itemsPerPage), currentPage * parseInt(itemsPerPage));


  const handleCreate = async (userData: any) => {
    await axios.post(apiPath('/api/users'), userData);
    toast.success(t('messages.createSuccess'));
    fetchUsers();
  };

  const handleUpdate = async (userData: any) => {
    if (userData.pin) {
      await axios.post(apiPath(`/api/users/${userData.code}/reset-pin`), { pin: userData.pin });
    }
    const { pin, ...rest } = userData;
    await axios.patch(apiPath(`/api/users/${userData.code}`), rest);
    toast.success(t('messages.updateSuccess'));
    fetchUsers();
  };

  const handleSoftDelete = async (code: string) => {
    if (window.confirm(t('common.delete') + '?')) {
      try {
        await axios.patch(apiPath(`/api/users/${code}`), { status: '3' });
        toast.success(t('messages.deleteSuccess'));
        fetchUsers();
      } catch (error) {
        toast.error(t('messages.errorOccurred'));
      }
    }
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 p-4 md:p-8 font-sans transition-colors duration-200">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t('menu.accountManagement')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage system accounts, roles, and security access</p>
          </div>
          <button
            onClick={() => {
              setSelectedUser(undefined);
              setIsModalOpen(true);
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 font-bold transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            {t('common.add')}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.role')}:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-sm text-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">{t('common.all')}</option>
              <option value="ADMIN">{t('common.admin')}</option>
              <option value="STAFF">{t('common.staff')}</option>
              <option value="KIOSK">{t('common.kiosk')}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('common.status')}:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-sm text-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">{t('common.all')}</option>
              <option value="1">{t('common.active')}</option>
              <option value="2">{t('common.inactive')}</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">{t('common.userCode')}</th>
                  <th className="px-6 py-4">{t('common.userName')}</th>
                  <th className="px-6 py-4">{t('common.role')}</th>
                  <th className="px-6 py-4">{t('common.lastLogin')}</th>
                  <th className="px-6 py-4">{t('common.status')}</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 animate-pulse">Loading users...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No accounts found</td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.code} className={`group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${u.status === '2' ? 'opacity-60 grayscale font-italic' : ''}`}>
                      <td className="px-6 py-4 font-mono font-bold text-gray-900 dark:text-white">{u.code}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium">{u.name || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${u.role === 'ADMIN' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                          u.role === 'STAFF' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' :
                            'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                          }`}>
                          {t(`common.${u.role.toLowerCase()}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${u.status === '1' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                          u.status === '2' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                          {u.status === '1' ? t('common.active') : u.status === '2' ? t('common.inactive') : t('common.deleted')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setIsProfileModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all"
                          title={t('menu.manageProfiles') || 'Manage Profiles'}
                        >
                          <span role="img" aria-label="profiles" className="text-lg">🏷️</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          title={t('common.edit')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        {u.status !== '3' && (
                          <button
                            onClick={() => handleSoftDelete(u.code)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                            title={t('common.delete')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t('common.showing')} <span className="font-semibold text-gray-900 dark:text-white">{(currentPage - 1) * (itemsPerPage === 'ALL' ? 0 : parseInt(itemsPerPage)) + 1}</span> {t('common.to')} <span className="font-semibold text-gray-900 dark:text-white">{itemsPerPage === 'ALL' ? filteredUsers.length : Math.min(currentPage * parseInt(itemsPerPage), filteredUsers.length)}</span> {t('common.of')} <span className="font-semibold text-gray-900 dark:text-white">{filteredUsers.length}</span> {t('common.results')}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('common.itemsPerPage')}:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-xs text-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="ALL">{t('common.all')}</option>
                </select>
              </div>
            </div>

            {itemsPerPage !== 'ALL' && totalPages > 1 && (
              <div className="flex items-center bg-gray-50 dark:bg-gray-900/50 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all"
                  title={t('common.previous')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>

                <div className="flex items-center px-2 gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    // Dynamic range logic for many pages
                    if (totalPages > 7) {
                      if (page !== 1 && page !== totalPages && (page < currentPage - 1 || page > currentPage + 1)) {
                        if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className="px-2 text-gray-400">...</span>;
                        return null;
                      }
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${currentPage === page
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'text-gray-500 hover:bg-white dark:hover:bg-gray-800 hover:text-blue-600'
                          }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all"
                  title={t('common.next')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <OUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={selectedUser ? handleUpdate : handleCreate}
        user={selectedUser}
      />

      <OUserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userCode={selectedUser?.code}
      />
    </div>
  );
};

export default OAccountManagement;
