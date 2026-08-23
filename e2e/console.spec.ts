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

const interceptProvider = async (page: Page): Promise<void> => {
	await page.route("**/auth/v1/**", async (route) => {
		const request = route.request();
		if (request.url().includes("/token?grant_type=password")) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(successfulSession),
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

const signIn = async (page: Page): Promise<void> => {
	await page
		.getByRole("textbox", { name: "Work email" })
		.fill("administrator@example.com");
	await page.getByLabel("Password").fill("correct horse battery staple");
	await page.getByRole("button", { name: "Sign in" }).click();
};

const destinations = [
	{ path: "/", heading: "Operations console" },
	{ path: "/work-orders", heading: "Work orders" },
	{ path: "/system-status", heading: "System status" },
	{ path: "/assets", heading: "Assets" },
	{ path: "/operators", heading: "Operators" },
	{ path: "/settings", heading: "Settings" },
];

for (const { path, heading } of destinations) {
	test(`${path} is guarded and restored after sign-in`, async ({ page }) => {
		await interceptProvider(page);
		await page.goto(path);

		await expect(page).toHaveURL(/\/sign-in\?/);
		expect(new URL(page.url()).searchParams.get("redirect")).toBe(path);

		await signIn(page);
		await expect(page).toHaveURL(new RegExp(`${path.replace("/", "\\/")}$`));
		await expect(page.getByRole("heading", { name: heading })).toBeVisible();
	});
}

test("a signed-in Administrator reaches every destination directly", async ({
	page,
}) => {
	await interceptProvider(page);
	await page.goto("/sign-in");
	await signIn(page);
	await expect(page).toHaveURL(/\/$/);

	for (const { path, heading } of destinations) {
		await page.goto(path);
		await expect(page).toHaveURL(new RegExp(`${path.replace("/", "\\/")}$`));
		await expect(page.getByRole("heading", { name: heading })).toBeVisible();
	}
});
