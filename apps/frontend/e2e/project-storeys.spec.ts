import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects, type FakeProject } from "./projects-api";
const project = (): FakeProject => ({
	id: "p",
	name: "Gardens",
	code: "EG",
	blocks: [
		{ id: "a", name: "A", position: 0, storeys: [] },
		{ id: "b", name: "B", position: 1, storeys: [] },
	],
	unitTypes: [],
});
test("adds Storey ranges within each Block, marks clashes, renames and deletes", async ({
	page,
}) => {
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.goto("/projects/p");
	for (const block of ["A", "B"]) {
		await page
			.getByRole("region", { name: "Blocks", exact: true })
			.getByRole("button", { name: `${block} 0 storeys · 0 units` })
			.click();
		const pane = page.getByRole("region", {
			name: `Storeys · Block ${block}`,
			exact: true,
		});
		await pane.getByRole("button", { name: "Add many" }).click();
		await pane.getByLabel("To", { exact: true }).fill("2");
		await pane.getByLabel("Zero-pad width").fill("2");
		await pane.getByRole("button", { name: "Add names" }).click();
		await expect(
			pane.getByRole("button", { name: "02 0 units" })
		).toBeVisible();
	}
	const pane = page.getByRole("region", {
		name: "Storeys · Block B",
		exact: true,
	});
	await pane.getByRole("button", { name: "Add many" }).click();
	await pane.getByRole("radio", { name: "List", exact: true }).click();
	await pane.getByLabel("Names, one per line").fill("01\n03");
	await expect(pane.getByText("Already exists")).toBeVisible();
	await expect(pane.getByRole("button", { name: "Add names" })).toBeDisabled();
	await pane.getByRole("button", { name: "Cancel" }).click();
	const row = pane.getByRole("listitem").filter({
		has: page.getByRole("button", { name: "01 0 units No Items", exact: true }),
	});
	await row.getByRole("button", { name: "Rename" }).click();
	await row.getByLabel("Storey name").fill("G");
	await row.getByLabel("Storey name").press("Enter");
	const renamed = pane.getByRole("listitem").filter({
		has: page.getByRole("button", { name: "G 0 units No Items", exact: true }),
	});
	await renamed.getByRole("button", { name: "Delete" }).click();
	await expect(page.getByRole("dialog")).toContainText(
		"Delete Storey G and its 0 Units, 0 Items and 0 Progress entries?"
	);
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Delete", exact: true })
		.click();
	await expect(
		pane.getByRole("button", { name: "G 0 units No Items", exact: true })
	).toHaveCount(0);
	await expect(
		pane.getByRole("button", { name: "02 0 units" })
	).toHaveAttribute("aria-current", "true");
});
test("a concurrent Storey clash retains the batch and creates no partial Storeys", async ({
	page,
}) => {
	const record = project();
	await interceptProjects(page, [record]);
	await signIn(page);
	await page.goto("/projects/p");
	const pane = page.getByRole("region", {
		name: "Storeys · Block A",
		exact: true,
	});
	await pane.getByRole("button", { name: "Add many" }).click();
	await pane.getByRole("radio", { name: "List", exact: true }).click();
	await pane.getByLabel("Names, one per line").fill("01\n02");
	record.blocks[0]!.storeys.push({
		id: "winner",
		name: "01",
		position: 0,
		units: [],
	});
	await pane.getByRole("button", { name: "Add names" }).click();
	await expect(pane.getByRole("alert")).toHaveText("Names already exist: 01");
	await expect(pane.getByLabel("Names, one per line")).toHaveValue("01\n02");
	expect(record.blocks[0]!.storeys.map((storey) => storey.name)).toEqual([
		"01",
	]);
});
