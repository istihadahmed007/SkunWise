"use client";

import React, { useState } from "react";

export interface BodyRegion {
  id: string;
  nameEn: string;
  nameBn: string;
  view: "front" | "back" | "face";
  pinX: number; // percentage in SVG viewBox (0-200)
  pinY: number; // percentage in SVG viewBox (0-360)
  category: string;
}

const BODY_REGIONS: BodyRegion[] = [
  // Front View Regions
  { id: "head_front", nameEn: "Head", nameBn: "মাথা", view: "front", pinX: 100, pinY: 38, category: "Head" },
  { id: "face_front", nameEn: "Face", nameBn: "মুখমণ্ডল", view: "front", pinX: 100, pinY: 48, category: "Head" },
  { id: "neck_front", nameEn: "Neck", nameBn: "ঘাড় / গলা", view: "front", pinX: 100, pinY: 65, category: "Upper Body" },
  { id: "shoulders_front", nameEn: "Shoulders", nameBn: "কাঁধ", view: "front", pinX: 68, pinY: 82, category: "Upper Body" },
  { id: "chest_front", nameEn: "Chest", nameBn: "বুক", view: "front", pinX: 100, pinY: 102, category: "Torso" },
  { id: "arm_right_front", nameEn: "Right arm", nameBn: "ডান হাত", view: "front", pinX: 48, pinY: 125, category: "Arms" },
  { id: "arm_left_front", nameEn: "Left arm", nameBn: "বাম হাত", view: "front", pinX: 152, pinY: 125, category: "Arms" },
  { id: "hand_front", nameEn: "Hands", nameBn: "হাতের তালু / আঙুল", view: "front", pinX: 34, pinY: 195, category: "Arms" },
  { id: "belly_front", nameEn: "Belly", nameBn: "পেট / তলপেট", view: "front", pinX: 100, pinY: 135, category: "Torso" },
  { id: "groin_front", nameEn: "Genital area", nameBn: "কুঁচকি / প্রজনন অঙ্গ", view: "front", pinX: 100, pinY: 172, category: "Pelvis" },
  { id: "thigh_right_front", nameEn: "Right thigh", nameBn: "ডান উরু", view: "front", pinX: 84, pinY: 215, category: "Legs" },
  { id: "thigh_left_front", nameEn: "Left thigh", nameBn: "বাম উরু", view: "front", pinX: 116, pinY: 215, category: "Legs" },
  { id: "legs_lower_front", nameEn: "Lower legs", nameBn: "পায়ের নিচের অংশ", view: "front", pinX: 116, pinY: 280, category: "Legs" },
  { id: "feet_front", nameEn: "Feet", nameBn: "পা / পাতা", view: "front", pinX: 118, pinY: 338, category: "Legs" },

  // Back View Regions
  { id: "head_back", nameEn: "Scalp / Head", nameBn: "মাথার ত্বক / তালু", view: "back", pinX: 100, pinY: 38, category: "Head" },
  { id: "neck_back", nameEn: "Back of Neck", nameBn: "ঘাড়ের পেছনের অংশ", view: "back", pinX: 100, pinY: 65, category: "Upper Body" },
  { id: "shoulders_back", nameEn: "Shoulders", nameBn: "কাঁধ (পেছন)", view: "back", pinX: 132, pinY: 82, category: "Upper Body" },
  { id: "upper_back", nameEn: "Upper Back", nameBn: "পিঠের উপরের অংশ", view: "back", pinX: 100, pinY: 100, category: "Torso" },
  { id: "lower_back", nameEn: "Lower Back", nameBn: "কোমর / পিঠের নিচ", view: "back", pinX: 100, pinY: 138, category: "Torso" },
  { id: "arm_back", nameEn: "Back of Arms", nameBn: "হাতের পেছনের দিক", view: "back", pinX: 48, pinY: 125, category: "Arms" },
  { id: "buttocks", nameEn: "Buttocks", nameBn: "নিতম্ব", view: "back", pinX: 100, pinY: 172, category: "Pelvis" },
  { id: "thighs_back", nameEn: "Back of Thighs", nameBn: "উরুর পেছনের অংশ", view: "back", pinX: 116, pinY: 220, category: "Legs" },
  { id: "calves_back", nameEn: "Calves", nameBn: "পায়ের ডিম / কাফ", view: "back", pinX: 84, pinY: 280, category: "Legs" },
  { id: "heels_back", nameEn: "Heels & Soles", nameBn: "গোড়ালি ও পায়ের তল", view: "back", pinX: 82, pinY: 338, category: "Legs" },

  // Face Detail View Regions
  { id: "forehead", nameEn: "Forehead", nameBn: "কপাল", view: "face", pinX: 100, pinY: 60, category: "Face" },
  { id: "temples", nameEn: "Temples", nameBn: "রগ / কানের পাশ", view: "face", pinX: 65, pinY: 85, category: "Face" },
  { id: "nose", nameEn: "Nose", nameBn: "নাক", view: "face", pinX: 100, pinY: 108, category: "Face" },
  { id: "cheeks", nameEn: "Cheeks", nameBn: "গাল", view: "face", pinX: 138, pinY: 115, category: "Face" },
  { id: "mouth_lips", nameEn: "Mouth & Lips", nameBn: "মুখ ও ঠোঁট", view: "face", pinX: 100, pinY: 135, category: "Face" },
  { id: "chin_jaw", nameEn: "Chin & Jawline", nameBn: "চিবুক ও চোয়াল", view: "face", pinX: 100, pinY: 155, category: "Face" },
  { id: "neck_face_view", nameEn: "Front Neck", nameBn: "গলার সামনের অংশ", view: "face", pinX: 100, pinY: 185, category: "Face" },
];

