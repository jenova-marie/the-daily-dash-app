# Daily Schedule — Feature Spec

**Feature code:** `SCHED` (page, time grid, item library) and `TODO` (daily to-do) · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 234 · Described 9 · Partial 11 (across spec.md, time-grid.md, item-library.md, daily-todo.md)

**Sources owned:** `src/pages/DailySchedule.jsx`, `src/components/DailyToDo.jsx`, `src/components/SwipeableToDoItem.jsx`, `src/components/CondensedChecklist.jsx`, `src/components/PrintFormatDailySchedule.jsx`, `src/components/dashboard/DashboardSchedule.jsx`, `src/components/onboarding/DailyScheduleOnboarding.jsx`

**Sources referenced (owned elsewhere):**
`src/components/EventEditDialog.jsx`, `src/components/SwipeableEventItem.jsx` → `20-features/calendar` ·
`src/components/TaskEditDialog.jsx` → `20-features/tasks` ·
`src/components/MenuChoresWidget.jsx` → `20-features/chores` ·
`src/components/WidgetCard.jsx`, `src/lib/printUtils.js`, `src/components/PrintRangeDialog.jsx`, `src/components/PrintFormatCalendar.jsx` → `10-architecture/export-print-email.md` (PrintFormatCalendar content → `20-features/calendar`) ·
`src/components/SwipeableListItem.jsx`, `src/lib/HeaderContext.jsx`, `src/components/Layout.jsx` → `10-architecture/shared-interactions.md` ·
`base44/entities/ScheduleItem.jsonc` and the cross-entity aggregation model → `10-architecture/schedule-hub.md` ·
`base44/functions/deleteToDoItem/entry.ts` and Google API calls → `10-architecture/google-sync.md` ·
due / overdue definitions → `10-architecture/time-and-date-semantics.md` ·
`src/pages/UserManual.jsx` → `20-features/user-manual`

**Permissions:** per-user data (every entity read or written carries `created_by` row-level security, e.g. `base44/entities/ScheduleItem.jsonc:70-83`); admin-only operations: none

**Level 2 sub-specs beside this file:**

| File | Covers |
|---|---|
| `time-grid.md` | Every rule of the hour grid: geometry, overlap packing, colour, cross-midnight, carry-over, now line, dimming, hidden panel, Move to now, detail popup, exclusions |
| `item-library.md` | The Recent / Tasks / Goals tabs, pinning, recent history, Quick Task, the add-to-grid mini form, what each add creates |
| `daily-todo.md` | The TO DO card: composition, sort, completion write-through, the five-action remove dialog, hide/unhide, edit routing, swipe, print/email, and the embedded Daily Checklist |

## 0. Entry points & navigation

- Route: `/schedule` `[Implemented]` `src/App.jsx:206` · Sidebar label: "Daily Schedule" (Clock icon) `[Implemented]` `src/components/Layout.jsx:17` · Header title text: "Daily Schedule" `[Implemented]` `src/pages/DailySchedule.jsx:82` · Position in swipe order: fifth of fourteen sidebar entries, after Calendar and before Chores; the swipe ring skips entries hidden by feature toggles but this page is never skipped `[Implemented]` `src/components/Layout.jsx:12-27,127-145`
- Query parameters accepted: none observed. The page reads no `location.search` `[Implemented]` `src/pages/DailySchedule.jsx:79-135`
- Feature-toggle gating: the page itself is not gated. Inside the page, the Chores and Edu quick-link buttons and the two synthetic library entries "Chores" and "Edu" render only while `ThemeSettings.enable_chores` / `enable_education` is not `false` (the most recently updated `ThemeSettings` row is read once on mount; the in-memory default is both enabled) `[Implemented]` `src/pages/DailySchedule.jsx:121,144-146,902,918,937-938,954-955`
- Header right-slot contents: one ghost icon button (HelpCircle icon, tooltip "Guide") that reopens the walkthrough `[Implemented]` `src/pages/DailySchedule.jsx:83,112`
- Dashboard entry: the dashboard widget registered as `schedule` with title "Today's Schedule" is this feature's read-only widget (§4, "Dashboard widget") `[Implemented]` `src/pages/Dashboard.jsx:26,37`, `src/components/dashboard/DashboardSchedule.jsx:42`
- Outbound deep links from this page: `/chores?filter=due` and `/education?filter=due` (§7) `[Implemented]` `src/pages/DailySchedule.jsx:904,920`

## 1. Purpose & user benefit

The page is one day laid out on an hour grid, with the day's to-do list, a condensed daily checklist, the menu and chores summary, and a side panel of unscheduled work that can be dropped onto a time slot. The benefit is time-blocking: pulling backlog items onto the clock for the selected date.

The in-app User Manual section with id `schedule` reads, verbatim `[Described]` `src/pages/UserManual.jsx:156-178`:

> The Daily Schedule is a time-grid view of a single day. Items are loaded only for the selected date, so the grid populates quickly.
>
> - **Navigate dates** using the arrow buttons or clicking the date picker at the top.
> - **Auto-population:** The schedule automatically pulls in calendar events, tasks with a scheduled time, education activities, and chores due that day — filtered by date for speed.
> - **Add a custom time block** using the "+" button — specify title, start/end time, color, and notes.
> - **Item Library:** The side panel contains all your unscheduled tasks and goal milestone tasks. Items due today appear in blue; overdue in red. Already-scheduled items are highlighted. Pin items to the top for quick access.
> - **Schedule from library:** Tap any library item, choose a start time and duration, and it drops onto the timeline.
> - **Mark complete:** Click the checkbox on any grid block to mark it done. Completion syncs back to Tasks automatically.
> - **Overlapping events** are displayed side-by-side in columns automatically.
> - **Hide/show:** Toggle the eye icon to hide completed items. Hide individual items from the grid without deleting them — restore from the hidden panel at any time.
> - **Adjust hours:** Use the clock icon in the header to set your active day start/end hours.
> - Use the **print or email** icons to export your daily schedule.

The User Manual's Dashboard section describes the widget: "Today's Schedule Widget — Shows upcoming events for today from your synced Google Calendar and manually added schedule items, in chronological order." `[Described]` `src/pages/UserManual.jsx:43-44`

The walkthrough's first step states the intent in the product's own words: "The Daily Schedule is your visual canvas for the day — a planner, not a task manager." `[Described]` `src/components/onboarding/DailyScheduleOnboarding.jsx:9` (full text in §9).

## 2. Concepts & vocabulary

Glossary terms used: **schedule item**, **event**, **custom block**, **source type**, **item library**, **daily to-do**, **dismiss**, **remove from app**, **label**, **time-of-day bucket**, **goal**, **milestone task**, **meal**, **feature toggle**, **device-local preference**, **account preference**, **export**, **today**, **walkthrough**.

Feature-local terms (proposed for the glossary in the return block):

- **active hours** — the device-local start hour and end hour that bound the rendered grid (`scheduleStart`, `scheduleEnd`).
- **carry-over item** — a pseudo-item drawn at the top of the selected day's grid for a previous-day schedule item whose end time is at or before its start time. Not stored.
- **now line** — the red marker at the current time on today's grid.
- **recent history** — the device-local list of up to ten `{title, duration}` entries offered on the Item Library's Recent tab.
- **quick task** — a `Task` created from the Item Library "+" with `category` "Quick Task".
- **due-task row** — a synthetic daily to-do row for a task whose `due_date` is the selected date and which has no schedule item that day.

