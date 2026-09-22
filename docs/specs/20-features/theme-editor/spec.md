# Theme Editor — Feature Spec

**Feature code:** `THEME` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 105 · Described 1 · Partial 1

**Sources owned:** `src/pages/ThemeEditor.jsx`
**Sources referenced (owned elsewhere):** `src/App.jsx:33-58,65-133` and `index.html:11-28` (theme application at boot; owned by `20-features/app-shell`, account/device split in `10-architecture/preferences.md` Part A and Part D) · `base44/entities/ThemeSettings.jsonc` → `10-architecture/data-model/settings.md` · `10-architecture/data-model/seed-data.md` §11 (defaults, gallery, boot library) · `src/components/WidgetCard.jsx` (consumes `--widget-opacity` / `--widget-radius`) → `10-architecture/export-print-email.md` · `src/pages/Settings.jsx:331-341,697-703` (Custom Display Name) → `20-features/settings` · `src/pages/Dashboard.jsx:154` (greeting) → `20-features/dashboard` · `base44/entities/CollageImage.jsonc` → `20-features/vision-board` · `src/pages/UserManual.jsx` → `20-features/user-manual`

**Permissions:** per-user data (`ThemeSettings` and `CollageImage` rows are readable and writable only by their creator, `base44/entities/ThemeSettings.jsonc:97-110`); admin-only operations: none

## 0. Entry points & navigation

- Route: `/theme` `[Implemented]` `src/App.jsx:211` · Sidebar label: "Theme Editor" `[Implemented]` `src/components/Layout.jsx:24` · Header title text: "Theme Editor" `[Implemented]` `src/pages/ThemeEditor.jsx:62` · Position in swipe order: 12th of 14 navigation items, between Link Library and Settings; hidden feature pages are skipped by the ring `[Implemented]` `src/components/Layout.jsx:12-27,127-132`
- Query parameters accepted: none observed `[Implemented]` `src/pages/ThemeEditor.jsx:60-76`
- Feature-toggle gating: none; always in the sidebar `[Implemented]` `src/components/Layout.jsx:127-132`
- Header right-slot contents: none `[Implemented]` `src/pages/ThemeEditor.jsx:61-62` (only `setTitle` is used)
- No other page deep-links to `/theme` `[Implemented]` (repository search of `src/` for `"/theme"` finds only the router and the sidebar)

## 1. Purpose & user benefit

Lets the account owner make the whole app look like their own: two colours, dark or light, fonts and text size, how see-through and how rounded the widget cards are, and a full-screen background photo drawn from a personal library that can change on every app load.

User Manual, "Theme Editor" (`src/pages/UserManual.jsx:382-401`) `[Described]`:

> Customize the look and feel of your entire dashboard.
> - **Primary color:** Changes the main accent color used for buttons, active nav items, and highlights.
> - **Accent color:** Secondary highlight color used for badges and decorative elements.
> - **Background image:** Upload a photo or paste a URL to set a full-screen background. Multiple images can be saved to a history and randomized on each load.
> - **Widget opacity:** Adjust how transparent or opaque the widget cards appear over the background.
> - **Widget border radius:** Control how rounded the widget card corners are.
> - **Fonts:** Choose heading and body fonts from Google Fonts.
> - **Dark mode:** Toggle the entire app between light and dark themes.
> - **Dashboard header name:** Customize the greeting name shown on the Dashboard.
> - All theme changes are **saved automatically** and applied app-wide instantly.

The "Dashboard header name", "Google Fonts", and "saved automatically" lines are logged as D-920, D-922, D-921.

## 2. Concepts & vocabulary

- **theme** (feature-local) — the ten user-settable fields in §4 (`primary_color`, `accent_color`, `background_image`, `widget_bg_opacity`, `font_size`, `heading_font`, `body_font`, `dark_mode`, `widget_border_radius`, `randomize_background`) `[Implemented]` `src/pages/ThemeEditor.jsx:13-24`
- **account preference** — glossary; the theme fields and the background library are account preferences in `ThemeSettings` (AR-PREF-02) `[Implemented]` `base44/entities/ThemeSettings.jsonc:4-51`
- **device-local preference** — glossary; the device copies listed in §10
- **background library** (feature-local) — the account owner's saved background URLs, shown as "My Backgrounds"; account field `ThemeSettings.background_library`, device key `theme_bg_history`, capped at 20 `[Implemented]` `src/pages/ThemeEditor.jsx:58,131,360`
- **default backgrounds** (feature-local) — the 21 built-in gallery URLs on the page (`seed-data.md` §11.2) `[Implemented]` `src/pages/ThemeEditor.jsx:316-340`; distinct from the 5-entry boot library used when the account library is empty (`seed-data.md` §11.3) `[Implemented]` `src/App.jsx:52-58`
- **live apply** (feature-local) — every edit is applied to the running app immediately, before any save `[Implemented]` `src/pages/ThemeEditor.jsx:78-80`
- **collage** — glossary; referenced by the remove-from-library rule (BR-THEME-12)

