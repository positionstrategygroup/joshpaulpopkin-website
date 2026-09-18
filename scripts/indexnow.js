// Pings IndexNow (Bing, Yandex, Naver, Seznam share the index) with every URL
// in the sitemap. Runs after each deploy. Google does not use IndexNow; the
// sitemap in Search Console covers it.
import fs from 'node:fs';
const site = JSON.parse(fs.readFileSync('site.json', 'utf8'));
const key = fs.readFileSync('indexnow.key', 'utf8').trim();
const xml = fs.readFileSync('public/sitemap.xml', 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).filter(u => !/\.(jpg|jpeg|png|webp)$/i.test(u));
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(site.url).host, key, keyLocation: `${site.url}/${key}.txt`, urlList: urls })
});
console.log(`IndexNow: HTTP ${res.status} for ${urls.length} URLs`);
