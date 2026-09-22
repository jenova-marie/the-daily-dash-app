# Daily Quotes — Feature Spec

**Feature code:** `QUOTE` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 131 · Described 6 · Partial 3

**Sources owned:** `src/pages/Quotes.jsx`, `src/components/dashboard/DashboardQuote.jsx`
**Sources referenced (owned elsewhere):** `base44/functions/fetchDailyQuote/entry.ts`, `base44/functions/generateDailyQuotes/entry.ts`, `base44/workflows/Midnight Daily Quote Generator.jsonc` → `10-architecture/ai-services.md` §8 and `10-architecture/automations.md` §2a · `src/components/SwipeableListItem.jsx`, `src/components/GenericOnboardingDialog.jsx`, `src/lib/HeaderContext.jsx` → `10-architecture/shared-interactions.md` · `src/components/WidgetCard.jsx` → `10-architecture/export-print-email.md` · `src/pages/Dashboard.jsx` (widget registry) → `20-features/dashboard/spec.md` · `base44/entities/DailyQuote.jsonc` → `10-architecture/data-model/quotes-links.md` · `base44/entities/ThemeSettings.jsonc` (`onboarding_status`) → `10-architecture/preferences.md` · `src/pages/UserManual.jsx` → `20-features/user-manual`

**Permissions:** per-user data (`DailyQuote` rows are readable and writable only by their creator, `base44/entities/DailyQuote.jsonc:27-40`); admin-only operations: none on the page. The scheduled generator runs under an admin caller (`base44/functions/generateDailyQuotes/entry.ts:12-18`, see `automations.md` AR-AUTO-04).

## 0. Entry points & navigation

- Route: `/quotes` `[Implemented]` `src/App.jsx:210` · Sidebar label: "Daily Quotes" `[Implemented]` `src/components/Layout.jsx:22` · Header title text: "Daily Quotes & Reflection" `[Implemented]` `src/pages/Quotes.jsx:25` · Position in swipe order: 10th of 14 navigation items, between Vision Board and Link Library; hidden feature pages are skipped by the ring `[Implemented]` `src/components/Layout.jsx:12-27,127-132`
- Query parameters accepted: none observed `[Implemented]` `src/pages/Quotes.jsx:23-35`
- Feature-toggle gating: none; always in the sidebar `[Implemented]` `src/components/Layout.jsx:127-132`
- Header right-slot contents: one icon button titled "Guide" that reopens the walkthrough `[Implemented]` `src/pages/Quotes.jsx:26,52`
- Second surface: the Dashboard widget with registry id `quote` and title "Daily Quote", default position 8 of 8 `[Implemented]` `src/pages/Dashboard.jsx:30,41` (registry owned by `20-features/dashboard/spec.md` §4)
- No other page deep-links to `/quotes` `[Implemented]` (repository search of `src/` for `"/quotes"` finds only the router and the sidebar)

## 1. Purpose & user benefit

One quote per day, paired with the account owner's written reflection, kept as a dated history with favourites.

User Manual, "Daily Quotes" (`src/pages/UserManual.jsx:322-338`) `[Described]`:

> A space for daily inspiration and personal reflection.
> - Each day, an **AI-generated motivational quote** is displayed automatically.
> - Click **"New Quote"** to generate a fresh quote for today.
> - Write a **personal reflection** in the text area below the quote and save it.
> - **Favorite a quote** by clicking the heart icon — favorited quotes appear in a separate section.
> - Past quotes are saved in **Quote History** — scroll down to browse previous days.
> - **Delete** individual quotes from your history using the trash icon.
> - **Export reflections** via print or email using the icons in the widget header.

Landing page, "Daily Reflection" (`src/pages/LandingPage.jsx:13`) `[Described]`:

> Start each day with an inspiring AI-generated quote, personal affirmations, and vision-focused slideshows.

Onboarding step 2 (`src/pages/Quotes.jsx:18`) `[Described]`: "Over time, reflections become a meaningful journal of your personal growth."

The "AI-generated" wording versus the external-source-first pipeline is logged as D-304 in `ai-services.md`.

## 2. Concepts & vocabulary

- **daily quote** — glossary: the one quote per user per date, with optional reflection. The UI labels it "Daily Quote" (widget) and "Today's Quote" is not used as a label; the page shows the quote in a hero block without a heading `[Implemented]` `src/pages/Quotes.jsx:219-234`.
- **reflection** — glossary: the user's written response to a daily quote. UI label "Today's Reflection" `[Implemented]` `src/pages/Quotes.jsx:237`.
- **favourite** (feature-local) — the `is_favorite` flag on a daily quote; the UI shows "Favorite" / "Favorited" `[Implemented]` `src/pages/Quotes.jsx:231`.
- **past quotes** (feature-local) — the up-to-50 most recent daily quotes listed under "Past Quotes"; the manual calls the same list "Quote History" (D-901).
- **today** — glossary; formatter A of AR-TIME-01 (device local date) `[Implemented]` `src/pages/Quotes.jsx:37-40`, `src/components/dashboard/DashboardQuote.jsx:7-10`.
- **walkthrough** — glossary; "Welcome to Daily Quotes" `[Implemented]` `src/pages/Quotes.jsx:309`.

