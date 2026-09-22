# AI Services — Architecture Spec

**Area code:** `AI` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 61 · Described 12 · Partial 0

**Sources owned:** `base44/functions/generateChores/entry.ts`, `base44/functions/generateActivities/entry.ts`, `base44/functions/fetchDailyQuote/entry.ts`, `base44/functions/generateDailyQuotes/entry.ts`, `base44/workflows/Midnight Daily Quote Generator.jsonc` (AI aspects of each; the feature specs own the surrounding UI)
**Sources referenced (owned elsewhere):** `src/components/ChoreGenerator.jsx` → `20-features/chores` · `src/components/ActivityGenerator.jsx` → `20-features/education` · `src/components/visionboard/PillarGoalGenerator.jsx`, `AffirmationManager.jsx`, `Slideshow.jsx` → `20-features/vision-board` · `src/components/dashboard/DashboardSlideshow.jsx` → `20-features/vision-board` (slideshow) · `src/components/dashboard/DashboardQuote.jsx`, `src/pages/Quotes.jsx` → `20-features/quotes`

**Permissions:** every AI call runs for the signed-in account owner; the midnight quote job runs under an admin caller (`base44/functions/generateDailyQuotes/entry.ts:12-18`). No AI feature is gated by role.

## 0. Scope

This spec records every place the prototype calls a language model (`InvokeLLM`), what the model is asked, what comes back, and what the account owner can do with the result. Seven touchpoints exist. Two run inside backend functions invoked from the UI, two run inside the daily-quote pipeline (one on demand, one scheduled), and three run directly from the browser.

- **AR-AI-01 — AI suggests; the account owner approves and assigns.** No touchpoint writes a suggestion to an entity without an explicit user action after review: chores need "Add N Item(s)" or "Save to Library" `[Implemented]` `src/components/ChoreGenerator.jsx:517-527`; activities need "Assign to N Plan(s)" `[Implemented]` `src/components/ActivityGenerator.jsx:452-458`; pillar activities need "Add N" `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:168-175`; generated affirmations land in the compose box and need "Add Affirmation" `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:137,203-210`. The two exceptions are ephemeral: slideshow affirmations and translations are displayed only and never stored `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:111`, `src/components/visionboard/Slideshow.jsx:290`. The daily quote is stored automatically, but only as a fallback after the external quote source is exhausted (§7).
- **AR-AI-02 — There is no image generation.** No call to an image-generation integration exists in `src/` or `base44/functions/` `[Implemented]` (repository-wide search for `GenerateImage`: no matches). Collage imagery is uploaded by the account owner or seeded by an admin (see `20-features/vision-board`).
- **AR-AI-03 — Every call is a single prompt, optionally with a JSON response schema.** Structured calls pass `response_json_schema` `[Implemented]` `base44/functions/generateChores/entry.ts:58-80`, `base44/functions/generateActivities/entry.ts:30-51`, `src/components/visionboard/PillarGoalGenerator.jsx:29-61`, `src/components/dashboard/DashboardSlideshow.jsx:85-101`, `base44/functions/fetchDailyQuote/entry.ts:59-68`, `base44/functions/generateDailyQuotes/entry.ts:66-75`. Two calls take free text back: affirmation generation `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:134-136` and translation `[Implemented]` `src/components/visionboard/Slideshow.jsx:287-289`.
- **AR-AI-04 — Failure is reported with a plain alert and nothing is written.** Chore generation: "Failed to generate chores. Please try again." `[Implemented]` `src/components/ChoreGenerator.jsx:77`; activity generation: "Failed to generate activities. Please try again." `[Implemented]` `src/components/ActivityGenerator.jsx:87`; affirmations: "Failed to generate affirmations" `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:141`; pillar ideas log to console only `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:65-67`; translation falls back to the English text `[Implemented]` `src/components/visionboard/Slideshow.jsx:291-294`.

## 1. Touchpoint inventory

