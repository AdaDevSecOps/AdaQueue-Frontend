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
        bchCode: '00002',
        preFix: 'W',
        customerType: '00001',
      };
      const res = await fetch(apiPath('/api/queue/gen'), {
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
  
  const handleBackClick = () => {
    try {
      onBack();
      localStorage.removeItem('adaqueue_kiosk_code');
    } catch {
      if (window.history.length > 1) window.history.back();
    }
  };

  // Format phone number with dashes
  const formattedPhone = phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 - $2 - $3');
  const displayPhone = formattedPhone || phone;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      
      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center border-b border-gray-800 relative">
        <div className="flex items-center gap-3">
          <button onClick={handleBackClick} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
            <span className="text-xl">←</span>
          </button>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">A</div>
          <span className="font-bold text-xl tracking-wide">AdaQueue</span>
        </div>
        
        {/* Position A: Centered Shop Name / Kiosk Title */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold text-white tracking-wide">
            {headerTitle}
        </div>

        {/* <div className="text-gray-400 text-sm font-medium">
          Session ends in 54s <button className="ml-4 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"><span className="text-xl">⚙️</span></button>
        </div> */}
      </header>

      {/* Main Content */}
      <div className="flex-1 px-8 py-6 pb-8 flex flex-col lg:flex-row gap-8 lg:gap-16 max-w-7xl mx-auto w-full">
        
        {/* Left Column: Input */}
        <div className="flex-1 flex flex-col">
          <h1 className="text-4xl font-bold mb-8">Just a few more details...</h1>
          
          <div className="mb-8">
            <label className="flex items-center gap-2 text-gray-400 text-lg font-bold mb-3">
              <span>📱</span> Phone Number
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

        {/* Right Column: Action */}
        <div className="w-full lg:w-[450px] flex flex-col">
      
          <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2">{categoryName}</h3>
            <p className="text-gray-400 text-sm mb-6">
              {currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} | {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="bg-gray-900/50 rounded-xl p-4 flex items-center justify-between border border-gray-700">
              <span className="text-sm font-bold text-gray-400 uppercase">Guests</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setPax(Math.max(1, pax - 1))} className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold">-</button>
                <span className="text-xl font-bold text-white w-6 text-center">{pax}</span>
                <button onClick={() => setPax(Math.min(20, pax + 1))} className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/20">+</button>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-8 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-xl font-bold py-6 rounded-2xl shadow-xl shadow-blue-900/30 transform transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
          >
             {loading ? 'Processing...' : (
               <>
                 <span className="text-2xl">✅</span> Confirm Ticket
               </>
             )}
          </button>

          {/* Back Link */}
          <button 
            onClick={handleBackClick}
            className="mt-6 text-gray-500 hover:text-white font-medium transition-colors text-center"
          >
            ย้อนกลับ
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
