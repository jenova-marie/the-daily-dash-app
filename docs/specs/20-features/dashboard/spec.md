# Dashboard — Feature Spec

**Feature code:** `DASH` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 75 · Described 7 · Partial 2

**Sources owned:** `src/pages/Dashboard.jsx`
**Sources referenced (owned elsewhere):** `src/components/WeatherWidget.jsx` → `20-features/weather/spec.md` · `src/components/dashboard/DashboardChecklist.jsx`, `src/lib/useWeeklyChecklistCounts.js` → `20-features/daily-checklist/spec.md` · `src/components/dashboard/DashboardQuote.jsx` → `20-features/quotes` · `src/components/dashboard/DashboardTasks.jsx` → `20-features/tasks/spec.md` · `src/components/dashboard/DashboardGoals.jsx` → `20-features/goals` · `src/components/dashboard/DashboardMenuChores.jsx` → `20-features/chores` · `src/components/dashboard/DashboardSchedule.jsx` → `20-features/daily-schedule/spec.md` · `src/components/dashboard/DashboardFocalAreas.jsx`, `src/components/dashboard/DashboardSlideshow.jsx` → `20-features/vision-board` (focal areas; `slideshow.md`) · `src/components/WidgetCard.jsx` → `10-architecture/export-print-email.md` · `src/components/GenericOnboardingDialog.jsx`, `src/lib/HeaderContext.jsx`, `src/components/Layout.jsx` → `10-architecture/shared-interactions.md` · `src/App.jsx` (fresh-open landing rule) → `20-features/app-shell` · `src/pages/Settings.jsx` (Custom Display Name, feature toggles) → `20-features/settings` · `base44/entities/ThemeSettings.jsonc` → `10-architecture/preferences.md` · `src/pages/UserManual.jsx` → `20-features/user-manual`

**Permissions:** per-user data (`ThemeSettings` rows are readable, writable, and deletable only by their creator — `base44/entities/ThemeSettings.jsonc:97-110`); admin-only operations: none

## 0. Entry points & navigation

- Route: `/dashboard` `[Implemented]` `src/App.jsx:202` · Sidebar label: **Dashboard** (icon LayoutDashboard) `[Implemented]` `src/components/Layout.jsx:13` · Header title text: the greeting (§4.1), e.g. `Good Morning, Jenova` `[Implemented]` `src/pages/Dashboard.jsx:154-155` · Position in nav order: first of fourteen `[Implemented]` `src/components/Layout.jsx:12-27`; swipe-order mechanics are owned by `10-architecture/shared-interactions.md` (AR-UI-13).
- **Fresh-open landing rule.** When the app is opened in a new tab or window (navigation type is not a reload) and the account owner is authenticated, the shell navigates to `/dashboard` with history replacement, whatever path was opened. On a reload, the last visited path is restored instead. `[Implemented]` `src/App.jsx:141-163` (mechanism owned by `20-features/app-shell`; device key `lastLocation` registered in `10-architecture/preferences.md`).
- Query parameters accepted: none observed. `[Implemented]` `src/pages/Dashboard.jsx:51-70`
- Feature-toggle gating: none. The nav item is always shown `[Implemented]` `src/components/Layout.jsx:189-195`, and the widget registry renders every widget regardless of `enable_chores`, `enable_education`, or `enable_vision_board` (no toggle is read anywhere in the page) `[Implemented]` `src/pages/Dashboard.jsx:22-42,117-132,252-319` (AR-PREF-25). The User Manual states otherwise; see D-120 in §14.
- Header right-slot contents: none. The page publishes only a title; its own controls sit in a right-aligned action row at the top of the page body (§4.2–4.5). `[Implemented]` `src/pages/Dashboard.jsx:155,185-243`

## 1. Purpose & user benefit

The Dashboard is the landing page after sign-in: one scrolling column of widgets, each summarising a feature for today, in an order the account owner can rearrange. The page itself contributes the greeting, the widget registry and order, the reorder mode, the Vision slideshow launcher, the Guide button, and two cross-module count badges. Every widget's content belongs to its source feature.

User Manual, section "Dashboard" (`src/pages/UserManual.jsx:27`) `[Described]`:

> The Dashboard is your home base — a customizable summary of everything happening today with real-time updates across all your data sources.

User Manual, "Dashboard Customization" (`src/pages/UserManual.jsx:30-35`) `[Described]`:

