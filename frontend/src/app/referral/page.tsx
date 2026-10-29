"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api, AssessmentSummary } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface Doctor {
  id: string;
  name: string;
  credentials: string;
  specialty: string;
  clinic: string;
  location: string;
  modality: "telehealth" | "clinic" | "both";
  rating: number;
  reviewCount: number;
  nextAvailable: string;
  consultationFee: string;
  acceptsInsurance: boolean;
  avatarUrl: string;
  languages: string[];
}

const DOCTORS_DATA: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Elena Rostova",
    credentials: "MD, FAAD",
    specialty: "Pigmented Lesions & Dermato-Oncology",
    clinic: "Metropolitan Dermatology & Laser Center",
    location: "Downtown Medical Plaza, Suite 400 (or Virtual)",
    modality: "both",
    rating: 4.9,
    reviewCount: 142,
    nextAvailable: "Today at 3:30 PM (Telehealth)",
    consultationFee: "$120",
    acceptsInsurance: true,
    avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
    languages: ["English", "Spanish"]
  },
  {
    id: "doc-2",
    name: "Dr. Marcus Vance",
    credentials: "MD, PhD",
    specialty: "Inflammatory Dermatoses & Eczema Specialist",
    clinic: "University Health Dermatology Pavilion",
    location: "450 Academic Way (In-Clinic)",
    modality: "clinic",
    rating: 4.8,
    reviewCount: 98,
    nextAvailable: "Tomorrow at 10:15 AM",
    consultationFee: "$145",
    acceptsInsurance: true,
    avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
    languages: ["English"]
  },
  {
    id: "doc-3",
    name: "Dr. Ayesha Rahman",
    credentials: "MBBS, FCPS (Dermatology)",
    specialty: "Pediatric & General Dermatology",
    clinic: "Skin & Allergy Comprehensive Institute",
    location: "Telehealth Video Consult (Nationwide)",
    modality: "telehealth",
    rating: 4.95,
    reviewCount: 215,
    nextAvailable: "Today within 2 Hours",
    consultationFee: "$85",
    acceptsInsurance: true,
    avatarUrl: "https://images.unsplash.com/photo-1594824813589-9a706509ec29?w=150&auto=format&fit=crop&q=80",
    languages: ["English", "Bangla", "Hindi"]
  },
  {
    id: "doc-4",
    name: "Dr. Jonathan Kim",
    credentials: "MD, FAAD, FACMS",
    specialty: "Mohs Micrographic Surgery & Skin Cancer",
    clinic: "Advanced Oncology Dermatology Associates",
    location: "Northwest Cancer Pavilion",
    modality: "clinic",
    rating: 4.9,
    reviewCount: 180,
    nextAvailable: "Thursday at 1:00 PM",
    consultationFee: "$180",
    acceptsInsurance: true,
    avatarUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80",
    languages: ["English", "Korean"]
  }
];

