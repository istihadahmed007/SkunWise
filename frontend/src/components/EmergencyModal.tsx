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
    <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-gutter animate-fade-in">
      <div className="bg-surface-container-lowest max-w-lg w-full p-space-lg rounded-2xl shadow-2xl space-y-space-md border border-error-container">
        {/* Header */}
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-high">
          <div className="flex items-center gap-space-sm text-error">
            <span className="material-symbols-outlined text-3xl">warning</span>
            <h3 className="font-headline font-semibold text-headline-sm text-error">
              {t.emergencyTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Advisory */}
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          {t.emergencyDesc}
        </p>

        {/* Bullet checklist */}
        <ul className="space-y-space-xs text-body-sm text-on-surface bg-error-container/20 p-space-md rounded-xl border border-error/20">
          {t.emergencyList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-error mt-0.5 shrink-0">
                crisis_alert
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Emergency Call Numbers */}
        <div className="space-y-space-xs">
          <div className="font-headline text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
            Emergency Dispatch Contacts:
          </div>
          <div className="grid grid-cols-3 gap-space-xs text-center text-label-md font-semibold text-error">
            <div className="bg-error-container/40 py-2 rounded-lg border border-error/20">
              {t.emergencyCallUS}
            </div>
            <div className="bg-error-container/40 py-2 rounded-lg border border-error/20">
              {t.emergencyCallEU}
            </div>
            <div className="bg-error-container/40 py-2 rounded-lg border border-error/20">
              {t.emergencyCallBD}
            </div>
          </div>
        </div>

        {/* Dismiss / Close button */}
        <div className="pt-space-xs flex justify-end">
          <button
            onClick={onClose}
            className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-space-lg py-2.5 rounded-xl font-headline text-label-md transition-colors"
          >
            I Understand — Close Notice
          </button>
        </div>
      </div>
    </div>
  );
};

