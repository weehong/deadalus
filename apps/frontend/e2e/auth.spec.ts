import { expect, test } from "@playwright/test";
import {
	administrator,
	interceptProvider,
	signIn,
	submitCredentials,
} from "./provider";

for (const pathname of ["/", "/projects", "/subcontractors", "/example"]) {
	test(`a visitor to ${pathname} is sent to Sign in`, async ({ page }) => {
		await page.goto(pathname);
		await expect(page).toHaveURL(/\/login$/);
		await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
		await expect(
			page.getByRole("navigation", { name: "Console navigation" })
		).toHaveCount(0);
	});
}

test("signing in lands on Projects with Session identity and real Console navigation", async ({
	page,
}) => {
	await interceptProvider(page);
	await page.goto("/subcontractors");
	await expect(page).toHaveURL(/\/login$/);
	await expect(page).toHaveTitle("Daedalus");
	await expect(
		page.getByText("Administrator console", { exact: true })
	).toBeVisible();

	const providerRequest = page.waitForRequest((request) =>
		request.url().includes("/token?grant_type=password")
	);
	await submitCredentials(page);
	expect((await providerRequest).postDataJSON()).toMatchObject({
		email: administrator.email,
		password: "correct horse battery staple",
	});
	await expect(page).toHaveURL(/\/projects$/);
	const sidebar = page.getByRole("complementary", { name: "Sidebar" });
	const navigation = sidebar.getByRole("navigation", {
		name: "Console navigation",
	});
	await expect(sidebar.getByRole("img", { name: "Daedalus" })).toBeVisible();
	await expect(sidebar.getByText("Unit Matrix", { exact: true })).toBeVisible();
	await expect(
		sidebar.getByText(administrator.email, { exact: true })
	).toBeVisible();
	await expect(
		sidebar.getByText("Administrator", { exact: true })
	).toBeVisible();
	await expect(navigation.getByRole("link")).toHaveCount(2);
	await expect(
		navigation.getByRole("link", { name: "Projects", exact: true })
	).toHaveAttribute("aria-current", "page");
	await expect(
		navigation.getByRole("link", { name: "Subcontractors" })
	).not.toHaveAttribute("aria-current", "page");
	await expect(page.getByRole("main")).toHaveCount(1);
	await expect(
		page.getByRole("heading", { level: 1, name: "Projects" })
	).toBeVisible();
	await expect(
		page.getByRole("main").getByText("Portfolio", { exact: true })
	).toBeVisible();
	await expect(
		page
			.getByRole("main")
			.getByText("This screen is not built yet.", { exact: true })
	).toBeVisible();

	await navigation.getByRole("link", { name: "Subcontractors" }).click();
	await expect(page).toHaveURL(/\/subcontractors$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "Subcontractors" })
	).toBeVisible();
	await expect(
		page.getByRole("main").getByText("Directory", { exact: true })
	).toBeVisible();
	await expect(
		page
			.getByRole("main")
			.getByText("This screen is not built yet.", { exact: true })
	).toBeVisible();
	await expect(
		navigation.getByRole("link", { name: "Subcontractors" })
	).toHaveAttribute("aria-current", "page");
	await expect(
		navigation.getByRole("link", { name: "Projects", exact: true })
	).not.toHaveAttribute("aria-current", "page");
});

