"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    role: "family",
    newPassword: "",
    confirmPassword: "",
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch("https://care-nest-backend.vercel.app/reset-password-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setMsg("✅ Password updated successfully. Redirecting to login...");

        setTimeout(() => {
          router.push("/Login");
        }, 2000);
      } else {
        setMsg(data.error || "Password reset failed");
      }
    } catch (err) {
      setMsg("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-blue-700">
          Reset Password
        </h2>

        {/* Email */}
        <input
          type="email"
          name="email"
          placeholder="Registered Email"
          required
          value={form.email}
          onChange={handleChange}
          className="w-full p-3 border rounded-xl"
        />

        {/* Role Selection */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setForm({ ...form, role: "family" })}
            className={`flex-1 p-3 rounded-xl font-bold border ${
              form.role === "family"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Family
          </button>

          <button
            type="button"
            onClick={() => setForm({ ...form, role: "elder" })}
            className={`flex-1 p-3 rounded-xl font-bold border ${
              form.role === "elder"
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Elder
          </button>
        </div>

        {/* New Password */}
        <input
          type="password"
          name="newPassword"
          placeholder="New Password"
          required
          value={form.newPassword}
          onChange={handleChange}
          className="w-full p-3 border rounded-xl"
        />

        {/* Confirm Password */}
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          required
          value={form.confirmPassword}
          onChange={handleChange}
          className="w-full p-3 border rounded-xl"
        />

        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold disabled:opacity-70"
        >
          {loading ? "Updating..." : "Change Password"}
        </button>

        {msg && (
          <p className="text-center font-semibold mt-3 text-green-600">
            {msg}
          </p>
        )}
      </form>
    </div>
  );
}
