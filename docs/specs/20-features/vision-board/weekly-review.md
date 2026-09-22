# Vision Board — Weekly Review

**Feature code:** `VB-WK` · **Level:** 2 · **Parent:** `spec.md` · **Status:** draft

**Tag summary:** Implemented 36 · Described 3 · Partial 0

**Sources:** `src/components/visionboard/WeeklyReview.jsx`; the Weekly Review tab wiring, week navigator and print/email triggers in `src/pages/VisionBoard.jsx`.
**Referenced:** `base44/entities/DailyPillarTracking.jsonc` → `10-architecture/data-model/vision-board.md`; `DailyChecklist.jsonc`, `ChecklistCompletion.jsonc` → `20-features/daily-checklist` and `10-architecture/data-model/checklist.md`; print/email mechanism → `10-architecture/export-print-email.md`; week and date rules → `10-architecture/time-and-date-semantics.md` (AR-TIME-30, AR-TIME-03); the charting library is not described here, only what the chart shows.

The card is titled "Weekly Review"; inside it the heading reads "Weekly Review - {MMM d}" for the review date (the Sunday). The component receives the review date and **every** pillar, hidden ones included. `[Implemented]` `src/pages/VisionBoard.jsx:268,340`, `src/components/visionboard/WeeklyReview.jsx:150`

## 1. Week navigation

Owned wiring in `spec.md` §4 "Review-week navigator" `[Implemented]` `src/pages/VisionBoard.jsx:307-339`:

- **BR-VB-WK-01** The review week is Sunday to Saturday. Previous/next chevrons step by seven days; the centre label `MMM d – MMM d, yyyy` opens a calendar whose choice snaps to that date's Sunday. Next is disabled when the review week is the current week or later; there is no earliest limit `[Implemented]` `src/pages/VisionBoard.jsx:57,308-338`, `src/components/visionboard/WeeklyReview.jsx:46-48` (AR-TIME-30).

## 2. Data loaded

- **BR-VB-WK-02** All `DailyPillarTracking` rows of the account are read (unfiltered, no limit) whenever the review date or the pillar list changes `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:44-50,109`.
- From them: per-pillar all-time averages; per-pillar three-month averages (rows dated on or after the date three months before the review date); the seven daily entries of the review week (one value per pillar per day, 0 when no row); and per-day details (ratings by pillar name, and every non-empty note of that day) `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:52-105`.
- Independently, the active checklist items and the completions for each of the seven days are read for §7 `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:18-42`.
- "Loading weekly data..." shows until the ratings have loaded `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:146`.

## 3. Averaging rule

- **BR-VB-WK-03 (Precision and inclusion).** Every average is the arithmetic mean of ratings greater than 0, rendered to one decimal place; a pillar with no qualifying rating in the window has average 0 and is treated as "no data" `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:54-59,64-70,111-122`.
- Windows: **This Week** = the seven entries of the review week; **3 Months** = rows dated ≥ (review date − 3 months); **All Time** = every row `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:52-70,111-122`. The three-month window is anchored on the review date, not the device date `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:63`.
- Hidden pillars are included in every average because the component receives all pillars `[Implemented]` `src/pages/VisionBoard.jsx:340`, `src/components/visionboard/WeeklyReview.jsx:54,65,113`.

## 4. Focal Areas (Lowest Averages)

- Panel heading "Focal Areas (Lowest Averages)" with a three-way pill: "This Week" (default), "3 Months", "All Time" `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:15,152-175`.
- **BR-VB-WK-04** For the chosen window, pillars with average > 0 are sorted ascending by average and the first three are shown as chips "{pillar name} {average}" `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:129-144,176-183`. Ties keep the pillar list order (stable sort); there is no threshold, so a pillar averaging 5.0 can appear when fewer than three pillars have data `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:129-140`.
- Empty state: "No data yet" `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:184-186`.
- The manual: "Switch between This Week, 3 Months, and All Time views. Focal areas show average scores per pillar." `[Described]` `src/pages/UserManual.jsx:370`. This panel's "focal area" is a lowest-average ranking, not the glossary's rating-based definition (D-703).

