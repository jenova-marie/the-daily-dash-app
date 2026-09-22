# Vision Board — Collage — Feature Spec

**Feature code:** `VB-COL` · **Level:** 2 (sub-spec of `20-features/vision-board/spec.md`) · **Status:** draft

**Tag summary:** Implemented 97 · Described 5 · Partial 21

**Sources owned:** `src/components/visionboard/ImageGallery.jsx`, `src/components/visionboard/ImageUploadSection.jsx`, `src/components/visionboard/PrivateImageUploader.jsx`, `src/pages/VisionBoard.jsx:59-71,116-155,177-206,344-419` (Collage tab layout, private-image resolver, custom image picker, "save current images as defaults")
**Sources referenced (owned elsewhere):** `src/components/visionboard/LowScorePillars.jsx` → `20-features/vision-board/spec.md` · `src/components/dashboard/DashboardSlideshow.jsx`, `src/components/visionboard/Slideshow.jsx` → `slideshow.md` · `src/components/WidgetCard.jsx` → `10-architecture/export-print-email.md` · `base44/functions/initializeDefaultCollageImages`, `makeImagesDefaults`, `backfillDefaultImagesToAllUsers`, `deleteSyncedData` → `10-architecture/admin-operations.md` · upload and signed-URL integrations → `10-architecture/external-services.md` §6.3–6.4 · `base44/entities/CollageImage.jsonc`, `UserCollageImage.jsonc` → `10-architecture/data-model/vision-board.md` · `src/pages/ThemeEditor.jsx:149-152` → `20-features/theme-editor`

**Permissions:** per-user data (`CollageImage` and `UserCollageImage` rows are readable and writable only by their creator `[Implemented]` `base44/entities/CollageImage.jsonc:32-45`, `base44/entities/UserCollageImage.jsonc:34-47`); admin-only operations: `makeImagesDefaults`, `backfillDefaultImagesToAllUsers` (`admin-operations.md` §2.2–2.3), none reachable from this page

## 0. Entry points & navigation

- Route: `/visionboard` → tab trigger **Collage** (fourth of four: Pillars, Daily Eval, Weekly Review, Collage) → card titled **Vision Collage** `[Implemented]` `src/pages/VisionBoard.jsx:224-229,344-345`. Sidebar label, header title, and swipe order are in `spec.md` §0.
- Query parameters accepted: none select this tab; `?tab=evaluation` selects Daily Eval and everything else selects Pillars `[Implemented]` `src/pages/VisionBoard.jsx:67`.
- Lazy mount: the shared-image gallery and the private-image uploader are rendered only after the Collage tab trigger has been clicked at least once in the page's lifetime `[Implemented]` `src/pages/VisionBoard.jsx:71,228,366,371`.
- Feature-toggle gating: Vision Board toggle (`spec.md` §0; `preferences.md` AR-PREF-23).
- Header right-slot contents: Guide button (`affirmations.md` §9).
- Slideshow launch buttons at the top of the card are the entry points documented in `slideshow.md` §0 `[Implemented]` `src/pages/VisionBoard.jsx:347-364`.

## 1. Purpose & user benefit

The account owner assembles the images that the slideshow plays: a shared set stored by public URL (seeded for new accounts) and a private set uploaded from their device that only they can see.

- User Manual, verbatim: "**Vision Collage:** Upload public images (URL-based) or private images (securely stored, only visible to you). Toggle individual images to show or hide them from the slideshow. Private images are displayed via time-limited signed URLs." `[Described]` `src/pages/UserManual.jsx:372`
- Walkthrough step 4, verbatim: "Upload inspiring images and affirmations to the Collage tab. Create custom slideshows for meditation, or let AI auto-generate one based on your pillar weaknesses." `[Described]` `src/components/visionboard/OnboardingDialog.jsx:24`
- Landing page "Daily Reflection": "…vision-focused slideshows." `[Described]` `src/pages/LandingPage.jsx:13`

## 2. Concepts & vocabulary

- **collage** — glossary: the set of vision-board images, public URL images plus private uploads. The UI card is titled "Vision Collage"; the UI word "gallery" is not used as the term of record.
- **slideshow** — glossary; consumer of the collage (`slideshow.md`).
- **focal area** — glossary; the "Focus Areas for Today" panel on this tab is owned by `spec.md`.
- Feature-local: **shared image** — a `CollageImage` row: an image addressed by public URL, rendered directly. The Manual calls these "public images". **private image** — a `UserCollageImage` row: a file uploaded privately and rendered through a short-lived signed URL. **seed set** — the shared images flagged `is_default` that are copied into an account with no images. **hidden** — a shared image with `hidden_from_slideshow` true. **included** — a private image with `include_in_slideshow` true.

## 3. User stories

