# Vision Board — Affirmations — Feature Spec

**Feature code:** `VB-AFF` · **Level:** 2 (sub-spec of `20-features/vision-board/spec.md`) · **Status:** draft

**Tag summary:** Implemented 98 · Described 3 · Partial 0

**Sources owned:** `src/components/visionboard/AffirmationManager.jsx`, `src/components/visionboard/OnboardingDialog.jsx` (dialog mechanics; the step text is also carried in `spec.md` §9), `src/pages/VisionBoard.jsx:421-429` (Affirmations card binding), `src/pages/VisionBoard.jsx:52,75-107,216-219,433-445` (walkthrough trigger, Guide button, dismissal handlers)
**Sources referenced (owned elsewhere):** `src/components/SwipeableListItem.jsx` → `10-architecture/shared-interactions.md` · `src/components/visionboard/Slideshow.jsx`, `src/components/dashboard/DashboardSlideshow.jsx`, `src/pages/VisionBoard.jsx:146-155` → `20-features/vision-board/slideshow.md` · `src/components/visionboard/LowScorePillars.jsx` → `20-features/vision-board/spec.md` · `base44/entities/Affirmation.jsonc`, `base44/entities/DailyPillarTracking.jsonc` → `10-architecture/data-model/vision-board.md` · LLM mechanism → `10-architecture/ai-services.md` §5 · `src/pages/UserManual.jsx` → `20-features/user-manual`

**Permissions:** per-user data (`Affirmation` rows are readable and writable only by their creator `[Implemented]` `base44/entities/Affirmation.jsonc:22-35`); admin-only operations: none

## 0. Entry points & navigation

- Route: `/visionboard` → **Collage** tab → the card titled **Affirmations**, rendered below the "Vision Collage" card and the custom-slideshow picker dialog `[Implemented]` `src/pages/VisionBoard.jsx:344-345,421-429`. Sidebar label, header title ("Vision Board"), and swipe-order position are recorded in `spec.md` §0.
- Query parameters accepted: none reach this card. `?tab=evaluation` opens the Daily Eval tab; any other value opens Pillars, so the Affirmations card is reached only by tapping the Collage tab `[Implemented]` `src/pages/VisionBoard.jsx:67,228`.
- Feature-toggle gating: the Vision Board toggle hides the sidebar entry and removes the page from the swipe order; the route itself stays reachable (`spec.md` §0; `10-architecture/preferences.md` AR-PREF-23) `[Implemented]` `src/components/Layout.jsx:128,190`.
- Header right-slot contents: a **Guide** button (help-circle icon, title "Guide") that reopens the walkthrough described in §9 `[Implemented]` `src/pages/VisionBoard.jsx:52,216-219`.

## 1. Purpose & user benefit

The account owner keeps a personal list of affirmations, optionally tagged with a pillar, drafts them with AI when a pillar is weak, and feeds them to the slideshow.

- User Manual, Vision Board section, verbatim: "**Affirmation Manager:** Create custom affirmations or generate them via AI for specific pillars. Star favorites for quick access. Select multiple affirmations to apply to your custom slideshow." `[Described]` `src/pages/UserManual.jsx:371`
- Landing page, feature card "Daily Reflection", verbatim: "Start each day with an inspiring AI-generated quote, personal affirmations, and vision-focused slideshows." `[Described]` `src/pages/LandingPage.jsx:13`
- Vision Board walkthrough, step 4 (verbatim in §9): "Upload inspiring images and affirmations to the Collage tab." `[Described]` `src/components/visionboard/OnboardingDialog.jsx:24`

## 2. Concepts & vocabulary

- **affirmation** — glossary. The UI calls the card "Affirmations" and the list "Your Affirmations".
- **pillar** — glossary. Here a pillar is referenced by *name* from a hardcoded list (§11), not by the account's `HealthPillar` rows.
- **focal area** — glossary. The card displays the UI label "Focus Areas Today" for pillars rated 3 or below today.
- **slideshow** — glossary; the consumer of saved affirmations (`slideshow.md`).
- Feature-local: **compose box** — the "Add New Affirmation" textarea together with its pillar select and the Generate / Add buttons. **selection** — the set of affirmations whose checkbox is ticked; it exists only in memory.

