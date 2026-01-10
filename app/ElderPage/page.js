"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, ArrowLeft, AlertTriangle, Loader2, ShieldAlert, Package, User, LayoutDashboard } from 'lucide-react';
import { io } from "socket.io-client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ElderDashboard() {
  const router = useRouter();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayDate, setDisplayDate] = useState('');
  const [currentUser, setCurrentUser] = useState(null); 
  
  const [sosStatus, setSosStatus] = useState('idle'); 

  // --- HELPER ---
  const calculateRealStatus = (med) => {
    if (med.status === 'taken') return 'taken';
    if (med.time) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const [t, mod] = med.time.split(' ');
        let [h, m] = t.split(':');
        h = parseInt(h);
        if (h === 12 && mod === 'AM') h = 0;
        if (h !== 12 && mod === 'PM') h += 12;
        const medMins = h * 60 + parseInt(m);
        if (currentMins > medMins) return 'missed';
    }
    return 'upcoming';
  };

  const fetchMedicines = async (email) => {
    if (!email) return;
    try {
      const response = await fetch(`https://carenestbackend-1.onrender.com/medicines?email=${email}`);
      const dbData = await response.json();
      
      const formattedData = dbData.map(item => ({
        ...item, 
        id: item._id,
        status: calculateRealStatus(item)
      }));
      formattedData.sort((a, b) => new Date('1970/01/01 ' + a.time) - new Date('1970/01/01 ' + b.time));
      setMedicines(formattedData);
      setLoading(false);
    } catch (error) { console.error("API Error:", error); }
  };

  // --- INIT ---
  useEffect(() => {
    const storedUserRaw = localStorage.getItem("user");
    if (!storedUserRaw) {
        router.push("/Login");
        return;
    }
    const userData = JSON.parse(storedUserRaw);
    setCurrentUser(userData);

    fetchMedicines(userData.email); 

    const socket = io("http://localhost:5000");
    socket.on("REFRESH_DATA", () => fetchMedicines(userData.email));

    const dateInterval = setInterval(() => {
        const now = new Date();
        setDisplayDate(now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }));
    }, 1000);
    
    const heartbeat = setInterval(() => {
       setMedicines(prev => prev.map(m => ({ ...m, status: calculateRealStatus(m) })));
    }, 5000);

    return () => {
      socket.disconnect();
      clearInterval(dateInterval);
      clearInterval(heartbeat);
    };
  }, []);

  // --- SOS LOGIC ---
  // 1. Check if an alert is already active on load
  useEffect(() => {
    if (currentUser?.email) {
        const raw = localStorage.getItem(`careNest_emergencyAlert_${currentUser.email}`);
        if (raw) {
            const data = JSON.parse(raw);
            if (data.active && data.status === 'pending') setSosStatus('waiting');
            if (data.active && data.status === 'resolved') setSosStatus('acknowledged');
        }
    }
  }, [currentUser]);

  // 2. Poll for Family Response
  useEffect(() => {
    let interval;
    if (sosStatus === 'waiting' && currentUser?.email) {
      interval = setInterval(() => {
        const raw = localStorage.getItem(`careNest_emergencyAlert_${currentUser.email}`);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.status === 'resolved') {
             setSosStatus('acknowledged');
             setTimeout(() => {
                setSosStatus('idle');
                localStorage.setItem(`careNest_emergencyAlert_${currentUser.email}`, JSON.stringify({ ...data, active: false }));
             }, 8000);
          }
        }
      }, 1000); 
    }
    return () => clearInterval(interval);
  }, [sosStatus, currentUser]);

  const handleEmergencyClick = () => setSosStatus('confirm');
  
  // ✅ UPDATED: Trigger SMS via Backend
  const confirmEmergency = async () => {
     setSosStatus('sending');
     const now = new Date();
     const uniqueId = Date.now();

     // 1. Prepare Data
     const alertData = { 
        id: uniqueId,
        active: true, 
        status: 'pending', 
        timestamp: now.toISOString(), 
        message: `Emergency Alert from ${currentUser?.name || 'Elder'}!` 
     };

     // 2. Save to Local Storage (For Web Dashboard Alert)
     if (currentUser?.email) {
         localStorage.setItem(`careNest_emergencyAlert_${currentUser.email}`, JSON.stringify(alertData));

         let historyStore = JSON.parse(localStorage.getItem(`careNest_sosHistory_${currentUser.email}`) || '{"date": "", "logs": []}');
         const todayStr = now.toLocaleDateString();
         
         if (historyStore.date !== todayStr) {
            historyStore = { date: todayStr, logs: [] };
         }

         historyStore.logs.push(alertData);
         localStorage.setItem(`careNest_sosHistory_${currentUser.email}`, JSON.stringify(historyStore));
     }

     // 3. ✅ SEND SMS VIA BACKEND
     try {
        await fetch('http://localhost:5000/send-sos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                senderName: currentUser?.name || "Elder User" 
            })
        });
        // Note: We don't block the UI if SMS fails, the web alert still works
     } catch (error) {
        console.error("Failed to send SMS:", error);
     }

     setTimeout(() => setSosStatus('waiting'), 1000);
  };
  
  const cancelEmergency = () => setSosStatus('idle');

  const handleTakeMedicine = async (id) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, status: 'taken', stock: m.stock > 0 ? m.stock - 1 : 0 } : m));
    await fetch(`http://localhost:5000/medicines/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'taken' })
    });
  };

  const nextMedicine = medicines.find(m => m.status === 'upcoming');
  const totalMeds = medicines.length;
  const takenMeds = medicines.filter(m => m.status === 'taken').length;
  const missedMeds = medicines.filter(m => m.status === 'missed').length;
  const performance = totalMeds === 0 ? 0 : Math.round((takenMeds / totalMeds) * 100);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      {/* HEADER */}
      <div className="flex justify-between items-end text-white mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Today's Health</h1>
          <p className="text-emerald-600 font-medium flex items-center gap-2">
            {displayDate} 
            {currentUser && <span className="text-slate-400 text-sm font-normal">| {currentUser.name}</span>}
          </p>
        </div>
        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
               <Link href="/"><ArrowLeft></ArrowLeft></Link>
        </div>
      </div>

      {medicines.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500 bg-white rounded-3xl shadow-sm border border-slate-200">
             <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <LayoutDashboard className="w-12 h-12 text-emerald-500"/>
             </div>
             <h3 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Your Dashboard</h3>
             <p className="text-slate-500 max-w-md mb-8 text-lg">
                You don't have any medicines scheduled for today yet. Ask a family member to add your schedule!
             </p>
             <div className="w-full max-w-sm border-t pt-6">
                 <p className="text-sm text-slate-400 uppercase font-bold tracking-wider mb-4">Emergency Features Active</p>
                 {sosStatus === 'idle' && (
                  <button onClick={handleEmergencyClick} className="w-full bg-red-100 text-red-700 py-3 rounded-xl font-bold hover:bg-red-200 transition flex items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5"/> Test Emergency Button
                  </button>
                 )}
             </div>
          </div>
      ) : (
        <>
            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center">
                <span className="block text-3xl font-bold text-slate-900">{totalMeds}</span>
                <span className="text-xs text-slate-500 uppercase">Total</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 text-center">
                <span className="block text-3xl font-bold text-emerald-700">{takenMeds}</span>
                <span className="text-xs text-emerald-600 uppercase">Taken</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-100 text-center">
                <span className="block text-3xl font-bold text-red-700">{missedMeds}</span>
                <span className="text-xs text-red-600 uppercase">Missed</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100 text-center">
                <span className="block text-3xl font-bold text-purple-700">{performance}%</span>
                <span className="text-xs text-purple-600 uppercase">Score</span>
                </div>
            </div>

            {/* UP NEXT */}
            <div className="max-w-4xl mx-auto mb-8">
                {nextMedicine ? (
                <div className="bg-blue-600 rounded-3xl p-8 text-white flex justify-between items-center shadow-xl">
                    <div>
                    <p className="opacity-80 uppercase text-sm font-bold mb-2">Up Next</p>
                    <h2 className="text-3xl font-bold">{nextMedicine.name}</h2>
                    <p className="text-xl mt-1">{nextMedicine.time} • {nextMedicine.dose}</p>
                    <div className="inline-flex items-center gap-1 mt-3 bg-blue-700 px-3 py-1 rounded-lg text-sm">
                        <Package className="w-4 h-4"/> Stock: {nextMedicine.stock}
                    </div>
                    </div>
                    <button onClick={() => handleTakeMedicine(nextMedicine.id)} className="bg-white text-blue-700 px-8 py-4 rounded-2xl font-bold text-xl hover:bg-blue-50 transition shadow-lg">Take Now</button>
                </div>
                ) : (
                <div className="bg-emerald-100 p-6 rounded-3xl text-center text-emerald-800 font-bold">All caught up!</div>
                )}
            </div>

            {/* LIST */}
            <div className="max-w-4xl mx-auto space-y-4">
                {medicines.map((med) => (
                <div key={med.id} className={`flex justify-between items-center p-5 rounded-2xl border-2 transition-all ${med.status === 'taken' ? 'opacity-60 bg-slate-50' : 'bg-white'} ${med.status === 'missed' ? 'border-red-100 bg-red-50' : ''}`}>
                    <div className="flex items-center gap-4">
                        {med.status === 'taken' ? <CheckCircle className="text-emerald-500 w-8 h-8"/> : null}
                        {med.status === 'missed' ? <XCircle className="text-red-500 w-8 h-8"/> : null}
                        {med.status === 'upcoming' ? <Clock className="text-blue-500 w-8 h-8"/> : null}
                        <div>
                            <h3 className="font-bold text-lg">{med.name}</h3>
                            <div className="flex items-center gap-3 text-slate-500">
                                <span>{med.time} • {med.dose}</span>
                                <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${med.stock <= 4 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                    <Package className="w-3 h-3"/> Stock: {med.stock}
                                </span>
                            </div>
                        </div>
                    </div>
                    {med.status === 'upcoming' && <button onClick={() => handleTakeMedicine(med.id)} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-emerald-700 transition">Take</button>}
                    {med.status === 'taken' && <span className="text-emerald-700 font-bold uppercase text-sm bg-emerald-100 px-3 py-1 rounded-lg">Taken</span>}
                    {med.status === 'missed' && <span className="text-red-700 font-bold uppercase text-sm bg-red-100 px-3 py-1 rounded-lg">Missed</span>}
                </div>
                ))}
            </div>
        </>
      )}

      {/* SOS BUTTON AREA */}
      <div className="max-w-4xl mx-auto mb-8 mt-4">
        {sosStatus === 'idle' && medicines.length > 0 && (
             <button onClick={handleEmergencyClick} className="w-full bg-red-600 text-white p-6 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-lg hover:bg-red-700 transition active:scale-95">
                <div className="bg-white/20 p-2 rounded-full"><AlertTriangle className="w-8 h-8"/></div>
                <div className="text-left"><div className="text-2xl">EMERGENCY SOS</div><div className="text-sm font-normal text-red-100">Tap to alert family</div></div>
             </button>
        )}

        {sosStatus === 'confirm' && (
            <div className="flex gap-4 animate-in fade-in slide-in-from-top-2">
              <button onClick={cancelEmergency} className="flex-1 bg-slate-200 text-slate-800 font-bold text-xl py-6 rounded-2xl">Cancel</button>
              <button onClick={confirmEmergency} className="flex-[2] bg-red-600 text-white font-bold text-xl py-6 rounded-2xl flex items-center justify-center gap-2">
                <ShieldAlert /> Yes, Send Alert
              </button>
            </div>
        )}

        {sosStatus === 'sending' && (
            <div className="bg-red-50 border-2 border-red-100 p-6 rounded-2xl flex items-center justify-center gap-4 text-red-800 font-bold text-xl">
               <Loader2 className="animate-spin w-8 h-8" /> Sending Alert...
            </div>
        )}

        {sosStatus === 'waiting' && (
            <div className="bg-amber-100 border-2 border-amber-200 p-8 rounded-2xl text-center">
               <Loader2 className="animate-spin w-12 h-12 text-amber-600 mx-auto mb-4" />
               <h3 className="text-2xl font-bold text-amber-900">Alert Sent!</h3>
               <p className="text-amber-800 mt-2">Waiting for family to respond...</p>
            </div>
        )}

        {sosStatus === 'acknowledged' && (
            <div className="bg-emerald-600 text-white p-8 rounded-2xl flex items-center justify-center gap-6 shadow-xl animate-in zoom-in">
               <CheckCircle className="w-16 h-16 text-white" />
               <div className="text-left">
                  <h3 className="text-3xl font-bold">Help is Coming!</h3>
                  <p className="text-emerald-100 text-lg">Family has seen your alert.</p>
               </div>
            </div>
        )}
      </div>
    </div>
  );
}
