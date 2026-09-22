# Data Model — Vision Board

**Area:** `DATA` · **Level:** 2 · **Status:** draft · Conventions: `README.md`

### HealthPillar   (E-HealthPillar)

**Purpose.** One of 13 wellness pillars the account owner rates daily; carries the user's own description,
an icon name, a colour, a display order, and a hidden flag that excludes it from evaluations. `[Implemented]`
`base44/entities/HealthPillar.jsonc:1-64`

**Source file.** `base44/entities/HealthPillar.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/HealthPillar.jsonc:50-63`

**Service-role bypasses.** None. In the full-wipe list; absent from `deleteUserAccount`. `[Implemented]`
`base44/functions/deleteSyncedData/entry.ts:58`, `base44/functions/deleteUserAccount/entry.ts:31-78`

**Cardinality.** Exactly 13 per owner by seeding: when `list()` returns no rows the Vision Board bulk-creates
the default set with `order` = index. No code creates pillars otherwise. `[Implemented]`
`src/pages/VisionBoard.jsx:76-107`

**Seed rows** (name, icon, colour, order 0–12). `[Implemented]` `src/pages/VisionBoard.jsx:28-47,82-86`

| order | name | icon | color |
|---|---|---|---|
| 0 | Nutrition | Apple | `#10b981` |
| 1 | Rest | Moon | `#06b6d4` |
| 2 | Fitness | Zap | `#f59e0b` |
| 3 | Financial | DollarSign | `#84cc16` |
| 4 | Home/Environment | Home | `#14b8a6` |
| 5 | Relationships | Heart | `#ef4444` |
| 6 | Self-esteem | Star | `#f59e0b` |
| 7 | Career | Briefcase | `#6366f1` |
| 8 | Education | BookOpen | `#3b82f6` |
| 9 | Mindset | Brain | `#8b5cf6` |
| 10 | Destress | Wind | `#ec4899` |
| 11 | Play | Smile | `#f97316` |
| 12 | Spirituality | Sparkles | `#a78bfa` |

**Writers.** bulkCreate: `src/pages/VisionBoard.jsx:86`. update: `src/components/visionboard/PillarManager.jsx:158,165`.
delete: `base44/functions/deleteSyncedData/entry.ts:58`.
**Readers.** `src/pages/VisionBoard.jsx:78`, `src/components/dashboard/DashboardFocalAreas.jsx:30`,
`src/components/dashboard/DashboardSlideshow.jsx:59` (all unsorted `list()`).

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `name` | string | yes | — | declared enum of the 13 seed names; the edit dialog is a free-text input | Pillar name | `VisionBoard.jsx:86`, `PillarManager.jsx:166` (`editName`, free text `:439-441`) | name matches `LowScorePillars.jsx:17`, `DailyEvaluation.jsx:50`; seeds `PillarManager.jsx:58` (`DEFAULT_ACTIVITIES[pillar.name]`); LLM prompts `DashboardSlideshow.jsx:63-66` |
| `description` | string | no | — | free text | User's goal for the pillar | `PillarManager.jsx:168` | LLM prompt `PillarGoalGenerator.jsx` |
| `icon` | string | no | — | Lucide icon name | Icon | `VisionBoard.jsx:86` (seed) | rendering |
| `color` | string | no | — | hex | Colour | `VisionBoard.jsx:86`, `PillarManager.jsx:167` | `DailyEvaluation.jsx:169`, `PillarManager.jsx:228` (copied to goals) |
| `order` | number | no | `0` | seed index | Display order | `VisionBoard.jsx:84` | `VisionBoard.jsx:93` |
| `is_hidden` | boolean | no | `false` | — | Excluded from the daily evaluation | `PillarManager.jsx:158` | `VisionBoard.jsx:263` (`pillars.filter(p => !p.is_hidden)`) |

**References out.** None. **Referenced by.** `PillarActivity.pillar_id` + `pillar_name`,
`DailyPillarTracking.pillar_id` + `pillar_name`, `Affirmation.pillar_name`, `Goal.category` (when generated).
`[Implemented]` `base44/entities/PillarActivity.jsonc:5-12`, `base44/entities/DailyPillarTracking.jsonc:5-12`,
`base44/entities/Affirmation.jsonc:9-12`, `src/components/visionboard/PillarManager.jsx:227`

