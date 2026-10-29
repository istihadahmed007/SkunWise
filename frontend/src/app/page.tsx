"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function LandingPage() {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Can SkinWise AI diagnose melanoma or skin cancer?",
      a: "No. SkinWise AI is not an automated diagnostic device and cannot confirm or rule out skin malignancies. The platform uses deep computer vision to evaluate structural markers (asymmetry, border regularity, color variation) against validated dermatological criteria to assign an auditable clinical triage level (Routine Observation vs. Specialist Examination Recommended). For definitive diagnosis, an in-person physical consultation and histological biopsy by a certified pathologist is mandatory."
    },
    {
      q: "What happens to my uploaded photographs?",
      a: "Your images undergo immediate client-side anonymization. Sensitive metadata, GPS coordinates, and camera device serials are stripped before server ingestion. Images are processed securely in volatile memory for the duration of the triage scan and are never sold to data brokers or used for third-party advertising. Furthermore, you can toggle Zero-Cloud Image Retention to purge photos immediately after analysis."
    },
    {
      q: "Does the algorithm work accurately across darker skin tones (Fitzpatrick IV–VI)?",
      a: "Yes. Our testing protocols explicitly counteract historical dermatological dataset bias by evaluating performance across all Fitzpatrick phototypes (Types I through VI). Erythema thresholds and lesion edge contrast meters automatically account for localized baseline skin pigmentation to ensure equitable sensitivity."
    },
    {
      q: "How does the Doctor Referral PDF export function work?",
      a: "With one click, you can generate a standardized pre-consultation clinical summary PDF (aligned with HL7/FHIR clinical document standards). The dossier compiles your lesion capture, optical quality scores, reported symptom timelines, and primary differential considerations so your dermatologist can review structured evidence prior to examination."
    }
  ];

  return (
    <div className="flex flex-col w-full">
      {/* 1. Trust Ticker / Clinical Assurance Bar */}
      <section className="w-full bg-surface-container-low py-2.5 border-b border-surface-container-high/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-gutter flex flex-wrap items-center justify-between gap-space-sm text-xs">
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span className="font-headline font-bold text-tertiary uppercase tracking-wider">
              Clinical Triage Engine v4.2 Active
            </span>
          </div>
          <div className="flex items-center gap-space-md text-on-surface-variant font-medium">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">lock</span>
              AES-256 Client-Side Anonymization
            </span>
            <span className="hidden md:flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-secondary">verified</span>
              CE Class I SaMD Framework
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-tertiary">shield</span>
              ISO 27001 & HIPAA Aligned
            </span>
          </div>
        </div>
      </section>

      {/* 2. Hero & Live Clinical Preview */}
      <section className="w-full px-gutter py-space-xl lg:py-20 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-tertiary-fixed-dim/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-6 space-y-space-lg">
            <div className="inline-flex items-center gap-space-xs bg-surface-container-high px-space-md py-1 rounded-full shadow-xs">
              <span className="material-symbols-outlined text-primary text-base">neurology</span>
              <span className="font-headline text-label-sm text-on-surface uppercase tracking-wider font-bold">
                Dermatology AI • Clinical Safety First
              </span>
            </div>

            <div className="space-y-space-md">
              <h1 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl text-on-background tracking-tight leading-tight">
                Understand Your Skin. <br />
                <span className="text-primary">Know Your Next Step.</span>
              </h1>
              <p className="text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
                AI-assisted dermatological photo & symptom analysis designed with clinical reassurance, privacy safeguards, and clear medical triage pathways.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
              <Link
                href="/assess"
                className="inline-flex items-center gap-space-xs bg-primary hover:bg-secondary text-on-primary px-space-xl py-3.5 rounded-xl font-headline text-label-md font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <span className="material-symbols-outlined text-xl">photo_camera</span>
                <span>Check Your Skin</span>
                <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-space-xs bg-surface-container-lowest hover:bg-surface-container text-on-surface px-space-lg py-3.5 rounded-xl font-headline text-label-md font-semibold transition-all shadow-xs border border-surface-container-high"
              >
                <span className="material-symbols-outlined text-xl text-primary">play_circle</span>
                <span>How It Works</span>
              </a>
            </div>

            {/* Metrics Strip */}
            <div className="pt-space-md grid grid-cols-3 gap-space-md max-w-lg">
              <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-xs border border-surface-container-high">
                <div className="font-headline font-bold text-xl text-primary">98.4%</div>
                <div className="text-xs text-on-surface-variant">Quality gate accuracy</div>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-xs border border-surface-container-high">
                <div className="font-headline font-bold text-xl text-tertiary">30 Sec</div>
                <div className="text-xs text-on-surface-variant">Structured guidance</div>
              </div>
              <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-xs border border-surface-container-high">
                <div className="font-headline font-bold text-xl text-secondary">Zero-Log</div>
                <div className="text-xs text-on-surface-variant">Biometric storage</div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Clinical Preview Card */}
          <div className="lg:col-span-6 relative" id="triage-preview">
            <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-space-lg relative overflow-hidden border border-surface-container-high">
              {/* Header */}
              <div className="flex items-center justify-between pb-space-md border-b border-surface-container-high">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary font-bold">
                    <span className="material-symbols-outlined text-xl">biotech</span>
                  </div>
                  <div>
                    <div className="font-headline font-semibold text-label-md text-on-surface">
                      Specimen Preview: Dorsal Forearm
                    </div>
                    <div className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span>Session #SW-9042</span> • <span>Macro calibrated</span>
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-headline text-xs font-bold uppercase">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span>Routine Derm Consult</span>
                </div>
              </div>

              {/* Viewport Split: Specimen + HUD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md my-space-md">
                <div className="relative rounded-xl overflow-hidden shadow-xs bg-inverse-surface aspect-square flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                    {/* Simulated skin lesion canvas */}
                    <div className="w-24 h-24 rounded-full bg-amber-900/60 blur-xs border border-amber-950/40 relative shadow-inner">
                      <div className="absolute top-4 left-6 w-8 h-8 rounded-full bg-amber-950/70" />
                    </div>
                  </div>
                  {/* HUD Overlay */}
                  <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none">
                    <div className="flex justify-between items-center text-white text-[11px] font-mono">
                      <span className="bg-inverse-surface/80 backdrop-blur-xs px-2 py-0.5 rounded">
                        Focal lock 100%
                      </span>
                      <span className="material-symbols-outlined text-tertiary-fixed text-base">
                        center_focus_strong
                      </span>
                    </div>
                    <div className="bg-inverse-surface/85 backdrop-blur-xs text-white text-xs px-2 py-1 rounded">
                      <span className="text-secondary-fixed font-semibold">Target:</span> 4.2mm Pigmented Macule
                    </div>
                  </div>
                </div>

                {/* Pre-Assessment Quality Meters */}
                <div className="bg-surface-container-low p-space-md rounded-xl space-y-3 flex flex-col justify-center">
                  <div className="font-headline text-xs text-on-surface uppercase tracking-wider font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-primary">verified_user</span>
                    Optical Viability Matrix
                  </div>

                  {/* Meter 1: Lighting */}
                  <div>
                    <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                      <span>Lighting Balance</span>
                      <span className="font-semibold text-on-surface">98% Optimal</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                      <div className="bg-tertiary h-full rounded-full" style={{ width: "98%" }} />
                    </div>
                  </div>

                  {/* Meter 2: Sharpness */}
                  <div>
                    <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                      <span>Edge Sharpness</span>
                      <span className="font-semibold text-on-surface">94% High</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: "94%" }} />
                    </div>
                  </div>

                  {/* Meter 3: Glare */}
                  <div>
                    <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                      <span>Color Fidelity</span>
                      <span className="font-semibold text-on-surface">ΔE &lt; 1.2</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "91%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnostic Evidence Breakdown */}
              <div className="bg-surface-container-low p-space-sm rounded-xl space-y-2 mb-space-md">
                <div className="text-xs font-headline font-semibold text-on-surface flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-base">rule</span>
                    ABCDE Pattern Correlation
                  </span>
                  <span className="text-[11px] text-on-surface-variant">Validated Criteria</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="bg-surface-container-lowest p-2 rounded-lg">
                    <div className="text-[11px] text-on-surface-variant">Asymmetry</div>
                    <div className="text-xs font-bold text-tertiary">0.12 (Symmetric)</div>
                  </div>
                  <div className="bg-surface-container-lowest p-2 rounded-lg">
                    <div className="text-[11px] text-on-surface-variant">Border Margin</div>
                    <div className="text-xs font-bold text-tertiary">Defined</div>
                  </div>
                  <div className="bg-surface-container-lowest p-2 rounded-lg">
                    <div className="text-[11px] text-on-surface-variant">Color Saturation</div>
                    <div className="text-xs font-bold text-secondary">Monotone</div>
                  </div>
                </div>
              </div>

              {/* Mandatory Notice */}
              <div className="bg-surface-container-low p-space-sm rounded-xl flex items-start gap-space-xs text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-base mt-0.5 shrink-0">info</span>
                <p>
                  <strong className="text-on-surface font-semibold">Pre-Consultation Triage:</strong>{" "}
                  This analysis indicates low probability of atypical dysplasia. Routine observation recommended. If lesion develops rapid bleeding, itching, or size change, consult a dermatologist promptly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Patient Safety Architecture (Trust Pillars) */}
      <section className="w-full bg-surface-container-low py-space-xl border-y border-surface-container-high/60">
        <div className="max-w-7xl mx-auto px-gutter">
          <div className="text-center max-w-2xl mx-auto mb-space-lg space-y-space-xs">
            <h2 className="font-headline font-bold text-xs uppercase tracking-wider text-primary">
              Patient Safety Architecture
            </h2>
            <p className="font-headline font-bold text-2xl sm:text-3xl text-on-background">
              Engineered to clinical scrutiny, not Silicon Valley hype.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {/* Pillar 1 */}
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs border border-surface-container-high space-y-space-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center mb-space-md">
                  <span className="material-symbols-outlined text-2xl text-on-primary">enhanced_encryption</span>
                </div>
                <h3 className="font-headline font-bold text-headline-sm text-on-surface mb-1">
                  Zero Identity Storage
                </h3>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  Every captured frame is desensitized client-side. Metadata, EXIF coordinates, and facial markers are permanently scrubbed before model evaluation.
                </p>
              </div>
              <div className="pt-space-sm font-headline text-xs font-bold text-primary">
                Zero Cloud Retention Toggle
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs border border-surface-container-high space-y-space-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center mb-space-md">
                  <span className="material-symbols-outlined text-2xl text-on-tertiary">medical_information</span>
                </div>
                <h3 className="font-headline font-bold text-headline-sm text-on-surface mb-1">
                  Clinical Guardrails
                </h3>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  Calibrated strictly to probabilistic triage boundaries. The system refuses to output definitive diagnosis labels, routing uncertain patterns straight to licensed specialists.
                </p>
              </div>
              <div className="pt-space-sm font-headline text-xs font-bold text-tertiary">
                Probabilistic Triage Only
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs border border-surface-container-high space-y-space-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center mb-space-md">
                  <span className="material-symbols-outlined text-2xl text-on-secondary">fact_check</span>
                </div>
                <h3 className="font-headline font-bold text-headline-sm text-on-surface mb-1">
                  Board-Vetted Protocol
                </h3>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  The ABCDE dermatological framework and symptom weightings are designed alongside board-certified dermatologists across varied Fitzpatrick skin types.
                </p>
              </div>
              <div className="pt-space-sm font-headline text-xs font-bold text-secondary">
                Diverse Skin Phototypes
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs border border-surface-container-high space-y-space-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-surface-container-high text-primary flex items-center justify-center mb-space-md">
                  <span className="material-symbols-outlined text-2xl">verified_user</span>
                </div>
                <h3 className="font-headline font-bold text-headline-sm text-on-surface mb-1">
                  HIPAA & GDPR Compliant
                </h3>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  Full European General Data Protection Regulation and US HIPAA adherence with complete, instantaneous user-authorized self-deletion rights.
                </p>
              </div>
              <div className="pt-space-sm font-headline text-xs font-bold text-on-surface-variant">
                Revocable Consent Model
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Three Steps to Diagnostic Clarity */}
      <section className="w-full py-space-xl lg:py-24" id="how-it-works">
        <div className="max-w-7xl mx-auto px-gutter">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
            <div className="space-y-space-xs">
              <span className="font-headline text-xs font-bold text-secondary uppercase tracking-widest">
                System Workflow
              </span>
              <h2 className="font-headline font-bold text-2xl sm:text-3xl text-on-background">
                Three Steps to Diagnostic Clarity
              </h2>
            </div>
            <p className="text-body-md text-on-surface-variant max-w-md leading-relaxed">
              Simple enough for emergency bedside self-triage, rigorous enough to generate a doctor-ready assessment summary.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Step 1 */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high space-y-space-md group hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary font-headline font-bold text-lg flex items-center justify-center">
                  1
                </span>
                <span className="material-symbols-outlined text-secondary text-2xl">photo_camera</span>
              </div>
              <div className="h-40 rounded-xl bg-surface-container-low flex items-center justify-center p-4">
                <div className="border-2 border-dashed border-primary/40 rounded-xl w-full h-full flex flex-col items-center justify-center gap-2 text-primary text-xs font-medium">
                  <span className="material-symbols-outlined text-3xl">center_focus_strong</span>
                  <span>Optical Macro Guidance</span>
                </div>
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface mb-1">
                  Capture Guided Photo
                </h3>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  Our smart sensor validates focal sharpness, ambient glare, and camera distance in real-time, preventing blurry or deceptive submissions.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high space-y-space-md group hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary font-headline font-bold text-lg flex items-center justify-center">
                  2
                </span>
                <span className="material-symbols-outlined text-secondary text-2xl">checklist</span>
              </div>
              <div className="h-40 rounded-xl bg-surface-container-low flex items-center justify-center p-4">
                <div className="bg-surface-container-lowest rounded-xl p-3 shadow-xs w-full space-y-2 text-xs">
                  <div className="flex justify-between font-semibold text-on-surface">
                    <span>Pruritus (Itching)</span>
                    <span className="text-secondary">VAS 7/10</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: "70%" }} />
                  </div>
                  <div className="text-[11px] text-on-surface-variant">Onset: 5 days ago</div>
                </div>
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface mb-1">
                  Targeted Symptom Triage
                </h3>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  Answer contextual clinical questions: evolution over time, sensory irritation (itching, burning), prior exposures, and systemic flags.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high space-y-space-md group hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary font-headline font-bold text-lg flex items-center justify-center">
                  3
                </span>
                <span className="material-symbols-outlined text-tertiary text-2xl">description</span>
              </div>
              <div className="h-40 rounded-xl bg-surface-container-low flex items-center justify-center p-4">
                <div className="bg-surface-container-lowest rounded-xl p-3 shadow-xs w-full space-y-2 text-xs border border-surface-container-high">
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Doctor Recommended</span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant">Timeline: Within 1–2 Weeks</div>
                  <div className="bg-surface-container-high/60 py-1 px-2 rounded text-[11px] text-primary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">picture_as_pdf</span>
                    <span>PDF Referral Dossier Ready</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface mb-1">
                  Triage Action Guidance
                </h3>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  Instantly view clear recommendations: routine monitoring vs. specialist scheduling, evidence breakdown, and a clinical PDF summary to share with your doctor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Algorithmic Capabilities Bento Grid */}
      <section className="w-full bg-surface-container-low py-space-xl lg:py-24 border-y border-surface-container-high/60">
        <div className="max-w-7xl mx-auto px-gutter">
          <div className="max-w-2xl mb-space-xl space-y-space-xs">
            <span className="font-headline text-xs font-bold text-primary uppercase tracking-widest">
              Algorithmic Capabilities
            </span>
            <h2 className="font-headline font-bold text-2xl sm:text-3xl text-on-background">
              Engineered to Augment Clinical Triage
            </h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Advanced computer vision calibrated with clinical caution to minimize false reassurance and unnecessary emergency visits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {/* Feature 1: Edge & Pattern (7 cols) */}
            <div className="md:col-span-7 bg-surface-container-lowest rounded-2xl p-space-xl shadow-xs border border-surface-container-high flex flex-col justify-between">
              <div className="space-y-space-sm mb-space-lg">
                <div className="inline-flex p-space-sm rounded-xl bg-primary-container text-on-primary">
                  <span className="material-symbols-outlined text-2xl">texture</span>
                </div>
                <h3 className="font-headline font-bold text-xl text-on-surface">
                  Sub-Millimeter Edge & Pigment Pattern Recognition
                </h3>
                <p className="text-body-md text-on-surface-variant max-w-xl leading-relaxed">
                  Extracts high-resolution morphological parameters: border irregularity, pigment network divergence, and peripheral reticular streaks modeled on dermoscopic criteria.
                </p>
              </div>
              <div className="bg-surface-container p-space-md rounded-xl flex items-center justify-between gap-space-sm text-xs">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-tertiary">check_circle</span>
                  <span className="font-medium text-on-surface">Automated Border Irregularity Index</span>
                </div>
                <span className="font-headline font-bold bg-surface-container-lowest px-3 py-1 rounded-full text-primary">
                  0.08 Variance
                </span>
              </div>
            </div>

            {/* Feature 2: Multi-Factor Clinical Logic (5 cols) */}
            <div className="md:col-span-5 bg-surface-container-lowest rounded-2xl p-space-xl shadow-xs border border-surface-container-high flex flex-col justify-between">
              <div className="space-y-space-sm mb-space-lg">
                <div className="inline-flex p-space-sm rounded-xl bg-secondary-container text-on-secondary">
                  <span className="material-symbols-outlined text-2xl">account_tree</span>
                </div>
                <h3 className="font-headline font-bold text-xl text-on-surface">
                  Multi-Factor Symptom Cross-Check
                </h3>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  An isolated image is never enough. The algorithm synthesizes photo patterns with duration, pruritus, bleeding history, and chemical exposures.
                </p>
              </div>
              <div className="flex items-center gap-1 text-secondary font-headline text-xs font-bold">
                <span>Bayesian Evidence Fusion Active</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>

            {/* Feature 3: Safe Self-Care & What to Avoid (5 cols) */}
            <div className="md:col-span-5 bg-surface-container-lowest rounded-2xl p-space-xl shadow-xs border border-surface-container-high flex flex-col justify-between">
              <div className="space-y-space-sm mb-space-lg">
                <div className="inline-flex p-space-sm rounded-xl bg-tertiary-container text-on-tertiary">
                  <span className="material-symbols-outlined text-2xl">health_and_safety</span>
                </div>
                <h3 className="font-headline font-bold text-xl text-on-surface">
                  Safe Self-Care & Contraindications
                </h3>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  Clear, safe instructions on gentle moisturization and cool compresses, alongside explicit warnings against dangerous home removals or unsupervised OTC steroids.
                </p>
              </div>
              <div className="bg-surface-container-low px-space-md py-2 rounded-lg text-on-surface-variant text-xs flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-sm text-tertiary">check</span>
                Evidence-based nursing protocols
              </div>
            </div>

            {/* Feature 4: Physician Referral Pack (7 cols) */}
            <div className="md:col-span-7 bg-surface-container-lowest rounded-2xl p-space-xl shadow-xs border border-surface-container-high flex flex-col justify-between">
              <div className="space-y-space-sm mb-space-lg">
                <div className="inline-flex p-space-sm rounded-xl bg-surface-container-high text-primary">
                  <span className="material-symbols-outlined text-2xl">send_to_mobile</span>
                </div>
                <h3 className="font-headline font-bold text-xl text-on-surface">
                  One-Click Doctor Referral PDF Export
                </h3>
                <p className="text-body-md text-on-surface-variant max-w-xl leading-relaxed">
                  Export standardized clinical dossiers ready for telehealth visits or in-person dermatology appointments, complete with timestamps and symptom timelines.
                </p>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-space-sm pt-space-xs text-xs">
                <div className="flex items-center gap-1 text-on-surface-variant font-medium">
                  <span className="material-symbols-outlined text-primary text-base">picture_as_pdf</span>
                  Standard HL7 / FHIR compatible formatting
                </div>
                <Link
                  href="/referral"
                  className="bg-surface-container hover:bg-surface-container-high text-on-surface px-4 py-2 rounded-lg font-headline font-semibold transition-colors"
                >
                  Doctor Network
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Ethical AI Commitment Banner */}
      <section className="w-full py-space-xl">
        <div className="max-w-7xl mx-auto px-gutter">
          <div className="bg-surface-container-lowest rounded-3xl p-space-xl shadow-md border-l-4 border-l-primary border border-surface-container-high flex flex-col lg:flex-row items-center justify-between gap-space-xl">
            <div className="space-y-space-sm max-w-3xl">
              <div className="flex items-center gap-space-xs text-primary font-headline text-xs uppercase tracking-wider font-bold">
                <span className="material-symbols-outlined text-base">gavel</span>
                <span>Ethical Artificial Intelligence Commitment</span>
              </div>
              <h2 className="font-headline font-bold text-xl sm:text-2xl text-on-surface leading-snug">
                &ldquo;AI does not replace a medical professional. Our engine identifies visual patterns and triage urgency to help you decide when to seek clinical care.&rdquo;
              </h2>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                SkinWise AI operates strictly as an informational decision-support and symptom triage companion. We continually calibrate false-negative thresholds toward excessive safety.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-space-sm w-full lg:w-auto shrink-0">
              <Link
                href="/assess"
                className="inline-flex items-center justify-center gap-space-xs bg-primary hover:bg-secondary text-on-primary px-space-lg py-3 rounded-xl font-headline text-label-md font-semibold transition-colors text-center shadow-xs"
              >
                Start Free Assessment
              </Link>
              <Link
                href="/referral"
                className="inline-flex items-center justify-center gap-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface px-space-lg py-3 rounded-xl font-headline text-label-md font-semibold transition-colors text-center"
              >
                Find In-Network Derm
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Clinical Clarity FAQ Accordion */}
      <section className="w-full bg-surface-container-low py-space-xl lg:py-24 border-t border-surface-container-high/60">
        <div className="max-w-4xl mx-auto px-gutter space-y-space-lg">
          <div className="text-center space-y-space-xs mb-space-xl">
            <span className="font-headline text-xs font-bold text-secondary uppercase tracking-widest">
              Questions & Answers
            </span>
            <h2 className="font-headline font-bold text-2xl sm:text-3xl text-on-background">
              Clinical Clarity & Privacy Answers
            </h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Everything you need to know about our triage technology, clinical scope, and privacy pledges.
            </p>
          </div>

          <div className="space-y-space-sm">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="bg-surface-container-lowest rounded-2xl shadow-xs overflow-hidden border border-surface-container-high transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full p-space-md text-left flex items-center justify-between text-on-surface font-headline font-semibold text-base transition-colors hover:bg-surface-container-low"
                    type="button"
                  >
                    <span>{faq.q}</span>
                    <span
                      className={`material-symbols-outlined text-primary transform transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-space-md pb-space-md text-on-surface-variant text-body-sm leading-relaxed border-t border-surface-container-high pt-2">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
