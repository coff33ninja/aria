import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 }, args: ["--no-sandbox","--hide-scrollbars"] });
const page = await browser.newPage();
await page.goto("https://sumanthkm.com/", { waitUntil: "networkidle2", timeout: 40000 });
await sleep(1500);
await page.screenshot({ path: "public/screenshots/22-portfolio-hero.png" });
// scroll to the work section
await page.evaluate(() => document.querySelector('#work')?.scrollIntoView());
await sleep(1200);
await page.screenshot({ path: "public/screenshots/23-portfolio-work.png" });
console.log("captured");
await browser.close();
