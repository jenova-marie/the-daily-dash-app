# Constitution — the principles the prototype embodies

**Area:** overview · **Level:** 0 · **Status:** draft

**Tag summary:** Implemented 83 · Described 18 · Partial 5

**Sources owned:** none (synthesis). Each principle is stated as a rule (`PR-nn`), followed by citations into the specs and sources that show it in action, and a "tensions" note listing where the code honours it only in part. Tensions cite existing `D-`/`Q-` ids; nothing here overrides the owning spec.

A principle is recorded here only when at least two independent surfaces implement it. Where the marketing or manual copy states the principle in its own words, the quotation is given as `[Described]`.

## PR-01 — One account is one household

**Rule.** All data belongs to a single signed-in account owner. Household members and learners are records inside that account, used to assign and file work; they are not logins.

- Every entity except `User` restricts create, read, update and delete to rows whose creator is the signed-in account `[Implemented]` `10-architecture/auth-and-account.md` AR-AUTH-07; `10-architecture/domain-model.md` §2 ("Nothing in the model represents a second login sharing data").
- A **household member** is a name and colour; chores reference it by id and goals by display name `[Implemented]` `base44/entities/ChoreUser.jsonc:5-13`, `20-features/chores/spec.md` BR-CHORE-06, `20-features/goals/spec.md` BR-GOAL-04.
- The same member rows serve the Chores page ("Household Members") and the Goals page ("Manage Family Members") `[Implemented]` `20-features/chores/spec.md` BR-CHORE-23, `20-features/goals/spec.md` §4 "Household members".
- A **learner** is a name and grade level created by the account owner; deleting a learner deletes that learner's plans and activities `[Implemented]` `20-features/education/spec.md` §4.2, BR-EDU-05.
- Defaults point back at the owner: a new goal is assigned to the signed-in user's full name; with no learners, a plan's learner is the user's full name `[Implemented]` `20-features/goals/spec.md` BR-GOAL-04, `20-features/education/spec.md` BR-EDU-02.
- Walkthrough copy states the same: "Goals are assigned to you by default." and "Plans are assigned to you by default, but you can add other learners anytime." `[Described]` `src/components/onboarding/GoalsOnboarding.jsx:12`, `src/components/onboarding/EducationOnboarding.jsx:9`.

**Tensions.**
- A plan created while no learners exist stores the user's full name as `learner_id` and is then shown nowhere (D-652, Q-650).
- Goals created from the Pillars tab carry the member name "Self" while those queued in the evaluation carry the user's full name (D-701).
- Whether separate logins for a household are a planned direction is open (Q-1001, `product-vision.md`).

## PR-02 — Everything in one place

**Rule.** Work from every source converges on a shared table and a single landing page; the account owner does not visit each feature to learn what today holds.

- **The schedule hub.** Google events, Calendar-page events, tasks, milestone tasks, and custom blocks are all rows of one `ScheduleItem` shape, read by the Daily Schedule grid, the daily to-do, the Calendar page, and the Dashboard schedule widget `[Implemented]` `10-architecture/schedule-hub.md` AR-HUB-01, §3b, §4a.
- **The Dashboard aggregates.** Eight widgets read, between them, `HealthPillar`, `DailyPillarTracking`, `ReminderSettings`, `DailyGratitude`, `DailyChecklist`, `ChecklistCompletion`, `ScheduleItem`, `Task`, `Chore`, `ChoreUser`, `Goal`, `DailyQuote`, and the page itself reads `ThemeSettings`, `User`, `Chore`, and `EducationActivity` for its greeting and badges `[Implemented]` `20-features/dashboard/spec.md` §4.2, §6; widget data in `20-features/vision-board/spec.md` §7, `daily-checklist/spec.md` §4.10, `daily-schedule/spec.md` §4 "Dashboard widget", `tasks/spec.md` §4.9, `chores/meal-planning.md` §4, `goals/spec.md` §4 "Dashboard", `quotes/spec.md` §7.
- **The daily to-do composes.** The day's schedule items plus every task due that day, minus dismissed rows, in one list `[Implemented]` `20-features/daily-schedule/daily-todo.md` BR-TODO-01.
- **The Daily Schedule page embeds** the to-do, the condensed checklist, the Menu & Chores card, and the item library beside the grid `[Implemented]` `20-features/daily-schedule/spec.md` §4 "Layout regions".
- The landing page and manual state the intent: "one beautiful, distraction-free space"; "keep your whole life organized in one place" `[Described]` `src/pages/LandingPage.jsx:39`, `src/pages/UserManual.jsx:14`.

