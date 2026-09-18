// Serves the static site from /public. Redirects www → apex and strips
// /index.html so every page has exactly one URL for search engines.
//
// Scheduled articles: build.js writes embargo.json. Until an item's `until`
// time, the Worker 404s the article + its images and serves the listing
// pages built without it (/_pre/...). The moment the clock passes, the
// normal files are served. Nothing has to run on a laptop for that to happen.
// An hourly cron pings IndexNow for anything that went live in the last hour.
import embargo from './embargo.json' with { type: 'json' };

const LISTINGS = { '/': '/', '/blog': '/blog', '/sitemap.xml': '/sitemap.xml', '/rss.xml': '/rss.xml', '/llms.txt': '/llms.txt' };

export function activeEmbargoes(now = Date.now()) {
  return embargo.items.filter(i => now < i.until);
}

export async function handle(request, env, now = Date.now()) {
  const url = new URL(request.url);
  if (url.hostname === 'joshpaulpopkin.com') {
    url.hostname = 'www.joshpaulpopkin.com';
    return Response.redirect(url.toString(), 301);
  }
  if (url.pathname === '/articles' || url.pathname === '/articles/' || url.pathname === '/blog/') {
    url.pathname = '/blog';
    return Response.redirect(url.toString(), 301);
  }
  if (url.pathname.startsWith('/_pre/')) { const u = new URL(url); u.pathname = '/__404__'; return env.ASSETS.fetch(new Request(u, request)); }
  if (url.pathname.endsWith('/index.html')) {
    url.pathname = url.pathname.slice(0, -'index.html'.length);
    return Response.redirect(url.toString(), 301);
  }
  // Google Search Console verification: must be served at the exact .html URL,
  // and the asset layer would otherwise redirect .html paths.
  // Only tokens that exist as files get served; Google probes a fake token
  // and expects a 404, otherwise it flags the site as hacked.
  if (/^\/google[0-9a-f]{16}\.html$/.test(url.pathname)) {
    const probe = new URL(url); probe.pathname = url.pathname.slice(0, -5);
    const r = await env.ASSETS.fetch(new Request(probe, request));
    if (r.status === 200) return new Response(r.body, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } });
  }

  const notFound = () => { const u = new URL(url); u.pathname = '/__404__'; return env.ASSETS.fetch(new Request(u, request)); };
  if (url.pathname.startsWith('/_pre/')) return notFound();
  const active = activeEmbargoes(now);
  for (const e of active) {
    if (url.pathname.startsWith(e.path) || url.pathname.startsWith(e.images)) return notFound();
  }
  let fetchUrl = new URL(url);
  if (active.length && LISTINGS[url.pathname]) {
    const stage = Math.min(...active.map(e => e.until));   // earliest still-hidden piece
    fetchUrl.pathname = `/_pre/${stage}` + LISTINGS[url.pathname];
  }

  const res = await env.ASSETS.fetch(new Request(fetchUrl, request));
  const h = new Headers(res.headers);
  h.set('x-content-type-options', 'nosniff');
  h.set('referrer-policy', 'strict-origin-when-cross-origin');
  if (/\.(jpg|jpeg|png|webp|avif|svg|css|js|woff2?)$/i.test(url.pathname)) {
    h.set('cache-control', 'public, max-age=31536000, immutable');
  }
  return new Response(res.body, { status: res.status, headers: h });
}

export async function pingIndexNow(now = Date.now()) {
  const HOUR = 60 * 60 * 1000;
  const justLive = embargo.items.filter(i => i.until <= now && i.until > now - HOUR);
  if (!justLive.length) return { pinged: 0 };
  const urlList = [`${embargo.site}/`, `${embargo.site}/articles/`, ...justLive.map(i => embargo.site + i.path)];
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: embargo.host, key: embargo.key, keyLocation: `${embargo.site}/${embargo.key}.txt`, urlList })
  });
  return { pinged: urlList.length, status: res.status };
}

export default {
  fetch: (request, env) => handle(request, env),
  scheduled: async (event, env, ctx) => { console.log('indexnow', JSON.stringify(await pingIndexNow())); }
};
