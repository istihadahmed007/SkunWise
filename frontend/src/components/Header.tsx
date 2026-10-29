"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { EmergencyModal } from "./EmergencyModal";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [showEmergency, setShowEmergency] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navLinks = [
    { label: t.navOverview, href: "/" },
    { label: t.navNewAssessment, href: "/assess" },
    { label: t.navMyRecords, href: "/records" },
    { label: t.navDoctorReferral, href: "/referral" },
    { label: t.navSettingsPrivacy, href: "/settings" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/60">
        {/* Top Clinical Disclaimer Bar */}
        <div className="bg-surface-container-high px-gutter-sm py-1.5 text-center border-b border-surface-container-highest/40">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-base">info</span>
            <p className="text-xs text-on-surface-variant font-medium">
              <strong className="text-on-surface font-semibold">Medical Notice:</strong>{" "}
              {t.medicalNotice}
            </p>
          </div>
        </div>

        {/* Main Nav Bar */}
        <div className="h-18 max-w-7xl mx-auto px-gutter flex items-center justify-between">
          {/* Left: Brand & Nav */}
          <div className="flex items-center gap-space-lg">
            <Link href="/" className="flex items-center gap-space-xs group">
              <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl text-on-primary">biotech</span>
              </div>
              <span className="font-headline font-bold text-xl text-primary tracking-tight">
                SkinWise<span className="text-secondary font-medium">.ai</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden xl:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-2 rounded-lg font-headline text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-primary text-on-primary shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-space-sm sm:gap-space-md">
            {/* Emergency Warning Trigger */}
            <button
              onClick={() => setShowEmergency(true)}
              className="flex items-center gap-1.5 bg-error-container text-on-error-container hover:bg-error hover:text-on-error px-3 py-1.5 rounded-full transition-colors font-headline text-xs font-bold uppercase tracking-wider shadow-xs"
              type="button"
            >
              <span className="material-symbols-outlined text-base">warning</span>
              <span className="hidden sm:inline">{t.emergencyBtn}</span>
            </button>

            {/* HIPAA / 256-bit compliance chip */}
            <div className="hidden lg:flex items-center gap-1 bg-surface-container-low px-3 py-1 rounded-full text-on-surface-variant text-xs font-medium">
              <span className="material-symbols-outlined text-tertiary text-base">verified_user</span>
              <span className="font-semibold text-on-surface">HIPAA</span>
              <span>256-bit</span>
            </div>

            {/* English / Bengali Selector */}
            <div className="flex items-center bg-surface-container-low rounded-lg p-1 font-headline text-xs">
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-1 rounded font-semibold transition-all ${
                  lang === "en"
                    ? "bg-surface-container-lowest text-primary shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("bn")}
                className={`px-2 py-1 rounded font-semibold transition-all ${
                  lang === "bn"
                    ? "bg-surface-container-lowest text-primary shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                বাংলা
              </button>
            </div>

            {/* User Profile / Auth State */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 pl-1 group"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-headline font-bold text-xs ring-2 ring-primary/20 group-hover:ring-primary transition-all">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline font-headline text-xs font-semibold text-on-surface">
                    {user.full_name.split(" ")[0]}
                  </span>
                  <span className="material-symbols-outlined text-base text-on-surface-variant">
                    arrow_drop_down
                  </span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container-high py-2 text-xs z-50">
                    <div className="px-4 py-2 border-b border-surface-container-high">
                      <p className="font-headline font-semibold text-on-surface truncate">
                        {user.full_name}
                      </p>
                      <p className="text-on-surface-variant truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-primary">dashboard</span>
                      Dashboard
                    </Link>
                    <Link
                      href="/records"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-secondary">history</span>
                      My Records
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-outline">settings</span>
                      Privacy & Settings
                    </Link>
                    <div className="border-t border-surface-container-high mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-error hover:bg-error-container/30 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-base">logout</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                className="bg-primary text-on-primary hover:bg-secondary transition-all px-3.5 py-1.5 rounded-lg font-headline text-xs font-semibold shadow-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">account_circle</span>
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Emergency Drawer / Modal */}
      <EmergencyModal isOpen={showEmergency} onClose={() => setShowEmergency(false)} />
    </>
  );
};

