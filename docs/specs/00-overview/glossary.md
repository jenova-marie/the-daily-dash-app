# Glossary

Canonical vocabulary for every spec in this corpus. The **Do not use** column lists synonyms that appear
in the prototype's UI or code but must not be used as the term of record; mention them once in a spec
only to note that the UI displays them.

| Term | Definition | Do not use | Source |
|---|---|---|---|
| **account owner** | The single authenticated user who owns all data. There is one tenant per account. | user (when meaning the person), admin (different concept) | `base44/entities/*.jsonc` rls |
| **admin** | A user whose `role` is `admin`; may run seed/backfill/cleanup functions. Not a product persona. | superuser | `base44/entities/User.jsonc` |
| **household member** | A named person (with colour) the account owner can assign chores and goals to. Not a login. Chores reference a member by id (`Chore.assigned_to` holds `ChoreUser.id`); goals reference a member by name (`Goal.member_name`). The Goals UI displays "family members" for the same entity. "Assignee" is acceptable as the role word for the member a chore is assigned to. | family member, user, person | `base44/entities/ChoreUser.jsonc` |
| **learner** | A named person (with grade level and colour) the account owner plans education for. | student, child, kid | `base44/entities/Learner.jsonc` |
| **label** | A free-text, colour-coded user tag on a task, checklist item, or goal. Shared history across features. | category (for these three entities), tag | `src/components/LabelPicker.jsx` |
| **time-of-day bucket** | The checklist grouping `morning / afternoon / evening / anytime`. Stored in `DailyChecklist.category`. | category, section | `base44/entities/DailyChecklist.jsonc` |
| **link category** | A device-local grouping for links with an icon and colour. | folder, tag | `src/pages/Links.jsx` |
| **room** | The location a chore belongs to. For meals, the field holds the meal slot instead. | location (UI label only), area | `src/lib/choreRooms.js` |
| **meal** | A chore whose `chore_type` is one of Breakfast, Lunch, Dinner, Snack, Meal. Shown on the Menu, hidden from the chore list. | menu item, recipe | `src/pages/Chores.jsx` |
| **chore library** | Reusable, unassigned chore templates. | saved chores, favourites | `base44/entities/ChoreLibrary.jsonc` |
| **activity library** | Reusable education activities saved per learner. | favourites, saved activities | `base44/entities/FavoriteActivity.jsonc` |
| **plan** | An education plan: one learner × one subject. | course, class | `base44/entities/EducationPlan.jsonc` |
| **activity** | An education item inside a plan, of type `assignment` or `activity`. | lesson, task | `base44/entities/EducationActivity.jsonc` |
| **goal** | A user objective with a timeframe, derived progress, and milestone tasks. | objective, target | `base44/entities/Goal.jsonc` |
| **milestone task** | A step under a goal (`GoalTask`), optionally with an occurrence count. | subtask, goal task (in prose), milestone | `base44/entities/GoalTask.jsonc` |
| **occurrence** | The number of times a task or milestone task must be completed; tracked by `completed_count`. | repetition, rep | `base44/entities/Task.jsonc` |
| **recurrence pattern** | How a task repeats: daily, weekly, biweekly, monthly, days_of_week, occurrences. | frequency (for Task; frequency is the Chore/Education/Goal term), schedule | `base44/entities/Task.jsonc` |
| **frequency** | How a chore, activity, or milestone task repeats. | recurrence (for these entities) | `base44/entities/Chore.jsonc` |
| **schedule item** | Any row of `ScheduleItem`: a time-boxed block on a date with a source type. | event (unless calendar-sourced), appointment. "Block" is acceptable for the rendered representation of a schedule item on the time grid. | `base44/entities/ScheduleItem.jsonc` |
| **event** | A schedule item whose source type is `calendar` (imported from Google) or `event` (created in the Calendar page). | schedule item (when specifically calendar-sourced), meeting | `src/pages/CalendarPage.jsx` |
| **custom block** | A schedule item with source type `custom`, created from the Item Library's Recent tab (a typed title with a start time and duration); it has a backing task labelled "Custom". | custom event, manual item | `src/pages/DailySchedule.jsx` |
| **source type** | The origin of a schedule item: calendar, event, task, education, chore, goal, custom. | kind, category | `base44/entities/ScheduleItem.jsonc` |
| **item library** | The Daily Schedule side panel offering unscheduled tasks, the next milestone task per goal, recent-history entries, and the Chores/Edu quick links. | backlog, sidebar | `src/pages/DailySchedule.jsx` |
| **daily to-do** | The list on the Daily Schedule page composed of the selected date's schedule items plus tasks due on that date. | to-do list, today list | `src/components/DailyToDo.jsx` |
| **dismiss** | Hide a schedule item from one view without deleting it (`hidden_from_grid`, `hidden_from_todo`). Together with **remove from app** these make up the three-flag dismissal model in `10-architecture/schedule-hub.md`. | hide (acceptable in UI quotes), remove | `base44/entities/ScheduleItem.jsonc` |
| **remove from app** | Mark a calendar-sourced schedule item `deleted_from_app` so it stays gone locally while the Google event survives. | soft delete, delete here | `src/pages/CalendarPage.jsx` |
| **trash** | The `TrashBin` holding deleted tasks for later restore. | recycle bin, archive | `base44/entities/TrashBin.jsonc` |
| **archive** | A goal marked `archived`; also the Goals tab listing them. | trash, hide | `base44/entities/Goal.jsonc` |
| **import** | Sync direction Google → app. | pull, download, sync (unqualified) | `base44/functions/syncGoogleCalendarToApp` |
| **push** | Sync direction app → Google. | export, upload, sync (unqualified) | `base44/functions/syncAppEventToGoogle` |
| **connector** | A stored Google OAuth connection (Calendar or Tasks are separate). | integration, link | `base44/functions/checkConnectorStatus` |
| **tombstone** | A `DeletedSyncItem` recording something that disappeared from Google, awaiting user review. | deleted item, ghost | `base44/entities/DeletedSyncItem.jsonc` |
| **pillar** | One of 13 wellness areas the user rates daily (`HealthPillar`). | health pillar (acceptable long form), area, dimension | `base44/entities/HealthPillar.jsonc` |
| **pillar activity** | A reusable activity attached to a pillar that can be checked during evaluation or turned into a goal. | habit, action | `base44/entities/PillarActivity.jsonc` |
| **daily evaluation** | The wizard that rates every visible pillar 1–5 and records gratitude for a date. | assessment, check-in, daily eval (UI label only) | `src/components/visionboard/DailyEvaluation.jsx` |
| **focal area** | A pillar needing attention. The threshold is "rated 3 or below" in the manual, LowScorePillars, AffirmationManager and the slideshow; the Dashboard widget shows the 3 lowest of the latest evaluation with no threshold, and the Weekly Review the 3 lowest averages (see D-703). | focus area (UI label only), weak area, low pillar | `src/components/dashboard/DashboardFocalAreas.jsx` |
| **affirmation** | A short first- or second-person motivational statement, optionally tied to a pillar. | quote, mantra | `base44/entities/Affirmation.jsonc` |
| **collage** | The set of vision-board images (shared images plus private images). | board. "Gallery" is acceptable for the Collage card's image grid. | `base44/entities/CollageImage.jsonc` |
| **slideshow** | The full-screen image + affirmation player, in Auto-Generated or Custom mode. | presentation, vision | `src/components/visionboard/Slideshow.jsx` |
| **daily quote** | The one quote per user per date, with optional reflection. | quote of the day | `base44/entities/DailyQuote.jsonc` |
| **reflection** | The user's written response to a daily quote. | journal entry, note | `base44/entities/DailyQuote.jsonc` |
| **widget** | A dashboard card that can be reordered. | card, panel, tile | `src/pages/Dashboard.jsx` |
| **walkthrough** | A first-visit onboarding dialog for a page. | tour, guide (UI button label only), tutorial | `src/components/onboarding/` |
| **feature toggle** | The Settings switches that hide Chores, Education, or Vision Board. | flag, module switch | `base44/entities/ThemeSettings.jsonc` |
| **device-local preference** | State kept only in the browser's localStorage; does not follow the account. | local setting, cache | `10-architecture/preferences.md` |
| **account preference** | State stored in `ThemeSettings` (or another entity) that follows the account across devices. | server setting, cloud setting | `base44/entities/ThemeSettings.jsonc` |
| **export** | Print or email a formatted view. | share, download | `10-architecture/export-print-email.md` |
| **today** | The local calendar date on the user's device, formatted `YYYY-MM-DD`, unless a spec says otherwise. | current date | `10-architecture/time-and-date-semantics.md` |

