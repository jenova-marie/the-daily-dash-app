# App Shell — Feature Spec

**Feature code:** `SHELL` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 120 · Described 3 · Partial 2

**Sources owned:** `src/App.jsx` (routing, boot, restore, theme bootstrap), `src/main.jsx`, `index.html`, `src/lib/PageNotFound.jsx`, `src/pages/LandingPage.jsx` (navigation and calls to action only), `src/components/Layout.jsx` (navigation map, product binding of sidebar/header/swipe), `package.json` (app name, version, dependency inventory), `base44/config.jsonc` (platform app name)
**Sources referenced (owned elsewhere):** `src/components/Layout.jsx` sidebar/header/swipe mechanics → `10-architecture/shared-interactions.md` §9–§11 · `src/components/Layout.jsx:40-49` terms gate and `src/App.jsx:135-190` public paths → `10-architecture/auth-and-account.md` §5–§6 · `src/lib/HeaderContext.jsx` → `10-architecture/shared-interactions.md` §9 · `src/components/UserNotRegisteredError.jsx`, `src/pages/Auth.jsx`, `src/pages/AcceptTerms.jsx`, `src/pages/OAuthConsent.jsx` → `10-architecture/auth-and-account.md` · `src/pages/PrivacyPolicy.jsx`, `src/pages/TermsOfUse.jsx` → `00-overview/legal-copy.md` · `src/pages/Settings.jsx` (feature toggles) → `20-features/settings` and `10-architecture/preferences.md` Part B · `src/pages/ThemeEditor.jsx` (meaning of theme fields) → `20-features/theme-editor` · `base44/functions/initializeDefaultCollageImages` → `10-architecture/admin-operations.md` §2.5 · onboarding dialogs → `20-features/onboarding` · landing-page marketing copy → `00-overview/product-vision.md`

**Permissions:** per-user data; admin-only operations: none. The 404 page shows an extra note to account owners whose role is `admin` (§4.6).

## 0. Entry points & navigation

- Route: `/` (public landing) and the fourteen authenticated routes in §0.2 · Sidebar label: n/a (the shell *is* the sidebar) · Header title text: supplied per page (§4.3) · Position in swipe order: n/a
- Query parameters accepted: none by the shell itself; three routes accept feature deep-link parameters that pass through the shell unchanged (§0.4)
- Feature-toggle gating: three sidebar entries hide when their feature toggle is off (§0.2, §4.7)
- Header right-slot contents: supplied per page through the header context (§4.3)

### 0.1 Public routes (rendered without the sidebar shell)

| Path | Screen | Reached from | Tag / citation |
|---|---|---|---|
| `/` | Landing page | logged-out entry; "Back to Home" on the legal pages; "Go Home" on the 404 page | `[Implemented]` `src/App.jsx:195`, `src/pages/PrivacyPolicy.jsx:8-10`, `src/pages/TermsOfUse.jsx:8-10`, `src/lib/PageNotFound.jsx:62` |
| `/auth` | Sign in / sign up / verify / forgot | "Sign In", "Get Started — It's Free", "Start Now" on the landing page; any auth-required redirect | `[Implemented]` `src/App.jsx:196`, `src/pages/LandingPage.jsx:20-22,29,41-43,68`, `src/App.jsx:182-188` |
| `/accept-terms` | Terms and privacy gate | after login or verification; from the shell when flags are missing | `[Implemented]` `src/App.jsx:197`, `src/components/Layout.jsx:40-45` (copy and rules: auth spec §5) |
| `/reset-password` | Set a new password | emailed link | `[Implemented]` `src/App.jsx:198` (auth spec §4) |
| `/privacy-policy` | Privacy Policy | landing footer link | `[Implemented]` `src/App.jsx:199`, `src/pages/LandingPage.jsx:76` (text: `00-overview/legal-copy.md`) |
| `/terms-of-use` | Terms of Use | landing footer link | `[Implemented]` `src/App.jsx:200`, `src/pages/LandingPage.jsx:78` (text: `00-overview/legal-copy.md`) |
| (unrouted) | MCP consent page "Authorize access" | not registered in the router | `[Partial]` `src/App.jsx:194-218` (no route), `src/pages/OAuthConsent.jsx` (auth spec §11, D-337) |

The list of paths the shell treats as public is, verbatim: `'/', '/auth', '/accept-terms', '/privacy-policy', '/terms-of-use', '/reset-password'` `[Implemented]` `src/App.jsx:143,184`.

### 0.2 Authenticated routes (children of the shell, in sidebar order)

| # | Path | Sidebar label | Icon (lucide name) | Header title set by the page | Feature-toggle gating | Citation |
|---|---|---|---|---|---|---|
| 1 | `/dashboard` | Dashboard | `LayoutDashboard` | `Good Morning|Afternoon|Evening[, name]` (see `20-features/dashboard`) | always shown | `src/components/Layout.jsx:13`, `src/App.jsx:202`, `src/pages/Dashboard.jsx:154-155` |
| 2 | `/checklist` | Daily Checklist | `CheckSquare` | "Daily Checklist" | always shown | `src/components/Layout.jsx:14`, `src/App.jsx:203`, `src/pages/DailyChecklist.jsx:49` |
| 3 | `/tasks` | Tasks | `ListTodo` | "Task Manager" | always shown | `src/components/Layout.jsx:15`, `src/App.jsx:204`, `src/pages/Tasks.jsx:42` |
| 4 | `/calendar` | Calendar | `Calendar` | "Calendar" | always shown | `src/components/Layout.jsx:16`, `src/App.jsx:205`, `src/pages/CalendarPage.jsx:31` |
| 5 | `/schedule` | Daily Schedule | `Clock` | "Daily Schedule" | always shown | `src/components/Layout.jsx:17`, `src/App.jsx:206`, `src/pages/DailySchedule.jsx:82` |
| 6 | `/chores` | Chores | `Sparkles` | "Chore Manager" | hidden when the Chores toggle is off | `src/components/Layout.jsx:18,192`, `src/App.jsx:207`, `src/pages/Chores.jsx:31` |
| 7 | `/education` | Education | `GraduationCap` | "Education Manager" | hidden when the Education toggle is off | `src/components/Layout.jsx:19,191`, `src/App.jsx:208`, `src/pages/Education.jsx:26` |
| 8 | `/goals` | Goals | `Target` | "Goal Manager" | always shown | `src/components/Layout.jsx:20`, `src/App.jsx:209`, `src/pages/Goals.jsx:42` |
| 9 | `/visionboard` | Vision Board | `Eye` | "Vision Board" | hidden when the Vision Board toggle is off | `src/components/Layout.jsx:21,190`, `src/App.jsx:215`, `src/pages/VisionBoard.jsx:51` |
| 10 | `/quotes` | Daily Quotes | `Quote` | "Daily Quotes & Reflection" | always shown | `src/components/Layout.jsx:22`, `src/App.jsx:210`, `src/pages/Quotes.jsx:25` |
| 11 | `/links` | Link Library | `Library` | "Link Library" | always shown | `src/components/Layout.jsx:23`, `src/App.jsx:213`, `src/pages/Links.jsx:94` |
| 12 | `/theme` | Theme Editor | `Palette` | "Theme Editor" | always shown | `src/components/Layout.jsx:24`, `src/App.jsx:211`, `src/pages/ThemeEditor.jsx:62` |
| 13 | `/settings` | Settings | `Settings` | "Settings" | always shown | `src/components/Layout.jsx:25`, `src/App.jsx:212`, `src/pages/Settings.jsx:109` |
| 14 | `/manual` | User Manual | `BookOpen` | "User Manual" | always shown | `src/components/Layout.jsx:26`, `src/App.jsx:214`, `src/pages/UserManual.jsx:468` |
| — | `*` (any other path) | — | — | none (clock only) | — | `src/App.jsx:216` (§4.6) |

