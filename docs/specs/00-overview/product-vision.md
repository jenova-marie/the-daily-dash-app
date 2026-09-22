# Product Vision — The Daily Dash

**Area:** overview · **Level:** 0 · **Status:** draft

**Tag summary:** Implemented 53 · Described 21 · Partial 6

**Sources owned:** none (synthesis). Every statement below is quoted from, or points into, a feature or architecture spec that owns the cited source.
**Sources referenced:** `src/pages/LandingPage.jsx`, `src/pages/UserManual.jsx`, `src/pages/Auth.jsx`, `src/pages/AcceptTerms.jsx`, `src/components/Layout.jsx`, `base44/config.jsonc`, `package.json` → `20-features/app-shell`, `20-features/user-manual`, `10-architecture/auth-and-account.md`, `00-overview/legal-copy.md`; every `20-features/*/spec.md` §1 for the claim ledger.

This document answers three questions about the prototype as it is: what it says it is, who the evidence says it is for, and which of its promises the code keeps. It quotes the marketing and manual copy verbatim, then maps every promise to the spec that specifies it.

## 1. What the product is

### 1.1 Two names, one product

- The product is called **The Daily Dash** on the landing page brand mark, the landing footer, the terms gate heading, the reset-password page, and the manual's support block `[Implemented]` `src/pages/LandingPage.jsx:28,74`, `src/pages/AcceptTerms.jsx:78`, `src/pages/ResetPassword.jsx` (title, per `10-architecture/auth-and-account.md` §4), `src/pages/UserManual.jsx:522`.
- Inside the app it is called **Dash it, Dash it ALL!** in the sidebar title, the manual's overview paragraph, and the manual's tagline `[Implemented]` `src/components/Layout.jsx:170`, `src/pages/UserManual.jsx:14,496`.
- Three further identities exist in configuration: the document title "Base44 APP", the platform app name "The Daily Dash APP", and the package name `base44-app` `[Implemented]` `index.html:8`, `base44/config.jsonc:2`, `package.json:2` (D-952, Q-952 in `20-features/app-shell`).
- The corpus uses **The Daily Dash** as the product name and **Dash it, Dash it ALL!** as the in-app name (`README.md`).

### 1.2 The landing page, verbatim

All rows `[Described]` `src/pages/LandingPage.jsx` (behaviour of the page: `20-features/app-shell` §0.3).

| Element | Text | Citation |
|---|---|---|
| Brand | "The Daily Dash" | `:28` |
| Nav button | "Sign In" | `:29` |
| Eyebrow | "Your personal command center" | `:34` |
| Hero | "Organize your day." / "Master your life." | `:36` |
| Subhead | "The Daily Dash brings your schedule, tasks, goals, and reflections into one beautiful, distraction-free space." | `:39` |
| Hero call to action | "Get Started — It's Free" | `:42` |
| Features heading | "Everything you need in one place" | `:49` |
| Closing heading | "Ready to take control of your day?" | `:66` |
| Closing line | "Join The Daily Dash and start building better daily habits." | `:67` |
| Closing call to action | "Start Now" | `:68` |
| Footer | "© {current year} The Daily Dash. All rights reserved." · "Privacy Policy" · "Terms of Use" | `:74-78` |

The eight feature blurbs, verbatim `[Described]` `src/pages/LandingPage.jsx:7-14`:

1. **Smart Scheduling** — "Sync with Google Calendar, manage daily schedules, and organize time-blocked activities in one place."
2. **Task Management** — "Create, organize, and track recurring or one-time tasks with priorities, due dates, and category labels."
3. **Chore Manager** — "Assign household chores to family members, set frequencies, and track completion — with AI-generated chore ideas tailored to age and room."
4. **AI Meal Planning** — "Generate age-appropriate meal ideas for Breakfast, Lunch, Dinner, or Snacks — perfect for kids ages 3 and up through adults."
5. **Vision Board** — "Build your wellness vision with health pillar tracking, daily evaluations, slideshows, and progress reviews."
6. **Google Integration** — "Seamlessly sync Google Calendar, Google Tasks, and Google Drive for unified productivity."
7. **Daily Reflection** — "Start each day with an inspiring AI-generated quote, personal affirmations, and vision-focused slideshows."
8. **Private & Secure** — "Your data is yours. We take privacy seriously and keep your information safe with encrypted storage."

