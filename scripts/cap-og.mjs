import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  defaultViewport: { width: 1200, height: 630, deviceScaleFactor: 1 },
  args: ["--no-sandbox"],
});
const p = await b.newPage();
await p.goto("file:///tmp/aria-og.html", { waitUntil: "networkidle0" });
await p.screenshot({ path: "public/og.png" });
console.log("og.png written");
await b.close();
