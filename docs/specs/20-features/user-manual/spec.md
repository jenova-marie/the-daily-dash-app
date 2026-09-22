# User Manual — Feature Spec

**Feature code:** `MAN` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 42 · Described 5 · Partial 0

**Sources owned:** `src/pages/UserManual.jsx` (page behaviour, section index, search, Help & Support block)
**Sources referenced (owned elsewhere):** `src/components/Layout.jsx:26` (sidebar entry) → `20-features/app-shell` · `src/lib/HeaderContext.jsx` → `10-architecture/shared-interactions.md` §9 · the manual's *content* is not restated here; each feature spec quotes the passages about its own feature as `[Described]`, and the claims audit lives in `90-traceability/`

**Permissions:** none; the manual is static text visible to any signed-in account owner. Admin-only operations: none.

## 0. Entry points & navigation

- Route: `/manual` · Sidebar label: "User Manual" (icon `BookOpen`) · Header title text: "User Manual" · Position in swipe order: 14 of 14 (last; a left swipe wraps to Dashboard) `[Implemented]` `src/App.jsx:214`, `src/components/Layout.jsx:26`, `src/pages/UserManual.jsx:468`
- Query parameters accepted: none `[Implemented]` `src/pages/UserManual.jsx:466-469`
- Feature-toggle gating: none; the entry is always shown `[Implemented]` `src/components/Layout.jsx:189-194`
- Header right-slot contents: none (no "Guide" button; the manual has no walkthrough) `[Implemented]` `src/pages/UserManual.jsx:466-469`
- In-manual cross-references to other pages are plain text, not links (for example "Access this guide anytime via the Guide button on the Daily Checklist page.") `[Implemented]` `src/pages/UserManual.jsx:81`

## 1. Purpose & user benefit

The manual is the in-app reference: one collapsible section per feature, a search box that narrows the list, and a support contact. Its tagline, verbatim: "Everything you need to know about using Dash it, Dash it ALL!" `[Implemented]` `src/pages/UserManual.jsx:496`.

Its own opening statement of the product, verbatim: "**Dash it, Dash it ALL!** is a personal productivity dashboard designed to keep your whole life organized in one place. It brings together your schedule, tasks, chores, education plans, goals, daily checklist, motivational quotes, and saved links — all with optional Google Calendar and Google Tasks sync." `[Described]` `src/pages/UserManual.jsx:14`.

## 2. Concepts & vocabulary

- **section** (feature-local): one collapsible block of the manual with an id, an icon, a title, and static content.
- **walkthrough** (glossary): referred to in the manual as "guide" and "onboarding walkthrough"; the manual itself has none.
- **account owner** (glossary): the reader.

## 3. User stories

- **US-MAN-01** As an account owner, I want a manual organised by feature so that I can read only the part I need `[Implemented]` `src/pages/UserManual.jsx:6-442,506-509`.
- **US-MAN-02** As an account owner, I want to expand one section at a time so that the page stays short `[Implemented]` `src/pages/UserManual.jsx:444-464`.
- **US-MAN-03** As an account owner, I want to type a word and see only the sections that mention it so that I can find an answer quickly `[Implemented]` `src/pages/UserManual.jsx:469-492,498-504`.
- **US-MAN-04** As an account owner who is stuck, I want a support address I can email so that I can ask for help `[Implemented]` `src/pages/UserManual.jsx:515-532`.

## 4. Capabilities & interactions

### 4.1 Section index

Fourteen sections, in page order. Titles and ids verbatim; all rows `[Implemented]` `src/pages/UserManual.jsx:6-442`.

| # | id | Title | Icon (lucide) | Covers (feature spec) | Citation |
|---|---|---|---|---|---|
| 1 | `overview` | App Overview | `BookOpen` | product statement and sidebar navigation (`20-features/app-shell`) | `src/pages/UserManual.jsx:7-19` |
| 2 | `dashboard` | Dashboard | `LayoutDashboard` | `20-features/dashboard` | `:20-74` |
| 3 | `checklist` | Daily Checklist | `CheckSquare` | `20-features/daily-checklist` | `:75-94` |
| 4 | `tasks` | Tasks | `ListTodo` | `20-features/tasks` | `:95-137` |
| 5 | `calendar` | Calendar | `Calendar` | `20-features/calendar` | `:138-156` |
| 6 | `schedule` | Daily Schedule | `Clock` | `20-features/daily-schedule` | `:157-179` |
| 7 | `chores` | Chores | `Sparkles` | `20-features/chores` | `:180-223` |
| 8 | `education` | Education | `GraduationCap` | `20-features/education` | `:224-272` |
| 9 | `goals` | Goals | `Target` | `20-features/goals` | `:273-321` |
| 10 | `quotes` | Daily Quotes | `Quote` | `20-features/quotes` | `:322-341` |
| 11 | `links` | Link Library | `Library` | `20-features/links` | `:342-359` |
| 12 | `visionboard` | Vision Board | `Eye` | `20-features/vision-board` | `:360-381` |
| 13 | `theme` | Theme Editor | `Palette` | `20-features/theme-editor` | `:382-403` |
| 14 | `settings` | Settings | `Settings` | `20-features/settings`, `10-architecture/auth-and-account.md`, `google-sync.md` | `:404-441` |

