# Education — Feature Spec

**Feature code:** `EDU` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 187 · Described 12 · Partial 6 (this file); sub-specs add Implemented 70 · Described 1 · Partial 1

**Sources owned:** `src/pages/Education.jsx`, `src/components/education/SubjectCard.jsx`, `src/components/education/ActivityLinksDialog.jsx`, `src/components/ActivityGenerator.jsx`, `src/components/ActivityLibrary.jsx`, `src/components/StatsBar.jsx`, `src/components/PrintFormatEducation.jsx`, `src/components/onboarding/EducationOnboarding.jsx`, `base44/functions/generateActivities/entry.ts` (user-facing contract only)
**Sources referenced (owned elsewhere):** `src/components/SwipeableListItem.jsx`, `src/lib/HeaderContext.jsx`, `src/components/Layout.jsx` → `10-architecture/shared-interactions.md` · `src/components/WidgetCard.jsx`, `src/lib/printUtils.js` → `10-architecture/export-print-email.md` · LLM mechanism → `10-architecture/ai-services.md` §3 · `base44/entities/Learner.jsonc`, `EducationPlan.jsonc`, `EducationActivity.jsonc`, `FavoriteActivity.jsonc` → `10-architecture/data-model/education.md` · `base44/entities/Goal.jsonc`, `src/pages/Goals.jsx` → `20-features/goals` · `src/pages/DailySchedule.jsx`, `src/components/DailyToDo.jsx` → `20-features/daily-schedule`, `10-architecture/schedule-hub.md` · `src/pages/Dashboard.jsx` → `20-features/dashboard` · `src/pages/Settings.jsx`, `base44/entities/ThemeSettings.jsonc` → `20-features/settings`, `10-architecture/preferences.md` · `src/pages/UserManual.jsx` → `20-features/user-manual` · due/overdue canon → `10-architecture/time-and-date-semantics.md`

**Sub-specs (Level 2):** `ai-activities.md` (the "Add Activities" dialog: Manual Entry and AI Generator) · `activity-library.md` (the activity library dialog)

**Permissions:** per-user data (every entity carries the standard `created_by` rule, see `10-architecture/data-model/education.md`); admin-only operations: none

## 0. Entry points & navigation

- Route: `/education` `[Implemented]` `src/App.jsx:208` · Sidebar label: "Education" (graduation-cap icon), 7th of the 14 sidebar entries `[Implemented]` `src/components/Layout.jsx:12-27` · Header title text: "Education Manager" `[Implemented]` `src/pages/Education.jsx:26` · Position in swipe order: follows Chores and precedes Goals among visible entries (ring mechanics in `10-architecture/shared-interactions.md` AR-PREF-23 / §swipe) `[Implemented]` `src/components/Layout.jsx:19,127-131`
- Query parameters accepted: `filter=due` is read once at load and selects the Due status view; the page opens on the Due view whether or not the parameter is present `[Implemented]` `src/pages/Education.jsx:50-53`
- Feature-toggle gating: the account preference `ThemeSettings.enable_education` (Settings → "Feature Toggles" → "Education", default on) removes the sidebar entry and takes the page out of the swipe ring when off `[Implemented]` `src/components/Layout.jsx:33,129,191`, `src/pages/Settings.jsx:706-715,724-728`, `base44/entities/ThemeSettings.jsonc:59-62`. The route element itself carries no toggle check `[Implemented]` `src/App.jsx:208`. The same toggle hides the Daily Schedule's "Edu" quick link and library entry (`20-features/daily-schedule/spec.md` §0).
- Header right-slot contents: one icon button titled "Guide" that reopens the walkthrough (§9) `[Implemented]` `src/pages/Education.jsx:27`
- Inbound deep links: Daily Schedule quick link "Edu (n)" → `/education?filter=due` `[Implemented]` `src/pages/DailySchedule.jsx:918-933`; Dashboard education button (title "Education") → `/education?filter=due` `[Implemented]` `src/pages/Dashboard.jsx:293-307`. Their badge counts and colours are owned by those specs (`20-features/daily-schedule/spec.md` BR-SCHED-11, BR-SCHED-12, BR-SCHED-14; `20-features/dashboard`).

## 1. Purpose & user benefit

A homeschool / learning planner. The account owner keeps one or more learners, gives each learner a plan per subject, and fills each plan with assignments and activities that are one-off or repeat on a frequency. The page answers "what is due today, what slipped, what is coming" across all learners, and the whole visible schedule can be printed or emailed.

The User Manual states the purpose and the intended feature set verbatim `[Described]` `src/pages/UserManual.jsx:230-265`:

> Plan and track homeschool, tutoring, or extracurricular learning for multiple learners with AI-powered activity generation and scheduling.
>
> **Setting Up Learners & Plans**
> - **Create learners** first via the **Learners tab** — give each a name, grade level, and color for easy visual identification.
> - **Create education plans** per learner — assign a subject, title, description, due date, materials link, and notes.
> - Each learner can have **multiple plans** for different subjects or courses running simultaneously.
> - **Plan status:** Not Started → In Progress → Completed. Track progress with manual updates.
>
> **Activities & Assignments**
> - **Add activities** within a plan — specify type (assignment or activity), frequency (once, daily, weekly, biweekly, monthly), and specific days.
> - **One-time activities** complete once and are archived.
> - **Recurring activities** automatically reset on their next scheduled day after completion.
> - **Mark activities complete** by clicking the checkbox. Completion dates are tracked per activity.
> - Add **resource links** to activities for easy access to learning materials.
> - **Add to Schedule:** Push activities to Daily Schedule with a specific time slot for time-blocked learning sessions.
>
> **AI Activity Generator & Library**
> - Click **"Generate with AI"** to create activities based on learner age, subject, and activity type.
> - AI generates **age-appropriate, hands-on activities** tailored to specific learning goals.
> - Review suggestions, select which activities to assign, choose target plans, and optionally **save to Activity Library** for future reuse.
> - Access the **Activity Library** tab to browse saved favorite activities and quickly assign them to new plans.
>
> **Filtering & Organization**
> - Filter plans and activities by **learner or subject** using the controls at the top.
> - View all learners' plans in a combined view or filter to a specific learner for focused lesson planning.

How each manual claim maps to the prototype:

| Manual claim | Status |
|---|---|
| Learners with name, grade level, colour | Name and grade level are entered; the colour is a fixed default (§4.2, BR-EDU-04, D-654) `[Partial]` `src/pages/Education.jsx:41,684-689` |
| Plans with subject, title, description, due date, materials link, notes | Subject(s), completion date, description, materials (free text), notes are entered; the title is the subject (§4.3, BR-EDU-01) `[Implemented]` `src/pages/Education.jsx:159-170,733-793` |
| Plan status Not Started → In Progress → Completed | The `status` field is declared on the entity and never displayed or written (D-653) `[Described]` `src/pages/UserManual.jsx:238` |
| Activities with type, frequency, specific days | §4.6 `[Implemented]` `src/pages/Education.jsx:852-917` |
| One-time activities complete once "and are archived" | A completed one-off activity appears under the Done view and stays in its card (§4.10, BR-EDU-10) `[Described]` `src/pages/UserManual.jsx:245` |
| Recurring activities reset on their next scheduled day | Completing a repeating activity records today and moves its due date forward (BR-EDU-09) `[Implemented]` `src/pages/Education.jsx:290-303` |
| Completion dates tracked per activity | `last_completed_date` (BR-EDU-09) `[Implemented]` `src/pages/Education.jsx:296` |
| Resource links | §4.9 `[Implemented]` `src/components/education/ActivityLinksDialog.jsx` |
| Add to Schedule with a time slot | No code path creates a schedule item of source type `education`; see `10-architecture/schedule-hub.md` D-206 / Q-203 `[Described]` `src/pages/UserManual.jsx:249` |
| "Generate with AI" | The wand button "Add / Generate Activities" → "AI Generator" mode (`ai-activities.md`) `[Implemented]` `src/components/ActivityGenerator.jsx:198-215` |
| Save to Activity Library during AI review | Not offered in the generator; offered in the activity edit dialog and in the library's own form (D-659) `[Described]` `src/pages/UserManual.jsx:257` |
| Activity Library "tab" | A dialog opened from the toolbar (`activity-library.md`) `[Implemented]` `src/components/ActivityLibrary.jsx:137-146` |
| Filter by learner or subject; combined or per-learner view | §4.11 `[Implemented]` `src/pages/Education.jsx:963-993` |

