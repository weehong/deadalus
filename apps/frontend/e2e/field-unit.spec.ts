import { expect, test, type Locator, type Page } from "@playwright/test";
import {
	fieldWorkFixtures,
	interceptField,
	memberFixtures,
	memberToken,
	signInMember,
} from "./field-api";

// The Field's Unit screen at phone width against the browser-edge fake: the
// Subcontractor's Items in one Unit, a Member's Progress entry and an Item's
// history, and the drill-down's Progression moving on the way back.
test.use({ viewport: { width: 390, height: 844 } });

const VALUE = "Progression (0 to 100)";
const NOTE = "Note (optional)";
const UNIT = "/field/units/unit-a2-01";

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

const tabTo = async (page: Page, target: Locator): Promise<void> => {
	for (let index = 0; index < 80; index += 1) {
		const direction = await target.evaluate((element) => {
			const active = document.activeElement;
			if (element === active) return "focused";
			return active &&
				active.compareDocumentPosition(element) &
					Node.DOCUMENT_POSITION_PRECEDING
				? "Shift+Tab"
				: "Tab";
		});
		if (direction === "focused") return;
		await page.keyboard.press(direction);
	}
	await expect(target).toBeFocused();
};

/** The Items of the Unit screen: the list's own rows, not a History nested in one. */
const itemsOf = (page: Page, label = "Items"): Locator =>
	page.getByRole("list", { name: label, exact: true }).locator(":scope > li");
const itemNamed = (page: Page, name: string, label?: string): Locator =>
	itemsOf(page, label).filter({
		has: page.getByRole("heading", { level: 2, name, exact: true }),
	});
const rowsOf = (page: Page, label: string): Locator =>
	page.getByRole("list", { name: label, exact: true }).getByRole("link");

const openUnit = async (page: Page): Promise<void> => {
	await interceptField(page, memberFixtures(), fieldWorkFixtures());
	await signInMember(page);
	await page.goto(UNIT);
	await expect(
		page.getByRole("heading", { level: 1, name: "Unit 01" })
	).toBeVisible();
};

const entered = (page: Page): Promise<unknown> =>
	page
		.waitForRequest(
			(request) =>
				request.method() === "POST" &&
				request.url().endsWith("/api/v1/field/items/item-a2-01-sink/entries")
		)
		.then((request) => request.postDataJSON() as unknown);

test("the Unit screen shows its heading and the Subcontractor's Items with Progression and latest entry, with a way back", async ({
	page,
}) => {
	await interceptField(page, memberFixtures(), fieldWorkFixtures());
	const read = page.waitForRequest(
		(request) =>
			request.method() === "GET" &&
			request.url().endsWith("/api/v1/field/units/unit-a2-01/items")
	);
	await signInMember(page);
	await page.goto(UNIT);
	// The Session rides along; nothing in the request names the Subcontractor.
	const request = await read;
	expect(request.headers()["authorization"]).toBe(
		`Bearer ${memberToken("member-alex")}`
	);
	expect(new URL(request.url()).search).toBe("");

	await expect(page.getByText("EG2 · Block A · Storey 02")).toBeVisible();
	await expect(
		page.getByRole("heading", { level: 1, name: "Unit 01" })
	).toBeVisible();
	const items = itemsOf(page);
	await expect(items).toHaveCount(2);
	// Ordered by name key: Sink before Wardrobe.
	const sink = itemNamed(page, "Sink");
	await expect(sink).toContainText("40%");
	await expect(sink).toContainText("Latest 40% by Alex Tan");
	const wardrobe = itemNamed(page, "Wardrobe");
	await expect(wardrobe).toContainText("100%");
	await expect(wardrobe).toContainText("Latest 100% by Bo Lim");
	await expect(items.nth(0)).toContainText("Sink");
	await expect(items.nth(1)).toContainText("Wardrobe");

	const form = sink.getByRole("form", { name: "Enter progress for Sink" });
	const value = form.getByLabel(VALUE);
	await expect(value).toHaveAttribute("inputmode", "numeric");
	await expect(value).toHaveAttribute("type", "number");
	await expectTapTarget(value);
	await expectTapTarget(form.getByLabel(NOTE));
	await expectTapTarget(form.getByRole("button", { name: "Enter" }));
	await expectTapTarget(sink.getByRole("button", { name: "History" }));
	await expectNoSidewaysScroll(page);

	const back = page.getByRole("link", { name: "Back to Units" });
	await expectTapTarget(back);
	await expect(back).toHaveAttribute(
		"href",
		"/field/projects/project-gardens?block=block-a&storey=storey-a2"
	);
});