Every landing call to action leads to the sign-in screen; the feature cards are static text `[Implemented]` `src/pages/LandingPage.jsx:20-22,29,41-43,51-60,68` (`20-features/app-shell` BR-SHELL-16).

### 1.3 The manual's own statement, verbatim

- Overview paragraph `[Described]` `src/pages/UserManual.jsx:14`:

  > **Dash it, Dash it ALL!** is a personal productivity dashboard designed to keep your whole life organized in one place. It brings together your schedule, tasks, chores, education plans, goals, daily checklist, motivational quotes, and saved links — all with optional Google Calendar and Google Tasks sync.

- Tagline `[Implemented]` `src/pages/UserManual.jsx:496`: "Everything you need to know about using Dash it, Dash it ALL!"
- Dashboard walkthrough step 1 restates the framing `[Described]` `src/pages/Dashboard.jsx:45`: "Your personalized dashboard shows everything at a glance—weather, daily checklist, schedule, tasks, goals, and your daily quote. It's your command center for a productive day."

## 2. Who it is for

The persona below is assembled from what the entities, copy, and defaults assume, not from any user research in the repository.

### 2.1 A single account owner

- Every entity except `User` restricts create, read, update and delete to rows whose creator is the signed-in account; nothing in the model represents a second login sharing data `[Implemented]` `10-architecture/auth-and-account.md` AR-AUTH-07, `10-architecture/domain-model.md` §2.
- The terms gate calls the product "a personal productivity application" `[Described]` `src/pages/AcceptTerms.jsx:115` (`00-overview/legal-copy.md` §4).
- Exports (print and email) are addressed only to the account owner; no other recipient can be entered `[Implemented]` `10-architecture/export-print-email.md` AR-EXPORT-01.

### 2.2 …who runs a household

- **Household members** are named records with a colour, created on the Chores page ("Household Members") and the Goals page ("Manage Family Members"); they are assignees and filing labels, not logins `[Implemented]` `base44/entities/ChoreUser.jsonc:5-13`, `20-features/chores/spec.md` §4.1, `20-features/goals/spec.md` §4 "Household members", `00-overview/glossary.md` (household member).
- The landing page and the Goals page say "family members" for the same records `[Described]` `src/pages/LandingPage.jsx:9`; `[Implemented]` `src/pages/Goals.jsx:515-528`.
- Chores carry rooms, frequencies, and a weekly menu; the printed chore sheet and meal sheet are built per member and per weekday for the fridge `[Implemented]` `20-features/chores/spec.md` §4.2, `20-features/chores/meal-planning.md` §4, `10-architecture/export-print-email.md` §3a.
- The Dashboard's Menu & Chores widget lists the rest of the week's meals and today's chores grouped by member `[Implemented]` `20-features/chores/meal-planning.md` §4 "Dashboard".

### 2.3 …possibly with homeschool learners

- **Learners** are named records with a grade level; each learner gets one plan per subject and assignments and activities under it `[Implemented]` `base44/entities/Learner.jsonc:1-35`, `20-features/education/spec.md` §4.2, §4.3.
- The manual frames the feature as "homeschool, tutoring, or extracurricular learning for multiple learners" `[Described]` `src/pages/UserManual.jsx:230`.
- Age groups run from "Preschool (3-5)" to "18+" in the activity generator and from `3-5` to `Adult` in the chore and meal generator `[Implemented]` `src/components/ActivityGenerator.jsx:13`, `src/components/ChoreGenerator.jsx:12` (`10-architecture/ai-services.md` §2a, §3a); the landing page says "kids ages 3 and up through adults" `[Described]` `src/pages/LandingPage.jsx:10`.
- The whole visible weekly education schedule prints and emails as a sheet with checkboxes `[Implemented]` `20-features/education/spec.md` §4.13, `10-architecture/export-print-email.md` §3b.

### 2.4 …with a wellness focus

