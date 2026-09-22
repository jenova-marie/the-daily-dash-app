# Calendar — Feature Spec

**Feature code:** `CAL` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 125 · Described 5 · Partial 3

**Sources owned:** `src/pages/CalendarPage.jsx`, `src/components/SwipeableEventItem.jsx`, `src/components/EventEditDialog.jsx`, `src/components/DeletedItemReview.jsx`, `src/components/PrintFormatCalendar.jsx`, `src/components/onboarding/CalendarOnboarding.jsx`
**Sources referenced (owned elsewhere):** `src/components/PrintRangeDialog.jsx` → `10-architecture/export-print-email.md`; `src/components/WidgetCard.jsx` → `10-architecture/export-print-email.md`; `src/lib/printUtils.js` → `10-architecture/export-print-email.md`; `src/components/TimePicker.jsx`, `src/lib/HeaderContext.jsx`, `src/components/Layout.jsx` → `10-architecture/shared-interactions.md`; `base44/functions/syncGoogleCalendarToApp`, `syncGoogleTasks`, `syncAppEventToGoogle` → `10-architecture/google-sync.md`; `base44/entities/ScheduleItem.jsonc` → `10-architecture/schedule-hub.md`; `base44/entities/DeletedSyncItem.jsonc` → `20-features/calendar/deleted-item-review.md`; `src/components/DailyToDo.jsx`, `src/pages/DailySchedule.jsx` → `20-features/daily-schedule`

**Permissions:** per-user data; admin-only operations: none

Sub-specs (Level 2): `deleted-item-review.md` — the "Items Deleted from Google Calendar" banner and tombstone review.

## 0. Entry points & navigation

- Route: `/calendar` `[Implemented]` `src/App.jsx:205` · Sidebar label: "Calendar" `[Implemented]` `src/components/Layout.jsx:16` · Header title text: "Calendar" `[Implemented]` `src/pages/CalendarPage.jsx:31` · Position in swipe order: fourth of the fourteen sidebar items (after Tasks, before Daily Schedule) `[Implemented]` `src/components/Layout.jsx:13-26`
- Query parameters accepted: none observed. `[Implemented]` `src/pages/CalendarPage.jsx:29-48`
- Feature-toggle gating: none; the item is always visible. `[Implemented]` `src/components/Layout.jsx:16`
- Header right-slot contents: one icon button titled "Guide" that re-opens the walkthrough (§9). `[Implemented]` `src/pages/CalendarPage.jsx:50,61`
- Page layout: the deleted-item review banner (when it has rows) sits above a two-card grid — the calendar card (left, two-thirds wide on large screens) and the events card (right). `[Implemented]` `src/pages/CalendarPage.jsx:218-222,389`

## 1. Purpose & user benefit

The Calendar is the month/week view of the account owner's events (Google-imported and app-created), with a per-day panel to add, search, edit, delete and export them, and a Sync button that triggers an import from Google Calendar and Google Tasks.

User Manual, section "Calendar" (`src/pages/UserManual.jsx:138-155`), verbatim:

> The Calendar shows a monthly view of all your scheduled events, with the ability to add custom events and sync from Google Calendar.
>
> - **Click a day** to see all events for that date in the side panel.
> - **Add an event** by clicking the "+" button or the "Add Event" button — fill in title, start/end time, notes, and color.
> - **Delete an event** by swiping left on it (mobile) or hovering and clicking the trash icon. If the event came from Google Calendar, it will also be deleted there.
> - **Google Calendar Sync:** Connect your Google Calendar in Settings, select which calendars to sync, then click "Sync Google Calendar" to import events. Events sync for the past 30 days and forward.
> - Events from Google Calendar are shown with a calendar icon and cannot be fully edited — edit them in Google Calendar directly.
> - Use the **Print** or **Email** icons in the widget header to export your schedule.

Landing page claims (`src/pages/LandingPage.jsx:7,12`), verbatim:

> **Smart Scheduling** — "Sync with Google Calendar, manage daily schedules, and organize time-blocked activities in one place."
>
> **Google Integration** — "Seamlessly sync Google Calendar, Google Tasks, and Google Drive for unified productivity."

Of these claims, this feature covers: the Google Calendar sync trigger and the calendar of events. "Daily schedules" and "time-blocked activities" are the Daily Schedule feature (`20-features/daily-schedule`). Google Tasks sync is triggered from this page but its result lands in Tasks (`20-features/tasks`). No Google Drive behaviour is observed in this feature's sources. `[Described]` `src/pages/LandingPage.jsx:12`

Walkthrough copy on purpose (`src/components/onboarding/CalendarOnboarding.jsx:9`), verbatim: "The monthly grid shows colored dots for days with events. Click any date to see that day's events in the panel on the right."

## 2. Concepts & vocabulary

- **event** — per glossary: a schedule item whose source type is `calendar` (imported from Google) or `event` (created on this page). The UI label for a `calendar`-sourced event's badge is "Calendar" and for an `event`-sourced one "Event". `src/components/PrintFormatCalendar.jsx:14-17`
- **remove from app** — per glossary: marking a `calendar`-sourced event `deleted_from_app`. The UI button reads "Delete here only".
- **push** / **import** — per glossary. The page's Sync button triggers an import; creating, editing or deleting a Google-linked event triggers a push.
- **Google-linked event** (feature-local) — an event whose `google_event_id` is set. Only linked events get the Google delete choice and the push-on-edit behaviour. `src/components/SwipeableEventItem.jsx:84,155,167`
- **selected date** (feature-local) — the single day whose events the right-hand panel lists; defaults to today on page load. `src/pages/CalendarPage.jsx:36`
- **displayed month / displayed week** (feature-local) — the month or week the calendar card is showing; each is tracked separately. `src/pages/CalendarPage.jsx:33-34`
- **tombstone** — per glossary; see `deleted-item-review.md`.
- **walkthrough** — per glossary; §9.

## 3. User stories

