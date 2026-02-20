import React, { useState, useEffect } from 'react';
import { Monitor, Server, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import OQueueBoard from '../../components/queue/OQueueBoard';
import { apiPath } from '../../config/api';

// --- Types ---
interface IProfileOption {
  code: string;
  name: string;
  agnCode?: string;
  description?: string;
}

interface IDisplayBoardDefinition {
  code: string;
  name: string;
  description?: string;
  title?: string;
  visibleServiceGroups: string[];
}

interface IServiceGroup {
  code: string;
  name: string;
  description?: string;
  priority?: string;
  initialState?: string;
  states?: Record<string, any>;
}

const ODisplayBoard: React.FC = () => {
  // --- State ---
  const [startupStep, setStartupStep] = useState<'init' | 'select_profile' | 'select_board' | 'ready'>('init');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<IDisplayBoardDefinition | null>(null);
  
  // Data State
  const [availableProfiles, setAvailableProfiles] = useState<IProfileOption[]>([]);
  const [availableBoards, setAvailableBoards] = useState<IDisplayBoardDefinition[]>([]);
  const [serviceGroups, setServiceGroups] = useState<IServiceGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queues, setQueues] = useState<any[]>([]); // Real Queue Data

  // --- Effects ---

  // 1. Initial Startup Check
  useEffect(() => {
    const initStartup = async () => {
        // 1. Load Profiles first
        const profiles = await loadProfiles();

        // Strict Mode: Mandatory Two-Step Selection (No Auto-Select)
        if (profiles.length > 0) {
            setStartupStep('select_profile');
        }
    };
    initStartup();
  }, []);

  // Helper to check board step
  const checkBoardStep = async (profileId: string) => {
      setSelectedProfileId(profileId);
      const boards = await loadWorkflowForProfile(profileId);
      setAvailableBoards(boards);

      // Mandatory Two-Step Selection: Do NOT auto-select board
      setStartupStep('select_board');
  };

  // 2. Fetch Queues periodically
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchQueues = async () => {
        if (!selectedProfileId) return;
        const url = apiPath(`/api/queue/profile/${selectedProfileId}`);
        const startTime = performance.now();
        
        console.groupCollapsed(`🟢 GET ${url}`);
        console.log('📤 REQUEST:', {
            method: 'GET',
            url: url,
            params: { profileId: selectedProfileId },
            timestamp: new Date().toISOString()
        });

        try {
            const res = await fetch(url);
            const duration = Math.round(performance.now() - startTime);
            
            console.log('📥 RESPONSE:', {
                status: res.status,
                statusText: res.statusText,
                ok: res.ok,
                duration: `${duration}ms`,
                headers: {
                    'content-type': res.headers.get('content-type')
                }
            });

            if (res.ok) {
                const data = await res.json();
                console.log('📦 RESPONSE DATA:', data);

                const mapped = data.map((q: any) => {
                  // Parse embedded data from either object `data` or JSON string `dataString`
                  let embedded: any = {};
                  try {
                    if (q.data && typeof q.data === 'object') embedded = q.data;
                    else if (q.dataString) embedded = JSON.parse(q.dataString);
                  } catch (err) {
                    console.warn('Failed to parse dataString for', q.docNo, err);
                  }

                  // Use docNo directly without formatting
                  const label = q.docNo;

                  // Use queueType from response directly
                  const serviceGroup = q.queueType || 'General';

                  return {
                    docNo: q.docNo,
                    queueNo: label,
                    ticketNo: q.ticketNo || '',
                    status: q.status,
                    serviceGroup: serviceGroup,
                    queueType: q.queueType || '',
                    refId: q.refId || embedded.counter || '',
                    refType: q.refType || '',
                    checkInTime: q.checkInTime || new Date().toISOString(),
                    counter: embedded.counter ?? '-'
                  };
                });
                
                // Sort by checkInTime
                mapped.sort((a: any, b: any) => {
                    return new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
                });
                console.log('✅ SUCCESS: Mapped', mapped.length, 'queues');
                console.log('📊 Service Group Distribution:', 
                    mapped.reduce((acc: any, q: any) => {
                        acc[q.serviceGroup] = (acc[q.serviceGroup] || 0) + 1;
                        return acc;
                    }, {})
                );
                console.groupEnd();
                setQueues(mapped);
            } else {
                console.error('❌ FAILED:', res.status, res.statusText);
                console.groupEnd();
            }
        } catch (e) {
            console.error('❌ ERROR:', e);
            console.groupEnd();
        }
    };

    if (startupStep === 'ready' && selectedProfileId) {
        fetchQueues();
        interval = setInterval(fetchQueues, 5000);
    }

    return () => {
        if (interval) clearInterval(interval);
    };
  }, [startupStep, selectedProfileId]);

  // --- Logic ---

  const loadProfiles = async (): Promise<IProfileOption[]> => {
    const url = apiPath('/api/profile');
    const startTime = performance.now();
    
    console.groupCollapsed(`🔵 GET ${url}`);
    console.log('📤 REQUEST:', {
        method: 'GET',
        url: url,
        timestamp: new Date().toISOString()
    });
    
    try {
        const res = await fetch(url);
        const duration = Math.round(performance.now() - startTime);
        const contentType = res.headers.get("content-type");
        
        console.log('📥 RESPONSE:', {
            status: res.status,
            statusText: res.statusText,
            ok: res.ok,
            duration: `${duration}ms`,
            headers: {
                'content-type': contentType
            }
        });

        if (res.ok) {
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await res.json();
                console.log('📦 RESPONSE DATA:', data);

                // Map to IProfileOption
                const profiles: IProfileOption[] = data.map((p: any) => ({
                    code: p.code,
                    name: p.name,
                    agnCode: p.agnCode,
                    description: p.name // Use name as description if not available
                }));
                setAvailableProfiles(profiles);
                console.log('✅ SUCCESS: Loaded', profiles.length, 'profiles');
                console.groupEnd();
                return profiles;
            } else {
                console.error("❌ FAILED: Received non-JSON response");
                console.groupEnd();
                setError("Backend connection failed. Invalid response format.");
            }
        } else {
            console.error(`❌ FAILED: ${res.status} ${res.statusText}`);
            console.groupEnd();
            setError(`Failed to load profiles: ${res.status}`);
        }
    } catch (e) {
        console.error('❌ ERROR:', e);
        console.groupEnd();
        setError("Network error connecting to backend.");
    }
    return [];
  };

  const loadWorkflowForProfile = async (profileId: string): Promise<IDisplayBoardDefinition[]> => {
    setLoading(true);
    const url = apiPath(`/api/workflow-designer/${profileId}`);
    const startTime = performance.now();
    
    console.groupCollapsed(`🟣 GET ${url}`);
    console.log('📤 REQUEST:', {
        method: 'GET',
        url: url,
        params: { profileId },
        timestamp: new Date().toISOString()
    });
    
    try {
        const res = await fetch(url);
        const duration = Math.round(performance.now() - startTime);
        
        console.log('📥 RESPONSE:', {
            status: res.status,
            statusText: res.statusText,
            ok: res.ok,
            duration: `${duration}ms`,
            headers: {
                'content-type': res.headers.get('content-type')
            }
        });

        if (res.ok) {
            const workflow = await res.json();
            console.log('📦 RESPONSE DATA:', workflow);
            console.log('📊 SUMMARY:', {
                profileId: workflow.profileId,
                profileName: workflow.profileName,
                serviceGroups: workflow.serviceGroups?.length || 0,
                displayBoards: workflow.displayBoards?.length || 0
            });
            console.log('✅ SUCCESS: Workflow loaded with', workflow.displayBoards?.length || 0, 'display boards');
            console.groupEnd();

            // Save workflow data including serviceGroups
            localStorage.setItem(`adaqueue_workflow_${profileId}`, JSON.stringify(workflow));
            
            // Store serviceGroups for later use
            if (workflow.serviceGroups) {
                setServiceGroups(workflow.serviceGroups);
            }
            
            setLoading(false);
            return workflow.displayBoards || [];
        } else {
             console.error('❌ FAILED:', res.status, res.statusText);
             console.groupEnd();
             setError("Failed to load workflow configuration.");
        }
    } catch (e) {
        console.error('❌ ERROR:', e);
        console.groupEnd();
        setError("Network error loading workflow.");
    }
    setLoading(false);
    return [];
  };

  const handleProfileSelect = async (profileId: string) => {
      localStorage.setItem('adaqueue_board_profile_id', profileId);
      await checkBoardStep(profileId);
  };

  const handleBoardSelect = (board: IDisplayBoardDefinition) => {
      if (!selectedProfileId) return;
      setSelectedBoard(board);
      
      // Save Config
      localStorage.setItem('adaqueue_board_code', board.code);
      localStorage.setItem('adaqueue_board_name', board.name); // For easy access

      setStartupStep('ready');
  };

  const handleResetConfig = () => {
      if (window.confirm('Reset Display Board configuration?')) {
          localStorage.removeItem('adaqueue_board_profile_id');
          localStorage.removeItem('adaqueue_board_code');
          setStartupStep('select_profile');
          loadProfiles();
      }
  };

  // --- Render ---

  if (startupStep === 'ready' && selectedBoard) {
      // Get visible service group codes
      const visibleGroupCodes = selectedBoard.visibleServiceGroups || [];

      // Helper function to get service group name from code
      const getServiceGroupName = (code: string): string => {
          const group = serviceGroups.find(sg => sg.code === code);
          return group?.name || code; // Fallback to code if name not found
      };

      // Check if single service group mode (state-based columns)
      const isSingleGroupMode = visibleGroupCodes.length === 1;
      
      if (isSingleGroupMode) {
          // Single Service Group Mode: Display by states
          const singleGroupCode = visibleGroupCodes[0];
          // Find the service group that matches the visible code
          const singleGroup = serviceGroups.find(sg => sg.code === singleGroupCode);
          
          if (!singleGroup || !singleGroup.states) {
              return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Invalid service group configuration</div>;
          }

          // Get all state codes from the service group
          const stateEntries = Object.entries(singleGroup.states);
          
          return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-2">
                 {/* Hidden Reset Button (Top Left corner hover) */}
                 <div className="absolute top-0 left-0 w-16 h-16 z-50 opacity-0 hover:opacity-100 transition-opacity">
                    <button 
                        onClick={handleResetConfig}
                        className="bg-red-600 text-white text-xs p-2 rounded shadow-lg m-2 hover:bg-red-700 transition-colors"
                    >
                        Reset Config
                    </button>
                 </div>

                 {/* State-Based Columns */}
                 <div className="flex gap-2 h-full">
                     {stateEntries.map(([stateCode, stateData]: [string, any]) => {
                         // Filter queues by state (status) - show all queueTypes
                         const stateQueues = queues.filter(q => q.status === stateCode);
                         
                         return (
                             <OQueueBoard 
                                 key={stateCode}
                                 queues={stateQueues}
                                 leftTitle={stateData.label || stateCode}
                                 title={stateData.label || stateCode}
                             />
                         );
                     })}
                 </div>
            </div>
          );
      }

      // Multi Service Group Mode: Display 3 fixed columns
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-2">
             {/* Hidden Reset Button (Top Left corner hover) */}
             <div className="absolute top-0 left-0 w-16 h-16 z-50 opacity-0 hover:opacity-100 transition-opacity">
                <button 
                    onClick={handleResetConfig}
                    className="bg-red-600 text-white text-xs p-2 rounded shadow-lg m-2 hover:bg-red-700 transition-colors"
                >
                    Reset Config
                </button>
             </div>

             {/* Three Fixed Columns */}
             <div className="flex gap-2 h-full">
                 {/* Column 1: Waiting Queue - Filter by visibleServiceGroups */}
                 <OQueueBoard 
                     queues={queues.filter(q => visibleGroupCodes.includes(q.serviceGroup))}
                     leftTitle="Waiting Queue"
                     title="Waiting Queue"
                 />

                 {/* Column 2: คิวที่กำลังดำเนินการ - Filter by visibleServiceGroups and status !== "WAITING" */}
                 <OQueueBoard 
                     queues={queues.filter(q => q.status !== 'WAITING' && visibleGroupCodes.includes(q.serviceGroup))}
                     leftTitle="คิวที่กำลังดำเนินการ"
                     title="คิวที่กำลังดำเนินการ"
                     displayMode="all"
                 />

                 {/* Column 3: ช่องบริการ - Show queueType as service group name, filtered by visibleServiceGroups */}
                 <OQueueBoard 
                    queues={queues
                        .filter(q => q.status !== 'WAITING' && visibleGroupCodes.includes(q.serviceGroup))
                        .map(q => {
                            const label = q.refId || q.counter || q.refType || getServiceGroupName(q.serviceGroup);
                            return { ...q, queueNo: label, ticketNo: '' };
                        })
                    }
                     leftTitle="ช่องบริการ"
                     title="ช่องบริการ"
                     displayMode="all"
                 />
             </div>
        </div>
      );
  }

  // --- Render ---

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

  if (startupStep === 'select_profile') {
      return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8 animate-fade-in">
            <div className="mb-12 text-center">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/50">
                    <Server className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Select Environment</h1>
                <p className="text-gray-400">Choose the profile this display board belongs to.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
                {availableProfiles.map(profile => (
                    <button
                        key={profile.code}
                        onClick={() => handleProfileSelect(profile.code)}
                        className="group bg-gray-800 hover:bg-gray-750 border-2 border-gray-700 hover:border-blue-500 rounded-2xl p-8 transition-all duration-300 text-left relative overflow-hidden shadow-xl"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center text-gray-400 group-hover:text-blue-400 group-hover:bg-blue-600/20 transition-colors">
                                <Server className="w-6 h-6" />
                            </div>
                            <ArrowRight className="w-6 h-6 text-gray-600 group-hover:text-blue-500 transition-all transform group-hover:translate-x-1" />
                        </div>
                        
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{profile.name}</h3>
                            <div className="flex flex-wrap gap-2 items-center">
                                {profile.agnCode && (
                                    <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 text-xs font-mono rounded border border-blue-800 uppercase tracking-wider">
                                        {profile.agnCode}
                                    </span>
                                )}
                                <p className="text-sm text-gray-500 font-mono uppercase tracking-wide">ID: {profile.code}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      );
  }

  if (startupStep === 'select_board') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 animate-fade-in">
          <button 
            onClick={() => setStartupStep('select_profile')}
            className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
          >
              ← Back to Profiles
          </button>

          <div className="text-center mb-12">
              <div className="w-20 h-20 bg-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-900/50">
                  <Monitor className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">Select Display Board</h1>
              <p className="text-gray-400 text-lg">Which screen configuration should be loaded?</p>
          </div>

          {loading ? (
              <div className="text-white">Loading configuration...</div>
          ) : availableBoards.length === 0 ? (
              <div className="text-center bg-gray-800 p-8 rounded-xl border border-dashed border-gray-700 max-w-md">
                  <Monitor className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Boards Found</h3>
                  <p className="text-gray-400 mb-6">This profile doesn't have any display boards configured yet.</p>
                  <button 
                    onClick={() => setStartupStep('select_profile')}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                  >
                      Choose Different Profile
                  </button>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                  {availableBoards.map(board => (
                      <button
                          key={board.code}
                          onClick={() => handleBoardSelect(board)}
                          className="group bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-pink-500 rounded-2xl p-6 text-left transition-all duration-300 shadow-xl relative overflow-hidden"
                      >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                          
                          <div className="flex justify-between items-start mb-4 relative z-10">
                              <div className="w-12 h-12 rounded-full bg-gray-700 group-hover:bg-pink-600/20 flex items-center justify-center transition-colors">
                                  <Monitor className="w-6 h-6 text-gray-400 group-hover:text-pink-400" />
                              </div>
                              <CheckCircle2 className="w-6 h-6 text-gray-700 group-hover:text-pink-500 opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                          
                          <div className="relative z-10">
                            <h3 className="text-xl font-bold text-white mb-1">{board.name}</h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{board.description || 'No description'}</p>
                            
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-gray-900 rounded text-xs font-mono text-gray-500 border border-gray-700">
                                    {board.code}
                                </span>
                                {board.visibleServiceGroups?.length > 0 && (
                                    <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs font-bold border border-blue-900/50">
                                        {board.visibleServiceGroups.length} Queues
                                    </span>
                                )}
                            </div>
                          </div>
                      </button>
                  ))}
              </div>
          )}
      </div>
    );
  }

  return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
};

export default ODisplayBoard;
