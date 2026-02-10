import React, { useEffect, useState } from 'react';
import { 
  Utensils, 
  ShoppingBag, 
  Truck, 
  Coffee, 
  Stethoscope, 
  Pill, 
  FileText, 
  Briefcase,
  Monitor,
  AlertTriangle,
  Server,
  ArrowRight
} from 'lucide-react';
import { apiPath } from '../../config/api';


// --- Interfaces from Workflow Designer ---
interface IProfileOption {
  code: string;
  name: string;
  agnCode?: string;
  description?: string;
}
  
interface IServiceGroup {
  code: string;
  name: string;
  description?: string;
  priority?: 'Urgent' | 'High' | 'Standard' | 'Low';
}

interface IKioskDefinition {
  code: string;
  name: string;
  title?: string;
  visibleServiceGroups: string[];
}

interface IWorkflowDefinition {
  profileId: string;
  profileName?: string;
  serviceGroups: IServiceGroup[];
  kiosks: IKioskDefinition[];
}

interface ICategory {
  id: string;
  label: string;
  icon: React.ReactNode; 
  description: string;
}

interface IWelcomeProps {
  onSelectCategory: (categoryId: string) => void;
}

/**
 * OWelcome
 * Kiosk Welcome Screen & Category Selection
 * 
 * Dynamic Version: Loads configuration from LocalStorage based on Active Profile
 */
