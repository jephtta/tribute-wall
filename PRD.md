# 🕯️ Tribute Wall — Product Requirements Document

**Version 1.0 | March 2026**

---

## 1. Product Overview

Tribute Wall is a web application that lets anyone create a shareable, dedicated page to celebrate or honor a person — for birthdays, retirements, memorials, weddings, graduations, or any meaningful milestone. The creator sets up the wall, populates it with media, and shares a unique link. Anyone with the link can leave a tribute message, attach photos or videos, and react to others' contributions.

The product requires no account creation for contributors — the experience is frictionless by design. Wall creators, however, authenticate to manage their wall and moderate contributions.

---

## 2. Goals & Non-Goals

### Goals

- Enable anyone to create a beautiful, shareable tribute page in under 2 minutes.
- Allow contributors to leave heartfelt messages with optional media — no sign-up required.
- Give wall creators full moderation control over contributed content.
- Ensure a safe, respectful space through reporting and moderation tools.
- Support both celebratory and memorial use cases gracefully.

### Non-Goals (v1)

- Real-time collaboration or co-creator roles (future).
- Monetisation, gating, or paid tiers (future).
- Native mobile apps — responsive web only.
- Direct messaging between contributors.
- Comment threads or replies on tributes.

---

## 3. User Roles

### Wall Creator

The authenticated owner of a wall. Responsible for setting it up, uploading featured media, sharing the link, and moderating tributes. Identified via email/OAuth sign-in.

### Contributor

Anyone with the wall link. Posts tributes and reacts to others'. No account required — identified by a display name they provide at time of posting.

### Visitor

Anyone with the wall link who views but does not post. No interaction required.

---

## 4. Core Features

### 4.1 Wall Creation

The creator completes a short setup flow:

1. **Wall Title** — e.g. "Celebrating Mr. Smoke" or "Happy Mother's Day, Sandra 🌸"
2. **Cover Image** — displayed prominently at the top of the wall.
3. **Short Description** — optional subtitle or bio (max 280 characters).
4. **Wall Tone** — a soft toggle: _Celebration_ or _In Memoriam_. Adjusts colour palette and copy throughout the UI.
5. **Tribute Permissions** — open (anyone can post) or approval-required (creator reviews before publishing).

On completion, the system generates a unique, human-readable slug (e.g. `tributewall.app/for/mr-smoke-jd9k2`) and presents it with a one-click copy button and share options (WhatsApp, email, QR code).

---

### 4.2 Wall Layout & Navigation

The wall has a two-tab structure:

#### Tab 1 — Gallery

Showcases the media collection curated by the wall creator. Content here is creator-only.

- Masonry or grid layout of photos and videos uploaded by the creator.
- Videos auto-preview on hover; tap/click to play full-screen.
- Creator can reorder items via drag-and-drop from their dashboard.
- Lightbox viewer for full-size photo and video playback.
- Upload limit: 50 items, each up to 100 MB (photos) / 500 MB (video).

#### Tab 2 — Tributes

All approved tribute messages from contributors. Newest-first by default; creator can pin up to 3 tributes to the top.

- Each tribute card displays: contributor display name, timestamp (relative and absolute on hover), message text, attached media (up to 3 items), like count, and a report icon.
- Tributes can include text only, media only, or both.
- Creator sees an additional delete (trash) icon on each tribute card when logged in.

---

### 4.3 Tribute Submission

Contributors tap a prominent **"Leave a Tribute"** button (sticky at the bottom of the Tributes tab on mobile; inline above the feed on desktop).

The submission form collects:

- **Display Name** — required, stored locally in browser for repeat visits.
- **Message** — rich plain text, max 1,000 characters.
- **Media Attachments** — up to 3 photos or videos. Photos: JPG, PNG, WEBP, max 20 MB each. Videos: MP4, MOV, max 200 MB each.

If the wall is set to approval-required, the contributor sees a confirmation: _"Your tribute has been submitted and is awaiting approval."_ If open, it publishes immediately and the contributor is scrolled to it.

---

### 4.4 Reactions & Engagement

- Likes only — no dislikes. A single heart/thumbs-up icon per tribute.
- Like state is persisted via localStorage to prevent trivial duplicate likes. No account required.
- Like counts are visible to all. The creator's dashboard shows likes per tribute in aggregate.
- Like counts animate on increment (small bounce/scale effect).

---

### 4.5 Moderation

#### Creator Controls

- Delete any tribute — with a confirmation prompt (_"Remove this tribute? This cannot be undone."_).
- If using approval mode: an **Awaiting Approval** queue in their dashboard lists pending tributes with approve / reject actions.
- Pin up to 3 tributes to the top of the feed.
- Lock the wall — stop new tributes being submitted (useful post-event).
- Edit wall title, description, cover image, and tone at any time.

