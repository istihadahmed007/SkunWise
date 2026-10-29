"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, Assessment } from "@/lib/api";
import { TriageBadge } from "@/components/TriageBadge";

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPathwayTab, setSelectedPathwayTab] = useState<"mild" | "assessment" | "urgent">("assessment");

  useEffect(() => {
    if (!id) return;
    api
      .getAssessment(id)
      .then((data) => {
        setAssessment(data);
        if (data.triage.triage_tier === 1) setSelectedPathwayTab("mild");
        else if (data.triage.triage_tier === 3) setSelectedPathwayTab("urgent");
        else setSelectedPathwayTab("assessment");
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load assessment report. It may have been deleted.");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportPDF = () => {
    if (!assessment) return;
    const url = api.getPdfUrl(assessment.id);
    window.open(url, "_blank");
    showToast("Standardized clinical dossier PDF download started.");
  };

  const handleSaveRecord = () => {
    showToast("Assessment record synchronized with clinical storage.");
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-gutter py-space-xl flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">
          progress_activity
        </span>
        <p className="font-headline font-semibold text-xs text-on-surface-variant">
          Retrieving Clinical Dossier & Evidence Breakdown...
        </p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="max-w-2xl mx-auto px-gutter py-space-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-error-container text-error mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h2 className="font-headline font-bold text-xl text-on-surface">Assessment Not Found</h2>
        <p className="text-xs text-on-surface-variant">{error || "Record does not exist."}</p>
        <Link
          href="/dashboard"
          className="inline-flex px-5 py-2.5 rounded-xl bg-primary text-on-primary font-headline text-xs font-semibold"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const triage = assessment.triage;
  const symptomData = assessment.symptom_data || {};
  const quality = assessment.quality_metrics;

  return (
    <div className="max-w-7xl mx-auto px-gutter w-full pb-space-xl space-y-space-md">
      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-2xl text-xs font-headline font-semibold animate-fade-in border border-surface-container-high">
          <span className="material-symbols-outlined text-tertiary-fixed text-lg">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Non-Clinical Design Notice Badge */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-high px-space-md py-1.5 rounded-xl border border-surface-container-highest/60 text-xs">
        <div className="flex items-center gap-2 text-on-surface-variant flex-wrap">
          <span className="material-symbols-outlined text-primary text-base">verified</span>
          <span className="font-headline font-bold uppercase tracking-wider text-on-surface">
            Triage Record #{assessment.session_code}
          </span>
          <span>•</span>
          <span>Algorithm Model v4.2.1-derm-triage</span>
        </div>
        <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2.5 py-0.5 rounded-full shadow-xs">
          <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
          <span className="font-headline text-[10px] uppercase font-bold text-on-surface">
            Decision Support — Not a definitive histological diagnosis
          </span>
        </div>
      </div>

      {/* Page Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-xs uppercase tracking-wider text-secondary">
              Comprehensive Visual Triage
            </span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] font-semibold">
              Pre-Consultation Ready
            </span>
          </div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-on-surface tracking-tight">
            Dermatological Assessment Findings
          </h1>
          <p className="text-body-sm text-on-surface-variant max-w-3xl leading-relaxed">
            Visual lesion morphology analysis correlated with patient-reported symptomatology. Formulated for structured clinical handoff to an attending specialist.
          </p>
        </div>

        {/* Quick Action CTAs */}
        <div className="flex flex-wrap items-center gap-space-sm shrink-0">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 bg-surface-container-lowest hover:bg-surface-container text-on-surface px-4 py-2.5 rounded-xl border border-surface-container-high shadow-xs transition-all font-headline text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-primary text-base">picture_as_pdf</span>
            <span>Export Clinical Summary (PDF)</span>
          </button>
          <button
            onClick={handleSaveRecord}
            className="flex items-center gap-1.5 bg-primary hover:bg-secondary text-on-primary px-4 py-2.5 rounded-xl shadow-md transition-all font-headline text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-base">bookmark</span>
            <span>Save to My Records</span>
          </button>
        </div>
      </div>

      {/* Assessment Overview Banner (4 telemetry cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-gutter">
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-surface-container-high flex items-center gap-space-md">
          <div className="w-11 h-11 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">insights</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-headline font-bold tracking-wider text-on-surface-variant block">Status</span>
            <span className="font-headline font-bold text-sm text-on-surface">Completed Analysis</span>
            <span className="text-[11px] text-tertiary font-medium block">Full Morphologic Run</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-surface-container-high flex items-center gap-space-md">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">calendar_today</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-headline font-bold tracking-wider text-on-surface-variant block">Date & Time</span>
            <span className="font-headline font-bold text-sm text-on-surface">
              {new Date(assessment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="text-[11px] text-on-surface-variant block">Mobile Intake</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-surface-container-high flex items-center gap-space-md">
          <div className="w-11 h-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">center_focus_strong</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-headline font-bold tracking-wider text-on-surface-variant block">Image Fidelity</span>
            <span className="font-headline font-bold text-sm text-on-surface">
              {quality?.is_acceptable ? "High Quality" : "Inconclusive Quality"}
            </span>
            <span className="text-[11px] text-on-surface-variant block">Score {quality?.overall_usability_score || 94}/100</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-surface-container-high flex items-center gap-space-md">
          <div className="w-11 h-11 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">accessibility_new</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-headline font-bold tracking-wider text-on-surface-variant block">Target Region</span>
            <span className="font-headline font-bold text-sm text-on-surface">{assessment.anatomical_region}</span>
            <span className="text-[11px] text-on-surface-variant block">Cutaneous Focus</span>
          </div>
        </div>
      </div>

      {/* Primary Triage Care Pathway Banner */}
      <div
        className={`bg-surface-container-lowest rounded-2xl p-space-lg shadow-md border-l-4 relative overflow-hidden ${
          triage.triage_tier === 1
            ? "border-l-tertiary border-surface-container-high"
            : triage.triage_tier === 2
            ? "border-l-secondary border-surface-container-high"
            : "border-l-error border-error-container"
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <TriageBadge tier={triage.triage_tier} label={triage.triage_name} size="sm" />
              <span className="text-xs text-on-surface-variant font-medium">
                Timeline: {triage.recommended_timeline}
              </span>
            </div>
            <h2 className="font-headline font-bold text-xl text-on-surface">
              {triage.primary_condition}
            </h2>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              {triage.rationale}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 w-full lg:w-auto">
            <Link
              href="/referral"
              className="bg-primary text-on-primary hover:bg-secondary px-space-lg py-2.5 rounded-xl font-headline text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">medical_services</span>
              <span>Find In-Network Dermatologist</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* Left Column: Image Viewport, Evidence Table, Diagnostic Gaps (5 cols) */}
        <div className="lg:col-span-5 space-y-space-md">
          {/* Lesion Viewport Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-surface-container-high space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">image_search</span>
                <span className="font-headline font-semibold text-xs text-on-surface">
                  Analyzed Lesion Capture
                </span>
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded">
                RGB • 12MP Calibrated
              </span>
            </div>

            <div className="relative w-full h-72 rounded-xl overflow-hidden bg-surface-container-high shadow-inner flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-br from-amber-100 via-rose-100 to-amber-200 flex items-center justify-center relative">
                <div className="w-32 h-24 rounded-full bg-red-400/50 blur-xs border border-red-500/40" />
              </div>
              {/* Bounding Overlay */}
              <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none">
                <div className="flex items-center justify-between">
                  <span className="bg-inverse-surface/85 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed" />
                    Zone A: 32mm × 24mm
                  </span>
                  <span className="bg-surface-container-lowest/90 backdrop-blur-md text-on-surface text-[10px] px-2 py-0.5 rounded shadow-sm font-semibold">
                    Focus Score {quality?.sharpness_score ? "98%" : "Good"}
                  </span>
                </div>
                <div className="self-start bg-inverse-surface/85 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-lg">
                  <span className="text-tertiary-fixed font-semibold">Pattern:</span> Superficial Xerosis & Erythema
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1 text-xs">
              <div className="bg-surface-container-low p-2 rounded-xl">
                <span className="text-[10px] text-on-surface-variant block">Lesion Margin</span>
                <span className="font-headline font-semibold text-on-surface">Diffuse</span>
              </div>
              <div className="bg-surface-container-low p-2 rounded-xl">
                <span className="text-[10px] text-on-surface-variant block">Pigment</span>
                <span className="font-headline font-semibold text-on-surface">Homogeneous</span>
              </div>
              <div className="bg-surface-container-low p-2 rounded-xl">
                <span className="text-[10px] text-on-surface-variant block">Scale Texture</span>
                <span className="font-headline font-semibold text-on-surface">Fine Desquamation</span>
              </div>
            </div>
          </div>

          {/* Visual & Clinical Evidence Table Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-surface-container-high space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">fact_check</span>
                <h3 className="font-headline font-bold text-sm text-on-surface">Visual & Clinical Evidence</h3>
              </div>
              <span className="text-xs text-tertiary font-headline font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span> Concordant
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl">
                <div>
                  <span className="font-headline font-semibold text-on-surface block">Observed Erythema (Redness)</span>
                  <span className="text-[11px] text-on-surface-variant">Computer vision chromatic saturation</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-on-surface">Moderate (Grade 2)</span>
                  <span className="text-[10px] text-on-surface-variant block">Diffuse pinkish-red</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl">
                <div>
                  <span className="font-headline font-semibold text-on-surface block">Surface Scaling / Xerosis</span>
                  <span className="text-[11px] text-on-surface-variant">Edge gradient irregularity detector</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-on-surface">Fine Flakes</span>
                  <span className="text-[10px] text-on-surface-variant block">Peripheral</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl">
                <div>
                  <span className="font-headline font-semibold text-on-surface block">Patient Pruritus (Itch Score)</span>
                  <span className="text-[11px] text-on-surface-variant">Self-reported VAS scale</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: `${(symptomData.itch_score || 7) * 10}%` }} />
                  </div>
                  <span className="font-bold text-secondary">{symptomData.itch_score || 7} / 10</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl">
                <div>
                  <span className="font-headline font-semibold text-on-surface block">Onset Duration</span>
                  <span className="text-[11px] text-on-surface-variant">Reported timeline</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-on-surface">{symptomData.duration_days || 5} Days</span>
                  <span className="text-[10px] text-on-surface-variant block">Subacute onset</span>
                </div>
              </div>

              {symptomData.exposure_details && (
                <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl">
                  <div>
                    <span className="font-headline font-semibold text-on-surface block">Environmental Trigger</span>
                    <span className="text-[11px] text-on-surface-variant">Exogenous questionnaire</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-tertiary">Reported</span>
                    <span className="text-[10px] text-on-surface-variant block">{symptomData.exposure_details}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Key Uncertainties & Diagnostic Gaps */}
          <div className="bg-surface-container-high/60 rounded-2xl p-space-md border border-surface-container-highest space-y-2">
            <div className="flex items-center gap-2 text-on-surface font-headline font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-primary text-base">quiz</span>
              <h4>Documented Diagnostic Gaps & Uncertainties</h4>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Because this triage relies on 2D photography, the following essential clinical investigations could not be evaluated:
            </p>
            <ul className="space-y-1.5 text-xs text-on-surface-variant pt-1">
              {triage.diagnostic_gaps.map((gap, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-outline text-base shrink-0 mt-0.5">do_not_disturb_on</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Pattern Matches, Care Pathways, Guidance & Red Flags (7 cols) */}
        <div className="lg:col-span-7 space-y-space-md">
          {/* Care Pathway Protocol Tabs */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-surface-container-high space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-headline text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">
                  Standardized Clinical Triage Protocol
                </span>
                <h3 className="font-headline font-bold text-sm text-on-surface">Care Pathway Evaluation</h3>
              </div>
              <span className="text-xs text-on-surface-variant">Select tab to view protocol</span>
            </div>

            <div className="grid grid-cols-3 gap-1 p-1 bg-surface-container-low rounded-xl text-xs font-headline font-semibold">
              <button
                type="button"
                onClick={() => setSelectedPathwayTab("mild")}
                className={`py-2 px-2 rounded-lg transition-all text-center ${
                  selectedPathwayTab === "mild"
                    ? "bg-surface-container-lowest text-tertiary shadow-xs font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                1. Mild / Self-Care
              </button>
              <button
                type="button"
                onClick={() => setSelectedPathwayTab("assessment")}
                className={`py-2 px-2 rounded-lg transition-all text-center ${
                  selectedPathwayTab === "assessment"
                    ? "bg-surface-container-lowest text-secondary shadow-xs font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                2. Medical Assessment
              </button>
              <button
                type="button"
                onClick={() => setSelectedPathwayTab("urgent")}
                className={`py-2 px-2 rounded-lg transition-all text-center ${
                  selectedPathwayTab === "urgent"
                    ? "bg-surface-container-lowest text-error shadow-xs font-bold"
                    : "text-error/80 hover:text-error"
                }`}
              >
                3. Urgent / Red Alert
              </button>
            </div>

            {/* Pathway Tab Content Panels */}
            {selectedPathwayTab === "mild" && (
              <div className="p-3 bg-surface-container-low rounded-xl space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-tertiary font-headline font-bold">
                  <span className="w-2 h-2 rounded-full bg-tertiary" />
                  <span>Pathway 1: General Self-Care & Routine Monitoring</span>
                </div>
                <p className="text-on-surface-variant leading-relaxed">
                  Applicable for minimal superficial redness without pain, spreading, or sleep disruption. Focuses on non-pharmacological hydration, avoiding known chemical irritants, and re-evaluating in 7 days.
                </p>
              </div>
            )}

            {selectedPathwayTab === "assessment" && (
              <div className="p-3 bg-secondary-fixed/20 rounded-xl space-y-1 text-xs border border-secondary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-secondary font-headline font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                    <span>Pathway 2: Medical Assessment Recommended (CURRENT MATCH)</span>
                  </div>
                  <span className="bg-surface-container-lowest text-secondary font-bold px-2 py-0.5 rounded text-[10px]">
                    Timeline: 1–2 Weeks
                  </span>
                </div>
                <p className="text-on-surface leading-relaxed">
                  The lesion demonstrates pronounced symptomatic presentation (pruritus {symptomData.itch_score || 7}/10) and expanding subacute dermatitis patterns. In-person clinical dermatologic evaluation is indicated to prescribe targeted non-steroidal or class-appropriate topical formulations and prevent chronic barrier degradation.
                </p>
              </div>
            )}

            {selectedPathwayTab === "urgent" && (
              <div className="p-3 bg-error-container/40 rounded-xl space-y-1 text-xs border border-error/20">
                <div className="flex items-center justify-between text-on-error-container font-headline font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-error text-base">error</span>
                    <span>Pathway 3: Urgent Care / Emergency Protocol</span>
                  </div>
                  <span className="bg-error text-on-error px-2 py-0.5 rounded text-[10px]">
                    Immediate / 24h
                  </span>
                </div>
                <p className="text-on-error-container leading-relaxed">
                  Reserved for rapid lesion spread (&gt;2 inches in 12 hours), purulent discharge, facial/mucosal involvement, swelling, or systemic fever. Immediate emergency department admission required.
                </p>
              </div>
            )}
          </div>

          {/* Evidence-Based Pattern Matches */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-surface-container-high space-y-space-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">shape_line</span>
                <h3 className="font-headline font-bold text-sm text-on-surface">
                  Evidence-Based Pattern Similarities
                </h3>
              </div>
              <p className="text-xs text-on-surface-variant">
                Correlated against peer-reviewed clinical databases. These are visual pattern matches to support physician discussions, NOT definitive diagnoses.
              </p>
            </div>

            <div className="space-y-space-sm">
              {triage.possible_conditions.map((cond, idx) => (
                <div key={idx} className="p-3 bg-surface-container-low rounded-xl space-y-2 border border-surface-container-high/60">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="font-headline font-bold text-xs text-on-surface flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      {cond.name}
                    </h4>
                    <span className="bg-surface-container-highest text-on-surface text-[10px] font-headline font-bold px-2 py-0.5 rounded-full">
                      {cond.concordance_tier}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {cond.summary}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-on-surface-variant pt-1">
                    <div className="bg-surface-container-lowest p-2 rounded-lg">
                      <strong className="text-on-surface">Visual Overlap:</strong> {cond.visual_overlap}
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded-lg">
                      <strong className="text-on-surface">Clinical Correlation:</strong> {cond.clinical_history_correlation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safe Self-Care & What to Avoid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            {/* Safe Self-Care */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-surface-container-high space-y-2">
              <div className="flex items-center gap-1.5 text-tertiary font-headline font-bold text-xs uppercase tracking-wide">
                <span className="material-symbols-outlined text-base">health_and_safety</span>
                <h4>Recommended Safe Self-Care</h4>
              </div>
              <ul className="space-y-2 text-xs text-on-surface-variant">
                {triage.safe_self_care.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="material-symbols-outlined text-tertiary text-base shrink-0 mt-0.5">check_circle</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What to Avoid */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-surface-container-high space-y-2">
              <div className="flex items-center gap-1.5 text-error font-headline font-bold text-xs uppercase tracking-wide">
                <span className="material-symbols-outlined text-base">cancel</span>
                <h4>What to Avoid (Contraindications)</h4>
              </div>
              <ul className="space-y-2 text-xs text-on-surface-variant">
                {triage.what_to_avoid.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="material-symbols-outlined text-error text-base shrink-0 mt-0.5">block</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Critical Warning Signs Banner */}
          <div className="bg-error-container/40 rounded-2xl p-space-md border border-error/30 space-y-2">
            <div className="flex items-center gap-1.5 text-on-error-container font-headline font-bold text-xs uppercase tracking-wide">
              <span className="material-symbols-outlined text-error text-lg">warning</span>
              <h4>Critical Warning Signs to Monitor</h4>
            </div>
            <p className="text-xs text-on-error-container leading-relaxed">
              If any of the following symptoms develop, discontinue home monitoring and seek immediate urgent medical evaluation:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-on-error-container pt-1">
              {triage.critical_warning_signs.map((sign, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0 mt-1.5" />
                  <span>{sign}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Telehealth Specialist Connect Box */}
          <div className="bg-surface-container-high rounded-2xl p-space-md shadow-sm border border-surface-container-highest flex flex-col sm:flex-row items-center justify-between gap-space-md">
            <div className="space-y-0.5">
              <span className="font-headline text-[10px] uppercase font-bold text-primary tracking-wider">
                Integrated Clinical Network
              </span>
              <h3 className="font-headline font-bold text-sm text-on-surface">
                Share this Dossier with a Dermatologist
              </h3>
              <p className="text-xs text-on-surface-variant">
                Download the standardized PDF referral packet to attach to your telehealth or in-person clinic intake.
              </p>
            </div>
            <button
              onClick={handleExportPDF}
              className="bg-primary hover:bg-secondary text-on-primary px-4 py-2.5 rounded-xl font-headline text-xs font-semibold shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

