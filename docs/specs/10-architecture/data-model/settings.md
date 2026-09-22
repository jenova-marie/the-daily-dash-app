# Data Model — Settings & User

**Area:** `DATA` · **Level:** 2 · **Status:** draft · Conventions: `README.md`

### ThemeSettings   (E-ThemeSettings)

**Purpose.** The account preference row: visual theme, background library, feature toggles, dashboard
header and widget order, Google sync preferences, the label for imported tasks, and the map of dismissed
onboarding dialogs. `[Implemented]` `base44/entities/ThemeSettings.jsonc:1-111`

**Source file.** `base44/entities/ThemeSettings.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/ThemeSettings.jsonc:97-110`

**Service-role bypasses.** `deleteUserAccount`. `[Implemented]` `base44/functions/deleteUserAccount/entry.ts:70-72`

**Cardinality.** Singleton by convention: every reader takes `list("-updated_date", 1)`; every writer updates
that row's id if one was loaded and otherwise creates a new row carrying only the fields it is saving.
`[Implemented]` `src/App.jsx:87`, `src/pages/Settings.jsx:236-241`, `src/pages/Dashboard.jsx:146-150`,
`src/pages/ThemeEditor.jsx:83,165-170`, `src/components/GenericOnboardingDialog.jsx:10-18`

**Writers.** create: `src/pages/ThemeEditor.jsx:168`, `src/pages/Settings.jsx:240,340,523,665,734`,
`src/pages/Dashboard.jsx:149,170`, `src/components/GenericOnboardingDialog.jsx:16`,
`src/components/onboarding/GoalsOnboarding.jsx:43`, `src/components/onboarding/TasksOnboarding.jsx:38`.
update: `src/pages/ThemeEditor.jsx:135,147,166`, `src/pages/Settings.jsx:237,337,520,662,731`,
`src/pages/Dashboard.jsx:147,168`, `src/components/GenericOnboardingDialog.jsx:22`,
`src/components/onboarding/GoalsOnboarding.jsx:47`, `src/components/onboarding/TasksOnboarding.jsx:42`,
`src/pages/DailyChecklist.jsx:57`. delete: `base44/functions/deleteSyncedData/entry.ts:58`,
`base44/functions/deleteUserAccount/entry.ts:70-72`.
**Readers.** `src/App.jsx:87`, `src/pages/ThemeEditor.jsx:83`, `src/pages/Settings.jsx:274`,
`src/pages/Dashboard.jsx:119`, `src/pages/DailySchedule.jsx:144`, `src/pages/CalendarPage.jsx:192`,
`src/pages/Tasks.jsx:63`, `src/pages/Goals.jsx:67`, `src/pages/Quotes.jsx:44`, `src/pages/DailyChecklist.jsx:53,315`,
`src/components/GenericOnboardingDialog.jsx:10`, `src/components/onboarding/GoalsOnboarding.jsx:40`,
`src/components/onboarding/TasksOnboarding.jsx:35`, `base44/functions/autoSync/entry.ts:15`,
`base44/functions/syncGoogleTasks/entry.ts:22`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `primary_color` | string | no | — | hex (editor default `#1a9a7a`) | Primary colour | `ThemeEditor.jsx:166,168` | `App.jsx:93`, `ThemeEditor.jsx:105` |
| `accent_color` | string | no | — | hex (editor default `#e6930e`) | Accent colour | same | `App.jsx:94`, `ThemeEditor.jsx:106` |
| `background_image` | string | no | — | URL (uploaded file URL or library entry) | Active background | same | `ThemeEditor.jsx:112`, `App.jsx` |
| `background_library` | string[] | no | `[]` | array of URLs, most recent first, max 20 | Background history | `ThemeEditor.jsx:135,147` (add/remove), `:163` (save merges current image first) | `ThemeEditor.jsx:88-92` (merged with device copy) |
| `widget_bg_opacity` | number | no | `70` | 0–100 (editor default 90) | Widget opacity | `ThemeEditor.jsx:166,168` | `App.jsx:98`, `ThemeEditor.jsx:110` |
| `font_size` | string | no | `medium` | `small` · `medium` · `large` | Base font size | same | `ThemeEditor.jsx:35-39` |
| `heading_font` | string | no | — | one of `Inter`, `Playfair Display`, `Georgia`, `Arial`, `Verdana` | Heading font | same | `App.jsx:97` |
| `body_font` | string | no | — | same list | Body font | same | `App.jsx:96` |
| `dark_mode` | boolean | no | `true` | — (editor default `false`) | Dark theme | same | `App.jsx:95`, `ThemeEditor.jsx:107-108` |
| `widget_border_radius` | number | no | `12` | px | Corner radius | same | `App.jsx:99`, `ThemeEditor.jsx:111` |
| `randomize_background` | boolean | no | `true` | — | Rotate backgrounds | same | `ThemeEditor.jsx:113-116` |
| `dashboard_header` | string | no | — | free text or `null` | Greeting name | `Settings.jsx:337,340,655` | `Dashboard.jsx:154`, `Settings.jsx:279` |
| `enable_vision_board` | boolean | no | `true` | — | Feature toggle | `Settings.jsx:656,726` | `Settings.jsx:281`, layout gating |
| `enable_education` | boolean | no | `true` | — | Feature toggle | `Settings.jsx:657,727` | `Settings.jsx:282`, `DailySchedule.jsx:938,955` |
| `enable_chores` | boolean | no | `true` | — | Feature toggle | `Settings.jsx:658,728` | `Settings.jsx:283`, `DailySchedule.jsx:937,954` |
| `sync_times` | string | no | — | JSON array of `HH:MM` (see `json-string-fields.md`) | Chosen auto-sync times (display only) | `Settings.jsx:235` | `Settings.jsx:287` |
| `sync_sources` | string | no | — | JSON array of `calendar` / `tasks` | Sources for auto and manual sync | `Settings.jsx:235` | `Settings.jsx:288`, `CalendarPage.jsx:193-194`, `autoSync:16-18` (default both) |
| `auto_sync_calendar_ids` | string | no | — | JSON array of `SelectedCalendars.id` | Calendars ticked for auto-sync (display only) | `Settings.jsx:518` | `Settings.jsx:289` |
| `task_sync_category` | string | no | — | free-text label | Label for imported tasks | none | `syncGoogleTasks:23` (fallback `'Google Tasks'`) |
| `task_sync_color` | string | no | — | hex | Colour for imported tasks | none | `syncGoogleTasks:24` (fallback `''`) |
| `widget_order` | string | no | — | JSON array of widget ids | Dashboard order | `Dashboard.jsx:147,149,168,170` | `Dashboard.jsx:123-128` (merged with defaults) |
| `onboarding_status` | string | no | — | JSON object `{ <key>: true }` | Dismissed walkthroughs | `GenericOnboardingDialog.jsx:16,22`, `GoalsOnboarding.jsx:43,47`, `TasksOnboarding.jsx:38,42`, `DailyChecklist.jsx:57` (key removed) | `Tasks.jsx:65`, `Goals.jsx:69`, `Quotes.jsx:46`, `DailyChecklist.jsx:55,317` |

