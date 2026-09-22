# AI Chore & Meal Generator — Feature Spec

**Feature code:** `MEAL` (shared with meal planning; generator IDs use `MEAL-G`) · **Level:** 2 (sub-spec of `20-features/chores/spec.md`) · **Status:** draft

**Tag summary:** Implemented 74 · Described 2 · Partial 0

**Sources owned:** `src/components/ChoreGenerator.jsx`; `base44/functions/generateChores/entry.ts` as the user-facing contract (the LLM mechanism is owned by `10-architecture/ai-services.md` §2)
**Sources referenced (owned elsewhere):** `src/pages/Chores.jsx:1103` (placement) → `20-features/chores/spec.md` · `src/lib/choreRooms.js` (room list, custom room storage) → `20-features/chores/spec.md` · `base44/entities/Chore.jsonc`, `ChoreLibrary.jsonc`, `ChoreUser.jsonc` → `10-architecture/data-model/chores.md` · `src/pages/UserManual.jsx:199-210` → `20-features/user-manual`

**Permissions:** per-user data; the backend function requires a signed-in user `[Implemented]` `base44/functions/generateChores/entry.ts:5-10`; admin-only operations: none

## 0. Entry points & navigation

- Opened from the Chores page header action row by an icon button (wand) titled "AI Generator"; the dialog is titled "Generate Chores with AI" `[Implemented]` `src/pages/Chores.jsx:1103`, `src/components/ChoreGenerator.jsx:230-236`. The button is present on both the Chores and Menu tabs because it sits above the tabs `[Implemented]` `src/pages/Chores.jsx:1100-1104,1257`.
- Route / sidebar / swipe position: those of the Chores page. Query parameters: none. Feature-toggle gating: that of the Chores page.
- Closing the dialog by any means resets every input and the review state `[Implemented]` `src/components/ChoreGenerator.jsx:210-229`.

## 1. Purpose & user benefit

Lets the account owner ask for a batch of age-appropriate chore ideas for a room, or meal ideas for a meal slot, review them, decide who does each one and how often, and add them as chores (or meals) and optionally to the chore library, without typing them out.

User Manual `[Described]` `src/pages/UserManual.jsx:199-210`:

> **AI Chore Generator**
> - Click the **"Generate with AI"** button to create chores automatically based on your household.
> - Select a **room** (Kitchen, Bathroom, Bedroom, Living Room, Outdoor, or General).
> - Choose an **age group** (Adults, Teens, Older Children, Younger Children, or Mixed) to generate age-appropriate tasks.
> - Select a **chore type** from predefined options (Cleaning, Organizing, Maintenance) or choose "Other" to specify a custom type.
> - When "Other" is selected, enter a custom chore type (e.g., "Yard Work", "Pet Care", etc.).
> - Set the **quantity** of chores to generate (default: 5).
> - Review AI-generated suggestions, select which ones you want to assign, choose household members to assign them to, and optionally save new chores to your Chore Library for future reuse.

The manual's button name, room list, and age-group names differ from the dialog (D-605). Quantity default 5, the "Other" custom type, and the review/assign/save flow match `[Implemented]` `src/components/ChoreGenerator.jsx:24,322-331,372-528`.

Landing page `[Described]` `src/pages/LandingPage.jsx:9-10`:

> **Chore Manager** — Assign household chores to family members, set frequencies, and track completion — with AI-generated chore ideas tailored to age and room.
> **AI Meal Planning** — Generate age-appropriate meal ideas for Breakfast, Lunch, Dinner, or Snacks — perfect for kids ages 3 and up through adults.

Both claims are implemented: chores are prompted by age group and room `[Implemented]` `base44/functions/generateChores/entry.ts:45`; meals by meal type and age group, with age groups starting at `3-5` `[Implemented]` `src/components/ChoreGenerator.jsx:12,14`, `base44/functions/generateChores/entry.ts:33`.

## 2. Concepts & vocabulary

