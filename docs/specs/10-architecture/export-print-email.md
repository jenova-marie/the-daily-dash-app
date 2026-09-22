# Export: Print and Email — Architecture Spec

**Area code:** `EXPORT` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 58 · Described 6 · Partial 4

**Sources owned:** `src/components/WidgetCard.jsx` (incl. generic print/email), `src/lib/printUtils.js`, `src/components/PrintRangeDialog.jsx`
**Sources referenced (owned elsewhere):** `src/components/PrintFormatCalendar.jsx`, `PrintFormatTasks.jsx`, `PrintFormatTasksByDay.jsx`, `PrintFormatDailySchedule.jsx`, `PrintFormatChores.jsx`, `PrintFormatEducation.jsx` (content owned by their features; structure summarised in §5) · export triggers inside `src/pages/Tasks.jsx`, `CalendarPage.jsx`, `DailySchedule.jsx`, `Chores.jsx`, `Education.jsx`, `Goals.jsx`, `Quotes.jsx`, `VisionBoard.jsx`, `src/components/DailyToDo.jsx`, `src/components/dashboard/DashboardTasks.jsx`, `DashboardSchedule.jsx` → their feature specs

**Permissions:** per-user data; email always goes to the signed-in account owner (§1).

## 0. Scope

**Export** (glossary) means printing or emailing a formatted view. The prototype has no file download, no share sheet and no third-party recipient. Every export produces HTML; print opens it in a new browser window and calls the browser's print dialog, and email sends the same HTML to the account owner's own address.

## 1. Architecture rules

- **AR-EXPORT-01 — Email is a print channel, not a sharing channel.** Every email export resolves the recipient as the signed-in user's email and never asks for an address `[Implemented]` `src/lib/printUtils.js:19-22`, `src/components/WidgetCard.jsx:21-26`, `src/pages/Tasks.jsx:577-582`, `src/pages/Chores.jsx:708,763-767`, `src/pages/Education.jsx:609-614`, `src/pages/Goals.jsx:331,752-757`, `src/pages/Quotes.jsx:151-155`, `src/pages/VisionBoard.jsx:293-298`, `src/pages/DailySchedule.jsx:606-611`, `src/components/DailyToDo.jsx:237-242`. The Quotes page keeps unused state for an email address dialog `[Partial]` `src/pages/Quotes.jsx:31-33`.
- **AR-EXPORT-02 — Print and email share one rendering per surface, differing only in channel.** In the structured tier the same component is rendered for both `[Implemented]` `src/lib/printUtils.js:4-24`; in the generic tier the same card body is used `[Implemented]` `src/components/WidgetCard.jsx:7-28`. Exceptions where the two channels build different documents are recorded in §3 (D-312).
- **AR-EXPORT-03 — Confirmation is a plain alert.** After a successful send the text is "Sent to your email!" `[Implemented]` `src/lib/printUtils.js:23`, `src/components/WidgetCard.jsx:27`, `src/pages/Tasks.jsx:583`, `src/pages/Chores.jsx:768`, `src/pages/Education.jsx:615`, `src/pages/VisionBoard.jsx:299`, `src/pages/DailySchedule.jsx:612`, `src/components/DailyToDo.jsx:243`; the Goals cards say "Goals sent to your email!" `[Implemented]` `src/pages/Goals.jsx:758`; the Quotes page shows nothing `[Implemented]` `src/pages/Quotes.jsx:167`.
- **AR-EXPORT-04 — Print opens a new window.** The HTML is written into a blank `_blank` window, the document is closed, and the print dialog is requested `[Implemented]` `src/lib/printUtils.js:6-16` (after a 300 ms delay and focusing the window), `src/components/WidgetCard.jsx:11-14`, `src/pages/Tasks.jsx:568-571`, `src/pages/Chores.jsx:631-699`, `src/pages/Education.jsx:349-472`, `src/pages/Goals.jsx:741-744`, `src/pages/Quotes.jsx:183-194`, `src/pages/VisionBoard.jsx:277-280`, `src/pages/DailySchedule.jsx:591-594`, `src/components/DailyToDo.jsx:229-232`. When the window is blocked, the structured tier does nothing `[Implemented]` `src/lib/printUtils.js:7`.
- **AR-EXPORT-05 — Controls carrying `no-print` are excluded from print output.** The structured wrapper hides `.no-print` `[Implemented]` `src/lib/printUtils.js:11`; every `PrintFormat*` component repeats that rule `[Implemented]` `src/components/PrintFormatCalendar.jsx:92`, `PrintFormatTasks.jsx:122-127`, `PrintFormatTasksByDay.jsx:114`, `PrintFormatDailySchedule.jsx:150-155`, `PrintFormatChores.jsx:77-84`, `PrintFormatEducation.jsx:93-100`; the app header and export button groups carry `no-print` `[Implemented]` `src/components/Layout.jsx:220`, `src/pages/Tasks.jsx:562`.
- **AR-EXPORT-06 — Export reflects the current filter.** Each surface exports what the active filters show (details per surface in §3); none exports hidden data except where noted.

