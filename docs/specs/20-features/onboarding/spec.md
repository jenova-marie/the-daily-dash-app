# Onboarding Registry — Feature Spec

**Feature code:** `ONB` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 53 · Described 2 · Partial 4

**Sources owned:** `src/components/onboarding/CalendarOnboarding.jsx`, `ChoresOnboarding.jsx`, `DailyScheduleOnboarding.jsx`, `EducationOnboarding.jsx`, `GoalsOnboarding.jsx`, `LinkLibraryOnboarding.jsx`, `TasksOnboarding.jsx` (trigger, persistence, buttons — step text is quoted in each feature's §9), `src/components/visionboard/OnboardingDialog.jsx` (same split), the walkthrough trigger/dismiss/Guide code in `src/pages/Dashboard.jsx:44-71,186-188,332-338`, `DailyChecklist.jsx:24-65,312-331,588-594`, `Quotes.jsx:16-26,42-52,305-311`, `Tasks.jsx:43,59-69,849-852`, `Goals.jsx:43,60-73,798-801`, `CalendarPage.jsx:22-27,46-50,61,522-526`, `DailySchedule.jsx:31-36,83,107-112,1136-1140`, `Chores.jsx:32-35,1251-1255`, `Education.jsx:27-30,671-675`, `Links.jsx:95,110-114,326-330`, `VisionBoard.jsx:52,70-100,216-219,433-445`
**Sources referenced (owned elsewhere):** `src/components/GenericOnboardingDialog.jsx` mechanics → `10-architecture/shared-interactions.md` §8 (AR-UI-10, AR-UI-11) · persistence generations → `10-architecture/preferences.md` Part C (AR-PREF-30..36) · header "Guide" slot → `20-features/app-shell` §4.3 · sign-up integration choice → `10-architecture/auth-and-account.md` §2 (AR-AUTH-01) · terms gate → `10-architecture/auth-and-account.md` §5 · post-connection banners `src/pages/Settings.jsx:146,404-407,788-806` → `20-features/settings` · step text → each feature spec §9

**Permissions:** per-user data; the account-synced dismissal map lives in the account owner's own `ThemeSettings` row. Admin-only operations: none.

## 0. Entry points & navigation

- Route: none of its own; every walkthrough opens on the page it belongs to (registry §4.1) · Sidebar label: none · Header title text: the host page's · Position in swipe order: n/a
- Query parameters accepted: none
- Feature-toggle gating: the Chores, Education, and Vision Board walkthroughs are reachable only while their page is (`20-features/app-shell` §4.2)
- Header right-slot contents: on ten pages, a "Guide" icon button (help-circle, `title="Guide"`) that reopens the page's walkthrough (§4.3); the Dashboard's "Guide" button is in the page body

## 1. Purpose & user benefit

Each major page introduces itself once with a short numbered walkthrough and then stays out of the way; the account owner can bring any walkthrough back with a "Guide" button. Every dialog says why: "Here's how to get the most out of this page — it only takes a minute!" `[Implemented]` `src/components/GenericOnboardingDialog.jsx:38`.

The User Manual states: "Access this guide anytime via the Guide button on the Daily Checklist page." `[Described]` `src/pages/UserManual.jsx:81` and, for the Vision Board, "The Guide button re-shows the onboarding walkthrough." `[Described]` `src/pages/UserManual.jsx:368`.

Beyond page walkthroughs, first-run onboarding consists of the sign-up integration choice (§4.5), the terms gate (§4.6), the automatic collage seeding (§4.6), and the Settings banners that coach the step after connecting Google (§4.7).

## 2. Concepts & vocabulary

- **walkthrough** (glossary): a first-visit onboarding dialog for a page. The UI button that reopens it is labelled "Guide"; "Guide" is used here only as that label.
- **dismissal key** (feature-local): the string under which a walkthrough's dismissal is stored, both as a device key and, for the account-synced generation, as a property of the account map.
- **account map** (feature-local): the JSON object stored in `ThemeSettings.onboarding_status` (`{ "<key>": true }`), the account preference that carries dismissals across devices (AR-PREF-32).
- **device-only** / **account + mirror** (feature-local names for the two persistence generations of AR-UI-11 / AR-PREF-31..32).
- **feature toggle**, **account owner**, **device-local preference**, **account preference**: glossary.

## 3. User stories

- **US-ONB-01** As an account owner opening a page for the first time, I want a short numbered guide to what the page does so that I can start without reading the manual `[Implemented]` `src/components/GenericOnboardingDialog.jsx:30-58`, `src/components/onboarding/CalendarOnboarding.jsx:33-60`.
- **US-ONB-02** As an account owner, I want one button that closes the guide and stops it reappearing so that I am asked once `[Implemented]` `src/components/GenericOnboardingDialog.jsx:6-29,52-56`, `src/components/onboarding/ChoresOnboarding.jsx:34-37,58-62`.
- **US-ONB-03** As an account owner who signs in on a second device, I want the guides I already dismissed on Tasks, Goals, Daily Quotes, and Daily Checklist to stay dismissed so that I am not re-onboarded `[Implemented]` `src/pages/Tasks.jsx:61-69`, `src/pages/Goals.jsx:65-73`, `src/pages/Quotes.jsx:42-50`, `src/pages/DailyChecklist.jsx:312-331`.
- **US-ONB-04** As an account owner, I want a "Guide" button on every page that has a walkthrough so that I can re-read it on demand `[Implemented]` `src/pages/Tasks.jsx:43`, `src/pages/Dashboard.jsx:186-188` (full list §4.3).
- **US-ONB-05** As an account owner visiting the Vision Board for the first time, I want the guide to leave me on the Pillars tab so that I start where the guide told me to `[Implemented]` `src/pages/VisionBoard.jsx:88-96,433-445`.
- **US-ONB-06** As a new account, I want to choose between connecting Google and using the app independently before I register so that sync is set up from the start or deliberately skipped `[Implemented]` `src/pages/Auth.jsx:290-341` (AR-AUTH-01).
- **US-ONB-07** As an account owner who has just connected Google Calendar or Google Tasks, I want to be told the next required step so that my first sync includes the right sources `[Implemented]` `src/pages/Settings.jsx:788-806`.

## 4. Capabilities & interactions

### 4.1 Registry of page walkthroughs

Eleven walkthroughs exist; three pages have none (Theme Editor, Settings, User Manual: no dialog and no "Guide" button `[Implemented]` `src/pages/ThemeEditor.jsx:62`, `src/pages/Settings.jsx:109`, `src/pages/UserManual.jsx:468`). All rows `[Implemented]`.

| Page (route) | Dialog component | Dialog title (verbatim) | Steps | Trigger condition | Dismissal key | Generation | Stored value(s) | Re-open control | Buttons (verbatim) | Citations |
|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard (`/dashboard`) | `GenericOnboardingDialog` with inline steps | "Welcome to Dashboard" | 4 | on first render: device key absent (any value counts as dismissed) | `dashboard_onboarded` | mixed: dismiss = account + mirror; trigger = device only (AR-PREF-34) | account map `true`; device `"true"` | "Guide" button in the page body (top-right of the page, next to the Vision button) | "Got it — Don't Remind Me Again" | `src/pages/Dashboard.jsx:44-49,64-66,71,186-188,332-338`, `src/components/GenericOnboardingDialog.jsx:6-29` |
| Daily Checklist (`/checklist`) | `GenericOnboardingDialog` with inline steps | "Welcome to Daily Checklist" | 4 | on mount: skip if device `"true"`; else read newest `ThemeSettings`: no row → show; key absent → show; read failure → show; key present → do not show (no mirror written) | `dailychecklist_onboarded` | account + mirror | account map `true`; device `"true"` | header "Guide"; it first deletes the key from the account map, then opens | "Got it — Don't Remind Me Again" | `src/pages/DailyChecklist.jsx:24-49,51-65,312-331,588-594` |
| Tasks (`/tasks`) | `TasksOnboarding` | "Welcome to Task Manager" | 4 | on mount: skip if device `"true"`; else read newest `ThemeSettings`: no row → show; key absent → show; key present → write device mirror; failure → show | `tasks_onboarded` | account + mirror | account map `true`; device `"true"` | header "Guide" (opens only) | "Got it — Don't Remind Me Again" | `src/components/onboarding/TasksOnboarding.jsx:6,31-45,68-70`, `src/pages/Tasks.jsx:43,59-69,849-852` |
| Calendar (`/calendar`) | `CalendarOnboarding` | "Welcome to Calendar" | 4 | on first render: device key absent | `calendar_onboarded` | device only | device `"1"` | header "Guide" (opens only) | "Got it — Don't Remind Me Again" | `src/components/onboarding/CalendarOnboarding.jsx:28-32,37,54-56`, `src/pages/CalendarPage.jsx:46-50,61,522-526` |
| Daily Schedule (`/schedule`) | `DailyScheduleOnboarding` | "Welcome to Daily Schedule" | 7 | on first render: device key absent | `schedule_onboarded` | device only | device `"1"` | header "Guide" (opens only) | "Got it — Don't Remind Me Again" | `src/components/onboarding/DailyScheduleOnboarding.jsx:43-47,52,69-71`, `src/pages/DailySchedule.jsx:83,107-112,1136-1140` |
| Chores (`/chores`) | `ChoresOnboarding` | "Welcome to Chores" | 5 | on first render: device key absent | `chores_onboarded` | device only | device `"1"` | header "Guide" (opens only) | "Got it — Don't Remind Me Again" | `src/components/onboarding/ChoresOnboarding.jsx:33-37,42,59-61`, `src/pages/Chores.jsx:32-35,1251-1255` |
| Education (`/education`) | `EducationOnboarding` | "Welcome to Education" | 4 | on first render: device key absent | `education_onboarded` | device only | device `"1"` | header "Guide" (opens only) | "Got it — Don't Remind Me Again" | `src/components/onboarding/EducationOnboarding.jsx:28-32,37,54-56`, `src/pages/Education.jsx:27-30,671-675` |
| Goals (`/goals`) | `GoalsOnboarding` | "Welcome to Goal Manager" | 5 | on mount: same order as Tasks | `goals_onboarding_done` | account + mirror | account map `true`; device `"true"` | header "Guide" (opens only) | "Got it — Don't Remind Me Again" | `src/components/onboarding/GoalsOnboarding.jsx:6,36-50,56,73-75`, `src/pages/Goals.jsx:43,60-73,798-801` |
| Daily Quotes (`/quotes`) | `GenericOnboardingDialog` with inline steps | "Welcome to Daily Quotes" | 4 | on mount: same order as Tasks | `quotes_onboarded` | account + mirror | account map `true`; device `"true"` | header "Guide" (opens only) | "Got it — Don't Remind Me Again" | `src/pages/Quotes.jsx:16-21,26,42-52,305-311` |
| Link Library (`/links`) | `LinkLibraryOnboarding` | "Welcome to Link Library" | 4 | on first render: device key absent | `links_onboarded` | device only | device `"1"` | header "Guide" (opens only) | "Got it — Don't Remind Me Again" | `src/components/onboarding/LinkLibraryOnboarding.jsx:28-32,37,54-56`, `src/pages/Links.jsx:95,110-114,326-330` |
| Vision Board (`/visionboard`) | `visionboard/OnboardingDialog` | "Welcome to Your Vision Board 🌟" | 4 | after pillars load (default pillars are created first when none exist): device key absent → show and switch to the Pillars tab | `visionboard_onboarded` | device only | device `"1"` | header "Guide"; it first removes the device key, then opens | "Got it — Let's Start with Pillars →" and "Don't remind me again" | `src/components/visionboard/OnboardingDialog.jsx:28-58`, `src/pages/VisionBoard.jsx:52,75-100,216-219,433-445` |

Step text for every row is quoted verbatim in the owning feature's §9 (`20-features/dashboard`, `daily-checklist`, `tasks`, `calendar`, `daily-schedule`, `chores`, `education`, `goals`, `quotes`, `links`, `vision-board`).

### 4.2 Shared dialog shape

Mechanics are AR-UI-10 in `10-architecture/shared-interactions.md`; recorded here as the registry's contract.

- **Title pattern:** "Welcome to {Page}" — the page name is the dialog's own, not always the sidebar label ("Task Manager", "Goal Manager" versus sidebar "Tasks", "Goals") `[Implemented]` `src/components/onboarding/TasksOnboarding.jsx:51`, `GoalsOnboarding.jsx:56`, `src/components/Layout.jsx:15,20`.
- **Subtitle (verbatim, every dialog except the Vision Board):** "Here's how to get the most out of this page — it only takes a minute!" `[Implemented]` `src/components/GenericOnboardingDialog.jsx:37-39`, `src/components/onboarding/CalendarOnboarding.jsx:38-40`, `ChoresOnboarding.jsx:43-45`, `DailyScheduleOnboarding.jsx:53-55`, `EducationOnboarding.jsx:38-40`, `GoalsOnboarding.jsx:57-59`, `LinkLibraryOnboarding.jsx:38-40`, `TasksOnboarding.jsx:52-54`.
- **Steps:** a vertical list; each step is an icon, a bold title, and a description. In the seven component dialogs and the three inline sets the titles are numbered "1. …", "2. …" `[Implemented]` `src/components/GenericOnboardingDialog.jsx:41-51`, `src/components/onboarding/ChoresOnboarding.jsx:5-31`, `src/pages/Dashboard.jsx:44-49`.
- **Dismiss button (verbatim, every dialog except the Vision Board):** one full-width button "Got it — Don't Remind Me Again" `[Implemented]` `src/components/GenericOnboardingDialog.jsx:52-56` and each component's own button (citations in §4.1).
- **Closing by other means** (overlay click, Escape) closes without recording a dismissal, so the walkthrough returns on the next visit `[Implemented]` `src/components/GenericOnboardingDialog.jsx:31-33`, `src/components/onboarding/CalendarOnboarding.jsx:34`, `TasksOnboarding.jsx:48`, `GoalsOnboarding.jsx:53`. The Vision Board is the exception (§4.4).
- The seven component dialogs cap their height at 90 % of the viewport and scroll their step list; the generic dialog and the Vision Board dialog do not `[Implemented]` `src/components/onboarding/CalendarOnboarding.jsx:35,42`, `src/components/GenericOnboardingDialog.jsx:34,41`, `src/components/visionboard/OnboardingDialog.jsx:33,40`.
- The five device-only components accept an `onDontRemind` prop from their page (which writes the same `"1"`), but never call it; the component's own button performs the write `[Partial]` `src/components/onboarding/CalendarOnboarding.jsx:28-32`, `src/pages/CalendarPage.jsx:525` (likewise Chores `src/pages/Chores.jsx:1254`, Daily Schedule `:1139`, Education `src/pages/Education.jsx:674`, Links `src/pages/Links.jsx:329`). Both paths write the same key and value.

### 4.3 The "Guide" re-open control

- Ten pages publish an icon-only button (help-circle, `title="Guide"`) into the shell header's right slot; it is removed when the page unmounts `[Implemented]` `src/pages/DailyChecklist.jsx:65`, `src/pages/Tasks.jsx:43`, `src/pages/CalendarPage.jsx:61`, `src/pages/DailySchedule.jsx:83`, `src/pages/Chores.jsx:32`, `src/pages/Education.jsx:27`, `src/pages/Goals.jsx:43`, `src/pages/Quotes.jsx:26`, `src/pages/Links.jsx:95`, `src/pages/VisionBoard.jsx:52`. Slot mechanics: `20-features/app-shell` §4.3.
- The Dashboard's control is a small outlined button in the page body reading "Guide" with the same icon `[Implemented]` `src/pages/Dashboard.jsx:186-188`.
- **What "Guide" does to persistence** (AR-PREF-35, AR-PREF-36):
  - eight pages simply open the dialog; a subsequent dismissal re-writes the same key `[Implemented]` e.g. `src/pages/Tasks.jsx:43,91`, `src/pages/Quotes.jsx:52`;
  - Daily Checklist deletes `dailychecklist_onboarded` from the account map (leaving the device mirror in place) before opening `[Implemented]` `src/pages/DailyChecklist.jsx:51-63`;
  - Vision Board removes the device key before opening `[Implemented]` `src/pages/VisionBoard.jsx:216-219`.

### 4.4 The Vision Board variant

- Title "Welcome to Your Vision Board 🌟"; subtitle "Here's how to get the most out of this page — it only takes a minute to set up!" `[Implemented]` `src/components/visionboard/OnboardingDialog.jsx:35-38` (D-321 in shared-interactions).
- Two buttons: a primary "Got it — Let's Start with Pillars →" and a ghost "Don't remind me again" `[Implemented]` `src/components/visionboard/OnboardingDialog.jsx:51-57`.
- Both buttons, and any other close (overlay, Escape, because the dialog routes every close through the same `onClose`), write `visionboard_onboarded = "1"` and switch the page to the Pillars tab `[Implemented]` `src/components/visionboard/OnboardingDialog.jsx:30-32,52,55`, `src/pages/VisionBoard.jsx:433-445` (D-323 in shared-interactions; overlay behaviour recorded here as D-964).
- The trigger runs after the page has loaded or seeded the health pillars, and also switches to the Pillars tab when it fires `[Implemented]` `src/pages/VisionBoard.jsx:75-100`.

### 4.5 First-run account onboarding — the integration choice

Owned by `10-architecture/auth-and-account.md` §2 (AR-AUTH-01, AR-AUTH-02); listed here because it is the first onboarding step an account sees.

- Submitting the sign-up form opens "How would you like to get started?" — "You can connect your Google account now, or set it up later in Settings." with two choices: **"Connect Google Account"** ("Sync Google Calendar events and Google Tasks automatically on app load.") and **"Use Independently"** ("Manage tasks, schedules, and goals without connecting a Google account."), and the footer "You can always connect Google later in **Settings → Integrations**." `[Implemented]` `src/pages/Auth.jsx:290-341`.
- Choosing Google opens the Google Calendar authorisation popup after verification, waits for it to close, then opens the Google Tasks popup; either choice then lands on `/accept-terms` `[Implemented]` `src/pages/Auth.jsx:100-137`.

### 4.6 First-run account onboarding — terms gate and collage seeding

- The terms and privacy gate (`/accept-terms`) must be passed once; the shell re-checks it on every mount `[Implemented]` `src/pages/AcceptTerms.jsx:13-27,29-64`, `src/components/Layout.jsx:40-45` (auth spec §5; copy in `00-overview/legal-copy.md`).
- Accepting, and every later shell mount, invokes `initializeDefaultCollageImages` so the Vision Board collage starts populated `[Implemented]` `src/pages/AcceptTerms.jsx:52-57`, `src/components/Layout.jsx:47-48` (`10-architecture/admin-operations.md` §2.5).

### 4.7 Post-connection coaching banners (Settings)

Owned by `20-features/settings`; registered here as onboarding copy.

- After the authorisation popup closes, Settings re-checks connector status up to ten times at 1.5 s intervals; once the connector reports connected, a dismissible banner appears above the Integrations card `[Implemented]` `src/pages/Settings.jsx:146,383-407,788-806`.
- Calendar banner (verbatim): "📅" · "Google Calendar connected!" · "Before syncing, scroll down to "Select Calendars to Sync" and choose which calendars to include." `[Implemented]` `src/pages/Settings.jsx:791,794,798`.
- Tasks banner (verbatim): "✓" · "Google Tasks connected!" · "Before syncing, scroll down to "Auto-Sync Schedule" and choose which task lists to include under "Task lists to auto-sync"." `[Implemented]` `src/pages/Settings.jsx:791,794,799`.
- An "X" button clears the banner; it is not persisted `[Implemented]` `src/pages/Settings.jsx:802-804`.

### 4a. Keyboard & pointer

- Escape and overlay click close every walkthrough (dialog primitive); persistence consequences differ per §4.2 and §4.4 `[Implemented]` `src/components/GenericOnboardingDialog.jsx:31-33`, `src/components/visionboard/OnboardingDialog.jsx:30-32`.
- No other gestures. None observed.

### 4b. View state & persistence

| Control | Values | Default | Scope (memory / device `key` / account `Entity.field`) |
|---|---|---|---|
| Walkthrough open (per page) | open / closed | per trigger (§4.1) | memory `showOnboarding` in each page |
| Dismissal, device-only pages | `"1"` / absent | absent | device `calendar_onboarded`, `schedule_onboarded`, `chores_onboarded`, `education_onboarded`, `links_onboarded`, `visionboard_onboarded` |
| Dismissal, account + mirror pages | `true` in map / `"true"` on device | absent | account `ThemeSettings.onboarding_status[key]` and device `dashboard_onboarded`, `dailychecklist_onboarded`, `tasks_onboarded`, `goals_onboarding_done`, `quotes_onboarded` |
| Post-connection banner | `calendar` / `tasks` / none | none | memory `justConnected` `src/pages/Settings.jsx:146` |

### 4c. Empty & fallback states

- When the account-synced read fails, the walkthrough is shown `[Implemented]` `src/pages/Tasks.jsx:68`, `src/pages/Goals.jsx:72`, `src/pages/Quotes.jsx:49`, `src/pages/DailyChecklist.jsx:324-326`.
- When reading the device key throws (storage unavailable), the device-only trigger evaluates to "do not show" `[Implemented]` `src/pages/CalendarPage.jsx:47`, `src/pages/Chores.jsx:34`, `src/pages/DailySchedule.jsx:108`, `src/pages/Education.jsx:29`, `src/pages/Links.jsx:111`, `src/pages/Dashboard.jsx:65`.
- When the account-synced dismissal write fails, the dialog still closes; the device mirror is written first by Tasks and Goals and last by the generic dialog `[Implemented]` `src/components/onboarding/TasksOnboarding.jsx:33-44`, `GoalsOnboarding.jsx:38-49`, `src/components/GenericOnboardingDialog.jsx:8-28`.
- No empty-state copy exists for the walkthroughs themselves. None observed.

## 5. Business rules

- **BR-ONB-01 — One walkthrough per page, eleven in all.** Dashboard, Daily Checklist, Tasks, Calendar, Daily Schedule, Chores, Education, Goals, Daily Quotes, Link Library, Vision Board; Theme Editor, Settings, and User Manual have none `[Implemented]` §4.1 citations.
- **BR-ONB-02 — Only the dismiss button records a dismissal.** Overlay and Escape closes are not persisted, except on the Vision Board where every close is `[Implemented]` `src/components/GenericOnboardingDialog.jsx:31-33,52-56`, `src/pages/VisionBoard.jsx:433-445`.
- **BR-ONB-03 — Device-only generation.** Calendar, Daily Schedule, Chores, Education, Link Library, Vision Board write `"1"` to their key and show when the key is absent `[Implemented]` `src/components/onboarding/CalendarOnboarding.jsx:29-32`, `src/pages/CalendarPage.jsx:46-48` (AR-PREF-31).
- **BR-ONB-04 — Account + mirror generation.** Tasks, Goals, Daily Quotes, Daily Checklist, Dashboard write `{key: true}` into `ThemeSettings.onboarding_status` (creating a row with `"{}"` when none exists) and `"true"` to the device key `[Implemented]` `src/components/GenericOnboardingDialog.jsx:6-29`, `src/components/onboarding/TasksOnboarding.jsx:32-45`, `GoalsOnboarding.jsx:37-50` (AR-PREF-32).
- **BR-ONB-05 — Trigger order for the account generation.** Device `"true"` → do not show; else newest `ThemeSettings`: none → show; key absent → show; key present → do not show (Tasks, Goals, Quotes also write the device mirror; Daily Checklist does not); read failure → show `[Implemented]` `src/pages/Tasks.jsx:61-69`, `src/pages/Goals.jsx:65-73`, `src/pages/Quotes.jsx:42-50`, `src/pages/DailyChecklist.jsx:312-331` (AR-PREF-33; D-960).
- **BR-ONB-06 — The Dashboard trigger reads only the device.** Its dismissal is account + mirror but the dialog is shown whenever the device key is absent `[Implemented]` `src/pages/Dashboard.jsx:64-66,332-338` (AR-PREF-34; D-961).
- **BR-ONB-07 — "Guide" reopens without waiting for persistence.** All Guide controls open the dialog immediately; Daily Checklist additionally clears its account entry and Vision Board its device key `[Implemented]` `src/pages/DailyChecklist.jsx:51-63`, `src/pages/VisionBoard.jsx:216-219`, `src/pages/Tasks.jsx:43`.
- **BR-ONB-08 — Vision Board onboarding lands on Pillars.** Both the trigger and every close switch the active tab to `pillars` `[Implemented]` `src/pages/VisionBoard.jsx:88-96,437,442`.
- **BR-ONB-09 — Step text is fixed per dialog.** Steps are constants; no step is conditional on data or toggles `[Implemented]` `src/components/onboarding/*.jsx:5-41`, `src/pages/Dashboard.jsx:44-49`, `src/pages/DailyChecklist.jsx:24-45`, `src/pages/Quotes.jsx:16-21`.
- **BR-ONB-10 — The integration choice precedes registration and can be revisited in Settings.** `[Implemented]` `src/pages/Auth.jsx:56-59,290-341` (AR-AUTH-01).
- **BR-ONB-11 — Coaching banners appear once per detected connection and are dismissed in memory only.** `[Implemented]` `src/pages/Settings.jsx:404-407,802-804`.

### 5a. State & lifecycle

| Walkthrough state | Trigger | Next state | Side effects | Citation |
|---|---|---|---|---|
| not shown | page opens, dismissal absent per §4.1 | open | Vision Board: tab → Pillars | §4.1 |
| open | "Got it — Don't Remind Me Again" | closed, dismissed | device `"1"` (device-only) or account map `true` + device `"true"` (account + mirror) | §4.1 |
| open | overlay / Escape (ten dialogs) | closed, not dismissed | none | `src/components/GenericOnboardingDialog.jsx:31-33` |
| open | overlay / Escape / either button (Vision Board) | closed, dismissed | device `"1"`; tab → Pillars | `src/pages/VisionBoard.jsx:433-445` |
| dismissed | "Guide" | open | Daily Checklist: account entry deleted; Vision Board: device key removed | §4.3 |
| dismissed on device A (account generation) | page opens on device B | not shown; device B mirror written (Tasks, Goals, Quotes) | — | `src/pages/Tasks.jsx:66-67` |
| dismissed on device A (device-only or Dashboard) | page opens on device B | open | — | `src/pages/CalendarPage.jsx:46-48`, `src/pages/Dashboard.jsx:64-66` |

### 5b. Time & date semantics

None. Walkthrough triggers do not depend on dates. None observed.

## 6. Data

| Entity / field | Operation | Notes | Citation |
|---|---|---|---|
| `ThemeSettings.onboarding_status` (string, JSON `{ key: true }`) | read newest (`-updated_date`, limit 1) | trigger for the account generation | `src/pages/Tasks.jsx:63`, `src/pages/Goals.jsx:67`, `src/pages/Quotes.jsx:44`, `src/pages/DailyChecklist.jsx:315` |
| `ThemeSettings` | create `{ onboarding_status: "{}" }` when no row exists | first dismissal on a fresh account | `src/components/GenericOnboardingDialog.jsx:16`, `src/components/onboarding/TasksOnboarding.jsx:38`, `GoalsOnboarding.jsx:43` |
| `ThemeSettings.onboarding_status` | update (set key `true`) | dismissal | `src/components/GenericOnboardingDialog.jsx:20-22`, `TasksOnboarding.jsx:40-42`, `GoalsOnboarding.jsx:45-47` |
| `ThemeSettings.onboarding_status` | update (delete key) | Daily Checklist "Guide" | `src/pages/DailyChecklist.jsx:53-57` |
| `HealthPillar` | list; bulk-create defaults when empty | precedes the Vision Board trigger (owner `20-features/vision-board`) | `src/pages/VisionBoard.jsx:78-86` |

Field register: `10-architecture/preferences.md` A.2; schema: `10-architecture/data-model/`.

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| Each page → App shell | `20-features/app-shell` §4.3 | "Guide" button published into the header right slot | `src/pages/Tasks.jsx:43` and §4.3 list |
| Onboarding → Preferences | `10-architecture/preferences.md` Part C | account map in `ThemeSettings.onboarding_status`; eleven device keys | §6, §10 |
| Onboarding → Shared interactions | `10-architecture/shared-interactions.md` §8 | dialog shape, close semantics | `src/components/GenericOnboardingDialog.jsx:30-58` |
| Auth → Onboarding | `10-architecture/auth-and-account.md` §2, §5 | integration choice dialog; terms gate; collage seeding | `src/pages/Auth.jsx:290-341`, `src/pages/AcceptTerms.jsx:29-64` |
| Settings → Onboarding | `20-features/settings` | post-connection banners | `src/pages/Settings.jsx:788-806` |
| Vision Board → Onboarding | `20-features/vision-board` | trigger waits for pillar load; every close selects the Pillars tab | `src/pages/VisionBoard.jsx:75-100,433-445` |
| User Manual → Onboarding | `20-features/user-manual` | manual describes the Guide button for Daily Checklist and Vision Board | `src/pages/UserManual.jsx:81,368` |

### 7a. Feedback & notifications

- No toasts are raised by any walkthrough; write failures are logged silently `[Implemented]` `src/components/GenericOnboardingDialog.jsx:24-26`, `src/components/onboarding/TasksOnboarding.jsx:43`.
- The Settings banners of §4.7 are the only onboarding notifications `[Implemented]` `src/pages/Settings.jsx:788-806`.

## 8. AI & automation

None observed.

## 9. Onboarding content

Step text is not repeated here; each feature's §9 quotes its steps verbatim. Step counts per dialog are in §4.1 (Dashboard 4 · Daily Checklist 4 · Tasks 4 · Calendar 4 · Daily Schedule 7 · Chores 5 · Education 4 · Goals 5 · Daily Quotes 4 · Link Library 4 · Vision Board 4; forty-nine steps in all).

**Dialogs whose steps exist in two versions:**

- **Calendar** — the rendered dialog uses the four numbered steps in `src/components/onboarding/CalendarOnboarding.jsx:5-26` ("1. Browse Your Calendar", "2. Add Custom Events", "3. Sync with Google Calendar & Tasks", "4. Search & Manage Events"). A second, unnumbered four-step constant ("View Your Calendar", "Add Custom Events", "Sync with Google", "Search & Manage") is declared in the page and not rendered by any component `[Partial]` `src/pages/CalendarPage.jsx:22-27` (repository search: the constant has no reader) (D-962).
- **Daily Schedule** — the rendered dialog uses the seven numbered steps in `src/components/onboarding/DailyScheduleOnboarding.jsx:5-41`. A second, unnumbered four-step constant ("Visual Schedule", "Quick Add Items", "Smart Library", "Manage Visibility") is declared in the page and not rendered `[Partial]` `src/pages/DailySchedule.jsx:31-36` (no reader) (D-963).

The feature specs for Calendar and Daily Schedule quote both versions in their §9.

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `dashboard_onboarded` | Dashboard walkthrough dismissed (`"true"`; trigger treats any value as dismissed) | absent → show | `src/components/GenericOnboardingDialog.jsx:23` | never |
| `dailychecklist_onboarded` | Daily Checklist dismissed (`"true"`) | absent → consult account | `src/components/GenericOnboardingDialog.jsx:23` | never (Guide clears the account entry only) |
| `tasks_onboarded` | Tasks dismissed (`"true"`) | absent → consult account | `src/components/onboarding/TasksOnboarding.jsx:33`; mirror `src/pages/Tasks.jsx:67` | never |
| `goals_onboarding_done` | Goals dismissed (`"true"`) | absent → consult account | `src/components/onboarding/GoalsOnboarding.jsx:38`; mirror `src/pages/Goals.jsx:71` | never |
| `quotes_onboarded` | Daily Quotes dismissed (`"true"`) | absent → consult account | `src/components/GenericOnboardingDialog.jsx:23`; mirror `src/pages/Quotes.jsx:48` | never |
| `calendar_onboarded` | Calendar dismissed (`"1"`) | absent → show | `src/components/onboarding/CalendarOnboarding.jsx:30` | never |
| `schedule_onboarded` | Daily Schedule dismissed (`"1"`) | absent → show | `src/components/onboarding/DailyScheduleOnboarding.jsx:45` | never |
| `chores_onboarded` | Chores dismissed (`"1"`) | absent → show | `src/components/onboarding/ChoresOnboarding.jsx:35` | never |
| `education_onboarded` | Education dismissed (`"1"`) | absent → show | `src/components/onboarding/EducationOnboarding.jsx:30` | never |
| `links_onboarded` | Link Library dismissed (`"1"`) | absent → show | `src/components/onboarding/LinkLibraryOnboarding.jsx:30` | never |
| `visionboard_onboarded` | Vision Board dismissed (`"1"`, any close) | absent → show | `src/pages/VisionBoard.jsx:437,442` | "Guide" `src/pages/VisionBoard.jsx:217` |

Values `"1"` versus `"true"`: D-111 in `10-architecture/preferences.md`.

## 11. Seed / hardcoded data used

- Eleven dismissal keys (§10) `[Implemented]`.
- Eleven step constants (seven in components, three inline, one Vision Board) plus two unrendered constants (§9) `[Implemented]` / `[Partial]`.
- Shared copy: subtitle and dismiss label (§4.2); Vision Board copy (§4.4); integration-choice copy (§4.5); banner copy (§4.7) `[Implemented]`.

## 12. Print / email formats

None. Walkthrough dialogs are not printed. None observed.

## 13. Acceptance criteria

- **AC-ONB-01** Given a browser with no `calendar_onboarded` key, when the Calendar page renders, then "Welcome to Calendar" opens with four numbered steps; when "Got it — Don't Remind Me Again" is pressed, then the key holds `"1"` and the dialog does not reopen on the next visit (refs BR-ONB-03).
- **AC-ONB-02** Given a device key absent and no `ThemeSettings` row, when the Tasks page mounts, then "Welcome to Task Manager" opens; when dismissed, then a `ThemeSettings` row exists whose `onboarding_status` parses to `{"tasks_onboarded": true}` and the device key holds `"true"` (refs BR-ONB-04).
- **AC-ONB-03** Given the account map contains `goals_onboarding_done: true` and the device key is absent, when the Goals page mounts, then no dialog opens and the device key is written `"true"` (refs BR-ONB-05).
- **AC-ONB-04** Given the account map contains `dailychecklist_onboarded: true` and the device key is absent, when the Daily Checklist page mounts, then no dialog opens and the device key remains absent (refs BR-ONB-05, D-960).
- **AC-ONB-05** Given the account map contains `dashboard_onboarded: true` and the device key is absent, when the Dashboard mounts, then "Welcome to Dashboard" opens (refs BR-ONB-06, D-961).
- **AC-ONB-06** Given any of the ten single-button walkthroughs is open, when Escape is pressed or the overlay is clicked, then the dialog closes and no key is written (refs BR-ONB-02).
- **AC-ONB-07** Given the Vision Board walkthrough is open, when it is closed by either button, Escape, or the overlay, then `visionboard_onboarded` holds `"1"` and the Pillars tab is active (refs BR-ONB-02, BR-ONB-08).
- **AC-ONB-08** Given a dismissed walkthrough, when the page's "Guide" control is activated, then the dialog opens immediately; on Daily Checklist the account map no longer contains its key; on Vision Board the device key is removed (refs BR-ONB-07).
- **AC-ONB-09** Given the Theme Editor, Settings, or User Manual page, then no walkthrough opens and no "Guide" control is present (refs BR-ONB-01).
- **AC-ONB-10** Given the Chores toggle is off, then the Chores walkthrough cannot be reached because its page is absent from navigation (refs §0).
- **AC-ONB-11** Given a sign-up form with all three fields, when "Sign Up" is pressed, then "How would you like to get started?" appears with "Connect Google Account" and "Use Independently" before any account is created (refs BR-ONB-10).
- **AC-ONB-12** Given Google Calendar has just been detected as connected in Settings, then the banner "Google Calendar connected!" with its instruction appears; pressing "X" removes it and it does not return on reload (refs BR-ONB-11).

## 14. Discrepancies & open questions

- **D-960** In the account + mirror trigger, Tasks, Goals, and Daily Quotes write the device mirror when the account map already holds the key (`src/pages/Tasks.jsx:67`, `src/pages/Goals.jsx:71`, `src/pages/Quotes.jsx:48`); Daily Checklist does not (`src/pages/DailyChecklist.jsx:313-327`), so it re-reads the account on every mount on that device.
- **D-961** The Dashboard dismisses through the account + mirror path (`src/pages/Dashboard.jsx:332-338`, `src/components/GenericOnboardingDialog.jsx:6-29`) but its trigger consults only the device key (`src/pages/Dashboard.jsx:64-66`), so a dismissal made on one device does not suppress the dialog on another.
- **D-962** Two Calendar step sets: the rendered four numbered steps (`src/components/onboarding/CalendarOnboarding.jsx:5-26`) and an unrendered four-step constant with different titles and text (`src/pages/CalendarPage.jsx:22-27`).
- **D-963** Two Daily Schedule step sets: the rendered seven numbered steps (`src/components/onboarding/DailyScheduleOnboarding.jsx:5-41`) and an unrendered four-step constant (`src/pages/DailySchedule.jsx:31-36`).
- **D-964** The generic and component dialogs treat overlay/Escape as "close without dismissing" (`src/components/GenericOnboardingDialog.jsx:31-33`); the Vision Board page writes the dismissal key from `onClose`, which the dialog also calls for overlay/Escape (`src/components/visionboard/OnboardingDialog.jsx:30-32`, `src/pages/VisionBoard.jsx:435-439`).
- See also **D-321**, **D-322**, **D-323** (`10-architecture/shared-interactions.md`) and **D-111** (`10-architecture/preferences.md`).
- **Q-960** Blocks: §4.1 Dashboard row. Is the Dashboard walkthrough intended to follow the account (like Tasks) or the device (like Calendar)?
- **Q-961** Blocks: §9. For Calendar and Daily Schedule, which of the two step sets is the intended content?
- **Q-962** Blocks: §4.2. Is the page-supplied `onDontRemind` handler intended to be a separate "don't remind" action distinct from "Got it", as the Vision Board has, for the five device-only pages?
