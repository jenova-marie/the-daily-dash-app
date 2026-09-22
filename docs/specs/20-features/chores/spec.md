# Chores — Feature Spec

**Feature code:** `CHORE` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 157 · Described 12 · Partial 9

**Sources owned:** `src/pages/Chores.jsx` (Chores tab, household members, add/edit dialogs, completion, filters, grouping, bulk mode, print, email, onboarding trigger; the Menu tab and meal-specific rendering are owned by `20-features/chores/meal-planning.md`), `src/lib/choreRooms.js`, `src/components/ChoreLibraryDialog.jsx` (detail in `chore-library.md`), `src/components/PrintFormatChores.jsx`, `src/components/onboarding/ChoresOnboarding.jsx`
**Sources referenced (owned elsewhere):** `src/components/SwipeableListItem.jsx`, `src/lib/HeaderContext.jsx`, `src/components/Layout.jsx` → `10-architecture/shared-interactions.md`; `src/components/WidgetCard.jsx`, `src/lib/printUtils.js` → `10-architecture/export-print-email.md`; `src/components/ChoreGenerator.jsx`, `base44/functions/generateChores` → `20-features/chores/ai-generator.md` and `10-architecture/ai-services.md`; `src/components/MenuChoresWidget.jsx`, `src/components/dashboard/DashboardMenuChores.jsx`, Menu tab of `src/pages/Chores.jsx` → `20-features/chores/meal-planning.md`; `src/pages/Goals.jsx` (household members as "family members") → `20-features/goals/spec.md`; `src/pages/Dashboard.jsx`, `src/pages/DailySchedule.jsx` (deep links) → `20-features/dashboard`, `20-features/daily-schedule`; `src/components/DailyToDo.jsx` (completing a chore from the to-do) → `20-features/daily-schedule/daily-todo.md`; `base44/entities/Chore.jsonc`, `ChoreUser.jsonc`, `ChoreLibrary.jsonc` → `10-architecture/data-model/chores.md`

**Permissions:** per-user data (`created_by` row rule on `Chore`, `ChoreUser`, `ChoreLibrary`); admin-only operations: none on this page (the admin library clean-up is in `10-architecture/admin-operations.md`)

## 0. Entry points & navigation

- Route: `/chores` `[Implemented]` `src/App.jsx:207` · Sidebar label: "Chores" `[Implemented]` `src/components/Layout.jsx:18` · Header title text: "Chore Manager" `[Implemented]` `src/pages/Chores.jsx:31` · Position in swipe order: sixth of fourteen nav items, after Daily Schedule and before Education `[Implemented]` `src/components/Layout.jsx:12-27` (swipe mechanics: AR-UI-13 in `10-architecture/shared-interactions.md`).
- Query parameters accepted: `?filter=due` selects the "Due Today" status pill; `?filter=all` at first load selects "All"; any other or absent value at first load selects "Due Today" `[Implemented]` `src/pages/Chores.jsx:58-66`. Inbound sources: the Dashboard chores badge button `[Implemented]` `src/pages/Dashboard.jsx:280` and the Daily Schedule "Chores" quick link `[Implemented]` `src/pages/DailySchedule.jsx:904` (both navigate to `/chores?filter=due`; the badge colour rules belong to those specs).
- Feature-toggle gating: when the account preference `enable_chores` is off, the "Chores" nav item is removed from the sidebar and from the swipe ring `[Implemented]` `src/components/Layout.jsx:130,192` (AR-PREF-23 in `10-architecture/preferences.md`). The route itself stays registered `[Implemented]` `src/App.jsx:207`.
- Header right-slot contents: an icon button titled "Guide" that reopens the walkthrough (§9) `[Implemented]` `src/pages/Chores.jsx:32`.
- Page toolbar (above the tabs, right-aligned): the AI generator button (owned by `ai-generator.md`), the "Chore Library" icon button (§`chore-library.md`), the "Manage household members" icon button (§4.1), and the add-chore "+" button (§4.2) `[Implemented]` `src/pages/Chores.jsx:1102-1136`.
- Tabs: "Chores" (default) and "Menu" `[Implemented]` `src/pages/Chores.jsx:67,1257-1261`. The Menu tab is specified in `meal-planning.md`.

## 1. Purpose & user benefit

A household chore board. The account owner keeps a list of chores, assigns each to one or more household members, gives it a frequency, room and duration, and marks it done. The page answers "what is due today" and can be grouped by member, room, category or frequency, printed for the fridge, or emailed.

User Manual, section "Chores", verbatim `[Described]` `src/pages/UserManual.jsx:186-197`:

> Track household chores with frequency schedules and assignments. Use AI-powered chore generation or manually create tasks for your household.
>
> **Core Features**
> - **Add a chore** — give it a title, description, room, frequency (daily / weekly / biweekly / monthly), day(s) of week, priority, and assign it to a household member. Frequency can be assigned after creation.
> - **Household members** are managed via the "Members" tab — add people with a name and color.
> - **Mark complete** by clicking the checkmark on a chore. It records the completion date.
> - **Overdue chores** are automatically highlighted so nothing gets missed.
> - Filter chores by **room, member, or status** using the filter controls.
> - Chores can be set to recur automatically — after completion, the next due date is calculated based on the frequency.

The manual's "AI Chore Generator" block (`src/pages/UserManual.jsx:200-209`) is quoted in `ai-generator.md`; its "Chore Library" block (`:212-217`) is quoted in `chore-library.md`.

Landing page claim, verbatim `[Described]` `src/pages/LandingPage.jsx:9`:

> **Chore Manager** — Assign household chores to family members, set frequencies, and track completion — with AI-generated chore ideas tailored to age and room.

Walkthrough subtitle `[Described]` `src/components/onboarding/ChoresOnboarding.jsx:44`: "Here's how to get the most out of this page — it only takes a minute!"

## 2. Concepts & vocabulary

- **household member** (glossary) — a `ChoreUser` row: name plus colour. The Chores UI titles the dialog "Household Members"; the Goals UI calls the same rows "family members" (`src/pages/Goals.jsx:515-528`, see `20-features/goals/spec.md`). The landing page also says "family members".
- **room** (glossary) — the `Chore.room` value. The filter control is labelled "Location…" in the UI; the spec uses *room*.
- **meal** (glossary) — a chore whose `chore_type` is one of `Breakfast`, `Lunch`, `Dinner`, `Snack`, `Meal`. Meals are excluded from everything on the Chores tab and are specified in `meal-planning.md`.
- **chore library** (glossary) — `ChoreLibrary` templates; see `chore-library.md`.
- **frequency** (glossary) — `Chore.frequency`, eight values (§11).
- **category** (feature-local) — the `chore_type` value of a non-meal chore as shown in the edit dialog's "Category" chips and used for category grouping. On this page the add dialog calls the same field "Type" (§4.2).
- **status pill** (feature-local) — one of the three toggle buttons All / Due Today / Done that set the status filter.
- **merged row** (feature-local) — in room-, category- and frequency-grouped views, chores with the same title, room and frequency are shown as one row listing every assignee (§5, BR-CHORE-20).
- **bulk mode** (feature-local) — the selection mode in which rows and group headers show checkboxes and a floating action bar offers Reassign and Delete.

## 3. User stories