| # | Touchpoint | Trigger | Where the call runs | Response shape | Result lands in |
|---|---|---|---|---|---|
| 1 | Chore / meal idea generator | Chores page wand button → "Generate Chores" | backend `generateChores` | `{ chores: [{title, description, frequency, time_estimate, priority}] }` | `Chore` and/or `ChoreLibrary` after review |
| 2 | Education activity generator | Education wand button → AI Generator tab → "Generate Activities" | backend `generateActivities` | `{ activities: [{title, description, duration, materials}] }` | `EducationActivity` (optionally `Goal`) after review |
| 3 | Pillar activity ideas | Vision Board → Pillars tab → "AI Goals" on a pillar | browser | `{ activities: [{title}] }` | `PillarActivity` after review |
| 4 | Affirmation drafts | Vision Board → Affirmations → "Generate" / "Generate for {pillar}" | browser | free text (numbered list) | compose textarea; `Affirmation` on "Add Affirmation" |
| 5 | Auto-generated slideshow affirmations | Dashboard or Vision Board → Vision → "Auto-Generated" | browser | `{ by_pillar: { [pillar]: string[] } }` | slideshow only (not stored) |
| 6 | Affirmation translation | Slideshow with a non-English voice selected | browser | free text | slideshow only (not stored) |
| 7 | Daily quote (fallback) | Quote widget / Quotes page load, "New Quote", or the midnight job | backend `fetchDailyQuote` / `generateDailyQuotes` | `{ quote, author }` | `DailyQuote` (automatic) |

## 2. Touchpoint 1 — Chore and meal idea generator

### 2a. Entry and inputs

- Opened from the Chores page by an icon button titled "AI Generator" (wand icon); the dialog is titled "Generate Chores with AI" `[Implemented]` `src/components/ChoreGenerator.jsx:230-236`.
- **Assign To** chips, multi-select over household members; when none exist the dialog says "No household members yet. Add members from the chores page to assign chores." `[Implemented]` `src/components/ChoreGenerator.jsx:241-256`.
- **Age Group** select, values `3-5, 5-7, 8-10, 11-13, 14-17, 18+, Adult`, each displayed as "{value} years" `[Implemented]` `src/components/ChoreGenerator.jsx:12,258-266`.
- **Type of Chore** select, values `Cleaning, Organizing, Maintenance, Meal, Other` `[Implemented]` `src/components/ChoreGenerator.jsx:13,268-276`. Choosing `Other` reveals "Describe the Type of Chore" (placeholder "e.g., Yard Work, Pet Care, etc.") and that text replaces the type in the request `[Implemented]` `src/components/ChoreGenerator.jsx:50,322-331`.
- **Room** select, shown for every type except `Meal`, built from the stored room list plus "Other (custom)…" which reveals "Enter custom room name…"; saved custom rooms show a hover delete control `[Implemented]` `src/components/ChoreGenerator.jsx:278-320`. A custom room typed here is persisted to the room list when the chores are assigned `[Implemented]` `src/components/ChoreGenerator.jsx:119-123`.
- **Meal Type** chips, shown only for `Meal`, values `Breakfast, Lunch, Dinner, Snack` `[Implemented]` `src/components/ChoreGenerator.jsx:14,333-346`.
- **Quantity** stepper, default 5, clamped 1–50 `[Implemented]` `src/components/ChoreGenerator.jsx:24,348-363`.
- "Generate Chores" is disabled until age group and type are chosen, a room is chosen (non-meal), a custom type is described (`Other`), and a meal type is chosen (`Meal`) `[Implemented]` `src/components/ChoreGenerator.jsx:365-368`.

### 2b. Backend call and prompt

- The backend requires a signed-in user and rejects requests missing type or age group, or missing a room for non-meal types `[Implemented]` `base44/functions/generateChores/entry.ts:6-19`.
- Age group is expanded before prompting: `3-5` → "toddlers and preschoolers (3-5 years old)", `5-7` → "young children (5-7 years old)", `8-10` → "children (8-10 years old)", `11-13` → "pre-teens (11-13 years old)", `14-17` → "teenagers (14-17 years old)", `18+` → "young adults (18+ years old)", `Adult` → "adults", anything else → "people" `[Implemented]` `base44/functions/generateChores/entry.ts:21-29`.
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

- Response schema: object with required `chores` array of objects requiring `title, description, frequency, time_estimate, priority` (all strings) `[Implemented]` `base44/functions/generateChores/entry.ts:60-79`. An empty array is returned when the model returns nothing `[Implemented]` `base44/functions/generateChores/entry.ts:82`.