- The section order matches the sidebar order except that the manual has no section about itself `[Implemented]` `src/pages/UserManual.jsx:6-442`, `src/components/Layout.jsx:12-27`.
- Each section title carries a colour class; the colour has no meaning beyond decoration and is not recorded `[Implemented]` `src/pages/UserManual.jsx:11,453`.

### 4.2 Collapse and expand

- Every section starts collapsed; the header row is a full-width button showing the icon, the title, and a chevron (right when collapsed, down when expanded) `[Implemented]` `src/pages/UserManual.jsx:444-456`.
- Clicking the header toggles only that section; any number of sections may be open at once `[Implemented]` `src/pages/UserManual.jsx:445,451`.
- The open state lives in memory per section instance; leaving the page, or filtering a section out and back in through search, returns it to collapsed `[Implemented]` `src/pages/UserManual.jsx:445,507-508` (the list is re-keyed by section id and a filtered-out section unmounts).
- Content is shown beneath the header only while expanded `[Implemented]` `src/pages/UserManual.jsx:457-461`.

### 4.3 Search

- A single text input with placeholder "Search sections..." sits between the tagline and the section list `[Implemented]` `src/pages/UserManual.jsx:498-504`.
- **What is searched:** for each section, the section title followed by every string found by walking the content's element tree (string children, arrays of children, and single child elements, joined by spaces), all lower-cased `[Implemented]` `src/pages/UserManual.jsx:472-488`. Text inside attributes (for example link targets) is not included; the section id is not included `[Implemented]` `src/pages/UserManual.jsx:474-487`.
- **Match rule:** a section is listed when its searchable text contains the lower-cased query as a substring; an empty query lists every section `[Implemented]` `src/pages/UserManual.jsx:490-492`.
- Filtering happens on every keystroke; matching sections are not expanded and matched words are not highlighted `[Implemented]` `src/pages/UserManual.jsx:502,507-509`.
- **No-match copy (verbatim):** "No sections match your search." `[Implemented]` `src/pages/UserManual.jsx:510-512`.
- The Help & Support block is always shown, whatever the query `[Implemented]` `src/pages/UserManual.jsx:515-532`.

### 4.4 Help & Support block

Verbatim, in order `[Implemented]` `src/pages/UserManual.jsx:515-532`:

- Header: "💬" "Help & Support"
- "Need help with **The Daily Dash**? We're here for you!"
- "Reach out to us directly via email and we'll get back to you as soon as possible:"
- Button-styled link "✉️ Reaginhouse6@gmail.com" → `mailto:Reaginhouse6@gmail.com` `src/pages/UserManual.jsx:524-529`
- "Please include a description of your issue and any relevant details so we can assist you quickly."

The support address appears nowhere else in the product; the legal pages carry a placeholder instead (`00-overview/legal-copy.md`, D-971).

### 4a. Keyboard & pointer

- Typing in the search input filters immediately; there is no submit action and no clear button beyond deleting the text `[Implemented]` `src/pages/UserManual.jsx:498-504`.
- Section headers are buttons and respond to click and keyboard activation `[Implemented]` `src/pages/UserManual.jsx:449-456`.
- The page participates in the shell's swipe navigation like any other (`20-features/app-shell` §4.4); focus in the search input suppresses the swipe `[Implemented]` `src/components/Layout.jsx:78-79`.

### 4b. View state & persistence

| Control | Values | Default | Scope (memory / device `key` / account `Entity.field`) |
|---|---|---|---|
| Search query | any string | `""` | memory `src/pages/UserManual.jsx:469` |
| Section expanded (×14) | open / closed | closed | memory per section `src/pages/UserManual.jsx:445` |

### 4c. Empty & fallback states

| State | Copy | Citation |
|---|---|---|
| No section matches the query | "No sections match your search." | `[Implemented]` `src/pages/UserManual.jsx:510-512` |

## 5. Business rules

- **BR-MAN-01 — Fourteen fixed sections in sidebar order, none for the manual itself** `[Implemented]` `src/pages/UserManual.jsx:6-442`.
- **BR-MAN-02 — Sections start collapsed and toggle independently** `[Implemented]` `src/pages/UserManual.jsx:445,451`.
- **BR-MAN-03 — Search is a case-insensitive substring match over title plus visible content text** `[Implemented]` `src/pages/UserManual.jsx:472-492`.
- **BR-MAN-04 — Search never hides the Help & Support block** `[Implemented]` `src/pages/UserManual.jsx:506-532`.
- **BR-MAN-05 — The support channel is a single email address** `[Implemented]` `src/pages/UserManual.jsx:525-528`.
- **BR-MAN-06 — The manual publishes only a title to the shell header; no right-slot control** `[Implemented]` `src/pages/UserManual.jsx:467-468`.
- **BR-MAN-07 — The manual names the product "Dash it, Dash it ALL!" in its overview and tagline and "The Daily Dash" in its support block** `[Implemented]` `src/pages/UserManual.jsx:14,496,522` (D-952 in `20-features/app-shell`).