## 2. The three tiers

### Tier A — generic card body (innerHTML)

- `WidgetCard` is the universal card shell: a title bar with an optional `headerRight` slot and a body whose DOM `id` is the `id` prop `[Implemented]` `src/components/WidgetCard.jsx:30-47`.
- It defines a generic print handler (new window titled with the card title, body font Inter, 24 px padding, body = the card body's `innerHTML`) and a generic email handler (subject = card title, body = the card body's `innerHTML`, to the signed-in user, alert "Sent to your email!"), each deferring to `onPrint` / `onEmail` props when supplied `[Implemented]` `src/components/WidgetCard.jsx:6-28`.
- The shell renders no print or email control of its own and no caller passes `onPrint` or `onEmail` `[Partial]` `src/components/WidgetCard.jsx:30-47` (repository-wide search for `onPrint=` / `onEmail=`: none) (D-310).
- The same innerHTML approach is used inline by two surfaces: the Vision Board Weekly Review card (`id="weekly-review-content"`) `[Implemented]` `src/pages/VisionBoard.jsx:268,274-300`, and each Goals timeframe card (`id="goals-{timeframe}"`) `[Implemented]` `src/pages/Goals.jsx:730,737-761`.

### Tier B — structured component (static markup)

- `printComponent(title, component)` renders a React element to static HTML and prints it inside a wrapper: `<title>` = title, body font Arial/Helvetica, zero margin, colour `#111`, exact print colours, `.no-print` hidden `[Implemented]` `src/lib/printUtils.js:4-17`.
- `emailComponent(subject, component)` renders the same element and emails it to the signed-in user with the given subject, then alerts "Sent to your email!" `[Implemented]` `src/lib/printUtils.js:19-24`.
- Three surfaces call these helpers (Calendar page, Dashboard schedule widget, Dashboard tasks widget) and three more render the same `PrintFormat*` components to static markup inline without the wrapper styles (Tasks page, Daily Schedule page, Daily To-Do widget) `[Implemented]` `src/pages/CalendarPage.jsx:57-58`, `src/components/dashboard/DashboardSchedule.jsx:71-72`, `src/components/dashboard/DashboardTasks.jsx:131-132`, `src/pages/Tasks.jsx:567,576`, `src/pages/DailySchedule.jsx:588-590,603-605`, `src/components/DailyToDo.jsx:220-225`.

### Tier C — ad-hoc HTML builders

- Chores (print and email), Education (print and email), Goals (page-level, unbound) and Quotes (print and email) assemble HTML strings by hand `[Implemented]` `src/pages/Chores.jsx:604-700,706-769`, `src/pages/Education.jsx:305-473,475-616`, `src/pages/Goals.jsx:310-349`, `src/pages/Quotes.jsx:150-168,182-195`.
- `PrintFormatChores` is imported by the Chores page but never rendered `[Partial]` `src/pages/Chores.jsx:20` (no `<PrintFormatChores` usage), and `PrintFormatEducation` is not imported anywhere `[Partial]` `src/components/PrintFormatEducation.jsx:1` (D-314).

## 3. Surface inventory

