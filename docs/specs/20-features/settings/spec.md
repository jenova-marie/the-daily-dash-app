# Settings — Feature Spec

**Feature code:** `SET` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 156 · Described 14 · Partial 7

**Sources owned:** `src/pages/Settings.jsx` (all cards, dialogs, and the floating notice); the `ModernTimePicker` binding at `src/pages/Settings.jsx:962` (picker mechanics owned by `10-architecture/shared-interactions.md` §4b); the Trash Bin card (`src/pages/Settings.jsx:178-226,987-1052`; the task-side view is in `20-features/tasks/google-tasks.md` §5)
**Sources referenced (owned elsewhere):** `base44/functions/checkConnectorStatus`, `getGoogleCalendars`, `getGoogleTaskLists`, `syncGoogleCalendarToApp`, `syncGoogleTasks`, `autoSync` → `10-architecture/google-sync.md`; `base44/functions/deleteSyncedData`, `deleteUserAccount` → `10-architecture/admin-operations.md`; password change and account deletion mechanics, `src/pages/Settings.jsx:30-105,558-571` → `10-architecture/auth-and-account.md` §10; `base44/entities/ThemeSettings.jsonc` field catalogue → `10-architecture/preferences.md` Part A, `10-architecture/data-model/settings.md`; `TrashBin`, `SelectedCalendars`, `SelectedTaskLists`, `SyncState` → `10-architecture/data-model/tasks.md`, `data-model/sync.md`; `src/components/Layout.jsx` (nav, `featuresToggled` listener) → `20-features/app-shell` / `10-architecture/shared-interactions.md`; `src/pages/Dashboard.jsx:154` (greeting) → `20-features/dashboard`; `src/pages/Tasks.jsx:70-72,347-367` → `20-features/tasks`; `src/pages/CalendarPage.jsx:187-215` → `20-features/calendar`; `src/pages/ThemeEditor.jsx` → `20-features/theme-editor`; `base44/workflows/Daily Auto-Sync.jsonc` → `10-architecture/automations.md` §2c; `src/pages/UserManual.jsx:404-442` → `20-features/user-manual`.

**Sub-specs (Level 2):** `sync-configuration.md` (which sync settings exist, where they are set, where they are stored, and which function honours each), `trash-bin.md` (what enters the trash, the retention window, restore and permanent delete), `data-management.md` (Delete Synced Data versus Delete All App Data).

**Permissions:** per-user data; every entity touched (`ThemeSettings`, `SelectedCalendars`, `SelectedTaskLists`, `SyncState`, `TrashBin`, `Task`) is readable and writable only by its creator (`base44/entities/ThemeSettings.jsonc:97-110`, `base44/entities/TrashBin.jsonc:31-44`, `base44/entities/SelectedCalendars.jsonc:24-37`, `base44/entities/SelectedTaskLists.jsonc:24-37`, `base44/entities/SyncState.jsonc:20-33`); admin-only operations: none. The account's `role` is displayed but gates nothing on this page (`src/pages/Settings.jsx:621-624`; `auth-and-account.md` AR-AUTH-06).

## 0. Entry points & navigation

- Route: `/settings` `[Implemented]` `src/App.jsx:212` · Sidebar label: **Settings** (icon Settings) `[Implemented]` `src/components/Layout.jsx:25` · Header title text: **Settings**, published on mount and cleared on unmount `[Implemented]` `src/pages/Settings.jsx:108-109` · Position in nav order: thirteenth of fourteen (after Theme Editor, before User Manual) `[Implemented]` `src/components/Layout.jsx:12-27`; swipe-order mechanics are owned by `10-architecture/shared-interactions.md` (AR-UI-13).
- Query parameters accepted: none observed. `[Implemented]` `src/pages/Settings.jsx:107-176`
- Feature-toggle gating: none; the nav item is always shown. `[Implemented]` `src/components/Layout.jsx:25,190-194`
- Header right-slot contents: none. `[Implemented]` `src/pages/Settings.jsx:108-109`
- Secondary entry points (text references, not links): the sign-up integration dialog says "You can always connect Google later in Settings → Integrations." (`src/pages/Auth.jsx:290-341`, owned by `auth-and-account.md` AR-AUTH-01); the Calendar page sync button shows "No sync sources selected. Check Settings." when both sources are off (`src/pages/CalendarPage.jsx:199-201`, owned by `20-features/calendar`); the reset-password page says "request a new password reset link from Settings or the login page" (`src/pages/ResetPassword.jsx:25`, owned by `auth-and-account.md` §4). `[Implemented]`

### Page composition

The page is one centred column of cards in this order, followed by a floating notice and four dialogs `[Implemented]` `src/pages/Settings.jsx:608-1208`:

| # | Card title | Always shown? | Citation |
|---|---|---|---|
| 1 | **Account** | yes | `:611-644` |
| 2 | **Dashboard** | yes | `:647-786` |
| — | Post-connection notice (banner, not a card) | only after a successful connect, until dismissed | `:789-806` |
| 3 | **Integrations** | yes | `:809-862` |
| 4 | **Select Calendars to Sync** | only when any calendar row or task-list row is loaded, or either connector is connected | `:864-900` |
| 5 | **Auto-Sync Schedule** | same condition as card 4 | `:864,902-985` |
| 6 | **Trash Bin** | yes | `:987-1052` |
| 7 | **Manage App Data** | yes | `:1054-1081` |
| — | Floating notice (pinned bottom-right) showing the current sync / delete message | whenever a message is set | `:1083-1087` |
| — | Dialogs: Delete Account, Sync, Disconnect, Delete Data | on demand | `:1089-1207` |

On mount the page loads, in parallel: the signed-in user, the newest `SyncState` row, the newest `ThemeSettings` row, both connector statuses, the trash list, saved calendars, and saved task lists. `[Implemented]` `src/pages/Settings.jsx:168-176`

## 1. Purpose & user benefit

Settings is where the account owner looks after the account itself, decides which optional modules the app shows, connects and scopes the two Google connectors, recovers recently deleted tasks, and wipes synced or all data to start again. Appearance lives on a separate page (`/theme`, `20-features/theme-editor`).

User Manual, section "Settings" (`src/pages/UserManual.jsx:404-442`) `[Described]`, quoted verbatim:

> Manage your account, integrations, and data.
>
> **Account**
> View your name and email. Delete your account permanently (cannot be undone).
>
> **Google Calendar Integration**
> - Click **Connect Google Calendar** to authorize access.
> - Once connected, click **Manage Calendars** to toggle which calendars to sync.
> - Click **Sync Now** to pull events (past 30 days and forward). Invalid calendars are auto-deselected.
> - Set **Auto-Sync times** to have the app sync automatically at specific times each day.
> - **Disconnect** at any time to remove access.
>
> **Google Tasks Integration**
> - Connect Google Tasks to sync task lists from Google into the app.
> - Use the **Sync Tasks** button to pull tasks in. Existing tasks matched by Google Task ID are updated; new ones are created.
> - Set a default **task category label and color** to apply automatically to synced tasks.
>
> **Data Management**
> Delete all synced calendar or task data from the app without affecting your actual Google data. Useful for re-syncing from scratch. You can also review and manage **deleted sync items** to prevent unwanted re-imports.

Other manual sentences that point at this page `[Described]`: "Toggle features on/off (Education, Chores, Vision Board) in Settings to show/hide their dashboard widgets." `src/pages/UserManual.jsx:34`; "deleted tasks can be recovered from the Trash Bin in Settings within 30 days." `:111`; "Connect Google Tasks in Settings, then use the "Sync" button to pull tasks in bidirectionally." `:128`; "Set a default sync category in Settings to apply automatically to newly synced Google Tasks." `:129`; "Connect your Google Calendar in Settings, select which calendars to sync, then click "Sync Google Calendar" to import events." `:149`; "Customize the dashboard header greeting name in Theme Editor settings." `:33`.

## 2. Concepts & vocabulary

Glossary terms used: **account owner**, **admin** (displayed as the role value only), **connector**, **import**, **push**, **trash**, **feature toggle**, **account preference**, **device-local preference**, **event**, **schedule item**, **today**.

Feature-local terms, defined once:

