# Education — Add Activities dialog (Manual Entry and AI Generator)

**Feature code:** `EDU` · **Level:** 2 · **Status:** draft · Parent: `spec.md` §4.14, §8

**Sources owned:** `src/components/ActivityGenerator.jsx`, `base44/functions/generateActivities/entry.ts` (user-facing contract: inputs, prompt, output schema)
**Sources referenced:** LLM mechanism and platform rules → `10-architecture/ai-services.md` §3, AR-AI-01, AR-AI-03, AR-AI-04, AR-AI-07..09 · `Goal` → `20-features/goals`, `10-architecture/data-model/goals.md` · `EducationActivity` → `10-architecture/data-model/education.md`

## 1. Entry and shape

- Opened from the Education toolbar by the icon button titled "Add / Generate Activities" (wand). Dialog title "Add Activities" `[Implemented]` `src/components/ActivityGenerator.jsx:198-205`.
- A two-way mode switch under the title: "Manual Entry" (plus icon) and "AI Generator" (wand icon). The dialog opens in AI Generator mode `[Implemented]` `src/components/ActivityGenerator.jsx:21,207-215`.
- Closing the dialog (any way) returns the AI flow to its first step and clears the manual form; generated suggestions and selections made in the AI flow are kept in memory until an assignment completes `[Implemented]` `src/components/ActivityGenerator.jsx:42-46,175-183,198`.
- The dialog receives the page's learners and plans; only plans whose learner exists are considered plans of a learner `[Implemented]` `src/components/ActivityGenerator.jsx:19,192-195`.

## 2. Manual Entry mode

Fields, top to bottom `[Implemented]` `src/components/ActivityGenerator.jsx:218-286`:

- **Learner** select, placeholder "Select a learner"; choosing a learner clears the plan choice `[Implemented]` `:220-228`.
- **Plan / Subject** select, disabled until a learner is chosen; placeholder "Select a plan" or "Select a learner first". Options are one entry per distinct subject of that learner (the first plan row found for each subject supplies the value) `[Implemented]` `:229-244` (D-656).
- **Type** chips `assignment` (default) / `activity` `[Implemented]` `:37,245-255`.
- **Title** text, placeholder "e.g. Chapter 5 worksheet" `[Implemented]` `:256`.
- **Frequency** chips Once (default) / Daily / Weekly / Biweekly / Monthly; choosing one clears the days `[Implemented]` `:16,257-267`.
- **Days of Week** toggles Mon … Sun, shown for Weekly and Biweekly only `[Implemented]` `:17,48-53,268-280`.
- **Due Date (Optional)** native date input; **Notes** textarea `[Implemented]` `:281-282`.
- Button "Add", disabled until both a title and a plan are set (spinner while saving) `[Implemented]` `:283-285`.

Outcome: one `EducationActivity` with the form's title, type, frequency, days, due date and notes, plus the chosen plan's `plan_id`, `learner_id` and `subject`; the page is asked to reload, the dialog closes and the form resets `[Implemented]` `src/components/ActivityGenerator.jsx:55-71`. If the chosen plan id is no longer among the plans, nothing is written and the dialog still closes `[Implemented]` `:58-69`.

## 3. AI Generator mode

### 3a. Step "config" — inputs

- **Age Group** select, placeholder "Select age group", options verbatim: `Preschool (3-5)`, `K-1st Grade (5-7)`, `2-3rd Grade (7-9)`, `4-5th Grade (9-11)`, `6-8th Grade (11-14)`, `High School (14-18)`, `18+` `[Implemented]` `src/components/ActivityGenerator.jsx:13,292-300`.
- **Subject** free text, placeholder "e.g. Math, Science, History". This text steers the prompt only; created activities take each target plan's subject (§4) `[Implemented]` `:302-309,152`.
- **Activity Type** chips `assignment` / `activity`, default `activity`. The chosen type is sent to the model and written as the `type` of every created activity `[Implemented]` `:14,27,311-329,154`.
- **Quantity** number input, min 1, max 10, default 5; sent as an integer `[Implemented]` `:28,331-340,81`.
- Button "Generate Activities" (wand), reading "Generating..." with a spinner while the call runs; disabled until Age Group and Subject are set `[Implemented]` `:342-345`.
- On success the flow moves to step "selecting" with the returned suggestions; when the response has none, the step changes but the selection screen renders nothing `[Implemented]` `:83-84,349`. On failure the alert "Failed to generate activities. Please try again." is shown and the inputs stay `[Implemented]` `:85-88`.

### 3b. Backend contract — `generateActivities`

- Request body: `{ ageGroup, subject, activityType, quantity }`. The function requires a signed-in user (else 401) and the first three fields (else 400 "Missing required fields"); `quantity` falls back to 5 in the prompt `[Implemented]` `base44/functions/generateActivities/entry.ts:6-18`.
- Prompt sent to the model, verbatim `[Implemented]` `base44/functions/generateActivities/entry.ts:18-28`:

  > Generate {quantity or 5} creative, age-appropriate {activityType} activities for students in {ageGroup} learning about {subject}.
  >
  > For each activity, provide:
  > - Title: A clear, catchy name
  > - Description: 1-2 sentences about what the activity involves
  > - Duration: Estimated time to complete (e.g., "30 minutes")
  > - Materials: Any supplies needed (or "None" if just paper/pencil)
  >
  > Format as a JSON array with objects containing: { title, description, duration, materials }
  >
  > Make them engaging, hands-on, and appropriate for the age group.

