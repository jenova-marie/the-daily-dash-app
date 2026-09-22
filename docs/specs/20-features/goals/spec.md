# Goals — Feature Spec

**Feature code:** `GOAL` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 114 · Described 2 · Partial 4

**Sources owned:** `src/pages/Goals.jsx`, `src/components/onboarding/GoalsOnboarding.jsx`, `src/components/dashboard/DashboardGoals.jsx`
**Sources referenced (owned elsewhere):** `src/components/LabelPicker.jsx`, `src/utils/labelHistory.js`, `src/components/SwipeableListItem.jsx`, `src/lib/HeaderContext.jsx` → `10-architecture/shared-interactions.md` · `src/components/WidgetCard.jsx` → `10-architecture/export-print-email.md` · `src/lib/categoryUtils.js` → `20-features/tasks` · `src/components/visionboard/PillarManager.jsx`, `DailyEvaluation.jsx`, `src/pages/VisionBoard.jsx` → `20-features/vision-board` · `src/pages/Education.jsx`, `src/components/ActivityGenerator.jsx`, `ActivityLibrary.jsx` → `20-features/education` · `src/pages/DailySchedule.jsx`, `src/components/DailyToDo.jsx` → `20-features/daily-schedule` · `src/pages/Dashboard.jsx` → `20-features/dashboard` · `base44/entities/Goal.jsonc`, `GoalTask.jsonc`, `ChoreUser.jsonc` → `10-architecture/data-model/goals.md`, `chores.md`

Sub-spec: `milestone-tasks.md` (Level 2: `GoalTask` lifecycle and progress derivation).

**Permissions:** per-user data; admin-only operations: none

## 0. Entry points & navigation

- Route: `/goals` · Sidebar label: "Goals" · Header title text: "Goal Manager" · Position in swipe order: 8 of 14 (after Education, before Vision Board) `[Implemented]` `src/components/Layout.jsx:12-26`, `src/pages/Goals.jsx:42`.
- Query parameters accepted: none `[Implemented]` `src/pages/Goals.jsx:40-81`.
- Feature-toggle gating: none `[Implemented]` `src/components/Layout.jsx:127-131`.
- Header right-slot contents: a "Guide" icon button that reopens the walkthrough `[Implemented]` `src/pages/Goals.jsx:43`.
- Dashboard: widget id `goals`, title "Goals Overview", seventh in the default order `[Implemented]` `src/pages/Dashboard.jsx:24-33,40`.

## 1. Purpose & user benefit

Goals are objectives with a timeframe whose progress and status are derived from the milestone tasks under them, so the account owner sees "how far along" without editing a percentage. Goals can be assigned to a household member, labelled, filtered, sorted, archived and restored, printed and emailed.

User Manual `[Described]` `src/pages/UserManual.jsx:273-320`:

> Set and track personal or family goals across different timeframes with milestone tracking, progress monitoring, and integration with your Vision Board health pillars.
>
> **Creating & Managing Goals**
> - Click **"Add Goal"** to create — fill in title, description, timeframe (daily / weekly / monthly / annual / 3-year / 5-year), and target date.
> - Assign goals to a **member name** (personal or family member) for accountability and tracking.
> - Set **occurrences count** — the number of times the goal must be completed (e.g., "Run 5K" = 1 occurrence, "Exercise 30 days" = 30 occurrences).
> - **Goal status workflow:** Not Started → In Progress → Completed → On Hold. Track which goals are active or on hold.
> - **Progress slider** (0–100%) to manually update progress toward completion — reflects partial progress toward multi-occurrence goals.
>
> **Milestone Tasks**
> - **Add milestone tasks** within a goal — smaller action items with their own frequency (once / daily / weekly / biweekly / monthly).
> - Milestone tasks appear automatically in the **Daily Schedule item library** for time-blocked scheduling.
> - Mark milestones complete to track incremental progress toward the overall goal.
> - Recurring milestone tasks reset on their scheduled day and can contribute to goal completion tracking.
>
> **Vision Board Integration**
> - After completing a **Daily Evaluation** on the Vision Board, low-scoring pillars (rated 1–3) are highlighted as focal areas.
> - **Auto-convert focal areas to goals** — directly create goals from low-scoring pillars to address wellness gaps.
> - Track goals tied to specific health pillars to improve overall well-being.
>
> **Dashboard & Archiving**
> - **Dashboard Goals Widget:** Shows active goals with progress bars. Goals due today can be checked off directly.
> - **Archive completed goals** to keep your active list clean and focused.
> - Use the **restore button** (⟲) in the **Archive tab** to move goals back to In Progress status.
> - Filter goals by **timeframe or member** using the tabs and controls at the top.

Mapping of these claims: create dialog, member assignment, occurrences count, archive/restore to In Progress, dashboard check-off, item-library surfacing and Vision Board creation are `[Implemented]` (§4, §7); "On Hold", the "Progress slider", per-milestone frequency choice, and recurring milestone reset are `[Described]` only (D-609, D-610, D-611); "Filter … by timeframe or member using the tabs" is `[Partial]` (member is a filter, timeframe is a sort; D-613).

Walkthrough (verbatim in §9) states: "Goals are assigned to you by default." and "Goals created from your Vision Board Daily Evaluation appear here automatically." `[Implemented]` `src/pages/Goals.jsx:264-266`, `src/components/visionboard/DailyEvaluation.jsx:161`.

## 2. Concepts & vocabulary

