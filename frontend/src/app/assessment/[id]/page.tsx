"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, Assessment, getApiBaseUrl } from "@/lib/api";
import { TriageBadge } from "@/components/TriageBadge";
import { useLanguage } from "@/context/LanguageContext";
import { UVGuidanceCard } from "@/components/UVGuidanceCard";
import { CosmeticSafetyCard } from "@/components/CosmeticSafetyCard";

export default function AssessmentDetailPage() {
  const params = useParams();
  const { t, language } = useLanguage();
  const id = params?.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [showExpandableDetails, setShowExpandableDetails] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    api
      .getAssessment(id)
      .then((data) => {
        setAssessment(data);
      })
      .catch((err) => {
        console.error(err);
        setError(
          language === "bn"
            ? "ফলাফল পাওয়া যায়নি বা মুছে ফেলা হয়েছে।"
            : "Assessment report could not be found. It may have expired or been removed."
        );
      })
      .finally(() => setIsLoading(false));
  }, [id, language]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExportPDF = () => {
    if (!assessment) return;
    const url = api.getPdfUrl(assessment.id);
    window.open(url, "_blank");
    showToast(
      language === "bn"
        ? "পিডিএফ ডাউনলোড শুরু হয়েছে।"
        : "Summary PDF download started."
    );
  };

  const getResolvedImageUrl = (url?: string) => {
    if (!url || url.includes("EPHEMERAL_PURGED") || url.includes("placeholder")) {
      return null;
    }
    if (url.startsWith("http")) return url;
    const baseUrl = getApiBaseUrl();
    if (baseUrl.startsWith("http")) {
      const origin = new URL(baseUrl).origin;
      return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
    }
    return url;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <span className="material-symbols-outlined text-4xl text-[#2b7f8f] animate-spin">
          progress_activity
        </span>
        <p className="font-headline font-semibold text-sm sm:text-base text-[#4a5d6e]">
          {language === "bn"
            ? "ফলাফল লোড করা হচ্ছে..."
            : "Loading your skin analysis summary..."}
        </p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-[#ba1a1a] mx-auto flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h2 className="font-headline font-bold text-xl text-[#192531]">
          {language === "bn" ? "ফলাফল খুঁজে পাওয়া যায়নি" : "Skin Analysis Not Found"}
        </h2>
        <p className="text-sm text-[#4a5d6e]">
          {error || (language === "bn" ? "রেকর্ডটি বিদ্যমান নেই।" : "This record does not exist or has expired.")}
        </p>
        <Link
          href="/assess"
          className="inline-flex px-6 py-3 rounded-2xl bg-[#2b7f8f] hover:bg-[#216774] text-white font-headline text-sm font-bold transition-all shadow-xs"
        >
          {language === "bn" ? "নতুন ত্বক পরীক্ষা করুন" : "Analyze a new skin concern"}
        </Link>
      </div>
    );
  }

  const triage = assessment.triage;
  const isUrgent = triage.triage_tier === 3 || triage.emergency_warning_detected;
  const resolvedPhoto = getResolvedImageUrl(assessment.image_url);

  // Localization overlay data from model
  const detectedArea = triage.detected_area;
  const hasBoundingBox = Boolean(detectedArea?.has_detection && detectedArea.bounding_box);
  const bbox = detectedArea?.bounding_box;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-[#192531]">
      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#192531] text-white px-4 py-3 rounded-2xl shadow-xl text-sm font-headline font-semibold animate-fade-in border border-slate-700">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP EMERGENCY ALERT (When Red Flags are Detected) */}
      {isUrgent && (
        <div className="p-6 rounded-3xl bg-rose-50 border-2 border-rose-300 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-[#ba1a1a]">
            <span className="material-symbols-outlined text-2xl font-bold">emergency</span>
            <h2 className="font-headline font-bold text-lg">
              {language === "bn"
                ? "জরুরি চিকিৎসা সহায়তা প্রয়োজন (Urgent Medical Attention Needed)"
                : "Urgent Medical Attention Needed"}
            </h2>
          </div>
          <p className="text-sm text-[#7d1212] leading-relaxed">
            {language === "bn"
              ? "আপনার বর্ণিত লক্ষণসমূহে জরুরি বিপদচিহ্ন উপস্থিত রয়েছে (যেমন শ্বাসকষ্ট, মুখ ফুলে যাওয়া, জ্বর বা দ্রুত ছড়ানো ফুসকুড়ি)। অ্যাপের ছবির ফলাফলের ওপর নির্ভর না করে সরাসরি জরুরি সেবা নিন।"
              : "Your reported symptoms include urgent warning signs (such as breathing difficulty, facial swelling, high fever, or rapidly spreading blistering). Please seek emergency medical care immediately instead of relying on self-care or image analysis."}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-bold text-[#ba1a1a]">
            <span className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 shadow-xs">
              United States: Dial 911
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 shadow-xs">
              European Union: Dial 112
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 shadow-xs">
              Bangladesh: Dial 999
            </span>
          </div>
        </div>
      )}

      {/* Header Strip with Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#d6e8f0]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2b7f8f]">
            {language === "bn" ? "বিশ্লেষণ ফলাফল" : "Analysis Summary"}
          </span>
          <h1 className="font-headline font-extrabold text-2xl sm:text-3xl text-[#192531]">
            {language === "bn" ? "আপনার ত্বকের মূল্যায়ন ও যত্ন" : "Your Skin Health Guidance"}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#cce4ee] hover:bg-[#f0f8fb] text-[#2b7f8f] text-xs sm:text-sm font-headline font-bold transition-colors cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            <span>{t.exportPdf}</span>
          </button>
          <Link
            href="/assess"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2b7f8f] hover:bg-[#216774] text-white text-xs sm:text-sm font-headline font-bold transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>{language === "bn" ? "নতুন পরীক্ষা" : "Analyze Another Spot"}</span>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: MAIN FINDING
          - Plain-language description of visible concern
          - Relevant highlighted photo with toggle overlay
          - Honest confidence or uncertainty indicator
          ========================================================================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#d6e8f0] shadow-xs space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#eaf4f8] text-[#2b7f8f] font-bold text-sm flex items-center justify-center">
              1
            </span>
            <h2 className="font-headline font-bold text-lg sm:text-xl text-[#192531]">
              {t.sectionMainFinding}
            </h2>
          </div>

          <TriageBadge
            tier={triage.triage_tier}
            label={triage.triage_name}
            size="md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Photo Viewport with Genuine Model Localization Box & Toggle */}
          <div className="md:col-span-5 space-y-3">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 shadow-inner flex items-center justify-center select-none">
              {resolvedPhoto ? (
                <>
                  <img
                    src={resolvedPhoto}
                    alt="Analyzed skin photograph"
                    className="w-full h-full object-cover"
                  />

                  {/* Model-Generated Bounding Box Highlight Overlay */}
                  {hasBoundingBox && bbox && showOverlay && (
                    <div
                      className="absolute border-2 border-[#2b7f8f] bg-[#2b7f8f]/15 rounded-lg shadow-sm pointer-events-none transition-all duration-200"
                      style={{
                        top: `${bbox.ymin / 10}%`,
                        left: `${bbox.xmin / 10}%`,
                        height: `${(bbox.ymax - bbox.ymin) / 10}%`,
                        width: `${(bbox.xmax - bbox.xmin) / 10}%`,
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-[#2b7f8f] text-white text-[10px] font-bold px-2 py-0.5 rounded-t-md whitespace-nowrap">
                        {detectedArea?.label || (language === "bn" ? "শনাক্তকৃত এলাকা" : "Observed Area")}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 text-center text-slate-300 space-y-1">
                  <span className="material-symbols-outlined text-3xl">photo_camera</span>
                  <p className="text-xs">
                    {language === "bn" ? "ছবি প্রক্রিয়াজাত করা হয়েছে" : "Photo processed privately"}
                  </p>
                </div>
              )}
            </div>

            {/* Toggle Overlay Button & Explanation */}
            <div className="flex items-center justify-between text-xs text-[#4a5d6e]">
              {hasBoundingBox ? (
                <button
                  type="button"
                  onClick={() => setShowOverlay(!showOverlay)}
                  className="inline-flex items-center gap-1.5 text-xs font-headline font-bold text-[#2b7f8f] hover:text-[#216774] py-1 px-2 rounded-lg bg-[#eaf4f8] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">
                    {showOverlay ? "visibility_off" : "visibility"}
                  </span>
                  <span>{showOverlay ? t.overlayActive : t.overlayHidden}</span>
                </button>
              ) : (
                <span className="text-[11px] text-[#718292]">
                  {language === "bn"
                    ? "এই ছবিতে আলাদা কোনো স্থানভিত্তিক বক্স প্রযোজ্য নয় (সার্বিক বিস্তার)।"
                    : "Localization overlay unavailable (diffuse pattern or model localization unavailable)."}
                </span>
              )}

              <span className="text-[11px] text-[#718292]">
                {assessment.anatomical_region}
              </span>
            </div>
          </div>

          {/* Finding Description & Honest Uncertainty Indicator */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2b7f8f] block">
                {language === "bn" ? "সম্ভাব্য দৃশ্যমান লক্ষণ" : "Possible visible concern"}
              </span>
              <h3 className="font-headline font-extrabold text-2xl text-[#192531] mt-0.5">
                {triage.main_finding || triage.primary_condition}
              </h3>
            </div>

            <p className="text-sm text-[#4a5d6e] leading-relaxed">
              {triage.rationale}
            </p>

            {/* Honest Confidence & Uncertainty Indicator */}
            <div className="p-4 rounded-2xl bg-[#eaf4f8] border border-[#cce4ee] space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#2b7f8f]">
                <span className="material-symbols-outlined text-base">info</span>
                <span>{language === "bn" ? "সতর্কতা ও নির্ভুলতার মাত্রা" : "Honest Model Uncertainty Notice"}</span>
              </div>
              <p className="text-[#4a5d6e] leading-relaxed">
                {triage.confidence_statement ||
                  (language === "bn"
                    ? "এটি শুধুমাত্র কম্পিউটার ভিশন প্যাটার্ন সাদৃশ্য। ফোনের ছবি ত্বকের গভীরতা বা তাপমাত্রা বুঝতে পারে না। নিশ্চিত রোগ নির্ণয়ের জন্য চিকিৎসকের পরীক্ষা আবশ্যক।"
                    : "This visual pattern match is informational only. Phone photographs cannot replace physical palpation and clinical medical evaluation.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: COSMETIC SKIN TYPE
          - Estimated cosmetic skin type and brief explanation
          - Clearly identify whether it comes from questionnaire, model, or both
          - Never treat as equivalent to skin disease
          ========================================================================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#d6e8f0] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[#eaf4f8] text-[#2b7f8f] font-bold text-sm flex items-center justify-center">
            2
          </span>
          <h2 className="font-headline font-bold text-lg sm:text-xl text-[#192531]">
            {t.sectionSkinType}
          </h2>
        </div>

        <div className="p-5 rounded-2xl bg-[#f0f8fb] border border-[#cce4ee] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="font-headline font-extrabold text-lg text-[#192531]">
                {triage.cosmetic_skin_type?.skin_type || "Normal / Balanced Skin"}
              </span>
              <span className="text-[11px] font-bold bg-white text-[#2b7f8f] px-2.5 py-0.5 rounded-full border border-[#cce4ee]">
                {triage.cosmetic_skin_type?.source || "Questionnaire self-report & image context"}
              </span>
            </div>
            <p className="text-sm text-[#4a5d6e] leading-relaxed">
              {triage.cosmetic_skin_type?.explanation ||
                (language === "bn"
                  ? "আপনার প্রশ্নের উত্তরের ভিত্তিতে ত্বকের স্বাভাবিক তেল ও আর্দ্রতার মাত্রা।"
                  : "Based on your reported midday skin feel and product sensitivity.")}
            </p>
          </div>

          <div className="text-[11px] text-[#718292] bg-white p-3 rounded-xl border border-slate-200 max-w-xs leading-normal">
            ℹ️ {language === "bn"
              ? "কসমেটিক ত্বকের ধরন কোনো রোগ নয়; এটি কেবল উপযুক্ত ময়েশ্চারাইজার ও ক্লিনার নির্বাচনে সহায়তা করে।"
              : "Cosmetic skin type describes oil and hydration balance, not a medical condition."}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: WHAT TO USE
          - Maximum of 3 relevant skincare product categories or ingredient options
          - Explain briefly what each does and how to use it
          - Practical patch testing advice (stop if irritation occurs)
          - No invented brands or treatment claims
          ========================================================================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#d6e8f0] shadow-xs space-y-5">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-[#eaf4f8] text-[#2b7f8f] font-bold text-sm flex items-center justify-center">
            3
          </span>
          <h2 className="font-headline font-bold text-lg sm:text-xl text-[#192531]">
            {t.sectionWhatToUse}
          </h2>
        </div>

        <p className="text-sm text-[#4a5d6e]">
          {language === "bn"
            ? "ত্বকের স্বাভাবিক সুরক্ষা অক্ষুণ্ণ রাখতে সর্বোচ্চ ৩টি নিরাপদ প্রসাধন উপাদান পরামর্শ:"
            : "Up to three conservative, gentle skincare product categories suited for your skin barrier:"}
        </p>

        {/* 3 Skincare Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(triage.recommended_skincare && triage.recommended_skincare.length > 0
            ? triage.recommended_skincare.slice(0, 3)
            : [
                {
                  category: "Gentle Cleanser",
                  role: "Cleanses surface dirt and excess oil gently without stripping lipids.",
                  how_to_use: "Wash twice daily with lukewarm water. Pat dry gently.",
                },
                {
                  category: "Fragrance-Free Moisturizer",
                  role: "Hydrates and protects the natural skin barrier.",
                  how_to_use: "Apply morning and evening after washing.",
                },
                {
                  category: "Broad-Spectrum Sunscreen (SPF 30+)",
                  role: "Defends against UV radiation and prevents inflammation.",
                  how_to_use: "Apply daily in the morning before sun exposure.",
                },
              ]
          ).map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-[#f0f8fb] border border-[#cce4ee] space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#2b7f8f] text-white flex items-center justify-center text-xs font-bold">
                {idx + 1}
              </div>
              <h3 className="font-headline font-bold text-sm text-[#192531]">
                {item.category}
              </h3>
              <p className="text-xs text-[#4a5d6e] leading-relaxed">
                <strong className="text-[#192531]">What it does:</strong> {item.role}
              </p>
              <p className="text-xs text-[#4a5d6e] leading-relaxed pt-1 border-t border-slate-200">
                <strong className="text-[#192531]">How to use:</strong> {item.how_to_use}
              </p>
            </div>
          ))}
        </div>

        {/* Mandatory Patch Testing Warning */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
          <span className="material-symbols-outlined text-base mt-0.5 shrink-0 text-amber-700">warning</span>
          <p>{t.patchTestNotice}</p>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: WHAT TO DO NEXT
          - No more than three practical care tips
          - One short list of relevant things to avoid
          - Clear care level: "General self-care", "Arrange a doctor visit", or "Seek urgent medical care"
          ========================================================================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#d6e8f0] shadow-xs space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#eaf4f8] text-[#2b7f8f] font-bold text-sm flex items-center justify-center">
              4
            </span>
            <h2 className="font-headline font-bold text-lg sm:text-xl text-[#192531]">
              {t.sectionWhatToDoNext}
            </h2>
          </div>

          {/* Care Level Indicator */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#eaf4f8] text-[#2b7f8f] border border-[#cce4ee]">
            <span className="w-2 h-2 rounded-full bg-[#2b7f8f]" />
            <span>Care Level: {triage.care_level || "General self-care"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Practical Care Tips (Max 3) */}
          <div className="space-y-3">
            <h3 className="font-headline font-bold text-sm text-[#192531] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
              <span>{language === "bn" ? "করণীয় ৩টি অভ্যাস" : "Recommended Steps"}</span>
            </h3>

            <ul className="space-y-2 text-xs sm:text-sm text-[#4a5d6e]">
              {(triage.practical_care_tips && triage.practical_care_tips.length > 0
                ? triage.practical_care_tips.slice(0, 3)
                : triage.safe_self_care.slice(0, 3)
              ).map((tip, idx) => (
                <li key={idx} className="p-3 rounded-xl bg-[#f0f8fb] leading-relaxed flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2b7f8f] shrink-0 mt-2" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Things to Avoid (Short List) */}
          <div className="space-y-3">
            <h3 className="font-headline font-bold text-sm text-[#ba1a1a] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">block</span>
              <span>{language === "bn" ? "যা পরিহার করবেন" : "Things to Avoid"}</span>
            </h3>

            <ul className="space-y-2 text-xs sm:text-sm text-[#4a5d6e]">
              {(triage.what_to_avoid && triage.what_to_avoid.length > 0
                ? triage.what_to_avoid.slice(0, 3)
                : [
                    "Do not aggressively scratch or pick at the area.",
                    "Avoid harsh scrubs, drying alcohol, or heavily perfumed products.",
                    "Do not apply unprescribed medicated creams without a doctor's advice."
                  ]
              ).map((avoid, idx) => (
                <li key={idx} className="p-3 rounded-xl bg-rose-50/60 leading-relaxed flex items-start gap-2 text-rose-950">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] shrink-0 mt-2" />
                  <span>{avoid}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Doctor Referral Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <p className="text-xs text-[#718292]">
            {language === "bn"
              ? "লক্ষণ না কমলে বা ২ সপ্তাহের বেশি স্থায়ী হলে সরাসরি ডাক্তারের পরামর্শ নিন।"
              : "If symptoms do not improve after 1–2 weeks or cause discomfort, schedule an in-person doctor visit."}
          </p>

          <Link
            href="/referral"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#eaf4f8] hover:bg-[#d8ecf4] text-[#2b7f8f] font-headline text-xs font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-base">search</span>
            <span>{language === "bn" ? "চর্মরোগ বিশেষজ্ঞ খুঁজুন" : "Find a Dermatologist"}</span>
          </Link>
        </div>
      </section>

      {/* =========================================================================
          OPTIONAL PUBLIC INTEGRATIONS: UV Guidance & Cosmetic Safety
          ========================================================================= */}
      <div className="space-y-6">
        <UVGuidanceCard />
        <CosmeticSafetyCard />
      </div>

      {/* =========================================================================
          COMPACT EXPANDABLE SECTION: Additional Clinical Details & References
          ========================================================================= */}
      <section className="bg-white rounded-3xl border border-[#d6e8f0] shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowExpandableDetails(!showExpandableDetails)}
          className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-[#f8fcfe] transition-colors cursor-pointer"
          aria-expanded={showExpandableDetails}
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#2b7f8f] text-lg">description</span>
            <span className="font-headline font-bold text-sm text-[#192531]">
              {language === "bn" ? "বিকল্প সম্ভাব্য প্যাটার্ন ও চিকিৎসা তথ্যসূত্র (ঐচ্ছিক)" : "Alternative Visible Patterns & References (Optional)"}
            </span>
          </div>
          <span className={`material-symbols-outlined text-lg text-[#718292] transition-transform duration-200 ${showExpandableDetails ? "rotate-180" : ""}`}>
            expand_more
          </span>
        </button>

        {showExpandableDetails && (
          <div className="p-6 pt-0 border-t border-slate-100 space-y-4 text-xs">
            {/* Alternative Condition Matches */}
            {triage.possible_conditions && triage.possible_conditions.length > 1 && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wide text-[#718292]">
                  {language === "bn" ? "অন্যান্য সম্ভাব্য বিবেচনা" : "Other Pattern Considerations"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {triage.possible_conditions.slice(1).map((cond, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#f0f8fb] space-y-1">
                      <strong className="text-[#192531] block">{cond.name}</strong>
                      <p className="text-[#4a5d6e] leading-relaxed">{cond.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diagnostic Gaps & Limitations */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <h4 className="font-bold text-xs uppercase tracking-wide text-[#718292]">
                {language === "bn" ? "প্রযুক্তিগত সীমাবদ্ধতা" : "Assessment Limitations"}
              </h4>
              <ul className="space-y-1 text-[#718292]">
                {triage.diagnostic_gaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#2b7f8f]">•</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
