# RMC — Club Recruitment Page & Flow

## Overview

The **Ramanujan Math Club (RMC)** website (`/join`) currently has a **static form** that submits but does nothing — no data is saved, no email is sent, and admins have no way to see or manage applications.

This plan upgrades the entire recruitment experience end-to-end:

1. **Public page** (`/join`) — cinematic, multi-step application form with the Math Noir aesthetic.
2. **Backend** — a new `recruitment_applications` Supabase table + `recruitment_form_schema` for dynamic fields.
3. **Admin panel** — a new `/admin/recruitment` page for:
   - Reviewing, approving, or rejecting applicants
   - Opening/closing recruitment season (default: **open**)
   - **Building the application form** — add, remove, reorder, and configure fields dynamically
4. **Email notifications** — confirmation email to the applicant, alert to admin on new submission.
5. **Status-check portal** — `/join/status` for applicants to check their decision via email.

> **No fee payment involved** — the ₹100 subscription mentioned in the old form has been removed entirely.

---

## User Review Required

> [!IMPORTANT]
> **No Fee Payment** — Membership fee has been removed from the recruitment flow entirely.

> [!IMPORTANT]
> **Recruitment Season Toggle** — Admin-controlled open/close stored in `settings` table under key `recruitment_open`. **Default value: `true` (open)**. When closed, the `/join` page shows a "Recruitment Closed" state.

> [!WARNING]
> **Header Navigation**: Adding a "Join" nav item to the desktop and mobile nav in `Header.jsx`. This replaces or sits alongside the current "Gallery" last-item highlight treatment.

> [!IMPORTANT]
> **Dynamic Form Builder** — Admins can add/remove/reorder fields in the recruitment form. The form schema is stored in the `settings` table under key `recruitment_form_schema`. The public `/join` form renders fields dynamically based on this schema.

---

## Open Questions

> [!IMPORTANT]
> **Multi-step form** — Multi-step wizard with cinematic transitions (confirmed direction).

> [!IMPORTANT]
> **Unique applicant constraint** — One active (PENDING/APPROVED) application per email per academic year. Rejected applicants may re-apply.

> [!IMPORTANT]
> **Admin notifications** — Alert email sent to the club email address on every new submission.

---

## Proposed Changes

---

### 1. Database Layer

#### [NEW] `supabase/migrations/009_recruitment.sql`

**Table 1: `recruitment_applications`** — stores each submission

```sql
CREATE TABLE IF NOT EXISTS recruitment_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Core identity fields (always collected)
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    phone TEXT NOT NULL,
    branch TEXT NOT NULL,
    year TEXT NOT NULL,
    -- Dynamic field responses (JSONB — mirrors the form schema)
    extra_fields JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by TEXT,
    review_note TEXT,
    applied_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    academic_year TEXT NOT NULL DEFAULT '2025-26'
);
CREATE UNIQUE INDEX recruitment_unique_active
    ON recruitment_applications(email, academic_year)
    WHERE status IN ('PENDING', 'APPROVED');
```

**Settings keys used (in existing `settings` table):**

| Key | Type | Default | Purpose |
|-----|------|---------|--------|
| `recruitment_open` | `boolean` | `true` | Toggle recruitment on/off |
| `recruitment_form_schema` | `JSON array` | Default fields | Dynamic form field definitions |
| `recruitment_academic_year` | `string` | `"2025-26"` | Current year tag for applications |

**Form Schema Shape** (stored in `settings.value`):
```json
[
  { "id": "interests", "type": "checkbox", "label": "Areas of Interest",
    "options": ["Number Theory", "Algebra", "Geometry", ...], "required": false },
  { "id": "why_join", "type": "textarea", "label": "Statement of Purpose",
    "placeholder": "Why do you want to join RMC?", "required": true,
    "minLength": 100, "maxLength": 500 },
  { "id": "experience", "type": "text", "label": "Prior Math Experience",
    "placeholder": "Competitions, olympiads, etc.", "required": false }
]
```

