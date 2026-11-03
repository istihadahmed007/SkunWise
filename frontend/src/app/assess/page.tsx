"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, SymptomInput } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { BodyMapSelector } from "@/components/BodyMapSelector";

interface PhotoFeedback {
  type: "idle" | "good" | "warning" | "dark" | "bright" | "small";
  message: string;
  resolutionText?: string;
  sharpnessText?: string;
  lightingText?: string;
}

export default function AssessPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  // Mode Selection: "personal" (My Skin Photo) vs "reference" (Educational Reference Image)
  const [analysisMode, setAnalysisMode] = useState<"personal" | "reference">("personal");
  const [referenceSourceUrl, setReferenceSourceUrl] = useState<string>("");

  // Workflow steps: 1 = Photo Intake, 2 = Symptom Questions, 3 = Review & Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Photo state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoFeedback, setPhotoFeedback] = useState<PhotoFeedback>({
    type: "idle",
    message: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Symptom state
  const [bodyLocation, setBodyLocation] = useState<string>("Arm / Hand");
  const [durationPreset, setDurationPreset] = useState<string>("1 to 4 weeks");
  const [durationDays, setDurationDays] = useState<number>(14);
  const [discomfortLevel, setDiscomfortLevel] = useState<number>(5);
  const [isSpreading, setIsSpreading] = useState<boolean>(false);
  const [hasBleedingOrOozing, setHasBleedingOrOozing] = useState<boolean>(false);
  const [hasNewExposure, setHasNewExposure] = useState<boolean>(false);
  const [exposureDetails, setExposureDetails] = useState<string>("");
  const [middaySkinFeel, setMiddaySkinFeel] = useState<string>("balanced");
  const [skinSensitivity, setSkinSensitivity] = useState<string>("rarely_reacts");

  // Safety red flags
  const [hasFever, setHasFever] = useState<boolean>(false);
  const [hasSwelling, setHasSwelling] = useState<boolean>(false);
  const [hasBreathingTrouble, setHasBreathingTrouble] = useState<boolean>(false);
  const [hasBlistering, setHasBlistering] = useState<boolean>(false);

  // Mandatory Explicit Consent States - Pre-checked with full affirmative notice & active opt-out
  const [consentBiometric, setConsentBiometric] = useState<boolean>(true);
  const [consentDisclaimer, setConsentDisclaimer] = useState<boolean>(true);
  const [consentError, setConsentError] = useState<string | null>(null);

  // Friendly error sanitization to prevent raw Pydantic or backend stack traces from showing to patients
  const getDisplayErrorMessage = (rawError: string | null): string => {
    if (!rawError) {
      return language === "bn"
        ? "একটি সমস্যা দেখা দিয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।"
        : "An unexpected error occurred. Please try again.";
    }
    const lower = rawError.toLowerCase();

    // 1. Connection / Server / Gateway issues
    if (
      lower.includes("timeout") ||
      lower.includes("503") ||
      lower.includes("500") ||
      lower.includes("502") ||
      lower.includes("504") ||
      lower.includes("404") ||
      lower.includes("connection") ||
      lower.includes("failed to fetch") ||
      lower.includes("network") ||
      lower.includes("internal server error") ||
      lower.includes("failed with status")
    ) {
      return language === "bn"
        ? "সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে ব্যাকএন্ড সার্ভার চালু রয়েছে কিনা তা পরীক্ষা করুন।"
        : "Unable to connect to the analysis service. Please ensure the backend server is running and try again.";
    }

    // 2. Patient Intake Consent
    if (lower.includes("consent") || lower.includes("biometric") || lower.includes("disclaimer")) {
      return language === "bn"
        ? "এগিয়ে যাওয়ার জন্য অনুগ্রহ করে ছবি প্রক্রিয়াকরণ ও অ-নির্ণয়কারী পরামর্শের স্বীকৃতি উভয়টি নিশ্চিত করুন।"
        : "Affirmative consent for photo processing and non-diagnostic acknowledgment are required to proceed.";
    }

    // 3. Aspect ratio / Dimensions / Format
    if (lower.includes("aspect ratio") || lower.includes("abnormal")) {
      return language === "bn"
        ? "ছবির দৈর্ঘ্য ও প্রস্থের অনুপাত অস্বাভাবিক। অনুগ্রহ করে সাধারণ অনুপাতের সরাসরি ছবি আপলোড করুন।"
        : "Image aspect ratio is abnormal. Please upload a standard photo centered on the skin concern.";
    }
    if (lower.includes("resolution") || lower.includes("too low") || lower.includes("minimum 200")) {
      return language === "bn"
        ? "ছবির রেজোলিউশন খুব কম (সর্বনিম্ন ২০০x২০০ পিক্সেল)। স্পষ্ট ও বড় ছবি আপলোড করুন।"
        : "Image resolution is too low (minimum 200x200px required). Please upload a clearer, closer photo.";
    }
    if (lower.includes("format") || lower.includes("magic bytes") || lower.includes("signature") || lower.includes("heic")) {
      return language === "bn"
        ? "ছবির ফরম্যাট সমর্থিত নয়। অনুগ্রহ করে সরাসরি JPEG, PNG বা WebP ছবি ব্যবহার করুন।"
        : "Unsupported image format. Please upload a JPEG, PNG, or WebP photo directly.";
    }

    // 4. Optical Quality (Blur / Glare / Exposure)
    if (lower.includes("quality") || lower.includes("blur") || lower.includes("dark") || lower.includes("light")) {
      return language === "bn"
        ? "ছবির মান পর্যাপ্ত স্পষ্ট নয়। অনুগ্রহ করে পর্যাপ্ত আলোতে ঝাপসা ছাড়া পরিষ্কার ছবি তুলুন।"
        : "Photo quality was insufficient for visual pattern matching. Please capture a clear, steady photo in natural daylight.";
    }

    // 5. Explicit Non-Skin Rejection
    if (
      lower.includes("insufficient skin") ||
      lower.includes("skin pixel") ||
      lower.includes("non-skin area")
    ) {
      return language === "bn"
        ? "ছবিতে পর্যাপ্ত ত্বক শনাক্ত করা যায়নি। অনুগ্রহ করে সরাসরি ত্বকের স্পষ্ট ছবি আপলোড করুন।"
        : "Insufficient skin area visible in the photo. Please provide a clear, focused image of the skin concern.";
    }

    // 6. Form / Symptom Validation
    if (lower.includes("validation error") || lower.includes("input_value") || lower.includes("pydantic") || lower.includes("payload")) {
      return language === "bn"
        ? "লক্ষণ ও তথ্যের ফর্ম প্রক্রিয়াকরণে সমস্যা হয়েছে। অনুগ্রহ করে তথ্য পুনরায় পরীক্ষা করে চেষ্টা করুন।"
        : "There was an issue processing your symptom inputs. Please review your answers and try again.";
    }

    return rawError;
  };

  // Step 3: Loading & submission state
  const [loadingStage, setLoadingStage] = useState<number>(1);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Query parameter handling from homepage quick concern buttons
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const symptom = params.get("symptom");
      const duration = params.get("duration");
      if (symptom) {
        setExposureDetails(`Concern: ${symptom}`);
      }
      if (duration) {
        if (duration === "< 1 week") {
          setDurationPreset("< 1 week");
          setDurationDays(4);
        } else if (duration === "1 - 4 weeks") {
          setDurationPreset("1 to 4 weeks");
          setDurationDays(14);
        } else if (duration === "1 - 6 months") {
          setDurationPreset("1 to 3 months");
          setDurationDays(45);
        } else if (duration === "> 6 months") {
          setDurationPreset("Over 3 months");
          setDurationDays(120);
        }
      }
    }
  }, []);

  // Real client-side photo check (region-aware brightness, resolution, and edge contrast)
  const analyzePhotoLocally = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Check resolution
      const resText = `${img.width}x${img.height}px`;
      if (img.width < 200 || img.height < 200) {
        setPhotoFeedback({
          type: "small",
          message:
            language === "bn"
              ? "ছবিটি বেশ ছোট (সর্বনিম্ন ২০০x২০০ পিক্সেল আবশ্যক)। স্পষ্ট ফলাফলের জন্য পরিষ্কার ছবি দিন।"
              : "This photo resolution is too low. A clearer, closer photo of at least 200x200px works best.",
          resolutionText: resText,
          sharpnessText: language === "bn" ? "খুব কম" : "Low",
          lightingText: language === "bn" ? "অনিশ্চিত" : "Uncertain",
        });
        return;
      }

      // Check central 70% lighting on canvas (protects against dark dermoscopy borders or drapes)
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, 64, 64);
          const imgData = ctx.getImageData(0, 0, 64, 64);
          const data = imgData.data;

          let centralLuminance = 0;
          let centralCount = 0;
          let diffSum = 0;

          for (let y = 10; y < 54; y++) {
            for (let x = 10; x < 54; x++) {
              const idx = (y * 64 + x) * 4;
              const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
              centralLuminance += lum;
              centralCount++;

              if (x < 53) {
                const nextIdx = (y * 64 + x + 1) * 4;
                const nextLum = 0.299 * data[nextIdx] + 0.587 * data[nextIdx + 1] + 0.114 * data[nextIdx + 2];
                diffSum += Math.abs(lum - nextLum);
              }
            }
          }

          const avgLuminance = centralLuminance / Math.max(1, centralCount);
          const edgeIndex = diffSum / Math.max(1, centralCount);

          const sharpnessLabel = edgeIndex > 4.5
            ? (language === "bn" ? "স্পষ্ট ও ফোকাসযুক্ত" : "In focus")
            : (language === "bn" ? "কিছুটা নরম ফোকাস" : "Soft focus");

          if (avgLuminance < 30) {
            setPhotoFeedback({
              type: "dark",
              message:
                language === "bn"
                  ? "ছবিটির কেন্দ্রীয় অংশ বেশ অন্ধকার দেখাচ্ছে। জানালার আলোতে বা পর্যাপ্ত আলোতে ছবি তুললে ভালো ফলাফল মিলবে।"
                  : "The central skin area looks underexposed. Capture in daylight for highest accuracy.",
              resolutionText: resText,
              sharpnessText: sharpnessLabel,
              lightingText: language === "bn" ? "অতিরিক্ত অন্ধকার" : "Underexposed",
            });
          } else if (avgLuminance > 238) {
            setPhotoFeedback({
              type: "bright",
              message:
                language === "bn"
                  ? "ছবিটিতে অতিরিক্ত আলো বা ফ্ল্যাশ পড়েছে। ফ্ল্যাশ ছাড়া ছবি তোলার চেষ্টা করুন।"
                  : "The photo has intense glare or overexposure. Try capturing without camera flash.",
              resolutionText: resText,
              sharpnessText: sharpnessLabel,
              lightingText: language === "bn" ? "অতিরিক্ত আলো" : "Overexposed",
            });
          } else if (edgeIndex < 2.5) {
            setPhotoFeedback({
              type: "warning",
              message:
                language === "bn"
                  ? "ছবির ফোকাস কিছুটা নরম বা ঝাপসা। স্পষ্ট রেজাল্টের জন্য হাত স্থির রেখে ফোকাস লক করে ছবি তুলুন।"
                  : "Photo has soft focus. Hold the camera steady for crisp feature detection.",
              resolutionText: resText,
              sharpnessText: sharpnessLabel,
              lightingText: language === "bn" ? "পর্যাপ্ত আলো" : "Good lighting",
            });
          } else {
            setPhotoFeedback({
              type: "good",
              message:
                language === "bn"
                  ? "ছবির স্পষ্টতা ও আলোর ভারসাম্য খুব ভালো। পরবর্তী ধাপে যেতে পারেন।"
                  : "Photo clarity and lighting look good. Ready for analysis.",
              resolutionText: resText,
              sharpnessText: sharpnessLabel,
              lightingText: language === "bn" ? "সুষম প্রাকৃতিক আলো" : "Balanced lighting",
            });
          }
        }
      } catch {
        setPhotoFeedback({
          type: "good",
          message:
            language === "bn" ? "ছবি প্রস্তুত রয়েছে।" : "Photo attached and ready.",
          resolutionText: resText,
          sharpnessText: language === "bn" ? "উপযুক্ত" : "Suitable",
          lightingText: language === "bn" ? "স্বাভাবিক" : "Normal",
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setPhotoFeedback({
        type: "small",
        message:
          language === "bn"
            ? "ছবিটি লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে অন্য ছবি নির্বাচন করুন।"
            : "Could not read this image file. Please try another photo.",
      });
    };

    img.src = objectUrl;
  };

  const handleFile = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    analyzePhotoLocally(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPhotoFeedback({ type: "idle", message: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const submitAssessment = async () => {
    if (!selectedFile || isSubmitting) {
      if (!selectedFile) setCurrentStep(1);
      return;
    }

    if (!consentBiometric || !consentDisclaimer) {
      setConsentError(
        language === "bn"
          ? "এগিয়ে যাওয়ার জন্য অনুগ্রহ করে ছবি প্রক্রিয়াকরণ ও চিকিৎসা সংক্রান্ত স্বীকৃতি উভয়টিতে টিক দিন।"
          : "Please accept both the photo processing consent and medical non-diagnostic acknowledgment to proceed."
      );
      return;
    }
    setConsentError(null);

    setIsSubmitting(true);
    setCurrentStep(3);
    setLoadingStage(1);
    setAnalysisError(null);

    const symptomData: SymptomInput = {
      anatomical_region: bodyLocation,
      duration_days: durationDays,
      itch_score: discomfortLevel,
      pain_score: discomfortLevel > 5 ? Math.round(discomfortLevel / 2) : 1,
      is_spreading: isSpreading,
      bleeding_or_crusting: hasBleedingOrOozing,
      prior_chemical_exposure: hasNewExposure,
      exposure_details: exposureDetails.trim() || undefined,
      personal_skin_history: undefined,
      midday_skin_feel: middaySkinFeel,
      skin_sensitivity: skinSensitivity,
      has_fever_or_chills: hasFever,
      has_facial_or_throat_swelling: hasSwelling,
      has_breathing_difficulty: hasBreathingTrouble,
      has_rapid_blistering_or_peeling: hasBlistering,
      has_petechiae_or_purpura: false,
      consent_biometric: consentBiometric,
      consent_disclaimer: consentDisclaimer,
      analysis_mode: analysisMode,
      reference_source_url: analysisMode === "reference" && referenceSourceUrl.trim() ? referenceSourceUrl.trim() : undefined,
    };

    try {
      setLoadingStage(1);
      await new Promise((r) => setTimeout(r, 600));

      setLoadingStage(2);
      await new Promise((r) => setTimeout(r, 600));

      setLoadingStage(3);
      const assessment = await api.analyzeSkin(
        selectedFile,
        symptomData,
        bodyLocation
      );

      setLoadingStage(4);
      await new Promise((r) => setTimeout(r, 500));

      router.push(`/assessment/${assessment.id}`);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(
        err.message ||
          (language === "bn"
            ? "যাচাই প্রক্রিয়া সম্পন্ন হতে পারেনি। অনুগ্রহ করে আবার চেষ্টা করুন।"
            : "We were unable to complete your skin check. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
      {/* Reassuring Header & Step Counter */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f4f8] text-[#328493] text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-[#4da8b9]" />
              {currentStep === 1 && (language === "bn" ? "ধাপ ১ / ২: ছবি" : "Step 1 of 2: Skin photo")}
              {currentStep === 2 && (language === "bn" ? "ধাপ ২ / ২: লক্ষণ" : "Step 2 of 2: Symptoms & safety")}
              {currentStep === 3 && (language === "bn" ? "পর্যালোচনা চলছে" : "Reviewing your check")}
            </div>
            <h1 className="font-headline text-2xl sm:text-3xl font-bold text-[#1c2834]">
              {currentStep === 1 && (language === "bn" ? "ত্বকের পরিষ্কার ছবি যুক্ত করুন" : "Add a clear photo of your skin concern")}
              {currentStep === 2 && (language === "bn" ? "কয়েকটি সংক্ষিপ্ত লক্ষণ সংক্রান্ত প্রশ্ন" : "A few short questions about your symptoms")}
              {currentStep === 3 && (language === "bn" ? "তথ্য পর্যালোচনা করা হচ্ছে..." : "Reviewing your information...")}
            </h1>
            <p className="text-xs sm:text-sm text-[#526373] mt-1 max-w-xl leading-relaxed">
              {currentStep === 1 &&
                (language === "bn"
                  ? "আপনার ফোনের ক্যামেরা দিয়ে সরাসরি ছবি তুলুন অথবা গ্যালারি থেকে আপলোড করুন।"
                  : "Take a new photo with your phone or upload an existing clear picture.")}
              {currentStep === 2 &&
                (language === "bn"
                  ? "এই তথ্যগুলো আমাদের নিরাপদ এবং প্রাসঙ্গিক ঘরোয়া যত্ন ও পরামর্শ দিতে সাহায্য করে।"
                  : "These details help us provide safer guidance and check if you should see a doctor.")}
              {currentStep === 3 &&
                (language === "bn"
                  ? "আমরা আপনার ছবি এবং লক্ষণগুলোর তথ্য সাজিয়ে সহজ ভাষায় ফলাফল প্রস্তুত করছি।"
                  : "We are reviewing your photo and answers to prepare a simple, plain-language summary.")}
            </p>
          </div>

          {/* Step Progress Pill */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                currentStep >= 1
                  ? "bg-[#4da8b9] text-white"
                  : "bg-slate-100 text-[#526373]"
              }`}
            >
              1
            </div>
            <div className="w-8 h-1 bg-[#cce4ee] rounded-full overflow-hidden">
              <div
                className={`h-full bg-[#4da8b9] transition-all duration-300 ${
                  currentStep >= 2 ? "w-full" : "w-0"
                }`}
              />
            </div>
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                currentStep >= 2
                  ? "bg-[#4da8b9] text-white"
                  : "bg-slate-100 text-[#526373]"
              }`}
            >
              2
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: PHOTO INTAKE */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Analysis Mode Selector */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-white/80 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[#328493] uppercase tracking-wider">
                  {language === "bn" ? "বিশ্লেষণের ধরন নির্বাচন করুন" : "Choose Analysis Mode"}
                </span>
                <p className="text-xs text-[#526373] mt-0.5">
                  {language === "bn"
                    ? "আপনার নিজের ত্বকের যত্ন না কি কোনো রেফারেন্স মেডিকেল ছবি বিশ্লেষণ করতে চান?"
                    : "Are you checking your personal skin concern or analyzing an educational atlas image?"}
                </p>
              </div>
              <div className="inline-flex rounded-2xl bg-[#e8f4f8] p-1 border border-[#cce4ee] shrink-0">
                <button
                  type="button"
                  onClick={() => setAnalysisMode("personal")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-headline font-bold transition-all cursor-pointer ${
                    analysisMode === "personal"
                      ? "bg-[#4da8b9] text-white shadow-xs"
                      : "text-[#526373] hover:text-[#1c2834]"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">person</span>
                  <span>{language === "bn" ? "আমার ত্বকের ছবি" : "My Skin Photo"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAnalysisMode("reference")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-headline font-bold transition-all cursor-pointer ${
                    analysisMode === "reference"
                      ? "bg-[#4da8b9] text-white shadow-xs"
                      : "text-[#526373] hover:text-[#1c2834]"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">menu_book</span>
                  <span>{language === "bn" ? "রেফারেন্স মেডিকেল ছবি" : "Reference Atlas"}</span>
                </button>
              </div>
            </div>

            {analysisMode === "reference" && (
              <div className="mt-4 pt-3 border-t border-[#d8edf3] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#328493] shrink-0">link</span>
                <input
                  type="url"
                  value={referenceSourceUrl}
                  onChange={(e) => setReferenceSourceUrl(e.target.value)}
                  placeholder={
                    language === "bn"
                      ? "ছবির অনলাইন উৎস বা তথ্যসূত্র URL (ঐচ্ছিক, যেমন: DermNet / Atlas লিংক)"
                      : "Reference image URL or atlas attribution (optional, e.g. DermNet / textbook link)"
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#cce4ee] bg-white text-[#1c2834] focus:outline-none focus:ring-2 focus:ring-[#4da8b9]"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Photo Preview or Upload Drop Zone (7 cols) */}
          <div className="md:col-span-7 bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-xs space-y-4">
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleInputChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handleInputChange}
              className="hidden"
            />

            {!previewUrl ? (
              /* Drop Zone Area */
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-[#8ec7d3] hover:border-[#4da8b9] bg-[#f4fafc] hover:bg-[#eef7fa] transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current?.click();
                  }
                }}
                aria-label="Upload photo from device"
              >
                <div className="w-16 h-16 rounded-full bg-[#e8f4f8] group-hover:bg-[#d8edf3] text-[#328493] flex items-center justify-center mb-3 transition-colors">
                  <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                </div>
                <h3 className="font-headline font-bold text-base text-[#1c2834]">
                  {language === "bn" ? "ছবি আপলোড করতে ক্লিক করুন" : "Upload or drop your skin photo"}
                </h3>
                <p className="text-xs text-[#526373] mt-1 max-w-xs">
                  {language === "bn"
                    ? "কম্পিউটার বা ফোন থেকে ছবি নির্বাচন করুন (JPG, PNG, WebP)"
                    : "Tap to browse files or drop a clear image here (JPG, PNG, WebP)"}
                </p>
              </div>
            ) : (
              /* Photo Preview with Controls */
              <div className="space-y-4">
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 shadow-inner flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Uploaded skin photo preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{language === "bn" ? "ছবি সফলভাবে যুক্ত হয়েছে" : "Photo attached"}</span>
                  </div>
                </div>

                {/* Retake and Remove Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#e8f4f8] hover:bg-[#d8edf3] text-[#328493] text-xs font-headline font-bold transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">photo_camera</span>
                      <span>{language === "bn" ? "আবার তুলুন" : "Retake photo"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1c2834] text-xs font-headline font-semibold transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">file_upload</span>
                      <span>{language === "bn" ? "ফাইল পরিবর্তন" : "Change file"}</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1 text-[#ba1a1a] hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-headline font-bold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    <span>{language === "bn" ? "ছবি মুছুন" : "Remove photo"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Direct Dual Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-2xl bg-[#4da8b9] hover:bg-[#3a96a7] text-white font-headline text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4da8b9] focus-visible:outline-none"
              >
                <span className="material-symbols-outlined text-lg">photo_camera</span>
                <span>{language === "bn" ? "ক্যামেরা খুলুন" : "Take Photo"}</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-2xl bg-[#e8f4f8] hover:bg-[#d8edf3] text-[#328493] font-headline text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4da8b9] focus-visible:outline-none"
              >
                <span className="material-symbols-outlined text-lg">upload_file</span>
                <span>{language === "bn" ? "ফাইল বেছে নিন" : "Upload File"}</span>
              </button>
            </div>

            {/* Real Client-Side Image Pre-Check Card */}
            {photoFeedback.type !== "idle" && (
              <div
                className={`p-4 rounded-2xl text-xs space-y-2.5 transition-all ${
                  photoFeedback.type === "good"
                    ? "bg-emerald-50/80 text-emerald-950 border border-emerald-200"
                    : photoFeedback.type === "warning"
                    ? "bg-amber-50/80 text-amber-950 border border-amber-200"
                    : "bg-rose-50/80 text-rose-950 border border-rose-200"
                }`}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-base mt-0.5 shrink-0">
                    {photoFeedback.type === "good" ? "check_circle" : "info"}
                  </span>
                  <p className="leading-relaxed font-medium">{photoFeedback.message}</p>
                </div>

                {/* Multi-Metric Pre-Check Badges */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-black/5 text-[11px]">
                  <div className="bg-white/80 rounded-xl p-2 text-center">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">
                      {language === "bn" ? "রেজোলিউশন" : "Resolution"}
                    </span>
                    <span className="font-semibold text-slate-800">{photoFeedback.resolutionText || "—"}</span>
                  </div>
                  <div className="bg-white/80 rounded-xl p-2 text-center">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">
                      {language === "bn" ? "ফোকাস" : "Sharpness"}
                    </span>
                    <span className="font-semibold text-slate-800">{photoFeedback.sharpnessText || "—"}</span>
                  </div>
                  <div className="bg-white/80 rounded-xl p-2 text-center">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">
                      {language === "bn" ? "আলো" : "Lighting"}
                    </span>
                    <span className="font-semibold text-slate-800">{photoFeedback.lightingText || "—"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Photo Tips & Continue Action (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            {/* Tips Card */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-xs space-y-4">
              <h3 className="font-headline font-bold text-sm text-[#1c2834] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4da8b9] text-lg">tips_and_updates</span>
                <span>{t.photoTipsTitle}</span>
              </h3>

              <div className="space-y-2.5 text-xs text-[#526373]">
                <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#f4fafc]">
                  <span className="material-symbols-outlined text-[#328493] text-lg shrink-0 mt-0.5">wb_sunny</span>
                  <div>
                    <h4 className="font-bold text-[#1c2834]">
                      {language === "bn" ? "দিনের আলো বা উজ্জ্বল প্রাকৃতিক আলো" : "Daylight preferred"}
                    </h4>
                    <p className="text-[11px] mt-0.5 text-slate-500">
                      {language === "bn"
                        ? "দিনের আলোয় বা জানালার পাশে ছবি তুললে ত্বকের স্বাভাবিক রঙ ফুটে ওঠে।"
                        : "Take the photo in daylight near a window for natural skin tones."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#f4fafc]">
                  <span className="material-symbols-outlined text-[#328493] text-lg shrink-0 mt-0.5">flash_off</span>
                  <div>
                    <h4 className="font-bold text-[#1c2834]">
                      {language === "bn" ? "ফ্ল্যাশ বন্ধ রাখুন" : "No flash"}
                    </h4>
                    <p className="text-[11px] mt-0.5 text-slate-500">
                      {language === "bn"
                        ? "ক্যামেরা ফ্ল্যাশ সাদা দাগ তৈরি করে ত্বকের গভীর বিবরণ নষ্ট করে।"
                        : "Camera flash creates intense glare and obscures border details."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#f4fafc]">
                  <span className="material-symbols-outlined text-[#328493] text-lg shrink-0 mt-0.5">lightbulb</span>
                  <div>
                    <h4 className="font-bold text-[#1c2834]">
                      {language === "bn" ? "প্রাকৃতিক আলো না থাকলে উজ্জ্বল সাদা আলো" : "Otherwise bright white light"}
                    </h4>
                    <p className="text-[11px] mt-0.5 text-slate-500">
                      {language === "bn"
                        ? "হলুদ বা রঙিন বাল্বের বদলে ঘরে পর্যাপ্ত সাদা বাতি ব্যবহার করুন।"
                        : "Use uniform white indoor room lighting if daylight is unavailable."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#f4fafc]">
                  <span className="material-symbols-outlined text-[#328493] text-lg shrink-0 mt-0.5">filter_center_focus</span>
                  <div>
                    <h4 className="font-bold text-[#1c2834]">
                      {language === "bn" ? "ক্যামেরা স্থির রাখুন (৪-৬ ইঞ্চি দূরত্ব)" : "Keep steady & focused"}
                    </h4>
                    <p className="text-[11px] mt-0.5 text-slate-500">
                      {language === "bn"
                        ? "হাত কাঁপাবেন না; স্ক্রিনে ফোকাস করে পরিষ্কার ছবি নিন।"
                        : "Hold camera steady 4–6 inches away and tap to autofocus."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-[#f4fafc]">
                  <span className="material-symbols-outlined text-[#328493] text-lg shrink-0 mt-0.5">crop_free</span>
                  <div>
                    <h4 className="font-bold text-[#1c2834]">
                      {language === "bn" ? "সম্পূর্ণ ক্ষতিগ্রস্ত অংশ ফ্রেমের ভেতরে রাখুন" : "Show full area"}
                    </h4>
                    <p className="text-[11px] mt-0.5 text-slate-500">
                      {language === "bn"
                        ? "দাগ বা র্যাশের চারপাশের কিছুটা সুস্থ ত্বকও যেন ছবিতে দেখা যায়।"
                        : "Include the full lesion border with a margin of surrounding normal skin."}
                    </p>
                  </div>
                </div>

                {/* Visual Examples of Photos matching mobile UI reference */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-2">
                    {language === "bn" ? "উপযোগী ছবির উদাহরণ" : "Examples of good photos"}
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center space-y-1">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-sm">wb_sunny</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-900 block leading-tight">
                        {language === "bn" ? "দিনের আলো" : "Daylight"}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-sm">center_focus_strong</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 block leading-tight">
                        {language === "bn" ? "পরিষ্কার ফোকাস" : "Sharp Focus"}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-100 text-center space-y-1">
                      <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-sm">flash_off</span>
                      </div>
                      <span className="text-[10px] font-bold text-rose-900 block leading-tight">
                        {language === "bn" ? "ফ্ল্যাশ ছাড়া" : "No Flash"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue to Step 2 Card */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-white/80 shadow-xs space-y-3">
              <button
                type="button"
                disabled={!selectedFile}
                onClick={() => {
                  if (selectedFile) setCurrentStep(2);
                }}
                className={`w-full py-3.5 px-6 rounded-2xl font-headline text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                  selectedFile
                    ? "bg-[#4da8b9] hover:bg-[#3a96a7] text-white cursor-pointer active:scale-98"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                }`}
              >
                <span>{t.proceedToSymptoms}</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>

              {!selectedFile && (
                <p className="text-center text-[11px] text-[#526373]">
                  {language === "bn"
                    ? "অনুগ্রহ করে চালিয়ে যেতে প্রথমে একটি ছবি আপলোড করুন।"
                    : "Please add a photo first to continue."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* STEP 2: SHORT SYMPTOM QUESTIONS */}
      {currentStep === 2 && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Reference Mode Shortcut Banner */}
          {analysisMode === "reference" && (
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#b2dbe5] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e8f4f8] text-[#328493] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">menu_book</span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-sm text-[#1c2834]">
                    {language === "bn" ? "রেফারেন্স মেডিকেল ছবি মোড সক্রিয়" : "Reference Medical Atlas Mode Active"}
                  </h4>
                  <p className="text-xs text-[#526373] mt-0.5">
                    {language === "bn"
                      ? "ব্যক্তিগত উপসর্গ ও ইতিহাসের তথ্য রেফারেন্স ছবির জন্য বাধ্যতামূলক নয়। আপনি চাইলে সরাসরি বিশ্লেষণ চালাতে পারেন।"
                      : "Personal symptom scores are not required for educational atlas images. You can run direct pattern inference immediately."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={submitAssessment}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#4da8b9] hover:bg-[#3a96a7] text-white font-headline text-xs font-bold shrink-0 transition-all shadow-xs cursor-pointer active:scale-98"
              >
                {language === "bn" ? "সরাসরি বিশ্লেষণ করুন" : "Analyze Directly"}
              </button>
            </div>
          )}

          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/80 shadow-xs space-y-6">
            {/* 1. Body Location - Interactive Anatomical Selector */}
            <div className="space-y-2.5">
              <BodyMapSelector
                selectedLocation={bodyLocation}
                onSelectLocation={(loc) => setBodyLocation(loc)}
                language={language}
              />
            </div>

            {/* 2. Duration */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <label className="block font-headline font-bold text-sm text-[#1c2834]">
                {language === "bn"
                  ? "২. আপনি এটি কতদিন ধরে লক্ষ্য করছেন?"
                  : "2. How long has this been present?"}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Less than 1 week", days: 4 },
                  { label: "1 to 4 weeks", days: 14 },
                  { label: "1 to 3 months", days: 45 },
                  { label: "Over 3 months", days: 120 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setDurationPreset(item.label);
                      setDurationDays(item.days);
                    }}
                    className={`py-2.5 px-3 rounded-2xl font-headline text-xs font-bold text-center transition-all cursor-pointer ${
                      durationPreset === item.label
                        ? "bg-[#4da8b9] text-white shadow-xs"
                        : "bg-[#f4fafc] hover:bg-[#e8f4f8] text-[#1c2834]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Discomfort / Itch Rating */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="font-headline font-bold text-sm text-[#1c2834]">
                  {language === "bn"
                    ? "৩. চুলকানি বা অস্বস্তি কেমন অনুভব হচ্ছে?"
                    : "3. How does it feel? (Itch or discomfort)"}
                </label>
                <span className="font-headline font-bold text-xs text-[#328493]">
                  {discomfortLevel === 0 && (language === "bn" ? "কোন অস্বস্তি নেই" : "None (0/10)")}
                  {discomfortLevel > 0 && discomfortLevel <= 3 && (language === "bn" ? "সামান্য (১-৩/১০)" : "Mild (1-3/10)")}
                  {discomfortLevel > 3 && discomfortLevel <= 7 && (language === "bn" ? "মাঝারি (৪-৭/১০)" : "Moderate (4-7/10)")}
                  {discomfortLevel > 7 && (language === "bn" ? "তীব্র / ঘুম ব্যাহত (৮-১০/১০)" : "Severe (8-10/10)")}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={discomfortLevel}
                onChange={(e) => setDiscomfortLevel(Number(e.target.value))}
                className="w-full accent-[#4da8b9] cursor-pointer"
                aria-label="Discomfort score from 0 to 10"
              />
              <div className="flex justify-between text-[11px] text-[#526373]">
                <span>{language === "bn" ? "কোনো অস্বস্তি নেই" : "No discomfort"}</span>
                <span>{language === "bn" ? "মাঝারি চুলকানি" : "Moderate itch"}</span>
                <span>{language === "bn" ? "তীব্র অস্বস্তি" : "Very uncomfortable"}</span>
              </div>
            </div>

            {/* 4. Spreading & Oozing */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#f4fafc]">
                <div>
                  <h4 className="font-headline font-bold text-xs text-[#1c2834]">
                    {language === "bn"
                      ? "এটি কি দ্রুত বাড়ছে বা ছড়িয়ে পড়ছে?"
                      : "Is the area spreading or growing quickly?"}
                  </h4>
                  <p className="text-[11px] text-[#526373]">
                    {language === "bn"
                      ? "গত কয়েকদিনে লক্ষণীয় বৃদ্ধি"
                      : "Noticeable increase in size over recent days"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSpreading(false)}
                    className={`px-4 py-1.5 rounded-xl font-headline text-xs font-bold transition-all cursor-pointer ${
                      !isSpreading ? "bg-white text-[#1c2834] shadow-xs" : "text-[#526373]"
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSpreading(true)}
                    className={`px-4 py-1.5 rounded-xl font-headline text-xs font-bold transition-all cursor-pointer ${
                      isSpreading ? "bg-[#4da8b9] text-white shadow-xs" : "text-[#526373]"
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#f4fafc]">
                <div>
                  <h4 className="font-headline font-bold text-xs text-[#1c2834]">
                    {language === "bn"
                      ? "কোনো রক্তপাত, রস পড়া বা খোলা ঘা আছে কি?"
                      : "Any bleeding, oozing, or open sores?"}
                  </h4>
                  <p className="text-[11px] text-[#526373]">
                    {language === "bn"
                      ? "তরল ঝরা বা খোসা ওঠা"
                      : "Fluid weeping or crusting over"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasBleedingOrOozing(false)}
                    className={`px-4 py-1.5 rounded-xl font-headline text-xs font-bold transition-all cursor-pointer ${
                      !hasBleedingOrOozing ? "bg-white text-[#1c2834] shadow-xs" : "text-[#526373]"
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasBleedingOrOozing(true)}
                    className={`px-4 py-1.5 rounded-xl font-headline text-xs font-bold transition-all cursor-pointer ${
                      hasBleedingOrOozing ? "bg-[#4da8b9] text-white shadow-xs" : "text-[#526373]"
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>

            {/* 5. Sensitivities & New Products */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#f4fafc]">
                <div>
                  <h4 className="font-headline font-bold text-xs text-[#1c2834]">
                    {language === "bn"
                      ? "সম্প্রতি কোনো নতুন সাবান, ক্রিম বা রাসায়নিক ব্যবহার করেছেন?"
                      : "Any new soaps, lotions, detergents, or plant contact?"}
                  </h4>
                  <p className="text-[11px] text-[#526373]">
                    {language === "bn"
                      ? "নতুন প্রসাধনী বা অ্যালার্জি হতে পারে এমন স্পর্শ"
                      : "Helps identify common irritation triggers"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasNewExposure(false)}
                    className={`px-4 py-1.5 rounded-xl font-headline text-xs font-bold transition-all cursor-pointer ${
                      !hasNewExposure ? "bg-white text-[#1c2834] shadow-xs" : "text-[#526373]"
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasNewExposure(true)}
                    className={`px-4 py-1.5 rounded-xl font-headline text-xs font-bold transition-all cursor-pointer ${
                      hasNewExposure ? "bg-[#4da8b9] text-white shadow-xs" : "text-[#526373]"
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {hasNewExposure && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={exposureDetails}
                    onChange={(e) => setExposureDetails(e.target.value)}
                    placeholder={
                      language === "bn"
                        ? "যেমন: নতুন সুগন্ধি সাবান, ওয়াশিং পাউডার, মেটাল ঘড়ি..."
                        : "e.g. Scented hand soap, new detergent, outdoor plants, metal jewelry"
                    }
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-[#4da8b9] focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* 6. Cosmetic Skin Type (Midday Feel & Sensitivity) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <h3 className="font-headline font-bold text-sm text-[#1c2834]">
                  {language === "bn" ? "কসমেটিক ত্বকের অনুভূতি ও ধরন" : "Cosmetic Skin Characteristics (Self-Report)"}
                </h3>
                <p className="text-xs text-[#526373]">
                  {language === "bn"
                    ? "এই প্রশ্নগুলো ত্বকের স্বাভাবিক তেল ও আর্দ্রতার মাত্রা বুঝে সঠিক প্রসাধন উপাদান পরামর্শ দিতে সাহায্য করে।"
                    : "Helps classify cosmetic characteristics (oiliness, dryness) to recommend gentle, suitable skincare."}
                </p>
              </div>

              {/* Midday feel */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#1c2834]">
                  {language === "bn" ? "দুপুরের দিকে আপনার মুখের ত্বক কেমন অনুভূত হয়?" : "How does your facial skin typically feel by midday?"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "balanced", label: language === "bn" ? "স্বাভাবিক / আরামদায়ক" : "Balanced" },
                    { id: "oily", label: language === "bn" ? "তৈলাক্ত / চকচকে" : "Oily / Shiny" },
                    { id: "dry", label: language === "bn" ? "শুষ্ক / টানটান" : "Dry / Tight" },
                    { id: "combination", label: language === "bn" ? "মিশ্র (টি-জোন তৈলাক্ত)" : "Combination" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMiddaySkinFeel(item.id)}
                      className={`py-2 px-3 rounded-xl font-headline text-xs font-bold transition-all cursor-pointer ${
                        middaySkinFeel === item.id
                          ? "bg-[#2b7f8f] text-white shadow-xs"
                          : "bg-[#f4fafc] hover:bg-[#e8f4f8] text-[#1c2834]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reactivity */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#1c2834]">
                  {language === "bn" ? "আপনার ত্বক কি নতুন পণ্য ব্যবহারে সহজে লালচে হয় বা জ্বালাপোড়া করে?" : "Does your skin easily sting, redden, or react to new products?"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSkinSensitivity("rarely_reacts")}
                    className={`py-2 px-3 rounded-xl font-headline text-xs font-bold transition-all cursor-pointer ${
                      skinSensitivity === "rarely_reacts"
                        ? "bg-[#2b7f8f] text-white shadow-xs"
                        : "bg-[#f4fafc] hover:bg-[#e8f4f8] text-[#1c2834]"
                    }`}
                  >
                    {language === "bn" ? "না, সহজে রিঅ্যাক্ট করে না (Resilient)" : "Rarely reacts (Resilient)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkinSensitivity("easily_irritated")}
                    className={`py-2 px-3 rounded-xl font-headline text-xs font-bold transition-all cursor-pointer ${
                      skinSensitivity === "easily_irritated"
                        ? "bg-[#2b7f8f] text-white shadow-xs"
                        : "bg-[#f4fafc] hover:bg-[#e8f4f8] text-[#1c2834]"
                    }`}
                  >
                    {language === "bn" ? "হ্যাঁ, সহজে সংবেদনশীল হয় (Sensitive)" : "Yes, easily irritated (Sensitive)"}
                  </button>
                </div>
              </div>
            </div>

            {/* 7. URGENT SAFETY CHECKLIST */}
            <div className="p-5 rounded-3xl bg-rose-50/70 border border-rose-200/80 space-y-3">
              <div className="flex items-center gap-2 text-[#ba1a1a]">
                <span className="material-symbols-outlined text-xl">warning</span>
                <h4 className="font-headline font-bold text-xs uppercase tracking-wide">
                  {language === "bn" ? "জরুরি নিরাপত্তা যাচাই" : "Emergency Safety Check"}
                </h4>
              </div>
              <p className="text-xs text-[#526373] leading-relaxed">
                {language === "bn"
                  ? "আপনার কি নিম্নে বর্ণিত কোনো জরুরি লক্ষণ রয়েছে? উপস্থিত থাকলে টিক দিন:"
                  : "Are you experiencing any of these urgent signs? If checked, urgent medical evaluation will be recommended:"}
              </p>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer text-[#1c2834]">
                  <input
                    type="checkbox"
                    checked={hasBreathingTrouble}
                    onChange={(e) => setHasBreathingTrouble(e.target.checked)}
                    className="rounded text-[#ba1a1a] focus:ring-[#ba1a1a] w-4 h-4"
                  />
                  <span>
                    {language === "bn"
                      ? "শ্বাসকষ্ট, হাঁপ ধরা বা গিলতে সমস্যা"
                      : "Trouble breathing, shortness of breath, or wheezing"}
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-[#1c2834]">
                  <input
                    type="checkbox"
                    checked={hasSwelling}
                    onChange={(e) => setHasSwelling(e.target.checked)}
                    className="rounded text-[#ba1a1a] focus:ring-[#ba1a1a] w-4 h-4"
                  />
                  <span>
                    {language === "bn"
                      ? "মুখ, ঠোঁট, জিহ্বা বা গলা ফুলে যাওয়া"
                      : "Swelling of your lips, face, tongue, or throat"}
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-[#1c2834]">
                  <input
                    type="checkbox"
                    checked={hasFever}
                    onChange={(e) => setHasFever(e.target.checked)}
                    className="rounded text-[#ba1a1a] focus:ring-[#ba1a1a] w-4 h-4"
                  />
                  <span>
                    {language === "bn"
                      ? "জ্বরের সাথে কাঁপুনি বা তাপমাত্রা ১০০.৪°F (৩৮°C) এর বেশি"
                      : "Fever above 100.4°F (38°C) or severe chills"}
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-[#1c2834]">
                  <input
                    type="checkbox"
                    checked={hasBlistering}
                    onChange={(e) => setHasBlistering(e.target.checked)}
                    className="rounded text-[#ba1a1a] focus:ring-[#ba1a1a] w-4 h-4"
                  />
                  <span>
                    {language === "bn"
                      ? "দ্রুত ছড়িয়ে পড়া ফোস্কা বা চামড়া খসে যাওয়া"
                      : "Rapidly spreading blisters or widespread skin peeling"}
                  </span>
                </label>
              </div>
            </div>

            {/* 8. MANDATORY CONSENT & DISCLAIMER CHECKLIST */}
            <div className="p-5 rounded-3xl bg-[#f4fafc] border border-[#d8edf3] space-y-3">
              <div className="flex items-center gap-2 text-[#2b7f8f]">
                <span className="material-symbols-outlined text-xl">verified_user</span>
                <h4 className="font-headline font-bold text-xs uppercase tracking-wide">
                  {t.consentSectionTitle}
                </h4>
              </div>
              <p className="text-xs text-[#526373] leading-relaxed">
                {language === "bn"
                  ? "আপনার গোপনীয়তা ও সুরক্ষার জন্য এগিয়ে যাওয়ার পূর্বে উভয় বিষয়ে সম্মতি নিশ্চিত করুন:"
                  : "Please acknowledge both statements before proceeding to analysis:"}
              </p>

              {consentError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm shrink-0">error</span>
                  <span>{consentError}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer text-[#1c2834]">
                  <input
                    type="checkbox"
                    checked={consentBiometric}
                    onChange={(e) => {
                      setConsentBiometric(e.target.checked);
                      if (e.target.checked && consentDisclaimer) setConsentError(null);
                    }}
                    className="rounded text-[#2b7f8f] focus:ring-[#2b7f8f] w-4 h-4 mt-0.5 shrink-0"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold block text-slate-800">
                      {t.consentBiometricLabel}
                    </span>
                    <span className="text-[#526373] leading-relaxed block text-[11px]">
                      {t.consentBiometricDesc}
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-[#1c2834]">
                  <input
                    type="checkbox"
                    checked={consentDisclaimer}
                    onChange={(e) => {
                      setConsentDisclaimer(e.target.checked);
                      if (e.target.checked && consentBiometric) setConsentError(null);
                    }}
                    className="rounded text-[#2b7f8f] focus:ring-[#2b7f8f] w-4 h-4 mt-0.5 shrink-0"
                  />
                  <div className="space-y-0.5">
                    <span className="font-bold block text-slate-800">
                      {t.consentDisclaimerLabel}
                    </span>
                    <span className="text-[#526373] leading-relaxed block text-[11px]">
                      {t.consentDisclaimerDesc}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Back and Submit Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#e8f4f8] hover:bg-[#d8edf3] text-[#328493] font-headline text-xs font-bold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>{language === "bn" ? "ছবিতে ফিরুন" : "Back to photo"}</span>
              </button>

              <button
                type="button"
                onClick={submitAssessment}
                disabled={isSubmitting || !consentBiometric || !consentDisclaimer}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#4da8b9] hover:bg-[#3a96a7] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-headline text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
              >
                <span>{language === "bn" ? "ফলাফল দেখুন" : "Check My Skin Concern"}</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: LOADING & PROGRESS */}
      {currentStep === 3 && (
        <div className="max-w-xl mx-auto py-12">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-white/80 shadow-xl text-center space-y-6">
            {analysisError ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-[#ba1a1a] mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">error</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg text-[#1c2834]">
                    {language === "bn" ? "যাচাই সম্পন্ন করা যায়নি" : "Unable to complete check"}
                  </h3>
                  <p className="text-xs text-[#526373] mt-1 max-w-sm mx-auto leading-relaxed">
                    {getDisplayErrorMessage(analysisError)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2.5 rounded-2xl bg-[#4da8b9] hover:bg-[#3a96a7] text-white font-headline text-xs font-bold transition-all"
                >
                  {language === "bn" ? "পুনরায় চেষ্টা করুন" : "Try again"}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Calm pulsing icon */}
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-[#4da8b9]/15 animate-ping" />
                  <div className="w-16 h-16 rounded-2xl bg-[#4da8b9] text-white flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-3xl animate-pulse">dermatology</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-headline font-bold text-xl text-[#1c2834]">
                    {language === "bn" ? "তথ্য সাজানো হচ্ছে..." : "Reviewing your skin concern..."}
                  </h3>
                  <p className="text-xs text-[#526373]">
                    {language === "bn"
                      ? "আপনার ছবি এবং লক্ষণগুলোর ভিত্তিতে নির্দেশিকা প্রস্তুত করা হচ্ছে।"
                      : "Checking photo clarity and matching symptom patterns for safe guidance."}
                  </p>
                </div>

                {/* Friendly stages */}
                <div className="space-y-2.5 max-w-sm mx-auto text-left pt-2">
                  <div
                    className={`p-3 rounded-2xl flex items-center justify-between text-xs transition-all ${
                      loadingStage >= 1 ? "bg-[#f4fafc] text-[#1c2834]" : "opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-base text-[#4da8b9]">
                        {loadingStage > 1 ? "check_circle" : "progress_activity"}
                      </span>
                      <span className="font-semibold">
                        {language === "bn" ? "১. ছবির আলো ও স্পষ্টতা যাচাই" : "1. Checking photo clarity"}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-2xl flex items-center justify-between text-xs transition-all ${
                      loadingStage >= 2 ? "bg-[#f4fafc] text-[#1c2834]" : "opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-base text-[#4da8b9]">
                        {loadingStage > 2 ? "check_circle" : "progress_activity"}
                      </span>
                      <span className="font-semibold">
                        {language === "bn" ? "২. লক্ষণ ও সম্ভাব্য উদ্বেগের প্যাটার্ন মিলানো" : "2. Reviewing visible patterns and symptoms"}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-2xl flex items-center justify-between text-xs transition-all ${
                      loadingStage >= 3 ? "bg-[#f4fafc] text-[#1c2834]" : "opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-base text-[#4da8b9]">
                        {loadingStage > 3 ? "check_circle" : "progress_activity"}
                      </span>
                      <span className="font-semibold">
                        {language === "bn" ? "৩. নিরাপত্তা নির্দেশিকা যাচাই" : "3. Checking safety indicators"}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-2xl flex items-center justify-between text-xs transition-all ${
                      loadingStage >= 4 ? "bg-[#f4fafc] text-[#1c2834]" : "opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-base text-[#4da8b9]">
                        {loadingStage >= 4 ? "check_circle" : "progress_activity"}
                      </span>
                      <span className="font-semibold">
                        {language === "bn" ? "৪. সহজ নির্দেশিকা প্রস্তুত হচ্ছে" : "4. Preparing your summary"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
