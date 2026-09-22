# Meal Planning (Menu) — Feature Spec

**Feature code:** `MEAL` · **Level:** 2 (sub-spec of `20-features/chores/spec.md`) · **Status:** draft

**Tag summary:** Implemented 106 · Described 4 · Partial 1

**Sources owned:** `src/pages/Chores.jsx` (Menu tab only: lines 84-108, 146-154, 538-539, 604-704 meal branch, 771-875, 1414-1455, 1596-1622 meal branch, 1666-1692), `src/components/MenuChoresWidget.jsx`, `src/components/dashboard/DashboardMenuChores.jsx`
**Sources referenced (owned elsewhere):** `src/pages/Chores.jsx` (Chores tab, chore form, members, library, chore print) → `20-features/chores/spec.md` · `src/components/ChoreGenerator.jsx` → `20-features/chores/ai-generator.md` · `src/components/ChoreLibraryDialog.jsx` → `20-features/chores/spec.md` · `src/lib/choreRooms.js` → `20-features/chores/spec.md` · `src/components/SwipeableListItem.jsx` → `10-architecture/shared-interactions.md` · `src/components/WidgetCard.jsx` → `10-architecture/export-print-email.md` · `src/pages/DailySchedule.jsx:236,828` → `20-features/daily-schedule/spec.md` · `src/pages/Dashboard.jsx:24-40` → `20-features/dashboard` · `base44/entities/Chore.jsonc`, `ChoreUser.jsonc` → `10-architecture/data-model/chores.md`

**Permissions:** per-user data; admin-only operations: none

## 0. Entry points & navigation

- Route: `/chores`, second tab of the Chores page, tab label "Menu" (tab value `meals`; the default tab is "Chores") `[Implemented]` `src/pages/Chores.jsx:67,1257-1261`. Sidebar label: "Chores" · Header title text: "Chore Manager" `[Implemented]` `src/components/Layout.jsx:18`, `src/pages/Chores.jsx:31`. Position in swipe order: 6 of 14 (see `20-features/chores/spec.md`).
- Dashboard widget: registry id `menu-chores`, title "Menu & Chores", sixth in the default widget order `[Implemented]` `src/pages/Dashboard.jsx:24-33,39`.
- Daily Schedule right column: the "Menu & Chores" card rendered under the condensed checklist, fed with the chores the Daily Schedule page loaded `[Implemented]` `src/pages/DailySchedule.jsx:236,828`, `src/components/MenuChoresWidget.jsx:21,75`.
- Query parameters accepted: none for the Menu tab (the `?filter=` parameter drives the Chores tab; see `20-features/chores/spec.md`) `[Implemented]` `src/pages/Chores.jsx:58-66`.
- Feature-toggle gating: the Chores page is hidden by the `enable_chores` toggle; the dashboard widget renders regardless (see `10-architecture/preferences.md` AR-PREF-23, AR-PREF-25).
- Header right-slot contents: the "Guide" help button (owned by `20-features/chores/spec.md`) `[Implemented]` `src/pages/Chores.jsx:32`.

## 1. Purpose & user benefit

A weekly menu built from the same records as chores: a chore whose type is a meal type is a **meal**, appears on the Menu tab under the weekdays it is planned for, and can be checked off, deleted, and printed as a fridge sheet. The Dashboard and the Daily Schedule show the rest of the week's menu beside the chores due today.

Landing page claim `[Described]` `src/pages/LandingPage.jsx:10`:

> **AI Meal Planning** — Generate age-appropriate meal ideas for Breakfast, Lunch, Dinner, or Snacks — perfect for kids ages 3 and up through adults.

The generation part of that claim is implemented in the AI generator (meal type chips Breakfast/Lunch/Dinner/Snack; age groups from `3-5` up to `Adult`) `[Implemented]` `src/components/ChoreGenerator.jsx:12,14` — see `20-features/chores/ai-generator.md`.

Chores walkthrough step 2 `[Described]` `src/components/onboarding/ChoresOnboarding.jsx:13-14` (registry in `20-features/onboarding`; step text owned by `20-features/chores/spec.md`):

> **2. Generate Meal Ideas with AI** — Use the AI Wand button and select 'Meal' as the type. Choose Breakfast, Lunch, Dinner, or Snack — and pick an age group (including ages 3–5 for young children) to get personalized, age-appropriate meal suggestions.

The User Manual's Chores section does not mention the Menu tab or meals `[Described]` `src/pages/UserManual.jsx:180-222`.

## 2. Concepts & vocabulary

Glossary terms used: **meal**, **room** (holds the meal slot for meals), **household member**, **chore library**, **frequency**, **widget**, **today**, **device-local preference**, **export**.

