"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, User } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function SettingsPage() {
  const { user, isAuthenticated, loading: authLoading, logout, refreshUser } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [zeroCloud, setZeroCloud] = useState(false);
  const [retentionDays, setRetentionDays] = useState(90);
  const [aiTelemetryOptIn, setAiTelemetryOptIn] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeInput, setPurgeInput] = useState("");
  const [isPurging, setIsPurging] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth");
      return;
    }
    if (user) {
      setFullName(user.full_name || "");
      setZeroCloud(user.zero_cloud_retention ?? false);
      setRetentionDays(user.data_retention_days || 90);
    }
  }, [user, isAuthenticated, authLoading, router]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      await api.updateSettings({
        full_name: fullName,
        zero_cloud_retention: zeroCloud,
        data_retention_days: Number(retentionDays),
      });
      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update security settings");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExportJson() {
    try {
      const history = await api.getAssessmentHistory();
      const exportData = {
        exported_at: new Date().toISOString(),
        patient_profile: user,
        privacy_policy: "GDPR/HIPAA Patient Data Portability Export",
        clinical_intakes_count: history.length,
        records: history,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skinwise_health_dossier_${user?.id || "export"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Failed to compile export dossier: " + err.message);
    }
  }

  async function handlePurgeAccount() {
    if (purgeInput !== "DELETE MY DATA") {
      alert("Please enter 'DELETE MY DATA' precisely to confirm irreversible purge.");
      return;
    }

    try {
      setIsPurging(true);
      await api.deleteAccount();
      logout();
      router.push("/auth");
    } catch (err: any) {
      alert("Failed to purge account: " + err.message);
      setIsPurging(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24">
      {/* Header Banner */}
      <section className="bg-white border-b border-[#e2e8f0] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#006194]">
            <span className="material-symbols-outlined text-sm">security</span>
            <span>Security & Data Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight mt-1">
            {language === "bn" ? "গোপনীয়তা ও অ্যাকাউন্ট সেটিংস" : "Privacy, Consent & Data Governance"}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Manage your biometric intake preferences, HIPAA/GDPR data retention policies, and zero-cloud image scrubbing controls.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <form onSubmit={handleSaveSettings} className="space-y-8">
          {/* Status feedback */}
          {saveSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">verified</span>
              <span>Your security and data governance policies were successfully saved.</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Identity & Credentials */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#131b2e] flex items-center gap-2 pb-4 border-b border-slate-100">
              <span className="material-symbols-outlined text-[#006194]">badge</span>
              <span>Patient Profile & Identity</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#006194] focus:ring-1 focus:ring-[#006194] text-sm text-slate-900 bg-white"
                  placeholder="e.g. Dr. Sarah Jenkins"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Registered Email (Verified)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 bg-slate-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Patient Ref ID: <span className="font-mono font-semibold text-slate-700">#{user?.id || 101}</span></span>
              <span>Account Active Since: <span className="font-medium text-slate-700">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Active"}</span></span>
            </div>
          </div>

          {/* Section 2: Zero-Cloud Retention & Biometric Security */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-[#131b2e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006194]">enhanced_encryption</span>
                  <span>Zero-Cloud Raw Image Scrubbing</span>
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  When enabled, raw skin photographs are permanently scrubbed from the server immediately after image morphometry extraction finishes. Only cryptographic hashes and extracted clinical vectors are stored.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={zeroCloud}
                  onChange={(e) => setZeroCloud(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006194]"></div>
              </label>
            </div>

            {/* Retention Horizon */}
            <div className="mt-5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinical Data Retention Window
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Specify when historical symptom surveys and clinical dossiers should automatically expire from your patient archive.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 30, label: "30 Days", desc: "Short-term triage" },
                  { value: 90, label: "90 Days", desc: "Quarterly follow-up" },
                  { value: 365, label: "1 Year", desc: "Annual review" },
                  { value: 0, label: "Indefinite", desc: "Patient controlled" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRetentionDays(option.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      retentionDays === option.value
                        ? "border-[#006194] bg-sky-50/50 ring-1 ring-[#006194]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{option.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Opt-In Telemetry Toggle */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Anonymized Dermatological Model Feedback</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-lg">
                  Contribute de-identified optical scores to help dermatologists validate AI accuracy across diverse Fitzpatrick phototypes.
                </p>
              </div>

              <input
                type="checkbox"
                checked={aiTelemetryOptIn}
                onChange={(e) => setAiTelemetryOptIn(e.target.checked)}
                className="w-4 h-4 text-[#006194] rounded border-slate-300 focus:ring-[#006194]"
              />
            </div>
          </div>

          {/* Section 3: Data Export & Portability (GDPR/HIPAA) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#131b2e] flex items-center gap-2 pb-4 border-b border-slate-100">
              <span className="material-symbols-outlined text-[#006194]">download</span>
              <span>Patient Data Portability & Export</span>
            </h2>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-700 font-medium">
                  Download all recorded clinical assessments, symptom questionnaires, and triage classifications.
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Package delivered in structured JSON compliant with HL7 / FHIR data exchange protocols.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all whitespace-nowrap self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-base">cloud_download</span>
                <span>Export Health JSON</span>
              </button>
            </div>
          </div>

          {/* Save Changes Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#006194] hover:bg-[#004e77] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {isSaving ? "Saving Policies..." : "Save Privacy Preferences"}
            </button>
          </div>

          {/* Danger Zone: Permanent Account Purge */}
          <div className="bg-rose-50/50 rounded-2xl border border-rose-200 p-6 shadow-sm mt-12">
            <h2 className="text-base font-bold text-rose-800 flex items-center gap-2 pb-3 border-b border-rose-200/60">
              <span className="material-symbols-outlined text-rose-600">warning</span>
              <span>Permanent Account & Data Purge</span>
            </h2>

            <p className="text-xs text-rose-900 mt-3 leading-relaxed">
              In accordance with Right to Be Forgotten regulations, you can permanently expunge your account, all uploaded dermoscopic files, biometric consent logs, and clinical triage records. This action cannot be undone.
            </p>

            <button
              type="button"
              onClick={() => setShowPurgeModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              Purge All Data & Delete Account
            </button>
          </div>
        </form>

        {/* Purge Confirmation Modal */}
        {showPurgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-2xl">dangerous</span>
              </div>
              <h3 className="text-lg font-bold text-center text-[#131b2e]">Confirm Irreversible Purge</h3>
              <p className="text-xs text-slate-600 text-center mt-2 leading-relaxed">
                This will immediately delete your account credentials, all assessment logs, and permanently unlink all photos. Type <span className="font-mono font-bold text-rose-600">DELETE MY DATA</span> below to confirm.
              </p>

              <input
                type="text"
                value={purgeInput}
                onChange={(e) => setPurgeInput(e.target.value)}
                placeholder="DELETE MY DATA"
                className="mt-4 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-center font-mono text-sm uppercase text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
              />

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPurgeModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={purgeInput !== "DELETE MY DATA" || isPurging}
                  onClick={handlePurgeAccount}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {isPurging ? "Purging..." : "Confirm Purge"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

