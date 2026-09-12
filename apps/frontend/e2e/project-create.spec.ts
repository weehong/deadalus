import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects, projectFixtures } from "./projects-api";

test("creates a Project from the header and lands on its screen", async ({
	page,
}) => {
	await interceptProjects(page, []);
	await signIn(page);
	await page.getByRole("link", { name: "New project", exact: true }).click();
	await expect(page).toHaveURL(/\/projects\/new$/);
	await expect(
		page.getByRole("link", { name: "Projects", exact: true })
	).toHaveAttribute("aria-current", "page");
	await page.getByLabel("Project name").fill(" Emerald Gardens ");
	await page.getByLabel("Project code").fill(" eg-2 ");
	await expect(page.getByLabel("Project code")).toHaveValue(" EG-2 ");
	const sent = page.waitForRequest(
		(request) =>
			request.method() === "POST" && request.url().endsWith("/api/v1/projects")
	);
	await page.getByRole("button", { name: "Create project" }).click();
	expect((await sent).postDataJSON()).toEqual({
		name: "Emerald Gardens",
		code: "EG-2",
	});
	await expect(page).toHaveURL(/\/projects\/project-[\da-f-]+\/?$/);
	await expect(
		page.getByRole("heading", { name: "Emerald Gardens" })
	).toBeVisible();
	await page.getByRole("link", { name: "Back to Projects" }).click();
	await expect(
		page.getByRole("link", { name: "Emerald Gardens" })
	).toBeVisible();
});

test("requires both fields and rejects bad codes before sending", async ({
	page,
}) => {
	await interceptProjects(page, []);
	await signIn(page);
	await page.goto("/projects/new");
	let submitted = false;
	page.on("request", (request) => {
		if (
			request.method() === "POST" &&
			request.url().endsWith("/api/v1/projects")
		)
			submitted = true;
	});
	await page.getByRole("button", { name: "Create project" }).click();
	await expect(page.getByLabel("Project name")).toHaveAccessibleDescription(
		"Project name is required"
	);
	await expect(page.getByLabel("Project code")).toHaveAccessibleDescription(
		"Project code is required"
	);
	await page.getByLabel("Project name").fill("Emerald");
	await page.getByLabel("Project code").fill("EG_2");
	await page.getByRole("button", { name: "Create project" }).click();
	await expect(page.getByLabel("Project code")).toHaveAccessibleDescription(
		"Use 2 to 12 letters, digits or hyphens"
	);
	expect(submitted).toBe(false);
	await page.getByRole("button", { name: "Cancel" }).click();
	await expect(page).toHaveURL(/\/projects$/);
});

test("maps taken names and codes to associated field errors", async ({
	page,
}) => {
	await interceptProjects(page, projectFixtures());
	await signIn(page);
	await page.goto("/projects/new");
	await page.getByLabel("Project name").fill(" project   01 ");
	await page.getByLabel("Project code").fill("NEW");
	await page.getByRole("button", { name: "Create project" }).click();
	await expect(page.getByLabel("Project name")).toHaveAccessibleDescription(
		"A project with this name already exists."
	);
	await page.getByLabel("Project name").fill("Emerald Gardens");
	await page.getByLabel("Project code").fill(" p01 ");
	await page.getByRole("button", { name: "Create project" }).click();
	await expect(page.getByLabel("Project code")).toHaveAccessibleDescription(
		"A project with this code already exists."
	);
	await expect(page.getByLabel("Project code")).toBeFocused();
});

test("shows a busy state and retains input after a server failure", async ({
	page,
}) => {
	await interceptProjects(page, []);
	await signIn(page);
	await page.goto("/projects/new");
	let release: () => void = () => undefined;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route(
		"**/api/v1/projects",
		async (route) => {
			if (route.request().method() !== "POST") {
				await route.fallback();
				return;
			}
			await gate;
			await route.fulfill({
				status: 503,
				json: { error: { code: "UNAVAILABLE", message: "Unavailable" } },
			});
		},
		{ times: 1 }
	);
	await page.getByLabel("Project name").fill("Emerald Gardens");
	await page.getByLabel("Project code").fill("EG2");
	await page.getByRole("button", { name: "Create project" }).click();
	await expect(page.getByRole("button", { name: "Creating…" })).toBeDisabled();
	release();
	await expect(page.getByRole("alert")).toHaveText(
		"Could not create the project. Please try again."
	);
	await expect(page.getByLabel("Project name")).toHaveValue("Emerald Gardens");
	await expect(page.getByLabel("Project code")).toHaveValue("EG2");
	await page.getByRole("button", { name: "Create project" }).click();
	await expect(
		page.getByRole("heading", { name: "Emerald Gardens" })
	).toBeVisible();
});

test("guards the creation route", async ({ page }) => {
	await page.goto("/projects/new");
	await expect(page).toHaveURL(/\/login$/);
});

test("translates creation and validation into Chinese", async ({ page }) => {
	await interceptProjects(page, []);
	await signIn(page);
	await page.evaluate(() => {
		localStorage.setItem("i18nextLng", "zh-CN");
	});
	await page.goto("/projects/new");
	await expect(page.getByRole("heading", { name: "新建项目" })).toBeVisible();
	await page.getByRole("button", { name: "创建项目" }).click();
	await expect(page.getByLabel("项目名称")).toHaveAccessibleDescription(
		"请输入项目名称"
	);
	await expect(page.getByLabel("项目代码")).toHaveAccessibleDescription(
		"请输入项目代码"
	);
	await page.getByLabel("项目名称").fill("翠园");
	await page.getByLabel("项目代码").fill("CY2");
	await page.getByRole("button", { name: "创建项目" }).click();
	await expect(page.getByRole("heading", { name: "翠园" })).toBeVisible();
});