test("a credential rejection is generic and stays on Sign in", async ({
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

test("a Session survives reload on the current screen and bypasses Sign in in a new tab", async ({
	context,
	page,
}) => {
	await signIn(page);
	await page.getByRole("link", { name: "Subcontractors" }).click();
	await expect(page).toHaveURL(/\/subcontractors$/);
	await page.reload();
	await expect(page).toHaveURL(/\/subcontractors$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "Subcontractors" })
	).toBeVisible();
	await expect(
		page.getByRole("navigation", { name: "Console navigation" })
	).toBeVisible();
	await expect(
		page.getByText(administrator.email, { exact: true })
	).toBeVisible();
	await expect(
		page.getByRole("link", { name: "Subcontractors" })
	).toHaveAttribute("aria-current", "page");

	const otherPage = await context.newPage();
	await interceptProvider(otherPage);
	await otherPage.goto("/login");
	await expect(otherPage).toHaveURL(/\/projects$/);
	await expect(
		otherPage.getByRole("heading", { level: 1, name: "Projects" })
	).toBeVisible();
});

test("Sign out stays busy without repeat requests and returns to Sign in", async ({
	page,
}) => {
	await signIn(page);
	let finishSignOut!: () => void;
	const pendingResponse = new Promise<void>((resolve) => {
		finishSignOut = resolve;
	});
	let requests = 0;
	await page.route("**/auth/v1/logout**", async (route) => {
		requests += 1;
		await pendingResponse;
		await route.fulfill({ status: 204 });
	});
	const signOutRequest = page.waitForRequest((request) =>
		request.url().includes("/logout")
	);
	await page.getByRole("button", { name: "Sign out", exact: true }).click();
	expect((await signOutRequest).method()).toBe("POST");
	const busyButton = page.getByRole("button", {
		name: "Signing out…",
		exact: true,
	});
	await expect(busyButton).toBeDisabled();
	await expect(busyButton).toHaveAttribute("aria-busy", "true");
	await page.keyboard.press("Enter");
	await expect(page).toHaveURL(/\/projects$/);
	expect(requests).toBe(1);
	finishSignOut();
	await expect(page).toHaveURL(/\/login$/);
	await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
	await page.goto("/subcontractors");
	await expect(page).toHaveURL(/\/login$/);
});

test("a failed Sign out keeps the Console available and can be retried", async ({
	page,
}) => {
	await signIn(page);
	let attempts = 0;
	await page.route("**/auth/v1/logout**", async (route) => {
		attempts += 1;
		if (attempts === 1) {
			await route.fulfill({
				status: 500,
				contentType: "application/json",
				body: JSON.stringify({ message: "Service unavailable" }),
			});
			return;
		}
		await route.fulfill({ status: 204 });
	});
	await page.getByRole("button", { name: "Sign out", exact: true }).click();
	await expect(page.getByRole("alert")).toHaveText(
		"Could not sign out. Try again."
	);
	expect(attempts).toBe(1);
	await expect(page).toHaveURL(/\/projects$/);
	await expect(
		page.getByText(administrator.email, { exact: true })
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Sign out", exact: true })
	).toBeEnabled();
	await page.getByRole("button", { name: "Sign out", exact: true }).click();
	await expect(page).toHaveURL(/\/login$/);
});

test("language selection translates Sign in and persists", async ({ page }) => {
	await page.goto("/login");
	await page.getByRole("combobox", { name: "Language" }).selectOption("zh-CN");
	await expect(page.getByRole("heading", { name: "登录" })).toBeVisible();
	await expect(page.getByRole("textbox", { name: "工作邮箱" })).toBeVisible();
	await expect(page.getByRole("button", { name: "进入控制台" })).toBeVisible();
	await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
	await page.reload();
	await expect(page.getByRole("heading", { name: "登录" })).toBeVisible();
	await expect(page.getByRole("combobox", { name: "语言" })).toHaveValue(
		"zh-CN"
	);
});

test("the language chosen at Sign in translates the Console, both pages and mobile controls", async ({
	page,
}) => {
	await interceptProvider(page);
	await page.goto("/login");
	await page
		.getByRole("textbox", { name: "Work email" })
		.fill(administrator.email);
	await page
		.getByRole("textbox", { name: "Password" })
		.fill("correct horse battery staple");
	await page.getByRole("combobox", { name: "Language" }).selectOption("zh-CN");
	await page.getByRole("button", { name: "进入控制台" }).click();
	await expect(page).toHaveURL(/\/projects$/);
	await expect(page.getByRole("combobox")).toHaveCount(0);
	const navigation = page.getByRole("navigation", { name: "控制台导航" });
	await expect(
		page.getByRole("complementary", { name: "侧边栏" })
	).toBeVisible();
	await expect(page.getByText("管理员", { exact: true })).toBeVisible();
	await expect(
		page.getByRole("heading", { level: 1, name: "项目", exact: true })
	).toBeVisible();
	await expect(
		page.getByRole("main").getByText("项目组合", { exact: true })
	).toBeVisible();
	await expect(
		page.getByRole("main").getByText("此页面尚未构建。", { exact: true })
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "退出登录", exact: true })
	).toBeVisible();
	await navigation.getByRole("link", { name: "分包商" }).click();
	await expect(
		page.getByRole("heading", { level: 1, name: "分包商" })
	).toBeVisible();
	await expect(
		page.getByRole("main").getByText("名录", { exact: true })
	).toBeVisible();
	await page.reload();
	await expect(page).toHaveURL(/\/subcontractors$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "分包商" })
	).toBeVisible();
	await page.setViewportSize({ width: 390, height: 844 });
	await page.getByRole("button", { name: "菜单", exact: true }).click();
	await expect(
		page.getByRole("button", { name: "关闭菜单", exact: true })
	).toBeVisible();
	await expect(
		page.getByRole("complementary", { name: "侧边栏" })
	).toBeFocused();
	await page.getByRole("button", { name: "关闭菜单", exact: true }).click();
	await expect(
		page.getByRole("button", { name: "菜单", exact: true })
	).toBeFocused();
});

test("the phone drawer supports toggle, Escape, backdrop and navigation with focus return", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await signIn(page);
	const toggle = page.getByRole("button", { name: "Menu", exact: true });
	const drawer = page.getByRole("complementary", {
		name: "Sidebar",
		includeHidden: true,
	});
	await expect(toggle).toHaveAttribute("aria-expanded", "false");
	await expect(drawer).toBeHidden();
	await expect(toggle).toHaveAttribute(
		"aria-controls",
		(await drawer.getAttribute("id")) ?? ""
	);
	await toggle.click();
	await expect(drawer).toBeFocused();
	await expect(drawer).toHaveAttribute("data-state", "open");
	await expect(
		page.getByRole("button", { name: "Close menu" })
	).toHaveAttribute("aria-expanded", "true");
	await page.getByRole("button", { name: "Close menu" }).click();
	await expect(drawer).toBeHidden();
	await expect(toggle).toBeFocused();

	await toggle.click();
	await page.keyboard.press("Tab");
	await expect(
		drawer.getByRole("link", { name: "Projects", exact: true })
	).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(drawer).toBeHidden();
	await expect(toggle).toBeFocused();

	await toggle.click();
	await page
		.getByTestId("console-backdrop")
		.click({ position: { x: 350, y: 400 } });
	await expect(drawer).toBeHidden();
	await expect(toggle).toBeFocused();

	await toggle.click();
	await drawer.getByRole("link", { name: "Subcontractors" }).click();
	await expect(page).toHaveURL(/\/subcontractors$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "Subcontractors" })
	).toBeVisible();
	await expect(drawer).toBeHidden();
	await expect(toggle).toBeFocused();
	await expect(page.getByRole("main")).toHaveCount(1);
	await toggle.click();
	await expect(
		drawer.getByRole("link", { name: "Subcontractors" })
	).toHaveAttribute("aria-current", "page");
});
