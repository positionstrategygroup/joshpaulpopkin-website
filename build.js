// Static build. Reads content/articles/<slug>/index.md (+ images beside it)
// and writes the whole site to /public. No framework: one file, one pass.
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import { imageSize } from 'image-size';

const site = JSON.parse(fs.readFileSync('site.json', 'utf8'));
const A = site.author;
const OUT = 'public';
const KEY = fs.readFileSync('indexnow.key', 'utf8').trim();
const TODAY = new Date().toISOString().slice(0, 10);
import { createHash } from 'node:crypto';
const CSS_V = createHash('md5').update(fs.readFileSync('static/styles.css')).digest('hex').slice(0, 8);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync('static', OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, `${KEY}.txt`), KEY);

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtDate = d => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const abs = p => (p.startsWith('http') ? p : site.url + p);
const dims = file => { try { const d = imageSize(fs.readFileSync(file)); return { width: d.width, height: d.height }; } catch { return {}; } };
const write = (rel, html) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };

// ---------- frontmatter ----------
function parseFront(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: src };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const k = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!k) continue;
    let v = k[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (v.startsWith('[') && v.endsWith(']')) v = v.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    data[k[1]] = v;
  }
  return { data, body: m[2] };
}

// ---------- articles ----------
const articles = [];
const artDir = 'content/articles';
if (fs.existsSync(artDir)) {
  for (const slug of fs.readdirSync(artDir)) {
    const dir = path.join(artDir, slug);
    const md = path.join(dir, 'index.md');
    if (!fs.existsSync(md)) continue;
    const { data, body } = parseFront(fs.readFileSync(md, 'utf8'));
    if (String(data.draft) === 'true') continue;
    const imgDir = path.join(OUT, 'images', slug);
    fs.mkdirSync(imgDir, { recursive: true });
    const images = []; // every image in the piece, for sitemap + schema
    for (const f of fs.readdirSync(dir)) if (f !== 'index.md') fs.copyFileSync(path.join(dir, f), path.join(imgDir, f));

    const resolve = href => (/^(https?:)?\//.test(href) ? href : `/images/${slug}/${href}`);
    const localFile = href => (href.startsWith('/images/') ? path.join(OUT, href) : null);
    const renderer = {
      image({ href, title, text }) {
        const src = resolve(href);
        const [cap, credit] = (title || '').split('||').map(s => s.trim());
        const d = localFile(src) ? dims(localFile(src)) : {};
        images.push({ url: abs(src), caption: cap || text, ...d });
        return `<figure class="fig"><img src="${esc(src)}" alt="${esc(text)}" loading="lazy" decoding="async"${d.width ? ` width="${d.width}" height="${d.height}"` : ''}>` +
          (cap || credit ? `<figcaption>${esc(cap || '')}${credit ? ` <span class="credit">${esc(credit)}</span>` : ''}</figcaption>` : '') + `</figure>`;
      },
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const id = text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      }
    };
    marked.use({ renderer, gfm: true });
    const html = marked.parse(body).replace(/<p>(<figure[\s\S]*?<\/figure>)<\/p>/g, '$1').replace(/(<video[^>]*\ssrc=")(?!\/|https?:)/g, `$1/images/${slug}/`).replace(/<p>(<video[\s\S]*?<\/video>)<\/p>/g, '<figure class="fig">$1</figure>');
    const faq = String(data.faq) === 'true' ? [...html.matchAll(/<h2 id="[^"]*">([^<]*\?)<\/h2>\s*<p>([\s\S]*?)<\/p>/g)].map(m => ({ q: m[1].replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'"), a: m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'") })) : [];
    const words = body.replace(/!\[[^\]]*\]\([^)]*\)/g, '').split(/\s+/).filter(Boolean).length;

    const hero = data.image ? resolve(data.image) : null;
    const heroDims = hero && localFile(hero) ? dims(localFile(hero)) : {};
    if (hero) images.unshift({ url: abs(hero), caption: data.image_caption || data.image_alt || data.title, ...heroDims });

    const publishAt = data.publish ? Date.parse(data.publish) : NaN;
    articles.push({
      publishAt: Number.isFinite(publishAt) ? publishAt : 0, scheduled: Number.isFinite(publishAt) && publishAt > Date.now(),
      slug, url: `/post/${slug}`, title: data.title || slug, dek: data.dek || '', kicker: data.kicker || 'Article',
      date: data.date || TODAY, updated: data.updated || data.date || TODAY, tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
      hero, heroAlt: data.image_alt || data.title, heroCaption: data.image_caption || '', heroCredit: data.image_credit || '', heroDims,
      mtime: fs.statSync(md).mtimeMs, faq, html, words, minutes: Math.max(1, Math.round(words / 230)), images, description: data.description || data.dek || ''
    });
  }
}
articles.sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : b.mtime - a.mtime));

