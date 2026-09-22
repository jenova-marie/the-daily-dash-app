# The Daily Dash — Product Specification Corpus

This folder is a complete, code-independent record of the product prototyped in this repository:
**The Daily Dash** (in-app name: *Dash it, Dash it ALL!*). It describes what the product is, what every
feature does for the user, the business rules, the data model, and how the features integrate as a
system. It is written so the product can be reimplemented in a different codebase without reading
the original source.

The specs describe the prototype **as-is**. They do not contain platform-translation notes, design
decisions for a future implementation, or commentary on defects.

## Reading order

1. `00-overview/product-vision.md` — what the product is and who it is for
2. `00-overview/constitution.md` — the product principles every feature follows
3. `00-overview/feature-map.md` — one table, every feature, one line each (Level 0)
4. `10-architecture/system-overview.md` — how the subsystems fit together
5. `10-architecture/domain-model.md` then `10-architecture/data-model/` — the schema
6. `10-architecture/*.md` — cross-cutting mechanisms (schedule hub, Google sync, AI, automations, preferences, auth, shared interactions, export, external services, time semantics)
7. `20-features/<feature>/spec.md` — one per feature (Level 1); sub-specs beside it where the feature is large (Level 2)
8. `90-traceability/` — coverage matrix, claims audit, discrepancy log, open questions, reimplementer questions

`00-overview/glossary.md` defines the canonical vocabulary. Every spec uses it.

## Evidence tags

Every capability, rule, and data statement carries one tag and a citation.

| Tag | Meaning |
|---|---|
| `[Implemented]` | Observed in the prototype's code. |
| `[Described]` | Stated only in the User Manual, landing page, onboarding copy, or legal pages; not found in code. |
| `[Partial]` | UI, schema, or entry point exists but the behaviour is incomplete or not wired end to end. |

Citations use `path:line-range` relative to the prototype root, e.g. `src/pages/Tasks.jsx:167-177`.
The prototype now lives at `archive/base44-prototype/`, so `src/pages/Tasks.jsx:167-177` is the file
`archive/base44-prototype/src/pages/Tasks.jsx`; `base44/…` citations resolve the same way. The archive is
frozen, so the line numbers stay valid.

When two code paths disagree, both are recorded as `[Implemented]` with citations and a `D-` entry is
opened in `90-traceability/discrepancy-log.md`. The specs never pick a winner and never call anything a bug.

## Identifier conventions

| Kind | Form | Example |
|---|---|---|
| User story | `US-<CODE>-nn` | `US-TASK-03` |
| Business rule | `BR-<CODE>-nn` | `BR-CHORE-12` |
| Acceptance criterion | `AC-<CODE>-nn` | `AC-VB-EVAL-05` |
| Architecture rule | `AR-<AREA>-nn` | `AR-SYNC-07` |
| Entity | `E-<Name>` | `E-ScheduleItem` |
| Discrepancy | `D-nnn` | `D-104` |
| Open question | `Q-nnn` | `Q-210` |

Feature codes: `SHELL AUTH DASH CHK TASK CAL SCHED TODO CHORE MEAL EDU GOAL VB-PIL VB-EVAL VB-WK VB-AFF VB-COL VB-SLIDE VB-REM QUOTE LINK THEME SET ONB WX MAN`

A Level 2 sub-spec may add a one-letter suffix to keep its numbering separate from the parent spec, e.g. `BR-MEAL-G04` (AI generator) and `BR-GOAL-T03` (milestone tasks). `D-` and `Q-` numbers are allocated in blocks of fifty or one hundred per writer, so gaps in the sequence are expected.

Architecture areas: `HUB SYNC AI AUTO ADMIN PREF EXPORT TIME UI AUTH EXT`

## Ownership of shared code

Each source file has exactly one owning spec (see `90-traceability/coverage-matrix.md`). Shared
components are owned as follows; other specs cite the owner and describe only their own bindings.

| Source | Owner |
|---|---|
| `src/components/WidgetCard.jsx` (incl. generic print/email) | `10-architecture/export-print-email.md` |
| `SwipeableListItem`, `TimePicker`, `ModernTimePicker`, `LabelPicker` + `src/utils/labelHistory.js`, `PrintRangeDialog`, `GenericOnboardingDialog` mechanics, `Layout.jsx` swipe navigation, `HeaderContext.jsx` | `10-architecture/shared-interactions.md` |
| `SwipeableEventItem`, `DeletedItemReview` | `20-features/calendar` |
| `SwipeableToDoItem`, `DailyToDo` | `20-features/daily-schedule` (daily-todo.md) |
| `CategoryFilter`, `src/lib/categoryUtils.js`, `src/lib/recurringTaskUtils.js`, `TaskEditDialog` | `20-features/tasks` |
| `StatsBar`, `education/SubjectCard`, `education/ActivityLinksDialog`, `ActivityGenerator`, `ActivityLibrary` | `20-features/education` |
| `CondensedChecklist` | `20-features/daily-schedule` (cites checklist rules) |
| `dashboard/Dashboard*` widgets | the widget's **source** feature (tasks, goals, chores/meal, vision-board, daily-checklist, quotes, daily-schedule); `20-features/dashboard` owns only the registry, reorder mode, greeting, badges |
| `PrintFormat*` content | owning feature; mechanism in `export-print-email.md` |
| `src/lib/printUtils.js` | `10-architecture/export-print-email.md` |
| Due / overdue / upcoming definitions | canonical in `10-architecture/time-and-date-semantics.md`; features cite it and log divergences |
| `WeatherWidget` | `20-features/weather` |
| `onboarding/*.jsx`, `visionboard/OnboardingDialog.jsx` | step text in the feature's §9; trigger/persistence registry in `20-features/onboarding` |
| `src/pages/PrivacyPolicy.jsx`, `src/pages/TermsOfUse.jsx` | `00-overview/legal-copy.md` |
| `src/App.jsx`, `src/main.jsx`, `index.html`, `PageNotFound.jsx`, config files | `20-features/app-shell` (auth-and-account references the terms gate and restore rules) |

## Completeness evidence

Filled in by the verification pass on 2026-09-20. Two reverse-sampling reviews (ten 150-line source windows, 125 behaviours) found every behaviour covered with no contradictions; all 47 `AR-SYNC` and 39 `AR-HUB` rules were verified against their cited lines (one wording corrected). A specs-only reimplementation dry-run of the Daily To-Do and the slideshow produced 82 questions, recorded in `90-traceability/reimplementer-questions.md`.

| Audit | Result |
|---|---|
| Source files with exactly one owner spec | 165 of 165 (148 owned, 11 infra-only, 6 unused components); see `90-traceability/coverage-matrix.md` |
| Entities specified (every entity named in specs) | 30 of 30 |
| Backend functions specified | 21 of 21 |
| Integration names specified (LLM, email, upload, signed URL, invoked functions) | 19 of 19 |
| Device-local keys registered | 34 of 34 |
| Navigation targets specified | 10 of 10 |
| Entity enum values covered | 105 of 105 |
| Routes specified · sidebar labels specified | 21 of 21 · 14 of 14 |
| Onboarding dialog files and dismissal keys registered | 20 of 20 |
| User Manual, landing and sign-up claims mapped to a spec | 207 of 207 (182 manual, 18 landing, 7 sign-up); 174 rows tagged Implemented, 45 Described, 11 Partial; see `90-traceability/claims-audit.md` |