**Supported field types:** `text`, `textarea`, `select`, `checkbox`, `radio`, `number`

RLS: Public (anon) can `INSERT`. Service role / admin JWT for `SELECT`, `UPDATE`.

---

### 2. API Routes

#### [NEW] `src/app/api/recruitment/apply/route.ts`

`POST` handler:
- Validate core fields (roll number format, 10-digit phone, email)
- Fetch `recruitment_open` and `recruitment_form_schema` from `settings`
- Reject if recruitment is closed
- Validate dynamic field responses against the schema (required checks, min/max length)
- Check for duplicate active application (by email + academic year)
- Insert to `recruitment_applications` with `extra_fields` JSONB for schema-driven answers
- Send confirmation email to applicant
- Send alert email to club admin
- Return `{ success, applicationId }`

#### [NEW] `src/app/api/recruitment/status/route.ts`

`GET ?email=` handler:
- Look up latest application by email
- Return `{ status, name, reviewNote, appliedAt }`

#### [NEW] `src/app/api/recruitment/schema/route.ts`

`GET` handler (public):
- Fetch `recruitment_form_schema` + `recruitment_open` from `settings`
- Returns the current form schema for dynamic rendering on `/join`

#### [NEW] `src/app/api/admin/recruitment/route.ts`

Admin-protected multi-method handler:
- `GET` → paginated list with filters (status, branch, year, search)
- `PATCH` → approve/reject with optional review_note

#### [NEW] `src/app/api/admin/recruitment/settings/route.ts`

Admin-protected:
- `GET` → return `recruitment_open`, `recruitment_form_schema`, `recruitment_academic_year`
- `PATCH` → update any of those settings (toggle open/closed, save new schema, change year)

---

### 3. Public Join Page — Full Overhaul

#### [MODIFY] `src/app/join/page.jsx` → server component that fetches schema, passes to client
#### [NEW] `src/components/recruitment/RecruitmentForm.jsx` — client component

**Architecture:**
- `page.jsx` (server) fetches `recruitment_form_schema` + `recruitment_open` at request time
- If closed → renders "Recruitment Closed" state (no form shown)
- Passes schema to `<RecruitmentForm />` which renders steps dynamically

**Fixed Steps (always present):**
1. **Signal Lock-On** — Name, Email, Phone
2. **Sector Classification** — Roll Number, Branch, Year

**Dynamic Steps (driven by form schema):**
3. **N...** — Each "section" group defined in the schema becomes a step (e.g., Interests, SOP, custom fields)

**Final Step (always last):**
- **Review & Transmit** — Shows all answers as a summary card before submission

**Visual Design (Math Noir):**
- Progress indicator — styled as a "signal frequency bar" with teal active step glow
- Animated step transitions using `framer-motion` (`AnimatePresence` slide left/right)
- `SpotlightCard` wrapping the form step panel
- Floating math symbols (`∑`, `∫`, `π`, `Δ`) as background ambience
- Submission triggers a cinematic "uplink" animation before showing confirmation card
- Mobile-responsive: full-width steps, touch-friendly inputs
- **No fee/payment section anywhere**

---

### 4. Application Status Page

#### [NEW] `src/app/join/status/page.jsx`

Simple "Signal Trace" page:
- Email input field
- Fetches from `/api/recruitment/status`
- Renders one of three states:
  - 🟡 **PENDING** — "Transmission received. Awaiting verification."
  - 🟢 **APPROVED** — "Access Granted. Welcome to the Collective." + membership details
  - 🔴 **REJECTED** — "Access Denied." + optional note from admin

---

### 5. Admin Recruitment Panel

#### [NEW] `src/app/admin/recruitment/` directory

**`page.jsx`** — Admin recruitment dashboard with 3 tabs:

**Tab 1: Applications**
- Stats row: Total / Pending / Approved / Rejected counts
- Filter bar: Search by name/email/roll, filter by branch, year, status
- Table of applications, click row to open side drawer
- Drawer shows all field responses + Approve / Reject buttons + note input

