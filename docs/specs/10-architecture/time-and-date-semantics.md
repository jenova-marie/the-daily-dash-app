# Time & Date Semantics

**Area:** `TIME` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 40 · Described 4 · Partial 0

**Sources owned:** none exclusively; this document is the canonical home for the rules below and cites the owning files.
**Sources referenced:** `src/pages/Tasks.jsx`, `src/lib/recurringTaskUtils.js`, `src/pages/DailySchedule.jsx`,
`src/components/dashboard/DashboardTasks.jsx`, `src/pages/Chores.jsx`, `src/pages/Education.jsx`,
`src/components/MenuChoresWidget.jsx`, `src/components/dashboard/DashboardMenuChores.jsx`, `src/pages/Dashboard.jsx`,
`src/components/DailyToDo.jsx`, `src/pages/DailyChecklist.jsx`, `src/lib/useWeeklyChecklistCounts.js`,
`src/pages/Quotes.jsx`, `base44/workflows/*.jsonc`, `base44/functions/*`

Feature specs cite the `AR-TIME-nn` rules here and log their own divergences against the `D-` entries below. This
document does not choose between disagreeing implementations.

---

## 1. What "today" is

- **AR-TIME-01** "Today" is a `YYYY-MM-DD` string. Four different formatters produce it in the prototype. `[Implemented]`

| Formatter | Time basis | Where |
|---|---|---|
| A. Template literal `${getFullYear()}-${MM}-${DD}` | device local | `src/pages/Tasks.jsx:44,204-208`, `src/pages/Quotes.jsx:37-40`, `src/components/dashboard/DashboardQuote.jsx:7-10` |
| B. date-fns `format(new Date(), "yyyy-MM-dd")` | device local | `src/lib/recurringTaskUtils.js:4`, `src/components/dashboard/DashboardTasks.jsx:49`, `src/pages/Dashboard.jsx:75,111`, `src/pages/DailyChecklist.jsx:75,95`, `src/components/dashboard/DashboardChecklist.jsx:20`, `src/components/dashboard/DashboardFocalAreas.jsx:27`, `src/components/visionboard/LowScorePillars.jsx:10`, `src/components/MenuChoresWidget.jsx:34`, `src/components/dashboard/DashboardMenuChores.jsx:85`, `src/pages/DailySchedule.jsx:262,534`, `src/components/CondensedChecklist.jsx:14`, `src/pages/CalendarPage.jsx:103`, `src/components/visionboard/DailyEvaluation.jsx:64,120,195`, `src/lib/useWeeklyChecklistCounts.js:16`, `src/components/DailyToDo.jsx:118` |
| C. `new Date().toISOString().split('T')[0]` | UTC | `src/pages/Chores.jsx:68,326`, `src/pages/Education.jsx:56,292`, `src/pages/Chores.jsx:321`, `src/components/dashboard/DashboardMenuChores.jsx:30`, `src/pages/Education.jsx:277`, `src/pages/Tasks.jsx:312` |
| D. `new Date().toLocaleDateString('en-CA')` | server runtime locale/timezone | `base44/functions/fetchDailyQuote/entry.ts:10` (fallback when the client sends no date), `base44/functions/generateDailyQuotes/entry.ts:20` (comment: "YYYY-MM-DD in UTC") |

- `D-100` The same product concept "today" is derived locally (A, B) on most surfaces and from UTC (C) on the Chores and Education pages and in next-due calculations; both are `[Implemented]`.
- **AR-TIME-02** Weekday and day-of-month for "today" are taken from the device clock (`new Date().getDay()`, `getDate()`) on every client surface, including those that use formatter C for the date string. `[Implemented]` `src/pages/Chores.jsx:69-70`, `src/pages/Education.jsx:57-58`, `src/components/MenuChoresWidget.jsx:32-35`
- **AR-TIME-03** Date strings are parsed back into `Date` objects three ways: `new Date("YYYY-MM-DD")` (`src/lib/recurringTaskUtils.js:5,24,33,37`, `src/pages/Tasks.jsx:268`, `src/pages/CalendarPage.jsx:125-126`, `base44/functions/syncGoogleCalendarToApp/entry.ts:171`); `new Date(s + "T00:00:00")` (`src/pages/Tasks.jsx:150,155`, `src/pages/Education.jsx:64,70,93,629`, `src/pages/DailySchedule.jsx:255`); and `new Date(s + "T12:00:00")` (`src/pages/VisionBoard.jsx:111`). date-fns `parseISO` is used for goal target dates (`src/components/dashboard/DashboardGoals.jsx:13`). `[Implemented]`
- `D-134` Three parse conventions for `YYYY-MM-DD` strings coexist (see AR-TIME-03); all `[Implemented]`.

