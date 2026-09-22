# Legal Copy — Privacy Policy, Terms of Use, and Acceptance Summaries

**Area:** overview · **Level:** 0 · **Status:** draft

**Tag summary:** Implemented 8 · Described 24 · Partial 0

**Sources owned:** `src/pages/PrivacyPolicy.jsx`, `src/pages/TermsOfUse.jsx`, the summary blocks in `src/pages/AcceptTerms.jsx:82-126`
**Sources referenced (owned elsewhere):** `src/pages/AcceptTerms.jsx` behaviour (checkboxes, what accepting writes) → `10-architecture/auth-and-account.md` §5 · routes `/privacy-policy`, `/terms-of-use` and the landing footer links → `20-features/app-shell` §0.1, §0.3 · support address → `20-features/user-manual` §4.4 · account deletion → `10-architecture/auth-and-account.md` §10 · Google data handling → `10-architecture/google-sync.md`, `external-services.md`

This document records the product's legal texts **verbatim** so that the commitments they make can be traced. Every block is `[Described]`: the text states the commitment; whether the prototype's code honours it is audited in `90-traceability/`, not here. Headings are preserved; inline emphasis is dropped except where it carries a link.

## 1. Where the texts appear

- **Privacy Policy** page at `/privacy-policy`, reached from the landing footer link "Privacy Policy"; it carries a "Back to Home" link to `/` `[Implemented]` `src/App.jsx:199`, `src/pages/LandingPage.jsx:76`, `src/pages/PrivacyPolicy.jsx:8-10`.
- **Terms of Use** page at `/terms-of-use`, reached from the landing footer link "Terms of Use"; "Back to Home" to `/` `[Implemented]` `src/App.jsx:200`, `src/pages/LandingPage.jsx:78`, `src/pages/TermsOfUse.jsx:8-10`.
- Both pages are public (no session required) and render outside the sidebar shell `[Implemented]` `src/App.jsx:143,194-200`.
- Both pages show "Last updated: April 9, 2026" `[Implemented]` `src/pages/PrivacyPolicy.jsx:12`, `src/pages/TermsOfUse.jsx:12`.
- **Acceptance summaries**: the terms gate at `/accept-terms` shows a shortened Privacy Policy and Terms of Use side by side in scrollable panels, each with its own checkbox ("I agree to the Privacy Policy", "I agree to the Terms of Use"); the gate does not link to the full pages `[Implemented]` `src/pages/AcceptTerms.jsx:78-126`. Gate behaviour: `10-architecture/auth-and-account.md` §5 (AR-AUTH-04).
- The full pages and the summaries are the only places the legal text exists; there is no in-app link to them after sign-in `[Implemented]` (repository search for `/privacy-policy` and `/terms-of-use`: `src/App.jsx:199-200`, `src/pages/LandingPage.jsx:76,78` only).

## 2. Privacy Policy (verbatim)

Page title: "Privacy Policy" · "Last updated: April 9, 2026" `[Described]` `src/pages/PrivacyPolicy.jsx:11-12`

### 1. Introduction
`[Described]` `src/pages/PrivacyPolicy.jsx:16-17`

> Welcome to The Daily Dash ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.

### 2. Information We Collect
`[Described]` `src/pages/PrivacyPolicy.jsx:21-22`

> We collect information you provide directly to us when you register for an account, including your name and email address. When you connect third-party services such as Google Calendar or Google Tasks, we access only the data necessary to provide our scheduling and task management features.

### 3. How We Use Your Information
`[Described]` `src/pages/PrivacyPolicy.jsx:26-27`

> We use the information we collect to provide, maintain, and improve our services, including syncing your tasks and calendar events, sending daily reflections, and personalizing your experience.

### 4. Google API Data
`[Described]` `src/pages/PrivacyPolicy.jsx:31-32`

> Our use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. We do not sell your Google data to third parties.

The phrase "Google API Services User Data Policy" is a link to `https://developers.google.com/terms/api-services-user-data-policy` opening in a new tab `[Implemented]` `src/pages/PrivacyPolicy.jsx:32`.

### 5. Data Security
`[Described]` `src/pages/PrivacyPolicy.jsx:36-37`

> We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

### 6. Contact Us
`[Described]` `src/pages/PrivacyPolicy.jsx:41-42`

> If you have questions about this Privacy Policy, please contact us. [Add your contact email here]

The bracketed placeholder is rendered to the reader as written (D-971).

## 3. Terms of Use (verbatim)

Page title: "Terms of Use" · "Last updated: April 9, 2026" `[Described]` `src/pages/TermsOfUse.jsx:11-12`

### 1. Acceptance of Terms
`[Described]` `src/pages/TermsOfUse.jsx:16-17`

