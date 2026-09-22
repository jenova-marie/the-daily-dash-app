# Vision Board — Feature Spec

**Feature code:** `VB-PIL` (pillars), `VB-EVAL` (daily evaluation), `VB-WK` (weekly review), `VB-REM` (reminders); the Collage, Affirmations and Slideshow parts carry `VB-COL`, `VB-AFF`, `VB-SLIDE` and are written up in their own Level 2 files · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 119 · Described 14 · Partial 3 (this file; the Level 2 files carry their own counts)

**Sources owned (this file and its Level 2 files `health-pillars.md`, `daily-evaluation.md`, `weekly-review.md`):** `src/pages/VisionBoard.jsx` (page shell, tab wiring, `?tab=` handling, pillar seeding, Guide button, date pickers, review print/email triggers), `src/components/visionboard/PillarManager.jsx`, `src/components/visionboard/PillarGoalGenerator.jsx`, `src/components/visionboard/DailyEvaluation.jsx`, `src/components/visionboard/WeeklyReview.jsx`, `src/components/visionboard/LowScorePillars.jsx`, `src/components/dashboard/DashboardFocalAreas.jsx`, `base44/entities/ReminderSettings.jsonc` (product role)

**Sources referenced (owned elsewhere):**
`src/components/visionboard/AffirmationManager.jsx` → `affirmations.md` ·
`src/components/visionboard/ImageGallery.jsx`, `ImageUploadSection.jsx`, `PrivateImageUploader.jsx`, the collage wiring inside `src/pages/VisionBoard.jsx` → `collage.md` ·
`src/components/visionboard/Slideshow.jsx`, `src/components/dashboard/DashboardSlideshow.jsx`, the slideshow launch wiring inside `src/pages/VisionBoard.jsx` → `slideshow.md` ·
`src/components/visionboard/OnboardingDialog.jsx` (dialog mechanics) → `affirmations.md` §9 / `20-features/onboarding` (registry); step text is reproduced in §9 below ·
`src/components/WidgetCard.jsx` → `10-architecture/export-print-email.md` ·
`src/components/Layout.jsx` (sidebar, swipe navigation, feature-toggle gating), `src/lib/HeaderContext.jsx` → `10-architecture/shared-interactions.md` ·
`src/pages/Dashboard.jsx` (widget registry, Focal Areas header button) → `20-features/dashboard` ·
`base44/entities/Goal.jsonc`, `base44/entities/GoalTask.jsonc` and the Goals page → `20-features/goals` (this spec names only the fields the pillar flows write) ·
`base44/entities/HealthPillar.jsonc`, `PillarActivity.jsonc`, `DailyPillarTracking.jsonc`, `DailyGratitude.jsonc` → `10-architecture/data-model/vision-board.md`, `10-architecture/data-model/checklist.md` (DailyGratitude) ·
`base44/entities/DailyChecklist.jsonc`, `ChecklistCompletion.jsonc` (read by the Weekly Review) → `20-features/daily-checklist` ·
the LLM call in `PillarGoalGenerator.jsx` → `10-architecture/ai-services.md` §4 (Touchpoint 3) ·
`base44/functions/deleteSyncedData/entry.ts` (full wipe) → `10-architecture/admin-operations.md` ·
`src/pages/UserManual.jsx` → `20-features/user-manual` · `src/pages/LandingPage.jsx` → `00-overview/product-vision.md`

**Permissions:** per-user data. `HealthPillar`, `DailyPillarTracking` and `ReminderSettings` carry the standard `created_by` rule for all four operations `[Implemented]` `base44/entities/HealthPillar.jsonc:50-63`, `base44/entities/DailyPillarTracking.jsonc:43-56`, `base44/entities/ReminderSettings.jsonc:20-33`; `PillarActivity` and `DailyGratitude` additionally allow any user whose role is `admin` `[Implemented]` `base44/entities/PillarActivity.jsonc:28-77`, `base44/entities/DailyGratitude.jsonc:19-68`. Admin-only operations: none in this feature.

**Level 2 sub-specs beside this file:**

| File | Code | Covers |
|---|---|---|
| `health-pillars.md` | `VB-PIL` | The Pillars tab: cards, expand/collapse, edit dialog, hide toggle, activities list and editing, seeding of default activities, "Create N Goal(s)" and the records it writes, the AI activity generator |
| `daily-evaluation.md` | `VB-EVAL` | The Daily Eval tab: wizard, rating, Activities Used, notes, Suggested Goals queue, gratitude, save, existing-evaluation summary with Edit and Delete, date picker |
| `weekly-review.md` | `VB-WK` | The Weekly Review tab: week navigation, Focal Areas averages, 7-day chart and filter chips, hover panel, average buckets, Daily Checklist summary, Daily Breakdown, print/email |
| `affirmations.md` | `VB-AFF` | The Affirmations card on the Collage tab (other writer) |
| `collage.md` | `VB-COL` | The Vision Collage card, shared and private images, defaults (other writer); the walkthrough dialog mechanics are in `affirmations.md` §9 |
| `slideshow.md` | `VB-SLIDE` | Auto-Generated and Custom slideshows, audio, voice, translation (other writer) |

## 0. Entry points & navigation

- Route: `/visionboard` `[Implemented]` `src/App.jsx:215` · Sidebar label: "Vision Board" (Eye icon) `[Implemented]` `src/components/Layout.jsx:21` · Header title text: "Vision Board" `[Implemented]` `src/pages/VisionBoard.jsx:51` · Position in swipe order: ninth of fourteen sidebar entries, after Goals and before Daily Quotes; removed from the swipe ring and the sidebar while the Vision Board feature toggle is off `[Implemented]` `src/components/Layout.jsx:12-27,127-131,189-194`
- Query parameters accepted: `tab=evaluation` opens the page on the Daily Eval tab; any other value or no parameter opens the Pillars tab. The parameter is read once, when the page mounts `[Implemented]` `src/pages/VisionBoard.jsx:53,67`. When the walkthrough has not been dismissed on this device, the page switches to the Pillars tab after the pillar list loads, regardless of the parameter `[Implemented]` `src/pages/VisionBoard.jsx:79,88-97`
- Feature-toggle gating: the sidebar entry and swipe position are hidden when `ThemeSettings.enable_vision_board` is `false`, as relayed by the `featuresToggled` window event; the route itself stays reachable `[Implemented]` `src/components/Layout.jsx:33,128,190`, `src/pages/Settings.jsx:712,724-728`. The Settings switch is labelled "Vision Board" under "Feature Toggles" `[Implemented]` `src/pages/Settings.jsx:707-713`. The User Manual says the toggle also hides the feature's dashboard widget `[Described]` `src/pages/UserManual.jsx:34`; the dashboard registry does not consult the toggle and the Focal Areas widget renders regardless `[Implemented]` `src/pages/Dashboard.jsx:22-42` (recorded as `AR-PREF-25` / `AR-PREF-26` in `10-architecture/preferences.md`)
- Header right-slot contents: one ghost icon button (HelpCircle icon, tooltip "Guide") that opens the walkthrough dialog without clearing its dismissal key `[Implemented]` `src/pages/VisionBoard.jsx:52,433-445`. No bell icon or reminder control is placed in the header or anywhere on the page `[Implemented]` `src/pages/VisionBoard.jsx:221-462` (repository-wide search for a Bell icon in `src/`: no matches). The User Manual describes one `[Described]` `src/pages/UserManual.jsx:376` (D-704)
- Dashboard entry: the widget registered as `focal-areas` with title "Focal Areas" is this feature's dashboard widget (§7); its header button navigates to `/visionboard?tab=evaluation` `[Implemented]` `src/pages/Dashboard.jsx:24,35,267-276`
- Page loading state: a spinner is shown until the pillar list has loaded or failed `[Implemented]` `src/pages/VisionBoard.jsx:55,103,208-214`

