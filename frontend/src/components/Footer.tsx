"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-surface-container-lowest mt-space-xl border-t border-surface-container-high/60 shadow-[0_-1px_8px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-gutter py-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-space-lg">
          {/* Column 1: Brand & Charter */}
          <div className="md:col-span-2 space-y-space-sm">
            <div className="flex items-center gap-space-xs">
              <div className="w-7 h-7 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-lg">biotech</span>
              </div>
              <span className="font-headline font-bold text-lg text-primary tracking-tight">
                SkinWise AI
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant max-w-lg leading-relaxed">
              Clinical-grade triage and visual dermatology decision support powered by probabilistic computer vision algorithms. Designed for pre-consultation patient insights and longitudinal lesion tracking.
            </p>
            <div className="flex items-center gap-space-xs text-tertiary font-headline text-xs font-semibold pt-space-xs">
              <span className="material-symbols-outlined text-base">clinical_notes</span>
              <span>Validated by Dermatology Clinical Review Board • Protocol CE-2024</span>
            </div>
          </div>

          {/* Column 2: Safety & Compliance */}
          <div className="space-y-space-xs">
            <h4 className="font-headline text-xs uppercase tracking-wider font-bold text-on-surface">
              Clinical Safety & Trust
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant">
              <li>
                <Link href="/referral" className="hover:text-primary transition-colors">
                  Board Review Committee
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  SaMD CE Class I Architecture
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-primary transition-colors">
                  HIPAA & GDPR Safeguards
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-primary transition-colors">
                  Zero-Cloud Image Retention Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Emergency Dispatch Numbers */}
          <div className="space-y-space-xs">
            <h4 className="font-headline text-xs uppercase tracking-wider font-bold text-on-surface">
              Emergency Care Notice
            </h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              If you experience rapid swelling, severe blistering, spreading rash with fever, or shortness of breath, immediately contact local emergency services:
            </p>
            <div className="bg-error-container/30 border border-error/20 p-space-sm rounded-xl text-xs text-on-error-container font-medium space-y-1 mt-2">
              <div className="flex justify-between">
                <span>United States:</span>
                <strong className="text-error font-bold">911</strong>
              </div>
              <div className="flex justify-between">
                <span>European Union:</span>
                <strong className="text-error font-bold">112</strong>
              </div>
              <div className="flex justify-between">
                <span>Bangladesh:</span>
                <strong className="text-error font-bold">999</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-space-md border-t border-surface-container-high/60 flex flex-col sm:flex-row items-center justify-between gap-space-sm text-xs text-on-surface-variant">
          <p>© 2026 SkinWise Health Technologies, Inc. All rights reserved.</p>
          <div className="flex items-center gap-space-md">
            <span className="hover:text-primary transition-colors cursor-pointer">
              Terms of Clinical Use
            </span>
            <span>•</span>
            <span className="hover:text-primary transition-colors cursor-pointer">
              Patient Rights
            </span>
            <span>•</span>
            <span className="hover:text-primary transition-colors cursor-pointer">
              SaMD Compliance Whitepaper
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

