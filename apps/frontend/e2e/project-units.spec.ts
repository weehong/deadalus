import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects, type FakeProject } from "./projects-api";
const project = (): FakeProject => ({
	id: "p",
	name: "Gardens",
	code: "EG",
	blocks: [
		{
			id: "b",
			name: "A",
			position: 0,
			storeys: ["01", "02", "03"].map((name, index) => ({
				id: `s${index}`,
				name,
				position: index,
				units: [],
			})),
		},
	],
	unitTypes: [
		{ id: "t1", code: "AS1", description: null },
		{ id: "t2", code: "BP2", description: null },
	],
});
test("batches Units across three Storeys, blocks any selected clash, adds one, edits and deletes", async ({
	page,
}) => {
	const record = project();
	await interceptProjects(page, [record]);
	await signIn(page);
	await page.goto("/projects/p");
	const pane = page.getByRole("region", {
		name: "Units · Block A · Storey 01",
		exact: true,
	});
	await pane.getByRole("button", { name: "Add many" }).click();
	await pane.getByLabel("To", { exact: true }).fill("2");
	await pane.getByLabel("Zero-pad width").fill("2");
	await pane.getByLabel("Select all Storeys").check();
	await pane.getByLabel("Unit Type").selectOption("t1");
	await expect(pane.getByText(/6 units across 3 storeys/)).toBeVisible();
	await pane.getByRole("button", { name: "Add names" }).click();
	await expect(pane.getByText("AS1", { exact: true })).toHaveCount(2);
	expect(
		record.blocks[0]!.storeys.map((s) =>
			s.units.map((u) => [u.name, u.unitTypeId])
		)
	).toEqual([
		[
			["01", "t1"],
			["02", "t1"],
		],
		[
			["01", "t1"],
			["02", "t1"],
		],
		[
			["01", "t1"],
			["02", "t1"],
		],
	]);
	await pane.getByRole("button", { name: "Add many" }).click();
	await pane.getByRole("radio", { name: "List", exact: true }).click();
	await pane.getByLabel("Names, one per line").fill("01\n03");
	await pane.getByLabel("Select all Storeys").check();
	await expect(pane.getByText("Already exists")).toBeVisible();
	await expect(pane.getByRole("button", { name: "Add names" })).toBeDisabled();
	await pane.getByRole("button", { name: "Cancel" }).click();
	await pane.getByRole("button", { name: "Add", exact: true }).click();
	await pane.getByLabel("Unit name").fill("03");
	await pane.getByRole("button", { name: "Add", exact: true }).last().click();
	await expect(pane.getByText("03", { exact: true })).toBeVisible();
	await pane.getByRole("button", { name: "Cancel" }).click();
	expect(record.blocks[0]!.storeys.map((s) => s.units.length)).toEqual([
		3, 2, 2,
	]);
	let row = pane
		.getByRole("listitem")
		.filter({ has: page.getByText("03", { exact: true }) });
	await row.getByRole("button", { name: "Edit" }).click();
	await pane.getByLabel("Unit Type").selectOption("t2");
	await pane.getByRole("button", { name: "Save" }).click();
	await expect(row.getByText("BP2", { exact: true })).toBeVisible();
	await row.getByRole("button", { name: "Edit" }).click();
	await pane.getByLabel("Unit Type").selectOption("");
	await pane.getByLabel("Unit name").fill("Corner");
	await pane.getByRole("button", { name: "Save" }).click();
	row = pane
		.getByRole("listitem")
		.filter({ has: page.getByText("Corner", { exact: true }) });
	await expect(row.getByText("No Unit Type")).toBeVisible();
	await expect(row.getByRole("button", { name: "Edit" })).toBeFocused();
	await row.getByRole("button", { name: "Delete" }).click();
	await expect(page.getByRole("dialog")).toContainText("Delete Unit Corner?");
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Delete", exact: true })
		.click();
	await expect(pane.getByText("Corner", { exact: true })).toHaveCount(0);
	await expect(
		pane.getByRole("button", { name: "Add", exact: true })
	).toBeFocused();
});
test("a concurrent clash in only one Storey retains the batch without partial Units", async ({
	page,
}) => {
	const record = project();
	await interceptProjects(page, [record]);
	await signIn(page);
	await page.goto("/projects/p");
	const pane = page.getByRole("region", {
		name: "Units · Block A · Storey 01",
		exact: true,
	});
	await pane.getByRole("button", { name: "Add many" }).click();
	await pane.getByRole("radio", { name: "List", exact: true }).click();
	await pane.getByLabel("Names, one per line").fill("A\nB");
	await pane.getByLabel("Select all Storeys").check();
	record.blocks[0]!.storeys[2]!.units.push({
		id: "winner",
		name: "A",
		position: 0,
		unitTypeId: null,
	});
	await pane.getByRole("button", { name: "Add names" }).click();
	await expect(pane.getByRole("alert")).toHaveText("Names already exist: A");
	await expect(pane.getByLabel("Names, one per line")).toHaveValue("A\nB");
	expect(
		record.blocks[0]!.storeys.map((s) => s.units.map((u) => u.name))
	).toEqual([[], [], ["A"]]);
});