### 2c. Review step

- Heading "Generated Items ({n})" with a "Select All" / "Deselect All" toggle; nothing is pre-selected `[Implemented]` `src/components/ChoreGenerator.jsx:25,375-378,90-96`.
- Each card shows title, description (two-line clamp), "⏱ {time_estimate} min" and a priority badge coloured red (high), yellow (medium), or green (low) `[Implemented]` `src/components/ChoreGenerator.jsx:408-423`.
- "Assign all to:" chips set every item's assignee set at once `[Implemented]` `src/components/ChoreGenerator.jsx:381-405`.
- Selecting an item reveals per-item overrides: **Assign To** chips including an explicit "Unassigned" chip that clears other assignees, **Frequency** select (Daily, Weekly, Bi-Weekly, Monthly), and for meals **Days of the Week** chips `Mon…Sun` `[Implemented]` `src/components/ChoreGenerator.jsx:425-505`.
- Initial per-item frequency: `weekly` for meals; otherwise the model's value when it is one of `daily, weekly, biweekly, monthly`, else `weekly` `[Implemented]` `src/components/ChoreGenerator.jsx:65-72`. Initial assignee set is the global selection or the "Unassigned" sentinel `[Implemented]` `src/components/ChoreGenerator.jsx:70`.
- Checkbox "Save selected to library for future use" `[Implemented]` `src/components/ChoreGenerator.jsx:510-513`. Its initial state is `true` on first open `[Implemented]` `src/components/ChoreGenerator.jsx:31` and `false` after the dialog has been reset `[Implemented]` `src/components/ChoreGenerator.jsx:222` (D-303).
- Footer buttons: "Back", "Save to Library" (library only), and "Add {n} Item(s)"; the latter two are disabled with no selection `[Implemented]` `src/components/ChoreGenerator.jsx:515-528`.

### 2d. What is written

- One `Chore` per selected item per assignee (or one unassigned chore when no assignee) with `status: pending`, `time_estimate` parsed from the suggestion or `30`, priority coerced to `low|medium|high` (default `medium`), frequency coerced to the four valid values (meals forced to `weekly`), `day_of_week` from the meal override, `room` = the meal type for meals or the chosen room, and `chore_type: "Meal"` for meals `[Implemented]` `src/components/ChoreGenerator.jsx:126-173`.
- When the library checkbox is on or "Save to Library" was pressed, one `ChoreLibrary` row per selected item unless an existing library row matches on case-insensitive title, frequency, room, priority and chore type. Meal library descriptions get `\nAge Group: {ageGroup}` appended `[Implemented]` `src/components/ChoreGenerator.jsx:127,176-198`.
- On completion the dialog closes and resets; on failure "Failed to assign chores. Please try again." `[Implemented]` `src/components/ChoreGenerator.jsx:201-207`.

## 3. Touchpoint 2 — Education activity generator

### 3a. Entry and inputs

- Opened from the Education page by an icon button titled "Add / Generate Activities" (wand); the dialog "Add Activities" has a mode switch "Manual Entry" / "AI Generator", defaulting to AI `[Implemented]` `src/components/ActivityGenerator.jsx:21,198-215`. Manual entry is not an AI feature and belongs to `20-features/education`.
- **Age Group** select, values `Preschool (3-5), K-1st Grade (5-7), 2-3rd Grade (7-9), 4-5th Grade (9-11), 6-8th Grade (11-14), High School (14-18), 18+` `[Implemented]` `src/components/ActivityGenerator.jsx:13,292-300`.
- **Subject** free text, placeholder "e.g. Math, Science, History" `[Implemented]` `src/components/ActivityGenerator.jsx:302-309`.
- **Activity Type** chips `assignment` / `activity`, default `activity` `[Implemented]` `src/components/ActivityGenerator.jsx:14,27,311-329`.
- **Quantity** number input with min 1, max 10, default 5 `[Implemented]` `src/components/ActivityGenerator.jsx:28,331-340`.
- "Generate Activities" is disabled until age group and subject are set `[Implemented]` `src/components/ActivityGenerator.jsx:342-345`.

### 3b. Backend call and prompt

