# <Feature Name> — Feature Spec

**Feature code:** `<CODE>` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented n · Described n · Partial n

**Sources owned:** `path`, `path`
**Sources referenced (owned elsewhere):** `path` → owner spec

**Permissions:** per-user data; admin-only operations: none

## 0. Entry points & navigation

- Route: · Sidebar label: · Header title text: · Position in swipe order:
- Query parameters accepted:
- Feature-toggle gating:
- Header right-slot contents:

## 1. Purpose & user benefit

Plain language. Quote the User Manual, landing page, or onboarding copy verbatim where they state purpose or benefit, with citations.

## 2. Concepts & vocabulary

Terms used here, linked to `00-overview/glossary.md`. Any feature-local term defined once.

## 3. User stories

- **US-<CODE>-01** As a …, I want … so that … `[Implemented]` `path:lines`

## 4. Capabilities & interactions

Every action the user can take. For each: what it does, the dialog/form fields with defaults and validation, and the result. Tag and cite each bullet.

### 4a. Keyboard & pointer
Enter/Escape, double-click / double-tap, long-press, swipe, drag-and-drop, hover reveals.

### 4b. View state & persistence
| Control | Values | Default | Scope (memory / device `key` / account `Entity.field`) |
|---|---|---|---|

### 4c. Empty & fallback states
Verbatim copy for each empty/fallback state.

## 5. Business rules

- **BR-<CODE>-01** … `[Implemented]` `path:lines`

### 5a. State & lifecycle
Transition table for each status field or flag set: state → trigger → next state → side effects.

### 5b. Time & date semantics
What "today", "due", "overdue", "upcoming" mean here. Cite `AR-TIME-nn`; log divergences as `D-`.

## 6. Data

Entities and fields owned vs referenced; read limits and sort orders; link to `10-architecture/data-model/`.

## 7. Integrations & cross-feature interactions

| Direction | Other feature | Mechanism | Citation |
|---|---|---|---|
Include deep links with query parameters.

### 7a. Feedback & notifications
Toasts, alerts, confirm dialogs, celebratory effects, reminders. Tag each.

## 8. AI & automation

Link each touchpoint to `10-architecture/ai-services.md` / `automations.md`; summarise the user-facing behaviour here.

## 9. Onboarding content

The walkthrough steps verbatim (title + description), the dismissal key, and which persistence generation it uses. Registry lives in `20-features/onboarding`.

## 10. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|

## 11. Seed / hardcoded data used

Lists, defaults, palettes, presets this feature relies on; link to `10-architecture/data-model/seed-data.md`.

## 12. Print / email formats

Which format component, what is included and excluded, the options dialog, any remembered inputs.

## 13. Acceptance criteria

- **AC-<CODE>-01** Given … When … Then … (refs BR-<CODE>-01)

## 14. Discrepancies & open questions

- **D-nnn** Source A says … (`path:lines`); Source B says … (`path:lines`).
- **Q-nnn** Blocks: <spec section>. Question: …
