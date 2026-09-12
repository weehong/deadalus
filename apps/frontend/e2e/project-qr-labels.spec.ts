import { expect, test, type Locator, type Page } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects, type FakeProject } from "./projects-api";

// The Console's QR label page against the browser-edge Project fake: the
// print-ready sheets an Administrator sends to label stock, what each label
// carries, and the chrome that is nowhere on the paper.

/**
 * Block A holds three Units across two Storeys, one of them the widest label
 * the type has to hold; Block B one; Block C none. Storeys and Units are
 * stated out of order, so only position settles the run.
 */
const project = (): FakeProject => ({
	id: "p",
	name: "Evergreen Gardens",
	code: "EG2",
	unitTypes: [],
	blocks: [
		{
			id: "block-b",
			name: "B",
			position: 1,
			storeys: [
				{
					id: "storey-b-02",
					name: "02",
					position: 0,
					units: [
						{ id: "u-b-02-01", name: "01", position: 0, unitTypeId: null },
					],
				},
			],
		},
		{
			id: "block-a",
			name: "A",
			position: 0,
			storeys: [
				{
					id: "storey-a-12",
					name: "12",
					position: 1,
					units: [
						{ id: "u-a-12-114", name: "114", position: 0, unitTypeId: null },
					],
				},
				{
					id: "storey-a-g",
					name: "G",
					position: 0,
					units: [
						{ id: "u-a-g-02", name: "02", position: 1, unitTypeId: null },
						{ id: "u-a-g-01", name: "01", position: 0, unitTypeId: null },
					],
				},
			],
		},
		{ id: "block-c", name: "C", position: 2, storeys: [] },
	],
});

const openStructure = async (page: Page): Promise<void> => {
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.goto("/projects/p");
	await expect(
		page.getByRole("heading", { name: "Evergreen Gardens" })
	).toBeVisible();
};

/** Tab (or Shift+Tab) until the target has focus, as the Project specs do. */
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

/** The codes on one sheet, in the order they are laid out. */
const codesOn = (sheet: Locator): Locator => sheet.getByRole("img");
const namesOn = async (sheet: Locator): Promise<Array<string | null>> =>
	Promise.all(
		(await codesOn(sheet).all()).map((code) =>
			code.getAttribute("aria-label")
		)
	);

test("a Block's action prints that Block's labels in Storey then Unit order", async ({
	page,
}) => {
	await openStructure(page);
	const action = page.getByRole("link", {
		name: "Print QR labels for Block A",
	});
	await expect(action).toHaveAttribute(
		"href",
		"/projects/p/qr-labels?block=block-a"
	);
	await action.click();
	await expect(page).toHaveURL(/\/projects\/p\/qr-labels\?block=block-a$/);

	await expect(
		page.getByRole("heading", {
			level: 1,
			name: "Evergreen Gardens · Block A",
		})
	).toBeVisible();
	await expect(page.getByText("EG2", { exact: true })).toBeVisible();
	await expect(page.getByText("3 labels")).toBeVisible();

	const sheets = page.getByRole("region");
	await expect(sheets).toHaveCount(1);
	await expect(sheets).toHaveAccessibleName("Block A labels, sheet 1");
	expect(await namesOn(sheets)).toEqual(["#G-01", "#G-02", "#12-114"]);
	// Every label reads its own Unit and its Project and Block.
	await expect(sheets.getByText("EG2 · Block A")).toHaveCount(3);

	const origin = new URL(page.url()).origin;
	for (const [index, unitId] of ["u-a-g-01", "u-a-g-02", "u-a-12-114"].entries())
		await expect(codesOn(sheets).nth(index)).toHaveAttribute(
			"data-qr-url",
			`${origin}/field/units/${unitId}`
		);

	await expect(
		page.getByRole("link", { name: "Back to Structure" })
	).toHaveAttribute("href", "/projects/p?block=block-a");
});

test("the print page carries no Console chrome and no Project tabs", async ({
	page,
}) => {
	await openStructure(page);
	await page.getByRole("link", { name: "Print QR labels for Block A" }).click();
	await expect(page.getByRole("region")).toHaveCount(1);
	for (const chrome of [
		page.getByRole("navigation", { name: "Console navigation" }),
		page.getByRole("navigation", { name: "Project sections" }),
		page.getByRole("complementary"),
		page.getByRole("banner"),
		page.getByRole("link", { name: "Back to Projects" }),
	])
		await expect(chrome).toHaveCount(0);
});