- Requires a signed-in user and rejects requests missing age group, subject or type `[Implemented]` `base44/functions/generateActivities/entry.ts:6-16`.
- **Prompt** (verbatim) `[Implemented]` `base44/functions/generateActivities/entry.ts:18-28`:

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

- Response schema: object with required `activities` array of objects requiring `title, description, duration, materials` `[Implemented]` `base44/functions/generateActivities/entry.ts:30-51`.

### 3c. Review steps

- Step "selecting": **Select Learners** checkbox list, then "Generated Activities ({n})" with "Select All" / "Deselect All"; each row shows title, description and "⏱ {duration} • 📦 {materials}" `[Implemented]` `src/components/ActivityGenerator.jsx:349-395`. "Next: Select Plans →" is disabled until at least one learner and one activity are selected `[Implemented]` `src/components/ActivityGenerator.jsx:397-406`.
- Step "plans": **Select Plans/Subjects** lists plans belonging to the chosen learners with the learner's name; checkbox "Also create these as goals for the learners"; "Assign to {n} Plan(s)" `[Implemented]` `src/components/ActivityGenerator.jsx:410-459`.

### 3d. What is written

- One `EducationActivity` per selected plan × selected activity with the plan's learner and subject, the chosen type, `frequency: "once"`, and `notes` = `"{description}\n\nDuration: {duration}\nMaterials: {materials}"`. A row is skipped when an existing activity on the same plan has the same title (case-insensitive) and learner `[Implemented]` `src/components/ActivityGenerator.jsx:133-158`.
- When the goals checkbox is on, one `Goal` per created activity with `timeframe: "weekly"`, `status: "not_started"`, description = the suggestion's description, and `member_name` = the learner's name or "Unknown" `[Implemented]` `src/components/ActivityGenerator.jsx:160-170`.
- On failure: "Failed to assign activities. Please try again." `[Implemented]` `src/components/ActivityGenerator.jsx:186-189`.

## 4. Touchpoint 3 — Pillar activity ideas

- Entry: on the Vision Board Pillars tab each pillar card offers an "AI Goals" button (title "Generate AI goal ideas for this pillar") which opens the generator for that pillar `[Implemented]` `src/components/visionboard/PillarManager.jsx:416-425,487-497`.
- Dialog title "AI Activity Ideas — {pillar name}"; one optional input "Any specific focus? (optional)" with placeholder `e.g. "I want to sleep better"`; button "Generate Ideas", relabelled "Regenerate" after the first result `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:118-139`.
- **Data pulled from entities:** the most recent `DailyPillarTracking` for this pillar (sorted by date descending, limit 1) supplies its `date`, `rating` and optional `notes` `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:23-27`. Injected sentence: `The user's last daily assessment for this pillar (date: {date}): Rating {rating}/5.` followed by ` Notes: "{notes}"` when notes exist.
- **Prompt** (verbatim; optional lines appear only when their data exists) `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:30-46`:

  > You are a life coach. Suggest 5 specific, actionable activities for the "{pillar.name}" life pillar.
  > Pillar description: {pillar.description}
  >
  > {assessmentContext}
  > Tailor your suggestions to address the user's current state and rating.
  > Additional user context: {context}
  >
  > Return exactly 5 activities. Each activity should be:
  > - Concrete and achievable
  > - Specific to the "{pillar.name}" area of life
  > - Written as a short, actionable activity (e.g. "Run for 30 minutes", "Practice gratitude journaling", "Call a friend")
  >
  > Respond ONLY with a JSON object in this format:
  > {
  >   "activities": [
  >     {"title": "..."},
  >     ...
  >   ]
  > }

- Response schema: `{ activities: [{ title }] }` `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:47-60`.
- Review: every suggestion is pre-selected; tapping toggles; "Cancel" or "Add {n}" (disabled at zero) `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:62-63,141-176`.
- Written: `PillarActivity.bulkCreate` with `pillar_id`, `pillar_name`, `activity` = title, and `order` continuing after the pillar's existing activity count `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:79-94`. Alert: "{n} activity(ies) added to {pillar name}!" `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:99`. Closing the dialog clears suggestions, selection and context `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:102-110`.

## 5. Touchpoint 4 — Affirmation drafts

