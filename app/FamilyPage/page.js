"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Users, Bell, Plus, Activity, CheckCircle, ArrowLeft, XCircle, AlertTriangle, Clock, ShieldCheck, Loader2, User, Package, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { io } from "socket.io-client";
import { useRouter } from 'next/navigation';

export default function FamilyDashboard() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // Store logged in user info
  
  // States for Notifications
  const [emergencyModal, setEmergencyModal] = useState(null);
  const [sosHistory, setSosHistory] = useState([]); 
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const router = useRouter();

  // --- HELPER: LOGIC TO DETECT MISSED MEDS ---
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
        const response = await fetch(`https://carenestbackend-1.onrender.com/medicines?email=${email}`);
        const dbData = await response.json();
        
        const processed = dbData.map(med => ({ ...med, status: calculateRealStatus(med) }));
        processed.sort((a, b) => new Date('1970/01/01 ' + a.time) - new Date('1970/01/01 ' + b.time));
        setMedicines(processed);
        setLoading(false);
      } catch (e) { console.error(e); }
  };

  // --- INIT & SOCKET ---
  useEffect(() => {
    // 1. Get User from LocalStorage
    const storedUserRaw = localStorage.getItem("user");
    if (!storedUserRaw) {
        setLoading(false); 
        return; 
    }
    
    const userData = JSON.parse(storedUserRaw);
    setCurrentUser(userData);

    // 2. Fetch data for THIS user
    fetchMedicines(userData.email); 

    const socket = io(https://carenestbackend-1.onrender.com");
    socket.on("REFRESH_DATA", () => fetchMedicines(userData.email));

    // Local heartbeat
    const heartbeat = setInterval(() => {
       setMedicines(prev => prev.map(m => ({ ...m, status: calculateRealStatus(m) })));
    }, 10000);

    // --- ✅ UPDATED SOS POLLING LOGIC ---
    const alertInterval = setInterval(() => {
        // Only run if we have a user email to check against
        if (!userData?.email) return;

        // 1. Define Unique Keys based on Email
        const alertKey = `careNest_emergencyAlert_${userData.email}`;
        const historyKey = `careNest_sosHistory_${userData.email}`;

        // 2. Check Active Alert
        const raw = localStorage.getItem(alertKey);
        if(raw) {
            const p = JSON.parse(raw);
            if(p.active && p.status === 'pending') setEmergencyModal(p);
            else setEmergencyModal(null);
        }

        // 3. Check History
        const rawHistory = localStorage.getItem(historyKey);
        if(rawHistory) {
             const h = JSON.parse(rawHistory);
             const today = new Date().toLocaleDateString();
             if(h.date === today) {
                setSosHistory([...h.logs].reverse());
             } else {
                setSosHistory([]);
             }
        }
    }, 1000);

    const handleClickOutside = (event) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        socket.disconnect();
        clearInterval(alertInterval);
        clearInterval(heartbeat);
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleResolveSOS = () => {
     if (!currentUser?.email) return;

     // ✅ UPDATED: Use Email-specific Keys
     const alertKey = `careNest_emergencyAlert_${currentUser.email}`;
     const historyKey = `careNest_sosHistory_${currentUser.email}`;

     setEmergencyModal(null);
     
     // Update Alert Status
     const raw = localStorage.getItem(alertKey);
     if(raw) {
        const p = JSON.parse(raw);
        const updated = { ...p, status: 'resolved' };
        localStorage.setItem(alertKey, JSON.stringify(updated));
        
        // Update History Status
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
            <div className="bg-white p-8 rounded-3xl text-center max-w-md w-full animate-in zoom-in duration-300">
               <div className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <AlertTriangle className="w-12 h-12 text-red-600"/>
               </div>
               <h2 className="text-3xl font-bold text-red-700">SOS ALERT</h2>
               <p className="text-lg my-4 font-semibold text-slate-700">"{emergencyModal.message}"</p>
               <p className="text-sm text-slate-500 mb-6">Triggered at {new Date(emergencyModal.timestamp).toLocaleTimeString()}</p>
               <button onClick={handleResolveSOS} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-xl transition shadow-lg">I'm Handling It</button>
            </div>
         </div>
      )}

      {/* NAVBAR */}
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
         <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Users className="w-5 h-5"/></div> 
            CareNest Family
            {currentUser && <span className="text-xs font-normal text-slate-500 ml-2">({currentUser.name})</span>}
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
                 <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b bg-slate-50 font-bold text-slate-700">Notifications</div>
                    <div className="max-h-96 overflow-y-auto">
                       {/* Notifications Content */}
                       {missed > 0 && (
                          <div className="p-4 flex gap-3 border-b bg-red-50">
                             <XCircle className="w-5 h-5 text-red-600 mt-1"/>
                             <div>
                                <p className="font-bold text-red-800">Missed Medicines!</p>
                                <p className="text-xs text-red-600">Patient missed {missed} dose(s).</p>
                             </div>
                          </div>
                       )}
                       {lowStockItems.length > 0 && (
                          <div className="p-4 flex gap-3 border-b bg-orange-50">
                             <Package className="w-5 h-5 text-orange-600 mt-1"/>
                             <div className="w-full">
                                <p className="font-bold text-orange-800">Low Stock Alert</p>
                                <p className="text-xs text-orange-700 mb-2">Restock needed for {lowStockItems.length} item(s):</p>
                                <ul className="text-xs list-disc list-inside text-orange-800">
                                   {lowStockItems.map(item => (
                                      <li key={item._id}>{item.name} (Only {item.stock} left)</li>
                                   ))}
                                </ul>
                             </div>
                          </div>
                       )}
                       {sosHistory.length > 0 ? (
                           sosHistory.map((sos, i) => (
                             <div key={i} className={`p-4 border-b flex gap-3 ${sos.status === 'pending' ? 'bg-red-50' : 'bg-white'}`}>
                                 {sos.status === 'pending' ? <AlertTriangle className="w-5 h-5 text-red-600 mt-1"/> : <ShieldCheck className="w-5 h-5 text-emerald-600 mt-1"/>}
                                 <div>
                                    <p className={`font-bold text-sm ${sos.status === 'pending' ? 'text-red-700' : 'text-slate-700'}`}>
                                          {sos.status === 'pending' ? 'Active SOS Alert' : 'SOS Resolved'}
                                    </p>
                                    <p className="text-xs text-slate-500">{new Date(sos.timestamp).toLocaleTimeString()}</p>
                                 </div>
                             </div>
                           ))
                       ) : (
                          missed === 0 && lowStockItems.length === 0 && <div className="p-4 text-center text-slate-500 text-sm">No new alerts today.</div>
                       )}
                    </div>
                 </div>
              )}
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
               <Link href="/"><ArrowLeft></ArrowLeft></Link>
            </div>
         </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
         <div className="flex justify-between items-center mb-8">
            <div>
               <h1 className="text-3xl font-bold">Family Dashboard</h1>
               <p className="text-emerald-600 font-medium flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Connection
               </p>
            </div>
            <Link href="/MedicinePage" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex gap-2 transition shadow-md"><Plus/> Add Med</Link>
         </div>

         {/* STATS */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-emerald-500"/>
                  <span className="font-semibold text-slate-600">Total Scheduled</span>
               </div>
               <div className="text-4xl font-bold text-slate-900">{medicines.length}</div>
            </div>
            <div className={`p-6 rounded-2xl border shadow-sm ${missed > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
               <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`w-5 h-5 ${missed > 0 ? 'text-red-600' : 'text-slate-400'}`}/>
                  <span className={`font-semibold ${missed > 0 ? 'text-red-800' : 'text-slate-600'}`}>Missed Doses</span>
               </div>
               <div className={`text-4xl font-bold ${missed > 0 ? 'text-red-600' : 'text-slate-900'}`}>{missed}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500"/>
                  <span className="font-semibold text-slate-600">Taken Successfully</span>
               </div>
               <div className="text-4xl font-bold text-emerald-600">{taken}</div>
            </div>
         </div>

         {/* LIST */}
         <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm min-h-[300px]">
            <div className="p-4 bg-slate-50 border-b font-bold text-slate-700">Today's Live Log</div>
            
            {medicines.length === 0 ? (
               // ✅ NEW USER / EMPTY STATE DASHBOARD
               <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                     <LayoutDashboard className="w-10 h-10 text-blue-400"/>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Welcome to CareNest!</h3>
                  <p className="text-slate-500 max-w-sm mb-6">
                     It looks like you haven't added any medicines yet. Get started by adding a schedule for your loved ones.
                  </p>
                  <Link href="/MedicinePage" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold flex gap-2 transition shadow-lg">
                     <Plus className="w-5 h-5"/> Add First Medicine
                  </Link>
               </div>
            ) : (
              medicines.map((med) => (
                 <div key={med._id} className={`p-5 border-b last:border-0 flex justify-between items-center transition-colors ${med.status === 'missed' ? 'bg-red-50/50' : ''}`}>
                    <div className="flex items-center gap-4">
                       {med.status === 'taken' && <CheckCircle className="text-emerald-500 w-6 h-6"/>}
                       {med.status === 'missed' && <XCircle className="text-red-500 w-6 h-6"/>}
                       {med.status === 'upcoming' && <Clock className="text-blue-400 w-6 h-6"/>}
                       <div>
                          <div className="font-bold flex items-center gap-2">
                             {med.name}
                             <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 uppercase tracking-wider
                                ${med.forWhom === 'Mom' ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                <User className="w-3 h-3" /> {med.forWhom}
                             </span>
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1">
                             <div className="text-sm text-slate-500 border-r pr-3">{med.time} • {med.dose}</div>
                             <div className={`text-xs font-semibold flex items-center gap-1 
                                ${(med.stock <= 4) ? 'text-red-600 animate-pulse' : 'text-slate-500'}`}>
                                <Package className="w-3 h-3"/> Stock: {med.stock !== undefined ? med.stock : '--'}
                             </div>
                          </div>
                       </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase 
                       ${med.status === 'taken' ? 'bg-emerald-100 text-emerald-800' : ''}
                       ${med.status === 'missed' ? 'bg-red-100 text-red-800' : ''}
                       ${med.status === 'upcoming' ? 'bg-slate-100 text-slate-600' : ''}
                    `}>{med.status}</span>
                 </div>
              ))
            )}
         </div>
      </main>
    </div>
  );
}