- **US-CHORE-01** As the account owner, I want to add household members with a name and colour so that chores can be assigned to people. `[Implemented]` `src/pages/Chores.jsx:272-278,1105-1126,1636-1664`
- **US-CHORE-02** As the account owner, I want to create a chore with a title, frequency, room, duration, days and notes and assign it to one or more members so that each person has their own copy. `[Implemented]` `src/pages/Chores.jsx:207-270,1128-1245`
- **US-CHORE-03** As the account owner, I want to see only what is due today by default so that the page opens on today's work. `[Implemented]` `src/pages/Chores.jsx:58-61,71-78,590-596`
- **US-CHORE-04** As the account owner, I want to tick a chore done and have its next due date computed from today so that recurring chores never fall behind. `[Implemented]` `src/pages/Chores.jsx:312-338`
- **US-CHORE-05** As the account owner, I want completed chores to return to pending at midnight so that tomorrow's list starts fresh. `[Implemented]` `src/pages/Chores.jsx:156-180`
- **US-CHORE-06** As the account owner, I want to filter by member, room, frequency and duration and have the list grouped by whichever filter I chose first so that the view matches how I am thinking about the work. `[Implemented]` `src/pages/Chores.jsx:50-57,532-596,993-1096`
- **US-CHORE-07** As the account owner, I want to edit any chore by double-clicking it, including re-assigning it or copying it to more people. `[Implemented]` `src/pages/Chores.jsx:349-462,1458-1550`
- **US-CHORE-08** As the account owner, I want to select many chores at once to reassign or delete them. `[Implemented]` `src/pages/Chores.jsx:473-530,1552-1634`
- **US-CHORE-09** As the account owner, I want to print the current chore list per person with a custom note, or email it to myself. `[Implemented]` `src/pages/Chores.jsx:604-769,1272-1277,1596-1622`
- **US-CHORE-10** As the account owner, I want a reusable set of rooms, including my own custom rooms, with deleted rooms staying gone. `[Implemented]` `src/lib/choreRooms.js:1-90`
- **US-CHORE-11** As the account owner, I want to save a chore I am creating or editing to the library so that I can assign it again later. `[Implemented]` `src/pages/Chores.jsx:243-265,425-448`
- **US-CHORE-12** As the account owner, I want the same household members to be available when I file goals by person. `[Implemented]` `src/pages/Goals.jsx:234-249` (see `20-features/goals/spec.md`)
- **US-CHORE-13** As a first-time visitor, I want a short walkthrough of the page that I can dismiss permanently. `[Implemented]` `src/pages/Chores.jsx:33-35,1251-1255`, `src/components/onboarding/ChoresOnboarding.jsx:33-37`

## 4. Capabilities & interactions

### 4.1 Household members

- **Open the members dialog.** The toolbar icon button titled "Manage household members" opens a dialog titled "Household Members" `[Implemented]` `src/pages/Chores.jsx:1105-1108`.
- **Add a member.** Section "Add New Member" with one field, "Name", and a full-width button "Add Person". Creating requires a non-empty name; the new member gets the default colour `#10b981`; the dialog closes and the page reloads `[Implemented]` `src/pages/Chores.jsx:81,272-278,1110-1114`.
- **List members.** Below a divider, every member except one named exactly `UNASSIGNED` is listed (up to a scrollable height). Each row is a `SwipeableListItem`: long-press or hover reveals delete, which goes through the shared confirm dialog (AR-UI-01/02 in `10-architecture/shared-interactions.md`) `[Implemented]` `src/pages/Chores.jsx:186,1115-1122`.
- **Delete a member.** Deleting removes the `ChoreUser` row and reloads; chores that referenced it keep their `assigned_to` value and render as "Unassigned" (§5, BR-CHORE-07) `[Implemented]` `src/pages/Chores.jsx:295-298,597,1044-1045`.
- **Edit a member.** Clicking a member's name opens "Edit Member" with "Name" (auto-focused) and "Color" (eight swatches, §11), plus "Cancel" and "Save". Save is disabled while the name is empty; it writes name and colour and reloads `[Implemented]` `src/pages/Chores.jsx:300-310,1636-1664`.
- **Colour meaning.** A member's colour identifies that member wherever chores are shown grouped by person outside this page (dashboard widget, library "Assigned:" chips) `[Implemented]` `src/components/ChoreLibraryDialog.jsx:341-353` (dashboard usage cited in `meal-planning.md`). On the Chores tab itself the colour is not rendered `[Implemented]` `src/pages/Chores.jsx:894-939`.
- **Sentinel member.** Any member whose name is exactly `UNASSIGNED` is hidden from the members list, from every assignee checkbox list, from the member filter, and from the bulk reassign list `[Implemented]` `src/pages/Chores.jsx:186,1115-1117,1162,1325,1430,1489,1577`. No code in the owned files creates such a member (Q-550).

### 4.2 Add a chore

- **Open.** The toolbar "+" button opens "New Chore". When there are no household members at all, the click instead shows the browser alert "Please add a household member first before creating chores." and the dialog does not open `[Implemented]` `src/pages/Chores.jsx:1128-1138`.
- **Fields, in order** `[Implemented]` `src/pages/Chores.jsx:79,1140-1242`:

| Field | Control | Values / default | Validation / notes |
|---|---|---|---|
| Type (required) | two toggle buttons "Chore" and "Menu / Meal" | stored as `chore_type` = `Chore` or `Meal`; default none | while none is chosen the hint "Please select a type" shows; creation is refused without a type `:209,1154`. Choosing "Menu / Meal" makes the result a meal (see `meal-planning.md`) |
| Title | text | `""` | creation is refused when empty `:208` (no hint shown) |
| Description | textarea | `""` | — |
| Assign To (required) | checkbox list of members (excluding `UNASSIGNED`) | none | while none is checked the box border is highlighted and the hint "Select at least one person" shows; creation is refused without at least one `:210-211,1160-1180` |
| Frequency | select | Once · Daily · Weekly · Bi-Weekly · Monthly · Quarterly · Yearly · As Needed; default Weekly | — |
| Room | select of the merged room list (§4.9) plus "Other (custom)…" | placeholder "Select a room"; default none | choosing "Other (custom)…" reveals a text input with placeholder "Enter custom room name…" `:1200-1222` |
| Time (min) | number | `0` | non-numeric input becomes `0` `:1223` |
| Days of Week | seven chips Mon…Sun (stored as full names Monday…Sunday) | none | shown only while Frequency is Weekly or Bi-Weekly `:22,340-347,1225-1236`; chips chosen before switching to another frequency are still saved `:225` |
| Notes | textarea | `""` | — |
| Save to library for future use | checkbox | off | see BR-CHORE-12 |
| Priority | no control | always `medium` `:79,224` | `[Partial]` — the field is written but not editable here (D-551) |

- **Create.** "Create Chore" trims and Title-Cases the room (§4.9), trims the type, and creates **one `Chore` row per checked member** with the same data, skipping any member for whom an equivalent row exists (BR-CHORE-10). Then, if "Save to library" is ticked, writes a library row (BR-CHORE-12). The form resets to defaults, the dialog closes, and the page reloads `[Implemented]` `src/pages/Chores.jsx:207-270`. New rows carry no explicit `status`; the entity default is `pending` `[Implemented]` `base44/entities/Chore.jsonc:45-53`.

### 4.3 Edit a chore

- **Open.** A pointer double-click on a row, or two taps on the same row within 400 ms, opens "Edit Chore" pre-filled from that row. In bulk mode these gestures select instead `[Implemented]` `src/pages/Chores.jsx:349-365,454-462,909-912` (AR-UI-04/05). For a merged row the dialog opens on the row's first underlying chore `[Implemented]` `src/pages/Chores.jsx:883,895,911-912`.
- **Fields, in order** `[Implemented]` `src/pages/Chores.jsx:1463-1547`:

| Field | Control | Notes |
|---|---|---|
| Title | text | no validation on save `:377-378` |
| Category | chips: Cleaning, Organizing, Maintenance, Other, then every distinct non-meal `chore_type` seen in chores and library rows (alphabetical), meal types removed; plus a text input "Or type a custom category…" | the text input shows the current value only when it is not one of the chips `:546,1465-1484`. Because the add dialog stores `Chore` as the type, "Chore" appears as a chip once any such chore exists (D-558) |
| Assign To | checkbox list (excluding `UNASSIGNED`); the current assignee pre-checked | when more than one is checked: "Will create a copy for each additional person" `:355,1487-1502` |
| Frequency | select, same eight values | — |
| Room | free-text input that references a suggestion list id `room-suggestions` | no such list element is rendered in the file `[Partial]` (Q-552) `:1523` |
| Time (min) | number | — |
| Days of Week | chips, shown only for Weekly / Bi-Weekly | `:1527-1540` |
| Description | textarea | — |
| Notes | textarea | — |
| Save to library for future use | checkbox, off each time the dialog opens | `:350,1543-1546` |
| Priority | no control; existing value kept | `:362,392` |

- **Save.** "Save Changes" closes the dialog immediately and updates the row in memory before the write lands ("optimistic update") `[Implemented]` `src/pages/Chores.jsx:402-407`. The first checked member becomes the row's assignee (or the previous assignee when nothing is checked); every additional checked member gets a **new** row copied from the form with `status: pending`, unless that member already has a chore with the same title (case-insensitive) and frequency (BR-CHORE-11) `[Implemented]` `src/pages/Chores.jsx:386-423`. Room is Title-Cased and remembered as a custom room (§4.9) `[Implemented]` `src/pages/Chores.jsx:380-384`. Optional library save (BR-CHORE-12) `:425-448`, then reload `:451`.

