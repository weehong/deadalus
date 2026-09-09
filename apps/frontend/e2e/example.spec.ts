import { expect, test } from "@playwright/test";
import { signIn } from "./provider";

test("the disposable example is reached by URL inside the Console and uses real API data", async ({
	page,
}) => {
	await signIn(page);
	const navigation = page.getByRole("navigation", {
		name: "Console navigation",
	});
	await expect(navigation.getByRole("link", { name: /example/i })).toHaveCount(
		0
	);
	const matchesResponse = page.waitForResponse(
		(response) =>
			new URL(response.url()).pathname === "/api/v1/matches" &&
			response.request().method() === "GET"
	);
	await page.goto("/example");
	expect((await matchesResponse).status()).toBe(200);
	await expect(page).toHaveURL(/\/example$/);
	await expect(page).toHaveTitle("Daedalus");
	await expect(page.getByRole("main")).toHaveCount(1);
	await expect(
		page.getByRole("main").getByRole("heading", { level: 1, name: /matches/i })
	).toBeVisible();
	await expect(page.getByRole("table").getByRole("row").nth(1)).toBeVisible();
	await expect(navigation).toBeVisible();
	await expect(
		navigation.getByRole("link", { name: "Projects", exact: true })
	).not.toHaveAttribute("aria-current", "page");
	await expect(
		navigation.getByRole("link", { name: "Subcontractors" })
	).not.toHaveAttribute("aria-current", "page");

	const sidebar = page.getByRole("complementary", { name: "Sidebar" });
	await expect(sidebar).toHaveCSS("width", "216px");
	await page.mouse.wheel(0, 1000);
	await expect
		.poll(() => page.evaluate(() => window.scrollY))
		.toBeGreaterThan(0);
	await expect.poll(async () => (await sidebar.boundingBox())?.y).toBe(0);
	await expect(navigation).toBeVisible();
	await navigation.getByRole("link", { name: "Projects", exact: true }).click();
	await expect(page).toHaveURL(/\/projects$/);
});
