# Data Model — Serialised and Encoded Fields

**Area:** `DATA` · **Level:** 2 · **Status:** draft · Conventions: `README.md`

`AR-DATA-10`: the fields below are declared as plain strings but carry JSON or a delimited encoding. Each
entry gives the inner shape, the writer that serialises it, the reader that parses it, and an example.
Readers wrap parsing in `try/catch` and fall back to an empty value where noted.

## 0. Field identity notes

- `Task.google_task_id` holds either a Google Tasks task id (written by the two imports) or a Google Calendar
  event id (written by the calendar push). Nothing records which kind a given row holds. `[Implemented]`
  `base44/functions/autoSync/entry.ts:135`, `base44/functions/syncGoogleTasks/entry.ts:62`,
  `base44/functions/syncTasksToCalendar/entry.ts:82`

## 1. `ThemeSettings.widget_order`

- **Shape:** JSON array of widget id strings. Known ids: `weather`, `focal-areas`, `checklist`, `schedule`,
  `tasks`, `menu-chores`, `goals`, `quote`. On read, ids missing from the saved array are appended in default
  order. `[Implemented]` `src/pages/Dashboard.jsx:22-31,123-128,145-150`
- **Writer:** `JSON.stringify(newOrder)` on drag end and on "save as default". `[Implemented]` `src/pages/Dashboard.jsx:145,166`
- **Example:** `["quote","checklist","weather","focal-areas","schedule","tasks","menu-chores","goals"]`

## 2. `ThemeSettings.sync_times`

- **Shape:** JSON array of `HH:MM` strings. `[Implemented]` `base44/entities/ThemeSettings.jsonc:67-70`
- **Writer:** `JSON.stringify(timesToSave)`. **Reader:** Settings only (`JSON.parse(... || "[]")`); no backend
  function reads it (the scheduled sync runs at a fixed cron). `[Implemented]` `src/pages/Settings.jsx:235,287`,
  `base44/workflows/Daily Auto-Sync.jsonc:10-12`
- **Example:** `["07:00","12:30"]`

## 3. `ThemeSettings.sync_sources`

- **Shape:** JSON array containing any of `"calendar"`, `"tasks"`. Absent field means both. `[Implemented]`
  `base44/functions/autoSync/entry.ts:16-18`, `src/pages/CalendarPage.jsx:193-195`
- **Writer:** `JSON.stringify(sourcesToSave)`. **Readers:** Settings, Calendar page manual sync, scheduled sync.
  `[Implemented]` `src/pages/Settings.jsx:235,288`
- **Example:** `["calendar","tasks"]`

## 4. `ThemeSettings.auto_sync_calendar_ids`

- **Shape:** JSON array of `SelectedCalendars` row ids (not Google calendar ids). `[Implemented]`
  `src/pages/Settings.jsx:300-306,513-518`
- **Writer:** `JSON.stringify(updated)` on toggle. **Reader:** Settings only. `[Implemented]` `src/pages/Settings.jsx:289,518`
- **Example:** `["68f1c2…","68f1c3…"]`

## 5. `ThemeSettings.onboarding_status`

- **Shape:** JSON object mapping a walkthrough key to `true`. A key is removed (not set false) to re-arm a
  walkthrough. Keys observed: `tasks_onboarded`, `goals_onboarding_done`, `quotes_onboarded`,
  `dashboard_onboarded`, `dailychecklist_onboarded`. `[Implemented]` `src/components/GenericOnboardingDialog.jsx:20-22`,
  `src/components/onboarding/TasksOnboarding.jsx:6,40-42`, `src/components/onboarding/GoalsOnboarding.jsx:6,45-47`,
  `src/pages/Quotes.jsx:308`, `src/pages/Dashboard.jsx:335`, `src/pages/DailyChecklist.jsx:55-57,591`
- **Writer:** `JSON.stringify(status)`; a fresh row is created with the literal `"{}"`. **Readers:** each page's
  first-visit check, `JSON.parse(... || "{}")`. `[Implemented]` `src/pages/Tasks.jsx:65`, `src/pages/Goals.jsx:69`,
  `src/pages/Quotes.jsx:46`
- **Example:** `{"tasks_onboarded":true,"goals_onboarding_done":true}`

## 6. `ThemeSettings.background_library`

- **Shape:** declared as a true string array (not a JSON string): URLs, most recent first, capped at 20.
  `[Implemented]` `base44/entities/ThemeSettings.jsonc:14-20`, `src/pages/ThemeEditor.jsx:131,160`
- **Writer:** array literal on add/remove/save; mirrored to device key `theme_bg_history`. **Reader:** Theme
  Editor load (`Array.isArray` guard, set-union with the device copy). `[Implemented]` `src/pages/ThemeEditor.jsx:88-92,135,147,163`
- **Example:** `["https://…/bg1.jpg","https://…/bg2.jpg"]`

## 7. `Task.links`

- **Shape:** JSON array of URL strings. `[Implemented]` `base44/entities/Task.jsonc:88-91`
- **Writer:** `JSON.stringify(links)` from the task edit dialog. **Readers:** the edit dialog and the Tasks
  list, `JSON.parse` with fallback `[]`. `[Implemented]` `src/components/TaskEditDialog.jsx:57-62,93`, `src/pages/Tasks.jsx:655`
- **Example:** `["https://example.com/doc","https://example.com/video"]`

## 8. `EducationActivity.resource_links`

- **Shape:** JSON array of URL strings. `[Implemented]` `base44/entities/EducationActivity.jsonc:58-61`
- **Writer:** `JSON.stringify(links)` from the activity links dialog. **Reader:** same dialog, fallback `[]`.
  `[Implemented]` `src/components/education/ActivityLinksDialog.jsx:12-18,31-34`, `src/components/education/SubjectCard.jsx:49`