**Lifecycle.** *Created* by seeding on first visit; *updated* by hide/unhide and by the edit dialog (name,
colour, description); *hard-deleted* only by the full wipe. No user-facing delete, no purge. `[Implemented]`
`src/pages/VisionBoard.jsx:76-107`, `src/components/visionboard/PillarManager.jsx:157-180`,
`base44/functions/deleteSyncedData/entry.ts:58`

**Ordering & read-time sort/limit.** Unsorted `list()`; the page sorts by `order`. `[Implemented]` `src/pages/VisionBoard.jsx:93`

**Denormalised caches.** `pillar_name` on activities and tracking rows, `Affirmation.pillar_name`, and
`Goal.category` copy the name at write time; a rename does not refresh them. `[Implemented]`
`src/components/visionboard/PillarManager.jsx:165-173`

**Retention.** Indefinite.

**Declared-but-unwritten / Written-but-undeclared fields.** None. **Required-but-written-empty.** None observed.

---

### PillarActivity   (E-PillarActivity)

**Purpose.** A reusable activity attached to a pillar; ticked during evaluation, or turned into a goal.
`[Implemented]` `base44/entities/PillarActivity.jsonc:1-78`

**Source file.** `base44/entities/PillarActivity.jsonc`

**Declared RLS.** Owner or admin for all four operations (verbatim in `README.md` §2). `[Implemented]`
`base44/entities/PillarActivity.jsonc:28-77`

**Service-role bypasses.** None. In the full-wipe list; absent from `deleteUserAccount`. `[Implemented]`
`base44/functions/deleteSyncedData/entry.ts:57`

**Cardinality.** Many per pillar. Seeded 5 per pillar whenever a pillar has none (13 × 5 = 65 rows for a
fresh account). `[Implemented]` `src/components/visionboard/PillarManager.jsx:10-24,45-74,76-91`

**Writers.** bulkCreate: `src/components/visionboard/PillarManager.jsx:60,79`, `src/components/visionboard/PillarGoalGenerator.jsx:87`.
create: `src/components/visionboard/PillarManager.jsx:113`. delete: `src/components/visionboard/PillarManager.jsx:130`,
`base44/functions/deleteSyncedData/entry.ts:57`.
**Readers.** `src/components/visionboard/PillarManager.jsx:48,213`, `src/components/visionboard/PillarGoalGenerator.jsx:83`,
`src/components/visionboard/DailyEvaluation.jsx:85` (all unsorted `list()`).

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `pillar_id` | string | yes | — | `HealthPillar.id` | Pillar | all creators | grouping `PillarManager.jsx:50-52`, `DailyEvaluation.jsx:87-89`, `PillarGoalGenerator.jsx:84`; goal colour `PillarManager.jsx:219` |
| `pillar_name` | string | yes | — | copied `HealthPillar.name` | Cache of the name | all creators | `Goal.description`/`category` `PillarManager.jsx:222,227`, `DailyEvaluation.jsx:163,168` |
| `activity` | string | yes | — | free text (seed strings or LLM suggestion `title`) | The activity | all creators | goal title, evaluation checklist |
| `order` | number | no | `0` | index within pillar (seed index; count of existing at add time) | Display order | `PillarManager.jsx:65,84,117`, `PillarGoalGenerator.jsx:92` | none observed (no sort) |

**References out.** `pillar_id` → `HealthPillar.id`; `pillar_name` → `HealthPillar.name` (cache).
**Referenced by.** `DailyPillarTracking.selected_activities[]` (ids). `Goal.title` equals `activity` for
generated goals (title match on read). `[Implemented]` `src/components/visionboard/DailyEvaluation.jsx:130,139,48-52`

**Lifecycle.** *Created* by seeding (5 per pillar from the hardcoded table), by the "add activity" input, and
in bulk from the AI suggestion picker; never updated; *hard-deleted* from the pillar's edit list and by the
full wipe. `[Implemented]` `src/components/visionboard/PillarManager.jsx:45-91,110-135`,
`src/components/visionboard/PillarGoalGenerator.jsx:79-100`, `base44/functions/deleteSyncedData/entry.ts:57`

