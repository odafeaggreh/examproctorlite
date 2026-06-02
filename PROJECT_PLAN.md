# ExamProctorLite Project Plan

## 1. Purpose

This document is the working project plan for the ExamProctorLite rebuild.

It combines:

- product scope
- architecture decisions
- data model
- authentication and authorization strategy
- admin and student user flows
- UI conventions
- delivery phases

This file should be treated as the implementation reference for the current version of the project.

---

## 2. Project Summary

ExamProctorLite is being upgraded from a Google-Forms-driven exam runner into a private exam management platform for a single owner or a small internal team.

The platform must support:

- multiple exams running concurrently
- native exam creation and management
- direct student assignment and access-code redemption
- question bank and reusable questions
- objective auto-grading where allowed
- manual review for all short text answers
- admin-controlled result release
- reporting at platform, exam, and student level
- Resend-based email delivery

This is **not** a public SaaS platform and should not be overbuilt for multi-tenant subscription use cases.

---

## 3. Product Goals

### Primary goals

- Let admins create and manage exams directly in the platform.
- Let students log in, redeem access codes, and see their assigned exams.
- Support a safe and repeatable workflow for running real exams.
- Give admins visibility into results, grading, and reporting.

### UX goals

- Simple enough for non-technical staff.
- Premium, cohesive admin UI.
- Mobile-safe layouts even if exam administration is desktop-first.
- Strong guidance through tooltips and descriptive copy.

### Operational goals

- Server-side authorization for sensitive actions.
- Auditability for role changes and grading-related actions.
- Clear defaults so admins do not need to configure every detail manually.

---

## 4. Non-Goals

These are intentionally out of scope unless requirements change:

- multi-tenant organization support
- subscriptions, billing, or public self-service onboarding
- marketplace or exam storefront features
- advanced proctoring integrations
- deep role hierarchies beyond `student`, `admin`, `superAdmin`
- anonymous candidate flow without authenticated accounts

---

## 5. Current State

The current repository already contains early migration work toward the new platform:

- Next.js App Router application
- Firebase Auth for login/signup
- Firestore as primary database
- Firebase Admin SDK integration
- custom claims support and bootstrap tooling
- Shadcn-style component primitives
- admin shell/sidebar work in progress
- early `exams` CRUD scaffolding

Legacy assumptions that still need to be fully removed:

- single-exam flow
- Google Forms question dependency
- client-heavy exam result writing
- old admin dashboard patterns

---

## 6. Core Product Decisions

### Exam access

- Students must have authenticated accounts.
- Exams can be attached by:
  - CSV/email assignment
  - access-code redemption

### Question types

- `single_choice`
- `multiple_choice`
- `short_text`

### Grading rules

- `single_choice`: auto-gradable
- `multiple_choice`: auto-gradable
- `short_text`: always manual review

### Result release rules

Default behavior:

- exams default to admin-controlled release
- submission does **not** automatically expose results unless configured

Supported result release modes:

- `manual_release`
- `auto_release_on_submission`
- `release_after_review`

Constraint:

- if an exam includes short text questions, full auto-release must be blocked or warned against because manual review is required

### Access-code defaults

Platform-level defaults must exist for things like:

- `maxUses`
- expiry
- duration
- timezone
- shuffle settings
- result release mode

Admins can override defaults per exam.

### UI direction

- Shadcn-style UI system
- right-side Sheets for create/edit flows
- fewer separate create/edit pages
- clear tooltips anywhere the action may be ambiguous

---

## 7. Target Architecture

### Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Shadcn-style components
- Firebase Auth
- Firestore
- Firebase Admin SDK
- Resend
- Zod

### Architecture pattern

Follow the Next.js authentication guidance with:

- server-first authentication checks
- Data Access Layer (DAL)
- DTOs for exposed data shapes
- optional `proxy.ts` for route-level redirect support

### Application layers

#### UI layer

- App Router pages and layouts
- client components for interactions
- Shadcn-based UI components

#### Server application layer

- route handlers
- server auth checks
- domain-level orchestration