- **US-CAL-01** As the account owner, I want to see a month or week grid with dots or chips on days that have events, so that I can see at a glance when things are happening. `[Implemented]` `src/pages/CalendarPage.jsx:305-385`
- **US-CAL-02** As the account owner, I want to click a day and see that day's events listed in time order, so that I can review one day at a time. `[Implemented]` `src/pages/CalendarPage.jsx:107-111,316,355,390`
- **US-CAL-03** As the account owner, I want to add an event on a chosen date with a title, times and notes, and optionally have it pushed to my Google Calendar, so that events I create here also appear in Google. `[Implemented]` `src/pages/CalendarPage.jsx:142-164,392-452`
- **US-CAL-04** As the account owner, I want to edit an event's title, date and times by double-clicking it, with the change pushed to Google when the event is linked, so that both places stay in step. `[Implemented]` `src/components/SwipeableEventItem.jsx:74-97,112,181-230`
- **US-CAL-05** As the account owner, I want to delete an event and, when it is linked to Google, choose whether it is deleted from Google too or only removed from the app, so that I control what happens to my Google data. `[Implemented]` `src/components/SwipeableEventItem.jsx:150-179`; `src/pages/CalendarPage.jsx:170-185`
- **US-CAL-06** As the account owner, I want to search my events by title, notes, source or time and see the closest-in-time matches first, so that I can find an event without paging through months. `[Implemented]` `src/pages/CalendarPage.jsx:113-131,462-467`
- **US-CAL-07** As the account owner, I want one button that imports from Google Calendar and Google Tasks according to my Settings, so that I can refresh without leaving the page. `[Implemented]` `src/pages/CalendarPage.jsx:187-215,233-242`
- **US-CAL-08** As the account owner, I want to print or email the calendar for a date range, or the events of a day, so that I can keep a paper or mailed copy. `[Implemented]` `src/pages/CalendarPage.jsx:53-59,244-249,453-458,513-521`
- **US-CAL-09** As the account owner, I want an event I earlier hid from the daily to-do to be restorable from the Calendar, so that I can undo that dismissal. `[Implemented]` `src/pages/CalendarPage.jsx:91-94`; `src/components/SwipeableEventItem.jsx:128-136`
- **US-CAL-10** As the account owner, I want to review items that disappeared from Google and choose to keep them deleted or restore them, so that a Google-side deletion does not silently remove my data. `[Partial]` `src/components/DeletedItemReview.jsx:7-100` (see `deleted-item-review.md`)
- **US-CAL-11** As a first-time visitor, I want a short walkthrough of the page that I can dismiss permanently and re-open from the header, so that I learn the page once. `[Implemented]` `src/pages/CalendarPage.jsx:46-50,61,522-526`; `src/components/onboarding/CalendarOnboarding.jsx:28-61`

## 4. Capabilities & interactions

### Calendar card

- **Card title is the selected date** formatted like "Monday, Sep 21" and is a button titled "Pick a date" that opens the date picker. `[Implemented]` `src/pages/CalendarPage.jsx:223-231`
- **Date picker** is a centred overlay headed "Select Date" with a single-select month calendar. Picking a date sets the selected date and the displayed month, then closes the overlay. Clicking outside closes it without change. `[Implemented]` `src/pages/CalendarPage.jsx:252-270`
- **View toggle**: two segment buttons, "Month" and "Week". Default is Month. `[Implemented]` `src/pages/CalendarPage.jsx:32,286-295`
- **Previous / next** buttons move the displayed month by one month in Month view, or the displayed week by one week in Week view. The two positions are tracked independently: moving months does not move the displayed week and vice versa. `[Implemented]` `src/pages/CalendarPage.jsx:33-34,273-278,297-302`
- **Heading** between the arrows reads the displayed month as "September 2026" in Month view, or the displayed week as "Sep 20 – Sep 26, 2026" in Week view. `[Implemented]` `src/pages/CalendarPage.jsx:280-285`
- **Month view grid**: seven columns headed "Sun Mon Tue Wed Thu Fri Sat"; the cells run from the Sunday on or before the first of the month to the Saturday on or after the last day of the month, so leading and trailing days of adjacent months are shown. `[Implemented]` `src/pages/CalendarPage.jsx:96-100,306-309`
  - Days outside the displayed month are dimmed. `[Implemented]` `src/pages/CalendarPage.jsx:319`
  - Today carries a ring. `[Implemented]` `src/pages/CalendarPage.jsx:320`
  - The selected date is filled; non-selected days highlight on hover. `[Implemented]` `src/pages/CalendarPage.jsx:321-322`
  - Clicking a cell makes it the selected date (it does not change the displayed month). `[Implemented]` `src/pages/CalendarPage.jsx:316`
  - Up to **3** dots appear under the day number, one per event in load order; extra events beyond three show no dot. Dot colour carries meaning per BR-CAL-06. `[Implemented]` `src/pages/CalendarPage.jsx:326-332`
- **Week view grid**: seven columns headed with the short weekday ("Sun" … "Sat") starting Sunday; each column is a tall cell. `[Implemented]` `src/pages/CalendarPage.jsx:340-348`
  - Today carries a ring; the selected date is tinted with a border and its day number is filled; today's day number is highlighted when not selected. `[Implemented]` `src/pages/CalendarPage.jsx:358-368`
  - Clicking a cell makes it the selected date. `[Implemented]` `src/pages/CalendarPage.jsx:355`
  - Up to **4** event titles are shown as truncated coloured chips (colour per BR-CAL-06); when a day has more, a line reads "+N more" where N is the count beyond four. `[Implemented]` `src/pages/CalendarPage.jsx:369-378`
- **Header actions** (right slot of the calendar card):
  - **Sync** button titled "Sync calendar and tasks"; disabled and spinning while a sync runs. Behaviour per §7 and BR-CAL-12. `[Implemented]` `src/pages/CalendarPage.jsx:233-242`
  - **Print calendar** and **Email calendar** buttons open the date-range dialog (§12) prefilled with the displayed month's first and last day in Month view, or the displayed week's Sunday and Saturday in Week view. `[Implemented]` `src/pages/CalendarPage.jsx:244-249`

### Events card (day panel)

- **Card title** reads "Events — Sep 21" for the selected date. `[Implemented]` `src/pages/CalendarPage.jsx:390`
- **Header actions**: "Add event" (+), "Print events", "Email events". The print/email buttons open the date-range dialog prefilled with the selected date as both start and end. `[Implemented]` `src/pages/CalendarPage.jsx:392-397,453-458`
- **Search box** with placeholder "Search events..." filters per BR-CAL-09/10. `[Implemented]` `src/pages/CalendarPage.jsx:462-467`
- **List**: when no search text, the selected date's events sorted by start time (BR-CAL-08); when searching, the matching events across everything loaded, sorted by closeness to now (BR-CAL-10). Each row is a `SwipeableEventItem`. `[Implemented]` `src/pages/CalendarPage.jsx:107-131,477-499`

### Add event

