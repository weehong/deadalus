import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects, type FakeProject } from "./projects-api";
import type { FakeItem } from "./catalogue-items-api";

const item = (
	catalogueItemId: string,
	entryCount: number,
	progression = entryCount ? 40 : 0
): FakeItem => ({ catalogueItemId, progression, entryCount });
// Block A: 01 (u1 AS1, u2 BP2), 02 (u3 AS1); Block B: 01 (u4 BP2, u5 untyped).
// Wardrobe is held by u1 (2 entries), u2 (1 entry) and u4 (none); Sink by u1
// alone (3 entries).
const project = (): FakeProject => ({
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
					units: [
						{
							id: "u1",
							name: "01",
							position: 0,
							unitTypeId: "as1",
							items: [item("wardrobe", 2), item("sink", 3)],
						},
						{
							id: "u2",
							name: "02",
							position: 1,
							unitTypeId: "bp2",
							items: [item("wardrobe", 1)],
						},
					],
				},
				{
					id: "a2",
					name: "02",
					position: 1,
					units: [{ id: "u3", name: "01", position: 0, unitTypeId: "as1" }],
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
					units: [
						{
							id: "u4",
							name: "01",
							position: 0,
							unitTypeId: "bp2",
							items: [item("wardrobe", 0)],
						},
						{ id: "u5", name: "02", position: 1, unitTypeId: null },
					],
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
});
const row = (page: Page, name: string): ReturnType<Page["getByRole"]> =>
	page
		.getByRole("row")
		.filter({ has: page.getByRole("cell", { name, exact: true }) });
const openRemove = async (
	page: Page,
	name: string
): Promise<ReturnType<Page["getByRole"]>> => {
	await row(page, name)
		.getByRole("button", { name: "Remove from Units", exact: true })
		.click();
	const dialog = page.getByRole("dialog", {
		name: `Remove ${name} from Units`,
	});
	await expect(dialog).toBeVisible();
	return dialog;
};
const removed = (page: Page, catalogueItemId: string): Promise<unknown> =>
	page
		.waitForRequest(
			(request) =>
				request.method() === "POST" &&
				request
					.url()
					.endsWith(`/catalogue-items/${catalogueItemId}/items/remove`)
		)
		.then((request) => request.postDataJSON() as unknown);

test("removes a Catalogue Item's Items and their entries from every Unit after a confirmation naming the counts", async ({
	page,
}) => {
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.goto("/projects/gardens/items");
	await expect(
		row(page, "Wardrobe").getByRole("cell", { name: "3" })
	).toBeVisible();
	const dialog = await openRemove(page, "Wardrobe");
	await expect(dialog.getByLabel("Block")).toHaveValue("");
	await expect(dialog.getByRole("status")).toHaveText("Will remove 3 Items.");
	await expect(dialog.getByRole("button", { name: "Remove" })).toHaveCount(0);
	await dialog.getByRole("button", { name: "Continue", exact: true }).click();
	// u1's Sink entries are not counted: the loaded Project carries each Item's own.
	await expect(dialog.getByRole("status")).toHaveText(
		"Remove 3 Items and 3 Progress entries? This cannot be undone."
	);
	await expect(dialog.getByLabel("Block")).toBeDisabled();
	const request = removed(page, "wardrobe");
	await dialog.getByRole("button", { name: "Remove", exact: true }).click();
	expect(await request).toEqual({});
	await expect(dialog.getByRole("status")).toHaveText(
		"Removed 3 Items and 3 Progress entries."
	);
	await expect(dialog.getByRole("button", { name: "Remove" })).toHaveCount(0);
	await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
	await dialog.getByRole("button", { name: "Close" }).click();
	await expect(dialog).toHaveCount(0);
	await expect(
		row(page, "Wardrobe").getByRole("cell", { name: "0" })
	).toBeVisible();
	await expect(
		row(page, "Sink").getByRole("cell", { name: "1" })
	).toBeVisible();
	await page.reload();
	await expect(
		row(page, "Wardrobe").getByRole("cell", { name: "0" })
	).toBeVisible();
});

