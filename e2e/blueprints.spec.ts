/* eslint-disable camelcase -- fixtures intentionally mirror provider rows */
import { expect, test, type Page, type Route } from "@playwright/test";

const base = {
	created_at: "2026-01-01T00:00:00Z",
	updated_at: "2026-01-01T00:00:00Z",
};
const database: Record<string, Array<Record<string, unknown>>> = {
	sites: [
		{ ...base, id: "site-1", name: "Harbourline Tower", description: null },
	],
	storeys: [
		{
			...base,
			id: "storey-1",
			site_id: "site-1",
			name: "Ground",
			number: 0,
			level_from: 0,
			level_to: 4,
			structural_note: null,
		},
	],
	floor_plans: [
		{
			...base,
			id: "plan-1",
			site_id: "site-1",
			storey_id: "storey-1",
			name: "Ground plan",
			code: "A-G-01",
			slab_level: 0,
			gross_area: 400,
			structural_grid: "A-D",
			source_drawing_id: null,
		},
	],
	units: [
		{
			...base,
			id: "unit-1",
			site_id: "site-1",
			floor_plan_id: "plan-1",
			code: "G-01",
			room_tags: ["G01"],
			usable_area: 80,
			ceiling_height: 2.8,
			entry_door: "D1",
			boundary_note: null,
			boundary_type: "wall",
			grid_reference: "A1",
			status: "occupied",
		},
	],
	installations: [],
	drawings: [],
	subcontractors: [
		{
			...base,
			id: "sub-1",
			site_id: "site-1",
			company_name: "Northstar MEP",
			trade: "Mechanical",
			contact_person: null,
			phone: null,
			email: null,
			contract_reference: null,
			default_scope_codes: ["C"],
		},
	],
	scope_assignments: [],
};

const json = (route: Route, body: unknown, status = 200) =>
	route.fulfill({
		body: JSON.stringify(body),
		contentType: "application/json",
		status,
	});
const installProvider = async (page: Page) => {
	await page.route("**/auth/v1/**", (route) =>
		json(
			route,
			route.request().url().endsWith("/user")
				? {
						id: "admin-1",
						email: "admin@example.com",
						aud: "authenticated",
						role: "authenticated",
					}
				: {
						access_token: "header.payload.signature",
						refresh_token: "refresh",
						expires_in: 3600,
						user: { id: "admin-1", email: "admin@example.com" },
					}
		)
	);
	await page.route("**/rest/v1/**", async (route) => {
		const request = route.request();
		const segments = new URL(request.url()).pathname.split("/");
		const table = segments[segments.length - 1] ?? "";
		const rows = database[table] ?? [];
		if (request.method() === "GET") {
			const id = new URL(request.url()).searchParams
				.get("id")
				?.replace("eq.", "");
			return json(route, id ? rows.filter((row) => row["id"] === id) : rows);
		}
		if (request.method() === "POST") {
			const payload = request.postDataJSON() as Record<string, unknown>;
			const row = { ...base, id: `${table}-${rows.length + 1}`, ...payload };
			rows.push(row);
			return json(route, [row], 201);
		}
		if (request.method() === "PATCH") {
			const payload = request.postDataJSON() as Record<string, unknown>;
			const id = new URL(request.url()).searchParams
				.get("id")
				?.replace("eq.", "");
			const row = rows.find((item) => item["id"] === id);
			if (row) Object.assign(row, payload);
			return json(route, row ? [row] : []);
		}
		if (request.method() === "DELETE") {
			const id = new URL(request.url()).searchParams
				.get("id")
				?.replace("eq.", "");
			const index = rows.findIndex((item) => item["id"] === id);
			if (index >= 0) rows.splice(index, 1);
			return json(route, null, 204);
		}
		return route.fallback();
	});
};

const signIn = async (page: Page) => {
	await installProvider(page);
	await page.goto("/sign-in");
	await page
		.getByRole("textbox", { name: "Work email" })
		.fill("admin@example.com");
	await page.getByLabel("Password").fill("correct horse battery staple");
	await page.getByRole("button", { name: "Sign in" }).click();
};

const screens = [
	["Upload drawings", "/blueprints/upload"],
	["Building structure", "/blueprints/structure"],
	["Units", "/blueprints/units"],
	["Subcontractors", "/blueprints/subcontractors"],
] as const;

test.describe("Blueprint navigation", () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page);
		await page.goto("/blueprints/structure");
	});

	test("shows the section and loads every Blueprint screen", async ({
		page,
	}) => {
		await expect(
			page.getByRole("link", { name: "Blueprints" })
		).toHaveAttribute("aria-expanded", "true");
		for (const [name, path] of screens) {
			await page.getByRole("link", { name, exact: true }).click();
			await expect(page).toHaveURL(path);
			await expect(
				page.getByRole("heading", { name, exact: true })
			).toBeVisible();
		}
	});
});

