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
	{
		id: "bolt",
		name: "Bolt Electrical",
		members: [{ id: "mei", name: "Mei", phone: "+6592222222" }],
	},
];
// Unit 01 of Block A, Storey 01 holds a Sink assigned to Acme with two
// entries (the latest by Alex, a Member) and a Wardrobe with no Assignment.
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
								{
									catalogueItemId: "sink",
									subcontractorId: "acme",
									progression: 60,
									entryCount: 2,
									entries: [
										{
											id: "e1",
											value: 20,
											note: "Carcass in",
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
			],
		},
	],
	unitTypes: [{ id: "as1", code: "AS1", description: null }],
	catalogueItems: [
		{ id: "wardrobe", name: "Wardrobe" },
		{ id: "sink", name: "Sink" },
	],
});
const VALUE = "Progression (0 to 100)";
const NOTE = "Note (optional)";
/** The Unit card of Unit 01 with its Items disclosure open. */
const openItems = async (
	page: Page
): Promise<{ card: Locator; item: (name: string) => Locator }> => {
	await interceptSubcontractors(page, directory());
	await interceptProjects(page, [project()], directory());
	await signIn(page);
	await page.goto("/projects/gardens?block=a&storey=a1");
	const pane = page.getByRole("region", { name: /Units/ });
	const card = pane
		.getByRole("listitem")
		.filter({ has: page.getByText("01", { exact: true }) })
		.first();
	await card.getByRole("button", { name: "Items" }).click();
	return { card, item: (name: string): Locator => itemRow(card, page, name) };
};
/** An Item's row on the card: the listitem carrying its entry form (history entries carry none). */
const itemRow = (card: Locator, page: Page, name: string): Locator =>
	card.getByRole("listitem").filter({
		has: page.getByRole("form", { name: `Enter progress for ${name}` }),
	});
const entered = (page: Page): Promise<unknown> =>
	page
		.waitForRequest(
			(request) =>
				request.method() === "POST" &&
				request.url().endsWith("/items/u1%3Asink/entries")
		)
		.then((request) => request.postDataJSON() as unknown);
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

test("enters progress on an assigned Item from the Unit card and the Item updates in place", async ({
	page,
}) => {
	const { item } = await openItems(page);
	const sink = item("Sink");
	await expect(sink).toContainText("60%");
	await expect(sink).toContainText("Latest 60% by Alex");
	const form = sink.getByRole("form", { name: "Enter progress for Sink" });
	const request = entered(page);
	const refreshed = page.waitForRequest(
		(candidate) =>
			candidate.method() === "GET" &&
			/\/api\/v1\/projects\/gardens$/.test(candidate.url())
	);
	await form.getByLabel(VALUE).fill("75");
	await form.getByLabel(NOTE).fill("  Doors hung  ");
	await form.getByRole("button", { name: "Enter" }).click();
	expect(await request).toEqual({ value: 75, note: "Doors hung" });
	await refreshed;
	await expect(sink).toContainText("75%");
	await expect(sink).toContainText("Latest 75% by administrator@example.com");
	await expect(sink).not.toContainText("60%");
	await expect(form.getByLabel(VALUE)).toHaveValue("");
	await expect(form.getByLabel(NOTE)).toHaveValue("");
	await expect(page).toHaveURL(/\/projects\/gardens\?block=a&storey=a1$/);
	// A later entry may be lower than the last.
	await form.getByLabel(VALUE).fill("30");
	await form.getByRole("button", { name: "Enter" }).click();
	await expect(sink).toContainText("30%");
	await expect(sink).toContainText("Latest 30% by administrator@example.com");
	await expect(item("Wardrobe")).toContainText("0%");
});

test("refuses progress on an Item with no Assignment, on the card and from the API", async ({
	page,
}) => {
	const { item } = await openItems(page);
	const wardrobe = item("Wardrobe");
	await expect(wardrobe).toContainText("No entries yet.");
	const form = wardrobe.getByRole("form", {
		name: "Enter progress for Wardrobe",
	});
	await expect(form).toContainText(
		"Assign this Item to a Subcontractor before entering progress."
	);
	await expect(form.getByLabel(VALUE)).toBeDisabled();
	await expect(form.getByLabel(NOTE)).toBeDisabled();
	await expect(form.getByRole("button", { name: "Enter" })).toBeDisabled();
	await wardrobe.getByRole("button", { name: "History" }).click();
	await expect(
		wardrobe.getByRole("list", { name: "History for Wardrobe" })
	).toHaveCount(0);
	await expect(wardrobe).toContainText("No entries yet.");
	// The Assignment went elsewhere since the card loaded: the API refuses and the card says so.
	await page.route(
		"**/api/v1/projects/gardens/items/u1%3Asink/entries",
		async (route) => {
			if (route.request().method() !== "POST") {
				await route.fallback();
				return;
			}
			await route.fulfill({
				status: 409,
				json: {
					error: {
						code: "ITEM_UNASSIGNED",
						message: "An Item with no Assignment accepts no Progress entry",
					},
				},
			});
		}
	);
	const sink = item("Sink");
	const sinkForm = sink.getByRole("form", { name: "Enter progress for Sink" });
	await sinkForm.getByLabel(VALUE).fill("50");
	await sinkForm.getByRole("button", { name: "Enter" }).click();
	await expect(sinkForm.getByRole("alert")).toHaveText(
		"This Item has no Assignment. Assign it first."
	);
	await expect(sink).toContainText("60%");
});

