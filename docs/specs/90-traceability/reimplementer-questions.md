# Reimplementer Dry-Run Questions

A verification pass in which a reader with access to `docs/specs` only (no source) attempted to write build
notes for two features and listed every question the specs could not answer. The two features were chosen
because they sit on the most cross-cutting mechanisms: the Daily To-Do (schedule hub, write-through, dismissal)
and the Vision Board slideshow (AI, external services, device preferences).

The questions are kept verbatim below. They are not defects in the prototype; they are the places where the
prototype's behaviour is undefined, defined in two ways, or defined by platform behaviour the specs cannot see.
They are the natural starting agenda for the reimplementation's design phase.

## Triage

| Outcome | Questions | Action taken |
|---|---|---|
| Resolved by correcting a spec (source had one answer) | A7, A8, A37, B2, B3, B4, B30 | `schedule-hub.md` AR-HUB-23 (`last_completed_date` = selected date); `daily-schedule/spec.md` §7 (goal rows never reach the `GoalTask` write) and §10 (`todo_showCompleted` is written "false", never removed); `affirmations.md` §0 (toggle hides the sidebar entry only) and §9 (Guide does not clear the key); `preferences.md` AR-PREF-35; `vision-board/spec.md` ownership pointers; `slideshow.md` D-757 marked resolved |
| Resolved by correcting the glossary | vocabulary notes 1–5, 7 | `daily to-do`, `custom block`, `due-task row`, `dismiss`, `item library`, `collage` redefined |
| Already recorded as a discrepancy or open question | A9–A11 (D-101, D-126, Q-402), A14 (D-412), A17 (Q-206, D-207), A16 (D-208), A32 (D-409), A35 (D-402, D-404), B5 (Q-753), B13 (Q-751), B34–B36 (D-750–D-753), B37 (D-123), B42 (D-759), B8/B6 (D-703) | none; see `discrepancy-log.md` and `open-questions.md` |
| Platform behaviour the prototype delegates (page size of an unlimited read, realtime event shape, LLM auth/timeouts, signed-URL races) | A1–A3, A18, B5, B9–B10, B38 | recorded here as reimplementation inputs |
| Undefined in the prototype (tie-breaks, ordering, copy, focus/keyboard, layout details, error feedback) | the remainder | recorded here as reimplementation inputs |

The full lists follow.

### Feature A — questions I could not answer from the specs

