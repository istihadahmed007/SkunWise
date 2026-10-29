"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const legalContent: Record<string, { title: string; body: string }> = {
    privacy: {
      title: "Privacy Policy & Zero-Cloud Retention",
      body: "SkinWise AI is built with privacy-by-design principles adhering to HIPAA Security Rules and GDPR standards. In Zero-Cloud mode, uploaded dermoscopic imagery is processed entirely in ephemeral memory and scrubbed immediately post-inference. Patients retain unconditional rights to view, export, and permanently delete their data at any time.",
    },
    terms: {
      title: "Terms of Use",
      body: "By accessing SkinWise AI, you acknowledge that the platform provides algorithmic symptom triage and informational guidance only. The service is not a licensed medical practitioner and does not issue binding diagnoses or prescriptions. Users must seek professional medical advice for any urgent or deteriorating symptoms.",
    },
    disclaimer: {
      title: "Medical & Regulatory Disclaimer",
      body: "SkinWise AI operates as a non-diagnostic SaMD CE Class I clinical decision support aid. Computer vision probabilities reflect statistical visual feature overlap with accredited dermatology datasets and must never be treated as confirmed clinical diagnoses. Emergency danger signs strictly take precedence over algorithmic recommendations.",
    },
    contact: {
      title: "Contact & Clinical Feedback",
      body: "For technical assistance, institutional integrations, or clinical audit feedback, please contact the SkinWise Medical Informatics Team at clinical-support@skinwise.ai or through our verified physician network portal.",
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
                Modern AI-assisted skin health identification, optical quality gating, and structured triage guidance. Aligned with CE Class I decision-support standards for patient insights and lesion tracking.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#328493] pt-1">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <span>HIPAA Aligned • Zero-Cloud Image Retention • AAD / DermNet Sourced</span>
              </div>
            </div>

            {/* Column 2: Requested Essential Links */}
            <div className="space-y-2.5">
              <h4 className="font-headline text-xs uppercase tracking-wider font-bold text-[#1c2834]">
                Explore & Clinical Trust
              </h4>
              <ul className="space-y-1.5 text-xs text-[#526373]">
                <li>
                  <Link href="/#about" className="hover:text-[#4da8b9] transition-colors">
                    About SkinWise
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="hover:text-[#4da8b9] transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/#skin-conditions" className="hover:text-[#4da8b9] transition-colors">
                    Common Skin Concerns
                  </Link>
                </li>
                <li>
                  <Link href="/referral" className="hover:text-[#4da8b9] transition-colors">
                    Doctor Referral & Telehealth
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal("privacy")}
                    className="hover:text-[#4da8b9] transition-colors text-left cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal("terms")}
                    className="hover:text-[#4da8b9] transition-colors text-left cursor-pointer"
                  >
                    Terms of Use
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal("disclaimer")}
                    className="hover:text-[#4da8b9] transition-colors text-left cursor-pointer"
                  >
                    Medical Disclaimer
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal("contact")}
                    className="hover:text-[#4da8b9] transition-colors text-left cursor-pointer"
                  >
                    Contact Clinical Support
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Emergency Dispatch Notice */}
            <div className="space-y-2.5">
              <h4 className="font-headline text-xs uppercase tracking-wider font-bold text-[#ba1a1a]">
                Emergency Care Notice
              </h4>
              <p className="text-[11px] text-[#526373] leading-relaxed">
                If you experience rapid facial or throat swelling, severe blistering, or a spreading rash accompanied by high fever, immediately contact emergency services:
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
            <p>© 2026 SkinWise AI Platform. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <button onClick={() => setActiveModal("privacy")} className="hover:text-[#4da8b9]">Privacy</button>
              <span>•</span>
              <button onClick={() => setActiveModal("terms")} className="hover:text-[#4da8b9]">Terms</button>
              <span>•</span>
              <button onClick={() => setActiveModal("disclaimer")} className="hover:text-[#4da8b9]">Medical Safety</button>
              <span>•</span>
              <button onClick={() => setActiveModal("contact")} className="hover:text-[#4da8b9]">Contact</button>
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
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
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
                className="px-5 py-2 rounded-xl bg-[#4da8b9] text-white text-xs font-bold hover:bg-[#3a96a7]"
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