## 5. Seven-day chart and pillar filter

- **Which pillars appear.** A pillar is shown in the chips, chart and buckets when it has an all-time average > 0 **or** is not hidden. A hidden pillar with history therefore remains; a hidden pillar that was never rated is dropped `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:126-127`. The source comment: "Only show pillars that have at least some data (handles hidden pillars with history)". The whole chart block renders only when at least one such pillar exists `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:190`.
- **Filter chips.** A row starting with "All Pillars" (selected by default) followed by one chip per shown pillar. A pillar chip carries its colour as a left border when unselected and as its background when selected. Selecting a pillar shows only its bars; "All Pillars" restores every pillar `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:12,192-219,237-253`.
- **BR-VB-WK-05 (Colour fallback).** When a pillar has no colour, the chip and bar use `hsl((index × 360) / count, 70%, 55%)` where index is the pillar's position among the shown pillars and count is their number `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:204,244,251`.
- **What the chart shows.** Seven grouped columns labelled with the weekday abbreviation (`EEE`, Sun … Sat); within each day one bar per shown pillar (or the single filtered pillar) whose height is that day's rating; the value axis is fixed from 0 to 5; a day with no row for a pillar draws a 0-height bar; a dashed grid; no tooltip text (the side panel replaces it) `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:73-86,223-254`.
- **BR-VB-WK-06 (Hover side panel).** Hovering a day column opens a panel to the right titled with the weekday abbreviation; it lists, for scores 5, 4, 3, 2, 1 in that order, a row "{score}" followed by chips for every shown pillar (or the filtered pillar) that scored exactly that value that day; scores with no pillar are omitted; leaving the chart closes the panel `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:11,226-231,258-286`. Pillars with no rating that day (value 0) appear under no score.

## 6. Weekly-average buckets

- **BR-VB-WK-07** Below the chart, for scores 5 down to 1, a row "{score}" lists every shown pillar whose This-Week average is > 0 and rounds (half up, via `Math.round`) to that score; rows with no pillar are omitted. The filter chip does not affect this block `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:291-315`.

## 7. Daily Checklist weekly summary

- Heading "Daily Checklist — Week of {MMM d}" (the Sunday) `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:319`.
- **BR-VB-WK-08** For every `DailyChecklist` item with `is_active` true, sorted by `order`, the count is the number of days in the Sunday–Saturday review week that have a `ChecklistCompletion` for that item with `completed` true. Each item shows its title, its time-of-day bucket in small text when set, a bar filled to count/7, and the text "{count}/7" `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:18-42,320-345`.
- **BR-VB-WK-09 (Bar colour as meaning).** Count 7 → green (every day); 5 or 6 → primary colour (most days); 3 or 4 → amber (some days); 0 to 2 → muted (rarely). The number text uses the same mapping `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:334,338`.
- The block is omitted when the account has no active checklist items `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:317`. Checklist items, completions and buckets are owned by `20-features/daily-checklist`.

## 8. Daily Breakdown

- Heading "Daily Breakdown"; one card per day of the review week, Sunday first, titled `EEEE, MMM d, yyyy` `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:349-353`.
- Each card lists every pillar (hidden or not) that has a row that day as "{pillar name} {score}" in a grid; when any row of that day has notes, a "Notes:" section lists each note in the order the rows were read (notes are not labelled with their pillar) `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:88-101,354-371`.
- A day with no rows renders an empty card with only its title `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:351-373`.
- The day title is parsed from the `YYYY-MM-DD` string with `new Date(string)` (AR-TIME-03 convention one; D-134 in `10-architecture/time-and-date-semantics.md`) `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:353`.
- The manual: "See performance trends with bar charts and a daily breakdown." `[Described]` `src/pages/UserManual.jsx:370`. Walkthrough step 3: "The Weekly Review tab summarizes your pillar scores over the week so you can spot trends and areas to improve." `[Described]` `src/components/visionboard/OnboardingDialog.jsx:19`.

## 9. Print and email