**Ordering & read-time sort/limit.** Unsorted `list()`, no limit. **Denormalised caches.** `pillar_name`, not
refreshed on rename. **Retention.** Indefinite.

**Declared-but-unwritten / Written-but-undeclared / Required-but-written-empty.** None observed.

---

### DailyPillarTracking   (E-DailyPillarTracking)

**Purpose.** The 1–5 rating for one pillar on one date, with notes and the pillar activities selected that
day. `[Implemented]` `base44/entities/DailyPillarTracking.jsonc:1-57`

**Source file.** `base44/entities/DailyPillarTracking.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/DailyPillarTracking.jsonc:43-56`

**Service-role bypasses.** None. In the full-wipe list; absent from `deleteUserAccount`. `[Implemented]`
`base44/functions/deleteSyncedData/entry.ts:57`

**Cardinality.** One per pillar per date by convention: save filters `{ pillar_id, date }` and updates the
first match, else creates. Only pillars with a rating are written. `[Implemented]`
`src/components/visionboard/DailyEvaluation.jsx:122-143`

**Writers.** create/update: `src/components/visionboard/DailyEvaluation.jsx:127,133`. delete: `:197`,
`base44/functions/deleteSyncedData/entry.ts:57`.
**Readers.** `src/components/visionboard/DailyEvaluation.jsx:65,125,196`, `src/pages/VisionBoard.jsx:110,263`,
`src/pages/Dashboard.jsx:112`, `src/components/dashboard/DashboardFocalAreas.jsx:31`,
`src/components/dashboard/DashboardSlideshow.jsx:58`, `src/components/visionboard/AffirmationManager.jsx:35`,
`src/components/visionboard/LowScorePillars.jsx:11`, `src/components/visionboard/PillarGoalGenerator.jsx:23`,
`src/components/visionboard/WeeklyReview.jsx:50`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `pillar_id` | string | yes | — | `HealthPillar.id` | Pillar | `DailyEvaluation.jsx:134` | `DailyEvaluation.jsx:69-71`, `DashboardFocalAreas.jsx:43-48`, `DashboardSlideshow.jsx:76-77`, `PillarGoalGenerator.jsx:23`, `WeeklyReview.jsx:55` |
| `pillar_name` | string | yes | — | copied `HealthPillar.name` | Cache | `DailyEvaluation.jsx:135` | `LowScorePillars.jsx:17` (name match) |
| `date` | string | yes | — | `YYYY-MM-DD` | Evaluation date | `DailyEvaluation.jsx:136` | most-recent-date logic `DashboardFocalAreas.jsx:37-41,61-62`, `DashboardSlideshow.jsx:74-75`; calendar dots `VisionBoard.jsx:111` |
| `rating` | number | yes | — | integer 1–5 (schema `minimum` 1, `maximum` 5) | Score; ≤ 3 marks a focal area | `DailyEvaluation.jsx:128,137` | `DashboardFocalAreas.jsx:44-52`, `DashboardSlideshow.jsx:77`, `LowScorePillars.jsx:16`, `WeeklyReview.jsx:55` (`> 0`) |
| `notes` | string | no | — | free text | Reflection | `DailyEvaluation.jsx:129,138` | `DailyEvaluation.jsx:70`, LLM prompt `PillarGoalGenerator.jsx` |
| `selected_activities` | string[] | no | `[]` | `PillarActivity.id[]` | Activities used that day | `DailyEvaluation.jsx:130,139` | `DailyEvaluation.jsx:71` |

**References out.** `pillar_id` → `HealthPillar.id`; `pillar_name` cache; `selected_activities[]` →
`PillarActivity.id`. **Referenced by.** None.

**Lifecycle.** *Created / updated* on evaluation save (one row per rated pillar); *hard-deleted* for the whole
date by "Delete this evaluation", and by the full wipe. No dismiss or purge. `[Implemented]`
`src/components/visionboard/DailyEvaluation.jsx:118-143,192-208`, `base44/functions/deleteSyncedData/entry.ts:57`