| Surface | Control (title attr) | Tier | Format | Options dialog | Included | Excluded | Print title / email subject |
|---|---|---|---|---|---|---|---|
| Tasks page card header | "Print tasks", "Email tasks" `src/pages/Tasks.jsx:566-586` | B (inline) | `PrintFormatTasks`, grouped by label when sort is "label", else by priority | none | the task list loaded for the active status filter `src/pages/Tasks.jsx:567` | the label chip / selected-label filter applied only on screen `src/pages/Tasks.jsx:596-598` | "Tasks" / "Task List" |
| Calendar page, calendar card | "Print calendar", "Email calendar" `src/pages/CalendarPage.jsx:244-247` | B | `PrintFormatCalendar` | `PrintRangeDialog`, defaulting to the visible month or week `src/pages/CalendarPage.jsx:244,513-521` | schedule items whose date lies in the range `src/pages/CalendarPage.jsx:55` | items outside the loaded set | "Calendar ({start} → {end})" or "Calendar ({date})" `src/pages/CalendarPage.jsx:56` |
| Calendar page, events card | "Print events", "Email events" `src/pages/CalendarPage.jsx:453-456` | B | `PrintFormatCalendar` | `PrintRangeDialog`, defaulting to the selected date | same as above | same | "Events (…)" `src/pages/CalendarPage.jsx:56` |
| Dashboard "Today's Schedule" widget | "Print schedule", "Email schedule" `src/components/dashboard/DashboardSchedule.jsx:77-80` | B | `PrintFormatCalendar` | `PrintRangeDialog`, default today `src/components/dashboard/DashboardSchedule.jsx:60,102-110` | items in range with source type `calendar` or `event`, not removed from app, with a start time `src/components/dashboard/DashboardSchedule.jsx:64-69` | task/chore/education/goal/custom items; all-day items | "Daily Schedule (…)" `src/components/dashboard/DashboardSchedule.jsx:70` |
| Dashboard "TODAY'S TASKS" widget | "Print tasks", "Email tasks" `src/components/dashboard/DashboardTasks.jsx:137-140` | B | `PrintFormatTasksByDay` | `PrintRangeDialog`, default today `src/components/dashboard/DashboardTasks.jsx:121-124,184-192` | pending tasks with a due date inside the range (500 most recent) `src/components/dashboard/DashboardTasks.jsx:128-129` | tasks without a due date; completed tasks | "Tasks (…)" `src/components/dashboard/DashboardTasks.jsx:130` |
| Daily Schedule page card header | "Print schedule", "Email schedule" `src/pages/DailySchedule.jsx:586-615` | B (inline) | `PrintFormatDailySchedule` mode `both` or `schedule` | browser confirm (§4c) | grid items for the selected date plus, when confirmed, the To-Do items the widget reported `src/pages/DailySchedule.jsx:589,604,805` | items dismissed from the grid (§5d) | "Daily Schedule" / "Daily Schedule" |
| Daily To-Do widget | "Print", "Email" `src/components/DailyToDo.jsx:266-271` | B (inline) | `PrintFormatDailySchedule` mode `todo` | none | the widget's current items `src/components/DailyToDo.jsx:220-225` | the hourly section | "To Do" / "Daily To Do" |
| Chores page, chores tab | "Print chores", "Email chores" `src/pages/Chores.jsx:1272-1277` | C | hand-built (§3a) | print: note prompt (§4b); email: none | the filtered chore list (member and status filters; meals excluded) `src/pages/Chores.jsx:590-596,608,707` | meals | "Weekly Chore Schedule" / "Weekly Chore Schedule" or "{member}'s Chores" `src/pages/Chores.jsx:599-602,609,765` |
| Chores page, Menu tab | "Print meal schedule" `src/pages/Chores.jsx:1447` (no email) | C | hand-built by weekday (§3a) | note prompt | meals, optionally for the selected member `src/pages/Chores.jsx:606-607` | non-meal chores; completed-state filter is not applied | "Weekly Meal Schedule" |
| Education page card header (when a learner is active) | "Print education schedule", "Email education schedule" `src/pages/Education.jsx:927-938` | C | hand-built (§3b) | none | plans and activities for the visible learner(s), subject filter and status filter `src/pages/Education.jsx:307-327,476-494` | learners hidden by the filter | "Weekly Education Schedule" or "{learner} - Weekly Education Schedule" `src/pages/Education.jsx:308-310,477-479` |
| Goals page, each timeframe card | "Print goals", "Email goals" `src/pages/Goals.jsx:737-761` | A | card body innerHTML under an `<h2>` label | none | whatever the card currently renders, including collapsed state | other timeframes | "All {Timeframe} Goals" or "{member}'s {Timeframe} Goals" `src/pages/Goals.jsx:738,749` |
| Goals page (page-level builder) | none bound | C | hand-built list of filtered goals with timeframe, description, target date, progress %, milestone lines `src/pages/Goals.jsx:310-349` | none | `filteredGoals` | — | "All Goals" / "{member}'s Goals" `[Partial]` (D-311) |
| Quotes page, "Today's Reflection" card | "Email reflection", "Print reflection" `src/pages/Quotes.jsx:237-246` | C | quote + author + "My Reflection" (§3c) | none | today's quote and the reflection text as typed (unsaved edits included) `src/pages/Quotes.jsx:152,242` | — | "Daily Reflection" / "Daily Reflection — {date}" `src/pages/Quotes.jsx:156` |
| Quotes page, favourited and past quote rows | "Email quote", "Print quote" `src/pages/Quotes.jsx:273-278,338-343` | C | same as above with that quote's saved reflection | none | that quote | — | as above |
| Vision Board, Weekly Review card | "Print review", "Email review" (share icon) `src/pages/VisionBoard.jsx:268-305` | A | card body innerHTML | none | the review as rendered for the selected week | — | "Weekly Review" / "Weekly Review - {MMM d, yyyy}" `src/pages/VisionBoard.jsx:278,296` |

