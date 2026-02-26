import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueue, IQueueAction } from "../../hooks/useQueue";

interface IQueueControlProps {
  queueId: string;
  currentStatus: string;
  industry: string;
  onStateChange: () => void;
}

/**
 * OQueueControl
 * Component for staff to control queue state.
 * Renders buttons dynamically based on API response.
 *
 * Reference Mockup: dynamic_staff_console_(restaurant).png
 * Path: c:\example\IDE\10.Project\2026\03.AdaQueue\docs\mockup\dynamic_staff_console_(restaurant).png
 */
const OQueueControl: React.FC<IQueueControlProps> = ({
  queueId,
  currentStatus,
  industry,
  onStateChange,
}) => {
  const { t } = useTranslation("common");
  const { getNextActions, updateState, loading } = useQueue();
  const [actions, setActions] = useState<IQueueAction[]>([]);

  useEffect(() => {
    // Load allowed transitions when status changes
    const loadActions = async () => {
      const opts = await getNextActions(queueId, industry);
      setActions(opts);
    };
    loadActions();
  }, [currentStatus, industry, queueId, getNextActions]);

  const handleAction = async (targetState: string) => {
    const success = await updateState(queueId, targetState, industry);
    if (success) {
      onStateChange();
    }
  };

  // Status Badge Helper
  const getStatusColor = (status: string) => {
    if (status.includes("WAIT"))
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
    if (status.includes("CALL") || status.includes("SERVING"))
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    if (status.includes("COMPLETE"))
      return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800";
    return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600";
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden flex flex-col h-full max-h-[600px] transition-colors duration-200">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors duration-200">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <span className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-mono text-gray-600 dark:text-gray-300">
              ID
            </span>
            {queueId}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {t("queueControl.ticketId")}
          </p>
        </div>
        <div
          className={`px-4 py-2 rounded-full border font-bold text-sm tracking-wide uppercase ${getStatusColor(currentStatus)}`}
        >
          {currentStatus}
        </div>
      </div>

      {/* Action Area */}
      <div className="p-6 flex-1 bg-white dark:bg-gray-800 flex flex-col justify-center transition-colors duration-200">
        {actions.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-6xl mb-4 opacity-20">🚫</div>
            <p className="text-gray-400 dark:text-gray-500 font-medium">
              {t("queueControl.noActions")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {actions.map((action) => {
              // Map backend color to Tailwind class
              const colorMap: Record<string, string> = {
                primary:
                  "bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none text-white",
                success:
                  "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 dark:shadow-none text-white",
                danger:
                  "bg-red-500 hover:bg-red-600 shadow-red-200 dark:shadow-none text-white",
                warning:
                  "bg-amber-500 hover:bg-amber-600 shadow-amber-200 dark:shadow-none text-white",
                default:
                  "bg-gray-600 hover:bg-gray-700 shadow-gray-200 dark:shadow-none text-white",
              };
              const btnClass =
                colorMap[action.color || "primary"] || colorMap["default"];

              return (
                <button
                  key={action.code}
                  onClick={() => handleAction(action.code)}
                  disabled={loading}
                  className={`
                    py-6 px-4 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:scale-100
                    flex flex-col items-center justify-center gap-2
                    ${btnClass}
                  `}
                >
                  <span className="text-lg font-bold">{action.label}</span>
                  <span className="text-xs opacity-80 uppercase tracking-wider">
                    {action.code}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-t border-gray-100 dark:border-gray-700 text-center text-xs text-gray-400 dark:text-gray-500 transition-colors duration-200">
        {t("queueControl.industry")}: {industry} •{" "}
        {t("queueControl.lastUpdated")}: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default OQueueControl;
