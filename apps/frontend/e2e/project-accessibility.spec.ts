import { expect, test, type Locator, type Page } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects } from "./projects-api";

for (const path of [
	"/projects/p",
	"/projects/p/unit-types",
	"/projects/p/upload",
	"/projects/p/qr-labels",
]) {
	test(`a visitor to ${path} is sent to Sign in`, async ({ page }) => {
		await page.goto(path);
		await expect(page).toHaveURL(/\/login$/);
		await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
	});
}

const tabTo = async (page: Page, target: Locator): Promise<void> => {
	for (let index = 0; index < 80; index += 1) {
		const direction = await target.evaluate((element) => {
			const active = document.activeElement;
			if (element === active) return "focused";
			return active &&
				active.compareDocumentPosition(element) &
					Node.DOCUMENT_POSITION_PRECEDING
				? "Shift+Tab"
				: "Tab";
		});
		if (direction === "focused") return;
		await page.keyboard.press(direction);
	}
	await expect(target).toBeFocused();
};

test("keyboard reaches pane rows and forms and restores Structure deletion triggers", async ({
	page,
}) => {
	await interceptProjects(page, [
		{
			id: "p",
			name: "Gardens",
			code: "EG",
			unitTypes: [],
			blocks: [
				{
					id: "b",
					name: "A",
					position: 0,
					storeys: [
						{
							id: "s",
							name: "01",
							position: 0,
							units: [{ id: "u", name: "01", position: 0, unitTypeId: null }],
						},
					],
				},
			],
		},
	]);
	await signIn(page);
	await page.goto("/projects/p");
	await expect(page.getByRole("heading", { name: "Gardens" })).toBeVisible();
	// Each row's name ends with its Progression badge: "No Items" here.
	for (const name of [
		"A 1 storeys · 1 units No Items",
		"01 1 units No Items",
	]) {
		const row = page.getByRole("button", { name, exact: true });
		await tabTo(page, row);
		await page.keyboard.press("Enter");
		await expect(row).toHaveAttribute("aria-current", "true");
	}
	for (const name of [
		"Blocks",
		"Storeys · Block A",
		"Units · Block A · Storey 01",
	]) {
		const pane = page.getByRole("region", { name, exact: true });
		await tabTo(page, pane.getByRole("button", { name: "Add many" }));
		await page.keyboard.press("Enter");
		await tabTo(page, pane.getByLabel("Prefix", { exact: true }));
		await page.keyboard.type("Floor-");
		await expect(pane.getByLabel("Prefix", { exact: true })).toHaveValue(
			"Floor-"
		);
		await tabTo(
			page,
			pane.getByRole("button", { name: "Cancel", exact: true })
		);
		await page.keyboard.press("Enter");
		const trigger = pane.getByRole("button", { name: "Delete", exact: true });
		await tabTo(page, trigger);
		await page.keyboard.press("Enter");
		const dialog = page.getByRole("dialog");
		await expect(
			dialog.getByRole("button", { name: "Cancel", exact: true })
		).toBeFocused();
		await page.keyboard.press("Escape");
		await expect(dialog).toHaveCount(0);
		await expect(trigger).toBeFocused();
	}
});
