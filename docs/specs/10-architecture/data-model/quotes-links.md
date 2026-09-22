# Data Model — Quotes & Links

**Area:** `DATA` · **Level:** 2 · **Status:** draft · Conventions: `README.md`

### DailyQuote   (E-DailyQuote)

**Purpose.** The quote for one date with author, the user's reflection, and a favourite flag. `[Implemented]`
`base44/entities/DailyQuote.jsonc:1-41`

**Source file.** `base44/entities/DailyQuote.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/DailyQuote.jsonc:27-40`

**Service-role bypasses.** `generateDailyQuotes` (admin, scheduled 07:00 UTC) lists all users, filters each
user's quotes by `created_by`, and creates with explicit `created_by`. `deleteUserAccount` deletes by
`created_by`. `[Implemented]` `base44/functions/generateDailyQuotes/entry.ts:23-37,81-87`,
`base44/functions/deleteUserAccount/entry.ts:64-66`, `base44/workflows/Midnight Daily Quote Generator.jsonc:10-33`

**Cardinality.** One per date by convention. The fetch function returns the newest existing row for the date
and deletes any extra rows for that date; with `force` it deletes all rows for the date and creates a new
one; the scheduled generator skips users who already have a row for today. `[Implemented]`
`base44/functions/fetchDailyQuote/entry.ts:20-33,77-82`, `base44/functions/generateDailyQuotes/entry.ts:30-34`

**Writers.** create: `base44/functions/fetchDailyQuote/entry.ts:77`, `base44/functions/generateDailyQuotes/entry.ts:81`,
`src/pages/Quotes.jsx:114,127`. update: `src/pages/Quotes.jsx:111,142`, `src/components/dashboard/DashboardQuote.jsx:64`.
delete: `base44/functions/fetchDailyQuote/entry.ts:25,32`, `src/pages/Quotes.jsx:171,177`,
`base44/functions/deleteSyncedData/entry.ts:56`, `base44/functions/deleteUserAccount/entry.ts:64-66`.
**Readers.** `base44/functions/fetchDailyQuote/entry.ts:16`, `base44/functions/generateDailyQuotes/entry.ts:30,37`,
`src/components/dashboard/DashboardQuote.jsx:36`, `src/pages/Quotes.jsx:79,95`.

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `quote` | string | yes | — | text ≤ 220 chars from the quote API, or LLM output | The quote | `fetchDailyQuote:78`, `generateDailyQuotes:82`, `Quotes.jsx:114,128` | no-repeat set (trimmed, lower-cased) `fetchDailyQuote:17`, `generateDailyQuotes:38`; LLM prompt uses first 60 chars of the 20 newest |
| `author` | string | no | — | free text | Author | same | rendering, email |
| `date` | string | yes | — | `YYYY-MM-DD`; client sends its local date; the scheduled job uses the server's `en-CA` date | The day | same | `fetchDailyQuote:20`, `generateDailyQuotes:30`, `DashboardQuote.jsx:36` |
| `reflection` | string | no | — | free text | User's response | `Quotes.jsx:111,114` | `Quotes.jsx:75,99` |
| `is_favorite` | boolean | no | `false` | — | Favourite | creators write `false` (functions) or `true` (`Quotes.jsx:128`); toggles `Quotes.jsx:142`, `DashboardQuote.jsx:64` | "delete all" keeps favourites `Quotes.jsx:176` |

**References out / Referenced by.** None.

**Lifecycle.**
- *Created* by the fetch function (up to 8 API attempts avoiding the 200 most recent quotes, then an LLM
  fallback), by the scheduled generator per user, or by the Quotes page when saving a reflection or favourite
  for a quote object that has no id. `[Implemented]` `base44/functions/fetchDailyQuote/entry.ts:35-82`,
  `base44/functions/generateDailyQuotes/entry.ts:40-89`, `src/pages/Quotes.jsx:108-136`
- *Updated*: reflection text; favourite toggle. `[Implemented]` `src/pages/Quotes.jsx:108-118,120-148`,
  `src/components/dashboard/DashboardQuote.jsx:60-65`
