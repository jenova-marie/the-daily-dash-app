# Chores — Chore Library

**Feature code:** `CHORE` · **Level:** 2 (sub-spec of `spec.md`) · **Status:** draft

**Tag summary:** Implemented 64 · Described 4 · Partial 4

**Sources owned:** `src/components/ChoreLibraryDialog.jsx`; the save-to-library paths of `src/pages/Chores.jsx:243-265,425-448`
**Sources referenced (owned elsewhere):** `src/components/ChoreGenerator.jsx` (library writes from the generator) → `20-features/chores/ai-generator.md`; `src/lib/choreRooms.js` → `spec.md` §4.9; `base44/entities/ChoreLibrary.jsonc`, `Chore.jsonc`, `ChoreUser.jsonc` → `10-architecture/data-model/chores.md`; `base44/functions/clearChoreLibraryAssignments` → `10-architecture/admin-operations.md`

**Permissions:** per-user data; admin-only operations: the library clean-up function (owned elsewhere)

## 0. Entry points & navigation

- Opened from the Chores page toolbar by an icon button titled "Chore Library"; the dialog is titled "Chore Library" `[Implemented]` `src/components/ChoreLibraryDialog.jsx:194-200`, `src/pages/Chores.jsx:1104`.
- No route or query parameter; it is a modal on `/chores` `[Implemented]` `src/components/ChoreLibraryDialog.jsx:193`.
- The dialog receives the page's full member list (including a member named `UNASSIGNED`, if any) and a callback that reloads the page after assigning `[Implemented]` `src/pages/Chores.jsx:1104`, `src/components/ChoreLibraryDialog.jsx:15,179`.

## 1. Purpose & user benefit

The chore library is the set of reusable, unassigned chore templates. From the dialog the account owner picks templates (and any of their own existing chores), chooses who gets them, and creates real chores for each person in one step, so a household's chore list can be rebuilt or extended without retyping.

User Manual, "Chore Library" block, verbatim `[Described]` `src/pages/UserManual.jsx:212-217`:

> **Chore Library**
> - Access saved chore templates from the **Library tab**.
> - **Add chores from the library** by selecting them and assigning to household members quickly.
> - Save frequently-used chores to the library when generating with AI for faster setup in the future.

(The "Library tab" wording is logged as D-555 in `spec.md`.) The manual's generator block also says the user can "optionally save new chores to your Chore Library for future reuse" `[Described]` `src/pages/UserManual.jsx:208`.

## 2. Concepts & vocabulary

- **chore library** (glossary) — `ChoreLibrary` rows: title, description, frequency (four values), time estimate, priority, room, `chore_type`. No assignee.
- **library entry** (feature-local) — one row shown in the dialog list: either a `ChoreLibrary` row or a "My Chore" entry (below).
- **"My Chore" entry** (feature-local) — one of the account owner's own `Chore` rows shown in the list as a template because no library row has the same title; tagged "My Chore".
- **default assignees** (feature-local) — the members chosen under "Default: Assign To", applied to every selected entry unless overridden.
- **override** (feature-local) — a per-entry assignee set and/or frequency that replaces the defaults for that entry only.
- **household member**, **room**, **meal**, **frequency** — as in the glossary.

## 3. User stories

- **US-CHORE-30** As the account owner, I want to browse my saved chore templates together with chores I already have so that I can reuse either. `[Implemented]` `src/components/ChoreLibraryDialog.jsx:49-84`
- **US-CHORE-31** As the account owner, I want to search and filter the library by title, room and type so that I can find the right template quickly. `[Implemented]` `src/components/ChoreLibraryDialog.jsx:90-99,207-250`
- **US-CHORE-32** As the account owner, I want to choose default assignees once and override them (and the frequency) per entry so that a batch of chores lands with the right people. `[Implemented]` `src/components/ChoreLibraryDialog.jsx:108-146,252-272,384-434`
- **US-CHORE-33** As the account owner, I want to see who already has each chore so that I do not assign it twice. `[Implemented]` `src/components/ChoreLibraryDialog.jsx:57-66,302-310,338-355`
- **US-CHORE-34** As the account owner, I want to assign many templates to many people in one action. `[Implemented]` `src/components/ChoreLibraryDialog.jsx:148-180,444-451`
- **US-CHORE-35** As the account owner, I want to remove a template from the library. `[Implemented]` `src/components/ChoreLibraryDialog.jsx:182-186,378-380`
- **US-CHORE-36** As the account owner, I want to save a chore I am adding or editing into the library. `[Implemented]` `src/pages/Chores.jsx:243-265,425-448`

