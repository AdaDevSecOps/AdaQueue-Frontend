import React, { useEffect, useState } from 'react';

const OMobileTracking: React.FC = () => {
    const [data, setData] = useState<{ q: string; t: number; e: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('data');

        if (!token) {
            setError('ไม่มีรหัสคิวระบุมาในลิงก์');
            return;
        }

        try {
            const decoded = atob(token);
            const ticketData = JSON.parse(decoded);

            if (!ticketData.q || !ticketData.t || !ticketData.e) {
                throw new Error('ข้อมูลคิวไม่ถูกต้อง');
            }

            setData(ticketData);

            // Check expiration
            const checkExpiry = () => {
                const now = new Date().getTime();
                if (now >= ticketData.e) {
                    setIsExpired(true);
                }
            };

            checkExpiry();
            const interval = setInterval(checkExpiry, 1000);
            return () => clearInterval(interval);
        } catch (err) {
            setError('รหัสคิวไม่ถูกต้อง หรือถูกดัดแปลง');
        }
    }, []);

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-center">
                <div className="bg-gray-800 p-8 rounded-3xl w-full max-w-sm border border-red-500/30">
                    <div className="w-16 h-16 bg-red-500/20 text-red-500 flex items-center justify-center rounded-full mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">ข้อผิดพลาด</h2>
                    <p className="text-gray-400 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (isExpired) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6 text-center">
                <div className="bg-gray-800 p-8 rounded-3xl w-full max-w-sm border border-gray-700 opacity-80">
                    <div className="w-16 h-16 bg-gray-700 text-gray-400 flex items-center justify-center rounded-full mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">ลิงก์คิวหมดอายุแล้ว</h2>
                    <p className="text-gray-400 text-sm">คิวนี้เกินกำหนดระยะเวลา 3 ชั่วโมงแล้ว โปรดรับคิวใหม่หากคุณยังต้องการรับบริการ</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="text-gray-400 animate-pulse">กำลังโหลดข้อมูล...</div>
            </div>
        );
    }

    const receiveDate = new Date(data.t);
    const expireDate = new Date(data.e);

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10 px-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-2xl mb-8">A</div>

            <div className="bg-gray-800 rounded-3xl p-8 w-full max-w-sm border border-gray-700 shadow-2xl text-center relative overflow-hidden">
                {/* Animated background effect to show it's active */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-50 pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="uppercase text-xs font-bold text-gray-500 tracking-[0.2em] mb-4">Your Ticket</div>
                    <div className="text-7xl font-bold text-blue-400 mb-6 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]">
                        {data.q}
                    </div>

                    <div className="w-full h-px bg-gray-700 my-6" />

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">เวลารับคิว:</span>
                            <span className="text-white font-medium">{receiveDate.toLocaleTimeString('th-TH')}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">หมดอายุ:</span>
                            <span className="text-gray-400 font-medium">{expireDate.toLocaleTimeString('th-TH')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center px-4 max-w-sm">
                <p className="text-xs text-gray-500">
                    หน้านี้เป็นเพียงการแสดงหมายเลขคิวของคุณเท่านั้น ไม่มีการเชื่อมต่อกับระบบเพื่ออัปเดตสถานะคิวล่าสุด
                </p>
            </div>
        </div>
    );
};

export default OMobileTracking;
