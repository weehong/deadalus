import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import { interceptSubcontractors } from "./subcontractors-api";

test("removing a Member refreshes Members and the Directory, and the last Member remains", async ({
	page,
}) => {
	await interceptSubcontractors(page, [
		{
			id: "acme",
			name: "Acme Fitout",
			members: [
				{ id: "alex", name: "Alex Tan", phone: "+6591234567" },
				{ id: "mei", name: "Mei Lim", phone: "+6592345678" },
			],
		},
	]);
	await signIn(page);
	await page.getByRole("link", { name: "Subcontractors", exact: true }).click();
	await expect(page.getByRole("row", { name: /Acme Fitout/ })).toContainText(
		"2"
	);
	await page.getByRole("link", { name: "Acme Fitout" }).click();
	await page.getByRole("button", { name: "Remove Alex Tan" }).click();
	await expect(
		page.getByRole("cell", { name: "Alex Tan", exact: true })
	).toHaveCount(0);
	await page.getByRole("button", { name: "Remove Mei Lim" }).click();
	await expect(page.getByRole("alert")).toContainText(
		"A Subcontractor must keep at least one Member."
	);
	await expect(
		page.getByRole("cell", { name: "Mei Lim", exact: true })
	).toBeVisible();
	await page.getByRole("link", { name: "Back to Directory" }).click();
	const row = page.getByRole("row", { name: /Acme Fitout/ });
	await expect(row.getByRole("cell", { name: "1", exact: true })).toBeVisible();
	await expect(row).toContainText("+6592345678");
	await expect(row).not.toContainText("+6591234567");
});

test("a failed removal keeps the Member and permits retry", async ({
	page,
}) => {
	await interceptSubcontractors(page, [
		{
			id: "acme",
			name: "Acme Fitout",
			members: [
				{ id: "alex", name: "Alex Tan", phone: "+6591234567" },
				{ id: "mei", name: "Mei Lim", phone: "+6592345678" },
			],
		},
	]);
	await page.route(
		"**/api/v1/subcontractors/acme/members/alex",
		async (route) => {
			await route.fulfill({
				status: 503,
				json: { error: { code: "UNAVAILABLE", message: "Unavailable" } },
			});
		},
		{ times: 1 }
	);
	await signIn(page);
	await page.goto("/subcontractors/acme");
	await page.getByRole("button", { name: "Remove Alex Tan" }).click();
	await expect(page.getByRole("alert")).toContainText(
		"Could not remove the Member. Please try again."
	);
	await expect(
		page.getByRole("cell", { name: "Alex Tan", exact: true })
	).toBeVisible();
	await page.getByRole("button", { name: "Remove Alex Tan" }).click();
	await expect(
		page.getByRole("cell", { name: "Alex Tan", exact: true })
	).toHaveCount(0);
	await expect(page.getByRole("alert")).toHaveCount(0);
});

test("the last-Member explanation is translated", async ({ page }) => {
	await interceptSubcontractors(page);
	await signIn(page);
	await page.evaluate(() => {
		localStorage.setItem("i18nextLng", "zh-CN");
	});
	await page.goto("/subcontractors/subcontractor-1");
	await page.getByRole("button", { name: "移除Member 1" }).click();
	await expect(page.getByRole("alert")).toContainText(
		"分包商必须保留至少一名成员。"
	);
	await expect(
		page.getByRole("cell", { name: "Member 1", exact: true })
	).toBeVisible();
});
