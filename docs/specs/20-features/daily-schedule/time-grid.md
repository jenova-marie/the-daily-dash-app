# Daily Schedule — Time Grid

**Feature code:** `SCHED` · **Level:** 2 · **Parent:** `spec.md` · **Status:** draft

**Source:** `src/pages/DailySchedule.jsx` (grid constants, positioning, rendering: lines 38-77, 219-349, 360-393, 445-490, 534-538, 697-800). The `ScheduleItem` aggregation model is owned by `10-architecture/schedule-hub.md`; this file describes only what the grid shows and how.

## 1. What is on the grid

**Inclusion** `[Implemented]` `src/pages/DailySchedule.jsx:319-336,465`

The grid draws, for the selected date:

1. Schedule items whose `date` equals the selected date, that are not `hidden_from_grid`, and, when the source type is `calendar` or `event`, that are not `deleted_from_app` and have a `start_time`. Every other source type passes with no further test at load time.
2. Carry-over pseudo-items derived from the previous day (§6).

At render time the list is further reduced to items that have a `start_time`, and to items that are not `completed` unless the show-completed toggle is on.

**Excluded, and why** `[Implemented]` `src/pages/DailySchedule.jsx:322-327,465`

| Excluded | Reason in code |
|---|---|
| Items of another date returned by the query | `s.date !== selectedDate` guard |
| Items with `hidden_from_grid` | dismissed from the grid; they appear in the hidden panel (§9) |
| Calendar/event items marked removed from app | `deleted_from_app` guard for those two source types only |
| Calendar/event items with no `start_time` | all-day imports have no clock position |
| Any item with no `start_time` (other source types) | filtered at render; no position can be computed |
| Completed items | filtered at render while the eye toggle is off (§8) |

Task-sourced and custom-sourced items are enriched with the backing `Task`'s `priority` before rendering; the list is then sorted by `start_time` ascending. `[Implemented]` `src/pages/DailySchedule.jsx:329-336`

The previous-day query is limited to 100 items and the selected-day query to 200. `[Implemented]` `src/pages/DailySchedule.jsx:238,242`

## 2. Geometry

- **BR-SCHED-30** One hour is 60 px tall (`HOUR_PX`). A block's top edge is `((startHour − scheduleStart) × 60 + startMinute)` px, i.e. one pixel per minute from the first active hour. `[Implemented]` `src/pages/DailySchedule.jsx:445,457`
- **BR-SCHED-31** A block with no `end_time` is treated as one hour long. `[Implemented]` `src/pages/DailySchedule.jsx:450`
- **BR-SCHED-32** Rendered duration is at least 15 minutes; height is `max(end − start, 15)` px. `[Implemented]` `src/pages/DailySchedule.jsx:456,458`
- **BR-SCHED-33** The visible grid is `(scheduleEnd − scheduleStart + 1) × 60` px tall. A block's rectangle is clamped to that window: top at least 0, bottom at most the grid height, and the clamped height at least 20 px. `[Implemented]` `src/pages/DailySchedule.jsx:716-721`
- **BR-SCHED-34** When a block starts above the window (`clipsTop`), its title and "start–end" time are pinned to the top edge of the visible part. When it ends below the window (`clipsBottom`), the time line is always shown and the detail popup opens above the block instead of below. `[Implemented]` `src/pages/DailySchedule.jsx:722-723,745-751,757,769`
- **BR-SCHED-35** The time line under the title ("9 – 10", "9:30 – 11") shows only when the clamped height exceeds 25 px, or the block clips the bottom, or it spans midnight. Times use a 12-hour form without AM/PM: "9", "9:30", "12". `[Implemented]` `src/pages/DailySchedule.jsx:25-29,757-764`
- **BR-SCHED-36** Hour labels read "5:00 AM" … "12:00 PM" … "10:00 PM"; the label column is 76 px wide and blocks are offset by that margin. `[Implemented]` `src/pages/DailySchedule.jsx:699,703,708`
- **BR-SCHED-37** Completed titles render with strike-through at reduced opacity. `[Implemented]` `src/pages/DailySchedule.jsx:747,754`

