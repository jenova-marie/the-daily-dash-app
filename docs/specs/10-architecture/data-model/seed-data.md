# Seed & Hardcoded Data

**Area:** `PREF` / data-model · **Level:** 2 · **Status:** draft

**Tag summary:** Implemented 140 · Described 6 · Partial 2

This document records every dataset the product ships with or hardcodes: rows written on first use, fixed option lists
behind pickers, colour mappings that carry meaning, external URLs baked into the client, and the identifiers used to
persist device-local state. Each list is reproduced verbatim so it can be recreated without the source. Lists are grouped
by feature. Where two places in the prototype hold different versions of the same list, both are recorded and a `D-`
entry is opened; no version is chosen as canonical.

Conventions: order in each table is the order in the source. Colours appear only where they carry meaning (priority,
source type, meal type, member, pillar, AQI band, urgency badge). Tailwind class names are quoted as written when the
source uses classes rather than hex values.

---

## 1. Vision Board

### 1.1 Health pillars (13)

`[Implemented]` `src/pages/VisionBoard.jsx:27-47` — created with `HealthPillar.bulkCreate` when the account has no
pillars; `order` is the index in this list (`src/pages/VisionBoard.jsx:81-87`). The entity restricts `name` to exactly
these thirteen values (`base44/entities/HealthPillar.jsonc:5-23`). The source comment states the ordering intent:
"Ordered by Maslow's hierarchy: Physiological → Safety → Love/Belonging → Esteem → Self-Actualization".

| Order | Name | Icon name (lucide) | Colour | Maslow tier (source comment) |
|---|---|---|---|---|
| 0 | Nutrition | Apple | `#10b981` | Tier 1 – Physiological (basic physical survival) |
| 1 | Rest | Moon | `#06b6d4` | Tier 1 – Physiological |
| 2 | Fitness | Zap | `#f59e0b` | Tier 1 – Physiological |
| 3 | Financial | DollarSign | `#84cc16` | Tier 2 – Safety & Security |
| 4 | Home/Environment | Home | `#14b8a6` | Tier 2 – Safety & Security |
| 5 | Relationships | Heart | `#ef4444` | Tier 3 – Love & Belonging |
| 6 | Self-esteem | Star | `#f59e0b` | Tier 4 – Esteem |
| 7 | Career | Briefcase | `#6366f1` | Tier 4 – Esteem |
| 8 | Education | BookOpen | `#3b82f6` | Tier 5 – Self-Actualization |
| 9 | Mindset | Brain | `#8b5cf6` | Tier 5 – Self-Actualization |
| 10 | Destress | Wind | `#ec4899` | Tier 5 – Self-Actualization |
| 11 | Play | Smile | `#f97316` | Tier 5 – Self-Actualization |
| 12 | Spirituality | Sparkles | `#a78bfa` | Tier 5 – Self-Actualization |

- `[Implemented]` If the pillar list request fails, the same thirteen defaults are shown in memory without being written. `src/pages/VisionBoard.jsx:99-102`
- `[Described]` "Manage 13 core wellness areas (Nutrition, Fitness, Mindset, Rest, etc.) organized by Maslow's hierarchy." `src/pages/UserManual.jsx:368`

### 1.2 Default pillar activities (5 per pillar, 65 total)

`[Implemented]` `src/components/visionboard/PillarManager.jsx:10-24` — seeded with `PillarActivity.bulkCreate` for every
pillar that has zero activities when the Pillars tab loads (`:45-74`), and again on demand when "Edit Activities" is
opened on an empty pillar (`:76-91`). Each row carries `pillar_id`, `pillar_name`, `activity`, and `order` = index.

| Pillar | Activities (order 0 → 4) |
|---|---|
| Nutrition | Eat balanced meals · Drink 8+ glasses of water · Meal prep for week · Limit processed foods · Include vegetables in meals |
| Fitness | 30 min cardio · Strength training · Stretching routine · Walk outdoors · Try a new exercise |
| Mindset | Practice gratitude · Positive affirmations · Visualize goals · Journal reflections · Read motivational content |
| Rest | Get 7-8 hours sleep · Take power nap · Relax before bed · Avoid screens at night · Morning meditation |
| Destress | Deep breathing exercise · Take a walk · Listen to music · Yoga session · Talk to someone |
| Play | Laugh and have fun · Engage in hobby · Play a game · Spend time outdoors · Try something new |
| Education | Learn something new · Read article/book · Watch tutorial · Practice skill · Take a course |
| Career | Complete work task · Learn new skill · Network with colleague · Plan career goals · Review progress |
| Home/Environment | Tidy one room · Clean workspace · Organize clutter · Do laundry · Cook a meal |
| Relationships | Call a friend · Spend quality time · Show appreciation · Listen actively · Plan time together |
| Self-esteem | Celebrate accomplishment · Practice self-care · Set personal boundary · Accept compliment · Challenge negative thought |
| Financial | Track spending · Save money · Review budget · Pay a bill · Research investment |
| Spirituality | Practice faith · Meditate · Connect with nature · Help someone · Reflect on values |

### 1.3 Other pillar lists held in code

| List | Values | Used for | Source |
|---|---|---|---|
| Affirmation pillar tags | Nutrition, Fitness, Mindset, Rest, Destress, Play, Education, Career, Home/Environment, Relationships, Self-esteem, Financial, Spirituality | Pillar dropdown when adding or generating affirmations `[Implemented]` | `src/components/visionboard/AffirmationManager.jsx:11-15` |
| Focal-area tie-break priority (lowest index wins) | nutrition, rest, fitness, home, environment, financial, finances, destress, stress, self-esteem, self esteem, relationships, play, career, education, mindset, spirituality | Ordering pillars with equal rating in the dashboard Focal Areas widget; matched by case-insensitive substring; unmatched names rank 999 `[Implemented]` | `src/components/dashboard/DashboardFocalAreas.jsx:6-17` |
| Slideshow fallback pillar names | Physical Health, Mental Health, Relationships, Career & Purpose, Finances, Personal Growth, Spirituality | Used by the Auto-Generated slideshow only when the account has no `HealthPillar` rows `[Implemented]` | `src/components/dashboard/DashboardSlideshow.jsx:55-64` |
| Fallback affirmation | "You are capable of achieving your vision." | Shown when the slideshow is opened with no affirmations `[Implemented]` | `src/components/visionboard/Slideshow.jsx:299` |

- `D-123` The slideshow fallback list (7 names) differs from the 13 seeded pillar names; both are `[Implemented]`.

### 1.4 Rating threshold

- `[Implemented]` A rating of 3 or below marks a pillar as a focal area / low score in the Daily Evaluation, Low Score panel, Affirmation focus row, and Auto slideshow targeting. `src/components/dashboard/DashboardSlideshow.jsx:76`, `src/components/visionboard/LowScorePillars.jsx:10-12`

### 1.5 Slideshow ambient audio presets

`[Implemented]` `src/components/visionboard/Slideshow.jsx:7-19`. On open, the preset named in `slideshowDefaultAudio`
wins; otherwise a random favourite from `slideshowAudioFavorites`; otherwise a random preset excluding None and Custom
(`:57-73`).