All rows `[Implemented]`. Sidebar order is also the swipe order (§4.4). Every route in this table is declared inside the shell route, so the catch-all 404 renders with the sidebar and header present `[Implemented]` `src/App.jsx:201-217`.

### 0.3 Public entry — landing page navigation and calls to action

- Brand text "The Daily Dash" at top-left; a "Sign In" button at top-right navigates to `/auth` `[Implemented]` `src/pages/LandingPage.jsx:27-30`.
- Hero call to action "Get Started — It's Free" navigates to `/auth` `[Implemented]` `src/pages/LandingPage.jsx:20-22,41-43`.
- Closing call to action "Start Now" navigates to `/auth` `[Implemented]` `src/pages/LandingPage.jsx:68`.
- Eight feature cards (title + description) under the heading "Everything you need in one place"; the cards are static and not links. Titles: Smart Scheduling · Task Management · Chore Manager · AI Meal Planning · Vision Board · Google Integration · Daily Reflection · Private & Secure `[Implemented]` `src/pages/LandingPage.jsx:6-15,49-60`. The descriptions are quoted in `00-overview/product-vision.md`.
- Footer: "© {current year} The Daily Dash. All rights reserved." · link "Privacy Policy" → `/privacy-policy` · link "Terms of Use" → `/terms-of-use` `[Implemented]` `src/pages/LandingPage.jsx:72-80`.
- The landing page does not check the session; a signed-in account owner who opens `/` in a new tab is moved to `/dashboard` by the restore rule (§4.5), and a signed-in account owner who opens `/auth` is moved to `/dashboard` by the auth screen `[Implemented]` `src/App.jsx:156-161`, `src/pages/Auth.jsx:35-39`.
- Both legal pages carry a "Back to Home" link to `/` `[Implemented]` `src/pages/PrivacyPolicy.jsx:8-10`, `src/pages/TermsOfUse.jsx:8-10`.

### 0.4 Query parameters that pass through the shell

| Target | Parameter | Set by | Consumed by | Citation |
|---|---|---|---|---|
| `/visionboard?tab=evaluation` | `tab=evaluation` opens the Daily Evaluation tab | Dashboard Focal Areas | Vision Board page | `[Implemented]` `src/pages/Dashboard.jsx:270`, `src/pages/VisionBoard.jsx:53,67` |
| `/chores?filter=due` | `filter=due` (or `all`) preselects the status filter | Dashboard tasks widget, Daily Schedule quick link | Chores page | `[Implemented]` `src/pages/Dashboard.jsx:280`, `src/pages/DailySchedule.jsx:904`, `src/pages/Chores.jsx:58-66` |
| `/education?filter=due` | `filter=due` preselects the status filter | Dashboard tasks widget, Daily Schedule quick link | Education page | `[Implemented]` `src/pages/Dashboard.jsx:295`, `src/pages/DailySchedule.jsx:920`, `src/pages/Education.jsx:50-53` |

The shell itself reads no query parameters `[Implemented]` `src/App.jsx:135-167`.

## 1. Purpose & user benefit

The shell is the frame every signed-in screen lives in: a left sidebar that lists the fourteen sections, a header that names the current section and shows the live date and time, and the rules that decide which screen opens when the app is launched, reloaded, or reached without a session.

The User Manual states it as: "Use the **sidebar** on the left to navigate between sections. On mobile, tap the hamburger menu (☰) in the top-left to open the sidebar." and "The sidebar can be **collapsed** to icon-only mode on desktop by clicking the arrow (‹) at the top of the sidebar." `[Described]` `src/pages/UserManual.jsx:15-16`.

The landing page frames the product as "Your personal command center" `[Described]` `src/pages/LandingPage.jsx:34`; the remaining marketing copy is quoted in `00-overview/product-vision.md`.

## 2. Concepts & vocabulary

- **feature toggle** (glossary): the Settings switches that hide Chores, Education, or Vision Board. In this spec a toggled-off feature is removed from the sidebar and from the swipe order.
- **walkthrough** (glossary): the per-page first-visit dialog. The shell hosts each page's "Guide" button in the header right slot (registry: `20-features/onboarding`).
- **device-local preference** (glossary): the shell keeps four such keys (§10).
- **account owner** (glossary): the single signed-in person; the shell shows the same sidebar to every account owner.
- **public path** (feature-local): one of the six paths that render without a session and outside the sidebar shell (§0.1).
- **last location** (feature-local): the device-local record of the most recently visited non-public path (§4.5).
- **fresh open** vs **reload** (feature-local): a browser navigation whose type is not `reload` versus one whose type is `reload` (§4.5).

## 3. User stories

