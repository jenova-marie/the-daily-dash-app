# Calendar — Deleted Item Review (tombstones)

**Feature code:** `CAL` · **Level:** 2 · **Parent:** `20-features/calendar/spec.md` · **Status:** draft

**Tag summary:** Implemented 23 · Described 2 · Partial 3

**Sources owned:** `src/components/DeletedItemReview.jsx`
**Sources referenced (owned elsewhere):** `base44/entities/DeletedSyncItem.jsonc` → `10-architecture/data-model/`; `base44/functions/deleteSyncedData` → `20-features/settings`; `base44/entities/ScheduleItem.jsonc` → `10-architecture/schedule-hub.md`; sync functions → `10-architecture/google-sync.md`

## 1. Purpose

A banner at the top of the Calendar page that lists **tombstones** (glossary): records of items that disappeared from Google and are awaiting the account owner's decision to keep them deleted or restore them.

User Manual, Settings section "Data Management" (`src/pages/UserManual.jsx:436`), verbatim: "You can also review and manage **deleted sync items** to prevent unwanted re-imports." `[Described]`

Walkthrough step 3 (`src/components/onboarding/CalendarOnboarding.jsx:19`), verbatim: "When you delete a synced item, you can choose to remove it from Google too or just from this app." `[Described]` (This describes the delete dialog in the parent spec, not the banner.)

## 2. Where it appears

- Rendered as the first element of the Calendar page, above the calendar and events cards. `[Implemented]` `src/pages/CalendarPage.jsx:218-219`
- While its query runs, the banner area shows the text "Loading pending items..." `[Implemented]` `src/components/DeletedItemReview.jsx:50-56`
- When there are no pending tombstones the banner renders nothing. `[Implemented]` `src/components/DeletedItemReview.jsx:58-60`
- The pending list is fetched once, when the Calendar page mounts; it is not refreshed by the page's realtime reload or after an import. `[Implemented]` `src/components/DeletedItemReview.jsx:12-21`

## 3. Copy (verbatim)

- Heading: "Items Deleted from Google Calendar" `[Implemented]` `src/components/DeletedItemReview.jsx:64`
- Body: "These items were permanently deleted from your Google Calendar. Confirm whether you want to keep them deleted or restore them." `[Implemented]` `src/components/DeletedItemReview.jsx:65-67`
- Per row: the tombstone's `title` on the first line and its `sync_source` on the second. `[Implemented]` `src/components/DeletedItemReview.jsx:71-74`
- Two icon buttons per row: an X titled "Keep deleted (don't restore)" and a check titled "Restore to calendar". `[Implemented]` `src/components/DeletedItemReview.jsx:76-95`
- The row list is height-capped and scrolls when it overflows. `[Implemented]` `src/components/DeletedItemReview.jsx:68`

## 4. What a tombstone contains

Entity **E-DeletedSyncItem** (`base44/entities/DeletedSyncItem.jsonc`), per-user rows. `[Implemented]` `base44/entities/DeletedSyncItem.jsonc:1-60`

| Field | Type | Meaning | Required |
|---|---|---|---|
| `source_type` | enum `calendar`, `task` | what kind of item was deleted | yes |
| `google_id` | string | the Google identifier of the deleted item | yes |
| `title` | string | title of the deleted item | yes |
| `sync_source` | string | which sync (calendar or task) detected the deletion; shown under the title | yes |
| `last_detected` | date-time | last time the deletion was detected during sync | no |
| `status` | enum `pending_review` (default), `denied`, `allowed` | the account owner's decision on whether to allow re-sync | no |

The banner reads rows with `status: pending_review`, sorted by `last_detected` descending, up to 100. `[Implemented]` `src/components/DeletedItemReview.jsx:18`

## 5. Decisions

### Allow (X — "Keep deleted (don't restore)")

- Sets the tombstone's `status` to `allowed` and removes the row from the banner. No schedule item is touched. `[Implemented]` `src/components/DeletedItemReview.jsx:23-28`
- Meaning, per the entity description: the deletion is accepted; the item may stay deleted. `[Implemented]` `base44/entities/DeletedSyncItem.jsonc:30-39`

### Deny (check — "Restore to calendar")

- When the tombstone's `source_type` is `calendar`, a new schedule item is created with exactly these values, then the tombstone's `status` is set to `denied` and the row is removed from the banner. `[Implemented]` `src/components/DeletedItemReview.jsx:30-48`

  | Field | Value |
  |---|---|
  | `title` | the tombstone's `title` |
  | `date` | the current date taken from the UTC ISO timestamp (`YYYY-MM-DD`) |
  | `start_time` | `09:00` |
  | `end_time` | `10:00` |
  | `source_type` | `calendar` |
  | `source_id` | the tombstone's `google_id` |
  | `color` | `#3b82f6` |
  | `google_event_id`, `google_calendar_id`, `notes`, flags | not set (entity defaults: `completed`, `deleted_from_app`, `hidden_from_grid`, `hidden_from_todo` all false) |

- The recreated event is therefore not a Google-linked event in the parent spec's sense (`google_event_id` is absent): its delete dialog shows the unlinked variant and edits are not pushed. `[Implemented]` `src/components/DeletedItemReview.jsx:35-43`; `src/components/SwipeableEventItem.jsx:84,155`
- The original date and times are not part of the tombstone, so the restored event always lands on the current date at 09:00–10:00. `[Implemented]` `base44/entities/DeletedSyncItem.jsonc:4-40`; `src/components/DeletedItemReview.jsx:37-39`
- When the tombstone's `source_type` is `task`, nothing is recreated; only the status becomes `denied`. `[Implemented]` `src/components/DeletedItemReview.jsx:34,45`
- While either decision runs, both buttons on that row are disabled. `[Implemented]` `src/components/DeletedItemReview.jsx:10,24,31,81,91`

