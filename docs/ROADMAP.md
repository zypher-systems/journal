# Roadmap

## What 1.0 means

*Draft — edit freely.* 1.0 is a finished, workable product, not the next number. It ships when every item here is true:

- A new household can go from the published image to writing in minutes, with docs for install, upgrade, backup and restore.
- Backups cover everything: the database and the photos, and a restore has been run for real from the documented steps.
- Export is complete: the Markdown zip carries its photos, so leaving is as easy as arriving.
- Upgrades are safe from every released version, and every release has notes.
- No known high or moderate advisories in production dependencies, and a full content security policy.
- Household basics are done (0.5.0): inviting someone and their first run need no hand-holding.
- Deleted entries and accounts leave no photos behind.

## 0.1.0 — Writing core (shipped)

Private multi-user journal: Tiptap editor, autosave, tags, photos, daily prompts, heatmap, streaks, search, Markdown export, invite-only auth, Docker stack.

## 0.2.0 — Ease and visual polish (shipped)

Make what exists nicer and easier. No new journal features (no mood, templates, or month calendar).

- Mobile nav so Search and People are reachable on a phone
- Clickable tags and `/tag/[name]` lists
- Heatmap weekday and month labels
- Search highlight styling; day and search empty states
- Visible photo-upload errors; toolbar usable on a narrow screen
- Account theme applied on first paint
- First-entry empty state for a new household member
- Smoke tests and a compose rebuild

## 0.2.1 — Admin boundary (shipped, critical)

Admin actions refuse anyone who isn't an admin; a password reset signs that account out.

## 0.2.2 — Open to everyone (shipped)

Published images and the hardening a public release needs.

- Multi-arch image on GitHub Container Registry, built and smoke-tested by GitHub Actions
- Compose runs the published image; building from source is an overlay
- Sign-in throttling, same-site redirects only, sessions end on password changes
- Escaped search snippets, framing and sniffing headers, CSRF trusts only `ORIGIN`
- Required database password, dev database bound to localhost

## 0.2.3 — Quieter upkeep (shipped)

Routine dependency updates; Dependabot proposes only grouped minor and patch updates.

## 0.2.4 — Less machinery (shipped)

No Dependabot update pull requests, no CI on `main`, and a release promotes the tested image instead of rebuilding it.

## 0.3.0 — Find your days

Month calendar grid, richer discovery of past writing.

## 0.4.0 — Writing surface

Richer toolbar (link, code, headings), drafts, more honest editor feedback. Move to Tiptap 3, which clears the moderate Tiptap 2 advisory.

## 0.5.0 — Household

Invite and admin polish. First-run guidance for a new person in the house.

## 0.6.0 — Remembering

Mood, templates, or reminders — only if we still want them after living with 0.2–0.5.

## Parked

- Self-contained image export
- Photo files removed along with their entries and accounts
- Photos included in the nightly backup
- Onboarding emails
- 2FA
- Changing the household/auth model