export default function ReferralPage() {
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();

  const [doctors, setDoctors] = useState<Doctor[]>(DOCTORS_DATA);
  const [selectedModality, setSelectedModality] = useState<string>("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [latestAssessment, setLatestAssessment] = useState<AssessmentSummary | null>(null);
  const [attachDossier, setAttachDossier] = useState<boolean>(true);
  const [bookedDoctor, setBookedDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadLatestAssessment();
    }
  }, [isAuthenticated]);

  async function loadLatestAssessment() {
    try {
      const history = await api.getAssessmentHistory();
      if (history.length > 0) {
        setLatestAssessment(history[0]);
      }
    } catch (e) {
      // Non-critical if history cannot be loaded
    }
  }

  const filteredDoctors = doctors.filter((doc) => {
    if (selectedModality === "telehealth" && doc.modality === "clinic") return false;
    if (selectedModality === "clinic" && doc.modality === "telehealth") return false;
    if (selectedSpecialty !== "all" && !doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] pb-24">
      {/* Header Banner */}
      <section className="bg-white border-b border-[#e2e8f0] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#006194]">
              <span className="material-symbols-outlined text-sm">stethoscope</span>
              <span>Clinical Referral & Telehealth Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight mt-1">
              {language === "bn" ? "চর্মরোগ বিশেষজ্ঞ ডাক্তার ও টেলিমেডিসিন" : "Accredited Dermatologist Network"}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Connect with board-certified dermatologists. Transfer your SkinWise AI intake summary and optical metrics directly to expedite clinical evaluation.
            </p>
          </div>

          {latestAssessment && (
            <div className="bg-sky-50 border border-[#39b8fd]/50 rounded-xl p-3.5 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#006194] text-2xl">assignment_turned_in</span>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ready to Attach</div>
                <div className="text-xs font-bold text-slate-900">{latestAssessment.primary_condition} ({latestAssessment.anatomical_region})</div>
              </div>
              <a
                href={api.getPdfUrl(latestAssessment.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-xs font-bold text-[#006194] hover:underline"
              >
                Preview PDF
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Triage Warning Alert */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5">warning</span>
          <div className="leading-relaxed">
            <span className="font-bold">Routine Appointment Notice: </span>
            This referral directory is intended for non-emergency consultations. If you have fever with a rapidly spreading rash, respiratory distress, facial edema, or widespread peeling skin, do not wait for an appointment—call emergency services (911 / 112 / 999) or visit the nearest emergency department immediately.
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Consultation:</span>
            {[
              { id: "all", label: "All Modalities" },
              { id: "telehealth", label: "Telehealth (Video)" },
              { id: "clinic", label: "In-Person Clinic" }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setSelectedModality(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedModality === btn.id
                    ? "bg-[#006194] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Specialty:</label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-[#006194]"
            >
              <option value="all">All Specialties</option>
              <option value="lesion">Lesions & Oncology</option>
              <option value="eczema">Eczema & Inflammatory</option>
              <option value="pediatric">Pediatric Dermatology</option>
              <option value="surgery">Mohs & Surgery</option>
            </select>
          </div>
        </div>

        {/* Doctor List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-[#39b8fd] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    <img
                      src={doc.avatarUrl}
                      alt={doc.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-[#131b2e] flex items-center gap-1.5">
                        <span>{doc.name}</span>
                        <span className="text-xs font-normal text-slate-500">{doc.credentials}</span>
                      </h3>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <span className="material-symbols-outlined text-xs">star</span>
                        <span>{doc.rating}</span>
                        <span className="text-[10px] text-slate-400">({doc.reviewCount})</span>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-[#006194] mt-0.5">{doc.specialty}</p>
                    <p className="text-xs text-slate-600 mt-1">{doc.clinic}</p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      <span>{doc.location}</span>
                    </div>
                  </div>
                </div>

                {/* Modality Chips & Info */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                      <span className="material-symbols-outlined text-xs">bolt</span>
                      <span>{doc.nextAvailable}</span>
                    </span>

                    {doc.modality === "both" || doc.modality === "telehealth" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-[#006194] text-[10px] font-semibold">
                        <span className="material-symbols-outlined text-xs">videocam</span>
                        <span>Video Ready</span>
                      </span>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900">{doc.consultationFee}</span>
                    <span className="text-[10px] text-slate-500 block">
                      {doc.acceptsInsurance ? "Accepts Insurance" : "Self-Pay Only"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                <button
                  onClick={() => setBookedDoctor(doc)}
                  className="flex-1 py-2.5 rounded-xl bg-[#006194] hover:bg-[#004e77] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">calendar_month</span>
                  <span>Book Appointment</span>
                </button>

                {latestAssessment && (
                  <a
                    href={api.getPdfUrl(latestAssessment.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-[#006194] hover:border-[#006194] text-xs font-semibold transition-all flex items-center gap-1"
                    title="Transfer Dossier"
                  >
                    <span className="material-symbols-outlined text-sm">attach_file</span>
                    <span>Dossier</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Appointment Booking Confirmation Modal */}
        {bookedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-[#006194]">
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>Consultation Referral Dispatch</span>
                </div>
                <button
                  onClick={() => setBookedDoctor(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <div className="mt-4">
                <h3 className="text-base font-bold text-[#131b2e]">
                  Schedule with {bookedDoctor.name}, {bookedDoctor.credentials}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {bookedDoctor.specialty} • {bookedDoctor.clinic}
                </p>

                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Earliest Slot:</span>
                    <span className="font-semibold text-slate-900">{bookedDoctor.nextAvailable}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consultation Fee:</span>
                    <span className="font-semibold text-slate-900">{bookedDoctor.consultationFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Format:</span>
                    <span className="font-semibold text-slate-900 capitalize">{bookedDoctor.modality}</span>
                  </div>
                </div>

                {latestAssessment && (
                  <div className="mt-4 p-3 rounded-xl border border-sky-200 bg-sky-50 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="attachDoc"
                      checked={attachDossier}
                      onChange={(e) => setAttachDossier(e.target.checked)}
                      className="w-4 h-4 text-[#006194] rounded border-slate-300"
                    />
                    <label htmlFor="attachDoc" className="text-xs text-slate-800 cursor-pointer">
                      Attach recent intake (<span className="font-semibold">{latestAssessment.primary_condition}</span>) and optical viability metrics to the clinic briefing.
                    </label>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setBookedDoctor(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert(`Referral request sent to ${bookedDoctor.name}! The clinic will confirm your slot at ${bookedDoctor.nextAvailable}.`);
                    setBookedDoctor(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#006194] hover:bg-[#004e77] text-white text-xs font-bold shadow-sm"
                >
                  Confirm & Reserve
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