## 3. Overlap packing

- **BR-SCHED-38** Visible items are sorted by start minute. Greedy interval packing assigns each item the first column whose last item's end minute is at or before this item's start minute; if none, a new column is opened. `[Implemented]` `src/pages/DailySchedule.jsx:464-476`
- **BR-SCHED-39** For each item, its "peers" are every visible item whose interval overlaps it (start < other's end and end > other's start, including itself). The item's and each peer's `totalCols` becomes the maximum of its current value and (the highest column index among the peers + 1). `[Implemented]` `src/pages/DailySchedule.jsx:478-486`
- **BR-SCHED-40** Width is `100% / totalCols` and left offset is `col × width`. Columns after the first are inset by a 2 px gap; every block is 2 px narrower than its share. `[Implemented]` `src/pages/DailySchedule.jsx:711-713,735-736`
- **BR-SCHED-41** An open block (popup showing) is raised above its neighbours (z-index 100 versus 10). `[Implemented]` `src/pages/DailySchedule.jsx:737`
- The packing is recomputed whenever the item list, the active hours, or the show-completed toggle changes. `[Implemented]` `src/pages/DailySchedule.jsx:490`
- A stronger-tint colour map for overlapping blocks is defined, but the renderer always requests the non-overlapping map. `[Partial]` `src/pages/DailySchedule.jsx:47-54,63-77,710`

## 4. Colour rule (meaning-bearing)

- **BR-SCHED-42** For source types `task` and `custom`, when the item has a recognised `priority`, the priority colour wins: urgent red-600, high orange-500, medium yellow-400, low green-600. `[Implemented]` `src/pages/DailySchedule.jsx:56-61,70-75`
- **BR-SCHED-43** Otherwise the source colour applies: calendar blue-500, event blue-500, task emerald-500, education purple-500, chore amber-500, custom muted. An unrecognised source type (e.g. `goal`) falls back to the custom colour. `[Implemented]` `src/pages/DailySchedule.jsx:38-45,76`
- Colour is expressed as a tinted background plus a 2 px left border in the same hue. `[Implemented]` `src/pages/DailySchedule.jsx:39-44,731`
- The priority used is the backing `Task`'s (§1), so an item whose task has no priority shows its source colour. `[Implemented]` `src/pages/DailySchedule.jsx:329-334`

## 5. Cross-midnight items

- **BR-SCHED-44** If an item has an `end_time` and its end minute is at or before its start minute, it is treated as running past midnight: its end is clipped to 24:00 for height and packing, and the flag `spansNextDay` is set. `[Implemented]` `src/pages/DailySchedule.jsx:452-455,459`
- **BR-SCHED-45** A spanning block always shows its time line, suffixed " → next day"; the popup shows the same suffix in yellow. `[Implemented]` `src/pages/DailySchedule.jsx:757,761,776`
- Adding from the library computes `end_time` modulo 24 hours, so a start plus duration that passes midnight produces exactly this shape (`item-library.md` BR-SCHED-76). `[Implemented]` `src/pages/DailySchedule.jsx:411-415`

## 6. Carry-over from the previous day

