import React from 'react';

interface IQueueItem {
  docNo: string;
  queueNo: string | number;
  ticketNo?: string;
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

  // Auto-Slide Logic based on Overflow
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  React.useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && contentRef.current) {
        // If the content height is greater than the container height, it's overflowing
        const containerHeight = containerRef.current.clientHeight;
        const contentHeight = contentRef.current.scrollHeight;
        setIsOverflowing(contentHeight > containerHeight);
      }
    };

    // Check initially and whenever the queues change
    checkOverflow();

    // Small timeout to ensure DOM update is fully captured
    const timeoutId = setTimeout(checkOverflow, 50);

    // Re-check on window resize
    window.addEventListener('resize', checkOverflow);
    return () => {
      window.removeEventListener('resize', checkOverflow);
      clearTimeout(timeoutId);
    };
  }, [displayQueues]);

  // Take only recent 3 calling items
  const recentCalling = calling.slice(0, 3);

  // Group Waiting Queues
  const groups = Array.from(new Set(displayQueues.map(q => q.serviceGroup || 'General'))).sort();

  // Check if all queues array is empty (not just waiting)
  const hasNoData = displayQueues.length === 0;
  // If we have 'GRP_DEP' and 'GRP_ACC', we want to show them split.
  // Map codes to display names
  const getGroupName = (code: string) => {
    switch (code) {
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
        <div className="p-3 md:p-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 shadow-lg z-10 transition-colors duration-200 shrink-0">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 md:w-3 md:h-3 bg-yellow-300 rounded-full animate-pulse shadow-lg"></span>
            {leftTitle || 'Waiting Queue'}
          </h2>
          <p className="text-blue-100 mt-0.5 text-xs md:text-sm">Please wait for your number</p>
        </div>

        <div className="flex-1 flex flex-col p-2 md:p-3 bg-gray-50 dark:bg-gray-900 overflow-hidden">
          {hasNoData ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 opacity-50">
              <span className="text-3xl md:text-5xl mb-3">⏳</span>
              <span className="text-base md:text-lg">Waiting for data...</span>
            </div>
          ) : displayQueues.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 opacity-50">
              <span className="text-3xl md:text-5xl mb-3">☕</span>
              <span className="text-base md:text-lg">No queues waiting</span>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Fixed Top Queue (First Queue) */}
              {displayQueues.length > 0 && (
                <div key={displayQueues[0].docNo + "_top"} className={`flex justify-between items-center p-3 md:p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md z-10 shrink-0 mb-1.5 ${displayQueues[0].status.startsWith('WAIT') ? 'border-2 border-blue-500 dark:border-blue-400' : 'border border-gray-200 dark:border-gray-700'}`}>
                  <span className={`text-xl md:text-3xl font-extrabold tracking-wider ${displayQueues[0].status.startsWith('WAIT') ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-100'}`}>
                    {displayQueues[0].ticketNo || displayQueues[0].queueNo}
                  </span>
                  {displayQueues[0].status.startsWith('WAIT') && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded text-xs md:text-sm font-bold animate-pulse shadow-sm">
                      NEXT
                    </span>
                  )}
                  {!displayQueues[0].status.startsWith('WAIT') && displayQueues[0].counter && (
                    <span className="text-gray-600 dark:text-gray-300 font-bold shrink-0">
                      {displayQueues[0].counter}
                    </span>
                  )}
                </div>
              )}

              {/* Remaining Queues Container */}
              {displayQueues.length > 1 && (
                <div ref={containerRef} className={`flex-1 relative ${isOverflowing ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
                  {/* We use a wrapper content div to measure actual height of all items */}
                  <div ref={contentRef} className={`flex flex-col gap-1.5 ${isOverflowing ? 'animate-marquee-up pb-4' : ''}`}>
                    {/* Render Remaining Queues */}
                    {displayQueues.slice(1).map((q, index) => (
                      <div key={q.docNo} className={`flex justify-between items-center p-2 md:p-3 bg-white dark:bg-gray-800 rounded-lg border shrink-0 ${q.status.startsWith('WAIT') && index < 2 ? 'border-yellow-400 dark:border-yellow-500 shadow-md' : 'border-gray-200 dark:border-gray-700 shadow-sm'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`text-lg md:text-2xl font-bold tracking-wider ${q.status.startsWith('WAIT') && index < 2 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-200'}`}>
                            {q.ticketNo || q.queueNo}
                          </span>
                          {q.status.startsWith('WAIT') && index === 0 && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 text-[10px] md:text-xs font-bold rounded-full border border-yellow-200 dark:border-yellow-700">คิวที่ 2</span>
                          )}
                          {q.status.startsWith('WAIT') && index === 1 && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 text-[10px] md:text-xs font-bold rounded-full border border-yellow-200 dark:border-yellow-700">คิวที่ 3</span>
                          )}
                        </div>
                        {!q.status.startsWith('WAIT') && q.counter && (
                          <span className="text-gray-600 dark:text-gray-400 font-bold ml-2">
                            {q.counter}
                          </span>
                        )}
                      </div>
                    ))}
                    {/* Duplicate for Marquee Layout if Overflowing */}
                    {isOverflowing && displayQueues.slice(1).map((q, index) => (
                      <div key={q.docNo + "_dup"} className={`flex justify-between items-center p-2 md:p-3 bg-white dark:bg-gray-800 rounded-lg border shrink-0 ${q.status.startsWith('WAIT') && index < 2 ? 'border-yellow-400 dark:border-yellow-500 shadow-md' : 'border-gray-200 dark:border-gray-700 shadow-sm'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`text-lg md:text-2xl font-bold tracking-wider ${q.status.startsWith('WAIT') && index < 2 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-200'}`}>
                            {q.ticketNo || q.queueNo}
                          </span>
                          {q.status.startsWith('WAIT') && index === 0 && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 text-[10px] md:text-xs font-bold rounded-full border border-yellow-200 dark:border-yellow-700">คิวที่ 2</span>
                          )}
                          {q.status.startsWith('WAIT') && index === 1 && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 text-[10px] md:text-xs font-bold rounded-full border border-yellow-200 dark:border-yellow-700">คิวที่ 3</span>
                          )}
                        </div>
                        {!q.status.startsWith('WAIT') && q.counter && (
                          <span className="text-gray-600 dark:text-gray-400 font-bold ml-2">
                            {q.counter}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-2 md:p-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border-t border-gray-300 dark:border-gray-600 text-center transition-colors duration-200 shrink-0">
          <span className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">Total: </span>
          <span className="text-sm md:text-base font-bold text-blue-600 dark:text-blue-400">{displayQueues.length}</span>
        </div>
      </div>
    </div>
  );
};

export default OQueueBoard;
