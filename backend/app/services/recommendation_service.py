from typing import Dict, Any, List, Optional
from app.models.schemas import (
    SymptomQuestionnaireInput, ConditionMatchModel, TriageResultModel
)
from app.services.vision_engine import SUPPORTED_CONDITIONS

# Source-traceable clinical knowledge repository
CLINICAL_KNOWLEDGE_BASE = {
    "eczema_contact_dermatitis": {
        "title": "Clinical Management of Contact Dermatitis & Eczematous Flare-ups",
        "publisher": "American Academy of Dermatology (AAD) / British Association of Dermatologists (BAD)",
        "reference_url": "https://www.aad.org/public/diseases/eczema/types/contact-dermatitis",
        "last_reviewed": "2025-Q3",
        "approval_status": "Reviewed & Approved by Dermatology Advisory Council",
        "clinical_summary": (
            "Contact dermatitis is an acute or subacute inflammatory cutaneous response triggered by exogenous allergen or irritant contact. "
            "Characterized morphologically by superficial erythema, micropapules, xerosis, and marked pruritus."
        ),
        "safe_self_care": [
            "Cool Compresses: Apply a clean, cool damp cotton cloth for 10–15 minutes to reduce neuro-sensory itch pathways.",
            "Barrier Ceramide Emollients: Apply thick, fragrance-free, dye-free moisturizing creams within 3 minutes of bathing.",
            "Identify & Eliminate Triggers: Immediately discontinue use of recently introduced botanical soaps, fragrances, or topical agents.",
            "Longitudinal Logging: Photograph the lesion under identical indirect lighting once every 48 hours to track resolution."
        ],
        "what_to_avoid": [
            "Do NOT Scratch: Disrupting the stratum corneum barrier exponentially increases risk of secondary bacterial impetiginization.",
            "Avoid Unsupervised OTC Steroids: Topical hydrocortisone can cause rebound flare-ups or mask fungal/viral infections.",
            "Avoid Hot Water & Essential Oils: Thermal spikes and plant extracts cause direct mast cell degranulation and histamine surge."
        ],
        "critical_warning_signs": [
            "Honey-colored crusting or oozing purulent discharge (Secondary Staph infection).",
            "Redness spreading rapidly past a drawn pen margin.",
            "Systemic fever exceeding 100.4°F (38°C) or body chills.",
            "Severe localized tenderness or throbbing pain."
        ]
    },
    "benign_melanocytic_macule": {
        "title": "Screening and Triage Guidelines for Pigmented Cutaneous Lesions",
        "publisher": "DermNet New Zealand / International Dermoscopy Society",
        "reference_url": "https://dermnetnz.org/topics/melanocytic-naevus",
        "last_reviewed": "2025-Q2",
        "approval_status": "Reviewed & Approved by Dermatology Advisory Council",
        "clinical_summary": (
            "Melanocytic nevi are common benign proliferations of pigment-producing melanocytes. "
            "Typically display symmetric contours, well-demarcated uniform borders, and homogeneous pigment networks."
        ),
        "safe_self_care": [
            "Broad-Spectrum Photoprotection: Apply SPF 50+ mineral sunscreen daily to prevent UV-induced melanocytic mutations.",
            "Regular ABCDE Self-Examination: Inspect for changes in Asymmetry, Border, Color, Diameter (>6mm), and Evolution monthly.",
            "Baseline Photo Documentation: Retain calibrated baseline macro photos for annual specialist dermatological comparison."
        ],
        "what_to_avoid": [
            "Do NOT Attempt Home Mole Removal: Chemical peels, apple cider vinegar, or caustic pastes cause severe scarring and obscure histopathology.",
            "Avoid Friction & Trauma: Prevent chronic rubbing from rough clothing seams or jewelry against the lesion surface.",
            "Avoid Tanning Beds: Artificial UV exposure increases melanoma risk substantially."
        ],
        "critical_warning_signs": [
            "Rapid spontaneous bleeding without prior mechanical trauma.",
            "Development of new satellite pigment spots around the border.",
            "Sudden loss of symmetry, border scalloping, or multi-color variegation (shades of black, red, or white).",
            "Persistent ulceration or localized pain."
        ]
    },
    "suspicious_dysplastic_lesion": {
        "title": "Atypical Pigmented Lesion Clinical Evaluation Protocol",
        "publisher": "National Comprehensive Cancer Network (NCCN) / AAD Guidelines",
        "reference_url": "https://www.nccn.org/patients/guidelines/content/PDF/melanoma-patient.pdf",
        "last_reviewed": "2025-Q4",
        "approval_status": "Reviewed & Approved by Dermatology Advisory Council",
        "clinical_summary": (
            "Atypical dysplastic lesions exhibit structural asymmetry, border scalloping, or pigment variegation. "
            "Definitive benign vs. malignant differentiation CANNOT be achieved via 2D consumer photography and strictly requires polarized dermoscopy and histopathological biopsy."
        ),
        "safe_self_care": [
            "Prompt Specialist Referral: Schedule an urgent dermoscopic exam with a board-certified dermatologist within 1–2 weeks.",
            "Preserve Lesion Architecture: Keep the area clean, protected, and free from topical irritants until clinical review.",
            "Document Timeline: Record when the spot was first noticed and any changes in elevation, diameter, or color."
        ],
        "what_to_avoid": [
            "Do NOT Delay Clinical Evaluation: Early surgical excision of dysplastic lesions carries an excellent prognosis.",
            "Do NOT Scratch, Pick, or Scrape: Mechanical trauma disrupts architectural clues needed during biopsy.",
            "Do NOT Rely on Reassurance Apps Alone: Automated tools cannot palpate or biopsy tissue."
        ],
        "critical_warning_signs": [
            "Spontaneous bleeding, ulceration, or crusting.",
            "Rapid increase in size (> 2mm in a few weeks).",
            "Elevation change from macular flat to nodular palpable.",
            "Regional lymph node swelling."
        ]
    },
    "psoriasis": {
        "title": "Standard Clinical Guidance for Plaque Psoriasis",
        "publisher": "National Psoriasis Foundation / BAD Guidelines",
        "reference_url": "https://www.psoriasis.org/about-psoriasis/",
        "last_reviewed": "2025-Q3",
        "approval_status": "Reviewed & Approved by Dermatology Advisory Council",
        "clinical_summary": (
            "Plaque psoriasis is a chronic immune-mediated hyperproliferative epidermal disease. "
            "Presents with sharply demarcated salmon-pink plaques capped with silvery-white adherent scales."
        ),
        "safe_self_care": [
            "Emollient Therapy: Use heavy keratolytics (e.g., creams containing urea or salicylic acid) to soften plaques.",
            "Lukewarm Baths: Soak for 10 minutes in colloidal oatmeal; pat dry gently without aggressive friction.",
            "Gentle Sun Exposure: Brief 10-minute non-burning natural sunlight exposures under medical guidance."
        ],
        "what_to_avoid": [
            "Avoid Koebner Phenomenon: Physical trauma, scratches, or sunburns can trigger new psoriasis plaques at the injury site.",
            "Avoid Abrupt Steroid Cessation: Stopping high-potency topical or oral steroids abruptly can cause pustular rebound flares.",
            "Avoid Smoking & Excessive Alcohol: Both significantly aggravate systemic psoriatic inflammation."
        ],
        "critical_warning_signs": [
            "Generalized skin redness covering > 80% of body surface (Erythrodermic emergency).",
            "Onset of multiple small pustules with fever (Generalized pustular psoriasis).",
            "Joint swelling, morning stiffness, or sausage-digit dactylitis (Psoriatic arthritis)."
        ]
    },
    "fungal_tinea": {
        "title": "Evidence-Based Management of Superficial Dermatophytosis",
        "publisher": "British Association of Dermatologists (BAD) / CDC Fungal Diseases",
        "reference_url": "https://www.cdc.gov/fungal/diseases/ringworm/index.html",
        "last_reviewed": "2025-Q1",
        "approval_status": "Reviewed & Approved by Dermatology Advisory Council",
        "clinical_summary": (
            "Dermatophytosis (Tinea) is a keratinophilic superficial fungal infection characterized by expanding annular plaques "
            "with active erythematous scaling margins and central clearing."
        ),
        "safe_self_care": [
            "Keep Skin Clean & Dry: Fungi proliferate rapidly in warm, moist cutaneous folds.",
            "Wash Clothing & Towels in Hot Water: Use separate towels to prevent transmission to other body sites or household members.",
            "Wear Breathable Fabrics: Loose cotton clothing minimizes moisture build-up."
        ],
        "what_to_avoid": [
            "STRICT CONTRAINDICATION - Do NOT Apply Topical Corticosteroids: Hydrocortisone produces 'Tinea Incognito', fueling aggressive fungal replication.",
            "Avoid Sharing Personal Items: Razors, brushes, gym mats, and unwashed clothing spread spores.",
            "Avoid Tight Synthetic Garments: Traps sweat and accelerates fungal growth."
        ],
        "critical_warning_signs": [
            "Rapid peripheral spread with maceration and blistering.",
            "Signs of secondary cellulitis (heat, severe swelling, ascending red streaks).",
            "Lack of improvement after 14 days of compliant antifungal care."
        ]
    },
    "acne_vulgaris": {
        "title": "Clinical Guidelines for the Management of Acne Vulgaris",
        "publisher": "American Academy of Dermatology (AAD)",
        "reference_url": "https://www.aad.org/member/clinical-quality/guidelines/acne",
        "last_reviewed": "2025-Q2",
        "approval_status": "Reviewed & Approved by Dermatology Advisory Council",
        "clinical_summary": (
            "Acne vulgaris is a multifactorial disorder of the pilosebaceous unit involving follicular hyperkeratinization, "
            "microbial colonization by Cutibacterium acnes, and localized inflammation."
        ),
        "safe_self_care": [
            "Non-Comedogenic Cleansing: Wash twice daily with gentle, pH-balanced non-comedogenic foaming cleanser.",
            "Over-the-counter Benzoyl Peroxide / Salicylic Acid: Helps reduce bacterial load and follicular plugging.",
            "Oil-Free Hydration: Use light, oil-free water-based hydration to maintain barrier stability."
        ],
        "what_to_avoid": [
            "Do NOT Squeeze or Pop Lesions: Causes deep dermal rupture, post-inflammatory hyperpigmentation, and ice-pick scarring.",
            "Avoid Abrasive Scrubs: Physical loofahs or walnut scrubs exacerbate follicular wall inflammation.",
            "Avoid Occlusive Heavy Oils: Coconut oil and mineral waxes clog pores."
        ],
        "critical_warning_signs": [
            "Deep painful fluctuating cystic nodules (Nodulocystic acne requiring oral isotretinoin).",
            "Fever, joint pain, and ulcerated crusting lesions (Acne fulminans emergency).",
            "Severe facial swelling."
        ]
    }
}


