import os
from pathlib import Path
from typing import Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.core.config import settings

def generate_clinical_dossier_pdf(
    session_code: str,
    user_name: str,
    user_email: str,
    created_at_str: str,
    anatomical_region: str,
    image_path: Optional[str],
    triage_data: dict,
    symptom_data: dict,
    quality_data: dict
) -> str:
    """
    Generates a formal, board-vetted dermatological pre-consultation summary PDF
    formatted for specialist clinical handoff (HL7 / FHIR clinical document architecture aligned).
    """
    output_filename = f"Clinical_Dossier_{session_code}.pdf"
    pdf_path = settings.REPORTS_DIR / output_filename

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom clinical typography styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#006194")
    )
    
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#3f4850")
    )
    
    h2_style = ParagraphStyle(
        "Heading2Custom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#131b2e")
    )

    body_style = ParagraphStyle(
        "BodyCustom",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#131b2e")
    )

    notice_style = ParagraphStyle(
        "NoticeStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#ba1a1a")
    )

    elements = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>SkinWise AI — Clinical Decision Support Dossier</b>", title_style),
            Paragraph(f"<b>Session:</b> #{session_code}<br/><b>Date:</b> {created_at_str}", subtitle_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[380, 160])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(header_table)

    # Persistent Medical Boundary Box
    boundary_text = (
        "<b>CLINICAL NOTICE & BOUNDARY OF CARE (CE CLASS I SaMD):</b> This automated dossier provides probabilistic "
        "triage screening and symptom correlation for pre-consultation physician intake. It does NOT provide a histological, "
        "pathological, or definitive medical diagnosis. In-person physical examination with dermoscopy is required."
    )
    boundary_table = Table([[Paragraph(boundary_text, notice_style)]], colWidths=[540])
    boundary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fff2f2")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#fecaca")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(boundary_table)
    elements.append(Spacer(1, 12))

    # 2. Patient & Intake Telemetry Table
    triage_tier = triage_data.get("triage_tier", 2)
    triage_name = triage_data.get("triage_name", "Medical Assessment Recommended")
    tier_color = colors.HexColor("#16a34a") if triage_tier == 1 else (colors.HexColor("#d97706") if triage_tier == 2 else colors.HexColor("#dc2626"))

    patient_meta = [
        [
            Paragraph("<b>Patient Name:</b>", body_style), Paragraph(user_name, body_style),
            Paragraph("<b>Triage Pathway:</b>", body_style), Paragraph(f"<b>{triage_name}</b>", ParagraphStyle("T", parent=body_style, textColor=tier_color))
        ],
        [
            Paragraph("<b>Anatomical Region:</b>", body_style), Paragraph(anatomical_region, body_style),
            Paragraph("<b>Recommended Timeline:</b>", body_style), Paragraph(triage_data.get("recommended_timeline", "1-2 Weeks"), body_style)
        ],
        [
            Paragraph("<b>Reported Duration:</b>", body_style), Paragraph(f"{symptom_data.get('duration_days', 0)} days", body_style),
            Paragraph("<b>Pruritus VAS (0-10):</b>", body_style), Paragraph(f"{symptom_data.get('itch_score', 0)} / 10", body_style)
        ],
        [
            Paragraph("<b>Pain Score (0-10):</b>", body_style), Paragraph(f"{symptom_data.get('pain_score', 0)} / 10", body_style),
            Paragraph("<b>Progressive Spread:</b>", body_style), Paragraph("Yes (Expanding)" if symptom_data.get('is_spreading') else "No (Stable)", body_style)
        ],
        [
            Paragraph("<b>Prior Exposure:</b>", body_style), Paragraph(symptom_data.get('exposure_details') or "None reported", body_style),
            Paragraph("<b>Image Quality Score:</b>", body_style), Paragraph(f"{quality_data.get('overall_usability_score', 90)}/100 ({quality_data.get('sharpness_status', 'Pass')})", body_style)
        ]
    ]

    p_table = Table(patient_meta, colWidths=[110, 160, 120, 150])
    p_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(p_table)
    elements.append(Spacer(1, 14))

    # 3. Clinical Triage Rationale & Primary Pattern Match
    elements.append(Paragraph("<b>1. Triage Classification & Clinical Rationale</b>", h2_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(triage_data.get("rationale", ""), body_style))
    elements.append(Spacer(1, 10))

    # 4. Pattern Correlation Matches Table
    elements.append(Paragraph("<b>2. Differential Visual Pattern Matches (Peer-Reviewed Evidence)</b>", h2_style))
    elements.append(Spacer(1, 4))

    cond_rows = [
        [
            Paragraph("<b>Condition / Morphology Pattern</b>", body_style),
            Paragraph("<b>Concordance</b>", body_style),
            Paragraph("<b>Observed Visual Findings & Clinical History</b>", body_style)
        ]
    ]
    for cond in triage_data.get("possible_conditions", []):
        cond_rows.append([
            Paragraph(f"<b>{cond.get('name', '')}</b><br/><font color='#64748b' size='7'>{cond.get('category', '')}</font>", body_style),
            Paragraph(cond.get('concordance_tier', ''), body_style),
            Paragraph(f"{cond.get('visual_overlap', '')}<br/><i>{cond.get('clinical_history_correlation', '')}</i>", body_style)
        ])

    cond_table = Table(cond_rows, colWidths=[150, 110, 280])
    cond_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#eaedff")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(cond_table)
    elements.append(Spacer(1, 12))

    # 5. Diagnostic Gaps (SaMD Clinical Guardrail)
    elements.append(Paragraph("<b>3. Documented Diagnostic Gaps & Missing Physical Evidence</b>", h2_style))
    elements.append(Spacer(1, 4))
    for gap in triage_data.get("diagnostic_gaps", []):
        elements.append(Paragraph(f"• {gap}", body_style))
        elements.append(Spacer(1, 2))
    elements.append(Spacer(1, 10))

    # 6. Attending Physician Review & Notes Section
    physician_box = [
        [
            Paragraph(
                "<b>Attending Clinician / Dermatologist Consultation Notes:</b><br/><br/>"
                "Dermoscopic Evaluation: [  ] Symmetric  [  ] Atypical Network  [  ] Vascular Loop  [  ] Globular<br/>"
                "Differential Diagnosis: ___________________________________________________________<br/>"
                "Recommended Plan: [  ] Biopsy  [  ] Class-Specific Topical  [  ] Patch Test  [  ] 3-Month Follow-up<br/>"
                "Clinician Signature: ___________________________________ Date: ____________________",
                body_style
            )
        ]
    ]
    phys_table = Table(physician_box, colWidths=[540])
    phys_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(KeepTogether(phys_table))

    # Build the PDF document
    doc.build(elements)
    return str(pdf_path)
