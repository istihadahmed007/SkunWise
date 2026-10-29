from typing import Dict, Any, List, Optional
from app.models.schemas import (
    SymptomQuestionnaireInput, ConditionMatchModel, TriageResultModel
)
from app.services.vision_engine import SUPPORTED_CONDITIONS

# Source-traceable, conservative health guidance repository
CLINICAL_KNOWLEDGE_BASE = {
    "eczema_contact_dermatitis": {
        "title": "General Care for Dry, Itchy, or Irritated Skin",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://www.aad.org/public/diseases/eczema/types/contact-dermatitis",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "Possible visible concern: Red, irritated, or dry skin patches, often associated with a sensitive skin barrier or reaction to contact with an irritant."
        ),
        "safe_self_care": [
            "Gentle cleansing: Wash with plain lukewarm water or a gentle, fragrance-free, soap-free cleanser. Pat dry gently with a clean towel.",
            "Moisturize frequently: Apply a plain, fragrance-free moisturizing cream or ointment to help protect the skin barrier.",
            "Patch testing & allergy care: If trying a new moisturizer, test a small pea-sized amount on your inner forearm first.",
            "Discontinue if irritated: If any product stings, burns, or worsens redness, rinse it off immediately and discontinue use.",
            "Cool damp cloth: Place a clean, cool, damp cloth over the area for 5 to 10 minutes to help soothe itching."
        ],
        "what_to_avoid": [
            "Do NOT scratch or rub the area, as this damages the skin barrier and increases the risk of infection.",
            "Avoid hot showers, harsh scrubs, scented lotions, and products containing strong fragrances or drying alcohol.",
            "Do NOT apply unprescribed medicated creams without guidance from a doctor."
        ],
        "critical_warning_signs": [
            "Yellow or honey-colored crusting, oozing pus, or swelling (signs of secondary infection).",
            "Redness spreading rapidly or feeling very hot to the touch.",
            "Fever, chills, or generally feeling unwell.",
            "Severe pain or rash that does not improve after 7 to 10 days of gentle care."
        ]
    },
    "benign_melanocytic_macule": {
        "title": "General Guidance for Common Skin Spots & Moles",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://dermnetnz.org/topics/melanocytic-naevus",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "Possible visible concern: A stable, uniform spot or mole with even borders and consistent color."
        ),
        "safe_self_care": [
            "Daily sun protection: Apply broad-spectrum sunscreen (SPF 30 or higher) daily to exposed skin.",
            "Routine self-checks: Check your skin once a month for any new, growing, or changing spots.",
            "Take reference photos: Take a clear photo every few months to help a doctor compare if you ever notice changes.",
            "Discontinue irritating topicals: If friction or clothing irritates the spot, protect it gently with a breathable bandage."
        ],
        "what_to_avoid": [
            "NEVER attempt to scratch, cut, burn, or remove a mole at home with tools, acids, or home remedies.",
            "Avoid tanning beds and sunburns, which increase long-term skin damage.",
            "Do not ignore gradual changes in shape, border, or color."
        ],
        "critical_warning_signs": [
            "A spot that bleeds, oozes, or scabs without being scratched or injured.",
            "A spot that changes noticeably in shape, border asymmetry, color variation, or size.",
            "A spot that feels noticeably itchy, tender, or painful for more than two weeks."
        ]
    },
    "suspicious_dysplastic_lesion": {
        "title": "Guidance on Spots with Irregular Borders or Color",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://www.aad.org/public/diseases/skin-cancer/find/atypical-moles",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "Possible visible concern: A spot showing some uneven shape, varied color, or irregular edges. Photographs cannot confirm what this is; an in-person doctor check is recommended."
        ),
        "safe_self_care": [
            "Schedule a doctor check: Arrange an in-person appointment with a qualified doctor or dermatologist for a physical skin examination.",
            "Protect from sun and friction: Keep the area covered or apply sunscreen; avoid rough clothing friction.",
            "Keep clean and undisturbed: Wash gently with mild soap and water without rubbing or picking."
        ],
        "what_to_avoid": [
            "Do NOT delay an in-person medical evaluation. Automated photo analysis cannot diagnose skin lesions.",
            "Do NOT scratch, pick, or apply harsh chemical solutions to the spot.",
            "Do not rely solely on mobile app feedback for changing or atypical spots."
        ],
        "critical_warning_signs": [
            "Spontaneous bleeding, crusting, or ulceration.",
            "Noticeable growth or elevation change within a few weeks.",
            "New dark spots forming around the perimeter."
        ]
    },
    "psoriasis": {
        "title": "General Care for Thick, Scaly, or Red Patches",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://www.psoriasis.org/about-psoriasis/",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "Possible visible concern: Well-defined red patches with surface scaling. A medical examination is needed for diagnosis and targeted treatment plans."
        ),
        "safe_self_care": [
            "Generous moisturizing: Apply thick, fragrance-free moisturizing ointments or creams right after washing to lock in hydration.",
            "Short lukewarm baths: Bathe in warm (not hot) water for 10 minutes to help soothe tightness; pat dry gently.",
            "Patch test new skincare: Test any new moisturizer on a small patch of skin first; stop using it if stinging or redness develops.",
            "See a healthcare provider: A doctor can evaluate whether prescription treatment is needed."
        ],
        "what_to_avoid": [
            "Do NOT aggressively pick, peel, or scratch scales, which can cause bleeding and worsen the skin barrier.",
            "Avoid harsh soaps, alcohol-based astringents, and abrasive sponges.",
            "Avoid very hot showers or baths that strip natural skin oils."
        ],
        "critical_warning_signs": [
            "Widespread redness spreading across large parts of the body.",
            "Fever, chills, or pus-filled blisters forming.",
            "Joint pain, stiffness, or swelling accompanying skin symptoms."
        ]
    },
    "fungal_tinea": {
        "title": "General Care for Circular or Ring-Shaped Rashes",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://www.cdc.gov/fungal/diseases/ringworm/index.html",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "Possible visible concern: An expanding red, ring-shaped rash with clearer center. An in-person doctor check can confirm the cause and recommend appropriate care."
        ),
        "safe_self_care": [
            "Keep the area clean and dry: Gently wash with mild soap and dry thoroughly with a clean, dry towel.",
            "Use dedicated towels: Use a separate towel for the affected area and wash clothing in warm water to avoid spreading.",
            "Wear breathable clothing: Loose, light cotton fabrics help reduce moisture and heat buildup.",
            "Check with a doctor: Consult a healthcare professional if you suspect a fungal infection for appropriate guidance."
        ],
        "what_to_avoid": [
            "Do NOT apply steroid creams (like hydrocortisone) unless directed by a doctor, as steroids can worsen fungal rashes.",
            "Avoid sharing personal towels, clothing, or grooming items with others.",
            "Avoid tight synthetic garments that trap sweat and moisture."
        ],
        "critical_warning_signs": [
            "Rapid spread of the rash or severe swelling.",
            "Skin becoming hot, tender, or developing red streaks (signs of bacterial infection).",
            "Rash that does not improve after 10 to 14 days."
        ]
    },
    "acne_vulgaris": {
        "title": "General Care for Blemishes, Pimples, or Clogged Pores",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://www.aad.org/public/diseases/acne",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "Possible visible concern: Small red bumps, whiteheads, or blackheads associated with excess oil and blocked pores."
        ),
        "safe_self_care": [
            "Gentle daily washing: Wash twice daily with a mild, non-soap facial cleanser and lukewarm water.",
            "Light, non-comedogenic hydration: Use an oil-free, fragrance-free moisturizer that won't clog pores.",
            "Daily sun protection: Protect skin with an oil-free, non-greasy sunscreen (SPF 30+).",
            "Patch test new products: Test new skincare on a small area first; stop immediately if burning or rash develops.",
            "Consult a clinician: If blemishes are deep, painful, or causing scarring, visit a healthcare provider for personalized treatment."
        ],
        "what_to_avoid": [
            "Do NOT squeeze, pick, or pop blemishes, which pushes inflammation deeper and causes scarring.",
            "Avoid abrasive scrubs, stiff brushes, and astringents that dry out and irritate the skin.",
            "Avoid heavy, greasy oils and hair products that can transfer to skin and clog pores."
        ],
        "critical_warning_signs": [
            "Deep, painful, hard lumps or cysts under the skin.",
            "Severe facial swelling or fever accompanying skin breakout.",
            "Significant emotional distress or scarring from skin breakouts."
        ]
    }
}


