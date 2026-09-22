# Vision Board — Daily Evaluation

**Feature code:** `VB-EVAL` · **Level:** 2 · **Parent:** `spec.md` · **Status:** draft

**Tag summary:** Implemented 50 · Described 3 · Partial 0

**Sources:** `src/components/visionboard/DailyEvaluation.jsx`; the Daily Eval tab wiring and date picker in `src/pages/VisionBoard.jsx`.
**Referenced:** `base44/entities/DailyPillarTracking.jsonc`, `PillarActivity.jsonc` → `10-architecture/data-model/vision-board.md`; `DailyGratitude.jsonc` → `10-architecture/data-model/checklist.md`; `Goal.jsonc`, `GoalTask.jsonc` → `20-features/goals`; swipe suppression → `10-architecture/shared-interactions.md` AR-UI-13; today/date rules → `10-architecture/time-and-date-semantics.md`.

The glossary term is **daily evaluation**; the tab is labelled "Daily Eval" and the card "Daily Evaluation". The component receives the evaluation date and the visible pillars in `order` (`spec.md` §4). `[Implemented]` `src/pages/VisionBoard.jsx:226,238,263`

## 1. Load and modes

- **BR-VB-EVAL-01 (Load per date).** Whenever the evaluation date changes, the component reads every `DailyPillarTracking` row for that date and prefills rating, notes and selected activities per pillar; reads the first `DailyGratitude` row for the date (entry and id); reads all `PillarActivity` rows grouped by pillar; and computes the active-goal matches (§5) `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:62-95`.
- **BR-VB-EVAL-02 (Two modes).** When at least one tracking row exists for the date and Edit has not been pressed, the **summary mode** (§7) renders. Otherwise the **wizard** renders (a new evaluation, or an edit of an existing one) `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:15-16,31,254`.
- The wizard step index, queued goals and panel states are not reset by a date change; only the loaded data is replaced `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:62-95`. Switching tabs unmounts the component, so returning to the tab starts at step 1 with no queued goals `[Implemented]` `src/pages/VisionBoard.jsx:237-265`.
- While the wizard is active the global swipe-suppression flag is set (`spec.md` §4a) `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:33-36`.

## 2. Wizard structure

- **BR-VB-EVAL-03 (Steps).** One step per visible pillar in order, then one gratitude step. Total steps = visible pillars + 1. The header reads "Daily Evaluation for {MMMM d, yyyy}" and, under it, "Step {n} of {total}" prefixed by "Editing evaluation • " in edit mode `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:30,250-252,301-306`.
- **BR-VB-EVAL-04 (Progress).** A bar fills to `(current step) / (total steps)` of its width, where current step is the 1-based index; the footer repeats "{n} / {total}" `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:251-252,308-310,545-547`.
- Footer buttons: "Previous" (outline, disabled on step 1); "Next" with a chevron on pillar steps, disabled until the current pillar has a rating; on the gratitude step "Complete" (labelled "Saving..." while saving) and, in edit mode only, "Cancel" beside it `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:540-565`.
- Moving to another step collapses the Activities Used list and sets the Suggested Goals panel open or closed according to the destination pillar's rating (open when ≤ 3, including when unrated it reads as 0 and opens) `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:101-116`.

## 3. Pillar step

