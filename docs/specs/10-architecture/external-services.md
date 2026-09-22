# External Services

**Area:** `EXT` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 79 · Described 9 · Partial 2

**Sources owned:** none exclusively; this document is the canonical register of outbound dependencies and cites the
owning files.
**Sources referenced:** `src/components/WeatherWidget.jsx` → weather; `base44/functions/*` → google-sync, ai-services,
automations; `src/components/visionboard/Slideshow.jsx` → vision-board (slideshow); `src/pages/ThemeEditor.jsx`,
`src/App.jsx`, `index.html` → theme-editor / app-shell; `src/components/WidgetCard.jsx`, `src/lib/printUtils.js` →
export-print-email

**Permissions:** every call runs as the signed-in account owner; backend functions verify `auth.me()` and use the
account owner's own connector tokens. Admin-only: `generateDailyQuotes` (`base44/functions/generateDailyQuotes/entry.ts:12-18`).

Each service below is recorded as a product commitment: what the user gets, what the product sends, what it needs from
the user or the browser, and what happens when the service is unavailable.

---

## AR-EXT rules (summary)

- **AR-EXT-01** Weather requires the browser's geolocation permission and nothing else; no API key is configured for Open-Meteo or Nominatim. `[Implemented]` `src/components/WeatherWidget.jsx:47-58,68-79`
- **AR-EXT-02** Google Calendar and Google Tasks are reached only through backend functions using stored OAuth connections; the browser never holds a Google token. `[Implemented]` `base44/functions/getGoogleCalendars/entry.ts:12`, `src/pages/Settings.jsx:373-374`
- **AR-EXT-03** Every email the product sends goes to the signed-in account owner's own address. `[Implemented]` `src/components/WidgetCard.jsx:21-23`, `src/lib/printUtils.js:21-22`
- **AR-EXT-04** Language-model calls are made both from the browser and from backend functions; the browser calls are used for affirmations, pillar activity suggestions, and translation, the backend calls for chores, activities, and quotes. `[Implemented]` see §6
- **AR-EXT-05** Ambient audio and default background images are loaded directly from third-party CDNs by URL; nothing is proxied. `[Implemented]` `src/components/visionboard/Slideshow.jsx:7-19`, `src/pages/ThemeEditor.jsx:318-340`
- **AR-EXT-06** Text-to-speech uses the browser's built-in speech engine; the product ships no voices. `[Implemented]` `src/components/visionboard/Slideshow.jsx:158,344,376`

---

## 1. Weather: Open-Meteo forecast, Open-Meteo air quality, Nominatim

Owner feature: `20-features/weather`.

### 1.1 What the user gets

- `[Implemented]` Current temperature (°F), condition label and icon, place name, today's high and low, feels-like, humidity %, wind (mph), US AQI with a colour band, and a six-day strip (tomorrow onward) with day abbreviation, icon, high and low. `src/components/WeatherWidget.jsx:133-184`
- `[Described]` "Shows current weather for your location. Requires browser location permission on first load. Displays temperature, conditions, and a short forecast." `src/pages/UserManual.jsx:55-56`

### 1.2 Browser geolocation

- `[Implemented]` The widget calls `navigator.geolocation.getCurrentPosition` on mount unless a cache younger than 30 minutes exists. If the API is absent or the user denies, the widget renders "Enable location to see weather". `src/components/WeatherWidget.jsx:47-52,111,123-128`
- `[Implemented]` Only latitude and longitude from the position are used. `src/components/WeatherWidget.jsx:54`

### 1.3 Nominatim reverse geocoding (OpenStreetMap)

| Item | Value |
|---|---|
| Endpoint | `https://nominatim.openstreetmap.org/reverse?lat=<lat>&lon=<lon>&format=json` `[Implemented]` `src/components/WeatherWidget.jsx:57-59` |
| Authentication | none; no API key, no custom headers `[Implemented]` |
| Fields used and fallback chain | `address.city` → `address.town` → `address.village` → `address.county` → literal `"Your Location"` `[Implemented]` `:61-66` |
| Failure | any exception in the fetch chain leaves the widget with no data and no message `[Implemented]` `:106-108` |

