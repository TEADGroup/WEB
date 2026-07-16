// Standalone Phase-1 visual check (no Playwright MCP needed).
// Launches bundled Chromium, drives the running dev server, and captures
// screenshots across theme + language states so the time-of-day theme and i18n
// can be reviewed without a manual browser.
//
// Run:  node scripts/phase1-screenshot.mjs
// Prereq: dev server on http://localhost:3000  +  `npx playwright install chromium`

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = '.playwright-mcp';
const BASE = 'http://localhost:3000';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 820 } });
const page = await ctx.newPage();

async function shot(name) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1800); // let the 1.5s gradient transition settle
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log('  saved', `${OUT}/${name}.png`);
}

try {
  console.log('1) /vi  (auto theme — current VN time)');
  await page.goto(`${BASE}/vi`, { waitUntil: 'domcontentloaded' });
  await shot('vi-auto-check');

  console.log('2) /vi + Dark override');
  await page.getByRole('button', { name: 'Tối', exact: true }).click();
  await shot('dark-check');

  console.log('3) /vi + Light override');
  await page.getByRole('button', { name: 'Sáng', exact: true }).click();
  await shot('light-check');

  console.log('4) switch to English');
  // Button text is the lowercase locale ('en'), shown uppercase via CSS only.
  await page.getByRole('button', { name: 'en', exact: true }).click();
  await shot('en-check');

  console.log('\nTitle:', await page.title());
  console.log('URL:', page.url());
} catch (err) {
  console.error('screenshot failed:', err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
