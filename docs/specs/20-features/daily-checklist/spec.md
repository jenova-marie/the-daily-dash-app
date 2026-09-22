# Daily Checklist — Feature Spec

**Feature code:** `CHK` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 105 · Described 7 · Partial 1

**Sources owned:** `src/pages/DailyChecklist.jsx`, `src/components/dashboard/DashboardChecklist.jsx`, `src/lib/useWeeklyChecklistCounts.js`
**Sources referenced (owned elsewhere):** `src/components/CondensedChecklist.jsx` → `20-features/daily-schedule/spec.md` · `src/components/LabelPicker.jsx` + `src/utils/labelHistory.js`, `src/components/SwipeableListItem.jsx`, `src/components/GenericOnboardingDialog.jsx`, `src/lib/HeaderContext.jsx`, `src/components/Layout.jsx` → `10-architecture/shared-interactions.md` · `src/components/WidgetCard.jsx` → `10-architecture/export-print-email.md` · `src/pages/Dashboard.jsx` (widget registry) → `20-features/dashboard/spec.md` · `src/components/visionboard/WeeklyReview.jsx` (reads completions) → `20-features/vision-board` · `base44/entities/DailyChecklist.jsonc`, `base44/entities/ChecklistCompletion.jsonc` → `10-architecture/data-model/checklist.md` · `src/pages/UserManual.jsx` → `20-features/user-manual`

**Permissions:** per-user data (`DailyChecklist` and `ChecklistCompletion` rows are readable, writable, and deletable only by their creator — `base44/entities/DailyChecklist.jsonc:42-55`, `base44/entities/ChecklistCompletion.jsonc:24-37`); admin-only operations: none

## 0. Entry points & navigation

- Route: `/checklist` `[Implemented]` `src/App.jsx:203` · Sidebar label: **Daily Checklist** (icon CheckSquare) `[Implemented]` `src/components/Layout.jsx:14` · Header title text: **Daily Checklist** `[Implemented]` `src/pages/DailyChecklist.jsx:49` · Position in nav order: second of fourteen (after Dashboard, before Tasks) `[Implemented]` `src/components/Layout.jsx:12-27`; swipe-order mechanics are owned by `10-architecture/shared-interactions.md` (AR-UI-13).
- Query parameters accepted: none observed. `[Implemented]` `src/pages/DailyChecklist.jsx:47-80`
- Feature-toggle gating: none; the nav item is always shown. `[Implemented]` `src/components/Layout.jsx:14,189-195`
- Header right-slot contents: one ghost icon button titled **Guide** (HelpCircle) that resets and reopens the walkthrough (§9). `[Implemented]` `src/pages/DailyChecklist.jsx:51-65`
- Secondary surfaces (not routes): the dashboard widget **Daily Checklist** (§4.10) `[Implemented]` `src/pages/Dashboard.jsx:36`, `src/components/dashboard/DashboardChecklist.jsx`; the condensed checklist on the Daily Schedule page, owned by `20-features/daily-schedule/spec.md`, which toggles the same completion rows for the selected date.

## 1. Purpose & user benefit

The Daily Checklist holds the account owner's repeating routines: items that are meant to be done every day, sorted into four time-of-day buckets, each with an optional clock time and an optional colour-coded label. Ticks are recorded per date, so the list starts unchecked each morning without any reset action, and each item shows how many days of the current week it has been ticked.

User Manual, section "Daily Checklist" (`src/pages/UserManual.jsx:81`) `[Described]`:

> The Daily Checklist is for recurring routines — things you want to do every day like morning habits, evening wind-down, or anytime tasks. Access this guide anytime via the Guide button on the Daily Checklist page.

User Manual, bullets (`src/pages/UserManual.jsx:82-90`) `[Described]`:

> - **Add items** using the "Add Item" button — give each item a title, optional time, category (morning / afternoon / evening / anytime), and a color label.
> - **Check off items** by clicking the checkbox. Completions are tracked per day.
> - Items **reset automatically** each new day — completion is date-specific.
> - **Edit items** by double-clicking or clicking and holding on an item.
> - **Delete items** by swiping left (mobile) or using the delete button on hover. Use the "Select" button for batch deletion.
> - Items are grouped by category: Morning (🌅), Afternoon (☀️), Evening (🌙), and Anytime (⏰).
> - A **progress bar** at the top shows how many items you've completed today.

User Manual, "Daily Checklist Widget" under Dashboard (`src/pages/UserManual.jsx:59-60`) `[Described]`:

> Shows active checklist items for today. Check items off directly here. Completions reset each day automatically.

Onboarding copy is quoted in full in §9.

## 2. Concepts & vocabulary

Glossary terms used: **account owner**, **label** (the dialogs and the manual say "category" for the bucket and "color label" for the label), **time-of-day bucket** (the UI label is "Category"; stored in `DailyChecklist.category`), **widget**, **walkthrough**, **device-local preference**, **account preference**, **today**.

Feature-local terms, defined once:

- **Item** — one `DailyChecklist` row with `is_active: true`. `src/pages/DailyChecklist.jsx:108`
- **Completion** — one `ChecklistCompletion` row for one item on one date. `base44/entities/ChecklistCompletion.jsonc:5-18`
- **Page** (of the checklist) — one of the views stepped through with the ‹ › arrows: All, a single bucket, a single label, or Completed. `src/pages/DailyChecklist.jsx:196-201`
- **Weekly count** — the number of dates in the current Sunday–Saturday week on which an item has a completion with `completed: true`, shown as `n/7`. `src/lib/useWeeklyChecklistCounts.js:12-31`
- **Label header** — a row showing the label text in its colour, inserted above the first item of each label run inside a bucket. `src/pages/DailyChecklist.jsx:449-450,459-463`