- Entry: Vision Board Affirmations card. A pillar select ("Select a pillar (optional)", first option "No specific pillar", then the 13 fixed names `Nutrition, Fitness, Mindset, Rest, Destress, Play, Education, Career, Home/Environment, Relationships, Self-esteem, Financial, Spirituality`) and a "Generate" button enabled only when a pillar is chosen `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:11-15,182-201`.
- **Data pulled from entities:** a "Focus Areas Today" strip lists pillars whose `DailyPillarTracking` row **for today** has `rating <= 3`, each as a "Generate for {pillar}" shortcut `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:32-41,152-170` (D-300).
- Guard: "Please select a pillar to generate affirmations for" `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:127-130`.
- **Prompt** (verbatim, free-text response) `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:135`:

  > Generate 3 brief, positive affirmations written in first person (using "I am", "I can", "I will", etc.) for someone focusing on improving their {pillar}. Each affirmation should be one sentence, max 15 words, personal, motivating, and actionable. Format as a numbered list.

- Presentation: the raw text is placed into the "Add New Affirmation" textarea and the pillar select is set to the pillar `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:137-138,172-180`. The account owner may edit freely.
- Written on "Add Affirmation": the textarea is split on newlines, leading numbering (`1.` / `1)`) is stripped, blank lines dropped, and one `Affirmation` is created per line with `pillar_name` when a pillar is chosen `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:53-79`.

## 6. Touchpoint 5 — Auto-generated slideshow affirmations

- Entry: Dashboard "Vision" menu → "Auto-Generated" (the sibling "Custom Slideshow" uses saved affirmations and makes no AI call) `[Implemented]` `src/pages/Dashboard.jsx:206-219,325-330`, `src/components/dashboard/DashboardSlideshow.jsx:49-52`; also from the Vision Board `[Implemented]` `src/pages/VisionBoard.jsx:447-452`.
- Loading copy "Preparing your slideshow..."; with no images: "No collage images found." / "Add images on your Vision Board page first." `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:121-144`.
- **Data pulled from entities:** the 50 most recent `DailyPillarTracking` rows and all `HealthPillar` rows. The most recent tracking date defines "the last evaluation"; pillars rated ≤ 3 on that date are the targets. With no evaluation, or with none rated ≤ 3, every pillar is targeted. With no pillars at all a fixed list `Physical Health, Mental Health, Relationships, Career & Purpose, Finances, Personal Growth, Spirituality` is used `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:55-83`.
- **Prompt** (verbatim; the bracketed sentence appears only when low pillars exist) `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:86-91`:

  > Generate personal affirmations for these life areas: {targetPillars joined by ", "}.
  > Generate EXACTLY 3 unique, different affirmations for EACH life area listed. Do not repeat any affirmation.
  > These areas scored low (3 or below) in a recent self-assessment, so make the affirmations especially uplifting, healing, and encouraging for growth in these specific areas.
  > Use a mix of "I" statements (e.g. "I am", "I have", "I embrace") and "You" statements (e.g. "You are", "You have", "You deserve"). Each affirmation must start with either "I" or "You".
  > Every affirmation must be completely unique — no two should be similar or repeat the same idea.
  > Return a JSON object with key "by_pillar" where each sub-key is exactly one of the life area names above and the value is an array of exactly 3 affirmation strings.

- Response schema: `{ by_pillar: { [name]: string[] } }` `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:92-100`.
- Presentation: groups are round-robin interleaved (first of each pillar, then second of each, …) so consecutive slides alternate focus areas; the list is handed to the slideshow player and is not stored `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:103-111,146-152`.

## 7. Touchpoint 6 — Affirmation translation in the slideshow

- Trigger: whenever the slideshow advances to an affirmation while the selected speech voice is non-English `[Implemented]` `src/components/visionboard/Slideshow.jsx:315-333`. Language is derived from the voice's language tag: `es-*` → Spanish, `fr-*` → French, `ar*` → Arabic, `zh*` → Chinese (Simplified), `de*` → German, `fil*`/`tl*` → Tagalog; anything else is English and no call is made `[Implemented]` `src/components/visionboard/Slideshow.jsx:268-283`.
- **Prompt** (verbatim, free-text response) `[Implemented]` `src/components/visionboard/Slideshow.jsx:288`:

  > Translate this affirmation to {language name}. Keep it positive and motivating. Only provide the translation, no other text:
  >
  > "{text}"