## 4. Capabilities & interactions

### 4.1 Loading and merging

- On open, the dialog shows a spinner while it reads the 100 most recently updated `ChoreLibrary` rows and the 500 most recently created `Chore` rows `[Implemented]` `src/components/ChoreLibraryDialog.jsx:38-43,49-55,202-203`.
- **Existing assignments.** From the chore rows it builds a map of lower-cased title → list of member names currently assigned (members resolved by id; unknown ids ignored) `[Implemented]` `src/components/ChoreLibraryDialog.jsx:57-66`.
- **Merge.** Chore rows whose lower-cased title does not match any library row and has not been seen yet are appended once each as "My Chore" entries; library rows come first `[Implemented]` `src/components/ChoreLibraryDialog.jsx:68-80`. A "My Chore" entry carries all the fields of the chore it came from, including `assigned_to` and `day_of_week` `[Implemented]` `src/components/ChoreLibraryDialog.jsx:78`.
- The list is re-filtered whenever entries or any filter change `[Implemented]` `src/components/ChoreLibraryDialog.jsx:45-47`.

### 4.2 Filters

| Filter | Control | Rule | Citation |
|---|---|---|---|
| Search | text, placeholder "Search chores..." | title contains the query, case-insensitive | `:97,209-210` |
| Location | select, placeholder "All locations"; options "All Locations" then the merged room list built from the entries' rooms (see `spec.md` §4.9); hidden while Type is "Meals" | room equals the choice, trimmed, case-insensitive | `:36,92,212-223` |
| Type | select, placeholder "All types"; options "All Types", "Chores", "Meals" | "Meals": `chore_type` equals `Meal` exactly; "Chores": `chore_type` is not `Meal` | `:93-94,224-234` (D-563) |
| Meal Type | select shown only while Type is "Meals", placeholder "All meals"; options "All Meals", Breakfast, Lunch, Dinner, Snack | writes the same room filter as Location, so it matches the entry's room (meal slot) | `:92,235-249` |
| Age | no control | while Type is "Meals", the description must contain the age text (the generator writes "Age Group: <group>" into meal descriptions, see `ai-generator.md`) | `:33,95` `[Partial]` (Q-555) |
| Assignee | no control | while Type is not "Meals", the entry's `assigned_to` must equal the chosen member id (only "My Chore" entries carry one) | `:32,96` `[Partial]` (Q-555) |

- Choosing an "All …" option clears that filter `[Implemented]` `src/components/ChoreLibraryDialog.jsx:218,229,241`.
- A constant list of seven chore types (Cleaning, Organizing, Laundry, Cooking/Dishes, Yard Work, Maintenance, Meal) is declared and not used by any control `[Partial]` `src/components/ChoreLibraryDialog.jsx:13` (Q-556; seed-data D-131).

### 4.3 Default assignees

- Section "Default: Assign To" with one toggle chip per member passed in (no `UNASSIGNED` filtering here) and the line "You can override per-chore below". Toggling adds or removes the member from the default set `[Implemented]` `src/components/ChoreLibraryDialog.jsx:108-115,252-272`.

### 4.4 The entry list

