import { test, expect } from "@playwright/test";

test("home page renders the greeting", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveTitle("Daedalus");
	await expect(page.getByText("Hello, world!")).toBeVisible();
});

// The example page renders live data from GET /api/v1/matches, so this test
// needs the API and its database up (see webServer in playwright.config.ts).
test("can navigate to the example page", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("link", { name: /example/i }).click();
	await expect(page).toHaveURL(/\/example/);
	await expect(
		page.getByRole("heading", { level: 1, name: /matches/i })
	).toBeVisible();
});
