"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";

export default function AuthPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { language } = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [consentBiometric, setConsentBiometric] = useState(true);
  const [consentDisclaimer, setConsentDisclaimer] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        if (!consentBiometric || !consentDisclaimer) {
          setError("Please agree to the photo privacy and non-diagnostic notices to create an account.");
          setIsLoading(false);
          return;
        }

        const res = await api.register({
          email,
          password,
          full_name: fullName || "User",
          consent_biometric: consentBiometric,
          consent_disclaimer: consentDisclaimer,
        });

        login(res.access_token, {
          id: res.user_id,
          email: res.email,
          full_name: res.full_name,
          zero_cloud_retention: res.zero_cloud_retention,
          data_retention_days: 90,
          created_at: new Date().toISOString(),
        });

        router.push("/dashboard");
      } else {
        const res = await api.login({ email, password });
        login(res.access_token, {
          id: res.user_id,
          email: res.email,
          full_name: res.full_name,
          zero_cloud_retention: res.zero_cloud_retention,
          data_retention_days: 90,
          created_at: new Date().toISOString(),
        });
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // Demo auto-fill helper for instant evaluation
  const handleDemoFill = () => {
    setEmail("sarah.jenkins@example.com");
    setPassword("SkinWise2026!");
    setIsRegister(false);
  };

  return (
    <div className="min-h-screen bg-[#f0f8fb] flex items-center justify-center px-4 py-12">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#d1e5ec] max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#eaf4f8] text-[#2b7f8f] mx-auto flex items-center justify-center font-bold text-xl shadow-xs">
            <span className="material-symbols-outlined text-2xl">health_and_safety</span>
          </div>
          <h1 className="font-extrabold text-2xl text-slate-900">
            {isRegister
              ? language === "bn" ? "অ্যাকাউন্ট তৈরি করুন" : "Create Account"
              : language === "bn" ? "সাইন ইন করুন" : "Sign In to SkinWise"}
          </h1>
          <p className="text-sm text-slate-600">
            {isRegister
              ? "Track your skin observations and save personalized skincare guidance"
              : "Access your saved skin checks and doctor discussion summaries"}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#f0f8fb] p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              !isRegister
                ? "bg-white text-[#2b7f8f] shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              isRegister
                ? "bg-white text-[#2b7f8f] shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Register
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-base text-rose-600 mt-0.5 shrink-0">
              error
            </span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sarah Jenkins"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#2b7f8f] focus:border-[#2b7f8f]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#2b7f8f] focus:border-[#2b7f8f]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#2b7f8f] focus:border-[#2b7f8f]"
            />
          </div>

          {/* Registration Disclaimers */}
          {isRegister && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 leading-relaxed">
                <input
                  type="checkbox"
                  checked={consentBiometric}
                  onChange={(e) => setConsentBiometric(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#2b7f8f] focus:ring-[#2b7f8f]"
                />
                <span>
                  <strong className="text-slate-800">Photo Processing Consent:</strong> I agree to allow SkinWise AI to process uploaded skin images to extract visible characteristics.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 leading-relaxed">
                <input
                  type="checkbox"
                  checked={consentDisclaimer}
                  onChange={(e) => setConsentDisclaimer(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#2b7f8f] focus:ring-[#2b7f8f]"
                />
                <span>
                  <strong className="text-slate-800">Non-Diagnostic Notice:</strong> I understand SkinWise AI provides informational guidance only and is not a medical diagnosis.
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#2b7f8f] hover:bg-[#236875] text-white text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                <span>Connecting...</span>
              </>
            ) : (
              <span>{isRegister ? "Agree & Create Account" : "Sign In"}</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Auto-Fill */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={handleDemoFill}
            className="text-xs text-[#2b7f8f] hover:underline font-semibold inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">key</span>
            <span>Use Demo Account (Sarah Jenkins)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