## 3. User stories

- **US-THEME-01** As the account owner, I want to pick primary and accent colours and see them applied everywhere at once. `[Implemented]` `src/pages/ThemeEditor.jsx:78-80,100-103,202-217`
- **US-THEME-02** As the account owner, I want to switch between dark and light. `[Implemented]` `src/pages/ThemeEditor.jsx:104-105,218-221`
- **US-THEME-03** As the account owner, I want to choose heading and body fonts and a text size. `[Implemented]` `src/pages/ThemeEditor.jsx:106-109,226-254`
- **US-THEME-04** As the account owner, I want to set how see-through and how rounded widget cards are. `[Implemented]` `src/pages/ThemeEditor.jsx:110-111,257-274`
- **US-THEME-05** As the account owner, I want a full-screen background from an upload, a URL, or a built-in gallery. `[Implemented]` `src/pages/ThemeEditor.jsx:112-125,277-357`
- **US-THEME-06** As the account owner, I want to keep a library of backgrounds and have the app pick one at random each time it loads. `[Implemented]` `src/pages/ThemeEditor.jsx:128-155,358-388`, `src/App.jsx:101-109`
- **US-THEME-07** As the account owner, I want my theme to follow my account so it looks the same on every device. `[Implemented]` `src/pages/ThemeEditor.jsx:157-178`, `src/App.jsx:84-126`
- **US-THEME-08** As the account owner, I want to reset to the built-in look, and to snapshot my current look as a default. `[Implemented]` `src/pages/ThemeEditor.jsx:180-188,194-195`
- **US-THEME-09** As the account owner, I want a preview of headings, text, buttons, and swatches while I tweak. `[Implemented]` `src/pages/ThemeEditor.jsx:395-410`

## 4. Capabilities & interactions

### Load

- The page starts with the built-in defaults, then 300 ms after mount reads the newest `ThemeSettings` row. With no row, editing begins from the defaults and no row id is held. With a row, its non-null fields are merged over the defaults and the row id is kept `[Implemented]` `src/pages/ThemeEditor.jsx:63-76,82-90`
- Background library on load: the account list is merged with the device list (account entries first, then device entries not already present), the result is shown as "My Backgrounds" and written back to the device `[Implemented]` `src/pages/ThemeEditor.jsx:91-96`
- Once loaded, every state change is applied live (§4 "Live apply") `[Implemented]` `src/pages/ThemeEditor.jsx:78-80`

### Action bar (top right)

- **Reset** (outline, rotate icon): replaces the working theme with the built-in defaults (§4b table); nothing is saved; the library is untouched `[Implemented]` `src/pages/ThemeEditor.jsx:186-188,194`
- **Set as Default** (outline): writes the working theme as JSON to the device key `default_theme`; the label reads "Set as Default!" for 2 seconds `[Implemented]` `src/pages/ThemeEditor.jsx:180-184,195`. No code reads the key `[Partial]` `src/pages/ThemeEditor.jsx:181` (`preferences.md` Part D; Q-920)
- **Save Theme** (primary, save icon): builds the library as the current `background_image` (if any) first, then the existing entries minus that URL, capped at 20; writes the whole working theme plus `background_library` to the held row (update) or creates a row (and keeps its id); mirrors the library to the device; the label reads "Saved!" for 2 seconds `[Implemented]` `src/pages/ThemeEditor.jsx:157-178,196`
- Save writes back every field that was loaded from the row, including fields other features own (for example `onboarding_status`, `widget_order`, the feature toggles, `dashboard_header`), as they were when the page loaded `[Implemented]` `src/pages/ThemeEditor.jsx:87-88,163-166` (Q-921)

### "Colors" card

- **Primary Color**: a native colour swatch and a free-text field, both bound to `primary_color` `[Implemented]` `src/pages/ThemeEditor.jsx:205-209`
- **Accent Color**: same pair bound to `accent_color` `[Implemented]` `src/pages/ThemeEditor.jsx:212-216`
- **Dark Mode**: a switch bound to `dark_mode` `[Implemented]` `src/pages/ThemeEditor.jsx:218-221`
- The text field accepts any string; the colour is converted from a 6-digit hex to an HSL triple when applied `[Implemented]` `src/pages/ThemeEditor.jsx:40-56,102-103`