## 3. User stories

- **US-VB-AFF-01** As the account owner, I want to type several affirmations at once, one per line, so that I can build my list quickly. `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:53-79`
- **US-VB-AFF-02** As the account owner, I want AI to draft three affirmations for a pillar I choose, and to review them before saving, so that I get help without losing control of the wording. `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:125-144,137-138,203-210`
- **US-VB-AFF-03** As the account owner, I want one-tap drafting for each pillar I rated low today, so that today's weak areas get affirmations first. `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:32-41,152-170`
- **US-VB-AFF-04** As the account owner, I want to star favourites so that they sit at the top of my list. `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:94-106,234-240`
- **US-VB-AFF-05** As the account owner, I want to delete an affirmation I no longer want. `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:81-92,221`
- **US-VB-AFF-06** As the account owner, I want to tick several affirmations and apply them to the slideshow. `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:108-123,245-253`; `src/pages/VisionBoard.jsx:422-428` (see D-750 for what the slideshow then plays)
- **US-VB-AFF-07** As a first-time visitor, I want a short walkthrough of the Vision Board that I can dismiss for good. `[Implemented]` `src/components/visionboard/OnboardingDialog.jsx:28-61`; `src/pages/VisionBoard.jsx:79-97,433-445`

## 4. Capabilities & interactions

### 4.1 Loading and the list

- On card mount the 50 most recently updated affirmations are loaded (`Affirmation.list("-updated_date", 50)`); while loading the card shows "Loading affirmations..." `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:27-30,43-51,146-148`
- The list heading reads "Your Affirmations (N)" where N is the number loaded `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:214`
- Each row shows: a checkbox, the text (wrapped), the pillar name beneath the text when one is set, and a star button whose title is "Favorite" or "Unfavorite" `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:220-243`
- Rows are ordered favourites first; within each group the most recently updated comes first (the favourite sort is applied on top of the server order) `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:45,104-106`
- The list area scrolls independently of the page `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:219`

### 4.2 "Focus Areas Today" shortcuts

- On mount the card reads every `DailyPillarTracking` row dated today, keeps those with `rating <= 3`, and de-duplicates their pillar names `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:32-41`
- "Today" here is the ISO date of the current instant in UTC (`new Date().toISOString().split("T")[0]`) `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:34` — see §5b and D-754.
- When at least one such pillar exists, a panel headed "Focus Areas Today" appears above the compose box with one outlined button per pillar labelled "Generate for {pillar}" (sparkles icon) `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:152-170`
- Pressing a button runs the AI draft flow (§4.4) for that pillar. All shortcut buttons are disabled while a draft is in progress `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:157-166`
- The panel is absent when no pillar qualifies `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:152`

### 4.3 Adding affirmations (compose box)

- Label "Add New Affirmation"; a multi-line textarea with placeholder "Enter a positive affirmation..." `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:173-180`
- A pillar select with placeholder "Select a pillar (optional)"; its first option is "No specific pillar" followed by the 13 hardcoded pillar names in the order given in §11 `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:182-192`
- Button "Add Affirmation" (reads "Adding..." while saving); disabled when the textarea is blank or a save is in progress `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:203-210`
- On Add: the text is split on newlines; each line has leading list numbering removed (a run of digits followed by `.` or `)` and optional whitespace, e.g. `1.` or `1)`); blank lines are dropped; one `Affirmation` is created per remaining line, in parallel, with `text` = the line and `pillar_name` = the chosen pillar, or no pillar when "No specific pillar" or nothing is chosen `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:61-70`
- After a successful add the textarea and the pillar select are cleared and the list reloads `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:71-73`
- Guard: adding with an all-whitespace textarea shows the alert "Please enter an affirmation" `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:54-57`
- Failure: alert "Failed to add affirmation" `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:74-77`
- The textarea is disabled while adding; the pillar select is disabled while adding or generating `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:178,182`

