"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { api, AssessmentSummary } from "@/lib/api";
import { EmergencyModal } from "@/components/EmergencyModal";

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmergency, setShowEmergency] = useState(false);

  useEffect(() => {
    api
      .getAssessmentHistory()
      .then((data) => {
        setAssessments(data);
      })
      .catch((err) => {
        console.error("Failed to load assessments", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const userName = user?.full_name ? user.full_name.split(" ")[0] : "there";

  return (
    <div className="min-h-screen bg-[#f0f8fb] text-slate-800 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Top Header Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#d1e5ec] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2b7f8f] bg-[#eaf4f8] px-3 py-1 rounded-full">
              <span className="material-symbols-outlined text-sm">health_and_safety</span>
              <span>{language === "bn" ? "ব্যক্তিগত স্বাস্থ্য ড্যাশবোর্ড" : "Personal Health Portal"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {language === "bn" ? `স্বাগতম, ${userName}` : `Welcome back, ${userName}`}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl">
              {language === "bn"
                ? "আপনার ত্বকের নিরীক্ষণ রেকর্ড এবং সাধারণ ত্বকের যত্নের নির্দেশিকা এক নজরে দেখুন।"
                : "Review your saved skin observations, general skincare guidance, and next steps."}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <Link
              href="/assess"
              className="inline-flex items-center gap-2 bg-[#2b7f8f] hover:bg-[#236875] text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-base">add_a_photo</span>
              <span>{t.analyzeSkinBtn}</span>
            </Link>
            <button
              onClick={() => setShowEmergency(true)}
              className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-3 rounded-2xl text-xs font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-base">emergency</span>
              <span>{t.emergencyBtn}</span>
            </button>
          </div>
        </div>

        {/* Medical Boundary Notice */}
        <div className="bg-white p-5 rounded-2xl border border-[#d1e5ec] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#eaf4f8] text-[#2b7f8f] flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-xl">info</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {language === "bn" ? "অ-চিকিৎসাগত তথ্যমূলক বিজ্ঞপ্তি" : "Informational & Non-Diagnostic Notice"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-3xl leading-relaxed">
                {language === "bn"
                  ? "স্কিনওয়াইজ এআই কোনো রোগ নির্ণয় করে না। এটি শুধুমাত্র দৃশ্যমান প্যাটার্ন সম্পর্কিত তথ্য এবং সাধারণ যত্ন নির্দেশিকা প্রদান করে।"
                  : "SkinWise AI does not diagnose medical conditions. It provides visual observations and general supportive guidance to help you prepare for a medical consultation."}
              </p>
            </div>
          </div>
          <Link
            href="/referral"
            className="text-xs sm:text-sm font-bold text-[#2b7f8f] hover:underline whitespace-nowrap self-end sm:self-center"
          >
            {language === "bn" ? "তথ্য জানুন →" : "Read Full Policy →"}
          </Link>
        </div>

        {/* Primary Action Hero Banner */}
        <div className="bg-gradient-to-br from-[#2b7f8f] to-[#1e5863] rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <span className="bg-white/20 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block">
              {language === "bn" ? "দ্রুত ত্বক নিরীক্ষণ" : "Simple 3-Step Check"}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {language === "bn" ? "নতুন কোনো ত্বকের দাগ বা র্যাশ লক্ষ্য করেছেন?" : "Have a new or changing skin spot?"}
            </h2>
            <p className="text-sm text-white/90 leading-relaxed">
              {language === "bn"
                ? "একটি স্পষ্ট ছবি তুলুন, কয়েকটি সহজ প্রশ্নের উত্তর দিন এবং নিরাপদ ত্বকের যত্ন নির্দেশিকা পান।"
                : "Take a clear photo, answer a few symptom questions, and receive supportive general care guidance and advice on when to see a doctor."}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-white/80">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                Takes ~2 minutes
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">lock</span>
                Private & confidential
              </span>
            </div>
          </div>

          <Link
            href="/assess"
            className="bg-white hover:bg-[#f0f8fb] text-[#2b7f8f] px-6 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all shrink-0 self-start md:self-center flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">photo_camera</span>
            <span>{t.analyzeSkinBtn}</span>
          </Link>
        </div>

        {/* Recent Assessments Section */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#d1e5ec] shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {language === "bn" ? "সাম্প্রতিক ত্বকের নিরীক্ষণ" : "Recent Skin Observations"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {language === "bn"
                  ? "আপনার সাম্প্রতিক নিরীক্ষণ ও সংরক্ষিত নির্দেশিকা"
                  : "Your recent checks, observed visible patterns, and care guidance."}
              </p>
            </div>
            <Link
              href="/records"
              className="text-xs sm:text-sm font-bold text-[#2b7f8f] hover:underline"
            >
              {language === "bn" ? "সবগুলো দেখুন →" : "View All Records →"}
            </Link>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-500">
              <span className="material-symbols-outlined animate-spin text-3xl text-[#2b7f8f] mb-2">progress_activity</span>
              <p className="text-sm">Loading your records...</p>
            </div>
          ) : assessments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {assessments.slice(0, 4).map((assessment) => (
                <div
                  key={assessment.id}
                  className="bg-[#f0f8fb] p-5 rounded-2xl border border-[#d1e5ec] flex flex-col justify-between space-y-4 hover:border-[#2b7f8f] transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Check #{assessment.id}</span>
                      <span>{new Date(assessment.created_at).toLocaleDateString()}</span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        {assessment.primary_condition || "Skin Pattern Observation"}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2">
                        {assessment.anatomical_region ? `Location: ${assessment.anatomical_region}` : "General supportive care and routine monitoring recommended."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200">
                        <span className="w-2 h-2 rounded-full bg-[#2b7f8f]" />
                        {assessment.triage_title || "General Care"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
                    <Link
                      href={`/assessment/${assessment.id}`}
                      className="font-bold text-[#2b7f8f] hover:underline flex items-center gap-1"
                    >
                      <span>View Full Assessment</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                    <Link
                      href="/referral"
                      className="text-slate-500 hover:text-slate-800 font-medium"
                    >
                      Print Summary
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-10 px-4 bg-[#f0f8fb] rounded-2xl border border-dashed border-[#d1e5ec] space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white text-[#2b7f8f] flex items-center justify-center mx-auto shadow-xs">
                <span className="material-symbols-outlined text-3xl">photo_camera</span>
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  {language === "bn" ? "এখনও কোনো ত্বকের রেকর্ড নেই" : "No Skin Checks Recorded Yet"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {language === "bn"
                    ? "আপনার প্রথম নিরীক্ষণ শুরু করুন। একটি ভালো আলোয় তোলা ছবি ব্যবহার করুন।"
                    : "Start your first skin observation. Take a clear, in-focus photograph of any skin concern you wish to inspect."}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/assess"
                  className="inline-flex items-center gap-2 bg-[#2b7f8f] hover:bg-[#236875] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-base">add_a_photo</span>
                  <span>{t.analyzeSkinBtn}</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Navigation Cards */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            {language === "bn" ? "গুরুত্বপূর্ণ লিংকসমূহ" : "Quick Navigation"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/assess"
              className="bg-white p-5 rounded-2xl border border-[#d1e5ec] shadow-xs hover:border-[#2b7f8f] transition-all flex flex-col justify-between group space-y-3"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#eaf4f8] text-[#2b7f8f] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-xl">biotech</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">Analyze Skin Concern</h4>
                <p className="text-xs sm:text-sm text-slate-500">
                  Upload a photo and answer symptom questions for guidance.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-[#2b7f8f] font-bold pt-2">
                <span>Start Check</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>

            <Link
              href="/records"
              className="bg-white p-5 rounded-2xl border border-[#d1e5ec] shadow-xs hover:border-[#2b7f8f] transition-all flex flex-col justify-between group space-y-3"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#eaf4f8] text-[#2b7f8f] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-xl">history</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">History & Timeline</h4>
                <p className="text-xs sm:text-sm text-slate-500">
                  Review all your past checks and compare visible changes over time.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-[#2b7f8f] font-bold pt-2">
                <span>View History</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>

            <Link
              href="/referral"
              className="bg-white p-5 rounded-2xl border border-[#d1e5ec] shadow-xs hover:border-[#2b7f8f] transition-all flex flex-col justify-between group space-y-3"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#eaf4f8] text-[#2b7f8f] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-xl">assignment</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">Doctor Discussion Guide</h4>
                <p className="text-xs sm:text-sm text-slate-500">
                  Export structured notes to share with your healthcare provider.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-[#2b7f8f] font-bold pt-2">
                <span>Doctor Guide</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>

            <Link
              href="/settings"
              className="bg-white p-5 rounded-2xl border border-[#d1e5ec] shadow-xs hover:border-[#2b7f8f] transition-all flex flex-col justify-between group space-y-3"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#eaf4f8] text-[#2b7f8f] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-xl">shield</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">Privacy & Settings</h4>
                <p className="text-xs sm:text-sm text-slate-500">
                  Control photo retention, data scrubbing, and download your data.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-[#2b7f8f] font-bold pt-2">
                <span>Manage Privacy</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>
          </div>
        </div>

      </div>

      <EmergencyModal isOpen={showEmergency} onClose={() => setShowEmergency(false)} />
    </div>
  );
}
