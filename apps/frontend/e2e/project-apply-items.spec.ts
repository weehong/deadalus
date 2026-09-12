import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects, type FakeProject } from "./projects-api";
import type { FakeItem } from "./catalogue-items-api";

const wardrobe = (): FakeItem => ({
	catalogueItemId: "wardrobe",
	progression: 0,
	entryCount: 0,
});
// Block A: 01 (u1 AS1, u2 BP2), 02 (u3 AS1); Block B: 01 (u4 BP2, u5 untyped).
// Wardrobe is held by the Units named; Sink by none.
const project = (holding: Array<string> = ["u1"]): FakeProject => {
	const unit = (
		id: string,
		name: string,
		position: number,
		unitTypeId: string | null
	): FakeProject["blocks"][number]["storeys"][number]["units"][number] => ({
		id,
		name,
		position,
		unitTypeId,
		...(holding.includes(id) ? { items: [wardrobe()] } : {}),
	});
	return {
		id: "gardens",
		name: "Gardens",
		code: "EG2",
		blocks: [
			{
				id: "a",
				name: "A",
				position: 0,
				storeys: [
					{
						id: "a1",
						name: "01",
						position: 0,
						units: [unit("u1", "01", 0, "as1"), unit("u2", "02", 1, "bp2")],
					},
					{
						id: "a2",
						name: "02",
						position: 1,
						units: [unit("u3", "01", 0, "as1")],
					},
				],
			},
			{
				id: "b",
				name: "B",
				position: 1,
				storeys: [
					{
						id: "b1",
						name: "01",
						position: 0,
						units: [unit("u4", "01", 0, "bp2"), unit("u5", "02", 1, null)],
					},
				],
			},
		],
		unitTypes: [
			{ id: "as1", code: "AS1", description: null },
			{ id: "bp2", code: "BP2", description: null },
		],
		catalogueItems: [
			{ id: "wardrobe", name: "Wardrobe" },
			{ id: "sink", name: "Sink" },
		],
	};
};
const row = (page: Page, name: string): ReturnType<Page["getByRole"]> =>
	page
		.getByRole("row")
		.filter({ has: page.getByRole("cell", { name, exact: true }) });
const openApply = async (page: Page, name: string): Promise<void> => {
	await row(page, name)
		.getByRole("button", { name: "Apply to Units", exact: true })
		.click();
	await expect(
		page.getByRole("dialog", { name: `Apply ${name} to Units` })
	).toBeVisible();
};
const applied = (page: Page, catalogueItemId: string): Promise<unknown> =>
	page
		.waitForRequest(
			(request) =>
				request.method() === "POST" &&
				request.url().endsWith(`/catalogue-items/${catalogueItemId}/items`)
		)
		.then((request) => request.postDataJSON() as unknown);

test("applies a Catalogue Item to every Unit of the Project, previewing and reporting the counts", async ({
	page,
}) => {
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.goto("/projects/gardens/items");
	await expect(
		row(page, "Sink").getByRole("cell", { name: "0" })
	).toBeVisible();
	await openApply(page, "Sink");
	const dialog = page.getByRole("dialog", { name: "Apply Sink to Units" });
	await expect(dialog.getByLabel("Block")).toHaveValue("");
	await expect(dialog.getByLabel("Select all Storeys")).toBeChecked();
	await expect(dialog.getByLabel("Select all Unit Types")).toBeChecked();
	await expect(dialog.getByRole("status")).toHaveText(
		"Will add 5 Items; 0 Units already hold it."
	);
	const request = applied(page, "sink");
	await dialog.getByRole("button", { name: "Apply", exact: true }).click();
	expect(await request).toEqual({});
	await expect(dialog.getByRole("status")).toHaveText(
		"Added 5 Items; skipped 0 Units already holding it."
	);
	await expect(dialog.getByRole("button", { name: "Apply" })).toHaveCount(0);
	await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
	await dialog.getByRole("button", { name: "Close" }).click();
	await expect(dialog).toHaveCount(0);
	await expect(
		row(page, "Sink").getByRole("cell", { name: "5" })
	).toBeVisible();
	await expect(
		row(page, "Wardrobe").getByRole("cell", { name: "1" })
	).toBeVisible();
	await page.reload();
	await expect(
		row(page, "Sink").getByRole("cell", { name: "5" })
	).toBeVisible();
});