Feature-local terms:
- **meal slot** — the value of `room` on a meal: one of `Breakfast`, `Lunch`, `Dinner`, `Snack`, `Meal`; anything else is displayed under "Other" `[Implemented]` `src/pages/Chores.jsx:797`.
- **planned day** — a meal is planned for a weekday when its frequency is `daily` or its `day_of_week` contains that day's short name (`Mon`…`Sun`) `[Implemented]` `src/pages/Chores.jsx:790-795`.

## 3. User stories

- **US-MEAL-01** As the account owner, I want to see this week's meals laid out by weekday and meal slot so that I know what is being served and when. `[Implemented]` `src/pages/Chores.jsx:781-875`
- **US-MEAL-02** As the account owner, I want to check a meal off once it has been made, and see completed meals separately, so that the menu shows what is still to come. `[Implemented]` `src/pages/Chores.jsx:784,842-846,1435-1443`
- **US-MEAL-03** As the account owner, I want to open a meal's notes and directions with a double-tap so that the recipe is one gesture away. `[Implemented]` `src/pages/Chores.jsx:146-154,848-856,1666-1692`
- **US-MEAL-04** As the account owner, I want to print the weekly meal schedule with an optional note so that it can go on the fridge. `[Implemented]` `src/pages/Chores.jsx:604-664,702-704,1447-1449,1596-1622`
- **US-MEAL-05** As the account owner, I want to filter the menu to one household member so that I can see what one person is cooking. `[Implemented]` `src/pages/Chores.jsx:785,1417-1434`
- **US-MEAL-06** As the account owner, I want the rest of the week's menu and today's chores on my Dashboard and beside my Daily Schedule so that I do not have to open the Chores page to see them. `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:159-293`, `src/components/MenuChoresWidget.jsx:74-191`
- **US-MEAL-07** As the account owner, I want to tick off a chore due today from the Dashboard so that the record updates without leaving the Dashboard. `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:124-157,267-271`

## 4. Capabilities & interactions

### Chores page — Menu tab

- **Open the tab.** The page has two tabs, "Chores" and "Menu"; "Menu" shows a filter row and a card containing the weekly grid `[Implemented]` `src/pages/Chores.jsx:1257-1261,1414-1455`.
- **Filter row** (shown only when at least one household member exists) `[Implemented]` `src/pages/Chores.jsx:1415`:
  - **Member** select, placeholder "Member…"; options: "Member…" (no filter) then every household member except one literally named `UNASSIGNED` `[Implemented]` `src/pages/Chores.jsx:1417-1434,186`. Selecting a member also records the filter in the page's filter-order list; clearing removes it `[Implemented]` `src/pages/Chores.jsx:50-57,1418-1423`. This is the same member filter state as the Chores tab (Q-604) `[Implemented]` `src/pages/Chores.jsx:42,1315,1417`.
  - **Status** select: "Upcoming" (value `pending`, default) or "Completed" `[Implemented]` `src/pages/Chores.jsx:85,1435-1443`.
  - **Collapse all days / Expand all days** icon button (title flips with state) `[Implemented]` `src/pages/Chores.jsx:99-108,1444-1446`.
  - **Print meal schedule** icon button `[Implemented]` `src/pages/Chores.jsx:1447-1449`.
