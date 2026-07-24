import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = '.playwright-mcp';
const BASE = 'http://localhost:3000';
const EXE = process.env.LOCALAPPDATA + '\\ms-playwright\\chromium-1228\\chrome-win64\\chrome.exe';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: EXE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

try {
  console.log('Navigating to /vi...');
  await page.goto(`${BASE}/vi`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Big scroll down to solutions area — then slow scroll for GSAP triggers
  await page.evaluate(() => {
    const s = document.querySelector('#solutions');
    if (s) s.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(300);

  for (let i = 0; i < 25; i++) {
    await page.evaluate(() => window.scrollBy(0, 150));
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(2000);

  // Full page from top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/gsap-v2-full.png`, fullPage: true });
  console.log('Saved gsap-v2-full.png');

  // Also scroll solutions into view and clip
  const clip = await page.evaluate(() => {
    const el = document.querySelector('#solutions');
    if (!el) return null;
    el.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -40);
    const rect = el.getBoundingClientRect();
    // Extend height to try to capture all cards
    return { x: rect.x, y: rect.y, width: rect.width, height: Math.min(rect.height, 2400) };
  });
  await page.waitForTimeout(1000);

  if (clip) {
    await page.screenshot({ path: `${OUT}/gsap-v2-clip.png`, clip });
    console.log('Saved gsap-v2-clip.png');
  }

  // Debug: count visible cards
  const info = await page.evaluate(() => {
    const section = document.querySelector('#solutions');
    if (!section) return 'no section';
    const cards = section.querySelectorAll('.card-3d');
    const stem = section.querySelector('.gsap-stem');
    const stemW = stem ? window.getComputedStyle(stem).transform : 'no-stem';
    return `cards: ${cards.length}, stem-transform: ${stemW}`;
  });
  console.log('Debug:', info);

  console.log('Done!');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await browser.close();
}