The walkthrough's framing (§9) adds: "Plans are assigned to you by default, but you can add other learners anytime." `[Described]` `src/components/onboarding/EducationOnboarding.jsx:9` (see D-652) and "Items can be synced to the Daily Schedule for time-blocked planning." `[Described]` `src/components/onboarding/EducationOnboarding.jsx:24` (see D-206).

## 2. Concepts & vocabulary

Glossary terms used: **learner**, **plan**, **activity**, **activity library**, **frequency**, **goal**, **feature toggle**, **walkthrough**, **device-local preference**, **account preference**, **export**, **today**, **source type** (`00-overview/glossary.md`).

Feature-local terms, defined once here:

- **Subject card** — the card rendered for one learner × one subject. It holds the plan rows for that pair (normally one) and the activities carrying that learner and subject. `src/components/education/SubjectCard.jsx:111-112`
- **Status view** — the five pill-selected views Due / Past / Next / Done / All, stored as `due-today | overdue | next | done | all`. `src/pages/Education.jsx:50-53,621-625,942-947`
- **Active learner** — a page-level learner id used as the default for new plans, as the scope of "Delete Subject", and as the gate for the print/email buttons. `src/pages/Education.jsx:34,147,155,162,197-198,221,928,965`
- **Assignment / Activity** — the two values of `EducationActivity.type`; the UI labels the two collapsible sections of a subject card "Assignments" and "Activities". Both are activities in glossary terms. `src/components/education/SubjectCard.jsx:190-205`

The UI displays "Edu Plan" / "EDU Plan" for a plan, "Manage Learners" for the learner dialog, and "favorite" internally for activity-library entries; the terms of record remain plan, learner and activity library.

## 3. User stories

- **US-EDU-01** As an account owner, I want to keep a list of learners with a grade level so that I can plan for each learner separately. `[Implemented]` `src/pages/Education.jsx:150-157,678-711`
- **US-EDU-02** As an account owner, I want to create one plan per subject for a learner in a single step so that a term's subjects are set up quickly. `[Implemented]` `src/pages/Education.jsx:159-170,726-795`
- **US-EDU-03** As an account owner, I want to add assignments and repeating activities under a subject with a frequency, weekdays and a due date so that the routine is captured once. `[Implemented]` `src/pages/Education.jsx:235-246,852-917`
- **US-EDU-04** As an account owner, I want to see only what is due today, what is past, and what is coming in the next week so that I know what to do now. `[Implemented]` `src/pages/Education.jsx:63-111,627-657,940-1003`
- **US-EDU-05** As an account owner, I want to tick an activity off and have repeating ones roll to their next date so that the list stays current. `[Implemented]` `src/pages/Education.jsx:270-303`
- **US-EDU-06** As an account owner, I want to attach resource links to an activity so that materials are one tap away. `[Implemented]` `src/components/education/ActivityLinksDialog.jsx`
- **US-EDU-07** As an account owner, I want to print or email the visible weekly schedule so that it can go on the fridge. `[Implemented]` `src/pages/Education.jsx:305-616,927-938`
- **US-EDU-08** As an account owner, I want AI-suggested activities for an age group and subject that I can review and assign to plans. `[Implemented]` `src/components/ActivityGenerator.jsx` (see `ai-activities.md`)
- **US-EDU-09** As an account owner, I want to save activities to a reusable library per learner and assign them to a plan later. `[Implemented]` `src/components/ActivityLibrary.jsx`, `src/components/education/SubjectCard.jsx:134-150` (see `activity-library.md`)
- **US-EDU-10** As an account owner, I want an education item to become a goal so that it shows up in Goal Manager. `[Implemented]` `src/pages/Education.jsx:248-263`, `src/components/ActivityGenerator.jsx:160-170`
- **US-EDU-11** As an account owner, I want education activities to appear on my Daily Schedule. `[Described]` `src/pages/UserManual.jsx:249`, `src/components/onboarding/EducationOnboarding.jsx:24` (no creating path; `10-architecture/schedule-hub.md` D-206)

## 4. Capabilities & interactions

### 4.1 Toolbar

Above the main card, left to right `[Implemented]` `src/pages/Education.jsx:676-796`:

1. Icon button titled "Manage learners" (people icon) → §4.2.
2. Icon button titled "Activity Library" (book icon) → `activity-library.md` `[Implemented]` `src/components/ActivityLibrary.jsx:140-143`.
3. Icon button titled "Add / Generate Activities" (wand icon) → `ai-activities.md` `[Implemented]` `src/components/ActivityGenerator.jsx:199-203`.
4. Primary button "Edu Plan" with a plus icon → §4.3.

### 4.2 Manage Learners dialog

- Title "Manage Learners". Section label "Add New Learner" with fields **Name** (text) and **Grade Level** (text, placeholder "e.g. 5th Grade") and a full-width button "Add Learner" `[Implemented]` `src/pages/Education.jsx:680-689`.
- "Add Learner" does nothing while Name is blank; otherwise it creates a `Learner` with the name, grade level and the fixed colour `#8b5cf6`, clears the form, closes the dialog, makes the new learner the active learner and reloads `[Implemented]` `src/pages/Education.jsx:41,150-157`. There is no colour input `[Implemented]` `src/pages/Education.jsx:684-689` (D-654).
- Below, when at least one learner exists, section label "Learners" lists every learner as a row: colour dot, name, grade level (when set) `[Implemented]` `src/pages/Education.jsx:691-708`.
- Each row is a `SwipeableListItem`: long-press (touch) or hover (pointer) reveals delete, and delete goes through the shared "Delete Item?" / "This action cannot be undone." dialog (`10-architecture/shared-interactions.md` AR-UI-01, AR-UI-02) `[Implemented]` `src/pages/Education.jsx:696`.
- Confirming deletes every plan and every activity whose `learner_id` is that learner, then the learner; if it was the active learner, the active learner is cleared (and becomes the first remaining learner on reload) `[Implemented]` `src/pages/Education.jsx:213-223,147`. Activity-library entries for the learner are not deleted `[Implemented]` `src/pages/Education.jsx:216-220` (see `10-architecture/data-model/education.md` FavoriteActivity lifecycle).
- Learners cannot be edited after creation (no edit control) `[Implemented]` `src/pages/Education.jsx:695-705`.

### 4.3 New EDU Plan dialog

Title "New EDU Plan" `[Implemented]` `src/pages/Education.jsx:726-795`. Fields, top to bottom:

- **Learner** select. Value defaults to the active learner. Options are the learners; when there are no learners and the signed-in user is known, the only option is the user's full name `[Implemented]` `src/pages/Education.jsx:737-748`.
- **Subject(s)**: a row of toggle chips, one per subject in the list (ten defaults, then device-stored custom subjects, §11); several may be selected `[Implemented]` `src/pages/Education.jsx:113-117,128-133,750-758`. Under the chips, an input with placeholder "Add custom subject..." and a "+" button; Enter or "+" adds the trimmed text as a new chip, selects it, and stores it on the device (BR-EDU-03) `[Implemented]` `src/pages/Education.jsx:225-233,759-763`. When at least one subject is selected a line reads "{subjects joined by ", "} selected" `[Implemented]` `src/pages/Education.jsx:764-766`.
- **Completion Date (Optional)**: a button showing "Pick date" or the chosen date as "MMM d, yyyy", opening a calendar popover `[Implemented]` `src/pages/Education.jsx:769-788`.
- **Description** (textarea), **Materials** (text, placeholder "Textbook, worksheet..."), **Notes** (textarea) `[Implemented]` `src/pages/Education.jsx:789-791`.
- Button "Create EDU Plan" `[Implemented]` `src/pages/Education.jsx:792`.

Behaviour:

- With no subject selected, the message "Please select at least one subject." is shown at the top of the dialog and nothing is written `[Implemented]` `src/pages/Education.jsx:160,735`.
- Otherwise one `EducationPlan` per selected subject is created with `title` = `subject`, the shared description, due date, materials and notes, and `learner_id` = the selected learner, else the active learner, else (no learners) the user's full name; if none of those resolves, nothing is written (BR-EDU-01, BR-EDU-02) `[Implemented]` `src/pages/Education.jsx:162-166`. The form resets and the dialog closes `[Implemented]` `src/pages/Education.jsx:167-169`.
- A plan created while no learners exist is not shown anywhere on the page, because the page renders the "Getting Started" card whenever the learner list is empty and card lists are derived from learners `[Partial]` `src/pages/Education.jsx:922-925,1005,1033` (D-652, Q-650).

### 4.4 Subject card

One card per learner × subject (§5, BR-EDU-11/12) `[Implemented]` `src/components/education/SubjectCard.jsx:111-187`.