- **Example:** `["https://example.com/worksheet.pdf"]`

## 9. `TrashBin.item_data`

- **Shape:** JSON object: the full `Task` row as loaded, including `id`, `created_by`, `created_date`,
  `updated_date` and every task field. `[Implemented]` `src/pages/Tasks.jsx:356`
- **Reader:** restore parses it, drops `id`, and creates a Task from the rest. `[Implemented]` `src/pages/Settings.jsx:200-204`
- **Example:** `{"id":"…","title":"Call the dentist","status":"pending","priority":"medium","due_date":"2026-09-22","category":"Health","category_color":"#ef4444","is_recurring":false,"created_by":"owner@example.com","created_date":"…","updated_date":"…"}`

## 10. `Link.thumbnail_url` icon encoding

- **Shape:** either an image URL, or the string `icon:<IconName>|<hex>` where `IconName` is one of the
  picker's Lucide names (`Folder`, `ExternalLink`, `Link2`, `Globe`, `Star`, `Heart`, `Bookmark`, `FileText`,
  `Image`, `Music`, `Video`, `Code`, `Terminal`, `Database`, `Cloud`, `Mail`, `Phone`, `Calendar`, `Clock`,
  `Map`, …) and `<hex>` a colour. Missing parts default to `ExternalLink` and `#6366f1`. `[Implemented]`
  `src/pages/Links.jsx:17-37,508-514,524,561-565`
- **Writer:** `` `icon:${name}|${color}` `` from the thumbnail picker; switching back to the URL tab writes `""`.
  **Reader:** `startsWith("icon:")`, then `slice(5).split("|")`. `[Implemented]` `src/pages/Links.jsx:514,522-524,562-564`
- **Example:** `icon:Bookmark|#f59e0b`

## 11. Delimited text fields

- **`Goal.milestones`**: newline-separated lines (declared; read by print only, never written). `[Implemented]`
  `src/pages/Goals.jsx:315`
- **`EducationActivity.notes`** written by the generator: `<description>\n\nDuration: <duration>\nMaterials: <materials>`;
  by the library assign: description, `Duration: …`, `Materials: …` joined with `\n`, blanks omitted.
  `[Implemented]` `src/components/ActivityGenerator.jsx:156`, `src/components/ActivityLibrary.jsx:112`
- **`ChoreLibrary.description`** for generated meals: `<description>\nAge Group: <ageGroup>`. `[Implemented]`
  `src/components/ChoreGenerator.jsx:187`
- **`GoalTask.title`** for multi-occurrence generated goals: `<activity> (<i>/<N>)`. `[Implemented]`
  `src/components/visionboard/PillarManager.jsx:233`, `src/components/visionboard/DailyEvaluation.jsx:175`

## 12. Arrays declared as arrays (for contrast)

These are real arrays, not serialised: `Task.days_of_week`, `Chore.day_of_week`, `EducationActivity.days_of_week`,
`DailyPillarTracking.selected_activities`, `ReminderSettings.times`, `ThemeSettings.background_library`.
`[Implemented]` `base44/entities/Task.jsonc:68-73`, `base44/entities/Chore.jsonc:27-32`,
`base44/entities/EducationActivity.jsonc:40-54`, `base44/entities/DailyPillarTracking.jsonc:28-35`,
`base44/entities/ReminderSettings.jsonc:10-17`, `base44/entities/ThemeSettings.jsonc:14-20`

## 13. Related device-local encodings (not entity fields)

Listed because they shadow entity data; registry owner is `10-architecture/preferences.md`.

| Key | Shape | Relation to entities | Citation |
|---|---|---|---|
| `app_label_history` | JSON `[{label, color}]`, max 30 | labels used on Task, DailyChecklist, Goal | `src/utils/labelHistory.js:1-21` |
| `chore_custom_rooms`, `chore_deleted_rooms` | JSON `string[]` | Chore/ChoreLibrary `room` | `src/lib/choreRooms.js:1-90` |
| `schedule_custom_history` | JSON `[{title, duration}]`, max 10 | custom blocks removed from the schedule | `src/components/DailyToDo.jsx:170-179`, `src/pages/DailySchedule.jsx:402-405` |
| `pinned_library_items` | JSON `string[]` of library item ids | Daily Schedule library | `src/pages/DailySchedule.jsx:117,531` |
| `deleted_collage_images` | JSON `string[]` of CollageImage ids | hides rows after delete | `src/components/visionboard/ImageGallery.jsx:24-25,39-40` |
| `theme_bg_history` | JSON `string[]` URLs | mirror of `ThemeSettings.background_library` | `src/pages/ThemeEditor.jsx:58,88-92` |
| `default_theme` | JSON of the theme object | Theme Editor "set as default" | `src/pages/ThemeEditor.jsx:181` |
| `link_categories_v2` (`link_categories` v1) | JSON `[{name, icon, color}]` | `Link.category` names | `src/pages/Links.jsx:71-89` |
| `edu_custom_subjects` | JSON `string[]` | `EducationPlan.subject` options | `src/pages/Education.jsx:230` |
| `tasks_onboarded`, `goals_onboarding_done`, `quotes_onboarded`, `dailychecklist_onboarded`, `dashboard_onboarded`, `visionboard_onboarded`, … | `"true"` / `"1"` | device mirrors of `onboarding_status` keys | `src/pages/Tasks.jsx:62,67`, `src/pages/Goals.jsx:66,71` |