### "Typography" card

- **Heading Font** and **Body Font**: selects with options Inter, Playfair Display, Georgia, Arial, Verdana (labels identical to values) `[Implemented]` `src/pages/ThemeEditor.jsx:26-32,229-240`
- **Font Size**: select with "Small", "Medium", "Large" (values `small`, `medium`, `large`) `[Implemented]` `src/pages/ThemeEditor.jsx:243-251`
- Size mapping (base text / heading size): small 14px / 1.75rem · medium 16px / 2rem · large 18px / 2.5rem; an unknown value maps to medium `[Implemented]` `src/pages/ThemeEditor.jsx:34-38,106`

### "Widget Appearance" card

- **Background Opacity**: slider 10–100, step 5, current value shown as "{n}%" `[Implemented]` `src/pages/ThemeEditor.jsx:260-264`
- **Border Radius**: slider 0–24, step 2, current value shown as "{n}px" `[Implemented]` `src/pages/ThemeEditor.jsx:267-271`

### "Background Image" card

- **Upload Image**: button "Choose Image" opens a hidden file input accepting `image/*`; the chosen file is uploaded through the platform file upload, its returned URL becomes `background_image`, and the URL is added to the library `[Implemented]` `src/pages/ThemeEditor.jsx:280-298`
- **Image URL**: a text field bound to `background_image`, placeholder "https://images.unsplash.com/..."; while non-empty, a "+" button beside it adds the URL to the library `[Implemented]` `src/pages/ThemeEditor.jsx:301-313`
- **Default Backgrounds**: a 3-column grid of the 21 built-in URLs (`seed-data.md` §11.2). Clicking a tile sets `background_image` to it; the tile matching `background_image` is outlined. Hovering a tile reveals a "+" button titled "Add to My Backgrounds" that adds the URL to the library without selecting it `[Implemented]` `src/pages/ThemeEditor.jsx:316-357`
- **My Backgrounds** (only when the library is non-empty): a 3-column grid of library URLs, newest first. Clicking a tile applies it as `background_image`; the matching tile is outlined. Hovering reveals an "X" that removes the URL from the library `[Implemented]` `src/pages/ThemeEditor.jsx:358-378`
- **Randomize on app load**: a switch bound to `randomize_background` `[Implemented]` `src/pages/ThemeEditor.jsx:379-385`. When on with an empty library, the hint "Save some backgrounds to your library first." appears `[Implemented]` `src/pages/ThemeEditor.jsx:386-388`
- **Add to library** (upload, "+" beside the URL, gallery hover "+"): moves or inserts the URL at the front, drops duplicates, caps at 20, writes the device key, and updates `ThemeSettings.background_library` only when a row id is held (a row existed at load, or Save Theme created one) `[Implemented]` `src/pages/ThemeEditor.jsx:128-139`
- **Remove from library** ("X" on a My Backgrounds tile): removes the URL, writes the device key, updates the account field when a row id is held, and deletes every `CollageImage` whose `image_url` equals the URL and whose `is_default` is true (up to 100) `[Implemented]` `src/pages/ThemeEditor.jsx:141-155` (canonical: `seed-data.md` §1.7). The current `background_image` is not changed by removal `[Implemented]` `src/pages/ThemeEditor.jsx:141-155`

### "Preview" card

- Shows "Heading Preview" in the heading font, the sentence "This is body text preview. The quick brown fox jumps over the lazy dog.", three buttons "Primary Button", "Outline Button", "Secondary", and three swatches labelled "Primary", "Accent", "Muted" `[Implemented]` `src/pages/ThemeEditor.jsx:395-410`

### Live apply (what changes as the user edits)

- Primary and accent colours are written as HSL to the app's colour tokens `[Implemented]` `src/pages/ThemeEditor.jsx:102-103`
- Dark Mode on adds the `dark` class to the document; off removes it `[Implemented]` `src/pages/ThemeEditor.jsx:104-105`
- Body and heading fonts are written to the app's font tokens (fallbacks `sans-serif` / `serif`); the root text size follows the size mapping `[Implemented]` `src/pages/ThemeEditor.jsx:106-109`
- Opacity is written as a 0–1 fraction and radius as pixels; widget cards read both `[Implemented]` `src/pages/ThemeEditor.jsx:110-111`, `src/components/WidgetCard.jsx:33-36`
- Background: when `randomize_background` is on and the device key `theme_active_bg` holds a URL, that URL is used; otherwise `background_image`. A non-empty URL is applied to the page body as a fixed, centred, cover, non-repeating background; an empty one clears it `[Implemented]` `src/pages/ThemeEditor.jsx:112-125`. No code writes `theme_active_bg` (`preferences.md` D-122, Q-104)

