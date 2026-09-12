import { expect, test, type Page } from "@playwright/test";
import {
	fieldWorkFixtures,
	interceptField,
	memberFixtures,
	signInMember,
} from "./field-api";

// Scanning a Unit's QR label at phone width: the label carries nothing but
// the Unit's Field URL, so a Member without a Session signs in and is
// returned to it, and a Unit their Subcontractor does not hold says so.
test.use({ viewport: { width: 390, height: 844 } });

const UNIT = "/field/units/unit-a2-01";
const NOT_MINE = "/field/units/unit-a1-02";
const NOTHING = "/field/units/unit-never-existed";

const signInHere = async (page: Page): Promise<void> => {
	await page.getByRole("textbox", { name: "Phone number" }).fill("9123 4567");
	await page.getByRole("button", { name: "Enter the Field" }).click();
};

/** Sign in, holding the Field screen it will return the Member to. */
const expectSignInReturningTo = async (
	page: Page,
	target: string
): Promise<void> => {
	await expect(page).toHaveURL(/\/field\/login\?/);
	expect(new URL(page.url()).searchParams.get("redirect")).toBe(target);
};

test("a scan without a Session signs the Member in and lands on the scanned Unit", async ({
	page,
}) => {
	await interceptField(page, memberFixtures(), fieldWorkFixtures());
	await page.goto(UNIT);
	await expectSignInReturningTo(page, UNIT);
	await expect(
		page.getByRole("heading", { level: 1, name: "Sign in" })
	).toBeVisible();

	await signInHere(page);
	await expect(page).toHaveURL(new RegExp(`${UNIT}$`));
	await expect(
		page.getByRole("heading", { level: 1, name: "Unit 01" })
	).toBeVisible();
	await expect(page.getByText("EG2 · Block A · Storey 02")).toBeVisible();
	await expect(
		page.getByRole("list", { name: "Items", exact: true }).getByRole("heading", {
			level: 2,
			name: "Sink",
		})
	).toBeVisible();
});

test("a Member already in a Session who opens Sign in with a scanned Unit is sent straight to it", async ({
	page,
}) => {
	await interceptField(page, memberFixtures(), fieldWorkFixtures());
	await signInMember(page);
	await page.goto(`/field/login?redirect=${encodeURIComponent(UNIT)}`);
	await expect(page).toHaveURL(new RegExp(`${UNIT}$`));
	await expect(
		page.getByRole("heading", { level: 1, name: "Unit 01" })
	).toBeVisible();
});

test("a scan of a deep Field link keeps its search, so the drill-down reopens where it was", async ({
	page,
}) => {
	await interceptField(page, memberFixtures(), fieldWorkFixtures());
	const target = "/field/projects/project-gardens?block=block-a";
	await page.goto(target);
	await expectSignInReturningTo(page, target);
	await signInHere(page);
	await expect(page).toHaveURL(/\/field\/projects\/project-gardens\?block=block-a$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "Block A" })
	).toBeVisible();
});

for (const [label, redirect] of [
	["a full URL", "https://evil.example"],
	["a protocol-relative host", "//evil.example"],
	["a Console path", "/projects/1"],
	["Sign in itself", "/field/login"],
	["an empty destination", ""],
] as const) {
	test(`a crafted sign-in link naming ${label} is ignored and lands on Projects`, async ({
		page,
	}) => {
		await interceptField(page, memberFixtures(), fieldWorkFixtures());
		await page.goto(`/field/login?redirect=${encodeURIComponent(redirect)}`);
		await signInHere(page);
		await expect(page).toHaveURL(/\/field$/);
		await expect(
			page.getByRole("heading", { level: 1, name: "Projects" })
		).toBeVisible();
	});
}

test("an expired Session on a scanned Unit ends up back on that Unit after signing in again", async ({
	page,
}) => {
	const field = await interceptField(page, memberFixtures(), fieldWorkFixtures());
	await signInMember(page);
	await page.goto(UNIT);
	await expect(
		page.getByRole("heading", { level: 1, name: "Unit 01" })
	).toBeVisible();

	field.revoke();
	await page.reload();
	await expectSignInReturningTo(page, UNIT);
	await expect(page.getByRole("status")).toHaveText(
		"Your Session has ended. Sign in again."
	);
	await signInHere(page);
	await expect(page).toHaveURL(new RegExp(`${UNIT}$`));
	await expect(
		page.getByRole("heading", { level: 1, name: "Unit 01" })
	).toBeVisible();
});

test("Sign out does not hand the next Member the Unit the last one was on", async ({
	page,
}) => {
	await interceptField(page, memberFixtures(), fieldWorkFixtures());
	await signInMember(page);
	await page.goto(UNIT);
	await expect(
		page.getByRole("heading", { level: 1, name: "Unit 01" })
	).toBeVisible();
	await page.getByRole("button", { name: "Sign out", exact: true }).click();
	// The phone may be the site's: signing out is the end of it, unlike a
	// Session that lapsed on its own.
	await expect(page).toHaveURL(/\/field\/login$/);
	await signInHere(page);
	await expect(page).toHaveURL(/\/field$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "Projects" })
	).toBeVisible();
});

for (const [label, path] of [
	["belongs to another company", NOT_MINE],
	["no longer exists", NOTHING],
] as const) {
	test(`a scan of a Unit that ${label} names the Member's Subcontractor and offers a way back`, async ({
		page,
	}) => {
		await interceptField(page, memberFixtures(), fieldWorkFixtures());
		await signInMember(page);
		await page.goto(path);
		await expect(page.getByRole("status")).toContainText(
			"No Items for Acme Joinery in this Unit. The QR label may belong to another company, or be out of date."
		);
		await expect(page.getByRole("alert")).toHaveCount(0);
		// A 404 is not a 401: the Member stays signed in.
		await expect(page.getByText("Alex Tan", { exact: true })).toBeVisible();
		await page.getByRole("link", { name: "Back to Projects" }).click();
		await expect(page).toHaveURL(/\/field$/);
	});
}

test("the scan outcomes read in Chinese", async ({ page }) => {
	await interceptField(page, memberFixtures(), fieldWorkFixtures());
	await page.goto(UNIT);
	await expectSignInReturningTo(page, UNIT);
	await page.getByRole("combobox", { name: "Language" }).selectOption("zh-CN");
	await page.getByRole("textbox", { name: "手机号码" }).fill("9123 4567");
	await page.getByRole("button", { name: "进入现场" }).click();
	await expect(page).toHaveURL(new RegExp(`${UNIT}$`));
	await expect(
		page.getByRole("heading", { level: 1, name: "01 单元" })
	).toBeVisible();
	await page.goto(NOT_MINE);
	await expect(page.getByRole("status")).toContainText(
		"本单元没有 Acme Joinery 的物品。此二维码标签可能属于其他公司，或已过期。"
	);
});
