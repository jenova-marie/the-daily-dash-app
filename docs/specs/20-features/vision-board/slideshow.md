# Vision Board — Slideshow — Feature Spec

**Feature code:** `VB-SLIDE` · **Level:** 2 (sub-spec of `20-features/vision-board/spec.md`) · **Status:** draft

**Tag summary:** Implemented 151 · Described 10 · Partial 0

**Sources owned:** `src/components/visionboard/Slideshow.jsx` (the player), `src/components/dashboard/DashboardSlideshow.jsx` (image-set and affirmation preparation for both modes), `src/pages/VisionBoard.jsx:59-62,134-155,347-364,447-461` (launch wiring from the Collage tab)
**Sources referenced (owned elsewhere):** `src/pages/Dashboard.jsx:47,157-160,189-221,325-330` (Vision button, its menu, and the Dashboard walkthrough step) → `20-features/dashboard` · `src/pages/UserManual.jsx:40,373-375` → `20-features/user-manual` · `src/components/visionboard/OnboardingDialog.jsx:24` → `affirmations.md` §9 · collage image rules → `collage.md` · saved affirmations → `affirmations.md` · LLM mechanism → `10-architecture/ai-services.md` §6–7 · audio hosts, private-file signed URLs, browser speech → `10-architecture/external-services.md` §4, §6.4, §7 · constants → `10-architecture/data-model/seed-data.md` §1.3, §1.5, §1.6 · device keys → `10-architecture/preferences.md` Part D · page swipe navigation → `10-architecture/shared-interactions.md` AR-UI-13