- **BR-SCHED-46** Source: the previous day's schedule items (up to 100) that are not `hidden_from_grid`, not `deleted_from_app`, and have both times, where end minute is at or before start minute. `[Implemented]` `src/pages/DailySchedule.jsx:229-232,242,295-304`
- **BR-SCHED-47** Each becomes a pseudo-item: a copy with `id` = `carryover-<originalId>`, `date` = selected date, `start_time` "00:00", the original `end_time`, `_isCarryOver` true and `_carryOverFrom` = the previous date. Nothing is written. `[Implemented]` `src/pages/DailySchedule.jsx:305-317`
- **BR-SCHED-48** Carry-over blocks are appended to the day's items before the start-time sort, so they draw from the top of the day (visible only if the active hours include their span). `[Implemented]` `src/pages/DailySchedule.jsx:319-336`
- **BR-SCHED-49** Appearance: a 2 px yellow-400 top border, an "↑" prefix before the title, and the time line "ends 7" (end time only). `[Implemented]` `src/pages/DailySchedule.jsx:726,731,755,759-760`
- **BR-SCHED-50** Popup line for a carry-over: "↑ Continued from previous day — ends <time>" in yellow, in place of the time range. `[Implemented]` `src/pages/DailySchedule.jsx:771-772`
- The carry-over copy keeps the original's `completed`, `notes`, `source_type` and priority, so the same colour and dimming rules apply. `[Implemented]` `src/pages/DailySchedule.jsx:308-316`
- A carry-over that satisfies the past-item test offers "↻ Move to now" and "Edit" against its pseudo id (Q-401). `[Implemented]` `src/pages/DailySchedule.jsx:727,782-787`

## 7. Now line and past dimming

- **BR-SCHED-51** The current time is sampled on mount and every 60 s. `[Implemented]` `src/pages/DailySchedule.jsx:110,149-152`
- **BR-SCHED-52** The now line (a red-500 dot at the left edge and a red line across the block area) draws only when the selected date is today and the computed top, `(currentMinutes / 60 − scheduleStart) × 60` px, is between 0 and the grid height inclusive. It ignores pointer events. `[Implemented]` `src/pages/DailySchedule.jsx:534-538,794-799`
- **BR-SCHED-53** On today, every hour row whose hour number is less than the current time in fractional hours renders at 30 % opacity with a fainter rule. Other days never dim. `[Implemented]` `src/pages/DailySchedule.jsx:700-704`
- **BR-SCHED-54** A block is a "past item" when the selected date is today, its end minute is at or before the current minute, and it is not completed. Past items render at 60 % opacity. `[Implemented]` `src/pages/DailySchedule.jsx:727,738`
- **BR-SCHED-55** A completed block (when shown) renders at 50 % opacity in greyscale. Completed takes precedence over past for opacity. `[Implemented]` `src/pages/DailySchedule.jsx:738-739`

## 8. Show / hide completed

- The header eye button (tooltip "Show completed items" when hidden, "Hide completed items" when shown; icon at half opacity while off) toggles an in-memory flag, default off. While off, completed items are removed before packing, so they take no column. `[Implemented]` `src/pages/DailySchedule.jsx:106,465,579-585`

## 9. Hidden items badge and panel

- **BR-SCHED-56** The hidden count is the number of the selected date's schedule items (from the unfiltered 200-row query) with `hidden_from_grid` true, regardless of `deleted_from_app`, `hidden_from_todo`, or `completed`. Items checked off in the to-do therefore count here (`daily-todo.md` BR-TODO-05). `[Implemented]` `src/pages/DailySchedule.jsx:338,360`
- The badge (EyeOff icon plus the count; tooltip "n hidden item" / "n hidden items") appears in the card header only when the count is above zero and toggles the panel. `[Implemented]` `src/pages/DailySchedule.jsx:569-578`
- The panel, headed "Hidden items", lists each hidden item's title and start time with a "Restore to grid" eye button. Restore sets `hidden_from_grid` false and reloads after a 300 ms debounce. The panel closes itself when the count reaches zero. `[Implemented]` `src/pages/DailySchedule.jsx:353-356,390-393,620-647`

## 10. Block interaction and the detail popup