> By accessing or using The Daily Dash, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our application.

### 2. Use of the Service
`[Described]` `src/pages/TermsOfUse.jsx:21-22`

> The Daily Dash is a personal productivity application. You agree to use it only for lawful purposes and in a manner consistent with all applicable laws and regulations. You are responsible for maintaining the security of your account credentials.

### 3. Third-Party Integrations
`[Described]` `src/pages/TermsOfUse.jsx:26-27`

> Our service integrates with third-party platforms including Google. Your use of such integrations is subject to the respective third-party terms of service. We are not responsible for the practices of third-party services.

### 4. User Content
`[Described]` `src/pages/TermsOfUse.jsx:31-32`

> You retain ownership of any content you create within The Daily Dash, including tasks, notes, and reflections. You grant us a limited license to store and display this content solely to provide you with the service.

### 5. Limitation of Liability
`[Described]` `src/pages/TermsOfUse.jsx:36-37`

> The Daily Dash is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.

### 6. Changes to Terms
`[Described]` `src/pages/TermsOfUse.jsx:41-42`

> We reserve the right to modify these terms at any time. We will notify users of significant changes. Continued use of the service after changes constitutes acceptance of the new terms.

### 7. Contact
`[Described]` `src/pages/TermsOfUse.jsx:46-47`

> For questions regarding these Terms of Use, please contact us. [Add your contact email here]

The bracketed placeholder is rendered to the reader as written (D-971).

## 4. Acceptance summaries shown on the terms gate (verbatim)

Page heading "Welcome to The Daily Dash" · "Please review and accept our Privacy Policy and Terms of Use to continue:" `[Described]` `src/pages/AcceptTerms.jsx:78-79`

### Privacy Policy (summary panel)
`[Described]` `src/pages/AcceptTerms.jsx:84-98`

**Information We Collect**
> We collect information you provide directly to us when you register for an account, including your name and email address. When you connect third-party services such as Google Calendar or Google Tasks, we access only the data necessary to provide our scheduling and task management features.

**How We Use Your Information**
> We use the information we collect to provide, maintain, and improve our services, including syncing your tasks and calendar events, sending daily reflections, and personalizing your experience.

**Data Security**
> We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

Checkbox label: "I agree to the Privacy Policy" `[Described]` `src/pages/AcceptTerms.jsx:99-102`

### Terms of Use (summary panel)
`[Described]` `src/pages/AcceptTerms.jsx:107-121`

**Acceptance of Terms**
> By accessing or using The Daily Dash, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our application.

**Use of the Service**
> The Daily Dash is a personal productivity application. You agree to use it only for lawful purposes and in a manner consistent with all applicable laws and regulations.

**User Content**
> You retain ownership of any content you create within The Daily Dash, including tasks, notes, and reflections. You grant us a limited license to store and display this content solely to provide you with the service.

Checkbox label: "I agree to the Terms of Use" `[Described]` `src/pages/AcceptTerms.jsx:122-125`

Footer: "Accept both policies to continue" / "Ready to get started!" · button "Continue to Dashboard" `[Implemented]` `src/pages/AcceptTerms.jsx:134-139` (behaviour: auth spec §5).

### What the summaries leave out

- The Privacy summary omits sections 1 (Introduction), 4 (Google API Data), and 6 (Contact Us) of the full policy `[Described]` `src/pages/AcceptTerms.jsx:86-97` versus `src/pages/PrivacyPolicy.jsx:15-43`.
- The Terms summary omits sections 3 (Third-Party Integrations), 5 (Limitation of Liability), 6 (Changes to Terms), and 7 (Contact), and its "Use of the Service" paragraph lacks the full text's final sentence "You are responsible for maintaining the security of your account credentials." `[Described]` `src/pages/AcceptTerms.jsx:114-116` versus `src/pages/TermsOfUse.jsx:21-22` (D-970).

## 5. Concrete product commitments made by these texts

