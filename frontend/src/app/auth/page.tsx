"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export default function AuthPage() {
  const router = useRouter();
  const { login } = useAuth();
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
          setError("You must acknowledge both clinical biometric and non-diagnostic disclaimers to proceed.");
          setIsLoading(false);
          return;
        }

        const res = await api.register({
          email,
          password,
          full_name: fullName || "Patient User",
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
    setEmail("sarah.patient@skinwise.local");
    setPassword("ClinicalDemo2026!");
    setIsRegister(false);
  };

  return (
    <div className="max-w-md mx-auto px-gutter py-space-xl">
      <div className="bg-surface-container-lowest p-space-lg sm:p-space-xl rounded-3xl shadow-xl border border-surface-container-high space-y-space-md">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary mx-auto flex items-center justify-center font-bold text-xl shadow-sm mb-2">
            <span className="material-symbols-outlined text-2xl">biotech</span>
          </div>
          <h1 className="font-headline font-bold text-2xl text-on-surface">
            {isRegister ? "Create Clinical Account" : "Sign In to SkinWise"}
          </h1>
          <p className="text-xs text-on-surface-variant">
            {isRegister
              ? "Enroll for private, encrypted dermatological triage"
              : "Access your lesion assessments and doctor referrals"}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-surface-container-low p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg font-headline text-xs font-semibold transition-all ${
              !isRegister
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
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
            className={`flex-1 py-2 rounded-lg font-headline text-xs font-semibold transition-all ${
              isRegister
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Register
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-error-container/40 border border-error/30 text-on-error-container p-3 rounded-xl text-xs flex items-start gap-2">
            <span className="material-symbols-outlined text-base text-error mt-0.5 shrink-0">
              error
            </span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-space-md">
          {isRegister && (
            <div>
              <label className="block text-xs font-headline font-semibold text-on-surface mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. / Patient Name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container-highest bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patient@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container-highest bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-headline font-semibold text-on-surface mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container-highest bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>

          {/* Registration Disclaimers */}
          {isRegister && (
            <div className="space-y-3 pt-1 border-t border-surface-container-high">
              <label className="flex items-start gap-2 cursor-pointer text-xs text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={consentBiometric}
                  onChange={(e) => setConsentBiometric(e.target.checked)}
                  className="mt-0.5 rounded border-surface-container-highest text-primary focus:ring-primary"
                />
                <span>
                  <strong className="text-on-surface">Biometric Intake Consent:</strong> I authorize client-side anonymization and optical vision processing of my skin photography.
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer text-xs text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={consentDisclaimer}
                  onChange={(e) => setConsentDisclaimer(e.target.checked)}
                  className="mt-0.5 rounded border-surface-container-highest text-primary focus:ring-primary"
                />
                <span>
                  <strong className="text-on-surface">SaMD CE Class I Boundary:</strong> I understand SkinWise AI provides pre-consultation decision support, not an automated definitive diagnosis.
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-primary hover:bg-secondary text-on-primary font-headline text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>{isRegister ? "Agree & Create Account" : "Sign In to Portal"}</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Auto-Fill Pill */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={handleDemoFill}
            className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">key</span>
            <span>Auto-fill Demo Patient Account (Sarah Jenkins)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

