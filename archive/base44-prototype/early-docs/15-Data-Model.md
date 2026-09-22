# Data Model — Complete Entity Schemas

> This is the **appendix for reimplementation**. Every entity in the Base44 app is listed with its full field schema and intent. Built-in fields on every record (`id`, `created_date`, `updated_date`, `created_by`) are omitted from each table — assume them present on all tables in Supabase (e.g., `id uuid primary key`, `created_at timestamptz`, `updated_at timestamptz`, `user_id uuid references auth.users` for RLS).
>
> **Isolation model:** every entity is **per-user isolated** (RLS `created_by = user.email`). The Supabase equivalent is RLS policies scoping all rows to `auth.uid()`. A few entities (`PillarActivity`, `DailyGratitude`) additionally allow `admin`-role access.

---

## Entity relationship map

```mermaid
erDiagram
  Learner ||--o{ EducationPlan : "learner_id"
  EducationPlan ||--o{ EducationActivity : "plan_id + learner_id + subject"
  Learner ||--o{ EducationActivity : "learner_id"
  Learner ||--o{ FavoriteActivity : "learner_id"
  Goal ||--o{ GoalTask : "goal_id"
  GoalTask }o--|| Goal : "progress derived from tasks"
  HealthPillar ||--o{ DailyPillarTracking : "pillar_id"
  HealthPillar ||--o{ PillarActivity : "pillar_id"
  HealthPillar ||--o{ Affirmation : "pillar_name"
  DailyChecklist ||--o{ ChecklistCompletion : "checklist_item_id + date"
  Task ||--o{ ScheduleItem : "source_id (source_type=task)"
  EducationActivity ||--o{ ScheduleItem : "source_id (source_type=education)"
  Chore ||--o{ ScheduleItem : "source_id (source_type=chore) [rare]"
  GoalTask ||--o{ ScheduleItem : "source_id (source_type=goal)"
  SelectedCalendars }o--|| ScheduleItem : "feeds calendar mirror"
  SelectedTaskLists }o--|| Task : "feeds google-task mirror"
  ChoreUser ||--o{ Chore : "assigned_to"
  ChoreLibrary }o--o{ Chore : "template → instance"
  ThemeSettings ||--|| User : "1 per user"
  SyncState ||--|| User : "1 per user"
  CollageImage }o--|| User : "public collage images"
  UserCollageImage }o--|| User : "private collage images"
  DeletedSyncItem }o--|| ScheduleItem|Task : "gates re-import"
  TrashBin }o--|| Task : "soft-deleted snapshot"
```

---

## Productivity domain

### Task
One-time or recurring to-dos. Native source-of-truth *and* mirror of Google Tasks (via `google_task_id`).

| field | type | notes |
|---|---|---|
| title | string | **required** |
| description | string | long text / notes |
| status | enum `pending` `in_progress` `completed` | default `pending` |
| priority | enum `low` `medium` `high` `urgent` | default `medium` |
| due_date | date | |
| due_time | string | HH:MM |
| category | string | label/category |
| category_color | string | hex |
| is_recurring | boolean | default false |
| recurrence_pattern | enum `daily` `weekly` `biweekly` `monthly` `days_of_week` `occurrences` | set when recurring |
| occurrences | number | total times to complete (for `occurrences` pattern) |
| completed_count | number | how many times completed so far |
| days_of_week | string[] | e.g. `["Mon","Wed"]` for weekly/days_of_week |
| last_completed_date | date | |
| google_task_id | string | set when mirrored from Google Tasks |
| synced_to_schedule | boolean | default false — whether pushed onto Daily Schedule |
| schedule_time | string | HH:MM slot on the schedule |
| links | string | JSON array of resource URLs |

**Business rules:** completing a recurring task spawns the next occurrence (deduped by title+pattern); occurrence-based tasks increment `completed_count` until ≥ `occurrences` then mark completed. Deleting a Google-linked task prompts "delete from Google too". Deletions snapshot to `TrashBin` (24h restore).

### TrashBin
Soft-delete snapshot for restore.

| field | type | notes |
|---|---|---|
| item_type | enum `task` | (extensible) |
| item_id | string | original id |
| item_data | string | JSON-serialized record |
| deleted_at | date-time | |

### ScheduleItem
A block on the Daily Schedule for a given date. **The unified time-grid entity** — mirrors calendar events, surfaces tasks/education/goal tasks, and holds custom blocks.

