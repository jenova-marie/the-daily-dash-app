# Tasks — Google Tasks & Trash (Level 2)

**Feature code:** `TASK` · **Level:** 2 · **Parent:** `spec.md` · **Status:** draft

**Tag summary:** Implemented 41 · Described 8 · Partial 2

**Sources owned (this feature's bindings only):** `src/pages/Tasks.jsx` (delete dialog, `syncGoogleTasks` call), `src/components/TaskEditDialog.jsx` (Google checkbox, `updateGoogleTask` call)
**Sources referenced (owned elsewhere):** `base44/functions/syncGoogleTasks/entry.ts`, `base44/functions/updateGoogleTask/entry.ts`, `base44/functions/getGoogleTaskLists/entry.ts`, `base44/functions/autoSync/entry.ts`, `base44/functions/deleteSyncedData/entry.ts` → `10-architecture/google-sync.md`; `src/pages/Settings.jsx` (Integrations, Sync dialog, Auto-Sync Schedule, Trash Bin, Manage App Data cards) → `20-features/settings`; `src/pages/Auth.jsx` (sign-up integration choice) → `20-features/auth`; `base44/entities/ThemeSettings.jsonc`, `base44/entities/TrashBin.jsonc`, `base44/entities/SelectedTaskLists` → `10-architecture/data-model/`.

This document describes what the account owner experiences, on the Tasks page and in Settings, for Google Tasks: connecting, importing, the default label applied to imported tasks, how matched tasks are updated, the delete choice, and the due-date push gated by a checkbox. It then covers the trash: what a delete writes, how a task is restored, and the retention window. Function internals are owned by `10-architecture/google-sync.md`; they are cited here by name and line only where the user-visible outcome depends on them.

## 1. Connecting Google Tasks

- Settings → **Integrations** lists two connectors. The Google Tasks card reads **Google Tasks** with description **Sync tasks to your task manager** and a ✓ icon. Its button is **Connect** when disconnected, **Connecting...** (disabled) during the OAuth popup, and **Connected** (green) once linked; pressing **Connected** opens the disconnect confirm. `[Implemented]` `src/pages/Settings.jsx:23-26,817-860`
- Connection status is probed through the `checkConnectorStatus` function on Settings load. `[Implemented]` `src/pages/Settings.jsx:153-166`
- Disconnect confirm, verbatim: **Disconnect Google Tasks?** / **This will remove the connection. You can reconnect anytime. Your Google data will not be affected.** Buttons **Cancel**, **Disconnect**. `[Implemented]` `src/pages/Settings.jsx:1156-1170`
- After a successful connection a dismissible banner appears: **Google Tasks connected!** / **Before syncing, scroll down to "Auto-Sync Schedule" and choose which task lists to include under "Task lists to auto-sync".** `[Implemented]` `src/pages/Settings.jsx:405-406,789-806`
- At sign-up the auth flow offers **Connect Google Account** ("Sync Google Calendar events and Google Tasks automatically on app load.") versus **Use Independently**; choosing Google runs the Calendar then the Tasks OAuth popups (owned by `20-features/auth`). `[Implemented]` `src/pages/Auth.jsx:312-328`
- Manual: "Connect Google Tasks in Settings" / "Connect Google Tasks to sync task lists from Google into the app." `[Described]` `src/pages/UserManual.jsx:128,429`

## 2. Importing (Sync)

### 2a. Where the Sync control lives

- There is no sync control on the Tasks page. `[Implemented]` `src/pages/Tasks.jsx:369-853` (no such control among the page's controls)
- The **↻ Sync** button is in Settings, inside the **Select Calendars to Sync** card, which is shown when either connector is connected or any saved calendars or task lists exist. `[Implemented]` `src/pages/Settings.jsx:864-876`
- Manual: "use the **"Sync"** button to pull tasks in" and "Use the **Sync Tasks** button to pull tasks in." `[Described]` `src/pages/UserManual.jsx:128,430` (D-480: the button reads "Sync" and opens a source-choice dialog)

### 2b. The sync dialog

- Pressing Sync opens an alert dialog, verbatim: title **What would you like to sync?**, body **Choose what to sync right now.**, two checkboxes **📅 Google Calendar Events** and **✓ Google Tasks**, buttons **Cancel** and **Sync Selected** (disabled when neither is ticked). `[Implemented]` `src/pages/Settings.jsx:1111-1150`
- The checkbox choices are the account preference `ThemeSettings.sync_sources` (JSON array of "calendar" / "tasks"), defaulting to both ticked; they are also what the scheduled auto-sync honours. `[Implemented]` `src/pages/Settings.jsx:133,235,250,288`, `base44/entities/ThemeSettings.jsonc:71-74`, `base44/functions/autoSync/entry.ts:16-18,113`
- While syncing the dialog cannot be dismissed (outside click and Escape are blocked); its title becomes **Syncing...**, body **Please wait while your data is being synced. Do not close this window.**, with a spinner and **Syncing your data...** `[Implemented]` `src/pages/Settings.jsx:1111-1123`
- With Google Tasks ticked, **Sync Selected** invokes the `syncGoogleTasks` function (after the calendar sync when both are ticked). `[Implemented]` `src/pages/Settings.jsx:457-462,1144-1147`

### 2c. Result messages

- Success: **✓ Synced N new tasks and updated M existing tasks**, shown for 4 seconds. `[Implemented]` `src/pages/Settings.jsx:471-474`, `base44/functions/syncGoogleTasks/entry.ts:78-82`
- No connection: **✗ Google Tasks is disconnected. Please reconnect it above.** and the connector card flips to disconnected. `[Implemented]` `src/pages/Settings.jsx:463-467,475-479`, `base44/functions/syncGoogleTasks/entry.ts:14-19`
- Other failure: **✗ Tasks sync failed: <message>**. `[Implemented]` `src/pages/Settings.jsx:468-470,480-482`

### 2d. What the import does to the task list

- **BR-TASK-40** Every task list in the Google account is read; Google tasks flagged hidden are skipped. `[Implemented]` `base44/functions/syncGoogleTasks/entry.ts:27-50`
- **BR-TASK-41 Matched-by-id rule.** For each Google task, an existing task with the same `google_task_id` (and the same creator) is looked up. If found it is updated; otherwise a new task is created. Manual: "Existing tasks matched by Google Task ID are updated; new ones are created." and "Matched tasks update automatically." `[Implemented]` `base44/functions/syncGoogleTasks/entry.ts:52-74`; `[Described]` `src/pages/UserManual.jsx:430,128`
- **BR-TASK-42 Imported fields.** Title (or "Untitled"), description from Google notes, status `completed` when Google says completed else `pending`, `google_task_id`, `due_date` = the date part of Google's due value (none when Google has none), label = the account's default sync label, colour = the account's default sync colour. On an update these same fields replace the existing values, including the label, colour, and status. No due time, links, priority, or recurrence is imported; a created task therefore has priority `medium`, no time, no links, and is non-recurring. `[Implemented]` `base44/functions/syncGoogleTasks/entry.ts:58-74`, `base44/entities/Task.jsonc:20-29,43-45`
- **BR-TASK-43 Default label and colour.** The label applied is `ThemeSettings.task_sync_category`, falling back to the literal **Google Tasks**; the colour is `ThemeSettings.task_sync_color`, falling back to empty (so rows show the default cyan, spec.md BR-TASK-18). No control in the prototype's Settings, Theme Editor, or Tasks page writes either field. Manual: "Set a **default sync category** in Settings to apply automatically to newly synced Google Tasks." / "Set a default **task category label and color** to apply automatically to synced tasks." `[Partial]` `base44/entities/ThemeSettings.jsonc:79-86`, `base44/functions/syncGoogleTasks/entry.ts:21-24` (no writer in `src/`); `[Described]` `src/pages/UserManual.jsx:129,431` (D-481)
- **BR-TASK-44 Scheduled import.** The `autoSync` function, at the account's scheduled sync times and when `sync_sources` includes "tasks", performs the same list-by-list import but applies the literal label **Google Tasks** with no colour, without reading the account's default label. Its result line reads "Tasks: N new, M updated" or "Tasks: skipped (<message>)". `[Implemented]` `base44/functions/autoSync/entry.ts:113-150` (D-482)
- **Task lists to auto-sync.** Settings → **Auto-Sync Schedule** has a section **✓ Task lists to auto-sync** with a **Load Lists** (later **Refresh**) button that invokes `getGoogleTaskLists`, which records each Google list in `SelectedTaskLists` (`list_id`, `list_name`, `is_selected` true by default); each list then appears as a checkbox whose toggle updates that record. Empty state: **Click "Load Lists" to choose which task lists to include.** Neither the manual import nor the scheduled import reads this selection; both read every list. `[Partial]` `src/pages/Settings.jsx:316-331,528-539,549-556,931-954`, `base44/functions/getGoogleTaskLists/entry.ts:25-51`, `base44/functions/syncGoogleTasks/entry.ts:39-40`, `base44/functions/autoSync/entry.ts:125` (D-483)
- Imported tasks appear on the Tasks page and in the dashboard widget exactly like local tasks, with the extra edit-dialog note **Synced with Google Tasks** and the extra delete choice (§4). `[Implemented]` `src/components/TaskEditDialog.jsx:155`, `src/pages/Tasks.jsx:339-345`
- Landing page: "Seamlessly sync Google Calendar, Google Tasks, and Google Drive for unified productivity." `[Described]` `src/pages/LandingPage.jsx:12`

## 3. Pushing changes to Google (edit dialog)

- **BR-TASK-45** The Edit Task dialog shows the checkbox **Apply permanent changes to Google Tasks** only for tasks with a `google_task_id`; it starts ticked for such tasks. `[Implemented]` `src/components/TaskEditDialog.jsx:30,311-316`
- **BR-TASK-46** On Save, after the local update and the schedule-item propagation, if the task is Google-linked and the checkbox is ticked, the `updateGoogleTask` function is invoked with the Google task id and the new due date and due time. The function replaces the Google task's due value with `<date>T<time>:00` when both are set, the date alone when only the date is set, or clears it when the date is empty; it addresses the task in Google's default list. Title, notes, status, priority, and label are not pushed. A push failure is logged and does not undo the local save or block the dialog from closing. `[Implemented]` `src/components/TaskEditDialog.jsx:113-123`, `base44/functions/updateGoogleTask/entry.ts:12-49`
- Unticking the checkbox saves locally only; the task keeps its `google_task_id`, so the next import replaces the local due date with Google's (BR-TASK-42). `[Implemented]` `src/components/TaskEditDialog.jsx:114`, `base44/functions/syncGoogleTasks/entry.ts:58-69`
- Completing a Google-linked task on the Tasks page or the dashboard does not push the completion to Google. `[Implemented]` `src/pages/Tasks.jsx:226-322`, `src/components/dashboard/DashboardTasks.jsx:75-80` (no Google call)
- Creating a task on the Tasks page does not create it in Google. `[Implemented]` `src/pages/Tasks.jsx:201-222`
- Manual: sync "pull[s] tasks in bidirectionally". `[Described]` `src/pages/UserManual.jsx:128` (D-484: the app-to-Google direction covers the due value only, and only from the edit dialog with the checkbox ticked)

## 4. Deleting a Google-linked task

- **BR-TASK-47** After the shared "Delete Item?" confirm (spec.md §4.6), a task with a `google_task_id` opens a second dialog, verbatim: **Delete Task** / **This task is synced with Google Tasks. Would you like to delete it from Google Tasks as well?** with **Cancel**, **Delete here only**, **Delete from Google too**. Tasks without a Google id skip this dialog. `[Implemented]` `src/pages/Tasks.jsx:339-345,820-840`
- **Delete here only** runs the normal delete path: trash snapshot, schedule-item lookup, delete, optional notice (spec.md §4.6). The Google task is untouched and, because the local record is gone, the next import creates it again as a new task (BR-TASK-41). `[Implemented]` `src/pages/Tasks.jsx:347-367`, `base44/functions/syncGoogleTasks/entry.ts:52-74`
- **Delete from Google too** first invokes `syncGoogleTasks` with `{ deleteTaskId: <google_task_id> }`, then runs the same local delete path. The `syncGoogleTasks` function does not read a request body; when invoked it performs the full import described in §2d and returns the sync summary. No code in the function deletes a Google task. `[Implemented]` `src/pages/Tasks.jsx:347-350`; `[Implemented]` `base44/functions/syncGoogleTasks/entry.ts:3-87` (D-485)
- Batch delete never shows the Google dialog and never calls a Google function (spec.md §4.7). `[Implemented]` `src/pages/Tasks.jsx:331-337`
- Settings → **Manage App Data** → **Delete Synced Data** ("Remove all synced Google Calendar events and tasks. Your Google data remains unchanged.") removes every task that has a `google_task_id`, without trash snapshots (owned by `20-features/settings`). `[Implemented]` `src/pages/Settings.jsx:1054-1058`, `base44/functions/deleteSyncedData/entry.ts:22-32,75`

## 5. Trash

### 5a. What a delete writes

- **BR-TASK-50** A single-row delete on the Tasks page (either Google choice, or a non-Google task) creates a `TrashBin` row before the task is deleted: `item_type` "task", `item_id` = the task id, `item_data` = the full task serialised as JSON, `deleted_at` = the current instant in ISO form. `[Implemented]` `src/pages/Tasks.jsx:351-358`, `base44/entities/TrashBin.jsonc:4-30`
- `TrashBin.item_type` admits only "task". `[Implemented]` `base44/entities/TrashBin.jsonc:5-11`
- Batch delete, mount-time deduplication, the daily to-do's delete of a task-sourced row, and Delete Synced Data write no trash rows. `[Implemented]` `src/pages/Tasks.jsx:331-337,114`, `src/components/DailyToDo.jsx:189`, `base44/functions/deleteSyncedData/entry.ts:27-28`
- Manual: "deleted tasks can be recovered from the Trash Bin in Settings within 30 days." `[Described]` `src/pages/UserManual.jsx:111`

### 5b. The Trash Bin card (Settings) — task-side view

Card mechanics are owned by `20-features/settings`; recorded here because the only restorable item type is a task.

- The card **Trash Bin** reads the 50 most recent trash rows by `deleted_at` and lists only those deleted within the last 24 hours. Older rows are not shown and are not removed by any code in this feature. `[Implemented]` `src/pages/Settings.jsx:178-195`
- States: **Loading trash...**; **Your trash bin is empty**; otherwise the note **Items in trash can be restored for 24 hours** followed by one row per item showing the snapshot's title (or **Untitled**) and "Deleted <Mon d, hh:mm>". `[Implemented]` `src/pages/Settings.jsx:987-1016`
- Each row has **Restore** and a trash-icon button (permanent delete); both disable while either operation on that row is in flight. `[Implemented]` `src/pages/Settings.jsx:1017-1044`
- **BR-TASK-51 Restore.** The snapshot JSON is parsed; for `item_type` "task", every field except `id` is written as a new `Task` record; the trash row is then deleted and the list reloads. The restored task keeps its title, status, priority, label, dates, links, recurrence fields, counts, and `google_task_id`, but has a new id. `[Implemented]` `src/pages/Settings.jsx:197-214`
- Schedule items that referenced the old task id are not re-linked to the restored task; on the Tasks page the restored task therefore has no linked items until it is placed on the schedule again. `[Implemented]` `src/pages/Settings.jsx:203-204` (no `ScheduleItem` write on restore)
- A restored task with a `google_task_id` is matched by the next import and updated in place (BR-TASK-41). `[Implemented]` `base44/functions/syncGoogleTasks/entry.ts:52-69`
- **BR-TASK-52 Permanent delete.** Removes the trash row only. `[Implemented]` `src/pages/Settings.jsx:216-226`
- **BR-TASK-53 Retention window.** The Settings card lists and labels a 24-hour window; the manual states 30 days. `[Implemented]` `src/pages/Settings.jsx:184-188,998`; `[Described]` `src/pages/UserManual.jsx:111` (D-486)

## 6. Acceptance criteria

- **AC-TASK-40** Given Google Tasks is connected and the sync dialog has only "✓ Google Tasks" ticked, when the user presses Sync Selected, then every non-hidden task in every Google list exists locally with the default sync label, and the message "✓ Synced N new tasks and updated M existing tasks" appears for about four seconds. (refs BR-TASK-40..43)
- **AC-TASK-41** Given a local task whose `google_task_id` matches a Google task whose title changed in Google, when an import runs, then the local title, description, status, due date, label, and colour equal the Google values and the default label. (refs BR-TASK-41, BR-TASK-42)
- **AC-TASK-42** Given `ThemeSettings.task_sync_category` is empty, when an import runs, then newly imported tasks carry the label "Google Tasks" with no colour. (refs BR-TASK-43)
- **AC-TASK-43** Given a Google-linked task open in the Edit Task dialog with the Google checkbox ticked, when the user sets due date 2026-09-25 and time 14:00 and saves, then the local task is updated and the Google task's due value becomes "2026-09-25T14:00:00". (refs BR-TASK-45, BR-TASK-46)
- **AC-TASK-44** Given the same dialog with the checkbox unticked, when saved, then only the local task changes. (refs BR-TASK-46)
- **AC-TASK-45** Given a Google-linked task, when the user confirms the shared delete dialog, then the "Delete Task" three-button dialog appears; choosing "Delete here only" removes the task locally, writes a trash row, and leaves Google unchanged. (refs BR-TASK-47, BR-TASK-50)
- **AC-TASK-46** Given a task deleted from the Tasks page ten minutes ago, when the user opens Settings, then the Trash Bin lists it with "Deleted <time>" and Restore recreates it as a new task with the same fields and removes it from the trash. (refs BR-TASK-51)
- **AC-TASK-47** Given a task deleted 25 hours ago, when the user opens Settings, then the Trash Bin does not list it. (refs BR-TASK-53)

## 7. Discrepancies & open questions

- **D-480** The manual names the control "Sync" / "Sync Tasks" as a task-pulling button (`src/pages/UserManual.jsx:128,430`); the prototype's control is a Settings button "↻ Sync" that opens the "What would you like to sync?" dialog with a Google Tasks checkbox (`src/pages/Settings.jsx:873-875,1111-1150`); the Tasks page has no sync control.
- **D-481** The manual says the default sync category label and colour are set in Settings (`src/pages/UserManual.jsx:129,431`); `ThemeSettings.task_sync_category` / `task_sync_color` exist and are read by the import (`base44/entities/ThemeSettings.jsonc:79-86`, `base44/functions/syncGoogleTasks/entry.ts:21-24`), but no control in `src/` writes them.
- **D-482** The manual import applies `ThemeSettings.task_sync_category` / `task_sync_color` with fallback "Google Tasks" / empty (`base44/functions/syncGoogleTasks/entry.ts:21-24,64-65`); the scheduled import applies the literal label "Google Tasks" and no colour (`base44/functions/autoSync/entry.ts:135`).
- **D-483** Settings stores a per-list selection in `SelectedTaskLists` under the heading "Task lists to auto-sync" (`src/pages/Settings.jsx:931-954,549-556`); both the manual import and the scheduled import read every Google list without consulting it (`base44/functions/syncGoogleTasks/entry.ts:39-40`, `base44/functions/autoSync/entry.ts:125`).
- **D-484** The manual describes the sync as bidirectional (`src/pages/UserManual.jsx:128`); the app-to-Google direction consists of the due value pushed from the edit dialog when the checkbox is ticked (`src/components/TaskEditDialog.jsx:113-120`, `base44/functions/updateGoogleTask/entry.ts:21-42`); completion, creation, title, and label changes are not pushed.
- **D-485** "Delete from Google too" invokes `syncGoogleTasks` with `{ deleteTaskId }` (`src/pages/Tasks.jsx:348-350`); the function does not read the request body and performs an import (`base44/functions/syncGoogleTasks/entry.ts:3-87`).
- **D-486** The manual says trashed tasks are recoverable "within 30 days" (`src/pages/UserManual.jsx:111`); the Settings card lists items deleted within 24 hours and says "Items in trash can be restored for 24 hours" (`src/pages/Settings.jsx:184-188,998`).
- **Q-460** Blocks: §4. Question: what is "Delete from Google too" intended to do in Google (delete, or mark completed), and which Google list is meant to be addressed, given `updateGoogleTask` uses the default list (`base44/functions/updateGoogleTask/entry.ts:35`)?
- **Q-461** Blocks: §2d. Question: on an import update, is the local label and colour of an already-imported task meant to be replaced with the default sync label each time (`base44/functions/syncGoogleTasks/entry.ts:64-69`)?
- **Q-462** Blocks: §5b. Question: is the intended retention window 24 hours or 30 days (D-486), and are trash rows older than the window meant to be removed?
- **Q-463** Blocks: §5b. Question: is Restore meant to re-link schedule items that referenced the deleted task's old id (`src/pages/Settings.jsx:203-204`)?