## 1. Purpose & user benefit

The Vision Board is a daily self-assessment and motivation page. The account owner rates thirteen life areas (pillars) from 1 to 5 each day, records one gratitude, turns low-rated areas into goals built from that pillar's activities, reviews the week's trend, and (in the parts owned by `collage.md`, `affirmations.md` and `slideshow.md`) keeps an image collage with affirmations and plays it as a slideshow.

The landing page claim, verbatim `[Described]` `src/pages/LandingPage.jsx:11`:

> **Vision Board** — Build your wellness vision with health pillar tracking, daily evaluations, slideshows, and progress reviews.

The in-app User Manual section with id `visionboard`, verbatim `[Described]` `src/pages/UserManual.jsx:359-379`:

> Create an inspirational vision collage with health pillars, daily evaluations, affirmations, and automated slideshows.
>
> - **Health Pillars:** Manage 13 core wellness areas (Nutrition, Fitness, Mindset, Rest, etc.) organized by Maslow's hierarchy. Each pillar can have a description, activities, and a visibility toggle. The Guide button re-shows the onboarding walkthrough.
> - **Daily Evaluation:** Rate each pillar 1–5 daily. Record activities completed and personal notes. After rating, you can optionally convert low-scoring pillars into tracked Goals. Use the calendar icon to view or edit evaluations for past dates — days with existing evaluations are marked with a dot.
> - **Weekly Review:** See performance trends with bar charts and a daily breakdown. Switch between This Week, 3 Months, and All Time views. Focal areas show average scores per pillar. Print or email your review.
> - **Affirmation Manager:** Create custom affirmations or generate them via AI for specific pillars. Star favorites for quick access. Select multiple affirmations to apply to your custom slideshow.
> - **Vision Collage:** Upload public images (URL-based) or private images (securely stored, only visible to you). Toggle individual images to show or hide them from the slideshow. Private images are displayed via time-limited signed URLs.
> - **Slideshow — Auto-Generated:** Launches with all collage images. AI generates affirmations specifically for pillars you rated 3 or below in your most recent evaluation, interleaved in round-robin order so every focus area is represented. Also accessible from the Dashboard Vision button.
> - **Slideshow — Custom:** Select exactly which images to include and uses your saved affirmations. Launch from the Collage tab or Dashboard.
> - **Slideshow Controls:** Ken Burns zoom animation per slide. Adjust speed (3–30 seconds per slide). Toggle affirmation overlay on/off. Navigate manually with arrow buttons. Choose from ambient audio presets (rain, ocean, music, etc.), shuffle audio, favorite and set a default track. Double-tap/double-click to show/hide controls on mobile.
> - **Reminders:** Set daily reminders to review your vision board using the bell icon.

The Goals section of the User Manual carries a "Vision Board Integration" block, verbatim `[Described]` `src/pages/UserManual.jsx:300-307`:

> **Vision Board Integration**
> - After completing a **Daily Evaluation** on the Vision Board, low-scoring pillars (rated 1–3) are highlighted as focal areas.
> - **Auto-convert focal areas to goals** — directly create goals from low-scoring pillars to address wellness gaps.
> - Track goals tied to specific health pillars to improve overall well-being.

The same section's opening line names the integration `[Described]` `src/pages/UserManual.jsx:279`: "Set and track personal or family goals across different timeframes with milestone tracking, progress monitoring, and integration with your Vision Board health pillars."

The Dashboard section of the manual describes the widget's sibling: "Click the **Vision** button to launch an inspirational slideshow using your Vision Board images and affirmations. Choose **Auto-Generated** (AI-curated based on your lowest-scoring health pillars) or **Custom** (your selected images and saved affirmations)." `[Described]` `src/pages/UserManual.jsx:40` (owned by `slideshow.md`).

## 2. Concepts & vocabulary

From `00-overview/glossary.md`: **pillar**, **pillar activity**, **daily evaluation**, **focal area**, **goal**, **milestone task**, **occurrence**, **frequency**, **walkthrough**, **feature toggle**, **device-local preference**, **widget**, **export**, **today**.

UI labels that display a glossary term under another name (mentioned once here, not used as terms of record): the tab is labelled "Daily Eval"; the pillar cards live under "Your Health Pillars"; the hide toggle tooltips say "assessments"; the Collage tab's low-rating panel is titled "✨ Focus Areas for Today"; the Weekly Review panel is titled "Focal Areas (Lowest Averages)"; the Affirmations card says "Focus Areas Today".

Feature-local terms, defined once:

- **Evaluation date** — the date shown on the Daily Eval card, chosen with the card's calendar button; defaults to the device's current date on page load. `[Implemented]` `src/pages/VisionBoard.jsx:56,238-262`
- **Review week** — the Sunday-to-Saturday week containing the review date shown on the Weekly Review card; defaults to the week containing the device's current date. `[Implemented]` `src/pages/VisionBoard.jsx:57,307-339`
- **Queued goal** — a goal the account owner has added "to plan" during an evaluation; it exists only in memory until "Complete" is pressed. `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:19-26,229-248`
- **Suggested Goals panel** — the per-pillar list inside the evaluation step that offers each pillar activity as a goal. `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:415-533`

## 3. User stories

- **US-VB-PIL-01** As the account owner, I want thirteen life areas set up for me the first time I open the page, in an order that runs from basic needs to self-actualisation, so that I can start rating without configuration `[Implemented]` `src/pages/VisionBoard.jsx:27-47,75-107`
- **US-VB-PIL-02** As the account owner, I want to rename, describe and recolour a pillar, and hide pillars I do not track, so that the evaluation asks only about what matters to me `[Implemented]` `src/components/visionboard/PillarManager.jsx:137-180,430-480`
- **US-VB-PIL-03** As the account owner, I want each pillar to hold a list of activities that I can extend, prune or have suggested by AI, so that evaluations and goals draw on my own habits `[Implemented]` `src/components/visionboard/PillarManager.jsx:45-135`, `src/components/visionboard/PillarGoalGenerator.jsx:17-100`
- **US-VB-PIL-04** As the account owner, I want to tick activities across pillars and turn them into goals with a frequency and occurrence count in one step `[Implemented]` `src/components/visionboard/PillarManager.jsx:202-245,259-312`
- **US-VB-EVAL-01** As the account owner, I want a step-by-step evaluation that asks about one visible pillar at a time and finishes with a gratitude prompt, so that the daily check takes a minute `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:30,97-116,299-566`
- **US-VB-EVAL-02** As the account owner, I want a low rating to surface that pillar's activities as goals I can queue, and I want nothing written until I complete the evaluation `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:97-100,155-182,229-248`
- **US-VB-EVAL-03** As the account owner, I want to revisit, edit or delete a past day's evaluation from a calendar that marks the days I have evaluated `[Implemented]` `src/pages/VisionBoard.jsx:109-114,238-262`, `src/components/visionboard/DailyEvaluation.jsx:254-297`
- **US-VB-WK-01** As the account owner, I want a week-by-week chart of my ratings, my lowest-averaging pillars over three horizons, and a per-day breakdown with my notes, and I want to print or email it `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:148-376`, `src/pages/VisionBoard.jsx:267-341`
- **US-VB-WK-02** As the account owner, I want the review to show how many days this week I completed each daily checklist item `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:18-42,317-347`
- **US-VB-REM-01** As the account owner, I want the dashboard to show my three lowest-rated pillars and today's gratitude, and to nudge me when today's evaluation is missing `[Implemented]` `src/components/dashboard/DashboardFocalAreas.jsx:24-121`, `src/pages/Dashboard.jsx:110-115,267-276`
- **US-VB-REM-02** As the account owner, I want to set daily reminder times to review my vision board `[Described]` `src/pages/UserManual.jsx:376`; the entity exists and is read, no UI sets it and nothing is sent `[Partial]` `base44/entities/ReminderSettings.jsonc:1-34`, `src/components/dashboard/DashboardFocalAreas.jsx:32,65-69`

