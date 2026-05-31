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
    const b = [...document.querySelectorAll("button")].find((e) => e.textContent.trim() === x);
    if (b) b.click();
    return !!b;
  }, t);

await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
await sleep(4800);
await page.click('[data-dock-item="settings"]');
await sleep(900);
await clickText("Local");
await sleep(700);
await shot("17-brain-local");
await browser.close();
console.log("done");
