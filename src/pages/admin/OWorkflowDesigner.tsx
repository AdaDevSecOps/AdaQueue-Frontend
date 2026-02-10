import React, { useState, useEffect } from 'react';
import { apiPath } from '../../config/api';
import { 
  Building2, Plus, Pencil, Trash2, Save, ArrowLeft, 
  Clock, MapPin, Users, Settings, CheckCircle2, AlertTriangle,
  Monitor, Smartphone, UserCheck, Stethoscope, Pill, CheckSquare,
  ArrowRight, ClipboardList, Activity
} from 'lucide-react';

// --- Type Definitions ---

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
  initialState: string;
  states: Record<string, IStateDefinition>;
}

interface IServicePoint {
  code: string;
  name: string;
  description?: string;
  focusStates: string[]; 
  serviceGroups?: string[];
}

interface IKioskDefinition {
  code: string;
  name: string;
  description?: string;
  title?: string; // Display Title on Kiosk Screen
  visibleServiceGroups: string[]; // Queue Types visible on this kiosk
}

interface IDisplayBoardDefinition {
  code: string;
  name: string;
  description?: string;
  title?: string; // Display Title on Board
  visibleServiceGroups: string[]; // Queue Types visible on this board
}

interface IProfileOption {
  code: string;
  name: string;
  agnCode?: string;
  description?: string;
  config?: any;
}

interface IWorkflowDefinition {
  profileId: string;
  profileCode?: string;
  profileName?: string;
  description?: string;
  agnCode?: string;
  serviceGroups: IServiceGroup[];
  servicePoints: IServicePoint[];
  kiosks: IKioskDefinition[];
  displayBoards: IDisplayBoardDefinition[];
}

const DEFAULT_PROFILES: IProfileOption[] = [];

// --- Component ---

