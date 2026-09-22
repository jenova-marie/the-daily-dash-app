# Data Model — Chores

**Area:** `DATA` · **Level:** 2 · **Status:** draft · Conventions: `README.md`

### Chore   (E-Chore)

**Purpose.** An assigned household chore, or a meal when `chore_type` is one of `Breakfast`, `Lunch`,
`Dinner`, `Snack`, `Meal` (meals show on the Menu and are excluded from chore lists; for meals `room`
holds the meal slot). `[Implemented]` `base44/entities/Chore.jsonc:1-90`, `src/pages/Chores.jsx:538-539,574-576`,
`src/components/dashboard/DashboardMenuChores.jsx:98-101`

**Source file.** `base44/entities/Chore.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/Chore.jsonc:76-89`

**Service-role bypasses.** `deleteToDoItem` (`delete_app` with `sourceType: "chore"`) after ownership check;
`deleteUserAccount`. `[Implemented]` `base44/functions/deleteToDoItem/entry.ts:81,89-97`,
`base44/functions/deleteUserAccount/entry.ts:49-51`

**Cardinality.** Many per owner; one row per assignee. Creating for several members writes one row per
member; duplicates are skipped when `assigned_to`, lower-cased `title`, `frequency`, lower-cased `room`,
`priority`, and trimmed `chore_type` all match an existing row. `[Implemented]` `src/pages/Chores.jsx:230-242`

**Writers (entity-wide).** create: `src/pages/Chores.jsx:240,421,522`, `src/components/ChoreGenerator.jsx:161`,
`src/components/ChoreLibraryDialog.jsx:169`. update: `src/pages/Chores.jsx:159,329,335,410,511`,
`src/components/dashboard/DashboardMenuChores.jsx:138,144`, `src/components/DailyToDo.jsx:124`.
delete: `src/pages/Chores.jsx:291,498`, `src/components/DailyToDo.jsx:190`, `base44/functions/deleteToDoItem/entry.ts:97`,
`base44/functions/deleteSyncedData/entry.ts:53,61-62`, `base44/functions/deleteUserAccount/entry.ts:49-51`.