- **Weekly grid.** One collapsible row per weekday, Monday through Sunday `[Implemented]` `src/pages/Chores.jsx:771,803`. The row header shows the full day name, the suffix "today" on today's row, and "{n} meal" / "{n} meals" when the day has at least one meal `[Implemented]` `src/pages/Chores.jsx:818-829`. Today's row is visually distinguished `[Implemented]` `src/pages/Chores.jsx:817,823`.
- **Collapse rules.** All days except today start collapsed `[Implemented]` `src/pages/Chores.jsx:86-90`. Clicking a day header toggles that day `[Implemented]` `src/pages/Chores.jsx:93-97,818-821`. "Collapse all days" collapses every day; "Expand all days" expands every day `[Implemented]` `src/pages/Chores.jsx:99-108`. The all-days flag starts as "not collapsed" although six days start collapsed (D-604) `[Implemented]` `src/pages/Chores.jsx:88-91`.
- **Grouping inside a day.** Meals are grouped by meal slot in the fixed order Breakfast, Lunch, Dinner, Snack, Meal, Other; only slots with meals are shown `[Implemented]` `src/pages/Chores.jsx:797,808-814,836-838`.
- **Meal row.** Checkbox; title (struck through when completed); a "•" marker after the title when the meal has notes; the assignee's name under the title when no member filter is active; tooltip "Double-tap for notes" `[Implemented]` `src/pages/Chores.jsx:840-861`.
- **Check off a meal.** Ticking marks the meal `completed`, stamps `last_completed_date` with today, and, unless frequency is `as_needed`, sets `due_date` to the next due date computed from the frequency; unticking sets `pending` and clears `last_completed_date` `[Implemented]` `src/pages/Chores.jsx:312-338,842-846`. A completed meal leaves the "Upcoming" view and appears under "Completed" `[Implemented]` `src/pages/Chores.jsx:784`.
- **Delete a meal.** Long-press (touch) or hover (pointer) reveals delete; delete goes through the confirm dialog described in `10-architecture/shared-interactions.md` (AR-UI-01, AR-UI-02) and then deletes the `Chore` `[Implemented]` `src/pages/Chores.jsx:290-293,841`.
- **Notes / directions dialog.** Double-click or double-tap the title opens a dialog titled with the meal's title containing: "Type: {room}" when set; "Description: {description}" when set; "Notes / Directions:" followed by the notes preserving line breaks, or the italic line "No notes or directions saved."; "Time: {n} min" when the estimate is above zero `[Implemented]` `src/pages/Chores.jsx:848-853,1666-1692`.
- **Editing a meal.** None observed. Meals are excluded from the Chores tab (BR-MEAL-02), and the Menu tab offers no edit dialog; notes, description, and time can be set only when the meal is created (chore form, see `20-features/chores/spec.md`) (Q-600) `[Implemented]` `src/pages/Chores.jsx:574-576,781-875`.
- **Print meal schedule.** Opens the "Add a Note to Print" prompt (owned by `10-architecture/export-print-email.md` §4b), then prints; content in §12 `[Implemented]` `src/pages/Chores.jsx:702-704,1447,1596-1622`.
- **Creating meals.** Not on this tab. Meals are created by: the chore form with Type "Menu / Meal" (`20-features/chores/spec.md`) `[Implemented]` `src/pages/Chores.jsx:1141-1155`; the AI generator with type "Meal" (`20-features/chores/ai-generator.md`) `[Implemented]` `src/components/ChoreGenerator.jsx:161-172`; and the chore library dialog when a library entry carries a meal type (`20-features/chores/spec.md`).

### Dashboard "Menu & Chores" widget and Daily Schedule "Menu & Chores" card

Both surfaces render the same two halves. Differences are called out.

- **Data.** Dashboard: loads the 500 most recently created chores plus all household members itself, and reloads on any `Chore` change (§7) `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:51-77`. Daily Schedule card: receives the chores the Daily Schedule page loaded (100 most recently updated) and loads household members itself `[Implemented]` `src/pages/DailySchedule.jsx:236,828`, `src/components/MenuChoresWidget.jsx:21-26` (D-606).
- **Menu half**, heading "Menu" `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:163-167`, `src/components/MenuChoresWidget.jsx:78-82`:
  - Shows the days from today through the coming Sunday; on a Sunday only Sunday `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:88-96`, `src/components/MenuChoresWidget.jsx:37-45` (AR-TIME-32).
  - Only meals that are not completed are considered `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:98`, `src/components/MenuChoresWidget.jsx:47`.
  - Days with no planned meal are omitted; each shown day has the full day name, "today" on today's row, "{n} meal(s)", and meals grouped by meal slot in the order Breakfast, Lunch, Dinner, Snack, Meal, Other `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:174-221`, `src/components/MenuChoresWidget.jsx:87-134`.
  - A meal row shows the title and, when the meal is assigned and more than one household member exists, "· {member name}" `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:207-213`, `src/components/MenuChoresWidget.jsx:120-126`.
  - No actions on meals in either widget `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:207-213`, `src/components/MenuChoresWidget.jsx:120-126`.
- **Chores half**, heading "Chores Due Today" `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:230-233`, `src/components/MenuChoresWidget.jsx:143-146`:
  - Lists chores due today (BR-MEAL-06) grouped by assigned household member, then by room with the literal "No Location" when the room is empty `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:114-122`, `src/components/MenuChoresWidget.jsx:64-72`.
  - Member header: the member's colour dot (when the member has a colour), name (or "Unassigned" when the id matches no member), and the count of chores `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:79-80,240-254`, `src/components/MenuChoresWidget.jsx:28-29,151-161`.
  - Chore row: title and "{n}m" when the time estimate is above zero `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:263-279`, `src/components/MenuChoresWidget.jsx:169-177`.
  - **Dashboard only — collapse per member.** Clicking a member header collapses or expands that member's chores; the state is remembered on the device (§10) `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:37-49,246-255`.
  - **Dashboard only — check off.** Each chore row has a checkbox. Ticking updates the list immediately, then writes `status: completed`, `last_completed_date` = today, and `due_date` = next due date from the frequency (none for `as_needed`); unticking writes `pending` and clears `last_completed_date`. If the write fails the row reverts `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:22-31,124-157,267-271`. Because the list only shows chores that are not completed, a ticked chore disappears on the next reload `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:104`.
  - The Daily Schedule card has no checkbox and no collapse `[Implemented]` `src/components/MenuChoresWidget.jsx:151-181`.