- **US-VB-COL-01** As the account owner, I want my board pre-filled with images when I first arrive so that the slideshow works before I upload anything. `[Implemented]` `base44/functions/initializeDefaultCollageImages/entry.ts:12-45`; `src/components/Layout.jsx:48`; `src/pages/AcceptTerms.jsx:54`
- **US-VB-COL-02** As the account owner, I want to browse my shared images page by page and hide any from the slideshow without deleting them. `[Implemented]` `src/components/visionboard/ImageGallery.jsx:43-48,62-127`
- **US-VB-COL-03** As the account owner, I want to delete a shared image and not see it come back. `[Implemented]` `src/components/visionboard/ImageGallery.jsx:24-25,35-41`
- **US-VB-COL-04** As the account owner, I want to upload my own photos privately so that nobody else can view them. `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:91-120,144-147`
- **US-VB-COL-05** As the account owner, I want to choose per private image whether it plays in the slideshow. `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:122-132,193-201`
- **US-VB-COL-06** As the account owner, I want to pick exactly which images a custom slideshow plays. `[Implemented]` `src/pages/VisionBoard.jsx:134-155,376-419`
- **US-VB-COL-07** As the account owner, I want to add a shared image by file or by URL. `[Partial]` `src/components/visionboard/ImageUploadSection.jsx:7-125` (component not mounted; see §4.3, D-755)

## 4. Capabilities & interactions

### 4.1 Collage tab layout

Inside the "Vision Collage" card, top to bottom `[Implemented]` `src/pages/VisionBoard.jsx:345-374`:

1. A row labelled "Play Slideshow:" with two pill buttons "▶ Auto-Generated" (sparkles icon) and "▶ Custom" (sliders icon) — behaviour in `slideshow.md` §0 `[Implemented]` `src/pages/VisionBoard.jsx:348-364`
2. The "✨ Focus Areas for Today" panel (`LowScorePillars`, owned by `spec.md`), present only when a pillar rated ≤ 3 today exists `[Implemented]` `src/pages/VisionBoard.jsx:365`; `src/components/visionboard/LowScorePillars.jsx:26-38`
3. The shared-image gallery (§4.2) `[Implemented]` `src/pages/VisionBoard.jsx:366`
4. A rule, the heading "My Private Images", and the private uploader (§4.5) `[Implemented]` `src/pages/VisionBoard.jsx:367-372`

Below the card: the custom-slideshow image picker dialog (§4.6) and the "Affirmations" card (`affirmations.md`) `[Implemented]` `src/pages/VisionBoard.jsx:376-429`.

### 4.2 Shared-image gallery (`ImageGallery`)

- Loads `CollageImage.list("order", 1000)` and drops any id present in the device list `deleted_collage_images` (§10) `[Implemented]` `src/components/visionboard/ImageGallery.jsx:18-33`
- Reloads whenever the page's refresh counter changes (after private-image changes, and after "save as defaults") `[Implemented]` `src/components/visionboard/ImageGallery.jsx:14-16`; `src/pages/VisionBoard.jsx:63,198,371`
- While loading: "Loading..." `[Implemented]` `src/components/visionboard/ImageGallery.jsx:50-52`
- Empty: "No images yet. Upload some to get started!" `[Implemented]` `src/components/visionboard/ImageGallery.jsx:54-60`
- Grid of thumbnails (2 / 3 / 4 columns by viewport width), **12 per page**; a pager "Page {n} of {total}" with previous/next icon buttons appears only when there is more than one page; previous is disabled on the first page and next on the last `[Implemented]` `src/components/visionboard/ImageGallery.jsx:6,62-68,103-127`
- The current page index is kept in memory and is not reset by a reload `[Implemented]` `src/components/visionboard/ImageGallery.jsx:11,14-16`
- Hovering a thumbnail darkens it and reveals two buttons at its top-right `[Implemented]` `src/components/visionboard/ImageGallery.jsx:70-78`:
  - **Eye** — title "Hide from slideshow" (eye icon) when visible, "Show in slideshow" (eye-off icon) when hidden; toggles `hidden_from_slideshow` and updates the thumbnail in place `[Implemented]` `src/components/visionboard/ImageGallery.jsx:43-48,79-87`
  - **Trash** — title "Delete image"; asks the browser confirm "Delete this image?"; on OK deletes the row, removes the thumbnail, and appends the id to `deleted_collage_images` `[Implemented]` `src/components/visionboard/ImageGallery.jsx:35-41,88-94`
- A hidden image is shown dimmed with a "Hidden" badge at its bottom-left (the dimming carries the hidden state) `[Implemented]` `src/components/visionboard/ImageGallery.jsx:75,96-98`
- Thumbnail alt text is the image title or "Collage image"; images load lazily `[Implemented]` `src/components/visionboard/ImageGallery.jsx:71-76`