#### Data Access Layer

- Firestore reads and writes
- auth session verification
- report query composition

#### DTO layer

- safe shapes passed from DAL/server to UI
- prevents pages from depending directly on raw database payloads

#### Validation layer

- Zod for request payloads
- Zod for form payload normalization where needed

---

## 8. Authentication and Authorization

### Authentication

Users authenticate with Firebase Auth.

The application creates a secure server session cookie after login/signup using the Firebase ID token.

### Authorization source of truth

Authorization must be enforced using Firebase custom claims, not only Firestore role fields or client context.

### Supported roles

- `student`
- `admin`
- `superAdmin`

### Claims shape

Recommended claims:

```ts
{
  role: "student" | "admin" | "superAdmin",
  admin: boolean,
  superAdmin: boolean
}
```

### Enforcement layers

#### Server layout checks

- admin layout requires admin or super admin
- dashboard layout requires authenticated user

#### Protected route handlers

- verify session
- verify role claims
- reject unauthorized requests server-side

#### `proxy.ts`

Used only for lightweight redirect assistance:

- unauthenticated users away from protected areas
- redirect authenticated users away from login/signup

Do not rely on `proxy.ts` as the sole auth control.

### Admin bootstrap

The project includes a bootstrap script for creating/promoting admin users:

- script: `npm run admin:bootstrap`
- required env:
  - `FIREBASE_ADMIN_PROJECT_ID`
  - `FIREBASE_ADMIN_CLIENT_EMAIL`
  - `FIREBASE_ADMIN_PRIVATE_KEY`

### Firestore role field

Keep a `role` field in `users/{uid}` for app data visibility and admin UI, but custom claims remain authoritative for security.

---

## 9. Data Model

The following collections represent the target shape.

### `users/{uid}`

```ts
{
  uid: string
  name: string
  email: string
  role: "student" | "admin" | "superAdmin"
  status: "active" | "inactive"
  gdprConsent?: {
    accepted: boolean
    timestamp: string
    version: string
  }
  createdAt: string
  updatedAt: string
}
```

### `platformSettings/defaults`

```ts
{
  defaultAccessCodeMaxUses: number
  defaultAccessCodeExpiryDays: number
  defaultExamDurationMinutes: number
  defaultTimezone: string
  defaultResultReleaseMode: "manual_release" | "auto_release_on_submission" | "release_after_review"
  defaultShuffleQuestions: boolean
  defaultShuffleOptions: boolean
}
```

### `exams/{examId}`

```ts
{
  title: string
  description: string
  instructions: string
  status: "draft" | "published" | "archived"
  timezone: string
  durationMinutes: number
  passMark: number
  shuffleQuestions: boolean
  shuffleOptions: boolean
  maxAccessCodeUses: number
  gradingMode: "manual_review_default" | "auto_grade_objective"
  resultReleaseMode: "manual_release" | "auto_release_on_submission" | "release_after_review"
  hasManualReviewQuestions: boolean
  createdBy: string
  createdAt: timestamp
  updatedAt: timestamp
  publishedAt: timestamp | null
  startAt: timestamp | null
  endAt: timestamp | null
}
```

### `questionBank/{questionId}`

```ts
{
  type: "single_choice" | "multiple_choice" | "short_text"
  prompt: string
  options?: string[]
  correctAnswers?: string[]
  explanation?: string
  tags?: string[]
  difficulty?: string
  createdBy: string
  updatedAt: timestamp
}
```

### `exams/{examId}/questions/{examQuestionId}`

Snapshot of the question inside the exam:

```ts
{
  sourceQuestionId?: string
  type: "single_choice" | "multiple_choice" | "short_text"
  prompt: string
  options?: string[]
  correctAnswers?: string[]
  points: number
  required: boolean
  sectionId?: string
  order: number
}
```

### `examAccessCodes/{codeId}`

```ts
{
  code: string
  examId: string
  status: "active" | "disabled" | "expired"
  maxUses: number
  usedCount: number
  expiresAt: timestamp | null
  createdBy: string
  createdAt: timestamp
}
```

