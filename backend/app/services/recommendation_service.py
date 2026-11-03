from typing import Dict, Any, List, Optional
from app.models.schemas import (
    SymptomQuestionnaireInput, ConditionMatchModel, TriageResultModel,
    CosmeticSkinTypeModel, BoundingBoxModel, DetectedAreaModel, SkincareProductOptionModel
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
    },
    "herpes_simplex": {
        "title": "General Care & Guidance for Viral Blister Patterns (Herpes Simplex)",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://www.aad.org/public/diseases/a-z/herpes-simplex-overview",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "Possible visible concern: Small clustered fluid-filled blisters on an erythematous base, often accompanied by burning, tingling, or localized tenderness."
        ),
        "safe_self_care": [
            "Keep clean and dry: Gently cleanse with mild unscented soap and water; pat dry with a clean paper towel to prevent cross-contamination.",
            "Cool compress: Apply a cool, damp compress wrapped in a clean cloth for 10–15 minutes to soothe pain and burning.",
            "Frequent hand hygiene: Wash hands thoroughly with soap and water after any contact with the affected area.",
            "Seek medical check: An in-person doctor evaluation is recommended for diagnostic confirmation and prescription oral antiviral therapy if indicated."
        ],
        "what_to_avoid": [
            "NEVER pop, pick, scratch, or squeeze blisters, which spreads the viral infection and increases scarring and bacterial superinfection risk.",
            "Do NOT apply topical corticosteroid creams (such as hydrocortisone), which can suppress local immunity and worsen viral replication.",
            "Avoid sharing towels, drinking glasses, lip balms, or having direct skin-to-skin contact while active blisters or crusts are present."
        ],
        "critical_warning_signs": [
            "Blisters developing near or spreading to the eye, eyelid, or tip of the nose (urgent ophthalmology risk).",
            "Severe headache, stiff neck, high fever, or confusion.",
            "Widespread dissemination across the body or severely immunocompromised status."
        ]
    },
    "impetigo": {
        "title": "General Care for Honey-Colored Crusting Patterns (Impetigo)",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://www.cdc.gov/groupastrep/diseases-public/impetigo.html",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "Possible visible concern: Superficial sores or fragile blisters that rupture, leaving characteristic honey-colored or golden crusts, most commonly on the face or extremities."
        ),
        "safe_self_care": [
            "In-person medical visit: Impetigo is a bacterial skin infection that typically requires prescription topical or oral antibiotics from a doctor.",
            "Gentle crust soaking: Gently soften crusts with a warm, damp cloth and wash with mild soap without scrubbing.",
            "Keep covered: Cover open sores with a breathable gauze bandage to help prevent spreading to others or other body sites.",
            "Wash linens in hot water: Wash towels, clothing, and bedding separately in hot water."
        ],
        "what_to_avoid": [
            "Do NOT scratch or pick at crusts, which can spread bacteria to other areas of the body.",
            "Do NOT apply steroid creams, which worsen bacterial proliferation.",
            "Avoid sharing personal towels, bedding, razors, or toys until evaluated and treated by a physician."
        ],
        "critical_warning_signs": [
            "Rapidly expanding redness, warmth, or red streaks traveling along the skin (cellulitis).",
            "Fever, chills, lethargy, or swollen tender lymph nodes.",
            "Dark urine or facial puffiness 1–2 weeks following skin sores."
        ]
    },
    "lichen_planus": {
        "title": "General Care for Violaceous Polygonal Papules (Lichen Planus)",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://dermnetnz.org/topics/lichen-planus",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "Possible visible concern: Pruritic, violaceous (purple), flat-topped, polygonal papules, often displaying faint whitish lines (Wickham striae) on wrists, ankles, or lower back."
        ),
        "safe_self_care": [
            "In-person clinical check: A dermatologist consultation is recommended for confirmation, topical treatment plan, and oral mucosal screening.",
            "Gentle barrier hydration: Apply rich, fragrance-free moisturizing ointments to reduce skin dryness and soothe itch.",
            "Cool compresses: Use cool damp cloths for 10 minutes to help relieve intense itching without scratching."
        ],
        "what_to_avoid": [
            "Do NOT scratch or rub vigorously; skin trauma can trigger new lesions along scratch lines (Koebner phenomenon).",
            "Avoid harsh alkaline soaps, hot water, and abrasive sponges.",
            "Do not apply unprescribed medicated topicals without physician guidance."
        ],
        "critical_warning_signs": [
            "Painful erosive sores inside the mouth, gums, or genital mucosa.",
            "Hair thinning or scarring alopecia on the scalp.",
            "Nail dystrophy, ridging, or thinning."
        ]
    },
    "molluscum_contagiosum": {
        "title": "General Care for Pearly Umbilicated Papules (Molluscum Contagiosum)",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://www.cdc.gov/poxvirus/molluscum-contagiosum/index.html",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "Possible visible concern: Small, firm, dome-shaped papules with a characteristic central dimple or umbilication and a shiny, pearly appearance."
        ),
        "safe_self_care": [
            "Keep bumps covered: Keep affected areas covered with clothing or a small breathable bandage to reduce transmission.",
            "Frequent handwashing: Wash hands with soap and water after any contact with the bumps.",
            "Consult a physician: Schedule an in-person doctor evaluation for monitoring and professional management options."
        ],
        "what_to_avoid": [
            "Do NOT squeeze, pick, scratch, or try to excise the central core at home (causes autoinoculation and scarring).",
            "Avoid sharing towels, washcloths, or clothing with family members.",
            "Avoid shaving over areas with active bumps."
        ],
        "critical_warning_signs": [
            "Bumps developing surrounding intense redness, warmth, or pus (secondary bacterial infection).",
            "Lesions appearing on or around the eyelids.",
            "Very large or widespread lesions in individuals with compromised immunity."
        ]
    },
    "pityriasis_rosea": {
        "title": "General Care for Oval Patch Patterns (Pityriasis Rosea)",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://www.aad.org/public/diseases/a-z/pityriasis-rosea-overview",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "Possible visible concern: An initial larger oval patch (herald patch) followed by smaller salmon-pink or fawn-colored scaly plaques along cleavage lines in a Christmas-tree distribution."
        ),
        "safe_self_care": [
            "Doctor check recommended: An in-person medical evaluation helps distinguish pityriasis rosea from other causes such as tinea or secondary rashes.",
            "Lukewarm baths & colloidal oatmeal: Bathe in lukewarm water with gentle oatmeal soaks to soothe itch.",
            "Generous plain moisturizer: Apply fragrance-free creams or lotions after bathing to prevent dryness."
        ],
        "what_to_avoid": [
            "Avoid hot water and aggressive towel rubbing, which aggravate itch and inflammation.",
            "Avoid strenuous workouts in high heat, which can exacerbate the eruption.",
            "Do NOT apply harsh abrasive scrubs or bleaching creams."
        ],
        "critical_warning_signs": [
            "Rash accompanied by fever, sore throat, or joint pains.",
            "Rash appearing on the palms of hands or soles of feet.",
            "Lesions that do not fade within 8 to 10 weeks."
        ]
    },
    "pediculosis_capitis": {
        "title": "General Care & Guidance for Ectoparasitic Infestation (Pediculosis)",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://www.cdc.gov/parasites/lice/head/index.html",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "Possible visible concern: Intense itching, excoriation marks, or visible nits/parasites in hairy or intertriginous areas."
        ),
        "safe_self_care": [
            "Doctor or pharmacist evaluation: Consult a healthcare professional for approved pediculicide treatment options.",
            "Fine-toothed wet combing: Carefully comb wet hair with a specialized nit comb to remove eggs.",
            "Launder clothing and bedding: Wash recent bedding, hats, and towels in hot water (at least 130°F / 54°C) and machine dry on high heat."
        ],
        "what_to_avoid": [
            "Do NOT apply unverified chemicals, kerosene, or veterinary products to human skin.",
            "Avoid sharing hats, brushes, helmets, or pillowcases.",
            "Do not scratch intensely to avoid secondary bacterial infection."
        ],
        "critical_warning_signs": [
            "Signs of secondary infection: swollen tender lymph nodes, oozing pus, or crusted sores on the scalp or neck.",
            "Severe allergic reactions or skin breakdown."
        ]
    },
    "larva_migrans": {
        "title": "General Care for Serpiginous Track Patterns (Cutaneous Larva Migrans)",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://www.cdc.gov/parasites/zoonotichookworm/index.html",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "Possible visible concern: Advancing, intensely pruritic, reddish snake-like (serpiginous) linear tracks on feet, legs, or body following contact with warm, moist soil or sand."
        ),
        "safe_self_care": [
            "Doctor check required: Cutaneous larva migrans requires prescription antihelmintic medical treatment (such as albendazole or ivermectin) from a physician.",
            "Cool compresses: Apply cool damp cloths to temporarily ease intense itching.",
            "Keep the area clean: Wash gently with mild soap and water."
        ],
        "what_to_avoid": [
            "Do NOT attempt to cut, freeze, or chemically cauterize the track at home.",
            "Do NOT scratch the track, which introduces bacteria and causes secondary cellulitis.",
            "Avoid walking barefoot on contaminated sand or soil."
        ],
        "critical_warning_signs": [
            "Rapidly spreading cellulitis, redness, red streaks, or throbbing pain.",
            "Fever, wheezing, or widespread symptoms."
        ]
    },
    "tungiasis": {
        "title": "General Care for Plantar Flea Ectoparasitosis (Tungiasis)",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://www.who.int/news-room/fact-sheets/detail/tungiasis",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "Possible visible concern: Punctiform papule or nodule with a central dark spot and surrounding pale or erythematous halo, typically located on toes, soles, or periungual regions."
        ),
        "safe_self_care": [
            "Doctor visit required: Tungiasis requires sterile surgical extraction and tetanus prophylaxis by a healthcare provider.",
            "Antiseptic cleansing: Keep the foot clean with mild antiseptic wash.",
            "Wear protective footwear: Always wear closed-toe shoes and socks in endemic sandy/earthen areas."
        ],
        "what_to_avoid": [
            "NEVER attempt non-sterile extraction at home with unsterilized needles or pins (high tetanus and gangrene risk).",
            "Do not walk barefoot on unpaved or sandy floors in affected regions."
        ],
        "critical_warning_signs": [
            "Severe throbbing foot pain, swelling, inability to bear weight.",
            "Signs of secondary infection: red streaks, foul odor, or fever."
        ]
    },
    "papilomatosis_confluentes": {
        "title": "General Care for Confluent and Reticulated Papillomatosis Patterns",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://dermnetnz.org/topics/confluent-and-reticulated-papillomatosis",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "Possible visible concern: Hyperpigmented, slightly verrucous or scaly macules and papules coalescing centrally and forming a net-like (reticulated) pattern peripherally on the chest or back."
        ),
        "safe_self_care": [
            "Dermatologist consultation: An in-person visit is recommended; CRP often responds well to specific prescription oral antibiotics or topical retinoids.",
            "Gentle cleansing: Wash with a mild, non-irritating cleanser and pat dry.",
            "Avoid aggressive scrubbing: Friction and harsh exfoliation can worsen hyperkeratosis."
        ],
        "what_to_avoid": [
            "Do NOT aggressively scrub with loofahs or abrasive chemicals.",
            "Avoid unprescribed bleaching or depigmenting preparations."
        ],
        "critical_warning_signs": [
            "Rapid lesion evolution, pain, or widespread skin breakdown."
        ]
    },
    "unsupported_specialized_condition": {
        "title": "Specialized Dermatological Presentation (In-Person Clinical Evaluation Required)",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://www.aad.org/public/diseases",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "Specialized observation: The visual features in this photo correspond to a complex, systemic, or specialized dermatosis that cannot be safely triaged by automated software. An in-person medical evaluation with a qualified dermatologist is strongly advised."
        ),
        "safe_self_care": [
            "Schedule dermatologist consultation: Book an in-person physical examination with a qualified specialist for comprehensive clinical evaluation and diagnostic testing.",
            "Gentle supportive care: Use only plain lukewarm water and mild, fragrance-free moisturizing lotion to maintain skin hydration.",
            "Keep records: Note when symptoms began, whether they change with temperature or foods, and bring a list of all current medications to your doctor visit."
        ],
        "what_to_avoid": [
            "Do NOT self-medicate with high-potency steroid creams, antibiotics, or aggressive home remedies.",
            "Do NOT pick, scratch, or abrade the skin surface.",
            "Do not rely solely on mobile or automated photo assessment for complex skin conditions."
        ],
        "critical_warning_signs": [
            "Widespread skin peeling, blistering, or mucosal (mouth/eye/genital) involvement.",
            "Fever, chills, facial swelling, or breathing difficulty.",
            "Severe worsening pain or rapidly spreading skin lesions."
        ]
    },
    "general_skin_care": {
        "title": "General Conservative Skin Barrier Care",
        "publisher": "Dermatology Educational Guidance",
        "reference_url": "https://www.aad.org/public/everyday-care/skin-care-basics",
        "last_reviewed": "2025",
        "approval_status": "Reviewed Medical Reference",
        "clinical_summary": (
            "General supportive skincare: Focuses on preserving skin barrier hydration, gentle cleansing, and sun protection when photographic analysis is inconclusive or unavailable."
        ),
        "safe_self_care": [
            "Gentle cleansing: Wash with plain lukewarm water and a mild, fragrance-free, soap-free cleanser. Pat dry gently.",
            "Moisturize skin barrier: Apply a plain, fragrance-free moisturizing lotion or cream to soothe dryness and protect the barrier.",
            "In-person evaluation: Have a qualified doctor or dermatologist examine any skin concern that persists, changes, or causes pain.",
            "Patch testing: Test any new cosmetic product on a small spot on the inner arm for 24 hours before broader use; discontinue if stinging occurs.",
            "Monitor for changes: Note any changes in size, color, border, or sensations over the coming days."
        ],
        "what_to_avoid": [
            "Do NOT scratch, pick, or rub the affected skin, which worsens barrier irritation and risks infection.",
            "Avoid hot water, harsh exfoliants, and fragranced lotions or alcohol-based astringents.",
            "Do NOT apply unprescribed medicated creams without an in-person medical evaluation."
        ],
        "critical_warning_signs": [
            "Rapidly spreading redness, swelling, or heat to the touch.",
            "Pus, yellow crusting, or oozing (signs of infection).",
            "Fever, chills, or generally feeling unwell.",
            "Severe pain or any rapidly evolving, bleeding, or unusually dark spot."
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
        CRITICAL SAFETY RULE:
        If visual inference was inconclusive, unavailable, or failed, DO NOT synthesize ranked image-based
        possible_conditions from uniform or default probabilities. Return an empty list.
        """
        inference_status = visual_findings.get("inference_status", "inconclusive")
        is_inconclusive = visual_findings.get("is_inconclusive", True)

        # Do not produce ranked conditions if visual model did not successfully identify a pattern
        if inference_status != "successful" or is_inconclusive:
            return []

        probs = visual_findings.get("observed_pattern_scores") or visual_findings.get("calibrated_probabilities", {})
        if not probs:
            return []

        gemini_inf = visual_findings.get("gemini_inference")
        matched_cat = gemini_inf.get("matched_category") if (gemini_inf and isinstance(gemini_inf, dict)) else None

        matches: List[ConditionMatchModel] = []

        # Build dynamic weighted score list preserving all supported model categories
        weighted = []
        for cond_key, score in probs.items():
            s = float(score)
            if s <= 0.0 and cond_key != matched_cat:
                continue

            # Subtle symptom-concordance adjustments (max +0.08) to reflect patient clinical context
            if cond_key == "eczema_contact_dermatitis" and symptoms.prior_chemical_exposure and s > 0:
                s += 0.05
            elif cond_key == "suspicious_dysplastic_lesion" and symptoms.bleeding_or_crusting and s > 0:
                s += 0.08
            elif cond_key == "psoriasis" and "psoriasis" in (symptoms.personal_skin_history or "").lower() and s > 0:
                s += 0.05
            elif cond_key == "fungal_tinea" and symptoms.itch_score >= 5 and s > 0:
                s += 0.03
            elif cond_key == "impetigo" and symptoms.bleeding_or_crusting and s > 0:
                s += 0.05

            weighted.append((cond_key, round(s, 4)))

        # Sort highest concordance first
        weighted.sort(key=lambda x: x[1], reverse=True)

        for rank, (cond_key, score) in enumerate(weighted[:3]):
            # Only include conditions with meaningful support or direct model match
            if score < 0.20 and cond_key != matched_cat:
                continue

            kb_data = CLINICAL_KNOWLEDGE_BASE.get(cond_key, CLINICAL_KNOWLEDGE_BASE.get("general_skin_care", {}))
            cond_meta = SUPPORTED_CONDITIONS.get(cond_key, {})

            concordance = "Primary pattern consideration" if rank == 0 else "Other possible consideration"

            # Determine display name from original model metadata or supported conditions
            model_display_name = cond_meta.get("name")
            if not model_display_name and gemini_inf and isinstance(gemini_inf, dict):
                model_display_name = gemini_inf.get("primary_concern")
            if not model_display_name:
                model_display_name = kb_data.get("title", cond_key)

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
            elif cond_key == "acne_vulgaris":
                visual_overlap = "Small localized bumps or blemishes"
                history_corr = "Location consistent with oil-producing skin areas"
            elif cond_key == "herpes_simplex":
                visual_overlap = "Clustered vesicular pattern on an erythematous base"
                history_corr = "Localized discomfort or burning reported"
            elif cond_key == "impetigo":
                visual_overlap = "Superficial crusting or honey-colored surface discharge"
                history_corr = f"Reported crusting/oozing with duration of {symptoms.duration_days} days"
            elif cond_key == "lichen_planus":
                visual_overlap = "Violaceous flat-topped polygonal papular morphology"
                history_corr = f"Reported itch: {symptoms.itch_score}/10"
            elif cond_key == "molluscum_contagiosum":
                visual_overlap = "Discrete dome-shaped umbilicated papules"
                history_corr = "Pearly localized lesions without acute pain"
            elif cond_key == "pityriasis_rosea":
                visual_overlap = "Scaly oval or herald patch pattern"
                history_corr = f"Onset reported {symptoms.duration_days} days ago"
            elif cond_key in ("pediculosis_capitis", "larva_migrans", "tungiasis"):
                visual_overlap = "Ectoparasitic or serpiginous track morphology"
                history_corr = f"High discomfort (Itch: {symptoms.itch_score}/10, Pain: {symptoms.pain_score}/10)"
            else:
                visual_overlap = "Specialized dermatological morphological pattern"
                history_corr = "Requires in-person clinical examination by a dermatologist"

            matches.append(ConditionMatchModel(
                condition_id=cond_key,
                name=model_display_name,
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
    def evaluate_cosmetic_skin_type(
        cls,
        symptoms: SymptomQuestionnaireInput,
        visual_findings: Optional[Dict[str, Any]] = None
    ) -> CosmeticSkinTypeModel:
        feel = getattr(symptoms, "midday_skin_feel", "balanced") or "balanced"
        sensitivity = getattr(symptoms, "skin_sensitivity", "rarely_reacts") or "rarely_reacts"
        
        if sensitivity == "easily_irritated":
            return CosmeticSkinTypeModel(
                skin_type="Sensitive Skin",
                explanation="Reported tendency for skin to sting, flush, or react easily to new products or weather changes. Prioritize simple, fragrance-free formulations.",
                source="Questionnaire self-report & barrier context"
            )
        elif feel == "oily":
            return CosmeticSkinTypeModel(
                skin_type="Oily Skin",
                explanation="Reported excess sebum production across the face by midday. Lightweight, non-comedogenic gel or fluid moisturizers are typically preferred.",
                source="Questionnaire self-report & cosmetic observation"
            )
        elif feel == "dry":
            return CosmeticSkinTypeModel(
                skin_type="Dry Skin",
                explanation="Reported tightness, dry feel, or flaking. Rich cream moisturizers with ceramides or glycerin support barrier hydration.",
                source="Questionnaire self-report & cosmetic observation"
            )
        elif feel == "combination":
            return CosmeticSkinTypeModel(
                skin_type="Combination Skin",
                explanation="Reported oily T-zone (forehead, nose) with balanced or dry cheeks. Balanced hydration with light layering works best.",
                source="Questionnaire self-report & cosmetic observation"
            )
        else:
            return CosmeticSkinTypeModel(
                skin_type="Normal / Balanced Skin",
                explanation="Reported comfortable oil and hydration balance throughout the day. Basic gentle cleansing and broad-spectrum sun protection help maintain this state.",
                source="Questionnaire self-report & cosmetic observation"
            )

    @classmethod
    def generate_skincare_options(
        cls,
        cosmetic_type: CosmeticSkinTypeModel,
        primary_condition_key: str
    ) -> List[SkincareProductOptionModel]:
        # Always return a maximum of 3 practical, conservative product options
        if cosmetic_type.skin_type == "Oily Skin" or primary_condition_key == "acne_vulgaris":
            return [
                SkincareProductOptionModel(
                    category="Gentle Foaming or Gel Cleanser",
                    role="Removes excess surface sebum and impurities without stripping natural moisture.",
                    how_to_use="Wash twice daily with lukewarm water. Pat dry gently with a clean towel; avoid harsh scrubbing."
                ),
                SkincareProductOptionModel(
                    category="Oil-Free, Non-Comedogenic Moisturizer",
                    role="Provides lightweight hydration without clogging pores or feeling heavy.",
                    how_to_use="Apply a pea-sized amount morning and evening. Patch test on inner arm for 24 hours before first use; stop if irritation develops."
                ),
                SkincareProductOptionModel(
                    category="Broad-Spectrum Fluid Sunscreen (SPF 30+)",
                    role="Protects from UV radiation and helps prevent post-inflammatory dark marks.",
                    how_to_use="Apply liberally each morning as the final step. Reapply every 2 hours if outdoors."
                )
            ]
        elif cosmetic_type.skin_type in ("Dry Skin", "Sensitive Skin") or primary_condition_key in ("eczema_contact_dermatitis", "psoriasis"):
            return [
                SkincareProductOptionModel(
                    category="Hydrating Cream Cleanser",
                    role="Cleanses gently while maintaining the skin's natural protective lipid barrier.",
                    how_to_use="Massage over damp skin with lukewarm water once or twice daily; rinse thoroughly and pat dry."
                ),
                SkincareProductOptionModel(
                    category="Fragrance-Free Barrier Cream or Ointment",
                    role="Deeply moisturizes with ceramides or glycerin to seal in moisture and soothe dryness.",
                    how_to_use="Apply within 3 minutes of washing to trap hydration. Discontinue immediately if stinging occurs."
                ),
                SkincareProductOptionModel(
                    category="Gentle Mineral Sunscreen (SPF 30+)",
                    role="Defends against UV damage with zinc oxide or titanium dioxide suited for easily irritated skin.",
                    how_to_use="Apply every morning before stepping outside. Patch test a small spot before regular use."
                )
            ]
        else:
            return [
                SkincareProductOptionModel(
                    category="Gentle Daily Cleanser",
                    role="Clears daily buildup, sweat, and sunscreen gently without drying.",
                    how_to_use="Use morning and night with lukewarm water. Avoid hot water, which strips natural oils."
                ),
                SkincareProductOptionModel(
                    category="Fragrance-Free Daily Moisturizer",
                    role="Maintains optimal hydration balance and skin barrier smoothness.",
                    how_to_use="Smooth gently over skin after cleansing. Patch test on a small area for 24 hours first."
                ),
                SkincareProductOptionModel(
                    category="Broad-Spectrum Sunscreen (SPF 30+)",
                    role="Shields skin from UV rays to prevent sunburn, premature aging, and pigmentation.",
                    how_to_use="Apply evenly in the morning as your final skincare step."
                )
            ]

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
        Strictly distinguishes image analysis status (successful, inconclusive, unavailable, failed)
        from symptom-based safety triage.
        """
        inference_status = visual_findings.get("inference_status", "inconclusive")
        is_inconclusive = (
            (not is_quality_acceptable)
            or visual_findings.get("is_inconclusive", True)
            or (inference_status != "successful")
        )

        # Build safe, clear inconclusive reason and main finding
        if not is_quality_acceptable:
            inconclusive_reason = "The photo was unclear or lighting was insufficient. Please retake the photo in natural light or see a doctor."
            main_finding = "Photo quality notice: Image was unclear or had suboptimal lighting for automated analysis."
            status_for_model = "inconclusive"
        elif inference_status == "unavailable":
            inconclusive_reason = visual_findings.get("inference_status_reason", "Automated visual analysis is unconfigured or offline.")
            main_finding = "Image analysis unavailable: Automated visual analysis is currently offline."
            status_for_model = "unavailable"
        elif inference_status == "failed":
            inconclusive_reason = visual_findings.get("inference_status_reason", "Visual analysis service was temporarily unavailable.")
            main_finding = f"Image analysis unavailable: {inconclusive_reason}"
            status_for_model = "failed"
        elif is_inconclusive:
            inconclusive_reason = visual_findings.get("inference_status_reason", "Visual characteristics in the photograph could not be reliably categorized.")
            main_finding = "Image analysis inconclusive: No definitive visual pattern could be determined from the photograph."
            status_for_model = "inconclusive"
        else:
            inconclusive_reason = None
            main_finding = None
            status_for_model = "successful"

        diagnostic_gaps = [
            "Photos have limitations: A 2D photo cannot feel the skin texture, thickness, or temperature.",
            "Doctor visit needed for diagnosis: Only a qualified healthcare provider can perform an in-person examination and provide a medical diagnosis.",
            "Informational guidance only: This tool does not provide medical treatment, prescriptions, or laboratory tests."
        ]
        if is_inconclusive:
            diagnostic_gaps.insert(0, f"Analysis status: {inconclusive_reason}")

        # Synthesize possible conditions ONLY if visual inference was successful
        if is_inconclusive:
            possible_conditions: List[ConditionMatchModel] = []
            primary_condition = "Inconclusive Visual Observation"
            primary_kb = CLINICAL_KNOWLEDGE_BASE["general_skin_care"]
            confidence_statement = (
                f"{inconclusive_reason} Clinical evaluation by a qualified doctor is required for medical diagnosis."
            )
        else:
            possible_conditions = cls.synthesize_multimodal_evidence(symptoms, visual_findings)
            if possible_conditions:
                primary_condition = possible_conditions[0].name
                primary_match_key = possible_conditions[0].condition_id
                primary_kb = CLINICAL_KNOWLEDGE_BASE.get(primary_match_key, CLINICAL_KNOWLEDGE_BASE["general_skin_care"])
                main_finding = f"Possible visible concern: {primary_condition}"
            else:
                primary_condition = "Inconclusive Visual Observation"
                primary_kb = CLINICAL_KNOWLEDGE_BASE["general_skin_care"]
                main_finding = "Image analysis inconclusive: Pattern could not be matched with sufficient confidence."
                is_inconclusive = True
                inconclusive_reason = "Visual pattern match confidence was below threshold."
                status_for_model = "inconclusive"

            uncertainty = visual_findings.get("uncertainty_metrics", {})
            confidence_statement = uncertainty.get(
                "uncertainty_rationale",
                "Automated visual pattern match. Medical evaluation required for clinical diagnosis."
            )

        # 1. Cosmetic Skin Type (Cleanly separated from disease analysis)
        cosmetic_skin_type = cls.evaluate_cosmetic_skin_type(symptoms, visual_findings)

        # 2. Detected Area Localization (Genuine from model when supported, else None)
        detected_area_raw = visual_findings.get("detected_area", {})
        bbox_data = detected_area_raw.get("bounding_box")
        bbox_model = BoundingBoxModel(**bbox_data) if (bbox_data and isinstance(bbox_data, dict)) else None

        detected_area = DetectedAreaModel(
            has_detection=bool(detected_area_raw.get("has_detection", False) and bbox_model),
            bounding_box=bbox_model,
            label=detected_area_raw.get("label"),
            is_supported=detected_area_raw.get("is_supported", False),
            notes=detected_area_raw.get("notes", "Localization overlay is not available for this image.")
        )

        # 3. Recommended Skincare Options (Max 3)
        condition_for_skincare = possible_conditions[0].condition_id if possible_conditions else "general"
        recommended_skincare = cls.generate_skincare_options(cosmetic_skin_type, condition_for_skincare)

        # 4. Care Level (Strictly follows triage safety rules!)
        if triage_pathway["triage_tier"] == 3:
            care_level = "Seek urgent medical care"
        elif triage_pathway["triage_tier"] == 2:
            care_level = "Arrange a doctor visit"
        else:
            care_level = "General self-care"

        # 5. Practical Care Tips (Max 3)
        if triage_pathway["triage_tier"] == 3:
            practical_care_tips = [
                "Seek emergency medical evaluation immediately; do not rely on home care.",
                "Rest comfortably and avoid applying any new products or taking unprescribed medication.",
                "Take note of when symptoms started and bring any suspected trigger packages to the clinic."
            ]
        elif triage_pathway["triage_tier"] == 2:
            practical_care_tips = [
                "Arrange an in-person appointment with a doctor or dermatologist for a physical exam.",
                "Keep a brief log of whether the spot changes in size, shape, color, or discomfort over the coming days.",
                "Avoid harsh scrubs, acids, or unprescribed medicated creams prior to your medical visit."
            ]
        else:
            practical_care_tips = [
                "Wash the area gently with lukewarm water and a mild, fragrance-free cleanser.",
                "Apply a plain, fragrance-free moisturizer twice daily to support your skin barrier.",
                "Monitor the skin for 1 to 2 weeks; schedule a doctor check if redness, spreading, or discomfort worsens."
            ]

        citations = []
        if possible_conditions:
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
        else:
            gen_kb = CLINICAL_KNOWLEDGE_BASE["general_skin_care"]
            citations.append({
                "title": gen_kb["title"],
                "publisher": gen_kb["publisher"],
                "url": gen_kb["reference_url"],
                "last_reviewed": gen_kb["last_reviewed"],
                "status": gen_kb["approval_status"]
            })

        return TriageResultModel(
            triage_tier=triage_pathway["triage_tier"],
            triage_name=triage_pathway["triage_name"],
            recommended_timeline=triage_pathway["recommended_timeline"],
            urgency_badge_color=triage_pathway["urgency_badge_color"],
            primary_condition=primary_condition,
            rationale=triage_pathway["rationale"],
            emergency_warning_detected=triage_pathway.get("emergency_warning_detected", False),
            emergency_warning_items=triage_pathway.get("emergency_warning_items", []),
            is_inconclusive=is_inconclusive,
            inconclusive_reason=inconclusive_reason,
            inference_status=status_for_model,
            possible_conditions=possible_conditions,
            safe_self_care=primary_kb.get("safe_self_care", []),
            what_to_avoid=primary_kb.get("what_to_avoid", []),
            critical_warning_signs=primary_kb.get("critical_warning_signs", []),
            diagnostic_gaps=diagnostic_gaps,
            citations=citations,
            main_finding=main_finding,
            confidence_statement=confidence_statement,
            ai_observations=visual_findings.get("ai_observations", []),
            model_metadata={
                "model_version": visual_findings.get("model_version"),
                "backend": visual_findings.get("backend"),
                "is_uncalibrated_heuristic": visual_findings.get("is_uncalibrated_heuristic", True),
                "is_clinical_probability": visual_findings.get("is_clinical_probability", False),
                "clinical_disclaimer": visual_findings.get("clinical_disclaimer"),
                "uncertainty_metrics": visual_findings.get("uncertainty_metrics", {})
            },
            cosmetic_skin_type=cosmetic_skin_type,
            detected_area=detected_area,
            recommended_skincare=recommended_skincare,
            care_level=care_level,
            practical_care_tips=practical_care_tips
        )

recommendation_engine = RecommendationEngine()
