import { SignJWT } from "jose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import {
	createSigningKey,
	ISSUER,
	sign,
	stubJwks,
	type SigningKey,
} from "../helpers/supabase-jwt.js";

interface ItemRow {
	id: string;
	unitId: string;
	catalogueItemId: string;
	subcontractorId: string | null;
	assignedAt: Date | null;
	progression: number;
}
interface EntryRow {
	id: string;
	itemId: string;
	value: number;
	note: string | null;
	enteredByKind: "administrator" | "member";
	enteredById: string;
	enteredByName: string;
	subcontractorName: string | null;
	createdAt: Date;
}
let items: Array<ItemRow>;
let entries: Array<EntryRow>;
const db = {
	unit: { findFirst: vi.fn() },
	item: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
	progressEntry: { create: vi.fn(), findMany: vi.fn() },
};
// Every write records whether it ran inside the transaction, so a test can
// show the entry insert and the Progression update travelling together.
let inTransaction = false;
let writes: Array<{ op: string; inTransaction: boolean }>;
const transaction = vi.fn(async (work: (tx: typeof db) => Promise<unknown>) => {
	inTransaction = true;
	try {
		return await work(db);
	} finally {
		inTransaction = false;
	}
});
vi.mock("@/lib/prisma.js", () => ({
	prisma: { ...db, $transaction: transaction },
}));
let app: import("express").Application;
let key: SigningKey;
let token: string;
const SUBJECT = "00000000-0000-4000-8000-000000000001";
const EMAIL = "administrator@example.com";
beforeAll(async () => {
	key = await createSigningKey();
	stubJwks(key);
	token = await sign(key, { subject: SUBJECT, email: EMAIL });
	app = (await import("@/app.js")).createApp();
});
afterAll(() => vi.unstubAllGlobals());

// Project p1 holds Units u1 and u2; Project p2 holds u9. In u1, the Kitchen
// cabinet is assigned to Acme and the Sink has no Assignment.
const unitsOf: Record<string, Array<string>> = { p1: ["u1", "u2"], p2: ["u9"] };
const projectOfUnit = (unitId: string): string | undefined =>
	Object.keys(unitsOf).find((projectId) =>
		unitsOf[projectId]!.includes(unitId)
	);
const catalogue: Record<string, { name: string; nameKey: string }> = {
	cabinet: { name: "Kitchen cabinet", nameKey: "kitchen cabinet" },
	sink: { name: "Sink", nameKey: "sink" },
	wardrobe: { name: "Wardrobe", nameKey: "wardrobe" },
};
const directory: Record<string, { id: string; name: string }> = {
	acme: { id: "acme", name: "Acme Fitout" },
};
const BASE = Date.parse("2026-09-10T12:00:00Z");
let clock: number;
const seedEntry = (
	itemId: string,
	value: number,
	overrides: Partial<EntryRow> = {}
): EntryRow => {
	clock += 1;
	const entry: EntryRow = {
		id: `e${String(clock)}`,
		itemId,
		value,
		note: null,
		enteredByKind: "administrator",
		enteredById: SUBJECT,
		enteredByName: EMAIL,
		subcontractorName: null,
		createdAt: new Date(BASE + clock * 60_000),
		...overrides,
	};
	entries.push(entry);
	return entry;
};
const newestFirst = (rows: Array<EntryRow>): Array<EntryRow> =>
	[...rows].sort(
		(a, b) =>
			b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id)
	);
interface ItemWhere {
	id?: string;
	unitId?: string;
	unit?: { storey: { block: { projectId: string } } };
}
const matches = (item: ItemRow, where: ItemWhere): boolean =>
	(where.id === undefined || item.id === where.id) &&
	(where.unitId === undefined || item.unitId === where.unitId) &&
	(where.unit === undefined ||
		projectOfUnit(item.unitId) === where.unit.storey.block.projectId);
