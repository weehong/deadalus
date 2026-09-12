import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects, type FakeProject } from "./projects-api";
const project = (): FakeProject => ({
	id: "garden",
	name: "Gardens",
	code: "G",
	blocks: [],
	unitTypes: [],
});
async function preview(page: Page): Promise<void> {
	await signIn(page);
	await page.goto("/projects/garden/upload");
	await page.getByLabel("Workbook", { exact: true }).setInputFiles({
		name: "invented.xlsx",
		mimeType:
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		buffer: Buffer.from("invented"),
	});
	await page.getByRole("button", { name: "Preview workbook" }).click();
	await expect(page.getByLabel("Block 1 name", { exact: true })).toBeVisible();
}
test("validates headers, commits only included renamed Blocks and shows the summary", async ({
	page,
}) => {
	await interceptProjects(page, [project()]);
	await preview(page);
	const commit = page.getByRole("button", { name: "Commit Blocks" });
	await page.getByLabel("Block 2 name", { exact: true }).fill(" west ");
	await expect(commit).toBeDisabled();
	await expect(page.getByText("This Block name is repeated.")).toHaveCount(2);
	await page.getByLabel("Block 1 name", { exact: true }).fill(" ");
	await expect(commit).toBeDisabled();
	await page.getByLabel("Block 1 name", { exact: true }).fill("North");
	await page.getByLabel("Include Block 2", { exact: true }).uncheck();
	await commit.click();
	await expect(page).toHaveURL(/projects\/garden\?/);
	await expect(
		page
			.getByRole("status")
			.filter({ hasText: "Imported 1 Blocks, 2 Storeys and 11 Units" })
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Upload Unit Matrix", exact: true })
	).toBeDisabled();
	await expect(
		page.getByText(
			"This Project has 1 Blocks. Delete them before uploading a Unit Matrix."
		)
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: /North/ }).first()
	).toBeVisible();
});
test("keeps imported counts after manual changes and selection normalization", async ({
	page,
}) => {
	await interceptProjects(page, [project()]);
	await preview(page);
	await page.getByLabel("Include Block 2", { exact: true }).uncheck();
	await page.getByRole("button", { name: "Commit Blocks" }).click();
	const summary = page.getByRole("status").filter({ hasText: "Imported" });
	const original =
		"Imported 1 Blocks, 2 Storeys and 11 Units; created 3 Unit Types.";
	await expect(summary).toHaveText(original);
	const pane = page.getByRole("region", { name: "Blocks", exact: true });
	await pane.getByRole("button", { name: "Add Block", exact: true }).click();
	await pane.getByLabel("Block name").fill("Manual");
	await pane.getByLabel("Block name").press("Enter");
	await expect(
		pane.getByRole("button", { name: "Manual 0 storeys · 0 units" })
	).toBeVisible();
	await pane.getByRole("button", { name: "Cancel" }).click();
	await expect(summary).toHaveText(original);
	const imported = pane
		.getByRole("listitem")
		.filter({
			has: page.getByRole("button", { name: "West 2 storeys · 11 units" }),
		});
	await imported.getByRole("button", { name: "Delete", exact: true }).click();
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Delete", exact: true })
		.click();
	await expect(
		pane.getByRole("button", { name: "West 2 storeys · 11 units" })
	).toHaveCount(0);
	await expect(page).toHaveURL(/block=/);
	await expect(summary).toHaveText(original);
});
test("shows commit busy state and a racing409 with the current count", async ({
	page,
}) => {
	await interceptProjects(page, [project()]);
	await preview(page);
	let release = (): void => {};
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route("**/structure", async (route) => {
		await pending;
		await route.fulfill({
			status: 409,
			json: {
				error: { code: "PROJECT_HAS_BLOCKS", details: { blockCount: 2 } },
			},
		});
	});
	await page.getByRole("button", { name: "Commit Blocks" }).click();
	await expect(page.getByLabel("Block 1 name", { exact: true })).toBeDisabled();
	release();
	await expect(page.getByRole("alert")).toContainText(
		"This Project has 2 Blocks"
	);
	await expect(page).toHaveURL(/\/upload/);
});