### 5a. State & lifecycle

| State | Trigger | Next state | Side effects | Citation |
|---|---|---|---|---|
| section collapsed | header click | expanded | content rendered | `src/pages/UserManual.jsx:451,457` |
| section expanded | header click | collapsed | content removed | `src/pages/UserManual.jsx:451,457` |
| section expanded | query no longer matches | unmounted | — | `src/pages/UserManual.jsx:490-492,507` |
| section unmounted | query matches again | collapsed (fresh instance) | — | `src/pages/UserManual.jsx:445,508` |
| query `""` | keystroke | filtered list | no-match copy when empty | `src/pages/UserManual.jsx:502,510-512` |

### 5b. Time & date semantics

None. None observed.

## 6. Data

No entity is read or written. The page has no server calls `[Implemented]` `src/pages/UserManual.jsx:1-4,466-535`.

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| Manual → App shell | `20-features/app-shell` §4.3 | publishes the header title "User Manual"; last entry in the swipe ring | `src/pages/UserManual.jsx:468`, `src/components/Layout.jsx:26` |
| Manual → every feature | each `20-features/*` spec §1/§9 and `90-traceability/` | the section content is the `[Described]` source those specs quote and the claims audit checks | `src/pages/UserManual.jsx:6-442` |
| Manual → Onboarding | `20-features/onboarding` | describes the "Guide" button for Daily Checklist and Vision Board | `src/pages/UserManual.jsx:81,368` |
| Manual → Legal copy | `00-overview/legal-copy.md` | supplies the only concrete support address in the product | `src/pages/UserManual.jsx:525-528` |
| Manual → external | mail client | `mailto:` link | `src/pages/UserManual.jsx:525` |

### 7a. Feedback & notifications

None. The page raises no toasts or dialogs. None observed.

## 8. AI & automation

None observed.

## 9. Onboarding content

The manual has no walkthrough and no "Guide" button `[Implemented]` `src/pages/UserManual.jsx:466-469`. It describes the walkthrough controls of other pages: "Access this guide anytime via the Guide button on the Daily Checklist page." `[Described]` `src/pages/UserManual.jsx:81`; "The Guide button re-shows the onboarding walkthrough." `[Described]` `src/pages/UserManual.jsx:368`.

## 10. Device-local preferences

None. The manual writes no localStorage keys `[Implemented]` `src/pages/UserManual.jsx:466-535`.

## 11. Seed / hardcoded data used

- The fourteen section definitions (id, icon, title, content) `[Implemented]` `src/pages/UserManual.jsx:6-442`.
- Tagline, search placeholder, no-match copy, and the Help & Support copy (§1, §4.3, §4.4) `[Implemented]` `src/pages/UserManual.jsx:496,500,511,518-530`.
- Support address `Reaginhouse6@gmail.com` `[Implemented]` `src/pages/UserManual.jsx:525,528`.

## 12. Print / email formats

None of its own. The page has no print or email control; browser printing follows the shell's print rules (`10-architecture/export-print-email.md`). None observed.

## 13. Acceptance criteria

- **AC-MAN-01** Given the manual opens, then fourteen collapsed sections are listed in the order of §4.1 with the titles verbatim, the tagline above them, and the Help & Support block below (refs BR-MAN-01, BR-MAN-04).
- **AC-MAN-02** Given a collapsed section, when its header is clicked, then its content appears and the chevron points down; clicking again hides it; other sections are unaffected (refs BR-MAN-02).
- **AC-MAN-03** Given the query `google tasks`, then only sections whose title or visible text contains that phrase (ignoring case) remain, none of them auto-expanded (refs BR-MAN-03).
- **AC-MAN-04** Given the query `zzzz`, then the list shows only "No sections match your search." and the Help & Support block is still present (refs BR-MAN-03, BR-MAN-04).
- **AC-MAN-05** Given a section was expanded, when a query hides it and is then cleared, then the section returns collapsed (refs §4.2).
- **AC-MAN-06** Given the Help & Support block, when "✉️ Reaginhouse6@gmail.com" is activated, then the device's mail client opens addressed to `Reaginhouse6@gmail.com` (refs BR-MAN-05).
- **AC-MAN-07** Given the manual is open, then the shell header reads "User Manual" with no right-slot control, and a left swipe navigates to the Dashboard (refs BR-MAN-06).

## 14. Discrepancies & open questions

- See **D-952** (`20-features/app-shell`): the manual uses two product names (`src/pages/UserManual.jsx:14,496` versus `:522`).
- See **D-971** (`00-overview/legal-copy.md`): the legal pages carry "[Add your contact email here]" while the manual gives `Reaginhouse6@gmail.com`.
- See **Q-970** (`00-overview/legal-copy.md`): is `Reaginhouse6@gmail.com` the product's support address of record, to be used also where the legal pages hold a placeholder? (Blocks §4.4 here.)