| Label | URL |
|---|---|
| None | *(no audio)* |
| Rain | `https://raw.githubusercontent.com/betterthanwell/wisdom-timer/main/public/audio/ambient/rain.mp3` |
| Ocean Waves | `https://raw.githubusercontent.com/betterthanwell/wisdom-timer/main/public/audio/ambient/ocean.mp3` |
| Forest | `https://raw.githubusercontent.com/betterthanwell/wisdom-timer/main/public/audio/ambient/forest.mp3` |
| Relax | `https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3` |
| Beach Serenity | `https://www.no-copyright-music.com/wp-content/uploads/2021/09/BeachSerenity.mp3` |
| Tranquil Reflections | `https://www.no-copyright-music.com/wp-content/uploads/2021/09/TranquilReflections.mp3` |
| Calmness | `https://www.no-copyright-music.com/wp-content/uploads/2021/09/Calmness.mp3` |
| Peaceful | `https://www.no-copyright-music.com/wp-content/uploads/2021/09/Peaceful-Sleep-Music-Free-Royalty-Free-Music-by-Liborio-Conti-01-Peaceful-Sleep-Music.mp3` |
| Ambient Light | `https://www.no-copyright-music.com/wp-content/uploads/2021/09/AmbientLight.mp3` |
| Custom URL… | sentinel value `custom`; the user types a URL |

Other slideshow constants:

| Constant | Values | Source |
|---|---|---|
| Slide speed options (seconds) | 3, 5, 8, 10, 15, 20, 30 · default 30 `[Implemented]` | `src/components/visionboard/Slideshow.jsx:52,804` |
| Default volume | 0.5 `[Implemented]` | `src/components/visionboard/Slideshow.jsx:76` |
| Affirmation modes | `I`, `you`, `both` · default `both` `[Implemented]` | `src/components/visionboard/Slideshow.jsx:87` |
| TTS utterance settings | rate 0.9, pitch 1.1, volume 1 `[Implemented]` | `src/components/visionboard/Slideshow.jsx:345-347` |
| `[Described]` "Adjust speed (3–30 seconds per slide)" | | `src/pages/UserManual.jsx:375` |

### 1.6 Text-to-speech voice whitelist

`[Implemented]` `src/components/visionboard/Slideshow.jsx:101-146,165-183`. Voices are matched case-insensitively by
substring of the browser voice name. Any voice whose name starts with `google ` passes for English, Spanish, French,
German and Tagalog. Voices whose name contains `david`, `mark`, or `zira` are always excluded. If no whitelisted voice
exists the fallback is any `en-` voice, then all voices.

| Language prefix | Rule | Whitelisted name fragments |
|---|---|---|
| `en-` | Google or whitelist | tessa · microsoft ava · microsoft andrew · microsoft emma · microsoft brian · microsoft jenny · microsoft aria · microsoft ana · microsoft christopher · microsoft eric · microsoft michelle · microsoft steffan · microsoft natasha · microsoft sonia · microsoft ryan · microsoft libby · microsoft emily · microsoft ezinne · microsoft abeo · microsoft molly · microsoft luna · microsoft wayne · microsoft imani · microsoft leah · microsoft luke |
| `es-` | Google or whitelist | mónica · paulina · diego · microsoft elvira · microsoft alvaro · microsoft dalia · microsoft jorge |
| `fr-` | Google or whitelist | amélie · thomas · nicolas · microsoft charline · microsoft gerard · microsoft sylvie · microsoft jean · microsoft thierry · microsoft ariane · microsoft fabrice · microsoft denise · microsoft henri · microsoft vivienne · microsoft remy |
| `ar-` / `ar` | Locale must be one of `ar-eg`, `ar-iq`, `ar-sy`, `ar-lb`, `ar-jo` (the Arabic name list `maged, zariyah, hamed, salma, shakir, layla, bassel, nayf, jawhar, rana, tarek` is declared but the locale rule is what is applied) | — |
| `zh-` / `zh` | Locale must be `zh-cn` or `zh-tw` (the Chinese whitelist is declared empty) | — |
| `de-` / `de` | Google or whitelist | microsoft seraphina |
| `fil-` / `tl-` / `fil` | Google or whitelist | mónica · microsoft angel · microsoft blessica · microsoft angelo |

Display grouping (`accentMap`, `:200-244`): `en-US` US English · `en-GB` British English · `en-AU` Australian English ·
`en-IN` Indian English · `en-IE` Irish English · `en-CA` Canadian English · `en-NZ` New Zealand English · `en-ZA` South
African English · `en-SG` Singapore English · `es-ES` Spanish (Spain) · `es-MX` Spanish (Mexico) · `es-AR` Spanish
(Argentina) · `es-CO` Spanish (Colombia) · `fr-FR` French (France) · `fr-CA` French (Canada) · `fr-BE` French (Belgium) ·
`fr-CH` French (Switzerland) · `ar-SA` Arabic (Saudi Arabia) · `ar-EG` Arabic (Egypt) · `ar-AE` Arabic (UAE) · `ar-MA`
Arabic (Morocco) · `ar-DZ` Arabic (Algeria) · `ar-IQ` Arabic (Iraq) · `ar-JO` Arabic Levantine · `ar-KW` Arabic (Kuwait)
· `ar-LB` Arabic Levantine · `ar-LY` Arabic (Libya) · `ar-QA` Arabic (Qatar) · `ar-SY` Arabic Levantine · `ar-TN` Arabic
(Tunisia) · `ar-YE` Arabic (Yemen) · `ar` Arabic · `zh-CN` Chinese Mandarin · `zh-TW` Chinese Taiwanese · `zh-HK` Chinese
(Hong Kong) · `zh` Chinese · `de-DE` German (Germany) · `de-AT` German (Austria) · `de-CH` German (Switzerland) · `de`
German · `fil-PH` Tagalog (Philippines) · `tl-PH` Tagalog (Philippines) · `fil` Tagalog. Unmapped locales display the raw
code.

Translation target names (`langNames`, `:279`): `es` Spanish · `fr` French · `ar` Arabic · `zh` Chinese (Simplified) ·
`de` German · `tl` Tagalog. English (`en`) is never translated (`:268-277,282-285`).

### 1.7 Collage default images

- `[Partial]` The default collage set is not a list in the repository. On terms acceptance and on every shell mount, `initializeDefaultCollageImages` copies every `CollageImage` row flagged `is_default: true` (read with the service role, up to 100, sorted `-order`) into the account with `is_default: false`, only when the account has no collage images yet. `base44/functions/initializeDefaultCollageImages/entry.ts:12-45`, `src/components/Layout.jsx:47-48`
- `[Implemented]` Removing a URL from the Theme Editor's background library also deletes `CollageImage` rows with that `image_url` and `is_default: true`, so backgrounds and default collage images share a pool. `src/pages/ThemeEditor.jsx:149-152`
- `Q-100` The actual URLs of the builder-marked default images are not in the repo; see Open questions.

---

## 2. Chores and Meals

### 2.1 Default rooms

