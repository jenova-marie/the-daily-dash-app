# Link Library — Feature Spec

**Feature code:** `LINK` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 113 · Described 2 · Partial 0

**Sources owned:** `src/pages/Links.jsx`, `src/components/onboarding/LinkLibraryOnboarding.jsx`
**Sources referenced (owned elsewhere):** `base44/entities/Link.jsonc` → `10-architecture/data-model/quotes-links.md` (E-Link) · `10-architecture/data-model/json-string-fields.md` (thumbnail encoding) · `10-architecture/data-model/seed-data.md` §8 (icon and colour lists) · `src/lib/HeaderContext.jsx`, `src/components/Layout.jsx` → `10-architecture/shared-interactions.md` · `10-architecture/preferences.md` Part C and Part D (`links_onboarded`, `link_categories_v2`, `link_categories`) · `src/pages/UserManual.jsx` → `20-features/user-manual`

**Permissions:** per-user data (`Link` rows are readable and writable only by their creator, `base44/entities/Link.jsonc:22-35`); admin-only operations: none

## 0. Entry points & navigation

- Route: `/links` `[Implemented]` `src/App.jsx:213` · Sidebar label: "Link Library" `[Implemented]` `src/components/Layout.jsx:23` · Header title text: "Link Library" `[Implemented]` `src/pages/Links.jsx:94` · Position in swipe order: 11th of 14 navigation items, between Daily Quotes and Theme Editor; hidden feature pages are skipped by the ring `[Implemented]` `src/components/Layout.jsx:12-27,127-132`
- Query parameters accepted: none observed `[Implemented]` `src/pages/Links.jsx:92-121`
- Feature-toggle gating: none; always in the sidebar `[Implemented]` `src/components/Layout.jsx:127-132`
- Header right-slot contents: one icon button titled "Guide" that reopens the walkthrough `[Implemented]` `src/pages/Links.jsx:95,114`
- No other page deep-links to `/links` `[Implemented]` (repository search of `src/` for `"/links"` finds only the router and the sidebar)

## 1. Purpose & user benefit

A personal bookmark board: saved links shown as thumbnail cards, grouped by link categories the account owner styles with an icon and colour.

User Manual, "Link Library" (`src/pages/UserManual.jsx:342-358`) `[Described]`:

> Save and organize frequently used links and bookmarks in one place.
> - **Add a link** — provide a title, URL, and optional category. The app will attempt to auto-fetch a thumbnail image.
> - Links are displayed as **cards with thumbnails** for easy visual recognition.
> - **Filter by category** using the tabs at the top to quickly find the link you need.
> - **Click a link card** to open the URL in a new tab.
> - **Delete a link** using the trash icon on the card.

Onboarding step 1 (`src/components/onboarding/LinkLibraryOnboarding.jsx:9`) `[Described]`: "All your links live in one place so you never lose a useful site again."

The "auto-fetch a thumbnail" and "tabs" wording is logged as D-910 and D-911.

## 2. Concepts & vocabulary

- **link** (feature-local) — a `Link` row: `title`, `url`, optional `category` name, optional `thumbnail_url` `[Implemented]` `base44/entities/Link.jsonc:4-17`.
- **link category** — glossary: a device-local grouping for links with an icon and colour. Stored as `{ name, icon, color }` under `link_categories_v2` `[Implemented]` `src/pages/Links.jsx:71,88-90`. A link references its category by name only `[Implemented]` `src/pages/Links.jsx:151-155`.
- **Uncategorized** (feature-local) — the grouped-view section for links whose `category` is empty; it is not a stored category `[Implemented]` `src/pages/Links.jsx:226-228`.
- **thumbnail** (feature-local) — a link's `thumbnail_url`: either an image URL or the encoded string `icon:<IconName>|<hex>` `[Implemented]` `src/pages/Links.jsx:508-514,562-565`; encoding sheet in `json-string-fields.md`.
- **device-local preference** — glossary; link categories are one (AR-PREF-03).
- **walkthrough** — glossary; "Welcome to Link Library" `[Implemented]` `src/components/onboarding/LinkLibraryOnboarding.jsx:37`.