## 3. User stories

- **US-CHK-01** As the account owner, I want to add routine items with a title, bucket, optional time, and optional label so that my daily habits are listed where they belong in the day. `[Implemented]` `src/pages/DailyChecklist.jsx:117-124,366-399`
- **US-CHK-02** As the account owner, I want to tick items off for today and see them unticked again tomorrow so that the list is a fresh daily routine. `[Implemented]` `src/pages/DailyChecklist.jsx:84-115,150-159`
- **US-CHK-03** As the account owner, I want to see how many days this week I ticked each item so that I can track consistency. `[Implemented]` `src/lib/useWeeklyChecklistCounts.js:9-52`, `src/pages/DailyChecklist.jsx:498`
- **US-CHK-04** As the account owner, I want to drag items into order and between buckets so that the list matches my real routine. `[Implemented]` `src/pages/DailyChecklist.jsx:282-310,438-549`
- **US-CHK-05** As the account owner, I want to hide what I have already done, step through one bucket or one label at a time, and see a progress bar so that I can focus on what is left. `[Implemented]` `src/pages/DailyChecklist.jsx:189-264,337-345,405-436`
- **US-CHK-06** As the account owner, I want to edit an item by double-clicking it, delete a single item, or select several and delete them together. `[Implemented]` `src/pages/DailyChecklist.jsx:126-144,161-174,347-365,451-456,551-586`
- **US-CHK-07** As the account owner, I want to tick today's remaining items from the dashboard without opening the page. `[Implemented]` `src/components/dashboard/DashboardChecklist.jsx:40-56,80-103`

## 4. Capabilities & interactions

### 4.1 Add an item

- Button **Add Item** (Plus icon) opens a dialog titled **New Checklist Item**. `[Implemented]` `src/pages/DailyChecklist.jsx:366-371`
- Fields, in order `[Implemented]` `src/pages/DailyChecklist.jsx:372-396`:

| Field | Control | Default | Validation |
|---|---|---|---|
| Title | text input, placeholder `e.g. Make bed` | empty | required; pressing the submit button with an empty title does nothing `:118` |
| Label + colour | shared label picker (`10-architecture/shared-interactions.md` §5) | label empty; colour `#3b82f6` on first open `:69` | none |
| Category (time-of-day bucket) | select: **Morning**, **Afternoon**, **Evening**, **Anytime** | `morning` | — |
| Time | native browser time input (`HH:MM`) | empty | optional |

- Submit button **Add to Checklist**: when a label is present it is saved to device label history with its colour; the item is created with the four fields plus `order: 0` and `is_active: true`; the dialog closes; the list reloads. `[Implemented]` `src/pages/DailyChecklist.jsx:117-124,396`
- After a successful add the form resets to title empty, time empty, bucket `morning`, order 0, label empty, colour `""` (not `#3b82f6`). `[Implemented]` `src/pages/DailyChecklist.jsx:121` (D-805)

### 4.2 Edit an item

- Opened by a pointer double-click on the item title, or by two clicks/taps on the title within 300 ms (AR-UI-04, AR-UI-05; D-320). `[Implemented]` `src/pages/DailyChecklist.jsx:451-456,495,524`
- Dialog title **Edit Checklist Item**; the same four fields pre-filled from the item (missing time → empty, missing bucket → `morning`, missing label → empty, missing colour → `#3b82f6`). `[Implemented]` `src/pages/DailyChecklist.jsx:161-165,551-578`
- Buttons **Cancel** (closes, discards) and **Save** (requires a title; saves the label to history when present; updates `title`, `time_of_day`, `category`, `label`, `label_color`; closes; reloads). `[Implemented]` `src/pages/DailyChecklist.jsx:167-174,579-582`
- The User Manual says editing is also available by "clicking and holding on an item" `[Described]` `src/pages/UserManual.jsx:86` (D-803).

### 4.3 Tick and untick (today)

- Each row has a checkbox. Ticking when no completion exists for the item and today creates one with `completed: true` and `completed_at` = now (ISO). Ticking when one exists flips `completed` and sets `completed_at` to now (when becoming complete) or `null` (when becoming incomplete). Then today's rows and the weekly counts are reloaded. `[Implemented]` `src/pages/DailyChecklist.jsx:150-159,493,522`
- A ticked item's title is struck through. `[Implemented]` `src/pages/DailyChecklist.jsx:495,524`
- "Complete" for display means a completion row exists for the item and today with `completed: true`. `[Implemented]` `src/pages/DailyChecklist.jsx:146-148`

### 4.4 Delete one item

- Each row is wrapped in the shared list-row component: long-press on touch or hover on pointer devices reveals a delete button, which opens the shared confirm dialog "Delete Item?" / "This action cannot be undone." (AR-UI-01, AR-UI-02). Confirming hard-deletes the `DailyChecklist` row and reloads; completion rows are not deleted. `[Implemented]` `src/pages/DailyChecklist.jsx:126-129,486-487,515-516`
- The User Manual describes "swiping left (mobile)" `[Described]` `src/pages/UserManual.jsx:87` (D-804).