## 2. String formats

- **AR-TIME-10** Dates are `YYYY-MM-DD` strings on `Task.due_date`, `Task.last_completed_date`, `Chore.due_date`, `Chore.last_completed_date`, `EducationActivity.due_date`, `EducationActivity.last_completed_date`, `Goal.target_date`, `ScheduleItem.date`, `DailyChecklist`-related `ChecklistCompletion.date`, `DailyPillarTracking.date`, `DailyGratitude.date`, `DailyQuote.date`. `[Implemented]` `base44/entities/Task.jsonc:30-33,74-77`, `base44/entities/Chore.jsonc:54-57`, `base44/entities/EducationActivity.jsonc:25-28`
- **AR-TIME-11** Clock times are 24-hour `HH:MM` strings on `Task.due_time`, `ScheduleItem.start_time` / `end_time`, `DailyChecklist.time_of_day`, `ThemeSettings.sync_times` entries, and `ReminderSettings.times` entries. Comparisons are string comparisons. `[Implemented]` `src/components/DailyToDo.jsx:71-75`, `src/components/dashboard/DashboardFocalAreas.jsx:66-67`, `base44/entities/ThemeSettings.jsonc:67-70`, `base44/entities/ReminderSettings.jsonc:10-17`
- **AR-TIME-12** Timestamps are ISO-8601 strings from `toISOString()`: `ChecklistCompletion.completed_at`, `Goal.completed_at` / `started_at`, `TrashBin.deleted_at`, `SyncState.last_sync`, `SelectedCalendars.last_synced`. `UserCollageImage.signed_url_expires` is an epoch-millisecond number. `[Implemented]` `src/pages/DailyChecklist.jsx:155`, `src/components/dashboard/DashboardGoals.jsx:112`, `base44/functions/syncGoogleCalendarToApp/entry.ts:156,185`, `src/components/visionboard/PrivateImageUploader.jsx:15-18`
- **AR-TIME-13** `Task.schedule_time` holds an `HH:MM` string when set by the Daily Schedule (compared against the current `HH:MM`, `src/pages/DailySchedule.jsx:507-513`) and an ISO timestamp when set by `syncTasksToCalendar` (`base44/functions/syncTasksToCalendar/entry.ts:84`). `[Implemented]`
- `D-135` `Task.schedule_time` is written in two formats (AR-TIME-13).
- **AR-TIME-14** Google Calendar events are imported by slicing the `dateTime` string: date = characters 0–10, time = characters 11–16, without timezone conversion; all-day events become `00:00`–`23:59`. Pushes to Google build `new Date(`${date}T${time}:00`).toISOString()` (device/server local interpretation). `[Implemented]` `base44/functions/syncGoogleCalendarToApp/entry.ts:99-107`, `base44/functions/autoSync/entry.ts:77-85`, `base44/functions/syncAppEventToGoogle/entry.ts:28-29`
- **AR-TIME-15** Google Tasks `due` values are truncated at `T` to a date string on import; on push, `due` is `${dueDate}T${dueTime}:00` when a time exists, else the bare date. `[Implemented]` `base44/functions/syncGoogleTasks/entry.ts:63`, `base44/functions/updateGoogleTask/entry.ts:22-29`
- **AR-TIME-16** Display formats: header clock `EEE, MMM d · h:mm a` ticking every second (`src/components/Layout.jsx:60-63`, per briefing); "Last sync" via `toLocaleString()` (`src/pages/Settings.jsx:834`); calendar last-synced `short month, day, 2-digit year, hh:mm` (`:890`); weekly review `MMM d`; evaluation `MMMM d, yyyy`. `[Implemented]`

## 3. The missing-time sentinel