The UI displays "TO DO" for the daily to-do, "Item Library" for the item library, "(No Label)" for tasks with no label, and "(No Category)" for goals with no category.

## 3. User stories

- **US-SCHED-01** As the account owner, I want to see one day hour-by-hour with every block colour-coded by source so that I can see how the day is structured at a glance. `[Implemented]` `src/pages/DailySchedule.jsx:697-800`
- **US-SCHED-02** As the account owner, I want to move between days with arrows or a date picker so that I can plan ahead or review a past day. `[Implemented]` `src/pages/DailySchedule.jsx:546-561,679-696`
- **US-SCHED-03** As the account owner, I want to set the hours my grid spans so that the grid only shows my active day. `[Implemented]` `src/pages/DailySchedule.jsx:563-565,648-678`
- **US-SCHED-04** As the account owner, I want to pull an unscheduled task or milestone task from a side panel onto a time slot with a duration so that backlog work gets a place on the clock. `[Implemented]` `src/pages/DailySchedule.jsx:410-443,1165-1277`
- **US-SCHED-05** As the account owner, I want to create a quick task by title alone so that I can capture work without leaving the page. `[Implemented]` `src/pages/DailySchedule.jsx:839-889`
- **US-SCHED-06** As the account owner, I want overdue and due-today work called out in the library so that I schedule it first. `[Implemented]` `src/pages/DailySchedule.jsx:998-1012,1212-1232`
- **US-SCHED-07** As the account owner, I want to hide completed or unwanted blocks from the grid and restore them later so that the grid stays clean without losing anything. `[Implemented]` `src/pages/DailySchedule.jsx:360-365,390-393,569-585,620-647`
- **US-SCHED-08** As the account owner, I want a block whose time has passed to be re-timed to now in one action so that I can catch up without re-entering times. `[Implemented]` `src/pages/DailySchedule.jsx:367-382,782-787`
- **US-SCHED-09** As the account owner, I want to print or email the day's schedule, optionally with the to-do list, so that I can carry it with me. `[Implemented]` `src/pages/DailySchedule.jsx:586-615`
- **US-SCHED-10** As the account owner, I want one-tap links to today's due chores and education work, with a count and an urgency colour, so that I know where else attention is needed. `[Implemented]` `src/pages/DailySchedule.jsx:900-934`
- **US-SCHED-11** As the account owner, I want the dashboard to list today's calendar events in time order so that I see appointments without opening the schedule. `[Implemented]` `src/components/dashboard/DashboardSchedule.jsx:47-101`
- **US-TODO-01** As the account owner, I want a to-do list for the selected day made of that day's schedule items plus tasks due that day so that nothing due is missed. `[Implemented]` `src/components/DailyToDo.jsx:31-79`
- **US-TODO-02** As the account owner, I want checking an item off to mark its source (task, chore, activity) complete too so that I update one place. `[Implemented]` `src/components/DailyToDo.jsx:107-144`
- **US-TODO-03** As the account owner, I want to remove an item from the to-do with a choice of where it goes (back to the library, kept on the calendar, deleted here, deleted in Google, or only hidden from the grid) so that removal matches my intent. `[Implemented]` `src/components/SwipeableToDoItem.jsx:108-207`, `src/components/DailyToDo.jsx:146-213`
- **US-TODO-04** As the account owner, I want to check off my daily checklist beside the schedule so that routines and the day's plan sit together. `[Implemented]` `src/components/CondensedChecklist.jsx:49-65`

## 4. Capabilities & interactions

The Level 2 files hold the detail. This section lists every action at page level and points into them.

**Layout regions** `[Implemented]` `src/pages/DailySchedule.jsx:541-543,804-831`
- A four-column grid on large screens, one column on small screens. Columns one and two: the time grid card. Column three, stacked: the TO DO card, the "Daily Checklist" card, the Menu & Chores widget. Column four: the "Item Library" card.
- The Menu & Chores widget receives the page's chore list (up to 100 rows, most recently updated first) as a prop; its behaviour is owned by `20-features/chores` `[Implemented]` `src/pages/DailySchedule.jsx:236,828`

**Date navigation** `[Implemented]` `src/pages/DailySchedule.jsx:95,546-561,679-696`
- The card title shows the selected date as weekday, month and day (e.g. "Monday, Sep 21"). Initial value: today.
- "Previous day" and "Next day" buttons step one day.
- Clicking the date opens a modal titled "Select Date" holding a single-select month calendar; picking a day sets the date and closes the modal; clicking the backdrop closes it.
- Changing the date reloads everything for that date (§6) `[Implemented]` `src/pages/DailySchedule.jsx:154-157`

**Active hours** `[Implemented]` `src/pages/DailySchedule.jsx:97-98,137,139-143,198-201,563-565,648-678`
- The clock icon (tooltip "Set schedule hours") opens a modal titled "Active Schedule Hours" with two selects, "Start" and "End", each listing all 24 hours labelled "12:00 AM", "1:00 AM" … "11:00 AM", "12:00 PM", "1:00 PM" … "11:00 PM", and a "Done" button. Backdrop click also closes.
- Defaults: start 5, end 22. Each change is written immediately to the device-local keys `scheduleStart` and `scheduleEnd` (§10) and re-renders the grid.
- The grid renders one row per hour from start through end inclusive. No validation between the two values is observed; with end earlier than start the hour list is empty (see Q-405).

**Time grid** — see `time-grid.md` for: block click / double-click and the detail popup; "↻ Move to now" and "Edit"; the show-completed eye toggle; the hidden-items badge and panel with "Restore to grid"; the now line; dimming.

**Item Library** — see `item-library.md` for: collapse toggle; the "+" Quick Task popover; the Recent, Tasks and Goals tabs; pin / unpin / remove-from-recent; the add-to-grid mini form.

**Daily to-do** — see `daily-todo.md` for: checkbox completion; swipe / hover / double-tap; the remove dialog; show-completed and hidden toggles; Unhide; print / email; edit routing.

**Daily Checklist card** `[Implemented]` `src/pages/DailySchedule.jsx:122-124,806-827`
- Card titled "Daily Checklist" whose header holds one eye button (tooltip "Hide completed items" when showing, "Show completed items" when hiding). Clicking flips the checklist's hide-completed state through the checklist component and writes the device-local key `checklist_hide_completed`. Behaviour of the list itself is in `daily-todo.md` §"Embedded Daily Checklist".

**Print / email the schedule** `[Implemented]` `src/pages/DailySchedule.jsx:586-615`
- Header "Print schedule" button: a browser confirm reads, verbatim, "Print Schedule + To Do together?\n\nOK = Both together\nCancel = Schedule only". OK renders mode `both`; Cancel renders mode `schedule`. The result opens in a new window titled "Daily Schedule" and the print dialog is invoked.
- Header "Email schedule" button: the confirm reads "Email Schedule + To Do together?\n\nOK = Both together\nCancel = Schedule only". The rendered HTML is sent to the signed-in user's own email with subject "Daily Schedule", then a browser alert reads "Sent to your email!".
- Content rules are in §12.