### 4.4 Complete, un-complete, delete

- **Complete.** The row checkbox marks the chore `completed`, stamps `last_completed_date` with today, and sets `due_date` to the next due date computed from now for every frequency except `as_needed` (BR-CHORE-13). Code comment, verbatim: "Next due calculated from completion date (never goes overdue)" `[Implemented]` `src/pages/Chores.jsx:324-333,327`.
- **Un-complete.** Ticking a completed chore sets `pending` and clears `last_completed_date` to `null`; `due_date` is left as it was `[Implemented]` `src/pages/Chores.jsx:334-336`.
- **Completed rendering.** A completed chore's title is struck through; a "✓ {last_completed_date}" tag shows whenever a last-completed date exists `[Implemented]` `src/pages/Chores.jsx:914,931-933`.
- **Delete one.** Long-press / hover reveal on the row, then the shared confirm ("Delete Item?" / "This action cannot be undone."). For a merged row **every** underlying chore is deleted `[Implemented]` `src/pages/Chores.jsx:290-293,901-903` (AR-UI-01/02).
- **Skip.** No control writes `status: skipped` `[Implemented]` `src/pages/Chores.jsx:324-338` (walkthrough step 5 mentions "skip": D-554).

### 4.5 Status pills and filters (Chores tab)

All filters apply to non-meal chores that have an assignee (BR-CHORE-01). Counts on the pills are computed **before** the status filter, so they reflect the other filters `[Implemented]` `src/pages/Chores.jsx:573-588,1283-1287`.

- **Status pills** `[Implemented]` `src/pages/Chores.jsx:590-596,1283-1301`:

| Pill | Count shown | Rows shown |
|---|---|---|
| All | chores whose status is not `completed` | status not `completed` |
| Due Today | chores due today (BR-CHORE-02) | due today |
| Done | chores whose status is `completed` | status `completed` |

- **Member filter** (shown when at least one member exists): a select with placeholder "Member…" offering "Member…" (clear), "All Members", then each member except `UNASSIGNED`. A specific member matches chores whose `assigned_to` equals the member's id **or** the member's name `[Implemented]` `src/pages/Chores.jsx:532-536,1304-1330`. Selecting a member or "All Members" registers `user` in the filter order; clearing removes it (§4.6).
- **Location filter** (shown when the room list is non-empty): placeholder "Location…"; options "Clear", "All Locations", then every room from §4.9 minus meal-type names and deleted rooms. A specific room matches case-insensitively and only chores that have a room; "All Locations" matches everything. Choosing **any** option other than "Clear" also sets the status pill to "All" `[Implemented]` `src/pages/Chores.jsx:541-545,581-586,1331-1353`.
- **Frequency filter**: placeholder "Frequency…"; options "Clear", "All Frequencies", the eight frequencies plus any other lower-cased frequency value found on non-meal chores or library rows (sorted alphabetically, labelled per §11), then the synthetic "Weekdays" and "Weekends". A frequency matches case-insensitively; "Weekdays" matches chores whose `day_of_week` contains any of Monday–Friday; "Weekends" any of Saturday–Sunday (case-insensitive) `[Implemented]` `src/pages/Chores.jsx:547-549,560-571,1355-1375`.
- **Duration filter**: placeholder "Duration…"; options "Clear", "≤ 15 min", "16–30 min", "> 30 min". Buckets on `time_estimate` (missing counts as 0): 0 < t ≤ 15; 15 < t ≤ 30; t > 30. A chore with no estimate matches none of the buckets. The duration filter never enters the filter order `[Implemented]` `src/pages/Chores.jsx:551-558,1376-1394`.
- **Clear all**: an "X" button (title "Clear all filters") appears when any of member, location, frequency or duration is set; it clears all of them, the (control-less) category filter, and the filter order. It does not change the status pill `[Implemented]` `src/pages/Chores.jsx:1396-1404`.
- **Category filter**: state exists and is cleared by "Clear all", but no control sets it `[Partial]` `src/pages/Chores.jsx:44,1398` (Q-551).
- **Shared member filter.** The Menu tab's member select writes the same member filter and filter order, so a member chosen on either tab applies to both `[Implemented]` `src/pages/Chores.jsx:1417-1424` (Menu behaviour in `meal-planning.md`).

### 4.6 Grouping (cascade by filter order)

- **Filter order.** Each time the member, location or frequency filter is set to a value (including "All …"), that filter's key is appended to an ordered list unless already present; clearing a filter removes its key. The **first** key decides the top-level grouping `[Implemented]` `src/pages/Chores.jsx:47-57,996,1308-1316,1334-1338,1357-1361`.
- **Views** `[Implemented]` `src/pages/Chores.jsx:993-1096`:

| First filter applied | Top-level groups (label · count) | Inside each group | Merged rows? | Hidden row labels |
|---|---|---|---|---|
| none, and no member filter | by assignee: member name, or "Unassigned" when the id matches no member (a member *name* stored in `assigned_to` also resolves) | frequency sub-groups | no | — |
| member | same as above | frequency sub-groups | no | — |
| location | by room; chores with no room under "No Room" | frequency sub-groups | yes | room |
| frequency | frequency groups directly at top level | — | yes | — |
| category | by `chore_type`; empty under "Uncategorized" | frequency sub-groups | yes | (category label is not rendered on rows anyway) — reachable only if a category filter were set `[Partial]` (Q-551) |
| any other case | flat frequency groups, no merge | — | no | — |

- **Frequency sub-groups** are ordered Once, Daily, Weekly, Bi-Weekly, Monthly, Quarterly, Yearly, As Needed, then "Other" for any unrecognised value; each shows "{Label} ({n})" and is collapsible; empty groups are omitted `[Implemented]` `src/pages/Chores.jsx:24,941-990`.
- **Merged rows** combine chores with identical title, room and frequency (exact, case-sensitive) into one row; assignee names are listed on the row in the order encountered; the row carries every underlying id for delete and group selection (BR-CHORE-20) `[Implemented]` `src/pages/Chores.jsx:877-892,894-898,928-930`.
- **Row content.** Title; then, when present: room (unless hidden by the view), "{n}min", scheduled days as two-letter abbreviations joined by " · ", assignee names (merged views only), "✓ {last_completed_date}" `[Implemented]` `src/pages/Chores.jsx:894-939`.
- **Empty list.** "No chores" `[Implemented]` `src/pages/Chores.jsx:994`.

### 4.7 Collapse / expand

- A header icon button toggles between "Collapse all" and "Expand all"; the page **starts collapsed**. Individual group and sub-group headers toggle their own state, stored as exceptions to the global state; flipping the global state clears the exceptions (AR-UI-09 in `10-architecture/shared-interactions.md`) `[Implemented]` `src/pages/Chores.jsx:110-111,128-144,955,1001,1269-1271`.

### 4.8 Bulk mode

- **Enter / exit.** A header icon button titled "Bulk select" (or "Exit bulk select" when active). Exiting clears the selection `[Implemented]` `src/pages/Chores.jsx:116-117,491-494,1266-1268`.
- **Selecting.** In bulk mode each row shows a selection checkbox in place of the delete affordance (batch mode of `SwipeableListItem`) and the completion checkbox is hidden; clicking anywhere on the row toggles selection. A merged row selects only its first underlying chore id `[Implemented]` `src/pages/Chores.jsx:473-479,895,904-908,912`. Every group and sub-group header shows a checkbox that selects or clears **all** ids in the group, including every id of merged rows, and renders as indeterminate when only some are selected `[Implemented]` `src/pages/Chores.jsx:481-489,956-969,1002-1014,1047,1065,1083` (D-557).
- **Action bar.** While at least one chore is selected, a floating bar reads "{n} selected" with buttons "Reassign", "Delete", and an "X" that exits bulk mode `[Implemented]` `src/pages/Chores.jsx:1552-1568`.
- **Reassign.** Dialog "Reassign {n} Chore(s)" with the line "Select who to assign these chores to:", a checkbox list of members (excluding `UNASSIGNED`), the hint "Will create copies for each additional person." when more than one is checked, and "Cancel" / "Apply" (disabled with none checked). Apply sets each selected chore's assignee to the **first** checked member and, for each additional member, creates a copy of the chore (all fields, new id, `status: pending`) unless that member already has an equivalent chore (BR-CHORE-11); then exits bulk mode and reloads `[Implemented]` `src/pages/Chores.jsx:506-530,1570-1594`.
- **Delete.** Dialog "Delete {n} Chore(s)?" / "This action cannot be undone." with "Cancel" / "Delete". Delete removes every selected id, then always closes the dialog, exits bulk mode and reloads `[Implemented]` `src/pages/Chores.jsx:496-504,1624-1634`.