## 3. User stories

- **US-QUOTE-01** As the account owner, I want a quote waiting for me each day so that I start the day with something to think about. `[Implemented]` `src/pages/Quotes.jsx:65-79`, `base44/functions/generateDailyQuotes/entry.ts:28-90`
- **US-QUOTE-02** As the account owner, I want to ask for a different quote when today's does not speak to me. `[Implemented]` `src/pages/Quotes.jsx:88-106,226-228`
- **US-QUOTE-03** As the account owner, I want to write and save a reflection tied to today's quote so that it becomes a journal over time. `[Implemented]` `src/pages/Quotes.jsx:108-118,237-256`
- **US-QUOTE-04** As the account owner, I want to favourite quotes and see them collected in one place. `[Implemented]` `src/pages/Quotes.jsx:120-148,258-285`
- **US-QUOTE-05** As the account owner, I want to email or print a quote with its reflection so that I can keep a copy. `[Implemented]` `src/pages/Quotes.jsx:150-168,182-195`
- **US-QUOTE-06** As the account owner, I want to browse and prune my past quotes, singly or all at once, keeping favourites if I choose. `[Implemented]` `src/pages/Quotes.jsx:170-180,287-303,313-351`
- **US-QUOTE-07** As the account owner, I want today's quote on the dashboard with the same New Quote and favourite controls. `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:97-112`
- **US-QUOTE-08** As a first-time visitor, I want a short walkthrough of the page that I can dismiss for good and reopen from a Guide button. `[Implemented]` `src/pages/Quotes.jsx:16-21,26,42-52,305-311`

## 4. Capabilities & interactions

### Page load

- On mount the page invokes `fetchDailyQuote` with `{ date: today, force: false }` and races it against a 15-second timer; if the result carries a quote it becomes today's quote and its saved reflection fills the editor. It then lists `DailyQuote` sorted `-date`, limit 50, as the past quotes. `[Implemented]` `src/pages/Quotes.jsx:65-86`
- While loading with no quote yet, the page shows a spinner and "Loading your quote..." `[Implemented]` `src/pages/Quotes.jsx:197-204`
- If loading ends with no quote (timeout, a rejected function call, or a result without `quote`), the page shows "Could not load quote." and an outline button "Try Again" that repeats the load with `force: false` `[Implemented]` `src/pages/Quotes.jsx:206-215`
- The page reloads itself (`window.location.reload()`) when a 60-second check finds the local date has changed since the page opened `[Implemented]` `src/pages/Quotes.jsx:54-63`
- The function itself: returns the newest existing row for the date (deleting duplicates) or fetches a new quote from quotable.io with a model fallback; see `ai-services.md` §8a (AR-AI-05, AR-AI-06) `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:15-84`

### Today's quote (hero block)

- Shows the quote text in quotation marks and the author prefixed with an em dash `[Implemented]` `src/pages/Quotes.jsx:220-224`
- **New Quote** (outline button, refresh icon; icon spins and the button is disabled while loading): clears today's quote, invokes `fetchDailyQuote` with `{ date: today, force: true, _t: <timestamp> }`, then re-lists the 50 newest past quotes, takes the row matching the returned id (or the returned object), and fills the reflection editor from it `[Implemented]` `src/pages/Quotes.jsx:88-106,226-228`. Forcing deletes every existing row for today before creating the new one (`ai-services.md` AR-AI-05) `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:30-33`
- **Favorite / Favorited** (outline button, heart icon; filled red when favourited): toggles `is_favorite` on today's quote as described under Favouriting `[Implemented]` `src/pages/Quotes.jsx:229-232`
- Both buttons are hidden from print output (`no-print`) `[Implemented]` `src/pages/Quotes.jsx:225`

### Reflection ("Today's Reflection" card)

- A textarea with placeholder "What does this quote mean to you today? How can you apply it..." and a full-width "Save" button `[Implemented]` `src/pages/Quotes.jsx:248-254`
- **Save**: if today's quote has an id, updates that row's `reflection`; otherwise creates a `DailyQuote` with `{ quote, author, date: today, reflection }` and adopts the created row as today's quote. Nothing happens when there is no today's quote. No confirmation is shown. `[Implemented]` `src/pages/Quotes.jsx:108-118`
- Card header buttons: "Email reflection" (mail icon) and "Print reflection" (printer icon), both hidden from print `[Implemented]` `src/pages/Quotes.jsx:237-246`

### Favouriting

- On today's quote and on each Past Quotes row, the heart toggles `is_favorite` `[Implemented]` `src/pages/Quotes.jsx:120-148,229-232,335-337`
- **Save before favourite**: if the quote has no id, a `DailyQuote` is created with `{ quote, author, date: today, is_favorite: true }`, becomes today's quote, and is prepended to the past quotes; the toggle then ends `[Implemented]` `src/pages/Quotes.jsx:124-136`
- **Optimistic update with rollback**: today's quote and the matching past row flip immediately; the row is then updated; on failure both flip back `[Implemented]` `src/pages/Quotes.jsx:138-147`
- Rows in the "Favorited Quotes" section carry no heart; they offer email and print only `[Implemented]` `src/pages/Quotes.jsx:272-279` (D-905)