### What the account owner sees on app load (boot; owned by app-shell, summarised here)

1. Before the app runs, an inline script adds `dark`, reads the device copy of the library (`theme_bg_library`, falling back to a one-entry list with the built-in default URL), picks a random entry unless `theme_randomize` is `"0"`, else uses `theme_last_bg` or the default, and applies it to the body `[Implemented]` `index.html:11-28`
2. On app mount, `dark` is added again and `theme_last_bg` (if any) is applied `[Implemented]` `src/App.jsx:65-77`
3. After sign-in, the newest `ThemeSettings` row is applied: colours, dark (removed only when `dark_mode === false`), fonts, opacity (default 70), radius (default 12); `font_size` is not applied here. The background is a random entry of `background_library` (or the 5 boot defaults when empty) when `randomize_background` is not `false`, else `background_image` or the built-in default URL. The library, the randomise flag (`"1"` or removed) and the chosen URL are cached to the device `[Implemented]` `src/App.jsx:80-133` (D-923, D-924)

### 4a. Keyboard & pointer

- Hover on a Default Backgrounds tile reveals "+"; hover on a My Backgrounds tile reveals "X" `[Implemented]` `src/pages/ThemeEditor.jsx:348-353,370-373`
- Sliders and selects use the shared UI primitives; swipe navigation is suppressed while a slider is touched (`shared-interactions.md`, `src/components/Layout.jsx:82-86`) `[Implemented]`
- Enter/Escape, double-click, long-press, drag-and-drop: none observed `[Implemented]` `src/pages/ThemeEditor.jsx:190-412`

### 4b. View state & persistence

| Control | Values | Default | Scope (memory / device `key` / account `Entity.field`) |
|---|---|---|---|
| Primary Color | hex string | `#1a9a7a` | memory (live) → account `ThemeSettings.primary_color` on Save `src/pages/ThemeEditor.jsx:14,166` |
| Accent Color | hex string | `#e6930e` | memory → `ThemeSettings.accent_color` `src/pages/ThemeEditor.jsx:15` |
| Dark Mode | on/off | off | memory → `ThemeSettings.dark_mode` `src/pages/ThemeEditor.jsx:21` |
| Heading Font | Inter · Playfair Display · Georgia · Arial · Verdana | Playfair Display | memory → `ThemeSettings.heading_font` `src/pages/ThemeEditor.jsx:19` |
| Body Font | same five | Inter | memory → `ThemeSettings.body_font` `src/pages/ThemeEditor.jsx:20` |
| Font Size | small · medium · large | medium | memory → `ThemeSettings.font_size` `src/pages/ThemeEditor.jsx:18` |
| Background Opacity | 10–100 step 5 | 90 | memory → `ThemeSettings.widget_bg_opacity` `src/pages/ThemeEditor.jsx:17` |
| Border Radius | 0–24 step 2 | 12 | memory → `ThemeSettings.widget_border_radius` `src/pages/ThemeEditor.jsx:22` |
| Background Image | URL string | `""` | memory → `ThemeSettings.background_image` `src/pages/ThemeEditor.jsx:16` |
| Randomize on app load | on/off | on | memory → `ThemeSettings.randomize_background` `src/pages/ThemeEditor.jsx:23` |
| My Backgrounds | up to 20 URLs, newest first | `[]` | device `theme_bg_history` immediately; account `ThemeSettings.background_library` when a row id is held or on Save `src/pages/ThemeEditor.jsx:128-178` |
| "Saved!" / "Set as Default!" labels | shown 2 s | hidden | memory `src/pages/ThemeEditor.jsx:65-66,176-177,182-183` |

Entity defaults differ from editor defaults for opacity (70) and dark mode (true): `seed-data.md` §11.1, D-121.

### 4c. Empty & fallback states

- Randomize on with an empty library: "Save some backgrounds to your library first." `[Implemented]` `src/pages/ThemeEditor.jsx:386-388`
- My Backgrounds with no entries: the section is absent `[Implemented]` `src/pages/ThemeEditor.jsx:358`
- No `ThemeSettings` row: the editor shows the built-in defaults and Save creates the row `[Implemented]` `src/pages/ThemeEditor.jsx:84,167-169`
- Empty `background_image`: the body background is cleared on live apply `[Implemented]` `src/pages/ThemeEditor.jsx:123-125`; at boot the built-in default URL is used instead `[Implemented]` `src/App.jsx:108`

## 5. Business rules