- The "+" button opens a dialog titled "Add Calendar Event". `[Implemented]` `src/pages/CalendarPage.jsx:392-399`
- Fields, in order: `[Implemented]` `src/pages/CalendarPage.jsx:38,401-448`
  | Field | Control | Default | Notes |
  |---|---|---|---|
  | Title | text, placeholder "Event title" | empty | required (BR-CAL-01) |
  | Date | button showing the selected date as "Monday, Sep 21, 2026"; opens an overlay calendar | the page's selected date | choosing a date here also changes the page's selected date `src/pages/CalendarPage.jsx:416-426` |
  | Start | time input | `09:00` | |
  | End | time input | `10:00` | |
  | Notes | multi-line text, placeholder "Add notes..." | empty | |
  | Sync to Google Calendar | checkbox | checked | value persists for the rest of the page visit; it is not reset after adding `src/pages/CalendarPage.jsx:39,152` |
- Confirm button "Add Event". On confirm: a schedule item is created with source type `event`, the chosen date, times and notes; the form resets to its defaults; the dialog closes; the list reloads. If the checkbox is on, a push with action `create` is requested and the list reloads again once it returns. A push failure is logged only; nothing is shown to the account owner. `[Implemented]` `src/pages/CalendarPage.jsx:142-164,449`
- No colour field exists on this dialog. `[Implemented]` `src/pages/CalendarPage.jsx:400-450` (contrast D-503)

### Event row (`SwipeableEventItem`)

- Shows a colour dot (BR-CAL-06), the title, a second line "Sep 21 · 09:00 — 10:00" (date, start, end), and the notes with any HTML tags stripped. `[Implemented]` `src/components/SwipeableEventItem.jsx:114-124`
- **Reveal actions**: on mouse hover, or after a swipe left of more than 50px horizontally with under 50px vertical drift; a swipe right of the same size hides them again. Revealed actions are: "Re-add to To Do" (only when the event is hidden from the daily to-do) and a destructive delete button. `[Implemented]` `src/components/SwipeableEventItem.jsx:38-62,126-146`
- **Re-add to To Do** clears the event's `hidden_from_todo` flag and reloads. `[Implemented]` `src/pages/CalendarPage.jsx:91-94,494-495`; `src/components/SwipeableEventItem.jsx:128-136`

### Edit event (from the Calendar page)

- Opened by double-click, or by two touches starting within 300ms. `[Implemented]` `src/components/SwipeableEventItem.jsx:41-46,112`
- Dialog "Edit Event" with fields: Title (text), Date (button showing "Sep 21, 2026" that opens a popover calendar), Start and End (time inputs). Buttons "Cancel" and "Save" (reads "Saving..." while saving). `[Implemented]` `src/components/SwipeableEventItem.jsx:181-230`
- Notes are carried in the edit form and written back unchanged; the dialog has no Notes field. `[Implemented]` `src/components/SwipeableEventItem.jsx:26-32,76-82,186-219`
- On Save: the schedule item's title, date, start, end and notes are updated. If the event is Google-linked, a push with action `update` is requested with the merged values; a push failure is logged only. The dialog closes and the list reloads. `[Implemented]` `src/components/SwipeableEventItem.jsx:74-97`
- This dialog is available for every event the page lists, including `calendar`-sourced ones. `[Implemented]` `src/pages/CalendarPage.jsx:477-499`; `src/components/SwipeableEventItem.jsx:112` (contrast D-502)

### Edit event (from Daily Schedule and Daily To-Do — `EventEditDialog`)

This component is owned here; it is opened by the Daily Schedule grid and the daily to-do (`20-features/daily-schedule`), which describe when it opens. `[Implemented]` `src/pages/DailySchedule.jsx:1129-1134`; `src/components/DailyToDo.jsx:323-332`

- Dialog "Edit Event". Shows the title as read-only text and, when Google-linked, the line "Synced with Google Calendar". `[Implemented]` `src/components/EventEditDialog.jsx:59-64`
- Date: a button showing "Sep 21, 2026" (or "Pick a date" when empty) opening a popover calendar; dates before today are disabled. `[Implemented]` `src/components/EventEditDialog.jsx:65-86`
- Start Time and End Time use the shared `TimePicker` (`10-architecture/shared-interactions.md`). `[Implemented]` `src/components/EventEditDialog.jsx:87-96`
- When Google-linked, a checkbox "Apply permanent changes to Google Calendar" appears. Its value is set once, when the dialog component first mounts, from whether that first event is linked; it is not recomputed when a different event is opened. `[Implemented]` `src/components/EventEditDialog.jsx:20,22-28,97-102` (Q-501)
- Buttons: "Cancel"; "Hide from Schedule" only when the host supplies a hide action (the daily to-do does: it sets `hidden_from_grid`; the Daily Schedule grid does not); "Save" with a spinner while saving. `[Implemented]` `src/components/EventEditDialog.jsx:103-114`; `src/components/DailyToDo.jsx:328-331`
- On Save: date, start and end are updated; if linked and the checkbox is on, a push with action `update` is requested (failure logged only); the host's reload runs and the dialog closes. `[Implemented]` `src/components/EventEditDialog.jsx:30-52`

### Delete event

- The delete button opens a dialog titled "Delete Event?". `[Implemented]` `src/components/SwipeableEventItem.jsx:150-153`
- **Google-linked variant** — description: "This event is synced with Google Calendar. Would you also like to delete it from Google?" Buttons: "Cancel", "Delete here only", "Delete from Google too". `[Implemented]` `src/components/SwipeableEventItem.jsx:155-156,161-171`
- **Unlinked variant** — description: "This action cannot be undone." Buttons: "Cancel", "Delete here only", "Delete". Both non-cancel buttons perform the same local deletion. `[Implemented]` `src/components/SwipeableEventItem.jsx:157,161-166,172-176`
- Buttons are disabled while the deletion runs; the dialog closes when it completes. `[Implemented]` `src/components/SwipeableEventItem.jsx:64-72`
- Outcome per BR-CAL-02/03: "Delete from Google too" first requests a push with action `delete` (failure logged only, the local step still runs); then a `calendar`-sourced event is removed from app and any other event is hard-deleted. `[Implemented]` `src/pages/CalendarPage.jsx:166-185`

### Sync

- Clicking Sync reads the account's latest `ThemeSettings` row and its `sync_sources` list (default `["calendar","tasks"]` when absent), then requests an import from Google Calendar if `calendar` is listed and from Google Tasks if `tasks` is listed, in parallel. `[Implemented]` `src/pages/CalendarPage.jsx:187-199,205`
- Messages appear in a fixed panel at the bottom-right: `[Implemented]` `src/pages/CalendarPage.jsx:200-211,505-509`
  | Condition | Text | Shown for |
  |---|---|---|
  | neither source selected | "No sync sources selected. Check Settings." | 3 s |
  | all requested imports returned | "✓ Sync complete" (then the list reloads) | 3 s |
  | any import threw | "✗ Sync failed: " followed by the failure message text | 5 s |