### Email

- Available for today's quote (card header) and for every favourited and past row ("Email quote") `[Implemented]` `src/pages/Quotes.jsx:239-241,273-275,338-340`
- Recipient is the signed-in user's own email (`export-print-email.md` AR-EXPORT-01); no address is asked for `[Implemented]` `src/pages/Quotes.jsx:151-155`. State for an email-address dialog exists and is never rendered `[Partial]` `src/pages/Quotes.jsx:31-33`
- Subject: `Daily Reflection — {date}` where `{date}` is the quote's `date`, or today formatted "MMMM d, yyyy" when the quote has none `[Implemented]` `src/pages/Quotes.jsx:156`
- Body structure, in order (see §12 for the verbatim headings): heading "Daily Reflection"; the quote in quotation marks as a block quote; "— {author}"; a horizontal rule; heading "My Reflection"; the reflection text or "No reflection written."; the date line (quote `date`, or today as "EEEE, MMMM d, yyyy") `[Implemented]` `src/pages/Quotes.jsx:157-165`
- For today's quote the reflection text is whatever is in the editor, saved or not; for other rows it is the saved reflection `[Implemented]` `src/pages/Quotes.jsx:152`
- No confirmation after sending (`export-print-email.md` AR-EXPORT-03) `[Implemented]` `src/pages/Quotes.jsx:167`

### Print

- Available in the same three places as email ("Print reflection" / "Print quote") `[Implemented]` `src/pages/Quotes.jsx:242-244,276-278,341-343`
- Opens a blank window titled "Daily Reflection", writes the same structure as the email (heading, block quote, right-aligned author, rule, "My Reflection", text or "No reflection written.", date line), closes the document and requests the print dialog `[Implemented]` `src/pages/Quotes.jsx:182-195`
- For today's quote the reflection printed is the editor's current text `[Implemented]` `src/pages/Quotes.jsx:242`

### Favorited Quotes section

- Rendered only when at least one past quote is favourited; card title "Favorited Quotes"; placed above the Delete-all dialog and the Past Quotes card, below the reflection card `[Implemented]` `src/pages/Quotes.jsx:258-285`
- Each row: quote in quotation marks, "— {author} · {date}", the saved reflection under a bold "Reflection:" label when present, then email and print buttons `[Implemented]` `src/pages/Quotes.jsx:263-279`
- Each row is a swipeable list item whose delete goes through the shared confirm dialog ("Delete Item?" / "This action cannot be undone." / Cancel / Delete, `shared-interactions.md` AR-UI-01, AR-UI-02) and then deletes that row `[Implemented]` `src/pages/Quotes.jsx:263`, `src/components/SwipeableListItem.jsx:46-54,123-138`

### Past Quotes section

- Card title "Past Quotes"; content area scrolls vertically with a fixed maximum height `[Implemented]` `src/pages/Quotes.jsx:314,319`
- Lists the 50 newest rows by `date` descending, favourited or not, with the same row layout as above plus a heart button before email and print `[Implemented]` `src/pages/Quotes.jsx:79,323-348`
- Rows are swipeable list items with the shared confirm-then-delete binding `[Implemented]` `src/pages/Quotes.jsx:324`
- Header right slot (only when at least one past quote exists): a small "X" button titled "Delete past quotes" that opens the Delete-all dialog. The button is styled to appear on hover of a `group` ancestor; neither the card nor the page declares one `[Partial]` `src/pages/Quotes.jsx:314-318`, `src/components/WidgetCard.jsx:30-41` (Q-900)
- Deleting a single row removes it from the list without reloading; today's hero block is not refreshed even if the deleted row is today's `[Implemented]` `src/pages/Quotes.jsx:170-173`

### Delete-all dialog

- Title "Delete Past Quotes"; prompt "What would you like to delete?"; two buttons: outline "Without Favorites" and destructive "All Including Favorites" `[Implemented]` `src/pages/Quotes.jsx:287-303`
- "Without Favorites" deletes every listed past quote whose `is_favorite` is false; "All Including Favorites" deletes every listed past quote. Deletion is per row in parallel; the list is filtered locally and the dialog closes `[Implemented]` `src/pages/Quotes.jsx:175-180`
- Scope is the loaded list (up to 50 rows), not the whole history `[Implemented]` `src/pages/Quotes.jsx:79,176`

### Dashboard widget (`DashboardQuote`)

