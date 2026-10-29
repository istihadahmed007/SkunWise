"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, AssessmentSummary } from "@/lib/api";
import { EmergencyModal } from "@/components/EmergencyModal";

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"records" | "empty">("records");
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

  const patientName = user?.full_name || "Sarah Jenkins";
  const patientId = user ? `#SW-${String(user.id).padStart(5, "0")}` : "#SW-94820";

  return (
    <>
      <div className="max-w-7xl mx-auto px-gutter pb-space-xl space-y-space-lg w-full">
        {/* Header Section: Patient Greeting & Clinical Badges */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container-high">
          <div className="space-y-1">
            <div className="flex items-center gap-space-sm flex-wrap text-xs">
              <span className="font-headline font-bold uppercase tracking-wider text-secondary">
                Patient Portal • ID: {patientId}
              </span>
              <span className="h-1 w-1 rounded-full bg-outline-variant" />
              <span className="text-on-surface-variant font-medium">
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
              </span>
            </div>
            <h1 className="font-headline font-bold text-2xl sm:text-3xl text-on-surface tracking-tight">
              Welcome back, {patientName.split(" ")[0]}
            </h1>
            <p className="text-xs text-on-surface-variant">
              Your personal dermatological triage portal is synchronized with secure clinical storage.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-space-sm">
            <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-full text-xs font-semibold text-on-surface">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>{assessments.length > 0 ? `${assessments.length} Active Records` : "2 Active Assessments"}</span>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-low px-3 py-1.5 rounded-full text-xs text-on-surface-variant font-medium">
              <span className="material-symbols-outlined text-tertiary text-base">lock</span>
              <span>256-Bit Encrypted</span>
            </div>
            <button
              onClick={() => setShowEmergency(true)}
              className="flex items-center gap-1.5 bg-error text-on-error hover:opacity-95 px-3.5 py-1.5 rounded-full shadow-xs transition-opacity font-headline text-xs font-bold"
            >
              <span className="material-symbols-outlined text-base">emergency</span>
              <span>Emergency Triage Alert</span>
            </button>
          </div>
        </div>

        {/* Advisory Clinical Notification & Boundary of Care */}
        <div className="bg-surface-container-low p-space-md rounded-2xl border border-surface-container-high flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-md">
            <div className="p-2 bg-primary-fixed rounded-xl text-on-primary-fixed mt-0.5 shrink-0">
              <span className="material-symbols-outlined text-xl">medical_information</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-headline font-bold text-xs text-on-surface">
                  Advisory Clinical Notification & Boundary of Care
                </h4>
                <span className="bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  CE-MDR Class I
                </span>
              </div>
              <p className="text-xs text-on-surface-variant max-w-4xl leading-relaxed">
                SkinWise AI provides probabilistic visual triage screening for informational purposes only. It is not an automated medical diagnostic tool and cannot replace in-person histopathological verification or physical evaluation by a board-certified dermatologist.
              </p>
            </div>
          </div>
          <Link
            href="/referral"
            className="font-headline text-xs text-primary hover:text-secondary whitespace-nowrap self-end md:self-center font-bold"
          >
            Read Safety Charter →
          </Link>
        </div>

        {/* Primary Action Hero Panel: Bento Grid (8 cols / 4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Start New Assessment (8 cols) */}
          <div className="lg:col-span-8 bg-surface-container-lowest p-space-lg lg:p-space-xl rounded-2xl shadow-sm border border-surface-container-high flex flex-col justify-between space-y-space-md">
            <div className="space-y-space-md">
              <div className="flex items-center justify-between">
                <span className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full font-headline text-xs font-bold uppercase tracking-wide">
                  Step 1 of 4: Direct Camera Intake
                </span>
                <div className="flex items-center gap-1 text-xs text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full font-medium">
                  <span className="material-symbols-outlined text-sm text-secondary">timer</span>
                  <span>Avg completion: ~3 mins</span>
                </div>
              </div>

              <div className="space-y-1 max-w-xl">
                <h2 className="font-headline font-bold text-xl sm:text-2xl text-on-surface tracking-tight">
                  Start New Dermatological Assessment
                </h2>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  Upload high-resolution macro imagery of new or changing moles, rashes, or epidermal patches. Guided analysis processes morphology, asymmetry, and color distribution.
                </p>
              </div>

              {/* Step Progression Workflow Pill Track */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-surface-container-low p-2.5 rounded-xl flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline text-xs font-bold shrink-0">
                    1
                  </div>
                  <div className="min-w-0">
                    <p className="font-headline text-xs font-semibold text-on-surface truncate">Photo Capture</p>
                    <p className="text-[10px] text-on-surface-variant truncate">Macro or dermatoscope</p>
                  </div>
                </div>
                <div className="bg-surface-container-low p-2.5 rounded-xl flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-headline text-xs font-bold shrink-0">
                    2
                  </div>
                  <div className="min-w-0">
                    <p className="font-headline text-xs font-semibold text-on-surface truncate">Symptoms</p>
                    <p className="text-[10px] text-on-surface-variant truncate">Duration & itching</p>
                  </div>
                </div>
                <div className="bg-surface-container-low p-2.5 rounded-xl flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-headline text-xs font-bold shrink-0">
                    3
                  </div>
                  <div className="min-w-0">
                    <p className="font-headline text-xs font-semibold text-on-surface truncate">AI Triage</p>
                    <p className="text-[10px] text-on-surface-variant truncate">Vision inference</p>
                  </div>
                </div>
                <div className="bg-surface-container-low p-2.5 rounded-xl flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-headline text-xs font-bold shrink-0">
                    4
                  </div>
                  <div className="min-w-0">
                    <p className="font-headline text-xs font-semibold text-on-surface truncate">Clinical Plan</p>
                    <p className="text-[10px] text-on-surface-variant truncate">Doctor export pack</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-space-md flex flex-col sm:flex-row items-stretch sm:items-center gap-space-md border-t border-surface-container-high/60">
              <Link
                href="/assess"
                className="bg-primary hover:bg-secondary text-on-primary px-space-lg py-3 rounded-xl font-headline text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">add_a_photo</span>
                <span>Launch Image Intake</span>
              </Link>
              <Link
                href="/assess"
                className="bg-surface-container text-on-surface hover:bg-surface-container-high px-space-md py-3 rounded-xl font-headline text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-base">cloud_upload</span>
                <span>Upload Dermoscopic File</span>
              </Link>
              <span className="text-[11px] text-on-surface-variant text-center sm:text-left">
                Supports JPEG, PNG, HEIC • Up to 25MB
              </span>
            </div>
          </div>

          {/* Metric Radial Gauge (4 cols) */}
          <div className="lg:col-span-4 bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container-high flex flex-col justify-between space-y-space-md">
            <div>
              <div className="flex items-center justify-between pb-1">
                <span className="font-headline text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                  Skin Health Index
                </span>
                <span className="material-symbols-outlined text-primary text-lg">ecg_heart</span>
              </div>
              <h3 className="font-headline font-bold text-lg text-on-surface">
                Triage Stability Rating
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Based on regular dermoscopy scans logged within the previous 90 days.
              </p>
            </div>

            {/* Radial Dial SVG */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    className="text-surface-container-high"
                    cx="60"
                    cy="60"
                    fill="transparent"
                    r="50"
                    stroke="currentColor"
                    strokeWidth="10"
                  />
                  <circle
                    className="text-primary"
                    cx="60"
                    cy="60"
                    fill="transparent"
                    r="50"
                    stroke="currentColor"
                    strokeDasharray="314.15"
                    strokeDashoffset="65"
                    strokeLinecap="round"
                    strokeWidth="10"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-headline font-bold text-3xl text-primary leading-none">
                    94%
                  </span>
                  <span className="font-headline text-[10px] text-on-surface-variant uppercase font-bold mt-1">
                    Controlled
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low p-space-sm rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Lesions Tracked</span>
                <span className="font-bold text-on-surface">3 Locations</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Next Recurrence Check</span>
                <span className="font-bold text-tertiary">In 12 Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Lesion Records Section */}
        <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container-high space-y-space-md">
          {/* Section Switcher Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-1 border-b border-surface-container-high/60">
            <div>
              <h2 className="font-headline font-bold text-lg text-on-surface">
                Patient Lesion Records
              </h2>
              <p className="text-xs text-on-surface-variant">
                Historical dermatological analysis, change metrics, and clinical escalation guidance.
              </p>
            </div>

            {/* Toggle */}
            <div className="flex items-center bg-surface-container-low p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("records")}
                className={`px-3 py-1.5 font-headline text-xs rounded-lg transition-all flex items-center gap-1.5 font-semibold ${
                  activeTab === "records"
                    ? "bg-surface-container-lowest text-primary shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-sm">history</span>
                <span>Recorded Assessments ({assessments.length || 2})</span>
              </button>
              <button
                onClick={() => setActiveTab("empty")}
                className={`px-3 py-1.5 font-headline text-xs rounded-lg transition-all flex items-center gap-1.5 font-semibold ${
                  activeTab === "empty"
                    ? "bg-surface-container-lowest text-primary shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-sm">visibility_off</span>
                <span>Empty State View</span>
              </button>
            </div>
          </div>

          {/* View A: Populated Assessment Records */}
          {activeTab === "records" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {/* Record 1 */}
              <div className="bg-surface-container-low p-space-md rounded-2xl space-y-space-md flex flex-col justify-between border border-surface-container-high/60">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-headline font-bold uppercase bg-surface-container-highest text-on-surface">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        Monitored
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-headline font-bold uppercase bg-secondary-fixed text-on-secondary-fixed-variant">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Doctor Visit Advised
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant font-medium">Oct 18, 2025</span>
                  </div>

                  <div className="flex gap-space-md items-center">
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-amber-100 border border-amber-300/60 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-amber-900/70 blur-2xs" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="font-headline font-semibold text-sm text-on-surface truncate">
                        Shoulder Pigmented Lesion
                      </h4>
                      <p className="text-xs text-on-surface-variant">Anatomical Region: Right Posterior Deltoid</p>
                      <div className="flex items-center gap-2 text-xs pt-1">
                        <span className="font-semibold text-primary">Confidence: 89.2%</span>
                        <span>•</span>
                        <span className="text-amber-700 font-semibold">Border Asymmetry: Detected</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-on-surface-variant bg-surface-container-lowest p-3 rounded-xl leading-relaxed">
                    Visual AI detects slight boundary irregularity (ABCDE rule). Recommend booking dermoscopy exam with Dr. Patricia Evans or your primary dermatologist within 14 days.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-surface-container-high/60">
                  <span className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
                    Dermatologist Pack Ready
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/referral"
                      className="bg-surface-container-lowest hover:bg-surface text-on-surface px-3 py-1.5 rounded-lg text-xs font-headline font-semibold border border-surface-container-high shadow-xs"
                    >
                      Export PDF
                    </Link>
                    <Link
                      href={assessments[0] ? `/assessment/${assessments[0].id}` : "/assessment/1"}
                      className="bg-primary hover:bg-secondary text-on-primary px-3.5 py-1.5 rounded-lg text-xs font-headline font-semibold shadow-xs flex items-center gap-1"
                    >
                      <span>View Full Report</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Record 2 */}
              <div className="bg-surface-container-low p-space-md rounded-2xl space-y-space-md flex flex-col justify-between border border-surface-container-high/60">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-headline font-bold uppercase bg-surface-container-highest text-on-surface">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                        Resolved
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-headline font-bold uppercase bg-tertiary-fixed text-on-tertiary-fixed-variant">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                        Mild / Benign Pattern
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant font-medium">Sep 29, 2025</span>
                  </div>

                  <div className="flex gap-space-md items-center">
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-red-100 border border-red-300/60 flex items-center justify-center">
                      <div className="w-12 h-8 rounded-full bg-red-400/60 blur-xs" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="font-headline font-semibold text-sm text-on-surface truncate">
                        Forearm Mild Rash (Contact Dermatitis)
                      </h4>
                      <p className="text-xs text-on-surface-variant">Anatomical Region: Left Volar Forearm</p>
                      <div className="flex items-center gap-2 text-xs pt-1">
                        <span className="font-semibold text-primary">Confidence: 94.6%</span>
                        <span>•</span>
                        <span className="text-tertiary font-semibold">Status: Erythema Cleared</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-on-surface-variant bg-surface-container-lowest p-3 rounded-xl leading-relaxed">
                    Self-monitored episode. Follow-up photograph captured on Day 7 confirmed disappearance of contact dermatitis flare. Symptom diary entry logged as non-itchy.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-surface-container-high/60">
                  <span className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-sm text-tertiary">history_toggle_off</span>
                    Archived Record
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/assess"
                      className="bg-surface-container-lowest hover:bg-surface text-on-surface px-3 py-1.5 rounded-lg text-xs font-headline font-semibold border border-surface-container-high shadow-xs"
                    >
                      Log Re-flare
                    </Link>
                    <Link
                      href={assessments[1] ? `/assessment/${assessments[1].id}` : "/assessment/2"}
                      className="bg-primary hover:bg-secondary text-on-primary px-3.5 py-1.5 rounded-lg text-xs font-headline font-semibold shadow-xs flex items-center gap-1"
                    >
                      <span>View Full Report</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View B: Empty State Illustration */}
          {activeTab === "empty" && (
            <div className="bg-surface-container-low p-space-xl rounded-2xl text-center flex flex-col items-center justify-center space-y-space-md border border-dashed border-surface-container-highest">
              <div className="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-1">
                <span className="material-symbols-outlined text-4xl">photo_camera</span>
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  No Dermatological Records Logged Yet
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Start by capturing your first skin examination. Take a steady, well-lit photo of any lesion or patch you wish to inspect and track over time.
                </p>
              </div>

              {/* Instructional Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm max-w-2xl text-left pt-2">
                <div className="bg-surface-container-lowest p-space-sm rounded-xl space-y-1 border border-surface-container-high">
                  <span className="material-symbols-outlined text-primary text-base">wb_sunny</span>
                  <p className="font-headline font-semibold text-xs text-on-surface">Optimal Lighting</p>
                  <p className="text-[11px] text-on-surface-variant leading-tight">Use natural indirect daylight without cast shadows.</p>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-xl space-y-1 border border-surface-container-high">
                  <span className="material-symbols-outlined text-primary text-base">center_focus_strong</span>
                  <p className="font-headline font-semibold text-xs text-on-surface">Sharp Distance</p>
                  <p className="text-[11px] text-on-surface-variant leading-tight">Hold device 10–15 cm away to avoid blurry digital zoom.</p>
                </div>
                <div className="bg-surface-container-lowest p-space-sm rounded-xl space-y-1 border border-surface-container-high">
                  <span className="material-symbols-outlined text-primary text-base">straighten</span>
                  <p className="font-headline font-semibold text-xs text-on-surface">Scale Reference</p>
                  <p className="text-[11px] text-on-surface-variant leading-tight">Keep lesion centered occupying ~40% of viewfinder.</p>
                </div>
              </div>

              <Link
                href="/assess"
                className="bg-primary hover:bg-secondary text-on-primary px-space-lg py-2.5 rounded-xl font-headline text-xs font-semibold shadow-xs flex items-center gap-1.5 mt-2"
              >
                <span className="material-symbols-outlined text-base">photo_camera</span>
                <span>Perform Initial Scan Now</span>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Navigation Deck: Core Subsystems (5 Cards Grid) */}
        <div className="space-y-space-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-base text-on-surface">
              Clinical Workspace & Modules
            </h3>
            <span className="text-xs text-on-surface-variant">Access telemetry and care pathways</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
            {/* 1. Skin Analysis */}
            <Link
              href="/assess"
              className="bg-surface-container-lowest hover:bg-surface-container-low transition-all p-space-md rounded-2xl shadow-xs border border-surface-container-high flex flex-col justify-between group space-y-3"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-xl">biotech</span>
                </div>
                <h4 className="font-headline font-bold text-sm text-on-surface">Skin Analysis</h4>
                <p className="text-xs text-on-surface-variant leading-tight">
                  Algorithmic segmentation, border assessment, and ABCDE checks.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-primary font-headline font-bold">
                <span>Scan Engine</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>

            {/* 2. Symptom Diary */}
            <Link
              href="/assess"
              className="bg-surface-container-lowest hover:bg-surface-container-low transition-all p-space-md rounded-2xl shadow-xs border border-surface-container-high flex flex-col justify-between group space-y-3"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-xl">event_note</span>
                </div>
                <h4 className="font-headline font-bold text-sm text-on-surface">Symptom Diary</h4>
                <p className="text-xs text-on-surface-variant leading-tight">
                  Log itch severity (0-10), bleeding events, and medication responses.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-tertiary font-headline font-bold">
                <span>Log Symptoms</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>

            {/* 3. Assessment History */}
            <Link
              href="/records"
              className="bg-surface-container-lowest hover:bg-surface-container-low transition-all p-space-md rounded-2xl shadow-xs border border-surface-container-high flex flex-col justify-between group space-y-3"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-xl">stacked_bar_chart</span>
                </div>
                <h4 className="font-headline font-bold text-sm text-on-surface">Assessment History</h4>
                <p className="text-xs text-on-surface-variant leading-tight">
                  Comparative timelines and photographic diameter delta tracking.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-secondary font-headline font-bold">
                <span>Full Chronology</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>

            {/* 4. Doctor Referral */}
            <Link
              href="/referral"
              className="bg-surface-container-lowest hover:bg-surface-container-low transition-all p-space-md rounded-2xl shadow-xs border border-surface-container-high flex flex-col justify-between group space-y-3"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-xl">assignment_ind</span>
                </div>
                <h4 className="font-headline font-bold text-sm text-on-surface">Referral Summary</h4>
                <p className="text-xs text-on-surface-variant leading-tight">
                  Synthesized clinical briefs formatted for clinician consultation.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-primary font-headline font-bold">
                <span>PDF Referral Pack</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>

            {/* 5. Privacy & Consent */}
            <Link
              href="/settings"
              className="bg-surface-container-lowest hover:bg-surface-container-low transition-all p-space-md rounded-2xl shadow-xs border border-surface-container-high flex flex-col justify-between group space-y-3"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-surface-container-highest text-on-surface flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-xl">shield</span>
                </div>
                <h4 className="font-headline font-bold text-sm text-on-surface">Privacy & Consent</h4>
                <p className="text-xs text-on-surface-variant leading-tight">
                  Manage biometric authorizations, HIPAA opt-ins, and data purges.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface font-headline font-bold">
                <span>Fully Verified</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Telehealth Integration Banner */}
        <div className="bg-gradient-to-r from-primary to-secondary p-space-lg rounded-2xl text-on-primary flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md shadow-sm">
          <div className="space-y-1 max-w-2xl">
            <span className="bg-white/20 text-on-primary px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              Integrated Tele-Dermatology
            </span>
            <h3 className="font-headline font-bold text-lg text-white">
              Connect with Board-Certified Dermatologists
            </h3>
            <p className="text-xs text-white/90 leading-relaxed">
              Have your SkinWise AI scan reports reviewed remotely within 24 hours. Digital prescriptions and in-clinic referrals issued directly through your verified health network.
            </p>
          </div>
          <Link
            href="/referral"
            className="bg-surface-container-lowest text-primary hover:bg-surface transition-colors px-space-lg py-2.5 rounded-xl font-headline text-xs font-semibold shadow-sm shrink-0"
          >
            Find Specialist Nearby
          </Link>
        </div>
      </div>

      <EmergencyModal isOpen={showEmergency} onClose={() => setShowEmergency(false)} />
    </>
  );
}

