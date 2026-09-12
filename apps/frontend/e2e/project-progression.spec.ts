import { expect, test, type Locator, type Page } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects, type FakeProject } from "./projects-api";
import {
	interceptSubcontractors,
	type FakeSubcontractor,
} from "./subcontractors-api";

const directory = (): Array<FakeSubcontractor> => [
	{
		id: "acme",
		name: "Acme Fitout",
		members: [{ id: "alex", name: "Alex", phone: "+6591111111" }],
	},
];
// Gardens: Block A holds three Items (a Sink at 60 with two entries and an
// unassigned Wardrobe at 0 in Unit 01 of Storey 01; a Sink at 100 with one
// entry in Unit 01 of Storey 02), so A is 53%, its Storeys 30% and 100%,
// and the Project 53%. Block B and Meadows hold no Items at all.
const gardens = (): FakeProject => ({
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
							unitTypeId: null,
							items: [
								{
									catalogueItemId: "sink",
									subcontractorId: "acme",
									progression: 60,
									entryCount: 2,
									entries: [
										{
											id: "e1",
											value: 20,
											note: null,
											enteredByKind: "administrator",
											enteredByName: "administrator@example.com",
											subcontractorName: null,
											createdAt: "2026-09-08T12:00:00.000Z",
										},
										{
											id: "e2",
											value: 60,
											note: null,
											enteredByKind: "member",
											enteredByName: "Alex",
											subcontractorName: "Acme Fitout",
											createdAt: "2026-09-09T12:00:00.000Z",
										},
									],
								},
								{
									catalogueItemId: "wardrobe",
									subcontractorId: null,
									progression: 0,
									entryCount: 0,
								},
							],
						},
					],
				},
				{
					id: "a2",
					name: "02",
					position: 1,
					units: [
						{
							id: "u2",
							name: "01",
							position: 0,
							unitTypeId: null,
							items: [
								{
									catalogueItemId: "sink",
									subcontractorId: "acme",
									progression: 100,
									entryCount: 1,
								},
							],
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
					units: [{ id: "u3", name: "01", position: 0, unitTypeId: null }],
				},
			],
		},
	],
	unitTypes: [],
	catalogueItems: [
		{ id: "sink", name: "Sink" },
		{ id: "wardrobe", name: "Wardrobe" },
	],
});
const meadows = (): FakeProject => ({
	id: "meadows",
	name: "Meadows",
	code: "MW1",
	blocks: [],
	unitTypes: [],
});
const open = async (page: Page): Promise<void> => {
	await interceptSubcontractors(page, directory());
	await interceptProjects(page, [gardens(), meadows()], directory());
	await signIn(page);
};
const row = (page: Page, name: string): Locator =>
	page.getByRole("button", { name, exact: true });
/** The Unit card on the Units pane (named "Units · …" or "单位 · …") holding the given Unit name. */
const unitCard = (page: Page, name: string): Locator =>
	page
		.getByRole("region", { name: /^(Units|单位)/ })
		.getByRole("listitem")
		.filter({ has: page.getByText(name, { exact: true }) })
		.first();

test("shows a Progression badge on every Block, Storey and Unit row and in the Projects list, blank where there are no Items", async ({
	page,
}) => {
	await open(page);
	await expect(
		page.getByRole("columnheader", { name: "Progression", exact: true })
	).toBeVisible();
	const list = page.getByRole("row", { name: /Gardens/ });
	await expect(list).toContainText("53%");
	const blank = page.getByRole("row", { name: /Meadows/ });
	await expect(blank).toContainText("No Items");
	await expect(blank).not.toContainText("%");
	await page.getByRole("link", { name: "Gardens" }).click();
	await expect(row(page, "A 2 storeys · 2 units 53%")).toBeVisible();
	const blockB = row(page, "B 1 storeys · 1 units No Items");
	await expect(blockB).toBeVisible();
	await expect(blockB).not.toContainText("%");
	await expect(row(page, "01 1 units 30%")).toBeVisible();
	await expect(row(page, "02 1 units 100%")).toBeVisible();
	await expect(unitCard(page, "01")).toContainText("30%");
	await row(page, "02 1 units 100%").click();
	await expect(unitCard(page, "01")).toContainText("100%");
	await blockB.click();
	await expect(row(page, "01 1 units No Items")).toBeVisible();
	const bare = unitCard(page, "01");
	await expect(bare).toContainText("No Items");
	await expect(bare).not.toContainText("%");
});

