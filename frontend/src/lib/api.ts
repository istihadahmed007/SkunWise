const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export interface User {
  id: number;
  email: string;
  full_name: string;
  zero_cloud_retention: boolean;
  data_retention_days: number;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  email: string;
  full_name: string;
  zero_cloud_retention: boolean;
}

export interface QualityMetrics {
  is_acceptable: boolean;
  sharpness_score: number;
  sharpness_status: string;
  ambient_lux: number;
  lighting_status: string;
  glare_ratio: number;
  glare_status: string;
  framing_status: string;
  overall_usability_score: number;
  quality_notes: string[];
}

export interface ConditionMatch {
  condition_id: string;
  name: string;
  category: string;
  concordance_tier: string;
  visual_overlap: string;
  clinical_history_correlation: string;
  summary: string;
  publisher_source: string;
  source_url: string;
}

export interface TriageResult {
  triage_tier: number;
  triage_name: string;
  recommended_timeline: string;
  urgency_badge_color: "emerald" | "amber" | "crimson" | string;
  primary_condition: string;
  rationale: string;
  emergency_warning_detected: boolean;
  emergency_warning_items: string[];
  is_inconclusive: boolean;
  inconclusive_reason?: string | null;
  possible_conditions: ConditionMatch[];
  safe_self_care: string[];
  what_to_avoid: string[];
  critical_warning_signs: string[];
  diagnostic_gaps: string[];
  citations: Array<{
    title: string;
    publisher: string;
    url: string;
    last_reviewed: string;
    status: string;
  }>;
}

export interface Assessment {
  id: number;
  session_code: string;
  user_id: number;
  anatomical_region: string;
  created_at: string;
  image_url: string;
  quality_metrics: QualityMetrics;
  symptom_data: Record<string, any>;
  triage: TriageResult;
  is_archived: boolean;
}

export interface AssessmentSummary {
  id: number;
  session_code: string;
  anatomical_region: string;
  created_at: string;
  image_url: string;
  triage_tier: number;
  triage_title: string;
  primary_condition: string;
  is_archived: boolean;
  is_inconclusive: boolean;
  urgency_badge_color: string;
}

export interface SymptomInput {
  anatomical_region: string;
  duration_days: number;
  itch_score: number;
  pain_score: number;
  is_spreading: boolean;
  bleeding_or_crusting: boolean;
  prior_chemical_exposure: boolean;
  exposure_details?: string;
  personal_skin_history?: string;
  has_fever_or_chills: boolean;
  has_facial_or_throat_swelling: boolean;
  has_breathing_difficulty: boolean;
  has_rapid_blistering_or_peeling: boolean;
  has_petechiae_or_purpura: boolean;
}

function getAuthHeader(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("skinwise_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  async register(data: {
    email: string;
    password: string;
    full_name: string;
    consent_biometric: boolean;
    consent_disclaimer: boolean;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(err.detail || "Registration failed");
    }
    return res.json();
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Login failed");
    }
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error("Failed to load user profile");
    }
    return res.json();
  },

  async updateSettings(settings: {
    full_name?: string;
    zero_cloud_retention?: boolean;
    data_retention_days?: number;
  }): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      throw new Error("Failed to update settings");
    }
    return res.json();
  },

  async deleteAccount(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/account`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error("Failed to purge account data");
    }
    return res.json();
  },

  async analyzeSkin(
    imageFile: File | Blob,
    symptoms: SymptomInput,
    anatomicalRegion: string = "Volar Forearm"
  ): Promise<Assessment> {
    const formData = new FormData();
    formData.append("file", imageFile, "skin_intake.jpg");
    formData.append("symptoms_json", JSON.stringify(symptoms));
    formData.append("anatomical_region", anatomicalRegion);

    const res = await fetch(`${API_BASE_URL}/skin/analyze`, {
      method: "POST",
      headers: getAuthHeader(),
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Skin analysis failed" }));
      throw new Error(err.detail || "Skin analysis failed");
    }
    return res.json();
  },

  async getAssessment(id: number | string): Promise<Assessment> {
    const res = await fetch(`${API_BASE_URL}/skin/assessment/${id}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error("Failed to load assessment report");
    }
    return res.json();
  },

  async getAssessmentHistory(): Promise<AssessmentSummary[]> {
    const res = await fetch(`${API_BASE_URL}/skin/assessment-history`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error("Failed to load assessment history");
    }
    return res.json();
  },

  async deleteAssessment(id: number | string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/skin/assessment/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!res.ok) {
      throw new Error("Failed to delete assessment");
    }
  },

  getPdfUrl(id: number | string): string {
    return `${API_BASE_URL}/skin/assessment/${id}/pdf`;
  },

  getImageUrl(filename: string): string {
    if (filename.startsWith("http")) return filename;
    return `${API_BASE_URL}/skin/images/${filename}`;
  },

  async getHealth() {
    const res = await fetch(`${API_BASE_URL}/health`);
    return res.json();
  },
};