class RecommendationEngine:
    """
    Multimodal Evidence Integration & Plain-Language Recommendation Generator.
    Correlates image observations with reported symptoms honestly without clinical certainty claims.
    """

    @classmethod
    def synthesize_multimodal_evidence(
        cls,
        symptoms: SymptomQuestionnaireInput,
        visual_findings: Dict[str, Any]
    ) -> List[ConditionMatchModel]:
        """
        Integrates visual observation with user symptoms into non-diagnostic 'possible visible concerns'.
        """
        probs = visual_findings.get("calibrated_probabilities", {})
        morphology = visual_findings.get("morphological_features", {})
        asym = morphology.get("asymmetry_score", 0.0)
        border = morphology.get("border_irregularity", 0.0)

        matches: List[ConditionMatchModel] = []

        # 1. Eczema / Contact Irritation
        eczema_prob = probs.get("eczema_contact_dermatitis", 0.15)
        if symptoms.prior_chemical_exposure:
            eczema_prob += 0.25
        if symptoms.itch_score >= 6:
            eczema_prob += 0.15

        # 2. Dysplasia / Atypical Lesion
        dysplasia_prob = probs.get("suspicious_dysplastic_lesion", 0.10)
        if symptoms.bleeding_or_crusting:
            dysplasia_prob += 0.20
        if symptoms.is_spreading and symptoms.duration_days > 30:
            dysplasia_prob += 0.15

        # 3. Common Mole / Macule
        benign_prob = probs.get("benign_melanocytic_macule", 0.15)
        if asym < 0.15 and border < 0.20 and symptoms.itch_score == 0 and not symptoms.is_spreading:
            benign_prob += 0.25

        # 4. Scaly Plaque / Psoriasis pattern
        psoriasis_prob = probs.get("psoriasis", 0.10)
        if "psoriasis" in (symptoms.personal_skin_history or "").lower():
            psoriasis_prob += 0.30

        # 5. Ring-shaped / Fungal pattern
        fungal_prob = probs.get("fungal_tinea", 0.10)
        if border > 0.25 and symptoms.itch_score >= 4 and not symptoms.prior_chemical_exposure:
            fungal_prob += 0.15

        # 6. Acne / Blemishes
        acne_prob = probs.get("acne_vulgaris", 0.10)
        if "face" in symptoms.anatomical_region.lower() or "chest" in symptoms.anatomical_region.lower():
            acne_prob += 0.20

        weighted = [
            ("eczema_contact_dermatitis", eczema_prob),
            ("suspicious_dysplastic_lesion", dysplasia_prob),
            ("benign_melanocytic_macule", benign_prob),
            ("psoriasis", psoriasis_prob),
            ("fungal_tinea", fungal_prob),
            ("acne_vulgaris", acne_prob),
        ]
        weighted.sort(key=lambda x: x[1], reverse=True)

        for rank, (cond_key, _) in enumerate(weighted[:3]):
            kb_data = CLINICAL_KNOWLEDGE_BASE.get(cond_key, {})
            cond_meta = SUPPORTED_CONDITIONS.get(cond_key, {})

            concordance = "Primary pattern consideration" if rank == 0 else "Other possible consideration"

            if cond_key == "eczema_contact_dermatitis":
                visual_overlap = "Visible redness, dry texture, or surface irritation"
                history_corr = f"Reported itch: {symptoms.itch_score}/10"
            elif cond_key == "benign_melanocytic_macule":
                visual_overlap = "Even border outline and consistent pigment"
                history_corr = f"Reported stable duration of ~{symptoms.duration_days} days"
            elif cond_key == "suspicious_dysplastic_lesion":
                visual_overlap = "Uneven contour or varied coloring observed in image"
                history_corr = "Requires an in-person physical examination by a doctor"
            elif cond_key == "psoriasis":
                visual_overlap = "Distinct reddish skin area with surface scaling"
                history_corr = f"Reported duration of {symptoms.duration_days} days"
            elif cond_key == "fungal_tinea":
                visual_overlap = "Curved or circular reddish margin observed"
                history_corr = "Gradual spread reported by user"
            else:
                visual_overlap = "Small localized bumps or blemishes"
                history_corr = "Location consistent with oil-producing skin areas"

            matches.append(ConditionMatchModel(
                condition_id=cond_key,
                name=cond_meta.get("name", kb_data.get("title", cond_key)),
                category=cond_meta.get("category", "Visible Skin Pattern"),
                concordance_tier=concordance,
                visual_overlap=visual_overlap,
                clinical_history_correlation=history_corr,
                summary=kb_data.get("clinical_summary", ""),
                publisher_source=kb_data.get("publisher", "Dermatology Educational Guidance"),
                source_url=kb_data.get("reference_url", "https://www.aad.org")
            ))

        return matches

    @classmethod
    def generate_clinical_assessment(
        cls,
        symptoms: SymptomQuestionnaireInput,
        visual_findings: Dict[str, Any],
        triage_pathway: Dict[str, Any],
        is_quality_acceptable: bool
    ) -> TriageResultModel:
        """
        Assembles clean, conservative decision support in plain language.
        """
        diagnostic_gaps = [
            "Photos have limitations: A 2D photo cannot feel the skin texture, thickness, or temperature.",
            "Doctor visit needed for diagnosis: Only a qualified healthcare provider can perform an in-person examination and provide a medical diagnosis.",
            "Informational guidance only: This tool does not provide medical treatment, prescriptions, or laboratory tests."
        ]

        if not is_quality_acceptable:
            diagnostic_gaps.insert(0, "Photo quality notice: The photo was slightly blurry or had uneven lighting, which limits how well visible features can be compared.")

        uncertainty = visual_findings.get("uncertainty_metrics", {})
        is_inconclusive = (not is_quality_acceptable) or uncertainty.get("is_out_of_distribution", False)
        inconclusive_reason = None
        if not is_quality_acceptable:
            inconclusive_reason = "The photo was unclear or lighting was insufficient. Please retake the photo in natural light or see a doctor."
        elif uncertainty.get("is_out_of_distribution", False):
            inconclusive_reason = "The visible features did not clearly match known reference patterns. An in-person doctor check is recommended."

        possible_conditions = cls.synthesize_multimodal_evidence(symptoms, visual_findings)
        primary_match_key = possible_conditions[0].condition_id if possible_conditions else "eczema_contact_dermatitis"

        primary_kb = CLINICAL_KNOWLEDGE_BASE.get(primary_match_key, CLINICAL_KNOWLEDGE_BASE["eczema_contact_dermatitis"])

        citations = []
        for cond in possible_conditions:
            kb = CLINICAL_KNOWLEDGE_BASE.get(cond.condition_id)
            if kb:
                citations.append({
                    "title": kb["title"],
                    "publisher": kb["publisher"],
                    "url": kb["reference_url"],
                    "last_reviewed": kb["last_reviewed"],
                    "status": kb["approval_status"]
                })

        return TriageResultModel(
            triage_tier=triage_pathway["triage_tier"],
            triage_name=triage_pathway["triage_name"],
            recommended_timeline=triage_pathway["recommended_timeline"],
            urgency_badge_color=triage_pathway["urgency_badge_color"],
            primary_condition=possible_conditions[0].name if possible_conditions else "Visible Skin Concern",
            rationale=triage_pathway["rationale"],
            emergency_warning_detected=triage_pathway.get("emergency_warning_detected", False),
            emergency_warning_items=triage_pathway.get("emergency_warning_items", []),
            is_inconclusive=is_inconclusive,
            inconclusive_reason=inconclusive_reason,
            possible_conditions=possible_conditions,
            safe_self_care=primary_kb.get("safe_self_care", []),
            what_to_avoid=primary_kb.get("what_to_avoid", []),
            critical_warning_signs=primary_kb.get("critical_warning_signs", []),
            diagnostic_gaps=diagnostic_gaps,
            citations=citations
        )

recommendation_engine = RecommendationEngine()