## 4. Capabilities & interactions

### Page shell and tabs

- Four tabs in a single row, labelled "Pillars", "Daily Eval", "Weekly Review", "Collage"; the active tab is in-memory state, initialised from the `tab` query parameter `[Implemented]` `src/pages/VisionBoard.jsx:67,223-229`.
- **Pillars** renders a card titled "Your Health Pillars" containing the pillar manager (`health-pillars.md`) `[Implemented]` `src/pages/VisionBoard.jsx:231-235`.
- **Daily Eval** renders a card titled "Daily Evaluation" whose header holds the evaluation-date calendar button; the body is the evaluation wizard for the evaluation date, fed only the pillars that are not hidden, in pillar order (`daily-evaluation.md`) `[Implemented]` `src/pages/VisionBoard.jsx:237-265`.
- **Weekly Review** renders a card titled "Weekly Review" with print and email buttons in its header, a week navigator above the review, and the review for the review week fed every pillar including hidden ones (`weekly-review.md`) `[Implemented]` `src/pages/VisionBoard.jsx:267-342`.
- **Collage** renders the "Vision Collage" card (slideshow launch buttons, the "✨ Focus Areas for Today" panel described in §7, the image gallery and "My Private Images"), the custom-slideshow picker dialog, and the "Affirmations" card; the gallery and private uploader mount only after the tab has been opened at least once `[Implemented]` `src/pages/VisionBoard.jsx:71,228,344-430`. Content is owned by `collage.md`, `affirmations.md`, `slideshow.md`.
- Completing an evaluation switches the page to the Pillars tab `[Implemented]` `src/pages/VisionBoard.jsx:263`, `src/components/visionboard/DailyEvaluation.jsx:189`.

### Pillar seeding

- On every page load the pillar list is read. When the account has no pillars, the thirteen defaults (§11) are created in one bulk write with `order` = their index, and the page proceeds with that list `[Implemented]` `src/pages/VisionBoard.jsx:78-87`. Otherwise the stored pillars are sorted by `order` ascending (missing order counts as 0) `[Implemented]` `src/pages/VisionBoard.jsx:93`.
- If the read fails, the thirteen defaults are shown from memory and nothing is written `[Implemented]` `src/pages/VisionBoard.jsx:99-102`.
- In either branch, when the device has no `visionboard_onboarded` key, the walkthrough opens and the Pillars tab is selected `[Implemented]` `src/pages/VisionBoard.jsx:79,88-91,94-97`.

### Evaluation-date picker (Daily Eval card header)

- A ghost calendar-icon button whose tooltip is the evaluation date formatted `EEEE, MMM d` opens a single-date calendar `[Implemented]` `src/pages/VisionBoard.jsx:238-249`.
- Days that have at least one `DailyPillarTracking` row are rendered bold with a dot; the calendar footer reads "Days with evaluations" next to a dot swatch `[Implemented]` `src/pages/VisionBoard.jsx:250-259`.
- The marked days come from the 200 most recent tracking rows (sorted by date descending), de-duplicated by date and parsed as local noon; the set reloads whenever the active tab changes and again after an evaluation is saved or deleted `[Implemented]` `src/pages/VisionBoard.jsx:109-114,263`.
- Choosing a day sets the evaluation date; the wizard reloads for that date (`daily-evaluation.md` §1) `[Implemented]` `src/pages/VisionBoard.jsx:249,263`.

### Review-week navigator (Weekly Review card)

- A bar with a previous-week chevron, a centre label `MMM d – MMM d, yyyy` (Sunday to Saturday of the review week) that opens a single-date calendar, and a next-week chevron `[Implemented]` `src/pages/VisionBoard.jsx:307-339`.
- Picking any date snaps the review date to that date's Sunday `[Implemented]` `src/pages/VisionBoard.jsx:327`.
- The next-week chevron is disabled when the review week is the current week or later `[Implemented]` `src/pages/VisionBoard.jsx:335`. There is no lower bound on previous-week presses `[Implemented]` `src/pages/VisionBoard.jsx:308-313`.

### Weekly Review print and email (header of the card)

- "Print review" (printer icon) opens a blank window, writes the card's rendered HTML under the title "Weekly Review" with a body style of Inter, 24 px padding, and requests print `[Implemented]` `src/pages/VisionBoard.jsx:270-285`.
- "Email review" (share icon) sends the same rendered HTML to the signed-in account's email with subject `Weekly Review - {MMM d, yyyy}` of the review date, then shows the alert "Sent to your email!" `[Implemented]` `src/pages/VisionBoard.jsx:286-304`. Mechanism and conventions: `10-architecture/export-print-email.md` (AR-EXPORT-01, 03, 04; surface table row "Vision Board, Weekly Review card").

### 4a. Keyboard & pointer

- Double-click or double-tap (two clicks within 300 ms) on a pillar card opens its edit dialog `[Implemented]` `src/components/visionboard/PillarManager.jsx:137-155,320` (AR-UI-04, AR-UI-05, D-320 in `10-architecture/shared-interactions.md`).
- Enter in the "Add activity..." input adds the activity `[Implemented]` `src/components/visionboard/PillarManager.jsx:390-392`.
- Hovering a day column on the Weekly Review chart opens the side panel for that day; leaving the chart closes it `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:226-231,258`.
- **Swipe-navigation suppression handshake.** While the evaluation wizard is active (no evaluation exists for the date, or Edit was pressed) the component sets the global flag `window.__evalInProgress` to `true`; the flag is set back to `false` when the wizard becomes inactive, when the component unmounts, and immediately after a save `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:31-36,187`. The app shell's left/right page swipe is ignored while the flag is `true` `[Implemented]` `src/components/Layout.jsx:74-76` (AR-UI-13 "Suppression" in `10-architecture/shared-interactions.md`). Deleting an evaluation returns the wizard to the active state, which sets the flag again `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:33-36,205-206`.
- No other keyboard bindings are observed in the owned files.

### 4b. View state & persistence