- **AR-TIME-20** When sorting by start time, an item with no time is given the string `"99:99"` so it sorts after every real `HH:MM`. Used by the Daily To-Do, the Calendar day panel, the condensed checklist (on `time_of_day`), and the Daily Schedule print format (per briefing). `[Implemented]` `src/components/DailyToDo.jsx:72-74`, `src/pages/CalendarPage.jsx:108-110`, `src/components/CondensedChecklist.jsx:34-36`
- **AR-TIME-21** The Daily Checklist page sorts items with no label after labelled ones using the sentinel `"\uFFFF"` (U+FFFF) (per briefing). `[Implemented]` `src/pages/DailyChecklist.jsx`

## 4. Week start and day ordering

- **AR-TIME-30** Weeks start on Sunday wherever a week is computed: the Calendar month grid (`startOfWeek` default), weekly checklist counts (`weekStartsOn: 0`), the Weekly Review, and the Vision Board review date. `[Implemented]` `src/pages/CalendarPage.jsx:98-99`, `src/lib/useWeeklyChecklistCounts.js:14-15`, `src/components/visionboard/WeeklyReview.jsx:20-21,46`, `src/pages/VisionBoard.jsx:57`
- **AR-TIME-31** Day-name arrays are Sunday-first where they index `getDay()` (`Sun … Sat`: `src/components/WeatherWidget.jsx:17`, `src/components/MenuChoresWidget.jsx:10`, `src/components/dashboard/DashboardMenuChores.jsx:11`, `src/components/TaskEditDialog.jsx:20`, `src/pages/Chores.jsx:69,86`, `src/pages/Education.jsx:57`) and Monday-first where they are displayed as pickers or menu days (`Mon … Sun`: `src/pages/Chores.jsx:22-23,87`, `src/pages/Education.jsx:119`, `src/components/ActivityGenerator.jsx:17`, `src/components/ChoreGenerator.jsx:15`). `[Implemented]`
- **AR-TIME-32** The Menu section of the Menu & Chores widget shows today through the coming Sunday (Sunday shows only itself); the Chores page Menu tab shows Monday through Sunday with today highlighted and the other days collapsed. `[Implemented]` `src/components/MenuChoresWidget.jsx:37-45`, `src/pages/Chores.jsx:86-90,803-806`
- `D-125` Menu week framing: today→Sunday (`src/components/MenuChoresWidget.jsx:38-45`) vs Monday→Sunday (`src/pages/Chores.jsx:87,803`).

## 5. Timers: midnight and periodic

- **AR-TIME-40 (Chores midnight reset)** While the Chores page is open, a timer fires at the next local midnight, sets every `completed` chore back to `pending`, reloads, and re-arms for the following midnight. `[Implemented]` `src/pages/Chores.jsx:150-180`
- **AR-TIME-41 (Checklist midnight rollover)** While the Daily Checklist page is open, a timer fires at the next local midnight, recomputes `today` (formatter B), reloads items and that day's completions, and re-arms. Completions are keyed by date, so the list appears unchecked on the new day without any write. `[Implemented]` `src/pages/DailyChecklist.jsx:84-104`
- **AR-TIME-42 (Weekly counts reset)** The weekly `n/7` counts reload at the next Sunday 00:00 local and re-arm. `[Implemented]` `src/lib/useWeeklyChecklistCounts.js:33-49`
- **AR-TIME-43 (Quotes date rollover)** The Daily Quotes page runs a 60-second interval that compares `format(new Date(), "yyyy-MM-dd")` with `getToday()` (formatter A of the same instant) and reloads the whole page when they differ. `[Implemented]` `src/pages/Quotes.jsx:54-63`
- **AR-TIME-44** `[Described]` "A fresh inspirational quote is generated automatically every day at midnight." `src/pages/Quotes.jsx:17`
- **AR-TIME-45 (Schedule now-line)** The Daily Schedule refreshes `now` every 60 s to move the current-time line and dim past hours; the line shows only when the selected date is today and the time is inside the visible hours. `[Implemented]` `src/pages/DailySchedule.jsx:150,534-538,700`
- **AR-TIME-46 (Header clock)** The shell clock updates every 1 s. `[Implemented]` `src/components/Layout.jsx:60-63`
- **AR-TIME-47 (Weather cache)** Weather is refetched only when the cached timestamp is older than 30 minutes. `[Implemented]` `src/components/WeatherWidget.jsx:37-44`
- **AR-TIME-48 (Signed URL refresh)** Private image URLs are refreshed when within 60 s of their expiry; new URLs last 3600 s. `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:6-20`
- **AR-TIME-49 (Reminder highlight)** The Focal Areas button highlights when no evaluation exists for today; if `ReminderSettings.enabled` with `times`, only once the current `HH:mm` has passed any listed time. `[Implemented]` `src/components/dashboard/DashboardFocalAreas.jsx:60-70`
- `Q-106` Under what condition does the Quotes rollover check (AR-TIME-43) observe two different strings for the same instant? Both operands are computed from the device clock in local time. Blocks §5.