- Title: a button showing a chevron and the subject name. Click collapses/expands the card and reports the toggle to the page as an exception to "collapse all" (§4.12). Tooltip "Double-click to edit plan"; double-click opens the Edit Subject dialog (§4.5) for the card's first plan `[Implemented]` `src/components/education/SubjectCard.jsx:166-176` (`10-architecture/shared-interactions.md` AR-UI-04).
- Header right: a "+" button titled "Add Assignment / Activity" opening §4.6 targeted at the card's first plan (or no plan), learner and subject `[Implemented]` `src/components/education/SubjectCard.jsx:177-185`, `src/pages/Education.jsx:235-239`.
- Body (when expanded): a collapsible **Assignments** section and a collapsible **Activities** section, each headed by a chevron, the section name and "(n)"; a section with no items is not rendered `[Implemented]` `src/components/education/SubjectCard.jsx:75-109,190-205`. When the card has no activities at all: "No items yet. Click + to add." `[Implemented]` `src/components/education/SubjectCard.jsx:206-208`.
- Plan details (description, materials, notes, completion date) are not shown on the card; they are reached through the Edit Subject dialog and appear in exports `[Implemented]` `src/components/education/SubjectCard.jsx:163-210`.

### 4.5 Edit Subject dialog

Title "Edit Subject: {subject}" `[Implemented]` `src/pages/Education.jsx:803-850`.

- **Completion Date**: date button with calendar popover; when a date is set, an "X" beside it clears the date `[Implemented]` `src/pages/Education.jsx:808-830`.
- **Description**, **Materials**, **Notes**: each with a "Clear" link shown only while the field has content `[Implemented]` `src/pages/Education.jsx:831-842`.
- "Save Changes" updates the opened plan's description, materials, notes and due date, closes, reloads `[Implemented]` `src/pages/Education.jsx:182-192`.
- "Delete Subject" (trash icon, destructive) opens the browser confirm `Delete the "{subject}" subject and all its plans and activities?`; on OK, every plan and every activity whose learner is the **active learner** and whose subject equals the dialog's subject is deleted, then the dialog closes and the page reloads `[Implemented]` `src/pages/Education.jsx:194-205,845` (BR-EDU-06, D-655).

### 4.6 Add Assignment / Activity dialog

Title "Add Assignment" or "Add Activity" following the selected type `[Implemented]` `src/pages/Education.jsx:852-917`.

- **Type** chips `assignment` (default) / `activity` `[Implemented]` `src/pages/Education.jsx:43,857-867`.
- **Title** text, placeholder "e.g. Chapter 5 worksheet" `[Implemented]` `src/pages/Education.jsx:868`.
- **Frequency** chips Once (default) / Daily / Weekly / Biweekly / Monthly; choosing a frequency clears the selected days `[Implemented]` `src/pages/Education.jsx:118,869-879`.
- **Days of Week**: seven round toggles Mon … Sun, shown only for Weekly and Biweekly `[Implemented]` `src/pages/Education.jsx:119-126,880-892`.
- **Due Date (Optional)**: date button with calendar popover `[Implemented]` `src/pages/Education.jsx:893-912`.
- **Notes** textarea `[Implemented]` `src/pages/Education.jsx:913`.
- "Add": with a blank title nothing happens; otherwise one `EducationActivity` is created with the form values plus the target's `plan_id` (the card's first plan id, or `null` when the card has no plan row), `learner_id` and `subject`; the dialog closes and the page reloads `[Implemented]` `src/pages/Education.jsx:236,241-246` (BR-EDU-07).

### 4.7 Activity rows

Inside each section, one row per activity `[Implemented]` `src/components/education/SubjectCard.jsx:16-72`:

- A checkbox (checked when `completed`), the title (struck through and muted when completed), and the due date text on the right when set `[Implemented]` `src/components/education/SubjectCard.jsx:30-36`.
- Ticking/unticking the checkbox runs completion (BR-EDU-09) `[Implemented]` `src/components/education/SubjectCard.jsx:30`, `src/pages/Education.jsx:290-303`.
- Clicking anywhere else on the row expands it; clicking again collapses. Clicks on the checkbox, a button or a link do not toggle `[Implemented]` `src/components/education/SubjectCard.jsx:19-22`.
- The expanded area shows the notes (or description when notes are empty), then a row with the resource-links button (§4.9) on the left and, on the right, an "Edit" button (pencil) opening §4.8 and collapsing the row, and a "Delete" button (X) that deletes the activity immediately with no confirmation and reloads `[Implemented]` `src/components/education/SubjectCard.jsx:39-67`, `src/pages/Education.jsx:265-268` (BR-EDU-21).

### 4.8 Edit Assignment / Activity dialog

Title "Edit Assignment" or "Edit Activity" by the row's current type `[Implemented]` `src/components/education/SubjectCard.jsx:213-275`.

- **Title** text; **Type** select (Assignment / Activity); **Frequency** select (Once / Daily / Weekly / Biweekly / Monthly; changing it clears the days); **Days of Week** toggles for Weekly and Biweekly; **Due Date (Optional)** native date input; **Notes** textarea `[Implemented]` `src/components/education/SubjectCard.jsx:220-265`.
- "Save Changes" updates the activity with every field of the loaded row except `id`, with `days_of_week` taken from the editor, and closes. It does not request a page reload; the card shows the saved values after the next reload (BR-EDU-23) `[Implemented]` `src/components/education/SubjectCard.jsx:126-132` (D-660).
- "Save to Library" (bookmark icon) creates an activity-library entry with the activity's learner, title, type, `description` = the editor's notes (or ""), and empty duration and materials; shows the alert "Saved to Activity Library!" and closes without saving the edits (BR-EDU-24) `[Implemented]` `src/components/education/SubjectCard.jsx:134-150,268-270`.

### 4.9 Activity Resources dialog (`ActivityLinksDialog`)

- Opened by the link icon titled "Manage links" in an expanded row `[Implemented]` `src/components/education/SubjectCard.jsx:47-50`, `src/components/education/ActivityLinksDialog.jsx:40-44`.
- Title "Activity Resources". Label "Add Resource URL": a URL input (placeholder "https://example.com/resource") and a "+" button disabled while the input is blank; Enter or "+" appends the trimmed text to the list `[Implemented]` `src/components/education/ActivityLinksDialog.jsx:20-25,50-65`.
- When links exist: label "Resources (n)" and a scrolling list; each entry is an anchor opening the URL in a new tab, with a trash button revealed on hover that removes it `[Implemented]` `src/components/education/ActivityLinksDialog.jsx:67-92`.
- "Cancel" closes and discards unsaved changes (the list is re-read from the activity on the next open); "Save" writes the list as a JSON array string to `resource_links` and closes `[Implemented]` `src/components/education/ActivityLinksDialog.jsx:12-18,31-34,94-101`, `src/components/education/SubjectCard.jsx:49` (BR-EDU-22). No page reload is requested after save (D-660).

### 4.10 Status views (filter pills)

A pill row at the top of the main card, each pill showing a label and a count `[Implemented]` `src/pages/Education.jsx:940-962`:

| Pill | View key | Count (activities of the learner filter, §4.11) | Count colour when inactive / active pill tint (meaning: urgency band) |
|---|---|---|---|
| Due | `due-today` | activities due today (§5b) | blue |
| Past | `overdue` | activities overdue (§5b) | red |
| Next | `next` | activities upcoming (§5b) | amber |
| Done | `done` | `completed` and frequency `once` | green |
| All | `all` | every activity | foreground / primary |

- Counts honour the learner dropdown but not the subject dropdown `[Implemented]` `src/pages/Education.jsx:943-947` (BR-EDU-16).
- Default view is Due `[Implemented]` `src/pages/Education.jsx:50-53`.
- In Due / Past / Next / Done the page lists, per learner, one subject card for every learner × subject pair that has at least one activity passing the view's rule, and each card shows only the passing activities; subjects with a plan but no passing activity are absent `[Implemented]` `src/pages/Education.jsx:635-657,1005-1029` (BR-EDU-11).
- In All the page lists every learner × subject pair that has a plan row, with all of its activities `[Implemented]` `src/pages/Education.jsx:660-667,1033-1051` (BR-EDU-12).
- Learner heading colour carries the view: Due blue, Past red, Next amber, Done green, otherwise purple `[Implemented]` `src/pages/Education.jsx:1011-1018,1040` (BR-EDU-13).
- Learner headings: in the four status views a heading is shown for every learner with matching cards; in All a heading is shown only when the learner dropdown is "All Learners" and there are two or more learners `[Implemented]` `src/pages/Education.jsx:1005-1018,1037-1043` (BR-EDU-14).
- Empty results: see §4c.

