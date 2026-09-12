import { expect, test, type Locator, type Page } from "@playwright/test";
import { interceptField, memberToken, signInMember } from "./field-api";

// Every Field screen is exercised at phone width.
test.use({ viewport: { width: 390, height: 844 } });

const STORAGE_KEY = "daedalus.field.session";

const storedSession = (page: Page): Promise<string | null> =>
	page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);

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

test("a visitor to the Field is sent to the Field's Sign in, not the Console's", async ({
	page,
}) => {
	await page.goto("/field");
	await expect(page).toHaveURL(/\/field\/login$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "Sign in" })
	).toBeVisible();
	await expect(page.getByRole("banner")).toHaveCount(0);
	await expect(page.getByText("Alex Tan")).toHaveCount(0);
});

test("a known phone in a spaced local format signs in and lands on Projects with the Member's header", async ({
	page,
}) => {
	const field = await interceptField(page);
	await page.goto("/field/login");
	await expect(page.getByText("The Field", { exact: true })).toBeVisible();
	const phone = page.getByRole("textbox", { name: "Phone number" });
	await expect(phone).toHaveAttribute("type", "tel");
	await expect(phone).toHaveAttribute("autocomplete", "tel");
	await expect(phone).toHaveAttribute("inputmode", "tel");
	await expectTapTarget(phone);
	const submit = page.getByRole("button", { name: "Enter the Field" });
	await expectTapTarget(submit);

	const signInRequest = page.waitForRequest(
		(request) =>
			request.url().includes("/api/v1/field/sessions") &&
			request.method() === "POST"
	);
	await phone.fill("9123 4567");
	await page.keyboard.press("Enter");
	expect((await signInRequest).postDataJSON()).toEqual({ phone: "9123 4567" });

	await expect(page).toHaveURL(/\/field$/);
	const header = page.getByRole("banner", { name: "Field" });
	await expect(header.getByText("Alex Tan", { exact: true })).toBeVisible();
	await expect(header.getByText("Acme Joinery", { exact: true })).toBeVisible();
	const signOut = header.getByRole("button", { name: "Sign out", exact: true });
	await expect(signOut).toBeVisible();
	await expectTapTarget(signOut);
	await expect(page.getByRole("main")).toHaveCount(1);
	await expect(
		page.getByRole("heading", { level: 1, name: "Projects" })
	).toBeVisible();
	await expect(page.getByText("No work assigned yet")).toBeVisible();
	await expectNoSidewaysScroll(page);

	// The Member's Session rides along on every Field request, and the
	// Console's navigation is nowhere in sight.
	await expect.poll(() => field.meRequests()).toBeGreaterThan(0);
	await expect(
		page.getByRole("navigation", { name: "Console navigation" })
	).toHaveCount(0);
	expect(JSON.parse((await storedSession(page)) ?? "null")).toMatchObject({
		token: memberToken("member-alex"),
		member: { name: "Alex Tan" },
	});
});

test("an unregistered phone is told so plainly and stays on Sign in", async ({
	page,
}) => {
	await interceptField(page);
	await page.goto("/field/login");
	const phone = page.getByRole("textbox", { name: "Phone number" });
	await phone.fill("9876 5432");
	await page.getByRole("button", { name: "Enter the Field" }).click();
	await expect(page.getByRole("alert")).toHaveText(
		"That phone number is not registered"
	);
	await expect(page).toHaveURL(/\/field\/login$/);
	await expect(phone).toHaveValue("9876 5432");
	expect(await storedSession(page)).toBeNull();
	// Correcting the number dismisses the notice.
	await phone.fill("9876 5433");
	await expect(page.getByRole("alert")).toHaveCount(0);
});

test("a blank phone is refused before any request, with the message tied to the control", async ({
	page,
}) => {
	await interceptField(page);
	await page.goto("/field/login");
	let requests = 0;
	page.on("request", (request) => {
		if (request.url().includes("/api/v1/field/")) requests += 1;
	});
	await page.getByRole("button", { name: "Enter the Field" }).click();
	const phone = page.getByRole("textbox", { name: "Phone number" });
	await expect(phone).toHaveAttribute("aria-invalid", "true");
	await expect(phone).toHaveAccessibleDescription("Enter your phone number");
	expect(requests).toBe(0);
});