### 4.3 Adding shared images (`ImageUploadSection`) — `[Partial]`

The component exists with the following behaviour but no page or component renders it (repository-wide search for `ImageUploadSection` finds only its own file). The gallery therefore offers no add control; shared images arrive through seeding (§4.7). Recorded against the Manual's claim in D-755.

- Default mode: an "Add Image" button (upload icon; "Uploading..." while busy) wrapping a single-file input that accepts `image/*`, and a ghost button "or use URL" (link icon) `[Partial]` `src/components/visionboard/ImageUploadSection.jsx:64-94`
- File path: the file is uploaded as a public file and a `CollageImage` is created with `image_url` = the returned URL, `title` = the file name before its first ".", `is_default: true` `[Partial]` `src/components/visionboard/ImageUploadSection.jsx:12-35` (upload mechanism: `external-services.md` §6.3)
- URL mode: an input of type url with placeholder "https://example.com/image.jpg", an "Add" button ("Adding..." while busy; disabled when blank) and "Cancel" (returns to default mode and clears the field) `[Partial]` `src/components/visionboard/ImageUploadSection.jsx:95-122`
- URL path: creates a `CollageImage` with `image_url` = the typed URL, `title` = the last path segment of the URL or "Image", `is_default: true`; then clears the field and returns to default mode `[Partial]` `src/components/visionboard/ImageUploadSection.jsx:37-60`
- Alerts: "Please enter a valid URL" (blank URL), "Failed to upload image", "Failed to add image from URL" `[Partial]` `src/components/visionboard/ImageUploadSection.jsx:38-41,31,56`
- Manual claim: "Upload public images (URL-based)…" `[Described]` `src/pages/UserManual.jsx:372`

### 4.4 "Save current images as defaults" — `[Partial]`

A page function exists; no button, menu, or effect invokes it (search of `src/pages/VisionBoard.jsx` finds only its definition; the `savingDefaults` state and the imported Save icon are unused) `[Partial]` `src/pages/VisionBoard.jsx:21,68,177-206`. Its behaviour when called:

1. Reads `CollageImage.list("order", 100)` and sets `is_default: false` on every row, in parallel `[Partial]` `src/pages/VisionBoard.jsx:180-187`
2. Then sets `is_default: true` on every entry of the page's in-memory picker list (`allCollageImages`, the combined shared-not-hidden plus private list built the last time the Custom picker was opened; empty if the picker has never been opened) `[Partial]` `src/pages/VisionBoard.jsx:189-196,137-141`
3. Bumps the gallery refresh counter and alerts "Current vision board images saved as defaults!"; on failure alerts "Failed to save defaults" `[Partial]` `src/pages/VisionBoard.jsx:198-203`

Open question Q-750. The admin-side equivalent that marks the caller's images as the seed set is `makeImagesDefaults` (`admin-operations.md` §2.2).

### 4.5 Private images (`PrivateImageUploader`)

- Header: a chip with a lock icon reading "Private — only visible to you", and a button "Upload My Images" (upload icon; "Uploading..." with a spinner while busy) wrapping a file input that accepts `image/*` and allows multiple files `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:143-164`
- Upload: files are processed one after another. For each: the file is uploaded privately (returns a `file_uri`); a signed URL valid for 3600 s is minted; a `UserCollageImage` is created with `file_uri`, `signed_url`, `signed_url_expires` = now + 3 600 000 ms, `title` = the file name before its first ".", `include_in_slideshow: true` `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:91-110` (service mechanics: `external-services.md` §6.4)
- After all files: the list reloads, the page is notified (gallery refresh), the input is cleared. Any failure alerts "Upload failed" `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:111-119`; `src/pages/VisionBoard.jsx:371`
- Listing: `UserCollageImage.list("order", 500)`; "Loading..." while loading; empty text "No private images yet. Upload your personal vision images here." `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:33-48,166-171`
- Display URLs: a cached signed URL is used at once when it expires more than 60 s from now; every image whose URL is missing or expires within 60 s gets a fresh 3600 s URL minted in parallel, shown as soon as it arrives, and written back to the row (`signed_url`, `signed_url_expires`) in the background. Until a URL resolves the tile shows a spinner `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:6-20,50-89,176-188`
- Tile states: an included image has a highlighted border and an "In slideshow" badge at bottom-left; an excluded image is dimmed with no badge (the border and dimming carry the include state) `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:177-183,210-215`
- Hover reveals two buttons at the tile's top-right `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:190-208`:
  - **Eye** — title "Remove from slideshow" when included, "Add to slideshow" when excluded; toggles `include_in_slideshow`, updates the tile, notifies the page `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:122-132,193-201`
  - **Trash** — browser confirm "Delete this private image?"; on OK deletes the row, removes the tile, notifies the page. No device list is kept for private deletions `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:134-139,202-207`
