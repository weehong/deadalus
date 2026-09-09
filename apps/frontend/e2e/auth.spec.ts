import { expect, test, type Page } from "@playwright/test";

/*
 * Two seams, both at the browser's edge: the provider's token endpoint and
 * the API's /me endpoint. Everything between — the client, the store, the
 * guard, the redirect and the form — is real.
 */

const administrator = {
	id: "00000000-0000-4000-8000-000000000001",
	aud: "authenticated",
	role: "authenticated",
	email: "administrator@example.com",
	app_metadata: {},
	user_metadata: {},
	created_at: "2026-01-01T00:00:00.000Z",
};

const grantedSession = {
	access_token: "e2e-access-token",
	token_type: "bearer",
	expires_in: 3600,
	expires_at: Math.floor(Date.now() / 1000) + 3600,
	refresh_token: "e2e-refresh-token",
	user: administrator,
};

type ProviderResponse = { status: number; body: unknown };

const interceptProvider = async (
	page: Page,
	response: ProviderResponse = { status: 200, body: grantedSession }
): Promise<void> => {
	await page.route("**/auth/v1/**", async (route) => {
		const url = route.request().url();
		if (url.includes("/token?grant_type=password")) {
			await route.fulfill({
				status: response.status,
				contentType: "application/json",
				body: JSON.stringify(response.body),
			});
			return;
		}
		if (url.endsWith("/user")) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(administrator),
			});
			return;
		}
		if (url.includes("/logout")) {
			await route.fulfill({ status: 204 });
			return;
		}
		await route.fallback();
	});
	await page.route("**/api/v1/me", async (route) => {
		const authorization = route.request().headers()["authorization"];
		if (authorization !== `Bearer ${grantedSession.access_token}`) {
			await route.fulfill({
				status: 401,
				contentType: "application/json",
				body: JSON.stringify({
					error: { code: "UNAUTHORIZED", message: "Missing bearer token" },
				}),
			});
			return;
		}
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				data: { id: administrator.id, email: administrator.email },
			}),
		});
	});
};

const submitCredentials = async (page: Page): Promise<void> => {
	await page
		.getByRole("textbox", { name: "Work email" })
		.fill("administrator@example.com");
	await page.getByRole("textbox", { name: "Password" }).fill("correct horse battery staple");
	await page.getByRole("button", { name: "Enter portal" }).click();
};

test("a visitor to a guarded route is sent to sign in, then lands on the root", async ({
	page,
}) => {
	await interceptProvider(page);
	await page.goto("/");
	await expect(page).toHaveURL(/\/login$/);
	await expect(page).toHaveTitle("Daedalus");
	await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

	const providerRequest = page.waitForRequest((request) =>
		request.url().includes("/token?grant_type=password")
	);
	await submitCredentials(page);
	expect((await providerRequest).postDataJSON()).toMatchObject({
		email: "administrator@example.com",
		password: "correct horse battery staple",
	});
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole("heading", { name: "Signed in" })).toBeVisible();
});

test("the root shows the identity the API read from the bearer token", async ({
	page,
}) => {
	await interceptProvider(page);
	await page.goto("/login");
	const meRequest = page.waitForRequest((request) =>
		request.url().includes("/api/v1/me")
	);
	await submitCredentials(page);
	expect((await meRequest).headers()["authorization"]).toBe(
		`Bearer ${grantedSession.access_token}`
	);
	await expect(page.getByText("administrator@example.com")).toBeVisible();
	await expect(page.getByText(administrator.id)).toBeVisible();
});

test("a credential rejection is generic and stays on the screen", async ({
	page,
}) => {
	await interceptProvider(page, {
		status: 400,
		body: { code: "email_not_confirmed", message: "Email not confirmed" },
	});
	await page.goto("/login");
	await submitCredentials(page);
	await expect(page).toHaveURL(/\/login$/);
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
	await page.goto("/login");
	await submitCredentials(page);
	await expect(page.getByRole("alert")).toContainText("Please wait");
});

test("an unavailable provider is reported as unreachable", async ({ page }) => {
	await interceptProvider(page, {
		status: 503,
		body: { message: "Service unavailable" },
	});
	await page.goto("/login");
	await submitCredentials(page);
	await expect(page.getByRole("alert")).toContainText("unreachable");
});

test("a session survives reload and a new tab, and bypasses sign-in", async ({
	context,
	page,
}) => {
	await interceptProvider(page);
	await page.goto("/login");
	await submitCredentials(page);
	await expect(page).toHaveURL(/\/$/);

	await page.reload();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole("heading", { name: "Signed in" })).toBeVisible();

	const otherPage = await context.newPage();
	await interceptProvider(otherPage);
	await otherPage.goto("/login");
	await expect(otherPage).toHaveURL(/\/$/);
});

test("logging out returns to sign in", async ({ page }) => {
	await interceptProvider(page);
	await page.goto("/login");
	await submitCredentials(page);
	await expect(page).toHaveURL(/\/$/);

	const logoutRequest = page.waitForRequest((request) =>
		request.url().includes("/logout")
	);
	await page.getByRole("button", { name: "Log out" }).click();
	expect((await logoutRequest).method()).toBe("POST");
	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("language selection translates the screen and persists", async ({
	page,
}) => {
	await page.goto("/login");
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
