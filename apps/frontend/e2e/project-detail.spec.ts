import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects, type FakeProject } from "./projects-api";
const project = (): FakeProject => ({
	id: "gardens",
	name: "Evergreen Gardens",
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
		{
			id: "b",
			name: "B",
			position: 1,
			storeys: [
				{ id: "b1", name: "G", position: 0, units: [] },
				{ id: "b2", name: "02", position: 1, units: [] },
			],
		},
	],
	unitTypes: [{ id: "as1", code: "AS1", description: "1 Bedroom" }],
});
test("opens the Project, walks its Structure with URL selection and opens its Unit Types", async ({
	page,
}) => {
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.getByRole("link", { name: "Evergreen Gardens" }).click();
	await expect(
		page.getByRole("heading", { name: "Evergreen Gardens" })
	).toBeVisible();
	await expect(page.getByText("EG2", { exact: true })).toBeVisible();
	await expect(
		page.getByRole("link", { name: "Projects", exact: true })
	).toHaveAttribute("aria-current", "page");
	await expect(
		page.getByRole("link", { name: "Structure", exact: true })
	).toHaveAttribute("aria-current", "page");
	await expect(page).toHaveURL(/block=a&storey=a1/);
	await expect(
		page
			.getByRole("list", { name: "Units · Block A · Storey 01" })
			.getByText("AS1")
	).toBeVisible();
	await page.getByRole("button", { name: "B 2 storeys · 0 units" }).click();
	await expect(page).toHaveURL(/block=b&storey=b1/);
	await page.getByRole("button", { name: "02 0 units" }).click();
	await expect(page).toHaveURL(/block=b&storey=b2/);
	await expect(
		page.getByRole("button", { name: "02 0 units" })
	).toHaveAttribute("aria-current", "true");
	await page.reload();
	await expect(
		page.getByRole("region", { name: "Units · Block B · Storey 02" })
	).toBeVisible();
	await page.getByRole("link", { name: "Unit Types", exact: true }).click();
	await expect(
		page.getByRole("link", { name: "Unit Types", exact: true })
	).toHaveAttribute("aria-current", "page");
	await expect(
		page.getByRole("columnheader", { name: "Description" })
	).toBeVisible();
	await expect(
		page.getByRole("row", {
			name: "AS1 1 Bedroom 1 Edit Unit Type Delete Unit Type",
		})
	).toBeVisible();
	await page.getByRole("link", { name: "Back to Projects" }).click();
	await expect(
		page.getByRole("heading", { name: "Projects", exact: true })
	).toBeVisible();
});
test("a stale Project URL shows not found with a way back", async ({
	page,
}) => {
	await interceptProjects(page, []);
	await signIn(page);
	await page.goto("/projects/missing");
	await expect(
		page.getByRole("heading", { name: "Project not found" })
	).toBeVisible();
	await page.getByRole("link", { name: "Back to Projects" }).click();
	await expect(
		page.getByRole("heading", { name: "Projects", exact: true })
	).toBeVisible();
});
test("phone panes stack with selected parent names and stay inside the viewport", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await interceptProjects(page, [project()]);
	await signIn(page);
	await page.goto("/projects/gardens?block=b&storey=b2");
	const blocks = page.getByRole("region", { name: "Blocks", exact: true });
	const storeys = page.getByRole("region", { name: "Storeys · Block B" });
	const units = page.getByRole("region", {
		name: "Units · Block B · Storey 02",
	});
	await expect(units).toBeVisible();
	const boxes = await Promise.all([
		blocks.boundingBox(),
		storeys.boundingBox(),
		units.boundingBox(),
	]);
	expect(boxes[1]!.y).toBeGreaterThanOrEqual(boxes[0]!.y + boxes[0]!.height);
	expect(boxes[2]!.y).toBeGreaterThanOrEqual(boxes[1]!.y + boxes[1]!.height);
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth
		)
	).toBe(true);
});
test("empty Structure and catalogue guide the next step in both locales", async ({
	page,
}) => {
	await interceptProjects(page, [{ ...project(), blocks: [], unitTypes: [] }]);
	await signIn(page);
	await page.goto("/projects/gardens");
	await expect(
		page.getByText(
			"No Blocks yet. Add the first Block to set out this project."
		)
	).toBeVisible();
	await expect(
		page.getByText("Select a Block to see its Storeys.")
	).toBeVisible();
	await expect(
		page.getByText("Select a Storey to see its Units.")
	).toBeVisible();
	await page.getByRole("link", { name: "Unit Types", exact: true }).click();
	await expect(
		page.getByText("No Unit Types yet. Add a Unit Type to build the catalogue.")
	).toBeVisible();
	await page.evaluate(() => localStorage.setItem("i18nextLng", "zh-CN"));
	await page.goto("/projects/gardens");
	await expect(
		page.getByText("暂无楼栋。添加第一个楼栋以设置此项目。")
	).toBeVisible();
	await expect(page.getByText("选择楼栋以查看其楼层。")).toBeVisible();
	await expect(page.getByText("选择楼层以查看其单位。")).toBeVisible();
	await page.getByRole("link", { name: "户型", exact: true }).click();
	await expect(page.getByText("暂无户型。添加户型以建立目录。")).toBeVisible();
});
