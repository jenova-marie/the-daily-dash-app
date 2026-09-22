# Data Model — Education

**Area:** `DATA` · **Level:** 2 · **Status:** draft · Conventions: `README.md`

### Learner   (E-Learner)

**Purpose.** A person education is planned for: name, grade level, colour. `[Implemented]`
`base44/entities/Learner.jsonc:1-35`

**Source file.** `base44/entities/Learner.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/Learner.jsonc:21-34`

**Service-role bypasses.** `deleteUserAccount`. `[Implemented]` `base44/functions/deleteUserAccount/entry.ts:61-63`

**Cardinality.** Many per owner; no uniqueness rule.

**Writers.** create: `src/pages/Education.jsx:152`. delete: `src/pages/Education.jsx:219`,
`base44/functions/deleteSyncedData/entry.ts:55`, `base44/functions/deleteUserAccount/entry.ts:61-63`.
**Readers.** `src/pages/Education.jsx:141`, `src/pages/DailySchedule.jsx:240` (`-updated_date` 50).

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `name` | string | yes | — | free text | Learner name | `Education.jsx:152` | goal creation `ActivityGenerator.jsx:167`, `Education.jsx:255`; print titles `Education.jsx:310` |
| `grade_level` | string | no | — | free text | Grade | `Education.jsx:152` | rendering |
| `color` | string | no | — | hex (form default `#8b5cf6`) | Colour | `Education.jsx:152` | rendering |
| `avatar` | string | no | — | — | Declared; never written | none | none |

**References out.** None. **Referenced by.** `EducationPlan.learner_id`, `EducationActivity.learner_id`,
`FavoriteActivity.learner_id`. `[Implemented]` `base44/entities/EducationPlan.jsonc:5-7`,
`base44/entities/EducationActivity.jsonc:8-10`, `base44/entities/FavoriteActivity.jsonc:5-7`

**Lifecycle.** *Created* from the learner dialog and made the active learner; never updated; *hard-deleted*
together with every plan and activity whose `learner_id` matches (favourites are left), by the full wipe,
and on account deletion. `[Implemented]` `src/pages/Education.jsx:150-157,213-223`,
`base44/functions/deleteSyncedData/entry.ts:55`, `base44/functions/deleteUserAccount/entry.ts:61-63`

**Ordering & read-time sort/limit.** unsorted `list()`; `-updated_date` 50 on the Daily Schedule.
**Denormalised caches / Retention.** None / indefinite.

**Declared-but-unwritten fields.** `avatar`. **Written-but-undeclared / Required-but-written-empty.** None observed.

---

### EducationPlan   (E-EducationPlan)

**Purpose.** One learner × one subject; a container for activities with optional description, due date,
materials, and notes. `[Implemented]` `base44/entities/EducationPlan.jsonc:1-66`

**Source file.** `base44/entities/EducationPlan.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/EducationPlan.jsonc:52-65`

**Service-role bypasses.** `deleteUserAccount`. `[Implemented]` `base44/functions/deleteUserAccount/entry.ts:55-57`

**Cardinality.** One row per selected subject per create; no uniqueness rule. `[Implemented]` `src/pages/Education.jsx:164-166`

**Writers.** create: `src/pages/Education.jsx:165`. update: `src/pages/Education.jsx:184`. delete:
`src/pages/Education.jsx:173,200,209,217`, `base44/functions/deleteSyncedData/entry.ts:55`,
`base44/functions/deleteUserAccount/entry.ts:55-57`.
**Readers.** `src/pages/Education.jsx:142` (`-created_date` 200). subscribe: `src/pages/DailySchedule.jsx:188`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `learner_id` | string | yes | — | `Learner.id`; when no learners exist, the owner's `full_name` | Learner | `Education.jsx:162-165` | plan grouping, cascades `Education.jsx:197,215` |
| `subject` | string | yes | — | free text (preset list plus device-stored custom subjects) | Subject | `Education.jsx:165` | `Education.jsx:197-198,207`, activity creation |
| `title` | string | yes | — | equals `subject` | Title | `Education.jsx:165` | rendering |
| `description` | string | no | — | free text | Details | `Education.jsx:165,185` | rendering |
| `status` | string | no | `not_started` | `not_started` · `in_progress` · `completed` | Declared; never written | none | none |
| `due_date` | string | no | — | `YYYY-MM-DD` | Due | `Education.jsx:165,188` | rendering |
| `due_time` | string | no | — | `HH:MM` | Declared; never written | none | none |
| `materials` | string | no | — | free text | Materials | `Education.jsx:165,186` | rendering |
| `notes` | string | no | — | free text | Notes | `Education.jsx:165,187` | rendering |
| `synced_to_schedule` | boolean | no | `false` | — | Declared; never written | none | none |
| `schedule_time` | string | no | — | — | Declared; never written | none | none |