## 6. Scheduled work: cron in UTC vs UI in local time

- **AR-TIME-50** All scheduled workflows run on UTC cron expressions: auto-sync `0 12 * * *`, collage initialisation `0 10 * * *`, daily quote generation `0 7 * * *` (described as "midnight Pacific time (07:00 UTC)"). `[Implemented]` `base44/workflows/Daily Auto-Sync.jsonc:10-12`, `base44/workflows/Initialize Collage Images for All Users.jsonc:10-12`, `base44/workflows/Midnight Daily Quote Generator.jsonc:3,10-12`
- **AR-TIME-51** The Settings page lets the user add `HH:MM` "Scheduled sync times" stored in `ThemeSettings.sync_times`, with the copy "Syncs run automatically at these times each day." `[Implemented]` `src/pages/Settings.jsx:958-980`, `base44/entities/ThemeSettings.jsonc:67-70`
- **AR-TIME-52** The `autoSync` function reads `sync_sources` only; it does not read `sync_times`, `auto_sync_calendar_ids`, or `SelectedTaskLists`. It syncs every `SelectedCalendars` row with `is_selected: true` and every Google task list. `[Implemented]` `base44/functions/autoSync/entry.ts:14-18,26,116-134`
- `D-112` Auto-sync timing and scope: UI-configured times per day and auto-sync calendar/task-list selections (`src/pages/Settings.jsx:907-980`) vs a single fixed 12:00 UTC run over `is_selected` calendars and all task lists (`base44/workflows/Daily Auto-Sync.jsonc:10`, `base44/functions/autoSync/entry.ts:26,116-134`).
- **AR-TIME-53** The server-side daily quote date is formatter D in the function runtime; the client-side quote date is formatter A on the device, and the client passes its date to `fetchDailyQuote`. `[Implemented]` `base44/functions/generateDailyQuotes/entry.ts:20`, `src/pages/Quotes.jsx:71`, `src/components/dashboard/DashboardQuote.jsx:32-44`
- `D-116` "Midnight" for quotes is 07:00 UTC in the workflow (`base44/workflows/Midnight Daily Quote Generator.jsonc:3,10`), local midnight for the page reload (`src/pages/Quotes.jsx:54-63`), and the onboarding copy says "every day at midnight" (`src/pages/Quotes.jsx:17`).
- `Q-107` What timezone does the function runtime apply to `toLocaleDateString('en-CA')` (formatter D)? The source comment asserts UTC. Blocks §6.

## 7. Sync windows

- **AR-TIME-60 (Manual calendar import)** `syncGoogleCalendarToApp` requests events from 90 days before now to 60 days after now (`timeMin`/`timeMax`, `singleEvents`, `orderBy=startTime`, `maxResults=250`) and removes local calendar items that fall inside that window and no longer appear in Google, only for calendars fetched successfully. `[Implemented]` `base44/functions/syncGoogleCalendarToApp/entry.ts:19-20,61-66,160-182`
- **AR-TIME-61 (Auto-sync calendar import)** `autoSync` requests events from 30 days before now with no upper bound, paging through `nextPageToken`. `[Implemented]` `base44/functions/autoSync/entry.ts:31,40-57`
- **AR-TIME-62** `[Described]` "Events sync for the past 30 days and forward." `src/components/onboarding/CalendarOnboarding.jsx:19`, `src/pages/UserManual.jsx:149,421`
- `D-113` Import window: 90 days back / 60 forward (manual) vs 30 days back / unbounded (auto) vs "past 30 days and forward" (copy).
- **AR-TIME-63 (Tasks to calendar)** `syncTasksToCalendar` creates a one-hour Google event starting at the task's `due_date` + `due_time`. `[Implemented]` `base44/functions/syncTasksToCalendar/entry.ts:59-67`
- **AR-TIME-64** Sync state records `last_sync` as an ISO timestamp per run; per-calendar `last_synced` likewise. `[Implemented]` `base44/functions/syncGoogleCalendarToApp/entry.ts:156,185`, `base44/functions/autoSync/entry.ts:33,63,98`