**Ordering & read-time sort/limit.** `-date` 200 (Vision Board calendar, dashboard focal areas), `-date` 50
(dashboard slideshow), `filter({ pillar_id }, "-date", 1)` (goal generator), `filter({ date })` (evaluation,
dashboard, affirmations, focus areas), `filter({})` unlimited (weekly review). "Most recent evaluation" is the
first row's `date` under `-date`. `[Implemented]` `src/pages/VisionBoard.jsx:110`,
`src/components/dashboard/DashboardFocalAreas.jsx:31,37`, `src/components/dashboard/DashboardSlideshow.jsx:58,74`,
`src/components/visionboard/PillarGoalGenerator.jsx:23`, `src/components/visionboard/WeeklyReview.jsx:50`

**Denormalised caches.** `pillar_name`, not refreshed. **Retention.** Indefinite.

**Declared-but-unwritten / Written-but-undeclared / Required-but-written-empty.** None observed.

---

### Affirmation   (E-Affirmation)

**Purpose.** A saved affirmation, optionally tied to a pillar by name, with a favourite flag. `[Implemented]`
`base44/entities/Affirmation.jsonc:1-36`

**Source file.** `base44/entities/Affirmation.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/Affirmation.jsonc:22-35`

**Service-role bypasses.** None. In the full-wipe list; absent from `deleteUserAccount`. `[Implemented]`
`base44/functions/deleteSyncedData/entry.ts:57`

**Cardinality.** Many; one row per non-blank line entered (leading `1.`/`1)` numbering stripped).
`[Implemented]` `src/components/visionboard/AffirmationManager.jsx:61-70`

**Writers.** create: `src/components/visionboard/AffirmationManager.jsx:66`. update: `:96`. delete: `:84`,
`base44/functions/deleteSyncedData/entry.ts:57`.
**Readers.** `src/components/visionboard/AffirmationManager.jsx:45` (`-updated_date` 50),
`src/components/dashboard/DashboardSlideshow.jsx:51`, `src/pages/VisionBoard.jsx:148` (unsorted).

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `text` | string | yes | — | free text | The affirmation | `AffirmationManager.jsx:67` | slideshows `DashboardSlideshow.jsx:52`, `VisionBoard.jsx:149` |
| `pillar_name` | string | no | — | `HealthPillar.name`; `undefined` when "none" | Associated pillar | `AffirmationManager.jsx:68` | `AffirmationManager.jsx:106` |
| `is_favorite` | boolean | no | `false` | — | Favourite | `AffirmationManager.jsx:96` | sort favourites first `AffirmationManager.jsx:105` |

**References out.** `pillar_name` → `HealthPillar.name` (soft). **Referenced by.** None.

**Lifecycle.** *Created* from the compose box (one per line); *updated* by the favourite toggle;
*hard-deleted* singly and by the full wipe. `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:53-101`

**Ordering & read-time sort/limit.** `-updated_date` 50 (manager); unsorted unlimited (slideshows); in memory
favourites first. **Denormalised caches / Retention.** None / indefinite.

**Declared-but-unwritten / Written-but-undeclared / Required-but-written-empty.** None observed.

---

### CollageImage   (E-CollageImage)

**Purpose.** A public-URL collage image (uploaded file URL or pasted URL). Rows flagged `is_default` form the
seed set that is copied into accounts that have no images. `[Implemented]` `base44/entities/CollageImage.jsonc:1-46`,
`base44/functions/initializeDefaultCollageImages/entry.ts:12-45`

**Source file.** `base44/entities/CollageImage.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/CollageImage.jsonc:32-45`

**Service-role bypasses.** `initializeDefaultCollageImages` reads `is_default: true` rows across all owners
(`-order`, 100) and copies them as the caller with `is_default: false`; `makeImagesDefaults` (admin) sets
`is_default: true` on the caller's rows via service role; `backfillDefaultImagesToAllUsers` (admin) reads all
rows (10000) and all users, and bulk-creates missing defaults for each user with explicit `created_by`,
deduplicated by `image_url`. `[Implemented]` `base44/functions/initializeDefaultCollageImages/entry.ts:20-38`,
`base44/functions/makeImagesDefaults/entry.ts:17-33`, `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:13-48`

**Cardinality.** Many per owner. Seeding runs only when the owner has no rows at all; it is triggered on every
layout mount, on terms acceptance, and daily at 10:00 UTC by workflow. `[Implemented]`
`base44/functions/initializeDefaultCollageImages/entry.ts:13-17`, `src/components/Layout.jsx:48`,
`src/pages/AcceptTerms.jsx:54`, `base44/workflows/Initialize Collage Images for All Users.jsonc:10-33`

