import React, { useState } from 'react';
import OQueueControl from '../../components/queue/OQueueControl';

const StaffControlPage: React.FC = () => {
  const [status, setStatus] = useState('WAIT');
  
  return (
    <div className="p-4 md:p-8 h-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-800 dark:text-white">Staff Operation Console</h1>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 flex-1 overflow-hidden relative transition-colors duration-200">
        <div className="h-full overflow-y-auto">
          <OQueueControl 
            queueId="Q-MOCK-001" 
            currentStatus={status} 
            industry="RESTAURANT" 
            onStateChange={() => {
              console.log('State Changed');
              // Toggle status for demo
              setStatus(prev => prev === 'WAIT' ? 'CALL' : 'WAIT');
            }} 
          />
        </div>
      </div>
    </div>
  );
};

export default StaffControlPage;