test("the Project's own action prints every Block, each on a sheet of its own", async ({
	page,
}) => {
	await openStructure(page);
	const action = page.getByRole("link", { name: "Print QR labels", exact: true });
	await expect(action).toHaveAttribute("href", "/projects/p/qr-labels");
	await action.click();
	await expect(page).toHaveURL(/\/projects\/p\/qr-labels$/);

	await expect(
		page.getByRole("heading", { level: 1, name: "Evergreen Gardens" })
	).toBeVisible();
	await expect(page.getByText("4 labels")).toBeVisible();

	const sheets = page.getByRole("region");
	await expect(sheets).toHaveCount(2);
	await expect(sheets.nth(0)).toHaveAccessibleName("Block A labels, sheet 1");
	await expect(sheets.nth(1)).toHaveAccessibleName("Block B labels, sheet 1");
	expect(await namesOn(sheets.nth(0))).toEqual(["#G-01", "#G-02", "#12-114"]);
	expect(await namesOn(sheets.nth(1))).toEqual(["#02-01"]);
	// Block B starts a new page rather than filling Block A's short sheet.
	await expect(sheets.nth(1)).toHaveCSS("break-before", "page");
	await expect(sheets.nth(0)).not.toHaveCSS("break-before", "page");
	// Block C holds no Units, so it contributes no sheet at all.
	await expect(page.getByText("Block C labels")).toHaveCount(0);
});

test("a sheet is an A4 page of 63.5mm by 38.1mm labels, three to a row", async ({
	page,
}) => {
	await openStructure(page);
	await page.goto("/projects/p/qr-labels?block=block-a");
	const sheet = page.getByRole("region");
	const paper = await sheet.boundingBox();
	// A4 at 96dpi: 210mm by 297mm.
	expect(Math.round(paper!.width)).toBe(794);
	expect(Math.round(paper!.height)).toBe(1123);

	const labels = await Promise.all(
		(await codesOn(sheet).all()).map((code) => code.boundingBox())
	);
	// The three labels sit on one row, 63.5mm apart plus the 2.54mm column
	// gap: a 250px pitch, inside the sheet's 7.2mm side margin.
	expect(labels.map((box) => Math.round(box!.y))).toEqual([
		Math.round(labels[0]!.y),
		Math.round(labels[0]!.y),
		Math.round(labels[0]!.y),
	]);
	expect(Math.round(labels[1]!.x - labels[0]!.x)).toBe(250);
	expect(Math.round(labels[2]!.x - labels[1]!.x)).toBe(250);
	expect(labels[0]!.x - paper!.x).toBeGreaterThanOrEqual(27);
});

test("printing hides the controls and keeps the sheet", async ({ page }) => {
	await openStructure(page);
	await page.goto("/projects/p/qr-labels?block=block-a");
	const controls = [
		page.getByRole("link", { name: "Back to Structure" }),
		page.getByRole("heading", { level: 1 }),
		page.getByRole("button", { name: "Print", exact: true }),
		page.getByText("3 labels"),
	];
	for (const control of controls) await expect(control).toBeVisible();
	await page.emulateMedia({ media: "print" });
	for (const control of controls) await expect(control).toBeHidden();
	await expect(page.getByRole("region")).toBeVisible();
	await expect(codesOn(page.getByRole("region"))).toHaveCount(3);
});

test("a Block with no Units says so instead of printing a blank sheet", async ({
	page,
}) => {
	await openStructure(page);
	await page.getByRole("link", { name: "Print QR labels for Block C" }).click();
	await expect(
		page.getByText(
			"No Units to label yet. Add Units to this Project's Structure, then print."
		)
	).toBeVisible();
	await expect(page.getByRole("region")).toHaveCount(0);
	await expect(
		page.getByRole("button", { name: "Print", exact: true })
	).toHaveCount(0);
});

test("a Project with no Units at all says the same", async ({ page }) => {
	await interceptProjects(page, [
		{ id: "bare", name: "Bare", code: "BR", blocks: [], unitTypes: [] },
	]);
	await signIn(page);
	await page.goto("/projects/bare/qr-labels");
	await expect(
		page.getByText(
			"No Units to label yet. Add Units to this Project's Structure, then print."
		)
	).toBeVisible();
	await expect(page.getByRole("region")).toHaveCount(0);
});

for (const [label, path] of [
	["Block", "/projects/p/qr-labels?block=block-gone"],
	["Project", "/projects/gone/qr-labels"],
] as const) {
	test(`a stale link to a ${label} that no longer exists ends on the not-found notice`, async ({
		page,
	}) => {
		await openStructure(page);
		await page.goto(path);
		await expect(
			page.getByRole("heading", { level: 1, name: "Not found" })
		).toBeVisible();
		await expect(
			page.getByText(
				"This Project or Block no longer exists. Return to Structure to choose another."
			)
		).toBeVisible();
		await expect(page.getByRole("region")).toHaveCount(0);
	});
}

test("keyboard reaches the back link and the Print button", async ({ page }) => {
	await openStructure(page);
	await page.goto("/projects/p/qr-labels?block=block-a");
	const back = page.getByRole("link", { name: "Back to Structure" });
	await expect(back).toBeVisible();
	await tabTo(page, back);
	await tabTo(page, page.getByRole("button", { name: "Print", exact: true }));
	await tabTo(page, back);
	await page.keyboard.press("Enter");
	// The Structure tab reopens on the Block that was printed.
	await expect(page).toHaveURL(/\/projects\/p\?block=block-a/);
	await expect(
		page.getByRole("region", { name: "Storeys · Block A", exact: true })
	).toBeVisible();
});