### 4a. Keyboard & pointer

- **Double-click** on a meal title opens the notes dialog `[Implemented]` `src/pages/Chores.jsx:850` (AR-UI-04).
- **Double-tap**: two clicks on the same meal within 400 ms open the notes dialog; a single click does nothing `[Implemented]` `src/pages/Chores.jsx:146-154,851`.
- **Long-press / hover** reveals delete on a meal row (AR-UI-01) `[Implemented]` `src/pages/Chores.jsx:841`.
- **Click** a day header toggles its collapse `[Implemented]` `src/pages/Chores.jsx:818-821`; click a member header in the Dashboard widget toggles that member `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:246-254`.
- Enter/Escape, drag-and-drop, swipe: none observed.

### 4b. View state & persistence

| Control | Values | Default | Scope |
|---|---|---|---|
| Page tab | `chores`, `meals` | `chores` | memory `src/pages/Chores.jsx:67` |
| Member filter (Menu tab) | none, member id | none | memory, shared with the Chores tab `src/pages/Chores.jsx:42` |
| Meal status filter | `pending` ("Upcoming"), `completed` | `pending` | memory `src/pages/Chores.jsx:85` |
| Collapsed days | subset of Mon…Sun | all days except today | memory `src/pages/Chores.jsx:86-90` |
| All-days-collapsed flag | true/false | false | memory `src/pages/Chores.jsx:91` |
| Selected meal (notes dialog) | meal or none | none | memory `src/pages/Chores.jsx:84` |
| Print note | free text | last saved note | device `last_chore_print_note` `src/pages/Chores.jsx:124,605` |
| Dashboard member collapse | `{ [memberId]: boolean }` | `{}` | device `dashboard_menuchores_collapsed` `src/components/dashboard/DashboardMenuChores.jsx:37-49` |

### 4c. Empty & fallback states

- Menu tab, no meal matches the filters: "No meals planned" `[Implemented]` `src/pages/Chores.jsx:788`.
- Menu tab, an expanded day with no meals: "No meals" `[Implemented]` `src/pages/Chores.jsx:832-834`.
- Notes dialog, no notes: "No notes or directions saved." `[Implemented]` `src/pages/Chores.jsx:1684-1686`.
- Widgets, no uncompleted meal at all: "No meals planned this week" `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:170-171`, `src/components/MenuChoresWidget.jsx:83-84`.
- Widgets, no chore due today: "No chores due today" `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:236-237`, `src/components/MenuChoresWidget.jsx:147-148`.
- Dashboard widget while loading: "Loading..." in both halves `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:168-169,234-235`.
- Member name fallback: "Unassigned" `[Implemented]` `src/pages/Chores.jsx:597`, `src/components/dashboard/DashboardMenuChores.jsx:79`, `src/components/MenuChoresWidget.jsx:28`.
- Room fallback in the chores half: "No Location" `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:119`, `src/components/MenuChoresWidget.jsx:69`.

## 5. Business rules

