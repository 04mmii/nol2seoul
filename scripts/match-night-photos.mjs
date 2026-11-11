#!/usr/bin/env node
/**
 * One-off matcher: night spots (Seoul viewNightSpot) → night photos from 한국관광공사 관광사진 API
 * (PhotoGalleryService1/gallerySearchList1). Decision 2026-11-10: only night photos; static mapping
 * file; the API is never called by the app. Keys (SEOUL_API_KEY, TOUR_API_KEY) are read from the
 * environment or .env.local and used only here.
 *
 * Usage: node scripts/match-night-photos.mjs --out data/night-photos.json [--report r.json] [--cache c.json] [--relaxed 1]
 *   --cache   reuse raw search results (re-running with other criteria costs no API calls)
 *   --relaxed proposed variant (not the default): night evidence may also come from the photo's tags and
 *             the words 밤 / 달빛; the first word of a multi-word name counts as a core for 반포대교.
 *
 * Acceptance (all must hold), agreed 2026-11-10:
 *  1. the photo title or shooting location contains a core name of the spot (spaces ignored);
 *  2. the shooting location contains "서울" or the spot's district (구);
 *  3. bridges and other common words need the full core name ("한강대교", not "한강");
 *  4. the shooting location names no other region (부산, 경기, 제주, …).
 * Night photo: title or shooting location contains 야경 / 야간.
 */
import fs from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const env = (name) => {
  if (process.env[name]) return process.env[name];
  try { return (fs.readFileSync('.env.local', 'utf8').match(new RegExp(`^${name}=(\\S+)`, 'm')) || [])[1]; } catch { return undefined; }
};
const SEOUL = env('SEOUL_API_KEY');
const TOUR = env('TOUR_API_KEY');
if (!SEOUL || !TOUR) { console.error('SEOUL_API_KEY and TOUR_API_KEY are required'); process.exit(1); }

let calls = 0;
const OTHER_REGIONS = /부산|대구|인천|광주광역|대전|울산|세종|경기|강원|충청|충북|충남|전라|전북|전남|경상|경북|경남|제주/;
const norm = (s) => (s || '').replace(/\s+/g, '').toLowerCase();

/** Core names: main name, parts split by " 내 " / "-", and the text in parentheses. */
export function coreNames(title) {
  const paren = [...title.matchAll(/\(([^)]*)\)/g)].map((m) => m[1].replace(/\s*내$/, '').trim());
  const base = title.replace(/\([^)]*\)/g, ' ');
  const parts = base.split(/\s+내\s+|\s*-\s+|\s+-\s*/).map((s) => s.trim());
  const out = [...parts, ...paren]
    .map((s) => s.replace(/^서울특별시\s*/, '').trim())
    .filter((s) => norm(s).length >= 2);
  return [...new Set(out)];
}

const district = (addr) => (addr.match(/(\S+구)(\s|$)/) || [])[1] || '';

async function gallery(keyword, pageNo) {
  calls++;
  const q = new URLSearchParams({ serviceKey: TOUR, numOfRows: '100', pageNo: String(pageNo), MobileOS: 'ETC', MobileApp: 'NOLSEOUL', arrange: 'A', keyword, _type: 'json' });
  const r = await fetch(`https://apis.data.go.kr/B551011/PhotoGalleryService1/gallerySearchList1?${q}`);
  const j = JSON.parse(await r.text());
  const body = j.response?.body;
  const items = body?.items?.item;
  return { total: body?.totalCount ?? 0, items: Array.isArray(items) ? items : items ? [items] : [] };
}

// --cache file: reuse raw search results (re-evaluating criteria costs no API calls).
const cachePath = args.cache;
const cache = cachePath && fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};
async function search(keyword, maxPages = 6) {
  if (cache[keyword]) return cache[keyword];
  const res = await searchLive(keyword, maxPages);
  cache[keyword] = res;
  return res;
}
async function searchLive(keyword, maxPages) {
  const first = await gallery(keyword, 1);
  let items = first.items;
  for (let p = 2; p <= Math.min(maxPages, Math.ceil(first.total / 100)); p++) items = items.concat((await gallery(keyword, p)).items);
  return { total: first.total, items };
}

