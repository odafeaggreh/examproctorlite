# ExamProctorlite - Visual Design Specification (`design.md`)

This document is the single source of truth (SSOT) for all design decisions, token values, styling properties, and component standards for the **ExamProctorlite Admin Dashboard** overhaul. 

Our core objective is to deliver a dashboard experience that feels **stunningly premium, clean, functional, and highly cohesive**, matching the aesthetic of the reference dashboard while keeping it optimized for administrative operations.

---

## 🎨 1. Core Visual Token System

### A. Color Palette
We utilize a highly curated, harmonious color system to avoid generic tones and establish a professional visual brand:

| Token Name | Hex Code | Visual Application |
| :--- | :--- | :--- |
| **Slate Background** | `#F8FAFC` | Page backdrop. Gives depth to white card elements. |
| **Card White** | `#FFFFFF` | Core container surfaces. |
| **Core Blue (Primary)** | `#2563EB` | Active states, primary navigation, primary chart bars, and positive trends. |
| **Core Green (Success)** | `#10B981` | Published badges, correct answers, high-grade progress tracks. |
| **Core Orange (Warning)** | `#F59E0B` | Draft badges, pending tasks, middle-tier metrics, warnings. |
| **Slate Gray (Muted)** | `#64748B` | Subtitles, helper text, and secondary stats. |
| **Soft Border** | `#F1F5F9` | ambient divider lines and container borders. |

---

### B. Shadows & Spatial Depth
We avoid flat or harsh borders in favor of soft, ambient light sources that raise elements off the page:

* **Stat & Container Cards:**
  ```css
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.03), 
              0 1px 3px rgba(0, 0, 0, 0.01);
  ```
  *Tailwind equivalent:* `shadow-[0_10px_30px_-10px_rgba(0,0,0,0.03),_0_1px_3px_rgba(0,0,0,0.01)]`
* **Sidebar Panel & Headers:**
  ```css
  box-shadow: 1px 0 0 0 #F1F5F9; /* Clean right-border separator instead of shadow */
  ```

---

### C. Rounding & Corners (Border Radius)
Generous curves soften the interface and make it look clean:

* **Dashboard Main Cards:** `20px` to `24px` (`rounded-3xl` / `rounded-[20px]`)
* **Tables & Forms:** `12px` to `16px` (`rounded-xl` / `rounded-2xl`)
* **Badges, Buttons, & Navigation Pills:** fully rounded pill layout (`rounded-full`)

---

## 🔤 2. Typography & Headings

