# Writer Brief — read fully before writing any spec

You are extracting **product intent** from a prototype so it can be reimplemented elsewhere. You are
not reviewing code. You are describing what the user gets, the rules the product follows, and the data
it keeps.

## Non-negotiables

1. **As-is only.** Describe the prototype. Never write how it should be built on another platform, never
   propose schema changes, never suggest improvements.
2. **No bug language.** Do not use the words bug, broken, incorrect, wrong, error, fix, or should. If two
   code paths disagree, record both as `[Implemented]` with citations and open a `D-` entry. Never pick a winner.
3. **Tag and cite every claim.** Every bullet under Capabilities, Business rules, State & lifecycle, and Data
   carries exactly one of `[Implemented]` `[Described]` `[Partial]` and a citation `path:line-range`.
4. **Interaction behaviour, not visual design.** Gestures, views, filters, dialog fields, keyboard, empty
   states: yes. Colours, spacing, fonts: no, unless the colour carries meaning (priority, member, source type,
   meal type, AQI band, urgency badge). Then record the mapping.
5. **Use the glossary.** `00-overview/glossary.md` has canonical terms and forbidden synonyms. Propose new
   terms in your return block; do not invent vocabulary inline.
6. **Own only your files.** Your brief lists owned files and a do-not-document list. For shared components,
   cite the owner spec and describe only this feature's binding (e.g. "swipe-left reveals delete; delete goes
   through the confirm dialog described in shared-interactions").
7. **Verbatim where it matters.** Quote the User Manual, landing page, onboarding steps, empty-state copy,
   confirm-dialog text, and LLM prompt intent verbatim.
8. **Complete, not summarised.** Every user action, every filter value, every enum value, every hardcoded list,
   every localStorage key, every navigation target with its query string. If it is in your owned files and the
   user can see or trigger it, it is in the spec.
9. **IDs.** Use your feature code and your assigned D-/Q- number block. Number sequentially from 01.
10. **Template.** Follow `_template-feature-spec.md` section for section. Empty sections say "None observed."

## Return block (end your final message with this)

```
FILES COVERED: <list>
PROPOSED GLOSSARY TERMS: <term — definition — why>
DISCREPANCIES: <D-nnn one line each>
OPEN QUESTIONS: <Q-nnn one line each, naming the blocked section>
LOCALSTORAGE KEYS: <key — meaning>
NAVIGATION TARGETS: <path?query — from where — why>
ENTITIES TOUCHED: <Entity — ops>
```
