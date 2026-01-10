"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, ArrowRight, Loader2, Users, Heart } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('family'); // Default to 'family'

  const [passwordError, setPasswordError] = useState("");

const passwordRegex =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;


  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("https://carenestbackend-1.onrender.com/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // We send the selected role to ensure we verify against the correct account type
        body: JSON.stringify({
          email: email,
          password: password,
          role: role 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 1. Store the Token
        localStorage.setItem("token", data.token);
        
        // 2. Store the User Data
        localStorage.setItem("user", JSON.stringify(data.user));

        // ✅ FIX: Redirect based on the Role returned from Backend
        // This ensures the user goes to the correct dashboard 
        setTimeout(() => {
            if (data.user.role === 'family') {
                router.push("/FamilyPage");
            } else if (data.user.role === 'elder') {
                router.push("/ElderPage");
            } else {
                router.push("/"); // Fallback
            }
        }, 500); // Small delay for UX

      } else {
        alert(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Server error. Is the backend running?");
      alert(data.error);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header Section */}
        <div className="bg-blue-600 p-8 text-white text-center">
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-blue-100 mt-2">Sign in to manage family health</p>
        </div>

        {/* Login Form */}
        <div className="p-8 pt-10">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Email Address</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
               <input 
  type="password" 
  value={password}
  onChange={(e) => {
    const value = e.target.value;
    setPassword(value);

    if (!passwordRegex.test(value)) {
      setPasswordError(
        "Password must contain 1 capital letter, 1 number, 1 symbol & be 8+ characters"
      );
    } else {
      setPasswordError("");
    }
  }}
  placeholder="••••••••"
  required
  className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 transition
    ${passwordError 
      ? "border-red-400 focus:ring-red-400" 
      : "border-slate-200 focus:ring-blue-500"}`}
 />
  {passwordError && (
  <p className="text-red-500 text-xs mt-2 ml-1">
    {passwordError}
  </p>
)}

              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">I am a...</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('family')}
                  className={`py-3 rounded-xl border-2 font-bold transition flex items-center justify-center gap-2
                    ${role === 'family' 
                      ? 'border-blue-600 bg-blue-50 text-blue-700' 
                      : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                >
                  <Users className="w-4 h-4" /> Family
                </button>
                <button
                  type="button"
                  onClick={() => setRole('elder')}
                  className={`py-3 rounded-xl border-2 font-bold transition flex items-center justify-center gap-2
                    ${role === 'elder' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                      : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                >
                  <User className="w-4 h-4" /> Elder
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
  type="submit" 
  disabled={loading || passwordError}
  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
>

              {loading ? <Loader2 className="animate-spin w-5 h-5"/> : "Sign In"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <p className="text-center mt-3 text-gray-500 text-sm">
       <Link
       href="/ForgotPassword"
     className="text-blue-600 font-semibold hover:underline"
     >
    Forgot Password?
      </Link>
      </p>


          {/* Footer */}
          <div className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link href="/Signup" className="text-blue-600 font-bold hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