- **BR-THEME-01** The editor's built-in defaults are: primary `#1a9a7a`, accent `#e6930e`, background `""`, opacity 90, font size medium, heading font Playfair Display, body font Inter, dark mode off, radius 12, randomize on. `[Implemented]` `src/pages/ThemeEditor.jsx:13-24` (table: `seed-data.md` §11.1; D-121)
- **BR-THEME-02** Every edit applies live to the running app; nothing reaches the account until "Save Theme". `[Implemented]` `src/pages/ThemeEditor.jsx:78-80,157-178` (D-921)
- **BR-THEME-03** The theme is an account preference: one `ThemeSettings` row, read newest-first, updated in place or created on first save. `[Implemented]` `src/pages/ThemeEditor.jsx:83,165-170` (canonical: `preferences.md` AR-PREF-10, AR-PREF-11)
- **BR-THEME-04** Fonts are limited to the five listed options; font size to small/medium/large with the fixed pixel mapping. `[Implemented]` `src/pages/ThemeEditor.jsx:26-38` (D-922)
- **BR-THEME-05** Opacity ranges 10–100 in steps of 5; radius 0–24 in steps of 2. `[Implemented]` `src/pages/ThemeEditor.jsx:264,271`
- **BR-THEME-06** The background library holds at most 20 URLs, newest first, without duplicates. `[Implemented]` `src/pages/ThemeEditor.jsx:131,160`
- **BR-THEME-07** The library is dual-stored: device key `theme_bg_history` and account field `background_library`; on load the two are merged (account first) and written back to the device; on Save the merged list plus the current background is written to both. `[Implemented]` `src/pages/ThemeEditor.jsx:91-96,157-174` (canonical: AR-PREF-06)
- **BR-THEME-08** Adding or removing a library entry updates the account field immediately only when a row id is held; otherwise the device copy alone changes until Save Theme creates the row. `[Implemented]` `src/pages/ThemeEditor.jsx:134-136,146-148`
- **BR-THEME-09** Saving always places the current `background_image` at the front of the library. `[Implemented]` `src/pages/ThemeEditor.jsx:159-161`
- **BR-THEME-10** With randomise on, each app load picks a random entry of the account library (or the 5 boot defaults); with randomise off, the saved `background_image` (or the built-in default URL) is shown. `[Implemented]` `src/App.jsx:101-109`
- **BR-THEME-11** The pre-React bootstrap randomises from the cached library unless `theme_randomize` is `"0"`; the boot writes `"1"` or removes the key, never `"0"`. `[Implemented]` `index.html:16-21`, `src/App.jsx:113-117` (D-923)
- **BR-THEME-12** Removing a URL from the library also deletes every default-flagged collage image with that URL, so backgrounds and default collage images share one pool. `[Implemented]` `src/pages/ThemeEditor.jsx:149-152` (canonical: `seed-data.md` §1.7)
- **BR-THEME-13** "Reset" restores the built-in defaults in memory only; "Set as Default" snapshots the working theme to the device key `default_theme`, which nothing reads. `[Implemented]` `src/pages/ThemeEditor.jsx:180-188` (Q-920)
- **BR-THEME-14** Dark mode is on at boot regardless of the theme, and turned off after sign-in only when the saved `dark_mode` is exactly `false`. `[Implemented]` `index.html:13`, `src/App.jsx:67,95`
- **BR-THEME-15** Font size is applied by the editor's live apply and not at app boot. `[Implemented]` `src/pages/ThemeEditor.jsx:106-109`, `src/App.jsx:84-126` (D-924)
- **BR-THEME-16** The dashboard greeting name is not set here; it is the "Custom Display Name" in Settings (`ThemeSettings.dashboard_header`). `[Implemented]` `src/pages/Settings.jsx:331-341,697-703`, `src/pages/Dashboard.jsx:154` (D-920)
- **BR-THEME-17** A hex value in the free-text colour field is converted to HSL on apply; the field accepts any text. `[Implemented]` `src/pages/ThemeEditor.jsx:40-56,102-103,208,215`

### 5a. State & lifecycle

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| no `ThemeSettings` row | Save Theme | row created with the ten theme fields + `background_library` | row id held; device library mirrored; "Saved!" 2 s `src/pages/ThemeEditor.jsx:167-177` |
| row | Save Theme | row updated with all loaded fields + edits + library | as above `src/pages/ThemeEditor.jsx:165-166` |
| working theme (any) | Reset | built-in defaults, live-applied | none persisted `src/pages/ThemeEditor.jsx:186-188` |
| working theme (any) | Set as Default | unchanged | device `default_theme` written; "Set as Default!" 2 s `src/pages/ThemeEditor.jsx:180-184` |
| library | add URL | URL at front, cap 20 | device key; account field if id held `src/pages/ThemeEditor.jsx:128-139` |
| library | remove URL | URL gone | device key; account field if id held; matching default collage images deleted `src/pages/ThemeEditor.jsx:141-155` |
| `randomize_background` off/on | switch | on/off | live apply re-evaluates the background source `src/pages/ThemeEditor.jsx:112-116,383` |