**Readers (entity-wide).** `src/pages/Chores.jsx:190`, `src/components/ChoreLibraryDialog.jsx:54`,
`src/components/dashboard/DashboardMenuChores.jsx:57`, `src/pages/Dashboard.jsx:80`, `src/pages/DailySchedule.jsx:236`,
`base44/functions/deleteToDoItem/entry.ts:13`. subscribe: `src/components/dashboard/DashboardMenuChores.jsx:75`,
`src/pages/DailySchedule.jsx:186`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `title` | string | yes | — | free text | Chore or meal name | all creators; `Chores.jsx:388,410` | all readers; duplicate keys `Chores.jsx:233,417,515` |
| `description` | string | no | — | free text | Details | `Chores.jsx:221,389`, `ChoreGenerator.jsx:163`, `ChoreLibraryDialog.jsx:157` | rendering |
| `assigned_to` | string | no | — | `ChoreUser.id`; `""` when unassigned | Assignee | `Chores.jsx:240` (`uid` from `assigned_to_ids`), `:399-410` (first selected id or existing), `:421,511,522`, `ChoreGenerator.jsx:164` (`user.id` or `""`), `ChoreLibraryDialog.jsx:158` | `Chores.jsx:533-535` (matches id, or the member's name), `:597` (`getUserName` by id), `DashboardMenuChores.jsx:79,118`, `ChoreLibraryDialog.jsx:63`, `DailySchedule.jsx:250,267,276` (truthiness) |
| `frequency` | string | no | — | `once` · `daily` · `weekly` · `biweekly` · `monthly` · `quarterly` · `yearly` · `as_needed` | Repeat cadence | `Chores.jsx:222,390`, `ChoreGenerator.jsx:158,165` (meals forced to `weekly`; otherwise one of daily/weekly/biweekly/monthly else `weekly`), `ChoreLibraryDialog.jsx:159` | due logic `Chores.jsx:71-78`, `DashboardMenuChores.jsx:103-111`, `DailySchedule.jsx:251-256`; next-due `Chores.jsx:312-322` |
| `day_of_week` | string[] | no | — | full names `Monday`..`Sunday` for chores; `Mon`..`Sun` for meals | Days for weekly items | `Chores.jsx:225,393` (full names, `:22,340-347`), `ChoreGenerator.jsx:166` (meals, short names `:15`), `ChoreLibraryDialog.jsx:166-168` (copied) | `Chores.jsx:74,564-569,643,793`, `DashboardMenuChores.jsx:103-111`, `DailySchedule.jsx:252,269` |
| `room` | string | no | — | free text, title-cased on save; meal slot for meals (`Breakfast` … `Other`) | Location, or meal slot | `Chores.jsx:223,391` (`normalizeRoom`), `ChoreGenerator.jsx:130,167` (`mealType` or `"Meal"` for meals), `ChoreLibraryDialog.jsx:160` | `Chores.jsx:541-545,580-584`, `DashboardMenuChores.jsx:101,119` |
| `priority` | string | no | `medium` | `low` · `medium` · `high` | Priority | `Chores.jsx:224,392`, `ChoreGenerator.jsx:160,168`, `ChoreLibraryDialog.jsx:161` | duplicate keys, rendering |
| `status` | string | no | `pending` | `pending` · `completed` · `skipped` | Completion | `Chores.jsx:159,330,335,421,522`, `DashboardMenuChores.jsx:139,144`, `DailyToDo.jsx:124`, `ChoreGenerator.jsx:169`, `ChoreLibraryDialog.jsx:163` | `Chores.jsx:71,157,590-596`, `Dashboard.jsx:80`, `DailySchedule.jsx:248,265,276` |
| `due_date` | string | no | — | `YYYY-MM-DD` | Next due date | `Chores.jsx:332`, `DashboardMenuChores.jsx:141` (next date after completion, not for `as_needed`) | `Chores.jsx:72-75`, `DashboardMenuChores.jsx:105-106`, `DailySchedule.jsx:253-256,270-276` |
| `last_completed_date` | string | no | — | `YYYY-MM-DD`; `null` on un-complete | Last completion | `Chores.jsx:331,335`, `DashboardMenuChores.jsx:140,144` | `Chores.jsx:917` |
| `time_estimate` | number | no | — | minutes | Duration estimate | `Chores.jsx:226,394`, `ChoreGenerator.jsx:170` (`parseInt` or 30), `ChoreLibraryDialog.jsx:164` | `Chores.jsx:551-556` |
| `notes` | string | no | — | free text | Notes | `Chores.jsx:227,395` | rendering |
| `chore_type` | string | no | — | free text, trimmed; meal set `Breakfast` · `Lunch` · `Dinner` · `Snack` · `Meal`; generator writes `"Meal"` or nothing | Category / meal marker | `Chores.jsx:228,396`, `ChoreGenerator.jsx:171`, `ChoreLibraryDialog.jsx:162` | `Chores.jsx:538-539,546-547,576`, `DashboardMenuChores.jsx:98`, `DailySchedule.jsx:249,266,276` |

**References out.** `assigned_to` → `ChoreUser.id` (readers also accept `ChoreUser.name`). `[Implemented]`
`src/pages/Chores.jsx:240,533-535`

**Referenced by.** Backend `delete_app` maps `sourceType: "chore"` to this entity; no code writes a
`ScheduleItem` with `source_type: "chore"`. `[Implemented]` `base44/functions/deleteToDoItem/entry.ts:81`

**Lifecycle.**
- *Created* from the chore form, one row per selected member, `chore_type` required by the form; optionally
  also saved to the library. `[Implemented]` `src/pages/Chores.jsx:206-270`
- *Created* by the generator (one per assignee, or one unassigned) and by assigning library rows (one per
  member, with per-chore frequency override). `[Implemented]` `src/components/ChoreGenerator.jsx:127-199`,
  `src/components/ChoreLibraryDialog.jsx:148-180`
- *Created* as copies on edit or bulk reassign when extra members are selected (the copy spreads the
  existing row with `id: undefined`, `status: "pending"`). `[Implemented]` `src/pages/Chores.jsx:412-423,506-530`
- *Updated* by the edit form (all fields; `assigned_to` = first selected id or previous value).
  `[Implemented]` `src/pages/Chores.jsx:385-410`
- *Completed*: `status: "completed"`, `last_completed_date` = today, and `due_date` = today + interval
  (`daily` +1d, `weekly` +7d, `biweekly` +14d, `monthly` +1 month, `quarterly` +3 months, `yearly` +1 year;
  none for `as_needed`). Un-complete sets `pending` and clears `last_completed_date`. `[Implemented]`
  `src/pages/Chores.jsx:312-338`, `src/components/dashboard/DashboardMenuChores.jsx:124-145`
- *Completed* from the to-do: `status` only. `[Implemented]` `src/components/DailyToDo.jsx:123-124`
- *Reset*: every completed chore is set back to `pending` by a client-side timer at local midnight while the
  Chores page is open. `[Implemented]` `src/pages/Chores.jsx:156-180`
- *Hard-deleted* singly, in bulk, from the to-do (`delete_app`), by the full wipe, and by account deletion.
  `[Implemented]` `src/pages/Chores.jsx:290-293,496-504`, `src/components/DailyToDo.jsx:190`,
  `base44/functions/deleteSyncedData/entry.ts:53`, `base44/functions/deleteUserAccount/entry.ts:49-51`
- *Soft-deleted / dismissed / purged*: none. `status: skipped` is never written.

**Ordering & read-time sort/limit.** `-created_date` 1000 (Chores page), 500 (library dialog, dashboard
menu), 300 with `status: "pending"` (dashboard badge); `-updated_date` 100 (Daily Schedule counts).
`[Implemented]` `src/pages/Chores.jsx:190`, `src/components/ChoreLibraryDialog.jsx:54`,
`src/components/dashboard/DashboardMenuChores.jsx:57`, `src/pages/Dashboard.jsx:80`, `src/pages/DailySchedule.jsx:236`

**Denormalised caches.** Room names are mirrored into device storage (`chore_custom_rooms`) on every load
and suppressed by `chore_deleted_rooms`. `[Implemented]` `src/pages/Chores.jsx:197-204`, `src/lib/choreRooms.js:1-90`

**Retention.** Indefinite.

**Declared-but-unwritten fields.** `status: skipped`. `[Implemented]` `base44/entities/Chore.jsonc:45-53`

**Written-but-undeclared fields.** Bulk reassign copies re-send `created_by`, `created_date`, `updated_date`.
`[Implemented]` `src/pages/Chores.jsx:522`

**Required-but-written-empty.** None observed.

---

### ChoreLibrary   (E-ChoreLibrary)

**Purpose.** Reusable, unassigned chore templates. `[Implemented]` `base44/entities/ChoreLibrary.jsonc:1-57`

**Source file.** `base44/entities/ChoreLibrary.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/ChoreLibrary.jsonc:43-56`

**Service-role bypasses.** `clearChoreLibraryAssignments` (admin) lists 500 and sets `assigned_to: null`
where set. Not in either wipe list. `[Implemented]` `base44/functions/clearChoreLibraryAssignments/entry.ts:17-25`,
`base44/functions/deleteSyncedData/entry.ts:50-60`, `base44/functions/deleteUserAccount/entry.ts:31-78`

**Cardinality.** Many per owner; duplicates skipped when lower-cased `title`, `frequency`, `room`,
`priority`, `chore_type` match. `[Implemented]` `src/pages/Chores.jsx:243-265`, `src/components/ChoreGenerator.jsx:178-186`

**Writers.** create: `src/pages/Chores.jsx:255,438`, `src/components/ChoreGenerator.jsx:188`. update:
`base44/functions/clearChoreLibraryAssignments/entry.ts:23`. delete: `src/components/ChoreLibraryDialog.jsx:184`.
**Readers.** `src/pages/Chores.jsx:192,245,428`, `src/components/ChoreLibraryDialog.jsx:53`,
`src/components/ChoreGenerator.jsx:127`, `base44/functions/clearChoreLibraryAssignments/entry.ts:17`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `title` | string | yes | — | free text | Template name | all creators | `ChoreLibraryDialog.jsx:59,156` |
| `description` | string | no | — | free text; generator appends `\nAge Group: <group>` for meals | Details | `Chores.jsx:257,440`, `ChoreGenerator.jsx:187-190` | `ChoreLibraryDialog.jsx:157` |
| `frequency` | string | yes | — | `daily` · `weekly` · `biweekly` · `monthly`; other form values become `weekly` | Cadence | `Chores.jsx:246,258,429,441`, `ChoreGenerator.jsx:177,191` | `ChoreLibraryDialog.jsx:159` |
| `time_estimate` | number | no | — | minutes | Estimate | `Chores.jsx:259,442`, `ChoreGenerator.jsx:192` | `ChoreLibraryDialog.jsx:164` |
| `priority` | string | no | — | `low` · `medium` · `high` | Priority | `Chores.jsx:260,443`, `ChoreGenerator.jsx:193` | `ChoreLibraryDialog.jsx:161` |
| `room` | string | no | — | free text (meal slot for meals) | Location | `Chores.jsx:261,444`, `ChoreGenerator.jsx:194` | `Chores.jsx:541-545`, `ChoreLibraryDialog.jsx:160` |
| `chore_type` | string | no | — | free text | Category | `Chores.jsx:262,445`, `ChoreGenerator.jsx:195` | `Chores.jsx:546`, `ChoreLibraryDialog.jsx:162` |

**References out.** None. **Referenced by.** Chores are copied from library rows by value (title match is
the only link). `[Implemented]` `src/components/ChoreLibraryDialog.jsx:155-169`

**Lifecycle.** *Created* when "save to library" is ticked on create/edit or from the generator; *updated*
only by the admin clean-up; *hard-deleted* from the library dialog. No soft delete, no purge. `[Implemented]`
`src/pages/Chores.jsx:243-265,425-448`, `src/components/ChoreGenerator.jsx:176-198`,
`base44/functions/clearChoreLibraryAssignments/entry.ts:21-25`, `src/components/ChoreLibraryDialog.jsx:184`

**Ordering & read-time sort/limit.** `-created_date` 1000 (page), 200 (duplicate check), `-updated_date` 100
(dialog), unsorted (generator), `-created_date` 500 (admin). `[Implemented]` `src/pages/Chores.jsx:192,245,428`,
`src/components/ChoreLibraryDialog.jsx:53`, `src/components/ChoreGenerator.jsx:127`,
`base44/functions/clearChoreLibraryAssignments/entry.ts:17`

**Denormalised caches.** Room names mirrored to device storage as for `Chore`. **Retention.** Indefinite.

**Declared-but-unwritten fields.** None. **Written-but-undeclared fields.** `assigned_to` is read and set to
`null` by the admin clean-up although the schema does not declare it. `[Implemented]`
`base44/functions/clearChoreLibraryAssignments/entry.ts:22-23`. **Required-but-written-empty.** None observed.

---

### ChoreUser   (E-ChoreUser)

**Purpose.** A household member: name, colour, and (declared only) avatar. Assignee for chores; member
list for goals. `[Implemented]` `base44/entities/ChoreUser.jsonc:1-32`, `src/pages/Goals.jsx:234-249`

**Source file.** `base44/entities/ChoreUser.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/ChoreUser.jsonc:18-31`

**Service-role bypasses.** `deleteUserAccount`. `[Implemented]` `base44/functions/deleteUserAccount/entry.ts:52-54`

**Cardinality.** Many per owner; no uniqueness rule.

**Writers.** create: `src/pages/Chores.jsx:274` (`{ name, color }`), `src/pages/Goals.jsx:241` (`{ name }`).
update: `src/pages/Chores.jsx:307`. delete: `src/pages/Chores.jsx:296`, `src/pages/Goals.jsx:247`,
`base44/functions/deleteSyncedData/entry.ts:53`, `base44/functions/deleteUserAccount/entry.ts:52-54`.
**Readers.** `src/pages/Chores.jsx:191`, `src/pages/Goals.jsx:235` (`list("name", 50)`),
`src/components/dashboard/DashboardMenuChores.jsx:58`, `src/components/MenuChoresWidget.jsx:25`,
`base44/functions/deleteUserAccount/entry.ts:52`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `name` | string | yes | — | free text | Member name | `Chores.jsx:274,307`, `Goals.jsx:241` | name lookups `Chores.jsx:535,601`, `DashboardMenuChores.jsx:78`, `Goals.jsx` member select |
| `color` | string | no | — | hex (form default `#10b981`) | Member colour | `Chores.jsx:274,307` | `DashboardMenuChores.jsx:80` |
| `avatar` | string | no | — | — | Declared; never written | none | none |

**References out.** None. **Referenced by.** `Chore.assigned_to` (by id) `[Implemented]` `src/pages/Chores.jsx:240`;
`Goal.member_name` (by name) `[Implemented]` `src/pages/Goals.jsx:596`.

**Lifecycle.** *Created* from the Chores member dialog (name + colour) or the Goals member dialog (name
only); *updated* (name, colour) from Chores; *hard-deleted* from either page, by the full wipe, or on account
deletion. Deleting a member leaves chores pointing at the missing id (rendered "Unassigned") and goals
carrying the old name. `[Implemented]` `src/pages/Chores.jsx:272-278,295-310,597`, `src/pages/Goals.jsx:239-249`

**Ordering & read-time sort/limit.** unsorted `list()` (Chores, dashboard); `list("name", 50)` (Goals).
`[Implemented]` `src/pages/Chores.jsx:191`, `src/pages/Goals.jsx:235`

**Denormalised caches / Retention.** None / indefinite.

**Declared-but-unwritten fields.** `avatar`. `[Implemented]` `base44/entities/ChoreUser.jsonc:11-13`
**Written-but-undeclared fields.** None. **Required-but-written-empty.** None observed.

---

## Discrepancies & open questions (this sheet)

- **D-001** `Chore.assigned_to` value: every writer stores the `ChoreUser.id`
  (`src/pages/Chores.jsx:240,410,421,511,522`, `src/components/ChoreGenerator.jsx:164`,
  `src/components/ChoreLibraryDialog.jsx:158`); the Chores page filter accepts either the id or the member's
  `name` (`src/pages/Chores.jsx:533-535`), and the glossary entry for household member describes a name-based
  reference (`docs/specs/00-overview/glossary.md:11`).
- **D-003** Chore completion writes `status` + `last_completed_date` + next `due_date` from the Chores page
  and dashboard menu (`src/pages/Chores.jsx:324-338`, `src/components/dashboard/DashboardMenuChores.jsx:124-145`)
  but `status` only from the to-do (`src/components/DailyToDo.jsx:123-124`).
- **D-011** `Chore.day_of_week` holds full day names when written from the chore form
  (`src/pages/Chores.jsx:22,340-347`) and three-letter names when written for meals by the generator
  (`src/components/ChoreGenerator.jsx:15,166`); readers test full names for chores and short names for meals
  (`src/components/dashboard/DashboardMenuChores.jsx:11-14,103-111`).