| field | type | notes |
|---|---|---|
| title | string | **required** |
| date | date | **required** |
| start_time | string | **required** HH:MM |
| end_time | string | HH:MM |
| source_type | enum `calendar` `task` `education` `chore` `custom` | provenance |
| source_id | string | FK to source entity (Task/EducationActivity/GoalTask/Chore) or Google event id |
| color | string | hex |
| notes | string | |
| completed | boolean | default false |
| priority | enum `low` `medium` `high` `urgent` | derived from linked task |
| deleted_from_app | boolean | default false — soft-deleted, hide everywhere |
| hidden_from_grid | boolean | default false — hide from hourly grid only |
| hidden_from_todo | boolean | default false — hide from to-do list only |
| google_event_id | string | when mirrored/created in Google |
| google_calendar_id | string | which Google calendar |

### DailyChecklist
Recurring daily routine item definitions (not per-day completions).

| field | type | notes |
|---|---|---|
| title | string | **required** |
| description | string | |
| time_of_day | string | optional HH:MM |
| is_active | boolean | default true |
| order | number | default 0 |
| category | enum `morning` `afternoon` `evening` `anytime` | |
| label | string | custom color-label |
| label_color | string | hex, default `#3b82f6` |

### ChecklistCompletion
Per-item, per-date completion record.

| field | type | notes |
|---|---|---|
| checklist_item_id | string | **required** FK DailyChecklist |
| date | date | **required** |
| completed | boolean | default false |
| completed_at | string | timestamp |

---

## Household domain

### Chore
A household chore *or* a menu/meal item (distinguished by `chore_type`).

| field | type | notes |
|---|---|---|
| title | string | **required** |
| description | string | |
| assigned_to | string | FK ChoreUser id (single assignee per row; multi-assignee = multiple rows) |
| frequency | enum `once` `daily` `weekly` `biweekly` `monthly` `quarterly` `yearly` `as_needed` | |
| day_of_week | string[] | full day names e.g. `["Monday"]` |
| room | string | location (for chores) OR meal subtype (Breakfast/Lunch/Dinner/Snack) for meals |
| priority | enum `low` `medium` `high` | default `medium` |
| status | enum `pending` `completed` `skipped` | default `pending` |
| due_date | date | computed next due date |
| last_completed_date | date | |
| time_estimate | number | minutes |
| notes | string | |
| chore_type | string | "Meal" / "Breakfast" etc. = menu item; otherwise a chore category (Cleaning, Organizing, Maintenance, custom) |

**Business rules:** meals (`chore_type` in {Breakfast,Lunch,Dinner,Snack,Meal}) are **excluded from the Chores list** and **only appear in the Menu tab** and the Menu/Chores widgets. Completing a non-`as_needed` chore computes the next due date from today (never goes overdue). Multi-assignee creates duplicate Chore rows (deduped in the UI).

### ChoreLibrary
Reusable chore templates (created via AI generator or manual save).

| field | type | notes |
|---|---|---|
| title | string | **required** |
| description | string | |
| frequency | enum `daily` `weekly` `biweekly` `monthly` | **required** |
| time_estimate | number | minutes |
| priority | enum `low` `medium` `high` | |
| room | string | |
| chore_type | string | |

### ChoreUser
A household member (assignee). Shared conceptually with Goals' "member_name".

| field | type | notes |
|---|---|---|
| name | string | **required** |
| color | string | hex |
| avatar | string | |

---

## Education domain

### Learner
A child/student being educated.

| field | type | notes |
|---|---|---|
| name | string | **required** |
| grade_level | string | e.g. "5th Grade" |
| color | string | hex for visual ID |
| avatar | string | |

### EducationPlan
A subject plan for a learner (one per learner+subject).

| field | type | notes |
|---|---|---|
| learner_id | string | **required** FK Learner |
| subject | string | **required** |
| title | string | **required** (usually = subject) |
| description | string | |
| status | enum `not_started` `in_progress` `completed` | default `not_started` |
| due_date | date | target/completion date |
| due_time | string | |
| materials | string | textbook/worksheet text |
| notes | string | |
| synced_to_schedule | boolean | default false |
| schedule_time | string | |

### EducationActivity
An assignment/activity within a plan, possibly recurring.

