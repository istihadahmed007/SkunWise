# SkinWise AI — Frontend Application

Patient-facing dermatological symptom guidance and supportive triage web application built with **Next.js 14 App Router (TypeScript)**, **Tailwind CSS**, and **Lucide Icons**.

---

## 🧭 Application Structure & Routes

| Route | Purpose | Key Components & Accessibility |
| :--- | :--- | :--- |
| `/` | Landing page | Clear statement of what the app can and cannot do, trust badges, educational principles, primary CTA. |
| `/auth` | Authentication & Consent | Patient login/registration with required explicit biometric intake & non-diagnostic disclaimer consents. |
| `/dashboard` | Patient Portal | Quick stats, recent observation summary, UV index guidance, quick action navigation. |
| `/assess` | Assessment Intake | Interactive body location selector, camera/upload dropzone (`image/jpeg,image/png,image/webp`), real-time optical quality checks, and progressive symptom questionnaire with double-submit guard. |
| `/assessment/[id]` | Dossier & Guidance | Plain-language observations, uncalibrated visual pattern scores, recommended action timeline, diagnostic gaps, what to avoid, emergency modal, and authenticated PDF export. |
| `/records` | Observation History | Chronological list of past assessments with urgency badges, search/filter, and review links. |
| `/settings` | Privacy & Retention | Ephemeral photo deletion toggle ("Delete uploaded photo immediately after analysis"), retention schedule selection, full GDPR/HIPAA JSON data export, and account deletion. |
| `/referral` | Specialist Directory | Verified Bangladesh dermatology institutions and consultation clinics with contact details and direct dial. |

---

## ⚙️ Environment Variables

Configure environment variables in `frontend/.env.local` (or in Vercel project settings):

```env
# Backend API base URL (defaults to http://127.0.0.1:8000 if omitted)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## 📷 Supported Image Formats

- **Supported**: JPEG (`.jpg`, `.jpeg`), PNG (`.png`), WebP (`.webp`).
- **File Size Ceiling**: 25 MB max per upload (enforced via streaming chunk limit on backend).
- **HEIC / HEIF**: Rejected with an actionable error prompting the patient to convert to JPEG, PNG, or WebP before uploading.

---

## 🚀 Development & Build

### Clean Workspace Install
From the repository root:
```bash
npm install
# or for strict reproducible CI:
npm ci
```

### Development Server
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Linting & Production Build
ESLint and TypeScript validation are strictly enforced:
```bash
cd frontend
npm run lint
npm run build
```

---

## 👤 Standardized Demo Account
- **Email**: `sarah.jenkins@example.com`
- **Password**: `SkinWise2026!`
*(Seeding is enabled in development when `SEED_DEMO_DATA=true` in `backend/.env`)*
