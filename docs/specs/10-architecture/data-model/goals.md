# Data Model — Goals

**Area:** `DATA` · **Level:** 2 · **Status:** draft · Conventions: `README.md`

### Goal   (E-Goal)

**Purpose.** A user objective with a timeframe, a label with colour, a household member name, derived
progress and status from its milestone tasks, and an archive flag. `[Implemented]` `base44/entities/Goal.jsonc:1-92`

**Source file.** `base44/entities/Goal.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/Goal.jsonc:78-91`

**Service-role bypasses.** `deleteUserAccount`. `[Implemented]` `base44/functions/deleteUserAccount/entry.ts:43-45`

**Cardinality.** Many per owner; no uniqueness rule. The daily evaluation looks up an existing open goal by
lower-cased title equal to a pillar activity to show "remaining" counts. `[Implemented]`
`src/components/visionboard/DailyEvaluation.jsx:38-59`

**Writers (entity-wide).** create: `src/pages/Goals.jsx:267`, `src/components/ActivityGenerator.jsx:162`,
`src/pages/Education.jsx:250`, `src/components/visionboard/PillarManager.jsx:220`,
`src/components/visionboard/DailyEvaluation.jsx:161`, `src/pages/VisionBoard.jsx:160`.
update: `src/pages/Goals.jsx:176,225,230,304`, `src/components/dashboard/DashboardGoals.jsx:114`.
delete: `src/pages/Goals.jsx:282`, `base44/functions/deleteSyncedData/entry.ts:53`, `base44/functions/deleteUserAccount/entry.ts:43-45`.

**Readers (entity-wide).** `src/pages/Goals.jsx:84`, `src/components/dashboard/DashboardGoals.jsx:75`,
`src/pages/DailySchedule.jsx:237`, `src/components/visionboard/DailyEvaluation.jsx:40`.
subscribe: `src/components/dashboard/DashboardGoals.jsx:84`, `src/pages/DailySchedule.jsx:187`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `title` | string | yes | — | free text; `<Pillar> Goal`, `<Subject> Education Goal`, or the activity text when generated | Name | all creators; `Goals.jsx:304` | title match `DailyEvaluation.jsx:50`, library `DailySchedule.jsx:1091` |
| `description` | string | no | — | free text; generated forms: `From <pillar_name>`, `Created from Vision Board - <pillar> pillar`, `Created from Education Manager - <subject>` | Details | all creators | rendering |
| `timeframe` | string | yes | — | declared `daily` · `weekly` · `monthly` · `annual` · `3_year` · `5_year`; UI also offers `occurrences`; evaluation writes one of `daily` · `weekly` · `monthly` · `annual` | Horizon | `Goals.jsx:263` (form, options `:23-31`), `ActivityGenerator.jsx:165` (`weekly`), `Education.jsx:253`, `VisionBoard.jsx:163` (`monthly`), `PillarManager.jsx:223` (frequency or `daily`), `DailyEvaluation.jsx:164` (`:499`) | grouping `Goals.jsx:86-99`, `DashboardGoals.jsx:100-123` |
| `occurrences` | number | no | `1` | integer ≥ 1 | Times to complete | `Goals.jsx:263,304`, `PillarManager.jsx:224`, `DailyEvaluation.jsx:165` | `Goals.jsx:292` |
| `status` | string | no | `not_started` | `not_started` · `in_progress` · `completed` · `on_hold` | State | creators write `not_started`; `Goals.jsx:171-176` (derived), `:230` (`in_progress` on restore), `DashboardGoals.jsx:112` (`completed`) | `Goals.jsx:220-221,172-175`, `DashboardGoals.jsx:118`, `DailySchedule.jsx:1045`, `DailyEvaluation.jsx:50` |
| `progress` | number | no | `0` | 0–100 percent | Derived from milestone tasks | `Goals.jsx:170-176`, `DashboardGoals.jsx:112` (`100`) | progress bar |
| `target_date` | string | no | — | `YYYY-MM-DD` | Target | `Goals.jsx:263,304` | `DailySchedule.jsx:1097-1099` (due / overdue badges) |
| `milestones` | string | no | — | newline-separated text | Declared; never written; read only by print | none | `Goals.jsx:315` |
| `member_name` | string | no | — | `ChoreUser.name`, the owner's `full_name`, or literals `Self`, `User`, `Unknown` | Household member | `Goals.jsx:264-266` (form or `currentUser.full_name`), `ActivityGenerator.jsx:167` (learner name or `"Unknown"`), `Education.jsx:255` (learner name), `PillarManager.jsx:226` (`"Self"`), `DailyEvaluation.jsx:167` and `VisionBoard.jsx:165` (`full_name` or `"User"`) | member tabs `Goals.jsx:368` |
| `archived` | boolean | no | `false` | — | In the Archive tab | `Goals.jsx:173` (`true` when derived status is completed), `:225` (`true`), `:230` (`false`) | `Goals.jsx:220-221`, `DashboardGoals.jsx:75`, `DailySchedule.jsx:1045`, `DailyEvaluation.jsx:50` |
| `started_at` | string | no | — | ISO date-time | First move to `in_progress` | `Goals.jsx:174`, `DashboardGoals.jsx:113` | none observed |
| `completed_at` | string | no | — | ISO date-time | Completion moment | `Goals.jsx:175`, `DashboardGoals.jsx:112` | none observed |
| `category` | string | no | — | free-text label; pillar name when generated from the vision board | Label | `Goals.jsx:263,304`, `PillarManager.jsx:227`, `DailyEvaluation.jsx:168` | grouping `Goals.jsx:90-96`, `DailySchedule.jsx:1064-1069` |
| `category_color` | string | no | — | hex; pillar colour or `#3b82f6` when generated | Label colour | `Goals.jsx:263,304`, `PillarManager.jsx:228`, `DailyEvaluation.jsx:169` | `DailySchedule.jsx:1066` |

