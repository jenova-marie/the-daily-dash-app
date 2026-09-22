# Education — Activity Library

**Feature code:** `EDU` · **Level:** 2 · **Status:** draft · Parent: `spec.md` §4.14

**Sources owned:** `src/components/ActivityLibrary.jsx`; the "Save to Library" path in `src/components/education/SubjectCard.jsx:134-150`; `createGoalFromEducation` in `src/pages/Education.jsx:248-263`
**Sources referenced:** `FavoriteActivity` (activity library entity) → `10-architecture/data-model/education.md` · `Goal` → `20-features/goals`, `10-architecture/data-model/goals.md`

## 1. Purpose

The activity library is a per-learner store of reusable activities (title, description, type, duration, materials) that can be added to a plan later as one-off activities, or turned into a goal `[Implemented]` `src/components/ActivityLibrary.jsx:12-29,97-117,130-135`. The User Manual calls it the "Activity Library tab" for browsing "saved favorite activities" and assigning them "to new plans" `[Described]` `src/pages/UserManual.jsx:258`.

## 2. Entry and layout

- Opened from the Education toolbar by the icon button titled "Activity Library" (book icon). Dialog title "Activity Library" `[Implemented]` `src/components/ActivityLibrary.jsx:137-146`.
- Entries are loaded each time the dialog opens, newest-updated first, at most 100 `[Implemented]` `:42-56`.
- Closing the dialog clears any selection and returns to the list step `[Implemented]` `:138`.
- Two parts: a "Save New Activity" form at the top and a "Saved Activities ({n})" list below, followed by the action row `[Implemented]` `:148-341`.

## 3. Save paths

### 3a. The library form

- **Learner** select (placeholder "Select a learner"); **Title** (placeholder "Activity title"); **Description** (placeholder "Brief description"); **Type** select Activity (default) / Assignment; **Duration** (placeholder "e.g. 30 min"); **Materials** (placeholder "e.g. Paper, pencil") `[Implemented]` `src/components/ActivityLibrary.jsx:22-29,150-213`.
- Button "Save to Library" (plus icon), disabled until learner and title are set; creates one activity-library entry with the six fields, resets the form and reloads the list `[Implemented]` `:58-74,215-217`.

### 3b. From an activity's edit dialog

- "Save to Library" in the Edit Assignment / Activity dialog creates an entry with the activity's `learner_id`, `title`, `type`, `description` = the activity's notes (or ""), `duration` = "", `materials` = ""; then the alert "Saved to Activity Library!" and the dialog closes without saving edits `[Implemented]` `src/components/education/SubjectCard.jsx:134-150,268-270` (`spec.md` BR-EDU-24).

## 4. The list

- While loading, a spinner; with no entries, "No saved activities yet." `[Implemented]` `src/components/ActivityLibrary.jsx:223-228`.
- Entries are grouped by learner in order of first appearance; each group is headed by the learner's name in upper case (blank when the learner no longer exists) `[Implemented]` `:231-243`.
- Each entry row: a selection checkbox (the whole row toggles), title, type, description when present, and "⏱ {duration or -} • 📦 {materials or -}" when either is present `[Implemented]` `:245-258,85-90`.
- Row buttons: "+" titled "Create goal" (present because the page supplies a goal handler) and a trash button that deletes the entry immediately and reloads the list `[Implemented]` `:260-286,76-83`.

## 5. "+" — create a goal from an entry

- Pressing "+" looks up the entry's learner; when found, the page's `createGoalFromEducation` runs with the entry's **title** (passed in the parameter named subject) and the learner's name; when the learner is not found nothing happens `[Implemented]` `src/components/ActivityLibrary.jsx:130-135,266-269`.
- `createGoalFromEducation` creates one `Goal` `[Implemented]` `src/pages/Education.jsx:248-263`:
  - `title` = "{entry title} Education Goal"
  - `description` = "Created from Education Manager - {entry title}"
  - `timeframe` = `monthly`
  - `status` = `not_started`
  - `member_name` = the learner's name
  - no `target_date`, `occurrences`, `category` (entity defaults apply)
