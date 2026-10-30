"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export const Footer: React.FC = () => {
  const { language } = useLanguage();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const legalContent: Record<string, { title: string; body: string }> = {
    privacy: {
      title: language === "bn" ? "গোপনীয়তা নীতি" : "Privacy & Data Protection",
      body:
        language === "bn"
          ? "স্কিনওয়াইজ আপনার গোপনীয়তাকে সর্বোচ্চ অগ্রাধিকার দেয়। জিরো-ক্লাউড মোডে আপনার আপলোড করা ছবি শুধুমাত্র তাৎক্ষণিক পর্যালোচনার জন্য প্রসেস করা হয় এবং সার্ভারে স্থায়ীভাবে সংরক্ষণ করা হয় না। আপনি যেকোনো সময় আপনার তথ্য দেখতে বা মুছে ফেলতে পারেন।"
          : "SkinWise is committed to your privacy. In Zero-Cloud mode, uploaded photos are processed in temporary memory and are not permanently saved on our servers. You have complete control to view, export, or remove your records at any time.",
    },
    terms: {
      title: language === "bn" ? "ব্যবহারের শর্তাবলী" : "Terms of Use",
      body:
        language === "bn"
          ? "স্কিনওয়াইজ ব্যবহার করে আপনি স্বীকার করছেন যে এটি শুধুমাত্র শিক্ষামূলক ও সহায়ক প্ল্যাটফর্ম। এটি কোনো নিবন্ধিত চিকিৎসক নয় এবং নিশ্চিত রোগ নির্ণয় বা ব্যবস্থাপত্র প্রদান করে না। যেকোনো অসুস্থতায় চিকিৎসকের পরামর্শ নেওয়া বাধ্যতামূলক।"
          : "By using SkinWise, you acknowledge that the application provides educational pattern-matching and conservative self-care suggestions only. It does not issue binding medical diagnoses or prescribe medications. Please consult a qualified doctor for persistent or worsening symptoms.",
    },
    disclaimer: {
      title: language === "bn" ? "চিকিৎসা সংক্রান্ত সতর্কতা" : "Medical Disclaimer",
      body:
        language === "bn"
          ? "স্কিনওয়াইজ কোনো রোগ নির্ণয় করে না এবং চিকিৎসকের বিকল্প নয়। কম্পিউটার ভিশন কেবল সাধারণ চর্মরোগের বাহ্যিক সাদৃশ্য তুলে ধরে। জরুরি বা বিপজ্জনক উপসর্গে অবিলম্বে হাসপাতালে যোগাযোগ করুন।"
          : "SkinWise is not a medical diagnostic tool and does not replace a doctor. Visual pattern similarities provide general guidance only. Emergency warning signs (such as breathing difficulty, facial swelling, or high fever) must always override app recommendations.",
    },
    contact: {
      title: language === "bn" ? "যোগাযোগ ও সহায়তা" : "Contact & Support",
      body:
        language === "bn"
          ? "যেকোনো মতামত বা সহায়তার জন্য যোগাযোগ করুন: support@skinwise.local অথবা আমাদের ডাক্তারদের রেফারেল পাতা দেখুন।"
          : "For technical assistance or questions about SkinWise, please reach out to us at support@skinwise.local or visit our doctor referral directory.",
    },
  };

  return (
    <>
      <footer className="w-full bg-[#def0f6] border-t border-[#cce4ee] text-[#1c2834] pt-12 pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Column 1: Brand & Charter */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#4da8b9] text-white flex items-center justify-center font-bold shadow-xs">
                  <span className="material-symbols-outlined text-lg">dermatology</span>
                </div>
                <span className="font-headline font-extrabold text-xl text-[#1c2834] tracking-tight">
                  SkinWise<span className="text-[#4da8b9]">.ai</span>
                </span>
              </div>
              <p className="text-xs text-[#526373] max-w-md leading-relaxed">
                {language === "bn"
                  ? "সহজ ও নিরাপদ ত্বক যাচাইকরণ, ছবির গুণমান যাচাই এবং রক্ষণশীল পরামর্শ। এটি কোনো রোগ নির্ণয় করে না; চিকিৎসকের সাথে আলোচনার সুবিধার্থে তৈরি।"
                  : "Simple, reassuring skin health identification, photo quality guidance, and gentle self-care habits. Built to inform personal care and facilitate conversations with your doctor."}
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#328493] pt-1">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>
                  {language === "bn"
                    ? "ব্যক্তিগত গোপনীয়তা সুরক্ষিত • জিরো-ক্লাউড ফটো সুরক্ষা"
                    : "Private & Secure • Zero-Cloud Photo Option • Conservative Self-Care"}
                </span>
              </div>
            </div>

            {/* Column 2: Essential Links */}
            <div className="space-y-2.5">
              <h4 className="font-headline text-xs uppercase tracking-wider font-bold text-[#1c2834]">
                {language === "bn" ? "প্রয়োজনীয় লিংক" : "Explore SkinWise"}
              </h4>
              <ul className="space-y-1.5 text-xs text-[#526373]">
                <li>
                  <Link href="/#about" className="hover:text-[#4da8b9] transition-colors">
                    {language === "bn" ? "স্কিনওয়াইজ সম্পর্কে" : "About SkinWise"}
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="hover:text-[#4da8b9] transition-colors">
                    {language === "bn" ? "ব্যবহারবিধি" : "How It Works"}
                  </Link>
                </li>
                <li>
                  <Link href="/#skin-conditions" className="hover:text-[#4da8b9] transition-colors">
                    {language === "bn" ? "সাধারণ উদ্বেগের তালিকা" : "Common Skin Concerns"}
                  </Link>
                </li>
                <li>
                  <Link href="/referral" className="hover:text-[#4da8b9] transition-colors">
                    {language === "bn" ? "ডাক্তার ও চর্মরোগ বিশেষজ্ঞ" : "Find a Dermatologist"}
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal("privacy")}
                    className="hover:text-[#4da8b9] transition-colors text-left cursor-pointer"
                  >
                    {language === "bn" ? "গোপনীয়তা নীতি" : "Privacy Policy"}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal("terms")}
                    className="hover:text-[#4da8b9] transition-colors text-left cursor-pointer"
                  >
                    {language === "bn" ? "শর্তাবলী" : "Terms of Use"}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal("disclaimer")}
                    className="hover:text-[#4da8b9] transition-colors text-left cursor-pointer"
                  >
                    {language === "bn" ? "চিকিৎসা সংক্রান্ত সতর্কতা" : "Medical Disclaimer"}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Emergency Dispatch Notice */}
            <div className="space-y-2.5">
              <h4 className="font-headline text-xs uppercase tracking-wider font-bold text-[#ba1a1a]">
                {language === "bn" ? "জরুরি চিকিৎসা সহায়তা" : "Emergency Care Numbers"}
              </h4>
              <p className="text-[11px] text-[#526373] leading-relaxed">
                {language === "bn"
                  ? "যদি আপনার শ্বাসকষ্ট, মুখমণ্ডল ফুলে যাওয়া বা তীব্র জ্বরের সাথে দ্রুত ফুসকুড়ি ছড়ায়, অবিলম্বে জরুরি সেবায় কল করুন:"
                  : "If you experience sudden breathing difficulty, facial swelling, or a rash spreading with fever, contact emergency services right away:"}
              </p>
              <div className="bg-white/80 border border-rose-200 p-3 rounded-2xl text-xs space-y-1 shadow-xs">
                <div className="flex justify-between">
                  <span className="text-[#526373]">United States:</span>
                  <strong className="text-[#ba1a1a] font-bold">Dial 911</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#526373]">European Union:</span>
                  <strong className="text-[#ba1a1a] font-bold">Dial 112</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#526373]">Bangladesh:</span>
                  <strong className="text-[#ba1a1a] font-bold">Dial 999</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Strip */}
          <div className="pt-6 border-t border-[#cce4ee] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#526373]">
            <p>© 2026 SkinWise AI. Built for educational guidance and informed care.</p>
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <button onClick={() => setActiveModal("privacy")} className="hover:text-[#4da8b9] cursor-pointer">
                Privacy
              </button>
              <span>•</span>
              <button onClick={() => setActiveModal("terms")} className="hover:text-[#4da8b9] cursor-pointer">
                Terms
              </button>
              <span>•</span>
              <button onClick={() => setActiveModal("disclaimer")} className="hover:text-[#4da8b9] cursor-pointer">
                Safety Disclaimer
              </button>
              <span>•</span>
              <button onClick={() => setActiveModal("contact")} className="hover:text-[#4da8b9] cursor-pointer">
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Information Modal */}
      {activeModal && legalContent[activeModal] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/80 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-headline text-base font-bold text-[#1c2834]">
                {legalContent[activeModal].title}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <p className="py-4 text-xs text-[#526373] leading-relaxed">
              {legalContent[activeModal].body}
            </p>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-[#4da8b9] text-white text-xs font-bold hover:bg-[#3a96a7] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