test("applies to one Block's Unit Types, skipping the Unit already holding it", async ({
	page,
}) => {
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.goto("/projects/gardens/items");
	await openApply(page, "Wardrobe");
	const dialog = page.getByRole("dialog", { name: "Apply Wardrobe to Units" });
	await expect(dialog.getByRole("status")).toHaveText(
		"Will add 4 Items; 1 Unit already holds it."
	);
	await expect(dialog.getByRole("checkbox", { name: "B · 01" })).toBeChecked();
	await dialog.getByLabel("Block").selectOption("a");
	await expect(dialog.getByRole("checkbox", { name: "B · 01" })).toHaveCount(0);
	await expect(dialog.getByRole("checkbox", { name: "02" })).toBeChecked();
	await expect(dialog.getByRole("status")).toHaveText(
		"Will add 2 Items; 1 Unit already holds it."
	);
	await dialog.getByRole("checkbox", { name: "BP2" }).uncheck();
	await expect(dialog.getByLabel("Select all Unit Types")).not.toBeChecked();
	await expect(dialog.getByRole("status")).toHaveText(
		"Will add 1 Item; 1 Unit already holds it."
	);
	const request = applied(page, "wardrobe");
	await dialog.getByRole("button", { name: "Apply", exact: true }).click();
	expect(await request).toEqual({ blockIds: ["a"], unitTypeIds: ["as1"] });
	await expect(dialog.getByRole("status")).toHaveText(
		"Added 1 Item; skipped 1 Unit already holding it."
	);
	await dialog.getByRole("button", { name: "Close" }).click();
	await expect(
		row(page, "Wardrobe").getByRole("cell", { name: "2" })
	).toBeVisible();
});

test("skips every Unit on a repeat apply and refuses an emptied selection", async ({
	page,
}) => {
	await interceptProjects(page, [project(["u1", "u2", "u3", "u4", "u5"])]);
	await signIn(page);
	await page.goto("/projects/gardens/items");
	await openApply(page, "Wardrobe");
	const dialog = page.getByRole("dialog", { name: "Apply Wardrobe to Units" });
	await expect(dialog.getByRole("status")).toHaveText(
		"Will add 0 Items; 5 Units already hold it."
	);
	await dialog.getByLabel("Select all Storeys").uncheck();
	await expect(dialog.getByRole("button", { name: "Apply" })).toBeDisabled();
	await expect(dialog.getByRole("status")).toHaveText(
		"Will add 0 Items; 0 Units already hold it."
	);
	await dialog.getByLabel("Select all Storeys").check();
	await dialog.getByRole("button", { name: "Apply", exact: true }).click();
	await expect(dialog.getByRole("status")).toHaveText(
		"Added 0 Items; skipped 5 Units already holding it."
	);
	await dialog.getByRole("button", { name: "Close" }).click();
	await expect(
		row(page, "Wardrobe").getByRole("cell", { name: "5" })
	).toBeVisible();
});

test("applies in Chinese at phone width without sideways scrolling", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.evaluate(() => localStorage.setItem("i18nextLng", "zh-CN"));
	await page.goto("/projects/gardens/items");
	await row(page, "Sink")
		.getByRole("button", { name: "应用到单位", exact: true })
		.click();
	const dialog = page.getByRole("dialog", { name: "将 Sink 应用到单位" });
	await expect(dialog.getByLabel("楼栋")).toHaveValue("");
	await dialog.getByLabel("楼栋").selectOption("b");
	await expect(dialog.getByRole("status")).toHaveText(
		"将添加 2 个物品；0 个单位已持有。"
	);
	await dialog.getByRole("button", { name: "应用", exact: true }).click();
	await expect(dialog.getByRole("status")).toHaveText(
		"已添加 2 个物品；已跳过 0 个已持有的单位。"
	);
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth
		)
	).toBe(true);
	await dialog.getByRole("button", { name: "关闭" }).click();
	await expect(
		row(page, "Sink").getByRole("cell", { name: "2" })
	).toBeVisible();
});