> - Click the **⇅ reorder icon** in the top-right to drag and rearrange any widget into your preferred order.
> - Customize the **dashboard header greeting** name in Theme Editor settings.
> - Toggle features on/off (Education, Chores, Vision Board) in Settings to show/hide their dashboard widgets.
> - Your layout and preferences are **saved automatically** across all devices and sessions.

User Manual, "Vision Slideshow Button" (`src/pages/UserManual.jsx:38-39`) `[Described]`:

> Click the **Vision** button to launch an inspirational slideshow using your Vision Board images and affirmations. Choose **Auto-Generated** (AI-curated based on your lowest-scoring health pillars) or **Custom** (your selected images and saved affirmations).

The User Manual also carries one paragraph per widget (`src/pages/UserManual.jsx:42-68`); each is quoted in the owning feature spec. The "Weather Widget" and "Daily Checklist Widget" paragraphs are quoted in `20-features/weather/spec.md` §1 and `20-features/daily-checklist/spec.md` §1.

Onboarding copy is quoted in full in §9.

## 2. Concepts & vocabulary

Glossary terms used: **account owner**, **widget**, **walkthrough**, **feature toggle**, **device-local preference**, **account preference**, **focal area**, **slideshow**, **daily evaluation**, **meal**, **today**.

Feature-local terms, defined once:

- **Widget registry** — the fixed map of eight widget ids to card titles and components. `src/pages/Dashboard.jsx:33-42`
- **Default order** — the fixed list of widget ids used when no saved order exists. `src/pages/Dashboard.jsx:22-31`
- **Saved order** — the JSON array of widget ids held in `ThemeSettings.widget_order`. `base44/entities/ThemeSettings.jsonc:87-90`
- **Reorder mode** — the page state in which widgets can be dragged. `src/pages/Dashboard.jsx:58`
- **Badge** — one of the two count buttons (Chores, Education) in the tasks widget header. `src/pages/Dashboard.jsx:276-309`

## 3. User stories

- **US-DASH-01** As the account owner, I want to land on one page that shows today's weather, checklist, schedule, tasks, chores, goals, focal areas, and quote so that I can see my day at a glance. `[Implemented]` `src/pages/Dashboard.jsx:22-42,252-319`
- **US-DASH-02** As the account owner, I want to be greeted by name and time of day so that the page feels personal. `[Implemented]` `src/pages/Dashboard.jsx:154-155`
- **US-DASH-03** As the account owner, I want to drag widgets into my preferred order and have that order follow my account so that every device shows the same layout. `[Implemented]` `src/pages/Dashboard.jsx:134-151,163-180,245-263`
- **US-DASH-04** As the account owner, I want to launch a vision slideshow from the dashboard in either Auto-Generated or Custom mode so that I can be inspired without opening the Vision Board. `[Implemented]` `src/pages/Dashboard.jsx:157-161,189-222,325-330`
- **US-DASH-05** As the account owner, I want to see at a glance whether chores or education activities are due or overdue today and jump to the due list so that nothing slips. `[Implemented]` `src/pages/Dashboard.jsx:73-108,276-309`
- **US-DASH-06** As the account owner, I want a visible cue when I have not yet done today's daily evaluation so that I remember to rate my pillars. `[Implemented]` `src/pages/Dashboard.jsx:110-115,267-275`
- **US-DASH-07** As the account owner, I want a short walkthrough the first time I see the dashboard, and a Guide button to see it again. `[Implemented]` `src/pages/Dashboard.jsx:44-49,64-71,186-188,332-338`

## 4. Capabilities & interactions

### 4.1 Greeting (header title)

- The header title is built as `Good {period}{, name}`. `{period}` is `Morning` when the device hour is before 12, `Afternoon` when before 17, otherwise `Evening`. `[Implemented]` `src/pages/Dashboard.jsx:154`
- `{, name}` is `, {ThemeSettings.dashboard_header}` when that field is non-empty; otherwise `, {first space-separated word of the signed-in user's full_name}` when a full name is known; otherwise nothing. `[Implemented]` `src/pages/Dashboard.jsx:117-119,154`
- The custom name is written by the Settings page control labelled "Custom Display Name" (owned by `20-features/settings`). `[Implemented]` `src/pages/Settings.jsx:337-341,655,697`; the User Manual places it in the Theme Editor `[Described]` `src/pages/UserManual.jsx:33,397` (D-800).
- The title is published to the shell header on every change and cleared on unmount (AR-UI-12). `[Implemented]` `src/pages/Dashboard.jsx:155`
- A long-form date string (`EEEE, MMMM d, yyyy`) is computed on every render but not displayed anywhere on the page. `[Partial]` `src/pages/Dashboard.jsx:153` (Q-802)