- Heading: the pillar name; prompt "How would you rate this pillar today?" `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:344-347`.
- **BR-VB-EVAL-05 (Rating control).** Five square buttons labelled 1 to 5; the chosen one is highlighted in the primary colour and scaled up. Choosing a rating stores it for the pillar and opens the Suggested Goals panel when the rating is ≤ 3, closing it when > 3 `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:97-100,349-363`. The tracking schema constrains `rating` to 1–5 `[Implemented]` `base44/entities/DailyPillarTracking.jsonc:18-23`.
- The remainder of the step (Activities Used, notes, Suggested Goals) appears only once a rating is chosen `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:365`.
- **Activities Used** (only when the pillar has activities): a green collapsible header with a check icon, the label "Activities Used" and, when any are selected, "({n} selected)". Expanded, it lists every activity of the pillar as a toggle row; selected rows are highlighted with a check mark. Selection is per pillar and per date `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:212-219,367-403`.
- **Notes:** label "Add any notes (optional)"; textarea with placeholder "What contributed to this rating..." `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:405-413`.
- **Suggested Goals** (only when the pillar has activities): an amber collapsible header with a target icon and the label "Suggested Goals"; its body is §4 `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:415-427`.
- The manual: "Rate each pillar 1–5 daily. Record activities completed and personal notes. After rating, you can optionally convert low-scoring pillars into tracked Goals." `[Described]` `src/pages/UserManual.jsx:369`. Walkthrough step 2: "Each day, rate how well you showed up for each pillar on a scale of 1–5. If you score 3 or below, you'll see your pillar activities as optional goals to create. Add notes and pick activities you did." `[Described]` `src/components/visionboard/OnboardingDialog.jsx:14` (D-707).

## 4. Suggested Goals panel and the goal queue

Every activity of the current pillar is listed as a chip in one of three states `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:427-531`:

| State | Condition | Appearance | Actions |
|---|---|---|---|
| **Already has an active goal** | an active-goal match exists for the activity (§5) | green row: activity text and a badge "{remaining} left" | none |
| **Queued** | the activity was added to plan in this session | green row: activity text, "{occurrences}x {frequency}", and "✕" | "✕" removes it from the queue |
| **Available** | otherwise | neutral row: activity text and a "+ Goal" chip | tapping the row expands the settings; the chip then reads "Cancel" and tapping again collapses it |

- Expanded settings for an available activity `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:480-527`:
  - "Occurrences:" number input, min 1, placeholder "e.g. 3", initially empty.
  - "Frequency" four-way segmented control `daily` / `weekly` / `monthly` / `annual`, initially `daily`.
  - "Add to Plan" button with a check icon.
- **BR-VB-EVAL-06 (Queue, do not write).** "Add to Plan" stores the activity with its settings in the queue (occurrences = the entered integer or 1, never below 1; frequency = the chosen value or `daily`) and collapses the settings. Nothing is written to any entity at this point `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:229-240`. The source comment reads "Queue a goal for creation when Complete is clicked (does NOT save to DB yet)".
- Settings entered for an activity persist while the wizard is mounted, so re-expanding shows the previous values `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:20,432,489-492,503-506`.
- The queue is keyed by activity id, so the same activity cannot be queued twice; queued goals from every pillar are kept together until Complete `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:26,233`.
- **BR-VB-EVAL-07 (Auto-open).** The panel opens automatically when the rating chosen or navigated to is ≤ 3 and closes when it is > 3; the header can be toggled by hand at any rating `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:99,106,114,417-426`.

## 5. Active-goal match ("N left")

- **BR-VB-EVAL-08.** On load, the 200 most recently created goals and the 500 most recently created milestone tasks are read. For each activity, the first goal whose `title` equals the activity text ignoring case, whose `status` is not `completed`, and which is not `archived` is the match; "remaining" is the count of that goal's milestone tasks with `completed` false `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:38-60`.
- The match is by title text only, so two pillars sharing an identical activity text share the same match `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:49-52`.
- The set is computed once per date load; goals created by Complete are reflected on the next load `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:92`.

## 6. Gratitude step and Complete