### 1.4 Open-Meteo forecast

| Item | Value |
|---|---|
| Endpoint | `https://api.open-meteo.com/v1/forecast` `[Implemented]` `src/components/WeatherWidget.jsx:70-75` |
| Query parameters | `latitude`, `longitude`, `current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code`, `daily=weather_code,temperature_2m_max,temperature_2m_min`, `temperature_unit=fahrenheit`, `wind_speed_unit=mph`, `timezone=auto`, `forecast_days=7` |
| Authentication | none ("free, no key", source comment `:68`) |
| Fields consumed | `current.temperature_2m`, `current.apparent_temperature`, `current.relative_humidity_2m`, `current.wind_speed_10m` (rounded), `current.weather_code`, `daily.temperature_2m_max[i]`, `daily.temperature_2m_min[i]`, `daily.weather_code[i]`, `daily.time[i]` `[Implemented]` `:84-101` |
| Units shown | °F and mph `[Implemented]` `:139,162` |
| Condition mapping | WMO code table in `10-architecture/data-model/seed-data.md` §14 |

### 1.5 Open-Meteo air quality

| Item | Value |
|---|---|
| Endpoint | `https://air-quality-api.open-meteo.com/v1/air-quality` `[Implemented]` `src/components/WeatherWidget.jsx:76-79` |
| Query parameters | `latitude`, `longitude`, `current=us_aqi`, `timezone=auto` |
| Field consumed | `current.us_aqi` (null when absent; the AQI cell is hidden when null) `[Implemented]` `:94,164-168` |
| Colour bands | seed-data §14 |

### 1.6 Caching

- `[Implemented]` The combined result is stored in localStorage `weather_cache_v3` as `{ data, timestamp }` and reused for 30 minutes without geolocation or network calls. `src/components/WeatherWidget.jsx:37-44,104`
- `[Implemented]` Both Open-Meteo requests are issued in parallel after geocoding. `:69-80`

---

## 2. Quotable (daily quotes)

Owner feature: `20-features/quotes`.

| Item | Value |
|---|---|
| Endpoint | `https://api.quotable.io/quotes/random?maxLength=220&limit=5` `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:41`, `base44/functions/generateDailyQuotes/entry.ts:48` |
| Authentication | none |
| Callers | `fetchDailyQuote` (on demand from the Quotes page and the Dashboard Quote widget; `force` regenerates), `generateDailyQuotes` (scheduled, all users, admin-gated) `[Implemented]` `src/pages/Quotes.jsx:71`, `src/components/dashboard/DashboardQuote.jsx:44`, `base44/workflows/Midnight Daily Quote Generator.jsonc` |
| Selection | up to 8 attempts of 5 candidates each; the first candidate whose text (trimmed, lower-cased) has not been used by the account before is taken; `content` → `quote`, `author` → `author` `[Implemented]` `fetchDailyQuote/entry.ts:15-54` |
| Fallback | if no unused quote is obtained, InvokeLLM generates one JSON `{quote, author}` while excluding the 20 most recent quotes `[Implemented]` `fetchDailyQuote/entry.ts:56-71` |
| Result | one `DailyQuote` row per account per date with `is_favorite: false` `[Implemented]` `fetchDailyQuote/entry.ts:77-82` |
| Client timeout | 15 s race on the Quotes page `[Implemented]` `src/pages/Quotes.jsx:68-73` |
| `[Described]` | "Start each day with an inspiring AI-generated quote" `src/pages/LandingPage.jsx:13` |

---

## 3. Google Calendar and Google Tasks

Owner: `10-architecture/google-sync.md` (mechanism) and `20-features/settings` (connect UI). This section records the
external endpoints and the permissions they imply.

### 3.1 Connection model

