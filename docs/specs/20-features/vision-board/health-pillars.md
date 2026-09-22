# Vision Board — Health Pillars

**Feature code:** `VB-PIL` · **Level:** 2 · **Parent:** `spec.md` · **Status:** draft

**Tag summary:** Implemented 48 · Described 4 · Partial 1

**Sources:** `src/components/visionboard/PillarManager.jsx`, `src/components/visionboard/PillarGoalGenerator.jsx`, the Pillars tab wiring and seeding in `src/pages/VisionBoard.jsx`.
**Referenced:** `base44/entities/HealthPillar.jsonc`, `PillarActivity.jsonc` → `10-architecture/data-model/vision-board.md`; `Goal.jsonc`, `GoalTask.jsonc` → `20-features/goals` and `10-architecture/data-model/goals.md`; the LLM call → `10-architecture/ai-services.md` §4 (Touchpoint 3); double-tap and collapse-all conventions → `10-architecture/shared-interactions.md` (AR-UI-04, AR-UI-05, AR-UI-09).

The glossary terms are **pillar** and **pillar activity**; the card is titled "Your Health Pillars" and the hide toggle tooltips say "assessments". The tab receives the account's pillars sorted by `order` (§`spec.md` "Pillar seeding"). `[Implemented]` `src/pages/VisionBoard.jsx:93,231-235`

## 1. Pillar cards

- One card per pillar, in `order`, laid out in a responsive grid (one, two or three columns by viewport) `[Implemented]` `src/components/visionboard/PillarManager.jsx:314-316`.
- Each card is bordered in the pillar's colour and tinted with the same colour at low opacity; the colour carries the pillar's identity across the feature (`spec.md` §11) `[Implemented]` `src/components/visionboard/PillarManager.jsx:317-320`.
- Card header: the pillar name; when hidden, the name is struck through in muted text and a small "hidden" badge follows it. On the right: the eye toggle (§3) and a chevron that expands or collapses the card (§2) `[Implemented]` `src/components/visionboard/PillarManager.jsx:322-346`.
- The description, when present, is shown under the header in muted text `[Implemented]` `src/components/visionboard/PillarManager.jsx:348-350`.
- No card can be deleted or reordered; no control adds a pillar `[Implemented]` `src/components/visionboard/PillarManager.jsx:249-501`.

## 2. Expand / collapse

- Each card's chevron toggles that card between collapsed (header and description only) and expanded (activities and action buttons) `[Implemented]` `src/components/visionboard/PillarManager.jsx:181-186,335-344`.
- A toolbar button above the grid toggles all cards. Its tooltip reads "Collapse all" while the global state is expanded and "Expand all" once "Collapse all" has been pressed. "Collapse all" clears every card's expanded flag; "Expand all" sets every card's flag `[Implemented]` `src/components/visionboard/PillarManager.jsx:36,188-200,252-258`. The initial state is all collapsed with the button showing "Collapse all" `[Implemented]` `src/components/visionboard/PillarManager.jsx:35-36` (variant recorded under AR-UI-09 in `10-architecture/shared-interactions.md`).
- Expanded state is in memory only; it resets on page load `[Implemented]` `src/components/visionboard/PillarManager.jsx:35`.

## 3. Hide toggle

- **BR-VB-PIL-01** The eye button writes `is_hidden` to the opposite of its current value and updates the card at once. Tooltip: "Hide from assessments" when visible, "Show in assessments" when hidden; icon Eye versus EyeOff `[Implemented]` `src/components/visionboard/PillarManager.jsx:157-160,328-334`.
- **BR-VB-PIL-02** A hidden pillar is left out of the daily evaluation wizard and of the evaluation summary grid; its existing `DailyPillarTracking` rows are untouched and continue to feed the Weekly Review, the dashboard widget, the "✨ Focus Areas for Today" panel and the slideshow, none of which filter on `is_hidden` `[Implemented]` `src/pages/VisionBoard.jsx:263`, `src/components/visionboard/WeeklyReview.jsx:127`, `src/components/dashboard/DashboardFocalAreas.jsx:46-48`, `src/components/visionboard/LowScorePillars.jsx:15-18`. Schema description: "If true, this pillar is excluded from daily assessments" `[Implemented]` `base44/entities/HealthPillar.jsonc:41-45`.
- A hidden pillar's card stays on the Pillars tab, fully editable, and its activities can still be checked for goal creation `[Implemented]` `src/components/visionboard/PillarManager.jsx:315-428`.
- The walkthrough describes the intent: "You can hide pillars you don't want to track in daily evaluations." `[Described]` `src/components/visionboard/OnboardingDialog.jsx:9`. The manual: "Each pillar can have a description, activities, and a visibility toggle." `[Described]` `src/pages/UserManual.jsx:368`.

