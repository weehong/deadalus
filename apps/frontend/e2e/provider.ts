import { expect, type Page } from "@playwright/test";

// Only the authentication provider is intercepted. The router, Session read
// model and Console are real; the example continues to use the real API.
export const administrator = {
	id: "00000000-0000-4000-8000-000000000001",
	aud: "authenticated",
	role: "authenticated",
	email: "administrator@example.com",
	app_metadata: {},
	user_metadata: {},
	created_at: "2026-01-01T00:00:00.000Z",
};

type ProviderResponse = { status: number; body: unknown };

export const interceptProvider = async (
	page: Page,
	tokenResponse?: ProviderResponse
): Promise<void> => {
	const session = {
		access_token: "e2e-access-token",
		token_type: "bearer",
		expires_in: 3600,
		expires_at: Math.floor(Date.now() / 1000) + 3600,
		refresh_token: "e2e-refresh-token",
		user: administrator,
	};
	await page.route("**/auth/v1/**", async (route) => {
		const url = new URL(route.request().url());
		if (url.pathname.endsWith("/token")) {
			await route.fulfill({
				status: tokenResponse?.status ?? 200,
				contentType: "application/json",
				body: JSON.stringify(tokenResponse?.body ?? session),
			});
			return;
		}
		if (url.pathname.endsWith("/user")) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(administrator),
			});
			return;
		}
		if (url.pathname.endsWith("/logout")) {
			await route.fulfill({ status: 204 });
			return;
		}
		await route.abort();
	});
};

export const submitCredentials = async (page: Page): Promise<void> => {
	await page
		.getByRole("textbox", { name: "Work email" })
		.fill(administrator.email);
	await page
		.getByRole("textbox", { name: "Password" })
		.fill("correct horse battery staple");
	await page.getByRole("button", { name: "Enter console" }).click();
};

export const signIn = async (page: Page): Promise<void> => {
	await interceptProvider(page);
	await page.goto("/login");
	await submitCredentials(page);
	await expect(page).toHaveURL(/\/projects$/);
};
