import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  defaultViewport: { width: 1512, height: 944, deviceScaleFactor: 2 },
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
page.on("requestfailed", (r) => {
  if (r.url().includes("pollinations")) console.log("REQ FAILED:", r.url(), r.failure()?.errorText);
});
await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
await sleep(4800);
await page.click('[data-dock-item="agents"]');
await sleep(800);
await page.click('input[placeholder*="mission"]');
await page.type('input[placeholder*="mission"]', "Design a logo for a coffee app", { delay: 6 });
await page.keyboard.press("Enter");
await sleep(14000);
await page.click('[data-dock-item="files"]');
await sleep(1000);
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((e) => e.textContent.includes("concept.jpg"));
  if (b) b.click();
});
await sleep(6000);
const info = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")].map((i) => ({
    src: i.src.slice(0, 60),
    natW: i.naturalWidth,
    complete: i.complete,
  }));
  return imgs;
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
