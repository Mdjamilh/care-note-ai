import { expect, test, type Page } from "@playwright/test";

async function draftFromSample(page: Page, sampleTitle: string) {
  await page.goto("/new");
  await page.getByRole("button", { name: new RegExp(sampleTitle) }).click();
  await page.getByRole("button", { name: "Draft SOAP note" }).click();
  await expect(page).toHaveURL(/\/notes\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Draft ready for review.")).toBeVisible();
}

test("the landing page explains demo mode and links to a new note", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Demo mode with sample visits")).toBeVisible();
  await page.getByRole("link", { name: "Start a note" }).click();
  await expect(page.getByRole("heading", { name: "New note" })).toBeVisible();
});

test("the redaction preview masks identifiers before drafting", async ({ page }) => {
  await page.goto("/new");
  await page.getByRole("button", { name: /Blood pressure & diabetes follow-up/ }).click();

  const preview = page.getByRole("region", { name: "What leaves your browser" });
  await expect(preview.getByText(/names?$/)).toBeVisible();
  await expect(preview.getByText("1 phone numbers")).toBeVisible();
  await expect(preview).not.toContainText("Hayes");
  await expect(preview).not.toContainText("555-201-7788");
});

test("draft, edit with autosave, finalize, export and amend a note", async ({ page }) => {
  await draftFromSample(page, "Blood pressure & diabetes follow-up");

  const plan = page.getByLabel("Plan");
  await expect(plan).toContainText("losartan 50 mg daily");
  await expect(page.getByText("Allergies not reviewed")).toBeVisible();

  await plan.fill(`${await plan.inputValue()} Recheck BP in clinic in 4 weeks.`);
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Plan")).toContainText("Recheck BP in clinic in 4 weeks.");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download FHIR DocumentReference" }).click();
  expect((await download).suggestedFilename()).toBe("blood-pressure-diabetes-follow-up.fhir.json");

  await page.getByRole("button", { name: "Finalize note" }).click();
  await page.getByRole("button", { name: /finalize$/ }).click();
  await expect(page.getByText("Finalized, read-only")).toBeVisible();
  await expect(page.getByLabel("Plan")).toHaveAttribute("readonly", "");

  await page.getByRole("button", { name: "Create amendment" }).click();
  await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(
    "Blood pressure & diabetes follow-up (amended)",
  );
  await expect(page.getByLabel("Plan")).not.toHaveAttribute("readonly");
});

test("history search and filters, then delete", async ({ page }) => {
  await draftFromSample(page, "Child with ear pain and fever");
  await draftFromSample(page, "Acute low back pain after lifting");

  await page.goto("/notes");
  await page.getByRole("searchbox", { name: "Search notes" }).fill("ear pain");
  await expect(page).toHaveURL(/q=ear\+pain/);
  await expect(page.getByRole("listitem")).toHaveCount(1);

  await page.getByRole("link", { name: "Child with ear pain and fever" }).click();
  await page.getByRole("button", { name: "Delete note" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL(/\/notes$/);
  await expect(page.getByRole("link", { name: /Child with ear pain/ })).toHaveCount(0);
});

test("notes are private to the browser that created them", async ({ page, browser }) => {
  await draftFromSample(page, "Acute low back pain after lifting");
  const url = page.url();

  const stranger = await browser.newPage();
  await stranger.goto(url);
  await expect(stranger.getByRole("heading", { name: "Note not found" })).toBeVisible();
  await stranger.goto("/notes");
  await expect(stranger.getByText("No notes yet")).toBeVisible();
  await stranger.close();
});

test("demo mode explains how to draft from a custom transcript", async ({ page }) => {
  await page.goto("/new");
  await page
    .getByLabel("Visit transcript")
    .fill(
      "Doctor: What brings you in? Patient: I have had a sore throat for three days and a mild fever since yesterday.",
    );
  await page.getByRole("button", { name: "Draft SOAP note" }).click();
  await expect(page.getByText(/Demo mode can only draft notes for the sample visits/)).toBeVisible();
});