- **BR-SCHED-57** Click toggles the block's popup; clicking any other block switches the popup; clicking the empty grid area closes it. Double-click opens the popup only when the block has `notes`. `[Implemented]` `src/pages/DailySchedule.jsx:708,714,741-742`
- **BR-SCHED-58** Popup contents, in order: title; either the carry-over line (§6) or "start – end" with " → next day" when spanning; the source type in lower case with an initial capital (e.g. "Task", "Calendar", "Custom", "Goal"); the notes when present, separated by a rule; "✓ Completed" in green when completed; and, for a past item only, a row with "↻ Move to now" (primary) and "Edit" (secondary). `[Implemented]` `src/pages/DailySchedule.jsx:768-789`
- The popup is 14 rem wide, anchored to the block's left edge, below the block or above it when the block clips the bottom of the grid. `[Implemented]` `src/pages/DailySchedule.jsx:769`
- The popup has no completion control (spec D-402). `[Implemented]` `src/pages/DailySchedule.jsx:768-789`

## 11. "↻ Move to now"

- **BR-SCHED-59** New start = the current hour and minute. Duration = the item's end minus start in minutes when both times exist and the difference is positive; otherwise 60. New end = `min(start + duration, 23:59)`. Both times are written as `HH:MM`; the popup closes; the page reloads. `[Implemented]` `src/pages/DailySchedule.jsx:367-382`
- Because a spanning item's raw difference is non-positive, it re-times to a 60-minute block. `[Implemented]` `src/pages/DailySchedule.jsx:371-376`
- "Edit" opens the shared event edit dialog for the item (any source type) and closes the popup; on save the page reloads (`spec.md` BR-SCHED-16). `[Implemented]` `src/pages/DailySchedule.jsx:384-388,1129-1134`

## 12. Acceptance criteria

- **AC-SCHED-20** Given active hours 5–22 and an item 09:15–10:00, When the grid renders, Then its top is 255 px and its height 45 px. (refs BR-SCHED-30, BR-SCHED-32)
- **AC-SCHED-21** Given an item 09:00–09:05, Then its height is 15 px of duration and at least 20 px on screen. (refs BR-SCHED-32, BR-SCHED-33)
- **AC-SCHED-22** Given items A 09:00–10:00, B 09:30–10:30, C 10:00–11:00, Then A and C share column 0, B is column 1, and all three render at half width. (refs BR-SCHED-38, BR-SCHED-39)
- **AC-SCHED-23** Given a task-sourced item whose backing task priority is `urgent`, Then the block is red regardless of source colour; Given a chore item, Then it is amber. (refs BR-SCHED-42, BR-SCHED-43)
- **AC-SCHED-24** Given an item 22:00–02:00, Then it draws to the bottom of the day with " → next day" and, on the following date, a carry-over block "↑ <title>" from 00:00 to 02:00 with "ends 2". (refs BR-SCHED-44 to BR-SCHED-50)
- **AC-SCHED-25** Given today is selected at 14:30 with active hours 5–22, Then the now line sits at 570 px from the top and the 5 AM through 2 PM rows are dimmed. (refs BR-SCHED-52, BR-SCHED-53)
- **AC-SCHED-26** Given the eye toggle is off and an item is completed, Then it is absent from the grid and takes no column; When the toggle is turned on, Then it appears at half opacity in greyscale. (refs §8, BR-SCHED-55)
- **AC-SCHED-27** Given a block that ended an hour ago and is not completed, When it is clicked, Then the popup offers "↻ Move to now" and "Edit"; When "↻ Move to now" is pressed, Then the item keeps its duration starting at the current minute and the popup closes. (refs BR-SCHED-54, BR-SCHED-59)
- **AC-SCHED-28** Given two items of the date have `hidden_from_grid`, Then the header shows an EyeOff badge with "2"; When "Restore to grid" is pressed on one, Then it returns to the grid and the badge reads "1". (refs BR-SCHED-56, §9)
- **AC-SCHED-29** Given a block without notes, When it is double-clicked, Then no popup opens; Given a block with notes, Then the popup opens showing the notes. (refs BR-SCHED-57, BR-SCHED-58)