### 4.4 AI drafts ("Generate")

- A "Generate" button (sparkles icon) sits beside the pillar select; it is enabled only when a pillar other than "No specific pillar" is selected and no draft is running; it reads "Generating..." while running `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:193-201`
- Guard: invoking generation without a pillar shows the alert "Please select a pillar to generate affirmations for" `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:126-130`
- Prompt sent to the language model, verbatim (`{pillar}` is the chosen pillar name) `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:134-136`:

  > Generate 3 brief, positive affirmations written in first person (using "I am", "I can", "I will", etc.) for someone focusing on improving their {pillar}. Each affirmation should be one sentence, max 15 words, personal, motivating, and actionable. Format as a numbered list.

- The model's raw text reply is placed into the textarea and the pillar select is set to that pillar. Nothing is stored until the account owner presses "Add Affirmation", which then applies the per-line split and numbering strip of §4.3 `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:137-138,53-70` (`10-architecture/ai-services.md` AR-AI-01, §5)
- Failure: alert "Failed to generate affirmations" `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:139-142`

### 4.5 Favourites

- The star toggles `is_favorite` on the record and reloads the list, so the row moves to or from the favourites group `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:94-101,234-240`

### 4.6 Delete

- Every row is a `SwipeableListItem`; the delete control is revealed by a long press on touch devices or by hover with a pointer (`10-architecture/shared-interactions.md` AR-UI-01) `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:221`
- Pressing the revealed control opens the shared confirm dialog ("Delete Item?" / "This action cannot be undone." / "Cancel" / "Delete"); confirming there triggers this card's delete handler, which asks a second, browser-native confirmation "Delete this affirmation?" `[Implemented]` `src/components/SwipeableListItem.jsx:47-53,120-135`; `src/components/visionboard/AffirmationManager.jsx:81-83`
- After both confirmations the record is deleted, its id is removed from the selection, and the list reloads `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:84-91`
- Affirmation text is not editable after creation; the only update path is the favourite flag `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:81-101`

### 4.7 Select and "Apply N to Slideshow"

- The checkbox on each row toggles that affirmation in the selection `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:108-114,223-227`
- When the selection is non-empty a full-width button "Apply {N} to Slideshow" (play icon) appears beneath the list `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:245-253`
- Guard: applying with an empty selection shows the alert "Please select at least one affirmation" `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:116-120`
- Applying hands the selected texts, in list order, to the page `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:121-122`
- The page stores those texts as the slideshow's affirmation list and scrolls smoothly to the first element whose id contains "collage". The tab primitive assigns such ids to the Collage tab trigger and its content panel, the trigger coming first in document order `[Implemented]` `src/pages/VisionBoard.jsx:422-428`; `src/components/ui/tabs.jsx:2-19`
- What the slideshow then plays: launching "▶ Custom" from the Collage tab replaces the stored list with every saved affirmation before the player opens `[Implemented]` `src/pages/VisionBoard.jsx:146-155`; the Dashboard's "Custom Slideshow" likewise reads every saved affirmation `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:49-52`. Both recorded; see D-750. The slideshow itself is specified in `slideshow.md`.

### 4a. Keyboard & pointer

- The compose field is a textarea: Enter inserts a new line, which becomes a separate affirmation on Add `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:174-180,61-63`
- Long-press (touch) / hover (pointer) reveals delete on a row (`shared-interactions.md` AR-UI-01) `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:221`
- No double-click or double-tap action exists on rows; there is no edit dialog `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:220-243`
- No drag-and-drop; the list order is derived (§4.1) `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:104-106`

### 4b. View state & persistence

| Control | Values | Default | Scope |
|---|---|---|---|
| Compose text | free text, multi-line | empty | memory (cleared after Add; replaced by AI draft) `src/components/visionboard/AffirmationManager.jsx:21,71,137` |
| Pillar select | `none`, or one of the 13 names in §11 | unset (placeholder shown) | memory (cleared after Add; set by AI draft) `:22,72,138` |
| Selection (checked rows) | set of affirmation ids | empty | memory `:19,108-114` |
| Favourite | true / false | false | account `Affirmation.is_favorite` `:96` |
| Focus-area shortcuts | list of pillar names | computed on mount | memory `:25,32-41` |
| Walkthrough dismissed | present / absent | absent (shown) | device `visionboard_onboarded` (§10) |

