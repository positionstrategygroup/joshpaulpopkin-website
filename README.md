# joshpaulpopkin.com

Josh Paul Popkin's personal site (moved off Wix 2026-09-18; 56 articles carried over with their original URLs). Static article site. Build = `build.js`.

**Hosting (as of 2026-09-18):** GitHub Pages, from the `gh-pages` branch of `positionstrategygroup/joshpaulpopkin-website`, with DNS-only records in the Cloudflare zone (same pattern as joshpopkin.com). `npm run deploy` builds and force-pushes `/public` to `gh-pages`, then pings IndexNow. The Cloudflare Worker (`wrangler.jsonc`, `npm run deploy:worker`) still exists at https://joshpaulpopkin.positionstrategy.workers.dev as a noindexed preview; it lost its custom domains on purpose: Wix served this domain through Cloudflare for SaaS, and a provider's custom hostname outranks a proxied record in the owner's own zone, so a proxied setup kept serving Wix's 404 page. DNS-only records to GitHub bypass the Cloudflare proxy entirely. If Wix's hostname claim is ever confirmed gone, the Worker + custom domains route can be restored (`routes` block in wrangler.jsonc, then `wrangler deploy`).

URL shape: articles at `/post/<slug>` (no trailing slash, exactly what Wix used), listing at `/blog`, canonical host `www`. GitHub Pages redirects the apex to www by itself when both records exist.

## Post an article

1. Make a folder `content/articles/<slug>/` (the slug becomes the URL: `/post/<slug>`, the same shape the old Wix site used, so every indexed URL survived the move).
2. Put `index.md` in it, plus every photo the piece uses (jpg/png/webp, descriptive filenames — Google Images reads them).
3. Frontmatter at the top of `index.md`:

```
---
title: "Headline"
dek: "One sentence under the headline."
kicker: "Section label"            # e.g. Essay, Report, Photographs
date: 2026-09-17
updated: 2026-09-17                 # optional
image: hero.jpg                     # file in the same folder
image_alt: "What the photo shows"
image_caption: "Caption under the hero."
image_credit: "Photo: Josh Popkin"
tags: [one, two]
description: "Meta description (150 chars). Falls back to dek."
draft: false
faq: true            # FAQPage schema from every question H2 + its first paragraph
---
```

4. Body is Markdown. Inline photos: `![alt text](file.jpg "Caption || Photo credit")` — they become `<figure>` with caption, land in the image sitemap and the Article schema.
5. To schedule instead of publishing now, add a `publish:` time (ISO, with offset) to the frontmatter, e.g. `publish: 2026-09-18T09:00:00-04:00`, set `date:` to the same day, and deploy right away. The Worker hides the article (404) and serves listing pages without it until that moment, then flips on Cloudflare's clock. Several can be queued at different times; each appears when its own time passes. An hourly cron pings IndexNow for anything that went live in the previous hour. Request indexing in Search Console by hand afterwards. Deploy again after the time passes to refresh "More articles" links.
6. Publish:

```
npm run deploy
```

That builds `/public`, deploys the Worker, and pings IndexNow with every URL. Google gets it from the sitemap: `https://www.joshpaulpopkin.com/sitemap.xml` (submit once in Search Console, then request indexing per article).

## What every page ships with

Article + ImageObject (every photo) + Person + WebSite + BreadcrumbList JSON-LD, canonical, OG/Twitter with hero image, `article:published_time`, image sitemap, RSS with full content, `llms.txt`, one `<h1>`, semantic `<article>`/`<figure>`.

## Design

PSG tokens (white, Inter, `#FF2A2A`, hairlines) in a newspaper grammar: Newsreader serif for heads and body, masthead with double rule, mono kickers, drop cap, red end-mark. Author bio is the canonical paragraph in `site.json` — change it there and nowhere else. The stylesheet URL carries a content hash automatically. Images carry a one-year immutable cache: when you replace a photo, give it a new filename (e.g. `josh-popkin-headshot-2027.jpg`) and update `site.json`.

## Campaign card (not used here; inherited from the Carter Agency repo)

```
python3 scripts/campaign-card.py content/articles/<slug>/<file>.jpg "Carter Agency · TikTok · 2021" "#Hashtag" "SecondLine" "Brand · short footer"
```

Composites the graded headshot with the campaign title in the site's own type. Keep the kicker and footer under ~28 characters or they run off the right edge. No third-party logos on the portrait.