| field | type | notes |
|---|---|---|
| plan_id | string | **required** FK EducationPlan |
| learner_id | string | **required** |
| subject | string | **required** |
| title | string | **required** |
| type | enum `assignment` `activity` | default `assignment` |
| due_date | date | |
| frequency | enum `once` `daily` `weekly` `biweekly` `monthly` | default `once` |
| days_of_week | string[] | `Mon`…`Sun` short names |
| notes | string | |
| resource_links | string | JSON array of URLs |
| completed | boolean | default false |
| last_completed_date | date | |

**Business rules:** recurring activities reset to the next scheduled day after completion; one-time completed activities are archived/done. Due-today logic respects frequency + days_of_week + last_completed_date.

### FavoriteActivity
Saved activity for reuse (activity library).

| field | type | notes |
|---|---|---|
| learner_id | string | **required** |
| title | string | **required** |
| description | string | |
| type | enum `assignment` `activity` | |
| duration | string | |
| materials | string | |

---

## Goals & wellness domain

### Goal
A personal/family goal with auto-computed progress.

| field | type | notes |
|---|---|---|
| title | string | **required** |
| description | string | |
| timeframe | enum `daily` `weekly` `monthly` `annual` `3_year` `5_year` `occurrences` | **required** |
| occurrences | number | default 1 — count for occurrence-based goals |
| status | enum `not_started` `in_progress` `completed` `on_hold` | default `not_started` |
| progress | number | 0–100, auto-derived from GoalTasks |
| target_date | date | |
| milestones | string | legacy free-text milestone list (new system uses GoalTask) |
| member_name | string | assignee (user or family member) |
| archived | boolean | default false |
| started_at | date-time | set when status first → in_progress |
| completed_at | date-time | set when status first → completed |
| category | string | label |
| category_color | string | hex |

### GoalTask
A milestone/task under a goal; can be occurrence-based.

| field | type | notes |
|---|---|---|
| goal_id | string | **required** FK Goal |
| title | string | **required** |
| frequency | enum `once` `daily` `weekly` `biweekly` `monthly` | **required** |
| completed | boolean | default false |
| occurrences | number | default 1 |
| completed_count | number | default 0 |

### HealthPillar
One of 13 wellness pillars (Maslow-ordered), per user (seeded with defaults).

| field | type | notes |
|---|---|---|
| name | enum (13 values: Nutrition, Rest, Fitness, Financial, Home/Environment, Relationships, Self-esteem, Career, Education, Mindset, Destress, Play, Spirituality) | **required** |
| description | string | user's personal description/goal for pillar |
| icon | string | lucide icon name |
| color | string | hex |
| order | number | default 0 |
| is_hidden | boolean | default false — excluded from daily assessment |

### DailyPillarTracking
A single pillar's rating for a given date.

| field | type | notes |
|---|---|---|
| pillar_id | string | **required** FK HealthPillar |
| pillar_name | string | **required** (cached) |
| date | date | **required** |
| rating | number | **required** 1–5 |
| notes | string | reflection |
| selected_activities | string[] | IDs of PillarActivity used |

### PillarActivity
Suggested activities for a pillar (seeded + user-managed). **Admin-accessible in addition to owner.**

| field | type | notes |
|---|---|---|
| pillar_id | string | **required** |
| pillar_name | string | **required** |
| activity | string | **required** description |
| order | number | default 0 |

### Affirmation
A user's affirmation, optionally tied to a pillar.

| field | type | notes |
|---|---|---|
| text | string | **required** |
| pillar_name | string | associated pillar |
| is_favorite | boolean | default false |

### DailyGratitude
A daily gratitude entry. **Admin-accessible in addition to owner.**

| field | type | notes |
|---|---|---|
| date | date | **required** |
| entry | string | **required** one thing grateful for |

---

## Inspiration & media domain

### DailyQuote
AI-generated daily quote + user reflection.

| field | type | notes |
|---|---|---|
| quote | string | **required** |
| author | string | |
| date | date | **required** |
| reflection | string | user's written reflection |
| is_favorite | boolean | default false |

### CollageImage
Public (URL-based) vision-collage image.

| field | type | notes |
|---|---|---|
| image_url | string | **required** public URL |
| title | string | optional |
| order | number | default 0 |
| is_default | boolean | default false (legacy) |
| hidden_from_slideshow | boolean | default false |

### UserCollageImage
Private (uploaded) vision-collage image, displayed via signed URLs.