## 3. User stories

- **US-LINK-01** As the account owner, I want to save a link with a title, URL, category, and a thumbnail so that I recognise it at a glance. `[Implemented]` `src/pages/Links.jsx:174-183,294-324`
- **US-LINK-02** As the account owner, I want to open a saved link in a new tab by clicking its card. `[Implemented]` `src/pages/Links.jsx:569`
- **US-LINK-03** As the account owner, I want to edit or delete a link from its card. `[Implemented]` `src/pages/Links.jsx:168-172,185-188,587-594`
- **US-LINK-04** As the account owner, I want to create, restyle, rename, and delete link categories with an icon and colour. `[Implemented]` `src/pages/Links.jsx:128-148,339-388,471-496`
- **US-LINK-05** As the account owner, I want to view all links grouped by category, or narrow the view to one category. `[Implemented]` `src/pages/Links.jsx:159,224-291`
- **US-LINK-06** As the account owner, I want to import my browser bookmarks from an exported HTML file in one step. `[Implemented]` `src/pages/Links.jsx:190-222,402-414`
- **US-LINK-07** As a first-time visitor, I want a short walkthrough I can dismiss for good and reopen from a Guide button. `[Implemented]` `src/pages/Links.jsx:95,110-114,326-330`, `src/components/onboarding/LinkLibraryOnboarding.jsx:5-32`

## 4. Capabilities & interactions

### Page layout and management entry

- Top-right: one primary icon-only button (link icon) that opens the "Manage Links & Categories" dialog `[Implemented]` `src/pages/Links.jsx:234-238,333-337`
- Below it: the category filter dropdown, then the card area `[Implemented]` `src/pages/Links.jsx:241-291`
- There is no separate management mode. Card edit/delete buttons are hover-revealed on every card at all times, and the dialog opened by the top-right button is the single place for category management and the two add-link paths `[Implemented]` `src/pages/Links.jsx:235-237,333-423,587-594` (onboarding step 4 describes a mode toggle: D-912)
- Links load once on mount: `Link.list("-created_date")`, no limit `[Implemented]` `src/pages/Links.jsx:116-121`; every save, delete, import, and category delete reloads the list `[Implemented]` `src/pages/Links.jsx:146,182,187,214`

### "Manage Links & Categories" dialog

Title "Manage Links & Categories"; scrollable; sections in order `[Implemented]` `src/pages/Links.jsx:333-423`:

1. **Create Category** — text input, placeholder "Category name...", Enter submits; a style picker (below); full-width button "Add Category", disabled while the name is blank `[Implemented]` `src/pages/Links.jsx:340-357`
   - Adding trims the name; an empty or already-existing name (exact match) is ignored; otherwise `{ name, icon, color }` is appended and saved to the device, and the form resets to icon `Folder`, colour `#6366f1` `[Implemented]` `src/pages/Links.jsx:128-135`
2. **Edit / Delete Categories** (only when at least one category name exists) — one row per category, alphabetical, showing its icon in its colour and its name, with a pencil button (opens Edit Category) and a trash button (delete) `[Implemented]` `src/pages/Links.jsx:360-388`
3. **Add Link** — button "Add Manually" with subtext "Enter title, URL, and details" (opens the Add Link dialog and closes this one) `[Implemented]` `src/pages/Links.jsx:393-401,161-166`; button "Import from Browser" with subtext "Upload bookmark HTML file", label "Importing..." while busy, opening a hidden file input that accepts `.html` `[Implemented]` `src/pages/Links.jsx:402-414`; an import message line, green when it starts with "✓", red otherwise `[Implemented]` `src/pages/Links.jsx:415-419`

### Category style picker (shared by create and edit)