**Chores and Edu quick links** `[Implemented]` `src/pages/DailySchedule.jsx:245-288,900-934`
- Two outline buttons at the top of the Recent tab: "Chores" (CheckSquare icon) navigating to `/chores?filter=due`, and "Edu" (BookOpen icon) navigating to `/education?filter=due`. Each shows "(n)" after its label when its count is above zero.
- Colour carries urgency (rule BR-SCHED-14).

**Dashboard widget "Today's Schedule"** `[Implemented]` `src/components/dashboard/DashboardSchedule.jsx:42-113`
- Reads today's schedule items once on mount and keeps only those whose source type is `calendar` or `event` and which are not marked removed from app `[Implemented]` `src/components/dashboard/DashboardSchedule.jsx:45-52`
- Rows sorted by start time; a missing start time sorts as "00:00" `[Implemented]` `src/components/dashboard/DashboardSchedule.jsx:54-58`
- Each row shows the title and "start–end" (raw `HH:MM`). Left-border colour: priority for task/custom (urgent red-600, high orange-500, medium cyan-500, low green-600), otherwise source (calendar and event blue-500, task emerald-500, education purple-500, chore amber-500, custom muted); calendar and event rows also have a blue tinted background `[Implemented]` `src/components/dashboard/DashboardSchedule.jsx:12-40,88-98`
- Empty state, verbatim: "No items scheduled for today. Add items from Tasks, Education, or Calendar." `[Implemented]` `src/components/dashboard/DashboardSchedule.jsx:82-85`
- "Print schedule" and "Email schedule" buttons open the shared date-range dialog (title "Print — Select Date Range" or "Email — Select Date Range", both dates defaulting to today). On confirm, all schedule items (up to 1000, newest date first) are filtered to the range, source `calendar`/`event`, not removed from app, with a start time, and rendered through the calendar print format under the title "Daily Schedule (start → end)" or "Daily Schedule (date)" when the range is one day. Mechanism owned by `10-architecture/export-print-email.md`; format content by `20-features/calendar` `[Implemented]` `src/components/dashboard/DashboardSchedule.jsx:60-73,102-110`
- The widget is otherwise read-only; no completion, edit, or delete controls `[Implemented]` `src/components/dashboard/DashboardSchedule.jsx:87-99`

**Defined but not reachable from the UI** (recorded for completeness):
- A custom-block form state and `addCustomItem` (creates a `Task` with category "Custom" and pushes recent history) with no control that invokes it `[Partial]` `src/pages/DailySchedule.jsx:96,395-408`
- `removeFromSchedule` (sets `hidden_from_grid`) with no caller in this page; the same effect is reachable through the to-do (`daily-todo.md`) `[Partial]` `src/pages/DailySchedule.jsx:362-365`
- `autoSyncEventsToSchedule`, which re-reads the date's calendar/event items and returns them, with no caller `[Partial]` `src/pages/DailySchedule.jsx:203-217`
- A bottom-right dismissible notice (`scheduleRemoveInfo`) whose message is never set `[Partial]` `src/pages/DailySchedule.jsx:358,1122-1127`
- A four-step `ONBOARDING_STEPS` constant that is not passed to the walkthrough dialog (see D-400) `[Partial]` `src/pages/DailySchedule.jsx:31-36`
- `TIME_SLOTS` and `DURATIONS` option lists that are not rendered (§11) `[Partial]` `src/pages/DailySchedule.jsx:1145-1163`

### 4a. Keyboard & pointer

- Enter in the Quick Task input creates the task; Escape closes the popover `[Implemented]` `src/pages/DailySchedule.jsx:853-868`
- Single click on a grid block toggles its detail popup; click on empty grid area closes any popup; double-click on a block opens the popup only when the block has notes `[Implemented]` `src/pages/DailySchedule.jsx:708,741-742`
- Backdrop click closes the Active Schedule Hours and Select Date modals `[Implemented]` `src/pages/DailySchedule.jsx:649,680`
- Library rows reveal their pin / remove / add controls on hover unless the row is due, overdue, or pinned, in which case they are always visible `[Implemented]` `src/pages/DailySchedule.jsx:1193`
- To-do rows: swipe left more than 50 px (vertical drift under 50 px) reveals the remove button; swipe right conceals it; two taps within 350 ms or a double-click opens edit; mouse hover reveals the remove button `[Implemented]` `src/components/SwipeableToDoItem.jsx:30-49,83-85,99`
- Page-level swipe navigation between sidebar pages is owned by `10-architecture/shared-interactions.md`; it is suppressed while any dialog is open or an input is focused `[Implemented]` `src/components/Layout.jsx:74-88`

### 4b. View state & persistence

| Control | Values | Default | Scope |
|---|---|---|---|
| Selected date | any `YYYY-MM-DD` | today | memory `src/pages/DailySchedule.jsx:95` |
| Active hours start / end | 0–23 each | 5 / 22 | device `scheduleStart`, `scheduleEnd` `src/pages/DailySchedule.jsx:97-98,139-143,198-201` |
| Show completed items on grid | on / off | off | memory `src/pages/DailySchedule.jsx:106` |
| Hidden items panel open | open / closed | closed | memory `src/pages/DailySchedule.jsx:105` |
| Item Library collapsed | yes / no | no | memory `src/pages/DailySchedule.jsx:101` |
| Item Library active tab | recent / tasks / goals | recent | memory `src/pages/DailySchedule.jsx:892` |
| Library group expanded | per group key | all collapsed | memory `src/pages/DailySchedule.jsx:94,492-494` |
| Pinned library entries | set of entry ids | empty | device `pinned_library_items` `src/pages/DailySchedule.jsx:116-118,523-532` |
| Recent history | list of `{title, duration}`, max 10 | empty | device `schedule_custom_history` `src/pages/DailySchedule.jsx:113-115` |
| Quick Task popover open | open / closed | closed | memory `src/pages/DailySchedule.jsx:119` |
| To-do show completed | on / off | off | device `todo_showCompleted` `src/components/DailyToDo.jsx:17,257` |
| To-do hidden section open | open / closed | closed | memory `src/components/DailyToDo.jsx:16` |
| Checklist hide completed | on / off | off | device `checklist_hide_completed` `src/pages/DailySchedule.jsx:122-124`, `src/components/CondensedChecklist.jsx:11-13,82-88` |
| Walkthrough shown | shown / dismissed | shown until dismissed | device `schedule_onboarded` `src/pages/DailySchedule.jsx:107-109,1139`, `src/components/onboarding/DailyScheduleOnboarding.jsx:44-47` |
| Feature toggles read | `enable_chores`, `enable_education` | both on | account `ThemeSettings` (read only here) `src/pages/DailySchedule.jsx:121,144-146` |

### 4c. Empty & fallback states

- Tasks tab with nothing available: "No unscheduled or overdue tasks" `[Implemented]` `src/pages/DailySchedule.jsx:981-983`
- Goals tab when the account has no goals at all: "No active goals"; when goals exist but none qualify: "No available goals" `[Implemented]` `src/pages/DailySchedule.jsx:1041-1042,1059-1061`
- To-do while loading: "Loading..."; with nothing to show: "No items to complete" `[Implemented]` `src/components/DailyToDo.jsx:276-279`
- Daily Checklist with no active items: the checklist renders nothing, leaving the card body empty `[Implemented]` `src/components/CondensedChecklist.jsx:90`
- Dashboard widget: "No items scheduled for today. Add items from Tasks, Education, or Calendar." `[Implemented]` `src/components/dashboard/DashboardSchedule.jsx:82-85`
- Print, schedule section empty: "No scheduled items for this day."; to-do section empty: "No to-do items for this day." `[Implemented]` `src/components/PrintFormatDailySchedule.jsx:64-65,115-116`
- The grid itself has no empty-state copy; with no items only the hour rows render `[Implemented]` `src/pages/DailySchedule.jsx:697-800`