test("removes from one Block's Unit Type after going back to narrow the selection", async ({
	page,
}) => {
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.goto("/projects/gardens/items");
	const dialog = await openRemove(page, "Wardrobe");
	await dialog.getByRole("button", { name: "Continue", exact: true }).click();
	await expect(dialog.getByRole("status")).toHaveText(
		"Remove 3 Items and 3 Progress entries? This cannot be undone."
	);
	await dialog.getByRole("button", { name: "Back", exact: true }).click();
	await expect(dialog.getByLabel("Block")).toBeEnabled();
	await dialog.getByLabel("Block").selectOption("a");
	await dialog.getByRole("checkbox", { name: "AS1" }).uncheck();
	await expect(dialog.getByRole("status")).toHaveText("Will remove 1 Item.");
	await dialog.getByRole("button", { name: "Continue", exact: true }).click();
	await expect(dialog.getByRole("status")).toHaveText(
		"Remove 1 Item and 1 Progress entry? This cannot be undone."
	);
	const request = removed(page, "wardrobe");
	await dialog.getByRole("button", { name: "Remove", exact: true }).click();
	expect(await request).toEqual({ blockIds: ["a"], unitTypeIds: ["bp2"] });
	await expect(dialog.getByRole("status")).toHaveText(
		"Removed 1 Item and 1 Progress entry."
	);
	await dialog.getByRole("button", { name: "Close" }).click();
	await expect(
		row(page, "Wardrobe").getByRole("cell", { name: "2" })
	).toBeVisible();
});

test("reports zeros for a selection holding none of the Item and refuses an emptied selection", async ({
	page,
}) => {
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.goto("/projects/gardens/items");
	const dialog = await openRemove(page, "Sink");
	await dialog.getByLabel("Block").selectOption("b");
	await expect(dialog.getByRole("status")).toHaveText("Will remove 0 Items.");
	await dialog.getByLabel("Select all Storeys").uncheck();
	await expect(dialog.getByRole("button", { name: "Continue" })).toBeDisabled();
	await dialog.getByLabel("Select all Storeys").check();
	await dialog.getByRole("button", { name: "Continue", exact: true }).click();
	await expect(dialog.getByRole("status")).toHaveText(
		"Remove 0 Items and 0 Progress entries? This cannot be undone."
	);
	const request = removed(page, "sink");
	await dialog.getByRole("button", { name: "Remove", exact: true }).click();
	expect(await request).toEqual({ blockIds: ["b"] });
	await expect(dialog.getByRole("status")).toHaveText(
		"Removed 0 Items and 0 Progress entries."
	);
	await dialog.getByRole("button", { name: "Close" }).click();
	await expect(
		row(page, "Sink").getByRole("cell", { name: "1" })
	).toBeVisible();
});

test("removes in Chinese at phone width without sideways scrolling", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.evaluate(() => localStorage.setItem("i18nextLng", "zh-CN"));
	await page.goto("/projects/gardens/items");
	await row(page, "Wardrobe")
		.getByRole("button", { name: "从单位移除", exact: true })
		.click();
	const dialog = page.getByRole("dialog", { name: "从单位移除 Wardrobe" });
	await dialog.getByLabel("楼栋").selectOption("b");
	await expect(dialog.getByRole("status")).toHaveText("将移除 1 个物品。");
	await dialog.getByRole("button", { name: "继续", exact: true }).click();
	await expect(dialog.getByRole("status")).toHaveText(
		"移除 1 个物品及 0 条进度记录？此操作无法撤销。"
	);
	await dialog.getByRole("button", { name: "移除", exact: true }).click();
	await expect(dialog.getByRole("status")).toHaveText(
		"已移除 1 个物品及 0 条进度记录。"
	);
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth
		)
	).toBe(true);
	await dialog.getByRole("button", { name: "关闭" }).click();
	await expect(
		row(page, "Wardrobe").getByRole("cell", { name: "2" })
	).toBeVisible();
});
