# Shared Interactions — Architecture Spec

**Area code:** `UI` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 96 · Described 6 · Partial 2

**Sources owned:** `src/components/SwipeableListItem.jsx`, `src/components/TimePicker.jsx`, `src/components/ModernTimePicker.jsx`, `src/components/LabelPicker.jsx`, `src/utils/labelHistory.js`, `src/components/GenericOnboardingDialog.jsx` (mechanics), `src/lib/HeaderContext.jsx`, `src/components/Layout.jsx` (swipe navigation, sidebar, header)
**Sources referenced (owned elsewhere):** `src/components/SwipeableToDoItem.jsx` → `20-features/daily-schedule` · `src/components/SwipeableEventItem.jsx` → `20-features/calendar` · `src/components/CategoryFilter.jsx` → `20-features/tasks` · `src/components/PrintRangeDialog.jsx` → `10-architecture/export-print-email.md` · page-specific bindings cited inline → their feature specs

**Permissions:** none; these are interaction conventions.

## 0. Scope

The reusable interaction language: how lists reveal delete, how double-tap edits, how times and labels are picked, how groups collapse, how first-visit walkthroughs behave, how the header and sidebar work, how swiping moves between pages, and the rule that lists update live. Feature specs cite these rules and describe only their own binding.

## 1. Long-press / hover reveal delete — `SwipeableListItem`

- **AR-UI-01** On touch devices, holding a list row for 500 ms without moving more than 10 px horizontally reveals a destructive "X" button on the row's right; moving cancels the timer `[Implemented]` `src/components/SwipeableListItem.jsx:17-36`. On pointer devices the button appears while hovering `[Implemented]` `src/components/SwipeableListItem.jsx:38-44,61`. Once a touch has been observed, hover reveal is disabled for that row `[Implemented]` `src/components/SwipeableListItem.jsx:13,18,39-43`.
- A revealed button is hidden again by touching or clicking anywhere outside the row `[Implemented]` `src/components/SwipeableListItem.jsx:65-78`. While revealed the row is tinted red `[Implemented]` `src/components/SwipeableListItem.jsx:87`.
- **AR-UI-02 — Delete always confirms.** Pressing the button opens a dialog titled "Delete Item?" with description "This action cannot be undone." and buttons "Cancel" and "Delete"; only "Delete" invokes the caller's delete `[Implemented]` `src/components/SwipeableListItem.jsx:46-54,123-138`.
- **Batch mode.** When the caller sets `isBatchMode`, the delete affordance is suppressed and a selection checkbox button is rendered instead; tapping it toggles selection via the caller `[Implemented]` `src/components/SwipeableListItem.jsx:56-61,97-108`. Bindings: Tasks `[Implemented]` `src/pages/Tasks.jsx:660-668`, Daily Checklist `[Implemented]` `src/pages/DailyChecklist.jsx:486-489,515-518`, Chores `[Implemented]` `src/pages/Chores.jsx:901-904`.
- Other bindings without batch mode: affirmations `src/components/visionboard/AffirmationManager.jsx:221`, learners `src/pages/Education.jsx:696`, favourited and past quotes `src/pages/Quotes.jsx:263,324`, meals and household members `src/pages/Chores.jsx:841,1118`, goals and members `src/pages/Goals.jsx:377,531` `[Implemented]`.
- Described as a swipe: Tasks onboarding "Swipe left on any task to delete it." `[Described]` `src/components/onboarding/TasksOnboarding.jsx:27` (D-322).

## 2. Swipe-to-reveal items (generic description)

The Daily To-Do and Calendar event rows use a horizontal swipe instead of a long press. Their feature specs own the resulting dialogs; the gesture is recorded here for consistency.