**References out.** `member_name` → `ChoreUser.name` (soft, by name). `category` → `HealthPillar.name` when
generated from a pillar (soft). `[Implemented]` `src/pages/Goals.jsx:596`, `src/components/visionboard/PillarManager.jsx:227`

**Referenced by.** `GoalTask.goal_id` `[Implemented]` `base44/entities/GoalTask.jsonc:5-7`; `ScheduleItem.source_id`
with `source_type: "goal"` when a goal has no incomplete milestone tasks `[Implemented]` `src/pages/DailySchedule.jsx:1099`.

**Lifecycle.**
- *Created* from the Goals form (member defaults to the owner's full name; milestone lines become
  `GoalTask` rows with `frequency: "once"`). `[Implemented]` `src/pages/Goals.jsx:260-279`
- *Created* from education (activity generator with "create as goals"; subject card), from pillar
  activities (with N occurrence tasks named `<activity> (i/N)`), from the daily evaluation's queued
  activities, and from a pillar card. `[Implemented]` `src/components/ActivityGenerator.jsx:160-170`,
  `src/pages/Education.jsx:248-262`, `src/components/visionboard/PillarManager.jsx:209-243`,
  `src/components/visionboard/DailyEvaluation.jsx:155-182`, `src/pages/VisionBoard.jsx:157-173`
- *Updated* by the edit form (title, description, timeframe, occurrences, target_date, member_name, category,
  category_color). `[Implemented]` `src/pages/Goals.jsx:301-308`
- *Progress derived* after any milestone change: `progress` = round(completed/total × 100); `status` =
  `completed` at 100, `in_progress` above 0, else `not_started`; `archived` = (status is completed);
  `started_at` set on first move to `in_progress`; `completed_at` set on first completion. Goals with no
  milestone tasks are left untouched. `[Implemented]` `src/pages/Goals.jsx:167-178`
- *Completed* from the dashboard tick: `status: "completed"`, `progress: 100`, `completed_at`, and
  `started_at` if unset. `[Implemented]` `src/components/dashboard/DashboardGoals.jsx:110-116`
- *Archived / restored*: `archived: true`; restore sets `archived: false, status: "in_progress"`.
  `[Implemented]` `src/pages/Goals.jsx:224-232`