- **US-SHELL-01** As an account owner, I want a sidebar listing every section so that I can move between features in one click `[Implemented]` `src/components/Layout.jsx:12-27,187-215`.
- **US-SHELL-02** As an account owner on a phone, I want the sidebar to slide in from a menu button and close when I pick a section so that it does not cover my content `[Implemented]` `src/components/Layout.jsx:65-69,151-157,164,179-184,201,221-227`.
- **US-SHELL-03** As an account owner on a desktop, I want to shrink the sidebar to icons so that the content gets more width `[Implemented]` `src/components/Layout.jsx:31,163,173-178,207-211`.
- **US-SHELL-04** As an account owner, I want to see which section I am in and the current date and time in the header so that I stay oriented `[Implemented]` `src/components/Layout.jsx:60-63,228-237`.
- **US-SHELL-05** As an account owner on a touch device, I want to swipe left or right to reach the next or previous section so that I can browse without opening the menu `[Implemented]` `src/components/Layout.jsx:105-146,219`.
- **US-SHELL-06** As an account owner who turned a feature off in Settings, I want it to disappear from the sidebar and from the swipe order immediately so that I am not shown sections I do not use `[Implemented]` `src/components/Layout.jsx:51-58,127-132,189-194`.
- **US-SHELL-07** As an account owner who reloads the page, I want to return to the section I was on so that a refresh does not lose my place `[Implemented]` `src/App.jsx:135-155`.
- **US-SHELL-08** As an account owner who opens the app in a new tab, I want to land on the Dashboard so that every fresh start begins at the overview `[Implemented]` `src/App.jsx:156-161`.
- **US-SHELL-09** As a visitor without a session, I want to be taken to the sign-in screen when I open an app page so that I am not shown a blank shell `[Implemented]` `src/App.jsx:182-188`.
- **US-SHELL-10** As an account owner who has not accepted the terms, I want the app to send me to the acceptance page before showing any section so that acceptance cannot be skipped `[Implemented]` `src/components/Layout.jsx:40-45`.
- **US-SHELL-11** As a visitor, I want a landing page with a clear sign-in and get-started path so that I know how to enter the app `[Implemented]` `src/pages/LandingPage.jsx:27-43,64-69`.
- **US-SHELL-12** As an account owner who mistypes a path, I want a "Page Not Found" screen with a way home so that I am not stuck `[Implemented]` `src/lib/PageNotFound.jsx:22-73`.
- **US-SHELL-13** As an account owner, I want the app to open in dark mode with my chosen background already in place so that there is no flash of an unstyled page `[Implemented]` `index.html:11-28`, `src/App.jsx:65-77`.

## 4. Capabilities & interactions

### 4.1 Boot and access states

- The document root is a single mount point; the app renders inside an auth provider, a query-client provider, a router, and a toast host `[Implemented]` `src/main.jsx:6-8`, `src/App.jsx:223-235`. The toast host is the surface every feature's toasts appear on `[Implemented]` `src/App.jsx:1,231`.
- While the platform's public settings or the current `User` record are loading, the shell shows a centred spinner over a transparent background and nothing else `[Implemented]` `src/App.jsx:170-176`.
- **Access states** (rules in auth spec §6): when the platform reports `user_not_registered`, the shell replaces the whole app with the full-screen "Access Restricted" page (copy owned by auth spec §7) `[Implemented]` `src/App.jsx:179-181`, `src/components/UserNotRegisteredError.jsx:13-23`. When it reports `auth_required` and the current path is not public, the shell performs a hard navigation to `/auth` and renders nothing `[Implemented]` `src/App.jsx:182-188`, `src/lib/AuthContext.jsx:126-128`. Any other state renders the routes `[Implemented]` `src/App.jsx:193-219`.

### 4.2 Sidebar

Mechanics are owned by `10-architecture/shared-interactions.md` §10 (AR-UI rules); this section records the product binding.

- Sidebar title "Dash it, Dash it ALL!" (hidden while collapsed) `[Implemented]` `src/components/Layout.jsx:168-172`.
- Fourteen entries in the order of §0.2; the entry for the current path is highlighted `[Implemented]` `src/components/Layout.jsx:187-214`.
- **Desktop collapse:** a chevron button (visible only at desktop widths) toggles between a labelled sidebar and an icon-only sidebar; the chevron rotates 180° when collapsed; the state lives in memory and starts expanded `[Implemented]` `src/components/Layout.jsx:31,163,173-178,207-211` (Q-321 in shared-interactions asks whether persistence is intended).
- **Mobile drawer:** at small widths the sidebar is off-canvas; the header's "Open menu" button toggles it; a dark full-screen overlay appears behind it; tapping the overlay, the "X" at the top of the drawer, or any entry closes it `[Implemented]` `src/components/Layout.jsx:65-69,151-157,164,179-184,201,221-227`.
- **Feature-toggle hiding:** the `/chores`, `/education`, and `/visionboard` entries are omitted while the matching toggle is off; the in-memory map starts with all three on and is replaced whenever a `featuresToggled` window event arrives `[Implemented]` `src/components/Layout.jsx:33,51-58,189-194` (propagation rules AR-PREF-21..23 in `10-architecture/preferences.md`; initial state versus stored toggles: D-132).

### 4.3 Header

Mechanics are owned by `10-architecture/shared-interactions.md` §9 (AR-UI-12); binding recorded here.

- The header is sticky at the top of the content column and is excluded from print output `[Implemented]` `src/components/Layout.jsx:220`, `src/index.css:134-137`.
- **Left:** at small widths only, the "Open menu" button (aria-label verbatim) `[Implemented]` `src/components/Layout.jsx:221-227`.
- **Centre:** the page title when a page has published one, above a live clock line `[Implemented]` `src/components/Layout.jsx:228-237`. Titles per route are in §0.2. Pages that publish no title (the 404 screen) show the clock alone `[Implemented]` `src/components/Layout.jsx:229-233`.
- **Live clock:** `EEE, MMM d · h:mm a` (for example `Sat, Sep 20 · 3:07 PM`), re-rendered every second from the device clock `[Implemented]` `src/components/Layout.jsx:34,60-63,235`.
- **Right slot:** whatever the current page publishes; when empty, a fixed-width spacer is reserved at small widths so the title stays centred `[Implemented]` `src/components/Layout.jsx:238-244`. Pages with a walkthrough publish a "Guide" icon button here (registry and per-page differences: `20-features/onboarding` §4); the Dashboard, Theme Editor, Settings, and User Manual publish nothing `[Implemented]` `src/pages/Dashboard.jsx:155,186-188`, `src/pages/ThemeEditor.jsx:62`, `src/pages/Settings.jsx:109`, `src/pages/UserManual.jsx:468`.
- The content area below the header scrolls independently of the sidebar `[Implemented]` `src/components/Layout.jsx:149,247-249`.

