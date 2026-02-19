import React from 'react';

interface IQueueItem {
  docNo: string;
  queueNo: string | number;
  status: string;
  counter?: string;
  serviceGroup?: string; // e.g., 'GRP_DEP', 'GRP_ACC'
  serviceName?: string;
}

interface IOQueueBoardProps {
  queues: IQueueItem[];
  title?: string; // Title for right side (calling display)
  leftTitle?: string; // Title for left side (waiting list)
  displayMode?: 'waiting' | 'all'; // Display mode: 'waiting' (only waiting queues) or 'all' (all queues)
}

/**
 * OQueueBoard
 * Display Queue list for customers.
 * 
 * Reference Mockup: public_queue_display_board.png
 * Path: c:\example\IDE\10.Project\2026\03.AdaQueue\docs\mockup\public_queue_display_board.png
 */
const OQueueBoard: React.FC<IOQueueBoardProps> = ({ queues, title, leftTitle, displayMode = 'waiting' }) => {
  const waiting = queues.filter(q => q.status.startsWith('WAIT'));
  const calling = queues.filter(q => q.status.includes('CALL') || q.status.includes('SERVING') || q.status === 'IN_ROOM');
  
  // Filter queues based on displayMode
  const displayQueues = displayMode === 'waiting'
    ? waiting
    : queues;
  
  // Take only recent 3 calling items
  const recentCalling = calling.slice(0, 3);

  // Group Waiting Queues
  const groups = Array.from(new Set(displayQueues.map(q => q.serviceGroup || 'General'))).sort();
  
  // Check if all queues array is empty (not just waiting)
  const hasNoData = displayQueues.length === 0;
  // If we have 'GRP_DEP' and 'GRP_ACC', we want to show them split.
  // Map codes to display names
  const getGroupName = (code: string) => {
    switch(code) {
        case 'GRP_DEP': return 'Deposit / Withdraw';
        case 'GRP_ACC': return 'New Account';
        case 'GRP_GEN': return 'General Practice';
        case 'GRP_SPECIAL': return 'Specialist';
        case 'GRP_PHARM': return 'Pharmacy';
        case 'GRP_CLI': return 'Clinic';
        default: return 'General Queue';
    }
  };

  // Helper to show sub-status if needed (e.g. Waiting for Doctor vs Waiting for Meds)
  // For Clinic, we might want to distinguish.
  const getWaitingLabel = (status: string) => {
      if (status === 'WAIT_DOCTOR') return 'WAIT DOCTOR';
      if (status === 'WAIT_PHARMACY') return 'WAIT MEDS';
      return 'WAIT';
  };

  // Helper to get display label based on displayMode
  const getStatusLabel = (status: string) => {
      return displayMode === 'waiting' ? getWaitingLabel(status) : status;
  };

  // Helper to get badge color based on status
  const getStatusColor = (status: string) => {
      return displayMode === 'waiting'
          ? status === 'WAIT_PHARMACY' 
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          : (status.includes('CALL') 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : status.includes('SERVE')
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
              : status.includes('DONE') || status.includes('COMPLETE')
              ? 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300');
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-sans overflow-hidden transition-all duration-200 flex-1 min-w-0">
      
      {/* Waiting List (Full Width) */}
      <div className="w-full bg-white dark:bg-gray-900 flex flex-col h-full overflow-hidden border-r border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="p-3 md:p-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 shadow-lg z-10 transition-colors duration-200">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 md:w-3 md:h-3 bg-yellow-300 rounded-full animate-pulse shadow-lg"></span>
            {leftTitle || 'Waiting Queue'}
          </h2>
          <p className="text-blue-100 mt-0.5 text-xs md:text-sm">Please wait for your number</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 md:p-3 custom-scrollbar bg-gray-50 dark:bg-gray-900">
          {hasNoData ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 opacity-50">
               <span className="text-3xl md:text-5xl mb-3">⏳</span>
               <span className="text-base md:text-lg">Waiting for data...</span>
             </div>
          ) : displayQueues.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 opacity-50">
               <span className="text-3xl md:text-5xl mb-3">☕</span>
               <span className="text-base md:text-lg">No queues waiting</span>
             </div>
          ) : (
            <div className="flex flex-col gap-1.5">
                {/* Show all queues in single vertical column, no grouping */}
                {displayQueues.map(q => (
                    <div key={q.docNo} className="flex justify-between items-center p-2 md:p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200">
                        <span className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white tracking-wider">{q.queueNo}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-medium tracking-wide ${getStatusColor(q.status)}`}>
                            {getStatusLabel(q.status)}
                        </span>
                    </div>
                ))}
            </div>
          )}
        </div>
        
        <div className="p-2 md:p-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border-t border-gray-300 dark:border-gray-600 text-center transition-colors duration-200">
          <span className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">Total: </span>
          <span className="text-sm md:text-base font-bold text-blue-600 dark:text-blue-400">{displayQueues.length}</span>
        </div>
      </div>
    </div>
  );
};

export default OQueueBoard;