| Control | Values | Default | Scope |
|---|---|---|---|
| Active tab | `pillars` / `daily` / `weekly` / `collage` | `daily` when `?tab=evaluation`, else `pillars`; forced to `pillars` when the walkthrough opens or is dismissed | memory `src/pages/VisionBoard.jsx:67,90,96,438,443` |
| Evaluation date | any date | device current date | memory `src/pages/VisionBoard.jsx:56` |
| Review date | any Sunday | Sunday of the current week | memory `src/pages/VisionBoard.jsx:57` |
| Walkthrough open | open / closed | open when `visionboard_onboarded` is absent | memory, gated by device key `visionboard_onboarded` `src/pages/VisionBoard.jsx:70,79,433-445` |
| Collage tab visited | yes / no | no | memory `src/pages/VisionBoard.jsx:71` |
| Per-pillar expanded, editing-activities, checked activities, "collapse all" state | per pillar | all collapsed, none editing, none checked | memory `src/components/visionboard/PillarManager.jsx:32-37` |
| Wizard step, ratings, notes, selected activities, queued goals, panel open states | per evaluation session | step 1, panels closed | memory `src/components/visionboard/DailyEvaluation.jsx:9-28` |
| Focal Areas horizon | This Week / 3 Months / All Time | This Week | memory `src/components/visionboard/WeeklyReview.jsx:15` |
| Chart pillar filter | All Pillars / one pillar | All Pillars | memory `src/components/visionboard/WeeklyReview.jsx:12` |

Nothing on this page is stored as an account preference. The only device-local key is the walkthrough dismissal (§10).

### 4c. Empty & fallback states

- Page: spinner while pillars load `[Implemented]` `src/pages/VisionBoard.jsx:208-214`.
- Weekly Review: "Loading weekly data..." until ratings load; "No data yet" in the Focal Areas panel when no pillar has a positive average for the chosen horizon `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:146,184-186`.
- Dashboard Focal Areas widget: "Loading..." then "Complete a daily evaluation to see focal areas." when no evaluation exists `[Implemented]` `src/components/dashboard/DashboardFocalAreas.jsx:87-89,96-97`.
- "✨ Focus Areas for Today": renders nothing at all when no pillar is rated 3 or below today `[Implemented]` `src/components/visionboard/LowScorePillars.jsx:26`.
- Daily Eval and Pillars empty states: see the Level 2 files.

## 5. Business rules

- **BR-VB-01 (Thirteen pillars, Maslow order).** A fresh account receives exactly the thirteen pillars in §11, ordered Physiological → Safety → Love/Belonging → Esteem → Self-Actualization; the source comment states the intent verbatim: "Ordered by Maslow's hierarchy: Physiological → Safety → Love/Belonging → Esteem → Self-Actualization" `[Implemented]` `src/pages/VisionBoard.jsx:27-47,81-87`. The manual states the same `[Described]` `src/pages/UserManual.jsx:368`. No path creates additional pillars or deletes one; pillars are only edited or hidden `[Implemented]` `src/components/visionboard/PillarManager.jsx:157-180`.
- **BR-VB-02 (Hidden pillars leave the evaluation, keep their history).** The evaluation receives only pillars whose `is_hidden` is not true; the Weekly Review receives all pillars and shows any pillar that has all-time data or is not hidden; existing tracking rows are never touched by hiding `[Implemented]` `src/pages/VisionBoard.jsx:263,340`, `src/components/visionboard/WeeklyReview.jsx:127`, `src/components/visionboard/PillarManager.jsx:157-160`. Schema description: "If true, this pillar is excluded from daily assessments" `[Implemented]` `base44/entities/HealthPillar.jsonc:41-45`.
- **BR-VB-03 (Rating 3 or below is the low-rating threshold).** Every consumer that reacts to a low rating tests `rating <= 3`; the surfaces differ in which evaluation they read and whether a threshold or a "lowest three" ranking applies (§7 table, D-703).
- **BR-VB-04 (One evaluation per date, one row per pillar).** Saving writes or updates one `DailyPillarTracking` row per rated visible pillar keyed by `pillar_id` + `date`, and at most one `DailyGratitude` row per date (`daily-evaluation.md` BR-VB-EVAL-10..12) `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:122-153`.
- **BR-VB-05 (Goals from pillars are ordinary goals).** Both goal-creating flows write a `Goal` whose `title` is the activity text, `description` is `From {pillar name}`, `category` is the pillar name and `category_color` the pillar colour, with one `GoalTask` per occurrence titled `{activity} (i/n)` when n > 1; they differ in `member_name` (D-701) and are detailed in `health-pillars.md` §6 and `daily-evaluation.md` §6 `[Implemented]` `src/components/visionboard/PillarManager.jsx:218-238`, `src/components/visionboard/DailyEvaluation.jsx:155-182`.
- **BR-VB-06 (Weeks start on Sunday).** The review week, the checklist summary week and the chart's seven days all run Sunday to Saturday `[Implemented]` `src/pages/VisionBoard.jsx:57,318,327`, `src/components/visionboard/WeeklyReview.jsx:20-22,46-48` (AR-TIME-30).
- **BR-VB-07 (Walkthrough on first visit, per device).** The dialog opens after the pillar list loads whenever `visionboard_onboarded` is absent; both of its buttons write the key `[Implemented]` `src/pages/VisionBoard.jsx:79,88-97,433-445` (AR-PREF-31; D-323 in `10-architecture/shared-interactions.md`).
- **BR-VB-08 (The pillar name is a join key).** Default activities are looked up by the pillar's current name; the "✨ Focus Areas for Today" panel matches tracking rows to pillars by `pillar_name`; the dashboard widget, weekly review and slideshow match by `pillar_id` `[Implemented]` `src/components/visionboard/PillarManager.jsx:58,78`, `src/components/visionboard/LowScorePillars.jsx:17`, `src/components/dashboard/DashboardFocalAreas.jsx:44-47`, `src/components/visionboard/WeeklyReview.jsx:55,79-80` (D-705; the schema enum versus free-text name is D-015 in `10-architecture/data-model/vision-board.md`).

### 5a. State & lifecycle

| Object | State | Trigger | Next state | Side effects |
|---|---|---|---|---|
| Pillar `is_hidden` | false | eye button ("Hide from assessments") | true | pillar leaves the evaluation; card shows "hidden" badge and strikethrough name `src/components/visionboard/PillarManager.jsx:157-160,324-334` |
| Pillar `is_hidden` | true | eye button ("Show in assessments") | false | pillar re-enters the evaluation at its `order` position |
| Evaluation for a date | none | "Complete" on the gratitude step | exists (summary mode on next load) | tracking rows, gratitude, queued goals written; tab switches to Pillars `src/components/visionboard/DailyEvaluation.jsx:118-190` |
| Evaluation for a date | exists (summary) | "Edit" | editing (wizard, flag set) | none until Complete `src/components/visionboard/DailyEvaluation.jsx:260-262` |
| Evaluation for a date | editing | "Cancel" (gratitude step only) | exists (summary) | in-memory edits discarded on next load; queued goals kept in memory `src/components/visionboard/DailyEvaluation.jsx:551-555` |
| Evaluation for a date | exists | "Delete" + confirm | none (wizard, flag set) | every tracking row and gratitude row for the date deleted `src/components/visionboard/DailyEvaluation.jsx:192-210` |
| Walkthrough | not dismissed | either dialog button | dismissed (device) | `visionboard_onboarded` = "1"; Pillars tab selected `src/pages/VisionBoard.jsx:433-445` |
| Walkthrough | dismissed | Guide button | shown (key unchanged) | none `src/pages/VisionBoard.jsx:52` |

### 5b. Time & date semantics

