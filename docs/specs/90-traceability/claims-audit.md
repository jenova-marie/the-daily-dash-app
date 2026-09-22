# Claims Audit — User Manual, landing page and sign-up copy → spec

**Area:** `TRACE` · **Status:** complete · **Companion:** `coverage-matrix.md`, `00-overview/product-vision.md` §4 (section-level ledger)

Every user-facing promise in `src/pages/UserManual.jsx` (all fourteen sections, every `<p>` and `<li>`, plus the
page's own copy), every element of `src/pages/LandingPage.jsx`, and the sign-up integration-choice copy in
`src/pages/Auth.jsx` is listed with the spec anchor that specifies it, the evidence tag the spec assigns to the
behaviour behind the claim, and the `D-` entry when the spec logs a divergence between the copy and the code.

**How to read a row.**
- **Claim** — the copy, verbatim or shortened; `UserManual.jsx:NNN` is the line. A suffix letter (`372a`) splits one
  line into sub-claims that the specs tag differently.
- **Spec anchor** — the section or rule id that owns the behaviour. Paths are relative to `docs/specs`;
  `tasks §4.2` means `20-features/tasks/spec.md` §4.2, `tasks/recurrence §3` the Level 2 file.
- **Tag** — as the owning spec records the behaviour: `[Implemented]` the code does what the copy says (naming or
  placement differences are noted with a `D-`); `[Described]` the copy has no implementing code, or the code does
  something else and the spec keeps both; `[Partial]` a component or field exists but is not wired end to end.
- **D-** — the discrepancy id(s) the spec opened; full text in `discrepancy-log.md`.
- **UNMAPPED** never appears in the final table: the four claims that had no anchor in any spec were mapped here
  (marked *mapped by audit*) and are listed in the "Mappings added by this audit" section.

## Summary

| Count | Value |
|---|---|
| Claims total | 207 |
| User Manual claims (14 sections + page copy) | 182 |
| Landing page claims | 18 |
| Sign-up integration-choice claims | 7 |
| `[Implemented]` | 174 |
| `[Described]` | 45 |
| `[Partial]` | 11 |
| Unmapped (target 0) | 0 — four claims had no spec anchor; mappings added below |
| Rows carrying a `D-` id | 106 |

Tag counts exceed the row total because a row that splits a claim into differently tagged parts carries more than one tag.

Counts are by row (sub-claims counted separately). A row whose behaviour is implemented but whose wording,
naming or placement differs is counted under its leading tag `[Implemented]` and carries the `D-` id; a row is
`[Described]` only when the copy names behaviour with no implementing code path (the closing table lists all of
these). `[Partial]` marks a control, field or component that exists without being wired end to end. The section-level "dominant tag" view is in
`00-overview/product-vision.md` §4; this audit is consistent with it: every section the ledger marks
`[Implemented]` has a majority of `[Implemented]` rows here, and the two landing blurbs the ledger marks
`[Partial]` (Google Integration, Private & Secure) are `[Partial]`/`[Described]` here.

---

## Part A — User Manual (`src/pages/UserManual.jsx`)

### A.1 App Overview (`overview`, lines 7-19)

| # | Claim (line) | Spec anchor | Tag | D- |
|---|---|---|---|---|
| 1 | "**Dash it, Dash it ALL!** is a personal productivity dashboard designed to keep your whole life organized in one place. It brings together your schedule, tasks, chores, education plans, goals, daily checklist, motivational quotes, and saved links — all with optional Google Calendar and Google Tasks sync." (14) | `user-manual` §1 (quoted); `app-shell` §0.2 (fourteen sections); `arch/schedule-hub` AR-HUB-01; `arch/google-sync` AR-SYNC-01 | `[Described]` as copy; the sections and sync exist `[Implemented]` | D-952 (five product names) |
| 2 | "Use the **sidebar** on the left to navigate between sections. On mobile, tap the hamburger menu (☰) in the top-left to open the sidebar." (15) | `app-shell` §4 "Mobile drawer", BR-SHELL-15 | `[Implemented]` (the button is titled "Open menu") | — |
| 3 | "The sidebar can be **collapsed** to icon-only mode on desktop by clicking the arrow (‹) at the top of the sidebar." (16) | `app-shell` §4 "Desktop collapse" | `[Implemented]` (memory only; Q-321 asks whether persistence is intended) | — |

### A.2 Dashboard (`dashboard`, lines 20-74)

| # | Claim (line) | Spec anchor | Tag | D- |
|---|---|---|---|---|
| 4 | "The Dashboard is your home base — a customizable summary of everything happening today with real-time updates across all your data sources." (27) | `dashboard` §1, BR-DASH-03/04 (order), BR-DASH-10 (page loads once; widgets refresh on their own subscriptions, AR-UI-14) | `[Implemented]` | — |
| 5 | "Click the **⇅ reorder icon** in the top-right to drag and rearrange any widget into your preferred order." (32) | `dashboard` §4.3 reorder mode, BR-DASH-04 | `[Implemented]` (control sits in the page body's action row, not the header) | D-802 |
| 6 | "Customize the **dashboard header greeting** name in Theme Editor settings." (33) | `dashboard` §4.1, BR-DASH-02; `settings` §4.2 ("Custom Display Name"); `theme-editor` BR-THEME-16 | `[Described]` (the control is on the Settings page) | D-800, D-851, D-920 |
| 7 | "Toggle features on/off (Education, Chores, Vision Board) in Settings to show/hide their dashboard widgets." (34) | `dashboard` BR-DASH-09 (toggles do not hide widgets); `settings` §4.2, BR-SET-02; `arch/preferences` AR-PREF-25/26 | `[Described]` (toggles hide sidebar entries, BR-SHELL-07, not widgets) | D-120, D-708 |
| 8 | "Your layout and preferences are **saved automatically** across all devices and sessions." (35) | `dashboard` BR-DASH-04 (order written to `ThemeSettings` on every drop) | `[Implemented]` for the widget order; walkthrough dismissal is device-keyed | D-801 |
| 9 | "Click the **Vision** button to launch an inspirational slideshow … Choose **Auto-Generated** (AI-curated based on your lowest-scoring health pillars) or **Custom** (your selected images and saved affirmations)." (40) | `dashboard` §4.4 Vision dropdown, US-DASH-04; `vision-board/slideshow` BR-VB-SLIDE-01, BR-VB-SLIDE-02 | `[Implemented]` (Dashboard Custom uses the Auto image set, no picker) | D-751 |
| 10 | "Today's Schedule Widget — Shows upcoming events for today from your synced Google Calendar and manually added schedule items, in chronological order." (44) | `daily-schedule` §4 "Dashboard widget", BR-SCHED-17, US-SCHED-11 | `[Implemented]` (calendar- and event-sourced items only, sorted by start time) | D-410 (missing start time sorts first here, last elsewhere) |
| 11a | "Displays pending and in-progress tasks due today. Check tasks off directly here." (48) | `tasks` §4.9 TODAY'S TASKS widget | `[Implemented]` for pending; `in_progress` is never read | D-453, D-460 |
| 11b | "Tasks are color-coded by priority." (48) | `tasks` BR-TASK-07 | `[Implemented]` (palette differs from the manual's) | D-461 |
| 12a | "A summary of active goals with progress bars. Goals due today can be checked off with the checkmark button." (52) | `goals` §4 "Dashboard Goals Overview widget", BR-GOAL-14, BR-GOAL-15 | `[Implemented]` (listing rule is wider than "due today") | D-614, D-004 |
| 12b | "Click through to the Goals page for full detail." (52) | `goals` §4 "Dashboard Goals Overview widget" — *mapped by audit*: the widget description records no navigation control; the Goals page is reached from the sidebar (`app-shell` §0.2) | `[Described]` | — |
| 13 | "Shows current weather for your location. Requires browser location permission on first load. Displays temperature, conditions, and a short forecast." (56) | `weather` §1, US-WX-01..03, BR-WX-02, BR-WX-03, BR-WX-10 | `[Implemented]` ("first load" is every load with no fresh 30-minute cache) | D-810 |
| 14 | "Shows active checklist items for today. Check items off directly here. Completions reset each day automatically." (60) | `daily-checklist` §4.10, BR-CHK-16, BR-CHK-09 | `[Implemented]` | D-808, D-809 (widget refresh differences) |
| 15a | "Displays an AI-generated motivational quote. Click **"New Quote"** to generate a fresh one." (64) | `quotes` §4 "Dashboard widget (`DashboardQuote`)", BR-QUOTE-13; `arch/ai-services` §8 | `[Implemented]` (the model is the fallback behind quotable.io) | D-304, D-903, D-904 |
| 15b | "Quotes can be saved and reflected on in the full **Daily Quotes** page." (64) | `quotes` §4 "Reflection", BR-QUOTE-06 | `[Implemented]` | — |
| 16 | "Shows your lowest-performing health pillars based on your most recent daily evaluation. Click the **target icon** (blue when no evaluation done today) to go directly to the Daily Evaluation." (68) | `dashboard` §4.6, BR-DASH-08; `vision-board` §7 "Dashboard Focal Areas widget", BR-VB-REM-01 | `[Implemented]` (three lowest, no threshold) | D-703 |

### A.3 Daily Checklist (`checklist`, lines 75-94)

| # | Claim (line) | Spec anchor | Tag | D- |
|---|---|---|---|---|
| 17 | "The Daily Checklist is for recurring routines — things you want to do every day … Access this guide anytime via the Guide button on the Daily Checklist page." (81) | `daily-checklist` §1; Guide button in `onboarding` §4 | `[Implemented]` | — |
| 18 | "**Add items** using the "Add Item" button — give each item a title, optional time, category (morning / afternoon / evening / anytime), and a color label." (83) | `daily-checklist` §4.1, US-CHK-01 | `[Implemented]` | — |
| 19 | "**Check off items** by clicking the checkbox. Completions are tracked per day." (84) | `daily-checklist` §4.3, BR-CHK-08 | `[Implemented]` | — |
| 20 | "Items **reset automatically** each new day — completion is date-specific." (85) | `daily-checklist` BR-CHK-09 (implicit daily reset) | `[Implemented]` | — |
| 21 | "**Edit items** by double-clicking or clicking and holding on an item." (86) | `daily-checklist` §4.2, US-CHK-06; `arch/shared-interactions` AR-UI-01 | `[Implemented]` for double-click; hold reveals delete, not edit | D-803 |
| 22 | "**Delete items** by swiping left (mobile) or using the delete button on hover. Use the "Select" button for batch deletion." (87) | `daily-checklist` §4.4, §4.5; AR-UI-01 (long-press or hover, no swipe) | `[Implemented]` for hover and batch; swipe `[Described]` | D-804 |
| 23 | "Items are grouped by category: Morning (🌅), Afternoon (☀️), Evening (🌙), and Anytime (⏰)." (88) | `daily-checklist` BR-CHK-02, §4.10 bucket order | `[Implemented]` | — |
| 24 | "A **progress bar** at the top shows how many items you've completed today." (89) | `daily-checklist` §4.9, BR-CHK-10 | `[Implemented]` | — |

### A.4 Tasks (`tasks`, lines 95-137)

| # | Claim (line) | Spec anchor | Tag | D- |
|---|---|---|---|---|
| 25 | "Tasks are one-time or recurring to-dos with due dates, priorities, categories, and optional Google Tasks sync for seamless productivity." (101) | `tasks` §1; `tasks/recurrence` BR-TASK-20; `tasks/google-tasks` BR-TASK-40..43 | `[Implemented]` | — |
| 26 | "Click **"Add Task"** to create a new task — fill in title, description, due date, due time, priority (low / medium / high / urgent), and category label." (106) | `tasks` §4.1, §4.2 New Task dialog | `[Implemented]` (button is an icon-only "+") | D-450 |
| 27 | "**Priority color coding:** Low (gray), Medium (blue), High (orange), Urgent (red)." (107) | `tasks` BR-TASK-07 | `[Implemented]` with three different palettes, none matching the manual | D-461 |
| 28 | "**Task status workflow:** Pending → In Progress → Completed. Click the status circle to advance through states." (108) | `tasks` §4.3 (checkbox toggles pending ↔ completed) | `[Described]` (`in_progress` is declared, never written) | D-453 |
| 29 | "**Category labels:** Assign custom color-coded categories to organize tasks (e.g., Work, Personal, Shopping, etc.)." (109) | `tasks` §4.2 Label field, BR-TASK-12; `arch/shared-interactions` §5 (label picker) | `[Implemented]` | — |
| 30 | "**Edit tasks** by clicking the task row to open the detail editor where you can modify all fields including dates, times, and links." (110) | `tasks` §4.4 Edit Task dialog, BR-TASK-15, BR-TASK-16 | `[Implemented]` (opens on double-click / double-tap) | D-454 |
| 31a | "**Delete tasks** via the action menu" (111) | `tasks` §4.6; AR-UI-01 (hover / long-press delete button) | `[Implemented]` (no menu) | D-456 |
| 31b | "deleted tasks can be recovered from the Trash Bin in Settings within 30 days." (111) | `tasks/google-tasks` §5, BR-TASK-50..53; `settings/trash-bin` §1; `settings` BR-SET-17 | `[Implemented]` for restore; window is 24 hours `[Described]` | D-486, D-114 |
| 32 | "Toggle **"Is Recurring"** when creating a task to enable repeat patterns." (117) | `tasks` §4.2 Frequency select; `tasks/recurrence` BR-TASK-20, BR-TASK-23 | `[Implemented]` (create uses a Frequency select; edit has a "Recurring task" checkbox) | D-452 |
| 33 | "Set frequency to **Daily, Weekly** (choose specific days), or **Monthly**." (118) | `tasks/recurrence` §1, BR-TASK-20, BR-TASK-21 | `[Implemented]` (seven options exist) | D-473 |
| 34 | "Recurring tasks **reset automatically** at the start of the next cycle after completion." (119) | `tasks/recurrence` §3 next occurrence, BR-TASK-28..31 | `[Implemented]` as an immediately created pending sibling | — |
| 35 | "Edit the recurrence pattern anytime without affecting completion history." (120) | `tasks/recurrence` §7 | `[Implemented]` | — |
| 36 | "**Filter & sort** by status, priority, due date, or category using the controls at the top." (126) | `tasks` §4.8, BR-TASK-01..06 (status filters), BR-TASK-08 (group by priority / frequency / label), BR-TASK-09 (due date orders within groups) | `[Implemented]` except due-date sort as a selectable option | D-459 |
| 37 | "**Search tasks** by keyword to quickly find what you need." (127) | `tasks` §4.8 (no search control) | `[Described]` | D-458 |
| 38 | "**Google Tasks sync:** Connect Google Tasks in Settings, then use the "Sync" button to pull tasks in bidirectionally. Matched tasks update automatically." (128) | `tasks/google-tasks` §2a-2d, BR-TASK-41; `arch/google-sync` AR-SYNC-20, §5 | `[Implemented]` for import and matched update; "bidirectionally" `[Described]` (due-date push and delete only) | D-480, D-484, D-215, D-118 |
| 39 | "Set a **default sync category** in Settings to apply automatically to newly synced Google Tasks." (129) | `settings` BR-SET-21, US-SET-14; `tasks/google-tasks` BR-TASK-43; `settings/sync-configuration` §2 row 9 | `[Partial]` (fields exist and are read by the import; no control writes them) | D-481, D-222 |
| 40 | "**Add to Schedule:** Push tasks with a due date to your Daily Schedule by selecting a specific time slot from the task editor." (130) | `tasks` §4.4 (no such control); `daily-schedule/item-library` §5, BR-SCHED-76..79 (placement happens on the schedule page) | `[Described]` for the editor path; placement `[Implemented]` elsewhere | D-455 |

### A.5 Calendar (`calendar`, lines 138-155)

| # | Claim (line) | Spec anchor | Tag | D- |
|---|---|---|---|---|
| 41 | "The Calendar shows a monthly view of all your scheduled events, with the ability to add custom events and sync from Google Calendar." (144) | `calendar` §4 Calendar card, BR-CAL-16, BR-CAL-17, BR-CAL-07 (only `calendar` and `event` sources are loaded) | `[Implemented]` | — |
| 42 | "**Click a day** to see all events for that date in the side panel." (146) | `calendar` §4 Events card (day panel), BR-CAL-08 | `[Implemented]` | — |
| 43 | "**Add an event** by clicking the "+" button or the "Add Event" button — fill in title, start/end time, notes, and color." (147) | `calendar` §4 Add event, BR-CAL-01, BR-CAL-14 | `[Implemented]` except colour (no colour field) | D-503 |
| 44 | "**Delete an event** by swiping left on it (mobile) or hovering and clicking the trash icon. If the event came from Google Calendar, it will also be deleted there." (148) | `calendar` §4 Delete event, BR-CAL-02..04, BR-CAL-20; `arch/schedule-hub` D-209 | `[Implemented]` for delete; Google deletion is a separate choice ("Delete from Google too") `[Described]` | D-501, D-209 |
| 45 | "**Google Calendar Sync:** Connect your Google Calendar in Settings, select which calendars to sync, then click "Sync Google Calendar" to import events. Events sync for the past 30 days and forward." (149) | `calendar` §4 Sync, BR-CAL-12, BR-CAL-19; `settings/sync-configuration` §2 (calendar selection), BR-SET-30; `arch/google-sync` §4a, AR-SYNC-18 | `[Implemented]` for connect, select, import; window `[Described]` (manual import is −90/+60 days) | D-500, D-201, D-507, D-852 |
| 46 | "Events from Google Calendar are shown with a calendar icon and cannot be fully edited — edit them in Google Calendar directly." (150) | `calendar` §4 Event row, BR-CAL-05, BR-CAL-18; `arch/schedule-hub` D-221 | `[Described]` (rows show a colour dot; Google events are editable and pushed) | D-502, D-508, D-221 |
| 47 | "Use the **Print** or **Email** icons in the widget header to export your schedule." (151) | `calendar` §4 Events card header actions, §12; `arch/export-print-email` §5a, §6 | `[Implemented]` | — |

### A.6 Daily Schedule (`schedule`, lines 156-178)

| # | Claim (line) | Spec anchor | Tag | D- |
|---|---|---|---|---|
| 48 | "The Daily Schedule is a time-grid view of a single day. Items are loaded only for the selected date, so the grid populates quickly." (163) | `daily-schedule` BR-SCHED-01; `daily-schedule/time-grid` §1 | `[Implemented]` | — |
| 49 | "**Navigate dates** using the arrow buttons or clicking the date picker at the top." (165) | `daily-schedule` §4 "Date navigation" | `[Implemented]` | D-409 (local vs UTC date derivation) |
| 50 | "**Auto-population:** The schedule automatically pulls in calendar events, tasks with a scheduled time, education activities, and chores due that day — filtered by date for speed." (166) | `daily-schedule` BR-SCHED-21; `arch/schedule-hub` AR-HUB-01 (calendar and task rows are created), D-206 (no path creates `chore` or `education` rows); `education` US-EDU-11 | `[Implemented]` for calendar and task items; education and chores `[Described]` | D-206 |
| 51 | "**Add a custom time block** using the "+" button — specify title, start/end time, color, and notes." (167) | `daily-schedule` BR-SCHED-18; `daily-schedule/item-library` §1 BR-SCHED-60 (the "+" is Quick Task) | `[Described]` (custom-block form has no UI; `[Partial]` state exists) | D-401 |
| 52a | "**Item Library:** The side panel contains all your unscheduled tasks and goal milestone tasks." (168) | `daily-schedule/item-library` §2b BR-SCHED-64, §2c BR-SCHED-68 | `[Implemented]` | — |
| 52b | "Items due today appear in blue; overdue in red." (168) | `daily-schedule/item-library` BR-SCHED-73 | `[Implemented]` | — |
| 52c | "Already-scheduled items are highlighted." (168) | `daily-schedule` BR-SCHED-20 (scheduled items are excluded, not highlighted) | `[Described]` | D-403 |
| 52d | "Pin items to the top for quick access." (168) | `daily-schedule/item-library` §4 Pinning | `[Implemented]` | — |
| 53 | "**Schedule from library:** Tap any library item, choose a start time and duration, and it drops onto the timeline." (169) | `daily-schedule/item-library` §5, §6, BR-SCHED-74..79 | `[Implemented]` | — |
| 54 | "**Mark complete:** Click the checkbox on any grid block to mark it done. Completion syncs back to Tasks automatically." (170) | `daily-schedule` BR-SCHED-19; `daily-schedule/daily-todo` §4 BR-TODO-05 (completion lives in the to-do and writes through to the task) | `[Described]` for grid checkbox; write-through `[Implemented]` in the to-do | D-402, D-002 |
| 55 | "**Overlapping events** are displayed side-by-side in columns automatically." (171) | `daily-schedule/time-grid` §3, BR-SCHED-38..40 | `[Implemented]` | — |
| 56 | "**Hide/show:** Toggle the eye icon to hide completed items. Hide individual items from the grid without deleting them — restore from the hidden panel at any time." (172) | `daily-schedule/time-grid` §8, §9 BR-SCHED-56; `daily-schedule/daily-todo` BR-TODO-12 (Hide from Schedule Grid) | `[Implemented]` | — |
| 57 | "**Adjust hours:** Use the clock icon in the header to set your active day start/end hours." (173) | `daily-schedule` §4 "Active hours" | `[Implemented]` (Q-405: no validation between the two values) | — |
| 58 | "Use the **print or email** icons to export your daily schedule." (174) | `daily-schedule` §4 "Print / email the schedule", §12, BR-SCHED-15; `arch/export-print-email` §5c | `[Implemented]` | — |

### A.7 Chores (`chores`, lines 179-222)

| # | Claim (line) | Spec anchor | Tag | D- |
|---|---|---|---|---|
| 59 | "Track household chores with frequency schedules and assignments. Use AI-powered chore generation or manually create tasks for your household." (186) | `chores` §1; `chores/ai-generator` §1; `arch/ai-services` §2 | `[Implemented]` | — |
| 60a | "**Add a chore** — give it a title, description, room, frequency (daily / weekly / biweekly / monthly), day(s) of week, … and assign it to a household member." (191) | `chores` §4.2 Add a chore, BR-CHORE-09, BR-CHORE-17 (eight frequencies) | `[Implemented]` | D-552 |
| 60b | "… priority …" (191) | `chores` BR-CHORE-18 (always `medium`, no control) | `[Partial]` | D-551 |
| 60c | "Frequency can be assigned after creation." (191) | `chores` §4.3 Edit a chore | `[Implemented]` | — |
| 61 | "**Household members** are managed via the "Members" tab — add people with a name and color." (192) | `chores` §4.1 Household members, BR-CHORE-29 (a dialog behind an icon button) | `[Implemented]` for name and colour; "tab" `[Described]` | D-550 |
| 62 | "**Mark complete** by clicking the checkmark on a chore. It records the completion date." (193) | `chores` §4.4, BR-CHORE-13, BR-CHORE-27 | `[Implemented]` | D-003 (to-do path writes status only) |
| 63 | "**Overdue chores** are automatically highlighted so nothing gets missed." (194) | `chores` BR-CHORE-16 (no overdue rule on the page); `arch/time-and-date-semantics` D-104; overdue colouring exists on the Dashboard badge (BR-DASH-05/07) and Daily Schedule quick link (BR-SCHED-10/14) | `[Described]` | D-104 |
| 64 | "Filter chores by **room, member, or status** using the filter controls." (195) | `chores` §4.5, BR-CHORE-26 | `[Implemented]` (plus frequency and duration filters) | — |
| 65 | "Chores can be set to recur automatically — after completion, the next due date is calculated based on the frequency." (196) | `chores` BR-CHORE-13, BR-CHORE-28 | `[Implemented]` | — |
| 66 | "Click the **"Generate with AI"** button to create chores automatically based on your household." (202) | `chores/ai-generator` §0, §4 Configuration step (button titled "AI Generator", action "Generate Chores") | `[Implemented]` | D-605, D-306 |
| 67 | "Select a **room** (Kitchen, Bathroom, Bedroom, Living Room, Outdoor, or General)." (203) | `chores/ai-generator` §4 Room (merged room list from `choreRooms`); `chores` BR-CHORE-21 | `[Implemented]` (list differs from the manual's) | D-605 |
| 68 | "Choose an **age group** (Adults, Teens, Older Children, Younger Children, or Mixed) to generate age-appropriate tasks." (204) | `chores/ai-generator` §4 Age Group, BR-MEAL-G13; `arch/ai-services` §2a | `[Implemented]` with the groups `3-5` … `Adult` | D-305, D-605 |
| 69 | "Select a **chore type** from predefined options (Cleaning, Organizing, Maintenance) or choose "Other" to specify a custom type." (205) | `chores/ai-generator` §4 Type of Chore (also `Meal`) | `[Implemented]` | D-605 |
| 70 | "When "Other" is selected, enter a custom chore type (e.g., "Yard Work", "Pet Care", etc.)." (206) | `chores/ai-generator` §4 "Describe the Type of Chore" | `[Implemented]` | — |
| 71 | "Set the **quantity** of chores to generate (default: 5)." (207) | `chores/ai-generator` §4 Quantity, BR-MEAL-G02 | `[Implemented]` | — |
| 72 | "Review AI-generated suggestions, select which ones you want to assign, choose household members to assign them to, and optionally save new chores to your Chore Library for future reuse." (208) | `chores/ai-generator` §4 Review step, BR-MEAL-G04..G06, G12 | `[Implemented]` | D-303 (library checkbox initial state) |
| 73 | "Access saved chore templates from the **Library tab**." (214) | `chores/chore-library` §0, §4.1 (a dialog behind an icon button "Chore Library") | `[Implemented]` as a dialog; "tab" `[Described]` | D-555 |
| 74 | "**Add chores from the library** by selecting them and assigning to household members quickly." (215) | `chores/chore-library` §4.5 Assign, BR-CHORE-33..35, BR-CHORE-40 | `[Implemented]` | D-564 (no duplicate guard) |
| 75 | "Save frequently-used chores to the library when generating with AI for faster setup in the future." (216) | `chores/chore-library` BR-CHORE-41, §4.6; `chores/ai-generator` BR-MEAL-G06 | `[Implemented]` | — |

### A.8 Education (`education`, lines 223-270)

| # | Claim (line) | Spec anchor | Tag | D- |
|---|---|---|---|---|
| 76 | "Plan and track homeschool, tutoring, or extracurricular learning for multiple learners with AI-powered activity generation and scheduling." (230) | `education` §1; `education/ai-activities`; scheduling → BR-EDU-29, D-206 | `[Implemented]` except scheduling (row 84) | — |
| 77 | "**Create learners** first via the **Learners tab** — give each a name, grade level, and color for easy visual identification." (235) | `education` §4.2 Manage Learners dialog, BR-EDU-04 (fixed colour) | `[Partial]` (colour is a fixed default; the "tab" is a dialog) | D-654 |
| 78 | "**Create education plans** per learner — assign a subject, title, description, due date, materials link, and notes." (236) | `education` §4.3 New EDU Plan dialog, BR-EDU-01 (title = subject) | `[Implemented]` | — |
| 79 | "Each learner can have **multiple plans** for different subjects or courses running simultaneously." (237) | `education` BR-EDU-01 (one plan per selected subject), §4.4 Subject card | `[Implemented]` | — |
| 80 | "**Plan status:** Not Started → In Progress → Completed. Track progress with manual updates." (238) | `education` §1 claims table, BR-EDU-29 (status never written or displayed) | `[Described]` | D-653 |
| 81 | "**Add activities** within a plan — specify type (assignment or activity), frequency (once, daily, weekly, biweekly, monthly), and specific days." (244) | `education` §4.6 Add Assignment / Activity dialog, BR-EDU-07, BR-EDU-08 | `[Implemented]` | — |
| 82 | "**One-time activities** complete once and are archived." (245) | `education` BR-EDU-10, §4.10 (a completed one-off appears under Done and stays in its card) | `[Described]` for "archived" | — |
| 83 | "**Recurring activities** automatically reset on their next scheduled day after completion." (246) | `education` BR-EDU-09 | `[Implemented]` | — |
| 84 | "**Mark activities complete** by clicking the checkbox. Completion dates are tracked per activity." (247) | `education` §4.7 Activity rows, BR-EDU-09 (`last_completed_date`) | `[Implemented]` | — |
| 85 | "Add **resource links** to activities for easy access to learning materials." (248) | `education` §4.9 Activity Resources dialog, BR-EDU-22 | `[Implemented]` | — |
| 86 | "**Add to Schedule:** Push activities to Daily Schedule with a specific time slot for time-blocked learning sessions." (249) | `education` US-EDU-11, §7 (no creating path); `arch/schedule-hub` D-206 / Q-203 | `[Described]` | D-206 |
| 87 | "Click **"Generate with AI"** to create activities based on learner age, subject, and activity type." (255) | `education/ai-activities` §3a (wand button "Add / Generate Activities" → "AI Generator" mode) | `[Implemented]` | D-306 |
| 88 | "AI generates **age-appropriate, hands-on activities** tailored to specific learning goals." (256) | `education/ai-activities` §3b backend contract; `arch/ai-services` §3 (prompt intent) | `[Implemented]` | — |
| 89 | "Review suggestions, select which activities to assign, choose target plans, and optionally **save to Activity Library** for future reuse." (257) | `education/ai-activities` §3c, §3d, BR-EDU-31; library save offered in the edit dialog and library form (BR-EDU-24) | `[Implemented]` for review/assign; "save to library" in this flow `[Described]` | D-659 |
| 90 | "Access the **Activity Library** tab to browse saved favorite activities and quickly assign them to new plans." (258) | `education/activity-library` §4 The list, BR-EDU-36 (a dialog from the toolbar) | `[Implemented]` | — |
| 91 | "Filter plans and activities by **learner or subject** using the controls at the top." (264) | `education` §4.11, BR-EDU-16, BR-EDU-17 | `[Implemented]` | — |
| 92 | "View all learners' plans in a combined view or filter to a specific learner for focused lesson planning." (265) | `education` §4.11, BR-EDU-12, BR-EDU-14 | `[Implemented]` | — |

### A.9 Goals (`goals`, lines 271-320)

| # | Claim (line) | Spec anchor | Tag | D- |
|---|---|---|---|---|
| 93 | "Set and track personal or family goals across different timeframes with milestone tracking, progress monitoring, and integration with your Vision Board health pillars." (279) | `goals` §1, BR-GOAL-01; `goals/milestone-tasks`; `vision-board` BR-VB-05 | `[Implemented]` | — |
| 94 | "Click **"Add Goal"** to create — fill in title, description, timeframe (daily / weekly / monthly / annual / 3-year / 5-year), and target date." (284) | `goals` §4 "New Goal" dialog, BR-GOAL-01 (seven timeframes incl. Occurrences), BR-GOAL-03 | `[Implemented]` | D-007 (schema enum omits `occurrences`) |
| 95 | "Assign goals to a **member name** (personal or family member) for accountability and tracking." (285) | `goals` §4 Assign To, BR-GOAL-04, BR-GOAL-06 (member view); `chores` BR-CHORE-23 | `[Implemented]` | D-013 |
| 96 | "Set **occurrences count** — the number of times the goal must be completed …" (286) | `goals` BR-GOAL-02 (the `occurrences` timeframe replaces the target date) | `[Implemented]` | — |
| 97 | "**Goal status workflow:** Not Started → In Progress → Completed → On Hold. Track which goals are active or on hold." (287) | `goals` BR-GOAL-07 (status derived from milestone tasks), BR-GOAL-13 (colour map declares `on_hold`) | `[Described]` for On Hold (never written) | D-610 |
| 98 | "**Progress slider** (0–100%) to manually update progress toward completion …" (288) | `goals` BR-GOAL-07; `goals/milestone-tasks` BR-GOAL-T05 (progress derived, no slider) | `[Described]` | D-609 |
| 99 | "**Add milestone tasks** within a goal — smaller action items with their own frequency (once / daily / weekly / biweekly / monthly)." (294) | `goals/milestone-tasks` §4, BR-GOAL-T01 (always `once`) | `[Implemented]` for adding; frequency `[Described]` | D-611 |
| 100 | "Milestone tasks appear automatically in the **Daily Schedule item library** for time-blocked scheduling." (295) | `daily-schedule/item-library` §2c Goals tab, BR-SCHED-68 | `[Implemented]` | — |
| 101 | "Mark milestones complete to track incremental progress toward the overall goal." (296) | `goals/milestone-tasks` BR-GOAL-T03, BR-GOAL-T05 | `[Implemented]` | — |
| 102 | "Recurring milestone tasks reset on their scheduled day and can contribute to goal completion tracking." (297) | `goals/milestone-tasks` BR-GOAL-T01 (no reset exists) | `[Described]` | D-611 |
| 103 | "After completing a **Daily Evaluation** on the Vision Board, low-scoring pillars (rated 1–3) are highlighted as focal areas." (303) | `vision-board` BR-VB-03, §7 "✨ Focus Areas for Today"; `vision-board/daily-evaluation` BR-VB-EVAL-07 | `[Implemented]` | D-703 |
| 104 | "**Auto-convert focal areas to goals** — directly create goals from low-scoring pillars to address wellness gaps." (304) | `vision-board/daily-evaluation` §4 Suggested Goals panel, BR-VB-EVAL-06, BR-VB-EVAL-09; `vision-board` BR-VB-05 | `[Implemented]` | — |
| 105 | "Track goals tied to specific health pillars to improve overall well-being." (305) | `vision-board` BR-VB-05 (`Goal.category` = pillar name); `vision-board/health-pillars` BR-VB-PIL-03 | `[Implemented]` | — |
| 106 | "**Dashboard Goals Widget:** Shows active goals with progress bars. Goals due today can be checked off directly." (311) | `goals` §4 "Dashboard Goals Overview widget", BR-GOAL-14, BR-GOAL-15 | `[Implemented]` (listing rule wider than "due today") | D-614 |
| 107 | "**Archive completed goals** to keep your active list clean and focused." (312) | `goals` §4 Archive / restore, BR-GOAL-10; `goals/milestone-tasks` BR-GOAL-T06 (completion auto-archives) | `[Implemented]` | — |
| 108 | "Use the **restore button** (⟲) in the **Archive tab** to move goals back to In Progress status." (313) | `goals` §4 Archive / restore, BR-GOAL-10, BR-GOAL-T07 (the Archive view is a select option) | `[Implemented]` | — |
| 109 | "Filter goals by **timeframe or member** using the tabs and controls at the top." (314) | `goals` §4 Filter and sort (member filter select; timeframe/label sort select) | `[Implemented]` for member filter; timeframe is a sort, not a filter | D-613 |

### A.10 Daily Quotes (`quotes`, lines 321-340)

| # | Claim (line) | Spec anchor | Tag | D- |
|---|---|---|---|---|
| 110 | "A space for daily inspiration and personal reflection." (328) | `quotes` §1 | `[Implemented]` | — |
| 111 | "Each day, an **AI-generated motivational quote** is displayed automatically." (330) | `quotes` §4 Page load, BR-QUOTE-01, BR-QUOTE-14 (07:00 UTC pre-creation); `arch/ai-services` §8 (model is the fallback) | `[Implemented]` | D-304 |
| 112 | "Click **"New Quote"** to generate a fresh quote for today." (331) | `quotes` §4 Today's quote, BR-QUOTE-13 | `[Implemented]` | — |
| 113 | "Write a **personal reflection** in the text area below the quote and save it." (332) | `quotes` §4 Reflection, BR-QUOTE-06 | `[Implemented]` | — |
| 114 | "**Favorite a quote** by clicking the heart icon — favorited quotes appear in a separate section." (333) | `quotes` §4 Favouriting, Favorited Quotes section, BR-QUOTE-07, BR-QUOTE-10 | `[Implemented]` | D-902, D-905 |
| 115 | "Past quotes are saved in **Quote History** — scroll down to browse previous days." (334) | `quotes` §4 Past Quotes section, BR-QUOTE-10 | `[Implemented]` (card is titled "Past Quotes") | D-901 |
| 116 | "**Delete** individual quotes from your history using the trash icon." (335) | `quotes` BR-QUOTE-12; AR-UI-01 (hover / long-press "X" then "Delete Item?") | `[Implemented]` | D-900 |
| 117 | "**Export reflections** via print or email using the icons in the widget header." (336) | `quotes` §4 Email, Print, BR-QUOTE-08, BR-QUOTE-09; `arch/export-print-email` §6 | `[Implemented]` | — |

### A.11 Link Library (`links`, lines 341-358)

| # | Claim (line) | Spec anchor | Tag | D- |
|---|---|---|---|---|
| 118 | "Save and organize frequently used links and bookmarks in one place." (348) | `links` §1, BR-LINK-12 (bookmark import) | `[Implemented]` | — |
| 119a | "**Add a link** — provide a title, URL, and optional category." (350) | `links` §4 Add Link / Edit Link dialog, BR-LINK-01 | `[Implemented]` | — |
| 119b | "The app will attempt to auto-fetch a thumbnail image." (350) | `links` BR-LINK-08 (thumbnail is a typed URL or a picked icon; no fetch) | `[Described]` | D-910 |
| 120 | "Links are displayed as **cards with thumbnails** for easy visual recognition." (351) | `links` §4 Card grid and card, BR-LINK-08 | `[Implemented]` | — |
| 121 | "**Filter by category** using the tabs at the top to quickly find the link you need." (352) | `links` §4 Category filter and views (a dropdown select) | `[Implemented]` as a select; "tabs" `[Described]` | D-911 |
| 122 | "**Click a link card** to open the URL in a new tab." (353) | `links` BR-LINK-11 | `[Implemented]` | — |
| 123 | "**Delete a link** using the trash icon on the card." (354) | `links` §4 Card (hover reveals trash), BR-LINK-13 | `[Implemented]` (no confirmation; Q-910) | — |

### A.12 Vision Board (`visionboard`, lines 359-380)

| # | Claim (line) | Spec anchor | Tag | D- |
|---|---|---|---|---|
| 124 | "Create an inspirational vision collage with health pillars, daily evaluations, affirmations, and automated slideshows." (366) | `vision-board` §1 and its six sub-specs | `[Implemented]` | — |
| 125a | "**Health Pillars:** Manage 13 core wellness areas (Nutrition, Fitness, Mindset, Rest, etc.) organized by Maslow's hierarchy." (368) | `vision-board` BR-VB-01, §11; `arch/data-model/seed-data` §4 | `[Implemented]` | D-015 (name enum vs free text) |
| 125b | "Each pillar can have a description, activities, and a visibility toggle." (368) | `vision-board/health-pillars` §1, §4 Edit dialog, BR-VB-PIL-01, BR-VB-PIL-04 | `[Implemented]` | — |
| 125c | "The Guide button re-shows the onboarding walkthrough." (368) | `vision-board` §0 header right slot, BR-VB-07; `onboarding` §4 | `[Implemented]` | — |
| 126a | "**Daily Evaluation:** Rate each pillar 1–5 daily. Record activities completed and personal notes. After rating, you can optionally convert low-scoring pillars into tracked Goals." (369) | `vision-board/daily-evaluation` BR-VB-EVAL-03, BR-VB-EVAL-05, BR-VB-EVAL-06, BR-VB-EVAL-09 | `[Implemented]` | — |
| 126b | "Use the calendar icon to view or edit evaluations for past dates — days with existing evaluations are marked with a dot." (369) | `vision-board` §4 Evaluation-date picker; `vision-board/daily-evaluation` BR-VB-EVAL-12 | `[Implemented]` | — |
| 127a | "**Weekly Review:** See performance trends with bar charts and a daily breakdown. Switch between This Week, 3 Months, and All Time views." (370) | `vision-board/weekly-review` §1 BR-VB-WK-01, §3 windows, §5 chart, §6 daily breakdown | `[Implemented]` | — |
| 127b | "Focal areas show average scores per pillar." (370) | `vision-board/weekly-review` BR-VB-WK-04 (lowest averages, not the glossary's rating-based focal area) | `[Implemented]` | D-703 |
| 127c | "Print or email your review." (370) | `vision-board` §4 "Weekly Review print and email"; `arch/export-print-email` §6 | `[Implemented]` | — |
| 128a | "**Affirmation Manager:** Create custom affirmations or generate them via AI for specific pillars. Star favorites for quick access." (371) | `vision-board/affirmations` BR-VB-AFF-01, BR-VB-AFF-03, BR-VB-AFF-04, §4 "Generate for {pillar}" | `[Implemented]` | — |
| 128b | "Select multiple affirmations to apply to your custom slideshow." (371) | `vision-board/affirmations` §4.7 "Apply N to Slideshow", BR-VB-AFF-08 (the selection is overwritten at launch) | `[Implemented]` for the control; effect `[Described]` | D-750 |
| 129a | "**Vision Collage:** Upload public images (URL-based)" (372) | `vision-board/collage` §4.3, US-VB-COL-07 (`ImageUploadSection` is not mounted) | `[Partial]` | D-755 |
| 129b | "or private images (securely stored, only visible to you)." (372) | `vision-board/collage` §4.4, BR-VB-COL-02, BR-VB-COL-11 | `[Implemented]` | — |
| 129c | "Toggle individual images to show or hide them from the slideshow." (372) | `vision-board/collage` BR-VB-COL-03, BR-VB-COL-04 | `[Implemented]` | — |
| 129d | "Private images are displayed via time-limited signed URLs." (372) | `vision-board/collage` BR-VB-COL-01; `arch/external-services` §6.4 | `[Implemented]` | — |
| 130 | "**Slideshow — Auto-Generated:** Launches with all collage images. AI generates affirmations specifically for pillars you rated 3 or below in your most recent evaluation, interleaved in round-robin order … Also accessible from the Dashboard Vision button." (373) | `vision-board/slideshow` §4.1, §4.2, BR-VB-SLIDE-01, BR-VB-SLIDE-03, BR-VB-SLIDE-18; `dashboard` §4.4 | `[Implemented]` (all pillars when none is low) | D-759 |
| 131 | "**Slideshow — Custom:** Select exactly which images to include and uses your saved affirmations. Launch from the Collage tab or Dashboard." (374) | `vision-board/slideshow` BR-VB-SLIDE-02 (picker from the Collage tab; Dashboard launches with the Auto image set) | `[Implemented]` from the Collage tab; Dashboard path `[Described]` | D-751 |
| 132a | "**Slideshow Controls:** Ken Burns zoom animation per slide. Adjust speed (3–30 seconds per slide). Toggle affirmation overlay on/off. Navigate manually with arrow buttons." (375) | `vision-board/slideshow` §4.3, §4.4, BR-VB-SLIDE-08 | `[Implemented]` | — |
| 132b | "Choose from ambient audio presets (rain, ocean, music, etc.), shuffle audio, favorite and set a default track." (375) | `vision-board/slideshow` §4.5, BR-VB-SLIDE-09, BR-VB-SLIDE-10; `arch/external-services` §4 | `[Implemented]` | D-757 (no volume/mute control) |
| 132c | "Double-tap/double-click to show/hide controls on mobile." (375) | `vision-board/slideshow` §4a, BR-VB-SLIDE-15 | `[Implemented]` | — |
| 133 | "**Reminders:** Set daily reminders to review your vision board using the bell icon." (376) | `vision-board` §0 (no bell icon), §7 (`ReminderSettings` read only by the Focal Areas widget); `arch/data-model/settings` ReminderSettings | `[Described]` (entity exists, no writer, no sending code: `[Partial]` schema) | D-704 |

### A.13 Theme Editor (`theme`, lines 381-402)

| # | Claim (line) | Spec anchor | Tag | D- |
|---|---|---|---|---|
| 134 | "Customize the look and feel of your entire dashboard." (388) | `theme-editor` §1 | `[Implemented]` | — |
| 135 | "**Primary color:** Changes the main accent color used for buttons, active nav items, and highlights." (390) | `theme-editor` §4 "Colors" card, §4 Live apply, BR-THEME-17 | `[Implemented]` | — |
| 136 | "**Accent color:** Secondary highlight color used for badges and decorative elements." (391) | `theme-editor` §4 "Colors" card | `[Implemented]` | — |
| 137 | "**Background image:** Upload a photo or paste a URL to set a full-screen background. Multiple images can be saved to a history and randomized on each load." (392) | `theme-editor` §4 "Background Image" card, BR-THEME-06..11 | `[Implemented]` | D-923 (boot randomise flag) |
| 138 | "**Widget opacity:** Adjust how transparent or opaque the widget cards appear over the background." (393) | `theme-editor` §4 "Widget Appearance", BR-THEME-05 | `[Implemented]` | D-925 (boot vs editor default) |
| 139 | "**Widget border radius:** Control how rounded the widget card corners are." (394) | `theme-editor` §4 "Widget Appearance", BR-THEME-05 | `[Implemented]` | — |
| 140 | "**Fonts:** Choose heading and body fonts from Google Fonts." (395) | `theme-editor` §4 "Typography", BR-THEME-04 (fixed list of five) | `[Implemented]` for the selects; "from Google Fonts" `[Described]` | D-922 |
| 141 | "**Dark mode:** Toggle the entire app between light and dark themes." (396) | `theme-editor` §4 "Colors" card Dark Mode switch, BR-THEME-14 | `[Implemented]` | — |
| 142 | "**Dashboard header name:** Customize the greeting name shown on the Dashboard." (397) | `theme-editor` BR-THEME-16; `settings` §4.2 "Custom Display Name" | `[Described]` (control lives in Settings) | D-920, D-800, D-851 |
| 143 | "All theme changes are **saved automatically** and applied app-wide instantly." (398) | `theme-editor` BR-THEME-02 (live apply; account write only on "Save Theme") | `[Implemented]` for instant apply; "saved automatically" `[Described]` | D-921 |

### A.14 Settings (`settings`, lines 403-442)

| # | Claim (line) | Spec anchor | Tag | D- |
|---|---|---|---|---|
| 144 | "Manage your account, integrations, and data." (410) | `settings` §0 (seven cards); `arch/auth-and-account` §10 | `[Implemented]` | — |
| 145 | "View your name and email. Delete your account permanently (cannot be undone)." (414) | `settings` §4.1 Account card, BR-SET-20; `arch/auth-and-account` AR-AUTH-09; `arch/admin-operations` §2.8 | `[Implemented]` | D-333 (sixteen of thirty entities are deleted), D-214 |
| 146 | "Click **Connect Google Calendar** to authorize access." (419) | `settings` §4.4 Integrations card, BR-SET-05..08; `arch/google-sync` AR-SYNC-05 | `[Implemented]` (button reads "Connect") | D-852, D-200 |
| 147 | "Once connected, click **Manage Calendars** to toggle which calendars to sync." (420) | `settings` §4.5 Select Calendars to Sync, BR-SET-11; `settings/sync-configuration` §2, BR-SET-30; `arch/google-sync` AR-SYNC-15..17 | `[Implemented]` (button reads "Fetch Calendars") | D-852 |
| 148a | "Click **Sync Now** to pull events (past 30 days and forward)." (421) | `settings` §4.6 Sync dialog, BR-SET-15; `arch/google-sync` §4a, AR-SYNC-18 | `[Implemented]` for the sync ("↻ Sync" → "Sync Selected"); window `[Described]` | D-852, D-201 |
| 148b | "Invalid calendars are auto-deselected." (421) | `settings/sync-configuration` BR-SET-35 | `[Implemented]` | — |
| 149 | "Set **Auto-Sync times** to have the app sync automatically at specific times each day." (422) | `settings` §4.7 Auto-Sync Schedule card, BR-SET-13, BR-SET-14; `settings/sync-configuration` BR-SET-33 (one run at 12:00 UTC; times stored and displayed only); `arch/automations` §2 | `[Partial]` | D-204 |
| 150 | "**Disconnect** at any time to remove access." (423) | `settings` §4.4 Disconnect, BR-SET-09; `arch/google-sync` AR-SYNC-08 | `[Implemented]` | — |
| 151 | "Connect Google Tasks to sync task lists from Google into the app." (429) | `settings` §4.4 Integrations card; `tasks/google-tasks` BR-TASK-40 | `[Implemented]` | — |
| 152 | "Use the **Sync Tasks** button to pull tasks in. Existing tasks matched by Google Task ID are updated; new ones are created." (430) | `tasks/google-tasks` §2a, BR-TASK-41; `arch/google-sync` AR-SYNC-20, §5a | `[Implemented]` (the control is "↻ Sync" with a Google Tasks checkbox) | D-480 |
| 153 | "Set a default **task category label and color** to apply automatically to synced tasks." (431) | `settings` BR-SET-21, US-SET-14; `tasks/google-tasks` BR-TASK-43 | `[Partial]` (fields read by the import; no control writes them) | D-481, D-222 |
| 154a | "Delete all synced calendar or task data from the app without affecting your actual Google data. Useful for re-syncing from scratch." (436) | `settings/data-management` §1, §3, BR-SET-50..55; `arch/admin-operations` §2.7 | `[Implemented]` | D-853 |
| 154b | "You can also review and manage **deleted sync items** to prevent unwanted re-imports." (436) | `settings/data-management` §5 (lives on the Calendar page); `calendar/deleted-item-review` §1; `arch/google-sync` AR-SYNC-41 (nothing creates a tombstone) | `[Partial]` | D-211 |

### A.15 Manual page copy (outside the fourteen sections)

| # | Claim (line) | Spec anchor | Tag | D- |
|---|---|---|---|---|
| 155 | Tagline "Everything you need to know about using Dash it, Dash it ALL!" (496) | `user-manual` §1, BR-MAN-07 | `[Implemented]` | D-952 |
| 156 | No-match copy "No sections match your search." (511) | `user-manual` §4.3, BR-MAN-03, BR-MAN-04 | `[Implemented]` | — |
| 157 | "Need help with **The Daily Dash**? We're here for you!" (522) | `user-manual` §4.4, BR-MAN-05, BR-MAN-07; `ov/product-vision` §6 | `[Implemented]` | D-952 |
| 158 | "Reach out to us directly via email and we'll get back to you as soon as possible:" + `Reaginhouse6@gmail.com` (523-528) | `user-manual` §4.4, BR-MAN-05, §11; `ov/product-vision` §6 | `[Implemented]` | D-971 (legal pages carry a placeholder address instead) |
| 159 | "Please include a description of your issue and any relevant details so we can assist you quickly." (530) | `user-manual` §4.4, US-MAN-04 | `[Implemented]` | — |

---

## Part B — Landing page (`src/pages/LandingPage.jsx`)

All copy rows are quoted verbatim in `00-overview/product-vision.md` §1.2 (`[Described]`); navigation behaviour is
`20-features/app-shell` BR-SHELL-16 (`[Implemented]`). Blurb rows repeat the ledger's §4.1 dominant tag.

| # | Element | Claim | Spec anchor | Tag | D- |
|---|---|---|---|---|---|
| 160 | Brand + nav button (28-29) | "The Daily Dash" · "Sign In" | `ov/product-vision` §1.1, §1.2; `app-shell` BR-SHELL-16 | `[Implemented]` (navigation) | D-952 |
| 161 | Eyebrow (34) | "Your personal command center" | `ov/product-vision` §1.2 | `[Described]` | — |
| 162 | Hero (36) | "Organize your day. / Master your life." | `ov/product-vision` §1.2, §3.1 | `[Described]` | — |
| 163 | Subhead (39) | "The Daily Dash brings your schedule, tasks, goals, and reflections into one beautiful, distraction-free space." | `ov/product-vision` §1.2, §3.2; `app-shell` §0.2 | `[Described]` (each named area has an `[Implemented]` feature) | — |
| 164 | Hero call to action (42) | "Get Started — It's Free" | `ov/product-vision` §5 (no plan or payment entity); `app-shell` BR-SHELL-16, §11 (payment packages unused) | `[Implemented]` for navigation and absence of billing; "Free" `[Described]` | — |
| 165 | Features heading (49) | "Everything you need in one place" | `ov/product-vision` §1.2 | `[Described]` | — |
| 166 | Blurb L1 (7) | **Smart Scheduling** — "Sync with Google Calendar, manage daily schedules, and organize time-blocked activities in one place." | `ov/product-vision` §4.1 L1; `calendar` BR-CAL-12; `daily-schedule/item-library` BR-SCHED-76..79; `arch/google-sync` §4 | `[Implemented]` | D-201 |
| 167 | Blurb L2 (8) | **Task Management** — "Create, organize, and track recurring or one-time tasks with priorities, due dates, and category labels." | `ov/product-vision` §4.1 L2; `tasks` §4.2; `tasks/recurrence` §3 | `[Implemented]` | — |
| 168 | Blurb L3 (9) | **Chore Manager** — "Assign household chores to family members, set frequencies, and track completion — with AI-generated chore ideas tailored to age and room." | `ov/product-vision` §4.1 L3; `chores` BR-CHORE-10, BR-CHORE-13; `chores/ai-generator` §4; `arch/ai-services` §2a | `[Implemented]` | — |
| 169 | Blurb L4 (10) | **AI Meal Planning** — "Generate age-appropriate meal ideas for Breakfast, Lunch, Dinner, or Snacks — perfect for kids ages 3 and up through adults." | `ov/product-vision` §4.1 L4; `chores/meal-planning` BR-MEAL-04; `chores/ai-generator` §4 Meal Type, BR-MEAL-G13 | `[Implemented]` | D-600, D-601 |
| 170 | Blurb L5 (11) | **Vision Board** — "Build your wellness vision with health pillar tracking, daily evaluations, slideshows, and progress reviews." | `ov/product-vision` §4.1 L5; `vision-board` BR-VB-01; `vision-board/daily-evaluation` BR-VB-EVAL-03; `vision-board/weekly-review`; `vision-board/slideshow` BR-VB-SLIDE-01/02 | `[Implemented]` | D-704 (reminders) |
| 171 | Blurb L6 (12) | **Google Integration** — "Seamlessly sync Google Calendar, Google Tasks, and Google Drive for unified productivity." | `ov/product-vision` §4.1 L6; `arch/google-sync` §4, §5, §6; `arch/external-services` §3.3; `arch/admin-operations` AR-ADMIN-38 (Drive: revoke-only connector id) | `[Partial]` (Calendar and Tasks implemented in part; Drive has no reader or writer) | D-1000, D-117, D-215, D-484 |
| 172 | Blurb L7 (13) | **Daily Reflection** — "Start each day with an inspiring AI-generated quote, personal affirmations, and vision-focused slideshows." | `ov/product-vision` §4.1 L7; `quotes` BR-QUOTE-01, BR-QUOTE-06; `vision-board/affirmations` BR-VB-AFF-01, BR-VB-AFF-03; `vision-board/slideshow` BR-VB-SLIDE-05 | `[Implemented]` ("AI-generated" is the fallback path) | D-304 |
| 173 | Blurb L8 (14) | **Private & Secure** — "Your data is yours. We take privacy seriously and keep your information safe with encrypted storage." | `ov/product-vision` §4.1 L8; `arch/auth-and-account` AR-AUTH-07 (per-user row isolation), AR-SYNC-02 (tokens server-side); `vision-board/collage` BR-VB-COL-02; `ov/legal-copy` §5 ("appropriate technical and organizational measures") | `[Partial]` (isolation and private uploads implemented; "encrypted storage" has no evidence) | D-1001 |
| 174 | Closing heading (66) | "Ready to take control of your day?" | `ov/product-vision` §1.2 | `[Described]` | — |
| 175 | Closing line (67) | "Join The Daily Dash and start building better daily habits." | `ov/product-vision` §1.2, §3 | `[Described]` | — |
| 176 | Closing call to action (68) | "Start Now" | `ov/product-vision` §1.2; `app-shell` BR-SHELL-16 | `[Implemented]` (navigation to `/auth`) | — |
| 177 | Footer (74-78) | "© {year} The Daily Dash. All rights reserved." · "Privacy Policy" · "Terms of Use" | `ov/product-vision` §1.2; `app-shell` §0.2 (`/privacy-policy`, `/terms-of-use`); `ov/legal-copy` | `[Implemented]` (links) | D-971 (placeholder contact in both legal pages) |

---

## Part C — Sign-up integration choice (`src/pages/Auth.jsx:290-341`)

Owned by `10-architecture/auth-and-account.md` §2 (AR-AUTH-01, AR-AUTH-02); also registered in
`20-features/onboarding` §4.5 and `10-architecture/google-sync.md` §3 (AR-SYNC-12..14).

| # | Element (line) | Claim | Spec anchor | Tag | D- |
|---|---|---|---|---|---|
| 178 | Dialog title (294) | "How would you like to get started?" | `arch/auth-and-account` AR-AUTH-01; `onboarding` §4.5 | `[Implemented]` | — |
| 179 | Dialog description (296) | "You can connect your Google account now, or set it up later in Settings." | `arch/auth-and-account` AR-AUTH-01; `settings` §4.4 (Integrations card) | `[Implemented]` | — |
| 180 | Option 1 label (312) | "Connect Google Account" | `arch/auth-and-account` AR-AUTH-02; `arch/google-sync` AR-SYNC-13 (Calendar popup, then Tasks popup, then `/accept-terms`) | `[Implemented]` | D-330, D-200, D-115 (sign-up uses its own connector-id pair) |
| 181 | Option 1 description (314) | "Sync Google Calendar events and Google Tasks automatically on app load." | `arch/google-sync` AR-SYNC-14 (no sync runs on app load; the shell invokes only collage seeding); `arch/automations` §2 (the only automatic sync is the daily 12:00 UTC run) | `[Described]` | D-217 |
| 182 | Option 2 label (328) | "Use Independently" | `arch/auth-and-account` AR-AUTH-01; `arch/google-sync` AR-SYNC-12 | `[Implemented]` | — |
| 183 | Option 2 description (330) | "Manage tasks, schedules, and goals without connecting a Google account." | `arch/auth-and-account` AR-AUTH-01; `arch/google-sync` AR-SYNC-01 (connectors are optional and independent); `ov/product-vision` §2.5 | `[Implemented]` | — |
| 184 | Footer (337-338) | "You can always connect Google later in **Settings → Integrations**." | `arch/auth-and-account` AR-AUTH-01; `settings` §4.4 Integrations card, BR-SET-05 | `[Implemented]` | — |

---

## Mappings added by this audit

Claims that no spec anchored line-for-line. Each is now mapped above to the section that specifies the surrounding
behaviour; none needed a new spec, and no spec was edited.

| Row | Claim | Mapped to | Note for the owning spec |
|---|---|---|---|
| 12b | "Click through to the Goals page for full detail." (`UserManual.jsx:52`) | `goals` §4 "Dashboard Goals Overview widget" | The widget section lists the ✓ action and the progress bar and records no navigation control; `DashboardGoals.jsx` contains no link or `navigate` call. The goals spec is the right host if a `[Described]` line is wanted. |
| 15b | "Quotes can be saved and reflected on in the full Daily Quotes page." (`UserManual.jsx:64`) | `quotes` §4 "Reflection", BR-QUOTE-06 | The quotes spec quotes the widget sentence in §1 but only tags the first half; the second half is covered by the reflection rules. |
| 60c | "Frequency can be assigned after creation." (`UserManual.jsx:191`) | `chores` §4.3 Edit a chore | The chores spec quotes line 191 as a block; the edit dialog's frequency select covers the sub-claim. |
| 156 | "No sections match your search." (`UserManual.jsx:511`) | `user-manual` §4.3 | Already cited by the user-manual spec as no-match copy; listed here because it is not a feature claim and the product-vision ledger omits it. |

## Claims with no `[Implemented]` path anywhere in the corpus

For the reimplementation's benefit, the copy whose behaviour exists only in the manual, landing or sign-up text:

| Row | Claim | Spec that records it | D- |
|---|---|---|---|
| 28 | Pending → In Progress → Completed status circle | `tasks` §4.3 | D-453 |
| 37 | Search tasks by keyword | `tasks` §4.8 | D-458 |
| 40 | Add to Schedule from the task editor | `tasks` §4.4 | D-455 |
| 46 | Google events shown with a calendar icon and not editable | `calendar` BR-CAL-18 | D-502, D-508 |
| 51 | "+" adds a custom time block with colour and notes | `daily-schedule` BR-SCHED-18 | D-401 |
| 52c | Already-scheduled library items are highlighted | `daily-schedule` BR-SCHED-20 | D-403 |
| 54 | Checkbox on a grid block | `daily-schedule` BR-SCHED-19 | D-402 |
| 63 | Overdue chores highlighted on the Chores page | `chores` BR-CHORE-16 | D-104 |
| 80 | Education plan status workflow | `education` BR-EDU-29 | D-653 |
| 86 | Education "Add to Schedule" | `education` US-EDU-11 | D-206 |
| 97 | Goal status "On Hold" | `goals` BR-GOAL-13 | D-610 |
| 98 | Progress slider | `goals` BR-GOAL-07 | D-609 |
| 102 | Recurring milestone tasks that reset | `goals/milestone-tasks` BR-GOAL-T01 | D-611 |
| 119b | Auto-fetched link thumbnails | `links` BR-LINK-08 | D-910 |
| 133 | Vision Board reminders via a bell icon | `vision-board` §0, §7 | D-704 |
| 142 | Dashboard header name in the Theme Editor | `theme-editor` BR-THEME-16 | D-920 |
| 171 (part) | Google Drive sync | `arch/external-services` §3.3 | D-1000, D-117 |
| 173 (part) | Encrypted storage | `ov/legal-copy` §5 | D-1001 |
| 181 | Automatic Google sync on app load | `arch/google-sync` AR-SYNC-14 | D-217 |

## Method

1. Every `<p>` and `<li>` inside the fourteen `sections` entries of `src/pages/UserManual.jsx` was listed by line number (159 lines; six lines were split into lettered sub-claims where the specs tag their parts differently, and three page-level copy lines were added).
2. For each line, every `src/pages/UserManual.jsx:NNN` citation in `docs/specs` was collected (532 citations across 41 spec files); the citing spec's rule or section became the anchor, and the tag was copied from the rule that specifies the behaviour, not from the `[Described]` block quote in the spec's §1.
3. `D-` ids were taken from the citing spec's §14 and cross-checked against `90-traceability/discrepancy-log.md`.
   107 distinct ids are cited; 99 appear in the generated log. Eight are defined in their spec in table or backtick
   form rather than as `**D-nnn**` bullets and are absent from the current log build: D-104
   (`10-architecture/time-and-date-semantics.md` §12), D-114 and D-115 (`10-architecture/data-model/seed-data.md`),
   D-117 and D-118 (`10-architecture/external-services.md` §3.3), D-120 (`10-architecture/preferences.md` Part E),
   D-1000 and D-1001 (`00-overview/product-vision.md` §7). The log is script-generated and was left untouched.
4. Landing rows follow `00-overview/product-vision.md` §1.2 and §4.1; sign-up rows follow `10-architecture/auth-and-account.md` §2 and `10-architecture/google-sync.md` §3.
5. Four claims with no line-level citation were mapped by reading the owning spec's §4 (table above).