Glossary terms used: **household member** (the dialog's chips list `ChoreUser` rows), **meal**, **room**, **chore library**, **frequency**.

Feature-local terms:
- **configuration step** — the first dialog screen (inputs and "Generate Chores") `[Implemented]` `src/components/ChoreGenerator.jsx:238-370`.
- **review step** — the second screen listing generated items for selection and overrides `[Implemented]` `src/components/ChoreGenerator.jsx:372-530`.
- **Unassigned sentinel** — an internal marker in an item's assignee set meaning "create one unassigned chore"; shown as the "Unassigned" chip `[Implemented]` `src/components/ChoreGenerator.jsx:70,108-110,139-149,430-454`.

## 3. User stories

- **US-MEAL-G01** As the account owner, I want chore ideas for a room and age group so that I can assign a realistic list without inventing it. `[Implemented]` `src/components/ChoreGenerator.jsx:47-81`, `base44/functions/generateChores/entry.ts:45-56`
- **US-MEAL-G02** As the account owner, I want meal ideas for a meal slot and age group so that the weekly menu fills itself. `[Implemented]` `src/components/ChoreGenerator.jsx:333-346`, `base44/functions/generateChores/entry.ts:33-44`
- **US-MEAL-G03** As the account owner, I want to pick which suggestions to keep and who does each one so that only approved items become chores. `[Implemented]` `src/components/ChoreGenerator.jsx:83-114,372-528` (AR-AI-01)
- **US-MEAL-G04** As the account owner, I want to keep good suggestions in the chore library so that I can assign them again later. `[Implemented]` `src/components/ChoreGenerator.jsx:176-198,510-524`

## 4. Capabilities & interactions

### Configuration step

- **Assign To** — chips, one per household member, multi-select toggle; when no members exist the text "No household members yet. Add members from the chores page to assign chores." is shown instead `[Implemented]` `src/components/ChoreGenerator.jsx:38-45,241-256`. The selection seeds every generated item's assignees `[Implemented]` `src/components/ChoreGenerator.jsx:70`.
- **Age Group** — select, placeholder "Select age group"; options (value → display): `3-5` → "3-5 years", `5-7` → "5-7 years", `8-10` → "8-10 years", `11-13` → "11-13 years", `14-17` → "14-17 years", `18+` → "18+ years", `Adult` → "Adult years" `[Implemented]` `src/components/ChoreGenerator.jsx:12,258-266`.
- **Type of Chore** — select, placeholder "Select chore type"; options `Cleaning`, `Organizing`, `Maintenance`, `Meal`, `Other` `[Implemented]` `src/components/ChoreGenerator.jsx:13,268-276`.
- **Room** — shown once a type other than `Meal` is chosen; select, placeholder "Select a room"; options are the merged room list from `choreRooms` (defaults plus device-saved custom rooms; owned by `20-features/chores/spec.md`) followed by "Other (custom)…" `[Implemented]` `src/components/ChoreGenerator.jsx:36,278-310`. Rooms that are device-saved custom rooms show a hover "Delete custom room" control that removes the room from the device list `[Implemented]` `src/components/ChoreGenerator.jsx:293-305`. Choosing "Other (custom)…" reveals an input with placeholder "Enter custom room name…" `[Implemented]` `src/components/ChoreGenerator.jsx:311-318`. A custom room typed here is saved to the device room list when items are added or saved `[Implemented]` `src/components/ChoreGenerator.jsx:119-123`.
- **Describe the Type of Chore** — shown only for `Other`; input, placeholder "e.g., Yard Work, Pet Care, etc."; the text replaces the type sent to the backend `[Implemented]` `src/components/ChoreGenerator.jsx:50,322-331`.
- **Meal Type** — shown only for `Meal`; single-select chips `Breakfast`, `Lunch`, `Dinner`, `Snack` `[Implemented]` `src/components/ChoreGenerator.jsx:14,333-346`.
- **Quantity** — a "−" / value / "+" stepper; default 5; clamped to 1…50 `[Implemented]` `src/components/ChoreGenerator.jsx:24,348-363`.
- **Generate Chores** button — disabled while any of: no age group; no type; type is not `Meal` and no room; "Other (custom)…" chosen with an empty room; type `Other` with empty description; type `Meal` with no meal type; a generation in flight. While generating the label reads "Generating..." with a spinner `[Implemented]` `src/components/ChoreGenerator.jsx:365-368`.
- **Request sent** — `room`, `choreType` (custom text for `Other`), `ageGroup`, `quantity` (integer), and `mealType` only for meals `[Implemented]` `src/components/ChoreGenerator.jsx:56-62`. Backend contract in §8.
- **On success** the dialog moves to the review step with per-item defaults (BR-MEAL-G03) `[Implemented]` `src/components/ChoreGenerator.jsx:63-74`. **On failure** an alert reads "Failed to generate chores. Please try again." and the configuration step stays `[Implemented]` `src/components/ChoreGenerator.jsx:75-78`. If the backend returns no items the review step is not shown (its rendering requires at least one item) `[Implemented]` `src/components/ChoreGenerator.jsx:63,372`.

### Review step

- Heading "Generated Items ({n})" and a "Select All" / "Deselect All" button (label reads "Deselect All" only when every item is selected) `[Implemented]` `src/components/ChoreGenerator.jsx:90-96,374-379`. Nothing is selected initially `[Implemented]` `src/components/ChoreGenerator.jsx:25`.
- **Assign all to:** chips (shown when members exist). Toggling a chip changes the global set and overwrites every item's assignee set with the new global set `[Implemented]` `src/components/ChoreGenerator.jsx:381-405`.
- **Item card** — checkbox plus clickable body; shows title, description (clamped to two lines), "⏱ {time_estimate} min", and a priority badge whose colour carries meaning: red `high`, yellow `medium`, green otherwise `[Implemented]` `src/components/ChoreGenerator.jsx:408-423`.
- **Per-item overrides** (revealed when the item is selected) `[Implemented]` `src/components/ChoreGenerator.jsx:425-505`:
  - **Assign To** chips: "Unassigned" plus one chip per member (only when members exist). "Unassigned" clears the set and holds the sentinel; choosing it again removes the sentinel. Choosing a member removes the sentinel and toggles that member `[Implemented]` `src/components/ChoreGenerator.jsx:102-114,430-466`.
  - **Frequency** select: "Daily" `daily`, "Weekly" `weekly`, "Bi-Weekly" `biweekly`, "Monthly" `monthly` `[Implemented]` `src/components/ChoreGenerator.jsx:469-480`.
  - **Days of the Week** chips (meals only): `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`, multi-select, none selected by default `[Implemented]` `src/components/ChoreGenerator.jsx:15,481-503`.
- **Save selected to library for future use** checkbox; initial state is on the first time the dialog opens and off after any reset (D-303 in `10-architecture/ai-services.md`) `[Implemented]` `src/components/ChoreGenerator.jsx:31,222,510-513`.
- **Footer**: "Back" returns to the configuration step keeping inputs and results; "Save to Library" writes library rows only; "Add {n} Item(s)" writes chores and, when the checkbox is on, library rows. The last two are disabled with no selection `[Implemented]` `src/components/ChoreGenerator.jsx:515-528,116-117`.
- **On completion** the dialog closes, resets, and asks the Chores page to reload `[Implemented]` `src/components/ChoreGenerator.jsx:201-203`, `src/pages/Chores.jsx:1103`. **On failure** an alert reads "Failed to assign chores. Please try again." and the dialog stays open; rows written before the failure remain `[Implemented]` `src/components/ChoreGenerator.jsx:204-207`.

### 4a. Keyboard & pointer

- Clicking anywhere on an item card's summary toggles its selection `[Implemented]` `src/components/ChoreGenerator.jsx:410-411`.
- Hover reveals the delete control on custom rooms in the Room select `[Implemented]` `src/components/ChoreGenerator.jsx:293-305`.
- Enter/Escape (beyond the dialog's own close), double-click, long-press, swipe, drag-and-drop: none observed.

### 4b. View state & persistence

| Control | Values | Default | Scope |
|---|---|---|---|
| Step | `config`, `selecting` | `config` | memory `src/components/ChoreGenerator.jsx:30` |
| Global assignees | set of member ids | empty | memory `:29` |
| Age group / type / custom type / meal type / room / custom-room flag | see §4 | empty | memory `:20-23,32,34` |
| Quantity | "1"…"50" | "5" | memory `:24` |
| Selected items | set of indices | empty | memory `:25` |
| Per-item overrides | `{ assigned_to: Set, frequency, days[] }` | per BR-MEAL-G03 | memory `:27` |
| Save to library | boolean | true on first open, false after reset | memory `:31,222` |
| Custom rooms | list | device | device `chore_custom_rooms`, `chore_deleted_rooms` via `src/lib/choreRooms.js` (owned by `20-features/chores/spec.md`) |

### 4c. Empty & fallback states

- No household members: "No household members yet. Add members from the chores page to assign chores." `[Implemented]` `src/components/ChoreGenerator.jsx:254`.
- Backend age group outside the list: prompt says "people" `[Implemented]` `base44/functions/generateChores/entry.ts:21-29`.
- Backend returns no `chores`: an empty list is returned to the dialog `[Implemented]` `base44/functions/generateChores/entry.ts:82`.

## 5. Business rules

- **BR-MEAL-G01 (required inputs).** Age group and type are always required; a room is required unless the type is `Meal`; a meal type is required for `Meal`; a description is required for `Other` `[Implemented]` `src/components/ChoreGenerator.jsx:48-52,365`. The backend repeats the first two checks: "Missing required fields" (400) and "Room is required for non-meal chores" (400) `[Implemented]` `base44/functions/generateChores/entry.ts:14-19`.
- **BR-MEAL-G02 (quantity).** Requested quantity is an integer 1…50; the backend substitutes 5 when the value is missing or zero `[Implemented]` `src/components/ChoreGenerator.jsx:353,359`, `base44/functions/generateChores/entry.ts:33,45`.
- **BR-MEAL-G03 (per-item defaults after generation).** Frequency: `weekly` for meals; otherwise the model's value when it is one of `daily`, `weekly`, `biweekly`, `monthly`, else `weekly`. Assignees: a copy of the global set, or the Unassigned sentinel when the global set is empty `[Implemented]` `src/components/ChoreGenerator.jsx:65-72`.
- **BR-MEAL-G04 (assignee resolution on add).** For each selected item: use the item's override set, else the global set, else unassigned. A sentinel alongside members is dropped; a sentinel alone means one unassigned chore `[Implemented]` `src/components/ChoreGenerator.jsx:136-149`.
- **BR-MEAL-G05 (one chore per item × assignee).** "Add" creates one `Chore` per selected item per resolved assignee `[Implemented]` `src/components/ChoreGenerator.jsx:151-173` with: `title`, `description` from the suggestion; `assigned_to` = member id or `""`; `frequency` = `weekly` for meals, else the override when valid, else the suggestion when valid, else `weekly`; `day_of_week` = the item's day chips for meals when any are chosen, otherwise absent; `room` = the meal type (or `Meal`) for meals, else the chosen room; `priority` = the suggestion lower-cased when in `low`/`medium`/`high`, else `medium`; `status: "pending"`; `time_estimate` = integer from the suggestion or 30; `chore_type` = `"Meal"` for meals, otherwise absent `[Implemented]` `src/components/ChoreGenerator.jsx:130,155-172`.
- **BR-MEAL-G06 (library save).** When "Save to Library" is pressed, or "Add" with the checkbox on, one `ChoreLibrary` row per selected item is created with `title`, `description`, `frequency` (override when valid, else suggestion when valid, else `weekly`), `time_estimate` (or 30), `priority` (coerced as above), `room` (meal type or room), and `chore_type` = the selected type (`Cleaning`, `Organizing`, `Maintenance`, `Meal`, or `Other`; the custom description is not stored) `[Implemented]` `src/components/ChoreGenerator.jsx:176-198`.
- **BR-MEAL-G07 (meal library description suffix).** For meals the library description is the suggestion's description followed by a new line and "Age Group: {ageGroup}" `[Implemented]` `src/components/ChoreGenerator.jsx:187`.
- **BR-MEAL-G08 (library duplicate guard).** A library row is skipped when an existing row matches on case-insensitive title, frequency, room, priority (existing default `medium`), and chore type `[Implemented]` `src/components/ChoreGenerator.jsx:127,178-185` (AR-AI-09).
- **BR-MEAL-G09 (chores are not de-duplicated).** No duplicate check is applied when creating `Chore` rows from the generator `[Implemented]` `src/components/ChoreGenerator.jsx:151-173`.
- **BR-MEAL-G10 (library-only never creates chores).** "Save to Library" skips chore creation entirely, including for unassigned items `[Implemented]` `src/components/ChoreGenerator.jsx:116,151,176`.
- **BR-MEAL-G11 (custom room persistence).** A custom room typed in the configuration step is saved to the device room list on add or save `[Implemented]` `src/components/ChoreGenerator.jsx:119-123`.
- **BR-MEAL-G12 (nothing is written before review).** Generation itself writes no entity; only "Add" or "Save to Library" writes `[Implemented]` `src/components/ChoreGenerator.jsx:47-81,116-208` (AR-AI-01).
- **BR-MEAL-G13 (age-group prose).** The backend expands the age group before prompting: `3-5` → "toddlers and preschoolers (3-5 years old)"; `5-7` → "young children (5-7 years old)"; `8-10` → "children (8-10 years old)"; `11-13` → "pre-teens (11-13 years old)"; `14-17` → "teenagers (14-17 years old)"; `18+` → "young adults (18+ years old)"; `Adult` → "adults"; anything else → "people" `[Implemented]` `base44/functions/generateChores/entry.ts:21-29`.

### 5a. State & lifecycle

Dialog step: `config` → "Generate Chores" succeeds → `selecting` → "Back" → `config` (inputs kept) · `selecting` → "Add"/"Save to Library" succeeds → closed and reset · any → dialog closed → reset `[Implemented]` `src/components/ChoreGenerator.jsx:74,201-202,210-229,516`.

Created `Chore` rows start `pending`; their lifecycle is in `10-architecture/data-model/chores.md` and `20-features/chores/spec.md` (meals: `meal-planning.md` §5a).

### 5b. Time & date semantics

None. The generator writes no dates; `day_of_week` for meals uses `Mon`…`Sun` (AR-TIME-31; D-601).

## 6. Data

| Entity | Operation | Citation |
|---|---|---|
| `ChoreUser` (E-ChoreUser) | read (passed in from the Chores page load) | `src/pages/Chores.jsx:191,1103` |
| `ChoreLibrary` (E-ChoreLibrary) | `list()` (all) for the duplicate guard; `create` | `src/components/ChoreGenerator.jsx:127,188-196` |
| `Chore` (E-Chore) | `create` | `src/components/ChoreGenerator.jsx:161-172` |

Backend function `generateChores`: input `{ room, choreType, ageGroup, quantity, mealType }`; output `{ chores: [{ title, description, frequency, time_estimate, priority }] }` (all strings); errors `{ error }` with 401, 400, or 500 `[Implemented]` `base44/functions/generateChores/entry.ts:8-19,58-85`. See `10-architecture/data-model/chores.md`.

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| outbound | Chores (Chores tab) | created non-meal chores appear in the chore list; the page reloads on completion | `src/pages/Chores.jsx:1103` |
| outbound | Meal planning (Menu tab, widgets) | created meals appear on the Menu | `20-features/chores/meal-planning.md` §7 |
| outbound | Chore library | saved rows appear in the library dialog | `20-features/chores/spec.md` |
| both | Chore rooms | reads the merged room list; saves and deletes custom rooms on the device | `src/components/ChoreGenerator.jsx:11,35-36,119-123,297` |
| outbound | AI services | backend function call | `10-architecture/ai-services.md` §2 |

### 7a. Feedback & notifications

- Alert "Failed to generate chores. Please try again." on generation failure `[Implemented]` `src/components/ChoreGenerator.jsx:77` (AR-AI-04).
- Alert "Failed to assign chores. Please try again." on write failure `[Implemented]` `src/components/ChoreGenerator.jsx:206`.
- Spinner and "Generating..." label while the request is in flight `[Implemented]` `src/components/ChoreGenerator.jsx:366-367`.
- No success toast; the dialog closing is the confirmation `[Implemented]` `src/components/ChoreGenerator.jsx:201-203`.

## 8. AI & automation

Mechanism, response schema, and rules AR-AI-01/03/04/07/08/09 are in `10-architecture/ai-services.md` §2. User-facing contract:

- The backend builds one of two prompts and asks for a structured `chores` array `[Implemented]` `base44/functions/generateChores/entry.ts:31-80`.
- **Meal prompt** (verbatim) `[Implemented]` `base44/functions/generateChores/entry.ts:33-44`:

  > Generate {quantity or 5} age-appropriate {mealType} meal ideas for {ageDescription}.
  >
  > For each meal idea, provide:
  > - Title: The name of the meal
  > - Description: 2-3 sentences describing the meal, key ingredients, and why it's suitable for this age group
  > - Frequency: How often this could be served (daily, weekly, biweekly, or monthly)
  > - Time Estimate: Estimated prep + cook time in minutes (e.g., "15", "30", "45", "60")
  > - Priority: Use "medium" for most meals, "high" for nutrient-dense options, "low" for occasional treats
  >
  > Make sure meals are age-appropriate. Simple, fun foods for young children; more varied and nutritious options for teens and adults.
  >
  > Format as a JSON array with objects containing: { title, description, frequency, time_estimate, priority }

- **Chore prompt** (verbatim) `[Implemented]` `base44/functions/generateChores/entry.ts:45-56`:

  > Generate {quantity or 5} age-appropriate chore ideas for {ageDescription} in the {room} room, specifically focused on {choreType} tasks.
  >
  > For each chore, provide:
  > - Title: A clear, concise chore name
  > - Description: 2-3 sentences about what the chore involves
  > - Frequency: How often it should be done (daily, weekly, biweekly, or monthly)
  > - Time Estimate: Estimated minutes to complete (e.g., "15", "30", "45", "60")
  > - Priority: Low, medium, or high priority for this room
  >
  > Format as a JSON array with objects containing: { title, description, frequency, time_estimate, priority }
  >
  > Make sure the chores are appropriate for the age group. Younger kids (5-7) should have simple, safe tasks. Older teens and adults can handle more complex responsibilities.

- Output schema: object with required `chores`, an array of objects each requiring string `title`, `description`, `frequency`, `time_estimate`, `priority` `[Implemented]` `base44/functions/generateChores/entry.ts:60-79`.
- Suggestions are shown as returned; coercion of frequency, priority, and time estimate happens only when writing (BR-MEAL-G05, BR-MEAL-G06) `[Implemented]` `src/components/ChoreGenerator.jsx:408-423,155-160,170`.
- Automations: none.

## 9. Onboarding content

None owned here. The Chores walkthrough steps that mention the generator are quoted in `meal-planning.md` §1 and owned by `20-features/chores/spec.md`.

## 10. Device-local preferences

None owned here. Custom room keys `chore_custom_rooms` and `chore_deleted_rooms` are owned by `20-features/chores/spec.md` (`src/lib/choreRooms.js:1-2`); this dialog reads and writes them `[Implemented]` `src/components/ChoreGenerator.jsx:11,35,120-122,297`.

## 11. Seed / hardcoded data used

- Age groups: `3-5`, `5-7`, `8-10`, `11-13`, `14-17`, `18+`, `Adult` `src/components/ChoreGenerator.jsx:12`.
- Types: `Cleaning`, `Organizing`, `Maintenance`, `Meal`, `Other` `src/components/ChoreGenerator.jsx:13`.
- Meal types: `Breakfast`, `Lunch`, `Dinner`, `Snack` `src/components/ChoreGenerator.jsx:14`.
- Days: `Mon`…`Sun` `src/components/ChoreGenerator.jsx:15`.
- Valid frequencies for writing: `daily`, `weekly`, `biweekly`, `monthly`; valid priorities: `low`, `medium`, `high`; time-estimate fallback 30 `src/components/ChoreGenerator.jsx:65,155-160,170`.
- Quantity bounds 1…50, default 5 `src/components/ChoreGenerator.jsx:24,353,359`.
- Default rooms (via `choreRooms`): `Kitchen`, `Bathroom`, `Bedroom`, `Living Room`, `Dining Room`, `Laundry Room`, `Garage`, `Entryway`, `Yard` `src/lib/choreRooms.js:4` (owned by `20-features/chores/spec.md`).

## 12. Print / email formats

None.

## 13. Acceptance criteria

- **AC-MEAL-G01** Given type "Cleaning" and age group "8-10" with no room, When the form is viewed, Then "Generate Chores" is disabled; When "Kitchen" is chosen, Then it is enabled. (refs BR-MEAL-G01)
- **AC-MEAL-G02** Given type "Meal", When the form is viewed, Then no Room field is shown and "Generate Chores" stays disabled until a meal type chip is chosen. (refs BR-MEAL-G01)
- **AC-MEAL-G03** Given quantity 1, When "−" is pressed, Then it stays 1; Given 50, When "+" is pressed, Then it stays 50. (refs BR-MEAL-G02)
- **AC-MEAL-G04** Given the backend returns three items and no global assignee was chosen, When the review step opens, Then no item is selected and each selected item's Assign To shows "Unassigned" active. (refs BR-MEAL-G03)
- **AC-MEAL-G05** Given item 1 is selected with members A and B chosen and frequency "Daily", When "Add 1 Item(s)" is pressed, Then two `Chore` rows are created, one per member, each `pending`, `daily`, priority coerced, time estimate from the suggestion or 30. (refs BR-MEAL-G04, BR-MEAL-G05)
- **AC-MEAL-G06** Given a meal item with days "Mon" and "Wed" and any frequency override, When added, Then the `Chore` has `chore_type` "Meal", `frequency` "weekly", `room` equal to the meal type, and `day_of_week` ["Mon","Wed"]. (refs BR-MEAL-G05)
- **AC-MEAL-G07** Given the suggestion's frequency is "twice a week" and no override, When added, Then the chore's frequency is `weekly`. (refs BR-MEAL-G05)
- **AC-MEAL-G08** Given "Save selected to library" is on and a library row with the same title, frequency, room, priority, and type exists, When "Add" is pressed, Then the chore is created and no new library row is. (refs BR-MEAL-G08)
- **AC-MEAL-G09** Given a meal with age group "5-7" is saved to the library, Then the library description ends with a new line and "Age Group: 5-7". (refs BR-MEAL-G07)
- **AC-MEAL-G10** Given two items are selected, When "Save to Library" is pressed, Then library rows are written and no `Chore` is created. (refs BR-MEAL-G10)
- **AC-MEAL-G11** Given a custom room "Attic" was typed, When items are added, Then "Attic" appears in the room list on the next open. (refs BR-MEAL-G11)
- **AC-MEAL-G12** Given the backend call fails, When "Generate Chores" was pressed, Then an alert reads "Failed to generate chores. Please try again." and no entity is written. (refs BR-MEAL-G12, AR-AI-04)
- **AC-MEAL-G13** Given the dialog is closed from the review step, When it is reopened, Then the configuration step shows with empty inputs, quantity 5, and the library checkbox off. (refs §5a, D-303)

## 14. Discrepancies & open questions

- **D-605** The User Manual names the button "Generate with AI", lists rooms "Kitchen, Bathroom, Bedroom, Living Room, Outdoor, or General", age groups "Adults, Teens, Older Children, Younger Children, or Mixed", and types "Cleaning, Organizing, Maintenance" or "Other" (`src/pages/UserManual.jsx:202-205`). The dialog's button is titled "AI Generator" with a "Generate Chores" action (`src/components/ChoreGenerator.jsx:231,367`), rooms come from the merged room list (`src/lib/choreRooms.js:4`), age groups are `3-5`…`Adult` (`src/components/ChoreGenerator.jsx:12`), and types include `Meal` (`:13`).
- D-303 (library checkbox default) and D-601 (meal day names) are recorded in `10-architecture/ai-services.md` and `meal-planning.md`.
- Open questions: none.