### 4c. Empty & fallback states

- List empty: "No affirmations yet. Add one to get started!" `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:215-216`
- Loading: "Loading affirmations..." `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:147`
- No focal areas today: the "Focus Areas Today" panel is not rendered `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:152`
- No saved affirmations at slideshow launch: the slideshow plays the single fallback affirmation "You are capable of achieving your vision." `[Implemented]` `src/pages/VisionBoard.jsx:149`; `src/components/visionboard/Slideshow.jsx:299`

## 5. Business rules

- **BR-VB-AFF-01** One affirmation record is created per non-blank line of the compose box, after stripping leading numbering of the form `N.` or `N)`. `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:61-70`
- **BR-VB-AFF-02** A pillar tag is optional and is stored as a name chosen from the hardcoded 13-name list; the account's own pillar rows (including renamed or hidden pillars) are not consulted. `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:11-15,68,182-192`
- **BR-VB-AFF-03** AI drafts are never stored on their own; they land in the compose box and are saved only by "Add Affirmation". `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:137-138,203-210` (`ai-services.md` AR-AI-01)
- **BR-VB-AFF-04** Favourites always list before non-favourites. `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:104-106`
- **BR-VB-AFF-05** A pillar is a "focus area today" when a tracking row dated today rates it 3 or below. `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:34-36` (threshold shared with `seed-data.md` §1.4)
- **BR-VB-AFF-06** The card lists at most the 50 most recently updated affirmations. `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:45`
- **BR-VB-AFF-07** Deleting an affirmation requires two confirmations: the shared "Delete Item?" dialog and then the browser confirm "Delete this affirmation?". `[Implemented]` `src/components/SwipeableListItem.jsx:47-53,120-135`; `src/components/visionboard/AffirmationManager.jsx:82`
- **BR-VB-AFF-08** The Custom slideshow plays every saved affirmation; the applied selection is stored by the page and then overwritten at launch. Both paths recorded (D-750). `[Implemented]` `src/pages/VisionBoard.jsx:422-428,146-155`
- **BR-VB-AFF-09** With no saved affirmations, the slideshow's affirmation is "You are capable of achieving your vision.". `[Implemented]` `src/pages/VisionBoard.jsx:149`; `src/components/visionboard/Slideshow.jsx:299`
- **BR-VB-AFF-10** The Vision Board walkthrough shows whenever the device flag `visionboard_onboarded` is absent, on every load of the page, and both of its buttons set the flag. `[Implemented]` `src/pages/VisionBoard.jsx:79,88-91,94-97,433-445`

### 5a. State & lifecycle

| Entity / flag | State | Trigger | Next state | Side effects |
|---|---|---|---|---|
| `Affirmation` | (none) | "Add Affirmation" with N non-blank lines | N rows exist, `is_favorite` unset | compose box cleared; list reload `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:61-73` |
| `Affirmation.is_favorite` | false / true | star pressed | toggled | list reload and re-sort `[Implemented]` `:94-101` |
| `Affirmation` | exists | delete confirmed twice | deleted | removed from selection; list reload `[Implemented]` `:81-91` |
| selection | any | checkbox | id added / removed | "Apply N" button appears when N ≥ 1 `[Implemented]` `:108-114,245` |
| selection | any | Apply | unchanged | page stores texts and scrolls (§4.7) `[Implemented]` `src/pages/VisionBoard.jsx:422-428` |
| `visionboard_onboarded` | absent | page load (pillars loaded or seeded) | absent, dialog open, Pillars tab active | `[Implemented]` `src/pages/VisionBoard.jsx:79-97` |
| `visionboard_onboarded` | absent (dialog open) | either button, overlay dismiss, or Escape | `"1"`, dialog closed, Pillars tab active | `[Implemented]` `src/components/visionboard/OnboardingDialog.jsx:30-32,52-57`; `src/pages/VisionBoard.jsx:433-445` |
| `visionboard_onboarded` | `"1"` | Guide button | absent, dialog open | `[Implemented]` `src/pages/VisionBoard.jsx:52,216-219` |