const OWelcome: React.FC<IWelcomeProps> = ({ onSelectCategory }) => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [profileName, setProfileName] = useState<string>('AdaQueue');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Startup Flow State
  const [startupStep, setStartupStep] = useState<'init' | 'select_profile' | 'select_kiosk' | 'ready'>('init');
  const [availableProfiles, setAvailableProfiles] = useState<IProfileOption[]>([]);
  const [availableKiosks, setAvailableKiosks] = useState<IKioskDefinition[]>([]);
  const [selectedProfileCode, setSelectedProfileCode] = useState<string | null>(null);
  const [selectedKioskCode, setSelectedKioskCode] = useState<string | null>(null);

  // Helper to generate icon based on name/context (Simple heuristic)
  const getIconForService = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('coffee') || lower.includes('กาแฟ') || lower.includes('drink')) return <Coffee className="w-24 h-24" />;
    if (lower.includes('food') || lower.includes('อาหาร') || lower.includes('rice') || lower.includes('ข้าว')) return <Utensils className="w-24 h-24" />;
    if (lower.includes('take') || lower.includes('away') || lower.includes('กลับบ้าน')) return <ShoppingBag className="w-24 h-24" />;
    if (lower.includes('delivery') || lower.includes('ส่ง')) return <Truck className="w-24 h-24" />;
    if (lower.includes('doctor') || lower.includes('แพทย์') || lower.includes('exam')) return <Stethoscope className="w-24 h-24" />;
    if (lower.includes('drug') || lower.includes('pharmacy') || lower.includes('ยา')) return <Pill className="w-24 h-24" />;
    if (lower.includes('document') || lower.includes('เอกสาร')) return <FileText className="w-24 h-24" />;
    return <Briefcase className="w-24 h-24" />; // Default
  };

  // --- Startup Logic ---

  // 1. Fetch Profiles
  const loadProfiles = async (): Promise<IProfileOption[]> => {
    let loaded: IProfileOption[] = [];
    try {
        const res = await fetch(apiPath('/api/profile'));
        if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await res.json();
                loaded = data.map((p: any) => ({
                    code: p.code,
                    name: p.name,
                    agnCode: p.agnCode,
                    description: p.name
                }));
                setAvailableProfiles(loaded);
            } else {
                console.error("Received non-JSON response from /api/profile");
                setError("Backend connection failed. Please restart the frontend server.");
            }
        } else {
             setError(`Failed to load profiles: ${res.status}`);
        }
    } catch (e) {
        console.warn('Backend fetch failed', e);
        setError("Network error connecting to backend.");
    }
    return loaded;
  };

  // 2. Check Kiosk Step
  const checkKioskStep = async (profileCode: string | null) => {
      if (!profileCode) {
          setStartupStep('ready'); 
          return;
      }

      try {
        let workflow: IWorkflowDefinition | null = null;
        try {
              const res = await fetch(apiPath(`/api/workflow-designer/${profileCode}`));
              if (res.ok) {
                  workflow = await res.json();
                  // Save workflow to localStorage for other pages (Issue Ticket)
                  try {
                    localStorage.setItem(`adaqueue_workflow_${profileCode}`, JSON.stringify(workflow));
                  } catch (e) { console.error("Failed to save workflow to storage", e); }
              }
         } catch (apiErr) {
             console.warn("API Workflow fetch failed", apiErr);
             setError("Failed to load workflow configuration.");
         }

        if (!workflow) {
             setStartupStep('ready');
             setLoading(false);
             return;
        }

        const kiosks = workflow.kiosks || [];
        setAvailableKiosks(kiosks);

        // CHECK CUSTOMER SESSION (Strict Mode: No LocalStorage Auto-Login for Admin Setup)
        const isCustomerSession = sessionStorage.getItem('adaqueue_customer_mode') === 'true';

        if (isCustomerSession) {
            // We are in customer loop, try to restore
            const savedKioskCode = localStorage.getItem('adaqueue_kiosk_code');
            const foundKiosk = savedKioskCode ? kiosks.find(k => k.code === savedKioskCode) : null;

            if (foundKiosk) {
                // Auto-select saved kiosk
                setSelectedKioskCode(foundKiosk.code);
                setStartupStep('ready');
                setLoading(false);
                return;
            }
        }
        
        // If not in customer session OR restore failed, force selection
        setStartupStep('select_kiosk');
        setLoading(false);

      } catch (e) {
          console.error("Kiosk Check Error", e);
          setStartupStep('ready');
          setLoading(false);
      }
  };

  const handleProfileSelect = (profileCode: string) => {
      setSelectedProfileCode(profileCode);
      try { localStorage.setItem('adaqueue_selected_profile', profileCode); } catch {}
      setLoading(true);
      checkKioskStep(profileCode);
  };

  // 3. Initial Effect
  useEffect(() => {
    const initStartup = async () => {
        setLoading(true);
        try {
            const profiles = await loadProfiles();
            
            // CHECK CUSTOMER SESSION
            const isCustomerSession = sessionStorage.getItem('adaqueue_customer_mode') === 'true';

            if (isCustomerSession) {
                // Reuse previously selected profile if available and valid
                const saved = localStorage.getItem('adaqueue_selected_profile');
                const found = saved ? profiles.find(p => p.code === saved) : null;
                if (found) {
                    handleProfileSelect(found.code);
                    return;
                }
            }

            // Strict Mode: Always force selection on entry (Admin Setup)
            if (profiles.length > 0) {
                setStartupStep('select_profile');
                setLoading(false);
            } else {
                // No profiles found
                setLoading(false);
            }
        } catch (e) {
            console.error("Startup Init Error", e);
            setError("Failed to initialize kiosk configuration.");
            setLoading(false);
        }
    };

    initStartup();
  }, []);

  const handleKioskSelect = (kioskCode: string) => {
      setLoading(true);
      setSelectedKioskCode(kioskCode);
      try { 
          localStorage.setItem('adaqueue_kiosk_code', kioskCode); 
          // Set Customer Mode Flag
          sessionStorage.setItem('adaqueue_customer_mode', 'true');
      } catch {}
      setTimeout(() => {
          setStartupStep('ready');
      }, 500);
  };


  // 3. Load Data for Ready State
  useEffect(() => {
    if (startupStep !== 'ready') return;

    const loadConfiguration = async () => {
      try {
        setLoading(true);
        
        // 1. Get Active Profile ID
        if (!selectedProfileCode) {
          throw new Error('No active profile selected. Please configure in Admin.');
        }

        // 2. Get Workflow for this profile
        let workflow: IWorkflowDefinition | null = null;
        try {
              const res = await fetch(apiPath(`/api/workflow-designer/${selectedProfileCode}`));
              if (res.ok) {
                  workflow = await res.json();
              }
         } catch (apiErr) { console.warn(apiErr); }

        if (!workflow) {
            throw new Error('Invalid workflow configuration.');
        }

        setProfileName(workflow.profileName || 'AdaQueue');

        // 3. Determine Kiosk Context
        let visibleGroups = workflow.serviceGroups;

        if (selectedKioskCode) {
            const kioskConfig = workflow.kiosks?.find(k => k.code === selectedKioskCode);
            if (kioskConfig) {
                // Override profile name with kiosk title if available
                if (kioskConfig.title) {
                    setProfileName(kioskConfig.title);
                }
                // Filter groups based on kiosk config
                visibleGroups = workflow.serviceGroups.filter(g => 
                    kioskConfig.visibleServiceGroups.includes(g.code)
                );
            }
        } else if (workflow.kiosks && workflow.kiosks.length > 0) {
             // Fallback if needed
        }

        // 4. Map to Categories
        const mappedCategories: ICategory[] = visibleGroups.map(group => ({
            id: group.code,
            label: group.name,
            icon: getIconForService(group.name),
            description: group.description || 'Touch to start'
        }));

        setCategories(mappedCategories);
        setLoading(false);

      } catch (err: any) {
        console.error('Failed to load kiosk config:', err);
        setError(err.message);
        setLoading(false);
        
        // Fallback to default static data if everything fails (for safety)
        setCategories([
            { id: 'ERROR', label: 'Configuration Error', icon: <AlertTriangle className="w-24 h-24" />, description: 'Please contact admin' }
        ]);
      }
    };

    if (startupStep === 'ready') {
        loadConfiguration();
    }
  }, [startupStep, selectedProfileCode, selectedKioskCode]);

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

  // --- Render Selection Screens ---
  if (startupStep === 'select_profile') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-5xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        Select Environment
                    </h1>
                    <p className="text-gray-400 text-lg">Choose the profile for this Kiosk</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availableProfiles.map((profile) => (
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
        </div>
      );
  }

  if (startupStep === 'select_kiosk') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-5xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                        Select Kiosk Point
                    </h1>
                    <p className="text-gray-400 text-lg">Identify this kiosk unit</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availableKiosks.map((kiosk) => (
                        <button
                            key={kiosk.code}
                            onClick={() => handleKioskSelect(kiosk.code)}
                            className="group bg-gray-800 hover:bg-gray-750 border-2 border-gray-700 hover:border-green-500 rounded-2xl p-8 transition-all duration-300 text-left relative overflow-hidden shadow-xl"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center text-gray-400 group-hover:text-green-400 group-hover:bg-green-600/20 transition-colors">
                                    <Monitor className="w-6 h-6" />
                                </div>
                                <ArrowRight className="w-6 h-6 text-gray-600 group-hover:text-green-500 transition-all transform group-hover:translate-x-1" />
                            </div>
                            
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">{kiosk.title || kiosk.name}</h3>
                                <p className="text-sm text-gray-500 font-mono uppercase tracking-wide">CODE: {kiosk.code}</p>
                            </div>
                        </button>
                    ))}
                </div>
                
                <div className="text-center mt-12">
                     <button 
                        onClick={() => setStartupStep('select_profile')}
                        className="text-gray-500 hover:text-white underline text-sm tracking-wider"
                    >
                        ← Back to Environment Selection
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-600 text-white p-8 relative overflow-hidden">
      
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 opacity-10 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>

      {/* Header / Branding */}
      <div className="mb-16 text-center z-10">
        <div className="inline-block px-4 py-1 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium mb-4 tracking-wider uppercase">
          Queue Management System
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight mb-4 drop-shadow-lg">
          {profileName}
        </h1>
        <p className="text-2xl text-blue-100 font-light">
          Welcome! Please select a service to begin.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-100 max-w-md text-center backdrop-blur-sm">
            <p className="font-bold">System Notice</p>
            <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Category Grid */}
      <div className="flex flex-wrap justify-center gap-8 w-full max-w-6xl z-10 px-4">
        {loading ? (
             <div className="w-full flex justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
             </div>
        ) : categories.length === 0 ? (
            <div className="w-full text-center py-20 bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10">
                <p className="text-2xl text-white/50">No services currently available.</p>
                <p className="text-white/30 mt-2">Please check kiosk configuration.</p>
            </div>
        ) : (
            categories.map((cat) => (
            <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="group relative flex flex-col items-center justify-center p-12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-xl hover:bg-white/20 hover:scale-105 hover:shadow-2xl transition-all duration-300 ease-out min-w-[300px]"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-300"></div>
                
                <span className="mb-8 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-md text-white">
                {cat.icon}
                </span>
                <span className="text-4xl font-bold tracking-wide mb-2">
                {cat.label}
                </span>
                <span className="text-lg text-blue-100 opacity-80">
                {cat.description}
                </span>
            </button>
            ))
        )}
      </div>

      {/* Footer / Language */}
      <div className="mt-20 flex gap-6 z-10">
        <button className="px-8 py-3 rounded-full bg-white text-blue-900 font-bold shadow-lg hover:bg-blue-50 transition transform hover:-translate-y-1">
          🇬🇧 English
        </button>
        <button className="px-8 py-3 rounded-full bg-white/10 border border-white/30 backdrop-blur-md text-white font-medium hover:bg-white/20 transition">
          🇹🇭 ภาษาไทย
        </button>
      </div>
      
      {/* Admin Switch Profile Button - Hidden for Production Kiosk Mode
      <button 
        onClick={() => {
            localStorage.removeItem('adaqueue_selected_profile');
            localStorage.removeItem('adaqueue_kiosk_code');
            window.location.reload();
        }}
        className="absolute top-4 right-4 px-4 py-2 bg-black/20 hover:bg-black/40 text-white/50 hover:text-white rounded-lg text-sm transition-colors z-20 backdrop-blur-md"
      >
        Switch Profile
      </button>
      */}

      <div className="absolute bottom-4 text-white/30 text-xs">
        Powered by AdaSoft
      </div>
    </div>
  );
};

export default OWelcome;