- *Hard-deleted* from the Goals page (milestone tasks are not deleted), by the full wipe, and on account
  deletion. `[Implemented]` `src/pages/Goals.jsx:281-284`, `base44/functions/deleteSyncedData/entry.ts:53`,
  `base44/functions/deleteUserAccount/entry.ts:43-45`
- *Soft-deleted / purged*: none. `status: on_hold` is never written.

**Ordering & read-time sort/limit.** `-created_date` 200 (Goals page, evaluation); `-created_date` 100 with
`archived: false` (dashboard); `-updated_date` 100 (Daily Schedule). Active tab = not archived and not
completed; Archive tab = archived or completed. `[Implemented]` `src/pages/Goals.jsx:84,219-222`,
`src/components/dashboard/DashboardGoals.jsx:75`, `src/pages/DailySchedule.jsx:237`,
`src/components/visionboard/DailyEvaluation.jsx:40`

**Denormalised caches.** `category` / `category_color` copy the pillar name and colour at creation and are
not refreshed. `[Implemented]` `src/components/visionboard/PillarManager.jsx:227-228`

**Retention.** Indefinite.

**Declared-but-unwritten fields.** `milestones`; `status: on_hold`. `[Implemented]` `base44/entities/Goal.jsonc:27-36,45-47`

**Written-but-undeclared fields.** Enum value `occurrences` for `timeframe` is offered by the form.
`[Implemented]` `src/pages/Goals.jsx:30`, `src/components/dashboard/DashboardGoals.jsx:107`

**Required-but-written-empty.** None observed.

---

### GoalTask   (E-GoalTask)

**Purpose.** A milestone task under a goal, optionally repeated `occurrences` times with a running count.
`[Implemented]` `base44/entities/GoalTask.jsonc:1-55`

**Source file.** `base44/entities/GoalTask.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/GoalTask.jsonc:41-54`

**Service-role bypasses.** `deleteToDoItem` (`delete_app` with `sourceType: "goal"`); `deleteUserAccount`.
`[Implemented]` `base44/functions/deleteToDoItem/entry.ts:83,97`, `base44/functions/deleteUserAccount/entry.ts:46-48`

**Cardinality.** Many per goal; no uniqueness rule.

**Writers.** create: `src/pages/Goals.jsx:115,270`, `src/components/visionboard/DailyEvaluation.jsx:173`;
bulkCreate: `src/components/visionboard/PillarManager.jsx:230`. update: `src/pages/Goals.jsx:128,130,154`,
`src/components/DailyToDo.jsx:128` (unreachable, see lifecycle). delete: `src/pages/Goals.jsx:162`,
`src/components/DailyToDo.jsx:192`, `base44/functions/deleteToDoItem/entry.ts:97`,
`base44/functions/deleteSyncedData/entry.ts:53`, `base44/functions/deleteUserAccount/entry.ts:46-48`.
**Readers.** `src/pages/Goals.jsx:102,168`, `src/pages/DailySchedule.jsx:239`,
`src/components/visionboard/DailyEvaluation.jsx:41`. subscribe: `src/components/DailyToDo.jsx:99`, `src/pages/DailySchedule.jsx:190`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `goal_id` | string | yes | — | `Goal.id` | Parent goal | all creators | `Goals.jsx:104-106,168`, `DailySchedule.jsx:1051`, `DailyEvaluation.jsx:44-46` |
| `title` | string | yes | — | free text; `<activity> (i/N)` when generated with N > 1 | Step name | `Goals.jsx:115,142,270`, `PillarManager.jsx:233`, `DailyEvaluation.jsx:175` | rendering, schedule library |
| `frequency` | string | yes | — | `once` · `daily` · `weekly` · `biweekly` · `monthly` (Goals page writes `once`; vision-board paths write the chosen goal frequency, which may be `annual`) | Cadence | `Goals.jsx:115,270` (`once`), `PillarManager.jsx:234`, `DailyEvaluation.jsx:176` | none observed |
| `completed` | boolean | no | `false` | — | Done | `Goals.jsx:115,128,130,151,270`, `PillarManager.jsx:235`, `DailyEvaluation.jsx:177` | progress `Goals.jsx:170`, `DailySchedule.jsx:1052`, `DailyEvaluation.jsx:56` |
| `occurrences` | number | no | `1` | integer ≥ 1 | Times to complete | `Goals.jsx:115,145` | `Goals.jsx:123` |
| `completed_count` | number | no | `0` | integer, clamped to `occurrences` | Completions so far | `Goals.jsx:115,128,150` | `Goals.jsx:125` |

