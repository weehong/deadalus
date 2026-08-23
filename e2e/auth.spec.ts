import { expect, test, type Page } from "@playwright/test";

const administrator = {
	id: "00000000-0000-4000-8000-000000000001",
	aud: "authenticated",
	role: "authenticated",
	email: "administrator@example.com",
	app_metadata: { provider: "email", providers: ["email"] },
	user_metadata: {},
	identities: [],
	created_at: "2026-01-01T00:00:00.000Z",
	updated_at: "2026-01-01T00:00:00.000Z",
};

const encode = (value: object): string =>
	Buffer.from(JSON.stringify(value)).toString("base64url");
const accessToken = `${encode({ alg: "none", typ: "JWT" })}.${encode({
	aud: "authenticated",
	exp: 4_102_444_800,
	sub: administrator.id,
})}.signature`;

const successfulSession = {
	access_token: accessToken,
	token_type: "bearer",
	expires_in: 2_147_483_647,
	expires_at: 4_102_444_800,
	refresh_token: "provider-refresh-token",
	user: administrator,
};

const interceptProvider = async (
	page: Page,
	response: { status: number; body: object } = {
		status: 200,
		body: successfulSession,
	}
): Promise<void> => {
	await page.route("**/auth/v1/**", async (route) => {
		const request = route.request();
		if (request.url().includes("/token?grant_type=password")) {
			await route.fulfill({
				status: response.status,
				contentType: "application/json",
				body: JSON.stringify(response.body),
			});
			return;
		}
		if (request.url().endsWith("/user")) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(administrator),
			});
			return;
		}
		await route.fallback();
	});
};

const submitCredentials = async (page: Page): Promise<void> => {
	await page
		.getByRole("textbox", { name: "Work email" })
		.fill("administrator@example.com");
	await page.getByLabel("Password").fill("correct horse battery staple");
	await page.getByRole("button", { name: "Sign in" }).click();
};

test("an unauthenticated Administrator returns to the guarded destination after sign-in", async ({
	page,
}) => {
	await interceptProvider(page);
	await page.goto("/?workOrder=WO-1042#history");

	await expect(page).toHaveURL(/\/sign-in\?/);
	const redirect = new URL(page.url()).searchParams.get("redirect");
	expect(redirect).toBe("/?workOrder=WO-1042#history");
	const providerRequestPromise = page.waitForRequest((request) =>
		request.url().includes("/token?grant_type=password")
	);
	await submitCredentials(page);
	const providerRequest = await providerRequestPromise;
	expect(providerRequest.method()).toBe("POST");
	expect(providerRequest.postDataJSON()).toEqual({
		email: "administrator@example.com",
		password: "correct horse battery staple",
		gotrue_meta_security: {},
	});
	await expect(page).toHaveURL(/\/?workOrder=WO-1042#history$/);
	await expect(
		page.getByRole("heading", { name: "Operations console" })
	).toBeVisible();
});

test("a direct sign-in lands on the console root", async ({ page }) => {
	await interceptProvider(page);
	await page.goto("/sign-in");
	await submitCredentials(page);
	await expect(page).toHaveURL(/\/$/);
});

test("a credential rejection is generic and remains on sign-in", async ({
	page,
}) => {
	await interceptProvider(page, {
		status: 400,
		body: { code: "email_not_confirmed", message: "Email not confirmed" },
	});
	await page.goto("/sign-in");
	await submitCredentials(page);

	await expect(page).toHaveURL(/\/sign-in$/);
	await expect(page.getByRole("alert")).toHaveText(
		"The email or password is incorrect."
	);
});

test("a rate-limited response tells the Administrator to wait", async ({
	page,
}) => {
	await interceptProvider(page, {
		status: 429,
		body: { code: "over_request_rate_limit", message: "Too many requests" },
	});
	await page.goto("/sign-in");
	await submitCredentials(page);

	await expect(page.getByRole("alert")).toContainText("Please wait");
});

test("an unavailable provider tells the Administrator the service is unreachable", async ({
	page,
}) => {
	await interceptProvider(page, {
		status: 503,
		body: { message: "Service unavailable" },
	});
	await page.goto("/sign-in");
	await submitCredentials(page);

	await expect(page.getByRole("alert")).toContainText("service is unreachable");
});

test("an authenticated session survives reload, a new tab, and bypasses sign-in", async ({
	context,
	page,
}) => {
	await interceptProvider(page);
	await page.goto("/sign-in");
	await submitCredentials(page);
	await expect(page).toHaveURL(/\/$/);

	await page.reload();
	await expect(page).toHaveURL(/\/$/);
	await expect(
		page.getByRole("heading", { name: "Operations console" })
	).toBeVisible();

	const otherPage = await context.newPage();
	await interceptProvider(otherPage);
	await otherPage.goto("/sign-in");
	await expect(otherPage).toHaveURL(/\/$/);
});

test("language selection translates the sign-in screen and persists", async ({
	page,
}) => {
	await page.goto("/sign-in");
	await page.getByRole("combobox", { name: "Language" }).selectOption("zh-CN");

	await expect(page.getByRole("heading", { name: "登录" })).toBeVisible();
	await expect(page.getByRole("textbox", { name: "工作邮箱" })).toBeVisible();
	await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");

	await page.reload();
	await expect(page.getByRole("heading", { name: "登录" })).toBeVisible();
	await expect(page.getByRole("combobox", { name: "语言" })).toHaveValue(
		"zh-CN"
	);
});