- **AR-UI-03** A touch that moves more than 50 px horizontally with less than 50 px vertical drift is a swipe; swiping left reveals the delete button, swiping right hides it again `[Implemented]` `src/components/SwipeableToDoItem.jsx:30-42`, `src/components/SwipeableEventItem.jsx:38-62`. Hover reveals the same button on pointer devices `[Implemented]` `src/components/SwipeableToDoItem.jsx:83-84,99`, `src/components/SwipeableEventItem.jsx:110-111,126`.
- The To-Do row's reveal is suppressed once the item is completed `[Implemented]` `src/components/SwipeableToDoItem.jsx:99`.
- The revealed button opens a choice dialog rather than a plain confirm: To-Do rows "Remove "{title}"" / "What would you like to do with this item?" `[Implemented]` `src/components/SwipeableToDoItem.jsx:108-113`; event rows "Delete Event?" with "This action cannot be undone." or, for Google-linked events, "This event is synced with Google Calendar. Would you also like to delete it from Google?" `[Implemented]` `src/components/SwipeableEventItem.jsx:150-158`. Option copy belongs to `20-features/daily-schedule` and `20-features/calendar`.

## 3. Double-click / double-tap to edit

- **AR-UI-04** A pointer double-click on an editable row opens its edit dialog `[Implemented]` `src/components/SwipeableToDoItem.jsx:85`, `src/components/SwipeableEventItem.jsx:112`, `src/pages/Tasks.jsx:673`, `src/pages/DailyChecklist.jsx:495,524`, `src/pages/Goals.jsx:381,438,450`, `src/pages/Chores.jsx:850,911`, `src/components/dashboard/DashboardTasks.jsx:86`, `src/components/education/SubjectCard.jsx:169-171` ("Double-click to edit plan"), `src/components/visionboard/PillarManager.jsx:320`. On the Daily Schedule grid a double-click opens an item's notes rather than an editor `[Implemented]` `src/pages/DailySchedule.jsx:742`.
- **AR-UI-05** On touch, two taps on the same row within a window count as a double-tap and open the same editor. Windows in use: 350 ms measured on touch end (To-Do rows) `[Implemented]` `src/components/SwipeableToDoItem.jsx:43-48`; 300 ms measured on touch start (event rows) `[Implemented]` `src/components/SwipeableEventItem.jsx:41-46`; 300 ms measured on click (tasks, checklist items, pillars) `[Implemented]` `src/pages/Tasks.jsx:644-652`, `src/pages/DailyChecklist.jsx:451-456`, `src/components/visionboard/PillarManager.jsx:137-145` (D-320). The Calendar events list keeps a tap handler with no action; the row's own double-tap applies `[Partial]` `src/pages/CalendarPage.jsx:478-488`.
- Described: "Double-tap or double-click any task to edit it inline." `[Described]` `src/components/onboarding/TasksOnboarding.jsx:12`; Vision Board slideshow "Double-click to hide the control bar" `[Described]` `src/components/visionboard/OnboardingDialog.jsx:24`.

## 4. Time pickers

### 4a. TimePicker (12-hour, quarter hours)

- A button showing the value as `hh:mm AM/PM` or the placeholder (default "Pick a time") opens a popover with three columns: **Hour** (12 buttons `12, 01 … 11` in a 3-column grid), **Min** (`:00, :15, :30, :45`), **AM/PM** `[Implemented]` `src/components/TimePicker.jsx:7-8,32-110`.
- Each selection immediately emits a 24-hour `HH:mm` value; a footer shows the current value (or "—") and a "Done" button closes the popover `[Implemented]` `src/components/TimePicker.jsx:19-24,36-38,112-115`. An empty value parses as 12:00 AM for display of the columns `[Implemented]` `src/components/TimePicker.jsx:10-11`.
- Bindings: event edit dialog start and end times `[Implemented]` `src/components/EventEditDialog.jsx:90-94`.

### 4b. ModernTimePicker (24-hour, any minute)

- A button showing the value in 12-hour locale format or "Select time" toggles an inline panel with two scrollable lists: **Hour** `00…23` and **Minute** `00…59`; the panel previews `HH:mm` and offers "Cancel" and "Confirm" `[Implemented]` `src/components/ModernTimePicker.jsx:6-57,59-136`.
- Nothing is emitted until "Confirm"; the initial selection is the current value or `09:00` `[Implemented]` `src/components/ModernTimePicker.jsx:9-22`.
- Bindings: task due time `[Implemented]` `src/pages/Tasks.jsx:450`, `src/components/TaskEditDialog.jsx:196`; scheduled sync times `[Implemented]` `src/pages/Settings.jsx:962`.