// ---------- schema pieces ----------
const personId = `${site.url}/#josh`;
const orgId = 'https://positionstrategygroup.com/#organization';
const siteId = `${site.url}/#website`;
const person = {
  '@type': 'Person', '@id': personId, name: A.bylineName, alternateName: [A.name, 'Joshua Paul Popkin'], givenName: 'Josh', additionalName: 'Paul', familyName: 'Popkin', url: `${site.url}/about/`,
  image: { '@type': 'ImageObject', url: abs(A.photoSquare), width: 1024, height: 1024 },
  jobTitle: A.jobTitle, description: A.bio,
  worksFor: { '@id': orgId },
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: 'Cornell University' },
    { '@type': 'CollegeOrUniversity', name: 'Bucknell University' }
  ],
  hasOccupation: { '@type': 'Occupation', name: 'Marketing engineer' },
  homeLocation: { '@type': 'Place', name: 'New York, NY' },
  birthPlace: { '@type': 'Place', name: 'Westport, Connecticut' },
  sameAs: A.links.map(l => l.url)
};
const G = site.organization;
const org = { '@type': 'Organization', '@id': orgId, name: G.name, url: G.url, description: G.description, founder: { '@id': personId }, knowsAbout: G.knowsAbout };
const website = { '@type': 'WebSite', '@id': siteId, url: `${site.url}/`, name: site.name, description: site.description, inLanguage: 'en-US', publisher: { '@id': personId }, about: { '@id': personId } };
const ld = graph => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;

// ---------- chrome ----------
const FONTS = 'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap';