- Presentation: when a translation differs from the English text the slide shows both side by side under the labels "English" and the language's own name (`Español, Français, العربية, 中文, Deutsch, Tagalog`) `[Implemented]` `src/components/visionboard/Slideshow.jsx:605-625`. Speech reads the translation when present `[Implemented]` `src/components/visionboard/Slideshow.jsx:343`. On failure the English text is used `[Implemented]` `src/components/visionboard/Slideshow.jsx:291-294`. Nothing is stored; the chosen voice name is a device-local preference `slideshowSelectedVoice` `[Implemented]` `src/components/visionboard/Slideshow.jsx:189,734`.

## 8. Touchpoint 7 — Daily quote pipeline

### 8a. On-demand path (`fetchDailyQuote`)

- Callers: the Dashboard quote widget when no `DailyQuote` exists for today, its "New Quote" (force) and "Generate Quote" / "Try Again" buttons `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:28-58,79-92,104-106`; the Quotes page on load (force false, raced against a 15-second timeout) and its "New Quote" (force true) `[Implemented]` `src/pages/Quotes.jsx:65-106`. The date sent is the device's local `YYYY-MM-DD` `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:7-10,44`, `src/pages/Quotes.jsx:37-40,71,92`.
- **AR-AI-05 — One quote per account per date.** If a quote for the date exists and `force` is false, the most recent is returned and any duplicates for that date are deleted; with `force` every quote for the date is deleted first `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:19-33`.
- **AR-AI-06 — External source first, model second.** Up to 8 attempts fetch `https://api.quotable.io/quotes/random?maxLength=220&limit=5`; the first candidate whose text (trimmed, lower-cased) is not among the account's 200 most recent quotes wins `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:15-17,35-54`. Only when no candidate survives is the model asked.
- **Fallback prompt** (verbatim; `{recent}` is the first 60 characters of each of the 20 most recent quotes, quoted and comma-separated, or `none`) `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:57-68`:

  > Generate a single unique inspirational or motivational quote. It must NOT be any of these recently used quotes: {recent}. Pick from a wide variety of authors, philosophers, scientists, writers, athletes, and leaders throughout history — choose someone different each time. Return ONLY a JSON object: {"quote": "...", "author": "Full Name"}

- Response schema `{ quote, author }`; the result is saved as a `DailyQuote` with `is_favorite: false` and returned. With no quote from either source the function answers "Could not generate a quote" `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:59-84`.

### 8b. Scheduled path (`generateDailyQuotes`)

- The workflow "Midnight Daily Quote Generator" runs `0 7 * * *` UTC (its description: "Generates a new daily quote for all users at midnight Pacific time (07:00 UTC)") and invokes `generateDailyQuotes` `[Implemented]` `base44/workflows/Midnight Daily Quote Generator.jsonc:1-18,26-36`.
- The function requires the caller to be an admin `[Implemented]` `base44/functions/generateDailyQuotes/entry.ts:12-18`; "today" is the server's `en-CA` local date `[Implemented]` `base44/functions/generateDailyQuotes/entry.ts:20` (D-302).
- For every `User`: skip when a quote for today already exists; otherwise the same quotable.io loop (8 attempts, 1-second pause between attempts) against that user's 200 most recent quotes, then the model fallback, then `DailyQuote.create` with `created_by` set to the user `[Implemented]` `base44/functions/generateDailyQuotes/entry.ts:23-90`.
- **Fallback prompt** (verbatim) `[Implemented]` `base44/functions/generateDailyQuotes/entry.ts:67`:

  > Generate a single unique inspirational or motivational quote. It must NOT be any of these recently used quotes: {recent}. Pick from a wide variety of authors throughout history. Return ONLY a JSON object: {"quote": "...", "author": "Full Name"}

  This wording differs from the on-demand prompt (D-301).

- The Quotes page reloads itself when the local date changes (checked every 60 seconds) so the new day's quote appears `[Implemented]` `src/pages/Quotes.jsx:54-63`.

## 9. Business rules (consolidated)

