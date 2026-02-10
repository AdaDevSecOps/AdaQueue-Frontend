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

interface IWorkflowDefinition {
  profileId: string;
  displayBoards: IDisplayBoardDefinition[];
}

const ODisplayBoard: React.FC = () => {
  // --- State ---
  const [startupStep, setStartupStep] = useState<'init' | 'select_profile' | 'select_board' | 'ready'>('init');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<IDisplayBoardDefinition | null>(null);
  
  // Data State
  const [availableProfiles, setAvailableProfiles] = useState<IProfileOption[]>([]);
  const [availableBoards, setAvailableBoards] = useState<IDisplayBoardDefinition[]>([]);
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
        try {
            const res = await fetch(apiPath(`/api/queue/profile/${selectedProfileId}`));
            if (res.ok) {
                const data = await res.json();
                const mapped = data.map((q: any) => {
                  const raw = q.queueNo || q.docNo;
                  const hasAlpha = /[A-Za-z-]/.test(String(raw));
                  const formatted = hasAlpha ? String(raw) : String(raw).padStart(3, '0');
                  const prefix = q.data?.queueType ? String(q.data.queueType) : (q.data?.serviceGroup ? String(q.data.serviceGroup) : '');
                  const label = prefix ? `${prefix}-${formatted}` : formatted;
                  return {
                    docNo: q.docNo,
                    queueNo: label,
                    status: q.status,
                    serviceGroup: q.data?.queueType || q.data?.serviceGroup || 'General',
                    counter: q.data?.counter || '-'
                  };
                });
                setQueues(mapped);
            }
        } catch (e) {
            console.error('Failed to fetch queues for board', e);
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
    try {
        const res = await fetch(apiPath('/api/profile'));
        if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await res.json();
                // Map to IProfileOption
                const profiles: IProfileOption[] = data.map((p: any) => ({
                    code: p.code,
                    name: p.name,
                    agnCode: p.agnCode,
                    description: p.name // Use name as description if not available
                }));
                setAvailableProfiles(profiles);
                return profiles;
            } else {
                console.error("Received non-JSON response from /api/profile");
                setError("Backend connection failed. Invalid response format.");
            }
        } else {
            setError(`Failed to load profiles: ${res.status}`);
        }
    } catch (e) {
        console.warn('Failed to load profiles', e);
        setError("Network error connecting to backend.");
    }
    return [];
  };

  const loadWorkflowForProfile = async (profileId: string): Promise<IDisplayBoardDefinition[]> => {
    setLoading(true);
    try {
        const res = await fetch(apiPath(`/api/workflow-designer/${profileId}`));
        if (res.ok) {
            const workflow = await res.json();
            localStorage.setItem(`adaqueue_workflow_${profileId}`, JSON.stringify(workflow));
            setLoading(false);
            return workflow.displayBoards || [];
        } else {
             setError("Failed to load workflow configuration.");
        }
    } catch (e) {
        console.warn('Failed to load workflow', e);
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
      // Mock Queues for Display (In real app, we would fetch based on selectedBoard.visibleServiceGroups)
      // const mockQueues = [
      //   { docNo: 'A001', queueNo: 'A-101', status: 'WAIT', serviceGroup: 'GRP_DEP' },
      //   ...
      // ];
      
      const waitingQueues = queues.filter(q => q.status === 'WAITING' || q.status === 'WAIT_TABLE');
      const dueQueues = queues.filter(q => q.status === 'SERVING' || q.status === 'ASSIGNED' || q.status === 'CALLING');
      const inScope = (arr: any[]) => arr.filter(q =>
        !selectedBoard.visibleServiceGroups || 
        selectedBoard.visibleServiceGroups.length === 0 || 
        selectedBoard.visibleServiceGroups.includes('ALL') ||
        selectedBoard.visibleServiceGroups.includes(q.serviceGroup)
      );

      return (
        <div className="relative">
             {/* Hidden Reset Button (Top Left corner hover) */}
             <div className="absolute top-0 left-0 w-16 h-16 z-50 opacity-0 hover:opacity-100 transition-opacity">
                <button 
                    onClick={handleResetConfig}
                    className="bg-red-600 text-white text-xs p-2 rounded shadow-lg m-2"
                >
                    Reset Config
                </button>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <OQueueBoard queues={inScope(waitingQueues)} title={(selectedBoard.title || '') + ' - Waiting'} />
               <OQueueBoard queues={inScope(dueQueues)} title={(selectedBoard.title || '') + ' - Due'} />
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