- A "Preview" line showing the current icon in the current colour `[Implemented]` `src/pages/Links.jsx:441-444`
- 42 icon buttons (each titled with its icon name), scrollable, rendered in the current colour; the selected one is outlined `[Implemented]` `src/pages/Links.jsx:445-453`
- "Color:" followed by 10 colour dots; the selected one is ringed and enlarged `[Implemented]` `src/pages/Links.jsx:455-465`
- Lists: `seed-data.md` §8 (42 icons, 10 colours) `[Implemented]` `src/pages/Links.jsx:17-65`

### Edit Category dialog

- Title "Edit Category"; field "Name" (prefilled); the style picker prefilled with the category's icon (default `Folder`) and colour (default `#6366f1`); buttons "Cancel" and "Save"; Save is disabled while the name is blank `[Implemented]` `src/pages/Links.jsx:471-496`
- Save replaces the stored category object (trimmed name, or the old name if blank) and closes `[Implemented]` `src/pages/Links.jsx:137-140,490`
- Renaming changes only the stored category; links keep their old `category` string, so the old name reappears as an auto-materialised category (default `Folder` / `#6366f1`) while any link still carries it `[Implemented]` `src/pages/Links.jsx:137-140,151-155` (Q-912)

### Delete category

- Trash button opens the browser's native confirm with the text `Delete category "{name}"? Links in it will become uncategorized.` `[Implemented]` `src/pages/Links.jsx:143`
- On OK: the category is removed from device storage; every link whose `category` equals the name is updated to `category: ""` (in parallel), then links reload; if that category was the active filter, the filter returns to "All" `[Implemented]` `src/pages/Links.jsx:142-148`
- On Cancel: nothing changes `[Implemented]` `src/pages/Links.jsx:143`

### Add Link / Edit Link dialog

- Title "Add Link" or "Edit Link" `[Implemented]` `src/pages/Links.jsx:297`
- Fields, in order `[Implemented]` `src/pages/Links.jsx:299-317`:
  - **Title** — text, placeholder "My Favorite Site"
  - **URL** — text, placeholder "https://example.com" (no format validation)
  - **Category** — combo input, placeholder "Type or select a category...": free text; while focused (and on each keystroke) a dropdown lists stored and materialised category names containing the typed text (case-insensitive), each with its icon in its colour; choosing one fills the field; the dropdown hides on blur after a short delay `[Implemented]` `src/pages/Links.jsx:608-641`
  - **Thumbnail** — two tabs. "Image URL": a text input, placeholder "https://..."; switching to it from Icon clears the value. "Icon": the same 42-icon grid and 10 colour dots; switching to it from URL writes `icon:ExternalLink|#6366f1`; each pick writes `icon:<IconName>|<hex>`. The tab opens on Icon when the current value starts with `icon:` `[Implemented]` `src/pages/Links.jsx:508-559`
- Buttons "Cancel" and "Save". Save is ignored while Title or URL is blank; otherwise creates a `Link` (add) or updates the edited row (edit) with `{ title, url, category, thumbnail_url }`, closes the dialog, and reloads `[Implemented]` `src/pages/Links.jsx:174-183,318-321`
- Opening for add resets the form to empty strings; opening for edit prefills from the card (`category` and `thumbnail_url` default to `""`) `[Implemented]` `src/pages/Links.jsx:161-172`
- A typed category that does not yet exist is not written to device storage; it appears in the filter and grouped view as an auto-materialised category once a link carries it `[Implemented]` `src/pages/Links.jsx:151-157`

### Category filter and views

- A dropdown (select) whose options are "All" followed by every category name sorted alphabetically (stored categories plus names found on links), each non-"All" option prefixed with its icon in its colour `[Implemented]` `src/pages/Links.jsx:150-157,241-261`
- **"All" (grouped view)**: one section per category name plus "Uncategorized", sorted alphabetically with "Uncategorized" forced last; each section has a heading with the category icon in its colour (no icon for Uncategorized) and either a card grid or the italic text "No links in this category"; when there are no links at all, the page-level empty state follows the sections `[Implemented]` `src/pages/Links.jsx:224-230,264-283`
- **Single category**: the card grid of links whose `category` equals the selection, or the page-level empty state `[Implemented]` `src/pages/Links.jsx:159,284-291`
- The filter value lives in memory and resets to "All" on reload or when the selected category is deleted `[Implemented]` `src/pages/Links.jsx:99,147`