- Heading "Gratitude"; prompt "What is one thing you are grateful for today?"; textarea with placeholder "I am grateful for...", auto-focused, prefilled with the date's existing entry when one exists `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:313-325`.
- When the queue is not empty, a green box reads "Goals to be created on completion ({n}):" followed by one line per queued goal, "{activity} — {occurrences}x {frequency}", each with a "✕" that unqueues it `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:326-340`.
- **BR-VB-EVAL-09 (Complete is the only write).** Pressing "Complete" performs, in order `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:118-190`:
  1. **Tracking rows.** For each visible pillar that has a rating: if a row for `pillar_id` + date exists, update `rating`, `notes`, `selected_activities`; else create with `pillar_id`, `pillar_name`, `date`, `rating`, `notes`, `selected_activities` (empty array when none) `[Implemented]` `:122-143`. Visible pillars without a rating are skipped; hidden pillars are not part of the list and are never written.
  2. **Gratitude.** If the trimmed entry is non-empty: update the existing row's `entry` when one was loaded, else create `{ date, entry }` and remember its id. An emptied entry leaves any existing row unchanged `[Implemented]` `:145-153`.
  3. **Queued goals.** The signed-in user is read once. For each queued activity: create a `Goal` with `title` = activity text, `description` = `From {pillar_name}`, `timeframe` = the queued frequency, `occurrences`, `status` `not_started`, `member_name` = the user's `full_name` or "User" (D-701), `category` = the pillar name, `category_color` = the source pillar's colour or `#3b82f6`; then create `occurrences` `GoalTask` rows in parallel with `goal_id`, `title` = `{activity} ({i}/{n})` when n > 1 else the activity text, `frequency` = the queued frequency (D-702 for `annual`), `completed` false `[Implemented]` `:155-182`.
  4. Edit mode ends, the queue is emptied, the swipe flag is cleared, the parent's `onSaved` reloads the calendar dots, and `onCompleted` switches the page to the Pillars tab `[Implemented]` `:184-189`, `src/pages/VisionBoard.jsx:263`.
- **BR-VB-EVAL-10 (One row per pillar per date).** The update-or-create keyed on `pillar_id` + `date` keeps at most one tracking row per pillar per date from this path `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:125-141`.
- **BR-VB-EVAL-11 (One gratitude per date).** Only the first gratitude row for the date is loaded and updated `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:79-83,147-148`.
- **BR-VB-EVAL-12 (Past dates).** The same wizard and the same writes apply to any evaluation date chosen in the calendar; `date` is the chosen date, not the device date `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:64,120`. The manual: "Use the calendar icon to view or edit evaluations for past dates — days with existing evaluations are marked with a dot." `[Described]` `src/pages/UserManual.jsx:369`.
- Edit-mode "Cancel" (gratitude step only) leaves edit mode without writing; the in-memory queue is kept until the component unmounts (Q-703) `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:551-555`.

## 7. Existing-evaluation summary

Shown when tracking rows exist for the date and Edit has not been pressed `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:254-297`:

- Banner: "You've already completed an evaluation for {MMMM d, yyyy}." with buttons "Edit" (outline, pencil icon) and "Delete" (destructive, trash icon) `[Implemented]` `:257-267`.
- A grid of one tile per **visible** pillar: the name and its rating in large type, or "-" when that pillar has no row for the date `[Implemented]` `:268-275`. Ratings loaded for pillars that are now hidden are not displayed.
- "Notes" section, only when any visible pillar has notes: one block per pillar with notes `[Implemented]` `:276-286`.
- "Gratitude" section with the entry, only when one exists `[Implemented]` `:287-294`.
- **Edit** switches to the wizard with every field prefilled; the step index is whatever it was (step 1 on a fresh mount) `[Implemented]` `:260-262`.
- **BR-VB-EVAL-13 (Delete).** "Delete" asks `confirm("Delete this evaluation? This cannot be undone.")`; on confirmation every `DailyPillarTracking` row for the date (including rows of pillars that are now hidden) and every `DailyGratitude` row for the date are deleted one by one; the in-memory ratings, notes, activities, gratitude and queue are cleared; the wizard reappears at the current step; the calendar dots reload `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:192-210`. Goals created from earlier completions are not touched `[Implemented]` `:192-210`.

## 8. Date picker (card header)

Owned wiring in `spec.md` §4 "Evaluation-date picker": calendar button with tooltip `EEEE, MMM d`, single-date calendar, dotted days from the 200 most recent tracking rows, footer "Days with evaluations", reload on tab change and after save or delete `[Implemented]` `src/pages/VisionBoard.jsx:109-114,238-263`.

## 9. Feedback

