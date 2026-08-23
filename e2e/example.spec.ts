import { test, expect } from "@playwright/test";

test("application is branded", async ({ page }) => {
	await page.goto("/example");
	await expect(page).toHaveTitle("Daedalus Ops");
});

test("demo is available on its own public route", async ({ page }) => {
	await page.goto("/example");
	await expect(page).toHaveURL(/\/example/);
	await expect(
		page.getByRole("heading", { level: 1, name: /matches/i })
	).toBeVisible();
});
