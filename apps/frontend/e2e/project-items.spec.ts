import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects, type FakeProject } from "./projects-api";
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
							unitTypeId: null,
							items: [
								{ catalogueItemId: "wardrobe", progression: 40, entryCount: 1 },
							],
						},
					],
				},
			],
		},
	],
	unitTypes: [],
	catalogueItems: [{ id: "wardrobe", name: "Wardrobe" }],
});
test("adds, rejects a taken name, renames and deletes Catalogue Items while refusing one in use", async ({
	page,
}) => {
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.goto("/projects/gardens/items");
	await expect(page.getByRole("link", { name: "Items" })).toHaveAttribute(
		"aria-current",
		"page"
	);
	const add = page.getByRole("form", {
		name: "Add Catalogue Item",
		exact: true,
	});
	await add.getByLabel("Item", { exact: true }).fill(" Kitchen cabinet ");
	await add.getByRole("button", { name: "Add Catalogue Item" }).click();
	const added = page.getByRole("row").filter({
		has: page.getByRole("cell", { name: "Kitchen cabinet", exact: true }),
	});
	await expect(
		added.getByRole("cell", { name: "0", exact: true })
	).toBeVisible();
	await expect(add.getByLabel("Item", { exact: true })).toHaveValue("");
	await add.getByLabel("Item", { exact: true }).fill("kitchen   CABINET");
	await add.getByRole("button", { name: "Add Catalogue Item" }).click();
	await expect(
		add.getByText(
			"A Catalogue Item with this name already exists in this Project."
		)
	).toBeVisible();
	await added
		.getByRole("button", { name: "Rename Catalogue Item", exact: true })
		.click();
	const rename = page.getByRole("form", {
		name: "Rename Catalogue Item",
		exact: true,
	});
	await rename.getByLabel("Item", { exact: true }).fill("Wardrobe");
	await rename.getByRole("button", { name: "Save Catalogue Item" }).click();
	await expect(
		rename.getByText(
			"A Catalogue Item with this name already exists in this Project."
		)
	).toBeVisible();
	await rename.getByLabel("Item", { exact: true }).fill("Kitchen cabinets");
	await rename.getByRole("button", { name: "Save Catalogue Item" }).click();
	const renamed = page.getByRole("row").filter({
		has: page.getByRole("cell", { name: "Kitchen cabinets", exact: true }),
	});
	await expect(renamed).toBeVisible();
	await expect(rename).toHaveCount(0);
	const held = page.getByRole("row").filter({
		has: page.getByRole("cell", { name: "Wardrobe", exact: true }),
	});
	await expect(
		held.getByRole("cell", { name: "1", exact: true })
	).toBeVisible();
	await held
		.getByRole("button", { name: "Delete Catalogue Item", exact: true })
		.click();
	await expect(
		page.getByText("Cannot delete: 1 Unit still holds this Item.")
	).toBeVisible();
	await expect(page.getByRole("dialog")).toHaveCount(0);
	await renamed
		.getByRole("button", { name: "Delete Catalogue Item", exact: true })
		.click();
	const dialog = page.getByRole("dialog", { name: "Delete Catalogue Item" });
	await expect(
		dialog.getByText("Delete Kitchen cabinets from the Item Catalogue?")
	).toBeVisible();
	await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
	await dialog.getByRole("button", { name: "Cancel" }).click();
	await expect(renamed).toBeVisible();
	await renamed
		.getByRole("button", { name: "Delete Catalogue Item", exact: true })
		.click();
	await dialog.getByRole("button", { name: "Delete", exact: true }).click();
	await expect(
		page.getByRole("cell", { name: "Kitchen cabinets", exact: true })
	).toHaveCount(0);
	await expect(dialog).toHaveCount(0);
	await page.reload();
	await expect(
		page.getByRole("cell", { name: "Wardrobe", exact: true })
	).toBeVisible();
	await expect(
		page.getByRole("cell", { name: "Kitchen cabinets", exact: true })
	).toHaveCount(0);
});
test("shows the server's refusal inline when a Unit starts holding a previously unused Item", async ({
	page,
}) => {
	const record = project();
	record.catalogueItems!.push({ id: "sink", name: "Sink" });
	await interceptProjects(page, [record]);
	await signIn(page);
	await page.goto("/projects/gardens/items");
	const row = page
		.getByRole("row")
		.filter({ has: page.getByRole("cell", { name: "Sink", exact: true }) });
	await row
		.getByRole("button", { name: "Delete Catalogue Item", exact: true })
		.click();
	record.blocks[0]!.storeys[0]!.units[0]!.items!.push({
		catalogueItemId: "sink",
		progression: 0,
		entryCount: 0,
	});
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Delete", exact: true })
		.click();
	await expect(
		page.getByText("Cannot delete: 1 Unit still holds this Item.")
	).toBeVisible();
	await expect(page.getByRole("dialog")).toHaveCount(0);
	await expect(row).toBeVisible();
	await expect(row.getByRole("cell", { name: "1", exact: true })).toBeVisible();
});
test("supports the Item Catalogue in Chinese at phone width", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.evaluate(() => localStorage.setItem("i18nextLng", "zh-CN"));
	await page.goto("/projects/gardens/items");
	await expect(page.getByRole("link", { name: "物品" })).toHaveAttribute(
		"aria-current",
		"page"
	);
	const add = page.getByRole("form", { name: "添加目录物品", exact: true });
	await add.getByRole("button", { name: "添加目录物品" }).click();
	await expect(add.getByText("请输入物品名称。")).toBeVisible();
	await add.getByLabel("物品", { exact: true }).fill("水槽");
	await add.getByRole("button", { name: "添加目录物品" }).click();
	const row = page
		.getByRole("row")
		.filter({ has: page.getByRole("cell", { name: "水槽", exact: true }) });
	await row.getByRole("button", { name: "删除目录物品", exact: true }).click();
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "删除", exact: true })
		.click();
	await expect(row).toHaveCount(0);
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth
		)
	).toBe(true);
});
