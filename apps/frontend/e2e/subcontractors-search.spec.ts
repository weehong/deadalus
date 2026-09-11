import { expect, test } from "@playwright/test";
import { signIn } from "./provider";
import {
	directoryFixtures,
	interceptSubcontractors,
} from "./subcontractors-api";

for (const q of ["  aLeX t  ", "9123 4567", "+65 (9123)-4567"]) {
	test(`a Member search finds their Subcontractor: ${q}`, async ({ page }) => {
		await interceptSubcontractors(page, [
			{
				id: "acme",
				name: "Acme Fitout",
				members: [{ id: "alex", name: "Alex Tan", phone: "+6591234567" }],
			},
			{
				id: "beacon",
				name: "Beacon Joinery",
				members: [{ id: "mei", name: "Mei Lim", phone: "+6592345678" }],
			},
		]);
		await signIn(page);
		await page.goto("/subcontractors");
		await page.getByRole("searchbox", { name: "Search the Directory" }).fill(q);
		await expect(
			page.getByText("Page 1 of 1 · 1 subcontractors")
		).toBeVisible();
		await expect(
			page.getByRole("cell", { name: "Acme Fitout", exact: true })
		).toBeVisible();
		await expect(page.getByText("Beacon Joinery", { exact: true })).toHaveCount(
			0
		);
	});
}

test("Chinese search distinguishes an unmatched query from an empty Directory", async ({
	page,
}) => {
	await interceptSubcontractors(page, []);
	await signIn(page);
	await page.evaluate(() => localStorage.setItem("i18nextLng", "zh-CN"));
	await page.goto("/subcontractors");
	const empty = page.getByText("暂无分包商。创建第一个分包商以开始使用。");
	await expect(empty).toBeVisible();
	await page.getByRole("searchbox", { name: "搜索名录" }).fill("unmatched");
	await expect(page.getByText("没有与搜索条件匹配的分包商。")).toBeVisible();
	await expect(empty).toHaveCount(0);
});

test("an unmatched search explains the result and clearing it restores the Directory", async ({
	page,
}) => {
	await interceptSubcontractors(page);
	await signIn(page);
	await page.goto("/subcontractors");
	const search = page.getByRole("searchbox", { name: "Search the Directory" });
	await search.fill("unmatched name");
	await expect(
		page.getByText("No subcontractors match your search.")
	).toBeVisible();
	await expect(
		page.getByText(
			"No subcontractors yet. Create your first subcontractor to get started."
		)
	).toHaveCount(0);
	await expect(page.getByRole("table")).toHaveCount(0);
	await search.fill("   ");
	await expect(page.getByText("Page 1 of 2 · 21 subcontractors")).toBeVisible();
});

test("Directory search waits for a pause, filters the name, and resets paging", async ({
	page,
}) => {
	await interceptSubcontractors(
		page,
		directoryFixtures().map((record, index) =>
			index === 0 ? { ...record, name: "Acme Fitout" } : record
		)
	);
	await signIn(page);
	await page.goto("/subcontractors");
	await page.getByRole("button", { name: "Next", exact: true }).click();
	await expect(page.getByText("Page 2 of 2 · 21 subcontractors")).toBeVisible();
	await page.clock.install();
	await page.clock.pauseAt(new Date());
	const searches: Array<string> = [];
	page.on("request", (request) => {
		const url = new URL(request.url());
		if (url.pathname === "/api/v1/subcontractors" && url.searchParams.get("q"))
			searches.push(url.searchParams.get("q")!);
	});
	const search = page.getByRole("searchbox", { name: "Search the Directory" });
	await search.fill("Ac");
	await page.clock.runFor(200);
	expect(searches).toEqual([]);
	await search.fill("  aCmE  ");
	await page.clock.runFor(200);
	expect(searches).toEqual([]);
	// Paging the old results during the pause must not carry page 2 into a new search.
	await page.getByRole("button", { name: "Next", exact: true }).click();
	await page.clock.runFor(101);
	await page.clock.resume();
	await expect(page.getByText("Page 1 of 1 · 1 subcontractors")).toBeVisible();
	await expect(
		page.getByRole("cell", { name: "Acme Fitout", exact: true })
	).toBeVisible();
	await expect(page.getByText("Subcontractor 21", { exact: true })).toHaveCount(
		0
	);
	expect(searches).toEqual(["aCmE"]);
});