**References out.** `goal_id` → `Goal.id`. **Referenced by.** `ScheduleItem.source_id` with `source_type: "goal"`
(the oldest unscheduled incomplete task per goal is offered). `[Implemented]` `src/pages/DailySchedule.jsx:1044-1055,1097`

**Lifecycle.**
- *Created* with a goal (one per milestone line), from the inline "add task" input with an occurrence count,
  or N at once from a pillar activity. `[Implemented]` `src/pages/Goals.jsx:111-120,268-272`,
  `src/components/visionboard/PillarManager.jsx:230-237`, `src/components/visionboard/DailyEvaluation.jsx:171-180`
- *Completed*: single-occurrence tasks toggle `completed`; multi-occurrence tasks step `completed_count` up
  or down (0..occurrences) and set `completed` when the count reaches `occurrences`. Every change recomputes
  the parent goal. `[Implemented]` `src/pages/Goals.jsx:122-134,167-178`
- *Updated* inline: `title`, or `occurrences` with `completed_count` clamped and `completed` recomputed.
  `[Implemented]` `src/pages/Goals.jsx:136-159`
- *From the to-do*: completion of `goal` items returns before any write; delete `delete_app` removes the
  task. `[Implemented]` `src/components/DailyToDo.jsx:108,192`
- *Hard-deleted* inline (then the goal is recomputed), from the to-do, by the full wipe, and on account
  deletion. Deleting the parent goal does not delete its tasks. `[Implemented]` `src/pages/Goals.jsx:161-165,281-284`,
  `base44/functions/deleteToDoItem/entry.ts:83-97`, `base44/functions/deleteSyncedData/entry.ts:53`,
  `base44/functions/deleteUserAccount/entry.ts:46-48`

**Ordering & read-time sort/limit.** `-created_date` 500 (Goals page, evaluation); `created_date` ascending
500 (Daily Schedule, which then picks the oldest incomplete unscheduled task per goal); `filter({ goal_id })`
for progress. `[Implemented]` `src/pages/Goals.jsx:102,168`, `src/pages/DailySchedule.jsx:239,1050-1054`,
`src/components/visionboard/DailyEvaluation.jsx:41`

**Denormalised caches / Retention.** None / indefinite.

**Declared-but-unwritten fields.** None. **Written-but-undeclared fields.** `frequency` may receive `annual`
from the evaluation's frequency picker (`src/components/visionboard/DailyEvaluation.jsx:499,176`), which is
outside the declared enum. **Required-but-written-empty.** None observed.

---

## Discrepancies & open questions (this sheet)

- **D-004** Goal completion: the dashboard tick writes `status`, `progress`, `completed_at` (and
  `started_at`) without `archived` (`src/components/dashboard/DashboardGoals.jsx:110-116`); the Goals page's
  derived update writes `archived: true` whenever the derived status is `completed`
  (`src/pages/Goals.jsx:173`).
- **D-007** `Goal.timeframe` UI offers `occurrences` (`src/pages/Goals.jsx:30`,
  `src/components/dashboard/DashboardGoals.jsx:107`) which the schema enum omits
  (`base44/entities/Goal.jsonc:11-21`).
- **D-013** `Goal.member_name` defaults differ by creator: owner `full_name` (`src/pages/Goals.jsx:265`),
  `"Self"` (`src/components/visionboard/PillarManager.jsx:226`), `full_name` or `"User"`
  (`src/components/visionboard/DailyEvaluation.jsx:167`, `src/pages/VisionBoard.jsx:165`), learner name or
  `"Unknown"` (`src/components/ActivityGenerator.jsx:167`); the Goals member tabs match on exact
  `member_name` (`src/pages/Goals.jsx:368`).