### 4.4 Swipe between pages

Thresholds and the visible-list rule are AR-UI-13 in `10-architecture/shared-interactions.md` §11. This section binds them to the shell.

- The gesture is captured on the whole content column (header plus page) `[Implemented]` `src/components/Layout.jsx:219`.
- A leftward swipe of more than 50 px navigates to the next entry of the *visible* sidebar list; a rightward swipe of more than 50 px navigates to the previous entry; the list wraps at both ends; a gesture whose vertical travel is at least its horizontal travel is ignored `[Implemented]` `src/components/Layout.jsx:116-146`.
- When the current path is not in the visible list (a 404 path, or a page whose toggle is off), a left swipe goes to the first entry (Dashboard) and a right swipe goes to the second-to-last visible entry `[Implemented]` `src/components/Layout.jsx:134-141` (index arithmetic on `-1`).
- **Suppression conditions** — the swipe does nothing when any of the following holds `[Implemented]` `src/components/Layout.jsx:74-88,90-103,105-114`:
  1. a daily evaluation is in progress (`window.__evalInProgress` is set while the evaluation wizard is active and cleared on save; owner `20-features/vision-board`) `src/components/Layout.jsx:76`, `src/components/visionboard/DailyEvaluation.jsx:33-36,187`;
  2. an `INPUT`, `TEXTAREA`, or `SELECT` element has focus `src/components/Layout.jsx:78-79`;
  3. any element with `role="dialog"` is present in the document (every open dialog, alert dialog, or drawer) `src/components/Layout.jsx:81`;
  4. the focused element is a range input `src/components/Layout.jsx:83-84`;
  5. the touch started on, or inside, an element with `role="slider"`, an `input[type="range"]`, or an element with class `slider` (the start point is then not recorded at all) `src/components/Layout.jsx:92-98,86`;
  6. the touch ended on, or inside, such a slider element `src/components/Layout.jsx:111-114`;
  7. no start point was recorded (for example the touch began on a slider) `src/components/Layout.jsx:107`.
- The Vision Board slideshow's own left/right swipes are handled inside the slideshow, which is a dialog and therefore falls under condition 3 (owner `20-features/vision-board`).

### 4.5 Launch and restore rules

Rules are AR-AUTH-05 in `10-architecture/auth-and-account.md` §6; the shell owns the behaviour.

- **Recording the last location.** On every route change to a path other than `/`, `/auth`, or `/accept-terms`, the shell writes the path to the device key `lastLocation` `[Implemented]` `src/App.jsx:135-139`. On mount, if the current path is not one of the six public paths, the shell also writes it `[Implemented]` `src/App.jsx:163-166`. The two exclusion lists differ (D-950).
- **Reload.** A browser navigation of type `reload` that lands on a public path, when a `lastLocation` exists and the platform reports the visitor as authenticated, replaces the current entry with `lastLocation` `[Implemented]` `src/App.jsx:145-155`. A reload of a non-public path stays where it is (and re-records it) `[Implemented]` `src/App.jsx:151,163-166`.
- **Fresh open.** Any navigation that is not a reload (new tab, new window, typed URL, external link) replaces the current entry with `/dashboard` whenever the platform reports the visitor as authenticated, regardless of the path opened `[Implemented]` `src/App.jsx:156-161` (Q-951).
- **Signed-in visit to `/auth`** is sent to `/dashboard` by the auth screen `[Implemented]` `src/pages/Auth.jsx:35-39`.
- **Signed-out visit to a non-public path** is sent to `/auth` by a hard navigation `[Implemented]` `src/App.jsx:182-188`, `src/lib/AuthContext.jsx:126-128`.
- Navigation-type detection uses the Navigation Timing entry type, falling back to the legacy `performance.navigation.type === 1` `[Implemented]` `src/App.jsx:146-147`.

### 4.6 Page Not Found (404)

- Any path not listed in §0.1/§0.2 renders the 404 screen *inside* the shell: sidebar and header remain, the header shows the clock without a title `[Implemented]` `src/App.jsx:201,216`, `src/components/Layout.jsx:229-236`.
- Copy (verbatim) `[Implemented]` `src/lib/PageNotFound.jsx:28-39,68`:
  - "404"
  - "Page Not Found"
  - `The page "{path without its leading slash}" could not be found in this application.`
  - Button "Go Home" — performs a hard navigation to `/` `src/lib/PageNotFound.jsx:61-69`.
- When the visitor is signed in and their role is `admin`, an extra panel appears: "Admin Note" — "This could mean that the AI hasn't implemented this page yet. Ask it to implement it in the chat." `[Implemented]` `src/lib/PageNotFound.jsx:10-20,43-57`. Roles: auth spec §8.
- Leaving the 404 through "Go Home" reloads the document at `/`; the fresh-open rule then applies (§4.5) `[Implemented]` `src/lib/PageNotFound.jsx:62`, `src/App.jsx:156-161`.

### 4.7 Terms gate on mount

- Every time the authenticated shell mounts it loads the current `User` record and, when either `terms_accepted` or `privacy_accepted` is falsy, navigates to `/accept-terms`; a failure to load the record is ignored `[Implemented]` `src/components/Layout.jsx:40-45`. Acceptance page copy and what accepting writes: auth spec §5 (AR-AUTH-04); the summaries shown there are quoted in `00-overview/legal-copy.md`.

### 4.8 Default collage seeding on mount

- On every mount of the authenticated shell the app invokes `initializeDefaultCollageImages` and ignores any failure `[Implemented]` `src/components/Layout.jsx:47-48`. The function copies the admin-flagged default images into the caller's collage only when the caller has none (AR-ADMIN-18..21 in `10-architecture/admin-operations.md` §2.5). The same call is made on terms acceptance `[Implemented]` `src/pages/AcceptTerms.jsx:52-57`.

### 4.9 Feature-toggle live propagation

- The shell listens for the window event `featuresToggled` and replaces its feature map with the event's `detail` (`{ vision_board, education, chores }`) `[Implemented]` `src/components/Layout.jsx:51-58`. The event is dispatched by Settings when a toggle is flipped and when the Dashboard card is saved (AR-PREF-21, `src/pages/Settings.jsx:668,723`). The shell does not read `ThemeSettings` for the toggles, so on a fresh load all three entries are shown until Settings dispatches `[Implemented]` `src/components/Layout.jsx:33` (D-132 in `10-architecture/preferences.md`).

