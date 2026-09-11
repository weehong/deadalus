import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import { interceptSubcontractors } from "./subcontractors-api";

test("a Directory row opens its Subcontractor and sorted Members with active navigation", async ({
	page,
}) => {
	await interceptSubcontractors(page, [
		{
			id: "acme",
			name: "Acme Fitout",
			members: [
				{ id: "mei", name: "Mei", phone: "+6593333333" },
				{ id: "alex2", name: "Alex", phone: "+6592222222" },
				{ id: "alex1", name: "Alex", phone: "+6591111111" },
			],
		},
	]);
	await signIn(page);
	await page.getByRole("link", { name: "Subcontractors", exact: true }).click();
	await page.getByRole("link", { name: "Acme Fitout" }).click();
	await expect(page).toHaveURL(/\/subcontractors\/acme$/);
	await expect(
		page.getByRole("heading", { name: "Acme Fitout" })
	).toBeVisible();
	await expect(page.getByText("Subcontractor", { exact: true })).toBeVisible();
	await expect(page.getByRole("table", { name: "Members" })).toBeVisible();
	await expect(page.getByRole("row")).toHaveText([
		"NamePhone numberActions",
		"Alex+6591111111Edit MemberRemove",
		"Alex+6592222222Edit MemberRemove",
		"Mei+6593333333Edit MemberRemove",
		"Add Member",
	]);
	await expect(
		page.getByRole("link", { name: "Subcontractors", exact: true })
	).toHaveAttribute("aria-current", "page");
	await page.getByRole("link", { name: "Back to Directory" }).click();
	await expect(page).toHaveURL(/\/subcontractors$/);
});

test("an unknown Subcontractor shows a not-found state with a way back", async ({
	page,
}) => {
	await interceptSubcontractors(page, []);
	await signIn(page);
	await page.goto("/subcontractors/missing");
	await expect(
		page.getByRole("heading", { name: "Subcontractor not found" })
	).toBeVisible();
	await expect(
		page.getByText("This subcontractor no longer exists or could not be found.")
	).toBeVisible();
	await page.getByRole("link", { name: "Back to Directory" }).click();
	await expect(page).toHaveURL(/\/subcontractors$/);
});

test("a visitor without a Session is sent to Sign in", async ({ page }) => {
	await page.goto("/subcontractors/acme");
	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("the Subcontractor screen has translated labels and a translated not-found state", async ({
	page,
}) => {
	await interceptSubcontractors(page);
	await signIn(page);
	await page.evaluate(() => {
		localStorage.setItem("i18nextLng", "zh-CN");
	});
	await page.goto("/subcontractors/subcontractor-1");
	await expect(
		page.getByRole("heading", { name: "Subcontractor 01" })
	).toBeVisible();
	await expect(
		page.getByRole("main").getByText("分包商", { exact: true })
	).toBeVisible();
	await expect(page.getByRole("table", { name: "成员" })).toBeVisible();
	await expect(page.getByRole("columnheader", { name: "姓名" })).toBeVisible();
	await expect(
		page.getByRole("columnheader", { name: "电话号码" })
	).toBeVisible();
	await expect(page.getByRole("link", { name: "返回名录" })).toBeVisible();
	await page.goto("/subcontractors/missing");
	await expect(
		page.getByRole("heading", { name: "未找到分包商" })
	).toBeVisible();
	await expect(page.getByText("此分包商已不存在或无法找到。")).toBeVisible();
});

test("long Subcontractor and Member names fit a narrow screen", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await interceptSubcontractors(page, [
		{
			id: "long",
			name: "SubcontractorWithAVeryLongUnbrokenDisplayName",
			members: [
				{
					id: "long-member",
					name: "MemberWithAVeryLongUnbrokenDisplayName",
					phone: "+6591234567",
				},
			],
		},
	]);
	await signIn(page);
	await page.goto("/subcontractors/long");
	await expect(page.getByRole("table", { name: "Members" })).toBeVisible();
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth
		)
	).toBe(true);
});

test("a failed Subcontractor load offers a working retry", async ({ page }) => {
	await interceptSubcontractors(page);
	await page.route(
		"**/api/v1/subcontractors/subcontractor-1",
		async (route) => {
			await route.fulfill({
				status: 503,
				json: { error: { code: "UNAVAILABLE", message: "Unavailable" } },
			});
		},
		{ times: 1 }
	);
	await signIn(page);
	await page.goto("/subcontractors/subcontractor-1");
	await expect(page.getByRole("alert")).toContainText(
		"Could not load the Subcontractor. Please try again."
	);
	await page.getByRole("button", { name: "Retry" }).click();
	await expect(page.getByRole("table", { name: "Members" })).toBeVisible();
});