function page({ title, description, canonical, body, graph = [], og = {}, current = '' }) {
  const ogImage = og.image || abs(A.photoOg);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta name="author" content="${esc(A.bylineName)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate" type="application/rss+xml" title="${esc(site.name)}" href="/rss.xml">
<meta property="og:type" content="${og.type || 'website'}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(og.title || title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
${og.width ? `<meta property="og:image:width" content="${og.width}">\n<meta property="og:image:height" content="${og.height}">` : '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="628">'}
${og.published ? `<meta property="article:published_time" content="${og.published}">\n<meta property="article:modified_time" content="${og.modified}">\n<meta property="article:author" content="${esc(A.bylineName)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(og.title || title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${ogImage}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS}" rel="stylesheet">
<link rel="stylesheet" href="/styles.css?v=${CSS_V}">
${ld(graph)}
</head>
<body>
<header class="mast">
  <div class="topline">
    <span class="mono"><i class="dot"></i>${esc(site.city)}</span>
    <span class="mono" id="today"></span>
  </div>
  <a class="name" href="/">${esc(site.name)}</a>
  ${site.tagline ? `<p class="tag">${esc(site.tagline)}</p>` : ''}
  <nav class="menu" aria-label="Site">
    <a href="/blog"${current === 'articles' ? ' aria-current="page"' : ''}>Perspectives</a>
    <a href="/about/"${current === 'about' ? ' aria-current="page"' : ''}>About</a>
  </nav>
</header>
<main>
${body}
</main>
<footer class="foot">
  <span class="mono">${new Date().getFullYear()} &copy; ${esc(A.bylineName)}</span>
  <nav aria-label="Footer">
    <a href="/blog">Perspectives</a>
    <a href="/about/">About</a>
    <a href="https://positionstrategygroup.com/" rel="me">Position Strategy Group</a>
    <a href="https://joshpopkin.com/" rel="me">joshpopkin.com</a>
    <a href="https://joshpopkincarteragency.com/" rel="me">Carter Agency</a>
  </nav>
</footer>
<script>
document.getElementById('today').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
(function(){var els=document.querySelectorAll('.rv');if(!('IntersectionObserver'in window)){els.forEach(function(e){e.classList.add('in')});return}
var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -8% 0px'});
els.forEach(function(e){io.observe(e)})})();
</script>
</body>
</html>`;
}

const byline = a => `<div class="byline"><span class="by">By <a href="/about/">${esc(A.bylineName)}</a></span><span class="mono">${fmtDate(a.date)} &middot; ${a.minutes} min read</span></div>`;

const card = (a, big = false) => `<article class="card${big ? ' lead' : ' rv'}">
  ${a.hero ? `<a class="pic" href="${a.url}"><img src="${esc(a.hero)}" alt="${esc(a.heroAlt)}"${a.heroDims.width ? ` width="${a.heroDims.width}" height="${a.heroDims.height}"` : ''}${big ? '' : ' loading="lazy"'} decoding="async"></a>` : ''}
  <div class="txt">
    <p class="kicker mono"><i class="dot"></i>${esc(a.kicker)}</p>
    <h${big ? 2 : 3}><a href="${a.url}">${esc(a.title)}</a></h${big ? 2 : 3}>
    ${a.dek ? `<p class="dek">${esc(a.dek)}</p>` : ''}
    ${byline(a)}
  </div>
</article>`;

const aboutStrip = (heading = 'h2') => `<section class="about${heading === 'h2' ? ' rv' : ' solo'}" id="about">
  <a class="portrait" href="/about/"><img src="${esc(A.photo)}" alt="${esc(A.name)}" width="1600" height="2000" loading="lazy" decoding="async"></a>
  <div class="txt">
    <p class="kicker mono"><i class="dot"></i>About the author</p>
    <${heading}>${esc(A.bylineName)}</${heading}>
    <p class="bio">${esc(A.bio).replace('Play Offense', '<em>Play Offense</em>')}</p>
    <ul class="links">${A.links.map(l => `<li><a href="${l.url}" rel="me">${esc(l.label)}</a></li>`).join('')}</ul>
  </div>
</section>`;

// ---------- listing pages (built for a given article set) ----------
function buildListings(articles, prefix = '') {
{
  const [lead, ...rest] = articles;
  const body = articles.length
    ? `${aboutStrip('h1')}
<section class="list"><h2 class="sect">Perspectives</h2></section>
${card(lead, true)}
${rest.length ? `<section class="grid">${rest.map(a => card(a)).join('\n')}</section>` : ''}`
    : `${aboutStrip('h1')}`;
  write(prefix + 'index.html', page({
    title: site.homeTitle || (site.tagline ? `${site.name} — ${site.tagline.replace(/\.$/, '')}` : site.name), description: site.description, canonical: `${site.url}/`, body,
    graph: [website, person, { '@type': 'CollectionPage', '@id': `${site.url}/#home`, url: `${site.url}/`, name: site.name, isPartOf: { '@id': siteId }, about: { '@id': personId },
      hasPart: articles.map(a => ({ '@type': 'Article', '@id': `${site.url}${a.url}#article`, headline: a.title, url: site.url + a.url, datePublished: a.date, image: a.hero ? abs(a.hero) : undefined })) }]
  }));
}

// ---------- articles index ----------
write(prefix + 'blog.html', page({
  title: `Perspectives — ${site.name}`, description: `Every article published by ${site.name}, newest first.`, canonical: `${site.url}/blog`, current: 'articles',
  body: `<section class="list"><h1 class="sect">Perspectives</h1>${articles.length ? articles.map(a => card(a)).join('\n') : '<p class="empty mono">First article publishing soon.</p>'}</section>`,
  graph: [website, person, { '@type': 'CollectionPage', url: `${site.url}/blog`, name: 'Perspectives', isPartOf: { '@id': siteId } }]
}));

// ---------- about ----------
if (!prefix) write('about/index.html', page({
  title: `About Josh Paul Popkin — Entrepreneur, Marketing Engineer and Author`, description: site.about[0], canonical: `${site.url}/about/`, current: 'about',
  og: { image: abs(A.photoOg), width: 1200, height: 628 },
  body: `<section class="agency">
  <p class="kicker mono"><i class="dot"></i>About</p>
  <h1>${esc(A.bylineName)}</h1>
  ${site.about.map(p => `<p>${p}</p>`).join('\n  ')}
</section>
<section class="profile">
  <figure class="portrait-lg rv"><img src="${esc(A.photo)}" alt="${esc(A.name)}" width="1600" height="2000" decoding="async"><figcaption>${esc(A.name)}, New York.</figcaption></figure>
  <div class="txt rv">
    <p class="kicker mono"><i class="dot"></i>Bio</p>
    <h2 class="h1">${esc(A.name)}</h2>
    <p class="bio">${esc(A.bio).replace('Play Offense', '<em>Play Offense</em>')}</p>
    <h2 class="sub">Elsewhere</h2>
    <ul class="links">${A.links.map(l => `<li><a href="${l.url}" rel="me">${esc(l.label)}</a></li>`).join('')}</ul>
  </div>
</section>`,
  graph: [website, person, org, { '@type': 'AboutPage', '@id': `${site.url}/about/#page`, url: `${site.url}/about/`, name: `About ${A.bylineName}`, mainEntity: { '@id': personId }, about: [{ '@id': personId }, { '@id': orgId }], isPartOf: { '@id': siteId } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${site.url}/` }, { '@type': 'ListItem', position: 2, name: 'About', item: `${site.url}/about/` }] }]
}));

// ---------- article pages ----------
for (const a of (prefix ? [] : articles)) {
  const others = articles.filter(x => x !== a && !x.scheduled).slice(0, 4);
  const url = site.url + a.url;
  const body = `<article class="art">
  <header class="art-head">
    <p class="kicker mono"><i class="dot"></i>${esc(a.kicker)}</p>
    <h1>${esc(a.title)}</h1>
    ${a.dek ? `<p class="dek">${esc(a.dek)}</p>` : ''}
    ${byline(a)}
  </header>
  ${a.hero ? `<figure class="hero"><img src="${esc(a.hero)}" alt="${esc(a.heroAlt)}"${a.heroDims.width ? ` width="${a.heroDims.width}" height="${a.heroDims.height}"` : ''} decoding="async" fetchpriority="high">${a.heroCaption || a.heroCredit ? `<figcaption>${esc(a.heroCaption)}${a.heroCredit ? ` <span class="credit">${esc(a.heroCredit)}</span>` : ''}</figcaption>` : ''}</figure>` : ''}
  <div class="body">
${a.html}
  </div>
  <footer class="art-end"><i class="dot"></i></footer>
</article>
${aboutStrip()}
${others.length ? `<section class="more"><h2 class="sect">More articles</h2>${others.map(o => card(o)).join('\n')}</section>` : ''}`;
  write(`post/${a.slug}.html`, page({
    title: `${a.title} — ${site.name}`, description: a.description, canonical: url, current: 'articles',
    og: { type: 'article', title: a.title, image: a.hero ? abs(a.hero) : undefined, width: a.heroDims.width, height: a.heroDims.height, published: a.date, modified: a.updated },
    body,
    graph: [{
      '@type': 'Article', '@id': `${url}#article`, headline: a.title, alternativeHeadline: a.dek || undefined, description: a.description,
      image: a.images.map(i => ({ '@type': 'ImageObject', url: i.url, width: i.width, height: i.height, caption: i.caption })),
      datePublished: a.date, dateModified: a.updated, inLanguage: 'en-US', isAccessibleForFree: true, wordCount: a.words,
      articleSection: a.kicker, keywords: a.tags.length ? a.tags.join(', ') : undefined,
      author: { '@id': personId }, publisher: { '@id': personId }, mainEntityOfPage: { '@id': url }, isPartOf: { '@id': siteId }
    }, person, website,
    ...(a.faq.length ? [{ '@type': 'FAQPage', '@id': `${url}#faq`, mainEntity: a.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : []),
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${site.url}/` }, { '@type': 'ListItem', position: 2, name: 'Perspectives', item: `${site.url}/blog` }, { '@type': 'ListItem', position: 3, name: a.title, item: url }] }]
  }));
}

// ---------- 404 ----------
if (!prefix) write('404.html', page({ title: `Page not found — ${site.name}`, description: 'That page does not exist.', canonical: `${site.url}/404`, body: `<section class="list"><h1 class="sect">Page not found</h1><p class="empty">That address does not exist. <a href="/">Back to the front page.</a></p></section>`, graph: [website] }).replace('<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">', '<meta name="robots" content="noindex">'));

// ---------- sitemap (with image entries), RSS, llms.txt ----------
const imgXml = imgs => imgs.map(i => `    <image:image><image:loc>${esc(i.url)}</image:loc>${i.caption ? `<image:caption>${esc(i.caption)}</image:caption>` : ''}</image:image>`).join('\n');
const urls = [
  { loc: `${site.url}/`, lastmod: articles[0]?.updated || TODAY, imgs: [{ url: abs(A.photo), caption: A.name }] },
  { loc: `${site.url}/blog`, lastmod: articles[0]?.updated || TODAY, imgs: [] },
  { loc: `${site.url}/about/`, lastmod: TODAY, imgs: [{ url: abs(A.photo), caption: `${A.name}, New York` }, { url: abs(A.photoSquare), caption: A.name }] },
  ...articles.map(a => ({ loc: site.url + a.url, lastmod: a.updated, imgs: a.images }))
];
write(prefix + 'sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n${imgXml(u.imgs)}\n  </url>`).join('\n')}
</urlset>
`);

write(prefix + 'rss.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
  <title>${esc(site.name)}</title>
  <link>${site.url}/</link>
  <description>${esc(site.description)}</description>
  <language>en-us</language>
  <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml"/>
${articles.map(a => `  <item>
    <title>${esc(a.title)}</title>
    <link>${site.url + a.url}</link>
    <guid isPermaLink="true">${site.url + a.url}</guid>
    <pubDate>${new Date(`${a.date}T12:00:00Z`).toUTCString()}</pubDate>
    <description>${esc(a.description)}</description>
    <dc:creator>${esc(A.bylineName)}</dc:creator>
    <content:encoded><![CDATA[${a.hero ? `<p><img src="${abs(a.hero)}" alt="${esc(a.heroAlt)}"></p>` : ''}${a.html.replace(/src="\//g, `src="${site.url}/`).replace(/href="\//g, `href="${site.url}/`)}]]></content:encoded>
  </item>`).join('\n')}
</channel>
</rss>
`);

write(prefix + 'llms.txt', `# ${site.name}

> ${site.description}

## About the author

${A.bio}

## Articles
${articles.length ? articles.map(a => `- [${a.title}](${site.url + a.url}): ${a.description}`).join('\n') : '- (none published yet)'}

## Elsewhere
${A.links.map(l => `- [${l.label}](${l.url})`).join('\n')}
`);
}

buildListings(articles);
const embargoed = articles.filter(a => a.scheduled);
// One listing set per stage: /_pre/<T>/ hides everything scheduled at or after time T,
// so each piece appears the moment its own time passes even when several are queued.
for (const T of [...new Set(embargoed.map(a => a.publishAt))]) {
  buildListings(articles.filter(a => !(a.scheduled && a.publishAt >= T)), `_pre/${T}/`);
}
fs.writeFileSync('embargo.json', JSON.stringify({
  key: KEY, host: new URL(site.url).host, site: site.url,
  items: embargoed.map(a => ({ path: a.url, images: `/images/${a.slug}/`, until: a.publishAt, iso: new Date(a.publishAt).toISOString() }))
}, null, 2));
console.log(`built ${articles.length} article(s) (${embargoed.length} embargoed) → ${OUT}/`);
