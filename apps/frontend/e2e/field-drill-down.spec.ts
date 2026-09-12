import { expect, test, type Locator, type Page } from "@playwright/test";
import {
	fieldWorkFixtures,
	interceptField,
	memberFixtures,
	memberToken,
	signInMember,
} from "./field-api";

// The Field's Projects list and the Block, Storey, Unit drill-down, driven at
// phone width against the browser-edge fake scoped to the signed-in
// Subcontractor.
test.use({ viewport: { width: 390, height: 844 } });

const expectTapTarget = async (target: Locator): Promise<void> => {
	const box = await target.boundingBox();
	expect(box).not.toBeNull();
	// Firefox reports sub-pixel heights (43.99999) for a 44px control.
	expect(Math.round(box!.height)).toBeGreaterThanOrEqual(44);
};

const expectNoSidewaysScroll = async (page: Page): Promise<void> => {
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth
		)
	).toBe(true);
};

const rowsOf = (page: Page, label: string): Locator =>
	page.getByRole("list", { name: label, exact: true }).getByRole("link");

test("the Projects list shows each Project where the Subcontractor holds Items with its code, name, Item count and Progression", async ({
	page,
}) => {
	await interceptField(page, memberFixtures(), fieldWorkFixtures());
	const listRequest = page.waitForRequest(
		(request) =>
			/\/api\/v1\/field\/projects$/.test(request.url()) &&
			request.method() === "GET"
	);
	await signInMember(page);
	// The Session rides along; nothing in the request names the Subcontractor.
	const request = await listRequest;
	expect(request.headers()["authorization"]).toBe(
		`Bearer ${memberToken("member-alex")}`
	);
	expect(new URL(request.url()).search).toBe("");

	await expect(
		page.getByRole("heading", { level: 1, name: "Projects" })
	).toBeVisible();
	const rows = rowsOf(page, "Projects");
	await expect(rows).toHaveCount(2);
	// Ordered by name key: Aurora before Gardens; Zeta, where nothing is held, is absent.
	await expect(rows.nth(0)).toContainText("AUR");
	await expect(rows.nth(0)).toContainText("Aurora");
	await expect(rows.nth(0)).toContainText("1 Item");
	await expect(rows.nth(0)).not.toContainText("1 Items");
	await expect(rows.nth(0)).toContainText("0%");
	await expect(rows.nth(1)).toContainText("EG2");
	await expect(rows.nth(1)).toContainText("Gardens");
	await expect(rows.nth(1)).toContainText("3 Items");
	await expect(rows.nth(1)).toContainText("73%");
	await expect(page.getByText("Zeta")).toHaveCount(0);
	await expect(rows.nth(1)).toHaveAttribute(
		"href",
		"/field/projects/project-gardens"
	);
	await expectTapTarget(rows.nth(0));
	await expectTapTarget(rows.nth(1));
	await expectNoSidewaysScroll(page);
	await expect(page.getByText("No work assigned yet")).toHaveCount(0);
});

test("with nothing assigned, the list says no work is assigned yet", async ({
	page,
}) => {
	await interceptField(page);
	await signInMember(page);
	await expect(page.getByText("No work assigned yet")).toBeVisible();
	await expect(page.getByRole("list", { name: "Projects" })).toHaveCount(0);
});

