# Authentication and Account — Architecture Spec

**Area code:** `AUTH` · **Level:** 1 · **Status:** draft

**Tag summary:** Implemented 74 · Described 4 · Partial 6

**Sources owned:** `src/pages/Auth.jsx`, `src/pages/AcceptTerms.jsx`, `src/pages/ResetPassword.jsx`, `src/pages/OAuthConsent.jsx`, `src/components/AuthLayout.jsx`, `src/lib/AuthContext.jsx`, `src/lib/app-params.js`, `src/components/ProtectedRoute.jsx`, `src/components/UserNotRegisteredError.jsx`, `base44/functions/deleteUserAccount/entry.ts`, `base44/entities/User.jsonc`; the terms gate in `src/components/Layout.jsx:40-49`; public paths and restore behaviour in `src/App.jsx:135-190`; the Account card in `src/pages/Settings.jsx:30-105,558-571,611-644,1089-1109`
**Sources referenced (owned elsewhere):** `src/pages/LandingPage.jsx` → `20-features/app-shell` · `src/pages/Settings.jsx` (other cards) → `20-features/settings` · `src/pages/PrivacyPolicy.jsx`, `TermsOfUse.jsx` → `20-features/app-shell`

**Permissions:** one tenant per account (§9); `admin` role exists but gates no UI (§8).

## 0. Entry points & navigation

| Path | Screen | Reached from |
|---|---|---|
| `/auth` | Sign in / Sign up / Verify / Forgot (one screen, four modes) | Landing page buttons; any auth-required redirect `src/lib/AuthContext.jsx:126-128`; reset success `src/pages/ResetPassword.jsx:50` |
| `/accept-terms` | Terms and privacy gate | after login `src/pages/Auth.jsx:68`, after verification `src/pages/Auth.jsx:131`, from the shell when flags are missing `src/components/Layout.jsx:40-45` |
| `/reset-password?token=…` (also `reset_token`, or in the hash) | Set a new password | emailed link `src/pages/ResetPassword.jsx:17-27` |
| `/auth?mode=forgot` | (link target only) | "Request a new reset link" `src/pages/ResetPassword.jsx:119-125` `[Partial]` (D-336) |
| `/dashboard` | post-auth landing | `src/pages/AcceptTerms.jsx:18,59`, `src/pages/Auth.jsx:34-38`, `src/App.jsx:156-161` |
| MCP consent page | "Authorize access" | not routed in `src/App.jsx:194-216` `[Partial]` (§11, D-337) |

Public paths (no session required): `/`, `/auth`, `/accept-terms`, `/privacy-policy`, `/terms-of-use`, `/reset-password` `[Implemented]` `src/App.jsx:143,184`.

## 1. Purpose

The account layer lets one person create a private space, return to it, recover a lost password, and leave with their data removed. The landing page frames it as "Private & Secure — Your data is yours. We take privacy seriously and keep your information safe with encrypted storage." `[Described]` `src/pages/LandingPage.jsx:15`.

## 2. Sign-up

- **Fields:** "Full Name" (placeholder "John Doe"), "Email" (placeholder "you@example.com"), "Password" (masked placeholder). Submit label "Sign Up". Missing any field shows "Please fill in all fields" `[Implemented]` `src/pages/Auth.jsx:54-55,175-242`. Header subtitle in this mode: "Create your account" `[Implemented]` `src/pages/Auth.jsx:159`.
- **AR-AUTH-01 — Integration choice precedes registration.** Submitting opens a dialog titled "How would you like to get started?" with description "You can connect your Google account now, or set it up later in Settings." and two options: **"Connect Google Account"** — "Sync Google Calendar events and Google Tasks automatically on app load." and **"Use Independently"** — "Manage tasks, schedules, and goals without connecting a Google account."; footer "You can always connect Google later in Settings → Integrations." The dialog cannot be dismissed while loading `[Implemented]` `src/pages/Auth.jsx:56-59,290-341`.
- Choosing either option registers the account with the three fields, switches to **verify** mode, and shows "Check your email for a verification code" `[Implemented]` `src/pages/Auth.jsx:76-98`. Registration failure shows the platform message or "Sign up failed" `[Implemented]` `src/pages/Auth.jsx:93-94`.
- **Verify mode:** subtitle "Verify your email"; fields Email (pre-filled) and "Verification Code" (placeholder "Enter code from your email"); submit "Verify Email"; a link "Didn't receive code? Resend" and "Back to sign in" (which clears the pending sign-up) `[Implemented]` `src/pages/Auth.jsx:159,201-213,241-263`. Empty code: "Please enter verification code" `[Implemented]` `src/pages/Auth.jsx:102`. Resend shows "Verification code resent to your email" or "Failed to resend code" `[Implemented]` `src/pages/Auth.jsx:139-151`.
- **AR-AUTH-02 — Verification logs the user in.** After the code is accepted the app signs in with the pending credentials, refreshes app state, and, if "Connect Google Account" was chosen, opens the Google Calendar authorisation popup, waits for it to close (polling every 500 ms), then opens the Google Tasks popup; it then navigates to `/accept-terms` `[Implemented]` `src/pages/Auth.jsx:100-137`. Failure shows the platform message or "Verification failed" `[Implemented]` `src/pages/Auth.jsx:132-133`.

