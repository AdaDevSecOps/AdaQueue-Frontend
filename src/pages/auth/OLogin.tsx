import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const OLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNumClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const user = await login(pin);
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
        setError('Invalid PIN Code');
        setPin('');
      }
    } catch (err) {
      setError('System Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-wide">AdaQueue System</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Please enter your PIN to access</p>
        </div>

        {/* PIN Display */}
        <div className="mb-8">
          <div className="bg-gray-50 dark:bg-gray-900 h-16 rounded-2xl flex items-center justify-center border-2 border-gray-200 dark:border-gray-700 shadow-inner transition-colors duration-200">
             <div className="flex gap-4">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${i < pin.length ? 'bg-blue-500 scale-125' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                ))}
             </div>
          </div>
          {error && (
             <div className="mt-3 text-center text-red-500 dark:text-red-400 text-sm font-medium bg-red-100 dark:bg-red-400/10 py-2 rounded-lg border border-red-200 dark:border-red-400/20">
                {error}
             </div>
          )}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumClick(num.toString())}
              className="h-16 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-blue-600 dark:active:bg-blue-600 active:text-white rounded-xl text-2xl font-bold text-gray-800 dark:text-gray-100 transition-all duration-150 shadow-md border-b-4 border-gray-300 dark:border-gray-900 active:border-b-0 active:translate-y-1"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-16 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-500 dark:text-red-400 rounded-xl text-lg font-bold transition-all border border-red-200 dark:border-red-500/30"
          >
            C
          </button>
          <button
            onClick={() => handleNumClick('0')}
            className="h-16 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-blue-600 dark:active:bg-blue-600 active:text-white rounded-xl text-2xl font-bold text-gray-800 dark:text-gray-100 transition-all shadow-md border-b-4 border-gray-300 dark:border-gray-900 active:border-b-0 active:translate-y-1"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-16 bg-orange-100 dark:bg-orange-500/20 hover:bg-orange-200 dark:hover:bg-orange-500/30 text-orange-500 dark:text-orange-400 rounded-xl flex items-center justify-center transition-all border border-orange-200 dark:border-orange-500/30"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
            </svg>
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || pin.length !== 4}
          className={`w-full h-14 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center
            ${pin.length === 4 && !loading
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 hover:shadow-blue-600/50' 
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {loading ? (
             <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : (
             'Login'
          )}
        </button>
        
        <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-500">
                Default PINs: Admin (1234), Staff (0000), Kiosk (9999)
            </p>
        </div>

      </div>
    </div>
  );
};

export default OLogin;