### `examAssignments/{assignmentId}`

```ts
{
  examId: string
  studentUid?: string
  studentEmail?: string
  assignmentType: "csv_import" | "access_code" | "manual"
  accessCodeId?: string
  assignedBy?: string
  assignedAt: timestamp
  status: "assigned" | "redeemed" | "revoked"
}
```

### `attempts/{attemptId}`

```ts
{
  examId: string
  studentUid: string
  assignmentId?: string
  status: "not_started" | "in_progress" | "submitted" | "pending_review" | "finalized" | "released"
  startedAt?: timestamp
  submittedAt?: timestamp
  autoSubmittedAt?: timestamp
  timeLimitMinutes: number
  autoScore?: number
  manualScore?: number
  score?: number
  percentage?: number
  requiresManualReview: boolean
  emailSent: boolean
  examSnapshot: object
  studentSnapshot: object
}
```

### `attempts/{attemptId}/answers/{answerId}`

```ts
{
  questionId: string
  questionType: "single_choice" | "multiple_choice" | "short_text"
  response: string | string[]
  isCorrect?: boolean
  autoPoints?: number
  manualPoints?: number
  finalPoints?: number
  reviewStatus?: "pending" | "reviewed"
  reviewedBy?: string
  reviewedAt?: timestamp
  feedback?: string
}
```

### `emailLogs/{emailLogId}`

```ts
{
  type: "invite" | "score" | "final_score"
  to: string
  examId?: string
  attemptId?: string
  status: "queued" | "sent" | "failed"
  provider: "resend"
  sentAt?: timestamp
  error?: string
}
```

### `auditLogs/{auditId}`

```ts
{
  actorUid: string
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
  createdAt: timestamp
}
```

---

## 10. Domain Rules

### Question snapshots

Published exams and attempts must preserve question snapshots.

Reason:

- later edits to the question bank must not alter historical attempts or scores

### Short text grading

- all short text answers require manual review
- short text presence sets `hasManualReviewQuestions = true`
- result release logic must respect that

### Access-code redemption

- a logged-in student redeems a code
- code maps the student to the exam
- exam becomes visible in the student dashboard

### Result release

- results are hidden by default
- release can happen manually
- release can happen after review
- objective auto-grade does not imply automatic student visibility

### Exam concurrency

The platform must allow:

- many active exams at once
- many students attached to different exams
- a student to have multiple upcoming/active/completed exams

---

## 11. Admin Experience

### Core modules

- Overview
- Exams
- Questions
- Students
- Results
- Reports
- Admins
- Settings

### Exams module

Primary responsibilities:

- create draft exam
- edit exam in right-side Sheet
- set instructions and schedule
- set duration and timezone
- set result-release behavior
- assign questions
- manage access codes
- assign students
- publish/unpublish/archive

### Questions module

- create questions manually
- import questions from CSV
- edit question bank
- reuse questions in multiple exams

### Students module

- import student rosters
- manually assign students to exams
- review access-code redemptions
- student-level history

### Results module

- review attempts
- drill into answers
- manual grading for short text
- finalize and release results

### Reports module

- platform summary
- exam summary
- student summary
- export support

### Tooltips

Tooltips should be added when:

- a setting has consequences that are not obvious
- a grading or release rule may confuse admins
- defaults can be overridden
- access-code behavior needs explanation

---

## 12. Student Experience

### Student flow

1. Student signs in or signs up.
2. Student redeems an exam access code or is pre-assigned by admin.
3. Student sees the exam in `My Exams`.
4. Student opens exam details and reads instructions.
5. Student starts the exam when the time window allows.
6. Answers autosave while the attempt is in progress.
7. Student submits.
8. Result stays hidden or pending review unless release rules allow visibility.

### Student dashboard sections

- Upcoming exams
- Available now
- Completed
- Pending review

### Student result behavior

The student does not automatically see results by default.

Possible states:

- submitted
- pending review
- released

---

## 13. Routes and UI Structure