## 4. Edit dialog (name, description, colour)

- Opened by a pointer double-click on the card, or by two clicks within 300 ms on touch (`spec.md` §4a). The eye button stops propagation so a double-tap on it does not open the dialog `[Implemented]` `src/components/visionboard/PillarManager.jsx:137-155,320,329`.
- Dialog title "Edit Pillar". Fields `[Implemented]` `src/components/visionboard/PillarManager.jsx:430-480`:

| Field | Control | Prefilled | Validation |
|---|---|---|---|
| Name | text input | current name | none; free text (the schema enumerates thirteen names, D-015 in `10-architecture/data-model/vision-board.md`) |
| Description | text input, placeholder "Optional description" | current description or empty | none |
| Color | native colour picker beside a text input with placeholder `#000000`; both edit the same value | current colour | none |

- "Cancel" closes without writing. "Save" updates `name`, `color`, `description` on the pillar and the card, then closes `[Implemented]` `src/components/visionboard/PillarManager.jsx:162-179,470-477`.
- **BR-VB-PIL-03** A rename does not rewrite the `pillar_name` cached on the pillar's activities or tracking rows, nor `Goal.category` on goals already created; new rows written afterwards carry the new name `[Implemented]` `src/components/visionboard/PillarManager.jsx:165-169` (denormalised caches noted in the data-model sheet). Default-activity seeding (§5) and the Collage tab's name match (`spec.md` BR-VB-08) use the current name.

## 5. Activities list and seeding

- **BR-VB-PIL-04 (Auto-seeding).** Whenever the pillar list is available, every `PillarActivity` row is read and grouped by `pillar_id`. For each pillar that has no activities, the default list for its name (§11) is created in one bulk write with `order` = index and `pillar_name` = the pillar's name; a pillar whose name has no default list is left empty `[Implemented]` `src/components/visionboard/PillarManager.jsx:45-74`. The same seeding runs on demand when "Edit Activities" is pressed on a pillar that has no activities in memory `[Implemented]` `src/components/visionboard/PillarManager.jsx:76-91,93-101`.
- Activities are shown in the order returned by the unsorted read; `order` is written but not sorted on `[Implemented]` `src/components/visionboard/PillarManager.jsx:48-53,354`.
- **View mode** (expanded, not editing): one checkbox row per activity, label = activity text; ticking marks the activity for goal creation (§6) `[Implemented]` `src/components/visionboard/PillarManager.jsx:352-366`.
- **Edit Activities mode:** the button "Edit Activities" switches the list to bullet rows with an X delete button each, plus an input with placeholder "Add activity..." and an "Add" button; the button relabels "Done" and returns to view mode `[Implemented]` `src/components/visionboard/PillarManager.jsx:93-108,368-404,408-415`.
- **Add:** Enter in the input or "Add" creates a `PillarActivity` with `pillar_id`, `pillar_name`, `activity` = trimmed text, `order` = current count for that pillar, appends it, and clears the input; blank text is ignored `[Implemented]` `src/components/visionboard/PillarManager.jsx:110-127,383-401`.
- **Delete:** the X removes the row immediately with no confirmation `[Implemented]` `src/components/visionboard/PillarManager.jsx:129-135,374-379`. An activity id referenced by a past evaluation's `selected_activities` or by a queued goal is not checked before deletion `[Implemented]` `src/components/visionboard/PillarManager.jsx:129-135`.
- Below the list, when expanded: "Edit Activities" / "Done" (ghost, full width) and "AI Goals" (outline, sparkles icon, tooltip "Generate AI goal ideas for this pillar") `[Implemented]` `src/components/visionboard/PillarManager.jsx:406-427`.
- Empty state: an expanded pillar with no activities shows no rows and no message; in Edit Activities mode only the add input appears (seeding fills the list when a default set exists) `[Implemented]` `src/components/visionboard/PillarManager.jsx:352-404`.