## 5. Business rules

Grid, library and to-do rules are numbered in their Level 2 files (BR-SCHED-30 onward in `time-grid.md`, BR-SCHED-60 onward in `item-library.md`, BR-TODO-01 onward in `daily-todo.md`). Page-level rules:

- **BR-SCHED-01** The page loads, for the selected date, in parallel: tasks (100, most recently updated first), chores (100), goals (100), the date's schedule items (200), all milestone tasks (500, oldest created first), learners (50), education activities whose `due_date` is the selected date (100), and the previous day's schedule items (100). It then loads all education activities (500) for the status colours. `[Implemented]` `src/pages/DailySchedule.jsx:234-243,285`
- **BR-SCHED-02** If a load is already running, a new request is deferred 200 ms and retried rather than run concurrently. `[Implemented]` `src/pages/DailySchedule.jsx:220-224`
- **BR-SCHED-03** Realtime: any change to a `ScheduleItem` or `Task` reloads immediately; changes to `Chore`, `Goal`, `EducationPlan`, `EducationActivity` or `GoalTask` reload after a 500 ms debounce. `[Implemented]` `src/pages/DailySchedule.jsx:159-196`
- **BR-SCHED-04** Orphan cleanup: when a debounced subscription delivers one or more delete events, the page looks up schedule items whose `source_id` equals the first deleted id collected in that debounce window and deletes them before reloading. `[Implemented]` `src/pages/DailySchedule.jsx:168-181`
- **BR-SCHED-05** The card title's date label and the walkthrough, header title and sidebar label all read "Daily Schedule"; the to-do card reads "TO DO". `[Implemented]` `src/pages/DailySchedule.jsx:82`, `src/components/DailyToDo.jsx:248`
- **BR-SCHED-06** The previous day for carry-over detection is the selected date minus one calendar day, formatted from the UTC date string. `[Implemented]` `src/pages/DailySchedule.jsx:229-232`
- **BR-SCHED-07** Task priority shown on the grid and in the to-do is copied from the backing `Task` for `task` and `custom` items, not from `ScheduleItem.priority`. `[Implemented]` `src/pages/DailySchedule.jsx:291-292,329-334`, `src/components/DailyToDo.jsx:40-50`
- **BR-SCHED-08** Feature-toggled surfaces on this page compare the toggle to `false` explicitly, so an absent value counts as enabled. `[Implemented]` `src/pages/DailySchedule.jsx:902,918,937-938,954-955`
- **BR-SCHED-09** The Chores badge count: chores that are not completed, whose type is not "Meal", that have an assignee, and that are either daily, weekly with today's weekday in `day_of_week`, due on the selected date, or monthly with a due day-of-month equal to the selected date's day. `[Implemented]` `src/pages/DailySchedule.jsx:246-259`
- **BR-SCHED-10** The Chores button colour: "has due" uses the same predicate as BR-SCHED-09 but evaluated against today; "has overdue" is any non-meal, assigned, not-completed chore with `due_date` before today. `[Implemented]` `src/pages/DailySchedule.jsx:261-278`
- **BR-SCHED-11** The Edu badge count: activities due on the selected date that are not completed and whose `last_completed_date` is not the selected date. `[Implemented]` `src/pages/DailySchedule.jsx:280-282`
- **BR-SCHED-12** The Edu button colour: "has overdue" is any activity with a `due_date` before today that is not completed; "has due" is any activity due today that is not completed. `[Implemented]` `src/pages/DailySchedule.jsx:284-288`
- **BR-SCHED-13** Chore weekday matching for the badge count uses today's weekday name even when another date is selected (see D-405). `[Implemented]` `src/pages/DailySchedule.jsx:246,252`
- **BR-SCHED-14** Quick-link colour mapping: overdue and due → purple-600; overdue only → red-600; due only → blue-600; neither → default outline. `[Implemented]` `src/pages/DailySchedule.jsx:907-912,923-928`
- **BR-SCHED-15** Email export always goes to the signed-in user's own address. `[Implemented]` `src/pages/DailySchedule.jsx:606-611`, `src/components/DailyToDo.jsx:237-242`
- **BR-SCHED-16** Editing a block from the grid popup opens the shared event edit dialog for every source type; that dialog is bound without a hide action here, so its "Hide from Schedule" button does not appear from the grid. Saving reloads the page. `[Implemented]` `src/pages/DailySchedule.jsx:384-388,1129-1134`, `src/components/EventEditDialog.jsx:105-109`
- **BR-SCHED-17** The dashboard widget shows only calendar-sourced and event-sourced items; task, education, chore, goal and custom items never appear there. `[Implemented]` `src/components/dashboard/DashboardSchedule.jsx:49-50`
- **BR-SCHED-18** The manual states the "+" button adds a custom time block with title, start/end time, colour and notes. `[Described]` `src/pages/UserManual.jsx:167` (see D-401)
- **BR-SCHED-19** The manual and walkthrough state grid blocks carry a checkbox / checkmark for completion. `[Described]` `src/pages/UserManual.jsx:170`, `src/components/onboarding/DailyScheduleOnboarding.jsx:24` (see D-402)
- **BR-SCHED-20** The manual and walkthrough state already-scheduled items are highlighted in the library. `[Described]` `src/pages/UserManual.jsx:168`, `src/components/onboarding/DailyScheduleOnboarding.jsx:14` (see D-403)
- **BR-SCHED-21** The manual states the schedule auto-populates with calendar events, tasks with a scheduled time, education activities, and chores due that day. This page reads whatever `ScheduleItem` rows exist for the date; creation of those rows by other features is owned by `10-architecture/schedule-hub.md`. `[Described]` `src/pages/UserManual.jsx:166`

### 5a. State & lifecycle

Flags on `ScheduleItem` as driven from this feature (the entity itself is owned by `10-architecture/schedule-hub.md`):

| Flag / field | From | Trigger | To | Side effects |
|---|---|---|---|---|
| `hidden_from_grid` | false | To-do checkbox checked | true | `completed` true; source entity marked complete (`daily-todo.md` BR-TODO-05) `src/components/DailyToDo.jsx:131-136` |
| `hidden_from_grid` | true | To-do checkbox unchecked | false | `completed` false; source entity reopened `src/components/DailyToDo.jsx:131-136` |
| `hidden_from_grid` | false | "Hide from Schedule Grid" in the remove dialog, or "Hide from Schedule" in an edit dialog opened from the to-do | true | to-do row stays `src/components/DailyToDo.jsx:287-291,328-346` |
| `hidden_from_grid` | true | "Restore to grid" in the hidden panel | false | grid reload `src/pages/DailySchedule.jsx:390-393` |
| `hidden_from_todo` | false | "Keep in Calendar" | true | row moves to the "Hidden from To Do" section `src/components/DailyToDo.jsx:180-183` |
| `hidden_from_todo` | true | "Unhide" | false | forced reload `src/components/DailyToDo.jsx:215-218` |
| `start_time`, `end_time` | past | "↻ Move to now" | now, now + duration (clamped 23:59) | popup closes, reload `src/pages/DailySchedule.jsx:367-382` |
| row | exists | "Send to Item Library" | deleted | task's due/schedule fields cleared; custom title pushed to recent history `src/components/DailyToDo.jsx:156-179` |
| row | exists | "Delete from App" / "Delete Permanently" | deleted | source entity deleted for task/chore/education/goal `src/components/DailyToDo.jsx:184-193` |
| row | exists | "Delete from Google" | deleted | backend function invoked `src/components/DailyToDo.jsx:194-206` |