### 5a. State & lifecycle

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| tombstone `pending_review` | Allow | `allowed` | row removed from banner `src/components/DeletedItemReview.jsx:23-28` |
| tombstone `pending_review`, `source_type: calendar` | Deny | `denied` | `ScheduleItem` created as in §5; row removed `src/components/DeletedItemReview.jsx:30-48` |
| tombstone `pending_review`, `source_type: task` | Deny | `denied` | row removed `src/components/DeletedItemReview.jsx:34,45-47` |
| any tombstone | Settings "delete all app data" | row deleted | via `deleteSyncedData` with `deleteAllAppData` (owned by `20-features/settings`) `base44/functions/deleteSyncedData/entry.ts:49-63` |

## 6. Business rules

- **BR-CAL-22** Only tombstones whose status is `pending_review` are shown; `allowed` and `denied` tombstones never reappear in the banner. `[Implemented]` `src/components/DeletedItemReview.jsx:18`
- **BR-CAL-23** A restore creates a fresh `calendar`-sourced schedule item keyed to the Google item by `source_id`, never by `google_event_id`. `[Implemented]` `src/components/DeletedItemReview.jsx:35-43`
- **BR-CAL-24** Restoring a `task` tombstone records the decision only. `[Implemented]` `src/components/DeletedItemReview.jsx:34-45`
- **BR-CAL-25** The tombstone's stated purpose is to record "whether to allow re-sync"; how a decision affects a later import is owned by `10-architecture/google-sync.md`. `[Partial]` `base44/entities/DeletedSyncItem.jsonc:30-39` (no reader of `status` outside this banner observed in `src/` or `base44/functions/`)

## 7. When the banner appears — population of the queue

- The banner appears whenever at least one tombstone with `status: pending_review` exists for the account when the Calendar page mounts. `[Implemented]` `src/components/DeletedItemReview.jsx:16-21,58-60`
- **No writer of tombstones is observed.** The entity exists (`base44/entities/DeletedSyncItem.jsonc`), the banner reads and updates it, and the Settings purge deletes it, but no code in `src/` or `base44/functions/` creates a `DeletedSyncItem` row or sets `pending_review`. The import functions are the only plausible source and they reference neither the entity nor the status. `[Partial]` `src/components/DeletedItemReview.jsx:18`; `base44/functions/deleteSyncedData/entry.ts:49-53` (Q-500)
- The heading and body copy speak of "Google Calendar" while the entity admits `task` tombstones and displays `sync_source` per row. `[Partial]` `src/components/DeletedItemReview.jsx:64-67,73`; `base44/entities/DeletedSyncItem.jsonc:5-12`

## 8. Time & date semantics

- The restored event's `date` is the UTC calendar date at the moment of restore (`toISOString().split('T')[0]`). This diverges from the parent spec's device-local "today" (`AR-TIME` in `10-architecture/time-and-date-semantics.md`). `[Implemented]` `src/components/DeletedItemReview.jsx:37` (D-510)

## 9. Acceptance criteria

- **AC-CAL-28** Given two `pending_review` tombstones exist, When the Calendar page opens, Then the banner shows "Items Deleted from Google Calendar" with both rows, newest `last_detected` first.
- **AC-CAL-29** Given no `pending_review` tombstones, When the Calendar page opens, Then no banner is shown after the brief "Loading pending items..." text.
- **AC-CAL-30** Given a `calendar` tombstone titled "Dentist", When "Restore to calendar" is clicked, Then a `calendar`-sourced schedule item "Dentist" exists dated on the current UTC date from 09:00 to 10:00 with `source_id` equal to the tombstone's `google_id` and colour `#3b82f6`, and the tombstone's status is `denied`. (refs BR-CAL-23)
- **AC-CAL-31** Given a `task` tombstone, When "Restore to calendar" is clicked, Then no schedule item is created and the status is `denied`. (refs BR-CAL-24)
- **AC-CAL-32** Given any tombstone, When "Keep deleted (don't restore)" is clicked, Then its status is `allowed`, the row disappears, and no schedule item changes. (refs BR-CAL-22)
- **AC-CAL-33** Given a restored event, When its row's delete button is used on the Calendar page, Then the unlinked dialog variant ("This action cannot be undone.") is shown. (refs BR-CAL-23)

## 10. Discrepancies & open questions

- **D-510** The restore path uses the UTC calendar date (`src/components/DeletedItemReview.jsx:37`); the Calendar page uses the device-local date for today (`src/pages/CalendarPage.jsx:33-36,320`).
- **Q-500** Blocks: §7. Question: what populates `DeletedSyncItem` with `status: pending_review`? No writer is observed in `src/` or `base44/functions/`.
- **Q-505** Blocks: §6 BR-CAL-25. Question: how are `allowed` and `denied` tombstones meant to influence a later import (the entity says "whether to allow re-sync"), given no reader of `status` beyond the banner is observed?
- **Q-506** Blocks: §5. Question: the restore has no original date or times available on the tombstone; is landing on the current date at 09:00–10:00 the intended outcome, or is a later import expected to correct it?