- A fresh account is seeded with thirteen **pillars** ordered by Maslow's hierarchy and five activities per pillar `[Implemented]` `src/pages/VisionBoard.jsx:27-47,78-87`, `src/components/visionboard/PillarManager.jsx:10-24,45-74` (`20-features/vision-board/spec.md` BR-VB-01, `health-pillars.md` BR-VB-PIL-04).
- The **daily evaluation** rates every visible pillar 1–5, records one gratitude, and turns low-rated areas into goals `[Implemented]` `20-features/vision-board/daily-evaluation.md` BR-VB-EVAL-03..09.
- Low ratings steer the Dashboard "Focal Areas" widget, the affirmation shortcuts, and the Auto-Generated slideshow `[Implemented]` `10-architecture/ai-services.md` AR-AI-10.
- The landing page frames this as "Build your wellness vision" `[Described]` `src/pages/LandingPage.jsx:11`.

### 2.5 …who may or may not use Google

- Sign-up asks "How would you like to get started?" and offers "Connect Google Account" or "Use Independently" `[Implemented]` `src/pages/Auth.jsx:290-341` (`10-architecture/auth-and-account.md` AR-AUTH-01).
- The manual calls Google Calendar and Google Tasks sync "optional" `[Described]` `src/pages/UserManual.jsx:14`.

### 2.6 …and who reads on paper

- Fifteen surfaces offer print and/or email; every one renders the same HTML for both channels and emails it to the account owner's own address `[Implemented]` `10-architecture/export-print-email.md` §3, AR-EXPORT-01..04.
- The Daily Schedule asks whether to print the schedule and the to-do "together"; the Chores page asks for a note to print under the sheet heading `[Implemented]` `10-architecture/export-print-email.md` §4b, §4c.

## 3. The problem it addresses and the benefits it promises

### 3.1 The problem, in the product's words

- Fragmentation: the landing subhead promises to bring "schedule, tasks, goals, and reflections into one beautiful, distraction-free space", and the manual to "keep your whole life organized in one place" `[Described]` `src/pages/LandingPage.jsx:39`, `src/pages/UserManual.jsx:14`.
- Habit-building: "start building better daily habits" `[Described]` `src/pages/LandingPage.jsx:67`.
- Household coordination: "keeping everyone accountable" `[Described]` `src/components/onboarding/ChoresOnboarding.jsx:29` (quoted in `20-features/chores/spec.md` §9).

### 3.2 How the prototype answers it

- **One table for every time-boxed thing.** Google events, Calendar-page events, tasks, milestone tasks, and custom blocks all become schedule items, read by four views `[Implemented]` `10-architecture/schedule-hub.md` AR-HUB-01, §4.
- **One landing page for the day.** The Dashboard mounts eight widgets (weather, focal areas, checklist, schedule, tasks, menu and chores, goals, quote) in an order that follows the account `[Implemented]` `20-features/dashboard/spec.md` §4.2, BR-DASH-04.
- **Date-keyed routines.** Checklist ticks, chore completions, evaluations, gratitude and quotes are all stored per date, so each morning starts clean without a reset action `[Implemented]` `20-features/daily-checklist/spec.md` BR-CHK-09, `20-features/chores/spec.md` BR-CHORE-15, `20-features/vision-board/spec.md` BR-VB-04, `20-features/quotes/spec.md` BR-QUOTE-01.
- **Suggestions on tap, decisions by hand.** Seven AI touchpoints exist and none writes a suggestion without a review step `[Implemented]` `10-architecture/ai-services.md` AR-AI-01, §1.
- **Free.** The hero call to action reads "Get Started — It's Free"; no plan, subscription, or payment entity exists among the thirty entities, and the two payment packages in the dependency list are imported nowhere `[Described]` `src/pages/LandingPage.jsx:42`; `[Implemented]` `10-architecture/domain-model.md` §1, `20-features/app-shell/spec.md` §11 ("Dependencies with no product intent").

## 4. Claims ledger

Every landing blurb and every manual section's headline promise, mapped to the spec that specifies it. The tag is the dominant tag of the promise as a whole; the evidence line names the rule or the discrepancy that decides it.

### 4.1 Landing page blurbs

