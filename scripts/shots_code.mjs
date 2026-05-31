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
const clickText = (text) =>
  page.evaluate((t) => {
    const b = [...document.querySelectorAll("button")].find(
      (x) => x.textContent.trim() === t,
    );
    if (b) b.click();
    return !!b;
  }, text);

await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
await sleep(4800);

await page.click('[data-dock-item="code"]');
await sleep(1000);

// JavaScript run (instant)
await clickText("JavaScript");
await sleep(400);
await clickText("Run");
await sleep(1500);
await shot("12-code-js");

// Python run (downloads Pyodide on first run)
await clickText("Python");
await sleep(400);
await clickText("Run");
console.log("waiting for Pyodide…");
await sleep(28000);
await shot("13-code-python");

// Forge running code mid-mission
await page.click('[data-dock-item="agents"]');
await sleep(800);
await page.click('input[placeholder*="mission"]');
await page.type('input[placeholder*="mission"]', "Build a function to rank a list of items by score", { delay: 8 });
await page.keyboard.press("Enter");
await sleep(9000);
await shot("14-forge-exec");

await browser.close();
console.log("done");