function judge(photo, spot, cores) {
  const title = photo.galTitle || '';
  const loc = photo.galPhotographyLocation || '';
  const tags = photo.galSearchKeyword || '';
  const reasons = [];
  const coreHit = cores.find((c) => norm(title).includes(norm(c)) || norm(loc).includes(norm(c)));
  if (!coreHit) reasons.push(cores.some((c) => norm(tags).includes(norm(c))) ? '장소명이 태그에만 있음(제목·촬영장소에 없음)' : '제목·촬영장소에 장소명 없음');
  const gu = district(spot.ADDR);
  if (!/서울/.test(loc) && !(gu && loc.includes(gu))) reasons.push(`촬영장소에 서울/${gu || '자치구'} 없음 ("${loc}")`);
  if (OTHER_REGIONS.test(loc)) reasons.push(`다른 지역 ("${loc}")`);
  const NIGHT = args.relaxed ? /야경|야간|밤|달빛/ : /야경|야간/;
  const night = NIGHT.test(title) || NIGHT.test(loc) || (args.relaxed && NIGHT.test(tags));
  if (!night) reasons.push(/야경|야간/.test(tags) ? '야경이 태그에만 있음' : '야경 사진 아님');
  return { ok: reasons.length === 0, reasons, coreHit };
}

const nightRes = await (await fetch(`http://openapi.seoul.go.kr:8088/${SEOUL}/json/viewNightSpot/1/1000/`)).json();
const spots = nightRes.viewNightSpot.row;

const mapping = {};
const report = [];
for (const spot of spots) {
  const cores = coreNames(spot.TITLE);
  if (args.relaxed && /^반포대교\s/.test(spot.TITLE)) cores.push('반포대교');
  const queries = [`${cores[0]} 야경`, ...cores];
  let chosen = null;
  const seen = new Map();
  const tried = [];
  for (const kw of queries) {
    const { total, items } = await search(kw);
    tried.push(`${kw}:${total}`);
    for (const p of items) if (!seen.has(p.galContentId)) seen.set(p.galContentId, p);
    const judged = items.map((p) => ({ p, ...judge(p, spot, cores) })).filter((x) => x.ok);
    if (judged.length) {
      judged.sort((a, b) => Number(norm(b.p.galTitle).includes(norm(b.coreHit))) - Number(norm(a.p.galTitle).includes(norm(a.coreHit))) || String(b.p.galCreatedtime).localeCompare(String(a.p.galCreatedtime)));
      chosen = judged[0].p;
      break;
    }
  }
  // Rejections worth reviewing: night-ish or name-matching candidates that failed.
  const rejected = [...seen.values()]
    .map((p) => ({ p, ...judge(p, spot, cores) }))
    .filter((x) => !x.ok && (/야경|야간/.test(`${x.p.galTitle} ${x.p.galPhotographyLocation} ${x.p.galSearchKeyword}`)))
    .slice(0, 3)
    .map((x) => ({ title: x.p.galTitle, location: x.p.galPhotographyLocation, photographer: (x.p.galPhotographer || '').trim(), reasons: x.reasons }));
  if (chosen) {
    mapping[spot.TITLE] = {
      url: chosen.galWebImageUrl,
      title: chosen.galTitle,
      location: chosen.galPhotographyLocation,
      photographer: (chosen.galPhotographer || '').replace(/^한국관광공사\s*/, '').trim(),
      month: chosen.galPhotographyMonth,
      contentId: chosen.galContentId,
    };
  }
  report.push({ spot: spot.TITLE, addr: spot.ADDR, cores, tried, candidates: seen.size, chosen: chosen ? mapping[spot.TITLE] : null, rejected });
}

const out = { criteria: args.relaxed ? 'relaxed' : 'approved-2026-11-10', source: '한국관광공사 관광사진 정보 (PhotoGalleryService1)', license: '공공누리 — 이용허락범위 제한 없음 (owner-checked 2026-11-10)', generatedAt: new Date().toISOString(), photos: mapping };
if (cachePath) fs.writeFileSync(cachePath, JSON.stringify(cache));
if (args.out) fs.writeFileSync(args.out, JSON.stringify(out, null, 2) + '\n');
if (args.report) fs.writeFileSync(args.report, JSON.stringify({ calls, report }, null, 2));
console.log(JSON.stringify({ spots: spots.length, matched: Object.keys(mapping).length, calls }));
