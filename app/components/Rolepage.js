"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs'; // Import Clerk hook
import { User, HeartHandshake, ArrowLeft, ArrowRight, LogOut } from 'lucide-react';

export default function RoleSelectionPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  // Function to handle Logout + Redirect
  const handleBackToHome = async () => {
    // 1. Sign out the user via Clerk
    await signOut(() => {      
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      
      {/* --- LOGOUT / BACK BUTTON --- */}
      <div className="absolute top-6 left-6">
        <button 
          onClick={handleBackToHome}
          className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition font-medium group"
        >
          <div className="bg-white p-2 rounded-full shadow-sm border border-slate-200 group-hover:border-red-200">
             <ArrowLeft className="w-4 h-4" />
          </div>
          <span>Sign Out & Back to Home</span>
        </button>
      </div>

      {/* Main Content Container */}
      <div className="max-w-4xl w-full space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="bg-emerald-600 p-2 rounded-lg">
               <HeartHandshake className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-emerald-900 tracking-tight">CareNest</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900">
            Welcome! Who is using this device?
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-lg mx-auto">
            Select your profile to load the correct interface.
          </p>
        </div>

        {/* Role Cards Container */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* --- OPTION 1: ELDER --- */}
          <Link href="/ElderPage" className="group relative block">
            <div className="h-full bg-white border-2 border-slate-200 rounded-3xl p-8 md:p-12 text-center hover:border-emerald-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col items-center justify-center gap-6">
              
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-300">
                <User className="w-12 h-12 text-emerald-700 group-hover:text-white transition-colors duration-300" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  I am an Elder
                </h2>
                <p className="text-lg text-slate-500 group-hover:text-slate-700 transition-colors">
                  Simple buttons. Large text. Easy to use.
                </p>
              </div>

              <div className="mt-4 px-6 py-2 bg-slate-100 rounded-full text-slate-600 font-semibold group-hover:bg-emerald-600 group-hover:text-white transition-all flex items-center gap-2">
                Enter Simple Mode <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* --- OPTION 2: FAMILY MEMBER --- */}
          <Link href="/FamilyPage" className="group relative block">
            <div className="h-full bg-white border-2 border-slate-200 rounded-3xl p-8 md:p-12 text-center hover:border-blue-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col items-center justify-center gap-6">
              
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                <HeartHandshake className="w-12 h-12 text-blue-700 group-hover:text-white transition-colors duration-300" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  I am a Family Member
                </h2>
                <p className="text-lg text-slate-500 group-hover:text-slate-700 transition-colors">
                  Manage reminders, track health, and get alerts.
                </p>
              </div>

              <div className="mt-4 px-6 py-2 bg-slate-100 rounded-full text-slate-600 font-semibold group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center gap-2">
                Enter Family Hub <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

        </div>

        {/* Footer / Logout Text Option */}
        <div className="text-center pt-8 border-t border-slate-200">
           <button 
             onClick={handleBackToHome}
             className="flex items-center justify-center gap-2 mx-auto text-slate-400 hover:text-red-500 transition text-sm"
            >
             <LogOut className="w-4 h-4" />
             Not your account? Sign out
           </button>
        </div>

      </div>
    </div>
  );
}