## 6. Create goals from checked activities

- Checkboxes are independent across pillars; a "Create {n} Goal(s)" button appears at the right of the toolbar as soon as any activity is checked, where n is the number checked `[Implemented]` `src/components/visionboard/PillarManager.jsx:202-207,247,259-268`.
- Pressing it opens the **"Set Occurrences"** dialog `[Implemented]` `src/components/visionboard/PillarManager.jsx:271-312`:
  - Text: "How many times must each goal be completed? This applies to all {n} selected goal(s)."
  - "Frequency" — native select with a disabled placeholder "Select frequency..." and options Daily, Weekly, Monthly, Annual (values `daily`, `weekly`, `monthly`, `annual`); initially none chosen.
  - "Number of occurrences" — number input, min 1, placeholder "e.g. 3"; initially empty.
  - Buttons "Cancel" and "Create Goals".
- **BR-VB-PIL-05 (Defaults).** With no frequency chosen, `daily` is used; the occurrence count is the entered integer or 1, never below 1 `[Implemented]` `src/components/visionboard/PillarManager.jsx:216-217`.
- **BR-VB-PIL-06 (Records written).** For each checked activity, in the order the activity list returns them, one `Goal` is created and then its milestone tasks in one bulk write `[Implemented]` `src/components/visionboard/PillarManager.jsx:209-238`:

| Entity | Field | Value |
|---|---|---|
| `Goal` | `title` | the activity text |
| | `description` | `From {activity.pillar_name}` |
| | `timeframe` | the chosen frequency |
| | `occurrences` | the resolved occurrence count |
| | `status` | `not_started` |
| | `member_name` | `Self` (D-701) |
| | `category` | `activity.pillar_name` |
| | `category_color` | the source pillar's colour, else `#3b82f6` |
| `GoalTask` × occurrences | `goal_id` | the new goal's id |
| | `title` | `{activity} ({i}/{n})` for i = 1..n when n > 1; the bare activity text when n = 1 |
| | `frequency` | the chosen frequency (D-702 for `annual`) |
| | `completed` | `false` |

- Afterwards every checkbox is cleared, the dialog closes, the frequency and count reset, and the alert "Created {n} goal(s) successfully!" is shown. The page does not navigate `[Implemented]` `src/components/visionboard/PillarManager.jsx:240-244`.
- The walkthrough: "Add personal activities to each pillar and check activities to turn them into daily goals." `[Described]` `src/components/visionboard/OnboardingDialog.jsx:9` (D-706).
- The parent page also defines a one-click `createGoalFromPillar(pillarName)` that writes a `Goal` titled `{pillar} Goal` with description `Created from Vision Board - {pillar} pillar`, timeframe `monthly`, status `not_started`, `member_name` = the user's full name or "User", and alerts `"{pillar}" goal created! View it in Goal Manager.`; it is handed to this component as `onCreateGoal` and no control invokes it `[Partial]` `src/pages/VisionBoard.jsx:157-173,233`, `src/components/visionboard/PillarManager.jsx:26` (Q-700).

## 7. AI activity ideas ("AI Goals")

Mechanism, verbatim prompt and response schema: `10-architecture/ai-services.md` §4 (Touchpoint 3). User-facing flow:

