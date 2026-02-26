import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

/**
 * OMobileQueueStatus
 * Mobile Customer Queue Tracking Screen
 */
const OMobileQueueStatus: React.FC = () => {
  const { t } = useTranslation("customer");
  const { id } = useParams<{ id: string }>();
  const [ticket] = useState({
    number: id || "A-099",
    service: "General Consultation",
    branch: "Central World Clinic",
    status: "WAITING", // WAITING, NEAR, CALLED, SERVING, COMPLETED
    queuesAhead: 4,
    estimatedWait: 12, // minutes
    issuedAt: "14:30",
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Simulate status update
  const [progress] = useState(65);

  const getStatusColor = () => {
    switch (ticket.status) {
      case "WAITING":
        return "bg-blue-500";
      case "NEAR":
        return "bg-amber-500";
      case "CALLED":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    switch (ticket.status) {
      case "WAITING":
        return t("status.waiting");
      case "NEAR":
        return t("status.near");
      case "CALLED":
        return t("status.called");
      default:
        return t("status.unknown");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans flex flex-col items-center relative overflow-hidden transition-colors duration-200">
      {/* Background Decor */}
      <div
        className={`absolute top-0 inset-x-0 h-64 ${getStatusColor()} rounded-b-[3rem] shadow-lg transition-colors duration-500 z-0`}
      ></div>

      {/* Main Content Card */}
      <div className="w-full max-w-md px-6 pt-12 pb-6 z-10 flex-1 flex flex-col">
        {/* Header Info */}
        <div className="text-center text-white mb-8">
          <h2 className="text-lg font-medium opacity-90">{ticket.branch}</h2>
          <h1 className="text-2xl font-bold mt-1">{ticket.service}</h1>
        </div>

        {/* Ticket Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"></div>

          <p className="text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider text-sm mb-2">
            {t("ticket.number")}
          </p>
          <div className="text-7xl font-black text-gray-900 dark:text-white tracking-tighter mb-4">
            {ticket.number}
          </div>

          <div
            className={`px-4 py-2 rounded-full text-sm font-bold text-white mb-8 shadow-md ${getStatusColor()} transition-colors duration-500`}
          >
            {getStatusText()}
          </div>

          {/* Metrics Grid */}
          <div className="w-full grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl">
              <p className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase mb-1">
                {t("ticket.queuesAhead")}
              </p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {ticket.queuesAhead}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl">
              <p className="text-purple-600 dark:text-purple-400 text-xs font-bold uppercase mb-1">
                {t("ticket.estWait")}
              </p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {ticket.estimatedWait}{" "}
                <span className="text-sm font-normal text-gray-500">
                  {t("ticket.min")}
                </span>
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full mb-2">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>
                {t("ticket.issued")} {ticket.issuedAt}
              </span>
              <span>{t("ticket.now")}</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getStatusColor()} transition-all duration-1000 ease-out`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <button className="bg-white dark:bg-gray-800 text-gray-700 dark:text-white py-4 rounded-2xl font-bold shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2">
            <span className="text-2xl">🔔</span>
            <span className="text-sm">{t("actions.notify")}</span>
          </button>
          <button className="bg-white dark:bg-gray-800 text-red-500 py-4 rounded-2xl font-bold shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2">
            <span className="text-2xl">✖</span>
            <span className="text-sm">{t("actions.leaveQueue")}</span>
          </button>
        </div>

        {/* Expandable Details */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center justify-center gap-2 mx-auto"
          >
            {isExpanded ? t("actions.hideDetails") : t("actions.viewDetails")}
            <svg
              className={`w-4 h-4 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>

          {isExpanded && (
            <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm text-left animate-fade-in-down">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {t("details.serviceType")}
                </span>
                <span className="font-medium text-gray-800 dark:text-white text-sm">
                  Consultation
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {t("details.date")}
                </span>
                <span className="font-medium text-gray-800 dark:text-white text-sm">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {t("details.location")}
                </span>
                <span className="font-medium text-gray-800 dark:text-white text-sm">
                  Floor 3, Zone A
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="p-6 text-center text-gray-400 dark:text-gray-600 text-xs">
        {t("footer")}
      </div>
    </div>
  );
};

export default OMobileQueueStatus;