- Heading "Available Chores ({n})" with a "Select All" / "Deselect All" link (label flips when every visible entry is selected); it selects or clears exactly the visible entries `[Implemented]` `src/components/ChoreLibraryDialog.jsx:276-293`.
- Empty state: "No chores found" `[Implemented]` `src/components/ChoreLibraryDialog.jsx:296`.
- **Each entry shows** `[Implemented]` `src/components/ChoreLibraryDialog.jsx:312-382`: a selection checkbox; the title; the tag "My Chore" when it came from the user's own chores; the tag "Already assigned" when BR-CHORE-34 applies; a meta line with room, "⏱ {n}min" when > 0, "📅 {frequency}" (raw value), and "• {chore_type}" when set; an "Assigned:" line with one chip per member who already has a chore of that title, coloured with that member's colour (or the theme primary when the member has no colour); when selected, an "→ Assigning to:" line listing the effective assignees (amber when overridden, primary otherwise) or "No user selected"; an expand button titled "Override users for this chore"; and a delete button.
- **Selecting.** The checkbox toggles the entry; it is disabled and the entry dimmed while "Already assigned" applies `[Implemented]` `src/components/ChoreLibraryDialog.jsx:101-106,313-320`.
- **Override panel** (expanded per entry) `[Implemented]` `src/components/ChoreLibraryDialog.jsx:117-146,384-434`: heading "Override users for this chore"; a "Reset to default" link when an override exists; one chip per member (amber when in the effective set); a "Frequency" select offering all eight values (Once, Daily, Weekly, Bi-Weekly, Monthly, Quarterly, Yearly, As Needed) defaulting to the entry's own frequency. Toggling a member starts from the current defaults, stores the result as that entry's override, and **auto-selects the entry**. "Reset to default" removes the override so the entry follows the defaults again.
- **Delete.** The delete button asks the browser confirm "Delete this chore from the library?" and, on OK, deletes the `ChoreLibrary` row with that entry's id and removes the entry from the list without reloading `[Implemented]` `src/components/ChoreLibraryDialog.jsx:182-186,378-380`. The control is rendered on every entry, including "My Chore" entries, for which the id is a `Chore` id `[Implemented]` `src/components/ChoreLibraryDialog.jsx:378` (D-562, Q-557).

### 4.5 Assign

- Footer buttons "Cancel" and "Assign {s} Chore(s) ({a} assignment(s))", where *s* is the number of selected entry ids and *a* is the sum over selected ids of each one's effective assignee count; the button is disabled when *s* or *a* is 0 `[Implemented]` `src/components/ChoreLibraryDialog.jsx:188-190,442-451`.
- **What is created.** For each selected entry that is in the **currently visible** list, and for each effective assignee, one `Chore` row: title, description, `assigned_to` = member id, frequency = the entry's override or its own frequency, room (or `""`), priority (or `medium`), `chore_type` (or `""`), `status: pending`, `time_estimate` (or 0), and `day_of_week` copied when the entry has a non-empty array (only "My Chore" entries can) `[Implemented]` `src/components/ChoreLibraryDialog.jsx:148-171`. Entries with no effective assignee are skipped `[Implemented]` `src/components/ChoreLibraryDialog.jsx:153`. No duplicate check is made against existing chores at this point (BR-CHORE-35).
- Afterwards the dialog closes and resets selection, defaults, overrides, expansion and all filters; the page reloads `[Implemented]` `src/components/ChoreLibraryDialog.jsx:172-179`.

### 4.6 Saving to the library from the add / edit dialogs

- Both dialogs on the Chores page carry the checkbox "Save to library for future use", off by default and reset after each save; when ticked, one library row is written after the chore write (rule BR-CHORE-12 in `spec.md`) `[Implemented]` `src/pages/Chores.jsx:114-115,243-267,425-448,1238-1241,1543-1546`.
- The generator's "Save to Library" path is specified in `ai-generator.md`.

### 4a. Keyboard & pointer

- All interactions are clicks/taps on chips, checkboxes, selects and buttons; the search box filters as the user types `[Implemented]` `src/components/ChoreLibraryDialog.jsx:210`. No double-tap, long-press, swipe or drag `[Implemented]` `src/components/ChoreLibraryDialog.jsx:192-457`.

### 4b. View state & persistence

| Control | Values | Default | Scope |
|---|---|---|---|
| Search / Location / Type / Meal Type | strings | `""` | memory, reset after Assign, kept across close/reopen otherwise `:20-22,178` |
| Selected entries | set of ids | empty | memory, reset after Assign `:23,173` |
| Default assignees | set of member ids | empty | memory, reset after Assign `:25,174` |
| Per-entry assignee overrides | map id → set | `{}` | memory, reset after Assign `:27,175` |
| Per-entry frequency overrides | map id → frequency | `{}` | memory, reset after Assign `:29,176` |
| Expanded entry | one id or none | none | memory `:31,177` |

Nothing in this dialog is stored on the device or the account `[Implemented]` `src/components/ChoreLibraryDialog.jsx:1-458`.

### 4c. Empty & fallback states