### 4.11 Learner and subject dropdowns

- **Learner dropdown**: shown only when there are two or more learners. Options "All Learners" (default) then each learner as "{name}" or "{name} ({grade level})". Choosing a learner also makes that learner the active learner `[Implemented]` `src/pages/Education.jsx:48,964-976` (BR-EDU-17, BR-EDU-26).
- **Subject dropdown**: shown only when the learner in view (or all plans, under "All Learners") has more than one distinct subject among plans. Options "All Subjects" (default) then each subject. The chosen subject persists when the learner dropdown changes `[Implemented]` `src/pages/Education.jsx:49,977-993`.
- Both dropdowns scope the cards; only the learner dropdown scopes the pill counts `[Implemented]` `src/pages/Education.jsx:636-647,660-667,943-947`.

### 4.12 Collapse / expand all

- A button titled "Collapse all" (or "Expand all" once collapsed) flips a page-wide flag and clears per-card exceptions (`10-architecture/shared-interactions.md` AR-UI-09) `[Implemented]` `src/pages/Education.jsx:54-55,994-996`.
- Each card and each of its two sections follows the flag when it changes; a card toggled individually is recorded as an exception until the flag next flips `[Implemented]` `src/components/education/SubjectCard.jsx:78-80,116-118,168`, `src/pages/Education.jsx:1025,1048` (BR-EDU-18; key naming in D-651).
- Initial state: the page starts with the flag off, so every card starts expanded. The page also passes a "default expanded" hint for the Due / Past / Next views only; that hint is not reached because the flag value is always supplied `[Implemented]` `src/pages/Education.jsx:54,1025,1048`, `src/components/education/SubjectCard.jsx:113-118` (BR-EDU-19, D-650).

### 4.13 Print / Email

Two icon buttons in the main card header, "Print education schedule" and "Email education schedule", rendered only while an active learner is set `[Implemented]` `src/pages/Education.jsx:927-938`. Content in §12.

### 4.14 Add Activities and Activity Library dialogs

Owned by this feature; specified in `ai-activities.md` and `activity-library.md`. Both close and hand control back to the page, which reloads through the `onActivitiesCreated` / `onSaveActivity` callbacks `[Implemented]` `src/pages/Education.jsx:713-724`.

### 4a. Keyboard & pointer

- Enter in "Add custom subject..." adds the subject (§4.3) `[Implemented]` `src/pages/Education.jsx:760-761`.
- Enter in the resource URL input adds the link (§4.9) `[Implemented]` `src/components/education/ActivityLinksDialog.jsx:57`.
- Double-click on a subject card title opens Edit Subject (§4.4) `[Implemented]` `src/components/education/SubjectCard.jsx:169`.
- Single click on a subject card title toggles collapse; single click on an activity row toggles its expanded area `[Implemented]` `src/components/education/SubjectCard.jsx:19-22,168`.
- Long-press / hover reveals delete on learner rows (`10-architecture/shared-interactions.md` AR-UI-01) `[Implemented]` `src/pages/Education.jsx:696`.
- Hover reveals the trash button on a resource link `[Implemented]` `src/components/education/ActivityLinksDialog.jsx:82-87`.
- Escape / overlay click closes any dialog without saving (standard dialog behaviour); for the walkthrough this does not set the dismissal key (§9) `[Implemented]` `src/components/onboarding/EducationOnboarding.jsx:34`.
- No swipe, drag-and-drop or batch mode on this page `[Implemented]` `src/pages/Education.jsx` (no such handlers).

### 4b. View state & persistence

| Control | Values | Default | Scope (memory / device `key` / account `Entity.field`) |
|---|---|---|---|
| Status view | `due-today`, `overdue`, `next`, `done`, `all` | `due-today` (also for `?filter=due`) | memory `src/pages/Education.jsx:50-53` |
| Learner dropdown | `all` or a learner id | `all` | memory `src/pages/Education.jsx:48` |
| Subject dropdown | `""` (all) or a subject | `""` | memory `src/pages/Education.jsx:49` |
| Active learner | learner id or null | first learner on load | memory `src/pages/Education.jsx:34,147` |
| Collapse-all flag + exceptions | boolean + set of keys | off, empty | memory `src/pages/Education.jsx:54-55` |
| Per-card collapsed; per-section open; per-row expanded | boolean | card follows flag (expanded); section open; row collapsed | memory `src/components/education/SubjectCard.jsx:17,76,114` |
| Custom subjects | string[] | `[]` | device `edu_custom_subjects` `src/pages/Education.jsx:113-115,230` |
| Walkthrough dismissed | `"1"` | unset | device `education_onboarded` `src/pages/Education.jsx:28-30,674`, `src/components/onboarding/EducationOnboarding.jsx:30` |
| Feature visible | boolean | true | account `ThemeSettings.enable_education` `src/pages/Settings.jsx:727` |
| Generator / library dialog state | mode, step, selections, forms | AI mode, config step | memory `src/components/ActivityGenerator.jsx:20-40`, `src/components/ActivityLibrary.jsx:13-29` |

### 4c. Empty & fallback states

- No learners: a card titled "Getting Started" with "Add a learner to get started with education planning." (replaces the whole main card, including pills and export buttons) `[Implemented]` `src/pages/Education.jsx:922-925`.
- All view, no plan for the learner(s) in view: "Add an EDU plan for this learner." `[Implemented]` `src/pages/Education.jsx:1030-1031`.
- Due view, nothing matching: "Nothing due today." · Past: "No past items." · Next: "Nothing due in the next 7 days." · Done: "No completed items." · (fallback) "No items found." `[Implemented]` `src/pages/Education.jsx:1000-1003`.
- Subject card with no activities: "No items yet. Click + to add." `[Implemented]` `src/components/education/SubjectCard.jsx:206-208`.
- Plan dialog validation: "Please select at least one subject." `[Implemented]` `src/pages/Education.jsx:160,735`.
- Plan dialog learner select placeholder when there are no learners: the user's full name `[Implemented]` `src/pages/Education.jsx:739`.
- Activity library empty: "No saved activities yet." (`activity-library.md`) `[Implemented]` `src/components/ActivityLibrary.jsx:227`.
- Generator / library plan selects before a learner is chosen: "Select a learner first" / "Select learner first" (`ai-activities.md`, `activity-library.md`) `[Implemented]` `src/components/ActivityGenerator.jsx:232`, `src/components/ActivityLibrary.jsx:325`.

## 5. Business rules