test("shows field errors for a missing, out-of-range or fractional value and a long note, sending nothing", async ({
	page,
}) => {
	const { item } = await openItems(page);
	let posts = 0;
	page.on("request", (request) => {
		if (request.method() === "POST" && request.url().endsWith("/entries"))
			posts += 1;
	});
	const form = item("Sink").getByRole("form", {
		name: "Enter progress for Sink",
	});
	const value = form.getByLabel(VALUE);
	const submit = form.getByRole("button", { name: "Enter" });
	await submit.click();
	await expect(
		form.getByText("Enter a whole number from 0 to 100.")
	).toBeVisible();
	await expect(value).toHaveAttribute("aria-invalid", "true");
	await expect(value).toBeFocused();
	for (const typed of ["150", "-1", "50.5"]) {
		await value.fill(typed);
		await submit.click();
		await expect(
			form.getByText("Enter a whole number from 0 to 100.")
		).toBeVisible();
	}
	await value.fill("50");
	await form.getByLabel(NOTE).fill("x".repeat(201));
	await submit.click();
	await expect(
		form.getByText("Keep the note to 200 characters.")
	).toBeVisible();
	await expect(form.getByLabel(NOTE)).toHaveAttribute("aria-invalid", "true");
	expect(posts).toBe(0);
});

test("lists the history newest first and puts a new entry at the top", async ({
	page,
}) => {
	const { item } = await openItems(page);
	const sink = item("Sink");
	const toggle = sink.getByRole("button", { name: "History" });
	await expect(toggle).toHaveAttribute("aria-expanded", "false");
	await expect(
		sink.getByRole("list", { name: "History for Sink" })
	).toHaveCount(0);
	const read = page.waitForRequest(
		(request) =>
			request.method() === "GET" &&
			request.url().endsWith("/items/u1%3Asink/entries")
	);
	await toggle.click();
	await read;
	await expect(toggle).toHaveAttribute("aria-expanded", "true");
	const history = sink.getByRole("list", { name: "History for Sink" });
	const entries = history.getByRole("listitem");
	await expect(entries).toHaveCount(2);
	await expect(entries.nth(0)).toContainText("60% by Alex (Acme Fitout)");
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
	await expect(entries.nth(0)).toContainText(
		"75% by administrator@example.com (Administrator)"
	);
	await expect(entries.nth(0)).toContainText("Doors hung");
	await expect(entries.nth(1)).toContainText("60% by Alex (Acme Fitout)");
	await toggle.click();
	await expect(history).toHaveCount(0);
	await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("keyboard reaches the entry form and the History with Items open", async ({
	page,
}) => {
	await interceptSubcontractors(page, directory());
	await interceptProjects(page, [project()], directory());
	await signIn(page);
	await page.goto("/projects/gardens?block=a&storey=a1");
	const card = page
		.getByRole("region", { name: /Units/ })
		.getByRole("listitem")
		.filter({ has: page.getByText("01", { exact: true }) })
		.first();
	const toggle = card.getByRole("button", { name: "Items" });
	await tabTo(page, toggle);
	await page.keyboard.press("Enter");
	await expect(toggle).toHaveAttribute("aria-expanded", "true");
	const sink = itemRow(card, page, "Sink");
	const form = sink.getByRole("form", { name: "Enter progress for Sink" });
	const value = form.getByLabel(VALUE);
	await expect(value).toHaveAttribute("inputmode", "numeric");
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
	// The Wardrobe's disabled form is skipped by the keyboard, not trapped in.
	const wardrobe = itemRow(card, page, "Wardrobe");
	await tabTo(page, wardrobe.getByRole("button", { name: "History" }));
	await expect(
		wardrobe
			.getByRole("form", { name: "Enter progress for Wardrobe" })
			.getByLabel(VALUE)
	).toBeDisabled();
});

test("enters progress in Chinese at phone width without sideways scrolling", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await interceptSubcontractors(page, directory());
	await interceptProjects(page, [project()], directory());
	await signIn(page);
	await page.evaluate(() => localStorage.setItem("i18nextLng", "zh-CN"));
	await page.goto("/projects/gardens?block=a&storey=a1");
	const card = page
		.getByRole("listitem")
		.filter({ has: page.getByRole("button", { name: "物品", exact: true }) })
		.first();
	await card.getByRole("button", { name: "物品", exact: true }).click();
	const sink = card.getByRole("listitem").filter({
		has: page.getByRole("form", { name: "为 Sink 录入进度" }),
	});
	const form = sink.getByRole("form", { name: "为 Sink 录入进度" });
	await expect(sink).toContainText("最新 60%，由 Alex 录入");
	await form.getByLabel("进度（0 到 100）").fill("75");
	await form.getByLabel("备注（可选）").fill("门已挂上");
	await form.getByRole("button", { name: "录入", exact: true }).click();
	await expect(sink).toContainText("75%");
	await expect(sink).toContainText(
		"最新 75%，由 administrator@example.com 录入"
	);
	await sink.getByRole("button", { name: "历史记录" }).click();
	const entries = sink
		.getByRole("list", { name: "Sink 的历史记录" })
		.getByRole("listitem");
	await expect(entries).toHaveCount(3);
	await expect(entries.nth(0)).toContainText(
		"75%，由 administrator@example.com（管理员）录入"
	);
	await expect(entries.nth(1)).toContainText("60%，由 Alex（Acme Fitout）录入");
	const wardrobeForm = card.getByRole("form", { name: "为 Wardrobe 录入进度" });
	await expect(wardrobeForm).toContainText(
		"请先将此物品分配给分包商，再录入进度。"
	);
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth
		)
	).toBe(true);
});
