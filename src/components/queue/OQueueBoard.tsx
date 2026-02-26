import React from "react";
import { useTranslation } from "react-i18next";

interface IQueueItem {
  docNo: string;
  queueNo: string | number;
  ticketNo?: string;
  status: string;
  counter?: string;
  serviceGroup?: string;
  serviceName?: string;
}

interface IOQueueBoardProps {
  queues: IQueueItem[];
  title?: string;
  leftTitle?: string;
  displayMode?: "waiting" | "all";
}

/**
 * OQueueBoard
 * Display Queue list for customers.
 */
const OQueueBoard: React.FC<IOQueueBoardProps> = ({
  queues,
  leftTitle,
  displayMode = "waiting",
}) => {
  const { t } = useTranslation("common");

  const waiting = queues.filter((q) => q.status.startsWith("WAIT"));
  const displayQueues = displayMode === "waiting" ? waiting : queues;
  const hasNoData = displayQueues.length === 0;

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-sans overflow-hidden transition-all duration-200 flex-1 min-w-0">
      {/* Waiting List (Full Width) */}
      <div className="w-full bg-white dark:bg-gray-900 flex flex-col h-full overflow-hidden border-r border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="p-3 md:p-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 shadow-lg z-10 transition-colors duration-200">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 md:w-3 md:h-3 bg-yellow-300 rounded-full animate-pulse shadow-lg"></span>
            {leftTitle || t("queueBoard.waitingQueue")}
          </h2>
          <p className="text-blue-100 mt-0.5 text-xs md:text-sm">
            {t("queueBoard.pleaseWait")}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 md:p-3 custom-scrollbar bg-gray-50 dark:bg-gray-900">
          {hasNoData ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 opacity-50">
              <span className="text-3xl md:text-5xl mb-3">⏳</span>
              <span className="text-base md:text-lg">
                {t("queueBoard.waitingForData")}
              </span>
            </div>
          ) : displayQueues.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 opacity-50">
              <span className="text-3xl md:text-5xl mb-3">☕</span>
              <span className="text-base md:text-lg">
                {t("queueBoard.noQueuesWaiting")}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {displayQueues.map((q) => (
                <div
                  key={q.docNo}
                  className="flex justify-between items-center p-2 md:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200"
                >
                  <span className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white tracking-wider">
                    {q.ticketNo || q.queueNo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-2 md:p-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border-t border-gray-300 dark:border-gray-600 text-center transition-colors duration-200">
          <span className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("queueBoard.total")}{" "}
          </span>
          <span className="text-sm md:text-base font-bold text-blue-600 dark:text-blue-400">
            {displayQueues.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OQueueBoard;