### Card grid and card

- Responsive grid: 2 columns, then 3, 4, and 5 at wider widths `[Implemented]` `src/pages/Links.jsx:498-506`
- Card: a 16:9 thumbnail area, then the centred, truncated title; the whole card is an anchor to `url` opening in a new tab with `noopener noreferrer` `[Implemented]` `src/pages/Links.jsx:567-586`
- Thumbnail area: the decoded icon in its colour when `thumbnail_url` starts with `icon:`; the image when it is any other non-empty string; a faint external-link glyph when empty. An unknown icon name renders as `Folder`; a missing colour part renders `#6366f1` `[Implemented]` `src/pages/Links.jsx:67-69,562-581`
- Hover reveals two buttons top-right: pencil (opens Edit Link) and trash (deletes the row immediately, no confirmation, then reloads) `[Implemented]` `src/pages/Links.jsx:185-188,587-594` (Q-910)

### Import from Browser

- Accepts one `.html` file (a browser bookmarks export) `[Implemented]` `src/pages/Links.jsx:402`
- Parsing rule: the file text is parsed as HTML; every `<a href>` is read; an entry is kept only when `href` starts with `http://` or `https://`; title is the anchor's trimmed text, or the URL's hostname when the text is empty; category is `"Imported"` `[Implemented]` `src/pages/Links.jsx:196-207`
- With no kept entries: message "No valid bookmarks found in the file." and the dialog stays open `[Implemented]` `src/pages/Links.jsx:208`
- Otherwise one `Link` is created per entry, sequentially; if no stored category named "Imported" exists, one is added with icon `Bookmark` and colour `#6366f1`; message `✓ Successfully imported {N} bookmarks!`; links reload; the manage dialog closes `[Implemented]` `src/pages/Links.jsx:209-215`
- On an exception: message `Error: {message}` `[Implemented]` `src/pages/Links.jsx:216-217`
- In every case the file input is cleared so the same file can be chosen again `[Implemented]` `src/pages/Links.jsx:218-221`
- No de-duplication against existing links `[Implemented]` `src/pages/Links.jsx:200-209` (data-model E-Link cardinality)

### 4a. Keyboard & pointer

- Enter in "Category name..." adds the category `[Implemented]` `src/pages/Links.jsx:346`
- Escape / overlay click closes any open dialog via the dialog primitive; Edit Category closes through the same path `[Implemented]` `src/pages/Links.jsx:294,333,477`
- Hover on a card reveals edit and delete `[Implemented]` `src/pages/Links.jsx:587`
- Focus on the category combo opens its dropdown; blur closes it after 150 ms so a click on an option lands first `[Implemented]` `src/pages/Links.jsx:616-618,631`
- Double-click, long-press, swipe, drag-and-drop: none observed `[Implemented]` `src/pages/Links.jsx:232-435`

### 4b. View state & persistence

| Control | Values | Default | Scope (memory / device `key` / account `Entity.field`) |
|---|---|---|---|
| Category filter | "All" or a category name | "All" | memory `src/pages/Links.jsx:99` |
| Link categories | `[{ name, icon, color }]` | `[]` (or migrated v1) | device `link_categories_v2` `src/pages/Links.jsx:71-90` |
| Links | rows | — | account `Link` `src/pages/Links.jsx:119` |
| Add/Edit form | title, url, category, thumbnail_url | empty | memory `src/pages/Links.jsx:103` |
| New-category form | name, icon, colour | "", `Folder`, `#6366f1` | memory `src/pages/Links.jsx:104-106` |
| Thumbnail tab | url / icon | icon when value starts with `icon:`, else url | memory `src/pages/Links.jsx:509` |
| Import message | string | "" | memory (cleared at the start of each import) `src/pages/Links.jsx:109,194` |
| Walkthrough open | true/false | key absent | memory; dismissal in device `links_onboarded` `src/pages/Links.jsx:110-112` |