#### Reporting

- Any visitor can report a tribute via the flag icon.
- Report form offers quick categories: Spam, Offensive language, Impersonation, Other.
- Reported tributes are flagged in the creator's dashboard.
- Tributes with 3+ reports are automatically soft-hidden (still visible to creator) pending creator review.

---

### 4.6 Wall Sharing

- Unique URL per wall — permanent, shareable anywhere.
- One-click copy link button.
- Native share sheet on mobile (Web Share API).
- QR code — downloadable PNG for printed invitations or displays.
- Pre-composed share messages for WhatsApp and email.
- Open Graph meta tags for rich link previews on social platforms (wall title, cover image, description).

---

## 5. Creator Dashboard

Accessible after authentication. The dashboard provides a management view separate from the public-facing wall.

- **Wall overview** — preview thumbnail, live visitor count (approx.), total tributes, total likes.
- **Tribute queue** — pending approvals (if enabled), flagged tributes.
- **Media manager** — reorder, add, or remove Gallery items.
- **Wall settings** — title, description, cover image, tone, tribute permissions, lock toggle.
- **Danger zone** — permanently delete the wall (double-confirm required).

Creators can manage multiple walls from a single account.

---

## 6. Authentication & Accounts

- Wall creators sign in via email/password or OAuth (Google, Apple).
- Contributors require no account — identified only by the display name they enter.
- Creator sessions persist for 30 days.
- Password reset via email link.
- No creator PII is ever displayed on the public wall.

---

## 7. Technical Requirements

### Platform

- Responsive web application — desktop, tablet, mobile.
- No native or installable app — standard browser experience only.
- Target browsers: Chrome, Safari, Firefox, Edge (last 2 major versions).

### Performance

- Time to Interactive (TTI) < 2.5s on 4G mobile.
- Images served via CDN with automatic WebP conversion and responsive srcset.
- Video thumbnails generated server-side; videos streamed, not downloaded.
- Lazy-load all media below the fold.

### Storage & Limits

- Per wall: 50 creator media items, unlimited tributes.
- Per tribute: 3 attachments.
- Total creator storage per account: 5 GB (v1).
- Walls are retained for 3 years from last activity; creator is warned 30 days before expiry.

### Security

- All routes served over HTTPS.
- Unique wall slugs are not guessable (include random suffix).
- File uploads scanned for malware and validated against declared MIME type.
- Rate-limiting on tribute submission and report actions.
- GDPR-compliant: contributors' display names and messages may be deleted on request via the creator.

---

## 8. UX & Design Direction

- Tone toggle drives two distinct visual themes: **Celebration** (warm, festive) and **In Memoriam** (soft, muted, dignified).
- Typography is generous and readable — designed for all ages.
- Minimal chrome — the wall content is the hero; navigation is unobtrusive.
- Accessibility: WCAG 2.1 AA. All interactive elements keyboard-navigable. Alt text on all creator-uploaded images (creator-provided, with fallback).
- Empty states are warm and inviting (_"Be the first to leave a tribute!"_).
- Submission confirmation is immediate and emotionally resonant.

---

## 9. Notifications

Creator email notifications (opt-in):

- New tribute posted (immediate or daily digest — user preference).
- New tribute report flagged.
- Wall approaching storage limit.
- Wall expiry reminder.

No email notifications for contributors in v1.

---

## 10. Future Considerations (Out of Scope for v1)

- Co-creator roles — invite others to help curate and moderate.
- Reactions beyond likes — extended emoji palette.
- Comment threads on tributes.
- Video messages — direct in-browser recording via camera.
- Print / export — generate a PDF keepsake book of the wall.
- Embedding — embed a tribute feed widget on external websites.
- Premium tiers — custom domains, white-label, extended storage.
- Collaborative playlists — music to accompany the wall.

---

## 11. Success Metrics

- Wall creation completion rate > 80% of users who begin the setup flow.
- Average tributes per wall > 5 within 7 days of creation.
- Tribute submission drop-off rate < 15% (form abandonment).
- Reported tribute rate < 1% of all tributes.
- Creator 30-day retention > 40% (creator returns to manage their wall).

---

## 12. Open Questions

1. Should walls have an optional passcode/password layer for private events?
2. Should contributors be able to edit or delete their own tributes within a grace period (e.g. 15 minutes)?
3. What is the abuse handling escalation path beyond the creator? (Platform-level reporting for severe content.)
4. Should the wall URL slug be customisable by the creator, or always auto-generated?