`[Implemented]` `src/lib/choreRooms.js:4` — `Kitchen, Bathroom, Bedroom, Living Room, Dining Room, Laundry Room, Garage,
Entryway, Yard`. The option list shown to the user is the union of rooms found on `ChoreLibrary`/`Chore` rows (casing
priority), these defaults, and device-local custom rooms, minus device-local deleted rooms, deduplicated
case-insensitively and sorted alphabetically (`:32-51`). Meal-type strings are removed from the room list on the Chores
page (`src/pages/Chores.jsx:541-545`).

### 2.2 Chore categories / types

| Context | Values | Source |
|---|---|---|
| Chore edit dialog chips (merged with every non-meal `chore_type` seen in data) | Cleaning, Organizing, Maintenance, Other `[Implemented]` | `src/pages/Chores.jsx:1467,1481` |
| AI Chore Generator "Type of Chore" | Cleaning, Organizing, Maintenance, Meal, Other `[Implemented]` | `src/components/ChoreGenerator.jsx:13` |
| Chore Library dialog type filter | Cleaning, Organizing, Laundry, Cooking/Dishes, Yard Work, Maintenance, Meal `[Implemented]` | `src/components/ChoreLibraryDialog.jsx:13` |

- `D-131` Three category lists coexist for the same `chore_type` field; all three are `[Implemented]`.

### 2.3 Meal types

| Context | Values | Source |
|---|---|---|
| Meal detection (`chore_type` ∈ set) on Chores page, Menu widget, Dashboard Menu & Chores | Breakfast, Lunch, Dinner, Snack, Meal `[Implemented]` | `src/pages/Chores.jsx:538`, `src/components/MenuChoresWidget.jsx:8`, `src/components/dashboard/DashboardMenuChores.jsx:9` |
| AI Chore Generator "Meal Type" | Breakfast, Lunch, Dinner, Snack `[Implemented]` | `src/components/ChoreGenerator.jsx:14` |
| Meal slot on the menu grid | read from `room`; any value outside the set renders as `Other` `[Implemented]` | `src/components/MenuChoresWidget.jsx:50`, `src/pages/Chores.jsx:797` |
| Dashboard chore badge and Daily Schedule count exclude only `chore_type === "Meal"` | `[Implemented]` | `src/pages/Dashboard.jsx:84`, `src/pages/DailySchedule.jsx:249,266` |

- `D-124` Meal exclusion differs: five-value set in the menu widgets vs the single value `"Meal"` in the Dashboard badge and Daily Schedule quick-link.

Meal-type colours (meaning-bearing) `[Implemented]` `src/components/MenuChoresWidget.jsx:13-19`,
`src/components/dashboard/DashboardMenuChores.jsx:14-20`:

| Meal type | Colour class |
|---|---|
| Breakfast | `text-amber-400` |
| Lunch | `text-green-400` |
| Dinner | `text-blue-400` |
| Snack | `text-purple-400` |
| Meal | `text-orange-400` |

### 2.4 Age groups (chores and meals)

`[Implemented]` `src/components/ChoreGenerator.jsx:12` — `3-5, 5-7, 8-10, 11-13, 14-17, 18+, Adult`; displayed as
"`<value>` years" (`:263`). The backend maps each to prompt wording `[Implemented]`
`base44/functions/generateChores/entry.ts:21-29`:

| Age group | Prompt description |
|---|---|
| 3-5 | toddlers and preschoolers (3-5 years old) |
| 5-7 | young children (5-7 years old) |
| 8-10 | children (8-10 years old) |
| 11-13 | pre-teens (11-13 years old) |
| 14-17 | teenagers (14-17 years old) |
| 18+ | young adults (18+ years old) |
| Adult | adults |
| *(other)* | people |

Generator quantity: 1–50, default 5 `[Implemented]` (per briefing; `src/components/ChoreGenerator.jsx`). Generated
chores default `time_estimate` to 30 minutes and coerce `priority` into `low|medium|high` (default `medium`) and
`frequency` into `daily|weekly|biweekly|monthly` (default `weekly`; meals forced to `weekly`) `[Implemented]`
`src/components/ChoreGenerator.jsx:65,155-186`.

### 2.5 Chore frequencies and labels

| Context | Values | Labels | Source |
|---|---|---|---|
| `Chore.frequency` enum | once, daily, weekly, biweekly, monthly, quarterly, yearly, as_needed | — | `base44/entities/Chore.jsonc:15-26` |
| Chores page default list + label map | once, daily, weekly, biweekly, monthly, quarterly, yearly, as_needed (+ `other` bucket for anything else) | Once, Daily, Weekly, Bi-Weekly, Monthly, Quarterly, Yearly, As Needed, Other `[Implemented]` | `src/pages/Chores.jsx:24,547-550,944-950` |
| Synthetic frequency filters | weekdays, weekends (match on `day_of_week` contents) `[Implemented]` | — | `src/pages/Chores.jsx:549,560-570` |
| `ChoreLibrary.frequency` enum | daily, weekly, biweekly, monthly | — | `base44/entities/ChoreLibrary.jsonc:12-19` |
| Library save coercion | anything outside the four library values becomes `weekly` `[Implemented]` | — | `src/pages/Chores.jsx:244,427` |
| Library dialog per-chore override | once, daily, weekly, biweekly, monthly, quarterly, yearly, as_needed | Once, Daily, Weekly, Bi-Weekly, Monthly, Quarterly, Yearly, As Needed `[Implemented]` | `src/components/ChoreLibraryDialog.jsx:422-429` |
| Print grouping labels | daily, weekly, biweekly, monthly | Daily, Weekly, Bi-Weekly, Monthly `[Implemented]` | `src/pages/Chores.jsx:673` |
| New-chore form default | `weekly` `[Implemented]` | | `src/pages/Chores.jsx:79` |

- `D-130` The `ChoreLibrary` entity allows four frequencies while the library dialog offers eight when assigning; both `[Implemented]`.

### 2.6 Chore priorities, statuses, duration buckets, member colours

| List | Values | Source |
|---|---|---|
| `Chore.priority` | low, medium, high · default medium `[Implemented]` | `base44/entities/Chore.jsonc:37-44` |
| `Chore.status` | pending, completed, skipped · default pending `[Implemented]` | `base44/entities/Chore.jsonc:45-53` |
| Duration filter | `quick` = 1–15 min · `medium` = 16–30 · `long` = >30 `[Implemented]` | `src/pages/Chores.jsx:551-558` |
| Household member colour presets | `#10b981, #3b82f6, #f59e0b, #ef4444, #8b5cf6, #ec4899, #14b8a6, #f97316` · default `#10b981` `[Implemented]` | `src/pages/Chores.jsx:81-83` (per briefing for the preset list) |
| Reserved member name | a member literally named `UNASSIGNED` is filtered out of pickers `[Implemented]` | per briefing, `src/pages/Chores.jsx` |
| Day names on chores (`day_of_week`) | full names `Monday … Sunday` `[Implemented]` | `src/pages/Chores.jsx:22,709` |
| Day names on meals (`day_of_week`) | short names `Mon … Sun` `[Implemented]` | `src/components/ChoreGenerator.jsx:15`, `src/pages/Chores.jsx:87,771` |

- `D-108` The same `Chore.day_of_week` field holds full day names for chores and short day names for meals; both `[Implemented]`.

---

## 3. Education