**Writers.** create: `src/components/visionboard/ImageUploadSection.jsx:22,45`. bulkCreate:
`base44/functions/initializeDefaultCollageImages/entry.ts:38`, `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:44`.
update: `src/components/visionboard/ImageGallery.jsx:46`, `src/pages/VisionBoard.jsx:185,193`,
`base44/functions/makeImagesDefaults/entry.ts:31`. delete: `src/components/visionboard/ImageGallery.jsx:37`,
`src/pages/ThemeEditor.jsx:151`, `base44/functions/deleteSyncedData/entry.ts:59`.
**Readers.** `src/components/dashboard/DashboardSlideshow.jsx:16`, `src/components/visionboard/ImageGallery.jsx:23`,
`src/pages/VisionBoard.jsx:135,180`, `src/pages/ThemeEditor.jsx:150`,
`base44/functions/initializeDefaultCollageImages/entry.ts:13,20`, `base44/functions/makeImagesDefaults/entry.ts:17`,
`base44/functions/backfillDefaultImagesToAllUsers/entry.ts:13,29`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `image_url` | string | yes | — | public URL (upload result `file_url`, or pasted) | The image | `ImageUploadSection.jsx:23,46`, copies | rendering; dedup `backfill:30-34`; `ThemeEditor.jsx:150` |
| `title` | string | no | — | file name without extension, or last URL path segment or `"Image"` | Caption | `ImageUploadSection.jsx:24,47`, copies | rendering |
| `order` | number | no | `0` | integer | Slideshow order | copies only (`initialize:30`, `backfill:38`) | `list("order")` sorts |
| `is_default` | boolean | no | `false` | — | Schema description: "Legacy field"; code: seed marker | `ImageUploadSection.jsx:25,48` (`true` on every user add), `VisionBoard.jsx:183-196` (all `false`, then displayed ones `true`), `makeImagesDefaults:31` (`true`), copies (`false`) | `initialize:20`, `backfill:14`, `ThemeEditor.jsx:150` |
| `hidden_from_slideshow` | boolean | no | `false` | — | Excluded from slideshows | `ImageGallery.jsx:46` | `DashboardSlideshow.jsx:17`, `VisionBoard.jsx:138` |

**References out / Referenced by.** None. A device-local list `deleted_collage_images` of ids is also
consulted when listing. `[Implemented]` `src/components/visionboard/ImageGallery.jsx:24-25,39-40`

**Lifecycle.** *Created* by upload (public file) or URL paste with `is_default: true`; *copied* into new
accounts and by admin backfill with `is_default: false`; *updated* by hide/show and by "save as defaults" or
the admin function; *hard-deleted* from the gallery (id also remembered on the device), when a theme
background URL is removed from the background library (rows matching `image_url` with `is_default: true`),
and by the full wipe. `[Implemented]` `src/components/visionboard/ImageUploadSection.jsx:12-58`,
`src/components/visionboard/ImageGallery.jsx:35-48`, `src/pages/VisionBoard.jsx:177-206`,
`src/pages/ThemeEditor.jsx:141-155`, `base44/functions/deleteSyncedData/entry.ts:59`

**Ordering & read-time sort/limit.** `list("order", 1000)` (gallery), `list("order", 100)` (Vision Board),
unsorted (dashboard slideshow), `-updated_date` 1 (existence check), `-order` 100 / 1000 / 10000 (functions).
`[Implemented]` `src/components/visionboard/ImageGallery.jsx:23`, `src/pages/VisionBoard.jsx:135,180`,
`src/components/dashboard/DashboardSlideshow.jsx:16`, `base44/functions/initializeDefaultCollageImages/entry.ts:13,20`,
`base44/functions/makeImagesDefaults/entry.ts:17`, `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:13`

**Denormalised caches / Retention.** None / indefinite.

**Declared-but-unwritten fields.** `order` is never written by the frontend. **Written-but-undeclared fields.**
`created_by` is written explicitly by the admin backfill. `[Implemented]` `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:45`
**Required-but-written-empty.** None observed.

---

### UserCollageImage   (E-UserCollageImage)

