// Quick screenshot for visual comparison with image.png
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = '.playwright-mcp';
const BASE = 'http://localhost:3002';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(`${BASE}/vi`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000); // let GSAP animations settle
await page.screenshot({ path: `${OUT}/hero-current.png`, fullPage: false });
console.log('saved hero-current.png');

// Also take a full-page
await page.screenshot({ path: `${OUT}/hero-current-full.png`, fullPage: true });
console.log('saved hero-current-full.png');

await browser.close();
