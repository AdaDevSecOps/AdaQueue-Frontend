import React from 'react';

interface IQueueItem {
  docNo: string;
  queueNo: string | number;
  status: string;
  counter?: string;
  serviceGroup?: string; // e.g., 'GRP_DEP', 'GRP_ACC'
  serviceName?: string;
}

/**
 * OQueueBoard
 * Display Queue list for customers.
 * 
 * Reference Mockup: public_queue_display_board.png
 * Path: c:\example\IDE\10.Project\2026\03.AdaQueue\docs\mockup\public_queue_display_board.png
 */
const OQueueBoard: React.FC<{ queues: IQueueItem[]; title?: string }> = ({ queues, title }) => {
  const waiting = queues.filter(q => q.status.startsWith('WAIT'));
  const calling = queues.filter(q => q.status.includes('CALL') || q.status.includes('SERVING') || q.status === 'IN_ROOM');
  
  // Take only recent 3 calling items
  const recentCalling = calling.slice(0, 3);

  // Group Waiting Queues
  const groups = Array.from(new Set(waiting.map(q => q.serviceGroup || 'General'))).sort();
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

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-200">
      
      {/* Left Side: Waiting List */}
      <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-1/3 md:h-auto transition-colors duration-200">
        <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-800 shadow-md z-10 transition-colors duration-200">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
            <span className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></span>
            Waiting Queue
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm md:text-base">Please wait for your number</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {waiting.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 opacity-50">
               <span className="text-4xl md:text-6xl mb-4">☕</span>
               <span className="text-lg md:text-xl">No queues waiting</span>
             </div>
          ) : (
            <div className={`grid ${groups.length > 1 ? 'grid-cols-2 gap-4' : 'grid-cols-1 gap-3'}`}>
                {groups.map(groupCode => (
                    <div key={groupCode} className="flex flex-col gap-2">
                        {groups.length > 1 && (
                            <h3 className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 border-b border-gray-200 dark:border-gray-700 pb-1">
                                {getGroupName(groupCode)}
                            </h3>
                        )}
                        {waiting.filter(q => (q.serviceGroup || 'General') === groupCode).map(q => (
                            <div key={q.docNo} className="flex justify-between items-center p-3 md:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 transition-colors duration-200">
                                <span className="text-xl md:text-3xl font-bold text-gray-800 dark:text-white tracking-wider">{q.queueNo}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] md:text-xs font-medium tracking-wide ${q.status === 'WAIT_PHARMACY' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                    {getWaitingLabel(q.status)}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-500 text-sm hidden md:block transition-colors duration-200">
          Total Waiting: {waiting.length}
        </div>
      </div>

      {/* Right Side: Calling Display */}
      <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 relative h-2/3 md:h-auto transition-colors duration-200">
        {/* Header */}
        <div className="p-4 md:p-6 flex justify-between items-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm absolute top-0 w-full z-10 border-b border-gray-200 dark:border-white/5 transition-colors duration-200">
            <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl md:text-2xl text-white">A</div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{title || 'Now Serving'}</h1>
            </div>
            <div className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-mono">
                {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
        </div>

        <div className="flex-1 p-4 md:p-8 pt-20 md:pt-28 flex flex-col gap-4 md:gap-6 overflow-y-auto">
          {recentCalling.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
               <h3 className="text-3xl md:text-4xl font-bold mb-4 opacity-30">All Clear</h3>
               <p className="text-lg md:text-xl opacity-30">Counters are available</p>
             </div>
          ) : (
            recentCalling.map((q, index) => {
              const isMain = index === 0;
              return (
                <div 
                  key={q.docNo} 
                  className={`
                    relative overflow-hidden rounded-2xl md:rounded-3xl shadow-lg md:shadow-2xl transition-all duration-500 ease-out
                    ${isMain 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-700 flex-grow-[2] flex flex-row items-center justify-between p-6 md:p-12 border-4 border-blue-400/30' 
                        : 'bg-white dark:bg-gray-800 flex-grow flex items-center justify-between p-4 md:p-8 border border-gray-200 dark:border-gray-700'
                    }
                  `}
                >
                  {isMain && (
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
                  )}

                  <div className="z-10">
                    <div className={`flex items-center gap-2 font-medium uppercase tracking-widest mb-1 md:mb-2 text-xs md:text-base ${isMain ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                        <span>Ticket Number</span>
                        {q.serviceGroup && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isMain ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                {getGroupName(q.serviceGroup)}
                            </span>
                        )}
                    </div>
                    <div className={`${isMain ? 'text-6xl md:text-[10rem] leading-none' : 'text-4xl md:text-7xl'} font-black ${isMain ? 'text-white' : 'text-gray-800 dark:text-white'} tracking-tight`}>
                        {q.queueNo}
                    </div>
                  </div>

                  <div className="z-10 text-right">
                     <div className={`font-medium uppercase tracking-widest mb-1 md:mb-2 text-xs md:text-base ${isMain ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                        Please proceed to
                    </div>
                    <div className={`${isMain ? 'text-3xl md:text-6xl bg-white/20 backdrop-blur-md px-4 py-2 md:px-8 md:py-4 rounded-xl inline-block text-white' : 'text-2xl md:text-4xl text-blue-600 dark:text-blue-400' } font-bold`}>
                        {q.counter || 'Counter 1'}
                    </div>
                    {isMain && (
                        <div className="mt-4 md:mt-6 animate-bounce text-blue-200 hidden md:block">
                            Please come forward ▼
                        </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default OQueueBoard;