**Purpose.** A privately uploaded collage image with its file URI, a cached signed URL and expiry, and a
slideshow opt-in. `[Implemented]` `base44/entities/UserCollageImage.jsonc:1-48`

**Source file.** `base44/entities/UserCollageImage.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/UserCollageImage.jsonc:34-47`

**Service-role bypasses.** None. Absent from both wipe lists. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:50-60`,
`base44/functions/deleteUserAccount/entry.ts:31-78`

**Cardinality.** One row per uploaded file.

**Writers.** create: `src/components/visionboard/PrivateImageUploader.jsx:103`. update: `:15,79,123`,
`src/components/dashboard/DashboardSlideshow.jsx:38`, `src/pages/VisionBoard.jsx:126`. delete: `:136`.
**Readers.** `src/components/visionboard/PrivateImageUploader.jsx:38`, `src/pages/VisionBoard.jsx:117` (`list("order", 500)`),
`src/components/dashboard/DashboardSlideshow.jsx:30` (`filter({ include_in_slideshow: true }, "order", 500)`).

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `file_uri` | string | yes | — | private file URI from the upload integration | The file | `PrivateImageUploader.jsx:104` | signed-URL minting `:11-14,70,99`, `DashboardSlideshow.jsx:36`, `VisionBoard.jsx:124` |
| `signed_url` | string | no | — | URL valid 3600 s | Cached display URL | `PrivateImageUploader.jsx:16,80,105`, `DashboardSlideshow.jsx:38`, `VisionBoard.jsx:126` | all readers |
| `signed_url_expires` | number | no | — | epoch ms = mint time + 3 600 000 | Cache expiry | same as `signed_url` | refresh test: expires < now + 60 000 `PrivateImageUploader.jsx:8,54-55`, `DashboardSlideshow.jsx:34`, `VisionBoard.jsx:122` |
| `title` | string | no | — | file name without extension | Caption | `PrivateImageUploader.jsx:107` | rendering |
| `include_in_slideshow` | boolean | no | `true` | — | Slideshow opt-in | `PrivateImageUploader.jsx:108,124` | `DashboardSlideshow.jsx:23,30`, `VisionBoard.jsx:139` |
| `order` | number | no | `0` | — | Declared; never written | none | `list("order")` sorts |

**References out / Referenced by.** None.

**Lifecycle.** *Created* per uploaded file with a freshly minted signed URL; *refreshed* whenever a reader
finds the cached URL missing or expiring within 60 s (new URL and expiry written back); *updated* by the
slideshow toggle; *hard-deleted* from the uploader after confirm. Not deleted by either wipe. `[Implemented]`
`src/components/visionboard/PrivateImageUploader.jsx:6-20,50-89,91-138`

**Ordering & read-time sort/limit.** `"order"` ascending, 500. **Denormalised caches.** `signed_url` /
`signed_url_expires` cache the minted URL; refresh rule above. **Retention.** Indefinite.

**Declared-but-unwritten fields.** `order`. **Written-but-undeclared / Required-but-written-empty.** None observed.

---

## Discrepancies & open questions (this sheet)

- **D-014** `CollageImage.is_default` is described in the schema as "Legacy field" (`base44/entities/CollageImage.jsonc:18-22`)
  while every user add writes it `true` (`src/components/visionboard/ImageUploadSection.jsx:25,48`) and the
  seeding and backfill functions read it as the seed marker across all owners
  (`base44/functions/initializeDefaultCollageImages/entry.ts:20`, `base44/functions/backfillDefaultImagesToAllUsers/entry.ts:14`).
- **D-015** `HealthPillar.name` is a 13-value enum in the schema (`base44/entities/HealthPillar.jsonc:5-23`)
  and a free-text input in the edit dialog (`src/components/visionboard/PillarManager.jsx:439-441,165-166`);
  activity seeding and focus-area matching key on the name (`src/components/visionboard/PillarManager.jsx:58`,
  `src/components/visionboard/LowScorePillars.jsx:17`).
- **Q-004** Blocks: `CollageImage` seed-set description. The seed source is every `is_default: true` row from
  any owner (`base44/functions/initializeDefaultCollageImages/entry.ts:19-20`, comment "builder's marked
  default images"); which owner's rows are intended as the seed set is not visible in the repository.