- *Hard-deleted*: duplicate rows for the date (silently), all rows for the date on forced refresh, one past
  quote, all past quotes with or without favourites, full wipe, account deletion. `[Implemented]`
  `base44/functions/fetchDailyQuote/entry.ts:22-33`, `src/pages/Quotes.jsx:170-180`,
  `base44/functions/deleteSyncedData/entry.ts:56`, `base44/functions/deleteUserAccount/entry.ts:64-66`
- *Purged*: none beyond the above.

**Ordering & read-time sort/limit.** `-created_date` 200 (no-repeat history), `-created_date` 1 filtered on
today (generator), `-date` 50 (Quotes page history), `filter({ date: today })` (dashboard). `[Implemented]`
`base44/functions/fetchDailyQuote/entry.ts:16`, `base44/functions/generateDailyQuotes/entry.ts:30,37`,
`src/pages/Quotes.jsx:79,95`, `src/components/dashboard/DashboardQuote.jsx:36`

**Denormalised caches.** None. **Retention.** Indefinite; the no-repeat window is the 200 newest rows.

**Declared-but-unwritten / Written-but-undeclared fields.** None (the generator's explicit `created_by` is an
implicit field). **Required-but-written-empty.** None observed.

---

### Link   (E-Link)

**Purpose.** A saved URL with title, a category name (categories themselves are device-local), and a
thumbnail that is either an image URL or an encoded icon. `[Implemented]` `base44/entities/Link.jsonc:1-36`,
`src/pages/Links.jsx:71-89,508-514`

**Source file.** `base44/entities/Link.jsonc`

**Declared RLS.** Standard four-operation `created_by` rule. `[Implemented]` `base44/entities/Link.jsonc:22-35`

**Service-role bypasses.** `deleteUserAccount`. `[Implemented]` `base44/functions/deleteUserAccount/entry.ts:67-69`

**Cardinality.** Many; no uniqueness rule (bookmark import creates one row per `http(s)` anchor).
`[Implemented]` `src/pages/Links.jsx:199-209`

**Writers.** create: `src/pages/Links.jsx:179,209`. update: `src/pages/Links.jsx:146,177`. delete:
`src/pages/Links.jsx:186`, `base44/functions/deleteSyncedData/entry.ts:56`, `base44/functions/deleteUserAccount/entry.ts:67-69`.
**Readers.** `src/pages/Links.jsx:119` (`list("-created_date")`, no limit).

| Field | Type | Required | Default | Enum / format / inner shape | Meaning | Written by | Read by |
|---|---|---|---|---|---|---|---|
| `title` | string | yes | — | free text; import uses anchor text or the hostname | Name | `Links.jsx:177,179,205` | rendering |
| `url` | string | yes | — | `http://` or `https://` URL | Target | same | `LinkCard` anchor `Links.jsx:568` |
| `category` | string | no | — | free-text category name; `"Imported"` for bookmark imports; `""` when its category is deleted | Grouping | `Links.jsx:146,177,179,205` | `Links.jsx:151-159` |
| `thumbnail_url` | string | no | — | image URL, or `icon:<IconName>\|<hex>` (see `json-string-fields.md`) | Thumbnail | `Links.jsx:177,179` via `ThumbnailPicker` (`:514`) | `Links.jsx:562-577` |

**References out.** `category` → a device-local category record (`link_categories_v2`) by name; names found
on links but missing locally get a default icon/colour. `[Implemented]` `src/pages/Links.jsx:71-89,150-156`
**Referenced by.** None.

**Lifecycle.** *Created* from the form or bookmark import; *updated* from the form, or `category` cleared
when a category is deleted; *hard-deleted* singly, by the full wipe, and on account deletion. `[Implemented]`
`src/pages/Links.jsx:142-148,174-188,190-222`, `base44/functions/deleteSyncedData/entry.ts:56`,
`base44/functions/deleteUserAccount/entry.ts:67-69`

**Ordering & read-time sort/limit.** `-created_date`, unlimited. **Denormalised caches / Retention.** None / indefinite.

**Declared-but-unwritten / Written-but-undeclared / Required-but-written-empty.** None observed.

---

## Discrepancies & open questions (this sheet)

- None beyond those listed in `flags-and-lifecycle.md` §7.