| # | Blurb | Specified in | Dominant tag | Evidence |
|---|---|---|---|---|
| L1 | Smart Scheduling | `20-features/calendar`, `20-features/daily-schedule`, `10-architecture/google-sync.md` §4, `10-architecture/schedule-hub.md` | `[Implemented]` | Calendar import `syncGoogleCalendarToApp` (google-sync §4a); item library drops tasks and milestone tasks onto the hour grid (item-library.md BR-SCHED-76..79); one table for all sources (AR-HUB-01). |
| L2 | Task Management | `20-features/tasks` | `[Implemented]` | Create with priority, due date and time, label, recurrence pattern (tasks §4.2); recurring tasks create their next occurrence on completion (`recurrence.md` §3). |
| L3 | Chore Manager | `20-features/chores`, `chores/ai-generator.md`, `10-architecture/ai-services.md` §2 | `[Implemented]` | One chore row per assigned member (BR-CHORE-10); next due from completion (BR-CHORE-13); generator takes room, age group, type and quantity (ai-services §2a). "Overdue … highlighted" on the Chores page is `[Described]` only (BR-CHORE-16, D-104). |
| L4 | AI Meal Planning | `20-features/chores/meal-planning.md`, `chores/ai-generator.md` | `[Implemented]` | Meal type chips Breakfast/Lunch/Dinner/Snack and age groups `3-5` … `Adult` (ai-services §2a); meals land on the Menu tab by weekday (BR-MEAL-04). |
| L5 | Vision Board | `20-features/vision-board` and its six sub-specs | `[Implemented]` | Thirteen seeded pillars (BR-VB-01); daily evaluation wizard (BR-VB-EVAL-03); weekly review (BR-VB-WK-02..08); Auto and Custom slideshow (BR-VB-SLIDE-01, 02). Reminders are `[Partial]` (D-704). |
| L6 | Google Integration | `10-architecture/google-sync.md` | `[Partial]` | Calendar import and push are implemented (§4, §6); Tasks import plus due-date push and delete are implemented, not a full two-way mirror (D-215, D-484); **Google Drive: no owner found**, the only Drive reference is a connector id revoked on account deletion (`10-architecture/admin-operations.md` AR-ADMIN-38, Q-504) — `[Described]` (D-1000). |
| L7 | Daily Reflection | `20-features/quotes`, `vision-board/affirmations.md`, `vision-board/slideshow.md` | `[Implemented]` | One quote per date with a written reflection (BR-QUOTE-01, 06); affirmations composed or AI-drafted (BR-VB-AFF-01, 03); slideshow with affirmation overlay (BR-VB-SLIDE-05). "AI-generated quote" describes the fallback only: an external quote source is tried first (AR-AI-06, D-304, Q-300). |
| L8 | Private & Secure | `10-architecture/auth-and-account.md` §9, `00-overview/legal-copy.md` §5 | `[Partial]` | Per-user row isolation on every entity (AR-AUTH-07) and private collage uploads served by signed URL (BR-VB-COL-02) are implemented; Google tokens never reach the browser (AR-SYNC-02). "Encrypted storage" has no counterpart in the repository (D-1001, Q-1000). |

### 4.2 User Manual sections