Glossary terms used: **goal**, **milestone task**, **occurrence**, **household member** (the Goals UI displays "family members" and "Manage Family Members" for the same `ChoreUser` entity `src/pages/Goals.jsx:515,517,528`), **label**, **archive**, **widget**, **walkthrough**, **export**, **today**, **account owner**.

Feature-local terms:
- **timeframe** — one of `daily`, `weekly`, `monthly`, `annual`, `3_year`, `5_year`, `occurrences`, displayed "Daily", "Weekly", "Monthly", "Annual", "3 Year", "5 Year", "Occurrences" `[Implemented]` `src/pages/Goals.jsx:23-31`.
- **occurrence-based goal** — a goal whose timeframe is `occurrences`; its card is titled "Occurrence-Based Goals" and it carries a count instead of a target date `[Implemented]` `src/pages/Goals.jsx:561-571,730`.
- **row** — one goal line inside a card, expandable to show its milestone tasks `[Implemented]` `src/pages/Goals.jsx:371-508`.

## 3. User stories

- **US-GOAL-01** As the account owner, I want to create a goal with a timeframe, target date or occurrence count, assignee, label, and an initial list of milestone tasks so that the goal is actionable from the start. `[Implemented]` `src/pages/Goals.jsx:260-279,544-633`
- **US-GOAL-02** As the account owner, I want the goal's progress and status to follow its milestone tasks so that I never edit a percentage by hand. `[Implemented]` `src/pages/Goals.jsx:167-178`
- **US-GOAL-03** As the account owner, I want to expand a goal and add, tick, rename, re-count, or remove milestone tasks in place so that progress is one click away. `[Implemented]` `src/pages/Goals.jsx:111-165,417-505`
- **US-GOAL-04** As the account owner, I want to assign goals to household members and view one member's goals so that personal and shared goals sit side by side. `[Implemented]` `src/pages/Goals.jsx:234-249,364-369,514-543,595-602,639-651`
- **US-GOAL-05** As the account owner, I want goals grouped by timeframe or by label with collapsible sub-sections so that a long list stays scannable. `[Implemented]` `src/pages/Goals.jsx:652-660,675-796`
- **US-GOAL-06** As the account owner, I want to archive a finished or parked goal and restore it later so that the active list stays clean. `[Implemented]` `src/pages/Goals.jsx:224-232,405-413`
- **US-GOAL-07** As the account owner, I want to print or email a timeframe's goals so that I can share them off-screen. `[Implemented]` `src/pages/Goals.jsx:737-761`
- **US-GOAL-08** As the account owner, I want a Dashboard overview of active goals with a quick complete action so that I can close a goal without opening the page. `[Implemented]` `src/components/dashboard/DashboardGoals.jsx:71-135`

## 4. Capabilities & interactions

### Page layout

- Top-right action row: a people icon button titled "Manage family members" and a "+" button (no text) that opens "New Goal" `[Implemented]` `src/pages/Goals.jsx:512-545`.
- A filter select and a sort select `[Implemented]` `src/pages/Goals.jsx:637-661`.
- Two stat cards, "Active" and "Completed" (BR-GOAL-12) `[Implemented]` `src/pages/Goals.jsx:663-673`.
- Cards per timeframe or per label (BR-GOAL-08, BR-GOAL-09), then the walkthrough, the edit dialog, and the empty-state card when nothing matches `[Implemented]` `src/pages/Goals.jsx:675-881`.

### Create a goal — "New Goal" dialog

Fields `[Implemented]` `src/pages/Goals.jsx:55,546-631`:
- **Title** text (required; "Create Goal" does nothing while empty) `:549,261`.
- **Description** textarea `:550`.
- **Timeframe** select; options "Daily", "Weekly", "Monthly", "Annual", "3 Year", "5 Year", "Occurrences"; default `monthly` `:553-560,55`.
- When timeframe is `occurrences`: **How many times?** number input, minimum 1, default 1; a non-number becomes 1 `:561-571`. Otherwise: **Target Date** popover button showing "Pick a date" or the chosen date as "MMM d, yyyy"; a single-date calendar stores `YYYY-MM-DD` `:572-592`.
- **Assign To** select whose displayed value defaults to the signed-in user's full name; options: the signed-in user's full name, then every household member by name `:594-603`. When left untouched, `member_name` is stored as the signed-in user's full name (BR-GOAL-04) `:264-266`.
- **Label** and colour via the shared label picker (`10-architecture/shared-interactions.md` §5); a chosen label is saved to label history on create `:262,604-612`.
- **Milestones (Tasks)**: an input with placeholder "Add milestone task..." plus a "+" button titled "Add milestone"; Enter or the button appends the trimmed text to a pending list; each pending line has an "X" to remove it `:251-258,613-629`.
- **Create Goal** button: creates the `Goal`, then one milestone task per pending line (`milestone-tasks.md` BR-GOAL-T01), clears the form, closes the dialog, and reloads `:260-279,630`.

### Edit a goal — "Edit Goal" dialog

- Opened by double-clicking a goal row's text area `[Implemented]` `src/pages/Goals.jsx:286-299,381`.
- Same fields as create except: no milestones list; Assign To starts at the stored `member_name` with placeholder "Select member"; buttons "Cancel" and "Save" `[Implemented]` `src/pages/Goals.jsx:803-872`.
- Save requires a title, saves the label to history, updates title, description, timeframe, occurrences, target date, member name, label and colour, and reloads `[Implemented]` `src/pages/Goals.jsx:301-308`.

### Goal row