- **BR-EDU-01** Creating a plan writes one `EducationPlan` per selected subject; each has `title` equal to its `subject` and shares the dialog's description, completion date, materials and notes. `[Implemented]` `src/pages/Education.jsx:164-166`
- **BR-EDU-02** The learner of a new plan is the dialog's selection, else the active learner, else (only when no learners exist) the signed-in user's full name. `[Implemented]` `src/pages/Education.jsx:162-163`
- **BR-EDU-03** A custom subject is accepted when its trimmed text is non-empty and not already in the subject list (defaults plus custom, exact match); it is appended to the device-local list, selected in the form, and the input cleared. Custom subjects are never removed by the UI. `[Implemented]` `src/pages/Education.jsx:225-233`
- **BR-EDU-04** Every learner is created with colour `#8b5cf6`; the colour is displayed as a dot in the learner list and is not otherwise used on the page. `[Implemented]` `src/pages/Education.jsx:41,153,698`
- **BR-EDU-05** Deleting a learner deletes all plans and all activities carrying that `learner_id` in the same operation. `[Implemented]` `src/pages/Education.jsx:213-220`
- **BR-EDU-06** "Delete Subject" deletes the plans and activities whose `learner_id` is the active learner and whose `subject` equals the dialog's subject, after the confirm in §4.5. `[Implemented]` `src/pages/Education.jsx:194-205`
- **BR-EDU-07** An activity added from a card carries the card's learner and subject and the id of the card's first plan; when the card has no plan row, `plan_id` is `null`. `[Implemented]` `src/pages/Education.jsx:236`, `src/components/education/SubjectCard.jsx:179`
- **BR-EDU-08** `days_of_week` is editable only for Weekly and Biweekly; selecting any frequency resets the days to none. `[Implemented]` `src/pages/Education.jsx:873,880`, `src/components/education/SubjectCard.jsx:236,245`
- **BR-EDU-09** Completion: ticking an activity that is not completed and whose frequency is not `once` sets `completed: true`, `last_completed_date` = today, and `due_date` = now plus 1 day (daily), 7 (weekly), 14 (biweekly) or 30 days (monthly). Any other tick (a `once` activity, or unticking) flips `completed` and sets `last_completed_date` to `null`. `[Implemented]` `src/pages/Education.jsx:270-278,290-303`
- **BR-EDU-10** "Done" means `completed` is true and frequency is `once`; a repeating activity never counts as done. `[Implemented]` `src/pages/Education.jsx:656,946,1008`
- **BR-EDU-11** In the Due / Past / Next / Done views the set of cards is the distinct learner × subject pairs among activities that pass the view rule (after the learner and subject dropdowns); each card shows only its passing activities. `[Implemented]` `src/pages/Education.jsx:635-657,1019-1026`
- **BR-EDU-12** In the All view the set of cards is the distinct learner × subject pairs among plans (after the dropdowns), each showing all activities for that pair. Activities whose pair has no plan row are not shown. `[Implemented]` `src/pages/Education.jsx:660-667,1044-1049`
- **BR-EDU-13** Learner heading colour by view: Due blue, Past red, Next amber, Done green, All purple. `[Implemented]` `src/pages/Education.jsx:1011-1018,1040`
- **BR-EDU-14** Learner headings appear in the four status views for each learner with cards; in All only under "All Learners" with two or more learners. `[Implemented]` `src/pages/Education.jsx:1005-1007,1037`
- **BR-EDU-15** Ordering: learners in the order returned by the unsorted learner list; cards in the order the pair first appears (plans newest-created first in All; activities newest-created first in the status views); within a card, assignments sorted by `due_date` ascending with dated before undated, activities in load order (newest created first). `[Implemented]` `src/pages/Education.jsx:141-143,636-650,660-667`, `src/components/education/SubjectCard.jsx:152-161`
- **BR-EDU-16** Pill counts are computed over the learner dropdown's scope and ignore the subject dropdown. `[Implemented]` `src/pages/Education.jsx:943-947`
- **BR-EDU-17** The learner dropdown renders only with two or more learners; the subject dropdown only when more than one distinct subject is available for the learner scope. `[Implemented]` `src/pages/Education.jsx:964,979-982`
- **BR-EDU-18** Flipping collapse-all clears the exception set; every card and section adopts the new flag; an individual card toggle records its key as an exception. `[Implemented]` `src/pages/Education.jsx:994,1025,1048`, `src/components/education/SubjectCard.jsx:78-80,116-118,168`
- **BR-EDU-19** A card's initial collapsed state equals the page's collapse flag (off at load), so cards start expanded in every view. `[Implemented]` `src/components/education/SubjectCard.jsx:113-114`, `src/pages/Education.jsx:54` (D-650)
- **BR-EDU-20** Section headers "Assignments (n)" / "Activities (n)" count the activities shown in the card under the current view. `[Implemented]` `src/components/education/SubjectCard.jsx:91,152-161`
- **BR-EDU-21** Deleting an activity from a row is immediate (no confirm dialog); deleting a learner always confirms; deleting a subject confirms with the browser confirm. `[Implemented]` `src/components/education/SubjectCard.jsx:60`, `src/pages/Education.jsx:196,696`
- **BR-EDU-22** Resource links are stored as one JSON-encoded array of strings in `resource_links`; a value that fails to parse is treated as an empty list. `[Implemented]` `src/components/education/ActivityLinksDialog.jsx:12-18,32`
- **BR-EDU-23** "Save Changes" on an activity sends the whole loaded row minus `id`, with `days_of_week` from the editor. Neither this save nor the links save requests a page reload. `[Implemented]` `src/components/education/SubjectCard.jsx:49,126-132`
- **BR-EDU-24** "Save to Library" from the edit dialog writes learner, title, type, `description` = notes, `duration` = "", `materials` = "" and does not save pending edits. `[Implemented]` `src/components/education/SubjectCard.jsx:134-150`
- **BR-EDU-25** Exports include the plans and activities of the learner(s) in view, filtered by the subject dropdown and by the active status view's rule; weekly activities with no days are placed in no section. `[Implemented]` `src/pages/Education.jsx:307-347,476-534`
- **BR-EDU-26** The active learner is: the first learner after load when none is set; a newly created learner; the learner chosen in the dropdown; cleared when that learner is deleted. `[Implemented]` `src/pages/Education.jsx:147,155,221,965`
- **BR-EDU-27** Goal creation from the activity library "+" writes a `Goal` with `title` = "{entry title} Education Goal", `description` = "Created from Education Manager - {entry title}", `timeframe` = `monthly`, `status` = `not_started`, `member_name` = the learner's name; then shows the alert `"{entry title}" goal created! View it in Goal Manager.` `[Implemented]` `src/pages/Education.jsx:248-263`, `src/components/ActivityLibrary.jsx:130-135,266-269`
- **BR-EDU-28** Goal creation from the generator's "Also create these as goals for the learners" writes one `Goal` per created activity with `title` = the suggestion's title, `description` = its description, `timeframe` = `weekly`, `status` = `not_started`, `member_name` = the plan's learner name or "Unknown". `[Implemented]` `src/components/ActivityGenerator.jsx:160-170` (D-658)
- **BR-EDU-29** Plan `status`, `due_time`, `synced_to_schedule` and `schedule_time` are never written or displayed by this feature. `[Implemented]` `src/pages/Education.jsx:165,184-189` (see `10-architecture/data-model/education.md`)
- **BR-EDU-30** This page performs no realtime subscription; data refreshes after each of its own writes (`loadData`) and on revisit. `[Implemented]` `src/pages/Education.jsx:135-148` (no `subscribe` call). Other surfaces subscribe to `EducationPlan` / `EducationActivity` (`10-architecture/schedule-hub.md` AR-HUB-11, AR-HUB-36).

### 5a. State & lifecycle

`EducationActivity.completed` / `last_completed_date` / `due_date`:

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| not completed, frequency ≠ once | tick | completed = true, last_completed_date = today, due_date = today + interval (BR-EDU-09) | disappears from Due (completed today) `src/pages/Education.jsx:69-72,291-298` |
| not completed, frequency = once | tick | completed = true, last_completed_date = null | appears in Done `src/pages/Education.jsx:299-301` |
| completed (any frequency) | untick | completed = false, last_completed_date = null | `src/pages/Education.jsx:299-301` |
| completed, frequency ≠ once | tick again | (same as untick: completed = false) | `src/pages/Education.jsx:291,299-301` |
| any | Daily To-Do checkbox on an `education` schedule item | completed flipped, no date changes | `src/components/DailyToDo.jsx:125-126` (`10-architecture/schedule-hub.md` AR-HUB-23) |

Learner: created → (active learner) → hard-deleted with cascade (BR-EDU-05). No update path `[Implemented]` `src/pages/Education.jsx:150-157,213-223`.

Plan: created (BR-EDU-01) → updated by Edit Subject (description, materials, notes, due_date) → hard-deleted by Delete Subject (BR-EDU-06) or learner deletion `[Implemented]` `src/pages/Education.jsx:164-166,184-189,199-201,217`. `status` has no transitions (BR-EDU-29).

Activity-library entry: created from the edit dialog or the library form → hard-deleted from the library; never updated; survives learner deletion `[Implemented]` `src/components/education/SubjectCard.jsx:137`, `src/components/ActivityLibrary.jsx:61,78`, `src/pages/Education.jsx:216-220`.

### 5b. Time & date semantics