| field | type | notes |
|---|---|---|
| file_uri | string | **required** private storage URI |
| signed_url | string | cached signed URL |
| signed_url_expires | number | epoch ms when signed URL expires |
| title | string | |
| include_in_slideshow | boolean | default true |
| order | number | default 0 |

---

## Configuration & sync domain

### ThemeSettings
Single record per user. Drives theming, feature toggles, sync config, onboarding state.

| field | type | notes |
|---|---|---|
| primary_color | string | hex |
| accent_color | string | hex |
| background_image | string | URL |
| background_library | string[] | randomized-from library |
| widget_bg_opacity | number | default 70 |
| font_size | enum `small` `medium` `large` | default `medium` |
| heading_font | string | |
| body_font | string | |
| dark_mode | boolean | default true |
| widget_border_radius | number | default 12 |
| randomize_background | boolean | default true |
| dashboard_header | string | custom greeting name |
| enable_vision_board | boolean | default true |
| enable_education | boolean | default true |
| enable_chores | boolean | default true |
| sync_times | string (JSON) | `["09:00","18:00"]` auto-sync times |
| sync_sources | string (JSON) | `["calendar","tasks"]` |
| auto_sync_calendar_ids | string (JSON) | which calendars auto-sync |
| task_sync_category | string | default label for synced Google tasks |
| task_sync_color | string | default color for synced Google tasks |
| widget_order | string (JSON) | dashboard widget order array |
| onboarding_status | string (JSON) | map of dismissed onboarding keys |

### SelectedCalendars
Which Google calendars the user includes in sync.

| field | type | notes |
|---|---|---|
| calendar_id | string | **required** Google calendar id |
| calendar_name | string | **required** |
| is_selected | boolean | default true |
| last_synced | date-time | |

### SelectedTaskLists
Which Google Task lists the user includes in sync.

| field | type | notes |
|---|---|---|
| list_id | string | **required** Google list id |
| list_name | string | **required** |
| is_selected | boolean | default true |
| last_synced | date-time | |

### SyncState
Last-sync metadata (single record per user).

| field | type | notes |
|---|---|---|
| sync_token | string | (unused/legacy) |
| last_sync | date-time | |
| source | string | e.g. `googlecalendar` |
| synced_account_email | string | |

### DeletedSyncItem
Gate for re-importing items deleted on the app side.

| field | type | notes |
|---|---|---|
| source_type | enum `calendar` `task` | **required** |
| google_id | string | **required** |
| title | string | **required** |
| sync_source | string | **required** which sync detected it |
| last_detected | date-time | |
| status | enum `pending_review` `denied` `allowed` | default `pending_review` |

### ReminderSettings
Vision-board reminder notification config (push intent).

| field | type | notes |
|---|---|---|
| enabled | boolean | default false |
| times | string[] | HH:MM list |

---

## Misc

### Link
A saved bookmark with optional thumbnail.

| field | type | notes |
|---|---|---|
| title | string | **required** |
| url | string | **required** |
| category | string | |
| thumbnail_url | string | auto-fetched |

### User (built-in)
Provided by the platform; not created via the app. Read-only: `id`, `created_date`, `email`, `full_name`; editable: `role` (`admin`/`user`).

---

## Notes for the Supabase reimplementation

1. **Replace `created_by` (email) with `user_id uuid`** referencing `auth.users` for cleaner RLS.
2. **JSON-in-string fields** (`ThemeSettings.sync_times`, `widget_order`, `onboarding_status`, `Task.links`, `EducationActivity.resource_links`, etc.) should become native `jsonb` columns.
3. **String-array fields** (`Chore.day_of_week`, `Task.days_of_week`, `EducationActivity.days_of_week`, `DailyPillarTracking.selected_activities`, `ThemeSettings.background_library`) → `text[]` or `jsonb`.
4. **Cached signed URLs** (`UserCollageImage.signed_url`/`signed_url_expires`) become a Supabase Storage signed-URL caching concern; private bucket + RLS, generate on demand.
5. **RLS:** all tables default to `user_id = auth.uid()`; `PillarActivity` and `DailyGratitude` additionally allow `role = 'admin'`.
6. **Mirror vs canonical:** `ScheduleItem` (calendar-sourced) and `Task` (google-task-sourced) are *mirrors* — Google is canonical. Native `Task`s, `Chore`s, `EducationActivity`s, etc. are canonical in the app.