| # | Section | Headline promise (verbatim) | Specified in | Dominant tag | Evidence |
|---|---|---|---|---|---|
| M1 | App Overview | "keep your whole life organized in one place … all with optional Google Calendar and Google Tasks sync." | `20-features/app-shell`, `10-architecture/schedule-hub.md`, `google-sync.md` | `[Implemented]` | Fourteen sidebar sections (app-shell §0.2); schedule hub aggregation (AR-HUB-01); sign-up "Use Independently" (AR-AUTH-01). |
| M2 | Dashboard | "your home base — a customizable summary of everything happening today with real-time updates across all your data sources." | `20-features/dashboard` | `[Implemented]` | Eight widgets in an account-saved order (BR-DASH-03, 04). Widgets refresh on their own subscriptions while the page itself loads once (BR-DASH-10, AR-UI-14). "Toggle features … to show/hide their dashboard widgets" is `[Described]` (D-120). |
| M3 | Daily Checklist | "for recurring routines — things you want to do every day" | `20-features/daily-checklist` | `[Implemented]` | Ticks keyed per date, no reset action (BR-CHK-09); weekly `n/7` counts (BR-CHK-14). Gesture wording differs (D-803, D-804). |
| M4 | Tasks | "one-time or recurring to-dos with due dates, priorities, categories, and optional Google Tasks sync" | `20-features/tasks`, `tasks/recurrence.md`, `tasks/google-tasks.md` | `[Implemented]` | Create/edit/filter/group (tasks §4); Google Tasks import (BR-TASK-40..43). Described only: status circle with In Progress (D-453), keyword search (D-458), 30-day trash (D-486), schedule from the editor (D-455). |
| M5 | Calendar | "a monthly view of all your scheduled events, with the ability to add custom events and sync from Google Calendar." | `20-features/calendar` | `[Implemented]` | Month and week grids (BR-CAL-16, 17); add event with optional push (BR-CAL-14, US-CAL-03); Sync button honours sync sources (BR-CAL-12). Window "past 30 days" (D-500), "will also be deleted there" (D-501), "cannot be fully edited" (D-502) differ from code. |
| M6 | Daily Schedule | "a time-grid view of a single day … Items are loaded only for the selected date" | `20-features/daily-schedule` and sub-specs | `[Implemented]` | Per-date load (BR-SCHED-01); hour grid with active hours (§4); item library add (BR-SCHED-76..79). Auto-population of chores and education activities is `[Described]` (D-206, Q-203); "+" custom time block (D-401) and grid checkbox (D-402) differ. |
| M7 | Chores | "Track household chores with frequency schedules and assignments. Use AI-powered chore generation or manually create tasks" | `20-features/chores`, `chore-library.md`, `ai-generator.md` | `[Implemented]` | Eight frequencies (BR-CHORE-17); Due Today default view (BR-CHORE-03); library assign (BR-CHORE-33..35). Described only: "Members" tab (D-550), priority field (D-551), overdue highlight (BR-CHORE-16). |
| M8 | Education | "Plan and track homeschool, tutoring, or extracurricular learning for multiple learners with AI-powered activity generation and scheduling." | `20-features/education`, `ai-activities.md`, `activity-library.md` | `[Implemented]` | Learners, plans per subject, activities with frequency (BR-EDU-01..09); generator with two review steps (ai-services §3c). "Add to Schedule" is `[Described]` (D-206); plan status (D-653) and learner colour (D-654) differ. |
| M9 | Goals | "Set and track personal or family goals across different timeframes with milestone tracking, progress monitoring, and integration with your Vision Board health pillars." | `20-features/goals`, `milestone-tasks.md` | `[Implemented]` | Seven timeframes (BR-GOAL-01); progress and status derived from milestone tasks (BR-GOAL-T05); goals created from pillars and evaluations (BR-VB-05). Described only: progress slider (D-609), On Hold (D-610), milestone frequency and reset (D-611). |
| M10 | Daily Quotes | "A space for daily inspiration and personal reflection." | `20-features/quotes` | `[Implemented]` | One quote per date (BR-QUOTE-01); reflection saved to the row (BR-QUOTE-06); favourites and history (BR-QUOTE-10). "AI-generated" is the fallback path (D-304). |
| M11 | Link Library | "Save and organize frequently used links and bookmarks in one place." | `20-features/links` | `[Implemented]` | Cards with image or icon thumbnail (BR-LINK-08); categories with icon and colour, kept on the device (BR-LINK-02); bookmark import (BR-LINK-12). "auto-fetch a thumbnail" (D-910) and "tabs" (D-911) differ. |
| M12 | Vision Board | "Create an inspirational vision collage with health pillars, daily evaluations, affirmations, and automated slideshows." | `20-features/vision-board` and sub-specs | `[Implemented]` | Pillars (BR-VB-01), evaluation (BR-VB-EVAL-09), affirmations (BR-VB-AFF-01), collage with private uploads (BR-VB-COL-02), two slideshow modes (BR-VB-SLIDE-01, 02). "Reminders … using the bell icon" is `[Partial]` (D-704, Q-702). |
| M13 | Theme Editor | "Customize the look and feel of your entire dashboard." | `20-features/theme-editor` | `[Implemented]` | Colours, dark mode, fonts, opacity, radius, background library with randomise (BR-THEME-01..10). "Dashboard header name" lives in Settings (D-920); fonts are a fixed list of five (D-922); changes reach the account on Save, not automatically (D-921). |
| M14 | Settings | "Manage your account, integrations, and data." | `20-features/settings` and sub-specs, `10-architecture/auth-and-account.md` §10 | `[Implemented]` | Account card with password change and deletion (§4.1); two independent connectors (BR-SET-05); calendar selection (BR-SET-11); trash (BR-SET-17); two data wipes (BR-SET-50..55). `[Partial]`: auto-sync times and calendars are stored but not read (D-204), default task label has no control (D-222, D-481), "deleted sync items" have no writer (D-211). |