- The manual's per-source behaviour (which calendars, the date window, what changes) is specified in `10-architecture/google-sync.md`. `[Described]` `src/pages/UserManual.jsx:149`

### 4a. Keyboard & pointer

- Double-click on an event row opens Edit Event; two touch starts within 300ms do the same. `[Implemented]` `src/components/SwipeableEventItem.jsx:41-46,112`
- Swipe left (>50px, <50px vertical) reveals the row actions; swipe right hides them; mouse hover reveals them. `[Implemented]` `src/components/SwipeableEventItem.jsx:49-62,110-111`
- The page wraps each row in a click handler that measures double taps but takes no action; editing is handled by the row itself. `[Implemented]` `src/pages/CalendarPage.jsx:478-488`
- Overlays (date pickers) close on a click outside the panel. `[Implemented]` `src/pages/CalendarPage.jsx:253,414`
- Dialogs use the shared dialog mechanics (Escape / outside click close) per `10-architecture/shared-interactions.md`.
- No drag-and-drop, long-press, or Enter-to-submit is observed on this page. `[Implemented]` `src/pages/CalendarPage.jsx:217-527`

### 4b. View state & persistence

| Control | Values | Default | Scope |
|---|---|---|---|
| View | month, week | month | memory `src/pages/CalendarPage.jsx:32` |
| Displayed month | any month | current month | memory `src/pages/CalendarPage.jsx:33` |
| Displayed week | any week | current week | memory `src/pages/CalendarPage.jsx:34` |
| Selected date | any date | today | memory `src/pages/CalendarPage.jsx:36` |
| Search text | free text | empty | memory `src/pages/CalendarPage.jsx:45` |
| Sync to Google Calendar (add dialog) | on/off | on | memory, kept across adds `src/pages/CalendarPage.jsx:39` |
| Walkthrough dismissed | "1" / absent | absent | device `calendar_onboarded` `src/components/onboarding/CalendarOnboarding.jsx:30` |
| Sync sources honoured | subset of calendar, tasks | both | account `ThemeSettings.sync_sources` (set in Settings; read here) `src/pages/CalendarPage.jsx:192-195` |

### 4c. Empty & fallback states

- While loading: a spinner with "Loading events..." `[Implemented]` `src/pages/CalendarPage.jsx:468-471`
- Selected date has no events: "No events for this day" `[Implemented]` `src/pages/CalendarPage.jsx:472-473`
- Search text matches nothing: "No matching events" `[Implemented]` `src/pages/CalendarPage.jsx:474-475`
- Load failure: the list is emptied; no message is shown. `[Implemented]` `src/pages/CalendarPage.jsx:83-85`
- Print output with no events in range: "No events to display." `[Implemented]` `src/components/PrintFormatCalendar.jsx:49-50`
- Deleted-item banner states: see `deleted-item-review.md`.

## 5. Business rules

- **BR-CAL-01** An event cannot be added without a title; confirming with an empty title does nothing and the dialog stays open. `[Implemented]` `src/pages/CalendarPage.jsx:143`
- **BR-CAL-02** Deleting a `calendar`-sourced event removes it from app (`deleted_from_app: true`); the row is kept. `[Implemented]` `src/pages/CalendarPage.jsx:179-180`
- **BR-CAL-03** Deleting an event of any other source type (in practice `event`) hard-deletes the row. `[Implemented]` `src/pages/CalendarPage.jsx:181-182`
- **BR-CAL-04** "Delete from Google too" is offered only when the event is Google-linked, and the push is requested only when both the choice was made and the link exists. `[Implemented]` `src/components/SwipeableEventItem.jsx:167-171`; `src/pages/CalendarPage.jsx:172-178`
- **BR-CAL-05** Editing a Google-linked event from the Calendar page always requests a push of the change; editing from `EventEditDialog` requests it only when "Apply permanent changes to Google Calendar" is checked. `[Implemented]` `src/components/SwipeableEventItem.jsx:84-93`; `src/components/EventEditDialog.jsx:40-45`
- **BR-CAL-06** Source-type colour meaning on dots, chips and row dots: `calendar` blue (500), `event` blue (600), `task` theme primary, `education` purple, `chore` amber, `custom` muted; unknown source types use the `custom` colour. `[Implemented]` `src/pages/CalendarPage.jsx:133-140,329,371`; `src/components/SwipeableEventItem.jsx:13-17,117`
- **BR-CAL-07** The page loads only schedule items of source type `calendar` (up to 1000) and `event` (up to 500) whose `deleted_from_app` is false, each newest-date-first, and merges them; the load is not restricted to the displayed month or week. `[Implemented]` `src/pages/CalendarPage.jsx:77-82`
- **BR-CAL-08** The day panel sorts by start time as a string; an event with no start time sorts last through the `"99:99"` sentinel. `[Implemented]` `src/pages/CalendarPage.jsx:107-111`
- **BR-CAL-09** Search is active when the trimmed search text is non-empty. It matches, case-insensitively, the title, notes and source type by substring, and the start and end times by substring of the lower-cased query. It searches every loaded event, not only the selected date. `[Implemented]` `src/pages/CalendarPage.jsx:113-122`
- **BR-CAL-10** Search results are ordered by the absolute distance between the event's date and the current moment, nearest first. `[Implemented]` `src/pages/CalendarPage.jsx:123-130`
- **BR-CAL-11** The list shows "No events for this day" whenever the selected date has no events, before considering search text; search results are rendered only when the selected date has at least one event. `[Implemented]` `src/pages/CalendarPage.jsx:472-476` (D-506)
- **BR-CAL-12** Sync honours `ThemeSettings.sync_sources` of the most recently updated settings row; when the field is absent both sources are requested; when the parsed list contains neither, no import is requested and the "No sync sources selected" message shows. `[Implemented]` `src/pages/CalendarPage.jsx:191-204`
- **BR-CAL-13** The event list reloads whenever any `ScheduleItem` changes (realtime subscription), when the displayed month or week changes, after add, edit, delete, re-add and a completed import. `[Implemented]` `src/pages/CalendarPage.jsx:63-72,93,154,159,184,207`; `src/components/SwipeableEventItem.jsx:96`
- **BR-CAL-14** A new event is always dated on the selected date; the add dialog's date button changes the selected date rather than a separate form date. `[Implemented]` `src/pages/CalendarPage.jsx:146,416-426`
- **BR-CAL-15** Push failures (create, update, delete) never block the local change and produce no user-visible message. `[Implemented]` `src/pages/CalendarPage.jsx:157-162,173-177`; `src/components/SwipeableEventItem.jsx:85-92`; `src/components/EventEditDialog.jsx:41-44`
- **BR-CAL-16** A month is rendered Sunday-first and includes the leading and trailing partial weeks so every row has seven days. `[Implemented]` `src/pages/CalendarPage.jsx:96-100,306-309`
- **BR-CAL-17** Month view shows at most three dots per day; week view shows at most four chips per day plus a "+N more" count. `[Implemented]` `src/pages/CalendarPage.jsx:328,370-377`
- **BR-CAL-18** Google-sourced events are read-only apart from editing in Google. `[Described]` `src/pages/UserManual.jsx:150` (D-502)
- **BR-CAL-19** Google Calendar events import for the past 30 days and forward. `[Described]` `src/pages/UserManual.jsx:149`; `src/components/onboarding/CalendarOnboarding.jsx:19` (D-500; the window is owned by `10-architecture/google-sync.md`)
- **BR-CAL-20** Deleting an event that came from Google also deletes it in Google. `[Described]` `src/pages/UserManual.jsx:148` (D-501)
- **BR-CAL-21** In `EventEditDialog`, an event cannot be moved to a date before today. `[Implemented]` `src/components/EventEditDialog.jsx:82`