**Tensions.**
- No code path creates `chore` or `education` schedule items, although the enum, the to-do, and the manual all expect them (D-206, Q-203).
- The Dashboard schedule widget shows only `calendar` and `event` rows; task, goal and custom blocks never appear there (BR-SCHED-17, `20-features/daily-schedule/spec.md`).
- The Dashboard page loads its badges once per mount with no subscription or timer (BR-DASH-10); feature toggles do not hide widgets (D-120).

## PR-03 — Dismissal is not deletion

**Rule.** Removing something from a view keeps the record. Deletion is a separate, named choice, and where it is offered a recovery path is usually offered too.

- **Three independent flags** on a schedule item: `hidden_from_grid`, `hidden_from_todo`, `deleted_from_app`; none deletes the row and none touches Google `[Implemented]` `10-architecture/schedule-hub.md` AR-HUB-12..14, AR-HUB-18.
- The to-do's remove dialog labels the distinction: "Keep in Calendar — Remove from To Do, keep visible on Calendar page"; "Send to Item Library — Keep it available to reschedule later"; "Hide from Schedule Grid — Keep in To Do list, but remove from the time grid"; versus "Delete from App — Permanently remove from this app" `[Implemented]` `src/components/SwipeableToDoItem.jsx:124-198` (`20-features/daily-schedule/daily-todo.md` §5).
- Hidden grid items are listed in a hidden panel with "Restore to grid"; hidden to-do rows under "Hidden from To Do" with "Unhide"; the Calendar page offers "Re-add to To Do" `[Implemented]` `10-architecture/schedule-hub.md` AR-HUB-12, AR-HUB-13.
- **Remove from app** keeps a `calendar` row so a re-import recognises rather than recreates it `[Implemented]` `10-architecture/schedule-hub.md` AR-HUB-14, AR-HUB-15.
- **Trash.** A single-row task delete snapshots the task before deleting it; Settings restores it as a new record `[Implemented]` `20-features/settings/trash-bin.md` §2, BR-SET-40.
- **Archive.** Goals are archived, not deleted, when complete, and "Restore" brings them back to In Progress `[Implemented]` `20-features/goals/spec.md` BR-GOAL-10, `milestone-tasks.md` BR-GOAL-T06.
- **Hide.** Pillars are hidden from evaluations while their history stays; collage images are hidden from the slideshow while staying in the gallery `[Implemented]` `20-features/vision-board/health-pillars.md` BR-VB-PIL-02, `collage.md` BR-VB-COL-03.
- The manual states it for the grid: "Hide individual items from the grid without deleting them — restore from the hidden panel at any time." `[Described]` `src/pages/UserManual.jsx:172`.

**Tensions.**
- On the Calendar page "Delete here only" keeps a `calendar` row as removed-from-app, while "Delete from Google" on the to-do hard-deletes the same kind of row (D-208).
- Batch delete, the to-do's delete, and the data wipes write no trash snapshot; only the Tasks page single-row delete does (BR-TASK-13, `trash-bin.md` §2).
- The trash lists a 24-hour window while the manual says 30 days; rows past the window are hidden, not removed (D-486, Q-462).
- Milestone tasks, education activities, links, and collage images delete without the shared confirm (BR-GOAL-T09 §4 "Delete", BR-EDU-21, Q-910, BR-VB-COL-10); see PR-15.

## PR-04 — External deletions are proposals, not commands

**Rule.** Something disappearing from Google does not silently delete it here; the account owner reviews. Deleting here never reaches Google unless the owner picks the Google option.