- "No chores found" when the filtered list is empty `[Implemented]` `src/components/ChoreLibraryDialog.jsx:296`.
- "No user selected" on a selected entry with no effective assignee `[Implemented]` `src/components/ChoreLibraryDialog.jsx:364`.
- Assign button disabled with nothing to do `[Implemented]` `src/components/ChoreLibraryDialog.jsx:446`.

## 5. Business rules

- **BR-CHORE-30 (Library rows are unassigned templates with four frequencies).** `ChoreLibrary` requires `title` and `frequency`, where frequency is one of `daily`, `weekly`, `biweekly`, `monthly`; there is no assignee field `[Implemented]` `base44/entities/ChoreLibrary.jsonc:1-57`. Writers coerce any other frequency to `weekly` `[Implemented]` `src/pages/Chores.jsx:244-246,427-429` (generator: `ai-generator.md`).
- **BR-CHORE-31 (Library writes are duplicate-checked).** A library row is only written when none of the 200 most recent library rows matches on title (case-insensitive), coerced frequency, room, priority and `chore_type` `[Implemented]` `src/pages/Chores.jsx:245-254,428-437` (D-559 in `spec.md` on the room value compared).
- **BR-CHORE-32 (My Chore merge).** The user's own chores appear as entries once per distinct title when no library row shares that title (case-insensitive), tagged "My Chore" `[Implemented]` `src/components/ChoreLibraryDialog.jsx:68-80`.
- **BR-CHORE-33 (Effective assignees).** An entry's assignees are its override set if one exists, else the default set `[Implemented]` `src/components/ChoreLibraryDialog.jsx:117-120`.
- **BR-CHORE-34 ("Already assigned").** An entry is marked "Already assigned", dimmed and its checkbox disabled only when it is selected, it has at least one effective assignee, at least one member already has a chore with that title, and **every** effective assignee is among those members. Assigning to a mix of members who have it and members who do not is allowed `[Implemented]` `src/components/ChoreLibraryDialog.jsx:302-310,313-320`.
- **BR-CHORE-35 (Assign creates without a duplicate guard).** Assign writes one chore per entry × assignee with no comparison against existing chores; the only protection is BR-CHORE-34's selection lock `[Implemented]` `src/components/ChoreLibraryDialog.jsx:148-171`. The Chores page's own create path does guard duplicates (`spec.md` BR-CHORE-10) (D-564).
- **BR-CHORE-36 (Assigned frequency may be any of eight).** The per-entry frequency override offers all eight chore frequencies, so a chore assigned from a four-frequency library row can carry `once`, `quarterly`, `yearly` or `as_needed` `[Implemented]` `src/components/ChoreLibraryDialog.jsx:159,421-430`.
- **BR-CHORE-37 (Visible-only assignment, all-selected count).** Assign acts on selected entries that are in the current filtered list; the button label counts every selected id, including entries filtered out after selection `[Implemented]` `src/components/ChoreLibraryDialog.jsx:150,188-190,450` (D-565).
- **BR-CHORE-38 (Meal detection in the library).** The Type filter treats only `chore_type === "Meal"` as a meal, while the Chores page treats five values as meals `[Implemented]` `src/components/ChoreLibraryDialog.jsx:93-94`, `src/pages/Chores.jsx:538-539` (D-563).
- **BR-CHORE-39 (Day-of-week carry).** `day_of_week` is copied to the new chores only when the entry has a non-empty array; library rows have no such field, so only "My Chore" entries carry days `[Implemented]` `src/components/ChoreLibraryDialog.jsx:166-168`, `base44/entities/ChoreLibrary.jsonc:5-41`.
- **BR-CHORE-40 (Manual).** "Add chores from the library by selecting them and assigning to household members quickly." `[Described]` `src/pages/UserManual.jsx:215`; matches §4.5.
- **BR-CHORE-41 (Manual).** "Save frequently-used chores to the library when generating with AI for faster setup in the future." `[Described]` `src/pages/UserManual.jsx:216`; the generator path is in `ai-generator.md`; the add/edit dialogs offer the same opt-in (§4.6).

### 5a. State & lifecycle

`ChoreLibrary` row: created (add/edit opt-in, generator) → deleted (dialog trash button) `[Implemented]` `src/pages/Chores.jsx:255,438`, `src/components/ChoreLibraryDialog.jsx:184`. No status field; updated only by the admin clean-up (`10-architecture/admin-operations.md`).

