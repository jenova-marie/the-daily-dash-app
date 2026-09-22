# The Daily Dash — Product Overview

> **App name (in-product):** "Dash it, Dash it ALL!"
> **Current platform:** Base44 (web, React + Vite)
> **Target reimplementation:** React Native (Expo) + Supabase backend
> **This document describes the *product intent*, not the current codebase.**

---

## 1. What the app is

**The Daily Dash** is a **personal & family life-management hub** — a single place that brings together everything a person juggles day-to-day: their schedule, tasks, household chores and meal planning, homeschool/education plans, personal goals, daily routines, motivational quotes, and a wellness "vision board." It is designed so that a user can open it first thing in the morning, see the whole shape of their day at a glance, act on it, and reflect in the evening — all without leaving the app or switching between a dozen disconnected tools.

The app is **single-user / single-household by design** (one account owns one set of data), but it models a **household of members** (family members / learners / chore assignees) within that single account. Data is isolated per account; there is no multi-tenant sharing.

---

## 2. The core idea / philosophy

The product rests on a few beliefs:

1. **Everything in one place reduces friction.** A busy parent/homeschooler/lifelong-learner currently spreads their life across Google Calendar, a tasks app, a chore chart on the fridge, a meal plan in a notebook, a goals doc, a gratitude journal, and a Pinterest board of inspiration images. The Daily Dash replaces all of that with one cohesive dashboard where these domains *talk to each other* (a goal's milestone tasks appear in your daily schedule; a low wellness-pillar score can become a tracked goal; a chore can be printed as a household chart).

2. **Reflection drives growth.** The app isn't just a to-do list — it deliberately pairs *action* (doing the things) with *reflection* (rating your wellness pillars daily, writing reflections on quotes, reviewing weekly trends). The Vision Board subsystem exists specifically to surface the areas of life that need attention and turn them into actionable goals.

3. **AI should reduce setup effort, not add noise.** Several subsystems use AI as an *assistant for generation* — generating age-appropriate chores, hands-on education activities, affirmations targeted at your weakest wellness pillars, and daily motivational quotes — so users spend less time configuring and more time doing.

4. **Sync with the systems you already use.** Two-way (or near-two-way) integration with Google Calendar and Google Tasks means the app augments rather than replaces a user's existing workflow. Events and tasks can flow in from Google; app-created events flow back out to Google.

5. **It should feel personal and calm.** Heavy theming (background images, fonts, colors, widget opacity), a vision-collage slideshow with ambient audio, and an inspirational-quote-first experience give the app a meditative, "yours" feeling — distinct from a sterile productivity tool.

---

## 3. Who it's for

- **Primary user:** A parent / household manager — often a homeschooling parent — who coordinates their own schedule, their family's chores and meals, their children's education, and their personal wellness and goals.
- **Secondary use:** An individual focused on holistic life-management (wellness, goals, habits, reflection) who wants everything unified.
- **Implied characteristics:** comfortable with Google Calendar/Tasks, values self-improvement and reflection, manages multiple "tracks" of life simultaneously.

---

## 4. What the user gains (the benefits)

| Domain | Without the app | With the app |
|---|---|---|
| Morning routine | Check 5 apps, mentally merge them | One dashboard shows today's schedule, due tasks, chores, meals, checklist, goals, weather, and a quote |
| Household chores | Paper chart / nagging | Assignable, recurring, room-grouped chores with an AI generator; weekly print/email; due-today surfacing on the dashboard |
| Meal planning | Separate notebook / app | Meals live in the same system as chores, surface on the daily schedule's Menu widget, and can be printed/emailed as a weekly plan |
| Education | Spreadsheets / binders | Per-learner plans, per-subject recurring activities, AI-generated hands-on activities, scheduled into the day |
| Goals | A list somewhere | Goals with milestone tasks that auto-populate the daily schedule; progress auto-calculated from sub-task completion; focal wellness areas convert to goals |
| Wellness | Vague sense | 13 health pillars rated daily; weekly review charts; low pillars become focal areas and goals |
| Reflection | Scattered | A daily quote with personal reflection, favoriting, and history |
| Motivation | Manual | A vision-board slideshow (custom or AI-generated affirmations for weak pillars) with Ken Burns animation and ambient audio |
| Integrations | Copy/paste between systems | Two-way Google Calendar + Google Tasks sync, with auto-sync schedules and deleted-item review |

---

## 5. Feature map (high level)

```mermaid
mindmap
  root((The Daily Dash))
    Dashboard
      Weather
      Focal Areas (low pillars)
      Daily Checklist
      Today's Schedule
      Today's Tasks
      Menu & Chores
      Goals Overview
      Daily Quote
      Vision Slideshow
    Daily Schedule
      Hourly grid
      Item Library
      To-Do list
      Auto-population
      Print/Email
    Daily Checklist
      Morning/Afternoon/Evening/Anytime
      Daily completions
      Weekly counts
      Reordering
    Tasks
      Recurring + occurrences
      Google Tasks sync
      Trash bin
      Print/Email
    Calendar
      Monthly view
      Google Calendar two-way sync
      Selected calendars
    Chores & Menu
      Household members
      Rooms & categories
      AI chore generator
      Chore library
      Meal planning
      Print/Email
    Education
      Learners
      Subject plans
      Activities/assignments
      AI activity generator
      Activity library
      Print/Email
    Goals & Pillars
      Goals + milestones
      Timeframes + occurrences
      Health pillars (Maslow)
      Daily evaluation
      Weekly review
      Focal areas → goals
      Vision collage
      Affirmations
      Slideshow (auto/custom)
    Quotes & Reflection
      AI daily quote
      Reflections
      Favorites
      History
    Theme
      Colors/fonts
      Backgrounds
      Widget opacity/radius
      Dashboard header
    Settings
      Account
      Integrations
      Auto-sync schedule
      Trash bin
      Delete data/account
    Links
      Bookmark library
```

---

## 6. The "one-liner"

> **The Daily Dash is a unified personal & family command center** that merges schedule, tasks, household chores, meals, homeschooling, goals, wellness tracking, daily reflection, and motivational vision into a single, themable, Google-synced dashboard — pairing doing with reflecting, and using AI to lower the effort of setting it all up.

---

## 7. Navigation / surface structure

The app is a sidebar-navigated SPA. The primary authenticated surfaces are:

- **Dashboard** (`/dashboard`) — the home base, a reorderable stack of widgets
- **Daily Checklist** (`/checklist`)
- **Tasks** (`/tasks`)
- **Calendar** (`/calendar`)
- **Daily Schedule** (`/schedule`)
- **Chores** (`/chores`)
- **Education** (`/education`)
- **Goals** (`/goals`)
- **Quotes** (`/quotes`)
- **Vision Board** (`/visionboard`)
- **Theme Editor** (`/theme`)
- **Settings** (`/settings`)
- **Links** (`/links`)
- **User Manual** (`/manual`)

Public surfaces: Landing page, Auth/login, Accept Terms, Privacy Policy, Terms of Use, Reset Password.

Feature toggles (in Settings) can hide **Vision Board**, **Education**, and **Chores** — which also removes their dashboard widgets and (by intent) their nav entries.

---

## 8. Document guide

The rest of the docs in this folder drill down:

- `01-System-Architecture.md` — how the subsystems interact and integrate (with diagrams)
- `02-Dashboard.md` … `13-Links.md` — one file per feature area, each with purpose, behavior, business logic, data model, and interactions
- `14-Google-Integrations.md` — deep dive on the Calendar/Tasks two-way sync
- `15-Data-Model.md` — complete entity schemas + relationships (the appendix for reimplementation)