## 3. Login

- Subtitle "Sign in to your account"; fields Email and Password with a "Forgot password?" link above the password; submit "Sign In"; footer "Don't have an account? Sign up" (or "Already have an account? Sign in" in sign-up mode) `[Implemented]` `src/pages/Auth.jsx:159,189-242,272-285`. Loading label "Loading..." `[Implemented]` `src/pages/Auth.jsx:241`.
- Missing fields: "Please enter email and password". On success the app refreshes state and navigates to `/accept-terms`; on failure the platform message or "Authentication failed" `[Implemented]` `src/pages/Auth.jsx:62-73`.
- An already-authenticated visit to `/auth` bounces to `/dashboard` `[Implemented]` `src/pages/Auth.jsx:34-38`.

## 4. Forgot and reset password

- **Forgot mode:** subtitle "Reset your password"; Email only; submit "Send Reset Link"; empty email shows "Please enter your email address"; success shows "Password reset link sent! Check your email."; "Back to sign in" returns to login `[Implemented]` `src/pages/Auth.jsx:45-52,159,241,264-271`.
- **Reset page:** title "The Daily Dash" / "Set your new password"; reads the token from `token` or `reset_token` in the query string or the hash; without one it shows "Invalid or missing reset token. Please request a new password reset link from Settings or the login page." and disables the form `[Implemented]` `src/pages/ResetPassword.jsx:17-27,61-63,88-106`.
- Fields "New Password" and "Confirm Password"; rules: both required ("Please fill in all fields"), equal ("Passwords do not match"), at least 6 characters ("Password must be at least 6 characters") `[Implemented]` `src/pages/ResetPassword.jsx:29-44`.
- Success: "Password reset successfully! Redirecting to sign in..." then `/auth` after 2.5 s; failure: platform message or "Failed to reset password. The link may have expired." `[Implemented]` `src/pages/ResetPassword.jsx:46-55`. Links: "Back to sign in", and when no token "Request a new reset link" → `/auth?mode=forgot` `[Implemented]` `src/pages/ResetPassword.jsx:110-127`; the auth screen does not read a `mode` query parameter `[Partial]` `src/pages/Auth.jsx:27` (D-336).

## 5. Terms and privacy gate

- **AR-AUTH-03 — Both policies must be accepted before the app is used.** The page "Welcome to The Daily Dash" / "Please review and accept our Privacy Policy and Terms of Use to continue:" shows two scrollable summaries, each with its own checkbox: "I agree to the Privacy Policy" and "I agree to the Terms of Use" `[Implemented]` `src/pages/AcceptTerms.jsx:78-126`.
- Privacy Policy summary (verbatim) `[Implemented]` `src/pages/AcceptTerms.jsx:86-97`:
  - **Information We Collect** — "We collect information you provide directly to us when you register for an account, including your name and email address. When you connect third-party services such as Google Calendar or Google Tasks, we access only the data necessary to provide our scheduling and task management features."
  - **How We Use Your Information** — "We use the information we collect to provide, maintain, and improve our services, including syncing your tasks and calendar events, sending daily reflections, and personalizing your experience."
  - **Data Security** — "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction."
