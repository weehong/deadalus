import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import { interceptSubcontractors } from "./subcontractors-api";

test("a narrow Directory wraps long names and phones within the screen", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await interceptSubcontractors(page, [
		{
			id: "long",
			name: "SubcontractorWithAVeryLongUnbrokenDisplayName",
			members: [
				{ id: "long-member", name: "Alex", phone: "+6591234567" },
				{ id: "other-member", name: "Mei", phone: "+6592345678" },
			],
		},
	]);
	await signIn(page);
	await page.goto("/subcontractors");
	const table = page.getByRole("table");
	await expect(table).toBeVisible();
	expect(
		await table.evaluate(
			(element) => element.getBoundingClientRect().right <= window.innerWidth
		)
	).toBe(true);
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth
		)
	).toBe(true);
});

test("an empty Directory invites the first Subcontractor", async ({ page }) => {
	await interceptSubcontractors(page, []);
	await signIn(page);
	await page.getByRole("link", { name: "Subcontractors" }).click();
	await expect(
		page.getByText(
			"No subcontractors yet. Create your first subcontractor to get started."
		)
	).toBeVisible();
	await expect(page.getByText("This screen is not built yet.")).toHaveCount(0);
	await expect(
		page.getByRole("link", { name: "Create the first subcontractor" })
	).toHaveAttribute("href", "/subcontractors/new");
});

test("a pending Directory announces loading", async ({ page }) => {
	await interceptSubcontractors(page);
	let finish!: () => void;
	const pending = new Promise<void>((resolve) => {
		finish = resolve;
	});
	await page.route("**/api/v1/subcontractors**", async (route) => {
		await pending;
		await route.fallback();
	});
	await signIn(page);
	await page.getByRole("link", { name: "Subcontractors" }).click();
	await expect(page.getByRole("status")).toHaveText("Loading subcontractors…");
	finish();
	await expect(page.getByRole("table")).toBeVisible();
});

test("a failed Directory load offers a working retry", async ({ page }) => {
	await interceptSubcontractors(page);
	await page.route(
		"**/api/v1/subcontractors**",
		async (route) => {
			await route.fulfill({
				status: 503,
				json: { error: { code: "UNAVAILABLE", message: "Unavailable" } },
			});
		},
		{ times: 1 }
	);
	await signIn(page);
	await page.getByRole("link", { name: "Subcontractors" }).click();
	await expect(page.getByRole("alert")).toContainText(
		"Could not load the Directory. Please try again."
	);
	await page.getByRole("button", { name: "Retry" }).click();
	await expect(page.getByRole("table")).toBeVisible();
	await expect(page.getByRole("alert")).toHaveCount(0);
});

test("the Directory renders its translated table and paging copy", async ({
	page,
}) => {
	await interceptSubcontractors(page);
	await signIn(page);
	await page.evaluate(() => {
		localStorage.setItem("i18nextLng", "zh-CN");
	});
	await page.goto("/subcontractors");
	await expect(page.getByRole("columnheader", { name: "成员" })).toBeVisible();
	await expect(
		page.getByRole("columnheader", { name: "电话号码" })
	).toBeVisible();
	await expect(page.getByText("第 1 页，共 2 页 · 21 个分包商")).toBeVisible();
	await expect(page.getByRole("button", { name: "下一页" })).toBeVisible();
});

test("the Directory lists stored phones, pages and remains active in the Console", async ({
	page,
}) => {
	await interceptSubcontractors(page);
	await signIn(page);
	await page.getByRole("link", { name: "Subcontractors" }).click();
	await expect(
		page.getByRole("columnheader", { name: "Members" })
	).toBeVisible();
	await expect(
		page.getByRole("cell", { name: "Subcontractor 01", exact: true })
	).toBeVisible();
	await expect(page.getByText("+6591230001")).toBeVisible();
	await expect(page.getByText("Page 1 of 2 · 21 subcontractors")).toBeVisible();
	await expect(
		page.getByRole("link", { name: "Subcontractors" })
	).toHaveAttribute("aria-current", "page");
	await page.getByRole("button", { name: "Next", exact: true }).click();
	await expect(
		page.getByText("Subcontractor 21", { exact: true })
	).toBeVisible();
	await expect(page.getByText("Page 2 of 2 · 21 subcontractors")).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Next", exact: true })
	).toBeDisabled();
	await page.getByRole("button", { name: "Previous" }).click();
	await expect(
		page.getByText("Subcontractor 01", { exact: true })
	).toBeVisible();
});