## 5. Labels — `LabelPicker` and label history

- **AR-UI-06 — One label vocabulary across features.** The picker is used for tasks `[Implemented]` `src/pages/Tasks.jsx:454`, `src/components/TaskEditDialog.jsx:159`, checklist items `[Implemented]` `src/pages/DailyChecklist.jsx:374,557`, and goals `[Implemented]` `src/pages/Goals.jsx:605,858`, all reading the same device-local history.
- Layout: a "Label" text input (placeholder "e.g. Health") beside a "Color" swatch row; when both are set a "Preview:" pill shows the label on its colour `[Implemented]` `src/components/LabelPicker.jsx:50-123`.
- **Palette:** eleven swatches: no colour (`""`, titled "No color"), `#ef4444`, `#f97316`, `#eab308`, `#22c55e`, `#14b8a6`, `#3b82f6`, `#8b5cf6`, `#ec4899`, `#64748b`, `#a16207` `[Implemented]` `src/components/LabelPicker.jsx:7-10,96-114`. Picking a swatch with a label present saves the pair to history immediately `[Implemented]` `src/components/LabelPicker.jsx:100-106`.
- **History dropdown:** focusing the input lists history entries (colour dot + label); choosing one sets label and colour; a hover "X" (title "Delete label") removes the entry `[Implemented]` `src/components/LabelPicker.jsx:58,65-91`. The list closes 150 ms after blur `[Implemented]` `src/components/LabelPicker.jsx:46`.
- **AR-UI-07 — Case-insensitive normalisation.** Typing a label that matches an existing history entry ignoring case (and is not the entry already being edited) replaces the typed text with the stored casing, adopts its colour, closes the list, and shows "Label already exists — using existing entry." `[Implemented]` `src/components/LabelPicker.jsx:22-38,62-64`.
- **Auto-save on blur:** leaving the input with a non-blank label saves it (trimmed) with the current colour `[Implemented]` `src/components/LabelPicker.jsx:40-47`.
- **History store** (`app_label_history`): most-recent-first, an existing entry with the same label is moved to the front, capped at 30 entries; entries are `{label, color}`; delete removes by exact label; a clear helper exists `[Implemented]` `src/utils/labelHistory.js:1-21`. Feature save paths also push to history when saving a record `[Implemented]` `src/pages/Goals.jsx:303`.
- Described: "The app remembers your recently used labels so you can quickly reapply them." `[Described]` `src/components/onboarding/TasksOnboarding.jsx:17`.

## 6. Category filter (single-select pattern)

- Owned by `20-features/tasks`; recorded here as a pattern. A dropdown button reads the selected value or "Filter by category"; the list shows checkbox-styled rows `[Implemented]` `src/components/CategoryFilter.jsx:37-82`.
- **AR-UI-08** Selection is single: choosing a row replaces the selection, choosing the selected row clears it `[Implemented]` `src/components/CategoryFilter.jsx:21-28`. The selection is echoed as a removable chip with a "Clear" link `[Implemented]` `src/components/CategoryFilter.jsx:85-104`. Clicking outside closes the list `[Implemented]` `src/components/CategoryFilter.jsx:11-19`. The control carries `no-print` `[Implemented]` `src/components/CategoryFilter.jsx:35`.

## 7. Collapse all with per-group exceptions

- **AR-UI-09** A header button toggles between "Collapse all" and "Expand all" (icon flips); individual group toggles are stored as exceptions to the current global state, and flipping the global state clears the exceptions `[Implemented]` `src/pages/Tasks.jsx:70-89,563-565,732`, `src/pages/Chores.jsx:110-111,128-144,1269-1271,955,1001`, `src/pages/Education.jsx:54,994-996,1025,1048`.
- Variants that write an explicit per-group map instead of exceptions: Goals ("collapseAll"/"expandAll" set every goal and sub-section) `[Implemented]` `src/pages/Goals.jsx:191-217,732-736`; Pillars `[Implemented]` `src/components/visionboard/PillarManager.jsx:188-200,253-257`; Menu tab days `[Implemented]` `src/pages/Chores.jsx:105-108,1444-1446`.
- Defaults: Tasks starts collapsed unless the device preference `tasks_default_collapsed` is `"0"` `[Implemented]` `src/pages/Tasks.jsx:70-72` (set from Settings `src/pages/Settings.jsx:141,770`); Chores starts collapsed `[Implemented]` `src/pages/Chores.jsx:111`; Education starts expanded `[Implemented]` `src/pages/Education.jsx:54`. The dashboard Menu & Chores widget remembers per-member collapse in `dashboard_menuchores_collapsed` `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:37-49`.

