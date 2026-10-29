"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const router = useRouter();
  const { t, lang } = useLanguage();

  // Floating Intake Panel State
  const [selectedSymptom, setSelectedSymptom] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected educational modal for skin concerns
  const [activeConcern, setActiveConcern] = useState<any | null>(null);

  // Interactive Results Preview State (Toggle between Standard, Inconclusive, and Urgent)
  const [previewMode, setPreviewMode] = useState<"standard" | "inconclusive" | "urgent">("standard");

  // Carousel ref for Featured Capabilities
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
        setPhotoError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate entry point
    if (!selectedSymptom && !previewImage) {
      setPhotoError(true);
      return;
    }
    // Navigate to full intake workflow with query params
    const query = new URLSearchParams();
    if (selectedSymptom) query.set("symptom", selectedSymptom);
    if (selectedDuration) query.set("duration", selectedDuration);
    router.push(`/assess?${query.toString()}`);
  };

  // Common Skin Concerns data matching reference card layout
  const skinConcerns = [
    {
      id: "acne",
      title: "Acne & Pimples",
      subtitle: "Papules, pustules, comedones & inflammatory lesions",
      icon: "flare",
      badge: "Tier 1 / Self-Care",
      description: "Follicular hyperkeratinization combined with sebaceous activity. Evaluated for inflammatory vs non-inflammatory distribution.",
      clinicalContext: "Characterized by microcomedones evolving into papules or cystic nodules. Often managed with topical retinoids, benzoyl peroxide, and gentle non-comedogenic cleansing.",
    },
    {
      id: "eczema",
      title: "Eczema & Irritation",
      subtitle: "Atopic dermatitis, xerosis & epidermal barrier impairment",
      icon: "water_drop",
      badge: "Tier 1-2 / Monitoring",
      description: "Pruritic, erythematous patches with disrupted epidermal lipids. Often triggers lichenification under repeated excoriation.",
      clinicalContext: "Presents with intense pruritus, xerosis, and flexural predilection in adults. Management centers on skin barrier hydration and topical anti-inflammatory therapy.",
    },
    {
      id: "fungal",
      title: "Possible Fungal Infections",
      subtitle: "Tinea corporis, pityriasis versicolor & dermatophytosis",
      icon: "coronavirus",
      badge: "Tier 2 / Doctor Recommended",
      description: "Annular erythematous plaques with central clearing and active scaly peripheral margins, responding to antifungal agents.",
      clinicalContext: "Frequently transmitted via contact or damp environments. Definitive confirmation typically utilizes potassium hydroxide (KOH) microscopy by a clinician.",
    },
    {
      id: "rashes",
      title: "Rashes & Contact Dermatitis",
      subtitle: "Allergic response, irritant exposure & acute urticaria",
      icon: "grain",
      badge: "Tier 2 / Assessment",
      description: "Demarcated inflammatory responses following direct chemical, metal (nickel), or botanical irritant contact.",
      clinicalContext: "Features well-demarcated vesicles or erythematous plaques conforming to exposure zones. Patch testing may be indicated for chronic recurrent presentations.",
    },
    {
      id: "pigment",
      title: "Pigmentation Changes",
      subtitle: "Melasma, post-inflammatory hyperpigmentation & vitiligo",
      icon: "contrast",
      badge: "Tier 1-2 / Elective Review",
      description: "Localized hypermelanosis or melanocyte depletion following ultraviolet exposure or resolved dermal inflammation.",
      clinicalContext: "Macular pigmentary alterations without palpable induration. Photoprotection with broad-spectrum zinc oxide or titanium dioxide SPF 50+ is fundamental.",
    },
    {
      id: "lesions",
      title: "Moles & Changing Lesions",
      subtitle: "Nevi evaluation, irregular borders & pigmented macules",
      icon: "shield_with_heart",
      badge: "Tier 2-3 / High Vigilance",
      description: "Screened against the ABCDE criteria: Asymmetry, Border irregularity, Color variegation, Diameter > 6mm, and Evolution.",
      clinicalContext: "Any dynamic lesion demonstrating evolutionary change, bleeding, or jagged margins requires prompt in-person dermatoscope assessment and potential biopsy.",
    },
  ];

  // Featured AI Capabilities Cards matching reference carousel
  const featureCards = [
    {
      title: "AI Skin Photo Analysis",
      description: "Upload high-resolution dermoscopic or macro photographs for computerized assessment of visual lesion morphology and texture features.",
      tag: "Computer Vision & ABCDE",
      image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80",
    },
    {
      title: "Personalized Care Guidance",
      description: "Receive practical next-step guidance derived from accredited medical sources (AAD, BAD, DermNet NZ) contextualized to your specific presentation.",
      tag: "Evidence-Based Guidance",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80",
    },
    {
      title: "Symptom Assessment",
      description: "Answer structured clinical questionnaires regarding duration, itching, anatomical site, spreading, and systemic danger signs.",
      tag: "Multimodal Context",
      image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80",
    },
    {
      title: "Doctor Referral Guidance",
      description: "Identify when in-person dermatologist evaluation is essential, with one-click HL7-aligned clinical dossier PDF generation for your physician.",
      tag: "Clinical Escalation",
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <div className="min-h-screen bg-[#e8f4f8] text-[#1c2834]">
      {/* =========================================================================
          HERO SECTION (Recreating the exact rounded container & medical visual)
          ========================================================================= */}
      <section className="px-3 sm:px-6 pt-4 pb-12">
        <div className="max-w-6xl mx-auto rounded-4xl sm:rounded-5xl bg-gradient-to-b from-[#e1f0f5] via-[#e8f4f8] to-[#edf6fa] border border-white/80 shadow-[0_16px_40px_rgba(160,205,222,0.35)] relative overflow-hidden p-6 sm:p-10 lg:p-14">
          
          {/* Subtle Ambient Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#4da8b9]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-white/70 rounded-full blur-2xl pointer-events-none" />

          {/* Hero Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Trust Badge Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#cde5ee] shadow-xs text-xs font-semibold text-[#328493]">
                <span className="w-2 h-2 rounded-full bg-[#4da8b9] animate-pulse" />
                <span>CE Class I Decision Support • HIPAA Ready</span>
              </div>

              {/* Exact Requested Headline */}
              <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1c2834] tracking-tight leading-[1.15]">
                Understand Your Skin.
                <br />
                <span className="text-[#4da8b9]">Know Your Next Step.</span>
              </h1>

              {/* Supporting Text */}
              <p className="text-sm sm:text-base text-[#526373] leading-relaxed max-w-xl">
                Get AI-assisted skin health insights, personalized care guidance, and clear recommendations on when to consult a healthcare professional.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/assess"
                  className="bg-[#4da8b9] hover:bg-[#3a96a7] text-white text-sm font-bold px-7 py-3.5 rounded-full shadow-[0_6px_20px_rgba(77,168,185,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">dermatology</span>
                  <span>Analyze My Skin</span>
                </Link>

                <a
                  href="#how-it-works"
                  className="bg-white/80 hover:bg-white text-[#1c2834] text-sm font-bold px-6 py-3.5 rounded-full border border-white/80 shadow-xs transition-all hover:shadow-sm flex items-center gap-1.5"
                >
                  <span>How It Works</span>
                  <span className="material-symbols-outlined text-base text-[#526373]">arrow_downward</span>
                </a>
              </div>

              {/* Trust Statement */}
              <p className="text-[11px] text-[#6b7c8d] max-w-lg flex items-center gap-1.5 pt-1">
                <span className="material-symbols-outlined text-sm text-[#4da8b9]">verified</span>
                <span>Provides informational symptom triage. Does not replace in-person consultation with a medical doctor.</span>
              </p>
            </div>

            {/* Right Column: Realistic Doctor & Patient Photography */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-sm lg:max-w-none">
                {/* Doctor Visual Card */}
                <div className="rounded-3xl sm:rounded-4xl overflow-hidden border-4 border-white shadow-[0_12px_36px_rgba(140,195,215,0.35)] relative aspect-[4/4.2]">
                  <img
                    src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80"
                    alt="Dermatologist in consultation with patient"
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1c2834]/30 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Floating Optical Badge */}
                <div className="absolute -bottom-4 -left-4 sm:-bottom-5 sm:-left-5 bg-white/90 backdrop-blur-md border border-white/90 rounded-2xl p-3 shadow-lg flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#e6f5f7] text-[#4da8b9] flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">biotech</span>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-[#526373]">Optical Quality</div>
                    <div className="text-xs font-extrabold text-[#1c2834]">Laplacian & Lux Matrix</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              FLOATING SKIN ANALYSIS PANEL (Lower Hero Translucent Appointment Form)
              ========================================================================= */}
          <div className="mt-12 sm:mt-16 pt-2">
            <div className="glass-pill rounded-3xl sm:rounded-4xl p-4 sm:p-5 shadow-[0_12px_35px_rgba(140,190,210,0.3)] border border-white/90">
              <form onSubmit={handleStartAnalysis} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
                
                {/* Field 1: Skin Photo Upload */}
                <div className="relative">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#526373] mb-1 pl-2">
                    Skin Photo
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/90 border text-xs font-semibold transition-all ${
                      photoError
                        ? "border-[#ba1a1a] text-[#ba1a1a] bg-rose-50"
                        : "border-[#cde5ee] hover:border-[#4da8b9] text-[#1c2834]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-outlined text-base text-[#4da8b9]">
                        {previewImage ? "check_circle" : "add_photo_alternate"}
                      </span>
                      <span className="truncate">
                        {previewImage ? "Photo Selected" : "Upload Photo"}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#526373] bg-[#eef7fa] px-2 py-0.5 rounded-full">
                      JPEG/PNG
                    </span>
                  </button>
                </div>

                {/* Field 2: Main Symptom Selector */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#526373] mb-1 pl-2">
                    Main Symptom
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSymptom}
                      onChange={(e) => {
                        setSelectedSymptom(e.target.value);
                        setPhotoError(false);
                      }}
                      className="w-full appearance-none px-4 py-2.5 rounded-2xl bg-white/90 border border-[#cde5ee] hover:border-[#4da8b9] text-xs font-semibold text-[#1c2834] focus:outline-none focus:border-[#4da8b9] transition-all pr-8"
                    >
                      <option value="">Select Symptom...</option>
                      <option value="Rash or Itching">Rash or Itching</option>
                      <option value="Acne or Blemish">Acne or Blemish</option>
                      <option value="Changing Mole / Spot">Changing Mole / Spot</option>
                      <option value="Dry Red Patch">Dry Red Patch</option>
                      <option value="Painful / Swollen Bump">Painful / Swollen Bump</option>
                      <option value="Flaking or Peeling">Flaking or Peeling</option>
                    </select>
                    <span className="material-symbols-outlined text-sm text-[#526373] absolute right-3 top-3 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Field 3: Duration Selector */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#526373] mb-1 pl-2">
                    Duration
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 rounded-2xl bg-white/90 border border-[#cde5ee] hover:border-[#4da8b9] text-xs font-semibold text-[#1c2834] focus:outline-none focus:border-[#4da8b9] transition-all pr-8"
                    >
                      <option value="">Select Duration...</option>
                      <option value="< 1 week">Less than 1 week</option>
                      <option value="1 - 4 weeks">1 - 4 weeks</option>
                      <option value="1 - 6 months">1 - 6 months</option>
                      <option value="> 6 months">More than 6 months</option>
                    </select>
                    <span className="material-symbols-outlined text-sm text-[#526373] absolute right-3 top-3 pointer-events-none">
                      calendar_today
                    </span>
                  </div>
                </div>

                {/* Field 4: Primary Action Button ("Start Analysis" matching "Book Now") */}
                <div className="sm:self-end pt-2 sm:pt-0">
                  <button
                    type="submit"
                    className="w-full bg-[#4da8b9] hover:bg-[#3a96a7] text-white text-xs sm:text-sm font-bold py-2.5 sm:py-3 px-5 rounded-2xl shadow-[0_4px_16px_rgba(77,168,185,0.4)] transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <span>Start Analysis</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </form>

              {photoError && (
                <div className="mt-2 text-[11px] text-[#ba1a1a] flex items-center gap-1 pl-2">
                  <span className="material-symbols-outlined text-sm">info</span>
                  <span>Please select a primary symptom or choose a photograph to launch the intake workflow.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          EXPLORE COMMON SKIN CONCERNS (Replaces "Our Departments" Section)
          ========================================================================= */}
      <section id="skin-conditions" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-10">
          <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-[#1c2834] tracking-tight">
            Explore Common Skin Concerns
          </h2>
          <p className="text-xs sm:text-sm text-[#526373] mt-2 max-w-xl mx-auto">
            Review medically reviewed educational information on frequently observed dermatological presentations.
          </p>
        </div>

        {/* 3 Raised Squircle Cards Per Row (Desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {skinConcerns.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveConcern(item)}
              className="bg-white rounded-3xl p-7 border border-white/90 shadow-med-card hover:shadow-med-card-hover transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col items-center text-center cursor-pointer group"
            >
              {/* Soft Medical Glyph Icon */}
              <div className="w-16 h-16 rounded-2xl bg-[#eaf5f7] text-[#4da8b9] group-hover:bg-[#4da8b9] group-hover:text-white flex items-center justify-center mb-5 transition-colors shadow-xs">
                <span className="material-symbols-outlined text-3xl">{item.icon}</span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="font-headline text-base sm:text-lg font-bold text-[#1c2834] group-hover:text-[#4da8b9] transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-[#526373] mt-2 line-clamp-2 leading-relaxed">
                {item.description}
              </p>

              <div className="mt-5 pt-4 border-t border-[#f0f6f8] w-full flex items-center justify-between text-[11px]">
                <span className="text-[#3a8b98] font-semibold bg-[#eef7fa] px-2.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
                <span className="text-[#4da8b9] font-bold group-hover:underline flex items-center">
                  <span>Learn more</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Educational Detail Modal */}
        {activeConcern && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/80 animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#eaf5f7] text-[#4da8b9] flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">{activeConcern.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-headline text-lg font-bold text-[#1c2834]">{activeConcern.title}</h3>
                    <span className="text-[11px] text-[#4da8b9] font-semibold">{activeConcern.badge}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveConcern(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs text-[#526373] leading-relaxed">
                <div>
                  <h4 className="font-bold text-[#1c2834] uppercase tracking-wider text-[10px] mb-1">Clinical Overview</h4>
                  <p>{activeConcern.description}</p>
                </div>
                <div>
                  <h4 className="font-bold text-[#1c2834] uppercase tracking-wider text-[10px] mb-1">Presentation & Management</h4>
                  <p>{activeConcern.clinicalContext}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#eef7fa] border border-[#cde5ee] text-[11px] text-[#2c4756]">
                  <strong>Medical Disclaimer:</strong> This description is provided strictly for educational purposes and does not represent an automated diagnosis for any personal presentation.
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setActiveConcern(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <Link
                  href="/assess"
                  className="px-5 py-2 rounded-xl bg-[#4da8b9] hover:bg-[#3a96a7] text-white text-xs font-bold shadow-xs"
                >
                  Analyze My Presentation
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          FEATURED AI CAPABILITIES (Replaces "Featured Services" Horizontal Carousel)
          ========================================================================= */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-[#e8f4f8] via-[#e2eff4] to-[#e8f4f8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-[#1c2834] tracking-tight">
                Featured AI Capabilities
              </h2>
              <p className="text-xs sm:text-sm text-[#526373] mt-1">
                Advanced clinical vision modules engineered for dermatological decision support.
              </p>
            </div>

            {/* Carousel Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => scrollCarousel("left")}
                className="w-10 h-10 rounded-full bg-white shadow-xs border border-white/80 hover:bg-[#eef7fa] text-[#1c2834] flex items-center justify-center transition-all"
                aria-label="Previous Slide"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
              </button>
              <button
                onClick={() => scrollCarousel("right")}
                className="w-10 h-10 rounded-full bg-white shadow-xs border border-white/80 hover:bg-[#eef7fa] text-[#1c2834] flex items-center justify-center transition-all"
                aria-label="Next Slide"
              >
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Horizontally Scrollable Cards Container showing ~2.5 cards on desktop */}
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1 snap-x snap-mandatory"
          >
            {featureCards.map((card, idx) => (
              <div
                key={idx}
                className="min-w-[280px] sm:min-w-[340px] lg:min-w-[380px] bg-white rounded-3xl p-4 sm:p-5 border border-white/90 shadow-med-card hover:shadow-med-card-hover transition-all snap-start flex flex-col justify-between"
              >
                <div>
                  {/* Wide Image with Rounded Corners matching template */}
                  <div className="rounded-2xl overflow-hidden aspect-[16/10] bg-slate-100 mb-4 border border-slate-100">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#4da8b9] bg-[#eef7fa] px-2.5 py-0.5 rounded-full mb-2">
                    {card.tag}
                  </span>

                  <h3 className="font-headline text-base sm:text-lg font-bold text-[#1c2834]">
                    {card.title}
                  </h3>

                  <p className="text-xs text-[#526373] mt-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-[#526373]">Clinically Audited</span>
                  <Link
                    href="/assess"
                    className="text-[#4da8b9] font-bold hover:underline flex items-center gap-0.5"
                  >
                    <span>Launch</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          HOW IT WORKS (Simple 3-Step Clear Section)
          ========================================================================= */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#4da8b9]">Workflow</span>
          <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-[#1c2834] tracking-tight mt-1">
            How SkinWise AI Works
          </h2>
          <p className="text-xs sm:text-sm text-[#526373] mt-2 max-w-lg mx-auto">
            Three simple, medically structured steps from image intake to clinical next steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {[
            {
              step: "01",
              title: "Upload a Skin Photo",
              desc: "Capture or upload a clear dermoscopic photograph. Our optical matrix checks Laplacian focus sharpness, lux lighting, and flash glare in real time.",
              icon: "add_a_photo",
            },
            {
              step: "02",
              title: "Answer a Few Questions",
              desc: "Provide clinical context: anatomical location, symptom duration, itch/pain severity score (0-10), and evaluate critical emergency danger signs.",
              icon: "quiz",
            },
            {
              step: "03",
              title: "Receive Insights & Care Steps",
              desc: "Review supported possible explanations, safe self-care guidance, red-flag warning signs, and export an HL7-aligned clinical dossier for your doctor.",
              icon: "clinical_notes",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-7 border border-white/90 shadow-med-card relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#eef7fa] text-[#4da8b9] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                  </div>
                  <span className="text-2xl font-black font-headline text-[#cde5ee]">
                    {item.step}
                  </span>
                </div>

                <h3 className="font-headline text-base font-bold text-[#1c2834] mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-[#526373] leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-[#4da8b9]">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>Evidence-Based Protocol</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          RESULTS PREVIEW SECTION (Interactive Medical Output HUD)
          ========================================================================= */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-[#e8f4f8] via-[#e2eff4] to-[#e8f4f8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#4da8b9]">Clinical Output Preview</span>
            <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-[#1c2834] tracking-tight mt-1">
              Structured Clinical Findings Preview
            </h2>
            <p className="text-xs sm:text-sm text-[#526373] mt-2 max-w-xl mx-auto">
              Inspect how the application organizes possible explanations, uncertainty factors, safe self-care, and referral pathways.
            </p>

            {/* Preview State Toggle */}
            <div className="inline-flex items-center bg-white rounded-full p-1 border border-[#cde5ee] mt-5 shadow-xs">
              <button
                onClick={() => setPreviewMode("standard")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  previewMode === "standard"
                    ? "bg-[#4da8b9] text-white shadow-xs"
                    : "text-[#526373] hover:text-[#1c2834]"
                }`}
              >
                Standard Triage
              </button>
              <button
                onClick={() => setPreviewMode("inconclusive")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  previewMode === "inconclusive"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-[#526373] hover:text-[#1c2834]"
                }`}
              >
                Inconclusive Assessment
              </button>
              <button
                onClick={() => setPreviewMode("urgent")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  previewMode === "urgent"
                    ? "bg-[#ba1a1a] text-white shadow-xs"
                    : "text-[#526373] hover:text-[#1c2834]"
                }`}
              >
                Emergency Escalation
              </button>
            </div>
          </div>

          {/* Interactive Mockup HUD */}
          <div className="bg-white rounded-3xl border border-white/90 shadow-xl overflow-hidden p-6 sm:p-8">
            
            {/* Header with Case Code & Triage Chip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">ILLUSTRATIVE CASE REF: #DEMO-7042</span>
                <h3 className="font-headline text-lg font-bold text-[#1c2834]">
                  {previewMode === "standard" && "Mild Atopic Eczema Presentation"}
                  {previewMode === "inconclusive" && "Inconclusive Findings — Insufficient Evidence"}
                  {previewMode === "urgent" && "Emergency Warning Signs Detected"}
                </h3>
                <span className="text-xs text-[#526373]">Anatomical Location: Volar Forearm • Duration: 12 days</span>
              </div>

              <div>
                {previewMode === "standard" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>TIER 1 — GENERAL SELF-CARE</span>
                  </span>
                )}
                {previewMode === "inconclusive" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>INCONCLUSIVE — CLINICIAN REVIEW NEEDED</span>
                  </span>
                )}
                {previewMode === "urgent" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                    <span>TIER 3 — URGENT CARE REQUIRED</span>
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              
              {/* Evidence & Conditions Column */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#f7fbfc] border border-[#e1eff4]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c2834] mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#4da8b9]">visibility</span>
                    <span>Possible Explanations (Concordance)</span>
                  </h4>
                  
                  {previewMode === "standard" ? (
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-[#cde5ee] flex justify-between items-center">
                        <div>
                          <div className="font-bold text-[#1c2834]">Atopic Dermatitis / Eczema</div>
                          <div className="text-[11px] text-slate-500">Erythema with xerosis & flexural distribution</div>
                        </div>
                        <span className="text-[11px] font-bold text-[#4da8b9] bg-[#eef7fa] px-2 py-0.5 rounded-md">High Visual Fit</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-[#cde5ee] flex justify-between items-center">
                        <div>
                          <div className="font-bold text-[#1c2834]">Contact Dermatitis (Irritant)</div>
                          <div className="text-[11px] text-slate-500">Demarcated surface scaling</div>
                        </div>
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">Moderate Fit</span>
                      </div>
                    </div>
                  ) : previewMode === "inconclusive" ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                      <strong>Uncertainty Disclosure:</strong> Visual evidence is ambiguous due to low contrast and diffuse margin limits. SkinWise AI will not manufacture a diagnosis when confidence criteria are not met.
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-relaxed">
                      <strong>Emergency Protocol Active:</strong> Rapidly expanding erythema accompanied by reported systemic symptoms overrides visual classifier suggestions.
                    </div>
                  )}
                </div>

                {/* Optical & Gaps Indicator */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs">
                  <h4 className="font-bold text-[#1c2834] text-xs mb-2">Optical Viability Metrics</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-50">
                      <div className="text-[10px] text-slate-500">Sharpness</div>
                      <div className="font-bold text-[#4da8b9]">94.2 / 100</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50">
                      <div className="text-[10px] text-slate-500">Ambient Lux</div>
                      <div className="font-bold text-[#4da8b9]">Good Illumination</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50">
                      <div className="text-[10px] text-slate-500">Glare Ratio</div>
                      <div className="font-bold text-[#4da8b9]">2.1% (Safe)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guidance & Actions Column */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#f7fbfc] border border-[#e1eff4]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c2834] mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#4da8b9]">healing</span>
                    <span>Safe Next Steps</span>
                  </h4>
                  
                  <ul className="space-y-1.5 text-xs text-[#526373]">
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-sm text-emerald-600 mt-0.5">check</span>
                      <span>Apply fragrance-free ceramide-rich emollient within 3 minutes after lukewarm bath.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-sm text-emerald-600 mt-0.5">check</span>
                      <span>Avoid harsh surfactants, exfoliants, alcohol-based toners, and hot water.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#ba1a1a] mt-0.5">block</span>
                      <span>Do not scratch or rub lesions; excoriation increases secondary bacterial infection risk.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900">
                  <div className="font-bold flex items-center gap-1 mb-1">
                    <span className="material-symbols-outlined text-sm text-amber-600">notification_important</span>
                    <span>Warning Signs to Monitor</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Seek prompt clinical re-evaluation if you notice yellow crusting (honey-colored impetigo signs), rapidly spreading warmth, or localized throbbing pain.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#526373] gap-3">
              <span>Source Guideline: American Academy of Dermatology (AAD) & DermNet NZ</span>
              <Link
                href="/assess"
                className="inline-flex items-center gap-1.5 text-[#4da8b9] font-bold hover:underline"
              >
                <span>Run Your Real Assessment</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SAFETY AND DOCTOR REFERRAL (3 Organized Levels of Guidance)
          ========================================================================= */}
      <section id="safety" className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#4da8b9]">Clinical Safety Protocols</span>
          <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-[#1c2834] tracking-tight mt-1">
            Safety & Care Pathways
          </h2>
          <p className="text-xs sm:text-sm text-[#526373] mt-2 max-w-xl mx-auto">
            SkinWise AI separates patient conditions into three distinct care pathways. Emergency danger signs strictly supersede visual classifier confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Pathway 1: Mild / General Self-Care */}
          <div className="bg-white rounded-3xl p-7 border border-white/90 shadow-med-card flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-2xl">eco</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Level 1
              </span>
              <h3 className="font-headline text-base font-bold text-[#1c2834] mt-2">
                Mild — General Self-Care
              </h3>
              <p className="text-xs text-[#526373] mt-2 leading-relaxed">
                Appropriate for apparently mild, stable presentations with zero red flags (e.g. minor dry patches, occasional mild acne). Focuses on barrier restoration and watchful monitoring.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
              Guidance: Conservative non-prescription skincare & monitoring instructions.
            </div>
          </div>

          {/* Pathway 2: Doctor Recommended */}
          <div className="bg-white rounded-3xl p-7 border border-white/90 shadow-med-card flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-2xl">stethoscope</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                Level 2
              </span>
              <h3 className="font-headline text-base font-bold text-[#1c2834] mt-2">
                Medical Assessment Recommended
              </h3>
              <p className="text-xs text-[#526373] mt-2 leading-relaxed">
                Recommended when symptoms persist past 14 days, recurrently worsen, exhibit suspicious mole criteria, or fail to respond to standard conservative care.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
              Guidance: Consultation with an accredited dermatologist; HL7 PDF dossier export.
            </div>
          </div>

          {/* Pathway 3: Urgent / Emergency Attention */}
          <div className="bg-white rounded-3xl p-7 border border-white/90 shadow-med-card flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-2xl">emergency</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                Level 3
              </span>
              <h3 className="font-headline text-base font-bold text-[#1c2834] mt-2">
                Urgent or Emergency Care
              </h3>
              <p className="text-xs text-[#526373] mt-2 leading-relaxed">
                Immediate clinical escalation for danger signs: facial/lip swelling, respiratory distress, widespread blistering (SJS/TEN), petechiae, or fever with rapidly spreading redness.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-[#ba1a1a] font-semibold">
              Action: Contact local emergency services (911 / 112 / 999) without delay.
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FINAL CTA SECTION (Rounded Ice-Blue Section)
          ========================================================================= */}
      <section className="px-3 sm:px-6 py-8 pb-16">
        <div className="max-w-5xl mx-auto rounded-4xl sm:rounded-5xl bg-gradient-to-r from-[#d8edf4] via-[#e2f1f7] to-[#d8edf4] border border-white/80 p-8 sm:p-14 text-center shadow-med-card relative overflow-hidden">
          
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[#4da8b9]">Get Started in Minutes</span>
            
            <h2 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1c2834] tracking-tight">
              Take the Next Step Toward Understanding Your Skin.
            </h2>

            <p className="text-xs sm:text-sm text-[#526373] leading-relaxed">
              Upload a photograph today to receive computer-vision lesion insights, evidence-based conservative care guidance, and doctor-referral advice.
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/assess"
                className="bg-[#4da8b9] hover:bg-[#3a96a7] text-white text-sm font-bold px-8 py-3.5 rounded-full shadow-[0_6px_20px_rgba(77,168,185,0.4)] transition-all transform hover:-translate-y-0.5"
              >
                Start Skin Assessment
              </Link>
              <Link
                href="/referral"
                className="bg-white hover:bg-slate-50 text-[#1c2834] text-sm font-bold px-6 py-3.5 rounded-full border border-white/80 shadow-xs"
              >
                Find a Dermatologist
              </Link>
            </div>

            {/* Privacy & Limits Notice */}
            <div className="pt-4 text-[11px] text-[#6b7c8d] max-w-xl mx-auto space-y-1">
              <p>
                <strong>Privacy Guaranteed:</strong> Zero-Cloud retention mode permanently scrubs raw imagery from disk immediately post-analysis. HIPAA & GDPR patient self-deletion compliant.
              </p>
              <p className="text-[10px] text-slate-400">
                SkinWise AI is an informational symptom assessment aid aligned with CE Class I SaMD guidelines. It does not provide a definitive medical diagnosis.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
