from typing import Dict, Any, List, Tuple
from app.models.schemas import SymptomQuestionnaireInput

class SafetyTriageService:
    """
    Independent clinical safety and triage engine.
    Applies auditable clinician-reviewed rules independent of visual ML inference.
    Emergency danger signs strictly take precedence over reassuring image patterns.
    """

    @staticmethod
    def evaluate_emergency_red_flags(symptoms: SymptomQuestionnaireInput) -> Tuple[bool, List[str]]:
        """
        Evaluates immediate systemic red flags.
        Returns (is_emergency, list_of_detected_danger_signs).
        """
        danger_signs = []

        if symptoms.has_breathing_difficulty:
            danger_signs.append("Shortness of breath or respiratory distress (Potential anaphylaxis/systemic crisis)")

        if symptoms.has_facial_or_throat_swelling:
            danger_signs.append("Facial, lip, or throat edema (Immediate airway compromise risk)")

        if symptoms.has_rapid_blistering_or_peeling:
            danger_signs.append("Rapidly spreading blistering or epidermal skin peeling (Stevens-Johnson Syndrome / TEN risk)")

        if symptoms.has_petechiae_or_purpura:
            danger_signs.append("Dark purple non-blanching petechial spots with fever (Meningococcal/Sepsis indicator)")

        if symptoms.has_fever_or_chills and symptoms.is_spreading:
            danger_signs.append("Spreading cutaneous rash accompanied by systemic fever > 100.4°F (Invasive infection risk)")

        if symptoms.pain_score >= 8 and symptoms.is_spreading:
            danger_signs.append("Severe uncalibrated pain disproportionate to visual appearance with progressive spread")

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
        Determines the clinical triage care pathway:
        Tier 3: Urgent or emergency assessment (immediate care, local ER/911/112/999)
        Tier 2: Medical assessment recommended (doctor visit within 1-2 weeks)
        Tier 1: Mild / General self-care (conservative monitoring)
        """
        # 1. Immediate Emergency Red-Flag Check (Precedence Rule)
        is_emergency, emergency_items = cls.evaluate_emergency_red_flags(symptoms)
        
        if is_emergency:
            return {
                "triage_tier": 3,
                "triage_name": "Urgent Care / Emergency Protocol",
                "recommended_timeline": "Immediate / Emergency Admission",
                "urgency_badge_color": "crimson",
                "emergency_warning_detected": True,
                "emergency_warning_items": emergency_items,
                "rationale": (
                    "CRITICAL CLINICAL ESCALATION: One or more life-threatening systemic warning signs "
                    "were reported. Visual dermatological analysis is deferred. Seek emergency medical evaluation immediately."
                )
            }

        # 2. Quality or Inconclusive Check
        if not is_quality_acceptable:
            return {
                "triage_tier": 2,
                "triage_name": "Medical Assessment Recommended",
                "recommended_timeline": "1–2 Weeks or Re-take Photo",
                "urgency_badge_color": "amber",
                "emergency_warning_detected": False,
                "emergency_warning_items": [],
                "rationale": (
                    "Optical viability criteria were not fully satisfied (poor focus, blur, or suboptimal lighting). "
                    "SkinWise AI will not offer false reassurance on low-fidelity imagery. Consult a physician for an in-person skin check."
                )
            }

        # 3. Check for Visual Dysplasia / Malignancy Risk (ABCDE Rules)
        calibrated_probs = visual_findings.get("calibrated_probabilities", {})
        morphology = visual_findings.get("morphological_features", {})
        dysplasia_prob = calibrated_probs.get("suspicious_dysplastic_lesion", 0.0)
        asymmetry = morphology.get("asymmetry_score", 0.0)
        border_irreg = morphology.get("border_irregularity", 0.0)

        is_dysplastic_concern = (dysplasia_prob >= 0.25) or (asymmetry > 0.28) or (border_irreg > 0.35)

        # 4. Check for High-Acuity or Chronic Symptom Factors
        is_chronic_or_expanding = symptoms.duration_days > 14 or symptoms.is_spreading
        is_high_symptom_load = symptoms.itch_score >= 6 or symptoms.pain_score >= 5 or symptoms.bleeding_or_crusting

        if is_dysplastic_concern:
            return {
                "triage_tier": 2,
                "triage_name": "Medical Assessment Recommended",
                "recommended_timeline": "1–2 Weeks",
                "urgency_badge_color": "amber",
                "emergency_warning_detected": False,
                "emergency_warning_items": [],
                "rationale": (
                    "Dermatoscopic criteria demonstrate asymmetrical pigmentation or irregular margins (ABCDE screening criteria). "
                    "Professional dermoscopy and physical palpation by a board-certified dermatologist are required to exclude atypical dysplasia."
                )
            }

        if is_chronic_or_expanding or is_high_symptom_load:
            return {
                "triage_tier": 2,
                "triage_name": "Medical Assessment Recommended",
                "recommended_timeline": "1–2 Weeks",
                "urgency_badge_color": "amber",
                "emergency_warning_detected": False,
                "emergency_warning_items": [],
                "rationale": (
                    f"Cutaneous presentation demonstrates moderate-to-high symptomatic burden "
                    f"(Itch: {symptoms.itch_score}/10, Pain: {symptoms.pain_score}/10, Duration: {symptoms.duration_days} days). "
                    "In-person examination is advised to prescribe targeted therapy and avoid barrier deterioration."
                )
            }

        # 5. Tier 1: Validated Mild / Low-Acuity Presentation
        return {
            "triage_tier": 1,
            "triage_name": "Mild / General Self-Care",
            "recommended_timeline": "Routine Observation (30–90 Days)",
            "urgency_badge_color": "emerald",
            "emergency_warning_detected": False,
            "emergency_warning_items": [],
            "rationale": (
                "Presentation demonstrates mild, non-expanding characteristics with low symptomatic distress and symmetric morphology. "
                "Conservative non-pharmacological care and routine monitoring are appropriate. Consult a clinician if symptoms evolve."
            )
        }

triage_service = SafetyTriageService()