1. **Platform query defaults.** The schedule-item read "has no limit" (daily-todo.md §1; schedule-hub.md AR-HUB-39). What page size does an unlimited read return? Q-753 raises this for collage images but no equivalent exists for the to-do.
2. **Subscription event shape and "own write" detection.** daily-todo.md §1 says reloads are skipped "while the component's own write is in flight". data-model/schedule.md Q-007 admits the platform event shape is undocumented. What events arrive (create/update/delete), what payload, and how is a self-originated event distinguished from another tab's?
3. **Throttle semantics.** daily-todo.md §1: "a non-forced load within 800 ms of the previous one is skipped". Dropped or deferred? If dropped, a realtime change arriving inside the window is lost until the next trigger.
4. **Sort tie-break.** BR-TODO-03 sorts by `start_time` only; the source query is unsorted (data-model/schedule.md "Ordering"). Order of rows with equal times, and of due-task rows versus real rows at the same time, is undefined.
5. **Priority enrichment beyond the 200-task pool.** daily-todo.md §1 enriches task/custom rows from the backing task. If the backing task is older than the 200 newest, what priority (and border colour) does the row get?
6. **Custom rows never complete their backing task.** BR-TODO-05 lists `custom` under "no source write", yet item-library.md BR-SCHED-77 gives every custom block a backing `Task`. Checking a custom row leaves that task pending on the Tasks page. Intended, or an omission?
7. **Goal rows: contradiction on `GoalTask.completed`.** daily-todo.md BR-TODO-05 and schedule-hub.md AR-HUB-23 say a goal row returns before any write. spec.md §6 (`GoalTask` row) and §7 say "to-do completion writes `GoalTask.completed`" citing the same component lines. Which is it?
8. **`last_completed_date` value.** BR-TODO-05 and time-and-date-semantics.md D-126 say the selected date; schedule-hub.md AR-HUB-23 says "today / null". A reimplementer must pick one; the corpus gives two.
9. **Recurring and occurrence tasks completed from the to-do.** BR-TODO-05 sets `Task.status` directly. The Tasks feature creates a next occurrence and counts `completed_count` (time-and-date-semantics.md §8.1; schedule-hub.md AR-HUB-28). The walkthrough (spec.md §9 step 6) promises "Recurring tasks reset automatically and reappear each day they're due". Should the to-do replicate the Tasks page's next-occurrence and occurrence-count logic? Nothing says.
10. **Chore completion side effects (Q-402 unresolved).** BR-TODO-05 writes `Chore.status` only; the Chores page also stamps `last_completed_date` and advances `due_date` (time-and-date-semantics.md §8.2). Which behaviour to build? Same question for recurring `EducationActivity` (§8.3).
11. **Recurrence-driven "due today".** BR-TODO-01 uses `due_date === selected date` only (D-101). Tasks with a `recurrence_pattern` and no matching `due_date` never appear. Given the walkthrough claim in Q9, is that intended?
12. **A due-task row can never be dismissed.** BR-TODO-09 does nothing for a due-task row and BR-TODO-12 is not offered. The only exits are Send to Library, Delete from App or Delete from Google. Is there meant to be a non-destructive dismiss for a task due today?
13. **"Send to Item Library" on chore/education/goal rows.** daily-todo.md §5 offers it for "any other source", but item-library.md §2 lists only tasks, milestone tasks and custom entries. For chore/education rows the action only deletes the schedule item; nothing returns to any library. What should the user see afterwards, and is the label meant to differ?
14. **"Delete from Google" on a task without `google_task_id` (D-412).** The client deletes the schedule item, the backend leaves the task. Since the task's `due_date` is unchanged it reappears as a due-task row after remount. Is the intended outcome "nothing happens", "delete locally anyway", or "hide the button"?
15. **Google Tasks list id.** google-sync.md AR-SYNC-27 deletes in list `@default`, but auto-sync imports "every Google task list" (time-and-date-semantics.md AR-TIME-52). Tasks from other lists cannot be deleted this way. Reproduce the limitation?
16. **Order of Google delete versus local delete.** BR-TODO-11 hard-deletes the local row *before* invoking the backend. If the Google call fails, the local row is gone, the Google event survives and the next import recreates it (schedule-hub.md D-208 area). No error copy is specified. What should the user see?
17. **Client versus backend for the other three actions (Q-206 unresolved).** schedule-hub.md §8b records both implementations. A reimplementer must choose; the ownership-check semantics (AR-HUB-31) only exist on the backend path.
18. **Identity behind `created_by`.** AR-HUB-31 compares `created_by` to "the caller's email". Is `created_by` an email or an id? data-model/README.md was not in my set; nothing in the read docs says.
19. **Failed removal feedback.** daily-todo.md §5: "A failed action is logged and the row stays removed locally until the next reload that no longer returns it." So a failed delete silently hides a row that still exists. Intended? Any user-visible error?
20. **Hidden section contents versus `deleted_from_app`.** BR-TODO-04 defines hidden rows as items with `hidden_from_todo` true, without excluding `deleted_from_app`, while BR-TODO-01 excludes it from the main list. Do removed-from-app rows appear under "Hidden from To Do"? And in what order are hidden rows listed (§7 gives none)?
21. **Eye toggle state when the last hidden row is unhidden.** §3/§7: the toggle disappears; does the section state reset, and does it reappear open when a new row is hidden?
22. **Tooltip pluralisation.** §3 gives "Show n hidden item(s)". Is that literal, or "1 hidden item" / "2 hidden items"?
23. **Row visuals for non-task sources.** BR-TODO-05a specifies priority borders for task/custom and tints for calendar/event/goal. Border and tint for chore and education rows, the exact blue/grey shades, checkbox placement, and what occupies the checkbox slot on goal rows are unspecified (§2).
24. **Remove-dialog button order and styling.** §5 lists conditions but not order, variants (destructive vs default), or icons. schedule-hub.md §8a lists a different sequence again.
25. **Long titles in `Remove "<title>"`.** No truncation rule (§5).
26. **Row swipe versus page swipe.** shared-interactions.md AR-UI-13 navigates pages on a >50 px horizontal touch anywhere in the content area; the to-do row swipe uses the same threshold (§10). The slideshow explicitly stops propagation (slideshow.md §4.3); the to-do row does not say. Does a left swipe on a row also change page?
27. **Hover reveal after touch.** AR-UI-01 disables hover reveal once a touch is seen, for `SwipeableListItem`. Nothing says whether `SwipeableToDoItem` does the same (§10).
28. **Double-tap and the checkbox.** §10: two taps within 350 ms open edit. Does a tap on the checkbox count toward the pair, so that rapidly toggling opens the editor?
29. **Edit dialogs are out of scope but load-bearing.** §9 routes to `TaskEditDialog` (tasks spec) and `EventEditDialog` (calendar spec), neither in my set. I cannot build edit without them. Also: "finds the first schedule item of the date with `source_id` = task id" — first by what order?
30. **Print heading in `todo` mode.** spec.md §12 says the format's heading is "Daily Schedule" plus the date, and "today's date when no date is given". In mode `todo` does the heading still read "Daily Schedule", and does the to-do pass the selected date? §8 does not say.
31. **Email body styling.** export-print-email.md §2 Tier B says the to-do renders "without the wrapper styles". Which styles, if any, apply to the emailed HTML?
32. **Selected-date formatter.** spec.md §5b / D-409: initial date is local, arrow stepping is UTC-of-local-midnight. time-and-date-semantics.md "does not choose". The to-do receives whatever the page produces; I must choose a formatter and the specs refuse to.
33. **Carry-over items are grid-only.** time-grid.md §6 draws a previous-day block on the next day; BR-TODO-01 reads only `date = selected`. So an overnight block is on the grid but not the to-do for day two. Intended asymmetry?
34. **Feature toggles and to-do rows.** spec.md §0 gates only quick links and library entries. Do chore-sourced rows still show in the to-do when `enable_chores` is false? Unstated.
35. **Reproducing wrong copy.** spec.md §9 step 5 places the To-Do list "on the dashboard" (D-404) and step 4 promises a grid checkmark (D-402). The README says specs describe the prototype as-is. Do I ship copy the corpus itself labels as incorrect?
36. **Keyboard access.** No focus, Enter or Escape behaviour is specified for rows, checkbox or dialog anywhere in daily-todo.md §4a/§10 or shared-interactions.md.
37. **`todo_showCompleted` clearing.** spec.md §10 says "toggle off" clears it; preferences.md Part D says "never". Write "false" or remove the key?
38. **Condensed checklist label colour.** BR-TODO-17 shows "the label in upper case as a pill". Pill colour source (`label_color`?) is unstated, and the `DailyChecklist` entity sheet (`data-model/checklist.md`) is not linked from daily-todo.md.
39. **Progress bar presentation.** BR-TODO-19 gives the ratio. Percent text? Colour? Height? (§11.)
40. **Forced versus throttled reloads.** §1 says date changes and Unhide force a load; nothing says whether "Hide from Schedule Grid" (§5, "reload") or checkbox completion ("A reload follows") are forced or throttled.