## 8. First-visit walkthroughs — `GenericOnboardingDialog` mechanics

- **AR-UI-10 — Shape.** A modal whose title follows the pattern "Welcome to {Page}", subtitle "Here's how to get the most out of this page — it only takes a minute!", a list of numbered icon + title + description steps, and one full-width button "Got it — Don't Remind Me Again" `[Implemented]` `src/components/GenericOnboardingDialog.jsx:30-58`. Titles in use: "Welcome to Dashboard" `src/pages/Dashboard.jsx:336`, "Welcome to Daily Checklist" `src/pages/DailyChecklist.jsx:592`, "Welcome to Daily Quotes" `src/pages/Quotes.jsx:309`, "Welcome to Calendar" `src/components/onboarding/CalendarOnboarding.jsx:37` `[Implemented]`. The Vision Board dialog uses "Welcome to Your Vision Board 🌟", subtitle "…it only takes a minute to set up!", and two buttons "Got it — Let's Start with Pillars →" and "Don't remind me again" `[Implemented]` `src/components/visionboard/OnboardingDialog.jsx:13-15,29-35` (D-321).
- Closing the dialog by other means (overlay, Escape) closes without persisting `[Implemented]` `src/components/GenericOnboardingDialog.jsx:31-33`, `src/components/onboarding/CalendarOnboarding.jsx:34`.
- **AR-UI-11 — Two persistence generations.**
  - *Account-synced:* dismissal writes `{storageKey: true}` into the JSON map `ThemeSettings.onboarding_status` (creating the record with `"{}"` when absent) and mirrors `storageKey = "true"` to localStorage `[Implemented]` `src/components/GenericOnboardingDialog.jsx:6-29`. The trigger check reads localStorage first and otherwise the newest `ThemeSettings`; when the flag is absent the dialog opens, when present the local mirror is written `[Implemented]` `src/pages/Tasks.jsx:61-69`, `src/pages/Quotes.jsx:42-50`.
  - *Device-only:* dismissal writes `"1"` to a page key and the trigger is `!localStorage.getItem(key)` `[Implemented]` `src/components/onboarding/CalendarOnboarding.jsx:29-32`, `src/pages/CalendarPage.jsx:46-48,525`, `src/components/onboarding/ChoresOnboarding.jsx:34-37`. The Vision Board writes the same key from both buttons `[Implemented]` `src/pages/VisionBoard.jsx:433-445` (D-323).
- The registry of pages, keys and step text lives in `20-features/onboarding`.

## 9. Header conventions — `HeaderContext` and `Layout`