- **Tombstones.** A `DeletedSyncItem` records what vanished, with a status of `pending_review`, `denied`, or `allowed`, "User's decision on whether to allow re-sync" `[Implemented]` `10-architecture/google-sync.md` AR-SYNC-37; review panel "Items Deleted from Google Calendar" with "Keep deleted (don't restore)" and "Restore to calendar" `[Implemented]` `20-features/calendar/deleted-item-review.md` §3, §5.
- **Delete guards on import.** A local row is deleted by the manual calendar import only when it carries both Google ids, its calendar fetched successfully this run, its id is absent from the response, and its date lies inside the window; a calendar that fails to fetch never loses rows `[Implemented]` `10-architecture/google-sync.md` AR-SYNC-31..33.
- **Tasks imports never propagate deletions**; they only create or update `[Implemented]` `10-architecture/google-sync.md` AR-SYNC-36.
- **Delete here versus delete from Google** is an explicit choice on the Calendar page ("Delete here only" / "Delete from Google too"), on the to-do ("Delete from App" / "Delete from Google"), and on the Tasks page ("Delete here only" / "Delete from Google too") `[Implemented]` `10-architecture/google-sync.md` §11, `10-architecture/schedule-hub.md` AR-HUB-16, `20-features/tasks/google-tasks.md` BR-TASK-47.
- **Disconnecting** revokes the connector only: "Your Google data will not be affected." `[Implemented]` `10-architecture/google-sync.md` AR-SYNC-08; the data wipes send no request to Google `[Implemented]` `20-features/settings/data-management.md` BR-SET-55.
- Calendar walkthrough copy: "the choice to sync back to Google is yours." `[Described]` `src/pages/CalendarPage.jsx:24` (AR-SYNC-25).

**Tensions.**
- No function creates a tombstone; the review panel is populated by nothing in the current code (AR-SYNC-41, D-211, Q-500, Q-201).
- The manual says a deleted Google event "will also be deleted there"; the dialog makes it a choice (D-209 / D-501).
- Rows written by the scheduled import lack the two Google ids and can therefore never be deleted by the manual import's pass (D-202); the two imports use different windows (D-201).
- "Delete from Google too" on the Tasks page invokes an import rather than a delete (D-485, Q-460).

## PR-05 — AI suggests; the account owner approves and assigns

**Rule.** No AI touchpoint writes a suggestion to an entity without an explicit selection step. Failure writes nothing and says so.

- Chores and meals: "Generated Items (n)" with nothing pre-selected, per-item assignee and frequency overrides, then "Add n Item(s)" or "Save to Library" `[Implemented]` `10-architecture/ai-services.md` §2c, AR-AI-01.
- Education activities: select learners and activities, then select plans, then "Assign to n Plan(s)" `[Implemented]` `10-architecture/ai-services.md` §3c.
- Pillar activity ideas: review list, deselect, "Add n" `[Implemented]` `20-features/vision-board/health-pillars.md` BR-VB-PIL-08.
- Affirmation drafts land in the compose box and are saved only by "Add Affirmation" `[Implemented]` `20-features/vision-board/affirmations.md` BR-VB-AFF-03.
- Slideshow affirmations and translations are displayed and never stored `[Implemented]` `20-features/vision-board/slideshow.md` BR-VB-SLIDE-14.
- On failure, a plain alert and no write: "Failed to generate chores. Please try again." and its siblings `[Implemented]` `10-architecture/ai-services.md` AR-AI-04.
- The manual describes the review step for both generators: "Review AI-generated suggestions, select which ones you want to assign …" and "Review suggestions, select which activities to assign, choose target plans …" `[Described]` `src/pages/UserManual.jsx:208,257`.

**Tensions.**
- The daily quote is stored without review, and "New Quote" discards the day's row together with any reflection saved on it (AR-AI-05, BR-QUOTE-13).
- The pillar-idea generator logs a failure to the console and shows no message (AR-AI-04, `health-pillars.md` §7).
- The generator's "Save selected to library" box starts ticked on first open and unticked after a reset (D-303, Q-301).

