from typing import Dict, Any, List, Tuple
from app.models.schemas import SymptomQuestionnaireInput

class SafetyTriageService:
    """
    Independent safety and triage engine.
    Applies auditable safety rules based on symptom severity and warning signs.
    Emergency danger signs strictly take precedence over any image observation.
    """

    @staticmethod
    def evaluate_emergency_red_flags(symptoms: SymptomQuestionnaireInput) -> Tuple[bool, List[str]]:
        """
        Evaluates immediate systemic red flags.
        Returns (is_emergency, list_of_detected_danger_signs).
        """
        danger_signs = []

        if symptoms.has_breathing_difficulty:
            danger_signs.append("Shortness of breath or trouble breathing (respiratory distress)")

        if symptoms.has_facial_or_throat_swelling:
            danger_signs.append("Swelling of the lips, tongue, face, or throat")

        if symptoms.has_rapid_blistering_or_peeling:
            danger_signs.append("Widespread blistering or skin peeling rapidly")

        if symptoms.has_petechiae_or_purpura:
            danger_signs.append("Dark purple or red spots that do not fade under pressure, especially with fever")

        if symptoms.has_fever_or_chills and symptoms.is_spreading:
            danger_signs.append("A rash that is rapidly spreading across the skin along with a fever")

        if symptoms.pain_score >= 8 and symptoms.is_spreading:
            danger_signs.append("Severe, intense skin pain that is worsening rapidly")

        is_emergency = len(danger_signs) > 0
        return is_emergency, danger_signs

    @classmethod
    def determine_care_pathway(
        cls,
        symptoms: SymptomQuestionnaireInput,
        visual_findings: Dict[str, Any],
        is_quality_acceptable: bool
    ) -> Dict[str, Any]:
        """
        Determines the appropriate care pathway:
        Tier 3: Urgent or emergency medical attention needed immediately
        Tier 2: In-person doctor consultation recommended
        Tier 1: Mild / General self-care may help with routine observation
        """
        # 1. Immediate Emergency Red-Flag Check (Precedence Rule)
        is_emergency, emergency_items = cls.evaluate_emergency_red_flags(symptoms)

        if is_emergency:
            return {
                "triage_tier": 3,
                "triage_name": "Urgent Care Needed",
                "recommended_timeline": "Seek Immediate Emergency Care",
                "urgency_badge_color": "crimson",
                "emergency_warning_detected": True,
                "emergency_warning_items": emergency_items,
                "rationale": (
                    "Important safety notice: One or more serious warning signs were reported. "
                    "Photo analysis cannot help in an emergency. Please seek urgent medical evaluation at an emergency department or call your local emergency number (such as 911, 112, or 999) right away."
                )
            }

        # 2. Quality or Inconclusive Check
        if not is_quality_acceptable:
            return {
                "triage_tier": 2,
                "triage_name": "Doctor Check Recommended",
                "recommended_timeline": "Within 1 to 2 Weeks",
                "urgency_badge_color": "amber",
                "emergency_warning_detected": False,
                "emergency_warning_items": [],
                "rationale": (
                    "Optical viability criteria were not fully satisfied (unclear focus, blur, or suboptimal lighting). "
                    "SkinWise AI will not offer false reassurance on low-fidelity imagery. "
                    "Please retake the photo in natural light or consult a doctor for an in-person check."
                )
            }

        # 3. Check for Visual Irregularity / Atypical spot (Only when visual inference is valid)
        inference_status = visual_findings.get("inference_status", "inconclusive")
        is_visual_successful = (inference_status == "successful") and not visual_findings.get("is_inconclusive", False)

        is_dysplastic_concern = False
        if is_visual_successful:
            calibrated_probs = visual_findings.get("observed_pattern_scores") or visual_findings.get("calibrated_probabilities", {})
            morphology = visual_findings.get("morphological_features", {})
            dysplasia_prob = calibrated_probs.get("suspicious_dysplastic_lesion", 0.0)
            asymmetry = morphology.get("asymmetry_score", 0.0)
            border_irreg = morphology.get("border_irregularity", 0.0)
            is_dysplastic_concern = (dysplasia_prob >= 0.25) or (asymmetry > 0.28) or (border_irreg > 0.35)
        else:
            morphology = visual_findings.get("morphological_features", {})
            asymmetry = morphology.get("asymmetry_score", 0.0)
            border_irreg = morphology.get("border_irregularity", 0.0)
            if visual_findings.get("skin_detection", {}).get("skin_detected", False) and (asymmetry > 0.35 and border_irreg > 0.40):
                is_dysplastic_concern = True

        # 4. Check for persistent, spreading, or distressing symptoms
        is_chronic_or_expanding = symptoms.duration_days > 14 or symptoms.is_spreading
        is_high_symptom_load = symptoms.itch_score >= 6 or symptoms.pain_score >= 5 or symptoms.bleeding_or_crusting

        if is_dysplastic_concern:
            return {
                "triage_tier": 2,
                "triage_name": "Doctor Check Recommended",
                "recommended_timeline": "Within 1 to 2 Weeks",
                "urgency_badge_color": "amber",
                "emergency_warning_detected": False,
                "emergency_warning_items": [],
                "rationale": (
                    "Visual observation noted an atypical or irregular spot contour. "
                    "Photographs taken with a phone cannot determine whether a spot is concerning. "
                    "An in-person check by a doctor or dermatologist is recommended."
                )
            }

        if is_chronic_or_expanding or is_high_symptom_load:
            return {
                "triage_tier": 2,
                "triage_name": "Doctor Check Recommended",
                "recommended_timeline": "Within 1 to 2 Weeks",
                "urgency_badge_color": "amber",
                "emergency_warning_detected": False,
                "emergency_warning_items": [],
                "rationale": (
                    f"Based on your reported symptoms: Duration of {symptoms.duration_days} days or noticeable discomfort "
                    f"(Itch: {symptoms.itch_score}/10, Pain: {symptoms.pain_score}/10). "
                    "An in-person examination by a healthcare professional is recommended to identify the cause and advise on safe relief."
                )
            }

        # 5. Tier 1: Mild / Low-Acuity Presentation
        if is_visual_successful:
            tier1_rationale = (
                "Based on reported symptoms and image observation, the skin concern appears mild and stable with no red flags reported. "
                "Gentle cleansing and fragrance-free moisturizing are generally appropriate. "
                "If it does not improve within 1 to 2 weeks, or begins to spread, itch more, or hurt, please consult a doctor."
            )
        else:
            tier1_rationale = (
                "Based on your questionnaire responses, no emergency warning signs or high symptom burdens were reported. "
                "Because photographic pattern matching was inconclusive, monitor the area closely and practice gentle skin barrier care. "
                "If discomfort worsens, redness spreads, or the area does not improve, schedule an in-person doctor check."
            )

        return {
            "triage_tier": 1,
            "triage_name": "General Self-Care May Help",
            "recommended_timeline": "Routine Observation",
            "urgency_badge_color": "emerald",
            "emergency_warning_detected": False,
            "emergency_warning_items": [],
            "rationale": tier1_rationale
        }

triage_service = SafetyTriageService()