| List | Values | Source |
|---|---|---|
| Default subjects | Math, Reading, Writing, Science, History, Geography, Art, Music, PE, Foreign Language `[Implemented]` | `src/pages/Education.jsx:116` |
| Custom subjects | appended from device-local `edu_custom_subjects` `[Implemented]` | `src/pages/Education.jsx:113-117,230` |
| `EducationActivity.frequency` enum and labels | once, daily, weekly, biweekly, monthly → Once, Daily, Weekly, Biweekly, Monthly · default once `[Implemented]` | `base44/entities/EducationActivity.jsonc:29-39`, `src/pages/Education.jsx:118` |
| `EducationActivity.type` | assignment, activity · default assignment `[Implemented]` | `base44/entities/EducationActivity.jsonc:17-24` |
| Days of week | Mon, Tue, Wed, Thu, Fri, Sat, Sun (entity enum and UI order) `[Implemented]` | `base44/entities/EducationActivity.jsonc:40-53`, `src/pages/Education.jsx:119` |
| Learner default colour | `#8b5cf6` `[Implemented]` | `src/pages/Education.jsx:41` |
| `EducationPlan.status` | not_started, in_progress, completed · default not_started `[Implemented]` | `base44/entities/EducationPlan.jsonc:18-25` |
| Filter pills | Due (blue), Past (red), Next (amber), Done (green), All `[Implemented]` | `src/pages/Education.jsx:945` (per briefing for the full pill set) |
| AI age groups | Preschool (3-5), K-1st Grade (5-7), 2-3rd Grade (7-9), 4-5th Grade (9-11), 6-8th Grade (11-14), High School (14-18), 18+ `[Implemented]` | `src/components/ActivityGenerator.jsx:13` |
| AI activity types | assignment, activity `[Implemented]` | `src/components/ActivityGenerator.jsx:14` |
| AI quantity | 1–10, default 5 `[Implemented]` | per briefing, `src/components/ActivityGenerator.jsx` |
| Learner heading colours by active filter | Due blue · Past red · Next amber · Done green · otherwise purple `[Implemented]` | per briefing, `src/pages/Education.jsx` |

Age groups for chores (§2.4) and education differ in wording and boundaries; each feeds its own generator.

---

## 4. Tasks

### 4.1 Priorities and their colours

`Task.priority`: `low, medium, high, urgent`, default `medium` `[Implemented]` `base44/entities/Task.jsonc:20-29`. Group
order in the Tasks page is urgent → high → medium → low (per briefing).

| Surface | urgent | high | medium | low | Source |
|---|---|---|---|---|---|
| Tasks page row left border | `red-600` | `orange-500` | `yellow-400` | `green-600` | `src/pages/Tasks.jsx:31-36` |
| Daily Schedule grid block (task/custom items) | `red-600` | `orange-500` | `yellow-400` | `green-600` | `src/pages/DailySchedule.jsx:56-68` |
| Dashboard Today's Tasks text | `red-500` | `orange-500` | `cyan-500` | `green-600` | `src/components/dashboard/DashboardTasks.jsx:31-36` |
| Daily To-Do row border | `red-600` | `orange-500` | `cyan-500` | `green-600` | `src/components/SwipeableToDoItem.jsx:14-19` |
| Dashboard Today's Schedule border (task/custom) | `red-600` | `orange-500` | `cyan-500` | `green-600` | `src/components/dashboard/DashboardSchedule.jsx:28-33` |

All rows `[Implemented]`. The medium colour is yellow on the Tasks page and the Daily Schedule grid, cyan on the three
list surfaces.

### 4.2 Recurrence patterns

| Context | Values | Source |
|---|---|---|
| `Task.recurrence_pattern` enum | daily, weekly, biweekly, monthly, days_of_week, occurrences `[Implemented]` | `base44/entities/Task.jsonc:47-57` |
| New-task form "frequency" | one-time (default), daily, weekly, biweekly, monthly, days_of_week, occurrences; `one-time` is stored as `is_recurring: false`, `recurrence_pattern: null` `[Implemented]` | `src/pages/Tasks.jsx:53,209-217` |
| Edit dialog pattern select | includes "Specific Days of Week" for `days_of_week`; default when absent `weekly` `[Implemented]` | `src/components/TaskEditDialog.jsx:32,207-216` |
| Days of week on tasks | short names `Sun, Mon, Tue, Wed, Thu, Fri, Sat` `[Implemented]` | `src/components/TaskEditDialog.jsx:20`, `src/pages/Tasks.jsx:276,289` |
| `Task.status` | pending, in_progress, completed · default pending `[Implemented]` | `base44/entities/Task.jsonc:11-19` |
| Occurrences default | 1; `completed_count` starts at 0 for occurrence tasks `[Implemented]` | `base44/entities/Task.jsonc:58-61`, `src/pages/Tasks.jsx:215-216` |

### 4.3 Filters, sorts, and dashboard time buckets

| List | Values | Source |
|---|---|---|
| Filter values in code | active (default), due, due-today, overdue, unscheduled, not-due-yet, completed `[Implemented]` | `src/pages/Tasks.jsx:46,179-197` |
| Sort values | priority (default), frequency, label `[Implemented]` | `src/pages/Tasks.jsx:47` |
| Google-synced task default label | `Google Tasks` with empty colour, overridable by `ThemeSettings.task_sync_category` / `task_sync_color` `[Implemented]` | `base44/functions/syncGoogleTasks/entry.ts:22-24` |
| Auto-sync task label | literal `Google Tasks` `[Implemented]` | `base44/functions/autoSync/entry.ts:135` |
| Quick Task category | `Quick Task`; custom schedule items create a backing task with category `Custom` `[Implemented]` | per briefing, `src/pages/DailySchedule.jsx` |

- `D-119` Auto-sync writes the literal label `Google Tasks` and ignores `task_sync_category`/`task_sync_color`; the manual sync reads them. Both `[Implemented]`.

Dashboard Today's Tasks time buckets by `due_time` hour `[Implemented]`
`src/components/dashboard/DashboardTasks.jsx:14-29`:

| Key | Label | Hour range (start ≤ h < end) | Icon | Colour |
|---|---|---|---|---|
| morning | Morning | 0–12 | Sunrise | `text-amber-400` |
| afternoon | Afternoon | 12–17 | Sun | `text-orange-400` |
| evening | Evening | 17–20 | Sunset | `text-purple-400` |
| night | Night | 20–24 | Moon | `text-blue-400` |
| anytime | Anytime | no `due_time` | — | `text-muted-foreground` |

---

## 5. Goals

