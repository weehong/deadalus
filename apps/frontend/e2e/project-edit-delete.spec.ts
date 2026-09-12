import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects } from "./projects-api";
test.beforeEach(async ({ page }) => {
	await interceptProjects(page);
	await signIn(page);
	await page.goto("/projects/project-1");
});
test("renames a Project, changes its code and updates the list", async ({
	page,
}) => {
	await page.getByRole("button", { name: "Edit project" }).click();
	await expect(page.getByLabel("Project name")).toHaveValue("Project 01");
	await page.getByLabel("Project name").fill("Emerald Gardens");
	await page.getByRole("button", { name: "Save changes" }).click();
	await expect(
		page.getByRole("heading", { name: "Emerald Gardens" })
	).toBeVisible();
	await page.getByRole("button", { name: "Edit project" }).click();
	await page.getByLabel("Project code").fill("eg2");
	await page.getByRole("button", { name: "Save changes" }).click();
	await expect(page.getByText("EG2", { exact: true })).toBeVisible();
	await page.getByRole("link", { name: "Back to Projects" }).click();
	await expect(
		page.getByRole("row", { name: /EG2 Emerald Gardens/ })
	).toBeVisible();
});
test("maps taken fields on edit and Cancel retains the saved heading", async ({
	page,
}) => {
	await page.getByRole("button", { name: "Edit project" }).click();
	await page.getByLabel("Project name").fill(" project   02 ");
	await page.getByRole("button", { name: "Save changes" }).click();
	await expect(page.getByLabel("Project name")).toHaveAccessibleDescription(
		"A project with this name already exists."
	);
	await expect(page.getByLabel("Project name")).toBeFocused();
	await page.getByLabel("Project name").fill("Project 01");
	await page.getByLabel("Project code").fill("p02");
	await page.getByRole("button", { name: "Save changes" }).click();
	await expect(page.getByLabel("Project code")).toHaveAccessibleDescription(
		"A project with this code already exists."
	);
	await expect(page.getByLabel("Project code")).toBeFocused();
	await page.getByRole("button", { name: "Cancel" }).click();
	await expect(page.getByRole("heading", { name: "Project 01" })).toBeVisible();
});
test("traps delete focus, closes on Escape, restores focus, then deletes", async ({
	page,
}) => {
	const trigger = page.getByRole("button", {
		name: "Delete project",
		exact: true,
	});
	await trigger.click();
	const dialog = page.getByRole("dialog", { name: "Delete project?" });
	await expect(dialog).toContainText(
		"Project 01 and its 1 Blocks, 1 Storeys, 1 Units, 0 Items and 0 Progress entries"
	);
	const cancel = dialog.getByRole("button", { name: "Cancel" });
	const confirm = dialog.getByRole("button", {
		name: "Delete project",
		exact: true,
	});
	await expect(cancel).toBeFocused();
	await page.keyboard.press("Shift+Tab");
	await expect(confirm).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(cancel).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(dialog).not.toBeVisible();
	await expect(trigger).toBeFocused();
	await trigger.click();
	await confirm.click();
	await expect(page).toHaveURL(/\/projects$/);
	await expect(
		page.getByRole("link", { name: "Project 01", exact: true })
	).toHaveCount(0);
	await page.goto("/projects/project-1");
	await expect(
		page.getByRole("heading", { name: "Project not found" })
	).toBeVisible();
});
test("translates edit, conflicts and deletion into Chinese", async ({
	page,
}) => {
	await page.evaluate(() => localStorage.setItem("i18nextLng", "zh-CN"));
	await page.reload();
	await page.getByRole("button", { name: "编辑项目" }).click();
	await page.getByLabel("项目名称").fill("Project 02");
	await page.getByRole("button", { name: "保存更改" }).click();
	await expect(page.getByLabel("项目名称")).toHaveAttribute(
		"aria-invalid",
		"true"
	);
	await page.getByLabel("项目名称").fill("翠园");
	await page.getByLabel("项目代码").fill("P02");
	await page.getByRole("button", { name: "保存更改" }).click();
	await expect(page.getByLabel("项目代码")).toHaveAttribute(
		"aria-invalid",
		"true"
	);
	await page.getByLabel("项目代码").fill("CY2");
	await page.getByRole("button", { name: "保存更改" }).click();
	await expect(page.getByRole("heading", { name: "翠园" })).toBeVisible();
	await page.getByRole("button", { name: "删除项目", exact: true }).click();
	await expect(page.getByRole("dialog", { name: "删除项目？" })).toContainText(
		"翠园"
	);
	await page.getByRole("button", { name: "取消" }).click();
});