const OWorkflowDesigner: React.FC = () => {
  // --- State Management ---
  const [profiles, setProfiles] = useState<IProfileOption[]>([]);
  
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');

  const [workflow, setWorkflow] = useState<IWorkflowDefinition | null>(null);
  
  // Selection States
  const [selectedGroupCode, setSelectedGroupCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'queue_detail' | 'points' | 'kiosks' | 'boards'>('overview');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isEditingProfileName, setIsEditingProfileName] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCreateProfileModalOpen, setIsCreateProfileModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingProfile, setEditingProfile] = useState<IProfileOption | null>(null);
  const [newProfileData, setNewProfileData] = useState({ name: '', description: '', agnCode: '' });

  // Queue Detail Sub-tabs
  const [queueDetailTab, setQueueDetailTab] = useState<'general' | 'workflow' | 'settings'>('workflow');
  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(null);

  // --- Effects ---
  
  // Fetch Profiles from Backend on Mount
  useEffect(() => {
    const fetchProfiles = async () => {
        try {
            const res = await fetch(apiPath('/api/profile'));
            if (res.ok) {
                const data = await res.json();
                // Map backend entity to IProfileOption
                const mappedProfiles = data.map((p: any) => ({
                    code: p.code,
                    name: p.name,
                    agnCode: p.agnCode,
                    description: p.config?.description || '',
                    config: p.config // Store full config
                }));
                setProfiles(mappedProfiles);
                if (mappedProfiles.length > 0 && !selectedProfileId) {
                    setSelectedProfileId(mappedProfiles[0].code);
                }
            } else {
                console.error("Failed to fetch profiles");
            }
        } catch (e) {
            console.error("API Error fetching profiles:", e);
        }
    };
    fetchProfiles();
  }, []);

  // Save selected profile ID and fetch data whenever selection changes
  useEffect(() => {
    if (selectedProfileId) {
        fetchWorkflow(selectedProfileId);
    }
  }, [selectedProfileId]);

  // --- Data Fetching & Mocking ---
  const fetchWorkflow = async (profileId: string) => {
    setLoading(true);
    setError(null);
    try {
      let loadedData: IWorkflowDefinition | null = null;
      
      // 1. Fetch from API (Strict Mode: No LocalStorage Fallback)
      try {
          const res = await fetch(apiPath(`/api/workflow-designer/${profileId}`));
          const contentType = res.headers.get("content-type");
          if (res.ok && contentType && contentType.includes("application/json")) {
              const payload = await res.json();
              if (payload && (payload.error || payload.message === 'Not Found')) {
                  setError('ไม่พบข้อมูลโปรไฟล์หรือเวิร์กโฟลว์ที่เลือก');
                  loadedData = null;
              } else {
                  loadedData = payload;
              }
          } else {
              setError(`Failed to load profile: ${res.statusText}`);
          }
      } catch (e) {
          setError("API not reachable. Please check backend connection.");
      }

      if (loadedData) {
          // Inject profileId to ensure save works correctly
          if (!loadedData.profileId) {
              loadedData.profileId = profileId;
          }
          
          // Inject agnCode and profileName from profiles list if missing or outdated
          const currentProfile = profiles.find(p => p.code === profileId);
          if (currentProfile) {
              // Always sync agnCode and profileName with the actual profile data
              loadedData.agnCode = currentProfile.agnCode;
              loadedData.profileName = currentProfile.name;
          }

          // Ensure arrays are initialized for legacy data
          if (!loadedData.displayBoards) loadedData.displayBoards = [];
          if (!loadedData.kiosks) loadedData.kiosks = [];
          if (!loadedData.servicePoints) loadedData.servicePoints = [];
          if (!loadedData.serviceGroups) loadedData.serviceGroups = [];
          
          setWorkflow(loadedData);
      } else {
          setWorkflow(null); // Clear workflow if load fails
      }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  // --- CRUD Operations ---

  const handleAddProfile = () => {
    setNewProfileData({ name: '', description: '', agnCode: '' });
    setModalMode('create');
    setEditingProfile(null);
    setIsCreateProfileModalOpen(true);
    setIsProfileDropdownOpen(false);
  };

  const handleEditProfile = (profile: IProfileOption, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewProfileData({ 
        name: profile.name, 
        description: profile.description || '',
        agnCode: profile.agnCode || '' 
    });
    setModalMode('edit');
    setEditingProfile(profile);
    setIsCreateProfileModalOpen(true);
    setIsProfileDropdownOpen(false);
  };

  const handleDeleteProfile = async (profileCode: string, profileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete profile "${profileName}"? This cannot be undone.`)) {
        return;
    }

    try {
        const res = await fetch(apiPath(`/api/profile/${profileCode}`), {
            method: 'DELETE'
        });

        if (res.ok) {
            setProfiles(profiles.filter(p => p.code !== profileCode));
            if (selectedProfileId === profileCode) {
                // If deleted current profile, switch to first available or clear
                const remaining = profiles.filter(p => p.code !== profileCode);
                if (remaining.length > 0) {
                    setSelectedProfileId(remaining[0].code);
                } else {
                    setSelectedProfileId('');
                    setWorkflow(null);
                }
            }
            setSuccessMsg(`Deleted profile: ${profileName}`);
            setTimeout(() => setSuccessMsg(null), 3000);
        } else {
            setError("Failed to delete profile.");
        }
    } catch (e) {
        setError("Network error deleting profile.");
    }
  };

  const handleProfileSubmit = async () => {
    if (newProfileData.name.trim()) {
        const isEdit = modalMode === 'edit';
        const profileCode = isEdit && editingProfile ? editingProfile.code : `PF-${Date.now()}`;
        
        // Prepare config
        let configToSave: any;
        if (isEdit && editingProfile && editingProfile.config) {
             // Merge existing config with new description
             configToSave = {
                 ...editingProfile.config,
                 profileId: profileCode,
                 profileName: newProfileData.name,
                 agnCode: newProfileData.agnCode,
                 description: newProfileData.description
             };
        } else {
             // New config or fallback
             configToSave = {
                 profileId: profileCode,
                 profileName: newProfileData.name,
                 agnCode: newProfileData.agnCode,
                 description: newProfileData.description,
                 serviceGroups: [],
                 servicePoints: [],
                 kiosks: [],
                 displayBoards: []
             };
        }

        const payload: any = {
            code: profileCode,
            name: newProfileData.name,
            workflowCode: `WF-${profileCode}`,
            agnCode: newProfileData.agnCode,
            config: configToSave
        };

        try {
            let url = apiPath('/api/profile');
            let method = 'POST';

            if (isEdit) {
                url = apiPath(`/api/profile/${profileCode}`);
                method = 'PUT';
                delete payload.code; 
                payload.workflowCode = undefined; 
            }

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const updatedProfile: IProfileOption = {
                    code: profileCode,
                    name: newProfileData.name,
                    agnCode: newProfileData.agnCode,
                    description: newProfileData.description,
                    config: configToSave
                };

                if (isEdit) {
                    setProfiles(profiles.map(p => p.code === profileCode ? updatedProfile : p));
                    setSuccessMsg(`Updated profile: ${newProfileData.name}`);

                    // Update workflow state if currently selected
                    if (selectedProfileId === profileCode && workflow) {
                        setWorkflow({
                            ...workflow,
                            profileName: newProfileData.name,
                            agnCode: newProfileData.agnCode
                        });
                    }
                } else {
                    setProfiles([...profiles, updatedProfile]);
                    setSelectedProfileId(profileCode);
                    setSuccessMsg(`Created new profile: ${newProfileData.name}`);
                }
                setIsCreateProfileModalOpen(false);
                setTimeout(() => setSuccessMsg(null), 3000);
            } else {
                setError("Failed to save profile in database.");
            }
        } catch (e) {
            setError("Network error saving profile.");
        }
    }
  };

  const handleSave = async () => {
    if (!workflow) return;
    setLoading(true);
    setSuccessMsg(null);
    setError(null);
    try {
        const res = await fetch(apiPath('/api/workflow-designer/save'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workflow)
        });
        
        const contentType = res.headers.get("content-type");
        if (res.ok && contentType && contentType.includes("application/json")) {
            await res.json();
            setSuccessMsg('Workflow saved successfully to Database!');
        } else {
            setError(`Failed to save: ${res.statusText}`);
        }
        setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
        setError("API unreachable. Save failed.");
    } finally {
        setLoading(false);
    }
  };

  const addNewGroup = () => {
    if (!workflow) return;
    const newCode = `Q-NEW-${workflow.serviceGroups.length + 1}`;
    const newGroup: IServiceGroup = {
        code: newCode,
        name: 'New Queue Type',
        description: 'Description of the new queue workflow',
        priority: 'Standard',
        initialState: 'WAIT',
        states: {
            'WAIT': { code: 'WAIT', label: 'Waiting', type: 'INITIAL', color: '#3B82F6', transitions: [] }
        }
    };
    setWorkflow({
        ...workflow,
        serviceGroups: [...workflow.serviceGroups, newGroup]
    });
    setSelectedGroupCode(newCode);
    setActiveTab('queue_detail');
    setQueueDetailTab('workflow');
  };

  const updateKiosk = (kioskCode: string, updates: Partial<IKioskDefinition>) => {
    if (!workflow) return;
    const newKiosks = workflow.kiosks.map(k => 
        k.code === kioskCode ? { ...k, ...updates } : k
    );
    setWorkflow({ ...workflow, kiosks: newKiosks });
  };

  const addKiosk = () => {
    if (!workflow) return;
    const newCode = `K-NEW-${workflow.kiosks.length + 1}`;
    const newKiosk: IKioskDefinition = {
        code: newCode,
        name: 'New Kiosk',
        description: 'Description',
        visibleServiceGroups: []
    };
    setWorkflow({ ...workflow, kiosks: [...workflow.kiosks, newKiosk] });
  };

  const deleteKiosk = (code: string) => {
    if (!workflow) return;
    if (window.confirm('Are you sure you want to delete this kiosk?')) {
        setWorkflow({ ...workflow, kiosks: workflow.kiosks.filter(k => k.code !== code) });
    }
  };

  const updateServicePoint = (pointCode: string, updates: Partial<IServicePoint>) => {
    if (!workflow) return;
    const newPoints = workflow.servicePoints.map(p => 
        p.code === pointCode ? { ...p, ...updates } : p
    );
    setWorkflow({ ...workflow, servicePoints: newPoints });
  };

  const addServicePoint = () => {
    if (!workflow) return;
    const newCode = `POINT-${workflow.servicePoints.length + 1}`;
    const newPoint: IServicePoint = {
        code: newCode,
        name: 'New Service Point',
        description: 'Description',
        focusStates: [],
        serviceGroups: []
    };
    setWorkflow({ ...workflow, servicePoints: [...workflow.servicePoints, newPoint] });
  };

  const deleteServicePoint = (code: string) => {
    if (!workflow) return;
    if (window.confirm('Are you sure you want to delete this service point?')) {
        setWorkflow({ ...workflow, servicePoints: workflow.servicePoints.filter(p => p.code !== code) });
    }
  };

  const updateDisplayBoard = (code: string, updates: Partial<IDisplayBoardDefinition>) => {
    if (!workflow) return;
    const newBoards = workflow.displayBoards.map(b => 
        b.code === code ? { ...b, ...updates } : b
    );
    setWorkflow({ ...workflow, displayBoards: newBoards });
  };

  const addDisplayBoard = () => {
    if (!workflow) return;
    const newCode = `TV-NEW-${workflow.displayBoards.length + 1}`;
    const newBoard: IDisplayBoardDefinition = {
        code: newCode,
        name: 'New Display Board',
        description: 'Description',
        visibleServiceGroups: []
    };
    setWorkflow({ ...workflow, displayBoards: [...workflow.displayBoards, newBoard] });
  };

  const deleteDisplayBoard = (code: string) => {
    if (!workflow) return;
    if (window.confirm('Are you sure you want to delete this display board?')) {
        setWorkflow({ ...workflow, displayBoards: workflow.displayBoards.filter(b => b.code !== code) });
    }
  };

  // --- Helper Components ---

  const StatusBadge = ({ type }: { type: string }) => {
    const styles = {
        'INITIAL': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        'NORMAL': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        'FINAL': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${(styles as any)[type] || styles['NORMAL']}`}>
            {type}
        </span>
    );
  };

  // --- Render Views ---

  const renderKiosks = () => {
    if (!workflow) return null;
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Kiosk Configuration</h2>
                        <p className="text-gray-500 text-sm">Manage kiosks connected to this profile and their visible queues.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition flex items-center gap-2">
                        {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>
                    <button onClick={addKiosk} className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Kiosk
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {workflow.kiosks?.map(kiosk => (
                    <div key={kiosk.code} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Kiosk Info */}
                            <div className="md:w-1/3 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Kiosk Name (Internal)</label>
                                    <input 
                                        type="text" 
                                        value={kiosk.name}
                                        onChange={(e) => updateKiosk(kiosk.code, { name: e.target.value })}
                                        className="w-full text-lg font-bold bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none"
                                        placeholder="e.g. Main Entrance Kiosk"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Display Title (Public)</label>
                                    <input 
                                        type="text" 
                                        value={kiosk.title || ''}
                                        onChange={(e) => updateKiosk(kiosk.code, { title: e.target.value })}
                                        className="w-full text-md font-medium bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none"
                                        placeholder="e.g. Welcome to AdaCafe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                                    <textarea 
                                        value={kiosk.description || ''}
                                        onChange={(e) => updateKiosk(kiosk.code, { description: e.target.value })}
                                        rows={2}
                                        className="w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Device Code</label>
                                    <div className="flex items-center gap-2">
                                        <Monitor className="w-4 h-4 text-gray-400" />
                                        <span className="font-mono text-sm text-gray-600 dark:text-gray-300">{kiosk.code}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => deleteKiosk(kiosk.code)}
                                    className="text-red-500 text-xs font-bold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded w-fit"
                                >
                                    <Trash2 className="w-3 h-3" /> Remove Kiosk
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="hidden md:block w-px bg-gray-200 dark:bg-gray-700"></div>

                            {/* Queue Selection */}
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-blue-500" /> Visible Queue Types
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {workflow.serviceGroups.map(group => {
                                        const isSelected = kiosk.visibleServiceGroups.includes(group.code);
                                        return (
                                            <div 
                                                key={group.code}
                                                onClick={() => {
                                                    const newGroups = isSelected
                                                        ? kiosk.visibleServiceGroups.filter(c => c !== group.code)
                                                        : [...kiosk.visibleServiceGroups, group.code];
                                                    updateKiosk(kiosk.code, { visibleServiceGroups: newGroups });
                                                }}
                                                className={`cursor-pointer p-3 rounded-lg border flex items-start gap-3 transition-all ${
                                                    isSelected 
                                                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                                                    : 'bg-gray-50 border-transparent hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800'
                                                }`}
                                            >
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                                                    isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-300'
                                                }`}>
                                                    {isSelected && <CheckCircle2 className="w-3 h-3" />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-gray-800 dark:text-white">{group.name}</div>
                                                    <div className="text-xs text-gray-500">{group.code}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {workflow.serviceGroups.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        No Queue Types defined in this profile yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {workflow.kiosks.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400">No Kiosks Configured</h3>
                        <p className="text-gray-500 text-sm mb-4">Add a kiosk to this profile to configure which queues it displays.</p>
                        <button onClick={addKiosk} className="text-blue-600 font-bold hover:underline">Create First Kiosk</button>
                    </div>
                )}
            </div>
        </div>
    );
  };

  const renderDisplayBoards = () => {
    if (!workflow) return null;
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Display Board Configuration</h2>
                        <p className="text-gray-500 text-sm">Manage TV screens and monitors for queue calling display.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition flex items-center gap-2">
                        {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>
                    <button onClick={addDisplayBoard} className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Board
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {workflow.displayBoards?.map(board => (
                    <div key={board.code} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Board Info */}
                            <div className="md:w-1/3 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Board Name (Internal)</label>
                                    <input 
                                        type="text" 
                                        value={board.name}
                                        onChange={(e) => updateDisplayBoard(board.code, { name: e.target.value })}
                                        className="w-full text-lg font-bold bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none"
                                        placeholder="e.g. Main Hall TV"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Display Title (Public)</label>
                                    <input 
                                        type="text" 
                                        value={board.title || ''}
                                        onChange={(e) => updateDisplayBoard(board.code, { title: e.target.value })}
                                        className="w-full text-md font-medium bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none"
                                        placeholder="e.g. Now Calling"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                                    <textarea 
                                        value={board.description || ''}
                                        onChange={(e) => updateDisplayBoard(board.code, { description: e.target.value })}
                                        rows={2}
                                        className="w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Device Code</label>
                                    <div className="flex items-center gap-2">
                                        <Monitor className="w-4 h-4 text-gray-400" />
                                        <span className="font-mono text-sm text-gray-600 dark:text-gray-300">{board.code}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => deleteDisplayBoard(board.code)}
                                    className="text-red-500 text-xs font-bold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded w-fit"
                                >
                                    <Trash2 className="w-3 h-3" /> Remove Board
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="hidden md:block w-px bg-gray-200 dark:bg-gray-700"></div>

                            {/* Queue Selection */}
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-blue-500" /> Displayed Queue Types
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {workflow.serviceGroups.map(group => {
                                        const isSelected = board.visibleServiceGroups?.includes(group.code);
                                        return (
                                            <div 
                                                key={group.code}
                                                onClick={() => {
                                                    const currentGroups = board.visibleServiceGroups || [];
                                                    const newGroups = isSelected
                                                        ? currentGroups.filter(c => c !== group.code)
                                                        : [...currentGroups, group.code];
                                                    updateDisplayBoard(board.code, { visibleServiceGroups: newGroups });
                                                }}
                                                className={`cursor-pointer p-3 rounded-lg border flex items-start gap-3 transition-all ${
                                                    isSelected 
                                                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                                                    : 'bg-gray-50 border-transparent hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800'
                                                }`}
                                            >
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                                                    isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-300'
                                                }`}>
                                                    {isSelected && <CheckCircle2 className="w-3 h-3" />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-gray-800 dark:text-white">{group.name}</div>
                                                    <div className="text-xs text-gray-500">{group.code}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {workflow.serviceGroups.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        No Queue Types defined in this profile yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {workflow.displayBoards.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400">No Display Boards Configured</h3>
                        <p className="text-gray-500 text-sm mb-4">Add a display board to show queue status to customers.</p>
                        <button onClick={addDisplayBoard} className="text-blue-600 font-bold hover:underline">Create First Board</button>
                    </div>
                )}
            </div>
        </div>
    );
  };

  const renderServicePoints = () => {
    if (!workflow) return null;
    
    // Helper to get all unique states from selected groups
    const getAvailableStates = (selectedGroupCodes: string[] | undefined) => {
        if (!selectedGroupCodes || selectedGroupCodes.length === 0) return [];
        const states = new Map<string, string>(); // code -> label
        
        selectedGroupCodes.forEach(groupCode => {
            const group = workflow.serviceGroups.find(g => g.code === groupCode);
            if (group) {
                Object.values(group.states).forEach(state => {
                    states.set(state.code, state.label);
                });
            }
        });
        return Array.from(states.entries()).map(([code, label]) => ({ code, label }));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Service Points Configuration</h2>
                        <p className="text-gray-500 text-sm">Manage counters, rooms, and stations where staff operate.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition flex items-center gap-2">
                        {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>
                    <button onClick={addServicePoint} className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Point
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {workflow.servicePoints.map(point => (
                    <div key={point.code} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Point Info */}
                            <div className="md:w-1/3 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Point Name</label>
                                    <input 
                                        type="text" 
                                        value={point.name}
                                        onChange={(e) => updateServicePoint(point.code, { name: e.target.value })}
                                        className="w-full text-lg font-bold bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none"
                                        placeholder="e.g. Counter 1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                                    <textarea 
                                        value={point.description || ''}
                                        onChange={(e) => updateServicePoint(point.code, { description: e.target.value })}
                                        rows={2}
                                        className="w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Point Code</label>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span className="font-mono text-sm text-gray-600 dark:text-gray-300">{point.code}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => deleteServicePoint(point.code)}
                                    className="text-red-500 text-xs font-bold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded w-fit"
                                >
                                    <Trash2 className="w-3 h-3" /> Remove Point
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="hidden md:block w-px bg-gray-200 dark:bg-gray-700"></div>

                            {/* Configuration */}
                            <div className="flex-1 space-y-6">
                                {/* Service Groups Selection */}
                                <div>
                                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                        <ClipboardList className="w-4 h-4 text-blue-500" /> Supported Queues
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {workflow.serviceGroups.map(group => {
                                            const isSelected = point.serviceGroups?.includes(group.code);
                                            return (
                                                <div 
                                                    key={group.code}
                                                    onClick={() => {
                                                        const currentGroups = point.serviceGroups || [];
                                                        const newGroups = isSelected
                                                            ? currentGroups.filter(c => c !== group.code)
                                                            : [...currentGroups, group.code];
                                                        updateServicePoint(point.code, { serviceGroups: newGroups });
                                                    }}
                                                    className={`cursor-pointer p-2 rounded-lg border flex items-center gap-2 transition-all ${
                                                        isSelected 
                                                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                                                        : 'bg-gray-50 border-transparent hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800'
                                                    }`}
                                                >
                                                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                                                        isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-300'
                                                    }`}>
                                                        {isSelected && <CheckCircle2 className="w-2.5 h-2.5" />}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{group.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Focus States Selection */}
                                <div>
                                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-green-500" /> Handled Stages (Focus)
                                    </h3>
                                    {(!point.serviceGroups || point.serviceGroups.length === 0) ? (
                                        <p className="text-sm text-gray-400 italic">Select queues above to see available stages.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {getAvailableStates(point.serviceGroups).map(state => {
                                                const isSelected = point.focusStates.includes(state.code);
                                                return (
                                                    <button
                                                        key={state.code}
                                                        onClick={() => {
                                                            const newStates = isSelected
                                                                ? point.focusStates.filter(c => c !== state.code)
                                                                : [...point.focusStates, state.code];
                                                            updateServicePoint(point.code, { focusStates: newStates });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                                            isSelected
                                                                ? 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300'
                                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                                                        }`}
                                                    >
                                                        {state.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {workflow.servicePoints.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400">No Service Points Configured</h3>
                        <p className="text-gray-500 text-sm mb-4">Add counters or rooms where staff will serve customers.</p>
                        <button onClick={addServicePoint} className="text-blue-600 font-bold hover:underline">Create First Point</button>
                    </div>
                )}
            </div>
        </div>
    );
  };

  const renderOverview = () => {
    if (!workflow) return null;
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-800 dark:text-white">{workflow.serviceGroups.length}</div>
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Queue Types</div>
                    </div>
                </div>

                <div 
                    className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => setActiveTab('points')}
                >
                     <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-800 dark:text-white">{workflow.servicePoints.length}</div>
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Service Points</div>
                    </div>
                </div>

                <div 
                    className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => setActiveTab('kiosks')}
                >
                     <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center">
                        <Monitor className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-800 dark:text-white">{workflow.kiosks?.length || 0}</div>
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Kiosks</div>
                    </div>
                </div>

                <div 
                    className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => setActiveTab('boards')}
                >
                     <div className="w-12 h-12 rounded-full bg-pink-50 dark:bg-pink-900/30 text-pink-600 flex items-center justify-center">
                        <Monitor className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-800 dark:text-white">{workflow.displayBoards?.length || 0}</div>
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Display Boards</div>
                    </div>
                </div>
            </div>

            {/* Queue Types Grid */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Queue Configuration</h2>
                    <button onClick={addNewGroup} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Create New Queue
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workflow.serviceGroups.map(group => (
                        <div 
                            key={group.code} 
                            onClick={() => { setSelectedGroupCode(group.code); setActiveTab('queue_detail'); setSelectedStateCode(group.initialState); }}
                            className="bg-white dark:bg-gray-800 rounded-xl p-0 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        group.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                                        group.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                        'bg-blue-50 text-blue-700'
                                    }`}>
                                        {group.priority || 'Standard'}
                                    </span>
                                    <span className="text-xs font-mono text-gray-400">{group.code}</span>
                                </div>
                                
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">{group.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[40px]">{group.description}</p>
                            </div>
                            
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 px-5 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    {Object.keys(group.states || {}).length} States
                                </div>
                                <span className="text-blue-600 text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                    Configure <ArrowRight className="w-3 h-3 ml-1" />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
  };

  const renderQueueDetail = () => {
    if (!workflow || !selectedGroupCode) return null;
    const groupIndex = workflow.serviceGroups.findIndex(g => g.code === selectedGroupCode);
    if (groupIndex === -1) return null;
    const group = workflow.serviceGroups[groupIndex];

    const updateGroup = (updates: Partial<IServiceGroup>) => {
        const newGroups = [...workflow.serviceGroups];
        newGroups[groupIndex] = { ...group, ...updates };
        setWorkflow({ ...workflow, serviceGroups: newGroups });
    };

    const updateState = (stateCode: string, updates: Partial<IStateDefinition>) => {
        const updatedStates = { ...group.states };
        updatedStates[stateCode] = { ...updatedStates[stateCode], ...updates };
        updateGroup({ states: updatedStates });
    };

    const addState = () => {
        const newCode = `STATE_${Object.keys(group.states).length + 1}`;
        const newState: IStateDefinition = {
            code: newCode,
            label: 'New State',
            type: 'NORMAL',
            color: '#9CA3AF',
            transitions: [],
            estDuration: 5
        };
        const updatedStates = { ...group.states, [newCode]: newState };
        updateGroup({ states: updatedStates });
        setSelectedStateCode(newCode);
    };

    const sortedStates = Object.values(group.states).sort((a, b) => {
        const typeOrder = { 'INITIAL': 0, 'NORMAL': 1, 'FINAL': 2 };
        return typeOrder[a.type] - typeOrder[b.type];
    });

    const selectedState = selectedStateCode ? group.states[selectedStateCode] : null;

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Detail Header */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{group.name}</h1>
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{group.code}</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                        <button 
                            onClick={() => setQueueDetailTab('workflow')}
                            className={`pb-1 border-b-2 font-bold transition-colors ${queueDetailTab === 'workflow' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Workflow Design
                        </button>
                        <button 
                            onClick={() => setQueueDetailTab('general')}
                            className={`pb-1 border-b-2 font-bold transition-colors ${queueDetailTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            General Settings
                        </button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition flex items-center gap-2">
                        {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-[500px]">
                {queueDetailTab === 'workflow' && (
                    <div className="flex h-full gap-6">
                        {/* Left: State List (Sidebar) */}
                        <div className="w-1/3 flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wider">Flow Steps</h3>
                                <button onClick={addState} className="text-blue-600 text-xs font-bold hover:bg-blue-50 px-2 py-1 rounded transition flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add Step
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {sortedStates.map((state, idx) => (
                                    <div 
                                        key={state.code}
                                        onClick={() => setSelectedStateCode(state.code)}
                                        className={`p-3 rounded-lg cursor-pointer border transition-all flex items-center gap-3 ${
                                            selectedStateCode === state.code 
                                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 ring-1 ring-blue-400' 
                                            : 'bg-white border-transparent hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center gap-1 min-w-[30px]">
                                            <div 
                                                className="w-3 h-3 rounded-full shadow-sm"
                                                style={{ backgroundColor: state.color || '#ccc' }}
                                            />
                                            {idx < sortedStates.length - 1 && <div className="w-0.5 h-4 bg-gray-200 dark:bg-gray-700"></div>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-sm font-bold ${selectedStateCode === state.code ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {state.label}
                                                </span>
                                                <StatusBadge type={state.type} />
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-mono">{state.code} • {state.estDuration}m</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: State Editor (Main) */}
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
                            {selectedState ? (
                                <div className="animate-fade-in">
                                    <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Step Name</label>
                                            <input 
                                                type="text" 
                                                value={selectedState.label}
                                                onChange={(e) => updateState(selectedState.code, { label: e.target.value })}
                                                className="text-xl font-bold text-gray-800 dark:text-white bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none w-full"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <input 
                                                type="color" 
                                                value={selectedState.color || '#000000'}
                                                onChange={(e) => updateState(selectedState.code, { color: e.target.value })}
                                                className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                                            />
                                            <button 
                                                onClick={() => {
                                                    if(Object.keys(group.states).length <= 1) return alert("Cannot delete the only state.");
                                                    if(window.confirm("Delete this state?")) {
                                                        const newStates = { ...group.states };
                                                        delete newStates[selectedState.code];
                                                        updateGroup({ states: newStates });
                                                        setSelectedStateCode(Object.keys(newStates)[0]);
                                                    }
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-8">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Step Type</label>
                                            <select 
                                                value={selectedState.type}
                                                onChange={(e) => updateState(selectedState.code, { type: e.target.value as any })}
                                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-white"
                                            >
                                                <option value="INITIAL">INITIAL (Start Point)</option>
                                                <option value="NORMAL">NORMAL (Process Step)</option>
                                                <option value="FINAL">FINAL (End Point)</option>
                                            </select>
                                            <p className="text-[10px] text-gray-400 mt-1">Determines how the system treats this step.</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Est. Duration (Minutes)</label>
                                            <div className="relative">
                                                <Clock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                                <input 
                                                    type="number" 
                                                    value={selectedState.estDuration || 0}
                                                    onChange={(e) => updateState(selectedState.code, { estDuration: parseInt(e.target.value) })}
                                                    className="w-full p-2.5 pl-9 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono text-gray-800 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm">Transitions (Next Steps)</h4>
                                            <button 
                                                onClick={() => {
                                                    const newTrans: ITransition = { action: 'Next', to: selectedState.code };
                                                    updateState(selectedState.code, { transitions: [...selectedState.transitions, newTrans] });
                                                }}
                                                className="text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" /> Add Transition
                                            </button>
                                        </div>
                                        
                                        {selectedState.transitions.length === 0 ? (
                                            <div className="text-center py-6 text-gray-400 text-xs italic">
                                                No transitions defined. This state is a dead-end.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {selectedState.transitions.map((trans, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] text-gray-400 font-bold">Action Button Label</label>
                                                            <input 
                                                                type="text"
                                                                value={trans.action}
                                                                onChange={(e) => {
                                                                    const newTrans = [...selectedState.transitions];
                                                                    newTrans[idx].action = e.target.value;
                                                                    updateState(selectedState.code, { transitions: newTrans });
                                                                }}
                                                                className="w-full text-sm font-bold bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none"
                                                            />
                                                        </div>
                                                        <div className="text-gray-400"><ArrowRight className="w-4 h-4" /></div>
                                                        <div className="flex-1">
                                                            <label className="text-[10px] text-gray-400 font-bold">Target State</label>
                                                            <select
                                                                value={trans.to}
                                                                onChange={(e) => {
                                                                    const newTrans = [...selectedState.transitions];
                                                                    newTrans[idx].to = e.target.value;
                                                                    updateState(selectedState.code, { transitions: newTrans });
                                                                }}
                                                                className="w-full text-sm bg-transparent border-b border-gray-200 focus:border-blue-500 outline-none py-1"
                                                            >
                                                                {Object.values(group.states).map(s => (
                                                                    <option key={s.code} value={s.code}>{s.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <button 
                                                            onClick={() => {
                                                                const newTrans = selectedState.transitions.filter((_, i) => i !== idx);
                                                                updateState(selectedState.code, { transitions: newTrans });
                                                            }}
                                                            className="text-red-400 hover:text-red-600 px-2"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 flex-col gap-3">
                                    <div className="text-4xl">👈</div>
                                    <p>Select a state from the list to edit</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {queueDetailTab === 'general' && (
                    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Queue Name</label>
                                <input 
                                    type="text" 
                                    value={group.name}
                                    onChange={(e) => updateGroup({ name: e.target.value })}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                <textarea 
                                    value={group.description || ''}
                                    onChange={(e) => updateGroup({ description: e.target.value })}
                                    rows={3}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Queue Code (ID)</label>
                                    <input 
                                        type="text" 
                                        value={group.code}
                                        readOnly
                                        className="w-full p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-gray-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                                    <select 
                                        value={group.priority}
                                        onChange={(e) => updateGroup({ priority: e.target.value as any })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                                    >
                                        <option value="Standard">Standard</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
  };

  // --- Main Layout ---

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            Q
          </div>
          <span className="font-bold text-lg tracking-tight">AdaQueue <span className="text-gray-400 font-normal text-sm">| Workflow Designer</span></span>
        </div>

        <div className="flex items-center gap-4">
           {/* Profile Selector */}
           <div className="relative">
                <button 
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-blue-600 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <Building2 className="w-4 h-4 text-blue-500" />
                    {profiles.find(p => p.code === selectedProfileId)?.name}
                    <span className="text-xs text-gray-400">▼</span>
                </button>
                
                {isProfileDropdownOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsProfileDropdownOpen(false)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 animate-fade-in">
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Switch Profile</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {profiles.map(profile => (
                                    <div
                                        key={profile.code}
                                        onClick={() => {
                                            setSelectedProfileId(profile.code);
                                            setIsProfileDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between cursor-pointer group ${
                                            selectedProfileId === profile.code ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            {selectedProfileId === profile.code ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> : <div className="w-3"></div>}
                                            <div className="truncate">
                                                <div>{profile.name}</div>
                                                {profile.agnCode && <div className="text-[10px] text-gray-400">{profile.agnCode}</div>}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => handleEditProfile(profile, e)}
                                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                title="Edit Profile"
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDeleteProfile(profile.code, profile.name, e)}
                                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                title="Delete Profile"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                                <button
                                    onClick={handleAddProfile}
                                    className="w-full text-left px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Create New Profile
                                </button>
                            </div>
                        </div>
                    </>
                )}
           </div>
           
           <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

           <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500"></span>
               <span className="text-xs font-bold text-gray-500">Online</span>
           </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="p-6 max-w-7xl mx-auto">
        {successMsg && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-4 rounded-lg flex items-center gap-2 border border-green-200 dark:border-green-800 animate-fade-in shadow-sm">
                <CheckCircle2 className="w-5 h-5" /> {successMsg}
            </div>
        )}
        
        {loading ? (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        ) : (
            <>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'queue_detail' && renderQueueDetail()}
                {activeTab === 'kiosks' && renderKiosks()}
                {activeTab === 'points' && renderServicePoints()}
                {activeTab === 'boards' && renderDisplayBoards()}
            </>
        )}
      </main>

      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>

      {/* Create/Edit Profile Modal */}
      {isCreateProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" /> {modalMode === 'create' ? 'Create New Profile' : 'Edit Profile'}
                    </h3>
                    <button 
                        onClick={() => setIsCreateProfileModalOpen(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <Trash2 className="w-5 h-5 rotate-45" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Profile Name <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            placeholder="e.g. Branch Sukhumvit"
                            value={newProfileData.name}
                            onChange={(e) => setNewProfileData({...newProfileData, name: e.target.value})}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Agency Code (Optional)</label>
                        <input 
                            type="text" 
                            placeholder="e.g. CPN01"
                            value={newProfileData.agnCode}
                            maxLength={20}
                            onChange={(e) => setNewProfileData({...newProfileData, agnCode: e.target.value})}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">For multi-tenant or branch filtering.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
                        <textarea 
                            placeholder="Short description about this location or configuration..."
                            value={newProfileData.description}
                            onChange={(e) => setNewProfileData({...newProfileData, description: e.target.value})}
                            rows={3}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button 
                        onClick={() => setIsCreateProfileModalOpen(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg font-bold text-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleProfileSubmit}
                        disabled={!newProfileData.name.trim()}
                        className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md flex items-center gap-2 transition-all ${!newProfileData.name.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 hover:shadow-lg'}`}
                    >
                        <Save className="w-4 h-4" /> {modalMode === 'create' ? 'Create Profile' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default OWorkflowDesigner;
