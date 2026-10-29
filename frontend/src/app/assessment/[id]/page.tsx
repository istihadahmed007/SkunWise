"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, Assessment, getApiBaseUrl } from "@/lib/api";
import { TriageBadge } from "@/components/TriageBadge";
import { useLanguage } from "@/context/LanguageContext";

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const id = params?.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
        <span className="material-symbols-outlined text-4xl text-[#4da8b9] animate-spin">
          progress_activity
        </span>
        <p className="font-headline font-semibold text-xs sm:text-sm text-[#526373]">
          {language === "bn"
            ? "ফলাফল লোড করা হচ্ছে..."
            : "Loading your skin check summary..."}
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
        <h2 className="font-headline font-bold text-xl text-[#1c2834]">
          {language === "bn" ? "ফলাফল খুঁজে পাওয়া যায়নি" : "Skin Check Not Found"}
        </h2>
        <p className="text-xs text-[#526373]">
          {error || (language === "bn" ? "রেকর্ডটি বিদ্যমান নেই।" : "This record does not exist or has expired.")}
        </p>
        <Link
          href="/assess"
          className="inline-flex px-5 py-2.5 rounded-2xl bg-[#4da8b9] hover:bg-[#3a96a7] text-white font-headline text-xs font-bold transition-all"
        >
          {language === "bn" ? "নতুন ত্বক পরীক্ষা করুন" : "Check a new skin concern"}
        </Link>
      </div>
    );
  }

  const triage = assessment.triage;
  const symptomData = assessment.symptom_data || {};
  const isUrgent = triage.triage_tier === 3 || triage.emergency_warning_detected;
  const resolvedPhoto = getResolvedImageUrl(assessment.image_url);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#1c2834] text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-headline font-semibold animate-fade-in border border-slate-700">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. CRITICAL URGENT WARNING BANNER (If urgent signs present) */}
      {isUrgent && (
        <div className="p-6 rounded-3xl bg-rose-50 border-2 border-rose-300 shadow-md space-y-3">
          <div className="flex items-center gap-2.5 text-[#ba1a1a]">
            <span className="material-symbols-outlined text-2xl font-bold">warning</span>
            <h2 className="font-headline font-bold text-base sm:text-lg">
              {language === "bn"
                ? "জরুরি চিকিৎসা সহায়তা প্রয়োজন (Urgent Medical Attention Needed)"
                : "Urgent Medical Attention Needed"}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#7d1212] leading-relaxed">
            {language === "bn"
              ? "আপনার বর্ণিত লক্ষণসমূহে জরুরি বিপদচিহ্ন উপস্থিত রয়েছে (যেমন শ্বাসকষ্ট, মুখ ফুলে যাওয়া, জ্বর বা দ্রুত ছড়ানো ফোস্কা)। ছবি বা অ্যাপের নির্দেশিকার ওপর নির্ভর না করে অবিলম্বে সরাসরি জরুরি চিকিৎসা সেবা গ্রহণ করুন।"
              : "Your reported symptoms include urgent warning signs (such as breathing difficulty, facial swelling, high fever, or widespread blistering). Please seek emergency medical care immediately instead of relying on self-care or image analysis."}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-bold text-[#ba1a1a]">
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

      {/* 2. MAIN FINDING CARD */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <TriageBadge
              tier={triage.triage_tier}
              label={triage.triage_name}
              size="md"
            />
            <span className="text-xs text-[#526373]">
              {language === "bn" ? "সময়কাল:" : "Timeline:"} {triage.recommended_timeline}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e8f4f8] hover:bg-[#d8edf3] text-[#328493] text-xs font-headline font-bold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              <span>{t.exportPdf}</span>
            </button>
            <Link
              href="/assess"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1c2834] text-xs font-headline font-semibold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>{language === "bn" ? "নতুন পরীক্ষা" : "New check"}</span>
            </Link>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-headline font-bold uppercase tracking-wider text-[#328493] block">
            {language === "bn" ? "সম্ভাব্য দৃশ্যমান উদ্বেগ" : "Possible visible concern"}
          </span>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-[#1c2834]">
            {triage.primary_condition}
          </h1>
          <p className="text-xs sm:text-sm text-[#526373] leading-relaxed pt-1 max-w-3xl">
            {triage.rationale}
          </p>
        </div>
      </div>

      {/* 3. HONEST UNCERTAINTY NOTICE */}
      <div className="bg-[#f0f9fb] rounded-3xl p-5 sm:p-6 border border-[#cbe8f0] flex items-start gap-3.5">
        <span className="material-symbols-outlined text-[#328493] text-2xl shrink-0 mt-0.5">
          info
        </span>
        <div className="space-y-1">
          <h3 className="font-headline font-bold text-xs sm:text-sm text-[#1c2834]">
            {language === "bn"
              ? "ছবি এবং দূরবর্তী মূল্যায়নের সীমাবদ্ধতা"
              : "Important: Photos have limitations and this is not a diagnosis"}
          </h3>
          <p className="text-xs text-[#526373] leading-relaxed">
            {language === "bn"
              ? "ফোনের ক্যামেরা, কোণ বা আলোর তারতম্যের কারণে বিভিন্ন চর্মরোগ দেখতে একরকম লাগতে পারে। এই ফলাফল কোনো রোগ নির্ণয় নিশ্চিত করে না। নির্ভুল ও সঠিক চিকিৎসা পরামর্শের জন্য একজন বিশেষজ্ঞ চিকিৎসকের সাথে সরাসরি পরামর্শ করুন।"
              : "Visual pattern matching cannot replace an in-person physical exam. Different skin conditions often look similar in photos, and camera lighting can alter appearances. Only a qualified doctor or dermatologist can provide an accurate diagnosis."}
          </p>
        </div>
      </div>

      {/* 4. MAIN TWO-COLUMN CONTENT WORKSPACE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Photo & Doctor Check Triggers (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          {/* Photo Summary Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-xs space-y-4">
            <h3 className="font-headline font-bold text-sm text-[#1c2834] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4da8b9] text-base">photo_library</span>
              <span>{language === "bn" ? "সংযুক্ত ছবি ও তথ্য" : "Your photo & details"}</span>
            </h3>

            {/* Uploaded photo display or friendly placeholder */}
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-inner relative">
              {resolvedPhoto ? (
                <img
                  src={resolvedPhoto}
                  alt="Your skin photo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-[#526373] space-y-2">
                  <span className="material-symbols-outlined text-3xl text-[#4da8b9]">lock</span>
                  <p className="text-xs font-semibold">
                    {language === "bn"
                      ? "ছবিটি নিরাপদে প্রসেস করা হয়েছে"
                      : "Photo processed privately"}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Summary Metadata */}
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-[#526373]">{language === "bn" ? "শরীরের স্থান:" : "Body location:"}</span>
                <strong className="text-[#1c2834]">{assessment.anatomical_region}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-[#526373]">{language === "bn" ? "সময়কাল:" : "Duration:"}</span>
                <strong className="text-[#1c2834]">
                  {symptomData.duration_days ? `${symptomData.duration_days} days` : "Reported"}
                </strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-[#526373]">{language === "bn" ? "অস্বস্তি মাত্রা:" : "Discomfort level:"}</span>
                <strong className="text-[#328493]">{symptomData.itch_score ?? 5} / 10</strong>
              </div>
              {symptomData.exposure_details && (
                <div className="flex justify-between py-1.5">
                  <span className="text-[#526373]">{language === "bn" ? "নতুন পণ্য/স্পর্শ:" : "New exposure:"}</span>
                  <strong className="text-[#1c2834] text-right truncate max-w-[150px]">
                    {symptomData.exposure_details}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* When to See a Doctor Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-xs space-y-3">
            <h3 className="font-headline font-bold text-sm text-[#1c2834] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ba1a1a] text-lg">medical_services</span>
              <span>{language === "bn" ? "কখন ডাক্তারের কাছে যাবেন" : "When to see a doctor"}</span>
            </h3>
            <p className="text-xs text-[#526373] leading-relaxed">
              {language === "bn"
                ? "নিম্নে বর্ণিত কোনো পরিবর্তন দেখলে ঘরোয়া যত্ন বন্ধ করে ডাক্তারের পরামর্শ নিন:"
                : "Schedule an in-person doctor or dermatologist visit if you notice:"}
            </p>

            <ul className="space-y-2 text-xs text-[#526373]">
              {triage.critical_warning_signs && triage.critical_warning_signs.length > 0 ? (
                triage.critical_warning_signs.map((sign, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] shrink-0 mt-1.5" />
                    <span className="leading-relaxed">{sign}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] shrink-0 mt-1.5" />
                    <span>The spot doesn't improve or worsens after 1 to 2 weeks.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] shrink-0 mt-1.5" />
                    <span>The skin becomes warm to the touch, swollen, or increasingly painful.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] shrink-0 mt-1.5" />
                    <span>You notice yellow crusting, pus oozing, or spreading redness.</span>
                  </li>
                </>
              )}
            </ul>

            <div className="pt-2">
              <Link
                href="/referral"
                className="w-full py-2.5 px-4 rounded-2xl bg-[#e8f4f8] hover:bg-[#d8edf3] text-[#328493] font-headline text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">search</span>
                <span>{language === "bn" ? "চর্মরোগ বিশেষজ্ঞ খুঁজুন" : "Find a Dermatologist"}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Safe Guidance, What to Avoid, and Next Steps (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          {/* Safe Self-Care Guidance Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-white/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <span className="material-symbols-outlined text-xl">spa</span>
              <h3 className="font-headline font-bold text-sm">
                {language === "bn" ? "নিরাপদ ঘরোয়া যত্ন পরামর্শ" : "Safe, gentle care tips"}
              </h3>
            </div>
            <p className="text-xs text-[#526373] leading-relaxed">
              {language === "bn"
                ? "ত্বকের স্বাভাবিক সুরক্ষা অক্ষুণ্ণ রাখতে এই সাধারণ ও নিরাপদ অভ্যাসগুলো মেনে চলতে পারেন:"
                : "Conservative, gentle habits to soothe your skin barrier while monitoring:"}
            </p>

            <ul className="space-y-2.5 text-xs text-[#526373]">
              {triage.safe_self_care && triage.safe_self_care.length > 0 ? (
                triage.safe_self_care.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#f4fafc]">
                    <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span className="leading-relaxed text-[#1c2834]">{tip}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#f4fafc]">
                  <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span className="leading-relaxed text-[#1c2834]">
                    Wash gently with lukewarm water and a fragrance-free cleanser.
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* What to Avoid Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-white/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#ba1a1a]">
              <span className="material-symbols-outlined text-xl">block</span>
              <h3 className="font-headline font-bold text-sm">
                {language === "bn" ? "যা পরিহার করবেন" : "What to avoid"}
              </h3>
            </div>
            <p className="text-xs text-[#526373] leading-relaxed">
              {language === "bn"
                ? "ত্বকের ক্ষতি ও প্রদাহ এড়াতে নিম্নলিখিত বিষয়গুলো এড়িয়ে চলুন:"
                : "Avoid these common habits that can aggravate irritated skin:"}
            </p>

            <ul className="space-y-2 text-xs text-[#526373]">
              {triage.what_to_avoid && triage.what_to_avoid.length > 0 ? (
                triage.what_to_avoid.map((avoid, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50/50">
                    <span className="material-symbols-outlined text-[#ba1a1a] text-base shrink-0 mt-0.5">
                      cancel
                    </span>
                    <span className="leading-relaxed text-[#1c2834]">{avoid}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50/50">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-base shrink-0 mt-0.5">
                    cancel
                  </span>
                  <span className="leading-relaxed text-[#1c2834]">
                    Do not aggressively scratch or pick at irritated skin.
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* Similar Visible Patterns Considered */}
          {triage.possible_conditions && triage.possible_conditions.length > 0 && (
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-xs space-y-3">
              <h3 className="font-headline font-bold text-sm text-[#1c2834] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4da8b9] text-base">interests</span>
                <span>{language === "bn" ? "অনুরূপ দৃশ্যমান প্যাটার্নসমূহ" : "Similar visible patterns considered"}</span>
              </h3>
              <p className="text-xs text-[#526373]">
                {language === "bn"
                  ? "ছবিটির সাথে সামঞ্জস্যপূর্ণ সাধারণ ত্বকের লক্ষণ:"
                  : "Other common skin conditions with similar visual traits:"}
              </p>

              <div className="space-y-2 pt-1">
                {triage.possible_conditions.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-[#f4fafc] space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline font-bold text-xs text-[#1c2834]">
                        {item.name}
                      </h4>
                      <span className="text-[10px] text-[#526373] bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        {item.concordance_tier}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#526373] leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              href="/assess"
              className="w-full sm:w-auto flex-1 py-3 px-5 rounded-2xl bg-[#4da8b9] hover:bg-[#3a96a7] text-white font-headline text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add_a_photo</span>
              <span>{language === "bn" ? "আরেকটি ত্বক পরীক্ষা করুন" : "Check another concern"}</span>
            </Link>

            <button
              onClick={handleExportPDF}
              className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-white hover:bg-slate-50 text-[#1c2834] border border-slate-200 font-headline text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-[#4da8b9]">download</span>
              <span>{t.exportPdf}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
