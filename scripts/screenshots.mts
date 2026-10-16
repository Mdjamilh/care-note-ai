/**
 * Captures README screenshots (dark mode) from a running app.
 * Usage: PGLITE_IN_MEMORY=1 npm start, then `npm run screenshots`.
 */
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "docs/screenshots";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
const page = await context.newPage();

await page.goto(BASE);
await page.screenshot({ path: `${OUT}/home.png` });

await page.goto(`${BASE}/new`);
await page.getByRole("button", { name: /Blood pressure & diabetes follow-up/ }).click();
await page.screenshot({ path: `${OUT}/new-note.png`, fullPage: true });

await page.getByRole("button", { name: "Draft SOAP note" }).click();
await page.waitForURL(/\/notes\/[0-9a-f-]{36}$/);
await page.getByText("Draft ready for review.").waitFor({ state: "detached" });
await page.screenshot({ path: `${OUT}/note-editor.png`, fullPage: true });
const noteUrl = page.url();

for (const sample of ["Child with ear pain and fever", "Acute low back pain after lifting"]) {
  await page.goto(`${BASE}/new`);
  await page.getByRole("button", { name: new RegExp(sample) }).click();
  await page.getByRole("button", { name: "Draft SOAP note" }).click();
  await page.waitForURL(/\/notes\/[0-9a-f-]{36}$/);
}
await page.goto(noteUrl);
await page.getByRole("button", { name: "Finalize note" }).click();
await page.getByRole("button", { name: /finalize$/ }).click();
await page.getByText("Finalized, read-only").waitFor();

await page.goto(`${BASE}/notes`);
await page.screenshot({ path: `${OUT}/history.png` });

const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
  storageState: await context.storageState(),
});
const phone = await mobile.newPage();
await phone.goto(noteUrl);
await phone.screenshot({ path: `${OUT}/note-mobile.png` });

await browser.close();
console.log("Screenshots saved to", OUT);
