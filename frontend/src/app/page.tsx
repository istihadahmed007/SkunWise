"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const { t, lang } = useLanguage();
  const [activeConcern, setActiveConcern] = useState<any | null>(null);

  // Common skin concerns described in plain language
  const commonConcerns = [
    {
      id: "irritation",
      title: lang === "bn" ? "শুষ্ক, লালচে বা চুলকানি ত্বক" : "Dry, Red, or Itchy Patches",
      simpleName: lang === "bn" ? "একজিমা বা ত্বকের অস্বস্তি" : "Often associated with Eczema or Dry Skin",
      description: lang === "bn"
        ? "ত্বক খসখসে হয়ে যাওয়া, লালচে দাগ বা চুলকানি হওয়া। সাধারণত সাবান, আবহাওয়া বা সংবেদনশীল ত্বকে এমন হতে পারে।"
        : "Rough, itchy, or reddish patches that may feel tight or sensitive. Often triggered by dry weather, harsh soaps, or barrier irritation.",
      careTip: lang === "bn"
        ? "হালকা কুসুম গরম পানিতে গোসল করুন এবং সুগন্ধিমুক্ত ময়েশ্চারাইজার ব্যবহার করুন।"
        : "Gently cleanse with lukewarm water and apply a plain, fragrance-free moisturizing cream. Avoid scratching.",
    },
    {
      id: "acne",
      title: lang === "bn" ? "ব্রণ ও ছোট ফুসকুড়ি" : "Blemishes, Pimples & Blackheads",
      simpleName: lang === "bn" ? "সাধারণ ব্রণ (Acne)" : "Common Acne & Clogged Pores",
      description: lang === "bn"
        ? "মুখ বা পিঠের ত্বকে তেল ও ময়লা জমে ছোট লাল ফুসকুড়ি বা ব্রণ হওয়া।"
        : "Small red bumps, whiteheads, or blackheads that develop when skin pores become clogged with oil and dead skin cells.",
      careTip: lang === "bn"
        ? "দিনে দুইবার মৃদু ফেসওয়াশ দিয়ে মুখ ধুয়ে নিন। ব্রণ খুঁটবেন বা চাপবেন না।"
        : "Wash gently twice a day with a mild, non-soap cleanser. Never squeeze or pop blemishes to prevent scarring.",
    },
    {
      id: "fungal",
      title: lang === "bn" ? "গোলাকার বা চাকা দাগ" : "Ring-Shaped or Circular Rashes",
      simpleName: lang === "bn" ? "ছত্রাক সংক্রমণ (Fungal ring)" : "Possible Fungal Rash (Tinea)",
      description: lang === "bn"
        ? "ত্বকে গোল চাকার মতো লাল দাগ যার মাঝখানটা কিছুটা পরিষ্কার থাকে এবং চুলকায়।"
        : "A circular rash with slightly raised red edges and a clearer center that may itch. Often develops in warm, damp skin folds.",
      careTip: lang === "bn"
        ? "ত্বক সবসময় শুকনো রাখুন এবং আলাদা তোয়ালে ব্যবহার করুন। চিকিৎসকের পরামর্শ নিন।"
        : "Keep the area clean and dry. Use dedicated towels to avoid spreading and check with a doctor.",
    },
    {
      id: "contact",
      title: lang === "bn" ? "স্পর্শজনিত লালচে ফুসকুড়ি" : "Sudden Rashes & Redness",
      simpleName: lang === "bn" ? "অ্যালার্জি বা রিঅ্যাকশন" : "Contact Sensitivity or Irritation",
      description: lang === "bn"
        ? "নতুন কোনো প্রসাধনী, ডিটারজেন্ট, সাবান বা উদ্ভিদের সংস্পর্শে এসে হঠাৎ লালচে হওয়া।"
        : "A localized red rash that appears after touching a new cosmetic, detergent, jewelry metal, or botanical product.",
      careTip: lang === "bn"
        ? "যে জিনিসের কারণে হতে পারে তা ব্যবহার বন্ধ রাখুন। পরিষ্কার ঠান্ডা ভেজা কাপড় দিয়ে ঠান্ডা রাখুন।"
        : "Stop using any suspected new product immediately. Apply a cool damp cloth to soothe the area.",
    },
    {
      id: "mole",
      title: lang === "bn" ? "সাধারণ তিল ও মেচেতা" : "Common Moles & Freckles",
      simpleName: lang === "bn" ? "স্বাভাবিক তিল (Benign moles)" : "Stable Spots & Pigmentation",
      description: lang === "bn"
        ? "ত্বকের স্বাভাবিক একরঙা ছোট দাগ বা তিল যার চারপাশ সমান থাকে।"
        : "Small, uniform brown or tan spots with smooth, even borders that stay the same size over long periods.",
      careTip: lang === "bn"
        ? "প্রতিদিন রোদে বের হওয়ার আগে সানস্ক্রিন ব্যবহার করুন এবং মাসে একবার নিজে লক্ষ্য রাখুন।"
        : "Protect your skin with daily broad-spectrum sunscreen. Check your skin once a month for changes.",
    },
    {
      id: "changing-spot",
      title: lang === "bn" ? "পরিবর্তনশীল বা অস্বাভাবিক তিল" : "Spots Changing in Shape or Color",
      simpleName: lang === "bn" ? "ডাক্তারকে দেখানোর মতো দাগ" : "Spots to Monitor Closely",
      description: lang === "bn"
        ? "যে তিলের আকার অসমান, রঙে বৈচিত্র্য আছে বা যা সময়ের সাথে সাথে বড় হচ্ছে।"
        : "Any mole or spot with jagged edges, multiple shades (brown, black, red), growing diameter, or that bleeds easily.",
      careTip: lang === "bn"
        ? "দেরি না করে সরাসরি চর্মরোগ বিশেষজ্ঞকে দেখান।"
        : "Schedule an in-person physical examination with a doctor or dermatologist. Do not attempt home removal.",
    },
  ];

  return (
    <div className="bg-[#f8fafd] text-slate-800">
      
      {/* =========================================================================
          1. HERO SECTION: Simple, Reassuring, Single Primary Action
          ========================================================================= */}
      <section className="px-4 sm:px-6 pt-8 pb-14 sm:pb-20 max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-12 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center gap-8 sm:gap-12">
          
          {/* Left Text & Primary Action */}
          <div className="flex-1 space-y-5 text-center md:text-left">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#2b7f8f] bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              {lang === "bn" ? "সহজ ও নিরাপদ ত্বক যাচাই" : "Simple, Private Skin Health Helper"}
            </span>

            <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {lang === "bn" ? "আপনার ত্বকের সমস্যা সহজে বুঝুন।" : "Understand your skin concern."}
              <br />
              <span className="text-[#2b7f8f]">
                {lang === "bn" ? "জেনে নিন পরবর্তী পদক্ষেপ।" : "Know what to do next."}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              {lang === "bn"
                ? "ত্বকের একটি স্পষ্ট ছবি তুলুন এবং কয়েকটি সহজ প্রশ্নের উত্তর দিন। সাধারণ ত্বকের লক্ষণ, মৃদু যত্ন এবং কখন ডাক্তারের পরামর্শ নেওয়া উচিত তা জেনে নিন।"
                : "Take or upload a photo to compare common visible skin patterns, learn gentle self-care habits, and understand when to consult a qualified doctor."}
            </p>

            {/* ONE OBVIOUS PRIMARY ACTION */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
              <Link
                href="/assess"
                className="w-full sm:w-auto bg-[#2b7f8f] hover:bg-[#236a77] text-white text-base font-bold px-8 py-4 rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-teal-200"
              >
                <span className="material-symbols-outlined text-xl" aria-hidden="true">photo_camera</span>
                <span>{t.checkSkinConcern}</span>
              </Link>
              
              <a
                href="#can-and-cannot"
                className="w-full sm:w-auto text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-3 rounded-full hover:bg-slate-100 transition-colors text-center"
              >
                {lang === "bn" ? "কীভাবে কাজ করে জানুন ↓" : "See what it does & doesn't do ↓"}
              </a>
            </div>

            <p className="text-xs text-slate-500 pt-1">
              🔒 {lang === "bn" ? "আপনার ছবি সুরক্ষিত রাখা হয়। কোনো চূড়ান্ত রোগ নির্ণয় নয়।" : "Photos are private. This app provides guidance and does not diagnose disease."}
            </p>
          </div>

          {/* Right Visual Card */}
          <div className="w-full md:w-80 lg:w-96 shrink-0">
            <div className="bg-gradient-to-br from-teal-50 to-sky-50 rounded-2xl p-6 border border-teal-100 text-left space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#2b7f8f] text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-xl" aria-hidden="true">health_and_safety</span>
              </div>
              <h2 className="font-headline font-bold text-base text-slate-900">
                {lang === "bn" ? "শান্ত ও নিরাপদ নির্দেশিকা" : "Calm, Safe Guidance"}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === "bn"
                  ? "ত্বকের সমস্যা নিয়ে দুশ্চিন্তা স্বাভাবিক। স্কিনওয়াইজ আপনাকে শান্তভাবে সম্ভাব্য লক্ষণ ও সঠিক পরিচর্যার পরামর্শ দেয়।"
                  : "Skin worries are common. We help you check visible patterns in private, avoid irritating mistakes, and know when to seek an in-person medical opinion."}
              </p>
              <div className="pt-2 border-t border-teal-100/80 flex items-center gap-2 text-xs font-semibold text-[#2b7f8f]">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>{lang === "bn" ? "সহজ ৩টি ধাপ • সময় লাগে ২ মিনিট" : "3 Quick Steps • Takes under 2 mins"}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          2. CLEAR "WHAT THIS TOOL CAN AND CANNOT DO" (Prominent & Honest)
          ========================================================================= */}
      <section id="can-and-cannot" className="px-4 sm:px-6 py-12 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {lang === "bn" ? "এই টুল যা করতে পারে এবং যা পারে না" : "What this tool can and cannot do"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto">
            {lang === "bn"
              ? "সততা ও স্বচ্ছতা আমাদের মূল নীতি। ব্যবহারের আগে এই বিষয়গুলো জেনে নেওয়া জরুরি।"
              : "We believe in honest, responsible guidance so you always know where you stand."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* What it CAN do */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-emerald-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-3 text-emerald-800">
              <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold">
                ✓
              </span>
              <h3 className="font-headline font-bold text-lg text-emerald-950">
                {t.whatAppCanDo}
              </h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold mt-0.5">•</span>
                <span>{t.canDo1}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold mt-0.5">•</span>
                <span>{t.canDo2}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold mt-0.5">•</span>
                <span>{t.canDo3}</span>
              </li>
            </ul>
          </div>

          {/* What it CANNOT do */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-rose-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-3 text-rose-800">
              <span className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center font-bold">
                ✕
              </span>
              <h3 className="font-headline font-bold text-lg text-rose-950">
                {t.whatAppCannotDo}
              </h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-rose-600 font-bold mt-0.5">•</span>
                <span>{t.cannotDo1}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-600 font-bold mt-0.5">•</span>
                <span>{t.cannotDo2}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-600 font-bold mt-0.5">•</span>
                <span>{t.cannotDo3}</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* =========================================================================
          3. HOW IT WORKS (3 Simple Steps)
          ========================================================================= */}
      <section className="px-4 sm:px-6 py-12 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2b7f8f]">
            {lang === "bn" ? "সহজ ৩ ধাপ" : "Simple Process"}
          </span>
          <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {lang === "bn" ? "কীভাবে শুরু করবেন" : "How it works"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#2b7f8f] font-bold flex items-center justify-center text-lg">
              1
            </div>
            <h3 className="font-headline font-bold text-base text-slate-900">
              {lang === "bn" ? "১. স্পষ্ট একটি ছবি তুলুন" : "1. Take a clear skin photo"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {lang === "bn"
                ? "প্রাকৃতিক আলোয় ৪-৬ ইঞ্চি দূর থেকে পরিষ্কার ছবি তুলুন। ফ্ল্যাশ বন্ধ রাখুন।"
                : "Hold your camera steady in good daylight, about 4–6 inches away. Keep the skin in sharp focus with flash turned off."}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#2b7f8f] font-bold flex items-center justify-center text-lg">
              2
            </div>
            <h3 className="font-headline font-bold text-base text-slate-900">
              {lang === "bn" ? "২. কয়েকটি প্রশ্নের উত্তর দিন" : "2. Answer simple questions"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {lang === "bn"
                ? "কতদিন ধরে সমস্যাটি হচ্ছে, চুলকানি বা ব্যথা কেমন, এবং কোনো লাল বা ফোলাভাব ছড়াচ্ছে কি না।"
                : "Tell us how long you've noticed it, whether it itches or hurts, and check for any emergency warning signs."}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#2b7f8f] font-bold flex items-center justify-center text-lg">
              3
            </div>
            <h3 className="font-headline font-bold text-base text-slate-900">
              {lang === "bn" ? "৩. পরামর্শ ও পরবর্তী করণীয় জানুন" : "3. Get practical next steps"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {lang === "bn"
                ? "সম্ভাব্য লক্ষণ, নিরাপদ সাধারণ পরিচর্যা ও কখন ডাক্তার দেখানো জরুরি তা পরিষ্কারভাবে জেনে নিন।"
                : "Review possible visible patterns in plain language, safe self-care habits, what to avoid, and when to see a doctor."}
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. COMMON VISIBLE SKIN CONCERNS (Educational & Reassuring)
          ========================================================================= */}
      <section id="skin-concerns" className="px-4 sm:px-6 py-12 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {lang === "bn" ? "সাধারণ কিছু ত্বকের সমস্যা" : "Common visible skin concerns"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto">
            {lang === "bn"
              ? "মানুষ প্রায়ই যে সাধারণ ত্বকের সমস্যাগুলোতে ভুগে থাকেন তার কিছু উদাহরণ নিচে দেওয়া হলো।"
              : "Learn about frequently observed skin patterns and gentle everyday hygiene tips."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {commonConcerns.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveConcern(item)}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-[#2b7f8f] hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#2b7f8f] bg-teal-50 px-2 py-0.5 rounded-full inline-block">
                  {item.simpleName}
                </span>
                <h3 className="font-headline font-bold text-base text-slate-900">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#2b7f8f]">
                <span>{lang === "bn" ? "যত্ন নেওয়ার নিয়ম জানুন" : "Read gentle self-care tip"}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for detail */}
        {activeConcern && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs text-[#2b7f8f] font-semibold">{activeConcern.simpleName}</span>
                  <h3 className="font-headline font-bold text-lg text-slate-900 mt-0.5">{activeConcern.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveConcern(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
                  aria-label="Close modal"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                    {lang === "bn" ? "বিবরণ" : "What it looks like"}
                  </h4>
                  <p>{activeConcern.description}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
                    {lang === "bn" ? "সাধারণ যত্ন" : "Gentle Self-Care Advice"}
                  </h4>
                  <p className="bg-teal-50/60 p-3 rounded-xl border border-teal-100 text-slate-800">
                    {activeConcern.careTip}
                  </p>
                </div>
                <p className="text-xs text-slate-500 pt-1">
                  {lang === "bn"
                    ? "সতর্কতা: এটি কোনো নিশ্চিত চিকিৎসা নয়। সমস্যা অব্যাহত থাকলে ডাক্তারের পরামর্শ নিন।"
                    : "Notice: General information only. If your skin is painful, spreading, or not improving, see a doctor."}
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveConcern(null)}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800"
                >
                  {lang === "bn" ? "বন্ধ করুন" : "Close"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          5. WHEN TO SEEK EMERGENCY CARE (Prominent, High-Contrast Safety)
          ========================================================================= */}
      <section className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5 text-rose-800">
            <span className="material-symbols-outlined text-2xl text-rose-600">emergency</span>
            <h2 className="font-headline font-bold text-lg text-rose-950">
              {lang === "bn" ? "কখন অবিলম্বে জরুরি হাসপাতালে যোগাযোগ করবেন" : "When to seek emergency care immediately"}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">
            {lang === "bn"
              ? "যদি আপনার শ্বাসকষ্ট হয়, মুখ বা গলা ফুলে যায়, জ্বরের সাথে খুব দ্রুত লালচে দাগ ছড়িয়ে পড়ে, বা ত্বক অস্বাভাবিকভাবে ফোস্কা পড়ে খসে যায় — তবে কোনো অ্যাপ ব্যবহার না করে অবিলম্বে জরুরি বিভাগে (৯৯৯ / ৯১১ / ১১২) যান।"
              : "If you have trouble breathing, swelling in your face or throat, a spreading rash with a fever, or sudden blistering/peeling skin — do not wait for an app or routine appointment. Call emergency services (911 / 112 / 999) or visit the nearest emergency department right away."}
          </p>
        </div>
      </section>

      {/* =========================================================================
          6. FINAL CALM CTA
          ========================================================================= */}
      <section className="px-4 sm:px-6 py-12 pb-20 max-w-5xl mx-auto text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-4 max-w-3xl mx-auto">
          <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900">
            {lang === "bn" ? "আপনার ত্বকের সমস্যা নিয়ে চিন্তিত?" : "Ready to check your skin concern?"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            {lang === "bn"
              ? "সহজ কয়েকটি ধাপে ছবি ও লক্ষণের ভিত্তিতে সম্ভাব্য সাধারণ কারণ ও যত্ন জেনে নিন।"
              : "Take or upload a clear photo now to receive gentle guidance and know whether to see a doctor."}
          </p>
          <div className="pt-2">
            <Link
              href="/assess"
              className="inline-flex items-center gap-2 bg-[#2b7f8f] hover:bg-[#236a77] text-white text-base font-bold px-8 py-3.5 rounded-full shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-teal-200"
            >
              <span className="material-symbols-outlined text-xl">photo_camera</span>
              <span>{t.checkSkinConcern}</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
