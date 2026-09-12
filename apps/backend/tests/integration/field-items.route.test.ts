import { SignJWT } from "jose";
import request from "supertest";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";

// The Field's Unit screen over HTTP with Prisma faked at the boundary: the
// Unit's Items, a Member's Progress entry and an Item's history. The fakes
// honour the Subcontractor scope each query sends, so a read or write that
// forgot to filter would reach another company's Items here.

interface MemberRecord {
	id: string;
	name: string;
	subcontractor: { id: string; name: string };
}
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
interface UnitRecord {
	id: string;
	name: string;
	storey: {
		id: string;
		name: string;
		block: {
			id: string;
			name: string;
			project: { id: string; code: string; name: string };
		};
	};
}

const db = {
	member: { findUnique: vi.fn() },
	unit: { findUnique: vi.fn() },
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

const members: Array<MemberRecord> = [
	{
		id: "alex",
		name: "Alex Tan",
		subcontractor: { id: "acme", name: "Acme Joinery" },
	},
	{
		id: "bo",
		name: "Bo Lim",
		subcontractor: { id: "beacon", name: "Beacon Joinery" },
	},
];

const gardens = { id: "gardens", code: "EG2", name: "Gardens" };
const units: Array<UnitRecord> = [
	{
		id: "u1",
		name: "01",
		storey: {
			id: "a1",
			name: "01",
			block: { id: "a", name: "A", project: gardens },
		},
	},
	{
		id: "u2",
		name: "02",
		storey: {
			id: "a1",
			name: "01",
			block: { id: "a", name: "A", project: gardens },
		},
	},
	{
		id: "u4",
		name: "01",
		storey: {
			id: "b1",
			name: "01",
			block: { id: "b", name: "B", project: gardens },
		},
	},
];

const catalogue: Record<string, { name: string; nameKey: string }> = {
	cabinet: { name: "Kitchen cabinet", nameKey: "kitchen cabinet" },
	sink: { name: "Sink", nameKey: "sink" },
	wardrobe: { name: "Wardrobe", nameKey: "wardrobe" },
};
const directory: Record<string, { id: string; name: string }> = {
	acme: { id: "acme", name: "Acme Joinery" },
	beacon: { id: "beacon", name: "Beacon Joinery" },
};
const ASSIGNED_AT = new Date("2026-09-01T00:00:00Z");

let items: Array<ItemRow>;
let entries: Array<EntryRow>;
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
		enteredByKind: "member",
		enteredById: "alex",
		enteredByName: "Alex Tan",
		subcontractorName: "Acme Joinery",
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
	subcontractorId?: string;
}
const matches = (item: ItemRow, where: ItemWhere): boolean =>
	(where.id === undefined || item.id === where.id) &&
	(where.unitId === undefined || item.unitId === where.unitId) &&
	(where.subcontractorId === undefined ||
		item.subcontractorId === where.subcontractorId);

const secret = new TextEncoder().encode(process.env["MEMBER_TOKEN_SECRET"]);
const mint = (subject: string): Promise<string> =>
	new SignJWT({})
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(subject)
		.setIssuer("daedalus")
		.setAudience("field")
		.setIssuedAt()
		.setExpirationTime("30d")
		.sign(secret);

let app: import("express").Application;
let administratorToken: string;
let acmeToken: string;
let beaconToken: string;

beforeAll(async () => {
	const key = await createSigningKey();
	stubJwks(key);
	administratorToken = await sign(key);
	acmeToken = await mint("alex");
	beaconToken = await mint("bo");
	const { createApp } = await import("@/app.js");
	app = createApp();
});

afterAll(() => vi.unstubAllGlobals());