## PR-06 — Self-assessment steers inspiration

**Rule.** The account owner's own daily ratings decide what the product suggests: goals, affirmations, focal areas, and the slideshow all follow the low ratings.

- A rating of 3 or below opens the Suggested Goals panel for that pillar during the evaluation; queued goals are written on Complete `[Implemented]` `20-features/vision-board/daily-evaluation.md` BR-VB-EVAL-07, BR-VB-EVAL-09.
- The Auto-Generated slideshow targets the pillars rated 3 or below in the most recent evaluation and asks for three affirmations per target, interleaved round-robin `[Implemented]` `20-features/vision-board/slideshow.md` BR-VB-SLIDE-01.
- The Affirmations card offers "Generate for {pillar}" for every pillar rated 3 or below today `[Implemented]` `20-features/vision-board/affirmations.md` BR-VB-AFF-05.
- The Dashboard "Focal Areas" widget lists the three lowest ratings of the latest evaluation and nudges with a blue button until today's evaluation exists `[Implemented]` `20-features/vision-board/spec.md` BR-VB-REM-01, `20-features/dashboard/spec.md` BR-DASH-08.
- The pillar-idea prompt quotes the pillar's latest rating and notes `[Implemented]` `10-architecture/ai-services.md` AR-AI-10.
- The manual and landing copy state it: "AI-curated based on your lowest-scoring health pillars"; "Auto-convert focal areas to goals" `[Described]` `src/pages/UserManual.jsx:40,304`.

**Tensions.**
- "Focal area" is computed five ways across surfaces (three lowest with no threshold, today's ≤ 3, latest-evaluation ≤ 3, lowest averages, manual's "rated 1–3") (D-703).
- The affirmation shortcuts read today's rows while the slideshow reads the most recent evaluation, and "today" is UTC on one and local on the other (D-300, D-754).
- The walkthrough says the slideshow "includes at least one affirmation from each pillar"; Auto mode targets only the low pillars when any exist (D-759).

## PR-07 — Paper and email day-sheets are first-class

**Rule.** Every planning surface can be printed or emailed to the account owner, and print and email produce the same document.

- Fifteen surfaces carry print and/or email controls: Tasks page, Calendar (two cards), Dashboard schedule and tasks widgets, Daily Schedule, Daily To-Do, Chores (two tabs), Education, Goals (per timeframe card), Quotes (three places), Weekly Review `[Implemented]` `10-architecture/export-print-email.md` §3.
- **Email is a print channel, not a sharing channel:** the recipient is always the signed-in user and no address is asked `[Implemented]` `10-architecture/export-print-email.md` AR-EXPORT-01.
- **One rendering per surface** for both channels `[Implemented]` `10-architecture/export-print-email.md` AR-EXPORT-02.
- Sheets are built for the fridge: the chore print groups per member with checkboxes and an optional note; the meal print goes by weekday; the education sheet lists daily, weekly, one-time and other activities with checkboxes `[Implemented]` `10-architecture/export-print-email.md` §3a, §3b, §4b.
- The Daily Schedule asks "Print Schedule + To Do together?" and date-range dialogs default to the visible period `[Implemented]` `10-architecture/export-print-email.md` §4a, §4c.
- The manual repeats the promise on four sections: "Use the Print or Email icons …", "print or email icons to export your daily schedule", "Export reflections via print or email", "Print or email your review." `[Described]` `src/pages/UserManual.jsx:151,174,336,370`.

**Tensions.**
- The generic card shell's print and email handlers are bound to no control; Dashboard and checklist cards therefore have none (D-310, Q-310).
- Chores print and email build different documents (member-first with all frequencies versus weekday-first with daily and weekly only) (D-312); the Menu tab has print only (D-313).
- Two `PrintFormat*` components exist beside hand-built exports that produce different layouts (D-314); the Goals page-level builder is unbound (D-311).
- Quotes onboarding says email can go "to yourself or others" (D-315).

## PR-08 — Personalisation follows the account, with a device-local tail