- **BR-MEAL-01 (meal rule).** A chore is a meal when its `chore_type` is one of `Breakfast`, `Lunch`, `Dinner`, `Snack`, `Meal` `[Implemented]` `src/pages/Chores.jsx:538-539`, `src/components/MenuChoresWidget.jsx:8-9`, `src/components/dashboard/DashboardMenuChores.jsx:9-10`.
- **BR-MEAL-02 (meals stay off the chore list).** Meals are excluded from the Chores tab list and its counts, from the room option list, from the category (type) option list, from the frequency option list, and from the chores half of both widgets `[Implemented]` `src/pages/Chores.jsx:541-548,574-576,590-592`, `src/components/MenuChoresWidget.jsx:55`, `src/components/dashboard/DashboardMenuChores.jsx:105`.
- **BR-MEAL-03 (room holds the meal slot).** For a meal, `room` is read as the meal slot; a value outside `Breakfast`, `Lunch`, `Dinner`, `Snack`, `Meal` is displayed as "Other" `[Implemented]` `src/pages/Chores.jsx:797`, `src/components/MenuChoresWidget.jsx:50`, `src/components/dashboard/DashboardMenuChores.jsx:101`. The generator writes the chosen meal type (or `Meal`) into `room` `[Implemented]` `src/components/ChoreGenerator.jsx:130,167`; the chore form writes the chosen room `[Implemented]` `src/pages/Chores.jsx:213,223,1200-1213` (D-600).
- **BR-MEAL-04 (planned days).** A meal is shown on a weekday when its frequency is `daily` or its `day_of_week` includes that day's short name `Mon`…`Sun` `[Implemented]` `src/pages/Chores.jsx:790-795`, `src/components/MenuChoresWidget.jsx:48-49`, `src/components/dashboard/DashboardMenuChores.jsx:99-100`. The generator writes short names `[Implemented]` `src/components/ChoreGenerator.jsx:15,166`; the chore form writes full names `[Implemented]` `src/pages/Chores.jsx:22,225,1229-1232` (D-601; see also D-011 in `10-architecture/data-model/chores.md`).
- **BR-MEAL-05 (menu status filter).** "Upcoming" shows meals whose status is not `completed`; "Completed" shows meals whose status is `completed` `[Implemented]` `src/pages/Chores.jsx:784`. The widgets show only meals not completed `[Implemented]` `src/components/MenuChoresWidget.jsx:47`, `src/components/dashboard/DashboardMenuChores.jsx:98`.
- **BR-MEAL-06 (chores due today, widget rule).** A chore is due today when it is not completed, is not a meal, has an assignee, and any of: frequency `daily`; frequency `weekly` with `day_of_week` containing today's full day name; `due_date` equal to today; frequency `monthly` with the day-of-month of `due_date` equal to today's day-of-month `[Implemented]` `src/components/MenuChoresWidget.jsx:53-62`, `src/components/dashboard/DashboardMenuChores.jsx:103-112`. The Chores page states the same rule without the assignee condition and applies the assignee condition in its list filter `[Implemented]` `src/pages/Chores.jsx:71-78,577` (owned by `20-features/chores/spec.md`).
- **BR-MEAL-07 (meal slot colour as meaning).** Slot headings are coloured: Breakfast amber, Lunch green, Dinner blue, Snack purple `[Implemented]` `src/pages/Chores.jsx:774-779`; the widgets add Meal orange `[Implemented]` `src/components/MenuChoresWidget.jsx:13-19`, `src/components/dashboard/DashboardMenuChores.jsx:14-20` (D-602). "Other" and, on the page, "Meal" use the default text colour `[Implemented]` `src/pages/Chores.jsx:838`.
- **BR-MEAL-08 (member colour as meaning).** In the chores half, a member's `ChoreUser.color` is shown as a dot beside the name `[Implemented]` `src/components/MenuChoresWidget.jsx:158`, `src/components/dashboard/DashboardMenuChores.jsx:250`.
- **BR-MEAL-09 (member filter on the menu).** With a member selected, only meals whose `assigned_to` equals that member's id are shown, and assignee names are hidden on rows `[Implemented]` `src/pages/Chores.jsx:785,857-859`.
- **BR-MEAL-10 (completion and next due).** Checking a meal or a chore off writes `status: completed`, `last_completed_date` = today, and `due_date` = today plus one day (`daily`), seven days (`weekly`), fourteen days (`biweekly`), one month (`monthly`), three months (`quarterly`), one year (`yearly`); `as_needed` writes no `due_date`; any other frequency writes today's date `[Implemented]` `src/pages/Chores.jsx:312-333`, `src/components/dashboard/DashboardMenuChores.jsx:22-31,136-142`. Unchecking writes `status: pending` and `last_completed_date: null` `[Implemented]` `src/pages/Chores.jsx:334-336`, `src/components/dashboard/DashboardMenuChores.jsx:143-145`.
- **BR-MEAL-11 (midnight reset).** While the Chores page is open, at the next local midnight every completed chore, meals included, is set back to `pending` (AR-TIME-40) `[Implemented]` `src/pages/Chores.jsx:156-180`.
- **BR-MEAL-12 (print selection).** The meal print includes chores whose `chore_type` is exactly `Meal`, optionally narrowed to the selected member; the Upcoming/Completed filter is not applied `[Implemented]` `src/pages/Chores.jsx:606-607` (D-603).
- **BR-MEAL-13 (assignee display in widgets).** The assignee is shown on a meal only when more than one household member exists `[Implemented]` `src/components/MenuChoresWidget.jsx:123`, `src/components/dashboard/DashboardMenuChores.jsx:210`.

### 5a. State & lifecycle