Walkthrough: shown → "Got it — Don't Remind Me Again" → dismissed permanently (`schedule_onboarded` = "1"); shown → close by backdrop/Escape → hidden for this visit only; dismissed → header "Guide" → shown `[Implemented]` `src/pages/DailySchedule.jsx:107-112,1136-1140`, `src/components/onboarding/DailyScheduleOnboarding.jsx:44-49,69-71`

### 5b. Time & date semantics

Canonical definitions live in `10-architecture/time-and-date-semantics.md` (cite `AR-TIME-nn` once published; see Q-400). This page's own implementation:

- **Today** for the now line, past-hour dimming and the quick-link colours is the device's local date via date-fns `format(new Date(), "yyyy-MM-dd")`, refreshed every 60 s. `[Implemented]` `src/pages/DailySchedule.jsx:110,149-152,262,534-536`
- **Selected date** starts as local today, but stepping with the arrows, picking from the calendar, and deriving the previous day all use `toISOString().split('T')[0]`, which is the UTC date of the local midnight instant. `[Implemented]` `src/pages/DailySchedule.jsx:95,232,549,559,688` (see D-409)
- **Due today (library task)**: `due_date` equals the selected date. `[Implemented]` `src/pages/DailySchedule.jsx:496-499`
- **Overdue (library task)**: not completed, and either `due_date` before the selected date, or `due_date` equal to the selected date with a `schedule_time` or `due_time` earlier than the current wall-clock time. Tasks with no due date and no time are never overdue. `[Implemented]` `src/pages/DailySchedule.jsx:501-516`
- **Due today or overdue (library task)**: `due_date` on or before the selected date. `[Implemented]` `src/pages/DailySchedule.jsx:518-521`
- **Due / overdue (library goal)**: `target_date` equals / precedes the selected date. `[Implemented]` `src/pages/DailySchedule.jsx:1097,1099`
- **Chore due / overdue** and **activity due / overdue**: BR-SCHED-09 to BR-SCHED-12; the count uses the selected date, the colour uses today.
- **Past item (grid)**: only on today; end minutes at or before the current minute and not completed. `[Implemented]` `src/pages/DailySchedule.jsx:727`
- **Past hour (grid)**: only on today; the hour number is less than the current time in fractional hours. `[Implemented]` `src/pages/DailySchedule.jsx:700`
- **To-do task due row**: `Task.due_date` equals the selected date, regardless of status. `[Implemented]` `src/components/DailyToDo.jsx:53-56`
- **Checklist completion date**: the selected date. `[Implemented]` `src/components/CondensedChecklist.jsx:14,23,57-62`
- **Dashboard widget today**: local date at mount. `[Implemented]` `src/components/dashboard/DashboardSchedule.jsx:45`

## 6. Data

Entities are owned by `10-architecture/data-model/`; the aggregation model by `10-architecture/schedule-hub.md`. This feature's operations:

| Entity | Reads | Writes |
|---|---|---|
| `ScheduleItem` | by `date` (selected, 200; previous day, 100; to-do: selected date, no limit; dashboard: today; range print: all, 1000) `src/pages/DailySchedule.jsx:238,242`, `src/components/DailyToDo.jsx:36`, `src/components/dashboard/DashboardSchedule.jsx:48,64` · by `source_id` for orphan cleanup `src/pages/DailySchedule.jsx:177` · by `date` + `source_id` for task-dialog hide `src/components/DailyToDo.jsx:341` | create (`title`, `date`, `start_time`, `end_time`, `source_type`, `source_id`) `src/pages/DailySchedule.jsx:429-436` · update `hidden_from_grid`, `hidden_from_todo`, `completed`, `start_time`, `end_time` · delete |
| `Task` | all, 100 (page) / 200 newest (to-do) `src/pages/DailySchedule.jsx:235`, `src/components/DailyToDo.jsx:37` · by id for edit `src/components/DailyToDo.jsx:294` | create (`title`, `status` "pending", `category` "Quick Task" or "Custom", `priority` for custom) `src/pages/DailySchedule.jsx:420-426,855-859,873-877` · update `due_date`, `schedule_time` on add `src/pages/DailySchedule.jsx:439-441` · update `status`, `last_completed_date` on complete; clear `due_date`, `due_time`, `schedule_time`, `synced_to_schedule` on Send to Library; delete `src/components/DailyToDo.jsx:117-122,158-165,189` |
| `Chore` | all, 100 `src/pages/DailySchedule.jsx:236` | update `status`; delete `src/components/DailyToDo.jsx:123-124,190` |
| `Goal` | all, 100 `src/pages/DailySchedule.jsx:237` | none |
| `GoalTask` | all, 500 oldest first `src/pages/DailySchedule.jsx:239` | update `completed`; delete `src/components/DailyToDo.jsx:127-128,192` |
| `Learner` | all, 50 (loaded, not rendered) `[Partial]` `src/pages/DailySchedule.jsx:240,344` | none |
| `EducationActivity` | by `due_date` = selected (100); all (500) `src/pages/DailySchedule.jsx:241,285` | update `completed`; delete `src/components/DailyToDo.jsx:125-126,191` |
| `EducationPlan` | subscribed only `src/pages/DailySchedule.jsx:188` | none |
| `ThemeSettings` | latest one row `src/pages/DailySchedule.jsx:144-146` | none |
| `DailyChecklist` | `is_active` true `src/components/CondensedChecklist.jsx:22` | none |
| `ChecklistCompletion` | by `date` `src/components/CondensedChecklist.jsx:23` | create / update `completed`, `completed_at` `src/components/CondensedChecklist.jsx:49-65` |

