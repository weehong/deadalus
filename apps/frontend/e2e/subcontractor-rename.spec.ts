import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import { interceptSubcontractors } from "./subcontractors-api";
const records = [
	{
		id: "acme",
		name: "Acme Fitout",
		members: [{ id: "alex", name: "Alex", phone: "+6591234567" }],
	},
	{
		id: "beacon",
		name: "Beacon Joinery",
		members: [{ id: "mei", name: "Mei", phone: "+6592345678" }],
	},
];
test("renames inline and refreshes the heading and sorted Directory", async ({
	page,
}) => {
	await interceptSubcontractors(page, structuredClone(records));
	await signIn(page);
	await page.getByRole("link", { name: "Subcontractors", exact: true }).click();
	await page.getByRole("link", { name: "Acme Fitout" }).click();
	await page.getByRole("button", { name: "Rename", exact: true }).click();
	await expect(page.getByRole("heading", { name: "Acme Fitout" })).toHaveCount(
		0
	);
	await page.getByLabel("Subcontractor name").fill(" Zenith Fitout ");
	const sent = page.waitForRequest(
		(request) =>
			request.method() === "PATCH" &&
			request.url().endsWith("/api/v1/subcontractors/acme")
	);
	await page.getByRole("button", { name: "Save name" }).click();
	expect((await sent).postDataJSON()).toEqual({ name: "Zenith Fitout" });
	await expect(
		page.getByRole("heading", { name: "Zenith Fitout" })
	).toBeVisible();
	await page.getByRole("link", { name: "Back to Directory" }).click();
	const rows = page.getByRole("table").getByRole("row");
	await expect(rows.nth(1)).toContainText("Beacon Joinery");
	await expect(rows.nth(2)).toContainText("Zenith Fitout");
	await expect(page.getByRole("link", { name: "Acme Fitout" })).toHaveCount(0);
});
test("shows taken-name and blank field messages, then Cancel restores the heading", async ({
	page,
}) => {
	await interceptSubcontractors(page, structuredClone(records));
	await signIn(page);
	await page.goto("/subcontractors/acme");
	await page.getByRole("button", { name: "Rename", exact: true }).click();
	await page.getByLabel("Subcontractor name").fill(" ");
	await page.getByRole("button", { name: "Save name" }).click();
	await expect(
		page.getByLabel("Subcontractor name")
	).toHaveAccessibleDescription("Subcontractor name is required");
	await page.getByLabel("Subcontractor name").fill(" BEACON  JOINERY ");
	await page.getByRole("button", { name: "Save name" }).click();
	await expect(
		page.getByLabel("Subcontractor name")
	).toHaveAccessibleDescription(
		"A subcontractor with this name already exists."
	);
	await expect(page.getByLabel("Subcontractor name")).toBeFocused();
	await page.getByRole("button", { name: "Cancel" }).click();
	await expect(
		page.getByRole("heading", { name: "Acme Fitout" })
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Delete", exact: true })
	).toBeVisible();
	await page.getByRole("button", { name: "Rename", exact: true }).click();
	await expect(page.getByLabel("Subcontractor name")).toHaveValue(
		"Acme Fitout"
	);
});
test("keeps the entered name on server failure and prevents duplicate saves while busy", async ({
	page,
}) => {
	await interceptSubcontractors(page, structuredClone(records));
	await signIn(page);
	await page.goto("/subcontractors/acme");
	await page.getByRole("button", { name: "Rename", exact: true }).click();
	let release: () => void = () => undefined;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route(
		"**/api/v1/subcontractors/acme",
		async (route) => {
			if (route.request().method() !== "PATCH") {
				await route.fallback();
				return;
			}
			await gate;
			await route.fulfill({
				status: 503,
				json: { error: { code: "UNAVAILABLE", message: "Unavailable" } },
			});
		},
		{ times: 1 }
	);
	await page.getByLabel("Subcontractor name").fill("Zenith Fitout");
	await page.getByRole("button", { name: "Save name" }).click();
	await expect(page.getByRole("button", { name: "Saving…" })).toBeDisabled();
	await expect(page.getByRole("button", { name: "Saving…" })).toHaveAttribute(
		"aria-busy",
		"true"
	);
	await expect(page.getByRole("button", { name: "Cancel" })).toBeDisabled();
	release();
	await expect(page.getByRole("alert")).toHaveText(
		"Could not rename the subcontractor. Please try again."
	);
	await expect(page.getByLabel("Subcontractor name")).toHaveValue(
		"Zenith Fitout"
	);
	await page.getByRole("button", { name: "Save name" }).click();
	await expect(
		page.getByRole("heading", { name: "Zenith Fitout" })
	).toBeVisible();
});
test("shows translated rename controls and validation", async ({ page }) => {
	await interceptSubcontractors(page, structuredClone(records));
	await signIn(page);
	await page.evaluate(() => {
		localStorage.setItem("i18nextLng", "zh-CN");
	});
	await page.goto("/subcontractors/acme");
	await page.getByRole("button", { name: "重命名", exact: true }).click();
	await page.getByLabel("分包商名称").fill(" ");
	await page.getByRole("button", { name: "保存名称" }).click();
	await expect(page.getByLabel("分包商名称")).toHaveAccessibleDescription(
		"请输入分包商名称"
	);
	await page.getByRole("button", { name: "取消" }).click();
	await expect(
		page.getByRole("heading", { name: "Acme Fitout" })
	).toBeVisible();
});