- Both header buttons take the rendered HTML of the whole card (`id="weekly-review-content"`), including the week navigator, the horizon pill, the filter chips and the chart as currently rendered (so the active filter and horizon are what is exported) `[Implemented]` `src/pages/VisionBoard.jsx:268-305`. Print: new window titled "Weekly Review", body font Inter with 24 px padding, then the print dialog. Email: to the signed-in user's address, subject `Weekly Review - {MMM d, yyyy}` of the review date, body = the HTML, then alert "Sent to your email!" `[Implemented]` `src/pages/VisionBoard.jsx:274-300`. Conventions AR-EXPORT-01, 03, 04 in `10-architecture/export-print-email.md` (tier A row for this surface).
- No options dialog and nothing remembered `[Implemented]` `src/pages/VisionBoard.jsx:268-305`.

## 10. Feedback and effects

- Alert "Sent to your email!" after email `[Implemented]` `src/pages/VisionBoard.jsx:299`. No confetti, celebration, toast or badge is produced by the review `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:148-376`. Day cards and score tiles enlarge slightly on hover (presentation only) `[Implemented]` `src/components/visionboard/WeeklyReview.jsx:352,356`.

## 11. View state

| Control | Values | Default | Scope |
|---|---|---|---|
| Review date | any Sunday | Sunday of the current week | memory `src/pages/VisionBoard.jsx:57` |
| Focal Areas horizon | `weekly` / `3months` / `alltime` | `weekly` | memory `src/components/visionboard/WeeklyReview.jsx:15` |
| Pillar filter | null (All Pillars) / a pillar id | null | memory `src/components/visionboard/WeeklyReview.jsx:12` |
| Hovered day | a day entry or null | null | memory `src/components/visionboard/WeeklyReview.jsx:11` |

No device-local keys.

## 12. Data touched

| Entity | Read | Citation |
|---|---|---|
| `DailyPillarTracking` | filter `{}` (all rows) | `src/components/visionboard/WeeklyReview.jsx:50` |
| `DailyChecklist` | filter `{ is_active: true }` | `src/components/visionboard/WeeklyReview.jsx:25` |
| `ChecklistCompletion` | filter `{ date }` × 7 days | `src/components/visionboard/WeeklyReview.jsx:26` |
| `User` | `auth.me()` for the email address | `src/pages/VisionBoard.jsx:293` |

The review writes nothing.

## 13. Acceptance criteria

- **AC-VB-WK-01** Given the review week contains ratings for Rest of 2, 3 and 4 on three days, When "This Week" is active, Then Rest shows an average of 3.0 and appears in the Focal Areas chips if it is among the three lowest. (refs BR-VB-WK-03, 04)
- **AC-VB-WK-02** Given only two pillars have any rating in the window, When the Focal Areas panel renders, Then exactly those two chips appear regardless of their averages. (refs BR-VB-WK-04)
- **AC-VB-WK-03** Given a pillar rated on some past date and now hidden, When the review opens, Then its chip is in the filter row and its bars are in the chart; Given a hidden pillar never rated, Then it is absent. (refs §5)
- **AC-VB-WK-04** Given the chart, When the pointer is over Tuesday where Nutrition scored 5 and Fitness scored 2, Then the side panel titled "Tue" shows a "5" row with Nutrition and a "2" row with Fitness and no other rows. (refs BR-VB-WK-06)
- **AC-VB-WK-05** Given a pillar's This-Week average is 3.5, Then it is listed under "4" in the buckets; given 3.4, under "3". (refs BR-VB-WK-07)
- **AC-VB-WK-06** Given an active checklist item completed on 6 of the 7 days, Then its row reads "6/7" with a primary-coloured bar; on all 7, green; on 3, amber; on 1, muted. (refs BR-VB-WK-08, 09)
- **AC-VB-WK-07** Given the review week is the current week, Then the next-week chevron is disabled and the previous-week chevron moves the label back seven days. (refs BR-VB-WK-01)
- **AC-VB-WK-08** Given the 3 Months pill is active and the review week is 6 months ago, Then the averages use rows from the 3 months before that review date only. (refs BR-VB-WK-03)
- **AC-VB-WK-09** Given the filter chip for Career is selected, When "Email review" is pressed, Then the emailed HTML contains the chart with only the Career bars. (refs §9)
