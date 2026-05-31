import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "public/screenshots";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  defaultViewport: { width: 1512, height: 944, deviceScaleFactor: 2 },
  args: ["--no-sandbox", "--hide-scrollbars", "--force-color-profile=srgb"],
});
const page = await browser.newPage();
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` }).then(() => console.log("✓", n));

await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
await sleep(4800);
await page.click('[data-dock-item="agents"]');
await sleep(800);
await page.waitForSelector('input[placeholder*="mission"]');
await page.click('input[placeholder*="mission"]');
await page.type('input[placeholder*="mission"]', "Research the best mechanical keyboards in 2025", { delay: 8 });
await page.keyboard.press("Enter");
await sleep(8500); // Atlas plans, Sage fetches live + streams
await shot("11-live-research");
await browser.close();
console.log("done");