Meal `status` (a meal is a `Chore`; full lifecycle in `10-architecture/data-model/chores.md`):

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| `pending` | checkbox on Menu tab | `completed` | `last_completed_date` = today; `due_date` = next due (BR-MEAL-10) `src/pages/Chores.jsx:325-333` |
| `completed` | checkbox on Menu tab ("Completed" view) | `pending` | `last_completed_date` = null `src/pages/Chores.jsx:334-336` |
| `completed` | local midnight while the page is open | `pending` | none `src/pages/Chores.jsx:156-161` |
| any | delete (confirmed) | removed | `Chore.delete` `src/pages/Chores.jsx:290-293` |

Chore `status` from the Dashboard widget: `pending` → checkbox → `completed` (same side effects, optimistic, reverted on failure); `completed` → checkbox → `pending` `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:124-157`.

### 5b. Time & date semantics

- "Today" for the Menu tab is the device weekday (`getDay()`) mapped to `Mon`…`Sun` `[Implemented]` `src/pages/Chores.jsx:86,799` (AR-TIME-02, AR-TIME-31).
- The widgets take today's weekday, day-of-month, and the `YYYY-MM-DD` string from the device clock via date-fns `format` `[Implemented]` `src/components/MenuChoresWidget.jsx:31-35`, `src/components/dashboard/DashboardMenuChores.jsx:82-86` (AR-TIME-01 formatter table).
- `last_completed_date` and the computed next `due_date` on the Chores page use `toISOString()` (UTC date) `[Implemented]` `src/pages/Chores.jsx:321,326`; the Dashboard widget stamps `last_completed_date` with the local date and the next `due_date` with the UTC date `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:30,85,130,137-142` (AR-TIME-01, D-134 family).
- Menu range: page shows Monday…Sunday; widgets show today…Sunday (AR-TIME-32).
- "Due today" for the chores half: BR-MEAL-06; canonical definitions in `10-architecture/time-and-date-semantics.md`.

## 6. Data

Entities: `Chore` (E-Chore) read and updated/deleted; `ChoreUser` (E-ChoreUser) read. See `10-architecture/data-model/chores.md`.

| Surface | Read | Writes |
|---|---|---|
| Chores page | `Chore.list("-created_date", 1000)`, `ChoreUser.list()`, `ChoreLibrary.list("-created_date", 1000)` `src/pages/Chores.jsx:188-193` | `Chore.update` (status, last_completed_date, due_date) `:329-336`; `Chore.delete` `:291` |
| Dashboard widget | `Chore.list("-created_date", 500)`, `ChoreUser.list()` `src/components/dashboard/DashboardMenuChores.jsx:56-59` | `Chore.update` (status, last_completed_date, due_date) `:138-145` |
| Daily Schedule card | chores prop from `Chore.filter({}, "-updated_date", 100)` `src/pages/DailySchedule.jsx:236`; `ChoreUser.list()` `src/components/MenuChoresWidget.jsx:25` | none |

Fields read for meals: `chore_type`, `room`, `frequency`, `day_of_week`, `status`, `assigned_to`, `title`, `notes`, `description`, `time_estimate` `[Implemented]` `src/pages/Chores.jsx:782-797,840-859,1673-1689`.

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| inbound | Chores (chore form) | Type "Menu / Meal" creates a `Chore` with `chore_type: "Meal"` that lands on the Menu | `src/pages/Chores.jsx:1141-1155,218-241` |
| inbound | AI generator | Meal ideas become `Chore` rows with `chore_type: "Meal"`, `room` = meal type, short day names | `src/components/ChoreGenerator.jsx:126-173` |
| inbound | Chore library | Library entries with a meal type are assigned as meals | `20-features/chores/spec.md` |
| outbound | Dashboard | `menu-chores` widget in the registry | `src/pages/Dashboard.jsx:24-40` |
| outbound | Daily Schedule | "Menu & Chores" card in the right column, fed by the page's chore load | `src/pages/DailySchedule.jsx:236,828` |
| outbound | Daily Schedule / to-do | Chores due today also surface as synthetic rows there (not meals) | `10-architecture/schedule-hub.md` |
| outbound | Export | Meal print via the note prompt | `10-architecture/export-print-email.md` §3, §4b |

Deep links: none from these surfaces.

### 7a. Feedback & notifications

- Delete confirm dialog "Delete Item?" / "This action cannot be undone." from `SwipeableListItem` `[Implemented]` `src/pages/Chores.jsx:841` (AR-UI-02).
- Dashboard widget: failed check-off reverts the row silently (console only) `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:146-153`.
- Live refresh: the Dashboard widget reloads 300 ms after any `Chore` change, unless it is itself writing, and at most once per 800 ms unless forced `[Implemented]` `src/components/dashboard/DashboardMenuChores.jsx:51-54,69-77,134,155` (AR-UI-14).
- Toasts, celebratory effects, reminders: none observed.