test("a Project walks Blocks, then Storeys, then Units, one level per screen, showing only where the Subcontractor holds Items, with a way back at each level", async ({
	page,
}) => {
	await interceptField(page, memberFixtures(), fieldWorkFixtures());
	await signInMember(page);
	await rowsOf(page, "Projects").filter({ hasText: "Gardens" }).click();

	// Blocks: only A; B holds none of our Items.
	await expect(page).toHaveURL(/\/field\/projects\/project-gardens$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "Gardens" })
	).toBeVisible();
	await expect(page.getByText("EG2", { exact: true })).toBeVisible();
	const blocks = rowsOf(page, "Blocks");
	await expect(blocks).toHaveCount(1);
	await expect(blocks.first()).toContainText("A");
	await expect(blocks.first()).toContainText("3 Items");
	await expect(blocks.first()).toContainText("73%");
	await expect(page.getByRole("link", { name: "B", exact: true })).toHaveCount(
		0
	);
	await expectTapTarget(blocks.first());
	await expectNoSidewaysScroll(page);
	await blocks.first().click();

	// Storeys of A: 01 (one Item) and 02 (two Items); the selection is in the URL.
	await expect(page).toHaveURL(
		/\/field\/projects\/project-gardens\?block=block-a$/
	);
	await expect(
		page.getByRole("heading", { level: 1, name: "Block A" })
	).toBeVisible();
	await expect(page.getByRole("list", { name: "Blocks" })).toHaveCount(0);
	const storeys = rowsOf(page, "Storeys");
	await expect(storeys).toHaveCount(2);
	await expect(storeys.nth(0)).toContainText("01");
	await expect(storeys.nth(0)).toContainText("1 Item");
	await expect(storeys.nth(0)).toContainText("80%");
	await expect(storeys.nth(1)).toContainText("02");
	await expect(storeys.nth(1)).toContainText("2 Items");
	await expect(storeys.nth(1)).toContainText("70%");
	await expectTapTarget(storeys.nth(1));
	await expectNoSidewaysScroll(page);
	await storeys.nth(1).click();

	// Units of 02: only 01 holds our Items; its row opens the Unit's screen.
	await expect(page).toHaveURL(
		/\/field\/projects\/project-gardens\?block=block-a&storey=storey-a2$/
	);
	await expect(
		page.getByRole("heading", { level: 1, name: "Storey 02" })
	).toBeVisible();
	await expect(page.getByText("EG2 · Block A")).toBeVisible();
	const units = rowsOf(page, "Units");
	await expect(units).toHaveCount(1);
	await expect(units.first()).toContainText("01");
	await expect(units.first()).toContainText("2 Items");
	await expect(units.first()).toContainText("70%");
	await expect(units.first()).toHaveAttribute(
		"href",
		"/field/units/unit-a2-01"
	);
	await expectTapTarget(units.first());
	await expectNoSidewaysScroll(page);
	await units.first().click();
	await expect(page).toHaveURL(/\/field\/units\/unit-a2-01$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "Unit 01" })
	).toBeVisible();

	// Back up the levels, one at a time.
	await page.goBack();
	await expect(
		page.getByRole("heading", { level: 1, name: "Storey 02" })
	).toBeVisible();
	const backToStoreys = page.getByRole("link", { name: "Back to Storeys" });
	await expectTapTarget(backToStoreys);
	await backToStoreys.click();
	await expect(page).toHaveURL(
		/\/field\/projects\/project-gardens\?block=block-a$/
	);
	await expect(
		page.getByRole("heading", { level: 1, name: "Block A" })
	).toBeVisible();
	await page.getByRole("link", { name: "Back to Blocks" }).click();
	await expect(page).toHaveURL(/\/field\/projects\/project-gardens$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "Gardens" })
	).toBeVisible();
	await page.getByRole("link", { name: "Back to Projects" }).click();
	await expect(page).toHaveURL(/\/field$/);
	await expect(rowsOf(page, "Projects")).toHaveCount(2);
});

test("a link with the selection in it opens that level, and a stale selection falls back to the Blocks", async ({
	page,
}) => {
	await interceptField(page, memberFixtures(), fieldWorkFixtures());
	await signInMember(page);
	await page.goto(
		"/field/projects/project-gardens?block=block-a&storey=storey-a2"
	);
	await expect(
		page.getByRole("heading", { level: 1, name: "Storey 02" })
	).toBeVisible();
	await expect(rowsOf(page, "Units")).toHaveCount(1);

	// Block B holds none of our Items, so a link naming it shows the Blocks.
	await page.goto("/field/projects/project-gardens?block=block-b");
	await expect(
		page.getByRole("heading", { level: 1, name: "Gardens" })
	).toBeVisible();
	await expect(rowsOf(page, "Blocks")).toHaveCount(1);
});