- `[Implemented]` Two separate connectors exist, presented in Settings as "Google Calendar — Sync events to your daily schedule" and "Google Tasks — Sync tasks to your task manager". Connect opens the platform's OAuth URL in a 500×700 popup (same-tab redirect if the popup is blocked), then polls connection status up to 10 times at 1.5 s. `src/pages/Settings.jsx:24-25,373-401`
- `[Implemented]` The sign-up flow offers "Connect Google Account — Sync Google Calendar events and Google Tasks automatically on app load" or "Use Independently — Manage tasks, schedules, and goals without connecting a Google account", with "You can always connect Google later in Settings → Integrations." Choosing Google opens the Calendar popup, waits for it to close, then the Tasks popup. `src/pages/Auth.jsx:112-128,294-338`
- `[Implemented]` Connection status is probed by `checkConnectorStatus(connectorId)`, which reports `connected: true` only when an access token can be obtained. `base44/functions/checkConnectorStatus/entry.ts:5-22`
- `[Implemented]` Disconnect is confirmed with "This will remove the connection. You can reconnect anytime. Your Google data will not be affected." (per briefing) and calls the platform disconnect. `src/pages/Settings.jsx:418`
- `[Implemented]` Backend functions obtain the account owner's token with the service-role connector API and pass it as `Authorization: Bearer`. `base44/functions/getGoogleCalendars/entry.ts:12-16`
- `[Implemented]` The Google account email shown in Settings comes from `SyncState.synced_account_email`, which the import functions set to the app user's email; `syncTasksToCalendar` alone reads the Google profile endpoint. `base44/functions/syncGoogleCalendarToApp/entry.ts:185`, `base44/functions/syncTasksToCalendar/entry.ts:14-26`, `src/pages/Settings.jsx:830-831`
- `D-115` Connector ids differ between sign-up (`src/pages/Auth.jsx:17-18`), terms acceptance disconnect (`src/pages/AcceptTerms.jsx:35-36`), and Settings/functions (`src/pages/Settings.jsx:24-25`).

### 3.2 Endpoints used

| Function | Method and endpoint | Purpose | Implied permission |
|---|---|---|---|
| `getGoogleCalendars` | GET `https://www.googleapis.com/calendar/v3/users/me/calendarList` | List calendars; upsert `SelectedCalendars` with `is_selected` = Google `primary` flag for new rows `[Implemented]` `entry.ts:14-42` | Calendar read |
| `syncGoogleCalendarToApp` | GET `https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events?maxResults=250&singleEvents=true&orderBy=startTime&timeMin=<now-90d>&timeMax=<now+60d>` | Import events into `ScheduleItem` (`source_type: calendar`); a 404 deselects the calendar; cancelled events skipped `[Implemented]` `entry.ts:60-82` | Calendar read |
| `autoSync` | GET same events endpoint with `timeMin=<now-30d>` and paging; GET `https://www.googleapis.com/tasks/v1/users/@me/lists`; GET `https://www.googleapis.com/tasks/v1/lists/{listId}/tasks` | Scheduled import of calendars and all task lists `[Implemented]` `entry.ts:40-57,116-134` | Calendar read, Tasks read |
| `syncGoogleTasks` | GET `.../tasks/v1/users/@me/lists`; GET `.../tasks/v1/lists/{listId}/tasks` | Import tasks into `Task` with `google_task_id`; hidden tasks skipped; label from `task_sync_category` (default `Google Tasks`) `[Implemented]` `entry.ts:27-75` | Tasks read |
| `getGoogleTaskLists` | GET `.../tasks/v1/users/@me/lists` | List task lists; create `SelectedTaskLists` rows (`is_selected: true`) `[Implemented]` `entry.ts:14-42` | Tasks read |
| `updateGoogleTask` | PATCH `https://www.googleapis.com/tasks/v1/lists/@default/tasks/{taskId}` with `{ due }` | Push a changed due date/time `[Implemented]` `entry.ts:31-42` | Tasks write |
| `deleteToDoItem` (`delete_google`) | DELETE `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/{google_task_id}`; DELETE `https://www.googleapis.com/calendar/v3/calendars/{calendarId|primary}/events/{googleEventId}` | Remove the Google task or event behind a to-do item, then the local row `[Implemented]` `entry.ts:102-121` | Tasks write, Calendar write |
| `syncAppEventToGoogle` | POST `.../calendar/v3/calendars/{calendarId|primary}/events`; PATCH `.../events/{google_event_id}`; DELETE `.../events/{google_event_id}` | Push custom schedule items outward on create/update/delete (entity-triggered workflows); stores `google_event_id` and `google_calendar_id` on the item `[Implemented]` `entry.ts:24-60,81-121`, `base44/workflows/Sync App Events to Google Calendar (*).jsonc` | Calendar write |
| `syncTasksToCalendar` | GET `https://www.googleapis.com/oauth2/v2/userinfo`; POST `.../calendar/v3/calendars/primary/events` | Create an all-day (or one-hour timed) event for every non-completed task; stores the event id on `Task.google_task_id` `[Implemented]` `entry.ts:17-19,41-85` | Profile email, Calendar write |

