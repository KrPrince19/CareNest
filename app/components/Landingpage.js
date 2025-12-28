"use client";

import React, { useEffect, useState } from "react";
import { Heart, ShieldCheck, Users, ArrowRight, Home, Activity } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [user, setUser] = useState(null); // Will hold { name, email, role }

  useEffect(() => {
    // ✅ FIX: Read the 'user' object we saved in Login/Signup
    const storedUserRaw = localStorage.getItem("user");
    if (storedUserRaw) {
      try {
        const parsedUser = JSON.parse(storedUserRaw);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse user data", e);
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    // ✅ FIX: Clear the correct keys used in Signup/Login
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    setUser(null);
    // Reload to refresh state completely
    window.location.reload();
  };

  const gotoDashboardHref = () => {
    if (!user?.role) return "/FamilyPage"; 
    return user.role === "elder" ? "/ElderPage" : "/FamilyPage";
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* --- NAVIGATION --- */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-emerald-900 tracking-tight">CareNest</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-lg font-medium text-slate-600 hover:text-emerald-700 transition">About</a>
            <a href="#features" className="text-lg font-medium text-slate-600 hover:text-emerald-700 transition">Features</a>
          </div>

          <div className="flex items-center gap-3">
            {/* ✅ SHOW THESE ONLY IF NOT LOGGED IN */}
            {!user && (
              <>
                <Link href="/Login" className="px-5 py-2.5 text-lg font-semibold text-emerald-700 hover:bg-emerald-50 rounded-full transition">
                  Log In
                </Link>

                <Link href="/Signup" className="px-6 py-2.5 text-lg font-semibold text-white bg-emerald-700 rounded-full hover:bg-emerald-800 shadow-lg hover:shadow-xl transition">
                  Join Now
                </Link>
              </>
            )}

            {/* ✅ SHOW THESE ONLY IF LOGGED IN */}
            {user && (
              <>
                <Link href={gotoDashboardHref()} className="hidden md:inline-flex px-6 py-2.5 text-lg font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg hover:shadow-xl transition">
                  Dashboard
                </Link>

                <div className="flex items-center gap-3">
                    <span className="hidden md:block text-sm font-semibold text-slate-600">
                        Hi, {user.name}
                    </span>
                    <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-full hover:bg-red-50 transition"
                    title="Logout"
                    >
                    Logout
                    </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative bg-white overflow-hidden">
        <div className="container mx-auto px-6 py-7 md:py-7 flex flex-col md:flex-row items-center gap-12">
          
          <div className="md:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full font-semibold text-sm tracking-wide uppercase">
              <Home className="w-4 h-4" />
              <span>For Families, By Families</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.15]">
              Caring for your loved ones, <br />
              <span className="text-emerald-600">simplified.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-lg">
              A dedicated space for your family to coordinate care, track health, and stay connected with the elders you love.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {/* Conditional Hero Buttons */}
              {!user && (
                <Link href="/Signup" className="flex items-center justify-center gap-3 px-8 py-4 text-xl font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg transition transform hover:-translate-y-1">
                  Create Account
                  <ArrowRight className="w-6 h-6" />
                </Link>
              )}

              {user && (
                <Link href={gotoDashboardHref()} className="flex items-center justify-center gap-3 px-8 py-4 text-xl font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg transition transform hover:-translate-y-1">
                  Go to Dashboard
                  <ArrowRight className="w-6 h-6" />
                </Link>
              )}

              <a href="#how-it-works" className="flex items-center justify-center gap-3 px-8 py-4 text-xl font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition">
                See How It Works
              </a>
            </div>
          </div>

          <div className="md:w-1/2 flex justify-center">
             <div className="w-full h-8 mt-11 md:mt-0 rounded-3xl flex items-center justify-center border-2 border-slate-100 shadow-inner">
                <span className="text-slate-400 font-medium text-lg">
                    {/* Ensure this image path is correct in your public folder */}
                    <img className='rounded-2xl p-1' src="images/carenest.png" alt="CareNest" />
                </span>
             </div>
          </div>

        </div>
      </header>

      {/* --- VALUE PROPOSITION --- */}
      <section id="about" className="py-20 bg-emerald-50/50">
        <div className="container mx-auto px-6 text-center max-w-4xl">
           <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Why CareNest?</h2>
           <p className="text-xl text-slate-700 leading-relaxed">
             Caregiving is a team effort. We provide a central digital home where siblings, parents, and caregivers can all stay on the same page—ensuring no medication is missed and every need is met.
           </p>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900">Everything your family needs</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:shadow-lg transition duration-300">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors duration-300">
                <Users className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Family Hub</h3>
              <p className="text-lg text-slate-600">
                Add family members to the dashboard. Everyone gets updates, so the whole family shares the responsibility.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-blue-200 hover:shadow-lg transition duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                <Activity className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Health Tracking</h3>
              <p className="text-lg text-slate-600">
                Log vitals, mood, and daily activities. Keep a history that you can easily show to doctors during visits.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-purple-200 hover:shadow-lg transition duration-300">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors duration-300">
                <ShieldCheck className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Safe & Secure</h3>
              <p className="text-lg text-slate-600">
                Your family's data is private. We use secure authentication so only invited family members can see details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Simplified) --- */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-12 items-center">
                <div className="md:w-1/2">
                      <div className="space-y-8">
                         <h2 className="text-4xl font-bold text-slate-900">Simple for everyone.</h2>
                         <p className="text-xl text-slate-600">We designed the app to be easy enough for non-tech-savvy elders, yet powerful enough for family management.</p>
                         
                         <div className="space-y-4">
                             <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                                 <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-full font-bold">1</span>
                                 <span className="text-lg font-medium text-slate-800">Create a family account</span>
                             </div>
                             <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                                 <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-full font-bold">2</span>
                                 <span className="text-lg font-medium text-slate-800">Set up medications & reminders</span>
                             </div>
                             <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                                 <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-full font-bold">3</span>
                                 <span className="text-lg font-medium text-slate-800">Elder logs in to "Simple Mode"</span>
                             </div>
                         </div>
                      </div>
                </div>
                <div className="md:w-1/2">
                    {/* Placeholder for Interface screenshot */}
                     <div className="aspect-video bg-white rounded-2xl shadow-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                        <img className="object-cover w-full h-full" src="images/Appimage.png" alt="CareNest Interface Screenshot"/>
                     </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- BOTTOM CTA --- */}
      <section className="py-20 bg-emerald-900 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Start caring today</h2>
          <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
            Bring your family together on CareNest.
          </p>

          {!user && (
            <Link href="/Signup" className="inline-block px-12 py-5 bg-white text-emerald-900 text-xl font-bold rounded-full hover:bg-emerald-50 shadow-2xl transition transform hover:scale-105">
              Get Started
            </Link>
          )}

          {user && (
            <Link href={gotoDashboardHref()} className="inline-block px-12 py-5 bg-white text-emerald-900 text-xl font-bold rounded-full hover:bg-emerald-50 shadow-2xl transition transform hover:scale-105">
              Go to Your Dashboard →
            </Link>
          )}
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
               <Heart className="w-6 h-6 text-emerald-500" />
               <span className="text-xl font-bold text-white">CareNest</span>
          </div>
          <div className="text-center md:text-right">
            <p className="mb-2">Made with love for elders everywhere.</p>
            <p className="text-sm text-white">By Prince Kr Yadav</p>
          </div>
        </div>
        <div className="text-center text-sm text-slate-600 py-4 border-t border-slate-800 mt-8">
            &copy; {new Date().getFullYear()} CareNest. All rights reserved.
        </div>
      </footer>
    </div>
  );
}