interface BodyMapSelectorProps {
  selectedLocation: string;
  onSelectLocation: (location: string) => void;
  language?: string;
}

export const BodyMapSelector: React.FC<BodyMapSelectorProps> = ({
  selectedLocation,
  onSelectLocation,
  language = "en",
}) => {
  const [activeView, setActiveView] = useState<"front" | "back" | "face">("front");

  // Determine current active region matching the selectedLocation
  const currentRegions = BODY_REGIONS.filter((r) => r.view === activeView);
  const activeRegion = currentRegions.find(
    (r) =>
      r.nameEn.toLowerCase() === selectedLocation.toLowerCase() ||
      r.nameBn === selectedLocation ||
      selectedLocation.toLowerCase().includes(r.nameEn.toLowerCase().split(" ")[0])
  ) || currentRegions[0];

  const handleSelect = (region: BodyRegion) => {
    // Return standard English name with fallback
    onSelectLocation(region.nameEn);
  };

  return (
    <div className="w-full bg-[#f8fbfe] rounded-3xl p-4 sm:p-6 border border-[#dcecf3] shadow-xs">
      {/* Title & View Switcher Tabs matching reference design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="font-headline font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2b7f8f] text-xl">accessibility_new</span>
            <span>
              {language === "bn"
                ? "শরীরের কোন স্থানে সমস্যাটি দেখা দিয়েছে?"
                : "Where is the skin condition located?"}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === "bn"
              ? "শরীরের চিত্রে ক্লিক করুন অথবা পাশের তালিকা থেকে স্থান বেছে নিন"
              : "Tap on the anatomical figure or select a zone from the list"}
          </p>
        </div>

        {/* View Switcher: Front / Back / Face */}
        <div className="inline-flex p-1 bg-white rounded-2xl border border-slate-200 shadow-2xs self-start sm:self-auto">
          {(["front", "back", "face"] as const).map((view) => {
            const isActive = activeView === view;
            const label =
              view === "front"
                ? language === "bn" ? "সামনে (Front)" : "Front"
                : view === "back"
                ? language === "bn" ? "পেছনে (Back)" : "Back"
                : language === "bn" ? "মুখ (Face)" : "Face";

            return (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-headline transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#2b7f8f] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Anatomy Body Diagram + Region Pills */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: SVG Silhouette Diagram with Pin Points & Indicator Line */}
        <div className="md:col-span-6 flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 shadow-inner relative min-h-[380px]">
          <div className="relative w-[220px] h-[360px] flex items-center justify-center">
            {/* SVG Anatomical Silhouette */}
            {activeView === "front" && (
              <svg viewBox="0 0 200 360" className="w-full h-full text-slate-300 stroke-slate-400">
                {/* Head */}
                <ellipse cx="100" cy="38" rx="16" ry="22" fill="#f0f6f9" strokeWidth="2.2" strokeLinecap="round" />
                {/* Neck */}
                <path d="M94 58 L94 68 L106 68 L106 58" fill="#f0f6f9" strokeWidth="2.2" />
                {/* Shoulders & Torso */}
                <path
                  d="M60 82 C70 72 90 68 100 68 C110 68 130 72 140 82 L150 115 L144 140 L136 172 L64 172 L56 140 L50 115 Z"
                  fill="#f0f6f9"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                {/* Chest & Abdomen contour lines */}
                <path d="M78 106 C90 112 110 112 122 106" fill="none" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M82 140 C92 144 108 144 118 140" fill="none" strokeWidth="1.5" strokeDasharray="3 3" />
                {/* Arms */}
                <path d="M56 84 L40 130 L32 185 L42 195 L50 145 L60 98" fill="#f0f6f9" strokeWidth="2.2" strokeLinejoin="round" />
                <path d="M144 84 L160 130 L168 185 L158 195 L150 145 L140 98" fill="#f0f6f9" strokeWidth="2.2" strokeLinejoin="round" />
                {/* Pelvis & Legs */}
                <path
                  d="M66 172 L72 230 L74 290 L70 338 L88 338 L92 290 L96 230 L100 190 L104 230 L108 290 L112 338 L130 338 L126 290 L128 230 L134 172 Z"
                  fill="#f0f6f9"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
              </svg>
            )}

            {activeView === "back" && (
              <svg viewBox="0 0 200 360" className="w-full h-full text-slate-300 stroke-slate-400">
                {/* Head (Back) */}
                <ellipse cx="100" cy="38" rx="16" ry="22" fill="#f0f6f9" strokeWidth="2.2" strokeLinecap="round" />
                {/* Neck */}
                <path d="M94 58 L94 68 L106 68 L106 58" fill="#f0f6f9" strokeWidth="2.2" />
                {/* Back Torso */}
                <path
                  d="M60 82 C70 72 90 68 100 68 C110 68 130 72 140 82 L150 115 L144 140 L136 172 L64 172 L56 140 L50 115 Z"
                  fill="#f0f6f9"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                {/* Spine indicator */}
                <path d="M100 70 L100 165" fill="none" strokeWidth="1.5" strokeDasharray="3 3" />
                {/* Arms (Back) */}
                <path d="M56 84 L40 130 L32 185 L42 195 L50 145 L60 98" fill="#f0f6f9" strokeWidth="2.2" strokeLinejoin="round" />
                <path d="M144 84 L160 130 L168 185 L158 195 L150 145 L140 98" fill="#f0f6f9" strokeWidth="2.2" strokeLinejoin="round" />
                {/* Buttocks & Back Legs */}
                <path
                  d="M66 172 L72 230 L74 290 L70 338 L88 338 L92 290 L96 230 C98 200 100 185 100 185 C100 185 102 200 104 230 L108 290 L112 338 L130 338 L126 290 L128 230 L134 172 Z"
                  fill="#f0f6f9"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                <path d="M82 178 C92 184 108 184 118 178" fill="none" strokeWidth="1.5" />
              </svg>
            )}

            {activeView === "face" && (
              <svg viewBox="0 0 200 240" className="w-full h-full text-slate-300 stroke-slate-400">
                {/* Face Contour */}
                <path
                  d="M50 80 C50 35 150 35 150 80 C150 125 125 168 100 168 C75 168 50 125 50 80 Z"
                  fill="#f0f6f9"
                  strokeWidth="2.5"
                />
                {/* Ears */}
                <ellipse cx="46" cy="88" rx="5" ry="14" fill="#f0f6f9" strokeWidth="2" />
                <ellipse cx="154" cy="88" rx="5" ry="14" fill="#f0f6f9" strokeWidth="2" />
                {/* Forehead line */}
                <path d="M68 62 C85 58 115 58 132 62" fill="none" strokeWidth="1.8" strokeLinecap="round" />
                {/* Eyes */}
                <path d="M72 84 Q82 80 92 84" fill="none" strokeWidth="2" strokeLinecap="round" />
                <path d="M108 84 Q118 80 128 84" fill="none" strokeWidth="2" strokeLinecap="round" />
                {/* Nose bridge */}
                <path d="M100 85 L96 108 L104 108" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* Lips */}
                <path d="M88 132 Q100 136 112 132" fill="none" strokeWidth="2" strokeLinecap="round" />
                {/* Chin */}
                <path d="M92 154 Q100 157 108 154" fill="none" strokeWidth="1.8" strokeLinecap="round" />
                {/* Neck */}
                <path d="M80 165 L76 210 M120 165 L124 210" fill="none" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            )}

            {/* Hotspot Pins for current view */}
            {currentRegions.map((region) => {
              const isSelected = activeRegion?.id === region.id;
              // Adjust Y percentage for face view if needed
              const topPos = activeView === "face" ? `${(region.pinY / 240) * 100}%` : `${(region.pinY / 360) * 100}%`;
              const leftPos = `${(region.pinX / 200) * 100}%`;

              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => handleSelect(region)}
                  style={{ top: topPos, left: leftPos }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all focus:outline-none cursor-pointer group ${
                    isSelected ? "z-20 scale-125" : "z-10 hover:scale-115"
                  }`}
                  title={region.nameEn}
                  aria-label={region.nameEn}
                >
                  <span
                    className={`block rounded-full transition-all ${
                      isSelected
                        ? "w-4 h-4 bg-[#f43f5e] ring-4 ring-rose-200 shadow-md animate-pulse"
                        : "w-3 h-3 bg-[#38bdf8] hover:bg-[#0284c7] ring-2 ring-white/90 shadow-2xs"
                    }`}
                  />
                </button>
              );
            })}

            {/* Connecting Pointer Line matching screenshot */}
            {activeRegion && (
              <div
                style={{
                  top: activeView === "face" ? `${(activeRegion.pinY / 240) * 100}%` : `${(activeRegion.pinY / 360) * 100}%`,
                  left: `${(activeRegion.pinX / 200) * 100}%`,
                }}
                className="absolute pointer-events-none z-10 hidden sm:block"
              >
                <div className="w-16 h-[2px] bg-gradient-to-r from-[#f43f5e] to-rose-400 -translate-y-1/2 ml-2" />
              </div>
            )}
          </div>

          <div className="mt-2 text-center">
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
              {language === "bn" ? "বর্তমান ভিউ: " : "View: "}
              <strong className="text-slate-800 capitalize">{activeView}</strong>
            </span>
          </div>
        </div>

        {/* Right: Interactive Region Badges / Grid matching mobile layout */}
        <div className="md:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {language === "bn" ? "স্থানসমূহ নির্বাচন করুন" : "Select Region"}
            </h4>
            <span className="text-xs font-semibold text-[#2b7f8f]">
              {language === "bn" ? "নির্বাচিত: " : "Selected: "}
              <span className="font-bold underline">{activeRegion ? (language === "bn" ? activeRegion.nameBn : activeRegion.nameEn) : selectedLocation}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
            {currentRegions.map((region) => {
              const isSelected = activeRegion?.id === region.id;

              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => handleSelect(region)}
                  className={`flex items-center justify-between p-3 rounded-2xl text-xs font-headline font-bold transition-all text-left cursor-pointer border ${
                    isSelected
                      ? "bg-[#f43f5e] border-[#f43f5e] text-white shadow-sm ring-2 ring-rose-200"
                      : "bg-white hover:bg-[#eaf4f8] border-slate-200 text-slate-800 hover:border-[#2b7f8f]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isSelected ? "bg-white" : "bg-[#2b7f8f]"
                      }`}
                    />
                    <span>{language === "bn" ? region.nameBn : region.nameEn}</span>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick selection pill for Other / Unsure */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => onSelectLocation("Other area / Generalized")}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                selectedLocation.toLowerCase().includes("other")
                  ? "bg-[#2b7f8f] text-white border-[#2b7f8f]"
                  : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className="material-symbols-outlined text-base">help_outline</span>
              <span>
                {language === "bn"
                  ? "অন্য কোনো স্থান অথবা পুরো শরীরে ছড়ানো"
                  : "Other area or spread across multiple parts"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