- Waits until authentication has resolved; unauthenticated visitors get no quote and no call `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:18-26`
- **Load-or-fetch**: reads `DailyQuote.filter({ date: today })` first and shows the first match; only when none exists does it invoke `fetchDailyQuote` with `{ date: today, force: false }` (no client timeout) `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:28-58`
- Display: quote in quotation marks, "— {author}", then ghost buttons "New Quote" (refresh icon, disabled while loading) and "Favorite" / "Favorited" (heart, filled red when favourited) `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:97-112`
- **New Quote**: clears the quote and invokes the function with `force: true` `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:31,44,104-106`
- **Heart**: flips `is_favorite` locally and updates the row; ignored when the quote has no id; no rollback `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:60-65` (D-902)
- Loading: a small spinner `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:67-73`
- Failure: the message text in red (the thrown message, or "No quote returned" when the function answers without a quote, or "Failed to load quote" when the rejection carries no message) and a ghost "Try Again" button that invokes with `force: true` `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:46-55,75-84` (D-904)
- Empty: "No quote for today yet." with a ghost "Generate Quote" button that runs the load-or-fetch path; reachable when loading finished without a quote and without a failure message (the unauthenticated case) `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:21-24,86-95`
- The widget does not show or edit the reflection `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:97-112`

### 4a. Keyboard & pointer

- Enter/Escape: none bound on the page; the Delete-all and walkthrough dialogs close on Escape or overlay click via the dialog primitive `[Implemented]` `src/pages/Quotes.jsx:288,305-307`
- Long-press (touch) or hover (pointer) on a favourited or past row reveals the delete "X" (AR-UI-01) `[Implemented]` `src/pages/Quotes.jsx:263,324`
- Hover: the Past Quotes "Delete past quotes" button is hover-revealed in intent (see the `[Partial]` bullet above) `src/pages/Quotes.jsx:315`
- Double-click, drag-and-drop, swipe gestures on rows: none observed `[Implemented]` `src/pages/Quotes.jsx:217-353`

### 4b. View state & persistence

| Control | Values | Default | Scope (memory / device `key` / account `Entity.field`) |
|---|---|---|---|
| Reflection editor text | free text | today's saved `reflection` or `""` | memory until Save → account `DailyQuote.reflection` `src/pages/Quotes.jsx:28,77,111,114` |
| Today's quote | object | result of `fetchDailyQuote` | memory; row in account `DailyQuote` `src/pages/Quotes.jsx:27,76` |
| Past quotes list | up to 50 rows | `DailyQuote.list("-date", 50)` | memory `src/pages/Quotes.jsx:29,79` |
| Delete-all dialog open | true/false | false | memory `src/pages/Quotes.jsx:34` |
| Walkthrough open | true/false | per §9 trigger | memory; dismissal in device `quotes_onboarded` + account `ThemeSettings.onboarding_status` `src/pages/Quotes.jsx:35,42-50,308` |
| Dashboard widget quote | object | first row for today, else function result | memory `src/components/dashboard/DashboardQuote.jsx:14` |

### 4c. Empty & fallback states

- Page, loading: "Loading your quote..." `[Implemented]` `src/pages/Quotes.jsx:201`
- Page, no quote: "Could not load quote." + "Try Again" `[Implemented]` `src/pages/Quotes.jsx:209-212`
- Past Quotes, none: "No past quotes yet" `[Implemented]` `src/pages/Quotes.jsx:321`
- Favorited Quotes: the card is absent rather than empty `[Implemented]` `src/pages/Quotes.jsx:259`
- Email/print, no reflection: "No reflection written." `[Implemented]` `src/pages/Quotes.jsx:163,190`
- Widget, failure: the message text + "Try Again" `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:75-84`
- Widget, empty: "No quote for today yet." + "Generate Quote" `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:86-95`

## 5. Business rules