**References out.** `auto_sync_calendar_ids[]` → `SelectedCalendars.id`. **Referenced by.** None.

**Lifecycle.** *Created* lazily by whichever writer runs first when no row exists; *updated* field-by-field
by Settings, Dashboard, onboarding dialogs, and the Theme Editor (which re-sends its whole loaded row);
*hard-deleted* by the full wipe and on account deletion. No soft delete, no purge. `[Implemented]`
`src/pages/ThemeEditor.jsx:157-178`, `src/pages/Settings.jsx:230-248,333-348,513-526,650-676,719-742`,
`src/pages/Dashboard.jsx:134-151,163-180`, `src/components/GenericOnboardingDialog.jsx:6-29`,
`base44/functions/deleteSyncedData/entry.ts:58`, `base44/functions/deleteUserAccount/entry.ts:70-72`

**Ordering & read-time sort/limit.** `-updated_date` 1 everywhere. **Denormalised caches.**
`background_library` is mirrored to device storage `theme_bg_history` and merged (set union) on load.
`[Implemented]` `src/pages/ThemeEditor.jsx:58,88-92,174` **Retention.** Indefinite.

**Declared-but-unwritten fields.** `task_sync_category`, `task_sync_color`. `[Implemented]`
`base44/entities/ThemeSettings.jsonc:79-86` (no writer in `src/`)
**Written-but-undeclared fields.** The Theme Editor save re-sends `id`, `created_by`, `created_date`,
`updated_date` and every other loaded key. `[Implemented]` `src/pages/ThemeEditor.jsx:86-89,163-166`
**Required-but-written-empty.** None (no required fields).

---

### ReminderSettings   (E-ReminderSettings)

**Purpose.** Evaluation reminder switch and times; consulted by the dashboard to decide whether to highlight
an incomplete evaluation. `[Implemented]` `base44/entities/ReminderSettings.jsonc:1-34`,
`src/components/dashboard/DashboardFocalAreas.jsx:64-70`

**Source file.** `base44/entities/ReminderSettings.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/ReminderSettings.jsonc:20-33`