### 4c. Empty & fallback states

- No links (either view): an external-link glyph and "No links yet. Add your first one!" `[Implemented]` `src/pages/Links.jsx:282,287,599-606`
- Category section with no links (grouped view): "No links in this category" `[Implemented]` `src/pages/Links.jsx:277`
- Card without thumbnail: faint external-link glyph `[Implemented]` `src/pages/Links.jsx:577-581`
- Import: "No valid bookmarks found in the file." / `Error: {message}` `[Implemented]` `src/pages/Links.jsx:208,217`
- Randomly typed category with no style: rendered with `Folder` / `#6366f1` `[Implemented]` `src/pages/Links.jsx:155`

## 5. Business rules

- **BR-LINK-01** A link needs a title and a URL; category and thumbnail are optional. `[Implemented]` `src/pages/Links.jsx:175`, `base44/entities/Link.jsonc:18-21`
- **BR-LINK-02** Link categories are device-local: they live in localStorage under `link_categories_v2` and do not follow the account. `[Implemented]` `src/pages/Links.jsx:71,88-90` (canonical: `preferences.md` AR-PREF-03)
- **BR-LINK-03** v1 → v2 migration: when `link_categories_v2` is absent and `link_categories` (a JSON array of names) is present, each name becomes `{ name, icon: "Folder", color: "#6366f1" }` in memory; v1 is never rewritten or removed; the v2 key is written on the first category save. `[Implemented]` `src/pages/Links.jsx:74-90` (D-133)
- **BR-LINK-04** Any category name carried by a link but absent from device storage is materialised for display with `Folder` / `#6366f1`, so the filter and grouped view always cover every link. `[Implemented]` `src/pages/Links.jsx:150-157`
- **BR-LINK-05** Category names are unique by exact match on create; a duplicate is silently ignored. `[Implemented]` `src/pages/Links.jsx:130`
- **BR-LINK-06** Deleting a category clears `category` on every link that carried it and returns the filter to "All" if it was selected. `[Implemented]` `src/pages/Links.jsx:142-148`
- **BR-LINK-07** Renaming a category does not rewrite links. `[Implemented]` `src/pages/Links.jsx:137-140`
- **BR-LINK-08** A thumbnail is either an image URL or `icon:<IconName>|<hex>`; the prefix `icon:` decides how it renders. `[Implemented]` `src/pages/Links.jsx:514,562-565`
- **BR-LINK-09** Category order everywhere is alphabetical (`localeCompare`), with "Uncategorized" last in the grouped view. `[Implemented]` `src/pages/Links.jsx:156,227`
- **BR-LINK-10** Links are listed newest-created first with no limit. `[Implemented]` `src/pages/Links.jsx:119`
- **BR-LINK-11** Links open in a new tab. `[Implemented]` `src/pages/Links.jsx:569`
- **BR-LINK-12** Bookmark import keeps only `http(s)` anchors, titles them by anchor text or hostname, files them under "Imported", and creates that category (icon `Bookmark`) if missing. `[Implemented]` `src/pages/Links.jsx:196-212`
- **BR-LINK-13** Deleting a link is immediate; deleting a category asks first. `[Implemented]` `src/pages/Links.jsx:143,185-188,591`
- **BR-LINK-14** Links are removed by the Settings "Delete All App Data" wipe and by account deletion. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:56`, `base44/functions/deleteUserAccount/entry.ts:67-69`

### 5a. State & lifecycle

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| no row | Add Link → Save (title and URL present) | `Link { title, url, category, thumbnail_url }` | list reload `src/pages/Links.jsx:179,182` |
| no row | import entry | `Link { title, url, category: "Imported" }` | "Imported" category ensured `src/pages/Links.jsx:209-212` |
| row | Edit Link → Save | fields replaced | list reload `src/pages/Links.jsx:177` |
| row with `category = X` | delete category X (confirmed) | `category = ""` | category removed from device `src/pages/Links.jsx:144-146` |
| row | card trash | hard-deleted | list reload `src/pages/Links.jsx:185-188` |
| category absent | Add Category | `{ name, icon, color }` stored | form reset `src/pages/Links.jsx:131-134` |
| category | Edit Category → Save | object replaced | none on links `src/pages/Links.jsx:138` |
| category | trash (confirmed) | removed from device | see row above `src/pages/Links.jsx:144` |

### 5b. Time & date semantics

- None. The feature keeps no dates beyond the platform `created_date` used for ordering `[Implemented]` `src/pages/Links.jsx:119`. No AR-TIME divergence.

## 6. Data

- Owned entity: `Link` (`title`, `url`, `category`, `thumbnail_url`); field sheet in `10-architecture/data-model/quotes-links.md` (E-Link); thumbnail encoding in `json-string-fields.md`.
- Reads: `Link.list("-created_date")`, no limit `[Implemented]` `src/pages/Links.jsx:119`
- Writes: `create` `src/pages/Links.jsx:179,209`; `update` `src/pages/Links.jsx:146,177`; `delete` `src/pages/Links.jsx:186` `[Implemented]`
- Device data: `link_categories_v2` (`[{ name, icon, color }]`), `link_categories` (legacy, read-only) `[Implemented]` `src/pages/Links.jsx:71-90`
- No backend functions, no integrations, no LLM calls `[Implemented]` `src/pages/Links.jsx:1-15`

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| in | Settings | "Delete All App Data" removes `Link` rows; categories on the device are untouched | `base44/functions/deleteSyncedData/entry.ts:56` |
| in | Onboarding registry | key `links_onboarded`, generation 1 | `src/pages/Links.jsx:110-112`, `src/components/onboarding/LinkLibraryOnboarding.jsx:30`, `preferences.md` Part C |
| in | Shared interactions | header title and right-slot Guide button | `src/pages/Links.jsx:94-95` |
| in | Preferences | device-local category storage and migration | `preferences.md` Part D rows `link_categories_v2`, `link_categories` |

No dashboard widget, no deep links in or out `[Implemented]` `src/pages/Dashboard.jsx:22-42`, `src/pages/Links.jsx:1-641`.

### 7a. Feedback & notifications

- Toasts, alerts (informational): none `[Implemented]` `src/pages/Links.jsx:1-15`
- Native confirm: category delete `[Implemented]` `src/pages/Links.jsx:143`
- Inline message: import result line, green for "✓ …", red otherwise `[Implemented]` `src/pages/Links.jsx:415-419`
- Button state: "Importing..." while an import runs; "Add Category" and Edit Category "Save" disabled on blank name `[Implemented]` `src/pages/Links.jsx:354,411,490`
- Celebratory effects, reminders: none observed

## 8. AI & automation

None. The feature makes no model calls and no workflow touches `Link` `[Implemented]` `src/pages/Links.jsx:1-641`, `10-architecture/ai-services.md` §1, `10-architecture/automations.md` §2-3.

## 9. Onboarding content

Dialog title "Welcome to Link Library"; subtitle "Here's how to get the most out of this page — it only takes a minute!"; single button "Got it — Don't Remind Me Again" `[Implemented]` `src/components/onboarding/LinkLibraryOnboarding.jsx:37-40,54-56`

Steps verbatim `[Implemented]` `src/components/onboarding/LinkLibraryOnboarding.jsx:5-26`:

1. **1. Save Your Favorite Links** — "Click 'Add Link' to store any website or resource. Give it a title, paste the URL, and optionally assign a category. All your links live in one place so you never lose a useful site again."
2. **2. Organize with Categories** — "Create custom categories like Productivity, Learning, or Entertainment. Use the dropdown to filter your view to a single category. Categories are stored locally so they persist across sessions."
3. **3. Personalize with Icons & Thumbnails** — "Each link can show a thumbnail image from a URL, or you can choose from 40+ icons with 10 color options. Pick a style that makes each link instantly recognizable at a glance."
4. **4. Enter Management Mode** — "Click the link icon button in the top right to switch into management mode. From there you can add, edit, or delete links and categories. Switch back to view mode when you're done."

- Dismissal key: `links_onboarded`; persistence generation 1 (device only, value `"1"`) `[Implemented]` `src/components/onboarding/LinkLibraryOnboarding.jsx:29-32`
- Trigger: shown when the device key is absent, evaluated once at page mount `[Implemented]` `src/pages/Links.jsx:110-112`
- Closing via overlay or Escape closes without writing the key `[Implemented]` `src/components/onboarding/LinkLibraryOnboarding.jsx:34`
- The page also passes an `onDontRemind` handler writing the same key; the dialog does not call it `[Implemented]` `src/pages/Links.jsx:329`, `src/components/onboarding/LinkLibraryOnboarding.jsx:28-32`
- "Guide" header button reopens the dialog without touching the key `[Implemented]` `src/pages/Links.jsx:95,114`
- Step 4's management mode: D-912. Step 2's "stored locally": matches BR-LINK-02 (`preferences.md` AR-PREF-07).

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `link_categories_v2` | link categories `[{ name, icon, color }]` | `[]`, or the v1 migration result | every category add/edit/delete and the "Imported" auto-create `src/pages/Links.jsx:88-90,123-126` | never (rewritten on delete) |
| `link_categories` | legacy v1 names (JSON string[]) | absent | never written | never |
| `links_onboarded` | walkthrough dismissed | absent → show | `"1"` on "Got it — Don't Remind Me Again" `src/components/onboarding/LinkLibraryOnboarding.jsx:30` | never |

## 11. Seed / hardcoded data used

- Icon list (42) and colour list (10): `10-architecture/data-model/seed-data.md` §8 `[Implemented]` `src/pages/Links.jsx:17-65`
- Defaults: category icon `Folder`, colour `#6366f1`; thumbnail icon default `ExternalLink` / `#6366f1`; import category "Imported" / `Bookmark` / `#6366f1` `[Implemented]` `src/pages/Links.jsx:82,105-106,155,211,512-513,524`
- Storage keys `link_categories_v2`, `link_categories`, `links_onboarded` `[Implemented]` `src/pages/Links.jsx:71,79,111`
- Placeholder and empty-state strings (§4, §4c) `[Implemented]` `src/pages/Links.jsx:302,306,345,530,603,619`
- Onboarding steps (§9) `[Implemented]` `src/components/onboarding/LinkLibraryOnboarding.jsx:5-26`

