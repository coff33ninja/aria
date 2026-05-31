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
const clickText = (t) =>
  page.evaluate((x) => {
    const b = [...document.querySelectorAll("button")].find((e) => e.textContent.trim().toLowerCase() === x);
    if (b) b.click();
    return !!b;
  }, t);

await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
await sleep(4800);
await page.click('[data-dock-item="agents"]');
await sleep(800);
await page.click('input[placeholder*="mission"]');
await page.type('input[placeholder*="mission"]', "Design and build a habit-tracking web app", { delay: 8 });
await page.keyboard.press("Enter");
await sleep(2600);
await clickText("graph");
await sleep(2600); // mid-run: some working, edges flowing
await shot("15-graph-running");
await sleep(8000); // done
await shot("16-graph-done");

await browser.close();
console.log("done");
