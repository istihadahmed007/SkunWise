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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Reassuring Safety Notice */}
      <aside
        aria-label="Important medical notice"
        className="bg-amber-50 text-amber-950 px-4 py-2 text-center text-xs border-b border-amber-200/80"
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span className="font-semibold">{t.medicalNotice}</span>
          <button
            type="button"
            onClick={() => setShowEmergency(true)}
            className="text-rose-700 hover:text-rose-900 underline font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 rounded px-1"
          >
            {t.emergencyBtn}
          </button>
        </div>
      </aside>

      {/* Main Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[#4da8b9] rounded-lg p-1"
          >
            <div className="w-8 h-8 rounded-full bg-[#4da8b9] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-lg" aria-hidden="true">dermatology</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-lg text-slate-900 leading-none">
                SkinWise
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Skin Health Helper</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2" aria-label="Main Navigation">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                pathname === "/" ? "text-[#2b7f8f] bg-teal-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {t.navOverview}
            </Link>

            <Link
              href="/#can-and-cannot"
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              What it does & doesn't do
            </Link>

            <Link
              href="/#skin-concerns"
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              Common concerns
            </Link>

            {user && (
              <Link
                href="/records"
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  pathname === "/records" ? "text-[#2b7f8f] bg-teal-50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {t.navMyRecords}
              </Link>
            )}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <div
              className="flex items-center bg-slate-100 rounded-full p-0.5 text-xs font-semibold border border-slate-200"
              role="group"
              aria-label="Language selection"
            >
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  lang === "en" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
                aria-pressed={lang === "en"}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("bn")}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  lang === "bn" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
                aria-pressed={lang === "bn"}
              >
                বাং
              </button>
            </div>

            {/* User Account / Sign In */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4da8b9]"
                  aria-expanded={showProfileMenu}
                  aria-haspopup="true"
                >
                  <div className="w-6 h-6 rounded-full bg-[#4da8b9] text-white font-bold text-[11px] flex items-center justify-center">
                    {user.full_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="hidden sm:inline font-medium">{user.full_name?.split(" ")[0]}</span>
                  <span className="material-symbols-outlined text-sm text-slate-500">expand_more</span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 text-xs z-50 animate-in fade-in">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">{user.full_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/records"
                      onClick={() => setShowProfileMenu(false)}
                      className="block px-3 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      {t.navMyRecords}
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="block px-3 py-2 text-slate-700 hover:bg-slate-50"
                    >
                      {t.navSettingsPrivacy}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 border-t border-slate-100"
                    >
                      {t.signOut}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                className="hidden sm:inline-flex text-xs font-semibold text-slate-700 hover:text-slate-900 px-2 py-1.5"
              >
                {t.signIn}
              </Link>
            )}

            {/* Primary Action Button: "Check a skin concern" */}
            <Link
              href="/assess"
              className="bg-[#2b7f8f] hover:bg-[#236a77] text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-xs transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2b7f8f]"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">photo_camera</span>
              <span>{t.checkSkinConcern}</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#4da8b9]"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="material-symbols-outlined text-xl">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 text-sm font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-800 hover:text-[#2b7f8f]"
            >
              {t.navOverview}
            </Link>
            <Link
              href="/#can-and-cannot"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-800 hover:text-[#2b7f8f]"
            >
              What it does & doesn't do
            </Link>
            <Link
              href="/#skin-concerns"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-800 hover:text-[#2b7f8f]"
            >
              Common concerns
            </Link>
            <Link
              href="/referral"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-800 hover:text-[#2b7f8f]"
            >
              {t.findDoctor}
            </Link>
            {user ? (
              <>
                <Link
                  href="/records"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-slate-800 hover:text-[#2b7f8f]"
                >
                  {t.navMyRecords}
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-slate-800 hover:text-[#2b7f8f]"
                >
                  {t.navSettingsPrivacy}
                </Link>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-slate-800 hover:text-[#2b7f8f]"
              >
                {t.signIn}
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Urgent Warning Modal */}
      <EmergencyModal isOpen={showEmergency} onClose={() => setShowEmergency(false)} />
    </>
  );
};
