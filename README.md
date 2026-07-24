# Gift Visuals — Elite 4K Production & Retention Agency

A single-file, mobile-first portfolio website built for showcasing AI-enhanced UGC (User Generated Content) video production work. Designed to convert visitors into clients through high-retention visual storytelling, embedded video proof, and a live client review system.

**Live file:** `index.html`
**Type:** Static single-file website (HTML + CSS + JS, no build step)
**Built for:** Fiverr, Upwork, and direct-client outreach as a UGC/video editing portfolio

---

## Table of Contents

1. [Overview](#overview)
2. [Who This Is For](#who-this-is-for)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [File Structure](#file-structure)
6. [Page Sections Explained](#page-sections-explained)
7. [Video System (Loom Embeds)](#video-system-loom-embeds)
8. [Review System (Supabase)](#review-system-supabase)
9. [Setup Instructions](#setup-instructions)
10. [Deployment](#deployment)
11. [Customization Guide](#customization-guide)
12. [Adding or Removing Videos](#adding-or-removing-videos)
13. [Mobile Optimization Notes](#mobile-optimization-notes)
14. [Known Limitations](#known-limitations)
15. [Troubleshooting](#troubleshooting)
16. [Roadmap Ideas](#roadmap-ideas)
17. [Credits & Contact](#credits--contact)

---

## Overview

This site exists to do one job well: **convert a scrolling stranger into a paying client** by proving, visually and immediately, that Gift Visuals can produce high-retention video content.

It was built specifically with a UGC (User Generated Content) creator's workflow in mind — someone who edits video for fintech, crypto, and creator-economy clients and needs a fast, credible, no-fluff portfolio that can be sent as a single link during a Fiverr or Upwork pitch.

The entire site lives in **one HTML file**. There is no framework, no build process, no `npm install`. You can edit it directly on a phone, in a browser-based code editor, or in any plain text editor, and the changes are visible instantly on refresh.

---

## Who This Is For

This README (and the site itself) is written for:

- AI UGC content creators who need a fast, professional portfolio
- Freelance video editors pitching fintech/crypto/SaaS clients
- Anyone building a single-file, no-backend-maintenance personal brand site
- Beginners who are comfortable with find-and-replace style edits but not full framework development

If that's you — welcome. Everything below is written assuming zero prior web development background.

---

## Features

- **Cinematic dark UI** with animated ambient background orbs (pure CSS, no video/gif weight)
- **Sticky navigation** that becomes solid/blurred on scroll for readability
- **Full-screen hero section** with gradient text and fade-in animation
- **Stats bar** highlighting retention %, turnaround time, output quality, and workflow style
- **Service breakdown grid** explaining exactly what you offer (retention editing, AI enhancement, ads/conversion editing)
- **Embedded video showcase** — all portfolio videos play directly on the page via Loom, no external redirect required
- **Live client review system** — visitors can read approved reviews and submit new ones, backed by a real database (Supabase)
- **FAQ section** to pre-answer common client objections before they even ask
- **Mega CTA block** driving visitors straight to your video proof
- **Floating contact buttons** (WhatsApp + Telegram) that follow the user down the page
- **Fully responsive** — built mobile-first, degrades gracefully to desktop widths

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Structure | HTML5 | Single file, no build tooling needed |
| Styling | Vanilla CSS3 (custom properties/variables) | Full control, no framework bloat |
| Icons | Font Awesome 6 (CDN) | Free, wide icon coverage |
| Video hosting | Loom (embedded via iframe) | Free tier, native player controls, no video file hosting needed |
| Reviews database | Supabase (Postgres + JS client, CDN) | Free tier, real-time capable, no custom backend server required |
| Hosting target | Any static host (Vercel, Netlify, GitHub Pages, Railway static) | Zero server-side code required |

No npm, no React, no build pipeline. Everything is loaded via CDN `<script>` and `<link>` tags directly in the `<head>` and before `</body>`.

---

## File Structure

Since this is a single-file project, structure lives *inside* `index.html` rather than across folders:

```
index.html
│
├── <head>
│   ├── Meta tags (viewport, charset, title)
│   └── Font Awesome CDN link
│
├── <style> (all CSS lives inline in one block)
│   ├── Root variables (colors, spacing, radius)
│   ├── Global reset
│   ├── Background/ambient engine
│   ├── Navigation
│   ├── Hero section
│   ├── Bento/section layout system
│   ├── Stats bar
│   ├── Service stack
│   ├── Review + FAQ styling
│   ├── Video grid (Loom embeds)
│   ├── Footer + floating contact buttons
│   └── Mobile media queries
│
├── <body>
│   ├── Ambient background divs
│   ├── <nav> — logo + Past Videos button
│   ├── <section class="hero"> — headline + subtext
│   ├── <div class="container">
│   │   ├── Stats bar
│   │   ├── Service stack
│   │   ├── #all-videos — Loom video grid
│   │   ├── Reviews container (populated by JS)
│   │   ├── Review submission form
│   │   ├── FAQ section
│   │   └── Mega CTA
│   ├── <footer> — brand, socials, contact
│   └── Floating WhatsApp/Telegram buttons
│
└── <script> (all JS lives inline at the bottom)
    ├── Supabase client initialization
    ├── loadReviews() — fetches approved reviews
    ├── Review form submit handler
    └── Scroll listener for nav background
```

---

## Page Sections Explained

### 1. Navigation Bar
Fixed to the top of the viewport at all times. Starts transparent over the hero, then gains a blurred dark background once the user scrolls past 50px (handled by the `scrolled` class toggle in JS). Contains the logo and the "Past Videos" button, which now jumps to the on-page `#all-videos` section instead of linking externally.

### 2. Hero Section
Full viewport height. Large gradient-clipped headline, a badge label above it, and a one-line value proposition below. Designed to communicate positioning in under 3 seconds of attention.

### 3. Stats Bar
Four quick-hit numbers (retention %, turnaround, quality, workflow) meant to build credibility before the visitor even sees a video. No images required — pure typography.

### 4. Service Stack
Three cards explaining core service categories: Retention Editing, AI Enhancement, and Ads & Conversion editing. Each has an icon, heading, and one-sentence description. Keep these short — clients skim.

### 5. All Videos Section
The proof section. A responsive grid of Loom-embedded videos, each inside a `video-card` with padding and a rounded frame. This is the section the nav button and CTA button both link to via the `#all-videos` anchor.

### 6. Reviews Section
Two parts:
- A **display grid** that fetches and renders approved reviews from Supabase on page load
- A **submission form** that lets any visitor submit a review, which is stored with `is_appro: false` (not yet approved) until you manually approve it in the Supabase dashboard

### 7. FAQ Section
Pre-empts common client questions (software used, revision policy, bulk order handling). Reduces back-and-forth messaging before a client books you.

### 8. Mega CTA
A large, high-contrast gradient block with a single button, reinforcing the video proof one more time before the footer.

### 9. Footer
Brand recap, social links (Telegram, X, TikTok), and direct contact info (email, WhatsApp).

### 10. Floating Contact Buttons
Persistent WhatsApp and Telegram buttons fixed to the bottom-right corner, visible on every scroll position, for instant contact.

---

## Video System (Loom Embeds)

All portfolio videos are hosted on **Loom** and embedded directly into the page using Loom's standard iframe embed format:

```html
<iframe src="https://www.loom.com/embed/VIDEO_ID" allowfullscreen webkitallowfullscreen mozallowfullscreen></iframe>
```

Each iframe sits inside a `.video-frame-wrap` div, which uses the padding-bottom percentage trick to keep a consistent aspect ratio responsively across all screen sizes without JavaScript.

**Why Loom instead of self-hosted video files:**
- No video file storage costs (important on a free-tier setup)
- Loom's own player already includes play/pause, seek bar, and native mobile gestures like double-tap-to-skip
- Fast to update — swap the video ID and the whole embed updates

**Important technical note:** Loom's embed iframe is a locked, cross-origin player. This site does **not** attempt to inject custom JavaScript controls (like custom double-tap gestures) into the Loom player itself, because Loom does not expose a public JS API for that. The native Loom player already provides this behavior out of the box on mobile.

---

## Review System (Supabase)

The reviews section is powered by a live Supabase project.

### How it works

1. On page load, `loadReviews()` runs automatically
2. It queries the `reviews` table, filtering for rows where `is_appro = true`
3. Approved reviews are rendered into `#reviews-container`, sorted newest first
4. When a visitor submits the form, a new row is inserted with `is_appro: false`
5. That new review will **not** appear publicly until you manually flip `is_appro` to `true` in your Supabase table editor

### Why the approval gate exists

This prevents spam, fake reviews, or inappropriate submissions from appearing on your live portfolio without your review. Always check the Supabase dashboard periodically for new pending submissions.

### Database table shape

| Column | Type | Notes |
|---|---|---|
| `id` | uuid / int (auto) | Primary key |
| `name` | text | Reviewer's name or channel handle |
| `content` | text | Review body text |
| `stars` | integer | 1–5 |
| `is_appro` | boolean | Approval gate, defaults to `false` |
| `created_at` | timestamp | Auto-set by Supabase |

---

## Setup Instructions

Since this is a single static file, setup is minimal:

1. Save `index.html` to a folder on your device or computer
2. Open it directly in any browser to preview locally, **or**
3. Serve it through a local dev server (recommended for the Supabase fetch calls to behave correctly) — for example, using a simple local static server app on your phone or a `Live Server`-style browser extension on desktop

No environment variables, no `.env` file, no build step. The Supabase URL and public key are safe to expose in front-end code — they are the **publishable** key, not a secret key, and Supabase Row Level Security (RLS) policies control what that key is actually allowed to do.

### Confirming your Supabase RLS policies

For this to work correctly, your `reviews` table needs:
- A **SELECT** policy allowing public read access where `is_appro = true`
- An **INSERT** policy allowing public inserts (so visitors can submit reviews)
- No public **UPDATE** or **DELETE** policy (so visitors cannot approve their own reviews or edit/delete others' reviews)

---

## Deployment

Because this is a static file with no backend server code, it can be deployed anywhere that serves static files for free:

- **Vercel** — drag-and-drop deploy or connect a GitHub repo, zero config needed
- **Netlify** — same drag-and-drop workflow
- **GitHub Pages** — push to a repo, enable Pages in settings
- **Railway (static)** — works if you're already using Railway for other projects

No server, no database hosting required on your end beyond Supabase's own free tier.

---

## Customization Guide

All customization is done via direct find-and-replace edits inside `index.html`. Common changes:

### Change brand name
Find `GIFT<span>VISUALS</span>` in the nav and `GIFT VISUALS` in the footer.

### Change color theme
All core colors live in the `:root` CSS variables block near the top of the `<style>` tag:

```css
--accent: #0071e3;
```

Changing this one line updates the accent color across buttons, tags, and highlights site-wide.

### Change hero headline
Find the `<h1>Stop Scrolling.<br>Start Selling.</h1>` line inside `.hero`.

### Change contact info
Update the `mailto:` and `wa.me` links in both the footer and the floating contact buttons — there are two places each link appears, so update both.

### Change stats numbers
Find the `.stats-bar` block and edit the `<h4>` values (98%, 24H, 4K, AI) and their labels.

---

## Adding or Removing Videos

To add a new video:

1. Get the Loom share link, e.g. `https://www.loom.com/share/XXXXXXXX`
2. Take just the ID portion after `/share/`
3. Copy an existing `.video-card` block inside `#all-videos`
4. Paste it as a new block and replace the ID in the `src` with:
   `https://www.loom.com/embed/XXXXXXXX`

To remove a video, delete its entire `.video-card` block, including the opening and closing `<div>` tags.

---

## Mobile Optimization Notes

This site was designed **mobile-first**, matching the workflow of a creator who builds and edits directly from a phone. Key mobile behaviors:

- The bento/grid systems collapse to single-column layouts under 1000px width
- Video embeds use aspect-ratio padding so they never overflow or distort on small screens
- Floating contact buttons are sized for thumb-tap accuracy (65px touch targets)
- Font sizes use `clamp()` in the hero so text scales smoothly between mobile and desktop without breakpoints

---

## Known Limitations

- The review submission form has no CAPTCHA or spam protection beyond Supabase RLS — monitor submissions manually
- Loom's embedded player cannot be controlled by custom site JavaScript (no custom seek/skip logic possible beyond what Loom's own player provides natively)
- No analytics/tracking is built in — add your own (e.g. Plausible, GA4) if you want visitor data
- No CMS — all content edits require direct HTML editing

---

## Troubleshooting

**"Fetch Error: TypeError: Failed to fetch" in console**
This means the browser couldn't reach Supabase — usually a local network/preview environment restriction, not a bug in the site itself. The reviews section will show an "Offline" message gracefully instead of breaking the page. This resolves once the site is deployed live with normal internet access.

**Videos not loading**
Double-check the Loom video ID is correct and that the video's Loom privacy setting allows public embedding (not set to private/restricted).

**Reviews not showing after submission**
Expected behavior — new reviews start as `is_appro: false` and require manual approval in your Supabase dashboard before they appear publicly.

---

## Roadmap Ideas

Future additions worth considering as the portfolio grows:

- [ ] Admin-only page to approve/reject reviews without opening Supabase directly
- [ ] Category tags on videos (e.g. "Fintech", "E-commerce", "Ads") with filter buttons
- [ ] Case study pages per major project
- [ ] Testimonial video embeds (in addition to text reviews)
- [ ] Lightweight analytics dashboard

---

## Credits & Contact

**Built by:** Gift Visuals
**Contact:** giftupdate01@gmail.com
**WhatsApp:** +234 916 137 6561
**Telegram:** [@Giftupdateofficial](https://t.me/Giftupdateofficial)
**TikTok:** [@giftpow](https://www.tiktok.com/@giftpow)
**X (Twitter):** [@GiftVisuals](https://x.com/GiftVisuals)

---

*This README documents a single-file static portfolio site. No proprietary frameworks, no closed dependencies — just HTML, CSS, JS, and two free-tier services (Loom + Supabase) doing all the heavy lifting.*