### 3a. Chores builders

- **Print** `[Implemented]` `src/pages/Chores.jsx:604-700`: heading `Weekly Chore Schedule` or `Weekly Meal Schedule`, a "Generated: {long date}" line, and the optional note in italics. Chores: one section per household member (members with no chores omitted) → sub-groups `Daily, Weekly, Bi-Weekly, Monthly` → rows with a checkbox, title, description, and right-aligned room, `{n}min`, and abbreviated days. Meals: one section per weekday Monday…Sunday listing daily meals plus meals scheduled on that day, with room (meal slot), minutes and assignee.
- **Email** `[Implemented]` `src/pages/Chores.jsx:706-769`: heading "Weekly Chore Schedule" (or "Weekly Meal Schedule" when the status filter is `meals`, a value the chores tab pills do not offer) `[Partial]` `src/pages/Chores.jsx:713,752-753` (D-313); "Generated:" line; then one section per weekday containing daily chores and weekly chores assigned to that day, each with checkbox, title, description, "Person:", "Room:" and "Time:" lines. Bi-weekly and monthly chores do not appear (D-312). The subject is "Weekly Chore Schedule" or "{member}'s Chores" `[Implemented]` `src/pages/Chores.jsx:599-602,765`.

### 3b. Education builders

Print and email produce the same structure `[Implemented]` `src/pages/Education.jsx:305-473,475-616`: title, "Generated:" line, then **Learning Plans** (title, description, Materials, Target Date, Notes), **Daily Activities**, **Weekly Activities** grouped under full weekday headings (short day codes mapped to Monday…Sunday), **One-Time Activities** (with "Due:"), and **Other Activities** (Bi-Weekly / Monthly label and "Next Due:"). Every activity line carries a checkbox. The activity set honours the status pills: Due, Past, Next (due within 7 days), Done (completed one-time), All `[Implemented]` `src/pages/Education.jsx:318-322,485-489,621-633`.

### 3c. Quotes builders