- **BR-QUOTE-01** One daily quote per account per date. Reading for a date returns the newest row and removes extras; forcing removes all rows for the date and creates one. `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:19-33,77-82` (canonical: `ai-services.md` AR-AI-05)
- **BR-QUOTE-02** A quote's text is never repeated within the account's 200 most recent quotes (compared trimmed and lower-cased); the external source is tried up to 8 times before the model. `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:15-17,35-71` (canonical: AR-AI-06, AR-AI-09)
- **BR-QUOTE-03** "Today" on both client surfaces is the device's local date (AR-TIME-01 formatter A); the scheduled generator stamps the server date (formatter D). `[Implemented]` `src/pages/Quotes.jsx:37-40`, `src/components/dashboard/DashboardQuote.jsx:7-10`, `base44/functions/generateDailyQuotes/entry.ts:20` (D-213 / D-302)
- **BR-QUOTE-04** The page waits at most 15 seconds for today's quote; after that it offers "Try Again". The widget applies no client timeout. `[Implemented]` `src/pages/Quotes.jsx:68-73`, `src/components/dashboard/DashboardQuote.jsx:43-44` (D-903)
- **BR-QUOTE-05** The page reloads when the local date rolls over, checked every 60 seconds. `[Implemented]` `src/pages/Quotes.jsx:54-63`
- **BR-QUOTE-06** Saving a reflection updates the existing row, or creates the row when today's quote has no id. `[Implemented]` `src/pages/Quotes.jsx:108-118`
- **BR-QUOTE-07** Favouriting a quote that has no id first saves it with `is_favorite: true`; favouriting a saved quote is optimistic and rolled back on failure (page) or optimistic without rollback (widget). `[Implemented]` `src/pages/Quotes.jsx:120-148`, `src/components/dashboard/DashboardQuote.jsx:60-65` (D-902)
- **BR-QUOTE-08** Email always goes to the signed-in user's address and includes the quote, author, reflection (or "No reflection written."), and date. `[Implemented]` `src/pages/Quotes.jsx:150-166`
- **BR-QUOTE-09** For today's quote, email and print use the editor's current text, saved or not; for any other row, the saved reflection. `[Implemented]` `src/pages/Quotes.jsx:152,242,276,341`
- **BR-QUOTE-10** The history shows the 50 newest rows by date; favourites appear both in "Favorited Quotes" and in "Past Quotes". `[Implemented]` `src/pages/Quotes.jsx:79,262,323`
- **BR-QUOTE-11** Deleting all past quotes acts on the loaded rows and either spares favourites or includes them, per the button chosen. `[Implemented]` `src/pages/Quotes.jsx:175-180,295-300`
- **BR-QUOTE-12** Single-row deletion always passes through the shared "Delete Item?" confirmation. `[Implemented]` `src/pages/Quotes.jsx:263,324`, `src/components/SwipeableListItem.jsx:46-54,123-138`
- **BR-QUOTE-13** "New Quote" on either surface discards today's row(s) and creates a new one; any reflection saved on the discarded row goes with it. `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:30-33,77-82`, `src/pages/Quotes.jsx:92`, `src/components/dashboard/DashboardQuote.jsx:44`
- **BR-QUOTE-14** The scheduled job pre-creates today's quote for every user who lacks one, at 07:00 UTC. `[Implemented]` `base44/workflows/Midnight Daily Quote Generator.jsonc:2-10`, `base44/functions/generateDailyQuotes/entry.ts:28-34,80-89` (canonical: `automations.md` AR-AUTO-03, AR-AUTO-05)
- **BR-QUOTE-15** Daily quotes are removed by the Settings "Delete All App Data" wipe and by account deletion. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:56`, `base44/functions/deleteUserAccount/entry.ts:64-66`

### 5a. State & lifecycle

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| no row for today | page open / widget open with no row / 07:00 UTC job | row `{ quote, author, date, is_favorite: false }` | duplicates for the date deleted `base44/functions/fetchDailyQuote/entry.ts:22-28,77-82` |
| row for today | "New Quote" (force) | all rows for today deleted; new row created | reflection editor refilled from the new row `src/pages/Quotes.jsx:92-99` |
| `is_favorite: false` | heart | `is_favorite: true` | optimistic flip; page rolls back on failure `src/pages/Quotes.jsx:138-147` |
| `is_favorite: true` | heart | `is_favorite: false` | as above |
| quote object without id | Save (reflection) or heart | row created | becomes today's quote `src/pages/Quotes.jsx:113-115,125-131` |
| `reflection` any | Save | `reflection` = editor text | none `src/pages/Quotes.jsx:110-112` |
| row | row delete (confirmed) | hard-deleted | removed from list `src/pages/Quotes.jsx:170-173` |
| rows loaded | "Without Favorites" / "All Including Favorites" | matching rows hard-deleted | dialog closes `src/pages/Quotes.jsx:175-180` |

### 5b. Time & date semantics

- "Today" = device local `YYYY-MM-DD` (AR-TIME-01 formatter A) `[Implemented]` `src/pages/Quotes.jsx:37-40`, `src/components/dashboard/DashboardQuote.jsx:7-10`
- Rollover check compares formatter B (date-fns) against formatter A every 60 s `[Implemented]` `src/pages/Quotes.jsx:56-61`
- Email subject fallback "MMMM d, yyyy" and body/print fallback "EEEE, MMMM d, yyyy" apply only when the quote object has no `date` `[Implemented]` `src/pages/Quotes.jsx:156,164,191`
- Divergence between device date and the job's server date: D-213 (`automations.md`), D-302 (`ai-services.md`). No new divergence opened here.

## 6. Data

- Owned entity: `DailyQuote` (`quote`, `author`, `date`, `reflection`, `is_favorite`); full field sheet in `10-architecture/data-model/quotes-links.md` (E-DailyQuote).
- Page reads: `DailyQuote.list("-date", 50)` `[Implemented]` `src/pages/Quotes.jsx:79,95`. Widget reads: `DailyQuote.filter({ date: today })` `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:36`.
- Page writes: `create` `src/pages/Quotes.jsx:114,127`; `update` (reflection, is_favorite) `src/pages/Quotes.jsx:111,142`; `delete` `src/pages/Quotes.jsx:171,177` `[Implemented]`. Widget writes: `update` (is_favorite) `src/components/dashboard/DashboardQuote.jsx:64` `[Implemented]`.
- Referenced: `ThemeSettings.onboarding_status` (read on page open; written by the walkthrough dismiss) `[Implemented]` `src/pages/Quotes.jsx:44-48`, `src/components/GenericOnboardingDialog.jsx:10-23`.
- Backend function calls: `fetchDailyQuote { date, force }` (page adds `_t` on force) `[Implemented]` `src/pages/Quotes.jsx:71,92`, `src/components/dashboard/DashboardQuote.jsx:44`.
- Integrations: `Core.SendEmail { to, subject, body }` `[Implemented]` `src/pages/Quotes.jsx:154-166`; `auth.me()` for the recipient `[Implemented]` `src/pages/Quotes.jsx:151`.

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| out | Dashboard | `DashboardQuote` mounted from the widget registry as id `quote`, "Daily Quote" | `src/pages/Dashboard.jsx:14,30,41` |
| in | Automations | 07:00 UTC workflow pre-creates today's row | `base44/workflows/Midnight Daily Quote Generator.jsonc:2-10`, `base44/functions/generateDailyQuotes/entry.ts` |
| in | AI services | quotable.io then model fallback inside `fetchDailyQuote` | `base44/functions/fetchDailyQuote/entry.ts:35-71` |
| out | Export (print/email) | hand-built HTML, tier C of `export-print-email.md` §3c | `src/pages/Quotes.jsx:150-168,182-195` |
| in | Settings | "Delete All App Data" removes `DailyQuote` rows | `base44/functions/deleteSyncedData/entry.ts:56` |
| in | Onboarding registry | key `quotes_onboarded`, generation 2 | `src/pages/Quotes.jsx:42-50,308`, `preferences.md` Part C |
| in | Shared interactions | swipeable rows with confirm dialog; header title and right slot | `src/pages/Quotes.jsx:25-26,263,324` |

No deep links with query parameters in or out `[Implemented]` `src/pages/Quotes.jsx:1-353`.

### 7a. Feedback & notifications

- Toasts: none `[Implemented]` `src/pages/Quotes.jsx:1-14` (no toast import)
- Alerts: none; email send and reflection save are silent `[Implemented]` `src/pages/Quotes.jsx:117,167`
- Confirm dialogs: shared "Delete Item?" on row delete `[Implemented]` `src/pages/Quotes.jsx:263,324`; "Delete Past Quotes" dialog for bulk delete `[Implemented]` `src/pages/Quotes.jsx:287-303`
- Button label feedback: "Favorite" ↔ "Favorited" with the heart filled red `[Implemented]` `src/pages/Quotes.jsx:230-231`, `src/components/dashboard/DashboardQuote.jsx:108-109`; refresh icon spins while loading `[Implemented]` `src/pages/Quotes.jsx:227`
- Console-only reporting on load, generate, favourite, and save-first failures `[Implemented]` `src/pages/Quotes.jsx:82,102,133,144`, `src/components/dashboard/DashboardQuote.jsx:53`
- Celebratory effects, reminders: none observed

## 8. AI & automation

- The daily quote pipeline (external source first, model fallback with the verbatim prompt, response schema `{ quote, author }`) is specified in `10-architecture/ai-services.md` §8 (touchpoint 7, AR-AI-05, AR-AI-06, AR-AI-11) `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:35-84`
- The midnight job "Midnight Daily Quote Generator" (`0 7 * * *` UTC, described as "Generates a new daily quote for all users at midnight Pacific time (07:00 UTC)") is specified in `10-architecture/automations.md` §2a (AR-AUTO-03 to AR-AUTO-06) `[Implemented]` `base44/workflows/Midnight Daily Quote Generator.jsonc:2-10`
- User-facing effect: when the account owner opens the dashboard or the Quotes page after the job has run, today's quote is already stored and no generation wait occurs; otherwise the first open generates it `[Implemented]` `src/components/dashboard/DashboardQuote.jsx:34-44`, `base44/functions/fetchDailyQuote/entry.ts:20-28`
- Described claims: "AI-generated motivational quote" `[Described]` `src/pages/UserManual.jsx:330`; "inspiring AI-generated quote" `[Described]` `src/pages/LandingPage.jsx:13`; "generated automatically every day at midnight" `[Described]` `src/pages/Quotes.jsx:17` (D-304, D-213)

## 9. Onboarding content

Dialog title "Welcome to Daily Quotes"; subtitle from the shared dialog "Here's how to get the most out of this page — it only takes a minute!"; single button "Got it — Don't Remind Me Again" `[Implemented]` `src/pages/Quotes.jsx:305-311`, `src/components/GenericOnboardingDialog.jsx:36-39,53-55`

Steps verbatim `[Implemented]` `src/pages/Quotes.jsx:16-21`:

1. **1. Get Your Daily Quote** — "A fresh inspirational quote is generated automatically every day at midnight. Click 'New Quote' anytime if you'd like a different one. Each quote is saved with the date so you can look back on past quotes anytime."
2. **2. Write a Reflection** — "Use the reflection area to write how the quote connects to your day or life goals. Save it and it'll be permanently linked to that quote. Over time, reflections become a meaningful journal of your personal growth."
3. **3. Save Your Favorites** — "Click the heart icon on any quote to mark it as a favorite. Favorited quotes appear in their own section at the top of the page so you can revisit them whenever you need a boost of inspiration or clarity."
4. **4. Share & Print** — "Use the email button to send the quote and your reflection to yourself or others. Use the print button for a physical copy to keep in a journal. Both include the full quote text and your personal reflection."

- Dismissal key: `quotes_onboarded`; persistence generation 2 (account map `ThemeSettings.onboarding_status[quotes_onboarded] = true` plus device mirror `"true"`) `[Implemented]` `src/pages/Quotes.jsx:308`, `src/components/GenericOnboardingDialog.jsx:6-27`
- Trigger: device key `"true"` → do not show; else read the newest `ThemeSettings`; no row → show; row without the key → show; row with the key → write the device mirror and do not show; read failure → show (`preferences.md` AR-PREF-33) `[Implemented]` `src/pages/Quotes.jsx:42-50`
- Closing via overlay or Escape closes without recording dismissal `[Implemented]` `src/components/GenericOnboardingDialog.jsx:31-33`
- "Guide" header button reopens the dialog without touching persistence `[Implemented]` `src/pages/Quotes.jsx:26,52`
- Step 3's "any quote" versus the favourited-section rows: D-905. Step 4's "or others": D-315 (`export-print-email.md`). Step 1's "midnight": D-213.

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `quotes_onboarded` | walkthrough dismissed (mirror of the account map) | absent → consult account | `"true"` on dismiss `src/components/GenericOnboardingDialog.jsx:23`; `"true"` on trigger when the account map has the key `src/pages/Quotes.jsx:48` | never |

No other device-local keys are read or written by the owned sources `[Implemented]` `src/pages/Quotes.jsx:43,48`, `src/components/dashboard/DashboardQuote.jsx:1-113`.

## 11. Seed / hardcoded data used

- Quote source endpoint, attempt count, no-repeat window (200), model prompt exclusion window (20), page list limit (50), 15-second timeout: `10-architecture/data-model/seed-data.md` §13 `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:16,38,41,58`, `src/pages/Quotes.jsx:69,79`
- Rollover interval 60 000 ms `[Implemented]` `src/pages/Quotes.jsx:61`
- Email/print fixed strings: "Daily Reflection", "My Reflection", "No reflection written." `[Implemented]` `src/pages/Quotes.jsx:156,158,162-163,184-190`
- Onboarding steps (§9) `[Implemented]` `src/pages/Quotes.jsx:16-21`

## 12. Print / email formats

Mechanism: tier C (hand-assembled HTML) of `10-architecture/export-print-email.md` §3c. No options dialog; no remembered inputs `[Implemented]` `src/pages/Quotes.jsx:150-195`.

Included, in order (headings verbatim) `[Implemented]` `src/pages/Quotes.jsx:157-165,184-192`:

1. Heading "Daily Reflection"
2. Block quote: `"{quote}"`
3. `— {author}` (right-aligned)
4. Horizontal rule
5. Heading "My Reflection"
6. `{reflection}` with line breaks preserved, or "No reflection written."
7. `{date}` (the quote's `date`, else today as "EEEE, MMMM d, yyyy")

Excluded: favourite state, other quotes, the reflection of any other day `[Implemented]` `src/pages/Quotes.jsx:157-165`.

Email subject: `Daily Reflection — {date}` (fallback "MMMM d, yyyy") `[Implemented]` `src/pages/Quotes.jsx:156`. Print window title: "Daily Reflection" `[Implemented]` `src/pages/Quotes.jsx:184`.

Triggers: "Email reflection" / "Print reflection" (today's card header), "Email quote" / "Print quote" (favourited and past rows) `[Implemented]` `src/pages/Quotes.jsx:239-244,273-278,338-343`.

## 13. Acceptance criteria

- **AC-QUOTE-01** Given no `DailyQuote` exists for today's local date, When the Quotes page opens, Then within 15 seconds a quote and author are shown and a row for today exists with `is_favorite: false`. (refs BR-QUOTE-01, BR-QUOTE-04)
- **AC-QUOTE-02** Given `fetchDailyQuote` has not answered after 15 seconds, When the page is still waiting, Then "Could not load quote." and "Try Again" are shown, and pressing "Try Again" repeats the load with `force: false`. (refs BR-QUOTE-04)
- **AC-QUOTE-03** Given today's quote is shown with a saved reflection, When "New Quote" is pressed, Then the previous row for today is deleted, a new row with different text is shown, and the reflection editor shows the new row's reflection (empty). (refs BR-QUOTE-13, BR-QUOTE-02)
- **AC-QUOTE-04** Given today's quote has an id, When text is typed and "Save" is pressed, Then the row's `reflection` equals the typed text. (refs BR-QUOTE-06)
- **AC-QUOTE-05** Given today's quote object has no id, When the heart is pressed, Then a row is created with `is_favorite: true` and appears at the top of Past Quotes. (refs BR-QUOTE-07)
- **AC-QUOTE-06** Given a saved past quote with `is_favorite: false`, When its heart is pressed and the update fails, Then the heart returns to unfilled and the row's stored value is unchanged. (refs BR-QUOTE-07)
- **AC-QUOTE-07** Given at least one past quote is favourited, When the page renders, Then a "Favorited Quotes" card appears above "Past Quotes" listing only favourited rows, each with email and print buttons and no heart. (refs BR-QUOTE-10)
- **AC-QUOTE-08** Given the reflection editor contains unsaved text, When "Email reflection" is pressed, Then an email is sent to the signed-in user's address with subject "Daily Reflection — {today's quote date}" and a body containing the unsaved text under "My Reflection". (refs BR-QUOTE-08, BR-QUOTE-09)
- **AC-QUOTE-09** Given a past quote with no reflection, When "Print quote" is pressed, Then the print document contains "My Reflection" followed by "No reflection written." (refs BR-QUOTE-09)
- **AC-QUOTE-10** Given 3 past quotes of which 1 is favourited, When "Delete past quotes" → "Without Favorites" is chosen, Then 2 rows are deleted and the favourited row remains in both sections. (refs BR-QUOTE-11)
- **AC-QUOTE-11** Given the same 3 rows, When "All Including Favorites" is chosen, Then all 3 rows are deleted and "No past quotes yet" is shown. (refs BR-QUOTE-11)
- **AC-QUOTE-12** Given a past row, When its delete "X" is pressed, Then "Delete Item?" appears and the row is deleted only after "Delete". (refs BR-QUOTE-12)
- **AC-QUOTE-13** Given the page has been open across local midnight, When the next 60-second check runs, Then the page reloads. (refs BR-QUOTE-05)
- **AC-QUOTE-14** Given a `DailyQuote` row exists for today's local date, When the dashboard opens, Then the widget shows that row without invoking `fetchDailyQuote`. (refs BR-QUOTE-01)
- **AC-QUOTE-15** Given no row exists for today, When the dashboard opens, Then the widget invokes `fetchDailyQuote` with `force: false` and shows the result. (refs BR-QUOTE-01)
- **AC-QUOTE-16** Given the widget shows a quote, When "New Quote" is pressed, Then `fetchDailyQuote` is invoked with `force: true` and the new quote replaces the old. (refs BR-QUOTE-13)
- **AC-QUOTE-17** Given the widget's function call fails, When the failure state shows, Then the message text and "Try Again" are displayed and "Try Again" invokes with `force: true`. (refs BR-QUOTE-04)
- **AC-QUOTE-18** Given the device key `quotes_onboarded` is absent and no `ThemeSettings` row exists, When the page opens, Then "Welcome to Daily Quotes" is shown; When "Got it — Don't Remind Me Again" is pressed, Then a `ThemeSettings` row exists with `onboarding_status` containing `quotes_onboarded: true` and the device key is `"true"`. (refs §9)
- **AC-QUOTE-19** Given the walkthrough was dismissed, When "Guide" in the header is pressed, Then the walkthrough reopens and closing it by overlay leaves persistence unchanged. (refs §9)
- **AC-QUOTE-20** Given 60 rows exist, When the page loads, Then Past Quotes lists the 50 newest by date and "All Including Favorites" deletes at most those 50. (refs BR-QUOTE-10, BR-QUOTE-11)

## 14. Discrepancies & open questions

- **D-900** The manual says single quotes are deleted "using the trash icon" (`src/pages/UserManual.jsx:335`); the page deletes rows through the swipeable row's hover/long-press "X" and the "Delete Item?" confirmation (`src/pages/Quotes.jsx:263,324`, `src/components/SwipeableListItem.jsx:46-54`).
- **D-901** The manual names the history "Quote History" (`src/pages/UserManual.jsx:334`); the page card is titled "Past Quotes" (`src/pages/Quotes.jsx:314`).
- **D-902** Favouriting on the page is optimistic with rollback and saves an id-less quote first (`src/pages/Quotes.jsx:120-148`); favouriting in the dashboard widget is optimistic without rollback and ignores an id-less quote (`src/components/dashboard/DashboardQuote.jsx:60-65`).
- **D-903** Loading today's quote: the page always invokes `fetchDailyQuote` under a 15-second timeout (`src/pages/Quotes.jsx:68-73`); the widget reads the stored row first, invokes only when none exists, and applies no timeout (`src/components/dashboard/DashboardQuote.jsx:34-44`).
- **D-904** "Try Again" on the page repeats the load with `force: false` (`src/pages/Quotes.jsx:210`); "Try Again" in the widget invokes with `force: true`, which deletes any row for today before regenerating (`src/components/dashboard/DashboardQuote.jsx:79`, `base44/functions/fetchDailyQuote/entry.ts:30-33`).
- **D-905** Onboarding step 3 says "Click the heart icon on any quote" (`src/pages/Quotes.jsx:19`); rows in the "Favorited Quotes" section have no heart (`src/pages/Quotes.jsx:272-279`), only rows in "Past Quotes" do (`src/pages/Quotes.jsx:335-337`).
- Cross-references: D-213 / D-302 (device date vs server date), D-301 (prompt wording), D-304 (AI-generated claim), D-315 (email "or others") are logged in `automations.md`, `ai-services.md`, and `export-print-email.md`.
- **Q-900** Blocks: §4 Past Quotes section. The "Delete past quotes" button is styled to appear on hover of a `group` ancestor (`src/pages/Quotes.jsx:315`), and neither `WidgetCard` (`src/components/WidgetCard.jsx:30-41`) nor the page declares one. Is the button meant to be always visible, or revealed on card hover?
- **Q-901** Blocks: §4 Email. State for an email-address dialog exists and is never rendered (`src/pages/Quotes.jsx:31-33`). Is a recipient prompt intended for quotes, given onboarding step 4 says "to yourself or others"?