### 5a. State & lifecycle

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| (none) | Add Event confirmed | `ScheduleItem` exists, `source_type: event`, `deleted_from_app` default false | optional push `create`; reload `src/pages/CalendarPage.jsx:144-163` |
| event, `hidden_from_todo: true` | Re-add to To Do | `hidden_from_todo: false` | reload `src/pages/CalendarPage.jsx:91-94` |
| event, `source_type: calendar` | Delete here only / Delete from Google too | `deleted_from_app: true` (removed from app) | optional push `delete`; reload `src/pages/CalendarPage.jsx:172-180` |
| event, `source_type: event` | Delete / Delete here only | row deleted | optional push `delete`; reload `src/pages/CalendarPage.jsx:172-182` |
| event | Edit Event saved | title/date/start/end/notes updated | push `update` when linked; reload `src/components/SwipeableEventItem.jsx:74-97` |
| event (from Daily Schedule / To-Do) | `EventEditDialog` saved | date/start/end updated | push `update` when linked and checked `src/components/EventEditDialog.jsx:30-52` |
| event (from Daily To-Do) | Hide from Schedule | `hidden_from_grid: true` | host reload `src/components/DailyToDo.jsx:328-331` |
| walkthrough open | "Got it — Don't Remind Me Again" | closed; `calendar_onboarded = "1"` | none `src/components/onboarding/CalendarOnboarding.jsx:29-32` |
| walkthrough open | close by overlay / Escape | closed; key unchanged (reappears next visit) | none `src/components/onboarding/CalendarOnboarding.jsx:34` |

Tombstone transitions are in `deleted-item-review.md`.

### 5b. Time & date semantics

- "Today" for the ring, the default selected date and the default displayed month/week is the device's local date (`isToday`, `new Date()`). `[Implemented]` `src/pages/CalendarPage.jsx:33-36,320,358` (per `AR-TIME` in `10-architecture/time-and-date-semantics.md`)
- Event dates are `YYYY-MM-DD` strings compared as strings for day matching and for print ranges (inclusive on both ends). `[Implemented]` `src/pages/CalendarPage.jsx:55,102-105`
- Search distance parses the date string with `new Date(date)` and measures against the current instant. `[Implemented]` `src/pages/CalendarPage.jsx:124-129`
- Times are `HH:MM` strings; the print format renders them 12-hour ("9 AM", "9:30 AM"). `[Implemented]` `src/components/PrintFormatCalendar.jsx:1-7`
- The print header "Generated:" line and each date heading use the long US format ("Monday, September 21, 2026"). `[Implemented]` `src/components/PrintFormatCalendar.jsx:9-12,33-35`
- No "due", "overdue" or "upcoming" concept exists on this page. `[Implemented]` `src/pages/CalendarPage.jsx:29-215`
- Divergence: the tombstone restore path dates the recreated event with the UTC calendar date, not the device-local date (`deleted-item-review.md`, D-510).

## 6. Data