### 5b. Time & date semantics

- None; the feature keeps no dates. The only timers are the 300 ms load delay and the 2-second confirmation labels `[Implemented]` `src/pages/ThemeEditor.jsx:74,177,183`. No AR-TIME divergence.

## 6. Data

- Owned fields (writer): `ThemeSettings.primary_color`, `accent_color`, `background_image`, `background_library`, `widget_bg_opacity`, `font_size`, `heading_font`, `body_font`, `dark_mode`, `widget_border_radius`, `randomize_background` `[Implemented]` `src/pages/ThemeEditor.jsx:157-170`; field register in `preferences.md` A.2 and `data-model/settings.md`.
- Reads: `ThemeSettings.list("-updated_date", 1)` `[Implemented]` `src/pages/ThemeEditor.jsx:83`; `CollageImage.filter({ image_url, is_default: true }, "", 100)` `[Implemented]` `src/pages/ThemeEditor.jsx:150`
- Writes: `ThemeSettings.update` (library on add/remove; whole theme on Save) and `create` `[Implemented]` `src/pages/ThemeEditor.jsx:135,147,166,168`; `CollageImage.delete` `[Implemented]` `src/pages/ThemeEditor.jsx:151`
- Integrations: `Core.UploadFile({ file })` → `file_url` `[Implemented]` `src/pages/ThemeEditor.jsx:290`
- Referenced, not written here: `dashboard_header`, feature toggles, `widget_order`, `onboarding_status`, sync fields (written back unchanged on Save, see Q-921) `[Implemented]` `src/pages/ThemeEditor.jsx:87-88,163`

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| out | App shell (boot) | saved theme applied after sign-in; background chosen and cached to the device | `src/App.jsx:80-133`, `index.html:11-28` |
| out | Every widget card | `--widget-opacity` and `--widget-radius` tokens | `src/components/WidgetCard.jsx:33-36` |
| out | Vision Board (collage) | removing a library URL deletes default-flagged collage images with that URL | `src/pages/ThemeEditor.jsx:149-152` |
| in | Settings | "Custom Display Name" writes `dashboard_header` on the same row | `src/pages/Settings.jsx:331-341` |
| in | Dashboard | greeting reads `dashboard_header` | `src/pages/Dashboard.jsx:154` |
| in | Onboarding / Tasks / Goals / Settings | other writers of the same row (`preferences.md` AR-PREF-11); Save Theme rewrites their fields as loaded | `src/pages/ThemeEditor.jsx:163-166` |
| in | File upload integration | background upload | `src/pages/ThemeEditor.jsx:290` |

No deep links with query parameters in or out `[Implemented]` `src/pages/ThemeEditor.jsx:1-413`.

### 7a. Feedback & notifications

- Transient button labels: "Saved!" and "Set as Default!" for 2 seconds `[Implemented]` `src/pages/ThemeEditor.jsx:176-177,182-183,195-196`
- Value readouts beside the sliders: "{n}%" and "{n}px" `[Implemented]` `src/pages/ThemeEditor.jsx:262,269`
- Selected-tile outline in both background grids `[Implemented]` `src/pages/ThemeEditor.jsx:343-345,365-367`
- Hint text when randomise is on with no library `[Implemented]` `src/pages/ThemeEditor.jsx:386-388`
- Toasts, alerts, confirm dialogs, celebratory effects: none observed `[Implemented]` `src/pages/ThemeEditor.jsx:1-11` (no toast or dialog import); library removal and collage deletion happen without confirmation `[Implemented]` `src/pages/ThemeEditor.jsx:141-155,370`

## 8. AI & automation

None. No model call or workflow touches the theme `[Implemented]` `src/pages/ThemeEditor.jsx:1-413`, `10-architecture/ai-services.md` §1, `10-architecture/automations.md` §2-3.

## 9. Onboarding content

