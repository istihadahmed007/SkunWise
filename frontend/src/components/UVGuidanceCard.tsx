"use client";

import React, { useState } from "react";
import { api, UVGuidanceResponse } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

export const UVGuidanceCard: React.FC = () => {
  const { t, language } = useLanguage();
  const [uvData, setUvData] = useState<UVGuidanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchUV = async (lat: number, lon: number) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getUVForecast(lat, lon);
      setUvData(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to fetch UV guidance.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      // Fallback to Dhaka / standard coordinates
      fetchUV(23.81, 90.41);
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchUV(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn("Geolocation denied or unavailable, using regional coordinates", err);
        // Fallback default coordinates
        fetchUV(23.81, 90.41);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-[#d1e5ec] p-6 sm:p-8 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2b7f8f] bg-[#eaf4f8] px-3 py-1 rounded-full">
            <span className="material-symbols-outlined text-sm">wb_sunny</span>
            <span>{t.uvGuidanceTitle}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            {language === "bn" ? "স্থানীয় রোদ ও অতিবেগুনী (UV) সুরক্ষা" : "Local UV Index & Sun Protection"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            {t.uvGuidanceDesc}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#eaf4f8] hover:bg-[#d9ecf3] text-[#2b7f8f] text-xs sm:text-sm font-bold transition-colors disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">my_location</span>
          <span>{isLoading ? "Fetching..." : t.detectLocationBtn}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base">info</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {uvData ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#f0f8fb] p-4 rounded-2xl border border-[#d1e5ec]">
              <span className="text-xs text-slate-500 font-medium">Current UV Index</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {uvData.current_uv_index}
              </div>
              <span className="text-xs font-bold text-[#2b7f8f] inline-block mt-0.5">
                {uvData.risk_tier}
              </span>
            </div>

            <div className="bg-[#f0f8fb] p-4 rounded-2xl border border-[#d1e5ec]">
              <span className="text-xs text-slate-500 font-medium">Today&apos;s Peak UV</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {uvData.max_uv_today}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Midday maximum
              </span>
            </div>

            <div className="bg-[#f0f8fb] p-4 rounded-2xl border border-[#d1e5ec]">
              <span className="text-xs text-slate-500 font-medium">Recommended Photoprotection</span>
              <div className="text-lg font-extrabold text-[#2b7f8f] mt-1">
                {uvData.recommended_spf}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Broad-Spectrum UVA/UVB
              </span>
            </div>
          </div>

          <div className="bg-[#f0f8fb] p-4 sm:p-5 rounded-2xl border border-[#d1e5ec] space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {language === "bn" ? "প্রমাণ-ভিত্তিক রোদ সুরক্ষা নির্দেশিকা" : "Evidence-Based Photoprotection Habits"}
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
              {uvData.photoprotection_guidance.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-[#2b7f8f] mt-0.5 shrink-0">
                    check_circle
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
            <span>{uvData.attribution}</span>
            <span className="italic">{uvData.licensing_notice}</span>
          </div>
        </div>
      ) : (
        <div className="py-6 px-4 bg-[#f0f8fb] rounded-2xl border border-dashed border-[#d1e5ec] text-center space-y-2">
          <span className="material-symbols-outlined text-3xl text-[#2b7f8f]">light_mode</span>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            {language === "bn"
              ? "আপনার এলাকার বর্তমান UV রশ্মির মাত্রা ও সানস্ক্রিন পরামর্শ দেখতে উপরে ক্লিক করুন।"
              : "Check your local UV index to view evidence-based sun habits and recommended SPF rating."}
          </p>
        </div>
      )}
    </div>
  );
};