- **E-ScheduleItem** (`10-architecture/schedule-hub.md`, `base44/entities/ScheduleItem.jsonc`) — referenced. Fields this feature reads: `id`, `title`, `date`, `start_time`, `end_time`, `notes`, `source_type`, `google_event_id`, `hidden_from_todo`, `deleted_from_app`. Fields written: on create `title, date, start_time, end_time, source_type ("event"), notes`; on edit `title, date, start_time, end_time, notes` (Calendar) or `date, start_time, end_time` (EventEditDialog); flags `deleted_from_app`, `hidden_from_todo`, `hidden_from_grid` (via the daily to-do host). `[Implemented]` `src/pages/CalendarPage.jsx:92,144-151,180,182`; `src/components/SwipeableEventItem.jsx:76-82`; `src/components/EventEditDialog.jsx:33-37`
- Reads: two filters, `{source_type: "calendar", deleted_from_app: false}` sorted `-date` limit 1000 and `{source_type: "event", deleted_from_app: false}` sorted `-date` limit 500. `[Implemented]` `src/pages/CalendarPage.jsx:77-80`
- The entity's `source_type` enum lists `calendar, task, education, chore, custom`; the value `event` written by this page and the value `goal` labelled by the print format are not in that enum. Both are recorded as observed. `[Implemented]` `base44/entities/ScheduleItem.jsonc:18-27`; `src/pages/CalendarPage.jsx:149`; `src/components/PrintFormatCalendar.jsx:14-17` (D-509)
- **E-ThemeSettings** — referenced, read-only here: `sync_sources` (JSON array string) from the row sorted `-updated_date` limit 1. `[Implemented]` `src/pages/CalendarPage.jsx:192-195`; `base44/entities/ThemeSettings.jsonc:71-74`
- **E-DeletedSyncItem** — owned for review purposes; see `deleted-item-review.md`. `[Partial]` `base44/entities/DeletedSyncItem.jsonc`
- Realtime: subscribes to `ScheduleItem` changes for the life of the page. `[Implemented]` `src/pages/CalendarPage.jsx:67-72`
- Backend functions invoked from this feature: `syncGoogleCalendarToApp` (no arguments), `syncGoogleTasks` (no arguments), `syncAppEventToGoogle` with `{ event, eventAction: 'create' | 'update' | 'delete' }`. Internals in `10-architecture/google-sync.md`. `[Implemented]` `src/pages/CalendarPage.jsx:158,174,198-199`; `src/components/SwipeableEventItem.jsx:86-89`; `src/components/EventEditDialog.jsx:41-44`

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| out | Google sync (`10-architecture/google-sync.md`) | Sync button invokes `syncGoogleCalendarToApp` and/or `syncGoogleTasks` per `ThemeSettings.sync_sources` | `src/pages/CalendarPage.jsx:187-215` |
| out | Google sync | Add / edit / delete push via `syncAppEventToGoogle` with action create / update / delete | `src/pages/CalendarPage.jsx:158,174`; `src/components/SwipeableEventItem.jsx:86`; `src/components/EventEditDialog.jsx:41` |
| in | Settings (`20-features/settings`) | `sync_sources` chosen there is honoured here; the "No sync sources selected. Check Settings." message points the account owner there (text only, no link) | `src/pages/CalendarPage.jsx:191-201` |
| in | Google sync | `calendar`-sourced events and their `google_event_id` links are created by import; tombstones by an unobserved writer (Q-500) | `src/pages/CalendarPage.jsx:78`; `deleted-item-review.md` |
| out | Daily Schedule / daily to-do (`20-features/daily-schedule`) | `event`-sourced items created here become schedule items visible there; "Re-add to To Do" clears `hidden_from_todo` set there | `src/pages/CalendarPage.jsx:91-94,149` |
| in | Daily Schedule / daily to-do | Those pages open this feature's `EventEditDialog`; the to-do supplies "Hide from Schedule" | `src/pages/DailySchedule.jsx:1129-1134`; `src/components/DailyToDo.jsx:323-332` |
| out | Export (`10-architecture/export-print-email.md`) | `PrintRangeDialog` → `printComponent` / `emailComponent` with `PrintFormatCalendar` | `src/pages/CalendarPage.jsx:53-59,513-521` |
| in | App shell (`20-features/app-shell`) | Header title and right-slot Guide button via `HeaderContext` | `src/pages/CalendarPage.jsx:30-31,61` |
| in | Onboarding registry (`20-features/onboarding`) | key `calendar_onboarded`, localStorage-only generation | `src/pages/CalendarPage.jsx:46-48` |

Deep links: none observed. `[Implemented]` `src/pages/CalendarPage.jsx:217-527`

### 7a. Feedback & notifications

- Sync messages "No sync sources selected. Check Settings." (3 s), "✓ Sync complete" (3 s), "✗ Sync failed: …" (5 s) in a fixed bottom-right panel. `[Implemented]` `src/pages/CalendarPage.jsx:200-211,505-509`
- Confirm dialog "Delete Event?" with the two text variants in §4. `[Implemented]` `src/components/SwipeableEventItem.jsx:150-179`
- Button loading labels: "Saving..." (edit), spinner on Save (`EventEditDialog`), spinning sync icon. `[Implemented]` `src/components/SwipeableEventItem.jsx:225`; `src/components/EventEditDialog.jsx:111`; `src/pages/CalendarPage.jsx:241`
- No toasts, celebratory effects, or reminders are raised by this feature. `[Implemented]` `src/pages/CalendarPage.jsx:1-20`
- Print/email completion feedback belongs to `10-architecture/export-print-email.md`.

## 8. AI & automation

None observed on this page. Scheduled auto-sync (`base44/functions/autoSync`) is specified in `10-architecture/automations.md` and `10-architecture/google-sync.md`; this page only exposes the manual trigger. `[Implemented]` `src/pages/CalendarPage.jsx:187-215`

## 9. Onboarding content

Rendered walkthrough (`src/components/onboarding/CalendarOnboarding.jsx:5-57`), dialog title "Welcome to Calendar", subtitle "Here's how to get the most out of this page — it only takes a minute!", dismiss button "Got it — Don't Remind Me Again". `[Implemented]`

1. **1. Browse Your Calendar** — "The monthly grid shows colored dots for days with events. Click any date to see that day's events in the panel on the right. Dots are color-coded by source — blue for custom or Google Calendar events, purple for Education, amber for Chores."
2. **2. Add Custom Events** — "Click the + button in the Events panel to create a custom event for any date. Set a title, start and end time, color, and optional notes. Custom events live only in this app unless synced back to Google Calendar."
3. **3. Sync with Google Calendar & Tasks** — "Connect Google Calendar or Google Tasks in Settings, then click the sync icon here to import events. Events sync for the past 30 days and forward. When you delete a synced item, you can choose to remove it from Google too or just from this app."
4. **4. Search & Manage Events** — "Use the search bar in the Events panel to quickly find any event by title or notes. Swipe an event left (mobile) or hover to reveal the delete button. Use the print or email icons in the widget header to export your calendar for any date."

Trigger: shown on load when the device key `calendar_onboarded` is absent (or storage is unavailable, in which case it is not shown); the header Guide button re-opens it. Persistence generation: localStorage-only. Dismiss key: `calendar_onboarded` = `"1"`, written by the dialog's own button; closing the dialog any other way leaves the key unset. The page also passes an `onDontRemind` handler that the dialog does not call. `[Implemented]` `src/pages/CalendarPage.jsx:46-50,61,522-526`; `src/components/onboarding/CalendarOnboarding.jsx:28-34,54-56`

A second step set titled "View Your Calendar", "Add Custom Events", "Sync with Google", "Search & Manage" is defined in the page source and is not rendered by any component. `[Partial]` `src/pages/CalendarPage.jsx:22-27` (D-505, Q-502). Its text, verbatim:

- **View Your Calendar** — "See all your events, tasks, and activities organized in a beautiful monthly calendar view. Each colored dot represents an event—blue for Calendar events, purple for Education, amber for Chores, and more. Click any date to view or add events for that day."
- **Add Custom Events** — "Create custom events directly on any date with start and end times, and optional notes. These events appear alongside your synced Google Calendar entries. Edit or delete them anytime—the choice to sync back to Google is yours."
- **Sync with Google** — "Click the sync button to pull in all your Google Calendar events and Google Tasks in real-time. Events are color-coded by source for easy identification. Delete events here or delete from Google—both options are available."
- **Search & Manage** — "Use the search bar to find events by title, time, or notes. Swipe left on any event to delete. Click the print or email buttons to export your calendar and events list. Everything stays organized and accessible."

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `calendar_onboarded` | walkthrough dismissed permanently (`"1"`) | absent | "Got it — Don't Remind Me Again" `src/components/onboarding/CalendarOnboarding.jsx:30` | nothing in this feature |