### Admin routes

- `/admin`
- `/admin/exams`
- `/admin/exams/[examId]`
- `/admin/exams/[examId]/questions`
- `/admin/exams/[examId]/share`
- `/admin/exams/[examId]/results`
- `/admin/attempts/[attemptId]`
- `/admin/questions`
- `/admin/students`
- `/admin/students/[studentUid]`
- `/admin/reports`
- `/admin/manage-admins`

### Student routes

- `/dashboard`
- `/dashboard/redeem`
- `/dashboard/exams/[examId]`
- `/dashboard/attempts/[attemptId]`
- `/dashboard/results/[attemptId]`

### UI behavior

- create/edit actions should prefer Sheets where appropriate
- tables on smaller screens should stay contained in their own scroll area
- avoid shrinking the whole page just to fit wide tables

---

## 14. API / Route Handler Plan

### Auth

- `POST /api/auth/session`
- `DELETE /api/auth/session`

### Admin routes

- `POST /api/admin/exams`
- `PATCH /api/admin/exams/[examId]`
- `POST /api/admin/exams/[examId]/publish`
- `POST /api/admin/exams/[examId]/questions/import`
- `POST /api/admin/exams/[examId]/assignments/import`
- `POST /api/admin/exams/[examId]/access-codes`
- `GET /api/admin/exams/[examId]/results`
- `POST /api/admin/attempts/[attemptId]/grade`
- `POST /api/admin/attempts/[attemptId]/finalize`
- `POST /api/admin/attempts/[attemptId]/send-score`
- `POST /api/admin/users/[uid]/role`

### Student routes

- `POST /api/student/access-codes/redeem`
- `GET /api/student/exams`
- `POST /api/student/exams/[examId]/start`
- `PATCH /api/student/attempts/[attemptId]/autosave`
- `POST /api/student/attempts/[attemptId]/submit`
- `GET /api/student/attempts/[attemptId]/result`

### Email routes

- `POST /api/emails/send-invite`
- `POST /api/emails/send-score`
- `POST /api/emails/send-bulk-scores`

---

## 15. Validation Strategy

Zod is the standard validation layer.

Use Zod for:

- route handler request payloads
- form submission payloads
- query param normalization where needed

Validation should cover:

- exam creation/editing
- role update payloads
- access-code generation
- CSV import normalization
- grading payloads

---

## 16. Email Strategy

### Provider

- Resend

### Email types

- exam invite
- access-code delivery
- score release
- final-score release after review

### Logging

Every send should create or update an `emailLogs` record for:

- visibility
- retries
- troubleshooting

---

## 17. Reporting Strategy

### Platform-level

- total exams
- active exams
- total students
- total completed attempts
- pending manual reviews
- average score
- pass rate

### Exam-level

- assigned students
- redeemed codes
- started attempts
- completed attempts
- average score
- pass rate
- question difficulty stats

### Student-level

- assigned exams
- attempt history
- result release status
- score trend

---

## 18. Privacy and Data Handling

The platform may handle EU user data, so the design must include:

- consent messaging
- minimal and purposeful personal data use
- export/delete pathways for participant data

### Required features

- privacy note before exam start
- participant data export capability
- participant data deletion capability

---

## 19. UI and Design System Rules

This project should follow `design.md` as the visual design reference.

### Key principles

- premium, calm admin visuals
- clear hierarchy
- strong whitespace and spacing
- low-noise borders instead of heavy shadow use
- Shadcn-style components

### Important implementation notes

- use Sheet-based create/edit flows
- use groups in sidebars instead of cluttered separators where possible
- use tooltips when actions need extra explanation
- keep tables elegant but responsive through contained horizontal scrolling

---

## 20. Phased Delivery Plan

### Phase 1: Foundation

- auth session cookie flow
- Firebase Admin SDK
- custom claims
- DAL and DTO structure
- Zod validation
- admin layout and navigation system

### Phase 2: Exam management core

- `exams` collection
- create/edit draft exams
- platform defaults
- Sheet-driven exam management UI

