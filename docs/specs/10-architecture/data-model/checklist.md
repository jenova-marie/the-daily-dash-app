# Data Model — Checklist & Gratitude

**Area:** `DATA` · **Level:** 2 · **Status:** draft · Conventions: `README.md`

### DailyChecklist   (E-DailyChecklist)

**Purpose.** A repeating routine item in a time-of-day bucket, with optional clock time, label, colour, and
manual order. `[Implemented]` `base44/entities/DailyChecklist.jsonc:1-56`

**Source file.** `base44/entities/DailyChecklist.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/DailyChecklist.jsonc:42-55`

**Service-role bypasses.** `deleteUserAccount`. `[Implemented]` `base44/functions/deleteUserAccount/entry.ts:37-39`

**Cardinality.** Many per owner; no uniqueness rule.

**Writers.** create: `src/pages/DailyChecklist.jsx:120`. update: `src/pages/DailyChecklist.jsx:170,304`.
delete: `src/pages/DailyChecklist.jsx:127,140`, `base44/functions/deleteSyncedData/entry.ts:54`,
`base44/functions/deleteUserAccount/entry.ts:37-39`.
**Readers.** `src/pages/DailyChecklist.jsx:108`, `src/components/CondensedChecklist.jsx:22`,
`src/components/dashboard/DashboardChecklist.jsx:29`, `src/components/visionboard/WeeklyReview.jsx:25`
(all `filter({ is_active: true })`).

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `title` | string | yes | — | free text | Item name | `DailyChecklist.jsx:120,170` | all readers |
| `description` | string | no | — | — | Declared; never written | none | none |
| `time_of_day` | string | no | — | `HH:MM` or `""` | Optional clock time | `DailyChecklist.jsx:120,170` | `CondensedChecklist.jsx:34-36` (sort) |
| `is_active` | boolean | no | `true` | — | Included in lists | `DailyChecklist.jsx:120` (`true`) | all readers filter on `true` |
| `order` | number | no | `0` | integer position within its bucket | Manual order | `DailyChecklist.jsx:120` (form `0`), `:304` (drag result) | `DailyChecklist.jsx:112`, `CondensedChecklist.jsx:38`, `WeeklyReview.jsx:37` |
| `category` | string | no | — | `morning` · `afternoon` · `evening` · `anytime` (form default `morning`) | Time-of-day bucket | `DailyChecklist.jsx:120,170,304` (drag between buckets) | `DailyChecklist.jsx:176-181`, `CondensedChecklist.jsx:29-32` |
| `label` | string | no | — | free-text label | Label | `DailyChecklist.jsx:120,170` | grouping `DailyChecklist.jsx:182` |
| `label_color` | string | no | `#3b82f6` | hex (form default `#3b82f6`, reset form `""`) | Label colour | `DailyChecklist.jsx:120,170` | rendering |

**References out.** None. **Referenced by.** `ChecklistCompletion.checklist_item_id`. `[Implemented]`
`base44/entities/ChecklistCompletion.jsonc:5-7`

**Lifecycle.**
- *Created* from the form with `is_active: true`; the label is remembered in device label history.
  `[Implemented]` `src/pages/DailyChecklist.jsx:117-124`
- *Updated* by the edit dialog (`title`, `time_of_day`, `category`, `label`, `label_color`) and by drag-and-drop,
  which rewrites `order` (index within bucket) and `category` for every moved row. `[Implemented]`
  `src/pages/DailyChecklist.jsx:161-174,282-310`
- *Hard-deleted* singly, in batch, by the full wipe, and on account deletion. Completions for the item are
  not deleted. `[Implemented]` `src/pages/DailyChecklist.jsx:126-144`, `base44/functions/deleteSyncedData/entry.ts:54`,
  `base44/functions/deleteUserAccount/entry.ts:37-39`
- *Soft-deleted*: `is_active: false` is never written by code. *Purged*: none.

**Ordering & read-time sort/limit.** `filter({ is_active: true })` unsorted; the page sorts by `order`;
the condensed view sorts by bucket (`morning`, `afternoon`, `evening`, `anytime`), then `time_of_day`
(missing last), then `order`. `[Implemented]` `src/pages/DailyChecklist.jsx:112`,
`src/components/CondensedChecklist.jsx:28-39`

**Denormalised caches / Retention.** None / indefinite.

**Declared-but-unwritten fields.** `description`; `is_active: false`. `[Implemented]`
`base44/entities/DailyChecklist.jsonc:8-10,14-17`. **Written-but-undeclared fields.** None.
**Required-but-written-empty.** None observed.

---

### ChecklistCompletion   (E-ChecklistCompletion)

**Purpose.** The tick for one checklist item on one date. Kept as separate rows so weekly counts can be
derived. `[Implemented]` `base44/entities/ChecklistCompletion.jsonc:1-38`, `src/lib/useWeeklyChecklistCounts.js:12-31`

**Source file.** `base44/entities/ChecklistCompletion.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/ChecklistCompletion.jsonc:24-37`

**Service-role bypasses.** `deleteUserAccount`. `[Implemented]` `base44/functions/deleteUserAccount/entry.ts:40-42`

