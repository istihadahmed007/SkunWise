from typing import List, Dict, Any, Optional

VERIFIED_BANGLADESH_PROVIDERS: List[Dict[str, Any]] = [
    {
        "id": "bsmmu-derm",
        "name": "Bangabandhu Sheikh Mujib Medical University (BSMMU)",
        "department": "Department of Dermatology & Venereology",
        "type": "Public University Medical Center",
        "location": "Shahbag, Dhaka-1000",
        "division": "Dhaka",
        "coordinates": {"lat": 23.7388, "lon": 90.3958},
        "contact_phone": "+880 2-9661051",
        "opd_hours": "Saturday – Thursday: 8:00 AM – 2:30 PM",
        "consultation_fee_bdt": "৳30 (Ticket) / ৳300 (Specialized Evening OPD)",
        "services": [
            "General Dermatological Consultations",
            "Phototherapy & Psoriasis Clinic",
            "Dermatopathology & Skin Biopsy",
            "Pediatric Dermatology"
        ],
        "is_verified": True,
        "booking_mode": "In-Person OPD Desk & University Hotline",
        "booking_available_online": False,
        "notes": "Bring your generated SkinWise AI clinical summary PDF for expedited triage at the OPD consultation counter."
    },
    {
        "id": "dmch-derm",
        "name": "Dhaka Medical College Hospital (DMCH)",
        "department": "Department of Dermatology & Venereology",
        "type": "Tertiary Government Teaching Hospital",
        "location": "Secretariat Road, Bakshibazar, Dhaka-1000",
        "division": "Dhaka",
        "coordinates": {"lat": 23.7259, "lon": 90.3976},
        "contact_phone": "+880 2-55165088",
        "opd_hours": "Saturday – Thursday: 8:00 AM – 2:00 PM",
        "consultation_fee_bdt": "৳10 (Outdoor Ticket)",
        "services": [
            "Outpatient Clinical Dermatology",
            "Allergy & Contact Dermatitis Unit",
            "Emergency Dermatology Triage (24/7)"
        ],
        "is_verified": True,
        "booking_mode": "Hospital Outdoor Counter Registration",
        "booking_available_online": False,
        "notes": "Emergency cases should report directly to the 24-hour Emergency Department."
    },
    {
        "id": "nidsu-derm",
        "name": "National Institute of Diseases of the Skin and Urology (NIDSU)",
        "department": "Specialized Dermatology Outpatient & Inpatient Institute",
        "type": "Specialized National Institute",
        "location": "Sher-e-Bangla Nagar, Agargaon, Dhaka-1207",
        "division": "Dhaka",
        "coordinates": {"lat": 23.7749, "lon": 90.3686},
        "contact_phone": "+880 2-9111354",
        "opd_hours": "Saturday – Thursday: 8:30 AM – 2:30 PM",
        "consultation_fee_bdt": "৳10 (Registration Ticket)",
        "services": [
            "Comprehensive Skin Disease Diagnosis",
            "Chronic Eczema & Psoriasis Management",
            "Cutaneous Infection Control",
            "Minor Dermatosurgery"
        ],
        "is_verified": True,
        "booking_mode": "In-Person Registration",
        "booking_available_online": False,
        "notes": "National referral center for complex or chronic dermatological conditions."
    },
    {
        "id": "square-derm",
        "name": "Square Hospital Ltd.",
        "department": "Dermatology & Aesthetic Center",
        "type": "Private Tertiary Hospital",
        "location": "18/F, Bir Uttam Qazi Nuruzzaman Sarak, Panthapath, Dhaka-1205",
        "division": "Dhaka",
        "coordinates": {"lat": 23.7533, "lon": 90.3817},
        "contact_phone": "10616 / +880 9610010616",
        "opd_hours": "Saturday – Friday: 9:00 AM – 8:00 PM (By Appointment)",
        "consultation_fee_bdt": "৳1,500 – ৳2,000",
        "services": [
            "Consultant Dermatologists (Board-Certified FCPS/MD)",
            "Digital Dermoscopy Mole Mapping",
            "Laser Dermatology & Skin Barrier Restoration",
            "Cryotherapy & Skin Patch Testing"
        ],
        "is_verified": True,
        "booking_mode": "Square Hotline (10616) or Hospital Reception",
        "booking_available_online": False,
        "notes": "Present your SkinWise Clinical Dossier during doctor consultation for efficient history review."
    },
    {
        "id": "evercare-derm",
        "name": "Evercare Hospital Dhaka",
        "department": "Department of Dermatology & Cosmetology",
        "type": "JCI-Accredited Tertiary Hospital",
        "location": "Plot 81, Block E, Bashundhara R/A, Dhaka-1229",
        "division": "Dhaka",
        "coordinates": {"lat": 23.8099, "lon": 90.4312},
        "contact_phone": "10678 / +880 2-55037242",
        "opd_hours": "Saturday – Thursday: 9:00 AM – 7:00 PM",
        "consultation_fee_bdt": "৳1,800 – ৳2,500",
        "services": [
            "Senior Consultant Dermatology Panel",
            "Patch Allergy Testing & Photodermatology",
            "Surgical Dermatology & Biopsy"
        ],
        "is_verified": True,
        "booking_mode": "Evercare Hotline (10678) / Front Desk",
        "booking_available_online": False,
        "notes": "Accredited specialist care with international standards."
    },
    {
        "id": "cmch-derm",
        "name": "Chittagong Medical College Hospital (CMCH)",
        "department": "Department of Dermatology & Venereology",
        "type": "Regional Government Medical Center",
        "location": "57 K.B. Fazlul Kader Road, Panchlaish, Chittagong",
        "division": "Chittagong",
        "coordinates": {"lat": 22.3598, "lon": 91.8296},
        "contact_phone": "+880 31-610381",
        "opd_hours": "Saturday – Thursday: 8:00 AM – 2:00 PM",
        "consultation_fee_bdt": "৳10 (OPD Ticket)",
        "services": [
            "Regional Dermatological Outpatient",
            "Tropical Dermatology & Fungal Infections",
            "General Skin Lesion Clinics"
        ],
        "is_verified": True,
        "booking_mode": "Hospital Outdoor Counter Registration",
        "booking_available_online": False,
        "notes": "Primary regional public healthcare facility for Chittagong Division."
    },
    {
        "id": "somch-derm",
        "name": "Sylhet MAG Osmani Medical College Hospital (SOMCH)",
        "department": "Department of Dermatology & Venereology",
        "type": "Regional Government Medical Center",
        "location": "Medical Road, Sylhet-3100",
        "division": "Sylhet",
        "coordinates": {"lat": 24.8988, "lon": 91.8542},
        "contact_phone": "+880 821-713487",
        "opd_hours": "Saturday – Thursday: 8:00 AM – 2:00 PM",
        "consultation_fee_bdt": "৳10 (OPD Ticket)",
        "services": [
            "Outpatient Dermatology & Allergy Care",
            "Cutaneous Infection Evaluation",
            "Clinical Follow-Up Clinics"
        ],
        "is_verified": True,
        "booking_mode": "Hospital Outdoor Counter Registration",
        "booking_available_online": False,
        "notes": "Main healthcare center serving the greater Sylhet region."
    }
]

class ProviderDirectoryService:
    @staticmethod
    def get_providers(
        division: Optional[str] = None,
        query: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieves verified clinical dermatology departments and hospitals in Bangladesh.
        """
        providers = VERIFIED_BANGLADESH_PROVIDERS

        if division and division.lower() != "all":
            providers = [p for p in providers if p["division"].lower() == division.lower()]

        if query and query.strip():
            q = query.lower().strip()
            providers = [
                p for p in providers
                if q in p["name"].lower() or q in p["department"].lower() or q in p["location"].lower()
            ]

        return {
            "success": True,
            "country": "Bangladesh",
            "total_count": len(providers),
            "providers": providers,
            "booking_notice": (
                "Real-time electronic booking integration is currently in directory phase. "
                "Patients are advised to contact the department telephone or present in-person with their "
                "downloaded SkinWise AI Clinical Consultation Dossier (PDF)."
            )
        }

provider_service = ProviderDirectoryService()

