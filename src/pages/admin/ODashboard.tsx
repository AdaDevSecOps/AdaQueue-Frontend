import React, { useEffect, useState } from 'react';

interface IDashboardData {
  overview: {
    totalQueues: number;
    activeQueues: number;
    completedQueues: number;
  };
  performance: {
    avgWaitTime: string;
    avgServiceTime: string;
    slaBreaches: number;
  };
  trends: Array<{ hour: string; count: number }>;
}

/**
 * ODashboard
 * Admin Dashboard Overview
 * 
 * Reference Mockup: uqms_admin_dashboard_1.png
 * Path: c:\example\IDE\10.Project\2026\03.AdaQueue\docs\mockup\uqms_admin_dashboard_1.png
 */
const ODashboard: React.FC = () => {
  const [data, setData] = useState<IDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API Fetch
    const fetchData = async () => {
      await new Promise(r => setTimeout(r, 800)); // Mock delay
      setData({
        overview: {
          totalQueues: 150,
          activeQueues: 12,
          completedQueues: 138
        },
        performance: {
          avgWaitTime: '12m 30s',
          avgServiceTime: '5m 45s',
          slaBreaches: 3
        },
        trends: [
          { hour: '10:00', count: 20 },
          { hour: '11:00', count: 45 },
          { hour: '12:00', count: 80 },
          { hour: '13:00', count: 60 },
          { hour: '14:00', count: 30 },
        ]
      });
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
      </div>
  );
  
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 p-4 md:p-8 font-sans transition-colors duration-200">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time queue monitoring and performance analytics</p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                📅 {new Date().toLocaleDateString()}
            </span>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 text-sm font-medium transition flex items-center gap-2">
                🔄 Refresh
            </button>
          </div>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Tickets', value: '1,248', change: '+12%', color: 'blue' },
          { label: 'Avg Wait Time', value: '14m', change: '-2m', color: 'green' },
          { label: 'Active Counters', value: '8/10', change: '80%', color: 'purple' },
          { label: 'Served Today', value: '856', change: '+5%', color: 'indigo' },
        ].map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{stat.value}</h3>
              <span className={`text-sm font-bold ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'} bg-opacity-10 px-2 py-1 rounded`}>
                {stat.change}
              </span>
            </div>
            <div className={`mt-4 h-1 w-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-full overflow-hidden`}>
              <div className={`h-full bg-${stat.color}-500 w-2/3 rounded-full`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Traffic Overview</h3>
            <select className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="h-64 flex items-end gap-4">
             {/* Mock Bar Chart */}
             {[40, 65, 45, 80, 55, 70, 40, 65, 45, 80, 55, 70].map((h, i) => (
               <div key={i} className="flex-1 flex flex-col justify-end group">
                 <div 
                    className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-sm group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-all relative" 
                    style={{ height: `${h}%` }}
                 >
                    <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm transition-all duration-500" style={{ height: `${h * 0.6}%` }}></div>
                 </div>
               </div>
             ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-400 dark:text-gray-500 font-medium">
            <span>08:00</span>
            <span>10:00</span>
            <span>12:00</span>
            <span>14:00</span>
            <span>16:00</span>
            <span>18:00</span>
          </div>
        </div>

        {/* Right Column: Alerts & Status */}
        <div className="space-y-6">
           {/* Service Status */}
           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Service Health</h3>
              <div className="space-y-4">
                {['Database', 'Kiosk Terminals', 'Printer Service', 'Notification API'].map((service, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{service}</span>
                    </div>
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">OPERATIONAL</span>
                  </div>
                ))}
              </div>
           </div>

           {/* Recent Alerts */}
           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">System Alerts</h3>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-lg">
                   <p className="text-xs font-bold text-red-600 dark:text-red-400">High Wait Time Warning</p>
                   <p className="text-xs text-red-500 dark:text-red-300 mt-1">Zone A average wait time exceeded 20 mins.</p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r-lg">
                   <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400">Paper Low</p>
                   <p className="text-xs text-yellow-500 dark:text-yellow-300 mt-1">Kiosk #03 reported paper level at 15%.</p>
                </div>
              </div>
           </div>
        </div>
      </div>
      </div>
    </div>
  );
};



export default ODashboard;