beforeEach(() => {
	vi.clearAllMocks();
	clock = 0;
	writes = [];
	entries = [];
	// In u1 Acme holds the Sink (two entries), Beacon the Wardrobe, and the
	// Kitchen cabinet has no Assignment. u2 holds nothing. In u4 only Beacon
	// holds an Item.
	items = [
		{
			id: "u1-sink",
			unitId: "u1",
			catalogueItemId: "sink",
			subcontractorId: "acme",
			assignedAt: ASSIGNED_AT,
			progression: 60,
		},
		{
			id: "u1-wardrobe",
			unitId: "u1",
			catalogueItemId: "wardrobe",
			subcontractorId: "beacon",
			assignedAt: ASSIGNED_AT,
			progression: 100,
		},
		{
			id: "u1-cabinet",
			unitId: "u1",
			catalogueItemId: "cabinet",
			subcontractorId: null,
			assignedAt: null,
			progression: 0,
		},
		{
			id: "u4-wardrobe",
			unitId: "u4",
			catalogueItemId: "wardrobe",
			subcontractorId: "beacon",
			assignedAt: ASSIGNED_AT,
			progression: 50,
		},
	];
	seedEntry("u1-sink", 20, {
		note: "Carcass in",
		enteredByKind: "administrator",
		enteredById: "00000000-0000-4000-8000-000000000001",
		enteredByName: "administrator@example.com",
		subcontractorName: null,
	});
	seedEntry("u1-sink", 60);
	seedEntry("u1-wardrobe", 100, {
		enteredById: "bo",
		enteredByName: "Bo Lim",
		subcontractorName: "Beacon Joinery",
	});

	db.member.findUnique.mockImplementation(
		async ({ where }: { where: { id?: string } }) =>
			members.find((candidate) => candidate.id === where.id) ?? null
	);
	db.unit.findUnique.mockImplementation(
		async ({ where }: { where: { id: string } }) =>
			units.find((unit) => unit.id === where.id) ?? null
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

const readUnit = (unitId: string, token = acmeToken): request.Test =>
	request(app)
		.get(`/api/v1/field/units/${unitId}/items`)
		.set("Authorization", `Bearer ${token}`);
const enter = (itemId: string, body: object, token = acmeToken): request.Test =>
	request(app)
		.post(`/api/v1/field/items/${itemId}/entries`)
		.set("Authorization", `Bearer ${token}`)
		.send(body);
const history = (itemId: string, token = acmeToken): request.Test =>
	request(app)
		.get(`/api/v1/field/items/${itemId}/entries`)
		.set("Authorization", `Bearer ${token}`);
const progressionOf = (itemId: string): number =>
	items.find((item) => item.id === itemId)!.progression;

const u1Heading = {
	project: gardens,
	block: { id: "a", name: "A" },
	storey: { id: "a1", name: "01" },
	unit: { id: "u1", name: "01" },
};
const sinkAt = (
	progression: number,
	latestEntry: {
		value: number;
		note: string | null;
		enteredByName: string;
		createdAt: string;
	}
): object => ({
	id: "u1-sink",
	catalogueItemId: "sink",
	name: "Sink",
	subcontractor: { id: "acme", name: "Acme Joinery" },
	assignedAt: "2026-09-01T00:00:00.000Z",
	progression,
	latestEntry,
});
const unitNotFound = {
	error: { code: "NOT_FOUND", message: "Unit not found" },
};
const itemNotFound = {
	error: { code: "NOT_FOUND", message: "Item not found" },
};

describe("GET /api/v1/field/units/:unitId/items", () => {
	it("returns the heading and only the Subcontractor's Items in the Unit, each with its latest entry", async () => {
		const response = await readUnit("u1");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: {
				...u1Heading,
				items: [
					sinkAt(60, {
						value: 60,
						note: null,
						enteredByName: "Alex Tan",
						createdAt: "2026-09-10T12:02:00.000Z",
					}),
				],
			},
		});
		expect(db.item.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { unitId: "u1", subcontractorId: "acme" },
			})
		);
	});

	it("shows another Subcontractor's Member the same Unit through its own Items, whatever the request names", async () => {
		const response = await request(app)
			.get("/api/v1/field/units/u1/items?subcontractorId=acme")
			.set("Authorization", `Bearer ${beaconToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.items).toEqual([
			{
				id: "u1-wardrobe",
				catalogueItemId: "wardrobe",
				name: "Wardrobe",
				subcontractor: { id: "beacon", name: "Beacon Joinery" },
				assignedAt: "2026-09-01T00:00:00.000Z",
				progression: 100,
				latestEntry: {
					value: 100,
					note: null,
					enteredByName: "Bo Lim",
					createdAt: "2026-09-10T12:03:00.000Z",
				},
			},
		]);
	});

	it("is the same 404 for a Unit holding nothing, a Unit where only others hold Items, and an unknown Unit", async () => {
		for (const unitId of ["u2", "u4", "nowhere"]) {
			const response = await readUnit(unitId);
			expect(response.status).toBe(404);
			expect(response.body).toEqual(unitNotFound);
		}
	});

	it("returns 401 without a Member token and for an Administrator's Supabase token", async () => {
		expect(
			(await request(app).get("/api/v1/field/units/u1/items")).status
		).toBe(401);
		expect((await readUnit("u1", administratorToken)).status).toBe(401);
		expect(db.unit.findUnique).not.toHaveBeenCalled();
		expect(db.item.findMany).not.toHaveBeenCalled();
	});
});

describe("POST /api/v1/field/items/:itemId/entries", () => {
	it("enters progress as the Member: the entry insert and the Progression update run in one transaction, and the Unit's Items come back", async () => {
		const response = await enter("u1-sink", {
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
				itemId: "u1-sink",
				value: 75,
				note: "Doors hung",
				enteredByKind: "member",
				enteredById: "alex",
				enteredByName: "Alex Tan",
				subcontractorName: "Acme Joinery",
			},
		});
		expect(db.item.update).toHaveBeenCalledWith({
			where: { id: "u1-sink" },
			data: { progression: 75 },
		});
		expect(progressionOf("u1-sink")).toBe(75);
		expect(response.body).toEqual({
			data: {
				...u1Heading,
				items: [
					sinkAt(75, {
						value: 75,
						note: "Doors hung",
						enteredByName: "Alex Tan",
						createdAt: "2026-09-10T12:04:00.000Z",
					}),
				],
			},
		});
	});

	it("accepts a later entry lower than the last, without a note, and takes the author from the token whatever the body names", async () => {
		const response = await enter("u1-sink", {
			value: 30,
			subcontractorId: "beacon",
			enteredByName: "Somebody else",
		});

		expect(response.status).toBe(201);
		expect(progressionOf("u1-sink")).toBe(30);
		expect(db.progressEntry.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				value: 30,
				note: null,
				enteredByKind: "member",
				enteredById: "alex",
				enteredByName: "Alex Tan",
				subcontractorName: "Acme Joinery",
			}),
		});
		expect(response.body.data.items[0]).toMatchObject({
			progression: 30,
			latestEntry: { value: 30, note: null, enteredByName: "Alex Tan" },
		});
	});

	it("is the same 404, writing nothing, for another Subcontractor's Item, an Item with no Assignment and an unknown Item", async () => {
		for (const itemId of ["u1-wardrobe", "u1-cabinet", "missing"]) {
			const response = await enter(itemId, { value: 50 });
			expect(response.status).toBe(404);
			expect(response.body).toEqual(itemNotFound);
		}
		expect(db.progressEntry.create).not.toHaveBeenCalled();
		expect(db.item.update).not.toHaveBeenCalled();
		expect(progressionOf("u1-wardrobe")).toBe(100);
		expect(progressionOf("u1-cabinet")).toBe(0);
	});

	it.each([
		{},
		{ value: 50.5 },
		{ value: -1 },
		{ value: 101 },
		{ value: "50" },
		{ value: 50, note: "x".repeat(201) },
		{ value: 50, note: "" },
	])(
		"rejects a malformed entry with 400 and no transaction: %j",
		async (body) => {
			const response = await enter("u1-sink", body);
			expect(response.status).toBe(400);
			expect(transaction).not.toHaveBeenCalled();
			expect(progressionOf("u1-sink")).toBe(60);
		}
	);

	it("returns 401 without a Member token and for an Administrator's Supabase token", async () => {
		expect(
			(
				await request(app)
					.post("/api/v1/field/items/u1-sink/entries")
					.send({ value: 50 })
			).status
		).toBe(401);
		expect(
			(await enter("u1-sink", { value: 50 }, administratorToken)).status
		).toBe(401);
		expect(transaction).not.toHaveBeenCalled();
	});
});

describe("GET /api/v1/field/items/:itemId/entries", () => {
	it("lists the Item's history newest first with every field", async () => {
		const response = await history("u1-sink");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [
				{
					id: "e2",
					value: 60,
					note: null,
					enteredByKind: "member",
					enteredByName: "Alex Tan",
					subcontractorName: "Acme Joinery",
					createdAt: "2026-09-10T12:02:00.000Z",
				},
				{
					id: "e1",
					value: 20,
					note: "Carcass in",
					enteredByKind: "administrator",
					enteredByName: "administrator@example.com",
					subcontractorName: null,
					createdAt: "2026-09-10T12:01:00.000Z",
				},
			],
		});
		expect(db.progressEntry.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { itemId: "u1-sink" },
				orderBy: [{ createdAt: "desc" }, { id: "desc" }],
			})
		);
	});

	it("is the same 404 for another Subcontractor's Item, an Item with no Assignment and an unknown Item", async () => {
		for (const itemId of ["u1-wardrobe", "u1-cabinet", "missing"]) {
			const response = await history(itemId);
			expect(response.status).toBe(404);
			expect(response.body).toEqual(itemNotFound);
		}
		expect(db.progressEntry.findMany).not.toHaveBeenCalled();
	});

	it("returns 401 without a Member token", async () => {
		const response = await request(app).get(
			"/api/v1/field/items/u1-sink/entries"
		);
		expect(response.status).toBe(401);
		expect(db.item.findFirst).not.toHaveBeenCalled();
	});
});

describe("OpenAPI", () => {
	it("documents all three routes under the Field tag with the Member bearer scheme", async () => {
		const response = await request(app).get("/openapi.json");
		const { paths, components } = response.body;

		const unit = paths["/api/v1/field/units/{unitId}/items"].get;
		expect(unit.tags).toEqual(["Field"]);
		expect(unit.security).toEqual([{ memberBearerAuth: [] }]);
		expect(Object.keys(unit.responses)).toEqual(
			expect.arrayContaining(["200", "401", "404"])
		);

		const entriesPath = paths["/api/v1/field/items/{itemId}/entries"];
		expect(entriesPath.post.tags).toEqual(["Field"]);
		expect(entriesPath.post.security).toEqual([{ memberBearerAuth: [] }]);
		expect(Object.keys(entriesPath.post.responses)).toEqual(
			expect.arrayContaining(["201", "400", "401", "404"])
		);
		expect(entriesPath.post.responses).not.toHaveProperty("409");
		expect(entriesPath.get.tags).toEqual(["Field"]);
		expect(entriesPath.get.security).toEqual([{ memberBearerAuth: [] }]);
		expect(Object.keys(entriesPath.get.responses)).toEqual(
			expect.arrayContaining(["200", "401", "404"])
		);

		const schema = components.schemas.FieldUnitItems;
		for (const property of ["project", "block", "storey", "unit", "items"])
			expect(schema.properties).toHaveProperty(property);
	});
});
