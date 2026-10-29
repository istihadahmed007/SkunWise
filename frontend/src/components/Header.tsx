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

  // Navigation matching reference screenshot
  const navItems = [
    { label: "Home", href: "/" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Skin Conditions", href: "/#skin-conditions" },
    { label: "Safety", href: "/#safety" },
    { label: "About", href: "/#about" },
  ];

  return (
    <>
      {/* Top Clinical Safety Notice (Clean, Thin, Sticky) */}
      <div className="bg-[#def0f6] text-[#2c4756] px-4 py-1.5 text-center text-[11px] font-medium border-b border-[#cde5ee] relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm text-[#4da8b9]">health_and_safety</span>
          <span>
            <strong>Informational Guidance:</strong> SkinWise AI assists with symptom triage and does NOT replace in-person consultation with a medical doctor.
          </span>
          <button
            onClick={() => setShowEmergency(true)}
            className="ml-2 underline text-[#ba1a1a] hover:text-[#900] font-semibold cursor-pointer"
          >
            Emergency Signs
          </button>
        </div>
      </div>

      {/* Floating Translucent Glass Navigation Bar */}
      <header className="sticky top-3 z-40 px-3 sm:px-6">
        <div className="max-w-6xl mx-auto glass-pill rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all duration-300">
          
          {/* Left: Brand Logo matching template */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-[#4da8b9] text-white flex items-center justify-center shadow-[0_2px_10px_rgba(77,168,185,0.4)] group-hover:scale-105 transition-transform">
              {/* Minimal Skin-health icon */}
              <span className="material-symbols-outlined text-xl">dermatology</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-extrabold text-lg sm:text-xl text-[#1c2834] tracking-tight leading-none">
                SkinWise<span className="text-[#4da8b9]">.ai</span>
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#526373] font-semibold">
                Medical AI Triage
              </span>
            </div>
          </Link>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "text-[#4da8b9] bg-[#eef7fa]"
                      : "text-[#526373] hover:text-[#1c2834] hover:bg-white/60"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {user && (
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-[#4da8b9] hover:bg-[#eef7fa]"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right: Actions (Language, Auth, Analyze My Skin CTA) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Pill */}
            <div className="hidden sm:flex items-center bg-[#eef7fa] border border-[#d5ecf4] rounded-full p-0.5 text-[11px] font-semibold">
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  lang === "en" ? "bg-white text-[#4da8b9] shadow-xs" : "text-[#526373] hover:text-[#1c2834]"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("bn")}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  lang === "bn" ? "bg-white text-[#4da8b9] shadow-xs" : "text-[#526373] hover:text-[#1c2834]"
                }`}
              >
                বাং
              </button>
            </div>

            {/* Auth / Profile menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-white/70 hover:bg-white border border-[#cde5ee] transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-[#4da8b9] text-white font-bold text-[10px] flex items-center justify-center">
                    {user.full_name?.charAt(0).toUpperCase() || "P"}
                  </div>
                  <span className="hidden md:inline text-xs font-semibold text-[#1c2834]">
                    {user.full_name?.split(" ")[0]}
                  </span>
                  <span className="material-symbols-outlined text-sm text-[#526373]">expand_more</span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#cde5ee] py-2 text-xs z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold text-[#1c2834] truncate">{user.full_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[#eef7fa] text-[#1c2834]"
                    >
                      <span className="material-symbols-outlined text-sm text-[#4da8b9]">dashboard</span>
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/records"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[#eef7fa] text-[#1c2834]"
                    >
                      <span className="material-symbols-outlined text-sm text-[#4da8b9]">history</span>
                      <span>My Records</span>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[#eef7fa] text-[#1c2834]"
                    >
                      <span className="material-symbols-outlined text-sm text-[#526373]">settings</span>
                      <span>Settings & Privacy</span>
                    </Link>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-[#ba1a1a] hover:bg-rose-50 text-left"
                      >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                className="hidden sm:inline-flex text-xs font-semibold text-[#526373] hover:text-[#1c2834] px-2 py-1.5 transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Primary Action Button: "Analyze My Skin" matching template teal pill */}
            <Link
              href="/assess"
              className="bg-[#4da8b9] hover:bg-[#3a96a7] text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-[0_4px_14px_rgba(77,168,185,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">photo_camera</span>
              <span>Analyze My Skin</span>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-full bg-white/70 text-[#1c2834] hover:bg-white"
              aria-label="Toggle Navigation Menu"
            >
              <span className="material-symbols-outlined text-xl">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 max-w-6xl mx-auto bg-white/95 backdrop-blur-xl border border-white/80 rounded-3xl p-4 shadow-xl space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-[#1c2834] hover:bg-[#eef7fa]"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-[#4da8b9] hover:bg-[#eef7fa]"
                >
                  Patient Dashboard
                </Link>
                <Link
                  href="/records"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-[#1c2834] hover:bg-[#eef7fa]"
                >
                  My Records
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-[#1c2834] hover:bg-[#eef7fa]"
                >
                  Settings & Privacy
                </Link>
              </>
            ) : (
              <Link
                href="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-[#4da8b9] hover:bg-[#eef7fa]"
              >
                Sign In to Account
              </Link>
            )}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[#526373]">Language:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setLang("en")}
                  className={`px-3 py-1 rounded-full ${lang === "en" ? "bg-[#4da8b9] text-white" : "bg-slate-100"}`}
                >
                  English
                </button>
                <button
                  onClick={() => setLang("bn")}
                  className={`px-3 py-1 rounded-full ${lang === "bn" ? "bg-[#4da8b9] text-white" : "bg-slate-100"}`}
                >
                  বাংলা
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Emergency Warning Modal */}
      <EmergencyModal isOpen={showEmergency} onClose={() => setShowEmergency(false)} />
    </>
  );
};
