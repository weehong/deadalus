import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import { interceptSubcontractors } from "./subcontractors-api";

test("delete confirmation names the Subcontractor and Members, cancels and returns to the Directory after confirmation", async ({
	page,
}) => {
	await interceptSubcontractors(page, [
		{
			id: "acme",
			name: "Acme Fitout",
			members: [
				{ id: "alex", name: "Alex", phone: "+6591111111" },
				{ id: "mei", name: "Mei", phone: "+6592222222" },
			],
		},
	]);
	await signIn(page);
	await page.getByRole("link", { name: "Subcontractors", exact: true }).click();
	await page.getByRole("link", { name: "Acme Fitout" }).click();
	const trigger = page.getByRole("button", { name: "Delete", exact: true });
	await trigger.click();
	const dialog = page.getByRole("dialog", { name: "Delete subcontractor?" });
	await expect(dialog).toContainText(
		"Delete Acme Fitout and its 2 Members? This cannot be undone."
	);
	const cancel = dialog.getByRole("button", { name: "Cancel" });
	await expect(cancel).toBeFocused();
	await page.keyboard.press("Shift+Tab");
	await expect(
		dialog.getByRole("button", { name: "Delete subcontractor" })
	).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(cancel).toBeFocused();
	await cancel.click();
	await expect(dialog).toBeHidden();
	await expect(trigger).toBeFocused();
	await trigger.click();
	await page.keyboard.press("Escape");
	await expect(dialog).toBeHidden();
	await expect(trigger).toBeFocused();
	await trigger.click();
	await dialog.getByRole("button", { name: "Delete subcontractor" }).click();
	await expect(page).toHaveURL(/\/subcontractors$/);
	await expect(
		page.getByRole("heading", { name: "Subcontractors", exact: true })
	).toBeVisible();
	await expect(page.getByRole("link", { name: "Acme Fitout" })).toHaveCount(0);
	await page.reload();
	await expect(page.getByRole("link", { name: "Acme Fitout" })).toHaveCount(0);
});

test("a failed delete keeps the confirmation and supports retry without duplicate requests while busy", async ({
	page,
}) => {
	await interceptSubcontractors(page);
	let release: (() => void) | undefined;
	const responseReady = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route(
		"**/api/v1/subcontractors/subcontractor-1",
		async (route) => {
			if (route.request().method() !== "DELETE") {
				await route.fallback();
				return;
			}
			await responseReady;
			await route.fulfill({
				status: 503,
				json: { error: { code: "UNAVAILABLE", message: "Unavailable" } },
			});
			await page.unroute("**/api/v1/subcontractors/subcontractor-1");
		}
	);
	await signIn(page);
	await page.goto("/subcontractors/subcontractor-1");
	await page.getByRole("button", { name: "Delete", exact: true }).click();
	const dialog = page.getByRole("dialog");
	const confirm = dialog.getByRole("button", { name: "Delete subcontractor" });
	await confirm.click();
	await expect(confirm).toBeDisabled();
	await expect(confirm).toHaveAttribute("aria-busy", "true");
	await expect(dialog.getByRole("button", { name: "Cancel" })).toBeDisabled();
	await page.keyboard.press("Escape");
	await expect(dialog).toBeVisible();
	release?.();
	await expect(dialog.getByRole("alert")).toContainText(
		"Could not delete the Subcontractor. Please try again."
	);
	await expect(dialog).toContainText(
		"Delete Subcontractor 01 and its 1 Member? This cannot be undone."
	);
	await expect(confirm).toBeEnabled();
	await confirm.click();
	await expect(page).toHaveURL(/\/subcontractors$/);
	await expect(
		page.getByRole("link", { name: "Subcontractor 01", exact: true })
	).toHaveCount(0);
	await expect(
		page.getByRole("link", { name: "Subcontractor 02", exact: true })
	).toBeVisible();
});

test("the confirmation names the Subcontractor and Member count in Chinese", async ({
	page,
}) => {
	await interceptSubcontractors(page);
	await signIn(page);
	await page.evaluate(() => localStorage.setItem("i18nextLng", "zh-CN"));
	await page.goto("/subcontractors/subcontractor-1");
	const trigger = page.getByRole("button", { name: "删除", exact: true });
	await trigger.click();
	const dialog = page.getByRole("dialog", { name: "删除分包商？" });
	await expect(dialog).toContainText(
		"删除 Subcontractor 01 及其 1 名成员？此操作无法撤销。"
	);
	await dialog.getByRole("button", { name: "取消" }).click();
	await expect(trigger).toBeFocused();
});