### 4.2 Widget registry and rendering

- Eight widgets exist. Each is rendered inside the shared card shell with the registry title and a body DOM id of `dashboard-{widgetId}` (card shell owned by `10-architecture/export-print-email.md`; no print or email control is rendered, D-310). `[Implemented]` `src/pages/Dashboard.jsx:33-42,264-266`

| # (default) | Widget id | Card title | Component | Behaviour owned by |
|---|---|---|---|---|
| 1 | `weather` | Weather | `WeatherWidget` | `20-features/weather/spec.md` |
| 2 | `focal-areas` | Focal Areas | `DashboardFocalAreas` | `20-features/vision-board` (focal areas) |
| 3 | `checklist` | Daily Checklist | `DashboardChecklist` | `20-features/daily-checklist/spec.md` §4.10 |
| 4 | `schedule` | Today's Schedule | `DashboardSchedule` | `20-features/daily-schedule/spec.md` |
| 5 | `tasks` | TODAY'S TASKS | `DashboardTasks` | `20-features/tasks/spec.md` |
| 6 | `menu-chores` | Menu & Chores | `DashboardMenuChores` | `20-features/chores` |
| 7 | `goals` | Goals Overview | `DashboardGoals` | `20-features/goals` |
| 8 | `quote` | Daily Quote | `DashboardQuote` | `20-features/quotes` |

`[Implemented]` `src/pages/Dashboard.jsx:22-42`

- The Focal Areas widget is the only one that receives a prop: a highlight callback. The page stores the reported value but nothing on the page reads it. `[Partial]` `src/pages/Dashboard.jsx:56,311-313` (Q-801)
- All widgets render in one vertical column in the current order; there is no per-widget hide, collapse, or resize on the page. `[Implemented]` `src/pages/Dashboard.jsx:245-323`

### 4.3 Reorder mode and persistence

- A square icon button toggles reorder mode. Its tooltip reads **Reorder Widgets** when off and **Done Reordering** when on; while on it takes the destructive style and shows an X icon. `[Implemented]` `src/pages/Dashboard.jsx:223-231`
- In reorder mode the whole card is the drag handle and the list accepts drops; outside reorder mode dragging and dropping are disabled. The dragged card is shown at half opacity. `[Implemented]` `src/pages/Dashboard.jsx:245,256,261-262`
- On drop inside the list, the moved widget id is removed from its source index and inserted at the destination index; the page re-renders in the new order. A drop outside the list changes nothing. Drop results are ignored when reorder mode is off. `[Implemented]` `src/pages/Dashboard.jsx:134-143`
- Every drop persists the full order immediately as a JSON array string: the newest `ThemeSettings` row is updated when one was loaded, otherwise a new row containing only `widget_order` is created and remembered. `[Implemented]` `src/pages/Dashboard.jsx:144-150`
- A **Save Default** button (Save icon) appears only in reorder mode. It writes the current order the same way, then alerts **Widget arrangement saved as default!**; on failure it alerts **Failed to save default arrangement**. The button is disabled while the write is in flight. `[Implemented]` `src/pages/Dashboard.jsx:163-180,232-242`
- On load, the page reads the newest `ThemeSettings` row; if `widget_order` parses as JSON, the order becomes the saved list followed by every default id not present in it, so a widget added after the order was saved still appears at the end. A parse failure leaves the default order. `[Implemented]` `src/pages/Dashboard.jsx:119-131`
- Ids in the saved list are rendered by looking them up in the registry; the page has no rule for an id absent from the registry. `[Implemented]` `src/pages/Dashboard.jsx:252-254` (Q-800)

### 4.4 Vision dropdown (slideshow entry point)

- A **Vision** button (PlayCircle icon) toggles a small menu anchored below and right-aligned to the button. The menu has two rows: **Auto-Generated** (Sparkles icon) and **Custom Slideshow** (SlidersHorizontal icon). `[Implemented]` `src/pages/Dashboard.jsx:189-221`
- Choosing a row closes the menu and opens the full-screen slideshow in mode `auto` or `custom`. Closing the slideshow clears the mode. `[Implemented]` `src/pages/Dashboard.jsx:157-161,206-219,325-330`
- The menu closes only by choosing a row or pressing the Vision button again; no outside-click or Escape handling is attached. `[Implemented]` `src/pages/Dashboard.jsx:189-221`
- Slideshow image sourcing, affirmation generation, and playback belong to `20-features/vision-board` (`slideshow.md`).