- "Today" on this feature's surfaces is the device-local `YYYY-MM-DD` string produced by date-fns (formatter B of AR-TIME-01): the evaluation save/load/delete, the dashboard widget, and the "✨ Focus Areas for Today" panel `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:64,120,195`, `src/components/dashboard/DashboardFocalAreas.jsx:27`, `src/components/visionboard/LowScorePillars.jsx:10`, `src/pages/Dashboard.jsx:111`. The Affirmations card's "Focus Areas Today" uses the UTC string (formatter C) `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:34` (owned by `affirmations.md`; D-100).
- Stored dates are `YYYY-MM-DD` strings (AR-TIME-10); reminder times are `HH:MM` strings compared as strings (AR-TIME-11).
- Date strings are parsed back three ways on this feature: local noon for the calendar dots (`VisionBoard.jsx:111`), bare `new Date("YYYY-MM-DD")` for the Daily Breakdown headings (`WeeklyReview.jsx:353`) `[Implemented]` (AR-TIME-03, D-134).
- "Most recent evaluation" means the date of the first row when tracking rows are sorted by date descending (200 rows on the dashboard widget, 50 on the slideshow) `[Implemented]` `src/components/dashboard/DashboardFocalAreas.jsx:31,37`, `src/components/dashboard/DashboardSlideshow.jsx:58,74`.
- The reminder highlight condition is AR-TIME-49 `[Implemented]` `src/components/dashboard/DashboardFocalAreas.jsx:60-70`.
- The Weekly Review "3 Months" horizon is the 3 months preceding the review date, not the device date `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:63`.

## 6. Data

Full field sheets: `10-architecture/data-model/vision-board.md` (HealthPillar, PillarActivity, DailyPillarTracking), `10-architecture/data-model/checklist.md` (DailyGratitude), `10-architecture/data-model/goals.md` (Goal, GoalTask), `10-architecture/domain-model.md` (ReminderSettings).

| Entity | Operations by this feature | Read shape | Citation |
|---|---|---|---|
| `HealthPillar` | list; bulkCreate (seed); update (`name`, `color`, `description`; `is_hidden`) | unsorted `list()`, sorted in memory by `order` | `src/pages/VisionBoard.jsx:78-93`, `src/components/visionboard/PillarManager.jsx:158,165-169`, `src/components/dashboard/DashboardFocalAreas.jsx:30` |
| `PillarActivity` | list; bulkCreate (seed, AI picks); create; delete | unsorted `list()`, grouped by `pillar_id` in memory; no sort on `order` | `src/components/visionboard/PillarManager.jsx:48,60,79,113,130,213`, `src/components/visionboard/PillarGoalGenerator.jsx:83,87`, `src/components/visionboard/DailyEvaluation.jsx:85` |
| `DailyPillarTracking` | filter by `date`; filter by `pillar_id`+`date`; create; update; delete; list `-date` 200 (dots, dashboard); filter `{}` (all rows, weekly review); filter by `pillar_id` `-date` 1 (generator) | see citations | `src/components/visionboard/DailyEvaluation.jsx:65,125-140,196-197`, `src/pages/VisionBoard.jsx:110,263`, `src/components/visionboard/WeeklyReview.jsx:50`, `src/components/visionboard/LowScorePillars.jsx:11-13`, `src/components/dashboard/DashboardFocalAreas.jsx:31`, `src/components/visionboard/PillarGoalGenerator.jsx:23`, `src/pages/Dashboard.jsx:112` |
| `DailyGratitude` | filter by `date`; create; update; delete | first row for the date | `src/components/visionboard/DailyEvaluation.jsx:79-83,146-153,198-199`, `src/components/dashboard/DashboardFocalAreas.jsx:33,72-76` |
| `Goal` | create; list `-created_date` 200 (to find active goals matching an activity) | — | `src/components/visionboard/PillarManager.jsx:220-229`, `src/components/visionboard/DailyEvaluation.jsx:40,161-170`, `src/pages/VisionBoard.jsx:160-166` |
| `GoalTask` | create; bulkCreate; list `-created_date` 500 | — | `src/components/visionboard/PillarManager.jsx:230-237`, `src/components/visionboard/DailyEvaluation.jsx:41,171-180` |
| `ReminderSettings` | list (first row used) | — | `src/components/dashboard/DashboardFocalAreas.jsx:32,65-69` |
| `DailyChecklist`, `ChecklistCompletion` | filter `is_active: true`; filter by `date` for each of the 7 days | — | `src/components/visionboard/WeeklyReview.jsx:24-27` |
| `User` (auth) | `me()` for `full_name` (goal member) and `email` (review email) | — | `src/components/visionboard/DailyEvaluation.jsx:157,167`, `src/pages/VisionBoard.jsx:159,293-295` |

- Fields the pillar flows write on `Goal`: `title`, `description`, `timeframe`, `occurrences`, `status` (`not_started`), `member_name`, `category`, `category_color` `[Implemented]` `src/components/visionboard/PillarManager.jsx:220-229`, `src/components/visionboard/DailyEvaluation.jsx:161-170`. On `GoalTask`: `goal_id`, `title`, `frequency`, `completed` (`false`) `[Implemented]` `src/components/visionboard/PillarManager.jsx:230-237`, `src/components/visionboard/DailyEvaluation.jsx:173-178`. `GoalTask.frequency` is written with the chosen goal timeframe, which may be `annual` `[Implemented]` `src/components/visionboard/PillarManager.jsx:234,292`, `src/components/visionboard/DailyEvaluation.jsx:176,499`; the `GoalTask` schema declares `once | daily | weekly | biweekly | monthly` `[Implemented]` `base44/entities/GoalTask.jsonc:11-20` (D-702).
- `ReminderSettings` fields: `enabled` (boolean, default false, "Whether reminders are enabled") and `times` (array of `HH:MM` strings, default empty, "Array of times in HH:MM format when to send push notifications") `[Implemented]` `base44/entities/ReminderSettings.jsonc:5-17`.
- Every entity above except `Goal`, `GoalTask`, `DailyChecklist`, `ChecklistCompletion` is in the full-wipe list of `deleteSyncedData` `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:57-58` (see `10-architecture/admin-operations.md`).

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| inbound | Dashboard | Focal Areas widget header button → `/visionboard?tab=evaluation` | `src/pages/Dashboard.jsx:267-276` |
| inbound | Settings | feature toggle `enable_vision_board` hides the sidebar entry via `featuresToggled` | `src/pages/Settings.jsx:712-742`, `src/components/Layout.jsx:33,51-58,128,190` |
| outbound | Goals | `Goal` + `GoalTask` rows created from pillar activities (both flows); the Goals page displays them like any other goal | `src/components/visionboard/PillarManager.jsx:218-238`, `src/components/visionboard/DailyEvaluation.jsx:155-182` |
| inbound | Goals | active, non-archived goals whose title equals an activity text (case-insensitive) are shown as "N left" in the Suggested Goals panel | `src/components/visionboard/DailyEvaluation.jsx:38-60` |
| inbound | Daily Checklist | active checklist items and the week's completions feed the review's weekly summary | `src/components/visionboard/WeeklyReview.jsx:18-42` |
| outbound | Affirmations (`affirmations.md`) | today's ratings ≤ 3 populate "Focus Areas Today" generate buttons | `src/components/visionboard/AffirmationManager.jsx:32-41,152-170` |
| outbound | Slideshow (`slideshow.md`) | most recent evaluation's ratings ≤ 3 choose the pillars the Auto-Generated slideshow writes affirmations for | `src/components/dashboard/DashboardSlideshow.jsx:58-83` |
| outbound | AI services | pillar activity ideas (Touchpoint 3) | `10-architecture/ai-services.md` §4 |
| outbound | Export | Weekly Review print/email | `10-architecture/export-print-email.md` |
| shell | Shared interactions | swipe suppression flag, double-tap window, header title/right slot | `10-architecture/shared-interactions.md` AR-UI-04, 05, 12, 13 |

