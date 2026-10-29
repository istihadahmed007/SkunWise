"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white max-w-lg w-full p-6 sm:p-8 rounded-3xl shadow-xl space-y-5 border border-rose-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-rose-600">
            <span className="material-symbols-outlined text-3xl">warning</span>
            <h3 className="font-extrabold text-xl text-rose-700">
              {t.emergencyTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Advisory */}
        <p className="text-sm text-slate-700 leading-relaxed">
          {t.emergencyDesc}
        </p>

        {/* Bullet checklist */}
        <ul className="space-y-2.5 text-sm text-slate-800 bg-rose-50/70 p-4 rounded-2xl border border-rose-200">
          {t.emergencyList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-base text-rose-600 mt-0.5 shrink-0">
                crisis_alert
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Emergency Call Numbers */}
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">
            Emergency Contacts by Region:
          </div>
          <div className="grid grid-cols-3 gap-2.5 text-center text-sm font-bold text-rose-700">
            <div className="bg-rose-50 py-2.5 rounded-xl border border-rose-200">
              {t.emergencyCallUS}
            </div>
            <div className="bg-rose-50 py-2.5 rounded-xl border border-rose-200">
              {t.emergencyCallEU}
            </div>
            <div className="bg-rose-50 py-2.5 rounded-xl border border-rose-200">
              {t.emergencyCallBD}
            </div>
          </div>
        </div>

        {/* Dismiss / Close button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            I Understand — Close Notice
          </button>
        </div>
      </div>
    </div>
  );
};