- **AR-UI-12** Pages publish a title and an optional right-slot element into the shell header and clear both on unmount `[Implemented]` `src/lib/HeaderContext.jsx:1-17`, e.g. `src/pages/Quotes.jsx:25-26`.
- Title text per page: Dashboard → `Good Morning|Afternoon|Evening, {display name or first name}` (before 12:00, before 17:00, otherwise) `src/pages/Dashboard.jsx:154-155`; "Daily Checklist" `src/pages/DailyChecklist.jsx:49`; "Task Manager" `src/pages/Tasks.jsx:42`; "Calendar" `src/pages/CalendarPage.jsx:31`; "Daily Schedule" `src/pages/DailySchedule.jsx:82`; "Chore Manager" `src/pages/Chores.jsx:31`; "Education Manager" `src/pages/Education.jsx:26`; "Goal Manager" `src/pages/Goals.jsx:42`; "Vision Board" `src/pages/VisionBoard.jsx:51`; "Daily Quotes & Reflection" `src/pages/Quotes.jsx:25`; "Link Library" `src/pages/Links.jsx:94`; "Theme Editor" `src/pages/ThemeEditor.jsx:62`; "Settings" `src/pages/Settings.jsx:109`; "User Manual" `src/pages/UserManual.jsx:468` `[Implemented]`.
- **Right slot:** every page with a walkthrough places an icon button titled "Guide" (help-circle) that reopens its walkthrough `[Implemented]` `src/pages/Tasks.jsx:43`, `src/pages/CalendarPage.jsx:61`, `src/pages/DailySchedule.jsx:83`, `src/pages/Chores.jsx:32`, `src/pages/Education.jsx:27`, `src/pages/Goals.jsx:43`, `src/pages/VisionBoard.jsx:52`, `src/pages/Quotes.jsx:26`, `src/pages/Links.jsx:95`, `src/pages/DailyChecklist.jsx:65`. The Dashboard keeps its Guide button in the page body (see `20-features/dashboard`).
- **Live clock:** under the title the header shows `EEE, MMM d · h:mm a`, refreshed every second `[Implemented]` `src/components/Layout.jsx:60-63,234-236`.
- The header is sticky, carries `no-print`, and on small screens shows a hamburger ("Open menu") at left and reserves space at right when no slot content exists `[Implemented]` `src/components/Layout.jsx:220-245`.

## 10. Sidebar

- The sidebar title reads "Dash it, Dash it ALL!" `[Implemented]` `src/components/Layout.jsx:169-171`.
- **Desktop:** a chevron toggles between full width (labels) and icon-only; the state is in memory only `[Implemented]` `src/components/Layout.jsx:31,163,173-178,207-211`.
- **Mobile:** the hamburger opens an off-canvas drawer with a dark overlay; tapping the overlay, the close "X", or any nav link closes it `[Implemented]` `src/components/Layout.jsx:65-69,150-157,179-184,201`.
- Items and order: Dashboard, Daily Checklist, Tasks, Calendar, Daily Schedule, Chores, Education, Goals, Vision Board, Daily Quotes, Link Library, Theme Editor, Settings, User Manual `[Implemented]` `src/components/Layout.jsx:12-27`. Chores, Education and Vision Board are hidden when the matching feature toggle is off; toggles arrive live through a `featuresToggled` window event `[Implemented]` `src/components/Layout.jsx:33,51-58,189-194`. The active route is highlighted `[Implemented]` `src/components/Layout.jsx:196,204-206`.

## 11. Swipe between pages

- **AR-UI-13** On the main content area a touch that ends more than 50 px left of where it began navigates to the next visible nav item; more than 50 px right navigates to the previous; the order wraps at both ends `[Implemented]` `src/components/Layout.jsx:116-146`. Vertical-dominant gestures are ignored `[Implemented]` `src/components/Layout.jsx:120`. "Visible" excludes items hidden by feature toggles `[Implemented]` `src/components/Layout.jsx:127-132`.
- **Suppression.** The swipe is ignored when a daily evaluation is in progress (`window.__evalInProgress`, set while the evaluation wizard is active and cleared on save) `[Implemented]` `src/components/Layout.jsx:76`, `src/components/visionboard/DailyEvaluation.jsx:33-36,187`; when an input, textarea or select has focus; when any dialog is open; when a range input is focused; or when the touch started or ended on a slider `[Implemented]` `src/components/Layout.jsx:74-88,90-98,110-114`.

## 12. Lists update live