**Rule.** Look, layout, feature choice, and sync scope are stored on the account and appear on every device; a set of conveniences and typed lists stays on the device that made them. `[Partial]` as a whole (AR-PREF-05).

- **Account preferences** (one `ThemeSettings` row): colours, fonts, font size, dark mode, widget opacity and radius, background image and library, randomise-on-load, dashboard greeting name, the three feature toggles, dashboard widget order, sync sources, sync times, auto-sync calendar ids, the imported-task label and colour, and the second-generation walkthrough dismissal map `[Implemented]` `10-architecture/preferences.md` AR-PREF-02, A.2.
- **Device-local data the owner typed:** custom and deleted chore rooms, custom education subjects, link categories (name, icon, colour), the shared label history, recent-item history and pinned entries in the item library, the last chore print note, deleted collage image ids, slideshow audio favourites and default, and the saved speech voice `[Implemented]` `10-architecture/preferences.md` AR-PREF-03, Part D.
- **Device-local view state:** last visited page, Daily Schedule active hours, the two hide-completed toggles, per-member collapse in Menu & Chores, "default task list collapsed", the weather cache, the pre-React background cache, and the first-generation walkthrough flags `[Implemented]` `10-architecture/preferences.md` AR-PREF-04.
- Where a value is both on the account and on the device, the account value is written to the device on read and the device value serves as a fast path `[Implemented]` `10-architecture/preferences.md` AR-PREF-06.
- The manual promises the account side: "Your layout and preferences are saved automatically across all devices and sessions." `[Described]` `src/pages/UserManual.jsx:35`; the Link Library walkthrough admits the device side: "Categories are stored locally so they persist across sessions." `[Described]` `src/components/onboarding/LinkLibraryOnboarding.jsx:14` (AR-PREF-07).

**Tensions.**
- The Dashboard walkthrough dismisses to the account but triggers from the device only, so a dismissal on one device does not carry (D-801, D-961, Q-960).
- The app shell starts with all three feature toggles on and learns the stored values only when Settings dispatches an event; the Daily Schedule reads them on mount (D-132).
- Theme changes apply live but reach the account only on "Save Theme" (D-921); font size is applied by the editor and not at boot (D-924).
- Sync times and auto-sync calendar ids follow the account and are read by no function (D-204).

## PR-09 — The account owner owns their content

**Rule.** Content belongs to the person who created it; the product stores and shows it only to provide the service, isolates it from other accounts, and offers ways to take it out and to delete it.

- Terms of Use, "User Content": "You retain ownership of any content you create within The Daily Dash, including tasks, notes, and reflections. You grant us a limited license to store and display this content solely to provide you with the service." `[Described]` `src/pages/TermsOfUse.jsx:32` (`00-overview/legal-copy.md` §3); the same paragraph is accepted on the terms gate `[Described]` `src/pages/AcceptTerms.jsx:119`.
- Per-user row isolation on every entity `[Implemented]` `10-architecture/auth-and-account.md` AR-AUTH-07.
- Private collage images are creator-scoped rows whose files are served by time-limited signed URLs `[Implemented]` `20-features/vision-board/collage.md` BR-VB-COL-01, BR-VB-COL-02.
- Google tokens are fetched server-side per call; the browser never receives one `[Implemented]` `10-architecture/google-sync.md` AR-SYNC-02.
- Three deletion controls of increasing scope: "Delete Synced Data", "Delete All App Data", "Delete Account" (revoke connectors, delete data, delete the user) `[Implemented]` `20-features/settings/data-management.md` §2, `10-architecture/auth-and-account.md` AR-AUTH-09.
- Every export goes to the owner's own address (PR-07, AR-EXPORT-01).
- Landing copy: "Your data is yours." `[Described]` `src/pages/LandingPage.jsx:15`.