## 12. Print / email formats

None observed. The page has no print or email trigger `[Implemented]` `src/pages/Links.jsx:1-15,232-435`.

## 13. Acceptance criteria

- **AC-LINK-01** Given the Add Link dialog, When Save is pressed with a blank Title or URL, Then nothing is created and the dialog stays open. (refs BR-LINK-01)
- **AC-LINK-02** Given Title "Docs", URL "https://example.com", Category "Work" typed (not stored), thumbnail tab Icon with `Book` and `#22c55e`, When Save is pressed, Then a `Link` exists with `thumbnail_url` = `icon:Book|#22c55e` and `category` = "Work", and "Work" appears in the filter dropdown with `Folder` / `#6366f1`. (refs BR-LINK-04, BR-LINK-08)
- **AC-LINK-03** Given a card with an image thumbnail, When the card is clicked, Then the URL opens in a new tab. (refs BR-LINK-11)
- **AC-LINK-04** Given a card, When its hover trash button is pressed, Then the row is deleted with no confirmation and the grid updates. (refs BR-LINK-13)
- **AC-LINK-05** Given "Category name..." holds "Reading" with icon `Book` and colour `#ec4899`, When Enter is pressed, Then `link_categories_v2` contains `{ name: "Reading", icon: "Book", color: "#ec4899" }` and the form resets to `Folder` / `#6366f1`. (refs BR-LINK-02, BR-LINK-05)
- **AC-LINK-06** Given a stored category "Reading", When "Reading" is added again, Then storage is unchanged. (refs BR-LINK-05)
- **AC-LINK-07** Given two links in "Reading" and the filter set to "Reading", When the category's trash is pressed and the confirm is accepted, Then both links have `category` = "" and the filter shows "All". (refs BR-LINK-06)
- **AC-LINK-08** Given a link in "Reading", When the category is renamed to "Books", Then the link still carries "Reading" and the grouped view shows both a "Books" section (empty) and a "Reading" section with `Folder` / `#6366f1`. (refs BR-LINK-07, BR-LINK-04)
- **AC-LINK-09** Given categories "Work", "Alpha" and an uncategorised link, When the filter is "All", Then sections appear in the order Alpha, Work, Uncategorized, and an empty section reads "No links in this category". (refs BR-LINK-09)
- **AC-LINK-10** Given no links, When the page opens, Then "No links yet. Add your first one!" is shown. (refs §4c)
- **AC-LINK-11** Given a bookmarks HTML file with 3 `https` anchors, 1 `ftp` anchor, and 1 `https` anchor with empty text for host "example.org", When it is imported, Then 4 links are created under "Imported" (one titled "example.org"), the "Imported" category exists with icon `Bookmark`, the message reads "✓ Successfully imported 4 bookmarks!", and the manage dialog closes. (refs BR-LINK-12)
- **AC-LINK-12** Given an HTML file with no `http(s)` anchors, When it is imported, Then "No valid bookmarks found in the file." is shown and no link is created. (refs BR-LINK-12)
- **AC-LINK-13** Given `link_categories_v2` absent and `link_categories` = `["Old"]`, When the page opens, Then "Old" appears with `Folder` / `#6366f1`, and after any category save `link_categories_v2` holds it as an object while `link_categories` is unchanged. (refs BR-LINK-03)
- **AC-LINK-14** Given `links_onboarded` is absent, When the page opens, Then "Welcome to Link Library" is shown; When "Got it — Don't Remind Me Again" is pressed, Then the key is `"1"` and the dialog does not show on the next visit. (refs §9)
- **AC-LINK-15** Given the thumbnail tab is Icon with a value, When "Image URL" is pressed, Then `thumbnail_url` becomes "" and the URL input is empty. (refs BR-LINK-08)