### 5b. Time & date semantics

- "Today" for the focus-area shortcuts is formatter C of AR-TIME-01 (UTC calendar date) `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:34`. The "Focus Areas for Today" panel on the same tab uses formatter B (device-local date) `[Implemented]` `src/components/visionboard/LowScorePillars.jsx:10`. Both recorded; D-754 (instance of `time-and-date-semantics.md` D-100).
- The auto-generated slideshow targets the *most recent evaluation date* rather than today (`ai-services.md` D-300; `slideshow.md` §5b).
- Sorting by `updated_date` uses the platform's record timestamp (AR-TIME-12) `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:45`.

## 6. Data

Entity sheets: `10-architecture/data-model/vision-board.md` (E-Affirmation, E-DailyPillarTracking).

- **Owned:** `Affirmation` — `text` (required), `pillar_name` (optional, name from §11), `is_favorite` (default false) `[Implemented]` `base44/entities/Affirmation.jsonc:4-21`. Ops here: create `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:66-69`; update `is_favorite` `:96`; delete `:84`; list `-updated_date` limit 50 `:45`.
- **Referenced (read-only):** `DailyPillarTracking` — `filter({ date: today })`, fields `rating`, `pillar_name` `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:35-36`.
- Other readers of `Affirmation` (documented in `slideshow.md` §6): `Affirmation.list()` unsorted and unlimited at Custom launch `[Implemented]` `src/pages/VisionBoard.jsx:148`; `src/components/dashboard/DashboardSlideshow.jsx:51`.

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| in | Daily evaluation (`daily-evaluation.md`) | Today's `DailyPillarTracking` rows rated ≤ 3 populate the "Focus Areas Today" shortcuts | `src/components/visionboard/AffirmationManager.jsx:32-41` |
| in | AI services | Free-text `InvokeLLM` draft of 3 affirmations for a pillar | `src/components/visionboard/AffirmationManager.jsx:134-136`; `10-architecture/ai-services.md` §5 |
| out | Slideshow (`slideshow.md`) | Custom mode reads all saved affirmations; "Apply N" stores a selection on the page (D-750) | `src/pages/VisionBoard.jsx:148,422-428`; `src/components/dashboard/DashboardSlideshow.jsx:51` |
| out | Slideshow (`slideshow.md`) | Applying scrolls the page to the Collage tab trigger | `src/pages/VisionBoard.jsx:426` |
| in | Shared interactions | `SwipeableListItem` long-press / hover delete with the shared confirm dialog | `src/components/visionboard/AffirmationManager.jsx:221` |
| in | App shell header | Guide button in the header right slot reopens the walkthrough | `src/pages/VisionBoard.jsx:52,216-219` |
| in | Onboarding registry (`20-features/onboarding`) | `visionboard_onboarded`, first-generation persistence | `src/pages/VisionBoard.jsx:79,437,442` |
| out | Data wipe | `Affirmation` rows are removed by the full wipe (`10-architecture/admin-operations.md` §2.7) | `base44/functions/deleteSyncedData/entry.ts:57` |

Deep links: none originate here.

### 7a. Feedback & notifications

- Browser alerts: "Please enter an affirmation"; "Failed to add affirmation"; "Please select a pillar to generate affirmations for"; "Failed to generate affirmations"; "Please select at least one affirmation" `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:55,76,128,141,118`
- Confirms: shared dialog "Delete Item?" then browser confirm "Delete this affirmation?" `[Implemented]` `src/components/SwipeableListItem.jsx:120-135`; `src/components/visionboard/AffirmationManager.jsx:82`
- Success feedback for add, favourite, and delete is the list refreshing; no toast `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:73,88,98`
- Alert after "Save current images as defaults" belongs to `collage.md`.