Schema note: `ScheduleItem.source_type` is declared with the enum `calendar, task, education, chore, custom` `[Implemented]` `base44/entities/ScheduleItem.jsonc:18-27`, while this feature creates items with source type `goal` and reads source type `event` `[Implemented]` `src/pages/DailySchedule.jsx:324,434,1044,1097` (see D-407).

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| out | Chores | button "Chores (n)" → `/chores?filter=due`; that page reads `filter` and treats any value other than `all` as its due view | `src/pages/DailySchedule.jsx:904`, `src/pages/Chores.jsx:58-61` |
| out | Education | button "Edu (n)" → `/education?filter=due`; that page reads `filter` | `src/pages/DailySchedule.jsx:920`, `src/pages/Education.jsx:51-52` |
| in | Dashboard | widget `schedule` "Today's Schedule" renders this feature's `DashboardSchedule` | `src/pages/Dashboard.jsx:26,37` |
| in | Sidebar / swipe | nav entry "Daily Schedule" | `src/components/Layout.jsx:17` |
| both | Tasks | library adds stamp `Task.due_date` and `schedule_time`; to-do completion writes `Task.status`; Send to Library clears the due fields; edit opens `TaskEditDialog` | `src/pages/DailySchedule.jsx:439-441`, `src/components/DailyToDo.jsx:117-122,158-165,292-296` |
| both | Calendar | calendar/event items render on the grid and to-do; "Keep in Calendar" dismisses from the to-do only; edit opens `EventEditDialog` | `src/pages/DailySchedule.jsx:324-326`, `src/components/DailyToDo.jsx:180-183,297-299` |
| both | Chores | Menu & Chores widget embedded; to-do completion writes `Chore.status` | `src/pages/DailySchedule.jsx:828`, `src/components/DailyToDo.jsx:123-124` |
| both | Education | to-do completion writes `EducationActivity.completed`; badge counts | `src/components/DailyToDo.jsx:125-126`, `src/pages/DailySchedule.jsx:280-288` |
| both | Goals | Goals tab offers milestone tasks; the to-do's completion handler returns before any write for goal rows and goal rows have no checkbox, so the `GoalTask.completed` write in the same handler is not reached from the to-do | `src/pages/DailySchedule.jsx:1039-1112`, `src/components/DailyToDo.jsx:108,127-128` |
| both | Daily Checklist | condensed checklist embedded; toggles `ChecklistCompletion` for the selected date | `src/components/CondensedChecklist.jsx:49-65` |
| out | Google (via backend) | "Delete from Google" invokes `deleteToDoItem` | `src/components/DailyToDo.jsx:199-206` |
| in | Settings / Theme | `ThemeSettings.enable_chores`, `enable_education` gate quick links and default library entries | `src/pages/DailySchedule.jsx:144-146,902,918` |
| in | Onboarding | first-visit walkthrough; registry in `20-features/onboarding` | `src/pages/DailySchedule.jsx:107-109,1136-1140` |

### 7a. Feedback & notifications

- Browser confirm before print and before email of the schedule (text in §4). `[Implemented]` `src/pages/DailySchedule.jsx:596,602`
- Browser alert "Sent to your email!" after emailing the schedule or the to-do. `[Implemented]` `src/pages/DailySchedule.jsx:612`, `src/components/DailyToDo.jsx:243`
- Remove dialog on a to-do row: title `Remove "<title>"`, description "What would you like to do with this item?" (`daily-todo.md`). `[Implemented]` `src/components/SwipeableToDoItem.jsx:111-112`
- Tooltips: "Previous day", "Pick a date", "Next day", "Set schedule hours", "n hidden item(s)", "Hide completed items" / "Show completed items", "Print schedule", "Email schedule", "Restore to grid", "Quick Task", "Pin to top" / "Unpin", "Remove from recent", "Overdue - Add to schedule", "Due today - Add to schedule", "Guide". `[Implemented]` `src/pages/DailySchedule.jsx:83,550,553,560,563,573,582,598,613,640,842,1198,1207,1216,1224`
- No toasts or celebratory effects observed. The bottom-right notice element exists but never receives a message. `[Partial]` `src/pages/DailySchedule.jsx:1122-1127`

## 8. AI & automation

None observed. No LLM call, no scheduled automation from these files. Google-side deletion is a backend function call described in `daily-todo.md` and owned by `10-architecture/google-sync.md`.

## 9. Onboarding content

Dialog title "Welcome to Daily Schedule"; subtitle "Here's how to get the most out of this page — it only takes a minute!"; single button "Got it — Don't Remind Me Again" `[Implemented]` `src/components/onboarding/DailyScheduleOnboarding.jsx:52-55,69-71`

Steps, verbatim `[Implemented]` `src/components/onboarding/DailyScheduleOnboarding.jsx:5-41`:

1. **1. Your Visual Day Organizer** — "The Daily Schedule is your visual canvas for the day — a planner, not a task manager. Lay out your hours intentionally so you can see exactly how your day is structured at a glance. Events, tasks, goals, chores, and education items all appear color-coded by source. The schedule loads only items for the selected date, so it's fast and focused."
2. **2. The Item Library** — "The library panel contains all your tasks and goal milestone tasks. Items already placed on today's schedule are highlighted — so you can instantly see what's scheduled vs. what still needs a time slot. Items due today appear in blue; overdue in red. Pin items to the top of the library for quick access."
3. **3. Placing Items on the Grid** — "Tap any library item, choose a start time and duration, and it drops onto the timeline. Use the + button to create a brand-new custom item directly on the schedule. Items snap into place side-by-side when they overlap so nothing gets hidden."
4. **4. Completing Items** — "Mark items complete directly on the schedule grid by tapping the checkmark. Completing a task here also marks it complete in Tasks — and vice versa. They stay in sync so you never update two places."
5. **5. Works with Your To-Do List** — "The schedule and the To-Do list (on the dashboard) work together. Scheduled items appear in your To-Do list for the day. When you complete something in either place it's reflected in both. Items removed from the schedule return to the library and can be rescheduled at any time."
6. **6. How Tasks Work Here** — "Tasks from your Task Manager appear in the Item Library. Placing a task gives it a time slot for the day. Completing it on the schedule marks it done in Tasks too. Recurring tasks reset automatically and reappear each day they're due."
7. **7. Control Your View** — "Toggle completed items on/off with the eye icon to keep the grid clean. Hide items from the grid without deleting them — they move to a hidden panel and can be restored anytime. Adjust your active day hours using the clock icon in the header. Use the print or email icons to export your schedule."

A second, four-step set titled "Visual Schedule", "Quick Add Items", "Smart Library", "Manage Visibility" is defined in the page and not rendered `[Partial]` `src/pages/DailySchedule.jsx:31-36` (D-400).

- Trigger: shown on mount when the device-local key `schedule_onboarded` is absent; reopened by the header "Guide" button. `[Implemented]` `src/pages/DailySchedule.jsx:83,107-112`
- Dismissal key: `schedule_onboarded` = "1", written by the dialog's own button. The page also passes an `onDontRemind` handler writing the same key, which the dialog does not invoke. Closing by backdrop or Escape does not write the key. `[Implemented]` `src/components/onboarding/DailyScheduleOnboarding.jsx:44-49`, `src/pages/DailySchedule.jsx:1136-1140`
- Persistence generation: device-local key only; no write to `ThemeSettings.onboarding_status` is observed in these files. `[Implemented]` `src/pages/DailySchedule.jsx:107-109,1139`

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `scheduleStart` | first hour of the grid (integer string) | absent → 5 | every change of the Start select, and on mount `src/pages/DailySchedule.jsx:198-201` | nothing observed |
| `scheduleEnd` | last hour of the grid (integer string) | absent → 22 | every change of the End select, and on mount `src/pages/DailySchedule.jsx:198-201` | nothing observed |
| `schedule_custom_history` | JSON array of `{title, duration}`; newest first; max 10; deduplicated by title | `[]` | Quick Task create `src/pages/DailySchedule.jsx:860-863,878-881`; Send to Item Library on a custom item `src/components/DailyToDo.jsx:170-179`; `addCustomItem` (unreachable) `src/pages/DailySchedule.jsx:402-405` | "Remove from recent" removes one title `src/pages/DailySchedule.jsx:943-947,960-964` |
| `pinned_library_items` | JSON array of pinned entry ids (`default-chores`, `default-edu`, `custom-<index>`) | `[]` | pin / unpin `src/pages/DailySchedule.jsx:523-532` | unpin |
| `todo_showCompleted` | "true" / "false"; completed to-do rows shown when "true" | absent → off | to-do show-completed toggle `src/components/DailyToDo.jsx:257` | never removed; toggling off writes "false" |
| `checklist_hide_completed` | JSON boolean; hide completed checklist rows | `false` | Daily Checklist card eye button and the checklist's imperative setter `src/pages/DailySchedule.jsx:817`, `src/components/CondensedChecklist.jsx:86` | toggle off |
| `schedule_onboarded` | "1" once the walkthrough is dismissed permanently | absent | walkthrough button `src/components/onboarding/DailyScheduleOnboarding.jsx:45` | nothing observed |

