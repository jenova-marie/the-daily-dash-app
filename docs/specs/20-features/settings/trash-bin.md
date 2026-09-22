# Settings — Trash Bin (Level 2)

**Feature code:** `SET` · **Level:** 2 · **Parent:** `spec.md` · **Status:** draft

**Tag summary:** Implemented 24 · Described 2 · Partial 0

**Sources owned (this feature's bindings only):** `src/pages/Settings.jsx:148-151,173,178-226,987-1052` (the Trash Bin card)
**Sources referenced (owned elsewhere):** `src/pages/Tasks.jsx:347-367` (the only writer) → `20-features/tasks` (`google-tasks.md` §5 is the task-side view of the same trash); `base44/entities/TrashBin.jsonc`, `base44/entities/Task.jsonc` → `10-architecture/data-model/tasks.md`, `data-model/json-string-fields.md` §9; `base44/functions/deleteSyncedData/entry.ts`, `deleteUserAccount/entry.ts` → `10-architecture/admin-operations.md`; `src/pages/UserManual.jsx:111` → `20-features/user-manual`.

## 1. What the trash is

The **trash** (glossary) is the `TrashBin` entity: a per-account list of snapshots of deleted items, held so they can be restored from the Settings page. The card that shows it is titled **Trash Bin**. `[Implemented]` `base44/entities/TrashBin.jsonc:1-45`, `src/pages/Settings.jsx:987`

Manual: "Delete tasks via the action menu — deleted tasks can be recovered from the Trash Bin in Settings within 30 days." `[Described]` `src/pages/UserManual.jsx:111`

## 2. What enters the trash

- **Only tasks, and only from a single-row delete on the Tasks page.** The delete path writes one `TrashBin` row before removing the task: `item_type` `"task"`, `item_id` = the task's id, `item_data` = the whole task row serialised as JSON (including `id`, `created_by`, `created_date`, `updated_date`, and every task field), `deleted_at` = the current instant as an ISO string. `[Implemented]` `src/pages/Tasks.jsx:351-358`; `data-model/json-string-fields.md` §9
- **`item_type` enum:** the entity admits exactly one value, `task`. `[Implemented]` `base44/entities/TrashBin.jsonc:5-11`
- **Required fields:** `item_type`, `item_id`, `item_data`; `deleted_at` is optional in the schema and always written by the one writer. `[Implemented]` `base44/entities/TrashBin.jsonc:26-30`, `src/pages/Tasks.jsx:352,357`
- **Paths that do not write to the trash** (owned by their features, cited for completeness): Tasks page batch delete and mount-time deduplication (`src/pages/Tasks.jsx:331-337,93-118`), the daily to-do's delete of a task-sourced row (`src/components/DailyToDo.jsx:189`), Delete Synced Data and Delete All App Data (`base44/functions/deleteSyncedData/entry.ts:22-36,69-75`), account deletion (`base44/functions/deleteUserAccount/entry.ts:31-78`), and every delete of a chore, goal, milestone task, checklist item, schedule item, quote, link, or education activity. `[Implemented]` `20-features/tasks/google-tasks.md` §5a; absence of `TrashBin.create` anywhere in `src/` or `base44/functions/` other than `src/pages/Tasks.jsx:353`
- No backend function reads or writes `TrashBin`; the two wipe functions leave it untouched. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:50-60`, `base44/functions/deleteUserAccount/entry.ts:31-78` (`admin-operations.md` AR-ADMIN-28/35)

## 3. Retention window — as shown versus as described

- **As shown and enforced on the card:** the card reads the 50 most recent rows by `deleted_at` and keeps only rows where `(now − deleted_at) ≤ 24 hours` by the device clock. The card's own copy says "Items in trash can be restored for 24 hours". `[Implemented]` `src/pages/Settings.jsx:181-188,998`
- **As described in the manual:** "within 30 days". `[Described]` `src/pages/UserManual.jsx:111` (D-486, opened in `20-features/tasks/google-tasks.md`; cited here, not duplicated)
- **Rows are hidden, not removed.** Nothing deletes a row when it passes 24 hours; the row stays in the entity indefinitely unless the user permanently deletes it while it is still listed. `[Implemented]` `src/pages/Settings.jsx:184-188` (no delete outside `:207,219`)
- **Read cap before the window filter.** Only the 50 newest rows are fetched; if more than 50 rows were deleted within the last 24 hours, older ones inside the window are not listed. `[Implemented]` `src/pages/Settings.jsx:181`
- Cited open question **Q-462** (`google-tasks.md`): is the intended window 24 hours or 30 days, and are rows older than the window meant to be removed?

## 4. List contents

- The list is loaded on page mount and reloaded after every restore or permanent delete. `[Implemented]` `src/pages/Settings.jsx:173,208,220`
- Sorted newest deletion first (`-deleted_at`). `[Implemented]` `src/pages/Settings.jsx:181`
- Each row shows:
  - the snapshot's `title`, parsed from `item_data`; when the JSON cannot be parsed or has no title, "Untitled" `[Implemented]` `src/pages/Settings.jsx:1001-1004,1014`
  - "Deleted <MMM d, hh:mm>" from `deleted_at` in US short format (short month, numeric day, two-digit hour and minute) `[Implemented]` `src/pages/Settings.jsx:1005-1010,1015`
  - a **Restore** button (rotate icon) and a trash-icon button with no label `[Implemented]` `src/pages/Settings.jsx:1017-1044`
- The row does not show the item type, priority, label, due date, or whether the task was Google-linked. `[Implemented]` `src/pages/Settings.jsx:1012-1016`
- Both buttons on a row are disabled while either a restore or a permanent delete of that row is in flight; other rows stay enabled. `[Implemented]` `src/pages/Settings.jsx:1022,1036`

## 5. Restore

- **BR-SET-40 What Restore recreates.** The snapshot is parsed; when `item_type` is `task`, a new `Task` is created from every snapshot field except `id`. The platform assigns a **new id** and new `created_date` / `updated_date`. Fields carried over therefore include `title`, `description`, `status` (as it was at deletion, so a completed task is restored completed), `priority`, `category` and `category_color` (the label), `due_date`, `due_time`, `links`, recurrence fields, occurrence counts, `last_completed_date`, `google_task_id`, `synced_to_schedule`, `schedule_time`, and the snapshot's `created_by`, `created_date`, and `updated_date` values as submitted. `[Implemented]` `src/pages/Settings.jsx:200-204`, `base44/entities/Task.jsonc` (field list in `data-model/tasks.md`)
- **BR-SET-41 Trash row removed.** After the create succeeds, the trash row is deleted and the list reloads. If the create throws, the trash row is kept and the failure is logged only. `[Implemented]` `src/pages/Settings.jsx:204-211`
- **BR-SET-42 Non-task snapshots.** For any `item_type` other than `task`, Restore creates nothing and still deletes the trash row. With the enum limited to `task`, this branch is not reachable through the entity. `[Implemented]` `src/pages/Settings.jsx:201-207`, `base44/entities/TrashBin.jsonc:5-11`
- **Consequences owned by other features** (cited): schedule items that referenced the old task id are not re-linked (`google-tasks.md` §5b; Q-463); a restored task with a `google_task_id` is matched and updated in place by the next tasks import (`google-tasks.md` BR-TASK-41; `base44/functions/syncGoogleTasks/entry.ts:52-69`). `[Implemented]`
- No confirmation dialog, toast, or success message accompanies Restore; the row simply disappears and the Tasks page shows the task on its next load. `[Implemented]` `src/pages/Settings.jsx:197-214,1018-1031`

## 6. Permanent delete

- **BR-SET-43** The trash-icon button deletes the `TrashBin` row and reloads the list. No `Task` is touched (the task was already deleted), and nothing is sent to Google. No confirmation is asked. Failures are logged only. `[Implemented]` `src/pages/Settings.jsx:216-226,1032-1043`

## 7. States and copy (verbatim)

| State | Copy | Citation |
|---|---|---|
| loading | "Loading trash..." (with spinner) | `src/pages/Settings.jsx:989-993` |
| empty (no row within 24 h) | "Your trash bin is empty" | `:994-995` |
| non-empty header line | "Items in trash can be restored for 24 hours" | `:998` |
| row title fallback | "Untitled" | `:1014` |
| row subtitle | "Deleted <MMM d, hh:mm>" | `:1015` |
| buttons | "Restore" · (trash icon, no label) | `:1030,1041` |

All `[Implemented]`.

## 8. Data

| Entity | Operation | Fields | Citation |
|---|---|---|---|
| `TrashBin` | filter all, `-deleted_at`, limit 50 | `item_type`, `item_data`, `deleted_at` (read); `id` (for delete) | `src/pages/Settings.jsx:181,200-207,219` |
| `TrashBin` | delete | — | `:207,219` |
| `Task` | create | every snapshot field except `id` | `:203-204` |

Row-level access: every operation is limited to rows whose `created_by` is the signed-in user. `[Implemented]` `base44/entities/TrashBin.jsonc:31-44`

## 9. Acceptance criteria

- **AC-SET-40** Given a task "Call the dentist" deleted from the Tasks page, when the Trash Bin loads, then a row "Call the dentist" / "Deleted <MMM d, hh:mm>" appears under "Items in trash can be restored for 24 hours". (refs §2, §4)
- **AC-SET-41** Given that row, when Restore is clicked, then a new task with a different id and the same title, status, priority, label, due date, links, recurrence, and `google_task_id` exists, the row is gone, and no dialog was shown. (refs BR-SET-40, BR-SET-41)
- **AC-SET-42** Given that row, when the trash icon is clicked, then the row is gone, no task exists, and no dialog was shown. (refs BR-SET-43)
- **AC-SET-43** Given a task deleted 24 hours and one minute ago, when the Trash Bin loads, then it is not listed and its `TrashBin` row remains. (refs §3)
- **AC-SET-44** Given a chore, goal, or checklist item deleted anywhere in the app, when the Trash Bin loads, then it is not listed. (refs §2)
- **AC-SET-45** Given Delete All App Data has run, when the Trash Bin loads, then rows deleted within the last 24 hours are still listed. (refs §2; `admin-operations.md` AR-ADMIN-28)

## 10. Discrepancies & open questions

- No new discrepancy is opened here. **D-486** (`20-features/tasks/google-tasks.md`) records the 24-hour card copy and filter (`src/pages/Settings.jsx:184-188,998`) against the manual's "within 30 days" (`src/pages/UserManual.jsx:111`).
- Cited: **Q-462** (intended window; whether expired rows are meant to be removed) and **Q-463** (re-linking schedule items on restore), both in `google-tasks.md`.
- **Q-854** Blocks §2. Is the trash intended to grow to other item types (the entity name and `item_type` field are generic, the enum holds only `task`, and Restore branches on `item_type`)? `base44/entities/TrashBin.jsonc:5-11`, `src/pages/Settings.jsx:201`