## 8. AI & automation

Meal ideas come from the AI chore generator (`20-features/chores/ai-generator.md`; mechanism in `10-architecture/ai-services.md` §2). No automation touches meals.

## 9. Onboarding content

The Chores walkthrough (owned by `20-features/chores/spec.md`; registry in `20-features/onboarding`) contains the meal step quoted in §1 and a step mentioning "reassign chores or meal tasks" `[Described]` `src/components/onboarding/ChoresOnboarding.jsx:13-14,19`. Dismissal key `chores_onboarded` (generation 1).

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `dashboard_menuchores_collapsed` | JSON object of member id → collapsed (true) in the Dashboard widget's chores half | `{}` | member header click `src/components/dashboard/DashboardMenuChores.jsx:43-49` | never |
| `last_chore_print_note` | last note typed into the print prompt (shared with the chore print) | `""` | Print `src/pages/Chores.jsx:605` | never |

## 11. Seed / hardcoded data used

- Meal types: `Breakfast`, `Lunch`, `Dinner`, `Snack`, `Meal` `src/pages/Chores.jsx:538`, `src/components/MenuChoresWidget.jsx:8`, `src/components/dashboard/DashboardMenuChores.jsx:9`.
- Day names: short `Mon`…`Sun` (Monday-first for the grid; Sunday-first where indexed by `getDay()`) and full names `src/pages/Chores.jsx:87,771-772`, `src/components/MenuChoresWidget.jsx:10-11`, `src/components/dashboard/DashboardMenuChores.jsx:11-12`.
- Meal slot colours (BR-MEAL-07).
- Next-due offsets per frequency (BR-MEAL-10).

## 12. Print / email formats

- **Print meal schedule** (Tier C hand-built HTML; mechanism in `10-architecture/export-print-email.md`) `[Implemented]` `src/pages/Chores.jsx:604-664`:
  - Prompt: "Add a Note to Print" with "Custom Note (optional)", placeholder "e.g. Week of June 9 • Great job everyone!", "Cancel" / "Print"; the note is remembered on the device `[Implemented]` `src/pages/Chores.jsx:1596-1622,605`.
  - Title "Weekly Meal Schedule"; "Generated: {weekday, month day, year}"; the note in italics when present `[Implemented]` `src/pages/Chores.jsx:609,633-637`.
  - One section per weekday Monday…Sunday (days with no meal omitted) with a table of rows: checkbox, title, description, and a right column with the meal slot (`room`), "{n}min" when above zero, and the assignee's name `[Implemented]` `src/pages/Chores.jsx:639-664`.
  - Included: chores with `chore_type` exactly `Meal`, narrowed by the member filter (BR-MEAL-12). Excluded: meals with other meal types, non-meal chores, the Upcoming/Completed filter, notes.
- **Email meal schedule:** none bound. The chore email builder switches its heading to "Weekly Meal Schedule" and labels to "Chef:" / "Type:" when the status filter equals `meals`, a value no control offers `[Partial]` `src/pages/Chores.jsx:713,752-753` (D-313 in `10-architecture/export-print-email.md`).
- Widgets: the "Menu & Chores" card uses the generic card shell; its header has no print or email action `[Implemented]` `src/components/MenuChoresWidget.jsx:75`, `src/components/dashboard/DashboardMenuChores.jsx:160`.

## 13. Acceptance criteria