- "AI Goals" on an expanded card opens a dialog titled "AI Activity Ideas — {pillar name}" `[Implemented]` `src/components/visionboard/PillarManager.jsx:416-425,487-498`, `src/components/visionboard/PillarGoalGenerator.jsx:113-120`.
- One optional input labelled "Any specific focus? (optional)" with placeholder `e.g. "I want to sleep better"` `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:123-131`.
- "Generate Ideas" (relabelled "Regenerate" once results exist; "Generating..." with a spinner while running) `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:133-139`.
- **BR-VB-PIL-07 (Inputs to the request).** The prompt is built from the pillar name, the pillar description when present, the pillar's most recent `DailyPillarTracking` row when one exists (its date, `Rating {n}/5`, and `Notes: "{notes}"` when notes exist, followed by "Tailor your suggestions to address the user's current state and rating."), and the focus text when entered as "Additional user context" `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:22-33`. The prompt's stated intent, verbatim: "You are a life coach. Suggest 5 specific, actionable activities for the "{pillar.name}" life pillar." and "Return exactly 5 activities." each "Concrete and achievable", "Specific to the "{pillar.name}" area of life", "Written as a short, actionable activity (e.g. "Run for 30 minutes", "Practice gratitude journaling", "Call a friend")" `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:30-46`.
- **BR-VB-PIL-08 (Review before write).** Results appear as a list of selectable rows, all pre-selected; tapping a row toggles it. "Cancel" discards; "Add {n}" (disabled at zero or while saving) writes the selected titles `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:62-63,71-77,141-176` (AR-AI-01).
- **BR-VB-PIL-09 (What is written).** One `PillarActivity` per selected suggestion in one bulk write: `pillar_id`, `pillar_name`, `activity` = the suggestion title, `order` = the pillar's current activity count plus index. The new rows are appended to the card's list, the dialog closes, and the alert "{n} activity(ies) added to {pillar name}!" is shown. No `Goal` is created by this flow; the new activities can then be checked (§6) or used in an evaluation `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:79-100`, `src/components/visionboard/PillarManager.jsx:492-497`.
- Closing the dialog by any means clears the suggestions, selection and focus text `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:102-110`.
- A failed request logs to the console and leaves the dialog open with no message `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:65-67` (AR-AI-04).
- The manual does not describe this generator; its Affirmation Manager line covers AI affirmations only `[Described]` `src/pages/UserManual.jsx:371`.

## 8. Feedback

- Alerts: "Created {n} goal(s) successfully!" `[Implemented]` `src/components/visionboard/PillarManager.jsx:244`; "{n} activity(ies) added to {pillar name}!" `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:99`. No confirm dialogs, toasts or celebrations on this tab `[Implemented]` `src/components/visionboard/PillarManager.jsx:110-135`.

## 9. Data written by this tab

| Entity | Operation | Where |
|---|---|---|
| `HealthPillar` | update `is_hidden`; update `name`, `color`, `description` | `src/components/visionboard/PillarManager.jsx:158,165-169` |
| `PillarActivity` | bulkCreate (seed; AI picks); create; delete | `src/components/visionboard/PillarManager.jsx:60,79,113,130`, `src/components/visionboard/PillarGoalGenerator.jsx:87` |
| `Goal` | create | `src/components/visionboard/PillarManager.jsx:220` |
| `GoalTask` | bulkCreate | `src/components/visionboard/PillarManager.jsx:230` |
| `DailyPillarTracking` | read (latest row per pillar for the generator) | `src/components/visionboard/PillarGoalGenerator.jsx:23` |

## 10. View state

All in memory, reset on page load: expanded set, global collapse flag, editing-activities set, per-pillar add-input text, checked activity ids, occurrence dialog fields, the pillar open in the generator `[Implemented]` `src/components/visionboard/PillarManager.jsx:27-41`. No device-local keys.

## 11. Default pillar activities (verbatim, `order` 0 → 4)

`[Implemented]` `src/components/visionboard/PillarManager.jsx:10-24`

