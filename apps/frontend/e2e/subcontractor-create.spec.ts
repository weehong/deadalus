import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import { interceptSubcontractors } from "./subcontractors-api";

test("creates a Subcontractor with the typed phone, lands on its screen and refreshes the Directory", async ({
	page,
}) => {
	await interceptSubcontractors(page, []);
	await signIn(page);
	await page.getByRole("link", { name: "Subcontractors", exact: true }).click();
	await page.getByRole("link", { name: "New subcontractor" }).click();
	await expect(page).toHaveURL(/\/subcontractors\/new$/);
	await expect(
		page.getByRole("heading", { name: "New subcontractor" })
	).toBeVisible();
	await expect(
		page.getByRole("link", { name: "Subcontractors", exact: true })
	).toHaveAttribute("aria-current", "page");
	await page.getByLabel("Subcontractor name").fill(" Acme Fitout ");
	await page.getByLabel("Member name").fill(" Alex Tan ");
	await page.getByLabel("Phone number").fill(" 9123 4567 ");
	const sent = page.waitForRequest(
		(request) =>
			request.method() === "POST" &&
			request.url().endsWith("/api/v1/subcontractors")
	);
	await page.getByRole("button", { name: "Create subcontractor" }).click();
	expect((await sent).postDataJSON()).toEqual({
		name: "Acme Fitout",
		member: { name: "Alex Tan", phone: "9123 4567" },
	});
	await expect(
		page.getByRole("heading", { name: "Acme Fitout" })
	).toBeVisible();
	await expect(page.getByRole("table", { name: "Members" })).toContainText(
		"Alex Tan+6591234567"
	);
	await page.getByRole("link", { name: "Back to Directory" }).click();
	await expect(page.getByRole("link", { name: "Acme Fitout" })).toBeVisible();
});

test("requires every field and rejects a bad phone before sending", async ({
	page,
}) => {
	await interceptSubcontractors(page, []);
	await signIn(page);
	await page.goto("/subcontractors/new");
	let submitted = false;
	page.on("request", (request) => {
		if (
			request.method() === "POST" &&
			request.url().endsWith("/api/v1/subcontractors")
		)
			submitted = true;
	});
	await page.getByRole("button", { name: "Create subcontractor" }).click();
	await expect(
		page.getByLabel("Subcontractor name")
	).toHaveAccessibleDescription("Subcontractor name is required");
	await expect(page.getByLabel("Member name")).toHaveAccessibleDescription(
		"Member name is required"
	);
	await expect(page.getByLabel("Phone number")).toHaveAccessibleDescription(
		"Phone number is required"
	);
	await page.getByLabel("Subcontractor name").fill("Acme");
	await page.getByLabel("Member name").fill("Alex");
	await page.getByLabel("Phone number").fill("123");
	await page.getByRole("button", { name: "Create subcontractor" }).click();
	await expect(page.getByLabel("Phone number")).toHaveAccessibleDescription(
		"Enter a valid phone number"
	);
	expect(submitted).toBe(false);
	await page.getByRole("button", { name: "Cancel" }).click();
	await expect(page).toHaveURL(/\/subcontractors$/);
});

test("maps taken names and normalized phones to their fields, naming the clashing Subcontractor", async ({
	page,
}) => {
	await interceptSubcontractors(page, [
		{
			id: "acme",
			name: "Acme Fitout",
			members: [{ id: "alex", name: "Alex", phone: "+6591234567" }],
		},
	]);
	await signIn(page);
	await page.goto("/subcontractors/new");
	await page.getByLabel("Subcontractor name").fill(" aCME   FITOUT ");
	await page.getByLabel("Member name").fill("Mei");
	await page.getByLabel("Phone number").fill("9234 5678");
	await page.getByRole("button", { name: "Create subcontractor" }).click();
	await expect(
		page.getByLabel("Subcontractor name")
	).toHaveAccessibleDescription(
		"A subcontractor with this name already exists."
	);
	await page.getByLabel("Subcontractor name").fill("Beacon Joinery");
	await page.getByLabel("Phone number").fill("0065 (9123)-4567");
	await page.getByRole("button", { name: "Create subcontractor" }).click();
	await expect(page.getByLabel("Phone number")).toHaveAccessibleDescription(
		"This phone number belongs to a Member of Acme Fitout."
	);
	await expect(page.getByLabel("Phone number")).toBeFocused();
	await page.getByLabel("Phone number").fill("9234 5678");
	await page.getByRole("button", { name: "Create subcontractor" }).click();
	await expect(
		page.getByRole("heading", { name: "Beacon Joinery" })
	).toBeVisible();
});

test("shows busy and server failure states, retains input and allows retry", async ({
	page,
}) => {
	await interceptSubcontractors(page, []);
	let release: () => void = () => undefined;
	const gate = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route(
		"**/api/v1/subcontractors",
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
	await signIn(page);
	await page.goto("/subcontractors/new");
	await page.getByLabel("Subcontractor name").fill("Acme Fitout");
	await page.getByLabel("Member name").fill("Alex");
	await page.getByLabel("Phone number").fill("9123 4567");
	await page.getByRole("button", { name: "Create subcontractor" }).click();
	await expect(page.getByRole("button", { name: "Creating…" })).toBeDisabled();
	await expect(page.getByRole("button", { name: "Creating…" })).toHaveAttribute(
		"aria-busy",
		"true"
	);
	release();
	await expect(page.getByRole("alert")).toHaveText(
		"Could not create the subcontractor. Please try again."
	);
	await expect(page.getByLabel("Subcontractor name")).toHaveValue(
		"Acme Fitout"
	);
	await expect(page.getByLabel("Member name")).toHaveValue("Alex");
	await expect(page.getByLabel("Phone number")).toHaveValue("9123 4567");
	await page.getByRole("button", { name: "Create subcontractor" }).click();
	await expect(
		page.getByRole("heading", { name: "Acme Fitout" })
	).toBeVisible();
});

test("the creation route is guarded", async ({ page }) => {
	await page.goto("/subcontractors/new");
	await expect(page).toHaveURL(/\/login$/);
});

test("shows translated creation fields and validation", async ({ page }) => {
	await interceptSubcontractors(page, []);
	await signIn(page);
	await page.evaluate(() => {
		localStorage.setItem("i18nextLng", "zh-CN");
	});
	await page.goto("/subcontractors/new");
	await expect(page.getByRole("heading", { name: "新建分包商" })).toBeVisible();
	await expect(page.getByText("首位成员")).toBeVisible();
	await page.getByRole("button", { name: "创建分包商" }).click();
	await expect(page.getByLabel("分包商名称")).toHaveAccessibleDescription(
		"请输入分包商名称"
	);
	await expect(page.getByLabel("成员姓名")).toHaveAccessibleDescription(
		"请输入成员姓名"
	);
	await expect(page.getByLabel("电话号码")).toHaveAccessibleDescription(
		"请输入电话号码"
	);
	await page.getByRole("button", { name: "取消" }).click();
	await expect(page).toHaveURL(/\/subcontractors$/);
});