## 8. AI & automation

One touchpoint: **Affirmation drafts** (`10-architecture/ai-services.md` §5, "Touchpoint 4"). User-facing behaviour: choose a pillar (or press a "Generate for {pillar}" shortcut), press Generate, wait ("Generating..."), then edit the numbered draft in the compose box and press "Add Affirmation" to store one record per line. On failure an alert appears and nothing changes `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:125-144`. No automations run against affirmations `[Implemented]` (no `Affirmation` reference in `base44/workflows/`).

## 9. Onboarding content

The Vision Board walkthrough dialog (`src/components/visionboard/OnboardingDialog.jsx`). The step text also appears in `spec.md` §9; the registry entry is in `20-features/onboarding`.

**Trigger.** After the page loads (and seeds) the pillar list, the dialog opens when the device key `visionboard_onboarded` is absent, and the Pillars tab is made active `[Implemented]` `src/pages/VisionBoard.jsx:79,88-91,94-97`. The header **Guide** button opens the dialog without touching the key `[Implemented]` `src/pages/VisionBoard.jsx:52`; a helper that removes the key and then opens the dialog exists but is bound to no control `[Partial]` `src/pages/VisionBoard.jsx:216-219`.

**Title:** "Welcome to Your Vision Board 🌟" · **Subtitle:** "Here's how to get the most out of this page — it only takes a minute to set up!" `[Implemented]` `src/components/visionboard/OnboardingDialog.jsx:35-38`

**Steps (verbatim)** `[Implemented]` `src/components/visionboard/OnboardingDialog.jsx:5-26`:

1. **1. Set Up Your Pillars** — "Start on the Pillars tab. These are the key life areas you want to track — like Nutrition, Fitness, Mindset, and more. You can hide pillars you don't want to track in daily evaluations. Add personal activities to each pillar and check activities to turn them into daily goals."
2. **2. Do Your Daily Evaluation** — "Each day, rate how well you showed up for each pillar on a scale of 1–5. If you score 3 or below, you'll see your pillar activities as optional goals to create. Add notes and pick activities you did."
3. **3. Review Your Week** — "The Weekly Review tab summarizes your pillar scores over the week so you can spot trends and areas to improve."
4. **4. Build Your Vision Collage & Slideshow** — "Upload inspiring images and affirmations to the Collage tab. Create custom slideshows for meditation, or let AI auto-generate one based on your pillar weaknesses. The slideshow includes at least one affirmation from each pillar. Double-click to hide the control bar, navigate with swipes or buttons, customize audio/voice, and affirmations won't repeat until all are cycled."

**Buttons and what each persists** `[Implemented]` `src/components/visionboard/OnboardingDialog.jsx:51-58`; `src/pages/VisionBoard.jsx:433-445`:

| Button | Handler | Effect |
|---|---|---|
| "Got it — Let's Start with Pillars →" (primary, full width) | `onClose` | closes; writes `visionboard_onboarded = "1"`; activates the Pillars tab |
| "Don't remind me again" (ghost, small text) | `onDontRemind` | closes; writes `visionboard_onboarded = "1"`; activates the Pillars tab |
| Overlay click / Escape (dialog dismiss) | `onOpenChange(false)` → `onClose` | same as the primary button `[Implemented]` `src/components/visionboard/OnboardingDialog.jsx:30-32` |

Both buttons write the same device flag; the dialog exposes two handlers but the page binds identical behaviour to each (`10-architecture/preferences.md` AR-PREF-35). Persistence generation: **first generation, device only** (AR-PREF-31); nothing is written to `ThemeSettings.onboarding_status`.

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `visionboard_onboarded` | Vision Board walkthrough dismissed | absent → dialog shows | `"1"` by either dialog button or dialog dismiss `src/pages/VisionBoard.jsx:437,442` | Guide button `src/pages/VisionBoard.jsx:217` |

No other device-local state belongs to this card `[Implemented]` `src/components/visionboard/AffirmationManager.jsx` (no `localStorage` reference).