**Tab 2: Form Builder**
- Drag-and-drop (or up/down buttons) to reorder fields
- "Add Field" button — choose type (text, textarea, select, checkbox, radio, number), set label, placeholder, required toggle, options (for select/checkbox/radio)
- Edit existing fields inline
- Delete field button
- **Core fields (Name, Email, Phone, Roll Number, Branch, Year) are locked — cannot be removed**
- "Save Schema" button → `PATCH /api/admin/recruitment/settings`
- Live preview pane showing how the form step will look

**Tab 3: Settings**
- **Recruitment Open/Closed toggle** (default: open) — big prominent switch
- Academic year string input
- "Save Settings" button

**Visual:** Consistent with existing `admin/page.jsx` dark-slate style.

#### [MODIFY] `src/app/admin/AdminNav.jsx`

Add "Recruitment" link to the admin sidebar nav.

---

### 6. Navigation Update

#### [MODIFY] `src/components/layout/Header.jsx`

Add `{ href: '/join', label: 'Join' }` as a **highlighted CTA** nav item (similar treatment to current last-item teal highlight), optionally showing a "OPEN" badge during recruitment season.

---

### 7. Email Templates

#### [MODIFY] `src/lib/email.ts`

Add two new email functions:
- `sendRecruitmentConfirmation({ toEmail, name, applicationId })` — Math Noir styled HTML email, confirms receipt. **No mention of any fee.**
- `sendRecruitmentDecision({ toEmail, name, status, note })` — Approval or rejection email with next steps.

---

## Recruitment Flow Diagram

```
Applicant visits /join
        │
        ▼
 Multi-Step Form (5 steps)
        │
        ▼
 POST /api/recruitment/apply
        │
  ┌─────┴──────┐
  │            │
DUPLICATE   OPEN CHECK
ERROR       FAILED
  │            │
  └────────────┘
        │ success
        ▼
  Saved to Supabase
  recruitment_applications
        │
        ├──▶ Confirmation email → Applicant
        └──▶ Alert email → Club admin
        │
        ▼
 Confirmation UI (ticket-style card)
        │
        ▼
Applicant can check /join/status anytime
        │
        ▼
Admin reviews at /admin/recruitment
        │
  ┌─────┴──────┐
  │            │
APPROVE     REJECT
  │            │
  └────────────┘
        │
        ▼
PATCH /api/admin/recruitment
Updates status + review_note
        │
        ▼
Decision email → Applicant
```

---

## Verification Plan

### Automated Tests
- `npm run build` — ensure no TypeScript/lint errors
- Existing Vitest suite: `npm run test`

### Manual Verification
- [ ] Submit a test application → verify row appears in Supabase `recruitment_applications`
- [ ] Verify confirmation email received
- [ ] Check `/join/status` with test email shows PENDING
- [ ] Login to `/admin/recruitment`, approve test application
- [ ] Verify applicant status page shows APPROVED
- [ ] Test duplicate submission prevention (same email)
- [ ] Test with recruitment toggle OFF — form should show "Applications closed" state
- [ ] Verify mobile responsiveness of multi-step form.

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/009_recruitment.sql` | NEW | DB table + RLS |
| `src/app/api/recruitment/apply/route.ts` | NEW | Application submission API |
| `src/app/api/recruitment/status/route.ts` | NEW | Status lookup API |
| `src/app/api/admin/recruitment/route.ts` | NEW | Admin review API |
| `src/app/join/page.jsx` | MODIFY | Multi-step form overhaul |
| `src/app/join/status/page.jsx` | NEW | Status check portal |
| `src/app/admin/recruitment/page.jsx` | NEW | Admin recruitment dashboard |
| `src/app/admin/AdminNav.jsx` | MODIFY | Add Recruitment nav link |
| `src/components/layout/Header.jsx` | MODIFY | Add Join CTA to nav |
| `src/lib/email.ts` | MODIFY | Recruitment email functions |