beforeEach(() => {
	vi.clearAllMocks();
	clock = 0;
	writes = [];
	entries = [];
	items = [
		{
			id: "u1-cabinet",
			unitId: "u1",
			catalogueItemId: "cabinet",
			subcontractorId: "acme",
			assignedAt: new Date("2026-09-01T00:00:00Z"),
			progression: 40,
		},
		{
			id: "u1-sink",
			unitId: "u1",
			catalogueItemId: "sink",
			subcontractorId: null,
			assignedAt: null,
			progression: 0,
		},
		{
			id: "u9-wardrobe",
			unitId: "u9",
			catalogueItemId: "wardrobe",
			subcontractorId: "acme",
			assignedAt: new Date("2026-09-01T00:00:00Z"),
			progression: 10,
		},
	];
	db.unit.findFirst.mockImplementation(
		async ({
			where,
		}: {
			where: { id: string; storey: { block: { projectId: string } } };
		}) =>
			projectOfUnit(where.id) === where.storey.block.projectId
				? { id: where.id }
				: null
	);
	db.item.findFirst.mockImplementation(
		async ({ where }: { where: ItemWhere }) =>
			items.find((item) => matches(item, where)) ?? null
	);
	// The Unit's Items read: name-key order and, when asked, the latest entry only.
	db.item.findMany.mockImplementation(
		async ({
			where,
			select,
		}: {
			where: ItemWhere;
			select: { entries?: { take?: number } };
		}) =>
			items
				.filter((item) => matches(item, where))
				.sort(
					(a, b) =>
						catalogue[a.catalogueItemId]!.nameKey.localeCompare(
							catalogue[b.catalogueItemId]!.nameKey
						) || a.id.localeCompare(b.id)
				)
				.map((item) => ({
					...item,
					catalogueItem: { name: catalogue[item.catalogueItemId]!.name },
					subcontractor: item.subcontractorId
						? directory[item.subcontractorId]
						: null,
					...(select.entries
						? {
								entries: newestFirst(
									entries.filter((entry) => entry.itemId === item.id)
								)
									.slice(0, select.entries.take ?? undefined)
									.map(({ value, note, enteredByName, createdAt }) => ({
										value,
										note,
										enteredByName,
										createdAt,
									})),
							}
						: {}),
				}))
	);
	db.item.update.mockImplementation(
		async ({
			where,
			data,
		}: {
			where: { id: string };
			data: Partial<ItemRow>;
		}) => {
			writes.push({ op: "item.update", inTransaction });
			const item = items.find((entry) => entry.id === where.id);
			if (!item) throw new Error("P2025");
			Object.assign(item, data);
			return item;
		}
	);
	db.progressEntry.create.mockImplementation(
		async ({ data }: { data: Omit<EntryRow, "id" | "createdAt"> }) => {
			writes.push({ op: "progressEntry.create", inTransaction });
			return seedEntry(data.itemId, data.value, { ...data });
		}
	);
	db.progressEntry.findMany.mockImplementation(
		async ({ where }: { where: { itemId: string } }) =>
			newestFirst(entries.filter((entry) => entry.itemId === where.itemId))
	);
});
const enter = (itemId: string, body: object, projectId = "p1"): request.Test =>
	request(app)
		.post(`/api/v1/projects/${projectId}/items/${itemId}/entries`)
		.set("Authorization", `Bearer ${token}`)
		.send(body);
const history = (itemId: string, projectId = "p1"): request.Test =>
	request(app)
		.get(`/api/v1/projects/${projectId}/items/${itemId}/entries`)
		.set("Authorization", `Bearer ${token}`);
const progressionOf = (itemId: string): number =>
	items.find((item) => item.id === itemId)!.progression;