**Cardinality.** One per item per date by convention: toggling looks for an existing row for the item in
the loaded date's completions and updates it, else creates. `[Implemented]` `src/pages/DailyChecklist.jsx:150-159`,
`src/components/CondensedChecklist.jsx:49-65`, `src/components/dashboard/DashboardChecklist.jsx:40-56`

**Writers.** create/update: `src/pages/DailyChecklist.jsx:153,155`, `src/components/CondensedChecklist.jsx:52,57`,
`src/components/dashboard/DashboardChecklist.jsx:43,48`. delete: `base44/functions/deleteSyncedData/entry.ts:54`,
`base44/functions/deleteUserAccount/entry.ts:40-42`.
**Readers.** `src/pages/DailyChecklist.jsx:109`, `src/components/CondensedChecklist.jsx:23`,
`src/components/dashboard/DashboardChecklist.jsx:30`, `src/components/visionboard/WeeklyReview.jsx:26`,
`src/lib/useWeeklyChecklistCounts.js:20` (all `filter({ date })`).

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `checklist_item_id` | string | yes | — | `DailyChecklist.id` | Item | all creators | all readers |
| `date` | string | yes | — | `YYYY-MM-DD` | The day | all creators | filter key |
| `completed` | boolean | no | `false` | — | Ticked | creators write `true`; toggles flip it | `isCompleted` checks, weekly counts |
| `completed_at` | string | no | — | ISO date-time; `null` on untick | When ticked | all writers | none observed |

**References out.** `checklist_item_id` → `DailyChecklist.id`. **Referenced by.** None.

**Lifecycle.** *Created* with `completed: true` on first tick of a day; *updated* to flip `completed` and set
or clear `completed_at`; never deleted by the user; *hard-deleted* by the full wipe and on account deletion.
Rows for deleted checklist items remain. `[Implemented]` `src/pages/DailyChecklist.jsx:150-159`,
`base44/functions/deleteSyncedData/entry.ts:54`, `base44/functions/deleteUserAccount/entry.ts:40-42`

**Ordering & read-time sort/limit.** Per-date filters, unsorted, no limit; weekly views issue seven per-day
filters (Sunday–Saturday). `[Implemented]` `src/lib/useWeeklyChecklistCounts.js:13-21`,
`src/components/visionboard/WeeklyReview.jsx:20-27`

**Denormalised caches / Retention.** None / indefinite (the "resets each day" behaviour is a consequence of
per-date rows, not a purge). `[Implemented]` `src/pages/DailyChecklist.jsx:32-33,104`

**Declared-but-unwritten / Written-but-undeclared / Required-but-written-empty.** None observed.

---

### DailyGratitude   (E-DailyGratitude)

**Purpose.** One gratitude entry per date, captured as the last step of the daily evaluation. `[Implemented]`
`base44/entities/DailyGratitude.jsonc:1-69`, `src/components/visionboard/DailyEvaluation.jsx:30,145-153`

**Source file.** `base44/entities/DailyGratitude.jsonc`

**Declared RLS.** Owner or admin for all four operations (verbatim in `README.md` §2). `[Implemented]`
`base44/entities/DailyGratitude.jsonc:19-68`

**Service-role bypasses.** None. Not in `deleteUserAccount`; in the full-wipe list. `[Implemented]`
`base44/functions/deleteSyncedData/entry.ts:58`, `base44/functions/deleteUserAccount/entry.ts:31-78`

**Cardinality.** One per date by convention: the evaluation loads `filter({ date })`, remembers the first
row's id, and updates it on save. `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:79-83,146-152`

**Writers.** create: `src/components/visionboard/DailyEvaluation.jsx:150`. update: `:148`. delete: `:199`,
`base44/functions/deleteSyncedData/entry.ts:58`.
**Readers.** `src/components/visionboard/DailyEvaluation.jsx:79,198`, `src/components/dashboard/DashboardFocalAreas.jsx:33`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `date` | string | yes | — | `YYYY-MM-DD` | Evaluation date | `DailyEvaluation.jsx:150` | filter key |
| `entry` | string | yes | — | trimmed free text | The gratitude | `DailyEvaluation.jsx:148,150` | `DailyEvaluation.jsx:81` |

**References out / Referenced by.** None.

**Lifecycle.** *Created* on evaluation save when the gratitude text is non-blank and no row was loaded;
*updated* when a row exists; *hard-deleted* for the date when the evaluation is deleted, and by the full
wipe. Blank text on save leaves any existing row untouched. `[Implemented]`
`src/components/visionboard/DailyEvaluation.jsx:145-153,192-199`, `base44/functions/deleteSyncedData/entry.ts:58`

**Ordering & read-time sort/limit.** `filter({ date })` unsorted. **Denormalised caches / Retention.** None / indefinite.

**Declared-but-unwritten / Written-but-undeclared / Required-but-written-empty.** None observed.

---

## Discrepancies & open questions (this sheet)

- **D-012** Checklist ordering: the Daily Checklist page sorts loaded items by `order` alone and groups
  by `category` afterwards (`src/pages/DailyChecklist.jsx:112,176-181`); the condensed checklist on the Daily
  Schedule sorts by `category` rank, then `time_of_day`, then `order` (`src/components/CondensedChecklist.jsx:28-39`);
  the dashboard widget sorts each bucket by label (items without a label last) and then by `order` (`src/components/dashboard/DashboardChecklist.jsx:71-78`).