### 4.3 Reading the ledger

- Of the eight landing blurbs, six are `[Implemented]` and two are `[Partial]` (Google Integration, Private & Secure). Of the fourteen manual sections, all are `[Implemented]` at the headline level; the sentences beneath the headlines that the code does not honour are recorded, sentence by sentence, in each feature spec's §1 and §14 and are consolidated in `90-traceability/claims-audit.md`.

## 5. Tier and pricing

- The only pricing statement in the product is "Get Started — It's Free" `[Described]` `src/pages/LandingPage.jsx:42`.
- No plan, tier, subscription, or payment entity exists among the thirty entities `[Implemented]` `10-architecture/domain-model.md` §1.
- No route, page, or setting mentions upgrading, billing, or limits per plan `[Implemented]` `20-features/app-shell/spec.md` §0.2 (fourteen routes, none of them billing), `20-features/settings/spec.md` §0 (seven cards, none of them billing).
- Two payment-library packages are declared and imported nowhere under `src/` `[Implemented]` `20-features/app-shell/spec.md` §11.
- An allowlist exists at the platform level: a visitor the platform reports as not registered sees "Access Restricted" and is told to "contact the app administrator to request access" `[Implemented]` `10-architecture/auth-and-account.md` §7.

## 6. Support contact

- The manual's "Help & Support" block gives one address, `Reaginhouse6@gmail.com`, as a `mailto:` link, with the line "Please include a description of your issue and any relevant details so we can assist you quickly." `[Implemented]` `src/pages/UserManual.jsx:515-532` (`20-features/user-manual/spec.md` §4.4).
- Both legal pages end with the placeholder "[Add your contact email here]" `[Described]` `src/pages/PrivacyPolicy.jsx:42`, `src/pages/TermsOfUse.jsx:47` (`00-overview/legal-copy.md` D-971, Q-970).
- The "Access Restricted" page directs the visitor to "the app administrator" without an address `[Implemented]` `src/components/UserNotRegisteredError.jsx:13-23`.

## 7. Discrepancies & open questions

- **D-1000** The landing page promises to "Seamlessly sync Google Calendar, Google Tasks, and Google Drive" (`src/pages/LandingPage.jsx:12`); the only Google Drive reference in the repository is a connector id revoked during account deletion (`base44/functions/deleteUserAccount/entry.ts:13-20`), and no function reads or writes Drive (`10-architecture/admin-operations.md` AR-ADMIN-38; Q-504 in `20-features/calendar`).
- **D-1001** The landing page promises "encrypted storage" (`src/pages/LandingPage.jsx:15`); the repository holds no encryption setting, key handling, or storage configuration, and the legal text commits only to "appropriate technical and organizational measures" (`src/pages/PrivacyPolicy.jsx:37`; `00-overview/legal-copy.md` §5).
- Cited: **D-952** (five product names), **D-971** (support address only in the manual), **D-304** (quote described as AI-generated), **D-215** / **D-484** (Tasks sync described as bidirectional), **D-704** (reminders), **D-120** (feature toggles and dashboard widgets), **D-206** (chore and education schedule items), **D-217** (sign-up copy "automatically on app load").
- **Q-1000** Blocks §4.1 row L8. What does "encrypted storage" refer to: platform-level storage encryption outside the repository, transport encryption, or a commitment not yet backed by anything?
- **Q-1001** Blocks §2.2, §2.3. Are household members and learners intended to remain labels inside one account, or is a shared household with separate logins a planned direction? Every entity is single-tenant today (AR-AUTH-07) and goals reference members by display name (BR-GOAL-04).
- Cited: **Q-952** (product name of record), **Q-970** (support address of record), **Q-504** (Google Drive claim owner), **Q-300** (AI quote claim).