## 8. Canonical definitions: due today, overdue, upcoming, completed this period

Each implementation is recorded exactly as it behaves. Formatter letters refer to §1.

### 8.1 Tasks

| Rule | `src/pages/Tasks.jsx` | `src/lib/recurringTaskUtils.js` | `src/components/dashboard/DashboardTasks.jsx` | `src/pages/DailySchedule.jsx` (item library) | `src/components/DailyToDo.jsx` |
|---|---|---|---|---|---|
| Reference date | today, formatter A (`:44`) | today, formatter B (`:4`) | today, formatter B (`:49`) | the **selected** date (`:496-521`) | the **selected** date (`:53-54`) |
| Input set | all tasks, newest 100 (`:141`) | one task | `status: "pending"`, newest 200 (`:52`) | tasks not completed and not already scheduled on the selected date (per briefing) | all tasks not already scheduled on the date |
| Due today | not completed AND `due_date === today` (`:167-170`) | "shows today": (`due_date ≤ today` AND status `pending`) OR recurring: `daily` → true; `weekly` → `due_date` weekday equals today's weekday (true when no `due_date`); `monthly` → `due_date` day-of-month equals today's (else `last_completed_date` day-of-month, else true); other patterns → false (`:3-44`) | `due_date === today` OR `shouldTaskShowToday(t)` (`:66`) | `due_date === selectedDate`, status ignored (`:496-499`) | `due_date === dateStr`, status ignored; row id `due-task-<id>` (`:53-67`) |
| Overdue | not completed AND `due_date < today` (`:172-175`) | not defined (overdue-and-pending is folded into "shows today") | `due_date < today` (`:64`) | not completed AND (`due_date < selectedDate` OR (`due_date === selectedDate` AND (`schedule_time` or `due_time`) is earlier than the current `HH:MM`)) (`:501-516`) | not defined |
| Due or overdue | `isDueToday OR isOverdue` (`:177`) | — | — | `due_date ≤ selectedDate` (`:518-521`) | — |
| Upcoming | filter `not-due-yet`: not completed AND `due_date > today` (`:191-192`) | — | not shown | not shown | — |
| Unscheduled | not completed, no `due_date`, not recurring (`:188-190`) | — | — | included in the library (no due date) | — |
| Completed this period | `last_completed_date` set AND: daily → equals today; weekly → fewer than 7 days ago; biweekly → fewer than 14 days ago; days_of_week → equals today; monthly → same `YYYY-MM` (`:145-165`) | — | — | — | — |
| Completion stamps `last_completed_date` with | today (A) (`:239,249`) | — | not stamped (`:75-80`) | — | the **selected** date (B) (`:118-121`) |
| Next occurrence base | `due_date` if set else now, parsed with `new Date()`; +1 day / +7 days or next matching weekday within 7 days / +14 days / next matching weekday within 7 days else +1 day / +1 month; written via formatter C (`:268-317`) | — | — | — | — |

- `D-101` Task "due today": status-gated exact match (`Tasks.jsx:167-170`) vs exact match or recurrence rule (`DashboardTasks.jsx:66`) vs exact match against the selected date ignoring status (`DailySchedule.jsx:496-499`, `DailyToDo.jsx:53-55`).
- `D-102` Task "overdue": date-only (`Tasks.jsx:172-175`, `DashboardTasks.jsx:64`) vs date-or-passed-time relative to the selected date (`DailySchedule.jsx:501-516`).
- `D-109` Weekly recurrence day source: `days_of_week` when present (`Tasks.jsx:270-284`) vs the `due_date` weekday (`recurringTaskUtils.js:20-28`).
- `D-126` `last_completed_date` on completion: today (`Tasks.jsx:239,249`) vs the selected schedule date (`DailyToDo.jsx:118-121`) vs not written (`DashboardTasks.jsx:75-80`).
- `D-137` Next-due base date: from `due_date` for tasks (`Tasks.jsx:268`) vs from the completion moment for chores and education (`Chores.jsx:312-322,328`, `Education.jsx:270-278,293`).