### 4.10 Theme bootstrap and dark-mode default

Meaning of the theme fields belongs to `20-features/theme-editor`; the shell owns when and how they are applied at launch.

- **Before the app loads** (inline script in the HTML document): the `dark` class is added to the root element; a background library is read from the device key `theme_bg_library` (falling back to a single built-in image); unless the device key `theme_randomize` equals `"0"` a random entry of that library is chosen; otherwise the device key `theme_last_bg` or the built-in image is used; the chosen URL is applied to the body as a fixed, centred, cover background; any failure is swallowed `[Implemented]` `index.html:11-28`.
- **On app mount:** the `dark` class is added again and, if `theme_last_bg` is set, that background is re-applied `[Implemented]` `src/App.jsx:65-77`.
- **After authentication completes:** the newest `ThemeSettings` row is read (none → nothing further). From it: `primary_color` and `accent_color` are converted to HSL and set as the `--primary` and `--accent` variables; the `dark` class is removed only when `dark_mode === false`; `body_font` and `heading_font` set the sans and display font variables; `--widget-opacity` is `widget_bg_opacity / 100` (default 70 → 0.7); `--widget-radius` is `widget_border_radius` px (default 12) `[Implemented]` `src/App.jsx:80-99`.
- **Background choice after authentication:** the library is `background_library` when non-empty, otherwise the five built-in URLs (§11); randomise is on unless `randomize_background === false`; when on, a random library entry is used, otherwise `background_image` or the built-in default. The library is cached to `theme_bg_library`; `theme_randomize` is written as `"1"` when on and *removed* when off; the applied URL is written to `theme_last_bg` `[Implemented]` `src/App.jsx:101-126`. The inline script treats an absent `theme_randomize` as "randomise" (D-951).
- Dark mode is therefore the default for every visitor, including on the public pages, and can only be turned off by an account's `dark_mode` field after sign-in `[Implemented]` `index.html:13`, `src/App.jsx:67,95`.

### 4.11 Document identity

- Document `<title>` is "Base44 APP"; no code changes it afterwards `[Implemented]` `index.html:8` (search of `src/` for `document.title`: only a read in `src/lib/app-params.js:20`) (D-952, Q-952).
- Favicon: `https://base44.com/logo_v2.svg` `[Implemented]` `index.html:5`.
- Language `en`; viewport `width=device-width, initial-scale=1.0` `[Implemented]` `index.html:2,6`.
- **PWA manifest:** the document links `/manifest.json`, but the repository contains no `public/` directory and no manifest file, and the build configuration declares none `[Partial]` `index.html:7`, `vite.config.js:1-19` (Q-950).
- App names in use: "The Daily Dash" (landing page, terms gate, manual support block) `src/pages/LandingPage.jsx:28`, `src/pages/AcceptTerms.jsx:78`, `src/pages/UserManual.jsx:522`; "Dash it, Dash it ALL!" (sidebar, manual overview and tagline) `src/components/Layout.jsx:170`, `src/pages/UserManual.jsx:14,496`; "The Daily Dash APP" (platform app config) `base44/config.jsonc:2`; package name `base44-app`, version `0.0.0` `package.json:2,4` `[Implemented]` (D-952).

### 4a. Keyboard & pointer

- Sidebar entries are links; the mobile overlay closes on click/tap `[Implemented]` `src/components/Layout.jsx:151-157,198-201`.
- Horizontal swipe on the content column: §4.4.
- No shell-level keyboard shortcuts were observed. Dialog Escape handling belongs to the dialog primitives (shared-interactions §8).

### 4b. View state & persistence

| Control | Values | Default | Scope (memory / device `key` / account `Entity.field`) |
|---|---|---|---|
| Sidebar collapsed (desktop) | expanded / icon-only | expanded | memory `src/components/Layout.jsx:31` |
| Mobile drawer open | open / closed | closed | memory `src/components/Layout.jsx:32` |
| Feature map | `{vision_board, education, chores}` booleans | all `true` | memory, replaced by `featuresToggled` `src/components/Layout.jsx:33,51-58` |
| Header title / right slot | any / element or null | "" / null | memory (header context) `src/lib/HeaderContext.jsx:5-12` |
| Last visited path | path string | unset | device `lastLocation` `src/App.jsx:137,165` |
| Background cache | URL, JSON string[], `"1"` | unset | device `theme_last_bg`, `theme_bg_library`, `theme_randomize` `src/App.jsx:112-125` |
| Theme fields | see theme-editor | entity defaults | account `ThemeSettings.*` (read only here) `src/App.jsx:87-99` |

### 4c. Empty & fallback states

| State | Copy / behaviour | Citation |
|---|---|---|
| Loading public settings or `User` record | centred spinner, no text | `[Implemented]` `src/App.jsx:170-176` |
| Not registered | "Access Restricted" page (auth spec §7) | `[Implemented]` `src/App.jsx:179-181` |
| Unknown route | "404" / "Page Not Found" / `The page "{name}" could not be found in this application.` / "Go Home" | `[Implemented]` `src/lib/PageNotFound.jsx:28-39,68` |
| No page title published | header shows the clock line only | `[Implemented]` `src/components/Layout.jsx:229-236` |
| No right-slot content | spacer at small widths | `[Implemented]` `src/components/Layout.jsx:242-244` |
| No `ThemeSettings` row | built-in dark theme and default background remain | `[Implemented]` `src/App.jsx:89`, `index.html:13-21` |

## 5. Business rules