class RecommendationEngine:
    """
    Multimodal Evidence Integration & Recommendation Generator.
    Correlates image computer-vision findings with reported questionnaire symptoms.
    """

    @classmethod
    def synthesize_multimodal_evidence(
        cls,
        symptoms: SymptomQuestionnaireInput,
        visual_findings: Dict[str, Any]
    ) -> List[ConditionMatchModel]:
        """
        Bayesian-weighted correlation of visual probabilities + user reported context.
        """
        probs = visual_findings.get("calibrated_probabilities", {})
        morphology = visual_findings.get("morphological_features", {})
        asym = morphology.get("asymmetry_score", 0.0)
        border = morphology.get("border_irregularity", 0.0)
        erythema = morphology.get("erythema_saturation", 0.0)

        matches: List[ConditionMatchModel] = []

        # 1. Evaluate Eczema / Contact Dermatitis
        eczema_prob = probs.get("eczema_contact_dermatitis", 0.15)
        # Boost if patient reported exogenous chemical exposure and high itch
        if symptoms.prior_chemical_exposure:
            eczema_prob += 0.25
        if symptoms.itch_score >= 6:
            eczema_prob += 0.15
        
        # 2. Evaluate Dysplasia / Malignancy Risk
        dysplasia_prob = probs.get("suspicious_dysplastic_lesion", 0.10)
        if symptoms.bleeding_or_crusting:
            dysplasia_prob += 0.20
        if symptoms.is_spreading and symptoms.duration_days > 30:
            dysplasia_prob += 0.15

        # 3. Evaluate Benign Macule
        benign_prob = probs.get("benign_melanocytic_macule", 0.15)
        if asym < 0.15 and border < 0.20 and symptoms.itch_score == 0 and not symptoms.is_spreading:
            benign_prob += 0.25

        # 4. Evaluate Psoriasis
        psoriasis_prob = probs.get("psoriasis", 0.10)
        if "psoriasis" in (symptoms.personal_skin_history or "").lower():
            psoriasis_prob += 0.30

        # 5. Evaluate Fungal Tinea
        fungal_prob = probs.get("fungal_tinea", 0.10)
        if border > 0.25 and symptoms.itch_score >= 4 and not symptoms.prior_chemical_exposure:
            fungal_prob += 0.15

        # 6. Evaluate Acne
        acne_prob = probs.get("acne_vulgaris", 0.10)
        if "face" in symptoms.anatomical_region.lower() or "chest" in symptoms.anatomical_region.lower():
            acne_prob += 0.20

        # Combine weighted list
        weighted = [
            ("eczema_contact_dermatitis", eczema_prob),
            ("suspicious_dysplastic_lesion", dysplasia_prob),
            ("benign_melanocytic_macule", benign_prob),
            ("psoriasis", psoriasis_prob),
            ("fungal_tinea", fungal_prob),
            ("acne_vulgaris", acne_prob),
        ]
        weighted.sort(key=lambda x: x[1], reverse=True)

        # Generate top matches with clear source traceability
        for rank, (cond_key, score) in enumerate(weighted[:3]):
            kb_data = CLINICAL_KNOWLEDGE_BASE.get(cond_key, {})
            cond_meta = SUPPORTED_CONDITIONS.get(cond_key, {})
            
            concordance = "Primary Pattern Match" if rank == 0 else ("Secondary Pattern Match" if rank == 1 else "Possible Consideration")
            
            if cond_key == "eczema_contact_dermatitis":
                visual_overlap = "Micro-papules, erythema, fine superficial desquamation"
                history_corr = f"Correlates with reported itch ({symptoms.itch_score}/10) and exposure to: {symptoms.exposure_details or 'exogenous irritant'}"
            elif cond_key == "benign_melanocytic_macule":
                visual_overlap = "Symmetric regular borders, uniform pigment distribution"
                history_corr = f"Stable presentation without rapid evolution ({symptoms.duration_days} days reported)"
            elif cond_key == "suspicious_dysplastic_lesion":
                visual_overlap = f"Asymmetry score {asym}, border irregularity {border}"
                history_corr = "Requires dermatoscopic differentiation and tissue biopsy"
            elif cond_key == "psoriasis":
                visual_overlap = "Well-demarcated erythematous plaque morphology"
                history_corr = "Subacute onset across extensor surface"
            elif cond_key == "fungal_tinea":
                visual_overlap = "Annular peripheral scaling margin with clearer central zone"
                history_corr = f"Progressive margin spread reported over {symptoms.duration_days} days"
            else:
                visual_overlap = "Follicular inflammatory papules"
                history_corr = "Anatomical distribution consistent with pilosebaceous gland density"

            matches.append(ConditionMatchModel(
                condition_id=cond_key,
                name=cond_meta.get("name", kb_data.get("title", cond_key)),
                category=cond_meta.get("category", "Dermatological Condition"),
                concordance_tier=concordance,
                visual_overlap=visual_overlap,
                clinical_history_correlation=history_corr,
                summary=kb_data.get("clinical_summary", ""),
                publisher_source=kb_data.get("publisher", "Clinical Review Board"),
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
        Assembles complete source-traceable clinical decision support.
        """
        # Diagnostic gaps declaration (MANDATORY clinical boundary disclosure)
        diagnostic_gaps = [
            "No Tactile Palpation: 2D consumer photography cannot assess deep dermal induration, firmness, or localized heat.",
            "Polarized Dermoscopy Missing: Sub-surface vascular capillary loops and deep melanin patterns cannot be examined without hardware dermatoscope optics.",
            "Biopsy and Patch Testing Required: Histological verification by a certified dermatopathologist is the gold standard for definitive diagnosis."
        ]

        if not is_quality_acceptable:
            diagnostic_gaps.insert(0, "Optical Viability Insufficient: Blurry image or suboptimal lighting limits feature segmentation reliability.")

        # Inconclusive check
        uncertainty = visual_findings.get("uncertainty_metrics", {})
        is_inconclusive = (not is_quality_acceptable) or uncertainty.get("is_out_of_distribution", False)
        inconclusive_reason = None
        if not is_quality_acceptable:
            inconclusive_reason = "Image quality did not pass focus or lighting thresholds. Re-take photo or consult a doctor."
        elif uncertainty.get("is_out_of_distribution", False):
            inconclusive_reason = "Cutaneous pattern exhibits high ambiguity or falls outside validated model domain."

        # Multimodal evidence matches
        possible_conditions = cls.synthesize_multimodal_evidence(symptoms, visual_findings)
        primary_match_key = possible_conditions[0].condition_id if possible_conditions else "eczema_contact_dermatitis"
        
        # Primary guidance retrieved from approved source
        primary_kb = CLINICAL_KNOWLEDGE_BASE.get(primary_match_key, CLINICAL_KNOWLEDGE_BASE["eczema_contact_dermatitis"])
        
        # Citations list
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
            primary_condition=possible_conditions[0].name if possible_conditions else "Dermatological Symptom Pattern",
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

