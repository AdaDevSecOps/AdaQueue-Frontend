import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiPath } from '../../config/api';
import { QRCodeSVG } from 'qrcode.react';

const OTicketIssued: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initDoc = (location.state as any)?.docNo || '';
  const [docNo, setDocNo] = useState<string>(initDoc);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<any | null>(null);
  const [countdown, setCountdown] = useState<number>(10);

  useEffect(() => {
    const d = initDoc || localStorage.getItem('adaqueue_last_queue_docno') || '';
    setDocNo(d);
  }, [initDoc]);

  useEffect(() => {
    const run = async () => {
      if (!docNo) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiPath(`/api/queue/${docNo}`));
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        setQueue(data);
      } catch (e: any) {
        setError('ไม่สามารถโหลดข้อมูลคิวได้');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [docNo]);

  useEffect(() => {
    if (!queue || loading || error) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/kiosk');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [queue, loading, error, navigate]);

  const padded = (n: number) => String(n || 0).padStart(3, '0');
  const label = () => {
    if (!queue) return '';
    const type = queue.data?.queueType || queue.queueType || 'Q';
    // return `${type}-${queue.ticketNo}`;
    return `${queue.ticketNo}`;
  };

  const getTrackingUrl = () => {
    if (!queue) return '';
    try {
      const q = label();
      const t = new Date(queue.date).getTime();
      const e = t + 3 * 60 * 60 * 1000; // + 3 hours

      const payload = { q, t, e };
      const token = btoa(JSON.stringify(payload));

      return `${window.location.origin}/ticket?data=${token}`;
    } catch (err) {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <header className="px-8 py-6 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/kiosk')} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
            <span className="text-xl">←</span>
          </button>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">A</div>
          <span className="font-bold text-xl tracking-wide">AdaQueue</span>
        </div>
        <div className="text-gray-400 text-sm font-medium">{docNo || ''}</div>
      </header>

      <div className="flex-1 px-8 py-10 max-w-4xl mx-auto w-full">
        {loading && (
          <div className="text-center text-gray-400">กำลังโหลดข้อมูลคิว...</div>
        )}
        {error && (
          <div className="text-center text-red-400">{error}</div>
        )}
        {!loading && !error && queue && (
          <div className="bg-gray-800 rounded-3xl p-8 border border-gray-700 shadow-2xl text-center">
            <div className="uppercase text-xs font-bold text-gray-500 tracking-[0.2em] mb-3">Your Ticket</div>
            <div className="text-7xl font-bold text-blue-400 mb-3 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]">{label()}</div>
            <h3 className="text-2xl font-bold text-white mb-2">{queue.data?.serviceGroup || queue.queueType || ''}</h3>
            <p className="text-gray-400 text-sm mb-6">
              {new Date(queue.date).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            {/* QR Code Section */}
            <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-sm">
              <QRCodeSVG value={getTrackingUrl()} size={140} />
            </div>
            <p className="text-xs text-gray-500 mb-8 max-w-[200px] mx-auto leading-relaxed">
              สแกน QR Code เพื่อดูหมายเลขคิวบนมือถือของคุณ
            </p>

            <div className="mt-2 text-center">
              <button onClick={() => navigate('/kiosk')} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold w-full max-w-[200px] mb-3">กลับหน้าเลือกบริการ</button>
              <div className="text-gray-400 text-sm">
                หน้าจอกำลังจะปิดใน <span className="text-white font-bold">{countdown}</span> วินาที
              </div>
            </div>
          </div>
        )}
        {!loading && !error && !queue && (
          <div className="text-center text-gray-400">ไม่พบข้อมูลคิว</div>
        )}
      </div>
    </div>
  );
};

export default OTicketIssued;
