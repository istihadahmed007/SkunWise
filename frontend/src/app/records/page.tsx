"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, AssessmentSummary, Assessment } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { TriageBadge } from "@/components/TriageBadge";

export default function RecordsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();

  const [records, setRecords] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Longitudinal comparison state
  const [compareA, setCompareA] = useState<Assessment | null>(null);
  const [compareB, setCompareB] = useState<Assessment | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth");
      return;
    }
    if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated, authLoading, router]);

  async function loadHistory() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAssessmentHistory();
      setRecords(data);
    } catch (err: any) {
      setError(err.message || "Failed to load clinical records.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteAssessment(id);
      setDeleteConfirmId(null);
      await loadHistory();
    } catch (err: any) {
      alert("Failed to delete record: " + err.message);
    }
  }

  async function handleLaunchComparison(idA: number, idB: number) {
    try {
      setLoadingCompare(true);
      const [docA, docB] = await Promise.all([
        api.getAssessment(idA),
        api.getAssessment(idB)
      ]);
      setCompareA(docA);
      setCompareB(docB);
      setIsComparing(true);
    } catch (err: any) {
      alert("Could not load comparative records: " + err.message);
    } finally {
      setLoadingCompare(false);
    }
  }

  const filteredRecords = records.filter((r) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "urgent") return r.triage_tier === 3;
    if (selectedFilter === "doctor") return r.triage_tier === 2;
    if (selectedFilter === "mild") return r.triage_tier === 1;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24">
      {/* Header Banner */}
      <section className="bg-white border-b border-[#e2e8f0] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#006194]">
              <span className="material-symbols-outlined text-sm">history_edu</span>
              <span>Longitudinal Patient Dossier</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight mt-1">
              {language === "bn" ? "ত্বক স্বাস্থ্য পরীক্ষণ ইতিহাস ও বিবর্তন" : "Assessment History & Lesion Tracking"}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Audit your longitudinal dermatological intakes, download HL7-aligned clinical summaries, and monitor lesion evolution over time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/assess"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006194] hover:bg-[#004e77] text-white text-sm font-semibold shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-lg">add_a_photo</span>
              <span>New Intake</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {[
              { id: "all", label: language === "bn" ? "সব পরীক্ষণ" : "All Intakes", count: records.length },
              { id: "urgent", label: language === "bn" ? "জরুরি" : "Urgent Care (Tier 3)", count: records.filter((r) => r.triage_tier === 3).length },
              { id: "doctor", label: language === "bn" ? "ডাক্তার সুপারিশকৃত" : "Doctor Recommended (Tier 2)", count: records.filter((r) => r.triage_tier === 2).length },
              { id: "mild", label: language === "bn" ? "সাধারণ যত্ন" : "Self-Care (Tier 1)", count: records.filter((r) => r.triage_tier === 1).length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  selectedFilter === tab.id
                    ? "bg-[#006194] text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    selectedFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {records.length >= 2 && (
            <button
              onClick={() => {
                if (records.length >= 2) {
                  handleLaunchComparison(records[0].id, records[1].id);
                }
              }}
              disabled={loadingCompare}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#39b8fd] text-[#006194] hover:bg-sky-50 transition-all self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-sm">compare</span>
              <span>{loadingCompare ? "Loading..." : "Compare Latest 2 Intakes"}</span>
            </button>
          )}
        </div>

        {/* Content State */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-10 h-10 border-4 border-[#006194] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-medium">Retrieving verified clinical dossiers...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800">
            <span className="material-symbols-outlined text-3xl mb-2 text-rose-600">error</span>
            <p className="font-semibold text-sm">{error}</p>
            <button
              onClick={loadHistory}
              className="mt-3 px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
            >
              Retry
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#006194] flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">folder_off</span>
            </div>
            <h3 className="text-lg font-bold text-[#131b2e]">No Clinical Records Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              You do not have any saved assessments matching this filter. Start a new intake to begin tracking your dermatological health.
            </p>
            <Link
              href="/assess"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006194] text-white text-xs font-semibold hover:bg-[#004e77] transition-all"
            >
              <span className="material-symbols-outlined text-base">add_a_photo</span>
              <span>Start Assessment</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRecords.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-[#39b8fd] shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Card Header with anatomical site and date */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#006194] text-base">accessibility_new</span>
                    <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                      {item.anatomical_region}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="mb-3">
                      <TriageBadge
                        tier={item.triage_tier}
                        title={item.triage_title}
                        badgeColor={item.urgency_badge_color}
                      />
                    </div>

                    <h4 className="text-base font-bold text-[#131b2e] group-hover:text-[#006194] transition-colors line-clamp-1">
                      {item.primary_condition}
                    </h4>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      Case Ref: {item.session_code}
                    </p>

                    {item.is_inconclusive && (
                      <div className="mt-2 text-[11px] bg-amber-50 text-amber-800 border border-amber-200 rounded-lg p-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs text-amber-600">info</span>
                        <span>Clinical evidence inconclusive; in-person dermatoscope required.</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/assessment/${item.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006194] hover:text-[#004e77]"
                    >
                      <span>View Dossier</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>

                    <div className="flex items-center gap-1">
                      <a
                        href={api.getPdfUrl(item.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-[#006194] hover:bg-sky-50 rounded-lg transition-colors"
                        title="Download HL7 PDF Dossier"
                      >
                        <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                      </a>

                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Record"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-2xl">delete_forever</span>
              </div>
              <h3 className="text-lg font-bold text-center text-[#131b2e]">Purge Assessment Record?</h3>
              <p className="text-xs text-slate-600 text-center mt-2 leading-relaxed">
                Under HIPAA Patient Self-Deletion rights and Zero-Cloud retention compliance, all captured dermoscopic imagery and clinical responses for this intake will be permanently expunged from the disk immediately.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
                >
                  Purge Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Longitudinal Comparison Modal */}
        {isComparing && compareA && compareB && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 my-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#006194]">
                    <span className="material-symbols-outlined text-sm">compare</span>
                    <span>Longitudinal Lesion Comparison HUD</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#131b2e] mt-0.5">
                    Evolution Analysis ({compareA.anatomical_region} vs {compareB.anatomical_region})
                  </h3>
                </div>
                <button
                  onClick={() => setIsComparing(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              {/* Comparative Side-by-Side Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Baseline Intake A */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#006194] uppercase tracking-wider">Intake Baseline</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(compareA.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Impression</span>
                      <p className="text-sm font-bold text-slate-900">{compareA.triage.primary_condition}</p>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Triage Classification</span>
                      <div className="mt-1">
                        <TriageBadge
                          tier={compareA.triage.triage_tier}
                          title={compareA.triage.triage_name}
                          badgeColor={compareA.triage.urgency_badge_color}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Symptom Metrics</span>
                      <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-slate-700">
                        <div>Duration: <span className="font-semibold">{compareA.symptom_data.duration_days} days</span></div>
                        <div>Itch Score: <span className="font-semibold">{compareA.symptom_data.itch_score}/10</span></div>
                        <div>Pain Score: <span className="font-semibold">{compareA.symptom_data.pain_score}/10</span></div>
                        <div>Spreading: <span className="font-semibold">{compareA.symptom_data.is_spreading ? "Yes" : "No"}</span></div>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Optical Viability</span>
                      <div className="text-xs text-slate-700 mt-1">
                        Quality Index: <span className="font-bold text-[#006194]">{compareA.quality_metrics.overall_usability_score.toFixed(1)}/100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Follow-up Intake B */}
                <div className="border border-[#39b8fd]/50 rounded-xl p-4 bg-sky-50/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#006194] uppercase tracking-wider">Follow-up Follower</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(compareB.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Impression</span>
                      <p className="text-sm font-bold text-slate-900">{compareB.triage.primary_condition}</p>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Triage Classification</span>
                      <div className="mt-1">
                        <TriageBadge
                          tier={compareB.triage.triage_tier}
                          title={compareB.triage.triage_name}
                          badgeColor={compareB.triage.urgency_badge_color}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Symptom Metrics</span>
                      <div className="grid grid-cols-2 gap-2 mt-1 text-xs text-slate-700">
                        <div>Duration: <span className="font-semibold">{compareB.symptom_data.duration_days} days</span></div>
                        <div>Itch Score: <span className="font-semibold">{compareB.symptom_data.itch_score}/10</span></div>
                        <div>Pain Score: <span className="font-semibold">{compareB.symptom_data.pain_score}/10</span></div>
                        <div>Spreading: <span className="font-semibold">{compareB.symptom_data.is_spreading ? "Yes" : "No"}</span></div>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Optical Viability</span>
                      <div className="text-xs text-slate-700 mt-1">
                        Quality Index: <span className="font-bold text-[#006194]">{compareB.quality_metrics.overall_usability_score.toFixed(1)}/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progression Note */}
              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">Clinical Comparative Guidance: </span>
                Any enlargement exceeding 2 mm, transformation in asymmetric border morphology, or transition from Tier 1 to Tier 2/3 represents active disease progression. Provide this longitudinal summary to your consulting physician.
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsComparing(false)}
                  className="px-5 py-2 rounded-xl bg-[#006194] text-white text-xs font-semibold hover:bg-[#004e77]"
                >
                  Close Comparison
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