### Feature B — questions I could not answer from the specs

1. **Dashboard entry is owned elsewhere.** slideshow.md §0 defers the "Vision" button, its menu, and feature-toggle gating to `20-features/dashboard`, which is not in my set. I cannot build the launch surface that the Manual treats as primary.
2. **Feature-toggle gating contradiction.** affirmations.md §0 says the toggle "hides the whole page"; vision-board/spec.md §0 says only the sidebar entry and swipe position are hidden and "the route itself stays reachable". Which applies to the Collage-tab launch buttons?
3. **Guide button contradiction.** affirmations.md §9 and preferences.md AR-PREF-35 say Guide *removes* `visionboard_onboarded` then opens the dialog; vision-board/spec.md §0, §5a and §10 say Guide opens it "without clearing its dismissal key" and that the reset helper "is not wired to any control". Direct contradiction about a device write.
4. **Onboarding dialog ownership.** README's ownership table assigns `OnboardingDialog.jsx` step text to "the feature's §9" and persistence to `20-features/onboarding`; vision-board/spec.md's sub-spec table says collage.md covers "the onboarding dialog mechanics"; affirmations.md's header claims ownership of the same mechanics; collage.md §9 defers to affirmations.md. Four pointers, no single owner.
5. **Unlimited reads (Q-753 unresolved).** `CollageImage.list()` and `Affirmation.list()` have no limit (slideshow.md §6). The platform default page size, and therefore the maximum images and affirmations in a show, is unknown.
6. **Hidden pillars as targets.** slideshow.md §4.2 targets "all pillar names" from every `HealthPillar` when none is low. `is_hidden` pillars (data-model/vision-board.md) are not filtered out. Should a hidden pillar receive affirmations?
7. **Model output that violates the prompt.** §4.2 says only "pillars the model omitted are skipped". If a pillar array has 2 or 5 entries, or a key differs in case from the pillar name, the round-robin rule ("position 1 of each, position 2 of each, and so on") does not say how far to iterate or how to match keys.
8. **Prompt sentence when an evaluation exists but nothing is low.** §4.2: the "scored low" line is included "only when low pillars exist". So with an evaluation and no low pillar, targets = all and the line is absent. Confirm; the sentence "when an evaluation exists and at least one is low" in the Targets bullet reads as if the two conditions were separate.
9. **LLM provider, timeouts, retries.** ai-services.md AR-AI-03 describes "InvokeLLM" with an optional JSON schema; no model, latency bound, or retry policy is given. The "Preparing…" screen has no timeout (§4.1/§4c).
10. **Browser-side LLM authentication.** external-services.md AR-EXT-04 says the browser calls the model directly. A reimplementation needs either a client credential or a proxy; the specs say nothing about how the call is authorised.
11. **Preparation failure path.** §4.1: any failure is "logged only; the player then opens with whatever was gathered". If the *image* read throws, is the result the no-images screen or an empty player? If the affirmation read throws in Custom mode, is the fallback text used? "possibly no affirmations" implies yes, but only the Auto path cites it.
12. **Interval reset on manual navigation.** §4.3: auto-advance every `speed` seconds; Next/Previous move immediately. Does a manual step restart the countdown? Does changing speed restart it, or only the zoom ("restarts the zoom")?
13. **Previous before any forward step (Q-751 unresolved).** The affirmation position goes below zero. I need a defined behaviour (clamp, wrap, or last of previous round).
14. **Ken Burns rendering details.** §4.3 gives scale 1.05→2.25 and 90 % timing but not transform origin, image fit (cover/contain), letterboxing colour, or behaviour on portrait viewports where a 2.25× zoom crops most of the image.
15. **Control bar layout.** §4.3–4.6 place Prev/counter/Next "at the left"; the order of the remaining ten controls, wrapping on narrow screens, and touch target sizes are unspecified.
16. **Double-click on controls.** §4.3: two clicks within 300 ms "anywhere on the show" toggle the bar. Does double-pressing Next (a legitimate action) hide the controls?
17. **"I only" regex case.** §4.4: `^I\s+\w+` for I-only; You-only is "case-insensitive"; the display split says "case-sensitive 'I'". Is the I filter case-sensitive (so "i am calm" is dropped)?
18. **Mode filter persistence when Speak is off.** §4.4: the mode button is visible only while Speak is on, but BR-VB-SLIDE-06 filters the queue by mode. If the owner picks "I only", then turns Speak off, is the overlay still filtered?
19. **Queue rebuild mid-slide.** §4.4: the queue is rebuilt "when the list or the mode changes". Does the position reset to 0 and the on-screen affirmation change immediately?
20. **Speech double-fire with a non-English voice.** §4.6 fires speech when the affirmation changes *and* when a translation arrives; §4.7 requests translation on every change. Is the English read aloud and then the translation, or does speech wait? AC-VB-SLIDE-09 implies only Spanish is spoken.
21. **Translation race and caching.** §4.7 sends a request per affirmation change with no cache; Previous re-requests. A slow response arriving after the next slide would be displayed for the wrong text. No rule.
22. **Translation while the overlay is off.** §4.7 says the call depends "on the selected voice only, not on whether Speak is on". Does it also fire when the affirmations toggle is off (nothing displayed, nothing spoken)?
23. **Utterance language.** §4.6 gives rate/pitch/volume and the voice; it does not say whether `lang` is set on the utterance to the voice locale.
24. **Two different "no voice selected" fallbacks.** §4.6 "Initial voice" picks the first filtered voice; the later bullet "Fallback voice when none is selected" prefers Google US English / Microsoft Aria / Samantha. When can the second rule apply if the first always selects something? Presumably before voices load, but nothing says.
25. **Voice panel ordering.** §4.6: voices grouped under accent labels. Group order (map order, alphabetical, by language) and order within a group are unspecified.
26. **Voice list never arrives.** §4.6 polls 300 ms × 20. After that, what does the voice button/panel show? No empty-state copy in §4c.
27. **Custom URL playback trigger.** §4.5: "the typed URL plays as soon as it changes". Per keystroke, or on Apply? Per keystroke would issue network loads for partial URLs.
28. **Can Custom URL be favourited or set as default?** §4.5 says every row "except None" has a gauge and star, but BR-VB-SLIDE-09 says "None and Custom never qualify" for selection on open. If `slideshowDefaultAudio` holds "Custom URL…", what plays (no URL is stored)?
29. **Favorites section order.** §4.5: favourites listed first. In stored-array order or preset order? Do the "— Nature Sounds —" / "— Music —" headers repeat there?
30. **Stale D-757 text.** slideshow.md D-757 says external-services.md §4 "records a volume slider (default 0.5) and mute"; the external-services.md I read says the opposite ("no volume slider or mute control is rendered"). One of the two was edited without the other.
31. **Random-audio spin duration** (§4.5) and the highlighted-state styling of every "active" button (§7a) are unspecified.
32. **No pause, no keyboard, no Escape.** BR-VB-SLIDE-16/17 and §4a. Reproducing an overlay with no keyboard exit is an accessibility regression; is "as-is" the intent for a reimplementation?
33. **Overlay mechanics.** Body scroll lock, z-index over the sidebar/header, and behaviour on route change or browser back while open are unspecified (§0, §4.3).
34. **Custom-mode affirmation selection (D-750 unresolved).** affirmations.md §4.7 stores "Apply N to Slideshow" texts; slideshow.md §4.1 replaces them with every saved affirmation; the Manual promises the selection. I must pick one.
35. **Dashboard Custom has no picker (D-751 unresolved).** Same image set as Auto. Build the Manual's picker or the prototype's shortcut?
36. **Excluded private images in the Custom picker (D-752) and deleted-image suppression (D-753).** collage.md BR-VB-COL-04/05 record both behaviours. Decisions needed for what the Custom show plays and whether the device list is honoured.
37. **7-name fallback pillar list (D-123).** The Dashboard can launch Auto before the Vision Board page has ever seeded pillars, so the model is prompted with names that match no pillar the owner will ever see. Reproduce?
38. **Signed-URL write-back failure.** §4.1 drops an image whose URL "cannot be obtained"; nothing says what happens when the mint succeeds but the row update fails, or when two surfaces refresh the same row concurrently (collage.md §4.5, slideshow.md §5a).
39. **Slide counter base.** §4.3 "{current} / {total}" — 1-based is implied, not stated.
40. **Immediate repeats across reshuffles.** BR-VB-SLIDE-04/05 permit the same image or affirmation to close one round and open the next; AC-VB-SLIDE-04 accepts this. Confirm no anti-repeat guard is wanted.
41. **Reduced-motion and autoplay policy.** No `prefers-reduced-motion` rule; audio autoplay handling is described only as "starts on the next click or touch" (§4.5) with no visible affordance telling the owner to tap.
42. **Walkthrough copy the corpus calls wrong (D-759).** Step 4 claims "at least one affirmation from each pillar". Ship it verbatim?