- **BR-SHELL-01 — Six public paths.** `/`, `/auth`, `/accept-terms`, `/privacy-policy`, `/terms-of-use`, `/reset-password` render without a session and outside the sidebar shell; every other declared route is a child of the shell `[Implemented]` `src/App.jsx:143,184,194-217`.
- **BR-SHELL-02 — Signed-out access to an app page goes to sign-in.** When the platform reports `auth_required` on a non-public path, the shell hard-navigates to `/auth` `[Implemented]` `src/App.jsx:182-188`.
- **BR-SHELL-03 — Reload restores, fresh open resets.** A reload landing on a public path returns an authenticated visitor to `lastLocation`; any non-reload navigation sends an authenticated visitor to `/dashboard` `[Implemented]` `src/App.jsx:141-161`.
- **BR-SHELL-04 — Last location excludes the entry pages.** `/`, `/auth`, and `/accept-terms` are never recorded on route change; the six public paths are never recorded on mount `[Implemented]` `src/App.jsx:135-139,163-166` (D-950).
- **BR-SHELL-05 — Terms gate on every shell mount.** Missing `terms_accepted` or `privacy_accepted` sends the account owner to `/accept-terms` `[Implemented]` `src/components/Layout.jsx:40-45`.
- **BR-SHELL-06 — Collage seeding on every shell mount.** `initializeDefaultCollageImages` is invoked with failures ignored `[Implemented]` `src/components/Layout.jsx:47-48`.
- **BR-SHELL-07 — Feature toggles remove sidebar entries and swipe stops.** A toggled-off feature is absent from both the sidebar and the swipe ring; the shell learns of toggles only through the `featuresToggled` event and starts with all three on `[Implemented]` `src/components/Layout.jsx:33,51-58,127-132,189-194`.
- **BR-SHELL-08 — Swipe order is sidebar order and wraps.** Left = next visible entry, right = previous visible entry, modulo the visible count `[Implemented]` `src/components/Layout.jsx:127-145`.
- **BR-SHELL-09 — Swipe yields to editing.** The seven suppression conditions of §4.4 take precedence over navigation `[Implemented]` `src/components/Layout.jsx:74-114`.
- **BR-SHELL-10 — Dark by default.** The root carries `dark` before the app loads and after mount; only an account whose `dark_mode` is `false` removes it `[Implemented]` `index.html:13`, `src/App.jsx:67,95`.
- **BR-SHELL-11 — Background is chosen before React loads.** The inline script picks from the cached library (random unless `theme_randomize` is `"0"`), else the last background, else the built-in image `[Implemented]` `index.html:14-26`.
- **BR-SHELL-12 — Theme is applied once per authenticated session.** After auth completes, the newest `ThemeSettings` row is read and applied; the choice is cached to the device for the next launch `[Implemented]` `src/App.jsx:80-133`.
- **BR-SHELL-13 — The 404 lives inside the shell.** Unknown paths keep the sidebar and header; "Go Home" hard-navigates to `/` `[Implemented]` `src/App.jsx:216`, `src/lib/PageNotFound.jsx:62`.
- **BR-SHELL-14 — Header content is page-owned.** Only the current page's published title and right-slot element are shown; both are cleared when the page unmounts `[Implemented]` `src/lib/HeaderContext.jsx:5-12`, e.g. `src/pages/Quotes.jsx:25-26`.
- **BR-SHELL-15 — Mobile drawer closes on selection.** Any sidebar link click, the overlay, or the "X" closes the drawer `[Implemented]` `src/components/Layout.jsx:154,180,201`.
- **BR-SHELL-16 — All landing calls to action lead to `/auth`.** "Sign In", "Get Started — It's Free", and "Start Now" all navigate to the auth screen; the landing page has no other in-app link besides the two legal pages `[Implemented]` `src/pages/LandingPage.jsx:20-22,29,41-43,68,76-78`.

### 5a. State & lifecycle

| State set | State | Trigger | Next state | Side effects | Citation |
|---|---|---|---|---|---|
| Boot | loading | public settings and `User` record loaded | routes rendered / Access Restricted / redirect to `/auth` | spinner removed | `src/App.jsx:170-190` |
| Boot | routes rendered (authenticated) | theme load | themed | CSS variables set, background applied, device cache written | `src/App.jsx:80-133` |
| Shell mount | mounted | `User` record lacks either acceptance flag | at `/accept-terms` | — | `src/components/Layout.jsx:40-45` |
| Shell mount | mounted | always | mounted | `initializeDefaultCollageImages` invoked | `src/components/Layout.jsx:47-48` |
| Feature map | all on | `featuresToggled` event | event detail | sidebar re-filters; swipe ring re-filters | `src/components/Layout.jsx:51-58` |
| Sidebar (desktop) | expanded | chevron click | icon-only (and back) | labels hidden; title hidden | `src/components/Layout.jsx:31,163-178` |
| Drawer (mobile) | closed | "Open menu" | open | overlay shown | `src/components/Layout.jsx:65-69,151-157` |
| Drawer (mobile) | open | overlay tap / "X" / entry click | closed | — | `src/components/Layout.jsx:154,180,201` |
| Touch | idle | touchstart off-slider | armed (start X/Y and target stored) | — | `src/components/Layout.jsx:90-103` |
| Touch | armed | touchend, not blocked, horizontal ≥ 50 px | navigated | route change; `lastLocation` written | `src/components/Layout.jsx:105-146`, `src/App.jsx:135-139` |
| Clock | t | every 1 000 ms | t + 1 s | header re-render | `src/components/Layout.jsx:60-63` |

### 5b. Time & date semantics

- The header clock uses the device's local time and re-reads it every second; format `EEE, MMM d · h:mm a` `[Implemented]` `src/components/Layout.jsx:60-63,235`. This is the "today" of `10-architecture/time-and-date-semantics.md` (device-local date).
- The greeting thresholds (before 12:00 "Morning", before 17:00 "Afternoon", otherwise "Evening") are computed by the Dashboard from the device clock and published as the header title `[Implemented]` `src/pages/Dashboard.jsx:154-155` (owner `20-features/dashboard`).
- The landing footer year is the device's current year `[Implemented]` `src/pages/LandingPage.jsx:74`.
- No due/overdue/upcoming semantics apply to the shell. None observed.

## 6. Data

| Entity / call | Operation | Fields used | Limits / order | Citation |
|---|---|---|---|---|
| `User` (via `auth.me`) | read | `terms_accepted`, `privacy_accepted`, `role` | — | `src/components/Layout.jsx:41-42`, `src/lib/PageNotFound.jsx:14,43` |
| `auth.isAuthenticated` | read | — | — | `src/App.jsx:152,158` |
| `ThemeSettings` | read | `primary_color`, `accent_color`, `dark_mode`, `body_font`, `heading_font`, `widget_bg_opacity`, `widget_border_radius`, `background_library`, `randomize_background`, `background_image` | newest one (`-updated_date`, limit 1) | `src/App.jsx:87-108` |
| `initializeDefaultCollageImages` (function) | invoke | — | every shell mount | `src/components/Layout.jsx:48` |

