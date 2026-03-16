import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';

const OLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [employeeName, setEmployeeName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!employeeName || pin.length !== 4) return;

    setLoading(true);
    setError(null);

    try {
      const user = await login(employeeName, pin);
      if (user) {
        if (user.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (user.role === 'STAFF') {
          navigate('/staff/control');
        } else if (user.role === 'KIOSK') {
          navigate('/kiosk');
        } else {
          navigate('/');
        }
      } else {
        setError('ชื่อพนักงานหรือรหัสพินไม่ถูกต้อง');
        setPin('');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f1d] font-sans selection:bg-blue-500/30">

      {/* Logo Area */}
      <div className="mb-10 flex flex-col items-center">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Sign in to your account</h2>
      </div>

      <div className="w-full max-w-md px-4">
        <div className="bg-[#111827] border border-gray-800 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Employee Name Field */}
            <div>
              <label htmlFor="employeeName" className="block text-sm font-medium text-gray-300 mb-2">
                USERNAME
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="employeeName"
                  type="text"
                  required
                  autoComplete="off"
                  value={employeeName}
                  onChange={(e) => {
                    setEmployeeName(e.target.value);
                    setError(null);
                  }}
                  className="block w-full pl-10 pr-3 py-3 bg-[#1f2937] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter USERNAME"
                />
              </div>
            </div>

            {/* PIN Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="pin" className="block text-sm font-medium text-gray-300">
                  PIN
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.length <= 4) setPin(val);
                    setError(null);
                  }}
                  className="block w-full pl-10 pr-3 py-3 bg-[#1f2937] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 tracking-[0.5em]"
                  placeholder="••••"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20 text-sm animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !employeeName || pin.length !== 4}
              className={`w-full h-12 rounded-xl font-bold text-lg transition-all flex items-center justify-center
                ${loading || !employeeName || pin.length !== 4
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30'
                }
              `}
            >
              {loading ? (
                <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 text-center px-4">
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Default PINs: admin (1234), staff (0000), kiosk (9999)
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-500">
          &copy; 2026 AdaQueue Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default OLogin;
