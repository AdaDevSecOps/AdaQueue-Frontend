import React, { useState, useEffect } from 'react';
import { Monitor, Server, ArrowRight, CheckCircle2, User, LogOut, LayoutGrid, AlertTriangle } from 'lucide-react';
import { apiPath } from '../../config/api';
import { io, Socket } from 'socket.io-client';


interface ITransition {
  action: string;
  to: string;
  requiredRole?: string[];
  label?: string;
}

interface IStateDefinition {
  code: string;
  label: string;
  type: 'INITIAL' | 'NORMAL' | 'FINAL';
  color?: string;
  transitions: ITransition[];
  estDuration?: number;
}

interface IServiceGroup {
  code: string;
  name: string;
  description?: string;
  priority?: 'Urgent' | 'High' | 'Standard' | 'Low';
}

interface IServicePoint {
  code: string;
  name: string;
  description?: string;
  focusStates: string[];
  serviceGroups?: string[];
}

interface IWorkflowDefinition {
  profileCode?: string;
  profileName?: string;
  industry: string;
  initialState: string;
  states: Record<string, IStateDefinition>;
  serviceGroups: IServiceGroup[];
  servicePoints: IServicePoint[];
}

interface IProfileOption {
  code: string;
  name: string;
  description: string;
}

/**
 * OStaffOperations
 * Comprehensive Staff Queue Operations Console
 * 
 * Reference Mockup: staff_queue_operations.png
 * Path: c:\example\IDE\10.Project\2026\03.AdaQueue\docs\mockup\staff_queue_operations.png
 */