## Terms added during synthesis

Proposed by feature and architecture writers and merged here.

| Term | Definition | Do not use | Source |
|---|---|---|---|
| **active hours** | The device-local start and end hour that bound the Daily Schedule grid (UI: "Active Schedule Hours"). | grid hours, day range | `src/pages/DailySchedule.jsx` |
| **affirmation queue** | The shuffled list the slideshow draws affirmations from; no affirmation repeats until the whole set has cycled. | playlist | `src/components/visionboard/Slideshow.jsx` |
| **AQI band** | The colour class assigned to a US air-quality index value (Good … Hazardous). | pollution level | `src/components/WeatherWidget.jsx` |
| **auto-deselect** | Setting a calendar's `is_selected` to false when Google returns 404 for it during an import. | unsubscribe, drop | `base44/functions/syncGoogleCalendarToApp` |
| **batch mode** | A list selection mode with per-row (and per-group) checkboxes and an action bar; entered with "Select" on Tasks and Checklist and called "bulk mode" on the Chores page. | bulk mode (Chores UI label only), multi-select mode | `src/components/SwipeableListItem.jsx` |
| **cache field** | A value copied from another row at write time and not refreshed afterwards (e.g. `pillar_name`, `ScheduleItem.title`). | denormalised column | `10-architecture/data-model/relationships.md` |
| **carry-over item** | A view-only block drawn at 00:00 on the selected day for a previous-day schedule item that spans midnight ("↑ Continued from previous day"). | continuation, overflow | `src/pages/DailySchedule.jsx` |
| **checklist view** | One of the views stepped through with the ‹ › arrows on the Daily Checklist: All, one time-of-day bucket, one label, or Completed. | page (collides with app pages) | `src/pages/DailyChecklist.jsx` |
| **connector id** | The platform identifier of a stored Google OAuth connection; several id pairs appear in the code (see D-200 / D-330). | integration id | `10-architecture/google-sync.md` |
| **derivation** | The recomputation of a goal's progress, status, archived flag and timestamps from its milestone tasks after every change. | sync, refresh | `src/pages/Goals.jsx` |
| **displayed month / displayed week** | The period the Calendar card shows, tracked independently of the selected date. | current month | `src/pages/CalendarPage.jsx` |
| **due-task row** | A synthetic daily to-do row (id `due-task-<taskId>`) for a task due on the date that has no task-sourced or custom-sourced schedule item that day. | virtual task, ghost row | `src/components/DailyToDo.jsx` |
| **evaluation date** | The date a daily evaluation targets, chosen with the card's calendar button; defaults to today. | eval day | `src/components/visionboard/DailyEvaluation.jsx` |
| **export tier** | One of the three export mechanisms: card body, structured format component, hand-built HTML. | print mode | `10-architecture/export-print-email.md` |
| **first-/second-generation onboarding** | Walkthrough dismissal persisted device-only (first) versus account map plus device mirror (second). | old/new onboarding | `10-architecture/preferences.md` |
| **floating notice** | The fixed bottom-right message box on Settings that reports sync, fetch and delete outcomes. | toast (Settings has none) | `src/pages/Settings.jsx` |
| **future-dated task** | A non-completed task whose due date is after today; dimmed in the Active view. | upcoming task (Education uses "Next") | `src/pages/Tasks.jsx` |
| **Google-linked event** | A schedule item whose `google_event_id` is set; delete-choice and push-on-edit rules key off it. | synced event | `src/pages/CalendarPage.jsx` |
| **group exception** | A list group toggled away from the page-wide collapsed or expanded state. | override | `10-architecture/shared-interactions.md` |
| **implicit field** | `id`, `created_by`, `created_date`, `updated_date`, supplied by the platform on every row. | system column | `10-architecture/data-model/README.md` |
| **meal slot** | The meal-time value held in `Chore.room` for a meal (Breakfast/Lunch/Dinner/Snack/Meal; anything else displays as "Other"). | meal type (that is `chore_type`), room (for meals) | `src/pages/Chores.jsx` |
| **meal type** | The `chore_type` value that marks a chore as a meal (Breakfast, Lunch, Dinner, Snack, Meal). | meal category | `src/pages/Chores.jsx` |
| **merged row** | One Chores-tab row standing for several chore rows with identical title, room and frequency, listing every assignee. | grouped chore, duplicate | `src/pages/Chores.jsx` |
| **missing-time sentinel** | The string `99:99` substituted for an absent HH:MM so untimed items sort last. | null time | `10-architecture/time-and-date-semantics.md` |
| **next occurrence** | The new pending task created when a recurring task is completed. | clone, repeat instance | `src/pages/Tasks.jsx` |
| **now line** | The red current-time marker on today's Daily Schedule grid. | time cursor | `src/pages/DailySchedule.jsx` |
| **occurrence task** | A task (or milestone task) that completes only after N checks tracked by `completed_count`. | counted task, multi-occurrence task | `base44/entities/Task.jsonc` |
| **orphan** | A schedule item whose `source_id` no longer resolves to an entity; removed by the Daily Schedule clean-up pass. | dangling item | `10-architecture/schedule-hub.md` |
| **planned day** | A weekday on which a meal is shown (frequency daily, or `day_of_week` contains the day). | scheduled day | `src/components/MenuChoresWidget.jsx` |
| **post-connection notice** | The dismissable banner shown in Settings after a connector is confirmed connected. | coaching banner | `src/pages/Settings.jsx` |
| **preset** | A named ambient audio track selectable in the slideshow. | soundtrack, sound | `src/components/visionboard/Slideshow.jsx` |
| **private image** | A `UserCollageImage` row uploaded privately and rendered through a time-limited signed URL. | user image, secure image | `base44/entities/UserCollageImage.jsonc` |
| **queued goal** | A goal added "to plan" during a daily evaluation and held in memory until Complete writes it. | pending goal, draft goal | `src/components/visionboard/DailyEvaluation.jsx` |
| **quick task** | A task created from the Item Library "+" with label "Quick Task" (custom blocks create a task labelled "Custom"). | inline task | `src/pages/DailySchedule.jsx` |
| **recent history** | The device-local list (max 10) of `{title, duration}` entries on the Item Library's Recent tab. | custom history, history | `src/pages/DailySchedule.jsx` |
| **review week** | The Sunday–Saturday week containing the Weekly Review's review date. | current week | `src/components/visionboard/WeeklyReview.jsx` |
| **seed row** | A row created automatically on first visit or by a scheduled function (13 pillars, 5 activities per pillar, default collage images). | default record, fixture | `10-architecture/data-model/seed-data.md` |
| **seed set** | The `is_default`-flagged shared images copied into an empty account's collage. | default images | `base44/functions/initializeDefaultCollageImages` |
| **selected date** | The single day whose events the Calendar's side panel lists (Calendar) or the day the Daily Schedule shows. | current day, chosen day | `src/pages/CalendarPage.jsx` |
| **service-role write** | A backend read or write through the platform's service role that is not subject to the per-user row rule. | admin write, bypass | `10-architecture/data-model/README.md` |
| **shared image** | A `CollageImage` row addressed by a public URL (UI and manual say "public image"). | public image, collage image (when specifically shared) | `base44/entities/CollageImage.jsonc` |
| **singleton by convention** | An entity meant to have one row per account, enforced only by reading the most recently updated row (`ThemeSettings`, `SyncState`, `ReminderSettings`). | settings record | `10-architecture/data-model/README.md` |
| **soft reference** | A string field holding another row's display name rather than its id (`Goal.member_name`, `*.pillar_name`). | loose FK, name link | `10-architecture/data-model/relationships.md` |
| **status pill** | The All / Due Today / Done toggle buttons on the Chores tab; distinct from the entity status field. | status filter, tab | `src/pages/Chores.jsx` |
| **status view** | The pill-selected Education view: Due / Past / Next / Done / All. | tab, filter | `src/pages/Education.jsx` |
| **subject card** | The Education card for one learner × one subject holding its plan row(s) and activities. | plan card, course card | `src/components/education/SubjectCard.jsx` |
| **Suggested Goals panel** | The per-pillar list in a daily evaluation step that offers each pillar activity as a goal. | goal suggestions | `src/components/visionboard/DailyEvaluation.jsx` |
| **sync sources** | The account-wide set of {calendar, tasks} chosen in the "What would you like to sync?" dialog (`ThemeSettings.sync_sources`). | sync options | `src/pages/Settings.jsx` |
| **sync window** | The date range an import reads (manual −90/+60 days; scheduled −30 days onward). | date range, horizon | `10-architecture/google-sync.md` |
| **synthetic row** | A view-only row composed at render time and never stored (`due-task-<id>`, `carryover-<id>`). | virtual row, ghost | `10-architecture/schedule-hub.md` |
| **timeframe** | The `Goal.timeframe` value: daily, weekly, monthly, annual, 3_year, 5_year, occurrences. | horizon, period | `base44/entities/Goal.jsonc` |
| **today formatter** | One of four derivations of the YYYY-MM-DD "today" string used in the code (local literal; date-fns local; UTC ISO; server locale). Feature specs name which one they use. | date helper | `10-architecture/time-and-date-semantics.md` |
| **touchpoint** | One place the product calls a language model. | AI feature, integration point | `10-architecture/ai-services.md` |
| **update no-op rule** | The manual calendar import skips a write when title, date, start and end are unchanged. | idempotent update | `base44/functions/syncGoogleCalendarToApp` |
| **weekly count** | For a checklist item, the number of dates in the current Sunday–Saturday week with a completion; shown as n/7. Non-consecutive days count. | streak | `src/lib/useWeeklyChecklistCounts.js` |
| **widget registry** | The fixed map of eight dashboard widget ids to titles and components. | widget list | `src/pages/Dashboard.jsx` |
| **write-through** | Updating a schedule item's source entity as a side effect of completing the item, and vice versa. | two-way sync, cascade | `10-architecture/schedule-hub.md` |
| **background library** | The account owner's saved background URLs (`ThemeSettings.background_library`, mirrored device-locally with a cap of 20), shown as "My Backgrounds". | my backgrounds (UI label only), gallery | `src/pages/ThemeEditor.jsx` |
| **default backgrounds** | The 21 built-in gallery URLs on the Theme Editor page. | background library, boot library | `src/pages/ThemeEditor.jsx` |
| **live apply** | Theme Editor edits applied to the running app before any save. | auto-save | `src/pages/ThemeEditor.jsx` |
| **past quotes** | The up-to-50 newest daily quotes listed on the Quotes page (manual says "Quote History"). | quote history, archive | `src/pages/Quotes.jsx` |
| **link thumbnail** | A link's `thumbnail_url`: either an image URL or the encoded `icon:<IconName>|<hex>` value. | icon, preview | `src/pages/Links.jsx` |
| **Uncategorized** | The grouped-view section for links with an empty category; not a stored link category. | no category | `src/pages/Links.jsx` |
| **public path** | One of the six routes rendered without a session and outside the sidebar shell (/, /auth, /accept-terms, /reset-password, /privacy-policy, /terms-of-use). | public route, unauthenticated page | `src/App.jsx` |
| **last location** | The device-local record of the most recently visited non-public path, restored on page reload. | previous page | `src/App.jsx` |
| **dismissal key** | The string under which a walkthrough dismissal is stored on the device and in the account map. | onboarding flag | `20-features/onboarding/spec.md` |
| **account map** | The JSON object in `ThemeSettings.onboarding_status` holding dismissal keys that follow the account. | onboarding status blob | `base44/entities/ThemeSettings.jsonc` |