**Permissions:** per-user data (reads the owner's images, affirmations, pillars and evaluations); admin-only operations: none

## 0. Entry points & navigation

The slideshow has no route. It is a full-screen overlay drawn over the current page `[Implemented]` `src/components/visionboard/Slideshow.jsx:524-525`; `src/components/dashboard/DashboardSlideshow.jsx:123,134`. Two surfaces launch it, each in one of two modes.

**Vision Board → Collage tab** `[Implemented]` `src/pages/VisionBoard.jsx:347-364,447-461`:

- "▶ Auto-Generated" (sparkles icon) opens the preparer in Auto mode, passing the page's private-image resolver `[Implemented]` `src/pages/VisionBoard.jsx:350-356,447-452`
- "▶ Custom" (sliders icon) opens the image picker (`collage.md` §4.6); "Play (N images)" then opens the player directly with the chosen images and every saved affirmation `[Implemented]` `src/pages/VisionBoard.jsx:357-363,134-155,454-461`

**Dashboard → "Vision" button** (play-circle icon) toggles a small menu with two rows: "Auto-Generated" (sparkles) and "Custom Slideshow" (sliders); each opens the preparer in that mode without a picker `[Implemented]` `src/pages/Dashboard.jsx:157-160,189-221,325-330` (owner: `20-features/dashboard`; the resolver is not passed, so the preparer resolves private images itself).

- User Manual, Dashboard section, verbatim: "**Vision Slideshow Button** — Click the **Vision** button to launch an inspirational slideshow using your Vision Board images and affirmations. Choose **Auto-Generated** (AI-curated based on your lowest-scoring health pillars) or **Custom** (your selected images and saved affirmations)." `[Described]` `src/pages/UserManual.jsx:39-40`
- Dashboard walkthrough step 3, verbatim: "3. Launch Your Vision Slideshow — Hit the Vision button to start an inspirational slideshow using your uploaded images and affirmations. Choose Auto-Generated for AI-powered suggestions based on your health pillars, or Custom for your curated content." `[Described]` `src/pages/Dashboard.jsx:47`
- Query parameters: none. Feature-toggle gating of the Dashboard entry is recorded in `20-features/dashboard`; the Collage-tab entry is gated with the page (`spec.md` §0).
- Exit: the X button in the control bar (title "Close slideshow") removes the overlay and returns to the launching page as it was `[Implemented]` `src/components/visionboard/Slideshow.jsx:663-665`; `src/pages/VisionBoard.jsx:449,459`; `src/pages/Dashboard.jsx:328`. The "Close" button on the no-images screen does the same `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:138-140`.

## 1. Purpose & user benefit

A full-screen, slowly zooming image player with an affirmation overlay, ambient sound and optional spoken affirmations, for meditation on the owner's vision. Auto mode writes affirmations for the pillars the owner rated low; Custom mode uses their own.

- User Manual, verbatim `[Described]` `src/pages/UserManual.jsx:373-375`:
  - "**Slideshow — Auto-Generated:** Launches with all collage images. AI generates affirmations specifically for pillars you rated 3 or below in your most recent evaluation, interleaved in round-robin order so every focus area is represented. Also accessible from the Dashboard Vision button."
  - "**Slideshow — Custom:** Select exactly which images to include and uses your saved affirmations. Launch from the Collage tab or Dashboard."
  - "**Slideshow Controls:** Ken Burns zoom animation per slide. Adjust speed (3–30 seconds per slide). Toggle affirmation overlay on/off. Navigate manually with arrow buttons. Choose from ambient audio presets (rain, ocean, music, etc.), shuffle audio, favorite and set a default track. Double-tap/double-click to show/hide controls on mobile."
- Vision Board walkthrough step 4, verbatim: "Create custom slideshows for meditation, or let AI auto-generate one based on your pillar weaknesses. The slideshow includes at least one affirmation from each pillar. Double-click to hide the control bar, navigate with swipes or buttons, customize audio/voice, and affirmations won't repeat until all are cycled." `[Described]` `src/components/visionboard/OnboardingDialog.jsx:24`
- Landing page "Daily Reflection": "…personal affirmations, and vision-focused slideshows." `[Described]` `src/pages/LandingPage.jsx:13`

## 2. Concepts & vocabulary

- **slideshow** — glossary: the full-screen image + affirmation player, in Auto-Generated or Custom mode.
- **affirmation**, **collage**, **pillar**, **focal area**, **daily evaluation** — glossary.
- Feature-local: **Auto mode** — affirmations generated for the owner's focal areas from the most recent evaluation (all pillars when none is low). **Custom mode** — saved affirmations. **slide** — one image with the Ken Burns zoom. **affirmation queue** — the shuffled list of affirmations from which one is shown per slide. **preset** — one named ambient audio track. **voice** — a browser speech-synthesis voice. **control bar** — the overlay panel at the top holding every control.

## 3. User stories

- **US-VB-SLIDE-01** As the account owner, I want a slideshow that speaks to the pillars I rated low so that my weak areas get encouragement. `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:54-111`
- **US-VB-SLIDE-02** As the account owner, I want a slideshow of images I choose with affirmations I wrote. `[Implemented]` `src/pages/VisionBoard.jsx:134-155`; `src/components/dashboard/DashboardSlideshow.jsx:49-52`
- **US-VB-SLIDE-03** As the account owner, I want to move between slides by swipe or buttons and hide the controls to watch undisturbed. `[Implemented]` `src/components/visionboard/Slideshow.jsx:457-505,528-536,648-658`
- **US-VB-SLIDE-04** As the account owner, I want to set how long each slide stays. `[Implemented]` `src/components/visionboard/Slideshow.jsx:796-812`
- **US-VB-SLIDE-05** As the account owner, I want ambient sound with a remembered favourite or default track. `[Implemented]` `src/components/visionboard/Slideshow.jsx:57-73,255-265,748-793`
- **US-VB-SLIDE-06** As the account owner, I want affirmations read aloud in a voice and language I choose, with the translation shown. `[Implemented]` `src/components/visionboard/Slideshow.jsx:155-198,281-295,335-381,690-742`
- **US-VB-SLIDE-07** As the account owner, I want to hear only "I…" or only "You…" affirmations. `[Implemented]` `src/components/visionboard/Slideshow.jsx:298-313,708-724`
- **US-VB-SLIDE-08** As the account owner, I want no affirmation to repeat until all have been shown. `[Implemented]` `src/components/visionboard/Slideshow.jsx:310-323`

## 4. Capabilities & interactions

### 4.1 Preparing the show (`DashboardSlideshow`)

Used by both Dashboard entries and by the Collage tab's Auto button; the Collage tab's Custom launch bypasses it (§0).

- Loading screen: a spinner with "Preparing your slideshow..." on a black full-screen overlay `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:121-130`
- **Image set (both modes):** every shared image (`CollageImage.list()`, no sort or limit given) that is not hidden, followed by private images: when the launching page supplies a resolver (Vision Board), all private images are resolved and those with `include_in_slideshow` not false are kept; otherwise (Dashboard) private images are read with `filter({ include_in_slideshow: true }, "order", 500)`, each signed URL refreshed when missing or within 60 s of expiry (new URL written back), and any image whose URL cannot be obtained is dropped `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:16-47`; `src/pages/VisionBoard.jsx:116-132`
- **No images:** "No collage images found." / "Add images on your Vision Board page first." with a "Close" button `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:132-144`
- **Custom mode affirmations:** every saved `Affirmation` text (`Affirmation.list()`, unsorted, unlimited) `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:49-52`
- **Auto mode affirmations:** generated as in §4.2 `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:53-112`
- Any failure during preparation is logged only; the player then opens with whatever was gathered (possibly no affirmations, in which case the fallback text plays) `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:113-116`; `src/components/visionboard/Slideshow.jsx:299`
- The list of all pillars is passed to the player as `focusAreas`; the player accepts the prop and does not read it `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:66,150`; `src/components/visionboard/Slideshow.jsx:41` (Q-752)
- **Collage-tab Custom launch:** images = the picker selection; affirmations = every saved `Affirmation` text, or the single fallback "You are capable of achieving your vision." when none exist; the player opens with an empty `focusAreas` `[Implemented]` `src/pages/VisionBoard.jsx:146-155,454-461`

### 4.2 Auto mode affirmation generation

- Reads the 50 most recent `DailyPillarTracking` rows (`-date`) and every `HealthPillar` `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:57-60`
- Pillar names come from the account's pillars; when the account has none, the hardcoded list `Physical Health, Mental Health, Relationships, Career & Purpose, Finances, Personal Growth, Spirituality` is used `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:55,62-64` (`seed-data.md` §1.3, D-123)
- The most recent evaluation is the date of the newest tracking row; pillars whose row on that date has `rating <= 3` are the low pillars (matched by `pillar_id` to pillar names) `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:69-78`
- Targets: the low pillars when an evaluation exists and at least one is low; otherwise all pillar names `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:80-83`
- Prompt, verbatim (`{targets}` is the target names joined by ", "; the third line is included only when low pillars exist) `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:85-91`:

  > Generate personal affirmations for these life areas: {targets}.
  > Generate EXACTLY 3 unique, different affirmations for EACH life area listed. Do not repeat any affirmation.
  > These areas scored low (3 or below) in a recent self-assessment, so make the affirmations especially uplifting, healing, and encouraging for growth in these specific areas.
  > Use a mix of "I" statements (e.g. "I am", "I have", "I embrace") and "You" statements (e.g. "You are", "You have", "You deserve"). Each affirmation must start with either "I" or "You".
  > Every affirmation must be completely unique — no two should be similar or repeat the same idea.
  > Return a JSON object with key "by_pillar" where each sub-key is exactly one of the life area names above and the value is an array of exactly 3 affirmation strings.

- Response schema: an object with `by_pillar`, a map from name to array of strings `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:92-100`
- Round-robin interleave: the per-pillar arrays are taken in target order; position 1 of each, then position 2 of each, and so on, so consecutive affirmations come from different pillars; pillars the model omitted are skipped `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:103-111`
- Nothing generated is stored (`ai-services.md` AR-AI-01, §6) `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:111`

### 4.3 Slides and playback (`Slideshow`)

- On open the images are shuffled once `[Implemented]` `src/components/visionboard/Slideshow.jsx:42-45`
- The show auto-advances every `speed` seconds (default 30). When the last slide advances, the images are reshuffled and the show restarts at the first slide. Every advance also moves to the next affirmation `[Implemented]` `src/components/visionboard/Slideshow.jsx:52,383-404,451-455`
- The show is always in the playing state; no pause or play control is rendered (the play state has no setter call, and the imported pause/play icons are unused) `[Implemented]` `src/components/visionboard/Slideshow.jsx:49,3,641-816`
- **Previous / Next** buttons (titles "Previous slide", "Next slide") flank a counter "{current} / {total}" at the left of the control bar. Next from the last slide reshuffles and restarts; Previous from the first slide wraps to the last; each also moves the affirmation position forward or back `[Implemented]` `src/components/visionboard/Slideshow.jsx:457-466,646-658` (Q-751 on Previous before any forward step)
- **Swipe:** a touch that moves more than 30 px horizontally and more horizontally than vertically goes next (leftward) or previous (rightward). The touch handlers stop propagation, so the app shell's page-to-page swipe (AR-UI-13) does not fire inside the show `[Implemented]` `src/components/visionboard/Slideshow.jsx:469-487`
- **Double-click / double-tap:** two clicks within 300 ms anywhere on the show toggle the control bar; when hidden the bar is invisible and non-interactive. Touch relies on the click events the browser raises for taps; the touch handler itself performs no double-tap detection `[Implemented]` `src/components/visionboard/Slideshow.jsx:528-536,507-508,642,501`
- Every click or touch on the show also (re)starts the ambient audio in case autoplay was blocked `[Implemented]` `src/components/visionboard/Slideshow.jsx:473-476,537`
- **Ken Burns:** the active slide zooms from scale 1.05 to 2.25, linearly, reaching full zoom at 90 % of the slide duration and holding; the zoom restarts when the speed is changed. Inactive slides are held at full zoom, and slides crossfade over 300 ms `[Implemented]` `src/components/visionboard/Slideshow.jsx:543-568,81,560`
- **Speed picker:** a gauge button (title "Speed") opens a panel headed "Speed" listing 3s, 5s, 8s, 10s, 15s, 20s, 30s; choosing one sets the interval, restarts the zoom, and closes the panel `[Implemented]` `src/components/visionboard/Slideshow.jsx:796-812`
- Opening any panel (speed, audio, voice, affirmation mode) closes the others `[Implemented]` `src/components/visionboard/Slideshow.jsx:701,709,749,797`
- A tap outside the audio panel (not a swipe) closes it `[Implemented]` `src/components/visionboard/Slideshow.jsx:488-499`
- **Close:** X button (title "Close slideshow"). On close the ambient audio is stopped and unloaded and any speech is cancelled `[Implemented]` `src/components/visionboard/Slideshow.jsx:510-521,663-665`
- No keyboard handling exists (no key listener in the player) `[Implemented]` `src/components/visionboard/Slideshow.jsx:1-822`

### 4.4 Affirmation overlay

- The current affirmation is shown at the bottom of the screen on a translucent panel while the affirmations toggle is on and text is not hidden `[Implemented]` `src/components/visionboard/Slideshow.jsx:571-576`
- **Affirmations toggle** (speech-bubble icon, title "Toggle affirmations"): on by default; turning it off hides the overlay and every affirmation sub-control (text eye, speak, voice, mode) `[Implemented]` `src/components/visionboard/Slideshow.jsx:53,670-677,679-746`
- **Text eye** (title "Hide text" / "Show text"): hides the text while leaving speech on `[Implemented]` `src/components/visionboard/Slideshow.jsx:89,682-688`
- **Display split:** an affirmation beginning "I {word}" (case-sensitive "I") or "You {word}" (any case) is shown as a large first line ("I am" / "You are") with the remainder as a smaller second line; any other text is one line. In "I only" mode only the I-form is split, in "You only" mode only the You-form `[Implemented]` `src/components/visionboard/Slideshow.jsx:577-601,626-631`
- **Affirmation mode** button shows "I/You", "I", or "You" and opens a menu "I only" / "You only" / "Both"; default Both `[Implemented]` `src/components/visionboard/Slideshow.jsx:87,708-724`
  - Filter: "I only" keeps texts matching `^I\s+\w+`; "You only" keeps texts matching `^You\s+\w+` (case-insensitive); "Both" keeps all. If the filter would leave nothing, the whole list is kept `[Implemented]` `src/components/visionboard/Slideshow.jsx:298-309`
  - The mode button and menu are visible only while speech is on `[Implemented]` `src/components/visionboard/Slideshow.jsx:698-725`
- **Queue, no repeat until cycled:** the (filtered) list is shuffled once into a queue. Each slide takes the next position; when the position wraps back to the start after a full pass the queue is reshuffled for the next round. The queue is rebuilt (and reshuffled) when the list or the mode changes `[Implemented]` `src/components/visionboard/Slideshow.jsx:297-333`. Walkthrough claim: "affirmations won't repeat until all are cycled." `[Described]` `src/components/visionboard/OnboardingDialog.jsx:24`
- **Fallback:** with no affirmations the queue holds the single text "You are capable of achieving your vision." `[Implemented]` `src/components/visionboard/Slideshow.jsx:299`
- **Translation display:** when a translation exists and differs from the English text, the panel shows two columns labelled "English" and the language's own name (§4.7) `[Implemented]` `src/components/visionboard/Slideshow.jsx:605-625`

### 4.5 Ambient audio

- **Presets** (label → URL), verbatim and in menu order, with the group headers the menu inserts before "Rain" ("— Nature Sounds —") and before "Relax" ("— Music —") `[Implemented]` `src/components/visionboard/Slideshow.jsx:7-19,765-773` (also `seed-data.md` §1.5; hosts in `external-services.md` §4):

| Label | URL |
|---|---|
| None | *(no audio)* |
| Rain | `https://raw.githubusercontent.com/betterthanwell/wisdom-timer/main/public/audio/ambient/rain.mp3` |
| Ocean Waves | `https://raw.githubusercontent.com/betterthanwell/wisdom-timer/main/public/audio/ambient/ocean.mp3` |
| Forest | `https://raw.githubusercontent.com/betterthanwell/wisdom-timer/main/public/audio/ambient/forest.mp3` |
| Relax | `https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3` |
| Beach Serenity | `https://www.no-copyright-music.com/wp-content/uploads/2021/09/BeachSerenity.mp3` |
| Tranquil Reflections | `https://www.no-copyright-music.com/wp-content/uploads/2021/09/TranquilReflections.mp3` |
| Calmness | `https://www.no-copyright-music.com/wp-content/uploads/2021/09/Calmness.mp3` |
| Peaceful | `https://www.no-copyright-music.com/wp-content/uploads/2021/09/Peaceful-Sleep-Music-Free-Royalty-Free-Music-by-Liborio-Conti-01-Peaceful-Sleep-Music.mp3` |
| Ambient Light | `https://www.no-copyright-music.com/wp-content/uploads/2021/09/AmbientLight.mp3` |
| Custom URL… | sentinel `custom`; the URL typed by the owner is played |

- **Selection on open**, in precedence order: the preset whose label is stored in `slideshowDefaultAudio`; else a random preset among those whose labels are in `slideshowAudioFavorites` (None and Custom never qualify); else a random preset excluding None and Custom `[Implemented]` `src/components/visionboard/Slideshow.jsx:57-73`
- **Audio panel:** the music-note button (highlighted while a track is active) opens a panel headed "Ambient Audio". When favourites exist a "Favorites" section (star icon) lists them first, followed by a divider and the full preset list `[Implemented]` `src/components/visionboard/Slideshow.jsx:748-773`
- **Each row** (except None): the label selects the preset; a gauge icon (title "Set as default") stores the label in `slideshowDefaultAudio`; a star (title "Favorite") toggles the label in `slideshowAudioFavorites`. The current default is shown with a filled gauge, favourites with a filled star `[Implemented]` `src/components/visionboard/Slideshow.jsx:21-39,255-265`
- **Custom URL…:** choosing it reveals a text field with placeholder "Paste audio URL (.mp3, etc.)" and an "Apply" button that closes the panel; the typed URL plays as soon as it changes `[Implemented]` `src/components/visionboard/Slideshow.jsx:74,253,410,775-780`
- **Playback:** the track loops at volume 0.5; it starts when the show opens or the track changes, and if the browser blocks autoplay it starts on the next click or touch; it follows the (always-on) play state `[Implemented]` `src/components/visionboard/Slideshow.jsx:406-449`
- **Random audio** button (shuffle icon, title "Random audio"): picks a random preset excluding None and Custom, with a brief spin of the icon `[Implemented]` `src/components/visionboard/Slideshow.jsx:785-789`
- **Speaker-off** button: when the current preset is None, it opens or closes the audio panel (and is highlighted); otherwise it switches the preset to None `[Implemented]` `src/components/visionboard/Slideshow.jsx:791-793`
- Volume and mute state exist (0.5, not muted) and no control changes them; the speaker-off button changes the preset rather than muting `[Implemented]` `src/components/visionboard/Slideshow.jsx:75-76,437-441` (no setter call anywhere in the file). See D-757.
- Audio settings are device-local and never expire (§10) `[Implemented]` `src/components/visionboard/Slideshow.jsx:258,264`

### 4.6 Spoken affirmations (text-to-speech)

- **Speak** button (microphone icon, title "Speak affirmations"): off by default; while on it reveals the voice button (radio icon, title "Select voice") and the affirmation-mode button `[Implemented]` `src/components/visionboard/Slideshow.jsx:82,690-725`
- **When speech fires:** whenever the current affirmation changes, the voice changes, or a translation arrives, while Speak is on and an affirmation exists. Any ongoing speech is cancelled first. The translated text is spoken when present, otherwise the English text; rate 0.9, pitch 1.1, volume 1 `[Implemented]` `src/components/visionboard/Slideshow.jsx:335-381`
- The ambient volume is re-applied when speech starts and ends so the browser does not duck it `[Implemented]` `src/components/visionboard/Slideshow.jsx:364-374`
- **Voice list:** voices come from the browser; if none are reported yet the player polls every 300 ms up to 20 times and also listens for the browser's voices-changed event `[Implemented]` `src/components/visionboard/Slideshow.jsx:155-163,196-198` (`external-services.md` §7)
- **Voice filter** (name matched case-insensitively by substring; `google ` prefix passes for the languages marked) `[Implemented]` `src/components/visionboard/Slideshow.jsx:101-146,165-178`:
  - Always excluded: names containing `david`, `mark`, `zira` `:165,169`
  - `en-*`: Google, or name contains one of `tessa, microsoft ava, microsoft andrew, microsoft emma, microsoft brian, microsoft jenny, microsoft aria, microsoft ana, microsoft christopher, microsoft eric, microsoft michelle, microsoft steffan, microsoft natasha, microsoft sonia, microsoft ryan, microsoft libby, microsoft emily, microsoft ezinne, microsoft abeo, microsoft molly, microsoft luna, microsoft wayne, microsoft imani, microsoft leah, microsoft luke` `:101-110,170`
  - `es-*`: Google, or `mónica, paulina, diego, microsoft elvira, microsoft alvaro, microsoft dalia, microsoft jorge` `:112-117,171`
  - `fr-*`: Google, or `amélie, thomas, nicolas, microsoft charline, microsoft gerard, microsoft sylvie, microsoft jean, microsoft thierry, microsoft ariane, microsoft fabrice, microsoft denise, microsoft henri, microsoft vivienne, microsoft remy` `:119-126,172`
  - `ar-*` / `ar`: the voice's locale must be one of `ar-eg, ar-iq, ar-sy, ar-lb, ar-jo` `:173`. A name list `maged, zariyah, hamed, salma, shakir, layla, bassel, nayf, jawhar, rana, tarek` is declared and not consulted `:128-133` (D-758)
  - `zh-*` / `zh`: locale must be `zh-cn` or `zh-tw` `:174`. An empty Chinese name list is declared and not consulted `:135` (D-758)
  - `de-*` / `de`: Google, or `microsoft seraphina` `:137-139,175`
  - `fil-*` / `tl-*` / `fil`: Google, or `mónica, microsoft angel, microsoft blessica, microsoft angelo` `:141-146,176`
  - Any other language: excluded `:177`
  - Fallbacks: if the filter leaves nothing, every `en-*` voice; if still nothing, every voice `:180-183`
- **Initial voice:** the voice whose name equals the stored `slideshowSelectedVoice`, if present in the filtered list; else the first voice in the list `[Implemented]` `src/components/visionboard/Slideshow.jsx:187-193`
- **Voice panel** headed "Languages & Accents": voices grouped under an accent label from the map below (unmapped locales show the raw code); choosing a voice stores its name in `slideshowSelectedVoice` and closes the panel `[Implemented]` `src/components/visionboard/Slideshow.jsx:200-251,726-742`
- **Accent display map**, verbatim `[Implemented]` `src/components/visionboard/Slideshow.jsx:200-244`: `en-US` US English · `en-GB` British English · `en-AU` Australian English · `en-IN` Indian English · `en-IE` Irish English · `en-CA` Canadian English · `en-NZ` New Zealand English · `en-ZA` South African English · `en-SG` Singapore English · `es-ES` Spanish (Spain) · `es-MX` Spanish (Mexico) · `es-AR` Spanish (Argentina) · `es-CO` Spanish (Colombia) · `fr-FR` French (France) · `fr-CA` French (Canada) · `fr-BE` French (Belgium) · `fr-CH` French (Switzerland) · `ar-SA` Arabic (Saudi Arabia) · `ar-EG` Arabic (Egypt) · `ar-AE` Arabic (UAE) · `ar-MA` Arabic (Morocco) · `ar-DZ` Arabic (Algeria) · `ar-IQ` Arabic (Iraq) · `ar-JO` Arabic Levantine · `ar-KW` Arabic (Kuwait) · `ar-LB` Arabic Levantine · `ar-LY` Arabic (Libya) · `ar-QA` Arabic (Qatar) · `ar-SY` Arabic Levantine · `ar-TN` Arabic (Tunisia) · `ar-YE` Arabic (Yemen) · `ar` Arabic · `zh-CN` Chinese Mandarin · `zh-TW` Chinese Taiwanese · `zh-HK` Chinese (Hong Kong) · `zh` Chinese · `de-DE` German (Germany) · `de-AT` German (Austria) · `de-CH` German (Switzerland) · `de` German · `fil-PH` Tagalog (Philippines) · `tl-PH` Tagalog (Philippines) · `fil` Tagalog
- **Fallback voice when none is selected:** a voice whose name includes "Google US English", "Microsoft Aria" or "Samantha", else a non-Google, non-Microsoft `en-US` voice, else any `en-US` voice `[Implemented]` `src/components/visionboard/Slideshow.jsx:349-362`

### 4.7 Translation

- The affirmation language is derived from the selected voice's locale: `es-*` → Spanish, `fr-*` → French, `ar*` → Arabic, `zh*` → Chinese (Simplified), `de*` → German, `fil*` / `tl*` → Tagalog; anything else → English `[Implemented]` `src/components/visionboard/Slideshow.jsx:268-279`
- When the language is not English, every time the current affirmation changes (and when the voice changes) the text is sent for translation; this depends on the selected voice only, not on whether Speak is on `[Implemented]` `src/components/visionboard/Slideshow.jsx:315-333`
- Prompt, verbatim (`{language}` is the name above; `{text}` the English affirmation) `[Implemented]` `src/components/visionboard/Slideshow.jsx:287-289`:

  > Translate this affirmation to {language}. Keep it positive and motivating. Only provide the translation, no other text:
  >
  > "{text}"

- On failure the English text is used as the translation `[Implemented]` `src/components/visionboard/Slideshow.jsx:291-294`
- Display: two columns, "English" and the language's own name — `Español`, `Français`, `العربية`, `中文`, `Deutsch`, `Tagalog` — shown only when the translation differs from the English `[Implemented]` `src/components/visionboard/Slideshow.jsx:605-625`
- Speech reads the translation when present (§4.6). Nothing is stored (`ai-services.md` §7) `[Implemented]` `src/components/visionboard/Slideshow.jsx:343`

### 4a. Keyboard & pointer

- Double-click / double-tap (two clicks within 300 ms): toggle the control bar `[Implemented]` `src/components/visionboard/Slideshow.jsx:528-536`
- Horizontal swipe > 30 px: previous / next slide; page swipe navigation is suppressed inside the show `[Implemented]` `src/components/visionboard/Slideshow.jsx:469-487`
- Tap outside the audio panel: closes it `[Implemented]` `src/components/visionboard/Slideshow.jsx:489-499`
- Single click or touch anywhere: nudges blocked audio to start `[Implemented]` `src/components/visionboard/Slideshow.jsx:473-476,537`
- Hover: control buttons expose their titles (listed above); no hover-reveal behaviour `[Implemented]` `src/components/visionboard/Slideshow.jsx:649,655,663,674,685,693,703,749,785,797`
- No Enter / Escape / arrow-key handling `[Implemented]` `src/components/visionboard/Slideshow.jsx:1-822`
- No long-press or drag `[Implemented]` `src/components/visionboard/Slideshow.jsx:469-505`

### 4b. View state & persistence

| Control | Values | Default | Scope |
|---|---|---|---|
| Mode | auto / custom | chosen at launch | memory `src/pages/VisionBoard.jsx:60`; `src/pages/Dashboard.jsx:60` |
| Image order | shuffled list | shuffled on open and on each full cycle | memory `src/components/visionboard/Slideshow.jsx:42-45,451-455` |
| Current slide | 0 … n−1 | 0 | memory `:46` |
| Play state | playing | playing (no control) | memory `:49` |
| Speed | 3, 5, 8, 10, 15, 20, 30 s | 30 | memory `:52,804` |
| Control bar | shown / hidden | shown | memory `:54` |
| Affirmations toggle | on / off | on | memory `:53` |
| Affirmation text | shown / hidden | shown | memory `:89` |
| Affirmation mode | I / you / both | both | memory `:87` |
| Affirmation queue / position | list / integer | shuffled / 0 | memory `:47-48` |
| Speak | on / off | off | memory `:82` |
| Selected voice | browser voice | saved name or first | memory, seeded from device `slideshowSelectedVoice` `:84,189-192,734` |
| Selected audio | preset or custom | see §4.5 precedence | memory, seeded from device `slideshowDefaultAudio` / `slideshowAudioFavorites` `:57-73` |
| Custom audio URL | text | empty | memory `:74` |
| Audio volume / mute | 0.5 / false | constant | memory, no control `:75-76` |
| Favourite presets | labels | `[]` | device `slideshowAudioFavorites` `:77-79,255-261` |
| Default preset | label | absent | device `slideshowDefaultAudio` `:263-265` |
| Open panel | none / audio / speed / voice / mode | none | memory `:55-56,85,88` |

### 4c. Empty & fallback states

- Preparing: "Preparing your slideshow..." `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:126`
- No images: "No collage images found." / "Add images on your Vision Board page first." / "Close" `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:132-144`
- No affirmations: "You are capable of achieving your vision." `[Implemented]` `src/components/visionboard/Slideshow.jsx:299`; `src/pages/VisionBoard.jsx:149`
- Mode filter leaves nothing: the unfiltered list is used `[Implemented]` `src/components/visionboard/Slideshow.jsx:308`
- Generation failure in Auto mode: the show opens with the fallback affirmation `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:113-116`
- Translation failure: English shown and spoken `[Implemented]` `src/components/visionboard/Slideshow.jsx:291-294`
- No voices pass the filter: all `en-*` voices, then all voices `[Implemented]` `src/components/visionboard/Slideshow.jsx:180-183`
- No stored audio preference: a random preset `[Implemented]` `src/components/visionboard/Slideshow.jsx:70-72`
- Autoplay blocked: audio starts on the first click or touch `[Implemented]` `src/components/visionboard/Slideshow.jsx:416-430`

## 5. Business rules

- **BR-VB-SLIDE-01** Auto mode targets the pillars rated 3 or below in the most recent evaluation; when none is low, or no evaluation exists, it targets every pillar. Exactly 3 affirmations per target are requested and the results are interleaved round-robin. `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:69-111` (`ai-services.md` AR-AI-07, AR-AI-10)
- **BR-VB-SLIDE-02** Custom mode plays every saved affirmation. From the Collage tab the images are the picker selection; from the Dashboard the images are the same set Auto mode uses and no picker is shown. Both recorded; D-751. `[Implemented]` `src/pages/VisionBoard.jsx:146-155`; `src/components/dashboard/DashboardSlideshow.jsx:16-52`; `src/pages/Dashboard.jsx:214-219`
- **BR-VB-SLIDE-03** The Auto image set is every shared image not hidden plus every private image included; private URLs are refreshed before play. `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:16-47` (`collage.md` BR-VB-COL-03, BR-VB-COL-04)
- **BR-VB-SLIDE-04** Images play in a random order that is reshuffled after every full pass. `[Implemented]` `src/components/visionboard/Slideshow.jsx:42-45,387-393,451-455`
- **BR-VB-SLIDE-05** No affirmation repeats until every affirmation in the (filtered) list has been shown; the list is reshuffled after each pass. `[Implemented]` `src/components/visionboard/Slideshow.jsx:310-323`
- **BR-VB-SLIDE-06** The I / You / Both filter applies to the queue; a filter that would empty it is ignored. `[Implemented]` `src/components/visionboard/Slideshow.jsx:300-309`
- **BR-VB-SLIDE-07** With no affirmations the show plays "You are capable of achieving your vision.". `[Implemented]` `src/components/visionboard/Slideshow.jsx:299`
- **BR-VB-SLIDE-08** Slide duration is one of 3, 5, 8, 10, 15, 20, 30 seconds, default 30; the zoom animation spans the slide duration. `[Implemented]` `src/components/visionboard/Slideshow.jsx:52,550,804`
- **BR-VB-SLIDE-09** The starting audio is the stored default, else a random favourite, else a random preset. `[Implemented]` `src/components/visionboard/Slideshow.jsx:57-73`
- **BR-VB-SLIDE-10** Ambient audio loops at volume 0.5; the only way to silence it is to select None. `[Implemented]` `src/components/visionboard/Slideshow.jsx:414-415,791-793`
- **BR-VB-SLIDE-11** Only whitelisted browser voices are offered (§4.6); the chosen voice name is remembered on the device and the first offered voice is used otherwise. `[Implemented]` `src/components/visionboard/Slideshow.jsx:165-193,734`
- **BR-VB-SLIDE-12** When the voice's language is not English, each affirmation is translated on display and shown beside the English; translations are never stored. `[Implemented]` `src/components/visionboard/Slideshow.jsx:315-333,605-625`
- **BR-VB-SLIDE-13** Speech occurs only while Speak is on, reads the translation when present, and is cancelled before each new utterance and on close. `[Implemented]` `src/components/visionboard/Slideshow.jsx:335-381,519`
- **BR-VB-SLIDE-14** Nothing produced by the show (affirmations, translations) is written to any entity; the only writes are refreshed private-image signed URLs. `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:38,111`; `src/components/visionboard/Slideshow.jsx:290`
- **BR-VB-SLIDE-15** Hidden controls are not interactive; double-click restores them. `[Implemented]` `src/components/visionboard/Slideshow.jsx:507-508,528-536,642`
- **BR-VB-SLIDE-16** The show closes only through the X button (or the no-images Close). `[Implemented]` `src/components/visionboard/Slideshow.jsx:663-665`; `src/components/dashboard/DashboardSlideshow.jsx:138`
- **BR-VB-SLIDE-17** The show cannot be paused. `[Implemented]` `src/components/visionboard/Slideshow.jsx:49,383-404`
- **BR-VB-SLIDE-18** The walkthrough states "The slideshow includes at least one affirmation from each pillar." `[Described]` `src/components/visionboard/OnboardingDialog.jsx:24`; the Manual states Auto mode generates "specifically for pillars you rated 3 or below" `[Described]` `src/pages/UserManual.jsx:373`; Auto mode targets only the low pillars when any exist, and Custom mode does not consider pillars. D-759.

### 5a. State & lifecycle

| Component | State | Trigger | Next state | Side effects |
|---|---|---|---|---|
| preparer | preparing | launch | playing, or no-images | images and affirmations gathered `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:13-119` |
| preparer | no-images | Close | closed | `[Implemented]` `:138-140` |
| player | playing | interval / Next / swipe left | next slide, next affirmation | reshuffle at end of pass `[Implemented]` `src/components/visionboard/Slideshow.jsx:383-404,461-466` |
| player | playing | Previous / swipe right | previous slide, previous affirmation | `[Implemented]` `:457-460` |
| control bar | shown | double-click | hidden | controls non-interactive `[Implemented]` `:528-536` |
| control bar | hidden | double-click | shown | `[Implemented]` `:528-536` |
| audio | preset / custom / none | row select, Random, speaker-off, Apply | new track | previous track paused; new track loops `[Implemented]` `:406-435` |
| speech | off | Speak | on | voice and mode controls appear; current affirmation spoken `[Implemented]` `:690-696,336-376` |
| speech | on | Speak | off | ongoing utterance cancelled `[Implemented]` `:378-380` |
| player | any | X | closed | audio stopped, speech cancelled `[Implemented]` `:510-521,663-665` |
| `UserCollageImage.signed_url` | stale | preparation | refreshed | written back `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:34-38` |

### 5b. Time & date semantics

- "Most recent evaluation" = the `date` of the first of the 50 most recent `DailyPillarTracking` rows sorted by `-date`; only rows with exactly that date count `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:58,72-76`. Dates are `YYYY-MM-DD` strings (AR-TIME-10). No "today" is computed by the show; the Affirmations card's shortcuts use today instead (`ai-services.md` D-300; `affirmations.md` §5b).
- Slide timing uses a device timer of `speed × 1000` ms `[Implemented]` `src/components/visionboard/Slideshow.jsx:386-396`. Double-click window 300 ms `:530`. Signed-URL expiry margin 60 000 ms `src/components/dashboard/DashboardSlideshow.jsx:34`.

## 6. Data

Entity sheets: `10-architecture/data-model/vision-board.md`.

- **Reads:** `CollageImage.list()` (no sort or limit; Q-753) `src/components/dashboard/DashboardSlideshow.jsx:16`; `UserCollageImage.filter({ include_in_slideshow: true }, "order", 500)` `:30` or, via the Vision Board resolver, `UserCollageImage.list("order", 500)` `src/pages/VisionBoard.jsx:117`; `Affirmation.list()` `src/components/dashboard/DashboardSlideshow.jsx:51`, `src/pages/VisionBoard.jsx:148`; `DailyPillarTracking.list("-date", 50)` `:58`; `HealthPillar.list()` `:59` `[Implemented]`
- **Writes:** `UserCollageImage.signed_url`, `signed_url_expires` when refreshed `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:38`; `src/pages/VisionBoard.jsx:126`. No other entity is written.
- **Fields consumed:** `CollageImage.image_url`, `hidden_from_slideshow`; `UserCollageImage.file_uri`, `signed_url`, `signed_url_expires`, `include_in_slideshow`; `Affirmation.text`; `DailyPillarTracking.date`, `rating`, `pillar_id`; `HealthPillar.id`, `name` `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:16-78`; `src/components/visionboard/Slideshow.jsx:561`
- Device-local data: §10.

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
| in | Dashboard (`20-features/dashboard`) | "Vision" button menu launches Auto-Generated or Custom Slideshow | `src/pages/Dashboard.jsx:157-160,189-221,325-330` |
| in | Collage (`collage.md`) | Auto / Custom buttons; image picker; image visibility flags; private-image resolver | `src/pages/VisionBoard.jsx:134-155,347-364,447-461` |
| in | Affirmations (`affirmations.md`) | Custom mode reads every saved affirmation; "Apply N" selection is overwritten at launch (D-750) | `src/pages/VisionBoard.jsx:148`; `src/components/dashboard/DashboardSlideshow.jsx:51` |
| in | Daily evaluation (`daily-evaluation.md`) | Most recent evaluation's low pillars steer Auto mode | `src/components/dashboard/DashboardSlideshow.jsx:57-83` |
| in | Health pillars (`health-pillars.md`) | Pillar names label the generated affirmations | `src/components/dashboard/DashboardSlideshow.jsx:59-66,77` |
| in | AI services | Generation (JSON) and translation (free text) | `ai-services.md` §6, §7 |
| in | External services | Audio CDNs; private-file signed URLs; browser speech synthesis | `external-services.md` §4, §6.4, §7 |
| in | Shared interactions | Page swipe navigation suppressed inside the show | `src/components/visionboard/Slideshow.jsx:470,480`; AR-UI-13 |
| in | Preferences | Three device keys (§10) | `preferences.md` Part D |

Deep links: none.

### 7a. Feedback & notifications

- Loading and no-images screens (§4c) `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:121-144`
- Slide counter "{n} / {total}" `[Implemented]` `src/components/visionboard/Slideshow.jsx:652-654`
- Highlighted (active-state) buttons: affirmations on, text hidden, speak on, audio active, None selected, selected rows in every panel `[Implemented]` `src/components/visionboard/Slideshow.jsx:673,684,692,749,791,23,718,734,760,805`
- Spin animation on Random audio `[Implemented]` `src/components/visionboard/Slideshow.jsx:786-788`
- No toasts, alerts, confirms, or reminders `[Implemented]` `src/components/visionboard/Slideshow.jsx`, `src/components/dashboard/DashboardSlideshow.jsx` (no `alert`/`confirm`)

## 8. AI & automation

Two touchpoints, both browser-side and ephemeral (`10-architecture/ai-services.md` §6 "Touchpoint 5", §7 "Touchpoint 6"; AR-AI-01, AR-AI-07, AR-AI-10):

- **Auto-generated affirmations** — on launch in Auto mode, one structured call returns 3 affirmations per targeted pillar; the owner sees them interleaved on the slides and cannot edit or save them (§4.2) `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:85-111`
- **Translation** — one free-text call per affirmation shown while a non-English voice is selected; the owner sees the two-column display and hears the translation (§4.7) `[Implemented]` `src/components/visionboard/Slideshow.jsx:281-295`

No automation touches the slideshow `[Implemented]` (no reference in `base44/workflows/`).

## 9. Onboarding content

- Vision Board walkthrough step 4 (full dialog in `affirmations.md` §9; key `visionboard_onboarded`, first generation): "4. Build Your Vision Collage & Slideshow — Upload inspiring images and affirmations to the Collage tab. Create custom slideshows for meditation, or let AI auto-generate one based on your pillar weaknesses. The slideshow includes at least one affirmation from each pillar. Double-click to hide the control bar, navigate with swipes or buttons, customize audio/voice, and affirmations won't repeat until all are cycled." `[Described]` `src/components/visionboard/OnboardingDialog.jsx:21-25`
- Dashboard walkthrough step 3 (owner `20-features/dashboard`; key `dashboard_onboarded`): "3. Launch Your Vision Slideshow — Hit the Vision button to start an inspirational slideshow using your uploaded images and affirmations. Choose Auto-Generated for AI-powered suggestions based on your health pillars, or Custom for your curated content." `[Described]` `src/pages/Dashboard.jsx:47`

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `slideshowDefaultAudio` | Label of the preset to start with | absent (random favourite, else random preset) | gauge "Set as default" on a preset row `src/components/visionboard/Slideshow.jsx:263-265` | never (setting another label replaces it) |
| `slideshowAudioFavorites` | JSON array of favourite preset labels | `[]` | star on a preset row (toggle rewrites the array) `:255-261` | unstarring the last favourite leaves `[]` |
| `slideshowSelectedVoice` | Browser voice name to speak with | absent (first offered voice) | choosing a voice in "Languages & Accents" `:734` | never |

No other device key is read or written by the show `[Implemented]` `src/components/visionboard/Slideshow.jsx:59,64,78,189,258,264,734,760,770`. All three are registered in `10-architecture/preferences.md` Part D.

## 11. Seed / hardcoded data used

All registered in `10-architecture/data-model/seed-data.md` §1.3, §1.5, §1.6.

- Ambient audio presets: the 11-row table in §4.5, with menu headers "— Nature Sounds —" (before Rain) and "— Music —" (before Relax) `[Implemented]` `src/components/visionboard/Slideshow.jsx:7-19,766`
- Speed options 3, 5, 8, 10, 15, 20, 30 s; default 30 `[Implemented]` `:52,804`
- Ken Burns keyframes: 1.05 → 2.25, hold from 90 % `[Implemented]` `:544-548`
- Volume 0.5; speech rate 0.9, pitch 1.1, volume 1 `[Implemented]` `:76,345-347`
- Double-click window 300 ms; swipe threshold 30 px; voice poll 300 ms × 20 `[Implemented]` `:530,484,161`
- Voice whitelists, exclusions and locale rules (§4.6) `[Implemented]` `:101-146,165-178`
- Accent display map (§4.6) `[Implemented]` `:200-244`
- Translation language names: `es` Spanish · `fr` French · `ar` Arabic · `zh` Chinese (Simplified) · `de` German · `tl` Tagalog `[Implemented]` `:279`; display labels `Español · Français · العربية · 中文 · Deutsch · Tagalog` `:606`
- Affirmation modes `I`, `you`, `both` with labels "I only", "You only", "Both" `[Implemented]` `:87,717`
- Fallback pillar list (Auto mode, no pillars): `Physical Health, Mental Health, Relationships, Career & Purpose, Finances, Personal Growth, Spirituality` `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:55`
- Fallback affirmation "You are capable of achieving your vision." `[Implemented]` `src/components/visionboard/Slideshow.jsx:299`; `src/pages/VisionBoard.jsx:149`
- Low-rating threshold 3 (`seed-data.md` §1.4) `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:76`
- Read limits: trackings 50, private images 500 `[Implemented]` `src/components/dashboard/DashboardSlideshow.jsx:30,58`

## 12. Print / email formats

None observed `[Implemented]` `src/components/visionboard/Slideshow.jsx`, `src/components/dashboard/DashboardSlideshow.jsx` (no print or email handler).

## 13. Acceptance criteria

- **AC-VB-SLIDE-01** Given the newest evaluation rates Rest 2 and Play 3 and the rest higher When Auto-Generated is launched Then the prompt names only Rest and Play with the "scored low" sentence, and the slides alternate Rest, Play, Rest, Play, Rest, Play. (refs BR-VB-SLIDE-01)
- **AC-VB-SLIDE-02** Given no evaluation exists When Auto-Generated is launched Then every pillar is targeted and the "scored low" sentence is absent. (refs BR-VB-SLIDE-01)
- **AC-VB-SLIDE-03** Given no shared or private images qualify When either mode is launched from the Dashboard Then "No collage images found." is shown with a Close button. (refs §4.1)
- **AC-VB-SLIDE-04** Given 4 affirmations When 8 slides pass in Both mode Then each affirmation appears exactly twice and no affirmation appears twice in a row across the boundary unless the reshuffle places it there. (refs BR-VB-SLIDE-05)
- **AC-VB-SLIDE-05** Given affirmations "I am calm" and "You are safe" When "I only" is chosen Then only "I am calm" is shown, split as "I am" / "calm"; when "You only" is chosen only "You are safe" is shown. (refs BR-VB-SLIDE-06, §4.4)
- **AC-VB-SLIDE-06** Given the speed is 30 s When 10 s is chosen Then the next advance comes 10 s later and the zoom restarts. (refs BR-VB-SLIDE-08)
- **AC-VB-SLIDE-07** Given `slideshowDefaultAudio` = "Forest" When the show opens Then Forest plays; given only `slideshowAudioFavorites` = ["Rain","Relax"] Then one of those plays; given neither Then a preset other than None and Custom plays. (refs BR-VB-SLIDE-09)
- **AC-VB-SLIDE-08** Given a track is playing When the speaker-off button is pressed Then the preset becomes None and audio stops; pressing it again opens the audio panel. (refs BR-VB-SLIDE-10)
- **AC-VB-SLIDE-09** Given Speak is on and the voice is a Spanish voice When a new affirmation appears Then a translation call is made, the panel shows "English" and "Español" columns, and the Spanish text is spoken. (refs BR-VB-SLIDE-12, BR-VB-SLIDE-13)
- **AC-VB-SLIDE-10** Given the browser reports "Microsoft Zira" and "Microsoft Aria" Then only Aria is offered under "US English"; given `slideshowSelectedVoice` = "Microsoft Aria" Then it is preselected. (refs BR-VB-SLIDE-11)
- **AC-VB-SLIDE-11** Given the controls are shown When the screen is double-clicked Then the control bar disappears and its buttons cannot be pressed; a second double-click restores it. (refs BR-VB-SLIDE-15)
- **AC-VB-SLIDE-12** Given the show is open When X is pressed Then the overlay is gone, ambient audio has stopped, and speech is cancelled. (refs BR-VB-SLIDE-16)
- **AC-VB-SLIDE-13** Given the Collage tab picker has 3 of 8 images selected When Play is pressed Then exactly those 3 play, with every saved affirmation. (refs BR-VB-SLIDE-02)

## 14. Discrepancies & open questions

- **D-751** The User Manual describes Custom as "Select exactly which images to include … Launch from the Collage tab or Dashboard." (`src/pages/UserManual.jsx:374`). From the Collage tab a picker precedes launch (`src/pages/VisionBoard.jsx:134-155`); from the Dashboard "Custom Slideshow" launches at once with the same image set as Auto mode and no picker (`src/pages/Dashboard.jsx:214-219`; `src/components/dashboard/DashboardSlideshow.jsx:16-52`).
- **D-757** Resolved in synthesis: `10-architecture/external-services.md` §4 now states that no volume or mute control is rendered. As observed, the player holds volume 0.5 and an unmuted flag with no control that changes either, and its speaker-off button switches the preset to None (`src/components/visionboard/Slideshow.jsx:75-76,437-441,791-793`; the imported slider component is not rendered).
- **D-758** Arabic and Chinese voice name lists are declared (`src/components/visionboard/Slideshow.jsx:128-135`) while the filter admits those languages by locale code only (`:173-174`). Noted in `seed-data.md` §1.6.
- **D-759** The walkthrough says "The slideshow includes at least one affirmation from each pillar." (`src/components/visionboard/OnboardingDialog.jsx:24`); Auto mode targets only the pillars rated ≤ 3 when any exist (`src/components/dashboard/DashboardSlideshow.jsx:83`) and Custom mode plays saved affirmations without regard to pillars (`:49-52`); the Manual says "specifically for pillars you rated 3 or below" (`src/pages/UserManual.jsx:373`).
- **Q-751** Blocks: §4.3 Previous. Pressing Previous (or swiping right) before any forward step moves the affirmation position below zero (`src/components/visionboard/Slideshow.jsx:457-460`), and the queue lookup uses that position directly (`:319-326`). What the overlay shows in that case could not be determined by reading.
- **Q-752** Blocks: §4.1. The preparer passes the pillar list as `focusAreas` (`src/components/dashboard/DashboardSlideshow.jsx:150`) and the Collage-tab Custom launch passes an empty list (`src/pages/VisionBoard.jsx:458`); the player does not read the prop (`src/components/visionboard/Slideshow.jsx:41`). What was the prop intended to drive?
- **Q-753** Blocks: §6. Shared images for both preparer modes are read with `CollageImage.list()` and no limit (`src/components/dashboard/DashboardSlideshow.jsx:16`); the platform's default page size, and therefore the maximum number of shared images a show can contain, is not in the repository.