### A. Font Families & Global Rendering
* **Font Family Stack:** Modern sans-serif stack (`Inter`, system-ui, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`, `sans-serif`).
* **Smoothing:** `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;` to ensure crisp pixel rendering on high-resolution and standard screens.

### B. Typographic Hierarchy & Heading Styles
Every heading and text block follows a strict typography scale:

| Level | Size | Weight | Tracking (Letter Spacing) | Colors (Tailwind) | Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Header (H1)** | `1.75rem` / `28px` | `semibold` (600) | `-0.02em` | `text-slate-900` | Primary dashboard / workspace headers. |
| **Section Title (H2)** | `1.25rem` / `20px` | `semibold` (600) | `-0.01em` | `text-slate-900` | Card headers, table sections, chart titles. |
| **Widget Title (H3)** | `1.125rem` / `18px` | `medium` (500) | `normal` | `text-slate-800` | Inner card labels, sub-widget groupings. |
| **Table Head / Tag (H4)** | `0.75rem` / `12px` | `semibold` (600) | `+0.05em` (uppercase) | `text-slate-400` | Table headers, badge labels, muted meta. |
| **Body (Default)** | `0.875rem` / `14px` | `regular` (400) | `normal` | `text-slate-600` | General descriptive text, row contents. |
| **Subtext / Captions** | `0.75rem` / `12px` | `regular` (400) | `normal` | `text-slate-400` | Secondary notes, helper text below inputs. |

### C. Large Display Metrics
For cards displaying percentages and numeric scores:
* **Metric Numbers:** `2.25rem` / `36px` to `2.5rem` / `40px` size, weight `bold` (700) or `semibold` (600), color `text-slate-900` (or white `#FFFFFF` inside primary gradients).

---

## 📏 3. Spacing, Padding & Margins
We maintain proportional layout relationships based on a standardized 4px/8px baseline grid:

### A. Container Spacing
* **Page Gutter:** `2rem` / `32px` padding (`p-8` or `px-8 py-6`) to isolate pages from the sidebar.
* **Card Inner Padding:**
  - **Large Widgets (Charts, Tables):** `1.5rem` / `24px` padding on all sides (`p-6`).
  - **Small Metric Cards:** `1.25rem` / `20px` padding on all sides (`p-5`).
* **Table Rows:** `1rem` / `16px` vertical, `1.5rem` / `24px` horizontal padding (`px-6 py-4`).

### B. Element Gaps & Gutters
* **Main Grid Gutters:** `1.5rem` / `24px` space between elements (`gap-6`).
* **Metric Rows Gaps:** `1rem` / `16px` space between metric cards (`gap-4`).
* **Stack Flow:** `1.5rem` / `24px` spacing for consecutive top-level page elements (`space-y-6`).

---

## ✏️ 4. Borders, Dividers & Outlines

### A. Border Styles
* **Card & Panel Borders:** `1px` solid width, styled with Soft Slate Gray (`#F1F5F9` or `border-slate-100`).
* **Form Field Borders:** `1px` solid, neutral-light border (`#E2E8F0` or `border-slate-200`).

### B. Dividers
* Horizontal separators use `1px` solid `#F1F5F9` with standard margin alignment to separate sections elegantly without adding clutter.

### C. Active Focus & Rings
We enforce accessible keyboard and pointer focus states across all interactive elements:
* **Input Focus State:** A clean border color shift to Primary Blue, paired with an subtle ambient ring overlay:
  ```css
  border-color: #2563EB;
  box-shadow: 0 0 0 1px #2563EB;
  ```
  *Tailwind equivalent:* `focus:border-blue-500 focus:ring-1 focus:ring-blue-500`
* **Button Focus State:** A glowing outline with offset spacer:
  *Tailwind equivalent:* `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`

---

## 🧭 5. Interactive States & Transitions
* **Transition Scale:** All hover, active, focus, and open states must utilize smooth transitions to make the interface feel alive:
  - **Duration:** `150ms` to `200ms` (`duration-200`).
  - **Timing Function:** `cubic-bezier(0.4, 0, 0.2, 1)` (`ease-in-out`).
* **Hover Scale Effects:** Buttons and interactive cards feature subtle elevation shifts on hover:
  - Cards: `hover:-translate-y-[2px] hover:shadow-md transition-all duration-200`.
  - Buttons: background color shifts (e.g. `bg-blue-600 hover:bg-blue-700`).

---

## 📐 6. Page Layout & Grid System

The admin dashboard is structured into a clean, desktop-focused split-layout:

* **Layout Split:** A permanent sidebar navigation docked left (`280px` width) and a wide main workspace on the right (`flex-1` with padding `p-6` to `p-8`).
* **Grid Sections:**
  * **Top Metrics Row:** A 4-column grid (or 1 wide gradient card + 3 secondary metric cards).
  * **Middle Analytics Row:** A 2-column split (65% width for the main bar chart, 35% width for the donut chart).
  * **Bottom Roster Row:** A 2-column split (65% width for the recent exams table, 35% width for the top performers list).

---

## 🧭 7. Component Specifications

### A. Sidebar Navigation Panel
We maintain the sidebar model but modernize it:
* **Brand Header:** A large, elegant text placeholder **"ExamProctorlite"** in semibold text, styled with tracking-wide and a clean custom SVG dashboard outline icon.
* **Menu Items:**
  * Rendered as rounded pills (`rounded-xl` or `rounded-full`).
  - **Active State:** Light secondary gray or soft-blue background with Core Blue text and icon (`bg-blue-50/50 text-blue-600 font-medium`).
  - **Inactive State:** Ghost style (`text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors`).
* **Footer Profile Panel:** Spaced away at the very bottom, presenting admin details on a soft slate background card (`bg-slate-50 border border-slate-100 rounded-2xl p-4`).

---

### B. Dashboard Stat Cards
* **1. Average Score Card (Primary Hero Gradient):**
  * Spans 2 grid columns on wide screens.
  - **Aesthetics:** A premium radial mesh gradient background fading from Core Blue (`#2563EB`) to `#1E40AF` (Royal Blue) with an organic glasslike light-wave pattern.
  - **Typography:** Bold, clean white values (`85%`) alongside crisp contrast descriptions.
  - **CTA Action:** An elegant glassmorphism button ("Review Attempts →") styled with a blurry transparent backdrop (`bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all`).
* **2. Secondary Stat Cards:**
  - **Aesthetics:** Clean white backgrounds, thin slate border, and soft ambient shadow.
  - **Icon Box:** A neat small container box showing relevant icons (MUI icons or Lucide icons) colored with their respective context (e.g. green checkmark for completed, orange circle for ongoing).

---

### C. SVG & NPM-Backed Charts
We integrate an interactive charting package (such as `recharts`) styled with our exact theme spec:

* **1. Subject Performance Overview (Stacked Bar Chart):**
  - **Backdrop:** Vertical/horizontal soft gray gridlines.
  - **Bars:** Capsule styling (`radius={[10, 10, 0, 0]}`) representing Attempts (Blue) stacked with Correct Answers (Green).
  - **Backing Tracks:** Semi-transparent gray background tracks behind each bar to represent overall scaling, mimicking the reference image.
* **2. Question Summary (Donut Chart):**
  - **Aesthetics:** A clean hollow donut ring with standard segment strokes: Correct (Core Blue), Wrong (Indigo/Slate-Blue), Skipped (Light Gray-Blue).
  - **Center Text:** Absolute-centered stacked typography displaying the global total (e.g., `800` in `3xl font-bold` and `Total` in `sm text-slate-500`).
  - **Legends:** Dynamic side list displaying actual values and percentages (e.g., "Correct: 624 (85%)") with colored bullet dots.

---

### D. Recent Exams Roster Table
* **Header Style:** Soft slate background (`bg-slate-50/70`) with capitalized medium-weight header tags (`text-slate-400 font-semibold tracking-wide text-xs px-4 py-3`).
* **Row Hover States:** Rows have soft border separations and transition beautifully on hover (`hover:bg-slate-50/50 transition-colors`).
* **Custom Score Columns:** Instead of standard text scores:
  - **Visual Indicator:** A clean horizontal loading-style bar showing score percentage (height `6px`, rounded corners, trailing percentage value).
  - **Contextual Colors:** High scores (>75%) are success green, average scores (50%-75%) are warning orange, below pass rate (<50%) are soft red.
* **Badges:** Custom pill badges for status:
  - `"published"`: Green theme (`bg-emerald-50 text-emerald-700 border-emerald-100 border`).
  - `"draft"`: Orange theme (`bg-amber-50 text-amber-700 border-amber-100 border`).
  - `"archived"`: Gray theme (`bg-slate-100 text-slate-600 border-slate-200 border`).

---

### E. Action Header Bar
* **Main Title:** "Dashboard Overview" with description "Quickly see your progress, strengths, and improvement areas."
* **Primary Action Button ("Create exam"):**
  - Placed top-right, aligned with the dashboard headers.
  - Styled as a highly modern, solid blue pill button (`bg-blue-600 text-white hover:bg-blue-700 rounded-full px-5 py-2.5 font-medium shadow-sm flex items-center gap-2`).

---

## 🛠️ 8. Form Controls & Modal Sheets
For our modal creation/editing sheets (`CreateExamSheet`, `EditExamSheet`):
* **Outline Inputs:** Inputs utilize clear outline borders (`border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl`).
* **Segmented Options:** Select fields and dropdown options are customized with clean background colors and spacing.
* **Overlays:** Dark backdrop overlays are blurred (`backdrop-blur-sm bg-slate-900/40`) to maintain focus on open dialogs.