- **AR-UI-14** Screens subscribe to entity change events and reload themselves, so a change made elsewhere (another tab, a sync job, an automation) appears without a manual refresh. Subscriptions observed: Tasks page (`Task`, 500 ms debounce) `[Implemented]` `src/pages/Tasks.jsx:125-138`; Calendar page (`ScheduleItem`, immediate) `[Implemented]` `src/pages/CalendarPage.jsx:67-72`; Daily Schedule (`ScheduleItem` and `Task` immediate; `Chore`, `Goal`, `EducationPlan`, `EducationActivity`, `GoalTask` after 500 ms, during which deleted source ids have their orphaned schedule items removed) `[Implemented]` `src/pages/DailySchedule.jsx:159-196`; Daily To-Do (`ScheduleItem`, `Task`, `GoalTask`, 300 ms, paused while it is itself writing) `[Implemented]` `src/components/DailyToDo.jsx:87-105`; dashboard Goals widget (`Goal`, 1 s debounce and at most one reload per 2 s) `[Implemented]` `src/components/dashboard/DashboardGoals.jsx:79-98`; dashboard Menu & Chores widget (`Chore`, 300 ms delay, at most one reload per 800 ms unless forced) `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:51-77`.
- Described: Dashboard onboarding "Items update live as you complete them throughout the day." `[Described]` `src/pages/Dashboard.jsx:48`.

## 13. Shared copy

| Where | Copy | Citation |
|---|---|---|
| Delete confirm (list rows) | "Delete Item?" / "This action cannot be undone." / "Cancel" / "Delete" | `src/components/SwipeableListItem.jsx:126-135` |
| Bulk delete confirm (Chores) | "Delete {n} Chore(s)?" / "This action cannot be undone." | `src/pages/Chores.jsx:1627-1631` |
| Label duplicate | "Label already exists — using existing entry." | `src/components/LabelPicker.jsx:63` |
| Walkthrough subtitle | "Here's how to get the most out of this page — it only takes a minute!" | `src/components/GenericOnboardingDialog.jsx:38` |
| Walkthrough dismiss | "Got it — Don't Remind Me Again" | `src/components/GenericOnboardingDialog.jsx:54` |
| Export sent | "Sent to your email!" | `src/lib/printUtils.js:23` |
| Time picker placeholders | "Pick a time" / "Select time" | `src/components/TimePicker.jsx:32`, `src/components/ModernTimePicker.jsx:31` |
| Category filter | "Filter by category" / "Clear" | `src/components/CategoryFilter.jsx:47,101` |

## 14. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `app_label_history` | Array of `{label, color}`, newest first, max 30 | `[]` | label blur, swatch pick, feature saves `src/utils/labelHistory.js:7-12` | delete entry `src/utils/labelHistory.js:18-21`; `clearLabelHistory` (no caller observed) |
| `tasks_default_collapsed` | Tasks groups start collapsed unless `"0"` | collapsed | Settings toggle `src/pages/Settings.jsx:770` | never |
| `dashboard_menuchores_collapsed` | Per-member collapse map on the dashboard widget | `{}` | collapsing a member `src/components/dashboard/DashboardMenuChores.jsx:43-49` | never |
| `<page>_onboarded` / `goals_onboarding_done` | Walkthrough dismissed (`"1"` device-only, `"true"` mirrored) | unset | dismiss buttons (§8) | never |

## 15. Discrepancies and open questions

- **D-320** Double-tap windows differ: 350 ms on touch end (`src/components/SwipeableToDoItem.jsx:45`) versus 300 ms on touch start (`src/components/SwipeableEventItem.jsx:43`) and 300 ms on click (`src/pages/Tasks.jsx:647`, `src/pages/DailyChecklist.jsx:454`, `src/components/visionboard/PillarManager.jsx:141`).
- **D-321** Walkthrough subtitle and dismiss copy differ on the Vision Board (`src/components/visionboard/OnboardingDialog.jsx:13-15,29-35`) from the shared dialog (`src/components/GenericOnboardingDialog.jsx:36-55`).
- **D-322** Tasks onboarding says "Swipe left on any task to delete it." (`src/components/onboarding/TasksOnboarding.jsx:27`); task rows reveal delete by long press or hover (`src/components/SwipeableListItem.jsx:17-44`).
- **D-323** The Vision Board dialog distinguishes "Got it — Let's Start with Pillars →" from "Don't remind me again" (`src/components/visionboard/OnboardingDialog.jsx:30-35`), while the page persists the dismissal key for both (`src/pages/VisionBoard.jsx:433-445`).
- **Q-320** (§3) Is one double-tap window intended across rows?
- **Q-321** (§10) Is the desktop sidebar collapsed state intended to persist across sessions?