- "Today" as a string uses formatter C (UTC date) for `today` and for completion dates; the weekday and day-of-month come from the device clock; comparisons use a device-local midnight `Date` (`10-architecture/time-and-date-semantics.md` AR-TIME-01, AR-TIME-02, D-100) `[Implemented]` `src/pages/Education.jsx:56-61,277,292`.
- `due_date` and `last_completed_date` are parsed as `new Date(s + "T00:00:00")` (AR-TIME-03) `[Implemented]` `src/pages/Education.jsx:64,70,93,629`.
- **Due today** (`isActivityDueToday`): false when `last_completed_date` is today; false when `completed` and frequency `once`; otherwise true when `due_date` is today; or frequency `daily`; or `weekly` and `days_of_week` contains today's short weekday; or `biweekly` and (`days_of_week` contains today or `due_date` is today); or `monthly` and the `due_date` day-of-month equals today's. `[Implemented]` `src/pages/Education.jsx:63-89` (D-105 against Dashboard and Daily Schedule)
- **Overdue** ("Past", `isActivityOverdue`): false when `completed`; true when `due_date` is strictly before today; or `weekly` with days where some day is earlier in the week than today and today is not among the days; or `monthly` with a `due_date` whose day-of-month is less than today's. `[Implemented]` `src/pages/Education.jsx:91-111` (D-106)
- **Upcoming** ("Next", `isActivityUpcoming`): not `completed`, has a `due_date`, and the due date is more than 0 and at most 7 days after today's local midnight. The Next pill count repeats the same rule inline. `[Implemented]` `src/pages/Education.jsx:627-633,945`
- **Done**: `completed` and frequency `once` (BR-EDU-10) `[Implemented]` `src/pages/Education.jsx:656`.
- **Next due after completion**: computed from the completion moment, not from the previous `due_date`; monthly adds 30 days (D-107, D-137) `[Implemented]` `src/pages/Education.jsx:270-278`.
- A prior-due helper (today minus the same intervals) exists and is not called `[Partial]` `src/pages/Education.jsx:280-288`.
- The activity library dialog computes its own date-only "has due / has overdue" status on mount that no control displays `[Partial]` `src/components/ActivityLibrary.jsx:21,31-40`.
- Divergent definitions on other surfaces (Dashboard badge, Daily Schedule count and quick-link colour) are recorded in `10-architecture/time-and-date-semantics.md` §8.3 (D-105, D-106).

## 6. Data

Entities (schema and lifecycle detail in `10-architecture/data-model/education.md`; goals in `10-architecture/data-model/goals.md`):

| Entity | Role here | Reads (sort, limit) | Writes |
|---|---|---|---|
| `Learner` | owned | unsorted `list()` `src/pages/Education.jsx:141` | create `:152`; delete `:219` |
| `EducationPlan` | owned | `-created_date`, 200 `:142` | create `:165`; update `:184-189`; delete `:200,209,217` |
| `EducationActivity` | owned | `-created_date`, 500 `:143`; unsorted `list()` for the generator's duplicate check `src/components/ActivityGenerator.jsx:137`; `-updated_date`, 500 for the library's unused status `src/components/ActivityLibrary.jsx:34` | create `:243`, `src/components/ActivityGenerator.jsx:60,149`, `src/components/ActivityLibrary.jsx:105`; update `:294-300`, `src/components/education/SubjectCard.jsx:49,130`; delete `:201,218,266` |
| `FavoriteActivity` (activity library) | owned | `-updated_date`, 100 `src/components/ActivityLibrary.jsx:49` | create `src/components/ActivityLibrary.jsx:61`, `src/components/education/SubjectCard.jsx:137`; delete `src/components/ActivityLibrary.jsx:78` |
| `Goal` | referenced (outbound) | none | create `src/pages/Education.jsx:250-256`, `src/components/ActivityGenerator.jsx:162-168` |
| `ThemeSettings.enable_education` | referenced | via Settings / Layout event | none here |
| `User` (`auth.me`) | referenced | full name for the no-learner plan option; email for the email export `src/pages/Education.jsx:137,609` | none |

- Fields written on `EducationActivity` by this feature: `plan_id`, `learner_id`, `subject`, `title`, `type`, `frequency`, `days_of_week`, `due_date`, `notes`, `resource_links`, `completed`, `last_completed_date` `[Implemented]` `src/pages/Education.jsx:43,236,243,294-300`, `src/components/education/SubjectCard.jsx:49,128-130`.
- `subject` and `learner_id` on an activity are copies taken from the plan at creation `[Implemented]` `src/pages/Education.jsx:236,243`, `src/components/ActivityGenerator.jsx:62-64,151-152`, `src/components/ActivityLibrary.jsx:107-108`.
- The page keeps all three lists in memory and derives every view from them; there is no server-side filtering by learner or status `[Implemented]` `src/pages/Education.jsx:140-148,635-667`.

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| in | Daily Schedule | "Edu (n)" quick link navigates to `/education?filter=due`; badge and colour rules there | `src/pages/DailySchedule.jsx:918-933`; `20-features/daily-schedule/spec.md` BR-SCHED-11/12/14 |
| in | Dashboard | education button navigates to `/education?filter=due`; count and colour from its own due/overdue rule | `src/pages/Dashboard.jsx:79-105,293-307`; `20-features/dashboard` |
| in | Settings | `enable_education` toggle hides the sidebar entry (live via `featuresToggled`) | `src/pages/Settings.jsx:706-742`, `src/components/Layout.jsx:33,51-58,129,191`; `10-architecture/preferences.md` AR-PREF-20..23 |
| out | Goals | "+" on an activity-library entry creates a monthly goal (BR-EDU-27); the generator's checkbox creates weekly goals (BR-EDU-28). `member_name` receives the learner's name (Goals displays members as "family members"; see `20-features/goals`) | `src/pages/Education.jsx:248-263`, `src/components/ActivityGenerator.jsx:160-170` |
| out (described) | Daily Schedule | "Add to Schedule" / "synced to the Daily Schedule"; schedule items of source type `education` are consumed by the to-do (completion write-through, delete-from-app) but no path creates them | `src/pages/UserManual.jsx:166,249`, `src/components/onboarding/EducationOnboarding.jsx:24`, `src/components/DailyToDo.jsx:125-126,191`; `10-architecture/schedule-hub.md` AR-HUB-23, D-206, Q-203 |
| in (data) | Daily Schedule / Daily To-Do | subscribe to `EducationPlan` and `EducationActivity` and clean up schedule items whose source was deleted | `10-architecture/schedule-hub.md` AR-HUB-11, AR-HUB-36 |
| out | AI services | `generateActivities` backend function (`ai-activities.md`) | `10-architecture/ai-services.md` §3 |
| out | Export | hand-built print window and email (§12) | `10-architecture/export-print-email.md` §3b, AR-EXPORT-01/03/04 |
| in | Account deletion / data wipe | learners, plans and activities are deleted by the wipe and by account deletion; library entries are not | `10-architecture/data-model/education.md` |

### 7a. Feedback & notifications

- Alert "Sent to your email!" after the email export `[Implemented]` `src/pages/Education.jsx:615`.
- Alert "Saved to Activity Library!" after Save to Library from the edit dialog `[Implemented]` `src/components/education/SubjectCard.jsx:145`.
- Alert `"{title}" goal created! View it in Goal Manager.` after the library "+" `[Implemented]` `src/pages/Education.jsx:258`.
- Alerts "Failed to generate activities. Please try again." and "Failed to assign activities. Please try again." in the generator (`ai-activities.md`) `[Implemented]` `src/components/ActivityGenerator.jsx:87,188`.
- Browser confirm `Delete the "{subject}" subject and all its plans and activities?` `[Implemented]` `src/pages/Education.jsx:196`.
- Shared "Delete Item?" dialog for learners (`10-architecture/shared-interactions.md` AR-UI-02) `[Implemented]` `src/pages/Education.jsx:696`.
- Inline validation "Please select at least one subject." `[Implemented]` `src/pages/Education.jsx:735`.
- No toasts, celebratory effects or reminders `[Implemented]` `src/pages/Education.jsx` (none present).

## 8. AI & automation

One touchpoint: the "AI Generator" mode of the Add Activities dialog, which sends age group, subject, type and quantity to the backend function `generateActivities` and returns suggestions for review; nothing is written until "Assign to N Plan(s)". User-facing contract, prompt and outputs: `ai-activities.md`. Mechanism and platform rules: `10-architecture/ai-services.md` §3 and AR-AI-01, AR-AI-04, AR-AI-07..09. No automations (`10-architecture/automations.md`) touch education entities `[Implemented]` `base44/workflows/` (none reference them).

## 9. Onboarding content

Dialog title "Welcome to Education", subtitle "Here's how to get the most out of this page — it only takes a minute!" `[Implemented]` `src/components/onboarding/EducationOnboarding.jsx:37-40`. Steps verbatim `[Implemented]` `src/components/onboarding/EducationOnboarding.jsx:5-26`:

1. **1. Create Subject Plans** — "Start by creating subject plans like Math, Reading, Science, or Art. Plans are assigned to you by default, but you can add other learners anytime. Give each plan a title, materials needed, and a target due date."
2. **2. Add Other Learners** — "Use the people icon to add multiple learners and manage their individual education journeys. You can reassign plans to different learners or keep them organized by subject."
3. **3. Add Assignments & Activities** — "Under each subject plan, add individual assignments or recurring activities. Set frequency (once, daily, weekly) and track completion. Recurring activities automatically reset so the schedule stays current."
4. **4. Track Progress & Sync to Schedule** — "Mark assignments as complete to track progress. Items can be synced to the Daily Schedule for time-blocked planning. View completion rates and manage everything from one dashboard."