None. The page has no walkthrough, no Guide button, and no onboarding key `[Implemented]` `src/pages/ThemeEditor.jsx:1-11,61-62,190-198` (no onboarding import; header right slot unused); the onboarding registry in `preferences.md` Part C lists no Theme Editor entry.

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `theme_bg_history` | device copy of the background library (JSON string[], max 20, newest first) | `[]` | load merge, add, remove, Save `src/pages/ThemeEditor.jsx:96,132,144,174` | per-URL remove `src/pages/ThemeEditor.jsx:143-144`; never deleted as a key |
| `theme_active_bg` | URL that overrides `background_image` during live apply while randomising | absent | no writer in the repository | never (`preferences.md` D-122, Q-104) |
| `default_theme` | JSON snapshot of the working theme from "Set as Default" | absent | `src/pages/ThemeEditor.jsx:181` | never; no reader |
| `theme_last_bg` | last background applied at boot, re-applied before the account loads | absent | `src/App.jsx:125` | never |
| `theme_bg_library` | boot's copy of the account library (or the 5 boot defaults) for the pre-React pick | `[]` → bootstrap uses the built-in default | `src/App.jsx:112` | never |
| `theme_randomize` | `"1"` when randomise is on; bootstrap randomises unless `"0"` | absent (treated as randomise) | `src/App.jsx:114` | removed when randomise is off `src/App.jsx:116` |

The last three are owned by `20-features/app-shell` and registered in `preferences.md` Part D; they are listed here because the Theme Editor's choices feed them.

## 11. Seed / hardcoded data used

- Editor defaults, font options, size mapping, slider ranges, library cap: `seed-data.md` §11.1 `[Implemented]` `src/pages/ThemeEditor.jsx:13-38,131,264,271`
- Default Backgrounds gallery (21 URLs, in order): `seed-data.md` §11.2 `[Implemented]` `src/pages/ThemeEditor.jsx:318-340`
- Boot default URL and 5-entry boot library: `seed-data.md` §11.3 `[Implemented]` `src/App.jsx:50-58`, `index.html:14`
- Preview strings: "Heading Preview", "This is body text preview. The quick brown fox jumps over the lazy dog.", "Primary Button", "Outline Button", "Secondary", "Primary", "Accent", "Muted" `[Implemented]` `src/pages/ThemeEditor.jsx:397-407`
- Hint and placeholder: "Save some backgrounds to your library first.", "https://images.unsplash.com/...", "Choose Image", "Add to My Backgrounds" `[Implemented]` `src/pages/ThemeEditor.jsx:296,306,350,387`

## 12. Print / email formats

None observed. The page has no print or email trigger `[Implemented]` `src/pages/ThemeEditor.jsx:1-11,190-412`.

## 13. Acceptance criteria

- **AC-THEME-01** Given no `ThemeSettings` row, When the page opens, Then the controls show primary `#1a9a7a`, accent `#e6930e`, Dark Mode off, Playfair Display / Inter, Medium, 90%, 12px, empty Image URL, Randomize on. (refs BR-THEME-01)
- **AC-THEME-02** Given the page is loaded, When the primary colour is changed, Then the app's primary colour changes immediately and the account row is unchanged until Save Theme. (refs BR-THEME-02)
- **AC-THEME-03** Given edits have been made, When "Save Theme" is pressed, Then the newest `ThemeSettings` row holds the ten theme fields and the label reads "Saved!" for about 2 seconds. (refs BR-THEME-03)
- **AC-THEME-04** Given Dark Mode is switched on, When the switch is toggled, Then the document gains the `dark` class; off removes it. (refs BR-THEME-02)
- **AC-THEME-05** Given Font Size "Large", When applied, Then the root text size is 18px. (refs BR-THEME-04)
- **AC-THEME-06** Given the opacity slider, When dragged, Then it moves only in steps of 5 between 10 and 100 and the readout shows "{n}%". (refs BR-THEME-05)
- **AC-THEME-07** Given a library of 20 URLs, When a 21st is added, Then the library holds 20 with the new URL first and the oldest dropped. (refs BR-THEME-06)
- **AC-THEME-08** Given a URL already in the library, When it is added again, Then it moves to the front and no duplicate exists. (refs BR-THEME-06)
- **AC-THEME-09** Given an account library `[A]` and a device library `[B]`, When the page loads, Then "My Backgrounds" shows A then B and `theme_bg_history` equals `["A","B"]`. (refs BR-THEME-07)
- **AC-THEME-10** Given no row id is held, When a URL is added to the library, Then only `theme_bg_history` changes; When Save Theme is then pressed, Then the created row's `background_library` includes it. (refs BR-THEME-08)
- **AC-THEME-11** Given `background_image` is X and X is not in the library, When Save Theme is pressed, Then the saved library starts with X. (refs BR-THEME-09)
- **AC-THEME-12** Given a library URL that also exists as a `CollageImage` with `is_default: true`, When its "X" is pressed, Then the URL leaves the library and that collage image row is deleted. (refs BR-THEME-12)
- **AC-THEME-13** Given a gallery tile, When it is clicked, Then `background_image` becomes its URL and the body background changes; When its hover "+" is pressed instead, Then the URL joins "My Backgrounds" and `background_image` is unchanged. (refs §4)
- **AC-THEME-14** Given an image file, When "Choose Image" is used, Then the uploaded file's URL becomes `background_image` and appears first in "My Backgrounds". (refs §4)
- **AC-THEME-15** Given Randomize is on and the library is empty, When the card renders, Then "Save some backgrounds to your library first." is shown. (refs §4c)
- **AC-THEME-16** Given `randomize_background` saved as true with library `[A, B, C]`, When the app is reloaded and sign-in completes, Then the body background is one of A, B, C, `theme_last_bg` holds it, `theme_bg_library` equals `["A","B","C"]`, and `theme_randomize` is `"1"`. (refs BR-THEME-10)
- **AC-THEME-17** Given `randomize_background` saved as false and `background_image` D, When the app is reloaded and sign-in completes, Then the body background is D and `theme_randomize` is absent. (refs BR-THEME-10)
- **AC-THEME-18** Given edits have been made, When "Reset" is pressed, Then the controls return to the values in AC-THEME-01, the app reflects them, and the account row is unchanged. (refs BR-THEME-13)
- **AC-THEME-19** Given the working theme, When "Set as Default" is pressed, Then `default_theme` holds its JSON and the label reads "Set as Default!" for about 2 seconds. (refs BR-THEME-13)
- **AC-THEME-20** Given the page is open, When looked at, Then there is no control for the dashboard greeting name. (refs BR-THEME-16)