### 4.5 Guide button

- A small outline button **Guide** (HelpCircle icon) reopens the walkthrough (§9) without touching any stored dismissal flag. `[Implemented]` `src/pages/Dashboard.jsx:71,186-188`

### 4.6 Focal Areas header button (evaluation shortcut)

- The Focal Areas card carries one icon button (Target) in its header. Pressing it navigates to `/visionboard?tab=evaluation`. `[Implemented]` `src/pages/Dashboard.jsx:267-275`
- Colour carries meaning: the button is blue with white icon when no daily evaluation exists for today, and neutral (card background, muted icon, bordered) once one exists. "Exists" means at least one `DailyPillarTracking` row whose `date` equals today, checked once when the page mounts. `[Implemented]` `src/pages/Dashboard.jsx:110-115,272`
- User Manual, "Focal Areas Widget" (`src/pages/UserManual.jsx:67-68`) `[Described]`: "Click the **target icon** (blue when no evaluation done today) to go directly to the Daily Evaluation."

### 4.7 Chores and Education badges (tasks widget header)

Two small buttons sit in the header of the TODAY'S TASKS card. `[Implemented]` `src/pages/Dashboard.jsx:276-309`

| Badge | Icon | Tooltip | Navigates to | Count shown |
|---|---|---|---|---|
| Chores | CheckSquare | `Chores` | `/chores?filter=due` | number of distinct chores that are due today or overdue, only when > 0 |
| Education | BookOpen | `Education` | `/education?filter=due` | number of distinct activities that are due today or overdue, only when > 0 |

- Colour carries meaning (same rule for both badges): overdue **and** due present → purple; overdue only → red; due only → blue; neither → dimmed neutral (card background, muted text, half opacity). `[Implemented]` `src/pages/Dashboard.jsx:282-287,297-302`
- Counts are computed once when the page mounts (§5, BR-DASH-05 and BR-DASH-06); they do not refresh while the page stays open. `[Implemented]` `src/pages/Dashboard.jsx:73-108`

### 4a. Keyboard & pointer

- Drag-and-drop of widgets in reorder mode (§4.3). `[Implemented]` `src/pages/Dashboard.jsx:245-263`
- No Enter/Escape, double-click, long-press, swipe, or hover behaviour is defined by the page itself. Page-to-page swipe navigation is owned by `10-architecture/shared-interactions.md` (AR-UI-13). `[Implemented]` `src/pages/Dashboard.jsx:182-340`

### 4b. View state & persistence

| Control | Values | Default | Scope (memory / device `key` / account `Entity.field`) |
|---|---|---|---|
| Widget order | ordered list of the eight ids | default order (§4.2) | account `ThemeSettings.widget_order` (JSON array string) `src/pages/Dashboard.jsx:119-131,144-150,166-171` |
| Reorder mode | on / off | off | memory `src/pages/Dashboard.jsx:58` |
| Vision menu open | open / closed | closed | memory `src/pages/Dashboard.jsx:61` |
| Slideshow open + mode | closed / `auto` / `custom` | closed | memory `src/pages/Dashboard.jsx:59-60` |
| Walkthrough open | open / closed | open when device key `dashboard_onboarded` is absent | device `dashboard_onboarded` + account `ThemeSettings.onboarding_status` (§9) `src/pages/Dashboard.jsx:64-66,332-338` |
| Evaluation done today | true / false | false until loaded | memory `src/pages/Dashboard.jsx:63,110-115` |
| Badge status | `{hasOverdue, hasDue, count}` per badge | all false / 0 until loaded | memory `src/pages/Dashboard.jsx:68-69,73-108` |

### 4c. Empty & fallback states

- The page has no empty state of its own; every widget renders its own (owned by its feature). `[Implemented]` `src/pages/Dashboard.jsx:245-323`
- Greeting with no custom name and no known full name: `Good Morning` / `Good Afternoon` / `Good Evening` with no suffix. `[Implemented]` `src/pages/Dashboard.jsx:154`
- Badge with nothing due or overdue: icon only, dimmed, no number. `[Implemented]` `src/pages/Dashboard.jsx:286,291,301,306`
- Alerts: **Widget arrangement saved as default!** · **Failed to save default arrangement** `[Implemented]` `src/pages/Dashboard.jsx:173,176`

