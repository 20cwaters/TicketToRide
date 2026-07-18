/**
 * Server-renders the home-screen art components to a static HTML mock so the
 * visuals can be checked without running the app.
 *
 *   npx tsx scripts/home-preview.ts [outfile.html]
 */
import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { LocomotiveHero, RailwayBackdrop } from '../client/src/components/art';

const backdrop = renderToStaticMarkup(
  createElement(RailwayBackdrop, { className: 'backdrop' }),
);
const hero = renderToStaticMarkup(createElement(LocomotiveHero, { className: 'hero' }));

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Home preview</title>
<style>
  * { margin: 0; box-sizing: border-box; }
  body { height: 100vh; overflow: hidden; background: #141a22; font-family: system-ui, sans-serif; }
  .wrap { position: relative; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .backdrop { position: absolute; inset: 0; width: 100%; height: 100%; }
  .content { position: relative; z-index: 1; text-align: center; }
  .hero { width: 290px; filter: drop-shadow(0 6px 10px rgba(0,0,0,0.4)); }
  h1 { font-family: Georgia, serif; color: #c9a86a; text-transform: uppercase; letter-spacing: 0.12em; font-size: 44px; margin-top: -4px; }
  .sub { color: rgba(233,219,185,0.7); text-transform: uppercase; letter-spacing: 0.3em; font-size: 13px; margin-top: 10px; }
  .panel { width: 384px; margin: 26px auto 0; padding: 24px; border-radius: 12px;
    border: 1px solid rgba(65,85,109,0.8); background: rgba(27,35,46,0.86);
    backdrop-filter: blur(10px); color: #e9dbb9; font-size: 14px; min-height: 210px; }
</style></head><body>
<div class="wrap">
  ${backdrop}
  <div class="content">
    ${hero}
    <h1>Ticket to Ride</h1>
    <div class="sub">— United States —</div>
    <div class="panel">[ create / join form ]</div>
  </div>
</div>
</body></html>`;

const out = process.argv[2] ?? path.join(__dirname, 'home-preview.html');
fs.writeFileSync(out, html);
console.log(`Wrote ${out}`);