- Alt text is the title or "Private image" `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:179`

### 4.6 Custom-slideshow image picker

- "▶ Custom" builds the candidate list: shared images `CollageImage.list("order", 100)` minus hidden ones, followed by **every** private image (resolved through the page's resolver, which mints or refreshes signed URLs with the same 3600 s / 60 s rule and drops any image whose URL cannot be obtained), each private entry flagged as private; all candidates start selected; then the dialog opens `[Implemented]` `src/pages/VisionBoard.jsx:116-144,358`
- Dialog title: "Choose Images for Custom Slideshow" `[Implemented]` `src/pages/VisionBoard.jsx:377-381`
- Quick-select buttons: "All ({count})" selects every candidate; "Defaults ({count})" selects only candidates with `is_default` true (private images never carry that flag) `[Implemented]` `src/pages/VisionBoard.jsx:383-390`
- A three-column scrolling grid of thumbnails; a selected thumbnail has a yellow border; hovering reveals a star at the top-left which toggles selection (filled yellow when selected) `[Implemented]` `src/pages/VisionBoard.jsx:391-413`
- "Play ({N} images)" launches the Custom slideshow with the selected images (`slideshow.md` §4.1); disabled when nothing is selected `[Implemented]` `src/pages/VisionBoard.jsx:146-155,414-416`
- The dialog closes on launch, or by its overlay / Escape without launching `[Implemented]` `src/pages/VisionBoard.jsx:152,377`
- The candidate list persists in memory after the dialog closes and is what "save current images as defaults" would read (§4.4) `[Implemented]` `src/pages/VisionBoard.jsx:65,141`

### 4.7 Seed set for new accounts

- When an account has no `CollageImage` rows, every row flagged `is_default: true` from any owner (up to 100, sorted `-order`) is copied into the account with `is_default: false`, in batches of 10. This runs on every app-shell mount, on terms acceptance, and by a daily workflow; it writes nothing when the account already has any image `[Implemented]` `base44/functions/initializeDefaultCollageImages/entry.ts:12-45`; `src/components/Layout.jsx:48`; `src/pages/AcceptTerms.jsx:54`; `base44/workflows/Initialize Collage Images for All Users.jsonc` (specified in `admin-operations.md` §2.5, AR-ADMIN-18; `data-model/vision-board.md` E-CollageImage)
- Consequence for the picker: a fresh account's seeded images are not defaults, so "Defaults (0)" until rows are flagged by an admin function or by §4.4 `[Implemented]` `base44/functions/initializeDefaultCollageImages/entry.ts:26-31`; `src/pages/VisionBoard.jsx:387-389`
- Admin operations that mark or propagate the seed set: `makeImagesDefaults`, `backfillDefaultImagesToAllUsers` (`admin-operations.md` §2.2, §2.3). The concrete seed image URLs are not in the repository (`seed-data.md` §1.7, Q-100).
- Removing a URL from the Theme Editor's background library also deletes shared images with that `image_url` and `is_default: true` `[Implemented]` `src/pages/ThemeEditor.jsx:149-152` (owner: `20-features/theme-editor`; noted in `seed-data.md` §1.7)

### 4a. Keyboard & pointer

- Hover reveals the per-image eye and trash buttons in the gallery and the private list, and the star in the picker `[Implemented]` `src/components/visionboard/ImageGallery.jsx:78`; `src/components/visionboard/PrivateImageUploader.jsx:192`; `src/pages/VisionBoard.jsx:407`. How a touch-only device reaches these hover-revealed controls is not determinable from the source (Q-754).
- Picker dialog: overlay click or Escape closes it `[Implemented]` `src/pages/VisionBoard.jsx:377`
- No drag-and-drop, no double-click, no long-press; `order` is never written from the UI `[Implemented]` `src/components/visionboard/ImageGallery.jsx`, `src/components/visionboard/PrivateImageUploader.jsx` (no drag handlers; `data-model/vision-board.md` E-CollageImage "Declared-but-unwritten")
- Enter in the URL field (unmounted component) has no handler; Add is a button `[Partial]` `src/components/visionboard/ImageUploadSection.jsx:97-110`

### 4b. View state & persistence

| Control | Values | Default | Scope |
|---|---|---|---|
| Collage tab visited | true / false | false | memory `src/pages/VisionBoard.jsx:71,228` |
| Gallery page | 0 … pages−1 | 0 | memory `src/components/visionboard/ImageGallery.jsx:11` |
| Gallery refresh counter | integer | 0 | memory `src/pages/VisionBoard.jsx:63` |
| Shared image hidden | true / false | false | account `CollageImage.hidden_from_slideshow` `src/components/visionboard/ImageGallery.jsx:46` |
| Shared image default flag | true / false | false (seeded copies); true (user adds, unmounted) | account `CollageImage.is_default` `base44/functions/initializeDefaultCollageImages/entry.ts:30`; `src/components/visionboard/ImageUploadSection.jsx:25,48` |
| Deleted shared image ids | id list | `[]` | device `deleted_collage_images` (§10) |
| Private image included | true / false | true | account `UserCollageImage.include_in_slideshow` `src/components/visionboard/PrivateImageUploader.jsx:108,124` |
| Private signed URL cache | url + expiry | minted at upload | account `UserCollageImage.signed_url`, `signed_url_expires` `src/components/visionboard/PrivateImageUploader.jsx:105-106` |
| Resolved private URLs | id → url | empty | memory `src/components/visionboard/PrivateImageUploader.jsx:26` |
| Picker candidates / selection | image list / id set | all selected on open | memory `src/pages/VisionBoard.jsx:65-66,141-142` |
| URL mode (unmounted component) | true / false | false | memory `src/components/visionboard/ImageUploadSection.jsx:9` |

### 4c. Empty & fallback states

- Gallery loading: "Loading..." `[Implemented]` `src/components/visionboard/ImageGallery.jsx:51`
- Gallery empty: "No images yet. Upload some to get started!" `[Implemented]` `src/components/visionboard/ImageGallery.jsx:56-58`
- Private list loading: "Loading..." `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:167`
- Private list empty: "No private images yet. Upload your personal vision images here." `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:169-171`
- Private tile awaiting URL: spinner placeholder `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:184-188`
- Picker with no candidates: empty grid, "All (0)", "Defaults (0)", Play disabled `[Implemented]` `src/pages/VisionBoard.jsx:384-416`
- No images at slideshow launch: "No collage images found." / "Add images on your Vision Board page first." (`slideshow.md` §4c) `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:132-144`

## 5. Business rules

- **BR-VB-COL-01** Shared images are addressed by public URL and rendered directly; private images are rendered through a signed URL valid for 1 hour that is re-minted whenever fewer than 60 seconds remain, and the new URL and expiry are written back to the row. `[Implemented]` `src/components/visionboard/ImageGallery.jsx:72`; `src/components/visionboard/PrivateImageUploader.jsx:6-20,54-55`; `src/pages/VisionBoard.jsx:120-128`
- **BR-VB-COL-02** A private image is visible only to its owner: rows are creator-scoped and the file is private. `[Implemented]` `base44/entities/UserCollageImage.jsonc:34-47`; `src/components/visionboard/PrivateImageUploader.jsx:97`; UI copy "Private — only visible to you" `:146`
- **BR-VB-COL-03** A hidden shared image is excluded from both slideshow modes and from the Custom picker. `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:17`; `src/pages/VisionBoard.jsx:138`
- **BR-VB-COL-04** A private image with `include_in_slideshow` false is excluded from the Auto slideshow (`src/components/dashboard/DashboardSlideshow.jsx:23,30`) and is still offered, pre-selected, in the Custom picker (`src/pages/VisionBoard.jsx:117,136-142`). Both recorded; D-752.
- **BR-VB-COL-05** Deleting a shared image removes the row and records its id on the device; the device list is applied by the gallery only (`src/components/visionboard/ImageGallery.jsx:24-25`) and not by the picker (`src/pages/VisionBoard.jsx:135`) or the slideshow (`src/components/dashboard/DashboardSlideshow.jsx:16-17`). Both recorded; D-753.
- **BR-VB-COL-06** The gallery shows 12 shared images per page, in ascending `order`. `[Implemented]` `src/components/visionboard/ImageGallery.jsx:6,23,62-64`
- **BR-VB-COL-07** `is_default` marks the seed set: seeded copies carry false; a user-added shared image would carry true; the page's save-as-defaults rewrites the flags to match the last picker list. `[Implemented]` `base44/functions/initializeDefaultCollageImages/entry.ts:30`; `[Partial]` `src/components/visionboard/ImageUploadSection.jsx:25,48`, `src/pages/VisionBoard.jsx:183-196` (schema calls the field "Legacy field": `data-model/vision-board.md` D-014)
- **BR-VB-COL-08** The gallery and the private list are not loaded until the Collage tab has been opened once. `[Implemented]` `src/pages/VisionBoard.jsx:71,228,366,371`
- **BR-VB-COL-09** Read limits differ by surface: gallery 1000 shared rows; picker and save-as-defaults 100; private list and resolver 500. `[Implemented]` `src/components/visionboard/ImageGallery.jsx:23`; `src/pages/VisionBoard.jsx:117,135,180`; `src/components/visionboard/PrivateImageUploader.jsx:38`. D-756.
- **BR-VB-COL-10** Shared and private deletes use the browser confirm ("Delete this image?" / "Delete this private image?"), not the shared "Delete Item?" dialog. `[Implemented]` `src/components/visionboard/ImageGallery.jsx:36`; `src/components/visionboard/PrivateImageUploader.jsx:135`
- **BR-VB-COL-11** Every private upload is included in the slideshow until the owner excludes it. `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:108`; `base44/entities/UserCollageImage.jsonc:21-25`
- **BR-VB-COL-12** A new account is seeded once, only while it has no shared images. `[Implemented]` `base44/functions/initializeDefaultCollageImages/entry.ts:12-17`
- **BR-VB-COL-13** Private images are not removed by either account-wipe function. `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:50-60`; `base44/functions/deleteUserAccount/entry.ts:31-78` (per `data-model/vision-board.md` E-UserCollageImage)

### 5a. State & lifecycle

`CollageImage` (shared image):

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| (none, account has no rows) | shell mount / terms acceptance / daily workflow | seeded copies, `is_default` false, `hidden_from_slideshow` unset | `[Implemented]` `base44/functions/initializeDefaultCollageImages/entry.ts:12-45` |
| (none) | Add Image / Add URL (unmounted) | row with `is_default` true | `[Partial]` `src/components/visionboard/ImageUploadSection.jsx:22-26,45-49` |
| visible | eye | hidden (`hidden_from_slideshow` true) | dimmed, "Hidden" badge; excluded from slideshows and picker `[Implemented]` `src/components/visionboard/ImageGallery.jsx:43-48` |
| hidden | eye | visible | `[Implemented]` `:43-48` |
| any | trash → confirm OK | deleted | id appended to `deleted_collage_images` `[Implemented]` `:35-41` |
| any | save-as-defaults (uncalled) | `is_default` false, then true for picker-list ids | gallery refresh, alert `[Partial]` `src/pages/VisionBoard.jsx:177-206` |
| any (`is_default` true) | background URL removed in Theme Editor | deleted | `[Implemented]` `src/pages/ThemeEditor.jsx:149-152` |
| any | full data wipe | deleted | `[Implemented]` `base44/functions/deleteSyncedData/entry.ts:59` |

`UserCollageImage` (private image):

| State | Trigger | Next state | Side effects |
|---|---|---|---|
| (none) | file chosen in "Upload My Images" | row: `include_in_slideshow` true, signed URL cached 1 h | list reload, gallery refresh `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:96-112` |
| URL fresh (> 60 s left) | any listing | unchanged | cached URL displayed `[Implemented]` `:8-9,55` |
| URL stale (≤ 60 s left or absent) | any listing (uploader, picker, Auto slideshow) | new URL and expiry written | `[Implemented]` `:11-18,66-88`; `src/pages/VisionBoard.jsx:122-126`; `src/components/dashboard/DashboardSlideshow.jsx:34-38` |
| included | eye | excluded | dimmed, badge removed, gallery refresh `[Implemented]` `:122-132` |
| excluded | eye | included | `[Implemented]` `:122-132` |
| any | trash → confirm OK | deleted | gallery refresh `[Implemented]` `:134-139` |

### 5b. Time & date semantics

- No "today" is computed here. Signed-URL expiry is an epoch-millisecond timestamp (`signed_url_expires` = mint time + 3 600 000) compared against the device clock with a 60 000 ms margin `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:8,17,54-55`; `src/pages/VisionBoard.jsx:118,122,126`. This is a numeric timestamp rather than one of the string forms in AR-TIME-10..12 of `time-and-date-semantics.md`.
- The "Focus Areas for Today" panel on this tab uses device-local today (formatter B) `[Implemented]` `src/components/visionboard/LowScorePillars.jsx:10` (owner `spec.md`; see `affirmations.md` D-754).

## 6. Data

Entity sheets: `10-architecture/data-model/vision-board.md` (E-CollageImage, E-UserCollageImage).

- **Owned — `CollageImage`:** `image_url` (required), `title`, `order` (default 0, never written by the UI), `is_default` (default false), `hidden_from_slideshow` (default false) `[Implemented]` `base44/entities/CollageImage.jsonc:4-28`. Ops here: list `order` 1000 (gallery) `src/components/visionboard/ImageGallery.jsx:23`; list `order` 100 (picker, save-defaults) `src/pages/VisionBoard.jsx:135,180`; update `hidden_from_slideshow` `src/components/visionboard/ImageGallery.jsx:46`; update `is_default` `src/pages/VisionBoard.jsx:185,193` `[Partial]`; delete `src/components/visionboard/ImageGallery.jsx:37`; create `src/components/visionboard/ImageUploadSection.jsx:22,45` `[Partial]`.
- **Owned — `UserCollageImage`:** `file_uri` (required), `signed_url`, `signed_url_expires` (number), `title`, `include_in_slideshow` (default true), `order` (default 0, never written) `[Implemented]` `base44/entities/UserCollageImage.jsonc:4-30`. Ops here: list `order` 500 `src/components/visionboard/PrivateImageUploader.jsx:38`, `src/pages/VisionBoard.jsx:117`; create `src/components/visionboard/PrivateImageUploader.jsx:103-109`; update signed URL fields `:15-18,79-82`, `src/pages/VisionBoard.jsx:126`; update `include_in_slideshow` `:123-125`; delete `:136`.
- **Referenced:** `DailyPillarTracking` (Focus Areas panel; owner `spec.md`); seeding, admin and wipe functions (`admin-operations.md`).
- Sort orders: both lists ascending `order`; the slideshow shuffles regardless (`slideshow.md` §4.3).

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| out | Slideshow (`slideshow.md`) | Auto mode plays shared-not-hidden + private-included images; Custom (Vision Board) plays the picker selection; Custom (Dashboard) plays the Auto image set | `src/components/dashboard/DashboardSlideshow.jsx:16-47`; `src/pages/VisionBoard.jsx:134-155` |
| out | Slideshow (`slideshow.md`) | Page-level private-image resolver is passed to the Auto slideshow so URLs are refreshed before play | `src/pages/VisionBoard.jsx:116-132,450` |
| in | App shell / terms page / workflow | Seed set copied into an empty account | `src/components/Layout.jsx:48`; `src/pages/AcceptTerms.jsx:54`; `admin-operations.md` §2.5 |
| in | Admin operations | `makeImagesDefaults`, `backfillDefaultImagesToAllUsers` mark and propagate the seed set (no UI here) | `admin-operations.md` §2.2–2.3, AR-ADMIN-01 |
| in | Theme Editor | Removing a background-library URL deletes matching default shared images | `src/pages/ThemeEditor.jsx:149-152` |
| in | External services | Public upload, private upload, signed URL minting | `external-services.md` §6.3–6.4 |
| in | Daily evaluation (`spec.md`) | "Focus Areas for Today" panel sits above the gallery | `src/pages/VisionBoard.jsx:365` |
| in | Data wipe | Shared images deleted by the full wipe; private images by neither wipe | `base44/functions/deleteSyncedData/entry.ts:59`; BR-VB-COL-13 |

Deep links: none.

### 7a. Feedback & notifications

- Browser confirms: "Delete this image?" `[Implemented]` `src/components/visionboard/ImageGallery.jsx:36`; "Delete this private image?" `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:135`
- Browser alerts: "Upload failed" `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:115`; "Current vision board images saved as defaults!" / "Failed to save defaults" `[Partial]` `src/pages/VisionBoard.jsx:199,202`; "Please enter a valid URL" / "Failed to upload image" / "Failed to add image from URL" `[Partial]` `src/components/visionboard/ImageUploadSection.jsx:39,31,56`
- In-place feedback: "Uploading..." labels with spinner; "Hidden" and "In slideshow" badges `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:159-160,211-215`; `src/components/visionboard/ImageGallery.jsx:96-98`
- No toasts or celebratory effects `[Implemented]` (none in owned sources)

## 8. AI & automation

- No language-model or image-generation call exists in the collage (`ai-services.md` AR-AI-02) `[Implemented]` `src/components/visionboard/ImageGallery.jsx`, `PrivateImageUploader.jsx`, `ImageUploadSection.jsx` (no `InvokeLLM`).
- Automation: the daily workflow "Initialize Collage Images for All Users" invokes the seeding function (`10-architecture/automations.md`; `admin-operations.md` D-223) `[Implemented]` `base44/workflows/Initialize Collage Images for All Users.jsonc`.

## 9. Onboarding content

The Vision Board walkthrough (full text, buttons, and persistence in `affirmations.md` §9 and `spec.md` §9) mentions the collage in step 4, verbatim: "4. Build Your Vision Collage & Slideshow — Upload inspiring images and affirmations to the Collage tab. Create custom slideshows for meditation, or let AI auto-generate one based on your pillar weaknesses. The slideshow includes at least one affirmation from each pillar. Double-click to hide the control bar, navigate with swipes or buttons, customize audio/voice, and affirmations won't repeat until all are cycled." `[Described]` `src/components/visionboard/OnboardingDialog.jsx:21-25`. Dismissal key `visionboard_onboarded`, first generation.

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `deleted_collage_images` | JSON array of shared-image ids the owner deleted; the gallery filters them out on every load | `[]` | appended on each gallery delete `src/components/visionboard/ImageGallery.jsx:39-40` | never `[Implemented]` (no removal path; registered in `preferences.md` Part D) |

## 11. Seed / hardcoded data used

- Seed set: every `CollageImage` with `is_default` true from any owner, up to 100, `-order`; copied in batches of 10 with a 100 ms pause (`seed-data.md` §1.7; `admin-operations.md` §2.5, §4). The URLs themselves are not in the repository (Q-100) `[Partial]` `base44/functions/initializeDefaultCollageImages/entry.ts:20-45`
- Page size 12 `[Implemented]` `src/components/visionboard/ImageGallery.jsx:6`
- Signed URL lifetime 3600 s; refresh margin 60 000 ms `[Implemented]` `src/components/visionboard/PrivateImageUploader.jsx:8,13,17`
- Accepted upload type `image/*` (single file for shared, multiple for private) `[Implemented]` `src/components/visionboard/ImageUploadSection.jsx:69`; `src/components/visionboard/PrivateImageUploader.jsx:150-152`
- Read limits 1000 / 100 / 500 (BR-VB-COL-09)

## 12. Print / email formats

None observed. The "Vision Collage" card has no print or email handlers `[Implemented]` `src/pages/VisionBoard.jsx:345`.

## 13. Acceptance criteria

- **AC-VB-COL-01** Given 30 shared images When the gallery renders Then 12 appear with "Page 1 of 3"; next shows the following 12; previous is disabled on page 1 and next on page 3. (refs BR-VB-COL-06)
- **AC-VB-COL-02** Given a visible shared image When its eye is pressed Then it is dimmed with a "Hidden" badge and is absent from the Auto slideshow and the Custom picker. (refs BR-VB-COL-03)
- **AC-VB-COL-03** Given a shared image is deleted and confirmed Then it is gone from the gallery on every later load on that device. (refs BR-VB-COL-05)
- **AC-VB-COL-04** Given two files are chosen in "Upload My Images" Then two private rows exist, each included, each with a signed URL expiring about one hour later, and both tiles show "In slideshow". (refs BR-VB-COL-11, BR-VB-COL-01)
- **AC-VB-COL-05** Given a private row whose signed URL expires in 30 seconds When the list renders Then a new URL is minted, displayed, and written back. (refs BR-VB-COL-01)
- **AC-VB-COL-06** Given a private image is excluded When the Auto slideshow starts Then it is not played; when the Custom picker opens it is listed and pre-selected. (refs BR-VB-COL-04, D-752)
- **AC-VB-COL-07** Given the Custom picker is open with 8 candidates of which 3 are defaults When "Defaults (3)" is pressed Then only those 3 are selected and Play reads "Play (3 images)". (refs §4.6)
- **AC-VB-COL-08** Given no candidate is selected Then Play is disabled. (refs §4.6)
- **AC-VB-COL-09** Given a brand-new account with seed rows available When the shell mounts Then the account receives copies of the seed set flagged `is_default` false; a second mount adds nothing. (refs BR-VB-COL-12, BR-VB-COL-07)
- **AC-VB-COL-10** Given the page has just loaded on the Pillars tab Then no collage or private-image request is made until the Collage tab is opened. (refs BR-VB-COL-08)

## 14. Discrepancies & open questions

- **D-752** The private-image eye is titled "Remove from slideshow" and the Auto slideshow excludes images toggled off (`src/components/visionboard/PrivateImageUploader.jsx:196`; `src/components/dashboard/DashboardSlideshow.jsx:23,30`); the Custom picker lists every private image regardless of the flag and pre-selects it (`src/pages/VisionBoard.jsx:117,136-142`).
- **D-753** Deleted shared-image ids are suppressed by the gallery via `deleted_collage_images` (`src/components/visionboard/ImageGallery.jsx:24-25`) but not by the Custom picker (`src/pages/VisionBoard.jsx:135`) or the Auto slideshow (`src/components/dashboard/DashboardSlideshow.jsx:16-17`).
- **D-755** The User Manual states "Upload public images (URL-based)" (`src/pages/UserManual.jsx:372`) and an upload component with file and URL paths exists (`src/components/visionboard/ImageUploadSection.jsx:7-125`); no page renders it, so the Vision Collage card offers no control for adding shared images (`src/pages/VisionBoard.jsx:344-374`).
- **D-756** Shared images are read with limit 1000 in the gallery (`src/components/visionboard/ImageGallery.jsx:23`) and limit 100 in the Custom picker and save-as-defaults (`src/pages/VisionBoard.jsx:135,180`).
- **Q-750** Blocks: §4.4. `saveCurrentImagesAsDefaults` is defined with an alert and a busy flag but no control invokes it (`src/pages/VisionBoard.jsx:177-206`); is a "Save current images as defaults" control intended on the Collage tab, and should it act on the picker list or on the gallery?
- **Q-754** Blocks: §4a. The eye, trash, and star controls appear on pointer hover only (`src/components/visionboard/ImageGallery.jsx:78`; `src/components/visionboard/PrivateImageUploader.jsx:192`; `src/pages/VisionBoard.jsx:407`); the intended touch interaction for reaching them is not determinable from the source.