## 5. Business rules

- **BR-DASH-01 (Greeting period)** Before 12:00 device time → `Morning`; 12:00–16:59 → `Afternoon`; 17:00 onward → `Evening`. `[Implemented]` `src/pages/Dashboard.jsx:154`
- **BR-DASH-02 (Greeting name precedence)** `ThemeSettings.dashboard_header` wins over the user's first name; the first name is the text before the first space of `full_name`. `[Implemented]` `src/pages/Dashboard.jsx:154`
- **BR-DASH-03 (Order merge)** Effective order = saved order, then every default id not already in it, in default sequence. With no saved order, or an unparseable one, the default order applies. `[Implemented]` `src/pages/Dashboard.jsx:119-131`
- **BR-DASH-04 (Order write policy)** A drop and Save Default both write the whole order as a JSON array string to the newest `ThemeSettings` row, creating a row holding only `widget_order` when none exists (AR-PREF-10, AR-PREF-11). `[Implemented]` `src/pages/Dashboard.jsx:144-150,166-171`
- **BR-DASH-05 (Chores badge)** Input: `Chore` rows with `status: "pending"`, newest 300 by `created_date`, excluding `chore_type === "Meal"`. Due today = `due_date === today` OR `frequency === "daily"` OR (`frequency === "weekly"` AND `day_of_week` includes today's full weekday name, e.g. `Monday`). Overdue = `due_date` present AND `due_date < today`. Count = size of the union of due and overdue ids. `[Implemented]` `src/pages/Dashboard.jsx:75-94`. This rule differs from the Chores page and other surfaces; see D-103 and D-104 in `10-architecture/time-and-date-semantics.md` §8.2.
- **BR-DASH-06 (Education badge)** Input: `EducationActivity` rows with `completed: false`, first 200. Due today = `due_date === today` OR `frequency === "daily"` OR (`frequency === "weekly"` AND `days_of_week` includes today's three-letter weekday, e.g. `Mon`). Overdue = `due_date` present AND `due_date < today`. Count = size of the union. `[Implemented]` `src/pages/Dashboard.jsx:81,96-105`. Differs from the Education page rule; see D-105 and D-106 in `10-architecture/time-and-date-semantics.md` §8.3.
- **BR-DASH-07 (Badge colour)** overdue ∧ due → purple; overdue → red; due → blue; none → dimmed. `[Implemented]` `src/pages/Dashboard.jsx:282-287,297-302`
- **BR-DASH-08 (Evaluation cue)** The Focal Areas header button is blue until a `DailyPillarTracking` row dated today exists. `[Implemented]` `src/pages/Dashboard.jsx:110-115,272`
- **BR-DASH-09 (Toggles do not hide widgets)** The registry renders all eight widgets regardless of feature toggles (AR-PREF-25). `[Implemented]` `src/pages/Dashboard.jsx:22-42,252-319`. The User Manual says toggles hide their widgets `[Described]` `src/pages/UserManual.jsx:34` (D-120).
- **BR-DASH-10 (Page-level loads happen once)** User, theme settings, evaluation flag, and both badge statuses are loaded on mount only; the page holds no entity subscription and no timer. Live updates inside widgets are each widget's own behaviour (AR-UI-14). `[Implemented]` `src/pages/Dashboard.jsx:73-132`

### 5a. State & lifecycle

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| Reorder off | press reorder button | Reorder on | drag enabled; Save Default shown; button turns destructive with X icon `src/pages/Dashboard.jsx:223-242` |
| Reorder on | press reorder button (X) | Reorder off | drag disabled; Save Default hidden (order already persisted by each drop) `:226` |
| Reorder on | drop inside list | Reorder on, new order | `ThemeSettings.widget_order` written `:134-151` |
| Reorder on | press Save Default | Reorder on | `ThemeSettings.widget_order` written; alert `:163-180` |
| Vision menu closed | press Vision | open | menu rendered below button `:193,199-221` |
| Vision menu open | press Auto-Generated / Custom Slideshow | closed, slideshow open (`auto` / `custom`) | `DashboardSlideshow` mounted `:157-161,325-330` |
| Slideshow open | slideshow closes | slideshow closed, mode cleared | `:328` |
| Walkthrough closed, no device key | mount | walkthrough open | `:64-66` |
| Walkthrough open | press Guide-dialog dismiss button | closed | account map + device key written (AR-PREF-32) `src/components/GenericOnboardingDialog.jsx:6-29` |
| Walkthrough open | overlay / Escape | closed | nothing written `src/components/GenericOnboardingDialog.jsx:31-33` |
| Any | press Guide | walkthrough open | nothing written `src/pages/Dashboard.jsx:71` |

### 5b. Time & date semantics

- "Today" for the badge and evaluation checks is `format(new Date(), "yyyy-MM-dd")` on the device (formatter B, AR-TIME-01). `[Implemented]` `src/pages/Dashboard.jsx:75,111`
- Weekday for the chores badge is the full device weekday name (`EEEE`); for the education badge it is the three-letter form (`EEE`) (AR-TIME-02). `[Implemented]` `src/pages/Dashboard.jsx:76-77`
- Greeting period uses the device hour. `[Implemented]` `src/pages/Dashboard.jsx:154`
- Due and overdue definitions used here are the badge columns of `10-architecture/time-and-date-semantics.md` §8.2 and §8.3 (D-103, D-104, D-105, D-106).
- No midnight or periodic timer exists on the page; the greeting period and badges are fixed until the page is re-mounted. `[Implemented]` `src/pages/Dashboard.jsx:73-132,154`

## 6. Data

| Entity | Read | Write | Citation |
|---|---|---|---|
| `ThemeSettings` | newest row by `updated_date` (limit 1); fields used `id`, `widget_order`, `dashboard_header` | update `widget_order`, or create `{ widget_order }` | `src/pages/Dashboard.jsx:119-131,146-149,167-171` |
| `User` (via `auth.me`) | `full_name` | none | `src/pages/Dashboard.jsx:118,154` |
| `DailyPillarTracking` | `filter({ date: today })`, existence only | none | `src/pages/Dashboard.jsx:110-115` |
| `Chore` | `filter({ status: "pending" }, "-created_date", 300)`; fields `chore_type`, `due_date`, `frequency`, `day_of_week`, `id` | none | `src/pages/Dashboard.jsx:80,84-94` |
| `EducationActivity` | `filter({ completed: false }, "", 200)`; fields `due_date`, `frequency`, `days_of_week`, `id` | none | `src/pages/Dashboard.jsx:81,96-105` |

Widget data access belongs to each widget's feature. `ThemeSettings` field sheet: `10-architecture/preferences.md` Part A. `[Implemented]`

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| out | Vision Board (evaluation) | Focal Areas header button → `/visionboard?tab=evaluation` | `src/pages/Dashboard.jsx:270` |
| out | Chores | Chores badge → `/chores?filter=due` | `src/pages/Dashboard.jsx:280` |
| out | Education | Education badge → `/education?filter=due` | `src/pages/Dashboard.jsx:295` |
| out | Vision Board (slideshow) | Vision menu mounts `DashboardSlideshow` with `mode` `auto` or `custom` | `src/pages/Dashboard.jsx:157-161,325-330` |
| in | Settings | `dashboard_header` (Custom Display Name) read into the greeting | `src/pages/Settings.jsx:337-341,655`, `src/pages/Dashboard.jsx:154` |
| in | App shell | fresh open lands here | `src/App.jsx:157-160` |
| in | Weather, Daily Checklist, Daily Schedule, Tasks, Chores, Goals, Vision Board, Quotes | widget components mounted from the registry | `src/pages/Dashboard.jsx:33-42,252-319` |
| both | Preferences | `ThemeSettings.widget_order`, `ThemeSettings.onboarding_status` | `10-architecture/preferences.md` Parts A and C |

### 7a. Feedback & notifications

- Alert **Widget arrangement saved as default!** after Save Default succeeds; alert **Failed to save default arrangement** on failure. `[Implemented]` `src/pages/Dashboard.jsx:173,176`
- Drops persist silently. `[Implemented]` `src/pages/Dashboard.jsx:144-150`
- Badge and evaluation-button colours as cues (§4.6, §4.7). `[Implemented]` `src/pages/Dashboard.jsx:272,282-287,297-302`
- No toasts, confirm dialogs, or celebratory effects on the page. `[Implemented]` `src/pages/Dashboard.jsx:182-340`

## 8. AI & automation

None on the page itself. The Auto-Generated slideshow mode and the Daily Quote widget invoke AI inside their own components; see `20-features/vision-board` (`slideshow.md`), `20-features/quotes`, and `10-architecture/ai-services.md`. `[Implemented]` `src/pages/Dashboard.jsx:157-161,325-330`

## 9. Onboarding content

Dialog title **Welcome to Dashboard**; storage key `dashboard_onboarded`; rendered by the shared walkthrough dialog (AR-UI-10). `[Implemented]` `src/pages/Dashboard.jsx:332-338`

Steps verbatim (`src/pages/Dashboard.jsx:44-49`) `[Described]`:

1. **1. Your Daily Hub** — "Your personalized dashboard shows everything at a glance—weather, daily checklist, schedule, tasks, goals, and your daily quote. It's your command center for a productive day."
2. **2. Arrange Your Widgets** — "Click the reorder icon (⇅) in the header to drag and rearrange widgets in any order you like. Your layout is saved automatically so it's always just how you left it."
3. **3. Launch Your Vision Slideshow** — "Hit the Vision button to start an inspirational slideshow using your uploaded images and affirmations. Choose Auto-Generated for AI-powered suggestions based on your health pillars, or Custom for your curated content."
4. **4. Track Progress in Real-Time** — "See your daily checklist progress, upcoming schedule, pending tasks, and active goals all in one view. Items update live as you complete them throughout the day."

- Trigger: the dialog opens when the device key `dashboard_onboarded` is absent (any stored value counts as present); if reading localStorage throws, it stays closed. The account map is not consulted. `[Implemented]` `src/pages/Dashboard.jsx:64-66` (AR-PREF-34)
- Dismissal ("Got it — Don't Remind Me Again"): second generation, account map `ThemeSettings.onboarding_status[dashboard_onboarded] = true` plus device `dashboard_onboarded = "true"` (AR-PREF-32). `[Implemented]` `src/components/GenericOnboardingDialog.jsx:6-29`
- The Guide button reopens the dialog without clearing either flag. `[Implemented]` `src/pages/Dashboard.jsx:71,186-188`
- Registry: `20-features/onboarding`.

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `dashboard_onboarded` | walkthrough dismissed on this device (`"true"`) | absent → show | walkthrough dismiss `src/components/GenericOnboardingDialog.jsx:23` | never (no Guide reset) `src/pages/Dashboard.jsx:71` |

Keys belonging to widgets (`weather_cache_v3`, `dashboard_menuchores_collapsed`) are registered by their owning features. `lastLocation` belongs to the app shell. `[Implemented]` `10-architecture/preferences.md` Part D

## 11. Seed / hardcoded data used

- Default widget order and registry titles (§4.2). `[Implemented]` `src/pages/Dashboard.jsx:22-42`; also listed in `10-architecture/data-model/seed-data.md` §12.1.
- Greeting hour thresholds 12 and 17. `[Implemented]` `src/pages/Dashboard.jsx:154`
- Badge query limits 300 (chores) and 200 (education). `[Implemented]` `src/pages/Dashboard.jsx:80-81`
- Badge colour mapping (§4.7). `[Implemented]` `src/pages/Dashboard.jsx:282-287,297-302`; `seed-data.md` §12.3.

## 12. Print / email formats

None on the page. Each widget body carries id `dashboard-{widgetId}` for the card shell's generic handlers, but no control invokes them (D-310, `10-architecture/export-print-email.md`). Widgets that render their own print or email controls (Today's Schedule, TODAY'S TASKS) document them in their owning specs. `[Implemented]` `src/pages/Dashboard.jsx:264-266`

## 13. Acceptance criteria

- **AC-DASH-01** Given the device clock reads 11:59, When the dashboard renders, Then the header title begins `Good Morning`; at 12:00 it begins `Good Afternoon`; at 17:00 it begins `Good Evening`. (refs BR-DASH-01)
- **AC-DASH-02** Given `dashboard_header` is `Boss` and the user's full name is `Jenova Marie`, When the dashboard renders, Then the title ends `, Boss`; Given `dashboard_header` is empty, Then it ends `, Jenova`; Given neither, Then there is no suffix. (refs BR-DASH-02)
- **AC-DASH-03** Given no `ThemeSettings` row exists, When the dashboard renders, Then widgets appear in the order weather, focal-areas, checklist, schedule, tasks, menu-chores, goals, quote. (refs BR-DASH-03)
- **AC-DASH-04** Given `widget_order` is `["quote","weather"]`, When the dashboard renders, Then the order is quote, weather, focal-areas, checklist, schedule, tasks, menu-chores, goals. (refs BR-DASH-03)
- **AC-DASH-05** Given reorder mode is off, When the user tries to drag a widget, Then nothing moves. (refs §4.3)
- **AC-DASH-06** Given reorder mode is on, When the user drops the goals widget at position 1, Then the page shows goals first and `ThemeSettings.widget_order` equals the new JSON array without pressing Save Default. (refs BR-DASH-04)
- **AC-DASH-07** Given reorder mode is on and no `ThemeSettings` row exists, When the user presses Save Default, Then a row is created holding `widget_order` and the alert `Widget arrangement saved as default!` appears. (refs BR-DASH-04)
- **AC-DASH-08** Given a pending non-meal chore with `due_date` before today and none due today, When the dashboard mounts, Then the Chores badge is red and shows `1`. Given one due today as well, Then it is purple and shows `2`. (refs BR-DASH-05, BR-DASH-07)
- **AC-DASH-09** Given no pending chores, When the dashboard mounts, Then the Chores badge is dimmed and shows no number; pressing it still navigates to `/chores?filter=due`. (refs BR-DASH-05)
- **AC-DASH-10** Given an uncompleted education activity with `frequency: "weekly"` and `days_of_week` containing today's three-letter name, When the dashboard mounts, Then the Education badge is blue and shows `1`. (refs BR-DASH-06)
- **AC-DASH-11** Given no `DailyPillarTracking` row dated today, When the dashboard mounts, Then the Focal Areas header button is blue; pressing it navigates to `/visionboard?tab=evaluation`. Given such a row exists, Then the button is neutral. (refs BR-DASH-08)
- **AC-DASH-12** Given `enable_chores` is false, When the dashboard renders, Then the Menu & Chores widget is still present. (refs BR-DASH-09)
- **AC-DASH-13** Given the Vision menu is open, When the user picks Custom Slideshow, Then the menu closes and the slideshow opens in `custom` mode. (refs §4.4)
- **AC-DASH-14** Given `dashboard_onboarded` is absent on this device, When the dashboard mounts, Then the walkthrough opens with the four steps in §9; Given it is present with any value, Then it stays closed. (refs §9)
- **AC-DASH-15** Given the app is opened in a new tab at `/tasks` while signed in, When the shell mounts, Then the URL becomes `/dashboard`. (refs §0)

## 14. Discrepancies & open questions

- **D-800** User Manual says the greeting name is customised "in Theme Editor settings" and lists "Dashboard header name" under Theme Editor (`src/pages/UserManual.jsx:33,397`); the only writer of `ThemeSettings.dashboard_header` is the Settings page control "Custom Display Name" (`src/pages/Settings.jsx:337-341,655,697`), and `src/pages/ThemeEditor.jsx` contains no reference to the field.
- **D-801** User Manual says "Your layout and preferences are saved automatically across all devices and sessions" (`src/pages/UserManual.jsx:35`); the dashboard walkthrough's trigger reads only the device key (`src/pages/Dashboard.jsx:64-66`) while its dismissal also writes the account map (`src/components/GenericOnboardingDialog.jsx:20-23`), so the dismissal is not consulted from another device (AR-PREF-34).
- **D-802** Onboarding step 2 says "Click the reorder icon (⇅) in the header" and the manual says "in the top-right" (`src/pages/Dashboard.jsx:46`, `src/pages/UserManual.jsx:32`); the control is rendered in the page body's action row above the widgets, and the page sets no header right slot (`src/pages/Dashboard.jsx:155,185-243`).
- Cited from other specs: **D-120** (toggles vs registry), **D-103 / D-104** (chores badge due and overdue rules), **D-105 / D-106** (education badge rules), **D-310** (card shell print/email handlers without controls).
- **Q-800** Blocks: §4.3 order merge. Question: what is the intended behaviour when `ThemeSettings.widget_order` contains an id that is not in the registry (for example after a widget is removed)? The page looks the id up in the registry with no fallback (`src/pages/Dashboard.jsx:252-254`).
- **Q-801** Blocks: §4.2 Focal Areas binding. Question: the page stores the Focal Areas highlight callback value but nothing reads it (`src/pages/Dashboard.jsx:56,311-313`). What page-level cue was intended?
- **Q-802** Blocks: §4.1. Question: a long-form date string is computed on every render and not displayed (`src/pages/Dashboard.jsx:153`). Where was it meant to appear?