Print `[Implemented]` `src/pages/Quotes.jsx:182-195` and email `[Implemented]` `src/pages/Quotes.jsx:150-168` both produce: heading "Daily Reflection", the quote in a block quote, "— {author}", a rule, heading "My Reflection", the reflection text or "No reflection written.", and the quote date (falling back to today's long date). For today's quote the reflection text is taken from the editor, so unsaved edits are exported `[Implemented]` `src/pages/Quotes.jsx:152,242`.

## 4. Options dialogs

### 4a. PrintRangeDialog

- A small dialog whose title is supplied by the caller: "Print — Select Date Range" or "Email — Select Date Range" `[Implemented]` `src/components/PrintRangeDialog.jsx:8,26-30`, `src/pages/CalendarPage.jsx:516`, `src/components/dashboard/DashboardSchedule.jsx:105`, `src/components/dashboard/DashboardTasks.jsx:187`.
- Field label "Date Range": two native date inputs separated by "to", pre-filled from the caller's defaults each time the dialog opens `[Implemented]` `src/components/PrintRangeDialog.jsx:12-17,32-39`.
- One full-width confirm button labelled "Email" (mail icon) in email mode or "Print" (printer icon) otherwise; disabled until both dates are set; confirming passes `(start, end)` to the caller and closes the dialog `[Implemented]` `src/components/PrintRangeDialog.jsx:19-23,40-46`. No validation that start ≤ end is performed `[Implemented]` `src/components/PrintRangeDialog.jsx:19-21`.
- Defaults by caller: Calendar card → first/last day of the visible month, or the visible week's start/end in week view `[Implemented]` `src/pages/CalendarPage.jsx:244,247`; Calendar events card → the selected date for both `[Implemented]` `src/pages/CalendarPage.jsx:453,456`; Dashboard widgets → today for both `[Implemented]` `src/components/dashboard/DashboardSchedule.jsx:60`, `src/components/dashboard/DashboardTasks.jsx:121-124`.

### 4b. Chore print note prompt

- Pressing print on either Chores tab opens "Add a Note to Print" with a textarea labelled "Custom Note (optional)" (placeholder "e.g. Week of June 9 • Great job everyone!"), "Cancel" and "Print" `[Implemented]` `src/pages/Chores.jsx:702-704,1597-1622`.
- The note is remembered on the device in `last_chore_print_note` and pre-filled next time `[Implemented]` `src/pages/Chores.jsx:124,605`. It is rendered as an italic line under the "Generated:" line `[Implemented]` `src/pages/Chores.jsx:635-637`.

### 4c. Daily Schedule confirm

- Print asks `Print Schedule + To Do together?\n\nOK = Both together\nCancel = Schedule only`; email asks `Email Schedule + To Do together?\n\nOK = Both together\nCancel = Schedule only`. OK exports mode `both`, Cancel exports `schedule` `[Implemented]` `src/pages/DailySchedule.jsx:596-597,602-604`.

## 5. PrintFormat* content structure (summary; content owned by features)

### 5a. PrintFormatCalendar — `src/components/PrintFormatCalendar.jsx`

- Title (prop), "Generated: {long date} · {n} event(s)" `[Implemented]` `:44-47`. Empty state "No events to display." `[Implemented]` `:50`.
- Grouped by date ascending; each day heading is the long weekday date with a count; rows sorted by start time (missing times last) `[Implemented]` `:25-32,52-61`.
- Columns: time (12-hour, `→ end`), title with notes beneath, and a source badge `Calendar, Event, Task, Education, Chore, Goal, Custom` coloured blue `#3b82f6`, blue `#2563eb`, green `#10b981`, purple `#a855f7`, amber `#f59e0b`, grey `#6b7280` (goal falls back to grey) `[Implemented]` `:14-22,64-83`. Items removed from app are rendered at half opacity `[Implemented]` `:65`.

### 5b. PrintFormatTasks — `src/components/PrintFormatTasks.jsx`

- Title "Task List", "Generated: {date} · {n} active task(s)" `[Implemented]` `:85-90`.
- Active tasks grouped by label (alphabetical, "(No Label)" last) or by priority in order Urgent, High, Medium, Low (empty groups omitted, unknown priority counted as Medium) `[Implemented]` `:12-36`.
- Row: a square checkbox (filled when completed), title (struck through when completed), description, "↻ {recurrence pattern}" for recurring tasks, and right-aligned "Due: {Mon d}", due time, and the label in its colour `[Implemented]` `:43-81`.
- A dimmed "Completed ({n})" section lists completed tasks `[Implemented]` `:107-120`.

### 5c. PrintFormatTasksByDay — `src/components/PrintFormatTasksByDay.jsx`

- Title (prop), "Generated: … · {n} task(s)"; only non-completed tasks `[Implemented]` `:18,72-76`. Empty state "No tasks to display." `[Implemented]` `:79`.
- Grouped by due date ascending under long weekday headings, then a "No Due Date" group `[Implemented]` `:20-31,82-110`.
- Row: empty checkbox, title, description, recurrence line, right-aligned 12-hour time, priority label coloured `urgent #dc2626, high #f97316, medium #eab308, low #16a34a`, and label in its colour `[Implemented]` `:14-15,41-69`.

### 5d. PrintFormatDailySchedule — `src/components/PrintFormatDailySchedule.jsx`

- Title "Daily Schedule" and the long date `[Implemented]` `:17-19,49-54`. Modes `schedule`, `todo`, `both` `[Implemented]` `:31-32`.
- **Hourly Schedule ({n} items)**: items with a start time and not dismissed from the grid, sorted by start time; columns Time, Item, Type; priority dot before the title using the same four colours; completed rows at half opacity, struck through, with "✓ Done"; source labels map `calendar` and `event` both to "Calendar" `[Implemented]` `:9-14,21-23,56-105`. Empty: "No scheduled items for this day." `[Implemented]` `:65`.
- **To Do ({n} items)**: sorted by start time (missing last); checkbox filled when completed; time, title with priority dot, notes, source label `[Implemented]` `:25-29,107-148`. Empty: "No to-do items for this day." `[Implemented]` `:116`.

### 5e. PrintFormatChores — `src/components/PrintFormatChores.jsx` (not rendered, see D-314)

- Title "Weekly Chore Schedule", "Generated:" line; one section per household member with chores, sub-grouped Daily, Weekly, Bi-Weekly, Monthly; rows with a checkbox, title, description, room, "{n}min", and per-day mini checkboxes labelled with the first two letters of each scheduled day `[Implemented]` `:1-75`.

### 5f. PrintFormatEducation — `src/components/PrintFormatEducation.jsx` (not rendered, see D-314)

- Title "{learner} - {subject}", "Generated:" line; **Learning Plans** (title, description, Materials, Target Date, Notes) then **Activities & Assignments** split into "Assignments" and "Activities", each sub-grouped One-Time, Daily, Weekly, Biweekly, Monthly, rows with checkbox, title, notes, "Due:" and "Days:" `[Implemented]` `:1-91`.

## 6. Described claims

- User Manual: "Use the Print or Email icons in the widget header to export your schedule." `[Described]` `src/pages/UserManual.jsx:151`; "Use the print or email icons to export your daily schedule." `[Described]` `src/pages/UserManual.jsx:174`; "Export reflections via print or email using the icons in the widget header." `[Described]` `src/pages/UserManual.jsx:336`; Weekly Review "Print or email your review." `[Described]` `src/pages/UserManual.jsx:370`.
- Onboarding: Calendar step 4 "Use the print or email icons in the widget header to export your calendar for any date." `[Described]` `src/components/onboarding/CalendarOnboarding.jsx:24`; Quotes step 4 "Use the email button to send the quote and your reflection to yourself or others. Use the print button for a physical copy to keep in a journal. Both include the full quote text and your personal reflection." `[Described]` `src/pages/Quotes.jsx:20` (the "or others" wording versus AR-EXPORT-01 is logged as D-315).

## 7. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `last_chore_print_note` | Last note typed into the chore print prompt | `""` | confirming the chore print prompt `src/pages/Chores.jsx:605` | never |

## 8. Discrepancies and open questions

- **D-310** `WidgetCard` implements generic print and email handlers but renders no control that invokes them, and no caller supplies `onPrint`/`onEmail` (`src/components/WidgetCard.jsx:6-47`).
- **D-311** The Goals page defines page-level print and email builders that are not bound to any control (`src/pages/Goals.jsx:310-349`); the bound controls are the per-timeframe innerHTML exports (`src/pages/Goals.jsx:737-761`).
- **D-312** Chores print groups by household member then frequency and includes all frequencies (`src/pages/Chores.jsx:666-694`); Chores email groups by weekday and includes only daily and weekly chores (`src/pages/Chores.jsx:722-761`).
- **D-313** The Chores email builder branches on a `meals` status filter and "Chef:"/"Type:" labels (`src/pages/Chores.jsx:713,752-753`) while the Menu tab offers print only (`src/pages/Chores.jsx:1447-1454`).
- **D-314** `PrintFormatChores` (`src/pages/Chores.jsx:20`) and `PrintFormatEducation` (`src/components/PrintFormatEducation.jsx`) exist beside hand-built exports that produce different layouts (`src/pages/Chores.jsx:604-700`, `src/pages/Education.jsx:305-473`).
- **D-315** Quotes onboarding says email can send "to yourself or others" (`src/pages/Quotes.jsx:20`); every email is addressed to the signed-in user (`src/pages/Quotes.jsx:151-155`).
- **Q-310** (§2, Tier A) Is generic print/email intended to be surfaced on every widget card, or only on the surfaces that bind it inline?
- **Q-311** (§3, Goals) Which Goals export is intended as the product behaviour: per-timeframe card export, the unbound page-level builder, or both?
- **Q-312** (§3, Tasks) Is the Tasks page export intended to honour the label filter that is applied on screen?