No other device-local keys are read or written by the owned sources. `[Implemented]` `src/pages/CalendarPage.jsx:46-48,525`

## 11. Seed / hardcoded data used

- Source colour map for dots and chips (BR-CAL-06). `[Implemented]` `src/pages/CalendarPage.jsx:133-140`; row default map (calendar, event, custom) `src/components/SwipeableEventItem.jsx:13-17`
- Print badge labels: calendar → "Calendar", event → "Event", task → "Task", education → "Education", chore → "Chore", goal → "Goal", custom → "Custom"; any other value prints its raw source type. `[Implemented]` `src/components/PrintFormatCalendar.jsx:14-17,80`
- Print badge colours: calendar `#3b82f6`, event `#2563eb`, task `#10b981`, education `#a855f7`, chore `#f59e0b`, custom `#6b7280`; `goal` and unknown types use the custom colour. `[Implemented]` `src/components/PrintFormatCalendar.jsx:19-22,77`
- Add-event defaults: start `09:00`, end `10:00`. `[Implemented]` `src/pages/CalendarPage.jsx:38`
- Sync source default `["calendar","tasks"]`. `[Implemented]` `src/pages/CalendarPage.jsx:195`
- Weekday headers "Sun … Sat". `[Implemented]` `src/pages/CalendarPage.jsx:307`
- Tombstone restore defaults are in `deleted-item-review.md`.

## 12. Print / email formats

- **Trigger and range**: four buttons open the shared `PrintRangeDialog` (`10-architecture/export-print-email.md`). Prefill: calendar card → displayed month's first and last day (Month view) or displayed week's Sunday and Saturday (Week view); events card → the selected date for both start and end. The dialog is titled "Print — Select Date Range" or "Email — Select Date Range" by mode; when no range request is pending its fallback prefill is today. `[Implemented]` `src/pages/CalendarPage.jsx:244-249,453-458,513-521`
- **Selection**: on confirm, the loaded events whose date is between start and end inclusive are rendered; nothing is fetched beyond what the page already holds (BR-CAL-07). `[Implemented]` `src/pages/CalendarPage.jsx:53-58`
- **Document title**: "Calendar (2026-09-01 → 2026-09-30)" or "Events (2026-09-21)"; a single-day range shows one date without the arrow. The same string is the print heading and the email subject. `[Implemented]` `src/pages/CalendarPage.jsx:56-58`
- **Format (`PrintFormatCalendar`)**: `[Implemented]` `src/components/PrintFormatCalendar.jsx:24-95`
  - heading = title; subtitle "Generated: <long date> · N event" / "N events" (plural when N ≠ 1) `:44-47`
  - events grouped by date ascending; each group headed by the long date and "(count)" `:25-32,56-61`
  - within a date, sorted by start time with the `"99:99"` sentinel for missing times `:53`
  - columns: time (12-hour start, then "→ end" when present), title with notes beneath, and an uppercase colour badge naming the source type `:64-83`
  - rows whose `deleted_from_app` is true render at half opacity (the page never supplies such rows because of BR-CAL-07) `:65`
  - "No events to display." when the range holds nothing `:49-50`
  - print stylesheet hides `.no-print` and zeroes body margins `:92`
- Nothing is remembered between exports. `[Implemented]` `src/pages/CalendarPage.jsx:51-59`
- Mechanism (new window, 300 ms print delay, email recipient) is owned by `10-architecture/export-print-email.md`.

## 13. Acceptance criteria

- **AC-CAL-01** Given the page is opened, When it loads, Then the header reads "Calendar", the calendar card shows the current month Sunday-first with today ringed and selected, and the events card lists today's events. (refs BR-CAL-16)
- **AC-CAL-02** Given Month view, When a day has five events, Then the cell shows exactly three dots; Given Week view, Then the cell shows four chips and the line "+1 more". (refs BR-CAL-17)
- **AC-CAL-03** Given a day cell in an adjacent month is shown, When clicked, Then it becomes the selected date and the displayed month is unchanged. (refs BR-CAL-16)
- **AC-CAL-04** Given the date picker, When a date is chosen, Then the selected date and the displayed month change to it and the overlay closes. (§4)
- **AC-CAL-05** Given the add dialog with an empty title, When "Add Event" is clicked, Then nothing is created and the dialog stays open. (refs BR-CAL-01)
- **AC-CAL-06** Given the add dialog with defaults, When a title is entered and "Add Event" clicked, Then an `event`-sourced schedule item dated on the selected date from 09:00 to 10:00 exists, the form returns to defaults, and a push `create` is requested because the checkbox defaults on. (refs BR-CAL-14)
- **AC-CAL-07** Given the "Sync to Google Calendar" checkbox is unchecked and an event added, When the next add dialog opens, Then the checkbox is still unchecked. (§4b)
- **AC-CAL-08** Given an event row, When double-clicked (or double-tapped within 300 ms), Then "Edit Event" opens with title, date, start and end prefilled and no notes field. (§4)
- **AC-CAL-09** Given a Google-linked event edited from the Calendar page, When saved, Then the schedule item is updated and a push `update` is requested without any checkbox. (refs BR-CAL-05)
- **AC-CAL-10** Given a Google-linked event, When delete is chosen, Then the dialog reads "This event is synced with Google Calendar. Would you also like to delete it from Google?" with "Cancel", "Delete here only", "Delete from Google too". (refs BR-CAL-04)
- **AC-CAL-11** Given an unlinked event, When delete is chosen, Then the dialog reads "This action cannot be undone." with "Cancel", "Delete here only", "Delete". (§4)
- **AC-CAL-12** Given a `calendar`-sourced event, When "Delete here only" is confirmed, Then the row's `deleted_from_app` becomes true and it disappears from the page; the Google event is untouched. (refs BR-CAL-02)
- **AC-CAL-13** Given an `event`-sourced event, When deletion is confirmed, Then the row is deleted. (refs BR-CAL-03)
- **AC-CAL-14** Given a linked event, When "Delete from Google too" is confirmed and the push fails, Then the local removal still happens and no message is shown. (refs BR-CAL-15)
- **AC-CAL-15** Given an event with `hidden_from_todo` true, When its row is hovered or swiped, Then a "Re-add to To Do" action shows, and choosing it sets the flag false. (US-CAL-09)
- **AC-CAL-16** Given search text "dentist" and the selected date has at least one event, When typed, Then all loaded events whose title, notes, source type or times contain it are listed nearest-to-now first. (refs BR-CAL-09, BR-CAL-10)
- **AC-CAL-17** Given the selected date has no events, When search text is typed, Then the panel still reads "No events for this day". (refs BR-CAL-11)
- **AC-CAL-18** Given `sync_sources` is `["tasks"]`, When Sync is clicked, Then only the Google Tasks import is requested and "✓ Sync complete" shows for 3 s. (refs BR-CAL-12)
- **AC-CAL-19** Given `sync_sources` is `[]`, When Sync is clicked, Then no import is requested and "No sync sources selected. Check Settings." shows for 3 s. (refs BR-CAL-12)
- **AC-CAL-20** Given an import throws, When Sync is clicked, Then "✗ Sync failed: " plus the message shows for 5 s. (§7a)
- **AC-CAL-21** Given Week view showing Sep 20–26, When "Print calendar" is clicked, Then the range dialog opens prefilled 2026-09-20 to 2026-09-26; Given the events card, Then it is prefilled with the selected date twice. (§12)
- **AC-CAL-22** Given a confirmed range with no events, When printed, Then the document reads "No events to display." (§12)
- **AC-CAL-23** Given another client changes a schedule item, When the change arrives, Then the list reloads without any action by the account owner. (refs BR-CAL-13)
- **AC-CAL-24** Given `calendar_onboarded` is absent, When the page opens, Then "Welcome to Calendar" shows; When "Got it — Don't Remind Me Again" is clicked, Then the key is `"1"` and the dialog does not show on the next visit; the Guide button re-opens it. (§9)
- **AC-CAL-25** Given the walkthrough is closed by Escape, When the page is next opened, Then it shows again. (§5a)
- **AC-CAL-26** Given `EventEditDialog` for a linked event, When "Apply permanent changes to Google Calendar" is unchecked and saved, Then the schedule item is updated and no push is requested. (refs BR-CAL-05)
- **AC-CAL-27** Given `EventEditDialog`, When the date popover is opened, Then dates before today cannot be chosen. (refs BR-CAL-21)