## 11. Seed / hardcoded data used

- Source colour map (grid): calendar and event blue-500; task emerald-500; education purple-500; chore amber-500; custom muted. Priority colour map (grid): urgent red-600, high orange-500, medium yellow-400, low green-600. `[Implemented]` `src/pages/DailySchedule.jsx:38-68`
- Priority border colours (to-do row and dashboard widget): urgent red-600, high orange-500, medium cyan-500, low green-600. `[Implemented]` `src/components/SwipeableToDoItem.jsx:14-19`, `src/components/dashboard/DashboardSchedule.jsx:28-33`
- Print priority dot colours: urgent `#dc2626`, high `#f97316`, medium `#eab308`, low `#16a34a`; print source labels: calendar and event "Calendar", task "Task", education "Education", chore "Chore", goal "Goal", custom "Custom". `[Implemented]` `src/components/PrintFormatDailySchedule.jsx:9-14`
- Synthetic library entries: `{id: "default-chores", title: "Chores"}`, `{id: "default-edu", title: "Edu"}`. `[Implemented]` `src/pages/DailySchedule.jsx:937-938,954-955`
- `TIME_SLOTS`: 96 entries at 15-minute steps across 24 hours with 12-hour labels; `DURATIONS`: 15 min, 30 min, 45 min, 1 hr, 1.5 hr, 2 hr, 2.5 hr, 3 hr, 4 hr, 5 hr, 6 hr, 7 hr, 8 hr, 9 hr, 10 hr, 11 hr, 12 hr, 14 hr, 16 hr, 18 hr, 20 hr, 22 hr, 24 hr. Defined; no rendering observed. `[Partial]` `src/pages/DailySchedule.jsx:1145-1163`
- Checklist bucket order and headers: morning "Morning", afternoon "Afternoon", evening "Evening", anytime "Anytime". `[Implemented]` `src/components/CondensedChecklist.jsx:70-71`
- Grid constants: `HOUR_PX` 60, minimum duration 15 min, minimum block height 20 px, column gap 2 px, popup width 14 rem, label column 76 px. `[Implemented]` `src/pages/DailySchedule.jsx:445,456,713,718,769,795`
- No seed rows are created by this feature; see `10-architecture/data-model/seed-data.md`.

## 12. Print / email formats

Mechanism (new window, `document.write`, `window.print`; `SendEmail` to self) is described in `10-architecture/export-print-email.md`. This feature does not go through the generic `WidgetCard` fallback; it renders `PrintFormatDailySchedule` to static markup itself. `[Implemented]` `src/pages/DailySchedule.jsx:586-615`, `src/components/DailyToDo.jsx:220-244`

`PrintFormatDailySchedule` `[Implemented]` `src/components/PrintFormatDailySchedule.jsx:16-158`:
- Props: the grid's items, the to-do's items, the date, and `mode` of `schedule`, `todo`, or `both` (default `both`).
- Heading "Daily Schedule" and the date as "Weekday, Month D, YYYY" (US English); today's date when no date is given.
- Schedule section (modes `schedule`, `both`): heading "Hourly Schedule (n items)"; items with a start time and not hidden from grid, sorted by start time; columns Time (start, then "→ end" when present), Item (priority dot when the item has a priority, title, notes beneath), Type (source label; "✓ Done" beneath when completed); completed rows at half opacity with strike-through. Empty text "No scheduled items for this day."
- To-do section (modes `todo`, `both`): heading "To Do (n items)"; items sorted by start time with missing times last ("99:99" sentinel); columns: a drawn checkbox (filled when completed), start time, Item (priority dot, title, notes), source label. Empty text "No to-do items for this day."
- Time formatting: "9 AM", "9:30 AM", "12 PM".
- Inputs from the page: the grid list already excludes hidden and removed items and includes carry-over pseudo-items (which print with a "12 AM" start), and the to-do list passed is the full composed list including completed and regardless of the show-completed toggle. `[Implemented]` `src/pages/DailySchedule.jsx:125,589,604`, `src/components/DailyToDo.jsx:78`
- Options dialogs: the browser confirm described in §4 (schedule) and none for the to-do (always mode `todo`). No remembered inputs.
- Email subjects: "Daily Schedule" (page), "Daily To Do" (to-do card). Window titles: "Daily Schedule", "To Do". `[Implemented]` `src/pages/DailySchedule.jsx:592,609`, `src/components/DailyToDo.jsx:230,240`
- The dashboard widget prints through the calendar format over a date range (§4). It imports `PrintFormatDailySchedule` without using it. `[Implemented]` `src/components/dashboard/DashboardSchedule.jsx:8,71-72`

## 13. Acceptance criteria

- **AC-SCHED-01** Given the page opens, When no date has been chosen, Then the grid shows today with rows from 5 AM through 10 PM unless `scheduleStart`/`scheduleEnd` are stored. (refs BR-SCHED-01, §4b)
- **AC-SCHED-02** Given the Active Schedule Hours dialog, When Start is changed to 7 AM, Then the grid re-renders from 7 AM and `scheduleStart` reads "7" on the next visit. (refs §4 Active hours)
- **AC-SCHED-03** Given a chore has `due_date` before today, is assigned, not a meal and not completed, and no chore is due today, When the Recent tab renders, Then the Chores button is red. (refs BR-SCHED-10, BR-SCHED-14)
- **AC-SCHED-04** Given chores are both overdue and due today, When the Recent tab renders, Then the Chores button is purple. (refs BR-SCHED-14)
- **AC-SCHED-05** Given `ThemeSettings.enable_education` is false, When the page loads, Then neither the Edu quick link nor the "Edu" library entry renders. (refs §0)
- **AC-SCHED-06** Given the Print schedule button is pressed, When the confirm is accepted, Then the new window contains both "Hourly Schedule" and "To Do" sections; When it is cancelled, Then only "Hourly Schedule". (refs §4, §12)
- **AC-SCHED-07** Given the Email schedule button is pressed and the confirm is answered, When the send completes, Then an alert "Sent to your email!" appears and the message went to the signed-in user's address with subject "Daily Schedule". (refs BR-SCHED-15)
- **AC-SCHED-08** Given a `Task` is updated anywhere, When the subscription fires, Then the page reloads without waiting; Given a `Chore` is updated, Then the reload happens after 500 ms. (refs BR-SCHED-03)
- **AC-SCHED-09** Given the Chores quick link is pressed, Then the browser navigates to `/chores?filter=due`. (refs §7)
- **AC-SCHED-10** Given the dashboard, When "Today's Schedule" renders with one task item and one calendar item today, Then only the calendar item is listed. (refs BR-SCHED-17)
- **AC-SCHED-11** Given the walkthrough is open, When "Got it — Don't Remind Me Again" is pressed, Then `schedule_onboarded` is "1" and the walkthrough does not show on the next visit; When the dialog is closed by backdrop instead, Then it shows again on the next visit. (refs §9)
- **AC-SCHED-12** Given a block is opened from the grid popup with "Edit", When the edit dialog renders, Then no "Hide from Schedule" button is present. (refs BR-SCHED-16)
- **AC-TODO-01** Given a task due on the selected date with no schedule item, When the TO DO card loads, Then a row for it appears with its `due_time` as the time. (refs `daily-todo.md` BR-TODO-01)
- **AC-TODO-02** Given a task-sourced row is checked, Then the `Task` is `completed` with `last_completed_date` set to the selected date and the `ScheduleItem` is `completed` and `hidden_from_grid`. (refs `daily-todo.md` BR-TODO-05)

