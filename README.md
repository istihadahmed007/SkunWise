# SkinWise AI — Supportive Dermatology Triage & Symptom Guidance

An informational, non-diagnostic skin health assessment web application built with **Next.js 14 App Router (TypeScript)**, **Tailwind CSS**, and **Python FastAPI**.

> [!WARNING]
> **IMPORTANT REGULATORY & CLINICAL SAFETY NOTICE**
> SkinWise AI is an educational and supportive symptom guidance prototype. It is **NOT** a certified medical device (SaMD), is **NOT** CE-marked under EU MDR, has **NOT** received FDA 510(k) clearance, and has **NOT** undergone formal external clinical trial audit. 
> 
> Automated unit test suites alone do not establish clinical safety. Before any real-world clinical deployment:
> 1. Intended use, clinical risk analysis (ISO 14971), and hazard controls must be formally defined with qualified dermatologists.
> 2. The computer-vision pipeline must be evaluated on an independent, representative dataset covering diverse Fitzpatrick skin phototypes (I through VI), real-world lighting variations, and artifact conditions.
> 3. Clinical sensitivity for urgent conditions (such as melanocytic atypia and acute dermatoses), model calibration, subgroup performance, and failure modes must be formally measured and documented.
> 4. Formal clinical governance, post-market surveillance, and change-control procedures must be implemented.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    User([Patient / User]) -->|HTTPS / TLS| FE[Next.js 14 App Router Frontend]
    FE -->|REST API + JWT Auth| BE[FastAPI Python Backend]
    
    subgraph Frontend [Next.js 14 Client]
        FE --> UI_A[Screen A: Landing & Education]
        FE --> UI_B[Screen B: Auth & Explicit Consent]
        FE --> UI_C[Screen C: User Dashboard]
        FE --> UI_D[Screen D/E: Body Map & Symptom Intake]
        FE --> UI_G[Screen G: Summary Dossier & Care Guidance]
        FE --> UI_H[Screen H: Observation History]
        FE --> UI_I[Screen I: Ephemeral Photo Storage Settings]
        FE --> UI_J[Screen J: Specialist Referral Directory]
    end

    subgraph Backend [FastAPI Services]
        BE --> AuthServ[Auth & Consent Service]
        BE --> ImgVal[Streaming Validation & EXIF Sanitization]
        BE --> OpticQ[Laplacian & Photometric Quality Gating]
        BE --> VisEngine[Vision Model Adapter & Morphometry]
        BE --> TriageEng[Rule-Based Safety Triage Engine]
        BE --> RecEng[Guideline Knowledge Base RAG]
        BE --> PDFGen[Clinical Summary Dossier Engine]
    end

    subgraph Storage [Secure Persistence & Storage]
        BE --> DB[(SQLite / PostgreSQL via SQLAlchemy)]
        BE --> PrivStore[Private Image Store / Ephemeral Deletion]
    end
```

---

## 🩺 Operational Principles

1. **Informational Triage, Non-Diagnostic Decision Support**:
   - Designed to provide supportive general skincare guidance and assist patients in preparing for in-person doctor visits.
   - It does **not** provide definitive diagnoses, prescriptions, or replace in-person medical consultations.
2. **Deterministic Emergency Precedence**:
   - Clinical red flags (anaphylaxis signs, facial/lip swelling, respiratory distress, petechiae, fever with rapidly spreading rash, widespread peeling skin) trigger immediate emergency escalation.
   - Emergency signs take **absolute precedence** over visual pattern observations.
3. **Optical Viability Quality Gating**:
   - Submitted photographs undergo quality checks before analysis:
     - **Focus / Sharpness**: Laplacian variance threshold ($\ge 50.0$).
     - **Lighting / Illumination**: Photometric perceived luminance ($\ge 35.0$ lux equivalent).
     - **Specular Flash Glare**: Glare ratio ceiling ($\le 18\%$).
   - Blurry or underexposed imagery triggers explicit user guidance rather than speculative classifications.
4. **Heuristic Visual Pattern Scores (Not Calibrated Probabilities)**:
   - Visual pattern scores represent uncalibrated heuristic similarity from an experimental multimodal vision model, not clinically validated disease probabilities. When visual models are unavailable, the system reports an explicit inconclusive state.
5. **Ephemeral Photo Deletion & Privacy Controls**:
   - Optional ephemeral image mode permanently deletes the uploaded photo file from disk immediately after visual feature extraction, retaining only non-image symptom responses and care guidance.
   - EXIF metadata (GPS coordinates, camera identifiers, timestamps) is stripped upon intake.
   - Full patient self-service data export (`GET /api/skin/export/complete`) and account deletion.
6. **Traceable Care Guidance**:
   - Self-care guidance references accredited educational dermatology literature: **American Academy of Dermatology (AAD)**, **British Association of Dermatologists (BAD)**, and **DermNet NZ**.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** v18+ and `npm`
- **Python** 3.10+ (or Python 3.12 with `uv`)

### Automated Launch (Windows PowerShell)
Run the all-in-one launcher script:
```powershell
.\start.ps1
```
This automatically boots:
- **FastAPI Backend**: `http://127.0.0.1:8000` (Swagger docs at `/docs`)
- **Next.js Frontend**: `http://localhost:3000`

---

### Manual Launch

#### 1. Backend Setup (FastAPI)
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database initialization and test suite
python -m pytest app/tests

# Start the API server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup (Next.js 14)
```bash
cd frontend

# Install node modules
npm install

# Build production bundle
npm run build

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Test Suite

The backend includes a comprehensive pytest suite verifying critical clinical and security requirements:

| Test File | Verification Area |
|---|---|
| `test_auth.py` | Password hashing, JWT auth, biometric consent enforcement |
| `test_image_quality.py` | Laplacian sharpness, lux levels, and specular flash glare gating |
| `test_triage_escalation.py` | Emergency red flag override over reassuring AI confidence |
| `test_ml_evaluation.py` | Morphometric ABCDE calculation, entropy, and out-of-distribution handling |
| `test_assessments_api.py` | End-to-end multipart intake, triage, and patient self-deletion |

Run tests:
```bash
cd backend
.venv\Scripts\python.exe -m pytest app/tests -v
```

---

## 📋 Demonstration Account (Development Only)

In development environments, demonstration data can be enabled by setting `SEED_DEMO_DATA=true` in `backend/.env` (disabled by default in production for patient privacy and security):
- **Email**: `sarah.jenkins@example.com`
- **Password**: `SkinWise2026!`
- **Role**: Patient with verified consent and sample baseline clinical assessments.

---

## 🔒 Production Deployment & Security Requirements

Before deploying to production (e.g. Vercel, Railway, AWS, Docker):
1. **Durable Database**: Configure a managed PostgreSQL database via `DATABASE_URL` (e.g. `postgresql://user:pass@host:5432/skinwise`). Ephemeral SQLite in `/tmp` is strictly rejected in production to prevent patient record loss.
2. **Cryptographic Secrets**: Provide a high-entropy `SECRET_KEY` ($\ge 32$ characters) and an independent `WORKER_SECRET` ($\ge 32$ characters) for background retention jobs.
3. **AI Vision Configuration**: Provide `GEMINI_API_KEY` for the primary multimodal vision pipeline. Optionally set `ENABLE_HUGGINGFACE_FALLBACK=true` and provide `HF_TOKEN` for evaluated DINOv2 backup classification.
4. **Environment Detection**: Set `ENVIRONMENT=production` (Vercel deployments automatically detect `VERCEL_ENV=production`). Fail-closed checks enforce valid security credentials before serving traffic.