- Single button "Got it — Don't Remind Me Again" sets device key `education_onboarded` = `"1"` and closes `[Implemented]` `src/components/onboarding/EducationOnboarding.jsx:29-32,53-57`. Closing by overlay or Escape only closes; the dialog returns on the next visit `[Implemented]` `src/components/onboarding/EducationOnboarding.jsx:34`.
- Shown on load when the key is absent (read failures count as dismissed); reopened by the header "Guide" button `[Implemented]` `src/pages/Education.jsx:27-30,671-675`.
- Persistence generation: 1 (device only; `10-architecture/preferences.md` AR-PREF-31, registry in `20-features/onboarding`).
- Claims in the steps not found in code: "reassign plans to different learners" (no plan learner edit) `[Described]` `:14`; "View completion rates" (the page shows counts, not rates) `[Described]` `:24`; "synced to the Daily Schedule" `[Described]` `:24` (D-206); "Plans are assigned to you by default" `[Described]` `:9` (D-652).

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `edu_custom_subjects` | JSON array of user-added subject names, appended after the ten defaults in the plan dialog | `[]` | adding a custom subject `src/pages/Education.jsx:230` | never (no UI) |
| `education_onboarded` | `"1"` when the walkthrough was dismissed with "Don't Remind Me Again" | unset | `src/components/onboarding/EducationOnboarding.jsx:30`, `src/pages/Education.jsx:674` | never (no UI) |

Registry: `10-architecture/preferences.md` Part D.

## 11. Seed / hardcoded data used

(Registry: `10-architecture/data-model/seed-data.md` §Education.)

- Default subjects: Math, Reading, Writing, Science, History, Geography, Art, Music, PE, Foreign Language `[Implemented]` `src/pages/Education.jsx:116`.
- Frequencies and labels: `once` Once, `daily` Daily, `weekly` Weekly, `biweekly` Biweekly, `monthly` Monthly (default `once`) `[Implemented]` `src/pages/Education.jsx:118`, `src/components/ActivityGenerator.jsx:16`, `base44/entities/EducationActivity.jsonc`.
- Days of week (picker order): Mon, Tue, Wed, Thu, Fri, Sat, Sun; weekday lookup order Sun … Sat `[Implemented]` `src/pages/Education.jsx:57,119`, `src/components/education/SubjectCard.jsx:120` (`10-architecture/time-and-date-semantics.md` AR-TIME-31).
- Print day names and mapping Mon→Monday … Sun→Sunday `[Implemented]` `src/pages/Education.jsx:330-331,496-497`.
- Activity types: `assignment` (default in add/edit forms), `activity` (default in the library form and the AI generator) `[Implemented]` `src/pages/Education.jsx:43`, `src/components/ActivityLibrary.jsx:26`, `src/components/ActivityGenerator.jsx:14,27`.
- Learner default colour `#8b5cf6` `[Implemented]` `src/pages/Education.jsx:41`.
- AI age groups: Preschool (3-5), K-1st Grade (5-7), 2-3rd Grade (7-9), 4-5th Grade (9-11), 6-8th Grade (11-14), High School (14-18), 18+ `[Implemented]` `src/components/ActivityGenerator.jsx:13`.
- AI quantity bounds 1–10, default 5 `[Implemented]` `src/components/ActivityGenerator.jsx:28,334-336`.
- Next-due intervals 1 / 7 / 14 / 30 days `[Implemented]` `src/pages/Education.jsx:273-276`.
- Upcoming window 7 days `[Implemented]` `src/pages/Education.jsx:632`.
- Read limits 200 plans, 500 activities, 100 library entries `[Implemented]` `src/pages/Education.jsx:142-143`, `src/components/ActivityLibrary.jsx:49`.
- `StatsBar` (pill row component: label, value, colour) is imported by the page but not rendered; the pills are built inline `[Partial]` `src/components/StatsBar.jsx:3-20`, `src/pages/Education.jsx:22,942-962`.

## 12. Print / email formats

Mechanism tier C (hand-built HTML) per `10-architecture/export-print-email.md` §3b; recipient and confirmation per AR-EXPORT-01/03/04.

- **Triggers**: "Print education schedule" opens a new window, writes the document and calls print; "Email education schedule" sends the same structure as HTML to the signed-in user's email with the title as subject, then alerts "Sent to your email!" `[Implemented]` `src/pages/Education.jsx:349-372,470-472,609-615,927-938`. No options dialog and no remembered inputs `[Implemented]` `src/pages/Education.jsx:305,475`.
- **Title**: "Weekly Education Schedule" under "All Learners", else "{learner name} - Weekly Education Schedule" `[Implemented]` `src/pages/Education.jsx:308-310,477-479`.
- **Scope** (BR-EDU-25): learners = the dropdown's learner or all; plans filtered by the subject dropdown; activities filtered by the subject dropdown and by the active status view (Due / Past / Next / Done / All rules of §5b) `[Implemented]` `src/pages/Education.jsx:307-327,476-494`.
- **Structure**, identical for print and email `[Implemented]` `src/pages/Education.jsx:371-470,499-607`:
  1. Heading with the title, then "Generated: {long US date with weekday}".
  2. **Learning Plans** (when any): per plan its title, description, "Materials:", "Target Date:", "Notes:" when present. Plans are not grouped or labelled by learner.
  3. **Daily Activities** (frequency `daily`): checkbox, title, notes.
  4. **Weekly Activities** (frequency `weekly` with at least one day): grouped under Monday … Sunday headings; an activity with several days is listed under each; checkbox, title, notes.
  5. **One-Time Activities** (frequency `once`): checkbox, title, notes, "Due: {date}" when set.
  6. **Other Activities** (`biweekly` / `monthly`): checkbox, title, "Bi-Weekly" or "Monthly", notes, "Next Due: {date}" when set.
  - Every checkbox is rendered unchecked regardless of completion; days of week, type (assignment/activity) and learner name are not printed per activity `[Implemented]` `src/pages/Education.jsx:400-403,421-424`.
- **`PrintFormatEducation`** (per learner × subject layout: "{learner} - {subject}", "Generated:" line, "Learning Plans" with title/description/Materials/Target Date/Notes, then "Activities & Assignments" split into Assignments and Activities, each sub-grouped One-Time / Daily / Weekly / Biweekly / Monthly, rows with checkbox, title, notes, "Due:" and "Days:") exists and is not imported by any page `[Partial]` `src/components/PrintFormatEducation.jsx:1-103` (`10-architecture/export-print-email.md` D-314).

## 13. Acceptance criteria