const OStaffOperations: React.FC = () => {
  // State
  const [currentQueue, setCurrentQueue] = useState({ number: 'A-101', channel: 'Mobile', service: 'Emergency', status: 'CALLING', group: 'Q-ER-03' });
  const [isOnline, setIsOnline] = useState(true);
  const [selectedZone, setSelectedZone] = useState('Main Zone A');
  // const [selectedCounter, setSelectedCounter] = useState('Counter 01'); // Replaced by selectedPointCode
  const [selectedServiceGroup, setSelectedServiceGroup] = useState('ALL');
  
  // Workflow State
  const [workflow, setWorkflow] = useState<IWorkflowDefinition | null>(null);
  const [selectedPointCode, setSelectedPointCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueList, setQueueList] = useState<any[]>([]); // Real Data

  // Startup State
  const [startupStep, setStartupStep] = useState<'init' | 'select_profile' | 'select_point' | 'ready'>('init');
  const [profiles, setProfiles] = useState<IProfileOption[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<IProfileOption | null>(null);

  // 1. Initial Startup Check
    useEffect(() => {
        const initStartup = async () => {
            setLoading(true);
            
            // 1. Load Profiles (Backend -> LS -> Mock)
            const loadedProfiles = await loadProfiles();
            setProfiles(loadedProfiles);

            // Strict Mode: No LocalStorage Session Restore
            // Always force mandatory two-step selection

            if (loadedProfiles.length > 0) {
                setStartupStep('select_profile');
            } else {
                // No profiles
                // setStartupStep('init'); // stay or show error
            }
            
            setLoading(false);
        };

        initStartup();
    }, []);

  // --- Mock Helpers ---
  // In real app, these would be API calls
  const loadProfiles = async (): Promise<IProfileOption[]> => {
    // Try to fetch from backend
    try {
        const res = await fetch(apiPath('/api/profile'));
        if (res.ok) {
            const data = await res.json();
            return data.map((p: any) => ({
                code: p.code,
                name: p.name,
                description: p.name
            }));
        }
    } catch (e) {
        console.warn('Backend fetch failed', e);
    }
    return [];
  };

  const loadWorkflowForProfile = async (profileCode: string): Promise<IWorkflowDefinition | null> => {
      try {
            const res = await fetch(apiPath(`/api/workflow-designer/${profileCode}`));
            if (res.ok) {
                const data = await res.json();
                
                // Transform backend data to frontend model if needed
                // Backend: servicePoints, kiosks, etc inside 'config'
                // But the API /api/workflow-designer/:code returns the MERGED object directly
                
                // Map backend 'initialState' (if not present, default to 'PENDING')
                const initialState = data.initialState || 'PENDING';

                // Ensure states exist
                const states = data.states || {
                    'PENDING': { code: 'PENDING', label: 'Pending', type: 'INITIAL', transitions: [] },
                    'COMPLETED': { code: 'COMPLETED', label: 'Completed', type: 'FINAL', transitions: [] }
                };

                return {
                    profileCode: profileCode,
                    profileName: data.profileName,
                    industry: data.industry || 'General',
                    initialState: initialState,
                    states: states,
                    serviceGroups: data.serviceGroups || [],
                    servicePoints: data.servicePoints || []
                };
            }
       } catch (apiErr) {
           console.warn("API Workflow fetch failed", apiErr);
           setError("Failed to load workflow configuration.");
       }
       return null;
  };

  const handleSelectProfile = async (profile: IProfileOption) => {
      setLoading(true);
      setSelectedProfile(profile);
      try { localStorage.setItem('adaqueue_selected_profile', profile.code); } catch {}
      
      const wf = await loadWorkflowForProfile(profile.code);
      setWorkflow(wf);
      
      setStartupStep('select_point');
      setLoading(false);
  };

  const handleSelectPoint = (pointCode: string) => {
      setSelectedPointCode(pointCode);
      try { localStorage.setItem('adaqueue_staff_point', pointCode); } catch {}
      setStartupStep('ready');
  };

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const profileCode = localStorage.getItem('staff_profile_code') || selectedProfile?.code;
        if (!profileCode) return;
        const res = await fetch(apiPath(`/api/queue/profile/${profileCode}`));
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((q: any) => {
            const qData = q.data || (q.dataString ? JSON.parse(q.dataString) : {});
            const groupCode = qData.serviceGroup || qData.queueType || 'General';
            const groupName = workflow?.serviceGroups?.find(g => g.code === groupCode)?.name || groupCode || 'General';
            
            return {
              no: groupCode !== 'General' ? `${groupCode}-${String(q.queueNo).padStart(3,'0')}` : String(q.queueNo).padStart(3,'0'),
              channel: 'Walk-in',
              priority: 'Standard',
              timer: '—',
              isExpired: false,
              service: groupName, // Display Name (User Request: Show Name)
              group: groupCode,   // Filter Code (User Request: Keep Code for logic)
              state: q.status,
              ticketNo: q.ticketNo,
              created: new Date(q.checkInTime || Date.now()).getTime()
            };
          });
          setQueueList(mapped);
        }
      } catch {}
    };
    if (startupStep === 'ready') fetchQueues();
  }, [startupStep, selectedProfile]);

  useEffect(() => {
    if (startupStep !== 'ready' || !selectedProfile?.code) return;
    const base = (process.env.REACT_APP_API_BASE || '').trim();
    const url = base && base.startsWith('http') ? base.replace(/\/+$/, '') : window.location.origin;
    const socket: Socket = io(`${url}/ws`, { path: '/socket.io', transports: ['websocket'], autoConnect: true, withCredentials: false, reconnection: true });
    
    const handler = (evt: any) => {
      const q = evt?.queue;
      const pid = q?.data?.profileId || q?.profileCode;
      if (pid && pid === selectedProfile.code) {
        // Simple strategy: refresh list on relevant events
        (async () => {
          try {
            const res = await fetch(apiPath(`/api/queue/profile/${selectedProfile.code}`));
            if (res.ok) {
              const data = await res.json();
              const mapped = data.map((qq: any) => {
                const qData = qq.data || (qq.dataString ? JSON.parse(qq.dataString) : {});
                const groupCode = qData.serviceGroup || qData.queueType || 'General';
                const groupName = workflow?.serviceGroups?.find(g => g.code === groupCode)?.name || groupCode || 'General';
                return {
                  no: groupCode !== 'General' ? `${groupCode}-${String(qq.queueNo).padStart(3,'0')}` : String(qq.queueNo).padStart(3,'0'),
                  channel: 'Walk-in',
                  priority: 'Standard',
                  timer: '—',
                  isExpired: false,
                  service: groupName,
                  group: groupCode,
                  state: qq.status,
                  ticketNo: qq.ticketNo,
                  created: new Date(qq.checkInTime || Date.now()).getTime()
                };
              });
              setQueueList(mapped);
            }
          } catch {}
        })();
      }
    };

    socket.on('queue:update', handler);

    return () => {
      socket.off('queue:update', handler);
      socket.disconnect();
    };
  }, [startupStep, selectedProfile, workflow]);

  const handleResetConfig = () => {
      if (window.confirm('Change working station? This will reset your current session.')) {
          localStorage.removeItem('staff_point_code');
          setStartupStep('select_point');
      }
  };

  const handleFullReset = () => {
       if (window.confirm('Sign out from this location?')) {
          localStorage.removeItem('staff_point_code');
          localStorage.removeItem('staff_profile_code');
          setStartupStep('select_profile');
          setSelectedProfile(null);
          setWorkflow(null);
       }
  };

  // Render: Loading
  if (error) {
      return (
          <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
              <div className="text-center p-8 bg-gray-800 rounded-2xl border border-red-500/50 max-w-md mx-4">
                  <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">System Error</h2>
                  <p className="text-gray-400 mb-6">{error}</p>
                  <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                      Retry
                  </button>
              </div>
          </div>
      );
  }

  if (loading && startupStep === 'init') {
      return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
          </div>
      );
  }

  // Render: Step 1 - Select Profile
  if (startupStep === 'select_profile') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-2xl w-full bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Staff Login</h1>
                    <p className="text-gray-400">Select working environment</p>
                </div>

                <div className="space-y-4">
                    {profiles.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                             No profiles found. Please contact administrator.
                        </div>
                    ) : (
                        profiles.map((profile) => (
                            <button
                                key={profile.code}
                                onClick={() => handleSelectProfile(profile)}
                                className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors border border-gray-600 hover:border-blue-500 group"
                            >
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400">{profile.name}</h3>
                                    <p className="text-sm text-gray-400">{profile.description}</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400" />
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
      );
  }

  // Render: Step 2 - Select Service Point (Role)
  if (startupStep === 'select_point') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-2xl w-full bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Select Station</h1>
                    <p className="text-gray-400">Where are you working today?</p>
                    <div className="mt-2 inline-block px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm border border-blue-800">
                        {selectedProfile?.name}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {workflow?.servicePoints.map((point) => (
                        <button
                            key={point.code}
                            onClick={() => handleSelectPoint(point.code)}
                            className="flex flex-col items-center justify-center p-6 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all border border-gray-600 hover:border-green-500 group text-center h-32"
                        >
                            <Monitor className="w-8 h-8 text-gray-400 mb-3 group-hover:text-green-400" />
                            <h3 className="font-bold text-white group-hover:text-green-300">{point.name}</h3>
                            {point.description && <p className="text-xs text-gray-400 mt-1">{point.description}</p>}
                        </button>
                    ))}
                </div>

                 <div className="mt-8 text-center">
                    <button 
                        onClick={() => {
                            localStorage.removeItem('adaqueue_selected_profile');
                            localStorage.removeItem('adaqueue_staff_point');
                            setStartupStep('select_profile');
                        }}
                        className="text-gray-500 hover:text-white underline text-sm"
                    >
                        Switch Profile
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // Fetch Workflow Data (Legacy effect removed/replaced by checkProfiles)


  // Use workflow groups if available, else fallback
  const serviceGroups = workflow?.serviceGroups ? [{ code: 'ALL', name: 'All Services' }, ...workflow.serviceGroups] : [
    { code: 'ALL', name: 'All Services' },
    { code: 'Q-OPD-01', name: 'OPD Patient' },
    { code: 'Q-IPD-02', name: 'IPD Patient' },
    { code: 'Q-ER-03', name: 'Emergency ER' }
  ];

  // Filter queues based on selected service group AND selected service point focus states
  const filteredQueues = (() => {
      let result = queueList; // Use Real Data

      // 1. Service Group Filter
      if (selectedServiceGroup !== 'ALL') {
          result = result.filter(q => (q.group === selectedServiceGroup));
      }

      // 2. Service Point Focus State & Service Group Filter
      if (workflow && selectedPointCode) {
          const currentPoint = workflow.servicePoints.find(p => p.code === selectedPointCode);
          if (currentPoint) {
              if (currentPoint.focusStates && currentPoint.focusStates.length > 0) {
                  // Allow WAITING state by default so staff can pick up new tasks
                  result = result.filter(q => currentPoint.focusStates.includes(q.state) || q.state === 'WAITING');
              }
              if (currentPoint.serviceGroups && currentPoint.serviceGroups.length > 0) {
                  result = result.filter(q => currentPoint.serviceGroups!.includes(q.group));
              }
          }
      }

      // 3. FIFO Sorting (Sort by created time)
      result = result.sort((a, b) => a.created - b.created);

      return result;
  })();


  // Helper for Priority Badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT': return <span className="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">URGENT</span>;
      case 'HIGH': return <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">HIGH</span>;
      case 'NORMAL': case 'Standard': return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">NORMAL</span>;
      case 'LOW': return <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">LOW</span>;
      default: return null;
    }
  };

  // Helper for Channel Icon
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'Mobile': return <span className="mr-2">📱</span>;
      case 'Walk-in': return <span className="mr-2">🚶</span>;
      case 'Web': return <span className="mr-2">🌐</span>;
      default: return <span className="mr-2">📄</span>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-200">
      
      {/* Top Bar: Operations Breadcrumb & Controls */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
            <span>Operations</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            <span className="font-bold text-gray-800 dark:text-white">Queue Dashboard (O-01)</span>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Service Group, Zone & Counter Selectors */}
          <div className="flex gap-2 flex-wrap justify-end">
             {/* Service Group Selector */}
             <div className="relative">
              <select 
                value={selectedServiceGroup}
                onChange={(e) => setSelectedServiceGroup(e.target.value)}
                className="appearance-none bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 border rounded-lg py-2 pl-4 pr-10 text-sm font-bold text-blue-700 dark:text-blue-300 focus:ring-2 focus:ring-blue-500 min-w-[160px]"
              >
                {serviceGroups.map(group => (
                  <option key={group.code} value={group.code}>{group.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-blue-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            <div className="relative">
              <select 
                value={selectedPointCode}
                onChange={(e) => {
                    const newPoint = e.target.value;
                    setSelectedPointCode(newPoint);
                    localStorage.setItem('staff_point_code', newPoint);
                }}
                className="appearance-none bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 border rounded-lg py-2 pl-4 pr-10 text-sm font-bold text-emerald-700 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500 min-w-[180px]"
              >
                {workflow?.servicePoints?.map(point => (
                  <option key={point.code} value={point.code}>{point.name}</option>
                ))}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-emerald-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="hidden lg:flex items-center gap-4 text-sm font-medium">
             <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
               <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
               12 Waiting
             </div>
             <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
               <span className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-amber-500"></span>
               3 Near SLA
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel: Upcoming Queue List */}
        <div className="lg:col-span-5 flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
            <h2 className="font-bold text-lg text-gray-800 dark:text-white">Upcoming Queue</h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
              </button>
              <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/30 sticky top-0 z-10">
                <tr className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Queue No</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">SLA Timer</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredQueues.map((queue, idx) => (
                  <tr key={idx} className="hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group">
                    <td className="px-4 py-4 font-bold text-gray-900 dark:text-white">{queue.ticketNo || queue.no}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 flex items-center">
                      {getChannelIcon(queue.channel)} {queue.channel}
                    </td>
                    <td className="px-4 py-4">{getPriorityBadge(queue.priority)}</td>
                    <td className={`px-4 py-4 font-mono font-medium ${queue.isExpired ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                      {queue.timer} {queue.isExpired && <span className="text-xs font-bold ml-1">(EXPIRED)</span>}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Current Action & Controls */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Active Counter Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-blue-200 dark:border-blue-900 shadow-lg overflow-hidden relative">
            <div className="bg-blue-600 p-3 flex justify-between items-center text-white">
               <span className="font-bold tracking-wider text-sm uppercase">Now Calling</span>
               <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">Active Counter</span>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">Customer Ticket Number</p>
              <h1 className="text-8xl font-black text-gray-900 dark:text-white tracking-tight mb-6">{currentQueue.number}</h1>
              
              <div className="flex gap-3">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 font-medium">
                  Channel: {currentQueue.channel}
                </span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 font-medium">
                  Service: {currentQueue.service}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-4">
            <button className="h-32 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 flex flex-col items-center justify-center gap-2 transition-transform active:scale-95">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
              <span className="text-lg font-bold">CALL NEXT</span>
            </button>
            
            <button className="h-32 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center gap-2 transition-transform active:scale-95">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span className="text-lg font-bold">START PROCESS</span>
            </button>
            
            <button className="h-24 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 flex flex-col items-center justify-center gap-1 transition">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"></path></svg>
              <span className="font-bold text-sm">SKIP TICKET</span>
            </button>
            
            <button className="h-24 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex flex-col items-center justify-center gap-1 transition">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span className="font-bold text-sm">NO SHOW</span>
            </button>
          </div>

          {/* Session Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
             <h3 className="font-bold text-gray-800 dark:text-white mb-4 uppercase text-sm tracking-wider">Session Metrics</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                   <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">Total Served</p>
                   <p className="text-3xl font-bold text-gray-900 dark:text-white">24</p>
                </div>
                <div>
                   <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">Avg Service Time</p>
                   <p className="text-3xl font-bold text-gray-900 dark:text-white">04:12</p>
                </div>
                <div>
                   <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mb-1">Zone Avg Wait</p>
                   <p className="text-3xl font-bold text-gray-900 dark:text-white">14:50</p>
                </div>
                <div>
                   <p className="text-xs text-green-600 dark:text-green-400 font-bold mb-1">Success Rate</p>
                   <p className="text-3xl font-bold text-gray-900 dark:text-white">98%</p>
                </div>
             </div>
          </div>

        </div>
      </div>
      
      {/* Footer Status Bar */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-2 flex justify-between items-center text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
         <div className="flex gap-6">
           <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             System Sync: Healthy
           </span>
           <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             Current Shift: 03:45:12
           </span>
         </div>
         <div className="flex gap-4">
           <button className="hover:text-gray-800 dark:hover:text-white">Help & Support</button>
           <button className="hover:text-gray-800 dark:hover:text-white">Shortcuts</button>
           <span>UQMS v2.4.1</span>
         </div>
      </div>

    </div>
  );
};

export default OStaffOperations;