Dialog session: closed → open (loads) → filtering/selecting/overriding → Assign (creates, resets, closes) or Cancel (closes, keeps selection and filters in memory) `[Implemented]` `src/components/ChoreLibraryDialog.jsx:38-43,148-180,443`.

### 5b. Time & date semantics

- None. New chores are written without `due_date` or `last_completed_date`; the assigned chore becomes due by the Chores page rule (`spec.md` BR-CHORE-02) `[Implemented]` `src/components/ChoreLibraryDialog.jsx:155-165`.

## 6. Data

- Reads: `ChoreLibrary.list("-updated_date", 100)`, `Chore.list("-created_date", 500)` on each open `[Implemented]` `src/components/ChoreLibraryDialog.jsx:52-55`; member rows arrive from the page (`ChoreUser.list()`, `src/pages/Chores.jsx:191`).
- Writes: `Chore.create` (one per entry × assignee) `[Implemented]` `src/components/ChoreLibraryDialog.jsx:169`; `ChoreLibrary.delete` `[Implemented]` `src/components/ChoreLibraryDialog.jsx:184`; `ChoreLibrary.create` from the Chores page dialogs `[Implemented]` `src/pages/Chores.jsx:255,438`.
- Fields: see `10-architecture/data-model/chores.md` (`E-ChoreLibrary`, `E-Chore`).
- Display order: library rows newest-updated first, then "My Chore" entries newest-created first `[Implemented]` `src/components/ChoreLibraryDialog.jsx:52-54,80`.

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| host | Chores page | toolbar button; page reload after Assign | `src/pages/Chores.jsx:1104` |
| inbound | Chores add/edit dialogs | opt-in library write | `src/pages/Chores.jsx:243-265,425-448` |
| inbound | AI generator | library writes ("Save to Library"), meal descriptions carry "Age Group:" for the age filter | `ai-generator.md` |
| shared | Rooms | Location options from `buildRoomOptions` over entry rooms (deleted rooms suppressed) | `src/components/ChoreLibraryDialog.jsx:11,36`; `spec.md` §4.9 |
| shared | Meal planning | meal templates (`chore_type` `Meal`, room = meal slot) assign as meals | `src/components/ChoreLibraryDialog.jsx:93,238-247`; `meal-planning.md` |
| admin | Library clean-up function | sets `assigned_to: null` on library rows | `10-architecture/admin-operations.md` |

### 7a. Feedback & notifications

- Browser confirm "Delete this chore from the library?" `[Implemented]` `src/components/ChoreLibraryDialog.jsx:183`.
- Loading spinner while reading `[Implemented]` `src/components/ChoreLibraryDialog.jsx:202-203`.
- No toast or alert after Assign; the dialog simply closes and the page reloads `[Implemented]` `src/components/ChoreLibraryDialog.jsx:172-179`.

## 8. AI & automation

- None in this dialog. Library rows produced by the generator are specified in `ai-generator.md` `[Implemented]` `src/components/ChoreLibraryDialog.jsx:1-458`.

## 9. Onboarding content

- None specific to the library. The Chores walkthrough (`spec.md` §9) does not mention it `[Implemented]` `src/components/onboarding/ChoresOnboarding.jsx:5-31`.

## 10. Device-local preferences

None observed. (Room lists read the keys registered in `spec.md` §10.)

## 11. Seed / hardcoded data used

- Type filter options: "All Types", "Chores", "Meals" `[Implemented]` `src/components/ChoreLibraryDialog.jsx:229-231`.
- Meal Type options: Breakfast, Lunch, Dinner, Snack `[Implemented]` `src/components/ChoreLibraryDialog.jsx:242-245`.
- Override frequency options: the eight chore frequencies with the same labels as the Chores page `[Implemented]` `src/components/ChoreLibraryDialog.jsx:422-429`.
- Unused type list: Cleaning, Organizing, Laundry, Cooking/Dishes, Yard Work, Maintenance, Meal `[Partial]` `src/components/ChoreLibraryDialog.jsx:13` (seed-data §2.2, D-131).
- Library frequency enum: daily, weekly, biweekly, monthly `[Implemented]` `base44/entities/ChoreLibrary.jsonc:10-18`.
- Defaults applied on assign: priority `medium`, `time_estimate` 0, room and type `""` `[Implemented]` `src/components/ChoreLibraryDialog.jsx:160-164`.

