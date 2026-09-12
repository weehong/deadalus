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
					units: [{ id: "u1", name: "01", position: 0, unitTypeId: "as1" }],
				},
			],
		},
	],
	unitTypes: [{ id: "as1", code: "AS1", description: "1 Bedroom" }],
});
test("adds, rejects a taken code, edits and deletes Unit Types while refusing a type in use", async ({
	page,
}) => {
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.goto("/projects/gardens/unit-types");
	const add = page.getByRole("form", { name: "Add Unit Type", exact: true });
	await add.getByLabel("Code", { exact: true }).fill("BP2(p) (M)");
	await add.getByLabel("Description").fill("2 Bedroom Premium");
	await add.getByRole("button", { name: "Add Unit Type" }).click();
	const added = page.getByRole("row").filter({
		has: page.getByRole("cell", { name: "BP2(p) (M)", exact: true }),
	});
	await expect(
		added.getByRole("cell", { name: "0", exact: true })
	).toBeVisible();
	await add.getByLabel("Code", { exact: true }).fill("bp2 (p)(m)");
	await add.getByRole("button", { name: "Add Unit Type" }).click();
	await expect(
		add.getByText("A Unit Type with this code already exists.")
	).toBeVisible();
	await added
		.getByRole("button", { name: "Edit Unit Type", exact: true })
		.click();
	const edit = page.getByRole("form", { name: "Edit Unit Type", exact: true });
	await edit.getByLabel("Code", { exact: true }).fill("CP7-PH");
	await edit.getByLabel("Description").clear();
	await edit.getByRole("button", { name: "Save Unit Type" }).click();
	const renamed = page
		.getByRole("row")
		.filter({ has: page.getByRole("cell", { name: "CP7-PH", exact: true }) });
	await expect(
		renamed.getByRole("cell", { name: "—", exact: true })
	).toBeVisible();
	const used = page
		.getByRole("row")
		.filter({ has: page.getByRole("cell", { name: "AS1", exact: true }) });
	await expect(
		used.getByRole("cell", { name: "1", exact: true })
	).toBeVisible();
	await used
		.getByRole("button", { name: "Delete Unit Type", exact: true })
		.click();
	await expect(
		page.getByText("Cannot delete: 1 Unit still uses this Unit Type.")
	).toBeVisible();
	await expect(page.getByRole("dialog")).toHaveCount(0);
	await renamed
		.getByRole("button", { name: "Delete Unit Type", exact: true })
		.click();
	const dialog = page.getByRole("dialog", { name: "Delete Unit Type" });
	await expect(dialog.getByText("Delete Unit Type CP7-PH?")).toBeVisible();
	await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
	await dialog.getByRole("button", { name: "Cancel" }).click();
	await expect(renamed).toBeVisible();
	await renamed
		.getByRole("button", { name: "Delete Unit Type", exact: true })
		.click();
	await dialog.getByRole("button", { name: "Delete", exact: true }).click();
	await expect(
		page.getByRole("cell", { name: "CP7-PH", exact: true })
	).toHaveCount(0);
	await expect(dialog).toHaveCount(0);
	await page.reload();
	await expect(
		page.getByRole("cell", { name: "AS1", exact: true })
	).toBeVisible();
	await expect(
		page.getByRole("cell", { name: "CP7-PH", exact: true })
	).toHaveCount(0);
});
test("shows the server's refusal inline when a Unit starts using a previously unused type", async ({
	page,
}) => {
	const record = project();
	record.unitTypes.push({ id: "bp2", code: "BP2", description: null });
	await interceptProjects(page, [record]);
	await signIn(page);
	await page.goto("/projects/gardens/unit-types");
	const row = page
		.getByRole("row")
		.filter({ has: page.getByRole("cell", { name: "BP2", exact: true }) });
	await row
		.getByRole("button", { name: "Delete Unit Type", exact: true })
		.click();
	record.blocks[0]!.storeys[0]!.units[0]!.unitTypeId = "bp2";
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Delete", exact: true })
		.click();
	await expect(
		page.getByText("Cannot delete: 1 Unit still uses this Unit Type.")
	).toBeVisible();
	await expect(page.getByRole("dialog")).toHaveCount(0);
	await expect(row).toBeVisible();
	await expect(row.getByRole("cell", { name: "1", exact: true })).toBeVisible();
});
test("supports the Unit Type form and deletion in Chinese at phone width", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.evaluate(() => localStorage.setItem("i18nextLng", "zh-CN"));
	await page.goto("/projects/gardens/unit-types");
	const add = page.getByRole("form", { name: "添加户型", exact: true });
	await add.getByRole("button", { name: "添加户型" }).click();
	await expect(add.getByText("请输入户型代码。")).toBeVisible();
	await add.getByLabel("代码", { exact: true }).fill("PH");
	await add.getByRole("button", { name: "添加户型" }).click();
	const row = page
		.getByRole("row")
		.filter({ has: page.getByRole("cell", { name: "PH", exact: true }) });
	await row.getByRole("button", { name: "删除户型", exact: true }).click();
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
