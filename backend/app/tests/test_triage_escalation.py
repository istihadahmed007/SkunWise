from app.models.schemas import SymptomQuestionnaireInput
from app.services.triage_service import triage_service

def test_emergency_override_takes_precedence_over_benign_visual():
    """
    Critical Clinical Safety Rule:
    Even when image features appear benign, systemic red flags MUST trigger Tier 3 Urgent Care!
    """
    # Patient reports facial swelling and shortness of breath with a rash
    symptoms = SymptomQuestionnaireInput(
        anatomical_region="Face / Neck",
        duration_days=1,
        itch_score=8,
        pain_score=4,
        is_spreading=True,
        has_facial_or_throat_swelling=True,
        has_breathing_difficulty=True,
        consent_biometric=True,
        consent_disclaimer=True
    )
    
    # Fake reassuring visual output
    benign_visual = {
        "calibrated_probabilities": {"benign_melanocytic_macule": 0.95},
        "morphological_features": {"asymmetry_score": 0.05, "border_irregularity": 0.05}
    }
    
    pathway = triage_service.determine_care_pathway(
        symptoms=symptoms,
        visual_findings=benign_visual,
        is_quality_acceptable=True
    )
    
    assert pathway["triage_tier"] == 3
    assert pathway["urgency_badge_color"] == "crimson"
    assert pathway["emergency_warning_detected"] is True
    assert len(pathway["emergency_warning_items"]) >= 2
    assert "Shortness of breath" in pathway["emergency_warning_items"][0]


def test_fever_and_spreading_escalation():
    """Spreading cutaneous erythema with systemic fever triggers Tier 3."""
    symptoms = SymptomQuestionnaireInput(
        anatomical_region="Leg",
        duration_days=2,
        itch_score=2,
        pain_score=7,
        is_spreading=True,
        has_fever_or_chills=True,
        consent_biometric=True,
        consent_disclaimer=True
    )
    
    pathway = triage_service.determine_care_pathway(
        symptoms=symptoms,
        visual_findings={},
        is_quality_acceptable=True
    )
    
    assert pathway["triage_tier"] == 3
    assert pathway["emergency_warning_detected"] is True


def test_quality_rejection_routes_to_doctor_recommendation():
    """Inconclusive or poor quality images must not give false reassurance."""
    symptoms = SymptomQuestionnaireInput(
        duration_days=3,
        itch_score=1,
        consent_biometric=True,
        consent_disclaimer=True
    )
    
    pathway = triage_service.determine_care_pathway(
        symptoms=symptoms,
        visual_findings={},
        is_quality_acceptable=False  # Quality gate failed
    )
    
    assert pathway["triage_tier"] == 2
    assert "amber" in pathway["urgency_badge_color"]
    assert "Optical viability" in pathway["rationale"]


def test_mild_presentation_routes_to_tier_1():
    """Low symptom burden, non-spreading, low itch routes to Tier 1 Self-Care."""
    symptoms = SymptomQuestionnaireInput(
        duration_days=4,
        itch_score=2,
        pain_score=0,
        is_spreading=False,
        bleeding_or_crusting=False,
        consent_biometric=True,
        consent_disclaimer=True
    )
    
    mild_visual = {
        "calibrated_probabilities": {"benign_melanocytic_macule": 0.70, "suspicious_dysplastic_lesion": 0.05},
        "morphological_features": {"asymmetry_score": 0.08, "border_irregularity": 0.10}
    }
    
    pathway = triage_service.determine_care_pathway(
        symptoms=symptoms,
        visual_findings=mild_visual,
        is_quality_acceptable=True
    )
    
    assert pathway["triage_tier"] == 1
    assert pathway["urgency_badge_color"] == "emerald"
    assert "Self-Care" in pathway["triage_name"]