| List | Values | Source |
|---|---|---|
| Timeframes (value → label), section order | daily → Daily · weekly → Weekly · monthly → Monthly · annual → Annual · 3_year → 3 Year · 5_year → 5 Year · occurrences → Occurrences `[Implemented]` | `src/pages/Goals.jsx:23-31`, `src/components/dashboard/DashboardGoals.jsx:100-108` |
| `Goal.timeframe` enum | daily, weekly, monthly, annual, 3_year, 5_year `[Implemented]` | `base44/entities/Goal.jsonc:12-21` |
| New-goal default timeframe | monthly `[Implemented]` | `src/pages/Goals.jsx:55` |
| `Goal.status` | not_started (default), in_progress, completed, on_hold `[Implemented]` | `base44/entities/Goal.jsonc:28-36` |
| Status colours (left border) | not_started `muted-foreground` · in_progress `blue-500` · completed `green-500` · on_hold `amber-500` `[Implemented]` | `src/pages/Goals.jsx:33-38` |
| `GoalTask.frequency` | once, daily, weekly, biweekly, monthly `[Implemented]` | `base44/entities/GoalTask.jsonc:12-20` |
| Pillar-derived goal frequencies | daily, weekly, monthly, annual `[Implemented]` | per briefing, `src/components/visionboard/PillarManager.jsx`, `DailyEvaluation.jsx` |
| Goals created from Education | ActivityGenerator "Also create these as goals" → `weekly`; Activity Library "+" → `monthly`, title `"<subject> Education Goal"` `[Implemented]` | per briefing, `src/components/ActivityGenerator.jsx`, `src/components/ActivityLibrary.jsx` |

- `D-129` The Goals UI offers the timeframe `occurrences`, which the `Goal.timeframe` enum does not list; both `[Implemented]`.

---

## 6. Daily Checklist

| List | Values | Source |
|---|---|---|
| Time-of-day buckets (`DailyChecklist.category`) | morning, afternoon, evening, anytime `[Implemented]` | `base44/entities/DailyChecklist.jsonc:23-30` |
| Bucket sort order (condensed view) | morning 0 · afternoon 1 · evening 2 · anytime 3 (unknown → 3) `[Implemented]` | `src/components/CondensedChecklist.jsx:29-31` |
| Bucket headers | Morning, Afternoon, Evening, Anytime `[Implemented]` | per briefing, `src/components/CondensedChecklist.jsx` |
| New-item defaults | category `morning`, label colour `#3b82f6`, order 0 `[Implemented]` | `src/pages/DailyChecklist.jsx:69,74`, `base44/entities/DailyChecklist.jsonc:34-36` |
| Weekly count display | `n/7` per item, Sunday–Saturday `[Implemented]` | `src/lib/useWeeklyChecklistCounts.js:13-16` |
| Weekly Review bar colours | 7 green · ≥5 primary · ≥3 amber · below muted `[Implemented]` | per briefing, `src/components/visionboard/WeeklyReview.jsx` |

---

## 7. Labels (shared by Tasks, Goals, Daily Checklist, Settings)

| Item | Value | Source |
|---|---|---|
| Palette | `""` (none), `#ef4444`, `#f97316`, `#eab308`, `#22c55e`, `#14b8a6`, `#3b82f6`, `#8b5cf6`, `#ec4899`, `#64748b`, `#a16207` `[Implemented]` | `src/components/LabelPicker.jsx:7-10` |
| History cap | 30 entries, most recent first, device-local `app_label_history` `[Implemented]` | `src/utils/labelHistory.js:1-12` |
| Ungrouped bucket name | `(No Label)` (sorts last) `[Implemented]` | `src/lib/categoryUtils.js:17` |

---

## 8. Link Library

| Item | Value | Source |
|---|---|---|
| Icon list (42) | Folder, ExternalLink, Link2, Globe, Star, Heart, Bookmark, FileText, Image, Music, Video, Code, Terminal, Database, Cloud, Mail, Phone, Calendar, Clock, Map, ShoppingCart, CreditCard, Settings, Home, User, Users, Briefcase, Book, Newspaper, Rss, Youtube, Gamepad2, Camera, Palette, Wrench, Lightbulb, Zap, Flame, Leaf, Sun, Moon, Tag `[Implemented]` | `src/pages/Links.jsx:17-60` |
| Colour list (10) | `#6366f1, #8b5cf6, #ec4899, #ef4444, #f97316, #eab308, #22c55e, #14b8a6, #3b82f6, #64748b` `[Implemented]` | `src/pages/Links.jsx:62-65` |
| Category defaults | icon `Folder`, colour `#6366f1` (new category form, migrated v1 categories, and auto-materialised categories) `[Implemented]` | `src/pages/Links.jsx:82,105-106` |
| Unknown icon name | renders as `Folder` `[Implemented]` | `src/pages/Links.jsx:67-69` |
| Browser-import category | `Imported`, auto-created with the Bookmark icon `[Implemented]` | per briefing, `src/pages/Links.jsx` |
| Icon thumbnail encoding | `thumbnail_url` = `icon:<IconName>|<hex>` `[Implemented]` | per briefing, `src/pages/Links.jsx` |
| Storage keys | `link_categories_v2` (current, objects `{name, icon, color}`), `link_categories` (legacy, string array, read-only migration source) `[Implemented]` | `src/pages/Links.jsx:71-90` |

---

## 9. Daily Schedule

| Item | Value | Source |
|---|---|---|
| Active hours defaults | start 5, end 22; each select offers hours 0–23 labelled `12:00 AM`, `1:00 AM` … `11:00 PM` `[Implemented]` | `src/pages/DailySchedule.jsx:97-98,655-669` |
| Hour row height | `HOUR_PX = 60` (1 px per minute); minimum rendered duration 15 min (per briefing) `[Implemented]` | `src/pages/DailySchedule.jsx:445` |
| New custom block form defaults | start `09:00`, end `10:00`, source `custom`, priority `medium` `[Implemented]` | `src/pages/DailySchedule.jsx:96` |
| Duration options | 15 min, 30 min, 45 min, 1 hr, 1.5 hr, 2 hr, 2.5 hr, 3 hr, 4 hr, 5 hr, 6 hr, 7 hr, 8 hr, 9 hr, 10 hr, 11 hr, 12 hr, 14 hr, 16 hr, 18 hr, 20 hr, 22 hr, 24 hr (values in minutes 15 … 1440) `[Implemented]` | `src/pages/DailySchedule.jsx:1154-1163` |
| `TIME_SLOTS` | 15-minute increments across 24 h, `HH:MM` values; declared, not referenced by UI (per briefing) `[Implemented]` | `src/pages/DailySchedule.jsx:1150-1152` |
| Recent-history entry shape and cap | `{ title, duration }`, duration 60 for quick tasks, most recent first, max 10 `[Implemented]` | `src/pages/DailySchedule.jsx:402-403,860-861` |
| Synthetic library defaults | `default-chores` "Chores" and `default-edu` "Edu", each gated by the matching feature toggle `[Implemented]` | `src/pages/DailySchedule.jsx:937-938,954-955` |
| Urgency quick-link colours | overdue + due → `purple-600` · overdue only → `red-600` · due only → blue · none → neutral `[Implemented]` | `src/pages/DailySchedule.jsx:908-910,924-926` |
| Library group badge | has overdue → `bg-red-600` · has due today → `bg-blue-600` `[Implemented]` | `src/pages/DailySchedule.jsx:1001` |

Source-type colours on the grid `[Implemented]` `src/pages/DailySchedule.jsx:38-54` (normal / overlapping):

| Source type | Background alpha normal / overlap | Border |
|---|---|---|
| calendar, event | `blue-500/25` / `/60` | `blue-500` |
| task | `emerald-500/25` / `/60` | `emerald-500` |
| education | `purple-500/25` / `/60` | `purple-500` |
| chore | `amber-500/25` / `/60` | `amber-500` |
| custom | `muted/60` / `/80` | `muted-foreground` |

