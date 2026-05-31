import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", defaultViewport: { width: 1512, height: 944, deviceScaleFactor: 2 }, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
await sleep(4800);
await page.click('[data-dock-item="agents"]');
await sleep(800);
await page.click('input[placeholder*="mission"]');
await page.type('input[placeholder*="mission"]', "Design a logo for a coffee app", { delay: 6 });
await page.keyboard.press("Enter");
await sleep(13000);
await page.click('[data-dock-item="files"]');
await sleep(1000);
await page.evaluate(() => { const b=[...document.querySelectorAll("button")].find(e=>e.textContent.includes("concept.jpg")); if(b) b.click(); });
try {
  await page.waitForFunction(() => [...document.querySelectorAll("img")].some(i => i.naturalWidth > 0), { timeout: 40000 });
  console.log("IMAGE LOADED");
} catch { console.log("TIMEOUT waiting for image"); }
const info = await page.evaluate(() => [...document.querySelectorAll("img")].map(i => ({ natW: i.naturalWidth, complete: i.complete })));
console.log(JSON.stringify(info));
await page.screenshot({ path: "public/screenshots/19-image-files.png" });
console.log("shot saved");
await browser.close();
