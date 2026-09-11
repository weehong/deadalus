import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import { interceptSubcontractors } from "./subcontractors-api";
const fixtures = () => [
	{
		id: "acme",
		name: "Acme",
		members: [{ id: "alex", name: "Alex", phone: "+6591234567" }],
	},
	{
		id: "beacon",
		name: "Beacon",
		members: [{ id: "mei", name: "Mei", phone: "+6592345678" }],
	},
];
test("adds and edits inline, sends typed phones and refreshes the Directory", async ({
	page,
}) => {
	await interceptSubcontractors(page, fixtures());
	await signIn(page);
	await page.goto("/subcontractors");
	await page.getByRole("link", { name: "Acme", exact: true }).click();
	await page.getByRole("button", { name: "Add Member" }).click();
	await page.getByLabel("Member name").fill(" Aaron ");
	await page.getByLabel("Phone number").fill(" 9345 6789 ");
	const sent = page.waitForRequest(
		(request) =>
			request.method() === "POST" && request.url().endsWith("/acme/members")
	);
	await page.getByRole("button", { name: "Add Member" }).click();
	expect((await sent).postDataJSON()).toEqual({
		name: "Aaron",
		phone: "9345 6789",
	});
	await expect(
		page.getByRole("row", { name: /Aaron.*\+6593456789/ })
	).toBeVisible();
	await page.getByRole("button", { name: "Edit Aaron", exact: true }).click();
	await expect(page.getByLabel("Phone number")).toHaveValue("+6593456789");
	await page.getByLabel("Member name").fill("Zoe");
	await page.getByLabel("Phone number").fill("9456 7890");
	await page.getByRole("button", { name: "Save Member" }).click();
	await expect(
		page.getByRole("row", { name: /Zoe.*\+6594567890/ })
	).toBeVisible();
	await page.getByRole("link", { name: "Back to Directory" }).click();
	const row = page.getByRole("row", { name: /Acme/ });
	await expect(row).toContainText("2");
	await expect(row).toContainText("+6594567890");
	await expect(row).not.toContainText("+6593456789");
});

test("add and edit name the Subcontractor holding a taken phone and Cancel discards changes", async ({
	page,
}) => {
	await interceptSubcontractors(page, fixtures());
	await signIn(page);
	await page.goto("/subcontractors/acme");
	await page.getByRole("button", { name: "Add Member" }).click();
	await page.getByLabel("Member name").fill("Aaron");
	await page.getByLabel("Phone number").fill("0065 (9234)-5678");
	await page.getByRole("button", { name: "Add Member" }).click();
	await expect(page.getByLabel("Phone number")).toHaveAccessibleDescription(
		"This phone number belongs to a Member of Beacon."
	);
	await expect(page.getByLabel("Phone number")).toBeFocused();
	await page.getByRole("button", { name: "Cancel" }).click();
	await expect(page.getByRole("row", { name: /Aaron/ })).toHaveCount(0);
	await page.getByRole("button", { name: "Edit Alex", exact: true }).click();
	await page.getByLabel("Member name").fill("Changed");
	await page.getByLabel("Phone number").fill("9234 5678");
	await page.getByRole("button", { name: "Save Member" }).click();
	await expect(page.getByLabel("Phone number")).toHaveAccessibleDescription(
		"This phone number belongs to a Member of Beacon."
	);
	await page.getByRole("button", { name: "Cancel" }).click();
	await expect(
		page.getByRole("row", { name: /Alex.*\+6591234567/ })
	).toBeVisible();
});

test("shows busy and failure states with retained input for retry", async ({
	page,
}) => {
	await interceptSubcontractors(page, fixtures());
	await signIn(page);
	await page.goto("/subcontractors/acme");
	let release: () => void = () => undefined;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route(
		"**/api/v1/subcontractors/acme/members",
		async (route) => {
			await gate;
			await route.fulfill({
				status: 503,
				json: { error: { code: "UNAVAILABLE", message: "Unavailable" } },
			});
		},
		{ times: 1 }
	);
	await page.getByRole("button", { name: "Add Member" }).click();
	await page.getByLabel("Member name").fill("Aaron");
	await page.getByLabel("Phone number").fill("9345 6789");
	await page.getByRole("button", { name: "Add Member" }).click();
	await expect(page.getByRole("button", { name: "Saving…" })).toBeDisabled();
	await expect(page.getByRole("button", { name: "Cancel" })).toBeDisabled();
	release();
	await expect(page.getByRole("alert")).toHaveText(
		"Could not save the Member. Please try again."
	);
	await expect(page.getByLabel("Member name")).toHaveValue("Aaron");
	await expect(page.getByLabel("Phone number")).toHaveValue("9345 6789");
	await page.getByRole("button", { name: "Add Member" }).click();
	await expect(
		page.getByRole("row", { name: /Aaron.*\+6593456789/ })
	).toBeVisible();
});

test("translated inline forms validate and fit a narrow screen", async ({
	page,
}) => {
	await interceptSubcontractors(page, fixtures());
	await signIn(page);
	await page.evaluate(() => localStorage.setItem("i18nextLng", "zh-CN"));
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto("/subcontractors/acme");
	await page.getByRole("button", { name: "添加成员" }).click();
	await page.getByRole("button", { name: "添加成员" }).click();
	await expect(page.getByLabel("成员姓名")).toHaveAccessibleDescription(
		"请输入成员姓名"
	);
	await expect(page.getByLabel("电话号码")).toHaveAccessibleDescription(
		"请输入电话号码"
	);
	await page.getByLabel("成员姓名").fill("Aaron");
	await page.getByLabel("电话号码").fill("123");
	await page.getByRole("button", { name: "添加成员" }).click();
	await expect(page.getByLabel("电话号码")).toHaveAccessibleDescription(
		"请输入有效的电话号码"
	);
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth
		)
	).toBe(true);
	await page.getByRole("button", { name: "取消" }).click();
	await page.getByRole("button", { name: "编辑Alex", exact: true }).click();
	await expect(page.getByRole("button", { name: "保存成员" })).toBeVisible();
	await page.getByRole("button", { name: "取消" }).click();
});
