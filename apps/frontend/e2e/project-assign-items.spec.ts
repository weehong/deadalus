import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects, type FakeProject } from "./projects-api";
import {
	interceptSubcontractors,
	type FakeSubcontractor,
} from "./subcontractors-api";
import type { FakeItem } from "./catalogue-items-api";

const directory = (): Array<FakeSubcontractor> => [
	{
		id: "acme",
		name: "Acme Fitout",
		members: [{ id: "alex", name: "Alex", phone: "+6591111111" }],
	},
	{
		id: "bolt",
		name: "Bolt Electrical",
		members: [{ id: "mei", name: "Mei", phone: "+6592222222" }],
	},
];
const wardrobe = (subcontractorId: string | null): FakeItem => ({
	catalogueItemId: "wardrobe",
	subcontractorId,
	progression: 0,
	entryCount: 0,
});
// Block A: 01 (u1 AS1, u2 BP2), 02 (u3 AS1); Block B: 01 (u4 BP2, u5 untyped).
// Wardrobe: u1 unassigned, u2 Bolt, u3 unassigned, u4 Acme, u5 unassigned; Sink held by u1 only.
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
							items: [
								wardrobe(null),
								{
									catalogueItemId: "sink",
									subcontractorId: "acme",
									progression: 60,
									entryCount: 1,
								},
							],
						},
						{
							id: "u2",
							name: "02",
							position: 1,
							unitTypeId: "bp2",
							items: [wardrobe("bolt")],
						},
					],
				},
				{
					id: "a2",
					name: "02",
					position: 1,
					units: [
						{
							id: "u3",
							name: "01",
							position: 0,
							unitTypeId: "as1",
							items: [wardrobe(null)],
						},
					],
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
							items: [wardrobe("acme")],
						},
						{
							id: "u5",
							name: "02",
							position: 1,
							unitTypeId: null,
							items: [wardrobe(null)],
						},
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
const openAssign = async (page: Page): Promise<ReturnType<Page["getByRole"]>> => {
	await interceptSubcontractors(page, directory());
	await interceptProjects(page, [project()], directory());
	await signIn(page);
	await page.goto("/projects/gardens/items");
	await row(page, "Wardrobe")
		.getByRole("button", { name: "Assign", exact: true })
		.click();
	const dialog = page.getByRole("dialog", { name: "Assign Wardrobe" });
	await expect(dialog).toBeVisible();
	return dialog;
};
const assigned = (page: Page): Promise<unknown> =>
	page
		.waitForRequest(
			(request) =>
				request.method() === "POST" && request.url().endsWith("/assignments")
		)
		.then((request) => request.postDataJSON() as unknown);

test("assigns a Catalogue Item's Items to a Subcontractor found in the Directory, skipping those assigned elsewhere", async ({
	page,
}) => {
	const dialog = await openAssign(page);
	await expect(dialog.getByRole("status")).toHaveText(
		"Choose a Subcontractor, or Unassign."
	);
	await expect(dialog.getByRole("button", { name: "Assign" })).toBeDisabled();
	await dialog.getByLabel("Search the Directory").fill("acme");
	await expect(
		dialog.getByRole("option", { name: "Bolt Electrical" })
	).toHaveCount(0);
	await dialog.getByLabel("Subcontractor", { exact: true }).selectOption("acme");
	await expect(dialog.getByRole("status")).toHaveText(
		"Will assign 3 Items; 1 already assigned elsewhere will be skipped; 1 already assigned to Acme Fitout."
	);
	const request = assigned(page);
	await dialog.getByRole("button", { name: "Assign", exact: true }).click();
	expect(await request).toEqual({
		catalogueItemId: "wardrobe",
		subcontractorId: "acme",
	});
	await expect(dialog.getByRole("status")).toHaveText(
		"Assigned 3 Items; skipped 2."
	);
	await expect(dialog.getByRole("button", { name: "Assign" })).toHaveCount(0);
	await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
	await dialog.getByRole("button", { name: "Close" }).click();
	await expect(dialog).toHaveCount(0);
	// The returned Project replaced the cache: a second preview counts the new Assignments.
	await row(page, "Wardrobe")
		.getByRole("button", { name: "Assign", exact: true })
		.click();
	await dialog.getByLabel("Subcontractor", { exact: true }).selectOption("acme");
	await expect(dialog.getByRole("status")).toHaveText(
		"Will assign 0 Items; 1 already assigned elsewhere will be skipped; 4 already assigned to Acme Fitout."
	);
});