## Vocabulary notes from the dry-run

Items 1–5 and 7 of the first list were applied to the glossary during synthesis. "block" (the rendered representation of a schedule item on the time grid) and "gallery" (the Collage card's image grid) were made acceptable feature-local terms rather than replaced throughout.

**Glossary terms used inconsistently across the docs I read**

- **daily to-do** — glossary: "today's schedule items plus tasks due today". daily-todo.md BR-TODO-01 and spec.md §5b define it over the *selected date*. The glossary entry is wrong for the feature it names.
- **custom block** — glossary: "created directly on the Daily Schedule grid". item-library.md §2a/§6 and spec.md D-401: custom blocks are created from the Item Library's Recent tab; nothing is created on the grid.
- **due-task row** — glossary: a task "that has no schedule item"; BR-TODO-01 and AR-HUB-21: no *task- or custom-sourced* schedule item. The glossary is broader.
- **dismiss** — glossary covers `hidden_from_grid` and `hidden_from_todo` only and gives "remove from app" its own term; schedule-hub.md §5 calls all three flags "the three-flag dismissal model" and AR-HUB-18 lists removing from the app as a dismissal.
- **item library** — glossary: "side panel of unscheduled tasks and milestone tasks"; item-library.md §2a/§2c also offers custom recent-history entries, the synthetic Chores/Edu entries, and goals themselves (BR-SCHED-69).
- **focal area** — glossary defines the threshold reading without naming which evaluation; vision-board/spec.md §7 says "The glossary defines focal area as a pillar rated 3 or below in the most recent evaluation", misquoting it. Meanwhile ai-services.md AR-AI-10 and affirmations.md use today's rows; slideshow.md uses the newest evaluation date (D-300/D-703 record this, but the glossary sentence and spec.md's paraphrase still disagree with each other).
- **collage** / **shared image** — the glossary's own "collage" entry says "public URL images" while its "shared image" entry forbids "public image".
- **carry-over item** / **synthetic row** — spec.md §2, §12 and time-grid.md §1, §6 use "pseudo-item" / "carry-over pseudo-items" instead of the merged glossary terms.
- **`Task.last_completed_date` on to-do completion** — daily-todo.md BR-TODO-05 "the selected date"; schedule-hub.md AR-HUB-23 "today / null"; time-and-date-semantics.md D-126 "the selected date". Same rule, two values.
- **`todo_showCompleted` clearing** — spec.md §10 "toggle off"; preferences.md Part D "never".