- **AR-AI-07** Quantity limits: chores 1–50 (stepper), activities 1–10 (input bounds), pillar ideas fixed at 5, affirmation drafts fixed at 3, slideshow exactly 3 per pillar, quotes exactly 1 `[Implemented]` `src/components/ChoreGenerator.jsx:351-361`, `src/components/ActivityGenerator.jsx:333-339`, `src/components/visionboard/PillarGoalGenerator.jsx:35`, `src/components/visionboard/AffirmationManager.jsx:135`, `src/components/dashboard/DashboardSlideshow.jsx:87`, `base44/functions/fetchDailyQuote/entry.ts:60`.
- **AR-AI-08** Model output is normalised before storage: chore priority and frequency are coerced to the entity enums, meal frequency is always weekly, time estimates default to 30 minutes `[Implemented]` `src/components/ChoreGenerator.jsx:155-160,170`; activity frequency is always `once` `[Implemented]` `src/components/ActivityGenerator.jsx:155`.
- **AR-AI-09** Duplicate guards on save: library chores (title/frequency/room/priority/type) `[Implemented]` `src/components/ChoreGenerator.jsx:178-184`; education activities (plan + title + learner) `[Implemented]` `src/components/ActivityGenerator.jsx:142-146`; quotes (text, case-insensitive, last 200) `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:16-17,46`.
- **AR-AI-10** The most recent daily evaluation steers vision-board AI: pillar ideas quote the latest rating and notes `[Implemented]` `src/components/visionboard/PillarGoalGenerator.jsx:23-32`; the auto slideshow targets pillars rated ≤ 3 on the latest date `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:72-83`; the affirmation shortcuts use today's ratings ≤ 3 `[Implemented]` `src/components/visionboard/AffirmationManager.jsx:34-36`.
- **AR-AI-11** Quote text and author are stored as returned; no attribution check is applied `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:69-82`.

## 10. Data

| Entity | Operations by AI touchpoints | Citation |
|---|---|---|
| `Chore` | create | `src/components/ChoreGenerator.jsx:161-172` |
| `ChoreLibrary` | list, create | `src/components/ChoreGenerator.jsx:127,188-196` |
| `EducationActivity` | list, create | `src/components/ActivityGenerator.jsx:137,149-157` |
| `Goal` | create | `src/components/ActivityGenerator.jsx:162-168` |
| `DailyPillarTracking` | filter (latest for pillar), filter (today), list (-date, 50) | `src/components/visionboard/PillarGoalGenerator.jsx:23`, `src/components/visionboard/AffirmationManager.jsx:35`, `src/components/dashboard/DashboardSlideshow.jsx:58` |
| `HealthPillar` | list | `src/components/dashboard/DashboardSlideshow.jsx:59` |
| `PillarActivity` | list, bulkCreate | `src/components/visionboard/PillarGoalGenerator.jsx:83-94` |
| `Affirmation` | list, create | `src/components/visionboard/AffirmationManager.jsx:45,65-70`, `src/components/dashboard/DashboardSlideshow.jsx:51` |
| `DailyQuote` | list (-created_date, 200), filter, create, delete | `base44/functions/fetchDailyQuote/entry.ts:16,25,32,77`, `base44/functions/generateDailyQuotes/entry.ts:30,37,81` |
| `User` | list (scheduled job only) | `base44/functions/generateDailyQuotes/entry.ts:23` |

Field references: `DailyPillarTracking.rating` (1–5) and `.notes` `base44/entities/DailyPillarTracking.jsonc:17-27`; `Affirmation.text/pillar_name` `base44/entities/Affirmation.jsonc:4-11`; `PillarActivity.activity/order` `base44/entities/PillarActivity.jsonc:12-20`; `DailyQuote.quote/author/date/is_favorite` `base44/entities/DailyQuote.jsonc:4-19`.

## 11. Described claims