- `Q-103` OAuth scopes are configured on the platform connector, not in the repo; the table lists the permissions the endpoints require. Blocks §3.2 "Implied permission" column.

### 3.3 Product claims about Google

- `[Described]` "Seamlessly sync Google Calendar, Google Tasks, and Google Drive for unified productivity." `src/pages/LandingPage.jsx:12`
- `[Partial]` Google Drive appears only as a connector id disconnected during account deletion; no read or write path exists. `base44/functions/deleteUserAccount/entry.ts:19`
- `D-117` Google Drive sync is claimed on the landing page (`src/pages/LandingPage.jsx:12`) and has no implementation beyond the disconnect list (`base44/functions/deleteUserAccount/entry.ts:13-20`).
- `[Described]` "use the "Sync" button to pull tasks in bidirectionally. Matched tasks update automatically." `src/pages/UserManual.jsx:128`
- `D-118` Google Tasks direction: the manual describes bidirectional sync (`src/pages/UserManual.jsx:128`); the implementation imports tasks (`base44/functions/syncGoogleTasks/entry.ts`), pushes only `due` changes (`base44/functions/updateGoogleTask/entry.ts`) and deletions (`base44/functions/deleteToDoItem/entry.ts:102-111`).
- `[Described]` "When you connect third-party services such as Google Calendar or Google Tasks, we access only the data necessary to provide our scheduling and task management features." `src/pages/PrivacyPolicy.jsx:22`
- `[Implemented]` Account deletion disconnects six connectors (Google Calendar, Google Tasks, Dropbox, Google Docs, Gmail, Google Drive) before deleting data. `base44/functions/deleteUserAccount/entry.ts:12-22`
- `[Implemented]` "Delete Synced Data" / "Delete All App Data" disconnect every listed connector after deletion so nothing re-syncs. `src/pages/Settings.jsx:583` (per briefing)

---

## 4. Audio CDNs (slideshow ambient sound)

Owner feature: `20-features/vision-board` (slideshow).

- `[Implemented]` Ten named presets are streamed directly by URL into an `<audio>` element at a fixed volume of 0.5 held in state; no volume slider or mute control is rendered, and the speaker-off button switches the preset to None (see D-757 in `20-features/vision-board/slideshow.md`); the full URL list is in `10-architecture/data-model/seed-data.md` §1.5. Hosts: `raw.githubusercontent.com` (betterthanwell/wisdom-timer: rain, ocean, forest), `cdn.pixabay.com` (Relax), `www.no-copyright-music.com` (Beach Serenity, Tranquil Reflections, Calmness, Peaceful, Ambient Light). `src/components/visionboard/Slideshow.jsx:7-19,76`
- `[Implemented]` "Custom URL…" lets the user paste any audio URL. `src/components/visionboard/Slideshow.jsx:18,74,253`
- `[Implemented]` Favourites and the default preset are device-local. `src/components/visionboard/Slideshow.jsx:255-265`
- `[Described]` "Choose from ambient audio presets (rain, ocean, music, etc.), shuffle audio, favorite and set a default track." `src/pages/UserManual.jsx:375`

---

## 5. Image hosts (backgrounds and collage)

Owner features: `20-features/theme-editor`, `20-features/vision-board` (collage), `20-features/app-shell` (bootstrap).