test("a new entry on the Unit card moves the Unit, Storey, Block and Project badges up the tree without a reload", async ({
	page,
}) => {
	await open(page);
	await page.goto("/projects/gardens?block=a&storey=a1");
	await page.evaluate(() => {
		(window as unknown as { marker: string }).marker = "same document";
	});
	const card = unitCard(page, "01");
	await expect(card).toContainText("30%");
	await card.getByRole("button", { name: "Items" }).click();
	const form = card.getByRole("form", { name: "Enter progress for Sink" });
	await form.getByLabel("Progression (0 to 100)").fill("100");
	await form.getByRole("button", { name: "Enter" }).click();
	// Sink 100 and Wardrobe 0: the Unit and its Storey are 50%; Block A,
	// with the other Sink at 100, is 67%; the Project follows Block A.
	await expect(card).toContainText("50%");
	await expect(card).not.toContainText("30%");
	await expect(row(page, "01 1 units 50%")).toBeVisible();
	await expect(row(page, "A 2 storeys · 2 units 67%")).toBeVisible();
	await page.getByRole("link", { name: "Back to Projects" }).click();
	await expect(page.getByRole("row", { name: /Gardens/ })).toContainText("67%");
	expect(
		await page.evaluate(() => (window as unknown as { marker?: string }).marker)
	).toBe("same document");
});

test("delete confirmations for a Unit, Storey, Block and Project name the Items and Progress entries that go", async ({
	page,
}) => {
	await open(page);
	await page.goto("/projects/gardens?block=a&storey=a1");
	const dialog = page.getByRole("dialog");
	await unitCard(page, "01").getByRole("button", { name: "Delete" }).click();
	await expect(dialog).toContainText(
		"Delete Unit 01 and its 2 Items and 2 Progress entries?"
	);
	await dialog.getByRole("button", { name: "Cancel" }).click();
	const storeys = page.getByRole("region", { name: "Storeys · Block A" });
	await storeys
		.getByRole("listitem")
		.filter({ has: row(page, "01 1 units 30%") })
		.getByRole("button", { name: "Delete" })
		.click();
	await expect(dialog).toContainText(
		"Delete Storey 01 and its 1 Units, 2 Items and 2 Progress entries?"
	);
	await dialog.getByRole("button", { name: "Cancel" }).click();
	const blocks = page.getByRole("region", { name: "Blocks", exact: true });
	await blocks
		.getByRole("listitem")
		.filter({ has: row(page, "A 2 storeys · 2 units 53%") })
		.getByRole("button", { name: "Delete" })
		.click();
	await expect(dialog).toContainText(
		"Delete Block A and its 2 Storeys, 2 Units, 3 Items and 3 Progress entries?"
	);
	await dialog.getByRole("button", { name: "Cancel" }).click();
	await page
		.getByRole("button", { name: "Delete project", exact: true })
		.click();
	await expect(
		page.getByRole("dialog", { name: "Delete project?" })
	).toContainText(
		"Delete Gardens and its 2 Blocks, 3 Storeys, 3 Units, 3 Items and 3 Progress entries? All Unit Types and Catalogue Items will also be removed."
	);
	await page.getByRole("button", { name: "Cancel" }).click();
	await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("shows the badges and a confirmation's counts in Chinese at phone width without sideways scrolling", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await open(page);
	await page.evaluate(() => localStorage.setItem("i18nextLng", "zh-CN"));
	await page.goto("/projects");
	await expect(
		page.getByRole("columnheader", { name: "进度", exact: true })
	).toBeVisible();
	await expect(page.getByRole("row", { name: /Gardens/ })).toContainText("53%");
	await expect(page.getByRole("row", { name: /Meadows/ })).toContainText(
		"暂无物品"
	);
	await page.goto("/projects/gardens?block=a&storey=a1");
	await expect(row(page, "A 2 个楼层 · 2 个单位 53%")).toBeVisible();
	await expect(row(page, "B 1 个楼层 · 1 个单位 暂无物品")).toBeVisible();
	await expect(row(page, "01 1 个单位 30%")).toBeVisible();
	await expect(unitCard(page, "01")).toContainText("30%");
	await unitCard(page, "01").getByRole("button", { name: "删除" }).click();
	await expect(page.getByRole("dialog")).toContainText(
		"删除单元 01 及其 2 个物品和 2 条进度记录？"
	);
	await page.getByRole("dialog").getByRole("button", { name: "取消" }).click();
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth
		)
	).toBe(true);
});