- Chevron toggles expansion (collapsed by default) `[Implemented]` `src/pages/Goals.jsx:187-189,373,378-380`.
- Title; a meta line (BR-GOAL-11); a progress bar when the goal has milestone tasks `[Implemented]` `src/pages/Goals.jsx:382-395`.
- Right side: the label in upper case coloured with the label colour; the member name chip; and hover-revealed actions: "Archive" on the Active and member views, "Restore" on the Archive view `[Implemented]` `src/pages/Goals.jsx:397-415`.
- Long-press (touch) or hover (pointer) reveals delete; delete goes through the confirm dialog described in `10-architecture/shared-interactions.md` (AR-UI-01, AR-UI-02) and deletes the `Goal` only (milestone tasks remain; `milestone-tasks.md`) `[Implemented]` `src/pages/Goals.jsx:281-284,377`.

### Expanded row — milestone tasks

- Each milestone task: checkbox; title (struck through when completed; tooltip "Double-click to edit"); an occurrence badge; a hover "X" delete `[Implemented]` `src/pages/Goals.jsx:419-478`.
- **Toggle**: the checkbox completes or un-completes a single-occurrence task, or steps the count of a multi-occurrence task (`milestone-tasks.md` BR-GOAL-T03) `[Implemented]` `src/pages/Goals.jsx:122-134,425`.
- **Rename inline**: double-click the title to edit in place; Enter or blur saves the trimmed title (an empty title cancels), Escape cancels `[Implemented]` `src/pages/Goals.jsx:136-142,426-441`.
- **Occurrence badge**: shows "{completed_count}/{occurrences}" when occurrences exceed 1, otherwise "×1" visible only on hover; tooltip "Double-click to edit occurrences" `[Implemented]` `src/pages/Goals.jsx:442-455`.
- **Edit occurrences**: double-click the badge to reveal a "−" / value / "+" / "✓" pill; "−" stops at 1; "✓" saves (`milestone-tasks.md` BR-GOAL-T04). No cancel control is observed for the pill (Q-601) `[Implemented]` `src/pages/Goals.jsx:143-153,456-473`.
- **Add a milestone task inline**: input with placeholder "Add a task..." plus a "−" / value / "+" occurrence stepper (minimum 1, default 1) and a "+" button titled "Add task"; Enter or the button creates the task with the chosen occurrence count and clears both controls `[Implemented]` `src/pages/Goals.jsx:111-120,480-503`.
- **Delete a milestone task**: the hover "X" deletes immediately without confirmation and recomputes the goal `[Implemented]` `src/pages/Goals.jsx:161-165,474-476`.

### Archive / restore

- "Archive" (Active and member views) sets `archived: true` `[Implemented]` `src/pages/Goals.jsx:224-227,410`.
- "Restore" (Archive view) sets `archived: false` and `status: "in_progress"` regardless of progress `[Implemented]` `src/pages/Goals.jsx:229-232,406`.

### Household members — "Manage Family Members" dialog

