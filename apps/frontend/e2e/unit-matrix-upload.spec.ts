import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects, type FakeProject } from "./projects-api";
const project = (): FakeProject => ({
	id: "garden",
	name: "Orchard Gardens",
	code: "OG",
	blocks: [],
	unitTypes: [],
});
const file = {
	name: "invented.xlsx",
	mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	buffer: Buffer.from("tiny browser-edge fixture"),
};
test("uploads a workbook, switches sheets and opens a second Block", async ({
	page,
}) => {
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.goto("/projects/garden");
	await expect(
		page.getByRole("link", { name: "Upload Unit Matrix" })
	).toHaveCount(2);
	await page.getByRole("link", { name: "Upload Unit Matrix" }).first().click();
	await expect(
		page.getByRole("link", { name: "Projects", exact: true })
	).toHaveAttribute("aria-current", "page");
	await page.getByLabel("Workbook", { exact: true }).setInputFiles(file);
	await page.getByRole("button", { name: "Preview workbook" }).click();
	await expect(page.getByLabel("Sheet", { exact: true })).toHaveValue("1");
	await expect(
		page.getByRole("table", { name: "Unit Matrix · West" })
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: /West.*1 warning/ })
	).toBeVisible();
	await expect(
		page.getByText("Storey B1 was omitted because it has no Units.")
	).toBeVisible();
	await page.getByRole("button", { name: /East 1 Storeys/ }).click();
	await expect(
		page.getByText("Storey B1 was omitted because it has no Units.")
	).toHaveCount(0);
	await expect(
		page.getByRole("table", { name: "Unit Matrix · East" })
	).toBeVisible();
	await expect(
		page.getByRole("table", { name: "Unit Matrix · West" })
	).toHaveCount(0);
	await page.getByLabel("Sheet", { exact: true }).selectOption("0");
	await expect(
		page.getByText("No Blocks were found on this sheet.")
	).toBeVisible();
});
test("keeps the file input intact after a parse failure and shows the busy state", async ({
	page,
}) => {
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.goto("/projects/garden/upload");
	let release: () => void = () => {};
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route("**/unit-matrix/parse", async (route) => {
		await pending;
		await route.fulfill({
			status: 400,
			json: {
				error: { code: "UNIT_MATRIX_UNREADABLE", message: "Unreadable" },
			},
		});
	});
	await page.getByLabel("Workbook", { exact: true }).setInputFiles(file);
	await page.getByRole("button", { name: "Preview workbook" }).click();
	await expect(
		page.getByRole("status").filter({ hasText: "Reading workbook" })
	).toBeVisible();
	release();
	await expect(page.getByRole("alert")).toContainText(
		"could not be read as an Excel workbook"
	);
	await expect(page.getByLabel("Workbook", { exact: true })).toHaveValue(
		/invented.xlsx/
	);
});
test("requires a Session for the upload route", async ({ page }) => {
	await page.goto("/projects/garden/upload");
	await expect(page).toHaveURL(/\/login/);
});
test("phone preview scrolls its Unit Matrix without overflowing the page", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.goto("/projects/garden/upload");
	await page.getByLabel("Workbook", { exact: true }).setInputFiles(file);
	await page.getByRole("button", { name: "Preview workbook" }).click();
	const region = page.getByRole("region", { name: "Unit Matrix · West" });
	await expect(region).toBeVisible();
	expect(
		await region.evaluate(
			(element) =>
				element.scrollWidth > element.clientWidth &&
				getComputedStyle(element).overflowX === "auto"
		)
	).toBe(true);
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth
		)
	).toBe(true);
});