Further criteria are numbered in the Level 2 files (AC-SCHED-20 onward, AC-TODO-03 onward).

## 14. Discrepancies & open questions

- **D-400** The walkthrough dialog renders seven steps (`src/components/onboarding/DailyScheduleOnboarding.jsx:5-41`); the page defines a different four-step set "Visual Schedule / Quick Add Items / Smart Library / Manage Visibility" that is not passed to the dialog (`src/pages/DailySchedule.jsx:31-36`).
- **D-401** The manual says the "+" button adds a custom time block with title, start/end time, colour and notes (`src/pages/UserManual.jsx:167`); the page's "+" opens a Quick Task popover that creates a `Task` from a title alone, and the custom-block form state has no UI (`src/pages/DailySchedule.jsx:96,395-408,839-889`).
- **D-402** The manual and walkthrough say completion is done by a checkbox / checkmark on a grid block (`src/pages/UserManual.jsx:170`, `src/components/onboarding/DailyScheduleOnboarding.jsx:24`); grid blocks carry no completion control (`src/pages/DailySchedule.jsx:730-790`) and completion happens in the to-do (`src/components/DailyToDo.jsx:107-144`).
- **D-403** The manual and walkthrough say already-scheduled items are highlighted in the library (`src/pages/UserManual.jsx:168`, `src/components/onboarding/DailyScheduleOnboarding.jsx:14`); the Tasks and Goals tabs exclude already-scheduled items instead (`src/pages/DailySchedule.jsx:974-979,1044-1056`).
- **D-404** The walkthrough places the To-Do list "on the dashboard" (`src/components/onboarding/DailyScheduleOnboarding.jsx:29`); the TO DO card renders on the Daily Schedule page (`src/pages/DailySchedule.jsx:805`) and the dashboard's schedule widget lists calendar/event items only (`src/components/dashboard/DashboardSchedule.jsx:49-50`).
- **D-405** The Chores badge count evaluates `due_date` and monthly day-of-month against the selected date but weekly `day_of_week` against today's weekday (`src/pages/DailySchedule.jsx:246-258`); the Chores button colour evaluates every rule against today (`src/pages/DailySchedule.jsx:261-278`).
- **D-406** The Edu badge count uses the selected date and excludes activities whose `last_completed_date` equals it (`src/pages/DailySchedule.jsx:280-282`); the Edu button colour uses today and `!completed` only (`src/pages/DailySchedule.jsx:284-288`).
- **D-407** `ScheduleItem.source_type` is declared as `calendar | task | education | chore | custom` (`base44/entities/ScheduleItem.jsonc:18-27`); this feature creates items with source type `goal` and reads source type `event` (`src/pages/DailySchedule.jsx:324,434,1044,1097`).
- **D-408** Medium priority renders yellow-400 on the grid (`src/pages/DailySchedule.jsx:59`) and as a `#eab308` dot in print (`src/components/PrintFormatDailySchedule.jsx:14`), but cyan-500 on to-do rows (`src/components/SwipeableToDoItem.jsx:17`) and the dashboard widget (`src/components/dashboard/DashboardSchedule.jsx:31`).
- **D-409** The initial selected date and "today" use the local date via date-fns (`src/pages/DailySchedule.jsx:95,534`); the arrow steps, date picker, and previous-day derivation use the UTC date string of local midnight (`src/pages/DailySchedule.jsx:232,549,559,688`).
- **D-410** A missing start time sorts first ("00:00") in the dashboard widget (`src/components/dashboard/DashboardSchedule.jsx:54-58`) and last ("99:99") in the to-do and print (`src/components/DailyToDo.jsx:71-75`, `src/components/PrintFormatDailySchedule.jsx:25-29`).
- **D-411** "Send to Item Library" is implemented in the to-do component (clears the task's due fields, deletes the row, pushes custom titles to recent history) (`src/components/DailyToDo.jsx:156-179`) and again as the `library` action of the backend function (clears the same fields, deletes the row, no history) (`base44/functions/deleteToDoItem/entry.ts:51-70`); the component invokes the backend only for `delete_google` (`src/components/DailyToDo.jsx:194-206`).
- **D-412** "Delete from Google" is offered for any task-sourced row with a `source_id` (`src/components/SwipeableToDoItem.jsx:65-67`) and the component deletes the schedule item before invoking the backend (`src/components/DailyToDo.jsx:196-198`); the backend deletes the `Task` only when it has a `google_task_id` (`base44/functions/deleteToDoItem/entry.ts:109-116`).
- **Q-400** Blocks §5b. Which `AR-TIME-nn` rules cover this page's time-of-day-aware overdue test (`src/pages/DailySchedule.jsx:501-516`) and the UTC-string date stepping (D-409)? Pending `10-architecture/time-and-date-semantics.md`.
- **Q-401** Blocks `time-grid.md` §"Move to now". A carry-over pseudo-item can satisfy the past-item test and offer "↻ Move to now" and "Edit"; the update then targets the pseudo id `carryover-<id>` (`src/pages/DailySchedule.jsx:310,367-382,727,782-787`). What is the observed outcome?
- **Q-402** Blocks `daily-todo.md` §completion. Completing a chore-sourced row writes `Chore.status` only (`src/components/DailyToDo.jsx:123-124`). Does the Chores feature's own completion path advance the next due date, and is that divergence intended? For the chores writer.
- **Q-403** Blocks §"Sources referenced". Is `base44/functions/deleteToDoItem/entry.ts` owned by this feature or by `10-architecture/google-sync.md`? Its non-Google actions duplicate the to-do component's own logic (D-411).
- **Q-404** Blocks `item-library.md` §Goals. When a goal has no incomplete milestone tasks, the goal itself is offered and the resulting schedule item's `source_id` is the goal id with source type `goal` (`src/pages/DailySchedule.jsx:1054-1056,1099`); the to-do's goal rows have no checkbox and completion routes to `GoalTask` (`src/components/DailyToDo.jsx:108,127-128`). Is scheduling the goal itself intended?
- **Q-405** Blocks §4 Active hours. With End earlier than Start the hour list is empty and the grid renders no rows (`src/pages/DailySchedule.jsx:137`). Is a validation rule intended?