it("enters progress on an assigned Item: the entry insert and the Progression update run in one transaction, and the Unit's Items come back with the latest entry", async () => {
	const response = await enter("u1-cabinet", {
		value: 75,
		note: "  Doors hung  ",
	});
	expect(response.status).toBe(201);
	expect(transaction).toHaveBeenCalledOnce();
	expect(writes).toEqual([
		{ op: "progressEntry.create", inTransaction: true },
		{ op: "item.update", inTransaction: true },
	]);
	expect(db.progressEntry.create).toHaveBeenCalledWith({
		data: {
			itemId: "u1-cabinet",
			value: 75,
			note: "Doors hung",
			enteredByKind: "administrator",
			enteredById: SUBJECT,
			enteredByName: EMAIL,
		},
	});
	expect(db.item.update).toHaveBeenCalledWith({
		where: { id: "u1-cabinet" },
		data: { progression: 75 },
	});
	expect(progressionOf("u1-cabinet")).toBe(75);
	expect(response.body).toEqual({
		data: [
			{
				id: "u1-cabinet",
				catalogueItemId: "cabinet",
				name: "Kitchen cabinet",
				subcontractor: { id: "acme", name: "Acme Fitout" },
				assignedAt: "2026-09-01T00:00:00.000Z",
				progression: 75,
				latestEntry: {
					value: 75,
					note: "Doors hung",
					enteredByName: EMAIL,
					createdAt: "2026-09-10T12:01:00.000Z",
				},
			},
			{
				id: "u1-sink",
				catalogueItemId: "sink",
				name: "Sink",
				subcontractor: null,
				assignedAt: null,
				progression: 0,
				latestEntry: null,
			},
		],
	});
});
it("accepts a later entry lower than the previous one, without a note", async () => {
	seedEntry("u1-cabinet", 75, { note: "Doors hung" });
	items[0]!.progression = 75;
	const response = await enter("u1-cabinet", { value: 30 });
	expect(response.status).toBe(201);
	expect(progressionOf("u1-cabinet")).toBe(30);
	expect(db.progressEntry.create).toHaveBeenCalledWith({
		data: expect.objectContaining({ value: 30, note: null }),
	});
	expect(response.body.data[0]).toMatchObject({
		progression: 30,
		latestEntry: { value: 30, note: null, enteredByName: EMAIL },
	});
});
it("names the author by the token's subject when it carries no email", async () => {
	const bare = await new SignJWT({ role: "authenticated" })
		.setProtectedHeader({ alg: "ES256", kid: key.kid })
		.setSubject("subject-without-email")
		.setIssuer(ISSUER)
		.setAudience("authenticated")
		.setIssuedAt()
		.setExpirationTime("1h")
		.sign(key.privateKey);
	const response = await request(app)
		.post("/api/v1/projects/p1/items/u1-cabinet/entries")
		.set("Authorization", `Bearer ${bare}`)
		.send({ value: 50 });
	expect(response.status).toBe(201);
	expect(db.progressEntry.create).toHaveBeenCalledWith({
		data: expect.objectContaining({
			enteredById: "subject-without-email",
			enteredByName: "subject-without-email",
		}),
	});
	expect(response.body.data[0].latestEntry.enteredByName).toBe(
		"subject-without-email"
	);
});
it.each([
	{},
	{ value: 50.5 },
	{ value: -1 },
	{ value: 101 },
	{ value: "50" },
	{ value: null },
	{ value: 50, note: "x".repeat(201) },
	{ value: 50, note: "" },
	{ value: 50, note: 7 },
])(
	"rejects a malformed entry with 400 and no transaction: %j",
	async (body) => {
		const response = await enter("u1-cabinet", body);
		expect(response.status).toBe(400);
		expect(transaction).not.toHaveBeenCalled();
		expect(progressionOf("u1-cabinet")).toBe(40);
	}
);
it("refuses an Item with no Assignment with 409 ITEM_UNASSIGNED and writes nothing", async () => {
	const response = await enter("u1-sink", { value: 10 });
	expect(response.status).toBe(409);
	expect(response.body.error.code).toBe("ITEM_UNASSIGNED");
	expect(db.progressEntry.create).not.toHaveBeenCalled();
	expect(db.item.update).not.toHaveBeenCalled();
	expect(progressionOf("u1-sink")).toBe(0);
});
it("answers 404 for an Item of another Project, an unknown Item or an unknown Project, writing nothing", async () => {
	expect((await enter("u9-wardrobe", { value: 50 })).status).toBe(404);
	expect((await enter("u1-cabinet", { value: 50 }, "p2")).status).toBe(404);
	expect((await enter("missing", { value: 50 })).status).toBe(404);
	expect((await enter("u1-cabinet", { value: 50 }, "missing")).status).toBe(
		404
	);
	expect(db.progressEntry.create).not.toHaveBeenCalled();
	expect(db.item.update).not.toHaveBeenCalled();
});
it("requires a verified Session on both routes", async () => {
	expect(
		(
			await request(app)
				.post("/api/v1/projects/p1/items/u1-cabinet/entries")
				.send({ value: 50 })
		).status
	).toBe(401);
	expect(
		(await request(app).get("/api/v1/projects/p1/items/u1-cabinet/entries"))
			.status
	).toBe(401);
});

