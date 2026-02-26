import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const OLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNumClick = (num: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin("");
    setError(null);
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) return;

    setLoading(true);
    setError(null);

    try {
      const user = await login(pin);
      if (user) {
        if (user.role === "ADMIN") {
          navigate("/admin/dashboard");
        } else if (user.role === "STAFF") {
          navigate("/staff/control");
        } else if (user.role === "KIOSK") {
          navigate("/kiosk");
        } else {
          navigate("/");
        }
      } else {
        setError("Invalid PIN Code");
        setPin("");
      }
    } catch (err) {
      setError("System Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* LEFT SIDE: Branding / Information (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-900 dark:bg-black relative flex-col justify-center items-center p-12 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-500 blur-[120px]"></div>
          <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-teal-500 blur-[100px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-lg text-white">
          <div className="mb-10 inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Streamline Your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-teal-200">
              Operations Center
            </span>
          </h1>
          <p className="text-lg text-blue-100/80 leading-relaxed max-w-md">
            Fast, secure, and reliable access to the AdaQueue management system.
            Enter your credential to synchronize.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Login Area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-white dark:bg-[#111827] relative">
        <div className="w-full max-w-[380px]">
          {/* Mobile Header (Only visible on small screens) */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold dark:text-white">AdaQueue</h2>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Welcome Back
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your 4-digit PIN to access the dashboard.
            </p>
          </div>

          {/* PIN Display */}
          <div className="mb-6 relative group">
            <div
              className={`h-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-center border-2 transition-all duration-300
                ${
                  error
                    ? "border-red-400 bg-red-50/50 dark:bg-red-900/10"
                    : pin.length === 4
                      ? "border-blue-500 ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }
            `}
            >
              <div className="flex gap-6">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="relative flex items-center justify-center w-6 h-6"
                  >
                    <div
                      className={`absolute w-full h-full rounded-full transition-all duration-300 ease-out
                          ${
                            i < pin.length
                              ? "bg-gray-900 dark:bg-white scale-100 opacity-100"
                              : "bg-gray-300 dark:bg-gray-600 scale-[0.3] opacity-50"
                          }`}
                    ></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            <div
              className={`absolute -bottom-6 left-0 w-full text-center transition-all duration-300 ${error ? "opacity-100 transform translate-y-0" : "opacity-0 transform -translate-y-2 pointer-events-none"}`}
            >
              <span className="text-red-500 dark:text-red-400 text-sm font-semibold flex items-center justify-center gap-1.5">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                {error}
              </span>
            </div>
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-y-3 gap-x-4 mb-6 mt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumClick(num.toString())}
                className="h-14 rounded-xl text-xl font-semibold text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border-2 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600 active:bg-gray-100 dark:active:bg-gray-600 active:scale-95 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="h-14 rounded-xl text-base font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all duration-200 flex items-center justify-center focus:outline-none"
            >
              CLEAR
            </button>
            <button
              onClick={() => handleNumClick("0")}
              className="h-14 rounded-xl text-xl font-semibold text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border-2 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600 active:bg-gray-100 dark:active:bg-gray-600 active:scale-95 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="h-14 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all duration-200 flex items-center justify-center focus:outline-none"
              aria-label="Delete"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
                />
              </svg>
            </button>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || pin.length !== 4}
            className={`w-full h-14 rounded-xl font-bold text-base tracking-wide transition-all duration-300 flex items-center justify-center
              ${
                pin.length === 4 && !loading
                  ? "bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 shadow-xl shadow-gray-900/20 dark:shadow-white/10 hover:-translate-y-1"
                  : "bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700"
              }
            `}
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Authenticating...</span>
              </div>
            ) : (
              "Secure Login"
            )}
          </button>

          {/* <div className="mt-6 text-center border-t border-gray-100 dark:border-gray-800 pt-5">
            <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-2 mt-0">
              SYSTEM ACCESS CODES
            </p>
            <div className="flex justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                Admin: 1234
              </span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                Staff: 0000
              </span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                Kiosk: 9999
              </span>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default OLogin;