- Confirm: "Delete this evaluation? This cannot be undone." `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:193`.
- "Saving..." on the Complete button while writing `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:557`.
- No alert, toast or celebration on completion; the page simply moves to the Pillars tab `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:184-190`.

## 10. Data touched

| Entity | Reads | Writes |
|---|---|---|
| `DailyPillarTracking` | filter `{ date }`; filter `{ pillar_id, date }` | create, update, delete `src/components/visionboard/DailyEvaluation.jsx:65,125-141,196-197` |
| `DailyGratitude` | filter `{ date }` | create, update, delete `:79-83,146-153,198-199` |
| `PillarActivity` | list | — `:85` |
| `Goal` | list `-created_date` 200 | create `:40,161-170` |
| `GoalTask` | list `-created_date` 500 | create `:41,171-180` |
| `User` | `auth.me()` | — `:157` |

`DailyPillarTracking.selected_activities` holds activity ids; the schema describes it as "IDs of activities that were used/completed" `[Implemented]` `base44/entities/DailyPillarTracking.jsonc:28-35`.

## 11. Acceptance criteria

- **AC-VB-EVAL-01** Given 12 visible pillars and no rows for the date, When the tab opens, Then the header reads "Step 1 of 13", the bar is 1/13 full, and "Next" is disabled until a rating is chosen. (refs BR-VB-EVAL-03, 04)
- **AC-VB-EVAL-02** Given a pillar step, When rating 3 is chosen, Then the Suggested Goals panel is open; When rating 4 is chosen instead, Then it is closed. (refs BR-VB-EVAL-05, 07)
- **AC-VB-EVAL-03** Given an available activity, When "+ Goal" is tapped, occurrences 2 and frequency weekly are set and "Add to Plan" pressed, Then the chip reads "2x weekly" with "✕" and no `Goal` row exists yet. (refs BR-VB-EVAL-06)
- **AC-VB-EVAL-04** Given one queued goal, When "Complete" is pressed on the gratitude step, Then a `Goal` exists with `title` = activity, `description` "From {pillar}", `timeframe` weekly, `occurrences` 2, `member_name` = the user's full name, `category` = pillar name, `category_color` = pillar colour, and two `GoalTask` rows titled "{activity} (1/2)" and "(2/2)". (refs BR-VB-EVAL-09)
- **AC-VB-EVAL-05** Given an activity whose text matches an active goal with 3 incomplete milestone tasks, When its pillar step opens the panel, Then the chip reads "3 left" and offers no action. (refs BR-VB-EVAL-08)
- **AC-VB-EVAL-06** Given two activities selected under "Activities Used" for a pillar, When Complete is pressed, Then that pillar's tracking row has `selected_activities` containing exactly those two ids. (refs BR-VB-EVAL-09)
- **AC-VB-EVAL-07** Given "I am grateful for coffee" entered, When Complete is pressed, Then one `DailyGratitude` row for the date has that entry; When the evaluation is edited and the entry cleared and completed again, Then the row still reads "I am grateful for coffee". (refs BR-VB-EVAL-11, step 2)
- **AC-VB-EVAL-08** Given rows exist for the date, When the tab opens, Then the summary shows each visible pillar's rating, the notes blocks, the gratitude, and "Edit" / "Delete". (refs §7)
- **AC-VB-EVAL-09** Given the summary, When "Delete" is pressed and confirmed, Then no tracking or gratitude row remains for the date, the wizard shows, and the calendar dot for that day disappears. (refs BR-VB-EVAL-13)
- **AC-VB-EVAL-10** Given the summary, When "Delete" is pressed and the confirm is dismissed, Then nothing changes. (refs BR-VB-EVAL-13)
- **AC-VB-EVAL-11** Given the calendar, When a past day with a dot is chosen, Then the summary for that date shows; When a past day without a dot is chosen, Then a fresh wizard for that date shows and Complete writes rows with that date. (refs BR-VB-EVAL-12)
- **AC-VB-EVAL-12** Given Complete succeeds, Then the page is on the Pillars tab and `window.__evalInProgress` is false. (refs BR-VB-EVAL-09 step 4)