For `task` and `custom` items with a priority the priority colour (§4.1) replaces the source colour
(`src/pages/DailySchedule.jsx:70`, `src/components/dashboard/DashboardSchedule.jsx:35-40`).

Daily To-Do row backgrounds `[Implemented]` `src/components/SwipeableToDoItem.jsx:8-12`: event and calendar
`blue-500/25` with `blue-500` border; goal `gray-500/25` with `gray-500` border.

---

## 10. Calendar

| Item | Value | Source |
|---|---|---|
| Source dot / chip colours | calendar `bg-blue-500` · event `bg-blue-600` · task `bg-primary` · education `bg-purple-500` · chore `bg-amber-500` · custom `bg-muted-foreground` (unknown → custom) `[Implemented]` | `src/pages/CalendarPage.jsx:133-140` |
| `[Described]` "Dots are color-coded by source — blue for custom or Google Calendar events, purple for Education, amber for Chores." | | `src/components/onboarding/CalendarOnboarding.jsx:9` |
| Dashboard Today's Schedule border colours | calendar/event `blue-500` · task `emerald-500` · education `purple-500` · chore `amber-500` · custom `muted-foreground`; calendar/event rows also get `bg-blue-500/20` `[Implemented]` | `src/components/dashboard/DashboardSchedule.jsx:14-26` |
| New custom event defaults | 09:00–10:00, "Sync to Google Calendar" on (per briefing) `[Implemented]` | `src/pages/CalendarPage.jsx` |
| Restored tombstone defaults | today 09:00–10:00, `source_type: calendar`, colour `#3b82f6` (per briefing) `[Implemented]` | `src/components/DeletedItemReview.jsx` |
| Imported Google event colour | `#3b82f6`; all-day events stored as `00:00`–`23:59` `[Implemented]` | `base44/functions/autoSync/entry.ts:81-86`, `base44/functions/syncGoogleCalendarToApp/entry.ts:103-107` |
| Month grid | Sunday-first (`startOfWeek` default), up to 3 dots per day; week view up to 4 chips (per briefing) `[Implemented]` | `src/pages/CalendarPage.jsx:98-99` |

---

## 11. Theme Editor and backgrounds

### 11.1 Theme defaults

| Field | Theme Editor default | Entity default | App-boot fallback | Source |
|---|---|---|---|---|
| primary_color | `#1a9a7a` | — | applied only if set | `src/pages/ThemeEditor.jsx:14`, `src/App.jsx:93` |
| accent_color | `#e6930e` | — | applied only if set | `src/pages/ThemeEditor.jsx:15`, `src/App.jsx:94` |
| background_image | `""` | — | `DEFAULT_BG` (below) when not randomising | `src/pages/ThemeEditor.jsx:16`, `src/App.jsx:50,108` |
| widget_bg_opacity | 90 | 70 | 70 | `src/pages/ThemeEditor.jsx:17`, `base44/entities/ThemeSettings.jsonc:21-24`, `src/App.jsx:98` |
| font_size | medium | medium (enum small/medium/large) | not applied at boot | `src/pages/ThemeEditor.jsx:18`, `base44/entities/ThemeSettings.jsonc:25-33` |
| heading_font | Playfair Display | — | applied only if set | `src/pages/ThemeEditor.jsx:19`, `src/App.jsx:97` |
| body_font | Inter | — | applied only if set | `src/pages/ThemeEditor.jsx:20`, `src/App.jsx:96` |
| dark_mode | false | true | dark class added first; removed only when `false` | `src/pages/ThemeEditor.jsx:21`, `base44/entities/ThemeSettings.jsonc:40-43`, `src/App.jsx:67,95`, `index.html:13` |
| widget_border_radius | 12 | 12 | 12 | `src/pages/ThemeEditor.jsx:22`, `base44/entities/ThemeSettings.jsonc:44-47`, `src/App.jsx:99` |
| randomize_background | true | true | true unless `false` | `src/pages/ThemeEditor.jsx:23`, `base44/entities/ThemeSettings.jsonc:48-51`, `src/App.jsx:102` |

All rows `[Implemented]`. `D-121` The editor default opacity (90) and dark mode (false) differ from the entity defaults
(70, true) and the app-boot fallback (70, dark).

| Option list | Values | Source |
|---|---|---|
| Fonts (heading and body) | Inter, Playfair Display, Georgia, Arial, Verdana `[Implemented]` | `src/pages/ThemeEditor.jsx:26-32` |
| Font size map | small 14px / 1.75rem · medium 16px / 2rem · large 18px / 2.5rem `[Implemented]` | `src/pages/ThemeEditor.jsx:34-38` |
| Opacity slider | 10–100 step 5; radius slider 0–24 step 2 (per briefing) `[Implemented]` | `src/pages/ThemeEditor.jsx` |
| Background library cap | 20 URLs, most recent first `[Implemented]` | `src/pages/ThemeEditor.jsx:131,160` |
| `[Described]` "Fonts: Choose heading and body fonts from Google Fonts." | | `src/pages/UserManual.jsx:395` |

### 11.2 Built-in default backgrounds (Theme Editor gallery, 20)

`[Implemented]` `src/pages/ThemeEditor.jsx:318-340`, in gallery order:

1. `https://cdn.lifeofpix.com/214835/_w1800/310111/lifeofpix-caminhointegral-310111.webp`
2. `https://images.unsplash.com/photo-1775840535417-71811b19db5a?q=80&w=1716&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`
3. `https://images.unsplash.com/photo-1768409234914-96f61529b7e2?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`
4. `https://cdn.lifeofpix.com/122862/_w1800/305986/lifeofpix-felipe7096-305986.webp`
5. `https://cdn.lifeofpix.com/127295/_w1800/308669/lifeofpix-eberhardgross6384-308669.webp`
6. `https://images.pexels.com/photos/30309038/pexels-photo-30309038.jpeg`
7. `https://images.unsplash.com/photo-1773672726538-885c0d878033?q=80&w=2064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`
8. `https://images.unsplash.com/photo-1771849146987-89a04383ae87?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`
9. `https://images.unsplash.com/photo-1772354011434-e6d5ff04c211?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`
10. `https://cdn.lifeofpix.com/214835/_w1800/310103/lifeofpix-caminhointegral-310103.webp`
11. `https://cdn.lifeofpix.com/220304/_w1800/310246/lifeofpix-photomarithe-310246.webp`
12. `https://cdn.lifeofpix.com/170780/_w1800/309560/lifeofpix-ranajabbarli2798-309560.webp`
13. `https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920`
14. `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920`
15. `https://images.unsplash.com/photo-1772950399275-81eea958d92b?q=80&w=1886&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`
16. `https://images.pexels.com/photos/34643057/pexels-photo-34643057.jpeg`
17. `https://images.pexels.com/photos/9037438/pexels-photo-9037438.jpeg`
18. `https://images.pexels.com/photos/3157890/pexels-photo-3157890.jpeg`
19. `https://images.pexels.com/photos/36157569/pexels-photo-36157569.jpeg`
20. `https://images.unsplash.com/photo-1590301157284-ab2f8707bdc1?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`
21. `https://cdn.lifeofpix.com/214835/_w1800/310117/lifeofpix-caminhointegral-310117.webp`