- `[Implemented]` Built-in background gallery URLs are served from `images.unsplash.com`, `images.pexels.com`, and `cdn.lifeofpix.com`; the five boot defaults and the single bootstrap default are Unsplash and lifeofpix URLs (full lists in seed-data §11). `src/pages/ThemeEditor.jsx:318-340`, `src/App.jsx:50-58`, `index.html:14`
- `[Implemented]` The user may paste any image URL as a background or a public collage image; public collage images are stored by URL. `src/pages/ThemeEditor.jsx:301-313`, `src/components/visionboard/ImageUploadSection.jsx:37-45`
- `[Implemented]` The favicon is loaded from `https://base44.com/logo_v2.svg`. `index.html:5`
- `[Implemented]` The Theme Editor URL placeholder reads `https://images.unsplash.com/...`. `src/pages/ThemeEditor.jsx:306`

---

## 6. Base44 Core integrations used as product capabilities

These are platform-provided calls; each row states what the user receives.

### 6.1 InvokeLLM

| Call site | Trigger | What the user gets | Prompt intent (verbatim where short) | Response shape |
|---|---|---|---|---|
| `base44/functions/generateChores/entry.ts:58-80` | Chore Generator "Generate" | N age-appropriate chore or meal ideas for a room/meal slot | Chores: "Generate {quantity} age-appropriate chore ideas for {ageDescription} in the {room} room, specifically focused on {choreType} tasks." Meals: "Generate {quantity} age-appropriate {mealType} meal ideas for {ageDescription}." Each with title, description, frequency (daily/weekly/biweekly/monthly), time estimate in minutes, priority `[Implemented]` | JSON `{ chores: [{ title, description, frequency, time_estimate, priority }] }` |
| `base44/functions/generateActivities/entry.ts:30-51` | Activity Generator "Generate" | N learning activities for an age group and subject | "Generate {quantity} creative, age-appropriate {activityType} activities for students in {ageGroup} learning about {subject}." with title, description, duration, materials `[Implemented]` | JSON `{ activities: [{ title, description, duration, materials }] }` |
| `base44/functions/fetchDailyQuote/entry.ts:59-68`, `generateDailyQuotes/entry.ts:66-75` | Quotable returned nothing unused | A unique quote and author | "Generate a single unique inspirational or motivational quote. It must NOT be any of these recently used quotes: … Return ONLY a JSON object" `[Implemented]` | JSON `{ quote, author }` |
| `src/components/visionboard/PillarGoalGenerator.jsx:29-61` | "AI Goals" on a pillar | Five activity suggestions, pre-selected, tailored to the last rating and notes | "You are a life coach. Suggest 5 specific, actionable activities for the "{pillar}" life pillar. … Tailor your suggestions to address the user's current state and rating." `[Implemented]` | JSON `{ activities: [{ title }] }` |
| `src/components/visionboard/AffirmationManager.jsx:134-136` | "Generate for <pillar>" | Three first-person affirmations placed in the textarea for review | "Generate 3 brief, positive affirmations written in first person (using "I am", "I can", "I will", etc.) for someone focusing on improving their {pillar}. Each affirmation should be one sentence, max 15 words, personal, motivating, and actionable. Format as a numbered list." `[Implemented]` | free text |
| `src/components/dashboard/DashboardSlideshow.jsx:85-101` | Vision → Auto-Generated | Three unique affirmations per target pillar (low-scoring pillars only when an evaluation exists, else all), interleaved round-robin | "Generate personal affirmations for these life areas: … Generate EXACTLY 3 unique, different affirmations for EACH life area listed. … Use a mix of "I" statements … and "You" statements … Return a JSON object with key "by_pillar"" `[Implemented]` | JSON `{ by_pillar: { <pillar>: [3 strings] } }` |
| `src/components/visionboard/Slideshow.jsx:287-289` | A non-English voice is selected | The affirmation translated before display and speech | "Translate this affirmation to {language}. Keep it positive and motivating. Only provide the translation, no other text:" `[Implemented]` | free text |

- `[Described]` "AI-generated chore ideas tailored to age and room", "Generate age-appropriate meal ideas for Breakfast, Lunch, Dinner, or Snacks — perfect for kids ages 3 and up through adults." `src/pages/LandingPage.jsx:9-10`

### 6.2 SendEmail

- **AR-EXT-10** Every email is addressed to `base44.auth.me().email`; the subject and body are built client-side; success is announced with `alert("Sent to your email!")` (Goals: "Goals sent to your email!"). `[Implemented]`