The shell writes no entity. Field semantics: `10-architecture/data-model/` (ThemeSettings) and `10-architecture/preferences.md` A.2.

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| Settings → Shell | `20-features/settings` | window event `featuresToggled` with `{vision_board, education, chores}` replaces the feature map | `src/pages/Settings.jsx:668,723`, `src/components/Layout.jsx:51-58` |
| Vision Board → Shell | `20-features/vision-board` | `window.__evalInProgress` suppresses page swipes during a daily evaluation | `src/components/visionboard/DailyEvaluation.jsx:33-36,187`, `src/components/Layout.jsx:76` |
| Every page → Shell | all features | header context: `setTitle`, `setHeaderRight` | `src/lib/HeaderContext.jsx:1-17`; per page in §0.2 |
| Shell → Auth | `10-architecture/auth-and-account.md` | terms gate redirect to `/accept-terms`; `auth_required` redirect to `/auth`; Access Restricted page | `src/components/Layout.jsx:40-45`, `src/App.jsx:179-188` |
| Auth → Shell | `10-architecture/auth-and-account.md` | signed-in `/auth` bounces to `/dashboard`; terms acceptance lands on `/dashboard` | `src/pages/Auth.jsx:35-39`, `src/pages/AcceptTerms.jsx:59` |
| Shell → Admin operations | `10-architecture/admin-operations.md` §2.5 | `initializeDefaultCollageImages` on mount | `src/components/Layout.jsx:47-48` |
| Shell → Theme Editor | `20-features/theme-editor` | applies `ThemeSettings` at launch and caches library/randomise/last background for the next boot | `src/App.jsx:80-133`, `index.html:11-28` |
| Dashboard / Daily Schedule → Chores, Education, Vision Board | owning features | deep links with `?filter=due` and `?tab=evaluation` routed through the shell (§0.4) | `src/pages/Dashboard.jsx:270,280,295`, `src/pages/DailySchedule.jsx:904,920` |
| Shell → Onboarding | `20-features/onboarding` | hosts each page's "Guide" button in the right slot | `src/components/Layout.jsx:238-241` |
| Shell → Export | `10-architecture/export-print-email.md` | header carries `no-print`; page content prints | `src/components/Layout.jsx:220`, `src/index.css:134-137` |

### 7a. Feedback & notifications

- Loading spinner during boot `[Implemented]` `src/App.jsx:170-176`.
- The toast host is mounted by the shell; the shell itself raises no toasts `[Implemented]` `src/App.jsx:231`.
- No confirm dialogs, alerts, or celebratory effects belong to the shell. None observed.

## 8. AI & automation

None observed in the shell. The seeding function invoked on mount is catalogued in `10-architecture/admin-operations.md` §2.5 and also runs as a scheduled workflow (`10-architecture/automations.md`).

## 9. Onboarding content

The shell has no walkthrough of its own. Its navigation is described in the User Manual's "App Overview" section (quoted in §1) `[Described]` `src/pages/UserManual.jsx:14-16`. The per-page walkthrough registry, including where each "Guide" button lives, is `20-features/onboarding`.

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `lastLocation` | Most recent non-entry path, restored on reload | unset (fresh open → `/dashboard`) | route change `src/App.jsx:137`; mount `src/App.jsx:165` | never |
| `theme_last_bg` | Background URL applied last; re-applied before the account loads | unset | `src/App.jsx:125` | never |
| `theme_bg_library` | Cached background library for the pre-React pick | `[]` (script falls back to one built-in image) | `src/App.jsx:112` | never |
| `theme_randomize` | `"1"` when randomise-on-load is on; script randomises unless `"0"` | absent (script randomises) | `src/App.jsx:114`; removed when off `src/App.jsx:116` | Settings off → `removeItem` |

Register of record: `10-architecture/preferences.md` Part D.

## 11. Seed / hardcoded data used

- **Sidebar entries** (path, label, icon) — the fourteen rows of §0.2 `[Implemented]` `src/components/Layout.jsx:12-27`.
- **Public paths** — six, verbatim in §0.1 `[Implemented]` `src/App.jsx:143,184`.
- **Built-in default background** — `https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920` `[Implemented]` `index.html:14`, `src/App.jsx:50`.
- **Built-in background library** (five URLs, used when the account library is empty) `[Implemented]` `src/App.jsx:52-58`:
  1. `https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920`
  2. `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920`
  3. `https://images.unsplash.com/photo-1771849146987-89a04383ae87?q=80&w=1740&auto=format&fit=crop`
  4. `https://images.unsplash.com/photo-1773672726538-885c0d878033?q=80&w=2064&auto=format&fit=crop`
  5. `https://cdn.lifeofpix.com/127295/_w1800/308669/lifeofpix-eberhardgross6384-308669.webp`
- **Theme defaults applied by the shell** — widget opacity 70 %, widget radius 12 px, randomise on `[Implemented]` `src/App.jsx:98-99,102`.
- **Document identity** — title "Base44 APP", favicon `https://base44.com/logo_v2.svg`, manifest link `/manifest.json` `[Implemented]` `index.html:5-8`.
- **Landing feature-card titles** — eight, listed in §0.3 `[Implemented]` `src/pages/LandingPage.jsx:6-15`.
- **App identity** — package `base44-app` version `0.0.0`; platform config name "The Daily Dash APP" `[Implemented]` `package.json:2,4`, `base44/config.jsonc:2`.
- **Dependencies with no product intent.** The following packages are declared but not imported anywhere under `src/` (repository search); no feature in this corpus is derived from them `[Implemented]` `package.json:46-47,56,58,49,68-70,77,69,61`:

  | Package | Product-sounding reading to avoid |
  |---|---|
  | `@stripe/react-stripe-js`, `@stripe/stripe-js` | no payments or subscription feature exists; the landing page states "It's Free" (`src/pages/LandingPage.jsx:42`) |
  | `three` | no 3-D feature |
  | `react-leaflet` | no map feature |
  | `react-quill` | no rich-text editor |
  | `html2canvas`, `jspdf` | no PDF export; export is print/email (`10-architecture/export-print-email.md`) |
  | `canvas-confetti`, `react-markdown`, `moment` | unused |

  `recharts` **is** used by the Vision Board weekly review (`src/components/visionboard/WeeklyReview.jsx`) and the chart primitive; `embla-carousel-react`, `next-themes`, `cmdk`, `vaul`, `input-otp`, `react-hot-toast`, `sonner`, `react-resizable-panels` are imported only by UI primitives under `src/components/ui/`.