**References out.** `learner_id` → `Learner.id`. **Referenced by.** `EducationActivity.plan_id`. `[Implemented]`
`base44/entities/EducationActivity.jsonc:5-7`

**Lifecycle.** *Created* one per selected subject with `title = subject`; *updated* (description, materials,
notes, due_date) from the edit dialog; *hard-deleted* singly, per subject (with or without that subject's
activities depending on the entry point), per learner, by the full wipe, and on account deletion.
`[Implemented]` `src/pages/Education.jsx:159-170,182-192,172-175,194-211,213-223`

**Ordering & read-time sort/limit.** `-created_date` 200. **Denormalised caches.** `subject`/`title` are
copied into each activity. **Retention.** Indefinite.

**Declared-but-unwritten fields.** `status`, `due_time`, `synced_to_schedule`, `schedule_time`. `[Implemented]`
`base44/entities/EducationPlan.jsonc:17-25,30-32,39-45`

**Written-but-undeclared fields.** `subjects` (the form's array of selected subjects) is sent on every create by
spreading the form. `[Implemented]` `src/pages/Education.jsx:42,165`

**Required-but-written-empty.** `learner_id` may hold a name string rather than an id. `[Implemented]` `src/pages/Education.jsx:162`

---

### EducationActivity   (E-EducationActivity)

**Purpose.** An assignment or activity inside a plan, with due date, frequency, days, notes, resource links,
and completion. `[Implemented]` `base44/entities/EducationActivity.jsonc:1-91`

**Source file.** `base44/entities/EducationActivity.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/EducationActivity.jsonc:77-90`

**Service-role bypasses.** `deleteToDoItem` (`delete_app` with `sourceType: "education"`); `deleteUserAccount`.
`[Implemented]` `base44/functions/deleteToDoItem/entry.ts:82,97`, `base44/functions/deleteUserAccount/entry.ts:58-60`

**Cardinality.** Many per plan. The generator skips a suggestion when an activity with the same `plan_id`,
lower-cased `title`, and `learner_id` exists. `[Implemented]` `src/components/ActivityGenerator.jsx:137-147`

**Writers.** create: `src/pages/Education.jsx:243`, `src/components/ActivityGenerator.jsx:60,149`,
`src/components/ActivityLibrary.jsx:105`. update: `src/pages/Education.jsx:294,300`,
`src/components/education/SubjectCard.jsx:49,130`, `src/components/DailyToDo.jsx:126`. delete:
`src/pages/Education.jsx:201,218,266`, `src/components/DailyToDo.jsx:191`, `base44/functions/deleteToDoItem/entry.ts:97`,
`base44/functions/deleteSyncedData/entry.ts:55`, `base44/functions/deleteUserAccount/entry.ts:58-60`.
**Readers.** `src/pages/Education.jsx:143`, `src/pages/DailySchedule.jsx:241,285`, `src/pages/Dashboard.jsx:81`,
`src/components/ActivityGenerator.jsx:137`, `src/components/ActivityLibrary.jsx:34`. subscribe: `src/pages/DailySchedule.jsx:189`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `plan_id` | string | yes | — | `EducationPlan.id` (`null` when created for a subject without a plan) | Parent plan | `Education.jsx:236,243`, `ActivityGenerator.jsx:62,150`, `ActivityLibrary.jsx:106` | duplicate check `ActivityGenerator.jsx:143` |
| `learner_id` | string | yes | — | `Learner.id` | Learner | all creators (from the plan) | cascades `Education.jsx:198,216`, duplicate check |
| `subject` | string | yes | — | copied from the plan | Subject | all creators | `Education.jsx:198` |
| `title` | string | yes | — | free text | Name | all creators; `SubjectCard.jsx:130` | rendering, duplicate check |
| `type` | string | no | `assignment` | `assignment` · `activity` | Kind | `Education.jsx:43,243`, `ActivityGenerator.jsx:37,154`, `ActivityLibrary.jsx:110`, `SubjectCard.jsx:130` | rendering |
| `due_date` | string | no | — | `YYYY-MM-DD` | Due; advanced on completion for repeating activities | `Education.jsx:243,297`, `ActivityGenerator.jsx:37,61`, `SubjectCard.jsx:130` | `DailySchedule.jsx:241,286-287`, `ActivityLibrary.jsx:35-36` |
| `frequency` | string | no | `once` | `once` · `daily` · `weekly` · `biweekly` · `monthly` | Cadence | `Education.jsx:43,243`, `ActivityGenerator.jsx:37,155`, `ActivityLibrary.jsx:111`, `SubjectCard.jsx:130` | `Education.jsx:291-293` |
| `days_of_week` | string[] | no | — | `Mon`..`Sun` | Days | `Education.jsx:43,243`, `ActivityGenerator.jsx:37,51`, `SubjectCard.jsx:129` | print schedule |
| `notes` | string | no | — | free text; generator writes `<description>\n\nDuration: …\nMaterials: …`; library assign joins description/duration/materials with newlines | Notes | `Education.jsx:243`, `ActivityGenerator.jsx:156`, `ActivityLibrary.jsx:112`, `SubjectCard.jsx:130` | `SubjectCard.jsx:43,140` |
| `resource_links` | string | no | — | JSON array of URLs (see `json-string-fields.md`) | Links | `SubjectCard.jsx:49` | `src/components/education/ActivityLinksDialog.jsx:14` |
| `completed` | boolean | no | `false` | — | Done | `Education.jsx:295,300`, `DailyToDo.jsx:126` | `DailySchedule.jsx:281,286-287`, `Dashboard.jsx:81`, `ActivityLibrary.jsx:35-36` |
| `last_completed_date` | string | no | — | `YYYY-MM-DD`; `null` on untick | Last completion | `Education.jsx:296,300` | `DailySchedule.jsx:281` |

**References out.** `plan_id` → `EducationPlan.id`; `learner_id` → `Learner.id`. **Referenced by.** Backend
`delete_app` maps `sourceType: "education"` to this entity; no code writes a `ScheduleItem` with
`source_type: "education"`. `[Implemented]` `base44/functions/deleteToDoItem/entry.ts:82`

**Lifecycle.**
- *Created* from the activity dialog (form + target plan/learner/subject), the generator's manual tab, the
  generator's assign step (one per selected plan × selected suggestion, skipping duplicates), and the
  activity library assign step. `[Implemented]` `src/pages/Education.jsx:235-246`,
  `src/components/ActivityGenerator.jsx:55-71,127-174`, `src/components/ActivityLibrary.jsx:97-117`
- *Updated* by the inline edit (whole row minus `id`, with `days_of_week` from the edit state) and by the
  links dialog (`resource_links`). `[Implemented]` `src/components/education/SubjectCard.jsx:126-132,47-50`
- *Completed*: repeating activities get `completed: true`, `last_completed_date` = today, and `due_date` =
  today + interval (daily +1, weekly +7, biweekly +14, monthly +30 days); `once` activities and un-ticks
  toggle `completed` and clear `last_completed_date`. The to-do writes `completed` only. `[Implemented]`
  `src/pages/Education.jsx:270-303`, `src/components/DailyToDo.jsx:125-126`
- *Hard-deleted* singly, with a subject (dialog path), with a learner, from the to-do, by the full wipe, and on
  account deletion. `[Implemented]` `src/pages/Education.jsx:264-267,194-205,213-223`,
  `src/components/DailyToDo.jsx:191`, `base44/functions/deleteSyncedData/entry.ts:55`,
  `base44/functions/deleteUserAccount/entry.ts:58-60`

**Ordering & read-time sort/limit.** `-created_date` 500 (Education page); `-updated_date` 500 (library
status, Daily Schedule status) and `-updated_date` 100 filtered on `due_date` = selected date (Daily
Schedule count); `filter({ completed: false }, "", 200)` (dashboard badge); unsorted `list()` (generator
duplicate check). `[Implemented]` `src/pages/Education.jsx:143`, `src/components/ActivityLibrary.jsx:34`,
`src/pages/DailySchedule.jsx:241,285`, `src/pages/Dashboard.jsx:81`, `src/components/ActivityGenerator.jsx:137`

**Denormalised caches.** `subject` and `learner_id` are copied from the plan at creation and not refreshed.
**Retention.** Indefinite.

**Declared-but-unwritten fields.** None. **Written-but-undeclared fields.** The inline edit re-sends
`created_by`, `created_date`, `updated_date` and any other key present on the loaded row. `[Implemented]`
`src/components/education/SubjectCard.jsx:128-130`. **Required-but-written-empty.** `plan_id` is `null` when
the activity dialog is opened for a subject that has no plan row. `[Implemented]` `src/pages/Education.jsx:236`

---

### FavoriteActivity   (E-FavoriteActivity)

**Purpose.** The activity library: a reusable activity saved per learner with duration and materials.
`[Implemented]` `base44/entities/FavoriteActivity.jsonc:1-46`

**Source file.** `base44/entities/FavoriteActivity.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/FavoriteActivity.jsonc:32-45`

**Service-role bypasses.** None. Absent from both wipe lists. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:50-60`,
`base44/functions/deleteUserAccount/entry.ts:31-78`

**Cardinality.** Many per learner; no uniqueness rule.

**Writers.** create: `src/components/ActivityLibrary.jsx:61`, `src/components/education/SubjectCard.jsx:137`.
delete: `src/components/ActivityLibrary.jsx:78`. **Readers.** `src/components/ActivityLibrary.jsx:49` (`-updated_date` 100).

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `learner_id` | string | yes | — | `Learner.id` | Learner | both creators | filtering in the library dialog |
| `title` | string | yes | — | free text | Name | both creators | `ActivityLibrary.jsx:109` |
| `description` | string | no | — | free text (activity `notes` when saved from a card) | Details | `ActivityLibrary.jsx:61`, `SubjectCard.jsx:140` | `ActivityLibrary.jsx:112` |
| `type` | string | no | — | `assignment` · `activity` (form default `activity`) | Kind | both creators | `ActivityLibrary.jsx:110` |
| `duration` | string | no | — | free text; `""` from a card | Duration | both creators | `ActivityLibrary.jsx:112` |
| `materials` | string | no | — | free text; `""` from a card | Materials | both creators | `ActivityLibrary.jsx:112` |

**References out.** `learner_id` → `Learner.id`. **Referenced by.** Activities are created from favourites by
value. `[Implemented]` `src/components/ActivityLibrary.jsx:104-113`

**Lifecycle.** *Created* from the library form or "save to library" on an activity edit; never updated;
*hard-deleted* from the library. Not deleted with the learner or by either wipe. `[Implemented]`
`src/components/ActivityLibrary.jsx:58-83`, `src/components/education/SubjectCard.jsx:134-150`

**Ordering & read-time sort/limit.** `-updated_date` 100. **Denormalised caches / Retention.** None / indefinite.
**Declared-but-unwritten / Written-but-undeclared / Required-but-written-empty.** None observed.

---

## Discrepancies & open questions (this sheet)

- None beyond those listed in `flags-and-lifecycle.md` §7.