### 8.2 Chores

| Rule | `src/pages/Chores.jsx` | `src/components/MenuChoresWidget.jsx` | `src/components/dashboard/DashboardMenuChores.jsx` | `src/pages/DailySchedule.jsx` | `src/pages/Dashboard.jsx` (badge) |
|---|---|---|---|---|---|
| Reference date | today, formatter C; weekday and day-of-month from device (`:68-70`) | today, formatter B (`:31-35`) | today, formatter B (`:82-86`) | count: selected date `dateStr` for `due_date` and monthly; **today's** weekday for weekly (`:245-258`); status badge: today (B) (`:262-275`) | today, formatter B; full weekday (`:75-76`) |
| Input set | all chores loaded by the page | chores passed in by the Daily Schedule | all chores, newest 500 (`:57`) | chores loaded for the page | `status: "pending"`, newest 300 (`:80`) |
| Meal exclusion | none inside the rule (Menu tab and Chores tab filter separately, `:538-539`) | `chore_type` in {Breakfast, Lunch, Dinner, Snack, Meal} excluded (`:55`) | same five excluded (`:105`) | `chore_type === "Meal"` excluded (`:249,266`) | `chore_type === "Meal"` excluded (`:84`) |
| Assignment required | no | yes, `assigned_to` set (`:56`) | yes (`:106`) | yes (`:250,267`) | no |
| Due today | not completed AND (`daily` OR (`weekly` AND `day_of_week` includes today's full name) OR `due_date === today` OR (`monthly` AND day-of-month of `due_date` equals today's)) (`:71-78`) | same rule plus the exclusions above (`:53-62`) | same as MenuChoresWidget (`:103-112`) | same rule with `dateStr` for the date and monthly parts and today's weekday for the weekly part (`:247-258`); badge uses today throughout (`:264-275`) | `due_date === today` OR `daily` OR (`weekly` AND full weekday); no monthly rule (`:85-87`) |
| Overdue | not defined | not defined | not defined | `chore_type !== "Meal"` AND `due_date < today` AND not completed AND `assigned_to` (`:276`) | `due_date && due_date < today` (`:88`) |
| Meals shown for a day | `daily` OR `day_of_week` includes the short day name (`:790-795`) | same (`:48-49`) | same (`:99-100`) | — | — |
| Completion | sets `completed`, `last_completed_date` = today (C), and `due_date` = next due from now: daily +1 d, weekly +7 d, biweekly +14 d, monthly +1 month, quarterly +3 months, yearly +1 year, as_needed none (`:312-338`) | — | same next-due calculation (`:22-31`, per briefing) | — | — |
| Reset | all completed chores → pending at local midnight while the page is open (`:150-180`) | — | — | — | — |

- `[Described]` Chores onboarding advertises "frequencies with overdue highlighting" (per briefing, `src/components/onboarding/ChoresOnboarding.jsx`); no overdue rule exists on the Chores page.
- `D-103` Chore "due today": with/without assignment requirement, with/without meal exclusion, and with a five-value vs one-value meal set (rows above).
- `D-104` Chore "overdue": defined only in `DailySchedule.jsx:276` (assigned, non-"Meal", not completed) and `Dashboard.jsx:88` (any pending non-"Meal"); absent on the Chores page.
- `D-127` The Daily Schedule chore count mixes the selected date (for `due_date` and monthly) with today's weekday (for weekly) (`src/pages/DailySchedule.jsx:246-258`).

### 8.3 Education