## 11. Seed / hardcoded data used

- **Pillar tag list** (`PILLARS`), verbatim and in display order: `Nutrition, Fitness, Mindset, Rest, Destress, Play, Education, Career, Home/Environment, Relationships, Self-esteem, Financial, Spirituality` `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:11-15` (registered in `10-architecture/data-model/seed-data.md` §1.3). The names match the 13 seeded pillars; the order differs from the seeded (Maslow) order in `spec.md` §11 / `src/pages/VisionBoard.jsx:28-47`.
- Sentinel select value `none` = "No specific pillar" `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:187`
- Numbering pattern stripped on add: `^\s*\d+[.)]\s*` `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:62`
- Low-rating threshold 3 (`seed-data.md` §1.4) `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:36`
- Read cap 50 `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:45`
- Fallback affirmation "You are capable of achieving your vision." (`seed-data.md` §1.3) `[Implemented]` `src/pages/VisionBoard.jsx:149`

## 12. Print / email formats

None observed. The Affirmations card is a `WidgetCard` without print or email handlers `[Implemented]` `src/pages/VisionBoard.jsx:421`.

## 13. Acceptance criteria

- **AC-VB-AFF-01** Given the compose box holds "1. I rest well\n2) I eat well\n\n" When Add Affirmation is pressed Then two records "I rest well" and "I eat well" exist and the box is empty. (refs BR-VB-AFF-01)
- **AC-VB-AFF-02** Given "Fitness" is selected When Generate is pressed Then the model reply appears in the textarea, the select still shows Fitness, and no record exists until Add is pressed. (refs BR-VB-AFF-03)
- **AC-VB-AFF-03** Given no pillar is selected Then the Generate button is disabled. (refs §4.4)
- **AC-VB-AFF-04** Given a tracking row dated today (UTC) rates "Rest" 2 When the card mounts Then a "Generate for Rest" button appears under "Focus Areas Today". (refs BR-VB-AFF-05)
- **AC-VB-AFF-05** Given three affirmations of which the oldest is starred When the list renders Then the starred one is first. (refs BR-VB-AFF-04)
- **AC-VB-AFF-06** Given a row's delete control is pressed When the shared dialog's Delete and then the browser confirm are both accepted Then the record is gone; cancelling either leaves it. (refs BR-VB-AFF-07)
- **AC-VB-AFF-07** Given two rows are ticked Then a button "Apply 2 to Slideshow" is visible; pressing it scrolls to the Collage tab trigger. (refs §4.7)
- **AC-VB-AFF-08** Given no affirmations exist When a Custom slideshow is launched Then the affirmation shown is "You are capable of achieving your vision.". (refs BR-VB-AFF-09)
- **AC-VB-AFF-09** Given `visionboard_onboarded` is absent When the Vision Board loads Then the walkthrough opens on the Pillars tab; pressing either button closes it and sets the key to "1". (refs BR-VB-AFF-10)
- **AC-VB-AFF-10** Given the key is "1" When Guide is pressed Then the key is removed and the walkthrough opens. (refs §9)

## 14. Discrepancies & open questions

- **D-750** "Apply N to Slideshow" stores the ticked affirmation texts as the page's slideshow list (`src/pages/VisionBoard.jsx:422-428`), and the User Manual says "Select multiple affirmations to apply to your custom slideshow." (`src/pages/UserManual.jsx:371`); launching "▶ Custom" replaces that list with every saved affirmation before the player opens (`src/pages/VisionBoard.jsx:146-155`), and the Dashboard's Custom Slideshow also plays every saved affirmation (`src/components/dashboard/DashboardSlideshow.jsx:49-52`).
- **D-754** "Today" for the "Focus Areas Today" shortcuts is the UTC date (`src/components/visionboard/AffirmationManager.jsx:34`, AR-TIME-01 formatter C) while the "Focus Areas for Today" panel on the same tab uses the device-local date (`src/components/visionboard/LowScorePillars.jsx:10`, formatter B). Instance of D-100.