- **Connector card** — one row of the Integrations card for a single connector: icon, name, description, optional account/last-sync lines, and one state button. `src/pages/Settings.jsx:817-860`
- **Sync sources** — the set of sources the "What would you like to sync?" dialog has ticked, persisted as `ThemeSettings.sync_sources`. `src/pages/Settings.jsx:133,1126-1141`
- **Manual selection** — the per-calendar checkboxes in "Select Calendars to Sync" (`SelectedCalendars.is_selected`). `src/pages/Settings.jsx:877-898`
- **Auto-sync selection** — the separate per-calendar checkboxes in "Auto-Sync Schedule" (`ThemeSettings.auto_sync_calendar_ids`), and the per-list checkboxes (`SelectedTaskLists.is_selected`). `src/pages/Settings.jsx:904-954`
- **Post-connection notice** — the dismissable banner that appears after a connector is confirmed connected. `src/pages/Settings.jsx:789-806`
- **Floating notice** — the pinned bottom-right message box that shows sync, fetch, and delete outcomes. `src/pages/Settings.jsx:1083-1087`

The UI says "Integrations" for connectors and "category" for the imported-task label; this spec uses the glossary terms.

## 3. User stories

- **US-SET-01** As the account owner, I want to see which email, name, and role my account carries so that I know which account I am signed in to. `[Implemented]` `src/pages/Settings.jsx:613-624`
- **US-SET-02** As the account owner, I want to change my password from inside the app by proving I know the current one so that I do not need an emailed link. `[Implemented]` `src/pages/Settings.jsx:30-105`
- **US-SET-03** As the account owner, I want to delete my account and its data after a clear warning so that leaving is final and deliberate. `[Implemented]` `src/pages/Settings.jsx:632-642,1089-1109`
- **US-SET-04** As the account owner, I want the dashboard greeting to call me by a name of my choosing so that the app feels personal. `[Implemented]` `src/pages/Settings.jsx:696-703,654-655`, `src/pages/Dashboard.jsx:154`
- **US-SET-05** As the account owner, I want to hide Vision Board, Education, or Chores so that modules I do not use disappear from navigation. `[Implemented]` `src/pages/Settings.jsx:706-757`, `src/components/Layout.jsx:51-58,127-131,190-194`
- **US-SET-06** As the account owner, I want the Tasks page to open with groups collapsed or expanded on this device so that the list starts the way I prefer. `[Implemented]` `src/pages/Settings.jsx:759-783`, `src/pages/Tasks.jsx:70-72`
- **US-SET-07** As the account owner, I want to connect Google Calendar and Google Tasks separately, see whether each is connected, and disconnect either at any time. `[Implemented]` `src/pages/Settings.jsx:23-26,153-166,370-423,809-862`
- **US-SET-08** As the account owner, I want to be told what to do next right after connecting so that my first sync includes the right calendars or lists. `[Implemented]` `src/pages/Settings.jsx:404-407,789-806`
- **US-SET-09** As the account owner, I want to choose which Google calendars are imported and see when each was last synced. `[Implemented]` `src/pages/Settings.jsx:489-499,541-547,866-900`
- **US-SET-10** As the account owner, I want to run a sync now and pick whether it covers calendar events, tasks, or both. `[Implemented]` `src/pages/Settings.jsx:873-875,1111-1154`
- **US-SET-11** As the account owner, I want to choose calendars, task lists, and daily times for automatic syncing so that the app stays current without me. `[Implemented]` (UI and storage) `src/pages/Settings.jsx:902-983`; `[Partial]` (enforcement) `base44/functions/autoSync/entry.ts:14-26,125`, `base44/workflows/Daily Auto-Sync.jsonc:10` (D-204; see `sync-configuration.md`)
- **US-SET-12** As the account owner, I want to restore a task I deleted recently, or discard it for good. `[Implemented]` `src/pages/Settings.jsx:178-226,987-1052`
- **US-SET-13** As the account owner, I want to wipe everything the app imported from Google, or everything the app holds, without touching my Google data, so that I can start over. `[Implemented]` `src/pages/Settings.jsx:573-606,1054-1081,1176-1207`
- **US-SET-14** As the account owner, I want a default label and colour applied to tasks imported from Google Tasks. `[Described]` `src/pages/UserManual.jsx:129,431`; `[Partial]` no control on this page writes `task_sync_category` / `task_sync_color` (`src/pages/Settings.jsx:608-1208`; imports of `LabelPicker` and `saveLabelToHistory` at `:10-11` are unused) (D-222, Q-102)

## 4. Capabilities & interactions

### 4.1 Account card

- Read-only rows labelled **Email**, **Name**, **Role**, showing `User.email`, `User.full_name`, and `User.role` (rendered with an initial capital). `[Implemented]` `src/pages/Settings.jsx:613-624`, `base44/entities/User.jsonc:1-17`
- **Change Password** section: heading "Change Password", helper "We'll send a password reset link to your email address.", then a full-width button **Change Password** (key icon). `[Implemented]` `src/pages/Settings.jsx:626-630,71-74` (D-332: the helper describes an emailed link; the control changes the password inline)
- Clicking the button reveals an inline form with three masked fields, each placeholder "••••••••": **Current Password**, **New Password**, **Confirm New Password**; buttons **Save Password** (label "Saving..." with spinner while saving) and **Cancel**. All inputs and both buttons are disabled while saving. Opening the form clears any earlier failure or success text. `[Implemented]` `src/pages/Settings.jsx:71,76-101`
- Validation on submit, in order, each shown as red text above the fields: "Please fill in all fields" (any of the three empty); "New passwords do not match"; "Password must be at least 6 characters" (new password shorter than 6). `[Implemented]` `src/pages/Settings.jsx:39-53`
- On success the three fields clear and "✓ Password changed successfully!" shows in green; after 2 s the form closes. On failure the platform message is shown, or "Failed to change password. Check your current password." when there is none. The password call itself is owned by `auth-and-account.md` §10. `[Implemented]` `src/pages/Settings.jsx:54-66,78-79`
- **Delete Account**: a destructive full-width button **Delete Account** (alert icon) with helper below it: "Permanently delete your account and all associated data. This action cannot be undone." `[Implemented]` `src/pages/Settings.jsx:632-642`
- The button opens an alert dialog titled **Delete Account?** (destructive colour) with description "This will permanently delete your account and all your data including tasks, schedules, goals, chores, and education plans. This action cannot be undone." and buttons **Cancel** / **Delete Account** (label "Deleting..." with spinner while running; disabled meanwhile). `[Implemented]` `src/pages/Settings.jsx:1089-1109`
- Confirming invokes the account-deletion function, then signs out and hard-replaces the browser location with `/auth`. On failure a browser alert reads "Failed to delete account: <message>" and the dialog closes. Deletion ordering and entity coverage are owned by `auth-and-account.md` AR-AUTH-09 and `admin-operations.md` §2.8 (D-333, D-214). `[Implemented]` `src/pages/Settings.jsx:558-571`
- Manual: "View your name and email. Delete your account permanently (cannot be undone)." `[Described]` `src/pages/UserManual.jsx:414`

### 4.2 Dashboard card

- A **Save** button sits at the card's top-right (label "Saving..." with spinner while saving, then "Saved" with a check icon for 2 s). It writes `dashboard_header` (the typed text, or `null` when empty) together with the three feature toggles' current values to the newest `ThemeSettings` row (creating one when none exists), then dispatches the `featuresToggled` window event with the current toggle values. `[Implemented]` `src/pages/Settings.jsx:649-694`
- **Custom Display Name**: label, helper "Override your first name in the dashboard greeting", a text input with placeholder "e.g., Boss, Friend". Pre-filled from `ThemeSettings.dashboard_header` (empty when unset). Saved only by the card's Save button; typing alone writes nothing. `[Implemented]` `src/pages/Settings.jsx:279,696-703,654-655`
- The greeting consumer is the Dashboard header: `Good {Morning|Afternoon|Evening}, {dashboard_header}` when set, else the first word of the full name (`20-features/dashboard` §4.1). `[Implemented]` `src/pages/Dashboard.jsx:154`
- A function that would save only the display name exists but is bound to no control. `[Partial]` `src/pages/Settings.jsx:333-348` (no reference elsewhere in the file)
- Manual: "Customize the dashboard header greeting name in Theme Editor settings." `[Described]` `src/pages/UserManual.jsx:33` (D-851: the control is on the Settings page; the Theme Editor has no such field)
- **Feature Toggles**: label "Feature Toggles", helper "Enable or disable app features", then three switch rows labelled **Vision Board**, **Education**, **Chores** in that order. Each switch shows on (filled) or off. Initial values come from `ThemeSettings.enable_vision_board` / `enable_education` / `enable_chores`, each defaulting to on when absent. `[Implemented]` `src/pages/Settings.jsx:138,280-286,706-757`, `base44/entities/ThemeSettings.jsonc:55-66`
- Flipping any switch, in one click: updates the three-value map in memory, dispatches `featuresToggled` with the new map, then saves all three `enable_*` values to `ThemeSettings` (update, or create). All three switches are disabled while that save is in flight. Propagation rules (sidebar hide, swipe ring, Daily Schedule reads, Dashboard registry does not read) are owned by `preferences.md` Part B (AR-PREF-20..26, D-120, D-132). `[Implemented]` `src/pages/Settings.jsx:718-743`, `src/components/Layout.jsx:51-58,127-131,190-194`
- Manual: "Toggle features on/off (Education, Chores, Vision Board) in Settings to show/hide their dashboard widgets." `[Described]` `src/pages/UserManual.jsx:34` (D-120)
- **Task Manager**: label "Task Manager", one switch row **Default task list collapsed** with helper "Start with all task groups collapsed on load". Initial state is on unless the device key `tasks_default_collapsed` is exactly `"0"`. Flipping writes `"1"` (on) or `"0"` (off) to that device key immediately; nothing is written to the account. The Tasks page reads the same key on load (`20-features/tasks` §4). `[Implemented]` `src/pages/Settings.jsx:140-142,759-783`, `src/pages/Tasks.jsx:70-72`