**Tensions.**
- Account deletion removes sixteen entity types while "Delete All App Data" removes twenty-five; pillar ratings, gratitude, affirmations, collage rows, the trash, the chore library, the activity library and private uploads survive account deletion (D-333, D-214, Q-333, Q-211).
- Private images survive both wipes (BR-VB-COL-13); the trash, chore library and activity library survive both (BR-SET-54).
- Admin-role users may read and write every account's `PillarActivity` and `DailyGratitude` rows, and the scheduled quote job writes rows into every account (`10-architecture/domain-model.md` §2).
- The legal pages give no contact address (D-971); the gate presents summaries, not the full texts (D-970, Q-971).

## PR-10 — AI is optional and degrades gracefully

**Rule.** The product works without Google and without a model; when an external call fails the surface shows a plain message or a fallback and nothing is lost.

- **Independent sign-up:** "Use Independently — Manage tasks, schedules, and goals without connecting a Google account." `[Implemented]` `src/pages/Auth.jsx:290-341` (AR-AUTH-01).
- **Quote fallback chain:** up to eight attempts against the external quote source, skipping any text among the account's 200 most recent quotes; only then the model; with nothing from either, "Could not generate a quote" `[Implemented]` `10-architecture/ai-services.md` AR-AI-06, §8a (`20-features/quotes/spec.md` BR-QUOTE-02).
- **Slideshow without affirmations** plays "You are capable of achieving your vision."; a failed translation falls back to the English text; a failed generation opens the show with what was gathered `[Implemented]` `20-features/vision-board/slideshow.md` BR-VB-SLIDE-07, §4.7, §4.1.
- **Sync isolation:** the scheduled import wraps each branch so a calendar failure becomes "Calendar: skipped (…)" and the tasks branch still runs; a manual import that finds no connection returns a "reconnect" message rather than a failure status `[Implemented]` `10-architecture/google-sync.md` §4b step 8, AR-SYNC-07; push failures never block the local change `[Implemented]` `20-features/calendar/spec.md` BR-CAL-15.
- **Weather** needs only the browser's position, caches for 30 minutes, and shows one no-data copy for every failure `[Implemented]` `20-features/weather/spec.md` BR-WX-01, BR-WX-02, BR-WX-04.
- **Generators** alert and write nothing on failure `[Implemented]` `10-architecture/ai-services.md` AR-AI-04.
- The manual calls Google sync "optional" `[Described]` `src/pages/UserManual.jsx:14`.

**Tensions.**
- The landing page and manual describe the daily quote as "AI-generated", which is the fallback path (D-304, Q-300).
- The Quotes page waits up to 15 seconds and then offers "Try Again", while the widget applies no timeout (BR-QUOTE-04); the two "Try Again" controls differ in whether they discard the day's row (D-904).
- The sign-up copy promises automatic sync "on app load"; nothing syncs on load (D-217, AR-SYNC-14).

## PR-11 — Today is the unit of work

**Rule.** Routines are recorded per date, so each day starts clean without a reset action, and every surface opens on today.

- Checklist ticks are one `ChecklistCompletion` per item per date; nothing is written at midnight, the page simply loads the new date `[Implemented]` `20-features/daily-checklist/spec.md` BR-CHK-08, BR-CHK-09.
- One quote per account per date; one tracking row per pillar per date; one gratitude per date `[Implemented]` `20-features/quotes/spec.md` BR-QUOTE-01, `20-features/vision-board/spec.md` BR-VB-04.
- Chores completed today return to pending at local midnight while the page is open; the next due date is computed from the completion moment `[Implemented]` `20-features/chores/spec.md` BR-CHORE-13, BR-CHORE-15.
- The Daily Schedule, the Calendar, the evaluation, the Chores page ("Due Today") and the Education page ("Due") all open on today `[Implemented]` `20-features/daily-schedule/spec.md` §4 "Date navigation", `20-features/calendar/spec.md` §4b, `20-features/vision-board/spec.md` §2, `20-features/chores/spec.md` BR-CHORE-03, `20-features/education/spec.md` §4.10.
- The manual: "Items reset automatically each new day — completion is date-specific." `[Described]` `src/pages/UserManual.jsx:85`.