**Vocabulary the glossary forbids, found in prose (not inside quoted UI/manual text)**

| Forbidden term | Where |
|---|---|
| "to-do list" (for daily to-do) | daily-schedule/spec.md §1 line 41, US-SCHED-09, US-TODO-01; preferences.md AR-PREF-04 and Part D `todo_showCompleted` row |
| "backlog" (for item library) | daily-schedule/spec.md §1 line 41, US-SCHED-04 |
| "virtual" rows (synthetic row) | data-model/schedule.md "Referenced by" ("Virtual to-do rows") |
| "soft-deleted" (remove from app) | data-model/schedule.md Lifecycle |
| "public collage image" (shared image) | external-services.md §5 and §6.3 |
| "gallery" as a term of record (collage) | collage.md §0, §4.1, §4.2 heading "Shared-image gallery", §4b; vision-board/spec.md §4 "the image gallery"; data-model/vision-board.md CollageImage lifecycle |
| "focus areas" in prose (focal area) | ai-services.md §6 "consecutive slides alternate focus areas" |
| "cascade" (write-through) | schedule-hub.md AR-HUB-28 "schedule-item cascade"; data-model/schedule.md Q-007 "cascade table" |
| "denormalised" (cache field) | data-model/schedule.md and data-model/vision-board.md section headings "Denormalised caches" |
| "block" as a term (schedule item; "block" is UI-only) | time-grid.md throughout (BR-SCHED-30..59 "a block's top edge", "grid blocks"); spec.md BR-SCHED-16 |
| "the user" for the person (account owner) | daily-todo.md §5 "what the user can do"; time-and-date-semantics.md AR-TIME-51; external-services.md §5 "The user may paste" |
| "event" for any schedule item | spec.md BR-SCHED-16 and time-grid.md §11 "shared event edit dialog for every source type" |

Everything above is drawn only from `docs/specs`; the four feature-level decisions flagged as unresolved for a builder (Q-206/D-207 client-vs-backend, D-750, D-751, D-752/D-753) are the ones where the corpus records two behaviours and a reimplementer has to choose without guidance.