it("lists the history newest first with every field", async () => {
	seedEntry("u1-cabinet", 20, { note: "Carcass in" });
	seedEntry("u1-cabinet", 55, {
		enteredByKind: "member",
		enteredById: "m1",
		enteredByName: "Alex",
		subcontractorName: "Acme Fitout",
	});
	seedEntry("u1-cabinet", 40, { note: "Doors rehung" });
	seedEntry("u1-sink", 0);
	const response = await history("u1-cabinet");
	expect(response.status).toBe(200);
	expect(response.body).toEqual({
		data: [
			{
				id: "e3",
				value: 40,
				note: "Doors rehung",
				enteredByKind: "administrator",
				enteredByName: EMAIL,
				subcontractorName: null,
				createdAt: "2026-09-10T12:03:00.000Z",
			},
			{
				id: "e2",
				value: 55,
				note: null,
				enteredByKind: "member",
				enteredByName: "Alex",
				subcontractorName: "Acme Fitout",
				createdAt: "2026-09-10T12:02:00.000Z",
			},
			{
				id: "e1",
				value: 20,
				note: "Carcass in",
				enteredByKind: "administrator",
				enteredByName: EMAIL,
				subcontractorName: null,
				createdAt: "2026-09-10T12:01:00.000Z",
			},
		],
	});
	expect(db.progressEntry.findMany).toHaveBeenCalledWith(
		expect.objectContaining({
			where: { itemId: "u1-cabinet" },
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		})
	);
});
it("answers an empty history for an Item with no entries and 404 outside the Project", async () => {
	const empty = await history("u1-sink");
	expect(empty.status).toBe(200);
	expect(empty.body).toEqual({ data: [] });
	expect((await history("u9-wardrobe")).status).toBe(404);
	expect((await history("u1-cabinet", "p2")).status).toBe(404);
	expect((await history("missing")).status).toBe(404);
	expect(db.progressEntry.findMany).toHaveBeenCalledOnce();
});

it("documents both routes and the latest entry on the Unit's Items", async () => {
	const response = await request(app).get("/openapi.json");
	const path =
		response.body.paths["/api/v1/projects/{id}/items/{itemId}/entries"];
	expect(path?.post).toBeDefined();
	expect(path.post.security).toEqual([{ bearerAuth: [] }]);
	for (const code of [201, 400, 401, 404, 409])
		expect(path.post.responses).toHaveProperty(String(code));
	expect(path.post.responses["409"].description).toContain("ITEM_UNASSIGNED");
	expect(path?.get).toBeDefined();
	for (const code of [200, 401, 404])
		expect(path.get.responses).toHaveProperty(String(code));
	const entry = response.body.components.schemas.ProgressEntry;
	for (const property of [
		"id",
		"value",
		"note",
		"enteredByKind",
		"enteredByName",
		"subcontractorName",
		"createdAt",
	])
		expect(entry.properties).toHaveProperty(property);
	expect(response.body.components.schemas.UnitItem.properties).toHaveProperty(
		"latestEntry"
	);
});
