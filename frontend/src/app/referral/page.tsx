"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api, Provider, AssessmentSummary } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function ReferralPage() {
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [latestAssessment, setLatestAssessment] = useState<AssessmentSummary | null>(null);

  useEffect(() => {
    loadProviders();
    if (isAuthenticated) {
      loadLatestAssessment();
    }
  }, [selectedDivision, isAuthenticated]);

  async function loadProviders() {
    setIsLoading(true);
    try {
      const res = await api.getProviders(selectedDivision, searchQuery);
      setProviders(res.providers || []);
    } catch (e) {
      console.error("Failed to load providers", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadLatestAssessment() {
    try {
      const history = await api.getAssessmentHistory();
      if (history.length > 0) {
        setLatestAssessment(history[0]);
      }
    } catch (e) {
      // Non-critical
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProviders();
  };

  return (
    <div className="min-h-screen bg-[#f0f8fb] text-[#192531] pb-24">
      {/* Header Banner */}
      <section className="bg-white border-b border-[#d6e8f0] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2b7f8f] bg-[#eaf4f8] px-3 py-1 rounded-full mb-2">
              <span className="material-symbols-outlined text-sm">local_hospital</span>
              <span>{language === "bn" ? "যাচাইকৃত হাসপাতাল ও বিশেষজ্ঞ ডিরেক্টরি" : "Verified Clinical Provider Directory"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#192531] tracking-tight font-headline">
              {language === "bn" ? "চর্মরোগ বিশেষজ্ঞ ও ক্লিনিকাল রেফারেল" : "Dermatology Centers & Doctor Referrals"}
            </h1>
            <p className="text-sm text-[#4a5d6e] mt-1 max-w-2xl leading-relaxed">
              {language === "bn"
                ? "বাংলাদেশে যাচাইকৃত সরকারি ও বিশেষায়িত চর্মরোগ বহির্বিভাগের তথ্য জানুন এবং সরাসরি যোগাযোগের জন্য আপনার ক্লিনিকাল সারাংশ (PDF) প্রস্তুত রাখুন।"
                : "Explore verified clinical dermatology departments and outpatient clinics across Bangladesh. Download your structured consultation dossier to share with attending physicians."}
            </p>
          </div>

          {latestAssessment && (
            <div className="bg-[#eaf4f8] border border-[#cce4ee] rounded-2xl p-4 flex items-center gap-3 shrink-0 self-start md:self-auto">
              <span className="material-symbols-outlined text-[#2b7f8f] text-2xl">assignment_turned_in</span>
              <div>
                <div className="text-[10px] font-bold text-[#718292] uppercase tracking-wider">
                  {language === "bn" ? "সর্বশেষ সংরক্ষিত চেক" : "Latest Assessment"}
                </div>
                <div className="text-xs font-bold text-[#192531]">
                  {latestAssessment.primary_condition} ({latestAssessment.anatomical_region})
                </div>
              </div>
              <a
                href={api.getPdfUrl(latestAssessment.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2b7f8f] text-white text-xs font-bold shadow-xs hover:bg-[#236875] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>PDF</span>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Transparent Booking Availability & Referral Notice */}
        <div className="bg-white p-5 rounded-2xl border border-[#d6e8f0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#eaf4f8] text-[#2b7f8f] flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-xl">info</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#192531]">
                {language === "bn" ? "রেফারেল ও পরামর্শ নির্দেশিকা" : "Referral & Appointment Guidance"}
              </h4>
              <p className="text-xs sm:text-sm text-[#4a5d6e] mt-0.5 max-w-3xl leading-relaxed">
                {language === "bn"
                  ? "সরাসরি অ্যাপের মাধ্যমে তাৎক্ষণিক অনলাইন বুকিং বর্তমানে ডিরেক্টরি ও প্রস্তুতি পর্যায়ে রয়েছে। রোগীরা সরাসরি হাসপাতালের বহির্বিভাগ কাউন্টারে যোগাযোগ করতে পারেন অথবা টেলিফোনে অ্যাপয়েন্টমেন্ট নির্ধারণ করতে পারেন।"
                  : "Direct in-app electronic booking is currently in directory phase. Patients can contact the clinic hotlines listed below or present in-person at hospital outpatient registration desks with their downloaded SkinWise Clinical Dossier (PDF)."}
              </p>
            </div>
          </div>
          {latestAssessment && (
            <a
              href={api.getPdfUrl(latestAssessment.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm font-bold text-[#2b7f8f] hover:underline whitespace-nowrap self-end sm:self-center inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              <span>{language === "bn" ? "ডাক্তার সারসংক্ষেপ (PDF) ↗" : "Clinical Dossier (PDF) ↗"}</span>
            </a>
          )}
        </div>

        {/* Search & Division Filters */}
        <div className="bg-white p-5 rounded-2xl border border-[#d6e8f0] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Division Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: language === "bn" ? "সমগ্র বাংলাদেশ" : "All Bangladesh" },
              { id: "dhaka", label: language === "bn" ? "ঢাকা" : "Dhaka" },
              { id: "chittagong", label: language === "bn" ? "চট্টগ্রাম" : "Chittagong" },
              { id: "sylhet", label: language === "bn" ? "সিলেট" : "Sylhet" },
            ].map((div) => (
              <button
                key={div.id}
                type="button"
                onClick={() => setSelectedDivision(div.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedDivision === div.id
                    ? "bg-[#2b7f8f] text-white shadow-xs"
                    : "bg-[#f0f8fb] text-[#4a5d6e] hover:bg-[#eaf4f8] hover:text-[#192531]"
                }`}
              >
                {div.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "bn" ? "হাসপাতাল বা এলাকার নাম খুঁজুন..." : "Search hospital or area..."}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-[#2b7f8f] focus:ring-1 focus:ring-[#2b7f8f] bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#2b7f8f] text-white text-xs font-bold hover:bg-[#236875] transition-colors"
            >
              {language === "bn" ? "খুঁজুন" : "Search"}
            </button>
          </form>
        </div>

        {/* Provider Cards List */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-500">
            <span className="material-symbols-outlined animate-spin text-3xl text-[#2b7f8f] mb-2">progress_activity</span>
            <p className="text-sm">Loading verified healthcare facilities...</p>
          </div>
        ) : providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {providers.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-3xl p-6 border border-[#d6e8f0] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#2b7f8f] transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#eaf4f8] text-[#2b7f8f] border border-[#cce4ee] mb-1">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        <span>{p.type}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#192531] leading-tight">
                        {p.name}
                      </h3>
                      <p className="text-xs text-[#2b7f8f] font-semibold mt-0.5">
                        {p.department}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#4a5d6e] pt-1 border-t border-slate-100">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-sm text-[#718292] shrink-0 mt-0.5">location_on</span>
                      <span>{p.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#718292] shrink-0">schedule</span>
                      <span>{p.opd_hours}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#718292] shrink-0">payments</span>
                      <span>Fee Schedule: <strong className="text-slate-900">{p.consultation_fee_bdt}</strong></span>
                    </div>
                  </div>

                  {/* Services tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.services.slice(0, 3).map((svc, idx) => (
                      <span
                        key={idx}
                        className="bg-[#f0f8fb] text-[#4a5d6e] px-2.5 py-0.5 rounded-lg text-[11px] font-medium border border-[#d6e8f0]"
                      >
                        {svc}
                      </span>
                    ))}
                  </div>

                  {p.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-[#f0f8fb] p-2.5 rounded-xl border border-slate-200">
                      ℹ️ {p.notes}
                    </p>
                  )}
                </div>

                {/* Card Action Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                  <a
                    href={`tel:${p.contact_phone.split("/")[0].trim()}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2b7f8f] hover:bg-[#236875] text-white font-bold transition-colors shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">call</span>
                    <span>{p.contact_phone.split("/")[0].trim()}</span>
                  </a>

                  <span className="text-[11px] text-[#718292] font-medium">
                    {p.booking_mode}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 px-4 bg-white rounded-3xl border border-dashed border-[#d6e8f0] text-center space-y-2">
            <span className="material-symbols-outlined text-3xl text-slate-400">search_off</span>
            <p className="text-sm text-slate-600">
              {language === "bn" ? "কোনো হাসপাতাল বা ক্লিনিক পাওয়া যায়নি।" : "No providers found matching your search criteria."}
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
