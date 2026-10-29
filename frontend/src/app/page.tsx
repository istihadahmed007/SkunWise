"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const { t, lang } = useLanguage();
  const [showEducationalDetails, setShowEducationalDetails] = useState(false);

  const commonPatterns = [
    {
      title: lang === "bn" ? "শুষ্ক বা লালচে ত্বক (Eczema / Dryness)" : "Dry, Red, or Flaky Patches",
      description: lang === "bn"
        ? "ত্বকের স্বাভাবিক সুরক্ষা বাধা ক্ষতিগ্রস্ত হলে লালচে ভাব, খসখসে অনুভূতি বা চুলকানি দেখা দিতে পারে।"
        : "Rough, dry, or irritated patches often associated with moisture loss, harsh soaps, or cold dry weather.",
      selfCare: lang === "bn"
        ? "সুগন্ধিমুক্ত মৃদু ময়েশ্চারাইজার দিনে দুইবার ব্যবহার করুন।"
        : "Use a gentle, fragrance-free moisturizer twice daily to restore hydration."
    },
    {
      title: lang === "bn" ? "ব্রণ ও ফুসকুড়ি (Acne & Blemishes)" : "Blemishes & Clogged Pores",
      description: lang === "bn"
        ? "ত্বকের লোমকূপে অতিরিক্ত তেল ও মৃত কোষ জমলে ছোট লালচে ফুসকুড়ি বা ব্রণ হয়।"
        : "Localized bumps, whiteheads, or blackheads that develop in oil-producing skin areas.",
      selfCare: lang === "bn"
        ? "দিনে দুইবার হালকা ফেসওয়াশ দিয়ে মুখ ধুয়ে নিন; ব্রণ খুঁটবেন না।"
        : "Wash twice daily with a non-comedogenic cleanser. Never squeeze or pop blemishes."
    },
    {
      title: lang === "bn" ? "বৃত্তাকার বা চাকা দাগ (Ring Rashes)" : "Circular or Annular Rashes",
      description: lang === "bn"
        ? "গোলাকার লাল দাগ যার কিনারা কিছুটা উঁচু ও সক্রিয় থাকে।"
        : "Rashes with defined circular or curved borders that may develop in warm, humid skin folds.",
      selfCare: lang === "bn"
        ? "ত্বক সর্বদা পরিষ্কার ও শুকনো রাখুন এবং চিকিৎসকের পরামর্শ নিন।"
        : "Keep the area completely dry and arrange a medical consultation for targeted care."
    },
    {
      title: lang === "bn" ? "পরিবর্তনশীল বা অস্বাভাবিক তিল (Spots to Monitor)" : "Spots Changing in Color or Shape",
      description: lang === "bn"
        ? "যে তিলের আকার অসমান, রঙের বৈচিত্র্য আছে বা যা সময়ের সাথে সাথে বড় হচ্ছে।"
        : "Moles or spots with irregular borders, varied shades, or noticeable growth over time.",
      selfCare: lang === "bn"
        ? "দেরি না করে সরাসরি একজন চর্মরোগ বিশেষজ্ঞকে দেখান।"
        : "Always schedule an in-person physical examination with a doctor or dermatologist."
    }
  ];

  return (
    <div className="bg-[#f0f8fb] text-[#192531] min-h-screen">
      
      {/* =========================================================================
          1. HERO SECTION: Concise, Purpose-First, Single Primary CTA
          ========================================================================= */}
      <section className="px-4 sm:px-6 pt-10 pb-12 sm:pb-16 max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl sm:rounded-4xl p-8 sm:p-14 shadow-sm border border-[#d6e8f0] flex flex-col md:flex-row items-center gap-8 sm:gap-12">
          
          {/* Main Action Callout */}
          <div className="flex-1 space-y-6 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2b7f8f] bg-[#eaf4f8] px-3.5 py-1.5 rounded-full border border-[#cce4ee]">
              <span className="w-2 h-2 rounded-full bg-[#2b7f8f]" />
              {lang === "bn" ? "সহজ ও নিরাপদ ত্বক যাচাই" : "Safe & Private Skin Guidance"}
            </span>

            <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#192531] tracking-tight leading-tight">
              {t.heroHeadline}
            </h1>

            <p className="text-base sm:text-lg text-[#4a5d6e] leading-relaxed max-w-xl">
              {t.heroSubhead}
            </p>

            {/* ONE PROMINENT BUTTON */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <Link
                href="/assess"
                className="w-full sm:w-auto bg-[#2b7f8f] hover:bg-[#216774] text-white text-base font-bold px-8 py-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 focus:outline-none focus:ring-4 focus:ring-teal-200"
              >
                <span className="material-symbols-outlined text-2xl" aria-hidden="true">photo_camera</span>
                <span>{t.analyzeSkinBtn}</span>
              </Link>
              
              <a
                href="#how-it-works"
                className="text-sm font-semibold text-[#4a5d6e] hover:text-[#192531] transition-colors py-2 px-3"
              >
                {lang === "bn" ? "ব্যবহারবিধি জানুন ↓" : "How it works ↓"}
              </a>
            </div>

            <p className="text-xs text-[#718292] pt-1">
              🔒 {lang === "bn" ? "আপনার ছবি সুরক্ষিত। এটি কোনো চূড়ান্ত রোগ নির্ণয় নয়।" : "Photos are processed privately. This service provides guidance and does not diagnose disease."}
            </p>
          </div>

          {/* Calm Visual Presentation Card */}
          <div className="w-full md:w-80 lg:w-96 shrink-0">
            <div className="bg-[#eaf4f8] rounded-3xl p-6 sm:p-7 border border-[#cce4ee] text-left space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2b7f8f] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-2xl">health_and_safety</span>
              </div>
              <h2 className="font-headline font-bold text-lg text-[#192531]">
                {lang === "bn" ? "শান্ত ও নির্ভরযোগ্য যত্ন" : "Calm, Safe Guidance"}
              </h2>
              <p className="text-sm text-[#4a5d6e] leading-relaxed">
                {lang === "bn"
                  ? "ত্বকের সমস্যায় উদ্বিগ্ন না হয়ে সহজে একটি স্পষ্ট ছবি দিয়ে লক্ষণ পর্যালোচনা করুন এবং উপযুক্ত ঘরোয়া অভ্যাস জানুন।"
                  : "Explore possible visible patterns, learn conservative skincare routines, and know clearly when to see a healthcare professional."}
              </p>
              <div className="pt-3 border-t border-[#d6e8f0] flex items-center gap-2 text-xs font-bold text-[#2b7f8f]">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{lang === "bn" ? "২ মিনিটে সম্পন্ন • কোনো বিজ্ঞাপনী বিভ্রান্তি নেই" : "Takes under 2 mins • No unverified claims"}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          2. HOW IT WORKS (3 Simple Steps)
          ========================================================================= */}
      <section id="how-it-works" className="px-4 sm:px-6 py-12 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-headline font-extrabold text-2xl sm:text-3xl text-[#192531]">
            {lang === "bn" ? "কীভাবে কাজ করে" : "How It Works"}
          </h2>
          <p className="text-sm sm:text-base text-[#4a5d6e] max-w-lg mx-auto">
            {lang === "bn"
              ? "৩টি সাধারণ ধাপে আপনার ত্বকের যত্ন ও নির্দেশিকা জানুন।"
              : "Three clear, reassuring steps to understand your skin and plan your next move."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-7 border border-[#d6e8f0] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#eaf4f8] text-[#2b7f8f] font-bold text-sm flex items-center justify-center">
              1
            </div>
            <h3 className="font-headline font-bold text-base text-[#192531]">
              {lang === "bn" ? "১. একটি স্পষ্ট ছবি তুলুন" : "1. Add a Clear Photo"}
            </h3>
            <p className="text-sm text-[#4a5d6e] leading-relaxed">
              {lang === "bn"
                ? "প্রাকৃতিক আলোতে আপনার ফোন দিয়ে ত্বকের উদ্বেগজনক অংশের ছবি তুলুন বা গ্যালারি থেকে দিন।"
                : "Take a focused photo in natural daytime lighting (4–6 inches away) with camera flash turned off."}
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-7 border border-[#d6e8f0] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#eaf4f8] text-[#2b7f8f] font-bold text-sm flex items-center justify-center">
              2
            </div>
            <h3 className="font-headline font-bold text-base text-[#192531]">
              {lang === "bn" ? "২. সংক্ষিপ্ত প্রশ্নের উত্তর দিন" : "2. Answer Short Questions"}
            </h3>
            <p className="text-sm text-[#4a5d6e] leading-relaxed">
              {lang === "bn"
                ? "সময়কাল, চুলকানি বা অস্বস্তি এবং আপনার কসমেটিক ত্বকের অনুভূতি নির্বাচন করুন।"
                : "Share duration, discomfort level, new product exposures, and your daily cosmetic skin feel."}
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-7 border border-[#d6e8f0] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#eaf4f8] text-[#2b7f8f] font-bold text-sm flex items-center justify-center">
              3
            </div>
            <h3 className="font-headline font-bold text-base text-[#192531]">
              {lang === "bn" ? "৩. পরামর্শ ও যত্ন নির্দেশিকা পান" : "3. Get Practical Guidance"}
            </h3>
            <p className="text-sm text-[#4a5d6e] leading-relaxed">
              {lang === "bn"
                ? "সম্ভাব্য দৃশ্যমান লক্ষণ, কসমেটিক ত্বকের ধরন, সর্বোচ্চ ৩টি যত্ন পরামর্শ এবং পরবর্তী পদক্ষেপ জানুন।"
                : "Receive visible pattern matches, cosmetic skin type estimates, 3 practical product categories, and doctor visit guidance."}
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. PRIVACY & DATA PROTECTION SECTION
          ========================================================================= */}
      <section className="px-4 sm:px-6 py-10 max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#d6e8f0] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-[#2b7f8f] font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-lg">shield_lock</span>
              <span>{lang === "bn" ? "আপনার ব্যক্তিগত গোপনীয়তা" : "Privacy by Design"}</span>
            </div>
            <h3 className="font-headline font-bold text-xl text-[#192531]">
              {lang === "bn" ? "আপনার স্বাস্থ্য সংক্রান্ত তথ্য সম্পূর্ণ আপনার নিয়ন্ত্রণে" : "Your Health Data Stays in Your Hands"}
            </h3>
            <p className="text-sm text-[#4a5d6e] leading-relaxed">
              {lang === "bn"
                ? "আমরা কোনো বিজ্ঞাপনদাতার কাছে তথ্য বিক্রি করি না। আপনি জিরো-ক্লাউড মোড চালু রাখলে ছবি তাৎক্ষণিকভাবে মেমোরিতে প্রসেস হয় এবং সার্ভারে স্থায়ীভাবে রাখা হয় না।"
                : "SkinWise provides optional Zero-Cloud processing so images are scrubbed from memory immediately after review. You can view, export, or permanently delete your records at any time."}
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <Link
              href="/assess"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#eaf4f8] hover:bg-[#d8ecf4] text-[#2b7f8f] font-headline text-sm font-bold transition-colors"
            >
              <span>{t.analyzeSkinBtn}</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. MEDICAL LIMITATION & EMERGENCY SAFETY NOTICE
          ========================================================================= */}
      <section className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        <div className="bg-rose-50/70 rounded-3xl p-6 sm:p-8 border border-rose-200/80 space-y-3">
          <div className="flex items-center gap-2.5 text-[#ba1a1a]">
            <span className="material-symbols-outlined text-2xl font-bold">emergency</span>
            <h3 className="font-headline font-bold text-base sm:text-lg">
              {lang === "bn" ? "জরুরি চিকিৎসা সতর্কতা ও সীমাবদ্ধতা" : "Important Medical Limitation Notice"}
            </h3>
          </div>
          <p className="text-sm text-[#7d1212] leading-relaxed">
            {lang === "bn"
              ? "স্কিনওয়াইজ একটি শিক্ষামূলক ও তথ্যভিত্তিক সহায়ক অ্যাপ্লিকেশন। এটি কোনো রোগ নির্ণয় করে না, প্রেসক্রিপশন দেয় না এবং চিকিৎসকের বিকল্প নয়। যদি আপনার তীব্র শ্বাসকষ্ট, মুখ বা ঠোঁট ফুলে যাওয়া, জ্বরের সাথে দ্রুত ছড়িয়ে পড়া ফুসকুড়ি বা তীব্র ব্যথা থাকে, অবিলম্বে হাসপাতালে যান বা জরুরি নম্বরে (যুক্তরাষ্ট্র: ৯১১, ইউরোপ: ১১২, বাংলাদেশ: ৯৯৯) কল করুন।"
              : "SkinWise provides informational guidance only and is not a substitute for professional clinical advice, examination, or diagnosis. If you experience sudden breathing difficulty, facial or throat swelling, a spreading rash with high fever, or severe pain, contact emergency services (US: 911, EU: 112, Bangladesh: 999) or visit the nearest emergency room immediately."}
          </p>
        </div>
      </section>

      {/* =========================================================================
          5. COMPACT EXPANDABLE EDUCATIONAL DRAWER (Secondary Information)
          ========================================================================= */}
      <section className="px-4 sm:px-6 py-8 pb-16 max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl border border-[#d6e8f0] shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setShowEducationalDetails(!showEducationalDetails)}
            className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-[#f8fcfe] transition-colors cursor-pointer"
            aria-expanded={showEducationalDetails}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#2b7f8f] text-xl">menu_book</span>
              <div>
                <h3 className="font-headline font-bold text-base text-[#192531]">
                  {lang === "bn" ? "সাধারণ দৃশ্যমান ত্বকের প্যাটার্ন সম্পর্কে জানুন (ঐচ্ছিক)" : "Explore Common Visible Skin Patterns (Optional Educational Reference)"}
                </h3>
                <p className="text-xs text-[#718292]">
                  {lang === "bn" ? "একজিমা, ব্রণ, ছত্রাক ও তিলের বিবরণ দেখতে ক্লিক করুন" : "Click to view common non-diagnostic descriptions for irritation, blemishes, and spots"}
                </p>
              </div>
            </div>
            <span className={`material-symbols-outlined text-xl text-[#718292] transition-transform duration-200 ${showEducationalDetails ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>

          {showEducationalDetails && (
            <div className="p-6 pt-0 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              {commonPatterns.map((pat, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#f0f8fb] space-y-2">
                  <h4 className="font-headline font-bold text-sm text-[#192531]">{pat.title}</h4>
                  <p className="text-xs text-[#4a5d6e] leading-relaxed">{pat.description}</p>
                  <p className="text-xs text-[#2b7f8f] font-medium pt-1">💡 {pat.selfCare}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