- Terms of Use summary (verbatim) `[Implemented]` `src/pages/AcceptTerms.jsx:109-120`:
  - **Acceptance of Terms** — "By accessing or using The Daily Dash, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our application."
  - **Use of the Service** — "The Daily Dash is a personal productivity application. You agree to use it only for lawful purposes and in a manner consistent with all applicable laws and regulations."
  - **User Content** — "You retain ownership of any content you create within The Daily Dash, including tasks, notes, and reflections. You grant us a limited license to store and display this content solely to provide you with the service."
- Footer: "Accept both policies to continue" until both boxes are ticked, then "Ready to get started!"; button "Continue to Dashboard" enabled only then ("Loading..." while saving) `[Implemented]` `src/pages/AcceptTerms.jsx:132-140`.
- **AR-AUTH-04 — What accepting does.** It disconnects two connector ids (ignoring failures), writes `terms_accepted: true, privacy_accepted: true` on the user, invokes `initializeDefaultCollageImages` so the collage is seeded, and navigates to `/dashboard` `[Implemented]` `src/pages/AcceptTerms.jsx:29-64` (connector ids: D-330).
- A user whose flags are already set is sent straight to `/dashboard` `[Implemented]` `src/pages/AcceptTerms.jsx:13-27`.
- **Enforcement:** every time the authenticated shell mounts it reads the user and redirects to `/accept-terms` when either flag is missing; it also re-invokes the collage seeding `[Implemented]` `src/components/Layout.jsx:40-49`.

## 6. Session, restore and access states

- **Boot sequence:** the app reads its public settings (sending the stored token when one exists); with a token it then loads the current user; without a token it is unauthenticated `[Implemented]` `src/lib/AuthContext.jsx:20-47,90-111`. Tokens arrive via an `access_token` query parameter, which is stored under `base44_access_token` and stripped from the URL; `clear_access_token=true` removes stored tokens `[Implemented]` `src/lib/app-params.js:9-49`.
- **Access states** derived from the public-settings response `[Implemented]` `src/lib/AuthContext.jsx:48-78,104-109`:
  - `auth_required` → on any non-public path the app navigates to `/auth` `[Implemented]` `src/App.jsx:182-189`.
  - `user_not_registered` → the full-screen "Access Restricted" page (§7).
  - other reasons / unknown → recorded, no redirect.