## 14. Discrepancies & open questions

- **D-910** The manual says "The app will attempt to auto-fetch a thumbnail image" (`src/pages/UserManual.jsx:350`); the thumbnail is the typed image URL or a picked icon, and no fetch exists (`src/pages/Links.jsx:508-559,174-183`).
- **D-911** The manual says "Filter by category using the tabs at the top" (`src/pages/UserManual.jsx:352`); the filter is a dropdown select (`src/pages/Links.jsx:241-261`).
- **D-912** Onboarding step 4 describes a management mode entered and left via the top-right link-icon button, with add/edit/delete available only there (`src/components/onboarding/LinkLibraryOnboarding.jsx:24`); the button opens a "Manage Links & Categories" dialog, and card edit/delete are hover-revealed at all times (`src/pages/Links.jsx:235-237,333-337,587-594`).
- Cross-reference: D-133 (`preferences.md`) covers the v1/v2 storage keys.
- **Q-910** Blocks: §4 Card grid. Link deletion from the card is immediate (`src/pages/Links.jsx:185-188,591`) while category deletion confirms (`src/pages/Links.jsx:143`) and the shared list rows always confirm (`shared-interactions.md` AR-UI-02). Is an unconfirmed link delete the intended behaviour?
- **Q-911** Blocks: §4 Import. The success message is set in the same step that closes the manage dialog (`src/pages/Links.jsx:213-215`), so it is visible only when the dialog is reopened. Is the message meant to be seen on the page?
- **Q-912** Blocks: §4 Edit Category. Renaming a category leaves links on the old name (`src/pages/Links.jsx:137-140`). Is a rename meant to carry the links across?