test("reassigns Items assigned elsewhere when asked, over one Block", async ({
	page,
}) => {
	const dialog = await openAssign(page);
	await dialog.getByLabel("Subcontractor", { exact: true }).selectOption("acme");
	await dialog
		.getByRole("checkbox", { name: "Reassign Items already assigned elsewhere" })
		.check();
	await expect(dialog.getByRole("status")).toHaveText(
		"Will assign 3 Items; 1 already assigned elsewhere will be reassigned; 1 already assigned to Acme Fitout."
	);
	await dialog.getByLabel("Block").selectOption("a");
	await expect(dialog.getByRole("status")).toHaveText(
		"Will assign 2 Items; 1 already assigned elsewhere will be reassigned."
	);
	const request = assigned(page);
	await dialog.getByRole("button", { name: "Assign", exact: true }).click();
	expect(await request).toEqual({
		catalogueItemId: "wardrobe",
		subcontractorId: "acme",
		reassign: true,
		blockIds: ["a"],
	});
	await expect(dialog.getByRole("status")).toHaveText(
		"Assigned 3 Items; skipped 0."
	);
});

test("unassigns every selected assigned Item", async ({ page }) => {
	const dialog = await openAssign(page);
	await dialog
		.getByLabel("Subcontractor", { exact: true })
		.selectOption("Unassign");
	await expect(
		dialog.getByRole("checkbox", { name: "Reassign Items already assigned elsewhere" })
	).toBeDisabled();
	await expect(dialog.getByRole("status")).toHaveText(
		"Will unassign 2 Items; 3 with no Assignment will be skipped."
	);
	const request = assigned(page);
	await dialog.getByRole("button", { name: "Unassign", exact: true }).click();
	expect(await request).toEqual({
		catalogueItemId: "wardrobe",
		subcontractorId: null,
	});
	await expect(dialog.getByRole("status")).toHaveText(
		"Unassigned 2 Items; skipped 3."
	);
	await dialog.getByRole("button", { name: "Close" }).click();
	await row(page, "Wardrobe")
		.getByRole("button", { name: "Assign", exact: true })
		.click();
	await dialog.getByLabel("Subcontractor", { exact: true }).selectOption("bolt");
	await expect(dialog.getByRole("status")).toHaveText(
		"Will assign 5 Items; 0 already assigned elsewhere will be skipped."
	);
});

test("sets, changes and clears one Item's Subcontractor from the Unit card", async ({
	page,
}) => {
	await interceptSubcontractors(page, directory());
	await interceptProjects(page, [project()], directory());
	await signIn(page);
	await page.goto("/projects/gardens?block=a&storey=a1");
	const pane = page.getByRole("region", { name: /Units/ });
	const card = pane
		.getByRole("listitem")
		.filter({ has: page.getByText("01", { exact: true }) })
		.first();
	const toggle = card.getByRole("button", { name: "Items" });
	await expect(toggle).toHaveAttribute("aria-expanded", "false");
	await toggle.click();
	await expect(toggle).toHaveAttribute("aria-expanded", "true");
	const items = card.getByRole("listitem");
	await expect(items).toHaveCount(2);
	await expect(items.nth(0)).toContainText("Sink");
	await expect(items.nth(0)).toContainText("Acme Fitout");
	await expect(items.nth(0)).toContainText("60%");
	await expect(items.nth(1)).toContainText("Wardrobe");
	await expect(items.nth(1)).toContainText("Unassigned");
	await expect(items.nth(1)).toContainText("0%");
	const select = card.getByLabel("Subcontractor for Wardrobe");
	const patched = page
		.waitForRequest(
			(request) =>
				request.method() === "PATCH" &&
				request.url().endsWith("/items/u1%3Awardrobe")
		)
		.then((request) => request.postDataJSON() as unknown);
	await select.selectOption("bolt");
	expect(await patched).toEqual({ subcontractorId: "bolt" });
	await expect(items.nth(1)).toContainText("Bolt Electrical");
	await expect(select).toHaveValue("bolt");
	await select.selectOption("acme");
	await expect(items.nth(1)).toContainText("Acme Fitout");
	await select.selectOption("");
	await expect(items.nth(1)).toContainText("Unassigned");
	await expect(items.nth(1)).toContainText("0%");
	await toggle.click();
	await expect(card.getByRole("listitem")).toHaveCount(0);
});

test("assigns in Chinese at phone width without sideways scrolling", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await interceptSubcontractors(page, directory());
	await interceptProjects(page, [project()], directory());
	await signIn(page);
	await page.evaluate(() => localStorage.setItem("i18nextLng", "zh-CN"));
	await page.goto("/projects/gardens/items");
	await row(page, "Wardrobe")
		.getByRole("button", { name: "分配", exact: true })
		.click();
	const dialog = page.getByRole("dialog", { name: "分配 Wardrobe" });
	await expect(dialog.getByRole("status")).toHaveText(
		"请选择分包商，或取消分配。"
	);
	await dialog.getByLabel("分包商", { exact: true }).selectOption("acme");
	await expect(dialog.getByRole("status")).toHaveText(
		"将分配 3 个物品；1 个已分配给其他分包商的物品将被跳过；1 个已分配给 Acme Fitout。"
	);
	await dialog.getByRole("button", { name: "分配", exact: true }).click();
	await expect(dialog.getByRole("status")).toHaveText(
		"已分配 3 个物品；已跳过 2 个。"
	);
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth
		)
	).toBe(true);
	await dialog.getByRole("button", { name: "关闭" }).click();
	await expect(dialog).toHaveCount(0);
});
