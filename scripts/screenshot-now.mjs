import { chromium } from 'playwright';
const BASE = 'http://localhost:3000';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

console.log('Navigating...');
await page.goto(`${BASE}/vi`, { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(3000);

console.log('Taking screenshot...');
await page.screenshot({ path: 'screenshot-hero.png', fullPage: false });
console.log('Saved screenshot-hero.png');

await browser.close();
