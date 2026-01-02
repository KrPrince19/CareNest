"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "family",
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // 🔐 Password rules: 1 Capital, 1 Number, 1 Symbol, 8+ chars
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setMsg("");

    if (passwordError) {
      setMsg("Please fix password errors before submitting");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("https://care-nest-backend.vercel.app/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        setMsg("Account created successfully! Redirecting...");

        setTimeout(() => {
          if (form.role === "family") {
            router.push("/FamilyPage");
          } else {
            router.push("/ElderPage");
          }
        }, 1000);
      } else {
        setMsg(data?.error || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setMsg("Network error — backend not reachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 border border-white/50">
        
        <h1 className="text-3xl font-bold text-blue-700 text-center mb-2">
          Welcome to CareNest
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Create your account to get started
        </p>

        <form className="space-y-4" onSubmit={handleSignup}>
          
          {/* Full Name */}
          <div>
            <label className="block font-medium mb-1 text-slate-700">
              Full Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
              className="w-full p-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-medium mb-1 text-slate-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full p-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block font-medium mb-1 text-slate-700">
              Password
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={(e) => {
                const value = e.target.value;
                setForm((prev) => ({ ...prev, password: value }));

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
              className={`w-full p-3 rounded-xl border bg-slate-50 focus:outline-none focus:ring-2 transition
                ${
                  passwordError
                    ? "border-red-400 focus:ring-red-400"
                    : "border-slate-200 focus:ring-blue-500"
                }`}
            />

            {passwordError && (
              <p className="text-red-500 text-xs mt-2 ml-1">
                {passwordError}
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block font-medium mb-1 text-slate-700">
              Select Role
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, role: "family" }))
                }
                className={`flex-1 p-3 rounded-xl border font-bold transition ${
                  form.role === "family"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-white"
                }`}
              >
                Family
              </button>

              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, role: "elder" }))
                }
                className={`flex-1 p-3 rounded-xl border font-bold transition ${
                  form.role === "elder"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-white"
                }`}
              >
                Elder
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || passwordError}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Create Account"
            )}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>

          {msg && (
            <div
              className={`text-center mt-4 text-sm font-semibold ${
                msg.includes("success")
                  ? "text-emerald-600"
                  : "text-red-500"
              }`}
            >
              {msg}
            </div>
          )}
        </form>

        <p className="text-center mt-8 text-gray-500 text-sm">
          Already have an account?{" "}
          <Link
            href="/Login"
            className="text-blue-600 font-bold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
