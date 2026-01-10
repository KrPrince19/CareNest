"use client";

import React, { useState, useEffect } from 'react';
import { Pill, Clock, Calendar, CheckCircle, User, Package, ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AddMedicinePage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // State to hold the email retrieved from LocalStorage
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [token, setToken] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    timeStr: '', 
    dose: '',
    stock: '',
    forWhom: 'Dad'
  });

  // ✅ 1. GET DATA FROM LOCAL STORAGE ON LOAD
  useEffect(() => {
    // Retrieve User Object
    const storedUser = localStorage.getItem("user");
    // Retrieve JWT Token
    const storedToken = localStorage.getItem("token");

    if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUserEmail(parsedUser.email);
    }
    
    if (storedToken) {
        setToken(storedToken);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleForWhom = (who) => {
    setFormData(prev => ({ ...prev, forWhom: who }));
  };

  const formatTimeAMPM = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours, 10);
    const m = minutes;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; 
    return `${h}:${m} ${ampm}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    // ✅ CHECK: Is user logged in?
    if (!currentUserEmail) {
        alert("You are not logged in. Please log in to save data.");
        setLoading(false);
        return;
    }

    const formattedTime = formatTimeAMPM(formData.timeStr);

    const payload = {
      name: formData.name,
      time: formattedTime,
      dose: formData.dose,
      stock: parseInt(formData.stock),
      forWhom: formData.forWhom,
      // ✅ PASS EMAIL WITH DATA
      userEmail: currentUserEmail 
    };

    try {
      const response = await fetch('https://carenestbackend-1.onrender.com/medicines', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            // ✅ OPTIONAL BUT RECOMMENDED: Send Token for security
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          name: '',
          timeStr: '',
          dose: '',
          stock: '',
          forWhom: 'Dad'
        });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Connection Failed. Is the backend server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-10 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* HEADER */}
        <div className="bg-blue-600 p-8 text-white relative">
          <Link href="/FamilyPage" className="absolute top-6 left-6 p-2 bg-white/20 rounded-full hover:bg-white/30 transition">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="flex flex-col items-center">
            <div className="bg-white/20 p-4 rounded-full mb-4 shadow-inner">
              <Pill className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Add Medicine</h1>
            <p className="text-blue-100">
                {currentUserEmail ? `Scheduling for: ${currentUserEmail}` : "Please Log In"}
            </p>
          </div>
        </div>

        {/* FORM */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. FOR WHOM */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" /> For Whom?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleForWhom('Dad')}
                  className={`py-3 rounded-xl border-2 font-bold transition flex items-center justify-center gap-2
                    ${formData.forWhom === 'Dad' 
                      ? 'border-blue-600 bg-blue-50 text-blue-700' 
                      : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                >
                  👴 Dad
                </button>
                <button
                  type="button"
                  onClick={() => handleForWhom('Mom')}
                  className={`py-3 rounded-xl border-2 font-bold transition flex items-center justify-center gap-2
                    ${formData.forWhom === 'Mom' 
                      ? 'border-pink-600 bg-pink-50 text-pink-700' 
                      : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                >
                  👵 Mom
                </button>
              </div>
            </div>

            {/* 2. MEDICINE NAME */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Medicine Name</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Atorvastatin (Heart)"
                required
                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* 3. TIME & DOSE */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                   <Clock className="w-4 h-4 text-blue-500" /> Time
                </label>
                <input 
                  type="time" 
                  name="timeStr"
                  value={formData.timeStr}
                  onChange={handleChange}
                  required
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                   <Calendar className="w-4 h-4 text-blue-500" /> Dosage
                </label>
                <input 
                  type="text" 
                  name="dose"
                  value={formData.dose}
                  onChange={handleChange}
                  placeholder="e.g. 1 Tablet"
                  required
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {/* 4. STOCK */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                 <Package className="w-4 h-4 text-blue-500" /> Current Stock
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="Total pills in bottle"
                  required
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <span className="absolute right-4 top-4 text-slate-400 font-medium">Qty</span>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin"/> : <CheckCircle className="w-6 h-6" />}
              {loading ? "Saving..." : "Confirm & Add Medicine"}
            </button>
          </form>

          {success && (
            <div className="mt-6 p-4 bg-emerald-100 text-emerald-800 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <span className="font-bold block">Success!</span>
                <span className="text-sm">Medicine saved to database. Add another?</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