- Landing page: "AI-generated chore ideas tailored to age and room" `[Described]` `src/pages/LandingPage.jsx:9`; "AI Meal Planning — Generate age-appropriate meal ideas for Breakfast, Lunch, Dinner, or Snacks — perfect for kids ages 3 and up through adults." `[Described]` `src/pages/LandingPage.jsx:10`; "Start each day with an inspiring AI-generated quote, personal affirmations, and vision-focused slideshows." `[Described]` `src/pages/LandingPage.jsx:13` (D-304).
- User Manual: Vision slideshow "Auto-Generated (AI-curated based on your lowest-scoring health pillars)" `[Described]` `src/pages/UserManual.jsx:40`; "Displays an AI-generated motivational quote." `[Described]` `src/pages/UserManual.jsx:64`; "Use AI-powered chore generation or manually create tasks" `[Described]` `src/pages/UserManual.jsx:186`; AI Chore Generator steps naming a "Generate with AI" button and age groups "Adults, Teens, Older Children, Younger Children, or Mixed" with default quantity 5 `[Described]` `src/pages/UserManual.jsx:200-208` (D-305, D-306); "AI Activity Generator & Library … age-appropriate, hands-on activities" `[Described]` `src/pages/UserManual.jsx:253-256`; "Each day, an AI-generated motivational quote is displayed automatically." `[Described]` `src/pages/UserManual.jsx:330-331`; Affirmation Manager "generate them via AI for specific pillars" `[Described]` `src/pages/UserManual.jsx:371`; Slideshow Auto-Generated "AI generates affirmations specifically for pillars you rated 3 or below in your most recent evaluation, interleaved in round-robin order" `[Described]` `src/pages/UserManual.jsx:373`.
- Onboarding: Chores step "2. Generate Meal Ideas with AI — Use the AI Wand button and select 'Meal' as the type. Choose Breakfast, Lunch, Dinner, or Snack — and pick an age group (including ages 3–5 for young children) to get personalized, age-appropriate meal suggestions." `[Described]` `src/components/onboarding/ChoresOnboarding.jsx:13-14`; Dashboard step 3 "Choose Auto-Generated for AI-powered suggestions based on your health pillars" `[Described]` `src/pages/Dashboard.jsx:47`; Vision Board step 4 "let AI auto-generate one based on your pillar weaknesses. The slideshow includes at least one affirmation from each pillar." `[Described]` `src/components/visionboard/OnboardingDialog.jsx:24`; Quotes step 1 "A fresh inspirational quote is generated automatically every day at midnight." `[Described]` `src/pages/Quotes.jsx:17`.

## 12. Discrepancies and open questions

- **D-300** Focus pillars come from different dates: the affirmation shortcuts use tracking rows dated today (`src/components/visionboard/AffirmationManager.jsx:34-36`) while the auto slideshow uses the most recent evaluation date (`src/components/dashboard/DashboardSlideshow.jsx:72-77`).
- **D-301** The quote fallback prompt wording differs between the on-demand function (`base44/functions/fetchDailyQuote/entry.ts:60`) and the scheduled function (`base44/functions/generateDailyQuotes/entry.ts:67`).
- **D-302** "Today" for a quote is the device's local date when requested from the UI (`src/components/dashboard/DashboardQuote.jsx:7-10`) and the server's date when generated by the midnight job (`base44/functions/generateDailyQuotes/entry.ts:20`).
- **D-303** The "Save selected to library for future use" checkbox starts checked on first open (`src/components/ChoreGenerator.jsx:31`) and unchecked after any reset (`src/components/ChoreGenerator.jsx:222`).
- **D-304** Landing page and manual describe the daily quote as AI-generated (`src/pages/LandingPage.jsx:13`, `src/pages/UserManual.jsx:64,330`); the pipeline uses the model only when quotable.io yields no unused quote (`base44/functions/fetchDailyQuote/entry.ts:35-57`).
- **D-305** The manual lists chore age groups "Adults, Teens, Older Children, Younger Children, or Mixed" (`src/pages/UserManual.jsx:204`); the generator offers `3-5, 5-7, 8-10, 11-13, 14-17, 18+, Adult` (`src/components/ChoreGenerator.jsx:12`).
- **D-306** The manual names a "Generate with AI" button (`src/pages/UserManual.jsx:202,255`); the controls are wand icon buttons titled "AI Generator" and "Add / Generate Activities" (`src/components/ChoreGenerator.jsx:231`, `src/components/ActivityGenerator.jsx:200`).
- **Q-300** (§8) Is the marketing claim "AI-generated quote" meant to describe the fallback only, or is the external quote source incidental?
- **Q-301** (§2c) Which default is intended for "Save selected to library for future use"?