test("the Session survives a reload and a new tab", async ({
	context,
	page,
}) => {
	await interceptField(page);
	await signInMember(page);
	await page.reload();
	await expect(page).toHaveURL(/\/field$/);
	await expect(page.getByText("Alex Tan", { exact: true })).toBeVisible();
	await expect(
		page.getByRole("heading", { level: 1, name: "Projects" })
	).toBeVisible();

	const otherPage = await context.newPage();
	await interceptField(otherPage);
	await otherPage.goto("/field/login");
	await expect(otherPage).toHaveURL(/\/field$/);
	await expect(otherPage.getByText("Alex Tan", { exact: true })).toBeVisible();
});

test("Sign out ends the Session and the Field is guarded again", async ({
	page,
}) => {
	await interceptField(page);
	await signInMember(page);
	await page.getByRole("button", { name: "Sign out", exact: true }).click();
	await expect(page).toHaveURL(/\/field\/login$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "Sign in" })
	).toBeVisible();
	expect(await storedSession(page)).toBeNull();
	await page.goto("/field");
	await expect(page).toHaveURL(/\/field\/login$/);
});

test("a 401 mid-session clears the Session and returns to Sign in with a notice", async ({
	page,
}) => {
	const field = await interceptField(page);
	await signInMember(page);
	field.revoke();
	await page.reload();
	await expect(page).toHaveURL(/\/field\/login$/);
	await expect(page.getByRole("status")).toHaveText(
		"Your Session has ended. Sign in again."
	);
	expect(await storedSession(page)).toBeNull();
	await page.goto("/field");
	await expect(page).toHaveURL(/\/field\/login$/);
});

test("the Field and the Console hold independent Sessions", async ({
	page,
}) => {
	await interceptField(page);
	await signInMember(page);
	await page.goto("/projects");
	await expect(page).toHaveURL(/\/login$/);
	await page.goto("/field");
	await expect(page).toHaveURL(/\/field$/);
	await expect(page.getByText("Alex Tan", { exact: true })).toBeVisible();
});

test("the Field reads in Chinese from Sign in through to Sign out", async ({
	page,
}) => {
	await interceptField(page);
	await page.goto("/field/login");
	await page.getByRole("combobox", { name: "Language" }).selectOption("zh-CN");
	await expect(
		page.getByRole("heading", { level: 1, name: "登录" })
	).toBeVisible();
	await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
	await page.getByRole("textbox", { name: "手机号码" }).fill("9123 4567");
	await page.getByRole("button", { name: "进入现场" }).click();
	await expect(page).toHaveURL(/\/field$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "项目" })
	).toBeVisible();
	await expect(page.getByText("Alex Tan", { exact: true })).toBeVisible();
	await expect(page.getByText("尚未分配工作")).toBeVisible();
	await expectNoSidewaysScroll(page);
	await page.getByRole("button", { name: "退出登录", exact: true }).click();
	await expect(page).toHaveURL(/\/field\/login$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "登录" })
	).toBeVisible();
});

test("keyboard: Tab reaches the phone control first and Sign out from the header", async ({
	page,
}) => {
	await interceptField(page);
	await page.goto("/field/login");
	// Boot restores both Sessions before Sign in mounts; Tab once it has.
	const phone = page.getByRole("textbox", { name: "Phone number" });
	await expect(phone).toBeVisible();
	await page.keyboard.press("Tab");
	await expect(phone).toBeFocused();
	await page.keyboard.type("9123 4567");
	await page.keyboard.press("Tab");
	await expect(
		page.getByRole("button", { name: "Enter the Field" })
	).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page).toHaveURL(/\/field$/);
	await page.keyboard.press("Tab");
	await expect(
		page.getByRole("button", { name: "Sign out", exact: true })
	).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page).toHaveURL(/\/field\/login$/);
});