**Service-role bypasses.** None. In the full-wipe list. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:58`

**Cardinality.** Singleton by convention on read (`list()`, first row). No writer. `[Partial]`
`src/components/dashboard/DashboardFocalAreas.jsx:32,65`

**Writers.** delete: `base44/functions/deleteSyncedData/entry.ts:58`. create/update: none.
**Readers.** `src/components/dashboard/DashboardFocalAreas.jsx:32`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `enabled` | boolean | no | `false` | — | Reminders on | none | `DashboardFocalAreas.jsx:65` |
| `times` | string[] | no | `[]` | `HH:MM` | Reminder times; highlight once any time ≤ now | none | `DashboardFocalAreas.jsx:65-68` |

**References out / Referenced by.** None.

**Lifecycle.** *Created / updated*: none observed `[Partial]`. *Hard-deleted* by the full wipe. `[Implemented]`
`base44/functions/deleteSyncedData/entry.ts:58`

**Ordering & read-time sort/limit.** unsorted `list()`, first row. **Denormalised caches / Retention.** None.

**Declared-but-unwritten fields.** `enabled`, `times`. **Written-but-undeclared / Required-but-written-empty.** None.

---

### User   (E-User)

**Purpose.** The platform user extended with a `role`. Code also relies on platform-provided `id`, `email`,
`full_name`, and on two flags written through the auth API. `[Implemented]` `base44/entities/User.jsonc:1-17`,
`src/pages/AcceptTerms.jsx:16-19,50`

**Source file.** `base44/entities/User.jsonc`

**Declared RLS.** None declared. `[Implemented]` `base44/entities/User.jsonc:1-17`

**Service-role bypasses.** `generateDailyQuotes` lists all users (`list()`), `backfillDefaultImagesToAllUsers`
lists all users (`-created_date`, 10000), `deleteUserAccount` calls `auth.deleteUser(user.id)`. `[Implemented]`
`base44/functions/generateDailyQuotes/entry.ts:23`, `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:21`,
`base44/functions/deleteUserAccount/entry.ts:81`

**Cardinality.** One per login.

**Writers.** `src/pages/AcceptTerms.jsx:50` (`auth.updateMe({ terms_accepted: true, privacy_accepted: true })`).
**Readers.** `auth.me()` throughout; `role` in `base44/functions/generateDailyQuotes/entry.ts:16`,
`base44/functions/makeImagesDefaults/entry.ts:12`, `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:8`,
`base44/functions/clearChoreLibraryAssignments/entry.ts:12`, `src/pages/Settings.jsx:623`, `src/lib/PageNotFound.jsx:43`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `role` | string | yes | — | `admin` · `user` | Admin gate | none in repository | admin checks above |
| `email` | string | platform | — | email | Tenant key (`created_by`) | platform | every `created_by` filter; `synced_account_email` |
| `full_name` | string | platform | — | free text | Greeting; default goal member; learner fallback | platform | `src/pages/Dashboard.jsx:154`, `src/pages/Goals.jsx:265,596-599,852`, `src/pages/Education.jsx:162,739`, `src/pages/VisionBoard.jsx:165`, `src/components/visionboard/DailyEvaluation.jsx:167` |
| `terms_accepted` | boolean | undeclared | — | — | Terms accepted | `AcceptTerms.jsx:50` | `AcceptTerms.jsx:17`, `src/components/Layout.jsx:42` |
| `privacy_accepted` | boolean | undeclared | — | — | Privacy accepted | `AcceptTerms.jsx:50` | same |

**References out.** None. **Referenced by.** Every entity's `created_by` (by `email`). `[Implemented]` `README.md` §2

**Lifecycle.** *Created* by the platform on sign-up; *updated* once on terms acceptance; *deleted* by
`deleteUserAccount` after all six connectors are disconnected and sixteen entities are emptied.
`[Implemented]` `src/pages/AcceptTerms.jsx:29-58`, `base44/functions/deleteUserAccount/entry.ts:12-83`

**Ordering & read-time sort/limit.** `list()` unlimited; `list("-created_date", 10000)`. **Denormalised
caches / Retention.** None.

**Declared-but-unwritten fields.** `role` (no writer in the repository). **Written-but-undeclared fields.**
`terms_accepted`, `privacy_accepted`. `[Implemented]` `src/pages/AcceptTerms.jsx:50`
**Required-but-written-empty.** None observed.

---

## Discrepancies & open questions (this sheet)

- **Q-006** Blocks: `ReminderSettings` lifecycle. No create or update path exists in the repository; the
  dashboard reads the first row. Whether rows are created outside the repository is not visible.
- **Q-008** Blocks: `User` field table. `email`, `full_name`, `id`, and the two acceptance flags are used
  but not declared in `base44/entities/User.jsonc`; which are platform built-ins and which are free-form
  attributes accepted by `auth.updateMe` is not visible in the repository.