### Where "rating ≤ 3" is consumed

| Surface | Which evaluation is read | Rule applied | Tag · citation |
|---|---|---|---|
| Daily Eval → Suggested Goals panel | the rating just chosen for the current pillar | panel auto-opens when the rating is ≤ 3 and auto-closes when > 3; the panel can also be toggled by hand for any rating | `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:97-100,105-106,113-114,417-426` |
| Dashboard "Focal Areas" widget | rows of the most recent evaluation date (from the 200 most recent rows) | the **three lowest** ratings, ascending, ties resolved by the priority list below; no threshold | `[Implemented]` `src/components/dashboard/DashboardFocalAreas.jsx:36-55` |
| Collage tab "✨ Focus Areas for Today" | rows dated today (local) | every row with rating ≤ 3, matched to a pillar by name; hidden when none | `[Implemented]` `src/components/visionboard/LowScorePillars.jsx:9-26` |
| Affirmations card "Focus Areas Today" (`affirmations.md`) | rows dated today (UTC string) | every row with rating ≤ 3 → "Generate for {pillar}" | `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:32-41,152-170` |
| Auto-Generated slideshow (`slideshow.md`) | rows of the most recent evaluation date (from the 50 most recent rows) | pillars with rating ≤ 3 become the only targets; if none, or no evaluation, every pillar | `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:58-83` |
| Weekly Review "Focal Areas (Lowest Averages)" | averages over the review week / 3 months / all time | the three lowest positive averages; no threshold | `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:111-144` |
| User Manual | — | "low-scoring pillars (rated 1–3) are highlighted as focal areas" | `[Described]` `src/pages/UserManual.jsx:303` |
| Walkthrough step 2 | — | "If you score 3 or below, you'll see your pillar activities as optional goals to create." | `[Described]` `src/components/visionboard/OnboardingDialog.jsx:14` |

The glossary defines **focal area** as a pillar rated 3 or below in the most recent evaluation; the surfaces above vary on both the evaluation read and the threshold (D-703).

### Dashboard Focal Areas widget (`src/components/dashboard/DashboardFocalAreas.jsx`)

- Registered as `focal-areas`, title "Focal Areas", default position two of eight (after Weather) `[Implemented]` `src/pages/Dashboard.jsx:22-35`. Reorder mode, badges and the registry itself are owned by `20-features/dashboard`.
- On mount it reads all pillars, the 200 most recent tracking rows, the reminder settings (failures read as none), and today's gratitude rows (failures read as none) `[Implemented]` `src/components/dashboard/DashboardFocalAreas.jsx:27-34`.
- **BR-VB-REM-01 (Three lowest of the latest evaluation).** The most recent date is the first row's date. Pillars with a rating on that date are sorted by rating ascending; ties are resolved by the position of the first matching entry in the hardcoded priority list (case-insensitive substring match on the pillar name; a name matching none ranks last, 999). The first three are shown as "1. {name}", "2. {name}", "3. {name}" with the rating in a badge `[Implemented]` `src/components/dashboard/DashboardFocalAreas.jsx:6-17,36-55,99-105`.
- Priority list, verbatim in order `[Implemented]` `src/components/dashboard/DashboardFocalAreas.jsx:7-11`: `nutrition`, `rest`, `fitness`, `home`, `environment`, `financial`, `finances`, `destress`, `stress`, `self-esteem`, `self esteem`, `relationships`, `play`, `career`, `education`, `mindset`, `spirituality`. The source comment reads "Priority order for focal areas (lowest index = highest priority)".
- **Today's gratitude.** When a `DailyGratitude` row exists for today, a "Grateful for" line shows its entry in quotes and italics under a heart icon `[Implemented]` `src/components/dashboard/DashboardFocalAreas.jsx:72-76,111-119`.
- **Highlight computation (BR-VB-REM-02).** `isCompletedToday` is true when the most recent date is today and at least one row is dated today. The highlight is `!isCompletedToday`; when a reminder row exists with `enabled` true and a `times` array, the highlight is instead `!isCompletedToday && (some time ≤ current HH:mm)`. The value is reported to the dashboard through `onHighlightChange` `[Implemented]` `src/components/dashboard/DashboardFocalAreas.jsx:60-70` (AR-TIME-49).
- **Header button (Dashboard).** A target-icon button in the widget header navigates to `/visionboard?tab=evaluation`. It is blue (`bg-blue-500`, white icon) while the dashboard's own check finds no tracking row dated today, and neutral (card background, border, muted icon) otherwise `[Implemented]` `src/pages/Dashboard.jsx:63,110-115,267-276`. The dashboard stores the widget's reported highlight in state that no render reads `[Implemented]` `src/pages/Dashboard.jsx:56,312` (D-700).

### "✨ Focus Areas for Today" (`src/components/visionboard/LowScorePillars.jsx`)

- Rendered on the Collage tab beneath the slideshow buttons `[Implemented]` `src/pages/VisionBoard.jsx:365`.
- Reads today's tracking rows, keeps those with rating ≤ 3, maps each to the pillar with the same name (rows whose name matches no pillar are dropped), and shows the pillar names as cards under the heading "✨ Focus Areas for Today". When the list is empty nothing renders `[Implemented]` `src/components/visionboard/LowScorePillars.jsx:8-39`.
- Reloads whenever the pillar list changes `[Implemented]` `src/components/visionboard/LowScorePillars.jsx:24`.

### 7a. Feedback & notifications

- Alerts (browser `alert`): "Created {n} goal(s) successfully!" `[Implemented]` `src/components/visionboard/PillarManager.jsx:244`; "{n} activity(ies) added to {pillar name}!" `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:99`; "Sent to your email!" `[Implemented]` `src/pages/VisionBoard.jsx:299`.
- Confirm dialog (browser `confirm`): "Delete this evaluation? This cannot be undone." `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:193`.
- No toasts, no confetti or celebratory effect anywhere in the owned files `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:118-190`, `src/components/visionboard/WeeklyReview.jsx:148-376`.
- **Reminders (`VB-REM`).** The `ReminderSettings` entity (§6) is read by the dashboard widget only `[Implemented]` `src/components/dashboard/DashboardFocalAreas.jsx:32,65-69`. No component, page, function or workflow writes `ReminderSettings`, and no code sends a push notification, email or in-app alert on a reminder time (repository-wide search of `src/` and `base44/functions/` for `ReminderSettings`, `Bell`, `notification`: only the read above and the wipe list) `[Partial]` `base44/entities/ReminderSettings.jsonc:1-34`, `base44/functions/deleteSyncedData/entry.ts:58`. The manual's "Set daily reminders to review your vision board using the bell icon." is `[Described]` `src/pages/UserManual.jsx:376` (D-704). What a reminder does in the prototype, by evidence: when a reminder row is enabled with times, the widget's reported highlight waits until a listed time has passed; nothing else fires `[Implemented]` `src/components/dashboard/DashboardFocalAreas.jsx:65-69`.

## 8. AI & automation

- One touchpoint: the "AI Goals" button on a pillar card opens the activity-idea generator, which asks for exactly five activities for that pillar, optionally steered by a focus sentence and by the pillar's latest rating and notes; the account owner reviews, deselects, and presses "Add N" to append them as pillar activities. User-facing flow in `health-pillars.md` §7; prompt, schema, and conventions in `10-architecture/ai-services.md` §4 (Touchpoint 3), AR-AI-01, AR-AI-03, AR-AI-04.
- The Auto-Generated slideshow's affirmation generation (Touchpoint 5) reads this feature's ratings; it is owned by `slideshow.md`.
- No workflow or backend automation belongs to this feature `[Implemented]` (no reference to pillar, tracking or gratitude entities in `base44/workflows/` or `base44/functions/` other than the wipe list).