| Rule | `src/pages/Education.jsx` | `src/pages/Dashboard.jsx` (badge) | `src/pages/DailySchedule.jsx` |
|---|---|---|---|
| Reference date | `today` string via formatter C (`:56`); `currentToday` = device local midnight `Date` (`:60-61`); short weekday and day-of-month from device (`:57-58`) | today, formatter B; short weekday (`:75,77`) | count: selected date; badge: today (B) (`:241,281,285-288`) |
| Input set | all activities loaded by the page | `completed: false`, 200 (`:81`) | count: `EducationActivity.filter({ due_date: dateStr })` (`:241`); badge: newest 500 (`:285`) |
| Due today | false if `last_completed_date` is today; false if `completed` AND `once`; else true if `due_date` is today; or `daily`; or `weekly` AND `days_of_week` includes today's short name; or `biweekly` AND (`days_of_week` includes today OR `due_date` is today); or `monthly` AND `due_date` day-of-month equals today's (`:63-89`) | `due_date === today` OR `daily` OR (`weekly` AND `days_of_week` includes short weekday) (`:96-98`) | count: `due_date === dateStr` AND not completed AND `last_completed_date !== dateStr` (`:281`); badge: `due_date === today` AND not completed (`:287`) |
| Overdue ("Past") | not completed AND (`due_date` strictly before today; OR `weekly` with some `days_of_week` entry earlier in the week than today and today not included; OR `monthly` with `due_date` day-of-month less than today's) (`:91-111`) | `due_date && due_date < today` (`:99`) | `due_date < today` AND not completed (`:286`) |
| Upcoming ("Next") | not completed AND has `due_date` AND 0 < days until due ≤ 7 (`:627-633`, pill count `:945`) | — | — |
| Done | `completed` AND `frequency === "once"` (`:1008`) | — | — |
| Completion | recurring: `completed: true`, `last_completed_date` = today (C), `due_date` = next due from now: daily +1 d, weekly +7 d, biweekly +14 d, monthly +30 d; `once` or un-completing: flips `completed`, clears `last_completed_date` (`:270-278,290-303`) | — | — |

- `D-105` Education "due today": the full recurrence rule (`Education.jsx:63-89`) vs a three-clause rule (`Dashboard.jsx:96-98`) vs exact `due_date` match only (`DailySchedule.jsx:241,281,287`).
- `D-106` Education "overdue": date-or-earlier-weekday-or-earlier-day-of-month (`Education.jsx:91-111`) vs date-only (`Dashboard.jsx:99`, `DailySchedule.jsx:286`).
- `D-107` Monthly next-due: +1 calendar month for chores (`Chores.jsx:317`, `DashboardMenuChores.jsx:27`) vs +30 days for education (`Education.jsx:276`).

### 8.4 Goals and checklist (for completeness)

- **AR-TIME-70** A goal is "due" on the dashboard when its `target_date` (parsed with `parseISO`) is today or earlier; without a target date, `daily`, `weekly`, `monthly`, `annual`, and `occurrences` timeframes count as due and `3_year`/`5_year` do not. `[Implemented]` `src/components/dashboard/DashboardGoals.jsx:10-30`
- **AR-TIME-71** The Daily Schedule Goals library marks a goal due today when `target_date === selectedDate` and overdue when `target_date < selectedDate`. `[Implemented]` `src/pages/DailySchedule.jsx:1097-1099`
- **AR-TIME-72** A checklist item is complete for a date when a `ChecklistCompletion` row exists for that item and date with `completed: true`; the weekly count is the number of such rows in the Sunday–Saturday week containing today. `[Implemented]` `src/pages/DailyChecklist.jsx:107-115,155`, `src/lib/useWeeklyChecklistCounts.js:12-31`
- **AR-TIME-73** Weather forecast day labels use the UTC weekday of the forecast date string. `[Implemented]` `src/components/WeatherWidget.jsx:97`
- `D-128` Weekday labelling: UTC (`WeatherWidget.jsx:97`) vs local everywhere else (AR-TIME-02).

## 9. Retention windows

- **AR-TIME-80** Trash Bin lists items whose `deleted_at` is within the last 24 hours (up to 50 rows). `[Implemented]` `src/pages/Settings.jsx:181-188,998`
- **AR-TIME-81** `[Described]` "deleted tasks can be recovered from the Trash Bin in Settings within 30 days." `src/pages/UserManual.jsx:111` (`D-114`)
- **AR-TIME-82** Label history keeps 30 entries; schedule recent history keeps 10; background library keeps 20; daily quote de-duplication looks at the last 200 quotes; weather cache lasts 30 minutes; signed URLs last one hour. `[Implemented]` `src/utils/labelHistory.js:11`, `src/pages/DailySchedule.jsx:403`, `src/pages/ThemeEditor.jsx:131`, `base44/functions/fetchDailyQuote/entry.ts:16`, `src/components/WeatherWidget.jsx:40`, `src/components/visionboard/PrivateImageUploader.jsx:13`

---

## Discrepancies opened here

| ID | Summary |
|---|---|
| D-100 | "Today" derived locally (`src/pages/Tasks.jsx:44`, `src/lib/recurringTaskUtils.js:4`) vs from UTC (`src/pages/Chores.jsx:68`, `src/pages/Education.jsx:56`). |
| D-101 | Task due-today definitions (`src/pages/Tasks.jsx:167-170`, `src/components/dashboard/DashboardTasks.jsx:66`, `src/pages/DailySchedule.jsx:496-499`, `src/components/DailyToDo.jsx:53-55`). |
| D-102 | Task overdue definitions (`src/pages/Tasks.jsx:172-175`, `src/pages/DailySchedule.jsx:501-516`). |
| D-103 | Chore due-today definitions (`src/pages/Chores.jsx:71-78`, `src/components/MenuChoresWidget.jsx:53-62`, `src/pages/DailySchedule.jsx:247-275`, `src/pages/Dashboard.jsx:85-87`). |
| D-104 | Chore overdue defined in `src/pages/DailySchedule.jsx:276` and `src/pages/Dashboard.jsx:88` only. |
| D-105 | Education due-today definitions (`src/pages/Education.jsx:63-89`, `src/pages/Dashboard.jsx:96-98`, `src/pages/DailySchedule.jsx:241,281,287`). |
| D-106 | Education overdue definitions (`src/pages/Education.jsx:91-111`, `src/pages/Dashboard.jsx:99`, `src/pages/DailySchedule.jsx:286`). |
| D-107 | Monthly next due +1 month (`src/pages/Chores.jsx:317`) vs +30 days (`src/pages/Education.jsx:276`). |
| D-109 | Weekly recurrence day source (`src/pages/Tasks.jsx:270-284` vs `src/lib/recurringTaskUtils.js:20-28`). |
| D-112 | Auto-sync times/scope in UI (`src/pages/Settings.jsx:907-980`) vs fixed cron and inputs (`base44/workflows/Daily Auto-Sync.jsonc:10`, `base44/functions/autoSync/entry.ts:14-26,116-134`). |
| D-113 | Calendar import window (`base44/functions/syncGoogleCalendarToApp/entry.ts:19-20` vs `base44/functions/autoSync/entry.ts:31` vs `src/components/onboarding/CalendarOnboarding.jsx:19`). |
| D-116 | Quote "midnight" (`base44/workflows/Midnight Daily Quote Generator.jsonc:3,10` vs `src/pages/Quotes.jsx:17,54-63`). |
| D-125 | Menu week framing (`src/components/MenuChoresWidget.jsx:38-45` vs `src/pages/Chores.jsx:87,803`). |
| D-126 | `last_completed_date` stamped with today vs the selected date vs not at all (`src/pages/Tasks.jsx:239,249`, `src/components/DailyToDo.jsx:118-121`, `src/components/dashboard/DashboardTasks.jsx:75-80`). |
| D-127 | Daily Schedule chore count mixes selected date and today's weekday (`src/pages/DailySchedule.jsx:246-258`). |
| D-128 | Weather weekday from UTC (`src/components/WeatherWidget.jsx:97`) vs local elsewhere. |
| D-134 | Three `YYYY-MM-DD` parse conventions (`src/lib/recurringTaskUtils.js:5`, `src/pages/Education.jsx:64`, `src/pages/VisionBoard.jsx:111`). |
| D-135 | `Task.schedule_time` as `HH:MM` (`src/pages/DailySchedule.jsx:507-513`) vs ISO (`base44/functions/syncTasksToCalendar/entry.ts:84`). |
| D-137 | Next-due base: task `due_date` (`src/pages/Tasks.jsx:268`) vs completion moment for chores/education (`src/pages/Chores.jsx:328`, `src/pages/Education.jsx:293`). |

## Open questions

| ID | Question | Blocks |
|---|---|---|
| Q-106 | Under what condition do the two operands of the Quotes rollover check (`src/pages/Quotes.jsx:56-60`) differ, given both are local-time strings of the same instant? | §5 AR-TIME-43 |
| Q-107 | What timezone does the backend runtime apply to `toLocaleDateString('en-CA')` in `generateDailyQuotes` and `fetchDailyQuote`? | §6 AR-TIME-53 |
