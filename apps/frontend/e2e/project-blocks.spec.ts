import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects, type FakeProject } from "./projects-api";
const project = (): FakeProject => ({
	id: "p",
	name: "Gardens",
	code: "EG",
	blocks: [],
	unitTypes: [],
});
test("adds single, range and list Blocks, marks clashes, renames and deletes", async ({
	page,
}) => {
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.goto("/projects/p");
	const pane = page.getByRole("region", { name: "Blocks", exact: true });
	await pane.getByRole("button", { name: "Add Block", exact: true }).click();
	await pane.getByLabel("Block name").fill("A");
	await pane.getByLabel("Block name").press("Enter");
	await expect(pane.getByLabel("Block name")).toHaveValue("");
	await pane.getByRole("button", { name: "Cancel" }).click();
	await pane.getByRole("button", { name: "Add many" }).click();
	await pane.getByLabel("Prefix", { exact: true }).fill("B");
	await pane.getByLabel("To", { exact: true }).fill("2");
	await pane.getByLabel("Zero-pad width").fill("2");
	await expect(pane.getByText("2 names", { exact: true })).toBeVisible();
	await pane.getByRole("button", { name: "Add names" }).click();
	await expect(
		pane.getByRole("button", { name: "B02 0 storeys · 0 units" })
	).toBeVisible();
	await pane.getByRole("button", { name: "Add many" }).click();
	await pane.getByRole("radio", { name: "List", exact: true }).click();
	await pane.getByLabel("Names, one per line").fill("A\nC\nc");
	await expect(pane.getByText("Already exists")).toBeVisible();
	await expect(pane.getByRole("button", { name: "Add names" })).toBeDisabled();
	await pane.getByLabel("Names, one per line").fill("C\nD");
	await pane.getByRole("button", { name: "Add names" }).click();
	await expect(
		pane.getByRole("button", { name: "D 0 storeys · 0 units" })
	).toBeVisible();
	const row = pane
		.getByRole("listitem")
		.filter({
			has: page.getByRole("button", { name: "A 0 storeys · 0 units" }),
		});
	await row.getByRole("button", { name: "Rename" }).click();
	await row.getByLabel("Block name").fill("Renamed");
	await row.getByRole("button", { name: "Save name" }).click();
	await expect(
		pane.getByRole("button", { name: "Renamed 0 storeys · 0 units" })
	).toBeVisible();
	const renamed = pane
		.getByRole("listitem")
		.filter({
			has: page.getByRole("button", { name: "Renamed 0 storeys · 0 units" }),
		});
	await renamed.getByRole("button", { name: "Delete" }).click();
	await expect(page.getByRole("dialog")).toContainText(
		"Delete Block Renamed and its 0 storeys and 0 units?"
	);
	await page
		.getByRole("dialog")
		.getByRole("button", { name: "Delete", exact: true })
		.click();
	await expect(
		pane.getByRole("button", { name: "Renamed 0 storeys · 0 units" })
	).toHaveCount(0);
});
test("a concurrent Block clash retains the preview and lists the server names", async ({
	page,
}) => {
	const record = project();
	await interceptProjects(page, [record]);
	await signIn(page);
	await page.goto("/projects/p");
	const pane = page.getByRole("region", { name: "Blocks", exact: true });
	await pane.getByRole("button", { name: "Add many" }).click();
	await pane.getByRole("radio", { name: "List", exact: true }).click();
	await pane.getByLabel("Names, one per line").fill("A\nB");
	record.blocks.push({ id: "winner", name: "A", position: 0, storeys: [] });
	await pane.getByRole("button", { name: "Add names" }).click();
	await expect(pane.getByRole("alert")).toHaveText("Names already exist: A");
	await expect(pane.getByLabel("Names, one per line")).toHaveValue("A\nB");
	expect(record.blocks.map((block) => block.name)).toEqual(["A"]);
});