## 9. Onboarding content

Dialog file `src/components/visionboard/OnboardingDialog.jsx` (mechanics owned by `affirmations.md` §9 and registered in `20-features/onboarding`). Title "Welcome to Your Vision Board 🌟"; subtitle "Here's how to get the most out of this page — it only takes a minute to set up!" `[Implemented]` `src/components/visionboard/OnboardingDialog.jsx:35-38`. Steps, verbatim `[Described]` `src/components/visionboard/OnboardingDialog.jsx:5-26`:

1. **1. Set Up Your Pillars** — "Start on the Pillars tab. These are the key life areas you want to track — like Nutrition, Fitness, Mindset, and more. You can hide pillars you don't want to track in daily evaluations. Add personal activities to each pillar and check activities to turn them into daily goals."
2. **2. Do Your Daily Evaluation** — "Each day, rate how well you showed up for each pillar on a scale of 1–5. If you score 3 or below, you'll see your pillar activities as optional goals to create. Add notes and pick activities you did."
3. **3. Review Your Week** — "The Weekly Review tab summarizes your pillar scores over the week so you can spot trends and areas to improve."
4. **4. Build Your Vision Collage & Slideshow** — "Upload inspiring images and affirmations to the Collage tab. Create custom slideshows for meditation, or let AI auto-generate one based on your pillar weaknesses. The slideshow includes at least one affirmation from each pillar. Double-click to hide the control bar, navigate with swipes or buttons, customize audio/voice, and affirmations won't repeat until all are cycled."