- Opened by the people icon button titled "Manage family members" `[Implemented]` `src/pages/Goals.jsx:515`.
- "Add New Member" section: **Name** input and "Add Member" button; creates a `ChoreUser` with the name only (no colour) and refreshes the list `[Implemented]` `src/pages/Goals.jsx:239-244,519-525`.
- "Family Members" list (shown when any exist): colour dot (the member's colour when set) and name; long-press or hover reveals delete, which confirms (AR-UI-02) and deletes the `ChoreUser` `[Implemented]` `src/pages/Goals.jsx:246-249,526-540`.
- Members are the same rows the Chores page manages (`20-features/chores/spec.md`); this dialog offers no colour or rename `[Implemented]` `src/pages/Goals.jsx:234-249`.

### Filter and sort

- **Filter** select (value = view): "Active" (`active`), "Archive" (`archive`), then "{name}'s Goals" for every household member (value = the member's name) `[Implemented]` `src/pages/Goals.jsx:219-222,639-651`. Rules in BR-GOAL-05, BR-GOAL-06.
- **Sort** select: "Timeframe" (`timeframe`, default) or "Label" (`label`) `[Implemented]` `src/pages/Goals.jsx:53,652-660`.

### Grouping

- **Sort by timeframe**: one card per timeframe in the fixed order Daily, Weekly, Monthly, Annual, 3 Year, 5 Year, Occurrences, titled "{Timeframe} Goals" ("Occurrence-Based Goals" for `occurrences`); empty timeframes are omitted `[Implemented]` `src/pages/Goals.jsx:722-730`. Inside a card, when at least one goal has a label, rows are sub-grouped by label (case-insensitive) with "(No Label)" last, each sub-section a collapsible header coloured with the label colour and showing "({n})"; when no goal in the card has a label, rows are listed flat `[Implemented]` `src/pages/Goals.jsx:726-728,765-792`.
- **Sort by label**: one card per label (case-insensitive), alphabetical with "(No Label)" last, the card's top border coloured with the first goal's label colour; inside, sub-sections per timeframe in timeframe order, headed "{Timeframe} ({n})" ("Occurrence-Based ({n})" for `occurrences`) `[Implemented]` `src/pages/Goals.jsx:675-720`.
- **Sub-sections start collapsed** both ways; the collapsed set is rebuilt from the data on every reload `[Implemented]` `src/pages/Goals.jsx:86-98`. Clicking a sub-section header toggles it `[Implemented]` `src/pages/Goals.jsx:183-185,701-707,772-780`.
- **Collapse all / Expand all** (timeframe cards only; the same button appears in every timeframe card header, title "Expand all" or "Collapse all"): expand opens every row and every sub-section; collapse closes every row and every sub-section `[Implemented]` `src/pages/Goals.jsx:180,191-217,730-736`. Label cards have no header actions `[Implemented]` `src/pages/Goals.jsx:690-692`.

### Print / email

Per timeframe card, "Print goals" and "Email goals" icon buttons (§12) `[Implemented]` `src/pages/Goals.jsx:737-761`.

### Dashboard "Goals Overview" widget

- Loads goals where `archived` is false (100, newest first) and reloads on `Goal` changes with a 1 s debounce and at most one reload per 2 s `[Implemented]` `src/components/dashboard/DashboardGoals.jsx:74-98` (AR-UI-14).
- Shows goals whose status is not `completed`, grouped into collapsible timeframe buckets labelled "Daily", "Weekly", "Monthly", "Annual", "3 Year", "5 Year", "Occurrences"; buckets appear in the order the first goal of each timeframe is encountered (newest goal first), and each starts collapsed `[Implemented]` `src/components/dashboard/DashboardGoals.jsx:8,100-108,118-123,131-133`.
- Bucket header: chevron, label, and "({n})" where n counts the goals listed inside (BR-GOAL-14) `[Implemented]` `src/components/dashboard/DashboardGoals.jsx:32,36-43`.
- Goal line: title, member name chip when set, a "✓" button titled "Mark as complete", and a progress bar with "{progress}%" `[Implemented]` `src/components/dashboard/DashboardGoals.jsx:46-63`.
- **✓ action**: writes `status: "completed"`, `progress: 100`, `completed_at` = now, and `started_at` = now when unset; `archived` is not written (D-004 in `10-architecture/data-model/goals.md`); then reloads, so the goal leaves the widget but stays in the Goals page's Archive view (BR-GOAL-05) `[Implemented]` `src/components/dashboard/DashboardGoals.jsx:110-116`.

### 4a. Keyboard & pointer

- **Enter** in the create dialog's milestone input adds a pending line; in the inline "Add a task..." input creates the task; in the inline rename input saves `[Implemented]` `src/pages/Goals.jsx:625,486,433`.
- **Escape** in the inline rename input cancels `[Implemented]` `src/pages/Goals.jsx:433`.
- **Blur** of the inline rename input saves `[Implemented]` `src/pages/Goals.jsx:432`.
- **Double-click** on a row's text opens "Edit Goal"; on a milestone title starts rename; on the occurrence badge starts occurrence editing (AR-UI-04) `[Implemented]` `src/pages/Goals.jsx:381,438,450`. No double-tap timer is observed on this page.
- **Long-press / hover** reveals delete on goal rows and member rows (AR-UI-01) `[Implemented]` `src/pages/Goals.jsx:377,531`.
- **Hover** reveals the Archive/Restore action, the "×1" badge, and the milestone "X" `[Implemented]` `src/pages/Goals.jsx:404,448,474`.
- The occurrence pill's buttons act on mouse-down and prevent focus loss so the pill stays open `[Implemented]` `src/pages/Goals.jsx:460,465,469`.
- Swipe, drag-and-drop: none observed.

### 4b. View state & persistence

| Control | Values | Default | Scope |
|---|---|---|---|
| Filter (view) | `active`, `archive`, member name | `active` | memory `src/pages/Goals.jsx:52` |
| Sort | `timeframe`, `label` | `timeframe` | memory `:53` |
| Row expansion | per goal id | collapsed | memory `:47,187-189` |
| Sub-section collapse | per `tf-{timeframe}-{label}` / `label-{label}-{timeframe}` | collapsed (rebuilt on load) | memory `:86-98,181` |
| All-collapsed flag | true/false | true | memory `:180` |
| Inline task inputs and occurrence steppers | per goal id | "" / 1 | memory `:48-49` |
| Editing task | `{ taskId, field, value }` or none | none | memory `:50` |
| Dashboard bucket open | per bucket | closed | memory `src/components/dashboard/DashboardGoals.jsx:8` |
| Walkthrough dismissed | see §10 | — | device `goals_onboarding_done` + account `ThemeSettings.onboarding_status` |

### 4c. Empty & fallback states

- No goal matches the view: a card titled "Get Started" with "Set your first goal to start tracking your progress." `[Implemented]` `src/pages/Goals.jsx:874-881`.
- Row with no milestone tasks: meta reads "No tasks yet" and no progress bar `[Implemented]` `src/pages/Goals.jsx:384,391`.
- Target date button before a date is chosen: "Pick a date" `[Implemented]` `src/pages/Goals.jsx:579,832`.
- Assign To in the edit dialog with no member: "Select member" `[Implemented]` `src/pages/Goals.jsx:850`.
- Dashboard widget with no non-archived goal: "No goals" `[Implemented]` `src/components/dashboard/DashboardGoals.jsx:125-127`. A bucket whose goals are all outside BR-GOAL-14 renders with "(0)" and nothing inside (Q-603) `[Implemented]` `src/components/dashboard/DashboardGoals.jsx:32,42-46`.
- Label sub-group fallback: "(No Label)" `[Implemented]` `src/pages/Goals.jsx:90,677,727`.

## 5. Business rules

- **BR-GOAL-01 (timeframes).** The timeframe list and its order are `daily`, `weekly`, `monthly`, `annual`, `3_year`, `5_year`, `occurrences` `[Implemented]` `src/pages/Goals.jsx:23-31`; the entity enum omits `occurrences` (D-007 in `10-architecture/data-model/goals.md`) `[Implemented]` `base44/entities/Goal.jsonc:11-21`.
- **BR-GOAL-02 (occurrences vs target date).** The `occurrences` timeframe replaces the target date with "How many times?" (integer, minimum 1); every other timeframe shows a target date `[Implemented]` `src/pages/Goals.jsx:561-592,820-845`. The form sends both `occurrences` (1 when unused) and `target_date` ("" when unused) `[Implemented]` `src/pages/Goals.jsx:55,263`.
- **BR-GOAL-03 (title required).** Create and save do nothing while the title is empty `[Implemented]` `src/pages/Goals.jsx:261,302`.
- **BR-GOAL-04 (default assignee).** When no member is chosen, `member_name` is the signed-in user's `full_name` `[Implemented]` `src/pages/Goals.jsx:264-266`; the Assign To options are that name plus the household members' names, so `member_name` always holds a display name, not an id `[Implemented]` `src/pages/Goals.jsx:596-601`.
- **BR-GOAL-05 (views).** Active = not archived and status not `completed`; Archive = archived or status `completed` `[Implemented]` `src/pages/Goals.jsx:219-222`.
- **BR-GOAL-06 (member view).** A member view shows every goal whose `member_name` equals that member's name exactly, including archived and completed ones; its rows show the "Archive" action `[Implemented]` `src/pages/Goals.jsx:364-369,405-413` (D-608).
- **BR-GOAL-07 (derived progress and status).** After every milestone change the goal's `progress`, `status`, `archived`, `started_at`, `completed_at` are recomputed; rule in `milestone-tasks.md` BR-GOAL-T05 `[Implemented]` `src/pages/Goals.jsx:167-178`. Creating a goal does not run the derivation (Q-602) `[Implemented]` `src/pages/Goals.jsx:260-279`.
- **BR-GOAL-08 (two-level grouping).** Timeframe → label with "(No Label)" last, or label → timeframe in timeframe order; labels compare case-insensitively via the shared category utilities `[Implemented]` `src/pages/Goals.jsx:675-688,722-728`.
- **BR-GOAL-09 (sub-sections default collapsed).** Every sub-section key is marked collapsed whenever goals are loaded; "Expand all" clears the set `[Implemented]` `src/pages/Goals.jsx:86-98,211-217`.
- **BR-GOAL-10 (archive and restore).** Archive writes `archived: true` only; restore writes `archived: false, status: "in_progress"` `[Implemented]` `src/pages/Goals.jsx:224-232`.
- **BR-GOAL-11 (row meta line).** Segments joined with " • ": "{progress}% • {completed}/{total} tasks" or "No tasks yet"; "{occurrences}x" when timeframe is `occurrences` and a count exists; "Due: {target_date}"; "Started: {local date}"; "Completed: {local date}"; "Duration: {humanised}" when both timestamps exist `[Implemented]` `src/pages/Goals.jsx:383-390`. Humanised duration: under 24 hours → "{h}h"; under 30 days → "{d}d"; under 12 months (30.44-day months) → "{mo}mo"; otherwise "{y.y}yr" (365.25-day years, one decimal) `[Implemented]` `src/pages/Goals.jsx:351-362`.
- **BR-GOAL-12 (stat cards).** "Active" counts goals with status `in_progress` or `not_started`; "Completed" counts status `completed`. On the Active and Archive views the counts cover all loaded goals; on a member view they cover only that member's goals `[Implemented]` `src/pages/Goals.jsx:664-673`.
- **BR-GOAL-13 (status colour as meaning).** A row's left border colour maps status: `not_started` muted, `in_progress` blue, `completed` green, `on_hold` amber `[Implemented]` `src/pages/Goals.jsx:33-38`. The map is declared and not applied to the row markup `[Partial]` `src/pages/Goals.jsx:33-38,376`. Label colour is used for the label text and sub-section headers `[Implemented]` `src/pages/Goals.jsx:398-401,775-778`.
- **BR-GOAL-14 (dashboard listing rule).** Within a bucket a goal is listed when: it has a target date on or before today; or it has no target date and its timeframe is `daily`, `weekly`, `monthly`, `annual`, or `occurrences`. Goals with timeframe `3_year` or `5_year` and no target date are never listed `[Implemented]` `src/components/dashboard/DashboardGoals.jsx:10-32`.
- **BR-GOAL-15 (dashboard complete).** The ✓ action completes the goal directly without touching its milestone tasks (`milestone-tasks.md` §5a) `[Implemented]` `src/components/dashboard/DashboardGoals.jsx:110-116`.
- **BR-GOAL-16 (load limits).** The page loads the 200 newest goals, all household members sorted by name (50), and the 500 newest milestone tasks `[Implemented]` `src/pages/Goals.jsx:84,102,235`.
- **BR-GOAL-17 (label history).** A label chosen on create or edit is saved to the shared label history `[Implemented]` `src/pages/Goals.jsx:262,303` (AR-UI-06).

### 5a. State & lifecycle

`Goal.status` / `archived` (full entity lifecycle in `10-architecture/data-model/goals.md`):

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| created (`not_started`, `archived` false, `progress` 0 by entity defaults) | "Create Goal" | same | milestone tasks created; no derivation `src/pages/Goals.jsx:260-279` |
| `not_started` | first milestone completion (derivation) | `in_progress` | `started_at` = now `src/pages/Goals.jsx:171-176` |
| `in_progress` / `not_started` | all milestone tasks completed (derivation) | `completed`, `archived` true | `completed_at` = now `src/pages/Goals.jsx:171-176` |
| `completed` | a milestone un-completed (derivation) | `in_progress` (or `not_started` at 0%), `archived` false | none `src/pages/Goals.jsx:171-173` |
| any, not archived | "Archive" | `archived` true (status unchanged) | none `src/pages/Goals.jsx:224-227` |
| archived or completed | "Restore" | `archived` false, `in_progress` | none `src/pages/Goals.jsx:229-232` |
| not completed | Dashboard "✓" | `completed`, `progress` 100 | `completed_at` = now; `started_at` = now if unset; `archived` unchanged `src/components/dashboard/DashboardGoals.jsx:110-116` |
| any | delete (confirmed) | removed | milestone tasks remain `src/pages/Goals.jsx:281-284` |

`on_hold` is never written `[Implemented]` `src/pages/Goals.jsx` (no occurrence) (D-610).

### 5b. Time & date semantics

- `target_date` is a `YYYY-MM-DD` string chosen from a calendar and displayed by parsing `{date}T00:00:00` (AR-TIME-03, AR-TIME-10) `[Implemented]` `src/pages/Goals.jsx:579,586`.
- `started_at` / `completed_at` are ISO timestamps from `toISOString()` (AR-TIME-12) and are displayed with the device locale date `[Implemented]` `src/pages/Goals.jsx:174-175,387-388`.
- "Due" on the Dashboard: `parseISO(target_date)` is on or before the current instant's day (`isBefore` or `isToday`) `[Implemented]` `src/components/dashboard/DashboardGoals.jsx:10-15`. The Goals page shows "Due: {target_date}" with no overdue computation `[Implemented]` `src/pages/Goals.jsx:386`. Canonical due/overdue definitions: `10-architecture/time-and-date-semantics.md`.
- Duration thresholds: BR-GOAL-11.

## 6. Data

| Entity | Read | Write | Citation |
|---|---|---|---|
| `Goal` (E-Goal) | `list("-created_date", 200)`; dashboard `filter({ archived: false }, "-created_date", 100)` + subscribe | create; update (edit fields; derived fields; `archived`; restore); delete | `src/pages/Goals.jsx:84,176,225,230,267,282,304`, `src/components/dashboard/DashboardGoals.jsx:75,84,114` |
| `GoalTask` (E-GoalTask) | `list("-created_date", 500)`; `filter({ goal_id })` | create; update; delete | `milestone-tasks.md` §6 |
| `ChoreUser` (E-ChoreUser) | `list("name", 50)` | create (name only); delete | `src/pages/Goals.jsx:235,241,247` |
| `ThemeSettings` | `list("-updated_date", 1)` | create / update `onboarding_status` | `src/pages/Goals.jsx:67`, `src/components/onboarding/GoalsOnboarding.jsx:40-47` |
| `User` (auth) | `auth.me()` for `full_name` and `email` | none | `src/pages/Goals.jsx:80,331,752` |

Fields owned: see `10-architecture/data-model/goals.md`. `Goal.milestones` (newline text) is read only by the unbound page-level print/email builder `[Partial]` `src/pages/Goals.jsx:315,334` (D-311).

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| inbound | Vision Board — pillar card | creates a `Goal` (member "Self", pillar label and colour) with N occurrence milestone tasks | `src/components/visionboard/PillarManager.jsx:209-243` |
| inbound | Vision Board — daily evaluation | creates goals from queued activities; shows "remaining" milestone counts for open goals matched by title | `src/components/visionboard/DailyEvaluation.jsx:38-59,155-182` |
| inbound | Vision Board page | creates a monthly goal | `src/pages/VisionBoard.jsx:157-173` |
| inbound | Education — subject card | `createGoalFromEducation` | `src/pages/Education.jsx:248-262` |
| inbound | Education — activity generator | "create as goals" option | `src/components/ActivityGenerator.jsx:160-170` |
| inbound | Education — activity library | goal creation path | `src/components/ActivityLibrary.jsx` (`20-features/education`) |
| outbound | Daily Schedule — item library "Goals" tab | offers the oldest unscheduled incomplete milestone task per goal, or the goal itself | `20-features/daily-schedule/item-library.md` BR-SCHED-68..70 |
| outbound | Daily to-do | goal-sourced rows; completion and delete paths | `20-features/daily-schedule/daily-todo.md` BR-TODO-10 |
| both | Chores | household members are the same `ChoreUser` rows | `src/pages/Goals.jsx:235`, `20-features/chores/spec.md` |
| outbound | Dashboard | `goals` widget | `src/pages/Dashboard.jsx:24-40` |
| both | Labels | shared label picker and history | `10-architecture/shared-interactions.md` §5 |
| outbound | Export | card print/email | `10-architecture/export-print-email.md` §3 |

Deep links with query parameters: none.

### 7a. Feedback & notifications

- Delete confirm dialog "Delete Item?" / "This action cannot be undone." for goals and members (AR-UI-02) `[Implemented]` `src/pages/Goals.jsx:377,531`.
- Alert "Goals sent to your email!" after a card email `[Implemented]` `src/pages/Goals.jsx:758` (AR-EXPORT-03).
- Live refresh on the Dashboard widget (AR-UI-14) `[Implemented]` `src/components/dashboard/DashboardGoals.jsx:82-98`. The Goals page itself has no subscription `[Implemented]` `src/pages/Goals.jsx:76-81`.
- Toasts, celebratory effects, reminders: none observed.

## 8. AI & automation

None on these surfaces. Goals created by AI-assisted flows elsewhere are inbound integrations (§7; `10-architecture/ai-services.md` §3, §4).

## 9. Onboarding content

Dialog title "Welcome to Goal Manager"; subtitle "Here's how to get the most out of this page — it only takes a minute!"; button "Got it — Don't Remind Me Again" `[Implemented]` `src/components/onboarding/GoalsOnboarding.jsx:56-59,73-75`. Steps verbatim `[Implemented]` `src/components/onboarding/GoalsOnboarding.jsx:8-34`:

1. **1. Set Goals** — "Create goals with a timeframe (daily, weekly, monthly, annual, 3-year, or 5-year), an optional target date, and a member name. Goals are assigned to you by default." (D-612: the form also offers Occurrences)
2. **2. Add Milestone Tasks** — "Break each goal into actionable milestone tasks. Check them off as you complete them — the goal's progress bar updates automatically."
3. **3. Add Family Members** — "Use the people icon to add family members and assign goals to them. Filter the view by individual to track personal, household, or shared goals side by side."
4. **4. Track Progress** — "A progress bar reflects how far along each goal is. Goals created from your Vision Board Daily Evaluation appear here automatically."
5. **5. Archive & Restore** — "Manually archive goals to keep your list clean, or restore them from the Archive tab at any time using the restore button."

Trigger: on page load, skip when the device key `goals_onboarding_done` is `"true"`; otherwise read the latest `ThemeSettings.onboarding_status`; show when no settings row exists, when the map lacks the key, or when the read fails; when the map has the key, write the device key instead of showing `[Implemented]` `src/pages/Goals.jsx:65-73`. Dismiss writes the device key `"true"` and sets the key in the account map (creating a `ThemeSettings` row with `onboarding_status: "{}"` if none) `[Implemented]` `src/components/onboarding/GoalsOnboarding.jsx:37-50`. Closing the dialog without the button just closes it `[Implemented]` `src/components/onboarding/GoalsOnboarding.jsx:53`. Persistence generation 2 (`10-architecture/shared-interactions.md` AR-UI-11; registry `20-features/onboarding`). The header "Guide" button reopens it `[Implemented]` `src/pages/Goals.jsx:43`.

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `goals_onboarding_done` | walkthrough dismissed on this device (`"true"`) | absent | dismiss button; or page load when the account map already has it | never |
| `app_label_history` | shared label history (owned by `10-architecture/shared-interactions.md`) | — | label save on create/edit | — |

## 11. Seed / hardcoded data used

- Timeframe list and labels (BR-GOAL-01) `src/pages/Goals.jsx:23-31`, `src/components/dashboard/DashboardGoals.jsx:100-108`.
- Status colour map (BR-GOAL-13) `src/pages/Goals.jsx:33-38`.
- Duration thresholds 24 h / 30 d / 12 mo with 30.44-day months and 365.25-day years (BR-GOAL-11) `src/pages/Goals.jsx:351-362`.
- Literal "(No Label)" `src/pages/Goals.jsx:90,677`.
- Print/email accent colour `#6366f1` `src/pages/Goals.jsx:316,335`.

## 12. Print / email formats

- **Per timeframe card — "Print goals"** (Tier A, card body innerHTML; mechanism `10-architecture/export-print-email.md` §2): opens a new window titled and headed "{view}'s {Timeframe} Goals" and prints the card's current markup, including collapsed state; controls carry `no-print` `[Implemented]` `src/pages/Goals.jsx:731,737-747`. The label template checks for a view value `all` that the filter does not offer, so the heading reads "active's Monthly Goals", "archive's Monthly Goals", or "{member}'s Monthly Goals" (D-607) `[Implemented]` `src/pages/Goals.jsx:738`.
- **Per timeframe card — "Email goals"**: same content wrapped in a container, sent to the signed-in user's email with the same label as subject; alert "Goals sent to your email!" `[Implemented]` `src/pages/Goals.jsx:748-761` (AR-EXPORT-01).
- **Page-level builders**: hand-built list of the filtered goals with title, "[{Timeframe}]", description, "Target: {date}", "Progress: {n}%", and `Goal.milestones` lines; not bound to any control `[Partial]` `src/pages/Goals.jsx:310-349` (D-311 in `10-architecture/export-print-email.md`).
- Options dialog: none. Remembered inputs: none.
- Label cards (sort by label) have no print or email action `[Implemented]` `src/pages/Goals.jsx:690-692`.

## 13. Acceptance criteria

- **AC-GOAL-01** Given the New Goal dialog with an empty title, When "Create Goal" is pressed, Then nothing is created and the dialog stays open. (refs BR-GOAL-03)
- **AC-GOAL-02** Given Assign To was not changed, When a goal is created, Then its `member_name` is the signed-in user's full name. (refs BR-GOAL-04)
- **AC-GOAL-03** Given timeframe "Occurrences", When the dialog renders, Then "How many times?" replaces "Target Date", and the row later shows "{n}x". (refs BR-GOAL-02, BR-GOAL-11)
- **AC-GOAL-04** Given two milestone lines were added in the dialog, When the goal is created, Then two milestone tasks exist for it and the row reads "0% • 0/2 tasks". (refs BR-GOAL-07, BR-GOAL-11)
- **AC-GOAL-05** Given a goal with status `completed`, When the "Active" view is shown, Then it is absent; When "Archive" is shown, Then it is present with a "Restore" action. (refs BR-GOAL-05)
- **AC-GOAL-06** Given "Restore" is pressed on an archived goal at 40% progress, Then the goal has `archived` false and status `in_progress`. (refs BR-GOAL-10)
- **AC-GOAL-07** Given a member "Sam" with one archived goal, When "Sam's Goals" is selected, Then the archived goal is listed. (refs BR-GOAL-06)
- **AC-GOAL-08** Given goals labelled "Health" and unlabelled in the Monthly timeframe, When sorted by Timeframe, Then the Monthly card shows the "Health" sub-section before "(No Label)", both collapsed. (refs BR-GOAL-08, BR-GOAL-09)
- **AC-GOAL-09** Given sort "Label", Then one card per label appears alphabetically with "(No Label)" last and timeframe sub-sections inside. (refs BR-GOAL-08)
- **AC-GOAL-10** Given "Expand all" is pressed, Then every row and every sub-section is open; Given "Collapse all", Then all are closed. (refs §4 grouping)
- **AC-GOAL-11** Given `started_at` and `completed_at` 40 days apart, When the row renders, Then the meta line ends with "Duration: 1mo". (refs BR-GOAL-11)
- **AC-GOAL-12** Given three goals `not_started`, two `in_progress`, one `completed`, When the Active view is shown, Then the stat cards read Active 5 and Completed 1. (refs BR-GOAL-12)
- **AC-GOAL-13** Given a milestone title is double-clicked and edited, When Enter is pressed, Then the new title is saved; When Escape is pressed, Then the original stays. (refs §4a)
- **AC-GOAL-14** Given a member is added in "Manage Family Members", When the Chores page is opened, Then the same member is listed there. (refs §7)
- **AC-GOAL-15** Given "Print goals" is pressed on the Weekly card in the Active view, Then a print window headed "active's Weekly Goals" opens with the card's content. (refs §12, D-607)
- **AC-GOAL-16** Given a non-archived `in_progress` goal with timeframe `weekly` and no target date, When the Dashboard widget renders, Then it is listed under "Weekly"; Given timeframe `5_year` and no target date, Then it is not listed. (refs BR-GOAL-14)
- **AC-GOAL-17** Given "✓" is pressed on a widget goal, Then the goal has status `completed`, progress 100, `completed_at` set, `started_at` set if it was empty, and `archived` unchanged. (refs BR-GOAL-15)
- **AC-GOAL-18** Given the device key is absent and the account map has `goals_onboarding_done`, When the page loads, Then no walkthrough shows and the device key is written. (refs §9)
- **AC-GOAL-19** Given no goal matches the view, Then the "Get Started" card reads "Set your first goal to start tracking your progress.". (refs §4c)

## 14. Discrepancies & open questions

- **D-607** Print/email heading. The label template uses "All {Timeframe} Goals" only when the view equals `all` (`src/pages/Goals.jsx:738,749`); the filter offers `active`, `archive`, and member names (`src/pages/Goals.jsx:219-222,644-649`), so the heading is "{view}'s {Timeframe} Goals" for every view.
- **D-608** Member view contents. The Active view excludes archived and completed goals (`src/pages/Goals.jsx:220`); a member view includes them (`:364-369`) and shows the "Archive" action on rows that are already archived (`:405-413`).
- **D-609** Progress editing. The User Manual describes a "Progress slider (0–100%) to manually update progress" (`src/pages/UserManual.jsx:288`); the page derives progress from milestone tasks and offers no slider (`src/pages/Goals.jsx:167-178,803-872`).
- **D-610** On Hold. The User Manual describes a workflow ending in "On Hold" (`src/pages/UserManual.jsx:287`) and the entity and colour map declare `on_hold` (`base44/entities/Goal.jsonc:28-35`, `src/pages/Goals.jsx:37`); no code path writes it.
- **D-611** Milestone frequency. The User Manual says milestone tasks have "their own frequency (once / daily / weekly / biweekly / monthly)" and "reset on their scheduled day" (`src/pages/UserManual.jsx:294,297`); the Goals page always writes `frequency: "once"` and no reset exists (`src/pages/Goals.jsx:115,270`).
- **D-612** Timeframe list in the walkthrough. Step 1 lists six timeframes (`src/components/onboarding/GoalsOnboarding.jsx:12`); the form offers a seventh, "Occurrences" (`src/pages/Goals.jsx:30`). See D-007.
- **D-613** The User Manual says "Filter goals by timeframe or member using the tabs" (`src/pages/UserManual.jsx:314`); the page has a member filter select and a timeframe/label sort select (`src/pages/Goals.jsx:639-660`).
- **D-614** The User Manual says the widget shows goals "due today" for check-off (`src/pages/UserManual.jsx:311`); the widget lists goals with a target date on or before today or with no target date and a timeframe other than `3_year`/`5_year` (`src/components/dashboard/DashboardGoals.jsx:10-32`).
- **D-004**, **D-007**, **D-013**, **D-311** apply here and are recorded in `10-architecture/data-model/goals.md` and `10-architecture/export-print-email.md`.
- **Q-601** Blocks §4a. The occurrence-editing pill offers "−", "+", and "✓" only (`src/pages/Goals.jsx:456-473`); is a cancel gesture (Escape or outside click) intended?
- **Q-602** Blocks §5a. Creating a goal with milestone lines does not run the derivation (`src/pages/Goals.jsx:260-279`), so a new goal keeps entity defaults until a milestone changes. Intended?
- **Q-603** Blocks §4 dashboard widget. A timeframe bucket whose goals fail BR-GOAL-14 still renders with "(0)" (`src/components/dashboard/DashboardGoals.jsx:32,42`). Intended?