test.describe("Blueprint data workflows", () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page);
	});

	test("renders seeded structure and preserves its selected plan on reload", async ({
		page,
	}) => {
		await page.goto("/blueprints/structure");
		await expect(
			page.getByRole("heading", { name: "Building structure" })
		).toBeVisible();
		await expect(page.getByText("Harbourline Tower")).toBeVisible();
		await page.getByRole("button", { name: /Floor plan Ground plan/ }).click();
		await expect(page).toHaveURL(/kind=floor-plan/);
		await expect(page).toHaveURL(/id=plan-1/);
		await page.reload();
		await expect(
			page.getByRole("heading", { name: "Ground plan" })
		).toBeVisible();
	});

	test("creates a storey through the REST boundary and refreshes the tree", async ({
		page,
	}) => {
		await page.goto("/blueprints/structure");
		await page.getByRole("button", { name: "New storey" }).click();
		await page.getByRole("textbox", { name: "Name" }).fill("Mezzanine");
		await page.getByRole("spinbutton", { name: "Storey number" }).fill("1");
		await page.getByRole("spinbutton", { name: "Level from" }).fill("4");
		await page.getByRole("spinbutton", { name: "Level to" }).fill("7");
		const insert = page.waitForRequest(
			(request) =>
				request.method() === "POST" &&
				request.url().includes("/rest/v1/storeys")
		);
		await page.getByRole("button", { name: "Save" }).click();
		expect((await insert).postDataJSON()).toMatchObject({
			name: "Mezzanine",
			site_id: "site-1",
		});
		await expect(page.getByText("Mezzanine")).toBeVisible();
	});

	test("edits a storey through the REST boundary", async ({ page }) => {
		await page.goto("/blueprints/structure");
		await page.getByRole("button", { name: "Edit", exact: true }).click();
		const name = page.getByRole("textbox", { name: "Name" });
		await expect(name).toHaveValue("Ground");
		await name.fill("Ground level");
		const update = page.waitForRequest(
			(request) =>
				request.method() === "PATCH" &&
				request.url().includes("/rest/v1/storeys")
		);
		await page.getByRole("button", { name: "Save" }).click();
		expect((await update).postDataJSON()).toMatchObject({
			name: "Ground level",
		});
		await expect(page.getByText("Ground level")).toBeVisible();
	});

	test("blocks deleting a storey that contains floor plans", async ({
		page,
	}) => {
		await page.goto("/blueprints/structure");
		await page.getByRole("button", { name: "Delete", exact: true }).click();
		const dialog = page.getByRole("dialog", { name: "Delete item" });
		await expect(
			dialog.getByText("Delete its floor plans first.")
		).toBeVisible();
		await expect(dialog.getByRole("button", { name: "Delete" })).toBeDisabled();
	});

	test("opens a unit and inserts an installation", async ({ page }) => {
		await page.goto("/blueprints/structure");
		await page.getByRole("button", { name: /Floor plan Ground plan/ }).click();
		await page.getByRole("button", { name: "Open G-01" }).click();
		await expect(page).toHaveURL(/\/blueprints\/units\/unit-1$/);
		await page.getByRole("button", { name: "Install equipment" }).click();
		await page
			.getByRole("textbox", { name: "Equipment" })
			.fill("Air handling unit");
		await page.getByRole("textbox", { name: "Asset tag" }).fill("AHU-001");
		const insert = page.waitForRequest(
			(request) =>
				request.method() === "POST" &&
				request.url().includes("/rest/v1/installations")
		);
		await page.getByRole("button", { name: "Save" }).click();
		expect((await insert).postDataJSON()).toMatchObject({
			asset_tag: "AHU-001",
			unit_id: "unit-1",
		});
		await expect(page.getByText("AHU-001")).toBeVisible();
	});

	test("persists and removes a subcontractor scope assignment and updates coverage", async ({
		page,
	}) => {
		await page.goto("/blueprints/subcontractors");
		const checkbox = page.getByRole("checkbox", { name: "Scope A" });
		const insert = page.waitForRequest(
			(request) =>
				request.method() === "POST" &&
				request.url().includes("/rest/v1/scope_assignments")
		);
		await checkbox.check();
		await insert;
		await expect(page.getByText("Covered").locator("+ dd")).toHaveText("1");
		const deletion = page.waitForRequest(
			(request) =>
				request.method() === "DELETE" &&
				request.url().includes("/rest/v1/scope_assignments")
		);
		await checkbox.uncheck();
		await deletion;
		await expect(page.getByText("Covered").locator("+ dd")).toHaveText("0");
		await expect(page.getByText("Unassigned").locator("+ dd")).toHaveText("6");
	});
});

test("uploads a drawing through TUS then records it through REST", async ({
	page,
}) => {
	await signIn(page);
	const tusMethods: Array<string> = [];
	await page.route("**/storage/v1/upload/resumable**", async (route) => {
		const method = route.request().method();
		tusMethods.push(method);
		if (method === "POST")
			return route.fulfill({
				status: 201,
				headers: {
					location:
						"http://localhost:4173/storage/v1/upload/resumable/upload-1",
					"tus-resumable": "1.0.0",
				},
			});
		if (method === "PATCH")
			return route.fulfill({
				status: 204,
				headers: { "upload-offset": "7", "tus-resumable": "1.0.0" },
			});
		return route.fulfill({
			status: 204,
			headers: { "upload-offset": "0", "tus-resumable": "1.0.0" },
		});
	});
	await page.goto("/blueprints/upload");
	const insert = page.waitForRequest(
		(request) =>
			request.method() === "POST" && request.url().includes("/rest/v1/drawings")
	);
	await page
		.locator('input[type="file"]')
		.first()
		.setInputFiles({
			name: "A-101 rev B.pdf",
			mimeType: "application/pdf",
			buffer: Buffer.from("drawing"),
		});
	expect((await insert).postDataJSON()).toMatchObject({
		discipline: "Architectural",
		revision: "B",
		site_id: "site-1",
		status: "uploaded",
	});
	await expect(page.getByText("Uploaded", { exact: true })).toBeVisible();
	expect(tusMethods).toContain("POST");
	expect(tusMethods).toContain("PATCH");
});
