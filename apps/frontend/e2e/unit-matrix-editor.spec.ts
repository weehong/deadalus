import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects } from "./projects-api";
const file = {
	name: "invented.xlsx",
	mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	buffer: Buffer.from("invented browser fixture"),
};
async function preview(page: Page): Promise<void> {
	await interceptProjects(page, [
		{ id: "garden", name: "Gardens", code: "G", blocks: [], unitTypes: [] },
	]);
	await signIn(page);
	await page.goto("/projects/garden/upload");
	await page.getByLabel("Workbook", { exact: true }).setInputFiles(file);
	await page.getByRole("button", { name: "Preview workbook" }).click();
	await expect(
		page.getByLabel("Storey 01, Stack 01", { exact: true })
	).toBeVisible();
}
test("edits cells and Storeys, inserts and removes rows and Stacks, prevents duplicate Units and commits corrections", async ({
	page,
}) => {
	await preview(page);
	await page.getByLabel("Include Block 2", { exact: true }).uncheck();
	await page
		.getByLabel("Storey 01, Stack 01", { exact: true })
		.fill("BP2(p) (M)");
	await page
		.getByLabel("Storey 01, Stack 02", { exact: true })
		.fill("bp2 (p)(m)");
	await expect(
		page
			.getByRole("list", { name: "Unit Types to create" })
			.getByText("BP2(p) (M)", { exact: true })
	).toBeVisible();
	await expect(
		page
			.getByRole("list", { name: "Unit Types to create" })
			.getByText("bp2 (p)(m)", { exact: true })
	).toHaveCount(0);
	for (const stack of ["01", "02", "03", "04", "05", "06"])
		await page
			.getByLabel(`Storey 02, Stack ${stack}`, { exact: true })
			.fill("");
	await page.getByLabel("Storey name, row 1", { exact: true }).fill("Ground");
	page.once("dialog", (dialog) => dialog.accept("Mezzanine"));
	await page
		.getByRole("button", { name: "Insert Storey above Ground", exact: true })
		.click();
	await expect(
		page.getByLabel("Storey Mezzanine, Stack 01", { exact: true })
	).toBeVisible();
	await page
		.getByRole("button", { name: "Remove Storey Mezzanine", exact: true })
		.click();
	page.once("dialog", (dialog) => dialog.accept("1"));
	await page
		.getByRole("button", { name: "Insert Stack left of 01", exact: true })
		.click();
	await page.getByLabel("Storey Ground, Stack 1", { exact: true }).fill("A3");
	const commit = page.getByRole("button", { name: "Commit Blocks" });
	await expect(commit).toBeDisabled();
	await expect(
		page.getByLabel("Storey Ground, Stack 1", { exact: true })
	).toHaveAttribute("aria-invalid", "true");
	await expect(
		page
			.getByText("Two filled cells create the same Unit name in this Storey.", {
				exact: true,
			})
			.first()
	).toBeVisible();
	await page
		.getByRole("button", { name: "Remove Stack 1", exact: true })
		.click();
	await expect(commit).toBeEnabled();
	await expect(
		page.getByText("Empty Storeys omitted: West / 02", { exact: true })
	).toBeVisible();
	await commit.click();
	await expect(page).toHaveURL(/projects\/garden\?/);
	await expect(
		page.getByRole("status").filter({
			hasText:
				"Imported 1 Blocks, 1 Storeys and 6 Units; created 3 Unit Types.",
		})
	).toBeVisible();
	await expect(
		page
			.getByRole("status")
			.filter({ hasText: "Empty Storeys omitted: West / 02" })
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Ground 6 units", exact: true })
	).toBeVisible();
	await page
		.getByRole("button", { name: "Ground 6 units", exact: true })
		.click();
	const blocksPane = page.getByRole("region", { name: "Blocks", exact: true });
	await blocksPane.getByRole("button", { name: "Rename", exact: true }).click();
	await blocksPane.getByLabel("Block name", { exact: true }).fill("Renamed");
	await blocksPane.getByLabel("Block name", { exact: true }).press("Enter");
	await expect(
		blocksPane.getByRole("button", {
			name: "Renamed 1 storeys · 6 units",
			exact: true,
		})
	).toBeVisible();
	await expect(
		page
			.getByRole("status")
			.filter({ hasText: "Empty Storeys omitted: West / 02" })
	).toBeVisible();
	await expect(
		page
			.getByRole("status")
			.filter({
				hasText:
					"Imported 1 Blocks, 1 Storeys and 6 Units; created 3 Unit Types.",
			})
	).toBeVisible();
});
test("retains edits across sheets and replacement failures, and confirms before leaving", async ({
	page,
}) => {
	await preview(page);
	const cell = page.getByLabel("Storey 01, Stack 01", { exact: true });
	await cell.fill("PH-edited");
	await page.getByLabel("Sheet", { exact: true }).selectOption("0");
	await page.getByLabel("Sheet", { exact: true }).selectOption("1");
	await expect(cell).toHaveValue("PH-edited");
	await page
		.getByLabel("Workbook", { exact: true })
		.setInputFiles({ ...file, name: "replacement.xlsx" });
	await expect(cell).toHaveValue("PH-edited");
	page.once("dialog", (dialog) => dialog.dismiss());
	await page.getByRole("button", { name: "Preview workbook" }).click();
	await expect(cell).toHaveValue("PH-edited");
	await page.route("**/unit-matrix/parse", (route) =>
		route.fulfill({
			status: 400,
			json: { error: { code: "UNIT_MATRIX_UNREADABLE" } },
		})
	);
	page.once("dialog", (dialog) => dialog.accept());
	await page.getByRole("button", { name: "Preview workbook" }).click();
	await expect(page.getByRole("alert")).toContainText("could not be read");
	await expect(cell).toHaveValue("PH-edited");
	page.once("dialog", (dialog) => dialog.dismiss());
	await page.getByRole("link", { name: "Structure", exact: true }).click();
	await expect(page).toHaveURL(/\/upload/);
	await expect(cell).toHaveValue("PH-edited");
	page.once("dialog", (dialog) => dialog.accept());
	await page.getByRole("link", { name: "Structure", exact: true }).click();
	await expect(page).not.toHaveURL(/\/upload/);
});
test("flags blank and duplicate Storey rows and requires an included Block", async ({
	page,
}) => {
	await preview(page);
	const commit = page.getByRole("button", { name: "Commit Blocks" });
	await page.getByLabel("Storey name, row 2", { exact: true }).fill(" 01 ");
	await expect(commit).toBeDisabled();
	await expect(
		page.getByLabel("Storey name, row 1", { exact: true })
	).toHaveAttribute("aria-invalid", "true");
	await page.getByLabel("Storey name, row 2", { exact: true }).fill("");
	await expect(commit).toBeDisabled();
	await page.getByLabel("Storey name, row 2", { exact: true }).fill("02");
	await page.getByLabel("Include Block 1", { exact: true }).uncheck();
	await page.getByLabel("Include Block 2", { exact: true }).uncheck();
	await expect(commit).toBeDisabled();
	await expect(
		page.getByText("Select at least one Block.", { exact: true })
	).toBeVisible();
});