- Then the alert `"{entry title}" goal created! View it in Goal Manager.`; a failure is logged with no user message `[Implemented]` `src/pages/Education.jsx:257-262` (`spec.md` BR-EDU-27, D-658).
- The entry is not marked or changed by goal creation `[Implemented]` `src/components/ActivityLibrary.jsx:266-269`.

## 6. Multi-select → learner → plan → activities

- In the list step the action row has "Cancel" and "Next: Assign {n} to Plan →" (the count appears once at least one entry is selected); the button is disabled until an entry is selected and at least one plan exists `[Implemented]` `src/components/ActivityLibrary.jsx:299-309,92-95`.
- Assign step heading "Assign {n} activity(ies) to a plan" `[Implemented]` `:311-312`:
  - **Learner** select (placeholder "Select learner"); choosing one clears the plan choice `[Implemented]` `:313-321`.
  - **Subject / Plan** select, disabled until a learner is chosen (placeholder "Select plan" / "Select learner first"); options are every plan row of that learner, labelled by subject `[Implemented]` `:322-332` (D-656).
  - Buttons "Back" (to the list, selection kept) and "Add to Plan" (spinner while saving), disabled until a plan is chosen `[Implemented]` `:333-339`.
- Any learner's entries may be assigned to any learner's plan; the created activities take the target plan's learner `[Implemented]` `:103-108`.
- On "Add to Plan": for each selected entry, one `EducationActivity` with `plan_id`, `learner_id`, `subject` from the plan; `title` = entry title; `type` = entry type or `activity` when unset; `frequency` = `once`; `notes` = the entry's description, "Duration: {duration}" and "Materials: {materials}", each included only when present, joined by single newlines (D-657); no due date or days `[Implemented]` `:97-114`. There is no duplicate guard on this path `[Implemented]` `:104-114`.
- Afterwards the page reloads (`onSaveActivity`), the selection and assign fields reset, and the dialog closes; a failure is logged with no user message `[Implemented]` `:115-127`, `src/pages/Education.jsx:716`.

## 7. Rules

- **BR-EDU-35** Library entries belong to a learner and are never edited after creation; deleting a learner leaves the learner's entries in place (they then appear under a blank heading). `[Implemented]` `src/components/ActivityLibrary.jsx:61,78,239-241`, `src/pages/Education.jsx:213-223`
- **BR-EDU-36** Activities created from entries are one-off and undated, and copy the entry's title and type by value; later changes to the entry do not affect them. `[Implemented]` `src/components/ActivityLibrary.jsx:104-113`
- **BR-EDU-37** A dialog-level date-only "has due / has overdue" status is computed on mount from the 500 most recently updated activities and is not displayed. `[Partial]` `src/components/ActivityLibrary.jsx:21,31-40,129`

## 8. Acceptance criteria

- **AC-EDU-34** Given the library form with learner L, title "Nature Walk", type Activity, duration "45 min", materials "Notebook", When "Save to Library" is pressed, Then an entry with those values exists under L's group and the form is cleared. (refs §3a)
- **AC-EDU-35** Given two entries selected and the assign step set to learner M and plan "Science", When "Add to Plan" is pressed, Then two `once` activities exist for M / Science whose notes contain the description, "Duration: …" and "Materials: …" lines that were present, and the dialog closes. (refs §6, BR-EDU-36)
- **AC-EDU-36** Given an entry with an empty duration and materials, When assigned, Then its activity's notes contain only the description. (refs §6)
- **AC-EDU-37** Given "+" is pressed on entry "Nature Walk" for learner L, Then a goal "Nature Walk Education Goal" (monthly, not started, member L, description "Created from Education Manager - Nature Walk") exists and the alert `"Nature Walk" goal created! View it in Goal Manager.` shows. (refs §5)
- **AC-EDU-38** Given no plans exist, Then "Next: Assign to Plan →" stays disabled regardless of selection. (refs §6)
- **AC-EDU-39** Given learner L was deleted, When the library opens, Then L's entries are still listed under a blank group heading. (refs BR-EDU-35)