## 12. Print / email formats

None observed.

## 13. Acceptance criteria

- **AC-CHORE-30** Given a chore titled "Vacuum" exists and no library row has that title, when the library opens, then "Vacuum" is listed with the "My Chore" tag. (refs BR-CHORE-32)
- **AC-CHORE-31** Given Type "Meals", then the Location filter is hidden, the Meal Type filter appears, and only entries whose `chore_type` is exactly `Meal` are listed. (refs §4.2, BR-CHORE-38)
- **AC-CHORE-32** Given default assignees A and B, when the user selects two entries and presses Assign, then four pending chores are created and the button read "Assign 2 Chores (4 assignments)" beforehand. (refs BR-CHORE-33, §4.5)
- **AC-CHORE-33** Given defaults A and B, when the user toggles B off in one entry's override panel, then that entry becomes selected, shows "→ Assigning to: A" in amber, and only A receives it on Assign; "Reset to default" restores A and B. (refs BR-CHORE-33)
- **AC-CHORE-34** Given A already has "Vacuum" and the effective assignees are A only, when the entry is selected, then it shows "Already assigned", is dimmed, and its checkbox is disabled. (refs BR-CHORE-34)
- **AC-CHORE-35** Given A already has "Vacuum" and the effective assignees are A and B, then the entry is selectable and Assign creates a second "Vacuum" for A as well as one for B. (refs BR-CHORE-34, BR-CHORE-35)
- **AC-CHORE-36** Given an entry's frequency override is "Quarterly", when assigned, then the new chore's frequency is `quarterly`. (refs BR-CHORE-36)
- **AC-CHORE-37** Given the user selects entries and then types a search that hides some of them, when Assign is pressed, then only the visible selected entries are created although the label counted all of them. (refs BR-CHORE-37)
- **AC-CHORE-38** Given the delete button on a library entry, when the user confirms "Delete this chore from the library?", then the row disappears from the list and from `ChoreLibrary`. (refs §4.4)
- **AC-CHORE-39** Given the add dialog with "Save to library for future use" ticked and frequency "Yearly", when created, then a library row with frequency `weekly` exists unless an equivalent one already does. (refs BR-CHORE-30, BR-CHORE-31)
- **AC-CHORE-40** Given Assign completes, then the dialog closes with all filters, selections, defaults and overrides cleared, and the Chores page shows the new chores. (refs §4.5)

## 14. Discrepancies & open questions

- **D-562** The merge tags the user's own chores "so we don't show delete" (code comment, `src/components/ChoreLibraryDialog.jsx:78`); the delete button is rendered on every entry regardless of the tag and issues a `ChoreLibrary` delete with the entry's id (`:378-380,182-186`).
- **D-563** Meal detection: the library Type filter uses `chore_type === "Meal"` (`src/components/ChoreLibraryDialog.jsx:93-94`); the Chores page uses the five-value set Breakfast/Lunch/Dinner/Snack/Meal (`src/pages/Chores.jsx:538-539`). (Related: seed-data D-124.)
- **D-564** Creating chores from the library performs no duplicate check against existing chores (`src/components/ChoreLibraryDialog.jsx:148-171`); creating from the add dialog skips members who already have an equivalent chore (`src/pages/Chores.jsx:230-242`).
- **D-565** The Assign button label counts every selected entry id (`src/components/ChoreLibraryDialog.jsx:188-190,450`); the assignment loop processes only selected entries present in the filtered list (`:150`).
- **Q-555** Blocks §4.2. The age and assignee filters exist as state and rules (`src/components/ChoreLibraryDialog.jsx:32-33,95-96`) with no control; are they intended to be exposed, and with which options?
- **Q-556** Blocks §4.2, §11. Is the declared seven-value chore-type list (`src/components/ChoreLibraryDialog.jsx:13`) intended as a Type filter or as the vocabulary for `chore_type`?
- **Q-557** Blocks §4.4. What is the intended effect of deleting a "My Chore" entry: removing the user's chore, hiding it from the library view, or nothing? Today it sends a library delete for a `Chore` id (`src/components/ChoreLibraryDialog.jsx:184,378`).