### 4.3 Post-connection notice

- After a connect attempt is confirmed (§4.4), a banner appears between the Dashboard and Integrations cards with the connector's icon, a bold line, a coaching line, and an **X** dismiss button. `[Implemented]` `src/pages/Settings.jsx:404-407,789-806`
- Google Calendar: "Google Calendar connected!" / "Before syncing, scroll down to "Select Calendars to Sync" and choose which calendars to include." `[Implemented]` `src/pages/Settings.jsx:794,798`
- Google Tasks: "Google Tasks connected!" / "Before syncing, scroll down to "Auto-Sync Schedule" and choose which task lists to include under "Task lists to auto-sync"." `[Implemented]` `src/pages/Settings.jsx:794,799` (D-483: neither import reads the task-list selection)
- The banner persists until dismissed or the page is left; only one banner shows at a time (a later connect replaces it). `[Implemented]` `src/pages/Settings.jsx:146,405-406,802`

### 4.4 Integrations card

- Two connector cards, in order: **📅 Google Calendar** — "Sync events to your daily schedule"; **✓ Google Tasks** — "Sync tasks to your task manager". Connector ids are those in `google-sync.md` §2a (D-200). `[Implemented]` `src/pages/Settings.jsx:23-26,817-827`
- **Status probing**: on mount both connectors are probed in parallel through the status function; a connector counts as connected only when the response says `connected: true`; a thrown probe counts as not connected. While probing, the card shows "Checking connection status..." with a spinner. `[Implemented]` `src/pages/Settings.jsx:153-166,810-815`; function behaviour `google-sync.md` AR-SYNC-03
- **State button** per connector: **Connecting...** (disabled, spinner) while a connect is in progress; **Connected** (green, check icon) when connected, which opens the disconnect confirmation; **Connect** otherwise. A connected card also carries a green border. `[Implemented]` `src/pages/Settings.jsx:818-821,840-856`
- **Connected account and last sync** (Google Calendar card only): when connected and a `SyncState` row exists, two lines appear under the description: "Account: <synced_account_email>" (when set) and "Last sync: <last_sync in the device's default locale date-time format>" (when set). The newest `SyncState` row by update time is used. `[Implemented]` `src/pages/Settings.jsx:359-368,828-837` (D-216: the email is the app account's email after calendar imports)
- **Connect flow**: clicking Connect asks the platform for the connector's authorisation URL and opens it in a popup window sized 500×700. If the popup cannot be opened (blocked), the current tab is redirected to the URL instead and the flow ends there. Otherwise the page checks every 500 ms whether the popup has closed; once closed, it re-probes both connectors up to 10 times, waiting 1.5 s before each attempt, and stops early as soon as the target connector reports connected. It then reloads `SyncState`, clears the Connecting state, and, if connected, shows the post-connection notice for that connector. A failure to obtain the URL is logged only and clears the Connecting state. `[Implemented]` `src/pages/Settings.jsx:370-414`
- **Disconnect**: clicking **Connected** opens an alert dialog titled "Disconnect <connector name>?" with description "This will remove the connection. You can reconnect anytime. Your Google data will not be affected." and buttons **Cancel** / **Disconnect** (destructive). Confirming revokes the connector through the platform and marks the card not connected; failures are logged only. No data rows are touched (`google-sync.md` AR-SYNC-08). `[Implemented]` `src/pages/Settings.jsx:416-423,847-850,1156-1174`
- Manual: "Click Connect Google Calendar to authorize access." … "Disconnect at any time to remove access." `[Described]` `src/pages/UserManual.jsx:419,423`; "Connect Google Tasks to sync task lists from Google into the app." `[Described]` `:429` (D-852: manual control names versus the UI's "Connect")

### 4.5 Select Calendars to Sync card

Visible only under the condition in §0 (any saved calendar or task list, or either connector connected). `[Implemented]` `src/pages/Settings.jsx:864`

- Buttons, left to right: **Fetch Calendars** (label "Loading..." with spinner while running; disabled meanwhile) and **↻ Sync** (spinner replaces the arrow while any sync runs; disabled meanwhile). `[Implemented]` `src/pages/Settings.jsx:868-876`
- **Fetch Calendars** invokes the calendar-list function and replaces the card's list with the returned calendars (id, `calendar_id`, `calendar_name`, `is_selected`, `last_synced`). On failure the floating notice shows "✗ Failed to fetch calendars: <message>". The function creates `SelectedCalendars` rows only for calendars not yet stored and never overwrites a saved selection (`google-sync.md` AR-SYNC-15); the primary calendar is the only one selected by default. `[Implemented]` `src/pages/Settings.jsx:489-499`, `base44/functions/getGoogleCalendars/entry.ts:25-56`
- Before any fetch, the list is pre-filled from saved `SelectedCalendars` rows on mount, so earlier selections are visible while disconnected. `[Implemented]` `src/pages/Settings.jsx:296-314`
- **Per-calendar row**: a checkbox bound to `is_selected`, the calendar name, and, when `last_synced` is set, "Last synced: <MMM d, yy, hh:mm>" (US format, short month, numeric day, two-digit year, two-digit hour and minute). Ticking or unticking writes `SelectedCalendars.is_selected` for that row immediately. `[Implemented]` `src/pages/Settings.jsx:541-547,877-898`
- Which import honours this selection: both the manual calendar import and the scheduled calendar branch (`google-sync.md` §3 row "Which calendars"). `[Implemented]` `base44/functions/syncGoogleCalendarToApp/entry.ts:22`, `base44/functions/autoSync/entry.ts:26`
- **↻ Sync** opens the sync dialog (§4.6). `[Implemented]` `src/pages/Settings.jsx:873`
- Manual: "Once connected, click Manage Calendars to toggle which calendars to sync." and "Click Sync Now to pull events (past 30 days and forward). Invalid calendars are auto-deselected." `[Described]` `src/pages/UserManual.jsx:420-421` (D-852 on control names; D-201 on the window; auto-deselect on 404 is `google-sync.md` AR-SYNC-35)

### 4.6 Sync dialog — "What would you like to sync?"

- An alert dialog titled **What would you like to sync?** with description "Choose what to sync right now." and two checkbox rows: **📅 Google Calendar Events** and **✓ Google Tasks**. Buttons **Cancel** and **Sync Selected**; Sync Selected is disabled when neither box is ticked. `[Implemented]` `src/pages/Settings.jsx:1111-1118,1124-1150`
- Ticking or unticking a box saves immediately: the new source set is written to `ThemeSettings.sync_sources` (JSON array of `"calendar"` / `"tasks"`) together with the current `sync_times`. Initial values come from the stored `sync_sources`, defaulting to both. `[Implemented]` `src/pages/Settings.jsx:133,230-256,288,1128-1139`
- **Sync Selected** runs the calendar import first (when "calendar" is ticked) and then the tasks import (when "tasks" is ticked), sequentially. `[Implemented]` `src/pages/Settings.jsx:1144-1147`
- While a sync runs the dialog changes to title **Syncing...**, description "Please wait while your data is being synced. Do not close this window.", a large spinner, and the line "Syncing your data..."; clicking outside and pressing Escape are both ignored, and the open state cannot be changed from outside. `[Implemented]` `src/pages/Settings.jsx:1111-1123`
- **Calendar import outcome**: on success the floating notice shows "✓ <function message>" (for example "✓ Synced: 3 created, 1 updated, 0 deleted across 2 calendar(s)"), clears after 4 s, and the calendar list is re-fetched so "Last synced" updates. When the function returns a failure, or throws, with text containing "No active connection", "not found", or "connection", the notice reads "✗ Google Calendar is disconnected. Please reconnect it above." and the Google Calendar card flips to Connect; any other failure reads "✗ Sync failed: <message>". In every case the syncing flag clears and the dialog closes. `[Implemented]` `src/pages/Settings.jsx:425-455`; function messages `google-sync.md` §4a step 12, AR-SYNC-06/07
- **Tasks import outcome**: the same shape with "✗ Google Tasks is disconnected. Please reconnect it above." (flipping the Google Tasks card) or "✗ Tasks sync failed: <message>"; success shows "✓ <function message>" (for example "✓ Synced 4 new tasks and updated 2 existing tasks") for 4 s. `[Implemented]` `src/pages/Settings.jsx:457-487`; `google-sync.md` §5a step 6
- Because each import closes the dialog and clears the syncing flag when it finishes, with both sources ticked the dialog closes when the calendar import ends and the tasks import runs with the dialog closed and the **↻ Sync** button showing its spinner. `[Implemented]` `src/pages/Settings.jsx:451-454,483-486,1144-1147` (D-850)
- The same `sync_sources` value drives the Calendar page's sync button (`20-features/calendar`; `src/pages/CalendarPage.jsx:191-204`) and the scheduled sync (`google-sync.md` §4b step 1). `[Implemented]`
- Manual: "use the "Sync" button to pull tasks in bidirectionally" `[Described]` `src/pages/UserManual.jsx:128` (D-480, D-484 in `20-features/tasks/google-tasks.md`)

### 4.7 Auto-Sync Schedule card

Visible under the same condition as §4.5. `[Implemented]` `src/pages/Settings.jsx:864`

- **📅 Calendars to auto-sync**: heading with a button **Load Calendars** (renamed **Refresh** once a list is present; spinner while loading). The button invokes the calendar-list function and fills this card's own list (separate from the manual selection's list, although the mount-time load fills both from the same saved rows). Empty state: "Click "Load Calendars" to choose which to include in auto-sync." `[Implemented]` `src/pages/Settings.jsx:122,296-314,501-511,905-928`
- Each calendar is a checkbox row (name only). A box is ticked when the `SelectedCalendars` row id is in `ThemeSettings.auto_sync_calendar_ids`; toggling rewrites that JSON array immediately (update, or create the row). Initial values come from the stored field. `[Implemented]` `src/pages/Settings.jsx:121,289,513-526,913-924`
- No function reads `auto_sync_calendar_ids`; the scheduled import iterates the manual selection. `[Partial]` `base44/functions/autoSync/entry.ts:26` (D-204)
- **✓ Task lists to auto-sync**: heading with a button **Load Lists** (renamed **Refresh** once a list is present; spinner while loading). The button invokes the task-list function, which records each Google list in `SelectedTaskLists` (selected by default), then the card reloads the saved rows so each has an entity id. Empty state: "Click "Load Lists" to choose which task lists to include." On failure the floating notice shows "✗ Failed to fetch task lists: <message>". `[Implemented]` `src/pages/Settings.jsx:316-331,528-539,931-953`, `base44/functions/getGoogleTaskLists/entry.ts:28-42`
- Each list is a checkbox row (name only) bound to `SelectedTaskLists.is_selected`; toggling writes that row immediately. `[Implemented]` `src/pages/Settings.jsx:549-556,941-948`
- No import reads `SelectedTaskLists.is_selected`; both task imports walk every Google list. `[Partial]` `base44/functions/syncGoogleTasks/entry.ts:39`, `base44/functions/autoSync/entry.ts:125` (D-204, D-483)
- **Scheduled sync times**: heading, helper "Syncs run automatically at these times each day.", then one `ModernTimePicker` beside an **Add Time** button (plus icon). `[Implemented]` `src/pages/Settings.jsx:956-968`
- **Picker binding**: the picker's value is the pending time, initially `09:00`; confirming in the picker replaces the pending time and writes nothing. Picker mechanics (24-hour hour and minute lists, Cancel / Confirm, 12-hour display) are owned by `shared-interactions.md` §4b. `[Implemented]` `src/pages/Settings.jsx:134,962`, `src/components/ModernTimePicker.jsx:6-22`
- **Add Time** is disabled while a save is in flight or when the pending time is already in the list. Clicking appends the pending time, sorts the list as strings (which orders zero-padded `HH:MM` chronologically), and saves `ThemeSettings.sync_times` (JSON array) together with the current `sync_sources`. The pending time is not reset, so Add Time is disabled until the picker is changed. `[Implemented]` `src/pages/Settings.jsx:230-248,258-264,964-967`
- Each saved time is listed as `HH:MM` with a trash-icon button (disabled while saving) that removes it and saves the list again. The list is hidden when empty. Initial values come from the stored `sync_times`. `[Implemented]` `src/pages/Settings.jsx:266-270,287,969-980`
- Nothing reads `sync_times`: the scheduled run is one set daily trigger at 12:00 UTC (`automations.md` AR-AUTO-12..14). `[Partial]` `base44/workflows/Daily Auto-Sync.jsonc:10-12`, `base44/functions/autoSync/entry.ts:14-26` (D-204, D-112)
- Manual: "Set Auto-Sync times to have the app sync automatically at specific times each day." `[Described]` `src/pages/UserManual.jsx:422` (D-204)

### 4.8 Trash Bin card

Detail in `trash-bin.md`; the task-side view is `20-features/tasks/google-tasks.md` §5.

- On mount the card reads the 50 most recent `TrashBin` rows by `deleted_at` and keeps only those whose `deleted_at` is within the last 24 hours of the device clock. `[Implemented]` `src/pages/Settings.jsx:178-195`
- States: "Loading trash..." with spinner; "Your trash bin is empty" (centred) when nothing is within the window; otherwise the line "Items in trash can be restored for 24 hours" followed by one row per item. `[Implemented]` `src/pages/Settings.jsx:989-999`
- Each row shows the snapshot's `title` (or "Untitled" when the snapshot lacks one or cannot be parsed) and "Deleted <MMM d, hh:mm>" (US short format), with two buttons: **Restore** (rotate icon; spinner while restoring) and a trash-icon button (spinner while deleting). Both are disabled while either operation on that row is in flight. Neither asks for confirmation. `[Implemented]` `src/pages/Settings.jsx:1000-1047`
- **Restore**: parses the snapshot; when `item_type` is `task`, creates a new `Task` from every snapshot field except `id`; then deletes the trash row and reloads the list. Failures are logged only. `[Implemented]` `src/pages/Settings.jsx:197-214`
- **Permanent delete**: deletes the trash row and reloads the list. Failures are logged only. `[Implemented]` `src/pages/Settings.jsx:216-226`
- Manual: "deleted tasks can be recovered from the Trash Bin in Settings within 30 days." `[Described]` `src/pages/UserManual.jsx:111` (D-486)

### 4.9 Manage App Data card

Detail in `data-management.md`; function internals in `admin-operations.md` §2.7.

- Section **Delete Synced Data**: helper "Remove all synced Google Calendar events and tasks. Your Google data remains unchanged." and a destructive full-width button **Delete Synced Data** (alert icon). `[Implemented]` `src/pages/Settings.jsx:1056-1067`
- Section **Delete All App Data**: helper "Remove everything: synced data, tasks, chores, goals, checklists, education plans, quotes, and links. Cannot be undone." and a destructive full-width button **Delete All App Data** (alert icon). `[Implemented]` `src/pages/Settings.jsx:1068-1079`
- Both buttons open the same alert dialog, with the all-data flag set only by the second. Titles (destructive colour) and descriptions: **Delete Synced Data?** — "This will permanently remove all synced Google Calendar events and tasks from your app. You can re-sync your data anytime."; **Delete All App Data?** — "This will permanently remove ALL app data including tasks, chores, goals, checklists, education plans, quotes, links, and synced data. This cannot be undone." Buttons **Cancel** (also clears the all-data flag) and **Delete Synced Data** / **Delete Everything** (destructive). `[Implemented]` `src/pages/Settings.jsx:1061,1073,1176-1189,1195-1204`
- While running: title **Deleting...**, description "Please wait while your data is being deleted. Do not close this window.", a large destructive-coloured spinner, and "This may take a few minutes..."; outside clicks and Escape are ignored and the dialog cannot be closed from outside. The floating notice meanwhile reads "Deleting data... this may take a few minutes". `[Implemented]` `src/pages/Settings.jsx:576,1176-1177,1180,1184,1190-1194`
- Confirming invokes the deletion function with `{ deleteAllAppData: true|false }`; after it returns, every connector currently shown as connected is disconnected (failures ignored) "so data doesn't re-sync automatically"; the floating notice then reads "✓ Synced data deleted & integrations disconnected" or "✓ All app data deleted & integrations disconnected"; 2 s later the notice clears, the dialog closes, and the flag resets; connector status and `SyncState` are re-probed. The page does not reload theme settings, calendars, task lists, or the trash list afterwards. `[Implemented]` `src/pages/Settings.jsx:573-596`
- On failure the floating notice reads "✗ Failed to delete data: <message>" and stays; after 3 s the dialog closes and the flag resets. `[Implemented]` `src/pages/Settings.jsx:597-605`
- Manual: "Delete all synced calendar or task data from the app without affecting your actual Google data. Useful for re-syncing from scratch. You can also review and manage deleted sync items to prevent unwanted re-imports." `[Described]` `src/pages/UserManual.jsx:436` (the review panel lives on the Calendar page, `20-features/calendar/deleted-item-review.md`; D-211)

### 4a. Keyboard & pointer

- **Enter** submits the Change Password form (it is a native form). `[Implemented]` `src/pages/Settings.jsx:77,93`
- **Escape** and clicking outside close the Delete Account and Disconnect dialogs at any time; they are ignored by the Sync dialog while syncing and by the Delete Data dialog while deleting. `[Implemented]` `src/pages/Settings.jsx:1089,1111-1112,1156,1176-1177`
- Switch rows (feature toggles, Task Manager) and checkbox rows (calendars, task lists, sync sources) toggle on a single click anywhere on the row's label or control. `[Implemented]` `src/pages/Settings.jsx:716-753,761-782,880-885,916-922,942-948,1127-1140`
- Hover on switch and checkbox rows applies a highlight. `[Implemented]` `src/pages/Settings.jsx:716,761,880,916,942,1127`
- No double-click, long-press, swipe, or drag behaviour on this page; page-level swipe navigation is `shared-interactions.md` AR-UI-13. `[Implemented]` `src/pages/Settings.jsx:608-1208`

### 4b. View state & persistence

| Control | Values | Default | Scope (memory / device `key` / account `Entity.field`) |
|---|---|---|---|
| Change Password form open | open / closed | closed | memory `src/pages/Settings.jsx:31` |
| Custom Display Name (typed) | text | `ThemeSettings.dashboard_header` or empty | memory until Save; account `ThemeSettings.dashboard_header` `:125,279,655` |
| Vision Board / Education / Chores | on / off each | on | account `ThemeSettings.enable_vision_board` / `enable_education` / `enable_chores` `:280-286,725-729` |
| Default task list collapsed | on / off | on unless key is `"0"` | device `tasks_default_collapsed` (`"1"` / `"0"`) `:140-142,770` |
| Connector status | connected / not, per connector | probed on mount | memory `:111,153-166` |
| Post-connection notice | calendar / tasks / none | none | memory `:146` |
| Manual calendar selection | ticked / unticked per calendar | primary only (set by fetch) | account `SelectedCalendars.is_selected` `:544` |
| Sync sources | subset of {calendar, tasks} | both | account `ThemeSettings.sync_sources` (JSON) `:133,235,288` |
| Auto-sync calendars | subset of saved calendar ids | none | account `ThemeSettings.auto_sync_calendar_ids` (JSON) `:121,289,518` |
| Task lists to auto-sync | ticked / unticked per list | ticked (set by fetch) | account `SelectedTaskLists.is_selected` `:553` |
| Pending sync time | `HH:MM` | `09:00` | memory `:134` |
| Scheduled sync times | list of `HH:MM` | empty | account `ThemeSettings.sync_times` (JSON) `:132,235,287` |
| Trash list | rows within 24 h | loaded on mount | memory `:148,181-189` |
| Delete-all flag | true / false | false | memory `:131,1061,1073` |
| Floating notice text | string | empty | memory `:115` |

### 4c. Empty & fallback states

- Integrations while probing: "Checking connection status..." `[Implemented]` `src/pages/Settings.jsx:810-815`
- Calendars to auto-sync, no list: "Click "Load Calendars" to choose which to include in auto-sync." `[Implemented]` `:926`
- Task lists to auto-sync, no list: "Click "Load Lists" to choose which task lists to include." `[Implemented]` `:952`
- Select Calendars to Sync, no list: the card shows only its two buttons (no text). `[Implemented]` `:877`
- Scheduled sync times, none: the time list is omitted (picker and Add Time remain). `[Implemented]` `:969`
- Trash: "Loading trash..." / "Your trash bin is empty". `[Implemented]` `:989-995`
- Trash row without a title: "Untitled". `[Implemented]` `:1014`
- Both sync cards are absent entirely when nothing is connected and nothing is saved. `[Implemented]` `:864`
- Account rows show blank values until the user loads. `[Implemented]` `:615,619,623`
- Time picker with no value: "Select time" (not reachable here, since the pending time starts at `09:00`). `[Implemented]` `src/components/ModernTimePicker.jsx:24-32`, `src/pages/Settings.jsx:134`

## 5. Business rules

- **BR-SET-01 Singleton preference row.** Every account preference written from this page goes to the newest `ThemeSettings` row by update time; when none exists, the first write creates a row containing only the fields that write owns (`preferences.md` AR-PREF-10/11). `[Implemented]` `src/pages/Settings.jsx:236-242,272-278,336-341,519-524,661-666,730-735`
- **BR-SET-02 Toggles save on click; the display name saves on Save.** Each feature switch persists immediately and broadcasts `featuresToggled`; the display name persists only through the card's Save button, which also re-saves the toggles and re-broadcasts. `[Implemented]` `src/pages/Settings.jsx:649-668,718-742`
- **BR-SET-03 Feature toggles default on.** A missing `enable_*` value is treated as on, both here and in the entity default. `[Implemented]` `src/pages/Settings.jsx:280-284`, `base44/entities/ThemeSettings.jsonc:55-66`
- **BR-SET-04 The collapsed default is device-local.** `tasks_default_collapsed` is never written to the account; a different browser starts collapsed. `[Implemented]` `src/pages/Settings.jsx:140-142,770`; `preferences.md` Part D
- **BR-SET-05 Connectors are independent.** Each connector is probed, connected, and disconnected on its own; the post-connection notice, disconnect dialog, and disconnected-sync notices name the specific connector. `[Implemented]` `src/pages/Settings.jsx:23-26,156,391,433,466,1159`
- **BR-SET-06 Connected means a token is obtainable now.** The page trusts only `connected: true` from the probe; any thrown probe or other value shows Connect. `[Implemented]` `src/pages/Settings.jsx:159-161,394-396`; `google-sync.md` AR-SYNC-03
- **BR-SET-07 Connect confirms by polling, not by callback.** Ten probes at 1.5 s intervals follow the popup closing; a connector that reports connected within that window shows the post-connection notice, otherwise no notice appears and the card shows whatever the last probe returned. `[Implemented]` `src/pages/Settings.jsx:383-407`
- **BR-SET-08 Popup blocked means same-tab redirect.** When the popup cannot open, the current tab navigates to the authorisation URL; returning to the app is a fresh page load, so no polling or notice occurs. `[Implemented]` `src/pages/Settings.jsx:376-380`
- **BR-SET-09 Disconnect always confirms and touches no rows.** The only effect is revocation of that connector. `[Implemented]` `src/pages/Settings.jsx:416-423,1156-1174`; `google-sync.md` AR-SYNC-08
- **BR-SET-10 A sync that finds no connection demotes the card.** Failure text containing "No active connection", "not found", or "connection" flips the corresponding connector to Connect without a probe. `[Implemented]` `src/pages/Settings.jsx:430-437,444-450,463-470,476-482`
- **BR-SET-11 Selection writes are immediate and per-row.** Calendar, task-list, auto-sync-calendar, and sync-source checkboxes persist on every change; no Save button governs them. `[Implemented]` `src/pages/Settings.jsx:250-256,513-526,541-556`
- **BR-SET-12 Manual selection and auto-sync selection are separate stores.** The same calendar can be ticked in one and not the other; the manual list is `SelectedCalendars.is_selected`, the auto list is `ThemeSettings.auto_sync_calendar_ids` keyed by the `SelectedCalendars` row id. `[Implemented]` `src/pages/Settings.jsx:544,518,918`
- **BR-SET-13 Sync times are unique and sorted.** Adding an existing time is refused by the disabled button and by the guard; the list is kept in ascending `HH:MM` order. `[Implemented]` `src/pages/Settings.jsx:258-264,964`
- **BR-SET-14 Sync times and sources are saved together.** Every save of either field writes both. `[Implemented]` `src/pages/Settings.jsx:230-248`
- **BR-SET-15 Sync Selected needs at least one source** and runs calendar before tasks. `[Implemented]` `src/pages/Settings.jsx:1144-1147`
- **BR-SET-16 Sync and delete dialogs lock while running.** Neither can be dismissed by Escape, outside click, or external state change until the operation ends. `[Implemented]` `src/pages/Settings.jsx:1111-1112,1176-1177`
- **BR-SET-17 Trash shows a 24-hour window and never deletes on its own.** Rows older than 24 hours are hidden, not removed; the list is capped at the 50 most recent rows before the window filter. `[Implemented]` `src/pages/Settings.jsx:181-188` (D-486)
- **BR-SET-18 Restore creates a new record.** The restored task has a new id; every other snapshot field is carried over; the trash row is removed. Only `task` snapshots are recreated. `[Implemented]` `src/pages/Settings.jsx:200-207`
- **BR-SET-19 Data wipes end with disconnection.** After either wipe, every connector currently connected is revoked, then status is re-probed. `[Implemented]` `src/pages/Settings.jsx:579-586,595`
- **BR-SET-20 Account deletion ends the session.** Success signs out and replaces the location with `/auth`; failure alerts and returns to the page. `[Implemented]` `src/pages/Settings.jsx:558-571`
- **BR-SET-21 No imported-task label control exists here.** The manual's "default task category label and color" has no writer on this page or elsewhere in `src/`. `[Described]` `src/pages/UserManual.jsx:129,431`; `[Partial]` `src/pages/Settings.jsx:10-11` (unused imports), `base44/entities/ThemeSettings.jsonc:79-86` (D-222, D-481, Q-102)

### 5a. State & lifecycle

| State | Trigger | Next state | Side effects | Citation |
|---|---|---|---|---|
| Connector: not connected | Connect clicked, popup opens | connecting | popup 500×700; 500 ms close watch | `src/pages/Settings.jsx:372-374,383` |
| connecting | popup closed; probe says connected within 10 tries | connected | reload `SyncState`; post-connection notice | `:384-407` |
| connecting | popup closed; 10 probes without success | last probe result | reload `SyncState`; no notice | `:388-403` |
| connecting | popup blocked | (page navigates away) | same-tab redirect | `:376-380` |
| connected | Disconnect confirmed | not connected | connector revoked | `:416-423,1167` |
| connected | sync failure mentions connection | not connected | notice "✗ … is disconnected. Please reconnect it above." | `:432-434,445-447,465-467,477-479` |
| connected | Delete Synced / All Data completes | not connected | revoked; re-probed | `:579-586,595` |
| Post-connection notice: hidden | connect confirmed | shown (calendar or tasks) | — | `:404-407` |
| shown | X clicked, or another connect confirmed | hidden / replaced | — | `:802,405-406` |
| Sync dialog: closed | ↻ Sync clicked | open (choose) | — | `:873` |
| open (choose) | Sync Selected | open (syncing) | imports run in order | `:1144-1147` |
| open (syncing) | an import finishes | closed | notice set; 4 s auto-clear on success | `:439-440,451-454,472-473,483-486` |
| Delete Data dialog: closed | either button | open (confirm, flag set) | — | `:1061,1073` |
| open (confirm) | Cancel | closed | flag reset | `:1197` |
| open (confirm) | confirm | open (deleting) | function invoked; notice "Deleting data…" | `:573-577,1180` |
| open (deleting) | success | closed after 2 s | connectors revoked; notice "✓ …"; re-probe | `:579-596` |
| open (deleting) | failure | closed after 3 s | notice "✗ Failed to delete data: …" | `:597-605` |
| Trash row: listed | Restore | gone | new `Task`; row deleted; list reloads | `:197-214` |
| listed | trash icon | gone | row deleted; list reloads | `:216-226` |
| listed | 24 h elapse since `deleted_at` | hidden on next load | none | `:184-188` |
| Account: active | Delete Account confirmed, success | signed out at `/auth` | function; logout; location replace | `:558-564` |
| active | Delete Account failed | active | alert; dialog closes | `:565-570` |

### 5b. Time & date semantics

- "Now" for the trash window and for stamping nothing here is the device clock; `deleted_at` is the ISO instant written by the Tasks page (`AR-TIME-12`). The 24-hour window is `(now − deleted_at) ≤ 24 h` in milliseconds. `[Implemented]` `src/pages/Settings.jsx:182-188`
- Display formats: "Last sync" uses the device's default locale date-time (`AR-TIME-16`); per-calendar "Last synced" uses `MMM d, yy, hh:mm` (US); trash "Deleted" uses `MMM d, hh:mm` (US). `[Implemented]` `src/pages/Settings.jsx:834,890,1005-1010`
- Scheduled sync times are 24-hour `HH:MM` strings compared and sorted as strings (`AR-TIME-11`). `[Implemented]` `src/pages/Settings.jsx:260`
- The scheduled workflow runs at 12:00 UTC regardless of the stored times (`AR-TIME-50`). `[Implemented]` `base44/workflows/Daily Auto-Sync.jsonc:10-12` (D-204)
- No "today", "due", or "overdue" concept is used on this page. None observed.

## 6. Data

Entities referenced from this page, with operations. Field catalogues live in `10-architecture/data-model/`.

| Entity | Operations here | Fields touched | Citation |
|---|---|---|---|
| `User` | read (me) | `email`, `full_name`, `role` | `src/pages/Settings.jsx:350-357,613-624` |
| `ThemeSettings` | list newest (`-updated_date`, 1); update; create | `dashboard_header`, `enable_vision_board`, `enable_education`, `enable_chores`, `sync_times`, `sync_sources`, `auto_sync_calendar_ids` | `:272-294,230-248,513-526,649-668,718-742` |
| `SyncState` | list newest (`-updated_date`, 1) | `synced_account_email`, `last_sync` | `:359-368,828-837` |
| `SelectedCalendars` | filter all; update | `calendar_id`, `calendar_name`, `is_selected`, `last_synced` | `:296-314,541-547` |
| `SelectedTaskLists` | filter all; update | `list_id`, `list_name`, `is_selected` | `:316-331,549-556` |
| `TrashBin` | filter all (`-deleted_at`, 50); delete | `item_type`, `item_data`, `deleted_at` | `:178-226` |
| `Task` | create (restore) | every snapshot field except `id` | `:200-204` |

Backend functions invoked: `checkConnectorStatus` (`:158,393`), `getGoogleCalendars` (`:492,504`), `getGoogleTaskLists` (`:531`), `syncGoogleCalendarToApp` (`:429`), `syncGoogleTasks` (`:462`), `deleteUserAccount` (`:561`), `deleteSyncedData` (`:577`). Platform connector calls: `connectAppUser` (`:373`), `disconnectAppUser` (`:418,583`). Auth calls: `me` (`:352`), `changePassword` (`:56`), `logout` (`:563`). `[Implemented]`

Read limits: `ThemeSettings` and `SyncState` newest 1; `TrashBin` 50; calendars and task lists unbounded. `[Implemented]` `src/pages/Settings.jsx:181,274,298,318,361`

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| out | App shell (sidebar, swipe ring) | `featuresToggled` window event with `{ vision_board, education, chores }` | `src/pages/Settings.jsx:668,723`, `src/components/Layout.jsx:51-58,127-131,190-194` |
| out | Dashboard | `ThemeSettings.dashboard_header` read for the greeting | `src/pages/Dashboard.jsx:154` |
| out | Daily Schedule | `ThemeSettings.enable_chores` / `enable_education` read on mount | `src/pages/DailySchedule.jsx:144-147` (`preferences.md` AR-PREF-24) |
| out | Tasks | device key `tasks_default_collapsed` read on load | `src/pages/Tasks.jsx:70-72` |
| out | Tasks | Restore creates a `Task` from a trash snapshot | `src/pages/Settings.jsx:200-204` |
| in | Tasks | single-row delete writes the `TrashBin` snapshot this card lists | `src/pages/Tasks.jsx:351-358` |
| out | Calendar | `ThemeSettings.sync_sources` read by the Calendar page sync button | `src/pages/CalendarPage.jsx:191-204` |
| out | Google sync (scheduled) | `sync_sources` and `SelectedCalendars.is_selected` read by `autoSync` | `base44/functions/autoSync/entry.ts:14-26` |
| out | Google sync (manual) | `SelectedCalendars.is_selected` read by the manual calendar import | `base44/functions/syncGoogleCalendarToApp/entry.ts:22` |
| out | Google sync | `sync_times`, `auto_sync_calendar_ids`, `SelectedTaskLists.is_selected` stored; no reader | `google-sync.md` §3 (D-204) |
| out | Admin operations | `deleteSyncedData`, `deleteUserAccount` invoked | `src/pages/Settings.jsx:561,577` |
| out | Auth | `changePassword`, `logout`, hard navigation to `/auth` | `src/pages/Settings.jsx:56,563-564` |
| in | Auth (sign-up dialog) | text pointer "Settings → Integrations" | `src/pages/Auth.jsx:290-341` |
| in | Calendar | text pointer "No sync sources selected. Check Settings." | `src/pages/CalendarPage.jsx:199-201` |
| in | Reset password | text pointer "from Settings or the login page" | `src/pages/ResetPassword.jsx:25` |

Deep links with query parameters: none observed.

### 7a. Feedback & notifications

All copy verbatim. The floating notice is a pinned box at the bottom-right of the viewport (`src/pages/Settings.jsx:1083-1087`).

| Kind | Trigger | Copy | Auto-clear | Tag / citation |
|---|---|---|---|---|
| inline text (green) | password changed | "✓ Password changed successfully!" | form closes after 2 s | `[Implemented]` `:57-61,79` |
| inline text (red) | password validation / failure | "Please fill in all fields" · "New passwords do not match" · "Password must be at least 6 characters" · platform message or "Failed to change password. Check your current password." | until next submit or reopen | `[Implemented]` `:42-53,63,78` |
| button label | dashboard saved | "Saved" | 2 s | `[Implemented]` `:669-670,686-689` |
| banner | connector confirmed | "Google Calendar connected!" / "Google Tasks connected!" + coaching line (§4.3) | until X | `[Implemented]` `:789-806` |
| card text | probing | "Checking connection status..." | when probes return | `[Implemented]` `:810-815` |
| alert dialog | Connected clicked | "Disconnect <name>?" / "This will remove the connection. You can reconnect anytime. Your Google data will not be affected." / Cancel / Disconnect | — | `[Implemented]` `:1156-1174` |
| floating notice | calendar import success | "✓ <message>" | 4 s | `[Implemented]` `:439-440` |
| floating notice | calendar import, connection failure | "✗ Google Calendar is disconnected. Please reconnect it above." | none | `[Implemented]` `:433,446` |
| floating notice | calendar import, other failure | "✗ Sync failed: <message>" | none | `[Implemented]` `:436,449` |
| floating notice | tasks import success | "✓ <message>" | 4 s | `[Implemented]` `:472-473` |
| floating notice | tasks import, connection failure | "✗ Google Tasks is disconnected. Please reconnect it above." | none | `[Implemented]` `:466,478` |
| floating notice | tasks import, other failure | "✗ Tasks sync failed: <message>" | none | `[Implemented]` `:469,481` |
| floating notice | calendar fetch failed | "✗ Failed to fetch calendars: <message>" | none | `[Implemented]` `:495,507` |
| floating notice | task-list fetch failed | "✗ Failed to fetch task lists: <message>" | none | `[Implemented]` `:535` |
| alert dialog | ↻ Sync | "What would you like to sync?" / "Choose what to sync right now." → "Syncing..." / "Please wait while your data is being synced. Do not close this window." / "Syncing your data..." | closes when an import ends | `[Implemented]` `:1111-1154` |
| alert dialog | Delete Account | "Delete Account?" / "This will permanently delete your account and all your data including tasks, schedules, goals, chores, and education plans. This action cannot be undone." / Cancel / Delete Account / "Deleting..." | — | `[Implemented]` `:1089-1109` |
| browser alert | account deletion failed | "Failed to delete account: <message>" | user dismisses | `[Implemented]` `:567` |
| alert dialog | Delete Synced Data | "Delete Synced Data?" / "This will permanently remove all synced Google Calendar events and tasks from your app. You can re-sync your data anytime." / Cancel / Delete Synced Data | — | `[Implemented]` `:1180,1187,1202` |
| alert dialog | Delete All App Data | "Delete All App Data?" / "This will permanently remove ALL app data including tasks, chores, goals, checklists, education plans, quotes, links, and synced data. This cannot be undone." / Cancel / Delete Everything | — | `[Implemented]` `:1180,1186,1202` |
| alert dialog (running) | either wipe | "Deleting..." / "Please wait while your data is being deleted. Do not close this window." / "This may take a few minutes..." | closes 2 s after success, 3 s after failure | `[Implemented]` `:1180,1184,1193` |
| floating notice | wipe running | "Deleting data... this may take a few minutes" | replaced by outcome | `[Implemented]` `:576` |
| floating notice | wipe success | "✓ Synced data deleted & integrations disconnected" / "✓ All app data deleted & integrations disconnected" | 2 s | `[Implemented]` `:588-591` |
| floating notice | wipe failure | "✗ Failed to delete data: <message>" | none | `[Implemented]` `:599` |
| none | trash restore / permanent delete failure | logged only | — | `[Implemented]` `:209-210,220-221` |

No celebratory effects or reminders on this page. None observed.

## 8. AI & automation

- No LLM touchpoint on this page. None observed. `src/pages/Settings.jsx:1-1210`
- Automation touchpoint: the "Daily Auto-Sync" workflow runs `autoSync` at 12:00 UTC and honours `sync_sources` and the manual calendar selection set here; it does not read the scheduled times, auto-sync calendars, or task-list selection (`automations.md` §2c AR-AUTO-12..14; `google-sync.md` §4b, §5b). `[Implemented]` `base44/workflows/Daily Auto-Sync.jsonc:10,33-34`, `base44/functions/autoSync/entry.ts:14-26,125` (D-204)
- The Settings copy that describes the automation: "Syncs run automatically at these times each day." `[Implemented]` `src/pages/Settings.jsx:959`

## 9. Onboarding content

None. The Settings page has no walkthrough dialog, no Guide button, and no onboarding key. `[Implemented]` `src/pages/Settings.jsx:107-176,608-1208` (no onboarding import or dismissal key; registry in `20-features/onboarding`)

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `tasks_default_collapsed` | `"1"`: Tasks page starts with every group collapsed; `"0"`: expanded | absent, treated as collapsed | Dashboard card → Task Manager → "Default task list collapsed" switch `src/pages/Settings.jsx:766-771` | nothing in-app |

No other localStorage key is read or written by this page. `[Implemented]` `src/pages/Settings.jsx:140-142,770` (only two `localStorage` references in the file). Account preferences written here are listed in §4b and `preferences.md` Part A.

## 11. Seed / hardcoded data used

- Connector table: two entries `{ id, name, type, icon, description }` — `69e73980123bb49cf43baf96` / "Google Calendar" / `googlecalendar` / 📅 / "Sync events to your daily schedule"; `69e7399b50555bb55752878a` / "Google Tasks" / `googletasks` / ✓ / "Sync tasks to your task manager". The Calendar id is also held as a named constant, and the Tasks id is repeated inline twice. `[Implemented]` `src/pages/Settings.jsx:23-28,458,864` (D-200)
- Feature toggle list: `vision_board` "Vision Board", `education` "Education", `chores` "Chores". `[Implemented]` `src/pages/Settings.jsx:711-715`
- Defaults: sync sources `["calendar","tasks"]`; pending sync time `"09:00"`; feature map all on; trash window 24 h; trash read cap 50; connect popup 500×700; popup watch 500 ms; probe retries 10 × 1.5 s; notice timeouts 2 s / 3 s / 4 s. `[Implemented]` `src/pages/Settings.jsx:133-134,138,181-187,374,383-389,440,473,589,600`
- Display-name placeholder "e.g., Boss, Friend". `[Implemented]` `src/pages/Settings.jsx:702`
- Cards use the shared `WidgetCard` frame with a muted background; export mechanics are owned by `export-print-email.md`. `[Implemented]` `src/pages/Settings.jsx:611,647,809,866,902,987,1054`

## 12. Print / email formats

None. The Settings cards carry no print or email action of their own; the generic `WidgetCard` frame is used only as a container (owner: `10-architecture/export-print-email.md`). None observed. `src/pages/Settings.jsx:611-1081`

## 13. Acceptance criteria

- **AC-SET-01** Given the page loads, when the user record is available, then the Account card shows Email, Name, and Role read-only, with Role capitalised. (refs US-SET-01)
- **AC-SET-02** Given the Change Password form is open, when the user submits with a new password of 5 characters that matches its confirmation, then the text "Password must be at least 6 characters" appears and no password call is made. (refs US-SET-02)
- **AC-SET-03** Given the Change Password form is open, when the current password is accepted, then "✓ Password changed successfully!" appears and the form closes after about 2 s. (refs US-SET-02)
- **AC-SET-04** Given the Delete Account dialog, when the user confirms, then the deletion function runs and, on success, the browser lands on `/auth` signed out; on failure an alert "Failed to delete account: <message>" appears and the user remains on Settings. (refs BR-SET-20)
- **AC-SET-05** Given a display name "Boss" typed into Custom Display Name, when Save is clicked, then `ThemeSettings.dashboard_header` is "Boss", the button reads "Saved" for about 2 s, and the Dashboard greeting reads "Good Morning, Boss" (time of day permitting). (refs BR-SET-02, US-SET-04)
- **AC-SET-06** Given all three feature toggles on, when Chores is switched off, then the Chores nav item disappears immediately, `ThemeSettings.enable_chores` is false, and the switch is disabled until the save completes. (refs BR-SET-02, BR-SET-03, US-SET-05)
- **AC-SET-07** Given a fresh browser with no `tasks_default_collapsed` key, when Settings opens, then "Default task list collapsed" is on; when switched off, the key holds `"0"` and the Tasks page next opens expanded in that browser only. (refs BR-SET-04, US-SET-06)
- **AC-SET-08** Given no connectors, when Settings opens, then "Checking connection status..." shows, both cards then show Connect, and the Select Calendars to Sync and Auto-Sync Schedule cards are absent. (refs BR-SET-06, §0)
- **AC-SET-09** Given Connect is clicked and the popup opens, when the popup closes and a probe within ten attempts reports connected, then the card shows Connected, "Last sync" appears if a `SyncState` row exists, and the post-connection notice for that connector appears with its coaching line. (refs BR-SET-07, US-SET-08)
- **AC-SET-10** Given Connect is clicked and the popup is blocked, when the browser refuses it, then the current tab navigates to the authorisation URL. (refs BR-SET-08)
- **AC-SET-11** Given Google Calendar is connected, when Connected is clicked and Disconnect confirmed, then the card shows Connect and no schedule items, calendar selections, or sync state rows change. (refs BR-SET-09)
- **AC-SET-12** Given Fetch Calendars returns three calendars with only the primary selected, when the user ticks a second one, then that `SelectedCalendars` row has `is_selected` true and the next Sync Selected imports both. (refs BR-SET-11, US-SET-09)
- **AC-SET-13** Given the sync dialog with both boxes ticked, when the Google Tasks box is unticked, then `ThemeSettings.sync_sources` becomes `["calendar"]` before Sync Selected is clicked, and the Calendar page sync button afterwards runs only the calendar import. (refs BR-SET-11, BR-SET-14)
- **AC-SET-14** Given the sync dialog with neither box ticked, then Sync Selected is disabled. (refs BR-SET-15)
- **AC-SET-15** Given the sync dialog is syncing, when the user presses Escape or clicks outside, then the dialog stays open and reads "Syncing..." / "Please wait while your data is being synced. Do not close this window.". (refs BR-SET-16)
- **AC-SET-16** Given a calendar import returns a failure containing "No active connection", then the floating notice reads "✗ Google Calendar is disconnected. Please reconnect it above." and the Google Calendar card shows Connect. (refs BR-SET-10)
- **AC-SET-17** Given the pending time is 09:00 and the list is empty, when Add Time is clicked, then the list shows "09:00", `ThemeSettings.sync_times` is `["09:00"]`, and Add Time is disabled until the picker is changed; adding 07:30 next lists 07:30 above 09:00. (refs BR-SET-13, BR-SET-14)
- **AC-SET-18** Given two saved sync times, when the trash icon beside one is clicked, then it disappears and `sync_times` holds the remaining one. (refs BR-SET-13)
- **AC-SET-19** Given a calendar ticked under "Calendars to auto-sync" and unticked under "Select Calendars to Sync", when the scheduled sync runs, then that calendar is not imported. (refs BR-SET-12; D-204)
- **AC-SET-20** Given a task deleted from the Tasks page 2 hours ago, when Settings opens, then the Trash Bin lists it with "Deleted <MMM d, hh:mm>" under "Items in trash can be restored for 24 hours". (refs BR-SET-17, US-SET-12)
- **AC-SET-21** Given a trash row for a task, when Restore is clicked, then a new `Task` with a different id and the same title, status, priority, label, dates, links, and recurrence fields exists, and the row is gone. (refs BR-SET-18)
- **AC-SET-22** Given a trash row, when its trash icon is clicked, then the row is gone and no task is created; no confirmation is asked. (refs BR-SET-18)
- **AC-SET-23** Given a task deleted 25 hours ago, when Settings opens, then it is not listed and its `TrashBin` row still exists. (refs BR-SET-17)
- **AC-SET-24** Given both connectors connected, when Delete Synced Data is confirmed and completes, then the notice reads "✓ Synced data deleted & integrations disconnected", both cards show Connect, and the dialog closes after about 2 s. (refs BR-SET-19, US-SET-13)
- **AC-SET-25** Given the Delete All App Data dialog, then its title is "Delete All App Data?", its confirm button reads "Delete Everything", and Cancel resets the flag so the next Delete Synced Data click shows the synced-data copy. (refs §4.9)
- **AC-SET-26** Given the delete dialog is running, when Escape is pressed, then it stays open with "Deleting..." / "Please wait while your data is being deleted. Do not close this window.". (refs BR-SET-16)
- **AC-SET-27** Given the manual's "default task category label and color" instruction, when the user looks for it on Settings, then no such control exists. (refs BR-SET-21)

## 14. Discrepancies & open questions

Entries opened here use the `SET` block. Entries cited from other specs are listed for navigation only.

- **D-850** The sync dialog's running state says "Do not close this window." and blocks dismissal while `syncing` is true (`src/pages/Settings.jsx:1111-1116`); each import's completion sets `showSyncDialog` false and `syncing` false (`:451-454,483-486`), so with both sources ticked the dialog closes after the calendar import and the tasks import runs with the dialog closed (`:1144-1147`).
- **D-851** The manual places the greeting name control in "Theme Editor settings" (`src/pages/UserManual.jsx:33`); the control "Custom Display Name" is on the Settings page's Dashboard card (`src/pages/Settings.jsx:696-703`) and the Theme Editor has no such field (`src/pages/ThemeEditor.jsx`, per `preferences.md` A.2 row `dashboard_header`).
- **D-852** The manual names the calendar controls "Connect Google Calendar", "Manage Calendars", "Sync Now" and "Sync Google Calendar" (`src/pages/UserManual.jsx:149,419-421`); the page's controls are "Connect", "Fetch Calendars", and "↻ Sync" (`src/pages/Settings.jsx:852-854,869-875`). Task-side names are D-480.
- **D-853** "Delete Synced Data" copy is "Remove all synced Google Calendar events and tasks. Your Google data remains unchanged." and the dialog says "all synced Google Calendar events and tasks from your app" (`src/pages/Settings.jsx:1058,1187`); the function's default path deletes every `ScheduleItem` regardless of `source_type`, including `event` and `custom` rows created in the app (`base44/functions/deleteSyncedData/entry.ts:69`), while deleting only tasks that carry `google_task_id` (`:22-25,75`).
- **D-854** The Dashboard card's Save button dispatches `featuresToggled` with the current toggle map and re-saves the three `enable_*` fields (`src/pages/Settings.jsx:654-668`), while each switch also saves and dispatches on click (`:718-742`); a display-name-only save function exists with no control bound to it (`:333-348`).
- Cited from other specs: D-112 / D-204 (`sync_times`, `auto_sync_calendar_ids`, `SelectedTaskLists` stored but not read), D-120 (toggles and dashboard widgets), D-132 (Layout toggle state from event only), D-200 (connector id pairs), D-211 (no tombstone writer), D-214 / D-333 (deletion entity lists), D-216 (synced account email meaning), D-222 / D-481 (no label control), D-332 (password helper copy), D-480 / D-484 (tasks sync naming and direction), D-483 (task-list selection unread), D-486 (24 hours versus 30 days).
- **Q-850** Blocks §4.6. Is the sync dialog intended to stay open until every ticked source has finished (D-850)?
- **Q-851** Blocks §4.9, `data-management.md` §2. Is "Delete Synced Data" intended to remove in-app events and custom blocks along with imported calendar rows (D-853)?
- **Q-852** Blocks §0, §4.5. Are the two sync cards intended to remain reachable while both connectors are disconnected, as they are whenever saved calendar or task-list rows exist (`src/pages/Settings.jsx:864`)?
- **Q-853** Blocks §4.2. Is the Save button on the Dashboard card intended to govern the feature toggles as well, given each switch already saves on click (D-854)?
- Cited from other specs: Q-102 (where the imported-task label is set), Q-202 (whether per-user times and auto-sync calendars are meant to drive the scheduled import), Q-330 (which connector pair is live), Q-462 (intended trash window), Q-463 (re-linking schedule items on restore).