## 14. Discrepancies & open questions

- **D-500** The User Manual (`src/pages/UserManual.jsx:149`) and the walkthrough (`src/components/onboarding/CalendarOnboarding.jsx:19`) say events sync "for the past 30 days and forward"; the import function's lower bound is 90 days before now (`base44/functions/syncGoogleCalendarToApp/entry.ts:19`). Window owned by `10-architecture/google-sync.md`.
- **D-501** The User Manual says an event from Google "will also be deleted there" (`src/pages/UserManual.jsx:148`); the delete dialog offers "Delete here only" and "Delete from Google too" and only pushes on the latter (`src/components/SwipeableEventItem.jsx:155-171`; `src/pages/CalendarPage.jsx:172-178`).
- **D-502** The User Manual says Google events "cannot be fully edited — edit them in Google Calendar directly" (`src/pages/UserManual.jsx:150`); the Calendar page opens Edit Event for every listed event including `calendar`-sourced ones and pushes title/date/time changes to Google when linked (`src/components/SwipeableEventItem.jsx:74-97,112`).
- **D-503** The User Manual (`src/pages/UserManual.jsx:147`) and walkthrough step 2 (`src/components/onboarding/CalendarOnboarding.jsx:14`) list "color" among the add-event fields; the add dialog has Title, Date, Start, End, Notes and the sync checkbox only (`src/pages/CalendarPage.jsx:400-450`).
- **D-504** Walkthrough step 1 says dots are "purple for Education, amber for Chores" (`src/components/onboarding/CalendarOnboarding.jsx:9`); the page loads only `calendar` and `event` source types (`src/pages/CalendarPage.jsx:77-80`), while the colour map does define education and chore entries (`src/pages/CalendarPage.jsx:133-140`).
- **D-505** Two walkthrough step sets exist: `src/components/onboarding/CalendarOnboarding.jsx:5-26` (rendered) and `src/pages/CalendarPage.jsx:22-27` (defined, not referenced by any render).
- **D-506** Walkthrough step 4 says search finds "any event by title or notes" (`src/components/onboarding/CalendarOnboarding.jsx:24`) and BR-CAL-09 searches all loaded events; the list renders "No events for this day" ahead of search results whenever the selected date is empty (`src/pages/CalendarPage.jsx:472-476`).
- **D-507** The User Manual names the trigger "Sync Google Calendar" (`src/pages/UserManual.jsx:149`); the page's button is titled "Sync calendar and tasks" and also imports Google Tasks (`src/pages/CalendarPage.jsx:198-199,239`).
- **D-508** The User Manual says Google events "are shown with a calendar icon" (`src/pages/UserManual.jsx:150`); the row shows a colour dot and no icon (`src/components/SwipeableEventItem.jsx:114-124`).
- **D-509** `ScheduleItem.source_type` enum is `calendar, task, education, chore, custom` (`base44/entities/ScheduleItem.jsonc:18-27`); this page writes `event` (`src/pages/CalendarPage.jsx:149`) and the print format labels `goal` (`src/components/PrintFormatCalendar.jsx:14-17`). Entity owned by `10-architecture/schedule-hub.md`.
- **D-510** See `deleted-item-review.md`: tombstone restore dates the event by the UTC calendar date (`src/components/DeletedItemReview.jsx:37`) while the rest of this feature uses the device-local date (`src/pages/CalendarPage.jsx:33-36`).
- **Q-500** Blocks: `deleted-item-review.md` §"When the banner appears". Question: no code path in `src/` or `base44/functions/` creates a `DeletedSyncItem` or sets `status: pending_review`; what is intended to populate the review queue?
- **Q-501** Blocks: §4 "Edit event (from Daily Schedule and Daily To-Do)". Question: the "Apply permanent changes to Google Calendar" checkbox takes its value once at component mount (`src/components/EventEditDialog.jsx:20`) and is not recomputed per event; what is the intended default for a linked event opened later?
- **Q-502** Blocks: §9. Question: which of the two walkthrough step sets (D-505) is the intended copy?
- **Q-503** Blocks: §4 "Edit event (from the Calendar page)". Question: the Calendar's Edit Event form carries notes but shows no Notes field (`src/components/SwipeableEventItem.jsx:26-32,186-219`); is notes editing intended from this page?
- **Q-504** Blocks: §1. Question: the landing page claims Google Drive sync (`src/pages/LandingPage.jsx:12`); no Drive behaviour is observed in this feature's sources — which spec owns that claim?
