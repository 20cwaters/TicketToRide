/**
 * Renders the static board art (geography + route slots + cities) to an HTML
 * file so map data can be tuned without running the app.
 *
 *   npx tsx scripts/board-preview.ts [outfile.html]
 */
import fs from 'fs';
import path from 'path';
import { CITIES, ROUTES } from '../shared/mapData';
import { CANADA_BORDER, LAKES, LAND, MEXICO_BORDER } from '../client/src/geography';

const ROUTE_COLOR_HEX: Record<string, string> = {
  red: '#c9503f',
  orange: '#d97f33',
  yellow: '#d3ab2c',
  green: '#4f8f58',
  blue: '#46709f',
  pink: '#c47ba3',
  black: '#3a3e45',
  white: '#e8e2d2',
  gray: '#a49a86',
};

interface Point {
  x: number;
  y: number;
}

function bezier(a: Point, c: Point, b: Point, t: number) {
  const mt = 1 - t;
  const x = mt * mt * a.x + 2 * mt * t * c.x + t * t * b.x;
  const y = mt * mt * a.y + 2 * mt * t * c.y + t * t * b.y;
  const dx = 2 * mt * (c.x - a.x) + 2 * t * (b.x - c.x);
  const dy = 2 * mt * (c.y - a.y) + 2 * t * (b.y - c.y);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

// Pretend a couple of players claimed routes, to preview the "train car" style.
const FAKE_CLAIMS: Record<string, string> = {
  'seattle-helena-0': '#d84836',
  'helena-denver-0': '#d84836',
  'denver-kansascity-0': '#d84836',
  'chicago-pittsburgh-0': '#3f74b8',
  'pittsburgh-newyork-0': '#3f74b8',
  'neworleans-miami-0': '#4d9e58',
};

let routesSvg = '';
for (const route of ROUTES) {
  const cityA = CITIES.find((c) => c.id === route.from)!;
  const cityB = CITIES.find((c) => c.id === route.to)!;
  const side = route.pairId ? (route.id.endsWith('-0') ? -1 : 1) : 0;
  const dx = cityB.x - cityA.x;
  const dy = cityB.y - cityA.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;
  const off = side * 5.5;
  const a = { x: cityA.x + nx * off, y: cityA.y + ny * off };
  const b = { x: cityB.x + nx * off, y: cityB.y + ny * off };
  const bend = route.curve ?? 0;
  const control = { x: (a.x + b.x) / 2 + nx * bend, y: (a.y + b.y) / 2 + ny * bend };
  const trim = Math.min(0.12, 11 / dist);
  const span = 1 - trim * 2;
  const n = route.length;
  const claimedColor = FAKE_CLAIMS[route.id];

  if (claimedColor) {
    routesSvg += `<path d="M ${a.x} ${a.y} Q ${control.x} ${control.y} ${b.x} ${b.y}" fill="none" stroke="${claimedColor}" stroke-width="4.5" stroke-linecap="round" opacity="0.85"/>`;
  }
  for (let i = 0; i < n; i++) {
    const t0 = trim + (span * i) / n;
    const t1 = trim + (span * (i + 1)) / n;
    const mid = bezier(a, control, b, (t0 + t1) / 2);
    const p0 = bezier(a, control, b, t0);
    const p1 = bezier(a, control, b, t1);
    const len = Math.max(Math.hypot(p1.x - p0.x, p1.y - p0.y) - 4, 8);
    const g = `translate(${mid.x} ${mid.y}) rotate(${mid.angle})`;
    if (claimedColor) {
      routesSvg += `<g transform="${g}">
        <rect x="${-len / 2 - 1.5}" y="-7.5" width="${len + 3}" height="15" rx="4" fill="#f7f3e6"/>
        <rect x="${-len / 2}" y="-6" width="${len}" height="12" rx="3" fill="${claimedColor}" stroke="rgba(0,0,0,0.55)"/>
        <rect x="${-len / 2 + 2}" y="-6" width="${len - 4}" height="3.6" rx="1.6" fill="rgba(255,255,255,0.35)"/>
        <circle cx="${-len / 4}" cy="6.2" r="2" fill="#1c1a14"/>
        <circle cx="${len / 4}" cy="6.2" r="2" fill="#1c1a14"/>
      </g>`;
    } else {
      const dash = route.color === 'gray' ? ' stroke-dasharray="3 2"' : '';
      routesSvg += `<g transform="${g}"><rect x="${-len / 2}" y="-4.5" width="${len}" height="9" rx="2" fill="${ROUTE_COLOR_HEX[route.color]}" fill-opacity="0.88" stroke="rgba(30,24,12,0.5)" stroke-width="1"${dash}/></g>`;
    }
  }
}

let citiesSvg = '';
for (const city of CITIES) {
  citiesSvg += `<circle cx="${city.x}" cy="${city.y}" r="6.5" fill="#b08d57" stroke="#2b2313" stroke-width="1.6"/>
  <circle cx="${city.x}" cy="${city.y}" r="2.2" fill="#f3ead4" opacity="0.9"/>
  <text x="${city.x + (city.labelDx ?? 0)}" y="${city.y + (city.labelDy ?? 20)}" text-anchor="${city.labelAnchor ?? 'middle'}" font-size="12.5" font-weight="700" font-family="Georgia, serif" fill="#33270f" stroke="#f3ead4" stroke-width="3" paint-order="stroke">${city.name}</text>`;
}

const lakesSvg = LAKES.map(
  (d) => `<path d="${d}" fill="url(#water-bg)" stroke="#77918a" stroke-width="1.8" stroke-linejoin="round"/>`,
).join('\n');

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Board preview</title>
<style>body{margin:0;background:#141a22;display:grid;place-items:center;min-height:100vh}svg{max-width:98vw;height:auto}</style></head><body>
<svg viewBox="0 0 1000 620" width="1400">
  <defs>
    <radialGradient id="land-bg" cx="50%" cy="42%" r="80%">
      <stop offset="0%" stop-color="#f3ead4"/><stop offset="70%" stop-color="#eadcbc"/><stop offset="100%" stop-color="#ddc99e"/>
    </radialGradient>
    <linearGradient id="water-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b7c9c0"/><stop offset="100%" stop-color="#a3bab3"/>
    </linearGradient>
  </defs>
  <rect width="1000" height="620" rx="14" fill="url(#water-bg)"/>
  <path d="${LAND}" fill="url(#land-bg)" stroke="#77918a" stroke-width="2.5" stroke-linejoin="round"/>
  ${lakesSvg}
  <path d="${CANADA_BORDER}" fill="none" stroke="#8a7a52" stroke-width="1.6" stroke-dasharray="7 5" opacity="0.55"/>
  <path d="${MEXICO_BORDER}" fill="none" stroke="#8a7a52" stroke-width="1.6" stroke-dasharray="7 5" opacity="0.55"/>
  <rect x="7" y="7" width="986" height="606" rx="10" fill="none" stroke="#8f6f40" stroke-opacity="0.55" stroke-width="2.5"/>
  ${routesSvg}
  ${citiesSvg}
</svg></body></html>`;

const out = process.argv[2] ?? path.join(__dirname, 'board-preview.html');
fs.writeFileSync(out, html);
console.log(`Wrote ${out}`);