(The gallery contains 21 entries as listed; the briefing's count of 20 is superseded by this verbatim list.)

### 11.3 App-boot background library (5) and single default

`[Implemented]` `src/App.jsx:50-58` — used when `ThemeSettings.background_library` is empty:

| Constant | Value |
|---|---|
| `DEFAULT_BG` | `https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920` |
| `DEFAULT_BG_LIBRARY[0]` | `https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920` |
| `DEFAULT_BG_LIBRARY[1]` | `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920` |
| `DEFAULT_BG_LIBRARY[2]` | `https://images.unsplash.com/photo-1771849146987-89a04383ae87?q=80&w=1740&auto=format&fit=crop` |
| `DEFAULT_BG_LIBRARY[3]` | `https://images.unsplash.com/photo-1773672726538-885c0d878033?q=80&w=2064&auto=format&fit=crop` |
| `DEFAULT_BG_LIBRARY[4]` | `https://cdn.lifeofpix.com/127295/_w1800/308669/lifeofpix-eberhardgross6384-308669.webp` |

### 11.4 Pre-React bootstrap (index.html)

`[Implemented]` `index.html:11-28` — before the app loads, an inline script adds the `dark` class, reads
`theme_bg_library` (fallback: one-item list with `defaultBg`), picks a random entry unless `theme_randomize` is `'0'`,
falls back to `theme_last_bg`, then to `defaultBg`, and applies it as a fixed cover background.

| Constant | Value |
|---|---|
| `defaultBg` | `https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920` |
| Favicon | `https://base44.com/logo_v2.svg` (`index.html:5`) |
| Document title | `Base44 APP` (`index.html:8`) |
| Manifest link | `/manifest.json` — file not present in repo `[Partial]` (`index.html:7`) |

---

## 12. Dashboard

### 12.1 Widget registry and default order

`[Implemented]` `src/pages/Dashboard.jsx:22-42`. Saved order (`ThemeSettings.widget_order`, JSON array) is merged with
this list so unknown-to-the-user widgets are appended (`:123-129`).

| # | Widget id | Card title | Component |
|---|---|---|---|
| 1 | `weather` | Weather | `WeatherWidget` |
| 2 | `focal-areas` | Focal Areas | `DashboardFocalAreas` |
| 3 | `checklist` | Daily Checklist | `DashboardChecklist` |
| 4 | `schedule` | Today's Schedule | `DashboardSchedule` |
| 5 | `tasks` | TODAY'S TASKS | `DashboardTasks` |
| 6 | `menu-chores` | Menu & Chores | `DashboardMenuChores` |
| 7 | `goals` | Goals Overview | `DashboardGoals` |
| 8 | `quote` | Daily Quote | `DashboardQuote` |

### 12.2 Greeting

- `[Implemented]` `Good Morning` before 12:00, `Good Afternoon` before 17:00, otherwise `Good Evening`, followed by `, <dashboard_header>` if set, else `, <first word of full_name>` if known. `src/pages/Dashboard.jsx:154`

### 12.3 Dashboard chore/education badge colours

- `[Implemented]` overdue + due → purple · overdue → red · due → blue · none → dim, with a count (per briefing). `src/pages/Dashboard.jsx:270-310`

---

## 13. Daily Quotes

| Item | Value | Source |
|---|---|---|
| Quote source endpoint | `https://api.quotable.io/quotes/random?maxLength=220&limit=5`, up to 8 attempts, skipping any quote text already used by the account `[Implemented]` | `base44/functions/fetchDailyQuote/entry.ts:35-54`, `base44/functions/generateDailyQuotes/entry.ts:40-61` |
| LLM fallback | InvokeLLM prompt "Generate a single unique inspirational or motivational quote. It must NOT be any of these recently used quotes: … Return ONLY a JSON object: {"quote": "...", "author": "Full Name"}" with the last 20 quotes excluded `[Implemented]` | `base44/functions/fetchDailyQuote/entry.ts:56-71` |
| Past-quote read limit | 200 for de-duplication; 50 newest for the page list `[Implemented]` | `base44/functions/fetchDailyQuote/entry.ts:16`, `src/pages/Quotes.jsx:79` |
| Client timeout | 15 s race on `fetchDailyQuote` `[Implemented]` | `src/pages/Quotes.jsx:68-73` |
| `[Described]` "A fresh inspirational quote is generated automatically every day at midnight." | | `src/pages/Quotes.jsx:17` |

---

## 14. Weather

`[Implemented]` `src/components/WeatherWidget.jsx:4-26`.

WMO weather-code mapping (first match wins):

| Code | Label | Icon |
|---|---|---|
| 0 | Clear | Sun |
| ≤ 3 | Cloudy | Cloud |
| ≤ 49 | Fog | Cloud |
| ≤ 59 | Drizzle | CloudDrizzle |
| ≤ 69 | Rain | CloudRain |
| ≤ 79 | Snow | CloudSnow |
| ≤ 82 | Showers | CloudRain |
| ≤ 99 | Thunder | CloudLightning |
| otherwise | Wind | Wind |

US AQI colour bands (meaning-bearing):

| AQI | Colour | Source comment |
|---|---|---|
| ≤ 50 | `#22c55e` | Good |
| ≤ 100 | `#eab308` | Moderate |
| ≤ 150 | `#f97316` | Unhealthy for sensitive |
| ≤ 200 | `#ef4444` | Unhealthy |
| ≤ 300 | `#a855f7` | Very unhealthy |
| > 300 | `#7f1d1d` | Hazardous |

Day abbreviations: `Sun, Mon, Tue, Wed, Thu, Fri, Sat` indexed by UTC weekday of the forecast date (`:17,97`). Cache
TTL 30 minutes (`:37-44`). Empty state copy: "Enable location to see weather" (`:126`).

---

## 15. Settings and integrations constants

| Item | Value | Source |
|---|---|---|
| Connector list shown in Settings | `69e73980123bb49cf43baf96` Google Calendar (type `googlecalendar`, icon 📅, "Sync events to your daily schedule") · `69e7399b50555bb55752878a` Google Tasks (type `googletasks`, icon ✓, "Sync tasks to your task manager") `[Implemented]` | `src/pages/Settings.jsx:24-25` |
| Connector ids used by the sign-up flow | Calendar `69dd6fdb02883eefc6106a2a`, Tasks `69dd7015f461b3b0db0317b2` `[Implemented]` | `src/pages/Auth.jsx:17-18` |
| Connector ids disconnected on terms acceptance | Calendar `69dd40c425113bd8c8dada08`, Tasks `69dd389dc7cfad127e38e98d` `[Implemented]` | `src/pages/AcceptTerms.jsx:35-36` |
| Connector ids disconnected on account deletion | `69e73980123bb49cf43baf96` (GCal2), `69e7399b50555bb55752878a` (GTasks2), `69d737c5f7b27024315facdc` (Dropbox), `69d737a26b81df6409501d64` (Google Docs), `69d73791470f6b941284c243` (Gmail), `69d7377e8cef111d099e117b` (Google Drive) `[Implemented]` | `base44/functions/deleteUserAccount/entry.ts:13-20` |
| Default sync sources | `["calendar","tasks"]` `[Implemented]` | `src/pages/Settings.jsx:133,288`, `base44/functions/autoSync/entry.ts:16-18` |
| Default new scheduled-sync time | `09:00` `[Implemented]` | `src/pages/Settings.jsx:134` |
| Feature toggles and labels | vision_board "Vision Board" · education "Education" · chores "Chores"; all default on `[Implemented]` | `src/pages/Settings.jsx:711-715`, `base44/entities/ThemeSettings.jsonc:55-66` |
| Trash Bin window | items deleted within the last 24 hours, up to 50 rows `[Implemented]` | `src/pages/Settings.jsx:181-188` |
| `[Described]` "deleted tasks can be recovered from the Trash Bin in Settings within 30 days." | | `src/pages/UserManual.jsx:111` |

- `D-115` Three different Google connector id pairs are used by sign-up, terms acceptance, and Settings/functions; all `[Implemented]`.
- `D-114` Trash retention: 24 hours in Settings vs "within 30 days" in the manual.

---

## 16. Onboarding dismissal keys

All flags live in browser localStorage; the second-generation flows also mirror the key into
`ThemeSettings.onboarding_status` (JSON object of `key: true`). See `10-architecture/preferences.md` Part C for the
read/write rules.

| Page | Key | Value written | Generation | Source |
|---|---|---|---|---|
| Dashboard | `dashboard_onboarded` | `"true"` | ThemeSettings + mirror (dismiss) / localStorage-only (trigger) | `src/pages/Dashboard.jsx:64-66,332-335`, `src/components/GenericOnboardingDialog.jsx:23` |
| Daily Checklist | `dailychecklist_onboarded` | `"true"` | ThemeSettings + mirror | `src/pages/DailyChecklist.jsx:329,591` |
| Tasks | `tasks_onboarded` | `"true"` | ThemeSettings + mirror | `src/components/onboarding/TasksOnboarding.jsx:6,33-42` |
| Goals | `goals_onboarding_done` | `"true"` | ThemeSettings + mirror | `src/components/onboarding/GoalsOnboarding.jsx:6,38-47` |
| Daily Quotes | `quotes_onboarded` | `"true"` | ThemeSettings + mirror | `src/pages/Quotes.jsx:43-48,308` |
| Calendar | `calendar_onboarded` | `"1"` | localStorage only | `src/components/onboarding/CalendarOnboarding.jsx:30` |
| Chores | `chores_onboarded` | `"1"` | localStorage only | `src/components/onboarding/ChoresOnboarding.jsx:35`, `src/pages/Chores.jsx:1254` |
| Daily Schedule | `schedule_onboarded` | `"1"` | localStorage only | `src/components/onboarding/DailyScheduleOnboarding.jsx:45`, `src/pages/DailySchedule.jsx:1139` |
| Education | `education_onboarded` | `"1"` | localStorage only | `src/components/onboarding/EducationOnboarding.jsx:30`, `src/pages/Education.jsx:674` |
| Link Library | `links_onboarded` | `"1"` | localStorage only | `src/components/onboarding/LinkLibraryOnboarding.jsx:30`, `src/pages/Links.jsx:329` |
| Vision Board | `visionboard_onboarded` | `"1"` | localStorage only | `src/pages/VisionBoard.jsx:437,442` |

- `D-111` Dismissal values are `"1"` on first-generation pages and `"true"` on second-generation pages; the Dashboard trigger checks for any value while the second-generation triggers check for `=== "true"`.

---

## 17. Scheduled workflows (fixed schedules)

`[Implemented]` `base44/workflows/*.jsonc`:

| Workflow name | Cron (UTC) | Function |
|---|---|---|
| Daily Auto-Sync | `0 12 * * *` | `autoSync` |
| Initialize Collage Images for All Users | `0 10 * * *` | `initializeDefaultCollageImages` |
| Midnight Daily Quote Generator ("midnight Pacific time (07:00 UTC)") | `0 7 * * *` | `generateDailyQuotes` |
| Sync App Events to Google Calendar (Create) | entity trigger: `ScheduleItem` create where `source_type == "custom"` | `syncAppEventToGoogle` (create) |
| Sync App Events to Google Calendar (Update) | entity trigger: `ScheduleItem` update where `source_type == "custom"` and `google_event_id != null` | `syncAppEventToGoogle` (update) |
| Sync App Events to Google Calendar (Delete) | entity trigger: `ScheduleItem` delete where old `source_type == "custom"` and old `google_event_id != null` | `syncAppEventToGoogle` (delete) |

---

## Discrepancies opened here

| ID | Summary |
|---|---|
| D-108 | `Chore.day_of_week` holds full day names for chores (`src/pages/Chores.jsx:22`) and short names for meals (`src/components/ChoreGenerator.jsx:15`). |
| D-111 | Onboarding dismissal values `"1"` (`src/components/onboarding/CalendarOnboarding.jsx:30`) vs `"true"` (`src/components/GenericOnboardingDialog.jsx:23`). |
| D-114 | Trash retention 24 h (`src/pages/Settings.jsx:184-188`) vs 30 days (`src/pages/UserManual.jsx:111`). |
| D-115 | Google connector ids differ across `src/pages/Auth.jsx:17-18`, `src/pages/AcceptTerms.jsx:35-36`, `src/pages/Settings.jsx:24-25`. |
| D-119 | Auto-sync task label literal `Google Tasks` (`base44/functions/autoSync/entry.ts:135`) vs `task_sync_category` (`base44/functions/syncGoogleTasks/entry.ts:22-24`). |
| D-121 | Theme defaults: editor opacity 90 / dark false (`src/pages/ThemeEditor.jsx:17,21`) vs entity 70 / true (`base44/entities/ThemeSettings.jsonc:21-24,40-43`). |
| D-123 | Slideshow fallback pillar names (`src/components/dashboard/DashboardSlideshow.jsx:55`) vs seeded pillars (`src/pages/VisionBoard.jsx:28-47`). |
| D-124 | Meal exclusion set: five values (`src/components/MenuChoresWidget.jsx:8`) vs `"Meal"` only (`src/pages/Dashboard.jsx:84`, `src/pages/DailySchedule.jsx:249`). |
| D-129 | Goal timeframe `occurrences` offered in UI (`src/pages/Goals.jsx:30`) but absent from `base44/entities/Goal.jsonc:12-21`. |
| D-130 | `ChoreLibrary.frequency` enum of four (`base44/entities/ChoreLibrary.jsonc:12-19`) vs eight-value override list (`src/components/ChoreLibraryDialog.jsx:422-429`). |
| D-131 | Three chore category lists (`src/pages/Chores.jsx:1467`, `src/components/ChoreGenerator.jsx:13`, `src/components/ChoreLibraryDialog.jsx:13`). |

## Open questions

| ID | Question | Blocks |
|---|---|---|
| Q-100 | Which image URLs make up the builder's `is_default: true` collage set? They are data in the hosted environment, not in the repo. | §1.7 |
| Q-101 | Is `/manifest.json` served by the hosting platform, or is the PWA manifest absent? | §11.4 |