| Call site | Subject | Body |
|---|---|---|
| `src/components/WidgetCard.jsx:17-28` | the widget title | the widget's `innerHTML` (generic fallback for any card) |
| `src/lib/printUtils.js:19-24` | caller-supplied | static markup of a `PrintFormat*` component |
| `src/pages/Tasks.jsx:575-583` | `Task List` | `PrintFormatTasks` grouped by label or priority |
| `src/pages/DailySchedule.jsx:600-612` | `Daily Schedule` | `PrintFormatDailySchedule`, mode both/schedule after a confirm "Email Schedule + To Do together?" |
| `src/components/DailyToDo.jsx:234-243` | `Daily To Do` | the to-do HTML |
| `src/pages/Chores.jsx:762-768` | current filter label | day-of-week organised chore HTML |
| `src/pages/Education.jsx:608-614` | computed title | learner/subject schedule HTML |
| `src/pages/Goals.jsx:342-348` | filter label | goal rows with target, progress, milestones |
| `src/pages/Goals.jsx:751-758` | `All <Timeframe> Goals` or `<member>'s <Timeframe> Goals` | the timeframe card's `innerHTML` |
| `src/pages/Quotes.jsx:150-160` | `Daily Reflection — <date>` | quote, author, "My Reflection" |
| `src/pages/VisionBoard.jsx:293-299` | `Weekly Review - <MMM d, yyyy>` | `#weekly-review-content` `innerHTML` |

- `[Described]` "Use the email button to send the quote and your reflection to yourself or others." `src/pages/Quotes.jsx:20` — the implementation addresses only the account owner (`src/pages/Quotes.jsx:150-155`). `D-138`

### 6.3 UploadFile (public files)

| Call site | What the user gets |
|---|---|
| `src/pages/ThemeEditor.jsx:290` | "Choose Image" uploads a background; the returned `file_url` becomes `background_image` `[Implemented]` |
| `src/components/visionboard/ImageUploadSection.jsx:18-26` | Upload a public collage image; stored as `CollageImage { image_url, title: <file name without extension>, is_default: true }` `[Implemented]` |

### 6.4 UploadPrivateFile and CreateFileSignedUrl (private files)

- `[Implemented]` Private collage images are uploaded with `UploadPrivateFile`, producing a `file_uri`; a signed URL valid for 3600 s is created immediately and cached on `UserCollageImage` (`signed_url`, `signed_url_expires` = now + 3600 s, `include_in_slideshow: true`, `title` = file name). `src/components/visionboard/PrivateImageUploader.jsx:91-110`
- `[Implemented]` Wherever private images are displayed (gallery, Vision Board picker, Dashboard slideshow) a URL within 60 s of expiry is refreshed in parallel and written back. `src/components/visionboard/PrivateImageUploader.jsx:6-20,66-88`, `src/pages/VisionBoard.jsx:116-132`, `src/components/dashboard/DashboardSlideshow.jsx:28-46`
- `[Described]` "Private — only visible to you" (per briefing) and "Private images are displayed via time-limited signed URLs." `src/pages/UserManual.jsx:372`

### 6.5 Platform authentication and connectors (for completeness)

- `[Implemented]` Account operations go through the platform SDK: `register`, `verifyOtp`, `resendOtp`, `loginViaEmailPassword`, `resetPasswordRequest`, `resetPassword`, `changePassword`, `me`, `updateMe`, `isAuthenticated`, `logout`. `src/pages/Auth.jsx:35,48,66,81,106,109,144`, `src/pages/ResetPassword.jsx:48`, `src/pages/Settings.jsx:56,563`, `src/pages/AcceptTerms.jsx:16,50`, `src/lib/AuthContext.jsx:94,119-122`
- `[Implemented]` Boot fetches the app's public settings by app id from the platform before checking auth. `src/lib/AuthContext.jsx:37`
- `[Implemented]` Connector connect/disconnect uses `base44.connectors.connectAppUser` / `disconnectAppUser`. `src/pages/Settings.jsx:373,418`, `src/pages/Auth.jsx:114,127`, `src/pages/AcceptTerms.jsx:39,45`
- `[Partial]` An MCP OAuth consent page exists but is not routed. `src/pages/OAuthConsent.jsx` (owner: auth-and-account)