## 12. Print / email formats

The shell contributes no format. The header is excluded from print through the `no-print` class; the sidebar and content follow the print stylesheet described in `10-architecture/export-print-email.md` `[Implemented]` `src/components/Layout.jsx:220`, `src/index.css:134-141`.

## 13. Acceptance criteria

- **AC-SHELL-01** Given a signed-in account owner, when the app renders any of the fourteen routes in §0.2, then the sidebar lists the entries in that order with the current route highlighted (refs BR-SHELL-14, §4.2).
- **AC-SHELL-02** Given a desktop width, when the chevron is clicked, then the sidebar shows icons only and the title is hidden; clicking again restores labels; reloading restores the expanded state (refs §4.2, §4b).
- **AC-SHELL-03** Given a small width, when "Open menu" is tapped, then the drawer and overlay appear; tapping the overlay, the "X", or an entry closes both (refs BR-SHELL-15).
- **AC-SHELL-04** Given any page, when it publishes a title, then the header shows that title above a clock in the form `EEE, MMM d · h:mm a` that advances every second; when the page unmounts, the title is cleared (refs BR-SHELL-14, §4.3).
- **AC-SHELL-05** Given the Chores toggle is turned off in Settings, when the `featuresToggled` event fires, then the Chores entry disappears from the sidebar without a reload and a left swipe from Daily Schedule lands on Education (refs BR-SHELL-07, BR-SHELL-08).
- **AC-SHELL-06** Given the app was just loaded and no `featuresToggled` event has fired, then all three toggle-gated entries are shown regardless of stored toggles (refs BR-SHELL-07, D-132).
- **AC-SHELL-07** Given a touch that ends more than 50 px left of its start with less vertical travel, when no suppression condition holds, then the next visible entry opens; from User Manual it wraps to Dashboard (refs BR-SHELL-08).
- **AC-SHELL-08** Given a text input has focus, or a dialog is open, or a daily evaluation is in progress, or the touch began or ended on a slider, when a horizontal swipe is made, then no navigation occurs (refs BR-SHELL-09).
- **AC-SHELL-09** Given a signed-in account owner on `/tasks`, when the browser is reloaded, then `/tasks` is shown and `lastLocation` equals `/tasks` (refs BR-SHELL-03, BR-SHELL-04).
- **AC-SHELL-10** Given `lastLocation` is `/goals`, when a reload lands on `/` and the visitor is authenticated, then the app replaces the entry with `/goals` (refs BR-SHELL-03).
- **AC-SHELL-11** Given a signed-in account owner, when the app is opened in a new tab at any path, then the app replaces the entry with `/dashboard` (refs BR-SHELL-03).
- **AC-SHELL-12** Given no session, when `/dashboard` is opened, then the browser is sent to `/auth`; when `/privacy-policy` is opened, then the page renders (refs BR-SHELL-01, BR-SHELL-02).
- **AC-SHELL-13** Given an account owner whose `privacy_accepted` is false, when the shell mounts, then the app navigates to `/accept-terms` (refs BR-SHELL-05).
- **AC-SHELL-14** Given the shell mounts, then `initializeDefaultCollageImages` is invoked once and any failure is silent (refs BR-SHELL-06).
- **AC-SHELL-15** Given the path `/nowhere`, when it is opened while signed in, then the sidebar and clock remain, the page reads "404", "Page Not Found", `The page "nowhere" could not be found in this application.`, and "Go Home" reloads at `/`; when the role is `admin`, the "Admin Note" panel also appears (refs BR-SHELL-13).
- **AC-SHELL-16** Given a first visit with no device cache, when the document loads, then the root has class `dark` and the body background is the built-in image before any script module runs (refs BR-SHELL-10, BR-SHELL-11).
- **AC-SHELL-17** Given a `ThemeSettings` row with `dark_mode: false`, `randomize_background: false`, and a `background_image`, when authentication completes, then `dark` is removed, that image is applied, `theme_last_bg` holds its URL, and `theme_randomize` is absent (refs BR-SHELL-12).
- **AC-SHELL-18** Given the landing page, when "Sign In", "Get Started — It's Free", or "Start Now" is activated, then `/auth` opens; when "Privacy Policy" or "Terms of Use" is activated, then the matching page opens with a "Back to Home" link (refs BR-SHELL-16).
- **AC-SHELL-19** Given the Dashboard Focal Areas button navigates to `/visionboard?tab=evaluation`, then the Vision Board opens on its evaluation tab (refs §0.4).

## 14. Discrepancies & open questions

- **D-950** The route-change recorder excludes only `/`, `/auth`, `/accept-terms` (`src/App.jsx:136`), so `/privacy-policy`, `/terms-of-use`, and `/reset-password` are stored as `lastLocation` when visited; the mount recorder and the reload check exclude all six public paths (`src/App.jsx:143,164`).
- **D-951** The app writes `theme_randomize = "1"` when randomise is on and removes the key when it is off (`src/App.jsx:113-117`); the pre-React script randomises whenever the key is not `"0"`, so an absent key (randomise off) still randomises from the cached library on the next launch (`index.html:18`). No code writes `"0"`.
- **D-952** The product is named differently in five places: document title "Base44 APP" (`index.html:8`), landing page and terms gate "The Daily Dash" (`src/pages/LandingPage.jsx:28`, `src/pages/AcceptTerms.jsx:78`), sidebar and manual "Dash it, Dash it ALL!" (`src/components/Layout.jsx:170`, `src/pages/UserManual.jsx:14,496`), platform config "The Daily Dash APP" (`base44/config.jsonc:2`), package `base44-app` (`package.json:2`).
- See also **D-132** (`10-architecture/preferences.md`): the shell's feature map starts all-on (`src/components/Layout.jsx:33`) while Daily Schedule reads the stored toggles on mount (`src/pages/DailySchedule.jsx:144-147`); and **D-337** (auth spec): the MCP consent page is not routed.
- **Q-950** Blocks: §4.11. Is a web-app manifest (installable app name, icons, start URL) part of the product? The document links `/manifest.json` but no manifest exists in the repository.
- **Q-951** Blocks: §4.5. Is the fresh-open rule intended to override a deep link opened in a new tab (for example a shared `/visionboard?tab=evaluation` link), which currently lands on `/dashboard`?
- **Q-952** Blocks: §4.11. Which of the five names in D-952 is the product name for the document title and the installed-app name?
