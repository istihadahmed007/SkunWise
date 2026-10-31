"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { api, AssessmentSummary } from "@/lib/api";
import { EmergencyModal } from "@/components/EmergencyModal";

interface RoutineTask {
  id: number;
  titleEn: string;
  titleBn: string;
  done: boolean;
  time: string;
}

const DEFAULT_ROUTINE_TASKS: RoutineTask[] = [
  { id: 1, titleEn: "Monthly ABCDE Mole Self-Exam", titleBn: "মাসিক আঁচিল ও তিলের স্ব-নিরীক্ষণ", done: false, time: "Every 30 days" },
  { id: 2, titleEn: "Daily Broad-Spectrum SPF 30+ Routine", titleBn: "দৈনিক সানস্ক্রিন ও ত্বক সুরক্ষা", done: false, time: "Every morning" },
  { id: 3, titleEn: "Skin Barrier & Moisture Check", titleBn: "ত্বকের আর্দ্রতা ও সুরক্ষা পরীক্ষা", done: false, time: "Weekly" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmergency, setShowEmergency] = useState(false);

  // Calendar state with working month navigation
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<number>(new Date().getDate());

  // Interactive routine checklist state with localStorage persistence
  const [routineTasks, setRoutineTasks] = useState<RoutineTask[]>(DEFAULT_ROUTINE_TASKS);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("skinwise_routine_tasks");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRoutineTasks(parsed);
          }
        }
      } catch {
        // Fallback to default
      }
    }
  }, []);

  const toggleTask = (id: number) => {
    setRoutineTasks((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("skinwise_routine_tasks", JSON.stringify(updated));
        } catch {
          // ignore storage quota errors
        }
      }
      return updated;
    });
  };

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

  // Safe dynamic username
  const userName = useMemo(() => {
    if (user?.full_name?.trim()) {
      return user.full_name.trim().split(" ")[0];
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return language === "bn" ? "ব্যবহারকারী" : "Patient";
  }, [user, language]);

  // Calendar calculations
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();
  const currentMonthName = calendarDate.toLocaleString("default", { month: "long" });
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handlePrevMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleResetToday = () => {
    const today = new Date();
    setCalendarDate(today);
    setSelectedCalendarDate(today.getDate());
  };

  // Dynamic calculations from real patient assessments
  const totalObservations = assessments.length;

  // 1. Dynamic Body Zone Distribution from real assessment history
  const zoneBreakdown = useMemo(() => {
    if (totalObservations === 0) return [];

    const zoneCounts: { [key: string]: number } = {
      "Arms & Hands": 0,
      "Face & Neck": 0,
      "Torso & Back": 0,
      "Legs & Feet": 0,
    };

    assessments.forEach((a) => {
      const loc = (a.anatomical_region || "").toLowerCase();
      if (
        loc.includes("arm") ||
        loc.includes("hand") ||
        loc.includes("wrist") ||
        loc.includes("forearm") ||
        loc.includes("shoulder") ||
        loc.includes("deltoid")
      ) {
        zoneCounts["Arms & Hands"] += 1;
      } else if (
        loc.includes("face") ||
        loc.includes("neck") ||
        loc.includes("head") ||
        loc.includes("cheek") ||
        loc.includes("forehead") ||
        loc.includes("scalp")
      ) {
        zoneCounts["Face & Neck"] += 1;
      } else if (
        loc.includes("torso") ||
        loc.includes("chest") ||
        loc.includes("back") ||
        loc.includes("belly") ||
        loc.includes("abdomen")
      ) {
        zoneCounts["Torso & Back"] += 1;
      } else if (
        loc.includes("leg") ||
        loc.includes("thigh") ||
        loc.includes("calf") ||
        loc.includes("foot") ||
        loc.includes("feet")
      ) {
        zoneCounts["Legs & Feet"] += 1;
      } else {
        zoneCounts["Arms & Hands"] += 1;
      }
    });

    return [
      { label: "Arms & Hands", count: zoneCounts["Arms & Hands"], percent: Math.round((zoneCounts["Arms & Hands"] / totalObservations) * 100), color: "bg-[#2b7f8f]" },
      { label: "Face & Neck", count: zoneCounts["Face & Neck"], percent: Math.round((zoneCounts["Face & Neck"] / totalObservations) * 100), color: "bg-[#4da8b9]" },
      { label: "Torso & Back", count: zoneCounts["Torso & Back"], percent: Math.round((zoneCounts["Torso & Back"] / totalObservations) * 100), color: "bg-[#8ec7d3]" },
      { label: "Legs & Feet", count: zoneCounts["Legs & Feet"], percent: Math.round((zoneCounts["Legs & Feet"] / totalObservations) * 100), color: "bg-slate-300" },
    ];
  }, [assessments, totalObservations]);

  // 2. Dynamic Care Pathway Distribution from real triage tiers
  const carePathways = useMemo(() => {
    if (totalObservations === 0) return { general: 0, doctor: 0, urgent: 0 };
    const tier1 = assessments.filter((a) => (a.triage_tier || 1) === 1).length;
    const tier2 = assessments.filter((a) => (a.triage_tier || 1) === 2).length;
    const tier3 = assessments.filter((a) => (a.triage_tier || 1) >= 3).length;

    return {
      general: Math.round((tier1 / totalObservations) * 100),
      doctor: Math.round((tier2 / totalObservations) * 100),
      urgent: Math.round((tier3 / totalObservations) * 100),
    };
  }, [assessments, totalObservations]);

  // 3. Dynamic Skin Barrier status from real patient observations
  const barrierStatus = useMemo(() => {
    if (totalObservations === 0) {
      return { status: "Pending First Check", note: "No records yet" };
    }
    const latest = assessments[0];
    const condition = (latest.primary_condition || "").toLowerCase();
    if (condition.includes("contact") || condition.includes("eczema") || condition.includes("dermatitis")) {
      return { status: "Sensitive / Reactive", note: "Irritant pattern noted" };
    }
    if (condition.includes("acne")) {
      return { status: "Active Blemish Focus", note: "Follicular care indicated" };
    }
    if (condition.includes("psoriasis")) {
      return { status: "Plaque / Scaly Zone", note: "Moisture barrier care" };
    }
    return { status: "Observed / Balanced", note: "Based on recent check" };
  }, [assessments, totalObservations]);

  // 4. Routine completion count
  const completedTasks = routineTasks.filter((t) => t.done).length;

  return (
    <div className="min-h-screen bg-[#edf6f9] text-slate-800 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">

        {/* Top Header Card matching reference image style */}
        <div className="bg-white/95 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-[#d1e5ec] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">
              {language === "bn" ? `হ্যালো, ${userName}` : `Hi, ${userName}`}
            </span>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {language === "bn" ? "স্বাগতম!" : "Welcome Back!"}
              </h1>
              <div className="w-8 h-8 rounded-full bg-[#eaf4f8] text-[#2b7f8f] flex items-center justify-center relative cursor-pointer" title="Notifications">
                <span className="material-symbols-outlined text-base">notifications</span>
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#f43f5e]" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              {language === "bn"
                ? "আপনার ত্বকের পর্যবেক্ষণ রেকর্ড, নিয়মিত রুটিন এবং নিরাপদ স্বাস্থ্য নির্দেশিকা।"
                : "Manage your skin observations, self-care routines, and doctor referral guides."}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <Link
              href="/assess"
              className="inline-flex items-center gap-2 bg-[#2b7f8f] hover:bg-[#236875] text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-base">add_a_photo</span>
              <span>{t.analyzeMySkin}</span>
            </Link>
            <button
              onClick={() => setShowEmergency(true)}
              className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-3 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">emergency</span>
              <span>{t.emergencyNotice}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Main Medical Grid matching reference dashboard layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (8 cols): Reminder Hero, Pinned Info, Charts & Observations */}
          <div className="lg:col-span-8 space-y-6">

            {/* Reminder Hero Card matching reference banner */}
            <div className="bg-gradient-to-r from-[#72bfcf] via-[#5caec0] to-[#4396a8] rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Background soft ambient radial */}
              <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />

              <div className="space-y-3 z-10 max-w-md">
                <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block">
                  {language === "bn" ? "রিমাইন্ডার" : "Reminder"}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug">
                  {language === "bn"
                    ? "আপনি কি এই মাসে ত্বকের নিয়মিত রুটিন চেক-আপ করিয়েছেন?"
                    : "Have you had your routine check-up this month?"}
                </h2>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                  {language === "bn"
                    ? "নিয়মিত ত্বকের পরিবর্তন খেয়াল রাখলে প্রাথমিক অবস্থায় যেকোনো সমস্যা শনাক্ত করা সহজ হয়।"
                    : "Tracking spots monthly helps you spot subtle changes early and know when to consult a doctor."}
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    href="/assess"
                    className="bg-white hover:bg-[#f0f8fb] text-[#2b7f8f] px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all"
                  >
                    {language === "bn" ? "এখনই পরীক্ষা করুন" : "Check Now"}
                  </Link>
                  <Link
                    href="/records"
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all"
                  >
                    {language === "bn" ? "প্রতিবেদন দেখুন" : "View report"}
                  </Link>
                </div>
              </div>

              {/* Graphic Icon / Doctor Illustration placeholder */}
              <div className="z-10 shrink-0 w-36 h-36 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 p-3 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-white text-[#2b7f8f] flex items-center justify-center shadow-md mb-2">
                  <span className="material-symbols-outlined text-3xl">medical_services</span>
                </div>
                <span className="text-[11px] font-bold text-white tracking-wide">SkinWise AI</span>
                <span className="text-[9px] text-white/80">Supportive Triage</span>
              </div>
            </div>

            {/* Pinned Information / Health Vitals Row - Dynamic Grounding */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">push_pin</span>
                  <span>{language === "bn" ? "সংরক্ষিত তথ্য ও নির্দেশক" : "Pinned Informations"}</span>
                </h3>
                <Link href="/settings" className="text-xs font-semibold text-[#2b7f8f] hover:underline">
                  {language === "bn" ? "পরিবর্তন করুন" : "Edit Profile"}
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Metric 1: Skin Profile from actual observations */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">water_drop</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium">Skin Barrier</span>
                    <h4 className="text-sm font-bold text-slate-900">{barrierStatus.status}</h4>
                    <span className="text-[10px] text-slate-400 block">{barrierStatus.note}</span>
                  </div>
                </div>

                {/* Metric 2: Routine Checkup Frequency */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">event_available</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium">Self-Check Routine</span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {completedTasks === routineTasks.length
                        ? "Up to date"
                        : `${completedTasks} of ${routineTasks.length} Done`}
                    </h4>
                    <span className="text-[10px] text-slate-400 block">Personal checklist</span>
                  </div>
                </div>

                {/* Metric 3: Sun Protection Indicator */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">wb_sunny</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium">UV Protection</span>
                    <h4 className="text-sm font-bold text-slate-900">SPF 30+ Daily</h4>
                    <span className="text-[10px] text-slate-400 block">Dermatology baseline</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Observations Summary Card - Computed from Real Assessments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Anatomical Zone Breakdown */}
              <div className="bg-white p-5 rounded-2xl border border-[#d1e5ec] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    {language === "bn" ? "পর্যবেক্ষিত স্থানসমূহ" : "Observations by Body Zone"}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold">Total: {totalObservations}</span>
                </div>

                {totalObservations === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                    <span className="material-symbols-outlined text-2xl text-slate-300 block">accessibility_new</span>
                    <p className="max-w-xs mx-auto">
                      {language === "bn"
                        ? "এখনও কোনো পর্যবেক্ষণ রেকর্ড নেই। প্রথম পরীক্ষার পর শরীরের স্থানভিত্তিক চিত্র এখানে প্রদর্শিত হবে।"
                        : "No assessments recorded yet. Your anatomical zone breakdown will appear here after your first check."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    {zoneBreakdown.map((zone) => (
                      <div key={zone.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>{zone.label}</span>
                          <span className="font-bold">{zone.percent}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${zone.color}`} style={{ width: `${zone.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 2: Care Action Pathways */}
              <div className="bg-white p-5 rounded-2xl border border-[#d1e5ec] shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    {language === "bn" ? "প্রস্তাবিত পদক্ষেপসমূহ" : "Care Pathways"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === "bn"
                      ? "আপনার বাস্তব নিরীক্ষণের ভিত্তিতে প্রস্তাবিত স্বাস্থ্য ও যত্ন নির্দেশিকা।"
                      : "Distribution of triage guidance across your recorded skin concerns."}
                  </p>

                  {totalObservations === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                      <span className="material-symbols-outlined text-2xl text-slate-300 block">health_and_safety</span>
                      <p className="max-w-xs mx-auto">
                        {language === "bn"
                          ? "কোনো ট্রায়াজ হিস্ট্রি নেই। ফলাফল বিশ্লেষণের পর কেয়ার পাথওয়ে প্রদর্শিত হবে।"
                          : "No triage history recorded yet. Triage breakdown will compute from your real checks."}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center justify-center gap-6">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-[#eaf4f8] text-[#2b7f8f] flex items-center justify-center mx-auto font-bold text-base">
                          {carePathways.general}%
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold mt-1 block">General Care</span>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto font-bold text-base">
                          {carePathways.doctor}%
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Doctor Review</span>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto font-bold text-base">
                          {carePathways.urgent}%
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Urgent Care</span>
                      </div>
                    </div>
                  )}
                </div>
                <Link
                  href="/referral"
                  className="w-full py-2 px-3 rounded-xl bg-[#f0f8fb] hover:bg-[#e4f2f7] text-[#2b7f8f] text-xs font-bold text-center block transition-colors mt-4"
                >
                  {language === "bn" ? "হাসপাতাল ও ক্লিনিক তালিকা দেখুন →" : "Find Dermatology Specialists →"}
                </Link>
              </div>
            </div>

            {/* Recent Skin Observations List */}
            <div className="bg-white p-6 rounded-3xl border border-[#d1e5ec] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {language === "bn" ? "সাম্প্রতিক ত্বকের নিরীক্ষণ" : "Recent Skin Observations"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === "bn"
                      ? "আপনার সাম্প্রতিক নিরীক্ষণ ও সংরক্ষিত নির্দেশিকা"
                      : "Your recent checks, observed visible patterns, and care guidance."}
                  </p>
                </div>
                <Link href="/records" className="text-xs font-bold text-[#2b7f8f] hover:underline">
                  {language === "bn" ? "সবগুলো দেখুন →" : "View All Records →"}
                </Link>
              </div>

              {isLoading ? (
                <div className="py-8 text-center text-slate-500">
                  <span className="material-symbols-outlined animate-spin text-3xl text-[#2b7f8f] mb-2">progress_activity</span>
                  <p className="text-xs">Loading records...</p>
                </div>
              ) : assessments.length > 0 ? (
                <div className="space-y-3">
                  {assessments.slice(0, 3).map((assessment) => (
                    <div
                      key={assessment.id}
                      className="bg-[#f8fbfe] p-4 rounded-2xl border border-slate-200/70 hover:border-[#2b7f8f] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-semibold text-slate-700">Check #{assessment.id}</span>
                          <span>•</span>
                          <span>{new Date(assessment.created_at).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {assessment.primary_condition || "Skin Pattern Observation"}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {assessment.anatomical_region ? `Location: ${assessment.anatomical_region}` : "General supportive care."}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white text-slate-700 border border-slate-200">
                          {assessment.triage_title || "General Care"}
                        </span>
                        <Link
                          href={`/assessment/${assessment.id}`}
                          className="px-3 py-1.5 rounded-xl bg-[#2b7f8f] hover:bg-[#236875] text-white text-xs font-bold transition-colors"
                        >
                          View Result
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 bg-[#f8fbfe] rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#2b7f8f] flex items-center justify-center mx-auto shadow-2xs">
                    <span className="material-symbols-outlined text-2xl">photo_camera</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No checks recorded yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Take a clear, in-focus photograph of any skin concern to begin your first observation.
                  </p>
                  <Link
                    href="/assess"
                    className="inline-flex items-center gap-1.5 bg-[#2b7f8f] text-white px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    <span className="material-symbols-outlined text-sm">add_a_photo</span>
                    <span>Start Check</span>
                  </Link>
                </div>
              )}
            </div>

          </div>

          {/* Right Column (4 cols): Mini Calendar, Line up Check-ups, Previous Check-ups */}
          <div className="lg:col-span-4 space-y-6">

            {/* Mini Calendar Card with Working Navigation & Real Patient Dates */}
            <div className="bg-white p-5 rounded-3xl border border-[#d1e5ec] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">
                  {language === "bn" ? "আসন্ন চেক-আপ ক্যালেন্ডার" : "Upcoming Check-ups"}
                </h3>
                <button
                  type="button"
                  onClick={handleResetToday}
                  className="w-7 h-7 rounded-full bg-[#f0f8fb] text-[#2b7f8f] flex items-center justify-center hover:bg-[#e4f2f7] transition-colors cursor-pointer"
                  title="Today"
                >
                  <span className="material-symbols-outlined text-sm">today</span>
                </button>
              </div>

              {/* Month Header with Functional Navigation Controls */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                <span>{currentMonthName} {calendarYear}</span>
                <div className="flex items-center gap-1 text-slate-500">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                    className="p-1 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    aria-label="Next month"
                    className="p-1 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
                <span>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
              </div>

              {/* Calendar Grid with Real Assessment Date Indicators */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {calendarDays.map((day) => {
                  const today = new Date();
                  const isToday =
                    day === today.getDate() &&
                    calendarMonth === today.getMonth() &&
                    calendarYear === today.getFullYear();

                  const isSelected = day === selectedCalendarDate;

                  // Genuine check: did patient take an assessment on this day?
                  const hasAssessmentOnDay = assessments.some((a) => {
                    const d = new Date(a.created_at);
                    return (
                      d.getDate() === day &&
                      d.getMonth() === calendarMonth &&
                      d.getFullYear() === calendarYear
                    );
                  });

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedCalendarDate(day)}
                      className={`h-8 rounded-xl font-semibold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#2b7f8f] text-white shadow-2xs font-bold"
                          : isToday
                          ? "bg-[#eaf4f8] text-[#2b7f8f] font-bold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{day}</span>
                      {hasAssessmentOnDay && !isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] absolute bottom-1" title="Assessment logged" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Line up Check-ups / Recommended Routine Checklist with Persistence */}
            <div className="bg-white p-5 rounded-3xl border border-[#d1e5ec] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">
                  {language === "bn" ? "প্রস্তাবিত চেক-আপ রুটিন" : "Line up Check-ups"}
                </h3>
                <span className="text-[11px] text-slate-400 font-semibold">Routine Tasks</span>
              </div>

              <div className="space-y-2 pt-1">
                {routineTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      task.done
                        ? "bg-slate-50/60 border-slate-200 text-slate-400"
                        : "bg-[#f8fbfe] border-slate-200 hover:border-[#2b7f8f] text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          task.done
                            ? "bg-[#2b7f8f] border-[#2b7f8f] text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {task.done && <span className="material-symbols-outlined text-xs font-bold">check</span>}
                      </div>
                      <div>
                        <h4 className={`text-xs font-bold leading-tight ${task.done ? "line-through text-slate-400" : "text-slate-800"}`}>
                          {language === "bn" ? task.titleBn : task.titleEn}
                        </h4>
                        <span className="text-[10px] text-slate-400">{task.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  href="/referral"
                  className="w-full py-2.5 rounded-xl bg-[#f0f8fb] hover:bg-[#e4f2f7] text-[#2b7f8f] text-xs font-bold text-center block transition-colors"
                >
                  {language === "bn" ? "রেফারেল ডাক্তার ও হাসপাতাল →" : "View Healthcare Directory →"}
                </Link>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="bg-white p-5 rounded-3xl border border-[#d1e5ec] shadow-xs space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                {language === "bn" ? "গুরুত্বপূর্ণ সুবিধা" : "Quick Actions"}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/assess"
                  className="p-3 rounded-2xl bg-[#f8fbfe] hover:bg-[#eaf4f8] border border-slate-200 transition-all text-center space-y-1 block"
                >
                  <span className="material-symbols-outlined text-[#2b7f8f] text-xl block">photo_camera</span>
                  <span className="text-xs font-bold text-slate-800 block">New Check</span>
                </Link>
                <Link
                  href="/records"
                  className="p-3 rounded-2xl bg-[#f8fbfe] hover:bg-[#eaf4f8] border border-slate-200 transition-all text-center space-y-1 block"
                >
                  <span className="material-symbols-outlined text-[#2b7f8f] text-xl block">history</span>
                  <span className="text-xs font-bold text-slate-800 block">History</span>
                </Link>
                <Link
                  href="/referral"
                  className="p-3 rounded-2xl bg-[#f8fbfe] hover:bg-[#eaf4f8] border border-slate-200 transition-all text-center space-y-1 block"
                >
                  <span className="material-symbols-outlined text-[#2b7f8f] text-xl block">local_hospital</span>
                  <span className="text-xs font-bold text-slate-800 block">Dermatologists</span>
                </Link>
                <Link
                  href="/settings"
                  className="p-3 rounded-2xl bg-[#f8fbfe] hover:bg-[#eaf4f8] border border-slate-200 transition-all text-center space-y-1 block"
                >
                  <span className="material-symbols-outlined text-[#2b7f8f] text-xl block">shield</span>
                  <span className="text-xs font-bold text-slate-800 block">Privacy</span>
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>

      <EmergencyModal isOpen={showEmergency} onClose={() => setShowEmergency(false)} />
    </div>
  );
}