test("entering progress updates the Item in place, and the drill-down's Progression has moved on the way back", async ({
	page,
}) => {
	await openUnit(page);
	const sink = itemNamed(page, "Sink");
	const form = sink.getByRole("form", { name: "Enter progress for Sink" });
	const request = entered(page);
	await form.getByLabel(VALUE).fill("75");
	await form.getByLabel(NOTE).fill("  Doors hung  ");
	await form.getByRole("button", { name: "Enter" }).click();
	expect(await request).toEqual({ value: 75, note: "Doors hung" });
	await expect(sink).toContainText("75%");
	await expect(sink).toContainText("Latest 75% by Alex Tan");
	await expect(sink).not.toContainText("40%");
	await expect(form.getByLabel(VALUE)).toHaveValue("");
	await expect(form.getByLabel(NOTE)).toHaveValue("");
	await expect(page).toHaveURL(/\/field\/units\/unit-a2-01$/);
	await expect(itemNamed(page, "Wardrobe")).toContainText("100%");

	// A later entry may be lower than the last.
	await form.getByLabel(VALUE).fill("30");
	await form.getByRole("button", { name: "Enter" }).click();
	await expect(sink).toContainText("30%");
	await expect(sink).toContainText("Latest 30% by Alex Tan");

	// Back up the drill-down: Unit 01 now averages 30 and 100, Storey 02 the
	// same, Block A 80, 30 and 100, and Gardens likewise.
	await page.getByRole("link", { name: "Back to Units" }).click();
	await expect(
		page.getByRole("heading", { level: 1, name: "Storey 02" })
	).toBeVisible();
	const units = rowsOf(page, "Units");
	await expect(units).toHaveCount(1);
	await expect(units.first()).toContainText("65%");
	await page.getByRole("link", { name: "Back to Storeys" }).click();
	const storeys = rowsOf(page, "Storeys");
	await expect(storeys.nth(1)).toContainText("65%");
	await page.getByRole("link", { name: "Back to Blocks" }).click();
	await expect(rowsOf(page, "Blocks").first()).toContainText("70%");
	await page.getByRole("link", { name: "Back to Projects" }).click();
	await expect(
		rowsOf(page, "Projects").filter({ hasText: "Gardens" })
	).toContainText("70%");
});

test("shows field errors for a missing, out-of-range or fractional value and a long note, sending nothing", async ({
	page,
}) => {
	await openUnit(page);
	let posts = 0;
	page.on("request", (request) => {
		if (request.method() === "POST" && request.url().endsWith("/entries"))
			posts += 1;
	});
	const form = itemNamed(page, "Sink").getByRole("form", {
		name: "Enter progress for Sink",
	});
	const value = form.getByLabel(VALUE);
	const submit = form.getByRole("button", { name: "Enter" });
	await submit.click();
	const message = form.getByText("Enter a whole number from 0 to 100.");
	await expect(message).toBeVisible();
	await expect(value).toHaveAttribute("aria-invalid", "true");
	await expect(value).toHaveAccessibleDescription(
		"Enter a whole number from 0 to 100."
	);
	await expect(value).toBeFocused();
	for (const typed of ["150", "-1", "50.5"]) {
		await value.fill(typed);
		await submit.click();
		await expect(message).toBeVisible();
	}
	await value.fill("50");
	await form.getByLabel(NOTE).fill("x".repeat(201));
	await submit.click();
	await expect(
		form.getByText("Keep the note to 200 characters.")
	).toBeVisible();
	await expect(form.getByLabel(NOTE)).toHaveAttribute("aria-invalid", "true");
	await expect(form.getByLabel(NOTE)).toBeFocused();
	expect(posts).toBe(0);
	await expect(itemNamed(page, "Sink")).toContainText("40%");
});