Buttons: "Got it — Let's Start with Pillars →" and "Don't remind me again" `[Implemented]` `src/components/visionboard/OnboardingDialog.jsx:52-57`. Dismissal key: `visionboard_onboarded` = "1", written by both buttons and by closing the dialog through its overlay (the dialog's close handler calls the same callback) `[Implemented]` `src/components/visionboard/OnboardingDialog.jsx:30-32`, `src/pages/VisionBoard.jsx:433-445`. Persistence generation: first generation, device only (AR-PREF-31, AR-UI-11). Trigger: absence of the key, checked after the pillar list loads `[Implemented]` `src/pages/VisionBoard.jsx:79,88-97`. Re-open: the header Guide button `[Implemented]` `src/pages/VisionBoard.jsx:52`.

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `visionboard_onboarded` | walkthrough dismissed on this device (`"1"`) | absent (dialog shows) | either walkthrough button, overlay close `src/pages/VisionBoard.jsx:437,442` | nothing user-reachable (a `resetOnboarding` helper that removes it exists but is not wired to any control `[Partial]` `src/pages/VisionBoard.jsx:216-219`) |

The Collage, Affirmations and Slideshow parts keep their own keys (`deleted_collage_images`, `slideshowDefaultAudio`, `slideshowAudioFavorites`, `slideshowSelectedVoice`); see their files.

## 11. Seed / hardcoded data used

Full tables in `10-architecture/data-model/seed-data.md` §1.1–1.3.

**Thirteen default pillars** (`order`, name, icon, colour, Maslow tier) `[Implemented]` `src/pages/VisionBoard.jsx:27-47,82-86`:

| order | name | icon | colour | tier (source comment) |
|---|---|---|---|---|
| 0 | Nutrition | Apple | `#10b981` | Tier 1 – Physiological (basic physical survival) |
| 1 | Rest | Moon | `#06b6d4` | Tier 1 – Physiological |
| 2 | Fitness | Zap | `#f59e0b` | Tier 1 – Physiological |
| 3 | Financial | DollarSign | `#84cc16` | Tier 2 – Safety & Security |
| 4 | Home/Environment | Home | `#14b8a6` | Tier 2 – Safety & Security |
| 5 | Relationships | Heart | `#ef4444` | Tier 3 – Love & Belonging |
| 6 | Self-esteem | Star | `#f59e0b` | Tier 4 – Esteem |
| 7 | Career | Briefcase | `#6366f1` | Tier 4 – Esteem |
| 8 | Education | BookOpen | `#3b82f6` | Tier 5 – Self-Actualization |
| 9 | Mindset | Brain | `#8b5cf6` | Tier 5 – Self-Actualization |
| 10 | Destress | Wind | `#ec4899` | Tier 5 – Self-Actualization |
| 11 | Play | Smile | `#f97316` | Tier 5 – Self-Actualization |
| 12 | Spirituality | Sparkles | `#a78bfa` | Tier 5 – Self-Actualization |

The colour carries meaning: it tints the pillar card, colours the pillar's bars and chips in the Weekly Review, and is copied to `Goal.category_color` for goals created from the pillar `[Implemented]` `src/components/visionboard/PillarManager.jsx:319,228`, `src/components/visionboard/WeeklyReview.jsx:204,244,251`, `src/components/visionboard/DailyEvaluation.jsx:169`. The `HealthPillar.name` schema enumerates exactly these thirteen names `[Implemented]` `base44/entities/HealthPillar.jsonc:5-23`.

**Default pillar activities:** five per pillar, 65 in total, keyed by pillar name; listed verbatim in `health-pillars.md` §11 `[Implemented]` `src/components/visionboard/PillarManager.jsx:10-24`.

**Focal-area tie-break priority list:** §7 above `[Implemented]` `src/components/dashboard/DashboardFocalAreas.jsx:7-11`.

**Goal frequency choices offered by both goal flows:** `daily`, `weekly`, `monthly`, `annual` (default `daily`) `[Implemented]` `src/components/visionboard/PillarManager.jsx:217,288-292`, `src/components/visionboard/DailyEvaluation.jsx:232,499`.

**Fallback goal colour:** `#3b82f6` when the source pillar cannot be found `[Implemented]` `src/components/visionboard/PillarManager.jsx:228`, `src/components/visionboard/DailyEvaluation.jsx:169`.

## 12. Print / email formats

- Only the Weekly Review card exports. Both channels take the card's rendered HTML (`id="weekly-review-content"`), which includes the week navigator, the Focal Areas panel with its horizon buttons, the pillar filter chips, the chart as rendered, the average buckets, the Daily Checklist summary and the Daily Breakdown; there is no options dialog and nothing is remembered `[Implemented]` `src/pages/VisionBoard.jsx:268-305`. Titles: print document "Weekly Review"; email subject `Weekly Review - {MMM d, yyyy}` `[Implemented]` `src/pages/VisionBoard.jsx:278,296`. Conventions: `10-architecture/export-print-email.md` (tier A row for this surface).
- The manual's "Print or email your review." `[Described]` `src/pages/UserManual.jsx:370`.

## 13. Acceptance criteria

- **AC-VB-01** Given an account with no pillars, When `/visionboard` opens, Then thirteen `HealthPillar` rows exist with `order` 0–12 in the §11 sequence and the Pillars tab shows them in that order. (refs BR-VB-01)
- **AC-VB-02** Given `/visionboard?tab=evaluation` and `visionboard_onboarded` = "1", When the page opens, Then the Daily Eval tab is active. (refs §0)
- **AC-VB-03** Given `/visionboard?tab=evaluation` and no `visionboard_onboarded` key, When the pillar list has loaded, Then the walkthrough is open and the Pillars tab is active. (refs §0, BR-VB-07)
- **AC-VB-04** Given a pillar is hidden, When the Daily Eval tab opens, Then the wizard's step count is (visible pillars + 1) and the hidden pillar has no step; When the Weekly Review opens and that pillar has past ratings, Then it still appears as a filter chip. (refs BR-VB-02)
- **AC-VB-05** Given the evaluation wizard is active, When the user swipes left across the page, Then the page does not navigate. (refs §4a)
- **AC-VB-06** Given tracking rows exist for three dates, When the evaluation-date calendar opens, Then exactly those three days carry a dot and the footer reads "Days with evaluations". (refs §4)
- **AC-VB-07** Given the review week is the current week, Then the next-week chevron is disabled; Given any earlier week, Then it is enabled. (refs §4)
- **AC-VB-08** Given the Weekly Review card, When "Email review" is pressed, Then an email with subject `Weekly Review - {MMM d, yyyy}` goes to the signed-in user's address and the alert "Sent to your email!" appears. (refs §12)
- **AC-VB-09** Given the most recent evaluation rated Rest 2, Play 2, Career 4 and every other pillar 5, When the dashboard Focal Areas widget loads, Then it lists "1. Rest 2", "2. Play 2", "3. Career 4". (refs BR-VB-REM-01)
- **AC-VB-10** Given no tracking row dated today, When the dashboard renders, Then the Focal Areas header button is blue and pressing it opens `/visionboard?tab=evaluation`. (refs §7)
- **AC-VB-11** Given today's evaluation rated exactly two pillars 3 or below, When the Collage tab opens, Then "✨ Focus Areas for Today" lists those two pillar names; Given none, Then the panel is absent. (refs §7)
- **AC-VB-12** Given a `DailyGratitude` row for today, When the dashboard widget loads, Then "Grateful for" and the entry in quotes are shown beneath the focal list. (refs §7)
- **AC-VB-13** Given the walkthrough is open, When "Don't remind me again" or "Got it — Let's Start with Pillars →" is pressed, Then `visionboard_onboarded` is "1" and the Pillars tab is active. (refs §9)
- **AC-VB-14** Given a `ReminderSettings` row with `enabled` true and `times` ["20:00"] and no evaluation today, When the widget loads at 19:00, Then the reported highlight is false; at 20:00 or later, true. (refs BR-VB-REM-02)

Further criteria are numbered in the Level 2 files (AC-VB-PIL-01 onward, AC-VB-EVAL-01 onward, AC-VB-WK-01 onward).

## 14. Discrepancies & open questions

- **D-700** The dashboard Focal Areas header button colour depends on whether any tracking row is dated today (`src/pages/Dashboard.jsx:63,110-115,272`); the widget computes a highlight that also waits for a configured reminder time and reports it through `onHighlightChange` (`src/components/dashboard/DashboardFocalAreas.jsx:60-70`), and the dashboard stores that value without reading it (`src/pages/Dashboard.jsx:56,312`).
- **D-701** Goals created from the Pillars tab carry `member_name: "Self"` (`src/components/visionboard/PillarManager.jsx:226`); goals queued in the Daily Evaluation carry the signed-in user's `full_name` or "User" (`src/components/visionboard/DailyEvaluation.jsx:157,167`); the page's own unwired helper also uses `full_name` or "User" (`src/pages/VisionBoard.jsx:159-165`).
- **D-702** `GoalTask.frequency` is declared as `once | daily | weekly | biweekly | monthly` (`base44/entities/GoalTask.jsonc:11-20`); both pillar goal flows write the goal timeframe into it, including `annual` (`src/components/visionboard/PillarManager.jsx:234,292`, `src/components/visionboard/DailyEvaluation.jsx:176,499`).
- **D-703** "Focal area" is computed five ways: the three lowest ratings of the most recent evaluation with no threshold (`src/components/dashboard/DashboardFocalAreas.jsx:36-55`); today's ratings ≤ 3 (`src/components/visionboard/LowScorePillars.jsx:15-18`, `src/components/visionboard/AffirmationManager.jsx:34-36`); the most recent evaluation's ratings ≤ 3 (`src/components/dashboard/DashboardSlideshow.jsx:74-77`); the three lowest averages over a horizon (`src/components/visionboard/WeeklyReview.jsx:129-144`); and the manual's "rated 1–3" (`src/pages/UserManual.jsx:303`). The glossary entry follows the slideshow reading.
- **D-704** The manual says reminders are set "using the bell icon" (`src/pages/UserManual.jsx:376`) and the schema describes `times` as "when to send push notifications" (`base44/entities/ReminderSettings.jsonc:16`); no bell icon, no writer of `ReminderSettings`, and no sending code exist in `src/` or `base44/functions/`; the only reader gates the dashboard highlight (`src/components/dashboard/DashboardFocalAreas.jsx:32,65-69`).
- **D-705** Tracking rows are matched to pillars by `pillar_name` on the Collage tab (`src/components/visionboard/LowScorePillars.jsx:17`) and by `pillar_id` on the dashboard widget, the weekly review and the slideshow (`src/components/dashboard/DashboardFocalAreas.jsx:44-47`, `src/components/visionboard/WeeklyReview.jsx:55,79-80`, `src/components/dashboard/DashboardSlideshow.jsx:76-77`); after a pillar rename the two disagree for rows written before the rename.
- **D-706** Walkthrough step 1 says checked activities become "daily goals" (`src/components/visionboard/OnboardingDialog.jsx:9`); the occurrence dialog offers Daily, Weekly, Monthly, Annual and defaults to daily only when none is chosen (`src/components/visionboard/PillarManager.jsx:217,282-293`).
- **D-707** Walkthrough step 2 says pillar activities are shown as optional goals "If you score 3 or below" (`src/components/visionboard/OnboardingDialog.jsx:14`); the Suggested Goals panel exists for every rating and is only auto-opened at ≤ 3 (`src/components/visionboard/DailyEvaluation.jsx:99,415-427`).
- **D-708** The manual says the feature toggle hides the feature's dashboard widget (`src/pages/UserManual.jsx:34`); the Focal Areas widget renders regardless of `enable_vision_board` (`src/pages/Dashboard.jsx:22-42`). Also recorded as AR-PREF-25 / AR-PREF-26.
- **Q-700** Blocks §4 / `health-pillars.md` §6. The page defines `createGoalFromPillar` (title `{pillar} Goal`, description `Created from Vision Board - {pillar} pillar`, timeframe `monthly`, alert `"{pillar}" goal created! View it in Goal Manager.`) and passes it to the pillar manager as `onCreateGoal`, which never calls it (`src/pages/VisionBoard.jsx:157-173,233`, `src/components/visionboard/PillarManager.jsx:26`). Is a per-pillar "create goal" control intended?
- **Q-701** Blocks `health-pillars.md` §1. On the very first visit the in-memory pillar list after seeding is the default array, which has no `id` values until the page is reloaded (`src/pages/VisionBoard.jsx:82-87`); activities, hide, edit and goal creation key on `pillar.id`. What does the account owner observe on the Pillars tab during that first visit?
- **Q-702** Blocks §7a. `ReminderSettings` has no writer. Where is the account owner intended to set `enabled` and `times`, and what is a reminder intended to do beyond the dashboard highlight?
- **Q-703** Blocks `daily-evaluation.md` §4. In edit mode the "Cancel" button appears only on the gratitude step (`src/components/visionboard/DailyEvaluation.jsx:549-555`). Is leaving edit mode from an earlier step intended to require stepping through to the end?