**Tensions.**
- "Today" is the device-local date on some surfaces and the UTC date on others (D-100 family, D-302, D-409, D-510, D-754; `10-architecture/time-and-date-semantics.md`).
- Due and overdue are defined differently per surface for chores and education (D-103..D-106).

## PR-12 — Completion writes through, once

**Rule.** Ticking something in one place marks its source and its schedule rows; the account owner never updates two places.

- The daily to-do writes through to `Task`, `Chore`, or `EducationActivity`, then marks the schedule item complete and hides it from the grid `[Implemented]` `10-architecture/schedule-hub.md` AR-HUB-23, AR-HUB-24.
- The Tasks page cascades completion to every linked schedule item, and due-date edits rewrite their date and time `[Implemented]` `20-features/tasks/spec.md` BR-TASK-14, BR-TASK-15.
- Goal progress, status, archive flag and timestamps are derived from milestone tasks after every milestone change `[Implemented]` `20-features/goals/milestone-tasks.md` BR-GOAL-T05.
- The walkthrough states it: "Completing a task here also marks it complete in Tasks — and vice versa. They stay in sync so you never update two places." `[Described]` `src/components/onboarding/DailyScheduleOnboarding.jsx:24`.

**Tensions.**
- The Dashboard tasks widget flips status only, with no cascade, no next occurrence, and no occurrence counting (D-460); the Dashboard goals "✓" bypasses milestone tasks (D-004, BR-GOAL-T08).
- Checking off in the to-do also hides the block from the grid; the Tasks page does not (D-219).
- Completing a chore from the to-do writes status only, without the next due date (D-003, Q-402); goal rows on the to-do have no checkbox (Q-404).
- The goal derivation runs only on the Goals page; milestone changes from the to-do or the vision board wait for the next change there (`milestone-tasks.md` §7).

## PR-13 — Every page introduces itself once, then stays out of the way

**Rule.** A page shows a short numbered walkthrough on first visit, records the dismissal, and offers a "Guide" button to bring it back.

- Eleven walkthroughs, one per page, each titled "Welcome to {Page}" with the subtitle "Here's how to get the most out of this page — it only takes a minute!" and one button "Got it — Don't Remind Me Again" `[Implemented]` `20-features/onboarding/spec.md` BR-ONB-01, §4.2.
- Only the dismiss button records a dismissal; overlay and Escape leave it for next time `[Implemented]` `20-features/onboarding/spec.md` BR-ONB-02.
- Ten pages publish a "Guide" button into the header; the Dashboard shows one in its body `[Implemented]` `20-features/onboarding/spec.md` §4.3.
- Beyond page walkthroughs, first-run onboarding is the sign-up integration choice, the terms gate, the automatic collage seeding, and the post-connection banners `[Implemented]` `20-features/onboarding/spec.md` §4.5..4.7.
- The manual: "Access this guide anytime via the Guide button on the Daily Checklist page." `[Described]` `src/pages/UserManual.jsx:81`.

**Tensions.**
- Two persistence generations exist: six pages remember the dismissal on the device only, five on the account with a device mirror; the Dashboard mixes them (D-961, Q-960).
- The Vision Board dialog records a dismissal on any close, including overlay and Escape (D-964).
- Calendar and Daily Schedule each hold a second, unrendered step set (D-962, D-963, Q-961).

## PR-14 — Colour carries meaning

**Rule.** Where colour is used, it encodes source, priority, urgency, member, meal slot, pillar, or air quality, and the mapping is fixed.

- Schedule blocks, calendar dots and print badges are coloured by source type; task and custom blocks take the linked task's priority instead `[Implemented]` `10-architecture/schedule-hub.md` §3c, AR-HUB-08, `20-features/calendar/spec.md` BR-CAL-06.
- Chores and Education badges: purple when both overdue and due exist, red overdue only, blue due only `[Implemented]` `20-features/dashboard/spec.md` BR-DASH-07, `20-features/daily-schedule/spec.md` BR-SCHED-14.
- Meal slots, household members, pillars, and air-quality bands each have a fixed palette `[Implemented]` `20-features/chores/meal-planning.md` BR-MEAL-07, BR-MEAL-08, `20-features/vision-board/spec.md` §11, `20-features/weather/spec.md` BR-WX-07.
- The manual: "Tasks are color-coded by priority." and "Items due today appear in blue; overdue in red." `[Described]` `src/pages/UserManual.jsx:48,168`.