test("a stale link to a Project outside the Subcontractor is a 404 state with a way back", async ({
	page,
}) => {
	await interceptField(page, memberFixtures(), fieldWorkFixtures());
	await signInMember(page);
	await page.goto("/field/projects/project-zeta");
	await expect(page.getByRole("status")).toContainText(
		"This Project is not in your work"
	);
	await expect(page.getByRole("list")).toHaveCount(0);
	await expect(page.getByRole("alert")).toHaveCount(0);
	// Still signed in: a 404 is not a 401.
	await expect(page.getByText("Alex Tan", { exact: true })).toBeVisible();
	const back = page.getByRole("link", { name: "Back to Projects" });
	await expectTapTarget(back);
	await back.click();
	await expect(page).toHaveURL(/\/field$/);
	await expect(rowsOf(page, "Projects")).toHaveCount(2);
});

test("a failed read shows the error with Retry, and Retry recovers", async ({
	page,
}) => {
	const field = await interceptField(
		page,
		memberFixtures(),
		fieldWorkFixtures()
	);
	await signInMember(page);
	await expect(rowsOf(page, "Projects")).toHaveCount(2);

	field.failNextProjectRead();
	await page.goto("/field/projects/project-gardens");
	await expect(page.getByRole("alert")).toContainText(
		"The Project could not be loaded."
	);
	const retry = page.getByRole("button", { name: "Retry" });
	await expectTapTarget(retry);
	await retry.click();
	await expect(
		page.getByRole("heading", { level: 1, name: "Gardens" })
	).toBeVisible();
	await expect(rowsOf(page, "Blocks")).toHaveCount(1);

	field.failNextProjectRead();
	await page.goto("/field");
	await expect(page.getByRole("alert")).toContainText(
		"Your Projects could not be loaded."
	);
	await page.getByRole("button", { name: "Retry" }).click();
	await expect(rowsOf(page, "Projects")).toHaveCount(2);
});

test("the list and the drill-down read in Chinese at phone width", async ({
	page,
}) => {
	await interceptField(page, memberFixtures(), fieldWorkFixtures());
	await page.goto("/field/login");
	await page.getByRole("combobox", { name: "Language" }).selectOption("zh-CN");
	await page.getByRole("textbox", { name: "手机号码" }).fill("9123 4567");
	await page.getByRole("button", { name: "进入现场" }).click();
	await expect(page).toHaveURL(/\/field$/);

	const rows = rowsOf(page, "项目");
	await expect(rows).toHaveCount(2);
	await expect(rows.nth(1)).toContainText("3 个物品");
	await expect(rows.nth(1)).toContainText("73%");
	await expectNoSidewaysScroll(page);
	await rows.nth(1).click();

	await expect(
		page.getByRole("heading", { level: 1, name: "Gardens" })
	).toBeVisible();
	await expect(page.getByRole("link", { name: "返回项目" })).toBeVisible();
	await rowsOf(page, "楼栋").first().click();
	await expect(
		page.getByRole("heading", { level: 1, name: "A 栋" })
	).toBeVisible();
	await expect(rowsOf(page, "楼层")).toHaveCount(2);
	await rowsOf(page, "楼层").nth(1).click();
	await expect(
		page.getByRole("heading", { level: 1, name: "02 层" })
	).toBeVisible();
	await expect(rowsOf(page, "单元")).toHaveCount(1);
	await expect(page.getByRole("link", { name: "返回楼层" })).toBeVisible();
	await expectNoSidewaysScroll(page);

	await page.goto("/field/projects/project-zeta");
	await expect(page.getByRole("status")).toContainText(
		"该项目不在您的工作范围内"
	);
});