### 4.9 Rooms

- **Default rooms:** Kitchen, Bathroom, Bedroom, Living Room, Dining Room, Laundry Room, Garage, Entryway, Yard `[Implemented]` `src/lib/choreRooms.js:4`.
- **Custom rooms** are kept on the device (`chore_custom_rooms`, §10). A room is added when the user saves a chore with it, and every room seen on any chore or library row is copied in on each page load; the list is de-duplicated case-insensitively on read, keeping the first spelling `[Implemented]` `src/lib/choreRooms.js:53-79`, `src/pages/Chores.jsx:197-204,212-217,380-384`.
- **Deleted rooms** are kept lower-cased on the device (`chore_deleted_rooms`). Deleting a custom room removes it from the custom list and adds it to the deleted list; a deleted room is not re-added by saving, is skipped when copying rooms from data, and is dropped from the option list even when it is a default or still present on rows. (Deletion is triggered from the AI generator's room picker, see `ai-generator.md`; the Chores page only reads the list.) `[Implemented]` `src/lib/choreRooms.js:6-28,70-90`, `src/pages/Chores.jsx:122,197-204,545`.
- **Option list** = rooms found on library and chore rows (their spelling wins), then defaults and custom rooms, de-duplicated case-insensitively, minus deleted rooms, sorted alphabetically case-insensitively `[Implemented]` `src/lib/choreRooms.js:30-51`. On the Chores page, rooms taken from meals are excluded and the resulting names are filtered against the meal-type set and the deleted list once more `[Implemented]` `src/pages/Chores.jsx:541-545`.
- **Normalisation on save.** The room typed or chosen in the add and edit dialogs is trimmed and converted to Title Case (first letter of each space-separated word upper, rest lower) before it is stored or remembered `[Implemented]` `src/pages/Chores.jsx:280-283`.

### 4.10 Print and email (Chores tab)

Header icon buttons "Print chores" and "Email chores" `[Implemented]` `src/pages/Chores.jsx:1272-1277`. Content is in §12; mechanism and tiers in `10-architecture/export-print-email.md` (Tier C, §3a, §4b).

### 4.11 Realtime updates

- The page reloads all three entities after every write it makes and does not subscribe to entity change events; a change made elsewhere appears on the next write or page open `[Implemented]` `src/pages/Chores.jsx:188-205,269,293,298,337,451,502,529`. Other surfaces that subscribe to `Chore` are listed under AR-UI-14 in `10-architecture/shared-interactions.md`.

### 4a. Keyboard & pointer

- Double-click (pointer) or double-tap within 400 ms (touch) on a chore row opens the edit dialog; the 400 ms window is per row `[Implemented]` `src/pages/Chores.jsx:125,454-462,911-912`.
- Long-press 500 ms / hover reveals delete on chore rows and member rows (`SwipeableListItem`, AR-UI-01) `[Implemented]` `src/pages/Chores.jsx:901,1118`.
- No Enter-to-submit or keyboard shortcut is bound in the owned files; dialogs are submitted by their buttons and dismissed through the dialog's own close behaviour `[Implemented]` `src/pages/Chores.jsx:1128,1459,1571,1597,1625,1637`.
- Hover on group headers highlights the label; no drag-and-drop is present `[Implemented]` `src/pages/Chores.jsx:972-975,1015-1019`.

### 4b. View state & persistence

| Control | Values | Default | Scope (memory / device `key` / account `Entity.field`) |
|---|---|---|---|
| Active tab | `chores`, `meals` | `chores` | memory `src/pages/Chores.jsx:67` |
| Status pill | `all`, `due`, `completed` | `due` (or `all` via `?filter=all`) | memory, seeded from the query string `:58-66` |
| Member filter | `null`, `__all__`, member id | `null` | memory `:42` (shared with Menu tab) |
| Location filter | `null`, `__all__`, room name | `null` | memory `:43` |
| Frequency filter | `null`, `__all__`, frequency, `weekdays`, `weekends` | `null` | memory `:45` |
| Duration filter | `null`, `quick`, `medium`, `long` | `null` | memory `:46` |
| Category filter | `null` only (no setter control) | `null` | memory `:44` `[Partial]` |
| Filter order | ordered subset of `user`, `room`, `category`, `frequency` | `[]` | memory `:48` |
| Collapse all | boolean | `true` (collapsed) | memory `:111` |
| Per-group exceptions | group keys | `[]` | memory `:110` |
| Bulk mode / selection | boolean / set of ids | off / empty | memory `:116-117` |
| Print note | string | last saved note | device `last_chore_print_note` `:124,605` |
| Custom rooms | string[] | `[]` | device `chore_custom_rooms` `src/lib/choreRooms.js:1` |
| Deleted rooms | string[] | `[]` | device `chore_deleted_rooms` `src/lib/choreRooms.js:2` |
| Walkthrough shown | boolean | shown until dismissed | device `chores_onboarded` `src/pages/Chores.jsx:33-35` |

### 4c. Empty & fallback states

- Chore list: "No chores" `[Implemented]` `src/pages/Chores.jsx:994`.
- Add chore with no members: browser alert "Please add a household member first before creating chores." `[Implemented]` `src/pages/Chores.jsx:1131`.
- Add dialog hints: "Please select a type"; "Select at least one person" `[Implemented]` `src/pages/Chores.jsx:1154,1179`.
- Members dialog: the member list section is omitted entirely when there are no (non-sentinel) members `[Implemented]` `src/pages/Chores.jsx:1115`.
- Member and Location filters are omitted when there are no members / no rooms respectively `[Implemented]` `src/pages/Chores.jsx:1304,1331`.
- Assignee label fallback "Unassigned" `[Implemented]` `src/pages/Chores.jsx:597,1045`; room group fallback "No Room"; category group fallback "Uncategorized" `[Implemented]` `src/pages/Chores.jsx:1057,1075`.
- Print: members with no matching chores are omitted; email: weekdays with no items are omitted `[Implemented]` `src/pages/Chores.jsx:668,740`.

## 5. Business rules

- **BR-CHORE-01 (What the Chores tab shows).** A chore appears on the Chores tab only if its `chore_type` is not a meal type (`Breakfast`, `Lunch`, `Dinner`, `Snack`, `Meal`) **and** it has a non-empty `assigned_to` `[Implemented]` `src/pages/Chores.jsx:538-539,574-577,592`.
- **BR-CHORE-02 (Due today).** A chore is due today when it is not `completed` and any of: frequency is `daily`; frequency is `weekly` and `day_of_week` contains today's full weekday name; `due_date` equals today; frequency is `monthly` and the day-of-month of `due_date` equals today's day-of-month `[Implemented]` `src/pages/Chores.jsx:68-78`. See §5b for the date sources and D-103.
- **BR-CHORE-03 (Default view).** The page opens on "Due Today" unless the URL carries `?filter=all` at first load; `?filter=due` arriving later re-selects "Due Today" `[Implemented]` `src/pages/Chores.jsx:58-66` (D-561).
- **BR-CHORE-04 ("All" means not done).** The "All" pill shows and counts only chores whose status is not `completed`; completed chores are reachable only under "Done" `[Implemented]` `src/pages/Chores.jsx:595,1284`.
- **BR-CHORE-05 (Location forces All).** Choosing any room or "All Locations" sets the status pill to "All" `[Implemented]` `src/pages/Chores.jsx:1336-1337`.
- **BR-CHORE-06 (Member match by id or name).** The member filter matches `assigned_to` against the member's id or name `[Implemented]` `src/pages/Chores.jsx:532-536`; grouping likewise resolves a stored name to the member `[Implemented]` `src/pages/Chores.jsx:1044`. Every writer on this page stores the id `[Implemented]` `src/pages/Chores.jsx:240,410,421,511,522` (data-model D-001).
- **BR-CHORE-07 (Orphaned assignee).** A chore whose `assigned_to` matches no member by id or name is shown under "Unassigned" `[Implemented]` `src/pages/Chores.jsx:597,1044-1045`.
- **BR-CHORE-08 (Type is required).** A chore cannot be created without choosing "Chore" or "Menu / Meal"; the value is stored in `chore_type` as `Chore` or `Meal` `[Implemented]` `src/pages/Chores.jsx:209,1143-1151`.
- **BR-CHORE-09 (At least one assignee on create).** Creation requires at least one checked member; the add dialog cannot open while no members exist `[Implemented]` `src/pages/Chores.jsx:210-211,1131`.
- **BR-CHORE-10 (One row per assignee, duplicate guard on create).** Creating with *n* checked members writes up to *n* rows. A row is skipped for a member who already has a chore with the same assignee id, title (case-insensitive), frequency, room (case-insensitive), priority and trimmed `chore_type` `[Implemented]` `src/pages/Chores.jsx:230-242`.
- **BR-CHORE-11 (First assignee updates, the rest are copied).** On edit, the first checked member replaces the row's assignee and each further member gets a new pending copy unless they already have a chore with the same title (case-insensitive) and frequency `[Implemented]` `src/pages/Chores.jsx:399-423`. On bulk reassign the same first/rest rule applies, with the copy guard on title (case-insensitive), frequency, room, priority and `chore_type` (exact) `[Implemented]` `src/pages/Chores.jsx:506-525`. The three guards differ: D-556.
- **BR-CHORE-12 (Save to library, opt-in).** When the "Save to library for future use" box is ticked on create or edit, one `ChoreLibrary` row is written with title, description (or `""`), frequency coerced to one of daily/weekly/biweekly/monthly (anything else becomes `weekly`), time estimate (or 0), priority (or `medium`), Title-Cased room (or `""`) and trimmed type (or `""`). It is skipped when one of the 200 most recent library rows matches on title (case-insensitive), coerced frequency, room, priority and type. The box resets to unticked after each save `[Implemented]` `src/pages/Chores.jsx:114-115,243-267,425-448` (D-559 on the room compared).
- **BR-CHORE-13 (Next due from completion).** Completing sets `status: completed`, `last_completed_date` = today, and `due_date` = now plus: daily +1 day, weekly +7 days, biweekly +14 days, monthly +1 calendar month, quarterly +3 calendar months, yearly +1 year. For `as_needed` no due date is written. For `once` or any other value the computed date equals today (no interval is added) `[Implemented]` `src/pages/Chores.jsx:312-333`. Intent, verbatim from the code: "Next due calculated from completion date (never goes overdue)" `src/pages/Chores.jsx:327`.
- **BR-CHORE-14 (Un-complete).** Ticking a completed chore sets `pending` and `last_completed_date: null` `[Implemented]` `src/pages/Chores.jsx:334-336`.
- **BR-CHORE-15 (Midnight reset).** While the page is open, at the next local midnight every `completed` chore is set back to `pending` (other fields untouched), the page reloads, and the timer re-arms for the following midnight. The first timer is cancelled when the page unmounts; re-armed timers are not `[Implemented]` `src/pages/Chores.jsx:156-180` (AR-TIME-40).
- **BR-CHORE-16 (Overdue).** No overdue rule or highlight exists on this page `[Implemented]` `src/pages/Chores.jsx:68-78,894-939`. The manual states "Overdue chores are automatically highlighted so nothing gets missed." `[Described]` `src/pages/UserManual.jsx:194` and the walkthrough states "Overdue items are highlighted automatically." `[Described]` `src/components/onboarding/ChoresOnboarding.jsx:24` (D-104 in `10-architecture/time-and-date-semantics.md`; the Dashboard badge and Daily Schedule quick link carry their own overdue colouring, cited in §0).
- **BR-CHORE-17 (Frequencies and days).** Eight frequency values are offered everywhere on the page; the "Days of Week" chips appear only for weekly and biweekly and store full English day names `[Implemented]` `src/pages/Chores.jsx:22,1186-1193,1225-1236,1508-1515,1527-1540`. The manual and walkthrough name four `[Described]` `src/pages/UserManual.jsx:191`, `src/components/onboarding/ChoresOnboarding.jsx:24` (D-552).
- **BR-CHORE-18 (Priority).** `priority` is always `medium` for chores created here and is preserved unchanged on edit; no control exposes it `[Partial]` `src/pages/Chores.jsx:79,224,362,392`. The manual lists priority as a field the user sets `[Described]` `src/pages/UserManual.jsx:191` (D-551).
- **BR-CHORE-19 (Cascade grouping).** The first of member / location / frequency (and category) to be applied decides the top-level grouping; later filters only narrow the rows `[Implemented]` `src/pages/Chores.jsx:50-57,993-1096`.
- **BR-CHORE-20 (Merge in room, category and frequency views).** In those views chores sharing title, room and frequency (exact match) collapse into one row that lists all assignees; deleting the row deletes all of them; the group checkbox in bulk mode selects all of them; the row checkbox selects the first only; editing opens the first `[Implemented]` `src/pages/Chores.jsx:877-892,895-912,956` (D-557).
- **BR-CHORE-21 (Room normalisation and memory).** Rooms are Title-Cased on save, remembered on the device, and merged with defaults and rooms found in data; deleted rooms stay suppressed even when present on rows `[Implemented]` `src/pages/Chores.jsx:197-204,280-283`, `src/lib/choreRooms.js:6-90` (§4.9).
- **BR-CHORE-22 (Sentinel member).** A member named `UNASSIGNED` is never offered as an assignee or filter value `[Implemented]` `src/pages/Chores.jsx:186,1115-1117,1162,1325,1430,1489,1577`.
- **BR-CHORE-23 (Household members are shared with Goals).** The same `ChoreUser` rows are listed, created (name only) and deleted from the Goals page under the label "Family Members" `[Implemented]` `src/pages/Goals.jsx:234-249,515-535` (see `20-features/goals/spec.md`).
- **BR-CHORE-24 (Chores are meal-agnostic at the data level).** Everything created from the add dialog with type "Menu / Meal" is stored in the same entity and only differs by `chore_type` (`Meal`); it disappears from the Chores tab and appears on the Menu tab `[Implemented]` `src/pages/Chores.jsx:538-539,576,1143-1151` (rules in `meal-planning.md`).
- **BR-CHORE-25 (Category vocabulary).** The add dialog stores `Chore`/`Meal` in `chore_type`; the edit dialog offers Cleaning, Organizing, Maintenance, Other plus every non-meal type already in data, or free text `[Implemented]` `src/pages/Chores.jsx:1143-1151,1467-1483` (D-558; cross-component lists in seed-data D-131).
- **BR-CHORE-26 (Manual: filters).** "Filter chores by room, member, or status using the filter controls." `[Described]` `src/pages/UserManual.jsx:195`; implemented filters also include frequency and duration (§4.5).
- **BR-CHORE-27 (Manual: completion date).** "Mark complete by clicking the checkmark on a chore. It records the completion date." `[Described]` `src/pages/UserManual.jsx:193`; matches BR-CHORE-13.
- **BR-CHORE-28 (Manual: recurrence).** "after completion, the next due date is calculated based on the frequency." `[Described]` `src/pages/UserManual.jsx:196`; matches BR-CHORE-13.
- **BR-CHORE-29 (Manual: members tab).** "Household members are managed via the "Members" tab" `[Described]` `src/pages/UserManual.jsx:192`; the page has a members dialog behind an icon button and no such tab (D-550).

### 5a. State & lifecycle

`Chore.status` (`pending` · `completed` · `skipped`; default `pending`) `base44/entities/Chore.jsonc:45-53`:

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| (none) | create from add dialog / edit copy / bulk copy | `pending` (entity default on create; explicit on copies) | `src/pages/Chores.jsx:240,421,522` |
| `pending` | row checkbox | `completed` | `last_completed_date` = today; `due_date` = next due (BR-CHORE-13) `:324-333` |
| `completed` | row checkbox | `pending` | `last_completed_date` = `null` `:334-336` |
| `completed` | local midnight while page open | `pending` | reload; timer re-armed `:156-168` |
| any | delete (row, merged row, bulk) | removed | `:290-293,496-504,903` |
| any | `skipped` | — | never written from this feature `[Implemented]` `src/pages/Chores.jsx:324-338` |

`ChoreUser`: created (name + default colour) → edited (name, colour) → deleted; no status field `[Implemented]` `src/pages/Chores.jsx:272-310`.

### 5b. Time & date semantics

- **Today (date string)** is `new Date().toISOString().split('T')[0]`, i.e. the UTC calendar date of the current instant; used for `due_date === today`, for `last_completed_date`, and for the next-due computation `[Implemented]` `src/pages/Chores.jsx:68,321,326`. This is formatter C in AR-TIME-01 (`10-architecture/time-and-date-semantics.md`); divergence from the local-date pages is logged there as D-100.
- **Today's weekday name and day-of-month** come from the device clock in local time `[Implemented]` `src/pages/Chores.jsx:69-70` (AR-TIME-02).
- **Due today** is BR-CHORE-02. The canonical comparison of the five chore due-today rules is §8.2 of `10-architecture/time-and-date-semantics.md` (D-103): this page applies no assignment requirement inside the rule (the tab filter adds one, BR-CHORE-01) and no meal exclusion inside the rule (the tab filter adds one).
- **Overdue** is not defined on this page (D-104); see BR-CHORE-16.
- **Next due** is computed from the completion instant, not from the previous `due_date` (D-137), with monthly = +1 calendar month (D-107) `[Implemented]` `src/pages/Chores.jsx:312-322`.
- **Midnight reset** is AR-TIME-40 `[Implemented]` `src/pages/Chores.jsx:156-180`.
- **Weeks** are displayed Monday-first in day chips and print/email; weekday lookup for "today" is Sunday-indexed (AR-TIME-31) `[Implemented]` `src/pages/Chores.jsx:22-23,69`.

## 6. Data

Entities and fields are specified in `10-architecture/data-model/chores.md` (`E-Chore`, `E-ChoreUser`, `E-ChoreLibrary`).

- **Owned writes.** `Chore` create/update/delete (§4.2–4.4, 4.8); `ChoreUser` create/update/delete (§4.1); `ChoreLibrary` create (BR-CHORE-12) `[Implemented]` `src/pages/Chores.jsx:159,240,255,274,291,296,307,329,335,410,421,438,498,511,522`.
- **Reads on load and after every write:** `Chore.list("-created_date", 1000)`, `ChoreUser.list()` (no sort, no limit), `ChoreLibrary.list("-created_date", 1000)` `[Implemented]` `src/pages/Chores.jsx:188-196`. Library duplicate checks read `ChoreLibrary.list("-created_date", 200)` `[Implemented]` `src/pages/Chores.jsx:245,428`.
- **Fields read for the Chores tab:** `title`, `description`, `assigned_to`, `frequency`, `day_of_week`, `room`, `priority`, `status`, `due_date`, `last_completed_date`, `time_estimate`, `notes`, `chore_type` `[Implemented]` `src/pages/Chores.jsx:71-78,219-228,894-939`.
- **Signed-in user** is read for the email recipient `[Implemented]` `src/pages/Chores.jsx:182-184,708`.
- **Display order** within a group is the load order (newest created first); no secondary sort `[Implemented]` `src/pages/Chores.jsx:190,945-948`.

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| inbound | Dashboard | badge button navigates to `/chores?filter=due` | `src/pages/Dashboard.jsx:280` |
| inbound | Daily Schedule | "Chores" quick link navigates to `/chores?filter=due`; hidden when `enable_chores` is off | `src/pages/DailySchedule.jsx:902-904` |
| inbound | Settings | `enable_chores` toggle hides the nav item (AR-PREF-20..23) | `src/components/Layout.jsx:130,192` |
| shared entity | Goals | `ChoreUser` rows are the Goals "family members" (create name-only, delete) | `src/pages/Goals.jsx:234-249,515-535` |
| shared entity | Meal planning (Menu tab, widgets) | meals are `Chore` rows with a meal `chore_type`; the Menu tab shares this page's member filter | `src/pages/Chores.jsx:538-539,1417-1424`; `meal-planning.md` |
| shared entity | Daily To-Do | completing a chore from the to-do writes `status` only | `src/components/DailyToDo.jsx:123-124` (`20-features/daily-schedule/daily-todo.md`; data-model D-003) |
| outbound | Chore library | dialog hosted on this page's toolbar; assigning creates `Chore` rows and triggers a reload | `src/pages/Chores.jsx:1104`; `chore-library.md` |
| outbound | AI generator | button hosted on this page's toolbar; creation triggers a reload | `src/pages/Chores.jsx:1103`; `ai-generator.md` |
| outbound | Export | print window and email send | `10-architecture/export-print-email.md` §3a, §4b |
| outbound | Onboarding registry | first-visit walkthrough, device key `chores_onboarded` | `20-features/onboarding` |

### 7a. Feedback & notifications

- Browser alert "Please add a household member first before creating chores." when "+" is pressed with no members `[Implemented]` `src/pages/Chores.jsx:1131`.
- Browser alert "Sent to your email!" after the email send resolves `[Implemented]` `src/pages/Chores.jsx:768` (AR-EXPORT-03).
- Confirm dialogs: shared "Delete Item?" for rows and members (AR-UI-02); "Delete {n} Chore(s)?" / "This action cannot be undone." for bulk delete `[Implemented]` `src/pages/Chores.jsx:1624-1634`.
- Inline hints: "Please select a type", "Select at least one person", "Will create a copy for each additional person", "Will create copies for each additional person." `[Implemented]` `src/pages/Chores.jsx:1154,1179,1500,1587`.
- No toasts, celebratory effects or reminders `[Implemented]` `src/pages/Chores.jsx:1-1694`.

## 8. AI & automation

- The AI chore/meal generator button sits in this page's toolbar and reloads the page when it creates chores `[Implemented]` `src/pages/Chores.jsx:18,1103`. Its inputs, prompt intent, review step and outcomes are specified in `20-features/chores/ai-generator.md`; the LLM call in `10-architecture/ai-services.md`.
- No automation (workflow) touches chores `[Implemented]` `10-architecture/automations.md`.

## 9. Onboarding content

Dialog title "Welcome to Chores"; subtitle "Here's how to get the most out of this page — it only takes a minute!"; one button "Got it — Don't Remind Me Again" `[Implemented]` `src/components/onboarding/ChoresOnboarding.jsx:42-45,59-61`. Steps verbatim `[Described]` `src/components/onboarding/ChoresOnboarding.jsx:5-31`:

1. **1. Add Your Household Chores** — "Click 'Add Chore' to create tasks for your home — like cleaning, laundry, or yard work. Chores are automatically assigned to you, but you can add household members anytime to share responsibility." (D-553: the add button is an unlabelled "+" and requires choosing an assignee.)
2. **2. Generate Meal Ideas with AI** — "Use the AI Wand button and select 'Meal' as the type. Choose Breakfast, Lunch, Dinner, or Snack — and pick an age group (including ages 3–5 for young children) to get personalized, age-appropriate meal suggestions." (Meal behaviour is specified in `meal-planning.md` and `ai-generator.md`.)
3. **3. Invite Household Members** — "Use the people icon to add household members and reassign chores or meal tasks to them. Optionally organize by room and priority level so everyone knows what's expected."
4. **4. Set Frequencies & Due Dates** — "Configure chores as daily, weekly, biweekly, or monthly. The app tracks when each was last completed so nothing slips through the cracks. Overdue items are highlighted automatically." (D-552, BR-CHORE-16.)
5. **5. Track Completion** — "Mark chores as complete, skip, or pending. Completed chores show their last-done date. Use filters to view by member or status — keeping everyone accountable." (D-554.)

- **Trigger:** shown when the device key `chores_onboarded` is absent, checked synchronously at page load; the header "Guide" button reopens it `[Implemented]` `src/pages/Chores.jsx:32-35,1251-1255`.
- **Dismissal:** the button writes `chores_onboarded = "1"` and closes; closing the dialog any other way hides it for this visit without writing `[Implemented]` `src/components/onboarding/ChoresOnboarding.jsx:34-39`. The page also passes an `onDontRemind` handler that writes the same key; the dialog does not call it `[Partial]` `src/pages/Chores.jsx:1254`.
- **Persistence generation:** first generation, device only (AR-PREF-31; AR-UI-11 in `10-architecture/shared-interactions.md`). Registry: `20-features/onboarding`.

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `chore_custom_rooms` | JSON string[] of rooms the user added or that were seen on chore/library rows | `[]` | saving a chore with a room; every page load copies rooms from data `src/lib/choreRooms.js:70-79`, `src/pages/Chores.jsx:197-204,215,382` | `deleteCustomRoom` removes one entry `src/lib/choreRooms.js:81-90` |
| `chore_deleted_rooms` | JSON string[] of lower-cased rooms the user deleted; suppressed everywhere | `[]` | `deleteCustomRoom` `src/lib/choreRooms.js:16-22,89` | `removeFromDeleted` (defined, no caller in owned files) `src/lib/choreRooms.js:24-28` |
| `last_chore_print_note` | last note typed into the print prompt; pre-fills the prompt | `""` | confirming the print prompt (empty string when blank) `src/pages/Chores.jsx:605` | never |
| `chores_onboarded` | `"1"` once the walkthrough was dismissed | absent | "Got it — Don't Remind Me Again" `src/components/onboarding/ChoresOnboarding.jsx:35` | never |

Registry: `10-architecture/preferences.md` Part D.

## 11. Seed / hardcoded data used

- Default rooms (§4.9) `[Implemented]` `src/lib/choreRooms.js:4`; registry `10-architecture/data-model/seed-data.md` §2.1.
- Frequencies and labels: `once` Once · `daily` Daily · `weekly` Weekly · `biweekly` Bi-Weekly · `monthly` Monthly · `quarterly` Quarterly · `yearly` Yearly · `as_needed` As Needed · `other` Other (group label for unrecognised values) `[Implemented]` `src/pages/Chores.jsx:24,547,944`.
- Synthetic frequency filter values: `weekdays` "Weekdays", `weekends` "Weekends" `[Implemented]` `src/pages/Chores.jsx:549,1372-1373`.
- Duration buckets: `quick` "≤ 15 min", `medium` "16–30 min", `long` "> 30 min" `[Implemented]` `src/pages/Chores.jsx:551-558,1385,1390-1392`.
- Days: Monday…Sunday (stored), Mon…Sun (chip labels, first three letters), two-letter abbreviations on rows `[Implemented]` `src/pages/Chores.jsx:22-23,926,1231`.
- Member colour swatches (meaning: identifies the member): `#10b981` (default), `#3b82f6`, `#f59e0b`, `#ef4444`, `#8b5cf6`, `#ec4899`, `#14b8a6`, `#f97316` `[Implemented]` `src/pages/Chores.jsx:81,1648`.
- Category chips: Cleaning, Organizing, Maintenance, Other `[Implemented]` `src/pages/Chores.jsx:1467`; add-dialog types: Chore, Meal `[Implemented]` `src/pages/Chores.jsx:1143`; registry seed-data §2.2 (D-131).
- Meal-type set used for exclusion: Breakfast, Lunch, Dinner, Snack, Meal `[Implemented]` `src/pages/Chores.jsx:538` (seed-data §2.3).
- Priority enum `low` · `medium` · `high`, default `medium` `[Implemented]` `base44/entities/Chore.jsonc:34-43`; only `medium` is written here (BR-CHORE-18).
- Status pill colours carry meaning only as emphasis of the count (All neutral, Due Today blue, Done green) `[Implemented]` `src/pages/Chores.jsx:1284-1286`.
- Sentinel member name `UNASSIGNED` `[Implemented]` `src/pages/Chores.jsx:186`.
- Print-note placeholder "e.g. Week of June 9 • Great job everyone!" `[Implemented]` `src/pages/Chores.jsx:1607`.

## 12. Print / email formats

Mechanism, tiers and the shared rules are in `10-architecture/export-print-email.md` (Tier C; §3a Chores builders; §4b note prompt; D-312, D-313, D-314). Content as produced by this feature:

- **Print prompt.** "Print chores" opens "Add a Note to Print": label "Custom Note (optional)", a three-row textarea with placeholder "e.g. Week of June 9 • Great job everyone!" pre-filled from `last_chore_print_note`, buttons "Cancel" and "Print" `[Implemented]` `src/pages/Chores.jsx:702-704,1596-1622`.
- **Print content** (new window, then the print dialog) `[Implemented]` `src/pages/Chores.jsx:604-700`: title "Weekly Chore Schedule"; "Generated: {Weekday, Month D, YYYY}"; the trimmed note in italics when non-empty; then, for each household member in list order who has chores in the **currently filtered list** (status pill and all filters applied): a section headed with the member's name containing sub-groups Daily, Weekly, Bi-Weekly, Monthly (in that order; chores of the other four frequencies are not printed) `:670-673`; each row has an empty checkbox, the title, the description if any, and right-aligned room, "{n}min" when > 0, and scheduled days as three-letter names joined by ", " `:675-690`. The note is saved to the device before rendering `:605`.
- **Email** (no prompt) `[Implemented]` `src/pages/Chores.jsx:706-769`: recipient = signed-in user's email (AR-EXPORT-01); subject "Weekly Chore Schedule", or "{member name}'s Chores" when a specific member filter is set `:599-602,765`; body heading "Weekly Chore Schedule" and "Generated:" line; then one section per weekday Monday…Sunday (empty days omitted) listing every **daily** chore under every day and every **weekly** chore under each of its `day_of_week` days (three-letter names are mapped to full names; full names pass through); other frequencies are omitted (D-312) `:722-735`. Each item: checkbox, title, description, then "Person: {assigned_to value as stored}", "Room: {room}", "Time: {n} min" when present `:743-759` (D-560). The builder also carries a "Meal"/"Chef:"/"Type:" variant keyed on a `meals` status value that the pills never produce `[Partial]` `:713,752-753` (D-313). After sending: alert "Sent to your email!" `:768`.
- **`PrintFormatChores` component** `[Implemented]` `src/components/PrintFormatChores.jsx:1-87`: title "Weekly Chore Schedule", "Generated:" line, one section per member in the `users` list with that member's chores, sub-grouped Daily / Weekly / Bi-Weekly / Monthly; rows with a checkbox, title, description, room, "{n}min", and per-day mini checkboxes labelled with the first two letters of each scheduled day; print stylesheet hides `.no-print`. The component is imported by the page but no render path uses it `[Partial]` `src/pages/Chores.jsx:20` (D-314).
- Both header buttons carry `no-print` `[Implemented]` `src/pages/Chores.jsx:1265` (AR-EXPORT-05).

## 13. Acceptance criteria

- **AC-CHORE-01** Given no household members exist, when the user presses "+", then the alert "Please add a household member first before creating chores." appears and no dialog opens. (refs BR-CHORE-09)
- **AC-CHORE-02** Given the add dialog, when Type is not chosen or no member is checked or the title is empty, then "Create Chore" does nothing and the dialog stays open with the hints "Please select a type" / "Select at least one person" visible as applicable. (refs BR-CHORE-08, BR-CHORE-09)
- **AC-CHORE-03** Given three members checked, when the user creates a chore, then three `Chore` rows exist with identical fields except `assigned_to`, each with `pending` status. (refs BR-CHORE-10)
- **AC-CHORE-04** Given a member already has a chore with the same title (any case), frequency, room (any case), priority and type, when the user creates that chore again for the same member, then no new row is written for that member. (refs BR-CHORE-10)
- **AC-CHORE-05** Given a room typed as "laundry ROOM", when the chore is saved, then the stored room is "Laundry Room" and it is offered in the room list from then on. (refs BR-CHORE-21)
- **AC-CHORE-06** Given a weekly chore whose days include today's weekday name, when the page opens with no query, then the chore appears under "Due Today". (refs BR-CHORE-02, BR-CHORE-03)
- **AC-CHORE-07** Given the page is opened at `/chores?filter=all`, then the "All" pill is active and pending chores of every frequency are listed. (refs BR-CHORE-03)
- **AC-CHORE-08** Given a weekly pending chore, when its checkbox is ticked, then its status is `completed`, `last_completed_date` is today, `due_date` is seven days from now, and the row shows "✓ {date}" struck through. (refs BR-CHORE-13)
- **AC-CHORE-09** Given an `as_needed` chore, when completed, then `due_date` is unchanged. (refs BR-CHORE-13)
- **AC-CHORE-10** Given a completed chore, when its checkbox is ticked again, then status is `pending` and `last_completed_date` is null. (refs BR-CHORE-14)
- **AC-CHORE-11** Given the page stays open across local midnight, when midnight passes, then every completed chore is pending again and the list reloads. (refs BR-CHORE-15)
- **AC-CHORE-12** Given "Due Today" is active, when the user picks any room or "All Locations", then the "All" pill becomes active. (refs BR-CHORE-05)
- **AC-CHORE-13** Given the user first picks a room and then a member, then the top-level groups are rooms, each containing frequency sub-groups, and chores with the same title, room and frequency appear as one row listing both assignees without a room label. (refs BR-CHORE-19, BR-CHORE-20)
- **AC-CHORE-14** Given the user first picks a member and then a room, then the top-level groups are members. (refs BR-CHORE-19)
- **AC-CHORE-15** Given the frequency filter "Weekends", then only chores whose days include Saturday or Sunday are listed. (refs §4.5)
- **AC-CHORE-16** Given the duration filter "16–30 min", then chores with `time_estimate` 16 through 30 are listed and chores with no estimate are not. (refs §4.5)
- **AC-CHORE-17** Given a merged row in the room view, when the user deletes it and confirms, then every underlying chore is deleted. (refs BR-CHORE-20)
- **AC-CHORE-18** Given the edit dialog with the current assignee plus one more member checked, when saved, then the original row keeps its id with the first checked member and a new pending row exists for the second member. (refs BR-CHORE-11)
- **AC-CHORE-19** Given bulk mode with two chores selected, when the user reassigns to members A and B, then each chore's `assigned_to` becomes A and a pending copy exists for B (unless B already has an equivalent chore); bulk mode exits. (refs BR-CHORE-11, §4.8)
- **AC-CHORE-20** Given bulk mode with chores selected, when the user presses Delete and confirms, then all selected chores are deleted and bulk mode exits. (refs §4.8)
- **AC-CHORE-21** Given "Save to library for future use" is ticked with frequency "Quarterly", when the chore is created, then a library row with frequency `weekly` exists (unless an equivalent library row already exists). (refs BR-CHORE-12)
- **AC-CHORE-22** Given the user prints with note "Week of June 9", then the print window shows the note under the "Generated:" line, groups by member then Daily/Weekly/Bi-Weekly/Monthly, and the note is pre-filled the next time the prompt opens. (refs §12)
- **AC-CHORE-23** Given a specific member filter, when the user emails, then the message goes to the signed-in user's address with subject "{member}'s Chores" and the alert "Sent to your email!" appears. (refs §12)
- **AC-CHORE-24** Given a member named `UNASSIGNED` exists, then it does not appear in the members list, assignee lists, member filter or reassign list. (refs BR-CHORE-22)
- **AC-CHORE-25** Given a member is deleted, then their chores remain and are grouped under "Unassigned" in the member view. (refs BR-CHORE-07)
- **AC-CHORE-26** Given the device has no `chores_onboarded` key, when the page opens, then "Welcome to Chores" shows; after "Got it — Don't Remind Me Again" it never shows again on that device, but the "Guide" header button reopens it. (refs §9)
- **AC-CHORE-27** Given `enable_chores` is off, then "Chores" is absent from the sidebar and from swipe navigation while `/chores` still renders when visited directly. (refs §0)
- **AC-CHORE-28** Given a chore with type "Menu / Meal", then it never appears on the Chores tab regardless of filters. (refs BR-CHORE-01, BR-CHORE-24)

## 14. Discrepancies & open questions

Cross-references already logged elsewhere: D-001, D-003, D-011 (`10-architecture/data-model/chores.md`); D-100, D-103, D-104, D-107, D-137 (`10-architecture/time-and-date-semantics.md`); D-124, D-131 (`10-architecture/data-model/seed-data.md`); D-312, D-313, D-314 (`10-architecture/export-print-email.md`).

- **D-550** The manual says household members are managed via the "Members" tab (`src/pages/UserManual.jsx:192`); the page has two tabs, Chores and Menu, and manages members in a dialog opened from an icon button (`src/pages/Chores.jsx:1105-1108,1257-1261`).
- **D-551** The manual lists priority among the fields the user gives a chore (`src/pages/UserManual.jsx:191`); neither the add nor the edit dialog has a priority control and the form always writes `medium` (`src/pages/Chores.jsx:79,224,392`).
- **D-552** The manual and walkthrough name four frequencies, daily / weekly / biweekly / monthly (`src/pages/UserManual.jsx:191`, `src/components/onboarding/ChoresOnboarding.jsx:24`); the dialogs offer eight (`src/pages/Chores.jsx:1186-1193`); the library entity allows four (`base44/entities/ChoreLibrary.jsonc:10-18`).
- **D-553** Walkthrough step 1 says "Click 'Add Chore'" and "Chores are automatically assigned to you" (`src/components/onboarding/ChoresOnboarding.jsx:9`); the button is an unlabelled "+" (`src/pages/Chores.jsx:1130-1135`), creation requires at least one checked member (`:210-211`) and the code comment reads "No auto-assign needed — user picks from checkboxes" (`:80`).
- **D-554** Walkthrough step 5 says "Mark chores as complete, skip, or pending" (`src/components/onboarding/ChoresOnboarding.jsx:29`); the entity declares `skipped` (`base44/entities/Chore.jsonc:45-53`) and no control on the page writes it (`src/pages/Chores.jsx:324-338`).
- **D-555** The manual says "Access saved chore templates from the Library tab" (`src/pages/UserManual.jsx:214`); the library is a dialog opened from an icon button titled "Chore Library" (`src/components/ChoreLibraryDialog.jsx:194-197`).
- **D-556** Three duplicate guards for "this member already has this chore": create compares assignee, title (ci), frequency, room (ci), priority, trimmed type (`src/pages/Chores.jsx:231-238`); edit copies compare assignee, title (ci), frequency only (`:414-419`); bulk-reassign copies compare assignee, title (ci), frequency, room (exact), priority, type (exact) (`:513-520`).
- **D-557** For a merged row, the row's own bulk checkbox selects only the first underlying id (`src/pages/Chores.jsx:895,904-906`) while the enclosing group checkbox selects every underlying id (`:956,1047,1065,1083`) and the row's delete removes every underlying id (`:903`).
- **D-558** The add dialog writes `chore_type` = `Chore` or `Meal` under the label "Type" (`src/pages/Chores.jsx:1141-1151`); the edit dialog presents the same field as "Category" with chips Cleaning / Organizing / Maintenance / Other plus values seen in data, so "Chore" surfaces as a category chip once such a chore exists (`:1465-1483`, `:546`).
- **D-559** The save-to-library duplicate check compares the room as typed in the form (`src/pages/Chores.jsx:250,433`) while the library row is written with the Title-Cased room (`:261,444`).
- **D-560** The printed sheet shows the assignee's member name (`src/pages/Chores.jsx:666-669`); the email's "Person:" line shows the stored `assigned_to` value (`:752`).
- **D-561** At first load the query is read as `filter=all` → All, anything else → Due Today (`src/pages/Chores.jsx:58-61`); on later navigation only `filter=due` is honoured (`:63-66`).
- **Q-550** Blocks §4.1. Is a household member named `UNASSIGNED` expected to exist? The page filters that name from every list (`src/pages/Chores.jsx:186`) but no owned file creates it; the generator's unassigned choice writes `assigned_to: ""` (`src/components/ChoreGenerator.jsx:164`, per `ai-generator.md`).
- **Q-551** Blocks §4.5, §4.6. Is a category filter intended? The category grouping branch and the `filterCategory` state exist (`src/pages/Chores.jsx:44,1072-1088`) with no control that sets a value; only "Clear all" touches it (`:1398`).
- **Q-552** Blocks §4.3. The edit dialog's Room input references a suggestion list `room-suggestions` (`src/pages/Chores.jsx:1523`) that is not rendered; is the room list meant to be offered as suggestions there as it is in the add dialog (`:1201-1213`)?
- **Q-553** Blocks §5 BR-CHORE-01. Chores with an empty `assigned_to` (as the generator can create) never appear on the Chores tab (`src/pages/Chores.jsx:577`); is there an intended surface for them?
- **Q-554** Blocks §9. The page passes an `onDontRemind` handler to the walkthrough (`src/pages/Chores.jsx:1254`) that the dialog never invokes (`src/components/onboarding/ChoresOnboarding.jsx:33-37`); is a second dismissal path intended?
