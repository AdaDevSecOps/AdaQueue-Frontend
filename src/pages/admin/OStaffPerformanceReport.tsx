import React, { useEffect, useState } from 'react';
import { apiPath } from '../../config/api';

/**
 * OStaffPerformanceReport
 * Staff & SLA Performance Report Page
 * 
 * Reference Mockup: staff_&_sla_performance_report.png
 */
const OStaffPerformanceReport: React.FC = () => {
  const [summary, setSummary] = useState<any | null>(null);
  const [heatmap, setHeatmap] = useState<any | null>(null);
  const [staffRows, setStaffRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const pageSize = 20;
      try {
        const [sumRes, heatRes, staffRes] = await Promise.all([
          fetch(apiPath('/api/performance/summary')),
          fetch(apiPath('/api/performance/heatmap')),
          fetch(apiPath(`/api/performance/staff?page=${page}&pageSize=${pageSize}`)),
        ]);
        const sum = await sumRes.json();
        const heat = await heatRes.json();
        const staff = await staffRes.json();
        setSummary(sum.data);
        setHeatmap(heat.data);
        setStaffRows(staff.data);
        setMeta(staff.meta);
      } catch (e: any) {
        console.error('Failed to load performance report:', e);
      }
    };
    fetchAll();
  }, [page]);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
  const getHeatmapIntensity = (dayIndex: number, slotIndex: number) => {
    if (!heatmap) return 0;
    const day = days[dayIndex];
    const h = (8 + slotIndex).toString().padStart(2, '0') + ':00';
    const row = heatmap.matrix.find((m: any) => m.dayOfWeek === day);
    if (!row) return 0;
    const slot = row.slots.find((s: any) => s.start === h);
    if (!slot) return 0;
    const v = slot.density;
    if (v < 0.2) return 0;
    if (v < 0.4) return 1;
    if (v < 0.6) return 2;
    if (v < 0.8) return 3;
    return 4;
  };

  const staffData = staffRows.map(r => ({
    id: r.staffId,
    name: r.fullName,
    role: r.role,
    counter: r.counter,
    tickets: r.ticketsHandled,
    aht: r.avgHandlingTimeSec ? new Date(r.avgHandlingTimeSec * 1000).toISOString().substring(14, 19) : '00:00',
    sla: r.slaCompliancePct,
    breaches: r.slaBreaches,
    csat: r.csatScore ?? 0,
  }));

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-900 p-6 md:p-8 font-sans transition-colors duration-200">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Staff & SLA Performance Report</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Last refreshed: 2 minutes ago
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2">
            🔗 Share
          </button>
          <button
            onClick={async () => {
              try {
                const res = await fetch(apiPath('/api/performance/export'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
                const data = await res.json();
                const csv = data?.data?.csv || '';
                const name = data?.data?.fileName || `report_${Date.now()}.csv`;
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = name;
                a.click();
                window.URL.revokeObjectURL(url);
              } catch {}
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-900/20"
          >
            ⬇ Export Report
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {['Branch: Downtown Central', 'Zone: Service Hall A', 'Staff Role: All Staff', 'Date: Last 30 Days'].map((filter, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center text-gray-700 dark:text-gray-300 font-medium cursor-pointer hover:border-blue-500 transition shadow-sm">
            <span>{filter}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Overall SLA Compliance', value: summary ? `${summary.overallSlaCompliancePct}%` : '-', isPositive: true, icon: '🛡️', color: 'blue' },
          { label: 'Total Tickets Handled', value: summary ? `${summary.totalTicketsHandled}` : '-', isPositive: true, icon: '🎫', color: 'indigo' },
          { label: 'Avg. Wait Time', value: summary ? new Date((summary.avgWaitTimeSec || 0) * 1000).toISOString().substring(14, 19) : '-', isPositive: true, icon: '⏱️', color: 'cyan' },
          { label: 'Avg. CSAT Score', value: summary && summary.avgCsatScore != null ? `${summary.avgCsatScore}/5.0` : '-', isPositive: true, icon: '⭐', color: 'yellow' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">{stat.label}</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</h3>
              </div>
              <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
            </div>
            {/* Decorative bar */}
            <div className={`absolute bottom-0 left-0 w-full h-1 bg-${stat.color}-500 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
          </div>
        ))}
      </div>

      {/* Queue Density Heatmap */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Queue Density Heatmap</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Low Traffic</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-blue-900/20 rounded-sm"></div>
              <div className="w-4 h-4 bg-blue-900/40 rounded-sm"></div>
              <div className="w-4 h-4 bg-blue-900/60 rounded-sm"></div>
              <div className="w-4 h-4 bg-blue-900/80 rounded-sm"></div>
            </div>
            <span>Peak Load</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {days.map((day, dIdx) => (
              <div key={day} className="flex items-center mb-2">
                <div className="w-12 text-sm text-gray-500 dark:text-gray-400 font-medium">{day}</div>
                <div className="flex-1 grid grid-cols-12 gap-1">
                   {/* Create 12 slots for the day */}
                   {Array.from({ length: 12 }).map((_, sIdx) => {
                     const intensity = getHeatmapIntensity(dIdx, sIdx);
                     const opacity = [0.1, 0.3, 0.5, 0.7, 0.9][intensity];
                     return (
                       <div 
                         key={sIdx} 
                         className="h-8 rounded-sm bg-blue-500 transition-all hover:ring-2 ring-white dark:ring-gray-900 cursor-help relative group"
                         style={{ opacity }}
                       >
                         {/* Tooltip */}
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                           {Math.floor(Math.random() * 50) + 10} Tickets
                         </div>
                       </div>
                     );
                   })}
                </div>
              </div>
            ))}
            {/* X-Axis Labels */}
            <div className="flex pl-12 mt-2 text-xs text-gray-500 dark:text-gray-400 justify-between px-2">
              {timeSlots.map(time => <span key={time}>{time}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* Staff Performance Metrics Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Staff Performance Metrics</h3>
          <div className="flex gap-2 text-gray-500 dark:text-gray-400">
             <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path></svg></button>
             <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4">Staff Member / ID</th>
                <th className="px-6 py-4">Role / Counter</th>
                <th className="px-6 py-4">Tickets Handled</th>
                <th className="px-6 py-4">Avg. Handling Time (AHT)</th>
                <th className="px-6 py-4">SLA Compliance</th>
                <th className="px-6 py-4">SLA Breaches</th>
                <th className="px-6 py-4 text-right">CSAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {staffData.map((staff, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' :
                        idx === 1 ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400' :
                        idx === 2 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' :
                        'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400'
                      }`}>
                        {String(staff.name || '').split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{staff.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {staff.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{staff.role}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{staff.counter}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">{staff.tickets}</td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">{staff.aht}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${staff.sla >= 90 ? 'bg-green-500' : staff.sla >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${staff.sla}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-bold ${staff.sla >= 90 ? 'text-green-500' : staff.sla >= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {staff.sla}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                    <span className={staff.breaches > 10 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}>{staff.breaches}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                      staff.csat >= 4.5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      staff.csat >= 4.0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {staff.csat}/5.0
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <span>{meta ? `Showing ${(page-1)*20+1} to ${Math.min(page*20, meta.pagination.totalItems)} of ${meta.pagination.totalItems} staff members` : ''}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page-1))} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition">Previous</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded">{page}</button>
            <button onClick={() => setPage(page+1)} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition">Next</button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OStaffPerformanceReport;