| Pillar | Activities |
|---|---|
| Nutrition | "Eat balanced meals", "Drink 8+ glasses of water", "Meal prep for week", "Limit processed foods", "Include vegetables in meals" |
| Fitness | "30 min cardio", "Strength training", "Stretching routine", "Walk outdoors", "Try a new exercise" |
| Mindset | "Practice gratitude", "Positive affirmations", "Visualize goals", "Journal reflections", "Read motivational content" |
| Rest | "Get 7-8 hours sleep", "Take power nap", "Relax before bed", "Avoid screens at night", "Morning meditation" |
| Destress | "Deep breathing exercise", "Take a walk", "Listen to music", "Yoga session", "Talk to someone" |
| Play | "Laugh and have fun", "Engage in hobby", "Play a game", "Spend time outdoors", "Try something new" |
| Education | "Learn something new", "Read article/book", "Watch tutorial", "Practice skill", "Take a course" |
| Career | "Complete work task", "Learn new skill", "Network with colleague", "Plan career goals", "Review progress" |
| Home/Environment | "Tidy one room", "Clean workspace", "Organize clutter", "Do laundry", "Cook a meal" |
| Relationships | "Call a friend", "Spend quality time", "Show appreciation", "Listen actively", "Plan time together" |
| Self-esteem | "Celebrate accomplishment", "Practice self-care", "Set personal boundary", "Accept compliment", "Challenge negative thought" |
| Financial | "Track spending", "Save money", "Review budget", "Pay a bill", "Research investment" |
| Spirituality | "Practice faith", "Meditate", "Connect with nature", "Help someone", "Reflect on values" |

The map is keyed by pillar name; the thirteen keys match the seeded pillar names in `spec.md` §11 (listed here in the source's own order, which differs from the Maslow order of the pillar seed) `[Implemented]` `src/components/visionboard/PillarManager.jsx:10-24`, `src/pages/VisionBoard.jsx:28-47`.

## 12. Acceptance criteria

- **AC-VB-PIL-01** Given a pillar with zero activities and a name in §11, When the Pillars tab loads, Then five `PillarActivity` rows exist for it with `order` 0–4 in the §11 sequence. (refs BR-VB-PIL-04)
- **AC-VB-PIL-02** Given a pillar renamed to a name absent from §11 and with all activities deleted, When the tab reloads, Then no activities are seeded for it. (refs BR-VB-PIL-04, BR-VB-PIL-03)
- **AC-VB-PIL-03** Given a visible pillar, When the eye button is pressed, Then `is_hidden` is true, the card shows "hidden" with a struck-through name, and the next Daily Eval session has one fewer step. (refs BR-VB-PIL-01, BR-VB-PIL-02)
- **AC-VB-PIL-04** Given a card, When it is double-clicked, Then "Edit Pillar" opens with the current name, description and colour; When Save is pressed with a new colour, Then the card border and tint use the new colour. (refs §4)
- **AC-VB-PIL-05** Given two activities checked in different pillars, When "Create 2 Goal(s)" → "Create Goals" is pressed with frequency Weekly and occurrences 3, Then two `Goal` rows exist with `timeframe` weekly, `occurrences` 3, `member_name` "Self", `category` = each pillar's name, and each has three `GoalTask` rows titled "{activity} (1/3)", "(2/3)", "(3/3)" with `frequency` weekly. (refs BR-VB-PIL-06)
- **AC-VB-PIL-06** Given the occurrence dialog with no frequency chosen and an empty count, When "Create Goals" is pressed, Then the goal has `timeframe` daily and `occurrences` 1 and a single `GoalTask` titled with the bare activity text. (refs BR-VB-PIL-05)
- **AC-VB-PIL-07** Given "Edit Activities" mode, When "Walk the dog" is typed and Enter pressed, Then a `PillarActivity` "Walk the dog" exists with `order` equal to the previous count and the input is empty. (refs §5)
- **AC-VB-PIL-08** Given the AI dialog returned five suggestions, When two are deselected and "Add 3" is pressed, Then three `PillarActivity` rows are appended with `order` continuing from the pillar's count, the alert "3 activity(ies) added to {pillar}!" appears, and no `Goal` is created. (refs BR-VB-PIL-08, BR-VB-PIL-09)
- **AC-VB-PIL-09** Given the toolbar shows "Collapse all", When it is pressed, Then every card collapses and the tooltip reads "Expand all"; When pressed again, every card expands. (refs §2)