**Tensions.**
- Medium priority is yellow on the grid and in print but cyan on to-do rows and the Dashboard (D-408); the manual's priority palette differs from all three (D-461).
- The Chores page colours four meal slots while both widgets add a fifth (D-602).

## PR-15 — Nothing destructive without a confirmation

**Rule.** Deleting a record, disconnecting Google, wiping data, or deleting the account asks first, and the dialog names the scope.

- The shared list row always confirms: "Delete Item?" / "This action cannot be undone." `[Implemented]` `10-architecture/shared-interactions.md` AR-UI-02.
- Disconnect confirms with "Disconnect {name}?"; both wipes confirm with copy naming what goes; account deletion confirms with "This will permanently delete your account and all your data …" `[Implemented]` `10-architecture/google-sync.md` AR-SYNC-08, `20-features/settings/data-management.md` BR-SET-50, `10-architecture/auth-and-account.md` §10.
- Running wipes and syncs lock their dialog until they finish `[Implemented]` `20-features/settings/spec.md` BR-SET-16.
- Google-linked deletes add a second dialog with the Google choice `[Implemented]` `20-features/tasks/google-tasks.md` BR-TASK-47, `10-architecture/schedule-hub.md` AR-HUB-16.

**Tensions.**
- Milestone tasks, education activities, links, pillar activities, trash rows, and background-library entries (which also delete matching default collage images) delete without a confirmation (`milestone-tasks.md` §4, BR-EDU-21, Q-910, `health-pillars.md` §5, BR-SET-43, Q-922).
- Batch deletes use the browser's own confirm rather than the shared dialog (BR-TASK-19, `daily-checklist/spec.md` §4.5).

## Index of principles

| Id | Principle | Whole-principle tag |
|---|---|---|
| PR-01 | One account is one household | `[Implemented]` |
| PR-02 | Everything in one place | `[Implemented]` |
| PR-03 | Dismissal is not deletion | `[Implemented]` |
| PR-04 | External deletions are proposals, not commands | `[Partial]` (no tombstone writer, D-211) |
| PR-05 | AI suggests; the account owner approves and assigns | `[Implemented]` |
| PR-06 | Self-assessment steers inspiration | `[Implemented]` |
| PR-07 | Paper and email day-sheets are first-class | `[Implemented]` |
| PR-08 | Personalisation follows the account, with a device-local tail | `[Partial]` (AR-PREF-05) |
| PR-09 | The account owner owns their content | `[Partial]` (deletion scope, D-333) |
| PR-10 | AI is optional and degrades gracefully | `[Implemented]` |
| PR-11 | Today is the unit of work | `[Implemented]` |
| PR-12 | Completion writes through, once | `[Implemented]` |
| PR-13 | Every page introduces itself once, then stays out of the way | `[Implemented]` |
| PR-14 | Colour carries meaning | `[Implemented]` |
| PR-15 | Nothing destructive without a confirmation | `[Partial]` (unconfirmed deletes listed above) |

## Discrepancies & open questions

No new ids are opened here. Cited: D-003, D-004, D-100, D-103..D-106, D-120, D-132, D-201, D-202, D-206, D-208, D-209, D-211, D-214, D-217, D-219, D-300, D-302, D-303, D-304, D-310..D-315, D-333, D-408, D-409, D-460, D-461, D-485, D-486, D-501, D-510, D-602, D-652, D-701, D-703, D-754, D-759, D-801, D-904, D-921, D-924, D-961..D-964, D-970, D-971; Q-201, Q-203, Q-211, Q-300, Q-301, Q-310, Q-333, Q-402, Q-404, Q-460, Q-462, Q-500, Q-650, Q-910, Q-922, Q-960, Q-961, Q-971, Q-1001.
