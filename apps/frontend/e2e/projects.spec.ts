import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import { interceptProjects, projectFixtures } from "./projects-api";

test("Projects is the active entry and lists codes and counts in name order with paging", async ({
	page,
}) => {
	await interceptProjects(page, projectFixtures().reverse());
	await signIn(page);
	await expect(
		page.getByRole("heading", { name: "Projects", exact: true })
	).toBeVisible();
	await expect(
		page.getByRole("link", { name: "Projects", exact: true })
	).toHaveAttribute("aria-current", "page");
	for (const name of ["Code", "Project", "Blocks", "Storeys", "Units"])
		await expect(
			page.getByRole("columnheader", { name, exact: true })
		).toBeVisible();
	await expect(page.getByRole("row").nth(1)).toHaveText("P01Project 01111");
	await expect(page.getByText("Page 1 of 2 · 21 projects")).toBeVisible();
	await page.getByRole("button", { name: "Next", exact: true }).click();
	await expect(page.getByText("Page 2 of 2 · 21 projects")).toBeVisible();
	await expect(
		page.getByRole("cell", { name: "Project 21", exact: true })
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Next", exact: true })
	).toBeDisabled();
	await page.getByRole("button", { name: "Previous", exact: true }).click();
	await expect(page.getByText("Page 1 of 2 · 21 projects")).toBeVisible();
});

test("search is debounced, matches name or code and resets to page one", async ({
	page,
}) => {
	await interceptProjects(
		page,
		projectFixtures().map((record, index) =>
			index === 0
				? { ...record, name: "Evergreen Gardens", code: "EG2" }
				: record
		)
	);
	await signIn(page);
	await page.getByRole("button", { name: "Next", exact: true }).click();
	await expect(page.getByText("Page 2 of 2 · 21 projects")).toBeVisible();
	const clockTime = new Date("2026-01-01T00:00:00Z");
	await page.clock.install({ time: clockTime });
	await page.clock.pauseAt(new Date(clockTime.getTime() + 1000));
	const searches: Array<string> = [];
	page.on("request", (request) => {
		const url = new URL(request.url());
		if (url.pathname === "/api/v1/projects" && url.searchParams.get("q"))
			searches.push(url.searchParams.get("q")!);
	});
	const search = page.getByRole("searchbox", { name: "Search Projects" });
	await search.fill("Ev");
	await page.clock.runFor(200);
	expect(searches).toEqual([]);
	await search.fill("  eVeRgReEn  ");
	await page.clock.runFor(200);
	expect(searches).toEqual([]);
	await page.getByRole("button", { name: "Next", exact: true }).click();
	await page.clock.runFor(101);
	await page.clock.resume();
	await expect(page.getByText("Page 1 of 1 · 1 projects")).toBeVisible();
	await expect(
		page.getByRole("cell", { name: "Evergreen Gardens", exact: true })
	).toBeVisible();
	expect(searches).toEqual(["eVeRgReEn"]);
	await search.fill(" eg2 ");
	await expect.poll(() => searches[searches.length - 1]).toBe("eg2");
	await expect(
		page.getByRole("cell", { name: "Evergreen Gardens", exact: true })
	).toBeVisible();
	await search.fill("unmatched");
	await expect(page.getByText("No projects match your search.")).toBeVisible();
	await search.fill("  ");
	await expect(page.getByText("Page 1 of 2 · 21 projects")).toBeVisible();
});

test("an empty list explains how to start", async ({ page }) => {
	await interceptProjects(page, []);
	await signIn(page);
	await expect(
		page.getByText("No projects yet. Create your first project to get started.")
	).toBeVisible();
	await expect(page.getByRole("table")).toHaveCount(0);
});

test("a delayed load shows loading and a failed load can be retried", async ({
	page,
}) => {
	await interceptProjects(page);
	let release: () => void = (): void => {};
	const waitForRelease = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route(
		"**/api/v1/projects**",
		async (route) => {
			await waitForRelease;
			await route.fulfill({
				status: 500,
				json: { error: { code: "INTERNAL_ERROR", message: "Failed" } },
			});
		},
		{ times: 1 }
	);
	await signIn(page);
	await expect(
		page.getByRole("status").filter({ hasText: "Loading projects…" })
	).toBeVisible();
	release();
	await expect(page.getByText("Projects could not be loaded.")).toBeVisible();
	await page.getByRole("button", { name: "Retry", exact: true }).click();
	await expect(page.getByRole("table")).toBeVisible();
});

test("Chinese copy distinguishes an empty list from an unmatched search", async ({
	page,
}) => {
	await interceptProjects(page, []);
	await signIn(page);
	await page.evaluate(() => localStorage.setItem("i18nextLng", "zh-CN"));
	await page.goto("/projects");
	await expect(
		page.getByText("暂无项目。创建第一个项目以开始使用。")
	).toBeVisible();
	await page.getByRole("searchbox", { name: "搜索项目" }).fill("unmatched");
	await expect(page.getByText("没有与搜索条件匹配的项目。")).toBeVisible();
});

test("the list fits a narrow screen and search is keyboard operable", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await interceptProjects(page);
	await signIn(page);
	await expect(page.getByRole("table")).toBeVisible();
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth
		)
	).toBe(true);
	await page.getByRole("searchbox", { name: "Search Projects" }).focus();
	await page.keyboard.type("P21");
	await expect(page.getByText("Page 1 of 1 · 1 projects")).toBeVisible();
});