### Phase 3: Question management

- question bank CRUD
- CSV import
- exam question assignment
- publish-safe snapshots

### Phase 4: Student assignment and access codes

- student import
- access-code generation
- code redemption
- exam assignment records

### Phase 5: Student exam runtime

- `My Exams` dashboard
- exam detail page
- attempt start
- autosave
- submit

### Phase 6: Grading and release

- objective auto-grading
- short text manual review
- finalize attempt
- release results

### Phase 7: Email and exports

- Resend integration
- invite emails
- score emails
- CSV export

### Phase 8: Reporting and hardening

- platform/exam/student reporting
- audit logs
- privacy tooling
- final UX polish

---

## 21. Risks and Watchouts

### Technical risks

- old single-exam assumptions still present in legacy pages
- Firestore rules may lag behind UI/server changes if not updated deliberately
- mixed client/server assumptions can cause auth drift if not standardized
- large tables and desktop-first layouts can degrade mobile usability

### Product risks

- too many optional features too early can slow delivery
- unclear result-release rules can confuse admins and students
- weak defaults can make setup feel too technical

### Mitigation

- keep scope disciplined
- build around defaults first
- enforce domain rules in the backend
- use tooltips and copy to explain sensitive settings

---

## 22. Immediate Next Priorities

Recommended next implementation steps:

1. Build the student-side `My Exams` and access-code redemption flow.
2. Implement attempt lifecycle and grading state transitions.
3. Add admin attempt review screens for manual-review answers.
4. Add result release and score-email flows.
5. Expand reporting with exam-level and platform-level aggregates.

Current admin exam status:

- `/admin/exams` provides the minimal exam list with publish/review actions.
- `/admin/exams/create` and `/admin/exams/[examId]/edit` manage exam content, settings, and question snapshots.
- `/admin/exams/[examId]` is now the exam overview page for setup details, candidate attempts, scores, and manual-review visibility.
- `/admin/candidates/[candidateId]/exams/[examId]` is the candidate-level exam result page for score snapshots, answer review, and release readiness.
- Candidate-result rows currently read from the planned `attempts` collection, with temporary dummy data in `/constants` while the student attempt flow is being designed.

---

## 23. Success Criteria

The project can be considered functionally successful when:

- an admin can create an exam without Google Forms
- an admin can assign students or generate access codes
- a student can redeem a code and see the correct exam
- a student can complete an exam in-platform
- objective questions can be auto-graded
- short text answers can be manually reviewed
- admins control when results become visible
- admins can email results through Resend
- admins can review platform, exam, and student performance

---

## 24. Reference Files

- visual design system: [design.md](/C:/Users/USER/OneDrive/Desktop/codes/exampro/design.md)
- admin layout: [layout.tsx](/C:/Users/USER/OneDrive/Desktop/codes/exampro/app/(admin)/layout.tsx)
- admin client wrapper: [admin-client-layout.tsx](/C:/Users/USER/OneDrive/Desktop/codes/exampro/components/admin/admin-client-layout.tsx)
- sidebar: [app-sidebar.tsx](/C:/Users/USER/OneDrive/Desktop/codes/exampro/components/app-sidebar.tsx)
- sidebar primitives: [sidebar.tsx](/C:/Users/USER/OneDrive/Desktop/codes/exampro/components/ui/sidebar.tsx)
- exam page: [page.tsx](/C:/Users/USER/OneDrive/Desktop/codes/exampro/app/(admin)/admin/exams/page.tsx)
- exam detail overview: [page.tsx](/C:/Users/USER/OneDrive/Desktop/codes/exampro/app/(admin)/admin/exams/[examId]/page.tsx)
- candidate exam result: [page.tsx](/C:/Users/USER/OneDrive/Desktop/codes/exampro/app/(admin)/admin/candidates/[candidateId]/exams/[examId]/page.tsx)
- exam overview: [exams-overview.tsx](/C:/Users/USER/OneDrive/Desktop/codes/exampro/components/admin/exams-overview.tsx)
