import React, { useState, useEffect } from 'react';
import { apiPath } from '../../config/api';

// --- Interfaces for Config Loading ---
interface IServiceGroup {
  code: string;
  name: string;
}
interface IKioskDefinition {
  code: string;
  title?: string;
  name: string;
}
interface IWorkflowDefinition {
  profileName?: string;
  serviceGroups: IServiceGroup[];
  kiosks?: IKioskDefinition[];
}

interface IIssueTicketProps {
  category: string;
  onConfirm: (data: any) => void;
  onBack: () => void;
}

/**
 * OIssueTicket
 * Ticket Details Input & Confirmation
 * 
 * Redesigned to match "Universal Queue" dark theme mockup
 */
export const OIssueTicket: React.FC<IIssueTicketProps> = ({ category, onConfirm, onBack }) => {
  const [pax, setPax] = useState(1);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [previewQueueNo, setPreviewQueueNo] = useState<string>('—');

  // Config State
  const [headerTitle, setHeaderTitle] = useState('AdaQueue');
  const [categoryName, setCategoryName] = useState(category);

  // Load Configuration
  useEffect(() => {
    try {
        const activeProfileId = localStorage.getItem('adaqueue_selected_profile');
        if (activeProfileId) {
            const workflowJson = localStorage.getItem(`adaqueue_workflow_${activeProfileId}`);
            if (workflowJson) {
                const workflow: IWorkflowDefinition = JSON.parse(workflowJson);
                
                // 1. Resolve Header Title (Kiosk Title > Profile Name > AdaQueue)
                let title = workflow.profileName || 'AdaQueue';
                const storedKioskCode = localStorage.getItem('adaqueue_kiosk_code');
                
                // Try to find specific kiosk config
                let kioskConfig: IKioskDefinition | undefined;
                if (storedKioskCode) {
                    kioskConfig = workflow.kiosks?.find(k => k.code === storedKioskCode);
                } else if (workflow.kiosks && workflow.kiosks.length > 0) {
                    // Fallback demo mode
                    kioskConfig = workflow.kiosks[0];
                }

                if (kioskConfig && kioskConfig.title) {
                    title = kioskConfig.title;
                }
                setHeaderTitle(title);

                // 2. Resolve Category Name (Service Group Name)
                const group = workflow.serviceGroups.find(g => g.code === category);
                if (group) {
                    setCategoryName(group.name);
                } else {
                    // Fallback for demo ID mapping if using "RESTAURANT" etc but config has "Q-OPD-01"
                    // If category is a code not found, try to map readable if possible or keep as is
                    // For now, assume category passed IS the code.
                    // If the passed category is 'RESTAURANT' (from hardcoded demo), we might want to map it?
                    // Let's just leave it as is if not found, or replace underscores.
                    setCategoryName(category.replace('_', ' ')); 
                }
            }
        }
    } catch (e) {
        console.error("Failed to load config for ticket screen", e);
    }
  }, [category]);

  // Update time for the ticket preview
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchNext = async () => {
      try {
        const profileId = localStorage.getItem('adaqueue_selected_profile') || '';
        const kioskCode = localStorage.getItem('adaqueue_kiosk_code') || 'KIOSK';
        const agnCode = localStorage.getItem('adaqueue_agn_code') || 'AGN';
        if (!profileId || !category) return;
        const qs = new URLSearchParams({
          agnCode,
          profileCode: profileId,
          displayCode: kioskCode,
          name: category
        }).toString();
        const res = await fetch(apiPath(`/api/queue-sequence/preview?${qs}`));
        if (res.ok) {
          const data = await res.json();
          // Use category from props for the prefix to keep it clean and consistent
          const num = String(data?.number ?? 1).padStart(3,'0');
          setPreviewQueueNo(`${category}-${num}`);
        } else {
          // Fallback label กรณี backend preview ล้มเหลว
          setPreviewQueueNo(`${category}-001`);
        }
      } catch {
        // Fallback label เมื่อเกิด error network
        setPreviewQueueNo(`${category}-001`);
      }
    };
    fetchNext();
  }, [category]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const profileId = localStorage.getItem('adaqueue_selected_profile') || undefined;
      const kioskCode = localStorage.getItem('adaqueue_kiosk_code') || 'KIOSK';
      const agnCode = localStorage.getItem('adaqueue_agn_code') || 'AGN';
      const payload = {
        customerName: phone ? `Phone:${phone}` : 'Walk-in',
        tel: phone || '',
        industry: 'BANK',
        agnCode,
        profileId,
        attributes: { pax, category, serviceGroup: category, queueType: category, kioskCode },
      };
      const res = await fetch(apiPath('/api/queue'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        alert('Failed to create ticket');
        onConfirm({ category, pax, phone, error: true });
      } else {
        const data = await res.json();
        try { localStorage.setItem('adaqueue_last_queue_docno', data?.docNo || ''); } catch {}
        onConfirm({ category, pax, phone, queue: data });
      }
    } catch (e) {
      onConfirm({ category, pax, phone, error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleNumpad = (num: string) => {
    if (phone.length < 10) {
      setPhone(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPhone(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPhone('');
  };

  // Format phone number with dashes
  const formattedPhone = phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 - $2 - $3');
  const displayPhone = formattedPhone || phone;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      
      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center border-b border-gray-800 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">A</div>
          <span className="font-bold text-xl tracking-wide">AdaQueue</span>
        </div>
        
        {/* Position A: Centered Shop Name / Kiosk Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold text-white tracking-wide">
            {headerTitle}
        </div>

        <div className="text-gray-400 text-sm font-medium">
          Session ends in 54s <button className="ml-4 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"><span className="text-xl">⚙️</span></button>
        </div>
      </header>

      {/* Progress Bar */}
      {/* <div className="px-8 py-8">
        <div className="flex justify-between text-sm font-medium text-gray-400 mb-2">
          <span>Step 2 of 3: Enter Details</span>
          <span>66%</span>
        </div>
        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
          <div className="bg-blue-500 h-full w-2/3 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="flex-1 px-8 py-6 pb-8 flex flex-col lg:flex-row gap-8 lg:gap-16 max-w-7xl mx-auto w-full">
        
        {/* Left Column: Input */}
        <div className="flex-1 flex flex-col">
          <h1 className="text-4xl font-bold mb-8">Just a few more details...</h1>
          
          <div className="mb-8">
            <label className="flex items-center gap-2 text-gray-400 text-lg font-bold mb-3">
              <span>📱</span> Phone Number (for SMS updates)
            </label>
            <div className="bg-gray-800/50 border border-blue-500/30 rounded-lg p-6 h-20 flex items-center shadow-inner">
               <span className="text-3xl font-mono tracking-widest text-white">
                 {displayPhone}
                 <span className="animate-pulse text-blue-500">|</span>
               </span>
            </div>
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleNumpad(num.toString())}
                className="h-20 bg-gray-800 border border-gray-700 rounded-xl text-3xl font-bold text-white hover:bg-gray-700 hover:border-gray-600 active:scale-95 transition-all shadow-lg"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="h-20 bg-gray-800/50 border border-red-900/30 text-red-400 rounded-xl text-xl font-bold hover:bg-red-900/20 hover:border-red-900/50 active:scale-95 transition-all shadow-lg"
            >
              Clear
            </button>
            <button
              onClick={() => handleNumpad('0')}
              className="h-20 bg-gray-800 border border-gray-700 rounded-xl text-3xl font-bold text-white hover:bg-gray-700 hover:border-gray-600 active:scale-95 transition-all shadow-lg"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="h-20 bg-gray-800/50 border border-gray-700 rounded-xl flex items-center justify-center hover:bg-gray-700 active:scale-95 transition-all shadow-lg"
            >
              <span className="text-2xl">⌫</span>
            </button>
          </div>
        </div>

        {/* Right Column: Preview & Action */}
        <div className="w-full lg:w-[450px] flex flex-col">
          
          {/* Action Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mb-8 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-xl font-bold py-6 rounded-2xl shadow-xl shadow-blue-900/30 transform transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
          >
             {loading ? 'Processing...' : (
               <>
                 <span className="text-2xl">✅</span> Confirm Ticket
               </>
             )}
          </button>

          {/* Ticket Preview Card */}
          <div className="bg-gray-800 rounded-3xl p-1 border border-gray-700 shadow-2xl relative overflow-hidden">
             {/* Card Content */}
             <div className="bg-gray-800 rounded-[20px] p-8 text-center border border-gray-700/50 relative z-10">
                <div className="uppercase text-xs font-bold text-gray-500 tracking-[0.2em] mb-2">Your Ticket Preview</div>
                <div className="w-full border-t border-dashed border-gray-700 mb-8 opacity-50"></div>
                
                <div className="text-7xl font-bold text-blue-400 mb-2 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]">{previewQueueNo}</div>
                
                <h3 className="text-2xl font-bold text-white mb-2">{categoryName}</h3>
                <p className="text-gray-400 text-sm mb-8">
                  {currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} | {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>

                {/* QR Code Placeholder */}
                <div className="w-32 h-32 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center p-2">
                  <div className="w-full h-full border-4 border-black border-dashed opacity-20"></div>
                </div>
                <p className="text-xs text-gray-500 mb-6">Scan on your phone to track status</p>

                {/* Guest Counter (Integrated) */}
                <div className="bg-gray-900/50 rounded-xl p-4 mb-2 flex items-center justify-between border border-gray-700">
                   <span className="text-sm font-bold text-gray-400 uppercase">Guests</span>
                   <div className="flex items-center gap-4">
                      <button onClick={() => setPax(Math.max(1, pax - 1))} className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold">-</button>
                      <span className="text-xl font-bold text-white w-6 text-center">{pax}</span>
                      <button onClick={() => setPax(Math.min(20, pax + 1))} className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/20">+</button>
                   </div>
                </div>
             </div>
             
             {/* Decorative Elements */}
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          </div>

          {/* Back Link */}
          <button 
            onClick={onBack}
            className="mt-6 text-gray-500 hover:text-white font-medium transition-colors text-center"
          >
            Go Back
          </button>

          {/* Info Box */}
          <div className="mt-auto pt-8">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex gap-4 items-start">
              <div className="w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center text-xs font-bold mt-0.5">i</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Tickets are dispensed from the slot below the screen. Please take your ticket and wait for your number to be called.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OIssueTicket;