- Response schema requested from the model and returned to the client: `{ activities: [ { title, description, duration, materials } ] }`, all four strings required per item; an absent array is returned as `[]` `[Implemented]` `base44/functions/generateActivities/entry.ts:30-53`. A failure is returned as `{ error }` with status 500 `[Implemented]` `:54-56`.
- Nothing is stored by the function; suggestions live only in the dialog until assigned (`10-architecture/ai-services.md` AR-AI-01) `[Implemented]` `base44/functions/generateActivities/entry.ts:30-53`.

### 3c. Step "selecting" — choose learners and suggestions

- Heading "Select Learners": a checkbox row per learner (click anywhere on the row toggles) `[Implemented]` `src/components/ActivityGenerator.jsx:351-364,93-98`.
- Heading "Generated Activities ({n})" with a "Select All" / "Deselect All" text button; each suggestion row shows the title, the description, and "⏱ {duration} • 📦 {materials}"; the row or its checkbox toggles selection `[Implemented]` `:366-395,100-113`.
- Buttons "Back" (to config) and "Next: Select Plans →", the latter disabled until at least one learner and one suggestion are selected `[Implemented]` `:397-406,122-125`.

### 3d. Step "plans" — choose target plans and options

- Heading "Select Plans/Subjects": one checkbox row per plan belonging to any selected learner, showing the plan's subject and the learner's name `[Implemented]` `:410-437,115-120`.
- Checkbox "Also create these as goals for the learners" (off by default) `[Implemented]` `:33,439-448`.
- Buttons "Back" (to selecting) and "Assign to {n} Plan(s)" (plus icon), disabled until at least one plan is selected `[Implemented]` `:450-459`.

## 4. What "Assign" writes

- The current activity list is fetched once for the duplicate guard `[Implemented]` `src/components/ActivityGenerator.jsx:137`.
- For every selected plan × every selected suggestion, in that nesting order: skip when an existing activity has the same `plan_id`, the same title ignoring case, and the same `learner_id`; otherwise create one `EducationActivity` with `[Implemented]` `:139-158`:
  - `plan_id`, `learner_id`, `subject` from the plan;
  - `title` = suggestion title; `type` = the Activity Type chosen in config; `frequency` = `once`;
  - `notes` = `"{description}\n\nDuration: {duration}\nMaterials: {materials}"` (D-657);
  - no `due_date`, no `days_of_week`.
- When "Also create these as goals for the learners" is on, one `Goal` per created activity (not per skipped duplicate) with `title` = suggestion title, `description` = suggestion description, `timeframe` = `weekly`, `status` = `not_started`, `member_name` = the plan's learner name or "Unknown" when the learner is not found `[Implemented]` `:160-170` (`spec.md` BR-EDU-28, D-658). No other goal fields are written (`occurrences`, `target_date`, `category` are left to entity defaults) `[Implemented]` `:162-168`.
- Afterwards the dialog closes, every AI-flow value resets (step, suggestions, selections, age group, subject, goals checkbox), and the page reloads through `onActivitiesCreated` with the created rows `[Implemented]` `:175-185`, `src/pages/Education.jsx:723`.
- On any failure during assignment: alert "Failed to assign activities. Please try again."; rows created before the failure remain `[Implemented]` `:186-189`.

## 5. Rules

- **BR-EDU-31** Suggestions are never written without the explicit "Assign to N Plan(s)" action. `[Implemented]` `src/components/ActivityGenerator.jsx:127-128,452-458`
- **BR-EDU-32** The duplicate guard compares plan, learner and case-insensitive title against every existing activity, not only those of the chosen type. `[Implemented]` `src/components/ActivityGenerator.jsx:142-146`
- **BR-EDU-33** Generated activities are always one-off (`frequency` `once`) and undated. `[Implemented]` `src/components/ActivityGenerator.jsx:155`
- **BR-EDU-34** The same suggestion assigned to plans of two learners yields two activities and, with the checkbox on, two goals with different `member_name`. `[Implemented]` `src/components/ActivityGenerator.jsx:139-170`

## 6. Acceptance criteria

- **AC-EDU-29** Given Age Group "4-5th Grade (9-11)", Subject "Fractions", type activity, quantity 3, When "Generate Activities" is pressed, Then the function receives those four values and up to 3 suggestions with title, description, duration and materials are listed. (refs §3a, §3b)
- **AC-EDU-30** Given two learners selected, two suggestions selected, and one plan of each learner selected, When "Assign to 2 Plan(s)" is pressed, Then four activities exist, each `once`, typed as chosen, with notes in the `"{description}\n\nDuration: …\nMaterials: …"` form. (refs §4, BR-EDU-33)
- **AC-EDU-31** Given a plan already holds an activity titled "volcano lab" and the suggestion "Volcano Lab" is assigned to it, Then no new activity is created for that plan. (refs BR-EDU-32)
- **AC-EDU-32** Given the goals checkbox is on and three activities are created, Then three weekly, not-started goals exist whose `member_name` is each plan's learner name. (refs BR-EDU-28)
- **AC-EDU-33** Given Manual Entry with learner L, plan "Math", title "Worksheet 3", frequency Biweekly, days Tue and Thu, When "Add" is pressed, Then one activity for L / Math with those values exists and the dialog closes. (refs §2)
