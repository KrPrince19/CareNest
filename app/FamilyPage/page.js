"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Users, Bell, Plus, Activity, CheckCircle, ArrowLeft, XCircle, AlertTriangle, Clock, ShieldCheck, Loader2, User, Package, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { io } from "socket.io-client";
import { useRouter } from 'next/navigation';

export default function FamilyDashboard() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [emergencyModal, setEmergencyModal] = useState(null);
  const [sosHistory, setSosHistory] = useState([]); 
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const router = useRouter();

  // CONSTANTS
  const BACKEND_URL = "https://carenestbackend-1.onrender.com";

  // --- HELPER: STATUS LOGIC ---
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
      if(!email) return;
      try {
        const response = await fetch(`${BACKEND_URL}/medicines?email=${email}`);
        const dbData = await response.json();
        const processed = dbData.map(med => ({ ...med, status: calculateRealStatus(med), id: med._id }));
        processed.sort((a, b) => new Date('1970/01/01 ' + a.time) - new Date('1970/01/01 ' + b.time));
        setMedicines(processed);
        setLoading(false);
      } catch (e) { console.error("Fetch Error:", e); }
  };

  // --- INIT & SOCKET ---
  useEffect(() => {
    const storedUserRaw = localStorage.getItem("user");
    if (!storedUserRaw) {
        router.push("/Login");
        return;
    }
    const userData = JSON.parse(storedUserRaw);
    setCurrentUser(userData);
    fetchMedicines(userData.email); 

    // SOCKET SETUP
    const socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling']
    });

    socket.on("connect", () => console.log("Family Dashboard Connected to Socket"));

    // Sync Medicine Data
    socket.on("REFRESH_DATA", () => {
        fetchMedicines(userData.email);
    });

    // Listen for NEW SOS from Elder
    socket.on("NEW_SOS_ALERT", (data) => {
        // If the SOS belongs to this family's elder
        if (data.email === userData.email) {
            setEmergencyModal(data);
            // Also play an alert sound here if desired
        }
    });

    const dateInterval = setInterval(() => {
        setMedicines(prev => prev.map(m => ({ ...m, status: calculateRealStatus(m) })));
    }, 30000); // Check missed status every 30s

    // SOS POLLING (Backup to Sockets)
    const alertInterval = setInterval(() => {
        if (!userData?.email) return;
        const alertKey = `careNest_emergencyAlert_${userData.email}`;
        const historyKey = `careNest_sosHistory_${userData.email}`;

        const raw = localStorage.getItem(alertKey);
        if(raw) {
            const p = JSON.parse(raw);
            if(p.active && p.status === 'pending') setEmergencyModal(p);
            else setEmergencyModal(null);
        }

        const rawHistory = localStorage.getItem(historyKey);
        if(rawHistory) {
            const h = JSON.parse(rawHistory);
            const today = new Date().toLocaleDateString();
            if(h.date === today) setSosHistory([...h.logs].reverse());
            else setSosHistory([]);
        }
    }, 2000);

    const handleClickOutside = (e) => {
        if (notificationRef.current && !notificationRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        socket.disconnect();
        clearInterval(alertInterval);
        clearInterval(dateInterval);
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleResolveSOS = async () => {
     if (!currentUser?.email) return;
     const alertKey = `careNest_emergencyAlert_${currentUser.email}`;
     const historyKey = `careNest_sosHistory_${currentUser.email}`;

     setEmergencyModal(null);
     
     const raw = localStorage.getItem(alertKey);
     if(raw) {
        const p = JSON.parse(raw);
        const updated = { ...p, status: 'resolved' };
        localStorage.setItem(alertKey, JSON.stringify(updated));
        
        const rawHistory = localStorage.getItem(historyKey);
        if(rawHistory) {
             const h = JSON.parse(rawHistory);
             const updatedLogs = h.logs.map(log => 
                log.id === p.id ? { ...log, status: 'resolved' } : log
             );
             localStorage.setItem(historyKey, JSON.stringify({ ...h, logs: updatedLogs }));
        }
     }
  };

  const taken = medicines.filter(m => m.status === 'taken').length;
  const missed = medicines.filter(m => m.status === 'missed').length;
  const pendingSOS = sosHistory.filter(s => s.status === 'pending').length;
  const lowStockItems = medicines.filter(m => (m.stock !== undefined && m.stock <= 4));

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* SOS MODAL */}
      {emergencyModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/90 p-4">
            <div className="bg-white p-8 rounded-3xl text-center max-w-md w-full animate-in zoom-in duration-300 shadow-2xl">
                <div className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                   <AlertTriangle className="w-12 h-12 text-red-600"/>
                </div>
                <h2 className="text-3xl font-bold text-red-700 uppercase">Emergency!</h2>
                <p className="text-lg my-4 font-semibold text-slate-700">"{emergencyModal.message}"</p>
                <p className="text-sm text-slate-500 mb-6 font-mono bg-slate-100 py-2 rounded">Time: {new Date(emergencyModal.timestamp).toLocaleTimeString()}</p>
                <button onClick={handleResolveSOS} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-xl transition-all active:scale-95">I am responding now</button>
            </div>
         </div>
      )}

      {/* NAVBAR */}
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Users className="w-5 h-5"/></div> 
            CareNest Family
            {currentUser && <span className="text-xs font-normal text-slate-500 ml-2">Family Hub: {currentUser.name}</span>}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={notificationRef}>
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-slate-100 rounded-full transition">
                  <Bell className="w-6 h-6 text-slate-500" />
                  {(missed > 0 || pendingSOS > 0 || lowStockItems.length > 0) && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
              </button>
              
              {showNotifications && (
                 <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                    <div className="p-4 border-b bg-slate-50 font-bold text-slate-700">Recent Alerts</div>
                    <div className="max-h-96 overflow-y-auto">
                       {missed > 0 && (
                          <div className="p-4 flex gap-3 border-b bg-red-50">
                             <XCircle className="w-5 h-5 text-red-600 mt-1"/>
                             <div>
                                <p className="font-bold text-red-800 text-sm">Missed Medicines</p>
                                <p className="text-xs text-red-600">{missed} doses were not taken on time.</p>
                             </div>
                          </div>
                       )}
                       {lowStockItems.length > 0 && (
                          <div className="p-4 flex gap-3 border-b bg-orange-50">
                             <Package className="w-5 h-5 text-orange-600 mt-1"/>
                             <div className="w-full">
                                <p className="font-bold text-orange-800 text-sm">Low Stock Alert</p>
                                <ul className="text-[11px] list-disc list-inside text-orange-800 mt-1">
                                   {lowStockItems.map(item => <li key={item._id}>{item.name} ({item.stock} left)</li>)}
                                </ul>
                             </div>
                          </div>
                       )}
                       {sosHistory.length > 0 ? (
                           sosHistory.map((sos, i) => (
                             <div key={i} className={`p-4 border-b flex gap-3 ${sos.status === 'pending' ? 'bg-red-50' : 'bg-white'}`}>
                                 {sos.status === 'pending' ? <AlertTriangle className="w-5 h-5 text-red-600 mt-1"/> : <ShieldCheck className="w-5 h-5 text-emerald-600 mt-1"/>}
                                 <div>
                                    <p className={`font-bold text-[13px] ${sos.status === 'pending' ? 'text-red-700' : 'text-slate-700'}`}>
                                          {sos.status === 'pending' ? 'Active SOS Alert' : 'SOS Resolved'}
                                    </p>
                                    <p className="text-[10px] text-slate-500">{new Date(sos.timestamp).toLocaleTimeString()}</p>
                                 </div>
                             </div>
                           ))
                       ) : (
                          !missed && !lowStockItems.length && <div className="p-8 text-center text-slate-400 text-sm italic">All systems clear</div>
                       )}
                    </div>
                 </div>
              )}
            </div>
            <Link href="/" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition">
               <ArrowLeft className="w-5 h-5 text-slate-600"/>
            </Link>
          </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
               <h1 className="text-3xl font-bold text-slate-900">Health Monitoring</h1>
               <p className="text-emerald-600 font-medium flex items-center gap-2 mt-1">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Receiving live updates from Elder Dashboard
               </p>
            </div>
            <Link href="/MedicinePage" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex gap-2 transition shadow-lg active:scale-95">
              <Plus className="w-5 h-5"/> Add New Medicine
            </Link>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-2 mb-2 text-slate-500 uppercase text-xs font-bold tracking-widest">
                  <Activity className="w-4 h-4 text-blue-500"/> Total Scheduled
                </div>
                <div className="text-4xl font-bold text-slate-900">{medicines.length}</div>
            </div>
            <div className={`p-6 rounded-2xl border transition shadow-sm ${missed > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-2 text-slate-500 uppercase text-xs font-bold tracking-widest">
                  <AlertTriangle className={`w-4 h-4 ${missed > 0 ? 'text-red-600' : 'text-slate-400'}`}/> Missed Doses
                </div>
                <div className={`text-4xl font-bold ${missed > 0 ? 'text-red-600' : 'text-slate-900'}`}>{missed}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-2 mb-2 text-slate-500 uppercase text-xs font-bold tracking-widest">
                  <CheckCircle className="w-4 h-4 text-emerald-500"/> Adherence Rate
                </div>
                <div className="text-4xl font-bold text-emerald-600">
                  {medicines.length > 0 ? Math.round((taken / medicines.length) * 100) : 0}%
                </div>
            </div>
          </div>

          {/* MAIN LOG */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
                <h2 className="font-bold text-slate-700 flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/> Real-Time Log</h2>
                <span className="text-xs text-slate-400">Updated just now</span>
            </div>
            
            {medicines.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                     <Package className="w-10 h-10 text-slate-300"/>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">No Medicines Tracked</h3>
                  <p className="text-slate-500 max-w-xs mt-2 mb-6">Schedule doses for Mom or Dad to see live progress here.</p>
                  <Link href="/MedicinePage" className="text-blue-600 font-bold hover:underline">Add Schedule &rarr;</Link>
                </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {medicines.map((med) => (
                  <div key={med.id} className={`p-6 flex justify-between items-center hover:bg-slate-50 transition-colors ${med.status === 'missed' ? 'bg-red-50/30' : ''}`}>
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {med.status === 'taken' && <div className="p-2 bg-emerald-100 rounded-full"><CheckCircle className="text-emerald-600 w-6 h-6"/></div>}
                          {med.status === 'missed' && <div className="p-2 bg-red-100 rounded-full"><XCircle className="text-red-600 w-6 h-6"/></div>}
                          {med.status === 'upcoming' && <div className="p-2 bg-blue-50 rounded-full"><Clock className="text-blue-400 w-6 h-6"/></div>}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-3">
                             {med.name}
                             <span className={`text-[10px] px-2 py-0.5 rounded-md border uppercase font-bold tracking-tighter
                                ${med.forWhom === 'Mom' ? 'bg-pink-50 text-pink-600 border-pink-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                {med.forWhom}
                             </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                             <span className="text-sm text-slate-500 font-medium">{med.time} • {med.dose}</span>
                             <span className={`text-xs flex items-center gap-1 font-semibold
                                ${(med.stock <= 4) ? 'text-red-500' : 'text-slate-400'}`}>
                                <Package className="w-3.5 h-3.5"/> Stock: {med.stock ?? 'N/A'}
                             </span>
                          </div>
                        </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2
                       ${med.status === 'taken' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}
                       ${med.status === 'missed' ? 'bg-red-50 text-red-700 border-red-100' : ''}
                       ${med.status === 'upcoming' ? 'bg-white text-slate-400 border-slate-100' : ''}
                    `}>{med.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </main>
    </div>
  );
}