All rows `[Described]`; the "Where the product does this" column points to the spec that records the corresponding behaviour, without asserting that the behaviour satisfies the commitment (that is the claims audit's job).

| Topic | Commitment (paraphrase of the verbatim text) | Source | Where the product does this |
|---|---|---|---|
| Data collected at registration | name and email address | `src/pages/PrivacyPolicy.jsx:22`, `src/pages/AcceptTerms.jsx:88` | `10-architecture/auth-and-account.md` §2 (Full Name, Email, Password) |
| Data accessed from Google | "only the data necessary to provide our scheduling and task management features" when Google Calendar or Google Tasks is connected | `src/pages/PrivacyPolicy.jsx:22`, `src/pages/AcceptTerms.jsx:88` | `10-architecture/google-sync.md` |
| Purposes of use | provide, maintain, improve; sync tasks and calendar events; "sending daily reflections"; personalise | `src/pages/PrivacyPolicy.jsx:27`, `src/pages/AcceptTerms.jsx:92` | `10-architecture/google-sync.md`, `20-features/quotes`, `10-architecture/automations.md` (midnight quote job), `20-features/theme-editor` |
| Google API data | adheres to the Google API Services User Data Policy including Limited Use; Google data is not sold to third parties | `src/pages/PrivacyPolicy.jsx:32` | `10-architecture/google-sync.md`, `external-services.md` |
| Security | "appropriate technical and organizational measures" against unauthorised access, alteration, disclosure, destruction | `src/pages/PrivacyPolicy.jsx:37`, `src/pages/AcceptTerms.jsx:96` | `10-architecture/auth-and-account.md` §9 (per-user isolation); landing claim "encrypted storage" `src/pages/LandingPage.jsx:15` |
| Retention | not stated in either text | — | none |
| Deletion | not stated in either text | — | account deletion control and its scope: `10-architecture/auth-and-account.md` §10 (AR-AUTH-09, D-333) |
| Ownership of content | the account owner retains ownership of tasks, notes, reflections and every other content they create; the product holds a limited licence to store and display it solely to provide the service | `src/pages/TermsOfUse.jsx:32`, `src/pages/AcceptTerms.jsx:119` | all `20-features/*` entities are per-user (`10-architecture/auth-and-account.md` §9) |
| Permitted use | lawful purposes only; personal productivity application | `src/pages/TermsOfUse.jsx:22`, `src/pages/AcceptTerms.jsx:115` | — |
| Credential responsibility | the account owner is responsible for the security of their account credentials (full text only) | `src/pages/TermsOfUse.jsx:22` | `10-architecture/auth-and-account.md` §3, §4, §10 (password change and reset) |
| Third-party integrations | use of Google is subject to Google's terms; the product is not responsible for third-party practices | `src/pages/TermsOfUse.jsx:27` | `10-architecture/google-sync.md`, `external-services.md` |
| Warranty and liability | provided "as is"; no liability for indirect, incidental, or consequential damages | `src/pages/TermsOfUse.jsx:37` | — |
| Changes to terms | may change at any time; significant changes will be notified; continued use is acceptance | `src/pages/TermsOfUse.jsx:42` | no notification mechanism observed in `src/`; the gate re-checks only the boolean flags (`src/components/Layout.jsx:40-45`) |
| Contact | "please contact us. [Add your contact email here]" | `src/pages/PrivacyPolicy.jsx:42`, `src/pages/TermsOfUse.jsx:47` | `20-features/user-manual` §4.4 gives `Reaginhouse6@gmail.com` (D-971) |
| Acceptance mechanics | both policies must be accepted before the dashboard; acceptance recorded as two booleans on the `User` record | `src/pages/AcceptTerms.jsx:30,50,135-138` | `10-architecture/auth-and-account.md` §5 |
| Effective date | "Last updated: April 9, 2026" on both texts | `src/pages/PrivacyPolicy.jsx:12`, `src/pages/TermsOfUse.jsx:12` | — |

## 6. Discrepancies & open questions

- **D-970** The terms gate's "Use of the Service" summary (`src/pages/AcceptTerms.jsx:115`) omits the sentence "You are responsible for maintaining the security of your account credentials." that the full Terms of Use contain (`src/pages/TermsOfUse.jsx:22`); the account owner accepts the summary, not the full text, and the gate does not link to the full pages (`src/pages/AcceptTerms.jsx:78-126`).
- **D-971** Both legal pages end with the placeholder "[Add your contact email here]" (`src/pages/PrivacyPolicy.jsx:42`, `src/pages/TermsOfUse.jsx:47`), while the User Manual publishes `Reaginhouse6@gmail.com` as the support contact (`src/pages/UserManual.jsx:525-528`).
- **D-972** The Privacy Policy describes the purpose "sending daily reflections" (`src/pages/PrivacyPolicy.jsx:27`); the product generates a daily quote per account and lets the account owner email a quote and reflection on demand (`20-features/quotes`, `10-architecture/automations.md`), and no unsolicited email of reflections is observed in `src/` or `base44/`.
- **Q-970** Blocks: §2 (6), §3 (7). Which contact address is intended for the legal pages? (Also blocks `20-features/user-manual` §4.4.)
- **Q-971** Blocks: §4. Is the terms gate intended to present the full texts (or link to them) rather than the summaries?
- **Q-972** Blocks: §5 (Retention, Deletion). Are retention and deletion commitments intended to be stated, given that an account-deletion control exists (`10-architecture/auth-and-account.md` §10)?