- **AC-EDU-01** Given the New EDU Plan dialog with learner L and subjects Math and Art selected, When "Create EDU Plan" is pressed, Then two plans exist for L, titled "Math" and "Art", each with the dialog's description, date, materials and notes. (refs BR-EDU-01)
- **AC-EDU-02** Given no subject is selected, When "Create EDU Plan" is pressed, Then "Please select at least one subject." is shown and no plan is created. (refs §4.3)
- **AC-EDU-03** Given "Robotics" is typed in "Add custom subject..." and Enter pressed, Then a "Robotics" chip appears selected, `edu_custom_subjects` contains "Robotics", and the chip is offered on later visits on the same device. (refs BR-EDU-03)
- **AC-EDU-04** Given a learner with two plans and three activities, When the learner is deleted and confirmed, Then the learner, both plans and all three activities are gone and any library entries for that learner remain. (refs BR-EDU-05)
- **AC-EDU-05** Given a weekly activity with days Mon and Wed, not completed, and today is Wednesday, When the Due view is shown, Then the activity is listed; When it is ticked, Then `completed` is true, `last_completed_date` is today, `due_date` is today + 7 days, and it no longer appears under Due. (refs BR-EDU-09, §5b)
- **AC-EDU-06** Given a monthly activity ticked today, Then its `due_date` becomes today + 30 days. (refs BR-EDU-09)
- **AC-EDU-07** Given a `once` activity that is completed, Then it is counted under Done and not under Due; When unticked, Then `completed` is false and `last_completed_date` is null. (refs BR-EDU-10, §5a)
- **AC-EDU-08** Given a `daily` activity that is completed, Then it is not counted under Done. (refs BR-EDU-10)
- **AC-EDU-09** Given an activity due 3 days from now and another due 9 days from now, When the Next view is shown, Then only the first is listed and the Next pill count is 1. (refs §5b)
- **AC-EDU-10** Given the page is opened at `/education?filter=due` or `/education`, Then the Due view is active. (refs §0)
- **AC-EDU-11** Given two learners, When the learner dropdown is set to one of them, Then only that learner's cards show, the pill counts cover only that learner, and that learner becomes the active learner. (refs BR-EDU-16, BR-EDU-17, BR-EDU-26)
- **AC-EDU-12** Given one learner only, Then no learner dropdown is rendered; given that learner has one subject, Then no subject dropdown is rendered. (refs BR-EDU-17)
- **AC-EDU-13** Given the Past view, Then each learner heading is red; given the All view with "All Learners" and two learners, Then headings are purple; given the All view with one learner, Then no heading is shown. (refs BR-EDU-13, BR-EDU-14)
- **AC-EDU-14** Given a card's "+" is pressed with type Assignment, title "Ch. 5", frequency Weekly, days Tue, Then an activity with `plan_id` = the card's first plan, the card's learner and subject, `type` assignment, `frequency` weekly and `days_of_week` ["Tue"] is created. (refs BR-EDU-07, BR-EDU-08)
- **AC-EDU-15** Given an expanded activity row, When "Delete" is pressed, Then the activity is removed with no confirmation. (refs BR-EDU-21)
- **AC-EDU-16** Given the links dialog with two URLs added and "Save" pressed, Then `resource_links` equals the JSON string of the two URLs; given "Cancel" instead, Then `resource_links` is unchanged. (refs BR-EDU-22)
- **AC-EDU-17** Given the edit dialog, When "Save to Library" is pressed, Then a library entry with the activity's learner, title, type and notes-as-description exists, the alert "Saved to Activity Library!" shows, and the dialog closes without applying edits. (refs BR-EDU-24)
- **AC-EDU-18** Given "Collapse all" is pressed, Then every card and section collapses and the button reads "Expand all"; When one card title is clicked, Then that card expands while the others stay collapsed. (refs BR-EDU-18)
- **AC-EDU-19** Given a fresh page load in any view, Then every card is expanded. (refs BR-EDU-19)
- **AC-EDU-20** Given the Due view with learner L in the dropdown and subject "Math", When "Print education schedule" is pressed, Then the new window's title is "{L} - Weekly Education Schedule", Learning Plans lists only L's Math plan, and only activities due today for L in Math appear in their frequency sections. (refs BR-EDU-25, §12)
- **AC-EDU-21** Given a weekly activity with days Mon and Fri, When printed under the All view, Then it appears under both Monday and Friday. (refs §12)
- **AC-EDU-22** Given a weekly activity with no days, When printed, Then it appears in no section. (refs BR-EDU-25)
- **AC-EDU-23** Given "Email education schedule" is pressed, Then an email with the same structure is sent to the signed-in user's address with the title as subject and "Sent to your email!" is shown. (refs §12)
- **AC-EDU-24** Given no learners exist, Then the page shows the "Getting Started" card with "Add a learner to get started with education planning." and no pills or export buttons. (refs §4c)
- **AC-EDU-25** Given `education_onboarded` is absent, When the page loads, Then "Welcome to Education" opens; When "Got it — Don't Remind Me Again" is pressed, Then the key is "1" and the dialog does not open on the next load; the header "Guide" button reopens it. (refs §9)
- **AC-EDU-26** Given `ThemeSettings.enable_education` is false, Then "Education" is absent from the sidebar and the swipe ring. (refs §0)
- **AC-EDU-27** Given the Edit Subject dialog for subject S with the active learner A, When "Delete Subject" is confirmed, Then every plan and activity with learner A and subject S is deleted. (refs BR-EDU-06)
- **AC-EDU-28** Given the library "+" is pressed on entry "Fractions Bingo" for learner L, Then a goal titled "Fractions Bingo Education Goal", monthly, not started, member L exists and the alert `"Fractions Bingo" goal created! View it in Goal Manager.` shows. (refs BR-EDU-27)

## 14. Discrepancies & open questions

- **D-650** Card default state: the page passes a "default expanded" hint only for the Due / Past / Next views (`src/pages/Education.jsx:1025`, absent at `:1048`), while the card resolves its initial state from the always-supplied collapse flag first (`src/components/education/SubjectCard.jsx:113-118`), so cards start expanded in every view (`src/pages/Education.jsx:54`).
- **D-651** Collapse exceptions are recorded under the key the card reports, `edu-{learnerId}-{subject}` (`src/components/education/SubjectCard.jsx:112,168`), and looked up by the page under `{learnerId}-{subject}` (`src/pages/Education.jsx:1024-1025,1047-1048`). The visible outcome of an individual toggle is the same under either key.
- **D-652** With no learners, the plan dialog offers the signed-in user's full name and writes it as `learner_id` (`src/pages/Education.jsx:162-165,739-745`), and the walkthrough says "Plans are assigned to you by default" (`src/components/onboarding/EducationOnboarding.jsx:9`); the page renders only the "Getting Started" card while the learner list is empty and derives all cards from learners (`src/pages/Education.jsx:922-925,1005,1033`).
- **D-653** The User Manual describes a plan status workflow "Not Started → In Progress → Completed" with manual updates (`src/pages/UserManual.jsx:238`); the entity declares `status` (`base44/entities/EducationPlan.jsonc`) and the feature never writes or displays it (`src/pages/Education.jsx:165,184-189`).
- **D-654** The User Manual says each learner is given "a name, grade level, and color" (`src/pages/UserManual.jsx:235`); the learner form has Name and Grade Level only and every learner receives `#8b5cf6` (`src/pages/Education.jsx:41,684-689`).
- **D-655** In the Edit Subject dialog, "Save Changes" targets the plan that was opened (`editPlanForm.id`, `src/pages/Education.jsx:184`), while "Delete Subject" targets the plans and activities of the active learner with that subject (`src/pages/Education.jsx:197-198`); under "All Learners" the opened card may belong to a learner other than the active learner (`src/pages/Education.jsx:1005-1026`).
- **D-656** The Plan / Subject select lists one entry per distinct subject of the learner in the generator's Manual Entry (`src/components/ActivityGenerator.jsx:234-241`) and every plan row of the learner in the activity library's assign step (`src/components/ActivityLibrary.jsx:327-329`).
- **D-657** Notes composed for activities created from suggestions: the generator always writes `"{description}\n\nDuration: {duration}\nMaterials: {materials}"` (`src/components/ActivityGenerator.jsx:156`); the activity library writes description, "Duration: {duration}" and "Materials: {materials}" only when present, joined by single newlines (`src/components/ActivityLibrary.jsx:112`).
- **D-658** Goals created from education: the generator writes `title` = suggestion title, `timeframe` `weekly`, `description` = suggestion description (`src/components/ActivityGenerator.jsx:162-168`); the library "+" writes `title` = "{entry title} Education Goal", `timeframe` `monthly`, `description` = "Created from Education Manager - {entry title}" (`src/pages/Education.jsx:250-256`, `src/components/ActivityLibrary.jsx:130-135,268`).
- **D-659** The User Manual places "save to Activity Library" in the AI review flow (`src/pages/UserManual.jsx:257`); the generator has no such control (`src/components/ActivityGenerator.jsx:349-461`) and saving to the library is offered in the activity edit dialog (`src/components/education/SubjectCard.jsx:268-270`) and the library's own form (`src/components/ActivityLibrary.jsx:149-217`).
- **D-660** After a write, the page's own handlers reload the lists (`src/pages/Education.jsx:156,169,191,204,222,245,267,302`), whereas the activity edit "Save Changes" and the links "Save" write without a reload (`src/components/education/SubjectCard.jsx:49,126-132`).
- Cross-references: D-100, D-105, D-106, D-107, D-137 (`10-architecture/time-and-date-semantics.md`); D-206 / Q-203 (`10-architecture/schedule-hub.md`); D-314 (`10-architecture/export-print-email.md`).
- **Q-650** Blocks §4.3. Is a plan created while no learners exist (learner id = the user's full name) meant to be displayed, and under which learner?
- **Q-651** Blocks §4.5 / BR-EDU-06. When "All Learners" is shown and the opened card belongs to a learner other than the active learner, which learner's plans is "Delete Subject" meant to remove?
- **Q-652** Blocks `ai-activities.md` §4 and `activity-library.md` §4. Which of the two notes formats (D-657) is the intended one for activities created from suggestions and library entries?
- **Q-653** Blocks §7. Which flow is intended to create Daily Schedule items of source type `education` ("Add to Schedule", "synced to the Daily Schedule")? Same question as Q-203.
- **Q-654** Blocks §12. Is the per-learner × subject layout in `PrintFormatEducation` intended as a second export alongside the weekly schedule, or as its replacement?
