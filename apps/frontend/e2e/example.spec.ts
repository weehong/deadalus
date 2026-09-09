import { expect, test, type Page } from "@playwright/test";

/*
 * The example page sits under the Session guard, so each test signs in first
 * through the intercepted provider. Its data still comes from the real API,
 * which needs the database up (see webServer in playwright.config.ts).
 */
const grantedSession = {
	access_token: "e2e-access-token",
	token_type: "bearer",
	expires_in: 3600,
	expires_at: Math.floor(Date.now() / 1000) + 3600,
	refresh_token: "e2e-refresh-token",
	user: {
		id: "00000000-0000-4000-8000-000000000001",
		aud: "authenticated",
		role: "authenticated",
		email: "administrator@example.com",
		app_metadata: {},
		user_metadata: {},
		created_at: "2026-01-01T00:00:00.000Z",
	},
};

const signIn = async (page: Page): Promise<void> => {
	await page.route("**/auth/v1/**", async (route) => {
		const url = route.request().url();
		if (url.includes("/token?grant_type=password")) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(grantedSession),
			});
			return;
		}
		if (url.endsWith("/user")) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(grantedSession.user),
			});
			return;
		}
		await route.fallback();
	});
	await page.route("**/api/v1/me", (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				data: {
					id: grantedSession.user.id,
					email: grantedSession.user.email,
				},
			}),
		})
	);
	await page.goto("/login");
	await page
		.getByRole("textbox", { name: "Work email" })
		.fill("administrator@example.com");
	await page.getByRole("textbox", { name: "Password" }).fill("correct horse battery staple");
	await page.getByRole("button", { name: "Enter portal" }).click();
	await expect(page).toHaveURL(/\/$/);
};

test("the root renders the signed-in placeholder", async ({ page }) => {
	await signIn(page);
	await expect(page).toHaveTitle("Daedalus");
	await expect(page.getByRole("heading", { name: "Signed in" })).toBeVisible();
});

test("can navigate to the example page", async ({ page }) => {
	await signIn(page);
	await page.getByRole("link", { name: /example/i }).click();
	await expect(page).toHaveURL(/\/example/);
	await expect(
		page.getByRole("heading", { level: 1, name: /matches/i })
	).toBeVisible();
});
