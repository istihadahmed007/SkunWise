"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function SettingsPage() {
  const { user, isAuthenticated, loading: authLoading, logout, refreshUser } = useAuth();
  const { language } = useLanguage();
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
      setErrorMessage(err.message || "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExportJson() {
    try {
      const exportData = await api.exportCompleteData();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skinwise_complete_export_${user?.id || "user"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Failed to export complete data: " + err.message);
    }
  }

  async function handlePurgeAccount() {
    if (purgeInput !== "DELETE MY DATA") {
      alert("Please type 'DELETE MY DATA' exactly as shown to confirm.");
      return;
    }

    try {
      setIsPurging(true);
      await api.deleteAccount();
      logout();
      router.push("/auth");
    } catch (err: any) {
      alert("Failed to delete account: " + err.message);
      setIsPurging(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f8fb] text-slate-800 pb-24">
      {/* Header Banner */}
      <section className="bg-white border-b border-[#d1e5ec] py-8 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2b7f8f] bg-[#eaf4f8] px-3 py-1 rounded-full mb-3">
            <span className="material-symbols-outlined text-sm">shield</span>
            <span>{language === "bn" ? "প্রাইভেসি ও নিয়ন্ত্রণ" : "Privacy & Controls"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {language === "bn" ? "অ্যাকাউন্ট ও গোপনীয়তা সেটিংস" : "Account & Privacy Settings"}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
            {language === "bn"
              ? "আপনার প্রোফাইল, ছবির গোপনীয়তা, ডাটা সংরক্ষণ সময়কাল এবং এক্সপোর্ট নিয়ন্ত্রণ করুন।"
              : "Manage your profile, photo retention rules, data storage timeframe, and personal exports."}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Status feedback */}
          {saveSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">verified</span>
              <span>Your privacy preferences were successfully saved.</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Profile */}
          <div className="bg-white rounded-2xl border border-[#d1e5ec] p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
              <span className="material-symbols-outlined text-[#2b7f8f]">person</span>
              <span>Your Profile</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#2b7f8f] focus:ring-1 focus:ring-[#2b7f8f] text-sm text-slate-900 bg-white"
                  placeholder="e.g. Sarah Jenkins"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 bg-slate-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Account ID: <span className="font-mono font-medium text-slate-700">#{user?.id || 101}</span></span>
              <span>Joined: <span className="font-medium text-slate-700">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Active"}</span></span>
            </div>
          </div>

          {/* Section 2: Photo Scrubbing & Retention */}
          <div className="bg-white rounded-2xl border border-[#d1e5ec] p-6 shadow-xs">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2b7f8f]">photo_filter</span>
                  <span>Delete uploaded photo immediately after analysis</span>
                </h2>
                <p className="text-sm text-slate-600 mt-1 max-w-xl">
                  When enabled, your uploaded photograph is processed on the server to extract visual observations and then immediately deleted from server storage. Non-image symptom notes, responses, and care guidance remain in your account until you delete them.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={zeroCloud}
                  onChange={(e) => setZeroCloud(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2b7f8f]"></div>
              </label>
            </div>

            {/* Retention Horizon */}
            <div className="mt-5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assessment History Retention Period
              </label>
              <p className="text-sm text-slate-500 mb-3">
                Choose how long your past skin check records remain saved in your account before automatic cleanup.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 30, label: "30 Days", desc: "Short-term tracking" },
                  { value: 90, label: "90 Days", desc: "Seasonal follow-up" },
                  { value: 365, label: "1 Year", desc: "Annual history" },
                  { value: 0, label: "Indefinite", desc: "Keep until deleted" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRetentionDays(option.value)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      retentionDays === option.value
                        ? "border-[#2b7f8f] bg-[#eaf4f8] ring-1 ring-[#2b7f8f]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-900">{option.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Opt-In Telemetry Toggle */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Anonymous Model Quality Feedback</h4>
                <p className="text-xs text-slate-500 mt-0.5 max-w-lg">
                  Help improve AI pattern identification across diverse skin tones by sharing fully anonymized observation metrics.
                </p>
              </div>

              <input
                type="checkbox"
                checked={aiTelemetryOptIn}
                onChange={(e) => setAiTelemetryOptIn(e.target.checked)}
                className="w-4 h-4 text-[#2b7f8f] rounded border-slate-300 focus:ring-[#2b7f8f]"
              />
            </div>
          </div>

          {/* Section 3: Data Export */}
          <div className="bg-white rounded-2xl border border-[#d1e5ec] p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
              <span className="material-symbols-outlined text-[#2b7f8f]">download</span>
              <span>Export Your Data</span>
            </h2>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-700">
                  Download all recorded skin assessments, symptom questionnaire responses, and care guidance.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Saved as a structured JSON file that you can easily view or share with your doctor.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold transition-all whitespace-nowrap self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>Download JSON</span>
              </button>
            </div>
          </div>

          {/* Save Changes Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#2b7f8f] hover:bg-[#236875] text-white text-sm font-bold shadow-xs transition-all disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Preferences"}
            </button>
          </div>

          {/* Danger Zone: Account Deletion */}
          <div className="bg-rose-50/60 rounded-2xl border border-rose-200 p-6 shadow-xs mt-10">
            <h2 className="text-base font-bold text-rose-800 flex items-center gap-2 pb-3 border-b border-rose-200">
              <span className="material-symbols-outlined text-rose-600">delete_forever</span>
              <span>Delete Account & Data</span>
            </h2>

            <p className="text-sm text-rose-900 mt-3 leading-relaxed">
              Permanently delete your account, saved assessment logs, and uploaded files. Once confirmed, this data cannot be recovered.
            </p>

            <button
              type="button"
              onClick={() => setShowPurgeModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-xs transition-all"
            >
              Delete My Account
            </button>
          </div>
        </form>

        {/* Purge Confirmation Modal */}
        {showPurgeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <h3 className="text-lg font-bold text-center text-slate-900">Confirm Account Deletion</h3>
              <p className="text-sm text-slate-600 text-center mt-2 leading-relaxed">
                This will delete your account and all saved assessments permanently. Type <span className="font-mono font-bold text-rose-600">DELETE MY DATA</span> below to confirm.
              </p>

              <input
                type="text"
                value={purgeInput}
                onChange={(e) => setPurgeInput(e.target.value)}
                placeholder="DELETE MY DATA"
                className="mt-4 w-full px-4 py-2.5 rounded-xl border border-slate-300 text-center font-mono text-sm uppercase text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
              />

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPurgeModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={purgeInput !== "DELETE MY DATA" || isPurging}
                  onClick={handlePurgeAccount}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-xs disabled:opacity-50"
                >
                  {isPurging ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