test("lists the history newest first, naming each author, and puts a new entry at the top", async ({
	page,
}) => {
	await openUnit(page);
	const sink = itemNamed(page, "Sink");
	const toggle = sink.getByRole("button", { name: "History" });
	await expect(toggle).toHaveAttribute("aria-expanded", "false");
	await expect(
		sink.getByRole("list", { name: "History for Sink" })
	).toHaveCount(0);
	const read = page.waitForRequest(
		(request) =>
			request.method() === "GET" &&
			request.url().endsWith("/api/v1/field/items/item-a2-01-sink/entries")
	);
	await toggle.click();
	expect((await read).headers()["authorization"]).toBe(
		`Bearer ${memberToken("member-alex")}`
	);
	await expect(toggle).toHaveAttribute("aria-expanded", "true");
	const history = sink.getByRole("list", { name: "History for Sink" });
	const entries = history.getByRole("listitem");
	await expect(entries).toHaveCount(2);
	await expect(entries.nth(0)).toContainText("40% by Alex Tan (Acme Joinery)");
	await expect(entries.nth(0)).not.toContainText("Carcass in");
	await expect(entries.nth(1)).toContainText(
		"20% by administrator@example.com (Administrator)"
	);
	await expect(entries.nth(1)).toContainText("Carcass in");
	for (const index of [0, 1])
		await expect(entries.nth(index).locator("time")).toHaveAttribute(
			"datetime",
			/^2026-09-0[89]T12:00:00\.000Z$/
		);

	const form = sink.getByRole("form", { name: "Enter progress for Sink" });
	await form.getByLabel(VALUE).fill("75");
	await form.getByLabel(NOTE).fill("Doors hung");
	await form.getByRole("button", { name: "Enter" }).click();
	await expect(entries).toHaveCount(3);
	await expect(entries.nth(0)).toContainText("75% by Alex Tan (Acme Joinery)");
	await expect(entries.nth(0)).toContainText("Doors hung");
	await expect(entries.nth(1)).toContainText("40% by Alex Tan (Acme Joinery)");
	await toggle.click();
	await expect(history).toHaveCount(0);
	await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("a stale link to a Unit outside the Subcontractor is a 404 state with a way back", async ({
	page,
}) => {
	await interceptField(page, memberFixtures(), fieldWorkFixtures());
	await signInMember(page);
	await page.goto("/field/units/unit-a1-02");
	await expect(page.getByRole("status")).toContainText(
		"No Items for Acme Joinery in this Unit. The QR label may belong to another company, or be out of date."
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

test("keyboard reaches the back link, the entry form and the History", async ({
	page,
}) => {
	await openUnit(page);
	await tabTo(page, page.getByRole("link", { name: "Back to Units" }));
	const sink = itemNamed(page, "Sink");
	const form = sink.getByRole("form", { name: "Enter progress for Sink" });
	const value = form.getByLabel(VALUE);
	await tabTo(page, value);
	await page.keyboard.type("75");
	await expect(value).toHaveValue("75");
	await tabTo(page, form.getByRole("button", { name: "Enter" }));
	await page.keyboard.press("Enter");
	await expect(sink).toContainText("75%");
	const history = sink.getByRole("button", { name: "History" });
	await tabTo(page, history);
	await page.keyboard.press("Enter");
	await expect(history).toHaveAttribute("aria-expanded", "true");
	await expect(
		sink.getByRole("list", { name: "History for Sink" }).getByRole("listitem")
	).toHaveCount(3);
	// The next Item's form is reachable past the open History.
	await tabTo(
		page,
		itemNamed(page, "Wardrobe")
			.getByRole("form", { name: "Enter progress for Wardrobe" })
			.getByLabel(VALUE)
	);
});

test("the Unit screen reads in Chinese at phone width without sideways scrolling", async ({
	page,
}) => {
	await interceptField(page, memberFixtures(), fieldWorkFixtures());
	await page.goto("/field/login");
	await page.getByRole("combobox", { name: "Language" }).selectOption("zh-CN");
	await page.getByRole("textbox", { name: "手机号码" }).fill("9123 4567");
	await page.getByRole("button", { name: "进入现场" }).click();
	await expect(page).toHaveURL(/\/field$/);
	await page.goto(UNIT);
	await expect(
		page.getByRole("heading", { level: 1, name: "01 单元" })
	).toBeVisible();
	await expect(page.getByText("EG2 · A 栋 · 02 层")).toBeVisible();
	await expect(page.getByRole("link", { name: "返回单元" })).toBeVisible();
	const sink = itemNamed(page, "Sink", "物品");
	await expect(sink).toContainText("最新 40%，由 Alex Tan 录入");
	const form = sink.getByRole("form", { name: "为 Sink 录入进度" });
	await form.getByLabel("进度（0 到 100）").fill("75");
	await form.getByLabel("备注（可选）").fill("门已挂上");
	await form.getByRole("button", { name: "录入", exact: true }).click();
	await expect(sink).toContainText("75%");
	await expect(sink).toContainText("最新 75%，由 Alex Tan 录入");
	await sink.getByRole("button", { name: "历史记录" }).click();
	const entries = sink
		.getByRole("list", { name: "Sink 的历史记录" })
		.getByRole("listitem");
	await expect(entries).toHaveCount(3);
	await expect(entries.nth(0)).toContainText(
		"75%，由 Alex Tan（Acme Joinery）录入"
	);
	await expect(entries.nth(0)).toContainText("门已挂上");
	await expectNoSidewaysScroll(page);

	await page.goto("/field/units/unit-a1-02");
	await expect(page.getByRole("status")).toContainText(
		"本单元没有 Acme Joinery 的物品。此二维码标签可能属于其他公司，或已过期。"
	);
});
