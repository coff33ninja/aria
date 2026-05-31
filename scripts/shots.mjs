import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = "http://localhost:3000";
const OUT = "public/screenshots";
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  args: ["--no-sandbox", "--hide-scrollbars", "--force-color-profile=srgb"],
});

const page = await browser.newPage();
const shot = async (name) => {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("✓", name);
};
const dock = async (id) => {
  await page.click(`[data-dock-item="${id}"]`);
  await sleep(900);
};

await page.goto(URL, { waitUntil: "networkidle2" });

// 1) Boot screen (capture mid-boot)
await sleep(1500);
await shot("01-boot");

// wait for boot to finish + assistant to auto-open
await sleep(3200);

// 2) Dispatch a real mission from the Assistant
const mission = "Research and compare the best AI coding assistants in 2025";
await page.waitForSelector("textarea");
await page.click("textarea");
await page.type("textarea", mission, { delay: 8 });
await page.keyboard.press("Enter");

// agents window opens + mission starts streaming
await sleep(3600);
await shot("03-agents-running");

// let the mission complete
await sleep(9000);
await shot("02-desktop"); // hero: agents done + assistant behind

// 3) Dashboard
await dock("dashboard");
await sleep(1800); // let charts mount/animate
await shot("04-dashboard");

// 4) Terminal
await dock("terminal");
await sleep(500);
await page.mouse.click(720, 470); // focus terminal body
await sleep(200);
await page.keyboard.type("neofetch", { delay: 12 });
await page.keyboard.press("Enter");
await sleep(300);
await page.keyboard.type("agents", { delay: 12 });
await page.keyboard.press("Enter");
await sleep(300);
await page.keyboard.type("files", { delay: 12 });
await page.keyboard.press("Enter");
await sleep(500);
await shot("05-terminal");

// 5) Files
await dock("files");
await sleep(900);
await shot("06-files");

// 6) Spotlight
await page.click('[data-dock-item="spotlight"]');
await sleep(500);
await page.type('input[placeholder^="Search apps"]', "research the best mechanical keyboards", { delay: 10 });
await sleep(700);
await shot("07-spotlight");
await page.keyboard.press("Escape");
await sleep(300);

// 7) Settings
await dock("settings");
await sleep(900);
await shot("08-settings");

await browser.close();
console.log("done");