### 4.5 Batch delete

- Button **Select** enters batch mode. In batch mode every row shows a selection checkbox instead of the delete affordance (shared component binding, AR-UI-01 "Batch mode"); tapping it toggles the item in the selected set. `[Implemented]` `src/pages/DailyChecklist.jsx:131-136,363-365,488-491,517-520`
- Header while in batch mode with nothing selected: a single **Cancel** button. With one or more selected: the text `{n} selected`, a destructive **Delete** button (Trash icon), and **Cancel**. `[Implemented]` `src/pages/DailyChecklist.jsx:347-360`
- **Delete** shows a browser confirm reading `Delete {n} item(s)?`; on OK every selected item is hard-deleted in parallel, the selection is cleared, batch mode ends, and the list reloads. Cancel in the confirm changes nothing. `[Implemented]` `src/pages/DailyChecklist.jsx:138-144`
- **Cancel** leaves batch mode and clears the selection. `[Implemented]` `src/pages/DailyChecklist.jsx:353-355,358-360`
- While in batch mode the Select and Add Item buttons are hidden. `[Implemented]` `src/pages/DailyChecklist.jsx:347-401`

### 4.6 Drag-and-drop reorder (within and across buckets)

- Every rendered row is draggable; each bucket card is a drop list keyed by the bucket name. `[Implemented]` `src/pages/DailyChecklist.jsx:438-446,464`
- While a drag is in progress: wheel and touch-move scrolling of the document are suppressed; the body cursor is `grabbing`; the original row turns invisible; and a floating copy of the row (200 px wide, centred horizontally, following the pointer's vertical position) is rendered above everything. `[Implemented]` `src/pages/DailyChecklist.jsx:266-280,438-441,469-513`
- On drop with a destination: the item is removed from the source bucket list at the source index and inserted into the destination bucket list at the destination index. Then every bucket list is walked and each item whose position index or bucket differs from its stored `order` / `category` is updated with `order = index` and `category = bucket`. Dropping into a different bucket therefore changes the item's time-of-day bucket. A drop with no destination changes nothing. `[Implemented]` `src/pages/DailyChecklist.jsx:282-310`
- The bucket lists used for the move are the label-sorted, hide-completed-filtered lists of **all** buckets (§5 BR-CHK-03, BR-CHK-05), not the lists filtered by the current page. `[Implemented]` `src/pages/DailyChecklist.jsx:176-194,293-295` (D-807)

### 4.7 Hide completed toggle

- An outline icon button at the top-left toggles hiding of ticked items. Tooltip **Hide completed items** (Eye icon) when showing, **Show completed items** (EyeOff icon) when hiding. `[Implemented]` `src/pages/DailyChecklist.jsx:337-345`
- The value is persisted on the device under `checklist_hideCompleted` as the string `"true"` / `"false"` and read back on load. `[Implemented]` `src/pages/DailyChecklist.jsx:77,338`
- Hiding removes ticked items from the All, bucket, and label pages; the Completed page and the progress denominator ignore it (§5). `[Implemented]` `src/pages/DailyChecklist.jsx:189-194,207-215,233-259`

### 4.8 Paging through views

- A bar with ‹ and › icon buttons and a centred page name steps through the page list. ‹ is disabled on the first page, › on the last. `[Implemented]` `src/pages/DailyChecklist.jsx:405-425`
- Page list = `["all", …buckets that currently have at least one visible item, in the order morning, afternoon, evening, anytime, …unique labels, "completed"]`. Unique labels are de-duplicated ignoring case (the first-seen spelling is kept) and sorted by default string order. `[Implemented]` `src/pages/DailyChecklist.jsx:196-199`
- Page name shown: `All`; the bucket or label with its first character upper-cased; `Completed`. `[Implemented]` `src/pages/DailyChecklist.jsx:201,415`
- Page contents `[Implemented]` `src/pages/DailyChecklist.jsx:203-224`:
  - **All** — all four bucket cards (a bucket with no items renders an empty card).
  - **A bucket** — that bucket's card only.
  - **A label** — for each bucket, the items whose `label` equals the page name exactly; buckets with no match are omitted. (D-806)
  - **Completed** — for each bucket, the items ticked today, regardless of the hide-completed toggle; buckets with none are omitted.
- The current page index is clamped to the list length when the list shrinks; it is not otherwise reset. `[Implemented]` `src/pages/DailyChecklist.jsx:200`

### 4.9 Progress bar

- A card **Today's Progress** shows `{completed} of {total}` and a filled bar at `completed / total`. `[Implemented]` `src/pages/DailyChecklist.jsx:428-436`
- `total` is the number of items in the current page's scope **ignoring** the hide-completed toggle: all items (All), the bucket's items (bucket page), items with that label (label page), or the items ticked today (Completed page). `completed` is how many of those are ticked today. With `total` 0 the bar is empty. `[Implemented]` `src/pages/DailyChecklist.jsx:233-264`

### 4.10 Dashboard widget (Daily Checklist)

Rendered from the dashboard registry under the title **Daily Checklist** (`20-features/dashboard/spec.md` §4.2). `[Implemented]` `src/pages/Dashboard.jsx:36`

- Loads all active items and today's completions once on mount, and again after each tick. `[Implemented]` `src/components/dashboard/DashboardChecklist.jsx:20-34,55`
- Header line: `{completed}/{total} completed` (all active items) with a small progress bar. `[Implemented]` `src/components/dashboard/DashboardChecklist.jsx:58-59,107-114`
- Body lists only items **not** ticked today, grouped into the four buckets in order Morning (Sunrise icon), Afternoon (Sun), Evening (Sunset), Anytime (Clock); an item with a missing or unknown bucket is shown under Anytime. Each bucket header reads `{Bucket} ({count})`; empty buckets are omitted. The body scrolls inside a fixed maximum height. `[Implemented]` `src/components/dashboard/DashboardChecklist.jsx:10-15,60-70,115-126`
- Within a bucket, items sort by label (unlabelled last), then `order` (BR-CHK-03); a label header in the label's colour precedes each label run. `[Implemented]` `src/components/dashboard/DashboardChecklist.jsx:71-78,128-141`
- Row: checkbox, title, label pill (when present, in the label colour or `#3b82f6`), weekly count `n/7`, and the clock time when present. `[Implemented]` `src/components/dashboard/DashboardChecklist.jsx:80-103`
- Ticking creates or flips today's completion exactly as on the page (§4.3) and reloads items and completions; the widget's weekly counts are not reloaded. `[Implemented]` `src/components/dashboard/DashboardChecklist.jsx:40-56` (D-808)
- The widget computes whether any pending item sits outside Anytime but does not use the result. `[Partial]` `src/components/dashboard/DashboardChecklist.jsx:63` (Q-804)
- The widget has no midnight timer; `today` is recomputed on each render, while items and completions are reloaded only on mount or after a tick. `[Implemented]` `src/components/dashboard/DashboardChecklist.jsx:20-34` (D-809)

### 4a. Keyboard & pointer

- Double-click / double-tap (≤ 300 ms) on a title → edit dialog (§4.2). `[Implemented]` `src/pages/DailyChecklist.jsx:451-456,495,524`
- Long-press (touch) or hover (pointer) on a row → delete affordance (§4.4, AR-UI-01). `[Implemented]` `src/pages/DailyChecklist.jsx:486-492,515-521`
- Drag-and-drop of rows (§4.6). `[Implemented]` `src/pages/DailyChecklist.jsx:438-549`
- Text selection is disabled across the page except inside inputs and text areas. `[Implemented]` `src/pages/DailyChecklist.jsx:334`
- No Enter/Escape handling beyond the dialogs' own close behaviour is defined by the page. `[Implemented]` `src/pages/DailyChecklist.jsx:366-399,551-586`

### 4b. View state & persistence

| Control | Values | Default | Scope (memory / device `key` / account `Entity.field`) |
|---|---|---|---|
| Hide completed | on / off | off | device `checklist_hideCompleted` (`"true"`/`"false"`) `src/pages/DailyChecklist.jsx:77,338` |
| Current page | index into the page list | 0 (All) | memory `src/pages/DailyChecklist.jsx:79` |
| Batch mode + selection | off / on with a set of ids | off, empty | memory `src/pages/DailyChecklist.jsx:70-71` |
| Add dialog / form | open / closed + field values | closed | memory `src/pages/DailyChecklist.jsx:68-69` |
| Edit dialog / form | open / closed + item + field values | closed | memory `src/pages/DailyChecklist.jsx:72-74` |
| Today | `YYYY-MM-DD` | device date at mount | memory, advanced by the midnight timer `src/pages/DailyChecklist.jsx:75,84-102` |
| Item order and bucket | `order` integer, `category` | 0, `morning` | account `DailyChecklist.order`, `DailyChecklist.category` `src/pages/DailyChecklist.jsx:120,304` |
| Walkthrough dismissed | yes / no | no | account `ThemeSettings.onboarding_status.dailychecklist_onboarded` + device `dailychecklist_onboarded` (§9) |
| Label history | list of label + colour | empty | device `app_label_history` (owned by `10-architecture/shared-interactions.md` §5) `src/pages/DailyChecklist.jsx:119,169` |

### 4c. Empty & fallback states

- Page, All view with no items: four empty bucket cards (Morning, Afternoon, Evening, Anytime) with no copy, and progress `0 of 0`. `[Implemented]` `src/pages/DailyChecklist.jsx:205-206,431,442-446`
- Page, label or Completed view with no matches: no bucket cards at all, no copy. `[Implemented]` `src/pages/DailyChecklist.jsx:207-224`
- Widget with no pending items (including no items at all): `All done for today!` `[Implemented]` `src/components/dashboard/DashboardChecklist.jsx:116-117`
- Weekly count with no completions this week: `0/7`. `[Implemented]` `src/pages/DailyChecklist.jsx:498`, `src/components/dashboard/DashboardChecklist.jsx:97`
- Batch confirm text: `Delete {n} item(s)?` `[Implemented]` `src/pages/DailyChecklist.jsx:139`

## 5. Business rules

- **BR-CHK-01 (Active items only)** Every surface loads `DailyChecklist` rows with `is_active: true`; no surface writes `is_active: false`. `[Implemented]` `src/pages/DailyChecklist.jsx:108,120`, `src/components/dashboard/DashboardChecklist.jsx:29`
- **BR-CHK-02 (Bucket assignment)** An item belongs to the bucket named by `category`; a missing or unrecognised value places it in `anytime`. `[Implemented]` `src/pages/DailyChecklist.jsx:176-181`, `src/components/dashboard/DashboardChecklist.jsx:64-70`
- **BR-CHK-03 (Sort within a bucket)** Items sort by `label` ascending using locale comparison, with unlabelled items last (sentinel U+FFFF, AR-TIME-21), then by `order` ascending (missing `order` counts as 0). The page first sorts the loaded list by `order` alone before grouping. `[Implemented]` `src/pages/DailyChecklist.jsx:112,182-187,226-231`, `src/components/dashboard/DashboardChecklist.jsx:71-78`. The condensed checklist on the Daily Schedule sorts differently (D-012).
- **BR-CHK-04 (Label headers)** Within a rendered bucket, a header showing the label in its colour (fallback `#3b82f6`) appears above an item when it has a label and the previous rendered item's label differs. `[Implemented]` `src/pages/DailyChecklist.jsx:448-463`, `src/components/dashboard/DashboardChecklist.jsx:129-137`
- **BR-CHK-05 (Hide completed scope)** When hide-completed is on, ticked items are removed from the bucket lists before the page list, the All/bucket/label views, and the drag lists are built; the Completed view and the progress denominator are built from the unfiltered items. `[Implemented]` `src/pages/DailyChecklist.jsx:189-194,196-199,207-215,233-259,293`
- **BR-CHK-06 (Page list)** `["all", …non-empty buckets in fixed order, …unique labels (case-insensitive, first spelling kept, default string sort), "completed"]`. The Completed page is always present. `[Implemented]` `src/pages/DailyChecklist.jsx:196-199`
- **BR-CHK-07 (Label page match)** A label page shows items whose `label` equals the page's label exactly (case-sensitive). `[Implemented]` `src/pages/DailyChecklist.jsx:221,256` (D-806)
- **BR-CHK-08 (Completion identity)** One completion per item per date by convention: a tick looks for an existing row for the item among today's loaded rows and updates it, otherwise creates one. Completions are never deleted by the user. `[Implemented]` `src/pages/DailyChecklist.jsx:150-159`, `src/components/dashboard/DashboardChecklist.jsx:40-56`
- **BR-CHK-09 (Implicit daily reset)** "Reset each day" is a consequence of date-keyed completions: nothing is written at midnight; the page simply loads the new date's rows (AR-TIME-41). `[Implemented]` `src/pages/DailyChecklist.jsx:84-104,109`. Manual and onboarding describe it as an automatic reset `[Described]` `src/pages/UserManual.jsx:85`, `src/pages/DailyChecklist.jsx:33`.
- **BR-CHK-10 (Progress denominator)** total = all items in the current page's scope ignoring hide-completed; completed = those ticked today; on the Completed page total = completed. `[Implemented]` `src/pages/DailyChecklist.jsx:233-264`
- **BR-CHK-11 (Reorder re-indexing)** After a drop, within each bucket `order` = zero-based position in that bucket's (label-sorted, hide-completed-filtered) list; only rows whose `order` or `category` changed are written. `[Implemented]` `src/pages/DailyChecklist.jsx:297-308`
- **BR-CHK-12 (Cross-bucket drop changes bucket)** Dropping into another bucket's list writes that bucket name to `category`. `[Implemented]` `src/pages/DailyChecklist.jsx:289-295,302-304`
- **BR-CHK-13 (New items start at order 0)** A created item carries `order: 0` and therefore sorts before same-label items with higher order until the next drop re-indexes. `[Implemented]` `src/pages/DailyChecklist.jsx:69,120`
- **BR-CHK-14 (Weekly count)** For each item, the count of completion rows with `completed: true` whose `date` falls on a day of the current Sunday–Saturday week (seven per-date reads); displayed as `{n}/7`, `0/7` when none (AR-TIME-72). `[Implemented]` `src/lib/useWeeklyChecklistCounts.js:12-31`, `src/pages/DailyChecklist.jsx:498`, `src/components/dashboard/DashboardChecklist.jsx:96-98`
- **BR-CHK-15 (Weekly count refresh)** The counts load on mount, reload after every tick on the page, and reload at the next Sunday 00:00 local, re-arming for the following Sunday (AR-TIME-42). The widget reloads them only on mount. `[Implemented]` `src/lib/useWeeklyChecklistCounts.js:33-49`, `src/pages/DailyChecklist.jsx:158`, `src/components/dashboard/DashboardChecklist.jsx:21,40-56` (D-808)
- **BR-CHK-16 (Widget shows pending only)** The dashboard widget lists only items not ticked today; ticked items disappear from it immediately and count toward its header ratio. `[Implemented]` `src/components/dashboard/DashboardChecklist.jsx:58-60,116-146`
- **BR-CHK-17 (Deleting an item keeps its completions)** Single and batch deletes remove only `DailyChecklist` rows. `[Implemented]` `src/pages/DailyChecklist.jsx:126-129,138-144`
- **BR-CHK-18 (Label history)** Adding or saving an item with a non-empty label records the label and colour in device label history (`10-architecture/shared-interactions.md` §5). `[Implemented]` `src/pages/DailyChecklist.jsx:119,169`

### 5a. State & lifecycle

`DailyChecklist` item:

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| — | Add to Checklist with a title | active item (`is_active: true`, `order: 0`, chosen bucket) | label history updated; reload `src/pages/DailyChecklist.jsx:117-124` |
| active | Save in edit dialog | active, fields updated | label history updated; reload `:167-174` |
| active | drop in a bucket list | active, `order`/`category` rewritten for changed rows | reload `:282-310` |
| active | confirm single delete / batch Delete | removed | completions remain; reload `:126-144` |

`ChecklistCompletion` for (item, today):

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| none | tick | `completed: true`, `completed_at` now | reload (+ weekly counts on the page) `:150-159` |
| `completed: true` | untick | `completed: false`, `completed_at: null` | reload `:153` |
| `completed: false` | tick | `completed: true`, `completed_at` now | reload `:153` |

Page-level:

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| today = D | local midnight | today = D+1 | items and completions reload; timer re-armed `:84-104` |
| batch off | Select | batch on, empty selection | rows show selection boxes `:363-365` |
| batch on | Cancel | batch off | selection cleared `:353-360` |
| batch on, n selected | Delete → OK | batch off | n items deleted; reload `:138-144` |

### 5b. Time & date semantics

- "Today" is `format(new Date(), "yyyy-MM-dd")` on the device (formatter B, AR-TIME-01), held in page state and advanced by the midnight timer (AR-TIME-41). `[Implemented]` `src/pages/DailyChecklist.jsx:75,84-104`
- The widget computes the same string on every render and does not roll over on its own (D-809). `[Implemented]` `src/components/dashboard/DashboardChecklist.jsx:20`
- Clock times are `HH:MM` strings shown as entered; no sorting by time on the page or widget (AR-TIME-11). `[Implemented]` `src/pages/DailyChecklist.jsx:394,496`, `src/components/dashboard/DashboardChecklist.jsx:99-101`
- Weeks start on Sunday and end on Saturday (AR-TIME-30); the weekly reload fires at the next Sunday 00:00 local, seven days ahead when today is Sunday (AR-TIME-42). `[Implemented]` `src/lib/useWeeklyChecklistCounts.js:13-16,37-45`
- `completed_at` is an ISO timestamp (AR-TIME-12). `[Implemented]` `src/pages/DailyChecklist.jsx:153,155`
- No "due", "overdue", or "upcoming" notions exist in this feature. `[Implemented]` `src/pages/DailyChecklist.jsx:146-159`

## 6. Data

| Entity | Read | Write | Citation |
|---|---|---|---|
| `DailyChecklist` | `filter({ is_active: true })`, unsorted, no limit; page then sorts by `order` | create (`title`, `time_of_day`, `category`, `order: 0`, `label`, `label_color`, `is_active: true`); update (edit fields; `order` + `category` on drop); delete | `src/pages/DailyChecklist.jsx:108,112,120,170,304,127,140`, `src/components/dashboard/DashboardChecklist.jsx:29` |
| `ChecklistCompletion` | `filter({ date: today })` on page and widget; `filter({ date })` × 7 for the week | create (`checklist_item_id`, `date`, `completed: true`, `completed_at`); update (`completed`, `completed_at`) | `src/pages/DailyChecklist.jsx:109,153,155`, `src/components/dashboard/DashboardChecklist.jsx:30,43,48`, `src/lib/useWeeklyChecklistCounts.js:19-21` |
| `ThemeSettings` | newest row, `onboarding_status` | update `onboarding_status` (Guide reset removes `dailychecklist_onboarded`) | `src/pages/DailyChecklist.jsx:51-63,313-327` |

Field sheets: `10-architecture/data-model/checklist.md` (E-DailyChecklist, E-ChecklistCompletion). Declared field `description` is never shown or written by this feature. `[Implemented]` `base44/entities/DailyChecklist.jsonc:8-10`

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| out | Dashboard | `DashboardChecklist` mounted from the widget registry as "Daily Checklist" | `src/pages/Dashboard.jsx:36`, `20-features/dashboard/spec.md` §4.2 |
| both | Daily Schedule | the condensed checklist reads the same active items and toggles completions for the schedule's selected date; it keeps its own hide-completed key `checklist_hide_completed` | `20-features/daily-schedule/spec.md`, `src/components/CondensedChecklist.jsx` (D-110, D-012) |
| out | Vision Board (Weekly Review) | reads `ChecklistCompletion` rows for the week | `src/components/visionboard/WeeklyReview.jsx:25-26` (owned there) |
| both | Shared interactions | label picker + label history, list-row delete/batch component, walkthrough dialog | `src/pages/DailyChecklist.jsx:374-380,486-492,588-594` |
| both | Preferences | `ThemeSettings.onboarding_status` (walkthrough), device key `checklist_hideCompleted` | `10-architecture/preferences.md` Parts C and D |

No deep links with query parameters originate here. `[Implemented]` `src/pages/DailyChecklist.jsx:47-597`

### 7a. Feedback & notifications

- Shared confirm dialog "Delete Item?" for single delete (AR-UI-02). `[Implemented]` `src/pages/DailyChecklist.jsx:486-487,515-516`
- Browser confirm `Delete {n} item(s)?` for batch delete. `[Implemented]` `src/pages/DailyChecklist.jsx:139`
- Strike-through on ticked titles; progress bar animation on change. `[Implemented]` `src/pages/DailyChecklist.jsx:434,495`
- No toasts, alerts, celebratory effects, or reminders. `[Implemented]` `src/pages/DailyChecklist.jsx:47-597`

## 8. AI & automation

None observed. `[Implemented]` `src/pages/DailyChecklist.jsx:1-20`, `src/components/dashboard/DashboardChecklist.jsx:1-8`

## 9. Onboarding content

Dialog title **Welcome to Daily Checklist**; storage key `dailychecklist_onboarded`; rendered by the shared walkthrough dialog (AR-UI-10). `[Implemented]` `src/pages/DailyChecklist.jsx:588-594`

Steps verbatim (`src/pages/DailyChecklist.jsx:24-45`) `[Described]`:

1. **1. Create Daily Items** — "Click 'Add Item' to create routines you want to complete every day. Choose a category (Morning, Afternoon, Evening, or Anytime), set an optional time, and add a color label to organize them."
2. **2. Check Off Your Progress** — "Click the checkbox next to each item to mark it complete. Your progress resets automatically each day. Track your completion rate with the progress bar at the top."
3. **3. Reorder by Dragging** — "Press and hold any item to drag and reorder it within its category. You can also drag items between categories (e.g. move a Morning item to Evening)."
4. **4. Organize & Manage** — "Edit items by double-clicking them. Use the 'Select' button for batch deletion. Items are automatically grouped by category (Morning, Afternoon, Evening, Anytime)."

- Trigger (second generation, AR-PREF-33): if device key `dailychecklist_onboarded` is `"true"`, do not show; otherwise read the newest `ThemeSettings`: no row → show; row whose `onboarding_status` lacks the key → show; key present → do not show; read failure → show. `[Implemented]` `src/pages/DailyChecklist.jsx:312-331`
- Dismissal writes the account map and the device mirror `"true"` (AR-PREF-32). `[Implemented]` `src/components/GenericOnboardingDialog.jsx:6-29`
- **Guide** button: removes `dailychecklist_onboarded` from the account map (when a row exists), then opens the dialog; the device mirror is left in place (AR-PREF-36). `[Implemented]` `src/pages/DailyChecklist.jsx:51-65`
- Registry: `20-features/onboarding`.

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `checklist_hideCompleted` | hide ticked items on the checklist page (`"true"` / `"false"`) | absent → off | eye toggle `src/pages/DailyChecklist.jsx:338` | never (toggle off writes `"false"`) |
| `checklist_hide_completed` | the Daily Schedule condensed checklist's own hide-completed flag (JSON boolean); **not read by this page** | `false` | owned by `20-features/daily-schedule/spec.md` (`src/pages/DailySchedule.jsx:817`, `src/components/CondensedChecklist.jsx:86`) | — |
| `dailychecklist_onboarded` | walkthrough dismissed on this device (`"true"`) | absent | walkthrough dismiss `src/components/GenericOnboardingDialog.jsx:23` | never (Guide clears only the account map) `src/pages/DailyChecklist.jsx:51-63` |
| `app_label_history` | shared label history | — | label picker / `saveLabelToHistory` (owned by `10-architecture/shared-interactions.md` §5) | — |

The two hide-completed keys are independent: toggling on one surface does not affect the other (D-110). `[Implemented]` `src/pages/DailyChecklist.jsx:77,338`, `src/components/CondensedChecklist.jsx:12,86`

## 11. Seed / hardcoded data used

- Bucket list and order: `morning`, `afternoon`, `evening`, `anytime`; select labels **Morning / Afternoon / Evening / Anytime**; widget headers with icons Sunrise / Sun / Sunset / Clock. `[Implemented]` `src/pages/DailyChecklist.jsx:176,198,387-390`, `src/components/dashboard/DashboardChecklist.jsx:10-15`; `10-architecture/data-model/seed-data.md` §6.
- Default label colour `#3b82f6` (form, entity default, and render fallback). `[Implemented]` `src/pages/DailyChecklist.jsx:69,74,448`, `src/components/dashboard/DashboardChecklist.jsx:92,134`, `base44/entities/DailyChecklist.jsonc:34-37`
- Double-tap window 300 ms. `[Implemented]` `src/pages/DailyChecklist.jsx:454`
- Drag preview width 200 px. `[Implemented]` `src/pages/DailyChecklist.jsx:482`
- Week length 7 for the `n/7` display. `[Implemented]` `src/pages/DailyChecklist.jsx:498`
- Label palette and history rules: `10-architecture/shared-interactions.md` §5.

## 12. Print / email formats

None. Each bucket card carries body id `checklist-{bucket}` for the card shell's generic handlers, but no control invokes them (D-310, `10-architecture/export-print-email.md`). `[Implemented]` `src/pages/DailyChecklist.jsx:443`

## 13. Acceptance criteria

- **AC-CHK-01** Given the add dialog is open with an empty title, When the user presses Add to Checklist, Then nothing is created and the dialog stays open. (refs §4.1)
- **AC-CHK-02** Given the user adds "Make bed" with bucket Evening, time `21:00`, label `Home` colour `#22c55e`, When the list reloads, Then the item appears under Evening with a `Home` header, the time `21:00`, and `0/7`; and the device label history contains `Home` / `#22c55e`. (refs BR-CHK-02, BR-CHK-04, BR-CHK-14, BR-CHK-18)
- **AC-CHK-03** Given an item with no completion today, When the user ticks it, Then a `ChecklistCompletion` with today's date, `completed: true`, and a timestamp exists, the title is struck through, and the item's weekly count rises by one. (refs BR-CHK-08, BR-CHK-14)
- **AC-CHK-04** Given an item ticked today, When the user unticks it, Then the same row has `completed: false` and `completed_at: null`; no row is deleted. (refs BR-CHK-08)
- **AC-CHK-05** Given the page is open across local midnight, When the clock passes 00:00, Then every item shows unticked for the new date without any write. (refs BR-CHK-09)
- **AC-CHK-06** Given a bucket holds items labelled `Zeta` (order 0), no label (order 0), and `Alpha` (order 1), When rendered, Then the sequence is Alpha, Zeta, then the unlabelled item. (refs BR-CHK-03)
- **AC-CHK-07** Given hide-completed is on and every Afternoon item is ticked, When the page list is built, Then there is no Afternoon page and the All view's Afternoon card is empty; the progress card still counts the Afternoon items in `total`. (refs BR-CHK-05, BR-CHK-06, BR-CHK-10)
- **AC-CHK-08** Given items labelled `Health` and `health`, When the page list is built, Then a single label page named `Health` exists, and it lists only the items whose label is exactly `Health`. (refs BR-CHK-06, BR-CHK-07)
- **AC-CHK-09** Given the Completed page with three items ticked today, When the progress card renders, Then it reads `3 of 3`. (refs BR-CHK-10)
- **AC-CHK-10** Given the All view, When the user drags a Morning item into position 0 of the Evening list, Then the item's `category` becomes `evening` and its `order` becomes 0, and every other Evening item's `order` is its new index. (refs BR-CHK-11, BR-CHK-12)
- **AC-CHK-11** Given batch mode with two items selected, When the user presses Delete and accepts `Delete 2 item(s)?`, Then both items are removed, batch mode ends, and their completion rows remain. (refs §4.5, BR-CHK-17)
- **AC-CHK-12** Given it is Saturday with an item ticked on Monday, Wednesday, and Saturday, When the page renders, Then the item shows `3/7`; When the clock passes Sunday 00:00 with the page open, Then it shows `0/7`. (refs BR-CHK-14, BR-CHK-15)
- **AC-CHK-13** Given the dashboard widget with four active items, two ticked today, When it renders, Then the header reads `2/4 completed` and only the two pending items are listed under their buckets. (refs BR-CHK-16)
- **AC-CHK-14** Given the dashboard widget with every item ticked, When it renders, Then the body reads `All done for today!`. (refs §4c)
- **AC-CHK-15** Given `checklist_hideCompleted` is `"true"` on this device, When the page loads, Then the toggle shows the EyeOff icon and ticked items are hidden. (refs §4.7)
- **AC-CHK-16** Given `dailychecklist_onboarded` is absent on the device and the account map lacks the key, When the page mounts, Then the walkthrough opens; When the user presses Guide later, Then the key is removed from the account map and the walkthrough opens again. (refs §9)

## 14. Discrepancies & open questions

- **D-803** User Manual says items are edited "by double-clicking or clicking and holding on an item" (`src/pages/UserManual.jsx:86`); on the page a double-click or a double-tap within 300 ms opens the editor (`src/pages/DailyChecklist.jsx:451-456,495,524`) while holding a row reveals the delete button (`src/components/SwipeableListItem.jsx:17-36`, AR-UI-01).
- **D-804** User Manual says items are deleted "by swiping left (mobile)" (`src/pages/UserManual.jsx:87`); the row component reveals delete on long-press or hover, with no swipe handling (`src/components/SwipeableListItem.jsx:17-44`, AR-UI-01). Same shape as D-322 for tasks.
- **D-805** The add form's label colour is `#3b82f6` when the page first loads (`src/pages/DailyChecklist.jsx:69`) and `""` after each successful add (`:121`); the entity default is `#3b82f6` (`base44/entities/DailyChecklist.jsonc:34-37`).
- **D-806** The page list de-duplicates labels ignoring case and keeps the first spelling (`src/pages/DailyChecklist.jsx:197`); the label page and its progress scope match `label` exactly (`:221,256`), so items whose label differs only in case from the page name are not shown on that page.
- **D-807** Rows are rendered from the page-filtered lists (`src/pages/DailyChecklist.jsx:442-447`), but a drop's source and destination indexes are applied to the unfiltered (hide-completed-filtered, label-sorted) bucket lists (`:293-295`); the two lists coincide only on the All page.
- **D-808** Ticking on the page reloads the weekly counts (`src/pages/DailyChecklist.jsx:158`); ticking in the dashboard widget does not (`src/components/dashboard/DashboardChecklist.jsx:40-56`), so the widget's `n/7` reflects the last mount.
- **D-809** The page advances `today` at local midnight and reloads (`src/pages/DailyChecklist.jsx:84-104`); the widget computes `today` on each render but reloads completions only on mount or after a tick (`src/components/dashboard/DashboardChecklist.jsx:20-34,55`).
- Cited from other specs: **D-012** (bucket sort differs on the condensed checklist), **D-110** (two hide-completed keys), **D-320** (double-tap windows), **D-310** (card shell handlers without controls).
- **Q-803** Resolved in synthesis: `10-architecture/data-model/checklist.md` D-012 now records the dashboard widget sort as label then `order` (`src/components/dashboard/DashboardChecklist.jsx:71-78`), matching BR-CHK-03. No open question remains.
- **Q-804** Blocks: §4.10. Question: the widget computes whether any pending item sits outside Anytime and never uses the value (`src/components/dashboard/DashboardChecklist.jsx:63`). Was a flat, un-bucketed layout intended when everything is Anytime?