- **AR-AUTH-05 — Restore rules.** Every visit to a non-public path is remembered in `lastLocation` `[Implemented]` `src/App.jsx:135-139,163-166`. On a browser reload landing on a public path, an authenticated user is returned to `lastLocation`; on a fresh open (new tab or window) an authenticated user always lands on `/dashboard` `[Implemented]` `src/App.jsx:141-161`.
- A spinner is shown while public settings or the user are loading `[Implemented]` `src/App.jsx:169-176`.
- `ProtectedRoute` exists (spinner fallback, "Access Restricted" for unregistered users, otherwise the caller's unauthenticated element) but is not used by the router, and it reads `authChecked` / `checkUserAuth` which the context does not expose `[Partial]` `src/components/ProtectedRoute.jsx:12-37`, `src/lib/AuthContext.jsx:130-141` (D-341).

## 7. Allowlist — "Access Restricted"

- Shown when the platform reports `user_not_registered` `[Implemented]` `src/App.jsx:179-181`. Copy (verbatim) `[Implemented]` `src/components/UserNotRegisteredError.jsx:13-23`:
  - Title "Access Restricted"
  - "You are not registered to use this application. Please contact the app administrator to request access."
  - "If you believe this is an error, you can:" — "Verify you are logged in with the correct account" · "Contact the app administrator for access" · "Try logging out and back in again"

## 8. Roles

- `User.role` is `admin` or `user` (required) `[Implemented]` `base44/entities/User.jsonc:1-17`. Settings shows it read-only under "Role" `[Implemented]` `src/pages/Settings.jsx:621-624`.
- **AR-AUTH-06 — No route or UI branches on role.** The only role checks are server-side: the midnight quote job requires `admin` `[Implemented]` `base44/functions/generateDailyQuotes/entry.ts:16-18`, and `PillarActivity` rows are readable and writable by admins as well as their owner `[Implemented]` `base44/entities/PillarActivity.jsonc:22-57`. Admin-only seed/backfill functions are covered in `10-architecture/automations.md`.

## 9. Per-user data isolation

- **AR-AUTH-07 — One tenant per account.** Every entity restricts create, read, update and delete to rows whose `created_by` equals the signed-in user's email `[Implemented]` `base44/entities/ThemeSettings.jsonc:97-107`, `base44/entities/DailyQuote.jsonc:23-36`, `base44/entities/Affirmation.jsonc:19-32`, `base44/entities/DailyPillarTracking.jsonc:38-51`. Household members and learners are records inside that tenant, not logins (glossary). The manual states "Manage your account, integrations, and data." `[Described]` `src/pages/UserManual.jsx:410`.

## 10. Account card, password change, logout, deletion

- **Account card** (Settings): read-only "Email", "Name", "Role"; a "Change Password" section; a "Delete Account" section `[Implemented]` `src/pages/Settings.jsx:611-644`. Manual: "View your name and email. Delete your account permanently (cannot be undone)." `[Described]` `src/pages/UserManual.jsx:413-414`.
- **Change password:** helper text "We'll send a password reset link to your email address." above a "Change Password" button `[Implemented]` `src/pages/Settings.jsx:626-630` (D-332). The button reveals an inline form "Current Password", "New Password", "Confirm New Password" with "Save Password" / "Cancel"; rules: all fields ("Please fill in all fields"), match ("New passwords do not match"), at least 6 characters ("Password must be at least 6 characters"); success "✓ Password changed successfully!" and the form closes after 2 s; failure shows the platform message or "Failed to change password. Check your current password." `[Implemented]` `src/pages/Settings.jsx:30-105`.
- **AR-AUTH-08 — No logout control.** The context offers `logout` (clears local state and calls the platform logout, redirecting back to the current URL when requested) but no sidebar, header or Settings control invokes it `[Partial]` `src/lib/AuthContext.jsx:113-124` (repository search for `logout`: only account deletion) (D-340). The "Access Restricted" page suggests "Try logging out and back in again" `[Described]` `src/components/UserNotRegisteredError.jsx:22`.
- **Delete account:** a destructive "Delete Account" button with helper "Permanently delete your account and all associated data. This action cannot be undone." opens an alert dialog "Delete Account?" — "This will permanently delete your account and all your data including tasks, schedules, goals, chores, and education plans. This action cannot be undone." with "Cancel" and "Delete Account" ("Deleting..." while running) `[Implemented]` `src/pages/Settings.jsx:632-642,1089-1109`.
- **AR-AUTH-09 — Deletion order: revoke, delete data, delete user.** The backend requires a signed-in user, then (1) disconnects six connector ids (Google Calendar, Google Tasks, Dropbox, Google Docs, Gmail, Google Drive; failures ignored), (2) deletes the user's rows in `Task, ScheduleItem, DailyChecklist, ChecklistCompletion, Goal, GoalTask, Chore, ChoreUser, EducationPlan, EducationActivity, Learner, DailyQuote, Link, ThemeSettings, SelectedCalendars, SyncState`, (3) deletes the user record `[Implemented]` `base44/functions/deleteUserAccount/entry.ts:5-83` (entities outside this list: D-333). On success the client logs out and hard-replaces the location with `/auth`; on failure it alerts "Failed to delete account: {message}" `[Implemented]` `src/pages/Settings.jsx:558-571`.

## 11. Third-party and AI client access (MCP consent) `[Partial]`

- A consent screen for the app's MCP server exists. It reads an opaque `ctx` handle from the query string, fetches the consent details with the session, redirects to the login path (carrying `returnTo` and `from_url`) when the server reports the visitor is signed out, and posts approve or deny `[Partial]` `src/pages/OAuthConsent.jsx:14-135`. The page is not registered in the router and the referenced `base44/mcp/config.json` is not in the repository (D-337).
- Copy (verbatim) `[Partial]` `src/pages/OAuthConsent.jsx:137-237`:
  - Title "Authorize access"; loading "Loading…"
  - Subtitle "{client} wants to access {app} on your behalf" (client defaults to "An AI client", app to "this app")
  - "It will be able to use these tools in {app}:" followed by each tool's title and description, or "No tools requested"
  - Buttons "Deny" and "Approve"
  - After a custom-scheme redirect: "Access granted" / "Access denied" with "You can return to {client} and close this window."
  - Terminal state "Reconnect required" with the server detail or "This authorization can no longer be completed. Reconnect from your AI client to try again."
  - Errors: "This authorization link is invalid or has expired." · "Could not load this authorization request. Please try again." · "Could not complete authorization. Please try again."
- The shared frame (`AuthLayout`) renders an icon, title, optional subtitle, a card and optional footer `[Implemented]` `src/components/AuthLayout.jsx:3-23`.

## 12. Data

| Entity / field | Operation | Citation |
|---|---|---|
| `User` (`full_name`, `email`, `role`, `terms_accepted`, `privacy_accepted`) | register, me, updateMe (flags), deleteUser | `src/pages/Auth.jsx:81-85`, `src/pages/AcceptTerms.jsx:16,50`, `base44/functions/deleteUserAccount/entry.ts:81` |
| Sixteen data entities listed in §10 | delete all rows for the user | `base44/functions/deleteUserAccount/entry.ts:31-78` |
| Connectors | connect (sign-up), disconnect (terms acceptance, deletion) | `src/pages/Auth.jsx:114-128`, `src/pages/AcceptTerms.jsx:34-48`, `base44/functions/deleteUserAccount/entry.ts:12-28` |

## 13. Device-local preferences

| Key | Meaning | Default | Set by | Cleared by |
|---|---|---|---|---|
| `lastLocation` | Last non-public path visited, restored on reload | unset | route changes `src/App.jsx:135-139,163-166` | never |
| `base44_access_token` (and other `base44_*` params) | Session token and app parameters captured from the URL | unset | `src/lib/app-params.js:22-24` | `clear_access_token=true` `src/lib/app-params.js:38-41`; platform logout |

## 14. Discrepancies and open questions

- **D-330** Four different Google connector id pairs are used: sign-up connects `69dd6fdb…`/`69dd7015…` (`src/pages/Auth.jsx:17-18`), terms acceptance disconnects `69dd40c4…`/`69dd389d…` (`src/pages/AcceptTerms.jsx:35-36`), Settings shows `69e73980…`/`69e7399b…` (`src/pages/Settings.jsx:23-28`), and deletion revokes the Settings pair plus Dropbox, Google Docs, Gmail and Google Drive (`base44/functions/deleteUserAccount/entry.ts:13-20`).
- **D-332** The Change Password helper says a reset link will be emailed (`src/pages/Settings.jsx:628`); the control changes the password inline with the current password (`src/pages/Settings.jsx:39-67`).
- **D-333** The deletion dialog promises removal of "all your data" (`src/pages/Settings.jsx:1094`); the function deletes sixteen entity types (`base44/functions/deleteUserAccount/entry.ts:31-78`) and does not touch, for example, `HealthPillar`, `DailyPillarTracking`, `DailyGratitude`, `PillarActivity`, `Affirmation`, `CollageImage`, `UserCollageImage`, `ChoreLibrary`, `FavoriteActivity`, `TrashBin`, `DeletedSyncItem`, `SelectedTaskLists` or `ReminderSettings`.
- **D-336** The reset page links to `/auth?mode=forgot` (`src/pages/ResetPassword.jsx:121`); the auth screen initialises in login mode and ignores the query string (`src/pages/Auth.jsx:27`).
- **D-337** The MCP consent page (`src/pages/OAuthConsent.jsx`) is not routed (`src/App.jsx:194-216`) and its referenced configuration file is absent from the repository.
- **D-340** A logout function exists (`src/lib/AuthContext.jsx:113-124`) but no control invokes it; the only session exits are account deletion (`src/pages/Settings.jsx:563-564`) and token expiry.
- **D-341** `ProtectedRoute` depends on `authChecked` and `checkUserAuth` (`src/components/ProtectedRoute.jsx:13`) which the auth context does not provide (`src/lib/AuthContext.jsx:130-141`), and the router does not use it (`src/App.jsx:194-216`).
- **Q-330** (§2, §5, §10) Which connector id pair represents the product's Google Calendar and Google Tasks connection?
- **Q-331** (§10) Is a visible sign-out intended?
- **Q-332** (§11) Is MCP client access part of the product, and at which path is the consent page meant to be reachable?
- **Q-333** (§10) Is account deletion intended to cover every entity the account owns?
