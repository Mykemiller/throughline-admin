import { expect, test } from "@playwright/test";

/**
 * Happy path from the build brief:
 * search → open subscriber → suspend → toast → log filter by service.
 * Requires ADMIN_ACCESS_KEY in the environment (steward-key login).
 */
test("steward happy path", async ({ page }) => {
  const key = process.env.ADMIN_ACCESS_KEY;
  test.skip(!key, "ADMIN_ACCESS_KEY not set");

  // login via steward key
  await page.goto("/login");
  await page.getByTestId("login-key").fill(key!);
  await page.getByTestId("login-key-submit").click();
  await page.waitForURL("**/");

  // search
  await page.goto("/subscribers");
  await page.getByPlaceholder("Search by name or email…").fill("paul");
  await expect(page.getByText("paul.d@gmail.com")).toBeVisible();

  // open subscriber
  await page.getByText("paul.d@gmail.com").click();
  await page.waitForURL("**/subscribers/**");
  await expect(page.getByText("stones placed in the River")).toBeVisible();

  // suspend (paul is seeded suspended, so this exercises reactivate → suspend)
  const btn = page.getByRole("button", { name: /^(Suspend|Reactivate)$/ });
  const label = await btn.textContent();
  await btn.click();

  // toast
  const expected = label === "Suspend" ? /suspended — the stones are held safe/ : /reactivated — back on the path/;
  await expect(page.getByTestId("toast")).toHaveText(expected);

  // log filter by service
  await page.goto("/sources?source=Photo%20Ingestion");
  await expect(page.getByText("Checksum failed for IMG_4471.heic (paul) — client asked to resend")).toBeVisible();
  await page.goto("/sources?source=Photo%20Ingestion&severity=info");
  await expect(page.getByText("Nothing in the log for that filter. Quiet water.")).toBeVisible();
});