---

## 7. Browser speech synthesis (text-to-speech)

Owner feature: `20-features/vision-board` (slideshow).

- `[Implemented]` When "speak affirmations" is on, each affirmation (translated text if available) is spoken with `SpeechSynthesisUtterance` at rate 0.9, pitch 1.1, volume 1, using the selected voice; any ongoing speech is cancelled first and on unmount. `src/components/visionboard/Slideshow.jsx:335-381,510-521`
- `[Implemented]` Voices come from `speechSynthesis.getVoices()`; when the list is empty the widget polls every 300 ms up to 20 times and also listens to `onvoiceschanged`. `src/components/visionboard/Slideshow.jsx:155-198`
- `[Implemented]` Voice filtering, grouping, and the saved-voice preference are defined in seed-data §1.6 and preferences Part D (`slideshowSelectedVoice`).
- `[Implemented]` Fallback voice when none is selected: a voice whose name includes "Google US English", "Microsoft Aria", or "Samantha", else any non-Google/non-Microsoft `en-US` voice, else any `en-US` voice. `src/components/visionboard/Slideshow.jsx:352-361`
- `[Implemented]` Background audio volume is re-applied on utterance start and end so speech does not duck it. `src/components/visionboard/Slideshow.jsx:364-374`

---

## 8. Availability behaviour summary

| Service | When unavailable, the user sees |
|---|---|
| Geolocation denied/absent | "Enable location to see weather" `[Implemented]` `src/components/WeatherWidget.jsx:123-128` |
| Nominatim / Open-Meteo failure | widget with no data (same empty copy) `[Implemented]` `:106-111` |
| Quotable failure | LLM-generated quote; if that also fails, "Could not load quote / Try Again" on the Quotes page (per briefing) `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:56-75`, `src/pages/Quotes.jsx:206` |
| Google connector missing | Functions reply with the message "No active connection found for Google Calendar. Please reconnect in Settings." (HTTP 200); Settings shows "✗ Google Tasks is disconnected. Please reconnect it above." `[Implemented]` `base44/functions/syncGoogleCalendarToApp/entry.ts:15-17`, `base44/functions/syncGoogleTasks/entry.ts:17-19`, `src/pages/Settings.jsx:465-467` |
| Google calendar 404 | that calendar is deselected and skipped `[Implemented]` `base44/functions/syncGoogleCalendarToApp/entry.ts:72-79` |
| Audio URL unreachable | silent slideshow (no copy) `[Implemented]` `src/components/visionboard/Slideshow.jsx` |
| No whitelisted voice | any English voice, then any voice `[Implemented]` `src/components/visionboard/Slideshow.jsx:180-183` |
| Translation failure | English text is shown `[Implemented]` `src/components/visionboard/Slideshow.jsx:291-294` |
| Signed URL refresh failure | the image is omitted `[Implemented]` `src/pages/VisionBoard.jsx:127-129` |

---

## Discrepancies opened here

| ID | Summary |
|---|---|
| D-115 | Connector ids differ across sign-up, terms acceptance, and Settings/functions (see §3.1). |
| D-117 | Google Drive claimed (`src/pages/LandingPage.jsx:12`) vs disconnect-only (`base44/functions/deleteUserAccount/entry.ts:19`). |
| D-118 | Google Tasks "bidirectionally" (`src/pages/UserManual.jsx:128`) vs import plus due/delete push (`base44/functions/syncGoogleTasks`, `updateGoogleTask`, `deleteToDoItem`). |
| D-138 | Quote email "to yourself or others" (`src/pages/Quotes.jsx:20`) vs recipient fixed to the account owner (`src/pages/Quotes.jsx:150-155`). |

## Open questions

| ID | Question | Blocks |
|---|---|---|
| Q-103 | Which OAuth scopes are granted by the two Google connectors? They are configured on the platform, not in the repo. | §3.2 |
| Q-108 | Is the app's MCP server (consent page `src/pages/OAuthConsent.jsx`) exposed in the hosted deployment, and what tools does it list? | §6.5 |