## 14. Discrepancies & open questions

- **D-920** The manual lists "Dashboard header name: Customize the greeting name shown on the Dashboard." under Theme Editor (`src/pages/UserManual.jsx:397`); the control is "Custom Display Name" on the Settings page, writing `ThemeSettings.dashboard_header` (`src/pages/Settings.jsx:331-341,697-703`), and the Theme Editor has no such field (`src/pages/ThemeEditor.jsx:190-411`).
- **D-921** The manual says "All theme changes are saved automatically and applied app-wide instantly." (`src/pages/UserManual.jsx:398`); changes apply live but reach the account only on "Save Theme" (`src/pages/ThemeEditor.jsx:78-80,157-178`).
- **D-922** The manual says fonts are chosen "from Google Fonts" (`src/pages/UserManual.jsx:395`); the selects offer a fixed list of five (`src/pages/ThemeEditor.jsx:26-32`).
- **D-923** With randomise off, the app boot applies `background_image` (`src/App.jsx:108`) and removes `theme_randomize` (`src/App.jsx:116`); the pre-React bootstrap randomises from the cached library unless that key is `"0"` (`index.html:16-21`), which no code writes, so the first paint before sign-in shows a random library entry.
- **D-924** The editor's live apply sets the root text size from `font_size` (`src/pages/ThemeEditor.jsx:106-109`); the app boot applies every other saved theme field but not `font_size` (`src/App.jsx:84-126`).
- **D-925** Opening the Theme Editor with no saved row live-applies the editor defaults, light mode and 90% opacity (`src/pages/ThemeEditor.jsx:13-24,84,100-111`); until then the boot has applied dark mode and 70% (`index.html:13`, `src/App.jsx:67,98`). Extends D-121 (`seed-data.md`) from defaults to observed behaviour.
- Cross-references: D-121 (editor vs entity defaults), D-122 (`theme_active_bg` vs `theme_last_bg`) and Q-104 are logged in `seed-data.md` and `preferences.md`.
- **Q-920** Blocks: §4 Action bar. "Set as Default" writes `default_theme` (`src/pages/ThemeEditor.jsx:181`) and nothing reads it; "Reset" restores the hardcoded defaults (`src/pages/ThemeEditor.jsx:186-188`). What is the snapshot meant to restore, and from where?
- **Q-921** Blocks: §4 Action bar, §6. Save Theme spreads every loaded row field back into the update (`src/pages/ThemeEditor.jsx:87-88,163-166`), including fields other pages write (`onboarding_status`, `widget_order`, feature toggles, `dashboard_header`, sync settings). Is the intent to save only the ten theme fields?
- **Q-922** Blocks: §4 "Background Image" card. Removing a library URL deletes matching default collage images without confirmation (`src/pages/ThemeEditor.jsx:149-152,370-373`). Is the shared pool between backgrounds and default collage images intended to be visible to the account owner?