- **AC-MEAL-01** Given a chore with `chore_type` "Dinner", When the Chores tab is viewed, Then it is absent from the list and its counts, and it appears on the Menu tab. (refs BR-MEAL-01, BR-MEAL-02)
- **AC-MEAL-02** Given a meal with frequency `weekly` and `day_of_week` ["Tue","Thu"], When the Menu tab is viewed, Then it is listed under Tuesday and Thursday only. (refs BR-MEAL-04)
- **AC-MEAL-03** Given a meal with frequency `daily`, When the Menu tab is viewed, Then it is listed under all seven days. (refs BR-MEAL-04)
- **AC-MEAL-04** Given a meal whose `room` is "Lunch", When its day is expanded, Then it is listed under the "Lunch" heading; Given `room` is "Kitchen", Then it is listed under "Other". (refs BR-MEAL-03)
- **AC-MEAL-05** Given today is Wednesday, When the Menu tab is opened, Then Wednesday is expanded and marked "today" and the other six days are collapsed. (refs §4 collapse rules)
- **AC-MEAL-06** Given an upcoming weekly meal is ticked on the Menu tab, When the list reloads, Then the meal is `completed`, `last_completed_date` is today, `due_date` is seven days ahead, it is absent from "Upcoming" and present under "Completed". (refs BR-MEAL-05, BR-MEAL-10)
- **AC-MEAL-07** Given a meal with notes, When its title is clicked twice within 400 ms or double-clicked, Then a dialog titled with the meal name shows "Notes / Directions:" and the notes. (refs §4a)
- **AC-MEAL-08** Given a meal without notes, When the notes dialog opens, Then it reads "No notes or directions saved.". (refs §4c)
- **AC-MEAL-09** Given a member is selected in the Menu tab filter, When the grid renders, Then only meals assigned to that member appear and no assignee names are shown. (refs BR-MEAL-09)
- **AC-MEAL-10** Given meals with `chore_type` "Meal" and "Breakfast", When "Print meal schedule" is confirmed, Then the printed page titled "Weekly Meal Schedule" contains only the "Meal" one, grouped by weekday. (refs BR-MEAL-12)
- **AC-MEAL-11** Given today is Friday, When the Dashboard widget renders, Then its Menu half shows at most Friday, Saturday, Sunday, omitting days with no meal. (refs §4 widgets, AR-TIME-32)
- **AC-MEAL-12** Given a pending, assigned, non-meal chore with frequency `daily`, When the Dashboard widget renders, Then it is listed under its member and room in "Chores Due Today". (refs BR-MEAL-06)
- **AC-MEAL-13** Given an unassigned chore due today, When either widget renders, Then it is not listed. (refs BR-MEAL-06)
- **AC-MEAL-14** Given a chore due today is ticked in the Dashboard widget, When the write succeeds, Then the chore is `completed` with `last_completed_date` today and a `due_date` advanced by its frequency; When the write fails, Then the row returns to unticked. (refs BR-MEAL-10)
- **AC-MEAL-15** Given a member header is collapsed in the Dashboard widget, When the page is reloaded, Then that member is still collapsed. (refs §10)
- **AC-MEAL-16** Given two household members exist, When a meal assigned to one renders in a widget, Then "· {name}" follows the title; Given one member exists, Then no name is shown. (refs BR-MEAL-13)
- **AC-MEAL-17** Given no household member exists, When the Menu tab is opened, Then the filter row (member, status, collapse, print) is not shown. (refs §4)

## 14. Discrepancies & open questions

- **D-600** Meal slot source. The AI generator writes the meal type into `room` (`src/components/ChoreGenerator.jsx:130,167`); the chore form with Type "Menu / Meal" writes a room-list choice into `room` (`src/pages/Chores.jsx:213,223,1200-1213`); the Menu tab and widgets read `room` as the meal slot and show "Other" for any non-meal value (`src/pages/Chores.jsx:797`, `src/components/MenuChoresWidget.jsx:50`, `src/components/dashboard/DashboardMenuChores.jsx:101`).
- **D-601** Meal day names. The generator writes `Mon`…`Sun` (`src/components/ChoreGenerator.jsx:15,166`); the chore form writes `Monday`…`Sunday` (`src/pages/Chores.jsx:22,225,1229-1232`); the Menu tab and widgets match on short names (`src/pages/Chores.jsx:793`, `src/components/MenuChoresWidget.jsx:49`, `src/components/dashboard/DashboardMenuChores.jsx:100`). See D-011.
- **D-602** Slot colour map. The Chores page colours Breakfast/Lunch/Dinner/Snack only (`src/pages/Chores.jsx:774-779`); both widgets also colour `Meal` orange (`src/components/MenuChoresWidget.jsx:13-19`, `src/components/dashboard/DashboardMenuChores.jsx:14-20`).
- **D-603** Print selection. The Menu grid treats five types as meals and applies the Upcoming/Completed filter (`src/pages/Chores.jsx:538,782-786`); the meal print selects `chore_type === "Meal"` only and ignores that filter (`src/pages/Chores.jsx:606-607`).
- **D-604** Collapse-all flag. Six days start collapsed (`src/pages/Chores.jsx:86-90`) while the all-days flag starts false, so the button first reads "Collapse all days" (`src/pages/Chores.jsx:91,1444`).
- **D-606** Widget data window. The Dashboard widget reads the 500 most recently created chores (`src/components/dashboard/DashboardMenuChores.jsx:57`); the Daily Schedule card receives the 100 most recently updated (`src/pages/DailySchedule.jsx:236`).
- **Q-600** Blocks §4 "Editing a meal". Meals cannot be opened for edit on either tab; notes and directions can be entered only in the chore form at creation. Is a meal edit path intended?
- **Q-604** Blocks §4b. The Menu tab's member filter is the same state as the Chores tab's member filter (`src/pages/Chores.jsx:42,1315,1417`), so selecting a member on one tab filters the other. Intended?
